"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Box, Film, ImageIcon, Mic, Music, Trash2 } from "lucide-react";
import { useProjeler } from "@/store/useProjeler";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { useAyarTercih } from "@/store/useAyarTercih";
import type { ModelTur } from "@/lib/catalog";
import { Anahtar, Grup, Pencere, Satir, Sayfa, Segment, dugme, akis } from "@/components/ayarlar/ui";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Plan başına depolama alanı (GB). */
const KOTA: Record<string, number> = { baslangic: 5, arti: 50, ultra: 200, kurumsal: 1000 };
/** Boyutu kaydedilmemiş üretimler için türüne göre ortalama dosya boyutu (MB). */
const ORTALAMA: Record<ModelTur, number> = { gorsel: 1.6, video: 18, ses: 2.5, muzik: 6, "3d": 12 };
const TUR: { id: ModelTur; ad: string; renk: string; ikon: typeof Film }[] = [
  { id: "video", ad: "Video", renk: "#55d6fd", ikon: Film },
  { id: "gorsel", ad: "Görsel", renk: "#a78bfa", ikon: ImageIcon },
  { id: "muzik", ad: "Müzik", renk: "#f472b6", ikon: Music },
  { id: "ses", ad: "Ses", renk: "#fbbf24", ikon: Mic },
  { id: "3d", ad: "3D", renk: "#34d399", ikon: Box },
];
const boyut = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} GB` : `${Math.max(0, mb).toLocaleString("tr-TR", { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`);

export default function DepolamaAyarlari() {
  const uretimler = useProjeler((s) => s.uretimler);
  const cop = useProjeler((s) => s.cop);
  const copuBosalt = useProjeler((s) => s.copuBosalt);
  const plan = useAuth((s) => s.kullanici?.plan ?? "baslangic");
  const d = useAyarTercih((s) => s.depolama);
  const ayarla = useAyarTercih((s) => s.ayarla);
  const set = (p: Partial<typeof d>) => ayarla("depolama", p);
  const [bosaltOnay, setBosaltOnay] = useState(false);

  const mbOf = (u: { tur: ModelTur; meta?: { boyutKb?: number } }) => (u.meta?.boyutKb ? u.meta.boyutKb / 1024 : ORTALAMA[u.tur] ?? 2);
  const dagilim = useMemo(() => TUR.map((t) => {
    const l = uretimler.filter((u) => u.tur === t.id && u.durum === "tamam");
    return { ...t, adet: l.length, mb: l.reduce((a, u) => a + mbOf(u), 0) };
  }), [uretimler]);
  const copMb = cop.reduce((a, u) => a + mbOf(u), 0);
  const toplamMb = dagilim.reduce((a, x) => a + x.mb, 0) + copMb;
  const kotaMb = (KOTA[plan] ?? 5) * 1024;
  const oran = Math.min(1, toplamMb / kotaMb);

  const ozet = (
    <div className="rounded-[20px] bg-[#121214] p-5 ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13.5px] text-white/50">Kullanılan alan</p>
          <p className="mt-1 text-[30px] font-semibold tracking-[-0.03em] tabular-nums text-white">{boyut(toplamMb)}<span className="ml-2 text-[16px] font-medium text-white/40">/ {KOTA[plan] ?? 5} GB</span></p>
        </div>
        <Link href="/panel/ayarlar/abonelik" className={cn(dugme.hayalet, "h-8 text-[13px]")}>{PLAN_ADI[plan as keyof typeof PLAN_ADI]} planı<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      {/* Türlere bölünmüş tek çubuk */}
      <div className="mt-5 flex h-3 gap-[3px] overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={`Alanın yüzde ${Math.round(oran * 100)} kadarı dolu`}>
        {[...dagilim, { id: "cop", renk: "rgba(255,255,255,0.3)", mb: copMb }].filter((x) => x.mb > 0).map((x, i) => (
          <motion.span key={x.id} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.7, ease: akis }}
            className="h-full origin-left first:rounded-l-full" style={{ width: `${Math.max(0.6, (x.mb / kotaMb) * 100)}%`, background: x.renk }} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {dagilim.map((x) => (
          <span key={x.id} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.renk }} />
            <span className="text-white/75">{x.ad}</span>
            <span className="tabular-nums text-white/40">{boyut(x.mb)}</span>
          </span>
        ))}
        {copMb > 0 && <span className="flex items-center gap-2 text-[13px]"><span className="h-2.5 w-2.5 rounded-full bg-white/30" /><span className="text-white/75">Çöp kutusu</span><span className="tabular-nums text-white/40">{boyut(copMb)}</span></span>}
      </div>
      <p className="mt-4 text-[12.5px] text-white/35">Boyutu kaydedilmemiş eski üretimler, türünün ortalamasıyla hesaplanır.</p>
    </div>
  );

  return (
    <Sayfa baslik="Depolama" aciklama="Üretimlerinin kapladığı alan, çöp kutusu ve indirme tercihleri." yan={ozet}>
      <Grup id="alan" baslik="Türlere göre">
        {dagilim.map((x) => (
          <Satir key={x.id} on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: `${x.renk}1f`, color: x.renk }}><x.ikon className="h-[17px] w-[17px]" /></span>}
            ad={x.ad} alt={x.adet ? `${x.adet.toLocaleString("tr-TR")} dosya` : "Henüz yok"}>
            <span className="text-[14px] tabular-nums text-white/70">{boyut(x.mb)}</span>
          </Satir>
        ))}
      </Grup>

      <Grup id="cop" baslik="Çöp kutusu" aciklama="Kitaplıktan sildiklerin önce buraya gelir; süre dolunca kalıcı olarak silinir.">
        <Satir ad="Kalıcı silme süresi">
          <Segment deger={String(d.copGun)} onSec={(v) => set({ copGun: +v as 7 | 30 | 90 })} secenekler={[7, 30, 90].map((n) => ({ deger: String(n), ad: `${n} gün` }))} />
        </Satir>
        <Satir ad="Çöp kutusunu boşalt" alt={cop.length ? `${cop.length} dosya, ${boyut(copMb)}` : "Çöp kutusu boş"}>
          <Link href="/panel/kitaplik?k=cop" className={dugme.hayalet}>Aç</Link>
          <button type="button" disabled={!cop.length} onClick={() => setBosaltOnay(true)} className={dugme.tehlike}><Trash2 className="h-3.5 w-3.5" />Boşalt</button>
        </Satir>
      </Grup>

      <Grup baslik="İndirme">
        <Satir id="indirme" ad="Görsel biçimi" alt="PNG kayıpsızdır; JPG ve WebP daha küçük dosya verir.">
          <Segment deger={d.bicim} onSec={(v) => set({ bicim: v })} secenekler={[{ deger: "png", ad: "PNG" }, { deger: "jpg", ad: "JPG" }, { deger: "webp", ad: "WebP" }]} />
        </Satir>
        <Satir ad="Toplu indirmede klasörler" alt="Birden çok dosyayı ZIP olarak indirirken klasör düzeni.">
          <Segment deger={d.klasor} onSec={(v) => set({ klasor: v })} kucuk secenekler={[{ deger: "tur", ad: "Türe göre" }, { deger: "tarih", ad: "Tarihe göre" }, { deger: "proje", ad: "Projeye göre" }]} />
        </Satir>
        <Satir id="oto-indir" ad="Bitince otomatik indir" alt="Her üretim tamamlandığında dosya bilgisayarına iner.">
          <Anahtar acik={d.otoIndir} onDegis={(v) => set({ otoIndir: v })} etiket="Bitince otomatik indir" />
        </Satir>
      </Grup>

      <Pencere acik={bosaltOnay} onKapat={() => setBosaltOnay(false)} baslik="Çöp kutusunu boşalt" genislik={420}
        aciklama={`${cop.length} dosya kalıcı olarak silinir ve ${boyut(copMb)} yer açılır. Bu işlem geri alınamaz.`}
        alt={<><button type="button" onClick={() => setBosaltOnay(false)} className={dugme.hayalet}>Vazgeç</button>
          <button type="button" onClick={() => { const n = cop.length; copuBosalt(); setBosaltOnay(false); toast.success("Çöp kutusu boşaltıldı", { description: `${n} dosya kalıcı olarak silindi.` }); }} className={dugme.tehlikeDolu}>Kalıcı olarak sil</button></>} />
    </Sayfa>
  );
}
