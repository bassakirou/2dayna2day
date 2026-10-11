<?php
$p=wc_get_product(65);echo json_encode(array('regular'=>$p->get_regular_price('edit'),'classic'=>$p->get_price('edit'),'effective'=>$p->get_price(),'special'=>TwoDay_Special_Promotions::active($p)),JSON_UNESCAPED_UNICODE).PHP_EOL;
