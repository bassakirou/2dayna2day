<?php
define('ABSPATH', __DIR__);
define('DAY_IN_SECONDS', 86400);
define('TARAMONEY_API_KEY', 'constant-secret-value');
$options = array('woocommerce_2day_taramoney_settings' => array('api_key' => 'configured-secret-value'));
function get_option($name, $fallback = false) { global $options; return $options[$name] ?? $fallback; }
function update_option($name, $value, $autoload = null) { global $options; $options[$name] = $value; }
function add_action(...$args) {}
require __DIR__ . '/../../backend/wp-content/plugins/2dayna2day-commerce/inc/admin/taramoney-debug.php';
$input = array('status' => 'FAILURE', 'message' => 'configured-secret-value constant-secret-value 237699123456 https://private.example/token', 'payload' => json_encode(array('status' => 'ERROR', 'paymentStatus' => 'ERROR', 'phoneNumber' => '237699123456', 'token' => 'private-token', 'customerName' => 'PRIVATE NAME', 'amount' => 100)), 'apiKey' => 'configured-secret-value');
$safe = TwoDay_Tara_Debug::clean($input);
$encoded = json_encode($safe);
foreach (array('configured-secret-value', 'constant-secret-value', '237699123456', 'private-token', 'PRIVATE NAME', 'private.example') as $secret) if (str_contains($encoded, $secret)) throw new RuntimeException('Sensitive data leaked');
if ($safe['payload']['status'] !== 'ERROR' || $safe['payload']['amount'] !== 100) throw new RuntimeException('Nested diagnostic lost');
for ($i = 0; $i < 105; $i++) TwoDay_Tara_Debug::record('order-127-full-test', $input);
if (count(TwoDay_Tara_Debug::for_order(127)) !== 100 || count(TwoDay_Tara_Debug::for_order(128)) !== 0) throw new RuntimeException('History limit or isolation failed');
echo "Diagnostic verified: nested JSON, secrets and personal data masked, bounded history and order isolation.\n";
