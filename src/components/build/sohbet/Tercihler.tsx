"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlignLeft, Check, Eye, History, Languages, ListTree, Loader2, RotateCcw, Ruler, Smile, SlidersHorizontal, Trash2, UserRound } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { SagPanel } from "./ortak";

/**
 * Kişiselleştirme v5: yanıt tercihleri (uzunluk, emoji, dil, hitap, biçim; her birinde Özel) ve özel talimatların
 * sürüm geçmişi (Hakkımda, tarz ve tercihlerin her değişiminden önceki hâli; göz at ve geri yükle).
 */
export type Tercih = { uzunluk: string; uzunlukOzel: string; emoji: string; dil: string; dilOzel: string; hitap: string; ad: string; hitapOzel: string; bicim: string };
type Surum = { id: string; zaman: number; hakkimda: string; tarz: string; ozelTarz: string; tercih: Tercih; ozet: string };

type Secenek = { id: string; ad: string };
const SATIRLAR: { k: keyof Tercih; ad: string; alt: string; I: typeof Ruler; l: Secenek[]; ozel?: { k: keyof Tercih; yer: string; max: number } }[] = [
  { k: "uzunluk", ad: "Uzunluk", alt: "Yanıtların ne kadar ayrıntılı olacağı", I: Ruler, l: [{ id: "otomatik", ad: "Soruya göre" }, { id: "kisa", ad: "Kısa" }, { id: "orta", ad: "Orta" }, { id: "uzun", ad: "Ayrıntılı" }, { id: "ozel", ad: "Özel" }], ozel: { k: "uzunlukOzel", yer: "Ör. en çok 5 cümle; kod sorularında ayrıntılı", max: 300 } },
  { k: "emoji", ad: "Emoji", alt: "Yanıtlarda emoji kullanımı", I: Smile, l: [{ id: "hic", ad: "Hiç" }, { id: "az", ad: "Ölçülü" }, { id: "serbest", ad: "Serbest" }] },
  { k: "dil", ad: "Dil", alt: "Yanıtların dili", I: Languages, l: [{ id: "otomatik", ad: "Yazdığım dil" }, { id: "tr", ad: "Hep Türkçe" }, { id: "en", ad: "Hep İngilizce" }, { id: "de", ad: "Hep Almanca" }, { id: "ozel", ad: "Özel" }], ozel: { k: "dilOzel", yer: "Ör. İspanyolca", max: 60 } },
  { k: "hitap", ad: "Hitap", alt: "Vayra sana nasıl seslensin", I: UserRound, l: [{ id: "otomatik", ad: "Duruma göre" }, { id: "sen", ad: "Sen" }, { id: "siz", ad: "Siz" }, { id: "ad", ad: "Adımla" }, { id: "ozel", ad: "Özel" }], ozel: { k: "hitapOzel", yer: "Ör. bana hocam de", max: 200 } },
  { k: "bicim", ad: "Biçim", alt: "Başlık ve madde kullanımı", I: AlignLeft, l: [{ id: "otomatik", ad: "Duruma göre" }, { id: "duz", ad: "Düz paragraf" }, { id: "maddeli", ad: "Maddeli" }] },
];

