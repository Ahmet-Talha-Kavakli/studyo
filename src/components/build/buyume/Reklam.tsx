"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, Plus, RefreshCcw, Shuffle, Trash2, Wand2, X } from "lucide-react";
import { Secici } from "./ortak";
import { gorece, yayinAdresi } from "@/lib/build/istemci";
import { kimlik, META_CTA, NIYETLER, reklamCsv, say, SINIR, type NiyetId, type ReklamSeti } from "@/lib/build/buyumeTipler";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Cip, HataSatiri, ikincil, indir, Kart, KanalLogo, ModelYokKart, Rozet, Sayac, SecenekMenusu, simgeDugme, Suruyor } from "./ortak";
import { ModelYokHatasi, type BuyumeKanca } from "./useBuyume";
import type { Git } from "./BuyumeSekme";

const bos = (): ReklamSeti => ({ google: { basliklar: [], aciklamalar: [], yol1: "", yol2: "" }, meta: { birincil: "", baslik: "", aciklama: "", cta: META_CTA[0] }, anahtarKelimeler: [], negatifler: [], olusturma: Date.now() });
const doldur = (l: string[], n: number) => [...l, ...Array(Math.max(0, n - l.length)).fill("")].slice(0, n);

function SiniriAlan({ deger, set, sinir, yer, uzun, satir = 2 }: { deger: string; set: (s: string) => void; sinir: number; yer: string; uzun?: boolean; satir?: number }) {
  const n = say(deger), asti = n > sinir;
  return (
    <span className={cn("flex items-start gap-2 rounded-[12px] bg-white/[0.05] pr-3 ring-1 ring-inset transition-shadow focus-within:ring-white/30", asti ? "ring-rose-400/70 focus-within:ring-rose-300" : "ring-white/[0.08]")}>
      {uzun ? <textarea value={deger} onChange={(e) => set(e.target.value)} rows={satir} maxLength={sinir * 8} placeholder={yer} className="min-w-0 flex-1 resize-none bg-transparent py-2.5 pl-3.5 text-[13.5px] leading-snug text-white outline-none placeholder:text-white/30" />
        : <input value={deger} onChange={(e) => set(e.target.value)} maxLength={sinir * 2} placeholder={yer} className="h-10 min-w-0 flex-1 bg-transparent pl-3.5 text-[13.5px] text-white outline-none placeholder:text-white/30" />}
      <Sayac n={n} sinir={sinir} className={uzun ? "pt-3" : "self-center"} />
    </span>
  );
}

