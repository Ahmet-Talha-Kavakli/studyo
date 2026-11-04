"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Sparkles, Wand2 } from "lucide-react";
import { SayfaBaslik } from "@/components/api/ui";
import { cn } from "@/lib/utils";

type Kayit = { tur: "yeni" | "iyilestirme" | "kalkiyor"; metin: React.ReactNode };
const SURUMLER: { tarih: string; baslik: string; ozet: string; kayitlar: Kayit[] }[] = [
  {
    tarih: "2026-10-28", baslik: "Teslimi yeniden gönder, karşılaştırma ve denetim kaydı", ozet: "Kaçırılan webhook olaylarını tamamlamak için yeni bir uç nokta geldi; panele model karşılaştırma ve denetim kaydı eklendi. Mevcut entegrasyonlarda değişiklik gerekmez.",
    kayitlar: [
      { tur: "yeni", metin: <><code>POST /v1/webhooks/deliveries/{"{id}"}/redeliver</code> — kayıtlı bir teslimi aynı gövde, olay kimliği ve imzayla yeniden gönderir; deneme teslimin geçmişine eklenir.</> },
      { tur: "yeni", metin: <>Panelde <Link href="/panel/api/karsilastir">Karşılaştır</Link>: aynı istemi aynı anda 4 modele kadar gönderip çıktı, süre ve bedeli yan yana gör.</> },
      { tur: "yeni", metin: <>Panelde <Link href="/panel/api/denetim">Denetim kaydı</Link>: anahtar, webhook, faturalama ve ayar değişikliklerinin tarihli listesi; CSV dışa aktarma.</> },
      { tur: "iyilestirme", metin: <>İstek ayrıntısında <code>cURL olarak kopyala</code> ve süren üretimler için <code>İptal et</code>; her yerde Ctrl+K ile model, uç nokta, istek ve hata kodu araması.</> },
    ],
  },
  {
    tarih: "2026-10-20", baslik: "v1 · Tek uç nokta, imzalı webhook'lar", ozet: "API'nin üretim katmanı yeniden yazıldı. Tüm modeller tek bir kaynakla çağrılıyor; anahtarlar kapsam, limit ve harcama sınırı taşıyor.",
    kayitlar: [
      { tur: "yeni", metin: <><code>POST /v1/generations</code> — tüm modeller için tek uç nokta; <code>model</code> + <code>input</code> gövdesi.</> },
      { tur: "yeni", metin: <><code>GET /v1/generations</code> imleç tabanlı sayfalama ve <code>status</code>, <code>model</code> süzgeçleri.</> },
      { tur: "yeni", metin: <><code>POST /v1/generations/{"{id}"}/cancel</code> — kuyruktaki ya da işlenen üretimi durdurur, kredi iade edilir.</> },
      { tur: "yeni", metin: <><code>sync: true</code> — kısa işlerde yanıtı sonuç hazır olana kadar (en çok 55 sn) bekletir.</> },
      { tur: "yeni", metin: <><code>Idempotency-Key</code> başlığı — 24 saat içinde aynı istek tekrar üretim açmaz.</> },
      { tur: "yeni", metin: <>Webhook olayları <code>Vayra-Signature</code> (HMAC-SHA256, zaman damgalı) ile imzalanır; 2xx alınamazsa 2 ve 8 sn sonra yeniden denenir. Teslim günlüğü: <code>GET /v1/webhooks/deliveries</code>.</> },
      { tur: "yeni", metin: <>Anahtar kapsamları (<code>full</code>, <code>generate</code>, <code>read</code>), anahtar başına hız limiti, aylık harcama sınırı ve bitiş tarihi.</> },
      { tur: "yeni", metin: <><code>GET /v1/models/{"{id}"}</code> modelin makinece okunur girdi şemasını döndürür; sunucu aynı şemayla doğrular.</> },
      { tur: "iyilestirme", metin: <>Hata gövdesi <code>type</code>, <code>code</code>, <code>param</code>, <code>request_id</code> ve <code>doc_url</code> alanlarıyla standartlaştı; birden çok alan hatası <code>errors</code> dizisinde döner.</> },
      { tur: "iyilestirme", metin: <>Bilinmeyen girdi alanları artık sessizce yok sayılmıyor; 400 <code>parameter_invalid</code> döner.</> },
      { tur: "kalkiyor", metin: <><code>POST /v1/text2image/{"{model}"}</code> ve benzeri türe özel yollar çalışmaya devam ediyor ama yeni entegrasyonlarda <code>/v1/generations</code> kullan.</> },
    ],
  },
];

