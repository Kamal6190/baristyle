"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Pencil, Save, X, Plus, Check, LayoutDashboard, Package, ShoppingCart, FileText, Users, Settings, LogOut, ArrowUpRight, Search, Download, Tags, Trash2, Image as ImageIcon, Percent, Truck, Globe, Eye, MessageSquare, Star, Gift, Mail, Shield, Upload, BarChart3, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Smartphone, Laptop, Tablet, Send, RotateCw, ChevronDown, ChevronUp, Menu, Sparkles, Filter, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { resolveImageUrl } from '../../utils/api';
import EbaySection from './EbaySection';
import AmazonSection from './AmazonSection';
import AnalyticsSection from './AnalyticsSection';
import RichTextEditor from './RichTextEditor';
import SeoTagsInput from './SeoTagsInput';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';



const DEFAULT_HOMEPAGE_STATS = [
  { value: '500+', label_en: 'Premium Brands', label_ar: 'العلامات التجارية الفاخرة' },
  { value: '24h', label_en: 'Order Processing', label_ar: 'سرعة تجهيز الطلبات' },
  { value: 'Global', label_en: 'B2B Logistics', label_ar: 'الخدمات اللوجستية B2B' },
  { value: '99.8%', label_en: 'Reliability Rate', label_ar: 'معدل موثوقية الأداء' }
];

const API_URL_CONST = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
  : 'http://localhost:5000/api';


// ── Marketing & Newsletters Section ─────────────────────────────────────────
interface AbandonedCheckout {
  email: string;
  url: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  created_at: string;
  session_id: string;
}

function MarketingSection() {
  const [subscribers, setSubscribers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [subject, setSubject] = React.useState('Neue Highlights & exklusive Angebote bei BS Baristore');
  const [customMessage, setCustomMessage] = React.useState('');

  // Abandoned checkouts states
  const [abandonedCheckouts, setAbandonedCheckouts] = React.useState<AbandonedCheckout[]>([]);
  const [loadingAbandoned, setLoadingAbandoned] = React.useState(true);
  const [selectedEmail, setSelectedEmail] = React.useState<string | null>(null);
  const [offerCouponCode, setOfferCouponCode] = React.useState('SPECIAL10');
  const [sendingOffer, setSendingOffer] = React.useState(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = React.useState<string | null>(null);
  const [offerErrorMsg, setOfferErrorMsg] = React.useState<string | null>(null);
  const [sentOfferEmails, setSentOfferEmails] = React.useState<Set<string>>(new Set());

  const fetchAbandonedCheckouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/analytics/abandoned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAbandonedCheckouts(res.data.data || []);
    } catch (err) {
      console.error('[Abandoned checkouts fetch error]:', err);
    } finally {
      setLoadingAbandoned(false);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) return;
    setSendingOffer(true);
    setOfferSuccessMsg(null);
    setOfferErrorMsg(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/analytics/send-offer`, {
        email: selectedEmail,
        couponCode: offerCouponCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOfferSuccessMsg(`Gutschein ${offerCouponCode} erfolgreich an ${selectedEmail} gesendet!`);
      
      setSentOfferEmails(prev => {
        const next = new Set(prev);
        next.add(selectedEmail);
        return next;
      });

      setTimeout(() => {
        setSelectedEmail(null);
        setOfferSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      console.error('[Send offer error]:', err);
      setOfferErrorMsg(err.response?.data?.message || 'Fehler beim Senden des Angebots.');
    } finally {
      setSendingOffer(false);
    }
  };

  const handleDeleteAbandoned = async (email: string) => {
    if (!window.confirm(`Möchten Sie diesen abgebrochenen Warenkorb (${email}) wirklich löschen?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/analytics/abandoned/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh the checkouts list
      fetchAbandonedCheckouts();
    } catch (err: any) {
      console.error('[Delete abandoned checkout error]:', err);
      alert(err.response?.data?.message || 'Fehler beim Löschen des Eintrags.');
    }
  };

  const getDeviceIcon = (device: string | null) => {
    const d = device?.toLowerCase();
    if (d === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (d === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };
  const [campaignImageUrl, setCampaignImageUrl] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Segmentation state
  const [stats, setStats] = React.useState<any>({ total: 0, customers: 0, businesses: 0, sectors: [] });
  const [template, setTemplate] = React.useState<'STANDARD' | 'IMAGE_ONLY' | 'PRODUCTS_ONLY' | 'TEXT_ONLY'>('STANDARD');
  const [activeTypeTab, setActiveTypeTab] = React.useState<'ALL' | 'CUSTOMER' | 'BUSINESS'>('ALL');
  const [activeSectorFilter, setActiveSectorFilter] = React.useState('ALL');
  const [targetType, setTargetType] = React.useState('ALL');
  const [targetSector, setTargetSector] = React.useState('ALL');

  // Edit subscriber state
  const [editSub, setEditSub] = React.useState<any>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  // Weekly Settings state
  const [weeklyEnabled, setWeeklyEnabled] = React.useState(true);
  const [weeklyCategoryId, setWeeklyCategoryId] = React.useState('all');
  const [settingsLoading, setSettingsLoading] = React.useState(false);
  const [settingsSaving, setSettingsSaving] = React.useState(false);

  // Import subscriber state
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState('');
  const [importDefaults, setImportDefaults] = React.useState({
    locale: 'de',
    subscriber_type: 'CUSTOMER' as 'CUSTOMER' | 'BUSINESS',
    business_sector: 'perfume_shop',
    business_name: '',
    custom_notes: ''
  });
  const [importing, setImporting] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [importMode, setImportMode] = React.useState<'upload' | 'paste'>('upload');

  // Import parsing logic
  const getParsedSubscribers = () => {
    const text = importText.trim();
    if (!text) return [];
    
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const firstLine = lines[0].toLowerCase();
    const hasComma = firstLine.includes(',') || firstLine.includes(';');
    const isCSV = hasComma && (firstLine.includes('email') || firstLine.includes('mail') || firstLine.includes('@'));

    if (isCSV) {
      const separator = firstLine.includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
      
      const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
      const localeIdx = headers.findIndex(h => h.includes('locale') || h.includes('sprache') || h.includes('lang'));
      const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('typ'));
      const sectorIdx = headers.findIndex(h => h.includes('sector') || h.includes('branche') || h.includes('bereich'));
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('firma') || h.includes('business'));
      const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('notiz') || h.includes('custom'));

      if (emailIdx !== -1) {
        const results: any[] = [];
        const seen = new Set<string>();

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(separator).map(p => p.trim());
          if (parts.length <= emailIdx) continue;
          
          const email = parts[emailIdx].toLowerCase();
          if (!email.includes('@')) continue;
          if (seen.has(email)) continue;
          seen.add(email);

          const subLocale = localeIdx !== -1 && parts[localeIdx] ? parts[localeIdx].toLowerCase() : importDefaults.locale;
          const typeStr = typeIdx !== -1 && parts[typeIdx] ? parts[typeIdx].toUpperCase() : '';
          const subscriber_type = (typeStr.includes('BUSINESS') || typeStr.includes('B2B') || typeStr.includes('FIRMA')) 
            ? 'BUSINESS' 
            : (typeStr.includes('CUSTOMER') || typeStr.includes('PRIVAT') || typeStr.includes('B2C'))
              ? 'CUSTOMER'
              : importDefaults.subscriber_type;
          
          const business_sector = sectorIdx !== -1 && parts[sectorIdx] ? parts[sectorIdx] : importDefaults.business_sector;
          const business_name = nameIdx !== -1 && parts[nameIdx] ? parts[nameIdx] : (subscriber_type === 'BUSINESS' ? importDefaults.business_name : '');
          const custom_notes = notesIdx !== -1 && parts[notesIdx] ? parts[notesIdx] : importDefaults.custom_notes;

          results.push({
            email,
            locale: ['de', 'en', 'ar', 'fr', 'nl'].includes(subLocale) ? subLocale : importDefaults.locale,
            subscriber_type,
            business_sector: subscriber_type === 'BUSINESS' ? business_sector : null,
            business_name: subscriber_type === 'BUSINESS' ? (business_name || null) : null,
            custom_notes: custom_notes || null
          });
        }
        return results;
      }
    }

    // Fallback: regex search
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = Array.from(new Set(text.match(regex) || []));
    return matches.map(email => ({
      email: email.toLowerCase(),
      locale: importDefaults.locale,
      subscriber_type: importDefaults.subscriber_type,
      business_sector: importDefaults.subscriber_type === 'BUSINESS' ? importDefaults.business_sector : null,
      business_name: importDefaults.subscriber_type === 'BUSINESS' && importDefaults.business_name ? importDefaults.business_name : null,
      custom_notes: importDefaults.custom_notes ? importDefaults.custom_notes : null
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = async () => {
    const parsed = getParsedSubscribers();
    if (parsed.length === 0) {
      alert('Keine gültigen E-Mails zum Importieren gefunden / No valid emails found to import.');
      return;
    }
    setImporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/newsletter/import`, { subscribers: parsed }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Import abgeschlossen! Processed: ${res.data.totalProcessed}, Imported: ${res.data.importedCount}`);
      setIsImportOpen(false);
      setImportText('');
      fetchSubscribers(activeTypeTab, activeSectorFilter);
      fetchStats();
    } catch (e: any) {
      alert('Fehler beim Importieren: ' + (e.response?.data?.message || e.message));
    } finally {
      setImporting(false);
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(15);

  // Campaign history states
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = React.useState(false);
  const [campaignTypeFilter, setCampaignTypeFilter] = React.useState<'ALL' | 'WEEKLY' | 'MANUAL'>('ALL');
  const [selectedCampaign, setSelectedCampaign] = React.useState<any>(null);
  const [campaignRecipients, setCampaignRecipients] = React.useState<any[]>([]);
  const [recipientsLoading, setRecipientsLoading] = React.useState(false);
  const [recipientsError, setRecipientsError] = React.useState('');
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [detailsSearch, setDetailsSearch] = React.useState('');
  const [detailsTab, setDetailsTab] = React.useState<'ALL' | 'OPENED' | 'UNSUBSCRIBED' | 'IGNORED'>('ALL');

  const openCampaignDetails = async (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsDetailsOpen(true);
    setRecipientsLoading(true);
    setRecipientsError('');
    setCampaignRecipients([]);
    setDetailsSearch('');
    setDetailsTab('ALL');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/newsletter/campaigns/${campaign.id}/recipients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaignRecipients(res.data || []);
    } catch (e) {
      console.error('Failed to fetch campaign recipients:', e);
      setRecipientsError('Failed to load campaign recipients.');
    } finally {
      setRecipientsLoading(false);
    }
  };

  const filteredRecipients = React.useMemo(() => {
    return campaignRecipients.filter(rec => {
      const matchesSearch = rec.email.toLowerCase().includes(detailsSearch.toLowerCase());
      if (detailsTab === 'ALL') return matchesSearch;
      if (detailsTab === 'OPENED') return matchesSearch && rec.status === 'OPENED';
      if (detailsTab === 'UNSUBSCRIBED') return matchesSearch && rec.status === 'UNSUBSCRIBED';
      if (detailsTab === 'IGNORED') return matchesSearch && rec.status === 'SENT';
      return false;
    });
  }, [campaignRecipients, detailsSearch, detailsTab]);

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/newsletter/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data || []);
    } catch (e) {
      console.error('Failed to fetch campaigns:', e);
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Product selection state
  const [allProducts, setAllProducts] = React.useState<any[]>([]);
  const [productSearch, setProductSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedProductIds, setSelectedProductIds] = React.useState<string[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<any[]>([]);

  const SECTOR_LABELS: Record<string, string> = {
    perfume_shop: '🌸 Parfüm',
    mobile_shop: '📱 Handy',
    online_store: '🛒 Online',
    restaurant: '☕ Restaurant',
    hotel: '🏨 Hotel',
    retail: '🏪 Handel',
    kiosk: '🗞️ Kiosk',
    other: '✏️ Sonstiges',
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/products?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.products || res.data || [];
      setAllProducts(data);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data || []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/newsletter/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 8 ? [...prev, id] : prev
    );
  };

  // Filtered products list
  const filteredProducts = React.useMemo(() => {
    return allProducts.filter(p => {
      const name = (typeof p.translations === 'object'
        ? (p.translations?.de || p.translations?.en || Object.values(p.translations || {})[0])
        : p.name) || '';
      const matchSearch = !productSearch || name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase());
      const pCatId = p.category_id || p.category?.id;
      const matchCat = !selectedCategory || pCatId === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [allProducts, productSearch, selectedCategory]);

  const fetchSubscribers = async (type?: string, sector?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (type && type !== 'ALL') params.append('type', type);
      if (sector && sector !== 'ALL') params.append('sector', sector);
      const res = await axios.get(`${API_URL}/newsletter/subscribers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscribers(res.data);
    } catch (e) {
      console.error("Failed to fetch subscribers:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySettings = async () => {
    setSettingsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/newsletter/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklyEnabled(res.data.enabled);
      setWeeklyCategoryId(res.data.category_id || 'all');
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/newsletter/settings`, {
        enabled: weeklyEnabled,
        category_id: weeklyCategoryId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Einstellungen gespeichert! / Settings saved successfully!');
    } catch (e) {
      alert('Fehler beim Speichern.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleUpdateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSub) return;
    setEditSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/newsletter/subscribers/${editSub.id}`, {
        subscriber_type: editSub.subscriber_type,
        business_sector: editSub.business_sector,
        business_name: editSub.business_name,
        custom_notes: editSub.custom_notes,
        locale: editSub.locale
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubscribers(activeTypeTab, activeSectorFilter);
      fetchStats();
      setIsEditOpen(false);
      setEditSub(null);
    } catch (e) {
      alert('Fehler beim Aktualisieren.');
    } finally {
      setEditSubmitting(false);
    }
  };

  React.useEffect(() => {
    fetchSubscribers();
    fetchProducts();
    fetchCategories();
    fetchStats();
    fetchWeeklySettings();
    fetchCampaigns();
    fetchAbandonedCheckouts();
  }, []);

  const handleTypeTabChange = (tab: 'ALL' | 'CUSTOMER' | 'BUSINESS') => {
    setActiveTypeTab(tab);
    setActiveSectorFilter('ALL');
    fetchSubscribers(tab, 'ALL');
  };

  const handleSectorFilterChange = (sector: string) => {
    setActiveSectorFilter(sector);
    fetchSubscribers(activeTypeTab, sector);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Möchten Sie diesen Abonnenten wirklich löschen?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/newsletter/subscribers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubscribers(activeTypeTab, activeSectorFilter);
      fetchStats();
      alert("Abonnent erfolgreich gelöscht!");
    } catch (e) {
      alert("Fehler beim Löschen.");
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) { alert("Betreff ist erforderlich!"); return; }
    const segmentLabel = targetType !== 'ALL' ? ` (${targetType}${targetSector !== 'ALL' ? ' / ' + SECTOR_LABELS[targetSector] : ''})` : ' (Alle)';
    if (!window.confirm(`Kampagne${segmentLabel} senden?`)) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/newsletter/send-campaign`, {
        subject,
        customMessage: template !== 'IMAGE_ONLY' && template !== 'PRODUCTS_ONLY' ? customMessage : undefined,
        productIds: (template !== 'IMAGE_ONLY' && template !== 'TEXT_ONLY' && selectedProductIds.length > 0) ? selectedProductIds : undefined,
        target_type: targetType !== 'ALL' ? targetType : undefined,
        target_sector: targetSector !== 'ALL' ? targetSector : undefined,
        imageUrl: (template !== 'PRODUCTS_ONLY' && template !== 'TEXT_ONLY') ? (campaignImageUrl || undefined) : undefined,
        template,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data?.message || "Kampagne erfolgreich gestartet!");
      setCustomMessage('');
      setCampaignImageUrl('');
      setSelectedProductIds([]);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || "Fehler beim Senden der Kampagne.");
    } finally {
      setSending(false);
    }
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTypeTab, activeSectorFilter]);

  // Paginated list calculation
  const paginatedSubscribers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSubscribers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubscribers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };


  return (

    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Gesamt</p>
            <h3 className="text-3xl font-black text-stone-900 mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Users className="w-6 h-6" /></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">👤 Privatkunden</p>
            <h3 className="text-3xl font-black text-stone-900 mt-1">{stats.customers}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Globe className="w-6 h-6" /></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">🏢 Geschäftskunden</p>
            <h3 className="text-3xl font-black text-stone-900 mt-1">{stats.businesses}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Mail className="w-6 h-6" /></div>
        </div>
        {/* Sector breakdown mini */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Branchen</p>
          <div className="space-y-1">
            {(stats.sectors || []).slice(0, 4).map((s: any) => (
              <div key={s.sector || 'null'} className="flex justify-between items-center">
                <span className="text-[10px] text-stone-500">{SECTOR_LABELS[s.sector] || s.sector || '—'}</span>
                <span className="text-[10px] font-bold text-stone-700">{s.count}</span>
              </div>
            ))}
            {(stats.sectors || []).length === 0 && <p className="text-[10px] text-stone-300">—</p>}
          </div>
        </div>
      </div>

      {/* Segment Type Tabs for subscriber list */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'CUSTOMER', 'BUSINESS'] as const).map(tab => (
          <button key={tab} onClick={() => handleTypeTabChange(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
              activeTypeTab === tab
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
            }`}>
            {tab === 'ALL' ? '🌐 Alle' : tab === 'CUSTOMER' ? '👤 Privat' : '🏢 Business'}
          </button>
        ))}
        {activeTypeTab === 'BUSINESS' && Object.entries(SECTOR_LABELS).map(([val, lbl]) => (
          <button key={val} onClick={() => handleSectorFilterChange(activeSectorFilter === val ? 'ALL' : val)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
              activeSectorFilter === val
                ? 'bg-[#d40026] text-white border-[#d40026]'
                : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'
            }`}>
            {lbl}
          </button>
        ))}
      </div>


      <div className="bg-white rounded-xl border border-stone-100 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif">Kampagne starten / Send Campaign</h2>
            <p className="text-xs text-stone-400 mt-1">
              {template === 'IMAGE_ONLY' ? '👉 Sende ein reines Bild-Flyer ohne Text oder Produkte.' :
               template === 'PRODUCTS_ONLY' ? '👉 Sende eine Liste von Produkten ohne Kopfbild oder Text.' :
               template === 'TEXT_ONLY' ? '👉 Sende nur Text mit einem Link zum Online-Shop.' :
               selectedProductIds.length > 0
                ? `✅ ${selectedProductIds.length} Produkt(e) ausgewählt / ${selectedProductIds.length} product(s) selected`
                : 'Keine Auswahl → es werden automatisch die neuesten 4 Produkte verwendet.'}
            </p>
          </div>
          <form onSubmit={handleSendCampaign} className="space-y-5">
            {/* Template Selector */}
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                🎨 E-Mail Template / القالب البريدي
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([
                  { val: 'STANDARD', label: 'Standard / الافتراضي', desc: 'Text + Image + Products' },
                  { val: 'IMAGE_ONLY', label: 'Bild / صورة فقط', desc: 'Full Flyer Image only' },
                  { val: 'PRODUCTS_ONLY', label: 'Produkte / منتجات فقط', desc: 'Product grid only' },
                  { val: 'TEXT_ONLY', label: 'Text / نص فقط', desc: 'Message text with CTA' }
                ] as const).map(t => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTemplate(t.val)}
                    className={`p-3 rounded-lg border text-left transition ${
                      template === t.val 
                        ? 'border-[#d40026] bg-rose-50/50 ring-1 ring-[#d40026]' 
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    <p className="text-xs font-bold text-stone-900">{t.label}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">E-Mail Betreff / Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#d40026]"
                required
              />
            </div>

            {template !== 'IMAGE_ONLY' && template !== 'PRODUCTS_ONLY' && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nachricht / Message (Optional)</label>
                <textarea
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#d40026] placeholder-stone-400"
                  placeholder="Persönliche Nachricht am Anfang der E-Mail..."
                />
              </div>
            )}

            {template !== 'PRODUCTS_ONLY' && template !== 'TEXT_ONLY' && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Kampagnen-Bild URL / Campaign Image URL {template === 'IMAGE_ONLY' ? '(Erforderlich / Required)' : '(Optional)'}
                </label>
                <input
                  type="url"
                  value={campaignImageUrl}
                  onChange={e => setCampaignImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-[#d40026] placeholder-stone-400"
                  required={template === 'IMAGE_ONLY'}
                />
                {template === 'IMAGE_ONLY' && !campaignImageUrl && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">❌ Bitte gib eine Bild-URL für dieses Bild-Template an.</p>
                )}
              </div>
            )}

            {/* Campaign Targeting */}
            <div className="border border-stone-200 rounded-xl p-4 space-y-3 bg-stone-50">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">🎯 Zielgruppe / Target Segment</label>
              <div className="flex gap-2 flex-wrap">
                {(['ALL', 'CUSTOMER', 'BUSINESS'] as const).map(t => (
                  <button key={t} type="button" onClick={() => { setTargetType(t); if (t !== 'BUSINESS') setTargetSector('ALL'); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                      targetType === t ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                    }`}>
                    {t === 'ALL' ? '🌐 Alle' : t === 'CUSTOMER' ? '👤 Nur Privat' : '🏢 Nur Business'}
                  </button>
                ))}
              </div>
              {targetType === 'BUSINESS' && (
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setTargetSector('ALL')}
                    className={`px-2 py-1 rounded text-[9px] font-bold border transition ${targetSector === 'ALL' ? 'bg-[#d40026] text-white border-[#d40026]' : 'bg-white text-stone-400 border-stone-200'}`}>
                    Alle Branchen
                  </button>
                  {Object.entries(SECTOR_LABELS).map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => setTargetSector(val)}
                      className={`px-2 py-1 rounded text-[9px] font-bold border transition ${targetSector === val ? 'bg-[#d40026] text-white border-[#d40026]' : 'bg-white text-stone-400 border-stone-200'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-stone-400">
                {targetType === 'ALL' ? '→ Alle Abonnenten erhalten diese Kampagne' :
                 targetType === 'CUSTOMER' ? '→ Nur Privatkunden erhalten diese Kampagne' :
                 targetSector === 'ALL' ? '→ Alle Geschäftskunden erhalten diese Kampagne' :
                 `→ Nur Geschäftskunden im Bereich "${SECTOR_LABELS[targetSector] || targetSector}" erhalten diese Kampagne`}
              </p>
            </div>

            {/* Product Picker */}
            {template !== 'IMAGE_ONLY' && template !== 'TEXT_ONLY' && (
              <div className="border border-stone-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Produkte auswählen / Select Products
                  </label>
                  {selectedProductIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedProductIds([])}
                      className="text-[10px] text-rose-500 font-bold hover:underline">
                      Auswahl löschen / Clear
                    </button>
                  )}
                </div>

              {/* Filters */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Produkt suchen... / Search..."
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] bg-white"
                >
                  <option value="">Alle Kategorien / All</option>
                  {categories.map(cat => {
                    const catName = cat.name?.de || cat.name?.en || 'Category';
                    return (
                      <option key={cat.id} value={cat.id}>{catName}</option>
                    );
                  })}
                </select>
              </div>

              {/* Product Grid */}
              {productsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-stone-300 border-t-[#d40026] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                  {filteredProducts.slice(0, 40).map(p => {
                    const name = (typeof p.translations === 'object'
                      ? (p.translations?.de || p.translations?.en || Object.values(p.translations || {})[0] as string)
                      : p.name) || 'Product';
                    const isSelected = selectedProductIds.includes(p.id);
                    const imgUrl = resolveImageUrl(p.image_url) || null;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className={`relative flex flex-col items-center p-2 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-[#d40026] bg-rose-50'
                            : 'border-stone-100 hover:border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-[#d40026] rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                            ✓
                          </span>
                        )}
                        {imgUrl ? (
                          <img src={imgUrl} alt={name as string} className="w-16 h-16 object-contain rounded bg-white border border-stone-100 mb-1 p-0.5" />
                        ) : (
                          <div className="w-16 h-16 bg-stone-100 rounded mb-1 flex items-center justify-center text-stone-300 text-lg">📦</div>
                        )}
                        <p className="text-[9px] font-semibold text-stone-700 text-center leading-tight line-clamp-2">{name as string}</p>
                        <p className="text-[9px] text-[#d40026] font-bold mt-0.5 flex items-center justify-center gap-1">
                          {targetType === 'BUSINESS' ? (
                            <>
                              <span>€{Number(p.b2b_price || 0).toFixed(2)}</span>
                              <span className="text-[7px] bg-rose-100 text-rose-600 px-1 rounded font-black uppercase">B2B</span>
                            </>
                          ) : (
                            <span>€{Number(p.retail_price || p.sales_price_with_tax || 0).toFixed(2)}</span>
                          )}
                        </p>
                      </button>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <p className="col-span-4 text-center text-xs text-stone-400 py-4">Keine Produkte gefunden / No products found</p>
                  )}
                </div>
              )}
              <p className="text-[10px] text-stone-400">Max. 8 Produkte wählbar. Keine Auswahl = neueste 4 automatisch. / Max 8. No selection = latest 4 auto.</p>
            </div>
            )}

            <button
              type="submit"
              disabled={sending || subscribers.length === 0}
              className="w-full bg-stone-900 text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Senden... / Sending...
                </>
              ) : (
                `Kampagne absenden (${subscribers.length} Abonnenten) / Send Campaign`
              )}
            </button>
          </form>
        </div>

        {/* Campaign History Card */}
        {campaigns.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-100 p-6 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#d40026]" />
                  Kampagnen-Verlauf / Campaign History
                </h2>
                <p className="text-xs text-stone-400 mt-1">Verfolgen Sie die Öffnungsraten gesendeter E-Mails. / Track newsletter open rates.</p>
              </div>

              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setCampaignTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                    campaignTypeFilter === 'ALL' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Alle ({campaigns.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignTypeFilter('WEEKLY')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                    campaignTypeFilter === 'WEEKLY' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  ⚡ Wöchentlich ({campaigns.filter(c => c.template === 'WEEKLY_AUTO' || c.subject?.includes('Wöchentliche') || c.subject?.includes('wöchentliche')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignTypeFilter('MANUAL')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                    campaignTypeFilter === 'MANUAL' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  ✉️ Manuell ({campaigns.filter(c => !(c.template === 'WEEKLY_AUTO' || c.subject?.includes('Wöchentliche') || c.subject?.includes('wöchentliche'))).length})
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3">Typ / Type & Betreff / Subject</th>
                    <th className="pb-3">Datum / Date</th>
                    <th className="pb-3">Gesendet an / Sent To</th>
                    <th className="pb-3">Geöffnet / Opened</th>
                    <th className="pb-3">Abbestellt / Unsubscribed</th>
                    <th className="pb-3 text-right">Öffnungsrate / Open Rate</th>
                    <th className="pb-3 text-right">Abbestellquote / Unsubscribe Rate</th>
                    <th className="pb-3 text-right">Aktion / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 text-xs text-stone-600">
                  {campaigns
                    .filter(camp => {
                      const isWeekly = camp.template === 'WEEKLY_AUTO' || camp.subject?.includes('Wöchentliche') || camp.subject?.includes('wöchentliche');
                      if (campaignTypeFilter === 'WEEKLY') return isWeekly;
                      if (campaignTypeFilter === 'MANUAL') return !isWeekly;
                      return true;
                    })
                    .map(camp => {
                    const isWeekly = camp.template === 'WEEKLY_AUTO' || camp.subject?.includes('Wöchentliche') || camp.subject?.includes('wöchentliche');
                    const rate = camp.total_sent > 0 ? (camp.opens / camp.total_sent) * 100 : 0;
                    const unsubRate = camp.total_sent > 0 ? ((camp.unsubscribes || 0) / camp.total_sent) * 100 : 0;
                    return (
                      <tr key={camp.id} className="hover:bg-stone-50/50 transition">
                        <td className="py-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isWeekly
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {isWeekly ? "⚡ Wöchentliche Auto-Kampagne" : "✉️ Manuelle Kampagne"}
                            </span>
                          </div>
                          <p className="font-semibold text-stone-850">{camp.subject}</p>
                          {camp.message && <p className="text-[10px] text-stone-400 line-clamp-1 max-w-[300px]">{camp.message}</p>}
                        </td>
                        <td className="py-3 text-stone-400">
                          {new Date(camp.sent_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 font-bold text-stone-700">{camp.total_sent}</td>
                        <td className="py-3 font-bold text-stone-700">{camp.opens}</td>
                        <td className="py-3 font-bold text-stone-700">{camp.unsubscribes || 0}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-stone-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                              <div className="bg-[#d40026] h-1.5 rounded-full" style={{ width: `${Math.min(rate, 100)}%` }} />
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rate > 50 ? 'bg-green-50 text-green-700' : rate > 20 ? 'bg-yellow-50 text-yellow-600' : 'bg-stone-50 text-stone-500'
                            }`}>
                              {rate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            unsubRate > 10 ? 'bg-red-50 text-red-700' : unsubRate > 0 ? 'bg-orange-50 text-orange-600' : 'bg-stone-50 text-stone-500'
                          }`}>
                            {unsubRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openCampaignDetails(camp)}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Campaign Details Modal */}
        {isDetailsOpen && selectedCampaign && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif line-clamp-2">
                    {selectedCampaign.subject}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Gesendet am / Sent on: {new Date(selectedCampaign.sent_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Summary Widgets */}
              <div className="px-6 py-4 bg-stone-50/50 border-b border-stone-100 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white border border-stone-100 rounded-lg shadow-sm">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Geöffnet / Opened</p>
                  <p className="text-2xl font-black text-green-600 mt-1">{selectedCampaign.opens}</p>
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    {selectedCampaign.total_sent > 0 ? ((selectedCampaign.opens / selectedCampaign.total_sent) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-white border border-stone-100 rounded-lg shadow-sm">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Abbestellt / Unsubscribed</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">{selectedCampaign.unsubscribes || 0}</p>
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    {selectedCampaign.total_sent > 0 ? (((selectedCampaign.unsubscribes || 0) / selectedCampaign.total_sent) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-white border border-stone-100 rounded-lg shadow-sm">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Ignoriert / Ignored</p>
                  <p className="text-2xl font-black text-stone-500 mt-1">
                    {selectedCampaign.total_sent - selectedCampaign.opens - (selectedCampaign.unsubscribes || 0)}
                  </p>
                  <p className="text-[9px] text-stone-400 mt-0.5">
                    {selectedCampaign.total_sent > 0 ? (((selectedCampaign.total_sent - selectedCampaign.opens - (selectedCampaign.unsubscribes || 0)) / selectedCampaign.total_sent) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="p-6 pb-2 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex border-b border-stone-100 w-full sm:w-auto">
                  {(['ALL', 'OPENED', 'UNSUBSCRIBED', 'IGNORED'] as const).map(tab => {
                    const count = tab === 'ALL' ? campaignRecipients.length 
                                : tab === 'OPENED' ? campaignRecipients.filter(r => r.status === 'OPENED').length
                                : tab === 'UNSUBSCRIBED' ? campaignRecipients.filter(r => r.status === 'UNSUBSCRIBED').length
                                : campaignRecipients.filter(r => r.status === 'SENT').length;
                    
                    const labelMap = {
                      ALL: 'Alle / All',
                      OPENED: 'Geöffnet / Opened',
                      UNSUBSCRIBED: 'Abbestellt / Unsubscribed',
                      IGNORED: 'Ignoriert / Ignored'
                    };

                    return (
                      <button
                        key={tab}
                        onClick={() => setDetailsTab(tab)}
                        className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                          detailsTab === tab 
                            ? 'border-[#d40026] text-stone-900' 
                            : 'border-transparent text-stone-400 hover:text-stone-600'
                        }`}
                      >
                        {labelMap[tab]} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Local Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Empfänger suchen... / Search recipient..."
                    value={detailsSearch}
                    onChange={e => setDetailsSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                  />
                </div>
              </div>

              {/* Modal Body / Recipient List */}
              <div className="flex-1 overflow-y-auto p-6 min-h-[250px]">
                {recipientsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900 mb-3" />
                    <span className="text-xs uppercase tracking-widest">Lade Empfänger-Details...</span>
                  </div>
                ) : recipientsError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-rose-500">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">{recipientsError}</span>
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                    <Mail className="w-10 h-10 text-stone-200 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-wider">Keine Empfänger gefunden</span>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase tracking-wider">
                        <th className="pb-2">E-Mail-Adresse</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Aktivität am / Activity Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50 text-stone-600">
                      {filteredRecipients.map(rec => (
                        <tr key={rec.id} className="hover:bg-stone-50/50 transition">
                          <td className="py-2.5 font-medium">{rec.email}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              rec.status === 'OPENED' ? 'bg-green-50 text-green-700' :
                              rec.status === 'UNSUBSCRIBED' ? 'bg-rose-50 text-rose-700' :
                              'bg-stone-100 text-stone-500'
                            }`}>
                              {rec.status === 'OPENED' ? 'Geöffnet / Opened' :
                               rec.status === 'UNSUBSCRIBED' ? 'Abbestellt' :
                               'Ignoriert / Ignored'}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-stone-400">
                            {rec.status === 'OPENED' && rec.opened_at ? (
                              new Date(rec.opened_at).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })
                            ) : rec.status === 'UNSUBSCRIBED' && rec.unsubscribed_at ? (
                              new Date(rec.unsubscribed_at).toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}


        {/* ABANDONED CHECKOUTS RECOVERY SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-stone-500" />
              Mögliche Kaufabbrüche / Warenkorb-Abbrecher (Abandoned Checkouts)
            </h3>
            <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
              Letzte 30 Tage
            </span>
          </div>

          <div className="overflow-x-auto">
            {loadingAbandoned ? (
              <p className="text-stone-400 text-xs text-center py-8">Lade Kaufabbrüche...</p>
            ) : abandonedCheckouts.length === 0 ? (
              <p className="text-stone-400 text-xs text-center py-8">Keine unvollständigen Checkouts mit erfasster E-Mail gefunden.</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-stone-400 border-b border-stone-100">
                    <th className="pb-3 font-semibold">E-Mail-Adresse</th>
                    <th className="pb-3 font-semibold">Besuchte Checkout-URL</th>
                    <th className="pb-3 font-semibold">Device & IP</th>
                    <th className="pb-3 font-semibold">Letzter Besuch</th>
                    <th className="pb-3 font-semibold text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {abandonedCheckouts.map((checkout, idx) => {
                    const date = new Date(checkout.created_at).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const alreadySent = sentOfferEmails.has(checkout.email);

                    return (
                      <tr key={checkout.email || idx} className="hover:bg-stone-50/50">
                        <td className="py-3 font-semibold text-stone-900">
                          {checkout.email}
                        </td>
                        <td className="py-3 text-stone-500 max-w-[180px] truncate" title={checkout.url}>
                          {checkout.url}
                        </td>
                        <td className="py-3 text-stone-600">
                          <div className="flex items-center gap-1.5">
                            {getDeviceIcon(checkout.device)}
                            <span>{checkout.os || 'Unknown'} · IP: {checkout.ip || 'Local'}</span>
                          </div>
                        </td>
                        <td className="py-3 text-stone-500">
                          {date}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (alreadySent) return;
                                setSelectedEmail(checkout.email);
                                setOfferSuccessMsg(null);
                                setOfferErrorMsg(null);
                              }}
                              disabled={alreadySent}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                alreadySent
                                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700'
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              {alreadySent ? 'Angebot Gesendet' : 'Rabatt Senden'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAbandoned(checkout.email)}
                              className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-red-600 transition"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Subscribers List */}
        <div className="bg-white rounded-xl border border-stone-100 p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-serif">Abonnenten-Liste / Subscribers</h2>
              <p className="text-xs text-stone-400 mt-1">Verwalten Sie Ihre E-Mail-Marketing-Kontakte.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Importieren / Import
              </button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="E-Mail suchen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mb-4" />
                <span className="text-xs uppercase tracking-widest">Lade Abonnenten...</span>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <Mail className="w-12 h-12 text-stone-200 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">Keine Abonnenten gefunden</p>
              </div>
            ) : (
              <>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-3">E-Mail</th>
                      <th className="pb-3">Typ</th>
                      <th className="pb-3">Branche</th>
                      <th className="pb-3">Sprache</th>
                      <th className="pb-3">Datum</th>
                      <th className="pb-3 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 text-xs text-stone-600">
                    {paginatedSubscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-stone-50/50 transition">
                        <td className="py-3">
                          <p className="font-medium text-stone-800">{sub.email}</p>
                          {sub.business_name && <p className="text-[10px] text-stone-400">{sub.business_name}</p>}
                          {sub.custom_notes && <p className="text-[10px] text-stone-300 italic truncate max-w-[200px]">{sub.custom_notes}</p>}
                        </td>
                        <td className="py-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sub.subscriber_type === 'BUSINESS'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-stone-100 text-stone-500'
                          }`}>
                            {sub.subscriber_type === 'BUSINESS' ? '🏢 B2B' : '👤 Privat'}
                          </span>
                        </td>
                        <td className="py-3">
                          {sub.business_sector ? (
                            <span className="text-[10px] text-stone-500">{SECTOR_LABELS[sub.business_sector] || sub.business_sector}</span>
                          ) : <span className="text-stone-200">—</span>}
                        </td>
                        <td className="py-3">
                          <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-stone-500 uppercase">
                            {sub.locale}
                          </span>
                        </td>
                        <td className="py-3 text-stone-400">
                          {new Date(sub.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                        <td className="py-3 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditSub({ ...sub }); setIsEditOpen(true); }}
                            className="p-1.5 text-stone-400 hover:text-stone-900 rounded hover:bg-stone-50 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-stone-100 text-xs">
                    <div className="text-stone-400">
                      Zeige {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSubscribers.length)} bis {Math.min(currentPage * itemsPerPage, filteredSubscribers.length)} von {filteredSubscribers.length} Einträgen / Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredSubscribers.length)} to {Math.min(currentPage * itemsPerPage, filteredSubscribers.length)} of {filteredSubscribers.length} entries
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Rows per page selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 whitespace-nowrap">Pro Seite / Per Page:</span>
                        <select
                          value={itemsPerPage}
                          onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          className="border border-stone-200 rounded px-1.5 py-1 bg-white text-stone-700 text-xs focus:outline-none"
                        >
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className="px-2.5 py-1.5 border border-stone-200 rounded text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-stone-500 transition font-bold cursor-pointer"
                        >
                          &larr;
                        </button>
                        
                        {getPageNumbers().map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`px-3 py-1.5 rounded border transition font-bold cursor-pointer ${
                              currentPage === p
                                ? 'bg-stone-950 text-white border-stone-950'
                                : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-900'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        
                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className="px-2.5 py-1.5 border border-stone-200 rounded text-stone-500 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-stone-500 transition font-bold cursor-pointer"
                        >
                          &rarr;
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Weekly Newsletter Settings */}
        <div className="bg-white rounded-xl border border-stone-100 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-serif">📅 Automatischer wöchentlicher Newsletter / Weekly Scheduler</h2>
            <p className="text-xs text-stone-400 mt-1">
              Konfigurieren Sie den automatischen Versand der wöchentlichen Highlights.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Status / Enabled</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWeeklyEnabled(true)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                    weeklyEnabled
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  Aktiviert / Enabled
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyEnabled(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                    !weeklyEnabled
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  Deaktiviert / Disabled
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Kategorie für wöchentlichen Newsletter / Weekly Category</label>
              <select
                value={weeklyCategoryId}
                onChange={e => setWeeklyCategoryId(e.target.value)}
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
              >
                <option value="all">Alle Kategorien (Neueste Produkte) / All Categories</option>
                {categories.map(cat => {
                  const name = (typeof cat.name === 'object'
                    ? (cat.name?.de || cat.name?.en || cat.name?.ar || 'Category')
                    : (cat.name || 'Category'));
                  return <option key={cat.id} value={cat.id}>{name}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={settingsSaving}
              onClick={handleSaveSettings}
              className="bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold px-6 py-2.5 rounded-lg transition flex items-center gap-2"
            >
              {settingsSaving ? 'Speichern... / Saving...' : 'Einstellungen speichern / Save Settings'}
            </button>
          </div>
        </div>

      {/* Edit Subscriber Modal */}
      {isEditOpen && editSub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-stone-100 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-950">Abonnenten bearbeiten / Edit Subscriber</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubscriber} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">E-Mail</label>
                <input
                  type="text"
                  value={editSub.email}
                  disabled
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-500"
                />
              </div>

              {/* Locale */}
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Sprache / Language</label>
                <select
                  value={editSub.locale || 'de'}
                  onChange={e => setEditSub({ ...editSub, locale: e.target.value })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                >
                  <option value="de">Deutsch (DE)</option>
                  <option value="en">English (EN)</option>
                  <option value="ar">العربية (AR)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="nl">Nederlands (NL)</option>
                </select>
              </div>

              {/* Subscriber Type */}
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Abonnenten-Typ / Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSub({ ...editSub, subscriber_type: 'CUSTOMER' })}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      editSub.subscriber_type === 'CUSTOMER'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    👤 Privat / Retail
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSub({ ...editSub, subscriber_type: 'BUSINESS' })}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      editSub.subscriber_type === 'BUSINESS'
                        ? 'bg-[#d40026] text-white border-[#d40026]'
                        : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    🏢 Business / B2B
                  </button>
                </div>
              </div>

              {/* Business details if BUSINESS */}
              {editSub.subscriber_type === 'BUSINESS' && (
                <div className="space-y-3 pt-1 border-t border-stone-100">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Branche / Sector</label>
                    <select
                      value={editSub.business_sector || ''}
                      onChange={e => setEditSub({ ...editSub, business_sector: e.target.value })}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                    >
                      <option value="">Keine Angabe / None</option>
                      {Object.entries(SECTOR_LABELS).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Firmenname / Business Name</label>
                    <input
                      type="text"
                      value={editSub.business_name || ''}
                      onChange={e => setEditSub({ ...editSub, business_name: e.target.value })}
                      placeholder="Firmenname..."
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                    />
                  </div>
                </div>
              )}

              {/* Custom Notes */}
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Notizen / Notes</label>
                <textarea
                  value={editSub.custom_notes || ''}
                  onChange={e => setEditSub({ ...editSub, custom_notes: e.target.value })}
                  rows={2}
                  placeholder="Notizen zum Händler..."
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-50"
                >
                  Abbrechen / Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {editSubmitting ? 'Speichern...' : 'Speichern / Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Subscribers Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-stone-100 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-950 flex items-center gap-2 font-serif text-lg">
                <Upload className="w-5 h-5 text-[#d40026]" />
                Abonnenten importieren / Import Subscribers
              </h3>
              <button onClick={() => { setIsImportOpen(false); setImportText(''); }} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => { setImportMode('upload'); setImportText(''); }}
                className={`flex-1 py-2 font-bold uppercase tracking-wider border-b-2 transition ${
                  importMode === 'upload' ? 'border-stone-900 text-stone-900 font-extrabold' : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                📁 Datei hochladen / Upload File
              </button>
              <button
                type="button"
                onClick={() => { setImportMode('paste'); setImportText(''); }}
                className={`flex-1 py-2 font-bold uppercase tracking-wider border-b-2 transition ${
                  importMode === 'paste' ? 'border-stone-900 text-stone-900 font-extrabold' : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                ✍️ Text einfügen / Paste Text
              </button>
            </div>

            {/* Input area */}
            {importMode === 'upload' ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                  dragActive ? 'border-[#d40026] bg-rose-50/20' : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50/30'
                }`}
                onClick={() => document.getElementById('import-file-input')?.click()}
              >
                <input
                  id="import-file-input"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Upload className="w-8 h-8 text-stone-300" />
                <p className="text-xs font-bold text-stone-700 text-center">
                  Datei auswählen oder hierher ziehen / Click or Drag File
                </p>
                <p className="text-[10px] text-stone-400 text-center">
                  Unterstützt .csv und .txt (E-Mails getrennt durch Komma, Semikolon oder Zeilenumbruch)
                </p>
                {importText && (
                  <div className="mt-2 text-[10px] bg-green-50 text-green-700 px-2.5 py-1 rounded font-bold border border-green-200">
                    ✓ Datei geladen ({importText.length} Zeichen)
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                  E-Mails einfügen / Paste Emails
                </label>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  rows={4}
                  placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] font-mono resize-none"
                />
              </div>
            )}

            {/* Defaults section */}
            <div className="bg-stone-50/70 p-4 rounded-lg space-y-3">
              <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest border-b pb-1.5">
                Standardwerte für Import / Import Defaults
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Language */}
                <div>
                  <label className="block text-[9px] font-bold text-stone-450 uppercase tracking-wider mb-1">Sprache / Language</label>
                  <select
                    value={importDefaults.locale}
                    onChange={e => setImportDefaults({ ...importDefaults, locale: e.target.value })}
                    className="w-full border border-stone-200 bg-white rounded-md px-2 py-1 text-xs text-stone-900 focus:outline-none"
                  >
                    <option value="de">Deutsch (DE)</option>
                    <option value="en">English (EN)</option>
                    <option value="ar">العربية (AR)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="nl">Nederlands (NL)</option>
                  </select>
                </div>

                {/* Subscriber Type */}
                <div>
                  <label className="block text-[9px] font-bold text-stone-450 uppercase tracking-wider mb-1">Abonnenten-Typ / Type</label>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImportDefaults({ ...importDefaults, subscriber_type: 'CUSTOMER' })}
                      className={`py-1 rounded font-bold border transition ${
                        importDefaults.subscriber_type === 'CUSTOMER'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      Privat
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportDefaults({ ...importDefaults, subscriber_type: 'BUSINESS' })}
                      className={`py-1 rounded font-bold border transition ${
                        importDefaults.subscriber_type === 'BUSINESS'
                          ? 'bg-[#d40026] text-white border-[#d40026]'
                          : 'bg-white text-stone-550 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      Business
                    </button>
                  </div>
                </div>
              </div>

              {/* B2B Defaults fields */}
              {importDefaults.subscriber_type === 'BUSINESS' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-450 uppercase tracking-wider mb-1">Branche / Sector</label>
                    <select
                      value={importDefaults.business_sector}
                      onChange={e => setImportDefaults({ ...importDefaults, business_sector: e.target.value })}
                      className="w-full border border-stone-200 bg-white rounded-md px-2 py-1 text-xs text-stone-900 focus:outline-none"
                    >
                      {Object.entries(SECTOR_LABELS).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-450 uppercase tracking-wider mb-1">Firmenname / Company Name</label>
                    <input
                      type="text"
                      placeholder="Firmenname (Optional)..."
                      value={importDefaults.business_name}
                      onChange={e => setImportDefaults({ ...importDefaults, business_name: e.target.value })}
                      className="w-full border border-stone-200 bg-white rounded-md px-2 py-1 text-xs text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[9px] font-bold text-stone-450 uppercase tracking-wider mb-1">Notizen / Custom Notes</label>
                <input
                  type="text"
                  placeholder="Notizen zum Import (Optional)..."
                  value={importDefaults.custom_notes}
                  onChange={e => setImportDefaults({ ...importDefaults, custom_notes: e.target.value })}
                  className="w-full border border-stone-200 bg-white rounded-md px-2 py-1 text-xs text-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Preview segments */}
            {importText && (
              <div className="flex items-center justify-between bg-stone-50 border border-stone-150 px-4 py-2 rounded-lg text-xs">
                <span className="font-bold text-stone-600">Gefundene E-Mails / Found Emails:</span>
                <span className={`px-2 py-0.5 rounded font-black text-xs ${
                  getParsedSubscribers().length > 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {getParsedSubscribers().length}
                </span>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-2 justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => { setIsImportOpen(false); setImportText(''); }}
                className="px-4 py-2 border border-stone-200 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-50"
              >
                Abbrechen / Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing || getParsedSubscribers().length === 0}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {importing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importieren...
                  </>
                ) : (
                  'Importieren / Import'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFER SENDING MODAL */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-stone-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#111625] text-white p-6 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm">Gutschein senden</h4>
                <p className="text-[10px] text-stone-400 mt-0.5">{selectedEmail}</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="text-stone-400 hover:text-white transition p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendOffer} className="p-6 space-y-4">
              {offerSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold">
                  {offerSuccessMsg}
                </div>
              )}
              {offerErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs font-semibold">
                  {offerErrorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Rabatt-Gutscheincode
                </label>
                <input
                  type="text"
                  required
                  value={offerCouponCode}
                  onChange={(e) => setOfferCouponCode(e.target.value.toUpperCase())}
                  placeholder="Z.B. WELCOME10"
                  className="w-full px-4 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 text-xs font-bold bg-stone-50/50 uppercase tracking-widest"
                />
              </div>

              {/* Suggestions */}
              <div className="flex gap-2">
                {['WELCOME10', 'SPECIAL15', 'BARISTORE5'].map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setOfferCouponCode(code)}
                    className="px-2.5 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 transition text-[10px] font-bold"
                  >
                    {code}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-50 rounded-lg text-xs font-bold transition border border-stone-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={sendingOffer || !!offerSuccessMsg}
                  className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-lg text-xs font-bold transition border border-stone-900 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {sendingOffer ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {sendingOffer ? 'Wird gesendet...' : 'Gutschein per Mail senden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Reviews Management Section ─────────────────────────────────────────────
function ReviewsSection() {
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // Pagination & Filtering & Sorting States
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);
  const [starFilter, setStarFilter] = React.useState<number | null>(null);
  const [verifiedFilter, setVerifiedFilter] = React.useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [productFilter, setProductFilter] = React.useState<string>('ALL');
  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = React.useState(false);

  // Manual Review Form State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [modalTab, setModalTab] = React.useState<'single' | 'bulk'>('bulk'); // Default to bulk as they requested it
  const [products, setProducts] = React.useState<any[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [productSearch, setProductSearch] = React.useState('');

  // Single review form states
  const [selectedProductId, setSelectedProductId] = React.useState('');
  const [authorName, setAuthorName] = React.useState('');
  const [authorEmail, setAuthorEmail] = React.useState('');
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [verifiedPurchase, setVerifiedPurchase] = React.useState(true);
  const [createdAt, setCreatedAt] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  // Bulk review form states
  const [bulkText, setBulkText] = React.useState('');
  const [bulkDefaultRating, setBulkDefaultRating] = React.useState(5);
  const [bulkVerifiedPurchase, setBulkVerifiedPurchase] = React.useState(true);
  const [bulkCreatedAt, setBulkCreatedAt] = React.useState('');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/products/all`);
      setProducts(res.data || []);
    } catch (e) {
      console.error('Failed to fetch products', e);
    } finally {
      setProductsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المراجعة؟')) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert('فشل الحذف، حاول مرة أخرى.');
    } finally {
      setDeleting(null);
    }
  };

  const getProductName = (product: any) => {
    if (!product) return 'Unknown Product';
    // Product name is stored in 'translations' JSON field: { de: '', en: '', ar: '' }
    const trans = product.translations;
    if (!trans) return product.sku || 'Unknown Product';
    if (typeof trans === 'string') {
      try {
        const t = JSON.parse(trans);
        return t.de || t.en || t.ar || product.sku || 'Unknown';
      } catch { return product.sku || 'Unknown'; }
    }
    if (typeof trans === 'object') {
      return trans.de || trans.en || trans.ar || product.sku || 'Unknown';
    }
    return product.sku || 'Unknown Product';
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'}`} />
    ));

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '–';

  // Reset pagination on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, starFilter, verifiedFilter, productFilter, sortOrder, pageSize]);

  // Unique reviewed products for filter dropdown
  const uniqueReviewedProducts = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; sku?: string }>();
    reviews.forEach(r => {
      const pid = r.product?.id || r.product_id;
      if (pid && !map.has(pid)) {
        map.set(pid, {
          id: pid,
          name: getProductName(r.product),
          sku: r.product?.sku
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [reviews]);

  // Filtered and sorted reviews
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = reviews.filter(r => {
      if (q) {
        const authorMatch = (r.author_name || '').toLowerCase().includes(q);
        const emailMatch = (r.author_email || '').toLowerCase().includes(q);
        const titleMatch = (r.title || '').toLowerCase().includes(q);
        const bodyMatch = (r.body || '').toLowerCase().includes(q);
        const skuMatch = (r.product?.sku || '').toLowerCase().includes(q);
        const prodNameMatch = getProductName(r.product).toLowerCase().includes(q);
        if (!authorMatch && !emailMatch && !titleMatch && !bodyMatch && !skuMatch && !prodNameMatch) {
          return false;
        }
      }

      if (starFilter !== null && r.rating !== starFilter) return false;
      if (verifiedFilter === 'VERIFIED' && !r.verified_purchase) return false;
      if (verifiedFilter === 'UNVERIFIED' && r.verified_purchase) return false;

      const pid = r.product?.id || r.product_id;
      if (productFilter !== 'ALL' && pid !== productFilter) return false;

      return true;
    });

    list.sort((a, b) => {
      if (sortOrder === 'highest') {
        return b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOrder === 'lowest') {
        return a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [reviews, search, starFilter, verifiedFilter, productFilter, sortOrder]);

  const totalItems = filtered.length;
  const isAll = pageSize === 0;
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReviews = React.useMemo(() => {
    if (isAll) return filtered;
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize, isAll]);

  const fromIndex = totalItems === 0 ? 0 : isAll ? 1 : (safeCurrentPage - 1) * pageSize + 1;
  const toIndex = isAll ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems);

  const isAllPageSelected = paginatedReviews.length > 0 && paginatedReviews.every(r => selectedIds.has(r.id));

  const toggleSelectAllPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedReviews.forEach(r => next.delete(r.id));
      } else {
        paginatedReviews.forEach(r => next.add(r.id));
      }
      return next;
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${count} مراجعة محددة؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

    setBulkDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    try {
      const token = localStorage.getItem('token');
      try {
        await axios.post(`${API_URL}/reviews/bulk-delete`, { ids: idsToDelete }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        await Promise.all(idsToDelete.map(id =>
          axios.delete(`${API_URL}/reviews/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        ));
      }
      setReviews(prev => prev.filter(r => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      alert(`تم حذف ${count} مراجعة بنجاح!`);
    } catch (e) {
      alert('حدث خطأ أثناء حذف بعض المراجعات.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const filteredProducts = React.useMemo(() => {
    if (!productSearch) return products.slice(0, 100);
    const pq = productSearch.toLowerCase();
    return products.filter(p => {
      const name = getProductName(p).toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      return name.includes(pq) || sku.includes(pq);
    }).slice(0, 100);
  }, [products, productSearch]);

  const resetForm = () => {
    setSelectedProductId('');
    setAuthorName('');
    setAuthorEmail('');
    setRating(5);
    setTitle('');
    setBody('');
    setVerifiedPurchase(true);
    setCreatedAt('');

    // Reset bulk form states
    setBulkText('');
    setBulkDefaultRating(5);
    setBulkVerifiedPurchase(true);
    setBulkCreatedAt('');
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('الرجاء اختيار المنتج أولاً.');
      return;
    }
    if (!authorName.trim()) {
      alert('الرجاء إدخال اسم المراجع.');
      return;
    }
    if (!body.trim()) {
      alert('الرجاء إدخال نص المراجعة.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        product_id: selectedProductId,
        author_name: authorName,
        author_email: authorEmail || null,
        rating,
        title: title || null,
        body,
        verified_purchase: verifiedPurchase,
        created_at: createdAt ? new Date(createdAt).toISOString() : undefined
      };

      const res = await axios.post(`${API_URL}/reviews`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReviews(prev => [res.data.review, ...prev]);
      setIsAddOpen(false);
      resetForm();
      alert('تمت إضافة المراجعة بنجاح!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'فشلت إضافة المراجعة.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBulkReviews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('الرجاء اختيار المنتج أولاً.');
      return;
    }
    if (!bulkText.trim()) {
      alert('الرجاء إدخال نص المراجعات المتعددة.');
      return;
    }

    const lines = bulkText.split('\n');
    const parsedReviews: any[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      let author = 'Anonymous';
      let comment = line;

      // Try to split by colon or dash or space
      const colonIndex = line.indexOf(':');
      const dashIndex = line.indexOf(' - ');

      if (colonIndex !== -1) {
        author = line.substring(0, colonIndex).trim();
        comment = line.substring(colonIndex + 1).trim();
      } else if (dashIndex !== -1) {
        author = line.substring(0, dashIndex).trim();
        comment = line.substring(dashIndex + 3).trim();
      } else {
        const spaceIndex = line.indexOf(' ');
        if (spaceIndex !== -1 && spaceIndex < 25) {
          author = line.substring(0, spaceIndex).trim();
          comment = line.substring(spaceIndex + 1).trim();
        }
      }

      // Clean up leading list symbols (like ., -, *, bullet points) from author name
      author = author.replace(/^[\s.\-*•◦⁃]+/, '').trim();

      if (author && comment) {
        parsedReviews.push({
          author_name: author,
          body: comment,
          rating: bulkDefaultRating,
          verified_purchase: bulkVerifiedPurchase,
          created_at: bulkCreatedAt ? new Date(bulkCreatedAt).toISOString() : undefined
        });
      }
    }

    if (parsedReviews.length === 0) {
      alert('لم نتمكن من تحليل أي مراجعة من النص المدخل. يرجى التأكد من التنسيق: (الاسم: التعليق)');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        product_id: selectedProductId,
        reviews: parsedReviews
      };

      const res = await axios.post(`${API_URL}/reviews/bulk`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReviews(prev => [...res.data.reviews, ...prev]);
      setIsAddOpen(false);
      resetForm();
      alert(`تمت إضافة ${res.data.reviews.length} مراجعات بنجاح!`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'فشلت إضافة المراجعات الجماعية.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAnyFilterActive = search !== '' || starFilter !== null || verifiedFilter !== 'ALL' || productFilter !== 'ALL';

  const resetAllFilters = () => {
    setSearch('');
    setStarFilter(null);
    setVerifiedFilter('ALL');
    setProductFilter('ALL');
    setSortOrder('newest');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-serif">Customer Reviews</h2>
          <p className="text-xs text-stone-500 mt-1">
            إدارة وحذف مراجعات العملاء · {reviews.length} مراجعة إجمالاً {filtered.length !== reviews.length && `(مطابق للفلتر: ${filtered.length})`}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-[#d40026] hover:bg-[#b0001f] text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> إضافة مراجعة
          </button>
          <button 
            onClick={fetchReviews}
            className="flex items-center gap-2 bg-stone-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer shadow-xs"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards (Interactive Quick Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: All Reviews */}
        <button
          type="button"
          onClick={() => {
            setStarFilter(null);
            setVerifiedFilter('ALL');
            setProductFilter('ALL');
          }}
          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
            starFilter === null && verifiedFilter === 'ALL'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-2 ring-stone-900/20'
              : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-850'
          }`}
        >
          <p className="text-2xl font-bold font-mono">{reviews.length}</p>
          <p className={`text-xs font-bold mt-1 ${starFilter === null && verifiedFilter === 'ALL' ? 'text-stone-300' : 'text-stone-500'}`}>
            إجمالي المراجعات (الكل)
          </p>
        </button>

        {/* Card 2: Average Rating */}
        <div className="rounded-xl border p-4 bg-amber-50/80 border-amber-200 text-amber-900">
          <p className="text-2xl font-bold font-mono flex items-center gap-1">
            {avgRating} <Star className="w-5 h-5 fill-amber-400 text-amber-400 inline" />
          </p>
          <p className="text-xs font-bold mt-1 text-amber-700">متوسط التقييم العام</p>
        </div>

        {/* Card 3: 5 Stars Quick Filter */}
        <button
          type="button"
          onClick={() => setStarFilter(prev => prev === 5 ? null : 5)}
          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
            starFilter === 5
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <p className="text-2xl font-bold font-mono">
            {reviews.filter(r => r.rating === 5).length}
          </p>
          <p className={`text-xs font-bold mt-1 flex items-center justify-between ${starFilter === 5 ? 'text-emerald-100' : 'text-emerald-700'}`}>
            <span>تقييم 5 نجوم ★</span>
            {starFilter === 5 && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">مُفعّل</span>}
          </p>
        </button>

        {/* Card 4: Verified Reviews Quick Filter */}
        <button
          type="button"
          onClick={() => setVerifiedFilter(prev => prev === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
            verifiedFilter === 'VERIFIED'
              ? 'bg-blue-700 text-white border-blue-700 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-blue-50/70 hover:bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <p className="text-2xl font-bold font-mono">
            {reviews.filter(r => r.verified_purchase).length}
          </p>
          <p className={`text-xs font-bold mt-1 flex items-center justify-between ${verifiedFilter === 'VERIFIED' ? 'text-blue-100' : 'text-blue-700'}`}>
            <span>مراجعات مُتحقق منها ✓</span>
            {verifiedFilter === 'VERIFIED' && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">مُفعّل</span>}
          </p>
        </button>
      </div>

      {/* Advanced Filter & Search Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-200/80 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم المراجع، البريد، المنتج، أو نص المراجعة..."
              className="w-full pl-9 pr-8 py-2 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-stone-900 transition bg-stone-50/50" 
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Star Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-stone-400 font-medium ml-1">النجوم:</span>
            {[
              { label: 'الكل', value: null },
              { label: '5 ★', value: 5 },
              { label: '4 ★', value: 4 },
              { label: '3 ★', value: 3 },
              { label: '2 ★', value: 2 },
              { label: '1 ★', value: 1 },
            ].map(item => {
              const active = starFilter === item.value;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setStarFilter(item.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Second Row: Verified filter, Product filter, Sorting, Page Size, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Verified Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">التحقق:</span>
              <select
                value={verifiedFilter}
                onChange={e => setVerifiedFilter(e.target.value as any)}
                className="bg-white border border-stone-200 text-stone-800 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer shadow-2xs"
              >
                <option value="ALL">كل المراجعات</option>
                <option value="VERIFIED">مُتحقق منها فقط (Verified)</option>
                <option value="UNVERIFIED">غير مُتحقق منها</option>
              </select>
            </div>

            {/* Product Filter */}
            {uniqueReviewedProducts.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">المنتج:</span>
                <select
                  value={productFilter}
                  onChange={e => setProductFilter(e.target.value)}
                  className="bg-white border border-stone-200 text-stone-800 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer shadow-2xs max-w-[200px] truncate"
                >
                  <option value="ALL">جميع المنتجات ({uniqueReviewedProducts.length})</option>
                  {uniqueReviewedProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 font-medium">الترتيب:</span>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="bg-white border border-stone-200 text-stone-800 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer shadow-2xs"
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="highest">الأعلى تقييماً ★</option>
                <option value="lowest">الأقل تقييماً</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-stone-500 hover:text-stone-900 underline text-xs font-semibold px-1 cursor-pointer"
              >
                إلغاء كل الفلاتر ✕
              </button>
            )}
          </div>

          {/* Page size dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-stone-500 font-medium">عرض بالصفحة:</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="bg-white border border-stone-200 text-stone-800 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={0}>عرض الكل ({filtered.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (When items selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-amber-700" />
            <span className="text-xs font-bold text-amber-950">
              تم تحديد <span className="underline font-mono text-sm">{selectedIds.size}</span> مراجعة
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-amber-800 hover:text-amber-950 underline text-xs font-semibold cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
          <button
            type="button"
            disabled={bulkDeleting}
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-[#d40026] hover:bg-[#b0001f] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {bulkDeleting ? 'جاري الحذف...' : `حذف المراجعات المحددة (${selectedIds.size})`}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xs border border-stone-200/80 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-stone-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-stone-200" />
            <p className="font-semibold text-stone-700">لا توجد مراجعات مطابقة</p>
            <p className="text-xs mt-1 text-stone-400">
              {isAnyFilterActive ? 'جرّب تعديل خيارات الفلترة أو إلغائها' : 'ستظهر المراجعات هنا عند إضافتها من العملاء'}
            </p>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-black transition cursor-pointer"
              >
                إلغاء الفلاتر وعرض الكل
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-500 text-[11px] uppercase tracking-wider border-b border-stone-200/70 select-none">
                  {/* Bulk Select Checkbox */}
                  <th className="px-4 py-3.5 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={toggleSelectAllPage}
                      className="w-4 h-4 rounded text-stone-900 focus:ring-stone-500 border-stone-300 cursor-pointer align-middle"
                      title="تحديد كل المعروض بالصفحة"
                    />
                  </th>
                  <th className="px-4 py-3.5 font-bold">المراجع</th>
                  <th className="px-4 py-3.5 font-bold">المنتج</th>
                  <th className="px-4 py-3.5 font-bold">التقييم</th>
                  <th className="px-4 py-3.5 font-bold hidden md:table-cell">العنوان والنص</th>
                  <th className="px-4 py-3.5 font-bold text-center">التحقق</th>
                  <th className="px-4 py-3.5 font-bold">التاريخ</th>
                  <th className="px-4 py-3.5 font-bold text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedReviews.map((review: any) => {
                  const isSelected = selectedIds.has(review.id);
                  return (
                    <tr 
                      key={review.id} 
                      className={`hover:bg-stone-50/70 transition-colors ${isSelected ? 'bg-amber-50/40' : ''} ${deleting === review.id ? 'opacity-40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(review.id)}
                          className="w-4 h-4 rounded text-stone-900 focus:ring-stone-500 border-stone-300 cursor-pointer align-middle"
                        />
                      </td>

                      {/* Reviewer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-800 to-stone-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {(review.author_name || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 text-xs">{review.author_name || 'Anonymous'}</p>
                            {review.author_email && (
                              <p className="text-[10px] text-stone-400 truncate max-w-[130px]" title={review.author_email}>
                                {review.author_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-stone-800 max-w-[170px] truncate" title={getProductName(review.product)}>
                          {getProductName(review.product)}
                        </p>
                        {review.product?.sku && (
                          <span className="text-[10px] text-stone-400 font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/50 mt-0.5 inline-block">
                            {review.product.sku}
                          </span>
                        )}
                      </td>

                      {/* Stars */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                        <span className="text-[10px] font-bold text-stone-600 mt-0.5 block">{review.rating} من 5</span>
                      </td>

                      {/* Title + body */}
                      <td className="px-4 py-3.5 hidden md:table-cell max-w-[260px]">
                        {review.title && (
                          <p className="text-xs font-bold text-stone-900 mb-0.5 truncate" title={review.title}>
                            {review.title}
                          </p>
                        )}
                        <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed" title={review.body}>
                          {review.body}
                        </p>
                      </td>

                      {/* Verified */}
                      <td className="px-4 py-3.5 text-center">
                        {review.verified_purchase ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-300 font-medium">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs text-stone-500 font-medium">
                          {new Date(review.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(review.id)}
                          disabled={deleting === review.id}
                          className="p-1.5 rounded-lg bg-red-50 text-[#d40026] hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                          title="حذف هذه المراجعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pagination Bar */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-stone-500">
              {isAll ? (
                <span>عرض جميع الـ <span className="font-bold text-stone-800">{totalItems}</span> مراجعة</span>
              ) : (
                <span>
                  عرض <span className="font-bold text-stone-800">{fromIndex}–{toIndex}</span> من أصل <span className="font-bold text-stone-800">{totalItems}</span> مراجعة
                  {totalPages > 1 && <span className="text-stone-400 mr-1.5">(صفحة {safeCurrentPage} من {totalPages})</span>}
                </span>
              )}
            </div>

            {!isAll && totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="الصفحة الأولى"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Numbered buttons */}
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dot-${idx}`} className="px-1.5 text-stone-400 select-none">
                        …
                      </span>
                    );
                  }
                  const isCurrent = p === safeCurrentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p as number)}
                      className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  title="الصفحة الأخيرة"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-stone-100 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3" dir="rtl">
              <h3 className="font-bold text-stone-950 text-right w-full font-serif text-lg">إضافة مراجعة يدوية / Add Review Manually</h3>
              <button onClick={() => { setIsAddOpen(false); resetForm(); }} className="text-stone-400 hover:text-stone-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Search & Selection (Common) */}
            <div className="text-right" dir="rtl">
              <label className="block text-xs font-bold text-stone-600 mb-1">المنتج (اختر منتجاً للمراجعة) *</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="ابحث عن المنتج بالاسم أو SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                />
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] bg-white"
                  required
                >
                  <option value="">-- اختر منتجاً من القائمة --</option>
                  {productsLoading ? (
                    <option disabled>جاري تحميل المنتجات...</option>
                  ) : filteredProducts.length === 0 ? (
                    <option disabled>لا توجد نتائج</option>
                  ) : (
                    filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {getProductName(p)} {p.sku ? `(SKU: ${p.sku})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-stone-100 pb-1 gap-4" dir="rtl">
              <button
                type="button"
                onClick={() => setModalTab('bulk')}
                className={`pb-2 text-xs font-bold transition cursor-pointer border-b-2 ${
                  modalTab === 'bulk'
                    ? 'border-[#d40026] text-[#d40026]'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                لصق سريع متعدد (Bulk Paste)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('single')}
                className={`pb-2 text-xs font-bold transition cursor-pointer border-b-2 ${
                  modalTab === 'single'
                    ? 'border-[#d40026] text-[#d40026]'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                مراجعة فردية مفصلة (Single Review)
              </button>
            </div>

            {/* Bulk Form */}
            {modalTab === 'bulk' && (
              <form onSubmit={handleCreateBulkReviews} className="space-y-4 text-right" dir="rtl">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">
                    ألصق المراجعات هنا (كل سطر مراجعة باسم وتعليق مفصولين بنقطتين أو شرطة) *
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] min-h-[160px] font-mono leading-relaxed"
                    required
                    placeholder={`أحمد: عطر رائع جداً وثبات عالي\nسارة: توصيل سريع وجودة ممتازة\nمحمد - منتج رائع يستحق الشراء`}
                  />
                  <p className="text-[10px] text-stone-400 mt-1">تنبيه: يمكنك استخدام التنسيق "الاسم: التعليق" أو "الاسم - التعليق" وسيتم تحليل كل سطر تلقائياً دون إيميل.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Default Rating */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">التقييم الافتراضي للكل</label>
                    <select
                      value={bulkDefaultRating}
                      onChange={e => setBulkDefaultRating(Number(e.target.value))}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] bg-white"
                    >
                      <option value={5}>5 نجوم (★★★★★)</option>
                      <option value={4}>4 نجوم (★★★★☆)</option>
                      <option value={3}>3 نجوم (★★★☆☆)</option>
                      <option value={2}>2 نجمة (★★☆☆☆)</option>
                      <option value={1}>1 نجمة (★☆☆☆☆)</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">تاريخ المراجعات (اختياري)</label>
                    <input
                      type="date"
                      value={bulkCreatedAt}
                      onChange={e => setBulkCreatedAt(e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bulkVerifiedPurchase"
                    checked={bulkVerifiedPurchase}
                    onChange={e => setBulkVerifiedPurchase(e.target.checked)}
                    className="rounded text-[#d40026] focus:ring-[#d40026]"
                  />
                  <label htmlFor="bulkVerifiedPurchase" className="text-xs font-bold text-stone-600 cursor-pointer select-none">
                    شراء مؤكد للكل (Verified Purchase)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => { setIsAddOpen(false); resetForm(); }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#d40026] hover:bg-[#b0001f] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'جاري الحفظ...' : 'حفظ المراجعات'}
                  </button>
                </div>
              </form>
            )}

            {/* Single Form */}
            {modalTab === 'single' && (
              <form onSubmit={handleCreateReview} className="space-y-4 text-right" dir="rtl">
                <div className="grid grid-cols-2 gap-4">
                  {/* Author Name */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">اسم المراجع *</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                      required
                      placeholder="مثال: أحمد ف."
                    />
                  </div>

                  {/* Author Email */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={authorEmail}
                      onChange={e => setAuthorEmail(e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] text-left"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">التقييم *</label>
                    <select
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] bg-white"
                    >
                      <option value={5}>5 نجوم (★★★★★)</option>
                      <option value={4}>4 نجوم (★★★★☆)</option>
                      <option value={3}>3 نجوم (★★★☆☆)</option>
                      <option value={2}>2 نجمة (★★☆☆☆)</option>
                      <option value={1}>1 نجمة (★☆☆☆☆)</option>
                    </select>
                  </div>

                  {/* Review Date */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">تاريخ المراجعة (اختياري)</label>
                    <input
                      type="date"
                      value={createdAt}
                      onChange={e => setCreatedAt(e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">عنوان المراجعة (اختياري)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026]"
                    placeholder="مثال: منتج ممتاز ورائع"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">نص المراجعة والكومينت *</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#d40026] min-h-[80px]"
                    required
                    placeholder="أكتب تعليق ومراجعة العميل هنا..."
                  />
                </div>

                {/* Verified Purchase Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verifiedPurchase"
                    checked={verifiedPurchase}
                    onChange={e => setVerifiedPurchase(e.target.checked)}
                    className="rounded text-[#d40026] focus:ring-[#d40026]"
                  />
                  <label htmlFor="verifiedPurchase" className="text-xs font-bold text-stone-600 cursor-pointer select-none">
                    شراء مؤكد (Verified Purchase)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => { setIsAddOpen(false); resetForm(); }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#d40026] hover:bg-[#b0001f] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'جاري الحفظ...' : 'إضافة المراجعة'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersSection({
  customers, customersLoading, customerSearch, setCustomerSearch,
  customerRoleFilter, setCustomerRoleFilter, updatingUserId,
  handleUpdateUserRole, handleDeleteUser, fetchCustomers,
  handleUpdateUserMinOrder, b2bConfig
}: any) {
  const [subTab, setSubTab] = React.useState<'contacts' | 'accounts'>('contacts');
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = React.useState(false);

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL_CONST}/orders/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(await res.json());
    } catch (e) { console.error(e); }
    finally { setContactsLoading(false); }
  };

  React.useEffect(() => { loadContacts(); fetchCustomers(); }, []);

  const q = customerSearch.toLowerCase();

  const filteredContacts = contacts.filter(c => {
    const matchQ = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
    const matchT = customerRoleFilter === 'all'
      || (customerRoleFilter === 'SELLER' && c.order_type === 'Wholesale')
      || (customerRoleFilter === 'CUSTOMER' && c.order_type !== 'Wholesale');
    return matchQ && matchT;
  });

  const filteredAccounts = customers.filter((u: any) => {
    const matchQ = !q
      || u.name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || (u.companyName || '').toLowerCase().includes(q)
      || (u.vatNumber || '').toLowerCase().includes(q)
      || (u.phone || '').toLowerCase().includes(q);
    const matchR = customerRoleFilter === 'all' || u.role === customerRoleFilter;
    return matchQ && matchR;
  });

  const exportCSV = () => {
    let rows: any[][];
    if (subTab === 'contacts') {
      rows = [
        ['Name', 'Email', 'Phone', 'Address', 'Type', 'Orders', 'Total (€)', 'Last Order'],
        ...filteredContacts.map((c: any) => [
          c.name || '', c.email || '', c.phone || '', (c.address || '').replace(/[\r\n]+/g, ' '),
          c.order_type || '', c.order_count, Number(c.total_spent).toFixed(2),
          c.last_order ? new Date(c.last_order).toLocaleDateString() : ''
        ])
      ];
    } else {
      rows = [
        ['Name', 'Email', 'Role', 'Registered', 'Company', 'VAT Number', 'Phone', 'Website', 'Business Type', 'B2B Status'],
        ...filteredAccounts.map((u: any) => [
          u.name || '', u.email || '', u.role || '',
          u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
          u.companyName || '', u.vatNumber || '', u.phone || '', u.websiteUrl || '', u.businessType || '', u.b2bStatus || ''
        ])
      ];
    }
    const csv = rows.map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `baristore_${subTab}_${Date.now()}.csv`
    });
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-serif">Customer & Partner Directory</h2>
          <p className="text-xs text-stone-400 mt-1">الأسماء · الإيميلات · أرقام الهاتف · الشركات · المبالغ</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => { loadContacts(); fetchCustomers(); }}
            className="flex items-center gap-2 bg-stone-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            <Users className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: contacts.length, sub: 'from orders', col: 'bg-stone-50 border-stone-200 text-stone-800' },
          { label: 'B2B Wholesale', value: contacts.filter((c: any) => c.order_type === 'Wholesale').length, sub: 'merchants', col: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
          { label: 'Retail Buyers', value: contacts.filter((c: any) => c.order_type !== 'Wholesale').length, sub: 'customers', col: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'User Accounts', value: customers.length, sub: 'registered', col: 'bg-amber-50 border-amber-200 text-amber-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.col}`}>
            <p className="text-2xl font-bold font-mono">{s.value}</p>
            <p className="text-xs font-bold mt-1 uppercase tracking-wider opacity-80">{s.label}</p>
            <p className="text-[10px] opacity-50 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs + search + filter */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex bg-stone-100 p-1 rounded-lg gap-1">
            <button onClick={() => setSubTab('contacts')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${subTab === 'contacts' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>
              📋 Contacts ({contacts.length})
            </button>
            <button onClick={() => setSubTab('accounts')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${subTab === 'accounts' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>
              👤 Accounts ({customers.length})
            </button>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-900 transition" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {subTab === 'contacts' ? (
            [['all', 'All'], ['SELLER', 'B2B Wholesale'], ['CUSTOMER', 'Retail']].map(([v, l]) => (
              <button key={v} onClick={() => setCustomerRoleFilter(v as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${customerRoleFilter === v ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-500 border border-stone-200 hover:border-stone-400'}`}>
                {l}
              </button>
            ))
          ) : (
            [['all', 'All'], ['CUSTOMER', 'Customers'], ['SELLER', 'B2B Merchants'], ['SUPER_ADMIN', 'Admins']].map(([v, l]) => (
              <button key={v} onClick={() => setCustomerRoleFilter(v as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${customerRoleFilter === v ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-500 border border-stone-200 hover:border-stone-400'}`}>
                {l}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
        {(contactsLoading || customersLoading) ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900" />
          </div>
        ) : subTab === 'contacts' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-400 text-[10px] uppercase tracking-widest border-b border-stone-100">
                  <th className="px-5 py-3 font-semibold">الاسم / Name</th>
                  <th className="px-5 py-3 font-semibold">الإيميل / Email</th>
                  <th className="px-5 py-3 font-semibold">الهاتف / Phone</th>
                  <th className="px-5 py-3 font-semibold hidden lg:table-cell">العنوان / Address</th>
                  <th className="px-5 py-3 font-semibold text-center">النوع</th>
                  <th className="px-5 py-3 font-semibold text-center">الطلبات</th>
                  <th className="px-5 py-3 font-semibold text-right">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredContacts.length === 0 ? (
                  <tr><td colSpan={7} className="py-20 text-center text-stone-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-stone-200" />
                    <p className="font-semibold">No contacts yet</p>
                    <p className="text-xs mt-1 opacity-70">Contacts appear automatically from completed orders</p>
                  </td></tr>
                ) : filteredContacts.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: c.order_type === 'Wholesale' ? 'linear-gradient(135deg,#059669,#065f46)' : 'linear-gradient(135deg,#292524,#78716c)' }}>
                          {(c.name || c.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 leading-tight">{c.name || '—'}</p>
                          {c.order_type === 'Wholesale' && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">B2B</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <a href={`mailto:${c.email}`} className="text-stone-600 font-mono text-xs hover:text-emerald-700 hover:underline transition break-all">{c.email}</a>
                    </td>
                    <td className="px-5 py-4">
                      {c.phone && c.phone !== '—'
                        ? <a href={`tel:${c.phone}`} className="text-stone-700 font-mono text-xs hover:text-emerald-700 hover:underline transition font-semibold">{c.phone}</a>
                        : <span className="text-stone-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-stone-500 text-xs leading-relaxed max-w-[220px]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        title={c.address}>
                        {c.address && c.address !== '—' ? c.address : <span className="text-stone-300">—</span>}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${c.order_type === 'Wholesale'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                        {c.order_type === 'Wholesale' ? '🏢 Wholesale' : '🛍️ Retail'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-stone-900 font-mono">{c.order_count}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-emerald-700 font-mono">€{Number(c.total_spent).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContacts.length > 0 && (
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                <span className="text-xs text-stone-500">{filteredContacts.length} contacts</span>
                <span className="text-xs font-bold font-mono text-stone-800">
                  Total Revenue: €{filteredContacts.reduce((s: number, c: any) => s + Number(c.total_spent), 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Accounts tab */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-400 text-[10px] uppercase tracking-widest border-b border-stone-100">
                  <th className="px-5 py-3 font-semibold">User / Company</th>
                  <th className="px-5 py-3 font-semibold">Contact Details</th>
                  <th className="px-5 py-3 font-semibold text-center">Tax ID / VAT</th>
                  <th className="px-5 py-3 font-semibold text-center">B2B Status</th>
                  <th className="px-5 py-3 font-semibold text-center">Role</th>
                  <th className="px-5 py-3 font-semibold">Registered</th>
                  <th className="px-5 py-3 font-semibold text-center">Change Role</th>
                  <th className="px-5 py-3 font-semibold text-center">Min Order (€)</th>
                  <th className="px-5 py-3 font-semibold text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredAccounts.length === 0 ? (
                  <tr><td colSpan={9} className="py-20 text-center text-stone-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-stone-200" />
                    <p className="font-semibold">No accounts found</p>
                  </td></tr>
                ) : filteredAccounts.map((user: any) => (
                  <tr key={user.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(user.name || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 leading-tight">{user.name || '—'}</p>
                          {user.companyName && (
                            <p className="text-[11px] text-stone-500 font-bold mt-0.5">{user.companyName} <span className="text-stone-400 font-normal">({user.businessType})</span></p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <a href={`mailto:${user.email}`} className="text-stone-600 font-mono text-xs hover:text-emerald-700 hover:underline block">{user.email}</a>
                        {user.phone && (
                          <a href={`tel:${user.phone}`} className="text-stone-500 font-mono text-[11px] hover:underline block">{user.phone}</a>
                        )}
                        {user.websiteUrl && (
                          <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 text-[10px] hover:underline block break-all">{user.websiteUrl}</a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs font-bold text-stone-700">
                      {user.vatNumber || '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {user.b2bStatus ? (
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${user.b2bStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : user.b2bStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : 'bg-stone-50 text-stone-500 border border-stone-200'}`}>
                            {user.b2bStatus}
                          </span>
                          {user.b2bStatus === 'PENDING' && (
                            <div className="flex items-center gap-1.5 mt-1.5 justify-center">
                              <button
                                onClick={() => handleUpdateUserRole(user.id, 'SELLER')}
                                disabled={updatingUserId === user.id}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                                title="Approve B2B"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateUserRole(user.id, 'CUSTOMER')}
                                disabled={updatingUserId === user.id}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                                title="Reject B2B"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${user.role === 'SUPER_ADMIN' ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : user.role === 'SELLER' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'SUPER_ADMIN' ? 'bg-amber-500' : user.role === 'SELLER' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                        {user.role === 'SUPER_ADMIN' ? 'Admin' : user.role === 'SELLER' ? 'B2B Merchant' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-stone-400 text-xs whitespace-nowrap">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <select value={user.role} onChange={e => handleUpdateUserRole(user.id, e.target.value)}
                        disabled={updatingUserId === user.id}
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 font-semibold focus:outline-none focus:border-stone-900 disabled:opacity-50 cursor-pointer">
                        <option value="CUSTOMER">Customer</option>
                        <option value="SELLER">B2B Merchant</option>
                        <option value="SUPER_ADMIN">Admin</option>
                      </select>
                      {updatingUserId === user.id && <div className="inline-block ml-2 w-3 h-3 border-b-2 border-stone-900 rounded-full animate-spin" />}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {user.role === 'SELLER' || user.role === 'SUPER_ADMIN' ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            key={user.id + '-' + (user.b2bMinOrderAmount ?? 'default')}
                            defaultValue={user.b2bMinOrderAmount !== null && user.b2bMinOrderAmount !== undefined ? String(user.b2bMinOrderAmount) : ''}
                            placeholder={`${b2bConfig?.minimum_order_amount ?? 1500} (Default)`}
                            onBlur={(e) => {
                              const val = e.target.value;
                              const num = val === '' ? null : Number(val);
                              if (num !== null && (isNaN(num) || num < 0)) {
                                alert('Please enter a valid amount');
                                return;
                              }
                              const currentVal = user.b2bMinOrderAmount !== null && user.b2bMinOrderAmount !== undefined ? Number(user.b2bMinOrderAmount) : null;
                              if (num !== currentVal) {
                                handleUpdateUserMinOrder(user.id, num);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                const num = val === '' ? null : Number(val);
                                if (num !== null && (isNaN(num) || num < 0)) {
                                  alert('Please enter a valid amount');
                                  return;
                                }
                                const currentVal = user.b2bMinOrderAmount !== null && user.b2bMinOrderAmount !== undefined ? Number(user.b2bMinOrderAmount) : null;
                                if (num !== currentVal) {
                                  handleUpdateUserMinOrder(user.id, num);
                                }
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            disabled={updatingUserId === user.id}
                            className="w-28 text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 font-semibold focus:outline-none focus:border-stone-900 text-center disabled:opacity-50"
                          />
                        </div>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                        className="p-1.5 text-stone-300 hover:text-red-600 transition rounded hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAccounts.length > 0 && (
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs text-stone-500">
                {filteredAccounts.length} accounts
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <Users className="w-3.5 h-3.5 text-white" />
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed">
          <strong className="text-emerald-800 font-bold">منح صلاحية B2B:</strong> في تبويب Accounts، غيّر دور المستخدم إلى &quot;B2B Merchant&quot; ليتمكن فوراً من الوصول لأسعار الجملة. بيانات الاتصال مأخوذة من الطلبات المكتملة في تبويب Contacts.
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {

  const parseWooCommerceNumber = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const clean = String(val).replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically expand the active sub-menu on mount or activeTab changes
  useEffect(() => {
    if (['products', 'categories'].includes(activeTab)) {
      setOpenSubMenu('catalog');
    } else if (['orders', 'invoices'].includes(activeTab)) {
      setOpenSubMenu('sales');
    } else if (['marketing', 'coupons'].includes(activeTab)) {
      setOpenSubMenu('marketing');
    } else if (['ebay', 'amazon'].includes(activeTab)) {
      setOpenSubMenu('integrations');
    } else if (['analytics', 'logs'].includes(activeTab)) {
      setOpenSubMenu('system');
    }
  }, [activeTab]);

  // Load the active tab from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('admin_active_tab');
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  // Save the active tab to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_active_tab', activeTab);
    }
  }, [activeTab]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // New CSV Feed Import states
  const [feedHeaders, setFeedHeaders] = useState<string[]>([]);
  const [skuCol, setSkuCol] = useState('');
  const [nameCol, setNameCol] = useState('');
  const [priceCol, setPriceCol] = useState('');
  const [imageCol, setImageCol] = useState('');
  const [stockCol, setStockCol] = useState('');
  const [eanCol, setEanCol] = useState('');
  const [b2bMarkup, setB2bMarkup] = useState('10');
  const [retailMarkup, setRetailMarkup] = useState('30');

  const [importMode, setImportMode] = useState<'csv' | 'text'>('csv');
  const [rawPasteText, setRawPasteText] = useState('');

  const handleParseAndImportText = async () => {
    if (!rawPasteText.trim()) {
      setMessage('Please paste some text first.');
      return;
    }

    setUploading(true);
    setMessage('');
    const token = localStorage.getItem('token');

    const lines = rawPasteText.split('\n');
    const parsedProducts: any[] = [];
    const regex = /(.*?)\s+(\d+[,.]\d+)\s+EUR\s+UVP\s+(\d+[,.]\d+)\s+EUR/;

    const b2bPercent = parseFloat(b2bMarkup) || 0;
    const retailPercent = parseFloat(retailMarkup) || 0;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        let name = match[1].trim();
        // Remove Neu / Bestseller tags and discount percentages
        name = name.replace(/^(Neu|Bestseller|-?\d+\s*%)\s+/g, '');
        name = name.replace(/^(Neu|Bestseller|-?\d+\s*%)\s+/g, ''); // run twice in case of multiple tags
        
        // Zentrada duplicates the name in the raw copy-paste, clean up duplicate words if present
        const words = name.split(' ');
        const half = Math.floor(words.length / 2);
        if (words.slice(0, half).join(' ') === words.slice(half).join(' ')) {
          name = words.slice(0, half).join(' ');
        }

        const cost = parseFloat(match[2].replace(',', '.')) || 0;

        // Extract SKU (look for 4-8 digit numbers in the name/text)
        const skuMatch = name.match(/\b\d{4,8}\b/);
        const sku = skuMatch ? skuMatch[0] : 'ZT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const b2bPrice = cost * (1 + b2bPercent / 100);
        const retailPrice = cost * (1 + retailPercent / 100);

        parsedProducts.push({
          sku,
          name,
          b2bPrice,
          retailPrice,
          stock: 100
        });
      }
    }

    if (parsedProducts.length === 0) {
      setMessage('No valid products found in the pasted text. Please make sure the format contains prices (e.g., "4,29 EUR UVP 10,45 EUR").');
      setUploading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/products/import-bulk`, {
        products: parsedProducts
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage(response.data.message || `Successfully imported ${parsedProducts.length} products!`);
      setRawPasteText('');
      fetchProducts();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error importing bulk products.');
    } finally {
      setUploading(false);
    }
  };

  const handleFeedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Read headers client-side
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const firstLine = text.split('\n')[0] || '';
        
        // Detect separator (comma vs semicolon)
        const commas = (firstLine.match(/,/g) || []).length;
        const semicolons = (firstLine.match(/;/g) || []).length;
        const separator = semicolons > commas ? ';' : ',';
        
        // Parse headers (handling potential quotes)
        const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
        setFeedHeaders(headers.filter(h => h.length > 0));
        
        // Auto-select common column names for convenience
        const lowerHeaders = headers.map(h => h.toLowerCase());
        const findMatch = (keys: string[]) => {
          const index = lowerHeaders.findIndex(h => keys.some(key => h.includes(key)));
          return index !== -1 ? headers[index] : '';
        };
        
        setSkuCol(findMatch(['sku', 'id', 'item number', 'article', 'artikel', 'nummer']));
        setNameCol(findMatch(['title', 'name', 'bezeichnung', 'titel']));
        setPriceCol(findMatch(['price', 'cost', 'preis', 'wholesale', 'einkauf']));
        setImageCol(findMatch(['image', 'pic', 'photo', 'bild', 'url']));
        setStockCol(findMatch(['stock', 'qty', 'quantity', 'lager', 'bestand', 'menge']));
        setEanCol(findMatch(['ean', 'gtin', 'barcode']));
      };
      reader.readAsText(selectedFile);
    } else {
      setFile(null);
      setFeedHeaders([]);
    }
  };

  const handleFeedUpload = async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }
    if (!skuCol || !nameCol || !priceCol) {
      setMessage('SKU, Name, and Cost Price mappings are required.');
      return;
    }

    setUploading(true);
    setMessage('');
    const token = localStorage.getItem('token');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('b2bMarkup', b2bMarkup);
    formData.append('retailMarkup', retailMarkup);
    formData.append('mappings', JSON.stringify({
      skuCol,
      nameCol,
      priceCol,
      imageCol,
      stockCol,
      eanCol
    }));

    try {
      const response = await axios.post(`${API_URL}/products/import-feed`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setMessage(response.data.message || 'Upload successful!');
      fetchProducts();
      // Reset uploader state
      setFile(null);
      setFeedHeaders([]);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const [authorized, setAuthorized] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [ebayListings, setEbayListings] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<any[]>([]);

  // Activity log state
  const [logsData, setLogsData] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPages, setLogsPages] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsCategory, setLogsCategory] = useState('all');
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStats, setLogsStats] = useState<any>(null);
  const LOGS_PER_PAGE = 50;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Settings configurations
  const [vatConfig, setVatConfig] = useState<any>({ rate: 19, type: 'inclusive' });
  const [b2bConfig, setB2bConfig] = useState<any>({ minimum_order_amount: 2500, default_b2b_min_qty: 1 });
  const [buy2get1Config, setBuy2get1Config] = useState<any>({ active: true, category_id: '' });
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [activeSlideTab, setActiveSlideTab] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png');
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);

  // B2B Partners / Customers state
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerRoleFilter, setCustomerRoleFilter] = useState<'all' | 'CUSTOMER' | 'SELLER' | 'SUPER_ADMIN'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);


  // Homepage Config states
  const [homepageFeatured, setHomepageFeatured] = useState<any>({
    main: { image_url: '', title_en: '', title_ar: '', subtitle_en: '', subtitle_ar: '', tag_en: '', tag_ar: '', link: '' },
    card1: { image_url: '', title_en: '', title_ar: '', link: '' },
    card2: { image_url: '', title_en: '', title_ar: '', link: '' }
  });
  const [homepageStats, setHomepageStats] = useState<any[]>([]);

  // Enhanced Order management states
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'B2B' | 'Retail'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('all');
  const [orderPage, setOrderPage] = useState(1);

  // Interactive Shipping & Email states
  const [isShipPromptOpen, setIsShipPromptOpen] = useState(false);
  const [courierName, setCourierName] = useState('GLS Premium Express');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [shipFulfillmentMode, setShipFulfillmentMode] = useState<'physical' | 'digital'>('physical');
  const [digitalKeyValue, setDigitalKeyValue] = useState('');
  const [digitalInstructionsInput, setDigitalInstructionsInput] = useState('');
  const modalTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyTextareaFormatting = (
    format: 'bold' | 'italic' | 'underline' | 'bullet' | 'number' | 'link' | 'clear'
  ) => {
    const textarea = modalTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = digitalInstructionsInput;
    const selectedText = currentValue.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        replacement = selectedText ? `<b>${selectedText}</b>` : `<b>Text</b>`;
        cursorOffset = selectedText ? replacement.length : 3;
        break;
      case 'italic':
        replacement = selectedText ? `<i>${selectedText}</i>` : `<i>Text</i>`;
        cursorOffset = selectedText ? replacement.length : 3;
        break;
      case 'underline':
        replacement = selectedText ? `<u>${selectedText}</u>` : `<u>Text</u>`;
        cursorOffset = selectedText ? replacement.length : 3;
        break;
      case 'bullet':
        if (selectedText) {
          const lines = selectedText.split('\n');
          replacement = `<ul>\n${lines.map(l => `  <li>${l.replace(/^[-*•]\s*/, '')}</li>`).join('\n')}\n</ul>`;
        } else {
          replacement = `<ul>\n  <li>Schritt 1</li>\n  <li>Schritt 2</li>\n</ul>`;
        }
        cursorOffset = replacement.length;
        break;
      case 'number':
        if (selectedText) {
          const lines = selectedText.split('\n');
          replacement = `<ol>\n${lines.map(l => `  <li>${l.replace(/^\d+[\.\)]\s*/, '')}</li>`).join('\n')}\n</ol>`;
        } else {
          replacement = `<ol>\n  <li>1. Schritt</li>\n  <li>2. Schritt</li>\n</ol>`;
        }
        cursorOffset = replacement.length;
        break;
      case 'link': {
        const url = prompt('URL / Link eingeben (z.B. https://setup.office.com):', 'https://');
        if (!url) return;
        const linkText = selectedText || prompt('Link-Text eingeben (z.B. Hier klicken / Link):', url) || url;
        replacement = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${linkText}</a>`;
        cursorOffset = replacement.length;
        break;
      }
      case 'clear':
        if (selectedText) {
          replacement = selectedText.replace(/<[^>]*>/g, '');
        } else {
          replacement = currentValue.replace(/<[^>]*>/g, '');
          setDigitalInstructionsInput(replacement);
          return;
        }
        cursorOffset = replacement.length;
        break;
    }

    const newValue = currentValue.substring(0, start) + replacement + currentValue.substring(end);
    setDigitalInstructionsInput(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };
  const [shipOrderId, setShipOrderId] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);

  // Product linking states for unlinked orders
  const [selectedLinkProductIds, setSelectedLinkProductIds] = React.useState<Record<string, string>>({});
  const [linkingItemId, setLinkingItemId] = React.useState<string | null>(null);

  const handleLinkProduct = async (orderDbId: string, itemId: string, productId: string) => {
    if (!productId) return;
    setLinkingItemId(itemId);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${orderDbId}/items/${itemId}/link`, { productId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Produkt erfolgreich verknüpft!');
      
      // Fetch orders to update UI state
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/orders`, { headers });
      
      const formatted = response.data.map((o: any) => {
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : '';
        const total = parseFloat(o.total_amount);
        const shipping = parseFloat(o.shipping_amount);
        const subtotal = total - shipping;
        const rate = vatConfig?.rate || 19;
        const tax = subtotal * rate / (100 + rate);
        return {
          id: `#ORD-${o.id.substring(0, 6).toUpperCase()}`,
          db_id: o.id,
          customer: o.customer_name || 'Anonymous Customer',
          email: o.customer_email || 'N/A',
          phone: o.customer_phone || 'N/A',
          address: o.shipping_address || 'N/A',
          date: dateStr,
          total: `€${total.toFixed(2)}`,
          status: o.status === 'PAID' ? 'Processing' : o.status === 'PENDING' ? 'Pending' : o.status === 'SHIPPED' ? 'Shipped' : o.status === 'DELIVERED' ? 'Delivered' : o.status === 'CANCELLED' ? 'Cancelled' : o.status,
          type: o.order_type === 'Wholesale' ? 'B2B' : 'Retail',
          coupon_code: o.coupon_code || null,
          discount_amount: o.discount_amount ? parseFloat(o.discount_amount) : 0,
          shipping_provider: o.shipping_provider || null,
          tracking_number: o.tracking_number || null,
          items: o.items.map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            name: i.name,
            sku: i.sku || 'N/A',
            quantity: i.quantity,
            price: parseFloat(i.unit_price),
            total: parseFloat(i.total_price)
          })),
          subtotal: `€${subtotal.toFixed(2)}`,
          shipping: `€${shipping.toFixed(2)}`,
          tax: `€${tax.toFixed(2)}`
        };
      });
      
      setOrders(formatted);
      
      // Update selectedOrder to the new one
      const updatedMatch = formatted.find((o: any) => o.db_id === orderDbId);
      if (updatedMatch) {
        setSelectedOrder(updatedMatch);
      }
      
      setSelectedLinkProductIds(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch (err: any) {
      alert('Fehler beim Verknüpfen: ' + (err.response?.data?.message || err.message));
    } finally {
      setLinkingItemId(null);
    }
  };

  // New shipping form state
  const [newShipping, setNewShipping] = useState<any>({
    name: '',
    days: '',
    cost: 0,
    b2b_cost: 0,
    service_type: 'standard',
    customer_type: 'both',
    notes: '',
    countries: [],
    applies_to: 'all',
    target_category: '',
    target_product: ''
  });
  const [shippingProdSearch, setShippingProdSearch] = useState('');

  const EUROPEAN_COUNTRIES = [
    'Germany', 'Austria', 'France', 'Netherlands', 'Belgium', 'Luxembourg',
    'Italy', 'Spain', 'Portugal', 'Poland', 'Sweden', 'Denmark', 'Finland',
    'Ireland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria',
    'Greece', 'Croatia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania',
    'Switzerland', 'Norway', 'United Kingdom'
  ];

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      if (response.data.vat_config) setVatConfig(response.data.vat_config);
      if (response.data.b2b_config) {
        setB2bConfig(response.data.b2b_config);
      } else {
        setB2bConfig({ minimum_order_amount: 2500, default_b2b_min_qty: 1 });
      }
      if (response.data.shipping_methods) setShippingMethods(response.data.shipping_methods);
      if (response.data.hero_banners) {
        setHeroBanners(response.data.hero_banners);
      }

      // Homepage Stats
      if (response.data.homepage_stats) {
        setHomepageStats(response.data.homepage_stats);
      } else {
        setHomepageStats(DEFAULT_HOMEPAGE_STATS);
      }

      // Homepage Featured
      if (response.data.homepage_featured) {
        setHomepageFeatured(response.data.homepage_featured);
      } else {
        setHomepageFeatured({
          main: { image_url: '', title_en: '', title_ar: '', subtitle_en: '', subtitle_ar: '', tag_en: '', tag_ar: '', link: '' },
          card1: { image_url: '', title_en: '', title_ar: '', link: '' },
          card2: { image_url: '', title_en: '', title_ar: '', link: '' }
        });
      }


      if (response.data.logo_url) {
        setLogoUrl(response.data.logo_url);
      }
      if (response.data.buy2get1_config) {
        setBuy2get1Config(response.data.buy2get1_config);
      } else {
        setBuy2get1Config({ active: true, category_id: '' });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  const handleStatChange = (index: number, field: string, value: string) => {
    const updated = [...homepageStats];
    updated[index] = { ...updated[index], [field]: value };
    setHomepageStats(updated);
  };

  const handleFeaturedChange = (cardKey: 'main' | 'card1' | 'card2', field: string, value: string) => {
    setHomepageFeatured((prev: any) => ({
      ...prev,
      [cardKey]: {
        ...prev[cardKey],
        [field]: value
      }
    }));
  };

  const handleFeaturedImageUpload = async (cardKey: 'main' | 'card1' | 'card2', file: File) => {
    if (!file) return;
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });
      setHomepageFeatured((prev: any) => ({
        ...prev,
        [cardKey]: {
          ...prev[cardKey],
          image_url: response.data.image_url
        }
      }));
      alert("Featured image uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to upload featured image.");
    }
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/settings/${key}`, { value }, { headers });
      fetchSettings();
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings.");
    }
  };

  const handleBannerChange = (index: number, field: string, value: string) => {
    const updated = [...heroBanners];
    updated[index] = { ...updated[index], [field]: value };
    setHeroBanners(updated);
  };

  const handleBannerImageUpload = async (index: number, file: File) => {
    if (!file) return;
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });
      handleBannerChange(index, 'image_url', response.data.image_url);
      alert("Banner image uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to upload banner image.");
    }
  };

  const handleAddShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShipping.name || !newShipping.days) {
      alert("Please fill in courier name and delivery days.");
      return;
    }
    const updated = [
      ...shippingMethods,
      {
        id: `shipping-${Date.now()}`,
        name: newShipping.name,
        days: newShipping.days,
        cost: Number(newShipping.cost),
        b2b_cost: Number(newShipping.b2b_cost || newShipping.cost),
        service_type: newShipping.service_type || 'standard',
        customer_type: newShipping.customer_type || 'both',
        notes: newShipping.notes || '',
        countries: newShipping.countries.length > 0 ? newShipping.countries : ['All Europe'],
        applies_to: newShipping.applies_to || 'all',
        target_category: newShipping.applies_to === 'categories' ? newShipping.target_category : undefined,
        target_product: newShipping.applies_to === 'products' ? newShipping.target_product : undefined
      }
    ];
    setShippingMethods(updated);
    setNewShipping({ name: '', days: '', cost: 0, b2b_cost: 0, service_type: 'standard', customer_type: 'both', notes: '', countries: [], applies_to: 'all', target_category: '', target_product: '' });
  };

  const handleRemoveShipping = (id: string) => {
    const updated = shippingMethods.filter(s => s.id !== id);
    setShippingMethods(updated);
  };

  const toggleShippingCountry = (country: string) => {
    const countries = [...newShipping.countries];
    if (countries.includes(country)) {
      setNewShipping({
        ...newShipping,
        countries: countries.filter(c => c !== country)
      });
    } else {
      setNewShipping({
        ...newShipping,
        countries: [...countries, country]
      });
    }
  };

  const selectAllEuropeanCountries = () => {
    setNewShipping({
      ...newShipping,
      countries: [...EUROPEAN_COUNTRIES]
    });
  };

  const clearSelectedCountries = () => {
    setNewShipping({
      ...newShipping,
      countries: []
    });
  };

  const calculateGross = (netPrice: number, rate: number) => {
    return parseFloat((netPrice * (1 + rate / 100)).toFixed(2));
  };

  const calculateNet = (grossPrice: number, rate: number) => {
    return parseFloat((grossPrice / (1 + rate / 100)).toFixed(2));
  };

  // Add Product form state supporting multiple variants
  const [newProduct, setNewProduct] = useState<any>({
    name_en: '',
    name_ar: '',
    brand: '',
    category_id: '',
    category_ids: [] as string[],
    description_en: '',
    description_ar: '',
    short_description_en: '',
    short_description_ar: '',
    tags: '',
    admin_note: '',
    scent_top: '',
    scent_heart: '',
    scent_base: '',
    sales_mode: 'BOTH',
    product_type: 'standard_single', // Default to Standard Single Product
    variants: [
      {
        sku: '',
        ean: '',
        variant_type: '',
        stock_quantity: 50,
        net_sales_price: 80.00,
        sales_price_with_tax: 95.20,
        b2b_price: 55.00,
        retail_price: 120.00,
        b2bMinQty: 1,
        image_url: '',
        image_mode: 'url', // 'url' or 'upload'
        uploadingImage: false,
        secondary_image_url: '',
        secondary_image_mode: 'url',
        uploadingSecondaryImage: false,
        gallery_image_3_url: '',
        gallery_image_3_mode: 'url',
        uploadingGalleryImage3: false,
        gallery_image_4_url: '',
        gallery_image_4_mode: 'url',
        uploadingGalleryImage4: false,
        ebayCategoryId: '',
        isDigital: false,
        isMultiUse: false,
        digitalKeysText: '',
        digitalInstructions_en: '',
        digitalInstructions_de: '',
        digitalInstructions_ar: ''
      }
    ]
  });

  // Add Category form state
  const [newCategory, setNewCategory] = useState({
    name_en: '',
    name_ar: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    uploadingImage: false
  });

  // Edit Category form state
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>({
    id: '',
    name_en: '',
    name_ar: '',
    slug: '',
    description: '',
    parent_id: '',
    image_url: '',
    image_mode: 'url',
    uploadingImage: false
  });


  // Brand suggestions helper
  const existingBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p: any) => {
      const b = p.attributes?.brand || p.brand;
      if (b) brands.add(b);
    });
    return Array.from(brands).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const [showAddBrandSuggestions, setShowAddBrandSuggestions] = useState(false);
  const [showEditBrandSuggestions, setShowEditBrandSuggestions] = useState(false);

  // Edit Product Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [soldKeysData, setSoldKeysData] = useState<any[]>([]);
  const [soldKeysLoading, setSoldKeysLoading] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [editProduct, setEditProduct] = useState<any>({
    id: '',
    sku: '',
    ean: '',
    name_en: '',
    name_ar: '',
    brand: '',
    attributes: {},
    sales_mode: 'BOTH',
    description_en: '',
    description_ar: '',
    short_description_en: '',
    short_description_ar: '',
    tags: '',
    admin_note: '',
    scent_top: '',
    scent_heart: '',
    scent_base: '',
    category_id: '',
    category_ids: [] as string[],
    variant_type: '',
    product_type: 'standard_multi', // 'standard_multi' | 'standard_single' | 'sample'
    stock_quantity: 0,
    net_sales_price: 0,
    sales_price_with_tax: 0,
    b2b_price: 0,
    retail_price: 0,
    b2bMinQty: 1,
    discount_percent: '',
    image_url: '',
    image_mode: 'url',
    uploadingImage: false,
    secondary_image_url: '',
    secondary_image_mode: 'url',
    uploadingSecondaryImage: false,
    gallery_image_3_url: '',
    gallery_image_3_mode: 'url',
    uploadingGalleryImage3: false,
    gallery_image_4_url: '',
    gallery_image_4_mode: 'url',
    uploadingGalleryImage4: false,
    ebayCategoryId: '',
    isDigital: false,
    isMultiUse: false,
    digitalKeysText: '',
    digitalInstructions_en: '',
    digitalInstructions_de: '',
    digitalInstructions_ar: ''
  });

  const [syncAllVariants, setSyncAllVariants] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setOrderPage(1);
  }, [orderFilter, orderStatusFilter, searchQuery]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedProductIds(prev => prev.length === ids.length ? [] : ids);
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`حذف ${selectedProductIds.length} منتج؟ هذا الإجراء لا يمكن التراجع عنه!`)) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await Promise.all(selectedProductIds.map(id => axios.delete(`${API_URL}/products/${id}`, { headers })));
      setSelectedProductIds([]);
      fetchProducts();
      alert(`✅ تم حذف ${selectedProductIds.length} منتج بنجاح`);
    } catch (err) {
      alert('❌ فشل الحذف، حاول مجدداً');
    }
  };

  const filteredProducts = products.filter((product: any) => {
    // 1. Search Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameEn = product.translations?.en?.toLowerCase() || '';
      const nameAr = product.translations?.ar?.toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';
      const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';
      const variantType = product.attributes?.type?.toLowerCase() || '';
      const matchesSearch = nameEn.includes(query) || nameAr.includes(query) || sku.includes(query) || tags.includes(query) || variantType.includes(query);
      if (!matchesSearch) return false;
    }

    // 2. Category Filter
    if (selectedCategoryFilter) {
      const matchesCat = product.category_id === selectedCategoryFilter ||
        (product.categories || []).some((c: any) => c.id === selectedCategoryFilter) ||
        (product.productCategories || []).some((pc: any) => pc.category_id === selectedCategoryFilter);
      if (!matchesCat) return false;
    }

    // 3. Brand Filter
    if (selectedBrandFilter) {
      const productBrand = product.attributes?.brand || '';
      if (productBrand !== selectedBrandFilter) return false;
    }

    return true;
  }).sort((a: any, b: any) => {
    // 4. Sort by Date Added (created_at)
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

    if (sortOrder === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  const filteredCategories = categories.filter((category: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameEn = category.name?.en?.toLowerCase() || '';
    const nameAr = category.name?.ar?.toLowerCase() || '';
    const slug = category.slug?.toLowerCase() || '';
    return nameEn.includes(query) || nameAr.includes(query) || slug.includes(query);
  });

  const fetchEbayListings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ebay/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEbayListings(response.data);
    } catch (error) {
      console.error('Error fetching eBay listings:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/all`);
      setProducts(response.data);
      fetchEbayListings();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
      if (response.data.length > 0 && (!newProduct.category_id || !newProduct.category_ids || newProduct.category_ids.length === 0)) {
        setNewProduct((prev: any) => ({
          ...prev,
          category_id: response.data[0].id,
          category_ids: [response.data[0].id]
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Helper to generate a unique SKU under eBay's 50-character limit
      const generateSafeSku = (name: string, type: string, index: number): string => {
        const isMulti = newProduct.product_type === 'standard_multi';
        const suffix = isMulti ? `-${index}` : '';
        let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (isMulti && type) {
          base += `-${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        }
        if ((base + suffix).length > 50) {
          base = base.substring(0, 50 - suffix.length);
          if (base.endsWith('-')) {
            base = base.substring(0, base.length - 1);
          }
        }
        return base + suffix;
      };

      // All variants created in this batch share the SKU of the first variant as their parent_sku
      const firstVariantSku = newProduct.variants[0]?.sku || generateSafeSku(newProduct.name_en, newProduct.variants[0]?.variant_type || 'default', 0);

      // We publish all variants in a parallel or sequential chain
      for (let i = 0; i < newProduct.variants.length; i++) {
        const variant = newProduct.variants[i];

        // Generate fallback SKU if empty
        const fallbackSku = generateSafeSku(newProduct.name_en, variant.variant_type || 'default', i);
        const isSample = newProduct.product_type === 'sample';
        const isMulti = newProduct.product_type === 'standard_multi';

        const payload = {
          sku: variant.sku || fallbackSku,
          ean: variant.ean || undefined,
          image_url: variant.image_url || undefined,
          stock_quantity: (variant.isDigital && !variant.isMultiUse && variant.digitalKeysText && variant.digitalKeysText.trim().length > 0)
            ? (variant.digitalKeysText || '').split('\n').map((k: string) => k.trim()).filter(Boolean).length
            : Math.round(parseWooCommerceNumber(variant.stock_quantity) || 0),
          translations: {
            en: newProduct.name_en,
            ar: newProduct.name_ar || undefined
          },
          description: {
            en: newProduct.description_en || undefined,
            ar: newProduct.description_ar || undefined
          },
          short_description: {
            en: newProduct.short_description_en || undefined,
            ar: newProduct.short_description_ar || undefined
          },
          tags: newProduct.tags ? newProduct.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          net_sales_price: parseWooCommerceNumber(variant.net_sales_price),
          sales_price_with_tax: parseWooCommerceNumber(variant.sales_price_with_tax),
          b2b_price: parseWooCommerceNumber(variant.b2b_price),
          retail_price: variant.retail_price ? parseWooCommerceNumber(variant.retail_price) : undefined,
          b2bMinQty: variant.b2bMinQty ? Math.round(parseWooCommerceNumber(variant.b2bMinQty)) : 1,
          attributes: {
            type: isMulti ? variant.variant_type : null,
            is_sample: isSample,
            additional_images: [
              variant.secondary_image_url,
              variant.gallery_image_3_url,
              variant.gallery_image_4_url
            ].filter(Boolean),
            parent_sku: isMulti ? firstVariantSku : null,
            brand: newProduct.brand || undefined,
            sales_mode: newProduct.sales_mode || 'BOTH',
            ebayCategoryId: variant.ebayCategoryId || undefined,
            isDigital: variant.isDigital || false,
            isMultiUse: variant.isMultiUse || false,
            digitalKeys: variant.isDigital ? (variant.digitalKeysText || '').split('\n').map((k: string) => k.trim()).filter(Boolean) : [],
            digitalInstructions: {
              en: variant.digitalInstructions_en || '',
              de: variant.digitalInstructions_de || '',
              ar: variant.digitalInstructions_ar || ''
            },
            b2b_qty_mode: variant.b2bQtyMode || 'VE'
          },
          category_id: newProduct.category_id,
          category_ids: newProduct.category_ids,
          admin_note: newProduct.admin_note || undefined,
          scent_notes: {
            top: newProduct.scent_top || '',
            heart: newProduct.scent_heart || '',
            base: newProduct.scent_base || ''
          }
        };

        await axios.post(`${API_URL}/products`, payload, { headers });
      }

      setIsAddModalOpen(false);

      // Reset form
      setNewProduct({
        name_en: '',
        name_ar: '',
        brand: '',
        category_id: categories[0]?.id || '',
        category_ids: categories[0]?.id ? [categories[0].id] : [],
        description_en: '',
        sales_mode: 'BOTH',
        description_ar: '',
        short_description_en: '',
        short_description_ar: '',
        tags: '',
        admin_note: '',
        scent_top: '',
        scent_heart: '',
        scent_base: '',
        product_type: 'standard_multi',
        variants: [
          {
            sku: '',
            ean: '',
            variant_type: '100ml Eau de Parfum',
            stock_quantity: 50,
            net_sales_price: 80.00,
            sales_price_with_tax: 95.20,
            b2b_price: 55.00,
            retail_price: 120.00,
            image_url: '',
            image_mode: 'url',
            uploadingImage: false,
            secondary_image_url: '',
            secondary_image_mode: 'url',
            uploadingSecondaryImage: false,
            gallery_image_3_url: '',
            gallery_image_3_mode: 'url',
            uploadingGalleryImage3: false,
            gallery_image_4_url: '',
            gallery_image_4_mode: 'url',
            uploadingGalleryImage4: false
          }
        ]
      });

      fetchProducts();
      alert("Product variants published successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to publish products. Check unique SKUs.");
    }
  };

  const addVariantRow = () => {
    const last = newProduct.variants[newProduct.variants.length - 1] || {};
    setNewProduct({
      ...newProduct,
      variants: [
        ...newProduct.variants,
        {
          sku: '',
          ean: '',
          variant_type: last.variant_type || '100ml Eau de Parfum',
          stock_quantity: last.stock_quantity ?? 50,
          net_sales_price: last.net_sales_price ?? 80.00,
          sales_price_with_tax: last.sales_price_with_tax ?? 95.20,
          b2b_price: last.b2b_price ?? 55.00,
          retail_price: last.retail_price ?? 120.00,
          image_url: last.image_url || '',
          image_mode: last.image_mode || 'url',
          uploadingImage: false,
          secondary_image_url: last.secondary_image_url || '',
          secondary_image_mode: last.secondary_image_mode || 'url',
          uploadingSecondaryImage: false,
          gallery_image_3_url: last.gallery_image_3_url || '',
          gallery_image_3_mode: last.gallery_image_3_mode || 'url',
          uploadingGalleryImage3: false,
          gallery_image_4_url: last.gallery_image_4_url || '',
          gallery_image_4_mode: last.gallery_image_4_mode || 'url',
          uploadingGalleryImage4: false,
          ebayCategoryId: last.ebayCategoryId || '',
          isDigital: last.isDigital || false,
          isMultiUse: last.isMultiUse || false,
          digitalKeysText: last.digitalKeysText || '',
          digitalInstructions_en: last.digitalInstructions_en || '',
          digitalInstructions_de: last.digitalInstructions_de || '',
          digitalInstructions_ar: last.digitalInstructions_ar || ''
        }
      ]
    });
  };

  const removeVariantRow = (index: number) => {
    if (newProduct.variants.length <= 1) return;
    const filtered = newProduct.variants.filter((_: any, i: number) => i !== index);
    setNewProduct({ ...newProduct, variants: filtered });
  };

  const handleVariantChange = (index: number, fieldOrUpdates: string | Record<string, any>, value?: any) => {
    setNewProduct((prev: any) => {
      const updated = [...prev.variants];
      if (typeof fieldOrUpdates === 'string') {
        updated[index] = { ...updated[index], [fieldOrUpdates]: value };
      } else {
        updated[index] = { ...updated[index], ...fieldOrUpdates };
      }
      return { ...prev, variants: updated };
    });
  };

  const handleVariantImageUpload = async (index: number, file: File) => {
    if (!file) return;
    const updated = [...newProduct.variants];
    updated[index].uploadingImage = true;
    setNewProduct({ ...newProduct, variants: updated });

    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      const newVariants = [...newProduct.variants];
      newVariants[index].image_url = response.data.image_url;
      newVariants[index].uploadingImage = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Image uploaded successfully!");
    } catch (error) {
      console.error(error);
      const newVariants = [...newProduct.variants];
      newVariants[index].uploadingImage = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Failed to upload image.");
    }
  };

  const handleVariantSecondaryImageUpload = async (index: number, file: File) => {
    if (!file) return;
    const updated = [...newProduct.variants];
    updated[index].uploadingSecondaryImage = true;
    setNewProduct({ ...newProduct, variants: updated });

    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      const newVariants = [...newProduct.variants];
      newVariants[index].secondary_image_url = response.data.image_url;
      newVariants[index].uploadingSecondaryImage = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Secondary image uploaded successfully!");
    } catch (error) {
      console.error(error);
      const newVariants = [...newProduct.variants];
      newVariants[index].uploadingSecondaryImage = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Failed to upload secondary image.");
    }
  };

  const handleVariantGalleryImage3Upload = async (index: number, file: File) => {
    if (!file) return;
    const updated = [...newProduct.variants];
    updated[index].uploadingGalleryImage3 = true;
    setNewProduct({ ...newProduct, variants: updated });

    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      const newVariants = [...newProduct.variants];
      newVariants[index].gallery_image_3_url = response.data.image_url;
      newVariants[index].uploadingGalleryImage3 = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Gallery image 3 uploaded successfully!");
    } catch (error) {
      console.error(error);
      const newVariants = [...newProduct.variants];
      newVariants[index].uploadingGalleryImage3 = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Failed to upload gallery image 3.");
    }
  };

  const handleVariantGalleryImage4Upload = async (index: number, file: File) => {
    if (!file) return;
    const updated = [...newProduct.variants];
    updated[index].uploadingGalleryImage4 = true;
    setNewProduct({ ...newProduct, variants: updated });

    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      const newVariants = [...newProduct.variants];
      newVariants[index].gallery_image_4_url = response.data.image_url;
      newVariants[index].uploadingGalleryImage4 = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Gallery image 4 uploaded successfully!");
    } catch (error) {
      console.error(error);
      const newVariants = [...newProduct.variants];
      newVariants[index].uploadingGalleryImage4 = false;
      setNewProduct({ ...newProduct, variants: newVariants });
      alert("Failed to upload gallery image 4.");
    }
  };

  const uploadSingleFile = async (file: File): Promise<string> => {
    if (!file) return "";
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    };
    const formData = new FormData();
    formData.append("image", file);
    const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });
    return response.data.image_url;
  };

  const handleVariantMultipleUpload = async (variantIndex: number, files: FileList) => {
    const fileArray = Array.from(files).slice(0, 4);
    if (fileArray.length === 0) return;

    const slots = ["image_url", "secondary_image_url", "gallery_image_3_url", "gallery_image_4_url"];
    const loadingKeys = ["uploadingImage", "uploadingSecondaryImage", "uploadingGalleryImage3", "uploadingGalleryImage4"];

    let emptySlotIndices: number[] = [];
    setNewProduct((prev: any) => {
      const v = prev.variants[variantIndex];
      slots.forEach((s, idx) => {
        if (!v[s]) {
          emptySlotIndices.push(idx);
        }
      });
      if (emptySlotIndices.length === 0) {
        emptySlotIndices = [0, 1, 2, 3];
      }

      const updatedVariants = [...prev.variants];
      const targetV = { ...updatedVariants[variantIndex] };
      for (let i = 0; i < Math.min(fileArray.length, emptySlotIndices.length); i++) {
        const slotIdx = emptySlotIndices[i];
        targetV[loadingKeys[slotIdx]] = true;
        targetV[slots[slotIdx] + "_mode"] = "upload";
      }
      updatedVariants[variantIndex] = targetV;
      return { ...prev, variants: updatedVariants };
    });

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const uploadedUrl = await uploadSingleFile(file);
        setNewProduct((prev: any) => {
          const updatedVariants = [...prev.variants];
          const v = { ...updatedVariants[variantIndex] };
          
          let targetSlotIdx = -1;
          for (let j = 0; j < 4; j++) {
            if (v[loadingKeys[j]] && !v[slots[j]]) {
              targetSlotIdx = j;
              break;
            }
          }
          if (targetSlotIdx === -1) {
            for (let j = 0; j < 4; j++) {
              if (!v[slots[j]]) {
                targetSlotIdx = j;
                break;
              }
            }
          }
          if (targetSlotIdx === -1) {
            targetSlotIdx = i % 4;
          }

          v[slots[targetSlotIdx]] = uploadedUrl;
          v[loadingKeys[targetSlotIdx]] = false;
          updatedVariants[variantIndex] = v;
          return { ...prev, variants: updatedVariants };
        });
      } catch (err) {
        console.error(err);
        setNewProduct((prev: any) => {
          const updatedVariants = [...prev.variants];
          const v = { ...updatedVariants[variantIndex] };
          loadingKeys.forEach(k => { v[k] = false; });
          updatedVariants[variantIndex] = v;
          return { ...prev, variants: updatedVariants };
        });
        alert("Failed to upload some images.");
        break;
      }
    }
  };

  const swapVariantImages = (variantIndex: number, slot1: number, slot2: number) => {
    const newVariants = [...newProduct.variants];
    const v = { ...newVariants[variantIndex] };

    const getKeys = (slot: number) => {
      if (slot === 0) return ["image_url", "image_mode"];
      if (slot === 1) return ["secondary_image_url", "secondary_image_mode"];
      if (slot === 2) return ["gallery_image_3_url", "gallery_image_3_mode"];
      return ["gallery_image_4_url", "gallery_image_4_mode"];
    };

    const [k1Url, k1Mode] = getKeys(slot1);
    const [k2Url, k2Mode] = getKeys(slot2);

    const tempUrl = v[k1Url];
    const tempMode = v[k1Mode];

    v[k1Url] = v[k2Url];
    v[k1Mode] = v[k2Mode];

    v[k2Url] = tempUrl;
    v[k2Mode] = tempMode;

    newVariants[variantIndex] = v;
    setNewProduct({ ...newProduct, variants: newVariants });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.delete(`${API_URL}/products/${id}`, { headers });
      fetchProducts();
      alert(response.data?.message || "Product deleted successfully!");
    } catch (error: any) {
      console.error("Delete product error:", error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete product.";
      alert(errMsg);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        name: {
          en: newCategory.name_en,
          ar: newCategory.name_ar || undefined
        },
        slug: newCategory.slug,
        description: newCategory.description || undefined,
        parent_id: newCategory.parent_id || undefined,
        image_url: newCategory.image_url || undefined
      };

      await axios.post(`${API_URL}/categories`, payload, { headers });

      // Reset form
      setNewCategory({
        name_en: '',
        name_ar: '',
        slug: '',
        description: '',
        parent_id: '',
        image_url: '',
        uploadingImage: false
      });

      fetchCategories();
      alert("Category added successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to add category. Verify slug is unique.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/categories/${id}`, { headers });
      fetchCategories();
      alert("Category deleted successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete category.");
    }
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let user: any = null;
      if (userStr && userStr !== 'undefined') {
        try {
          user = JSON.parse(userStr);
        } catch {
          user = null;
        }
      }

      if (!token || !user || user.role !== 'SUPER_ADMIN') {
        window.location.href = '/login';
        return;
      }

      setAuthorized(true);
      fetchProducts();
      fetchCategories();
      fetchSettings();
      fetchOrders();
      fetchCustomers();
      fetchLogs(1, 'all', '');
      fetchLogStats();
    } catch (err) {
      console.error('Admin init error:', err);
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    if (products && products.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('editProduct') || params.get('edit');
      if (editId) {
        const decoded = decodeURIComponent(editId).toLowerCase();
        const target = products.find((p: any) => 
          String(p.id).toLowerCase() === decoded || 
          String(p.sku).toLowerCase() === decoded
        );
        if (target) {
          setActiveTab('products');
          handleEditClick(target);
        }
      }
    }
  }, [products]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_URL}/auth/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomers(prev => prev.map(u => u.id === userId ? res.data : u));
    } catch (err: any) {
      console.error('Role update error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('انتهت صلاحية الجلسة أو ليس لديك صلاحية أدمن. يرجى تسجيل الخروج ثم تسجيل الدخول مجدداً.');
      } else {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update role';
        alert(`Error: ${errorMsg}`);
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdateUserMinOrder = async (userId: string, minOrder: number | null) => {
    setUpdatingUserId(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_URL}/auth/users/${userId}/b2b-min-order`,
        { b2bMinOrderAmount: minOrder },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomers(prev => prev.map(u => u.id === userId ? res.data : u));
    } catch (err: any) {
      console.error('Min order update error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('انتهت صلاحية الجلسة. يرجى تسجيل الخروج ثم تسجيل الدخول مجدداً.');
      } else {
        alert(err.response?.data?.message || 'Failed to update minimum order amount');
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
  };

  const executeDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(prev => prev.filter(u => u.id !== userId));
      alert('User deleted successfully.');
    } catch (err: any) {
      console.error('Delete user error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('انتهت صلاحية الجلسة. يرجى تسجيل الخروج ثم تسجيل الدخول مجدداً.');
      } else {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }
    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API_URL}/products/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(response.data.message || 'Upload successful!');
      fetchProducts();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error uploading file.');
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  const handleCategoryImageUpload = async (file: File) => {
    if (!file) return;
    setNewCategory((prev: any) => ({ ...prev, uploadingImage: true }));
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      setNewCategory((prev: any) => ({
        ...prev,
        image_url: response.data.image_url,
        uploadingImage: false
      }));
      alert("Category image uploaded successfully!");
    } catch (error) {
      console.error(error);
      setNewCategory((prev: any) => ({ ...prev, uploadingImage: false }));
      alert("Failed to upload image.");
    }
  };

  const handleEditCategoryClick = (category: any) => {
    setEditCategory({
      id: category.id,
      name_en: category.name?.en || '',
      name_ar: category.name?.ar || '',
      slug: category.slug || '',
      description: category.description || '',
      parent_id: category.parent_id || '',
      image_url: category.image_url || '',
      image_mode: category.image_url ? 'url' : 'upload',
      uploadingImage: false
    });
    setIsEditCategoryModalOpen(true);
  };

  const handleEditCategoryImageUpload = async (file: File) => {
    if (!file) return;
    setEditCategory((prev: any) => ({ ...prev, uploadingImage: true }));
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      setEditCategory((prev: any) => ({
        ...prev,
        image_url: response.data.image_url,
        uploadingImage: false
      }));
      alert("Category image uploaded successfully!");
    } catch (error) {
      console.error(error);
      setEditCategory((prev: any) => ({ ...prev, uploadingImage: false }));
      alert("Failed to upload image.");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        name: {
          en: editCategory.name_en,
          ar: editCategory.name_ar || undefined
        },
        slug: editCategory.slug,
        description: editCategory.description || undefined,
        parent_id: editCategory.parent_id || null,
        image_url: editCategory.image_url || undefined
      };

      await axios.put(`${API_URL}/categories/${editCategory.id}`, payload, { headers });
      setIsEditCategoryModalOpen(false);
      fetchCategories();
      alert("Category updated successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update category. Verify slug is unique.");
    }
  };

  const handleAddNewVariant = async (parent: any) => {
    const size = window.prompt(
      "Enter the new size/variant name (e.g., 50ml Eau de Parfum):",
      "50ml Eau de Parfum"
    );
    if (!size || !size.trim()) return;

    const parentSku = parent.attributes?.parent_sku || parent.sku;
    const baseSku = parentSku.replace(/-[0-9]+ml.*$/i, '').replace(/-\d+$/, '');
    const cleanSize = size.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const suggestedSku = `${baseSku}-${cleanSize}`;

    const sku = window.prompt(
      "Enter the SKU for the new variant:",
      suggestedSku
    );
    if (!sku || !sku.trim()) return;

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const payload = {
      sku: sku.trim(),
      ean: undefined,
      image_url: parent.image_url || undefined,
      stock_quantity: 0,
      translations: parent.translations || { en: parent.name || '' },
      description: parent.description || undefined,
      short_description: parent.short_description || undefined,
      tags: parent.tags || [],
      net_sales_price: parseFloat(parent.net_sales_price || 0),
      sales_price_with_tax: parseFloat(parent.sales_price_with_tax || 0),
      b2b_price: parseFloat(parent.b2b_price || 0),
      retail_price: parent.retail_price ? parseFloat(parent.retail_price) : undefined,
      b2bMinQty: parent.b2bMinQty || 1,
      attributes: {
        type: size.trim(),
        is_sample: false,
        parent_sku: parentSku,
        brand: parent.attributes?.brand || undefined,
        sales_mode: parent.attributes?.sales_mode || 'BOTH',
        b2b_qty_mode: parent.attributes?.b2b_qty_mode || 'VE'
      },
      category_id: parent.category_id || '',
      category_ids: Array.isArray(parent.categories) ? parent.categories.map((c: any) => c.id) : [parent.category_id].filter(Boolean),
      admin_note: parent.admin_note || undefined
    };

    try {
      const response = await axios.post(`${API_URL}/products`, payload, { headers });
      alert("Variant added successfully!");
      await fetchProducts();
      // Switch the edit modal to the new variant
      handleEditClick(response.data);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create variant. Verify SKU is unique.");
    }
  };

  const handleDeleteVariantProduct = async (variant: any) => {
    const confirmDelete = window.confirm(
      `Möchten Sie diese Variante (${variant.attributes?.type || variant.sku}) wirklich dauerhaft löschen? / Are you sure you want to permanently delete this variant?`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/products/${variant.id}`, { headers });
      
      alert("Variante erfolgreich gelöscht! / Variant deleted successfully!");
      await fetchProducts();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete variant.");
    }
  };

  const handleEditClick = (product: any) => {
    // Seed category_ids from the many-to-many categories list, falling back to primary category
    const existingCatIds: string[] = Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories.map((c: any) => c.id)
      : (product.category?.id ? [product.category.id] : []);

    // Determine product type (variable, simple standard, or sample)
    const hasSisterVariants = products.some((p: any) => {
      const pAttr = p.attributes || {};
      const parentSku = product.attributes?.parent_sku || product.sku;
      return parentSku && (p.sku === parentSku || pAttr.parent_sku === parentSku) && p.id !== product.id;
    });
    const productType = product.attributes?.is_sample 
      ? 'sample' 
      : (hasSisterVariants ? 'standard_multi' : 'standard_single');

    setSyncAllVariants(true);

    const getFieldEn = (field: any) => {
      if (!field) return '';
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          if (parsed && typeof parsed === 'object') {
            return parsed.en || parsed.de || parsed.ar || '';
          }
        } catch {}
        return field;
      }
      if (typeof field === 'object') {
        return field.en || field.de || field.ar || '';
      }
      return '';
    };

    const getFieldAr = (field: any) => {
      if (!field) return '';
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          if (parsed && typeof parsed === 'object') {
            return parsed.ar || '';
          }
        } catch {}
        return '';
      }
      if (typeof field === 'object') {
        return field.ar || '';
      }
      return '';
    };

    // Helper to get initial scent notes (from DB or parsed from text)
    let initialScentTop = '';
    let initialScentHeart = '';
    let initialScentBase = '';

    let parsedScent = product.scent_notes;
    if (typeof parsedScent === 'string') {
      try { parsedScent = JSON.parse(parsedScent); } catch {}
    }

    if (parsedScent && typeof parsedScent === 'object') {
      initialScentTop = Array.isArray(parsedScent.top) ? parsedScent.top.join(', ') : (parsedScent.top || '');
      initialScentHeart = Array.isArray(parsedScent.heart) ? parsedScent.heart.join(', ') : (parsedScent.heart || '');
      initialScentBase = Array.isArray(parsedScent.base) ? parsedScent.base.join(', ') : (parsedScent.base || '');
    }

    // If still empty, attempt text extraction from description/short_description
    if (!initialScentTop && !initialScentHeart && !initialScentBase) {
      const fullText = [
        typeof product.short_description === 'string' ? product.short_description : '',
        typeof product.short_description === 'object' ? Object.values(product.short_description).join(' ') : '',
        typeof product.description === 'string' ? product.description : '',
        typeof product.description === 'object' ? Object.values(product.description).join(' ') : '',
        typeof product.attributes === 'object' ? JSON.stringify(product.attributes) : '',
      ].join(' ');

      const kopfMatch = fullText.match(/(?:Kopfnote|Top\s*Note|Topnote|افتتاحية|القمة)\s*:\s*([^:\n\r<]+?)(?=(?:Herznote|Basisnote|Heart\s*Note|Base\s*Note|Inhalt|EAN|Typ|القلب|القاعدة|<|\n|\r|$))/i);
      const herzMatch = fullText.match(/(?:Herznote|Heart\s*Note|Heartnote|القلب)\s*:\s*([^:\n\r<]+?)(?=(?:Basisnote|Base\s*Note|Inhalt|EAN|Typ|القاعدة|<|\n|\r|$))/i);
      const basisMatch = fullText.match(/(?:Basisnote|Base\s*Note|Basenote|القاعدة)\s*:\s*([^:\n\r<]+?)(?=(?:Inhalt|EAN|Typ|<|\n|\r|$))/i);

      if (kopfMatch) initialScentTop = kopfMatch[1].trim();
      if (herzMatch) initialScentHeart = herzMatch[1].trim();
      if (basisMatch) initialScentBase = basisMatch[1].trim();
    }

    setEditProduct({
      id: product.id,
      sku: product.sku || '',
      ean: product.ean || '',
      name_en: product.translations?.en || '',
      name_ar: product.translations?.ar || '',
      description_en: getFieldEn(product.description),
      description_ar: getFieldAr(product.description),
      short_description_en: getFieldEn(product.short_description),
      short_description_ar: getFieldAr(product.short_description),
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      admin_note: product.admin_note || '',
      scent_top: initialScentTop,
      scent_heart: initialScentHeart,
      scent_base: initialScentBase,
      category_id: existingCatIds[0] || product.category?.id || product.category_id || '',
      category_ids: existingCatIds,
      brand: product.attributes?.brand || '',
      attributes: product.attributes || {},
      sales_mode: product.attributes?.sales_mode || 'BOTH',
      variant_type: product.attributes?.type || '',
      product_type: productType,
      stock_quantity: product.stock_quantity || 0,
      net_sales_price: product.net_sales_price || 0,
      sales_price_with_tax: product.sales_price_with_tax || 0,
      b2b_price: product.b2b_price || 0,
      retail_price: product.retail_price || 0,
      b2bMinQty: product.b2bMinQty || 1,
      b2b_qty_mode: product.attributes?.b2b_qty_mode || 'VE',
      discount_percent: product.attributes?.discount_percent || '',
      shipping_cost: product.attributes?.shipping_cost ?? '',
      image_url: product.image_url || '',
      image_mode: 'url',
      uploadingImage: false,
      secondary_image_url: product.attributes?.additional_images?.[0] || '',
      secondary_image_mode: 'url',
      uploadingSecondaryImage: false,
      gallery_image_3_url: product.attributes?.additional_images?.[1] || '',
      gallery_image_3_mode: 'url',
      uploadingGalleryImage3: false,
      gallery_image_4_url: product.attributes?.additional_images?.[2] || '',
      gallery_image_4_mode: 'url',
      uploadingGalleryImage4: false,
      ebayCategoryId: product.attributes?.ebayCategoryId || product.attributes?.ebay_category_id || '',
      isDigital: product.attributes?.isDigital || false,
      isMultiUse: product.attributes?.isMultiUse || false,
      digitalKeysText: (() => {
        const soldKeysSet = new Set<string>();
        if (product.attributes?.soldKeys) {
          Object.values(product.attributes.soldKeys).forEach((kList: any) => {
            if (Array.isArray(kList)) {
              kList.forEach((k: string) => soldKeysSet.add(k.trim()));
            }
          });
        }
        const rawKeys: string[] = Array.isArray(product.attributes?.digitalKeys)
          ? product.attributes.digitalKeys
          : (typeof product.attributes?.digitalKeys === 'string' ? product.attributes.digitalKeys.split('\n').map((k: string) => k.trim()).filter(Boolean) : []);
        const unsoldKeys = product.attributes?.isMultiUse
          ? rawKeys
          : rawKeys.filter((k: string) => !soldKeysSet.has(k.trim()));
        return unsoldKeys.join('\n');
      })(),
      digitalInstructions_en: product.attributes?.digitalInstructions?.en || '',
      digitalInstructions_de: product.attributes?.digitalInstructions?.de || '',
      digitalInstructions_ar: product.attributes?.digitalInstructions?.ar || ''
    });

    // Fetch sold keys for this product if it's digital
    setSoldKeysData([]);
    if (product.attributes?.isDigital && product.id) {
      setSoldKeysLoading(true);
      axios.get(`${API_URL}/products/${product.id}/sold-keys`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => {
        setSoldKeysData(r.data || []);
      }).catch(() => {
        setSoldKeysData([]);
      }).finally(() => {
        setSoldKeysLoading(false);
      });
    }

    setIsEditModalOpen(true);
  };

  const handleEditProductImageUpload = async (file: File) => {
    if (!file) return;
    setEditProduct((prev: any) => ({ ...prev, uploadingImage: true }));
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      setEditProduct((prev: any) => ({
        ...prev,
        image_url: response.data.image_url,
        uploadingImage: false
      }));
      alert("Product image uploaded successfully!");
    } catch (error) {
      console.error(error);
      setEditProduct((prev: any) => ({ ...prev, uploadingImage: false }));
      alert("Failed to upload image.");
    }
  };

  const handleEditProductSecondaryImageUpload = async (file: File) => {
    if (!file) return;
    setEditProduct((prev: any) => ({ ...prev, uploadingSecondaryImage: true }));
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      setEditProduct((prev: any) => ({
        ...prev,
        secondary_image_url: response.data.image_url,
        uploadingSecondaryImage: false
      }));
      alert("Product hover image uploaded successfully!");
    } catch (error) {
      console.error(error);
      setEditProduct((prev: any) => ({ ...prev, uploadingSecondaryImage: false }));
      alert("Failed to upload image.");
    }
  };

  const handleEditProductGalleryImage3Upload = async (file: File) => {
    if (!file) return;
    setEditProduct((prev: any) => ({ ...prev, uploadingGalleryImage3: true }));
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      setEditProduct((prev: any) => ({
        ...prev,
        gallery_image_3_url: response.data.image_url,
        uploadingGalleryImage3: false
      }));
      alert("Gallery image 3 uploaded successfully!");
    } catch (error) {
      console.error(error);
      setEditProduct((prev: any) => ({ ...prev, uploadingGalleryImage3: false }));
      alert("Failed to upload image.");
    }
  };

  const handleEditProductGalleryImage4Upload = async (file: File) => {
    if (!file) return;
    setEditProduct((prev: any) => ({ ...prev, uploadingGalleryImage4: true }));
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });

      setEditProduct((prev: any) => ({
        ...prev,
        gallery_image_4_url: response.data.image_url,
        uploadingGalleryImage4: false
      }));
      alert("Gallery image 4 uploaded successfully!");
    } catch (error) {
      console.error(error);
      setEditProduct((prev: any) => ({ ...prev, uploadingGalleryImage4: false }));
      alert("Failed to upload image.");
    }
  };

  const handleEditProductMultipleUpload = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, 4);
    if (fileArray.length === 0) return;

    const slots = ["image_url", "secondary_image_url", "gallery_image_3_url", "gallery_image_4_url"];
    const loadingKeys = ["uploadingImage", "uploadingSecondaryImage", "uploadingGalleryImage3", "uploadingGalleryImage4"];

    let emptySlotIndices: number[] = [];
    setEditProduct((prev: any) => {
      slots.forEach((s, idx) => {
        if (!prev[s]) {
          emptySlotIndices.push(idx);
        }
      });
      if (emptySlotIndices.length === 0) {
        emptySlotIndices = [0, 1, 2, 3];
      }

      const updated = { ...prev };
      for (let i = 0; i < Math.min(fileArray.length, emptySlotIndices.length); i++) {
        const slotIdx = emptySlotIndices[i];
        updated[loadingKeys[slotIdx]] = true;
        updated[slots[slotIdx] + "_mode"] = "upload";
      }
      return updated;
    });

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const uploadedUrl = await uploadSingleFile(file);
        setEditProduct((prev: any) => {
          const updated = { ...prev };
          let targetSlotIdx = -1;
          for (let j = 0; j < 4; j++) {
            if (updated[loadingKeys[j]] && !updated[slots[j]]) {
              targetSlotIdx = j;
              break;
            }
          }
          if (targetSlotIdx === -1) {
            for (let j = 0; j < 4; j++) {
              if (!updated[slots[j]]) {
                targetSlotIdx = j;
                break;
              }
            }
          }
          if (targetSlotIdx === -1) {
            targetSlotIdx = i % 4;
          }

          updated[slots[targetSlotIdx]] = uploadedUrl;
          updated[loadingKeys[targetSlotIdx]] = false;
          return updated;
        });
      } catch (err) {
        console.error(err);
        setEditProduct((prev: any) => {
          const updated = { ...prev };
          loadingKeys.forEach(k => { updated[k] = false; });
          return updated;
        });
        alert("Failed to upload some images.");
        break;
      }
    }
  };

  const swapEditProductImages = (slot1: number, slot2: number) => {
    setEditProduct((prev: any) => {
      const getKeys = (slot: number) => {
        if (slot === 0) return ["image_url", "image_mode"];
        if (slot === 1) return ["secondary_image_url", "secondary_image_mode"];
        if (slot === 2) return ["gallery_image_3_url", "gallery_image_3_mode"];
        return ["gallery_image_4_url", "gallery_image_4_mode"];
      };

      const [k1Url, k1Mode] = getKeys(slot1);
      const [k2Url, k2Mode] = getKeys(slot2);

      const val1Url = prev[k1Url];
      const val1Mode = prev[k1Mode];

      return {
        ...prev,
        [k1Url]: prev[k2Url],
        [k1Mode]: prev[k2Mode],
        [k2Url]: val1Url,
        [k2Mode]: val1Mode
      };
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        category_id: editProduct.category_ids[0] || editProduct.category_id,
        category_ids: editProduct.category_ids,
        sku: editProduct.sku,
        ean: editProduct.ean || undefined,
        image_url: editProduct.image_url || undefined,
        translations: {
          en: editProduct.name_en,
          ar: editProduct.name_ar || undefined
        },
        description: {
          en: editProduct.description_en || undefined,
          ar: editProduct.description_ar || undefined
        },
        short_description: {
          en: editProduct.short_description_en || undefined,
          ar: editProduct.short_description_ar || undefined
        },
        tags: editProduct.tags ? editProduct.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        net_sales_price: parseWooCommerceNumber(editProduct.net_sales_price),
        sales_price_with_tax: parseWooCommerceNumber(editProduct.sales_price_with_tax),
        b2b_price: parseWooCommerceNumber(editProduct.b2b_price),
        retail_price: editProduct.retail_price ? parseWooCommerceNumber(editProduct.retail_price) : null,
        stock_quantity: (editProduct.isDigital && !editProduct.isMultiUse && editProduct.digitalKeysText && editProduct.digitalKeysText.trim().length > 0)
          ? (editProduct.digitalKeysText || '').split('\n').map((k: string) => k.trim()).filter(Boolean).length
          : Math.round(parseWooCommerceNumber(editProduct.stock_quantity) || 0),
        b2bMinQty: editProduct.b2bMinQty ? Math.round(parseWooCommerceNumber(editProduct.b2bMinQty)) : 1,
        attributes: {
          ...(editProduct.attributes || {}),
          type: editProduct.product_type === 'standard_multi' ? editProduct.variant_type : null,
          parent_sku: editProduct.product_type === 'standard_multi' ? (editProduct.attributes?.parent_sku || editProduct.sku) : null,
          is_sample: editProduct.product_type === 'sample' ? true : false,
          additional_images: [
            editProduct.secondary_image_url,
            editProduct.gallery_image_3_url,
            editProduct.gallery_image_4_url
          ].filter(Boolean),
          brand: editProduct.brand || undefined,
          discount_percent: editProduct.discount_percent ? parseFloat(editProduct.discount_percent) : undefined,
          shipping_cost: editProduct.shipping_cost ? parseFloat(editProduct.shipping_cost) : undefined,
          sales_mode: editProduct.sales_mode || 'BOTH',
          ebayCategoryId: editProduct.ebayCategoryId || undefined,
          isDigital: editProduct.isDigital || false,
          isMultiUse: editProduct.isMultiUse || false,
          digitalKeys: editProduct.isDigital ? (editProduct.digitalKeysText || '').split('\n').map((k: string) => k.trim()).filter(Boolean) : [],
          digitalInstructions: {
            en: editProduct.digitalInstructions_en || '',
            de: editProduct.digitalInstructions_de || '',
            ar: editProduct.digitalInstructions_ar || ''
          },
          b2b_qty_mode: editProduct.b2b_qty_mode || 'VE'
        },
        sync_variants: syncAllVariants,
        admin_note: editProduct.admin_note || '',
        scent_notes: {
          top: editProduct.scent_top || '',
          heart: editProduct.scent_heart || '',
          base: editProduct.scent_base || ''
        }
      };

      await axios.put(`${API_URL}/products/${editProduct.id}`, payload, { headers });
      setIsEditModalOpen(false);
      fetchProducts();
      alert("Product updated successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update product.");
    }
  };

  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_subtotal: 0,
    expires_at: '',
    max_uses_per_user: 1,
    max_uses_total: 0
  });

  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [orderEditForm, setOrderEditForm] = useState<any>({
    customer: '',
    email: '',
    phone: '',
    address: '',
    type: 'Retail'
  });

  const startEditingOrder = () => {
    if (!selectedOrder) return;
    setOrderEditForm({
      customer: selectedOrder.customer,
      email: selectedOrder.email,
      phone: selectedOrder.phone || '',
      address: selectedOrder.address || '',
      type: selectedOrder.type === 'B2B' ? 'Wholesale' : 'Retail'
    });
    setIsEditingOrder(true);
  };

  const handleSaveOrderDetails = async () => {
    if (!selectedOrder) return;

    const uiOrder = orders.find(o => o.id === selectedOrder.id);
    const dbId = uiOrder?.db_id;

    if (dbId) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const payload = {
          customer_name: orderEditForm.customer,
          customer_email: orderEditForm.email,
          customer_phone: orderEditForm.phone,
          shipping_address: orderEditForm.address,
          order_type: orderEditForm.type
        };

        await axios.put(`${API_URL}/orders/${dbId}`, payload, { headers });
      } catch (error) {
        console.error("Failed to update order in database:", error);
        alert("Failed to save to database. Updating local view only.");
      }
    }

    const updatedOrders = orders.map((o: any) => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          customer: orderEditForm.customer,
          email: orderEditForm.email,
          phone: orderEditForm.phone,
          address: orderEditForm.address,
          type: orderEditForm.type === 'Wholesale' ? 'B2B' : 'Retail'
        };
      }
      return o;
    });

    setOrders(updatedOrders);

    setSelectedOrder({
      ...selectedOrder,
      customer: orderEditForm.customer,
      email: orderEditForm.email,
      phone: orderEditForm.phone,
      address: orderEditForm.address,
      type: orderEditForm.type === 'Wholesale' ? 'B2B' : 'Retail'
    });

    setIsEditingOrder(false);
    alert("Order details updated successfully!");
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/orders`, { headers });

      const formatted = response.data.map((o: any) => {
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : '';

        const total = parseFloat(o.total_amount);
        const shipping = parseFloat(o.shipping_amount);
        const subtotal = total - shipping;

        // Calculate tax based on vatConfig rate
        const rate = vatConfig?.rate || 19;
        const tax = subtotal * rate / (100 + rate);

        return {
          id: `#ORD-${o.id.substring(0, 6).toUpperCase()}`,
          db_id: o.id,
          customer: o.customer_name || 'Anonymous Customer',
          email: o.customer_email || 'N/A',
          phone: o.customer_phone || 'N/A',
          address: o.shipping_address || 'N/A',
          date: dateStr,
          total: `€${total.toFixed(2)}`,
          status: o.status === 'PAID' ? 'Processing' : o.status === 'PENDING' ? 'Pending' : o.status === 'SHIPPED' ? 'Shipped' : o.status === 'DELIVERED' ? 'Delivered' : o.status === 'CANCELLED' ? 'Cancelled' : o.status,
          type: o.order_type === 'Wholesale' ? 'B2B' : 'Retail',
          coupon_code: o.coupon_code || null,
          discount_amount: o.discount_amount ? parseFloat(o.discount_amount) : 0,
          shipping_provider: o.shipping_provider || null,
          tracking_number: o.tracking_number || null,
          items: o.items.map((i: any) => ({
            id: i.id,
            product_id: i.product_id,
            name: i.name,
            sku: i.sku || 'N/A',
            quantity: i.quantity,
            price: parseFloat(i.unit_price),
            total: parseFloat(i.total_price)
          })),
          subtotal: `€${subtotal.toFixed(2)}`,
          shipping: `€${shipping.toFixed(2)}`,
          tax: `€${tax.toFixed(2)}`
        };
      });
      setOrders(formatted);
    } catch (error) {
      console.error("Failed to fetch dynamic orders:", error);
    }
  };

  const fetchLogs = async (page = 1, category = 'all', search = '') => {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params: any = { page, limit: LOGS_PER_PAGE };
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;
      const res = await axios.get(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setLogsData(res.data.data || []);
      setLogsTotal(res.data.total || 0);
      setLogsPage(res.data.page || 1);
      setLogsPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/logs/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogsStats(res.data);
    } catch (err) {
      console.error('Failed to fetch log stats:', err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/coupons`, { headers });
      setCoupons(response.data);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_value) {
      alert("Please fill code and discount value.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        code: newCoupon.code,
        discount_type: newCoupon.discount_type,
        discount_value: Number(newCoupon.discount_value),
        min_order_subtotal: newCoupon.min_order_subtotal > 0 ? Number(newCoupon.min_order_subtotal) : undefined,
        expires_at: newCoupon.expires_at || undefined,
        max_uses_per_user: newCoupon.max_uses_per_user > 0 ? Number(newCoupon.max_uses_per_user) : null,
        max_uses_total: newCoupon.max_uses_total > 0 ? Number(newCoupon.max_uses_total) : null
      };

      await axios.post(`${API_URL}/coupons`, payload, { headers });
      setNewCoupon({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_subtotal: 0,
        expires_at: '',
        max_uses_per_user: 1,
        max_uses_total: 0
      });
      fetchCoupons();
      alert("Coupon created successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create coupon.");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/coupons/${id}`, { headers });
      fetchCoupons();
      alert("Coupon deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to delete coupon.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'Shipped') {
      const uiOrder = orders.find(o => o.id === orderId);
      setShipOrderId(orderId);

      const orderHasDigital = uiOrder?.items?.some((item: any) => {
        const dbProd = products.find(p => p.id === item.product_id);
        return dbProd?.attributes?.isDigital || false;
      }) || uiOrder?.items?.some((i: any) => /key|digital|license|windows|esd|software/i.test(i.name || '')) || false;

      let existingKey = '';
      let existingInstructions = '';
      if (uiOrder) {
        for (const item of uiOrder.items || []) {
          const dbProd = products.find(p => p.id === item.product_id);
          const soldMap = dbProd?.attributes?.soldKeys || {};
          const keys = soldMap[uiOrder.db_id] || soldMap[uiOrder.id] || [];
          if (keys.length > 0) {
            existingKey = keys.join('\n');
          }

          // If no key is assigned yet, auto-fetch available unsold key from product stock if present
          if (!existingKey && dbProd?.attributes) {
            const attrs = dbProd.attributes;
            const allStockKeys: string[] = Array.isArray(attrs.digitalKeys)
              ? attrs.digitalKeys
              : (typeof attrs.digitalKeys === 'string' ? attrs.digitalKeys.split('\n').map((k: string) => k.trim()).filter(Boolean) : []);

            if (allStockKeys.length > 0) {
              const allSoldKeysSet = new Set<string>();
              Object.values(soldMap).forEach((kList: any) => {
                if (Array.isArray(kList)) {
                  kList.forEach((k: string) => allSoldKeysSet.add(k.trim()));
                }
              });

              const unsoldKeys = allStockKeys.filter(k => !allSoldKeysSet.has(k.trim()));
              const qtyNeeded = item.quantity || 1;
              const keysToAssign = unsoldKeys.slice(0, qtyNeeded);

              if (keysToAssign.length > 0) {
                existingKey = keysToAssign.join('\n');
              }
            }
          }

          const orderInstMap = dbProd?.attributes?.digitalInstructionsOrder || {};
          const instForOrder = orderInstMap[uiOrder.db_id] || orderInstMap[uiOrder.id];
          const generalInst = dbProd?.attributes?.digitalInstructions?.ar 
            || dbProd?.attributes?.digitalInstructions?.de 
            || dbProd?.attributes?.digitalInstructions?.en
            || (typeof dbProd?.attributes?.digitalInstructions === 'string' ? dbProd?.attributes?.digitalInstructions : '');
          if (instForOrder || generalInst) {
            existingInstructions = instForOrder || generalInst;
            break;
          }
        }
      }

      const defaultTemplate = `Installations- & Aktivierungsanleitung:

1. Öffnen Sie die offizielle Aktivierungsseite: https://setup.office.com
2. Geben Sie Ihren gekauften Produktschlüssel ein.
3. Folgen Sie den Anweisungen auf dem Bildschirm zur Fertigstellung.

Vielen Dank für Ihren Einkauf! Bei Fragen steht Ihnen unser Support gerne zur Verfügung.`;

      if (orderHasDigital) {
        setShipFulfillmentMode('digital');
        setCourierName(uiOrder?.shipping_provider || 'Digital Key Delivery');
        setDigitalKeyValue(existingKey || uiOrder?.tracking_number || '');
        setDigitalInstructionsInput(existingInstructions || defaultTemplate);
        setTrackingNumberInput(existingKey || uiOrder?.tracking_number || '');
      } else {
        setShipFulfillmentMode('physical');
        setCourierName(uiOrder?.shipping_provider || 'GLS Premium Express');
        setDigitalKeyValue(existingKey || '');
        setDigitalInstructionsInput(existingInstructions || defaultTemplate);
        setTrackingNumberInput(uiOrder?.tracking_number || `DE${Math.floor(100000000 + Math.random() * 900000000)}GLS`);
      }

      setIsShipPromptOpen(true);
      return;
    }

    const uiOrder = orders.find(o => o.id === orderId);
    if (!uiOrder) return;
    const dbId = uiOrder.db_id;

    if (dbId) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        await axios.put(`${API_URL}/orders/${dbId}/status`, { status: newStatus }, { headers });
      } catch (error) {
        console.error("Failed to update order status in database:", error);
        alert("Failed to update status on server. Updating local view only.");
      }
    }

    const updated = orders.map((o: any) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    alert("Order status updated successfully!");
  };

  const handleDeleteOrder = async (orderId: string, dbId: string) => {
    const confirmDelete = window.confirm(
      `Möchten Sie diese Bestellung wirklich dauerhaft löschen? / Are you sure you want to permanently delete order ${orderId}?`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/orders/${dbId}`, { headers });
      alert("Bestellung erfolgreich gelöscht! / Order deleted successfully!");
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete order.");
    }
  };

  const handleSaveShipDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipOrderId) return;

    const uiOrder = orders.find(o => o.id === shipOrderId);
    if (!uiOrder) return;
    const dbId = uiOrder.db_id;

    const isDigital = shipFulfillmentMode === 'digital';
    const finalKey = digitalKeyValue.trim();
    const finalInstructions = digitalInstructionsInput.trim();
    const finalTracking = isDigital
      ? (finalKey || trackingNumberInput.trim())
      : trackingNumberInput.trim();
    const finalCourier = courierName.trim() || (isDigital ? 'Digital Key Delivery' : 'GLS Premium Express');

    if (dbId) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        await axios.put(`${API_URL}/orders/${dbId}/ship`, {
          shipping_provider: finalCourier,
          tracking_number: finalTracking,
          digital_keys: isDigital ? finalKey : undefined,
          digital_instructions: isDigital ? finalInstructions : undefined
        }, { headers });
      } catch (error) {
        console.error("Failed to save shipping details in database:", error);
        alert("Failed to update shipping details on server. Updating local view only.");
      }
    }

    if (isDigital) {
      const keysArr = finalKey ? finalKey.split('\n').map(k => k.trim()).filter(Boolean) : [];
      setProducts(prevProducts => prevProducts.map(p => {
        const isProductInOrder = uiOrder.items?.some((i: any) => i.product_id === p.id);
        if (isProductInOrder) {
          const attrs = { ...(p.attributes || {}) };
          const soldKeys = { ...(attrs.soldKeys || {}) };
          const instOrder = { ...(attrs.digitalInstructionsOrder || {}) };
          let newDigitalKeys = attrs.digitalKeys || [];
          let newStockQuantity = p.stock_quantity;

          if (keysArr.length > 0) {
            soldKeys[uiOrder.id] = keysArr;
            if (dbId) soldKeys[dbId] = keysArr;

            if (!attrs.isMultiUse) {
              const keysSet = new Set(keysArr.map(k => k.trim()));
              const currentKeys: string[] = Array.isArray(attrs.digitalKeys)
                ? attrs.digitalKeys
                : (typeof attrs.digitalKeys === 'string' ? attrs.digitalKeys.split('\n').map((k: string) => k.trim()).filter(Boolean) : []);
              
              newDigitalKeys = currentKeys.filter((k: string) => !keysSet.has(k.trim()));
              newStockQuantity = newDigitalKeys.length;
            }
          }
          if (finalInstructions) {
            instOrder[uiOrder.id] = finalInstructions;
            if (dbId) instOrder[dbId] = finalInstructions;
          }
          return {
            ...p,
            stock_quantity: newStockQuantity,
            attributes: {
              ...attrs,
              isDigital: true,
              digitalKeys: newDigitalKeys,
              soldKeys,
              digitalInstructionsOrder: instOrder
            }
          };
        }
        return p;
      }));
    }

    const updated = orders.map((o: any) => {
      if (o.id === shipOrderId) {
        return {
          ...o,
          status: 'Shipped',
          shipping_provider: finalCourier,
          tracking_number: finalTracking
        };
      }
      return o;
    });

    setOrders(updated);

    if (selectedOrder && selectedOrder.id === shipOrderId) {
      setSelectedOrder({
        ...selectedOrder,
        status: 'Shipped',
        shipping_provider: finalCourier,
        tracking_number: finalTracking
      });
    }

    setIsShipPromptOpen(false);
    setShipOrderId(null);
    alert(isDigital
      ? "Digital Key delivery confirmed and invoice email sent to customer!"
      : "Order status updated to Shipped and tracking information saved!");
  };

  const handleResendInvoiceEmail = async (order: any) => {
    if (!order) return;
    const dbId = order.db_id;

    if (!dbId) {
      alert(`This is a mock order. Showing success simulation for sending to: ${order.email}`);
      return;
    }

    setEmailSending(true);
    setEmailSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${API_URL}/orders/${dbId}/resend-email`, {}, { headers });

      setEmailSuccess(`Invoice has been successfully sent to: ${order.email}`);
      alert(`Invoice has been successfully sent to: ${order.email}`);
    } catch (error) {
      console.error("Failed to resend email:", error);
      alert("Failed to send email. Check SMTP settings and customer email validity.");
    } finally {
      setEmailSending(false);
    }
  };

  const handlePrintInvoice = (order: any) => {
    if (!order) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocked! Please allow popups to print the invoice.");
      return;
    }

    // Invoice translations map
    const invoiceTranslations: Record<string, any> = {
      en: {
        invoice: "INVOICE",
        billedTo: "Billed To / Ship To",
        issuedBy: "Issued By",
        representedBy: "Represented by",
        phone: "Phone",
        email: "Email",
        taxId: "Tax ID",
        vatId: "VAT ID",
        date: "Date",
        productDescription: "Product Description",
        qty: "Qty",
        unitPrice: "Unit Price",
        totalPrice: "Total Price",
        subtotal: "Subtotal",
        shippingHandling: "Shipping & Handling",
        complimentary: "Complimentary",
        discount: "Discount",
        vatTaxIncluded: "VAT Tax Included (19%)",
        grandTotal: "Grand Total",
        shippingDetails: "Shipping & Fulfillment Details:",
        carrier: "Carrier",
        tracking: "Tracking",
        thankYou: "Thank you for choosing BS Baristore!",
        dir: "ltr",
        alignLeft: "left",
        alignRight: "right",
        alignLeftStyle: "text-align: left;",
        alignRightStyle: "text-align: right;"
      },
      de: {
        invoice: "RECHNUNG",
        billedTo: "Rechnungs- & Lieferadresse",
        issuedBy: "Ausgestellt von",
        representedBy: "Vertreten durch",
        phone: "Telefon",
        email: "E-Mail",
        taxId: "Steuernummer",
        vatId: "USt-IdNr.",
        date: "Datum",
        productDescription: "Produktbeschreibung",
        qty: "Menge",
        unitPrice: "Einzelpreis",
        totalPrice: "Gesamtpreis",
        subtotal: "Zwischensumme",
        shippingHandling: "Versand & Bearbeitung",
        complimentary: "Kostenlos",
        discount: "Rabatt",
        vatTaxIncluded: "Inklusive MwSt. (19%)",
        grandTotal: "Gesamtsumme",
        shippingDetails: "Versand- & Lieferungsdetails:",
        carrier: "Versanddienstleister",
        tracking: "Sendungsnummer",
        thankYou: "Vielen Dank für Ihren Einkauf bei BS Baristore!",
        dir: "ltr",
        alignLeft: "left",
        alignRight: "right",
        alignLeftStyle: "text-align: left;",
        alignRightStyle: "text-align: right;"
      },
      ar: {
        invoice: "فاتورة شراء",
        billedTo: "الفاتورة إلى / الشحن إلى",
        issuedBy: "صادر عن",
        representedBy: "الممثل القانوني",
        phone: "الهاتف",
        email: "البريد الإلكتروني",
        taxId: "الرقم الضريبي المحلي",
        vatId: "رقم ضريبة القيمة المضافة (USt-IdNr)",
        date: "التاريخ",
        productDescription: "وصف المنتج",
        qty: "الكمية",
        unitPrice: "سعر الوحدة",
        totalPrice: "السعر الإجمالي",
        subtotal: "المجموع الفرعي",
        shippingHandling: "الشحن والتسليم",
        complimentary: "مجاني",
        discount: "خصم",
        vatTaxIncluded: "شامل ضريبة القيمة المضافة (19%)",
        grandTotal: "المجموع الكلي",
        shippingDetails: "تفاصيل الشحن والتسليم:",
        carrier: "شركة الشحن",
        tracking: "رقم التتبع",
        thankYou: "شكراً لتعاملكم مع BS Baristore!",
        dir: "rtl",
        alignLeft: "right",
        alignRight: "left",
        alignLeftStyle: "text-align: right; direction: rtl;",
        alignRightStyle: "text-align: left; direction: ltr;"
      },
      fr: {
        invoice: "FACTURE",
        billedTo: "Facturé à / Expédié à",
        issuedBy: "Émis par",
        representedBy: "Représenté par",
        phone: "Téléphone",
        email: "E-mail",
        taxId: "Numéro fiscal",
        vatId: "N° TVA",
        date: "Date",
        productDescription: "Description du produit",
        qty: "Qté",
        unitPrice: "Prix unitaire",
        totalPrice: "Prix total",
        subtotal: "Sous-total",
        shippingHandling: "Frais de port & Manutention",
        complimentary: "Gratuit",
        discount: "Remise",
        vatTaxIncluded: "TVA incluse (19%)",
        grandTotal: "Total général",
        shippingDetails: "Détails de livraison:",
        carrier: "Transporteur",
        tracking: "Numéro de suivi",
        thankYou: "Merci d'avoir choisi BS Baristore !",
        dir: "ltr",
        alignLeft: "left",
        alignRight: "right",
        alignLeftStyle: "text-align: left;",
        alignRightStyle: "text-align: right;"
      },
      nl: {
        invoice: "FACTUUR",
        billedTo: "Gefactureerd aan / Verzonden naar",
        issuedBy: "Uitgegeven door",
        representedBy: "Vertegenwoordigd door",
        phone: "Telefoon",
        email: "E-mail",
        taxId: "Belastingnummer",
        vatId: "Btw-nr",
        date: "Datum",
        productDescription: "Productomschrijving",
        qty: "Aantal",
        unitPrice: "Unit Prijs",
        totalPrice: "Totaal Prijs",
        subtotal: "Subtotaal",
        shippingHandling: "Verzending & Afhandeling",
        complimentary: "Gratis",
        discount: "Korting",
        vatTaxIncluded: "Inclusief btw (19%)",
        grandTotal: "Eindtotaal",
        shippingDetails: "Verzenddetails:",
        carrier: "Vervoerder",
        tracking: "Volgnummer",
        thankYou: "Bedankt dat u voor BS Baristore heeft gekozen!",
        dir: "ltr",
        alignLeft: "left",
        alignRight: "right",
        alignLeftStyle: "text-align: left;",
        alignRightStyle: "text-align: right;"
      }
    };

    const orderLocale = order.locale && invoiceTranslations[order.locale] ? order.locale : 'de';
    const t = invoiceTranslations[orderLocale];

    const invoiceNumber = `INV-2026-${(order.db_id || order.id).substring(0, 6).toUpperCase()}`;
    const invoiceLogoSrc = logoUrl 
      ? (resolveImageUrl(logoUrl).startsWith('http') ? resolveImageUrl(logoUrl) : `${window.location.origin}${resolveImageUrl(logoUrl)}`)
      : null;
    
    // Format date string dynamically based on locale
    const dateStr = order.created_at || order.date 
      ? new Date(order.created_at || order.date).toLocaleDateString(orderLocale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : new Date().toLocaleDateString(orderLocale);

    const subtotalVal = parseFloat(String(order.subtotal || order.total).replace(/[^0-9.]/g, '')) || 0;
    const shippingVal = parseFloat(String(order.shipping || '0').replace(/[^0-9.]/g, '')) || 0;
    const totalVal = parseFloat(String(order.total).replace(/[^0-9.]/g, '')) || 0;
    const discountVal = order.discount_amount || 0;

    const itemsRows = order.items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; color: #1c1917; ${t.alignLeftStyle}">
          <div style="font-weight: 600;">${item.name}</div>
          ${item.sku && item.sku !== 'N/A' ? `<div style="font-size: 9px; color: #78716c; font-family: monospace; margin-top: 2px;">SKU: ${item.sku}</div>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #1c1917;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: ${t.alignRight}; font-family: monospace; color: #1c1917; ${t.alignRightStyle}">€${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f3f4f6; text-align: ${t.alignRight}; font-family: monospace; font-weight: bold; color: #1c1917; ${t.alignRightStyle}">€${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const vatVal = subtotalVal * 19 / 119;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${orderLocale}" dir="${t.dir}">
      <head>
        <title>Invoice - ${invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1c1917;
            margin: 0;
            padding: 40px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 2px solid #f5f5f4;
            padding-bottom: 24px;
            margin-bottom: 32px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-box {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .logo-badge {
            background: #d40026;
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 900;
            font-size: 16px;
            letter-spacing: -0.5px;
            display: inline-block;
          }
          .logo-text {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            font-weight: 800;
            color: #0c0a09;
            margin: 0;
            letter-spacing: 0.5px;
            display: inline-block;
          }
          .logo {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #1c1917;
            margin: 0;
          }
          .logo span {
            color: #d40026;
          }
          .subtitle {
            font-size: 10px;
            color: #78716c;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 4px 0 0 0;
            font-weight: 600;
          }
          .invoice-title {
            text-align: ${t.alignRight};
          }
          .invoice-title h1 {
            font-size: 24px;
            font-weight: 800;
            color: #10b981;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .invoice-title p {
            font-size: 12px;
            color: #78716c;
            margin: 4px 0 0 0;
            font-family: monospace;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .info-block h3 {
            font-size: 10px;
            font-weight: 700;
            color: #a8a29e;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 0 0 8px 0;
            border-bottom: 1px solid #f5f5f4;
            padding-bottom: 4px;
          }
          .info-block p {
            font-size: 12px;
            line-height: 1.6;
            margin: 0;
            color: #44403c;
          }
          .info-block strong {
            color: #1c1917;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          th {
            background: #fafaf9;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #78716c;
            padding: 12px 10px;
            text-align: ${t.alignLeft};
            border-bottom: 2px solid #e7e5e4;
          }
          td {
            font-size: 12px;
            padding: 14px 10px;
          }
          .financials {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 20px;
            margin-bottom: 40px;
          }
          .financials-table {
            width: 100%;
            font-size: 12px;
            color: #44403c;
          }
          .financials-table td {
            padding: 6px 0;
            border: none;
          }
          .financials-table tr.total-row td {
            font-size: 16px;
            font-weight: 800;
            color: #1c1917;
            border-top: 1px solid #e7e5e4;
            padding-top: 12px;
          }
          .financials-table tr.total-row .amount {
            color: #10b981;
          }
          .footer {
            border-top: 1px solid #f5f5f4;
            padding-top: 24px;
            text-align: center;
            font-size: 10px;
            color: #a8a29e;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1.8;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container" dir="${t.dir}">
          <div class="header">
            <div style="text-align: ${t.alignLeft};">
              ${invoiceLogoSrc ? `
                <img src="${invoiceLogoSrc}" alt="BS Baristore" style="max-height: 48px; width: auto; object-fit: contain; margin-bottom: 4px;" onerror="this.style.display='none'" />
              ` : ''}
              <div class="logo-box" ${invoiceLogoSrc ? 'style="display:none;"' : ''}>
                <span class="logo-badge">BS</span>
                <span class="logo-text">Baristore</span>
              </div>
              <p class="subtitle">Universal Wholesale & Retail</p>
            </div>
            <div class="invoice-title">
              <h1>${t.invoice}</h1>
              <p>${invoiceNumber}</p>
            </div>
          </div>

          <div class="grid">
            <div class="info-block" style="text-align: ${t.alignLeft};">
              <h3>${t.billedTo}</h3>
              <p>
                <strong>${order.customer}</strong><br/>
                Email: ${order.email}<br/>
                Phone: ${order.phone || 'N/A'}<br/>
                <strong>${t.billedTo.includes('الشحن') ? 'عنوان الشحن' : t.billedTo.includes('Lieferadresse') ? 'Lieferadresse' : 'Shipping Address'}:</strong><br/>
                ${order.address}
              </p>
            </div>
            <div class="info-block" style="${t.dir === 'rtl' ? 'border-right: 1px solid #f5f5f4; padding-right: 20px;' : 'border-left: 1px solid #f5f5f4; padding-left: 20px;'} text-align: ${t.alignLeft};">
              <h3>${t.issuedBy}</h3>
              <p>
                <strong>barigroup.net</strong><br/>
                ${t.representedBy}: Kamal Abdalbary<br/>
                Zeppelinstraße 62, 52068 Aachen, Germany<br/>
                ${t.phone}: +49 152524 11886<br/>
                ${t.vatId}: DE436103705<br/>
                LUCID: DE4769331655434<br/>
                Email: service@barigroup.net<br/>
                <strong>${t.date}:</strong> ${dateStr}
              </p>
            </div>
          </div>

          <table dir="${t.dir}">
            <thead>
              <tr>
                <th style="text-align: ${t.alignLeft};">${t.productDescription}</th>
                <th style="text-align: center; width: 60px;">${t.qty}</th>
                <th style="text-align: ${t.alignRight}; width: 100px; ${t.alignRightStyle}">${t.unitPrice}</th>
                <th style="text-align: ${t.alignRight}; width: 120px; ${t.alignRightStyle}">${t.totalPrice}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="financials" dir="${t.dir}">
            <div style="text-align: ${t.alignLeft};">
              ${order.shipping_provider && order.tracking_number ? `
                <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 6px; padding: 14px; font-size: 11px; line-height: 1.5; text-align: ${t.alignLeft};">
                  <strong style="display: block; color: #1c1917; margin-bottom: 4px;">🚚 ${t.shippingDetails}</strong>
                  ${t.carrier}: <strong>${order.shipping_provider}</strong><br/>
                  ${t.tracking}: <span style="font-family: monospace; font-weight: bold; color: #10b981;">${order.tracking_number}</span>
                </div>
              ` : ''}
            </div>
            <div>
              <table class="financials-table" dir="${t.dir}">
                <tr>
                  <td style="text-align: ${t.alignLeft};">${t.subtotal}</td>
                  <td style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">€${subtotalVal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="text-align: ${t.alignLeft};">${t.shippingHandling}</td>
                  <td style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">${shippingVal === 0 ? t.complimentary : `€${shippingVal.toFixed(2)}`}</td>
                </tr>
                ${discountVal > 0 ? `
                  <tr style="color: #10b981; font-weight: 600;">
                    <td style="text-align: ${t.alignLeft};">${t.discount} (${order.coupon_code || 'N/A'})</td>
                    <td style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">-€${discountVal.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="color: #78716c; font-style: italic; font-size: 11px; text-align: ${t.alignLeft};">${t.vatTaxIncluded}</td>
                  <td style="text-align: ${t.alignRight}; font-family: monospace; color: #78716c; font-style: italic; font-size: 11px; ${t.alignRightStyle}">€${vatVal.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td style="text-align: ${t.alignLeft};">${t.grandTotal}</td>
                  <td class="amount" style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">€${totalVal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <div class="footer">
            ${t.thankYou}<br/>
            barigroup.net &bull; Zeppelinstraße 62, 52068 Aachen &bull; USt-IdNr.: DE436103705 &bull; LUCID: DE4769331655434 &bull; service@barigroup.net
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredOrders = (orders || []).filter((order: any) => {
    if (!order) return false;
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const id = String(order.id || '').toLowerCase();
      const customer = typeof order.customer === 'string' ? order.customer.toLowerCase() : JSON.stringify(order.customer || '').toLowerCase();
      const status = String(order.status || '').toLowerCase();
      const type = String(order.type || '').toLowerCase();
      matchesSearch = id.includes(query) || customer.includes(query) || status.includes(query) || type.includes(query);
    }

    let matchesType = true;
    if (orderFilter !== 'all') {
      matchesType = order.type === orderFilter;
    }

    let matchesStatus = true;
    if (orderStatusFilter !== 'all') {
      matchesStatus = order.status === orderStatusFilter;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const ORDERS_PER_PAGE = 15;
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE);

  if (!authorized) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // Real dynamic values for Dashboard
  const totalRevenue = orders.reduce((acc, order) => {
    const val = parseFloat(String(order.total).replace(/[^0-9.-]+/g, ""));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(1)}K`;
    return `€${val.toFixed(2)}`;
  };

  const activeB2B = customers.filter(c => c.role === 'SELLER').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

  const inventoryValue = products.reduce((acc, p) => {
    const qty = p.stock_quantity || 0;
    const price = p.b2b_price || p.net_sales_price || 0;
    return acc + (qty * price);
  }, 0);

  const recentB2BApps = customers
    .filter(c => c.role === 'SELLER' || c.role === 'CUSTOMER')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar Navigation Backdrop Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-black/55 backdrop-blur-xs z-30 md:hidden"
          style={{ top: '156px' }}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`w-64 bg-[#111625] text-stone-300 flex flex-col fixed left-0 top-[156px] h-[calc(100vh-156px)] z-40 transition-transform duration-300 md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 border-b border-white/10">
          <h2 className="text-white text-xl font-serif font-bold tracking-wide">BS Baristore<span className="text-[#d40026]">.ERP</span></h2>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Overview', type: 'link' as const },
            {
              id: 'catalog',
              icon: Package,
              label: 'Catalog & Products',
              type: 'group' as const,
              items: [
                { id: 'products', label: 'Product Inventory' },
                { id: 'categories', label: 'Categories Settings' }
              ]
            },
            {
              id: 'sales',
              icon: ShoppingCart,
              label: 'Sales & Billing',
              type: 'group' as const,
              items: [
                { id: 'orders', label: 'Orders & Fulfillment' },
                { id: 'invoices', label: 'Invoices & Billing' }
              ]
            },
            { id: 'customers', icon: Users, label: 'B2B Partners', type: 'link' as const },
            { id: 'reviews', icon: MessageSquare, label: 'Customer Reviews', type: 'link' as const },
            {
              id: 'marketing',
              icon: Mail,
              label: 'Marketing & Coupons',
              type: 'group' as const,
              items: [
                { id: 'marketing', label: 'Marketing & Campaigns' },
                { id: 'coupons', label: 'Coupons & Discounts' }
              ]
            },
            {
              id: 'integrations',
              icon: Globe,
              label: 'Channels Integration',
              type: 'group' as const,
              items: [
                { id: 'ebay', label: 'eBay Integration' },
                { id: 'amazon', label: 'Amazon Integration' }
              ]
            },
            {
              id: 'system',
              icon: BarChart3,
              label: 'System & Analytics',
              type: 'group' as const,
              items: [
                { id: 'analytics', label: 'Besucher-Analytics' },
                { id: 'logs', label: 'Activity Log' }
              ]
            }
          ].map((item) => {
            if (item.type === 'link') {
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-semibold' 
                      : 'hover:bg-white/5 hover:text-white text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                     <item.icon className="w-4 h-4" />
                     <span>{item.label}</span>
                  </div>
                </button>
              );
            } else {
              const hasActiveSub = item.items.some(sub => activeTab === sub.id);
              const isOpen = openSubMenu === item.id;
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => setOpenSubMenu(isOpen ? null : item.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isOpen 
                        ? 'text-white bg-white/5 font-semibold' 
                        : hasActiveSub 
                          ? 'text-red-500/90 font-medium' 
                          : 'hover:bg-white/5 hover:text-white text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="pl-9 pr-2 py-0.5 space-y-1 border-l border-white/10 ml-6 animate-in slide-in-from-top-2 duration-200">
                      {item.items.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => { setActiveTab(subItem.id); setIsMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-all ${
                            activeTab === subItem.id 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 font-bold' 
                              : 'text-stone-400 hover:text-white hover:bg-white/5 font-medium'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'hover:bg-white/5 hover:text-white text-stone-400'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-white/5 hover:text-white transition-all text-stone-400">
            <LogOut className="w-4 h-4" /> Exit to Store
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Mobile Navigation Header */}
          <div className="flex md:hidden items-center justify-between bg-[#111625] text-white px-4 py-3 rounded-xl shadow-md">
            <span className="font-serif font-bold text-sm tracking-wide">
              BS Baristore<span className="text-[#d40026]">.ERP</span>
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-100">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab === 'products' ? 'products, SKU, tags...' : activeTab === 'categories' ? 'categories, slug...' : activeTab === 'orders' ? 'orders, client...' : 'inventory...'}`}
                  className="pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#d40026] w-full sm:w-64 text-stone-900"
                />
              </div>
              <div className="hidden sm:flex w-10 h-10 rounded-full bg-stone-900 text-white items-center justify-center font-bold text-sm shrink-0">AD</div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue (YTD)', value: formatCurrency(totalRevenue), trend: '+14%', color: 'text-emerald-600' },
                  { label: 'Active B2B Partners', value: activeB2B.toString(), trend: '+3', color: 'text-emerald-600' },
                  { label: 'Pending Orders', value: pendingOrdersCount.toString(), trend: '-5%', color: 'text-rose-500' },
                  { label: 'Inventory Value', value: formatCurrency(inventoryValue), trend: 'Stable', color: 'text-stone-500' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                    <h2 className="text-stone-500 text-xs uppercase tracking-widest font-semibold">{stat.label}</h2>
                    <div className="flex items-end justify-between mt-4">
                      <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
                      <span className={`text-xs font-bold ${stat.color} flex items-center`}>
                        {stat.trend} <ArrowUpRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
                  <h3 className="font-bold text-stone-900 mb-4">Recent B2B Applications</h3>
                  <div className="space-y-4">
                    {recentB2BApps.length > 0 ? recentB2BApps.map((app, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-stone-50 rounded-lg border border-transparent hover:border-stone-100">
                        <div>
                          <p className="font-semibold text-sm">{app.name || app.email}</p>
                          <p className="text-xs text-stone-500">{app.email} • {new Date(app.created_at || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <button className="text-xs font-bold text-[#d40026] bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors">Review</button>
                      </div>
                    )) : (
                      <p className="text-sm text-stone-500">No recent applications.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Download className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-stone-900 mb-2">Export Financial Reports</h3>
                  <p className="text-sm text-stone-500 mb-6 max-w-sm">Download monthly VAT and sales reports for your accounting department.</p>
                  <button className="bg-stone-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition">
                    Generate CSV Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* CSV Import */}
              {/* CSV Import */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">📂 B2B & Dropshipping Importer</h2>
                    <p className="text-xs text-stone-500 mt-1">Importiere Produkte von Zentrada oder anderen Großhändlern über Datei-Upload oder Direktkopieren.</p>
                  </div>
                  <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => { setImportMode('csv'); setMessage(''); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${importMode === 'csv' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                      CSV Datei
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setImportMode('text'); setMessage(''); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${importMode === 'text' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                      Kopierter Text (Copy-Paste)
                    </button>
                  </div>
                </div>

                {importMode === 'csv' ? (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">1. CSV-Datei auswählen</h3>
                        <p className="text-xs text-stone-400">Lade eine CSV/Excel-Tabelle hoch.</p>
                      </div>
                      <div className="flex gap-4 items-center">
                        <input 
                          type="file" 
                          accept=".csv" 
                          onChange={handleFeedFileChange} 
                          className="text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer" 
                        />
                      </div>
                    </div>

                    {feedHeaders.length > 0 && (
                      <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-5 animate-in slide-in-from-top-2 duration-300">
                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-2">
                          2. Spalten zuordnen / Map CSV Columns
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">SKU (Pflicht)</label>
                            <select value={skuCol} onChange={e => setSkuCol(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs">
                              <option value="">-- Wählen --</option>
                              {feedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Name / Title (Pflicht)</label>
                            <select value={nameCol} onChange={e => setNameCol(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs">
                              <option value="">-- Wählen --</option>
                              {feedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Einkaufspreis (Pflicht)</label>
                            <select value={priceCol} onChange={e => setPriceCol(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs">
                              <option value="">-- Wählen --</option>
                              {feedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Lagerbestand (Opt.)</label>
                            <select value={stockCol} onChange={e => setStockCol(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs">
                              <option value="">-- Nicht importieren --</option>
                              {feedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Bild-URL (Opt.)</label>
                            <select value={imageCol} onChange={e => setImageCol(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs">
                              <option value="">-- Nicht importieren --</option>
                              {feedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">EAN / GTIN (Opt.)</label>
                            <select value={eanCol} onChange={e => setEanCol(e.target.value)} className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs">
                              <option value="">-- Nicht importieren --</option>
                              {feedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        </div>

                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-200 pt-2 pb-2">
                          3. Gewinnmarge anpassen / Set Profit Markups
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Aufschlag für B2B-Kunden (%)</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-xs font-bold">%</span>
                              <input 
                                type="number" 
                                value={b2bMarkup} 
                                onChange={e => setB2bMarkup(e.target.value)} 
                                className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-lg text-xs" 
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Aufschlag für Retail-Kunden (%)</label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-xs font-bold">%</span>
                              <input 
                                type="number" 
                                value={retailMarkup} 
                                onChange={e => setRetailMarkup(e.target.value)} 
                                className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-lg text-xs" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button 
                            type="button"
                            onClick={handleFeedUpload} 
                            disabled={uploading || !skuCol || !nameCol || !priceCol} 
                            className="bg-stone-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-stone-850 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            {uploading ? 'Importiere Feed...' : 'Import starten / Start Import'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">1. Text kopieren & hier einfügen</h3>
                      <p className="text-xs text-stone-400 mt-0.5">Kopiere den Inhalt der Zentrada-Seite (Strg+A, Strg+C) und füge ihn hier ein. Unser System filtert Produkte und Preise automatisch heraus.</p>
                    </div>
                    <textarea
                      value={rawPasteText}
                      onChange={e => setRawPasteText(e.target.value)}
                      rows={6}
                      placeholder="Beispiel: Ruhhy 22525 LCD-Analyse-Personenwaage 4,29 EUR UVP 10,45 EUR..."
                      className="w-full border border-stone-200 rounded-lg p-3 text-xs focus:outline-none focus:border-stone-900 placeholder-stone-400 bg-stone-50/50"
                    />

                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-200 pt-2 pb-2">
                      2. Gewinnmarge anpassen / Set Profit Markups
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Aufschlag für B2B-Kunden (%)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-xs font-bold">%</span>
                          <input 
                            type="number" 
                            value={b2bMarkup} 
                            onChange={e => setB2bMarkup(e.target.value)} 
                            className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-lg text-xs" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1.5">Aufschlag für Retail-Kunden (%)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-xs font-bold">%</span>
                          <input 
                            type="number" 
                            value={retailMarkup} 
                            onChange={e => setRetailMarkup(e.target.value)} 
                            className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-lg text-xs" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        type="button"
                        onClick={handleParseAndImportText} 
                        disabled={uploading || !rawPasteText.trim()} 
                        className="bg-stone-950 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-stone-850 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Importiere Text...
                          </>
                        ) : 'Text analysieren & importieren'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {message && (
                <div className={`p-4 rounded-xl text-xs font-bold ${message.toLowerCase().includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                  {message}
                </div>
              )}

              {/* Excel-like Inventory Table */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <h2 className="text-lg font-bold text-stone-900">Product Database (Master)</h2>
                  <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-800 transition">
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {/* Modern Filter & Sort Controls Row */}
                <div className="p-4 bg-stone-50/30 border-b border-stone-100 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center flex-1">
                    {/* Category Filter Dropdown */}
                    <div className="flex flex-col min-w-[180px]">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Category Filter
                      </label>
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 font-medium focus:outline-none focus:border-stone-900 transition cursor-pointer"
                      >
                        <option value="">All Categories (كل التصنيفات)</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name?.en || cat.slug} {cat.name?.ar ? `(${cat.name.ar})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Brand Filter Dropdown */}
                    <div className="flex flex-col min-w-[180px]">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Brand Filter
                      </label>
                      <select
                        value={selectedBrandFilter}
                        onChange={(e) => setSelectedBrandFilter(e.target.value)}
                        className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 font-medium focus:outline-none focus:border-stone-900 transition cursor-pointer"
                      >
                        <option value="">All Brands (كل الماركات)</option>
                        {Array.from(new Set(products.map((p: any) => p.attributes?.brand).filter(Boolean))).map((brand: any) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Order Dropdown */}
                    <div className="flex flex-col min-w-[180px]">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                        Sort Order
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 font-medium focus:outline-none focus:border-stone-900 transition cursor-pointer"
                      >
                        <option value="newest">Newest First (أحدث الإضافات)</option>
                        <option value="oldest">Oldest First (أقدم الإضافات)</option>
                      </select>
                    </div>
                  </div>

                  {/* Reset Button (only shows when filters are active) */}
                  {(selectedCategoryFilter || selectedBrandFilter || sortOrder !== 'newest') && (
                    <button
                      onClick={() => {
                        setSelectedCategoryFilter('');
                        setSelectedBrandFilter('');
                        setSortOrder('newest');
                      }}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">

                  {/* Bulk Action Bar */}
                  {selectedProductIds.length > 0 && (
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-4 py-2.5 mb-3 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{selectedProductIds.length}</span>
                        <span className="text-sm font-bold text-rose-700">منتج محدد</span>
                        <button onClick={() => setSelectedProductIds([])} className="text-xs text-rose-400 hover:text-rose-600 underline ml-2">إلغاء التحديد</button>
                      </div>
                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        🗑️ حذف {selectedProductIds.length} منتج
                      </button>
                    </div>
                  )}

                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-stone-900 text-white text-[10px] uppercase tracking-widest">
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded accent-rose-500 cursor-pointer"
                            checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={() => handleSelectAll(filteredProducts.map((p: any) => p.id))}
                            title="تحديد الكل"
                          />
                        </th>
                        <th className="p-3 whitespace-nowrap">SKU / Image</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 bg-stone-800">Variant (Size/Type)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 bg-amber-600 text-white whitespace-nowrap">B2B Price (Wholesale)</th>
                        <th className="p-3 bg-emerald-600 text-white whitespace-nowrap">B2C Price (Retail)</th>
                        <th className="p-3 bg-rose-600 text-white whitespace-nowrap">Discount %</th>
                        <th className="p-3 bg-violet-600 text-white whitespace-nowrap">Sale Price</th>
                        <th className="p-3 bg-blue-600 text-white whitespace-nowrap">eBay Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-stone-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className={`border-b transition group ${selectedProductIds.includes(product.id) ? 'bg-rose-50 border-rose-200' : 'hover:bg-stone-50 border-stone-100'}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded accent-rose-500 cursor-pointer"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={() => toggleSelectProduct(product.id)}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-stone-100 overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={resolveImageUrl(product.image_url) || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=100&auto=format&fit=crop'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="font-mono text-xs text-stone-500 font-medium">{product.sku}</span>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-stone-900">
                            <div>{product.translations?.en || 'Unnamed'}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.attributes?.brand && (
                                <span className="inline-block text-[9px] font-bold tracking-wider text-amber-800 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {product.attributes.brand}
                                </span>
                              )}
                              {product.admin_note && (
                                <span className="inline-block text-[9px] font-bold tracking-wider text-red-800 uppercase bg-red-50 px-1.5 py-0.5 rounded border border-red-200 truncate max-w-[200px]" title={product.admin_note}>
                                  📝{' '}
                                  {product.admin_note.startsWith('http') ? (
                                    <a href={product.admin_note} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-900 cursor-pointer">
                                      Link
                                    </a>
                                  ) : (
                                    product.admin_note
                                  )}
                                </span>
                              )}
                            </div>
                          </td>

                           <td className="p-3 text-stone-600 bg-stone-50/50">
                            {(() => {
                              if (product.attributes?.is_sample) {
                                return (
                                  <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20">
                                    عينة / Sample
                                  </span>
                                );
                              }
                              const parentSku = product.attributes?.parent_sku || product.sku;
                              const hasSisters = products.some((p: any) => {
                                const pAttr = p.attributes || {};
                                return parentSku && (p.sku === parentSku || pAttr.parent_sku === parentSku) && p.id !== product.id;
                              });
                              if (hasSisters) {
                                return product.attributes?.type || 'Standard';
                              }
                              return <span className="text-stone-400">—</span>;
                            })()}
                          </td>
                          <td className="p-3 text-stone-600 font-mono">
                            <input
                              type="number"
                              min="0"
                              key={`${product.id}-${product.stock_quantity}`}
                              defaultValue={product.stock_quantity ?? 0}
                              onBlur={async (e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val !== product.stock_quantity) {
                                  try {
                                    const token = localStorage.getItem('token');
                                    await axios.put(`${API_URL}/products/${product.id}`, { stock_quantity: val }, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    product.stock_quantity = val;
                                  } catch (err) {
                                    console.error("Inline stock update error:", err);
                                  }
                                }
                              }}
                              className="w-16 px-2 py-1 border border-stone-200 rounded text-center text-xs font-mono font-bold focus:border-amber-500 focus:outline-none bg-stone-50 hover:bg-white transition"
                              title="تعديل الكمية مباشرةً هنا / Click to edit stock quantity"
                            />
                          </td>
                          <td className="p-3 font-bold text-amber-700 bg-amber-50/30">€{parseFloat(product.b2b_price || 0).toFixed(2)}</td>
                          <td className="p-3 font-bold text-emerald-700 bg-emerald-50/30">€{parseFloat(product.retail_price || 0).toFixed(2)}</td>
                          <td className="p-3 bg-rose-50/30">
                            {(() => {
                              const retail = parseFloat(product.retail_price || 0);
                              const sale = parseFloat(product.sales_price_with_tax || 0);
                              const disc = product.discount_percent || (retail > 0 && sale > 0 && sale < retail ? Math.round(((retail - sale) / retail) * 100) : 0);
                              return disc > 0 ? (
                                <span className="inline-block bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{disc}%</span>
                              ) : <span className="text-stone-400 text-xs">—</span>;
                            })()}
                          </td>
                          <td className="p-3 bg-violet-50/30">
                            {(() => {
                              const retail = parseFloat(product.retail_price || 0);
                              const sale = parseFloat(product.sales_price_with_tax || 0);
                              const disc = product.discount_percent || (retail > 0 && sale > 0 && sale < retail ? Math.round(((retail - sale) / retail) * 100) : 0);
                              const salePrice = disc > 0 && retail > 0 ? (retail * (1 - disc / 100)) : sale;
                              return salePrice > 0 ? (
                                <div>
                                  <div className="font-bold text-violet-700">€{salePrice.toFixed(2)}</div>
                                  {disc > 0 && retail > 0 && <div className="text-[10px] text-stone-400 line-through">€{retail.toFixed(2)}</div>}
                                </div>
                              ) : <span className="text-stone-400 text-xs">—</span>;
                            })()}
                          </td>
                          <td className="p-3 bg-blue-50/30 text-stone-700 font-medium">
                            {ebayListings[product.sku] ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                                Active ({ebayListings[product.sku].listingId})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-stone-200">
                                Not Listed
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/shop/${product.sku}`}
                                target="_blank"
                                className="p-1.5 text-stone-400 hover:text-stone-900 transition bg-white border border-stone-200 rounded shadow-sm flex items-center justify-center"
                                title="View Product Page"
                              >
                                <Eye className="w-3 h-3" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleEditClick(product)}
                                className="p-1.5 text-stone-400 hover:text-stone-900 transition bg-white border border-stone-200 rounded shadow-sm flex items-center justify-center"
                                title="Edit Everything (Image, Desc, Tags, Prices)"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm(`Sync ${product.sku} to eBay?`)) return;
                                  try {
                                    const token = localStorage.getItem('token');
                                    const url = ebayListings[product.sku] 
                                      ? `${API_URL_CONST}/ebay/sync-stock/${product.id}`
                                      : `${API_URL_CONST}/ebay/list-product/${product.id}`;
                                    const res = await axios.post(url, {}, {
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    alert(res.data.message || 'Product synced on eBay!');
                                    fetchEbayListings();
                                  } catch (err: any) {
                                    alert('Sync failed: ' + (err.response?.data?.message || err.message));
                                  }
                                }}
                                className="p-1.5 text-blue-500 hover:text-blue-700 transition bg-white border border-blue-100 hover:border-blue-300 rounded shadow-sm flex items-center justify-center"
                                title={ebayListings[product.sku] ? "Sync stock/price to eBay" : "Publish to eBay"}
                              >
                                <Globe className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductToDelete(product)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 transition bg-white border border-rose-100 hover:border-rose-300 rounded shadow-sm flex items-center justify-center"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && <div className="p-12 text-center text-stone-500 text-sm flex flex-col items-center gap-2"><Package className="w-8 h-8 text-stone-300" /> No products found. Use the CSV uploader above.</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">

              {/* Add Category Form (1 Column) */}
              <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-stone-100 h-fit">
                <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" /> Add Category / Subcategory
                </h2>

                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Category Name (English)</label>
                    <input
                      type="text"
                      value={newCategory.name_en}
                      onChange={e => {
                        const val = e.target.value;
                        const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        setNewCategory({
                          ...newCategory,
                          name_en: val,
                          slug: newCategory.slug ? newCategory.slug : generatedSlug
                        });
                      }}
                      placeholder="e.g. Perfumes"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Category Name (Arabic)</label>
                    <input
                      type="text"
                      value={newCategory.name_ar}
                      onChange={e => setNewCategory({ ...newCategory, name_ar: e.target.value })}
                      placeholder="مثال: العطور"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-right dir-rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Unique Slug</label>
                    <input
                      type="text"
                      value={newCategory.slug}
                      onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })}
                      placeholder="e.g. perfumes"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Parent Category (For Subcategories)</label>
                    <select
                      value={newCategory.parent_id}
                      onChange={e => setNewCategory({ ...newCategory, parent_id: e.target.value })}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 bg-white"
                    >
                      <option value="">None (Top-Level Parent Category)</option>
                      {categories.filter(c => !c.parent_id).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name?.en || 'Unnamed Category'} {c.name?.ar ? `(${c.name.ar})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Description</label>
                    <textarea
                      value={newCategory.description}
                      onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Optional details"
                      rows={2}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Category Image</label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newCategory.image_url}
                        onChange={e => setNewCategory({ ...newCategory, image_url: e.target.value })}
                        placeholder="Paste image URL or upload below"
                        className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleCategoryImageUpload(file);
                          }}
                          className="hidden"
                          id="category-file-upload"
                        />
                        <label
                          htmlFor="category-file-upload"
                          className="cursor-pointer bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded-lg border border-stone-200 transition shrink-0"
                        >
                          {newCategory.uploadingImage ? 'Uploading...' : 'Upload Image File'}
                        </label>
                        {newCategory.image_url && (
                          <div className="w-8 h-8 rounded border border-stone-200 overflow-hidden bg-stone-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={resolveImageUrl(newCategory.image_url)} alt="Category preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-stone-800 transition uppercase tracking-widest text-xs"
                  >
                    Create Category
                  </button>
                </form>
              </div>

              {/* Categories Table (2 Columns) */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-stone-900">Categories Directory</h2>
                  <span className="text-xs text-stone-500 font-semibold">{categories.length} Registered Categories</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-900 text-white text-[10px] uppercase tracking-widest border-b border-stone-100">
                        <th className="p-4">Category Name</th>
                        <th className="p-4">Slug</th>
                        <th className="p-4">Hierarchy Type</th>
                        <th className="p-4">Products Count</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-stone-100">
                      {filteredCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-stone-50 transition group">
                          <td className="p-4 flex items-center gap-3">
                            {category.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={resolveImageUrl(category.image_url)} alt="" className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center border border-stone-200/50 text-stone-400 shrink-0">
                                <span className="text-[9px] font-bold text-stone-400">NO IMAGE</span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-stone-900">{category.name?.en || 'Unnamed'}</p>
                              {category.name?.ar && <p className="text-xs text-stone-400 font-medium">{category.name.ar}</p>}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-stone-500 font-medium">/{category.slug}</td>
                          <td className="p-4">
                            {category.parent ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                                Subcategory of <strong>{category.parent.name?.en || 'Parent'}</strong>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                                Top-Level Parent
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-semibold text-stone-700">
                            {category._count?.products ?? 0} items
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditCategoryClick(category)}
                                className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition opacity-0 group-hover:opacity-100"
                                title="Edit Category"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCategoryToDelete(category)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition opacity-0 group-hover:opacity-100"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCategories.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-stone-500 text-sm">
                            No categories registered. Add one using the form on the left.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Top Controls: Filter Toggles */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 font-serif">Orders & Fulfillment</h2>
                    <p className="text-xs text-stone-400 mt-1">Manage B2B and retail store orders, tracking, status updates, and invoicing.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Type:</span>
                    <div className="inline-flex rounded-lg border border-stone-100 p-0.5 bg-stone-50">
                      {(['all', 'B2B', 'Retail'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setOrderFilter(t)}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${orderFilter === t
                              ? 'bg-[#0F8A5F] text-white shadow-xs'
                              : 'text-stone-500 hover:text-stone-900'
                            }`}
                        >
                          {t === 'all' ? 'All Orders' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-50">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2">Status:</span>
                  {(['all', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setOrderStatusFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${orderStatusFilter === s
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                          : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                        }`}
                    >
                      {s === 'all' ? 'All Statuses' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Body: Table & Detail View Split */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">

                {/* Orders List Table Card */}
                <div className={`bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden ${selectedOrder ? 'xl:col-span-3' : 'xl:col-span-5'} transition-all`}>
                  <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
                    <h3 className="font-bold text-stone-900 text-sm">Recent Transactions ({filteredOrders.length})</h3>
                    {selectedOrder && (
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-bold"
                      >
                        Expand Table
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-white text-stone-500 text-[10px] uppercase tracking-widest border-b border-stone-100">
                          <th className="p-4 font-semibold">Order ID</th>
                          <th className="p-4 font-semibold">Customer / Partner</th>
                          <th className="p-4 font-semibold">Date</th>
                          <th className="p-4 font-semibold">Type</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-stone-50">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-stone-400">
                              No orders found matching filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedOrders.map((order) => (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className={`hover:bg-emerald-50/20 cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-emerald-50/30 font-semibold border-l-4 border-emerald-600' : ''
                                }`}
                            >
                              <td className="p-4 font-mono text-stone-950 font-medium">{order.id}</td>
                              <td className="p-4">
                                <div className="font-medium text-stone-900">{order.customer}</div>
                                <div className="text-[10px] text-stone-400 font-normal">{order.email}</div>
                              </td>
                              <td className="p-4 text-stone-500 text-xs">{order.date}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${order.type === 'B2B' ? 'bg-[#111625] text-emerald-400' : 'bg-stone-100 text-stone-700'
                                  }`}>
                                  {order.type}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' :
                                    order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' :
                                      order.status === 'Processing' ? 'bg-amber-50 text-amber-700' :
                                        order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-stone-50 text-stone-600'
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-600' :
                                      order.status === 'Shipped' ? 'bg-blue-600' :
                                        order.status === 'Processing' ? 'bg-amber-600' :
                                          order.status === 'Cancelled' ? 'bg-rose-600' : 'bg-stone-400'
                                    }`}></span>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-4 text-right font-bold text-stone-950 font-mono">{order.total}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between text-xs text-stone-500 font-medium select-none">
                      <button
                        type="button"
                        disabled={orderPage === 1}
                        onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-stone-700 cursor-pointer"
                      >
                        Previous
                      </button>
                      <span>
                        Page {orderPage} of {totalPages} ({filteredOrders.length} orders total)
                      </span>
                      <button
                        type="button"
                        disabled={orderPage === totalPages}
                        onClick={() => setOrderPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-stone-700 cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Orders Premium Detail View Card */}
                {selectedOrder && (() => {
                  const hasDigitalItem = selectedOrder.items.some((item: any) => {
                    const dbProd = products.find(p => p.id === item.product_id);
                    return dbProd?.attributes?.isDigital || false;
                  });
                  return (
                    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden xl:col-span-2 animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="p-5 border-b border-stone-100 bg-[#0F8A5F] text-white flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-black text-base">{selectedOrder.id}</span>
                          <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">{selectedOrder.type}</span>
                        </div>
                        <p className="text-[10px] text-emerald-100 mt-1">Placed on {selectedOrder.date}</p>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="p-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Timeline */}
                    <div className="p-5 border-b border-stone-100 bg-stone-50/50">
                      <div className="flex items-center justify-between">
                        {(['Pending', 'Processing', 'Shipped', 'Delivered'] as const).map((step, idx) => {
                          const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
                          const currentIdx = statusOrder.indexOf(selectedOrder.status);
                          const stepIdx = statusOrder.indexOf(step);
                          const isCompleted = selectedOrder.status !== 'Cancelled' && currentIdx >= stepIdx;
                          const isActive = selectedOrder.status === step;

                          return (
                            <React.Fragment key={step}>
                              <div className="flex flex-col items-center flex-1 relative">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${isCompleted
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : isActive
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-white text-stone-300 border-stone-200'
                                  }`}>
                                  {idx + 1}
                                </div>
                                <span className={`text-[9px] font-extrabold mt-1.5 tracking-tight ${isCompleted ? 'text-emerald-700' : isActive ? 'text-amber-600' : 'text-stone-400'
                                  }`}>
                                  {step}
                                </span>
                              </div>
                              {idx < 3 && (
                                <div className={`h-[2px] flex-1 -mt-4 mx-1 transition-all ${selectedOrder.status !== 'Cancelled' && currentIdx > idx
                                    ? 'bg-emerald-600'
                                    : 'bg-stone-200'
                                  }`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      {selectedOrder.status === 'Cancelled' && (
                        <div className="mt-3 bg-rose-50 border border-rose-100 p-2.5 rounded text-rose-700 text-xs font-bold text-center">
                          ⚠ This order has been cancelled.
                        </div>
                      )}
                    </div>

                    {/* Details Body */}
                    <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">

                      {/* Customer Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Customer Information</h4>
                          {!isEditingOrder && (
                            <button
                              onClick={startEditingOrder}
                              className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold transition flex items-center gap-1 bg-stone-100 hover:bg-stone-200/60 px-2 py-1 rounded"
                            >
                              <Pencil className="w-2.5 h-2.5" /> Edit Info
                            </button>
                          )}
                        </div>

                        {isEditingOrder ? (
                          <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-100 text-xs space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Customer / Partner Name</label>
                              <input
                                type="text"
                                value={orderEditForm.customer}
                                onChange={(e) => setOrderEditForm({ ...orderEditForm, customer: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded border border-stone-200 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Email</label>
                                <input
                                  type="email"
                                  value={orderEditForm.email}
                                  onChange={(e) => setOrderEditForm({ ...orderEditForm, email: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded border border-stone-200 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Phone</label>
                                <input
                                  type="text"
                                  value={orderEditForm.phone}
                                  onChange={(e) => setOrderEditForm({ ...orderEditForm, phone: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded border border-stone-200 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Shipping Address</label>
                              <textarea
                                value={orderEditForm.address}
                                onChange={(e) => setOrderEditForm({ ...orderEditForm, address: e.target.value })}
                                rows={2}
                                className="w-full px-2.5 py-1.5 rounded border border-stone-200 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-end pt-1">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Order Type</label>
                                <select
                                  value={orderEditForm.type}
                                  onChange={(e) => setOrderEditForm({ ...orderEditForm, type: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded border border-stone-200 text-xs bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                                >
                                  <option value="Retail">Retail (مفرق)</option>
                                  <option value="Wholesale">Wholesale (جملة)</option>
                                </select>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={handleSaveOrderDetails}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded font-bold text-[10px] transition text-center"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setIsEditingOrder(false)}
                                  className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 py-1.5 rounded font-bold text-[10px] transition text-center"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-100 text-xs space-y-2">
                            <p className="font-semibold text-stone-900 text-sm">{selectedOrder.customer}</p>
                            <p className="text-stone-600">Email: <strong>{selectedOrder.email}</strong></p>
                            <p className="text-stone-600">Phone: <strong>{selectedOrder.phone || 'N/A'}</strong></p>
                            <p className="text-stone-600 leading-relaxed">Shipping Address: <strong className="block text-stone-800 mt-0.5">{selectedOrder.address}</strong></p>
                            {selectedOrder.vatNumber && (
                              <p className="text-stone-600 pt-1 border-t border-stone-200/50">VAT Registration: <strong className="text-emerald-700 font-mono">{selectedOrder.vatNumber}</strong></p>
                            )}
                            {selectedOrder.coupon_code && (
                              <p className="text-stone-600 pt-1 border-t border-stone-200/50 flex justify-between items-center">
                                <span>Coupon Applied: <strong className="text-emerald-700 font-mono uppercase bg-emerald-50 px-1.5 py-0.5 rounded">{selectedOrder.coupon_code}</strong></span>
                                <span className="text-stone-500 font-medium">Discounted: <strong>-€{selectedOrder.discount_amount.toFixed(2)}</strong></span>
                              </p>
                            )}
                            {selectedOrder.shipping_provider && selectedOrder.tracking_number && !hasDigitalItem && (
                              <div className="text-stone-600 pt-1.5 border-t border-stone-200/50 flex flex-col gap-1 bg-emerald-50/20 -mx-4 -mb-4 p-4 rounded-b-lg">
                                <span className="flex justify-between">
                                  <span className="text-stone-500 font-medium">Carrier Service</span>
                                  <strong className="text-stone-900 font-semibold">{selectedOrder.shipping_provider}</strong>
                                </span>
                                <span className="flex justify-between items-center mt-0.5">
                                  <span className="text-stone-500 font-medium">Tracking Reference</span>
                                  <a
                                    href={selectedOrder.tracking_number}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 hover:underline font-mono font-bold flex items-center gap-0.5"
                                  >
                                    Track Package <ArrowUpRight className="w-3.5 h-3.5" />
                                  </a>
                                </span>
                              </div>
                            )}
                            {hasDigitalItem && (
                              <div className="text-stone-600 pt-1.5 border-t border-stone-200/50 flex flex-col gap-1.5 bg-amber-50/20 -mx-4 -mb-4 p-4 rounded-b-lg">
                                <span className="font-bold text-amber-800 uppercase tracking-widest text-[9px] flex items-center gap-1">🔑 Digital Keys / Product Keys</span>
                                <div className="space-y-1.5 mt-1">
                                  {selectedOrder.items.map((item: any, idx: number) => {
                                    const dbProd = products.find(p => p.id === item.product_id);
                                    if (!dbProd?.attributes?.isDigital) return null;
                                    const soldKeysMap = dbProd.attributes.soldKeys || {};
                                    const keys = soldKeysMap[selectedOrder.db_id || selectedOrder.id] || [];
                                    
                                    return (
                                      <div key={idx} className="bg-amber-50/50 p-2 rounded border border-amber-100/50 text-[10px]">
                                        <div className="font-semibold text-stone-700">{item.name}</div>
                                        {keys.length > 0 ? (
                                          <div className="mt-1 font-mono font-bold text-emerald-700 break-all select-all">
                                            {keys.join(', ')}
                                          </div>
                                        ) : selectedOrder.tracking_number ? (
                                          <div className="mt-1 font-mono font-bold text-emerald-700 break-all select-all">
                                            {selectedOrder.tracking_number}
                                          </div>
                                        ) : (
                                          <div className="mt-1 text-stone-400 italic">No keys assigned yet (will assign on Process/Ship)</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Order Items</h4>
                        <div className="border border-stone-100 rounded-lg overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-stone-50 text-stone-500 font-bold border-b border-stone-100">
                                <th className="p-3">Product Name</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-right">Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-700">
                              {selectedOrder.items.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-stone-50/30">
                                  <td className="p-3 font-medium">
                                    <div>{item.name}</div>
                                    <div className="text-[9px] text-stone-400 font-mono mt-0.5">SKU: {item.sku}</div>
                                  </td>
                                  <td className="p-3 text-center font-bold text-stone-950">{item.quantity}</td>
                                  <td className="p-3 text-right font-mono text-stone-950">€{item.price.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Link Product Section */}
                        {selectedOrder.items.some((item: any) => !item.product_id) && (
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                            <div className="flex items-start gap-2 text-stone-850">
                              <span className="text-sm">⚠️</span>
                              <div>
                                <h5 className="text-xs font-bold text-amber-800">Produkt verknüpfen / Link Product</h5>
                                <p className="text-[10px] text-amber-700 mt-0.5">
                                  Dieser eBay-Artikel ist nicht mit der Datenbank verknüpft. Bitte verknüpfen, um Lizenzen zu senden.
                                </p>
                              </div>
                            </div>

                            {selectedOrder.items.filter((item: any) => !item.product_id).map((item: any) => (
                              <div key={item.id} className="flex flex-col gap-2 pt-2 border-t border-amber-200/50">
                                <div className="text-[10px] font-bold text-stone-700">
                                  {item.name} <span className="text-[9px] text-stone-400 font-mono font-normal">(SKU: {item.sku})</span>
                                </div>
                                
                                <div className="flex gap-2">
                                  <select
                                    value={selectedLinkProductIds[item.id] || ''}
                                    onChange={(e) => setSelectedLinkProductIds(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="flex-1 text-[11px] bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-[#d40026]"
                                  >
                                    <option value="">-- Produkt verknüpfen --</option>
                                    {products.map((p: any) => {
                                      let name = p.translations;
                                      if (name) {
                                        try {
                                          const parsed = typeof name === 'string' ? JSON.parse(name) : name;
                                          name = parsed.de || parsed.en || p.sku;
                                        } catch (err) {
                                          name = p.sku;
                                        }
                                      } else {
                                        name = p.sku;
                                      }
                                      return (
                                        <option key={p.id} value={p.id}>
                                          {name} ({p.sku})
                                        </option>
                                      );
                                    })}
                                  </select>
                                  
                                  <button
                                    onClick={() => handleLinkProduct(selectedOrder.db_id, item.id, selectedLinkProductIds[item.id])}
                                    disabled={linkingItemId === item.id || !selectedLinkProductIds[item.id]}
                                    className="bg-[#d40026] hover:bg-red-700 text-white font-bold text-[10px] px-3 py-1 rounded transition disabled:opacity-50"
                                  >
                                    {linkingItemId === item.id ? '...' : 'Link'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Financials Summary */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Payment Breakdown</h4>
                        <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 text-xs space-y-2.5">
                          <div className="flex justify-between text-stone-600">
                            <span>Subtotal</span>
                            <span className="font-mono">{selectedOrder.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-stone-600">
                            <span>Shipping & Handling</span>
                            <span className="font-mono">{selectedOrder.shipping}</span>
                          </div>
                          <div className="flex justify-between text-stone-600 pb-2 border-b border-stone-200/50">
                            <span>VAT Tax (Included)</span>
                            <span className="font-mono">{selectedOrder.tax}</span>
                          </div>
                          <div className="flex justify-between text-stone-950 font-bold text-sm">
                            <span>Grand Total</span>
                            <span className="font-mono text-[#0F8A5F]">{selectedOrder.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="p-5 border-t border-stone-100 bg-stone-50 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Update Order Status</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Processing', 'Shipped', 'Delivered'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                              disabled={selectedOrder.status === 'Cancelled'}
                              className={`py-1.5 px-1 rounded text-[10px] font-bold border transition-colors ${selectedOrder.status === st
                                  ? 'bg-[#0F8A5F] border-[#0F8A5F] text-white'
                                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {st === 'Processing' ? 'Process' : st === 'Shipped' ? (hasDigitalItem ? 'Digital Key' : 'Ship') : 'Deliver'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-stone-200/50">
                        <button
                          onClick={() => handlePrintInvoice(selectedOrder)}
                          className="flex-1 bg-stone-900 hover:bg-black text-white py-2 rounded text-xs font-bold transition shadow-xs text-center"
                        >
                          Print Invoice
                        </button>
                        <button
                          onClick={() => handleResendInvoiceEmail(selectedOrder)}
                          disabled={emailSending}
                          className="flex-1 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-50 py-2 rounded text-xs font-bold transition text-center"
                        >
                          {emailSending ? 'Sending...' : 'Resend Email'}
                        </button>
                        {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'Cancelled')}
                            className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 px-3 rounded text-xs font-bold transition"
                            title="Cancel Order"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.db_id)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded text-xs font-bold transition text-center cursor-pointer shadow-xs"
                      >
                        Delete Order (Permanently)
                      </button>
                    </div>

                  </div>
                );
              })()}

              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-in fade-in duration-300">
              {/* Left Column: Create Coupon Form */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 xl:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 font-serif">Create Coupon Code</h2>
                  <p className="text-xs text-stone-400 mt-1">Generate discount codes for marketing campaigns and user segments.</p>
                </div>

                <form onSubmit={handleAddCoupon} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Coupon Code</label>
                    <input
                      type="text"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. BARI20, EID2026"
                      className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F8A5F]/20 focus:border-[#0F8A5F] transition text-sm font-semibold uppercase tracking-wider"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Discount Type</label>
                      <select
                        value={newCoupon.discount_type}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F8A5F]/20 focus:border-[#0F8A5F] transition text-sm bg-white"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed_amount">Fixed Amount (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Discount Value</label>
                      <input
                        type="number"
                        value={newCoupon.discount_value}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: parseFloat(e.target.value) || 0 })}
                        min="0.01"
                        step="any"
                        className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F8A5F]/20 focus:border-[#0F8A5F] transition text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Minimum Subtotal (€) (Optional)</label>
                    <input
                      type="number"
                      value={newCoupon.min_order_subtotal}
                      onChange={(e) => setNewCoupon({ ...newCoupon, min_order_subtotal: parseFloat(e.target.value) || 0 })}
                      min="0"
                      placeholder="e.g. 50"
                      className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F8A5F]/20 focus:border-[#0F8A5F] transition text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={newCoupon.expires_at}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F8A5F]/20 focus:border-[#0F8A5F] transition text-sm font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Limit Per User</label>
                      <input
                        type="number"
                        value={newCoupon.max_uses_per_user}
                        onChange={(e) => setNewCoupon({ ...newCoupon, max_uses_per_user: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F8A5F]/20 focus:border-[#0F8A5F] transition text-sm font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Total Global Limit</label>
                      <input
                        type="number"
                        value={newCoupon.max_uses_total}
                        onChange={(e) => setNewCoupon({ ...newCoupon, max_uses_total: parseInt(e.target.value) || 0 })}
                        min="0"
                        placeholder="Unlimited"
                        className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0F8A5F]/20 focus:border-[#0F8A5F] transition text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0F8A5F] hover:bg-[#0c6e4c] text-white py-3 rounded-lg text-sm font-bold transition shadow-xs flex items-center justify-center gap-2 mt-2"
                  >
                    <Plus className="w-4 h-4" /> Create Coupon Code
                  </button>
                </form>
              </div>

              {/* Right Column: Coupon list Table */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden xl:col-span-3">
                <div className="p-4 border-b border-stone-100 bg-stone-50">
                  <h3 className="font-bold text-stone-900 text-sm">Active & Registered Coupons ({coupons.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white text-stone-500 text-[10px] uppercase tracking-widest border-b border-stone-100">
                        <th className="p-4 font-semibold">Code</th>
                        <th className="p-4 font-semibold">Discount</th>
                        <th className="p-4 font-semibold">Min Subtotal</th>
                        <th className="p-4 font-semibold">Expiry Date</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-stone-50">
                      {coupons.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-stone-400 text-sm">
                            No coupons created yet. Use the form to generate one.
                          </td>
                        </tr>
                      ) : (
                        coupons.map((c) => {
                          const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                          const isActive = c.active && !isExpired;

                          return (
                            <tr key={c.id} className="hover:bg-stone-50/50">
                              <td className="p-4 font-mono font-bold text-stone-900 uppercase tracking-wide">
                                {c.code}
                                <span className="text-[10px] text-stone-400 block font-sans font-normal normal-case mt-0.5">
                                  {c.max_uses_per_user ? `Limit: ${c.max_uses_per_user} use/user` : 'Unlimited uses/user'}
                                  {c.max_uses_total ? ` | Max: ${c.max_uses_total} total` : ''}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-semibold text-stone-950">
                                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : `€${parseFloat(c.discount_value).toFixed(2)}`}
                                </span>
                                <span className="text-[10px] text-stone-400 block">
                                  {c.discount_type === 'percentage' ? 'Percentage off' : 'Fixed discount'}
                                </span>
                              </td>
                              <td className="p-4 text-stone-600 font-mono">
                                {c.min_order_subtotal ? `€${parseFloat(c.min_order_subtotal).toFixed(2)}` : 'None'}
                              </td>
                              <td className="p-4 text-stone-500 text-xs">
                                {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'Never'}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                                  {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setCouponToDelete(c)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 transition"
                                  title="Delete Coupon"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <CustomersSection
              customers={customers}
              customersLoading={customersLoading}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              customerRoleFilter={customerRoleFilter}
              setCustomerRoleFilter={setCustomerRoleFilter}
              updatingUserId={updatingUserId}
              handleUpdateUserRole={handleUpdateUserRole}
              handleDeleteUser={handleDeleteUser}
              fetchCustomers={fetchCustomers}
              handleUpdateUserMinOrder={handleUpdateUserMinOrder}
              b2bConfig={b2bConfig}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsSection />
          )}

          {activeTab === 'marketing' && (
            <MarketingSection />
          )}


          {activeTab === 'invoices' && (
            <div className="flex flex-col items-center justify-center py-24 text-stone-400 animate-in fade-in duration-300">
              <FileText className="w-16 h-16 mb-4 text-stone-200" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">Invoice Generator Module</h3>
              <p className="text-sm max-w-sm text-center">The billing system is connected to your Hostinger MySQL database. Generates automated PDF invoices upon order fulfillment.</p>
            </div>
          )}


          {activeTab === 'ebay' && (
            <div className="animate-in fade-in duration-300">
              <EbaySection />
            </div>
          )}


          {activeTab === 'amazon' && (
            <div className="animate-in fade-in duration-300">
              <AmazonSection />
            </div>
          )}


          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Activity Log</h2>
                  <p className="text-xs text-stone-500 mt-0.5">Vollständiges Systemprotokoll · Automatische Löschung nach 3 Jahren</p>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('Alle Einträge älter als 3 Jahre wirklich löschen?')) return;
                    const token = localStorage.getItem('token');
                    const res = await axios.delete(`${API_URL}/logs/purge`, { headers: { Authorization: `Bearer ${token}` } });
                    alert(res.data.message);
                    fetchLogs(1, logsCategory, logsSearch);
                    fetchLogStats();
                  }}
                  className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 px-3 py-2 rounded-lg text-xs font-bold transition"
                >
                  🧹 Purge Old Logs (&gt;3 years)
                </button>
              </div>

              {/* Stats Cards */}
              {logsStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm">
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">Total Entries</div>
                    <div className="text-2xl font-black text-stone-900">{logsStats.total?.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm">
                    <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">Last 24 Hours</div>
                    <div className="text-2xl font-black text-[#d40026]">{logsStats.last24h}</div>
                  </div>
                  {(logsStats.byCategory || []).slice(0, 2).map((cat: any) => (
                    <div key={cat.category} className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm">
                      <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-1">{cat.category}</div>
                      <div className="text-2xl font-black text-stone-700">{cat.count}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-xl border border-stone-100 p-4 shadow-sm flex flex-wrap gap-3 items-center">
                <input
                  type="text"
                  placeholder="Suchen (Aktion, Ziel, Nutzer...)"
                  value={logsSearch}
                  onChange={e => setLogsSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setLogsPage(1); fetchLogs(1, logsCategory, logsSearch); } }}
                  className="flex-1 min-w-[180px] border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-400"
                />
                <select
                  value={logsCategory}
                  onChange={e => {
                    setLogsCategory(e.target.value);
                    setLogsPage(1);
                    fetchLogs(1, e.target.value, logsSearch);
                  }}
                  className="border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-400 bg-white"
                >
                  {['all', 'auth', 'orders', 'products', 'email', 'ebay', 'customers', 'coupons', 'settings', 'system'].map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'Alle Kategorien' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setLogsPage(1); fetchLogs(1, logsCategory, logsSearch); }}
                  className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition"
                >
                  Suchen
                </button>
                <button
                  onClick={() => { setLogsSearch(''); setLogsCategory('all'); setLogsPage(1); fetchLogs(1, 'all', ''); }}
                  className="border border-stone-200 text-stone-500 px-4 py-2 rounded-lg text-xs font-medium hover:bg-stone-50 transition"
                >
                  Zurücksetzen
                </button>
                <span className="ml-auto text-[10px] text-stone-400">{logsTotal} Einträge</span>
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
                {logsLoading ? (
                  <div className="py-16 text-center text-stone-400 text-sm">Lade Protokoll...</div>
                ) : logsData.length === 0 ? (
                  <div className="py-16 text-center text-stone-400 text-sm">Keine Einträge gefunden.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-50 text-stone-400 font-bold text-[10px] uppercase tracking-wider border-b border-stone-100">
                          <th className="px-4 py-3 w-36">Zeitpunkt</th>
                          <th className="px-4 py-3 w-24">Kategorie</th>
                          <th className="px-4 py-3 w-44">Aktion</th>
                          <th className="px-4 py-3">Ziel</th>
                          <th className="px-4 py-3">Nutzer / Akteur</th>
                          <th className="px-4 py-3 w-28">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {logsData.map((entry: any) => {
                          const categoryColors: Record<string, string> = {
                            auth: 'bg-blue-100 text-blue-700',
                            orders: 'bg-green-100 text-green-700',
                            products: 'bg-purple-100 text-purple-700',
                            email: 'bg-yellow-100 text-yellow-700',
                            ebay: 'bg-orange-100 text-orange-700',
                            customers: 'bg-cyan-100 text-cyan-700',
                            coupons: 'bg-pink-100 text-pink-700',
                            settings: 'bg-stone-100 text-stone-700',
                            system: 'bg-red-100 text-red-700',
                          };
                          const catStyle = categoryColors[entry.category] || 'bg-stone-100 text-stone-600';
                          return (
                            <tr key={entry.id} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-4 py-2.5 text-stone-400 whitespace-nowrap font-mono text-[10px]">
                                {new Date(entry.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${catStyle}`}>
                                  {entry.category}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-mono text-[10px] text-stone-800 font-semibold">
                                {entry.action}
                              </td>
                              <td className="px-4 py-2.5 text-stone-600 max-w-[200px] truncate" title={entry.target || ''}>
                                {entry.target || <span className="text-stone-300 italic">—</span>}
                              </td>
                              <td className="px-4 py-2.5 text-stone-500 max-w-[160px] truncate" title={entry.actor || ''}>
                                {entry.actor || <span className="text-stone-300 italic">system</span>}
                              </td>
                              <td className="px-4 py-2.5 text-stone-300 font-mono text-[9px]">
                                {entry.ip || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {logsPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50">
                    <span className="text-[10px] text-stone-400">
                      Seite {logsPage} von {logsPages} · {logsTotal} Einträge
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { const p = Math.max(1, logsPage - 1); setLogsPage(p); fetchLogs(p, logsCategory, logsSearch); }}
                        disabled={logsPage === 1}
                        className="px-3 py-1 rounded border border-stone-200 text-xs text-stone-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >←</button>
                      {Array.from({ length: Math.min(5, logsPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(logsPage - 2, logsPages - 4)) + i;
                        return (
                          <button
                            key={p}
                            onClick={() => { setLogsPage(p); fetchLogs(p, logsCategory, logsSearch); }}
                            className={`px-3 py-1 rounded border text-xs font-bold transition ${logsPage === p ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:bg-white'}`}
                          >{p}</button>
                        );
                      })}
                      <button
                        onClick={() => { const p = Math.min(logsPages, logsPage + 1); setLogsPage(p); fetchLogs(p, logsCategory, logsSearch); }}
                        disabled={logsPage === logsPages}
                        className="px-3 py-1 rounded border border-stone-200 text-xs text-stone-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >→</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-300">
              <AnalyticsSection />
            </div>
          )}


          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* BRAND & LOGO SETTINGS */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-stone-900 text-white rounded-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إعدادات الهوية والشعار (Brand & Logo Identity)</h2>
                    <p className="text-xs text-stone-500">Configure your website logo and visual identity details. Changes are instantly applied across the Header, Footer, and receipt invoices.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Logo Image URL</label>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        placeholder="e.g. https://yourdomain.com/uploads/logo.png"
                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-950 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Upload Custom Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingLogo(true);
                          try {
                            const token = localStorage.getItem('token');
                            const headers = {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'multipart/form-data'
                            };
                            const formData = new FormData();
                            formData.append('image', file);

                            const response = await axios.post(`${API_URL}/products/upload-image`, formData, { headers });
                            setLogoUrl(response.data.image_url);
                            alert("Logo uploaded successfully!");
                          } catch (error) {
                            console.error(error);
                            alert("Failed to upload logo.");
                          } finally {
                            setUploadingLogo(false);
                          }
                        }}
                        className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black file:cursor-pointer"
                      />
                      {uploadingLogo && <p className="text-xs text-stone-400 animate-pulse mt-1">Uploading brand logo...</p>}
                    </div>
                  </div>

                  <div className="border border-stone-150 p-6 rounded-xl bg-stone-50/50 flex flex-col items-center justify-center min-h-[160px] text-center">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 self-start">Logo Live Preview</label>
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveImageUrl(logoUrl)} alt="Logo Preview" className="max-h-16 w-auto object-contain bg-white p-2 rounded shadow-sm border border-stone-200/50" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                        <span className="text-xs font-serif font-black text-stone-900 tracking-wider">BS Baristore</span>
                        <p className="text-[10px] max-w-[200px]">No logo uploaded. Falling back to corporate elegant typography.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('logo_url', logoUrl)}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ الشعار (Save Brand Logo)
                  </button>
                </div>
              </div>

              {/* VAT CONFIGURATION */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إعدادات ضريبة القيمة المضافة (VAT Settings)</h2>
                    <p className="text-xs text-stone-500">Configure how Value Added Tax is calculated and displayed across products and checkouts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Tax Inclusion Type</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-lg">
                      <button
                        onClick={() => setVatConfig({ ...vatConfig, type: 'inclusive' })}
                        className={`py-2 rounded-md text-xs font-semibold transition ${vatConfig.type === 'inclusive' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                      >
                        Inclusive (شامل الضريبة)
                      </button>
                      <button
                        onClick={() => setVatConfig({ ...vatConfig, type: 'exclusive' })}
                        className={`py-2 rounded-md text-xs font-semibold transition ${vatConfig.type === 'exclusive' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                      >
                        Exclusive (غير شامل الضريبة)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">VAT Tax Rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={vatConfig.rate}
                        onChange={e => setVatConfig({ ...vatConfig, rate: Number(e.target.value) })}
                        placeholder="e.g. 19"
                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-950 pr-8 font-mono font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('vat_config', vatConfig)}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ إعدادات الضريبة (Save VAT)
                  </button>
                </div>
              </div>

              {/* B2B CONFIGURATION */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-stone-950 text-white rounded-lg">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إعدادات بوابة الجملة (B2B Portal Settings)</h2>
                    <p className="text-xs text-stone-500">Configure business-to-business (B2B) transaction limits and merchant validation rules.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Default B2B Minimum Order Amount (€)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={b2bConfig.minimum_order_amount}
                        onChange={e => setB2bConfig({ ...b2bConfig, minimum_order_amount: Number(e.target.value) })}
                        placeholder="e.g. 2500"
                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-950 pr-8 font-mono font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">€</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-tight">
                      الحد الأدنى الافتراضي العام لشركاء B2B. يمكن تخصيص حد أدنى مالي لكل تاجر من تبويب الحسابات {"(B2B Partners -> Accounts)"}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Default B2B Minimum Product Qty</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={b2bConfig.default_b2b_min_qty ?? 1}
                        onChange={e => setB2bConfig({ ...b2bConfig, default_b2b_min_qty: Number(e.target.value) })}
                        placeholder="e.g. 1"
                        className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-950 pr-8 font-mono font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">Qty</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-tight">
                      الحد الأدنى الافتراضي العام لكمية الشراء لكل منتج لشركاء B2B. يمكن تخصيص حد أدنى للكمية لكل منتج من صفحة تعديل المنتج.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('b2b_config', b2bConfig)}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ إعدادات الجملة (Save B2B Settings)
                  </button>
                </div>
              </div>

              {/* BUY 2 GET 1 FREE PROMO SETTINGS */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إعدادات خصم 2+1 مجاناً (Buy 2 Get 1 Free Promo Settings)</h2>
                    <p className="text-xs text-stone-500">Configure if the 2+1 promotion is active and which category is eligible for the discount.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Promotion Status</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-lg">
                      <button
                        onClick={() => setBuy2get1Config({ ...buy2get1Config, active: true })}
                        className={`py-2 rounded-md text-xs font-semibold transition ${buy2get1Config.active ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                      >
                        Active (نشط)
                      </button>
                      <button
                        onClick={() => setBuy2get1Config({ ...buy2get1Config, active: false })}
                        className={`py-2 rounded-md text-xs font-semibold transition ${!buy2get1Config.active ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
                      >
                        Inactive (غير نشط)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">Eligible Categories (الأقسام المشمولة بالخصم)</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3 bg-stone-50/50">
                      <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!buy2get1Config.category_ids || buy2get1Config.category_ids.includes('all')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBuy2get1Config({ ...buy2get1Config, category_ids: ['all'] });
                            } else {
                              setBuy2get1Config({ ...buy2get1Config, category_ids: [] });
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                        <span>All Categories (كل الأقسام)</span>
                      </label>
                      <div className="border-t border-stone-200 my-2"></div>
                      {categories.map((c: any) => {
                        let catName = c.slug;
                        if (c.name) {
                          if (typeof c.name === 'string') {
                            try {
                              const parsed = JSON.parse(c.name);
                              catName = parsed.de || parsed.en || parsed.ar || c.slug;
                            } catch {
                              catName = c.name;
                            }
                          } else if (typeof c.name === 'object') {
                            catName = c.name.de || c.name.en || c.name.ar || c.slug;
                          }
                        }
                        const isAllSelected = !buy2get1Config.category_ids || buy2get1Config.category_ids.includes('all');
                        const isActuallyChecked = buy2get1Config.category_ids?.includes(c.id);
                        const indentClass = c.parent_id ? 'pl-6 rtl:pr-6' : 'font-bold';

                        return (
                          <label key={c.id} className={`flex items-center gap-2 text-sm text-stone-700 cursor-pointer py-1 ${indentClass}`}>
                            <input
                              type="checkbox"
                              checked={isAllSelected ? true : !!isActuallyChecked}
                              disabled={isAllSelected}
                              onChange={(e) => {
                                let currentIds = buy2get1Config.category_ids || [];
                                if (currentIds.includes('all')) {
                                  currentIds = [];
                                }
                                let nextIds: string[];
                                if (e.target.checked) {
                                  nextIds = [...currentIds, c.id];
                                } else {
                                  nextIds = currentIds.filter((id: string) => id !== c.id);
                                }
                                setBuy2get1Config({ ...buy2get1Config, category_ids: nextIds });
                              }}
                              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                            <span>{c.parent_id ? '↳ ' : ''}{catName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('buy2get1_config', buy2get1Config)}
                    className="bg-stone-950 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ إعدادات العرض (Save Promo Settings)
                  </button>
                </div>
              </div>

              {/* LOGISTICS & EUROPEAN SHIPPING */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إدارة طرق شحن أوروبا والعالم (Logistics & European Shipping)</h2>
                    <p className="text-xs text-stone-500">Configure logistics, courier types, transit timeframes, and country-specific rates across Europe.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Shipping Form */}
                  <form onSubmit={handleAddShipping} className="lg:col-span-1 space-y-4 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">أضف خيار شحن جديد (New Shipping Method)</h3>

                    {/* Courier Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Courier Name</label>
                      <input
                        type="text"
                        value={newShipping.name}
                        onChange={e => setNewShipping({ ...newShipping, name: e.target.value })}
                        placeholder="e.g. DHL Express Europe"
                        className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                        required
                      />
                    </div>

                    {/* Service Type */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">🚚 نوع الخدمة / Service Type</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { val: 'express', label: '⚡ Express', color: 'bg-amber-50 border-amber-300 text-amber-800' },
                          { val: 'standard', label: '📦 Standard', color: 'bg-blue-50 border-blue-300 text-blue-800' },
                          { val: 'economy', label: '💰 Economy', color: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
                          { val: 'pallet', label: '🏭 Pallet/Freight', color: 'bg-purple-50 border-purple-300 text-purple-800' },
                        ].map(({ val, label, color }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewShipping({ ...newShipping, service_type: val })}
                            className={`py-1.5 px-2 rounded-lg border-2 text-[10px] font-bold transition-all ${
                              newShipping.service_type === val ? color + ' ring-2 ring-offset-1 ring-stone-400' : 'border-stone-200 text-stone-500 bg-white hover:border-stone-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customer Type */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">👥 للعملاء / Customer Type</label>
                      <div className="flex gap-1.5">
                        {[
                          { val: 'b2c', label: '🛍 مفرق (B2C)' },
                          { val: 'b2b', label: '🏢 جملة (B2B)' },
                          { val: 'both', label: '✅ كلاهما (Both)' },
                        ].map(({ val, label }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewShipping({ ...newShipping, customer_type: val })}
                            className={`flex-1 py-1.5 px-1 rounded-lg border-2 text-[10px] font-bold transition-all text-center ${
                              newShipping.customer_type === val
                                ? 'border-stone-900 bg-stone-900 text-white'
                                : 'border-stone-200 text-stone-600 bg-white hover:border-stone-400'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scope Target Selection (Applies To: All / Categories / Products) */}
                    <div className="space-y-1.5 border-t border-stone-200/60 pt-3">
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-widest flex items-center gap-1">
                        🎯 ينطبق على / Applies To
                      </label>
                      <div className="flex gap-1.5">
                        {[
                          { val: 'all', label: '🌐 الكل (All)' },
                          { val: 'categories', label: '📂 تصنيف (Category)' },
                          { val: 'products', label: '📦 منتج (Product)' },
                        ].map(({ val, label }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewShipping({ ...newShipping, applies_to: val })}
                            className={`flex-1 py-1.5 px-1 rounded-lg border-2 text-[9px] font-bold transition-all text-center ${
                              (newShipping.applies_to || 'all') === val
                                ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-400'
                                : 'border-stone-200 text-stone-600 bg-white hover:border-stone-400'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Specific Category Selector */}
                      {newShipping.applies_to === 'categories' && (
                        <div className="space-y-1 mt-2">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase">اختر التصنيف المشمول:</label>
                          <select
                            value={newShipping.target_category || ''}
                            onChange={e => setNewShipping({ ...newShipping, target_category: e.target.value })}
                            className="w-full border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 bg-amber-50/40 focus:outline-none focus:border-amber-600 font-bold"
                          >
                            <option value="">-- اختر التصنيف / Select Category --</option>
                            {categories.map((cat: any) => {
                              const cName = typeof cat.name === 'object' ? (cat.name.ar || cat.name.de || cat.name.en || '') : String(cat.name || '');
                              return (
                                <option key={cat.id || cName} value={cName}>
                                  {cName}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Smart Product Search Selector */}
                      {newShipping.applies_to === 'products' && (
                        <div className="space-y-2 mt-2">
                          <label className="block text-[9px] font-bold text-stone-600 uppercase tracking-wider">
                            🔍 البحث الذكي واختيار المنتج المشمول:
                          </label>

                          {/* Selected Product Card */}
                          {newShipping.target_product ? (() => {
                            const selectedProd = products.find((p: any) => p.id === newShipping.target_product);
                            const rawName = selectedProd
                              ? ((typeof selectedProd.translations === 'object' && selectedProd.translations
                                  ? (selectedProd.translations.de || selectedProd.translations.ar || selectedProd.translations.en || Object.values(selectedProd.translations)[0])
                                  : (typeof selectedProd.name === 'object' && selectedProd.name ? (selectedProd.name.de || selectedProd.name.ar || selectedProd.name.en) : selectedProd.name))
                                  || selectedProd.title || selectedProd.attributes?.name || `Product #${selectedProd.id}`)
                              : newShipping.target_product;

                            return (
                              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-xs">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {selectedProd?.image_url && (
                                    <img src={resolveImageUrl(selectedProd.image_url)} alt="" className="w-8 h-8 rounded-lg object-cover border border-emerald-200 shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <div className="text-xs font-bold text-emerald-950 truncate">{rawName}</div>
                                    <div className="text-[10px] font-mono text-emerald-700">
                                      {selectedProd?.sku ? `SKU: ${selectedProd.sku}` : `ID: ${newShipping.target_product}`}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setNewShipping({ ...newShipping, target_product: '' })}
                                  className="text-[10px] bg-white text-rose-600 border border-rose-200 px-2 py-1 rounded-lg font-bold hover:bg-rose-50 transition shrink-0 ml-2"
                                >
                                  ✕ تغيير
                                </button>
                              </div>
                            );
                          })() : (
                            <div className="relative space-y-1">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={shippingProdSearch}
                                  onChange={(e) => setShippingProdSearch(e.target.value)}
                                  placeholder="ابحث باسم المنتج أو الـ SKU..."
                                  className="w-full pl-8 pr-7 py-2 border border-amber-300 rounded-xl text-xs text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium shadow-xs"
                                />
                                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                {shippingProdSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setShippingProdSearch('')}
                                    className="text-stone-400 hover:text-stone-600 text-xs absolute right-2.5 top-1/2 -translate-y-1/2"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {/* Search Results List */}
                              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl bg-white shadow-lg space-y-0.5 p-1 divide-y divide-stone-50">
                                {(products)
                                  .filter((prod: any) => {
                                    if (!shippingProdSearch.trim()) return true;
                                    const q = shippingProdSearch.toLowerCase().trim();
                                    const rawName = String(
                                      (typeof prod.translations === 'object' && prod.translations
                                        ? (prod.translations.de || prod.translations.ar || prod.translations.en || Object.values(prod.translations)[0])
                                        : (typeof prod.name === 'object' && prod.name ? (prod.name.de || prod.name.ar || prod.name.en) : prod.name))
                                      || prod.title || prod.attributes?.name || ''
                                    ).toLowerCase();
                                    const sku = String(prod.sku || '').toLowerCase();
                                    const id = String(prod.id || '').toLowerCase();
                                    return rawName.includes(q) || sku.includes(q) || id.includes(q);
                                  })
                                  .slice(0, 25)
                                  .map((prod: any) => {
                                    const rawName = (typeof prod.translations === 'object' && prod.translations
                                      ? (prod.translations.de || prod.translations.ar || prod.translations.en || Object.values(prod.translations)[0])
                                      : (typeof prod.name === 'object' && prod.name ? (prod.name.de || prod.name.ar || prod.name.en) : prod.name))
                                      || prod.title
                                      || prod.attributes?.name
                                      || `Product #${prod.id}`;
                                    const sku = prod.sku ? `SKU: ${prod.sku}` : '';
                                    const price = prod.net_sales_price || prod.sales_price_with_tax || prod.retail_price || prod.price;

                                    return (
                                      <div
                                        key={prod.id}
                                        onClick={() => {
                                          setNewShipping({ ...newShipping, target_product: prod.id });
                                          setShippingProdSearch('');
                                        }}
                                        className="p-2 hover:bg-amber-50 rounded-lg cursor-pointer transition flex items-center justify-between gap-2"
                                      >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          {prod.image_url && (
                                            <img src={resolveImageUrl(prod.image_url)} alt="" className="w-7 h-7 rounded object-cover border border-stone-200 shrink-0" />
                                          )}
                                          <div className="truncate">
                                            <div className="text-xs font-bold text-stone-850 truncate">{rawName}</div>
                                            {sku && <div className="text-[9px] font-mono text-stone-400">{sku}</div>}
                                          </div>
                                        </div>
                                        {price && (
                                          <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100/60 px-1.5 py-0.5 rounded shrink-0">
                                            €{parseFloat(price).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}

                                {(products).filter((prod: any) => {
                                  if (!shippingProdSearch.trim()) return true;
                                  const q = shippingProdSearch.toLowerCase().trim();
                                  const rawName = String(
                                    (typeof prod.translations === 'object' && prod.translations
                                      ? (prod.translations.de || prod.translations.ar || prod.translations.en || Object.values(prod.translations)[0])
                                      : (typeof prod.name === 'object' && prod.name ? (prod.name.de || prod.name.ar || prod.name.en) : prod.name))
                                    || prod.title || prod.attributes?.name || ''
                                  ).toLowerCase();
                                  const sku = String(prod.sku || '').toLowerCase();
                                  const id = String(prod.id || '').toLowerCase();
                                  return rawName.includes(q) || sku.includes(q) || id.includes(q);
                                }).length === 0 && (
                                  <div className="p-3 text-center text-xs text-stone-400">
                                    لم يتم العثور على منتجات تطابق "{shippingProdSearch}"
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Costs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">💶 B2C Cost (€)</label>
                        <input
                          type="number" step="0.01"
                          value={newShipping.cost}
                          onChange={e => setNewShipping({ ...newShipping, cost: Number(e.target.value) })}
                          className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">🏢 B2B Cost (€)</label>
                        <input
                          type="number" step="0.01"
                          value={newShipping.b2b_cost}
                          onChange={e => setNewShipping({ ...newShipping, b2b_cost: Number(e.target.value) })}
                          className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                        />
                      </div>
                    </div>

                    {/* Transit Days */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">📅 مدة التوصيل / Transit Days</label>
                      <input
                        type="text"
                        value={newShipping.days}
                        onChange={e => setNewShipping({ ...newShipping, days: e.target.value })}
                        placeholder="e.g. 1-3 Werktage / Business Days"
                        className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">📝 ملاحظات / Notes</label>
                      <input
                        type="text"
                        value={newShipping.notes}
                        onChange={e => setNewShipping({ ...newShipping, notes: e.target.value })}
                        placeholder="e.g. Tracking included. Signature required."
                        className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                      />
                    </div>

                    {/* Country Selector */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">🌍 الدول / Covered Countries</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={selectAllEuropeanCountries} className="text-[9px] text-emerald-600 font-bold hover:underline">All Europe</button>
                          <button type="button" onClick={clearSelectedCountries} className="text-[9px] text-rose-500 font-bold hover:underline">Clear</button>
                        </div>
                      </div>
                      <div className="h-40 overflow-y-auto border border-stone-200 rounded-lg bg-white p-2 space-y-1">
                        {EUROPEAN_COUNTRIES.map(country => (
                          <label key={country} className="flex items-center gap-2 px-2 py-1 hover:bg-stone-50 rounded text-xs text-stone-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newShipping.countries.includes(country)}
                              onChange={() => toggleShippingCountry(country)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            {country}
                          </label>
                        ))}
                      </div>
                      {newShipping.countries.length > 0 && (
                        <p className="text-[10px] text-stone-500 font-medium">Selected: {newShipping.countries.length} countries</p>
                      )}
                    </div>

                    <button type="submit" className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-black transition uppercase tracking-widest flex items-center justify-center gap-2">
                      <Truck className="w-3.5 h-3.5" /> إضافة وسيلة الشحن (Add Shipping Method)
                    </button>
                  </form>

                  {/* Shipping Directory List */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">طرق الشحن الحالية (Configured Methods)</h3>

                    <div className="space-y-3">
                      {shippingMethods.map((method, idx) => {
                        const serviceColors: Record<string, string> = {
                          express: 'bg-amber-50 text-amber-700 border-amber-200',
                          standard: 'bg-blue-50 text-blue-700 border-blue-200',
                          economy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          pallet: 'bg-purple-50 text-purple-700 border-purple-200',
                        };
                        const serviceIcons: Record<string, string> = {
                          express: '⚡', standard: '📦', economy: '💰', pallet: '🏭'
                        };
                        const custColors: Record<string, string> = {
                          b2c: 'bg-rose-50 text-rose-700 border-rose-200',
                          b2b: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          both: 'bg-stone-50 text-stone-700 border-stone-200',
                        };
                        const custLabels: Record<string, string> = {
                          b2c: '🛍 مفرق (B2C)', b2b: '🏢 جملة (B2B)', both: '✅ كلاهما'
                        };
                        const sType = method.service_type || 'standard';
                        const cType = method.customer_type || 'both';
                        return (
                          <div key={method.id || idx} className="border border-stone-100 bg-white p-4 rounded-xl shadow-xs hover:border-stone-200 transition group">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-stone-900 text-sm">{method.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${serviceColors[sType] || serviceColors.standard}`}>
                                  {serviceIcons[sType]} {sType.charAt(0).toUpperCase() + sType.slice(1)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${custColors[cType] || custColors.both}`}>
                                  {custLabels[cType] || cType}
                                </span>
                                {method.applies_to === 'categories' && method.target_category && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-900 border-amber-300">
                                    📂 {typeof method.target_category === 'object' ? (method.target_category.ar || method.target_category.de || method.target_category.en) : String(method.target_category)}
                                  </span>
                                )}
                                {method.applies_to === 'products' && method.target_product && (() => {
                                  const targetP = products.find(p => p.id === method.target_product);
                                  const pName = targetP ? (typeof targetP.name === 'object' ? (targetP.name.ar || targetP.name.de || targetP.name.en) : String(targetP.name)) : String(method.target_product);
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-900 border-purple-300">
                                      📦 {pName}
                                    </span>
                                  );
                                })()}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveShipping(method.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="bg-stone-50 rounded-lg p-2 text-center border border-stone-100">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">📅 المدة</p>
                                <p className="text-xs font-bold text-stone-900">{method.days}</p>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">🛍 B2C</p>
                                <p className="text-xs font-bold text-blue-700 font-mono">€{parseFloat(method.cost || 0).toFixed(2)}</p>
                              </div>
                              <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">🏢 B2B</p>
                                <p className="text-xs font-bold text-emerald-700 font-mono">€{parseFloat(method.b2b_cost || method.cost || 0).toFixed(2)}</p>
                              </div>
                            </div>

                            {method.notes && (
                              <p className="text-[10px] text-stone-500 italic mb-2">📝 {method.notes}</p>
                            )}

                            <div className="flex flex-wrap gap-1">
                              {method.countries.map((c: string, ci: number) => (
                                <span key={ci} className="text-[9px] bg-stone-100 border border-stone-200/50 rounded px-1.5 py-0.5 text-stone-600 font-medium">{c}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {shippingMethods.length === 0 && (
                        <div className="p-8 text-center text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 flex flex-col items-center gap-2">
                          <Truck className="w-8 h-8 text-stone-300" />
                          <p className="text-xs">No active shipping methods. Configure DHL above.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('shipping_methods', shippingMethods)}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ تكاليف الشحن (Save Logistics Cost)
                  </button>
                </div>
              </div>

              {/* HERO BANNER SECTION */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إدارة صور ونصوص البنر (Hero Banner Slider Manager)</h2>
                    <p className="text-xs text-stone-500">Configure exactly 4 hero banners showing text and sliding images on the home section with transition animations.</p>
                  </div>
                </div>

                {heroBanners.length >= 4 ? (
                  <div className="space-y-6">
                    {/* Slide Selector Tabs */}
                    <div className="flex border-b border-stone-100">
                      {[0, 1, 2, 3].map(i => (
                        <button
                          key={i}
                          onClick={() => setActiveSlideTab(i)}
                          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 text-center ${activeSlideTab === i ? 'border-amber-500 text-amber-600 bg-amber-50/20' : 'border-transparent text-stone-400 hover:text-stone-700'}`}
                        >
                          البنر {i + 1} (Banner {i + 1})
                        </button>
                      ))}
                    </div>

                    {/* Active Slide Form */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 items-start">
                      {/* Slide inputs */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Accent / Small Tag</label>
                            <input
                              type="text"
                              value={heroBanners[activeSlideTab]?.accent || ''}
                              onChange={e => handleBannerChange(activeSlideTab, 'accent', e.target.value)}
                              placeholder="e.g. Global Distributor"
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Headline Title</label>
                            <input
                              type="text"
                              value={heroBanners[activeSlideTab]?.title || ''}
                              onChange={e => handleBannerChange(activeSlideTab, 'title', e.target.value)}
                              placeholder="e.g. Redefining Luxury Procurement"
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 font-serif font-bold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Description / Subtitle</label>
                          <textarea
                            value={heroBanners[activeSlideTab]?.subtitle || ''}
                            onChange={e => handleBannerChange(activeSlideTab, 'subtitle', e.target.value)}
                            placeholder="Explain the banner details..."
                            rows={3}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                          />
                        </div>

                        {/* Button 1 & 2 Customization */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Button 1 Title (نص الزر الأول)</label>
                            <input
                              type="text"
                              value={heroBanners[activeSlideTab]?.btn1_text || ''}
                              onChange={e => handleBannerChange(activeSlideTab, 'btn1_text', e.target.value)}
                              placeholder="e.g. Shop Collections"
                              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Button 1 Link (رابط الزر الأول)</label>
                            <input
                              type="text"
                              value={heroBanners[activeSlideTab]?.btn1_link || ''}
                              onChange={e => handleBannerChange(activeSlideTab, 'btn1_link', e.target.value)}
                              placeholder="e.g. /shop"
                              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Button 2 Title (نص الزر الثاني)</label>
                            <input
                              type="text"
                              value={heroBanners[activeSlideTab]?.btn2_text || ''}
                              onChange={e => handleBannerChange(activeSlideTab, 'btn2_text', e.target.value)}
                              placeholder="e.g. Wholesale Portal"
                              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Button 2 Link (رابط الزر الثاني)</label>
                            <input
                              type="text"
                              value={heroBanners[activeSlideTab]?.btn2_link || ''}
                              onChange={e => handleBannerChange(activeSlideTab, 'btn2_link', e.target.value)}
                              placeholder="e.g. /wholesale"
                              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>
                        </div>

                        {/* Image Source */}
                        <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-100 flex flex-col md:flex-row gap-4 items-center">
                          <div className="flex-1 w-full space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Banner Image URL</label>
                            <input
                              type="text"
                              value={heroBanners[activeSlideTab]?.image_url || ''}
                              onChange={e => handleBannerChange(activeSlideTab, 'image_url', e.target.value)}
                              placeholder="Paste Unsplash or direct image URL..."
                              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>

                          <div className="shrink-0 flex flex-col gap-1 w-full md:w-auto">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Or Upload Banner</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                  handleBannerImageUpload(activeSlideTab, e.target.files[0]);
                                }
                              }}
                              className="text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visual Preview Card */}
                      <div className="lg:col-span-1 border border-stone-100 rounded-xl overflow-hidden shadow-xs relative bg-[#FAF9F6] aspect-[4/3] flex flex-col justify-end p-4 group">
                        <div
                          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-102"
                          style={{ backgroundImage: `url('${resolveImageUrl(heroBanners[activeSlideTab]?.image_url) || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'}')` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent"></div>

                        <div className="relative z-10 text-white space-y-1.5">
                          <span className="text-amber-400 font-bold uppercase tracking-[0.1em] text-[9px]">{heroBanners[activeSlideTab]?.accent || 'Preview Tag'}</span>
                          <h4 className="font-serif font-bold text-base leading-tight">{heroBanners[activeSlideTab]?.title || 'Preview Title'}</h4>
                          <p className="text-white/70 text-[10px] line-clamp-2">{heroBanners[activeSlideTab]?.subtitle || 'Preview Subtitle'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-stone-500 animate-pulse">Loading slide editor...</div>
                )}

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('hero_banners', heroBanners)}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ البنرات الأربعة (Save Banners Configuration)
                  </button>
                </div>
              </div>

              {/* HOMEPAGE STATS MANAGER */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إدارة إحصائيات الصفحة الرئيسية (Homepage Stats Manager)</h2>
                    <p className="text-xs text-stone-500">Configure the 4 counter stats shown at the top of the homepage below the hero slider.</p>
                  </div>
                </div>

                {homepageStats.length === 4 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {homepageStats.map((stat, i) => (
                      <div key={i} className="bg-stone-50/50 p-4 rounded-xl border border-stone-150 space-y-4">
                        <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                          <span className="text-xs font-bold text-stone-400 font-mono">Stat Column #{i + 1}</span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Stat Value (الرقم أو القيمة)</label>
                          <input
                            type="text"
                            value={stat.value || ''}
                            onChange={e => handleStatChange(i, 'value', e.target.value)}
                            placeholder="e.g. 500+ or 99.8%"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono focus:outline-none focus:border-stone-900 text-stone-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Label (English)</label>
                          <input
                            type="text"
                            value={stat.label_en || ''}
                            onChange={e => handleStatChange(i, 'label_en', e.target.value)}
                            placeholder="e.g. Premium Brands"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">الاسم (بالعربية)</label>
                          <input
                            type="text"
                            value={stat.label_ar || ''}
                            onChange={e => handleStatChange(i, 'label_ar', e.target.value)}
                            placeholder="مثال: العلامات التجارية"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-stone-500 animate-pulse">Loading stats configuration...</div>
                )}

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('homepage_stats', homepageStats)}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ الإحصائيات (Save Stats)
                  </button>
                </div>
              </div>

              {/* HOMEPAGE FEATURED COLLECTIONS */}
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">إدارة المجموعات المختارة بالصفحة الرئيسية (Homepage Featured Collections Manager)</h2>
                    <p className="text-xs text-stone-500">Configure the images, localized titles, subtitles, custom tags, and navigation links of the 3 columns shown in the middle of the homepage.</p>
                  </div>
                </div>

                <div className="space-y-8 divide-y divide-stone-100">

                  {/* MAIN LARGE CARD */}
                  <div className="pt-6 first:pt-0 space-y-6">
                    <h3 className="text-sm font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                      البنر الرئيسي الكبير (Main Large Left Banner)
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Tag (English)</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.tag_en || ''}
                              onChange={e => handleFeaturedChange('main', 'tag_en', e.target.value)}
                              placeholder="e.g. Seasonal Curated"
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">الوسم (Arabic)</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.tag_ar || ''}
                              onChange={e => handleFeaturedChange('main', 'tag_ar', e.target.value)}
                              placeholder="مثال: مجموعات المواسم الخاصة"
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Title (English)</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.title_en || ''}
                              onChange={e => handleFeaturedChange('main', 'title_en', e.target.value)}
                              placeholder="e.g. Summer Nocturne Collection"
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 font-serif font-bold"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">العنوان (Arabic)</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.title_ar || ''}
                              onChange={e => handleFeaturedChange('main', 'title_ar', e.target.value)}
                              placeholder="مثال: عطر نكتار الصيف الفاخر"
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl font-serif font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Subtitle (English)</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.subtitle_en || ''}
                              onChange={e => handleFeaturedChange('main', 'subtitle_en', e.target.value)}
                              placeholder="Describe this collection..."
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">الوصف الفرعي (Arabic)</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.subtitle_ar || ''}
                              onChange={e => handleFeaturedChange('main', 'subtitle_ar', e.target.value)}
                              placeholder="الوصف باللغة العربية..."
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Navigation Link</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.link || ''}
                              onChange={e => handleFeaturedChange('main', 'link', e.target.value)}
                              placeholder="e.g. /shop or specific URL"
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Banner Image URL</label>
                            <input
                              type="text"
                              value={homepageFeatured.main?.image_url || ''}
                              onChange={e => handleFeaturedChange('main', 'image_url', e.target.value)}
                              placeholder="Direct image link..."
                              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 bg-stone-50 p-3 rounded-lg border border-stone-200/50">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Or Upload Main Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleFeaturedImageUpload('main', e.target.files[0]);
                              }
                            }}
                            className="text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Visual Preview */}
                      <div className="border border-stone-100 rounded-xl overflow-hidden shadow-xs relative bg-[#FAF9F6] aspect-[4/3] lg:aspect-auto flex flex-col justify-end p-6">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url('${resolveImageUrl(homepageFeatured.main?.image_url) || 'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=600&auto=format&fit=crop'}')` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                        <div className="relative z-10 text-white space-y-1.5">
                          <span className="text-amber-400 font-bold uppercase tracking-[0.15em] text-[8px]">{homepageFeatured.main?.tag_en || 'Tag Preview'}</span>
                          <h4 className="font-serif font-bold text-lg leading-tight">{homepageFeatured.main?.title_en || 'Title Preview'}</h4>
                          <p className="text-white/60 text-[10px] line-clamp-2">{homepageFeatured.main?.subtitle_en || 'Subtitle Preview'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECONDARY CARDS */}
                  <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* CARD 1 */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                        البطاقة الجانبية الأولى (Right Card 1)
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Title (English)</label>
                          <input
                            type="text"
                            value={homepageFeatured.card1?.title_en || ''}
                            onChange={e => handleFeaturedChange('card1', 'title_en', e.target.value)}
                            placeholder="e.g. The Artisanal Edit"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-serif font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">العنوان (Arabic)</label>
                          <input
                            type="text"
                            value={homepageFeatured.card1?.title_ar || ''}
                            onChange={e => handleFeaturedChange('card1', 'title_ar', e.target.value)}
                            placeholder="مثال: العطور المصممة يدوياً"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl font-serif font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Navigation Link</label>
                          <input
                            type="text"
                            value={homepageFeatured.card1?.link || ''}
                            onChange={e => handleFeaturedChange('card1', 'link', e.target.value)}
                            placeholder="e.g. /shop"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Image URL</label>
                          <input
                            type="text"
                            value={homepageFeatured.card1?.image_url || ''}
                            onChange={e => handleFeaturedChange('card1', 'image_url', e.target.value)}
                            placeholder="Direct image URL..."
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="sm:col-span-2 space-y-1 bg-stone-50 p-2.5 rounded-lg border border-stone-200/50">
                          <label className="block text-[8px] font-bold text-stone-500 uppercase tracking-widest">Or Upload Card 1 Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleFeaturedImageUpload('card1', e.target.files[0]);
                              }
                            }}
                            className="text-[10px] text-stone-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                          />
                        </div>

                        <div className="border border-stone-100 rounded-lg overflow-hidden relative aspect-[2/1] bg-[#FAF9F6]">
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${resolveImageUrl(homepageFeatured.card1?.image_url) || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400&auto=format&fit=crop'}')` }}
                          ></div>
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold text-white leading-tight font-serif truncate w-full">{homepageFeatured.card1?.title_en || 'Card 1 Preview'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2 */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-stone-950 uppercase tracking-wider flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                        البطاقة الجانبية الثانية (Right Card 2)
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Title (English)</label>
                          <input
                            type="text"
                            value={homepageFeatured.card2?.title_en || ''}
                            onChange={e => handleFeaturedChange('card2', 'title_en', e.target.value)}
                            placeholder="e.g. Wholesale Exclusives"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-serif font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">العنوان (Arabic)</label>
                          <input
                            type="text"
                            value={homepageFeatured.card2?.title_ar || ''}
                            onChange={e => handleFeaturedChange('card2', 'title_ar', e.target.value)}
                            placeholder="مثال: حصريات تجارة الجملة"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl font-serif font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Navigation Link</label>
                          <input
                            type="text"
                            value={homepageFeatured.card2?.link || ''}
                            onChange={e => handleFeaturedChange('card2', 'link', e.target.value)}
                            placeholder="e.g. /shop"
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest">Image URL</label>
                          <input
                            type="text"
                            value={homepageFeatured.card2?.image_url || ''}
                            onChange={e => handleFeaturedChange('card2', 'image_url', e.target.value)}
                            placeholder="Direct image URL..."
                            className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="sm:col-span-2 space-y-1 bg-stone-50 p-2.5 rounded-lg border border-stone-200/50">
                          <label className="block text-[8px] font-bold text-stone-500 uppercase tracking-widest">Or Upload Card 2 Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleFeaturedImageUpload('card2', e.target.files[0]);
                              }
                            }}
                            className="text-[10px] text-stone-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                          />
                        </div>

                        <div className="border border-stone-100 rounded-lg overflow-hidden relative aspect-[2/1] bg-[#FAF9F6]">
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url('${resolveImageUrl(homepageFeatured.card2?.image_url) || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=400&auto=format&fit=crop'}')` }}
                          ></div>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2 text-center">
                            <span className="text-[10px] font-bold text-white leading-tight font-serif truncate w-full">{homepageFeatured.card2?.title_en || 'Card 2 Preview'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={() => saveSetting('homepage_featured', homepageFeatured)}
                    className="bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> حفظ المجموعات المختارة (Save Featured Collections)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── Add Product Modal ──────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#F4F5F7] rounded-2xl shadow-2xl w-full max-w-5xl my-6 animate-in zoom-in-95 duration-200 overflow-hidden">

            {/* ── Modal Header ── */}
            <div className="flex items-center justify-between px-7 py-5 bg-white border-b border-stone-200 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 leading-tight">Add New Product</h2>
                  <p className="text-xs text-stone-400 mt-0.5">Fill in the details below — variants can be added for different sizes</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="p-6 space-y-5">

                {/* ── CARD 1: Basic Info ── */}
                <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md shadow-stone-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md shadow-stone-900/10">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Product Information</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">Define core identifiers, translations, and descriptors</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">

                    {/* Name row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newProduct.name_en}
                          onChange={e => setNewProduct({ ...newProduct, name_en: e.target.value })}
                          placeholder="e.g. Royal Oud Blend"
                          className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition placeholder-stone-300 shadow-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1 relative">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Brand</label>
                        <input
                          type="text"
                          value={newProduct.brand || ''}
                          onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                          onFocus={() => setShowAddBrandSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowAddBrandSuggestions(false), 200)}
                          placeholder="e.g. REEF"
                          className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition placeholder-stone-300 shadow-sm"
                        />
                        {showAddBrandSuggestions && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-stone-100">
                            {existingBrands.filter(b => b.toLowerCase().includes((newProduct.brand || '').toLowerCase())).length > 0 ? (
                              existingBrands
                                .filter(b => b.toLowerCase().includes((newProduct.brand || '').toLowerCase()))
                                .map(brand => (
                                  <button
                                    key={brand}
                                    type="button"
                                    onMouseDown={() => {
                                      setNewProduct((prev: any) => ({ ...prev, brand }));
                                      setShowAddBrandSuggestions(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 font-medium transition cursor-pointer"
                                  >
                                    {brand}
                                  </button>
                                ))
                            ) : (
                              <div className="px-4 py-2.5 text-xs text-stone-400 italic">No existing brands match</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Sales Channel</label>
                        <select
                          value={newProduct.sales_mode || 'BOTH'}
                          onChange={e => setNewProduct({ ...newProduct, sales_mode: e.target.value })}
                          className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition font-medium shadow-sm cursor-pointer"
                        >
                          <option value="BOTH">Retail & Wholesale</option>
                          <option value="RETAIL_ONLY">Retail Only (B2C)</option>
                          <option value="WHOLESALE_ONLY">Wholesale Only (B2B)</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Description</label>
                      <RichTextEditor
                        value={newProduct.description_en}
                        onChange={val => setNewProduct({ ...newProduct, description_en: val })}
                        placeholder="Detailed product description..."
                      />
                    </div>

                    {/* Short Description / Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Short Specs / Notes</label>
                      <RichTextEditor
                        value={newProduct.short_description_en}
                        onChange={val => setNewProduct({ ...newProduct, short_description_en: val })}
                        placeholder="Key specs, scent notes, ingredients..."
                      />
                    </div>

                    {/* SEO Tags */}
                    <SeoTagsInput
                      tags={(() => {
                        if (Array.isArray(newProduct.tags)) return newProduct.tags;
                        if (typeof newProduct.tags === 'string' && newProduct.tags)
                          return newProduct.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
                        return [];
                      })()}
                      onChange={(tags) => setNewProduct({ ...newProduct, tags: tags.join(', ') })}
                    />

                    {/* Admin Note (Private) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#d40026] uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d40026] inline-block" />
                        🔒 Admin Note (Private - link, cost, supplier...)
                      </label>
                      <textarea
                        value={newProduct.admin_note || ''}
                        onChange={e => setNewProduct({ ...newProduct, admin_note: e.target.value })}
                        placeholder="e.g. Supplier product link (https://...), wholesale costs, supplier name..."
                        rows={3}
                        className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition placeholder-stone-300 shadow-sm"
                      />
                    </div>

                    {/* Scent Notes (Only for Perfumes) */}
                    <div className="space-y-3 pt-3 border-t border-stone-100">
                      <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Duftpyramide / Scent Notes (Kopf, Herz, Basis)
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider">Kopfnote (Top Notes)</span>
                          <input
                            type="text"
                            value={newProduct.scent_top || ''}
                            onChange={e => setNewProduct({ ...newProduct, scent_top: e.target.value })}
                            placeholder="z.B. Bergamotte, Zitrone, Apfel"
                            className="w-full border border-stone-200 bg-stone-50/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 text-stone-900 transition placeholder-stone-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-rose-800 tracking-wider">Herznote (Heart Notes)</span>
                          <input
                            type="text"
                            value={newProduct.scent_heart || ''}
                            onChange={e => setNewProduct({ ...newProduct, scent_heart: e.target.value })}
                            placeholder="z.B. Jasmin, Rose, Zimt"
                            className="w-full border border-stone-200 bg-stone-50/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 text-stone-900 transition placeholder-stone-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-stone-850 tracking-wider">Basisnote (Base Notes)</span>
                          <input
                            type="text"
                            value={newProduct.scent_base || ''}
                            onChange={e => setNewProduct({ ...newProduct, scent_base: e.target.value })}
                            placeholder="z.B. Oud, Amber, Moschus, Vanille"
                            className="w-full border border-stone-200 bg-stone-50/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 text-stone-900 transition placeholder-stone-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CARD 2: Categories ── */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">Categories</span>
                    </div>
                    {newProduct.category_ids?.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {newProduct.category_ids.length} selected
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                      {categories.map((c: any) => {
                        const checked = newProduct.category_ids?.includes(c.id);
                        const isPrimary = newProduct.category_ids?.[0] === c.id;
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition select-none ${checked
                                ? 'bg-stone-900 border-stone-900 text-white'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-white'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={() => {
                                const current: string[] = newProduct.category_ids || [];
                                const next = checked
                                  ? current.filter((id: string) => id !== c.id)
                                  : [...current, c.id];
                                setNewProduct({ ...newProduct, category_ids: next, category_id: next[0] || '' });
                              }}
                              className="hidden"
                            />
                            <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition ${checked ? 'border-white bg-white' : 'border-stone-300'}`}>
                              {checked && <div className="w-1.5 h-1.5 rounded-sm bg-stone-900" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${checked ? 'text-white' : 'text-stone-800'}`}>
                                {c.name?.en || 'Unnamed'}
                              </p>
                              {isPrimary && <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">Primary</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── CARD 3: Variants ── */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">Variants & Pricing</span>
                      {newProduct.product_type === 'standard_multi' && (
                        <span className="text-[10px] text-stone-400 font-medium">({newProduct.variants.length})</span>
                      )}
                    </div>
                    {newProduct.product_type === 'standard_multi' && (
                      <button
                        type="button"
                        onClick={addVariantRow}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-black transition text-[11px] font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Variant
                      </button>
                    )}
                  </div>

                  {/* Product Type Selector */}
                  <div className="p-5 border-b border-stone-100 bg-stone-50/20">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-2.5">Product Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'standard_multi', label: 'Multi-Variant Product', desc: 'Different sizes, volumes, etc. (e.g. 100ml, 50ml)' },
                        { value: 'standard_single', label: 'Standard Single Product', desc: 'Simple product, sold in one size only' },
                        { value: 'sample', label: 'Sample Product', desc: 'Decant / perfume sample with no variant sizes' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setNewProduct((prev: any) => ({
                              ...prev,
                              product_type: opt.value,
                              variants: opt.value === 'standard_multi' 
                                ? (prev.variants.length > 0 ? prev.variants : [{ variant_type: '100ml Eau de Parfum', stock_quantity: 50, net_sales_price: 80.00, sales_price_with_tax: 95.20, b2b_price: 55.00, retail_price: 120.00, b2bMinQty: 1, image_mode: 'url' }]) 
                                : [{ 
                                    ...(prev.variants[0] || { stock_quantity: 50, net_sales_price: 80.00, sales_price_with_tax: 95.20, b2b_price: 55.00, retail_price: 120.00, b2bMinQty: 1, image_mode: 'url' }),
                                    variant_type: opt.value === 'sample' ? 'Sample' : '' 
                                  }]
                            }));
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            newProduct.product_type === opt.value
                              ? 'border-stone-950 bg-stone-950 text-white shadow-md'
                              : 'border-stone-200 hover:border-stone-400 bg-white text-stone-750'
                          }`}
                        >
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className={`text-[10px] mt-1 leading-normal ${newProduct.product_type === opt.value ? 'text-stone-300' : 'text-stone-400'}`}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {newProduct.variants.map((variant: any, index: number) => (
                      <div key={index} className="p-5 space-y-4">

                        {/* Variant header */}
                        {newProduct.product_type === 'standard_multi' ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                value={variant.variant_type}
                                onChange={e => handleVariantChange(index, 'variant_type', e.target.value)}
                                placeholder="Variant type e.g. 100ml Extrait"
                                className="border-0 border-b-2 border-stone-200 focus:border-stone-900 focus:outline-none text-sm font-bold text-stone-900 py-0.5 bg-transparent w-56 transition"
                                required
                              />
                            </div>
                            {newProduct.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariantRow(index)}
                                className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer px-2 py-1 rounded hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            )}
                          </div>
                        ) : null}

                        {/* ID fields */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'SKU', key: 'sku', placeholder: 'Auto-generated if empty', mono: true },
                            { label: 'EAN Barcode', key: 'ean', placeholder: '62900...', mono: true },
                            { label: 'Stock Qty', key: 'stock_quantity', placeholder: '0', mono: true },
                            { label: 'eBay Category ID', key: 'ebayCategoryId', placeholder: 'e.g. 111586', mono: true },
                          ].map(field => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{field.label}</label>
                              <input
                                type="text"
                                value={variant[field.key] ?? ''}
                                onChange={e => handleVariantChange(index, field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className={`w-full border border-stone-200 bg-stone-50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-900 focus:bg-white text-stone-900 transition ${field.mono ? 'font-mono' : ''}`}
                                required={field.key === 'stock_quantity'}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Pricing — color coded */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                          {/* Net Price */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" />
                              Net Price (€)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">€</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={variant.net_sales_price ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    handleVariantChange(index, { net_sales_price: '', sales_price_with_tax: '' });
                                  } else {
                                    const net = parseFloat(val.replace(',', '.')) || 0;
                                    const gross = calculateGross(net, vatConfig.rate);
                                    handleVariantChange(index, { net_sales_price: val, sales_price_with_tax: gross.toString() });
                                  }
                                }}
                                placeholder="0.00"
                                className="w-full border border-stone-200 bg-stone-50 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-stone-900 focus:bg-white text-stone-900 transition"
                                required
                              />
                            </div>
                          </div>
                          {/* Gross Price */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                              Gross +VAT (€)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-xs font-bold">€</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={variant.sales_price_with_tax ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    handleVariantChange(index, { sales_price_with_tax: '', net_sales_price: '' });
                                  } else {
                                    const gross = parseFloat(val.replace(',', '.')) || 0;
                                    const net = calculateNet(gross, vatConfig.rate);
                                    handleVariantChange(index, { sales_price_with_tax: val, net_sales_price: net.toString() });
                                  }
                                }}
                                placeholder="0.00"
                                className="w-full border border-blue-200 bg-blue-50/40 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400 text-blue-900 transition"
                                required
                              />
                            </div>
                          </div>
                          {/* B2B Price */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                              B2B Price (€)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">€</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={variant.b2b_price ?? ''}
                                onChange={e => handleVariantChange(index, 'b2b_price', e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-emerald-200 bg-emerald-50/40 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-900 transition"
                                required
                              />
                            </div>
                          </div>
                          {/* Retail Compare */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                              Compare Price (€)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-300 text-xs font-bold">€</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={variant.retail_price ?? ""}
                                onChange={e => handleVariantChange(index, "retail_price", e.target.value)}
                                placeholder="0.00"
                                className="w-full border border-amber-200 bg-amber-50/40 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400 text-amber-900 transition"
                              />
                            </div>
                          </div>
                          {/* B2B Min Qty */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                              Min Qty (B2B)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                value={variant.b2bMinQty ?? 1}
                                onChange={e => handleVariantChange(index, "b2bMinQty", e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                                placeholder="1"
                                className="w-full border border-emerald-200 bg-emerald-50/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-900 transition"
                                required
                              />
                            </div>
                          </div>
                          {/* B2B Qty Mode */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-emerald-750 uppercase tracking-widest flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block" />
                              B2B Qty System
                            </label>
                            <select
                              value={variant.b2bQtyMode || "VE"}
                              onChange={e => handleVariantChange(index, "b2bQtyMode", e.target.value)}
                              className="w-full border border-emerald-200 bg-emerald-50/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-900 transition cursor-pointer"
                            >
                              <option value="VE">VE (Multiplier)</option>
                              <option value="MIN_QTY">MIN_QTY (Piece count)</option>
                            </select>
                          </div>
                        </div>

                        {/* VAT hint */}
                        <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-stone-200 text-stone-500 inline-flex items-center justify-center font-bold text-[8px]">i</span>
                          Net ↔ Gross calculated automatically with {vatConfig.rate}% VAT
                        </p>

                        {/* Images Gallery Manager */}
                        <div className="space-y-4 mt-4">
                          <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
                            Product Gallery / معرض صور المنتج
                          </label>
                          
                          {/* Unified Drag-and-Drop Area */}
                          <div 
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                              e.preventDefault();
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleVariantMultipleUpload(index, e.dataTransfer.files);
                              }
                            }}
                            className="border-2 border-dashed border-stone-300 hover:border-stone-900 bg-stone-50/30 hover:bg-stone-50 rounded-2xl p-6 transition text-center cursor-pointer relative group"
                            onClick={() => {
                              const input = document.getElementById(`variant-multiple-file-input-${index}`);
                              if (input) input.click();
                            }}
                          >
                            <input 
                              type="file" 
                              id={`variant-multiple-file-input-${index}`} 
                              multiple 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleVariantMultipleUpload(index, e.target.files);
                                }
                              }}
                            />
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-stone-800">
                                  Drag & drop up to 4 images here or click to browse
                                </p>
                                <p className="text-[10px] text-stone-400 mt-0.5">
                                  Supports multiple files. Main image (first slot) is required.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Thumbnail slots grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                              { label: "Main / الأساسية", key: "image_url", loadingKey: "uploadingImage", slotIdx: 0 },
                              { label: "Hover / صورة التحويم", key: "secondary_image_url", loadingKey: "uploadingSecondaryImage", slotIdx: 1 },
                              { label: "Gallery 3", key: "gallery_image_3_url", loadingKey: "uploadingGalleryImage3", slotIdx: 2 },
                              { label: "Gallery 4", key: "gallery_image_4_url", loadingKey: "uploadingGalleryImage4", slotIdx: 3 }
                            ].map((slot) => {
                              const url = variant[slot.key];
                              const isLoading = variant[slot.loadingKey];

                              return (
                                <div key={slot.slotIdx} className="border border-stone-200 bg-stone-50/20 rounded-xl p-3.5 space-y-3 flex flex-col justify-between relative">
                                  {/* Card Header & Badge */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{slot.label}</span>
                                    {url && (
                                      <button
                                        type="button"
                                        onClick={() => handleVariantChange(index, slot.key, "")}
                                        className="w-5 h-5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                                        title="Delete Image"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Image Preview Area */}
                                  <div className="relative aspect-video rounded-lg border border-stone-200/80 bg-white flex items-center justify-center overflow-hidden shadow-sm group">
                                    {isLoading ? (
                                      <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center space-y-1 z-10">
                                        <div className="w-4 h-4 rounded-full border-2 border-stone-900 border-t-transparent animate-spin"></div>
                                        <span className="text-[9px] font-bold text-stone-600">Uploading...</span>
                                      </div>
                                    ) : null}

                                    {url ? (
                                      <>
                                        <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                        {/* Hover Actions Controls */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition duration-300 z-10">
                                          {slot.slotIdx > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => swapVariantImages(index, slot.slotIdx, slot.slotIdx - 1)}
                                              className="w-7 h-7 rounded-lg bg-white/95 text-stone-800 hover:bg-stone-100 flex items-center justify-center shadow transition cursor-pointer"
                                              title="Move Left"
                                            >
                                              <ChevronLeft className="w-4 h-4" />
                                            </button>
                                          )}
                                          {slot.slotIdx < 3 && (
                                            <button
                                              type="button"
                                              onClick={() => swapVariantImages(index, slot.slotIdx, slot.slotIdx + 1)}
                                              className="w-7 h-7 rounded-lg bg-white/95 text-stone-800 hover:bg-stone-100 flex items-center justify-center shadow transition cursor-pointer"
                                              title="Move Right"
                                            >
                                              <ChevronRight className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-center py-4">
                                        <ImageIcon className="w-6 h-6 text-stone-300 mx-auto mb-1" />
                                        <span className="text-[9px] font-semibold text-stone-400">Empty Slot</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* URL Input */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-stone-400 uppercase">Or Image URL</label>
                                    <input 
                                      type="text"
                                      value={url || ""}
                                      onChange={e => handleVariantChange(index, slot.key, e.target.value)}
                                      placeholder="https://..."
                                      className="w-full border border-stone-200 bg-white rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 text-stone-800 transition"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                          {/* ── Digital Product Settings ── */}
                          <div className="col-span-1 md:col-span-4 border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-4 mt-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5 text-stone-600" />
                                  Digital Item (License Keys / Accounts)
                                </label>
                                <p className="text-[10px] text-stone-500">Toggle to enable auto-sending serial keys and download links upon purchase</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.isDigital || false}
                                  onChange={e => handleVariantChange(index, 'isDigital', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-900"></div>
                              </label>
                            </div>

                            {variant.isDigital && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-200 animate-in fade-in duration-200">
                                <div className="col-span-1 md:col-span-2 flex items-center justify-between bg-stone-100 p-2.5 rounded-lg border border-stone-200">
                                  <div className="space-y-0.5">
                                    <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1">
                                      Multi-Use Key (Re-usable Key)
                                    </label>
                                    <p className="text-[9px] text-stone-500">Sell the same key repeatedly to multiple customers without depleting the keys list. Set stock quantity manually.</p>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={variant.isMultiUse || false}
                                      onChange={e => handleVariantChange(index, 'isMultiUse', e.target.checked)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-900"></div>
                                  </label>
                                </div>

                                {variant.isMultiUse && (
                                  <div className="col-span-1 md:col-span-2 space-y-1.5 border border-amber-200/60 bg-amber-50/20 rounded-xl p-3.5 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                                      Max Uses / Sale Limit (Stock Quantity)
                                    </label>
                                    <input
                                      type="number"
                                      value={variant.stock_quantity || 0}
                                      onChange={e => handleVariantChange(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                                      placeholder="e.g. 100"
                                      className="w-full max-w-xs border border-stone-200 bg-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 text-stone-900 transition placeholder-stone-300 shadow-sm"
                                      min={1}
                                    />
                                    <p className="text-[9px] text-stone-400 mt-1">Define how many times this key can be sold/downloaded before the product displays as out of stock.</p>
                                  </div>
                                )}

                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                                    Available Product Keys (one per line)
                                  </label>
                                  <textarea
                                    value={variant.digitalKeysText || ''}
                                    onChange={e => handleVariantChange(index, 'digitalKeysText', e.target.value)}
                                    placeholder="Enter license keys here...&#10;Key-1234-5678&#10;Key-abcd-efgh"
                                    rows={4}
                                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                                  />
                                  <p className="text-[9px] text-stone-400">
                                    {variant.isMultiUse ? (
                                      <span className="text-stone-600 font-semibold">Multi-use active. Keys will not be depleted. Set stock quantity manually.</span>
                                    ) : (
                                      <>Remaining Stock will be set automatically to the number of keys: <span className="font-bold text-stone-600">{(variant.digitalKeysText || '').split('\n').map((k: string) => k.trim()).filter(Boolean).length}</span></>
                                    )}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                                    Delivery Instructions (Download links, install guides)
                                  </label>
                                  <div className="space-y-2">
                                    <RichTextEditor
                                      value={variant.digitalInstructions_en || ''}
                                      onChange={val => handleVariantChange(index, 'digitalInstructions_en', val)}
                                      placeholder="English instructions (sent by email)"
                                    />
                                    <RichTextEditor
                                      value={variant.digitalInstructions_de || ''}
                                      onChange={val => handleVariantChange(index, 'digitalInstructions_de', val)}
                                      placeholder="Deutsche Anleitung (wird per E-Mail gesendet)"
                                    />
                                    <RichTextEditor
                                      value={variant.digitalInstructions_ar || ''}
                                      onChange={val => handleVariantChange(index, 'digitalInstructions_ar', val)}
                                      placeholder="تعليمات التثبيت والتحميل باللغة العربية (ترسل بالإيميل)"
                                      dir="rtl"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ── Footer actions ── */}
              <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-between sticky bottom-0 z-20">
                <p className="text-xs text-stone-400">
                  <span className="font-bold text-stone-600">{newProduct.variants.length}</span> variant{newProduct.variants.length !== 1 ? 's' : ''} will be published
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-semibold transition cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-7 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-black text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-sm">
                    <Plus className="w-4 h-4" />
                    Publish Product
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Edit Product Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#F4F5F7] rounded-2xl shadow-2xl w-full max-w-5xl my-6 animate-in zoom-in-95 duration-200 overflow-hidden">

            {/* ── Modal Header ── */}
            <div className="flex items-center justify-between px-7 py-5 bg-white border-b border-stone-200 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 leading-tight">Edit Product Specifications</h2>
                  <p className="text-xs text-stone-400 mt-0.5">Update the name, image, tags, prices, and settings of this product record</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct}>
              <div className="p-6 space-y-5">

                {/* ── CARD 1: Basic Info ── */}
                <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md shadow-stone-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md shadow-stone-900/10">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Product Information</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">Define core identifiers, translations, and descriptors</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">

                    {/* Name row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editProduct.name_en}
                          onChange={e => setEditProduct({ ...editProduct, name_en: e.target.value })}
                          placeholder="e.g. Royal Oud Blend"
                          className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition placeholder-stone-300 shadow-sm"
                          required
                        />
                      </div>
                      <div className="space-y-1 relative">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Brand</label>
                        <input
                          type="text"
                          value={editProduct.brand || ''}
                          onChange={e => setEditProduct({ ...editProduct, brand: e.target.value })}
                          onFocus={() => setShowEditBrandSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowEditBrandSuggestions(false), 200)}
                          placeholder="e.g. REEF"
                          className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition placeholder-stone-300 shadow-sm"
                        />
                        {showEditBrandSuggestions && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-stone-100">
                            {existingBrands.filter(b => b.toLowerCase().includes((editProduct.brand || '').toLowerCase())).length > 0 ? (
                              existingBrands
                                .filter(b => b.toLowerCase().includes((editProduct.brand || '').toLowerCase()))
                                .map(brand => (
                                  <button
                                    key={brand}
                                    type="button"
                                    onMouseDown={() => {
                                      setEditProduct((prev: any) => ({ ...prev, brand }));
                                      setShowEditBrandSuggestions(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 font-medium transition cursor-pointer"
                                  >
                                    {brand}
                                  </button>
                                ))
                            ) : (
                              <div className="px-4 py-2.5 text-xs text-stone-400 italic">No existing brands match</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Sales Channel</label>
                        <select
                          value={editProduct.sales_mode || 'BOTH'}
                          onChange={e => setEditProduct({ ...editProduct, sales_mode: e.target.value })}
                          className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition font-medium shadow-sm cursor-pointer"
                        >
                          <option value="BOTH">Retail & Wholesale</option>
                          <option value="RETAIL_ONLY">Retail Only (B2C)</option>
                          <option value="WHOLESALE_ONLY">Wholesale Only (B2B)</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Description</label>
                      <RichTextEditor
                        value={editProduct.description_en}
                        onChange={val => setEditProduct({ ...editProduct, description_en: val })}
                        placeholder="Product details in English..."
                      />
                    </div>

                    {/* Short Description / Notes */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Short Specs / Notes</label>
                      <RichTextEditor
                        value={editProduct.short_description_en}
                        onChange={val => setEditProduct({ ...editProduct, short_description_en: val })}
                        placeholder="Key specs, scent notes, ingredients..."
                      />
                    </div>

                    {/* SEO Tags */}
                    <SeoTagsInput
                      tags={(() => {
                        if (Array.isArray(editProduct.tags)) return editProduct.tags;
                        if (typeof editProduct.tags === 'string' && editProduct.tags)
                          return editProduct.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
                        return [];
                      })()}
                      onChange={(tags) => setEditProduct({ ...editProduct, tags: tags.join(', ') })}
                    />

                    {/* Admin Note (Private) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#d40026] uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d40026] inline-block" />
                        🔒 Admin Note (Private - link, cost, supplier...)
                      </label>
                      <textarea
                        value={editProduct.admin_note || ''}
                        onChange={e => setEditProduct({ ...editProduct, admin_note: e.target.value })}
                        placeholder="e.g. Supplier product link (https://...), wholesale costs, supplier name..."
                        rows={3}
                        className="w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 focus:bg-white text-stone-900 transition placeholder-stone-300 shadow-sm"
                      />
                    </div>

                    {/* Scent Notes (Only for Perfumes) */}
                    <div className="space-y-3 pt-3 border-t border-stone-100">
                      <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Duftpyramide / Scent Notes (Kopf, Herz, Basis)
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider">Kopfnote (Top Notes)</span>
                          <input
                            type="text"
                            value={editProduct.scent_top || ''}
                            onChange={e => setEditProduct({ ...editProduct, scent_top: e.target.value })}
                            placeholder="z.B. Bergamotte, Zitrone, Apfel"
                            className="w-full border border-stone-200 bg-stone-50/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 text-stone-900 transition placeholder-stone-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-rose-800 tracking-wider">Herznote (Heart Notes)</span>
                          <input
                            type="text"
                            value={editProduct.scent_heart || ''}
                            onChange={e => setEditProduct({ ...editProduct, scent_heart: e.target.value })}
                            placeholder="z.B. Jasmin, Rose, Zimt"
                            className="w-full border border-stone-200 bg-stone-50/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 text-stone-900 transition placeholder-stone-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-stone-850 tracking-wider">Basisnote (Base Notes)</span>
                          <input
                            type="text"
                            value={editProduct.scent_base || ''}
                            onChange={e => setEditProduct({ ...editProduct, scent_base: e.target.value })}
                            placeholder="z.B. Oud, Amber, Moschus, Vanille"
                            className="w-full border border-stone-200 bg-stone-50/60 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-950 text-stone-900 transition placeholder-stone-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CARD 2: Categories ── */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">Categories</span>
                    </div>
                    {editProduct.category_ids?.length > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {editProduct.category_ids.length} selected · Primary: {categories.find((c: any) => c.id === editProduct.category_ids[0])?.name?.en || '—'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                      {categories.map((c: any) => {
                        const checked = editProduct.category_ids?.includes(c.id);
                        const isPrimary = editProduct.category_ids?.[0] === c.id;
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition select-none ${checked
                                ? 'bg-stone-900 border-stone-900 text-white'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-white'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={() => {
                                const current: string[] = editProduct.category_ids || [];
                                const next = checked
                                  ? current.filter((id: string) => id !== c.id)
                                  : [...current, c.id];
                                setEditProduct({ ...editProduct, category_ids: next, category_id: next[0] || '' });
                              }}
                              className="hidden"
                            />
                            <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border-2 flex items-center justify-center transition ${checked ? 'border-white bg-white' : 'border-stone-300'}`}>
                              {checked && <div className="w-1.5 h-1.5 rounded-sm bg-stone-900" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${checked ? 'text-white' : 'text-stone-800'}`}>
                                {c.parent ? <span className={`mr-1 ${checked ? 'text-stone-300' : 'text-stone-400'}`}>↳</span> : null}
                                {c.name?.en || 'Unnamed'}
                                {c.name?.ar ? <span className={`ml-1.5 font-normal ${checked ? 'text-stone-300' : 'text-stone-400'}`}>({c.name.ar})</span> : null}
                              </p>
                              {isPrimary && <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">Primary</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── CARD 3: Identifiers & Stock ── */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center gap-2 bg-stone-50">
                    <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">Identifiers & Stock</span>
                  </div>

                  {/* Product Type Selector in Edit */}
                  <div className="p-5 border-b border-stone-100 bg-stone-50/20">
                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block mb-2.5">Product Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { value: 'standard_multi', label: 'Multi-Variant Product', desc: 'Different sizes, volumes, etc. (e.g. 100ml, 50ml)' },
                        { value: 'standard_single', label: 'Standard Single Product', desc: 'Simple product, sold in one size only' },
                        { value: 'sample', label: 'Sample Product', desc: 'Decant / perfume sample with no variant sizes' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setEditProduct((prev: any) => ({
                              ...prev,
                              product_type: opt.value,
                              variant_type: opt.value === 'standard_multi' ? (prev.variant_type || '100ml Eau de Parfum') : (opt.value === 'sample' ? 'Sample' : '')
                            }));
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            editProduct.product_type === opt.value
                              ? 'border-stone-950 bg-stone-950 text-white shadow-md'
                              : 'border-stone-200 hover:border-stone-400 bg-white text-stone-750'
                          }`}
                        >
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className={`text-[10px] mt-1 leading-normal ${editProduct.product_type === opt.value ? 'text-stone-300' : 'text-stone-400'}`}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { label: 'SKU', key: 'sku', placeholder: 'e.g. OUD-100', mono: true, required: true },
                        { label: 'EAN Barcode', key: 'ean', placeholder: '62900...', mono: true, required: false },
                        { label: 'Variant Size/Type', key: 'variant_type', placeholder: 'e.g. 100ml EDP', mono: false, required: true },
                        { label: 'Stock Qty', key: 'stock_quantity', placeholder: '0', mono: true, required: true },
                        { label: 'eBay Category ID', key: 'ebayCategoryId', placeholder: 'e.g. 111586', mono: true, required: false },
                      ].filter(field => {
                        if (field.key === 'variant_type' && editProduct.product_type !== 'standard_multi') return false;
                        return true;
                      }).map(field => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{field.label}</label>
                          <input
                            type="text"
                            value={(editProduct as any)[field.key] ?? ''}
                            onChange={e => setEditProduct({ ...editProduct, [field.key]: e.target.value })}
                            placeholder={field.placeholder}
                            className={`w-full border border-stone-200 bg-stone-50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-900 focus:bg-white text-stone-900 transition ${field.mono ? 'font-mono' : ''}`}
                            required={field.required}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sister Variants & Sync Checkbox */}
                  {editProduct.product_type === 'standard_multi' && (
                    <div className="border-t border-stone-100 p-5 bg-stone-50/20 space-y-4">
                      {(() => {
                        const parentSku = editProduct.attributes?.parent_sku || editProduct.sku;
                        const sisters = products.filter((p: any) => {
                          const pAttr = p.attributes || {};
                          return (p.sku === parentSku || pAttr.parent_sku === parentSku) && p.id !== editProduct.id;
                        });

                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-widest">Other Sizes / Variants</h4>
                              <button
                                type="button"
                                onClick={() => handleAddNewVariant(editProduct)}
                                className="px-3 py-1 bg-stone-900 text-white rounded text-[10px] font-bold uppercase hover:bg-black transition flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Add Variant
                              </button>
                            </div>
                            
                            {sisters.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {sisters.map((v: any) => (
                                  <div
                                    key={v.id}
                                    className="p-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-between transition cursor-pointer group/item"
                                    onClick={() => handleEditClick(v)}
                                    title="Click to switch editing to this size"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="text-xs font-bold text-stone-900 truncate">
                                        {v.attributes?.type || 'Standard'}
                                      </div>
                                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">{v.sku}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="text-right">
                                        <div className="text-xs font-bold text-stone-850 font-mono">€{parseFloat(v.retail_price || 0).toFixed(2)}</div>
                                        <div className="text-[10px] text-stone-500 mt-0.5">Stock: {v.stock_quantity}</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteVariantProduct(v);
                                        }}
                                        className="w-6 h-6 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition border border-rose-200/50 opacity-0 group-hover/item:opacity-100 shadow-xs"
                                        title="Delete this variant product"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-stone-400 italic">No other variants defined yet for this product group.</p>
                            )}

                            {sisters.length > 0 && (
                              <label className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={syncAllVariants}
                                  onChange={e => setSyncAllVariants(e.target.checked)}
                                  className="w-4 h-4 rounded accent-stone-950 mt-0.5 cursor-pointer"
                                />
                                <div className="text-xs">
                                  <span className="font-bold text-amber-900">Sync all sizes</span>
                                  <p className="text-[10px] text-amber-700 mt-0.5 leading-normal">
                                    Apply changes to Name, Category, Brand, Description, Scent Notes, and Tags to all other sizes of this product automatically.
                                  </p>
                                </div>
                              </label>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* ── CARD 4: Pricing ── */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center gap-2 bg-stone-50">
                    <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">4</span>
                    <span className="text-xs font-bold text-stone-700 uppercase tracking-widest">B2B & B2C Pricing</span>
                    <span className="text-[10px] text-stone-400 font-medium">(Dynamic VAT Sync)</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Pricing — color coded */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {/* Net Price */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" />
                          Net Price (€)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">€</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editProduct.net_sales_price ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '') {
                                setEditProduct({ ...editProduct, net_sales_price: '', sales_price_with_tax: '' });
                              } else {
                                const net = parseFloat(val.replace(',', '.')) || 0;
                                const gross = calculateGross(net, vatConfig.rate);
                                setEditProduct({ ...editProduct, net_sales_price: val, sales_price_with_tax: gross.toString() });
                              }
                            }}
                            placeholder="0.00"
                            className="w-full border border-stone-200 bg-stone-50 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-stone-900 focus:bg-white text-stone-900 transition"
                            required
                          />
                        </div>
                      </div>
                      {/* Gross Price */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                          Gross +VAT (€)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-xs font-bold">€</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editProduct.sales_price_with_tax ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '') {
                                setEditProduct({ ...editProduct, sales_price_with_tax: '', net_sales_price: '' });
                              } else {
                                const gross = parseFloat(val.replace(',', '.')) || 0;
                                const net = calculateNet(gross, vatConfig.rate);
                                setEditProduct({ ...editProduct, sales_price_with_tax: val, net_sales_price: net.toString() });
                              }
                            }}
                            placeholder="0.00"
                            className="w-full border border-blue-200 bg-blue-50/40 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-400 text-blue-900 transition"
                            required
                          />
                        </div>
                      </div>
                      {/* B2B Price */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-505 inline-block" />
                          B2B Price (€)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">€</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editProduct.b2b_price ?? ''}
                            onChange={e => setEditProduct({ ...editProduct, b2b_price: e.target.value })}
                            placeholder="0.00"
                            className="w-full border border-emerald-200 bg-emerald-50/40 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-900 transition"
                            required
                          />
                        </div>
                      </div>
                      {/* Retail Compare */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                          Compare Price (€)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-300 text-xs font-bold">€</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editProduct.retail_price ?? ''}
                            onChange={e => setEditProduct({ ...editProduct, retail_price: e.target.value })}
                            placeholder="0.00"
                            className="w-full border border-amber-200 bg-amber-50/40 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400 text-amber-900 transition"
                          />
                        </div>
                      </div>
                      {/* B2B Min Qty */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                          Min Qty (B2B)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={editProduct.b2bMinQty ?? 1}
                            onChange={e => setEditProduct({ ...editProduct, b2bMinQty: e.target.value === '' ? '' : Math.max(1, Number(e.target.value)) })}
                            placeholder="1"
                            className="w-full border border-emerald-200 bg-emerald-50/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-900 transition"
                            required
                          />
                        </div>
                      </div>
                      {/* B2B Qty Mode */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-emerald-750 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block" />
                          B2B Qty System
                        </label>
                        <select
                          value={editProduct.b2b_qty_mode || 'VE'}
                          onChange={e => setEditProduct({ ...editProduct, b2b_qty_mode: e.target.value })}
                          className="w-full border border-emerald-200 bg-emerald-50/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-900 transition cursor-pointer"
                        >
                          <option value="VE">VE (Multiplier)</option>
                          <option value="MIN_QTY">MIN_QTY (Piece count)</option>
                        </select>
                      </div>

                      {/* Custom Shipping Fee Override */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1">
                          🚚 Custom Shipping Fee (€) / تكلفة شحن خاصة
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">€</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editProduct.shipping_cost ?? ''}
                            onChange={e => setEditProduct({ ...editProduct, shipping_cost: e.target.value })}
                            placeholder="0.00 (افتراضي الإعدادات)"
                            className="w-full border border-amber-200 bg-amber-50/40 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500 text-amber-900 transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* VAT hint */}
                    <p className="text-[10px] text-stone-400 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-stone-200 text-stone-500 inline-flex items-center justify-center font-bold text-[8px]">i</span>
                      Net ↔ Gross calculated automatically with {vatConfig.rate}% VAT
                    </p>

                    {/* Discount Section */}
                    <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/40 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Discount Campaign</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Discount % (خصم)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={editProduct.discount_percent ?? ''}
                              onChange={e => {
                                const disc = parseFloat(e.target.value) || 0;
                                const retail = parseFloat(editProduct.retail_price || editProduct.sales_price_with_tax || 0);
                                const salePrice = disc > 0 && retail > 0 ? (retail * (1 - disc / 100)) : 0;
                                setEditProduct({
                                  ...editProduct,
                                  discount_percent: e.target.value,
                                  ...(salePrice > 0 ? { sales_price_with_tax: salePrice.toFixed(2), net_sales_price: (salePrice / (1 + (vatConfig?.rate || 19) / 100)).toFixed(2) } : {})
                                });
                              }}
                              className="w-full border border-rose-200 bg-white rounded-lg pl-3 pr-7 py-2 text-xs font-mono focus:outline-none focus:border-rose-500 text-stone-900 transition"
                              placeholder="0"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-400 text-xs font-bold">%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Original Price (€)</label>
                          <div className="border border-stone-200 rounded-lg px-3 py-2 text-xs bg-stone-50 text-stone-500 font-mono line-through">
                            €{parseFloat(editProduct.retail_price || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-violet-600 uppercase tracking-widest">Sale Price After Discount (€)</label>
                          <div className={`border rounded-lg px-3 py-2 text-xs font-bold font-mono ${parseFloat(editProduct.discount_percent || 0) > 0 ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-stone-200 bg-stone-50 text-stone-400'}`}>
                            {parseFloat(editProduct.discount_percent || 0) > 0 && parseFloat(editProduct.retail_price || 0) > 0
                              ? `€${(parseFloat(editProduct.retail_price) * (1 - parseFloat(editProduct.discount_percent) / 100)).toFixed(2)}`
                              : `€${parseFloat(editProduct.sales_price_with_tax || 0).toFixed(2)}`
                            }
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-rose-400 flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full bg-rose-200 text-rose-500 inline-flex items-center justify-center font-bold text-[8px]">!</span>
                        تحديد الخصم سيحدّث سعر البيع (Gross Price) تلقائياً
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── CARD 5: Images ── */}
                <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md shadow-stone-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md shadow-stone-900/10">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Product Gallery</h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">Upload or link high-resolution images for the product page</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-6">
                    {/* Unified Drag-and-Drop Area */}
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleEditProductMultipleUpload(e.dataTransfer.files);
                        }
                      }}
                      className="border-2 border-dashed border-stone-300 hover:border-stone-950 bg-stone-50/50 hover:bg-stone-50 rounded-2xl p-6 transition text-center cursor-pointer relative group"
                      onClick={() => {
                        const input = document.getElementById("edit-product-multiple-file-input");
                        if (input) input.click();
                      }}
                    >
                      <input 
                        type="file" 
                        id="edit-product-multiple-file-input" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleEditProductMultipleUpload(e.target.files);
                          }
                        }}
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-800">
                            Drag & drop up to 4 images here or click to browse
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Supports multiple files. Main image (first slot) is required.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail slots grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Main / الأساسية", key: "image_url", loadingKey: "uploadingImage", index: 0 },
                        { label: "Hover / صورة التحويم", key: "secondary_image_url", loadingKey: "uploadingSecondaryImage", index: 1 },
                        { label: "Gallery 3", key: "gallery_image_3_url", loadingKey: "uploadingGalleryImage3", index: 2 },
                        { label: "Gallery 4", key: "gallery_image_4_url", loadingKey: "uploadingGalleryImage4", index: 3 }
                      ].map((slot) => {
                        const url = editProduct[slot.key];
                        const isLoading = editProduct[slot.loadingKey];

                        return (
                          <div key={slot.index} className="border border-stone-200 bg-stone-50/20 rounded-xl p-3.5 space-y-3 flex flex-col justify-between relative">
                            {/* Card Header & Badge */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{slot.label}</span>
                              {url && (
                                <button
                                  type="button"
                                  onClick={() => setEditProduct({ ...editProduct, [slot.key]: "" })}
                                  className="w-5 h-5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                                  title="Delete Image"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Image Preview Area */}
                            <div className="relative aspect-video rounded-lg border border-stone-200/80 bg-white flex items-center justify-center overflow-hidden shadow-sm group">
                              {isLoading ? (
                                <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center space-y-1 z-10">
                                  <div className="w-4 h-4 rounded-full border-2 border-stone-900 border-t-transparent animate-spin"></div>
                                  <span className="text-[9px] font-bold text-stone-600">Uploading...</span>
                                </div>
                              ) : null}

                              {url ? (
                                <>
                                  <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                                  {/* Hover Actions Controls */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition duration-300 z-10">
                                    {slot.index > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => swapEditProductImages(slot.index, slot.index - 1)}
                                        className="w-7 h-7 rounded-lg bg-white/95 text-stone-800 hover:bg-stone-100 flex items-center justify-center shadow transition cursor-pointer"
                                        title="Move Left"
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                      </button>
                                    )}
                                    {slot.index < 3 && (
                                      <button
                                        type="button"
                                        onClick={() => swapEditProductImages(slot.index, slot.index + 1)}
                                        className="w-7 h-7 rounded-lg bg-white/95 text-stone-800 hover:bg-stone-100 flex items-center justify-center shadow transition cursor-pointer"
                                        title="Move Right"
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-4">
                                  <ImageIcon className="w-6 h-6 text-stone-300 mx-auto mb-1" />
                                  <span className="text-[9px] font-semibold text-stone-400">Empty Slot</span>
                                </div>
                              )}
                            </div>

                            {/* URL Input */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase">Or Image URL</label>
                              <input 
                                type="text"
                                value={url || ""}
                                onChange={e => setEditProduct({ ...editProduct, [slot.key]: e.target.value })}
                                placeholder="https://..."
                                className="w-full border border-stone-200 bg-white rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 text-stone-800 transition"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── CARD 6: Digital Product Settings ── */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mt-4">
                  <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">6</span>
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        Digital Product Settings
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editProduct.isDigital || false}
                        onChange={e => setEditProduct({ ...editProduct, isDigital: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-900"></div>
                    </label>
                  </div>
                  <div className="p-5">
                    {editProduct.isDigital ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                        <div className="col-span-1 md:col-span-2 flex items-center justify-between bg-stone-100 p-2.5 rounded-lg border border-stone-200">
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest flex items-center gap-1">
                              Multi-Use Key (Re-usable Key)
                            </label>
                            <p className="text-[9px] text-stone-500">Sell the same key repeatedly to multiple customers without depleting the keys list. Set stock quantity manually.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editProduct.isMultiUse || false}
                              onChange={e => setEditProduct({ ...editProduct, isMultiUse: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-900"></div>
                          </label>
                        </div>

                        {editProduct.isMultiUse && (
                          <div className="col-span-1 md:col-span-2 space-y-1.5 border border-amber-200/60 bg-amber-50/20 rounded-xl p-3.5 animate-in slide-in-from-top-2 duration-200">
                            <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                              Max Uses / Sale Limit (Stock Quantity)
                            </label>
                            <input
                              type="number"
                              value={editProduct.stock_quantity || 0}
                              onChange={e => setEditProduct({ ...editProduct, stock_quantity: parseInt(e.target.value) || 0 })}
                              placeholder="e.g. 100"
                              className="w-full max-w-xs border border-stone-200 bg-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-950 text-stone-900 transition placeholder-stone-300 shadow-sm"
                              min={1}
                            />
                            <p className="text-[9px] text-stone-400 mt-1">Define how many times this key can be sold/downloaded before the product displays as out of stock.</p>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                            Available Product Keys (one per line)
                          </label>
                          <textarea
                            value={editProduct.digitalKeysText || ''}
                            onChange={e => setEditProduct({ ...editProduct, digitalKeysText: e.target.value })}
                            placeholder="Enter license keys here...&#10;Key-1234-5678&#10;Key-abcd-efgh"
                            rows={6}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                          <p className="text-[9px] text-stone-400">
                            {editProduct.isMultiUse ? (
                              <span className="text-stone-600 font-semibold">Multi-use active. Keys will not be depleted. Set stock quantity manually.</span>
                            ) : (
                              <>Remaining Stock will be set automatically to the number of keys: <span className="font-bold text-stone-600">{(editProduct.digitalKeysText || '').split('\n').map((k: string) => k.trim()).filter(Boolean).length}</span></>
                            )}
                          </p>
                        </div>

                        {/* Sold Keys History Table */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
                              Sold Keys � Used Licenses
                            </label>
                            {soldKeysData.length > 0 && (
                              <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                                {soldKeysData.length} sold
                              </span>
                            )}
                          </div>

                          {soldKeysLoading ? (
                            <div className="text-[10px] text-stone-400 italic py-3 text-center">Loading sold keys...</div>
                          ) : soldKeysData.length === 0 ? (
                            <div className="text-[10px] text-stone-400 italic py-3 text-center border border-dashed border-stone-200 rounded-lg">
                              No keys sold yet for this product.
                            </div>
                          ) : (
                            <div className="border border-stone-200 rounded-lg overflow-hidden">
                              <div className="max-h-52 overflow-y-auto">
                                <table className="w-full text-left text-[10px] border-collapse">
                                  <thead>
                                    <tr className="bg-stone-50 text-stone-400 font-bold border-b border-stone-100 sticky top-0">
                                      <th className="px-3 py-2">License Key</th>
                                      <th className="px-3 py-2">Customer</th>
                                      <th className="px-3 py-2">Email</th>
                                      <th className="px-3 py-2 whitespace-nowrap">Order</th>
                                      <th className="px-3 py-2 whitespace-nowrap">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-100">
                                    {soldKeysData.map((row: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-rose-50/30">
                                        <td className="px-3 py-2 font-mono text-rose-700 font-bold text-[9px] max-w-[130px] truncate" title={row.key}>
                                          {row.key}
                                        </td>
                                        <td className="px-3 py-2 text-stone-700 font-medium max-w-[100px] truncate" title={row.customerName}>
                                          {row.customerName}
                                        </td>
                                        <td className="px-3 py-2 text-stone-500 max-w-[140px] truncate" title={row.customerEmail}>
                                          {row.customerEmail}
                                        </td>
                                        <td className="px-3 py-2 text-stone-400 font-mono text-[9px]">
                                          {row.orderShortId}
                                        </td>
                                        <td className="px-3 py-2 text-stone-400 whitespace-nowrap">
                                          {row.soldAt ? new Date(row.soldAt).toLocaleDateString('de-DE') : '�'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                            Delivery Instructions (Download links, install guides)
                          </label>
                          <div className="space-y-2">
                            <RichTextEditor
                              value={editProduct.digitalInstructions_en || ''}
                              onChange={val => setEditProduct({ ...editProduct, digitalInstructions_en: val })}
                              placeholder="English instructions (sent by email)"
                            />
                            <RichTextEditor
                              value={editProduct.digitalInstructions_de || ''}
                              onChange={val => setEditProduct({ ...editProduct, digitalInstructions_de: val })}
                              placeholder="Deutsche Anleitung (wird per E-Mail gesendet)"
                            />
                            <RichTextEditor
                              value={editProduct.digitalInstructions_ar || ''}
                              onChange={val => setEditProduct({ ...editProduct, digitalInstructions_ar: val })}
                              placeholder="تعليمات التثبيت والتحميل باللغة العربية (ترسل بالإيميل)"
                              dir="rtl"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 italic text-center py-2">Enable the digital toggle above if this is a software key or virtual item.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* ── Footer actions ── */}
              <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-end sticky bottom-0 z-20 gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-semibold transition cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="px-7 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-black text-sm font-bold transition cursor-pointer flex items-center gap-2 shadow-sm">
                  <Check className="w-4 h-4" />
                  Save Product Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal Overlay */}
      {isEditCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-stone-900">

            {/* Header */}
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-900 text-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-serif font-bold tracking-wide">Edit Category</h2>
                <p className="text-xs text-stone-300 font-medium">Modify this category's translation names, parent relationships, description, and preview image.</p>
              </div>
              <button onClick={() => setIsEditCategoryModalOpen(false)} className="text-stone-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="p-6 space-y-6">

              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
                  Category Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Category Name (English)</label>
                    <input
                      type="text"
                      value={editCategory.name_en}
                      onChange={e => setEditCategory({ ...editCategory, name_en: e.target.value })}
                      placeholder="e.g. Perfumes"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Category Name (Arabic)</label>
                    <input
                      type="text"
                      value={editCategory.name_ar}
                      onChange={e => setEditCategory({ ...editCategory, name_ar: e.target.value })}
                      placeholder="مثال: العطور"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Unique Slug</label>
                    <input
                      type="text"
                      value={editCategory.slug}
                      onChange={e => setEditCategory({ ...editCategory, slug: e.target.value })}
                      placeholder="e.g. perfumes"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Parent Category (For Subcategories)</label>
                    <select
                      value={editCategory.parent_id || ''}
                      onChange={e => setEditCategory({ ...editCategory, parent_id: e.target.value })}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 bg-white text-stone-900"
                    >
                      <option value="">None (Top-Level Parent Category)</option>
                      {categories.filter(c => !c.parent_id && c.id !== editCategory.id).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name?.en || 'Unnamed Category'} {c.name?.ar ? `(${c.name.ar})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea
                    value={editCategory.description}
                    onChange={e => setEditCategory({ ...editCategory, description: e.target.value })}
                    placeholder="Describe details of the category..."
                    rows={3}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                  />
                </div>
              </div>

              {/* Image Manager for Category */}
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
                  Image Configuration
                </h3>

                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-16 h-16 bg-white rounded-md border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {editCategory.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveImageUrl(editCategory.image_url)} alt="Category" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-stone-300" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Image Source</label>
                    <div className="flex gap-1 bg-stone-200 p-0.5 rounded-lg w-fit">
                      <button
                        type="button"
                        onClick={() => setEditCategory({ ...editCategory, image_mode: 'upload' })}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${editCategory.image_mode === 'upload' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                      >
                        Upload Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCategory({ ...editCategory, image_mode: 'url' })}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${editCategory.image_mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                      >
                        Direct URL
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    {editCategory.image_mode === 'upload' ? (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleEditCategoryImageUpload(e.target.files[0]);
                            }
                          }}
                          disabled={editCategory.uploadingImage}
                          className="w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                        />
                        {editCategory.uploadingImage && (
                          <span className="absolute right-3 top-2 text-[10px] font-semibold text-emerald-600 animate-pulse">Uploading image...</span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editCategory.image_url}
                        onChange={e => setEditCategory({ ...editCategory, image_url: e.target.value })}
                        placeholder="Paste category image URL link here"
                        className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-4 bg-stone-50 -mx-6 -mb-6 p-6 sticky bottom-0 rounded-b-xl border-t border-stone-200 z-10">
                <button
                  type="button"
                  onClick={() => setIsEditCategoryModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-black text-sm font-semibold transition uppercase tracking-widest text-xs shadow-md"
                >
                  Save Category Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ship Courier & Digital Key / Tracking Info Dialog */}
      {isShipPromptOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-serif font-bold tracking-tight flex items-center gap-2">
                  {shipFulfillmentMode === 'digital' ? (
                    <><span>🔑</span> Digital Key Delivery / تفاصيل المفتاح الرقمي</>
                  ) : (
                    <><span>📦</span> Order Shipment Details / تفاصيل الشحن</>
                  )}
                </h3>
                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">
                  {shipFulfillmentMode === 'digital'
                    ? 'Fill in the digital key / license code to send to customer'
                    : 'Fill in the tracking and carrier information'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsShipPromptOpen(false);
                  setShipOrderId(null);
                }}
                className="text-stone-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="bg-stone-100 p-1.5 flex gap-1 border-b border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setShipFulfillmentMode('digital');
                  if (courierName.includes('GLS')) {
                    setCourierName('Digital Key Delivery');
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  shipFulfillmentMode === 'digital'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>🔑</span> Digital Key (مفتاح رقمي)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShipFulfillmentMode('physical');
                  if (courierName.includes('Digital Key')) {
                    setCourierName('GLS Premium Express');
                  }
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  shipFulfillmentMode === 'physical'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>📦</span> Physical Parcel (شحن طرد)
              </button>
            </div>

            <form onSubmit={handleSaveShipDetails} className="p-6 space-y-4">
              {shipFulfillmentMode === 'digital' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Delivery Method / Type (طريقة التسليم)
                    </label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. Digital Key Email Delivery, ESD License"
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition text-sm font-medium text-stone-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        Digital License Key / Product Activation Code (مفتاح المنتج الرقمي)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const uiOrder = orders.find(o => o.id === shipOrderId);
                          if (!uiOrder) return;
                          for (const item of uiOrder.items || []) {
                            const dbProd = products.find(p => p.id === item.product_id);
                            if (!dbProd?.attributes) continue;
                            const attrs = dbProd.attributes;
                            const allStockKeys: string[] = Array.isArray(attrs.digitalKeys)
                              ? attrs.digitalKeys
                              : (typeof attrs.digitalKeys === 'string' ? attrs.digitalKeys.split('\n').map((k: string) => k.trim()).filter(Boolean) : []);

                            if (allStockKeys.length > 0) {
                              const soldMap = attrs.soldKeys || {};
                              const allSoldKeysSet = new Set<string>();
                              Object.values(soldMap).forEach((kList: any) => {
                                if (Array.isArray(kList)) {
                                  kList.forEach((k: string) => allSoldKeysSet.add(k.trim()));
                                }
                              });

                              const unsoldKeys = allStockKeys.filter(k => !allSoldKeysSet.has(k.trim()));
                              const qtyNeeded = item.quantity || 1;
                              const keysToAssign = unsoldKeys.slice(0, qtyNeeded);

                              if (keysToAssign.length > 0) {
                                const fetched = keysToAssign.join('\n');
                                setDigitalKeyValue(fetched);
                                setTrackingNumberInput(fetched);
                                alert(`✨ تم استخراج ${keysToAssign.length} مفتاح غير مباع من مخزون المنتج بنجاح!`);
                                return;
                              }
                            }
                          }
                          alert("لم يتم العثور على مفاتيح غير مباعة جديدة في مخزون المنتج. يمكنك إضافة مفتاح جديد هنا.");
                        }}
                        className="text-[9px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <span>⚡ جلب مفتاح متوفر من مخزون المنتج</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={digitalKeyValue}
                      onChange={(e) => {
                        setDigitalKeyValue(e.target.value);
                        setTrackingNumberInput(e.target.value);
                      }}
                      placeholder="أدخل أو انقش مفتاح التفعيل هنا (مثلاً: W269N-WFGWX-YVC9B-4J6C9-T83GX)"
                      className="w-full px-4 py-2.5 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition text-sm font-mono font-bold text-amber-900 bg-amber-50/50 resize-none shadow-inner"
                      required
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      إذا قمت بإضافة مفاتيح جديدة إلى المنتج بعد الشراء، سيتم جلب المفتاح المتاح تلقائياً أو بالنقر على الزر أعلاه.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Installations- & Aktivierungsanleitung (Deutsch)
                    </label>

                    {/* Rich Formatting Toolbar matching screenshot */}
                    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-600 transition">
                      <div className="flex items-center gap-0.5 bg-stone-100/90 border-b border-stone-200 p-1.5 text-stone-700 select-none">
                        <button
                          type="button"
                          title="Bold / Fett (B)"
                          onClick={() => applyTextareaFormatting('bold')}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white font-bold text-xs transition text-stone-800 border border-transparent hover:border-stone-200 shadow-sm hover:shadow"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          title="Italic / Kursiv (I)"
                          onClick={() => applyTextareaFormatting('italic')}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white italic text-xs font-serif transition text-stone-800 border border-transparent hover:border-stone-200 shadow-sm hover:shadow"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          title="Underline / Unterstrichen (U)"
                          onClick={() => applyTextareaFormatting('underline')}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white underline text-xs transition text-stone-800 border border-transparent hover:border-stone-200 shadow-sm hover:shadow"
                        >
                          U
                        </button>

                        <div className="w-px h-4 bg-stone-300 mx-1" />

                        <button
                          type="button"
                          title="Bullet List / Aufzählung (•≡)"
                          onClick={() => applyTextareaFormatting('bullet')}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-xs transition text-stone-800 border border-transparent hover:border-stone-200 shadow-sm hover:shadow font-mono"
                        >
                          •≡
                        </button>
                        <button
                          type="button"
                          title="Numbered List / Nummerierung (1.≡)"
                          onClick={() => applyTextareaFormatting('number')}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-[10px] transition text-stone-800 border border-transparent hover:border-stone-200 shadow-sm hover:shadow font-mono font-bold"
                        >
                          1.≡
                        </button>

                        <div className="w-px h-4 bg-stone-300 mx-1" />

                        <button
                          type="button"
                          title="Link einfügen (🔗)"
                          onClick={() => applyTextareaFormatting('link')}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-xs transition text-emerald-700 font-bold border border-transparent hover:border-stone-200 shadow-sm hover:shadow"
                        >
                          🔗
                        </button>

                        <button
                          type="button"
                          title="Formatierung entfernen / Clear Formatting (Tₓ)"
                          onClick={() => applyTextareaFormatting('clear')}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-[10px] transition text-stone-500 font-mono border border-transparent hover:border-stone-200 shadow-sm hover:shadow"
                        >
                          Tₓ
                        </button>
                      </div>

                      <textarea
                        ref={modalTextareaRef}
                        rows={5}
                        value={digitalInstructionsInput}
                        onChange={(e) => setDigitalInstructionsInput(e.target.value)}
                        placeholder="Geben Sie die Anleitung auf Deutsch ein... (z.B. 1. Link öffnen: https://setup.office.com)"
                        className="w-full px-3 py-2.5 outline-none text-xs font-sans font-medium text-stone-800 bg-stone-50/30 resize-y leading-relaxed"
                      />
                    </div>
                    
                    {/* Live Preview Box with auto URL linking */}
                    {digitalInstructionsInput && (
                      <div className="mt-2.5 bg-amber-50/60 border border-amber-200/80 p-3 rounded-lg text-xs text-stone-700 space-y-1">
                        <div className="text-[9px] font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">👁️ Email Vorschau (Vorschau für den Kunden):</span>
                          <span className="text-[8px] bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">Nur auf Deutsch</span>
                        </div>
                        <div
                          className="text-xs leading-relaxed text-stone-800 break-words"
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              if (digitalInstructionsInput.includes('<') && digitalInstructionsInput.includes('>')) {
                                return digitalInstructionsInput;
                              }
                              const urlRegex = /(https?:\/\/[^\s<]+)/g;
                              const withLinks = digitalInstructionsInput.replace(urlRegex, (url: string) => 
                                `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline; word-break: break-all;">${url}</a>`
                              );
                              return withLinks.replace(/\n/g, '<br/>');
                            })()
                          }}
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-stone-400 mt-1">
                      محرر غني بالتنسيقات: حدد أي نص واضغط B أو I أو U أو إضافة رابط أو قائمة نقطية لتطبيق التنسيق فوراً.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Courier / Carrier Name (شركة الشحن)
                    </label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      placeholder="e.g. GLS, DHL, FedEx, UPS"
                      className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition text-sm font-medium text-stone-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                      Tracking Link / Number (رقم التتبع)
                    </label>
                    <input
                      type="text"
                      value={trackingNumberInput}
                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                      placeholder="e.g. Tracking number or URL link"
                      className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition text-sm font-medium text-stone-900 bg-white"
                      required
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      If using GLS, a trackable URL link or active shipping code is recommended.
                    </p>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsShipPromptOpen(false);
                    setShipOrderId(null);
                  }}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-8 py-2.5 rounded-lg text-white text-xs font-bold transition shadow-md ${
                    shipFulfillmentMode === 'digital'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {shipFulfillmentMode === 'digital'
                    ? 'Confirm & Deliver Digital Key'
                    : 'Confirm Shipment & Send Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-serif font-bold tracking-tight">Delete Product</h3>
                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">Confirm permanent action</p>
              </div>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-stone-600 text-sm mb-6">
                Are you sure you want to delete the product <span className="font-bold text-stone-900">"{productToDelete.translations?.en || productToDelete.sku}"</span>? This action is permanent and cannot be undone.
              </p>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = productToDelete.id;
                    setProductToDelete(null);
                    try {
                      const token = localStorage.getItem('token');
                      const headers = { Authorization: `Bearer ${token}` };
                      const response = await axios.delete(`${API_URL}/products/${id}`, { headers });
                      fetchProducts();
                      alert(response.data?.message || "Product deleted successfully!");
                    } catch (error: any) {
                      console.error("Delete product error:", error);
                      const errMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to delete product.";
                      alert(errMsg);
                    }
                  }}
                  className="px-8 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-serif font-bold tracking-tight">Delete Category</h3>
                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">Confirm permanent action</p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-stone-600 text-sm mb-6">
                Are you sure you want to delete the category <span className="font-bold text-stone-900">"{categoryToDelete.name?.en || categoryToDelete.slug}"</span>? This action is permanent. Products in this category will remain, but their association with this category will be removed.
              </p>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = categoryToDelete.id;
                    setCategoryToDelete(null);
                    await handleDeleteCategory(id);
                  }}
                  className="px-8 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Delete Confirmation Modal */}
      {couponToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-serif font-bold tracking-tight">Delete Coupon</h3>
                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">Confirm permanent action</p>
              </div>
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-stone-600 text-sm mb-6">
                Are you sure you want to delete the coupon code <span className="font-bold text-stone-900">"{couponToDelete.code}"</span>? This action is permanent and cannot be undone. Customers will no longer be able to apply this coupon code.
              </p>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCouponToDelete(null)}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = couponToDelete.id;
                    setCouponToDelete(null);
                    await handleDeleteCoupon(id);
                  }}
                  className="px-8 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md"
                >
                  Delete Coupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-serif font-bold tracking-tight">Delete User Account</h3>
                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider">Confirm permanent action</p>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-stone-600 text-sm mb-6">
                Are you sure you want to delete the user account for <span className="font-bold text-stone-900">"{userToDelete.name || userToDelete.email}"</span>? This action is permanent, cannot be undone, and will completely remove their credentials and order history from the login directory.
              </p>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = userToDelete.id;
                    setUserToDelete(null);
                    await executeDeleteUser(id);
                  }}
                  className="px-8 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