/** Yanıt tercihleri kartı: her satırda seçenekler; Özel seçilince yazı alanı açılır. Değişiklik "Kaydet" ile gider. */
export function TercihKarti({ tercih, kaydet, kaydedildi }: { tercih: Tercih; kaydet: (t: Tercih) => Promise<void>; kaydedildi?: boolean }) {
  const [t, setT] = useState(tercih);
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => setT(tercih), [tercih]);
  const degisti = JSON.stringify(t) !== JSON.stringify(tercih);
  return (
    <Kart ikon={SlidersHorizontal} baslik="Yanıt tercihleri" alt="Bütün genel sohbetlerde geçerli; değişiklikler sürüm geçmişine yazılır" govde=""
      sag={degisti ? <><button type="button" onClick={() => setT(tercih)} className="h-8 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white">Vazgeç</button><button type="button" disabled={gidiyor} onClick={async () => { setGidiyor(true); try { await kaydet(t); } finally { setGidiyor(false); } }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button></>
        : kaydedildi ? <span className="flex items-center gap-1 text-[12.5px] text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Kaydedildi</span> : undefined}>
      <div className="divide-y divide-white/[0.06]">
        {SATIRLAR.map((r) => {
          const deger = String(t[r.k]);
          return (
            <div key={r.k} className="flex flex-wrap items-start gap-x-4 gap-y-2.5 px-4 py-3.5 sm:px-5">
              <span className="flex min-w-[200px] flex-1 items-center gap-3 sm:max-w-[260px]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/80"><r.I className="h-4 w-4" /></span>
                <span><span className="block text-[13.5px] font-medium text-white">{r.ad}</span><span className="block text-[12px] text-white/50">{r.alt}</span></span>
              </span>
              <div className="min-w-0 flex-[2]">
                <div className="flex flex-wrap gap-1.5">
                  {r.l.map((x) => <button key={x.id} type="button" onClick={() => setT({ ...t, [r.k]: x.id })} className={cn("h-8 rounded-full px-3.5 text-[12.5px] transition-colors", deger === x.id ? "bg-white font-medium text-black" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white")}>{x.ad}</button>)}
                </div>
                <AnimatePresence initial={false}>
                  {((deger === "ozel" && r.ozel) || (r.k === "hitap" && deger === "ad")) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      {r.k === "hitap" && deger === "ad"
                        ? <input value={t.ad} onChange={(e) => setT({ ...t, ad: e.target.value.slice(0, 40) })} placeholder="Adın" autoComplete="given-name" className="mt-2 h-9 w-full max-w-[320px] rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/30" />
                        : <input value={String(t[r.ozel!.k])} onChange={(e) => setT({ ...t, [r.ozel!.k]: e.target.value.slice(0, r.ozel!.max) })} placeholder={r.ozel!.yer} className="mt-2 h-9 w-full rounded-[12px] bg-white/[0.05] px-3 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/30" />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </Kart>
  );
}

const TARZ_AD: Record<string, string> = { varsayilan: "Varsayılan", kisa: "Kısa", aciklayici: "Açıklayıcı", resmi: "Resmî", samimi: "Samimi", ozel: "Özel" };
const tercihMetni = (t: Tercih) => SATIRLAR.map((r) => {
  const x = r.l.find((y) => y.id === t[r.k])?.ad ?? String(t[r.k]);
  const ek = t[r.k] === "ozel" && r.ozel ? `: ${t[r.ozel.k]}` : r.k === "hitap" && t.hitap === "ad" ? `: ${t.ad}` : "";
  return { ad: r.ad, deger: `${x}${ek}` };
});

/** Özel talimatların sürüm geçmişi: göz at (sağ panel) ve geri yükle; geri yüklemek de yeni bir sürüm bırakır. */
export function TalimatGecmisi({ surumler, simdiki, geriYukle, sil }: { surumler: Surum[]; simdiki: { hakkimda: string; tarz: string; ozelTarz: string; tercih: Tercih }; geriYukle: (id: string) => Promise<unknown>; sil: (id: string) => void }) {
  const [bak, setBak] = useState<Surum | null>(null);
  const [is, setIs] = useState("");
  const [hepsi, setHepsi] = useState(false);
  const l = hepsi ? surumler : surumler.slice(0, 5);
  const fark = (s: Surum) => [s.hakkimda !== simdiki.hakkimda && "Hakkımda", (s.tarz !== simdiki.tarz || s.ozelTarz !== simdiki.ozelTarz) && "Yanıt tarzı", JSON.stringify(s.tercih) !== JSON.stringify(simdiki.tercih) && "Tercihler"].filter(Boolean) as string[];
  return (
    <Kart ikon={History} baslik={<span className="flex items-center gap-2">Talimat geçmişi{surumler.length > 0 && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/65">{surumler.length}</span>}</span>} alt="Hakkımda, yanıt tarzı ve tercihlerin önceki hâlleri" govde="">
      {!surumler.length ? <p className="px-5 py-5 text-[13.5px] text-white/50">Henüz sürüm yok. Hakkımda, yanıt tarzı ya da tercihlerini değiştirdiğinde önceki hâli burada saklanır; istediğin an geri dönebilirsin.</p> : (
        <>
          <ul className="divide-y divide-white/[0.05]">
            <AnimatePresence initial={false}>
              {l.map((s) => {
                const f = fark(s);
                return (
                  <motion.li key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/70"><History className="h-4 w-4" /></span>
                    <span className="min-w-[200px] flex-1"><span className="block text-[13.5px] text-white">{s.ozet}</span><span className="block text-[12px] text-white/45">{new Date(s.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} · {gorece(s.zaman)}{f.length ? ` · şu andan farklı: ${f.join(", ").toLocaleLowerCase("tr")}` : " · şu anki hâlle aynı"}</span></span>
                    <span className="flex items-center gap-1">
                      <button type="button" onClick={() => setBak(s)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12]"><Eye className="h-3.5 w-3.5" /><span className="max-sm:hidden">Göz at</span></button>
                      <button type="button" disabled={!!is || !f.length} onClick={async () => { setIs(s.id); try { await geriYukle(s.id); } finally { setIs(""); } }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-30">{is === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Geri yükle</span></button>
                      <button type="button" onClick={() => sil(s.id)} aria-label="Sürümü sil" title="Sürümü sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 opacity-0 hover:bg-white/[0.06] hover:text-rose-300 group-hover:opacity-100 max-sm:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {surumler.length > 5 && <button type="button" onClick={() => setHepsi(!hepsi)} className="w-full border-t border-white/[0.06] py-2.5 text-[12.5px] text-white/60 hover:text-white">{hepsi ? "Daha az göster" : `${surumler.length - 5} sürüm daha`}</button>}
        </>
      )}
      <SagPanel acik={!!bak} kapat={() => setBak(null)} baslik="Talimat sürümü" alt={bak ? new Date(bak.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""} ikon={<History className="h-[18px] w-[18px]" />} genislik={520}
        alt2={bak ? <><span className="ml-auto" /><button type="button" onClick={() => setBak(null)} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Kapat</button><button type="button" disabled={!fark(bak).length} onClick={async () => { await geriYukle(bak.id); setBak(null); }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-30"><RotateCcw className="h-4 w-4" />Bu sürümü geri yükle</button></> : undefined}>
        {bak && (
          <div className="space-y-4">
            <section>
              <p className="mb-1.5 flex items-center gap-2 text-[13px] font-medium text-white/75"><UserRound className="h-3.5 w-3.5" />Hakkımda{bak.hakkimda !== simdiki.hakkimda && <span className="rounded-full bg-[#55d6fd]/[0.12] px-2 py-0.5 text-[11px] text-[#8be6ff]">şu andan farklı</span>}</p>
              <p className="whitespace-pre-wrap rounded-[16px] bg-white/[0.04] p-3.5 text-[13px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07]">{bak.hakkimda || "Boş"}</p>
            </section>
            <section>
              <p className="mb-1.5 flex items-center gap-2 text-[13px] font-medium text-white/75"><ListTree className="h-3.5 w-3.5" />Yanıt tarzı ve tercihler</p>
              <dl className="divide-y divide-white/[0.05] rounded-[16px] px-3.5 text-[13px] ring-1 ring-inset ring-white/[0.07]">
                <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 text-white/45">Tarz</dt><dd className="min-w-0 flex-1 text-white">{TARZ_AD[bak.tarz] ?? bak.tarz}{bak.tarz === "ozel" && bak.ozelTarz ? `: ${bak.ozelTarz}` : ""}</dd></div>
                {tercihMetni(bak.tercih).map((x) => <div key={x.ad} className="flex gap-3 py-2"><dt className="w-24 shrink-0 text-white/45">{x.ad}</dt><dd className="min-w-0 flex-1 break-words text-white">{x.deger}</dd></div>)}
              </dl>
            </section>
          </div>
        )}
      </SagPanel>
    </Kart>
  );
}
