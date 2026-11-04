"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ImageIcon, Lock, RotateCcw, Sparkles } from "lucide-react";
import { TURLER, turModelleri } from "@/components/anasayfa/Komut";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { aileGorselleri } from "@/lib/modelGorsel";
import type { KatalogModel } from "@/lib/modelKatalogu";
import { useAyarTercih, useGorunurluk } from "@/store/useAyarTercih";
import { Anahtar, Grup, Satir, Sayfa, Secici, Segment, akis, dugme, kaydedildi, yay, type SeciciSecenek } from "@/components/ayarlar/ui";
import { cn } from "@/lib/utils";

const tur = (id: string) => TURLER.find((t) => t.id === id)!;
const ORANLAR = [["1:1", 1, 1], ["4:5", 4, 5], ["16:9", 16, 9], ["9:16", 9, 16]] as const;

/** Oran simgesi: seçeneğin şeklini küçük bir çerçeveyle gösterir. */
function OranSekli({ w, h }: { w: number; h: number }) {
  const o = 13 / Math.max(w, h);
  return <span className="inline-block rounded-[2.5px] border-[1.5px] border-current" style={{ width: Math.round(w * o), height: Math.round(h * o) }} />;
}
function AdetSekli({ n }: { n: number }) {
  return <span className="grid grid-cols-2 gap-[1.5px]">{Array.from({ length: 4 }, (_, i) => <span key={i} className={cn("h-[5px] w-[5px] rounded-[1.5px]", i < n ? "bg-current" : "bg-current opacity-20")} />)}</span>;
}

