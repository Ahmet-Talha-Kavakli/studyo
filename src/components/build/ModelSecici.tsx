"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Brain, ChevronDown, FileText, Globe, ImageIcon, Search, Star, Terminal } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { BUILD_MODELLERI, SAGLAYICILAR, krediHesapla, modelBul, type BuildModel } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";

const yay = { type: "spring" as const, stiffness: 520, damping: 40 };
export type Efor = "low" | "medium" | "high" | "max";
export const EFORLAR: { id: Efor; ad: string; alt: string }[] = [
  { id: "low", ad: "Düşük", alt: "En hızlı ve en ucuz; basit sorular" },
  { id: "medium", ad: "Orta", alt: "Çoğu iş için dengeli (varsayılan)" },
  { id: "high", ad: "Yüksek", alt: "Zor problemlerde daha uzun düşünür" },
  { id: "max", ad: "En yüksek", alt: "En derin düşünme; en yavaş ve en pahalı" },
];
const FAVORI = "vayra-build-model-favori";

export function SaglayiciLogo({ m, boyut = 16, className }: { m: BuildModel; boyut?: number; className?: string }) {
  const s = SAGLAYICILAR[m.saglayici];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s.logo} alt="" aria-hidden width={boyut} height={boyut} className={cn("shrink-0 object-contain", s.tek && "build-logo-tek", className)} style={{ width: boyut, height: boyut }} />;
}

function Cubuk({ n, et }: { n: number; et: string }) {
  return (
    <span title={et} className="flex items-end gap-[2px]">
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn("w-[3px] rounded-full", i <= n ? "bg-white/75" : "bg-white/15")} style={{ height: 4 + i * 1.6 }} />)}
    </span>
  );
}

/** Modelin gerçek yetenekleri (Claude'un sunucu araçları ve belge okuması yalnız Claude'da). */
export function yetenekler(m: BuildModel): { id: string; ad: string; I: typeof Globe }[] {
  const c = m.saglayici === "anthropic";
  return [
    ...(m.gorsel ? [{ id: "gorsel", ad: "Görselleri okur", I: ImageIcon }] : []),
    ...(c ? [{ id: "pdf", ad: "PDF'i sayfa görüntüsüyle okur", I: FileText }, { id: "web", ad: "Web'de arar, sayfa okur", I: Globe }, { id: "kod", ad: "Kod çalıştırır", I: Terminal }] : []),
  ];
}
/** Ortalama bir sohbet mesajının (6 bin girdi, 1.500 çıktı token) kredisi. */
export const mesajKredisi = (m: BuildModel) => krediHesapla(m, { girdi: 6000, cikti: 1500 });

/**
 * Model seçici: çipe basınca açılan görselli liste. Arama, favoriler, önerilenler, sonra sağlayıcıya göre gruplar.
 * Her satırda gerçek logo, yetenek simgeleri ve (sohbette) ortalama mesaj kredisi. Bağlantısı olmayan model seçilebilir
 * ama "bağlı değil" yazar. efor verilirse üstte düşünme seviyesi. En altta "Özel": OpenRouter kimliği.
 */
