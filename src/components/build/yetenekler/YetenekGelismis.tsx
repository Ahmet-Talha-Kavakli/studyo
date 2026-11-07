"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Bot, CheckCircle2, Download, GitCompare, Globe, Gauge, Loader2, Play, Star, X, XCircle } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { yetenekKalite } from "@/lib/build/yetenekKalite";
import { cn } from "@/lib/utils";
import { fark, type YetenekV2 } from "./YetenekAraclari";

type Dosya = { yol: string; icerik: string };

/* ───────────── Kalite ───────────── */
/** Kalite puanı kartı: altı boyut (0-3), doğrulama kuralları, öneriler. */
export function KaliteKarti({ y, digerleri }: { y: Pick<YetenekV2, "ad" | "aciklama" | "govde" | "dosyalar">; digerleri: { ad: string; aciklama: string }[] }) {
  const k = useMemo(() => yetenekKalite(y, digerleri), [y, digerleri]);
  const kalan = k.kurallar.filter((x) => !x.gecti);
  return (
    <Kart ikon={Gauge} baslik="Kalite" alt={`Belirtim kuralları ve yazım ölçütleri · açıklama yaklaşık ${k.belirtec.aciklama} belirteç her zaman bağlamda, gövde yaklaşık ${k.belirtec.govde.toLocaleString("tr-TR")} belirteç yüklenince`}
      sag={<span className={cn("rounded-full px-3 py-1 text-[13px] font-semibold tabular-nums", k.puan >= 80 ? "bg-[#55d6fd]/[0.14] text-[#8be6ff]" : k.puan >= 55 ? "bg-amber-400/[0.12] text-amber-200" : "bg-rose-500/[0.12] text-rose-200")}>yüzde {k.puan}</span>}>
      <div className="divide-y divide-white/[0.05]">
        {k.boyutlar.map((b) => (
          <div key={b.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
            <span className="mt-1 flex shrink-0 gap-[3px]" aria-label={`${b.puan} / 3`}>{[0, 1, 2].map((i) => <span key={i} className={cn("h-2 w-4 rounded-full", i < b.puan ? (b.puan === 3 ? "bg-[#55d6fd]" : "bg-amber-300") : "bg-white/[0.1]")} />)}</span>
            <span className="min-w-0 flex-1"><span className="block text-[13px] text-white">{b.ad}</span><span className="block text-[12px] text-white/50">{b.neden}</span>{b.oneri && <span className="mt-0.5 block text-[12px] leading-snug text-[#bdefff]/80">{b.oneri}</span>}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-4 py-3 sm:px-5">
        {k.kurallar.map((r) => <span key={r.ad} title={r.mesaj} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px]", r.gecti ? "bg-white/[0.06] text-white/60" : r.seviye === "hata" ? "bg-rose-500/[0.12] text-rose-200" : "bg-amber-400/[0.1] text-amber-200")}>{r.gecti ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{r.ad}</span>)}
      </div>
      {kalan.length > 0 && <p className="border-t border-white/[0.06] px-4 py-2.5 text-[12px] leading-relaxed text-white/55 sm:px-5">{kalan.map((r) => r.mesaj).join(" · ")}</p>}
    </Kart>
  );
}

/* ───────────── Betik çalıştırıcı ───────────── */
type BetikSonuc = { donus: unknown; loglar: string[]; dosyalar: Dosya[]; sure: number; hata?: string; disIstekler: { adres: string; durum: number; sure: number; hata?: string }[] };
/** Bir scripts/*.js dosyasını kum havuzunda çalıştırır: JSON girdi, dönüş, console çıktısı, üretilen dosyalar. */
export function BetikCalistirici({ id, yol, kaydet }: { id: string; yol: string; kaydet: () => Promise<void> }) {
  const [girdi, setGirdi] = useState("{}");
  const [s, setS] = useState<BetikSonuc | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const calistir = async () => {
    let g: unknown;
    try { g = JSON.parse(girdi || "{}"); } catch { setHata("Girdi geçerli JSON değil."); return; }
    setGidiyor(true); setHata("");
    try { await kaydet(); setS(await api<BetikSonuc>(`/api/build/yetenekler/${id}/betik`, { govde: { yol, girdi: g } })); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Çalıştırılamadı."); }
    finally { setGidiyor(false); }
  };
  const indir = (d: Dosya) => { const u = URL.createObjectURL(new Blob([d.icerik], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = u; a.download = d.yol.split("/").pop() ?? "cikti.txt"; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  return (
    <div className="space-y-2 rounded-[16px] bg-black/20 p-3 ring-1 ring-inset ring-white/[0.06]">
      <p className="text-[12px] leading-relaxed text-white/50">Kum havuzunda çalışır: 5 saniye, 32 MB, ağ izin listesi dışında kapalı. Birden çok işlev sunan betikte girdiye <code className="text-white/70">{`{"islev": "ad", "argumanlar": [...]}`}</code> yaz.</p>
      <textarea value={girdi} onChange={(e) => setGirdi(e.target.value)} rows={4} spellCheck={false} aria-label="Betik girdisi (JSON)" className={cn(alanSinif, "resize-y py-2 font-mono text-[12px]")} />
      <div className="flex items-center gap-2"><span className="flex-1 text-[11.5px] text-white/40">{s ? `${s.sure} ms${s.disIstekler.length ? ` · ${s.disIstekler.length} dış istek` : ""}` : ""}</span>
        <button type="button" onClick={calistir} disabled={gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Çalıştır</button></div>
      {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      {s && (
        <div className="space-y-2">
          {s.hata ? <p className="rounded-[12px] bg-rose-500/[0.07] px-3 py-2 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/15">{s.hata}</p>
            : <div><p className="mb-1 text-[11.5px] text-white/45">Dönüş</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-[12px] bg-black/30 p-2.5 font-mono text-[11.5px] text-white/80 ring-1 ring-inset ring-white/[0.06]">{JSON.stringify(s.donus, null, 2)}</pre></div>}
          {s.loglar.length > 0 && <div><p className="mb-1 text-[11.5px] text-white/45">Çıktı</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[12px] bg-black/30 p-2.5 font-mono text-[11.5px] text-white/70 ring-1 ring-inset ring-white/[0.06]">{s.loglar.join("\n")}</pre></div>}
          {s.dosyalar.length > 0 && <div className="flex flex-wrap gap-1.5">{s.dosyalar.map((d) => <button key={d.yol} type="button" onClick={() => indir(d)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12]"><Download className="h-3.5 w-3.5" />{d.yol}</button>)}</div>}
          {s.disIstekler.map((x, i) => <p key={i} className="text-[11.5px] text-white/45">{x.adres} · {x.durum || "hata"} · {x.sure} ms{x.hata ? ` · ${x.hata}` : ""}</p>)}
        </div>
      )}
    </div>
  );
}

/** Betiklerin ağ erişimi: izin verilen alan adları (boşsa kapalı). */
export function BetikAg({ y, d }: { y: YetenekV2 & { betikAg?: string[] }; d: (p: { betikAg: string[] }) => void }) {
  const [yeni, setYeni] = useState("");
  const l = y.betikAg ?? [];
  const ekle = () => { const v = yeni.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""); if (/^(\*\.)?[a-z0-9.-]+\.[a-z]{2,}$/.test(v) && !l.includes(v)) d({ betikAg: [...l, v].slice(0, 20) }); setYeni(""); };
  return (
    <div className="space-y-2 border-t border-white/[0.05] p-4 sm:px-5">
      <p className="flex items-center gap-2 text-[13px] font-medium text-white"><Globe className="h-3.5 w-3.5 text-white/50" />Betiklerin ağ erişimi</p>
      <p className="text-[12px] leading-relaxed text-white/45">{l.length ? "Betikler yalnız bu alan adlarına istek atabilir (alt alan adları dahil)." : "Kapalı: betikler hiçbir adrese istek atamaz. Gerekirse izin verilen alan adını ekle."}</p>
      {l.length > 0 && <div className="flex flex-wrap gap-1.5">{l.map((a) => <span key={a} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1 text-[12px] text-white/80">{a}<button type="button" onClick={() => d({ betikAg: l.filter((x) => x !== a) })} aria-label={`${a} iznini kaldır`} className="flex h-5 w-5 items-center justify-center rounded-full text-white/45 hover:text-white"><X className="h-3 w-3" /></button></span>)}</div>}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ekle(); }}><input value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder="api.servis.com" className={cn(alanSinif, "h-9 text-[13px]")} /><button type="submit" disabled={!yeni.trim()} className="h-9 shrink-0 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white disabled:opacity-40">İzin ver</button></form>
    </div>
  );
}

/* ───────────── Sürüm karşılaştırma ───────────── */
type Anlik = { ad: string; aciklama: string; govde: string; dosyalar: Dosya[] };
function Fark({ a, b, bos }: { a: string; b: string; bos?: string }) {
  const l = useMemo(() => fark(a, b), [a, b]);
  const [tam, setTam] = useState(false);
  if (l.every((x) => x.t === "=")) return <p className="px-4 py-3 text-[12.5px] text-white/50">{bos ?? "Aynı."}</p>;
  // Değişmeyen uzun bölümler daraltılır (değişikliğin 2 satır çevresi gösterilir).
  const goster = l.map((x, i) => tam || x.t !== "=" || l.slice(Math.max(0, i - 2), i + 3).some((y) => y.t !== "="));
  return (
    <div className="max-h-[420px] overflow-auto py-2 font-mono text-[11.5px] leading-relaxed [scrollbar-width:thin]">
      {l.map((x, i) => goster[i] ? <p key={i} className={cn("whitespace-pre-wrap break-words px-4", x.t === "+" ? "bg-[#55d6fd]/[0.08] text-[#bdefff]" : x.t === "-" ? "bg-rose-500/[0.08] text-rose-200/90" : "text-white/45")}>{x.t === "+" ? "+ " : x.t === "-" ? "- " : "  "}{x.s || " "}</p>
        : !goster[i - 1] ? null : <button key={i} type="button" onClick={() => setTam(true)} className="block w-full px-4 py-0.5 text-left font-sans text-[11.5px] text-white/35 hover:text-white/70">değişmeyen satırlar gizli, göstermek için tıkla</button>)}
    </div>
  );
}
/** Herhangi iki sürümü (ya da taslağı) karşılaştırır: açıklama, gövde ve dosya dosya farklar. */
export function SurumKarsilastir({ y, kapat, ilkA }: { y: YetenekV2; kapat: () => void; ilkA?: number }) {
  const [hazir, setHazir] = useState(false);
  const { en, stil, min, max, varsayilan, anahtar } = useKenarStili("yetenek-fark", 760, 480, 1100);
  useEffect(() => setHazir(true), []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [kapat]);
  const secenek = [{ id: "taslak", ad: "Taslak", alt: "Şu anki düzenleme" }, ...[...y.surumler].reverse().map((s) => ({ id: String(s.no), ad: `Sürüm ${s.no}`, alt: `${s.not ?? ""}${s.not ? " · " : ""}${gorece(s.tarih)}${y.sabitSurum === s.no ? " · sabit" : ""}` }))];
  const [a, setA] = useState(String(ilkA ?? y.surumler.at(-2)?.no ?? y.surumler[0]?.no ?? "taslak"));
  const [b, setB] = useState("taslak");
  const [dosya, setDosya] = useState<string | null>(null);
  const al = (k: string): Anlik => { if (k === "taslak") return { ad: y.ad, aciklama: y.aciklama, govde: y.govde, dosyalar: y.dosyalar }; const s = y.surumler.find((x) => String(x.no) === k)!; return { ad: y.ad, aciklama: s.aciklama, govde: s.govde, dosyalar: s.dosyalar ?? [] }; };
  const A = al(a), B = al(b);
  const dosyalar = [...new Set([...A.dosyalar.map((d) => d.yol), ...B.dosyalar.map((d) => d.yol)])].map((yol) => {
    const x = A.dosyalar.find((d) => d.yol === yol), z = B.dosyalar.find((d) => d.yol === yol);
    return { yol, durum: !x ? "eklendi" : !z ? "silindi" : x.icerik === z.icerik ? "ayni" : "degisti", a: x?.icerik ?? "", b: z?.icerik ?? "" } as const;
  });
  const sayac = useMemo(() => { const l = fark(`${A.aciklama}\n${A.govde}`, `${B.aciklama}\n${B.govde}`); return { arti: l.filter((x) => x.t === "+").length, eksi: l.filter((x) => x.t === "-").length }; }, [A.aciklama, A.govde, B.aciklama, B.govde]);
  if (!hazir) return null;
  const DURUM = { eklendi: "bg-[#55d6fd]/[0.12] text-[#8be6ff]", silindi: "bg-rose-500/[0.12] text-rose-200", degisti: "bg-amber-400/[0.1] text-amber-200", ayni: "bg-white/[0.06] text-white/45" } as const;
  const DURUM_AD = { eklendi: "Eklendi", silindi: "Silindi", degisti: "Değişti", ayni: "Aynı" } as const;
  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-black/45" />
      <motion.aside role="dialog" aria-modal="true" aria-label="Sürüm karşılaştır" style={stil} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }} className="bd-panel absolute inset-y-0 right-0 flex w-full flex-col sm:w-[var(--yan-en)] sm:rounded-l-[22px]">
        <KenarTutamac en={en} anahtar={anahtar} varsayilan={varsayilan} min={min} max={max} className="max-sm:hidden" />
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.07]"><GitCompare className="h-5 w-5 text-white" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold text-white">Sürüm karşılaştır</p><p className="truncate text-[12.5px] text-white/50">{y.baslik} · {sayac.arti} satır eklendi, {sayac.eksi} satır çıktı · {dosyalar.filter((d) => d.durum !== "ayni").length} dosya farklı</p></div>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <div className="grid grid-cols-2 gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
          <div><p className="mb-1 text-[11.5px] text-white/45">Önceki</p><AcilirSecim deger={a} set={setA} l={secenek} /></div>
          <div><p className="mb-1 text-[11.5px] text-white/45">Sonraki</p><AcilirSecim deger={b} set={setB} l={secenek} /></div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]"><p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Açıklama</p><Fark a={A.aciklama} b={B.aciklama} bos="Açıklama aynı." /></section>
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]"><p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Talimat (SKILL.md gövdesi)</p><Fark a={A.govde} b={B.govde} bos="Talimat aynı." /></section>
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Dosyalar ({dosyalar.length})</p>
            {dosyalar.length ? <div className="divide-y divide-white/[0.05]">{dosyalar.map((d) => (
              <div key={d.yol}>
                <button type="button" disabled={d.durum === "ayni"} onClick={() => setDosya(dosya === d.yol ? null : d.yol)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left enabled:hover:bg-white/[0.02]">
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-white/80">{d.yol}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", DURUM[d.durum])}>{DURUM_AD[d.durum]}</span>
                </button>
                {dosya === d.yol && <Fark a={d.a} b={d.b} />}
              </div>
            ))}</div> : <p className="px-4 py-3 text-[12.5px] text-white/50">İki sürümde de ek dosya yok.</p>}
          </section>
        </div>
      </motion.aside>
    </div>,
    document.body,
  );
}

/* ───────────── Kullanım yeri ───────────── */
type AjanSatir = { id: string; ad: string; simge?: string; yayinda: boolean; kullaniyor: boolean };
/** Bu yeteneği kullanan ajanlar: aç ya da kapat. */
export function KullanimYerleri({ id }: { id: string }) {
  const [l, setL] = useState<AjanSatir[] | null>(null);
  useEffect(() => { api<{ ajanlar: AjanSatir[] }>(`/api/build/yetenekler/${id}/ajanlar`).then((v) => setL(v.ajanlar)).catch(() => setL([])); }, [id]);
  const degis = async (a: AjanSatir, v: boolean) => {
    setL((x) => x?.map((y) => (y.id === a.id ? { ...y, kullaniyor: v } : y)) ?? x);
    await api(`/api/build/yetenekler/${id}/ajanlar`, { govde: { ajanId: a.id, acik: v } }).catch(() => setL((x) => x?.map((y) => (y.id === a.id ? { ...y, kullaniyor: !v } : y)) ?? x));
  };
  return (
    <Kart ikon={Bot} baslik="Kullanan ajanlar" alt={l ? `${l.filter((a) => a.kullaniyor).length} ajan bu yeteneği kullanıyor` : "Yükleniyor"}>
      {l === null ? <div className="h-14 animate-pulse" /> : l.length ? (
        <div className="divide-y divide-white/[0.05]">
          {l.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.simge ? <img src={a.simge} alt="" className="h-8 w-8 rounded-[9px] object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><Bot className="h-4 w-4 text-white/60" /></span>}
              <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{a.ad}</span><span className="block text-[11.5px] text-white/45">{a.yayinda ? (a.kullaniyor ? "Yayında · yayındaki sürüm bir sonraki yayında güncellenir" : "Yayında") : "Taslak"}</span></span>
              <Anahtar acik={a.kullaniyor} set={(v) => degis(a, v)} etiket={`${a.ad} ajanında kullan`} />
            </div>
          ))}
        </div>
      ) : <p className="px-4 py-3 text-[13px] text-white/50 sm:px-5">Henüz ajanın yok; ajan kurunca bu yeteneği buradan açabilirsin.</p>}
    </Kart>
  );
}

/* ───────────── Dizin: kurulum ve değerlendirme ───────────── */
export type DizinIst = Record<string, { kurulum: number; puan: number; oy: number }>;
export function useDizinIstatistik(): DizinIst {
  const [v, setV] = useState<DizinIst>({});
  useEffect(() => { api<{ istatistik: DizinIst }>("/api/build/yetenekler/dizin/istatistik").then((x) => setV(x.istatistik)).catch(() => {}); }, []);
  return v;
}
/** Kart altı güven işareti: kurulum sayısı ve puan. */
export function DizinIsareti({ x }: { x?: { kurulum: number; puan: number; oy: number } }) {
  if (!x || (!x.kurulum && !x.oy)) return <span className="text-[11.5px] text-white/35">Henüz kurulmadı</span>;
  return <span className="inline-flex items-center gap-2 text-[11.5px] tabular-nums text-white/55">{x.kurulum > 0 && <span>{x.kurulum.toLocaleString("tr-TR")} kurulum</span>}{x.oy > 0 && <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-[#55d6fd] text-[#55d6fd]" />{x.puan.toLocaleString("tr-TR")} ({x.oy})</span>}</span>;
}
type Deg = { ortalama: number; oy: number; dagilim: number[]; yorumlar: { puan: number; yorum: string; zaman: number; benim: boolean }[]; benim: { puan: number; yorum?: string } | null };
/** Değerlendirmeler bölümü: ortalama, dağılım, kendi puanın ve yorumun, yorumlar. */
export function Degerlendirmeler({ hedef }: { hedef: string }) {
  const [v, setV] = useState<Deg | null>(null);
  const [puan, setPuan] = useState(0);
  const [yorum, setYorum] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [sira, setSira] = useState<"yeni" | "yuksek">("yeni");
  useEffect(() => { api<Deg>(`/api/build/yetenekler/dizin/degerlendirme?hedef=${encodeURIComponent(hedef)}`).then((x) => { setV(x); if (x.benim) { setPuan(x.benim.puan); setYorum(x.benim.yorum ?? ""); } }).catch(() => setV(null)); }, [hedef]);
  const gonder = async () => {
    setGidiyor(true); setHata("");
    try { setV(await api<Deg>("/api/build/yetenekler/dizin/degerlendirme", { govde: { hedef, puan, yorum } })); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); } finally { setGidiyor(false); }
  };
  const yorumlar = [...(v?.yorumlar ?? [])].sort((a, b) => (sira === "yeni" ? b.zaman - a.zaman : b.puan - a.puan));
  return (
    <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5"><p className="flex-1 text-[13px] font-semibold text-white">Değerlendirmeler</p>{v && v.oy > 0 && <span className="inline-flex items-center gap-1 text-[12.5px] tabular-nums text-white/70"><Star className="h-3.5 w-3.5 fill-[#55d6fd] text-[#55d6fd]" />{v.ortalama.toLocaleString("tr-TR")} · {v.oy} oy</span>}</div>
      {v && v.oy > 0 && (
        <div className="space-y-1 px-4 pt-3">{[5, 4, 3, 2, 1].map((p) => <div key={p} className="flex items-center gap-2 text-[11.5px] text-white/50"><span className="w-3 tabular-nums">{p}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><span className="block h-full rounded-full bg-[#1aa3d1]" style={{ width: `${(v.dagilim[p - 1] / v.oy) * 100}%` }} /></span><span className="w-5 text-right tabular-nums">{v.dagilim[p - 1]}</span></div>)}</div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Puanın">{[1, 2, 3, 4, 5].map((p) => <button key={p} type="button" role="radio" aria-checked={puan === p} aria-label={`${p} puan`} onClick={() => setPuan(p)} className="rounded-full p-1"><Star className={cn("h-5 w-5", p <= puan ? "fill-[#55d6fd] text-[#55d6fd]" : "text-white/30")} /></button>)}<span className="ml-2 text-[12px] text-white/45">{v?.benim ? "Değerlendirmeni güncelle" : "Kullandıysan puan ver"}</span></div>
        <textarea value={yorum} onChange={(e) => setYorum(e.target.value)} rows={2} maxLength={600} placeholder="Nasıl işe yaradı? (isteğe bağlı; adın gösterilmez)" className={cn(alanSinif, "resize-none py-2 text-[13px]")} />
        <div className="flex items-center gap-2"><span className="flex-1 text-[12px] text-rose-300">{hata}</span><button type="button" onClick={gonder} disabled={!puan || gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{v?.benim ? "Güncelle" : "Gönder"}</button></div>
      </div>
      {yorumlar.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="flex justify-end px-4 pt-2.5"><Secici id={`yorum-sira-${hedef}`} kucuk deger={sira} set={setSira} l={[{ id: "yeni", ad: "En yeni" }, { id: "yuksek", ad: "En yüksek" }]} /></div>
          <div className="divide-y divide-white/[0.05]">{yorumlar.map((x, i) => (
            <div key={i} className="px-4 py-2.5"><p className="flex items-center gap-2 text-[11.5px] text-white/45"><span className="inline-flex">{[1, 2, 3, 4, 5].map((p) => <Star key={p} className={cn("h-3 w-3", p <= x.puan ? "fill-[#55d6fd] text-[#55d6fd]" : "text-white/20")} />)}</span>{x.benim ? "Senin yorumun" : "Vayra kullanıcısı"} · {gorece(x.zaman)}</p><p className="mt-1 text-[13px] leading-relaxed text-white/75">{x.yorum}</p></div>
          ))}</div>
        </div>
      )}
    </section>
  );
}

/* ───────────── Kaynak güncellemesi ───────────── */
/** İçe aktarılan yeteneğin kaynağında yeni içerik var mı; varsa yeni sürüm olarak alır. */
export function KaynakGuncelleme({ id, guncellendi }: { id: string; guncellendi: (y: YetenekV2) => void }) {
  const [v, setV] = useState<{ destek: boolean; var?: boolean } | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  useEffect(() => { api<{ destek: boolean; var?: boolean }>(`/api/build/yetenekler/${id}/guncelleme`).then(setV).catch(() => setV(null)); }, [id]);
  if (!v?.destek) return null;
  const al = async () => {
    setGidiyor(true); setHata("");
    try { const r = await api<{ yetenek: YetenekV2 }>(`/api/build/yetenekler/${id}/guncelleme`, { govde: {} }); guncellendi(r.yetenek); setV({ destek: true, var: false }); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Güncellenemedi."); } finally { setGidiyor(false); }
  };
  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-[16px] px-3.5 py-2.5 text-[12.5px] ring-1 ring-inset", v.var ? "bg-[#55d6fd]/[0.05] text-[#bdefff] ring-[#55d6fd]/15" : "bg-white/[0.03] text-white/55 ring-white/[0.07]")}>
      <span className="min-w-[200px] flex-1">{v.var ? "Kaynakta bu yeteneğin yeni bir hâli var. Alırsan yeni bir sürüm olarak eklenir; sabitlediğin sürüm değişmez." : "Kaynakla güncel."}{hata && <span className="block text-rose-300">{hata}</span>}</span>
      {v.var && <button type="button" onClick={al} disabled={gidiyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-black disabled:opacity-50">{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Güncellemeyi al</button>}
    </div>
  );
}
