import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Script from "next/script";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import LivePurchaseNotification from "../components/LivePurchaseNotification";
import Buy2Get1PopupModal from "../components/Buy2Get1PopupModal";
import GoogleAutoTranslate from "../components/GoogleAutoTranslate";
import AxiosInterceptor from "../components/AxiosInterceptor";
import AnalyticsTracker from "../components/AnalyticsTracker";
import { WishlistProvider } from "../components/WishlistProvider";
import BariAgentWidget from "../components/BariAgentWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://baristore.de'),
  title: "BS Baristore | Universal E-Commerce & Marketplace",
  description: "Online-Shop für Software, Lizenzen, Elektronik & mehr. B2B Großhandel & Einzelhandel in Deutschland. Sofortlieferung per E-Mail bei Digitalprodukten.",
  keywords: 'BS Baristore, online shop Germany, Software kaufen, Office 2024 kaufen, Windows 11 kaufen, digitale Lizenzen, B2B Großhandel Deutschland',
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://baristore.de',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BS Baristore | Universal E-Commerce & Marketplace',
    description: 'Online-Shop für Software, Lizenzen, Elektronik & mehr.',
    images: ['/logo.png'],
  },
  openGraph: {
    title: 'BS Baristore | Universal E-Commerce & Marketplace',
    description: 'Online-Shop für Software, Lizenzen, Elektronik & mehr. B2B Großhandel & Einzelhandel in Deutschland.',
    url: 'https://baristore.de',
    siteName: 'BS Baristore',
    type: 'website',
    locale: 'de_DE',
    images: [{ url: '/logo.png', width: 800, height: 600, alt: 'BS Baristore' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
        {/* Auto Language Detection + Google Translate for dynamic content */}
        <GoogleAutoTranslate />
        <AxiosInterceptor />
        {/* Google Analytics (GA4) & Google Ads */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'G-05QZXRLQ2R'}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-05QZXRLQ2R');
            ${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ? `gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');` : ''}
          `}
        </Script>

        {/* Meta (Facebook) Pixel */}
        {(() => {
          const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "827722363045202";
          return (
            <>
              <Script id="meta-pixel" strategy="afterInteractive">
                {`
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${metaPixelId}');
                  fbq('track', 'PageView');
                `}
              </Script>
              <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  height="1"
                  width="1"
                  style={{ display: "none" }}
                  src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                  alt=""
                />
              </noscript>
            </>
          );
        })()}

        {/* TikTok Pixel */}
        {process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID && (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=d.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
                ttq.load('${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        )}

        <WishlistProvider>
          <Header />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>

          <main className="flex-grow">
            {children}
          </main>

          <Footer />
        </WishlistProvider>
        
        <CookieBanner />
        <LivePurchaseNotification />
        <Buy2Get1PopupModal />
        <BariAgentWidget />
      </body>
    </html>
  );
}
