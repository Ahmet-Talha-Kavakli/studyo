"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ExternalLink, FileText, Loader2, X } from "lucide-react";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { Md } from "@/components/build/sohbet/SohbetEkrani";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { ANTHROPIC_YETENEKLERI, DIZIN_TUR, dizinUrl, iceAktarilabilir, LISANS_AD, type DizinYetenegi } from "@/lib/build/yetenekDizin";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { Degerlendirmeler, DizinIsareti, useDizinIstatistik } from "./YetenekGelismis";
import { cn } from "@/lib/utils";

/** Anthropic logolu karo (resmî işaret, public/marka/baglanti/anthropic.svg). */
function AnthropicKaro({ boyut = 44 }: { boyut?: number }) {
  return <span className="flex shrink-0 items-center justify-center rounded-[12px] bg-[#f0eee6] ring-1 ring-inset ring-black/5" style={{ width: boyut, height: boyut }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/baglanti/anthropic.svg" alt="Anthropic" style={{ width: boyut * 0.5, height: boyut * 0.5 }} /></span>;
}
const LisansRozet = ({ y }: { y: DizinYetenegi }) => <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", y.lisans === "apache" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.07] text-white/55")}>{LISANS_AD[y.lisans]}</span>;

/** Ayrıntı: lisans izin veriyorsa SKILL.md GitHub'dan canlı okunur; tescilli olanlar yalnız bağlantıyla. */
function DizinPaneli({ y, kapat, ice, gidiyor, ekli }: { y: DizinYetenegi; kapat: () => void; ice: () => void; gidiyor: boolean; ekli?: string }) {
  const [hazir, setHazir] = useState(false);
  const [v, setV] = useState<{ skillMd: string; dosyalar: { yol: string; boyut: number }[]; commit: string } | null>(null);
  const [hata, setHata] = useState("");
  const { en, stil, min, max, varsayilan, anahtar } = useKenarStili("yetenek-panel", 640, 460, 900);
  const izin = iceAktarilabilir(y);
  useEffect(() => setHazir(true), []);
  useEffect(() => { if (izin) api<{ skillMd: string; dosyalar: { yol: string; boyut: number }[]; commit: string }>(`/api/build/yetenekler/dizin/${y.ad}`).then(setV).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Okunamadı.")); }, [y.ad, izin]);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [kapat]);
  if (!hazir) return null;
  const govde = v?.skillMd.replace(/^---[\s\S]*?---\s*/, "") ?? "";
  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-black/45" />
      <motion.aside role="dialog" aria-modal="true" aria-label={y.baslik} style={stil} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }} className="bd-panel absolute inset-y-0 right-0 flex w-full flex-col sm:w-[var(--yan-en)] sm:rounded-l-[22px]">
        <KenarTutamac en={en} anahtar={anahtar} varsayilan={varsayilan} min={min} max={max} className="max-sm:hidden" />
        <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5">
          <AnthropicKaro boyut={40} />
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold text-white">{y.baslik}</p><p className="truncate text-[12.5px] text-white/50">Anthropic · {y.ad} · {DIZIN_TUR[y.tur]}</p></div>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">
          <p className="text-[14px] leading-relaxed text-white/75">{y.aciklama}</p>
          <div className="flex flex-wrap gap-1.5"><LisansRozet y={y} /><span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-white/55">Resmî örnek yetenek</span></div>
          <Degerlendirmeler hedef={`anthropic:${y.ad}`} />
          {!izin && <p className="rounded-[14px] bg-white/[0.04] px-3.5 py-3 text-[13px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]">{y.lisans === "tescilli" ? "Bu yeteneğin kaynağı açık ama lisansı tescilli; kopyalanıp dağıtılamaz. Kaynağında okuyabilir, kendi yeteneğini ondan esinlenerek yazabilirsin." : "Bu yeteneğin klasöründe lisans dosyası yok; izin belirsiz olduğu için içe aktarılmaz. Kaynağında açabilirsin."}</p>}
          {izin && (hata ? <p className="text-[13px] text-rose-300">{hata}</p> : !v ? <div className="h-40 animate-pulse rounded-[18px] bg-white/[0.03]" /> : <>
            <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
              <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Dosyalar ({v.dosyalar.length})</p>
              <div className="max-h-48 divide-y divide-white/[0.04] overflow-y-auto">{v.dosyalar.map((d) => <p key={d.yol} className="flex items-center gap-2 px-4 py-2 text-[12.5px] text-white/70"><FileText className="h-3.5 w-3.5 shrink-0 text-white/40" /><span className="min-w-0 flex-1 truncate">{d.yol}</span><span className="shrink-0 text-white/35">{d.boyut < 1000 ? `${d.boyut} B` : `${Math.round(d.boyut / 1000)} KB`}</span></p>)}</div>
            </section>
            <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
              <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">SKILL.md</p>
              <div className="px-4 py-3"><Md metin={govde.slice(0, 30_000)} onizle={() => {}} /></div>
            </section>
          </>)}
        </div>
        <footer className="flex items-center gap-2 border-t border-white/[0.07] px-4 py-3 sm:px-5">
          <a href={dizinUrl(y.ad)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/60 hover:text-white"><ExternalLink className="h-4 w-4" />Kaynağı aç</a>
          <span className="flex-1" />
          {ekli ? <Link href={`/panel/build/yetenekler/${ekli}`} className="inline-flex h-11 items-center rounded-full bg-white/[0.08] px-5 text-[14px] font-semibold text-white">Eklendi, aç</Link>
            : izin && <button type="button" onClick={ice} disabled={gidiyor} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black disabled:opacity-60">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}İçe aktar</button>}
        </footer>
      </motion.aside>
    </div>,
    document.body,
  );
}

/** Anthropic resmî yetenekleri: lisansa göre içe aktar ya da kaynağa git. */
export function AnthropicDizini({ benim, yenile, arama }: { benim: { id: string; kaynak?: { tur: string; ad?: string } }[]; yenile: () => void; arama: string }) {
  const router = useRouter();
  const [tur, setTur] = useState<"hepsi" | DizinYetenegi["tur"]>("hepsi");
  const [acik, setAcik] = useState<DizinYetenegi | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const ist = useDizinIstatistik();
  const s = arama.trim().toLocaleLowerCase("tr");
  const l = useMemo(() => ANTHROPIC_YETENEKLERI.filter((y) => (tur === "hepsi" || y.tur === tur) && (!s || `${y.ad} ${y.baslik} ${y.aciklama}`.toLocaleLowerCase("tr").includes(s))), [tur, s]);
  const ekli = (ad: string) => benim.find((y) => y.kaynak?.tur === "anthropic" && y.kaynak.ad === ad)?.id;
  const ice = async (y: DizinYetenegi, ac?: boolean) => {
    if (gidiyor) return;
    setGidiyor(y.ad); setHata("");
    try { const v = await api<{ id: string; atlanan?: number }>("/api/build/yetenekler", { govde: { dizin: y.ad } }); yenile(); if (ac) router.push(`/panel/build/yetenekler/${v.id}${v.atlanan ? `?atlanan=${v.atlanan}` : ""}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İçe aktarılamadı."); }
    finally { setGidiyor(null); }
  };
  const turler = (Object.keys(DIZIN_TUR) as DizinYetenegi["tur"][]).map((t) => ({ id: t, ad: DIZIN_TUR[t], sayi: ANTHROPIC_YETENEKLERI.filter((x) => x.tur === t).length }));
  return (
    <>
      <div className="mb-4"><Suzgec id="dizin-tur" deger={tur} set={setTur} l={[{ id: "hepsi" as const, ad: "Hepsi", sayi: ANTHROPIC_YETENEKLERI.length }, ...turler]} /></div>
      {hata && <p className="mb-3 text-[13px] text-rose-300">{hata}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {l.map((y) => { const e = ekli(y.ad); const izin = iceAktarilabilir(y); return (
          <div key={y.ad} className="group relative flex flex-col rounded-[20px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
            <button type="button" onClick={() => setAcik(y)} className="absolute inset-0 rounded-[20px]" aria-label={`${y.baslik} ayrıntıları`} />
            <div className="flex items-start gap-3">
              <AnthropicKaro />
              <div className="min-w-0 flex-1"><p className="truncate text-[14.5px] font-semibold text-white">{y.baslik}</p><p className="truncate text-[12px] text-white/45">{y.ad} · {DIZIN_TUR[y.tur]}</p></div>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-[1.45] text-white/55">{y.aciklama}</p>
            <div className="relative z-[1] mt-3 flex items-center gap-2">
              <span className="flex min-w-0 flex-1 flex-col gap-1"><LisansRozet y={y} /><DizinIsareti x={ist[`anthropic:${y.ad}`]} /></span>
              {e ? <Link href={`/panel/build/yetenekler/${e}`} className="inline-flex h-9 items-center rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white">Eklendi</Link>
                : izin ? <button type="button" onClick={() => ice(y)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">{gidiyor === y.ad ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}İçe aktar</button>
                : <a href={dizinUrl(y.ad)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white"><ExternalLink className="h-3.5 w-3.5" />Kaynağı aç</a>}
            </div>
          </div>
        ); })}
      </div>
      {!l.length && <p className="py-6 text-center text-[13px] text-white/50">Aramana uyan yetenek yok.</p>}
      <AnimatePresence>{acik && <DizinPaneli key={acik.ad} y={acik} kapat={() => setAcik(null)} ice={() => ice(acik, true)} gidiyor={gidiyor === acik.ad} ekli={ekli(acik.ad)} />}</AnimatePresence>
    </>
  );
}
