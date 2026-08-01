"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft, Share2, Sparkles, Download, Check, Settings, BadgeCheck, Bot, Video,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { SCComposer } from "@/components/kabuk/sc/SCComposer";
import { useSupercomputer } from "@/store/useSupercomputer";
import { onizlemeArka, saltUrl } from "@/lib/utils";
import { scArka } from "@/lib/gercekVeri";
import { CALISANLAR, calisanBul, calisanGradyan, type Calisan } from "@/lib/scMarket";
import { useScKurulum } from "@/store/useScKurulum";

import { kopyala } from "@/lib/gercekEylem";
/* ============================================================
   ÇALIŞAN DETAY — referanslar/calisan (marketplace tipi) birebir.

   Yapı (referans sırası):
     0. Üst — ‹ Çalışanlar / {Ad} ······ [↗ Paylaş]
     1. Hero — SOL: 62px avatar · meta (🤖 Çalışan · 📹 Kategori) · dev başlık
                    · 2 satır açıklama · [✦ Hemen Dene] [⤓ Kur]
               SAĞ: macOS pencereli büyük önizleme
     2. "{Ad} ile neler yapabilirsin" — 3 sütun galeri
     3. "{AD}'İ SUPERCOMPUTER'DA DENE" — ortada composer
     4. "Supercomputer'da diğer çalışanları dene" + "Tümünü gör ›"
   ============================================================ */

