"use client";

/**
 * Vayra API konsolu kabuğu — "rafine ray" (2026-10-28, onaylanan A):
 * cümle düzeninde grup başlıklı sol menü, kayan seçim zemini, Ctrl+K paleti,
 * altta nötr ortam seçici + canlı durum + bakiye (2026-10-29 sakin cam). Mobilde yatay şerit.
 */

import Link from "next/link";
import { KrediIsiltiHap } from "@/components/ui/KrediHap";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutGroup, motion, MotionConfig } from "framer-motion";
import {
  Activity, AlertTriangle, BookOpen, Boxes, Code2, CreditCard, Gauge, GitCommitHorizontal, GitCompare, KeyRound, LayoutDashboard,
  ListTree, Radio, ScrollText, Search, Shapes, Sparkles, Terminal, Webhook,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { useApiSenkron, apiIstek } from "@/lib/api/istemci";
import { kesfetFont } from "@/components/kesfet/font";
import { KomutPaleti } from "./KomutPaleti";
import { OrtamSecici } from "./ui";
import { cn } from "@/lib/utils";

type Oge = { ad: string; href: string; ikon: React.ElementType; tam?: boolean; yeni?: boolean };

export const API_MENU: { baslik?: string; ogeler: Oge[] }[] = [
  { ogeler: [{ ad: "Genel bakış", href: "/panel/api", ikon: LayoutDashboard, tam: true }] },
  { baslik: "Geliştir", ogeler: [
    { ad: "Modeller", href: "/panel/api/modeller", ikon: Shapes },
    { ad: "Karşılaştır", href: "/panel/api/karsilastir", ikon: GitCompare, yeni: true },
    { ad: "Konsol", href: "/panel/api/konsol", ikon: Terminal },
    { ad: "İstekler", href: "/panel/api/istekler", ikon: ListTree },
  ] },
  { baslik: "Yapılandır", ogeler: [
    { ad: "Anahtarlar", href: "/panel/api/anahtarlar", ikon: KeyRound },
    { ad: "Webhook'lar", href: "/panel/api/webhooklar", ikon: Webhook },
    { ad: "Hız limitleri", href: "/panel/api/hiz-limitleri", ikon: Gauge },
  ] },
  { baslik: "Hesap", ogeler: [
    { ad: "Kullanım", href: "/panel/api/kullanim", ikon: Activity },
    { ad: "Faturalama", href: "/panel/api/faturalama", ikon: CreditCard },
    { ad: "Denetim kaydı", href: "/panel/api/denetim", ikon: ScrollText, yeni: true },
  ] },
  { baslik: "Dokümantasyon", ogeler: [
    { ad: "Başlangıç ve referans", href: "/panel/api/dokuman", ikon: BookOpen },
    { ad: "SDK'lar", href: "/panel/api/sdk", ikon: Boxes },
    { ad: "Örnekler", href: "/panel/api/ornekler", ikon: Sparkles },
    { ad: "Hata kodları", href: "/panel/api/hatalar", ikon: AlertTriangle },
    { ad: "Değişiklikler", href: "/panel/api/degisiklikler", ikon: GitCommitHorizontal },
    { ad: "Durum", href: "/panel/api/durum", ikon: Radio },
  ] },
];
const TUM = API_MENU.flatMap((b) => b.ogeler);

function useCanliDurum() {
  const [d, setD] = useState<{ ok: boolean | null; ms: number | null }>({ ok: null, ms: null });
  useEffect(() => {
    let iptal = false;
    const olc = async () => {
      const r = await apiIstek(null, "GET", "/ping", { kaydetme: true });
      if (iptal) return;
      const ok = r.durum === 200;
      setD({ ok, ms: r.sureMs });
      useApiAnahtar.getState().olcumEkle({ zaman: Date.now(), ms: r.sureMs, ok });
    };
    void olc();
    const t = setInterval(() => { if (document.visibilityState === "visible") void olc(); }, 60_000);
    return () => { iptal = true; clearInterval(t); };
  }, []);
  return d;
}

export function CloudKabuk({ children }: { children: ReactNode }) {
  const path = usePathname();
  const krediler = useAuth((s) => s.kullanici?.krediler);
  const sonSenkron = useApiAnahtar((s) => s.sonSenkron);
  const durum = useCanliDurum();
  const [palet, setPalet] = useState(false);
  useApiSenkron();
  const aktif = (o: Oge) => (o.tam ? path === o.href : path === o.href || path.startsWith(o.href + "/"));

  // Ctrl+K / ⌘K: konsolun kendi Ctrl+Enter'ıyla çakışmaz
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); e.stopPropagation(); setPalet((v) => !v); }
    };
    window.addEventListener("keydown", f, true);
    return () => window.removeEventListener("keydown", f, true);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("api-kapsam kesfet-tema flex min-h-[calc(100vh-var(--ust-nav))] bg-zemin", kesfetFont.variable)}>
        <aside className="sticky top-[var(--ust-nav)] hidden h-[calc(100vh-var(--ust-nav))] w-[248px] shrink-0 flex-col border-r border-white/[0.06] lg:flex">
          <div className="px-3 pt-4">
            <Link href="/panel/api" className="flex items-center gap-2.5 rounded-[12px] px-2 py-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#55d6fd] text-[#06222b]"><Code2 className="h-4 w-4" /></span>
              <span className="leading-tight"><span className="block text-[14px] font-semibold text-white">Vayra API</span><span className="text-[12px] text-metin-2">v1 · REST</span></span>
            </Link>
            <button onClick={() => setPalet(true)} className="mt-3 flex h-9 w-full items-center gap-2 rounded-full bg-white/[0.04] px-3 text-[13px] text-metin-2 ring-1 ring-white/[0.08] transition hover:text-white hover:ring-white/[0.16]">
              <Search className="h-3.5 w-3.5" />Ara<kbd className="ml-auto">Ctrl K</kbd>
            </button>
          </div>
          <LayoutGroup id="api-menu">
            <nav aria-label="API" className="mt-2 min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-6 pt-3 [mask-image:linear-gradient(180deg,transparent,black_16px,black_calc(100%-24px),transparent)] [scrollbar-width:none]">
              {API_MENU.map((b, i) => (
                <div key={i}>
                  {b.baslik && <p className="mb-1 px-2.5 text-[12.5px] text-metin-2">{b.baslik}</p>}
                  {b.ogeler.map((o) => {
                    const a = aktif(o);
                    return (
                      <Link key={o.href} href={o.href} aria-current={a ? "page" : undefined}
                        className={cn("relative flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] transition-colors", a ? "text-white" : "text-metin-2 hover:bg-white/[0.03] hover:text-white")}>
                        {a && <motion.span layoutId="api-menu-z" className="absolute inset-0 rounded-[10px] bg-white/[0.08] ring-1 ring-white/[0.08]" transition={{ type: "spring", damping: 32, stiffness: 420 }} />}
                        <o.ikon className={cn("relative h-4 w-4 shrink-0", a && "text-[#55d6fd]")} />
                        <span className="relative truncate">{o.ad}</span>
                        {o.yeni && <span className="relative ml-auto rounded-full bg-[#55d6fd]/15 px-1.5 text-[10.5px] text-[#55d6fd]">Yeni</span>}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </LayoutGroup>
          <div className="m-3 space-y-3 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-white/[0.07]">
            <OrtamSecici id="ortam-ray" tam />
            <div className="flex items-center justify-between gap-2 px-1">
              <Link href="/panel/api/durum" className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-white/70 transition hover:text-white" title={sonSenkron ? `Son senkron ${new Date(sonSenkron).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : undefined}>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  {durum.ok && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/50" />}
                  <span className={cn("relative h-1.5 w-1.5 rounded-full", durum.ok === null ? "bg-white/30" : durum.ok ? "bg-emerald-400" : "bg-rose-400")} />
                </span>
                <span className="truncate">{durum.ok === null ? "Ölçülüyor" : durum.ok ? "Çalışıyor" : "Ulaşılamıyor"}{durum.ms !== null ? ` · ${durum.ms} ms` : ""}</span>
              </Link>
            </div>
            {krediler !== undefined && <KrediIsiltiHap deger={krediler} href="/panel/kredi?sekme=kredi" />}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobil: arama + ortam + bölüm şeridi */}
          <div className="border-b border-white/[0.06] lg:hidden">
            <div className="flex items-center gap-2 px-4 pt-3">
              <button onClick={() => setPalet(true)} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-3 text-[13px] text-metin-2 ring-1 ring-white/[0.08]"><Search className="h-3.5 w-3.5" />API&apos;de ara</button>
              <OrtamSecici id="ortam-mobil" />
            </div>
            <LayoutGroup id="api-mobil">
              <nav aria-label="API bölümleri" className="flex gap-1 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
                {TUM.map((o) => { const a = aktif(o); return (
                  <Link key={o.href} href={o.href} aria-current={a ? "page" : undefined} className={cn("relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px]", a ? "font-medium text-black" : "text-metin-2")}>
                    {a && <motion.span layoutId="api-mobil-z" className="absolute inset-0 rounded-full bg-white" />}
                    <o.ikon className="relative h-3.5 w-3.5" /><span className="relative">{o.ad}</span>
                  </Link>
                ); })}
              </nav>
            </LayoutGroup>
          </div>
          <div className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-6 sm:px-8 sm:pt-9">{children}</div>
        </div>
      </div>
      <KomutPaleti acik={palet} onKapat={() => setPalet(false)} sayfalar={TUM} />
    </MotionConfig>
  );
}
