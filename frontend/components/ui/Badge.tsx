import { Zap, Check } from "lucide-react";
import React from "react";

export type BadgeType = "sale" | "promo" | "new" | "flash" | "stock" | "low_stock";

interface BadgeProps {
  type: BadgeType;
  label?: string;
  className?: string;
}

export function Badge({ type, label, className = "" }: BadgeProps) {
  // .badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; letter-spacing: .02em; }
  const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide";

  switch (type) {
    case "sale":
      return (
        <span className={`${baseClasses} bg-primary text-white ${className}`}>
          {label || "Stock limité"}
        </span>
      );
    case "promo":
      return (
        <span className={`${baseClasses} bg-accent-red text-white ${className}`}>
          {label || "Promo"}
        </span>
      );
    case "new":
      return (
        <span className={`${baseClasses} bg-primary text-white ${className}`}>
          {label || "Nouveau"}
        </span>
      );
    case "flash":
      return (
        <span className={`${baseClasses} bg-primary text-white ${className}`}>
          <Zap className="w-3 h-3 fill-white" />
          {label || "Vente flash"}
        </span>
      );
    case "stock":
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 ${className}`}>
          <Check className="w-3 h-3" />
          {label || "En stock"}
        </span>
      );
    case "low_stock":
      return (
        <span className={`${baseClasses} bg-neutral-light text-body ${className}`}>
          {label}
        </span>
      );
    default:
      return null;
  }
}
