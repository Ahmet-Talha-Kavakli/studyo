"use client";

/**
 * YukseltPano — /panel/kredi sayfasının GÖVDESİ, sıfırdan yazıldı (2026-07-30).
 *
 * Neden yeniden yazıldı (kullanıcı kararı): eski ekran Higgsfield'in birebir
 * kopyasıydı — pembe "%30 İNDİRİM", tik tak eden sahte geri sayım, üstü çizili
 * fiyatlar. Aciliyet baskısı kuran, bize ait olmayan bir dil.
 *
 * İlk denemem klişeleri temizlerken tasarımı da düzleştirdi ("çok zayıf" geri
 * bildirimi). Bu sürümde karakter geri geldi:
 *   · İki sütunlu düzen — solda yapışkan anlatı, sağda seçenekler. Ortalanmış
 *     tek sütun jenerik SaaS fiyat sayfası gibi duruyordu.
 *   · Kahraman şerit: gerçek üretim görselleri (public/gercek/sinirsiz) — sayfa
 *     ne sattığını GÖSTERİYOR, sadece anlatmıyor.
 *   · Önerilen plan gerçekten öne çıkıyor: aksan halkası + kendi ışıması.
 *   · Zeminde aura — cam kartların bulandıracağı renk (yoksa cam görünmez).
 *
 * Aynı ÖZELLİKLER korundu (kullanıcı şartı): plan yükseltme (aylık/yıllık,
 * ULTRA kredi seçeneği), kredi paketleri, sınırsız erişim, hız artırma,
 * otomatik yükleme tercihi.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check, Zap, Coins, Infinity as InfinityIcon, Rocket, RefreshCw, ArrowRight, Sparkles,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import { useTercih } from "@/store/useTercih";
import type { KrediSekme } from "@/store/useKrediModal";

/* ══════════════════════ VERİ ══════════════════════ */

type Plan = {
  ad: string; kod: "arti" | "ultra"; ozet: string;
  krediAy: number; aylik: number; yillik: number;
  gorselAdet: number; videoAdet: number;
  ozellikler: string[]; krediSecenek?: number[]; onerilen?: boolean;
};

const PLANLAR: Plan[] = [
  {
    ad: "Plus", kod: "arti", ozet: "Düzenli içerik üretenler için",
    krediAy: 1200, aylik: 59, yillik: 47, gorselAdet: 600, videoAdet: 53,
    ozellikler: [
      "Aynı anda 6 video, 8 görsel üretimi",
      "Supercomputer erişimi",
      "Tüm Seedance modelleri",
      "Tüm model ve özellikler",
      "Yeni modellere erken erişim",
    ],
  },
  {
    ad: "Ultra", kod: "ultra", ozet: "AI ile proje kuran yaratıcılar için", onerilen: true,
    krediAy: 3000, aylik: 129, yillik: 99, gorselAdet: 1500, videoAdet: 133,
    krediSecenek: [3000, 6000, 9000],
    ozellikler: [
      "Aynı anda 8 video, 8 görsel üretimi",
      "Supercomputer erişimi",
      "Tüm Seedance modelleri",
      "Tüm model ve özellikler",
      "Yeni modellere erken erişim",
      "Kredi başına en düşük maliyet",
    ],
  },
];

type Paket = { kredi: number; fiyat: number; gorsel: number; video: number; populer?: boolean };
const PAKETLER: Paket[] = [
  { kredi: 100, fiyat: 6.25, gorsel: 50, video: 4 },
  { kredi: 500, fiyat: 26, gorsel: 250, video: 22 },
  { kredi: 1000, fiyat: 49, gorsel: 500, video: 44 },
  { kredi: 2000, fiyat: 95, gorsel: 1000, video: 88, populer: true },
  { kredi: 4000, fiyat: 190, gorsel: 2000, video: 177 },
  { kredi: 5000, fiyat: 235, gorsel: 2500, video: 222 },
];

const SINIRSIZ_GRUPLAR: { grup: string; modeller: string[] }[] = [
  { grup: "ByteDance", modeller: ["Seedance 2.0", "Seedance 2.0 Fast & Mini", "Seedream 5.0 Pro"] },
  { grup: "Google", modeller: ["Nano Banana Pro", "Nano Banana 2", "Gemini Omni Flash"] },
  { grup: "Kling", modeller: ["Kling 3.0", "Kling 3.0 Motion Control"] },
  { grup: "Ses", modeller: ["Seed Audio 1.0", "Eleven v3", "MiniMax Speech 2.8 HD", "VibeVoice"] },
  { grup: "Diğer", modeller: ["GPT Image 2", "Wan 2.7"] },
];

