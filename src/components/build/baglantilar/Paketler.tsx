"use client";

import { useState } from "react";
import { Check, Package } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { katalogBul, type KatalogBaglanti } from "@/lib/build/baglantiKatalog";
import { cn } from "@/lib/utils";
import { katalogLogo, type BaglantiAcik } from "./ortak";

/** Hazır bağlantı paketleri: bir işi baştan sona yürütmek için birlikte bağlanan servisler. */
const PAKETLER: { id: string; ad: string; aciklama: string; servisler: string[] }[] = [
  { id: "tr-eticaret", ad: "Türkiye'de online mağaza", aciklama: "Mağaza, pazaryeri, ödeme, fatura, SMS ve kargo: siparişten faturaya bütün akış.", servisler: ["ikas", "trendyol", "n11", "shopier", "iyzico", "paytr", "parasut", "nilvera", "netgsm", "geliver", "basit-kargo"] },
  { id: "gelistirici", ad: "Yazılım ekibi", aciklama: "Kod, dağıtım, veritabanı, hata takibi ve görevler tek yerde.", servisler: ["github", "vercel", "supabase", "sentry", "linear", "context7", "cloudflare", "neon"] },
  { id: "pazarlama", ad: "Büyüme ve pazarlama", aciklama: "Kampanya, e-posta, analitik ve SEO verisini birlikte oku, rapor çıkar.", servisler: ["hubspot", "klaviyo", "mailerlite", "posthog", "mixpanel", "ahrefs", "similarweb", "typeform", "insider", "netmera"] },
  { id: "destek", ad: "Müşteri desteği", aciklama: "Konuşmalar, yardım makaleleri ve ekip içi iletişim.", servisler: ["intercom", "slack", "notion", "guru", "pylon", "zoom", "gmail"] },
  { id: "finans-tr", ad: "Finans ve muhasebe", aciklama: "Muhasebe, e-fatura, banka ve piyasa verisi; ay sonu kapanışına hazır.", servisler: ["parasut", "bizimhesap", "nilvera", "turkcell-e-sirket", "papara", "akbank", "tcmb-evds", "stripe", "xero"] },
  { id: "yaratici", ad: "Yaratıcı üretim", aciklama: "Tasarım, görsel, ses ve sunum araçları birlikte.", servisler: ["canva", "figma", "adobe", "elevenlabs", "unsplash", "miro", "gamma"] },
];

/** Paketler kartı: her paketin servisleri logo sırasıyla; bağlı olanlar işaretli, tıklayınca servisin ayrıntısı açılır. */
export function PaketlerKarti({ bagli, ac }: { bagli: (id: string) => BaglantiAcik | undefined; ac: (k: KatalogBaglanti) => void }) {
  const [secili, setSecili] = useState(PAKETLER[0].id);
  const l = PAKETLER.map((p) => ({ ...p, k: p.servisler.map((id) => katalogBul(id)).filter((x): x is KatalogBaglanti => !!x) })).filter((p) => p.k.length >= 3);
  const p = l.find((x) => x.id === secili) ?? l[0];
  if (!p) return null;
  const bagliSayi = p.k.filter((k) => bagli(k.id)?.durum === "etkin").length;
  return (
    <Kart ikon={Package} baslik="Paketler" alt="Bir işi baştan sona yürütmek için birlikte bağlanan servisler" govde="p-4 sm:p-5">
      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none]">
        {l.map((x) => (
          <button key={x.id} type="button" onClick={() => setSecili(x.id)} aria-pressed={x.id === p.id}
            className={cn("h-9 shrink-0 rounded-full px-3.5 text-[12.5px] font-medium transition-colors", x.id === p.id ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/60 ring-1 ring-inset ring-white/[0.07] hover:text-white")}>{x.ad}</button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="min-w-[220px] flex-1 text-[13px] leading-relaxed text-white/60">{p.aciklama}</p>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] tabular-nums text-white/60">{bagliSayi} / {p.k.length} bağlı</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {p.k.map((k) => { const b = bagli(k.id); const ok = b?.durum === "etkin"; return (
          <button key={k.id} type="button" onClick={() => ac(k)} className="flex min-w-0 items-center gap-2.5 rounded-[16px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]">
            {katalogLogo(k, undefined, 34)}
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">{k.ad}</span><span className={cn("flex items-center gap-1 text-[11.5px]", ok ? "text-[#8be6ff]" : b ? "text-amber-200/90" : "text-white/45")}>{ok ? <><Check className="h-3 w-3" />Bağlı</> : b ? "Düzeltilmeli" : k.yol === "rest" ? "REST API" : k.adaptor ? "Vayra adaptörü" : "Bağla"}</span></span>
          </button>
        ); })}
      </div>
    </Kart>
  );
}