export default function CalisanDetay() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.slug ?? "");
  const c = calisanBul(slug);
  /* Kurulu durumu KALICI store'dan (önce useState: yenilemede sıfırlanıyor ve
     Ayarlar listesiyle habersizdi). */
  const acikListe = useScKurulum((s) => s.calisanlar);
  const calisanDegistir = useScKurulum((s) => s.calisanDegistir);
  const kurulu = c ? acikListe.includes(c.slug) : false;
  const [metin, setMetin] = useState("");

  if (!c) return notFound();

  const baslat = (istem: string) => {
    const t = istem.trim();
    if (t.length < 2) return;
    const sc = useSupercomputer.getState();
    const id = sc.sohbetAc(`${c.ad} — ${t.length > 28 ? t.slice(0, 28) + "…" : t}`);
    sc.mesajEkle(id, { rol: "kullanici", metin: t });
    sc.calisiyorAyarla(id, true);
    router.push(`/panel/supercomputer/${id}`);
  };

  const digerleri = CALISANLAR.filter((x) => x.slug !== c.slug).slice(0, 6);
  const kapak = scArka(c.tohum, "gorsel");
  const kapakUrl = saltUrl(kapak);

  return (
    <div className="sc-kapsam min-h-full bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      {/* ═══════ 0. ÜST ═══════ */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[var(--sc-zemin)]/90 px-6 py-3.5 backdrop-blur-xl">
        <span className="flex items-center gap-1.5 text-[15px]">
          <Link href="/panel/supercomputer/ayarlar/calisanlar"
            className="flex min-h-[24px] items-center gap-1 py-0.5 text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]">
            <ChevronLeft className="h-4 w-4" /> Çalışanlar
          </Link>
          <span className="text-[var(--sc-metin-3)]">/</span>
          <span className="text-[var(--sc-metin)]">{c.ad}</span>
        </span>
        <button
          onClick={() => {
            void kopyala(window.location.href, "Bağlantı kopyalandı", c.ad);
          }}
          className="sc-hap flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] text-[var(--sc-metin)]">
          <Share2 className="h-[16px] w-[16px]" /> Paylaş
        </button>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 pb-24">
        {/* ═══════ 1. HERO ═══════ */}
        <section className="grid items-center gap-10 pt-4 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
          <div>
            <span className="flex h-[62px] w-[62px] items-center justify-center rounded-[14px]"
              style={{ background: calisanGradyan(c.tohum) }}>
              <svg viewBox="0 0 40 46" className="h-[34px] w-[26px]" fill="rgba(255,255,255,0.92)">
                <circle cx="20" cy="12" r="9" />
                <path d="M4 46c0-9.4 7.2-17 16-17s16 7.6 16 17H4Z" />
              </svg>
            </span>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-[var(--sc-metin-3)]">
              <span className="flex items-center gap-1.5"><Bot className="h-4 w-4" /> Çalışan</span>
              <span className="text-[var(--sc-metin-3)]">•</span>
              <span className="flex items-center gap-1.5"><Video className="h-4 w-4" /> {c.kategori}</span>
              {c.dogrulanmis && (
                <>
                  <span className="text-[var(--sc-metin-3)]">•</span>
                  <span className="flex items-center gap-1.5 text-[var(--sc-metin-2)]">
                    <BadgeCheck className="h-4 w-4 text-[#5b9cf2]" /> {c.yayinci}
                  </span>
                </>
              )}
            </div>

            {/* dev başlık — beyaz→gri dikey gradyan (referans) */}
            <h1 className="sc-baslik mt-3 text-[40px] leading-[1.03] sm:text-[52px]"
              style={{
                /* color YEDEK kalır: background-clip:text desteklenmediğinde
                   color:transparent başlığı tamamen yok ediyordu. */
                color: "var(--sc-metin)",
                /* Gradyan uçları token'a bağlı: tema değerleri değişince
                   başlık da birlikte kayar (sabit kod tema dışında kalıyordu). */
                background: "linear-gradient(180deg,var(--sc-metin) 30%,var(--sc-metin-3) 100%)",
                WebkitBackgroundClip: "text", backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              {c.ad}
            </h1>

            <p className="mt-3 max-w-[520px] text-[16px] leading-relaxed text-[var(--sc-metin-3)]">
              {c.ozet}. {c.stiller[0]?.aciklama}.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button onClick={() => baslat(c.ornekIstem)}
                className="flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition-all hover:brightness-110"
                style={{ background: "var(--sc-aksan)", color: "var(--sc-aksan-metin)" }}>
                <Sparkles className="h-[18px] w-[18px]" /> Hemen Dene
              </button>
              {kurulu ? (
                <>
                  {/* Kurulu rozeti artık TIKLANABİLİR: eskiden <span>'di ve
                      çalışan bir kez kurulunca kaldırma yolu yoktu. */}
                  <button
                    onClick={() => { calisanDegistir(c.slug); toast(`${c.ad} kaldırıldı`); }}
                    title="Kaldırmak için tıkla"
                    className="sc-hap flex items-center gap-2 rounded-full px-4 py-3 text-[15px] text-[var(--sc-metin-2)] transition-colors hover:text-[var(--sc-metin)]">
                    <Check className="h-[17px] w-[17px]" /> Kurulu
                  </button>
                  <button onClick={() => toast.success("Çalışan ayarları kaydedildi", { description: "Yetenekler ve bağlayıcılar bu çalışana uygulandı." })}
                    className="sc-hap flex items-center gap-2 rounded-full px-4 py-3 text-[15px] text-[var(--sc-metin)]">
                    <Settings className="h-[17px] w-[17px]" /> Yönet
                  </button>
                </>
              ) : (
                <button onClick={() => { calisanDegistir(c.slug); toast.success(`${c.ad} işe alındı`); }}
                  className="sc-hap flex items-center gap-2 rounded-full px-4 py-3 text-[15px] text-[var(--sc-metin)]">
                  <Download className="h-[17px] w-[17px]" /> Kur
                </button>
              )}
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
            {c.ad} ile neler yapabilirsin
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...c.stiller, ...c.stiller].slice(0, 6).map((s, i) => {
              const a = scArka(`${s.tohum}-${i}`, "gorsel");
              const u = saltUrl(a);
              return (
                <div key={`${s.tohum}-${i}`} className="group/g overflow-hidden rounded-xl">
                  <div className="relative aspect-[16/10]">
                    <span className="absolute inset-0" style={{ background: a }} />
                    {u && <img src={u} alt="" loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/g:scale-[1.05]" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-3">
                      <span className="block text-[14.5px] font-medium text-[var(--sc-metin)]">{s.ad}</span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-[var(--sc-metin-2)]">{s.aciklama}</span>
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
            {c.ad}&apos;ı Supercomputer&apos;da dene
          </h2>
          <div className="mx-auto mt-7 max-w-[880px]">
            <SCComposer deger={metin} onDegis={setMetin} onGonder={baslat}
              otoYaz={false} placeholder={c.ornekIstem} />
            <p className="mt-2.5 text-center text-[12px] text-[var(--sc-etiket)]">
              LLM&apos;ler hata yapabilir; çağrılar kredi harcar.
            </p>
          </div>
        </section>

        {/* ═══════ 4. DİĞER ÇALIŞANLAR ═══════ */}
        <section className="mt-20">
          <div className="flex items-center">
            <h2 className="text-[20px] font-semibold text-[var(--sc-metin)]">
              Supercomputer&apos;da diğer çalışanları dene
            </h2>
            <Link href="/panel/supercomputer/ayarlar/calisanlar"
              className="ml-auto flex min-h-[24px] items-center gap-1 py-0.5 text-[14px] text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]">
              Tümünü gör ›
            </Link>
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {digerleri.map((d) => <MiniKart key={d.slug} c={d} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Alt bölümdeki mini çalışan kartı (liste kartıyla aynı anatomi) ── */
function MiniKart({ c }: { c: Calisan }) {
  const fotoMu = c.kapak === "foto";
  const arka = scArka(c.tohum, "gorsel");
  const url = fotoMu ? saltUrl(arka) : null;
  return (
    <Link href={`/panel/supercomputer/calisanlar/${c.slug}`}
      className="group/mk relative block aspect-[3/2] overflow-hidden rounded-2xl">
      <span className="absolute inset-0" style={{ background: fotoMu ? arka : calisanGradyan(c.tohum) }} />
      {url && <img src={url} alt="" loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/mk:scale-[1.04]" />}
      {!fotoMu && (
        <span className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <span className="text-[22px] font-semibold leading-tight text-[var(--sc-metin)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            {c.ad}
          </span>
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent px-3.5 pb-3 pt-9">
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate text-[15px] text-[var(--sc-metin)]">{c.ad}</span>
          {c.dogrulanmis && <BadgeCheck className="h-[15px] w-[15px] shrink-0 text-[#5b9cf2]" />}
        </span>
      </span>
    </Link>
  );
}
