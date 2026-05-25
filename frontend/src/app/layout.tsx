import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BariStyle | Luxury E-Commerce",
  description: "Redefining Luxury Procurement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
        <Header />

        <main className="flex-grow">
          {children}
        </main>

        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
