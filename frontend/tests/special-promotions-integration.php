<?php
// Read-only checks: no order is saved and no payment is initiated.
$product = wc_get_product(65);
function promo_assert($ok, $message) { if (!$ok) throw new RuntimeException($message); }
$promo = TwoDay_Special_Promotions::active($product);
promo_assert($promo && $promo['percent'] == 35 && $promo['price'] == 26, 'Hub special price');
promo_assert((float)$product->get_price() === 26.0, 'WooCommerce effective price');
promo_assert((float)$product->get_price('edit') === 20.0, 'Original price preserved');
$end = strtotime($promo['endsAt']);
promo_assert(TwoDay_Special_Promotions::active($product, $end - 1) !== null, 'Active before expiration');
promo_assert(TwoDay_Special_Promotions::active($product, $end) === null, 'Expired at deadline');
$variation = new WC_Product_Variation();
$variation->set_parent_id(65);
$variation->set_regular_price(100);
$variation->set_price(50);
promo_assert((float)$variation->get_price() === 65.0, 'Variation inherits countdown');
$order = new WC_Order();
$line = new WC_Order_Item_Product();
$line->set_product($product);
$order->add_item($line);
promo_assert(TwoDay_Special_Promotions::order_has_promotion($order), 'Full payment policy');
promo_assert(!TwoDay_Special_Promotions::payment_plan_allowed($order, 'split'), 'Split rejected server-side');
promo_assert(TwoDay_Special_Promotions::payment_plan_allowed($order, 'full'), 'Full accepted server-side');
echo "PASS: price, preservation, expiry, variation and order policy\n";
