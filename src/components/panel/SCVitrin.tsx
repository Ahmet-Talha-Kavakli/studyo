"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ============================================================
   SÜPER BİLGİSAYAR ŞERİDİ — durmadan akan üretim akışı.

   Bu alan iki kez elden geçti:
     1) Donmuş bir mockup'tı ("Ajan 23sn'dir çalışıyor" yazıp hiç
        ilerlemeyen adımlar) + yanında boş 6 kutu.
     2) Canlı bir ajan konsolu yapıldı; çalışıyordu ama yine
        "sol panel + sağ ızgara" kalıbındaydı — sayfadaki diğer 16
        bölümle aynı hissi veriyordu.

   Bu üçüncü hâl kalıbı tamamen bırakıyor: kart yok, ızgara yok,
   panel yok. Tek sıra hâlinde sonsuz sola akan bir üretim şeridi.

   Teknik notlar:
     · Akış saf CSS (`@keyframes sc-serit-kay`) — JS zamanlayıcı yok,
       kare atlamaz, sekme arka plandayken CPU yakmaz.
     · Sonsuz görüntü için liste İKİ KEZ basılır ve -50% kaydırılır;
       ikinci kopya `aria-hidden` (ekran okuyucu tekrar okumasın).
     · Şerit üstüne gelince durur (`group-hover`) — kullanıcı bir kareyi
       incelemek isterse akış engel olmasın.
     · `prefers-reduced-motion` açıksa animasyon tamamen durur.
   ============================================================ */

type Kare = { url: string; ad: string; tur: string };

/* Şeritteki kareler — her biri ürünün ürettiği farklı bir iş türü.

   Görseller /gercek/galeri'den seçildi (sinematik/ürün/portre/3d/manzara/
   soyut). İlk denemede /gercek/sc/bc-*.webp kullanılmıştı ama o setin
   neredeyse tamamı aynı mavi-turuncu "yapay zeka beyni" temasındaydı ve
   şerit monoton görünüyordu — akan bir vitrinde en çok göze çarpan şey
   tekrar oluyor.

   Sıra da bilinçli: aynı tür arka arkaya gelmez, her kare bir öncekinden
   görsel olarak ayrışır. */
const KARELER: Kare[] = [
  { url: "/gercek/galeri/sinematik3.webp", ad: "Sinematik sahne", tur: "Video" },
  { url: "/gercek/galeri/urun2.webp", ad: "Ürün fotoğrafı", tur: "Görsel" },
  { url: "/gercek/galeri/3d4.webp", ad: "3D karakter", tur: "3D" },
  { url: "/gercek/galeri/portre5.webp", ad: "UGC reklam yüzü", tur: "Video" },
  { url: "/gercek/galeri/soyut2.webp", ad: "Marka kimliği", tur: "Tasarım" },
  { url: "/gercek/galeri/manzara7.webp", ad: "Mekan tasarımı", tur: "Görsel" },
  { url: "/gercek/galeri/sinematik8.webp", ad: "Fragman kurgusu", tur: "Video" },
  { url: "/gercek/galeri/urun6.webp", ad: "Katalog çekimi", tur: "Görsel" },
  { url: "/gercek/galeri/3d9.webp", ad: "Ürün modeli", tur: "3D" },
  { url: "/gercek/galeri/portre11.webp", ad: "Karakter portresi", tur: "Görsel" },
  { url: "/gercek/galeri/manzara3.webp", ad: "Açılış sahnesi", tur: "Video" },
  { url: "/gercek/galeri/soyut10.webp", ad: "Afiş tasarımı", tur: "Tasarım" },
];

export function SCVitrin() {
  return (
    <section className="mt-10 sm:mt-14">
      {/* ── Başlık: tek satır, sade. Kart içine alınmaz. ── */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-metin sm:text-[26px]">
            Süper Bilgisayar durmadan üretiyor
          </h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-metin-2">
            Video, görsel, müzik, 3D ve çalışan kod — hepsi tek bir cümleden.
          </p>
        </div>
        <Link href="/panel/supercomputer"
          className="group/cta flex shrink-0 items-center gap-1.5 rounded-full bg-aksan px-4 py-2 text-[13.5px] font-bold text-zemin transition-transform hover:scale-[1.03]">
          Kendin dene
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
        </Link>
      </div>

      {/* ── Şerit ──
          Tam genişlik hissi için sayfa iç boşluğu negatif marjla aşılır;
          kenarlarda maske ile eritilir, böylece kareler "kesilmiş" değil
          karanlığa karışıyor gibi görünür. */}
      <div className="group -mx-4 lg:-mx-8">
        <div
          className="relative overflow-hidden py-1"
          style={{
            // Kenarlarda yumuşak eriyiş — hem sol hem sağ.
            maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
          }}>
          <div className="sc-serit flex w-max gap-3">
            {/* Liste iki kez basılır: birincisi bitince ikincisi tam aynı
                noktada devam eder, kesintisiz döngü oluşur. */}
            {[0, 1].map((kopya) => (
              KARELER.map((k) => (
                <figure
                  key={`${kopya}-${k.url}`}
                  aria-hidden={kopya === 1 || undefined}
                  className="group/kare relative m-0 h-[124px] w-[196px] shrink-0 overflow-hidden rounded-xl sm:h-[152px] sm:w-[248px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={k.url} alt={kopya === 0 ? `${k.ad} — ${k.tur}` : ""} loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/kare:scale-[1.06]" />
                  {/* Alt karartma — künye okunsun */}
                  <span aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 px-2.5 pb-2">
                    <span className="block truncate text-[12.5px] font-semibold leading-tight text-white">{k.ad}</span>
                    <span className="mt-0.5 block text-[10.5px] font-medium uppercase tracking-[0.06em] text-white/55">{k.tur}</span>
                  </figcaption>
                </figure>
              ))
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
