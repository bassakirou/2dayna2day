'use client';

import { Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Testimonial {
  id: string;
  name: string;
  city: string;
  date: string;
  rating: number;
  text: string;
}

interface TestimonialsBlockProps {
  title?: string;
  productSlug?: string;
  items: Testimonial[];
}

export default function TestimonialsBlock({ title, productSlug, items }: TestimonialsBlockProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-white font-heading mb-4">
          {title || "Ce que disent nos clients"}
        </h2>
        <p className="text-center text-white/70 mb-12 max-w-2xl mx-auto">
          Des milliers de clients satisfaits au Cameroun et en Afrique Centrale
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const cardContent = (
              <div className="bg-white rounded-xl p-6 shadow-lg h-full transition-transform hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < item.rating
                          ? 'text-accent-yellow fill-accent-yellow'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-gray-600 mb-6 leading-relaxed line-clamp-4">
                  &ldquo;{item.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center space-x-3 mt-auto">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-lg">
                      {item.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-body truncate">{item.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {item.date ? new Date(item.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : item.city}
                    </p>
                  </div>
                </div>
              </div>
            );

            if (productSlug && item.id) {
              return (
                <Link key={item.id || index} href={`/boutique/${productSlug}/avis#review-${item.id}`} className="block">
                  {cardContent}
                </Link>
              );
            }

            return <div key={index}>{cardContent}</div>;
          })}
        </div>

        {productSlug && (
          <div className="mt-12 text-center">
            <Link 
              href={`/boutique/${productSlug}/avis`}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-primary bg-white hover:bg-gray-50 transition-colors shadow-md"
            >
              Voir tous les avis
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
