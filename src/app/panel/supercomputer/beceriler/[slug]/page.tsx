"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Share2, Sparkles, Zap, Check, Download } from "lucide-react";
import { toast } from "@/lib/toast";
import { SCComposer } from "@/components/kabuk/sc/SCComposer";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { useSupercomputer } from "@/store/useSupercomputer";
import { onizlemeArka, saltUrl } from "@/lib/utils";
import { scArka } from "@/lib/gercekVeri";
import { BECERILER, beceriBul, beceriGradyan, type Beceri } from "@/lib/scMarket";
import { useScKurulum } from "@/store/useScKurulum";

import { kopyala } from "@/lib/gercekEylem";
/* ============================================================
   BECERİ DETAY — referanslar/skills birebir.

   Yapı (referans sırası):
     0. Üst (sticky) — ‹ Beceriler / {Ad} ······ [↗ Paylaş]
     1. Hero — SOL: 64px şimşek ikon kutusu · DEV BAŞLIK
                    · meta (⚡ Beceri · 〰 Vayra) · 2 satır açıklama · [✦ Hemen Dene]
               SAĞ: macOS pencereli büyük önizleme
     2. "{Ad} ile neler yapabilirsin" — örnek galeri
     3. "{AD}'İ SUPERCOMPUTER'DA DENE" — ortada composer, üstünde /slash çipi
     4. "Supercomputer'da diğer becerileri dene" + "Tümünü gör ›"

   NOT: Referansta detay sayfasında SEKME/SKILL.md görüntüleyici YOK —
   tek kolonlu bir vitrin sayfası.
   ============================================================ */

