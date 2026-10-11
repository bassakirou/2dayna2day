"use client";

import { useEffect, useState } from "react";
import { Block, Product } from "@/lib/data";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { fetchBlocksForProductSlug } from "@/lib/product-builder";

interface ProductBlocksDynamicProps {
  product: Product;
  initialBlocks: Block[];
}

export default function ProductBlocksDynamic({
  product,
  initialBlocks,
}: ProductBlocksDynamicProps) {


  return <BlockRenderer blocks={initialBlocks} product={product} />;
}
