"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUp, FlaskConical, GitCompare, Link2, Loader2, Pin, Plus, RotateCcw, ShieldAlert, ShieldCheck, Trash2, X, Sparkles } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { Md } from "@/components/build/sohbet/SohbetEkrani";
import { BAGLANTI_KATALOGU, katalogBul } from "@/lib/build/baglantiKatalog";
import { BUILD_MODELLERI, modelBul, VARSAYILAN_MODEL } from "@/lib/build/modeller";
import type { TaramaSonucu } from "@/lib/build/yetenekTarama";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";

export type YetenekV2 = {
  id: string; ad: string; baslik: string; aciklama: string; govde: string; dosyalar: { yol: string; icerik: string }[]; ornekler: string[]; surum: number;
  surumler: { no: number; tarih: number; aciklama: string; govde: string; dosyalar?: { yol: string; icerik: string }[]; not?: string }[];
  cagri?: "model" | "elle" | "her-zaman"; sabitSurum?: number; gerekenBaglantilar?: string[]; tarama?: TaramaSonucu; paylasim?: { anahtar: string; tarih: number };
  tetikTestleri?: { sorgu: string; beklenen: boolean }[]; kaynak?: { tur: string; ad?: string; url?: string; lisans?: string; commit?: string };
};
export type Bagimlilik = { id: string; ad: string; logo?: string; logoAcik?: boolean; logoGenis?: boolean; durum: "bagli" | "sorunlu" | "eksik"; baglantiId?: string };

const CAGRI = [
  { id: "model" as const, ad: "Model karar verir", alt: "Açıklama göreve uyunca model kendisi yükler" },
  { id: "elle" as const, ad: "Yalnız istenince", alt: "Kullanıcı /ad ya da @ad yazınca kullanılır" },
  { id: "her-zaman" as const, ad: "Her zaman açık", alt: "Her görevde başlamadan yüklenir" },
];

