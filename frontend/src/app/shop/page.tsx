"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart, Filter, X, Search, ChevronDown, ChevronUp, SlidersHorizontal, Check } from "lucide-react";
import axios from "axios";
import { translations, Locale } from "../../utils/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop",
];

interface ProductHoverImageProps {
  mainImage: string;
  secondaryImage?: string;
  alt: string;
  fallbackImage: string;
}

const ProductHoverImage: React.FC<ProductHoverImageProps> = ({
  mainImage,
  secondaryImage,
  alt,
  fallbackImage,
}) => {
  const [showSecondary, setShowSecondary] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered || !secondaryImage) {
      setShowSecondary(false);
      return;
    }

    // Alternate every 2 seconds
    const interval = setInterval(() => {
      setShowSecondary((prev) => !prev);
    }, 1000);

    // Force stop after 30 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setShowSecondary(false);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isHovered, secondaryImage]);

  const activeMain = mainImage || fallbackImage;
  const activeSec = secondaryImage;

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeMain}
        alt={alt}
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
      />
      {activeSec && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activeSec}
          alt={`${alt} Alternate`}
          className={`absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 ease-in-out ${
            showSecondary ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      )}
    </div>
  );
};

export default function Shop() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Language State
  const [currentLang, setCurrentLang] = useState<Locale>('de');

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // Accordion state for filter sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    search: true,
  });

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    syncLang();
    window.addEventListener('language-changed', syncLang);

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API_URL}/products`, { headers }),
          axios.get(`${API_URL}/categories`),
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data);

        // Parse category query parameter from URL
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const catQuery = params.get("category");
          if (catQuery) {
            setSelectedCategories([catQuery]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleUrlChange = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const catQuery = params.get("category");
        if (catQuery) {
          setSelectedCategories([catQuery]);
        } else {
          setSelectedCategories([]);
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    // Custom event to force update when clicking from same page
    window.addEventListener('shop-route-changed', handleUrlChange);

    return () => {
      window.removeEventListener('language-changed', syncLang);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('shop-route-changed', handleUrlChange);
    };
  }, []);

  const t = translations[currentLang] || translations.de;
  const isRtl = currentLang === 'ar';

  const SORT_OPTIONS = useMemo(() => [
    { value: "featured", label: t.featuredSort },
    { value: "price-asc", label: t.priceAscSort },
    { value: "price-desc", label: t.priceDescSort },
    { value: "name-asc", label: t.nameAscSort },
    { value: "name-desc", label: t.nameDescSort },
  ], [t]);

  const handleQuickAdd = useCallback((product: any) => {
    const displayPrice = parseFloat(product.price || product.retail_price || product.b2b_price || 0).toFixed(2);
    const cartItem = {
      id: product.id,
      name: product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance",
      price: displayPrice,
      image_url: product.image_url,
      quantity: 1,
    };
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = existingCart.findIndex((i: any) => i.id === product.id);
    if (idx > -1) existingCart[idx].quantity += 1;
    else existingCart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cart-updated"));
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 2000);
  }, [currentLang]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setPriceMin("");
    setPriceMax("");
    setSortBy("featured");
  };

  const activeFiltersCount =
    selectedCategories.length +
    (searchQuery ? 1 : 0) +
    (priceMin ? 1 : 0) +
    (priceMax ? 1 : 0);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.translations?.[currentLang] || "").toLowerCase().includes(q) ||
          (p.translations?.en || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "").includes(q) ||
          (p.attributes?.type || "").toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(
        (p) =>
          selectedCategories.includes(p.category?.id) ||
          (p.categories || []).some((c: any) => selectedCategories.includes(c.id))
      );
    }

    // Price filter
    const minVal = priceMin ? parseFloat(priceMin) : null;
    const maxVal = priceMax ? parseFloat(priceMax) : null;
    if (minVal !== null || maxVal !== null) {
      result = result.filter((p) => {
        const price = parseFloat(p.price || p.retail_price || p.b2b_price || 0);
        if (minVal !== null && price < minVal) return false;
        if (maxVal !== null && price > maxVal) return false;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      const priceA = parseFloat(a.price || a.retail_price || a.b2b_price || 0);
      const priceB = parseFloat(b.price || b.retail_price || b.b2b_price || 0);
      const nameA = (a.translations?.[currentLang] || a.translations?.en || "").toLowerCase();
      const nameB = (b.translations?.[currentLang] || b.translations?.en || "").toLowerCase();
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      if (sortBy === "name-asc") return nameA.localeCompare(nameB);
      if (sortBy === "name-desc") return nameB.localeCompare(nameA);
      return 0;
    });

    return result;
  }, [products, searchQuery, selectedCategories, priceMin, priceMax, sortBy, currentLang]);

  const selectedSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || t.featuredSort;

  // Sidebar component (reused for desktop + mobile)
  const FilterSidebar = () => (
    <div className="flex flex-col gap-0">

      {/* Header */}
      <div className={`flex items-center justify-between mb-6 pb-4 border-b border-stone-200 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <SlidersHorizontal className="w-4 h-4 text-stone-700" />
          <span className="font-bold text-stone-900 text-sm uppercase tracking-widest">{isRtl ? 'خيارات التصفية' : currentLang === 'de' ? 'Filter' : 'Filters'}</span>
          {activeFiltersCount > 0 && (
            <span className="bg-stone-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-stone-500 hover:text-rose-600 transition-colors font-medium underline"
          >
            {t.clearAll}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-1">
        <button
          onClick={() => toggleSection("search")}
          className={`w-full flex items-center justify-between py-4 text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 hover:text-stone-600 transition ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <span>{isRtl ? 'بحث' : currentLang === 'de' ? 'Suchen' : 'Search'}</span>
          {openSections.search ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.search && (
          <div className="pt-4 pb-2">
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full py-2.5 border border-stone-200 rounded-sm text-sm text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50 transition placeholder:text-stone-400 ${isRtl ? 'pl-9 pr-9 text-right' : 'pl-9 pr-9 text-left'}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 ${isRtl ? 'left-3' : 'right-3'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-1">
        <button
          onClick={() => toggleSection("category")}
          className={`w-full flex items-center justify-between py-4 text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 hover:text-stone-600 transition ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <span>{t.categoryLabel}</span>
          {openSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.category && (
          <div className="pt-4 pb-2 space-y-1">
            {categories.length === 0 ? (
              <p className={`text-xs text-stone-400 italic ${isRtl ? 'text-right' : 'text-left'}`}>No categories found</p>
            ) : (
              categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-sm transition-all ${isRtl ? 'flex-row-reverse' : ''} ${
                      isSelected
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <span className="font-medium">{cat.name?.[currentLang] || cat.name?.en || cat.slug}</span>
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-xs ${isSelected ? "text-stone-300" : "text-stone-400"}`}>
                        {products.filter((p) => p.category?.id === cat.id || (p.categories || []).some((c: any) => c.id === cat.id)).length}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-1">
        <button
          onClick={() => toggleSection("price")}
          className={`w-full flex items-center justify-between py-4 text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 hover:text-stone-600 transition ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <span>{t.priceRangeLabel}</span>
          {openSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {openSections.price && (
          <div className="pt-4 pb-2">
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1">
                <label className={`block text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>{t.minLabel}</label>
                <div className="relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 text-stone-400 text-sm ${isRtl ? 'right-3' : 'left-3'}`}>€</span>
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    className={`w-full py-2 border border-stone-200 rounded-sm text-sm text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50 transition ${isRtl ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3 text-left'}`}
                  />
                </div>
              </div>
              <div className="w-4 h-px bg-stone-300 mt-5 flex-shrink-0" />
              <div className="flex-1">
                <label className={`block text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>{t.maxLabel}</label>
                <div className="relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 text-stone-400 text-sm ${isRtl ? 'right-3' : 'left-3'}`}>€</span>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="999"
                    min="0"
                    className={`w-full py-2 border border-stone-200 rounded-sm text-sm text-stone-900 focus:outline-none focus:border-stone-900 bg-stone-50 transition ${isRtl ? 'pr-7 pl-3 text-right' : 'pl-7 pr-3 text-left'}`}
                  />
                </div>
              </div>
            </div>

            {/* Quick price presets */}
            <div className={`flex flex-wrap gap-2 mt-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {[
                { label: currentLang === 'ar' ? 'أقل من 100 يورو' : currentLang === 'de' ? 'Unter 100 €' : currentLang === 'fr' ? 'Moins de 100 €' : currentLang === 'nl' ? 'Onder €100' : 'Under €100', min: "", max: "100" },
                { label: "100–200 €", min: "100", max: "200" },
                { label: "200 € +", min: "200", max: "" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => { setPriceMin(preset.min); setPriceMax(preset.max); }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                    priceMin === preset.min && priceMax === preset.max
                      ? "bg-stone-900 text-white border-stone-900"
                      : "border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile apply button */}
      <button
        className="lg:hidden mt-6 bg-stone-900 text-white w-full py-3.5 rounded-sm font-bold uppercase tracking-widest text-xs"
        onClick={() => setShowMobileFilters(false)}
      >
        {currentLang === 'ar' ? `عرض ${filteredProducts.length} نتيجة` : currentLang === 'de' ? `${filteredProducts.length} Ergebnisse anzeigen` : currentLang === 'fr' ? `Afficher ${filteredProducts.length} résultats` : currentLang === 'nl' ? `Toon ${filteredProducts.length} resultaten` : `Show ${filteredProducts.length} Results`}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="bg-[#1c1917] text-white text-xs py-2.5 text-center tracking-widest font-medium">
        {currentLang === 'ar' ? 'شحن مجاني لجميع الطلبات الأكثر من 150 يورو' : currentLang === 'de' ? 'Kostenloser Versand für alle Bestellungen über 150 €' : currentLang === 'fr' ? 'Livraison gratuite pour toutes les commandes de plus de 150 €' : currentLang === 'nl' ? 'Gratis verzending voor alle bestellingen vanaf €150' : 'Complimentary shipping on all orders over €150'}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-10">
          <div className={`text-xs text-stone-400 mb-4 flex items-center gap-2 uppercase tracking-widest font-semibold ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Link href="/" className="hover:text-stone-900 transition-colors">{currentLang === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <span className="text-stone-300">/</span>
            <span className="text-stone-900">{t.fragrances}</span>
          </div>

          <div className={`flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-stone-200 pb-6 ${isRtl ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
            <div>
              <h1 className="text-4xl font-serif text-stone-900 mb-2 tracking-tight">{isRtl ? 'المجموعة العطرية' : currentLang === 'de' ? 'Die Kollektion' : 'The Collection'}</h1>
              <p className="text-stone-500 text-sm">
                {loading ? (isRtl ? "جاري التحميل..." : "Loading...") : `${filteredProducts.length} ${currentLang === 'ar' ? 'من' : currentLang === 'de' || currentLang === 'nl' ? 'von' : currentLang === 'fr' ? 'sur' : 'of'} ${products.length} ${isRtl ? 'عطر' : 'fragrances'}`}
              </p>
            </div>

            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {/* Mobile filter button */}
              <button
                className={`lg:hidden flex items-center gap-2 text-sm font-semibold text-stone-900 px-4 py-2.5 border border-stone-300 rounded-sm hover:bg-stone-50 transition ${isRtl ? 'flex-row-reverse' : ''}`}
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter className="w-4 h-4" />
                {isRtl ? 'تصفية' : 'Filters'}
                {activeFiltersCount > 0 && (
                  <span className="bg-stone-900 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className={`flex items-center gap-2 text-sm font-semibold text-stone-900 px-4 py-2.5 border border-stone-300 rounded-sm hover:bg-stone-50 transition min-w-[180px] justify-between ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <span>{selectedSortLabel}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                {showSortMenu && (
                  <div className={`absolute mt-1 w-52 bg-white border border-stone-200 rounded-sm shadow-xl z-30 ${isRtl ? 'left-0' : 'right-0'}`}>
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                        className={`w-full text-start px-4 py-3 text-sm transition flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''} ${
                          sortBy === opt.value
                            ? "bg-stone-900 text-white font-semibold"
                            : "text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        {opt.label}
                        {sortBy === opt.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <div className={`flex flex-wrap gap-2 mt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {searchQuery && (
                <span className={`flex items-center gap-1.5 bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {isRtl ? 'بحث' : 'Search'}: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedCategories.map((catId) => {
                const cat = categories.find((c) => c.id === catId);
                return (
                  <span key={catId} className={`flex items-center gap-1.5 bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {cat?.name?.[currentLang] || cat?.name?.en || catId}
                    <button onClick={() => toggleCategory(catId)}><X className="w-3 h-3" /></button>
                  </span>
                );
              })}
              {(priceMin || priceMax) && (
                <span className={`flex items-center gap-1.5 bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {priceMin ? `€${priceMin}` : "€0"} – {priceMax ? `€${priceMax}` : "any"}
                  <button onClick={() => { setPriceMin(""); setPriceMax(""); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-stone-500 hover:text-rose-600 transition-colors font-medium underline px-1"
              >
                {t.clearAll}
              </button>
            </div>
          )}
        </div>

        <div className={`flex gap-12 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-8 self-start">
            <FilterSidebar />
          </aside>

          {/* Mobile Sidebar Overlay */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
              <div className={`relative w-80 bg-white h-full overflow-y-auto p-6 shadow-2xl ${isRtl ? 'mr-auto' : 'ml-auto'}`}>
                <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <h2 className="text-lg font-serif font-bold text-stone-900">{isRtl ? 'خيارات التصفية' : 'Filters'}</h2>
                  <button onClick={() => setShowMobileFilters(false)} className="p-1 text-stone-400 hover:text-stone-900">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-[50vh] text-stone-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900 mb-4" />
                <p className="text-sm uppercase tracking-widest">{isRtl ? 'جاري تنظيم المجموعة...' : 'Curating Collection...'}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-serif font-bold text-stone-900 mb-2">{t.noProductsFound}</h3>
                <p className="text-stone-500 text-sm mb-6">{t.adjustFilters}</p>
                <button
                  onClick={clearFilters}
                  className="bg-stone-900 text-white px-6 py-2.5 rounded-sm text-sm font-semibold uppercase tracking-widest hover:bg-stone-800 transition"
                >
                  {t.resetFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-14">
                {filteredProducts.map((product, idx) => {
                  const displayPrice = parseFloat(product.price || product.retail_price || product.b2b_price || 0).toFixed(2);
                  const originalPrice =
                    product.retail_price && parseFloat(product.retail_price) > parseFloat(displayPrice)
                      ? parseFloat(product.retail_price).toFixed(2)
                      : null;

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{ animationFillMode: "both", animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/5] mb-5 overflow-hidden bg-stone-100 rounded-sm">
                        <Link href={`/shop/${product.sku || product.id}`} className="block w-full h-full">
                          <ProductHoverImage
                            mainImage={product.image_url}
                            secondaryImage={product.attributes?.additional_images?.[0]}
                            alt={product.translations?.[currentLang] || product.translations?.en || "Fragrance"}
                            fallbackImage={FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                          />
                        </Link>

                        {/* Category badge */}
                        {(product.category?.name?.[currentLang] || product.category?.name?.en) && (
                          <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`}>
                            <span className="bg-white/90 backdrop-blur text-stone-700 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
                              {product.category.name[currentLang] || product.category.name.en}
                            </span>
                          </div>
                        )}

                        {/* Quick Add Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                          <button
                            onClick={() => handleQuickAdd(product)}
                            className="w-full bg-white/95 backdrop-blur text-stone-900 py-3 text-xs uppercase tracking-widest font-bold hover:bg-stone-900 hover:text-white transition-colors flex items-center justify-center gap-2 shadow-lg rounded-sm"
                          >
                            {addedProductId === product.id ? (
                              <><Check className="w-4 h-4" /> {t.added}</>
                            ) : (
                              <><ShoppingCart className="w-4 h-4" /> {t.quickAdd}</>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col flex-grow text-center px-1">
                        <Link href={`/shop/${product.sku || product.id}`}>
                          <h3 className="font-serif text-stone-900 text-lg mb-1 hover:text-stone-500 transition-colors leading-snug">
                            {product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance"}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
                          {product.attributes?.brand && (
                            <span className="text-[9px] font-bold tracking-wider text-amber-800 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {product.attributes.brand}
                            </span>
                          )}
                          {product.attributes?.type && (
                            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                              {product.attributes.type}
                            </span>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-center gap-3 pt-1">
                          {originalPrice && (
                            <span className="text-sm text-stone-400 line-through">€{originalPrice}</span>
                          )}
                          <span className="font-bold text-stone-900 text-base">€{displayPrice}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}
