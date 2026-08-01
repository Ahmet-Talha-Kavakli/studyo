/**
 * Flow seed motoru — Instagram evreni (deterministik, SSR güvenli).
 * Kullanıcılar, gönderiler (görsel/carousel/reels), story'ler, yorumlar.
 * `flowVeri()` cache'lenir. Gerçek skorlama motoru burada (keşfet + "senin için").
 */

import { prng, tohumla, tamsayi, sec, agirlikliSec, SIMDI, GUN, SAAT } from "./cekirdek";
import {
  KULLANICI_ADLARI, AD_SOYAD, ACIKLAMALAR, YORUMLAR, HASHTAGLER, SESLER,
  KATEGORILER, REELS_VIDEOLAR, REELS_ACIKLAMA,
} from "./tablolar";

export interface FlowKullanici {
  id: string;
  kadi: string;            // kullanıcı adı (@)
  ad: string;              // görünen ad
  avatarTohum: string;
  bio: string;
  onayli: boolean;         // mavi tik
  profesyonel: boolean;    // pro hesap
  kategori?: string;       // pro hesap kategorisi (Yaratıcı, Sanatçı…)
  takipci: number;
  takip: number;
  gonderiSayisi: number;
  hikayeVar: boolean;
}

export interface FlowYorum {
  id: string;
  kullaniciId: string;
  metin: string;
  begeni: number;
  zaman: number;
}

export interface FlowGonderi {
  id: string;
  sahipId: string;
  tur: "gorsel" | "carousel" | "reels";
  medya: { tohum: string; kat: string; video?: string }[]; // carousel çoklu
  aciklama: string;
  hashtagler: string[];
  ses?: string;            // reels sesi
  begeni: number;
  yorumSayisi: number;
  paylasim: number;
  kaydetme: number;
  goruntulenme: number;    // reels için
  zaman: number;
  yorumlar: FlowYorum[];
  konum?: string;
}

export interface FlowStory {
  kullaniciId: string;
  kareler: { tohum: string; kat: string; sure: number; zaman: number }[];
}

export interface FlowEvren {
  kullanicilar: FlowKullanici[];
  gonderiler: FlowGonderi[];
  storyler: FlowStory[];
}

const KONUMLAR = ["İstanbul", "Ankara", "İzmir", "Berlin", "Londra", "New York", "Paris", "Dubai", undefined];
const PRO_KATEGORI = ["Dijital Yaratıcı", "Sanatçı", "Video İçerik Üreticisi", "Fotoğrafçı", "Tasarımcı", "Grafik Tasarım"];

let _cache: FlowEvren | null = null;

export function flowVeri(): FlowEvren {
  if (_cache) return _cache;
  const r = prng(tohumla("vayra-flow-evren-v1"));

  /* ── Kullanıcılar (36) ── */
  const kullanicilar: FlowKullanici[] = KULLANICI_ADLARI.map((kadi, i) => {
    const onayli = r() > 0.72;
    const profesyonel = onayli || r() > 0.5;
    const takipci = Math.round(Math.pow(10, 2.3 + r() * 3.6)); // 200 → ~600k log dağılım
    return {
      id: `fu_${i}`,
      kadi,
      ad: AD_SOYAD[i] ?? kadi,
      avatarTohum: `fav-${i}`,
      bio: sec(r, [
        "AI ile sinematik hikayeler ✨", "Vayra ile üretiyorum 🎬", "Görsel sanatçı · dijital rüyalar",
        "3D & motion · her gün yeni bir kare", "Işıkla resim yapıyorum 🎨", "Yaratıcı içerik · DM kapalı",
        "Portre & atmosfer 📸", "Fantastik dünyalar inşa ediyorum 🐉",
      ]),
      onayli,
      profesyonel,
      kategori: profesyonel ? sec(r, PRO_KATEGORI) : undefined,
      takipci,
      takip: tamsayi(r, 80, 900),
      gonderiSayisi: tamsayi(r, 12, 340),
      hikayeVar: r() > 0.45,
    };
  });

  /* ── Gönderiler (~120) ── */
  const gonderiler: FlowGonderi[] = [];
  for (let i = 0; i < 120; i++) {
    const sahip = sec(r, kullanicilar);
    const tur = agirlikliSec(r, [["gorsel", 55], ["reels", 30], ["carousel", 15]] as const);
    const kat = sec(r, KATEGORILER);
    const zaman = SIMDI - tamsayi(r, 0, 14) * GUN - tamsayi(r, 0, 24) * SAAT - tamsayi(r, 0, 60) * 60000;
    // etkileşim: takipçiyle orantılı + gürültü
    const taban = sahip.takipci * (0.02 + r() * 0.12);
    const begeni = Math.round(taban * (0.6 + r() * 0.8));
    const yorumSayisi = Math.round(begeni * (0.01 + r() * 0.04));

    const medya = tur === "carousel"
      ? Array.from({ length: tamsayi(r, 2, 6) }, (_, j) => ({ tohum: `post-${i}-${j}`, kat }))
      : tur === "reels"
        ? [{ tohum: `post-${i}`, kat, video: REELS_VIDEOLAR[i % REELS_VIDEOLAR.length] }]
        : [{ tohum: `post-${i}`, kat }];

    // yorumlar
    const yorumlar: FlowYorum[] = Array.from({ length: Math.min(yorumSayisi, tamsayi(r, 2, 8)) }, (_, j) => ({
      id: `fc_${i}_${j}`,
      kullaniciId: sec(r, kullanicilar).id,
      metin: sec(r, YORUMLAR),
      begeni: tamsayi(r, 0, 240),
      zaman: zaman + tamsayi(r, 60000, SAAT),
    }));

    gonderiler.push({
      id: `fp_${i}`,
      sahipId: sahip.id,
      tur,
      medya,
      aciklama: tur === "reels" ? REELS_ACIKLAMA[i % REELS_ACIKLAMA.length] : sec(r, ACIKLAMALAR),
      hashtagler: Array.from({ length: tamsayi(r, 1, 4) }, () => sec(r, HASHTAGLER)).filter((v, idx, a) => a.indexOf(v) === idx),
      ses: tur === "reels" ? sec(r, SESLER) : undefined,
      begeni,
      yorumSayisi: Math.max(yorumSayisi, yorumlar.length),
      paylasim: Math.round(begeni * (0.02 + r() * 0.06)),
      kaydetme: Math.round(begeni * (0.05 + r() * 0.15)),
      goruntulenme: tur === "reels" ? Math.round(begeni * (8 + r() * 30)) : begeni,
      zaman,
      yorumlar,
      konum: sec(r, KONUMLAR),
    });
  }
  gonderiler.sort((a, b) => b.zaman - a.zaman);

  /* ── Story'ler (hikayesi olan kullanıcılar) ── */
  const storyler: FlowStory[] = kullanicilar.filter((k) => k.hikayeVar).map((k) => {
    const rr = prng(tohumla(k.id + "story"));
    return {
      kullaniciId: k.id,
      kareler: Array.from({ length: tamsayi(rr, 1, 5) }, (_, j) => ({
        tohum: `story-${k.id}-${j}`, kat: sec(rr, KATEGORILER), sure: 5,
        zaman: SIMDI - tamsayi(rr, 0, 20) * SAAT,
      })),
    };
  });

  _cache = { kullanicilar, gonderiler, storyler };
  return _cache;
}

