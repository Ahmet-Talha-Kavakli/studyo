"use client";

import { motion } from "framer-motion";
import { AtSign, Plus, Sparkles, Upload, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useElements, type ElementTur } from "@/store/useElements";
import { TUR_META } from "../elementMeta";

/**
 * Elementler vitrini: mekanizmayı gerçek görsellerle gösterir (element kolajı → @istem çipi → aynı karakterli sahneler).
 * Görseller aynı karakter sayfasından alınmış açılardır; "Örnek" olarak işaretlidir.
 */
const E = "/gercek/element";
const KAEL = { gorseller: [`${E}/kael-portre.webp`, `${E}/kael-yan.webp`], sahneler: [[`${E}/kael-aksiyon.webp`, "Aksiyon sahnesi"], [`${E}/kael-cokme.webp`, "Diz çökmüş, kılıçlı"]] };

export function Vitrin({ onYeni, onGizle, ilk }: { onYeni: () => void; onGizle?: () => void; ilk?: boolean }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="relative isolate overflow-hidden rounded-[28px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "#0d0e10" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={KAEL.sahneler[0][0]} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover opacity-25 blur-2xl" />
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0d0e10_0%,rgba(13,14,16,0.9)_40%,rgba(13,14,16,0.6)_100%)]" />
      {onGizle && <button onClick={onGizle} aria-label="Tanıtımı gizle" title="Gizle" className="absolute right-3 top-3 z-[1] flex h-8 w-8 items-center justify-center rounded-full text-metin-3 hover:bg-white/[0.06] hover:text-metin"><X className="h-4 w-4" /></button>}
      <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-8 px-5 py-8 sm:px-10 lg:min-h-[420px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)]">
        <div>
          
          <h2 className="text-[38px] font-semibold leading-[1.04] tracking-[-0.045em] text-white max-sm:text-[30px]">Bir kez tanımla,<br /><span className="hero-isilti">her sahnede aynı kalsın.</span></h2>
          <p className="mt-3 max-w-[460px] text-[14px] leading-relaxed text-metin-2">Karakterini, mekânını, ürününü ya da stilini 1–4 görselle kaydet. İstemde <b className="rounded-[5px] bg-white/[0.1] px-1 font-semibold text-white">@ad</b> yazınca görseller referans olarak modele gider; görselde de videoda da aynı yüz, aynı ürün.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {([[Upload, "1–4 görsel ekle"], [AtSign, "Adlandır"], [Sparkles, "İstemde çağır"]] as const).map(([I, a]) => (
              <span key={a} className="flex h-9 items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.06)" }}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-aksan/15 text-aksan"><I className="h-3.5 w-3.5" /></span>{a}</span>
            ))}
            {ilk && <div className="mt-3 flex w-full flex-wrap gap-2.5"><button onClick={onYeni} className="flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-[0.97]"><Plus className="h-[18px] w-[18px]" />İlk elementini oluştur</button><span className="flex h-12 items-center gap-1.5 px-2 text-[13px] text-white/55"><Upload className="h-4 w-4" />ya da görseli sayfaya bırak</span></div>}
          </div>
        </div>
        {/* Mekanizma: element → istem → sahneler */}
        <div className="grid grid-cols-[132px_1fr] items-center gap-4 sm:grid-cols-[168px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] ring-1 ring-white/[0.1]">
            <div className="grid h-full grid-rows-[1.5fr_1fr] gap-[3px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {KAEL.gorseller.map((g) => <div key={g} className="relative overflow-hidden"><img src={g} alt="" className="absolute inset-0 h-full w-full object-cover" /></div>)}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10"><p className="text-[15px] font-semibold text-white">@Kael</p><p className="text-[11.5px] text-white/70">2 açı · Karakter</p></div>
          </div>
          <div className="min-w-0">
            <div className="relative mb-3 flex items-center">
              <svg aria-hidden className="absolute -left-4 top-1/2 h-6 w-8 -translate-y-1/2 text-white/60" viewBox="0 0 32 24">
                <motion.path d="M0 12 H26" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="none" animate={{ strokeDashoffset: [0, -16] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                <path d="M22 7 L28 12 L22 17" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <div className="cam-istemci ml-5 rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed max-sm:text-[12.5px] text-metin ring-1 ring-inset ring-white/[0.07]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-white/[0.14] py-0.5 pl-0.5 pr-2 align-middle text-[12.5px] font-medium text-white"><img src={KAEL.gorseller[0]} alt="" className="h-5 w-5 rounded-full object-cover" />Kael</span>
                fırtınalı kale surlarında kılıcını çekiyor, sinematik
              </div>
            </div>
            <div className="ml-5 grid max-w-[440px] grid-cols-2 gap-2.5">
              {KAEL.sahneler.map(([u, a], i) => (
                <motion.div key={u} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.12 }} className="relative aspect-[4/5] overflow-hidden rounded-[14px] ring-1 ring-white/[0.08]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt={a} className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] text-white/90 backdrop-blur-sm max-sm:hidden">{a}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Hazır elementler: tek tıkla kitaplığa eklenir (gerçek görseller, "Örnek" işaretli) ── */
export const HAZIR_ELEMENTLER: { ad: string; tur: ElementTur; gorseller: string[]; aciklama: string }[] = [
  { ad: "Kael", tur: "karakter", gorseller: [`${E}/kael-portre.webp`, `${E}/kael-yan.webp`], aciklama: "Gümüş dağınık saçlı genç şövalye; parlak gümüş zırh, mavi rün ışıkları, lacivert atkı." },
  { ad: "Nova", tur: "karakter", gorseller: [`${E}/nova-tam.webp`, `${E}/nova-on.webp`, `${E}/nova-yakin.webp`], aciklama: "Kısa koyu saçlı süper kahraman; siyah karbon zırh, göğüste camgöbeği enerji çekirdeği." },
  { ad: "Zara", tur: "karakter", gorseller: ["/gercek/arac/el-zara.webp"], aciklama: "Kızıl kahve dalgalı saçlı, çilli genç kadın; gümüş-lacivert bilimkurgu kıyafeti, yanardöner pelerin." },
  { ad: "Aria", tur: "karakter", gorseller: ["/gercek/gorsel/gorsel-karakter-Aria.webp"], aciklama: "Kıvırcık koyu saçlı, yeşil gözlü genç kadın; doğal makyaj." },
  { ad: "OrmanKulubesi", tur: "mekan", gorseller: ["/gercek/galeri/manzara5.webp"], aciklama: "Sisli çam ormanında ahşap kulübe, toprak patika, bacadan yükselen duman, sabah ışığı." },
  { ad: "NeonSokak", tur: "mekan", gorseller: ["/gercek/galeri/sinematik1.webp"], aciklama: "Yağmurlu gece, pembe-mavi neon tabelalı dar sokak, ıslak asfaltta yansımalar." },
  { ad: "UzayKaski", tur: "obje", gorseller: ["/gercek/3d/kask-poster.png", "/gercek/3d/kask-ham-poster.png"], aciklama: "Beyaz astronot kaskı, koyu lacivert vizör, camgöbeği şerit." },
  { ad: "GotikNoir", tur: "stil", gorseller: ["/gercek/moodboard/mood-h1.webp", "/gercek/moodboard/mb-iyi-0.webp", "/gercek/moodboard/mb-iyi-1.webp"], aciklama: "Karanlık gotik moda çekimi; siyah uçuşan kumaş, sert tek yönlü ışık, desatüre soğuk ton." },
];

export function HazirElementler({ onEklendi }: { onEklendi?: (id: string) => void }) {
  const elementler = useElements((s) => s.elementler);
  const l = HAZIR_ELEMENTLER.filter((h) => !elementler.some((e) => e.ad.toLocaleLowerCase("tr") === h.ad.toLocaleLowerCase("tr")));
  if (!l.length) return null;
  const ekle = (h: (typeof HAZIR_ELEMENTLER)[number]) => {
    const r = useElements.getState().ekle({ ...h, ornek: true });
    if (r.hata || !r.id) { toast.error("Element eklenemedi", { description: r.hata ? `${r.hata}.` : "Yeniden dene." }); return; }
    toast.success(`@${h.ad} kitaplığına eklendi`, { description: `İstemde @${h.ad} yazarak kullanabilirsin.` });
    onEklendi?.(r.id);
  };
  return (
    <section className="overflow-hidden rounded-[24px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">Hazır elementler<span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-medium text-white/60">{l.length} örnek</span></h2>
          <p className="mt-0.5 text-[12.5px] text-white/55">Tek tıkla kitaplığına ekle, sonra kendine göre düzenle.</p>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto p-3 [scrollbar-width:none]">
        {l.map((h) => {
          const m = TUR_META[h.tur]; const I = m.ikon;
          return (
            <motion.button key={h.ad} onClick={() => ekle(h)} whileHover={{ y: -3 }} title={`@${h.ad} ekle`}
              className="group relative aspect-[3/4] w-[168px] shrink-0 overflow-hidden rounded-[16px] text-left ring-1 ring-white/[0.07] hover:ring-white/[0.18] max-sm:w-[140px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={h.gorseller[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {h.gorseller.length > 1 && <span className="absolute right-2 top-2 rounded-full bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white/90 backdrop-blur-sm">{h.gorseller.length} açı</span>}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-10">
                <p className="truncate text-[13.5px] font-semibold text-white">@{h.ad}</p>
                <p className="flex items-center gap-1 text-[11px]" style={{ color: m.hex }}><I className="h-3 w-3" />{m.ad}</p>
              </div>
              <span className="absolute left-1/2 top-1/2 flex h-9 -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white px-3 text-[12.5px] font-semibold text-[#111] opacity-0 transition-opacity group-hover:opacity-100"><Plus className="h-3.5 w-3.5" />Kitaplığa ekle</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
