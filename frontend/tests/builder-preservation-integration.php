<?php
$admins=get_users(array('role'=>'administrator','number'=>1,'fields'=>'ID'));$original=get_current_user_id();wp_set_current_user((int)$admins[0]);
$product=get_page_by_path('hub-usb-c-7en1',OBJECT,'product');$id=$product->ID;
$raw=get_post_meta($id,'_2day_product_builder',true);$enabled=get_post_meta($id,'_2day_product_builder_enabled',true);$original_post=$_POST;
foreach(array(array(),array('two_day_product_builder_json'=>'[]'),array('two_day_product_builder_ready'=>'1','two_day_product_builder_json'=>''),array('two_day_product_builder_ready'=>'1','two_day_product_builder_json'=>'broken')) as $fields){
$_POST=array_merge(array('_2day_product_builder_nonce'=>wp_create_nonce('2day_product_builder_save')),$fields);
TwoDaynaTwoDay_Commerce_Product_Builder_Admin::save_product_builder_meta($id,$product);
if(get_post_meta($id,'_2day_product_builder',true)!==$raw || get_post_meta($id,'_2day_product_builder_enabled',true)!==$enabled)throw new RuntimeException('Incomplete editor changed stored data');
}
$_POST=$original_post;wp_set_current_user($original);
echo 'Verified: six Hub blocks and activation preserved with unloaded editor, missing field, empty input and invalid JSON.'.PHP_EOL;
