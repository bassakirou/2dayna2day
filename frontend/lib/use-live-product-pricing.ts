'use client';
import {useEffect, useState} from 'react';
import type {Product} from './data';
import {getProductBySlugFromWp} from './wp-products';

export function useLiveProductPricing(initial: Product) {
  const [product, setProduct] = useState(initial);
  useEffect(() => {setProduct(initial);}, [initial]);
  useEffect(() => {
    if (!product.specialPromotion && !product.blocks.some(block => block.type === 'countdown')) return;
    const ends = product.specialPromotion ? Date.parse(product.specialPromotion.endsAt) : NaN;
    let active = true;
    const refresh = () => getProductBySlugFromWp(product.slug).then(current => {if (active && current?.slug === product.slug) setProduct(current);}).catch(() => {});
    const timer = Number.isFinite(ends) ? window.setTimeout(refresh, Math.min(2147483647, Math.max(0, ends - Date.now() + 100))) : undefined;
    // A deleted/saved countdown must also stop an already-open product page.
    const poll = window.setInterval(refresh, 10000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {active = false; window.clearTimeout(timer); window.clearInterval(poll); window.removeEventListener('focus', onFocus);};
  }, [product]);
  return product;
}
