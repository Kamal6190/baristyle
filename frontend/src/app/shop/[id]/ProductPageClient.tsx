"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  Star, 
  Sparkles, 
  Flame, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Award, 
  Lock, 
  BookOpen, 
  ScrollText,
  User
} from "lucide-react";
import axios from "axios";
import { translations, Locale } from "../../../utils/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProductPageClient({ initialProduct, id: propId }: { initialProduct: any; id: string }) {
  const id = propId;
  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  
  // Language State
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  
  // Reviews data state
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Demo seeding state
  const [seeding, setSeeding] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/products/${id}`, { headers });
      setProduct(response.data);
    } catch (error) {
      console.error("Failed to fetch product", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (targetId: string = id) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/${targetId}`);
      setReviewsData(response.data);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    }
  };

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (!id) return;
    
    if (!product) {
      fetchProduct();
    }
    fetchReviews(product?.sku || id);
    syncLang();
    
    // Check logged in user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setAuthorName(parsed.name || '');
        setAuthorEmail(parsed.email || '');
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener('language-changed', syncLang);
    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, [id]);

  useEffect(() => {
    if (product) {
      const prodName = product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance";
      document.title = `${prodName} | BariStyle`;

      // Silently update legacy UUIDs with clean, domain-aligned, SEO-friendly SKUs in the address bar
      if (product.sku && id !== product.sku) {
        window.history.replaceState(null, "", `/shop/${product.sku}`);
      }
    }
  }, [product, currentLang, id]);

  const addToCart = () => {
    if (!product) return;
    
    const displayPrice = parseFloat(product.price || product.retail_price || product.b2b_price || 0).toFixed(2);
    
    const cartItem = {
      id: product.id,
      name: product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance",
      price: displayPrice,
      image_url: product.image_url,
      quantity,
      variant_type: product.attributes?.type || '100ml Eau de Parfum'
    };

    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id);
    
    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      existingCart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('cart-updated'));
    
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Submit a customer review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    setSubmitting(true);

    if (!reviewBody.trim()) {
      setSubmitError('Please write your review text.');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const payload = {
        rating,
        title: reviewTitle || undefined,
        body: reviewBody,
        author_name: authorName.trim() || undefined,
        author_email: authorEmail.trim() || undefined,
      };

      await axios.post(`${API_URL}/reviews/${product.sku || id}`, payload, { headers });

      setSubmitSuccess(true);
      setReviewTitle('');
      setReviewBody('');
      setRating(5);
      setShowReviewForm(false);
      fetchReviews(product.sku || id);
    } catch (error: any) {
      console.error("Failed to submit review", error);
      if (error.response && error.response.data && error.response.data.message) {
        // Translate error if matches 7-day policy message
        const backendMsg = error.response.data.message;
        if (backendMsg.includes("7 days")) {
          setSubmitError(t.accountAgeError);
        } else {
          setSubmitError(backendMsg);
        }
      } else {
        setSubmitError('An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Seed fake simulated reviews
  const seedReviews = async () => {
    setSeeding(true);
    try {
      await axios.post(`${API_URL}/reviews/seed/${product.sku || id}`);
      fetchReviews(product.sku || id);
      alert(t.seedSuccess);
    } catch (error) {
      console.error("Failed to seed reviews", error);
      alert(t.seedError);
    } finally {
      setSeeding(false);
    }
  };

  const t = translations[currentLang] || translations.de;

  if (loading) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 mb-4"></div>
          <span className="text-xs tracking-widest text-stone-500 uppercase">{t.loadingMasterpiece}</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-serif text-stone-900 mb-4">{t.productNotFound}</h1>
        <Link href="/shop" className="text-stone-500 underline">{t.returnToShop}</Link>
      </div>
    );
  }

  const displayPrice = parseFloat(product.price || product.retail_price || product.b2b_price || 0).toFixed(2);
  const fallbackImage = "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop";

  // Dynamic values helper
  const getShortDesc = () => {
    if (product.short_description) {
      if (typeof product.short_description === 'string') return product.short_description;
      const val = product.short_description[currentLang] || product.short_description.en || product.short_description.ar;
      if (val) return val;
    }
    
    // Fallback to custom product description if short_description is null/empty
    if (product.description) {
      if (typeof product.description === 'string') return product.description;
      const val = product.description[currentLang] || product.description.en || product.description.ar;
      if (val) return val;
    }
    
    // Multi-language default short descriptions as a final fallback
    const descDefaults = {
      de: "Ein außergewöhnlicher, meisterhaft ausgewogener Duft für anspruchsvolle Persönlichkeiten. Mit einer maximalen Duftölkonzentration sorgt diese Kreation für langanhaltende Haltbarkeit und eine feine, unvergessliche Sillage im Raum.",
      fr: "Un parfum exceptionnel et magistralement équilibré pour les personnalités exigeantes. Avec une concentration maximale d'huile de parfum, cette création assure une tenue longue durée et un sillage raffiné et inoubliable.",
      en: "An exceptional, masterfully balanced fragrance developed for individuals who appreciate the finest elements of niche perfumery. Featuring premium concentrated oils with high purity, this formula boasts remarkable long-term durability and a gorgeous, sophisticated sillage.",
      ar: "عطر استثنائي متوازن ومصمم خصيصاً للشخصيات الراقية التي تبحث عن الفخامة العطرية. بفضل التركيز العالي للزيوت العطرية النقية، يمنحك هذا العطر ثباتاً مذهلاً لعدة أيام مع فوحان ساحر لا يُنسى يملأ أركان المكان.",
      nl: "Een uitzonderlijk, meesterlijk gebalanceerd parfum ontwikkeld voor veeleisende persoonlijkheden. Mit einer maximalen concentratie parfumolie zorgt deze creatie voor een langdurige houdbaarheid en een verfijnde, onvergetelijke sillage."
    };
    
    return descDefaults[currentLang] || descDefaults.en;
  };

  const getDesc = (lang: 'en' | 'ar') => {
    if (!product.description) return '';
    if (typeof product.description === 'string') {
      return lang === 'en' ? product.description : '';
    }
    return product.description[lang] || product.description.en || '';
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarColors = [
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-stone-100 text-stone-800 border-stone-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-rose-100 text-rose-800 border-rose-200'
  ];

  const getAvatarColor = (name: string) => {
    const code = (name || '').charCodeAt(0) || 0;
    return avatarColors[code % avatarColors.length];
  };

  const shortDescriptionText = getShortDesc();
  const hasReviews = reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0;
  const ratingAverage = reviewsData ? reviewsData.average : 4.9;
  const ratingTotal = reviewsData ? reviewsData.total : 128;

  // Is Arabic layout activated
  const isRtl = currentLang === 'ar';

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24 text-stone-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navigation */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
            <Link href="/shop" className="flex items-center gap-1 hover:text-stone-900 transition">
              <ArrowLeft className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} /> {t.backToShop}
            </Link>
            <span className="text-stone-300">|</span>
            <Link href="/shop" className="hover:text-stone-900 transition">{t.fragrances}</Link>
            <span className="text-stone-300">/</span>
            <span className="text-stone-900 font-semibold">{product.translations?.[currentLang] || product.translations?.en || "Product"}</span>
          </div>
          <Link href="/checkout" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-stone-500 transition">
            <ShoppingBag className="w-4 h-4" /> {t.checkout}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Product Images */}
          <div className="space-y-6">
            <div className="aspect-[4/5] bg-white relative overflow-hidden rounded-md shadow-sm border border-stone-100">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105 cursor-zoom-in"
                style={{ backgroundImage: `url('${product.image_url || fallbackImage}')` }}
              ></div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col pt-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {product.attributes?.brand && (
                <span className="text-[10px] font-bold tracking-[0.2em] text-amber-800 uppercase bg-amber-50 px-2 py-1 rounded-sm border border-amber-200">
                  {product.attributes.brand}
                </span>
              )}
              <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-700 uppercase bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100">
                {product.category?.name?.[currentLang] || product.category?.name?.en || "Premium Extract"}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4 leading-tight">
              {product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance"}
            </h1>
            
            {/* Reviews Summary Rating */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-stone-200">
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star 
                    key={idx} 
                    className={`w-4 h-4 ${idx < Math.round(ratingAverage) ? 'fill-amber-500' : 'text-stone-300'}`} 
                  />
                ))}
              </div>
              <button 
                onClick={() => {
                  setActiveTab('reviews');
                  const element = document.getElementById('product-tabs-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-stone-600 underline cursor-pointer hover:text-stone-900 transition"
              >
                {ratingAverage} ({ratingTotal} {ratingTotal === 1 ? t.tabReviews.slice(0, -1) : t.tabReviews})
              </button>
              <span className="text-stone-300">|</span>
              <span className="text-xs font-medium text-stone-500">SKU: {product.sku}</span>
            </div>

            {/* Product Short Description (Placed next to price) */}
            <p className="text-stone-600 leading-relaxed mb-8 text-base whitespace-pre-line">
              {shortDescriptionText}
            </p>

            {/* Size Variants Switcher */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-8 space-y-3">
                {(() => {
                  const sizeLabels: Record<string, string> = {
                    de: "Größe / Variante",
                    fr: "Taille / Volume",
                    en: "Size / Type",
                    ar: "الحجم / الفئة",
                    nl: "Grootte / Inhoud"
                  };
                  const sizeLabel = sizeLabels[currentLang] || sizeLabels.en;
                  return (
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em] block">{sizeLabel}:</span>
                  );
                })()}
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v: any) => {
                    const isActive = v.sku === product.sku;
                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          setProduct({
                            ...product,
                            ...v,
                            variants: product.variants
                          });
                          setQuantity(1);
                          fetchReviews(v.sku);
                        }}
                        className={`px-4 py-2 text-xs font-bold rounded-lg border tracking-wider transition-all duration-300 ${
                          isActive
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {v.attributes?.type || 'Standard'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pricing Section */}
            <div className="mb-10">
              {(() => {
                const activePrice = parseFloat(product.price || product.sales_price_with_tax || product.retail_price || product.b2b_price || 0);
                const comparePrice = parseFloat(product.retail_price || 0);
                const hasDiscount = comparePrice > activePrice;
                const discountPercentage = hasDiscount ? Math.round(((comparePrice - activePrice) / comparePrice) * 100) : 0;
                return (
                  <div className="flex flex-col gap-2 mb-6">
                    {hasDiscount ? (
                      <>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">
                              {currentLang === 'ar' ? 'السعر بعد الخصم' : 
                               currentLang === 'de' ? 'Aktionspreis' : 
                               currentLang === 'fr' ? 'Prix réduit' : 
                               currentLang === 'nl' ? 'Actieprijs' : 'Special Price'}
                            </span>
                            <span className="text-4xl font-bold text-emerald-700">
                              €{activePrice.toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex flex-col border-l border-stone-200 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">
                              {currentLang === 'ar' ? 'السعر قبل الخصم' : 
                               currentLang === 'de' ? 'Originalpreis' : 
                               currentLang === 'fr' ? 'Prix d\'origine' : 
                               currentLang === 'nl' ? 'Originele prijs' : 'Original Price'}
                            </span>
                            <span className="text-xl font-medium text-stone-400 line-through">
                              €{comparePrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-4 sm:mt-0">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-[10px] font-bold text-emerald-700 px-2.5 py-1 rounded border border-emerald-100 uppercase tracking-wider">
                              <Flame className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                              {currentLang === 'ar' ? `وفر ${discountPercentage}%` : 
                               currentLang === 'de' ? `Sparen Sie ${discountPercentage}%` : 
                               currentLang === 'fr' ? `Économisez ${discountPercentage}%` : 
                               currentLang === 'nl' ? `Bespaar ${discountPercentage}%` : `Save ${discountPercentage}%`}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-stone-500 font-sans tracking-normal mt-1 block">
                          / {product.attributes?.type || '100ml Eau de Parfum'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">{t.retailPrice}</span>
                        <span className="text-4xl font-bold text-stone-900">
                          €{activePrice.toFixed(2)}{" "}
                          <span className="text-sm font-medium text-stone-500 font-sans tracking-normal">
                            / {product.attributes?.type || '100ml'}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Wholesale Banner (Only show if no token or role is guest) */}
              {isMounted && !localStorage.getItem('token') && (
                <div className="bg-[#1A1F2C] text-white p-5 rounded-md border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between shadow-lg relative overflow-hidden gap-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="relative z-10">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {t.wholesalePrice}
                    </h4>
                    <p className="text-xs text-stone-400">{t.b2bBannerDesc}</p>
                  </div>
                  <Link href="/login" className="relative z-10 bg-white text-stone-900 text-xs font-bold px-5 py-2.5 rounded hover:bg-stone-200 transition shadow-sm text-center whitespace-nowrap">
                    {t.login}
                  </Link>
                </div>
              )}
            </div>

            {/* Form / Actions */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex border border-stone-300 rounded-sm">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-stone-500 hover:text-stone-900 transition hover:bg-stone-50">-</button>
                <div className="px-4 py-3 text-stone-900 font-medium border-x border-stone-300 w-16 text-center">{quantity}</div>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-stone-500 hover:text-stone-900 transition hover:bg-stone-50">+</button>
              </div>
              <button 
                onClick={addToCart}
                className={`flex-1 py-4 rounded-sm font-semibold flex items-center justify-center gap-2 transition shadow-md ${addedToCart ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-white hover:bg-black'}`}
              >
                {addedToCart ? (
                  <>{t.addedToCart}</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> {t.addToCart}</>
                )}
              </button>
            </div>

            {/* Guarantees */}
            <div className="flex items-center gap-8 text-xs font-medium text-stone-500 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span><strong className="text-stone-800 block">{t.authenticDesc}</strong> {t.authenticSub}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-stone-900" />
                <span><strong className="text-stone-800 block">{t.fastShipping}</strong> {t.fastShippingSub}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TABS SECTION */}
        {/* ---------------------------------------------------- */}
        <div id="product-tabs-section" className="mt-24 border-t border-stone-200 pt-16 max-w-5xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex border-b border-stone-200 gap-8 sm:gap-12 justify-center mb-12">
            <button 
              onClick={() => setActiveTab('description')}
              className={`pb-4 text-xs sm:text-sm font-bold tracking-widest uppercase border-b-2 transition flex items-center gap-2 ${activeTab === 'description' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              <BookOpen className="w-4 h-4" /> {t.tabDescription}
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 text-xs sm:text-sm font-bold tracking-widest uppercase border-b-2 transition flex items-center gap-2 ${activeTab === 'reviews' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              <Star className="w-4 h-4" /> {t.tabReviews} ({ratingTotal})
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-stone-100 shadow-sm min-h-[350px]">
            
            {/* T1: Description */}
            {activeTab === 'description' && (
              <div className="animate-in fade-in duration-200 max-w-3xl mx-auto">
                <div className={`space-y-6 ${isRtl ? 'text-right font-serif' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                  <h3 className="font-serif font-bold text-2xl text-stone-900 mb-6 pb-2 border-b border-stone-100">
                    {currentLang === 'ar' ? "وصف المنتج والتفاصيل" :
                     currentLang === 'de' ? "Beschreibung & Details" :
                     currentLang === 'fr' ? "Description & Détails" :
                     currentLang === 'nl' ? "Beschrijving & Details" : "Description & Details"}
                  </h3>
                  
                  {/* Localized Short Description */}
                  {shortDescriptionText && (
                    <div className="bg-stone-50/60 p-6 rounded-lg border border-stone-200/40 text-stone-700 italic font-sans text-sm leading-relaxed mb-6 shadow-2xs">
                      {shortDescriptionText}
                    </div>
                  )}
                  
                  {/* Localized Full Description */}
                  {(() => {
                    const fullDesc = !product.description ? '' :
                      typeof product.description === 'string' ? product.description :
                      (product.description[currentLang] || product.description.en || product.description.ar || '');
                    
                    const fallbackMsg = currentLang === 'ar' ? "يجري إعداد وصف فني خاص بهذا المنتج المبتكر الذي يَعِدُ بتجربة ملكية فريدة وعميقة الأثر." :
                      currentLang === 'de' ? "Eine authentische Beschreibung wird derzeit erstellt. Diese exquisite Kreation verspricht ein unvergleichliches Luxuserlebnis." :
                      "An authentic description is being crafted. This exquisite creation promises an unparalleled luxury experience.";

                    if (fullDesc) {
                      return (
                        <div className={`whitespace-pre-line text-stone-600 leading-relaxed text-base ${isRtl ? 'text-lg leading-loose font-serif' : ''}`}>
                          {fullDesc}
                        </div>
                      );
                    } else {
                      return <p className="italic text-stone-400">{fallbackMsg}</p>;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* T3: Reviews */}
            {activeTab === 'reviews' && (
              <div className="animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  
                  {/* Reviews Dashboard Metrics */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#FAF9F6] p-6 rounded-xl border border-stone-200/50">
                      <h4 className="font-serif font-bold text-stone-850 text-base mb-4 text-center">{t.reviewsSummary}</h4>
                      
                      <div className="flex flex-col items-center mb-6">
                        <span className="text-5xl font-bold font-serif text-stone-900 mb-1">{ratingAverage}</span>
                        <div className="flex items-center gap-1 text-amber-500 mb-2">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star 
                              key={idx} 
                              className={`w-4 h-4 ${idx < Math.round(ratingAverage) ? 'fill-amber-500' : 'text-stone-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-stone-500 font-medium">{t.basedOn} {ratingTotal} {t.realRatings}</span>
                      </div>

                      {/* Dynamic Distribution bars */}
                      <div className="space-y-2 text-xs">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const dist = reviewsData?.distribution?.find((d: any) => d.star === stars);
                          const count = dist ? dist.count : (stars === 5 ? Math.round(ratingTotal * 0.85) : stars === 4 ? Math.round(ratingTotal * 0.12) : 0);
                          const percentage = ratingTotal > 0 ? (count / ratingTotal) * 100 : 0;
                          
                          return (
                            <div key={stars} className="flex items-center gap-3">
                              <span className="w-3 text-stone-500 font-medium text-right">{stars}</span>
                              <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="w-8 text-stone-400 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-8 space-y-3">
                        <button 
                          onClick={() => {
                            setSubmitError('');
                            setSubmitSuccess(false);
                            setShowReviewForm(!showReviewForm);
                          }}
                          className="w-full py-3 bg-stone-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                        >
                          {showReviewForm ? t.cancelReview : t.writeReview}
                        </button>
                      </div>
                    </div>

                    {/* OWNER TOOL: Seed fake reviews */}
                    {(currentUser && currentUser.role === 'SUPER_ADMIN') && (
                      <div className="bg-emerald-50/50 p-6 rounded-xl border border-dashed border-emerald-300 flex flex-col items-center">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span>{t.demoSeedingTool}</span>
                        </div>
                        <p className="text-xs text-stone-600 text-center leading-relaxed mb-4">
                          {t.demoSeedingDesc}
                        </p>
                        <button 
                          onClick={seedReviews}
                          disabled={seeding}
                          className="px-5 py-2.5 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {seeding ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t.submitting}
                            </>
                          ) : (
                            <>{t.seedButton}</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reviews List & Submission Form */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Submission Form collapse card */}
                    {showReviewForm && (
                      <form onSubmit={handleReviewSubmit} className="bg-[#FAF9F6] p-6 rounded-xl border border-stone-200 animate-in slide-in-from-top-4 duration-300 text-left">
                        <h4 className="font-serif font-bold text-lg text-stone-900 mb-1">{t.shareExperience}</h4>
                        <p className="text-xs text-stone-500 mb-6">{t.reviewHelper}</p>
                        
                        {submitError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm mb-6 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {submitSuccess && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-md text-sm mb-6 flex items-start gap-3">
                            <Check className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                            <span>{t.reviewSuccessMsg}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{t.displayName}</label>
                            <input 
                              type="text" 
                              required 
                              value={authorName} 
                              onChange={(e) => setAuthorName(e.target.value)} 
                              placeholder="e.g. Alexander K." 
                              className="w-full p-3 bg-white border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{t.emailConf}</label>
                            <input 
                              type="email" 
                              required 
                              value={authorEmail} 
                              onChange={(e) => setAuthorEmail(e.target.value)} 
                              placeholder="e.g. alex@example.com" 
                              className="w-full p-3 bg-white border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-500"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{t.overallRating}</label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                key={star} 
                                type="button" 
                                onClick={() => setRating(star)} 
                                className="hover:scale-110 transition cursor-pointer"
                              >
                                <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{t.headline}</label>
                          <input 
                            type="text" 
                            required 
                            value={reviewTitle} 
                            onChange={(e) => setReviewTitle(e.target.value)} 
                            placeholder="e.g. Masterpiece in a bottle! / عطر خيالي" 
                            className="w-full p-3 bg-white border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-500"
                          />
                        </div>

                        <div className="mb-6">
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{t.detailedReview}</label>
                          <textarea 
                            rows={4} 
                            required 
                            value={reviewBody} 
                            onChange={(e) => setReviewBody(e.target.value)} 
                            placeholder="Describe the longevity, notes development, sillage, and what kind of compliments you get..." 
                            className="w-full p-3 bg-white border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-500"
                          ></textarea>
                        </div>

                        <button 
                          type="submit" 
                          disabled={submitting} 
                          className="px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" /> {t.submitting}
                            </>
                          ) : (
                            <>{t.submitReview}</>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Review list */}
                    <div className="space-y-6 text-left">
                      {hasReviews ? (
                        reviewsData.reviews.map((rev: any) => {
                          const initials = getInitials(rev.author_name);
                          const avColor = getAvatarColor(rev.author_name);
                          const dateString = new Date(rev.created_at).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });

                          return (
                            <div key={rev.id} className="pb-6 border-b border-stone-100 flex gap-4 items-start animate-in fade-in duration-200">
                              {/* Avatar circle */}
                              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border shadow-2xs ${avColor}`}>
                                {initials}
                              </div>
                              
                              <div className="flex-1 space-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-stone-900 text-sm">{rev.author_name}</span>
                                    {rev.verified_purchase && (
                                      <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                                        <Check className="w-2.5 h-2.5" /> {t.verifiedPurchase}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-stone-400 font-medium">{dateString}</span>
                                </div>

                                <div className="flex items-center gap-1 text-amber-500 py-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} 
                                    />
                                  ))}
                                </div>

                                {rev.title && (
                                  <h5 className="font-bold text-stone-900 text-sm">{rev.title}</h5>
                                )}

                                <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">
                                  {rev.body}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 border-2 border-dashed border-stone-100 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                          <Award className="w-12 h-12 text-stone-300 mb-3" />
                          <h4 className="font-serif font-bold text-stone-850 text-base mb-1">{t.noReviewsYet}</h4>
                          <p className="text-xs text-stone-500 max-w-sm mb-6 leading-relaxed">
                            {t.firstReviewDesc}
                          </p>
                          <button 
                            onClick={() => {
                              setSubmitError('');
                              setSubmitSuccess(false);
                              setShowReviewForm(true);
                            }}
                            className="px-5 py-3 bg-stone-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                          >
                            {t.submitFirstReview}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
