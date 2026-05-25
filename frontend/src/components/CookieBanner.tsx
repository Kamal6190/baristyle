"use client";

import React, { useState, useEffect } from 'react';
import { Locale } from '../utils/i18n';
import { ShieldAlert, X } from 'lucide-react';

const bannerTranslations = {
  de: {
    title: "Cookie-Einwilligung",
    desc: "Wir verwenden Cookies, um Ihre Erfahrung auf BariStyle zu verbessern, personalisierte Inhalte anzuzeigen und den Website-Verkehr zu analysieren. Weitere Informationen finden Sie in unserer Datenschutzerklärung.",
    btn_accept: "Alle akzeptieren",
    btn_reject: "Nur essenzielle",
    privacy_policy: "Datenschutzerklärung"
  },
  en: {
    title: "Cookie Consent",
    desc: "We use cookies to enhance your experience on BariStyle, display personalized content, and analyze our website traffic. For more information, please read our Privacy Policy.",
    btn_accept: "Accept All",
    btn_reject: "Essential Only",
    privacy_policy: "Privacy Policy"
  },
  ar: {
    title: "ملفات تعريف الارتباط (Cookies)",
    desc: "نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك على متجر BariStyle، وعرض المحتوى المخصص، وتحليل حركة مرور الموقع. لمزيد من المعلومات، يرجى قراءة سياسة الخصوصية الخاصة بنا.",
    btn_accept: "الموافقة على الكل",
    btn_reject: "الضرورية فقط",
    privacy_policy: "سياسة الخصوصية"
  },
  fr: {
    title: "Consentement aux Cookies",
    desc: "Nous utilisons des cookies pour améliorer votre expérience sur BariStyle, afficher du contenu personnalisé et analyser le trafic de notre site. Pour plus d'informations, veuillez lire notre politique de confidentialité.",
    btn_accept: "Tout accepter",
    btn_reject: "Uniquement essentiels",
    privacy_policy: "Politique de confidentialité"
  },
  nl: {
    title: "Cookie-toestemming",
    desc: "We gebruiken cookies om uw ervaring op BariStyle te verbeteren, gepersonaliseerde inhoud weer te geven en ons websiteverkeer te analyseren. Lees ons Privacybeleid voor meer informatie.",
    btn_accept: "Alles accepteren",
    btn_reject: "Alleen essentiële",
    privacy_policy: "Privacybeleid"
  }
};

export default function CookieBanner() {
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  useEffect(() => {
    syncLang();
    window.addEventListener('language-changed', syncLang);

    // Check if consent has already been given
    const consent = localStorage.getItem('baristyle_cookie_consent');
    if (!consent) {
      // Small delay to show the banner smoothly after page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  const handleConsent = (type: 'all' | 'essential') => {
    setIsClosing(true);
    localStorage.setItem('baristyle_cookie_consent', type);
    setTimeout(() => {
      setIsVisible(false);
    }, 400); // match animation duration
  };

  if (!isVisible) return null;

  const t = bannerTranslations[currentLang] || bannerTranslations.de;
  const isRtl = currentLang === 'ar';

  return (
    <div 
      className={`fixed bottom-6 z-[9999] max-w-md w-[calc(100%-2rem)] mx-4 bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-stone-200 p-5 transition-all duration-400 ease-in-out ${
        isClosing 
          ? 'translate-y-8 opacity-0 scale-95' 
          : 'translate-y-0 opacity-100 scale-100'
      } ${
        isRtl 
          ? 'left-6 text-right' 
          : 'right-6 text-left'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Banner Header */}
      <div className={`flex items-center gap-2.5 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="p-1.5 bg-[#0F8A5F]/10 text-[#0F8A5F] rounded-full shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h4 className="font-serif font-bold text-stone-900 text-base">{t.title}</h4>
        <button 
          onClick={() => handleConsent('essential')} 
          className={`text-stone-400 hover:text-stone-700 transition ${isRtl ? 'margin-right-auto' : 'ml-auto'}`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Banner Body */}
      <p className="text-xs text-stone-500 leading-relaxed mb-5 font-medium">
        {t.desc}{" "}
        <span className="text-[#D4AF37] font-bold underline cursor-pointer hover:text-[#c49f27]">
          {t.privacy_policy}
        </span>
      </p>

      {/* Banner Actions */}
      <div className={`flex gap-3 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        <button 
          onClick={() => handleConsent('all')} 
          className="flex-1 bg-[#0F8A5F] text-white py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#0c6e4c] transition shadow-sm"
        >
          {t.btn_accept}
        </button>
        <button 
          onClick={() => handleConsent('essential')} 
          className="flex-1 bg-stone-100 text-stone-700 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition border border-stone-200"
        >
          {t.btn_reject}
        </button>
      </div>
    </div>
  );
}