/** Çağrı politikası + gereken bağlantılar (eksikse uyarı ve Bağla kısayolu). */
export function CagriVeBaglantilar({ y, d, bag }: { y: YetenekV2; d: (p: Partial<YetenekV2>) => void; bag: Bagimlilik[] }) {
  const [ozel, setOzel] = useState(false);
  const [url, setUrl] = useState("");
  const secili = y.gerekenBaglantilar ?? [];
  const ekle = (x: string) => { if (x && !secili.includes(x)) d({ gerekenBaglantilar: [...secili, x].slice(0, 10) }); };
  const eksik = bag.filter((b) => b.durum !== "bagli");
  const c = CAGRI.find((x) => x.id === (y.cagri ?? "model"))!;
  return (
    <Kart ikon={Link2} baslik="Çağrı ve bağlantılar" alt="Ne zaman devreye girer, hangi servislere ihtiyaç duyar" govde="space-y-4 p-4 sm:p-5">
      <div className="space-y-1.5">
        <Secici id="yetenek-cagri" deger={y.cagri ?? "model"} set={(v) => d({ cagri: v })} l={CAGRI.map((x) => ({ id: x.id, ad: x.ad }))} />
        <p className="pl-1 text-[12px] text-white/45">{c.alt.replace("/ad", `/${y.ad}`).replace("@ad", `@${y.ad}`)}</p>
      </div>
      <div className="space-y-2">
        <p className="text-[13px] font-medium text-white">Gereken bağlantılar</p>
        {secili.length > 0 && (
          <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
            {secili.map((s) => { const b = bag.find((x) => x.id === s); const k = katalogBul(s); return (
              <div key={s} className="flex items-center gap-3 px-3 py-2.5">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-inset", k?.logoAcik ? "bg-white ring-black/5" : "bg-white/[0.07] ring-white/[0.08]")}>{k ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={k.logo} alt="" className={cn("object-contain", k.logoGenis ? "h-6 w-6" : "h-4 w-4")} /> : <Link2 className="h-3.5 w-3.5 text-white/60" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{k?.ad ?? s.replace(/^url:/, "")}</span><span className={cn("block text-[11.5px]", b?.durum === "bagli" ? "text-[#8be6ff]" : b?.durum === "sorunlu" ? "text-amber-200/90" : "text-rose-200/90")}>{b?.durum === "bagli" ? "Bağlı ve sağlıklı" : b?.durum === "sorunlu" ? "Bağlı ama yeniden bağlanmalı" : "Bağlı değil"}</span></span>
                {b?.durum !== "bagli" && k && <Link href={b?.baglantiId ? "/panel/build/baglantilar" : `/panel/build/baglantilar?baglan=${k.id}`} className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[12px] font-semibold text-black">{b?.baglantiId ? "Düzelt" : "Bağla"}</Link>}
                <button type="button" onClick={() => d({ gerekenBaglantilar: secili.filter((x) => x !== s) })} aria-label="Kaldır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            ); })}
          </div>
        )}
        {eksik.length > 0 && <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-100/90 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{eksik.map((b) => b.ad).join(", ")} bağlı değilse bu yetenek adımlarını tamamlayamaz; kullanan ajana ya da sohbete bu bağlantıları da aç.</p>}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <AcilirSecim deger="" bos="Bağlantı ekle" set={(v) => { if (v === "ozel") setOzel(true); else ekle(v); }} l={[...BAGLANTI_KATALOGU.filter((k) => !secili.includes(k.id)).map((k) => ({ id: k.id, ad: k.ad, alt: k.yapan, gorsel: k.logo })), { id: "ozel", ad: "Özel", alt: "Kendi MCP sunucu adresin" }]} />
        </div>
        {ozel && (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (/^https:\/\/\S{4,}$/.test(url.trim())) { ekle(`url:${url.trim()}`); setUrl(""); setOzel(false); } }}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mcp.sirketim.com/mcp" className={cn(alanSinif, "h-10 text-[13px]")} />
            <button type="submit" disabled={!/^https:\/\/\S{4,}$/.test(url.trim())} className="h-10 shrink-0 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">Ekle</button>
          </form>
        )}
      </div>
    </Kart>
  );
}

/** Güvenlik taraması sonucu. */
export function GuvenlikKarti({ t }: { t?: TaramaSonucu }) {
  if (!t) return null;
  const renk = t.sonuc === "kritik" ? "text-rose-200" : t.sonuc === "uyari" ? "text-amber-200" : "text-[#8be6ff]";
  return (
    <Kart ikon={t.sonuc === "kritik" ? ShieldAlert : ShieldCheck} baslik="Güvenlik taraması" alt={`Her kayıtta sır, tehlikeli komut, istem enjeksiyonu ve dış ağ çağrısı aranır · ${gorece(t.tarih)}`}
      sag={<span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium", t.sonuc === "kritik" ? "bg-rose-500/[0.12]" : t.sonuc === "uyari" ? "bg-amber-400/[0.1]" : "bg-[#55d6fd]/[0.12]", renk)}>{t.sonuc === "temiz" ? "Temiz" : t.sonuc === "kritik" ? "Kritik" : t.sonuc === "uyari" ? "Uyarı" : "Bilgi"}</span>}>
      {t.sonuc === "kritik" && <p className="border-b border-white/[0.05] bg-rose-500/[0.06] px-4 py-2.5 text-[12.5px] leading-relaxed text-rose-100/90 sm:px-5">Kritik bulgu düzeltilene kadar bu yetenek sohbetlerde ve ajanlarda etkinleşmez.</p>}
      {t.bulgular.length ? (
        <div className="max-h-72 divide-y divide-white/[0.04] overflow-y-auto">
          {t.bulgular.slice(0, 60).map((b, i) => (
            <div key={i} className="px-4 py-2.5 sm:px-5">
              <p className="flex items-center gap-2 text-[13px] text-white"><span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", b.seviye === "kritik" ? "bg-rose-400" : b.seviye === "uyari" ? "bg-amber-300" : "bg-white/40")} />{b.mesaj}<span className="text-[11.5px] text-white/40">{b.dosya} · satır {b.satir}</span></p>
              <code className="mt-1 block truncate pl-3.5 text-[11.5px] text-white/50">{b.ornek}</code>
            </div>
          ))}
        </div>
      ) : <p className="px-4 py-3 text-[13px] text-white/55 sm:px-5">Bulgu yok.</p>}
    </Kart>
  );
}

/** Satır farkı (en uzun ortak alt dizi; 600 satıra kadar). */
export function fark(a: string, b: string): { t: "=" | "+" | "-"; s: string }[] {
  const x = a.split("\n").slice(0, 600), y = b.split("\n").slice(0, 600);
  const n = x.length, m = y.length, L: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const o: { t: "=" | "+" | "-"; s: string }[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) { if (x[i] === y[j]) { o.push({ t: "=", s: x[i] }); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) o.push({ t: "-", s: x[i++] }); else o.push({ t: "+", s: y[j++] }); }
  while (i < n) o.push({ t: "-", s: x[i++] });
  while (j < m) o.push({ t: "+", s: y[j++] });
  return o;
}

/** Sürümler: her kayıt tam anlık görüntü; sabitle, geri yükle, farkı gör, notlu sürüm kaydet. */
export function Surumler({ y, islem, karsilastir }: { y: YetenekV2; islem: (g: Record<string, unknown>) => Promise<void>; karsilastir?: () => void }) {
  const [not, setNot] = useState("");
  const [farkNo, setFarkNo] = useState<number | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const yap = async (k: string, g: Record<string, unknown>) => { setGidiyor(k); try { await islem(g); } finally { setGidiyor(null); } };
  const s = farkNo ? y.surumler.find((x) => x.no === farkNo) : undefined;
  const satirlar = useMemo(() => (s ? fark(`${s.aciklama}\n\n${s.govde}`, `${y.aciklama}\n\n${y.govde}`) : []), [s, y.aciklama, y.govde]);
  return (
    <Kart ikon={RotateCcw} baslik="Sürümler" sag={karsilastir && y.surumler.length > 0 ? <button type="button" onClick={karsilastir} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]"><GitCompare className="h-3.5 w-3.5" /><span className="max-sm:hidden">Karşılaştır</span></button> : undefined} alt={y.sabitSurum ? `Sürüm ${y.sabitSurum} sabit: sohbet ve ajanlar bu sürümü kullanır, taslaktaki değişiklikler yayına girmez` : "Sabit sürüm yok: sohbet ve ajanlar her zaman son taslağı kullanır"}>
      <form className="flex gap-2 border-b border-white/[0.05] p-4 sm:px-5" onSubmit={(e) => { e.preventDefault(); yap("kaydet", { surumKaydet: not }).then(() => setNot("")); }}>
        <input value={not} onChange={(e) => setNot(e.target.value)} maxLength={200} placeholder="Sürüm notu, ör. iade kuralları eklendi" className={cn(alanSinif, "h-10 text-[13.5px]")} />
        <button type="submit" disabled={!!gidiyor} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor === "kaydet" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Sürüm kaydet</button>
      </form>
      <div className="divide-y divide-white/[0.04]">
        {[...y.surumler].reverse().map((x) => { const sabit = y.sabitSurum === x.no; return (
          <div key={x.no}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-5">
              <span className={cn("relative flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[12px] font-semibold tabular-nums", x.no === y.surum ? "bg-white text-black" : "bg-white/[0.07] text-white/70", sabit && "ring-2 ring-[#55d6fd]")}>{x.no}</span>
              <span className="min-w-[160px] flex-1"><span className="block truncate text-[13px] text-white/85">{x.not || x.govde.split("\n").find((l) => l.trim())?.replace(/^#+\s*/, "") || `Sürüm ${x.no}`}</span><span className="block text-[11.5px] text-white/40">{gorece(x.tarih)}{x.no === y.surum ? " · taslak" : ""}{sabit ? " · sabit" : ""}{x.dosyalar ? ` · ${x.dosyalar.length} dosya` : ""}</span></span>
              <span className="flex shrink-0 gap-1.5">
                {x.no !== y.surum && <button type="button" onClick={() => setFarkNo(farkNo === x.no ? null : x.no)} className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12px] text-white hover:bg-white/[0.12]", farkNo === x.no ? "bg-white/[0.12] ring-1 ring-inset ring-white" : "bg-white/[0.07]")}><GitCompare className="h-3 w-3" />Fark</button>}
                <button type="button" onClick={() => yap(`s${x.no}`, { sabitSurum: sabit ? null : x.no })} className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12px]", sabit ? "bg-[#55d6fd]/[0.14] text-[#8be6ff]" : "bg-white/[0.07] text-white hover:bg-white/[0.12]")}>{gidiyor === `s${x.no}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pin className="h-3 w-3" />}{sabit ? "Sabitlemeyi kaldır" : "Sabitle"}</button>
                {x.no !== y.surum && <button type="button" onClick={() => yap(`g${x.no}`, { geri: x.no })} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12]"><RotateCcw className="h-3 w-3" />Geri yükle</button>}
              </span>
            </div>
            {farkNo === x.no && (
              <div className="mx-4 mb-3 max-h-80 overflow-auto rounded-[14px] bg-black/30 py-2 font-mono text-[11.5px] leading-relaxed ring-1 ring-inset ring-white/[0.06] sm:mx-5">
                <p className="px-3 pb-1 font-sans text-[11.5px] text-white/45">Sürüm {x.no} ile taslak arasındaki fark</p>
                {satirlar.every((l) => l.t === "=") ? <p className="px-3 font-sans text-[12px] text-white/55">Metin aynı; yalnız dosyalar farklı olabilir.</p> : satirlar.map((l, i) => l.t === "=" ? null : <p key={i} className={cn("whitespace-pre-wrap break-words px-3", l.t === "+" ? "bg-[#55d6fd]/[0.08] text-[#bdefff]" : "bg-rose-500/[0.08] text-rose-200/90")}>{l.t === "+" ? "+ " : "- "}{l.s || " "}</p>)}
              </div>
            )}
          </div>
        ); })}
      </div>
    </Kart>
  );
}

/** Paylaş ve dışa aktar: herkese açık bağlantı (salt okuma, kopyalanabilir), SKILL.md ve .zip. */
export function PaylasPaneli({ y, kapat, guncelle, indirZip, indirMd }: { y: YetenekV2; kapat: () => void; guncelle: (p: Partial<YetenekV2>) => void; indirZip: () => void; indirMd: () => void }) {
  const [hazir, setHazir] = useState(false);
  const [gidiyor, setGidiyor] = useState(false);
  const [koken, setKoken] = useState("");
  const { en, stil, min, max, varsayilan, anahtar } = useKenarStili("yetenek-panel", 560, 420, 860);
  useEffect(() => { setHazir(true); setKoken(location.origin); }, []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [kapat]);
  if (!hazir) return null;
  const link = y.paylasim ? `${koken}/panel/build/yetenekler/paylasim/${y.paylasim.anahtar}` : "";
  const ac = async (v: boolean) => {
    setGidiyor(true);
    try {
      if (v) { const r = await api<{ anahtar: string }>(`/api/build/yetenekler/${y.id}/paylas`, { govde: {} }); guncelle({ paylasim: { anahtar: r.anahtar, tarih: Date.now() } }); }
      else { await api(`/api/build/yetenekler/${y.id}/paylas`, { method: "DELETE" }); guncelle({ paylasim: undefined }); }
    } finally { setGidiyor(false); }
  };
  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-black/45" />
      <motion.aside role="dialog" aria-modal="true" aria-label="Paylaş" style={stil} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }} className="bd-panel absolute inset-y-0 right-0 flex w-full flex-col sm:w-[var(--yan-en)] sm:rounded-l-[22px]">
        <KenarTutamac en={en} anahtar={anahtar} varsayilan={varsayilan} min={min} max={max} className="max-sm:hidden" />
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold text-white">Paylaş ve dışa aktar</p><p className="truncate text-[12.5px] text-white/50">{y.baslik} · {y.ad}</p></div>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"><span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-white">Paylaşım bağlantısı</span><span className="block text-[12px] text-white/45">Bağlantıyı bilen herkes yeteneği görür ve kendi yeteneklerine kopyalar; düzenleyemez</span></span>{gidiyor ? <Loader2 className="h-4 w-4 animate-spin text-white/50" /> : <Anahtar acik={!!y.paylasim} set={ac} etiket="Paylaşım bağlantısı" />}</div>
            {y.paylasim ? (
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[12px] bg-black/30 px-3 py-2 text-[12px] text-white/80 ring-1 ring-inset ring-white/[0.06]">{link}</code><button type="button" onClick={() => navigator.clipboard?.writeText(link)} className="h-9 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Kopyala</button></div>
                <p className="text-[12px] leading-relaxed text-white/45">{y.sabitSurum ? `Paylaşılan içerik sabit sürüm ${y.sabitSurum}.` : "Paylaşılan içerik son taslak; değiştirdikçe güncellenir."} Kritik güvenlik bulgusu varsa bağlantı açılmaz.</p>
              </div>
            ) : <p className="p-4 text-[13px] text-white/50">Kapalı. Açınca herkese açık, salt okuma bir bağlantı oluşur; kapatınca eski bağlantı çalışmaz.</p>}
          </section>
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <p className="border-b border-white/[0.06] px-4 py-3 text-[13.5px] font-semibold text-white">Dışa aktar</p>
            <div className="divide-y divide-white/[0.05]">
              <button type="button" onClick={indirZip} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"><span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">Klasör (.zip)</span><span className="block text-[12px] text-white/45">SKILL.md ve ek dosyalar; Claude, Codex ve agentskills.io biçiminde</span></span></button>
              <button type="button" onClick={indirMd} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]"><span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">Yalnız SKILL.md</span><span className="block text-[12px] text-white/45">Ön bilgide ad, açıklama, sürüm, çağrı ve gereken bağlantılar</span></span></button>
            </div>
          </section>
        </div>
      </motion.aside>
    </div>,
    document.body,
  );
}

/** Bağlı modeller (deneme için); varsayılan model bağlı değilse ilk bağlı model seçilir. */
export function useModeller() {
  const [bagli, setBagli] = useState<Record<string, string | null> | null>(null);
  useEffect(() => { fetch("/api/build/modeller").then((r) => r.json()).then((v) => setBagli(v.baglantilar ?? {})).catch(() => setBagli({})); }, []);
  const l = BUILD_MODELLERI.filter((m) => !bagli || bagli[m.id] !== null);
  const ilk = bagli ? (bagli[VARSAYILAN_MODEL] ? VARSAYILAN_MODEL : l[0]?.id ?? VARSAYILAN_MODEL) : VARSAYILAN_MODEL;
  return { l, ilk, hazir: !!bagli };
}
type Tur = { metin: string; sure: number; girdi: number; cikti: number; hata?: string };

/** Yeteneği dene: aynı istem yetenekli ve yeteneksiz, yan yana. */
export function Karsilastir({ y }: { y: YetenekV2 }) {
  const { l, ilk, hazir } = useModeller();
  const [model, setModel] = useState("");
  const [istem, setIstem] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [s, setS] = useState<{ ile: Tur; olmadan: Tur; model: string } | null>(null);
  const m = model || ilk;
  const calistir = async () => {
    if (!istem.trim() || gidiyor) return;
    setGidiyor(true); setHata("");
    try { setS(await api<{ ile: Tur; olmadan: Tur; model: string }>(`/api/build/yetenekler/${y.id}/karsilastir`, { govde: { istem, model: m } })); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Çalıştırılamadı."); } finally { setGidiyor(false); }
  };
  const Sutun = ({ ad, t, vurgu }: { ad: string; t?: Tur; vurgu?: boolean }) => (
    <section className={cn("flex min-h-[180px] min-w-0 flex-col overflow-hidden rounded-[18px] ring-1 ring-inset", vurgu ? "ring-[#55d6fd]/30" : "ring-white/[0.08]")}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><span className={cn("h-2 w-2 rounded-full", vurgu ? "bg-[#55d6fd]" : "bg-white/40")} /><p className="flex-1 text-[13px] font-semibold text-white">{ad}</p>{t && !t.hata && <span className="text-[11.5px] tabular-nums text-white/45">{(t.sure / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn · {t.girdi + t.cikti} belirteç</span>}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3 text-[13px] [scrollbar-width:thin]">{gidiyor ? <div className="space-y-2"><div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" /><div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" /></div> : t?.hata ? <p className="text-rose-300">{t.hata}</p> : t ? <Md metin={t.metin || "(boş yanıt)"} onizle={() => {}} /> : <p className="text-white/40">Sonuç burada görünür.</p>}</div>
    </section>
  );
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-3 [scrollbar-width:thin]">
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2">
        <Sutun ad="Yetenekle" t={s?.ile} vurgu />
        <Sutun ad="Yeteneksiz" t={s?.olmadan} />
      </div>
      {hata && <p className="text-[13px] text-rose-300">{hata}</p>}
      <div className="cam-istemci shrink-0 rounded-[22px] p-2">
        <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={2} maxLength={4000} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); calistir(); } }}
          placeholder="Aynı isteği iki kez çalıştır: yetenek yüklüyken ve yokken" className="block min-h-[56px] w-full resize-none bg-transparent px-3 pt-2 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/35" />
        <div className="flex flex-wrap items-center gap-2 px-1 pb-0.5">
          {y.ornekler.filter((x) => x.trim()).slice(0, 2).map((o) => <button key={o} type="button" onClick={() => setIstem(o)} className="max-w-[220px] truncate rounded-full bg-white/[0.08] px-3 py-1.5 text-[12px] text-white/70 hover:text-white">{o}</button>)}
          <span className="flex-1" />
          <div className="w-[180px]">{hazir && <AcilirSecim deger={m} set={setModel} l={l.map((x) => ({ id: x.id, ad: x.ad, alt: x.alt }))} />}</div>
          <button type="button" onClick={calistir} disabled={!istem.trim() || gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white pl-4 pr-3 text-[14px] font-semibold text-black disabled:opacity-35">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Karşılaştır<ArrowUp className="h-4 w-4" /></>}</button>
        </div>
      </div>
      {s && <p className="shrink-0 px-1 text-[11.5px] text-white/40">Model: {modelBul(s.model).ad}. İki yanıt aynı modelden; tek fark yeteneğin talimatının yüklü olması.</p>}
    </div>
  );
}

type TetikSonuc = { sorgu: string; beklenen: boolean; tetiklendi: boolean | null; baska?: string; ortusme: number; hata?: string };
/** Açıklama tetik testi: sorgu listesi, beklenen ve modelin gerçek kararı. */
export function TetikTesti({ y, guncelle }: { y: YetenekV2; guncelle: (p: Partial<YetenekV2>) => void }) {
  const { l: modeller, ilk, hazir } = useModeller();
  const [model, setModel] = useState("");
  const [l, setL] = useState<{ sorgu: string; beklenen: boolean }[]>(() => y.tetikTestleri?.length ? y.tetikTestleri : [...y.ornekler.filter((x) => x.trim()).slice(0, 3).map((sorgu) => ({ sorgu, beklenen: true })), { sorgu: "", beklenen: false }]);
  const [s, setS] = useState<{ sonuclar: TetikSonuc[]; dogru: number; olculen: number } | null>(null);
  const [gidiyor, setGidiyor] = useState<"" | "test" | "uret" | "iyilestir">("");
  const [hata, setHata] = useState("");
  const [oneri, setOneri] = useState<{ oneri: string; neden?: string; once: { dogru: number; olculen: number }; sonra: { dogru: number; olculen: number }; sonuclar: TetikSonuc[] } | null>(null);
  const d = (i: number, p: Partial<{ sorgu: string; beklenen: boolean }>) => setL((x) => x.map((q, j) => (j === i ? { ...q, ...p } : q)));
  const uret = async () => {
    if (gidiyor) return;
    setGidiyor("uret"); setHata("");
    try { const v = await api<{ sorgular: { sorgu: string; beklenen: boolean }[] }>(`/api/build/yetenekler/${y.id}/tetik`, { govde: { islem: "uret", model: model || ilk } }); setL((x) => [...x.filter((q) => q.sorgu.trim()), ...v.sorgular].slice(0, 20)); setS(null); setOneri(null); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Sorgu üretilemedi."); } finally { setGidiyor(""); }
  };
  const iyilestir = async () => {
    const sorgular = l.filter((q) => q.sorgu.trim());
    if (!sorgular.length || gidiyor) return;
    setGidiyor("iyilestir"); setHata("");
    try { setOneri(await api(`/api/build/yetenekler/${y.id}/tetik`, { govde: { islem: "iyilestir", sorgular, model: model || ilk, onceki: s?.sonuclar } })); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Öneri üretilemedi."); } finally { setGidiyor(""); }
  };
  const calistir = async () => {
    const sorgular = l.filter((q) => q.sorgu.trim());
    if (!sorgular.length || gidiyor) return;
    setGidiyor("test"); setHata(""); setOneri(null);
    try { const v = await api<{ sonuclar: TetikSonuc[]; dogru: number; olculen: number }>(`/api/build/yetenekler/${y.id}/tetik`, { govde: { sorgular, model: model || ilk } }); setS(v); guncelle({ tetikTestleri: sorgular }); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Çalıştırılamadı."); } finally { setGidiyor(""); }
  };
  const sonuc = (q: { sorgu: string }) => s?.sonuclar.find((x) => x.sorgu === q.sorgu.trim());
  return (
    <div className="h-full min-h-0 space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
      <p className="px-1 text-[12.5px] leading-relaxed text-white/55">Her sorgu, sohbetteki gerçek seçim ortamında modele sorulur: bütün etkin yeteneklerin adı ve açıklaması listede, model bu yeteneği yükleyip yüklemediğine kendisi karar verir. Tetiklemesi gereken ve yakın ama tetiklememesi gereken sorguları birlikte yaz.</p>
      <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5"><FlaskConical className="h-4 w-4 text-white/60" /><p className="flex-1 text-[13px] font-semibold text-white">Sorgular ({l.length})</p>{s && <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium", s.olculen && s.dogru === s.olculen ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-amber-400/[0.1] text-amber-200")}>{s.dogru} / {s.olculen} doğru</span>}</div>
        <div className="divide-y divide-white/[0.05]">
          {l.map((q, i) => { const r = sonuc(q); const dogru = r && r.tetiklendi !== null && r.tetiklendi === r.beklenen; return (
            <div key={i} className="space-y-2 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <input value={q.sorgu} onChange={(e) => d(i, { sorgu: e.target.value })} maxLength={300} placeholder="Kullanıcının yazabileceği bir istek" className={cn(alanSinif, "h-9 text-[13px]")} />
                <button type="button" onClick={() => setL((x) => x.filter((_, j) => j !== i))} aria-label="Sorguyu sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Secici id={`tetik-${i}`} kucuk deger={q.beklenen ? "evet" : "hayir"} set={(v) => d(i, { beklenen: v === "evet" })} l={[{ id: "evet", ad: "Tetiklemeli" }, { id: "hayir", ad: "Tetiklememeli" }]} />
                {r && (r.hata ? <span className="text-[12px] text-rose-300">{r.hata}</span> : <>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium", dogru ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-rose-500/[0.12] text-rose-200")}>{r.tetiklendi ? "Model yükledi" : r.baska ? `Model ${r.baska} yükledi` : "Model yüklemedi"}</span>
                  <span className="text-[11.5px] text-white/45">açıklamayla örtüşme yüzde {r.ortusme}</span>
                </>)}
              </div>
            </div>
          ); })}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3.5 py-2.5">
          <button type="button" onClick={() => setL((x) => [...x, { sorgu: "", beklenen: true }].slice(0, 20))} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><Plus className="h-3.5 w-3.5" />Sorgu ekle</button>
          <button type="button" onClick={uret} disabled={!!gidiyor} title="Tetiklemesi gereken 8 ve yakın ama tetiklememesi gereken 8 sorgu üretir" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-40">{gidiyor === "uret" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Sorgu üret</button>
          <span className="flex-1" />
          <div className="w-[180px]">{hazir && <AcilirSecim deger={model || ilk} set={setModel} l={modeller.map((x) => ({ id: x.id, ad: x.ad, alt: x.alt }))} />}</div>
          <button type="button" onClick={calistir} disabled={!!gidiyor || !l.some((q) => q.sorgu.trim())} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor === "test" && <Loader2 className="h-4 w-4 animate-spin" />}Testi çalıştır</button>
        </div>
      </section>
      {hata && <p className="text-[13px] text-rose-300">{hata}</p>}
      {s && s.olculen > 0 && !oneri && (
        <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-white/[0.035] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]">
          <p className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed text-white/65">{s.dogru < s.olculen ? "Yanlış sonuçlar açıklamadan geliyor. Vayra yeni bir açıklama önerip aynı sorgularla yeniden test etsin; sonucu karşılaştırıp uygularsın." : "Bütün sorgular doğru. Açıklamayı yine de daha net hale getirmeyi deneyebilirsin."}</p>
          <button type="button" onClick={iyilestir} disabled={!!gidiyor} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "iyilestir" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Açıklamayı iyileştir</button>
        </div>
      )}
      {oneri && (
        <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-[#55d6fd]/25">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-[#55d6fd]/[0.04] px-3.5 py-2.5">
            <Sparkles className="h-4 w-4 text-[#8be6ff]" /><p className="flex-1 text-[13px] font-semibold text-white">Önerilen açıklama</p>
            <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] tabular-nums text-white/60">Şimdiki {oneri.once.dogru} / {oneri.once.olculen}</span>
            <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium tabular-nums", oneri.sonra.dogru >= oneri.once.dogru ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-rose-500/[0.12] text-rose-200")}>Öneri {oneri.sonra.dogru} / {oneri.sonra.olculen}</span>
          </div>
          <div className="space-y-2 px-3.5 py-3">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{oneri.oneri}</p>
            {oneri.neden && <p className="text-[12px] leading-relaxed text-white/45">{oneri.neden}</p>}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="button" onClick={() => { guncelle({ aciklama: oneri.oneri }); setS({ sonuclar: oneri.sonuclar, dogru: oneri.sonra.dogru, olculen: oneri.sonra.olculen }); setOneri(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black">Açıklamayı uygula</button>
              <button type="button" onClick={iyilestir} disabled={!!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-40">{gidiyor === "iyilestir" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Başka öneri</button>
              <button type="button" onClick={() => setOneri(null)} className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-white/55 hover:text-white">Vazgeç</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

