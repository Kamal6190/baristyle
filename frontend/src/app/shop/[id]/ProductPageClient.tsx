"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
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
  User,
  Heart,
  Edit3,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Filter
} from "lucide-react";
import axios from "axios";
import { resolveImageUrl } from "../../../utils/api";
import { translations, Locale } from "../../../utils/i18n";
import { formatPrice, getActiveCurrency } from "../../../utils/currency";
import { Zap } from "lucide-react";
import { trackViewContent, trackAddToCart, trackInitiateCheckout } from "../../../utils/pixel";
import { useWishlist } from "../../../components/WishlistProvider";
import CountdownTimer from "../../../components/CountdownTimer";
import ProductSchema from "../../../components/ProductSchema";
import FragrancePyramid from "../../../components/FragrancePyramid";
import { getPerfumeNotes, isPerfumeProduct } from "../../../utils/productUtils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=600&auto=format&fit=crop",
];

const popupTranslations = {
  de: {
    addedTitle: "In den Warenkorb gelegt!",
    continueShopping: "Weiter einkaufen",
    goCheckout: "Jetzt kaufen / Zur Kasse",
    quantity: "Menge",
    expressBuyNow: "⚡ Express-Kauf / Direkt kaufen",
  },
  en: {
    addedTitle: "Added to shopping cart!",
    continueShopping: "Continue shopping",
    goCheckout: "Checkout now",
    quantity: "Qty",
    expressBuyNow: "⚡ Express Buy / Instant Checkout",
  },
  ar: {
    addedTitle: "تمت الإضافة إلى السلة بنجاح!",
    continueShopping: "متابعة التسوق",
    goCheckout: "إتمام الشراء الآن",
    quantity: "الكمية",
    expressBuyNow: "⚡ شراء سريع مباشر (دفع فوري)",
  },
  fr: {
    addedTitle: "Ajouté au panier !",
    continueShopping: "Continuer mes achats",
    goCheckout: "Passer à la caisse",
    quantity: "Qté",
    expressBuyNow: "⚡ Achat Express / Commander",
  },
  nl: {
    addedTitle: "Toegevoegd aan winkelwagen!",
    continueShopping: "Verder winkelen",
    goCheckout: "Nu afrekenen",
    quantity: "Aantal",
    expressBuyNow: "⚡ Snel afrekenen / Nu kopen",
  }
};

