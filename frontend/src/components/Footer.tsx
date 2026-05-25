"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, X, Phone, Shield, FileText } from 'lucide-react';
import { Locale } from '../utils/i18n';

const footerTranslations = {
  de: {
    desc: "BariStyle ist der offizielle Vertriebspartner für die renommierten Marken AOUI, REEF und OSMA in Deutschland.",
    col1_title: "BariStyle Shop",
    col1_affiliate: "Affiliate Portal",
    col1_account: "Mein Konto",
    col1_wishlist: "Wunschliste",
    col1_cart: "Warenkorb",
    col1_about: "Über uns",
    col1_wholesale: "Parfüm Großhandel",
    
    col2_title: "Arabische Marken",
    
    col3_title: "Wichtige Seiten",
    col3_membership: "Mitgliedschaftsvereinbarung",
    col3_privacy: "Datenschutzerklärung",
    col3_certs: "Zertifikate & Lizenzen",
    col3_withdrawal: "Widerrufsrecht",
    col3_contact: "Kontaktdaten",
    col3_imprint: "Impressum",
    col3_terms: "AGB",
    col3_cookies: "Cookie-Richtlinie (EU)",
    
    col4_title: "Newsletter",
    col4_desc: "Melden Sie sich jetzt an und erhalten Sie exklusive Angebote, Rabattcodes und Neuigkeiten zu unseren Düften direkt in Ihr Postfach.",
    col4_placeholder: "Ihre E-Mail-Adresse",
    col4_btn: "Abonnieren",
    col4_success: "Vielen Dank für Ihre Anmeldung!",
    
    copyright: "© 2026 barigroup.net. Alle Rechte vorbehalten."
  },
  en: {
    desc: "BariStyle is the official distributor for the renowned brands AOUI, REEF, and OSMA in Germany.",
    col1_title: "BariStyle Shop",
    col1_affiliate: "Affiliate Portal",
    col1_account: "My Account",
    col1_wishlist: "Wishlist",
    col1_cart: "Shopping Cart",
    col1_about: "About Us",
    col1_wholesale: "Perfume Wholesale",
    
    col2_title: "Arabian Brands",
    
    col3_title: "Important Pages",
    col3_membership: "Membership Agreement",
    col3_privacy: "Privacy Policy",
    col3_certs: "Certificates & Licenses",
    col3_withdrawal: "Right of Withdrawal",
    col3_contact: "Contact Details",
    col3_imprint: "Imprint / Impressum",
    col3_terms: "Terms & Conditions",
    col3_cookies: "Cookie Policy (EU)",
    
    col4_title: "Newsletter",
    col4_desc: "Subscribe now and receive exclusive offers, discount codes, and news about our fragrances directly to your inbox.",
    col4_placeholder: "Your email address",
    col4_btn: "Subscribe",
    col4_success: "Thank you for subscribing!",
    
    copyright: "© 2026 barigroup.net. All rights reserved."
  },
  ar: {
    desc: "BariStyle هو الموزع الرسمي المعتمد للعطور الفاخرة المرموقة من الماركات العالمية الشهيرة AOUI و REEF و OSMA في ألمانيا وأوروبا.",
    col1_title: "متجر باري ستايل",
    col1_affiliate: "بوابة الشركاء (Affiliate)",
    col1_account: "حسابي الشخصي",
    col1_wishlist: "قائمة الأمنيات",
    col1_cart: "حقيبة التسوق",
    col1_about: "من نحن",
    col1_wholesale: "تجارة الجملة للعطور",
    
    col2_title: "ماركات عربية فاخرة",
    
    col3_title: "صفحات هامة",
    col3_membership: "اتفاقية العضوية",
    col3_privacy: "سياسة الخصوصية",
    col3_certs: "الشهادات والتراخيص",
    col3_withdrawal: "حق الإلغاء والاسترجاع",
    col3_contact: "بيانات الاتصال",
    col3_imprint: "البيانات القانونية (Impressum)",
    col3_terms: "الشروط والأحكام (AGB)",
    col3_cookies: "سياسة الكوكيز (الاتحاد الأوروبي)",
    
    col4_title: "النشرة البريدية",
    col4_desc: "اشترك معنا الآن لتصلك أقوى العروض الحصرية، وأكواد الخصم المميزة، وأحدث أخبار عطورنا النادرة مباشرة إلى بريدك الإلكتروني.",
    col4_placeholder: "عنوان بريدك الإلكتروني",
    col4_btn: "اشترك الآن",
    col4_success: "شكرًا لك على اشتراكك في النشرة!",
    
    copyright: "جميع الحقوق محفوظة © 2026 لمجموعة barigroup.net."
  },
  fr: {
    desc: "BariStyle est le distributeur officiel des prestigieuses marques AOUI, REEF et OSMA en Allemagne.",
    col1_title: "Boutique BariStyle",
    col1_affiliate: "Portail d'Affiliation",
    col1_account: "Mon Compte",
    col1_wishlist: "Liste de Souhaits",
    col1_cart: "Panier",
    col1_about: "À propos de nous",
    col1_wholesale: "Vente en gros de parfums",
    
    col2_title: "Marques Arabes",
    
    col3_title: "Pages Importantes",
    col3_membership: "Accord de Membre",
    col3_privacy: "Politique de Confidentialité",
    col3_certs: "Certificats & Licences",
    col3_withdrawal: "Droit de Rétractation",
    col3_contact: "Coordonnées de Contact",
    col3_imprint: "Mentions Légales (Imprint)",
    col3_terms: "Conditions Générales",
    col3_cookies: "Politique relative aux cookies (UE)",
    
    col4_title: "Newsletter",
    col4_desc: "Abonnez-vous dès maintenant et recevez des offres exclusives, des codes de réduction et des nouveautés sur nos parfums directement dans votre boîte de réception.",
    col4_placeholder: "Votre adresse e-mail",
    col4_btn: "S'abonner",
    col4_success: "Merci pour votre abonnement!",
    
    copyright: "© 2026 barigroup.net. Tous droits réservés."
  },
  nl: {
    desc: "BariStyle is de officiële distributeur voor de gerenommeerde merken AOUI, REEF en OSMA in Duitsland.",
    col1_title: "BariStyle Shop",
    col1_affiliate: "Affiliate Portaal",
    col1_account: "Mijn Account",
    col1_wishlist: "Verlanglijst",
    col1_cart: "Winkelwagen",
    col1_about: "Over ons",
    col1_wholesale: "Parfum Groothandel",
    
    col2_title: "Arabische Merken",
    
    col3_title: "Belangrijke Pagina's",
    col3_membership: "Lidmaatschapsovereenkomst",
    col3_privacy: "Privacybeleid",
    col3_certs: "Certificaten & Licenties",
    col3_withdrawal: "Herroepingsrecht",
    col3_contact: "Contactgegevens",
    col3_imprint: "Colofon / Impressum",
    col3_terms: "Algemene Voorwaarden",
    col3_cookies: "Cookiebeleid (EU)",
    
    col4_title: "Nieuwsbrief",
    col4_desc: "Meld u nu aan en ontvang exclusieve aanbiedingen, kortingscodes en nieuws over onze geuren rechtstreeks in uw inbox.",
    col4_placeholder: "Uw e-mailadres",
    col4_btn: "Aanmelden",
    col4_success: "Bedankt voor uw aanmelding!",
    
    copyright: "© 2026 barigroup.net. Alle rechten voorbehouden."
  }
};