export default function BeceriDetay() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug ?? "");
  const b = beceriBul(slug);
  /* Kurulu durumu KALICI store'dan okunur. Önce useState'teydi: hem yenilemede
     sıfırlanıyordu hem de Ayarlar listesiyle habersizdi (listede açtığın beceri
     burada kapalı görünüyordu). */
  const acikListe = useScKurulum((s) => s.beceriler);
  const beceriDegistir = useScKurulum((s) => s.beceriDegistir);
  const kurulu = b ? acikListe.includes(b.slug) : false;
  const [metin, setMetin] = useState("");

  if (!b) return notFound();

  const baslat = (istem: string) => {
    const t = istem.trim();
    if (t.length < 2) return;
    const sc = useSupercomputer.getState();
    const id = sc.sohbetAc(`/${b.komut} — ${t.length > 26 ? t.slice(0, 26) + "…" : t}`);
    sc.mesajEkle(id, { rol: "kullanici", metin: `/${b.komut} ${t}` });
    sc.calisiyorAyarla(id, true);
    router.push(`/panel/supercomputer/${id}`);
  };

  const digerleri = BECERILER.filter((x) => x.slug !== b.slug).slice(0, 6);
  const kapak = scArka(b.tohum, "gorsel");
  const kapakUrl = saltUrl(kapak);

  return (
    <div className="sc-kapsam min-h-full bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      {/* ═══════ 0. ÜST (sticky) ═══════ */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[var(--sc-zemin)]/90 px-6 py-3.5 backdrop-blur-xl">
        <span className="flex items-center gap-1.5 text-[15px]">
          <Link href="/panel/supercomputer/ayarlar/beceriler"
            className="flex min-h-[24px] items-center gap-1 py-0.5 text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]">
            <ChevronLeft className="h-4 w-4" /> Beceriler
          </Link>
          <span className="text-[var(--sc-metin-3)]">/</span>
          <span className="text-[var(--sc-metin)]">{b.ad}</span>
        </span>
        <button
          onClick={() => {
            void kopyala(window.location.href, "Bağlantı kopyalandı", b.ad);
          }}
          className="sc-hap flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] text-[var(--sc-metin)]">
          <Share2 className="h-[16px] w-[16px]" /> Paylaş
        </button>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 pb-24">
        {/* ═══════ 1. HERO ═══════ */}
        <section className="grid items-center gap-10 pt-4 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)]">
          <div>
            {/* şimşek ikon kutusu — referansta TÜM becerilerde aynı */}
            <span className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-[var(--sc-cip)]">
              <Zap className="h-7 w-7 text-[var(--sc-metin)]" strokeWidth={1.8} />
            </span>

            <h1 className="sc-baslik mt-4 text-[38px] leading-[1.04] sm:text-[48px]">
              {b.ad}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-[var(--sc-metin-3)]">
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> Beceri</span>
              <span className="flex items-center gap-1.5">
                <VayraIsaret size={15} /> {b.yayinci}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" /> {b.kurulum?.toLocaleString("tr-TR")} kurulum
              </span>
            </div>

            <p className="mt-3 max-w-[520px] text-[16px] leading-relaxed text-[var(--sc-metin-3)]">
              {b.ozet}. {b.guclu} ile çalışır.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button onClick={() => baslat(b.ornekIstem)}
                className="flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition-all hover:brightness-110"
                style={{ background: "var(--sc-aksan)", color: "var(--sc-aksan-metin)" }}>
                <Sparkles className="h-[18px] w-[18px]" /> Hemen Dene
              </button>
              <button
                onClick={() => {
                  beceriDegistir(b.slug);
                  toast[kurulu ? "message" : "success"](kurulu ? `${b.ad} kaldırıldı` : `${b.ad} kuruldu`);
                }}
                className="sc-hap flex items-center gap-2 rounded-full px-4 py-3 text-[15px] text-[var(--sc-metin)]">
                {kurulu ? <><Check className="h-[17px] w-[17px]" /> Kurulu</> : <><Plusİkon /> Kur</>}
              </button>
            </div>
          </div>

          {/* sağ: macOS pencereli önizleme */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-[var(--sc-kenar)] bg-[var(--sc-kart)]">
            <div className="flex items-center gap-1.5 px-3.5 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="relative aspect-[16/9]">
              <span className="absolute inset-0" style={{ background: kapak }} />
              {kapakUrl && <img src={kapakUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            </div>
          </motion.div>
        </section>

        {/* ═══════ 2. NELER YAPABİLİRSİN ═══════ */}
        <section className="mt-20">
          <h2 className="sc-baslik text-[24px] sm:text-[28px]">
            {b.ad} ile neler yapabilirsin
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {b.ornekler.map((o) => {
              const a = scArka(o.tohum, "gorsel");
              const u = saltUrl(a);
              return (
                <div key={o.tohum} className="group/g overflow-hidden rounded-xl">
                  <div className="relative aspect-video">
                    <span className="absolute inset-0" style={{ background: a }} />
                    {u && <img src={u} alt="" loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/g:scale-[1.04]" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/72 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="block text-[15px] font-medium text-[var(--sc-metin)]">{o.ad}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-[var(--sc-metin-2)]">{o.aciklama}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══════ 3. SUPERCOMPUTER'DA DENE ═══════ */}
        <section className="mt-20">
          <h2 className="sc-baslik mx-auto max-w-[760px] text-center text-[26px] leading-tight sm:text-[34px]">
            {b.ad}&apos;ı Supercomputer&apos;da dene
          </h2>
          <div className="mx-auto mt-7 max-w-[910px]">
            <SCComposer
              deger={metin} onDegis={setMetin} onGonder={baslat}
              otoYaz={false} placeholder={b.ornekIstem}
              ekChipler={
                /* referansta composer'ın üstünde /slash komut çipi duruyor */
                /* Bu çip composer'ın İÇİNDE render edilir; composer kendi koyu
                   yüzeyini koruduğu için beyaz tonlar kullanılır. */
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[13.5px]">
                    <span className="text-white/50">/</span>
                    <span className="text-white">{b.komut}</span>
                  </span>
                </div>
              }
            />
            <p className="mt-2.5 text-center text-[12px] text-[var(--sc-etiket)]">
              LLM&apos;ler hata yapabilir; çağrılar kredi harcar.
            </p>
          </div>
        </section>

        {/* ═══════ 4. DİĞER BECERİLER ═══════ */}
        <section className="mt-20">
          <div className="flex items-center">
            <h2 className="text-[20px] font-semibold text-[var(--sc-metin)]">
              Supercomputer&apos;da diğer becerileri dene
            </h2>
            <Link href="/panel/supercomputer/ayarlar/beceriler"
              className="ml-auto flex min-h-[24px] items-center gap-1 py-0.5 text-[14px] text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]">
              Tümünü gör ›
            </Link>
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {digerleri.map((d) => <MiniKart key={d.slug} b={d} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Kur butonundaki artı — lucide Plus ile çakışmasın diye küçük sarmalayıcı. */
function Plusİkon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  );
}

/* ── Alt bölümdeki mini beceri kartı ── */
function MiniKart({ b }: { b: Beceri }) {
  return (
    <Link href={`/panel/supercomputer/beceriler/${b.slug}`}
      className="group/mk relative block aspect-[31/20] overflow-hidden rounded-2xl">
      <span className="absolute inset-0" style={{ background: beceriGradyan(b.tohum) }} />
      <span className="absolute inset-0 flex items-center justify-center px-8 pb-10 text-center">
        <span className="text-[21px] font-semibold leading-tight text-[var(--sc-metin)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
          {b.ad}
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-end gap-2 bg-gradient-to-t from-black/70 to-transparent px-3.5 pb-3 pt-8">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-[var(--sc-metin)]">{b.ad}</span>
          <span className="mt-0.5 flex max-h-0 items-center gap-1.5 overflow-hidden text-[12.5px] text-[var(--sc-metin-2)] transition-all duration-200 group-hover/mk:max-h-5">
            <Download className="h-[13px] w-[13px]" /> {b.kurulum?.toLocaleString("tr-TR")} kurulum
          </span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--sc-kenar)] bg-black/40 text-[var(--sc-metin)] backdrop-blur-md">
          <Plusİkon />
        </span>
      </span>
    </Link>
  );
}
