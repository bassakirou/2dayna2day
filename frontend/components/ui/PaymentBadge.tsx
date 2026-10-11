'use client';

import { siteConfig } from '@/lib/data';
import Image from 'next/image';

type PaymentMethod = (typeof siteConfig.paymentMethods)[number];

interface PaymentBadgeProps {
  methodId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function PaymentBadge({ methodId, size = 'md', showLabel = true }: PaymentBadgeProps) {
  const method = siteConfig.paymentMethods.find(m => m.id === methodId);
  
  if (!method) return null;

  if (methodId === 'orange_money' || methodId === 'mtn_momo') {
    const logoSrc =
      methodId === 'orange_money'
        ? '/images/paiement/Orange Money.png'
        : '/images/paiement/MTN Mobile Money.png';

    const logoSizePx = size === 'sm' ? 24 : size === 'md' ? 28 : 32;

    return (
      <span className="inline-flex items-center space-x-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <span className="relative w-9 h-9 rounded-md bg-white overflow-hidden flex-shrink-0">
          <Image src={logoSrc} alt={method.label} fill className="object-contain" sizes={`${logoSizePx}px`} />
        </span>
        {showLabel && <span className="font-semibold text-body">{method.label}</span>}
      </span>
    );
  }

  const luminance = (() => {
    const hex = method.color.replace('#', '').trim();
    if (hex.length !== 6) return 0.5;
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  })();
  const textColorClass = luminance > 0.6 ? 'text-neutral-dark' : 'text-white';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center space-x-2 rounded-lg font-semibold
        ${sizeClasses[size]}
        ${textColorClass}
      `}
      style={{ backgroundColor: method.color }}
    >
      {/* Icon */}
      <span className="flex-shrink-0">
        {methodId === 'orange_money' ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">OM</text>
          </svg>
        ) : methodId === 'mtn_momo' ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <text x="12" y="15" textAnchor="middle" fill="black" fontSize="8" fontWeight="bold">MoMo</text>
          </svg>
        ) : methodId === 'paypal' ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">PP</text>
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <rect x="3" y="9" width="18" height="2" fill="rgba(255,255,255,0.35)" />
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">CB</text>
          </svg>
        )}
      </span>
      
      {/* Label */}
      {showLabel && (
        <span>{method.label}</span>
      )}
    </span>
  );
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  methods,
}: {
  selectedMethod: string;
  onSelect: (methodId: string) => void;
  methods?: PaymentMethod[];
}) {
  const list = methods || siteConfig.paymentMethods;

  return (
    <div className="space-y-3">
      <p className="font-medium text-body">Choisissez votre mode de paiement</p>
      <div className="grid grid-cols-2 gap-3">
        {list.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              ${selectedMethod === method.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <PaymentBadge methodId={method.id} size="sm" showLabel={false} />
              <span className="font-medium text-sm">{method.label}</span>
            </div>
            
            {/* Selected Indicator */}
            {selectedMethod === method.id && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                ✓
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
