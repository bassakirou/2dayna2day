<?php
// Run with wp-cli eval-file. All fixture writes are rolled back; no messages are sent.
global $wpdb;
$original_user = get_current_user_id();
$admins = get_users(array('role' => 'administrator', 'number' => 1, 'fields' => 'ID'));
if (!$admins) throw new RuntimeException('Administrator fixture unavailable');
wp_set_current_user((int) $admins[0]);
$ids = array();
$wpdb->query('START TRANSACTION');
try {
    $insert = function ($type, $parent = 0, $sender = '') use ($wpdb, &$ids) {
        $wpdb->insert($wpdb->posts, array('post_author' => get_current_user_id(), 'post_type' => $type, 'post_status' => 'publish', 'post_parent' => $parent, 'post_title' => 'Temporary unread test', 'post_date' => current_time('mysql'), 'post_date_gmt' => current_time('mysql', true)));
        $id = (int) $wpdb->insert_id; $ids[] = $id;
        if ($sender !== '') $wpdb->insert($wpdb->postmeta, array('post_id' => $id, 'meta_key' => TwoDaynaTwoDay_Commerce_Negotiations::META_MESSAGE_SENDER, 'meta_value' => $sender));
        return $id;
    };
    $conv = $insert(TwoDaynaTwoDay_Commerce_Negotiations::POST_TYPE_CONVERSATION);
    $first = $insert(TwoDaynaTwoDay_Commerce_Negotiations::POST_TYPE_MESSAGE, $conv, 'user');
    $second = $insert(TwoDaynaTwoDay_Commerce_Negotiations::POST_TYPE_MESSAGE, $conv, 'user');
    $own = $insert(TwoDaynaTwoDay_Commerce_Negotiations::POST_TYPE_MESSAGE, $conv, 'seller');
    $class = TwoDaynaTwoDay_Commerce_Negotiations_REST::class;
    if ($class::unread_count($conv) !== 2) throw new RuntimeException('Own messages counted or incoming messages missing');
    $request = new WP_REST_Request('POST'); $request->set_param('id', $conv); $request->set_param('lastMessageId', $first);
    $response = $class::rest_mark_read($request);
    if ($response->get_data()['unreadCount'] !== 1) throw new RuntimeException('Unseen later message incorrectly marked');
    $request->set_param('lastMessageId', $second); $class::rest_mark_read($request);
    $request->set_param('lastMessageId', $first); $class::rest_mark_read($request);
    if ($class::unread_count($conv) !== 0) throw new RuntimeException('Receipt regressed');
    $other = $insert(TwoDaynaTwoDay_Commerce_Negotiations::POST_TYPE_CONVERSATION);
    $request->set_param('id', $other);
    if ($class::rest_mark_read($request)->get_status() !== 400) throw new RuntimeException('Cross-conversation message accepted');
    wp_set_current_user(0);
    if ($class::can_access_conversation($request) === true) throw new RuntimeException('Unauthenticated access allowed');
    echo "Chat unread verified in WordPress: incoming messages only, monotonic receipts, later messages preserved, conversation isolation and authenticated access.\n";
} finally {
    $wpdb->query('ROLLBACK');
    foreach ($ids as $id) { clean_post_cache($id); wp_cache_delete($id, 'post_meta'); }
    wp_set_current_user($original_user);
}
