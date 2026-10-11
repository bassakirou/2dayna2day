"use client";

import { Check, X } from "lucide-react";

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  notIncluded?: string[];
  recommended?: boolean;
  cta: string;
}

interface PricingBlockProps {
  tiers: PricingTier[];
}

export default function PricingBlock({ tiers }: PricingBlockProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-body font-heading mb-4">
          Choisissez votre formule
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Comparez nos offres et sélectionnez celle qui correspond le mieux à
          vos besoins
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`
                relative rounded-2xl p-8
                ${
                  tier.recommended
                    ? "bg-primary text-white shadow-xl scale-105"
                    : "bg-white border-2 border-gray-100"
                }
              `}
            >
              {/* Recommended Badge */}
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-accent-red text-neutral-dark px-4 py-1 rounded-full text-sm font-bold">
                    Recommandé
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <h3
                  className={`text-xl font-bold mb-2 ${tier.recommended ? "text-white" : "text-body"}`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`text-sm mb-4 ${tier.recommended ? "text-white/80" : "text-gray-500"}`}
                >
                  {tier.description}
                </p>
                <div className="flex items-baseline justify-center">
                  <span
                    className={`text-4xl font-bold ${tier.recommended ? "text-white" : "text-primary"}`}
                  >
                    {tier.price.toLocaleString("fr-FR")}
                  </span>
                  <span
                    className={`ml-1 ${tier.recommended ? "text-white/80" : "text-gray-500"}`}
                  >
                    FCFA
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 ${tier.recommended ? "text-accent-yellow" : "text-green-500"}`}
                    />
                    <span
                      className={
                        tier.recommended ? "text-white/90" : "text-gray-600"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
                {tier.notIncluded?.map((feature, i) => (
                  <li
                    key={`not-${i}`}
                    className="flex items-start space-x-3 opacity-50"
                  >
                    <X className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    <span
                      className={
                        tier.recommended ? "text-white/60" : "text-gray-400"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`
                  w-full py-3 rounded-full font-semibold transition-colors
                  ${
                    tier.recommended
                      ? "bg-accent-red text-neutral-dark hover:bg-accent-red/90"
                      : "bg-primary text-white hover:bg-primary/90"
                  }
                `}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
