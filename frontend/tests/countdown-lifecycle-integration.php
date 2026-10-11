<?php
function lifecycle_assert($condition,$message){if(!$condition)throw new RuntimeException($message);}
$product=get_page_by_path('hub-usb-c-7en1',OBJECT,'product');
$original_user=get_current_user_id();$original_post=$_POST;
$admins=get_users(array('role'=>'administrator','number'=>1,'fields'=>'ID'));wp_set_current_user((int)$admins[0]);
global $wpdb;$wpdb->query('START TRANSACTION');
try {
 $future=(new DateTimeImmutable('@'.(time()+120)))->format(DATE_ATOM);
 $past=(new DateTimeImmutable('@'.(time()-120)))->format(DATE_ATOM);
 $blocks=array(array('id'=>'banner','type'=>'banner','title'=>"Qualit\u{00e9}"),array('id'=>'expired','type'=>'countdown','deadline'=>$past,'discountValue'=>35),array('id'=>'future','type'=>'countdown','deadline'=>$future,'discountValue'=>35));
 update_post_meta($product->ID,'_2day_product_builder',wp_slash(wp_json_encode($blocks,JSON_UNESCAPED_UNICODE)));
 TwoDay_Special_Promotions::prune($product->ID);
 $saved=json_decode(get_post_meta($product->ID,'_2day_product_builder',true),true);
 lifecycle_assert(array_column($saved,'id')===array('banner','future'),'Only expired countdown removed');
 lifecycle_assert($saved[0]['title']==="Qualit\u{00e9}",'Accents preserved');
 lifecycle_assert(wp_next_scheduled('two_day_countdown_expire',array($product->ID))===strtotime($future),'Next expiry scheduled');
 $saved[1]['deadline']=$past;
 update_post_meta($product->ID,'_2day_product_builder',wp_slash(wp_json_encode($saved)));
 do_action('two_day_countdown_expire',$product->ID);
 lifecycle_assert(count(json_decode(get_post_meta($product->ID,'_2day_product_builder',true),true))===1,'Scheduled expiration removes countdown');
 lifecycle_assert(wp_next_scheduled('two_day_countdown_expire',array($product->ID))===false,'No leftover expiry event');
 $blocks[1]['deadline']=$future;unset($blocks[2]);
 update_post_meta($product->ID,'_2day_product_builder',wp_slash(wp_json_encode(array_values($blocks))));
 lifecycle_assert(TwoDay_Special_Promotions::active(wc_get_product($product->ID))!==null,'Promotion active');
 $_POST=array('_2day_product_builder_nonce'=>wp_create_nonce('2day_product_builder_save'),'two_day_product_builder_ready'=>'1','two_day_product_builder_enabled'=>'1','two_day_product_builder_json'=>wp_slash(wp_json_encode(array($blocks[0]))));
 TwoDaynaTwoDay_Commerce_Product_Builder_Admin::save_product_builder_meta($product->ID,$product);
 lifecycle_assert(TwoDay_Special_Promotions::active(wc_get_product($product->ID))===null,'Deleting and saving cancels promotion');
 lifecycle_assert(wp_next_scheduled('two_day_countdown_expire',array($product->ID))===false,'Deleting cancels scheduled expiry');
 echo "PASS: expiry, cron, Unicode preservation, deletion/save and cancellation\n";
} finally {
 $wpdb->query('ROLLBACK');wp_cache_delete($product->ID,'post_meta');wp_cache_delete('cron','options');wp_cache_delete('alloptions','options');$_POST=$original_post;wp_set_current_user($original_user);
}
