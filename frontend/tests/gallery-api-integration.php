<?php
$request = new WP_REST_Request('GET', '/2day/v1/products/hub-usb-c-7en1');
$response = rest_do_request($request);
if ($response->get_status() !== 200) throw new RuntimeException('Product API not available');
$galleries = array_values(array_filter($response->get_data()['blocks'] ?? array(), fn($block) => ($block['type'] ?? '') === 'gallery'));
$count = 0;
foreach ($galleries as $gallery) foreach ($gallery['images'] as $image) {
  if (!is_array($image) || empty($image['url']) || !array_key_exists('description', $image)) throw new RuntimeException('Invalid gallery image');
  if (!empty($image['id'])) {
    $expected = wp_strip_all_tags((string)get_post_field('post_content', $image['id']));
    if ($expected !== $image['description']) throw new RuntimeException('Description mismatch');
  }
  $count++;
}
if (!$count) throw new RuntimeException('No gallery images to verify');
echo "Product API verified: $count gallery images resolved with media metadata.\n";
