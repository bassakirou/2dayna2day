<?php
$admins=get_users(array('role'=>'administrator','number'=>1,'fields'=>'ID'));$original=get_current_user_id();wp_set_current_user((int)$admins[0]);
$p=get_page_by_path('hub-usb-c-7en1',OBJECT,'product');$blocks=json_decode(get_post_meta($p->ID,'_2day_product_builder',true),true);
$text="\u{00c9}cran \u{00e9}t\u{00e9} \u{2014} \u{00ab} qualit\u{00e9} \u{00bb} \"USB\" \u{1f600} C:\\Ports";$blocks[0]['title']=$text;$original_post=$_POST;
global $wpdb;$wpdb->query('START TRANSACTION');
try{
 $_POST=array('_2day_product_builder_nonce'=>wp_create_nonce('2day_product_builder_save'),'two_day_product_builder_ready'=>'1','two_day_product_builder_enabled'=>'1','two_day_product_builder_json'=>wp_slash(wp_json_encode($blocks)));
 TwoDaynaTwoDay_Commerce_Product_Builder_Admin::save_product_builder_meta($p->ID,$p);
 $saved=json_decode(get_post_meta($p->ID,'_2day_product_builder',true),true);
 if(($saved[0]['title']??null)!==$text)throw new RuntimeException('expected='.bin2hex($text).' actual='.bin2hex($saved[0]['title']??''));
 echo "Verified builder save round-trip: accents, Unicode punctuation, emoji, quotes and backslashes preserved.\n";
}finally{$wpdb->query('ROLLBACK');wp_cache_delete($p->ID,'post_meta');$_POST=$original_post;wp_set_current_user($original);}