/* Kahraman şeridi — gerçek üretim çıktıları. Sayfa ne sattığını gösterir. */
const VITRIN = [
  { src: "/gercek/sinirsiz/unl-seedance.webp", ad: "Seedance 2.0" },
  { src: "/gercek/sinirsiz/unl-nano-banana-pro.webp", ad: "Nano Banana Pro" },
  { src: "/gercek/sinirsiz/unl-kling.webp", ad: "Kling 3.0" },
  { src: "/gercek/sinirsiz/unl-gpt-image.webp", ad: "GPT Image 2" },
];

const SEKMELER: { id: KrediSekme; ad: string; ikon: typeof Rocket }[] = [
  { id: "plan", ad: "Plan", ikon: Rocket },
  { id: "kredi", ad: "Kredi", ikon: Coins },
  { id: "sinirsiz", ad: "Sınırsız", ikon: InfinityIcon },
  { id: "hiz", ad: "Hız", ikon: Zap },
];

/* Her sekmenin kendi anlatısı — sol sütunda durur. */
const ANLATI: Record<KrediSekme, { ustluk: string; baslik: string; vurgu: string; ozet: string }> = {
  plan: {
    ustluk: "Abonelik",
    baslik: "Her ay yenilenen",
    vurgu: "üretim gücü.",
    ozet: "Aylık kredin otomatik yenilenir, kullanmadığın kredi bir sonraki aya devreder. Planını istediğin zaman değiştir ya da iptal et.",
  },
  kredi: {
    ustluk: "Tek seferlik",
    baslik: "Sadece ihtiyacın",
    vurgu: "kadar kredi.",
    ozet: "Aboneliğe bağlanmadan kredi al. Süresi dolmaz, istediğin zaman kullanırsın. Büyük paketlerde kredi başına maliyet düşer.",
  },
  sinirsiz: {
    ustluk: "Süreli erişim",
    baslik: "Kredi saymadan",
    vurgu: "sınırsız üret.",
    ozet: "Seçili premium modelleri süre boyunca sınırsız kullan. Yoğun bir proje döneminde en ekonomik yol.",
  },
  hiz: {
    ustluk: "Öncelik",
    baslik: "Kuyruğu atla,",
    vurgu: "önce sen üret.",
    ozet: "Yoğun saatlerde işler kuyrukta bekleyebilir. Öncelik satın alarak sıranın önüne geç.",
  },
};

