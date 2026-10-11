<?php
// Isolated account contracts: no database, emails or real payments.
define('ABSPATH', __DIR__); define('DAY_IN_SECONDS', 86400);
$options = []; $meta = []; $orders = []; $coupons = []; $uid = 7;
function add_action(...$args) {}
function get_current_user_id() { global $uid; return $uid; }
function get_userdata($id) { return $id ? (object) ['user_email' => 'customer@example.com', 'user_registered' => '2024-01-01'] : false; }
function get_option($key, $default = false) { global $options; return $options[$key] ?? $default; }
function add_option($key, $value, ...$args) { global $options; if (isset($options[$key])) return false; $options[$key] = $value; return true; }
function delete_option($key) { global $options; unset($options[$key]); }
function get_user_meta($id, $key, $single) { global $meta; return $meta[$id][$key] ?? ''; }
function update_user_meta($id, $key, $value) { global $meta; $meta[$id][$key] = $value; }
function sanitize_key($s) { return preg_replace('/[^a-z0-9_-]/', '', strtolower($s)); }
function sanitize_text_field($s) { return strip_tags($s); }
function wp_generate_uuid4() { return 'unique-id'; }
function wp_generate_password(...$args) { return 'unique-secret'; }
function wc_get_orders($args) { global $orders; return $orders; }
class WP_Error { function __construct(public $code, public $message, public $data = []) {} }
class Request implements ArrayAccess {
    function __construct(public $body, public $method = 'PUT') {}
    function get_json_params() { return $this->body; }
    function get_method() { return $this->method; }
    function offsetExists(mixed $offset): bool { return isset($this->body[$offset]); }
    function offsetGet(mixed $offset): mixed { return $this->body[$offset] ?? null; }
    function offsetSet(mixed $offset, mixed $value): void { $this->body[$offset] = $value; }
    function offsetUnset(mixed $offset): void { unset($this->body[$offset]); }
}
class PaidOrder {
    function __construct(public $paid, public $split, public $full) {}
    function get_date_paid() { return $this->paid; }
    function get_meta($key) { return $key === '_2day_payment_plan' ? ($this->split ? 'split' : 'full') : ($this->full ? 'yes' : ''); }
    function is_paid() { return $this->full; }
}
class WC_Coupon {
    public $data = []; public $code = '';
    function __construct($code = '') { global $coupons; $this->code = $code; $this->data = $coupons[$code] ?? []; }
    function set_code($v) { $this->code = $v; }
    function set_discount_type($v) { $this->data['type'] = $v; }
    function set_amount($v) { $this->data['amount'] = $v; }
    function set_email_restrictions($v) { $this->data['emails'] = $v; }
    function set_usage_limit($v) { $this->data['limit'] = $v; }
    function set_individual_use($v) { $this->data['individual'] = $v; }
    function set_date_expires($v) { $this->data['expires'] = $v; }
    function save() { global $coupons; $coupons[$this->code] = $this->data; }
    function get_id() { return $this->data ? 1 : 0; }
    function get_date_expires() { $v = $this->data['expires'] ?? 0; return $v ? new DateTime('@' . $v) : null; }
    function get_usage_limit() { return $this->data['limit'] ?? 0; }
    function get_usage_count() { return $this->data['used'] ?? 0; }
}
require __DIR__ . '/../../backend/wp-content/plugins/2dayna2day-commerce/inc/account-rest.php';
function check($value, $message) { if (!$value) { fwrite(STDERR, $message . "\n"); exit(1); } }
$entry = ['id' => 'one', 'label' => '<b>Personnel</b>', 'phone' => '+237 699 123 456', 'provider' => 'orange_money'];
$r = TwoDay_Account::account(new Request(['items' => [$entry]]), 'payment-methods');
check($r['items'][0]['phone'] === '699123456' && $r['items'][0]['label'] === 'Personnel', 'Payment normalization failed');
$r = TwoDay_Account::account(new Request(['items' => [$entry, $entry]]), 'payment-methods');
check($r instanceof WP_Error && $r->code === 'duplicate', 'Duplicate payment accepted');
$entry['provider'] = 'invalid';
check(TwoDay_Account::account(new Request(['items' => [$entry]]), 'payment-methods') instanceof WP_Error, 'Invalid provider accepted');
$uid = 8; $r = TwoDay_Account::account(new Request([], 'GET'), 'payment-methods'); check($r['items'] === [], 'Payment methods leaked across users'); $uid = 7;
$options[TwoDay_Account::RULES] = [['id' => 'loyal', 'name' => 'Fidèle', 'orders' => 2, 'percent' => 5, 'scope' => 'next', 'days' => 30]];
$orders = [new PaidOrder(true, false, true), new PaidOrder(true, true, false), new PaidOrder(false, false, false)];
$r = TwoDay_Account::rewards(7); check($r['paidOrders'] === 1 && !$r['badges'][0]['earned'], 'Partial or unpaid order counted as fully paid');
$orders[] = new PaidOrder(true, true, true);
$r = TwoDay_Account::rewards(7); check($r['paidOrders'] === 2 && $r['badges'][0]['earned'], 'Paid split order did not earn badge');
$code = $r['badges'][0]['coupon']; check($coupons[$code]['limit'] === 1 && $coupons[$code]['emails'] === ['customer@example.com'], 'Coupon is not personal or single use');
TwoDay_Account::rewards(7); check(count($coupons) === 1, 'Repeated load granted duplicate coupons');
$coupons[$code]['used'] = 1; $r = TwoDay_Account::rewards(7); check(!$r['badges'][0]['usable'], 'Used coupon still usable');
$options['2day_rewards_lock_7'] = time(); check(TwoDay_Account::rewards(7) instanceof WP_Error, 'Concurrent reward update accepted'); unset($options['2day_rewards_lock_7']);
$options[TwoDay_Account::RULES] = []; $r = TwoDay_Account::rewards(7); check(count($r['badges']) === 1 && $r['badges'][0]['earned'], 'Removed rule erased earned badge');
echo "10 account and reward contracts passed.\n";
