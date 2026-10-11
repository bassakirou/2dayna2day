<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
require __DIR__ . '/../../backend/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/user.php';
require_once ABSPATH . 'wp-admin/includes/template.php';
require_once ABSPATH . 'wp-content/plugins/2dayna2day-commerce/inc/service/TaraMoneyService.php';
add_filter('pre_wp_mail', '__return_true');
$saved = get_option(TwoDay_Order_Workflow::OPTION, false);
$saved_city = get_option('2day_workflow_store_city', false);
$orders = []; $uid = 0; $checks = 0; $provider = 'taramoney'; $confirm = false; $current = null;
function logistics_check($ok, $message) { global $checks; if (!$ok) throw new RuntimeException($message); $checks++; }
add_filter('pre_option_woocommerce_2day_taramoney_settings', function () use (&$provider) { return ['enabled' => $provider === 'taramoney' ? 'yes' : 'no', 'api_key' => 'fixture-key', 'business_id' => 'fixture-business', 'base_url' => 'https://www.dklo.co/api/tara', 'webhook_url' => 'https://example.invalid/webhook']; });
add_filter('pre_option_woocommerce_2day_campay_settings', function () use (&$provider) { return ['enabled' => $provider === 'campay' ? 'yes' : 'no', 'username' => 'logistics-fixture', 'password' => 'fixture-pass', 'environment' => 'demo']; });
add_filter('pre_http_request', function ($pre, $args, $url) use (&$current, &$confirm) {
    if (str_ends_with($url, '/token/')) $body = ['token' => 'fixture-token'];
    elseif (str_ends_with($url, '/mobilepay')) $body = ['status' => 'SUCCESS'];
    elseif (str_ends_with($url, '/collect/')) $body = ['reference' => 'fixture-' . $current->get_id() . '-' . $current->get_meta('_2day_payment_phase')];
    elseif (str_ends_with($url, '/transactions/status')) $body = ['status' => $confirm ? 'SUCCESS' : 'PENDING', 'paymentId' => $current->get_meta('_2day_taramoney_product_id'), 'amount' => $current->get_meta('_2day_taramoney_expected_amount')];
    elseif (str_contains($url, '/transaction/')) $body = ['status' => $confirm ? 'SUCCESSFUL' : 'PENDING', 'reference' => $current->get_meta('_2day_campay_reference'), 'external_reference' => $current->get_meta('_2day_campay_external'), 'amount' => $current->get_meta('_2day_campay_expected'), 'currency' => 'XAF', 'endpoint' => 'collect'];
    else return new WP_Error('blocked_http', 'External request blocked by test');
    return ['response' => ['code' => 200], 'headers' => [], 'body' => wp_json_encode($body)];
}, 10, 3);
try {
    $tag = 'logistics-' . wp_generate_password(8, false);
    $uid = wp_create_user($tag, wp_generate_password(24), $tag . '@example.invalid');
    $user = new WP_User($uid); $user->set_role('shop_manager'); wp_set_current_user($uid);
    $definitions = TwoDay_Order_Workflow::definitions();
    $_POST = ['save_workflow' => '1', 'store_city' => 'Douala', 'new_label' => 'Remise au transporteur', 'new_description' => 'Votre colis est confié au transporteur à {Ville}.', 'new_position' => '55', 'workflow' => []];
    foreach ($definitions as $row) $_POST['workflow'][$row['id']] = $row;
    $_POST['workflow']['paid-full']['description'] = 'Tous les fonds sont confirmés.';
    $_REQUEST['_wpnonce'] = wp_create_nonce('2day_order_workflow');
    ob_start(); TwoDay_Order_Workflow::settings(); $html = ob_get_clean(); $_POST = $_REQUEST = [];
    logistics_check(str_contains($html, 'Description') && str_contains($html, 'Ajouter une étape'), 'Admin descriptions and add-step form');
    $custom = array_filter(TwoDay_Order_Workflow::definitions(), function ($row) { return $row['label'] === 'Remise au transporteur'; });
    logistics_check(count($custom) === 1, 'New custom step saved and returned by Woo statuses');
    $custom_id = array_values($custom)[0]['id']; register_post_status('wc-' . $custom_id, ['public' => true]);
    foreach (['taramoney', 'campay'] as $provider) foreach (['full', 'split'] as $plan) {
        $current = wc_create_order(['customer_id' => $uid]); $orders[] = $current->get_id();
        $current->set_total(10000); $current->set_currency('XAF'); $current->set_payment_method('2day_' . $provider);
        $current->set_billing_email($tag . '@example.invalid');
        $current->update_meta_data('_2day_payment_plan', $plan); $current->update_meta_data('_2day_partial_percent', 40); $current->update_meta_data('_2day_store_city', 'Yaoundé'); $current->save();
        $init = function () use (&$current, &$provider) {
            if ($provider === 'campay') TwoDay_CamPay::initiate($current, '699123456');
            else (new TwoDaynaTwoDay_TaraMoney_Service('2day_taramoney'))->initiate_mobile_payment($current, '699123456', 'orange');
        };
        $reconcile = function () use (&$current, &$provider) {
            if ($provider === 'campay') TwoDay_CamPay::reconcile($current, true); else TwoDaynaTwoDay_TaraMoney::reconcile_order($current, true);
        };
        logistics_check(is_wp_error(TwoDay_Order_Workflow_Admin::change($current->get_id(), 'paid-full', 'pending')), 'Cannot manually confirm unpaid full payment');
        $confirm = false; $init(); $reconcile();
        logistics_check($current->get_status() === 'pending' && !TwoDay_Order_Workflow::full_payment_verified($current), 'Pending provider response never confirms funds');
        $confirm = true; $reconcile();
        if ($plan === 'split') {
            logistics_check($current->get_status() === 'partial-paid' && !TwoDay_Order_Workflow::full_payment_verified($current), 'Deposit only reaches partial-paid');
            logistics_check(TwoDay_Order_Workflow::tracking($current)['nextStep']['id'] === 'paid-full', 'Deposit next step is full payment');
            $init(); $reconcile();
        }
        logistics_check($current->get_status() === 'paid-full' && $current->is_paid(), 'Verified full payment reaches paid-full');
        $tracking = TwoDay_Order_Workflow::tracking($current);
        logistics_check($tracking['description'] === 'Tous les fonds sont confirmés.' && $tracking['nextStep']['label'] === 'En attente de sortie de magasin Yaoundé', 'Descriptions and order-specific city');
        logistics_check(!in_array('unrecorded', array_column($tracking['steps'], 'state'), true) && !in_array('on-hold', array_column($tracking['steps'], 'id'), true), 'Skipped statuses absent');
        if ($plan === 'full') logistics_check(!in_array('partial-paid', array_column($tracking['steps'], 'id'), true), 'Full payment skips partial branch');
        $result = TwoDay_Order_Workflow_Admin::change($current->get_id(), 'store-wait', 'paid-full');
        logistics_check(!is_wp_error($result) && $result['label'] === 'En attente de sortie de magasin Yaoundé', 'Inline status update uses Woo order and city');
        logistics_check(is_wp_error(TwoDay_Order_Workflow_Admin::change($current->get_id(), 'store-out', 'paid-full')), 'Stale inline update rejected');
        $result = TwoDay_Order_Workflow_Admin::change($current->get_id(), $custom_id, 'store-wait');
        logistics_check(!is_wp_error($result) && wc_get_order($current->get_id())->is_paid(), 'Custom logistics stage preserves paid state');
    }
    $user->set_role('subscriber'); wp_set_current_user(0); wp_set_current_user($uid);
    logistics_check(is_wp_error(TwoDay_Order_Workflow_Admin::change($current->get_id(), 'processing', $custom_id)), 'Customer cannot change order status');
    echo "$checks logistics integration checks passed. Both providers mocked, no real payment or email.\n";
} finally {
    $_POST = $_REQUEST = [];
    foreach ($orders as $id) { $order = wc_get_order($id); if ($order) $order->delete(true); }
    if (is_int($uid) && $uid > 0) wp_delete_user($uid);
    if ($saved === false) delete_option(TwoDay_Order_Workflow::OPTION); else update_option(TwoDay_Order_Workflow::OPTION, $saved);
    if ($saved_city === false) delete_option('2day_workflow_store_city'); else update_option('2day_workflow_store_city', $saved_city);
    delete_transient('2day_campay_token_' . md5('https://demo.campay.net/api' . 'logistics-fixture' . 'fixture-pass'));
    wp_set_current_user(0);
}
