"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, User, Globe, Search, LogOut, LayoutDashboard, UserCheck, Check, ChevronDown, Menu, X, Heart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { translations, Locale, LANGUAGES } from "../utils/i18n";
import { detectLocale, saveManualLocale, applyLocaleToDocument } from "../utils/autoLang";
import axios from "axios";
import { resolveImageUrl } from "../utils/api";
import { CURRENCIES, getActiveCurrency, setActiveCurrency, refreshExchangeRates, formatPrice } from "../utils/currency";
import SmartSearch from "./SmartSearch";
import { useWishlist } from "./WishlistProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getCategoryImage = (cat: any) => {
  if (cat.image_url) return resolveImageUrl(cat.image_url);
  const slug = (cat.slug || "").toLowerCase();
  if (slug.includes("oud") || slug.includes("oil")) {
    return "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=400&auto=format&fit=crop";
  }
  if (slug.includes("unisex")) {
    return "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400&auto=format&fit=crop";
  }
  if (slug.includes("herren") || slug.includes("men")) {
    return "https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=400&auto=format&fit=crop";
  }
  if (slug.includes("damen") || slug.includes("women") || slug.includes("duft")) {
    return "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=400&auto=format&fit=crop";
  }
  if (slug.includes("extrait")) {
    return "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=400&auto=format&fit=crop";
  }
  if (slug.includes("reef")) {
    return "https://sandaroma.de/wp-content/uploads/2025/10/Reef-30-White.jpg.webp";
  }
  return "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?q=80&w=400&auto=format&fit=crop";
};

const getProductsText = (count: number, lang: string) => {
  if (lang === 'ar') return `${count} منتج`;
  if (lang === 'de') return `${count} Produkte`;
  if (lang === 'fr') return `${count} Produits`;
  if (lang === 'nl') return `${count} Producten`;
  return `${count} Products`;
};

