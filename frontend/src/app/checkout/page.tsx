"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, ShieldCheck, Lock } from "lucide-react";
import axios from "axios";
import { translations, Locale } from "../../utils/i18n";

export default function Checkout() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [b2bConfig, setB2bConfig] = useState<any>({ minimum_order_amount: 2500 });
  const [vatConfig, setVatConfig] = useState<any>({ rate: 19, type: 'inclusive' });

  // Language State
  const [currentLang, setCurrentLang] = useState<Locale>('de');

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
    syncLang();
    window.addEventListener('language-changed', syncLang);
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const fetchConfig = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      try {
        const response = await axios.get(`${apiUrl}/settings`);
        if (response.data.b2b_config) setB2bConfig(response.data.b2b_config);
        if (response.data.vat_config) setVatConfig(response.data.vat_config);
      } catch (error) {
        console.error("Failed to fetch settings config:", error);
      }
    };
    fetchConfig();

    setMounted(true);

    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  const removeItem = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQuantity = (id: string, delta: number) => {
    const newCart = [...cart];
    const item = newCart.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
      const response = await axios.post(`${apiUrl}/checkout/create-session`, {
        items: cart
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Failed to initiate checkout", error);
      alert(currentLang === 'ar' ? "فشل بدء عملية الدفع والشراء. يرجى المحاولة مرة أخرى." : "Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="bg-[#FAF9F6] min-h-screen"></div>;

  const t = translations[currentLang] || translations.de;
  const isRtl = currentLang === 'ar';

  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const shipping = subtotal > 150 ? 0 : 15;

  const isB2B = user?.role === 'SUPER_ADMIN' || user?.role === 'SELLER';
  const minB2BAmount = b2bConfig?.minimum_order_amount || 2500;
  const isUnderB2BMinimum = isB2B && subtotal < minB2BAmount;

  const vatRate = vatConfig?.rate || 19;
  const isExclusive = vatConfig?.type === 'exclusive';
  const vatAmount = isExclusive 
    ? subtotal * (vatRate / 100)
    : subtotal - (subtotal / (1 + vatRate / 100));

  const total = subtotal + shipping + (isExclusive ? vatAmount : 0);

  const vatLabel = {
    ar: isExclusive ? `ضريبة القيمة المضافة (${vatRate}%)` : `ضريبة القيمة المضافة مشمولة (${vatRate}%)`,
    de: isExclusive ? `Zzgl. ${vatRate}% MwSt.` : `Inklusive ${vatRate}% MwSt.`,
    en: isExclusive ? `${vatRate}% VAT` : `Includes ${vatRate}% VAT`,
    fr: isExclusive ? `TVA de ${vatRate}%` : `TVA de ${vatRate}% incluse`,
    nl: isExclusive ? `${vatRate}% BTW` : `Inclusief ${vatRate}% BTW`,
  }[currentLang] || (isExclusive ? `${vatRate}% VAT` : `Includes ${vatRate}% VAT`);

  const b2bErrorMsg = {
    ar: `تنبيه الحد الأدنى لطلب الجملة: الحد الأدنى المطلوب هو €${minB2BAmount} يورو. مجموع سلتك الحالي هو €${subtotal.toFixed(2)} يورو. يرجى إضافة المزيد من المنتجات للمتابعة.`,
    de: `B2B-Mindestbestellwert-Hinweis: Der erforderliche Mindestbestellwert beträgt €${minB2BAmount}. Ihr aktueller Warenkorbwert ist €${subtotal.toFixed(2)}. Bitte fügen Sie weitere Artikel hinzu, um fortzufahren.`,
    en: `B2B Minimum Order Notice: The required minimum order amount is €${minB2BAmount}. Your current cart total is €${subtotal.toFixed(2)}. Please add more items to proceed.`,
    fr: `Avis de commande minimum B2B : Le montant minimum requis est de €${minB2BAmount}. Le total actuel de votre panier est de €${subtotal.toFixed(2)}. Veuillez ajouter d'autres articles pour continuer.`,
    nl: `B2B Minimale bestelwaarschuwing: Het vereiste minimale bestelbedrag is €${minB2BAmount}. Uw huidige winkelwagentotaal is €${subtotal.toFixed(2)}. Voeg meer artikelen toe om door te gaan.`
  }[currentLang] || `B2B Minimum Order Notice: The required minimum order amount is €${minB2BAmount}. Your current cart total is €${subtotal.toFixed(2)}. Please add more items to proceed.`;

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="bg-[#1c1917] text-white text-xs py-2.5 text-center tracking-widest font-medium uppercase">
        {t.secureCheckoutBanner}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <Link href="/shop" className={`inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition mb-8 uppercase tracking-widest ${isRtl ? 'flex-row-reverse' : ''}`}>
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} /> {t.continueShopping}
        </Link>
        
        <h1 className={`text-4xl font-serif font-bold text-stone-900 mb-12 ${isRtl ? 'text-right' : 'text-left'}`}>{t.yourShoppingBag}</h1>

        {isUnderB2BMinimum && (
          <div className="mb-8 p-5 bg-stone-950 border border-stone-800 rounded-sm text-stone-100 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
            <div className={`flex-1 text-sm font-serif leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
              <span className="text-emerald-500 font-bold block mb-1 text-xs uppercase tracking-wider">
                {currentLang === 'ar' ? 'تنبيه بوابة الجملة B2B' : 'B2B Wholesale Portal Notice'}
              </span>
              {b2bErrorMsg}
            </div>
            <Link
              href="/wholesale"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase px-6 py-3 rounded-sm transition shrink-0"
            >
              {currentLang === 'ar' ? 'تصفح كتالوج الجملة' : currentLang === 'de' ? 'B2B-Katalog durchsuchen' : 'Browse Wholesale Catalog'}
            </Link>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-white p-16 rounded border border-stone-200 text-center shadow-sm">
            <h2 className="text-xl text-stone-900 font-serif mb-4">{t.bagIsEmpty}</h2>
            <p className="text-stone-500 mb-8 max-w-md mx-auto text-sm">{t.bagEmptyDesc}</p>
            <Link href="/shop" className="bg-stone-900 text-white px-8 py-4 uppercase tracking-widest font-semibold text-xs hover:bg-black transition rounded-sm inline-block">
              {t.exploreFragrances}
            </Link>
          </div>
        ) : (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-16 ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className={`flex gap-6 bg-white p-6 border border-stone-200 rounded-sm shadow-sm relative group ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-24 h-32 bg-stone-100 flex-shrink-0 rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200&auto=format&fit=crop"} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className={`flex-1 flex flex-col justify-between py-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-stone-900 mb-1">{item.name}</h3>
                      <p className="text-stone-400 text-xs uppercase tracking-wider font-semibold">
                        {item.variant_type || (currentLang === 'ar' ? '١٠٠ مل / إكستري دو بارفان' : '100ml / Extrait de Parfum')}
                      </p>
                    </div>
                    
                    <div className={`flex items-center justify-between mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex border border-stone-300 rounded-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition">-</button>
                        <div className="px-3 py-1.5 text-stone-900 text-sm font-medium border-x border-stone-300 w-10 text-center">{item.quantity}</div>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition">+</button>
                      </div>
                      
                      <div className={isRtl ? 'text-left' : 'text-right'}>
                        <p className="text-lg font-bold text-stone-900">€{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => removeItem(item.id)} className={`absolute top-6 text-stone-300 hover:text-red-500 transition ${isRtl ? 'left-6' : 'right-6'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm sticky top-8">
                <h2 className={`text-xl font-serif font-bold text-stone-900 mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>{t.orderSummary}</h2>
                
                <div className="space-y-4 text-sm text-stone-600 border-b border-stone-200 pb-6 mb-6">
                  <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{t.subtotal}</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{t.shippingLabel}</span>
                    <span>{shipping === 0 ? t.complimentary : `€${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping > 0 && (
                    <div className={`text-xs text-stone-400 mt-2 italic ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.spendMoreForFreeShipping.replace('{diff}', (150 - subtotal).toFixed(2))}
                    </div>
                  )}
                  {/* Dynamic VAT calculation view */}
                  <div className={`flex justify-between ${isExclusive ? 'text-stone-600 font-medium' : 'text-xs text-stone-400 italic'} ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span>{vatLabel}</span>
                    <span>€{vatAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className={`flex justify-between text-lg font-bold text-stone-900 mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span>{t.totalLabel}</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={loading || isUnderB2BMinimum}
                  className="w-full bg-stone-900 text-white py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-black transition rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <><Lock className="w-4 h-4" /> {t.checkoutSecurelyButton}</>
                  )}
                </button>
                
                <div className="mt-6 flex flex-col gap-3 text-xs text-stone-500 text-center border-t border-stone-100 pt-6">
                  <div className={`flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t.secNotice}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2 grayscale opacity-60">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
