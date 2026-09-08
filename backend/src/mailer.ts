import 'dotenv/config';
import nodemailer from 'nodemailer';
import prisma from './prismaClient';

const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = process.env.SMTP_SECURE !== undefined
  ? process.env.SMTP_SECURE === 'true'
  : smtpPort === 465;

let _transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return _transporter;
};

// Verify SMTP connection on startup (non-blocking, won't crash server)
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  getTransporter().verify().then(() => {
    console.log('✅ SMTP server connection verified successfully');
  }).catch((err) => {
    console.error('❌ SMTP server connection failed:', err.message);
  });
} else {
  console.warn('⚠️ SMTP credentials not set — email sending will be disabled');
}

export const sendPasswordResetEmail = async (
  toEmail: string,
  userName: string,
  resetToken: string
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: toEmail,
    subject: 'Reset Your BS Baristore Password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Reset Password</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:#111625;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">
                      BS <span style="color:#e30613;">Baristore</span>
                    </h1>
                    <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">Universal Wholesale & Retail</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">Hello, <strong style="color:#111625;">${userName}</strong></p>
                    <h2 style="color:#111625;font-size:20px;font-weight:700;margin:0 0 16px;">Password Reset Request</h2>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 32px;">
                      We received a request to reset your password for your BS Baristore account.
                      Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
                    </p>
                    <div style="text-align:center;margin-bottom:32px;">
                      <a href="${resetLink}"
                        style="display:inline-block;background:#111625;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
                        Reset My Password
                      </a>
                    </div>
                    <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
                      If you did not request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;" />
                    <p style="color:#d1d5db;font-size:11px;margin:0;text-align:center;">
                      This link expires in 1 hour &nbsp;Â·&nbsp; BS Baristore &nbsp;Â·&nbsp; baristyle.de
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

export const sendAbandonedCartOfferEmail = async (
  toEmail: string,
  couponCode: string
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const checkoutLink = `${frontendUrl}/checkout`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: toEmail,
    subject: 'Exklusiver Rabatt für Ihre Bestellung bei BS Baristore',
    html: `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Ihr exklusives Angebot</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:#111625;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">
                      BS <span style="color:#e30613;">Baristore</span>
                    </h1>
                    <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">Exklusive Angebote & Düfte</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#111625;font-size:20px;font-weight:700;margin:0 0 16px;">Sie haben etwas in Ihrer Einkaufstasche vergessen!</h2>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Hallo! Wir haben bemerkt, dass Sie Ihren Einkauf bei uns nicht abgeschlossen haben. Ihre Lieblingsartikel warten noch in Ihrer Einkaufstasche auf Sie!
                    </p>
                    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Um Ihnen die Entscheidung zu versüßen, schenken wir Ihnen einen exklusiven Gutschein für Ihre Bestellung:
                    </p>
                    <div style="background:#f9fafb;border:1px dashed #d1d5db;border-radius:6px;padding:20px;text-align:center;margin-bottom:28px;">
                      <span style="display:block;color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Ihr Gutscheincode</span>
                      <strong style="color:#e30613;font-size:28px;font-weight:800;letter-spacing:2px;font-family:monospace;">${couponCode}</strong>
                    </div>
                    <div style="text-align:center;margin-bottom:32px;">
                      <a href="${checkoutLink}"
                        style="display:inline-block;background:#111625;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
                        Einkauf fortsetzen
                      </a>
                    </div>
                    <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
                      Geben Sie den Gutscheincode einfach im Warenkorb oder während des Bestellvorgangs ein, um Ihren Rabatt zu erhalten.
                    </p>
                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;" />
                    <p style="color:#d1d5db;font-size:11px;margin:0;text-align:center;">
                      BS Baristore &nbsp;·&nbsp; baristyle.de
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

const translations: Record<string, any> = {
  en: {
    subject: "Your BS Baristore Invoice - {invoiceNumber}",
    invoice: "INVOICE",
    billedTo: "BILLED TO / SHIP TO",
    issuedBy: "ISSUED BY",
    shippingAddress: "Shipping Address",
    date: "Date",
    shippedTitle: "📦 Shipped & On The Way!",
    shippedText: "Your order is shipped via <strong>{provider}</strong>.",
    trackBtn: "Track Your Package",
    product: "Product",
    qty: "Qty",
    price: "Price",
    total: "Total",
    subtotal: "Subtotal",
    shippingHandling: "Shipping & Handling",
    complimentary: "Complimentary",
    couponDiscount: "Coupon Discount ({code})",
    vatTaxIncluded: "VAT Tax Included (19%)",
    grandTotal: "Grand Total",
    thankYou: "Thank you for choosing <strong>BS Baristore</strong>. We appreciate your business!",
    supportText: "For support, contact us at <a href=\"mailto:info@barigroup.de\" style=\"color:#e30613;text-decoration:none;\">info@barigroup.de</a>.",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;",
    digitalDeliveryTitle: "🔑 Digital License Delivery",
    digitalDeliveryText: "Here are your digital keys/activation codes for <strong>{productName}</strong>:",
    instructionsTitle: "Installation & Download Instructions:"
  },
  de: {
    subject: "Ihre BS Baristore Rechnung - {invoiceNumber}",
    invoice: "RECHNUNG",
    billedTo: "RECHNUNGS- & LIEFERADRESSE",
    issuedBy: "AUSGESTELLT VON",
    shippingAddress: "Lieferadresse",
    date: "Datum",
    shippedTitle: "📦 Versandt & unterwegs!",
    shippedText: "Ihre Bestellung wurde per <strong>{provider}</strong> versandt.",
    trackBtn: "Paket verfolgen",
    product: "Produkt",
    qty: "Menge",
    price: "Preis",
    total: "Gesamt",
    subtotal: "Zwischensumme",
    shippingHandling: "Versand & Bearbeitung",
    complimentary: "Kostenlos",
    couponDiscount: "Gutschein-Rabatt ({code})",
    vatTaxIncluded: "Inklusive MwSt. (19%)",
    grandTotal: "Gesamtsumme",
    thankYou: "Vielen Dank, dass Sie sich für <strong>BS Baristore</strong> entschieden haben. Wir schätzen Ihr Vertrauen!",
    supportText: "Bei Fragen kontaktieren Sie uns unter <a href=\"mailto:info@barigroup.de\" style=\"color:#e30613;text-decoration:none;\">info@barigroup.de</a>.",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;",
    digitalDeliveryTitle: "🔑 Digitale Produktlieferung",
    digitalDeliveryText: "Hier sind Ihre digitalen Lizenzschlüssel/Aktivierungscodes für <strong>{productName}</strong>:",
    instructionsTitle: "Installations- & Download-Anleitung:"
  },
  ar: {
    subject: "فاتورة بي إس باريستور الخاصة بك - {invoiceNumber}",
    invoice: "فاتورة شراء",
    billedTo: "الفاتورة إلى / الشحن إلى",
    issuedBy: "صادر عن",
    shippingAddress: "عنوان الشحن",
    date: "التاريخ",
    shippedTitle: "📦 تم الشحن وهي في الطريق!",
    shippedText: "تم شحن طلبك عبر <strong>{provider}</strong>.",
    trackBtn: "تتبع شحنتك",
    product: "المنتج",
    qty: "الكمية",
    price: "السعر",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    shippingHandling: "الشحن والتسليم",
    complimentary: "مكافأة / مجاني",
    couponDiscount: "خصم كوبون ({code})",
    vatTaxIncluded: "شامل ضريبة القيمة المضافة (19%)",
    grandTotal: "المجموع الكلي",
    thankYou: "شكراً لاختيارك <strong>بي إس باريستور</strong>. نحن نقدر تعاملك معنا!",
    supportText: "للدعم الفني، اتصل بنا على <a href=\"mailto:info@barigroup.de\" style=\"color:#e30613;text-decoration:none;\">info@barigroup.de</a>.",
    dir: "rtl",
    alignLeft: "right",
    alignRight: "left",
    alignLeftStyle: "text-align: right; direction: rtl;",
    alignRightStyle: "text-align: left; direction: ltr;"
  },
  fr: {
    subject: "Votre facture BS Baristore - {invoiceNumber}",
    invoice: "FACTURE",
    billedTo: "FACTURE À / EXPÃ‰DIÃ‰ Ã€",
    issuedBy: "ÉMIS PAR",
    shippingAddress: "Adresse de livraison",
    date: "Date",
    shippedTitle: "📦 ExpÃ©diÃ© & En chemin!",
    shippedText: "Votre commande est expédiée via <strong>{provider}</strong>.",
    trackBtn: "Suivre votre colis",
    product: "Produit",
    qty: "QtÃ©",
    price: "Prix",
    total: "Total",
    subtotal: "Sous-total",
    shippingHandling: "Frais de port & Manutention",
    complimentary: "Gratuit",
    couponDiscount: "Remise Coupon ({code})",
    vatTaxIncluded: "TVA incluse (19%)",
    grandTotal: "Total gÃ©nÃ©ral",
    thankYou: "Merci d'avoir choisi <strong>BS Baristore</strong>. Nous apprécions votre confiance !",
    supportText: "Pour toute assistance, contactez-nous à <a href=\"mailto:info@barigroup.de\" style=\"color:#e30613;text-decoration:none;\">info@barigroup.de</a>.",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;"
  },
  nl: {
    subject: "Uw BS Baristore Factuur - {invoiceNumber}",
    invoice: "FACTUUR",
    billedTo: "GEFACTUREERD AAN / VERZONDEN NAAR",
    issuedBy: "UITGEGEVEN DOOR",
    shippingAddress: "Verzendadres",
    date: "Datum",
    shippedTitle: "📦 Verzonden & Onderweg!",
    shippedText: "Uw bestelling is verzonden via <strong>{provider}</strong>.",
    trackBtn: "Volg uw pakket",
    product: "Product",
    qty: "Aantal",
    price: "Prijs",
    total: "Totaal",
    subtotal: "Subtotaal",
    shippingHandling: "Verzending & Afhandeling",
    complimentary: "Gratis",
    couponDiscount: "Kortingsbon ({code})",
    vatTaxIncluded: "Inclusief btw (19%)",
    grandTotal: "Eindtotaal",
    thankYou: "Bedankt dat u voor <strong>BS Baristore</strong> heeft gekozen. We waarderen uw vertrouwen!",
    supportText: "Voor ondersteuning, neem contact met ons op via <a href=\"mailto:info@barigroup.de\" style=\"color:#e30613;text-decoration:none;\">info@barigroup.de</a>.",
    dir: "ltr",
    alignLeft: "left",
    alignRight: "right",
    alignLeftStyle: "text-align: left;",
    alignRightStyle: "text-align: right;"
  }
};

export const sendDigitalKeyDeliveryEmail = async (order: any): Promise<boolean> => {
  try {
    const toEmail = order.customer_email;
    if (!toEmail) return false;

    const invoiceLocale = order.locale && translations[order.locale] ? order.locale : 'de';
    const t = translations[invoiceLocale] || translations['de'];

    let digitalItemsHtml = '';
    
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        let keys: string[] = [];
        let instructions = '';
        if (item.product_id) {
          try {
            const product = await prisma.product.findUnique({ where: { id: item.product_id } });
            const attrs = (product?.attributes as any) || {};
            const soldKeys = attrs.soldKeys || {};
            keys = soldKeys[order.id] || soldKeys[order.db_id] || [];
            
            const orderInstMap = attrs.digitalInstructionsOrder || {};
            instructions = orderInstMap[order.id] || orderInstMap[order.db_id]
              || (typeof attrs.digitalInstructions === 'object'
                  ? (attrs.digitalInstructions[invoiceLocale] || attrs.digitalInstructions['de'] || attrs.digitalInstructions['en'] || attrs.digitalInstructions['ar'])
                  : attrs.digitalInstructions)
              || '';
          } catch (e) {}
        }

        // Fallback to tracking_number if keys array empty
        if (keys.length === 0 && order.tracking_number) {
          keys = [order.tracking_number];
        }

        if (keys.length > 0 || instructions) {
          const formattedInst = (() => {
            if (!instructions) return '';
            if (instructions.includes('<') && instructions.includes('>')) return instructions;
            const urlRegex = /(https?:\/\/[^\s<]+)/g;
            const withLinks = instructions.replace(urlRegex, (url: string) => 
              `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline; word-break: break-all;">${url}</a>`
            );
            return withLinks.replace(/\n/g, '<br/>');
          })();

          digitalItemsHtml += `
            <div style="margin-bottom: 24px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
              <!-- Product Title Header -->
              <div style="background: #f9fafb; padding: 14px 20px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="margin: 0; color: #111827; font-size: 15px; font-weight: 700;">📦 ${item.name}</h3>
              </div>

              <div style="padding: 20px;">
                <!-- Product Keys Box -->
                ${keys.length > 0 ? `
                  <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                      🔑 Ihr Lizenzschlüssel / Product Key:
                    </label>
                    <div style="background: #ecfdf5; border: 1.5px dashed #10b981; border-radius: 8px; padding: 14px 18px;">
                      ${keys.map((k: string) => `
                        <div style="font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 800; color: #047857; letter-spacing: 1px; word-break: break-all; margin: 4px 0;">
                          ${k}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}

                <!-- Separate Installation & Download Instructions Section -->
                ${formattedInst ? `
                  <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; margin-top: 16px;">
                    <label style="display: block; font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
                      📥 Installations- & Aktivierungsanleitung:
                    </label>
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.7; color: #374151;">
                      ${formattedInst}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }
      }
    }

    if (!digitalItemsHtml) return false;

    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || 'BS Baristore <info@barigroup.de>',
      to: toEmail,
      subject: `🔑 Ihr Produktschlüssel & Aktivierungsanleitung - Bestellung #${order.order_number || order.id.substring(0, 8)}`,
      html: `
        <!DOCTYPE html>
        <html lang="${invoiceLocale}" dir="${t.dir}">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Digital Key & Instructions</title>
        </head>
        <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: #111625; padding: 28px 32px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1.5px;">
                        BS <span style="color: #e30613;">BARISTORE</span>
                      </h1>
                      <p style="color: #9ca3af; font-size: 12px; margin: 6px 0 0 0;">Digitale Lieferung & Aktivierung</p>
                    </td>
                  </tr>

                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 18px; font-weight: 700;">
                        Vielen Dank für Ihre Bestellung!
                      </h2>
                      <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
                        Hier finden Sie Ihren gekauften Produktschlüssel sowie die vollständige Anleitung zur Installation und Aktivierung:
                      </p>

                      ${digitalItemsHtml}

                      <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center; font-size: 12px; color: #6b7280;">
                        Bei Fragen oder benötigter Hilfe kontaktieren Sie unseren Support jederzeit unter:<br/>
                        <a href="mailto:info@barigroup.de" style="color: #e30613; font-weight: bold; text-decoration: none;">info@barigroup.de</a>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af;">
                      BS Baristore · barigroup.net · Zeppelinstraße 62, 52068 Aachen
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    return true;
  } catch (err) {
    console.error('Error sending digital key delivery email:', err);
    return false;
  }
};

export const sendOrderInvoiceEmail = async (
  toEmail: string,
  order: any
) => {
  const invoiceNumber = `INV-2026-${order.id.substring(0, 6).toUpperCase()}`;
  const invoiceLocale = order.locale && translations[order.locale] ? order.locale : 'de';
  const t = translations[invoiceLocale];

  const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString(invoiceLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : new Date().toLocaleDateString(invoiceLocale);

  const total = parseFloat(order.total_amount);
  const shipping = parseFloat(order.shipping_amount);
  const discount = order.discount_amount ? parseFloat(order.discount_amount) : 0;
  const subtotal = total - shipping;

  const itemsData = await Promise.all(order.items.map(async (item: any) => {
    let digitalHtml = '';
    if (item.product_id) {
      try {
        const product = await prisma.product.findUnique({ where: { id: item.product_id } });
        const attrs = (product?.attributes as any) || {};
        if (attrs.isDigital) {
          const soldKeys = attrs.soldKeys || {};
          const keys = soldKeys[order.id] || [];
          const orderInstMap = attrs.digitalInstructionsOrder || {};
          const instructions = orderInstMap[order.id]
            || (typeof attrs.digitalInstructions === 'object' 
                ? (attrs.digitalInstructions[invoiceLocale] || attrs.digitalInstructions['de'] || attrs.digitalInstructions['en'] || attrs.digitalInstructions['ar'])
                : attrs.digitalInstructions)
            || '';

          if (keys.length > 0 || instructions) {
            digitalHtml = `
              <div style="margin-top: 16px; padding: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;" dir="${t.dir}">
                <p style="color: #b45309; font-size: 14px; font-weight: bold; margin: 0 0 8px 0; text-align: ${t.alignLeft};">
                  ${t.digitalDeliveryTitle}
                </p>
                <p style="color: #b45309; font-size: 12px; margin: 0 0 12px 0; text-align: ${t.alignLeft};">
                  ${t.digitalDeliveryText.replace('{productName}', item.name)}
                </p>
                ${keys.length > 0 ? `
                  <ul style="margin: 0 0 12px 0; padding-left: 20px; color: #111625; font-family: monospace; font-size: 13px; text-align: ${t.alignLeft};">
                    ${keys.map((k: string) => `<li style="font-weight: bold; margin-bottom: 4px; text-align: ${t.alignLeft};">${k}</li>`).join('')}
                  </ul>
                ` : ''}
                ${instructions ? `
                  <div style="border-top: 1px dashed #fde68a; padding-top: 10px; margin-top: 10px; color: #4b5563; font-size: 12px; text-align: ${t.alignLeft};">
                    ${!(instructions.toLowerCase().includes('anleitung') || instructions.toLowerCase().includes('installations')) ? `<strong style="color: #b45309;">${t.instructionsTitle}</strong><br/>` : ''}
                    <div style="margin-top: 6px; line-height: 1.6; color: #374151;">
                      ${(() => {
                        if (instructions.includes('<') && instructions.includes('>')) return instructions;
                        const urlRegex = /(https?:\/\/[^\s<]+)/g;
                        const withLinks = instructions.replace(urlRegex, (url: string) => 
                          `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline; word-break: break-all;">${url}</a>`
                        );
                        return withLinks.replace(/\n/g, '<br/>');
                      })()}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }
        }
      } catch (err) {
        console.error('Error fetching digital keys for email:', err);
      }
    }
    return { item, digitalHtml };
  }));

  const itemsHtml = itemsData.map(({ item }) => `
    <tr>
      <td align="${t.alignLeft}" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px; ${t.alignLeftStyle}">
        <strong>${item.name}</strong>
        ${item.sku ? `<br/><span style="color: #9ca3af; font-size: 10px; font-family: monospace;">SKU: ${item.sku}</span>` : ''}
      </td>
      <td align="center" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px;">${item.quantity}</td>
      <td align="${t.alignRight}" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px; text-align: ${t.alignRight}; font-family: monospace; ${t.alignRightStyle}">€${parseFloat(item.unit_price).toFixed(2)}</td>
      <td align="${t.alignRight}" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px; text-align: ${t.alignRight}; font-family: monospace; font-weight: bold; ${t.alignRightStyle}">€${parseFloat(item.total_price).toFixed(2)}</td>
    </tr>
  `).join('');

  const digitalBlocksHtml = itemsData.map(d => d.digitalHtml).filter(Boolean).join('');

  let fallbackInstructions = '';
  if (!digitalBlocksHtml && order.items) {
    try {
      for (const item of order.items) {
        if (item.product_id) {
          const product = await prisma.product.findUnique({ where: { id: item.product_id } });
          const attrs = (product?.attributes as any) || {};
          const orderInstMap = attrs.digitalInstructionsOrder || {};
          const inst = orderInstMap[order.id] 
            || (typeof attrs.digitalInstructions === 'object' ? (attrs.digitalInstructions[invoiceLocale] || attrs.digitalInstructions['de']) : attrs.digitalInstructions);
          if (inst) {
            fallbackInstructions = inst;
            break;
          }
        }
      }
    } catch (e) {}
  }

  const isUrl = order.tracking_number && (order.tracking_number.startsWith('http://') || order.tracking_number.startsWith('https://'));
  const isDigitalCourier = order.shipping_provider && (
    order.shipping_provider.toLowerCase().includes('digital') || 
    order.shipping_provider.toLowerCase().includes('key') || 
    order.shipping_provider.toLowerCase().includes('esd') ||
    order.shipping_provider.toLowerCase().includes('license')
  );

  const trackingHtml = order.shipping_provider && order.tracking_number ? `
    <div style="margin-top: 24px; padding: 16px; background: ${isDigitalCourier ? '#fffbeb' : '#ecfdf5'}; border: 1px solid ${isDigitalCourier ? '#fde68a' : '#a7f3d0'}; border-radius: 6px; text-align: center;" dir="${t.dir}">
      <p style="color: ${isDigitalCourier ? '#b45309' : '#065f46'}; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
        ${isDigitalCourier ? '🔑 Digital Key / License Information' : t.shippedTitle}
      </p>
      <p style="color: ${isDigitalCourier ? '#92400e' : '#047857'}; font-size: 12px; margin: 0 0 12px 0;">
        ${isDigitalCourier ? `Delivery Method: <strong>${order.shipping_provider}</strong>` : t.shippedText.replace('{provider}', order.shipping_provider)}
      </p>
      ${isUrl ? `
        <a href="${order.tracking_number}" target="_blank" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 8px 20px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${t.trackBtn}
        </a>
      ` : `
        <div style="display: inline-block; background: #ffffff; color: ${isDigitalCourier ? '#b45309' : '#047857'}; border: 1.5px dashed ${isDigitalCourier ? '#f59e0b' : '#059669'}; padding: 10px 18px; border-radius: 6px; font-size: 14px; font-family: monospace; font-weight: bold; word-break: break-all;">
          ${order.tracking_number}
        </div>
      `}
      ${(isDigitalCourier && fallbackInstructions) ? `
        <div style="border-top: 1px dashed #fde68a; padding-top: 10px; margin-top: 10px; color: #4b5563; font-size: 12px; text-align: ${t.alignLeft};">
          <strong style="color: #b45309;">${t.instructionsTitle}</strong><br/>
          <div style="margin-top: 6px; line-height: 1.6; color: #374151; text-align: ${t.alignLeft};">
            ${(() => {
              if (fallbackInstructions.includes('<') && fallbackInstructions.includes('>')) return fallbackInstructions;
              const urlRegex = /(https?:\/\/[^\s<]+)/g;
              const withLinks = fallbackInstructions.replace(urlRegex, (url: string) => 
                `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline; word-break: break-all;">${url}</a>`
              );
              return withLinks.replace(/\n/g, '<br/>');
            })()}
          </div>
        </div>
      ` : ''}
    </div>
  ` : '';

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <info@barigroup.de>',
    to: toEmail,
    subject: t.subject.replace('{invoiceNumber}', invoiceNumber),
    html: `
      <!DOCTYPE html>
      <html lang="${invoiceLocale}" dir="${t.dir}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Order Invoice</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
                <!-- Header / Logo -->
                <tr>
                  <td style="background:#111625;padding:32px 40px;color:#ffffff;">
                    <table width="100%" cellpadding="0" cellspacing="0" dir="${t.dir}">
                      <tr>
                        <td align="${t.alignLeft}">
                          <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;text-align:${t.alignLeft};">
                            BS <span style="color:#e30613;">Baristore</span>
                          </h1>
                          <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;text-align:${t.alignLeft};">Universal Wholesale & Retail</p>
                        </td>
                        <td align="${t.alignRight}">
                          <h2 style="color:#e30613;font-size:18px;font-weight:800;margin:0;text-transform:uppercase;letter-spacing:0.5px;text-align:${t.alignRight};">${t.invoice}</h2>
                          <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;text-align:${t.alignRight};">${invoiceNumber}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Invoice Body -->
                <tr>
                  <td style="padding:40px;">
                    <!-- Company & Bill To info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;" dir="${t.dir}">
                      <tr>
                        <td width="50%" valign="top" style="${t.dir === 'rtl' ? 'padding-left:20px;' : 'padding-right:20px;'} text-align: ${t.alignLeft};">
                          <h3 style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">${t.billedTo}</h3>
                          <p style="color:#111625;font-size:14px;font-weight:bold;margin:0 0 4px 0;">${order.customer_name || 'Valued Customer'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Email: ${order.customer_email || 'N/A'}</p>
                          ${order.customer_phone ? `<p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Phone: ${order.customer_phone}</p>` : ''}
                          <p style="color:#4b5563;font-size:12px;line-height:1.5;margin:0;">
                            <strong>${t.shippingAddress}:</strong><br/>
                            ${order.shipping_address || 'N/A'}
                          </p>
                        </td>
                        <td width="50%" valign="top" style="${t.dir === 'rtl' ? 'padding-right:20px; border-right:1px solid #f3f4f6;' : 'padding-left:20px; border-left:1px solid #f3f4f6;'} text-align: ${t.alignLeft};">
                          <p style="color:#111625;font-size:14px;font-weight:bold;margin:0 0 4px 0;">${process.env.COMPANY_NAME || 'barigroup.net'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Vertreten durch: ${process.env.COMPANY_OWNER || 'BS Baristore'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">${process.env.COMPANY_ADDRESS || 'Zeppelinstraße 62, 52068 Aachen, Germany'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Telefon: ${process.env.COMPANY_PHONE || '+49 152524 11886'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">USt-IdNr.: ${process.env.COMPANY_VAT_ID || 'DE436103705'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">LUCID Reg.-Nr.: DE4769331655434</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 8px 0;">Email: ${process.env.COMPANY_EMAIL || 'info@barigroup.de'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0;">
                            <strong>${t.date}:</strong> ${dateStr}
                          </p>
                        </td>
                      </tr>
                    </table>

                    ${trackingHtml}
                    ${digitalBlocksHtml}

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-collapse: collapse;" dir="${t.dir}">
                      <thead>
                        <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                          <th align="${t.alignLeft}" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;">${t.product}</th>
                          <th align="center" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;width:60px;">${t.qty}</th>
                          <th align="${t.alignRight}" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;width:100px;">${t.price}</th>
                          <th align="${t.alignRight}" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;width:110px;">${t.total}</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Financial Summary -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;" dir="${t.dir}">
                      <tr>
                        <td width="${t.dir === 'rtl' ? '45%' : '55%'}"></td>
                        <td width="${t.dir === 'rtl' ? '55%' : '45%'}">
                          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;line-height:1.8;">
                            <tr>
                              <td style="padding:4px 0; text-align: ${t.alignLeft};">${t.subtotal}</td>
                              <td align="${t.alignRight}" style="font-family:monospace; ${t.alignRightStyle}">€${subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0; text-align: ${t.alignLeft};">${t.shippingHandling}</td>
                              <td align="${t.alignRight}" style="font-family:monospace; ${t.alignRightStyle}">${shipping === 0 ? t.complimentary : `€${shipping.toFixed(2)}`}</td>
                            </tr>
                            ${discount > 0 ? `
                            <tr style="color:#059669;font-weight:bold;">
                              <td style="padding:4px 0; text-align: ${t.alignLeft};">${t.couponDiscount.replace('{code}', order.coupon_code || 'N/A')}</td>
                              <td align="${t.alignRight}" style="font-family:monospace; ${t.alignRightStyle}">-€${discount.toFixed(2)}</td>
                            </tr>` : ''}
                            <tr>
                              <td style="padding:4px 0;font-size:11px;color:#9ca3af;font-style:italic; text-align: ${t.alignLeft};">${t.vatTaxIncluded}</td>
                              <td align="${t.alignRight}" style="font-size:11px;color:#9ca3af;font-family:monospace;font-style:italic; ${t.alignRightStyle}">€${(subtotal * 19 / 119).toFixed(2)}</td>
                            </tr>
                            <tr style="font-size:16px;color:#111625;font-weight:bold;border-top:1px solid #e5e7eb;">
                              <td style="padding:12px 0 0 0; text-align: ${t.alignLeft};">${t.grandTotal}</td>
                              <td align="${t.alignRight}" style="padding:12px 0 0 0;font-family:monospace;color:#e30613; ${t.alignRightStyle}">€${total.toFixed(2)}</td>
                            </tr>
                          </table>
                        </td>
                    </table>

                    <!-- Footer message -->
                    <hr style="border:none;border-top:1px solid #f3f4f6;margin:40px 0 24px 0;" />
                    <p style="color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;margin:0;" dir="${t.dir}">
                      ${t.thankYou}<br/>
                      ${t.supportText}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

export const sendAdminOrderNotificationEmail = async (order: any) => {
  const adminEmails = [
    process.env.COMPANY_EMAIL || 'service@barigroup.net',
    'info@baristyle.de'
  ];
  const invoiceNumber = `INV-2026-${order.id.substring(0, 6).toUpperCase()}`;

  const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('de-DE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : new Date().toLocaleDateString('de-DE');

  const total = parseFloat(order.total_amount);
  const shipping = parseFloat(order.shipping_amount);
  const discount = order.discount_amount ? parseFloat(order.discount_amount) : 0;
  const subtotal = total - shipping;

  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td align="left" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px; text-align: left;">
        <strong>${item.name}</strong>
        ${item.sku ? `<br/><span style="color: #9ca3af; font-size: 10px; font-family: monospace;">SKU: ${item.sku}</span>` : ''}
      </td>
      <td align="center" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px;">${item.quantity}</td>
      <td align="right" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px; text-align: right; font-family: monospace;">€${parseFloat(item.unit_price).toFixed(2)}</td>
      <td align="right" style="padding: 12px 8px; border-bottom: 1px solid #f3f4f6; color: #111625; font-size: 13px; text-align: right; font-family: monospace; font-weight: bold;">€${parseFloat(item.total_price).toFixed(2)}</td>
    </tr>
  `).join('');

  const frontendUrl = process.env.FRONTEND_URL || 'https://baristyle.de';

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: adminEmails.join(', '),
    subject: `🔔 New Order Received: ${invoiceNumber} (€${total.toFixed(2)})`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>New Order Notification</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
                <!-- Header -->
                <tr>
                  <td style="background:#111625;padding:32px 40px;color:#ffffff;text-align:center;">
                    <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">
                      BS <span style="color:#e30613;">Baristore</span>
                    </h1>
                    <p style="color:#e30613;font-size:14px;font-weight:bold;margin:8px 0 0;text-transform:uppercase;letter-spacing:1.5px;">New Order Received</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#111625;font-size:16px;font-weight:bold;margin:0 0 16px 0;">Hello Admin,</p>
                    <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
                      A new order has been successfully placed and paid for on the BS Baristore website. Here are the details of the order:
                    </p>

                    <!-- Order Metadata -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px; border-collapse: collapse;">
                      <tr>
                        <td width="50%" valign="top" style="padding-right:20px; text-align: left;">
                          <h3 style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Customer Details</h3>
                          <p style="color:#111625;font-size:14px;font-weight:bold;margin:0 0 4px 0;">${order.customer_name || 'Valued Customer'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Email: ${order.customer_email || 'N/A'}</p>
                          ${order.customer_phone ? `<p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Phone: ${order.customer_phone}</p>` : ''}
                          <p style="color:#4b5563;font-size:12px;line-height:1.5;margin:0;">
                            <strong>Shipping Address:</strong><br/>
                            ${order.shipping_address || 'N/A'}
                          </p>
                        </td>
                        <td width="50%" valign="top" style="padding-left:20px; border-left:1px solid #f3f4f6; text-align: left;">
                          <h3 style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;">Order Info</h3>
                          <p style="color:#111625;font-size:14px;font-weight:bold;margin:0 0 4px 0;">Order ID: ${order.id}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Invoice: ${invoiceNumber}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0 0 4px 0;">Order Type: ${order.order_type || 'Retail'}</p>
                          <p style="color:#4b5563;font-size:12px;margin:0;">
                            <strong>Order Date:</strong> ${dateStr}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-collapse: collapse;">
                      <thead>
                        <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                          <th align="left" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;text-align:left;">Product</th>
                          <th align="center" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;width:60px;">Qty</th>
                          <th align="right" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;width:100px;text-align:right;">Price</th>
                          <th align="right" style="padding:10px 8px;font-size:11px;font-weight:bold;color:#4b5563;text-transform:uppercase;letter-spacing:0.5px;width:110px;text-align:right;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Summary -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                      <tr>
                        <td width="55%"></td>
                        <td width="45%">
                          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563;line-height:1.8;">
                            <tr>
                              <td style="padding:4px 0; text-align: left;">Subtotal</td>
                              <td align="right" style="font-family:monospace; text-align: right;">€${subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td style="padding:4px 0; text-align: left;">Shipping</td>
                              <td align="right" style="font-family:monospace; text-align: right;">€${shipping.toFixed(2)}</td>
                            </tr>
                            ${discount > 0 ? `
                            <tr style="color:#059669;font-weight:bold;">
                              <td style="padding:4px 0; text-align: left;">Discount (${order.coupon_code || 'N/A'})</td>
                              <td align="right" style="font-family:monospace; text-align: right;">-€${discount.toFixed(2)}</td>
                            </tr>` : ''}
                            <tr style="font-size:16px;color:#111625;font-weight:bold;border-top:1px solid #e5e7eb;">
                              <td style="padding:12px 0 0 0; text-align: left;">Grand Total</td>
                              <td align="right" style="padding:12px 0 0 0;font-family:monospace;color:#e30613;text-align: right;">€${total.toFixed(2)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Button -->
                    <div style="text-align:center;margin:40px 0 20px 0;">
                      <a href="${frontendUrl}/admin"
                        style="display:inline-block;background:#e30613;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
                        Manage Orders in ERP
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};

// --- B2B Application Email to Admin ---
export const sendB2BApplicationEmail = async (info: any) => {
  const adminUrl = (process.env.FRONTEND_URL || 'https://baristyle.de') + '/admin';
  const adminEmail = process.env.SMTP_USER || 'info@baristyle.de';
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: adminEmail,
    subject: `Neue B2B-HÃ¤ndleranmeldung - ${info.companyName}`,
    html: `<html><body style="font-family:Arial;background:#f4f5f7;padding:40px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#1a1f2c;padding:28px 36px;">
          <span style="background:#d40026;color:#fff;font-weight:900;font-size:18px;padding:5px 12px;border-radius:5px;">BS</span>
          <span style="color:#fff;font-size:18px;font-weight:800;margin-left:10px;">Baristore Admin</span>
        </div>
        <div style="padding:28px 36px;">
          <h2 style="color:#1a1f2c;margin:0 0 20px;">Neuer B2B-HÃ¤ndlerantrag</h2>
          <table style="width:100%;border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;font-size:13px;">
            <tr style="background:#f9fafb;"><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;"><b>Kontaktperson</b></td><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">${info.applicantName} - ${info.applicantEmail}</td></tr>
            <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;"><b>Firma</b></td><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">${info.companyName}</td></tr>
            <tr style="background:#fef9ef;"><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;"><b>USt-IdNr.</b></td><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#d40026;font-family:monospace;font-weight:700;">${info.vatNumber || '-'}</td></tr>
            <tr><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;"><b>Telefon</b></td><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">${info.phone || '-'}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;"><b>Unternehmensart</b></td><td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;">${info.businessType || '-'}</td></tr>
            <tr><td style="padding:12px 16px;"><b>Website</b></td><td style="padding:12px 16px;">${info.websiteUrl || '-'}</td></tr>
          </table>
          <div style="margin-top:24px;text-align:center;">
            <a href="${adminUrl}" style="background:#1a1f2c;color:#fff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:700;display:inline-block;">Admin-Panel Ã¶ffnen & Konto genehmigen</a>
          </div>
        </div>
      </div>
    </body></html>`,
  });
};

