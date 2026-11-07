"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUp, Bot, CalendarClock, Copy, Download, FileUp, Fingerprint, Inbox, Loader2, MessageSquare, MessagesSquare, MoreHorizontal, Pencil, Plus, Search, ShieldCheck, Sparkles, Trash2, Users, Wand2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { SaglayiciLogo } from "@/components/build/ModelSecici";
import { studyoYenile } from "@/components/build/kabuk/useStudyo";
import { AJAN_SABLONLARI, ARAC_KATALOG, BOLGE_AD, SABLON_KATEGORI, SEKTOR_AD, bolgeyeGore, type AjanSablon, type Bolge, type Sektor } from "@/lib/build/ajanKatalog";
import { AcilirSecim } from "./AjanDuzenleyici";
import { BAGLANTI_KATALOGU } from "@/lib/build/baglantiKatalog";
import { api, ApiHatasi, gorece, sahipAnahtari } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { AjanSimge, YanPanel, ajanlaSohbet, aracIkonu, birincil, ikincil, type AjanOzet } from "./ortak";

const ORNEK_TARIFLER = [
  "Her sabah sektörümdeki haberleri kaynaklarıyla özetleyen araştırmacı",
  "Ürün fotoğrafından Trendyol açıklaması ve vitrin görseli hazırlayan içerikçi",
  "Müşteri sorularını SSS belgeme göre yanıtlayan destek asistanı",
  "Kahve markam için haftalık Instagram planı ve görselleri çıkaran yönetici",
];

/** "Ne yapsın, anlat" kutusu: tarif ajan taslağına çevrilip düzenleyicide açılır. */
type PaketOnizleme = { ad: string; aciklama: string; model: string; arac: number; bilgi: number; test: number; gereken: string[] };
function paketOku(m: string): { p: unknown; o: PaketOnizleme } | { hata: string } | null {
  if (!m.trim()) return null;
  let p: Record<string, unknown>;
  try { p = JSON.parse(m); } catch { return { hata: "Dosya geçerli bir JSON değil." }; }
  if (p?.vayra !== "ajan") return { hata: "Bu dosya bir Vayra ajan paketi değil." };
  const a = (p.ayar ?? {}) as Record<string, unknown>;
  const g = (p.gereken ?? {}) as Record<string, string[]>;
  const say = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return { p, o: { ad: String(a.ad ?? ""), aciklama: String(a.aciklama ?? ""), model: modelBul(String(a.model ?? "")).ad, arac: Object.values((a.araclar ?? {}) as Record<string, string>).filter((x) => x !== "kapali").length, bilgi: say(a.bilgi), test: say(p.testler), gereken: [...(g.baglantilar ?? []), ...(g.yetenekler ?? []), ...(g.ekip ?? [])] } };
}

