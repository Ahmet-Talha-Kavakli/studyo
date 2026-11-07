"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Copy, Trash2, ShieldCheck, Sparkles, Wand2, Layers, Plus, X, Upload, Loader2, ArrowUp, ScanFace, Images, UserRound, Smile, PersonStanding, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { useElements } from "@/store/useElements";
import { useInfluencer, type Influencer } from "@/store/useInfluencer";
import { dosyaYukle } from "@/components/montaj/ortak";
import { ozellikKarolari, NISLER, TONLAR } from "./veri";

/** Tutarlılık puanı: portre + referans çeşitliliği (en çok 12). */
export const tutarlilik = (k: Influencer) => Math.min(100, 40 + k.referanslar.length * 6 + (k.ornek ? 0 : 6));

const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;
const YUZ = { background: "rgba(255,255,255,0.025)" };
const KART = "overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]";

function Kart({ baslik, ikon: I, sag, children, className, gecikme = 0 }: { baslik: string; ikon: typeof Layers; sag?: React.ReactNode; children: React.ReactNode; className?: string; gecikme?: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: gecikme }} className={cn(KART, "flex flex-col", className)} style={YUZ}>
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 py-3.5">
        <I className="h-4 w-4 text-metin-2" /><h3 className="flex-1 text-[14.5px] font-semibold text-metin">{baslik}</h3>{sag}
      </div>
      {children}
    </motion.section>
  );
}

