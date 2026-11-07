"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, ImagePlus, LogIn, Plus, Trash2 } from "lucide-react";
import { AlanOzetKarti, AlanSayfa, type AlanSayfaBaglam } from "@/components/alan/AlanSayfa";
import { AlanLogo, AlanYok, tarihYaz } from "@/components/alan/ortak";
import { YeniAlanPenceresi } from "@/components/alan/YeniAlanPenceresi";
import { Anahtar, Grup, Hap, KaydetCubugu, Satir, alan as alanSinifi, dugme, kaydedildi } from "@/components/ayarlar/ui";
import * as A from "@/lib/alan/istemci";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { PLAN_ADI } from "@/store/useAuth";
import { useAlan } from "@/store/useAlan";
import { cn } from "@/lib/utils";

/** Çalışma alanı, Genel: alan adı, logo, kimlik, varsayılanlar; kişisel alandaysa alanlar ve yeni alan. */
export default function AlanGenel() {
  return (
    <AlanSayfa baslik="Çalışma alanı" aciklama="Ekibinle ortak krediyle üret, Build projelerini ve kitaplığı paylaş. Üstteki şeritten alanlar arasında geç."
      kisiselde={<KisiselGorunum />} yan={(b) => <AlanOzetKarti alan={b.alan} />}>
      {(b) => <AlanAyarlari {...b} />}
    </AlanSayfa>
  );
}