// --- B2B Pending Confirmation Email to Merchant ---
export const sendB2BPendingEmail = async (info: any) => {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: info.applicantEmail,
    subject: 'Ihre B2B-Anfrage wurde erhalten - BS Baristore',
    html: `<html><body style="font-family:Arial;background:#f4f5f7;padding:40px;">
      <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#1a1f2c;padding:28px;text-align:center;">
          <span style="background:#d40026;color:#fff;font-weight:900;font-size:20px;padding:5px 14px;border-radius:5px;">BS</span>
          <span style="color:#fff;font-size:20px;font-weight:800;margin-left:10px;">Baristore</span>
        </div>
        <div style="padding:36px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">â³</div>
          <h2 style="color:#1a1f2c;">Antrag erhalten!</h2>
          <p style="color:#6b7280;line-height:1.7;">Vielen Dank, <b>${info.applicantName}</b>.<br/>Ihr B2B-Konto fÃ¼r <b>${info.companyName}</b> wird derzeit geprÃ¼ft.</p>
        </div>
        <div style="padding:0 36px 28px;">
          <div style="background:#fef9ef;border:1px solid #f59e0b;border-radius:8px;padding:18px;">
            <b style="color:#92400e;font-size:12px;">Was passiert als nÃ¤chstes?</b>
            <ul style="color:#78350f;font-size:13px;line-height:2.2;padding-left:16px;margin:8px 0 0;">
              <li>Unser Team prÃ¼ft Ihre Angaben</li>
              <li>Nach Genehmigung erhalten Sie B2B-GroÃŸhandelspreise</li>
              <li>Sie werden per E-Mail informiert</li>
            </ul>
          </div>
        </div>
        <div style="padding:0 36px 32px;text-align:center;">
          <p style="color:#6b7280;font-size:13px;">Fragen? <a href="mailto:service@barigroup.net" style="color:#d40026;font-weight:700;">service@barigroup.net</a></p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">BS Baristore â€¢ Zeppelinstraße 62, 52068 Aachen</p>
        </div>
      </div>
    </body></html>`,
  });
};

