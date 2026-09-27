"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, FileText } from "lucide-react";
import { translations, Locale } from "../../utils/i18n";

export default function TermsPage() {
  const [lang, setLang] = useState<Locale>('de');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Locale;
    if (saved && ['de', 'en', 'ar', 'fr', 'nl'].includes(saved)) {
      setLang(saved);
    }
  }, []);

  const isRtl = lang === 'ar';

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-stone-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-12 rounded-2xl shadow-sm border border-stone-200">
        <Link href="/checkout" className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-900 transition mb-6 uppercase tracking-wider">
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          {lang === 'ar' ? 'العودة إلى الدفع' : lang === 'de' ? 'Zurück zur Kasse' : 'Back to Checkout'}
        </Link>

        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100">
          <div className="w-12 h-12 bg-stone-100 text-stone-900 rounded-xl flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {lang === 'ar' ? 'الشروط والأحكام العامة (AGB)' : 'Allgemeine Geschäftsbedingungen (AGB)'}
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              barigroup.net • BS Baristore • Stand: 2026
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-stone-700 font-sans">
          <section className="bg-stone-50 p-4 rounded-xl border border-stone-200/70">
            <h2 className="font-bold text-stone-900 text-base mb-2">1. Geltungsbereich & Anbieter</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Lieferung von Waren, die Verbraucher oder Unternehmer mit dem Anbieter <strong>barigroup.net (Inhaber: Kamal Abdalbary, Zeppelinstraße 62, 52068 Aachen, Deutschland, USt-IdNr.: DE436103705)</strong> über den Online-Shop <strong>baristore.de</strong> schließen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-stone-900 text-base mb-2">2. Vertragsschluss & Button-Lösung (§ 312j BGB)</h2>
            <p>
              Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung dar. Durch Anklicken des Bestellbuttons <em>„Zahlungspflichtig bestellen“</em> geben Sie ein verbindliches Angebot zum Kauf der im Warenkorb enthaltenen Waren ab. Die Bestätigung des Eingangs der Bestellung erfolgt unmittelbar nach dem Absenden durch eine automatisierte E-Mail.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-stone-900 text-base mb-2">3. Preise, Versandkosten & Mehrwertsteuer</h2>
            <p>
              Alle angegebenen Preise sind Endpreise in Euro (€) und enthalten die jeweils gültige gesetzliche deutsche Mehrwertsteuer (i.d.R. 19% MwSt.). Zusätzlich zu den angegebenen Preisen berechnen wir Versandkosten gemäß der im Bestellvorgang ausgewählten Versandart (z. B. versicherter DHL-Versand). Ab einem Bestellwert von 50 € liefern wir innerhalb Deutschlands versandkostenfrei.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-stone-900 text-base mb-2">4. Zahlungsmethoden</h2>
            <p>
              In unserem Shop stehen Ihnen grundsätzlich folgende Zahlungsarten zur Verfügung:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
              <li><strong>PayPal Express:</strong> Zahlung über den Online-Anbieter PayPal mit vollem Käuferschutz.</li>
              <li><strong>Kreditkarte (Visa, Mastercard, Maestro, AMEX):</strong> Sichere SSL-Verschlüsselung über Stripe.</li>
              <li><strong>Klarna (Rechnung & Ratenkauf):</strong> Erst prüfen, später bezahlen.</li>
              <li><strong>Apple Pay & Google Pay:</strong> Schnelle und sichere 1-Klick-Zahlung über Ihr Endgerät.</li>
              <li><strong>Sofortüberweisung / giropay / EPS:</strong> Direkte Überweisung über Ihr Online-Banking.</li>
            </ul>
          </section>

          <section className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80">
            <h2 className="font-bold text-emerald-950 text-base mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              5. Gesetzliches Widerrufsrecht (14 Tage)
            </h2>
            <p className="text-emerald-900 text-xs leading-relaxed">
              Verbrauchern steht das gesetzliche 14-tägige Widerrufsrecht zu. Ausführliche Informationen zu den Voraussetzungen, Fristen und zur Ausübung des Widerrufs sowie das Muster-Widerrufsformular finden Sie auf unserer separaten Seite:{" "}
              <Link href="/widerrufsbelehrung" className="font-bold underline text-emerald-800 hover:text-black">
                Widerrufsbelehrung & Rückgabeformular
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-stone-900 text-base mb-2">6. Gewährleistung & Haftung</h2>
            <p>
              Es gelten die gesetzlichen Mängelhaftungsrechte des deutschen Bürgerlichen Gesetzbuches (BGB). Die Verjährungsfrist für gesetzliche Mängelansprüche beträgt bei Neuwaren zwei Jahre ab Erhalt der Ware.
            </p>
          </section>

          <section className="border-t border-stone-100 pt-4 text-xs text-stone-500">
            <p>
              <strong>Kontakt für Reklamationen und Support:</strong><br />
              barigroup.net • Zeppelinstraße 62, 52068 Aachen<br />
              E-Mail: service@barigroup.net • Telefon: +49 152524 11886
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