function KisiselGorunum() {
  const { katilabilir, alanlar } = useAlan();
  const [yeni, setYeni] = useState(false);
  const katil = async () => {
    if (!katilabilir) return;
    const r = await A.alanAdiylaKatil(katilabilir.id);
    if (!r.ok) return toast.error("Katılınamadı", { description: r.hata });
    await useAlan.getState().yukle();
    await useAlan.getState().gec(r.alan.id, true);
    toast.success(`${r.alan.ad} alanına katıldın`);
  };
  return (
    <>
      {katilabilir && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4 rounded-[18px] bg-[#55d6fd]/[0.06] p-5 ring-1 ring-inset ring-[#55d6fd]/20">
          <AlanLogo ad={katilabilir.ad} logo={katilabilir.logo} renk={katilabilir.renk} boyut={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-white">{katilabilir.ad} alanına katılabilirsin</p>
            <p className="mt-0.5 text-[13.5px] text-white/55">Doğrulanmış @{katilabilir.alanAdi} adresin bu alanın alan adıyla eşleşiyor. Davet beklemeden katılırsın.</p>
          </div>
          <button type="button" onClick={() => void katil()} className={dugme.birincil}><LogIn className="h-4 w-4" />Katıl</button>
        </motion.div>
      )}
      <AlanYok baslik={alanlar.length ? "Şu an kişisel alandasın" : "Henüz bir çalışma alanın yok"}
        metin={alanlar.length ? "Harcamalar kişisel bakiyenden düşer. Bir ekip alanının ayarları için üstteki şeritten o alana geç." : "Bir alan oluştur, ekibini e-postayla davet et. Üretimler ve Build harcamaları alanın ortak kredisinden düşer, kim ne harcadı raporda görünür."}>
        <button type="button" onClick={() => setYeni(true)} className={dugme.birincil}><Plus className="h-4 w-4" />Yeni çalışma alanı</button>
      </AlanYok>
      <YeniAlanPenceresi acik={yeni} onKapat={() => setYeni(false)} />
    </>
  );
}

function AlanAyarlari({ alan, setAlan, yonetici }: AlanSayfaBaglam) {
  const [ad, setAd] = useState(alan.ad);
  const [hata, setHata] = useState<string | null>(null);
  const [logoBekle, setLogoBekle] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  useEffect(() => setAd(alan.ad), [alan.ad]);
  const degisti = ad.trim() !== alan.ad;
  const yaz = async (g: Parameters<typeof A.alanYaz>[1], mesaj?: string) => {
    const r = await A.alanYaz(alan.id, g);
    if (!r.ok) { toast.error("Kaydedilemedi", { description: r.hata }); return false; }
    setAlan(r.alan);
    void useAlan.getState().yukle();
    if (mesaj) toast.success(mesaj); else kaydedildi();
    return true;
  };
  const adKaydet = async () => {
    if (ad.trim().length < 2) return setHata("Alana en az 2 karakterlik bir ad ver.");
    setHata(null);
    await yaz({ ad: ad.trim() }, "Alan adı güncellendi");
  };
  const logoSec = (f?: File) => {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return toast.error("Logo PNG, JPEG ya da WebP olmalı");
    if (f.size > 400_000) return toast.error("Logo en çok 400 KB olabilir");
    const r = new FileReader();
    r.onload = async () => { setLogoBekle(true); await yaz({ logo: String(r.result) }, "Logo güncellendi"); setLogoBekle(false); };
    r.readAsDataURL(f);
  };
  return (
    <>
      <Grup id="logo" baslik="Kimlik" aciklama="Alan seçicide, davetlerde ve üyelerin ekranında görünen ad ve logo.">
        <Satir ad="Logo" alt="Kare PNG, JPEG ya da WebP, en çok 400 KB. Logo yoksa adın baş harfi gösterilir."
          on={<motion.div key={alan.logo ?? "yok"} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><AlanLogo ad={alan.ad} logo={alan.logo} renk={alan.renk} boyut={48} /></motion.div>}>
          {yonetici && (
            <>
              <input ref={dosya} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { logoSec(e.target.files?.[0]); e.target.value = ""; }} />
              {alan.logo && <button type="button" onClick={() => void yaz({ logo: "" }, "Logo kaldırıldı")} className={dugme.hayalet} aria-label="Logoyu kaldır"><Trash2 className="h-4 w-4" /></button>}
              <button type="button" disabled={logoBekle} onClick={() => dosya.current?.click()} className={dugme.ikincil}><ImagePlus className="h-4 w-4" />{logoBekle ? "Yükleniyor" : alan.logo ? "Değiştir" : "Logo yükle"}</button>
            </>
          )}
        </Satir>
        <Satir ad="Alan adı" alt="En çok 50 karakter." genis>
          <input value={ad} onChange={(e) => setAd(e.target.value.slice(0, 50))} disabled={!yonetici} aria-label="Alan adı" className={cn(alanSinifi, "sm:w-[300px]")} />
        </Satir>
        <Satir ad="Alan kimliği" alt="Destek ve API isteklerinde alanı tanımlar (x-vayra-alan başlığı).">
          <code className="sc-kod rounded-[8px] bg-white/[0.05] px-2.5 py-1.5 text-[12.5px] text-white/75">{alan.id}</code>
          <button type="button" onClick={() => void kopyala(alan.id, "Alan kimliği kopyalandı")} className={dugme.hayalet} aria-label="Kimliği kopyala"><Copy className="h-4 w-4" /></button>
        </Satir>
        <Satir ad="Plan" alt={alan.planBitis ? `Dönem sonu ${tarihYaz(alan.planBitis)}` : "Ücretsiz planda aylık kota yok; kredi aktarım ve satın almayla gelir."}>
          <Hap ton={alan.plan === "baslangic" ? "notr" : "vurgu"}>{alan.plan === "baslangic" ? "Ücretsiz" : PLAN_ADI[alan.plan]}</Hap>
          <Link href="/panel/ayarlar/alan/kredi#plan" className={dugme.ikincil}>{yonetici ? "Planı yönet" : "Ayrıntı"}</Link>
        </Satir>
        <Satir ad="Oluşturulma" alt={tarihYaz(alan.olusturma)} />
      </Grup>

      <Grup baslik="Varsayılanlar" aciklama="Alanda çalışan herkes için geçerli kurallar.">
        <Satir ad="Yeni Build projeleri alana eklensin" alt="Bu alandayken açılan Build projesi alanın ortak varlığı olur; üyeler düzenler, izleyiciler görür.">
          <Anahtar acik={alan.ayar.yeniProjeAlana} disabled={!yonetici} kayit={false} etiket="Yeni Build projeleri alana eklensin" onDegis={(v) => void yaz({ ayar: { yeniProjeAlana: v } })} />
        </Satir>
        <Satir ad="Üyeler davet gönderebilsin" alt="Kapalıyken yalnız sahip ve yöneticiler davet eder. Üyeler yalnız üye ve izleyici rolüyle davet edebilir.">
          <Anahtar acik={alan.ayar.uyeDavet} disabled={!yonetici} kayit={false} etiket="Üyeler davet gönderebilsin" onDegis={(v) => void yaz({ ayar: { uyeDavet: v } })} />
        </Satir>
      </Grup>
      {!yonetici && <p className="px-1 text-[13px] text-white/45">Bu ayarları alanın sahibi ve yöneticileri değiştirir.</p>}
      <KaydetCubugu gorunur={yonetici && degisti} hata={hata} onSifirla={() => { setAd(alan.ad); setHata(null); }} onKaydet={() => void adKaydet()} />
    </>
  );
}
