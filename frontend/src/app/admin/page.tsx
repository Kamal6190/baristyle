"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Save, X, Plus, LayoutDashboard, Package, ShoppingCart, FileText, Users, Settings, LogOut, ArrowUpRight, Search, Download, Tags, Trash2, Image as ImageIcon, Percent, Truck, Globe, Eye } from 'lucide-react';
import Link from 'next/link';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

export default function AdminDashboard() {
  const parseWooCommerceNumber = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const clean = String(val).replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [authorized, setAuthorized] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Settings configurations
  const [vatConfig, setVatConfig] = useState<any>({ rate: 19, type: 'inclusive' });
  const [b2bConfig, setB2bConfig] = useState<any>({ minimum_order_amount: 2500 });
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [activeSlideTab, setActiveSlideTab] = useState(0);

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
  const [orders, setOrders] = useState<any[]>([
    {
      id: '#ORD-5621',
      customer: 'Luxe Retailers GmbH',
      email: 'orders@luxeretailers.de',
      address: 'Kurfürstendamm 21, 10719 Berlin, Germany',
      date: 'Oct 24, 2025',
      total: '€4,250.00',
      status: 'Processing',
      type: 'B2B',
      vatNumber: 'DE312456789',
      items: [
        { name: 'OSMA Royal Oud - 100ml Eau de Parfum', sku: 'OSMA-ROY-OUD-100', quantity: 50, price: 55.00, total: 2750.00 },
        { name: 'REEF Midnight Musk - 100ml Eau de Parfum', sku: 'REEF-MID-MSK-100', quantity: 30, price: 50.00, total: 1500.00 }
      ],
      subtotal: '€4,250.00',
      shipping: '€0.00',
      tax: '€678.57'
    },
    {
      id: '#ORD-5622',
      customer: 'Emma Watson',
      email: 'emma.watson@gmail.com',
      address: 'Baker Street 221B, London, UK',
      date: 'Oct 24, 2025',
      total: '€345.00',
      status: 'Shipped',
      type: 'Retail',
      items: [
        { name: 'AOUI Rose Seduction - 100ml', sku: 'AOUI-RSE-SED-100', quantity: 1, price: 345.00, total: 345.00 }
      ],
      subtotal: '€345.00',
      shipping: '€0.00',
      tax: '€55.08'
    },
    {
      id: '#ORD-5623',
      customer: 'Scent Boutique Paris',
      email: 'contact@scentboutiqueparis.fr',
      address: 'Champs-Élysées 75, 75008 Paris, France',
      date: 'Oct 23, 2025',
      total: '€12,400.00',
      status: 'Delivered',
      type: 'B2B',
      vatNumber: 'FR987654321',
      items: [
        { name: 'OSMA Imperial Sandal - 100ml', sku: 'OSMA-IMP-SND-100', quantity: 100, price: 65.00, total: 6500.00 },
        { name: 'REEF Desert Rose - 100ml', sku: 'REEF-DST-RSE-100', quantity: 100, price: 59.00, total: 5900.00 }
      ],
      subtotal: '€12,400.00',
      shipping: '€0.00',
      tax: '€1,979.83'
    },
    {
      id: '#ORD-5624',
      customer: 'Michael Chen',
      email: 'm.chen@yahoo.com',
      address: 'Schützenstraße 12, 52062 Aachen, Germany',
      date: 'Oct 23, 2025',
      total: '€690.00',
      status: 'Pending',
      type: 'Retail',
      items: [
        { name: 'OSMA Royal Oud - 100ml', sku: 'OSMA-ROY-OUD-100', quantity: 2, price: 120.00, total: 240.00 },
        { name: 'REEF Midnight Musk - 100ml', sku: 'REEF-MID-MSK-100', quantity: 3, price: 150.00, total: 450.00 }
      ],
      subtotal: '€690.00',
      shipping: '€0.00',
      tax: '€110.17'
    }
  ]);

  // New shipping form state
  const [newShipping, setNewShipping] = useState<any>({
    name: '',
    days: '',
    cost: 0,
    countries: []
  });

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
        setB2bConfig({ minimum_order_amount: 2500 });
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
        setHomepageFeatured(DEFAULT_HOMEPAGE_FEATURED);
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
        countries: newShipping.countries.length > 0 ? newShipping.countries : ['All Europe']
      }
    ];
    setShippingMethods(updated);
    setNewShipping({ name: '', days: '', cost: 0, countries: [] });
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
        image_mode: 'url', // 'url' or 'upload'
        uploadingImage: false,
        secondary_image_url: '',
        secondary_image_mode: 'url',
        uploadingSecondaryImage: false
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

  // Edit Product Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>({
    id: '',
    sku: '',
    ean: '',
    name_en: '',
    name_ar: '',
    brand: '',
    attributes: {},
    description_en: '',
    description_ar: '',
    short_description_en: '',
    short_description_ar: '',
    tags: '',
    category_id: '',
    category_ids: [] as string[],
    variant_type: '',
    stock_quantity: 0,
    net_sales_price: 0,
    sales_price_with_tax: 0,
    b2b_price: 0,
    retail_price: 0,
    image_url: '',
    image_mode: 'url',
    uploadingImage: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/all`);
      setProducts(response.data);
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
      
      // All variants created in this batch share the SKU of the first variant as their parent_sku
      const firstVariantSku = newProduct.variants[0]?.sku || `${newProduct.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${newProduct.variants[0]?.variant_type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-0`;

      // We publish all variants in a parallel or sequential chain
      for (let i = 0; i < newProduct.variants.length; i++) {
        const variant = newProduct.variants[i];
        
        // Generate fallback SKU if empty
        const fallbackSku = `${newProduct.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${variant.variant_type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
        const payload = {
          sku: variant.sku || fallbackSku,
          ean: variant.ean || undefined,
          image_url: variant.image_url || undefined,
          stock_quantity: Math.round(parseWooCommerceNumber(variant.stock_quantity)),
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
          attributes: {
            type: variant.variant_type,
            additional_images: variant.secondary_image_url ? [variant.secondary_image_url] : [],
            parent_sku: firstVariantSku,
            brand: newProduct.brand || undefined
          },
          category_id: newProduct.category_ids?.[0] || newProduct.category_id,
          category_ids: newProduct.category_ids
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
        description_ar: '',
        short_description_en: '',
        short_description_ar: '',
        tags: '',
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
            uploadingSecondaryImage: false
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
          uploadingSecondaryImage: false
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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/products/${id}`, { headers });
      fetchProducts();
      alert("Product deleted successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete product.");
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
    if (!confirm("Are you sure you want to delete this category?")) return;
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
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token || !user || user.role !== 'SUPER_ADMIN') {
      window.location.href = '/';
      return;
    }
    
    setAuthorized(true);
    fetchProducts();
    fetchCategories();
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
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

  const handleEditClick = (product: any) => {
    // Seed category_ids from the many-to-many categories list, falling back to primary category
    const existingCatIds: string[] = Array.isArray(product.categories) && product.categories.length > 0
      ? product.categories.map((c: any) => c.id)
      : (product.category?.id ? [product.category.id] : []);

    setEditProduct({
      id: product.id,
      sku: product.sku || '',
      ean: product.ean || '',
      name_en: product.translations?.en || '',
      name_ar: product.translations?.ar || '',
      description_en: product.description?.en || '',
      description_ar: product.description?.ar || '',
      short_description_en: product.short_description?.en || '',
      short_description_ar: product.short_description?.ar || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      category_id: existingCatIds[0] || product.category?.id || product.category_id || '',
      category_ids: existingCatIds,
      brand: product.attributes?.brand || '',
      attributes: product.attributes || {},
      variant_type: product.attributes?.type || '',
      stock_quantity: product.stock_quantity || 0,
      net_sales_price: product.net_sales_price || 0,
      sales_price_with_tax: product.sales_price_with_tax || 0,
      b2b_price: product.b2b_price || 0,
      retail_price: product.retail_price || 0,
      image_url: product.image_url || '',
      image_mode: 'url',
      uploadingImage: false,
      secondary_image_url: product.attributes?.additional_images?.[0] || '',
      secondary_image_mode: 'url',
      uploadingSecondaryImage: false
    });
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
        stock_quantity: Math.round(parseWooCommerceNumber(editProduct.stock_quantity)),
        attributes: {
          ...(editProduct.attributes || {}),
          type: editProduct.variant_type,
          additional_images: editProduct.secondary_image_url ? [editProduct.secondary_image_url] : [],
          brand: editProduct.brand || undefined
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

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
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
  };

  const filteredOrders = orders.filter((order: any) => {
    let matchesSearch = true;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const id = order.id.toLowerCase();
      const customer = order.customer.toLowerCase();
      const status = order.status.toLowerCase();
      const type = order.type.toLowerCase();
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

  if (!authorized) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-[#111625] text-stone-300 flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-white text-xl font-serif font-bold tracking-wide">BariStyle<span className="text-emerald-500">.ERP</span></h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard Overview' },
            { id: 'products', icon: Package, label: 'Product Inventory' },
            { id: 'categories', icon: Tags, label: 'Categories Settings' },
            { id: 'orders', icon: ShoppingCart, label: 'Orders & Fulfillment' },
            { id: 'invoices', icon: FileText, label: 'Invoices & Billing' },
            { id: 'customers', icon: Users, label: 'B2B Partners' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === item.id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' : 'hover:bg-white/5 hover:text-white text-stone-400'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-white/5 hover:text-white transition-all text-stone-400">
            <LogOut className="w-4 h-4" /> Exit to Store
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-stone-100">
            <h1 className="text-2xl font-serif font-bold text-stone-900 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab === 'products' ? 'products, SKU, tags...' : activeTab === 'categories' ? 'categories, slug...' : activeTab === 'orders' ? 'orders, client...' : 'inventory...'}`} 
                  className="pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 w-64 text-stone-900" 
                />
              </div>
              <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-sm">AD</div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue (YTD)', value: '€1.24M', trend: '+14%', color: 'text-emerald-600' },
                  { label: 'Active B2B Partners', value: '128', trend: '+3', color: 'text-emerald-600' },
                  { label: 'Pending Orders', value: '24', trend: '-5%', color: 'text-rose-500' },
                  { label: 'Inventory Value', value: '€450K', trend: 'Stable', color: 'text-stone-500' }
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
                    {[1,2,3].map(i => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-stone-50 rounded-lg border border-transparent hover:border-stone-100">
                        <div>
                          <p className="font-semibold text-sm">Galeries Lafayette</p>
                          <p className="text-xs text-stone-500">Retail Boutique • Paris, FR</p>
                        </div>
                        <button className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded">Review</button>
                      </div>
                    ))}
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
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">Bulk Import (CSV)</h2>
                  <p className="text-sm text-stone-500">Upload your massive Excel sheets mapping B2B/B2C prices.</p>
                </div>
                <div className="flex gap-4 items-center">
                  <input type="file" accept=".csv" onChange={handleFileChange} className="text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer" />
                  <button onClick={handleUpload} disabled={uploading} className="bg-emerald-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2">
                    {uploading ? 'Importing...' : <><Download className="w-4 h-4"/> Upload Data</>}
                  </button>
                </div>
              </div>
              {message && <p className="text-sm text-emerald-600 font-medium">{message}</p>}

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
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-stone-900 text-white text-[10px] uppercase tracking-widest">
                        <th className="p-3 whitespace-nowrap">SKU / Image</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 bg-stone-800">Variant (Size/Type)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 bg-amber-600 text-white whitespace-nowrap">B2B Price (Wholesale)</th>
                        <th className="p-3 bg-emerald-600 text-white whitespace-nowrap">B2C Price (Retail)</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-stone-100">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-stone-50 transition group">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-stone-100 overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={product.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=100&auto=format&fit=crop'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="font-mono text-xs text-stone-500 font-medium">{product.sku}</span>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-stone-900">
                            <div>{product.translations?.en || 'Unnamed'}</div>
                            {product.attributes?.brand && (
                              <div className="mt-1">
                                <span className="inline-block text-[9px] font-bold tracking-wider text-amber-800 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {product.attributes.brand}
                                </span>
                              </div>
                            )}
                          </td>
                          
                          <td className="p-3 text-stone-600 bg-stone-50/50">{product.attributes?.type || 'Standard'}</td>
                          <td className="p-3 text-stone-600 font-mono">{product.stock_quantity}</td>
                          <td className="p-3 font-bold text-amber-700 bg-amber-50/30">€{parseFloat(product.b2b_price || 0).toFixed(2)}</td>
                          <td className="p-3 font-bold text-emerald-700 bg-emerald-50/30">€{parseFloat(product.retail_price || 0).toFixed(2)}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link 
                                href={`/shop/${product.sku}`} 
                                target="_blank" 
                                className="p-1.5 text-stone-400 hover:text-stone-900 transition bg-white border border-stone-200 rounded shadow-sm opacity-0 group-hover:opacity-100 flex items-center justify-center" 
                                title="View Product Page"
                              >
                                <Eye className="w-3 h-3" />
                              </Link>
                              <button onClick={() => handleEditClick(product)} className="p-1.5 text-stone-400 hover:text-stone-900 transition bg-white border border-stone-200 rounded shadow-sm opacity-0 group-hover:opacity-100" title="Edit Everything (Image, Desc, Tags, Prices)">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 text-rose-500 hover:text-rose-700 transition bg-white border border-rose-100 hover:border-rose-300 rounded shadow-sm opacity-0 group-hover:opacity-100" title="Delete Product">
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
                            <img src={newCategory.image_url} alt="Category preview" className="w-full h-full object-cover" />
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
                              <img src={category.image_url} alt="" className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0" />
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
                                onClick={() => handleDeleteCategory(category.id)} 
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
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                            orderFilter === t 
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
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        orderStatusFilter === s
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
                          filteredOrders.map((order) => (
                            <tr 
                              key={order.id} 
                              onClick={() => setSelectedOrder(order)}
                              className={`hover:bg-emerald-50/20 cursor-pointer transition-colors ${
                                selectedOrder?.id === order.id ? 'bg-emerald-50/30 font-semibold border-l-4 border-emerald-600' : ''
                              }`}
                            >
                              <td className="p-4 font-mono text-stone-950 font-medium">{order.id}</td>
                              <td className="p-4">
                                <div className="font-medium text-stone-900">{order.customer}</div>
                                <div className="text-[10px] text-stone-400 font-normal">{order.email}</div>
                              </td>
                              <td className="p-4 text-stone-500 text-xs">{order.date}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                                  order.type === 'B2B' ? 'bg-[#111625] text-emerald-400' : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {order.type}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 
                                  order.status === 'Shipped' ? 'bg-blue-50 text-blue-700' : 
                                  order.status === 'Processing' ? 'bg-amber-50 text-amber-700' : 
                                  order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-stone-50 text-stone-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    order.status === 'Delivered' ? 'bg-emerald-600' : 
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
                </div>

                {/* Orders Premium Detail View Card */}
                {selectedOrder && (
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
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                                  isCompleted 
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                                    : isActive 
                                      ? 'bg-amber-500 text-white border-amber-500' 
                                      : 'bg-white text-stone-300 border-stone-200'
                                }`}>
                                  {idx + 1}
                                </div>
                                <span className={`text-[9px] font-extrabold mt-1.5 tracking-tight ${
                                  isCompleted ? 'text-emerald-700' : isActive ? 'text-amber-600' : 'text-stone-400'
                                }`}>
                                  {step}
                                </span>
                              </div>
                              {idx < 3 && (
                                <div className={`h-[2px] flex-1 -mt-4 mx-1 transition-all ${
                                  selectedOrder.status !== 'Cancelled' && currentIdx > idx 
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
                        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Customer Information</h4>
                        <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-100 text-xs space-y-2">
                          <p className="font-semibold text-stone-900 text-sm">{selectedOrder.customer}</p>
                          <p className="text-stone-600">Email: <strong>{selectedOrder.email}</strong></p>
                          <p className="text-stone-600 leading-relaxed">Shipping Address: <strong className="block text-stone-800 mt-0.5">{selectedOrder.address}</strong></p>
                          {selectedOrder.vatNumber && (
                            <p className="text-stone-600 pt-1 border-t border-stone-200/50">VAT Registration: <strong className="text-emerald-700 font-mono">{selectedOrder.vatNumber}</strong></p>
                          )}
                        </div>
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
                              className={`py-1.5 px-1 rounded text-[10px] font-bold border transition-colors ${
                                selectedOrder.status === st 
                                  ? 'bg-[#0F8A5F] border-[#0F8A5F] text-white' 
                                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {st === 'Processing' ? 'Process' : st === 'Shipped' ? 'Ship' : 'Deliver'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-stone-200/50">
                        <button 
                          onClick={() => {
                            window.print();
                          }}
                          className="flex-1 bg-stone-900 hover:bg-black text-white py-2 rounded text-xs font-bold transition shadow-xs text-center"
                        >
                          Print Invoice
                        </button>
                        <button 
                          onClick={() => {
                            alert(`Shipping updates and invoice has been re-sent to: ${selectedOrder.email}`);
                          }}
                          className="flex-1 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-2 rounded text-xs font-bold transition text-center"
                        >
                          Resend Email
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
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="flex flex-col items-center justify-center py-24 text-stone-400 animate-in fade-in duration-300">
              <FileText className="w-16 h-16 mb-4 text-stone-200" />
              <h3 className="text-lg font-bold text-stone-900 mb-2">Invoice Generator Module</h3>
              <p className="text-sm max-w-sm text-center">The billing system is connected to your Hostinger MySQL database. Generates automated PDF invoices upon order fulfillment.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-300">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">B2B Minimum Order Amount (€)</label>
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
                  </div>
                  <div className="text-xs text-stone-400 pb-2">
                    سيتم منع شركاء B2B من إتمام عملية الشراء إذا كان إجمالي السلة أقل من هذا المبلغ.
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
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">أضف خيار شحن جديد (New Courier)</h3>
                    
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

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Transit Days</label>
                        <input
                          type="text"
                          value={newShipping.days}
                          onChange={e => setNewShipping({ ...newShipping, days: e.target.value })}
                          placeholder="e.g. 1-3 days"
                          className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Shipping Cost (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newShipping.cost}
                          onChange={e => setNewShipping({ ...newShipping, cost: Number(e.target.value) })}
                          className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Country Selector */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">Covered European Countries</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={selectAllEuropeanCountries}
                            className="text-[9px] text-emerald-600 font-bold hover:underline"
                          >
                            All Europe
                          </button>
                          <button
                            type="button"
                            onClick={clearSelectedCountries}
                            className="text-[9px] text-rose-500 font-bold hover:underline"
                          >
                            Clear
                          </button>
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

                    <button
                      type="submit"
                      className="w-full bg-stone-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-black transition uppercase tracking-widest"
                    >
                      إضافة وسيلة الشحن (Add Courier)
                    </button>
                  </form>

                  {/* Shipping Directory List */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">طرق الشحن الحالية (Configured Methods)</h3>
                    
                    <div className="space-y-3">
                      {shippingMethods.map((method, idx) => (
                        <div key={method.id || idx} className="border border-stone-100 bg-white p-4 rounded-xl shadow-xs flex justify-between items-start hover:border-stone-200 transition group">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-stone-900 text-sm">{method.name}</h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{method.days}</span>
                            </div>
                            <p className="text-xs text-stone-500 font-mono">Cost: €{parseFloat(method.cost || 0).toFixed(2)}</p>
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {method.countries.map((c: string, ci: number) => (
                                <span key={ci} className="text-[9px] bg-stone-100 border border-stone-200/50 rounded px-1.5 py-0.5 text-stone-600 font-medium">{c}</span>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveShipping(method.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="Remove shipping option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

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
                          style={{ backgroundImage: `url('${heroBanners[activeSlideTab]?.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop'}')` }}
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
                          style={{ backgroundImage: `url('${homepageFeatured.main?.image_url || 'https://images.unsplash.com/photo-1615486171447-49fde384501a?q=80&w=600&auto=format&fit=crop'}')` }}
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
                            style={{ backgroundImage: `url('${homepageFeatured.card1?.image_url || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=400&auto=format&fit=crop'}')` }}
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
                            style={{ backgroundImage: `url('${homepageFeatured.card2?.image_url || 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=400&auto=format&fit=crop'}')` }}
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

      {/* Add Product Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] rounded-xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-stone-855">
            
            {/* Header */}
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-900 text-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-serif font-bold tracking-wide">Publish Premium Product</h2>
                <p className="text-xs text-stone-300 font-medium">Add a base product and customize multiple specifications, sizes, prices, and images.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-8">
              
              {/* SECTION 1: Base Product Info */}
              <div className="bg-white p-6 rounded-xl border border-stone-200/60 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">1</span>
                  Base Product Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Product Name (English)</label>
                    <input 
                      type="text" 
                      value={newProduct.name_en}
                      onChange={e => setNewProduct({ ...newProduct, name_en: e.target.value })}
                      placeholder="e.g. Royal Oud Blend"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Product Name (Arabic - Optional)</label>
                    <input 
                      type="text" 
                      value={newProduct.name_ar}
                      onChange={e => setNewProduct({ ...newProduct, name_ar: e.target.value })}
                      placeholder="مثال: مزيج العود الملكي"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Brand (Optional)</label>
                    <input 
                      type="text" 
                      value={newProduct.brand || ''}
                      onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                      placeholder="e.g. REEF"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                    />
                  </div>
                  <div className="md:col-span-3 border-t border-stone-100 pt-4 mt-2">
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                      Product Categories <span className="text-emerald-600 normal-case font-normal">(select one or more)</span>
                    </label>
                    <div className="border border-stone-200 rounded-lg overflow-y-auto max-h-36 bg-stone-50/50 divide-y divide-stone-100">
                      {categories.map((c: any) => {
                        const checked = newProduct.category_ids?.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-stone-100 transition select-none ${
                              checked ? 'bg-emerald-50 hover:bg-emerald-50' : ''
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
                              className="accent-emerald-600 w-3.5 h-3.5 shrink-0"
                            />
                            <span className="text-xs font-medium text-stone-800">
                              {c.parent ? <span className="text-stone-400 mr-1">↳</span> : null}
                              {c.name?.en || 'Unnamed'}
                              {c.name?.ar ? <span className="text-stone-400 ml-2 font-normal">({c.name.ar})</span> : null}
                            </span>
                            {checked && (
                              <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {newProduct.category_ids?.[0] === c.id ? 'Primary' : 'Also'}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    {newProduct.category_ids?.length > 0 && (
                      <p className="mt-1.5 text-[10px] text-stone-400">
                        {newProduct.category_ids.length} categor{newProduct.category_ids.length === 1 ? 'y' : 'ies'} selected
                        {' · '}Primary: <strong>{categories.find((c: any) => c.id === newProduct.category_ids[0])?.name?.en || '—'}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Description (English)</label>
                    <textarea 
                      value={newProduct.description_en}
                      onChange={e => setNewProduct({ ...newProduct, description_en: e.target.value })}
                      placeholder="Add a detailed English product description..."
                      rows={3}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Description (Arabic - Optional)</label>
                    <textarea 
                      value={newProduct.description_ar}
                      onChange={e => setNewProduct({ ...newProduct, description_ar: e.target.value })}
                      placeholder="أضف وصفاً تفصيلياً للمنتج باللغة العربية..."
                      rows={3}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Short Description / Specs (English)</label>
                    <textarea 
                      value={newProduct.short_description_en}
                      onChange={e => setNewProduct({ ...newProduct, short_description_en: e.target.value })}
                      placeholder="Add a short description or key specifications (e.g. top/heart/base notes)..."
                      rows={2}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Short Description / Specs (Arabic - Optional)</label>
                    <textarea 
                      value={newProduct.short_description_ar}
                      onChange={e => setNewProduct({ ...newProduct, short_description_ar: e.target.value })}
                      placeholder="أضف وصفاً قصيراً أو مواصفات العطر الأساسية باللغة العربية..."
                      rows={2}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Sitemap / SEO Tags (Comma separated)</label>
                  <input 
                    type="text" 
                    value={newProduct.tags}
                    onChange={e => setNewProduct({ ...newProduct, tags: e.target.value })}
                    placeholder="e.g. fragrance, luxury, oud, summer, best-seller"
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Used for XML sitemaps, SEO search keywords, and site filtering. Separate each tag with a comma.</p>
                </div>
              </div>

              {/* SECTION 2: Variants & Custom Attributes */}
              <div className="bg-white p-6 rounded-xl border border-stone-200/60 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">2</span>
                    Product Variants ({newProduct.variants.length})
                  </h3>
                  <button 
                    type="button" 
                    onClick={addVariantRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition text-xs font-bold border border-emerald-200/40"
                  >
                    <Plus className="w-4 h-4" /> Add Variant
                  </button>
                </div>

                <div className="space-y-6 divide-y divide-stone-100">
                  {newProduct.variants.map((variant: any, index: number) => (
                    <div key={index} className={`pt-6 first:pt-0 space-y-6 relative ${newProduct.variants.length > 1 ? 'pr-8' : ''}`}>
                      
                      {/* Delete variant row absolute button */}
                      {newProduct.variants.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeVariantRow(index)}
                          className="absolute right-0 top-6 text-rose-500 hover:text-rose-700 transition bg-rose-50 p-1.5 rounded"
                          title="Delete Variant Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Header line for variant name */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-stone-400 font-mono">Variant #{index + 1}</span>
                        <input 
                          type="text"
                          value={variant.variant_type}
                          onChange={e => handleVariantChange(index, 'variant_type', e.target.value)}
                          placeholder="Variant Type (e.g. 100ml Extrait)"
                          className="border-b border-stone-300 focus:border-stone-900 focus:outline-none text-sm font-bold text-stone-900 py-0.5 px-1 bg-transparent w-48"
                          required
                        />
                      </div>

                      {/* Variant Row Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">SKU</label>
                          <input 
                            type="text" 
                            value={variant.sku}
                            onChange={e => handleVariantChange(index, 'sku', e.target.value)}
                            placeholder="Manually typed or auto-gen"
                            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">EAN Barcode (Optional)</label>
                          <input 
                            type="text" 
                            value={variant.ean}
                            onChange={e => handleVariantChange(index, 'ean', e.target.value)}
                            placeholder="62900..."
                            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Initial Stock</label>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={variant.stock_quantity ?? ''}
                            onChange={e => handleVariantChange(index, 'stock_quantity', e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Net Price (€)</label>
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
                            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                            required
                          />
                        </div>
                      </div>

                      {/* Pricing Row 2 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Gross Price (With Tax - €)</label>
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
                            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">B2B Wholesale Price (€)</label>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={variant.b2b_price ?? ''}
                            onChange={e => handleVariantChange(index, 'b2b_price', e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Retail Compare Price (€ - Optional)</label>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={variant.retail_price ?? ''}
                            onChange={e => handleVariantChange(index, 'retail_price', e.target.value)}
                            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                          />
                        </div>
                      </div>

                      {/* Variant-Specific Image Choice & Upload */}
                      <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 flex flex-col md:flex-row gap-4 items-center">
                        <div className="w-12 h-12 bg-white rounded-md border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {variant.image_url ? (
                            <img src={variant.image_url} alt="Variant" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-stone-300" />
                          )}
                        </div>

                        {/* Image Source Mode Choice */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Main Image Source</label>
                          <div className="flex gap-1 bg-stone-200 p-0.5 rounded-lg w-fit">
                            <button 
                              type="button" 
                              onClick={() => handleVariantChange(index, 'image_mode', 'upload')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${variant.image_mode === 'upload' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                            >
                              Upload File
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleVariantChange(index, 'image_mode', 'url')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${variant.image_mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                            >
                              URL Link
                            </button>
                          </div>
                        </div>

                        {/* Direct input fields depending on image mode choice */}
                        <div className="flex-1 w-full">
                          {variant.image_mode === 'upload' ? (
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleVariantImageUpload(index, e.target.files[0]);
                                  }
                                }}
                                disabled={variant.uploadingImage}
                                className="w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                              />
                              {variant.uploadingImage && (
                                <span className="absolute right-3 top-2 text-[10px] font-semibold text-emerald-600 animate-pulse">Uploading file...</span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <input 
                                type="text" 
                                value={variant.image_url}
                                onChange={e => handleVariantChange(index, 'image_url', e.target.value)}
                                placeholder="Paste direct image URL here"
                                className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Variant-Specific Hover / Secondary Image Choice & Upload */}
                      <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 flex flex-col md:flex-row gap-4 items-center">
                        <div className="w-12 h-12 bg-white rounded-md border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {variant.secondary_image_url ? (
                            <img src={variant.secondary_image_url} alt="Variant Hover" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-stone-300" />
                          )}
                        </div>

                        {/* Image Source Mode Choice */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Hover Image Source</label>
                          <div className="flex gap-1 bg-stone-200 p-0.5 rounded-lg w-fit">
                            <button 
                              type="button" 
                              onClick={() => handleVariantChange(index, 'secondary_image_mode', 'upload')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${variant.secondary_image_mode === 'upload' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                            >
                              Upload File
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleVariantChange(index, 'secondary_image_mode', 'url')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${variant.secondary_image_mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                            >
                              URL Link
                            </button>
                          </div>
                        </div>

                        {/* Direct input fields depending on image mode choice */}
                        <div className="flex-1 w-full">
                          {variant.secondary_image_mode === 'upload' ? (
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={e => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleVariantSecondaryImageUpload(index, e.target.files[0]);
                                  }
                                }}
                                disabled={variant.uploadingSecondaryImage}
                                className="w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                              />
                              {variant.uploadingSecondaryImage && (
                                <span className="absolute right-3 top-2 text-[10px] font-semibold text-emerald-600 animate-pulse">Uploading file...</span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <input 
                                type="text" 
                                value={variant.secondary_image_url}
                                onChange={e => handleVariantChange(index, 'secondary_image_url', e.target.value)}
                                placeholder="Paste direct hover image URL here (Optional)"
                                className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-4 bg-stone-50 -mx-6 -mb-6 p-6 sticky bottom-0 rounded-b-xl border-t border-stone-200 z-10">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-10 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-black text-sm font-semibold transition uppercase tracking-widest text-xs shadow-md"
                >
                  Publish All Variants
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF9F6] rounded-xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-stone-900">
            
            {/* Header */}
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-900 text-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-serif font-bold tracking-wide">Edit Product Specifications</h2>
                <p className="text-xs text-stone-300 font-medium">Update the name, image, tags, prices, and settings of this product record.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-6">
              
              {/* SECTION 1: Product Translation & Details */}
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
                  1. Product Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Product Name (English)</label>
                    <input 
                      type="text" 
                      value={editProduct.name_en}
                      onChange={e => setEditProduct({ ...editProduct, name_en: e.target.value })}
                      placeholder="e.g. Royal Oud Blend"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Product Name (Arabic)</label>
                    <input 
                      type="text" 
                      value={editProduct.name_ar}
                      onChange={e => setEditProduct({ ...editProduct, name_ar: e.target.value })}
                      placeholder="مثال: مزيج العود الملكي"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Brand (Optional)</label>
                    <input 
                      type="text" 
                      value={editProduct.brand || ''}
                      onChange={e => setEditProduct({ ...editProduct, brand: e.target.value })}
                      placeholder="e.g. REEF"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-900 text-stone-900"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                      Product Categories <span className="text-emerald-600 normal-case font-normal">(select one or more)</span>
                    </label>
                    <div className="border border-stone-200 rounded-lg overflow-y-auto max-h-36 bg-stone-50/50 divide-y divide-stone-100">
                      {categories.map((c: any) => {
                        const checked = editProduct.category_ids?.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-stone-100 transition select-none ${
                              checked ? 'bg-emerald-50 hover:bg-emerald-50' : ''
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
                              className="accent-emerald-600 w-3.5 h-3.5 shrink-0"
                            />
                            <span className="text-xs font-medium text-stone-800">
                              {c.parent ? <span className="text-stone-400 mr-1">↳</span> : null}
                              {c.name?.en || 'Unnamed'}
                              {c.name?.ar ? <span className="text-stone-400 ml-2 font-normal">({c.name.ar})</span> : null}
                            </span>
                            {checked && (
                              <span className="ml-auto text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {editProduct.category_ids?.[0] === c.id ? 'Primary' : 'Also'}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                    {editProduct.category_ids?.length > 0 && (
                      <p className="mt-1.5 text-[10px] text-stone-400">
                        {editProduct.category_ids.length} categor{editProduct.category_ids.length === 1 ? 'y' : 'ies'} selected
                        {' · '}Primary: <strong>{categories.find((c: any) => c.id === editProduct.category_ids[0])?.name?.en || '—'}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Description (English)</label>
                    <textarea 
                      value={editProduct.description_en}
                      onChange={e => setEditProduct({ ...editProduct, description_en: e.target.value })}
                      placeholder="Product details in English..."
                      rows={2}
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Description (Arabic)</label>
                    <textarea 
                      value={editProduct.description_ar}
                      onChange={e => setEditProduct({ ...editProduct, description_ar: e.target.value })}
                      placeholder="الوصف باللغة العربية..."
                      rows={2}
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Short Description / Specs (English)</label>
                    <textarea 
                      value={editProduct.short_description_en}
                      onChange={e => setEditProduct({ ...editProduct, short_description_en: e.target.value })}
                      placeholder="Short details in English..."
                      rows={2}
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Short Description / Specs (Arabic)</label>
                    <textarea 
                      value={editProduct.short_description_ar}
                      onChange={e => setEditProduct({ ...editProduct, short_description_ar: e.target.value })}
                      placeholder="الوصف القصير باللغة العربية..."
                      rows={2}
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 text-right dir-rtl"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Sitemap & SEO Tags (Comma separated)</label>
                  <input 
                    type="text" 
                    value={editProduct.tags}
                    onChange={e => setEditProduct({ ...editProduct, tags: e.target.value })}
                    placeholder="e.g. oud, premium, luxury, summer-collection"
                    className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                  />
                </div>
              </div>

              {/* SECTION 2: Identifiers & Stock */}
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
                  2. Identifiers & Stock
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Product SKU</label>
                    <input 
                      type="text" 
                      value={editProduct.sku}
                      onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })}
                      placeholder="e.g. OUD-100"
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">EAN Barcode (Optional)</label>
                    <input 
                      type="text" 
                      value={editProduct.ean}
                      onChange={e => setEditProduct({ ...editProduct, ean: e.target.value })}
                      placeholder="Barcode"
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Variant Size/Type</label>
                    <input 
                      type="text" 
                      value={editProduct.variant_type}
                      onChange={e => setEditProduct({ ...editProduct, variant_type: e.target.value })}
                      placeholder="e.g. 100ml EDP"
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Stock Quantity</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={editProduct.stock_quantity ?? ''}
                      onChange={e => setEditProduct({ ...editProduct, stock_quantity: e.target.value })}
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Pricing System (VAT Sync) */}
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
                  3. B2B & B2C Pricing System (Dynamic VAT sync)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">Net Sales Price (€)</label>
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
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">Gross Price (With Tax - €)</label>
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
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">B2B Wholesale Price (€)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={editProduct.b2b_price ?? ''}
                      onChange={e => setEditProduct({ ...editProduct, b2b_price: e.target.value })}
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">Retail Compare Price (€)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      value={editProduct.retail_price ?? ''}
                      onChange={e => setEditProduct({ ...editProduct, retail_price: e.target.value })}
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Image Manager */}
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
                  4. Image Configuration
                </h3>

                {/* Main Image */}
                <div className="border border-stone-100 rounded-lg p-3 bg-stone-50/50">
                  <span className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Main Product Image</span>
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-16 h-16 bg-white rounded-md border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {editProduct.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editProduct.image_url} alt="Product" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Image Source</label>
                      <div className="flex gap-1 bg-stone-200 p-0.5 rounded-lg w-fit">
                        <button 
                          type="button" 
                          onClick={() => setEditProduct({ ...editProduct, image_mode: 'upload' })}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${editProduct.image_mode === 'upload' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                          Upload Image
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditProduct({ ...editProduct, image_mode: 'url' })}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${editProduct.image_mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                          Direct URL
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      {editProduct.image_mode === 'upload' ? (
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleEditProductImageUpload(e.target.files[0]);
                              }
                            }}
                            disabled={editProduct.uploadingImage}
                            className="w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                          />
                          {editProduct.uploadingImage && (
                            <span className="absolute right-3 top-2 text-[10px] font-semibold text-emerald-600 animate-pulse">Uploading image...</span>
                          )}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={editProduct.image_url}
                          onChange={e => setEditProduct({ ...editProduct, image_url: e.target.value })}
                          placeholder="Paste image URL link here"
                          className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover / Secondary Image */}
                <div className="border border-stone-100 rounded-lg p-3 bg-stone-50/50">
                  <span className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Hover / Secondary Product Image</span>
                  <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-16 h-16 bg-white rounded-md border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {editProduct.secondary_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editProduct.secondary_image_url} alt="Product Hover" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider">Image Source</label>
                      <div className="flex gap-1 bg-stone-200 p-0.5 rounded-lg w-fit">
                        <button 
                          type="button" 
                          onClick={() => setEditProduct({ ...editProduct, secondary_image_mode: 'upload' })}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${editProduct.secondary_image_mode === 'upload' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                          Upload Image
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditProduct({ ...editProduct, secondary_image_mode: 'url' })}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${editProduct.secondary_image_mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'}`}
                        >
                          Direct URL
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      {editProduct.secondary_image_mode === 'upload' ? (
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                handleEditProductSecondaryImageUpload(e.target.files[0]);
                              }
                            }}
                            disabled={editProduct.uploadingSecondaryImage}
                            className="w-full text-xs text-stone-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black transition cursor-pointer"
                          />
                          {editProduct.uploadingSecondaryImage && (
                            <span className="absolute right-3 top-2 text-[10px] font-semibold text-emerald-600 animate-pulse">Uploading image...</span>
                          )}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={editProduct.secondary_image_url}
                          onChange={e => setEditProduct({ ...editProduct, secondary_image_url: e.target.value })}
                          placeholder="Paste hover image URL link here (Optional)"
                          className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-stone-900 text-stone-900"
                        />
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Sticky footer */}
              <div className="pt-4 border-t border-stone-200 flex justify-end gap-4 bg-stone-50 -mx-6 -mb-6 p-6 sticky bottom-0 rounded-b-xl border-t border-stone-200 z-10">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-10 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-black text-sm font-semibold transition uppercase tracking-widest text-xs shadow-md"
                >
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
                      <img src={editCategory.image_url} alt="Category" className="w-full h-full object-cover" />
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
    </div>
  );
}
