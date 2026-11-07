"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check, Copy, Plug, X } from "lucide-react";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { api, ApiHatasi } from "@/lib/build/istemci";
import type { KatalogBaglanti } from "@/lib/build/baglantiKatalog";
import { cn } from "@/lib/utils";

export type Izin = "her-zaman" | "sor" | "kapali";
export type McpArac = { name: string; title?: string; description?: string; inputSchema?: Record<string, unknown>; annotations?: { title?: string; readOnlyHint?: boolean; destructiveHint?: boolean } };
export type CagriKaydi = { zaman: number; arac: string; sure: number; basarili: boolean; ozet: string; kaynak: string; yazma?: boolean; cikti?: string };
export type BaglantiAcik = {
  id: string; ad: string; logo?: string; katalogId?: string; url: string; saltOkunur: boolean; sohbette: boolean;
  yetki: { tur: "yok" | "anahtar" | "oauth"; baslik: string; maske?: string; oauthHazir?: boolean; alanlar?: { id: string; deger: string }[]; istemci?: { id: string; gizli: boolean }; tokenBitis?: number; yenilenebilir?: boolean; kayit?: "dcr" | "cimd" | "istemci" };
  basliklar: { ad: string; maske: string }[];
  araclar: McpArac[]; izinler: Record<string, Izin>; durum: "kurulmadi" | "etkin" | "giris-gerekli" | "hata"; hata?: string; sunucu?: { name?: string; version?: string }; sonKontrol?: number;
  kayit: CagriKaydi[]; sablon?: Record<string, string>; kullanim?: { sistemler: boolean; ziyaretci: boolean }; aracYukleme?: "otomatik" | "hepsi" | "istekle";
  sonYenileme?: number; sonBasari?: number; olusturma?: number;
  /* v3 */
  tur?: "mcp" | "rest"; rest?: RestTanimAcik; sabitAlanlar?: Record<string, Record<string, unknown>>; sinirlar?: AracSiniri[];
  istatistik?: Record<string, { a: Record<string, [number, number, number, number]>; k: Record<string, number>; s?: number }>;
  saglik?: { z: number; d: BaglantiAcik["durum"]; ms: number; h?: string }[];
  degisiklikler?: { zaman: number; eklenen: string[]; cikan: string[]; degisen: string[] }[];
  yeniAraclar?: "varsayilan" | "beklet"; incelenecek?: { arac: string; neden: "yeni" | "degisti" | "enjeksiyon"; zaman: number; ayrinti?: string }[]; etiket?: string; ucKullanici?: { acik: boolean };
};
export type RestIslemAcik = { ad: string; baslik: string; aciklama: string; yontem: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; yol: string; parametreler?: { ad: string; konum: "yol" | "sorgu" | "baslik"; zorunlu?: boolean; tur?: string; aciklama?: string }[]; govde?: Record<string, unknown>; okuma?: boolean; yikici?: boolean };
export type RestTanimAcik = { taban: string; yetki: "bearer" | "baslik" | "sorgu" | "temel" | "yok"; anahtarAd?: string; islemler: RestIslemAcik[]; kaynak?: string; baslik?: string; surum?: string };
export type AracSiniri = { id: string; arac: string; pencere: "dakika" | "saat" | "gun"; adet: number; kapsam: "hepsi" | "ziyaretci" | "ajan" | "sohbet" | "sistem" | "gecit" };
export const KAYNAK_TUR_AD: Record<string, string> = { sohbet: "Sohbet", ajan: "Ajanlar", sistem: "Sistemler", ziyaretci: "Ziyaretçiler", gecit: "MCP ağ geçidi", deneme: "Deneme", uc: "Uç kullanıcı", diger: "Diğer" };
export const KAPSAM_AD: Record<AracSiniri["kapsam"], string> = { hepsi: "Her yerde", ziyaretci: "Ziyaretçiler", ajan: "Ajanlar", sohbet: "Sohbet", sistem: "Sistemler", gecit: "MCP ağ geçidi" };
export const PENCERE_AD: Record<AracSiniri["pencere"], string> = { dakika: "dakikada", saat: "saatte", gun: "günde" };
/** İstanbul saatiyle gün anahtarı (sunucudaki istatistik anahtarıyla aynı). */
export const gunAnahtari = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);

