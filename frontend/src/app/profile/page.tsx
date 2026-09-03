"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  User, ShieldCheck, Mail, Calendar, Key, AlertCircle, ShoppingBag, 
  Package, Truck, ArrowRight, FileText, ExternalLink, Copy, Check, 
  Eye, ChevronDown, ChevronUp, Clock 
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import LoyaltyPoints from "../../components/LoyaltyPoints";
import { translations, Locale } from "../../utils/i18n";
import { resolveImageUrl } from "../../utils/api";
import { printCustomerInvoice } from "../../utils/invoice";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Profile() {
  const router = useRouter();
  
  // Language state
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  
  // State
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(5);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  
  // Profile edit fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderIds(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Sync language from localStorage
  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  useEffect(() => {
    syncLang();
    window.addEventListener('language-changed', syncLang);
    return () => window.removeEventListener('language-changed', syncLang);
  }, []);

  const t = translations[currentLang] as any;

  // Translate order status
  const translateStatus = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PROCESSING' || s === 'PAID') return t.statusProcessing;
    if (s === 'SHIPPED') return t.statusShipped;
    if (s === 'DELIVERED') return t.statusDelivered;
    if (s === 'CANCELLED') return t.statusCancelled;
    return status;
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Package className="w-3.5 h-3.5 text-blue-600" />
      };
    }
    if (s === 'SHIPPED') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <Truck className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    if (s === 'CANCELLED') {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
      };
    }
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />
    };
  };

  const getLoadMoreText = () => {
    switch (currentLang) {
      case 'ar': return 'عرض المزيد';
      case 'fr': return 'Charger plus';
      case 'nl': return 'Meer laden';
      case 'en': return 'Load More';
      default: return 'Mehr anzeigen';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfileAndOrders = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${API_URL}/auth/profile`, { headers });
        
        setProfile(response.data);
        setName(response.data.name);
        setEmail(response.data.email);
        setCompanyName(response.data.companyName || '');
        setVatNumber(response.data.vatNumber || '');
        
        // Fetch order history from API (database) first, fallback to localStorage
        try {
          const ordersResponse = await axios.get(`${API_URL}/orders/my-orders`, { headers });
          const dbOrders = ordersResponse.data.map((o: any) => ({
            orderId: `ORD-${o.id.substring(0, 6).toUpperCase()}`,
            db_id: o.id,
            date: o.created_at ? new Date(o.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : currentLang === 'de' ? 'de-DE' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            created_at: o.created_at,
            customerName: o.customer_name || response.data.name || 'Valued Customer',
            customerEmail: o.customer_email || response.data.email || '',
            customerPhone: o.customer_phone || '',
            shippingAddress: o.shipping_address || '',
            items: (o.items || []).map((item: any) => ({
              id: item.id,
              product_id: item.product_id || null,
              sku: item.sku || null,
              name: item.name,
              image_url: item.image_url || null,
              quantity: item.quantity,
              price: parseFloat(item.unit_price).toFixed(2),
              total_price: parseFloat(item.total_price || (item.unit_price * item.quantity)).toFixed(2),
              isDigital: item.isDigital || false,
              digitalKeys: item.digitalKeys || [],
              digitalInstructions: item.digitalInstructions || '',
            })),
            subtotal: (parseFloat(o.total_amount) - parseFloat(o.shipping_amount || '0')).toFixed(2),
            shipping: parseFloat(o.shipping_amount || '0').toFixed(2),
            total: parseFloat(o.total_amount).toFixed(2),
            discount_amount: o.discount_amount || 0,
            coupon_code: o.coupon_code || null,
            status: o.status,
            trackingNumber: o.tracking_number || null,
            shippingProvider: o.shipping_provider || null,
            locale: o.locale || currentLang,
          }));
          setOrders(dbOrders);
        } catch (orderErr) {
          console.error("Failed to fetch orders from API, using localStorage fallback", orderErr);
          const rawLocal = JSON.parse(localStorage.getItem('orders') || '[]');
          const formattedLocal = rawLocal.map((o: any) => ({
            ...o,
            db_id: o.db_id || o.id || o.orderId,
            items: (o.items || []).map((item: any) => ({
              ...item,
              price: parseFloat(item.price || item.unit_price || 0).toFixed(2),
            }))
          }));
          setOrders(formattedLocal);
        }
      } catch (err) {
        console.error("Failed to load profile from API, using local session fallback", err);
        const storedUserJson = localStorage.getItem('user');
        if (storedUserJson) {
          try {
            const storedUser = JSON.parse(storedUserJson);
            setProfile(storedUser);
            setName(storedUser.name || '');
            setEmail(storedUser.email || '');
            setCompanyName(storedUser.companyName || '');
            setVatNumber(storedUser.vatNumber || '');
            const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            setOrders(localOrders);
            return;
          } catch (_e) {}
        }
        setError(t.sessionExpired);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndOrders();
  }, [router, currentLang]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password && password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload: any = { name, email, companyName, vatNumber };
      if (password) payload.password = password;

      const response = await axios.put(`${API_URL}/auth/profile`, payload, { headers });
      
      // Update local storage user details
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setProfile({
        ...profile,
        name: response.data.user.name,
        email: response.data.user.email,
        companyName: response.data.user.companyName,
        vatNumber: response.data.user.vatNumber
      });
      
      // Clear password fields
      setPassword('');
      setConfirmPassword('');
      
      // Notify header and layout of the name change
      window.dispatchEvent(new Event('user-logged-in'));
      
      setMessage(t.profileUpdated);
    } catch (err: any) {
      setError(err.response?.data?.message || t.profileUpdated);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  const roleLabel = profile?.role === 'SUPER_ADMIN'
    ? t.erpAdmin
    : profile?.role === 'SELLER'
    ? t.wholesaleMerchant
    : t.customer;

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24">
      {/* Upper Hero Section */}
      <div className="bg-[#1c1917] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <User className="w-8 h-8 text-stone-200" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold tracking-tight">{profile?.name}</h1>
                <p className="text-stone-400 text-sm">{profile?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-400 px-4 py-2 border border-emerald-800 rounded-sm">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-semibold">
                {t.verifiedAccount}: {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Column 1 & 2: Account Details & Editing */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Edit Details Block */}
            <div className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-8 border-b border-stone-100 pb-4">{t.personalDetails}</h2>
              
              {message && (
                <div className="bg-emerald-50 text-emerald-600 text-sm p-4 rounded-md mb-6 border border-emerald-100">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-rose-50 text-rose-600 text-sm p-4 rounded-md mb-6 border border-rose-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.fullName}</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.emailAddress}</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.companyNameOptional}</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.vatNumberOptional}</label>
                    <input 
                      type="text" 
                      value={vatNumber}
                      onChange={e => setVatNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. DE359710814"
                      className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                    />
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-6 mt-8">
                  <h3 className="text-sm font-semibold text-stone-900 mb-6 flex items-center gap-2">
                    <Key className="w-4 h-4 text-stone-400" /> {t.changePassword}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.newPassword}</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t.leaveBlankPassword}
                        className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">{t.confirmNewPassword}</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder={t.leaveBlankPassword}
                        className="w-full border-b border-stone-300 bg-transparent py-2 px-1 text-sm text-stone-900 focus:outline-none focus:border-stone-900 transition" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-stone-900 text-white px-8 py-3.5 uppercase tracking-widest font-semibold text-xs hover:bg-black transition rounded-sm disabled:opacity-50 mt-4 shadow-sm"
                >
                  {saving ? t.saving : t.saveProfileDetails}
                </button>
              </form>
            </div>

            {/* Order History Block */}
            <div className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-8 border-b border-stone-100 pb-4">{t.orderHistory}</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                    <ShoppingBag className="w-6 h-6 text-stone-400" />
                  </div>
                  <p className="text-stone-500 text-sm mb-6">{t.noOrdersYet}</p>
                  <Link href="/shop" className="inline-flex items-center gap-2 bg-stone-950 text-white px-6 py-3 uppercase tracking-widest font-bold text-[10px] hover:bg-black transition">
                    {t.startShopping} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.slice(0, visibleOrdersCount).map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    const isExpanded = !!expandedOrderIds[order.orderId];

                    return (
                      <div key={order.orderId} className="border border-stone-200 rounded-sm p-5 sm:p-6 space-y-4 hover:border-stone-400 transition-colors bg-white shadow-2xs">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div>
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t.orderReference}</p>
                              <h4 className="text-lg font-bold text-stone-900 font-serif tracking-tight">{order.orderId}</h4>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${statusBadge.bg}`}>
                              {statusBadge.icon}
                              <span>{translateStatus(order.status)}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-xs text-stone-500 sm:text-right">
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t.placedOn}</p>
                              <span className="font-semibold text-stone-800">{order.date}</span>
                            </div>

                            {/* Prominent Invoice Download Button */}
                            <button
                              type="button"
                              onClick={() => printCustomerInvoice(order, currentLang)}
                              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-black text-white px-3.5 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer shrink-0"
                              title={t.downloadInvoice}
                            >
                              <FileText className="w-3.5 h-3.5 text-stone-300" />
                              <span>{t.downloadInvoice}</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3 divide-y divide-stone-100">
                          {order.items.map((item: any, idx: number) => {
                            const productHref = item.product_id ? `/shop/${item.product_id}` : (item.sku ? `/shop/${item.sku}` : `/shop?search=${encodeURIComponent(item.name)}`);
                            const hasKeys = Array.isArray(item.digitalKeys) && item.digitalKeys.length > 0;

                            return (
                              <div key={idx} className="pt-3 first:pt-0 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  {/* Left: Thumbnail & Name & View Product */}
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <Link href={productHref} className="shrink-0 group">
                                      {item.image_url ? (
                                        <img 
                                          src={resolveImageUrl(item.image_url)} 
                                          alt={item.name} 
                                          className="w-14 h-14 object-cover rounded border border-stone-200 group-hover:border-stone-400 transition" 
                                        />
                                      ) : (
                                        <div className="w-14 h-14 bg-stone-100 rounded border border-stone-200 flex items-center justify-center text-stone-400 group-hover:border-stone-400 transition">
                                          <Package className="w-6 h-6" />
                                        </div>
                                      )}
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                      <Link 
                                        href={productHref} 
                                        className="font-medium text-stone-900 hover:text-emerald-700 transition line-clamp-2 text-sm"
                                      >
                                        {item.name}
                                      </Link>
                                      
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-xs text-stone-500 font-semibold bg-stone-100 px-2 py-0.5 rounded">
                                          x{item.quantity}
                                        </span>
                                        {item.sku && (
                                          <span className="text-[10px] text-stone-400 font-mono">
                                            SKU: {item.sku}
                                          </span>
                                        )}
                                        {/* Direct "View Product" Action */}
                                        <Link 
                                          href={productHref} 
                                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition underline underline-offset-2"
                                        >
                                          <Eye className="w-3 h-3" />
                                          <span>{t.viewProduct}</span>
                                        </Link>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Price */}
                                  <div className="text-right shrink-0">
                                    <div className="text-sm font-bold text-stone-950 font-mono">
                                      €{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                    </div>
                                    {item.quantity > 1 && (
                                      <div className="text-[10px] text-stone-400 font-mono">
                                        €{parseFloat(item.price).toFixed(2)} / Stk.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Digital License Key Box if available */}
                                {hasKeys && (
                                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-sm p-3 mt-2 text-xs">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                                        <Key className="w-3.5 h-3.5 text-amber-700" />
                                        {t.digitalKeys}
                                      </span>
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                                        {t.digitalDeliveryNotice}
                                      </span>
                                    </div>

                                    <div className="space-y-1.5">
                                      {item.digitalKeys.map((key: string, kIdx: number) => {
                                        const keyUniqueId = `${order.orderId}-${idx}-${kIdx}`;
                                        const isCopied = copiedKeyId === keyUniqueId;

                                        return (
                                          <div 
                                            key={kIdx} 
                                            className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded border border-amber-200"
                                          >
                                            <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm select-all break-all">
                                              {key}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => copyToClipboard(key, keyUniqueId)}
                                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition shrink-0 cursor-pointer ${
                                                isCopied 
                                                  ? 'bg-emerald-600 text-white' 
                                                  : 'bg-stone-900 hover:bg-black text-white'
                                              }`}
                                            >
                                              {isCopied ? (
                                                <>
                                                  <Check className="w-3 h-3" />
                                                  <span>{t.copied}</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="w-3 h-3" />
                                                  <span>{t.copyKey}</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {item.digitalInstructions && (
                                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-stone-600 text-[11px] leading-relaxed">
                                        <strong className="text-amber-950">{t.activationInstructions}:</strong>
                                        <div className="mt-1 whitespace-pre-wrap font-sans text-stone-700 bg-white/60 p-2 rounded border border-amber-100">
                                          {item.digitalInstructions}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Summary & Logistics Footer */}
                        <div className="border-t border-stone-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          {/* Courier / Tracking */}
                          <div className="text-stone-500 space-y-1">
                            {order.shippingProvider && (
                              <div>
                                {t.courier}: <strong className="text-stone-700">{order.shippingProvider}</strong>
                              </div>
                            )}
                            {order.trackingNumber ? (
                              <div className="flex items-center gap-1.5">
                                <span>{t.tracking}:</span>
                                {order.trackingNumber.startsWith('http') ? (
                                  <a 
                                    href={order.trackingNumber} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-1"
                                  >
                                    <span>{t.trackPackage}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <a 
                                    href={`https://www.gls-pakete.de/sendungsverfolgung?txtTrackingNumber=${order.trackingNumber}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-emerald-700 hover:underline font-bold font-mono inline-flex items-center gap-1"
                                  >
                                    <span>{order.trackingNumber}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div className="text-stone-400 italic">{t.trackingPending}</div>
                            )}
                          </div>

                          {/* Total & Action Buttons */}
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <button
                              type="button"
                              onClick={() => toggleOrderDetails(order.orderId)}
                              className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 font-semibold text-xs cursor-pointer"
                            >
                              <span>{isExpanded ? t.hideDetails : t.orderDetails}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <div className="text-sm font-bold text-stone-950 sm:text-right font-mono">
                              {t.totalPaid}: €{order.total}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Full Order Breakdown */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-stone-200 bg-stone-50/70 p-4 rounded text-xs space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-bold text-stone-400 uppercase tracking-wider text-[10px] mb-1">{t.billTo} / {t.shipTo}</h5>
                                <p className="font-semibold text-stone-800">{order.customerName}</p>
                                {order.customerEmail && <p className="text-stone-500">{order.customerEmail}</p>}
                                {order.shippingAddress && (
                                  <p className="text-stone-600 whitespace-pre-wrap mt-1">{order.shippingAddress}</p>
                                )}
                              </div>

                              <div className="space-y-1.5 sm:text-right">
                                <div className="flex justify-between sm:justify-end sm:gap-6 text-stone-600">
                                  <span>{t.subtotal}:</span>
                                  <span className="font-mono">€{order.subtotal || order.total}</span>
                                </div>
                                <div className="flex justify-between sm:justify-end sm:gap-6 text-stone-600">
                                  <span>{t.shipping}:</span>
                                  <span className="font-mono">{parseFloat(order.shipping || '0') === 0 ? t.freeShipping : `€${order.shipping}`}</span>
                                </div>
                                {parseFloat(order.discount_amount || '0') > 0 && (
                                  <div className="flex justify-between sm:justify-end sm:gap-6 text-emerald-700 font-semibold">
                                    <span>Rabatt ({order.coupon_code || ''}):</span>
                                    <span className="font-mono">-€{parseFloat(order.discount_amount).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between sm:justify-end sm:gap-6 text-stone-400 text-[11px] italic">
                                  <span>{t.vatIncluded}</span>
                                  <span className="font-mono">€{((parseFloat(order.total) - parseFloat(order.shipping || '0')) * 19 / 119).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between sm:justify-end sm:gap-6 text-stone-900 font-bold text-sm pt-1 border-t border-stone-200">
                                  <span>{t.totalPaid}:</span>
                                  <span className="font-mono">€{order.total}</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => printCustomerInvoice(order, currentLang)}
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 text-stone-900 px-4 py-2 rounded border border-stone-300 font-bold uppercase tracking-wider text-[10px] transition cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-stone-700" />
                                <span>{t.downloadInvoice}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {orders.length > visibleOrdersCount && (
                    <div className="text-center pt-4">
                      <button
                        type="button"
                        onClick={() => setVisibleOrdersCount(prev => prev + 5)}
                        className="bg-stone-900 text-white hover:bg-black px-6 py-2.5 uppercase tracking-widest font-semibold text-[10px] transition rounded-sm shadow-xs cursor-pointer"
                      >
                        {getLoadMoreText()}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Column 3: Summary & Support */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 border border-stone-200 rounded-sm shadow-sm">
              <h3 className="font-serif font-bold text-stone-900 text-lg mb-6 border-b border-stone-100 pb-3">{t.membership}</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">{t.accountSince}</p>
                    <p className="text-sm font-semibold text-stone-800">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(
                        currentLang === 'ar' ? 'ar-SA' : currentLang === 'de' ? 'de-DE' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'nl' ? 'nl-NL' : 'en-US',
                        { year: 'numeric', month: 'long' }
                      ) : 'Mai 2026'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-stone-400" />
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">{t.communication}</p>
                    <p className="text-sm font-semibold text-stone-800">{t.emailUpdatesActive}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1c1917] text-stone-300 p-8 border border-stone-800 rounded-sm shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="font-serif font-bold text-white text-lg mb-4 relative z-10">{t.b2bSolutions}</h3>
              <p className="text-xs text-stone-400 leading-relaxed mb-6 relative z-10">
                {t.b2bSolutionsDesc}
              </p>
              <Link href="/wholesale" className="relative z-10 inline-flex items-center gap-2 bg-white text-stone-950 font-bold text-[10px] uppercase tracking-widest px-5 py-3 hover:bg-stone-200 transition shadow-md">
                {t.configureVat}
              </Link>
            </div>

            {/* Loyalty Points Card */}
            <LoyaltyPoints />

          </div>

        </div>
      </div>
    </div>
  );
}
