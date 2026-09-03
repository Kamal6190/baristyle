// frontend/src/utils/invoice.ts
// Official Commercial Invoice Generator for BS Baristore / BariStyle

export interface InvoiceItem {
  name: string;
  sku?: string;
  quantity: number;
  price: number | string;
  total_price?: number | string;
  digitalKeys?: string[];
  digitalInstructions?: string;
}

export interface InvoiceOrder {
  orderId?: string;
  id?: string;
  db_id?: string;
  date?: string;
  created_at?: string;
  customerName?: string;
  customer_name?: string;
  customerEmail?: string;
  customer_email?: string;
  customerPhone?: string;
  customer_phone?: string;
  shippingAddress?: string;
  shipping_address?: string;
  subtotal?: number | string;
  shipping?: number | string;
  shipping_amount?: number | string;
  total?: number | string;
  total_amount?: number | string;
  discount_amount?: number | string;
  coupon_code?: string;
  shippingProvider?: string;
  shipping_provider?: string;
  trackingNumber?: string;
  tracking_number?: string;
  items: InvoiceItem[];
  locale?: string;
}

const invoiceTranslations: Record<string, any> = {
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
    orderReference: "Bestellreferenz",
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
    shippingDetails: "Versand- & Lieferungsdetails",
    carrier: "Versanddienstleister",
    tracking: "Sendungsnummer",
    thankYou: "Vielen Dank für Ihren Einkauf bei BS Baristore!",
    digitalDeliveryTitle: "Digitale Aktivierungsschlüssel:",
    activationInstructions: "Installations- & Aktivierungsanleitung:",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;"
  },
  ar: {
    invoice: "فاتورة رسمية",
    billedTo: "بيانات العميل والشحن",
    issuedBy: "صادر عن",
    representedBy: "الممثل القانوني",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    taxId: "الرقم الضريبي المحلي",
    vatId: "رقم ضريبة القيمة المضافة (USt-IdNr)",
    date: "التاريخ",
    orderReference: "رقم الطلب",
    productDescription: "وصف المنتج والخدمة",
    qty: "الكمية",
    unitPrice: "سعر الوحدة",
    totalPrice: "السعر الإجمالي",
    subtotal: "المجموع الفرعي",
    shippingHandling: "الشحن والتسليم",
    complimentary: "مجاني",
    discount: "خصم",
    vatTaxIncluded: "شامل ضريبة القيمة المضافة (19%)",
    grandTotal: "المجموع الكلي",
    shippingDetails: "تفاصيل الشحن والتوصيل",
    carrier: "شركة الشحن",
    tracking: "رقم التتبع",
    thankYou: "شكراً لتعاملكم مع BS Baristore!",
    digitalDeliveryTitle: "مفاتيح التفعيل الرقمية للتراخيص:",
    activationInstructions: "تعليمات التثبيت والتفعيل:",
    dir: "rtl",
    alignLeft: "right",
    alignRight: "left",
    alignLeftStyle: "text-align: right; direction: rtl;",
    alignRightStyle: "text-align: left; direction: ltr;"
  },
  en: {
    invoice: "COMMERCIAL INVOICE",
    billedTo: "Billed To & Ship To",
    issuedBy: "Issued By",
    representedBy: "Represented by",
    phone: "Phone",
    email: "Email",
    taxId: "Tax ID",
    vatId: "VAT ID",
    date: "Date",
    orderReference: "Order Reference",
    productDescription: "Product Description",
    qty: "Qty",
    unitPrice: "Unit Price",
    totalPrice: "Total Price",
    subtotal: "Subtotal",
    shippingHandling: "Shipping & Handling",
    complimentary: "Complimentary",
    discount: "Discount",
    vatTaxIncluded: "VAT Included (19%)",
    grandTotal: "Grand Total",
    shippingDetails: "Shipping & Fulfillment Details",
    carrier: "Carrier",
    tracking: "Tracking #",
    thankYou: "Thank you for choosing BS Baristore!",
    digitalDeliveryTitle: "Digital License & Activation Keys:",
    activationInstructions: "Installation & Activation Guide:",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;"
  },
  fr: {
    invoice: "FACTURE COMMERCIALE",
    billedTo: "Facturé & Livré à",
    issuedBy: "Émis par",
    representedBy: "Représenté par",
    phone: "Téléphone",
    email: "E-mail",
    taxId: "Numéro fiscal",
    vatId: "N° TVA",
    date: "Date",
    orderReference: "Réf. Commande",
    productDescription: "Description du produit",
    qty: "Qté",
    unitPrice: "Prix unitaire",
    totalPrice: "Prix total",
    subtotal: "Sous-total",
    shippingHandling: "Frais de port",
    complimentary: "Gratuit",
    discount: "Remise",
    vatTaxIncluded: "TVA incluse (19%)",
    grandTotal: "Total général",
    shippingDetails: "Détails de livraison",
    carrier: "Transporteur",
    tracking: "Numéro de suivi",
    thankYou: "Merci d'avoir choisi BS Baristore !",
    digitalDeliveryTitle: "Clés d'activation de licence :",
    activationInstructions: "Guide d'installation et d'activation :",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;"
  },
  nl: {
    invoice: "FACTUUR",
    billedTo: "Gefactureerd & Verzonden naar",
    issuedBy: "Uitgegeven door",
    representedBy: "Vertegenwoordigd door",
    phone: "Telefoon",
    email: "E-mail",
    taxId: "Belastingnummer",
    vatId: "Btw-nr",
    date: "Datum",
    orderReference: "Bestelreferentie",
    productDescription: "Productomschrijving",
    qty: "Aantal",
    unitPrice: "Stuksprijs",
    totalPrice: "Totaalprijs",
    subtotal: "Subtotaal",
    shippingHandling: "Verzending",
    complimentary: "Gratis",
    discount: "Korting",
    vatTaxIncluded: "Inclusief btw (19%)",
    grandTotal: "Eindtotaal",
    shippingDetails: "Verzenddetails",
    carrier: "Vervoerder",
    tracking: "Volgnummer",
    thankYou: "Bedankt dat u voor BS Baristore heeft gekozen!",
    digitalDeliveryTitle: "Digitale licentie- en activatiecodes:",
    activationInstructions: "Installatie- en activeringshandleiding:",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;"
  }
};

