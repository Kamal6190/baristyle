"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ShoppingCart, Search, Check, Package, ArrowRight, Lock, ChevronDown } from "lucide-react";
import { translations, Locale } from "../../utils/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop",
];

export default function WholesalePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [showSort, setShowSort] = useState(false);
  const [minQty, setMinQty] = useState<Record<string, number>>({});

  // Language State
  const [currentLang, setCurrentLang] = useState<Locale>('de');

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  // Auth check and Lang Sync
  useEffect(() => {
    syncLang();
    window.addEventListener('language-changed', syncLang);

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (!token || !savedUser) {
      setChecking(false);
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);
    if (parsed.role === "SUPER_ADMIN" || parsed.role === "SELLER") {
      setAuthorized(true);
    }
    setChecking(false);

    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  // Fetch data only if authorized
  useEffect(() => {
    if (!authorized) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API_URL}/products`, { headers }),
          axios.get(`${API_URL}/categories`),
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authorized]);

  const t = translations[currentLang] || translations.de;
  const isRtl = currentLang === 'ar';

  const SORT_OPTIONS = useMemo(() => [
    { value: "featured", label: t.featuredSort },
    { value: "price-asc", label: currentLang === 'ar' ? 'سعر الجملة B2B: من الأقل للأعلى' : currentLang === 'de' ? 'B2B-Preis: Niedrig → Hoch' : currentLang === 'fr' ? 'Prix B2B : Bas → Élevé' : currentLang === 'nl' ? 'B2B Prijs: Laag → Hoog' : 'B2B Price: Low → High' },
    { value: "price-desc", label: currentLang === 'ar' ? 'سعر الجملة B2B: من الأعلى للأقل' : currentLang === 'de' ? 'B2B-Preis: Hoch → Niedrig' : currentLang === 'fr' ? 'Prix B2B : Élevé → Bas' : currentLang === 'nl' ? 'B2B Prijs: Hoog → Laag' : 'B2B Price: High → Low' },
    { value: "name-asc", label: t.nameAscSort },
  ], [t, currentLang]);

  const handleAddToCart = (product: any) => {
    const qty = minQty[product.id] || 1;
    const b2bPrice = parseFloat(product.b2b_price || product.price || product.retail_price || 0).toFixed(2);
    const cartItem = {
      id: product.id,
      name: product.translations?.[currentLang] || product.translations?.en || "Fragrance",
      price: b2bPrice,
      image_url: product.image_url,
      quantity: qty,
    };
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = existingCart.findIndex((i: any) => i.id === product.id);
    if (idx > -1) existingCart[idx].quantity += qty;
    else existingCart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cart-updated"));
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 2000);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.translations?.[currentLang] || "").toLowerCase().includes(q) ||
          (p.translations?.en || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) =>
          p.category?.id === selectedCategory ||
          (p.categories || []).some((c: any) => c.id === selectedCategory)
      );
    }
    result.sort((a, b) => {
      const pa = parseFloat(a.b2b_price || a.price || a.retail_price || 0);
      const pb = parseFloat(b.b2b_price || b.price || b.retail_price || 0);
      const na = (a.translations?.[currentLang] || a.translations?.en || "").toLowerCase();
      const nb = (b.translations?.[currentLang] || b.translations?.en || "").toLowerCase();
      if (sortBy === "price-asc") return pa - pb;
      if (sortBy === "price-desc") return pb - pa;
      if (sortBy === "name-asc") return na.localeCompare(nb);
      return 0;
    });
    return result;
  }, [products, searchQuery, selectedCategory, sortBy, currentLang]);

  // ─── Loading Auth ───────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900" />
      </div>
    );
  }

  // ─── Not Logged In ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0E1117] flex items-center justify-center px-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-9 h-9 text-stone-400" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-3">{t.wholesalePortalTitle}</h1>
          <p className="text-stone-400 mb-8 leading-relaxed">
            {t.restrictedDesc}
          </p>
          <Link
            href="/login"
            className={`inline-flex items-center gap-2 bg-white text-stone-900 px-8 py-3.5 rounded-sm font-bold text-sm uppercase tracking-widest hover:bg-stone-100 transition ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            {t.login} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
          <p className="text-stone-600 text-xs mt-6">
            {t.dontHaveAccount}{" "}
            <Link href="/register" className="text-stone-400 hover:text-white underline transition">
              {t.applyAsMerchant}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ─── Wrong Role (CUSTOMER) ──────────────────────────────────────────────────
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0E1117] flex items-center justify-center px-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock className="w-9 h-9 text-rose-400" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-3">{t.accessRestricted}</h1>
          <p className="text-stone-400 mb-8 leading-relaxed">
            {currentLang === 'ar' ? (
              <>حسابك الحالي (<strong className="text-stone-300">{user.email}</strong>) لا يمتلك صلاحية الوصول لأسعار الجملة. هذه البوابة مخصصة فقط لشركاء B2B المعتمدين.</>
            ) : currentLang === 'de' ? (
              <>Ihr Konto (<strong className="text-stone-300">{user.email}</strong>) verfügt nicht über Großhandelszugang. Dieses Portal ist nur für verifizierte B2B-Partner reserviert.</>
            ) : currentLang === 'fr' ? (
              <>Votre compte (<strong className="text-stone-300">{user.email}</strong>) ne dispose pas d'un accès de vente en gros. Ce portail est réservé uniquement aux partenaires B2B vérifiés.</>
            ) : currentLang === 'nl' ? (
              <>Uw account (<strong className="text-stone-300">{user.email}</strong>) heeft geen toegang tot de groothandel. Dit portaal is uitsluitend gereserveerd voor geverifieerde B2B-partners.</>
            ) : (
              <>Your account (<strong className="text-stone-300">{user.email}</strong>) does not have wholesale access. This portal is reserved for verified B2B partners only.</>
            )}
          </p>
          <Link
            href="/shop"
            className={`inline-flex items-center gap-2 bg-white text-stone-900 px-8 py-3.5 rounded-sm font-bold text-sm uppercase tracking-widest hover:bg-stone-100 transition ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            {t.browseRetail} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
          <p className="text-stone-600 text-xs mt-6">
            {currentLang === 'ar' ? 'هل تريد حساب جملة؟' : currentLang === 'de' ? 'Möchten Sie Großhandelszugang?' : currentLang === 'fr' ? 'Vous voulez un accès de gros ?' : currentLang === 'nl' ? 'Wilt u toegang tot de groothandel?' : 'Want wholesale access?'}{" "}
            <a href="mailto:info@baristyle.de" className="text-stone-400 hover:text-white underline transition">
              {t.contactUs}
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ─── Authorized View ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0E1117] text-white" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Wholesale Header Banner */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <div className={`flex items-center gap-2 mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                B2B Portal
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
                {user.role === "SUPER_ADMIN" ? t.adminView : t.merchantView}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-white">{t.wholesaleCatalog}</h1>
            <p className="text-stone-400 text-sm">{t.exclusiveB2B}</p>
          </div>
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`hidden md:block ${isRtl ? 'text-left' : 'text-right'}`}>
              <p className="text-xs text-stone-400">{t.loggedAs}</p>
              <p className="text-sm font-bold text-white">{user.name}</p>
            </div>
            <Link
              href="/checkout"
              className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-sm text-sm font-bold transition ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <ShoppingCart className="w-4 h-4" /> {t.checkout}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Filters Row */}
        <div className={`flex flex-col md:flex-row gap-4 mb-10 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchSku}
              className={`w-full py-2.5 bg-white/5 border border-white/10 rounded-sm text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 transition ${isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
            />
          </div>

          {/* Category Tabs */}
          <div className={`flex items-center gap-2 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition ${
                selectedCategory === "all"
                  ? "bg-white text-stone-900"
                  : "bg-white/5 text-stone-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              {t.all}
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest transition ${
                  selectedCategory === cat.id
                    ? "bg-white text-stone-900"
                    : "bg-white/5 text-stone-400 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat.name?.[currentLang] || cat.name?.en || cat.slug}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className={`relative ${isRtl ? 'mr-auto md:ml-0' : 'ml-auto'}`}>
            <button
              onClick={() => setShowSort((v) => !v)}
              className={`flex items-center gap-2 bg-white/5 border border-white/10 text-stone-300 px-4 py-2.5 rounded-sm text-sm hover:bg-white/10 transition min-w-[160px] justify-between ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <span>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSort ? "rotate-180" : ""}`} />
            </button>
            {showSort && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
                <div className={`absolute top-full mt-1 w-52 bg-[#1A1F2C] border border-white/10 rounded-sm shadow-2xl z-20 ${isRtl ? 'left-0' : 'right-0'}`}>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                      className={`w-full px-4 py-3 text-sm flex items-center justify-between transition ${isRtl ? 'flex-row-reverse text-right' : 'text-left'} ${
                        sortBy === opt.value ? "text-emerald-400 font-semibold" : "text-stone-300 hover:bg-white/5"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className={`text-stone-500 text-sm mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
          {loading ? (isRtl ? "جاري التحميل..." : "Loading...") : `${filteredProducts.length} ${currentLang === 'ar' ? 'من المنتجات' : 'products'}`}
        </p>

        {/* Product Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="w-12 h-12 text-stone-600 mb-4" />
            <p className="text-stone-400 text-lg font-serif">{t.noProductsFound}</p>
            <button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }} className="mt-4 text-sm text-emerald-400 underline">
              {t.resetFilters}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-widest text-stone-400 font-bold ${isRtl ? 'text-right' : 'text-left'}`}>
                  <th className={`px-4 py-3 w-16 ${isRtl ? 'text-right' : 'text-left'}`}>{currentLang === 'ar' ? 'الصورة' : currentLang === 'de' ? 'Bild' : currentLang === 'fr' ? 'Image' : currentLang === 'nl' ? 'Afbeelding' : 'Image'}</th>
                  <th className={`px-4 py-3 ${isRtl ? 'text-right' : 'text-left'}`}>{currentLang === 'ar' ? 'المنتج' : currentLang === 'de' ? 'Produkt' : currentLang === 'fr' ? 'Produit' : currentLang === 'nl' ? 'Product' : 'Product'}</th>
                  <th className={`px-4 py-3 hidden md:table-cell ${isRtl ? 'text-right' : 'text-left'}`}>SKU</th>
                  <th className={`px-4 py-3 hidden lg:table-cell ${isRtl ? 'text-right' : 'text-left'}`}>{t.categoryLabel}</th>
                  <th className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t.retailPrice}</th>
                  <th className={`px-4 py-3 text-emerald-400 ${isRtl ? 'text-left' : 'text-right'}`}>{t.b2bPrice}</th>
                  <th className="text-center px-4 py-3 hidden sm:table-cell">{t.stock}</th>
                  <th className="text-center px-4 py-3">{t.qty}</th>
                  <th className="text-center px-4 py-3">{t.add}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, idx) => {
                  const b2bPrice = parseFloat(product.b2b_price || product.price || product.retail_price || 0);
                  const retailPrice = parseFloat(product.retail_price || 0);
                  const saving = retailPrice > 0 && b2bPrice > 0
                    ? Math.round(((retailPrice - b2bPrice) / retailPrice) * 100)
                    : 0;
                  const qty = minQty[product.id] || 1;
                  const isOutOfStock = product.stock_quantity === 0 || parseFloat(product.b2b_price || 0) === 0 || b2bPrice === 0;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      {/* Image */}
                      <td className="px-4 py-3">
                        <Link href={`/shop/${product.sku || product.id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image_url || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                            alt={product.translations?.[currentLang] || product.translations?.en || ""}
                            className="w-12 h-12 object-cover rounded-sm border border-white/10 group-hover:border-emerald-500/30 transition"
                          />
                        </Link>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <Link href={`/shop/${product.sku || product.id}`} className="hover:text-emerald-400 transition">
                          <p className="font-semibold text-white leading-snug">
                            {product.translations?.[currentLang] || product.translations?.en || "Fragrance"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {product.attributes?.brand && (
                              <span className="text-[9px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">
                                {product.attributes.brand}
                              </span>
                            )}
                            {product.attributes?.type && (
                              <span className="text-[10px] text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded">
                                {product.attributes.type}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs text-stone-500 bg-white/5 px-2 py-1 rounded">
                          {product.sku}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-stone-400">
                          {product.category?.name?.[currentLang] || product.category?.name?.en || "—"}
                        </span>
                      </td>

                      {/* Retail Price */}
                      <td className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>
                        <span className="text-stone-500 text-xs line-through">
                          {retailPrice > 0 ? `€${retailPrice.toFixed(2)}` : "—"}
                        </span>
                      </td>

                      {/* B2B Price */}
                      <td className={`px-4 py-3 ${isRtl ? 'text-left' : 'text-right'}`}>
                        <div className={`flex flex-col ${isRtl ? 'items-start' : 'items-end'}`}>
                          <span className="font-bold text-emerald-400 text-base">
                            €{b2bPrice.toFixed(2)}
                          </span>
                          {saving > 0 && (
                            <span className="text-[10px] text-emerald-600 font-bold">-{saving}%</span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          isOutOfStock
                            ? "bg-rose-500/10 text-rose-400"
                            : product.stock_quantity > 10
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {isOutOfStock 
                            ? t.outOfStock 
                            : `${product.stock_quantity} ${t.units}`}
                        </span>
                      </td>

                      {/* Qty Input */}
                      <td className="px-4 py-3 text-center">
                        <div className={`flex items-center justify-center border border-white/10 rounded-sm w-24 mx-auto ${isRtl ? 'flex-row-reverse' : ''} ${isOutOfStock ? 'opacity-30 pointer-events-none' : ''}`}>
                          <button
                            onClick={() => setMinQty((prev) => ({ ...prev, [product.id]: Math.max(1, (prev[product.id] || 1) - 1) }))}
                            className="px-2 py-1.5 text-stone-400 hover:text-white hover:bg-white/5 transition text-base"
                            disabled={isOutOfStock}
                          >−</button>
                          <span className="px-2 py-1.5 text-white font-medium text-sm border-x border-white/10 w-10 text-center">
                            {qty}
                          </span>
                          <button
                            onClick={() => setMinQty((prev) => ({ ...prev, [product.id]: (prev[product.id] || 1) + 1 }))}
                            className="px-2 py-1.5 text-stone-400 hover:text-white hover:bg-white/5 transition text-base"
                            disabled={isOutOfStock}
                          >+</button>
                        </div>
                      </td>

                      {/* Add to Cart */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className={`px-3 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 mx-auto ${
                            addedProductId === product.id
                              ? "bg-emerald-600 text-white"
                              : isOutOfStock
                              ? "bg-white/5 text-stone-600 cursor-not-allowed border-stone-800"
                              : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white"
                          }`}
                        >
                          {addedProductId === product.id ? (
                            <><Check className="w-3.5 h-3.5" /> {t.added}</>
                          ) : isOutOfStock ? (
                            t.outOfStock
                          ) : (
                            <><ShoppingCart className="w-3.5 h-3.5" /> {t.add}</>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
