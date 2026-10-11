<?php
function mode_assert($value,$message){if(!$value)throw new RuntimeException($message);}
$product=get_page_by_path('macbook-air-m2-2022',OBJECT,'product');
if(!$product)throw new RuntimeException('Product missing');
$original_user=get_current_user_id();$original_post=$_POST;$admins=get_users(array('role'=>'administrator','number'=>1,'fields'=>'ID'));wp_set_current_user((int)$admins[0]);
global $wpdb;$wpdb->query('START TRANSACTION');
try {
 $raw=get_post_meta($product->ID,'_2day_product_builder',true);
 $blocks=json_decode($raw,true);
 mode_assert(is_array($blocks)&&count($blocks)>0,'Existing funnel preserved');
 $_POST=array('_2day_product_builder_nonce'=>wp_create_nonce('2day_product_builder_save'),'two_day_product_builder_ready'=>'1','two_day_product_builder_json'=>wp_slash($raw));
 TwoDaynaTwoDay_Commerce_Product_Builder_Admin::save_product_builder_meta($product->ID,$product);
 mode_assert(get_post_meta($product->ID,'_2day_product_builder_enabled',true)==='0','Explicit classic mode stored');
 wp_cache_delete($product->ID,'post_meta');
 mode_assert(!TwoDaynaTwoDay_Commerce_Product_Builder_Meta::is_enabled($product->ID),'Classic persists after reload');
 mode_assert(json_decode(get_post_meta($product->ID,'_2day_product_builder',true),true)===$blocks,'Blocks preserved in classic mode');
 ob_start();TwoDaynaTwoDay_Commerce_Product_Builder_Admin::render_product_builder_switch($product);$switch=ob_get_clean();
 mode_assert(strpos($switch,'data-enabled="0"')!==false,'Editor renders classic state');
 ob_start();TwoDaynaTwoDay_Commerce_Product_Builder_Admin::render_product_builder_metabox($product);$editor=ob_get_clean();
 mode_assert(strpos($editor,'data-block-type="pricing"')===false,'Pricing removed from picker');
 do_action('rest_api_init');$request=new WP_REST_Request('GET','/2day/v1/products/macbook-air-m2-2022');$response=rest_do_request($request);$data=$response->get_data();
 mode_assert($response->get_status()===200,'Product API succeeds');
 mode_assert($data['meta']['_2day_product_builder_enabled']===false&&$data['blocks']===array(),'API returns classic, no funnel blocks');
 $_POST['two_day_product_builder_enabled']='1';
 TwoDaynaTwoDay_Commerce_Product_Builder_Admin::save_product_builder_meta($product->ID,$product);
 mode_assert(TwoDaynaTwoDay_Commerce_Product_Builder_Meta::is_enabled($product->ID),'Builder can be reactivated');
 update_post_meta($product->ID,'_2day_product_builder_enabled',false);
 mode_assert(!TwoDaynaTwoDay_Commerce_Product_Builder_Meta::is_enabled($product->ID),'Boolean false normalized');
 update_post_meta($product->ID,'_2day_product_builder_enabled',true);
 mode_assert(TwoDaynaTwoDay_Commerce_Product_Builder_Meta::is_enabled($product->ID),'Boolean true normalized');
 echo "PASS: classic save/reload, API, preserved blocks and reactivation\n";
}finally{$wpdb->query('ROLLBACK');wp_cache_delete($product->ID,'post_meta');wp_cache_delete('alloptions','options');wp_cache_delete('cron','options');$_POST=$original_post;wp_set_current_user($original_user);}
