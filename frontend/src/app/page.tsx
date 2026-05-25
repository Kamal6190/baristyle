"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, CreditCard } from "lucide-react";
import HeroCarousel from "../components/HeroCarousel";
import { translations, Locale } from "../utils/i18n";

const DEFAULT_HOMEPAGE_FEATURED = {
  main: {
    image_url: 'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=1200&auto=format&fit=crop',
    title_en: 'Summer Nocturne Collection',
    title_ar: 'عطر نكتار الصيف الفاخر',
    subtitle_en: 'Hand-picked selections from the world\'s leading perfumeries. Perfect for retail displays.',
    subtitle_ar: 'باقة من العطور الفاخرة والساحرة تم اختيارها بعناية من أفضل دور العطور العالمية.',
    tag_en: 'Seasonal Curated',
    tag_ar: 'مجموعات المواسم الخاصة',
    link: '/shop'
  },
  card1: {
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
    title_en: 'The Artisanal Edit',
    title_ar: 'العطور المصممة يدوياً',
    link: '/shop'
  },
  card2: {
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop',
    title_en: 'Wholesale Exclusives',
    title_ar: 'حصريات تجارة الجملة',
    link: '/shop'
  }
};

const DEFAULT_HOMEPAGE_STATS = [
  { value: '500+', label_en: 'Premium Brands', label_ar: 'العلامات التجارية الفاخرة' },
  { value: '24h', label_en: 'Order Processing', label_ar: 'سرعة تجهيز الطلبات' },
  { value: 'Global', label_en: 'B2B Logistics', label_ar: 'الخدمات اللوجستية B2B' },
  { value: '99.8%', label_en: 'Reliability Rate', label_ar: 'معدل موثوقية الأداء' }
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [homepageFeatured, setHomepageFeatured] = useState<any>(null);
  const [homepageStats, setHomepageStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

    const fetchHomepageData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      try {
        const [prodRes, bannerRes, featuredRes, statsRes] = await Promise.all([
          fetch(`${apiUrl}/products`, { cache: 'no-store' }).then(res => res.ok ? res.json() : []),
          fetch(`${apiUrl}/settings/hero_banners`, { cache: 'no-store' }).then(res => res.ok ? res.json() : []),
          fetch(`${apiUrl}/settings/homepage_featured`, { cache: 'no-store' }).then(res => res.ok ? res.json() : null),
          fetch(`${apiUrl}/settings/homepage_stats`, { cache: 'no-store' }).then(res => res.ok ? res.json() : [])
        ]);
        setProducts(prodRes);
        setHeroBanners(bannerRes);
        if (featuredRes) setHomepageFeatured(featuredRes);
        if (statsRes && statsRes.length > 0) setHomepageStats(statsRes);
      } catch (error) {
        console.error("Could not fetch homepage data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();

    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  const t = translations[currentLang] || translations.de;
  const isRtl = currentLang === 'ar';

  // Take only the first 4 products for "New Arrivals"
  const newArrivals = products.slice(0, 4);
  const bestSellers = products.length >= 8 ? products.slice(4, 8) : [...products].reverse().slice(0, 4);

  return (
    <div className="w-full bg-[#FAF9F6] text-stone-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Dynamic Animated Hero Section */}
      <HeroCarousel initialBanners={heroBanners} />

      {/* Stats Section */}
      <section className="bg-white py-12 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-stone-100 rtl:divide-x-reverse">
            {(homepageStats.length > 0 ? homepageStats : DEFAULT_HOMEPAGE_STATS).map((stat: any, index: number) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-stone-900 mb-2">{stat.value}</p>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold">
                  {currentLang === 'ar' ? stat.label_ar || stat.label_en : stat.label_en || stat.label_ar}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#FAF9F6]">
        <div className="flex justify-between items-end mb-12 border-b border-stone-200 pb-6">
          <div className={isRtl ? "text-right" : "text-left"}>
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">{t.featuredCollections}</h2>
            <p className="text-stone-500 text-sm">{t.featuredCollectionsDesc}</p>
          </div>
          <Link href="/shop" className="group flex items-center gap-2 text-sm font-medium text-stone-900 hover:text-stone-600 transition">
            {t.viewAllCollections}
            <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          {/* Main Large Card */}
          <Link href={(homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.link || "/shop"} className="md:col-span-2 relative overflow-hidden group cursor-pointer shadow-sm block">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: `url('${(homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.image_url}')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className={`absolute bottom-0 p-10 ${isRtl ? 'right-0 text-right' : 'left-0 text-left'}`}>
              <p className="text-white/80 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                {currentLang === 'ar' 
                  ? (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.tag_ar || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.tag_en 
                  : (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.tag_en || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.tag_ar}
              </p>
              <h3 className="text-4xl font-serif font-bold text-white mb-6">
                {currentLang === 'ar' 
                  ? (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.title_ar || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.title_en 
                  : (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.title_en || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).main?.title_ar}
              </h3>
              <span className="bg-white text-stone-900 px-8 py-2.5 rounded-sm text-sm font-semibold hover:bg-stone-100 transition inline-block">
                {t.explore}
              </span>
            </div>
          </Link>

          {/* Right column small cards */}
          <div className="flex flex-col gap-6">
            <Link href={(homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card1?.link || "/shop"} className="flex-1 relative overflow-hidden group cursor-pointer shadow-sm block">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: `url('${(homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card1?.image_url}')` }}
              ></div>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-2xl font-serif font-bold text-white tracking-wide">
                  {currentLang === 'ar' 
                    ? (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card1?.title_ar || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card1?.title_en 
                    : (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card1?.title_en || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card1?.title_ar}
                </h3>
              </div>
            </Link>
            <Link href={(homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card2?.link || "/shop"} className="flex-1 relative overflow-hidden group cursor-pointer shadow-sm block">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: `url('${(homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card2?.image_url}')` }}
              ></div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-2xl font-serif font-bold text-white tracking-wide">
                  {currentLang === 'ar' 
                    ? (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card2?.title_ar || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card2?.title_en 
                    : (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card2?.title_en || (homepageFeatured || DEFAULT_HOMEPAGE_FEATURED).card2?.title_ar}
                </h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals with REAL DATA */}
      <section className="bg-[#F4F4F4] py-24 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl font-serif font-bold text-stone-900">{t.newArrivals}</h2>
            <div className="flex-1 h-px bg-stone-300"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {!loading ? (
              newArrivals.length > 0 ? (
                newArrivals.map((product: any) => (
                  <Link href={`/shop/${product.sku || product.id}`} key={product.id} className="group cursor-pointer bg-white p-4 shadow-sm hover:shadow-md transition-shadow block">
                    <div className="relative aspect-square mb-6 overflow-hidden bg-stone-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={product.image_url || "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=400&auto=format&fit=crop"} 
                        alt={product.translations?.[currentLang] || product.translations?.en || "Product"}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className={`absolute top-2 text-[9px] font-bold px-2 py-1 uppercase tracking-wider text-white bg-emerald-500 ${isRtl ? 'left-2' : 'right-2'}`}>
                        NEW
                      </div>
                      {(() => {
                        const price = parseFloat(product.price || product.sales_price_with_tax || '0');
                        const retail = parseFloat(product.retail_price || '0');
                        if (retail > price) {
                          const percent = Math.round(((retail - price) / retail) * 100);
                          return (
                            <div className={`absolute top-2 text-[9px] font-bold px-2 py-1 uppercase tracking-wider text-white bg-rose-500 ${isRtl ? 'right-2' : 'left-2'}`}>
                              -{percent}% OFF
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <p className="text-[10px] text-stone-400 mb-1.5 uppercase tracking-[0.15em] font-semibold">{product.attributes?.brand || 'Luxury Fragrance'}</p>
                      <h3 className="font-serif font-bold text-stone-900 text-lg mb-2 truncate">{product.translations?.[currentLang] || product.translations?.en || 'Unnamed Product'}</h3>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-rose-600 text-lg">
                            €{parseFloat(product.price || product.sales_price_with_tax || '0').toFixed(2)}
                          </span>
                          {product.retail_price && parseFloat(product.retail_price) > parseFloat(product.price || product.sales_price_with_tax || '0') && (
                            <span className="text-xs text-stone-400 line-through font-medium">
                              €{parseFloat(product.retail_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.b2b_price && <span className="text-xs text-emerald-700 font-medium">B2B: €{parseFloat(product.b2b_price).toFixed(2)}</span>}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-center py-12 text-stone-500">
                  {t.noProductsFound}
                </div>
              )
            ) : (
              <div className="col-span-4 text-center py-12 text-stone-500">
                {t.loadingNewArrivals}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Best Sellers (Best Sale) with REAL DATA */}
      <section className="bg-white py-24 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl font-serif font-bold text-stone-900">{t.bestSellers}</h2>
            <div className="flex-1 h-px bg-stone-300"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {!loading ? (
              bestSellers.length > 0 ? (
                bestSellers.map((product: any) => (
                  <Link href={`/shop/${product.sku || product.id}`} key={product.id} className="group cursor-pointer bg-[#F4F4F4] p-4 shadow-sm hover:shadow-md transition-shadow block">
                    <div className="relative aspect-square mb-6 overflow-hidden bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={product.image_url || "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=400&auto=format&fit=crop"} 
                        alt={product.translations?.[currentLang] || product.translations?.en || "Product"}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className={`absolute top-2 text-[9px] font-bold px-2 py-1 uppercase tracking-wider text-white bg-amber-600 ${isRtl ? 'left-2' : 'right-2'}`}>
                        BEST
                      </div>
                      {(() => {
                        const price = parseFloat(product.price || product.sales_price_with_tax || '0');
                        const retail = parseFloat(product.retail_price || '0');
                        if (retail > price) {
                          const percent = Math.round(((retail - price) / retail) * 100);
                          return (
                            <div className={`absolute top-2 text-[9px] font-bold px-2 py-1 uppercase tracking-wider text-white bg-rose-500 ${isRtl ? 'right-2' : 'left-2'}`}>
                              -{percent}% OFF
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <p className="text-[10px] text-stone-400 mb-1.5 uppercase tracking-[0.15em] font-semibold">{product.attributes?.brand || 'Luxury Fragrance'}</p>
                      <h3 className="font-serif font-bold text-stone-900 text-lg mb-2 truncate">{product.translations?.[currentLang] || product.translations?.en || 'Unnamed Product'}</h3>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-rose-600 text-lg">
                            €{parseFloat(product.price || product.sales_price_with_tax || '0').toFixed(2)}
                          </span>
                          {product.retail_price && parseFloat(product.retail_price) > parseFloat(product.price || product.sales_price_with_tax || '0') && (
                            <span className="text-xs text-stone-400 line-through font-medium">
                              €{parseFloat(product.retail_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.b2b_price && <span className="text-xs text-emerald-700 font-medium">B2B: €{parseFloat(product.b2b_price).toFixed(2)}</span>}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-center py-12 text-stone-500">
                  {t.noProductsFound}
                </div>
              )
            ) : (
              <div className="col-span-4 text-center py-12 text-stone-500">
                {t.loadingNewArrivals}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Wholesale Portal CTA */}
      <section className="bg-[#111625] py-20 relative overflow-hidden">
        {/* Subtle background pattern/gradient */}
        <div className={`absolute top-0 w-1/2 h-full bg-gradient-to-l from-blue-900/10 to-transparent pointer-events-none ${isRtl ? 'left-0' : 'right-0'}`}></div>
        <div className={`absolute top-0 w-px h-full bg-white/5 pointer-events-none transform rotate-12 ${isRtl ? 'left-[20%]' : 'right-[20%]'}`}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
          <div className={isRtl ? "text-right" : "text-left"}>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">{t.wholesalePortalTitle}</h2>
            <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-md">
              {t.wholesalePortalDesc}
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                { icon: ShieldCheck, text: t.verifiedAuthenticity },
                { icon: Truck, text: t.bulkLogistics },
                { icon: CreditCard, text: t.flexibleNet30 }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-stone-300">
                  <item.icon className="w-5 h-5 text-emerald-500" />
                  {item.text}
                </li>
              ))}
            </ul>

            <Link href="/register" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-sm font-medium hover:bg-emerald-500 transition">
              {t.applyWholesaleAccess}
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
          </div>
          
          <div className="bg-[#1A2035] rounded-xl border border-white/10 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs text-stone-400 tracking-widest uppercase">{t.inventoryStatus}</h3>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {t.liveUpdates}
              </span>
            </div>
            
            <div className="space-y-3">
              {[
                { sku: "SKU: LUX-101", desc: "L'ESSENCE DE SAPPHIRE", stock: `150 ${
                  currentLang === 'de' ? 'Stück' :
                  currentLang === 'fr' ? 'unités' :
                  currentLang === 'ar' ? 'قطعة' :
                  currentLang === 'nl' ? 'stuks' : 'Units'
                }`, status: t.inStock },
                { sku: "SKU: LUX-104", desc: "NOIR INTENSE", stock: `200 ${
                  currentLang === 'de' ? 'Stück' :
                  currentLang === 'fr' ? 'unités' :
                  currentLang === 'ar' ? 'قطعة' :
                  currentLang === 'nl' ? 'stuks' : 'Units'
                }`, status: t.inStock }
              ].map((item, i) => (
                <div key={i} className="bg-[#232A42] p-4 rounded-lg border border-white/5 flex items-center justify-between">
                  <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                    <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center">
                      <div className="w-5 h-5 border border-white/20 rounded-sm"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.sku}</p>
                      <p className="text-[10px] text-stone-400">{item.desc}</p>
                    </div>
                  </div>
                  <div className={isRtl ? "text-left" : "text-right"}>
                    <p className="text-sm font-semibold text-white">{item.stock}</p>
                    <p className="text-[10px] text-emerald-400">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
