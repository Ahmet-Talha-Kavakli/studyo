"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, Import, Loader2, MessageSquare, MessageSquareText, Pause, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { IceAktarPaneli } from "./IceAktar";
import { TalimatGecmisi, TercihKarti } from "./Tercihler";
import { sayi, Anahtar, alanSinif } from "./ortak";

type Kayit = { id: string; metin: string; zaman: number; kaynak?: { sohbet: string; baslik: string }; aktarim?: string };
type Tercih = { uzunluk: string; uzunlukOzel: string; emoji: string; dil: string; dilOzel: string; hitap: string; ad: string; hitapOzel: string; bicim: string };
type Surum = { id: string; zaman: number; hakkimda: string; tarz: string; ozelTarz: string; tercih: Tercih; ozet: string };
type Bellek = { acik: boolean; kayitlar: Kayit[]; hakkimda: string; tarz: string; ozelTarz: string; tercih: Tercih; surumler: Surum[] };
const TARZLAR = [
  { id: "varsayilan", ad: "Varsayılan", alt: "Soruya göre kısa ya da ayrıntılı" },
  { id: "kisa", ad: "Kısa", alt: "Önce sonuç, az açıklama" },
  { id: "aciklayici", ad: "Açıklayıcı", alt: "Adım adım, nedenleriyle" },
  { id: "resmi", ad: "Resmî", alt: "Profesyonel, siz diye hitap" },
  { id: "samimi", ad: "Samimi", alt: "Sıcak, günlük dil" },
  { id: "ozel", ad: "Özel", alt: "Tarzı kendin yaz" },
];

