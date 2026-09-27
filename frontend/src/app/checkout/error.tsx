"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ShoppingBag, ArrowLeft } from "lucide-react";
import { Locale, translations } from "../../utils/i18n";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [currentLang, setCurrentLang] = useState<Locale>('de');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('lang') as Locale;
      if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
        setCurrentLang(savedLang);
      }
    } catch {}
    console.error("Checkout runtime boundary caught error:", error);
  }, [error]);

  const handleClearCartAndReset = () => {
    try {
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
    } catch {}
    reset();
  };

  const isRtl = currentLang === 'ar';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xl text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">
          {currentLang === 'ar' ? 'تعذر تحميل صفحة إتمام الطلب' : 'Kassenseite konnte nicht geladen werden'}
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
          {currentLang === 'ar'
            ? 'حدث خطأ مؤقت أثناء مزامنة بيانات السلة أو الجلسة. يمكنك إعادة المحاولة فوراً دون فقدان أي بيانات.'
            : 'Es ist ein vorübergehender Fehler beim Synchronisieren des Warenkorbs oder der Sitzung aufgetreten. Bitte versuchen Sie es erneut.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-[#d40026] hover:bg-[#b0001e] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md hover:shadow-red-700/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'إعادة المحاولة' : 'Erneut versuchen'}</span>
          </button>

          <button
            onClick={handleClearCartAndReset}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-stone-600" />
            <span>{currentLang === 'ar' ? 'إعادة تعيين السلة وتحديث الصفحة' : 'Warenkorb zurücksetzen & neu laden'}</span>
          </button>

          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-semibold pt-2 transition"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span>{currentLang === 'ar' ? 'العودة إلى المتجر' : 'Zurück zum Shop'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