export function buildInvoiceHtml(order: InvoiceOrder, requestedLang?: string): string {
  const activeLang = requestedLang && invoiceTranslations[requestedLang] ? requestedLang : (order.locale && invoiceTranslations[order.locale] ? order.locale : 'de');
  const t = invoiceTranslations[activeLang];

  const orderIdRaw = order.db_id || order.id || order.orderId || 'BARISTORE';
  const cleanId = orderIdRaw.replace(/^ORD-/, '');
  const invoiceNumber = `INV-2026-${cleanId.substring(0, 6).toUpperCase()}`;
  const orderRef = order.orderId || `ORD-${cleanId.substring(0, 6).toUpperCase()}`;

  const dateStr = order.created_at || order.date
    ? new Date(order.created_at || order.date!).toLocaleDateString(activeLang === 'ar' ? 'ar-SA' : activeLang === 'de' ? 'de-DE' : activeLang === 'fr' ? 'fr-FR' : activeLang === 'nl' ? 'nl-NL' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString(activeLang);

  const customerName = order.customerName || order.customer_name || 'Valued Customer';
  const customerEmail = order.customerEmail || order.customer_email || '—';
  const customerPhone = order.customerPhone || order.customer_phone || '';
  const shippingAddress = order.shippingAddress || order.shipping_address || '';

  const carrier = order.shippingProvider || order.shipping_provider || '';
  const tracking = order.trackingNumber || order.tracking_number || '';

  const subtotalVal = parseFloat(String(order.subtotal || order.total || order.total_amount || 0).replace(/[^0-9.]/g, '')) || 0;
  const shippingVal = parseFloat(String(order.shipping || order.shipping_amount || '0').replace(/[^0-9.]/g, '')) || 0;
  const totalVal = parseFloat(String(order.total || order.total_amount || (subtotalVal + shippingVal)).replace(/[^0-9.]/g, '')) || (subtotalVal + shippingVal);
  const discountVal = parseFloat(String(order.discount_amount || '0').replace(/[^0-9.]/g, '')) || 0;

  // 19% MwSt. embedded
  const vatVal = (totalVal - shippingVal) * 19 / 119;

  const itemsRows = (order.items || []).map((item: any) => {
    const unitPrice = parseFloat(String(item.price || item.unit_price || 0).replace(/[^0-9.]/g, '')) || 0;
    const qty = parseInt(String(item.quantity || 1), 10) || 1;
    const lineTotal = parseFloat(String(item.total_price || (unitPrice * qty)).replace(/[^0-9.]/g, '')) || (unitPrice * qty);

    const keys: string[] = Array.isArray(item.digitalKeys) ? item.digitalKeys : [];
    const instructions = item.digitalInstructions || '';

    return `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; color: #1c1917; ${t.alignLeftStyle}">
          <div style="font-weight: 700; font-size: 13px; color: #111625;">${item.name}</div>
          ${item.sku && item.sku !== 'N/A' ? `<div style="font-size: 10px; color: #78716c; font-family: monospace; margin-top: 2px;">SKU: ${item.sku}</div>` : ''}
          ${keys.length > 0 ? `
            <div style="margin-top: 8px; padding: 8px 12px; background: #fefce8; border: 1px solid #fef08a; border-radius: 4px; font-size: 11px;">
              <span style="font-weight: 700; color: #854d0e; display: block; margin-bottom: 4px;">🔑 ${t.digitalDeliveryTitle}</span>
              ${keys.map(k => `<div style="font-family: monospace; font-weight: 700; color: #1e293b; background: white; padding: 3px 6px; border: 1px dashed #cbd5e1; border-radius: 3px; display: inline-block; margin: 2px 4px 2px 0;">${k}</div>`).join('')}
              ${instructions ? `<div style="margin-top: 6px; color: #475569; font-size: 10px; line-height: 1.4;">${instructions}</div>` : ''}
            </div>
          ` : ''}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; text-align: center; color: #1c1917; font-weight: 600;">${qty}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; text-align: ${t.alignRight}; font-family: monospace; color: #1c1917; ${t.alignRightStyle}">€${unitPrice.toFixed(2)}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #f3f4f6; text-align: ${t.alignRight}; font-family: monospace; font-weight: bold; color: #111625; ${t.alignRightStyle}">€${lineTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="${activeLang}" dir="${t.dir}">
    <head>
      <meta charset="utf-8"/>
      <title>${t.invoice} - ${invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&family=Cairo:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body {
          font-family: ${activeLang === 'ar' ? "'Cairo', 'Inter', sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"};
          color: #1c1917;
          margin: 0;
          padding: 40px;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .container {
          max-width: 820px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 2px solid #e7e5e4;
          padding-bottom: 20px;
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-badge {
          background: #d40026;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 900;
          font-size: 16px;
          letter-spacing: -0.5px;
        }
        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 800;
          color: #0c0a09;
          margin: 0;
          letter-spacing: 0.5px;
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
        .invoice-badge {
          display: inline-block;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 4px 10px;
          border-radius: 4px;
          margin-bottom: 6px;
        }
        .invoice-number {
          font-size: 15px;
          font-weight: 800;
          color: #1c1917;
          margin: 0;
          font-family: monospace;
        }
        .order-ref {
          font-size: 11px;
          color: #78716c;
          margin: 2px 0 0 0;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }
        .info-block h3 {
          font-size: 10px;
          font-weight: 700;
          color: #78716c;
          text-transform: uppercase;
          letter-spacing: 1px;
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
          color: #0c0a09;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }
        th {
          background: #fafaf9;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #57534e;
          padding: 10px 10px;
          text-align: ${t.alignLeft};
          border-top: 1px solid #e7e5e4;
          border-bottom: 2px solid #e7e5e4;
        }
        .financials {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          margin-bottom: 36px;
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
          color: #0c0a09;
          border-top: 2px solid #1c1917;
          padding-top: 10px;
        }
        .financials-table tr.total-row .amount {
          color: #059669;
        }
        .shipping-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 14px;
          font-size: 11px;
          line-height: 1.5;
        }
        .footer {
          border-top: 1px solid #e7e5e4;
          padding-top: 20px;
          text-align: center;
          font-size: 10px;
          color: #78716c;
          letter-spacing: 0.5px;
          line-height: 1.8;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="container" dir="${t.dir}">
        
        <!-- Header -->
        <div class="header">
          <div>
            <div class="logo-box">
              <span class="logo-badge">BS</span>
              <span class="logo-text">Baristore</span>
            </div>
            <p class="subtitle">BariStyle Wholesale & Retail</p>
          </div>
          <div class="invoice-title">
            <div class="invoice-badge">${t.invoice}</div>
            <p class="invoice-number">${invoiceNumber}</p>
            <p class="order-ref">${t.orderReference}: <strong>${orderRef}</strong></p>
          </div>
        </div>

        <!-- Addresses & Legal Issuer Grid -->
        <div class="grid">
          <div class="info-block" style="${t.alignLeftStyle}">
            <h3>${t.billedTo}</h3>
            <p>
              <strong>${customerName}</strong><br/>
              ${customerEmail !== '—' ? `${t.email}: ${customerEmail}<br/>` : ''}
              ${customerPhone ? `${t.phone}: ${customerPhone}<br/>` : ''}
              ${shippingAddress ? `<strong>${t.billedTo}:</strong><br/>${shippingAddress.replace(/\n/g, '<br/>')}` : ''}
            </p>
          </div>
          <div class="info-block" style="${t.alignLeftStyle}">
            <h3>${t.issuedBy}</h3>
            <p>
              <strong>BariStyle / Barigroup</strong><br/>
              ${t.representedBy}: Kamal Abdalbary<br/>
              Zeppelinstraße 62, 52068 Aachen, Germany<br/>
              ${t.phone}: +49 152524 11886 &bull; ${t.email}: service@barigroup.net<br/>
              ${t.taxId}: 201/5000/8736 &bull; ${t.vatId}: DE436103705<br/>
              LUCID: DE4769331655434<br/>
              <strong>${t.date}:</strong> ${dateStr}
            </p>
          </div>
        </div>

        <!-- Line Items Table -->
        <table dir="${t.dir}">
          <thead>
            <tr>
              <th style="${t.alignLeftStyle}">${t.productDescription}</th>
              <th style="text-align: center; width: 60px;">${t.qty}</th>
              <th style="text-align: ${t.alignRight}; width: 100px; ${t.alignRightStyle}">${t.unitPrice}</th>
              <th style="text-align: ${t.alignRight}; width: 110px; ${t.alignRightStyle}">${t.totalPrice}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Financial Summary & Logistics -->
        <div class="financials" dir="${t.dir}">
          <div>
            ${carrier || tracking ? `
              <div class="shipping-card" style="${t.alignLeftStyle}">
                <strong style="color: #0f172a; display: block; margin-bottom: 4px;">🚚 ${t.shippingDetails}</strong>
                ${carrier ? `${t.carrier}: <strong>${carrier}</strong><br/>` : ''}
                ${tracking ? `${t.tracking}: <span style="font-family: monospace; font-weight: bold; color: #047857;">${tracking}</span>` : ''}
              </div>
            ` : ''}
          </div>
          <div>
            <table class="financials-table" dir="${t.dir}">
              <tr>
                <td style="${t.alignLeftStyle}">${t.subtotal}</td>
                <td style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">€${subtotalVal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="${t.alignLeftStyle}">${t.shippingHandling}</td>
                <td style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">${shippingVal === 0 ? t.complimentary : `€${shippingVal.toFixed(2)}`}</td>
              </tr>
              ${discountVal > 0 ? `
                <tr style="color: #059669; font-weight: 600;">
                  <td style="${t.alignLeftStyle}">${t.discount} ${order.coupon_code ? `(${order.coupon_code})` : ''}</td>
                  <td style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">-€${discountVal.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="color: #78716c; font-size: 11px; ${t.alignLeftStyle}">${t.vatTaxIncluded}</td>
                <td style="text-align: ${t.alignRight}; font-family: monospace; color: #78716c; font-size: 11px; ${t.alignRightStyle}">€${vatVal.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td style="${t.alignLeftStyle}">${t.grandTotal}</td>
                <td class="amount" style="text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">€${totalVal.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p style="margin: 0 0 4px 0; font-weight: 600; color: #1c1917;">${t.thankYou}</p>
          <p style="margin: 0;">
            barigroup.net &bull; Zeppelinstraße 62, 52068 Aachen &bull; Steuernummer: 201/5000/8736 &bull; USt-IdNr.: DE436103705 &bull; LUCID: DE4769331655434 &bull; service@barigroup.net
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Triggers printing of the invoice, opening the browser's native print-to-PDF dialogue.
 * Includes an invisible iframe fallback so popup blockers never stop the download/print action.
 */
export function printCustomerInvoice(order: InvoiceOrder, lang: string = 'de'): void {
  const html = buildInvoiceHtml(order, lang);

  // Attempt window.open first
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
    return;
  }

  // Fallback if popup blocked: use hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 500);
  }
}
