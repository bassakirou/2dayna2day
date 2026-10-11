<?php
// Isolated calculation tests: no WordPress database, HTTP calls or real payments.
define('ABSPATH', __DIR__);
function get_option($key) { return array('partial_payment_percent' => 60); }
function wp_json_encode($value) { return json_encode($value); }
class WC_Order {
    public array $meta;
    public function __construct(private float $total, private string $status, array $meta) { $this->meta = $meta; }
    public function get_total() { return $this->total; }
    public function get_meta($key) { return $this->meta[$key] ?? ''; }
    public function has_status($status) { return $this->status === $status; }
    public function update_meta_data($key, $value) { $this->meta[$key] = $value; }
    public function save() {}
}
require __DIR__ . '/../../backend/wp-content/plugins/2dayna2day-commerce/inc/service/TaraMoneyService.php';
$service = new TwoDaynaTwoDay_TaraMoney_Service('2day_taramoney');
$method = new ReflectionMethod($service, 'payable_amount');
foreach (array(
    array(11500, 'pending', array('_2day_payment_plan' => 'full'), 11500),
    array(11500, 'pending', array('_2day_payment_plan' => 'split', '_2day_partial_percent' => 35), 4025),
    array(11500, 'partial-paid', array('_2day_payment_plan' => 'split', '_2day_partial_percent' => 35), 7475),
    array(101, 'pending', array('_2day_payment_plan' => 'split', '_2day_partial_percent' => 35), 35),
    array(101, 'partial-paid', array('_2day_payment_plan' => 'split', '_2day_partial_percent' => 35), 66),
    array(10000, 'pending', array('_2day_payment_plan' => 'split'), 6000),
    array(15, 'pending', array('_2day_payment_plan' => 'split', '_2day_partial_percent' => 60), 9),
    array(15, 'partial-paid', array('_2day_payment_plan' => 'split', '_2day_partial_percent' => 60), 6),
) as [$total, $status, $meta, $expected]) {
    $actual = $method->invoke($service, new WC_Order($total, $status, $meta));
    if ($actual != $expected) { fwrite(STDERR, "Incorrect payment amount: $actual != $expected\n"); exit(1); }
}
echo "8 payment calculation scenarios passed.\n";

// An unconfigured webhook must never approve a payment.
class WP_REST_Request { public function get_json_params() { return array(); } }
class WP_REST_Response { public function __construct(public $data, public int $status) {} }
function wc_get_order($id) { return null; }
require __DIR__ . '/../../backend/wp-content/plugins/2dayna2day-commerce/inc/taramoney.php';
$response = TwoDaynaTwoDay_TaraMoney::handle_webhook(new WP_REST_Request());
if ($response->status !== 503) { fwrite(STDERR, "Unconfigured webhook accepted a payment.\n"); exit(1); }
echo "Unconfigured webhook rejected as expected.\n";
