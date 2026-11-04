"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Globe2, Link2, Lock } from "lucide-react";
import { useAyarTercih, useGorunurluk, type Gorunurluk } from "@/store/useAyarTercih";
import { useTercih } from "@/store/useTercih";
import { useProjeler } from "@/store/useProjeler";
import { useAuth } from "@/store/useAuth";
import { Anahtar, Grup, Hap, Pencere, Satir, Sayfa, Segment, dugme, kaydedildi, yay } from "@/components/ayarlar/ui";
import { toast } from "@/lib/toast";
import { GizlilikOnizleme } from "@/components/ayarlar/YanPaneller";
import { cn } from "@/lib/utils";

const GORUNURLUK: { id: Gorunurluk; ad: string; alt: string; ikon: typeof Lock }[] = [
  { id: "ozel", ad: "Özel", alt: "Yalnız sen görürsün", ikon: Lock },
  { id: "baglanti", ad: "Bağlantıyla", alt: "Bağlantısı olan herkes görür", ikon: Link2 },
  { id: "acik", ad: "Herkese açık", alt: "Keşfet'te ve profilinde görünür", ikon: Globe2 },
];

export default function GizlilikAyarlari() {
  const g = useAyarTercih((s) => s.gizlilik);
  const ayarla = useAyarTercih((s) => s.ayarla);
  const gorunumAyarla = useTercih((s) => s.gorunumAyarla);
  const plan = useAuth((s) => s.kullanici?.plan ?? "baslangic");
  const uretimler = useProjeler((s) => s.uretimler);
  const guncelle = useProjeler((s) => s.guncelle);
  const [ozelOnay, setOzelOnay] = useState(false);
  const set = (p: Partial<typeof g>) => ayarla("gizlilik", p);
  const gorunurluk = useGorunurluk();
  const yayinda = uretimler.filter((u) => u.yayinda);
  const filigranZorunlu = plan === "baslangic";

  // Üretim motoru "herkese açık" için useTercih.otoYayin'a bakar; ikisi birlikte güncellenir.
  const gorunurlukSec = (v: Gorunurluk) => { set({ gorunurluk: v }); gorunumAyarla({ otoYayin: v === "acik" }); kaydedildi(); };

  return (
    <Sayfa baslik="Gizlilik ve yayın" aciklama="Üretimlerini kimin görebileceği, nasıl kullanılabileceği ve verilerinin nereye gittiği. Açık bir üretimin nasıl göründüğünü önizlemede canlı gör." yan={<GizlilikOnizleme />}>
      <Grup id="gorunurluk" baslik="Yeni üretimler" aciklama="Bitince varsayılan olarak kimlerin görebileceği. Her üretimi ayrıca tek tek değiştirebilirsin." govde>
        <div role="radiogroup" aria-label="Varsayılan görünürlük" className="grid gap-2.5 sm:grid-cols-3">
          {GORUNURLUK.map((o) => {
            const sec = gorunurluk === o.id;
            return (
              <button key={o.id} type="button" role="radio" aria-checked={sec} onClick={() => !sec && gorunurlukSec(o.id)}
                className={cn("relative flex flex-col items-start rounded-[18px] p-4 text-left transition-colors", sec ? "bg-white/[0.06]" : "bg-white/[0.03] hover:bg-white/[0.05]")}>
                {sec && <motion.span layoutId="gorunurluk-cerceve" transition={yay} className="absolute inset-0 rounded-[18px] ring-[1.5px] ring-inset ring-white" />}
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-[12px] transition-colors", sec ? "bg-white text-black" : "bg-white/[0.07] text-white/80")}><o.ikon className="h-[18px] w-[18px]" /></span>
                <span className="mt-3.5 text-[15px] font-semibold text-white">{o.ad}</span>
                <span className="mt-0.5 text-[13px] leading-snug text-white/50">{o.alt}</span>
              </button>
            );
          })}
        </div>
        {yayinda.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-4 py-3">
            <span className="text-[13.5px] text-white/60">Şu an <span className="font-medium text-white">{yayinda.length} üretimin</span> herkese açık.</span>
            <button type="button" onClick={() => setOzelOnay(true)} className={cn(dugme.hayalet, "h-8 text-[13px]")}>Hepsini özel yap</button>
          </div>
        )}
      </Grup>

      <Grup baslik="Paylaştığın üretimler">
        <Satir id="remiks" ad="Remiks izni" alt="Başkaları açık üretimlerini kendi istemleriyle yeniden yorumlayabilir.">
          <Anahtar acik={g.remiks} onDegis={(v) => set({ remiks: v })} etiket="Remiks izni" />
        </Satir>
        <Satir id="istem" ad="İstemi göster" alt="Açık üretimlerinde yazdığın istem ve ayarlar görünür.">
          <Anahtar acik={g.istemGoster} onDegis={(v) => set({ istemGoster: v })} etiket="İstemi göster" />
        </Satir>
      </Grup>

      <Grup baslik="İçerik">
        <Satir id="hassas" ad="Hassas içerik" alt="Keşfet'te ve toplulukta hassas olarak işaretlenen görseller.">
          <Segment deger={g.hassas} onSec={(v) => set({ hassas: v })} kucuk secenekler={[{ deger: "bulanik", ad: "Bulanık" }, { deger: "goster", ad: "Göster" }, { deger: "gizle", ad: "Gizle" }]} />
        </Satir>
        <Satir id="filigran" ad={<span className="flex items-center gap-2">Vayra filigranı{filigranZorunlu && <Hap>Artı ve üstü</Hap>}</span>}
          alt={filigranZorunlu ? <>Başlangıç planında indirilen görsellerde küçük bir Vayra işareti bulunur. <Link href="/panel/ayarlar/abonelik" className="text-[#55d6fd] hover:underline">Planı yükselt</Link></> : "İndirdiğin görsel ve videoların köşesine küçük Vayra işareti eklenir."}>
          <Anahtar acik={filigranZorunlu || g.filigran} disabled={filigranZorunlu} onDegis={(v) => set({ filigran: v })} etiket="Vayra filigranı" />
        </Satir>
        <Satir id="kimlik-bilgisi" ad="Yapay zekâ etiketi" alt="Dosyalara yapay zekâyla üretildiğini belirten içerik kimliği (C2PA) eklenir. Sosyal ağlar bunu okuyup etiket gösterebilir.">
          <Anahtar acik={g.kimlikBilgisi} onDegis={(v) => set({ kimlikBilgisi: v })} etiket="Yapay zekâ etiketi" />
        </Satir>
      </Grup>

      <Grup baslik="Verilerin">
        <Satir id="egitim" ad="Modelleri geliştirmek için kullan" alt="Açarsan istemlerin ve üretimlerin, kimliğinden arındırılarak Vayra'nın kalite çalışmalarında kullanılabilir. Kapalıyken hiçbir zaman kullanılmaz.">
          <Anahtar acik={g.egitim} onDegis={(v) => set({ egitim: v })} etiket="Modelleri geliştirmek için kullan" />
        </Satir>
        <Satir ad="Verilerini indir ya da sil" alt="Profilini, üretim kayıtlarını ve faturalarını tek dosyada indir.">
          <Link href="/panel/ayarlar/veriler" className={dugme.ikincil}>Verilerim</Link>
        </Satir>
      </Grup>

      <Pencere acik={ozelOnay} onKapat={() => setOzelOnay(false)} baslik="Tüm üretimleri özel yap" genislik={440}
        aciklama={`${yayinda.length} üretim Keşfet'ten ve profilinden kaldırılır. Paylaşılmış bağlantılar çalışmayı bırakır. Daha sonra tek tek yeniden yayınlayabilirsin.`}
        alt={<><button type="button" onClick={() => setOzelOnay(false)} className={dugme.hayalet}>Vazgeç</button>
          <button type="button" onClick={() => { const n = yayinda.length; yayinda.forEach((u) => guncelle(u.id, { yayinda: false })); setOzelOnay(false); toast.success(`${n} üretim özel yapıldı`); }} className={dugme.birincil}>Özel yap</button></>} />
    </Sayfa>
  );
}