// --- B2B Approval Confirmation Email to Merchant ---
// --- B2B Approval Confirmation Email to Merchant ---
export const sendB2BApprovedEmail = async (info: any) => {
  const loginUrl = (process.env.FRONTEND_URL || 'https://baristyle.de') + '/login';
  const locale = info.locale || 'de';

  const subjects: Record<string, string> = {
    de: 'Ihr B2B-Konto wurde freigeschaltet - BS Baristore',
    en: 'Your B2B Account Has Been Approved - BS Baristore',
    ar: 'تمت الموافقة على حسابك التجاري B2B - BS Baristore',
    fr: 'Votre compte B2B a été activé - BS Baristore',
    nl: 'Uw B2B-account is geactiveerd - BS Baristore'
  };

  const titles: Record<string, string> = {
    de: 'Konto freigeschaltet!',
    en: 'Account Approved!',
    ar: 'تم تفعيل الحساب التجاري!',
    fr: 'Compte activé !',
    nl: 'Account geactiveerd!'
  };

  const greetings: Record<string, string> = {
    de: `Hallo <b>${info.applicantName}</b>,<br/>Ihr B2B-Konto für <b>${info.companyName}</b> wurde erfolgreich genehmigt.`,
    en: `Hello <b>${info.applicantName}</b>,<br/>Your B2B account for <b>${info.companyName}</b> has been successfully approved.`,
    ar: `مرحباً <b>${info.applicantName}</b>،<br/>تمت الموافقة على حسابك التجاري B2B لشركة <b>${info.companyName}</b> بنجاح.`,
    fr: `Bonjour <b>${info.applicantName}</b>,<br/>Votre compte B2B pour <b>${info.companyName}</b> a été approuvé avec succès.`,
    nl: `Hallo <b>${info.applicantName}</b>,<br/>Uw B2B-account voor <b>${info.companyName}</b> is succesvol goedgekeurd.`
  };

  const benefitsTitle: Record<string, string> = {
    de: 'Ihre B2B-Vorteile sind jetzt aktiv:',
    en: 'Your B2B benefits are now active:',
    ar: 'مزايا حسابك التجاري نشطة الآن:',
    fr: 'Vos avantages B2B sont désormais actifs :',
    nl: 'Uw B2B-voordelen zijn nu actief:'
  };

  const benefitList: Record<string, string[]> = {
    de: [
      'Exklusive Großhandelspreise sichtbar bei jedem Produkt',
      'Möglichkeit zur Bestellung auf Rechnung / DHL-Versand',
      'Priorisierter Kundensupport'
    ],
    en: [
      'Exclusive wholesale pricing visible on every product',
      'Option to order on invoice / fast DHL shipping',
      'Priority customer support'
    ],
    ar: [
      'أسعار جملة حصرية تظهر على كل منتج تلقائياً',
      'إمكانية الشراء بنظام الفواتير الآجلة وشحن DHL سريع',
      'دعم فني مخصص وذو أولوية للشركات'
    ],
    fr: [
      'Prix de gros exclusifs visibles sur chaque produit',
      'Possibilité de commander sur facture / expédition DHL rapide',
      'Support client prioritaire'
    ],
    nl: [
      'Exclusieve groothandelsprijzen zichtbaar bij elk product',
      'Mogelijkheid om op factuur te bestellen / snelle DHL-verzending',
      'Prioritaire klantenservice'
    ]
  };

  const btnText: Record<string, string> = {
    de: 'Jetzt einloggen & einkaufen',
    en: 'Log in & Shop Now',
    ar: 'تسجيل الدخول والتسوق الآن',
    fr: 'Se connecter & Acheter',
    nl: 'Nu inloggen & winkelen'
  };

  const footerText: Record<string, string> = {
    de: 'Fragen?',
    en: 'Questions?',
    ar: 'لديك استفسار؟',
    fr: 'Des questions ?',
    nl: 'Vragen?'
  };

  const currentSubject = subjects[locale] || subjects.de;
  const currentTitle = titles[locale] || titles.de;
  const currentGreeting = greetings[locale] || greetings.de;
  const currentBenefitsTitle = benefitsTitle[locale] || benefitsTitle.de;
  const currentBenefits = benefitList[locale] || benefitList.de;
  const currentBtn = btnText[locale] || btnText.de;
  const currentFooter = footerText[locale] || footerText.de;

  const isRtl = locale === 'ar';

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: info.applicantEmail,
    subject: currentSubject,
    html: `<html><body style="font-family:Arial;background:#f4f5f7;padding:40px;">
      <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:${isRtl ? 'right' : 'left'};" dir="${isRtl ? 'rtl' : 'ltr'}">
        <div style="background:#1a1f2c;padding:28px;text-align:center;">
          <span style="background:#d40026;color:#fff;font-weight:900;font-size:20px;padding:5px 14px;border-radius:5px;">BS</span>
          <span style="color:#fff;font-size:20px;font-weight:800;margin-left:10px;">Baristore</span>
        </div>
        <div style="padding:36px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🎉</div>
          <h2 style="color:#10b981;margin:0 0 10px;">${currentTitle}</h2>
          <p style="color:#6b7280;line-height:1.7;margin:0;">${currentGreeting}</p>
        </div>
        <div style="padding:0 36px 28px;">
          <div style="background:#f0fdf4;border:1px solid #10b981;border-radius:8px;padding:18px;text-align:${isRtl ? 'right' : 'left'};">
            <b style="color:#0f5132;font-size:13px;">${currentBenefitsTitle}</b>
            <ul style="color:#0f5132;font-size:13px;line-height:2.2;padding-${isRtl ? 'right' : 'left'}:16px;margin:8px 0 0;">
              ${currentBenefits.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>
          <div style="margin-top:24px;text-align:center;">
            <a href="${loginUrl}" style="background:#10b981;color:#fff;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:700;display:inline-block;">${currentBtn}</a>
          </div>
        </div>
        <div style="padding:0 36px 32px;text-align:center;">
          <p style="color:#6b7280;font-size:13px;">${currentFooter} <a href="mailto:service@barigroup.net" style="color:#d40026;font-weight:700;">service@barigroup.net</a></p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">BS Baristore • Zeppelinstraße 62, 52068 Aachen</p>
        </div>
      </div>
    </body></html>`,
  });
};