/** Vayra ajan paketini (JSON) içe aktarır: önizleme, gereken bağlantılar ve uyarılar. */
function IceAktarPaneli({ kapat }: { kapat: () => void }) {
  const router = useRouter();
  const [metin, setMetin] = useState("");
  const [dosyaAdi, setDosyaAdi] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [sonuc, setSonuc] = useState<{ id: string; uyarilar: string[] } | null>(null);
  const dosya = useRef<HTMLInputElement>(null);
  const c = useMemo(() => paketOku(metin), [metin]);
  const aktar = async () => {
    if (!c || "hata" in c) return;
    setGidiyor(true); setHata("");
    try {
      const v = await api<{ id: string; uyarilar?: string[] }>("/api/build/ajanlar", { govde: { paket: c.p } });
      if (v.uyarilar?.length) setSonuc({ id: v.id, uyarilar: v.uyarilar }); else router.push(`/panel/build/ajanlar/${v.id}`);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İçe aktarılamadı."); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik kapat={kapat} baslik="Ajanı içe aktar" alt="Vayra'dan dışa aktarılmış .vayra-ajan.json paketi"
      alt2={sonuc ? <><span className="flex-1" /><button type="button" onClick={() => router.push(`/panel/build/ajanlar/${sonuc.id}`)} className={birincil}>Ajanı aç</button></>
        : <><span className="flex-1" /><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" onClick={aktar} disabled={gidiyor || !c || "hata" in c} className={birincil}>{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}İçe aktar</button></>}>
      {sonuc ? (
        <div className="space-y-3">
          <p className="text-[13.5px] text-white/85">Ajan oluşturuldu. Açmadan önce şunlara bak:</p>
          {sonuc.uyarilar.map((u) => <p key={u} className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{u}</p>)}
        </div>
      ) : (
        <div className="space-y-4">
          <input ref={dosya} type="file" accept=".json,application/json" className="hidden" onChange={async (e) => { const x = e.target.files?.[0]; if (x) { setMetin(await x.text()); setDosyaAdi(x.name); } e.target.value = ""; }} />
          <button type="button" onClick={() => dosya.current?.click()} className="flex w-full items-center gap-3 rounded-[16px] bg-white/[0.03] px-4 py-3.5 text-left ring-1 ring-inset ring-dashed ring-white/[0.12] transition-colors hover:bg-white/[0.05]">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.1] text-[#8be6ff]"><FileUp className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0"><span className="block truncate text-[13.5px] font-medium text-white">{dosyaAdi || "Paket dosyası seç"}</span><span className="block text-[12px] text-white/45">Ya da içeriğini aşağıya yapıştır</span></span>
          </button>
          <textarea value={metin} onChange={(e) => { setMetin(e.target.value); setDosyaAdi(""); }} rows={5} placeholder='{"vayra": "ajan", ...}' className="block w-full resize-y rounded-[14px] bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/85 outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/25" />
          {c && "hata" in c && <p className="text-[12.5px] text-rose-300">{c.hata}</p>}
          {c && !("hata" in c) && (
            <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
              <p className="text-[15px] font-semibold text-white">{c.o.ad}</p>
              {c.o.aciklama && <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">{c.o.aciklama}</p>}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
                {[["Model", c.o.model], ["Açık araç", String(c.o.arac)], ["Bilgi kaynağı", String(c.o.bilgi)], ["Test", String(c.o.test)]].map(([k, v]) => <span key={k} className="rounded-[12px] bg-white/[0.04] px-3 py-2"><span className="block text-white/40">{k}</span><span className="block truncate font-medium text-white/90">{v}</span></span>)}
              </div>
              {c.o.gereken.length > 0 && <p className="mt-3 text-[12.5px] leading-relaxed text-white/50">İçe aktardıktan sonra yeniden seçilecek: {c.o.gereken.join(", ")}</p>}
            </div>
          )}
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        </div>
      )}
    </YanPanel>
  );
}

function AnlatKutusu() {
  const router = useRouter();
  const [tarif, setTarif] = useState("");
  const [gidiyor, setGidiyor] = useState<"" | "tarif" | "bos">("");
  const [hata, setHata] = useState("");
  const [ice, setIce] = useState(false);
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.min(t.scrollHeight, 200)}px`; } }, [tarif]);
  const kur = async (bos?: boolean) => {
    if (gidiyor || (!bos && !tarif.trim())) return;
    setGidiyor(bos ? "bos" : "tarif"); setHata("");
    try {
      const v = await api<{ id: string; yapayZeka?: boolean }>("/api/build/ajanlar", { govde: bos ? {} : { tarif: tarif.trim() } });
      router.push(`/panel/build/ajanlar/${v.id}${v.yapayZeka === false ? "?taslak=1" : ""}`);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Ajan kurulamadı."); setGidiyor(""); }
  };
  return (
    <Kart ikon={Wand2} baslik="Ajan kur" alt="Ne yapsın, anlat; adını, talimatını ve araçlarını Vayra kursun" govde="p-4 sm:p-5"
      sag={<>
        <button type="button" onClick={() => setIce(true)} title="Paketten içe aktar" aria-label="Paketten içe aktar" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white hover:bg-white/[0.13]"><FileUp className="h-4 w-4" /></button>
        <button type="button" onClick={() => kur(true)} disabled={!!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13] disabled:opacity-50">{gidiyor === "bos" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Boş ajan</button>
      </>}>
      <div className="cam-istemci rounded-[22px] p-2">
        <textarea ref={alan} value={tarif} onChange={(e) => setTarif(e.target.value)} rows={2} maxLength={4000}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); kur(); } }}
          placeholder="Örneğin: Her pazartesi rakiplerimin fiyatlarını kontrol edip tabloya döken bir ajan…"
          className="block min-h-[64px] w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/35" />
        <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
          <span className="pl-2 text-[12px] text-white/40">Sonra her ayarı değiştirebilirsin</span>
          <button type="button" onClick={() => kur()} disabled={!tarif.trim() || !!gidiyor} aria-label="Ajanı kur"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white pl-4 pr-3 text-[14px] font-semibold text-black transition-opacity disabled:opacity-35">
            {gidiyor === "tarif" ? <><Loader2 className="h-4 w-4 animate-spin" />Kuruluyor</> : <>Kur<ArrowUp className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
      {hata && <p className="mt-3 text-[13px] text-rose-300">{hata}</p>}
      {ice && <IceAktarPaneli kapat={() => setIce(false)} />}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ORNEK_TARIFLER.map((o) => (
          <button key={o} type="button" onClick={() => { setTarif(o); alan.current?.focus(); }} className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-left text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.1] hover:text-white">{o}</button>
        ))}
      </div>
    </Kart>
  );
}

function AracSirasi({ l, sinir = 5 }: { l: string[]; sinir?: number }) {
  if (!l.length) return <span className="text-[12px] text-white/35">Araçsız</span>;
  return (
    <span className="flex items-center gap-1">
      {l.slice(0, sinir).map((id) => { const I = aracIkonu(id); const t = ARAC_KATALOG.find((a) => a.id === id); return <span key={id} title={t?.ad ?? id} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07] text-white/65"><I className="h-3 w-3" /></span>; })}
      {l.length > sinir && <span className="text-[11.5px] text-white/40">+{l.length - sinir}</span>}
    </span>
  );
}

function AjanKarti({ a, yenile }: { a: AjanOzet; yenile: () => void }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [gidiyor, setGidiyor] = useState(false);
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const f = (e: PointerEvent) => { if (!kok.current?.contains(e.target as Node)) { setMenu(false); setSilOnay(false); } };
    addEventListener("pointerdown", f);
    return () => removeEventListener("pointerdown", f);
  }, [menu]);
  const m = modelBul(a.model);
  const sohbet = async () => { if (gidiyor) return; setGidiyor(true); try { router.push(`/panel/build/sohbet/${await ajanlaSohbet(a.id)}`); studyoYenile(); } catch { setGidiyor(false); } };
  return (
    <div className="group relative flex flex-col rounded-[22px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
      <Link href={`/panel/build/ajanlar/${a.id}`} className="absolute inset-0 rounded-[22px]" aria-label={`${a.ad} ajanını düzenle`} />
      <div className="flex items-start gap-3">
        <AjanSimge src={a.simge} boyut={52} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-[15px] font-semibold text-white">{a.ad}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/45"><SaglayiciLogo m={m} boyut={11} />{m.ad}</p>
        </div>
        <div ref={kok} className={cn("relative", menu ? "z-30" : "z-10")}>
          <button type="button" onClick={() => setMenu((x) => !x)} aria-label="Ajan menüsü" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
          <AnimatePresence>
            {menu && (
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
                className="absolute right-0 top-9 z-30 w-[210px] rounded-[16px] bd-panel p-1.5">
                <button type="button" onClick={sohbet} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><MessageSquare className="h-4 w-4 text-white/55" />Sohbet başlat</button>
                <Link href={`/panel/build/ajanlar/${a.id}`} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><Pencil className="h-4 w-4 text-white/55" />Düzenle</Link>
                <button type="button" onClick={async () => { setMenu(false); await api("/api/build/ajanlar", { govde: { kopya: a.id } }).catch(() => {}); yenile(); }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><Copy className="h-4 w-4 text-white/55" />Kopyasını oluştur</button>
                <button type="button" onClick={async () => {
                  setMenu(false);
                  const r = await fetch(`/api/build/ajanlar/${a.id}/paket?indir=1`, { headers: { "x-build-sahip": sahipAnahtari() } }).catch(() => null);
                  if (!r?.ok) return;
                  const u = URL.createObjectURL(await r.blob());
                  const l = document.createElement("a"); l.href = u; l.download = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "ajan.vayra-ajan.json"; l.click();
                  setTimeout(() => URL.revokeObjectURL(u), 2000);
                }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><Download className="h-4 w-4 text-white/55" />Dışa aktar</button>
                <div className="my-1 h-px bg-white/[0.07]" />
                <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/ajanlar/${a.id}`, { method: "DELETE" }).catch(() => {}); yenile(); }}
                  className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] hover:bg-rose-500/[0.1]", silOnay ? "bg-rose-500/[0.12] font-semibold text-rose-200" : "text-rose-300/90")}><Trash2 className="h-4 w-4" />{silOnay ? "Silmek için tekrar tıkla" : "Sil"}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 min-h-[38px] text-[13px] leading-[1.45] text-white/60">{a.aciklama || "Açıklama yok"}</p>
      <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
        <AracSirasi l={a.araclar} />
        <span className="ml-auto flex items-center gap-1.5">
          {a.tetik > 0 && <span title={`${a.tetik} açık tetik`} className="flex h-6 items-center gap-1 rounded-full bg-white/[0.06] px-2 text-[11.5px] text-white/60"><CalendarClock className="h-3 w-3" />{a.tetik}</span>}
          <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium", a.yayinda ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/50")}>{a.yayinda ? `Yayında, sürüm ${a.surum}` : "Taslak"}</span>
        </span>
      </div>
      <div className="relative z-10 mt-3 flex items-center gap-2">
        <button type="button" onClick={sohbet} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}Sohbet</button>
        <span className="text-[11.5px] text-white/40">{a.sohbet ? `${a.sohbet} sohbet · ` : ""}{gorece(a.guncelleme)}</span>
      </div>
    </div>
  );
}

