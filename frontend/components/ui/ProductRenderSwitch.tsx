"use client";

import { useEffect, useState } from "react";
import ProductBlocksDynamic from "@/components/blocks/ProductBlocksDynamic";
import ProductClassicRender from "@/components/ui/ProductClassicRender";
import { Product } from "@/lib/data";
import { fetchProductBuilderEnabledForProductSlug } from "@/lib/product-builder";
import { getProductBySlugFromWp } from "@/lib/wp-products";
import {useLiveProductPricing} from '@/lib/use-live-product-pricing';

interface ProductRenderSwitchProps {
  product: Product;
}

export default function ProductRenderSwitch({
  product: initialProduct,
}: ProductRenderSwitchProps) {
  const [currentProduct, setProduct] = useState(initialProduct);
  const product = useLiveProductPricing(currentProduct);
  useEffect(() => {
    let active = true;
    getProductBySlugFromWp(initialProduct.slug).then(current => { if (active && current) setProduct(current); }).catch(() => {});
    return () => { active = false; };
  }, [initialProduct.slug]);
  // Use the value from the serialized product if available, defaulting to true
  const builderEnabled = product.builderEnabled !== false;

  if (!builderEnabled || product.type === "variable") {
    return <ProductClassicRender product={product} />;
  }

  return (
    <ProductBlocksDynamic
      product={product}
      initialBlocks={product.blocks}
    />
  );
}