const para = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`;
const sayi = (n: number) => n.toLocaleString("tr-TR");

/* ══════════════════════ ORTAK ══════════════════════ */

function OtomatikYukleme() {
  const acik = useTercih((s) => s.otomatikYukleme);
  const toggle = useTercih((s) => s.otomatikYuklemeToggle);
  return (
    <div className="glass-kenar mt-4 flex max-w-4xl flex-col items-start justify-between gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center">
      <span className="flex items-start gap-3">
        <span className="glass-ikon glass-ikon-cyan mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]">
          <RefreshCw className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-[14.5px] font-semibold text-white">Otomatik yükleme</span>
          <span className="block text-[13px] text-metin-3">
            {acik ? "Açık — bakiyen bitince paketin yenilenir." : "Kapalı — bakiyen bitince üretim durur."}
          </span>
        </span>
      </span>
      <button
        onClick={() => {
          const yeni = toggle();
          toast.success(yeni ? "Otomatik yükleme açıldı" : "Otomatik yükleme kapatıldı", {
            description: yeni ? "Bakiyen bitince paketin otomatik yenilenecek." : "Kredi yüklemesi artık elle yapılacak.",
          });
        }}
        role="switch" aria-checked={acik} aria-label="Otomatik yükleme"
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", !acik && "bg-white/12")}
        style={acik ? { background: "var(--sn-lime, #55d6fd)" } : undefined}>
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition-all", acik ? "left-6" : "left-1")} />
      </button>
    </div>
  );
}

/* ══════════════════════ PLAN ══════════════════════ */

function PlanSekmesi() {
  const mevcut = useAuth((s) => s.kullanici?.plan ?? "baslangic");
  const profilGuncelle = useAuth((s) => s.profilGuncelle);
  const [yillik, setYillik] = useState(true);
  const [ultraIdx, setUltraIdx] = useState(0);

  const sec = (p: Plan) => {
    if (mevcut === p.kod) return toast.info(`Zaten ${p.ad} planındasın.`);
    profilGuncelle({ plan: p.kod });
    toast.success(`${p.ad} planına geçtin`, { description: "Demo — gerçek ödeme yayında bağlanacak." });
  };

  return (
    <>
      {/* Aylık / Yıllık */}
      <div className="mb-5 flex">
        <div className="glass-kenar flex items-center gap-1 rounded-full p-1">
          {([["Aylık", false], ["Yıllık", true]] as const).map(([ad, yil]) => (
            <button key={ad} onClick={() => setYillik(yil)}
              className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors",
                yillik === yil ? "text-zemin" : "text-metin-2 hover:text-white")}
              style={yillik === yil ? { background: "var(--sn-lime, #55d6fd)" } : undefined}>
              {ad}
              {yil && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10.5px] font-bold",
                  yillik ? "bg-zemin/15 text-zemin" : "bg-white/10 text-metin-2")}>
                  2 ay bedava
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan kartları: geniş ekranda ikisi yan yana ama aşırı gerilmesin diye
          max-w tavanı var — 1600px'de kart 700px'e çıkıp okunaksızlaşıyordu. */}
      <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
        {PLANLAR.map((p, i) => {
          const kredi = p.krediSecenek ? p.krediSecenek[ultraIdx] : p.krediAy;
          const carpan = kredi / p.krediAy;
          const fiyat = Math.round((yillik ? p.yillik : p.aylik) * carpan);
          const bu = mevcut === p.kod;
          return (
            <motion.div key={p.ad}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={cn("glass-kenar relative flex flex-col rounded-3xl p-6",
                p.onerilen && "yukselt-onerilen")}>
              {p.onerilen && (
                <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[11.5px] font-bold text-zemin"
                  style={{ background: "var(--sn-lime, #55d6fd)" }}>
                  En çok tercih edilen
                </span>
              )}

              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[22px] font-bold text-white">{p.ad}</h2>
                {bu && <span className="glass-kenar rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-metin-2">Mevcut</span>}
              </div>
              <p className="mt-1 text-[13.5px] text-metin-3">{p.ozet}</p>

              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="yukselt-fiyat text-[46px] font-bold leading-none tracking-tight">{para(fiyat)}</span>
                <span className="text-[14px] text-metin-3">/ ay</span>
              </div>
              {yillik && <p className="mt-1.5 text-[12.5px] text-metin-3">yıllık ödemede · aylık {para(Math.round(p.aylik * carpan))} yerine</p>}

              {p.krediSecenek && (
                <div className="mt-5">
                  <p className="mb-2 text-[12.5px] text-metin-3">Aylık kredi</p>
                  <div className="flex gap-1.5">
                    {p.krediSecenek.map((k, idx) => (
                      <button key={k} onClick={() => setUltraIdx(idx)}
                        className={cn("flex-1 rounded-xl px-2 py-2 text-[13px] font-semibold tabular-nums transition-colors",
                          ultraIdx === idx ? "text-zemin" : "glass-kenar text-metin-2 hover:text-white")}
                        style={ultraIdx === idx ? { background: "var(--sn-lime, #55d6fd)" } : undefined}>
                        {sayi(k)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="yukselt-kredi-kutu mt-5 rounded-2xl px-4 py-3.5">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
                  <Sparkles className="h-4 w-4" style={{ color: "var(--sn-lime, #55d6fd)" }} />
                  Ayda {sayi(kredi)} kredi
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-metin-3">
                  ≈ {sayi(Math.round(p.gorselAdet * carpan))} görsel ya da {Math.round(p.videoAdet * carpan)} video
                </p>
              </div>

              <ul className="mt-5 space-y-2.5">
                {p.ozellikler.map((o) => (
                  <li key={o} className="flex items-start gap-2.5 text-[13.5px] text-metin-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--sn-lime, #55d6fd)" }} />
                    {o}
                  </li>
                ))}
              </ul>

              <button onClick={() => sec(p)} disabled={bu}
                className={cn("mt-6 w-full rounded-full py-3 text-[14.5px] font-bold transition-transform",
                  bu ? "glass-kenar cursor-default text-metin-3" : "text-zemin hover:scale-[1.02] active:scale-[0.99]")}
                style={bu ? undefined : { background: "var(--sn-lime, #55d6fd)" }}>
                {bu ? "Kullandığın plan" : `${p.ad}'a geç`}
              </button>
            </motion.div>
          );
        })}
      </div>

      <OtomatikYukleme />
    </>
  );
}

/* ══════════════════════ KREDİ ══════════════════════ */

