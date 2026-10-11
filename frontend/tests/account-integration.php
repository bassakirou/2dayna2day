<?php
require __DIR__ . '/../../backend/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/user.php';
add_filter('pre_wp_mail', '__return_true');
$ids = []; $order_ids = []; $comment_ids = []; $coupon_codes = []; $product_id = 0;
function account_check($condition, $message) { if (!$condition) throw new RuntimeException($message); }
try {
    $tag = 'account-test-' . wp_generate_password(8, false);
    $a = wp_create_user($tag, wp_generate_password(24), $tag . '@example.invalid');
    $b = wp_create_user($tag . '-other', wp_generate_password(24), $tag . '-other@example.invalid');
    account_check(!is_wp_error($a) && !is_wp_error($b), 'Fixture users'); $ids = [$a, $b];
    $rule = ['id' => $tag, 'name' => 'Test fidélité', 'orders' => 1, 'percent' => 5, 'scope' => 'next', 'days' => 2];
    add_filter('pre_option_2day_reward_rules', function () use ($rule) { return [$rule]; });
    $product = new WC_Product_Simple(); $product->set_name('Account test fixture'); $product->set_regular_price('10000'); $product_id = $product->save();
    $order = wc_create_order(['customer_id' => $a]); $order_ids[] = $order->get_id();
    $order->add_product($product, 2); $order->set_billing_email(get_userdata($a)->user_email); $order->calculate_totals(); $order->save();
    $order->payment_complete('fixture-payment');
    $rewards = TwoDay_Account::rewards($a); account_check(!is_wp_error($rewards) && $rewards['badges'][0]['earned'], 'Reward on paid order');
    $coupon_codes[] = $rewards['badges'][0]['coupon'];
    $coupon = new WC_Coupon($coupon_codes[0]); account_check($coupon->get_amount() == 5 && $coupon->get_usage_limit() === 1, 'Real Woo coupon');
    $next = wc_create_order(['customer_id' => $a]); $order_ids[] = $next->get_id();
    $next->add_product($product, 1); $next->set_billing_email(get_userdata($a)->user_email); $next->calculate_totals(); $next->save();
    account_check(!is_wp_error($next->apply_coupon($coupon_codes[0])) && (float) $next->get_total() === 9500.0, 'Real coupon discount on next order');
    $next->payment_complete('fixture-next-payment');
    $after = TwoDay_Account::rewards($a); account_check(!$after['badges'][0]['usable'], 'Single-use coupon consumed after payment');
    wp_set_current_user($a); do_action('rest_api_init'); $server = rest_get_server();
    update_user_meta($a, '_2day_notifications', wp_json_encode([
        ['id' => 'first', 'type' => 'order_update', 'message' => 'Test première notification', 'read' => false, 'date' => '2026-10-08 10:00:00'],
        ['id' => 'second', 'type' => 'review_reply', 'message' => 'Test seconde notification', 'read' => false, 'date' => '2026-10-08 09:00:00'],
    ]));
    $notification_read = new WP_REST_Request('POST', '/2day/v1/notifications/read'); $notification_read->set_param('id', 'first');
    $response = $server->dispatch($notification_read); $messages = $response->get_data()['notifications'];
    account_check($response->get_status() === 200 && count(array_filter($messages, function ($n) { return !$n['read']; })) === 1, 'Individual notification read returns current backend list');
    $response = $server->dispatch(new WP_REST_Request('POST', '/2day/v1/notifications/read'));
    account_check(count($response->get_data()['notifications']) === 2 && count(array_filter($response->get_data()['notifications'], function ($n) { return !$n['read']; })) === 0, 'All-read retains messages and clears unread count');
    $request = new WP_REST_Request('PUT', '/2day/v1/account/payment-methods'); $request->set_header('Content-Type', 'application/json');
    $request->set_body(wp_json_encode(['items' => [['id' => 'fixture', 'label' => 'OM', 'provider' => 'orange_money', 'phone' => '+237699123456']]]));
    $response = $server->dispatch($request); account_check($response->get_status() === 200 && $response->get_data()['items'][0]['phone'] === '699123456', 'Payment persistence');
    wp_set_current_user($b); $response = $server->dispatch(new WP_REST_Request('GET', '/2day/v1/account/payment-methods')); account_check($response->get_data()['items'] === [], 'User isolation');
    $response = $server->dispatch(new WP_REST_Request('POST', '/2day/v1/account/orders/' . $order->get_id() . '/email')); account_check($response->get_status() === 403, 'Order email owner restriction');
    wp_set_current_user($a);
    $response = $server->dispatch(new WP_REST_Request('GET', '/2day/v1/orders')); $items = $response->get_data()['items'];
    $original = array_values(array_filter($items, function ($o) use ($order) { return $o['id'] === (string) $order->get_id(); }))[0];
    account_check($original['items'][0]['quantity'] === 2 && count($original['history']) > 0, 'Order lines and history');
    $c = wp_insert_comment(['comment_post_ID' => $product_id, 'comment_author' => 'Test', 'comment_author_email' => get_userdata($a)->user_email, 'comment_type' => 'review', 'user_id' => $a, 'comment_content' => 'Private pending fixture', 'comment_approved' => '0']); $comment_ids[] = $c;
    update_comment_meta($c, 'rating', 5);
    $response = $server->dispatch(new WP_REST_Request('GET', '/2day/v1/account/reviews')); account_check($response->get_data()['total'] === 1 && $response->get_data()['items'][0]['status'] === 'En modération', 'Pending reviews visible to owner');
    wp_set_current_user($b); $response = $server->dispatch(new WP_REST_Request('GET', '/2day/v1/account/reviews/' . $c)); account_check($response->get_status() === 403, 'Private review owner restriction');
    wp_set_current_user(0); $response = $server->dispatch(new WP_REST_Request('GET', '/2day/v1/account/rewards')); account_check($response->get_status() === 401, 'Anonymous reward access');
    echo "12 real WordPress/WooCommerce integration checks passed. Emails suppressed.\n";
} finally {
    foreach ($comment_ids as $id) wp_delete_comment($id, true);
    foreach ($coupon_codes as $code) { $coupon = new WC_Coupon($code); if ($coupon->get_id()) $coupon->delete(true); }
    foreach ($order_ids as $id) { $order = wc_get_order($id); if ($order) $order->delete(true); }
    if ($product_id) wp_delete_post($product_id, true);
    foreach ($ids as $id) wp_delete_user($id);
    wp_set_current_user(0);
}