export function ReklamBolumu({ p, b }: { p: Proje; b: BuyumeKanca; git?: Git }) {
  const v = b.veri!;
  const [r, setR] = useState<ReklamSeti | null>(v.reklam);
  const [hata, setHata] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [kayit, setKayit] = useState<"" | "bekliyor" | "kaydedildi">("");
  const [karisim, setKarisim] = useState(0);
  const [yeniNegatif, setYeniNegatif] = useState("");
  const kaynak = useRef(v.reklam?.olusturma);
  const ilk = useRef(true);
  /* Sunucudan yalnız yeni üretimde yenile (yazarken kaydetme yanıtı imleci bozmasın). */
  useEffect(() => { if (v.reklam?.olusturma !== kaynak.current) { kaynak.current = v.reklam?.olusturma; ilk.current = true; setR(v.reklam); } }, [v.reklam]);
  useEffect(() => {
    if (ilk.current) { ilk.current = false; return; }
    if (!r) return;
    setKayit("bekliyor");
    const t = setTimeout(async () => { const ok = await b.degistir(null, { reklam: r }); setKayit(ok ? "kaydedildi" : ""); }, 700);
    return () => clearTimeout(t);
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps

  const suruyor = b.suruyor("reklam");
  const yaz = async () => { setHata(""); setModelYok(false); try { await b.uret("reklam"); } catch (e) { if (e instanceof ModelYokHatasi) setModelYok(true); else setHata(e instanceof Error ? e.message : "Reklam metinleri yazılamadı."); } };
  const alanAdi = p.alanAdlari.find((a) => a.birincil && a.durum === "bagli")?.ad ?? p.alanAdlari.find((a) => a.durum === "bagli")?.ad;
  const sonUrl = alanAdi ? `https://${alanAdi}/` : yayinAdresi(p.ayarlar.altAlan).tam;
  const gorunenAlan = alanAdi ?? yayinAdresi(p.ayarlar.altAlan).gorunen.split("/")[0];

  const ust = (
    <>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {modelYok && <ModelYokKart tekrar={() => { setModelYok(false); b.yukle(); }} />}
      {suruyor && <Suruyor metin={r ? "Reklam metinleri yeniden yazılıyor" : "Reklam metinleri yazılıyor"} alt="15 başlık, 4 açıklama, Meta metni ve anahtar kelimeler; karakter sınırlarına göre." />}
    </>
  );

  if (!r) {
    return (
      <div className="space-y-4">
        {ust}
        {!suruyor && (
          <Kart>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex shrink-0 -space-x-2"><KanalLogo kanal="google-ads" boyut={46} className="rounded-[14px] bg-[#1a1b1f] ring-2 ring-[#131416]" /><KanalLogo kanal="meta" boyut={46} className="rounded-[14px] bg-[#1a1b1f] ring-2 ring-[#131416]" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-white">Google Ads ve Meta reklam metinleri</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">Ajan siteni ve planını okuyup Google için 15 başlık ve 4 açıklama, Meta için birincil metin, başlık ve düğme, bir de anahtar kelime listesi yazar. Hepsi karakter sınırlı, düzenlenebilir ve CSV olarak iner.</p>
              </div>
              <div className="flex shrink-0 gap-2"><button type="button" onClick={() => setR(bos())} className={ikincil}>Elle başla</button><button type="button" onClick={yaz} className={birincil}><Wand2 className="h-4 w-4" />Metinleri yaz</button></div>
            </div>
          </Kart>
        )}
      </div>
    );
  }

  const g = r.google, m = r.meta;
  const basliklar = doldur(g.basliklar, SINIR.gBaslikSayi), aciklamalar = doldur(g.aciklamalar, SINIR.gAciklamaSayi);
  const asanB = g.basliklar.filter((x) => say(x) > SINIR.gBaslik).length, asanA = g.aciklamalar.filter((x) => say(x) > SINIR.gAciklama).length;
  const doluB = g.basliklar.filter((x) => x.trim()), doluA = g.aciklamalar.filter((x) => x.trim());
  const sec = (l: string[], n: number) => (l.length ? Array.from({ length: Math.min(n, l.length) }, (_, i) => l[(i + karisim * n) % l.length]) : []);
  const gB = sec(doluB, 3), gA = sec(doluA, 2);
  const gonderiGorseli = v.gonderiler.find((x) => x.gorsel && (x.kanal === "instagram" || x.kanal === "linkedin"))?.gorsel ?? v.gonderiler.find((x) => x.gorsel)?.gorsel ?? p.kapak;
  const setG = (y: Partial<ReklamSeti["google"]>) => setR({ ...r, google: { ...g, ...y } });
  const setM = (y: Partial<ReklamSeti["meta"]>) => setR({ ...r, meta: { ...m, ...y } });
  const metaKisa = say(m.birincil) > SINIR.mBirincil;

  return (
    <div className="space-y-4">
      {ust}
      <Kart baslik="Reklam metinleri" aciklama={<>{r.model ? `${r.model} ile ${gorece(r.olusturma)} yazıldı. ` : ""}Değişiklikler kendiliğinden kaydedilir.{kayit === "bekliyor" ? <Loader2 className="ml-1.5 inline h-3 w-3 animate-spin" /> : kayit === "kaydedildi" ? <span className="ml-1.5 text-white/40">Kaydedildi</span> : null}</>}
        sag={<>
          <button type="button" onClick={() => indir(`${p.ayarlar.altAlan}-reklam-metinleri.csv`, reklamCsv(r, sonUrl), "text/csv;charset=utf-8")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Download className="h-3.5 w-3.5" />CSV indir</button>
          <button type="button" disabled={suruyor} onClick={yaz} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><RefreshCcw className="h-3.5 w-3.5" />Yeniden yaz</button>
        </>} />

      {/* Google Ads */}
      <Kart baslik={<span className="flex flex-wrap items-center gap-2"><KanalLogo kanal="google-ads" boyut={24} className="rounded-[7px]" />Google Ads<span className="text-[12.5px] font-normal text-white/45">duyarlı arama reklamı</span></span>}
        sag={<>{asanB + asanA > 0 && <Rozet ton="rose">{[asanB && `${asanB} başlık`, asanA && `${asanA} açıklama`].filter(Boolean).join(", ")} sınırı aşıyor</Rozet>}<Rozet>{doluB.length} / 15 başlık</Rozet></>}>
        {/* Önizleme */}
        <div className="rounded-[16px] bg-white p-4 text-[#202124]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-semibold">Sponsorlu</p>
            <button type="button" onClick={() => setKarisim((n) => n + 1)} disabled={doluB.length < 4} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] text-[#5f6368] hover:bg-black/[0.05] disabled:opacity-40"><Shuffle className="h-3 w-3" />Başka birleşim</button>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#f1f3f4] ring-1 ring-black/10">{p.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.kapak} alt="" className="h-full w-full object-cover" />}</span>
            <span className="min-w-0 leading-tight"><span className="block truncate text-[13px]">{p.ad}</span><span className="block truncate text-[12px] text-[#4d5156]">{gorunenAlan}{g.yol1 && ` › ${g.yol1}`}{g.yol2 && ` › ${g.yol2}`}</span></span>
          </div>
          <motion.p key={karisim} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-[18px] leading-snug text-[#1a0dab]">{gB.length ? gB.join(" | ") : "Başlık yaz"}</motion.p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#4d5156]">{gA.join(" ") || "Açıklama yaz"}</p>
        </div>
        <p className="mb-2 mt-4 text-[12.5px] text-white/60">Başlıklar <span className="text-white/35">en çok {SINIR.gBaslik} karakter; Google en uygun üçünü birleştirir</span></p>
        <div className="grid gap-2 sm:grid-cols-2">
          {basliklar.map((x, i) => <SiniriAlan key={i} deger={x} sinir={SINIR.gBaslik} yer={`Başlık ${i + 1}`} set={(s) => { const l = [...basliklar]; l[i] = s; setG({ basliklar: l }); }} />)}
        </div>
        <p className="mb-2 mt-4 text-[12.5px] text-white/60">Açıklamalar <span className="text-white/35">en çok {SINIR.gAciklama} karakter</span></p>
        <div className="grid grid-cols-1 gap-2">
          {aciklamalar.map((x, i) => <SiniriAlan key={i} uzun deger={x} sinir={SINIR.gAciklama} yer={`Açıklama ${i + 1}`} set={(s) => { const l = [...aciklamalar]; l[i] = s; setG({ aciklamalar: l }); }} />)}
        </div>
        <p className="mb-2 mt-4 text-[12.5px] text-white/60">Görünen yol <span className="text-white/35">adres çubuğunda görünür, en çok {SINIR.gYol} karakter</span></p>
        <div className="grid gap-2 sm:grid-cols-2">
          <SiniriAlan deger={g.yol1} sinir={SINIR.gYol} yer="rezervasyon" set={(s) => setG({ yol1: s.replace(/\s+/g, "-") })} />
          <SiniriAlan deger={g.yol2} sinir={SINIR.gYol} yer="kadikoy" set={(s) => setG({ yol2: s.replace(/\s+/g, "-") })} />
        </div>
        <p className="mt-2 truncate text-[12px] text-white/40">Son URL: {sonUrl}</p>
      </Kart>

      {/* Meta */}
      <Kart baslik={<span className="flex flex-wrap items-center gap-2"><KanalLogo kanal="meta" boyut={24} className="rounded-[7px]" />Meta reklamı<span className="text-[12.5px] font-normal text-white/45">Instagram ve Facebook akışı</span></span>}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[14px] bg-[#0f1012] ring-1 ring-white/10">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/10">{p.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.kapak} alt="" className="h-full w-full object-cover" />}</span>
              <span className="min-w-0 leading-tight"><span className="block truncate text-[12.5px] font-semibold text-white">{p.ad}</span><span className="block text-[11px] text-white/45">Sponsorlu</span></span>
            </div>
            <p className="px-3 pb-2.5 text-[12px] leading-relaxed text-white/90">{metaKisa ? [...m.birincil].slice(0, SINIR.mBirincil).join("") : m.birincil || "Birincil metin"}{metaKisa && <span className="text-white/45"> ... devamı</span>}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {gonderiGorseli ? <img src={gonderiGorseli} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square bg-gradient-to-br from-white/[0.06] to-[#55d6fd]/[0.06]" />}
            <div className="flex items-center gap-2 bg-white/[0.06] px-3 py-2.5">
              <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[10.5px] text-white/45">{gorunenAlan}</span><span className="block truncate text-[12.5px] font-semibold text-white">{m.baslik || "Başlık"}</span><span className="block truncate text-[11.5px] text-white/55">{m.aciklama}</span></span>
              <span className="shrink-0 rounded-[8px] bg-white/[0.12] px-2.5 py-1.5 text-[11.5px] font-semibold text-white">{m.cta}</span>
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <div><p className="mb-1.5 text-[12.5px] text-white/60">Birincil metin <span className="text-white/35">ilk {SINIR.mBirincil} karakter görünür, gerisi devamında</span></p><SiniriAlan uzun satir={4} deger={m.birincil} sinir={SINIR.mBirincil} yer="Reklamın ana mesajı" set={(s) => setM({ birincil: s })} /></div>
            <div><p className="mb-1.5 text-[12.5px] text-white/60">Başlık</p><SiniriAlan deger={m.baslik} sinir={SINIR.mBaslik} yer="Hafta sonu masan hazır" set={(s) => setM({ baslik: s })} /></div>
            <div><p className="mb-1.5 text-[12.5px] text-white/60">Açıklama</p><SiniriAlan deger={m.aciklama} sinir={SINIR.mAciklama} yer="Kısa ek bilgi" set={(s) => setM({ aciklama: s })} /></div>
            <div>
              <p className="mb-1.5 text-[12.5px] text-white/60">Harekete geçirici düğme</p>
              <SecenekMenusu genislik={280} deger={META_CTA.includes(m.cta) ? m.cta : "ozel"} sec={(c) => setM({ cta: c === "ozel" ? (META_CTA.includes(m.cta) ? "" : m.cta) : c })} l={META_CTA.map((c) => ({ id: c, ad: c }))}
                ozel={{ deger: META_CTA.includes(m.cta) ? "" : m.cta, set: (s) => setM({ cta: s.slice(0, 30) }), yer: "Düğme yazısı", alt: "Meta reklam yöneticisinde kendi metnin" }}
                tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-10 w-full justify-between pl-3.5"><span className="truncate text-[13.5px]">{m.cta || "Düğme seç"}</span></Cip>} />
            </div>
          </div>
        </div>
      </Kart>

      {/* Anahtar kelimeler */}
      <Kart baslik={<span className="flex items-center gap-2">Anahtar kelimeler<Rozet>{r.anahtarKelimeler.length}</Rozet></span>} aciklama="Google Ads'de hangi aramalarda görüneceğin. Sıralı eşleme çoğu işletme için iyi bir başlangıç."
        sag={<button type="button" onClick={() => setR({ ...r, anahtarKelimeler: [...r.anahtarKelimeler, { id: kimlik(), kelime: "", eslesme: "sirali", niyet: "satin-alma" }] })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Kelime ekle</button>}>
        {r.anahtarKelimeler.length ? (
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {r.anahtarKelimeler.map((k, i) => {
              const niyet = NIYETLER.find((n) => n.id === k.niyet);
              const sonraki = NIYETLER[(NIYETLER.findIndex((n) => n.id === k.niyet) + 1) % NIYETLER.length].id as NiyetId;
              const d = (y: Partial<typeof k>) => setR({ ...r, anahtarKelimeler: r.anahtarKelimeler.map((x, j) => (j === i ? { ...x, ...y } : x)) });
              return (
                <li key={k.id} className="flex flex-wrap items-center gap-2 px-2.5 py-2">
                  <input value={k.kelime} onChange={(e) => d({ kelime: e.target.value.slice(0, 80) })} placeholder="arama sorgusu" className={cn(alan, "h-9 min-w-[160px] flex-1 basis-[200px] bg-transparent ring-transparent focus:bg-white/[0.05] focus:ring-white/20")} />
                  <Secici id={`esleme-${k.id}`} kucuk deger={k.eslesme} set={(e) => d({ eslesme: e })} l={[{ id: "genis" as const, ad: "Geniş" }, { id: "sirali" as const, ad: "Sıralı" }, { id: "tam" as const, ad: "Tam" }]} />
                  <button type="button" title={`${niyet?.alt}. Değiştirmek için tıkla`} onClick={() => d({ niyet: sonraki })}><Rozet ton={k.niyet === "satin-alma" || k.niyet === "yerel" ? "aksan" : "notr"} className="w-[112px] justify-center hover:brightness-125">{niyet?.ad}</Rozet></button>
                  <button type="button" onClick={() => setR({ ...r, anahtarKelimeler: r.anahtarKelimeler.filter((_, j) => j !== i) })} className={cn(simgeDugme, "hover:text-rose-200")} aria-label="Kelimeyi sil"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-[12.5px] text-white/50">Henüz anahtar kelime yok.</p>}
        <p className="mb-2 mt-4 text-[12.5px] text-white/60">Negatif anahtar kelimeler <span className="text-white/35">bu aramalarda reklam görünmez</span></p>
        <div className="flex flex-wrap items-center gap-1.5">
          <AnimatePresence initial={false}>
            {r.negatifler.map((n) => (
              <motion.span key={n} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.05] pl-3 pr-1 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/[0.08]">
                {n}<button type="button" onClick={() => setR({ ...r, negatifler: r.negatifler.filter((x) => x !== n) })} aria-label={`${n} kaldır`} className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"><X className="h-3 w-3" /></button>
              </motion.span>
            ))}
          </AnimatePresence>
          <form onSubmit={(e) => { e.preventDefault(); const y = yeniNegatif.trim().toLocaleLowerCase("tr-TR"); if (y && !r.negatifler.includes(y)) setR({ ...r, negatifler: [...r.negatifler, y].slice(0, 30) }); setYeniNegatif(""); }}>
            <input value={yeniNegatif} onChange={(e) => setYeniNegatif(e.target.value)} maxLength={60} placeholder="Ekle ve Enter" className={cn(alan, "h-8 w-[150px] rounded-full px-3 text-[12.5px]")} />
          </form>
        </div>
      </Kart>
    </div>
  );
}