export function KimlikKarti({ k, icerik = 0, onDuzenle, onCogalt, onSil, onTekCumle, onAciSeti, aciMaliyet, duzenMaliyet, onGit }: {
  k: Influencer; icerik?: number; onDuzenle: () => void; onCogalt: () => void; onSil: () => void; onGit?: (h: "foto" | "video" | "profil") => void;
  onTekCumle: (metin: string) => void; onAciSeti: () => void; aciMaliyet: number; duzenMaliyet: number;
}) {
  const guncelle = useInfluencer((s) => s.guncelle);
  const [metin, setMetin] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const elVar = useElements((s) => !!k.elementId && s.elementler.some((e) => e.id === k.elementId));
  const puan = tutarlilik(k);
  const tum = [k.portre, ...k.referanslar];
  const karolar = ozellikKarolari(k.ozellikler);
  const gonder = () => { if (metin.trim()) { onTekCumle(metin.trim()); setMetin(""); } };

  const refYaz = (refler: string[]) => {
    guncelle(k.id, { referanslar: refler });
    if (k.elementId && elVar) useElements.getState().guncelle(k.elementId, { gorseller: [k.portre, ...refler].slice(0, 8) });
  };
  const refEkle = async (d: File) => {
    if (!d.type.startsWith("image/")) return;
    setYukleniyor(true);
    try { refYaz([...k.referanslar, await dosyaYukle(d, d.type)].slice(0, 12)); toast.success("Referans eklendi"); }
    catch { mesaj.yuklenemedi("Referans görseli"); } finally { setYukleniyor(false); }
  };

  return (
    <div className="space-y-3">
      {/* Kimlik: büyük portre + ad, biyografi, sayılar */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className={cn(KART, "relative")} style={YUZ}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={k.portre} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.12] blur-3xl" />
        <div className="relative grid gap-6 p-4 sm:p-5 md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-black ring-1 ring-white/10 max-md:aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={k.portre} alt={k.ad} className="absolute inset-0 h-full w-full object-cover object-[50%_25%]" />
          </div>
          <div className="flex min-w-0 flex-col py-1">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[32px] font-semibold leading-tight tracking-[-0.03em] text-metin max-sm:text-[26px]">{k.ad}</h2>
                <p className="text-[15px] text-metin-2">@{k.kullaniciAdi}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={onDuzenle} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.12] active:scale-95"><Pencil className="h-4 w-4" />Düzenle</button>
                <button onClick={onCogalt} aria-label="Çoğalt" title="Çoğalt, yeni karakter türet" className="flex h-10 w-10 items-center justify-center rounded-full text-metin-2 ring-1 ring-inset ring-white/[0.12] transition hover:text-metin active:scale-90"><Copy className="h-4 w-4" /></button>
                <button onClick={onSil} aria-label="Karakteri sil" title="Karakteri sil" className="flex h-10 w-10 items-center justify-center rounded-full text-metin-2 ring-1 ring-inset ring-white/[0.12] transition hover:text-rose-300 active:scale-90"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[NISLER.find((n) => n.id === k.nis)?.ad, `${TONLAR.find((t) => t.id === k.ton)?.ad ?? ""} ton`, k.kaynak === "foto" ? "Fotoğraflardan" : k.kaynak === "sablon" ? "Şablondan" : "Tasarlandı"].filter(Boolean).map((x, i) => (
                <span key={x} className={cn("rounded-full px-3 py-1 text-[12.5px] ring-1 ring-inset ring-white/[0.1]", i === 0 ? "font-medium text-metin" : "text-metin-2")}>{x}</span>
              ))}
            </div>
            {k.biyografi ? <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-metin">{k.biyografi}</p>
              : <button onClick={onDuzenle} className="mt-4 flex max-w-[520px] items-center gap-3 rounded-[16px] p-3 text-left ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.055]" style={YUZ}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><Pencil className="h-4 w-4" /></span><span className="min-w-0 leading-tight"><span className="block text-[14px] font-semibold text-metin">Biyografi ekle</span><span className="block text-[12.5px] text-metin-3">Gönderi metinleri bu sesle yazılır</span></span></button>}
            {onGit && (
              <div className="mt-4 flex flex-wrap gap-2">
                {([["foto", "Fotoğraf üret", Images], ["video", "Video üret", Sparkles], ["profil", "Profili gör", ScanFace]] as const).map(([h, a, I], i) => (
                  <button key={h} onClick={() => onGit(h)} className={cn("flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition active:scale-95", i === 0 ? "bg-white font-semibold text-black" : "bg-white/[0.085] text-metin hover:bg-white/[0.12]")}><I className="h-4 w-4" />{a}</button>
                ))}
              </div>
            )}

            <dl className="mt-auto grid grid-cols-2 gap-2 pt-6 lg:grid-cols-4">
              <div className="rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-metin-3"><ShieldCheck className="h-3.5 w-3.5" />Tutarlılık</dt>
                <dd className="mt-1 text-[22px] font-semibold tabular-nums text-metin">yüzde {puan}</dd>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} animate={{ width: `${puan}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="h-full rounded-full bg-white" /></div>
              </div>
              <div className="rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-metin-3"><Layers className="h-3.5 w-3.5" />Referans</dt>
                <dd className="mt-1 text-[22px] font-semibold tabular-nums text-metin">{tum.length}<span className="text-[13px] font-normal text-metin-3"> / 12</span></dd>
                <p className="mt-1 text-[11.5px] text-metin-3">{puan >= 85 ? "Güçlü set" : "Açı ekledikçe güçlenir"}</p>
              </div>
              <div className="rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-metin-3"><Images className="h-3.5 w-3.5" />Üretilen</dt>
                <dd className="mt-1 text-[22px] font-semibold tabular-nums text-metin">{icerik}</dd>
                <p className="mt-1 text-[11.5px] text-metin-3">fotoğraf ve video</p>
              </div>
              <div className="rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.07]" style={YUZ}>
                <dt className="flex items-center gap-1.5 text-[12.5px] text-metin-3"><ScanFace className="h-3.5 w-3.5" />Element</dt>
                {elVar && k.elementAd ? (
                  <dd className="mt-1.5"><button onClick={() => { void mesaj.kopyala(`@${k.elementAd}`, `@${k.elementAd}`); }} title="Kopyala, diğer stüdyolarda istemine yaz" className="flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[14px] font-semibold text-metin ring-1 ring-inset ring-white/[0.14] transition hover:ring-white/30 active:scale-95"><span className="truncate">@{k.elementAd}</span><Copy className="h-3.5 w-3.5 shrink-0 text-metin-3" /></button></dd>
                ) : <dd className="mt-1.5 text-[13px] text-metin-3">Bağlı değil</dd>}
                <p className="mt-1.5 text-[11.5px] text-metin-3">Görsel, Video, UGC, Fans</p>
              </div>
            </dl>
          </div>
        </div>
      </motion.section>

      {/* Görünüş: her özellik kendi görseliyle */}
      <Kart baslik="Görünüş" ikon={ScanFace} gecikme={0.05} sag={<button onClick={onDuzenle} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.1] transition hover:text-metin active:scale-95"><Pencil className="h-3.5 w-3.5" />Değiştir</button>}>
        <div className="grid gap-2.5 p-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(132px, calc(50% - 6px)), 1fr))" }}>
          {karolar.map((o, i) => (
            <motion.div key={`${o.ad}${o.deger}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.08 + Math.min(i, 10) * 0.03 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-[14px] bg-black outline outline-1 -outline-offset-1 outline-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
              <span className="absolute inset-x-3 bottom-2.5">
                <span className="block text-[11.5px] text-white/70">{o.ad}</span>
                <span className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-white">{o.renk && <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/60" style={{ background: o.renk }} />}{o.deger}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </Kart>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Referans sayfası + açı seti */}
        <Kart baslik="Referans sayfası" ikon={Layers} gecikme={0.1} sag={<span className="rounded-full px-2.5 py-0.5 text-[12px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.08]">{tum.length} görsel</span>}>
          <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
            <AnimatePresence initial={false}>
              {tum.slice(0, 11).map((g, i) => (
                <motion.div key={`${g}${i}`} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={YAY}
                  className={cn("group relative aspect-[3/4] overflow-hidden rounded-[12px] bg-black", i === 0 ? "outline outline-2 -outline-offset-2 outline-white/70" : "outline outline-1 -outline-offset-1 outline-white/10")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pb-1 pt-3 text-center text-[11px] font-medium text-white">Portre</span>}
                  {i > 0 && <button onClick={() => refYaz(k.referanslar.filter((_, j) => j !== i - 1))} aria-label="Referansı kaldır" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100 active:scale-90 max-sm:opacity-100"><X className="h-3.5 w-3.5" /></button>}
                </motion.div>
              ))}
            </AnimatePresence>
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] bg-white/[0.065] ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.09] text-[12px] text-metin-2 transition hover:border-white/35 hover:text-metin">
              {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Ekle
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void refEkle(d); }} />
            </label>
            {/* Eksik açılar: boş alan yerine ne eklenmesi gerektiğini gösteren yuvalar */}
            {[["Önden", ScanFace], ["Yandan", UserRound], ["Gülümserken", Smile], ["Tam boy", PersonStanding], ["Farklı ışık", Sun]].slice(0, Math.max(0, (Math.min(tum.length, 11) + 1 <= 6 ? 6 : 12) - (Math.min(tum.length, 11) + 1))).map(([ad, I]) => {
              const Ik = I as typeof ScanFace;
              return (
                <label key={ad as string} className="group relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-end overflow-hidden rounded-[12px] bg-black px-1 pb-2 text-center ring-1 ring-inset ring-white/[0.1] transition hover:ring-white/35">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={k.portre} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale transition duration-300 group-hover:opacity-45" style={{ objectPosition: ({ Önden: "50% 20%", Yandan: "80% 20%", Gülümserken: "50% 10%", "Tam boy": "50% 60%", "Farklı ışık": "20% 30%" } as Record<string, string>)[ad as string] }} />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="relative mb-auto mt-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.14] text-white backdrop-blur transition group-hover:bg-white group-hover:text-black"><Plus className="h-4 w-4" /></span>
                  <span className="relative flex items-center gap-1 text-[11.5px] font-semibold leading-tight text-white"><Ik className="h-3 w-3" />{ad as string}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void refEkle(d); }} />
                </label>
              );
            })}
          </div>
          <button onClick={onAciSeti} className="group mt-auto flex items-center gap-3 border-t border-white/[0.06] px-4 py-3 text-left transition hover:bg-white/[0.025]">
            <span className="grid h-12 w-[72px] shrink-0 grid-cols-3 gap-0.5 overflow-hidden rounded-[10px]">
              {[0, 1, 2].map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={k.portre} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" style={{ objectPosition: ["20% 30%", "50% 30%", "80% 30%"][i] }} />
              ))}
            </span>
            <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-metin">Açı seti üret</span><span className="block truncate text-[12.5px] text-metin-3">Önden, üç çeyrek, profil ve tam boy</span></span>
            <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black transition group-active:scale-95"><Sparkles className="h-3.5 w-3.5" /><span className="flex items-center gap-0.5 tabular-nums"><KrediYildiz className="h-3 w-3" />{aciMaliyet}</span></span>
          </button>
        </Kart>

        {/* Tek cümleyle düzenle */}
        <Kart baslik="Tek cümleyle düzenle" ikon={Wand2} gecikme={0.14}>
          <div className="flex flex-1 flex-col p-4">
            <p className="text-[13px] leading-relaxed text-metin-2">Portrede yalnız söylediğin değişir; yüz, ifade ve kadraj aynı kalır. Sonuç galeriye düşer, beğenirsen kartındaki Portre yap ile kimliğe uygula.</p>
            <div className="mt-3 flex items-center gap-2 rounded-[16px] p-1.5 pl-4 ring-1 ring-inset ring-white/[0.1] transition focus-within:ring-white/25" style={{ background: "rgba(255,255,255,0.03)" }}>
              <input value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 140))} onKeyDown={(e) => { if (e.key === "Enter") gonder(); }}
                placeholder="Örneğin: saçını omuz hizasında kestir" className="h-10 min-w-0 flex-1 bg-transparent text-[14.5px] text-metin outline-none placeholder:text-metin-2" />
              <button onClick={gonder} disabled={!metin.trim()} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white pl-3.5 pr-3 text-[13px] font-semibold text-black transition active:scale-95 disabled:opacity-40">Düzenle<span className="flex items-center gap-0.5 tabular-nums"><KrediYildiz className="h-3 w-3" />{duzenMaliyet}</span><ArrowUp className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Saçını kısa kestir", "Gözlük ekle", "Daha bronz ten", "Sakal ekle", "Saçı sarıya boya", "Çil ekle"].map((o) => <button key={o} onClick={() => setMetin(o)} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-metin-2 ring-1 ring-inset ring-white/[0.09] transition hover:text-metin hover:ring-white/20 active:scale-95"><Plus className="h-3.5 w-3.5" />{o}</button>)}
            </div>
          </div>
        </Kart>
      </div>
    </div>
  );
}
