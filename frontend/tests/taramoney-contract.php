<?php
// Isolated contract tests; no database, no HTTP, no real payment.
define('ABSPATH', __DIR__);
$settings = ['api_key'=>'test-key','business_id'=>'test-business','base_url'=>'https://www.dklo.co/api/tara','webhook_url'=>'https://example.com/wp-json/2day/v1/taramoney/webhook'];
$options = []; $transients = []; $calls = []; $replies = []; $counter = 0;
function get_option($key) { global $settings,$options; return str_starts_with($key,'woocommerce_') ? $settings : ($options[$key]??false); }
function add_option($key,$value,...$args) { global $options; if(isset($options[$key]))return false; $options[$key]=$value;return true; }
function delete_option($key) { global $options;unset($options[$key]); }
function set_transient($key,$value,$ttl) { global $transients;$transients[$key]=$value; }
function get_transient($key) { global $transients;return $transients[$key]??false; }
function delete_transient($key) { global $transients;unset($transients[$key]); }
function wp_json_encode($v) { return json_encode($v); }
function wp_remote_post($url,$args) { global $calls,$replies;$calls[]=[$url,$args];if(!$replies)throw new RuntimeException('Unexpected HTTP call');return array_shift($replies); }
function is_wp_error($v) { return false; }
function wp_remote_retrieve_response_code($r) { return $r['code']; }
function wp_remote_retrieve_body($r) { return json_encode($r['body']); }
function sanitize_text_field($v) { return $v; }
function home_url($p) { return 'https://example.com'.$p; }
function rest_url($p) { return 'https://example.com/wp-json/'.$p; }
function wp_parse_url($url,$part) { return parse_url($url,$part); }
function add_query_arg($key,$value,$url) { return $url.'?'.$key.'='.urlencode($value); }
function wp_generate_uuid4() { global $counter; return 'test-'.++$counter; }
class WC_Order {
    public array $meta=[]; public int $completions=0;
    public function __construct(public string $status='pending', public float $total=10001) {}
    public function get_id(){return 99;} public function get_order_number(){return '99';}
    public function get_total(){return $this->total;} public function get_currency(){return 'XAF';}
    public function get_meta($k){return $this->meta[$k]??'';}
    public function update_meta_data($k,$v){$this->meta[$k]=$v;}
    public function delete_meta_data($k){unset($this->meta[$k]);}
    public function is_paid(){return $this->status==='processing';}
    public function has_status($s){return in_array($this->status,(array)$s,true);}
    public function update_status($s,$note=''){$this->status=$s;}
    public function set_transaction_id($id){$this->meta['transaction']=$id;}
    public function payment_complete($id){$this->completions++;$this->status='processing';}
    public function set_payment_method($id){}
    public function save(){}
}
function reply($body,$code=200){global $replies;$replies[]=['code'=>$code,'body'=>$body];}
function check($v,$message){if(!$v)throw new RuntimeException($message);}
function throws($fn){try{$fn();}catch(RuntimeException $e){return;}throw new RuntimeException('Expected failure');}
require __DIR__.'/../../backend/wp-content/plugins/2dayna2day-commerce/inc/service/TaraMoneyService.php';
require __DIR__.'/../../backend/wp-content/plugins/2dayna2day-commerce/inc/taramoney.php';
$service=new TwoDaynaTwoDay_TaraMoney_Service('2day_taramoney');
$o=new WC_Order();$o->meta=['_2day_payment_plan'=>'split','_2day_partial_percent'=>35];
reply(['status'=>'SUCCESS','message'=>'API_ORDER_SUCESSFULL','ussdCode'=>'#150*50#']);
$service->initiate_mobile_payment($o,'699123456','orange');
[$url,$args]=$calls[0];$payload=json_decode($args['body'],true);
check($url==='https://www.dklo.co/api/tara/mobilepay','Wrong endpoint');
check($args['headers']['Authorization']==='Bearer test-key' && $payload['apiKey']==='test-key','Missing authentication');
check($payload['phoneNumber']==='237699123456' && $payload['productPrice']===3500,'Phone or deposit incorrect');
check(str_contains($payload['webHookUrl'],'taraReference=') && !isset($payload['network']),'Callback or provider contract incorrect');
check($payload['webHookUrl']===$payload['webhookUrl'],'Callback aliases differ from working reference');
check($o->status==='pending','Initiation incorrectly confirms payment');
$deposit=$payload['productId'];
reply(['status'=>'PENDING']);TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true);check($o->status==='pending','Pending became paid');
reply(['status'=>'SUCCESS','paymentId'=>'deposit-payment','amount'=>'3500']);TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true);
check($o->status==='partial-paid','Deposit was not confirmed');
$count=count($calls);TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true);check(count($calls)===$count,'Duplicate deposit verification');
reply(['status'=>'SUCCESS']);$service->initiate_mobile_payment($o,'237699123456','orange');
$balance=$o->get_meta('_2day_taramoney_product_id');$payload=json_decode(end($calls)[1]['body'],true);
check($balance!==$deposit && $payload['productPrice']===6501,'Balance reference or rounding incorrect');
reply(['status'=>'SUCCESS','paymentId'=>'balance-payment','amount'=>'6501']);TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true);
check($o->status==='processing' && $o->completions===1,'Balance not confirmed');
TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true);check($o->completions===1,'Duplicate credit');
$o=new WC_Order();reply(['status'=>'FAILURE','message'=>'INVALID_NETWORK']);throws(fn()=>$service->initiate_mobile_payment($o,'699123456','orange'));check(!$o->is_paid(),'Failure became paid');
$o=new WC_Order();$o->meta=['_2day_taramoney_product_id'=>'order-99-full-test','_2day_taramoney_expected_amount'=>10001];
reply(['status'=>'PROCESSING']);TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true);check(!$o->is_paid(),'Processing accepted as final payment');
reply(['status'=>'SUCCESS','amount'=>'1']);throws(fn()=>TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true));check(!$o->is_paid(),'Wrong amount accepted');
reply(['status'=>'SUCCESS','productId'=>'different']);throws(fn()=>TwoDaynaTwoDay_TaraMoney::reconcile_order($o,true));
throws(fn()=>$service->initiate_mobile_payment(new WC_Order(),'123','mtn'));
add_option('_2day_tara_lock_99',time());throws(fn()=>$service->initiate_mobile_payment(new WC_Order(),'699123456','mtn'));delete_option('_2day_tara_lock_99');
$o=new WC_Order();reply(['status'=>'SUCCESS','paymentUrl'=>'https://taramoney.com/pay/test']);$links=$service->create_payment_links_for_order($o);check($links['generalLink']==='https://taramoney.com/pay/test','Link response fallback missing');
reply(['status'=>'PENDING']);throws(fn()=>$service->initiate_mobile_payment($o,'699123456','mtn'));
check(!$replies,'Unconsumed mock responses');
class WP_REST_Request {
    public function __construct(private string $reference, private array $data) {}
    public function get_param($key){return $key==='taraReference'?$this->reference:null;}
    public function get_json_params(){return $this->data;}
}
class WP_REST_Response { public function __construct(public array $data, public int $status) {} }
$webhookOrder=new WC_Order();$webhookOrder->meta=['_2day_taramoney_product_id'=>'order-99-full-hook','_2day_taramoney_expected_amount'=>10001];$scheduled=[];
function wc_get_order($id){global $webhookOrder;return $id===99?$webhookOrder:null;}
function wp_next_scheduled($hook,$args){return false;}
function wp_schedule_single_event($time,$hook,$args){global $scheduled;$scheduled[]=$args;return true;}
$count=count($calls);
$response=TwoDaynaTwoDay_TaraMoney::handle_webhook(new WP_REST_Request('order-99-full-hook',['status'=>'SUCCESS','amount'=>'10001','paymentId'=>'forged']));
check($response->status===200 && count($scheduled)===1 && count($calls)===$count && !$webhookOrder->is_paid(),'Webhook trusted without verification or did not acknowledge immediately');
reply(['status'=>'PENDING']);TwoDaynaTwoDay_TaraMoney::verify_webhook_order(...$scheduled[0]);
check(!$webhookOrder->is_paid(),'Forged success credited a pending transaction');
TwoDaynaTwoDay_TaraMoney::handle_webhook(new WP_REST_Request('order-99-full-unrecognized',['status'=>'SUCCESS']));check(count($scheduled)===1,'Unknown callback reference was scheduled');
echo "TaraMoney contract verified: authentication, phone, deposit/balance, initiation vs confirmation, deduplication, locks, invalid responses and payment link fallback.\n";
echo "Webhook verified: immediate acknowledgement, missing productId, authoritative status and forged reference rejection.\n";

