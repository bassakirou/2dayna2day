<?php
require_once ABSPATH . 'wp-admin/includes/screen.php';
set_current_screen('dashboard');
$styles=wp_styles(); $defaults=$styles->default_dirs;
TwoDaynaTwoDay_Commerce_Product_Builder_Admin::enqueue_admin_assets('index.php');
if($styles->default_dirs!==$defaults)throw new RuntimeException('Dashboard styles were changed');
set_current_screen('product');
TwoDaynaTwoDay_Commerce_Product_Builder_Admin::enqueue_admin_assets('post.php');
if(($GLOBALS['concatenate_scripts'] ?? true)!==false)throw new RuntimeException('Product assets still concatenate');
wp_enqueue_style('common'); wp_enqueue_style('admin-menu'); wp_enqueue_style('forms'); wp_enqueue_style('edit');
ob_start(); print_admin_styles(); $html=ob_get_clean();
if(str_contains($html,'load-styles.php'))throw new RuntimeException('Combined stylesheet remains');
foreach(array('common.min.css','admin-menu.min.css','forms.min.css','edit.min.css','product-builder.css') as $css)if(!str_contains($html,$css))throw new RuntimeException('Missing stylesheet '.$css);
echo "Verified: product editor core styles and builder stylesheet loaded separately; dashboard unchanged.\n";
