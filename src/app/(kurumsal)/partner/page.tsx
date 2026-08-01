import type { Metadata } from "next";
import { Handshake, Puzzle, Megaphone, GraduationCap, Check, Building2, Mail } from "lucide-react";
import { Hero, BolumBaslik, DegerKart, Kart, CTASerit, SurecAdimlari, MiniSSS } from "@/components/kurumsal/UI";
import { ILETISIM } from "@/lib/kurumsal/site";
import { PARTNER_SURECI, PARTNER_SSS } from "@/lib/kurumsal/detay";

export const metadata: Metadata = {
  title: "İş Ortaklığı — Vayra",
  description: "Vayra partner programı: teknoloji entegrasyonu, ajans ortaklığı, çözüm ortaklığı ve eğitim ortaklığı. Birlikte daha fazla yaratıcıya ulaşalım.",
};

const turler = [
  { ikon: Puzzle, ad: "Teknoloji ortaklığı", ozet: "API ve entegrasyonlarla Vayra'yı kendi ürününe göm; birlikte yeni akışlar kur." },
  { ikon: Megaphone, ad: "Ajans ortaklığı", ozet: "Ajansın için özel kotalar, ekip yönetimi ve öncelikli destek; müşterilerine Vayra kalitesi sun." },
  { ikon: Handshake, ad: "Çözüm ortaklığı", ozet: "Vayra'yı müşterilerine kur ve yönet; gelir paylaşımı ve teknik eğitim." },
  { ikon: GraduationCap, ad: "Eğitim ortaklığı", ozet: "Kurslar ve topluluklar için özel erişim; yaratıcı yeteneği birlikte yetiştirelim." },
];

const avantajlar = [
  "Gelir paylaşımı ve özel komisyon oranları",
  "Öncelikli teknik destek ve ayrılmış hesap yöneticisi",
  "Ortak pazarlama ve ürün tanıtım fırsatları",
  "Erken erişim: yeni modeller ve özellikler",
  "Ortaklara özel API kotaları ve fiyatlandırma",
  "Eğitim materyalleri ve sertifikasyon",
];

const ortaklar = ["Nova Studios", "Meridyen Ajans", "Atlas Reklam", "Lumen Yapım", "Orbit Ajans", "Vertex Marka"];

export default function Partner() {
  return (
    <>
      <Hero
        ustBaslik="İş Ortaklığı"
        baslik="Birlikte daha fazlasını üretelim"
        aciklama="Vayra partner programıyla teknoloji, ajans, çözüm ve eğitim ortaklıkları kuruyoruz. Ortak büyüme için doğru yerdesin."
        cta={
          <a href={`mailto:${ILETISIM.partner}`} className="kr-cta inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold">
            <Mail className="h-4 w-4" /> Ortaklık başvurusu
          </a>
        }
      />

      {/* Ortaklık türleri */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <BolumBaslik baslik="Ortaklık türleri" ozet="İş modeline uygun ortaklığı seç." />
        <div className="grid gap-5 sm:grid-cols-2">
          {turler.map((t) => <DegerKart key={t.ad} {...t} />)}
        </div>
      </section>

      {/* Avantajlar */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <BolumBaslik baslik="Ortaklara neler sunuyoruz?" />
        <Kart className="!p-8">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {avantajlar.map((a) => (
              <div key={a} className="flex gap-3 text-[15px] text-[color:var(--color-metin-2)]">
                <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[color:var(--kr-lime-metin)]" /> {a}
              </div>
            ))}
          </div>
        </Kart>
      </section>

      {/* Ortaklık süreci */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <BolumBaslik baslik="Nasıl ortak olunur?" ozet="Başvurudan lansmana dört adım." />
        <SurecAdimlari adimlar={PARTNER_SURECI} />
      </section>

      {/* Mevcut ortaklar */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <BolumBaslik baslik="Bize güvenen ortaklar" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ortaklar.map((o) => (
            <div key={o} className="kr-kart kr-kart-hover flex items-center gap-3 px-4 py-4">
              <span className="kr-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Building2 className="h-4.5 w-4.5" /></span>
              <span className="truncate text-sm font-semibold text-[color:var(--color-metin-2)]">{o}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Partner SSS */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <BolumBaslik baslik="Sıkça sorulanlar" />
        <MiniSSS maddeler={PARTNER_SSS} />
      </section>

      <CTASerit
        baslik="Ortaklığa hazır mısın?"
        ozet="Birkaç dakikada başvur; ekibimiz seninle iletişime geçsin."
        birincil={{ ad: "Başvuru gönder", href: "/iletisim" }}
      />
    </>
  );
}