/** Sağlık durumu: etkin = sağlıklı, giriş gerekli = yeniden bağlan, hata. */
export const DURUM: Record<BaglantiAcik["durum"], { ad: string; sinif: string; nokta: string }> = {
  etkin: { ad: "Sağlıklı", sinif: "bg-[#55d6fd]/[0.12] text-[#8be6ff]", nokta: "bg-[#55d6fd]" },
  "giris-gerekli": { ad: "Yeniden bağlan", sinif: "bg-amber-400/[0.12] text-amber-200", nokta: "bg-amber-300" },
  hata: { ad: "Hata", sinif: "bg-rose-500/[0.12] text-rose-200", nokta: "bg-rose-400" },
  kurulmadi: { ad: "Kurulmadı", sinif: "bg-white/[0.07] text-white/55", nokta: "bg-white/40" },
};

/** Resmî logo karosu. Koyu logolar açık karoda, yazı logoları geniş gösterilir. */
export function Logo({ src, ad, boyut = 40, acik, genis }: { src?: string; ad: string; boyut?: number; acik?: boolean; genis?: boolean }) {
  const oran = genis ? 0.78 : src?.endsWith(".png") ? 0.7 : 0.52;
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-[12px] ring-1 ring-inset", acik ? "bg-white ring-black/5" : "bg-white/[0.07] ring-white/[0.08]")} style={{ width: boyut, height: boyut }} title={ad}>
      {src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt="" style={{ width: boyut * oran, height: boyut * oran, borderRadius: src.endsWith(".png") ? boyut * 0.16 : 0 }} className="object-contain" /> : <Plug className="text-white/60" style={{ width: boyut * 0.45, height: boyut * 0.45 }} />}
    </span>
  );
}
export const katalogLogo = (k?: KatalogBaglanti, b?: { logo?: string; ad: string }, boyut = 40) => <Logo src={k?.logo ?? b?.logo} ad={k?.ad ?? b?.ad ?? ""} boyut={boyut} acik={k?.logoAcik} genis={k?.logoGenis} />;

/** Sağdan açılan panel (calisma/Veritabani YanPanel kalıbı; sürüklenerek boyutlanır, telefonda tam ekran). */
export function Panel({ baslik, alt, logo, kapat, children, alt2, ust }: { baslik: string; alt?: React.ReactNode; logo?: React.ReactNode; kapat: () => void; children: React.ReactNode; alt2?: React.ReactNode; ust?: React.ReactNode }) {
  const [hazir, setHazir] = useState(false);
  const { en, stil, min, max, varsayilan, anahtar } = useKenarStili("baglanti-panel", 620, 460, 860);
  useEffect(() => setHazir(true), []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [kapat]);
  if (!hazir) return null;
  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-black/45" />
      <motion.aside role="dialog" aria-modal="true" aria-label={baslik} style={stil} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }}
        className="bd-panel absolute inset-y-0 right-0 flex w-full flex-col sm:w-[var(--yan-en)] sm:rounded-l-[22px]">
        <KenarTutamac en={en} anahtar={anahtar} varsayilan={varsayilan} min={min} max={max} etiket="Panel genişliği" className="max-sm:hidden" />
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
          {logo}
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold text-white">{baslik}</p>{alt && <div className="truncate text-[12.5px] text-white/50">{alt}</div>}</div>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        {ust && <div className="border-b border-white/[0.06] px-4 py-2.5 sm:px-5">{ust}</div>}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">{children}</div>
        {alt2 && <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-4 py-3 sm:px-5">{alt2}</footer>}
      </motion.aside>
    </div>,
    document.body,
  );
}

/** Başlık şeritli bölüm kartı. */
export const Bolum = ({ baslik, sag, children, alt }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode; alt?: React.ReactNode }) => (
  <section className="overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.08]">
    <div className="flex min-h-[44px] items-center gap-2 border-b border-white/[0.06] px-4 py-2"><div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-semibold text-white">{baslik}</p>{alt && <p className="truncate text-[11.5px] text-white/45">{alt}</p>}</div>{sag}</div>
    {children}
  </section>
);