const ROZET = {
  yeni: { ad: "Yeni", ikon: Sparkles, sinif: "bg-emerald-400/12 text-emerald-300" },
  iyilestirme: { ad: "İyileştirme", ikon: Wand2, sinif: "bg-sky-400/12 text-sky-300" },
  kalkiyor: { ad: "Kalkıyor", ikon: AlertTriangle, sinif: "bg-amber-400/12 text-amber-200" },
} as const;

export default function Degisiklikler() {
  return (
    <>
      <SayfaBaslik baslik="Değişiklikler" aciklama={<>v1 içinde yalnız geriye uyumlu değişiklik yapılır. Kırıcı bir değişiklik yeni bir sürümle (/v2) gelir ve en az 6 ay önceden burada duyurulur. Ayrıntılar için <Link href="/panel/api/dokuman#surum" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">sürümleme</Link>.</>} />
      <div className="space-y-6">
        {SURUMLER.map((s, si) => {
          const d = new Date(s.tarih);
          const sayac = (["yeni", "iyilestirme", "kalkiyor"] as const).map((t) => [t, s.kayitlar.filter((k) => k.tur === t).length] as const).filter(([, n]) => n);
          return (
            <motion.section key={s.tarih} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)] md:gap-8">
              <div className="relative md:pt-6">
                <div className="md:sticky md:top-24">
                  <p className="text-[26px] font-semibold leading-none tracking-[-0.03em] text-white">{d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</p>
                  <p className="mt-1.5 text-[13px] text-white/55">{d.getFullYear()}{si === 0 && <span className="ml-2 rounded-full bg-[#55d6fd]/12 px-2 py-0.5 text-[11.5px] font-medium text-[#8fe6ff]">En son</span>}</p>
                </div>
              </div>
              <article className="overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
                <div className="border-b border-white/[0.06] p-5 sm:p-6">
                  <div className="flex flex-wrap gap-1.5">
                    {sayac.map(([t, n]) => { const R = ROZET[t]; return <span key={t} className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium", R.sinif)}><R.ikon className="h-3 w-3" />{n} {R.ad.toLocaleLowerCase("tr")}</span>; })}
                  </div>
                  <h2 className="mt-3 text-[21px] font-semibold tracking-[-0.02em] text-white">{s.baslik}</h2>
                  <p className="mt-1.5 max-w-[720px] text-[14px] leading-relaxed text-white/65">{s.ozet}</p>
                </div>
                <ul className="divide-y divide-white/[0.05]">
                  {s.kayitlar.map((k, i) => {
                    const R = ROZET[k.tur];
                    return (
                      <li key={i} className="flex gap-3.5 px-5 py-3.5 text-[13.5px] leading-relaxed text-white/75 transition-colors hover:bg-white/[0.02] sm:px-6 [&_a]:font-medium [&_a]:text-white [&_a]:underline [&_a]:decoration-white/30 [&_a]:underline-offset-4 [&_code]:rounded-md [&_code]:bg-white/[0.07] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-white">
                        <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", R.sinif)} title={R.ad}><R.ikon className="h-3.5 w-3.5" /></span>
                        <span className="min-w-0">{k.metin}</span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </motion.section>
          );
        })}
      </div>
    </>
  );
}
