"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { detectLocale } from "../utils/autoLang";
import { formatPrice } from "../utils/currency";
import { resolveImageUrl } from "../utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CITIES = [
  { ar: "برلين، ألمانيا", de: "Berlin, Deutschland", en: "Berlin, Germany" },
  { ar: "ميونيخ، ألمانيا", de: "München, Deutschland", en: "Munich, Germany" },
  { ar: "هامبورغ، ألمانيا", de: "Hamburg, Deutschland", en: "Hamburg, Germany" },
  { ar: "فرانكفورت، ألمانيا", de: "Frankfurt, Deutschland", en: "Frankfurt, Germany" },
  { ar: "دبي، الإمارات", de: "Dubai, VAE", en: "Dubai, UAE" },
  { ar: "فيينا، النمسا", de: "Wien, Österreich", en: "Vienna, Austria" },
  { ar: "كولونيا، ألمانيا", de: "Köln, Deutschland", en: "Cologne, Germany" },
];

const TIMES_AGO = [
  { ar: "قبل 2 دقيقة", de: "vor 2 Min.", en: "2 mins ago" },
  { ar: "قبل 5 دقائق", de: "vor 5 Min.", en: "5 mins ago" },
  { ar: "قبل 9 دقائق", de: "vor 9 Min.", en: "9 mins ago" },
  { ar: "قبل 14 دقيقة", de: "vor 14 Min.", en: "14 mins ago" },
];

export default function LivePurchaseNotification() {
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lang, setLang] = useState("de");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const detected = detectLocale() || "de";
      setLang(detected);
    }
  }, []);

  // Fetch real active products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products`);
        const list = Array.isArray(response.data) ? response.data : response.data.products || [];
        const activeOnly = list.filter((p: any) => p && (p.stock_quantity === undefined || p.stock_quantity > 0));
        if (activeOnly.length > 0) {
          setProducts(activeOnly);
        }
      } catch (err) {
        console.error("Live notification fetch error:", err);
      }
    };
    fetchProducts();
  }, []);

  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkConsent = () => {
        const c = localStorage.getItem('baristore_cookie_consent');
        if (c) setConsentGiven(true);
      };
      checkConsent();
      window.addEventListener('cookie-consent-updated', checkConsent);
      return () => window.removeEventListener('cookie-consent-updated', checkConsent);
    }
  }, []);

  useEffect(() => {
    if (!consentGiven || isDismissed || products.length === 0) return;

    // Initial show after 4 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Loop interval
    const loopInterval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
        setIsVisible(true);
      }, 1000);
    }, 16000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(loopInterval);
    };
  }, [isDismissed, products]);

  if (isDismissed || !isVisible || products.length === 0) return null;

  const currentProd = products[currentIndex];
  if (!currentProd) return null;

  const isAr = lang === "ar";
  const cityObj = CITIES[currentIndex % CITIES.length];
  const timeObj = TIMES_AGO[currentIndex % TIMES_AGO.length];

  const cityStr = cityObj[lang as keyof typeof cityObj] || cityObj.de;
  const timeStr = timeObj[lang as keyof typeof timeObj] || timeObj.de;

  const productName = typeof currentProd.name === "object"
    ? currentProd.name[lang] || currentProd.name.de || currentProd.name.ar || currentProd.title
    : String(currentProd.name || currentProd.translations?.[lang] || "Perfume");

  const price = currentProd.sales_price_with_tax || currentProd.price || currentProd.retail_price || 89;
  const image = resolveImageUrl(currentProd.image_url) || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=200&auto=format&fit=crop";
  const prodId = currentProd.sku || currentProd.id;

  return (
    <div
      className={`fixed bottom-24 lg:bottom-6 ${
        isAr ? "left-3 right-3 lg:left-6 lg:right-auto" : "left-3 right-3 lg:left-auto lg:right-6"
      } z-40 max-w-sm bg-stone-900/95 border border-amber-500/30 text-stone-100 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md transition-all duration-500 animate-in slide-in-from-bottom-5`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 p-1 text-stone-400 hover:text-white rounded-full bg-stone-800/60 transition-colors cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-3.5">
        <Link 
          href={`/shop/${prodId}`}
          className="w-14 h-16 shrink-0 rounded-xl overflow-hidden border border-amber-500/20 bg-stone-850 block group"
        >
          <img
            src={image}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </Link>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isAr ? `عميل في ${cityStr} اشترى للتو` : lang === "de" ? `Jemand in ${cityStr} hat gekauft` : `Someone in ${cityStr} bought`}
            </span>
          </div>

          <Link
            href={`/shop/${prodId}`}
            className="font-serif font-bold text-stone-100 text-xs truncate block hover:text-amber-300 transition-colors"
          >
            {productName}
          </Link>

          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-amber-400 font-bold text-xs">{formatPrice(price)}</span>
            <span className="text-[10px] text-stone-400 font-medium">{timeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

