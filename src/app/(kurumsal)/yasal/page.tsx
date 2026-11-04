import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { Bolum, SirketHero } from "@/components/sirket/ortak";
import { VeriTalebiFormu } from "@/components/sirket/VeriTalebiFormu";
import { ILETISIM, SIRKET, TR_SIRKET } from "@/lib/kurumsal/site";
import { GIZLILIK_META } from "@/lib/kurumsal/yasal/gizlilik";
import { KVKK_META } from "@/lib/kurumsal/yasal/kvkk";
import { SARTLAR_META } from "@/lib/kurumsal/yasal/sartlar";
import { KULLANIM_META } from "@/lib/kurumsal/yasal/kullanim";
import { CEREZ_META } from "@/lib/kurumsal/yasal/cerez";
import { IADE_META } from "@/lib/kurumsal/yasal/iade";
import { MESAFELI_META } from "@/lib/kurumsal/yasal/mesafeli";

export const metadata: Metadata = {
  title: "Yasal merkez",
  description: "Vayra'nın tüm yasal belgeleri: kullanım şartları, gizlilik, KVKK, çerezler, iade ve mesafeli satış. Veri talebi formu ve tüzel kişilik bilgileri.",
};

type Belge = { ad: string; href: string; ozet: string; meta?: { yururluk: string; surum: string } };
const GRUPLAR: { baslik: string; belgeler: Belge[] }[] = [
  { baslik: "Hizmet ve satın alma", belgeler: [
    { ad: "Kullanım Şartları", href: "/sartlar", ozet: "Hesap, krediler, içerik sahipliği ve uyuşmazlıklar.", meta: SARTLAR_META },
    { ad: "Kabul Edilebilir Kullanım Politikası", href: "/kullanim-politikasi", ozet: "Neyin serbest, neyin yasak olduğu; yaptırımlar.", meta: KULLANIM_META },
    { ad: "İade ve İptal Politikası", href: "/iade", ozet: "Abonelik iptali, 7 günlük iade, kredi paketleri.", meta: IADE_META },
    { ad: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis", ozet: "Türkiye'deki tüketiciler için satış sözleşmesi ve ön bilgilendirme.", meta: MESAFELI_META },
  ] },
  { baslik: "Gizlilik ve veri koruma", belgeler: [
    { ad: "Gizlilik Politikası", href: "/gizlilik", ozet: "Hangi veriler, neden, ne kadar süre; hakların.", meta: GIZLILIK_META },
    { ad: "KVKK Aydınlatma Metni", href: "/veri-koruma", ozet: "6698 sayılı Kanun md. 10 kapsamında aydınlatma.", meta: KVKK_META },
    { ad: "Çerez Politikası", href: "/cerezler", ozet: "Kullanılan çerezler ve tercih yönetimi.", meta: CEREZ_META },
  ] },
  { baslik: "Güvenlik ve uyum", belgeler: [
    { ad: "Güvenlik ve alt işleyiciler", href: "/guvenlik", ozet: "Altyapı, şifreleme, sertifikalar ve alt işleyici listesi." },
    { ad: "Veri İşleme Sözleşmesi (DPA)", href: "/kurumsal#iletisim", ozet: "Kurumsal müşteriler için GDPR md. 28 / KVKK uyumlu sözleşme; talep üzerine." },
    { ad: "Vayra Earn kuralları", href: "/earn/yardim", ozet: "Kreatör programının ödeme takvimi, seviyeler ve kuralları." },
  ] },
];

export default function YasalMerkez() {
  return (
    <>
      <SirketHero ust="Yasal merkez" baslik="Açık kurallar, sade dil."
        alt="Vayra'yı kullanırken geçerli olan tüm belgeler tek yerde. Her belgenin başında sade bir özet, her bölümün başında &ldquo;Kısaca&rdquo; notu var." />

      <Bolum>
        <div className="space-y-14">
          {GRUPLAR.map((g) => (
            <div key={g.baslik}>
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-metin-3">{g.baslik}</h2>
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[22px] border border-white/[0.07]">
                {g.belgeler.map((b) => (
                  <Link key={b.href} href={b.href} className="group flex items-center gap-4 bg-yuzey px-5 py-5 transition-colors hover:bg-[#151518] sm:px-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-metin-2 group-hover:text-white"><FileText className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] font-semibold text-white">{b.ad}</span>
                      <span className="block text-[13px] text-metin-3">{b.ozet}</span>
                    </span>
                    {b.meta && <span className="hidden shrink-0 text-right text-[12.5px] text-metin-3 sm:block">Yürürlük {b.meta.yururluk}<br />Sürüm {b.meta.surum}</span>}
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-metin-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Bolum>

      <Bolum id="veri-talebi" ust="Hakların" baslik="Veri talebi oluştur"
        alt="Verilerine erişmek, düzeltmek, silmek ya da işlemeye itiraz etmek için talebini buradan ilet. KVKK ve GDPR kapsamında en geç 30 gün içinde, ücretsiz yanıt veririz.">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <VeriTalebiFormu />
          <aside className="space-y-3 text-[13.5px] leading-relaxed text-metin-2">
            <div className="rounded-[22px] border border-white/[0.07] bg-yuzey p-5">
              <p className="text-[14px] font-semibold text-white">Diğer başvuru kanalları</p>
              <ul className="mt-3 space-y-2">
                <li>E-posta: <a href={`mailto:${ILETISIM.kvkk}`} className="text-white underline underline-offset-4">{ILETISIM.kvkk}</a></li>
                <li>KEP: <span className="text-white">{TR_SIRKET.kep}</span></li>
                <li>Posta: {TR_SIRKET.adres}</li>
              </ul>
            </div>
            <p className="px-1 text-[12.5px] text-metin-3">Hesap silme ve profil düzeltme işlemlerini Ayarlar&apos;dan anında da yapabilirsin.</p>
          </aside>
        </div>
      </Bolum>

      <Bolum ust="Künye" baslik="Tüzel kişilikler">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { baslik: SIRKET.yasalAd, alt: "Global merkez · AEA ve diğer ülkeler", satirlar: [["Adres", ILETISIM.adres], ["Ticaret sicili", SIRKET.ticaretSicil], ["KDV no", SIRKET.vergiNo], ["E-posta", ILETISIM.hukuk]] },
            { baslik: TR_SIRKET.yasalAd, alt: "Türkiye · KVKK veri sorumlusu, satıcı", satirlar: [["Adres", TR_SIRKET.adres], ["MERSİS", TR_SIRKET.mersis], ["Vergi", `${TR_SIRKET.vergiDairesi} · ${TR_SIRKET.vergiNo}`], ["Ticaret sicili", TR_SIRKET.ticaretSicil], ["KEP", TR_SIRKET.kep], ["Telefon", TR_SIRKET.telefon]] },
          ].map((s) => (
            <div key={s.baslik} className="rounded-[22px] border border-white/[0.07] bg-yuzey p-6">
              <p className="text-[16px] font-semibold text-white">{s.baslik}</p>
              <p className="text-[12.5px] text-metin-3">{s.alt}</p>
              <dl className="mt-5 space-y-2.5">
                {s.satirlar.map(([a, b]) => (
                  <div key={a} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 text-[13.5px]"><dt className="text-metin-3">{a}</dt><dd className="text-white/90">{b}</dd></div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Bolum>
    </>
  );
}