const impressumDetails = {
  de: {
    title: "Impressum (Angaben gemäß § 5 TMG)",
    content: `
      <div class="space-y-4 text-stone-800 text-sm leading-relaxed" dir="ltr">
        <div>
          <p class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">barigroup.net</p>
          <p>Vertreten durch: <strong>Kamal Abdalbary</strong></p>
          <p>Zeppelinstraße 62</p>
          <p>52068 Aachen, Deutschland</p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Kontakt</p>
          <p>Telefon: <strong>+49 152524 11886</strong></p>
          <p>E-Mail: <strong>service@barigroup.net</strong></p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Steuernummer</p>
          <p>201/5000/8736</p>
        </div>
        <div class="pt-2 border-t border-stone-100">
          <p class="font-bold text-stone-900 mb-1">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</p>
          <p>Kamal Abdalbary, Zeppelinstraße 62, 52068 Aachen</p>
        </div>
      </div>
    `
  },
  en: {
    title: "Imprint / Impressum (According to § 5 TMG)",
    content: `
      <div class="space-y-4 text-stone-800 text-sm leading-relaxed" dir="ltr">
        <div>
          <p class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">barigroup.net</p>
          <p>Represented by: <strong>Kamal Abdalbary</strong></p>
          <p>Zeppelinstrasse 62</p>
          <p>52068 Aachen, Germany</p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Contact</p>
          <p>Phone: <strong>+49 152524 11886</strong></p>
          <p>Email: <strong>service@barigroup.net</strong></p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Tax Identification Number</p>
          <p>201/5000/8736</p>
        </div>
        <div class="pt-2 border-t border-stone-100">
          <p class="font-bold text-stone-900 mb-1">Responsible for content according to § 55 Abs. 2 RStV:</p>
          <p>Kamal Abdalbary, Zeppelinstrasse 62, 52068 Aachen</p>
        </div>
      </div>
    `
  },
  ar: {
    title: "البيانات القانونية (Impressum - § 5 TMG)",
    content: `
      <div class="space-y-4 text-stone-800 text-sm leading-relaxed text-right" dir="rtl">
        <div>
          <p class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">مجموعة barigroup.net</p>
          <p>الرئيس التنفيذي والممثل القانوني: <strong>كمال عبد الباري (Kamal Abdalbary)</strong></p>
          <p>العنوان: Zeppelinstraße 62</p>
          <p>الرمز البريدي: 52068 مدينة آخن (Aachen)، ألمانيا (Deutschland)</p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">معلومات الاتصال</p>
          <p>الهاتف: <strong>11886 152524 49+</strong></p>
          <p>البريد الإلكتروني: <strong>service@barigroup.net</strong></p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">الرقم الضريبي (Steuernummer)</p>
          <p>201/5000/8736</p>
        </div>
        <div class="pt-2 border-t border-stone-100">
          <p class="font-bold text-stone-900 mb-1">المسؤول عن المحتوى بموجب الفقرة 2 من المادة 55 من قانون البث والإعلام الألماني (RStV):</p>
          <p>كمال عبد الباري، Zeppelinstraße 62, 52068 Aachen</p>
        </div>
      </div>
    `
  },
  fr: {
    title: "Mentions Légales (Impressum selon § 5 TMG)",
    content: `
      <div class="space-y-4 text-stone-800 text-sm leading-relaxed" dir="ltr">
        <div>
          <p class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">barigroup.net</p>
          <p>Représenté par : <strong>Kamal Abdalbary</strong></p>
          <p>Zeppelinstrasse 62</p>
          <p>52068 Aachen, Allemagne</p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Contact</p>
          <p>Téléphone : <strong>+49 152524 11886</strong></p>
          <p>E-mail : <strong>service@barigroup.net</strong></p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Numéro d'identification fiscale</p>
          <p>201/5000/8736</p>
        </div>
        <div class="pt-2 border-t border-stone-100">
          <p class="font-bold text-stone-900 mb-1">Responsable du contenu selon le § 55 Abs. 2 RStV :</p>
          <p>Kamal Abdalbary, Zeppelinstrasse 62, 52068 Aachen</p>
        </div>
      </div>
    `
  },
  nl: {
    title: "Colofon / Impressum (Volgens § 5 TMG)",
    content: `
      <div class="space-y-4 text-stone-800 text-sm leading-relaxed" dir="ltr">
        <div>
          <p class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">barigroup.net</p>
          <p>Vertegenwoordigd door: <strong>Kamal Abdalbary</strong></p>
          <p>Zeppelinstrasse 62</p>
          <p>52068 Aachen, Duitsland</p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Contact</p>
          <p>Telefoon: <strong>+49 152524 11886</strong></p>
          <p>E-mail: <strong>service@barigroup.net</strong></p>
        </div>
        <div>
          <p class="font-bold text-stone-900 border-b border-stone-100 pb-1 mb-1">Belastingnummer</p>
          <p>201/5000/8736</p>
        </div>
        <div class="pt-2 border-t border-stone-100">
          <p class="font-bold text-stone-900 mb-1">Verantwoordelijk voor de inhoud volgens § 55 Abs. 2 RStV:</p>
          <p>Kamal Abdalbary, Zeppelinstrasse 62, 52068 Aachen</p>
        </div>
      </div>
    `
  }
};