function modelSecenek(m: KatalogModel): SeciciSecenek<string> {
  const kapak = m.kapak ?? aileGorselleri(m.aile, m.tur).liste[0];
  return {
    deger: m.ad, ad: m.ad, alt: m.ozet,
    on: (
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[9px] bg-white/[0.06]">
        {kapak && <img src={kapak} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-[5px] bg-black/70"><ModelLogo ad={m.ad} boyut={10} /></span>
      </span>
    ),
    sag: <span className="flex shrink-0 items-center gap-1 text-[12px] tabular-nums text-white/45"><KrediJeton boyut={11} />{m.kredi}</span>,
  };
}
const dugmeOnu = (ad: string) => <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-white/[0.08]"><ModelLogo ad={ad} boyut={14} /></span>;

export default function UretimAyarlari() {
  const u = useAyarTercih((s) => s.uretim);
  const gizlilik = useGorunurluk();
  const ayarla = useAyarTercih((s) => s.ayarla);
  const sifirla = useAyarTercih((s) => s.uretimSifirla);
  const set = (p: Partial<typeof u>) => ayarla("uretim", p);

  const gorsel = useMemo(() => turModelleri(tur("gorsel"), 8), []);
  const video = useMemo(() => turModelleri(tur("video"), 8), []);
  const muzik = useMemo(() => turModelleri(tur("muzik"), 6), []);
  const gM = gorsel.find((m) => m.ad === u.gorselModel) ?? gorsel[0];
  const vM = video.find((m) => m.ad === u.videoModel) ?? video[0];
  const mM = muzik.find((m) => m.ad === u.muzikModel) ?? muzik[0];

  return (
    <Sayfa baslik="Üretim varsayılanları" aciklama="Stüdyolar bu ayarlarla açılır. İstediğin an stüdyoda değiştirebilirsin; burası yalnız başlangıç noktası."
      yan={<Onizleme model={gM} oran={u.oran} adet={u.adet} gelistir={u.gelistir} />}>

      <Grup baslik="Görsel" aciklama="Görsel stüdyosu ve hızlı üret kutusu." sag={<Link href="/panel/gorsel" className={cn(dugme.hayalet, "h-8 text-[13px]")}>Stüdyoyu aç<ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
        <Satir id="gorsel-model" ad="Model" alt="Her yeni görsel bu modelle başlar.">
          {gM && <Secici deger={gM.ad} secenekler={gorsel.map(modelSecenek)} onSec={(v) => set({ gorselModel: v })} genislik={330} baslik="Görsel modelleri" />}
        </Satir>
        <Satir id="oran" ad="En-boy oranı">
          <Segment deger={u.oran} onSec={(v) => set({ oran: v })} secenekler={ORANLAR.map(([d, w, h]) => ({ deger: d, ad: d, ikon: <OranSekli w={w} h={h} /> }))} />
        </Satir>
        <Satir id="adet" ad="Bir seferde" alt="Tek istemden kaç görsel üretilsin. Her görsel ayrı ücretlenir.">
          <Segment deger={String(u.adet)} onSec={(v) => set({ adet: +v })} secenekler={[1, 2, 4].map((n) => ({ deger: String(n), ad: n, ikon: <AdetSekli n={n} /> }))} />
        </Satir>
        <Satir id="gelistir" ad="İstemi geliştir" alt="Kısa istemleri göndermeden önce ışık, kadraj ve ayrıntıyla zenginleştirir.">
          <Anahtar acik={u.gelistir} onDegis={(v) => set({ gelistir: v })} etiket="İstemi geliştir" />
        </Satir>
      </Grup>

      <Grup baslik="Video" sag={<Link href="/panel/video" className={cn(dugme.hayalet, "h-8 text-[13px]")}>Stüdyoyu aç<ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
        <Satir id="video-model" ad="Model" alt={vM ? vM.bedel : undefined}>
          {vM && <Secici deger={vM.ad} secenekler={video.map(modelSecenek)} onSec={(v) => set({ videoModel: v })} genislik={330} baslik="Video modelleri" />}
        </Satir>
        <Satir id="sure" ad="Süre" alt="Uzun video daha çok kredi harcar.">
          <Segment deger={u.sure} onSec={(v) => set({ sure: v })} secenekler={["5", "8", "10"].map((s) => ({ deger: s, ad: `${s} sn` }))} />
        </Satir>
        <Satir id="cozunurluk" ad="Çözünürlük">
          <Segment deger={u.cozunurluk} onSec={(v) => set({ cozunurluk: v })} secenekler={["720p", "1080p", "4K"].map((s) => ({ deger: s, ad: s }))} />
        </Satir>
        <Satir id="video-ses" ad="Sesli üret" alt="Destekleyen modellerde ortam sesi ve diyalog eklenir.">
          <Anahtar acik={u.ses} onDegis={(v) => set({ ses: v })} etiket="Sesli üret" />
        </Satir>
      </Grup>

      <Grup baslik="Müzik">
        <Satir id="muzik-model" ad="Model">
          {mM && <Secici deger={mM.ad} secenekler={muzik.map(modelSecenek)} onSec={(v) => set({ muzikModel: v })} genislik={330} baslik="Müzik modelleri" />}
        </Satir>
      </Grup>

      <Grup baslik="Tüm stüdyolar">
        <Satir id="hatirla" ad="Son ayarları hatırla" alt="Açıkken her stüdyo, en son bıraktığın ayarlarla açılır. Kapalıyken hep buradaki varsayılanlarla.">
          <Anahtar acik={u.hatirla} onDegis={(v) => set({ hatirla: v })} etiket="Son ayarları hatırla" />
        </Satir>
        <Satir ad="Yeni üretimlerin görünürlüğü" alt="Gizlilik ve yayın bölümünden değiştirilir.">
          <Link href="/panel/ayarlar/gizlilik#gorunurluk" className={dugme.ikincil}><Lock className="h-3.5 w-3.5" />{{ ozel: "Özel", baglanti: "Bağlantıyla", acik: "Herkese açık" }[gizlilik]}</Link>
        </Satir>
      </Grup>

      <motion.div variants={{ gizli: { opacity: 0 }, acik: { opacity: 1 } }}>
        <button type="button" onClick={() => { sifirla(); kaydedildi(); }} className={dugme.hayalet}><RotateCcw className="h-3.5 w-3.5" />Varsayılanlara dön</button>
      </motion.div>
    </Sayfa>
  );
}

/**
 * Canlı önizleme: görsel stüdyosunun bu ayarlarla nasıl açılacağı.
 * Görseller seçili modelin gerçek örnek çıktılarıdır; oran ve adet değiştikçe yerleşim yaylanarak değişir.
 */
function Onizleme({ model, oran, adet, gelistir }: { model?: KatalogModel; oran: string; adet: number; gelistir: boolean }) {
  const [w, h] = oran.split(":").map(Number);
  const ornek = model ? [...new Set([...(model.kapak ? [model.kapak] : []), ...aileGorselleri(model.aile, model.tur).liste])] : [];
  const liste = Array.from({ length: adet }, (_, i) => ornek[i % Math.max(1, ornek.length)]);
  const yatay = w >= h;
  return (
    <div className="overflow-hidden rounded-[24px] bg-[#111113] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center justify-between px-5 pt-4 text-[13px]">
        <span className="text-white/50">Görsel stüdyosu bu ayarlarla açılır</span>
        {model && <span className="flex items-center gap-1 tabular-nums text-white/50"><KrediJeton boyut={11} />{model.kredi * adet} kredi</span>}
      </div>
      <div className="relative flex h-[210px] items-center justify-center gap-2.5 overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,rgba(85,214,253,0.07),transparent_60%)] px-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {liste.map((src, i) => (
            <motion.div key={`${model?.ad}-${i}`} initial={{ opacity: 0, scale: 0.85, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
              transition={{ ...yay, delay: i * 0.04 }} style={{ aspectRatio: `${w}/${h}` }}
              className={cn("relative overflow-hidden rounded-[12px] bg-white/[0.04] ring-1 ring-white/10",
                yatay ? (adet === 4 ? "w-[22%]" : adet === 2 ? "w-[38%]" : "w-[52%]") : (adet === 4 ? "h-[62%]" : "h-[82%]"))}>
              {src && <img src={src} alt="" className="h-full w-full object-cover" />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] px-4 py-3">
        {model && <motion.span layout className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] pl-1 pr-3 text-[12.5px] font-medium text-white">{dugmeOnu(model.ad)}{model.ad}</motion.span>}
        <Cip k={oran}><OranSekli w={w} h={h} />{oran}</Cip>
        <Cip k={`a${adet}`}><ImageIcon className="h-3.5 w-3.5" />{adet} görsel</Cip>
        <AnimatePresence>{gelistir && <motion.span layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex h-8 items-center gap-1.5 rounded-full bg-[#55d6fd]/12 px-3 text-[12.5px] font-medium text-[#55d6fd]"><Sparkles className="h-3.5 w-3.5" />İstemi geliştir</motion.span>}</AnimatePresence>
      </div>
    </div>
  );
}
function Cip({ k, children }: { k: string; children: React.ReactNode }) {
  return <motion.span layout key={k} initial={{ scale: 0.88, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, ease: akis }} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium tabular-nums text-white">{children}</motion.span>;
}

