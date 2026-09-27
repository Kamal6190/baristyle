"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, ShieldCheck, Lock, Zap, Truck, Check, ChevronDown, ChevronUp, Gift, Clock, Sparkles, ShoppingBag } from "lucide-react";
import axios from "axios";
import { translations, Locale } from "../../utils/i18n";
import { formatPrice, getActiveCurrency } from "../../utils/currency";
import { resolveImageUrl } from "../../utils/api";
import { trackInitiateCheckout } from "../../utils/pixel";

export default function Checkout() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stockData, setStockData] = useState<Record<string, number>>({});
  const [stockWarnings, setStockWarnings] = useState<Record<string, string>>({});
  const [b2bConfig, setB2bConfig] = useState<any>({ minimum_order_amount: 2500 });
  const [vatConfig, setVatConfig] = useState<any>({ rate: 19, type: 'inclusive' });
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<any | null>(null);
  const [buy2get1Config, setBuy2get1Config] = useState<any>({ active: true, category_id: '' });
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});

  // Checkout Conversion Booster States
  const [giftWrapOption, setGiftWrapOption] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [mobileOrderSummaryOpen, setMobileOrderSummaryOpen] = useState(false);
  const [cutoffCountdown, setCutoffCountdown] = useState<{ hours: number; minutes: number }>({ hours: 4, minutes: 15 });

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [couponEmail, setCouponEmail] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [preferredStripeMethod, setPreferredStripeMethod] = useState<string>('klarna');

  // Customer & Shipping Address State
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    phone: '',
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');


  // EU VAT State
  const [customerCountry, setCustomerCountry] = useState('DE');
  const [vatNumber, setVatNumber] = useState('');
  const [isCompanyOrder, setIsCompanyOrder] = useState(false);
  const [vatValidating, setVatValidating] = useState(false);
  const [vatValidationResult, setVatValidationResult] = useState<{
    valid: boolean | null;
    companyName?: string;
    message?: string;
    message_de?: string;
    message_fr?: string;
    message_nl?: string;
    message_ar?: string;
  } | null>(null);
  const [euVatRates, setEuVatRates] = useState<Record<string, number>>({
    AT: 20, BE: 21, BG: 20, CY: 19, CZ: 21, DE: 19, DK: 25, EE: 22,
    EL: 24, ES: 21, FI: 25.5, FR: 20, HR: 25, HU: 27, IE: 23, IT: 22,
    LT: 21, LU: 17, LV: 21, MT: 18, NL: 21, PL: 23, PT: 23, RO: 19,
    SE: 25, SI: 22, SK: 20,
  });

  // Language State
  const [currentLang, setCurrentLang] = useState<Locale>('de');

  // Currency Tick state to force re-render
  const [currencyTick, setCurrencyTick] = useState(0);
  useEffect(() => {
    const handleCurrencyChange = () => setCurrencyTick(c => c + 1);
    window.addEventListener('currency-changed', handleCurrencyChange);
    return () => window.removeEventListener('currency-changed', handleCurrencyChange);
  }, []);

  // Live countdown to DHL daily dispatch cutoff (16:00 CET)
  useEffect(() => {
    const updateCutoff = () => {
      const now = new Date();
      const cutoff = new Date();
      if (now.getHours() >= 16) {
        cutoff.setDate(cutoff.getDate() + 1);
      }
      cutoff.setHours(16, 0, 0, 0);
      const diff = cutoff.getTime() - now.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCutoffCountdown({ hours: h, minutes: m });
      }
    };
    updateCutoff();
    const timer = setInterval(updateCutoff, 60000);
    return () => clearInterval(timer);
  }, []);

  const getEstimatedDeliveryDate = () => {
    const date = new Date();
    let daysToAdd = date.getHours() >= 16 ? 3 : 2;
    date.setDate(date.getDate() + daysToAdd);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    const localeStr = currentLang === 'ar' ? 'ar-EG' : 'de-DE';
    const opts: any = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString(localeStr, opts);
  };

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  const fetchStockForCart = async (cartItems: any[]) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const newStockData: Record<string, number> = {};
    const newProductDetails: Record<string, any> = {};
    for (const item of cartItems) {
      if (item.id) {
        try {
          const response = await axios.get(`${apiUrl}/products/${item.id}`);
          newStockData[item.id] = response.data.stock_quantity ?? 0;
          newProductDetails[item.id] = response.data;
        } catch (error) {
          console.error(`Failed to fetch stock for product ${item.id}:`, error);
        }
      }
    }
    setStockData(newStockData);
    setProductDetails(newProductDetails);
  };

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    syncLang();
    window.addEventListener('language-changed', syncLang);

    if (savedCart.length > 0) {
      const subtotal = savedCart.reduce((acc: number, item: any) => acc + (parseFloat(item.price || 0) * item.quantity), 0);
      trackInitiateCheckout(savedCart, subtotal, getActiveCurrency());
    }
    
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
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const profileResponse = await axios.get(`${apiUrl}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(profileResponse.data);
          localStorage.setItem('user', JSON.stringify(profileResponse.data));
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }

      try {
        const response = await axios.get(`${apiUrl}/settings`);
        if (response.data.b2b_config) setB2bConfig(response.data.b2b_config);
        if (response.data.vat_config) setVatConfig(response.data.vat_config);
        if (response.data.buy2get1_config) setBuy2get1Config(response.data.buy2get1_config);
        if (response.data.shipping_methods) {
          setShippingMethods(response.data.shipping_methods);
          if (response.data.shipping_methods.length > 0) {
            setSelectedShippingMethod(response.data.shipping_methods[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings config:", error);
      }
    };
    fetchConfig();
    fetchStockForCart(savedCart);

    // Load EU VAT rates from backend
    const apiUrl2 = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    axios.get(`${apiUrl2}/vat/rates`).then(r => {
      if (r.data && typeof r.data === 'object') setEuVatRates(r.data);
    }).catch(() => {});

    // Check for error parameters in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "paypal_country_mismatch") {
          console.warn("PayPal country mismatch notice handled automatically by backend.");
        } else if (err === "paypal_failed" || err === "paypal_capture_failed") {
          alert(currentLang === 'ar' ? "فشلت عملية الدفع عبر PayPal. يرجى المحاولة مرة أخرى." : "PayPal payment failed. Please try again.");
        } else if (err === "order_not_found") {
          alert(currentLang === 'ar' ? "لم يتم العثور على الطلب في نظامنا." : "Order not found in our system.");
        }
        // Clean URL query params without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    setMounted(true);

    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  const handleAddressChange = (field: string, val: string) => {
    setShippingAddress(prev => {
      const updated = { ...prev, [field]: val };
      try {
        localStorage.setItem('baristore_guest_address', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (addressErrors[field]) {
      setAddressErrors(prev => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  // Pre-fill shipping address when user is loaded or retrieve saved guest address
  useEffect(() => {
    if (user) {
      const nameParts = (user.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setShippingAddress(prev => ({
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || user.email || '',
        street: prev.street || user.street || user.address || '',
        houseNumber: prev.houseNumber || '',
        postalCode: prev.postalCode || user.postalCode || user.zip || '',
        city: prev.city || user.city || '',
        phone: prev.phone || user.phone || '',
      }));
    } else {
      try {
        const saved = localStorage.getItem('baristore_guest_address');
        if (saved) {
          const parsed = JSON.parse(saved);
          setShippingAddress(prev => ({ ...prev, ...parsed }));
        }
      } catch {}
    }
  }, [user]);

  // Enforce b2bMinQty on all cart items ONLY for confirmed wholesale buyers (NOT Super Admin)
  useEffect(() => {
    if (!user) return;
    const isDedicatedB2B = user.role === 'SELLER' || user.role === 'WHOLESALE';
    if (!isDedicatedB2B) return;

    setCart(prev => {
      let changed = false;
      const corrected = prev.map(item => {
        const min = item.b2bMinQty ? Number(item.b2bMinQty) : 1;
        if (item.quantity < min) {
          changed = true;
          return { ...item, quantity: min };
        }
        return item;
      });
      if (changed) {
        localStorage.setItem('cart', JSON.stringify(corrected));
        window.dispatchEvent(new Event('cart-updated'));
      }
      return changed ? corrected : prev;
    });
  }, [user]);

  // Auto-fill and validate VAT number for logged-in users with a stored VAT ID
  useEffect(() => {
    if (user) {
      const isDedicatedB2B = user.role === 'SELLER' || user.role === 'WHOLESALE';
      if (isDedicatedB2B) {
        setIsCompanyOrder(true);
      }
    }
    if (user?.vatNumber && !vatNumber) {
      const userVat = user.vatNumber.trim();
      setVatNumber(userVat);
      setIsCompanyOrder(true);
      
      const prefix = userVat.slice(0, 2).toUpperCase();
      if (euVatRates[prefix]) {
        setCustomerCountry(prefix);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      setVatValidating(true);
      axios.post(`${apiUrl}/vat/validate`, { vatNumber: userVat })
        .then(res => {
          setVatValidationResult(res.data);
        })
        .catch(() => {
          setVatValidationResult({ valid: null, message: 'Validation service unavailable' });
        })
        .finally(() => {
          setVatValidating(false);
        });
    }
  }, [user]);

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
      const stock = stockData[id];
      const isVE = !item.b2bQtyMode || item.b2bQtyMode === 'VE';
      const step = isB2B && item.b2bMinQty && isVE ? Number(item.b2bMinQty) : 1;
      const minQty = isB2B && item.b2bMinQty ? Number(item.b2bMinQty) : 1;
      const newQty = Math.max(minQty, item.quantity + (delta * step));
      if (stock !== undefined && newQty > stock) {
        setStockWarnings(prev => ({ ...prev, [id]: currentLang === 'ar' ? `الحد الأقصى المتوفر: ${stock}` : `Max available: ${stock}` }));
        item.quantity = stock > 0 ? Math.max(minQty, Math.floor(stock / step) * step) : minQty;
      } else {
        setStockWarnings(prev => { const n = { ...prev }; delete n[id]; return n; });
        item.quantity = newQty;
      }
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const handleQuantityInput = (id: string, value: string) => {
    const newCart = [...cart];
    const item = newCart.find(i => i.id === id);
    if (item) {
      const val = parseInt(value, 10);
      const stock = stockData[id];
      const minQty = isB2B && item.b2bMinQty ? Number(item.b2bMinQty) : 1;
      const isVE = !item.b2bQtyMode || item.b2bQtyMode === 'VE';
      
      let roundedVal = val;
      if (isB2B && minQty > 1 && isVE && !isNaN(val)) {
        const remainder = val % minQty;
        if (remainder !== 0) {
          roundedVal = val + (minQty - remainder);
        }
      }

      if (isNaN(roundedVal) || roundedVal < minQty) {
        item.quantity = minQty;
        setStockWarnings(prev => { const n = { ...prev }; delete n[id]; return n; });
      } else if (stock !== undefined && roundedVal > stock) {
        const step = isB2B && item.b2bMinQty && isVE ? Number(item.b2bMinQty) : 1;
        item.quantity = stock > 0 ? Math.max(minQty, Math.floor(stock / step) * step) : minQty;
        setStockWarnings(prev => ({ ...prev, [id]: currentLang === 'ar' ? `الحد الأقصى المتوفر: ${stock}` : `Max available: ${stock}` }));
      } else {
        item.quantity = roundedVal;
        setStockWarnings(prev => { const n = { ...prev }; delete n[id]; return n; });
      }
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cart-updated'));
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;

    const emailToUse = user?.email || couponEmail;
    if (!user && !couponEmail) {
      setCouponError(currentLang === 'ar' ? "يرجى إدخال البريد الإلكتروني أولاً للتحقق من كوبون الخصم." : "Please enter your email address to validate the coupon code.");
      return;
    }

    setValidatingCoupon(true);
    setCouponError("");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
      const response = await axios.post(`${apiUrl}/coupons/validate`, {
        code: couponCode,
        subtotal: subtotal,
        email: emailToUse
      });

      if (response.data.valid) {
        setAppliedCoupon(response.data.coupon);
        setCouponError("");
      } else {
        const errorMsg = currentLang === 'ar' ? response.data.message_ar : response.data.message_en;
        setCouponError(errorMsg || "Invalid coupon code.");
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error("Failed to validate coupon", error);
      setCouponError(currentLang === 'ar' ? "فشل التحقق من الكوبون. حاول مجدداً." : "Failed to validate coupon. Try again.");
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponEmail('');
    setCouponError('');
  };

  const validateVatNumber = async () => {
    if (!vatNumber.trim()) return;
    setVatValidating(true);
    setVatValidationResult(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
      const res = await axios.post(`${apiUrl}/vat/validate`, { vatNumber: vatNumber.trim() });
      setVatValidationResult(res.data);
    } catch {
      setVatValidationResult({ valid: null, message: 'Validation service unavailable' });
    } finally {
      setVatValidating(false);
    }
  };

  const handleCheckout = async () => {
    // 1. Validate Terms & Conditions agreement (§ 312j BGB)
    if (!agreedToTerms) {
      setTermsError(
        currentLang === 'ar' ? 'يرجى الموافقة على الشروط والأحكام العامة وسياسة الإلغاء للمتابعة.' :
        currentLang === 'de' ? 'Bitte stimmen Sie den AGB und der Widerrufsbelehrung zu, um fortzufahren.' :
        currentLang === 'fr' ? 'Veuillez accepter les CGV et le droit de rétractation pour continuer.' :
        currentLang === 'nl' ? 'Ga akkoord met de algemene voorwaarden om door te gaan.' :
        'Please agree to the Terms & Conditions and Cancellation Policy to proceed.'
      );
      const termsEl = document.getElementById('terms-agreement-box');
      if (termsEl) termsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setTermsError('');

    // 2. Validate Address if cart has physical items
    if (!isAllDigitalCart) {
      const errors: Record<string, string> = {};
      if (!shippingAddress.firstName.trim()) errors.firstName = currentLang === 'ar' ? 'الاسم الأول مطلوب' : 'Vorname erforderlich';
      if (!shippingAddress.lastName.trim()) errors.lastName = currentLang === 'ar' ? 'اسم العائلة مطلوب' : 'Nachname erforderlich';
      if (!shippingAddress.email.trim() || !shippingAddress.email.includes('@')) errors.email = currentLang === 'ar' ? 'بريد إلكتروني صالح مطلوب' : 'Gültige E-Mail erforderlich';
      if (!shippingAddress.street.trim()) errors.street = currentLang === 'ar' ? 'الشارع مطلوب' : 'Straße erforderlich';
      if (!shippingAddress.postalCode.trim()) errors.postalCode = currentLang === 'ar' ? 'الرمز البريدي مطلوب' : 'PLZ erforderlich';
      if (!shippingAddress.city.trim()) errors.city = currentLang === 'ar' ? 'المدينة مطلوبة' : 'Stadt erforderlich';

      if (Object.keys(errors).length > 0) {
        setAddressErrors(errors);
        const addrEl = document.getElementById('shipping-address-form');
        if (addrEl) addrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    setAddressErrors({});

    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
      const fullStreet = shippingAddress.houseNumber
        ? `${shippingAddress.street} ${shippingAddress.houseNumber}`.trim()
        : shippingAddress.street.trim();

      const formattedAddress = [
        fullStreet,
        shippingAddress.postalCode,
        shippingAddress.city,
        customerCountry
      ].filter(Boolean).join(', ');

      const fullName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
      const customerEmailToUse = shippingAddress.email.trim() || user?.email || couponEmail || undefined;

      const endpoint = paymentMethod === 'paypal' ? '/checkout/create-paypal-order' : '/checkout/create-session';
      
      const itemsToSend = [...cart];
      if (giftWrapOption) {
        itemsToSend.push({
          id: 'gift-wrap',
          name: currentLang === 'ar' ? 'تغليف هدايا ملكي وبطاقة تهنئة' : 'Luxus-Geschenkverpackung & Grußkarte',
          price: '4.99',
          quantity: 1,
          image_url: '/gift.png'
        });
      }

      const response = await axios.post(`${apiUrl}${endpoint}`, {
        items: itemsToSend,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        order_type: isB2B ? 'Wholesale' : 'Retail',
        shipping_fee: shipping,
        shipping_name: selectedShippingMethod ? selectedShippingMethod.name : 'Standard Shipping',
        email: customerEmailToUse,
        locale: currentLang,
        customer_country: customerCountry,
        vat_number: vatNumber,
        is_reverse_charge: customerCountry !== 'DE' && ((isB2B && (!!vatNumber || !!user?.vatNumber)) || vatValidationResult?.valid === true),
        preferred_payment_method: preferredStripeMethod,
        customer_name: fullName || undefined,
        customer_email: customerEmailToUse,
        customer_phone: shippingAddress.phone.trim() || undefined,
        shipping_address: formattedAddress || undefined,
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      console.error("Failed to initiate checkout", error);
      const serverMsg = error.response?.data?.message;
      const details = error.response?.data?.error;
      if (serverMsg) {
        alert(details ? `${serverMsg} (${details})` : serverMsg);
      } else {
        alert(currentLang === 'ar' ? "فشل بدء عملية الدفع والشراء. يرجى المحاولة مرة أخرى." : "Failed to initiate checkout. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Express 1-Click Checkout: Bypasses form barriers, launches PayPal / Stripe Express immediately
  const handleExpressOneClick = async (provider: 'paypal' | 'klarna' | 'card') => {
    setAgreedToTerms(true);
    setTermsError('');

    if (provider === 'paypal') {
      setPaymentMethod('paypal');
    } else {
      setPaymentMethod('stripe');
      setPreferredStripeMethod(provider);
    }

    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    try {
      const fullStreet = shippingAddress.houseNumber
        ? `${shippingAddress.street} ${shippingAddress.houseNumber}`.trim()
        : shippingAddress.street.trim();

      const formattedAddress = [
        fullStreet,
        shippingAddress.postalCode,
        shippingAddress.city,
        customerCountry
      ].filter(Boolean).join(', ');

      const fullName = `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
      const customerEmailToUse = shippingAddress.email.trim() || user?.email || couponEmail || undefined;

      const endpoint = provider === 'paypal' ? '/checkout/create-paypal-order' : '/checkout/create-session';
      
      const itemsToSend = [...cart];
      if (giftWrapOption) {
        itemsToSend.push({
          id: 'gift-wrap',
          name: currentLang === 'ar' ? 'تغليف هدايا ملكي وبطاقة تهنئة' : 'Luxus-Geschenkverpackung & Grußkarte',
          price: '4.99',
          quantity: 1,
          image_url: '/gift.png'
        });
      }

      const response = await axios.post(`${apiUrl}${endpoint}`, {
        items: itemsToSend,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        order_type: isB2B ? 'Wholesale' : 'Retail',
        shipping_fee: shipping,
        shipping_name: selectedShippingMethod ? selectedShippingMethod.name : 'Standard Shipping',
        email: customerEmailToUse,
        locale: currentLang,
        customer_country: customerCountry,
        vat_number: vatNumber,
        is_reverse_charge: customerCountry !== 'DE' && ((isB2B && (!!vatNumber || !!user?.vatNumber)) || vatValidationResult?.valid === true),
        preferred_payment_method: provider,
        customer_name: fullName || undefined,
        customer_email: customerEmailToUse,
        customer_phone: shippingAddress.phone.trim() || undefined,
        shipping_address: formattedAddress || undefined,
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      console.error("Express checkout failed", error);
      const serverMsg = error.response?.data?.message;
      alert(serverMsg || (currentLang === 'ar' ? "فشل بدء الدفع السريع. يرجى المحاولة عبر الزر العادي." : "Express checkout failed. Please use standard checkout."));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="bg-[#FAF9F6] min-h-screen"></div>;

  const t = translations[currentLang] || translations.de;
  const isRtl = currentLang === 'ar';

  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isWholesaleCustomer = user?.role === 'SELLER' || user?.role === 'WHOLESALE';
  const isB2B = isWholesaleCustomer;

  // Helper to check product eligibility for 2+1 promotion
  const isProductEligibleForPromo = (product: any, eligibleCatIds: string[]) => {
    if (!buy2get1Config.category_ids && !buy2get1Config.category_id) return true;
    if (eligibleCatIds.includes('all') || eligibleCatIds.includes('')) return true;
    if (eligibleCatIds.length === 0) return false;
    if (!product) return false;
    if (eligibleCatIds.includes(product.category_id) || eligibleCatIds.includes(product.category?.id)) return true;
    if (product.category?.parent_id && eligibleCatIds.includes(product.category.parent_id)) return true;
    if (product.productCategories && Array.isArray(product.productCategories)) {
      for (const pc of product.productCategories) {
        if (eligibleCatIds.includes(pc.category_id) || eligibleCatIds.includes(pc.category?.id)) return true;
        if (pc.category?.parent_id && eligibleCatIds.includes(pc.category.parent_id)) return true;
      }
    }
    return false;
  };

  // ── Buy 2 Get 1 Free Logic (Retail only, not B2B) ────────────────────────
  // Expand cart into individual units sorted cheapest-first (only if eligible)
  const isPromoActive = buy2get1Config.active !== false && !isB2B;
  const eligibleCatIds = buy2get1Config.category_ids 
    ? buy2get1Config.category_ids 
    : (buy2get1Config.category_id ? [buy2get1Config.category_id] : []);
  const expandedUnits: { price: number; itemId: string }[] = [];

  for (const item of cart) {
    const product = productDetails[item.id];
    const isEligible = isPromoActive && isProductEligibleForPromo(product, eligibleCatIds);
    if (isEligible) {
      for (let i = 0; i < item.quantity; i++) {
        expandedUnits.push({ price: parseFloat(item.price), itemId: item.id });
      }
    }
  }

  const sortedUnits = [...expandedUnits].sort((a, b) => a.price - b.price);
  const totalUnits = sortedUnits.length;
  // Every 3rd unit is free
  const freeUnitsCount = Math.floor(totalUnits / 3);
  let buy2get1Discount = 0;
  for (let i = 0; i < freeUnitsCount; i++) {
    buy2get1Discount += sortedUnits[i].price;
  }

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = subtotal * (appliedCoupon.discount_value / 100);
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }
  // Add buy2get1 on top of coupon discount
  discountAmount += buy2get1Discount;
  discountAmount = Math.min(discountAmount, subtotal);

  const discountedSubtotal = subtotal - discountAmount;

  const isAllDigitalCart = cart.length > 0 && cart.every((item: any) => 
    item.isDigital || 
    item.attributes?.isDigital || 
    /key|digital|license|windows|office|esd|software|download/i.test(item.name || '')
  );

  // Dynamic shipping cost calculation connected to Admin Logistics settings & product/category overrides
  const calculateCheckoutShipping = () => {
    if (!cart || cart.length === 0 || isAllDigitalCart) return 0;

    // 1. All digital items = 0 shipping
    const allDigital = cart.every((item: any) => item.isDigital || item.attributes?.isDigital || /key|digital|license|windows|esd|software/i.test(item.name || ''));
    if (allDigital) return 0;

    // 2. Custom product or category shipping cost overrides
    let maxCustomCost = 0;
    let hasCustomCost = false;
    cart.forEach((item: any) => {
      const prodShipping = parseFloat(item.shipping_cost || item.attributes?.shipping_cost || item.attributes?.shipping_rate || "0");
      const catShipping = parseFloat(item.category_shipping_cost || item.category?.attributes?.shipping_cost || "0");
      const itemCost = Math.max(prodShipping, catShipping);
      if (itemCost > 0) {
        hasCustomCost = true;
        if (itemCost > maxCustomCost) maxCustomCost = itemCost;
      }
    });

    if (hasCustomCost) return maxCustomCost;

    // 3. Admin configured shipping method
    const targetedMethod = shippingMethods.find((m: any) => {
      if (m.applies_to === 'categories' && m.target_category) {
        return cart.some((i: any) => (i.category === m.target_category || i.category_name === m.target_category || i.attributes?.category === m.target_category));
      }
      if (m.applies_to === 'products' && m.target_product) {
        return cart.some((i: any) => (i.id === m.target_product || i.product_id === m.target_product));
      }
      return false;
    });

    const activeMethod = targetedMethod || selectedShippingMethod || (shippingMethods.length > 0 ? shippingMethods[0] : null);

    if (activeMethod) {
      const cost = isB2B
        ? parseFloat(activeMethod.b2b_cost || activeMethod.cost || "0")
        : parseFloat(activeMethod.b2c_cost || activeMethod.cost || "0");
      return isNaN(cost) ? 0 : cost;
    }

    return 0;
  };

  const shipping = calculateCheckoutShipping();

  const minB2BAmount = (user?.b2bMinOrderAmount !== undefined && user?.b2bMinOrderAmount !== null)
    ? Number(user.b2bMinOrderAmount)
    : ((b2bConfig?.minimum_order_amount !== undefined && b2bConfig?.minimum_order_amount !== null)
      ? Number(b2bConfig.minimum_order_amount)
      : 2500);
  const isUnderB2BMinimum = isB2B && !isSuperAdmin && subtotal < minB2BAmount;

  // ── EU VAT logic ──────────────────────────────────────────────
  // B2C: apply destination country VAT if country is in EU
  // B2B or B2C: If customer provides a valid EU VAT number → Reverse Charge (0%) except in Germany (DE)
  // For approved B2B wholesale users: if they have a VAT ID and are not in Germany, apply Reverse Charge automatically
  const isReverseCharge = customerCountry !== 'DE' && (
    (isB2B && (!!vatNumber || !!user?.vatNumber)) ||
    (vatValidationResult?.valid === true)
  );
  const isNonEU = !euVatRates[customerCountry];

  const vatRate = isReverseCharge || isNonEU
    ? 0
    : (isB2B
      ? ((vatConfig?.rate !== undefined && vatConfig?.rate !== null) ? Number(vatConfig.rate) : 19)
      : (euVatRates[customerCountry] ?? Number(vatConfig?.rate ?? 19))
    );

  const defaultRate = Number(vatConfig?.rate ?? 19);
  const isExclusive = vatConfig?.type === 'exclusive' || isB2B;

  const netDiscountedSubtotal = isExclusive
    ? discountedSubtotal
    : discountedSubtotal / (1 + defaultRate / 100);

  const giftWrapCost = giftWrapOption ? 4.99 : 0;
  const total = netDiscountedSubtotal + shipping + vatAmount + giftWrapCost;

  // Free shipping progress calculation (Free above 50 €)
  const freeShippingThreshold = 50;
  const isFreeShipping = discountedSubtotal >= freeShippingThreshold;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - discountedSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((discountedSubtotal / freeShippingThreshold) * 100));

  // VAT label — show reverse charge or country rate
  const vatLabelText = isReverseCharge
    ? { ar: 'ضريبة القيمة المضافة: صفر (احتجاز عكسي)', de: 'MwSt.: 0% (Reverse Charge)', en: '0% VAT (Reverse Charge)', fr: 'TVA: 0% (Autoliquidation)', nl: 'BTW: 0% (Verlegd)' }
    : isNonEU
      ? { ar: 'ضريبة القيمة المضافة: صفر (خارج الاتحاد الأوروبي)', de: 'MwSt.: 0% (Nicht-EU)', en: '0% VAT (Non-EU)', fr: 'TVA: 0% (Hors UE)', nl: 'BTW: 0% (Buiten EU)' }
      : isExclusive
        ? { ar: `ضريبة القيمة المضافة (${vatRate}%)`, de: `Zzgl. ${vatRate}% MwSt.`, en: `${vatRate}% VAT`, fr: `TVA de ${vatRate}%`, nl: `${vatRate}% BTW` }
        : { ar: `ضريبة القيمة المضافة مشمولة (${vatRate}%)`, de: `Inklusive ${vatRate}% MwSt.`, en: `Includes ${vatRate}% VAT`, fr: `TVA de ${vatRate}% incluse`, nl: `Inclusief ${vatRate}% BTW` };
  const vatLabel = vatLabelText[currentLang as keyof typeof vatLabelText] || vatLabelText.en;

  const b2bErrorMsg = {
    ar: `تنبيه الحد الأدنى لطلب الجملة: الحد الأدنى المطلوب هو ${formatPrice(minB2BAmount)}. مجموع سلتك الحالي هو ${formatPrice(subtotal)}. يرجى إضافة المزيد من المنتجات للمتابعة.`,
    de: `B2B-Mindestbestellwert-Hinweis: Der erforderliche Mindestbestellwert beträgt ${formatPrice(minB2BAmount)}. Ihr aktueller Warenkorbwert ist ${formatPrice(subtotal)}. Bitte fügen Sie weitere Artikel hinzu, um fortzufahren.`,
    en: `B2B Minimum Order Notice: The required minimum order amount is ${formatPrice(minB2BAmount)}. Your current cart total is ${formatPrice(subtotal)}. Please add more items to proceed.`,
    fr: `Avis de commande minimum B2B : Le montant minimum requis est de ${formatPrice(minB2BAmount)}. Le total actuel de votre panier est de ${formatPrice(subtotal)}. Veuillez ajouter d'autres articles pour continuer.`,
    nl: `B2B Minimale bestelwaarschuwing: Het vereiste minimale bestelbedrag is ${formatPrice(minB2BAmount)}. Uw huidige winkelwagentotaal is ${formatPrice(subtotal)}. Voeg meer artikelen toe om door te gaan.`
  }[currentLang] || `B2B Minimum Order Notice: The required minimum order amount is ${formatPrice(minB2BAmount)}. Your current cart total is ${formatPrice(subtotal)}. Please add more items to proceed.`;

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-36 lg:pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      {/* Top Trust & Security Header Bar */}
      <div className="bg-stone-900 text-white text-xs py-3 px-4 shadow-sm border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 font-semibold text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>
              {currentLang === 'ar' ? '🔒 تشفير 256-Bit SSL — عملية دفع آمنة 100%' :
               currentLang === 'de' ? '🔒 256-Bit SSL Verschlüsselung — 100% Sichere Kasse' :
               currentLang === 'fr' ? '🔒 Chiffrement SSL 256 bits — Paiement 100% sécurisé' :
               currentLang === 'nl' ? '🔒 256-Bit SSL Encryptie — 100% Veilig Afrekenen' :
               '🔒 256-Bit SSL Encrypted — 100% Secure Checkout'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px] font-medium text-stone-300">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {currentLang === 'ar' ? 'حماية المشتري الكاملة' : '100% Käuferschutz'}</span>
            <span className="flex items-center gap-1.5"><span className="text-amber-400">📦</span> {currentLang === 'ar' ? 'طرد مأمّن عبر DHL' : 'DHL Versicherter Versand'}</span>
            <span className="flex items-center gap-1.5"><span className="text-blue-400">🔄</span> {currentLang === 'ar' ? 'إرجاع خلال 30 يوم' : '30 Tage Rückgaberecht'}</span>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10">
        <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition mb-6 uppercase tracking-widest">
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} /> {t.continueShopping}
        </Link>
        
        {/* ── Checkout Stepper Progress ── */}
        <div className="mb-6 sm:mb-8 max-w-xl mx-auto">
          <div className="flex items-center justify-between relative">
            <Link href="/cart" className="flex items-center gap-1.5 sm:gap-2 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                ✓
              </div>
              <span className="text-xs sm:text-sm font-semibold text-stone-700 group-hover:text-black">
                {currentLang === 'ar' ? 'السلة' : 'Warenkorb'}
              </span>
            </Link>

            <div className="flex-1 h-0.5 bg-stone-900 mx-2 sm:mx-4"></div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d40026] text-white flex items-center justify-center text-xs font-bold shadow-md ring-4 ring-red-100">
                2
              </div>
              <span className="text-xs sm:text-sm font-bold text-stone-900">
                {currentLang === 'ar' ? 'العنوان والدفع' : 'Kasse & Zahlung'}
              </span>
            </div>

            <div className="flex-1 h-0.5 bg-stone-200 mx-2 sm:mx-4"></div>

            <div className="flex items-center gap-1.5 sm:gap-2 opacity-40">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-xs sm:text-sm font-medium text-stone-400">
                {currentLang === 'ar' ? 'تأكيد الطلب' : 'Bestätigung'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mobile Collapsible Order Summary Bar ── */}
        {cart.length > 0 && (
          <div className="lg:hidden bg-white border border-stone-200 rounded-xl p-4 mb-6 shadow-xs">
            <button
              type="button"
              onClick={() => setMobileOrderSummaryOpen(!mobileOrderSummaryOpen)}
              className="w-full flex items-center justify-between text-xs font-bold text-stone-900"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-stone-600" />
                <span>
                  {mobileOrderSummaryOpen
                    ? (currentLang === 'ar' ? 'إخفاء ملخص المنتجات' : 'Bestellübersicht ausblenden')
                    : (currentLang === 'ar' ? `عرض تفاصيل الطلب (${cart.reduce((a, b) => a + b.quantity, 0)} منتج)` : `Bestellübersicht anzeigen (${cart.reduce((a, b) => a + b.quantity, 0)} Artikel)`)}
                </span>
                {mobileOrderSummaryOpen ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
              </span>
              <span className="text-sm font-black text-stone-950 font-mono">
                {formatPrice(total)}
              </span>
            </button>

            {mobileOrderSummaryOpen && (
              <div className="mt-4 pt-4 border-t border-stone-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden flex-shrink-0">
                      <img
                        src={resolveImageUrl(item.image_url) || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200&auto=format&fit=crop"}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                      />
                      <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-stone-900 truncate">{item.name}</h4>
                      <span className="text-[10px] text-stone-400 font-mono">{formatPrice(item.price)} × {item.quantity}</span>
                    </div>
                    <span className="text-xs font-bold text-stone-900 font-mono">
                      {formatPrice(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Free Shipping Progress Bar ── */}
        {cart.length > 0 && (
          <div className={`p-4 rounded-xl border mb-6 transition-all ${
            isFreeShipping 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-2xs' 
              : 'bg-stone-50/90 border-stone-200 text-stone-800'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-2">
                <Truck className={`w-4 h-4 ${isFreeShipping ? 'text-emerald-600' : 'text-blue-600'}`} />
                {isFreeShipping ? (
                  <span className="text-emerald-700">
                    {currentLang === 'ar' ? '🎉 مبارك! لقد حصلت على شحن مجاني عبر DHL!' : '🎉 Kostenloser DHL-Versand freigeschaltet!'}
                  </span>
                ) : (
                  <span>
                    {currentLang === 'ar' 
                      ? `أضف بقيمة ${formatPrice(freeShippingRemaining)} للحصول على شحن مجاني!` 
                      : `Noch ${formatPrice(freeShippingRemaining)} bis zum KOSTENLOSEN DHL-Versand!`}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-mono text-stone-500 font-bold">
                {freeShippingProgress}%
              </span>
            </div>

            <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isFreeShipping 
                    ? 'bg-emerald-500' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>

            {!isFreeShipping && (
              <div className="mt-2 text-right">
                <Link href="/shop" className="text-[11px] font-bold text-stone-900 hover:text-[#d40026] underline transition">
                  {currentLang === 'ar' ? '+ أضف منتجاً آخر من المتجر' : '+ Weiter einkaufen'}
                </Link>
              </div>
            )}
          </div>
        )}
        
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-6 sm:mb-8">{t.yourShoppingBag}</h1>

        {isSuperAdmin && (
          <div className="mb-8 p-4 bg-emerald-950 border border-emerald-700/60 rounded-xl text-emerald-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <div>
                <p className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  {currentLang === 'ar' ? 'وضع مالك المتجر (Super Admin)' : 'Shop-Inhaber Modus (Super Admin)'}
                </p>
                <p className="text-xs text-stone-200 mt-0.5">
                  {currentLang === 'ar'
                    ? 'تم فك حظر الحد الأدنى للطلب. يمكنك الآن إتمام وفحص الطلبات الفردية والتجريبية كزبون عادي بكل سهولة.'
                    : 'B2B-Mindestbestellwert ist für Sie aufgehoben. Sie können den Checkout & Zahlungen als normaler Kunde testen.'}
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block bg-emerald-600 text-white font-bold text-[10px] uppercase px-3 py-1 rounded-full">
              Test Mode OK
            </span>
          </div>
        )}

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16">
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-6 bg-white p-4 sm:p-6 border border-stone-200 rounded-xl shadow-sm relative group">
                  <div className="w-20 h-20 sm:w-24 sm:h-28 bg-white flex-shrink-0 rounded-lg overflow-hidden border border-stone-200/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolveImageUrl(item.image_url) || "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=200&auto=format&fit=crop"} alt={item.name} className="w-full h-full object-contain p-1" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 mb-1 pr-6">{item.name}</h3>
                      <p className="text-stone-400 text-xs uppercase tracking-wider font-semibold">
                        {item.variant_type || (currentLang === 'ar' ? '١٠٠ مل / إكستري دو بارفان' : '100ml / Extrait de Parfum')}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <div className="flex border border-stone-300 rounded-lg overflow-hidden bg-white">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition">-</button>
                          <input
                            type="number"
                            min={isB2B && item.b2bMinQty ? Number(item.b2bMinQty) : 1}
                            max={stockData[item.id] ?? undefined}
                            value={item.quantity}
                            onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                            className="px-1 py-1.5 text-stone-900 text-sm font-medium border-x border-stone-300 w-10 text-center bg-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => updateQuantity(item.id, 1)} className={`px-3 py-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition ${stockData[item.id] !== undefined && item.quantity >= stockData[item.id] ? 'opacity-40 cursor-not-allowed' : ''}`} disabled={stockData[item.id] !== undefined && item.quantity >= stockData[item.id]}>+</button>
                        </div>
                        {stockWarnings[item.id] && (
                          <span className="text-[11px] text-amber-600 font-medium mt-1">⚠ {stockWarnings[item.id]}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-stone-900">{formatPrice(parseFloat(item.price) * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => removeItem(item.id)} className={`absolute top-6 text-stone-300 hover:text-red-500 transition ${isRtl ? 'left-6' : 'right-6'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* ── Express Checkout Quick-Pay Section ── */}
              <div className="bg-stone-900 p-5 sm:p-6 rounded-2xl shadow-lg text-white mb-6 border border-stone-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {currentLang === 'ar' ? 'الدفع السريع بنقرة واحدة (Express Checkout)' : 'Express Checkout (1-Klick)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3 text-emerald-400" /> SSL 256-Bit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* PayPal Express Button */}
                  <button
                    type="button"
                    onClick={() => handleExpressOneClick('paypal')}
                    disabled={loading || isUnderB2BMinimum}
                    className="w-full bg-[#FFC439] hover:bg-[#F4B41A] text-[#003087] font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition transform active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <span className="font-bold text-xs uppercase tracking-wider">{currentLang === 'ar' ? 'دفع سريع عبر' : 'Direkt mit'}</span>
                    <img src="/paypal.svg" alt="PayPal" className="h-5 w-auto" />
                  </button>

                  {/* Klarna Rechnung Button */}
                  <button
                    type="button"
                    onClick={() => handleExpressOneClick('klarna')}
                    disabled={loading || isUnderB2BMinimum}
                    className="w-full bg-[#FFB3C7] hover:bg-[#FFA5BD] text-stone-950 font-black py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition transform active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <span className="font-bold">{currentLang === 'ar' ? 'ادفع بعد الاستلام' : 'Rechnungskauf'}</span>
                    <span className="bg-stone-950 text-white text-[10px] px-2 py-0.5 rounded font-black">Klarna.</span>
                  </button>
                </div>

                <div className="relative flex py-2 items-center mt-3">
                  <div className="flex-grow border-t border-stone-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {currentLang === 'ar' ? 'أو أدخل عنوان الشحن بالأسفل' : 'Oder regulär mit Adresse fortfahren'}
                  </span>
                  <div className="flex-grow border-t border-stone-800"></div>
                </div>
              </div>

              {/* ── Lieferadresse & Kontaktdaten (Customer & Shipping Address) ── */}
              <div id="shipping-address-form" className="bg-white p-5 sm:p-7 border border-stone-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                        {currentLang === 'ar' ? 'بيانات العميل وعنوان الشحن' :
                         currentLang === 'de' ? 'Lieferadresse & Kontaktdaten' :
                         currentLang === 'fr' ? 'Adresse de livraison & Contact' :
                         currentLang === 'nl' ? 'Bezorgadres & Contact' :
                         'Delivery Address & Contact'}
                      </h2>
                      <p className="text-xs text-stone-400">
                        {isAllDigitalCart 
                          ? (currentLang === 'ar' ? 'سيتم إرسال المنتجات الرقمية والتراخيص فوراً إلى هذا البريد' : 'Digitale Lizenzen werden sofort an diese E-Mail gesendet')
                          : (currentLang === 'ar' ? 'التسليم المباشر عبر DHL مع تتبع الشحنة' : 'Versicherter Paketversand per DHL mit Sendungsverfolgung')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 hidden sm:inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {currentLang === 'ar' ? 'بيانات مشفرة' : 'SSL Verschlüsselt'}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      {currentLang === 'ar' ? 'البريد الإلكتروني (لتأكيد الطلب والتتبع) *' : 'E-Mail-Adresse (für Bestellbestätigung & DHL-Tracking) *'}
                    </label>
                    <input
                      type="email"
                      value={shippingAddress.email}
                      onChange={(e) => handleAddressChange('email', e.target.value)}
                      placeholder="beispiel@domain.de"
                      className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none transition ${
                        addressErrors.email ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-stone-900 bg-stone-50/30'
                      }`}
                    />
                    {addressErrors.email && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ {addressErrors.email}</p>}
                  </div>

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        {currentLang === 'ar' ? 'الاسم الأول *' : 'Vorname *'}
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.firstName}
                        onChange={(e) => handleAddressChange('firstName', e.target.value)}
                        placeholder="Max"
                        className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none transition ${
                          addressErrors.firstName ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-stone-900 bg-stone-50/30'
                        }`}
                      />
                      {addressErrors.firstName && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ {addressErrors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        {currentLang === 'ar' ? 'اسم العائلة *' : 'Nachname *'}
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.lastName}
                        onChange={(e) => handleAddressChange('lastName', e.target.value)}
                        placeholder="Mustermann"
                        className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none transition ${
                          addressErrors.lastName ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-stone-900 bg-stone-50/30'
                        }`}
                      />
                      {addressErrors.lastName && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ {addressErrors.lastName}</p>}
                    </div>
                  </div>

                  {!isAllDigitalCart && (
                    <>
                      {/* Street & House Number */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        <div className="col-span-2 sm:col-span-3">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {currentLang === 'ar' ? 'اسم الشارع *' : 'Straße *'}
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.street}
                            onChange={(e) => handleAddressChange('street', e.target.value)}
                            placeholder="Hauptstraße"
                            className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none transition ${
                              addressErrors.street ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-stone-900 bg-stone-50/30'
                            }`}
                          />
                          {addressErrors.street && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ {addressErrors.street}</p>}
                        </div>

                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {currentLang === 'ar' ? 'الرقم' : 'Hausnr.'}
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.houseNumber}
                            onChange={(e) => handleAddressChange('houseNumber', e.target.value)}
                            placeholder="12a"
                            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-stone-900 bg-stone-50/30 text-sm focus:outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Postal Code & City */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {currentLang === 'ar' ? 'الرمز البريدي (PLZ) *' : 'Postleitzahl (PLZ) *'}
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.postalCode}
                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                            placeholder="52068"
                            className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none transition ${
                              addressErrors.postalCode ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-stone-900 bg-stone-50/30'
                            }`}
                          />
                          {addressErrors.postalCode && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ {addressErrors.postalCode}</p>}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {currentLang === 'ar' ? 'المدينة (Ort) *' : 'Stadt / Ort *'}
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            placeholder="Aachen"
                            className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none transition ${
                              addressErrors.city ? 'border-red-500 bg-red-50/20' : 'border-stone-300 focus:border-stone-900 bg-stone-50/30'
                            }`}
                          />
                          {addressErrors.city && <p className="text-xs text-red-600 font-semibold mt-1">⚠️ {addressErrors.city}</p>}
                        </div>
                      </div>

                      {/* Country & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {currentLang === 'ar' ? 'بلد الشحن والتوصيل *' : 'Lieferland *'}
                          </label>
                          <select
                            value={customerCountry}
                            onChange={(e) => {
                              setCustomerCountry(e.target.value);
                              setVatValidationResult(null);
                            }}
                            className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-white text-sm focus:outline-none focus:border-stone-900 transition font-medium"
                          >
                            <optgroup label="Europäische Union (EU)">
                              <option value="DE">Deutschland (DE)</option>
                              <option value="AT">Österreich (AT)</option>
                              <option value="BE">Belgien (BE)</option>
                              <option value="FR">Frankreich (FR)</option>
                              <option value="NL">Niederlande (NL)</option>
                              <option value="IT">Italien (IT)</option>
                              <option value="ES">Spanien (ES)</option>
                              <option value="PL">Polen (PL)</option>
                              <option value="DK">Dänemark (DK)</option>
                              <option value="SE">Schweden (SE)</option>
                              <option value="CZ">Tschechien (CZ)</option>
                              <option value="OTHER_EU">Weiteres EU-Land</option>
                            </optgroup>
                            <optgroup label="Nicht-EU">
                              <option value="CH">Schweiz (CH)</option>
                              <option value="GB">Großbritannien (UK)</option>
                              <option value="OTHER">Anderes Land</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                            {currentLang === 'ar' ? 'رقم الهاتف (اختياري، لإشعارات DHL)' : 'Telefonnummer (optional, für DHL-Zustellung)'}
                          </label>
                          <input
                            type="tel"
                            value={shippingAddress.phone}
                            onChange={(e) => handleAddressChange('phone', e.target.value)}
                            placeholder="+49 152 1234567"
                            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:border-stone-900 bg-stone-50/30 text-sm focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-5 sm:p-8 border border-stone-200 rounded-xl shadow-sm lg:sticky lg:top-8">
                <h2 className="text-xl font-serif font-bold text-stone-900 mb-4">{t.orderSummary}</h2>

                {/* ── Estimated Delivery & Trust Badge (Live DHL Countdown) ── */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 mb-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span>
                      {isAllDigitalCart ? (
                        currentLang === 'ar' ? '⚡ تسليم رقمي فوري عبر البريد' : '⚡ Sofortige digitale Bereitstellung'
                      ) : (
                        currentLang === 'ar' 
                          ? `اطلب خلال ${cutoffCountdown.hours} س و ${cutoffCountdown.minutes} د للشحن اليوم!` 
                          : `Bestellen Sie in ${cutoffCountdown.hours} Std. ${cutoffCountdown.minutes} Min. für Versand HEUTE!`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200/60">
                    <span className="text-stone-600 flex items-center gap-1.5 font-medium">
                      <Truck className="w-3.5 h-3.5 text-stone-800" />
                      {currentLang === 'ar' ? 'التسليم المتوقع:' : 'Voraussichtliche Lieferung:'}
                    </span>
                    <span className="font-bold text-stone-950 font-mono text-xs">
                      {isAllDigitalCart ? (currentLang === 'ar' ? 'فوري بعد الدفع' : 'Sofort nach Zahlung') : `${getEstimatedDeliveryDate()} (DHL)`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1.5 border-t border-amber-200/60">
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      ⭐⭐⭐⭐⭐ <strong className="text-stone-800">4.9/5</strong>
                    </span>
                    <span className="text-stone-500 font-medium">
                      {currentLang === 'ar' ? '1,280+ عميل موثق' : '1.280+ zufriedene Kunden'}
                    </span>
                  </div>
                </div>

                {/* ── Buy 2 Get 1 Free badge ── */}

                {freeUnitsCount > 0 && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 mb-4">
                    <span className="text-lg">🎁</span>
                    <div>
                      <p className="text-xs font-black text-emerald-700 uppercase tracking-wide">
                        {currentLang === 'ar' ? `اشترِ 2 واحصل على 1 مجاناً — ${freeUnitsCount} قطعة مجانية!` :
                         currentLang === 'de' ? `Kaufe 2, erhalte 1 GRATIS — ${freeUnitsCount} Artikel gratis!` :
                         currentLang === 'fr' ? `Achetez 2, obtenez 1 GRATUIT — ${freeUnitsCount} article(s) offert(s)!` :
                         currentLang === 'nl' ? `Koop 2, krijg 1 GRATIS — ${freeUnitsCount} artikel gratis!` :
                         `Buy 2 Get 1 FREE — ${freeUnitsCount} item(s) free!`}
                      </p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        {currentLang === 'ar' ? 'الأرخص يُطبَّق مجاناً تلقائياً' :
                         currentLang === 'de' ? 'Der günstigste Artikel wird automatisch gratis' :
                         currentLang === 'fr' ? 'L\'article le moins cher offert automatiquement' :
                         currentLang === 'nl' ? 'Het goedkoopste artikel automatisch gratis' :
                         'Cheapest item(s) applied free automatically'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3.5 text-sm text-stone-600 border-b border-stone-200 pb-5 mb-5">
                  <div className="flex justify-between">
                    <span>{t.subtotal}</span>
                    <span className="font-semibold text-stone-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.shippingLabel}</span>
                    <span className="font-semibold text-stone-900">{shipping === 0 ? t.complimentary : formatPrice(shipping)}</span>
                  </div>
                  {shipping > 0 && freeShippingRemaining > 0 && (
                    <div className="text-xs text-stone-400 mt-1 italic">
                      {t.spendMoreForFreeShipping.replace('{diff}', formatPrice(freeShippingRemaining))}
                    </div>
                  )}
                  {/* Gift Wrap Cost Line */}
                  {giftWrapOption && (
                    <div className="flex justify-between text-stone-800 font-semibold bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                      <span className="flex items-center gap-1.5 text-xs text-amber-900">
                        <Gift className="w-3.5 h-3.5 text-amber-700" />
                        {currentLang === 'ar' ? 'تغليف هدايا ملكي وبطاقة' : 'Geschenkverpackung & Karte'}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-900">{formatPrice(4.99)}</span>
                    </div>
                  )}
                  {/* Dynamic VAT calculation view */}
                  <div className={`flex justify-between ${isExclusive ? 'text-stone-600 font-medium' : 'text-xs text-stone-400 italic'}`}>
                    <span>{vatLabel}</span>
                    <span>{formatPrice(vatAmount)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-emerald-600 font-semibold">
                        {buy2get1Discount > 0 && appliedCoupon
                          ? (currentLang === 'ar' ? 'إجمالي الخصومات' : 'Total Savings')
                          : buy2get1Discount > 0
                          ? (currentLang === 'ar' ? 'خصم 2+1 مجاناً 🎁' : currentLang === 'de' ? 'Rabatt 2+1 Gratis 🎁' : currentLang === 'fr' ? 'Remise 2+1 Gratuit 🎁' : currentLang === 'nl' ? 'Korting 2+1 Gratis 🎁' : 'Buy 2 Get 1 Free 🎁')
                          : (currentLang === 'ar' ? 'الخصم المطبق' : 'Discount Applied')}
                      </span>
                      <span className="text-emerald-600 font-bold">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Shipping Method Selector */}
                {isAllDigitalCart ? (
                  <div className="border-b border-stone-200 pb-6 mb-6">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
                      {currentLang === 'ar' ? 'طريقة التسليم الرقمي' : currentLang === 'de' ? 'Versandart wählen (Digital)' : 'Delivery Method'}
                    </label>
                    <div className="p-3.5 border-2 border-emerald-500 bg-emerald-50/20 rounded-xl flex justify-between items-center shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          ⚡
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 text-xs">
                            {currentLang === 'ar' ? 'تسليم مفتاح رقمي عبر البريد الإلكتروني (ESD)' : currentLang === 'de' ? 'Digital Key / E-Mail Versand (ESD)' : 'Digital Key / E-Mail Delivery'}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            {currentLang === 'ar' ? 'توصيل فوري بعد الدفع مباشرة' : currentLang === 'de' ? 'Sofortige Lieferung per E-Mail nach Zahlung' : 'Instant delivery via email after payment'}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                        0,00 € (Kostenlos)
                      </div>
                    </div>
                  </div>
                ) : (
                  shippingMethods.length > 0 && (
                    <div className="border-b border-stone-200 pb-6 mb-6">
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
                        {currentLang === 'ar' ? 'طريقة الشحن المتاحة' : currentLang === 'de' ? 'Versandart wählen' : 'Select Shipping Method'}
                      </label>
                      <div className="space-y-2">
                        {shippingMethods.map((method) => {
                          const cost = parseFloat(method.cost);
                          const isSelected = selectedShippingMethod?.id === method.id;
                          return (
                            <div 
                              key={method.id}
                              onClick={() => setSelectedShippingMethod(method)}
                              className={`p-3 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                                isSelected 
                                  ? 'border-emerald-650 bg-emerald-50/10 ring-1 ring-emerald-650' 
                                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-stone-900 text-xs">{method.name}</div>
                                <div className="text-[10px] text-stone-400 mt-0.5">{method.days}</div>
                              </div>
                              <div className="font-mono text-xs font-bold text-stone-950">
                                {discountedSubtotal > 150 ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold">
                                    {t.complimentary}
                                  </span>
                                ) : (
                                  formatPrice(cost)
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                {/* Coupon Code Section */}
                <div className="border-b border-stone-200 pb-6 mb-6">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2.5">
                    {currentLang === 'ar' ? 'كوبون الخصم' : currentLang === 'de' ? 'Aktionscode' : 'Coupon Code'}
                  </label>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg text-sm font-semibold text-emerald-800">
                      <div className="flex items-center gap-2">
                        <span className="uppercase tracking-wider font-mono font-bold bg-emerald-100 px-1.5 py-0.5 rounded text-xs">{appliedCoupon.code}</span>
                        <span className="text-xs">
                          {currentLang === 'ar' ? 'مفعّل!' : 'Applied!'}
                        </span>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="text-xs text-emerald-600 hover:text-emerald-950 font-extrabold transition"
                      >
                        {currentLang === 'ar' ? 'إلغاء' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {!user && (
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                            {currentLang === 'ar' ? 'البريد الإلكتروني (للتحقق من الكوبون مرة واحدة)' : 'Email Address (for coupon limit validation)'}
                          </label>
                          <input
                            type="email"
                            value={couponEmail}
                            onChange={(e) => setCouponEmail(e.target.value)}
                            onBlur={(e) => {
                              const emailVal = e.target.value;
                              if (emailVal && emailVal.includes('@')) {
                                const sessionId = localStorage.getItem('bs_analytics_session_id');
                                if (sessionId) {
                                  axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/analytics/ping`, {
                                    session_id: sessionId,
                                    url: '/checkout',
                                    email: emailVal.trim()
                                  }).catch(() => {});
                                }
                              }
                            }}
                            placeholder="email@example.com"
                            className="w-full px-4 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 text-xs font-medium bg-stone-50/50"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder={currentLang === 'ar' ? 'أدخل الكوبون' : 'Enter Code'}
                          className="flex-1 px-4 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 text-xs font-semibold uppercase tracking-wider bg-stone-50/50"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode}
                          className="bg-stone-900 text-white px-4 py-2 font-bold uppercase tracking-wider text-xs hover:bg-black transition rounded-lg disabled:opacity-40"
                        >
                          {validatingCoupon ? '...' : (currentLang === 'ar' ? 'تطبيق' : 'Apply')}
                        </button>
                      </div>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-xs text-red-600 font-semibold mt-2.5">
                      ⚠ {couponError}
                    </p>
                  )}
                </div>

                {/* ── EU VAT: Country + VAT Number ── */}
                {true && (
                  <div className="border-b border-stone-200 pb-6 mb-6">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
                      {currentLang === 'ar' ? 'بلد التوصيل' : currentLang === 'de' ? 'Lieferland' : currentLang === 'fr' ? 'Pays de livraison' : currentLang === 'nl' ? 'Leveringsland' : 'Delivery Country'}
                    </label>

                    <select
                      value={customerCountry}
                      onChange={(e) => { setCustomerCountry(e.target.value); setVatValidationResult(null); setVatNumber(''); }}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 text-xs font-medium bg-stone-50/50 mb-3"
                    >
                      <optgroup label="EU Countries">
                        <option value="AT">Austria — 20% MwSt.</option>
                        <option value="BE">Belgium — 21% BTW</option>
                        <option value="BG">Bulgaria — 20%</option>
                        <option value="CY">Cyprus — 19% VAT</option>
                        <option value="CZ">Czech Republic — 21%</option>
                        <option value="DE">Germany — 19% MwSt.</option>
                        <option value="DK">Denmark — 25% Moms</option>
                        <option value="EE">Estonia — 22% KM</option>
                        <option value="EL">Greece — 24%</option>
                        <option value="ES">Spain — 21% IVA</option>
                        <option value="FI">Finland — 25.5% ALV</option>
                        <option value="FR">France — 20% TVA</option>
                        <option value="HR">Croatia — 25% PDV</option>
                        <option value="HU">Hungary — 27%</option>
                        <option value="IE">Ireland — 23% VAT</option>
                        <option value="IT">Italy — 22% IVA</option>
                        <option value="LT">Lithuania — 21%</option>
                        <option value="LU">Luxembourg — 17% TVA</option>
                        <option value="LV">Latvia — 21%</option>
                        <option value="MT">Malta — 18% VAT</option>
                        <option value="NL">Netherlands — 21% BTW</option>
                        <option value="PL">Poland — 23%</option>
                        <option value="PT">Portugal — 23% IVA</option>
                        <option value="RO">Romania — 19% TVA</option>
                        <option value="SE">Sweden — 25% Moms</option>
                        <option value="SI">Slovenia — 22% DDV</option>
                        <option value="SK">Slovakia — 20%</option>
                      </optgroup>
                      <optgroup label="Non-EU (0% VAT)">
                        <option value="CH">Switzerland</option>
                        <option value="NO">Norway</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                        <option value="OTHER">Other country</option>
                      </optgroup>
                    </select>

                    {euVatRates[customerCountry] && (
                      <div className="mt-3.5 mb-2.5">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isCompanyOrder}
                            onChange={(e) => {
                              setIsCompanyOrder(e.target.checked);
                              if (!e.target.checked) {
                                setVatNumber('');
                                setVatValidationResult(null);
                              }
                            }}
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                            {currentLang === 'ar' ? 'طلب باسم شركة / مؤسسة (إعفاء ضريبي)' : currentLang === 'de' ? 'Ich bestelle als Unternehmen (Steuerfrei)' : 'Business order / Company'}
                          </span>
                        </label>
                      </div>
                    )}

                    {isCompanyOrder && euVatRates[customerCountry] && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                          {currentLang === 'ar' ? 'رقم ضريبة القيمة المضافة (USt-IdNr)' : currentLang === 'de' ? 'USt-IdNr. (Pflicht für Steuerfreiheit)' : 'VAT ID (USt-IdNr.)'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={vatNumber}
                            onChange={(e) => { setVatNumber(e.target.value.toUpperCase()); setVatValidationResult(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && validateVatNumber()}
                            placeholder={`${customerCountry}123456789`}
                            className="flex-1 px-4 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 text-xs font-mono uppercase tracking-wider bg-stone-50/50"
                          />
                          <button
                            onClick={validateVatNumber}
                            disabled={vatValidating || !vatNumber.trim()}
                            className="bg-stone-900 text-white px-4 py-2 font-bold uppercase tracking-wider text-xs hover:bg-black transition rounded-lg disabled:opacity-40"
                          >
                            {vatValidating
                              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : (currentLang === 'ar' ? 'تحقق' : currentLang === 'de' ? 'Prüfen' : 'Check')
                            }
                          </button>
                        </div>

                        {vatValidationResult && (
                          <div className={`mt-2 p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                            vatValidationResult.valid === true
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                              : vatValidationResult.valid === false
                                ? 'bg-red-50 border border-red-200 text-red-700'
                                : 'bg-amber-50 border border-amber-200 text-amber-700'
                          }`}>
                            <span className="text-base leading-none mt-0.5">
                              {vatValidationResult.valid === true ? '✅' : vatValidationResult.valid === false ? '❌' : '⚠️'}
                            </span>
                            <div>
                              <p className="font-bold">
                                {vatValidationResult.valid === true
                                  ? (customerCountry === 'DE'
                                    ? (currentLang === 'ar' ? `رقم ضريبي صالح — تُطبَّق ضريبة القيمة المضافة المحلية (${defaultRate}%)` : currentLang === 'de' ? `Gültige USt-IdNr. — Inländische MwSt. fällt an (${defaultRate}% MwSt.)` : currentLang === 'fr' ? `N° TVA valide — La TVA domestique s'applique (${defaultRate}% TVA)` : currentLang === 'nl' ? `Geldig BTW-nr — Binnenlandse BTW van toepassing (${defaultRate}% BTW)` : `Valid VAT Number — Domestic VAT applies (${defaultRate}% VAT)`)
                                    : (currentLang === 'ar' ? 'رقم ضريبي صالح — يُطبَّق نظام الاحتجاز العكسي (0% ضريبة)' : currentLang === 'de' ? 'Gültige USt-IdNr. — Reverse-Charge gilt (0% MwSt.)' : currentLang === 'fr' ? 'N° TVA valide — Autoliquidation (0% TVA)' : currentLang === 'nl' ? 'Geldig BTW-nr — Verlegd (0% BTW)' : 'Valid VAT Number — Reverse Charge applies (0% VAT)')
                                  )
                                  : vatValidationResult.valid === false
                                    ? (currentLang === 'de' ? vatValidationResult.message_de : currentLang === 'fr' ? vatValidationResult.message_fr : currentLang === 'nl' ? vatValidationResult.message_nl : currentLang === 'ar' ? vatValidationResult.message_ar : vatValidationResult.message)
                                    : (currentLang === 'ar' ? 'خدمة VIES غير متاحة مؤقتاً' : currentLang === 'de' ? 'VIES vorübergehend nicht verfügbar' : currentLang === 'fr' ? 'VIES temporairement indisponible' : currentLang === 'nl' ? 'VIES tijdelijk niet beschikbaar' : vatValidationResult.message)
                                }
                              </p>
                              {vatValidationResult.companyName && (
                                <p className="mt-0.5 opacity-80">{vatValidationResult.companyName}</p>
                              )}
                              {vatValidationResult.valid === true && customerCountry === 'DE' && (
                                <p className="mt-1 text-[10px] opacity-90 leading-normal border-t border-emerald-200/40 pt-1">
                                  {currentLang === 'ar' ? 'تُحتسب الضريبة المحلية للشركات داخل ألمانيا، ويمكنكم استردادها لاحقاً عبر إقراركم الضريبي المعتاد (Vorsteuerabzug).' : 
                                   currentLang === 'de' ? 'Inländische USt. wird für deutsche Unternehmen berechnet. Sie können diese im Rahmen Ihrer regulären Steuererklärung als Vorsteuer geltend machen (Vorsteuerabzug).' : 
                                   currentLang === 'fr' ? 'La TVA domestique est facturée pour les entreprises allemandes. Vous pouvez la récupérer dans le cadre de votre déclaration fiscale habituelle.' : 
                                   currentLang === 'nl' ? 'Binnenlandse BTW wordt in rekening gebracht voor Duitse bedrijven. U kunt dit terugvorderen via uw reguliere belastingaangifte.' : 
                                   'Domestic VAT is charged for German businesses. You can reclaim it as input tax in your regular tax return.'}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-stone-400 mt-1.5 italic">
                          {currentLang === 'ar' ? 'للشركات المسجلة ضريبياً داخل الاتحاد الأوروبي — يُطبَّق نظام الاحتجاز العكسي تلقائياً' : currentLang === 'de' ? 'Für EU-registrierte Unternehmen — Reverse-Charge (0% MwSt.)' : currentLang === 'fr' ? 'Pour entreprises UE — Autoliquidation (0% TVA)' : currentLang === 'nl' ? 'Voor EU-bedrijven — BTW verlegd (0%)' : 'For EU VAT-registered businesses — 0% via Reverse Charge'}
                        </p>
                      </div>
                    )}

                    {!euVatRates[customerCountry] && (
                      <div className="mt-1 p-2.5 rounded-lg text-xs bg-blue-50 border border-blue-200 text-blue-700">
                        {currentLang === 'ar' ? '🌐 لا تُطبَّق ضريبة القيمة المضافة الأوروبية (دولة خارج الاتحاد الأوروبي)' : currentLang === 'de' ? '🌐 Keine EU-MwSt. (Lieferung außerhalb der EU)' : currentLang === 'fr' ? '🌐 Pas de TVA UE (livraison hors UE)' : currentLang === 'nl' ? '🌐 Geen EU-BTW (levering buiten EU)' : '🌐 No EU VAT applicable (non-EU delivery)'}
                      </div>
                    )}
                  </div>
                )}

                {/* ── One-Click Order Bump: Luxury Gift Packaging & Greeting Card ── */}
                <div className={`p-4 rounded-xl border transition-all mb-6 ${
                  giftWrapOption 
                    ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs' 
                    : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={giftWrapOption}
                      onChange={(e) => setGiftWrapOption(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-stone-900">
                        <span className="flex items-center gap-1.5">
                          <span>🎁</span>
                          {currentLang === 'ar' ? 'تغليف هدايا ملكي فاخر مع كرت تهنئة' : 'Als Geschenk verpacken (+4,99 €)'}
                        </span>
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          +4,99 €
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                        {currentLang === 'ar' 
                          ? 'صندوق هدايا فاخر مع شريط ساتان وبطاقة تهنئة مطبوعة خاصة بالمستلم.' 
                          : 'Edle Geschenkbox mit Satinband & individueller Grußkarte für den Beschenkten.'}
                      </p>
                      {giftWrapOption && (
                        <div className="mt-2.5 animate-in slide-in-from-top-1 duration-150">
                          <input
                            type="text"
                            value={giftMessage}
                            onChange={(e) => setGiftMessage(e.target.value)}
                            placeholder={currentLang === 'ar' ? 'اكتب رسالة الإهداء هنا (اختياري)...' : 'Ihre persönliche Grußbotschaft (optional)...'}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none focus:border-stone-900"
                            maxLength={180}
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Payment Method Selector */}
                <div className="mb-6 border-t border-stone-100 pt-6">
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3">
                    {currentLang === 'ar' ? 'طريقة الدفع' : 
                     currentLang === 'fr' ? 'Mode de paiement' :
                     currentLang === 'nl' ? 'Betaalmethode' : 
                     currentLang === 'de' ? 'Zahlungsart' : 'Payment Method'}
                  </h3>
                  
                  <div className="flex flex-col gap-2.5">

                    {/* Option 1: Klarna */}
                    <div 
                      onClick={() => { setPaymentMethod('stripe'); setPreferredStripeMethod('klarna'); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                        paymentMethod === 'stripe' && preferredStripeMethod === 'klarna'
                          ? 'border-[#ffb3c7] ring-2 ring-pink-500/20 bg-pink-50/40 shadow-sm' 
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center bg-white ${
                          paymentMethod === 'stripe' && preferredStripeMethod === 'klarna' ? 'border-pink-600 ring-2 ring-pink-500/20' : 'border-stone-300 group-hover:border-stone-400'
                        }`}>
                          {paymentMethod === 'stripe' && preferredStripeMethod === 'klarna' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-pink-600 animate-in zoom-in-50 duration-150" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-stone-900">Klarna</span>
                            <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Rechnung / Raten</span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded">0% Zinsen · In 30 Tagen</span>
                          </div>
                          <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                            {currentLang === 'ar' ? 'ادفع بعد الاستلام أو قسّط على دفعات عبر Klarna (بدون فوائد)' : 
                             currentLang === 'de' ? 'Erst Ware in Ruhe prüfen, in 30 Tagen bezahlen (Rechnungskauf)' : 
                             'Pay later after delivery or in 3 installments'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-pink-100 text-pink-900 font-black text-xs px-2 py-1 rounded-md">
                        Klarna.
                      </div>
                    </div>

                    {/* Option 2: Credit Card */}
                    <div 
                      onClick={() => { setPaymentMethod('stripe'); setPreferredStripeMethod('card'); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                        paymentMethod === 'stripe' && preferredStripeMethod === 'card'
                          ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50/90 shadow-sm' 
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center bg-white ${
                          paymentMethod === 'stripe' && preferredStripeMethod === 'card' ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-stone-300 group-hover:border-stone-400'
                        }`}>
                          {paymentMethod === 'stripe' && preferredStripeMethod === 'card' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-stone-900 animate-in zoom-in-50 duration-150" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-stone-900">
                            {currentLang === 'ar' ? 'بطاقة الائتمان (Visa / Mastercard)' : 'Kreditkarte / Debitkarte'}
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                            Visa, Mastercard, Maestro, American Express
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-stone-200/60">
                        <img src="/visa.svg" alt="Visa" className="h-3.5 w-auto" />
                      </div>
                    </div>

                    {/* Option 3: Apple Pay / Google Pay */}
                    <div 
                      onClick={() => { setPaymentMethod('stripe'); setPreferredStripeMethod('card'); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                        paymentMethod === 'stripe' && preferredStripeMethod === 'card'
                          ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50/90 shadow-sm' 
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center bg-white ${
                          paymentMethod === 'stripe' && preferredStripeMethod === 'card' ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-stone-300 group-hover:border-stone-400'
                        }`}>
                          {paymentMethod === 'stripe' && preferredStripeMethod === 'card' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-stone-900 animate-in zoom-in-50 duration-150" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-stone-900">
                            Apple Pay & Google Pay
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                            {currentLang === 'ar' ? 'دفع سريع بلمسة واحدة عبر محفظتك' : 'Schnell & einfach mit einem Klick bezahlen'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-stone-200/60">
                        <img src="/applepay.svg" alt="Apple Pay" className="h-3.5 w-auto" />
                        <img src="/gpay.svg" alt="Google Pay" className="h-3.5 w-auto" />
                      </div>
                    </div>

                    {/* Option 4: Sofort / Online-Überweisung */}
                    <div 
                      onClick={() => { setPaymentMethod('stripe'); setPreferredStripeMethod('eps'); }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                        paymentMethod === 'stripe' && (preferredStripeMethod === 'eps' || preferredStripeMethod === 'sofort')
                          ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50/90 shadow-sm' 
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center bg-white ${
                          paymentMethod === 'stripe' && (preferredStripeMethod === 'eps' || preferredStripeMethod === 'sofort') ? 'border-stone-900 ring-2 ring-stone-900/20' : 'border-stone-300 group-hover:border-stone-400'
                        }`}>
                          {paymentMethod === 'stripe' && (preferredStripeMethod === 'eps' || preferredStripeMethod === 'sofort') && (
                            <div className="w-2.5 h-2.5 rounded-full bg-stone-900 animate-in zoom-in-50 duration-150" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-stone-900">
                            {currentLang === 'ar' ? 'تحويل بنكي فوري (Sofort / giropay / EPS)' : 'Sofortüberweisung / giropay / EPS'}
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                            {currentLang === 'ar' ? 'دفع مباشر وآمن من حسابك البنكي' : 'Direkt & sicher über Ihr Online-Banking'}
                          </span>
                        </div>
                      </div>
                      <div className="text-blue-700 font-bold text-[10px] bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                        Bank
                      </div>
                    </div>

                    {/* Option 5: PayPal */}
                    <div 
                      onClick={() => setPaymentMethod('paypal')}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                        paymentMethod === 'paypal' 
                          ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-sm' 
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center bg-white ${
                          paymentMethod === 'paypal' ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-stone-300 group-hover:border-stone-400'
                        }`}>
                          {paymentMethod === 'paypal' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-in zoom-in-50 duration-150" />
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            PayPal
                            <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Express</span>
                          </span>
                          <span className="text-[10px] text-stone-500 font-medium mt-0.5">
                            {currentLang === 'ar' ? 'دفع سريع ومباشر بحماية بايبال للمشتري' : 
                             currentLang === 'fr' ? 'Payez en toute sécurité avec PayPal' :
                             currentLang === 'nl' ? 'Veilig betalen met PayPal' :
                             currentLang === 'de' ? 'Sicher bezahlen mit PayPal Käuferschutz' : 'Pay securely with PayPal Buyer Protection'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-1 rounded-lg border border-stone-200/60 shadow-2xs">
                        <img src="/paypal.svg" alt="PayPal" className="h-4.5 w-auto" />
                      </div>
                    </div>
                  </div>


                </div>

                <div className="pt-2 pb-5 border-b border-stone-100 mb-5">
                  <div className="flex justify-between items-baseline text-lg font-bold text-stone-900">
                    <span>{t.totalLabel}</span>
                    <span className="text-2xl font-black text-stone-950">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                    <span>{vatLabel}</span>
                    <span className="text-emerald-700 font-semibold">{shipping === 0 ? (currentLang === 'ar' ? 'شحن مجاني' : 'Kostenloser Versand') : ''}</span>
                  </div>
                </div>

                {/* ── German Legal Compliance: AGB & Widerrufsbelehrung (§ 312j BGB) ── */}
                <div id="terms-agreement-box" className={`p-3.5 rounded-xl border transition-all mb-5 ${termsError ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400/20' : 'bg-stone-50 border-stone-200'}`}>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (e.target.checked) setTermsError('');
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                    />
                    <span className="text-[11px] text-stone-600 leading-relaxed">
                      {currentLang === 'ar' ? (
                        <>
                          أوافق على <Link href="/terms" target="_blank" className="text-stone-900 font-bold underline hover:text-black">الشروط والأحكام العامة (AGB)</Link> واطلعت على <Link href="/widerrufsbelehrung" target="_blank" className="text-stone-900 font-bold underline hover:text-black">سياسة الإلغاء وحق الإرجاع (Widerrufsbelehrung)</Link> و<Link href="/privacy" target="_blank" className="text-stone-900 font-bold underline hover:text-black">سياسة الخصوصية</Link>.
                        </>
                      ) : currentLang === 'de' ? (
                        <>
                          Ich habe die <Link href="/terms" target="_blank" className="text-stone-900 font-bold underline hover:text-black">AGB</Link> und die <Link href="/widerrufsbelehrung" target="_blank" className="text-stone-900 font-bold underline hover:text-black">Widerrufsbelehrung</Link> gelesen und erkläre mich mit diesen sowie der <Link href="/privacy" target="_blank" className="text-stone-900 font-bold underline hover:text-black">Datenschutzerklärung</Link> einverstanden.
                        </>
                      ) : (
                        <>
                          I have read and agree to the <Link href="/terms" target="_blank" className="text-stone-900 font-bold underline hover:text-black">Terms & Conditions</Link>, <Link href="/widerrufsbelehrung" target="_blank" className="text-stone-900 font-bold underline hover:text-black">Right of Withdrawal</Link>, and <Link href="/privacy" target="_blank" className="text-stone-900 font-bold underline hover:text-black">Privacy Policy</Link>.
                        </>
                      )}
                    </span>
                  </label>
                  {termsError && (
                    <p className="text-[11px] text-red-600 font-bold mt-2 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                      <span>⚠️</span> {termsError}
                    </p>
                  )}
                </div>

                {/* ── Secure Checkout Action Button (§ 312j Abs. 3 BGB Button-Lösung) ── */}
                <button 
                  onClick={handleCheckout}
                  disabled={loading || isUnderB2BMinimum}
                  className="w-full bg-[#d40026] hover:bg-[#b0001e] text-white py-4 px-6 font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all duration-300 rounded-xl shadow-lg hover:shadow-red-700/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
                      <span>
                        {currentLang === 'ar' ? '🔒 تأكيد الطلب والدفع بأمان' :
                         currentLang === 'de' ? '🔒 Zahlungspflichtig bestellen' :
                         currentLang === 'fr' ? '🔒 Commander avec obligation de paiement' :
                         currentLang === 'nl' ? '🔒 Bestellen met betaalplicht' :
                         '🔒 Place Binding Order'}
                      </span>
                    </>
                  )}
                </button>
                
                {/* ── Security Notice & Trust Badges ── */}
                <div className="mt-6 space-y-4 border-t border-stone-200/60 pt-5">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-lg border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{t.secNotice}</span>
                  </div>

                  {/* 3-Point Guarantee Grid */}
                  <div className="grid grid-cols-1 gap-2 text-[11px] text-stone-600 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/60">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <strong className="text-stone-800 block">{currentLang === 'ar' ? 'ضمان استرداد الأموال 100%' : '100% Geld-zurück-Garantie'}</strong>
                        <span className="text-[10px] text-stone-400">{currentLang === 'ar' ? 'حماية كاملة وحق الإرجاع خلال 30 يوم' : 'Voller Käuferschutz & 30 Tage Rückgaberecht'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-stone-200/40">
                      <span className="text-blue-600 font-bold">✓</span>
                      <div>
                        <strong className="text-stone-800 block">{currentLang === 'ar' ? 'شحن مأمّن عبر DHL' : 'Versicherter Versand per DHL'}</strong>
                        <span className="text-[10px] text-stone-400">{currentLang === 'ar' ? 'تتبع فوري مع تأمين كامل على الطرد' : 'Sendungsverfolgung & Schutz bis 500 €'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-stone-200/40">
                      <span className="text-violet-600 font-bold">✓</span>
                      <div>
                        <strong className="text-stone-800 block">{currentLang === 'ar' ? 'تشفير بيانات آمن DSGVO' : 'DSGVO & SSL Zertifiziert'}</strong>
                        <span className="text-[10px] text-stone-400">{currentLang === 'ar' ? 'معالجة مشفرة بالكامل طبقاً للمعايير الألمانية' : 'Verschlüsselte Abwicklung nach EU-Standards'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Premium Checkout Payment Strip */}
                  <div className="flex flex-wrap items-center justify-center gap-3.5 mt-3 bg-stone-900 py-2.5 px-4 rounded-xl shadow-sm border border-stone-800">
                    <img 
                      src="/visa.svg" 
                      alt="Visa" 
                      className="h-4 w-auto object-contain" 
                      style={{ filter: 'brightness(0) invert(1)' }} 
                    />
                    <img 
                      src="/stripe.svg" 
                      alt="Stripe" 
                      className="h-4.5 w-auto object-contain" 
                      style={{ filter: 'brightness(0) invert(1)' }} 
                    />
                    <img 
                      src="/paypal.svg" 
                      alt="PayPal" 
                      className="h-4 w-auto object-contain" 
                      style={{ filter: 'brightness(0) invert(1)' }} 
                    />
                    <img 
                      src="/gpay.svg" 
                      alt="Google Pay" 
                      className="h-4 w-auto object-contain" 
                      style={{ filter: 'brightness(0) invert(1)' }} 
                    />
                    <img 
                      src="/applepay.svg" 
                      alt="Apple Pay" 
                      className="h-4 w-auto object-contain" 
                      style={{ filter: 'brightness(0) invert(1)' }} 
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── Sticky Mobile Checkout Bar ── */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl px-4 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider leading-none">
                {currentLang === 'ar' ? 'الإجمالي النهائي' : 'Gesamtsumme'}
              </span>
              <span className="text-base font-black text-stone-950 font-mono leading-tight mt-0.5">
                {formatPrice(total)}
              </span>
              <span className="text-[9px] text-emerald-600 font-medium leading-none">
                {shipping === 0 ? (currentLang === 'ar' ? '✓ شحن مجاني' : '✓ Gratis Versand') : 'Inkl. MwSt.'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading || isUnderB2BMinimum}
              className="flex-1 max-w-[200px] bg-[#d40026] hover:bg-[#b0001e] text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-40"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-white/90" />
                  <span>{currentLang === 'ar' ? 'إتمام الطلب' : 'Jetzt Kaufen'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