type BagDurum = { katalogId?: string; durum: string }[];
const hazirMi = (s: AjanSablon, b: BagDurum | null) => !(s.gerekli ?? []).length || (!!b && (s.gerekli ?? []).every((k) => b.some((x) => x.katalogId === k && x.durum === "etkin")));
function Rozet({ s, b }: { s: AjanSablon; b: BagDurum | null }) {
  if (!(s.gerekli ?? []).length) return null;
  const h = hazirMi(s, b);
  return <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium backdrop-blur", h ? "bg-[#55d6fd]/[0.18] text-[#bdf0ff]" : "bg-amber-400/[0.18] text-amber-100")}>{h ? "Hazır" : "Kurulum gerekiyor"}</span>;
}
function BagLogolari({ s }: { s: AjanSablon }) {
  const l = (s.gerekli ?? []).map((k) => BAGLANTI_KATALOGU.find((x) => x.id === k)).filter((x): x is NonNullable<typeof x> => !!x);
  if (!l.length) return null;
  return <span className="flex items-center gap-1">{l.map((k) => <span key={k.id} title={k.ad} className="flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-white/10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={k.logo} alt={k.ad} className="h-3.5 w-3.5 object-contain" /></span>)}</span>;
}

/** Hazır ajan ayrıntısı: sağdan açılan panel. */
function SablonPaneli({ s, b, kapat, kur, gidiyor }: { s: AjanSablon; b: BagDurum | null; kapat: () => void; kur: () => void; gidiyor: boolean }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [kapat]);
  if (!hazir) return null;
  const araclar = Object.keys(s.araclar);
  const gerekli = (s.gerekli ?? []).map((k) => BAGLANTI_KATALOGU.find((x) => x.id === k)).filter((x): x is NonNullable<typeof x> => !!x);
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex justify-end bg-black/50 sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <motion.div role="dialog" aria-modal="true" aria-label={s.ad} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="flex h-full w-full max-w-[560px] flex-col overflow-hidden bg-[#141416] ring-1 ring-white/[0.1] sm:rounded-[24px]">
        <div className="relative h-[220px] shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.kapak} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/30 to-transparent" />
          <button type="button" onClick={kapat} aria-label="Kapat" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"><X className="h-4 w-4" /></button>
          <div className="absolute inset-x-5 bottom-4 flex items-end gap-3">
            <AjanSimge src={s.simge} boyut={64} className="ring-2 ring-[#141416]" />
            <div className="min-w-0 pb-1"><p className="text-[20px] font-semibold tracking-[-0.02em] text-white">{s.ad}</p><p className="text-[12.5px] text-white/55">{SABLON_KATEGORI[s.kategori]} · {(s.bolge ?? ["global"]).map((b) => BOLGE_AD[b]).join(", ")} · Vayra'dan</p></div>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">
          <p className="text-[14.5px] leading-relaxed text-white/75">{s.aciklama}</p>
          {gerekli.length > 0 && (
            <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
              <p className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Gereken bağlantılar<span className="ml-auto"><Rozet s={s} b={b} /></span></p>
              <div className="divide-y divide-white/[0.05]">
                {gerekli.map((k) => { const bagli = !!b?.some((x) => x.katalogId === k.id && x.durum === "etkin"); return (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white ring-1 ring-white/10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={k.logo} alt="" className="h-4 w-4 object-contain" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{k.ad}</span><span className="block truncate text-[12px] text-white/45">{k.aciklama}</span></span>
                    {bagli ? <span className="rounded-full bg-[#55d6fd]/[0.12] px-2.5 py-1 text-[11.5px] text-[#8be6ff]">Bağlı</span> : <Link href={`/panel/build/baglantilar?baglan=${k.id}`} className="inline-flex h-8 items-center rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">Bağla</Link>}
                  </div>
                ); })}
              </div>
              {!hazirMi(s, b) && <p className="border-t border-white/[0.06] px-4 py-2.5 text-[12px] leading-relaxed text-white/45">Ajanı şimdi kurabilirsin; bağlantıyı ekleyince ajanın Bağlantılar bölümünden aç.</p>}
            </section>
          )}
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Araçlar</p>
            <div className="divide-y divide-white/[0.05]">
              {araclar.length ? araclar.map((id) => { const t = ARAC_KATALOG.find((x) => x.id === id)!; const I = aracIkonu(id); return (
                <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.07] text-white/75"><I className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{t.ad}</span><span className="block text-[12px] text-white/45">{t.alt}</span></span>
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/60">{s.araclar[id] === "sor" ? "Önce sorar" : "Kendisi kullanır"}</span>
                </div>
              ); }) : <p className="px-4 py-3 text-[13px] text-white/50">Araç kullanmaz; bilgi belgelerine{gerekli.length ? " ve bağlantılara" : ""} dayanır.</p>}
            </div>
          </section>
          {(s.tetik || s.devir?.acik || s.koruma?.kisisel) && (
            <section className="space-y-2 rounded-[18px] p-4 ring-1 ring-inset ring-white/[0.08]">
              {s.tetik && <p className="flex items-start gap-2 text-[13px] leading-relaxed text-white/75"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" /><span><span className="text-white">Hazır zamanlama: {s.tetik.metin}.</span> Kurulumda kapalı gelir; Tetikler bölümünden açarsın.</span></p>}
              {s.devir?.acik && <p className="flex items-start gap-2 text-[13px] leading-relaxed text-white/75"><Users className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" /><span><span className="text-white">İnsana devir açık:</span> {s.devir.kurallar}</span></p>}
              {s.koruma?.kisisel && <p className="flex items-start gap-2 text-[13px] leading-relaxed text-white/75"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" />Kişisel veriler gizlenir.</p>}
            </section>
          )}
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Talimat</p>
            <p className="whitespace-pre-wrap px-4 py-3 text-[13px] leading-relaxed text-white/65">{s.talimat}</p>
          </section>
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Başlangıç önerileri</p>
            <div className="flex flex-wrap gap-1.5 p-3">{s.baslangiclar.map((x) => <span key={x} className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[12.5px] text-white/70">{x}</span>)}</div>
          </section>
        </div>
        <div className="flex items-center gap-2 border-t border-white/[0.06] p-3 sm:p-4">
          <span className="flex-1 pl-1 text-[12.5px] text-white/45">Kopyan senin olur; her şeyi değiştirebilirsin.</span>
          <button type="button" onClick={kur} disabled={gidiyor} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black disabled:opacity-60">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Bu ajanı kur</button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function HazirAjanlar() {
  const router = useRouter();
  const [kat, setKat] = useState<"hepsi" | AjanSablon["kategori"]>("hepsi");
  const [ara, setAra] = useState("");
  const [sektor, setSektor] = useState("");
  const [sinir, setSinir] = useState(24);
  const [acik, setAcik] = useState<AjanSablon | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [bag, setBag] = useState<BagDurum | null>(null);
  useEffect(() => { api<{ baglantilar: BagDurum }>("/api/build/baglantilar").then((v) => setBag(v.baglantilar)).catch(() => setBag([])); }, []);
  const [bolge, setBolge] = useState<Bolge | "hepsi">("global");
  const q = ara.trim().toLocaleLowerCase("tr");
  const taban = useMemo(() => bolgeyeGore(AJAN_SABLONLARI, bolge), [bolge]);
  const l = useMemo(() => taban.filter((s) => (kat === "hepsi" || s.kategori === kat) && (!sektor || (s.sektor ?? "genel") === sektor) && (!q || `${s.ad} ${s.aciklama} ${SEKTOR_AD[s.sektor ?? "genel"]} ${(s.bolge ?? []).map((b) => BOLGE_AD[b]).join(" ")}`.toLocaleLowerCase("tr").includes(q))), [taban, kat, q, sektor]);
  useEffect(() => setSinir(24), [kat, q, sektor, bolge]);
  const sektorler = (Object.keys(SEKTOR_AD) as Sektor[]).map((x) => ({ id: x, ad: SEKTOR_AD[x], alt: `${taban.filter((s) => (s.sektor ?? "genel") === x).length} hazır ajan` })).filter((x) => !x.alt.startsWith("0 "));
  const bolgeler = [...(Object.keys(BOLGE_AD) as Bolge[]).map((b) => ({ id: b, ad: BOLGE_AD[b], sayi: bolgeyeGore(AJAN_SABLONLARI, b).length })), { id: "hepsi" as const, ad: "Tümü", sayi: AJAN_SABLONLARI.length }];
  const kur = async (s: AjanSablon) => {
    if (gidiyor) return;
    setGidiyor(s.id);
    try { const v = await api<{ id: string }>("/api/build/ajanlar", { govde: { sablon: s.id } }); router.push(`/panel/build/ajanlar/${v.id}`); }
    catch { setGidiyor(null); }
  };
  const kategoriler = (Object.keys(SABLON_KATEGORI) as AjanSablon["kategori"][]).map((k) => ({ id: k, ad: SABLON_KATEGORI[k], sayi: taban.filter((s) => s.kategori === k).length })).filter((k) => k.sayi);
  return (
    <Kart ikon={Sparkles} baslik="Hazır ajanlar" alt={`${AJAN_SABLONLARI.length} ajan · tek tıkla kur, sonra kendine göre değiştir`} govde="p-4 sm:p-5"
      sag={<div className="relative max-sm:hidden"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ajan ara" className="h-9 w-[200px] rounded-full bg-white/[0.06] pl-8 pr-3 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/30" /></div>}>
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center gap-2.5"><span className="shrink-0 text-[12.5px] text-white/45">Pazar</span><div className="min-w-0"><Suzgec id="ajan-bolge" deger={bolge} set={setBolge} l={bolgeler} /></div></div>
        <div className="flex flex-wrap items-center gap-2"><div className="min-w-0 flex-1"><Suzgec id="ajan-kat" deger={kat} set={setKat} l={[{ id: "hepsi" as const, ad: "Hepsi", sayi: taban.length }, ...kategoriler]} /></div><div className="w-[230px] max-sm:w-full"><AcilirSecim deger={sektor} set={setSektor} bos="Bütün sektörler" l={sektorler} /></div></div>
        <div className="relative sm:hidden"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ajan ara" className="h-10 w-full rounded-full bg-white/[0.06] pl-8 pr-3 text-[13.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40" /></div>
      </div>
      {!l.length ? <p className="py-8 text-center text-[13px] text-white/50">Aramana uyan hazır ajan yok. Yukarıdaki kutuya ne yapmasını istediğini anlat, Vayra kursun.</p> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {l.slice(0, sinir).map((s) => (
            <div key={s.id} className="group relative overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
              <button type="button" onClick={() => setAcik(s)} className="absolute inset-0 z-[1]" aria-label={`${s.ad} ayrıntıları`} />
              <div className="relative aspect-[16/8] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.kapak} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#121315] via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white/85 backdrop-blur">{SABLON_KATEGORI[s.kategori]}{(s.bolge ?? ["global"]).includes("global") ? "" : ` · ${(s.bolge ?? []).map((b) => BOLGE_AD[b]).join(", ")}`}</span>
                <span className="absolute right-3 top-3"><Rozet s={s} b={bag} /></span>
              </div>
              <div className="relative -mt-7 px-4 pb-4">
                <AjanSimge src={s.simge} boyut={48} className="ring-2 ring-[#121315]" />
                <p className="mt-2.5 text-[15px] font-semibold text-white">{s.ad}</p>
                <p className="mt-1 line-clamp-2 min-h-[38px] text-[13px] leading-[1.45] text-white/55">{s.aciklama}</p>
                <div className="mt-3 flex items-center gap-2">
                  <AracSirasi l={Object.keys(s.araclar)} sinir={3} />
                  <BagLogolari s={s} />
                  {s.tetik && <span title={s.tetik.metin} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.07] text-white/65"><CalendarClock className="h-3 w-3" /></span>}
                  <button type="button" onClick={() => kur(s)} className="relative z-[2] ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">{gidiyor === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Kur</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {l.length > sinir && <div className="mt-4 flex justify-center"><button type="button" onClick={() => setSinir((x) => x + 36)} className="inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[13px] font-medium text-white transition hover:bg-white/[0.13] active:scale-95">Daha fazla göster<span className="tabular-nums text-white/45">{l.length - sinir}</span></button></div>}
      <AnimatePresence>{acik && <SablonPaneli s={acik} b={bag} kapat={() => setAcik(null)} kur={() => kur(acik)} gidiyor={gidiyor === acik.id} />}</AnimatePresence>
    </Kart>
  );
}

/** Ajanlar sayfası: anlatarak kur, ajanların, hazır ajanlar. */
export function AjanListesi() {
  const [ajanlar, setAjanlar] = useState<AjanOzet[] | null>(null);
  const [gorev, setGorev] = useState(0);
  const yenile = () => { api<{ ajanlar: AjanOzet[] }>("/api/build/ajanlar").then((v) => setAjanlar(v.ajanlar)).catch(() => setAjanlar([])); };
  useEffect(yenile, []);
  const [gelen, setGelen] = useState(0);
  useEffect(() => { const f = () => { api<{ sayac: number }>("/api/build/ajanlar/gorevler?sayac=1").then((v) => setGorev(v.sayac)).catch(() => {}); api<{ bekliyor: number; okunmamis: number }>("/api/build/ajanlar/gelen?sayac=1").then((v) => setGelen(Math.max(v.bekliyor, v.okunmamis))).catch(() => {}); }; f(); const t = setInterval(f, 30_000); return () => clearInterval(t); }, []);
  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <AnlatKutusu />
      {ajanlar === null ? <div className="h-[240px] animate-pulse rounded-[26px] bg-white/[0.03]" /> : ajanlar.length > 0 && (
        <Kart ikon={Bot} baslik="Ajanların" alt={`${ajanlar.length} ajan · son düzenlenen önde`} govde="p-4 sm:p-5"
          sag={<><Link href="/panel/build/ajanlar/gelen" className="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]"><MessagesSquare className="h-3.5 w-3.5" /><span className="max-sm:hidden">Gelen kutusu</span>{gelen > 0 && <span className="ml-0.5 min-w-[20px] rounded-full bg-[#55d6fd] px-1.5 text-center text-[11.5px] font-semibold tabular-nums leading-5 text-black">{gelen > 99 ? "99+" : gelen}</span>}</Link><Link href="/panel/build/ajanlar/gorevler" className="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]"><Inbox className="h-3.5 w-3.5" /><span className="max-sm:hidden">Görevler</span>{gorev > 0 && <span className="ml-0.5 min-w-[20px] rounded-full bg-[#55d6fd] px-1.5 text-center text-[11.5px] font-semibold tabular-nums leading-5 text-black">{gorev > 99 ? "99+" : gorev}</span>}</Link><Link href="/panel/build/ajanlar/kisiler" aria-label="Kişiler" className="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]"><Fingerprint className="h-3.5 w-3.5" /><span className="max-sm:hidden">Kişiler</span></Link></>}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {ajanlar.map((a) => <AjanKarti key={a.id} a={a} yenile={yenile} />)}
          </div>
        </Kart>
      )}
      <HazirAjanlar />
    </div>
  );
}
