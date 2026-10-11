import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import CartDrawer from "@/components/ui/CartDrawer";
import AuthModalHost from "@/components/ui/AuthModalHost";
import ChatFloatingHost from "@/components/ui/ChatFloatingHost";
import DocumentLanguage from "@/components/ui/DocumentLanguage";
import { Toaster } from "react-hot-toast";

export const dynamic = "error";
export const revalidate = false;

export const metadata: Metadata = {
  title: "2dayna2day — Tech Reconditionnée au Cameroun",
  description:
    "Aujourd'hui c'est Aujourd'hui — Votre boutique de MacBooks, montres connectées, casques et accessoires tech reconditionnés. Livraison au Cameroun et Afrique Centrale.",
  keywords: [
    "MacBook",
    "Apple",
    "tech",
    "reconditionné",
    "Cameroun",
    "Douala",
    "Yaoundé",
    "Orange Money",
    "MTN MoMo",
  ],
  openGraph: {
    title: "2dayna2day — Tech Reconditionnée au Cameroun",
    description:
      "MacBooks, montres connectées, casques et accessoires tech reconditionnés",
    type: "website",
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <>
        <NextIntlClientProvider messages={messages} locale={locale}>
        <DocumentLanguage locale={locale} />
        <AuthProvider>
          <ChatProvider>
            <CartProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <CartDrawer />
              <AuthModalHost />
              <ChatFloatingHost />
              <Toaster position="bottom-right" />
            </CartProvider>
          </ChatProvider>
        </AuthProvider>
        </NextIntlClientProvider>
    </>
  );
}
