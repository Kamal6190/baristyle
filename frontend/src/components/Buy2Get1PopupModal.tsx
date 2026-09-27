"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, Gift, ArrowRight, Tag, CheckCircle2, ShieldCheck, Truck } from "lucide-react";
import { detectLocale, Locale } from "../utils/autoLang";
import { translations } from "../utils/i18n";

interface Buy2Get1PopupModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  lang?: string;
}

export default function Buy2Get1PopupModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  lang: externalLang,
}: Buy2Get1PopupModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [lang, setLang] = useState<Locale>("de");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLang = () => {
      const detected =
        (externalLang as Locale) ||
        (localStorage.getItem("lang_manual") as Locale) ||
        (localStorage.getItem("lang") as Locale) ||
        detectLocale() ||
        "de";
      setLang(detected);
    };

    syncLang();
    window.addEventListener("language-changed", syncLang);

    // Auto popup once per session after cookie consent is given and with smooth delay
    if (externalIsOpen === undefined) {
      const checkAndTrigger = () => {
        const hasSeen = sessionStorage.getItem("seen_buy2get1_popup");
        const cookieConsent = localStorage.getItem("baristore_cookie_consent");
        if (!hasSeen && cookieConsent) {
          const timer = setTimeout(() => {
            setInternalIsOpen(true);
            sessionStorage.setItem("seen_buy2get1_popup", "true");
          }, 8000);
          return timer;
        }
        return null;
      };

      const timerRef = checkAndTrigger();
      const onConsent = () => checkAndTrigger();
      window.addEventListener("cookie-consent-updated", onConsent);

      return () => {
        if (timerRef) clearTimeout(timerRef);
        window.removeEventListener("cookie-consent-updated", onConsent);
        window.removeEventListener("language-changed", syncLang);
      };
    }

    return () => {
      window.removeEventListener("language-changed", syncLang);
    };
  }, [externalIsOpen, externalLang]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (externalIsOpen || internalIsOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [externalIsOpen, internalIsOpen]);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  if (!isOpen) return null;

  const t = translations[lang] || translations.de;
  const isRtl = lang === "ar";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-stone-950 border border-stone-800 text-stone-100 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden"
        dir={isRtl ? "rtl" : "ltr"}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Red / Amber Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#d40026] via-amber-400 to-[#d40026]" />

        {/* Ambient Gradient Glows in Background */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#d40026]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 ${isRtl ? "left-4" : "right-4"} p-2 text-stone-400 hover:text-white rounded-full bg-stone-900/90 border border-stone-800 transition-colors z-20 cursor-pointer shadow-md`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 text-center relative z-10">
          {/* Tag Badge */}
          <div className="inline-flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-5 shadow-sm">
            <Tag className="w-3 h-3 text-amber-400" />
            <span>{t.promoTag}</span>
          </div>

          {/* 3-Box Visual Illustration (Exact match to promo banner) */}
          <div className={`flex items-center justify-center gap-3 sm:gap-4 mb-6 ${isRtl ? "flex-row-reverse" : ""}`}>
            {/* Box 1 */}
            <div className="relative">
              <div className="w-16 h-22 sm:w-20 sm:h-28 bg-gradient-to-b from-white/10 to-white/5 border border-white/20 rounded-xl flex flex-col items-center justify-center shadow-xl backdrop-blur-sm">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mb-1.5" />
                <span className="text-[9px] sm:text-[10px] text-white/70 font-bold tracking-widest uppercase">No. 1</span>
              </div>
              <div className={`absolute -top-2 ${isRtl ? "-left-2" : "-right-2"} w-5 h-5 sm:w-6 sm:h-6 bg-[#d40026] rounded-full flex items-center justify-center shadow-lg`}>
                <span className="text-[8px] sm:text-[9px] font-black text-white">✓</span>
              </div>
            </div>

            {/* Plus sign */}
            <span className="text-xl sm:text-2xl font-black text-white/40">+</span>

            {/* Box 2 */}
            <div className="relative">
              <div className="w-16 h-22 sm:w-20 sm:h-28 bg-gradient-to-b from-white/10 to-white/5 border border-white/20 rounded-xl flex flex-col items-center justify-center shadow-xl backdrop-blur-sm">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mb-1.5" />
                <span className="text-[9px] sm:text-[10px] text-white/70 font-bold tracking-widest uppercase">No. 2</span>
              </div>
              <div className={`absolute -top-2 ${isRtl ? "-left-2" : "-right-2"} w-5 h-5 sm:w-6 sm:h-6 bg-[#d40026] rounded-full flex items-center justify-center shadow-lg`}>
                <span className="text-[8px] sm:text-[9px] font-black text-white">✓</span>
              </div>
            </div>

            {/* Equal sign */}
            <span className="text-xl sm:text-2xl font-black text-white/40">=</span>

            {/* Box 3 - FREE Gift */}
            <div className="relative">
              <div className="w-16 h-22 sm:w-20 sm:h-28 bg-gradient-to-b from-[#d40026]/20 to-[#d40026]/35 border border-[#d40026]/50 rounded-xl flex flex-col items-center justify-center shadow-xl shadow-[#d40026]/30 backdrop-blur-sm">
                <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-[#d40026] mb-1.5 animate-bounce" />
                <span className="text-[9px] sm:text-[10px] text-[#d40026] font-black tracking-widest uppercase">
                  {lang === "ar" ? "مجاناً" : lang === "de" ? "GRATIS" : lang === "fr" ? "GRATUIT" : lang === "nl" ? "GRATIS" : "FREE"}
                </span>
              </div>
              {/* Glow ping ring */}
              <div
                className="absolute inset-0 rounded-xl border-2 border-[#d40026]/40 animate-ping pointer-events-none"
                style={{ animationDuration: "2.5s" }}
              />
            </div>
          </div>

          {/* Main Headline */}
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight tracking-tight">
            {lang === "ar" ? (
              <>
                <span className="text-[#d40026]">اشترِ 2</span>{" "}
                <span className="text-white">واحصل على</span>{" "}
                <span className="relative inline-block">
                  <span className="text-amber-400">1 مجاناً</span>
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400/50 rounded-full" />
                </span>
              </>
            ) : lang === "de" ? (
              <>
                <span className="text-[#d40026]">Kaufe 2,</span>{" "}
                <span className="text-white">erhalte </span>
                <span className="relative inline-block">
                  <span className="text-amber-400">1 GRATIS</span>
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400/50 rounded-full" />
                </span>
              </>
            ) : lang === "fr" ? (
              <>
                <span className="text-[#d40026]">Achetez 2,</span>{" "}
                <span className="text-white">obtenez </span>
                <span className="relative inline-block">
                  <span className="text-amber-400">1 GRATUIT</span>
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400/50 rounded-full" />
                </span>
              </>
            ) : lang === "nl" ? (
              <>
                <span className="text-[#d40026]">Koop 2,</span>{" "}
                <span className="text-white">krijg </span>
                <span className="relative inline-block">
                  <span className="text-amber-400">1 GRATIS</span>
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400/50 rounded-full" />
                </span>
              </>
            ) : (
              <>
                <span className="text-[#d40026]">Buy 2,</span>{" "}
                <span className="text-white">Get </span>
                <span className="relative inline-block">
                  <span className="text-amber-400">1 FREE</span>
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-400/50 rounded-full" />
                </span>
              </>
            )}
          </h3>

          {/* Description */}
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-md mx-auto">
            {t.promoDesc}
          </p>

          {/* Action CTA Button */}
          <div className="space-y-3">
            <Link
              href="/shop"
              onClick={handleClose}
              className={`group w-full inline-flex items-center justify-center gap-2.5 bg-[#d40026] hover:bg-[#b0001e] text-white font-bold text-sm uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all duration-300 shadow-xl shadow-[#d40026]/30 hover:-translate-y-0.5 cursor-pointer ${isRtl ? "flex-row-reverse" : ""}`}
            >
              <Gift className="w-4 h-4" />
              <span>{t.promoCta}</span>
              <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </Link>

            <p className="text-stone-400 text-[11px] sm:text-xs italic">
              {t.promoNote}
            </p>
          </div>

          {/* Guarantees / Trust Badges */}
          <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-[11px] text-stone-400 mt-6 pt-5 border-t border-stone-850">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{lang === "ar" ? "تلقائي بالسلة" : "Auto im Warenkorb"}</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{lang === "ar" ? "شحن DHL سريع" : "Schneller DHL Versand"}</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{lang === "ar" ? "أصلي 100%" : "100% Original"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
