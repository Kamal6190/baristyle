"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, Printer, Truck, FileText, ExternalLink, Mail, ArrowLeft } from "lucide-react";

type Locale = 'de' | 'fr' | 'en' | 'ar' | 'nl';

const sTranslations = {
  en: {
    orderConfirmed: "Order Confirmed",
    thankYou: "Thank you for your purchase. Your exquisite selection is being prepared and will be shipped shortly.",
    shippingNotice: "A copy of your official invoice has been dispatched to your email. You can track your shipping details below or print a copy of this commercial invoice for your records.",
    estDelivery: "Estimated Delivery: 2-3 Business Days",
    shippingDetails: "Shipping & Fulfillment",
    courier: "Courier Service",
    trackingNum: "Active Tracking Number",
    trackShipment: "Track Shipment (GLS Link)",
    downloadInvoice: "Print Commercial Invoice",
    orderSummary: "Commercial Invoice / Receipt",
    orderId: "Invoice Number",
    date: "Invoice Date",
    item: "Product Details",
    qty: "Qty",
    price: "Unit Price",
    subtotal: "Subtotal",
    shipping: "Premium Shipping",
    total: "Grand Total",
    continueShopping: "Continue Shopping",
    status: "Fulfillment Status",
    processing: "Processing Fulfillment",
    billTo: "Billed To",
    paymentMethod: "Payment Method",
    creditCard: "Credit Card (Stripe Secure)",
    complimentary: "Complimentary"
  },
  ar: {
    orderConfirmed: "تم تأكيد طلبك بنجاح",
    thankYou: "شكرًا لك على ثقتك واختيارك لمنتجاتنا الفاخرة. خياراتك الأنيقة قيد التجهيز الآن وسيتم شحنها إليك في أقرب وقت.",
    shippingNotice: "تم إرسال نسخة رسمية من الفاتورة لبريدك الإلكتروني. يمكنك تتبع الشحنة عبر الرابط أدناه، أو طباعة هذه الفاتورة التجارية والاحتفاظ بها كإثبات شراء رسمي.",
    estDelivery: "تاريخ التوصيل المتوقع: 2-3 أيام عمل",
    shippingDetails: "معلومات الشحن والخدمات اللوجستية",
    courier: "ناقل الشحن المعتمد",
    trackingNum: "رقم تتبع الشحنة النشط",
    trackShipment: "رابط تتبع الشحنة (GLS)",
    downloadInvoice: "طباعة / تحميل الفاتورة الرسمية",
    orderSummary: "فاتورة تجارية / إيصال شراء",
    orderId: "رقم الفاتورة",
    date: "تاريخ الفاتورة",
    item: "تفاصيل المنتج الفاخر",
    qty: "الكمية",
    price: "سعر الوحدة",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن الفاخر السريع",
    total: "المجموع الكلي",
    continueShopping: "العودة ومواصلة التسوق بالمتجر",
    status: "حالة الشحنة",
    processing: "جاري تجهيز الشحنة",
    billTo: "فاتورة لصالح",
    paymentMethod: "طريقة الدفع",
    creditCard: "بطاقة الائتمان (Stripe الآمن)",
    complimentary: "مجاني بالكامل"
  },
  de: {
    orderConfirmed: "Bestellung Bestätigt",
    thankYou: "Vielen Dank für Ihren Einkauf. Ihre exquisite Auswahl wird vorbereitet und in Kürze versandt.",
    shippingNotice: "Eine Kopie Ihrer offiziellen Rechnung wurde an Ihre E-Mail gesendet. Sie können Ihre Versanddetails unten verfolgen oder diese Handelsrechnung für Ihre Unterlagen ausdrucken.",
    estDelivery: "Voraussichtliche Lieferung: 2-3 Werktage",
    shippingDetails: "Versand & Logistikdetails",
    courier: "Zustelldienst",
    trackingNum: "Aktive Sendungsnummer",
    trackShipment: "Sendung verfolgen (GLS-Link)",
    downloadInvoice: "Handelsrechnung drucken",
    orderSummary: "Handelsrechnung / Beleg",
    orderId: "Rechnungsnummer",
    date: "Rechnungsdatum",
    item: "Produktdetails",
    qty: "Menge",
    price: "Einzelpreis",
    subtotal: "Zwischensumme",
    shipping: "Premium-Versand",
    total: "Gesamtsumme",
    continueShopping: "Weiter Einkaufen",
    status: "Erfüllungsstatus",
    processing: "In Bearbeitung",
    billTo: "Rechnungsempfänger",
    paymentMethod: "Zahlungsmethode",
    creditCard: "Kreditkarte (Sicheres Stripe)",
    complimentary: "Kostenlos"
  },
  fr: {
    orderConfirmed: "Commande Confirmée",
    thankYou: "Merci pour votre achat. Votre sélection exquise est en cours de préparation et sera expédiée sous peu.",
    shippingNotice: "Une copie officielle de votre facture a été envoyée à votre e-mail. Vous pouvez suivre vos détails de livraison ci-dessous ou imprimer cette facture commerciale pour vos dossiers.",
    estDelivery: "Livraison Estimée : 2-3 Jours Ouvrables",
    shippingDetails: "Expédition & Logistique",
    courier: "Service de Livraison",
    trackingNum: "Numéro de Suivi Actif",
    trackShipment: "Suivre le Colis (GLS)",
    downloadInvoice: "Imprimer la Facture Commerciale",
    orderSummary: "Facture Commerciale / Reçu",
    orderId: "Numéro de Facture",
    date: "Date de Facture",
    item: "Détails du Produit",
    qty: "Qté",
    price: "Prix Unitaire",
    subtotal: "Sous-total",
    shipping: "Frais de Port Premium",
    total: "Total Général",
    continueShopping: "Continuer les Achats",
    status: "Statut d'Expédition",
    processing: "Traitement en cours",
    billTo: "Facturé À",
    paymentMethod: "Mode de Paiement",
    creditCard: "Carte Bancaire (Stripe Sécurisé)",
    complimentary: "Offert"
  },
  nl: {
    orderConfirmed: "Bestelling Bevestigd",
    thankYou: "Dank u voor uw aankoop. Uw prachtige selectie wordt klaargemaakt en binnenkort verzonden.",
    shippingNotice: "Een officiële kopie van uw factuur is naar uw e-mail verzonden. U kunt uw zending hieronder volgen of deze commerciële factuur afdrukken voor uw administratie.",
    estDelivery: "Verwachte Levering: 2-3 Werkdagen",
    shippingDetails: "Verzending & Logistiek",
    courier: "Koeriersdienst",
    trackingNum: "Actief Trackingnummer",
    trackShipment: "Zending Volgen (GLS Link)",
    downloadInvoice: "Commerciële Factuur Printen",
    orderSummary: "Commerciële Factuur / Kassabon",
    orderId: "Facturnummer",
    date: "Factuurdatum",
    item: "Productdetails",
    qty: "Aantal",
    price: "Stuksprijs",
    subtotal: "Subtotaal",
    shipping: "Premium Verzending",
    total: "Totaal Generaal",
    continueShopping: "Verder Winkelen",
    status: "Verzendingstatus",
    processing: "In behandeling",
    billTo: "Gefactureerd Aan",
    paymentMethod: "Betaalmethode",
    creditCard: "Creditcard (Stripe Beveiligd)",
    complimentary: "Gratis"
  }
};

