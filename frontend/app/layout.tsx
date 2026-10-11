import { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" });

export default async function RootLayout({ children, params }: { children: ReactNode; params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return <html lang={locale === "en" ? "en" : "fr"}><body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>{children}</body></html>;
}