// --- Email Verification Link Email ---
export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  const verifyUrl = (process.env.FRONTEND_URL || 'https://baristyle.de') + `/verify-email?token=${token}`;
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: email,
    subject: 'BestÃ¤tigen Sie Ihre E-Mail-Adresse - BS Baristore',
    html: `<html><body style="font-family:Arial;background:#f4f5f7;padding:40px;">
      <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:#1a1f2c;padding:28px;text-align:center;">
          <span style="background:#d40026;color:#fff;font-weight:900;font-size:20px;padding:5px 14px;border-radius:5px;">BS</span>
          <span style="color:#fff;font-size:20px;font-weight:800;margin-left:10px;">Baristore</span>
        </div>
        <div style="padding:36px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">âœ‰ï¸</div>
          <div style="font-size:48px;margin-bottom:16px;">âœ‰ï¸ </div>
          <h2 style="color:#1a1f2c;">E-Mail-Adresse bestÃ¤tigen</h2>
          <p style="color:#6b7280;line-height:1.7;">Hallo <b>${name}</b>,<br/>vielen Dank fÃ¼r Ihre Registrierung bei BS Baristore. Bitte bestÃ¤tigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.</p>
        </div>
        <div style="padding:0 36px 32px;text-align:center;">
          <a href="${verifyUrl}" style="background:#d40026;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;display:inline-block;font-size:14px;box-shadow:0 4px 12px rgba(212,0,38,0.2);">E-Mail-Adresse bestÃ¤tigen</a>
          <p style="color:#9ca3af;font-size:11px;margin-top:24px;line-height:1.5;">Oder kopieren Sie diesen Link in Ihren Browser:<br/><a href="${verifyUrl}" style="color:#d40026;word-break:break-all;">${verifyUrl}</a></p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">BS Baristore â€¢ Zeppelinstraße 62, 52068 Aachen</p>
        </div>
      </div>
    </body></html>`,
  });
};

