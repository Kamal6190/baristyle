"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { translations, Locale } from '../../utils/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotDone, setForgotDone] = useState(false);

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
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/shop');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (currentLang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صالحة.' : 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: forgotEmail,
      });
      setForgotMessage(response.data.message);
      setForgotDone(true);
    } catch (err: any) {
      setForgotError(err.response?.data?.message || (currentLang === 'ar' ? 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.'));
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotMessage('');
    setForgotError('');
    setForgotDone(false);
  };

  return (
    <div className={`flex min-h-[calc(100vh-80px)] bg-white relative ${isRtl ? 'flex-row' : 'flex-row-reverse'}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Right side Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent"></div>
        <div className={`absolute bottom-16 text-white ${isRtl ? 'left-16 text-left pr-16' : 'right-16 text-right pl-16'}`}>
          <p className="text-emerald-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">{currentLang === 'ar' ? 'بوابة تجار الجملة B2B' : 'Wholesale Portal'}</p>
          <h2 className="text-4xl font-serif font-bold mb-4 leading-tight">
            {currentLang === 'ar' ? 'أهلاً بك مجدداً' : currentLang === 'de' ? 'Willkommen zurück' : currentLang === 'fr' ? 'Bon retour' : currentLang === 'nl' ? 'Welkom terug' : 'Welcome Back'}
          </h2>
          <p className="text-stone-300 leading-relaxed max-w-md">
            {currentLang === 'ar' ? 'ادخل إلى حسابك للاطلاع على أسعار الجملة الحصرية، وإدارة الطلبات الكبيرة، واكتشاف أحدث المنتجات الحصرية.' : 'Access your exclusive pricing, manage bulk orders, and discover new seasonal arrivals curated for your business.'}
          </p>
        </div>
      </div>

      {/* Left side Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16">
        <div className="max-w-md w-full mx-auto">
          <div className={`mb-12 ${isRtl ? 'text-right' : 'text-left'}`}>
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">{t.signInTitle}</h1>
            <p className="text-stone-500 text-sm">{t.signInSubtitle}</p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-md mb-6 border border-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                {t.emailAddressLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className={isRtl ? 'text-right' : 'text-left'}>
              <div className={`flex justify-between items-center mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  {t.passwordLabel}
                </label>
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); setShowForgotModal(true); }}
                  className="text-xs font-medium text-stone-400 hover:text-stone-900 transition"
                >
                  {t.forgotPasswordLink}
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`}
                placeholder="••••••••"
                required
              />
            </div>

            <div className={`flex items-center gap-2 mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 accent-stone-900" />
              <label htmlFor="remember" className="text-sm text-stone-600">{t.rememberMe}</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 text-white py-4 rounded-sm font-semibold text-sm hover:bg-stone-800 transition mt-8 shadow-sm disabled:opacity-70"
            >
              {loading ? t.signingIn : t.signInTitle}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-stone-100">
            <p className="text-center text-sm text-stone-500">
              {t.dontHaveAccount}{' '}
              <Link href="/register" className="text-stone-900 font-bold hover:underline">{t.applyAsMerchant}</Link>
              {' '}{currentLang === 'ar' ? 'أو' : 'or'}{' '}
              <Link href="/register" className="text-stone-900 font-bold hover:underline">{t.signUpLink}</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={closeForgotModal}
              className={`absolute top-4 text-stone-400 hover:text-stone-900 transition text-2xl leading-none ${isRtl ? 'left-4' : 'right-4'}`}
              aria-label="Close"
            >
              ×
            </button>

            {!forgotDone ? (
              <>
                <div className={`mb-8 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <div className={`w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-xl ${isRtl ? 'mr-0' : 'ml-0'}`}>
                    🔑
                  </div>
                  <h2 className="text-xl font-serif font-bold text-stone-900 mb-1">{t.forgotPasswordLink}</h2>
                  <p className="text-stone-500 text-sm">
                    {currentLang === 'ar' ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين. صالح لمدة ساعة واحدة.' :
                     currentLang === 'de' ? 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen. 1 Stunde gültig.' :
                     currentLang === 'fr' ? 'Entrez votre e-mail et nous vous enverrons un lien de réinitialisation. Valide pendant 1 heure.' :
                     currentLang === 'nl' ? 'Voer uw e-mailadres in en we sturen u een link om uw wachtwoord te herstellen. 1 uur geldig.' :
                     "Enter your email and we'll send you a reset link. Valid for 1 hour."}
                  </p>
                </div>

                {forgotError && (
                  <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-lg mb-6 border border-rose-100">
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                      {t.emailAddressLabel}
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className={`w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition ${isRtl ? 'text-right' : 'text-left'}`}
                      placeholder="your@email.com"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-stone-900 text-white py-3 rounded-sm font-semibold text-sm hover:bg-stone-800 transition shadow-sm disabled:opacity-70"
                  >
                    {forgotLoading ? (currentLang === 'ar' ? 'جاري الإرسال...' : currentLang === 'de' ? 'Wird gesendet...' : currentLang === 'fr' ? 'Envoi...' : currentLang === 'nl' ? 'Verzenden...' : 'Sending...') : 
                     (currentLang === 'ar' ? 'إرسال رابط إعادة التعيين' : currentLang === 'de' ? 'Link zum Zurücksetzen senden' : currentLang === 'fr' ? 'Envoyer le lien de réinitialisation' : currentLang === 'nl' ? 'Herstellink verzenden' : 'Send Reset Link')}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">
                  {currentLang === 'ar' ? 'تحقق من بريدك الإلكتروني' : currentLang === 'de' ? 'E-Mails prüfen' : currentLang === 'fr' ? 'Vérifiez vos e-mails' : currentLang === 'nl' ? 'Controleer je e-mail' : 'Check Your Email'}
                </h2>
                <p className="text-stone-500 text-sm mb-6">{forgotMessage}</p>
                <button
                  onClick={closeForgotModal}
                  className="text-sm font-medium text-stone-900 hover:underline"
                >
                  {t.backToLogin}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
