"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Code2, Film, GraduationCap, Languages, ListChecks, Mail, Megaphone, PenLine, Plus, Presentation, Search, Sparkles, Table2, Upload, X, Zap, type LucideIcon } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { HAZIR_BECERILER, komutYap, skillMdOku, useScBeceri, type ScBeceri } from "@/lib/scBeceri";
import { AyarBolum, Anahtar, BosDurum, AyarButon } from "@/components/kabuk/sc/SCAyarParcalari";

/* ============================================================
   AYARLAR › BECERİLER — Claude Skills karşılığı.
   Her beceri gerçek bir talimat paketidir: açık beceriler sohbette "/komut" ya da + menüsünden
   seçilir ve talimatı o mesajda modele gider. Kendi becerini yazabilir ya da SKILL.md içe aktarabilirsin.
   (Önceki sürümdeki "topluluk" kataloğu ve kurulum sayıları gerçek değildi; kaldırıldı.)
   ============================================================ */

const IKON: Record<ScBeceri["ikon"], LucideIcon> = { kalem: PenLine, megafon: Megaphone, liste: ListChecks, posta: Mail, kod: Code2, tablo: Table2, dil: Languages, sunum: Presentation, film: Film, istem: Sparkles, ogret: GraduationCap, arama: Search };
const KART = "overflow-hidden rounded-[18px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const SERIT = "flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5";
const GIRDI = "block w-full rounded-[12px] bg-black/25 px-3.5 text-[14px] text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/[0.08] transition placeholder:text-[var(--sc-metin-3)] focus:ring-white/30";
const ETIKET = "mb-1.5 block text-[12.5px] font-medium text-[var(--sc-metin-2)]";
/** Talimata tek tıkla eklenen bölüm iskeletleri. */
const ISKELET: [string, string][] = [
  ["Amaç", "## Amaç\nBu beceri ne için kullanılır, kim için yazılır?\n"],
  ["Çıktı biçimi", "## Çıktı biçimi\n- Başlık\n- 3 ile 5 madde\n- Kısa kapanış\n"],
  ["Ton", "## Ton\nSamimi ama profesyonel; kısa cümleler.\n"],
  ["Kurallar", "## Kurallar\n- Uydurma bilgi ekleme\n- Belirsizse önce sor\n"],
  ["Örnek", "## Örnek\nGirdi: ...\nÇıktı: ...\n"],
];