export const sendNewsletterCampaignEmail = async (
  toEmail: string,
  subject: string,
  customMessage: string | null,
  products: any[],
  locale: string = 'de',
  isB2B: boolean = false,
  campaignId?: string,
  subscriberId?: string,
  imageUrl?: string | null,
  template: string = 'STANDARD'
) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://baristyle.de';

  // Resolve correct API base url for production environment
  let backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
    if (frontendUrl.includes('baristyle.de') || frontendUrl.includes('baristyle.eu') || frontendUrl.includes('baristore.de')) {
      backendUrl = 'https://apibaristyle.eu';
    }
  }

  // Render products HTML
  let productsHtml = '';
  if (products && products.length > 0) {
    productsHtml = `
      <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:24px;">
        <h3 style="color:#111625;font-size:14px;font-weight:700;margin:0 0 16px;text-align:center;text-transform:uppercase;letter-spacing:1px;">
          ${locale === 'ar' ? 'أحدث العطور والمنتجات الحصرية' : locale === 'fr' ? 'Nos Nouveautés' : locale === 'nl' ? 'Onze Nieuwe Producten' : 'Unsere Produkt-Highlights'}
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-spacing: 16px; border-collapse: separate; margin: 0 auto; max-width: 480px;">
    `;

    // Group products in 2-column layout rows
    for (let i = 0; i < products.length; i += 2) {
      productsHtml += `<tr>`;
      for (let j = i; j < i + 2; j++) {
        if (j < products.length) {
          const p = products[j];
          let pName = 'Fragrance';
          if (p.translations) {
            try {
              const trans = typeof p.translations === 'string' ? JSON.parse(p.translations) : p.translations;
              pName = trans[locale] || trans['de'] || trans['en'] || 'Fragrance';
            } catch {
              pName = p.translations[locale] || p.translations['de'] || p.translations['en'] || 'Fragrance';
            }
          }
          const pImg = p.image_url
            ? (p.image_url.startsWith('http') ? p.image_url : `${backendUrl}${p.image_url}`)
            : 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=400';
          const pLink = `${frontendUrl}/shop/${p.sku || p.id}`;
          const price = isB2B ? (p.b2b_price || p.retail_price || p.sales_price_with_tax || p.price || 0) : (p.retail_price || p.sales_price_with_tax || p.price || 0);

          productsHtml += `
            <td width="50%" align="center" valign="top" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:12px;text-align:center;">
              <a href="${pLink}" style="text-decoration:none;">
                <img src="${pImg}" alt="${pName}" style="width:120px;height:120px;object-fit:cover;border-radius:6px;display:block;margin:0 auto 8px;" />
              </a>
              <div style="min-height:36px;margin-bottom:6px;">
                <a href="${pLink}" style="color:#111625;font-size:12px;font-weight:700;text-decoration:none;line-height:1.3;display:block;">
                  ${pName}
                </a>
              </div>
              <p style="color:#d40026;font-size:14px;font-weight:700;margin:0 0 10px;">
                €${Number(price).toFixed(2)}${isB2B ? ' <span style="font-size:10px;color:#d40026;font-weight:bold;">(B2B)</span>' : ''}
              </p>
              <a href="${pLink}" style="display:inline-block;background:#111625;color:#ffffff;text-decoration:none;padding:6px 12px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;">
                ${locale === 'ar' ? 'تفاصيل المنتج' : locale === 'fr' ? 'Détails' : locale === 'nl' ? 'Bekijken' : 'Ansehen'}
              </a>
            </td>
          `;
        } else {
          productsHtml += `<td width="50%">&nbsp;</td>`;
        }
      }
      productsHtml += `</tr>`;
    }

    productsHtml += `
        </table>
      </div>
    `;
  }

  // Render main body HTML based on template type
  let emailBodyHtml = '';
  if (template === 'IMAGE_ONLY') {
    emailBodyHtml = `
      <!-- Body -->
      <tr>
        <td style="padding: 0; text-align: center;">
          ${imageUrl ? `
            <a href="${frontendUrl}/shop" style="display: block;">
              <img src="${imageUrl}" alt="Campaign Flyer" style="width: 100%; max-width: 560px; height: auto; display: block; margin: 0 auto; border: 0;" />
            </a>
          ` : `
            <div style="padding: 40px; color: #d40026; font-weight: bold; text-align: center;">
              [Kein Bild angegeben / No Image Provided]
            </div>
          `}
        </td>
      </tr>
    `;
  } else if (template === 'PRODUCTS_ONLY') {
    emailBodyHtml = `
      <!-- Header -->
      <tr>
        <td style="background:#111625;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">
            BS <span style="color:#e30613;">Baristore</span>
          </h1>
          <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">
            ${locale === 'ar' ? 'المنصة العالمية لتجارة الجملة والتجزئة' : 'Universal Wholesale & Retail'}
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:40px; text-align: ${locale === 'ar' ? 'right' : 'left'};">
          ${productsHtml}
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;" />
          <div style="text-align:center;">
            <a href="${frontendUrl}/shop" style="display:inline-block;background:#d40026;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
              ${locale === 'ar' ? 'زيارة المتجر الإلكتروني' : locale === 'fr' ? 'Visiter la boutique' : locale === 'nl' ? 'Bezoek de winkel' : 'Onlineshop besuchen'}
            </a>
          </div>
        </td>
      </tr>
    `;
  } else if (template === 'TEXT_ONLY') {
    emailBodyHtml = `
      <!-- Header -->
      <tr>
        <td style="background:#111625;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">
            BS <span style="color:#e30613;">Baristore</span>
          </h1>
          <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">
            ${locale === 'ar' ? 'المنصة العالمية لتجارة الجملة والتجزئة' : 'Universal Wholesale & Retail'}
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:40px; text-align: ${locale === 'ar' ? 'right' : 'left'};">
          ${customMessage ? `<div style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:24px;white-space:pre-wrap;">${customMessage}</div>` : ''}
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;" />
          <div style="text-align:center;">
            <a href="${frontendUrl}/shop" style="display:inline-block;background:#d40026;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
              ${locale === 'ar' ? 'زيارة المتجر الإلكتروني' : locale === 'fr' ? 'Visiter la boutique' : locale === 'nl' ? 'Bezoek de winkel' : 'Onlineshop besuchen'}
            </a>
          </div>
        </td>
      </tr>
    `;
  } else {
    // STANDARD / DEFAULT
    emailBodyHtml = `
      <!-- Header -->
      <tr>
        <td style="background:#111625;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">
            BS <span style="color:#e30613;">Baristore</span>
          </h1>
          <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">
            ${locale === 'ar' ? 'المنصة العالمية لتجارة الجملة والتجزئة' : 'Universal Wholesale & Retail'}
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:40px; text-align: ${locale === 'ar' ? 'right' : 'left'};">
          ${imageUrl ? `<div style="margin-bottom:24px; text-align:center;"><img src="${imageUrl}" alt="Promo Banner" style="width:100%; max-width:480px; height:auto; border-radius:8px; display:inline-block;" /></div>` : ''}
          ${customMessage ? `<div style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:24px;white-space:pre-wrap;">${customMessage}</div>` : ''}
          ${productsHtml}
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0;" />
          <div style="text-align:center;">
            <a href="${frontendUrl}/shop" style="display:inline-block;background:#d40026;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
              ${locale === 'ar' ? 'زيارة المتجر الإلكتروني' : locale === 'fr' ? 'Visiter la boutique' : locale === 'nl' ? 'Bezoek de winkel' : 'Onlineshop besuchen'}
            </a>
          </div>
        </td>
      </tr>
    `;
  }

  const optOutLink = `${backendUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(toEmail)}&campaignId=${campaignId || ''}`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>',
    to: toEmail,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html lang="${locale}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${subject}</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                
                ${emailBodyHtml}

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f3f4f6;">
                    <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;">
                      BS Baristore • Zeppelinstraße 62, 52068 Aachen
                    </p>
                    <p style="margin:0;font-size:10px;color:#9ca3af;">
                      ${locale === 'ar' ? 'إذا كنت لا ترغب في تلقي هذه الرسائل، يمكنك ' : 'Möchten Sie diese E-Mails nicht mehr erhalten? '}
                      <a href="${optOutLink}" style="color:#d40026;text-decoration:underline;">
                        ${locale === 'ar' ? 'إلغاء الاشتراك هنا' : 'Hier abbestellen'}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
              ${campaignId && subscriberId ? `
                <img src="${backendUrl}/api/newsletter/track-open/${campaignId}/${subscriberId}" width="1" height="1" style="display:none;width:1px;height:1px;" alt="" />
              ` : ''}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  });
};

export const sendReturnRequestEmail = async (
  customerEmail: string,
  orderNumber: string,
  reason: string,
  notes: string,
  refCode: string
) => {
  const adminEmail = process.env.SERVICE_EMAIL || process.env.SMTP_USER || 'service@barigroup.net';
  const fromEmail = process.env.SMTP_FROM || 'BS Baristore <noreply@baristyle.de>';

  const customerHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head><meta charset="UTF-8" /></head>
    <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; border: 1px solid #eee;">
        <h2 style="color: #0F8A5F; margin-top: 0;">Retourenanfrage eingegangen / Return Request Received</h2>
        <p>Vielen Dank. Ihre Retourenanfrage wurde erfolgreich im BS Baristore System registriert.</p>
        <div style="background: #f4f8f6; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d0e7de;">
          <p style="margin: 5px 0;"><strong>Referenznummer:</strong> ${refCode}</p>
          <p style="margin: 5px 0;"><strong>Bestellnummer:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Rückgabegrund:</strong> ${reason}</p>
          ${notes ? `<p style="margin: 5px 0;"><strong>Anmerkungen:</strong> ${notes}</p>` : ''}
        </div>
        <p>Unser Support-Team prüft Ihre Anfrage und sendet Ihnen in Kürze das kostenlose Retourenlabel zu.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">BS Baristore • Zeppelinstraße 62, 52068 Aachen • service@barigroup.net</p>
      </div>
    </body>
    </html>
  `;

  await getTransporter().sendMail({
    from: fromEmail,
    to: customerEmail,
    subject: `[BS Baristore] Retourenbestätigung - Order ${orderNumber} (${refCode})`,
    html: customerHtml,
  }).catch(err => console.error('Failed to send return confirmation to customer:', err));

  const adminHtml = `
    <div style="font-family: Arial; padding: 20px;">
      <h2 style="color: #d40026;">Neue Retourenanfrage erhalten!</h2>
      <p><strong>Referenz:</strong> ${refCode}</p>
      <p><strong>Kunden E-Mail:</strong> ${customerEmail}</p>
      <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
      <p><strong>Grund:</strong> ${reason}</p>
      <p><strong>Anmerkungen:</strong> ${notes || 'Keine'}</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: fromEmail,
    to: adminEmail,
    subject: `🚨 Retourenanfrage: Order ${orderNumber} (${customerEmail})`,
    html: adminHtml,
  }).catch(err => console.error('Failed to send return notification to admin:', err));
};


