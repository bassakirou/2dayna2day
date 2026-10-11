<?php
require __DIR__ . '/../../backend/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/user.php';
add_filter('pre_wp_mail', '__return_true');
$keys = ['woocommerce_2day_taramoney_settings', 'woocommerce_2day_campay_settings'];
$saved = []; foreach ($keys as $key) $saved[$key] = get_option($key, false);
$calls = []; $orders = []; $uid = 0; $checks = 0; $product = null;
function mobile_check($ok, $message) { global $checks; if (!$ok) throw new RuntimeException($message); $checks++; }
add_filter('pre_http_request', function ($pre, $args, $url) use (&$calls) {
    $calls[] = ['url' => $url, 'body' => json_decode($args['body'] ?? '{}', true)];
    if (str_ends_with($url, '/token/')) $body = ['token' => 'fixture-token'];
    elseif (str_ends_with($url, '/collect/')) $body = ['reference' => 'fixture-ref', 'ussd_code' => '*126#'];
    elseif (str_ends_with($url, '/mobilepay')) $body = ['status' => 'SUCCESS', 'message' => 'API_ORDER_SUCESSFULL'];
    elseif (str_contains($url, '/transaction/')) $body = ['status' => 'PENDING'];
    else return new WP_Error('unexpected_http', 'External HTTP blocked by test');
    return ['response' => ['code' => 200], 'body' => wp_json_encode($body), 'headers' => []];
}, 10, 3);
try {
    $tag = 'mobile-test-' . wp_generate_password(8, false);
    $uid = wp_create_user($tag, wp_generate_password(24), $tag . '@example.invalid');
    wp_set_current_user($uid);
    update_option($keys[0], ['enabled' => 'yes', 'api_key' => 'test-key', 'business_id' => 'test-business', 'base_url' => 'https://www.dklo.co/api/tara', 'webhook_url' => 'https://example.invalid/webhook', 'discount_percent' => '7', 'enable_partial_payment' => 'yes', 'partial_payment_percent' => '40']);
    update_option($keys[1], ['enabled' => 'no', 'username' => 'test-user', 'password' => 'test-password', 'webhook_secret' => 'test-secret', 'environment' => 'demo', 'discount_percent' => '3', 'enable_partial_payment' => 'yes', 'partial_payment_percent' => '35']);
    $gateways = WC()->payment_gateways()->payment_gateways();
    $campay = new TwoDay_CamPay_Gateway();
    foreach (['username', 'password', 'webhook_secret', 'discount_percent', 'enable_partial_payment', 'partial_payment_percent'] as $key) mobile_check(isset($campay->form_fields[$key]), 'CamPay manage field: ' . $key);
    // Same WooCommerce update_option call used by the Payments activation toggle.
    $campay->update_option('enabled', 'yes');
    mobile_check(TwoDay_Mobile_Payments::active() === 'campay' && get_option($keys[0])['enabled'] === 'no', 'Activating CamPay disables Tara');
    $config = TwoDaynaTwoDay_TaraMoney::handle_get_settings()->get_data();
    mobile_check($config['provider'] === 'campay' && $config['discountPercent'] === 3 && $config['partialPaymentPercent'] === 35, 'CamPay own commercial settings');
    $new_order = function () use (&$orders, $uid) {
        $order = wc_create_order(['customer_id' => $uid]); $orders[] = $order->get_id();
        $order->set_total(10000); $order->set_currency('XAF'); $order->update_meta_data('_2day_payment_plan', 'split');
        $order->update_meta_data('_2day_partial_percent', TwoDay_Mobile_Payments::settings()['partial_payment_percent'] ?? 60);
        $order->save(); return $order;
    };
    $pay = function ($order) {
        return graphql(['query' => 'mutation($input: TwoDayCreateTaraMoneyPaymentLinkInput!) { twoDayCreateTaraMoneyPaymentLink(input: $input) { orderId paymentStatus } }', 'variables' => ['input' => ['orderId' => (string) $order->get_id(), 'orderKey' => $order->get_order_key(), 'phoneNumber' => '699123456', 'network' => 'orange']]]);
    };
    $order = $new_order(); $result = $pay($order);
    mobile_check(empty($result['errors']), 'CamPay GraphQL initiation');
    mobile_check(str_ends_with(end($calls)['url'], '/collect/') && end($calls)['body']['amount'] === '3500', 'Only CamPay receives deposit');
    $tara = new TwoDaynaTwoDay_TaraMoney_Gateway(); $tara->update_option('enabled', 'yes');
    mobile_check(TwoDay_Mobile_Payments::active() === 'taramoney' && get_option($keys[1])['enabled'] === 'no', 'Activating Tara disables CamPay');
    $config = TwoDaynaTwoDay_TaraMoney::handle_get_settings()->get_data();
    mobile_check($config['provider'] === 'taramoney' && $config['discountPercent'] === 7 && $config['partialPaymentPercent'] === 40, 'Tara own commercial settings');
    $before = count($calls); $result = $pay($order);
    mobile_check(!empty($result['errors']) && count($calls) === $before + 1 && str_contains(end($calls)['url'], '/transaction/'), 'Existing CamPay pending transaction is checked, never recharged through Tara');
    mobile_check(wc_get_order($order->get_id())->get_payment_method() === '2day_campay', 'Rejected switch preserves original provider for polling');
    $before = count($calls); $order = $new_order(); $order->set_payment_method('2day_campay'); $order->save();
    $result = $pay($order);
    mobile_check(empty($result['errors']), 'Tara GraphQL initiation after switch');
    mobile_check(count($calls) === $before + 1 && str_ends_with(end($calls)['url'], '/mobilepay') && end($calls)['body']['productPrice'] === 4000, 'Only Tara receives new payment after switch, despite old order method');
    mobile_check(wc_get_order($order->get_id())->get_payment_method() === '2day_taramoney', 'Status polling attached to actual provider');
    $tara->update_option('enabled', 'no');
    mobile_check(TwoDay_Mobile_Payments::active() === '', 'Both disabled supported');
    $before = count($calls); $result = $pay($new_order());
    mobile_check(!empty($result['errors']) && count($calls) === $before, 'Both disabled blocks initiation without HTTP');
    // Save from CamPay Manage form, not just the activation toggle.
    $_POST = ['woocommerce_2day_campay_enabled' => '1', 'woocommerce_2day_campay_environment' => 'demo', 'woocommerce_2day_campay_username' => 'test-user', 'woocommerce_2day_campay_password' => '', 'woocommerce_2day_campay_webhook_secret' => '', 'woocommerce_2day_campay_discount_percent' => '9', 'woocommerce_2day_campay_enable_partial_payment' => '1', 'woocommerce_2day_campay_partial_payment_percent' => '45'];
    $campay = new TwoDay_CamPay_Gateway(); $campay->process_admin_options(); $_POST = [];
    $config = TwoDaynaTwoDay_TaraMoney::handle_get_settings()->get_data();
    mobile_check($config['provider'] === 'campay' && $config['discountPercent'] === 9 && $config['partialPaymentPercent'] === 45 && get_option($keys[1])['password'] === 'test-password', 'Manage saves business settings and retains blank secrets');
    $product = new WC_Product_Simple(); $product->set_name('Mobile provider fixture'); $product->set_regular_price('10000'); $product->set_tax_status('none'); $product->save();
    $draft = graphql(['query' => 'mutation($input: TwoDayCreateOrderDraftInput!) { twoDayCreateOrderDraft(input: $input) { orderId total } }', 'variables' => ['input' => ['lines' => [['productId' => (string) $product->get_id(), 'quantity' => 1]], 'billing' => ['firstName' => 'Test', 'lastName' => 'Mobile', 'country' => 'CM', 'city' => 'Douala', 'email' => $tag . '@example.invalid'], 'paymentMethod' => '2day_taramoney', 'paymentPlan' => 'full']]]);
    mobile_check(empty($draft['errors']), 'Create draft from real Woo product');
    $draft_order = wc_get_order($draft['data']['twoDayCreateOrderDraft']['orderId']); $orders[] = $draft_order->get_id();
    mobile_check((float) $draft_order->get_total() === 9100.0 && $draft_order->get_payment_method() === '2day_campay', 'Draft uses active provider and its full-payment discount despite stale frontend selection');
    echo "$checks integration checks passed: Woo toggles, Manage form, GraphQL dispatch, correct provider/amount, disabled rejection. No real payment.\n";
} finally {
    foreach ($orders as $id) { $order = wc_get_order($id); if ($order) $order->delete(true); }
    if ($product) $product->delete(true);
    if (is_int($uid) && $uid > 0) wp_delete_user($uid);
    foreach ($keys as $key) { $value = (array) get_option($key, []); $value['enabled'] = 'no'; update_option($key, $value); }
    foreach ($saved as $key => $value) { if ($value === false) delete_option($key); else update_option($key, $value); }
    delete_transient('2day_campay_token_' . md5('https://demo.campay.net/api' . 'test-user' . 'test-password'));
    wp_set_current_user(0);
}
