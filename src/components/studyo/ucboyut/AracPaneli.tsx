"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Download, Image as ImageIcon, PawPrint, Sparkles, Loader2 } from "lucide-react";
import { AnimOnizleme } from "./AnimOnizleme";
import { PozFigur } from "./Figur";
import { cn } from "@/lib/utils";
import { Segment, Kaydirici, AnahtarSatir } from "@/components/montaj/ui";
import type { Uretim } from "@/store/useProjeler";
import type { SahneBilgi } from "./Sahne";
import { ANIMASYONLAR, ANIMASYON_KATEGORILERI, POLIGON_HAZIR, RIG_TURLERI, STILLER, TABANLAR, kisaSayi, type Arac } from "./veri";

export type AracAyar =
  | { arac: "doku"; istem: string; stil: string; cozunurluk: "2K" | "4K"; pbr: boolean }
  | { arac: "remesh"; tip: "quad" | "triangle"; poligon: number; simetri: boolean }
  | { arac: "rig"; tur: string; boy: number; animasyonlar: string[] }
  | { arac: "baski"; yukseklik: number; taban: string; cokRenk: boolean };

export const ARAC_BILGI: Record<Arac, { ad: string; alt: string; kredi: number }> = {
  doku: { ad: "Dokula", alt: "Modele yeni PBR doku giydir", kredi: 10 },
  remesh: { ad: "Remesh", alt: "Topolojiyi ve poligon sayısını yeniden kur", kredi: 0 },
  rig: { ad: "Rig ve animasyon", alt: "Otomatik iskelet, hazır hareketler", kredi: 20 },
  baski: { ad: "3D baskı", alt: "Ölçü, taban ve dilimleyici dosyası", kredi: 10 },
  indir: { ad: "İndir", alt: "Biçim seç, dosyayı al", kredi: 0 },
};

const Bolum = ({ baslik, sag, children }: { baslik: string; sag?: React.ReactNode; children: React.ReactNode }) => (
  <section className="mx-3 mt-3 overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
    <div className="flex min-h-[42px] items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2"><p className="text-[13px] font-semibold text-metin">{baslik}</p>{sag}</div>
    <div className="p-3">{children}</div>
  </section>
);

function Satir({ sec, ikon: I, kapak, ad, alt, onClick, sag }: { sec: boolean; ikon?: typeof Check; kapak?: React.ReactNode; ad: string; alt?: string; onClick: () => void; sag?: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={sec} className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors", sec ? "bg-white/[0.085] ring-2 ring-inset ring-white" : "hover:bg-white/[0.065]")}>
      {kapak}
      {I && <I className={cn("h-4 w-4 shrink-0", sec ? "text-white" : "text-metin-2")} />}
      <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{ad}</span>{alt && <span className="block truncate text-[12px] text-metin-2">{alt}</span>}</span>
      {sag}
    </button>
  );
}

const DemoNot = ({ children }: { children: React.ReactNode }) => <p className="mt-2 text-[12px] leading-snug text-amber-200/90">{children}</p>;

/**
 * Sağdan açılan araç paneli — seçili modele uygulanan işlemler. Her işlem yeni bir sürüm kaydı açar
 * (orijinal korunur). Ölçüler ve mesh istatistikleri sahnedeki GLB'den gelir.
 */