export default function ProductPageClient({ initialProduct, id: propId }: { initialProduct: any; id: string }) {
  const id = propId;
  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expressLoading, setExpressLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  // Swipe gesture state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [imageZoomed, setImageZoomed] = useState(false);
  // Fake social proof
  const [viewersCount] = useState(() => Math.floor(Math.random() * 30) + 18);
  const [lastBuyMinutes] = useState(() => Math.floor(Math.random() * 8) + 1);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings`);
        if (response.data.shipping_methods) {
          setShippingMethods(response.data.shipping_methods);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // Currency Tick
  const [currencyTick, setCurrencyTick] = useState(0);
  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyTick(c => c + 1);
    window.addEventListener('currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('currency-changed', handleCurrencyChange);
  }, []);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'scent-pyramid'>('description');
  
  // Language State
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  
  // Reviews data state
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Reviews Pagination, Filtering & Sorting State
  const [reviewPage, setReviewPage] = useState<number>(1);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const reviewsContainerRef = useRef<HTMLDivElement>(null);
  const REVIEWS_PER_PAGE = 6;
  
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
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);

  const fetchSimilarProducts = async (currentProduct: any) => {
    if (!currentProduct) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/products`, { headers });
      const allProducts = response.data;
      if (Array.isArray(allProducts)) {
        const currentCatId = currentProduct.category?.id || currentProduct.category_id;
        
        // Determine B2B status from local storage
        const savedUser = localStorage.getItem('user');
        let userIsB2B = false;
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            userIsB2B = parsed.role === 'SUPER_ADMIN' || parsed.role === 'SELLER';
          } catch (e) {
            console.error(e);
          }
        }

        // Filter products in the same category, excluding the current product
        const filtered = allProducts.filter((p: any) => {
          const isSame = p.id === currentProduct.id || p.sku === currentProduct.sku;
          const pCatId = p.category?.id || p.category_id;
          const pIsWholesaleOnly = p.sales_mode === 'WHOLESALE_ONLY' || p.attributes?.sales_mode === 'WHOLESALE_ONLY';
          
          if (!userIsB2B && pIsWholesaleOnly) return false;
          
          return !isSame && pCatId && pCatId === currentCatId;
        });
        
        // Fallback: if we find fewer than 4 similar products, fill the rest with products from other categories
        if (filtered.length < 4) {
          const otherProducts = allProducts.filter((p: any) => {
            const isSame = p.id === currentProduct.id || p.sku === currentProduct.sku;
            const pCatId = p.category?.id || p.category_id;
            const pIsWholesaleOnly = p.sales_mode === 'WHOLESALE_ONLY' || p.attributes?.sales_mode === 'WHOLESALE_ONLY';
            
            if (!userIsB2B && pIsWholesaleOnly) return false;
            
            return !isSame && (!pCatId || pCatId !== currentCatId);
          });
          const combined = [...filtered, ...otherProducts].slice(0, 4);
          setSimilarProducts(combined);
        } else {
          setSimilarProducts(filtered.slice(0, 4));
        }
      }
    } catch (error) {
      console.error("Failed to fetch similar products", error);
    }
  };

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/products/${id}`, { headers });
      const freshProduct = response.data;
      setProduct(freshProduct);
      
      if (freshProduct) {
        if (freshProduct.sku || freshProduct.id) {
          fetchReviews(freshProduct.sku || freshProduct.id);
        }
        fetchSimilarProducts(freshProduct);
      }
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
    
    // Immediately load similar products & reviews with initialProduct for better UX
    if (product) {
      fetchSimilarProducts(product);
      fetchReviews(product.sku || id);
    }
    
    // Always trigger the dynamic fetch to ensure latest data (prices, stock, etc.)
    fetchProduct();
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
      document.title = `${prodName} | BS Baristore`;

      const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && product.attributes?.sales_mode !== 'RETAIL_ONLY';
      const activePriceVal = isB2B
        ? parseFloat(product.b2b_price || 0)
        : parseFloat(product.sales_price_with_tax || product.price || product.retail_price || 0);
      trackViewContent(product, activePriceVal, getActiveCurrency());

      // Silently update legacy UUIDs with clean, domain-aligned, SEO-friendly SKUs in the address bar
      if (product.sku && id !== product.sku) {
        window.history.replaceState(null, "", `/shop/${product.sku}`);
      }

      const isVE = !product.attributes?.b2b_qty_mode || product.attributes?.b2b_qty_mode === 'VE';
      const m = isB2B && product.b2bMinQty ? Number(product.b2bMinQty) : 1;
      setQuantity(isB2B ? (isVE ? 1 : m) : 1);
    }
  }, [product, currentLang, id, currentUser]);

  useEffect(() => {
    if (product?.image_url) {
      setActiveImage(resolveImageUrl(product.image_url));
    }
  }, [product?.id, product?.sku, product?.image_url]);

  const addToCart = () => {
    if (!product) return;
    const stock = product.stock_quantity ?? 0;
    if (stock <= 0) return;
    
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id);
    const existingQty = existingItemIndex > -1 ? existingCart[existingItemIndex].quantity : 0;
    
    const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && product.attributes?.sales_mode !== 'RETAIL_ONLY';
    const isVE = !product.attributes?.b2b_qty_mode || product.attributes?.b2b_qty_mode === 'VE';
    const actualQty = isB2B
      ? (isVE ? quantity * Number(product.b2bMinQty || 1) : quantity)
      : quantity;
    const totalQty = existingQty + actualQty;
    
    if (totalQty > stock) {
      const maxCanAdd = stock - existingQty;
      if (maxCanAdd <= 0) {
        alert(currentLang === 'ar' ? `لديك بالفعل ${existingQty} في السلة (الحد الأقصى: ${stock})` : `You already have ${existingQty} in your cart (max available: ${stock})`);
        return;
      }
      alert(currentLang === 'ar' ? `يمكنك إضافة ${maxCanAdd} فقط (لديك ${existingQty} في السلة)` : `You can only add ${maxCanAdd} more (you have ${existingQty} in cart, stock: ${stock})`);
      return;
    }

    if (isB2B) {
      const m = product.b2bMinQty ? Number(product.b2bMinQty) : 1;
      if (actualQty < m) {
        alert(currentLang === 'ar' ? `الحد الأدنى لطلب هذا المنتج للجملة هو ${m} قطع` : `Minimum wholesale quantity for this product is ${m} items`);
        return;
      }
      if (!isVE && m > 1 && (actualQty % 1 !== 0)) {
        alert(currentLang === 'ar' ? `يرجى إدخال كمية صحيحة` : `Please enter a valid whole quantity`);
        return;
      }
    }

    const activePriceVal = isB2B
      ? parseFloat(product.b2b_price || 0)
      : parseFloat(product.sales_price_with_tax || product.price || product.retail_price || 0);
    const displayPrice = activePriceVal.toFixed(2);
    
    const cartItem = {
      id: product.id,
      name: product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance",
      price: displayPrice,
      image_url: product.image_url,
      quantity: actualQty,
      b2bMinQty: product.b2bMinQty,
      b2bQtyMode: product.attributes?.b2b_qty_mode || 'VE',
      stock_quantity: product.stock_quantity,
      variant_type: product.attributes?.type || '100ml Eau de Parfum'
    };

    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += actualQty;
    } else {
      existingCart.push(cartItem);
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('open-cart-drawer'));
    
    trackAddToCart(product, actualQty, activePriceVal, getActiveCurrency());

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    // Disabled redundant central popup modal since we have the Slide-out Cart Drawer
    // setShowAddedModal(true);
  };

  const handleExpressCheckout = async () => {
    if (!product) return;
    const stock = product.stock_quantity ?? 0;
    if (stock <= 0) return;

    const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && product.attributes?.sales_mode !== 'RETAIL_ONLY';
    const actualQty = isB2B ? quantity * Number(product.b2bMinQty || 1) : quantity;

    if (actualQty > stock) {
      alert(currentLang === 'ar' ? `الكمية المطلوبة تتجاوز الكمية المتوفرة في المخزن (${stock})` : `Requested quantity exceeds available stock (${stock})`);
      return;
    }

    if (isB2B) {
      const m = product.b2bMinQty ? Number(product.b2bMinQty) : 1;
      if (actualQty < m) {
        alert(currentLang === 'ar' ? `الحد الأدنى لطلب هذا المنتج للجملة هو ${m} قطع` : `Minimum wholesale quantity for this product is ${m} items`);
        return;
      }
    }

    setExpressLoading(true);
    try {
      const activePriceVal = isB2B
        ? parseFloat(product.b2b_price || 0)
        : parseFloat(product.sales_price_with_tax || product.price || product.retail_price || 0);

      const items = [{
        id: product.id,
        name: product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance",
        price: activePriceVal.toFixed(2),
        quantity: actualQty,
        sku: product.sku || '',
        image_url: product.image_url || '',
      }];

      const subtotal = activePriceVal * actualQty;
      trackAddToCart(product, actualQty, activePriceVal, getActiveCurrency());
      trackInitiateCheckout(items, subtotal, getActiveCurrency());
      const defaultMethod = shippingMethods.find((m: any) => m.name.toLowerCase().includes('dhl') || m.name.toLowerCase().includes('standard')) || shippingMethods[0];
      const baseCost = defaultMethod ? parseFloat(defaultMethod.cost) : 4.90;
      const methodName = defaultMethod ? defaultMethod.name : 'Express Shipping';
      const shippingFee = subtotal >= 150 ? 0 : baseCost;

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(`${API_URL}/checkout/create-session`, {
        items,
        customer_country: 'DE',
        shipping_fee: shippingFee,
        shipping_name: methodName,
        couponCode: '',
        order_type: isB2B ? 'Wholesale' : 'Retail',
        currency: getActiveCurrency(),
      }, { headers });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Express checkout failed:', err);
      alert(currentLang === 'ar' ? 'فشل إنشاء جلسة الدفع السريع، يرجى المحاولة مرة أخرى' : 'Failed to initialize express checkout, please try again.');
    } finally {
      setExpressLoading(false);
    }
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && product?.attributes?.sales_mode !== 'RETAIL_ONLY';
    const isVE = !product?.attributes?.b2b_qty_mode || product?.attributes?.b2b_qty_mode === 'VE';
    const minVal = isB2B && !isVE ? Number(product.b2bMinQty || 1) : 1;

    if (isNaN(val) || val < minVal) {
      setQuantity(minVal);
    } else {
      setQuantity(val);
    }
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

  const isWholesaleOnly = product?.sales_mode === 'WHOLESALE_ONLY' || product?.attributes?.sales_mode === 'WHOLESALE_ONLY';
  const isUserB2B = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER';

  if (!product) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-serif text-stone-900 mb-4">{t.productNotFound}</h1>
        <Link href="/shop" className="text-stone-500 underline">{t.returnToShop}</Link>
      </div>
    );
  }

  const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && product.attributes?.sales_mode !== 'RETAIL_ONLY';
  const activePriceVal = isB2B
    ? parseFloat(product.b2b_price || 0)
    : parseFloat(product.sales_price_with_tax || product.price || product.retail_price || 0);
  const displayPrice = activePriceVal.toFixed(2);
  const fallbackImage = "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop";

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<\/p>|<\/div>|<\/td>|<\/tr>|<\/li>|<br\s*\/?>/gi, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Dynamic values helper
  const getShortDescHtml = () => {
    if (!product.short_description) return '';
    let raw = typeof product.short_description === 'string'
      ? product.short_description
      : (product.short_description[currentLang] || product.short_description.de || product.short_description.en || product.short_description.ar || '');
    
    if (!raw || typeof raw !== 'string') return '';

    // Remove Kopfnote, Herznote, Basisnote sections from top short description box so it stays clean
    raw = raw
      .replace(/(?:Kopfnote|Top\s*Note|Topnote|افتتاحية|القمة)\s*:\s*([^:\n\r<]+?)(?=(?:Herznote|Basisnote|Heart\s*Note|Base\s*Note|Inhalt|EAN|Typ|القلب|القاعدة|<|\n|\r|$))/gi, '')
      .replace(/(?:Herznote|Heart\s*Note|Heartnote|القلب)\s*:\s*([^:\n\r<]+?)(?=(?:Basisnote|Base\s*Note|Inhalt|EAN|Typ|القاعدة|<|\n|\r|$))/gi, '')
      .replace(/(?:Basisnote|Base\s*Note|Basenote|القاعدة)\s*:\s*([^:\n\r<]+?)(?=(?:Inhalt|EAN|Typ|<|\n|\r|$))/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!raw) return '';

    const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
    if (hasHtml) {
      return raw.replace(/\r?\n/g, '<br/>');
    }

    // Auto-format labels and line breaks if plain text
    let formatted = raw
      .replace(/(Typ\s*:)/gi, '<br/><strong>$1</strong>')
      .replace(/(Inhalt\s*:|Volume\s*:|Capacity\s*:|الحجم\s*:)/gi, '<br/><strong>$1</strong>')
      .replace(/(EAN\s*:|SKU\s*:|Barcode\s*:)/gi, '<br/><strong>$1</strong>')
      .replace(/^(<br\/>)+/, '')
      .replace(/\r?\n/g, '<br/>');

    return formatted;
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

  const shortDescriptionHtml = getShortDescHtml();
  const hasReviews = reviewsData && reviewsData.reviews && reviewsData.reviews.length > 0;
  const ratingAverage = reviewsData ? reviewsData.average : 4.9;
  const ratingTotal = reviewsData ? reviewsData.total : 128;

  // Computed reviews with filter & sorting
  const filteredAndSortedReviews = useMemo(() => {
    if (!reviewsData?.reviews || !Array.isArray(reviewsData.reviews)) return [];
    let list = [...reviewsData.reviews];

    if (selectedStarFilter !== null) {
      list = list.filter((r: any) => r.rating === selectedStarFilter);
    }

    if (reviewSort === 'highest') {
      list.sort((a: any, b: any) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (reviewSort === 'lowest') {
      list.sort((a: any, b: any) => a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [reviewsData, selectedStarFilter, reviewSort]);

  const totalFilteredReviews = filteredAndSortedReviews.length;
  const totalReviewPages = Math.max(1, Math.ceil(totalFilteredReviews / REVIEWS_PER_PAGE));
  
  const paginatedReviews = useMemo(() => {
    const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
    return filteredAndSortedReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [filteredAndSortedReviews, reviewPage]);

  const handleReviewPageChange = (newPage: number) => {
    const pageNum = Math.max(1, Math.min(newPage, totalReviewPages));
    setReviewPage(pageNum);
    if (reviewsContainerRef.current) {
      reviewsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalReviewPages <= 7) {
      for (let i = 1; i <= totalReviewPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (reviewPage > 3) pages.push('...');
      const start = Math.max(2, reviewPage - 1);
      const end = Math.min(totalReviewPages - 1, reviewPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (reviewPage < totalReviewPages - 2) pages.push('...');
      pages.push(totalReviewPages);
    }
    return pages;
  };

  // Is Arabic layout activated
  const isRtl = currentLang === 'ar';

  const categoryName = product.category 
    ? (product.category.name?.[currentLang] || product.category.name?.de || product.category.name?.en || product.category.name?.ar || "Category")
    : t.fragrances;
  const categoryLink = product.category 
    ? `/shop?category=${encodeURIComponent(product.category.slug || '')}`
    : '/shop';

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-32 lg:pb-24 text-stone-800" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navigation */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-medium text-stone-500">
            <Link href="/shop" className="flex items-center gap-1 hover:text-stone-900 transition">
              <ArrowLeft className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} /> {t.backToShop}
            </Link>
            <span className="text-stone-300">|</span>
            <Link href={categoryLink} className="hover:text-stone-900 transition">{categoryName}</Link>
            <span className="text-stone-300">/</span>
            <span className="text-stone-900 font-semibold">{product.translations?.[currentLang] || product.translations?.en || "Product"}</span>
          </div>
          <Link href="/checkout" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-stone-500 transition">
            <ShoppingBag className="w-4 h-4" /> {t.checkout}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Product Images */}
          <div className="space-y-3">
            {(() => {
              // Build images array
              const images: string[] = [];
              if (product.image_url) {
                const parts = typeof product.image_url === 'string'
                  ? product.image_url.split(',').map((url: string) => resolveImageUrl(url.trim())).filter(Boolean)
                  : [resolveImageUrl(product.image_url)].filter(Boolean);
                images.push(...(parts as string[]));
              }
              if (product.attributes?.additional_images) {
                const addImgs = product.attributes.additional_images;
                if (Array.isArray(addImgs)) {
                  addImgs.forEach((img: any) => {
                    if (typeof img === 'string') {
                      img.split(',').map((url: string) => resolveImageUrl(url.trim())).filter((url: string) => url && !images.includes(url)).forEach((url: string) => images.push(url));
                    }
                  });
                } else if (typeof addImgs === 'string') {
                  addImgs.split(',').map((url: string) => resolveImageUrl(url.trim())).filter((url: string) => url && !images.includes(url)).forEach((url: string) => images.push(url));
                }
              }
              if (images.length === 0) images.push(fallbackImage);

              const currentIdx = Math.min(activeImageIndex, images.length - 1);
              const currentImg = images[currentIdx] || fallbackImage;

              const goTo = (idx: number) => {
                const clamped = Math.max(0, Math.min(idx, images.length - 1));
                setActiveImageIndex(clamped);
                setActiveImage(images[clamped]);
              };

              return (
                <>
                  {/* Main Image with Swipe + Zoom */}
                  <div
                    className="aspect-square bg-white relative overflow-hidden rounded-2xl shadow-md border border-stone-100 select-none"
                    onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                    onTouchEnd={(e) => {
                      if (touchStartX === null) return;
                      const diff = touchStartX - e.changedTouches[0].clientX;
                      if (Math.abs(diff) > 40) {
                        if (diff > 0) goTo(currentIdx + 1);
                        else goTo(currentIdx - 1);
                      }
                      setTouchStartX(null);
                    }}
                    onClick={() => setImageZoomed(z => !z)}
                  >
                    {/* Discount badge on image */}
                    {(() => {
                      const compareP = parseFloat(product.retail_price || 0);
                      const activeP = parseFloat(product.sales_price_with_tax || product.price || 0);
                      const disc = compareP > activeP && compareP > 0 ? Math.round(((compareP - activeP) / compareP) * 100) : 0;
                      return disc > 0 ? (
                        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                          -{disc}%
                        </div>
                      ) : null;
                    })()}

                    {/* Nav arrows (desktop only) */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); goTo(currentIdx - 1); }}
                          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                          aria-label="Prev"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); goTo(currentIdx + 1); }}
                          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md items-center justify-center hover:bg-white transition"
                          aria-label="Next"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </>
                    )}

                    <img
                      src={currentImg}
                      alt={product.translations?.[currentLang] || product.translations?.en || "Product"}
                      className={`absolute inset-0 w-full h-full object-contain p-4 transition-all duration-500 ${
                        imageZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in hover:scale-105'
                      }`}
                      onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                    />

                    {/* Dot indicators */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); goTo(i); }}
                            className={`rounded-full transition-all duration-300 ${
                              i === currentIdx
                                ? 'w-4 h-2 bg-stone-900'
                                : 'w-2 h-2 bg-stone-400/60 hover:bg-stone-600'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails Row */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {images.map((imgUrl, index) => (
                        <button
                          key={index}
                          onClick={() => goTo(index)}
                          className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden transition-all duration-200 bg-white ${
                            index === currentIdx
                              ? 'border-stone-900 ring-2 ring-stone-900/10 shadow-sm'
                              : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`View ${index + 1}`}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Right: Product Details */}
          <div className="flex flex-col pt-2 lg:pt-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {product.attributes?.brand && (
                  <span className="text-[10px] font-bold tracking-[0.2em] text-amber-800 uppercase bg-amber-50 px-2 py-1 rounded-sm border border-amber-200">
                    {product.attributes.brand}
                  </span>
                )}
                <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-700 uppercase bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100">
                  {product.category?.name?.[currentLang] || product.category?.name?.en || "Premium Extract"}
                </span>
              </div>

              {/* Admin Edit Product Button */}
              {currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'SELLER') && (
                <Link
                  href={`/admin?editProduct=${encodeURIComponent(product.id || product.sku)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition-all transform hover:scale-105"
                  title={currentLang === 'ar' ? 'تعديل المنتج' : currentLang === 'de' ? 'Produkt bearbeiten' : 'Edit Product'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ar' ? 'تعديل المنتج' : currentLang === 'de' ? 'Produkt bearbeiten' : 'Edit Product'}</span>
                </Link>
              )}
            </div>
            
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-stone-900 mb-3 leading-tight flex-1">
                {product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance"}
              </h1>
              {/* Wishlist Heart Button */}
              <WishlistHeartButton product={product} currentLang={currentLang} />
            </div>
            
            {/* Reviews Summary Rating */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 pb-6 sm:mb-8 sm:pb-8 border-b border-stone-200">
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
            {shortDescriptionHtml && (
              <div 
                className="text-stone-700 leading-relaxed mb-8 text-base font-sans space-y-1 bg-stone-50/70 p-4 rounded-xl border border-stone-200/50 shadow-2xs"
                dangerouslySetInnerHTML={{ __html: shortDescriptionHtml }}
              />
            )}

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
                          const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && v.attributes?.sales_mode !== 'RETAIL_ONLY';
                          const minQty = isB2B && v.b2bMinQty ? Number(v.b2bMinQty) : 1;
                          setProduct({
                            ...product,
                            ...v,
                            variants: product.variants
                          });
                          setQuantity(minQty);
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
                const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && product.attributes?.sales_mode !== 'RETAIL_ONLY';
                const b2bPrice = parseFloat(product.b2b_price || 0);
                const b2cPrice = parseFloat(product.sales_price_with_tax || product.price || 0);
                
                // Guard: don't render price until client is mounted (user data loaded from localStorage)
                // Guard: don't render price until client is mounted (user data loaded from localStorage)
                if (!isMounted) {
                  return (
                    <div className="flex flex-col gap-2 mb-6">
                      <div className="h-10 w-32 bg-stone-200 animate-pulse rounded" />
                    </div>
                  );
                }

                if (isWholesaleOnly && !isB2B) {
                  return (
                    <div className="flex flex-col gap-1 mb-6">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">{t.wholesalePrice}</span>
                      <span className="text-xl font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-lg w-fit uppercase tracking-wider">
                        {currentLang === 'ar' ? 'للجملة فقط' : 'Nur für B2B / Großhandel'}
                      </span>
                    </div>
                  );
                }

                const activePrice = isB2B ? b2bPrice : b2cPrice;
                const comparePrice = parseFloat(product.retail_price || 0);
                
                const hasDiscount = isB2B 
                  ? (comparePrice > b2bPrice)
                  : (comparePrice > b2cPrice);
                
                const discountPercentage = hasDiscount 
                  ? Math.round(((comparePrice - activePrice) / comparePrice) * 100)
                  : 0;

                return (
                  <div className="flex flex-col gap-2 mb-6">
                    {isB2B ? (
                      // B2B Pricing View
                      <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 flex flex-col gap-3">
                        <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-sm w-fit uppercase tracking-wider">
                          {t.wholesalePrice}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex flex-col">
                            <span className="text-4xl font-bold text-emerald-700 notranslate" translate="no">
                              {formatPrice(b2bPrice)}
                            </span>
                          </div>
                          
                          {comparePrice > 0 && (
                            <div className="flex flex-col border-l border-emerald-200 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">
                                {t.retailPrice}
                              </span>
                              <span className="text-xl font-medium text-stone-400 line-through notranslate" translate="no">
                                {formatPrice(comparePrice)}
                              </span>
                            </div>
                          )}

                          {hasDiscount && (
                            <div className="mt-2 sm:mt-0">
                              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
                                <Flame className="w-3 h-3 fill-white text-white" />
                                {currentLang === 'ar' ? `توفير الجملة ${discountPercentage}%` : `B2B Save ${discountPercentage}%`}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-stone-500 font-sans tracking-normal mt-1 block">
                          / {product.attributes?.type || '100ml Eau de Parfum'}
                        </span>
                      </div>
                    ) : (
                      // B2C Pricing View
                      hasDiscount ? (
                        <>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">
                                {currentLang === 'ar' ? 'السعر بعد الخصم' : 
                                 currentLang === 'de' ? 'Aktionspreis' : 
                                 currentLang === 'fr' ? 'Prix réduit' : 
                                 currentLang === 'nl' ? 'Actieprijs' : 'Special Price'}
                              </span>
                              <span className="text-4xl font-bold text-emerald-700 notranslate" translate="no">
                                {formatPrice(activePrice)}
                              </span>
                            </div>
                            
                            <div className="flex flex-col border-l border-stone-200 pl-4 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.15em]">
                                {currentLang === 'ar' ? 'السعر قبل الخصم' : 
                                 currentLang === 'de' ? 'Originalpreis' : 
                                 currentLang === 'fr' ? 'Prix d\'origine' : 
                                 currentLang === 'nl' ? 'Originele prijs' : 'Original Price'}
                              </span>
                              <span className="text-xl font-medium text-stone-400 line-through notranslate" translate="no">
                                {formatPrice(comparePrice)}
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
                          <span className="text-4xl font-bold text-stone-900 notranslate" translate="no">
                            {formatPrice(activePrice)}{" "}
                            <span className="text-sm font-medium text-stone-500 font-sans tracking-normal notranslate" translate="no">
                              / {product.attributes?.type || '100ml'}
                            </span>
                          </span>
                        </>
                      )
                    )}
                  </div>
                );
              })()}

              {/* Wholesale Banner (Only show if no token or role is guest) */}
              {isMounted && !localStorage.getItem('token') && !isWholesaleOnly && (
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

            {/* Stock Availability Info + Urgency Bar */}
            <div className="mb-5">
              {(product.stock_quantity ?? 0) > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      {product.stock_quantity <= 5
                        ? (currentLang === 'ar' ? `⚠️ ${product.stock_quantity} قطع متبقية فقط!` : currentLang === 'de' ? `⚠️ Nur noch ${product.stock_quantity} verfügbar!` : `⚠️ Only ${product.stock_quantity} left!`)
                        : (currentLang === 'ar' ? `✓ متوفر في المخزن` : currentLang === 'de' ? `✓ Auf Lager` : `✓ In Stock`)}
                    </span>
                    {product.stock_quantity <= 20 && (
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                        {currentLang === 'ar' ? 'نفاد سريع' : currentLang === 'de' ? 'Schnell ausverkauft' : 'Selling fast'}
                      </span>
                    )}
                  </div>
                  {/* Visual stock bar */}
                  {product.stock_quantity <= 30 && (
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (product.stock_quantity / 30) * 100)}%`,
                          backgroundColor: product.stock_quantity <= 5 ? '#ef4444' : product.stock_quantity <= 10 ? '#f97316' : '#22c55e'
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {currentLang === 'ar' ? 'نفذت الكمية' : currentLang === 'de' ? 'Ausverkauft' : 'Out of Stock'}
                </span>
              )}
            </div>

            {/* Social Proof Bar */}
            {isMounted && (product.stock_quantity ?? 0) > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {currentLang === 'ar' ? `${viewersCount} شخص يشاهد الآن` : currentLang === 'de' ? `${viewersCount} sehen das gerade` : `${viewersCount} viewing now`}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full">
                  ⚡
                  {currentLang === 'ar' ? `آخر شراء منذ ${lastBuyMinutes} دقيقة` : currentLang === 'de' ? `Letzter Kauf vor ${lastBuyMinutes} Min.` : `Last purchase ${lastBuyMinutes} min ago`}
                </span>
              </div>
            )}

            {/* B2B Minimum Purchase Quantity badge */}
            {isMounted && isB2B && product.b2bMinQty > 1 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 p-3.5 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-750 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-amber-900 block uppercase tracking-wider">
                    {currentLang === 'ar' ? 'الحد الأدنى لكمية الشراء للجملة' : 
                     currentLang === 'de' ? 'Mindestabnahmemenge für B2B' : 
                     currentLang === 'fr' ? 'Quantité minimale B2B' : 
                     currentLang === 'nl' ? 'Minimale afname B2B' : 'B2B Minimum Purchase Quantity'}
                  </span>
                  <span className="text-xs text-amber-800 leading-relaxed font-semibold">
                    {currentLang === 'ar' ? `يجب طلب ${product.b2bMinQty} قطع على الأقل من هذا المنتج لإتمام الطلب.` : 
                     currentLang === 'de' ? `Sie müssen mindestens ${product.b2bMinQty} Stück dieses Produkts bestellen.` : 
                     `You must order at least ${product.b2bMinQty} units of this product.`}
                  </span>
                </div>
              </div>
            )}

            {/* Form / Actions */}
            {isMounted && isWholesaleOnly && !isB2B ? (
              <div className="bg-[#1A1F2C] text-white p-5 rounded-xl border border-stone-850 flex flex-col gap-4 shadow-lg mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-snug">
                      {currentLang === 'ar' ? 'هذا المنتج مخصص للبيع بالجملة فقط' : 'Dieses Produkt ist nur für B2B-Großhandelskunden verfügbar'}
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5 leading-normal">
                      {currentLang === 'ar' ? 'يرجى تسجيل الدخول كتاجر لعرض الأسعار والطلب.' : 'Bitte loggen Sie sich als B2B-Kunde ein, um Preise zu sehen und zu bestellen.'}
                    </p>
                  </div>
                </div>
                <Link href="/login" className="w-full bg-[#d40026] hover:bg-red-700 text-white text-xs font-bold py-3 rounded-lg text-center transition shadow-sm relative z-10">
                  {currentLang === 'ar' ? 'تسجيل الدخول كتاجر' : 'Als B2B-Kunde anmelden'}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex border border-stone-300 bg-white items-center">
                      <button onClick={() => {
                        const isVE = !product.attributes?.b2b_qty_mode || product.attributes?.b2b_qty_mode === 'VE';
                        const minVal = isB2B && !isVE ? Number(product.b2bMinQty || 1) : 1;
                        setQuantity(Math.max(minVal, quantity - 1));
                      }} className="px-4 py-3 text-stone-500 hover:text-stone-900 transition hover:bg-stone-50" disabled={(product.stock_quantity ?? 0) <= 0}>-</button>
                      <div className="flex items-center px-1.5 border-x border-stone-300 bg-white">
                        <input
                          type="number"
                          min={isB2B && !(!product.attributes?.b2b_qty_mode || product.attributes?.b2b_qty_mode === 'VE') ? Number(product.b2bMinQty || 1) : 1}
                          value={quantity}
                          onChange={handleQuantityInput}
                          disabled={(product.stock_quantity ?? 0) <= 0}
                          className="py-3 text-stone-900 font-medium w-10 text-center bg-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {isMounted && isB2B && product.b2bMinQty > 1 && (
                          <span className="text-stone-500 text-sm font-bold select-none ml-1">
                            {(!product.attributes?.b2b_qty_mode || product.attributes?.b2b_qty_mode === 'VE') ? (
                              `(${quantity * Number(product.b2bMinQty)})`
                            ) : (
                              `(Stück)`
                            )}
                          </span>
                        )}
                      </div>
                      <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-stone-500 hover:text-stone-900 transition hover:bg-stone-50" disabled={(product.stock_quantity ?? 0) <= 0}>+</button>
                    </div>
                    {isMounted && isB2B && product.b2bMinQty > 1 && (
                      <span className="text-[10px] text-emerald-600 font-bold text-center mt-1">
                        {currentLang === 'ar' ? 'المجموع الصافي: ' : 'Netto-Summe: '}
                        <span className="notranslate" translate="no">
                          {formatPrice(
                            ((!product.attributes?.b2b_qty_mode || product.attributes?.b2b_qty_mode === 'VE') 
                              ? quantity * Number(product.b2bMinQty) 
                              : quantity) * parseFloat(product.b2b_price || 0)
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={addToCart}
                    disabled={!isMounted || (product.stock_quantity ?? 0) <= 0}
                    className={`flex-1 py-4 rounded-sm font-semibold flex items-center justify-center gap-2 transition shadow-md ${!isMounted ? 'bg-stone-300 text-white cursor-wait' : (product.stock_quantity ?? 0) <= 0 ? 'bg-stone-400 text-white cursor-not-allowed' : addedToCart ? 'bg-emerald-600 text-white' : 'bg-stone-900 text-white hover:bg-black'}`}
                  >
                    {!isMounted ? (
                      <><RefreshCw className="w-5 h-5 animate-spin" /> {currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</>
                    ) : (product.stock_quantity ?? 0) <= 0 ? (
                      <><AlertCircle className="w-5 h-5" /> {currentLang === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}</>
                    ) : addedToCart ? (
                      <>{t.addedToCart}</>
                    ) : (
                      <><ShoppingBag className="w-5 h-5" /> {t.addToCart}</>
                    )}
                  </button>
                </div>

                {/* Sale Countdown Timer */}
                {isMounted && product.sale_end_date && (
                  <div className="mb-4">
                    <CountdownTimer
                      endDate={product.sale_end_date}
                      lang={currentLang as any}
                      label={currentLang === 'ar' ? 'ينتهي العرض خلال' :
                             currentLang === 'de' ? 'Angebot endet in' :
                             currentLang === 'fr' ? 'Offre expire dans' :
                             currentLang === 'nl' ? 'Aanbieding eindigt over' : 'Offer ends in'}
                    />
                  </div>
                )}

                {/* Express Checkout Button */}
                {isMounted && !isB2B && (
                  <button
                    onClick={handleExpressCheckout}
                    disabled={expressLoading || (product.stock_quantity ?? 0) <= 0}
                    className="w-full py-4 mb-8 bg-[#1A1F2C] hover:bg-[#11141D] text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition duration-300 rounded-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    {expressLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
                        <span>{popupTranslations[currentLang]?.expressBuyNow || popupTranslations.de.expressBuyNow}</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {/* Trust Badges — 2×2 grid on mobile */}
            <div className="pt-6 border-t border-stone-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">{t.authenticDesc}</span>
                    <span className="text-[10px] text-stone-500 leading-snug">{t.authenticSub}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">{t.fastShipping}</span>
                    <span className="text-[10px] text-stone-500 leading-snug">{t.fastShippingSub}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <Lock className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">
                      {currentLang === 'ar' ? 'دفع آمن 100%' : currentLang === 'de' ? 'Sichere Zahlung' : 'Secure Payment'}
                    </span>
                    <span className="text-[10px] text-stone-500 leading-snug">SSL · Stripe · PayPal</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 bg-stone-50 rounded-xl p-3 border border-stone-100">
                  <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">
                      {currentLang === 'ar' ? 'إرجاع 30 يوم' : currentLang === 'de' ? '30 Tage Rückgabe' : '30-Day Returns'}
                    </span>
                    <span className="text-[10px] text-stone-500 leading-snug">
                      {currentLang === 'ar' ? 'ضمان استرداد كامل' : currentLang === 'de' ? 'Volle Rückerstattung' : 'Full refund'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Payment Methods & DHL Shipping Bar (Conversion Booster) */}
              <div className="mt-3.5 p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/80 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-bold text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    {currentLang === 'ar' ? 'طرق الدفع المعتمدة والشحن السريع' :
                     currentLang === 'de' ? 'Geprüfte Zahlungsarten & Express-Versand' :
                     currentLang === 'fr' ? 'Modes de paiement vérifiés & Envoi Express' :
                     currentLang === 'nl' ? 'Geverifieerde betaalmethoden & Verzending' : 'Verified Payment Methods & Fast Delivery'}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    256-Bit SSL
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* PayPal */}
                  <div className="h-7 px-2.5 bg-white rounded border border-stone-200 flex items-center justify-center shadow-2xs" title="PayPal">
                    <img src="/paypal.svg" alt="PayPal" className="h-3.5 w-auto object-contain" />
                  </div>
                  {/* Klarna */}
                  <div className="h-7 px-2.5 bg-[#FFB3C7] rounded border border-[#FFA5BD] flex items-center justify-center shadow-2xs font-black text-stone-900 text-[10px] tracking-tight" title="Klarna (Rechnung / Raten)">
                    Klarna.
                  </div>
                  {/* Apple Pay */}
                  <div className="h-7 px-2 bg-white rounded border border-stone-200 flex items-center justify-center shadow-2xs" title="Apple Pay">
                    <img src="/applepay.svg" alt="Apple Pay" className="h-3.5 w-auto object-contain" />
                  </div>
                  {/* Google Pay */}
                  <div className="h-7 px-2 bg-white rounded border border-stone-200 flex items-center justify-center shadow-2xs" title="Google Pay">
                    <img src="/gpay.svg" alt="Google Pay" className="h-3.5 w-auto object-contain" />
                  </div>
                  {/* Visa */}
                  <div className="h-7 px-2 bg-white rounded border border-stone-200 flex items-center justify-center shadow-2xs" title="Visa">
                    <img src="/visa.svg" alt="Visa" className="h-3 w-auto object-contain" />
                  </div>
                  {/* Mastercard */}
                  <div className="h-7 px-2 bg-white rounded border border-stone-200 flex items-center justify-center shadow-2xs" title="Mastercard">
                    <span className="inline-flex items-center gap-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-90 inline-block -mr-1"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-90 inline-block"></span>
                    </span>
                    <span className="ml-1 text-[9px] font-black text-stone-700 tracking-tight">Mastercard</span>
                  </div>
                  {/* Sofort */}
                  <div className="h-7 px-2 bg-white rounded border border-stone-200 flex items-center justify-center shadow-2xs text-[9px] font-bold text-blue-700" title="Sofortüberweisung">
                    SOFORT
                  </div>
                  {/* DHL */}
                  <div className="h-7 px-2.5 bg-[#FFCC00] rounded border border-[#E6B800] flex items-center justify-center shadow-2xs font-black text-[#D40511] text-[11px] italic tracking-tighter" title="DHL Express Shipping">
                    DHL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TABS SECTION */}
        {/* ---------------------------------------------------- */}
        {(() => {
          const isPerfume = isPerfumeProduct(product);
          const hasPerfumeNotes = isPerfume && getPerfumeNotes(product, currentLang);
          const effectiveTab = (activeTab === 'scent-pyramid' && !hasPerfumeNotes) ? 'description' : activeTab;

          return (
            <div id="product-tabs-section" className="mt-24 border-t border-stone-200 pt-16 max-w-5xl mx-auto">
              {/* Tab Navigation */}
              <div className="flex border-b border-stone-200 gap-8 sm:gap-12 justify-center mb-12">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`pb-4 text-xs sm:text-sm font-bold tracking-widest uppercase border-b-2 transition flex items-center gap-2 ${effectiveTab === 'description' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                  <BookOpen className="w-4 h-4" /> {t.tabDescription}
                </button>
                {hasPerfumeNotes && (
                  <button 
                    onClick={() => setActiveTab('scent-pyramid')}
                    className={`pb-4 text-xs sm:text-sm font-bold tracking-widest uppercase border-b-2 transition flex items-center gap-2 ${effectiveTab === 'scent-pyramid' ? 'border-amber-500 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    <Flame className="w-4 h-4 text-amber-500 animate-pulse" /> {currentLang === 'de' ? 'Duftpyramide' : currentLang === 'ar' ? 'الهرم العطري' : 'Scent Pyramid'}
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-4 text-xs sm:text-sm font-bold tracking-widest uppercase border-b-2 transition flex items-center gap-2 ${effectiveTab === 'reviews' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                >
                  <Star className="w-4 h-4" /> {t.tabReviews} ({ratingTotal})
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-2xl p-8 sm:p-12 border border-stone-100 shadow-sm min-h-[350px]">
                
                {/* T1: Description */}
                {effectiveTab === 'description' && (
              <div className="animate-in fade-in duration-200 max-w-3xl mx-auto">
                <div className={`space-y-6 ${isRtl ? 'text-right font-serif' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                  <h3 className="font-serif font-bold text-2xl text-stone-900 mb-6 pb-2 border-b border-stone-100">
                    {currentLang === 'ar' ? "وصف المنتج والتفاصيل" :
                     currentLang === 'de' ? "Beschreibung & Details" :
                     currentLang === 'fr' ? "Description & Détails" :
                     currentLang === 'nl' ? "Beschrijving & Details" : "Description & Details"}
                  </h3>
                  
                  {/* Localized Short Description */}
                  {shortDescriptionHtml && (
                    <div 
                      className="bg-stone-50/60 p-6 rounded-lg border border-stone-200/40 text-stone-700 font-sans text-sm leading-relaxed mb-6 shadow-2xs space-y-1"
                      dangerouslySetInnerHTML={{ __html: shortDescriptionHtml }}
                    />
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
                        <div 
                          className={`whitespace-pre-line text-stone-600 leading-relaxed text-base ${isRtl ? 'text-lg leading-loose font-serif' : ''}`}
                          dangerouslySetInnerHTML={{ __html: fullDesc }}
                        />
                      );
                    } else {
                      return <p className="italic text-stone-400">{fallbackMsg}</p>;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* T2: Scent Pyramid */}
            {activeTab === 'scent-pyramid' && (() => {
              const notes = getPerfumeNotes(product, currentLang);
              const formatNotes = (raw: any) => {
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') return raw.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean);
                return [];
              };
              return (
                <div className="animate-in fade-in duration-200 max-w-3xl mx-auto">
                  <FragrancePyramid
                    topNotes={formatNotes(notes?.top)}
                    heartNotes={formatNotes(notes?.heart)}
                    baseNotes={formatNotes(notes?.base)}
                    lang={currentLang}
                  />
                </div>
              );
            })()}

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

                      {/* Dynamic Distribution bars (Interactive Star Filter) */}
                      <div className="space-y-1.5 text-xs">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const dist = reviewsData?.distribution?.find((d: any) => d.star === stars);
                          const count = dist ? dist.count : (stars === 5 ? Math.round(ratingTotal * 0.85) : stars === 4 ? Math.round(ratingTotal * 0.12) : 0);
                          const percentage = ratingTotal > 0 ? (count / ratingTotal) * 100 : 0;
                          const isSelected = selectedStarFilter === stars;
                          
                          return (
                            <button
                              key={stars}
                              type="button"
                              onClick={() => {
                                setSelectedStarFilter(isSelected ? null : stars);
                                setReviewPage(1);
                              }}
                              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all text-left cursor-pointer ${
                                isSelected 
                                  ? 'bg-amber-100/80 ring-1 ring-amber-400 font-bold' 
                                  : 'hover:bg-stone-100/80'
                              }`}
                              title={isSelected ? t.filterReset : `${stars} ${t.overallRating}`}
                            >
                              <div className="flex items-center gap-1 w-6 justify-end flex-shrink-0">
                                <span className={`text-xs ${isSelected ? 'text-amber-900 font-bold' : 'text-stone-600'}`}>{stars}</span>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </div>
                              <div className="flex-1 h-2 bg-stone-200/70 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-amber-500' : 'bg-amber-400'}`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className={`w-8 text-right text-xs ${isSelected ? 'text-amber-900 font-bold' : 'text-stone-400'}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Star Filter Notice */}
                      {selectedStarFilter !== null && (
                        <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs">
                          <span className="text-amber-900 font-medium">
                            {selectedStarFilter} ★ ({totalFilteredReviews})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStarFilter(null);
                              setReviewPage(1);
                            }}
                            className="text-stone-500 hover:text-stone-900 underline text-[11px] font-semibold cursor-pointer"
                          >
                            {t.filterReset}
                          </button>
                        </div>
                      )}

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
                  <div ref={reviewsContainerRef} className="lg:col-span-8 space-y-6">
                    
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

                    {/* Review Toolbar: Count & Filter tags & Sort dropdown */}
                    {hasReviews && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 text-xs text-stone-600">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-stone-700">
                            {t.showingReviews
                              ? t.showingReviews
                                  .replace('{from}', String(totalFilteredReviews > 0 ? (reviewPage - 1) * REVIEWS_PER_PAGE + 1 : 0))
                                  .replace('{to}', String(Math.min(reviewPage * REVIEWS_PER_PAGE, totalFilteredReviews)))
                                  .replace('{total}', String(totalFilteredReviews))
                              : `${totalFilteredReviews} Reviews`}
                          </span>

                          {selectedStarFilter !== null && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStarFilter(null);
                                setReviewPage(1);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-full font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                              title={t.filterReset}
                            >
                              <span>{selectedStarFilter} ★</span>
                              <span className="text-amber-700 text-xs font-bold">✕</span>
                            </button>
                          )}
                        </div>

                        {/* Sort dropdown */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
                          <label htmlFor="review-sort-select" className="text-stone-500 font-medium">
                            {t.sortBy}:
                          </label>
                          <select
                            id="review-sort-select"
                            value={reviewSort}
                            onChange={(e) => {
                              setReviewSort(e.target.value as any);
                              setReviewPage(1);
                            }}
                            className="bg-white border border-stone-200 text-stone-850 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer shadow-2xs"
                          >
                            <option value="newest">{t.newest}</option>
                            <option value="highest">{t.highestRating}</option>
                            <option value="lowest">{t.lowestRating}</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Review list */}
                    <div className="space-y-6 text-left">
                      {!hasReviews ? (
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
                      ) : paginatedReviews.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-stone-100 rounded-2xl flex flex-col items-center justify-center text-center px-4">
                          <Filter className="w-10 h-10 text-stone-300 mb-2" />
                          <p className="text-sm font-medium text-stone-700 mb-3">
                            {t.noReviewsFiltered}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStarFilter(null);
                              setReviewPage(1);
                            }}
                            className="px-4 py-2 text-xs font-bold bg-stone-900 text-white rounded-lg hover:bg-black transition-colors cursor-pointer"
                          >
                            {t.filterReset}
                          </button>
                        </div>
                      ) : (
                        paginatedReviews.map((rev: any) => {
                          const initials = getInitials(rev.author_name);
                          const avColor = getAvatarColor(rev.author_name);
                          const dateString = new Date(rev.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : currentLang === 'de' ? 'de-DE' : 'en-US', {
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
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {hasReviews && totalReviewPages > 1 && (
                      <div className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-xs text-stone-500">
                          {t.showingReviews
                            ? t.showingReviews
                                .replace('{from}', String((reviewPage - 1) * REVIEWS_PER_PAGE + 1))
                                .replace('{to}', String(Math.min(reviewPage * REVIEWS_PER_PAGE, totalFilteredReviews)))
                                .replace('{total}', String(totalFilteredReviews))
                            : `${reviewPage} / ${totalReviewPages}`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Previous page button */}
                          <button
                            type="button"
                            onClick={() => handleReviewPageChange(reviewPage - 1)}
                            disabled={reviewPage === 1}
                            title={t.prevPage}
                            aria-label={t.prevPage}
                            className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Page numbers */}
                          {getPageNumbers().map((p, idx) => {
                            if (p === '...') {
                              return (
                                <span key={`ellipsis-${idx}`} className="px-2 text-stone-400 text-xs select-none">
                                  …
                                </span>
                              );
                            }
                            const isCurrent = p === reviewPage;
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handleReviewPageChange(p as number)}
                                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-stone-900 text-white shadow-2xs'
                                    : 'text-stone-700 hover:bg-stone-100 border border-stone-200 bg-white'
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}

                          {/* Next page button */}
                          <button
                            type="button"
                            onClick={() => handleReviewPageChange(reviewPage + 1)}
                            disabled={reviewPage === totalReviewPages}
                            title={t.nextPage}
                            aria-label={t.nextPage}
                            className="p-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
        );
      })()}

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-32 border-t border-stone-200 pt-16">
            <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2 text-center">
              {currentLang === 'ar' ? 'منتجات مشابهة' :
               currentLang === 'de' ? 'Ähnliche Produkte' :
               currentLang === 'fr' ? 'Produits similaires' :
               currentLang === 'nl' ? 'Vergelijkbare producten' : 'Similar Products'}
            </h2>
            <p className="text-xs text-stone-500 tracking-widest uppercase text-center mb-12">
              {currentLang === 'ar' ? 'اخترنا لك باقة من المنتجات التي قد تعجبك' :
               currentLang === 'de' ? 'Ausgewählte Kreationen, die Ihnen gefallen könnten' :
               'Handpicked creations you might also appreciate'}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {similarProducts.map((p: any, idx: number) => {
                const isB2B = (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SELLER') && p.attributes?.sales_mode !== 'RETAIL_ONLY';
                const pB2bPrice = parseFloat(p.b2b_price || 0);
                const pB2cPrice = parseFloat(p.sales_price_with_tax || p.price || 0);
                const activePrice = isB2B ? pB2bPrice : pB2cPrice;
                const comparePrice = parseFloat(p.retail_price || 0);
                
                const hasDiscount = isB2B 
                  ? (comparePrice > pB2bPrice) 
                  : (comparePrice > pB2cPrice);
                  
                const displayPrice = activePrice.toFixed(2);
                const originalPrice = hasDiscount && comparePrice > 0 ? comparePrice.toFixed(2) : null;
                const fallbackImg = FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
                const mainImgResolved = resolveImageUrl(p.image_url) || fallbackImg;

                return (
                  <div
                    key={p.id}
                    className="group flex flex-col h-full bg-white rounded-md border border-stone-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-stone-50">
                      <Link href={`/shop/${p.sku || p.id}`} className="block w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mainImgResolved}
                          alt={p.translations?.[currentLang] || p.translations?.en || "Fragrance"}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      </Link>

                      {/* Category Badge */}
                      {(p.category?.name?.[currentLang] || p.category?.name?.en) && (
                        <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'}`}>
                          <span className="bg-white/90 backdrop-blur text-stone-700 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-xs border border-stone-200/50">
                            {p.category.name[currentLang] || p.category.name.en}
                          </span>
                        </div>
                      )}

                      {/* B2B Badge */}
                      {isB2B && (
                        <div className={`absolute bottom-3 ${isRtl ? 'left-3' : 'right-3'}`}>
                          <span className="bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-xs shadow-sm">
                            {currentLang === 'ar' ? 'سعر الجملة' : 'B2B'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col flex-grow p-5 text-center">
                      <Link href={`/shop/${p.sku || p.id}`}>
                        <h3 className="font-serif text-stone-900 text-base mb-1.5 hover:text-stone-500 transition-colors leading-snug font-semibold line-clamp-1">
                          {p.translations?.[currentLang] || p.translations?.en || "Luxury Fragrance"}
                        </h3>
                      </Link>
                      
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
                        {p.attributes?.brand && (
                          <span className="text-[8px] font-bold tracking-wider text-amber-800 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {p.attributes.brand}
                          </span>
                        )}
                        {p.attributes?.type && (
                          <span className="text-[9px] text-stone-400 uppercase tracking-wider font-semibold">
                            {p.attributes.type}
                          </span>
                        )}
                        {isB2B && p.b2bMinQty && p.b2bMinQty > 1 && (
                          <span className="text-[8px] font-bold tracking-wider text-amber-800 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-250 animate-pulse">
                            {currentLang === 'ar' ? `حد أدنى ${p.b2bMinQty}` : `Min: ${p.b2bMinQty}`}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-auto flex items-center justify-center gap-2.5 pt-2 border-t border-stone-50">
                        {originalPrice && (
                          <span className="text-xs text-stone-400 line-through notranslate" translate="no">{formatPrice(comparePrice)}</span>
                        )}
                        <span className={`font-bold text-base ${isB2B ? 'text-emerald-700' : 'text-stone-900'} notranslate`} translate="no">
                          {formatPrice(activePrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add to Cart Modal Popup */}
        {showAddedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-100 p-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
              {/* Soft Green Check Badge */}
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-bold text-stone-900 mb-2 text-center font-serif">
                {popupTranslations[currentLang]?.addedTitle || popupTranslations.de.addedTitle}
              </h3>
              
              {/* Product details card inside popup */}
              <div className="w-full flex items-center gap-3 bg-stone-50 p-3 rounded-lg border border-stone-100 mb-5">
                <img
                  src={product.image_url ? resolveImageUrl(product.image_url) : 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=150'}
                  alt={product.translations?.[currentLang] || product.translations?.en || "Fragrance"}
                  className="w-14 h-14 object-cover rounded-md border border-stone-200"
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {product.translations?.[currentLang] || product.translations?.en || "Luxury Fragrance"}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    {popupTranslations[currentLang]?.quantity || popupTranslations.de.quantity}: {quantity}
                  </p>
                </div>
              </div>
              
              {/* Call to Actions */}
              <div className="w-full space-y-2">
                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-1.5 w-full bg-[#d40026] hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg text-center text-sm shadow-sm transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {popupTranslations[currentLang]?.goCheckout || popupTranslations.de.goCheckout}
                </Link>
                
                <button
                  onClick={() => setShowAddedModal(false)}
                  className="w-full border border-stone-200 hover:bg-stone-50 text-stone-600 font-bold py-2.5 px-4 rounded-lg text-center text-sm transition-all"
                >
                  {popupTranslations[currentLang]?.continueShopping || popupTranslations.de.continueShopping}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── STICKY MOBILE BUY BAR ────────────────────────────────── */}
      {isMounted && !isWholesaleOnly && (product.stock_quantity ?? 0) > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-2xl px-4 py-3 flex items-center gap-3 [.cart-drawer-open_&]:hidden">
          {/* Product image thumb */}
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-stone-200 flex-shrink-0 bg-stone-50">
            <img
              src={resolveImageUrl(activeImage) || resolveImageUrl(product.image_url) || fallbackImage}
              alt=""
              className="w-full h-full object-contain p-1"
              onError={(e) => { (e.target as HTMLImageElement).src = fallbackImage; }}
            />
          </div>

          {/* Price */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-stone-400 font-medium truncate leading-none mb-0.5">
              {product.translations?.[currentLang] || product.translations?.en || ''}
            </p>
            <p className="text-base font-black text-stone-900 notranslate leading-none" translate="no">
              {formatPrice(activePriceVal)}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={addToCart}
              disabled={(product.stock_quantity ?? 0) <= 0}
              className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-xs transition-all shadow-sm ${
                addedToCart
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 text-white hover:bg-black'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {addedToCart
                ? (currentLang === 'ar' ? '✓ تمت' : currentLang === 'de' ? '✓ Hinzugefügt' : '✓ Added')
                : (currentLang === 'ar' ? 'أضف' : currentLang === 'de' ? 'Kaufen' : 'Add')}
            </button>
            {!isB2B && (
              <button
                onClick={handleExpressCheckout}
                disabled={expressLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                {expressLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Zap className="w-4 h-4 fill-white" /> {currentLang === 'ar' ? 'الآن' : currentLang === 'de' ? 'Sofort' : 'Now'}</>
                }
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Wishlist Heart Button sub-component
function WishlistHeartButton({ product, currentLang }: { product: any; currentLang: string }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const [pulse, setPulse] = useState(false);

  const handleToggle = () => {
    toggleWishlist({
      id: product.id,
      name: product.translations?.[currentLang] || product.translations?.en || product.name || 'Product',
      price: parseFloat(product.retail_price || product.sales_price_with_tax || '0'),
      image_url: product.image_url,
      slug: product.sku || product.id,
    });
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`flex-shrink-0 mt-2 p-3 rounded-full border-2 transition-all duration-300 ${
        inWishlist
          ? 'bg-red-50 border-red-300 text-red-500 hover:bg-red-100'
          : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-red-300 hover:text-red-400'
      } ${pulse ? 'scale-125' : 'scale-100'}`}
    >
      <Heart className={`w-6 h-6 transition-all ${inWishlist ? 'fill-red-500' : ''}`} />
    </button>
  );
}
