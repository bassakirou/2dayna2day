<?php
require __DIR__ . '/../../backend/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/user.php';
$emails = [];
add_filter('pre_wp_mail', function ($result, $mail) use (&$emails) { $emails[] = $mail; return true; }, 10, 2);
$settings = [
    'paid-full' => ['kind' => 'hidden'],
    'store-wait' => ['kind' => 'hidden'],
    'store-out' => ['kind' => 'hidden'],
    'pending' => ['position' => 10, 'label' => 'Paiement à confirmer', 'kind' => 'active'],
    'processing' => ['position' => 20, 'label' => 'Préparation atelier', 'kind' => 'active'],
    'quality-check' => ['position' => 30, 'label' => 'Contrôle qualité', 'kind' => 'active'],
    'completed' => ['position' => 40, 'label' => 'Commande remise', 'kind' => 'completed'],
    'on-hold' => ['position' => 0, 'label' => 'Vérification', 'kind' => 'hidden'],
    'partial-paid' => ['position' => 0, 'label' => 'Acompte', 'kind' => 'hidden'],
];
add_filter('pre_option_2day_order_workflow', function () use (&$settings) { return $settings; });
register_post_status('wc-quality-check', ['label' => 'Quality check', 'public' => true]);
add_filter('wc_order_statuses', function ($statuses) { $statuses['wc-quality-check'] = 'Quality check'; return $statuses; }, 20);
$uid = 0; $order = null; $checks = 0;
function workflow_check($condition, $message) { global $checks; if (!$condition) throw new RuntimeException($message); $checks++; }
try {
    $tag = 'workflow-' . wp_generate_password(8, false);
    $uid = wp_create_user($tag, wp_generate_password(24), $tag . '@example.invalid');
    workflow_check(!is_wp_error($uid), 'Create fixture');
    $order = wc_create_order(['customer_id' => $uid]);
    $order->set_billing_email($tag . '@example.invalid'); $order->save();
    wp_set_current_user($uid); do_action('rest_api_init');
    $read = function () use ($order) {
        $response = rest_get_server()->dispatch(new WP_REST_Request('GET', '/2day/v1/orders'));
        workflow_check($response->get_status() === 200, 'Authenticated order API');
        foreach ($response->get_data()['items'] as $item) if ($item['id'] === (string) $order->get_id()) return $item;
        throw new RuntimeException('Order missing');
    };
    $data = $read();
    workflow_check(array_column($data['tracking']['steps'], 'id') === ['pending', 'processing', 'quality-check', 'completed'], 'Configured order and hidden statuses');
    workflow_check($data['tracking']['nextStep']['label'] === 'Préparation atelier', 'Configured next label');
    $order->update_status('quality-check');
    $data = $read(); $tracking = $data['tracking'];
    workflow_check($tracking['statusLabel'] === 'Contrôle qualité' && $tracking['currentIndex'] === 1, 'Woo status reflected by API');
    workflow_check(!in_array('processing', array_column($tracking['steps'], 'id'), true), 'Skipped stage never claimed completed');
    workflow_check($tracking['steps'][1]['state'] === 'current' && $tracking['steps'][1]['date'] > 0, 'Actual transition timestamp');
    workflow_check(end($data['history'])['label'] === 'Contrôle qualité', 'History uses backend label');
    workflow_check(count(array_filter($emails, function ($mail) { return strpos($mail['subject'], 'Suivi de votre commande') !== false && strpos($mail['message'], 'Contrôle qualité') !== false; })) > 0, 'Tracking email reflects Woo label');
    $notifications = json_decode(get_user_meta($uid, '_2day_notifications', true), true);
    workflow_check(strpos(wp_json_encode($notifications, JSON_UNESCAPED_UNICODE), 'Contrôle qualité') !== false, 'Notification reflects Woo label');
    $settings['quality-check']['label'] = 'Inspection finale'; $settings['quality-check']['position'] = 15;
    $data = $read();
    workflow_check($data['tracking']['steps'][1]['label'] === 'Inspection finale' && $data['tracking']['nextStep']['id'] === 'processing', 'Rename and reorder require no frontend rebuild');
    $order->update_status('processing'); $data = $read();
    workflow_check($data['tracking']['steps'][1]['state'] === 'visited' && $data['tracking']['steps'][2]['state'] === 'current', 'Return to another stage follows actual status');
    $order->update_status('cancelled'); $data = $read();
    workflow_check($data['tracking']['kind'] === 'stopped' && $data['tracking']['nextStep'] === null, 'Cancellation has no invented next step');
    $order->update_status('completed'); $data = $read();
    workflow_check($data['tracking']['kind'] === 'completed' && $data['tracking']['nextStep'] === null, 'Completion follows configured role');
    $order->update_status('on-hold'); $data = $read();
    workflow_check($data['tracking']['statusLabel'] === 'Vérification' && $data['tracking']['currentIndex'] === null && $data['tracking']['nextStep'] === null, 'Off-path status remains visible without invented position');
    echo "$checks workflow integration checks passed. Emails intercepted; fixtures cleaned.\n";
} finally {
    if ($order) $order->delete(true);
    if (is_int($uid) && $uid > 0) wp_delete_user($uid);
    wp_set_current_user(0);
}