export function AracPaneli({ arac, model, bilgi, bagli, onKapat, onCalistir, onIndir, onGoruntu }: {
  arac: Arac; model: Uretim; bilgi: SahneBilgi | null; bagli: boolean;
  onKapat: () => void; onCalistir: (a: AracAyar) => void; onIndir: (format: string) => void; onGoruntu: () => void;
}) {
  const [istem, setIstem] = useState("");
  const [stil, setStil] = useState<string>("gercekci");
  const [coz, setCoz] = useState<"2K" | "4K">("2K");
  const [pbr, setPbr] = useState(true);
  const [tip, setTip] = useState<"quad" | "triangle">(model.topoloji?.tip ?? "quad");
  const [poligon, setPoligon] = useState(10000);
  const [simetri, setSimetri] = useState(true);
  const [rigTur, setRigTur] = useState("insansi");
  const [boy, setBoy] = useState(1.75);
  const [kat, setKat] = useState("hepsi");
  const [anim, setAnim] = useState<string[]>(["Boşta Bekleme", "Yürüme"]);
  const [yukseklik, setYukseklik] = useState(120);
  const [taban, setTaban] = useState("daire");
  const [cokRenk, setCokRenk] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const b = ARAC_BILGI[arac];
  const [boyut, setBoyut] = useState<string | null>(null);
  // GLB'nin gerçek dosya boyutu (indir kartında).
  useEffect(() => {
    if (arac !== "indir" || !model.glbUrl || model.glbUrl.startsWith("data:")) return;
    let iptal = false;
    fetch(model.glbUrl, { method: "HEAD" }).then((y) => { const n = Number(y.headers.get("content-length")); if (!iptal && n > 0) setBoyut(`${(n / 1048576).toLocaleString("tr", { maximumFractionDigits: 1 })} MB`); }).catch(() => {});
    return () => { iptal = true; };
  }, [arac, model.glbUrl]);

  const calistir = (a: AracAyar) => { setCalisiyor(true); onCalistir(a); setTimeout(() => setCalisiyor(false), 600); };
  const olcek = bilgi && bilgi.olcu.y > 0 ? yukseklik / (bilgi.olcu.y * 1000) : 0;
  const mm = (m: number) => Math.round(m * 1000 * olcek);

  const cta = (a: AracAyar | null, etiket: string, engel?: string) => (
    <div className="border-t border-white/[0.06] p-3">
      <motion.button whileTap={{ scale: 0.97 }} disabled={!a || !!engel || calisiyor} onClick={() => a && calistir(a)} title={engel}
        className="hf-cta flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold disabled:opacity-55">
        {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{etiket}
        {bagli ? b.kredi > 0 && <span className="tabular-nums">{b.kredi} kredi</span> : <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11.5px]">Ücretsiz</span>}
      </motion.button>
      {engel && <p className="mt-1.5 text-center text-[12px] text-amber-200/90">{engel}</p>}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pb-2 pt-3.5">
        <button onClick={onKapat} aria-label="Modellerime dön" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin"><ArrowLeft className="h-4 w-4" /></button>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-metin">{b.ad}</h2>
          <p className="truncate text-[12px] text-metin-2">{b.alt}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {arac === "doku" && (
          <>
            <Bolum baslik="Yeni doku">
              <textarea value={istem} onChange={(e) => setIstem(e.target.value.slice(0, 600))} rows={3} spellCheck={false} placeholder="Örn. paslı bakır, yeşil patina, el boyaması detaylar"
                className="block w-full resize-none rounded-[12px] bg-white/[0.055] px-3 py-2.5 text-[14px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/20" />
            </Bolum>
            <Bolum baslik="Stil">
              <div className="space-y-0.5">
                {STILLER.map((s) => (
                  <Satir key={s.id} sec={stil === s.id} ad={s.ad} alt={s.alt} onClick={() => setStil(s.id)}
                    // eslint-disable-next-line @next/next/no-img-element
                    kapak={<img src={s.kapak} alt="" className="h-9 w-9 shrink-0 rounded-[9px] object-cover" />} />
                ))}
              </div>
            </Bolum>
            <Bolum baslik="Kalite">
              <Segment deger={coz} onDegis={setCoz} etiket="Doku çözünürlüğü" secenekler={[["2K", "2K doku"], ["4K", "4K doku"]]} />
              <div className="mt-3"><AnahtarSatir ad="PBR haritaları" alt="Metaliklik, pürüzlülük ve normal haritası" acik={pbr} onDegis={() => setPbr((v) => !v)} /></div>
            </Bolum>
          </>
        )}

        {arac === "remesh" && (
          <>
            <Bolum baslik="Şu anki mesh">
              <dl className="divide-y divide-white/[0.06] rounded-[12px] bg-white/[0.045] text-[13px] ring-1 ring-inset ring-white/[0.06]">
                {[["Üçgen", bilgi ? bilgi.ucgen.toLocaleString("tr") : "…"], ["Köşe", bilgi ? bilgi.kose.toLocaleString("tr") : "…"], ["Topoloji", model.topoloji?.tip === "quad" ? "Dörtgen" : "Üçgen"]].map(([a, d]) => (
                  <div key={a} className="flex items-center justify-between gap-3 px-3 py-2"><dt className="text-metin-2">{a}</dt><dd className="font-medium tabular-nums text-metin">{d}</dd></div>
                ))}
              </dl>
            </Bolum>
            <Bolum baslik="Topoloji">
              <Segment deger={tip} onDegis={setTip} etiket="Topoloji" secenekler={[["quad", "Dörtgen"], ["triangle", "Üçgen"]]} />
              <p className="mt-1.5 text-[12px] text-metin-2">{tip === "quad" ? "Temiz kenar akışı; rig, animasyon ve heykel için." : "Oyun motorları ve web için en hafif sonuç."}</p>
            </Bolum>
            <Bolum baslik="Hedef poligon" sag={<span className="text-[13px] font-medium tabular-nums text-metin">{poligon.toLocaleString("tr")}</span>}>
              <div className="mb-3"><Segment deger={POLIGON_HAZIR.includes(poligon) ? poligon : 0} onDegis={(v) => v && setPoligon(v)} etiket="Poligon" secenekler={[...POLIGON_HAZIR.map((n) => [n, kisaSayi(n)] as const), [0, "Özel"] as const]} /></div>
              <Kaydirici ad="Özel" deger={poligon} min={500} max={200000} adim={500} onDegis={setPoligon} yaz={(v) => kisaSayi(v)} />
            </Bolum>
            <Bolum baslik="Seçenekler"><AnahtarSatir ad="Simetri" alt="Sol ve sağ yarıyı eşitle" acik={simetri} onDegis={() => setSimetri((v) => !v)} /></Bolum>
          </>
        )}

        {arac === "rig" && (
          <>
            <Bolum baslik="İskelet türü">
              <div className="grid grid-cols-2 gap-2">
                {RIG_TURLERI.map((r) => {
                  const sec = rigTur === r.id;
                  return (
                    <motion.button whileTap={{ scale: 0.97 }} key={r.id} onClick={() => setRigTur(r.id)} aria-pressed={sec} className="group min-w-0 text-left">
                      <span className={cn("relative flex h-[92px] items-center justify-center overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_50%_35%,#2c2e33,#16171a)] transition-[outline-color]",
                        sec ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/25")}>
                        {r.id === "insansi" ? <PozFigur id="a" className={cn("h-[80%] w-[80%]", sec ? "text-white" : "text-metin-2")} /> : <PawPrint className={cn("h-10 w-10", sec ? "text-white" : "text-metin-2")} strokeWidth={1.6} />}
                      </span>
                      <span className={cn("mt-1.5 block text-[13px] font-semibold", sec ? "text-metin" : "text-metin-2")}>{r.ad}</span>
                      <span className="block truncate text-[11.5px] text-metin-2">{r.alt}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Bolum>
            <Bolum baslik="Karakter boyu"><Kaydirici ad="Boy" deger={boy} min={0.3} max={4} adim={0.05} onDegis={setBoy} yaz={(v) => `${v.toFixed(2).replace(".", ",")} m`} /></Bolum>
            <Bolum baslik="Animasyonlar" sag={<span className="flex items-center gap-1.5">{anim.length > 0 && <button onClick={() => setAnim([])} className="h-6 rounded-full px-2 text-[11.5px] font-medium text-metin-3 transition hover:bg-white/[0.085] hover:text-metin">Temizle</button>}<motion.span key={anim.length} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className={cn("rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums", anim.length ? "bg-white text-black" : "bg-white/[0.085] text-metin-2")}>{anim.length} seçili</motion.span></span>}>
              <div role="radiogroup" aria-label="Kategori" className="mb-3 flex flex-wrap gap-1.5">
                {ANIMASYON_KATEGORILERI.map((k) => (
                  <button key={k.id} role="radio" aria-checked={kat === k.id} onClick={() => setKat(k.id)} className={cn("relative h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset ring-white/[0.08] transition-colors", kat === k.id ? "text-black ring-transparent" : "bg-white/[0.065] text-metin-2 hover:text-metin")}>
                    {kat === k.id && <motion.span layoutId="ucb-anim-kat" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{k.ad}</span>
                  </button>
                ))}
              </div>
              <motion.div className="grid grid-cols-2 gap-2">
                {ANIMASYONLAR.filter((a) => kat === "hepsi" || a.kategori === kat).map((a) => (
                  <AnimKarti key={a.ad} ad={a.ad} sure={a.sure} sec={anim.includes(a.ad)} sira={anim.indexOf(a.ad) + 1} onClick={() => setAnim((l) => (l.includes(a.ad) ? l.filter((x) => x !== a.ad) : [...l, a.ad]))} />
                ))}
              </motion.div>
            </Bolum>
          </>
        )}

        {arac === "baski" && (
          <>
            <Bolum baslik="Ölçü">
              <Kaydirici ad="Yükseklik" deger={yukseklik} min={20} max={400} adim={5} onDegis={setYukseklik} yaz={(v) => `${v} mm`} />
              <dl className="mt-3 divide-y divide-white/[0.06] rounded-[12px] bg-white/[0.045] text-[13px] ring-1 ring-inset ring-white/[0.06]">
                {[["Boyut (G × D × Y)", bilgi ? `${mm(bilgi.olcu.x)} × ${mm(bilgi.olcu.z)} × ${mm(bilgi.olcu.y)} mm` : "Model yükleniyor…"], ["Üçgen", bilgi ? bilgi.ucgen.toLocaleString("tr") : "…"], ["Önerilen katman", yukseklik < 60 ? "0,12 mm" : "0,2 mm"]].map(([a, d]) => (
                  <div key={a} className="flex items-center justify-between gap-3 px-3 py-2"><dt className="text-metin-2">{a}</dt><dd className="font-medium tabular-nums text-metin">{d}</dd></div>
                ))}
              </dl>
            </Bolum>
            <Bolum baslik="Taban">
              <div className="space-y-0.5">
                {TABANLAR.map((t) => <Satir key={t.id} sec={taban === t.id} ad={t.ad} alt={t.alt} kapak={<span className={taban === t.id ? "text-aksan" : "text-metin-2"}><TabanSekli id={t.id} /></span>} onClick={() => setTaban(t.id)} />)}
              </div>
            </Bolum>
            <Bolum baslik="Renk"><AnahtarSatir ad="Çok renkli baskı" alt="Dokudan filament bölgeleri çıkarır (3MF)" acik={cokRenk} onDegis={() => setCokRenk((v) => !v)} /></Bolum>
          </>
        )}

        {arac === "indir" && (
          <>
            <Bolum baslik="Hazır dosyalar">
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.035] p-2.5 ring-1 ring-inset ring-white/[0.07]">
                  <BicimRozeti ad="GLB" vurgu />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-metin">3D model</span>
                    <span className="block truncate text-[12px] text-metin-2">{boyut ? `${boyut} · Web, Blender` : "Web, Three.js, Blender"}</span>
                  </span>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => onIndir("glb")} disabled={!model.glbUrl}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#0b0c0e] disabled:opacity-40"><Download className="h-4 w-4" />İndir</motion.button>
                </div>
                <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.035] p-2.5 ring-1 ring-inset ring-white/[0.07]">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-[radial-gradient(circle_at_50%_40%,#34363b,#16171a)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {model.thumbnailUrl && <img src={model.thumbnailUrl} alt="" className="h-full w-full object-contain p-1" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-metin">Görüntü</span>
                    <span className="block truncate text-[12px] text-metin-2">Şu anki açı, PNG</span>
                  </span>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={onGoruntu}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition-colors hover:bg-white/[0.075]"><ImageIcon className="h-4 w-4" />Al</motion.button>
                </div>
              </div>
            </Bolum>
          </>
        )}
      </div>

      {arac === "doku" && cta({ arac: "doku", istem, stil, cozunurluk: coz, pbr }, "Dokula", istem.trim() ? undefined : "Yeni dokuyu anlat")}
      {arac === "remesh" && cta({ arac: "remesh", tip, poligon, simetri }, "Remesh")}
      {arac === "rig" && cta({ arac: "rig", tur: rigTur, boy, animasyonlar: anim }, "Rig'le")}
      {arac === "baski" && cta({ arac: "baski", yukseklik, taban, cokRenk }, "Baskıya hazırla")}
    </div>
  );
}

function TabanSekli({ id }: { id: string }) {
  const c = "h-6 w-9 text-current";
  if (id === "yok") return <svg viewBox="0 0 36 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"><ellipse cx="18" cy="16" rx="13" ry="4" /></svg>;
  if (id === "daire") return <svg viewBox="0 0 36 24" className={c} fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1.5"><ellipse cx="18" cy="12" rx="14" ry="4.5" /><path d="M4 12v4c0 2.5 6.3 4.5 14 4.5s14-2 14-4.5v-4" fill="none" /></svg>;
  if (id === "kare") return <svg viewBox="0 0 36 24" className={c} fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1.5"><path d="M18 5l14 6-14 6-14-6z" /><path d="M4 11v4l14 6 14-6v-4" fill="none" /></svg>;
  return <svg viewBox="0 0 36 24" className={c} fill="currentColor" fillOpacity=".25" stroke="currentColor" strokeWidth="1.5"><path d="M10 6h16l6 5-6 5H10l-6-5z" /><path d="M4 11v4l6 5h16l6-5v-4" fill="none" /></svg>;
}

/** Animasyon kartı: üzerine gelince ya da seçiliyken figür hareketi oynatır. */
function AnimKarti({ ad, sure, sec, sira, onClick }: { ad: string; sure: string; sec: boolean; sira: number; onClick: () => void }) {
  const [ust, setUst] = useState(false);
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} aria-pressed={sec} onPointerEnter={() => setUst(true)} onPointerLeave={() => setUst(false)} onFocus={() => setUst(true)} onBlur={() => setUst(false)}
      className="group relative block aspect-[4/5] w-full min-w-0 overflow-hidden rounded-[14px] text-left"
      style={{ background: "radial-gradient(80% 60% at 50% 40%, #4a4d54 0%, #2a2c31 55%, #17181b 100%)" }}>
      {/* stüdyo zemini: perspektif ızgara */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[38%] opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:14px_10px] [mask-image:linear-gradient(to_top,#000,transparent)] [transform:perspective(120px)_rotateX(48deg)] [transform-origin:bottom]" />
      <AnimOnizleme ad={ad} oynat={ust} className="absolute inset-x-0 top-[2%] h-[88%] origin-[50%_60%] scale-[1.45] transition-transform duration-300 group-hover:scale-[1.52]" />
      <span className="absolute right-2 top-2 rounded-full bg-black/55 px-1.5 py-px text-[10.5px] font-medium tabular-nums text-white/85 backdrop-blur">{sure}</span>
      <AnimatePresence>{sec && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-black">{sira}</motion.span>}</AnimatePresence>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-2.5 pb-2 pt-5">
        <span className={cn("block truncate text-[12.5px] font-semibold", sec ? "text-white" : "text-white/80")}>{ad}</span>
      </span>
      <span aria-hidden className={cn("pointer-events-none absolute inset-0 rounded-[14px] ring-inset transition-shadow", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/30")} />
    </motion.button>
  );
}

/** Dosya biçimi rozeti. */
function BicimRozeti({ ad, vurgu }: { ad: string; vurgu?: boolean }) {
  return (
    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[11.5px] font-bold tracking-tight ring-1 ring-inset", vurgu ? "bg-white/[0.085] text-metin ring-white/[0.12]" : "bg-white/[0.045] text-metin-2 ring-white/[0.07]")}>{ad}</span>
  );
}