/** Satır: solda etiket ve açıklama, sağda denetim. */
export const Satir = ({ ad, alt, children }: { ad: React.ReactNode; alt?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
    <span className="min-w-[160px] flex-1"><span className="block text-[13.5px] text-white">{ad}</span>{alt && <span className="block text-[12px] leading-snug text-white/45">{alt}</span>}</span>
    {children}
  </div>
);

export function Rozet({ children, vurgu }: { children: React.ReactNode; vurgu?: boolean }) {
  return <span className={cn("inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11px] font-medium", vurgu ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.07] text-white/60")}>{children}</span>;
}
/** Okuma/yazma etiketi. */
export function AracTuru({ a }: { a: McpArac }) {
  const okur = a.annotations?.readOnlyHint, siler = a.annotations?.destructiveHint;
  return <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10.5px] font-medium", okur ? "bg-white/[0.07] text-white/60" : siler ? "bg-rose-500/[0.12] text-rose-200" : "bg-amber-400/[0.1] text-amber-200/90")}>{okur ? "Okuma" : siler ? "Yazma, siler" : "Yazma"}</span>;
}

export function Kopyala({ metin, etiket = "Kopyala" }: { metin: string; etiket?: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" onClick={() => { navigator.clipboard?.writeText(metin); setOk(true); setTimeout(() => setOk(false), 1300); }} aria-label={etiket} title={etiket} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/65 hover:text-white">{ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>;
}

export function HataKutusu({ children, tur = "hata" }: { children: React.ReactNode; tur?: "hata" | "uyari" | "bilgi" }) {
  return <div className={cn("rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed ring-1 ring-inset", tur === "hata" ? "bg-rose-500/[0.07] text-rose-200 ring-rose-400/15" : tur === "uyari" ? "bg-amber-400/[0.07] text-amber-100/90 ring-amber-300/15" : "bg-[#55d6fd]/[0.06] text-[#bdefff] ring-[#55d6fd]/15")}>{children}</div>;
}

/** Pencere tıklama anında açılmalı (tarayıcılar sonradan açılanı engeller); adres sonra verilir. */
export function pencereAc(): Window | null {
  const w = window.open("", "vayra-oauth", "width=520,height=720");
  try { w?.document.write('<!doctype html><meta charset="utf-8"><title>Vayra</title><body style="margin:0;display:grid;place-items:center;height:100vh;background:#0b0b0c;color:#fff;font:15px system-ui">Giriş sayfası açılıyor…</body>'); } catch { /* başka köken */ }
  return w;
}
function oauthPenceresi(adres: string, onceden: Window | null): Promise<boolean> {
  return new Promise((coz) => {
    const w = onceden && !onceden.closed ? onceden : window.open(adres, "vayra-oauth", "width=520,height=720");
    if (w && w === onceden) w.location.href = adres;
    let bitti = false;
    const f = (e: MessageEvent) => { if (e.origin === location.origin && e.data?.vayra === "baglanti-oauth") { bitti = true; removeEventListener("message", f); coz(!!e.data.ok); } };
    addEventListener("message", f);
    const z = setInterval(() => { if (!w || w.closed) { clearInterval(z); if (!bitti) { removeEventListener("message", f); coz(false); } } }, 600);
  });
}
/** OAuth girişi: adres alınır, pencere yönlendirilir. 428: kendi OAuth istemcin gerekiyor. */
export async function oauthBaslat(id: string, w: Window | null): Promise<{ ok: boolean; hata?: string; istemciGerekli?: boolean }> {
  try { const v = await api<{ adres: string }>(`/api/build/baglantilar/${id}/oauth`, { govde: {} }); return { ok: await oauthPenceresi(v.adres, w) }; }
  catch (e) { w?.close(); return { ok: false, hata: e instanceof ApiHatasi ? e.message : "Giriş başlatılamadı.", istemciGerekli: e instanceof ApiHatasi && e.durum === 428 }; }
}
export const donusAdresi = () => (typeof location === "undefined" ? "" : `${location.origin}/api/build/baglantilar/oauth/geri`);
export const ayYaz = (s?: string) => { if (!s) return ""; const [y, a] = s.split("-").map(Number); return new Date(y, (a || 1) - 1, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }); };
export const sureYaz = (t?: number) => {
  if (!t) return "";
  const d = t - Date.now(), dk = Math.round(Math.abs(d) / 60000);
  const m = dk < 60 ? `${dk} dakika` : dk < 2880 ? `${Math.round(dk / 60)} saat` : `${Math.round(dk / 1440)} gün`;
  return d >= 0 ? `${m} sonra` : `${m} önce`;
};
