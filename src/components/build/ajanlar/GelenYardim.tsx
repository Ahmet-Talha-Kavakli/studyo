"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown, Clock3, Languages, Lightbulb, Loader2, Send, Sparkles, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { sureYaz } from "./ortak";

/**
 * Gelen kutusunda temsilciye canlı yardım bileşenleri (Sierra Live Assist ve Intercom Copilot düzeyi):
 *  CanliOneri     yeni ziyaretçi mesajında 3 hazır yanıt, sıradaki en iyi adım ve ilgili bilgi kaynakları
 *  YenidenYaz     yazılan yanıtı kısalt, genişlet, kibarlaştır, resmîleştir, düzelt ya da özel talimatla yeniden yaz
 *  Yardimci       temsilcinin bilgi tabanına sorusu, kaynaklı yanıt ve "Yanıta ekle"
 *  PencereRozeti  WhatsApp, Messenger ve Instagram mesajlaşma penceresi
 *  SablonPaneli   24 saat dışında WhatsApp onaylı şablonla yeniden başlatma
 * Her yapay zekâ işlemi Build kredisinden düşer; model bağlı değilse dürüst ileti gösterilir.
 */
export type Islem = (g: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
export type Oneri = { yanitlar: string[]; adim: string; kaynaklar: { ad: string; parca: string }[] };
export type Pencere = { kanal: "whatsapp" | "messenger" | "instagram"; sonZiyaretci: number | null; acik: boolean; bitis: number | null; insanEtiketi: boolean; etiketBitis: number | null };
type WaSablon = { ad: string; dil: string; kategori: string; baslik?: string; govde: string; altBilgi?: string; degiskenler: string[] };

export const YARDIM_OLAY = "vayra-gelen-yanita-ekle";
/** Ayrıntılar panelinden (yardımcı yanıtı) komut kutusuna metin ekler. */
export const yanitaEkle = (metin: string) => dispatchEvent(new CustomEvent(YARDIM_OLAY, { detail: metin }));

const kucukDugme = "inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/75 hover:bg-white/[0.1] hover:text-white disabled:opacity-40";

export function CanliOneri({ oneri, yukleniyor, hata, sec, kapat, yenile }: { oneri: Oneri | null; yukleniyor: boolean; hata: string; sec: (m: string) => void; kapat: () => void; yenile: () => void }) {
  const [kaynakAcik, setKaynakAcik] = useState(false);
  if (!oneri && !yukleniyor && !hata) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mx-auto mb-2.5 max-w-[720px] rounded-[16px] bg-[#55d6fd]/[0.05] p-2.5 ring-1 ring-inset ring-[#55d6fd]/15">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" /><span className="text-[12.5px] font-semibold text-white">Canlı öneri</span>
        {yukleniyor && <Loader2 className="h-3 w-3 animate-spin text-white/50" />}
        <span className="ml-auto flex items-center gap-1">
          {!yukleniyor && <button type="button" onClick={yenile} className="h-6 rounded-full px-2 text-[11.5px] text-white/50 hover:text-white">Yenile</button>}
          <button type="button" onClick={kapat} aria-label="Öneriyi kapat" className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:text-white"><X className="h-3 w-3" /></button>
        </span>
      </div>
      {hata ? <p className="px-1 text-[12px] text-amber-200/90">{hata}</p> : oneri && (
        <>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {oneri.yanitlar.map((y, i) => <button key={i} type="button" onClick={() => sec(y)} title="Komut kutusuna al" className="line-clamp-3 rounded-[12px] bg-white/[0.04] px-2.5 py-2 text-left text-[12.5px] leading-snug text-white/85 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08]">{y}</button>)}
          </div>
          {oneri.adim && <p className="mt-2 flex items-start gap-1.5 px-1 text-[12px] leading-snug text-white/70"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" /><span><span className="text-white/45">Sıradaki adım: </span>{oneri.adim}</span></p>}
          {oneri.kaynaklar.length > 0 && (
            <div className="mt-1.5 px-1">
              <button type="button" onClick={() => setKaynakAcik((x) => !x)} className="flex items-center gap-1 text-[11.5px] text-white/45 hover:text-white"><BookOpen className="h-3 w-3" />{oneri.kaynaklar.length} bilgi kaynağı<ChevronDown className={cn("h-3 w-3 transition-transform", kaynakAcik && "rotate-180")} /></button>
              {kaynakAcik && <ul className="mt-1 space-y-1">{oneri.kaynaklar.map((k, i) => <li key={i} className="rounded-[10px] bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] leading-snug text-white/60"><span className="font-medium text-white/80">{k.ad}</span> · {k.parca}</li>)}</ul>}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

const TONLAR = [{ id: "kisalt", ad: "Kısalt" }, { id: "genislet", ad: "Genişlet" }, { id: "kibar", ad: "Daha kibar" }, { id: "resmi", ad: "Daha resmî" }, { id: "duzelt", ad: "Yazımı düzelt" }];
export function YenidenYaz({ metin, islem, uygula, hata }: { metin: string; islem: Islem; uygula: (m: string) => void; hata: (m: string) => void }) {
  const [acik, setAcik] = useState(false);
  const [ozel, setOzel] = useState("");
  const [gidiyor, setGidiyor] = useState("");
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!acik) return; const f = (e: MouseEvent) => { if (!kok.current?.contains(e.target as Node)) setAcik(false); }; addEventListener("mousedown", f); return () => removeEventListener("mousedown", f); }, [acik]);
  const yap = async (ton: string) => {
    setGidiyor(ton);
    const r = await islem({ islem: "yeniden-yaz", metin, ton, ...(ton === "ozel" ? { talimat: ozel } : {}) });
    setGidiyor("");
    if (r?.modelYok) hata("Bağlı bir model yok; yeniden yazılamadı.");
    else if (typeof r?.metin === "string") { uygula(r.metin); setAcik(false); setOzel(""); }
  };
  return (
    <div ref={kok} className="relative">
      <button type="button" disabled={!metin.trim()} onClick={() => setAcik((x) => !x)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1] hover:text-white disabled:opacity-40">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}Düzenle<ChevronDown className="h-3 w-3" /></button>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.14 }} className="bd-panel absolute bottom-full left-0 z-30 mb-2 w-[240px] rounded-[16px] p-1.5">
            {TONLAR.map((t) => <button key={t.id} type="button" disabled={!!gidiyor} onClick={() => yap(t.id)} className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white">{gidiyor === t.id && <Loader2 className="h-3 w-3 animate-spin" />}{t.ad}</button>)}
            <form onSubmit={(e) => { e.preventDefault(); if (ozel.trim()) yap("ozel"); }} className="mt-1 flex items-center gap-1 border-t border-white/[0.06] p-1 pt-2">
              <input value={ozel} onChange={(e) => setOzel(e.target.value)} maxLength={300} placeholder="Özel: nasıl yazılsın?" className="h-8 min-w-0 flex-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white outline-none placeholder:text-white/35" />
              <button type="submit" disabled={!ozel.trim() || !!gidiyor} aria-label="Uygula" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-35">{gidiyor === "ozel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Yardimci({ islem, gidiyor }: { islem: Islem; gidiyor: string }) {
  const [soru, setSoru] = useState("");
  const [cevap, setCevap] = useState<{ soru: string; yanit: string; kaynaklar: { ad: string; parca: string }[] } | null>(null);
  const [hata, setHata] = useState("");
  const sor = async () => {
    const s = soru.trim(); if (!s) return;
    setHata("");
    const r = await islem({ islem: "yardimci", soru: s });
    if (r?.modelYok) setHata("Bağlı bir model yok; yardımcı yanıt veremiyor.");
    else if (r?.yardim) { setCevap({ soru: s, ...(r.yardim as { yanit: string; kaynaklar: { ad: string; parca: string }[] }) }); setSoru(""); }
  };
  return (
    <div className="space-y-2 px-3.5 py-3">
      <form onSubmit={(e) => { e.preventDefault(); sor(); }} className="flex gap-1.5">
        <input value={soru} onChange={(e) => setSoru(e.target.value)} maxLength={600} placeholder="İade süresi kaç gün?" className="h-8 min-w-0 flex-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/25" />
        <button type="submit" disabled={!soru.trim() || !!gidiyor} aria-label="Sor" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-35">{gidiyor === "yardimci" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}</button>
      </form>
      {hata && <p className="text-[12px] text-amber-200/90">{hata}</p>}
      {cevap ? (
        <div className="rounded-[12px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[11.5px] text-white/45">{cevap.soru}</p>
          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/85">{cevap.yanit}</p>
          {cevap.kaynaklar.length > 0 && <p className="mt-1.5 flex flex-wrap gap-1">{cevap.kaynaklar.map((k, i) => <span key={i} title={k.parca} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/60"><BookOpen className="h-3 w-3" />{k.ad}</span>)}</p>}
          <button type="button" onClick={() => yanitaEkle(cevap.yanit)} className={cn(kucukDugme, "mt-2")}>Yanıta ekle</button>
        </div>
      ) : <p className="text-[12px] leading-relaxed text-white/45">Ajanın bilgi bölümlerine ve bu konuşmaya dayanarak yanıtlar; kaynağını gösterir.</p>}
    </div>
  );
}

const KANAL_AD = { whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" } as const;
export function PencereRozeti({ p }: { p: Pencere }) {
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setSimdi(Date.now()), 30_000); return () => clearInterval(t); }, []);
  const kalan = p.bitis ? p.bitis - simdi : -1;
  const acik = kalan > 0;
  const metin = acik ? `Pencere açık · ${sureYaz(kalan).replace(/ \d+ sn$/, "")} kaldı` : p.kanal === "whatsapp" ? "24 saat penceresi kapandı · yalnız şablon" : p.etiketBitis && p.etiketBitis > simdi ? `24 saat geçti · insan temsilci etiketiyle ${sureYaz(p.etiketBitis - simdi).replace(/ \d+ (sn|dk)$/, "")}` : "Yanıt penceresi kapandı";
  return <span title={`${KANAL_AD[p.kanal]} mesajlaşma penceresi: ziyaretçinin son mesajından sonra 24 saat${p.kanal !== "whatsapp" ? "; Messenger ve Instagram'da insan temsilci yanıtı 7 güne kadar" : ""}`} className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", acik ? "bg-white/[0.06] text-white/65" : "bg-amber-400/[0.14] text-amber-200")}><Clock3 className="h-3 w-3" />{metin}</span>;
}

export function SablonPaneli({ islem, gidiyor }: { islem: Islem; gidiyor: string }) {
  const [l, setL] = useState<WaSablon[] | null>(null);
  const [waba, setWaba] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [sec, setSec] = useState<WaSablon | null>(null);
  const [d, setD] = useState<Record<string, string>>({});
  const getir = async (g: Record<string, unknown> = { islem: "sablonlar" }) => {
    setHata("");
    const r = await islem(g);
    if (!r) return;
    if (r.wabaGerekli) { setWaba(""); setL([]); return; }
    setWaba(null); setL((r.sablonlar as WaSablon[]) ?? []);
  };
  useEffect(() => { getir(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const metin = sec ? sec.govde.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, k: string) => d[k] || `{{${k}}}`) : "";
  return (
    <div className="mx-auto max-w-[720px] rounded-[18px] bg-white/[0.03] p-3 ring-1 ring-inset ring-amber-300/20">
      <p className="text-[13px] font-semibold text-white">24 saat penceresi kapandı</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">WhatsApp, ziyaretçinin son mesajından 24 saat sonra serbest mesaja izin vermez. Meta'nın onayladığı bir şablonla konuşmayı yeniden başlat; ziyaretçi yanıtlayınca pencere yeniden açılır.</p>
      {waba !== null ? (
        <form onSubmit={(e) => { e.preventDefault(); if (waba.trim()) getir({ islem: "waba", wabaId: waba.trim() }); }} className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <input value={waba} onChange={(e) => setWaba(e.target.value.replace(/\D/g, "").slice(0, 25))} inputMode="numeric" placeholder="WhatsApp İşletme Hesabı kimliği" className="h-9 min-w-[220px] flex-1 rounded-full bg-white/[0.06] px-3.5 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-white/35" />
          <button type="submit" disabled={!waba.trim() || !!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-35">{gidiyor === "waba" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Şablonları getir</button>
          <span className="w-full text-[11.5px] text-white/40">Meta İşletme Yöneticisi, WhatsApp hesapları bölümünde görünür; bir kez kaydedilir.</span>
        </form>
      ) : l === null ? <div className="mt-3 flex items-center gap-2 text-[12.5px] text-white/50"><Loader2 className="h-3.5 w-3.5 animate-spin" />Şablonlar getiriliyor</div> : (
        <div className="mt-2.5 space-y-2">
          {!l.length && <p className="text-[12.5px] text-white/50">Onaylı şablon yok. Şablonu Meta WhatsApp Yöneticisi'nde oluşturup onaya gönder.</p>}
          <div className="flex flex-wrap gap-1.5">
            {l.map((s) => <button key={`${s.ad}:${s.dil}`} type="button" aria-pressed={sec?.ad === s.ad && sec.dil === s.dil} onClick={() => { setSec(s); setD({}); }} className={cn("h-8 rounded-full px-3 text-[12.5px] ring-inset", sec?.ad === s.ad && sec.dil === s.dil ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 ring-1 ring-white/[0.08] hover:text-white")}>{s.ad} <span className="text-white/40">{s.dil}</span></button>)}
          </div>
          {sec && (
            <div className="space-y-2 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
              {sec.baslik && <p className="text-[12.5px] font-semibold text-white/85">{sec.baslik}</p>}
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/80">{metin}</p>
              {sec.altBilgi && <p className="text-[11.5px] text-white/40">{sec.altBilgi}</p>}
              {sec.degiskenler.length > 0 && <div className="grid gap-1.5 sm:grid-cols-2">{sec.degiskenler.map((k) => <input key={k} value={d[k] ?? ""} onChange={(e) => setD((x) => ({ ...x, [k]: e.target.value }))} maxLength={1000} placeholder={`{{${k}}} değeri`} className="h-9 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/35 focus:ring-white/30" />)}</div>}
              <button type="button" disabled={!!gidiyor || sec.degiskenler.some((k) => !d[k]?.trim())} onClick={async () => { const r = await islem({ islem: "sablon-gonder", sablon: sec.ad, sablonDil: sec.dil, degiskenler: d }); if (r) { setSec(null); setD({}); } }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-35">{gidiyor === "sablon-gonder" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Şablonu gönder</button>
            </div>
          )}
        </div>
      )}
      {hata && <p className="mt-2 text-[12px] text-rose-300">{hata}</p>}
    </div>
  );
}

/** Mesaj çeviri satırı: ziyaretçi mesajında özgün metin, temsilci yanıtında temsilcinin yazdığı metin. */
export function CeviriSatiri({ etiket, metin }: { etiket: string; metin: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="mt-1">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70"><Languages className="h-3 w-3" />{etiket}<ChevronDown className={cn("h-3 w-3 transition-transform", acik && "rotate-180")} /></button>
      {acik && <p className="mt-0.5 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-white/55">{metin}</p>}
    </div>
  );
}