/* ══════════ GERÇEK SKORLAMA MOTORU ══════════ */
/**
 * Bir gönderiyi kullanıcı için skorlar: etkileşim + tazelik + ilgi alanı + çeşitlilik.
 * "Senin için" feed'i ve Keşfet bu skora göre dizilir.
 */
export function gonderiSkor(g: FlowGonderi, opt: {
  ilgiKategoriler?: Set<string>;   // kullanıcının ilgilendiği kategoriler
  takipEdilen?: Set<string>;       // takip edilen sahipler
  gorulenSahipler?: Map<string, number>; // çeşitlilik cezası (aynı sahip tekrar)
} = {}): number {
  const yasSaat = (SIMDI - g.zaman) / SAAT;
  // etkileşim oranı (kaydetme ve yorum ağır)
  const etkilesim = g.begeni + g.yorumSayisi * 8 + g.kaydetme * 12 + g.paylasim * 6;
  const etkilesimSkor = Math.log10(etkilesim + 10);
  // tazelik (yeni içerik önde, ~48 saatte yarılanır)
  const tazelik = Math.exp(-yasSaat / 48);
  // ilgi alanı eşleşmesi
  const ilgi = opt.ilgiKategoriler?.has(g.medya[0]?.kat) ? 1.6 : 1;
  // takip bonusu
  const takip = opt.takipEdilen?.has(g.sahipId) ? 1.4 : 1;
  // çeşitlilik cezası (aynı sahibi feed'de tekrar gösterme)
  const tekrar = opt.gorulenSahipler?.get(g.sahipId) ?? 0;
  const cesitlilik = 1 / (1 + tekrar * 0.6);

  return etkilesimSkor * (0.55 + tazelik * 0.9) * ilgi * takip * cesitlilik;
}

/** "Senin için" akışı — skorla, çeşitlilik uygula. */
export function seninIcinAkis(ilgi?: Set<string>, takip?: Set<string>): FlowGonderi[] {
  const e = flowVeri();
  const gorulen = new Map<string, number>();
  return [...e.gonderiler]
    .map((g) => ({ g, s: gonderiSkor(g, { ilgiKategoriler: ilgi, takipEdilen: takip, gorulenSahipler: gorulen }) }))
    .sort((a, b) => b.s - a.s)
    .map(({ g }) => { gorulen.set(g.sahipId, (gorulen.get(g.sahipId) ?? 0) + 1); return g; });
}

/** Keşfet — takip edilmeyenlerden yüksek etkileşimli, çeşitli grid. */
export function kesfetAkis(takip?: Set<string>): FlowGonderi[] {
  const e = flowVeri();
  const gorulen = new Map<string, number>();
  return [...e.gonderiler]
    .filter((g) => !takip?.has(g.sahipId))
    .map((g) => ({ g, s: gonderiSkor(g, { gorulenSahipler: gorulen }) * (0.7 + (g.goruntulenme / 100000)) }))
    .sort((a, b) => b.s - a.s)
    .map(({ g }) => { gorulen.set(g.sahipId, (gorulen.get(g.sahipId) ?? 0) + 1); return g; });
}

export const kullaniciBul = (id: string) => flowVeri().kullanicilar.find((k) => k.id === id);