function BeceriPenceresi({ beceri, salt, onKapat, onKaydet }: { beceri?: ScBeceri; salt?: boolean; onKapat: () => void; onKaydet: (b: Omit<ScBeceri, "id">) => void }) {
  const [ad, setAd] = useState(beceri?.ad ?? "");
  const [komut, setKomut] = useState(beceri?.komut ?? "");
  const [aciklama, setAciklama] = useState(beceri?.aciklama ?? "");
  const [talimat, setTalimat] = useState(beceri?.talimat ?? "");
  const [ikon, setIkon] = useState<ScBeceri["ikon"]>(beceri?.ikon ?? "kalem");
  const ref = useOdakTuzagi<HTMLDivElement>(true);
  const metinRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  const eksik = ad.trim().length < 2 ? "Ad en az 2 harf" : talimat.trim().length < 10 ? "Talimat en az 10 harf" : null;
  const I = IKON[ikon] ?? Zap;
  const iskeletEkle = (m: string) => { setTalimat((t) => (t.trim() ? `${t.trimEnd()}\n\n${m}` : m).slice(0, 8000)); setTimeout(() => { const el = metinRef.current; if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; el.scrollTop = el.scrollHeight; } }, 30); };
  const baslik = salt ? beceri?.ad ?? "Beceri" : beceri ? "Beceriyi düzenle" : "Yeni beceri";
  return (
    <div className="sc-kapsam fixed inset-0 z-[200]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/55" onClick={onKapat} />
      <motion.aside ref={ref} role="dialog" aria-modal="true" aria-label={baslik} initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
        className="absolute inset-y-0 right-0 flex w-[min(560px,100vw)] flex-col border-l border-white/[0.08] bg-[var(--sc-kart)]">
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] text-[var(--sc-metin-3)]">Beceriler</p>
            <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em]">{baslik}</h2>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--sc-metin-2)] transition hover:bg-white/[0.085] hover:text-[var(--sc-metin)]"><X className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5 [scrollbar-width:thin]">
          {/* Canlı önizleme: + menüsünde nasıl görünecek */}
          <div className={cn(KART, "p-3.5")}>
            <p className="mb-2.5 text-[12px] font-medium text-[var(--sc-metin-3)]">+ menüsünde böyle görünür</p>
            <div className="flex items-center gap-3 rounded-[14px] bg-black/25 p-2.5 ring-1 ring-inset ring-white/[0.06]">
              <motion.span key={ikon} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0b0c]"><I className="h-[18px] w-[18px]" /></motion.span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="truncate text-[14px] font-semibold">{ad.trim() || "Beceri adı"}</span><code className="shrink-0 rounded-full bg-white/[0.085] px-2 text-[11.5px] leading-5 text-[var(--sc-metin-2)]">/{komut || komutYap(ad) || "komut"}</code></span>
                <span className="mt-0.5 block truncate text-[12.5px] text-[var(--sc-metin-3)]">{aciklama.trim() || "Ne işe yaradığını tek cümleyle yaz"}</span>
              </span>
            </div>
          </div>

          <section className={KART}>
            <div className={SERIT}><span className="text-[13.5px] font-semibold">Kimlik</span><span className="text-[12px] text-[var(--sc-metin-3)]">Ad, komut ve simge</span></div>
            <div className="space-y-3.5 p-4">
              <div className="grid grid-cols-[1fr_150px] gap-3 max-sm:grid-cols-1">
                <label className="block"><span className={ETIKET}>Ad</span>
                  <input autoFocus={!salt} value={ad} readOnly={salt} onChange={(e) => { setAd(e.target.value.slice(0, 60)); if (!beceri) setKomut(komutYap(e.target.value)); }} placeholder="Ör. Ürün açıklaması" className={cn("h-10", GIRDI)} />
                </label>
                <label className="block"><span className={ETIKET}>Komut</span>
                  <span className="flex h-10 items-center rounded-[12px] bg-black/25 pl-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
                    <span className="text-[14px] text-[var(--sc-metin-3)]">/</span>
                    <input value={komut} readOnly={salt} onChange={(e) => setKomut(komutYap(e.target.value))} placeholder="urun" className="h-full w-full bg-transparent px-1 text-[14px] outline-none placeholder:text-[var(--sc-metin-3)]" aria-label="Komut" />
                  </span>
                </label>
              </div>
              <label className="block"><span className={ETIKET}>Ne işe yarar</span>
                <input value={aciklama} readOnly={salt} onChange={(e) => setAciklama(e.target.value.slice(0, 160))} placeholder="Ör. Ürün sayfası için fayda odaklı açıklama yazar" className={cn("h-10", GIRDI)} />
              </label>
              <div><span className={ETIKET}>Simge</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {(Object.keys(IKON) as ScBeceri["ikon"][]).map((k) => {
                    const S = IKON[k]; const a = k === ikon;
                    return (
                      <button key={k} disabled={salt} onClick={() => setIkon(k)} aria-pressed={a} aria-label={`Simge ${k}`}
                        className={cn("relative flex h-10 items-center justify-center rounded-[12px] transition active:scale-95", a ? "bg-white/[0.12] text-[var(--sc-metin)]" : "bg-black/20 text-[var(--sc-metin-3)] hover:bg-white/[0.065] hover:text-[var(--sc-metin)]")}>
                        <S className="h-[18px] w-[18px]" />
                        <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset", a ? "ring-2 ring-white" : "ring-1 ring-white/[0.06]")} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className={KART}>
            <div className={SERIT}><span className="text-[13.5px] font-semibold">Talimat</span><span className="rounded-full bg-white/[0.085] px-2 text-[11.5px] tabular-nums leading-5 text-[var(--sc-metin-2)]">{talimat.length.toLocaleString("tr")} / 8.000</span></div>
            {!salt && (
              <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-3 py-2.5">
                {ISKELET.map(([a, m]) => <button key={a} onClick={() => iskeletEkle(m)} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.065] px-2.5 text-[12px] font-medium text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.11] hover:text-[var(--sc-metin)] active:scale-95"><Plus className="h-3 w-3" />{a}</button>)}
              </div>
            )}
            <textarea ref={metinRef} value={talimat} readOnly={salt} onChange={(e) => setTalimat(e.target.value.slice(0, 8000))} rows={12}
              placeholder={"Usta bu beceride ne yapmalı? Çıktının yapısını, tonunu ve kurallarını yaz.\n\nÖrnek: Ürün açıklamasını 3 bölümde yaz: kanca cümlesi, 4 madde fayda, kullanım önerisi."}
              className="block w-full resize-none bg-transparent px-4 py-3.5 text-[14px] leading-relaxed text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]" />
          </section>
        </div>

        <footer className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]">
          {!salt && eksik && <span className="rounded-full bg-white/[0.065] px-2.5 py-1 text-[12px] text-[var(--sc-metin-3)]">{eksik}</span>}
          <span className="flex-1" />
          <button onClick={onKapat} className="h-10 rounded-full px-4 text-[14px] font-medium text-[var(--sc-metin-2)] transition hover:bg-white/[0.065] hover:text-[var(--sc-metin)]">{salt ? "Kapat" : "Vazgeç"}</button>
          <motion.button whileTap={{ scale: 0.97 }} disabled={!salt && !!eksik} onClick={() => onKaydet({ ad: ad.trim(), komut: komut || komutYap(ad), aciklama: aciklama.trim(), talimat: talimat.trim(), ikon, ozel: true })}
            className="h-10 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0b0b0c] transition hover:bg-white/90 disabled:opacity-40">{salt ? "Kopyasını oluştur" : "Kaydet"}</motion.button>
        </footer>
      </motion.aside>
    </div>
  );
}

function BeceriSatiri({ b, acik, onDegis, onAc }: { b: ScBeceri; acik: boolean; onDegis: () => void; onAc: () => void }) {
  const I = IKON[b.ikon] ?? Zap;
  return (
    <div className="flex items-center gap-3.5 border-b border-white/[0.06] px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.035] sm:px-5">
      <button onClick={onAc} className="group flex min-w-0 flex-1 items-center gap-3.5 text-left">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", acik ? "bg-white text-[#0b0b0c]" : "bg-white/[0.065] text-[var(--sc-metin-3)]")}><I className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2"><span className="truncate text-[14px] font-medium text-[var(--sc-metin)] ">{b.ad}</span><code className="shrink-0 rounded-full bg-white/[0.085] px-2 text-[11.5px] text-[var(--sc-metin-2)]">/{b.komut}</code></span>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--sc-metin-3)]">{b.aciklama || "Açıklama yok"}</span>
        </span>
      </button>
      <Anahtar acik={acik} onDegis={onDegis} etiket={`${b.ad} becerisi`} />
    </div>
  );
}

export default function BecerilerAyar() {
  const acik = useScBeceri((s) => s.acik);
  const ozel = useScBeceri((s) => s.ozel);
  const { degistir, ekle, guncelle, sil } = useScBeceri.getState();
  const [pencere, setPencere] = useState<{ b?: ScBeceri; salt?: boolean } | null>(null);
  const [ara, setAra] = useState("");
  const dosya = useRef<HTMLInputElement>(null);
  const q = ara.trim().toLocaleLowerCase("tr");
  const uyar = (b: ScBeceri) => !q || `${b.ad} ${b.aciklama} ${b.komut}`.toLocaleLowerCase("tr").includes(q);
  const komutVar = (k: string, haric?: string) => [...ozel, ...HAZIR_BECERILER].some((x) => x.komut === k && x.id !== haric);

  const kaydet = (veri: Omit<ScBeceri, "id">) => {
    let komut = veri.komut;
    const duzenlenen = pencere?.b?.id && !pencere.salt ? pencere.b.id : undefined; // içe aktarılan beceri kimliksiz gelir → yeni kayıt
    for (let i = 2; komutVar(komut, duzenlenen); i++) komut = `${veri.komut}${i}`;
    if (duzenlenen) { guncelle(duzenlenen, { ...veri, komut }); toast.success("Beceri güncellendi"); }
    else { ekle({ ...veri, komut }); toast.success(`Beceri eklendi: /${komut}`); }
    setPencere(null);
  };
  const iceAktar = async (f?: File) => {
    if (!f) return;
    const b = skillMdOku(await f.text());
    if (!b) { toast.error("Beceri okunamadı", { description: "SKILL.md başında name ve description içeren bir üst bilgi bekleniyor." }); return; }
    setPencere({ b: { ...b, id: "", ikon: "kalem" } });
  };

  return (
    <div>
      <AyarBolum baslik="Beceriler" ozet="Açık beceriler sohbette /komut ile ya da + menüsünden kullanılır; seçtiğin becerinin talimatı o mesajda Usta'ya gider."
        sagUst={<span className="flex gap-2">
          <AyarButon ikincil onClick={() => dosya.current?.click()}><Upload className="h-4 w-4" />İçe aktar</AyarButon>
          <AyarButon onClick={() => setPencere({})}><Plus className="h-4 w-4" />Yeni beceri</AyarButon>
          <input ref={dosya} type="file" accept=".md,.markdown,.txt" hidden onChange={(e) => { void iceAktar(e.target.files?.[0]); e.target.value = ""; }} />
        </span>} panelsiz>
        <label className="flex h-10 items-center gap-2.5 rounded-full bg-black/25 px-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
          <Search className="h-4 w-4 text-[var(--sc-metin-3)]" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Becerilerde ara" aria-label="Becerilerde ara" className="h-full w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--sc-metin-3)]" />
        </label>
      </AyarBolum>

      <AyarBolum baslik="Senin becerilerin" ozet="Kendi yazdığın ya da içe aktardığın beceriler.">
        {ozel.filter(uyar).length === 0
          ? <BosDurum ikon={BookOpen} baslik={q ? "Eşleşen beceri yok" : "Henüz kendi becerin yok"} ozet="Sık yaptığın bir işi talimat olarak kaydet; sonra /komut ile tek seferde çağır." eylem={!q && <AyarButon onClick={() => setPencere({})}><Plus className="h-4 w-4" />Yeni beceri</AyarButon>} />
          : ozel.filter(uyar).map((b) => (
            <div key={b.id} className="group relative">
              <BeceriSatiri b={b} acik={acik.includes(b.id)} onDegis={() => degistir(b.id)} onAc={() => setPencere({ b })} />
              <button onClick={() => { sil(b.id); toast.success("Beceri silindi"); }} aria-label={`${b.ad} becerisini sil`} className="absolute right-16 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[12.5px] text-rose-300 opacity-0 transition-opacity hover:bg-rose-500/10 focus-visible:opacity-100 group-hover:opacity-100">Sil</button>
            </div>
          ))}
      </AyarBolum>

      <AyarBolum baslik="Vayra becerileri" ozet={`${HAZIR_BECERILER.filter((b) => acik.includes(b.id)).length} / ${HAZIR_BECERILER.length} açık. Talimatı görmek için becerinin adına tıkla.`}>
        {HAZIR_BECERILER.filter(uyar).map((b) => <BeceriSatiri key={b.id} b={b} acik={acik.includes(b.id)} onDegis={() => degistir(b.id)} onAc={() => setPencere({ b, salt: true })} />)}
        {HAZIR_BECERILER.filter(uyar).length === 0 && <p className="px-4 py-6 text-[13.5px] text-[var(--sc-metin-3)]">Eşleşen beceri yok.</p>}
      </AyarBolum>

      {pencere && <BeceriPenceresi beceri={pencere.b} salt={pencere.salt} onKapat={() => setPencere(null)} onKaydet={(v) => kaydet(pencere.salt ? { ...v, ad: `${v.ad} (kopya)`, komut: `${v.komut}2` } : v)} />}
    </div>
  );
}
