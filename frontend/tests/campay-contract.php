<?php
define('ABSPATH', __DIR__);
$options = array('woocommerce_2day_taramoney_settings' => array('enabled' => 'no'), 'woocommerce_2day_campay_settings' => array('enabled' => 'yes', 'username' => 'test-user', 'password' => 'test-password', 'webhook_secret' => 'test-webhook', 'environment' => 'demo'));
$transients = $calls = $replies = array(); $counter = 0;
function get_option($k, $fallback = false) { global $options; return $options[$k] ?? $fallback; }
function add_option($k,$v,...$args) { global $options; if(isset($options[$k]))return false; $options[$k]=$v;return true; }
function delete_option($k) { global $options;unset($options[$k]); }
function set_transient($k,$v,$ttl) { global $transients;$transients[$k]=$v; }
function get_transient($k) { global $transients;return $transients[$k]??false; }
function delete_transient($k) { global $transients;unset($transients[$k]); }
function wp_json_encode($v){return json_encode($v);} function sanitize_text_field($v){return $v;}
function wp_remote_post($u,$a){return wp_remote_request($u,$a);}
function wp_remote_request($u,$a){global $calls,$replies;$calls[]=array($u,$a);if(!$replies)throw new RuntimeException('Unexpected request');return array_shift($replies);}
function is_wp_error($v){return false;} function wp_remote_retrieve_response_code($r){return $r['code'];} function wp_remote_retrieve_body($r){return json_encode($r['body']);}
function wp_generate_uuid4(){global $counter;return 'test-'.++$counter;} function home_url($p){return 'https://example.com'.$p;}
function add_action(...$a){} function add_filter($name,$callback,...$a){global $filters;$filters[$name]=$callback;}
class WC_Order {
    public $meta=array(),$status='pending',$completions=0,$method='2day_campay';
    function get_id(){return 99;} function get_order_number(){return '99';} function get_total(){return 10001;} function get_currency(){return 'XAF';}
    function get_meta($k){return $this->meta[$k]??'';} function update_meta_data($k,$v){$this->meta[$k]=$v;} function delete_meta_data($k){unset($this->meta[$k]);}
    function is_paid(){return $this->status==='processing';} function has_status($s){return in_array($this->status,(array)$s,true);} function set_payment_method($s){$this->method=$s;} function get_payment_method(){return $this->method;}
    function update_status($s,$note=''){$this->status=$s;} function payment_complete($r){$this->status='processing';$this->completions++;} function set_transaction_id($r){} function save(){}
}
class WP_REST_Request {function get_method(){return 'POST';}function get_json_params(){return array('status'=>'SUCCESSFUL','signature'=>'forged');}}
class WP_REST_Response {function __construct(public $data,public $status){}}
function reply($v,$code=200){global $replies;$replies[]=array('body'=>$v,'code'=>$code);} function check($v,$m){if(!$v)throw new RuntimeException($m);} function throws($f){try{$f();}catch(RuntimeException $e){return;}throw new RuntimeException('Expected rejection');}
require __DIR__.'/../../backend/wp-content/plugins/2dayna2day-commerce/inc/mobile-payments.php';
require __DIR__.'/../../backend/wp-content/plugins/2dayna2day-commerce/inc/campay.php';
$o=new WC_Order();$o->meta=array('_2day_payment_plan'=>'split','_2day_partial_percent'=>35);
reply(array('token'=>'test-token','expires_in'=>3600));reply(array('reference'=>'provider-ref','ussd_code'=>'*126#','operator'=>'MTN'));
$init=TwoDay_CamPay::initiate($o,'670123456');
check($init['status']==='SUCCESS'&&!$o->is_paid(),'Initiation credited');
check($calls[0][0]==='https://demo.campay.net/api/token/'&&json_decode($calls[0][1]['body'],true)['username']==='test-user','Token contract');
$payload=json_decode($calls[1][1]['body'],true);
check($calls[1][1]['headers']['Authorization']==='Token test-token'&&$payload['amount']==='3500'&&$payload['from']==='237670123456'&&!isset($payload['network']),'Collect contract');
$status=array('reference'=>'provider-ref','external_reference'=>$o->get_meta('_2day_campay_external'),'status'=>'PENDING','amount'=>3500,'currency'=>'XAF','endpoint'=>'collect');
reply($status);TwoDay_CamPay::reconcile($o,true);check(!$o->is_paid(),'Pending credited');
reply($status);throws(fn()=>TwoDay_CamPay::initiate($o,'670123456'));
$status['status']='SUCCESSFUL';$bad=$status;$bad['amount']=1;reply($bad);throws(fn()=>TwoDay_CamPay::reconcile($o,true));check($o->status==='pending','Wrong amount credited');
reply($status);TwoDay_CamPay::reconcile($o,true);check($o->status==='partial-paid','Deposit not confirmed');
reply(array('reference'=>'balance-ref'));TwoDay_CamPay::initiate($o,'670123456');check(json_decode(end($calls)[1]['body'],true)['amount']==='6501','Balance amount');
$status['reference']='balance-ref';$status['external_reference']=$o->get_meta('_2day_campay_external');$status['amount']=6501;
reply($status);TwoDay_CamPay::reconcile($o,true);TwoDay_CamPay::reconcile($o,true);check($o->completions===1,'Balance deduplication');
$options['woocommerce_2day_taramoney_settings']['enabled']='yes'; $options['woocommerce_2day_campay_settings']['enabled']='no';throws(fn()=>TwoDay_CamPay::initiate(new WC_Order(),'670123456'));
check(!isset($filters['woocommerce_available_payment_gateways'](array('2day_taramoney'=>true,'2day_campay'=>true))['2day_campay']),'Inactive gateway exposed');
$options['woocommerce_2day_taramoney_settings']['enabled']='no'; $options['woocommerce_2day_campay_settings']['enabled']='yes';check(!isset($filters['woocommerce_available_payment_gateways'](array('2day_taramoney'=>true,'2day_campay'=>true))['2day_taramoney']),'Two providers exposed');
check(TwoDay_CamPay::webhook(new WP_REST_Request())->status===401,'Forged webhook accepted');
$b64=fn($s)=>rtrim(strtr(base64_encode($s),'+/','-_'),'=');$header=$b64(json_encode(array('alg'=>'HS256')));$body=$b64(json_encode(array('exp'=>time()+60)));$jwt=$header.'.'.$body.'.'.$b64(hash_hmac('sha256',$header.'.'.$body,'test-webhook',true));
check(TwoDay_CamPay::signature_valid($jwt,'test-webhook')&&!TwoDay_CamPay::signature_valid($jwt,'wrong'),'JWT verification');
echo "CamPay verified: Token auth, integer collect, phone, no network, pending, retry protection, amount verification, deposit/balance, deduplication, exclusive provider and signed webhook.\n";
