<?php
function repair_builder_texts($data, &$count, $key='') {
 if(is_array($data)){foreach($data as $k=>$v)$data[$k]=repair_builder_texts($v,$count,(string)$k);return $data;}
 if(!is_string($data)||!in_array($key,array('title','subtitle','text','description','label','buttonText','btnCommandText','cartButtonText','name'),true))return $data;
 return preg_replace_callback('/u(00[a-f][0-9a-f]|20[12][0-9a-f])/i',function($m)use(&$count){$decoded=json_decode('"\\u'.$m[1].'"');if(!is_string($decoded))return $m[0];$count++;return $decoded;},$data);
}
$total=0;$products=0;
foreach(get_posts(array('post_type'=>'product','post_status'=>'any','numberposts'=>-1)) as $product){
 $raw=get_post_meta($product->ID,'_2day_product_builder',true);$data=json_decode((string)$raw,true);if(!is_array($data))continue;
 $count=0;$fixed=repair_builder_texts($data,$count);if(!$count)continue;
 update_post_meta($product->ID,'_2day_product_builder_before_unicode_repair',wp_slash($raw));
 update_post_meta($product->ID,'_2day_product_builder',wp_slash(wp_json_encode($fixed,JSON_UNESCAPED_UNICODE)));
 if(json_decode(get_post_meta($product->ID,'_2day_product_builder',true),true)!==$fixed)throw new RuntimeException('Repair persistence failed');
 $total+=$count;$products++;
}
echo "Repaired $total legacy Unicode sequences in $products products; originals backed up in post meta.\n";
