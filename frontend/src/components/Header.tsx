"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, User, Globe, Search, LogOut, LayoutDashboard, UserCheck, Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { translations, Locale, LANGUAGES } from "../utils/i18n";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getCategoryImage = (cat: any) => {
  if (cat.image_url) return cat.image_url;
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
  if (lang === 'ar') return `${count} عطر`;
  if (lang === 'de') return `${count} Produkte`;
  if (lang === 'fr') return `${count} Produits`;
  if (lang === 'nl') return `${count} Producten`;
  return `${count} Products`;
};


export default function Header() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Language States
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);


  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    setCartCount(count);
  };

  const checkUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  };

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLang;
    }
  };

  useEffect(() => {
    updateCartCount();
    checkUser();
    syncLang();

    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/categories`);
        // Sort categories by product count or name
        const sortedCats = res.data.sort((a: any, b: any) => {
          const countA = a._count?.products || 0;
          const countB = b._count?.products || 0;
          return countB - countA; // show categories with most products first
        });
        setCategories(sortedCats);
      } catch (error) {
        console.error("Failed to fetch categories inside header", error);
      }
    };
    fetchCategories();

    // Listen to custom updates
    window.addEventListener('cart-updated', updateCartCount);
    window.addEventListener('user-logged-in', checkUser);
    window.addEventListener('language-changed', syncLang);
    window.addEventListener('storage', () => {
      updateCartCount();
      checkUser();
      syncLang();
    });

    return () => {
      window.removeEventListener('cart-updated', updateCartCount);
      window.removeEventListener('user-logged-in', checkUser);
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    window.dispatchEvent(new Event('cart-updated')); // trigger potential pricing changes
    router.push('/');
  };

  const handleLanguageChange = (langCode: Locale) => {
    localStorage.setItem('lang', langCode);
    setCurrentLang(langCode);
    setShowLangDropdown(false);
    
    // Trigger global event
    window.dispatchEvent(new Event('language-changed'));
    
    // Set direction and page language tag
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
  };

  // Get active translation dictionary
  const t = translations[currentLang] || translations.de;

  // Selected language object
  const activeLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-serif font-bold tracking-tight text-stone-900">
              BariStyle
            </Link>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-stone-600 items-center">
              <Link href="/shop" className="hover:text-stone-900 transition-colors">
                {t.shop}
              </Link>
              {/* Wholesale: only visible to merchants & admins */}
              {user && (user.role === 'SUPER_ADMIN' || user.role === 'SELLER') && (
                <Link
                  href="/wholesale"
                  className="hover:text-stone-900 transition-colors text-emerald-700 font-semibold flex items-center gap-1"
                >
                  {t.wholesale}
                </Link>
              )}
              
              {/* Categories Mega Dropdown Menu */}
              <div className="relative group py-2">
                <button className="hover:text-stone-900 transition-colors flex items-center gap-1 font-medium text-stone-600 group-hover:text-stone-900 cursor-pointer">
                  <span>{t.categories}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform duration-300" />
                </button>

                {/* Dropdown Container */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[660px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform scale-95 group-hover:scale-100 origin-top">
                  <div className="bg-white/95 backdrop-blur-md border border-stone-200/80 shadow-2xl rounded-2xl p-5 text-stone-800">
                    <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
                      <span className="font-serif font-bold text-stone-900 tracking-wide text-base">
                        {currentLang === 'ar' ? 'تصفح عائلاتنا العطرية الفاخرة' : currentLang === 'de' ? 'Unsere Luxus-Duftfamilien' : 'Explore Our Luxury Olfactory Families'}
                      </span>
                      <Link 
                        href="/shop" 
                        onClick={() => {
                          if (window.location.pathname === "/shop") {
                            setTimeout(() => {
                              window.dispatchEvent(new Event('shop-route-changed'));
                            }, 100);
                          }
                        }}
                        className="text-xs text-[#C5A880] hover:underline font-bold tracking-wider uppercase"
                      >
                        {currentLang === 'ar' ? 'عرض الكل ←' : 'View All →'}
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-3.5">
                      {categories.slice(0, 6).map((cat) => {
                        const catImage = getCategoryImage(cat);
                        const catName = cat.name?.[currentLang] || cat.name?.en || cat.name?.de || cat.slug;
                        const productCount = cat._count?.products || 0;
                        const productText = getProductsText(productCount, currentLang);
                        
                        return (
                          <Link 
                            key={cat.id}
                            href={`/shop?category=${cat.id}`}
                            onClick={() => {
                              if (window.location.pathname === "/shop") {
                                setTimeout(() => {
                                  window.dispatchEvent(new Event('shop-route-changed'));
                                }, 100);
                              }
                            }}
                            className="group/card relative aspect-[16/11] rounded-xl overflow-hidden border border-stone-200/50 shadow-sm hover:shadow-md transition-all duration-300 bg-stone-100 flex flex-col justify-end p-3.5"
                          >
                            {/* Background Image */}
                            <img 
                              src={catImage} 
                              alt={catName}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                            />
                            {/* Glassmorphic/Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/45 to-stone-900/10 opacity-90 group-hover/card:opacity-95 transition-opacity duration-300" />
                            
                            {/* Animated Golden Accent Border */}
                            <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#C5A880] transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500 origin-left rtl:origin-right" />

                            {/* Category Information */}
                            <div className="relative z-10 transform translate-y-0 group-hover/card:-translate-y-0.5 transition-transform duration-300 text-start">
                              <span className="block font-serif font-semibold text-white tracking-wide text-sm leading-snug drop-shadow-sm">
                                {catName}
                              </span>
                              <span className="block text-[10px] text-stone-300 tracking-wider font-sans font-medium uppercase mt-0.5 opacity-80">
                                {productText}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex relative items-center">
              <Search className="absolute left-3 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder={t.search} 
                className="pl-9 pr-4 py-2 bg-stone-100 border-transparent rounded-full text-sm focus:border-stone-300 focus:bg-white focus:ring-0 transition w-64 outline-none text-stone-800"
              />
            </div>
            
            <div className="flex items-center gap-4 text-stone-600 relative">
              
              {/* Luxury Language Dropdown Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="hover:text-stone-900 transition-colors flex items-center gap-1.5 text-sm font-bold text-stone-700 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-stone-500" />
                  <span className="hidden sm:inline-block">{activeLanguage.name}</span>
                  <span className="text-base">{activeLanguage.flag}</span>
                </button>

                {showLangDropdown && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-3 w-48 bg-white border border-stone-200 shadow-xl rounded-md py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4 py-1.5 border-b border-stone-100 rtl:text-right">Select Language</p>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm text-start hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer ${currentLang === lang.code ? 'font-bold text-stone-950' : 'text-stone-600'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                        {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* User Account / Profile Menu */}
              <div className="relative">
                {user ? (
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)} 
                    className="hover:text-stone-900 transition-colors flex items-center gap-1 font-medium text-sm text-stone-950 cursor-pointer"
                  >
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  </button>
                ) : (
                  <Link href="/login" className="hover:text-stone-900 transition-colors">
                    <User className="w-5 h-5" />
                  </Link>
                )}

                {/* Profile Dropdown */}
                {showDropdown && user && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-stone-200 shadow-xl rounded-md py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">{t.signedInAs}</p>
                      <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    
                    <Link 
                      href="/profile" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <User className="w-4 h-4" /> {t.profile}
                    </Link>

                    {user.role === 'SUPER_ADMIN' && (
                      <Link 
                        href="/admin" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> {t.adminPanel}
                      </Link>
                    )}

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-stone-100 mt-2 text-left cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4" /> {t.logout}
                    </button>
                  </div>
                )}
              </div>

              {/* Shopping Cart Icon */}
              <Link href="/checkout" className="hover:text-stone-900 transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold animate-in zoom-in duration-300">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner (B2B) */}
      {!user && (
        <div className="bg-stone-900 text-stone-300 text-[11px] sm:text-xs py-2.5 text-center px-4">
          {t.b2bBanner} <Link href="/login" className="text-white font-medium underline">{t.b2bBannerLink}</Link> {t.b2bBannerDesc}
        </div>
      )}
    </header>
  );
}
