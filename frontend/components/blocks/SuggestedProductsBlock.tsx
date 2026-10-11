import { Product } from "@/lib/data";
import ProductCard from "@/components/ui/ProductCard";

export default function SuggestedProductsBlock({ products, title = "Vous aimerez aussi" }: { products: NonNullable<Product["suggestedProducts"]>, title?: string }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="bg-neutral-light py-16">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-body mb-8">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.wpId} product={product as unknown as Product} />
          ))}
        </div>
      </div>
    </div>
  );
}