function KrediSekmesi() {
  const ekKrediEkle = useAuth((s) => s.ekKrediEkle);
  const satinAl = (p: Paket) => {
    ekKrediEkle(p.kredi);
    toast.success(`${sayi(p.kredi)} kredi eklendi`, { description: `${para(p.fiyat)} · Demo satın alma` });
  };

  return (
    <>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {PAKETLER.map((p, i) => (
          <motion.div key={p.kredi}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={cn("glass-kenar relative flex flex-col rounded-2xl p-5", p.populer && "yukselt-onerilen")}>
            {p.populer && (
              <span className="absolute -top-2.5 left-5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-zemin"
                style={{ background: "var(--sn-lime, #55d6fd)" }}>
                En popüler
              </span>
            )}
            <p className="yukselt-fiyat text-[26px] font-bold leading-none tabular-nums">{sayi(p.kredi)}</p>
            <p className="mt-1 text-[12.5px] text-metin-3">kredi</p>

            <ul className="mt-4 space-y-1.5 text-[12.5px] text-metin-3">
              <li>≈ {sayi(p.gorsel)} görsel üretimi</li>
              <li>≈ {p.video} video (720p · 5sn)</li>
            </ul>

            <div className="mt-auto pt-5">
              {/* whitespace-nowrap: "16 kredi / $1" dar kartta iki satıra kırılıyordu. */}
              <div className="flex items-end justify-between gap-2">
                <span className="text-[26px] font-bold leading-none text-white">{para(p.fiyat)}</span>
                <span className="shrink-0 whitespace-nowrap text-[11.5px] tabular-nums text-metin-3">
                  {(p.kredi / p.fiyat).toFixed(0)} kr / $1
                </span>
              </div>
              <button onClick={() => satinAl(p)}
                className="glass-kenar mt-4 w-full rounded-full py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-white/[0.08]">
                Satın al
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <OtomatikYukleme />
    </>
  );
}

/* ══════════════════════ SINIRSIZ ══════════════════════ */

function SinirsizSekmesi() {
  const [secili, setSecili] = useState(0);
  const SURELER = [
    { gun: 7, fiyat: 99, ozet: "Bir proje boyunca" },
    { gun: 30, fiyat: 299, ozet: "Bir ay boyunca" },
  ];
  return (
    <>
      <div className="grid max-w-3xl gap-3.5 sm:grid-cols-2">
        {SURELER.map((s, i) => (
          <button key={s.gun} onClick={() => setSecili(i)}
            aria-pressed={secili === i}
            className={cn("glass-kenar rounded-2xl p-6 text-left transition-transform hover:scale-[1.01]",
              secili === i && "yukselt-onerilen")}>
            <p className="text-[13px] text-metin-3">{s.ozet}</p>
            <p className="mt-1 text-[24px] font-bold text-white">{s.gun} gün</p>
            <p className="yukselt-fiyat mt-3 text-[34px] font-bold leading-none">{para(s.fiyat)}</p>
          </button>
        ))}
      </div>

      <div className="glass-kenar mt-4 max-w-3xl rounded-2xl p-5">
        <p className="mb-3.5 text-[13.5px] font-semibold text-white">Erişeceğin modeller</p>
        <div className="space-y-3">
          {SINIRSIZ_GRUPLAR.map((g) => (
            <div key={g.grup}>
              <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-metin-3">{g.grup}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.modeller.map((m) => (
                  <span key={m} className="glass-kenar rounded-full px-2.5 py-1 text-[12px] text-metin-2">{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => toast.success(`${SURELER[secili].gun} günlük sınırsız erişim etkin`, { description: "Demo — gerçek ödeme yayında bağlanacak." })}
        className="mt-4 flex w-full max-w-3xl items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.01]"
        style={{ background: "var(--sn-lime, #55d6fd)" }}>
        {SURELER[secili].gun} gün sınırsız — {para(SURELER[secili].fiyat)} <ArrowRight className="h-4 w-4" />
      </button>
    </>
  );
}

/* ══════════════════════ HIZ ══════════════════════ */

function HizSekmesi() {
  const SEVIYELER = [
    { ad: "Standart", ozet: "Sıradaki işlerle birlikte kuyrukta", kat: "1×", fiyat: 0, mevcut: true },
    { ad: "Öncelikli", ozet: "Kuyruğun önüne geçer", kat: "2×", fiyat: 19 },
    { ad: "Turbo", ozet: "Ayrılmış kapasitede çalışır", kat: "4×", fiyat: 49 },
  ];
  return (
    <div className="grid max-w-4xl gap-3.5 sm:grid-cols-3">
      {SEVIYELER.map((s, i) => (
        <motion.div key={s.ad}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
          className={cn("glass-kenar flex flex-col rounded-2xl p-5", i === 1 && "yukselt-onerilen")}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[17px] font-bold text-white">{s.ad}</p>
            <span className="glass-kenar rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums"
              style={{ color: "var(--sn-lime, #55d6fd)" }}>{s.kat}</span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-snug text-metin-3">{s.ozet}</p>
          <p className="yukselt-fiyat mt-4 text-[26px] font-bold leading-none">
            {s.fiyat === 0 ? "Ücretsiz" : para(s.fiyat)}
            {s.fiyat > 0 && <span className="text-[13px] font-normal text-metin-3"> / ay</span>}
          </p>
          <button
            onClick={() => s.mevcut
              ? toast.info("Standart hız zaten etkin.")
              : toast.success(`${s.ad} hız etkin`, { description: "Demo — gerçek ödeme yayında bağlanacak." })}
            disabled={s.mevcut}
            className={cn("mt-auto w-full rounded-full py-2.5 text-[13.5px] font-bold transition-transform",
              s.mevcut ? "glass-kenar mt-5 cursor-default text-metin-3" : "mt-5 text-zemin hover:scale-[1.02]")}
            style={s.mevcut ? undefined : { background: "var(--sn-lime, #55d6fd)" }}>
            {s.mevcut ? "Etkin" : "Seç"}
          </button>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════ KABUK ══════════════════════ */

export function YukseltPano({ sekme, setSekme }: { sekme: KrediSekme; setSekme: (s: KrediSekme) => void }) {
  const a = ANLATI[sekme];

  return (
    <div className="yukselt-kapsam relative">
      {/* Zemin aurası — cam kartların bulandıracağı renk katmanı.
          Bu olmadan .glass-kenar düz siyah üstünde "cam" görünmez. */}
      <div aria-hidden className="yukselt-aura pointer-events-none absolute inset-0" />

      {/* Sol sütun geniş ekranda biraz büyür (340→400px) ki vitrin görselleri
          kırpılmasın; sağ sütun kalan tüm alanı alır. */}
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10 2xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)] 2xl:gap-14">
        {/* ══════ SOL: anlatı (yapışkan) ══════ */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <motion.p key={a.ustluk}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-metin-3">
            {a.ustluk}
          </motion.p>
          <motion.h1 key={a.baslik}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
            className="mt-3 text-[34px] font-bold leading-[1.08] tracking-tight text-white sm:text-[40px]">
            {a.baslik}<br /><span className="yukselt-gradyan">{a.vurgu}</span>
          </motion.h1>
          <motion.p key={a.ozet}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="mt-4 text-[14.5px] leading-relaxed text-metin-2">
            {a.ozet}
          </motion.p>

          {/* Sekme şeridi — dikey, anlatının altında */}
          <div className="mt-7 flex flex-wrap gap-1.5">
            {SEKMELER.map((s) => (
              <button key={s.id} onClick={() => setSekme(s.id)}
                aria-current={sekme === s.id ? "page" : undefined}
                className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                  sekme === s.id ? "text-zemin" : "glass-kenar text-metin-2 hover:text-white")}
                style={sekme === s.id ? { background: "var(--sn-lime, #55d6fd)" } : undefined}>
                <s.ikon className="h-3.5 w-3.5" /> {s.ad}
              </button>
            ))}
          </div>

          {/* Vitrin — gerçek üretim çıktıları. Sayfanın ne sattığını GÖSTERİR. */}
          <div className="mt-8 hidden lg:block">
            <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-metin-3">
              Hepsi dahil
            </p>
            <div className="grid grid-cols-2 gap-2">
              {VITRIN.map((v, i) => (
                <motion.div key={v.src}
                  initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.14 + i * 0.06 }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.07]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.src} alt="" aria-hidden loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-5 text-[10.5px] font-medium text-white/90">
                    {v.ad}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════ SAĞ: seçenekler ══════
            İçerik max-w tavanlı (kartlar aşırı gerilmesin); geniş ekranda
            kalan alan sağda tek başına boşluk bırakmasın diye ortalanıyor. */}
        <div className="min-w-0 2xl:flex 2xl:justify-center">
          <div className="w-full 2xl:max-w-5xl">
            {sekme === "kredi" ? <KrediSekmesi />
              : sekme === "sinirsiz" ? <SinirsizSekmesi />
              : sekme === "hiz" ? <HizSekmesi />
              : <PlanSekmesi />}
          </div>
        </div>
      </div>
    </div>
  );
}
