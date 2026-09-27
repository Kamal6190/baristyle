"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Locale } from "../../utils/i18n";

export default function PrivacyPage() {
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
            <Lock className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              {lang === 'ar' ? 'سياسة الخصوصية وحماية البيانات (DSGVO)' : 'Datenschutzerklärung (DSGVO)'}
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-1">
              barigroup.net • BS Baristore • Datenschutz nach EU-DSGVO
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-stone-700 font-sans">
          <section className="bg-stone-50 p-4 rounded-xl border border-stone-200/70">
            <h2 className="font-bold text-stone-900 text-base mb-2">1. Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:<br />
              <strong>barigroup.net (Inhaber: Kamal Abdalbary)</strong><br />
              Zeppelinstraße 62, 52068 Aachen, Deutschland<br />
              E-Mail: service@barigroup.net • Telefon: +49 152524 11886
            </p>
          </section>

          <section>
            <h2 className="font-bold text-stone-900 text-base mb-2">2. Erhebung & Verarbeitung personenbezogener Daten</h2>
            <p>
              Wir erheben personenbezogene Daten (z. B. Name, Lieferadresse, E-Mail-Adresse, Telefonnummer), wenn Sie uns diese im Rahmen Ihrer Warenbestellung oder Kontaktaufnahme freiwillig mitteilen. Die Daten werden ausschließlich zur Bestellabwicklung, Rechnungsstellung und Zustellung durch unsere Logistikpartner (z. B. Deutsche Post DHL) verwendet.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-stone-900 text-base mb-2">3. Zahlungsdienstleister (Stripe & PayPal)</h2>
            <p>
              Zur sicheren Zahlungsabwicklung arbeiten wir mit zertifizierten Zahlungsdienstleistern zusammen (Stripe Payments Europe, Ltd. und PayPal (Europe) S.à r.l. et Cie, S.C.A.). Ihre Zahlungsdaten (z. B. Kreditkartennummer) werden über verschlüsselte 256-Bit SSL-Verbindungen direkt an die Zahlungsdienstleister übermittelt und zu keinem Zeitpunkt auf unseren Webservern gespeichert.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-stone-900 text-base mb-2">4. Ihre Rechte nach der DSGVO</h2>
            <p>
              Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger sowie das Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Wenden Sie sich hierzu jederzeit an service@barigroup.net.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
