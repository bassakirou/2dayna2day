"use client";

import { useState, useMemo, useEffect } from "react";
import { sanitizeHtml } from "@/lib/html";

import Image from "next/image";
import { Link } from "@/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Product, formatPrice } from "@/lib/data";
import NegotiateButton from "@/components/ui/NegotiateButton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/navigation";

interface ProductClassicRenderProps {
  product: Product;
}

export default function ProductClassicRender({
  product,
}: ProductClassicRenderProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const openAuthModal = () => {
    window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab: "login", redirectUrl: primaryCta.href } }));
  };

  const isVariable = product.type === "variable" && Array.isArray(product.variations) && product.variations.length > 0;

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tab, setTab] = useState('description');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  useEffect(() => {setDescriptionHtml(sanitizeHtml(product.fullDescription || ''));}, [product.fullDescription]);
  const gallery = Array.from(new Set([product.thumbnail, ...(product.images || [])].filter(Boolean)));

  const selectedVariation = useMemo(() => {
    if (!isVariable || !product.variations || !product.attributes?.every(a => selectedAttributes[a.name])) return null;
    return product.variations.find(v => {
      return Object.entries(selectedAttributes).every(([key, value]) => {
        const varAttrValue = v.attributes[key.toLowerCase()] || v.attributes[key];
        return !varAttrValue || varAttrValue === value;
      });
    });
  }, [isVariable, product.variations, product.attributes, selectedAttributes]);

  let displayPrice = product.price;
  let displayPriceOld = product.priceOld;
  let inStock = product.stock > 0;
  let stockQuantity = product.stock;

  if (isVariable) {
    if (selectedVariation) {
      displayPrice = selectedVariation.price;
      displayPriceOld = selectedVariation.priceOld;
      inStock = selectedVariation.inStock;
      stockQuantity = inStock ? selectedVariation.stock ?? 0 : 0;
    } else if (product.variations) {
      displayPrice = Math.min(...product.variations.map(v => v.price));
      displayPriceOld = null;
      inStock = product.variations.some(v => v.inStock);
    }
  }

  const discountPercent = displayPriceOld
    ? Math.round(((displayPriceOld - displayPrice) / displayPriceOld) * 100)
    : null;

  const allAttributesSelected = isVariable 
    ? product.attributes?.every(attr => selectedAttributes[attr.name]) 
    : true;

  const primaryCta =
    product.builderEnabled === false || isVariable
      ? { href: `${product.checkoutType === 'direct' && !isVariable ? '/upsell' : '/checkout/direct'}/${product.slug}${selectedVariation ? `?variationId=${selectedVariation.id}` : ''}`, label: 'Passer la commande' }
      : product.checkoutType === "direct"
      ? {
          href: `/upsell/${product.slug}${selectedVariation ? `?variationId=${selectedVariation.id}` : ''}`,
          label: "Commander maintenant",
        }
      : { href: "/checkout", label: "Voir le panier" };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
            <Image
              src={selectedVariation?.image || selectedImage || product.thumbnail}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.badge ? (
              <div className="absolute top-4 left-4 bg-accent-red text-neutral-dark text-xs font-bold px-3 py-1 rounded-full">
                {product.badge}
              </div>
            ) : null}
            {discountPercent ? (
              <div className={product.specialPromotion ? "absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full" : "absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full"}>
                {product.specialPromotion ? `Spécial -${product.specialPromotion.percent}%` : `-${discountPercent}%`}
              </div>
            ) : null}
          </div>
          {gallery.length > 1 && <div className="flex gap-3 overflow-x-auto pb-2">{gallery.map((image,index) => <button key={image} type="button" aria-label={`Afficher la photo ${index+1}`} aria-pressed={(selectedImage || product.thumbnail) === image} onClick={() => setSelectedImage(image)} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><Image src={image} alt="" fill sizes="80px" className="object-cover" /></button>)}</div>}
          </div>

          <div className="flex flex-col">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {product.category}
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-body">
              {product.name}
            </h1>

            <div className="mt-4 flex items-end gap-3">
              <div className="text-3xl font-bold text-primary">
                {isVariable && !selectedVariation && <span className="text-xl font-normal text-gray-500 mr-2">Dès</span>}
                {formatPrice(displayPrice)}
              </div>
              {displayPriceOld ? (
                <div className="text-lg text-gray-400 line-through">
                  {formatPrice(displayPriceOld)}
                </div>
              ) : null}
            </div>

            <div
              className={`mt-3 text-sm ${inStock ? "text-green-600" : "text-red-500"}`}
            >
              {inStock
                ? `${stockQuantity > 0 ? stockQuantity + " en stock" : "En stock"}`
                : "Rupture de stock"}
            </div>

            {/* Variable Product Options */}
            {isVariable && product.attributes && (
              <div className="mt-6 space-y-4">
                {product.attributes.map((attr) => (
                  <div key={attr.name}>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">{attr.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {attr.options.map((opt) => (
                        <button
                          key={opt}
                          aria-pressed={selectedAttributes[attr.name] === opt}
                          onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: opt }))}
                          className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                            selectedAttributes[attr.name] === opt
                              ? "border-primary bg-primary text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {(product.builderEnabled === false || product.checkoutType === "classic" || isVariable) ? (
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      id: selectedVariation ? `${product.id}-${selectedVariation.id}` : product.id,
                      wpId: product.wpId,
                      variationId: selectedVariation?.id,
                      name: selectedVariation ? `${product.name} - ${Object.values(selectedAttributes).join(', ')}` : product.name,
                      price: displayPrice,
                      thumbnail: selectedVariation?.image || product.thumbnail,
                      slug: product.slug,
                      crossSells: product.crossSells,
                    })
                  }
                  disabled={!inStock || !allAttributesSelected || (isVariable && !selectedVariation)}
                  className="inline-flex items-center justify-center rounded-full bg-primary text-white px-6 py-3 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isVariable && !allAttributesSelected ? "Choisir les options" : "Ajouter au panier"}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    if (!allAttributesSelected || !inStock || (isVariable && !selectedVariation)) {
                      e.preventDefault();
                      return;
                    }
                    if (!user) {
                      openAuthModal();
                    } else {
                      router.push(primaryCta.href);
                    }
                  }}
                  className={`inline-flex items-center justify-center rounded-full px-6 py-3 font-medium transition-colors ${
                    allAttributesSelected 
                      ? "bg-primary text-white hover:bg-primary/90" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isVariable && !allAttributesSelected ? "Choisir les options" : primaryCta.label}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}

              {(product.builderEnabled === false || product.checkoutType === "classic" || isVariable) ? (
                <button
                  disabled={!inStock || !allAttributesSelected || (isVariable && !selectedVariation)}
                  onClick={() => {
                    if (!user) {
                      openAuthModal();
                    } else {
                      router.push(primaryCta.href);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-red-600 text-white px-6 py-3 font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {primaryCta.label}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : null}

              <NegotiateButton
                productSlug={product.slug}
                className="rounded-full border border-gray-200 bg-white text-body px-6 py-3 hover:bg-neutral-light"
              />
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-body">Description</h2>
                <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {product.specifications?.sections?.length ? (
                <div>
                  <h2 className="text-lg font-bold text-body">
                    Caractéristiques principales
                  </h2>
                  <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {product.specifications.sections
                      .flatMap((s) => s.items)
                      .slice(0, 8)
                      .map((it, idx) => (
                        <div key={`${it.label}-${idx}`} className="text-sm">
                          <dt className="text-gray-500">{it.label}</dt>
                          <dd className="font-medium text-body">{it.value}</dd>
                        </div>
                      ))}
                  </dl>
                  <div className="mt-4">
                    <Link
                      href={`/boutique/${product.slug}/caracteristiques`}
                      className="text-primary hover:text-accent-blue font-medium transition-colors"
                    >
                      Voir toutes les caractéristiques
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <Link
                    href={`/boutique/${product.slug}/caracteristiques`}
                    className="text-primary hover:text-accent-blue font-medium transition-colors"
                  >
                    Voir les caractéristiques
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-10 border border-gray-200 rounded-xl overflow-hidden">
          <div role="tablist" aria-label="Détails du produit" className="flex flex-wrap border-b border-gray-200 bg-gray-50">
            {[['description','Description'],['information','Informations supplémentaires'],['reviews','Avis']].map(([id,label]) => <button key={id} id={`product-tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`product-panel-${id}`} onClick={() => setTab(id)} className={`px-5 py-4 font-medium ${tab===id?'bg-white text-primary':'text-gray-600 hover:bg-white'}`}>{label}</button>)}
          </div>
          <div role="tabpanel" id={`product-panel-${tab}`} aria-labelledby={`product-tab-${tab}`} className="p-6">
            {tab==='description' && (descriptionHtml ? <div className="space-y-4 [&_p]:mb-4 [&_img]:max-w-full [&_a]:underline" dangerouslySetInnerHTML={{__html:descriptionHtml}} /> : <p className="whitespace-pre-line">{product.description}</p>)}
            {tab==='information' && <><dl className="space-y-3">{product.specifications?.sections?.flatMap(section=>section.items).map((item,index)=><div key={index} className="grid grid-cols-2 gap-4"><dt className="text-gray-500">{item.label}</dt><dd>{item.value}</dd></div>)}</dl><Link href={`/boutique/${product.slug}/caracteristiques`} className="inline-block mt-4 underline">Voir toutes les caractéristiques</Link></>}
            {tab==='reviews' && <Link href={`/boutique/${product.slug}/avis`} className="underline">Consulter les avis clients et donner mon avis</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