export default function Success() {
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  const [order, setOrder] = useState<any>(null);
  const [email, setEmail] = useState<string>("billing@baristyle.com");

  useEffect(() => {
    // Determine language
    const savedLang = localStorage.getItem('lang') as Locale;
    const activeLang = savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang) ? savedLang : 'de';
    setCurrentLang(activeLang);

    // Retrieve email from user session if logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj.email) {
          setEmail(userObj.email);
        }
      } catch (e) {
        console.error("Failed to parse user details", e);
      }
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length > 0) {
      const orderId = 'BS-' + Math.floor(100000 + Math.random() * 90000);
      const subtotal = cart.reduce((acc: number, item: any) => acc + (parseFloat(item.price) * item.quantity), 0);
      const shipping = subtotal > 150 ? 0 : 15;
      const total = subtotal + shipping;
      
      const newOrder = {
        orderId,
        date: new Date().toLocaleDateString(activeLang === 'ar' ? 'ar-SA' : 'de-DE', { year: 'numeric', month: 'long', day: 'numeric' }),
        items: cart,
        subtotal: subtotal.toFixed(2),
        shipping: shipping === 0 ? '0.00' : shipping.toFixed(2),
        total: total.toFixed(2),
        status: 'Processing',
        trackingNumber: 'DE' + Math.floor(100000000 + Math.random() * 900000000) + 'GLS'
      };

      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.unshift(newOrder); // Prepend to history
      localStorage.setItem('orders', JSON.stringify(existingOrders));
      
      setOrder(newOrder);
      
      // Clear cart
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
    } else {
      // Fetch latest order if page refreshed
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      if (existingOrders.length > 0) {
        setOrder(existingOrders[0]);
      }
    }
  }, []);

  const t = sTranslations[currentLang] || sTranslations.de;
  const isRtl = currentLang === 'ar';

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  // Real GLS tracking link
  const trackingLink = `https://www.gls-pakete.de/sendungsverfolgung?txtTrackingNumber=${order.trackingNumber}`;

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-24 text-stone-850" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Global CSS Style block specifically for perfect PDF Invoice Printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, footer, nav, .print-hide, .btn-action {
            display: none !important;
          }
          main, body, .bg-\\[\\#FAF9F6\\] {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-full-width {
            max-w: 100% !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .print-receipt-section {
            border: 1px solid #e5e7eb !important;
            padding: 2rem !important;
            border-radius: 4px !important;
          }
        }
      ` }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 print-full-width">
        {/* Top return link */}
        <div className="mb-8 print-hide">
          <Link href="/shop" className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-950 transition ${isRtl ? 'flex-row-reverse' : ''}`}>
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} /> {t.continueShopping}
          </Link>
        </div>

        {/* Hero Success Card */}
        <div className="bg-white p-8 sm:p-12 border border-stone-200 rounded-sm shadow-sm text-center mb-10 print-hide">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
            <CheckCircle className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-4">{t.orderConfirmed}</h1>
          <p className="text-stone-500 max-w-2xl mx-auto text-base leading-relaxed mb-6">{t.thankYou}</p>
          
          <div className="max-w-xl mx-auto bg-stone-50 border border-stone-150 p-4 rounded-md flex items-start gap-3 text-xs text-stone-500 text-right leading-relaxed">
            <Mail className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <p className={isRtl ? 'text-right' : 'text-left'}>{t.shippingNotice}</p>
          </div>
        </div>

        {/* Dynamic Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Beautiful Commercial Invoice Card */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-sm shadow-sm p-8 sm:p-10 print-full-width print-receipt-section">
            <div className="flex justify-between items-start border-b border-stone-150 pb-8 mb-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-wide">BARISTYLE</h2>
                <p className="text-[10px] tracking-wider font-semibold text-stone-400 uppercase mt-1">Private Collection perfumes</p>
              </div>
              <div className={isRtl ? 'text-left' : 'text-right'}>
                <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-sm uppercase tracking-widest print:border-stone-300 print:text-black">
                  {t.orderSummary}
                </span>
                <p className="text-xs text-stone-450 mt-2 font-mono">{t.orderId}: {order.orderId}</p>
              </div>
            </div>

            {/* Billing Details Block */}
            <div className="grid grid-cols-2 gap-8 text-xs mb-8">
              <div>
                <h4 className="font-bold text-stone-400 uppercase tracking-widest mb-2">{t.billTo}</h4>
                <p className="font-bold text-stone-800">{email.split('@')[0].toUpperCase()}</p>
                <p className="text-stone-500 mt-1">{email}</p>
                <p className="text-stone-400 mt-0.5 font-mono">ID: {Math.floor(1000 + Math.random() * 9000)}</p>
              </div>
              <div className={isRtl ? 'text-left' : 'text-right'}>
                <h4 className="font-bold text-stone-400 uppercase tracking-widest mb-2">{t.paymentMethod}</h4>
                <p className="font-bold text-stone-850">{t.creditCard}</p>
                <p className="text-stone-500 mt-1 font-mono">{t.date}: {order.date}</p>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="border-t border-b border-stone-150 py-6 mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-3">
                    <th className={`pb-3 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>{t.item}</th>
                    <th className="pb-3 text-center font-semibold">{t.qty}</th>
                    <th className={`pb-3 font-semibold ${isRtl ? 'text-left' : 'text-right'}`}>{t.price}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {order.items.map((item: any) => (
                    <tr key={item.id} className="text-stone-800">
                      <td className="py-4">
                        <div className="font-bold text-stone-900">{item.name}</div>
                        <div className="text-[10px] text-stone-400 font-normal uppercase tracking-wider mt-0.5">100ml / Extrait de Parfum</div>
                      </td>
                      <td className="py-4 text-center font-bold text-stone-600">{item.quantity}</td>
                      <td className={`py-4 font-mono font-bold ${isRtl ? 'text-left' : 'text-right'}`}>€{parseFloat(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs max-w-sm ml-auto mr-0 print:ml-auto">
              <div className="flex justify-between text-stone-600">
                <span>{t.subtotal}</span>
                <span className="font-mono font-bold">€{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>{t.shipping}</span>
                <span className="font-bold">
                  {parseFloat(order.shipping) === 0 ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded text-[10px] font-semibold print:text-black uppercase print:border-none print:bg-none print:p-0">
                      {t.complimentary}
                    </span>
                  ) : (
                    <span className="font-mono">€{order.shipping}</span>
                  )}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-3 flex justify-between text-base font-bold text-stone-950">
                <span>{t.total}</span>
                <span className="font-mono text-lg text-emerald-800 print:text-black">€{order.total}</span>
              </div>
            </div>

            {/* Professional Seal / Footer for Invoice */}
            <div className="mt-12 pt-8 border-t border-stone-100 text-[10px] text-stone-400 text-center uppercase tracking-widest leading-relaxed">
              <p>BariStyle Global Gmbh • Grasse / Berlin • VAT ID DE 987654321</p>
              <p className="mt-1 font-mono text-[9px]">Thank you for your boutique retail partnership</p>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Shipping, Fulfillment, & Print Action Card */}
          <div className="lg:col-span-5 space-y-6 print-hide">
            
            {/* Shipping & Delivery Logistics Card */}
            <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-8">
              <div className="flex items-center gap-3 border-b border-stone-150 pb-5 mb-5">
                <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-lg leading-tight">{t.shippingDetails}</h3>
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">{t.estDelivery}</span>
                </div>
              </div>

              {/* Shipping info attributes */}
              <div className="space-y-5 text-xs mb-8">
                <div className="flex justify-between py-1.5 border-b border-stone-50">
                  <span className="font-medium text-stone-450 uppercase tracking-wider">{t.courier}</span>
                  <span className="font-bold text-stone-850">GLS Premium Express (Europe)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-50">
                  <span className="font-medium text-stone-450 uppercase tracking-wider">{t.status}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded text-[10px] uppercase">
                    <Package className="w-3.5 h-3.5" /> {t.processing}
                  </span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <span className="font-medium text-stone-450 uppercase tracking-wider">{t.trackingNum}</span>
                  <div className="bg-stone-50 p-3.5 border border-stone-150 rounded font-mono font-bold text-stone-700 text-center tracking-wider text-sm">
                    {order.trackingNumber}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE TRACKING BUTTON (رابط الشحن) */}
              <a 
                href={trackingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-stone-900 hover:bg-black text-white rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-md group cursor-pointer"
              >
                <span>{t.trackShipment}</span>
                <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-white transition" />
              </a>
            </div>

            {/* PRINT COMMERCIAL INVOICE ACTION CARD */}
            <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-8 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-serif font-bold text-stone-900 text-base mb-2">{t.downloadInvoice}</h4>
              <p className="text-xs text-stone-500 leading-relaxed mb-6 max-w-xs">
                {isRtl 
                  ? "قم بطباعة هذه الفاتورة الرسمية أو حفظها كملف PDF لتسجيل حساباتك وحفظ معلومات الضمان."
                  : "Print this commercial invoice or save it directly as a PDF file for your corporate bookkeeping and records."}
              </p>
              
              <button 
                onClick={handlePrint}
                className="w-full py-4 bg-white border border-stone-300 hover:border-stone-950 text-stone-900 rounded text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition hover:bg-stone-50 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{t.downloadInvoice}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
