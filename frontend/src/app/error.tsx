"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Locale } from "../utils/i18n";

export default function GlobalError({
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
    console.error("Global client error boundary:", error);
  }, [error]);

  const isRtl = currentLang === 'ar';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-16" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 shadow-xl text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">
          {currentLang === 'ar' ? 'حدث خطأ غير متوقع' : 'Ein unerwarteter Fehler ist aufgetreten'}
        </h1>

        <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
          {currentLang === 'ar'
            ? 'نعتذر عن هذا الخطأ المؤقت. يرجى إعادة تحميل الصفحة أو العودة إلى الصفحة الرئيسية.'
            : 'Wir entschuldigen uns für die Unannehmlichkeiten. Bitte laden Sie die Seite neu oder kehren Sie zur Startseite zurück.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-stone-900 hover:bg-black text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{currentLang === 'ar' ? 'إعادة تحميل الصفحة' : 'Seite neu laden'}</span>
          </button>

          <Link
            href="/"
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition block text-center"
          >
            <Home className="w-4 h-4 text-stone-600" />
            <span>{currentLang === 'ar' ? 'العودة للصفحة الرئيسية' : 'Zur Startseite'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
