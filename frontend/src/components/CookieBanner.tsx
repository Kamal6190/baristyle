"use client";

import React, { useState, useEffect } from 'react';
import { Locale } from '../utils/i18n';
import { ShieldAlert, X } from 'lucide-react';

const bannerTranslations = {
  de: {
    title: "Cookie-Einwilligung",
    desc: "Wir verwenden Cookies, um Ihre Erfahrung auf BS Baristore zu verbessern, personalisierte Inhalte anzuzeigen und den Website-Verkehr zu analysieren. Weitere Informationen finden Sie in unserer Datenschutzerklärung.",
    btn_accept: "Alle akzeptieren",
    btn_reject: "Nur essenzielle",
    privacy_policy: "Datenschutzerklärung"
  },
  en: {
    title: "Cookie Consent",
    desc: "We use cookies to enhance your experience on BS Baristore, display personalized content, and analyze our website traffic. For more information, please read our Privacy Policy.",
    btn_accept: "Accept All",
    btn_reject: "Essential Only",
    privacy_policy: "Privacy Policy"
  },
  ar: {
    title: "ملفات تعريف الارتباط (Cookies)",
    desc: "نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك على متجر BS Baristore، وعرض المحتوى المخصص، وتحليل حركة مرور الموقع. لمزيد من المعلومات، يرجى قراءة سياسة الخصوصية الخاصة بنا.",
    btn_accept: "الموافقة على الكل",
    btn_reject: "الضرورية فقط",
    privacy_policy: "سياسة الخصوصية"
  },
  fr: {
    title: "Consentement aux Cookies",
    desc: "Nous utilisons des cookies pour améliorer votre expérience sur BS Baristore, afficher du contenu personnalisé et analyser le trafic de notre site. Pour plus d'informations, veuillez lire notre politique de confidentialité.",
    btn_accept: "Tout accepter",
    btn_reject: "Uniquement essentiels",
    privacy_policy: "Politique de confidentialité"
  },
  nl: {
    title: "Cookie-toestemming",
    desc: "We gebruiken cookies om uw ervaring op BS Baristore te verbeteren, gepersonaliseerde inhoud weer te geven en ons websiteverkeer te analyseren. Lees ons Privacybeleid voor meer informatie.",
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
    const consent = localStorage.getItem('baristore_cookie_consent');
    if (!consent) {
      // Small delay to show the banner smoothly after page load
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (typeof document !== 'undefined') {
          document.body.classList.add('has-cookie-banner');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('language-changed', syncLang);
      if (typeof document !== 'undefined') {
        document.body.classList.remove('has-cookie-banner');
      }
    };
  }, []);

  const handleConsent = (type: 'all' | 'essential') => {
    setIsClosing(true);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('has-cookie-banner');
    }
    try {
      localStorage.setItem('baristore_cookie_consent', type);
      window.dispatchEvent(new Event('cookie-consent-updated'));
    } catch {}
    setTimeout(() => {
      setIsVisible(false);
    }, 350);
  };

  if (!isVisible) return null;

  const t = bannerTranslations[currentLang] || bannerTranslations.de;
  const isRtl = currentLang === 'ar';

  return (
    <div 
      className={`fixed bottom-4 sm:bottom-6 z-[99999] max-w-md w-[calc(100%-2rem)] mx-4 sm:mx-0 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200/90 p-5 sm:p-6 transition-all duration-400 ease-in-out ${
        isClosing 
          ? 'translate-y-8 opacity-0 scale-95' 
          : 'translate-y-0 opacity-100 scale-100'
      } ${
        isRtl 
          ? 'right-4 sm:right-6 text-right' 
          : 'left-4 sm:left-6 text-left'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Banner Header */}
      <div className={`flex items-center gap-2.5 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="p-1.5 bg-[#d40026]/10 text-[#d40026] rounded-full shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h4 className="font-serif font-bold text-stone-900 text-base">{t.title}</h4>
        <button 
          onClick={() => handleConsent('essential')} 
          className={`text-stone-400 hover:text-stone-700 transition ${isRtl ? 'mr-auto' : 'ml-auto'} cursor-pointer`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Banner Body */}
      <p className="text-xs text-stone-500 leading-relaxed mb-5 font-medium">
        {t.desc}{" "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#d40026] font-bold underline cursor-pointer hover:text-[#b0001e]">
          {t.privacy_policy}
        </a>
      </p>

      {/* Banner Actions */}
      <div className={`flex gap-2.5 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        <button 
          onClick={() => handleConsent('all')} 
          className="flex-1 bg-[#d40026] text-white py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#b0001e] transition shadow-sm cursor-pointer text-center"
        >
          {t.btn_accept}
        </button>
        <button 
          onClick={() => handleConsent('essential')} 
          className="flex-1 bg-stone-100 text-stone-700 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition border border-stone-200 cursor-pointer text-center"
        >
          {t.btn_reject}
        </button>
      </div>
    </div>
  );
}
