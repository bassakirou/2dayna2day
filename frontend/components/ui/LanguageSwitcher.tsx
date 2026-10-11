"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/i18n";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // On exclut la langue active
  const availableLocales = locales.filter((l) => l !== locale);

  const switchLocale = (newLocale: string) => {
    // Si l'URL est /fr/boutique, pathname.replace('/fr', '/en') devient /en/boutique
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-500" />
      {availableLocales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className="text-sm font-medium text-gray-500 hover:text-primary uppercase"
        >
          {l}
        </button>
      ))}
    </div>
  );
}