// Resolve display name from multilingual name object or plain string
const getCatName = (cat: any, lang: string): string => {
  if (!cat.name) return cat.slug || '';
  if (typeof cat.name === 'string') {
    try {
      const parsed = JSON.parse(cat.name);
      return parsed[lang] || parsed['de'] || parsed['en'] || cat.slug || '';
    } catch {
      return cat.name;
    }
  }
  if (typeof cat.name === 'object') {
    return cat.name[lang] || cat.name['de'] || cat.name['en'] || cat.slug || '';
  }
  return cat.slug || '';
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Language States
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');

  // Currency States
  const [activeCurrency, setActiveCurrencyState] = useState('EUR');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const updateCartItems = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    const count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    setCartCount(count);
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    const updated = cartItems.map(item => item.id === itemId ? { ...item, quantity: newQty } : item);
    localStorage.setItem('cart', JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = cartItems.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const checkUser = () => {
    const savedUser = localStorage.getItem('user');
    setUser(savedUser ? JSON.parse(savedUser) : null);
  };

  const syncLang = () => {
    const locale = detectLocale() as any;
    setCurrentLang(locale);
    applyLocaleToDocument(locale);
  };

  const syncCurrency = () => {
    setActiveCurrencyState(getActiveCurrency());
  };

  useEffect(() => {
    updateCartItems();
    checkUser();
    syncLang();
    syncCurrency();
    refreshExchangeRates();

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories`);
        setCategories(res.data);
      } catch (error) {
        console.error("Failed to fetch categories inside header", error);
      }
    };
    fetchCategories();

    // Fetch logo
    const fetchLogo = async () => {
      try {
        const res = await axios.get(`${API_URL}/settings/logo_url`);
        if (res.data) setLogoUrl(res.data);
      } catch { }
    };
    fetchLogo();

    const handleOpenDrawer = () => {
      updateCartItems();
      setCartDrawerOpen(true);
    };

    window.addEventListener('cart-updated', updateCartItems);
    window.addEventListener('open-cart-drawer', handleOpenDrawer);
    window.addEventListener('user-logged-in', checkUser);
    window.addEventListener('language-changed', syncLang);
    window.addEventListener('currency-changed', syncCurrency);

    // Close dropdowns on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(e.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('cart-updated', updateCartItems);
      window.removeEventListener('open-cart-drawer', handleOpenDrawer);
      window.removeEventListener('user-logged-in', checkUser);
      window.removeEventListener('language-changed', syncLang);
      window.removeEventListener('currency-changed', syncCurrency);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (cartDrawerOpen) {
        document.body.classList.add('cart-drawer-open');
      } else {
        document.body.classList.remove('cart-drawer-open');
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('cart-drawer-open');
      }
    };
  }, [cartDrawerOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    window.dispatchEvent(new Event('cart-updated'));
    router.push('/');
  };

  const handleLanguageChange = (langCode: any) => {
    const mappedLang = ['it', 'es', 'pl'].includes(langCode) ? 'en' : langCode;
    saveManualLocale(mappedLang);
    setCurrentLang(mappedLang);
    setShowLangDropdown(false);
    window.dispatchEvent(new Event('language-changed'));
    applyLocaleToDocument(mappedLang);

    // Sync Google Translate widget for dynamic product content
    const googleLangMap: Record<string, string> = {
      de: 'de', fr: 'fr', en: 'en', ar: 'ar', nl: 'nl', it: 'it', es: 'es', pl: 'pl'
    };
    const gLang = googleLangMap[langCode] || 'de';

    // Update cookie so Google Translate knows the target language
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `googtrans=/de/${gLang}; expires=${expires.toUTCString()}; path=/`;
    document.cookie = `googtrans=/de/${gLang}; expires=${expires.toUTCString()}; path=/; domain=${window.location.hostname}`;

    // Trigger the hidden Google Translate select element
    const select = document.querySelector('.goog-te-combo, #google_translate_element select') as HTMLSelectElement;
    if (select) {
      select.value = gLang;
      select.dispatchEvent(new Event('change'));
    } else {
      // Reload page to apply translation via cookie
      window.location.reload();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      if (window.location.pathname === '/shop') {
        setTimeout(() => window.dispatchEvent(new Event('shop-route-changed')), 100);
      }
    }
  };

  const t = translations[currentLang] || translations.de;
  const isRtl = currentLang === 'ar';
  const activeLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  // ── Build parent / children tree from flat or nested API response ──────────
  const parentCategories = categories.filter((c: any) => !c.parent_id);
  const getChildren = (parentItem: any) => {
    if (parentItem?.children && Array.isArray(parentItem.children) && parentItem.children.length > 0) {
      return parentItem.children;
    }
    return categories.filter((c: any) => c.parent_id === (parentItem?.id || parentItem));
  };

  // ── Nav link helper (fires shop-route-changed when already on /shop) ──────
  const navLinkProps = (href: string) => ({
    href,
    onClick: () => {
      if (window.location.pathname === '/shop') {
        setTimeout(() => window.dispatchEvent(new Event('shop-route-changed')), 100);
      }
    },
  });

  // Never render customer storefront header inside backoffice admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-stone-200 shadow-sm">

      {/* ── Row 1 : Top service strip ──────────────────────────────────────── */}
      <div className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[11px] sm:text-xs py-1.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            <span className="hover:text-[#d40026] cursor-pointer transition-colors">
              {isRtl ? 'خدمة العملاء 24/7' : '24/7 Service'}
            </span>
            <span className="hidden sm:inline text-stone-300">|</span>
            <span className="hidden sm:inline hover:text-[#d40026] cursor-pointer transition-colors">
              {isRtl ? 'توصيل مجاني للطلبات فوق 50 يورو' : 'Gratis Versand ab 50€'}
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/wholesale" className="font-bold text-[#d40026] hover:text-[#b0001e] transition-colors">
              {t.wholesale}
            </Link>
            <span className="text-stone-300">|</span>
            <Link href="/profile" className="hover:text-[#d40026] transition-colors">
              {isRtl ? 'تتبع الشحنة' : 'Bestellungen verfolgen'}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Row 2 : Logo + Search + Actions ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">

          {/* Logo — translate="no" prevents Google Translate from touching the brand name */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" translate="no" aria-label="BS Baristore Homepage">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveImageUrl(logoUrl)} alt="BS Baristore" className="h-10 w-auto object-contain" translate="no" />
            ) : (
              <>
                <div className="notranslate bg-[#d40026] text-white px-3.5 py-1.5 rounded font-black text-2xl tracking-tighter flex items-center justify-center shadow-sm" translate="no">
                  BS
                </div>
                <span className="notranslate text-2xl font-black tracking-tight text-stone-900 font-sans hidden sm:inline" translate="no">
                  Baristore
                </span>
              </>
            )}
          </Link>

          {/* Search bar — visible on md+ only; on mobile it's toggled separately */}
          <SmartSearch
            lang={currentLang}
            className="hidden md:flex flex-1 max-w-xl mx-2 sm:mx-8"
            onNavigate={() => setMobileMenuOpen(false)}
          />

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">

            {/* Mobile Search Icon — visible only on small screens */}
            <button
              className="md:hidden p-1.5 text-stone-700 hover:text-[#d40026] transition-colors"
              onClick={() => { setMobileSearchOpen(!mobileSearchOpen); setMobileMenuOpen(false); }}
              aria-label="Toggle search"
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Currency Selector */}
            <div className="relative hidden md:block" ref={currencyDropdownRef}>
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 px-2 sm:px-3 py-1.5 rounded border border-stone-200 transition cursor-pointer"
              >
                <span className="text-base">{CURRENCIES.find(c => c.code === activeCurrency)?.flag}</span>
                <span className="uppercase">{activeCurrency}</span>
              </button>

              {showCurrencyDropdown && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-3 w-44 bg-white border border-stone-200 shadow-xl rounded-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4 py-1.5 border-b border-stone-100 text-left rtl:text-right">
                    {currentLang === 'ar' ? 'اختر العملة' : 'Select Currency'}
                  </p>
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setActiveCurrency(curr.code);
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-start hover:bg-stone-50 transition-colors cursor-pointer ${activeCurrency === curr.code ? 'font-bold text-stone-950' : 'text-stone-600'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{curr.flag}</span>
                        <span>{curr.code} - {curr.label}</span>
                      </span>
                      {activeCurrency === curr.code && <Check className="w-3.5 h-3.5 text-[#d40026]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative hidden md:block" ref={langDropdownRef}>
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 px-2 sm:px-3 py-1.5 rounded border border-stone-200 transition cursor-pointer"
              >
                <Globe className="w-4 h-4 text-stone-500" />
                <span className="hidden lg:inline-block">{activeLanguage.name}</span>
                <span className="text-base">{activeLanguage.flag}</span>
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-3 w-48 bg-white border border-stone-200 shadow-xl rounded-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4 py-1.5 border-b border-stone-100">
                    Select Language
                  </p>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-start hover:bg-stone-50 transition-colors cursor-pointer ${currentLang === lang.code ? 'font-bold text-stone-950' : 'text-stone-600'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-[#d40026]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Account */}
            <div className="relative" ref={userDropdownRef}>
              {user ? (
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1 font-semibold text-xs sm:text-sm text-stone-950 cursor-pointer hover:text-stone-700 transition-colors"
                >
                  <UserCheck className="w-5 h-5 text-[#d40026]" />
                  <span className="hidden md:inline max-w-[100px] truncate">{user.name}</span>
                </button>
              ) : (
                <Link href="/login" className="hover:text-stone-900 transition-colors" aria-label="Account Login">
                  <User className="w-5 h-5 text-stone-600" />
                </Link>
              )}

              {showDropdown && user && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-3 w-56 bg-white border border-stone-200 shadow-xl rounded-md py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2.5 border-b border-stone-100">
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">{t.signedInAs}</p>
                    <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                  </div>
                  <Link href="/profile" onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                    <User className="w-4 h-4" /> {t.profile}
                  </Link>
                  {user.role === 'SUPER_ADMIN' && (
                    <Link href="/admin" onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> {t.adminPanel}
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-stone-100 mt-2 text-left cursor-pointer font-medium">
                    <LogOut className="w-4 h-4" /> {t.logout}
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <WishlistHeaderIcon />

            {/* Cart */}
            <button 
              onClick={() => { updateCartItems(); setCartDrawerOpen(true); }}
              className="hover:text-stone-900 transition-colors relative p-1.5 cursor-pointer bg-transparent border-0"
              aria-label="Open Cart"
            >
              <ShoppingCart className="w-5 h-5 text-stone-600" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#d40026] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-in zoom-in duration-300">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 text-stone-700 hover:text-[#d40026] transition-colors"
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setMobileSearchOpen(false); }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Search Bar Row ──────────────────────────────────────────── */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 py-2.5 bg-white border-t border-stone-100 shadow-sm">
          <SmartSearch
            lang={currentLang}
            className="w-full"
            onNavigate={() => { setMobileSearchOpen(false); setMobileMenuOpen(false); }}
          />
        </div>
      )}

      {/* ── Row 3 : Dynamic Category Navigation Bar ───────────────────────── */}
      <div className="border-t border-stone-100 bg-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1 py-0 text-sm font-semibold text-stone-700">

            {/* "All Products" fixed link */}
            <Link
              {...navLinkProps('/shop')}
              className="flex-shrink-0 px-4 py-3 hover:text-[#d40026] hover:bg-red-50 transition-colors rounded-none whitespace-nowrap border-b-2 border-transparent hover:border-[#d40026]"
            >
              {t.shop}
            </Link>

            {/* Dynamic parent categories with dropdown children */}
            {parentCategories.map((parent: any) => {
              const parentName = getCatName(parent, currentLang);
              const children = getChildren(parent);
              const hasChildren = children.length > 0;

              return (
                <div
                  key={parent.id}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => setHoveredCategory(parent.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  {/* Parent label */}
                  <Link
                    {...navLinkProps(`/shop?category=${parent.slug || parent.id}`)}
                    className={`flex items-center gap-1 px-4 py-3 whitespace-nowrap transition-colors border-b-2 ${hoveredCategory === parent.id
                      ? 'border-[#d40026] text-[#d40026]'
                      : 'border-transparent text-stone-700 hover:text-[#d40026]'
                      } ${hasChildren ? 'pr-3' : ''}`}
                  >
                    {parentName}
                    {hasChildren && (
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${hoveredCategory === parent.id
                        ? 'opacity-100 rotate-180 text-[#d40026]'
                        : 'opacity-50 rotate-0'
                        }`} />
                    )}
                  </Link>

                  {/* Children dropdown — only if there are children */}
                  {hasChildren && (
                    <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} pt-0 min-w-[220px] transition-all duration-200 z-50 origin-top ${hoveredCategory === parent.id
                      ? 'opacity-100 visible scale-100'
                      : 'opacity-0 invisible scale-95'
                      }`}>
                      {/* small top bridge to prevent gap-hover-loss */}
                      <div className="h-0.5 bg-[#d40026] w-full" />
                      <div className="bg-white border border-stone-200 shadow-xl rounded-b-xl overflow-hidden">
                        {/* Header row */}
                        <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {parentName}
                          </span>
                          <Link
                            {...navLinkProps(`/shop?category=${parent.slug || parent.id}`)}
                            className="text-[10px] font-bold text-[#d40026] hover:underline"
                          >
                            {isRtl ? 'الكل' : 'Alle'}
                          </Link>
                        </div>

                        {/* Children list */}
                        <ul className="py-1.5">
                          {children.map((child: any) => {
                            const childName = getCatName(child, currentLang);
                            const childCount = child._count?.products || 0;
                            return (
                              <li key={child.id}>
                                <Link
                                  {...navLinkProps(`/shop?category=${child.slug || child.id}`)}
                                  className="flex items-center justify-between px-4 py-2.5 text-sm text-stone-700 hover:bg-red-50 hover:text-[#d40026] transition-colors group/child"
                                >
                                  <span className="flex items-center gap-2">
                                    {/* colored dot */}
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover/child:bg-[#d40026] transition-colors flex-shrink-0" />
                                    <span className="font-medium">{childName}</span>
                                  </span>
                                  {childCount > 0 && (
                                    <span className="text-[10px] text-stone-400 font-semibold bg-stone-100 px-1.5 py-0.5 rounded-full">
                                      {childCount}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}


          </nav>
        </div>
      </div>

      {/* ── Mobile Menu Drawer ────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-200 shadow-lg overflow-y-auto max-h-[70vh]" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* All products */}
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-5 py-3.5 text-sm font-bold text-stone-900 border-b border-stone-100 hover:bg-stone-50"
          >
            {t.shop}
          </Link>

          {/* Dynamic parent → children */}
          {parentCategories.map((parent: any) => {
            const parentName = getCatName(parent, currentLang);
            const children = getChildren(parent);
            const isExpanded = mobileExpandedCat === parent.id;

            return (
              <div key={parent.id} className="border-b border-stone-100">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <Link
                    href={`/shop?category=${parent.slug || parent.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-bold text-stone-900 flex-1"
                  >
                    {parentName}
                  </Link>
                  {children.length > 0 && (
                    <button
                      onClick={() => setMobileExpandedCat(isExpanded ? null : parent.id)}
                      className="p-1 text-stone-500 hover:text-[#d40026] transition-colors"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Children accordion */}
                {isExpanded && children.length > 0 && (
                  <div className="bg-stone-50 border-t border-stone-100">
                    {children.map((child: any) => (
                      <Link
                        key={child.id}
                        href={`/shop?category=${child.slug || child.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 py-2.5 text-sm text-stone-600 hover:text-[#d40026] hover:bg-red-50 transition-colors ${isRtl ? 'pr-10 pl-5' : 'pl-10 pr-5'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d40026] flex-shrink-0" />
                        {getCatName(child, currentLang)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* B2B link */}
          <Link
            href="/wholesale"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center px-5 py-3.5 text-sm font-bold text-[#d40026] border-b border-stone-100 hover:bg-red-50"
          >
            B2B {isRtl ? 'الجملة' : 'Großhandel'}
          </Link>

          {/* Mobile Language and Currency Selectors */}
          <div className="bg-stone-50 p-5 border-t border-stone-200/80 flex flex-col gap-4">
            {/* Language Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-left rtl:text-right">
                {currentLang === 'ar' ? 'اللغة' : 'Language'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex items-center justify-between px-3 py-2 border rounded text-xs transition cursor-pointer bg-white ${currentLang === lang.code ? 'border-[#d40026] text-stone-950 font-bold bg-red-50/20' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {currentLang === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-[#d40026]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-left rtl:text-right">
                {currentLang === 'ar' ? 'العملة' : 'Currency'}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => setActiveCurrency(curr.code)}
                    className={`flex flex-col items-center justify-center py-2 border rounded text-xs transition cursor-pointer bg-white ${activeCurrency === curr.code ? 'border-[#d40026] text-stone-950 font-bold bg-red-50/20' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    <span className="text-base mb-0.5">{curr.flag}</span>
                    <span className="uppercase font-semibold text-[10px]">{curr.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── B2B promo strip (only for guests) ─────────────────────────────── */}
      {!user && (
        <div className="bg-[#1a1a1a] text-stone-300 text-[11px] sm:text-xs py-2 text-center px-4">
          {t.b2bBanner}{' '}
          <Link href="/login" className="text-white font-bold underline hover:text-[#d40026] transition-colors">
            {t.b2bBannerLink}
          </Link>{' '}
          {t.b2bBannerDesc}
        </div>
      )}
      {/* Slide-out Cart Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-[999999] overflow-hidden font-sans">
          {/* Backdrop */}
          <div 
            onClick={() => setCartDrawerOpen(false)}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />
          
          {/* Panel */}
          <div 
            className="absolute inset-y-0 right-0 w-full sm:w-[420px] max-w-full flex"
            style={{ direction: currentLang === 'ar' ? 'rtl' : 'ltr' }}
          >
            <div className="w-full bg-white shadow-2xl flex flex-col justify-between h-full animate-in slide-in-from-right duration-300">
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-stone-900" />
                  <h2 className="text-base font-serif font-black text-stone-900">
                    {currentLang === 'ar' ? 'سلة التسوق' : 
                     currentLang === 'de' ? 'Warenkorb' : 
                     currentLang === 'fr' ? 'Votre Panier' : 
                     currentLang === 'nl' ? 'Winkelwagen' : 'Your Shopping Cart'}
                    <span className="text-xs text-stone-400 font-bold ml-2 rtl:mr-2 rtl:ml-0">({cartItems.length})</span>
                  </h2>
                </div>
                <button 
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center transition cursor-pointer shrink-0"
                  aria-label="Close cart"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Items */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {cartItems.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-stone-50 rounded-full border border-stone-100 flex items-center justify-center mx-auto text-stone-300 shadow-inner">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-stone-500">
                      {currentLang === 'ar' ? 'سلتك فارغة حالياً' : 
                       currentLang === 'de' ? 'Ihr Warenkorb ist leer' : 
                       currentLang === 'fr' ? 'Votre panier est vide' : 
                       currentLang === 'nl' ? 'Uw winkelwagen is leeg' : 'Your cart is empty'}
                    </p>
                    <button 
                      onClick={() => setCartDrawerOpen(false)}
                      className="px-6 py-2.5 bg-stone-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition rounded"
                    >
                      {currentLang === 'ar' ? 'متابعة التسوق' : 'Weiter einkaufen'}
                    </button>
                  </div>
                ) : (
                  cartItems.map((item: any) => {
                    const price = parseFloat(item.price || '0');
                    const qty = item.quantity || 1;
                    const name = typeof item.name === 'object' 
                      ? item.name[currentLang] || item.name['de'] || item.name['en'] || '' 
                      : String(item.name);

                    return (
                      <div key={item.id} className="flex gap-3 p-3 sm:p-4 rounded-xl border border-stone-100 bg-stone-50/50 relative group">
                        {/* Image */}
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-white shrink-0 border border-stone-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={resolveImageUrl(item.image_url) || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=100&auto=format&fit=crop"} 
                            alt={name} 
                            className="w-full h-full object-contain p-1" 
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-xs font-bold text-stone-900 truncate pr-6 rtl:pr-0 rtl:pl-6" title={name}>{name}</h4>
                          {item.variant_type && (
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{item.variant_type}</p>
                          )}
                          
                          <div className="flex items-center justify-between gap-2 pt-1">
                            {/* Quantity Selector */}
                            <div className="flex items-center border border-stone-200 bg-white rounded-lg">
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, qty - 1)}
                                className="px-2 py-0.5 text-xs text-stone-500 hover:text-[#d40026] font-black cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs text-stone-900 font-bold font-mono">{qty}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(item.id, qty + 1)}
                                className="px-2 py-0.5 text-xs text-stone-500 hover:text-[#d40026] font-black cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            
                            {/* Price */}
                            <span className="text-xs font-mono font-bold text-stone-950 notranslate" translate="no">
                              {formatPrice(price * qty)}
                            </span>
                          </div>
                        </div>

                        {/* Remove button */}
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 text-stone-400 hover:text-red-600 transition cursor-pointer p-0.5"
                          title="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Checkout / Footer */}
              {cartItems.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3.5 shrink-0">
                  {/* Totals */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span>Subtotal</span>
                      <span className="font-mono notranslate" translate="no">
                        {formatPrice(cartItems.reduce((acc, item) => acc + parseFloat(item.price || '0') * (item.quantity || 1), 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-stone-900 border-t border-stone-200/50 pt-2">
                      <span>Total</span>
                      <span className="font-mono text-[#d40026] notranslate" translate="no">
                        {formatPrice(cartItems.reduce((acc, item) => acc + parseFloat(item.price || '0') * (item.quantity || 1), 0))}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Link 
                      href="/checkout"
                      onClick={() => setCartDrawerOpen(false)}
                      className="w-full bg-[#d40026] hover:bg-[#b0001e] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition text-center flex items-center justify-center gap-2 shadow-md hover:shadow-[#d40026]/20 cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {currentLang === 'ar' ? 'إتمام الشراء' : 'Zur Kasse'}
                    </Link>
                    <Link 
                      href="/cart"
                      onClick={() => setCartDrawerOpen(false)}
                      className="w-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {currentLang === 'ar' ? 'عرض السلة كاملة' : 'Warenkorb bearbeiten'}
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Wishlist icon for header with count badge
function WishlistHeaderIcon() {
  const { wishlistCount } = useWishlist();
  return (
    <Link href="/wishlist" className="hover:text-stone-900 transition-colors relative p-1.5" aria-label="Wishlist">
      <Heart className="w-5 h-5 text-stone-600" />
      {wishlistCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-in zoom-in duration-300">
          {wishlistCount}
        </span>
      )}
    </Link>
  );
}
