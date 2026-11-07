"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Download, Image as ImageIcon, PawPrint, Sparkles, Loader2 } from "lucide-react";
import { PozFigur } from "./Figur";
import { cn } from "@/lib/utils";
import { Segment, Kaydirici, AnahtarSatir } from "@/components/montaj/ui";
import type { Uretim } from "@/store/useProjeler";
import type { SahneBilgi } from "./Sahne";
import { ARAC_KREDI_3D, POLIGON_HAZIR, RIG_TURLERI, STILLER, kisaSayi, type Arac } from "./veri";

export type AracAyar =
  | { arac: "doku"; istem: string; stil: string; cozunurluk: "2K" | "4K"; pbr: boolean }
  | { arac: "remesh"; tip: "quad" | "triangle"; poligon: number }
  | { arac: "rig"; tur: string; boy: number }
  | { arac: "baski"; yukseklik: number };

export const ARAC_BILGI: Record<Arac, { ad: string; alt: string; kredi: number }> = {
  doku: { ad: "Dokula", alt: "Modele yeni PBR doku giydir", kredi: ARAC_KREDI_3D.doku },
  remesh: { ad: "Remesh", alt: "Topolojiyi ve poligon sayısını yeniden kur", kredi: ARAC_KREDI_3D.remesh },
  rig: { ad: "Rig ve animasyon", alt: "Otomatik iskelet, yürüme ve koşu", kredi: ARAC_KREDI_3D.rig },
  baski: { ad: "3D baskı", alt: "Gerçek ölçü, STL ve 3MF dosyası", kredi: ARAC_KREDI_3D.baski },
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
  const [rigTur, setRigTur] = useState("insansi");
  const [boy, setBoy] = useState(1.75);
  const [yukseklik, setYukseklik] = useState(120);
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

  const cta = (a: AracAyar | null, etiket: string, engelHam?: string) => {
    const engel = bagli ? engelHam : "3D sağlayıcısı bağlı değil; bu işlem şu an yapılamaz";
    return (
    <div className="border-t border-white/[0.06] p-3">
      <motion.button whileTap={{ scale: 0.97 }} disabled={!a || !!engel || calisiyor} onClick={() => a && calistir(a)} title={engel}
        className="hf-cta flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold disabled:opacity-55">
        {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{etiket}
        {bagli && b.kredi > 0 && <span className="tabular-nums">{b.kredi} kredi</span>}
      </motion.button>
      {engel && <p className="mt-1.5 text-center text-[12px] text-amber-200/90">{engel}</p>}
    </div>
    );
  };

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
            <Bolum baslik="Animasyonlar"><p className="text-[13px] leading-relaxed text-metin-2">Rig bitince karakterle birlikte yürüme ve koşu animasyonları gelir. Rig yalnız insansı, yüzü öne bakan karakterlerde çalışır.</p></Bolum>
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
                {Object.entries((model.meta?.dosyalar ?? {}) as Record<string, string>).filter(([, u]) => typeof u === "string" && u).map(([bicim]) => (
                  <div key={bicim} className="flex items-center gap-3 rounded-[14px] bg-white/[0.035] p-2.5 ring-1 ring-inset ring-white/[0.07]">
                    <BicimRozeti ad={bicim.toUpperCase()} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold text-metin">Baskı dosyası</span>
                      <span className="block truncate text-[12px] text-metin-2">Dilimleyici için, gerçek ölçüde</span>
                    </span>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onIndir(bicim)}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition-colors hover:bg-white/[0.075]"><Download className="h-4 w-4" />İndir</motion.button>
                  </div>
                ))}
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
      {arac === "remesh" && cta({ arac: "remesh", tip, poligon }, "Remesh")}
      {arac === "rig" && cta({ arac: "rig", tur: rigTur, boy }, "Rig'le", rigTur === "insansi" ? undefined : "Rig şu an yalnız insansı karakterlerde çalışır")}
      {arac === "baski" && cta({ arac: "baski", yukseklik }, "Baskıya hazırla")}
    </div>
  );
}

/** Dosya biçimi rozeti. */
function BicimRozeti({ ad, vurgu }: { ad: string; vurgu?: boolean }) {
  return (
    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[11.5px] font-bold tracking-tight ring-1 ring-inset", vurgu ? "bg-white/[0.085] text-metin ring-white/[0.12]" : "bg-white/[0.045] text-metin-2 ring-white/[0.07]")}>{ad}</span>
  );
}