export function ModelSecici({ deger, sec, baglantilar, dar, efor, setEfor, ayrinti }: { deger: string; sec: (id: string) => void; baglantilar?: Record<string, string | null>; dar?: boolean; efor?: Efor; setEfor?: (e: Efor) => void; ayrinti?: boolean }) {
  const [acik, setAcik] = useState(false);
  const [yukari, setYukari] = useState(true);
  const [yukseklik, setYukseklik] = useState(440);
  const [konum, setKonum] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const [ara, setAra] = useState("");
  const [ozel, setOzel] = useState("");
  const [favori, setFavori] = useState<string[]>([]);
  const kutu = useRef<HTMLDivElement>(null);
  const m = modelBul(deger);
  const ozelSecili = deger.startsWith("ozel:");
  const eforGoster = !!setEfor;

  useEffect(() => { try { setFavori(JSON.parse(localStorage.getItem(FAVORI) ?? "[]")); } catch { /* yok */ } }, []);
  useEffect(() => {
    if (!acik) return;
    const kapat = (e: MouseEvent) => { if (!kutu.current?.contains(e.target as Node)) setAcik(false); };
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("mousedown", kapat);
    document.addEventListener("keydown", tus);
    return () => { document.removeEventListener("mousedown", kapat); document.removeEventListener("keydown", tus); };
  }, [acik]);
  const favoriDegis = (id: string) => setFavori((l) => { const y = l.includes(id) ? l.filter((x) => x !== id) : [...l, id]; try { localStorage.setItem(FAVORI, JSON.stringify(y)); } catch { /* yok */ } return y; });

  const gruplar = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    const l = BUILD_MODELLERI.filter((x) => !q || `${x.ad} ${SAGLAYICILAR[x.saglayici].ad} ${x.alt}`.toLocaleLowerCase("tr").includes(q));
    const g: [string, BuildModel[]][] = [];
    const fav = l.filter((x) => favori.includes(x.id));
    if (!q && fav.length) g.push(["Favoriler", fav]);
    if (!q) g.push(["Önerilen", l.filter((x) => x.one && !favori.includes(x.id))]);
    const saglayicilar = [...new Set(l.map((x) => x.saglayici))];
    for (const s of saglayicilar) g.push([SAGLAYICILAR[s].ad, l.filter((x) => x.saglayici === s && (q || (!x.one && !favori.includes(x.id))))]);
    return g.filter(([, x]) => x.length);
  }, [ara, favori]);

  const bagli = (id: string) => !baglantilar || !!baglantilar[id];
  const eforAd = EFORLAR.find((x) => x.id === efor);

  return (
    <div ref={kutu} className="relative">
      <button type="button" data-model-cip onClick={() => {
        if (!acik && kutu.current) {
          // Menü, düğmenin üstünde mi altında mı daha çok yer varsa oraya açılır; liste yüksekliği kalan yere sığar.
          const r = kutu.current.getBoundingClientRect();
          const ust = r.top - 72, alt = window.innerHeight - r.bottom - 16;
          const yk = ust > alt;
          setYukari(yk);
          setYukseklik(Math.max(200, Math.min(440, (yk ? ust : alt) - (eforGoster ? 230 : 150))));
          // Ekrana sabitlenir: dar sütunda bile yandaki panelin altında kalmaz, sağ kenardan taşmaz.
          const w = Math.min(380, window.innerWidth - 32);
          setKonum({ left: Math.max(16, Math.min(r.left, window.innerWidth - w - 16)), ...(yk ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }) });
        }
        setAcik((a) => !a);
      }} title={ozelSecili ? deger.slice(5) : `${m.ad}${eforGoster && eforAd ? ` · düşünme ${eforAd.ad.toLocaleLowerCase("tr")}` : ""}`}
        className={cn("flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.06] text-[12.5px] text-white/80 transition-colors hover:bg-white/[0.1] hover:text-white", dar ? "w-8 justify-center" : "px-3 max-sm:w-8 max-sm:justify-center max-sm:px-0")}>
        {ozelSecili ? <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-white/70 to-white/20" /> : <SaglayiciLogo m={m} boyut={14} />}
        {!dar && <>
          <span className="max-w-[150px] truncate max-sm:hidden @max-[460px]:hidden">{ozelSecili ? deger.slice(5).split("/").pop() : m.ad}</span>
          {eforGoster && efor && efor !== "medium" && <span className="flex items-center gap-0.5 rounded-full bg-[#55d6fd]/[0.14] px-1.5 py-px text-[11px] text-[#8be6ff] max-sm:hidden"><Brain className="h-3 w-3" />{eforAd?.ad}</span>}
          <ChevronDown className={cn("h-3 w-3 transition-transform max-sm:hidden", acik && "rotate-180")} />
        </>}
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ opacity: 0, y: yukari ? 6 : -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: yukari ? 6 : -6, scale: 0.98 }} transition={yay}
            style={konum} className="fixed z-[80] w-[380px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[22px] bg-[#17181b] ring-1 ring-inset ring-white/[0.1]">
            {eforGoster && (
              <div className="border-b border-white/[0.06] px-3 pb-2.5 pt-3">
                <p className="mb-2 flex items-center gap-1.5 px-0.5 text-[12.5px] font-medium text-white/80"><Brain className="h-3.5 w-3.5 text-[#8be6ff]" />Düşünme seviyesi</p>
                <LayoutGroup id="efor-secici">
                  <div className="flex rounded-full bg-white/[0.07] p-0.5">
                    {EFORLAR.map((x) => (
                      <button key={x.id} type="button" title={x.alt} onClick={() => setEfor!(x.id)} className={cn("relative h-8 flex-1 whitespace-nowrap rounded-full px-1 text-[12px] font-medium transition-colors", efor === x.id ? "text-black" : "text-white/60 hover:text-white")}>
                        {efor === x.id && <motion.span layoutId="efor-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                        <span className="relative">{x.ad}</span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
                <p className="mt-1.5 px-0.5 text-[11.5px] text-white/50">{eforAd?.alt}</p>
              </div>
            )}
            <div className="border-b border-white/[0.06] p-2">
              <label className="flex h-9 items-center gap-2 rounded-[12px] bg-white/[0.05] px-3 text-white/45">
                <Search className="h-3.5 w-3.5" />
                <input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Model ara: Kimi, GPT, Gemini…" className="h-full flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />
              </label>
            </div>
            <div style={{ maxHeight: yukseklik }} className="overflow-y-auto p-1.5 [scrollbar-width:thin]">
              {gruplar.map(([baslik, l]) => (
                <div key={baslik} className="mb-1">
                  <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-[11.5px] font-medium text-white/40">{baslik === "Favoriler" && <Star className="h-3 w-3 fill-current text-[#8be6ff]" />}{baslik}</p>
                  {l.map((x) => {
                    const fav = favori.includes(x.id);
                    const kredi = mesajKredisi(x);
                    return (
                      <div key={x.id} className={cn("group/satir relative flex w-full items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]", deger === x.id && "bg-white/[0.07] ring-1 ring-inset ring-white/70")}>
                        <button type="button" onClick={() => { sec(x.id); setAcik(false); }} aria-label={`${x.ad} seç`} className="absolute inset-0 rounded-[14px]" />
                        <span className="pointer-events-none flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><SaglayiciLogo m={x} boyut={17} /></span>
                        <span className="pointer-events-none min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[13.5px] text-white">
                            <span className="truncate">{x.ad}</span>
                            {!bagli(x.id) && <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-px text-[10.5px] text-white/45">bağlı değil</span>}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            {yetenekler(x).map((y) => <span key={y.id} title={y.ad} className="pointer-events-auto text-white/45"><y.I className="h-3 w-3" /></span>)}
                            <span className="truncate text-[12px] text-white/45">{x.alt}</span>
                          </span>
                        </span>
                        {ayrinti && <span title={`Ortalama bir mesaj yaklaşık ${kredi} kredi`} className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] tabular-nums text-white/70"><KrediJeton boyut={10} />{kredi}</span>}
                        {!ayrinti && <span className="pointer-events-none flex shrink-0 flex-col items-end gap-1"><Cubuk n={x.zeka} et="Kod kalitesi" /><Cubuk n={x.hiz} et="Hız" /></span>}
                        <button type="button" onClick={() => favoriDegis(x.id)} aria-label={fav ? "Favorilerden çıkar" : "Favorilere ekle"} title={fav ? "Favorilerden çıkar" : "Favorilere ekle"}
                          className={cn("relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-opacity hover:bg-white/[0.08]", fav ? "text-[#8be6ff]" : "text-white/40 opacity-0 group-hover/satir:opacity-100 max-sm:opacity-100")}>
                          <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
              {!gruplar.length && <p className="px-3 py-6 text-center text-[13px] text-white/45">Bu adla bir model yok. Aşağıdan özel model kimliği girebilirsin.</p>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const v = ozel.trim(); if (/^[a-z0-9._-]+\/[a-z0-9._:-]+$/i.test(v)) { sec(`ozel:${v}`); setAcik(false); } }} className="border-t border-white/[0.06] p-2.5">
              <p className="mb-1.5 px-1 text-[12px] text-white/55">Özel model <span className="text-white/35">· OpenRouter kimliği, örn. qwen/qwen3.8-27b</span></p>
              <div className={cn("flex h-9 items-center gap-2 rounded-[12px] bg-white/[0.05] pl-3 pr-1", ozelSecili && "ring-1 ring-inset ring-white/70")}>
                <input value={ozel || (ozelSecili ? deger.slice(5) : "")} onChange={(e) => setOzel(e.target.value)} placeholder="sağlayıcı/model" className="h-full flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/30" />
                <button className="h-7 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-40" disabled={!/^[a-z0-9._-]+\/[a-z0-9._:-]+$/i.test(ozel.trim())}>Kullan</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