$tiny = new WC_Order('pending', 15);
$tiny->meta = ['_2day_payment_plan'=>'split', '_2day_partial_percent'=>60];
reply(['status'=>'SUCCESS']); $service->initiate_mobile_payment($tiny, '699123456', 'orange');
check(json_decode(end($calls)[1]['body'], true)['productPrice'] === 9, '60% amount incorrect');
reply(['status'=>'PENDING']); TwoDaynaTwoDay_TaraMoney::reconcile_order($tiny, true);
check($tiny->status === 'pending', 'Pending deposit credited');
reply(['status'=>'SUCCESS', 'amount'=>9, 'paymentId'=>'deposit-test']); TwoDaynaTwoDay_TaraMoney::reconcile_order($tiny, true);
check($tiny->status === 'partial-paid' && !$tiny->is_paid(), 'Deposit treated as full payment');
reply(['status'=>'SUCCESS']); $service->initiate_mobile_payment($tiny, '699123456', 'orange');
check(json_decode(end($calls)[1]['body'], true)['productPrice'] === 6, '40% balance incorrect');
reply(['status'=>'SUCCESS', 'amount'=>6, 'paymentId'=>'balance-test']); TwoDaynaTwoDay_TaraMoney::reconcile_order($tiny, true);
check($tiny->is_paid() && $tiny->completions === 1, 'Balance did not complete order');
echo "15 XAF workflow verified with mocked provider: pending, 9 XAF deposit and 6 XAF balance.\n";
