import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { VayraToaster } from "@/components/kabuk/VayraToaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/* Teknik yüzeylerin sesi: navigasyon kanal etiketleri, sayaçlar, kod/ID
   alanları. Kurgu masası ve stüdyo cihazı dilinden geliyor — Vayra'nın işi
   film üretmek olduğu için arayüz de o dili konuşuyor. */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Vayra — Yapay Zeka ile Sinematik Görsel, Video, 3D ve Ses",
    template: "%s · Vayra",
  },
  description:
    "Vayra; tek panelde sinematik AI video, editorial görsel, 3D modelleme ve stüdyo kalitesinde ses üretimi. Fikirden yayına, saniyeler içinde.",
  metadataBase: new URL("https://vayra.ai"),
  keywords: ["yapay zeka video", "AI görsel", "3D modelleme", "ses üretimi", "sinematik AI", "Vayra"],
  applicationName: "Vayra",
  authors: [{ name: "Vayra" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Vayra",
    title: "Vayra — Yapay Zeka ile Sinematik Görsel, Video, 3D ve Ses",
    description: "Tek panelde AI video, görsel, 3D ve ses. Fikirden yayına, saniyeler içinde.",
    url: "https://vayra.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vayra — Yapay Zeka Yaratım Stüdyosu",
    description: "Tek panelde AI video, görsel, 3D ve ses. Fikirden yayına, saniyeler içinde.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
    apple: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Vayra",
    statusBarStyle: "black-translucent",
  },
};

// Next.js 15: themeColor + viewport ayrı export. Tarayıcı adres çubuğu cyan olur.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#22d3ee" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // JSON-LD yapılandırılmış veri — arama motorları zengin snippet (Organization + WebSite) gösterir.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://vayra.ai/#organization",
        name: "Vayra",
        url: "https://vayra.ai",
        logo: "https://vayra.ai/apple-icon",
        description: "Tek panelde sinematik AI video, editorial görsel, 3D modelleme ve stüdyo kalitesinde ses üretimi.",
        sameAs: [] as string[],
      },
      {
        "@type": "WebSite",
        "@id": "https://vayra.ai/#website",
        url: "https://vayra.ai",
        name: "Vayra",
        publisher: { "@id": "https://vayra.ai/#organization" },
        inLanguage: "tr-TR",
      },
    ],
  };
  return (
    <html lang="tr" className={`${inter.variable} ${mono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* NOT: `grain` sınıfı kaldırıldı — tüm ekranı kaplayan fraktal gürültü katmanı
          (position:fixed, z-50) koyu zemin ve kutuların üstünde kirli/"çamurlu" gri bir
          sis oluşturuyordu. Higgsfield'de böyle bir doku YOK; yüzeyler temiz düz renktir. */}
      {/* Toaster KÖKTE: landing/keşfet/iletişim/geliştirici gibi panel-dışı
          sayfalar da toast.* çağırıyor. Daha önce Toaster yalnızca /panel
          kabuğunda mount ediliyordu; bu yüzden o sayfalardaki bildirimler
          HİÇ görünmüyordu (sessiz kayıp). Artık tek merkezde. */}
      <body className="antialiased">
        {children}
        <VayraToaster />
      </body>
    </html>
  );
}