const agbDetails = {
  de: {
    title: "Allgemeine Geschäftsbedingungen (AGB)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Geltungsbereich und Anbieter</h4>
          <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen, die Kunden über den Online-Shop <strong>BariStyle</strong> der <strong>barigroup.net</strong> (Inhaber: Kamal Abdalbary, Zeppelinstraße 62, 52068 Aachen, Deutschland) tätigen.</p>
        </div>
        
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. Vertragspartner und Vertragsschluss</h4>
          <p>Der Kaufvertrag kommt zustande mit <strong>barigroup.net (Inhaber: Kamal Abdalbary)</strong>.</p>
          <p class="mt-2">Mit der Einstellung der Produkte in den Online-Shop geben wir ein verbindliches Angebot zum Vertragsschluss über diese Artikel ab. Der Vertrag kommt zustande, indem Sie durch Anklicken des Bestellbuttons das Angebot über die im Warenkorb enthaltenen Waren annehmen. Unmittelbar nach dem Absenden der Bestellung erhalten Sie eine Bestätigung per E-Mail.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. Preise und Versandkosten</h4>
          <p>Alle im Online-Shop angegebenen Preise sind Endpreise und enthalten die gesetzliche deutsche Mehrwertsteuer. Zusätzlich zu den angegebenen Preisen berechnen wir für die Lieferung Versandkosten. Die genauen Versandkosten werden Ihnen auf den Produktseiten, im Warenkorbsystem und auf der Bestellseite nochmals deutlich mitgeteilt.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. Lieferbedingungen</h4>
          <p>Wir liefern ausschließlich im Versandweg. Eine Selbstabholung der Ware vor Ort ist leider aus logistischen Gründen nicht möglich. Wir liefern nicht an Packstationen.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Bezahlung</h4>
          <p>In unserem Shop stehen Ihnen folgende Zahlungsarten zur Verfügung:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Kreditkarte:</strong> Die Belastung Ihrer Kreditkarte erfolgt mit Abschluss der Bestellung.</li>
            <li><strong>PayPal:</strong> Sie bezahlen den Rechnungsbetrag über den Online-Anbieter PayPal. Sie müssen dort registriert sein bzw. sich erst registrieren, mit Ihren Zugangsdaten legitimieren und die Zahlungsanweisung an uns bestätigen.</li>
            <li><strong>Überweisung (Vorkasse):</strong> Sie überweisen den Rechnungsbetrag auf unser Bankkonto. Unsere Bankverbindung wird Ihnen nach Abschluss der Bestellung per E-Mail mitgeteilt.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Eigentumsvorbehalt</h4>
          <p>Die gelieferte Ware bleibt bis zur vollständigen Bezahlung aller Forderungen unser Eigentum.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Transportschäden</h4>
          <p>Werden Waren mit offensichtlichen Transportschäden angeliefert, so reklamieren Sie solche Fehler bitte möglichst sofort beim Zusteller und nehmen Sie bitte unverzüglich Kontakt zu uns auf. Die Versäumung einer Reklamation oder Kontaktaufnahme hat für Ihre gesetzlichen Ansprüche und deren Durchsetzung, insbesondere Ihre Gewährleistungsrechte, keinerlei Konsequenzen. Sie helfen uns aber, unsere eigenen Ansprüche gegenüber dem Frachtführer bzw. der Transportversicherung geltend machen zu können.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. Gewährleistung und Garantien</h4>
          <p>Soweit nicht nachstehend ausdrücklich anders vereinbart, gilt das gesetzliche Mängelhaftungsrecht. Informationen zu gegebenenfalls zusätzlichen Garantien und deren genaue Bedingungen finden Sie jeweils beim Produkt und auf besonderen Informationsseiten im Online-Shop.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Haftung</h4>
          <p>Für Ansprüche aufgrund von Schäden, die durch uns, unsere gesetzlichen Vertreter oder Erfüllungsgehilfen verursacht wurden, haften wir stets unbeschränkt:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>bei Verletzung des Lebens, des Körpers oder der Gesundheit,</li>
            <li>bei vorsätzlicher oder grob fahrlässiger Pflichtverletzung,</li>
            <li>bei Garantieversprechen, soweit vereinbart,</li>
            <li>soweit der Anwendungsbereich des Produkthaftungsgesetzes eröffnet ist.</li>
          </ul>
          <p class="mt-2">Bei Verletzung wesentlicher Vertragspflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrages überhaupt erst ermöglicht und auf deren Einhaltung der Vertragspartner regelmäßig vertrauen darf (Kardinalpflichten) durch leichte Fahrlässigkeit von uns, unseren gesetzlichen Vertretern oder Erfüllungsgehilfen, ist die Haftung der Höhe nach auf den bei Vertragsschluss vorhersehbaren Schaden begrenzt, mit dessen Entstehung typischerweise gerechnet werden muss. Im Übrigen sind Ansprüche auf Schadensersatz ausgeschlossen.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Streitbeilegung</h4>
          <p>Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">11. Schlussbestimmungen</h4>
          <p>Sollte eine Bestimmung dieser Allgemeinen Geschäftsbedingungen unwirksam sein oder werden, bleibt der Vertrag im Übrigen wirksam. Anstelle der unwirksamen Bestimmung gelten die einschlägigen gesetzlichen Vorschriften.</p>
        </div>
      </div>
    `
  },
  en: {
    title: "General Terms and Conditions (GTC)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Scope of Application and Provider</h4>
          <p>These General Terms and Conditions (GTC) apply to all orders placed by customers through the <strong>BariStyle</strong> online shop of <strong>barigroup.net</strong> (Owner: Kamal Abdalbary, Zeppelinstraße 62, 52068 Aachen, Germany).</p>
        </div>
        
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. Contracting Parties and Conclusion of Contract</h4>
          <p>The purchase contract is concluded with <strong>barigroup.net (Owner: Kamal Abdalbary)</strong>.</p>
          <p class="mt-2">By placing the products in the online shop, we make a binding offer to conclude a contract for these items. The contract is concluded when you accept the offer for the goods contained in the shopping cart by clicking the order button. Immediately after sending the order, you will receive a confirmation email.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. Prices and Shipping Costs</h4>
          <p>All prices stated in the online shop are final prices and include the statutory German VAT. In addition to the stated prices, we charge shipping costs for delivery. The exact shipping costs will be clearly communicated to you on the product pages, in the shopping cart system, and on the order page.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. Delivery Conditions</h4>
          <p>We deliver exclusively by shipping. Collection of the goods by the customer is unfortunately not possible due to logistical reasons. We do not deliver to packing stations (Packstationen).</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Payment Methods</h4>
          <p>The following payment methods are available in our shop:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Credit Card:</strong> Your credit card will be charged upon completion of the order.</li>
            <li><strong>PayPal:</strong> You pay the invoice amount via the online provider PayPal. You must be registered there or register first, legitimize with your access data, and confirm the payment instruction to us.</li>
            <li><strong>Bank Transfer (Prepayment):</strong> You transfer the invoice amount to our bank account. Our bank details will be communicated to you by email after completion of the order.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Retention of Title</h4>
          <p>The delivered goods remain our property until full payment of all claims has been made.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Damage in Transit</h4>
          <p>If goods are delivered with obvious damage caused in transit, please complain about such defects to the delivery agent as soon as possible and contact us immediately. Failure to make a complaint or contact us has no consequences for your statutory claims and their enforcement, especially your warranty rights. However, you help us to be able to assert our own claims against the carrier or transport insurance.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. Warranty and Guarantees</h4>
          <p>Unless expressly agreed otherwise below, the statutory warranty rights for defects shall apply. Information on any additional guarantees and their exact conditions can be found with the product and on special information pages in the online shop.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Liability</h4>
          <p>For claims based on damages caused by us, our legal representatives, or vicarious agents, we are always liable without limitation:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>in case of injury to life, body, or health,</li>
            <li>in case of intentional or grossly negligent breach of duty,</li>
            <li>in the case of guarantee promises, if agreed,</li>
            <li>insofar as the scope of the Product Liability Act is open.</li>
          </ul>
          <p class="mt-2">In the event of a breach of essential contractual obligations, the fulfillment of which enables the proper execution of the contract in the first place and on the observance of which the contractual partner may regularly rely (cardinal obligations) through slight negligence by us, our legal representatives, or vicarious agents, liability is limited in amount to the damage foreseeable at the time the contract was concluded, the occurrence of which must typically be expected. Otherwise, claims for damages are excluded.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Dispute Resolution</h4>
          <p>We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">11. Final Provisions</h4>
          <p>Should any provision of these General Terms and Conditions be or become invalid, the remainder of the contract shall remain in effect. Instead of the invalid provision, the relevant statutory provisions shall apply.</p>
        </div>
      </div>
    `
  },
  ar: {
    title: "الشروط والأحكام العامة (AGB)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed text-right font-sans" dir="rtl">
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">1. نطاق التطبيق ومزود الخدمة</h4>
          <p>تسري هذه الشروط والأحكام العامة (AGB) على جميع الطلبات والعمليات الشرائية التي يقوم بها العملاء من خلال المتجر الإلكتروني <strong>BariStyle</strong> التابع لمجموعة <strong>barigroup.net</strong> (المالك: كمال عبد الباري، Zeppelinstraße 62, 52068 Aachen، ألمانيا).</p>
        </div>
        
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">2. أطراف التعاقد وإتمام العقد</h4>
          <p>ينشأ عقد الشراء ويتم إبرامه مع <strong>مجموعة barigroup.net (المالك: كمال عبد الباري)</strong>.</p>
          <p class="mt-2">من خلال عرض المنتجات في متجرنا الإلكتروني، فإننا نقدم عرضاً ملزماً لإبرام العقد الخاص بهذه السلع. يكتمل العقد ويصبح نافذاً عندما تقبل العرض الخاص بالبضائع الموجودة في سلة التسوق عن طريق النقر فوق زر إتمام الطلب (الدفع). مباشرة بعد إرسال الطلب، ستتلقى رسالة تأكيد عبر البريد الإلكتروني.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">3. الأسعار وتكاليف الشحن</h4>
          <p>جميع الأسعار المعروضة في المتجر الإلكتروني هي أسعار نهائية وتشمل ضريبة القيمة المضافة القانونية المعمول بها في ألمانيا. بالإضافة إلى الأسعار المعلنة للمنتجات، فإننا نتقاضى تكاليف شحن إضافية للتوصيل. يتم توضيح تكاليف الشحن بدقة وبشكل ظاهر في صفحات المنتجات، ونظام سلة التسوق، وصفحة إتمام الطلب قبل الشراء.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">4. شروط وأحكام التوصيل</h4>
          <p>نحن نقوم بالتوصيل حصرياً عبر طرق الشحن والتوصيل البريدي. للأسف، لا تتوفر خدمة الاستلام الشخصي للبضائع من المقر لأسباب لوجستية وتنظيمية. نحن لا نقوم بالتوصيل إلى صناديق البريد الآلية (Packstationen).</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">5. وسائل وطرق الدفع</h4>
          <p>تتوفر في متجرنا طرق الدفع التالية لتسهيل معاملاتكم:</p>
          <ul class="list-disc pr-5 mt-2 space-y-1">
            <li><strong>بطاقات الائتمان (Visa / Mastercard):</strong> يتم خصم المبلغ من بطاقتك الائتمانية فور إتمام عملية الشراء وتأكيد الطلب.</li>
            <li><strong>بوابة باي بال (PayPal):</strong> تقوم بدفع قيمة الفاتورة عبر مزود الدفع PayPal. يجب أن تكون مسجلاً لدى PayPal أو تقوم بإنشاء حساب جديد، وتأكيد هويتك وبيانات الدخول، ثم الموافقة على أمر الدفع لصالحنا.</li>
            <li><strong>التحويل البنكي المسبق (Vorkasse):</strong> تقوم بتحويل مبلغ الفاتورة إلى حسابنا البنكي. سيتم إرسال بيانات حسابنا المصرفي وتفاصيل التحويل إليك عبر البريد الإلكتروني فور إتمام الطلب.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">6. الاحتفاظ بالملكية</h4>
          <p>تظل البضائع المسلمة ملكاً لنا بالكامل حتى يتم سداد كامل قيمة الفاتورة والالتزامات المالية المرتبطة بها بشكل نهائي.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">7. أضرار وخسائر الشحن</h4>
          <p>إذا تم تسليم بضائع بها أضرار واضحة ناتجة عن النقل والشحن، يُرجى تقديم شكوى بشأن هذه العيوب إلى شركة التوصيل (المندوب) في أقرب وقت ممكن والاتصال بنا على الفور. إن عدم تقديم شكوى أو عدم الاتصال بنا لا يؤثر بأي حال من الأحوال على حقوقك وضماناتك القانونية، وخاصة حقك في المطالبة بالعيوب المصنعية، ولكنه يساعدنا في إثبات حقوقنا ومطالبة شركة الشحن أو شركة التأمين بالتعويض عن أضرار النقل.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">8. الضمانات والكفالة</h4>
          <p>ما لم يُتفق صراحة على خلاف ذلك أدناه، تسري الأحكام القانونية الخاصة بالضمان والمسؤولية عن العيوب في ألمانيا. يمكن العثور على معلومات حول أي ضمانات إضافية وشروطها التفصيلية بجانب كل منتج وفي صفحات المعلومات المخصصة داخل المتجر.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">9. المسؤولية القانونية</h4>
          <p>فيما يتعلق بالمطالبات الناشئة عن الأضرار التي نسببها نحن أو ممثلونا القانونيون أو وكلاؤنا المعتمدون، فإننا نتحمل المسؤولية الكاملة وغير المقيدة في الحالات التالية:</p>
          <ul class="list-disc pr-5 mt-2 space-y-1">
            <li>حالات الإضرار بالحياة أو السلامة الجسدية أو الصحية.</li>
            <li>الإخلال بالواجبات الناتج عن الإهمال الجسيم أو التعمد.</li>
            <li>في حالة وعود الضمان الصريحة (إن وجدت).</li>
            <li>في الحالات الخاضعة لقانون المسؤولية عن المنتجات الألماني.</li>
          </ul>
          <p class="mt-2">في حالة انتهاك الالتزامات التعاقدية الأساسية التي لا يمكن تنفيذ العقد بدونها والتي يعتمد عليها العميل بشكل طبيعي (الالتزامات الجوهرية) بسبب الإهمال البسيط من جانبنا أو ممثلينا القانونيين أو وكلائنا، فإن مسؤوليتنا تقتصر على قيمة الضرر المتوقع وقت إبرام العقد والذي يحدث عادة في مثل هذه المعاملات. وفيما عدا ذلك، يُستبعد تماماً أي ادعاء أو مطالبة بالتعويض عن الأضرار.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">10. تسوية النزاعات</h4>
          <p>نحن لسنا ملزمين وغير مستعدين للمشاركة في إجراءات تسوية المنازعات أمام هيئة تحكيم للمستهلكين.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">11. أحكام ختامية</h4>
          <p>إذا تبين أن أي بند من شروط وأحكام العقد غير صالح أو غير قانوني أو غير قابل للتطبيق، فإن بقية بنود الاتفاقية تظل سارية ونافذة بالكامل دون أي تأثير. وتُطبق القوانين واللوائح الحكومية الألمانية المعمول بها بدلاً من البند غير الصالح.</p>
        </div>
      </div>
    `
  },
  fr: {
    title: "Conditions Générales de Vente (CGV)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Champ d'application et prestataire</h4>
          <p>Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les commandes passées par les clients sur la boutique en ligne <strong>BariStyle</strong> de <strong>barigroup.net</strong> (Propriétaire : Kamal Abdalbary, Zeppelinstraße 62, 52068 Aachen, Allemagne).</p>
        </div>
        
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. Parties contractantes et conclusion du contrat</h4>
          <p>Le contrat d'achat est conclu avec <strong>barigroup.net (Propriétaire : Kamal Abdalbary)</strong>.</p>
          <p class="mt-2">En présentant nos produits dans la boutique en ligne, nous formulons une offre ferme pour la conclusion d'un contrat relatif à ces articles. Le contrat est conclu lorsque vous acceptez l'offre pour les marchandises contenues dans le panier en cliquant sur le bouton de commande. Immédiatement après l'envoi de la commande, vous recevrez un e-mail de confirmation.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. Prix et frais de port</h4>
          <p>Tous les prix indiqués sur la boutique en ligne sont des prix définitifs et incluent la taxe sur la valeur ajoutée (TVA) légale allemande. En plus des prix indiqués, nous facturons des frais de livraison. Les frais de livraison exacts vous seront communiqués de manière claire sur les pages produits, dans le système de panier et sur la page de commande.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. Conditions de livraison</h4>
          <p>We deliver exclusively by shipping. Collection of the goods by the customer is unfortunately not possible due to logistical reasons. We do not deliver to packing stations (Packstationen).</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Moyens de paiement</h4>
          <p>Les modes de paiement suivants sont disponibles dans notre boutique :</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Carte de crédit :</strong> Le débit de votre carte de crédit est effectué dès la validation de la commande.</li>
            <li><strong>PayPal :</strong> Vous payez le montant de la facture via le fournisseur en ligne PayPal. Vous devez y être inscrit ou vous inscrire, vous identifier avec vos données d'accès et nous confirmer l'ordre de paiement.</li>
            <li><strong>Virement bancaire (Paiement d'avance) :</strong> Vous virez le montant de la facture sur notre compte bancaire. Nos coordonnées bancaires vous seront communiquées par e-mail après la finalisation de la commande.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Réserve de propriété</h4>
          <p>Les marchandises livrées restent notre propriété exclusive jusqu'au paiement intégral de toutes les créances.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Dommages liés au transport</h4>
          <p>Si des marchandises sont livrées avec des dommages apparents dus au transport, veuillez formuler une réclamation auprès du transporteur dès que possible et nous contacter immédiatement. L'absence de réclamation ou de prise de contact n'a aucune conséquence sur vos droits et garanties légaux, notamment vos droits de garantie contre les vices cachés. Cependant, vous nous aidez à faire valoir nos propres droits auprès du transporteur ou de l'assurance transport.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. Garantie et responsabilités</h4>
          <p>Sauf accord contraire expresse ci-dessous, la garantie légale allemande contre les défauts s'applique. Vous trouverez des informations sur les garanties supplémentaires éventuelles et leurs conditions exactes avec le produit et sur les pages d'information spécifiques de la boutique.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Responsabilité</h4>
          <p>Pour les réclamations fondées sur des dommages causés par nous-mêmes, nos représentants légaux ou nos agents d'exécution, notre responsabilité est toujours illimitée :</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>en cas d'atteinte à la vie, à l'intégrité physique ou à la santé,</li>
            <li>en cas de manquement délibéré ou de négligence grave,</li>
            <li>en cas de promesse de garantie, si convenue,</li>
            <li>dans la mesure où le champ d'application de la loi sur la responsabilité du fait des produits est ouvert.</li>
          </ul>
          <p class="mt-2">En cas de violation d'obligations contractuelles essentielles dont l'exécution est indispensable au bon déroulement du contrat et sur le respect desquelles le partenaire contractuel peut légitimement compter (obligations cardinales) par simple négligence de notre part, de nos représentants légaux ou de nos agents d'exécution, la responsabilité est limitée au montant des dommages prévisibles au moment de la conclusion du contrat et dont la survenance est typiquement prévisible. Dans tous les autres cas, les demandes de dommages et intérêts sont exclues.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Règlement des litiges</h4>
          <p>Nous ne sommes ni obligés ni disposés à participer à des procédures de règlement des litiges devant un conseil d'arbitrage des consommateurs.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">11. Dispositions finales</h4>
          <p>Si l'une des dispositions des présentes Conditions Générales de Vente s'avérait ou devenait caduque, la validité des autres dispositions du contrat n'en serait pas affectée. Les dispositions légales applicables remplaceront alors la clause caduque.</p>
        </div>
      </div>
    `
  },
  nl: {
    title: "Algemene Voorwaarden (AV)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Toepassingsgebied en aanbieder</h4>
          <p>Deze algemene voorwaarden (AV) zijn van toepassing op alle bestellingen die klanten plaatsen via de online shop <strong>BariStyle</strong> van <strong>barigroup.net</strong> (Eigenaar: Kamal Abdalbary, Zeppelinstraße 62, 52068 Aachen, Duitsland).</p>
        </div>
        
        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. Contractpartners en totstandkoming van de overeenkomst</h4>
          <p>De koopovereenkomst komt tot stand met <strong>barigroup.net (Eigenaar: Kamal Abdalbary)</strong>.</p>
          <p class="mt-2">Door de producten in de online shop te plaatsen, doen wij een bindend aanbod om een overeenkomst voor deze artikelen te sluiten. De overeenkomst komt tot stand wanneer u het aanbod voor de goederen in de winkelwagen accepteert door op de bestelknop te klikken. Direct na het verzenden van de bestelling ontvangt u een bevestigingsmail.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. Prijzen en verzendkosten</h4>
          <p>Alle in de online shop vermelde prijzen zijn eindprijzen en inclusief de wettelijke Duitse btw. Bovenop de vermelde prijzen brengen wij verzendkosten in rekening. De exacte verzendkosten worden u duidelijk meegedeeld op de productpagina's, in het winkelwagensysteem en op de bestelpagina.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. Leveringsvoorwaarden</h4>
          <p>Wij leveren uitsluitend via verzending. Het zelf afhalen van de goederen door de klant is om logistieke redenen helaas niet mogelijk. Wij leveren niet aan afhaalstations (Packstationen).</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Betaalmethoden</h4>
          <p>In onze winkel zijn de volgende betaalmethoden beschikbaar:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Creditcard:</strong> Uw creditcard wordt belast bij het afronden van de bestelling.</li>
            <li><strong>PayPal:</strong> U betaalt het factuurbedrag via de online aanbieder PayPal. U moet daar geregistreerd zijn of u eerst registreren, inloggen met uw toegangsgegevens en de betalingsopdracht aan ons adviseren.</li>
            <li><strong>Bankoverschrijving (Vooruitbetaling):</strong> U maakt het factuurbedrag over naar onze bankrekening. Onze bankgegevens worden na afronding van de bestelling per e-mail aan u meegedeeld.</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Eigendomsvoorbehoud</h4>
          <p>De geleverde goederen blijven ons eigendom tot de volledige betaling van alle vorderingen is voldaan.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Transportschade</h4>
          <p>Als goederen worden geleverd met duidelijke transportschade, meld dit dan zo snel mogelijk aan de bezorger en neem direct contact met ons op. Het niet indienen van een klacht of het niet opnemen van contact heeft geen gevolgen voor uw wettelijke claims en de handhaving daarvan, in het bijzonder uw garantierechten. U helpt ons echter om onze eigen claims in te dienen bij de vervoerder of de transportverzekering.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. Wettelijke garantie en garanties</h4>
          <p>Tenzij hieronder uitdrukkelijk anders overeengekomen, is de wettelijke garantie voor defecten van toepassing. Informatie over eventuele aanvullende garanties en de exacte voorwaarden daarvan vindt u bij het product en op speciale informatiepagina's in de online shop.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Aansprakelijkheid</h4>
          <p>Voor claims op basis van schade veroorzaakt door ons, onze wettelijke vertegenwoordigers of hulppersonen, zijn wij altijd onbeperkt aansprakelijk:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>bij letsel aan leven, lichaam of gezondheid,</li>
            <li>bij opzettelijk of grof nalatig plichtsverzuim,</li>
            <li>bij garantiebeloften, indien overeengekomen,</li>
            <li>voor zover het toepassingsgebied van de productaansprakelijkheidswet openstaat.</li>
          </ul>
          <p class="mt-2">Bij schending van wezenlijke contractuele verplichtingen, waarvan de nakoming de goede uitvoering van de overeenkomst überhaupt pas mogelijk maakt en op de naleving waarvan de contractpartner regelmatig mag vertrouwen (kardinale verplichtingen) door lichte nalatigheid van ons, onze wettelijke vertegenwoordigers of hulppersonen, is de aansprakelijkheid in hoogte beperkt tot de schade die voorzienbaar was op het moment dat de overeenkomst werd gesloten en waarmee typisch rekening moet worden gehouden. Anders zijn claims voor schadevergoeding uitgesloten.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Geschillenbeslechting</h4>
          <p>Wij zijn niet verplicht en niet bereid om deel te nemen aan een geschillenbeslechtingsprocedure voor een geschillencommissie voor consumentenzaken.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">11. Slotbepalingen</h4>
          <p>Mocht een bepaling van deze algemene voorwaarden ongeldig zijn of worden, dan blijft de rest van de overeenkomst van kracht. In plaats van de ongeldige bepaling gelden de relevante wettelijke bepalingen.</p>
        </div>
      </div>
    `
  }
};

const cookieDetails = {
  de: {
    title: "Cookie-Richtlinie (EU)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <p class="text-stone-500 text-xs italic">Diese Cookie-Richtlinie wurde zuletzt am 26. Mai 2026 aktualisiert und gilt für Bürger und Einwohner mit ständigem Wohnsitz im Europäischen Wirtschaftsraum (EWR) und der Schweiz.</p>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Einführung</h4>
          <p>Unsere Website, <strong>https://barigroup.net</strong> (im Folgenden: "Die Website"), verwendet Cookies und ähnliche Technologien (der Einfachheit halber werden all diese unter "Cookies" zusammengefasst). Cookies werden außerdem von uns beauftragten Drittparteien platziert. In diesem Dokument informieren wir Sie über die Verwendung von Cookies auf unserer Website.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. Was sind Cookies?</h4>
          <p>Ein Cookie ist eine einfache kleine Datei, die gemeinsam mit den Seiten einer Internetadresse versendet und vom Webbrowser auf dem PC oder einem anderen Gerät gespeichert werden kann. Die darin gespeicherten Informationen können während folgender Besuche zu unseren oder den Servern relevanter Drittanbieter gesendet werden.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. Was sind Skripte?</h4>
          <p>Ein Script ist ein Stück Programmcode, das benutzt wird, um unserer Website Funktionalität und Interaktivität zu ermöglichen. Dieser Code wird auf unseren Servern oder auf Ihrem Gerät ausgeführt.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. Was ist ein Web Beacon?</h4>
          <p>Ein Web-Beacon (auch Pixel-Tag genannt), ist ein kleines unsichtbares Textfragment oder Bild auf einer Website, das benutzt wird, um den Verkehr auf der Website zu überwachen. Um dies zu ermöglichen, werden diverse Daten von Ihnen mittels Web-Beacons gespeichert.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Cookies</h4>
          <p><strong>5.1 Technische oder funktionelle Cookies:</strong> Einige Cookies stellen sicher, dass bestimmte Teile der Website ordnungsgemäß funktionieren und Ihre Benutzereinstellungen weiterhin in Erinnerung bleiben. Durch das Setzen funktionaler Cookies erleichtern wir Ihnen den Besuch unserer Website. So bleiben Artikel beispielsweise in Ihrem Warenkorb. Wir können diese Cookies ohne Ihre Einwilligung platzieren.</p>
          <p class="mt-2"><strong>5.2 Analytische Cookies:</strong> Wir verwenden analytische Cookies, um das Website-Erlebnis für unsere Nutzer zu optimieren. Mit diesen Cookies erhalten wir Einblicke in die Nutzung unserer Website. Wir bitten vor dem Setzen um Ihre Zustimmung.</p>
          <p class="mt-2"><strong>5.3 Marketing- / Tracking-Cookies:</strong> Marketing- / Tracking-Cookies werden zur Erstellung von Benutzerprofilen verwendet, um personalisierte Werbung anzuzeigen oder den Benutzer auf dieser oder über mehrere Websites hinweg für ähnliche Marketingzwecke zu verfolgen.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Platzierte Cookies</h4>
          <p>Unsere Website nutzt Dienste wie <strong>Stripe</strong> (Zahlungsabwicklung), <strong>WooCommerce</strong> (Warenkorbfunktionalitäten), <strong>Google Analytics</strong> (Statistiken) und <strong>WordPress / LiteSpeed</strong> (technische Optimierung), um ein exzellentes Einkaufserlebnis zu garantieren. Die vollständige Liste der platzierten Services und deren Zustimmungsstatus können Sie jederzeit über das Cookie-Zustimmungs-Banner einsehen.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Einwilligung</h4>
          <p>Wenn Sie unsere Website das erste Mal besuchen, zeigen wir Ihnen ein Pop-Up mit einer Erklärung über Cookies. Sobald Sie auf „Einwilligen“ klicken, geben Sie uns Ihre Zustimmung, die von Ihnen ausgewählten Kategorien von Cookies und Plugins zu verwenden. Sie können die Verwendung von Cookies über Ihren Browser deaktivieren.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. Aktivierung/Deaktivierung und Löschen von Cookies</h4>
          <p>Sie können Ihren Internetbrowser verwenden, um automatisch oder manuell Cookies zu löschen oder einzustellen, dass Sie benachrichtigt werden, wenn ein Cookie platziert wird. Bitte beachten Sie, dass unsere Website möglicherweise nicht richtig funktioniert, wenn alle Cookies deaktiviert sind.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Ihre Rechte in Bezug auf personenbezogene Daten</h4>
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenübertragbarkeit und Widerspruch bezüglich Ihrer personenbezogenen Daten. Bitte kontaktieren Sie uns für die Ausübung dieser Rechte.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Kontaktdaten</h4>
          <p>Für Fragen und/oder Kommentare über unsere Cookie-Richtlinien und diese Erklärung kontaktieren Sie uns bitte unter:</p>
          <div class="mt-2 bg-stone-50 p-4 rounded border border-stone-100 text-xs">
            <p class="font-bold text-stone-900">barigroup.net</p>
            <p>Inhaber: <strong>Kamal Abdalbary</strong></p>
            <p>Zeppelinstraße 62, 52068 Aachen, Deutschland</p>
            <p>Website: <strong>https://barigroup.net</strong></p>
            <p>E-Mail: <strong>service@barigroup.net</strong></p>
            <p>Telefonnummer: <strong>+49 152524 11886</strong></p>
          </div>
        </div>
      </div>
    `
  },
  en: {
    title: "Cookie Policy (EU)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <p class="text-stone-500 text-xs italic">This Cookie Policy was last updated on November 19, 2025, and applies to citizens and permanent residents of the European Economic Area (EEA) and Switzerland.</p>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Introduction</h4>
          <p>Our website, <strong>https://barigroup.net</strong> (hereinafter: "The Website"), uses cookies and similar technologies (for simplicity, all these are grouped under "Cookies"). Cookies are also placed by third parties commissioned by us. In this document, we inform you about the use of cookies on our website.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. What are Cookies?</h4>
          <p>A cookie is a simple small file that is sent along with the pages of an internet address and can be stored by the web browser on the PC or another device. The information stored therein can be sent to our servers or the servers of relevant third-party providers during subsequent visits.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. What are Scripts?</h4>
          <p>A script is a piece of program code used to enable functionality and interactivity on our website. This code is executed on our servers or on your device.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. What is a Web Beacon?</h4>
          <p>A web beacon (also called a pixel tag) is a small invisible text fragment or image on a website that is used to monitor traffic on the website. To make this possible, various data of yours is stored using web beacons.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Cookies</h4>
          <p><strong>5.1 Technical or functional cookies:</strong> Some cookies ensure that certain parts of the website work properly and that your user settings remain remembered. By setting functional cookies, we make it easier for you to visit our website. This way, items remain in your shopping cart, for example. We can place these cookies without your consent.</p>
          <p class="mt-2"><strong>5.2 Analytical cookies:</strong> We use analytical cookies to optimize the website experience for our users. With these cookies, we get insights into the usage of our website. We ask for your permission before setting them.</p>
          <p class="mt-2"><strong>5.3 Marketing- / Tracking-cookies:</strong> Marketing/tracking cookies are used to create user profiles in order to display personalized advertising or to track the user on this website or across multiple websites for similar marketing purposes.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Placed Cookies</h4>
          <p>Our website uses services such as <strong>Stripe</strong> (payment processing), <strong>WooCommerce</strong> (cart functionality), <strong>Google Analytics</strong> (statistics), and <strong>WordPress / LiteSpeed</strong> (technical optimization) to guarantee an excellent shopping experience. The full list of placed services and their consent status can be viewed at any time via the cookie consent banner.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Consent</h4>
          <p>When you visit our website for the first time, we show you a pop-up with an explanation about cookies. As soon as you click "Save settings", you give us your consent to use all chosen categories of cookies and plugins. You can disable cookies via your browser.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. Activating/Deactivating and Deleting Cookies</h4>
          <p>You can use your internet browser to automatically or manually delete cookies or to receive a notification whenever a cookie is placed. Please note that our website may not function properly if all cookies are disabled.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Your Rights with Respect to Personal Data</h4>
          <p>You have the right to know why your personal data is needed, what happens to it, and how long it will be retained. You also have rights of access, rectification, erasure, restriction of processing, data portability, and objection. Please contact us to exercise these rights.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Contact Details</h4>
          <p>For questions and/or comments about our cookie policy and this statement, please contact us at:</p>
          <div class="mt-2 bg-stone-50 p-4 rounded border border-stone-100 text-xs">
            <p class="font-bold text-stone-900">barigroup.net</p>
            <p>Owner: <strong>Kamal Abdalbary</strong></p>
            <p>Zeppelinstraße 62, 52068 Aachen, Germany</p>
            <p>Website: <strong>https://barigroup.net</strong></p>
            <p>Email: <strong>service@barigroup.net</strong></p>
            <p>Phone: <strong>+49 152524 11886</strong></p>
          </div>
        </div>
      </div>
    `
  },
  ar: {
    title: "سياسة الكوكيز (الاتحاد الأوروبي)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed text-right font-sans" dir="rtl">
        <p class="text-stone-500 text-xs italic text-right">تم تحديث سياسة ملفات تعريف الارتباط (الكوكيز) هذه آخر مرة في 26 مايو 2026 وتنطبق على مواطني والمقيمين الدائمين في المنطقة الاقتصادية الأوروبية (EEA) وسويسرا.</p>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">1. مقدمة</h4>
          <p>يستخدم موقعنا الإلكتروني، <strong>https://barigroup.net</strong> (يشار إليه فيما يلي باسم: "الموقع")، ملفات تعريف الارتباط والتقنيات المشابهة (للتسهيل، يتم تجميعها جميعاً تحت اسم "ملفات تعريف الارتباط" أو "الكوكيز"). يتم أيضاً وضع ملفات تعريف الارتباط بواسطة جهات خارجية نتعاون معها. في هذه الوثيقة، نبلغكم بكيفية استخدام ملفات تعريف الارتباط على موقعنا.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">2. ما هي ملفات تعريف الارتباط (Cookies)؟</h4>
          <p>ملف تعريف الارتباط هو ملف صغير وبسيط يتم إرساله مع صفحات موقع الويب ويتم تخزينه بواسطة متصفح الإنترنت على جهاز الكمبيوتر الخاص بك أو أي جهاز آخر. يمكن إرسال المعلومات المخزنة فيه إلى خوادمنا أو خوادم الأطراف الثالثة ذات الصلة أثناء الزيارات اللاحقة.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">3. ما هي البرمجيات النصية (Scripts)؟</h4>
          <p>البرمجيات النصية هي جزء من كود البرنامج المستخدم لتوفير الوظائف والتفاعل لموقعنا الإلكتروني. يتم تشغيل هذا كود على خوادمنا أو على جهازك الشخصي.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">4. ما هي إشارات الويب (Web Beacon)؟</h4>
          <p>إشارة الويب (تسمى أيضاً بكسل التتبع) هي جزء صغير غير مرئي من نص أو صورة على موقع الويب ويتم استخدامها لمراقبة حركة المرور والزوار على الموقع. لتمكين ذلك، يتم تخزين بيانات مختلفة خاصة بك باستخدام إشارات الويب.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">5. أنواع ملفات تعريف الارتباط المستخدمة</h4>
          <p><strong>5.1 ملفات تعريف الارتباط التقنية أو الوظيفية:</strong> تضمن بعض ملفات تعريف الارتباط عمل أجزاء معينة من الموقع بشكل صحيح وتذكر خياراتك وتفضيلاتك كمستخدم. من خلال وضع ملفات تعريف الارتباط الوظيفية، نسهل عليك زيارة موقعنا؛ على سبيل المثال، تظل السلع محفوظة في سلة التسوق الخاصة بك. يمكننا وضع هذه الملفات دون موافقتك الصريحة لأنها أساسية لتشغيل الموقع.</p>
          <p class="mt-2"><strong>5.2 ملفات تعريف الارتباط التحليلية:</strong> نستخدم ملفات تعريف الارتباط التحليلية لتحسين وتطوير تجربة تصفح الموقع لمستخدمينا. تمنحنا هذه الملفات إحصاءات قيمة حول كيفية استخدام موقعنا، ونطلب دائماً موافقتكم قبل تفعيلها.</p>
          <p class="mt-2"><strong>5.3 ملفات تعريف الارتباط للتسويق والتتبع:</strong> تُسخدم ملفات تعريف ارتباط التسويق/التتبع لإنشاء ملفات تعريف شخصية للمستخدمين من أجل عرض إعلانات مخصصة تهمهم أو لتتبع المستخدم عبر هذا الموقع أو عبر مواقع ويب متعددة لأغراض تسويقية مشابهة.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">6. ملفات تعريف الارتباط التي يتم وضعها</h4>
          <p>يستخدم موقعنا خدمات أساسية وموثوقة لضمان أفضل تجربة تسوق، ومن بينها بوابة الدفع الآمنة <strong>Stripe</strong>، ونظام المتجر <strong>WooCommerce</strong>، وإحصائيات <strong>Google Analytics</strong>، بالإضافة إلى أدوات تسريع وتحسين الموقع <strong>WordPress / LiteSpeed</strong>. يمكنك مراجعة وإدارة حالة موافقتك لكل خدمة من هذه الخدمات مباشرة عبر بنر الخصوصية والموافقة المخصص للكوكيز في موقعنا.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">7. الموافقة وإدارة الخصوصية</h4>
          <p>عند زيارتك لموقعنا لأول مرة، سنعرض لك نافذة منبثقة تحتوي على شرح مفصل لملفات تعريف الارتباط. بمجرد النقر فوق "حفظ الإعدادات والموافقة"، فإنك تمنحنا موافقتك على استخدام الفئات المحددة من ملفات تعريف الارتباط والإضافات كما هو موضح في هذه السياسة. يمكنك تعطيل الكوكيز بالكامل من إعدادات متصفحك.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">8. تفعيل وتعطيل وحذف ملفات تعريف الارتباط</h4>
          <p>يمكنك استخدام متصفح الإنترنت الخاص بك لحذف ملفات تعريف الارتباط تلقائياً أو يدوياً، أو تحديد ما إذا كنت ترغب في تلقي إشعار في كل مرة يتم فيها وضع ملف تعريف ارتباط. يرجى العلم بأن الموقع قد لا يعمل بشكل صحيح إذا تم تعطيل جميع ملفات تعريف الارتباط بالكامل.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">9. حقوقك فيما يتعلق بالبيانات الشخصية</h4>
          <p>لديك الحق الكامل في معرفة سبب الحاجة إلى بياناتك الشخصية، وماذا سيحدث لها، ومدة الاحتفاظ بها، بالإضافة إلى حق الوصول، والطلب، والتصحيح، والحذف، والاعتراض على معالجة بياناتك. يُرجى التواصل معنا لممارسة هذه الحقوق في أي وقت.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2 text-right">10. معلومات الاتصال والتواصل</h4>
          <p>لأي استفسارات أو تعليقات بخصوص سياسة ملفات تعريف الارتباط الخاصة بنا، يرجى التواصل معنا عبر البيانات التالية:</p>
          <div class="mt-2 bg-stone-50 p-4 rounded border border-stone-100 text-xs text-right" dir="rtl">
            <p class="font-bold text-stone-900">مجموعة barigroup.net</p>
            <p>المدير العام والمالك الممثل: <strong>كمال عبد الباري (Kamal Abdalbary)</strong></p>
            <p>العنوان: Zeppelinstraße 62, 52068 Aachen, Germany</p>
            <p>الموقع الإلكتروني الرسمي: <strong>https://barigroup.net</strong></p>
            <p>البريد الإلكتروني: <strong>service@barigroup.net</strong></p>
            <p>رقم الهاتف المباشر: <strong>11886 152524 49+</strong></p>
          </div>
        </div>
      </div>
    `
  },
  fr: {
    title: "Politique relative aux cookies (UE)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <p class="text-stone-500 text-xs italic">Cette politique de cookies a été mise à jour pour la dernière fois le 26 mai 2026 et s'applique aux citoyens et résidents permanents de l'Espace économique européen (EEE) et de la Suisse.</p>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Introduction</h4>
          <p>Notre site Web, <strong>https://barigroup.net</strong> (ci-après : "Le Site"), utilise des cookies et des technologies similaires (par simplicité, tous ceux-ci sont regroupés sous le terme "Cookies"). Des cookies sont également placés par des tiers mandatés par nous. Dans ce document, nous vous informons sur l'utilisation des cookies sur notre site.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. Que sont les Cookies ?</h4>
          <p>Un cookie est un simple petit fichier envoyé avec les pages d'une adresse Internet et qui peut être stocké par le navigateur Web sur le PC ou un autre appareil. Les informations qui y sont stockées peuvent être renvoyées à nos serveurs ou aux serveurs de tiers concernés lors de visites ultérieures.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. Que sont les Scripts ?</h4>
          <p>Un script est un élément de code de programme utilisé pour activer les fonctionnalités et l'interactivité sur notre site Web. Ce code est exécuté sur nos serveurs ou sur votre appareil.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. Qu'est-ce qu'une Balise Web ?</h4>
          <p>Une balise Web (également appelée pixel invisible) est un petit fragment de texte ou une image invisible sur un site Web qui est utilisé pour surveiller le trafic sur le site Web. Pour rendre cela possible, diverses données vous concernant sont stockées à l'aide de balises Web.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Cookies</h4>
          <p><strong>5.1 Cookies techniques ou fonctionnels :</strong> Certains cookies garantissent le bon fonctionnement de certaines parties du site Web et la mémorisation de vos paramètres d'utilisateur. En plaçant des cookies fonctionnels, nous facilitons votre visite sur notre site Web. Par exemple, les articles restent dans votre panier. Nous pouvons placer ces cookies sans votre consentement.</p>
          <p class="mt-2"><strong>5.2 Cookies analytiques :</strong> Nous utilisons des cookies analytiques pour optimiser l'expérience utilisateur sur notre site Web. Avec ces cookies, nous obtenons des informations sur l'utilisation de notre site Web. Nous demandons votre autorisation avant de les placer.</p>
          <p class="mt-2"><strong>5.3 Cookies de marketing / suivi :</strong> Les cookies de marketing / suivi sont utilisés pour créer des profils d'utilisateurs afin d'afficher des publicités personnalisées ou de suivre l'utilisateur sur ce site ou sur plusieurs sites Web à des fins de marketing similaires.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Cookies placés</h4>
          <p>Notre site Web utilise des services tels que <strong>Stripe</strong> (traitement des paiements), <strong>WooCommerce</strong> (fonctionnalités du panier), <strong>Google Analytics</strong> (statistiques) et <strong>WordPress / LiteSpeed</strong> (optimisation technique) pour garantir une excellente expérience d'achat. La liste complète des services placés et leur statut de consentement peuvent être consultés à tout moment via la bannière de consentement aux cookies.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Consentement</h4>
          <p>Lorsque vous visitez notre site Web pour la première fois, nous vous présentons une fenêtre contextuelle contenant des explications sur les cookies. Dès que vous cliquez sur "Sauvegarder les paramètres", vous nous donnez votre consentement pour utiliser toutes les catégories de cookies et d'extensions sélectionnées. Vous pouvez désactiver les cookies via votre navigateur.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. Activation/désactivation et suppression des cookies</h4>
          <p>Vous pouvez utiliser votre navigateur Internet pour supprimer automatiquement ou manuellement les cookies ou pour recevoir une notification à chaque fois qu'un cookie est placé. Veuillez noter que notre site Web peut ne pas fonctionner correctement si tous les cookies sont désactivés.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Vos droits concernant vos données personnelles</h4>
          <p>Vous avez le droit de savoir pourquoi vos données personnelles sont nécessaires, ce qu'il en advient et combien de temps elles seront conservées. Vous disposez également de droits d'accès, de rectification, de suppression, de limitation du traitement, de portabilité et d'opposition. Veuillez nous contacter pour exercer ces droits.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Coordonnées de contact</h4>
          <p>Pour toute question et/ou commentaire concernant notre politique de cookies et cette déclaration, veuillez nous contacter à l'adresse suivante :</p>
          <div class="mt-2 bg-stone-50 p-4 rounded border border-stone-100 text-xs">
            <p class="font-bold text-stone-900">barigroup.net</p>
            <p>Propriétaire : <strong>Kamal Abdalbary</strong></p>
            <p>Zeppelinstraße 62, 52068 Aachen, Allemagne</p>
            <p>Site Web : <strong>https://barigroup.net</strong></p>
            <p>E-mail : <strong>service@barigroup.net</strong></p>
            <p>Téléphone : <strong>+49 152524 11886</strong></p>
          </div>
        </div>
      </div>
    `
  },
  nl: {
    title: "Cookiebeleid (EU)",
    content: `
      <div class="space-y-6 text-stone-800 text-sm leading-relaxed font-sans" dir="ltr">
        <p class="text-stone-500 text-xs italic">Dit cookiebeleid is voor het laatst bijgewerkt op 26 mei 2026 en is van toepassing op burgers en permanente inwoners van de Europese Economische Ruimte (EER) en Zwitserland.</p>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">1. Inleiding</h4>
          <p>Onze website, <strong>https://barigroup.net</strong> (hierna: "De Website"), maakt gebruik van cookies en soortgelijke technieken (voor het gemak worden deze allemaal onder "Cookies" samengevat). Cookies worden ook geplaatst door derden die door ons zijn ingeschakeld. In dit document informeren wij u over het gebruik van cookies op onze website.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">2. Wat zijn Cookies?</h4>
          <p>Een cookie is een eenvoudig klein bestandje dat met pagina's van een internetadres wordt meegestuurd en door de webbrowser op de pc of een ander apparaat kan worden opgeslagen. De daarin opgeslagen informatie kan bij volgende bezoeken naar onze servers of die van relevante derde partijen worden teruggestuurd.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">3. Wat zijn Scripts?</h4>
          <p>Een script is een stukje programmacode dat wordt gebruikt om functionaliteit en interactiviteit op onze website mogelijk te maken. Deze code wordt uitgevoerd op onze servers of op uw apparaat.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">4. Wat is een Web Beacon?</h4>
          <p>Een web beacon (ook wel pixel tag genoemd) is een klein onzichtbaar stukje tekst of afbeelding op een website dat wordt gebruikt om het verkeer op de website te monitoren. Om dit mogelijk te maken, worden met behulp van web beacons diverse gegevens van u opgeslagen.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">5. Cookies</h4>
          <p><strong>5.1 Technische of functionele cookies:</strong> Sommige cookies zorgen ervoor dat bepaalde delen van de website goed werken en dat uw gebruikersinstellingen onthouden blijven. Door het plaatsen van functionele cookies maken we het u gemakkelijker om onze website te bezoeken. Zo blijven artikelen bijvoorbeeld in uw winkelwagentje liggen. We kunnen deze cookies zonder uw toestemming plaatsen.</p>
          <p class="mt-2"><strong>5.2 Analytische cookies:</strong> We gebruiken analytische cookies om de website-ervaring voor onze gebruikers te optimaliseren. Met deze cookies krijgen we inzicht in het gebruik van onze website. We vragen uw toestemming voordat we ze plaatsen.</p>
          <p class="mt-2"><strong>5.3 Marketing- / Trackingcookies:</strong> Marketing-/trackingcookies worden gebruikt om gebruikersprofielen aan te maken om gepersonaliseerde advertenties te tonen of om de gebruiker op deze of over meerdere websites te volgen voor soortgelijke marketingdoeleinden.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">6. Geplaatste Cookies</h4>
          <p>Onze website maakt gebruik van diensten zoals <strong>Stripe</strong> (betalingsverwerking), <strong>WooCommerce</strong> (winkelwagenfunctionaliteit), <strong>Google Analytics</strong> (statistieken) en <strong>WordPress / LiteSpeed</strong> (technische optimalisatie) om een uitstekende winkelervaring te garanderen. De volledige lijst van geplaatste diensten en hun toestemmingsstatus kan op elk moment worden bekeken via de cookie-toestemmingsbanner.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">7. Toestemming</h4>
          <p>Wanneer u onze website voor het eerst bezoekt, tonen we u een pop-up met uitleg over cookies. Zodra u op "Instellingen opslaan" klikt, geeft u ons toestemming om alle geselecteerde categorieën cookies en plug-ins te gebruiken. U kunt cookies uitschakelen via uw browser.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">8. In-/uitschakelen en Verwijderen van Cookies</h4>
          <p>U kunt uw internetbrowser gebruiken om cookies automatisch of handmatig te verwijderen of om een melding te ontvangen telkens wanneer er een cookie wordt geplaatst. Houd er rekening mee dat onze website mogelijk niet goed werkt als alle cookies zijn uitgeschakeld.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">9. Uw Rechten met Betrekking tot Persoonsgegevens</h4>
          <p>U heeft het recht om te weten waarom uw persoonsgegevens nodig zijn, wat ermee gebeurt en hoe lang ze worden bewaard. U heeft ook recht op inzage, rectificatie, verwijdering, beperking van verwerking, overdraagbaarheid van gegevens en bezwaar. Neem contact met ons op om deze rechten uit te oefenen.</p>
        </div>

        <div>
          <h4 class="font-bold text-base text-stone-900 border-b border-stone-100 pb-1 mb-2">10. Contactgegevens</h4>
          <p>Voor vragen en/of opmerkingen over ons cookiebeleid en deze verklaring kunt u contact met ons opnemen via:</p>
          <div class="mt-2 bg-stone-50 p-4 rounded border border-stone-100 text-xs">
            <p class="font-bold text-stone-900">barigroup.net</p>
            <p>Eigenaar: <strong>Kamal Abdalbary</strong></p>
            <p>Zeppelinstraße 62, 52068 Aachen, Duitsland</p>
            <p>Website: <strong>https://barigroup.net</strong></p>
            <p>E-mail: <strong>service@barigroup.net</strong></p>
            <p>Telefoonnummer: <strong>+49 152524 11886</strong></p>
          </div>
        </div>
      </div>
    `
  }
};

export default function Footer() {
  const [currentLang, setCurrentLang] = useState<Locale>('de');
  const [modalType, setModalType] = useState<'imprint' | 'contact' | 'agb' | 'cookies' | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const syncLang = () => {
    const savedLang = localStorage.getItem('lang') as Locale;
    if (savedLang && ['de', 'fr', 'en', 'ar', 'nl'].includes(savedLang)) {
      setCurrentLang(savedLang);
    }
  };

  useEffect(() => {
    syncLang();
    window.addEventListener('language-changed', syncLang);
    return () => {
      window.removeEventListener('language-changed', syncLang);
    };
  }, []);

  const t = footerTranslations[currentLang] || footerTranslations.de;
  const impressum = impressumDetails[currentLang] || impressumDetails.de;
  const agb = agbDetails[currentLang] || agbDetails.de;
  const cookies = cookieDetails[currentLang] || cookieDetails.de;
  const isRtl = currentLang === 'ar';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSuccess(false), 5000);
    }
  };

  return (
    <footer className="relative bg-white border-t-[5px] border-[#0F8A5F] mt-20 pt-16 pb-12 w-full text-stone-700 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Column 1: Logo & About */}
        <div className="space-y-6 flex flex-col justify-start">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-serif font-black tracking-wider text-[#0F8A5F]">BariStyle</span>
          </Link>
          <p className="text-xs text-stone-500 leading-relaxed font-medium">
            {t.desc}
          </p>
          {/* Golden Social Icons */}
          <div className={`flex gap-3 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-white transition duration-300 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8H7v3h2v9h3v-9h3.3l.7-3H12V6c0-.9.7-1 1-1h2V2h-3C9.8 2 9 3.8 9 5.8V8z"/>
              </svg>
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-white transition duration-300 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.1c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .5 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.5 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.5-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.5-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.3-1.8.5-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.5 1.3-.1 1.7-.1 4.9-.1zM12 0C8.7 0 8.3 0 7 0c-1.3.1-2.2.3-3 .6-.8.3-1.5.7-2.1 1.4-.7.6-1.1 1.3-1.4 2.1-.3.8-.5 1.7-.6 3-.1 1.3-.1 1.7-.1 5s0 3.7.1 5c.1 1.3.3 2.2.6 3 .3.8.7 1.5 1.4 2.1.6.7 1.3 1.1 2.1 1.4.8.3 1.7.5 3 .6 1.3.1 1.7.1 5 .1s3.7 0 5-.1c1.3-.1 2.2-.3 3-.6.8-.3 1.5-.7 2.1-1.4.7-.6 1.1-1.3 1.4-2.1.3-.8.5-1.7.6-3 .1-1.3.1-1.7.1-5s0-3.7-.1-5c-.1-1.3-.3-2.2-.6-3-.3-.8-.7-1.5-1.4-2.1-.6-.7-1.3-1.1-2.1-1.4-.8-.3-1.7-.5-3-.6-1.3-.1-1.7-.1-5-.1z"/>
                <path d="M12 5.8c-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2-2.8-6.2-6.2-6.2zm0 10.3c-2.3 0-4.1-1.8-4.1-4.1s1.8-4.1 4.1-4.1 4.1 1.8 4.1 4.1-1.8 4.1-4.1 4.1z"/>
                <circle cx="18.4" cy="5.6" r="1.4" fill="currentColor"/>
              </svg>
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-white transition duration-300 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.5 6.2c-.3-1.2-1.2-2.1-2.4-2.4C19 3.3 12 3.3 12 3.3s-7 0-9.1.5C1.7 4.1.8 5 .5 6.2.1 8.3.1 12.6.1 12.6s0 4.3.4 6.4c.3 1.2 1.2 2.1 2.4 2.4 2.1.5 9.1.5 9.1.5s7 0 9.1-.5c1.2-.3 2.1-1.2 2.4-2.4.4-2.1.4-6.4.4-6.4s0-4.3-.4-6.4zM9.6 16.3V8.9l6.4 3.7-6.4 3.7z"/>
              </svg>
            </a>
            <a 
              href="https://pinterest.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-white transition duration-300 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 5 3.1 9.3 7.6 11-.1-.9-.2-2.4 0-3.4.2-1 1.4-6 1.4-6s-.3-.7-.3-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-3 1.3-1.1 2.6 1.1 2.6 4 0 7.1-4.2 7.1-10.2 0-5.3-3.8-9-9.3-9-6.3 0-10 4.7-10 9.6 0 1.9.7 4 1.7 5.2.2.2.2.4.1.7l-.6 2.4c-.1.4-.3.5-.7.3-2.6-1.2-4.2-5-4.2-8.1 0-7 5.1-13.4 14.7-13.4 7.7 0 13.7 5.5 13.7 12.8 0 7.7-4.8 13.9-11.6 13.9-2.3 0-4.4-1.2-5.1-2.6 0 0-1.1 4.3-1.4 5.3-.5 1.9-1.9 4.3-2.8 5.7C9.8 23.8 10.9 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z"/>
              </svg>
            </a>
            <a 
              href="https://tiktok.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full border border-[#D4AF37] text-[#D4AF37] flex items-center justify-center hover:bg-[#D4AF37] hover:text-white transition duration-300 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.5 0v16.5a3.5 3.5 0 1 1-3.5-3.5h1v-4a7.5 7.5 0 1 0 6.5 7.4h-4a3.5 3.5 0 0 1-3.5-3.4v.1a3.5 3.5 0 0 1 3.5-3.5v-5a7.5 7.5 0 0 0 4 7.5v-3.5a11.5 11.5 0 0 1-4-4V0h-4z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Shop Links */}
        <div>
          <h4 className="text-base font-bold text-[#0F8A5F] mb-6 uppercase tracking-wider">{t.col1_title}</h4>
          <ul className="space-y-3.5 text-xs font-semibold text-stone-500">
            <li><Link href="/shop" className="hover:text-stone-900 transition-colors">Shop</Link></li>
            <li><Link href="/profile" className="hover:text-stone-900 transition-colors">{t.col1_account}</Link></li>
            <li><Link href="/checkout" className="hover:text-stone-900 transition-colors">{t.col1_cart}</Link></li>
            <li><Link href="/wholesale" className="hover:text-stone-900 transition-colors">{t.col1_wholesale}</Link></li>
            <li>
              <button onClick={() => setModalType('contact')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">
                {t.col1_about}
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Important Pages */}
        <div>
          <h4 className="text-base font-bold text-[#0F8A5F] mb-6 uppercase tracking-wider">{t.col3_title}</h4>
          <ul className="space-y-3.5 text-xs font-semibold text-stone-500">
            <li><button onClick={() => setModalType('imprint')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">{t.col3_membership}</button></li>
            <li><button onClick={() => setModalType('imprint')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">{t.col3_privacy}</button></li>
            <li><button onClick={() => setModalType('imprint')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">{t.col3_certs}</button></li>
            <li><button onClick={() => setModalType('imprint')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">{t.col3_withdrawal}</button></li>
            <li>
              <button 
                onClick={() => setModalType('contact')} 
                className="text-[#D4AF37] hover:text-[#c49f27] font-extrabold uppercase transition-colors text-left focus:outline-none"
              >
                ★ {t.col3_contact}
              </button>
            </li>
            <li><button onClick={() => setModalType('imprint')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">{t.col3_imprint}</button></li>
            <li><button onClick={() => setModalType('agb')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">{t.col3_terms}</button></li>
            <li><button onClick={() => setModalType('cookies')} className="hover:text-stone-900 transition-colors text-left focus:outline-none">{t.col3_cookies}</button></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div>
          <h4 className="text-base font-bold text-[#0F8A5F] mb-6 uppercase tracking-wider">{t.col4_title}</h4>
          <p className="text-xs text-stone-500 leading-relaxed mb-6 font-medium">
            {t.col4_desc}
          </p>
          <form onSubmit={handleSubscribe} className="space-y-3">
            <div className="relative">
              <input 
                type="email" 
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder={t.col4_placeholder} 
                className="w-full border border-stone-200 rounded-sm px-3.5 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0F8A5F] bg-stone-50/50"
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#0F8A5F] text-white py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#0c6e4c] transition shadow-xs"
            >
              {t.col4_btn}
            </button>
            {newsletterSuccess && (
              <p className="text-xs text-emerald-600 font-bold text-center mt-2 animate-pulse">{t.col4_success}</p>
            )}
          </form>
        </div>

      </div>

      {/* Copyright Footer Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center text-xs text-stone-400 gap-4">
        <p className="font-semibold">{t.copyright}</p>
        <div className="flex gap-4 font-mono font-bold text-[10px] text-stone-400">
          <span>CURRENCY: EUR (€)</span>
          <span>REGION: GERMANY (EU)</span>
        </div>
      </div>

      {/* Impressum, Contact & AGB Premium Modal Overlay */}
      {modalType && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`bg-white rounded-lg shadow-2xl border border-stone-100 w-full ${modalType === 'contact' ? 'max-w-lg' : 'max-w-2xl'} overflow-hidden relative animate-in zoom-in-95 duration-200`}>
            {/* Modal Header */}
            <div className="bg-[#0F8A5F] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                {modalType === 'imprint' ? (
                  <Shield className="w-5 h-5 text-emerald-200" />
                ) : modalType === 'agb' ? (
                  <FileText className="w-5 h-5 text-emerald-200" />
                ) : modalType === 'cookies' ? (
                  <Shield className="w-5 h-5 text-emerald-200" />
                ) : (
                  <Phone className="w-5 h-5 text-emerald-200" />
                )}
                {modalType === 'imprint' 
                  ? impressum.title 
                  : modalType === 'agb' 
                    ? agb.title 
                    : modalType === 'cookies'
                      ? cookies.title
                      : (currentLang === 'ar' ? 'بيانات الاتصال والتواصل' : 'Contact Information')}
              </h3>
              <button 
                onClick={() => setModalType(null)} 
                className="text-white hover:text-stone-200 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {modalType === 'imprint' ? (
                <div dangerouslySetInnerHTML={{ __html: impressum.content }}></div>
              ) : modalType === 'agb' ? (
                <div dangerouslySetInnerHTML={{ __html: agb.content }}></div>
              ) : modalType === 'cookies' ? (
                <div dangerouslySetInnerHTML={{ __html: cookies.content }}></div>
              ) : (
                /* Contact details modal */
                <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-4 border-b border-stone-100 pb-3">
                    <div className="p-2.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{currentLang === 'ar' ? 'رقم الهاتف المباشر' : 'Direct Support Hotline'}</p>
                      <p className="text-base font-extrabold text-stone-900" dir="ltr">+49 152524 11886</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-b border-stone-100 pb-3">
                    <div className="p-2.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{currentLang === 'ar' ? 'البريد الإلكتروني للدعم' : 'Email Support Channel'}</p>
                      <p className="text-base font-extrabold text-[#0F8A5F]">service@barigroup.net</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{currentLang === 'ar' ? 'العنوان الجغرافي والفرعي' : 'HQ Physical Address'}</p>
                      <p className="text-sm font-semibold text-stone-700">Zeppelinstraße 62, 52068 Aachen, Deutschland</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 bg-stone-50/50 p-4 rounded-lg flex items-center gap-3 mt-4">
                    <Shield className="w-6 h-6 text-emerald-600 shrink-0" />
                    <p className="text-xs text-stone-500 leading-normal">
                      {currentLang === 'ar' 
                        ? 'موقع باري ستايل يعمل تحت رعاية وإدارة مجموعة barigroup.net الرسمية، جميع الضمانات والتعاقدات خاضعة للقوانين الفيدرالية في جمهورية ألمانيا الاتحادية.'
                        : 'BariStyle is owned and operated by barigroup.net. All wholesale contracts and B2B distributions are legally backed and fully compliance-secured under German federal laws.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 border-t border-stone-100 px-6 py-4 flex justify-end">
              <button 
                onClick={() => setModalType(null)} 
                className="bg-stone-900 text-white px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors focus:outline-none"
              >
                {currentLang === 'ar' ? 'إغلاق النافذة' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