/** Bellek ve kişiselleştirme: Hakkımda, Yanıt tarzı, sohbetlerden öğrenilen kayıtlar (düzenle, sil, duraklat). */
export function BellekSayfasi() {
  const [b, setB] = useState<Bellek | null>(null);
  const [hakkimda, setHakkimda] = useState("");
  const [ozelTarz, setOzelTarz] = useState("");
  const [kaydedildi, setKaydedildi] = useState("");
  const [yeni, setYeni] = useState("");
  const [duzen, setDuzen] = useState<{ id: string; metin: string } | null>(null);
  const [temizleOnay, setTemizleOnay] = useState(false);
  const [gidiyor, setGidiyor] = useState("");
  const [getirAcik, setGetirAcik] = useState(false);
  const yukle = () => api<{ bellek: Bellek }>("/api/build/sohbet/bellek").then((v) => { setB(v.bellek); setHakkimda(v.bellek.hakkimda); setOzelTarz(v.bellek.ozelTarz); }).catch(() => {});
  useEffect(() => { yukle(); }, []);
  const yama = async (g: Record<string, unknown>, etiket?: string) => {
    if (etiket) setGidiyor(etiket);
    try { const v = await api<{ bellek: Bellek }>("/api/build/sohbet/bellek", { method: "PATCH", govde: g }); setB(v.bellek); if (etiket) { setKaydedildi(etiket); setTimeout(() => setKaydedildi(""), 1500); } }
    finally { setGidiyor(""); }
  };
  if (!b) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  const Kaydet = ({ ad, degisti, onClick }: { ad: string; degisti: boolean; onClick: () => void }) => degisti
    ? <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">{gidiyor === ad && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button>
    : kaydedildi === ad ? <span className="flex items-center gap-1 text-[12.5px] text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Kaydedildi</span> : null;
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <section className="flex flex-wrap items-center gap-3 rounded-[26px] bg-[#121315] p-4 ring-1 ring-inset ring-white/[0.07] sm:p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Brain className="h-5 w-5" /></span>
        <span className="min-w-[220px] flex-1"><h1 className="text-[17px] font-semibold sm:text-[19px] tracking-[-0.02em] text-white">Bellek ve kişiselleştirme</h1><p className="text-[13px] text-white/55">Vayra'nın seni nasıl tanıdığı ve nasıl yanıt verdiği. Geçici sohbetler ve ajanlar bunları kullanmaz.</p></span>
        <dl className="flex w-full gap-5 pl-14 text-[12.5px] sm:w-auto sm:pl-0">
          <div><dt className="text-white/45">Kayıt</dt><dd className="text-[16px] font-semibold tabular-nums text-white">{sayi(b.kayitlar.length)}</dd></div>
          <div><dt className="text-white/45">Bellek</dt><dd className={cn("text-[16px] font-semibold", b.acik ? "text-[#8be6ff]" : "text-amber-200")}>{b.acik ? "Açık" : "Duraklatıldı"}</dd></div>
        </dl>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Kart ikon={UserRound} baslik="Hakkımda" alt="Vayra her sohbette bunu bilir" govde="p-4" sag={<Kaydet ad="hakkimda" degisti={hakkimda !== b.hakkimda} onClick={() => yama({ hakkimda }, "hakkimda")} />}>
          <textarea value={hakkimda} onChange={(e) => setHakkimda(e.target.value)} rows={8} maxLength={4000} placeholder="Adın, mesleğin, ilgi alanların, Vayra'yı ne için kullandığın. Ne kadar bilirse o kadar isabetli yanıt verir."
            className={cn(alanSinif, "resize-y py-3 text-[13.5px] leading-relaxed")} />
          <p className="mt-1.5 text-right text-[11.5px] text-white/35">{sayi(hakkimda.length)} / 4.000</p>
        </Kart>
        <Kart ikon={MessageSquareText} baslik="Yanıt tarzı" alt="Bütün genel sohbetlerde" govde="p-4" sag={b.tarz === "ozel" ? <Kaydet ad="tarz" degisti={ozelTarz !== b.ozelTarz} onClick={() => yama({ ozelTarz }, "tarz")} /> : kaydedildi === "tarz" ? <span className="flex items-center gap-1 text-[12.5px] text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Kaydedildi</span> : undefined}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TARZLAR.map((t) => (
              <button key={t.id} type="button" onClick={() => yama({ tarz: t.id }, t.id === "ozel" ? undefined : "tarz")}
                className={cn("relative rounded-[16px] bg-white/[0.035] p-3 text-left transition-colors hover:bg-white/[0.07]", b.tarz === t.id && "bg-white/[0.07] ring-2 ring-inset ring-white")}>
                <span className="block text-[13.5px] font-semibold text-white">{t.ad}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-white/50">{t.alt}</span>
              </button>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {b.tarz === "ozel" && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <textarea value={ozelTarz} onChange={(e) => setOzelTarz(e.target.value)} rows={4} maxLength={2000} placeholder="Nasıl yanıt versin? Uzunluk, ton, biçim, kaçınacakları…" className={cn(alanSinif, "mt-3 resize-y py-3 text-[13.5px] leading-relaxed")} />
              </motion.div>
            )}
          </AnimatePresence>
        </Kart>
      </div>
      <TercihKarti tercih={b.tercih} kaydet={(t) => yama({ tercih: t }, "tercih")} kaydedildi={kaydedildi === "tercih"} />
      <TalimatGecmisi surumler={b.surumler} simdiki={b} geriYukle={(id) => yama({ geriYukle: id }, "tercih").then(() => yukle())} sil={(id) => yama({ surumSil: id })} />
      <Kart ikon={Brain} baslik="Vayra'nın hatırladıkları" alt={b.acik ? "Sohbetlerde öğrendiklerini buraya yazar; yanıtlarda hangisini kullandığını gösterir" : "Duraklatıldı: kayıtlar sohbetlere girmez, yenisi yazılmaz"} govde=""
        sag={<>
          <button type="button" onClick={() => setGetirAcik(true)} title="ChatGPT, Claude ya da Gemini'deki hafızanı getir" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.12] max-sm:w-8 max-sm:justify-center max-sm:px-0"><Import className="h-3.5 w-3.5" /><span className="max-sm:hidden">Hafızanı getir</span></button>
          <label className="flex items-center gap-2 text-[12.5px] text-white/70"><span className="max-sm:hidden">{b.acik ? "Açık" : "Duraklatıldı"}</span><Anahtar acik={b.acik} set={(v) => yama({ acik: v })} etiket="Bellek" /></label>
        </>}>
        {!b.acik && <p className="flex items-center gap-2 border-b border-white/[0.06] bg-amber-400/[0.06] px-4 py-2.5 text-[12.5px] text-amber-100/80 sm:px-5"><Pause className="h-3.5 w-3.5" />Bellek duraklatıldı. Kayıtların silinmedi; açınca yeniden kullanılır.</p>}
        <form onSubmit={(e) => { e.preventDefault(); if (yeni.trim()) { yama({ ekle: yeni }); setYeni(""); } }} className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <input value={yeni} onChange={(e) => setYeni(e.target.value)} maxLength={400} placeholder="Hatırlamasını istediğin bir şey yaz: kahveyi sütsüz içerim, raporlar Türkçe olsun…" className={cn(alanSinif, "h-10 flex-1")} />
          <button type="submit" disabled={!yeni.trim()} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-30"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Ekle</span></button>
        </form>
        {b.kayitlar.length ? (
          <ul className="divide-y divide-white/[0.05]">
            <AnimatePresence initial={false}>
              {[...b.kayitlar].reverse().map((k) => (
                <motion.li key={k.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.1] text-[#8be6ff]"><Brain className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    {duzen?.id === k.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); yama({ duzenle: duzen }); setDuzen(null); }}>
                        <input autoFocus value={duzen.metin} onChange={(e) => setDuzen({ ...duzen, metin: e.target.value })} onBlur={(e) => e.currentTarget.form?.requestSubmit()} maxLength={400} className={cn(alanSinif, "h-9 text-[13.5px]")} />
                      </form>
                    ) : <span className="block text-[14px] leading-snug text-white/90">{k.metin}</span>}
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-white/45">
                      {gorece(k.zaman)}
                      {k.aktarim && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/60">{k.aktarim} hafızasından</span>}
                      {k.kaynak && <Link href={`/panel/build/sohbet/${k.kaynak.sohbet}`} className="flex min-w-0 items-center gap-1 hover:text-white"><MessageSquare className="h-3 w-3" /><span className="max-w-[260px] truncate">{k.kaynak.baslik}</span></Link>}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                    <button type="button" onClick={() => setDuzen({ id: k.id, metin: k.metin })} aria-label="Düzenle" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => yama({ sil: k.id })} aria-label="Sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : <p className="px-5 py-6 text-[13.5px] text-white/50">Henüz kayıt yok. Sohbette &quot;bunu hatırla&quot; dediğinde ya da kalıcı bir tercihini söylediğinde burada görünür.</p>}
        {b.kayitlar.length > 0 && (
          <div className="flex justify-end border-t border-white/[0.06] px-4 py-2.5 sm:px-5">
            <button type="button" onClick={() => { if (!temizleOnay) { setTemizleOnay(true); setTimeout(() => setTemizleOnay(false), 3000); return; } yama({ temizle: true }); setTemizleOnay(false); }}
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-500/[0.08]", temizleOnay && "bg-rose-500/[0.12] font-semibold")}><Trash2 className="h-3.5 w-3.5" />{temizleOnay ? "Hepsini silmek için tekrar tıkla" : "Bütün kayıtları sil"}</button>
          </div>
        )}
      </Kart>
      <IceAktarPaneli acik={getirAcik} kapat={() => { setGetirAcik(false); yukle(); }} ilkSekme="hafiza" />
    </div>
  );
}
