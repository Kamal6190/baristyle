"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { translations, Locale } from '../../utils/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Register() {
  const router = useRouter();
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Business State
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Language State
  const [currentLang, setCurrentLang] = useState<Locale>('de');

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  useEffect(() => {
    syncLang();
    window.addEventListener('language-changed', syncLang);
    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  const t = translations[currentLang] || translations.de;
  const isRtl = currentLang === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Combine names
    let fullName = `${firstName} ${lastName}`.trim();
    if (isBusiness && companyName) {
      fullName = `${fullName} (${companyName})`;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: fullName,
        email,
        password,
        role: isBusiness ? 'SELLER' : 'CUSTOMER'
      });

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (currentLang === 'ar' ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-[calc(100vh-80px)] bg-white ${isRtl ? 'flex-row-reverse' : 'flex-row'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Left side Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-stone-900 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80 transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent"></div>
        <div className={`absolute bottom-16 text-white ${isRtl ? 'right-16 text-right pl-16' : 'left-16 text-left pr-16'}`}>
          <p className="text-emerald-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">
            {currentLang === 'ar' ? 'العضوية الحصرية' : currentLang === 'de' ? 'Mitgliedschaft' : currentLang === 'fr' ? 'Adhésion' : currentLang === 'nl' ? 'Lidmaatschap' : 'Membership'}
          </p>
          <h2 className="text-4xl font-serif font-bold mb-4 leading-tight">{t.joinCircleTitle}</h2>
          <p className="text-stone-300 leading-relaxed max-w-md">{t.joinCircleDesc}</p>
        </div>
      </div>

      {/* Right side Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className={`mb-10 ${isRtl ? 'text-right' : 'text-left'}`}>
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">{t.createAccountTitle}</h1>
            <p className="text-stone-500 text-sm">{t.createAccountSubtitle}</p>
          </div>

          {success ? (
             <div className="bg-emerald-50 text-emerald-800 p-6 rounded-md text-center border border-emerald-100">
               <h3 className="font-bold text-lg mb-2">
                 {currentLang === 'ar' ? 'تم إنشاء الحساب بنجاح!' : currentLang === 'de' ? 'Konto erstellt!' : currentLang === 'fr' ? 'Compte créé !' : currentLang === 'nl' ? 'Account aangemaakt!' : 'Account Created!'}
               </h3>
               <p className="text-sm">
                 {currentLang === 'ar' ? 'مرحباً بك في باري ستايل. جاري توجيهك لصفحة تسجيل الدخول...' : 'Welcome to BariStyle. Redirecting you to login...'}
               </p>
             </div>
          ) : (
            <>
              {/* Account Type Toggle */}
              <div className="flex bg-stone-100 p-1.5 rounded-md mb-8">
                <button 
                  type="button"
                  onClick={() => setIsBusiness(false)}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded transition-all ${!isBusiness ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {t.personalAccount}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsBusiness(true)}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded transition-all flex items-center justify-center gap-2 ${isBusiness ? 'bg-[#1A1F2C] text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {t.merchantB2BAccount}
                </button>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-md mb-6 border border-rose-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {isBusiness && (
                  <div className="p-5 bg-[#F8F9FA] rounded-md border border-stone-200 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className={`text-sm font-bold text-stone-900 mb-4 border-b border-stone-200 pb-2 ${isRtl ? 'text-right' : 'text-left'}`}>{t.businessInfoTitle}</h3>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.companyNameLabel}</label>
                          <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} placeholder="Luxe Retailers LLC" required={isBusiness} />
                        </div>
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.vatTaxIdLabel}</label>
                          <input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} placeholder="DE123456789" required={isBusiness} />
                        </div>
                      </div>
                      <div className={isRtl ? 'text-right' : 'text-left'}>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.businessTypeLabel}</label>
                        <select value={businessType} onChange={e => setBusinessType(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} required={isBusiness}>
                          <option value="">{t.selectCategory}</option>
                          <option value="retail">{t.retailBoutique}</option>
                          <option value="distributor">{t.regionalDistributor}</option>
                          <option value="online">{t.onlineEcommerce}</option>
                          <option value="hospitality">{t.hospitalityHotel}</option>
                        </select>
                      </div>
                      <div className={isRtl ? 'text-right' : 'text-left'}>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.websiteUrlLabel}</label>
                        <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} placeholder="https://www.example.com" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-5">
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.firstNameLabel}</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} placeholder="John" required />
                  </div>
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.lastNameLabel}</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} placeholder="Doe" required />
                  </div>
                </div>

                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.emailAddressLabel}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} placeholder="john@example.com" required />
                </div>

                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.passwordLabel}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`} placeholder="••••••••" required />
                </div>

                <button type="submit" disabled={loading} className={`w-full py-4 rounded-sm font-semibold text-sm transition mt-8 flex items-center justify-center gap-2 disabled:opacity-70 ${isRtl ? 'flex-row-reverse' : ''} ${isBusiness ? 'bg-[#1A1F2C] text-white hover:bg-black' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                  {loading ? t.processing : (isBusiness ? t.submitMerchantApp : t.createAccountButton)}
                  {!loading && <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm text-stone-500">
            {t.alreadyHaveAccount} <Link href="/login" className="text-stone-900 font-bold hover:underline">{currentLang === 'ar' ? 'سجل دخولك' : currentLang === 'de' ? 'Einloggen' : currentLang === 'fr' ? 'Se connecter' : currentLang === 'nl' ? 'Inloggen' : 'Log in'}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
