"use client";

import type { MontajProje, MontajKatman, MontajKlip, MontajMarka, RenkAyar } from "@/store/useMontaj";
import type { ExProje, ExSahne, ExAyar, SahneTur } from "@/store/useExplainer";
import { exId } from "@/store/useExplainer";

/**
 * Explainer motoru — sahneleri montaj projesine derler (önizleme + MP4 aynı motor),
 * yerel taslak senaryo yazar, rakamları istatistik sahnesine çevirir, geçiş sesi sentezler.
 */

/* ═══════════ Stiller ═══════════ */

export type ExStil = { tohum: string; ad: string; kisa: string; font: string; vurgu: string; yazi: string; aciklama: string; /** Açık zeminli stil: koyu yazı, karartma yok. */ acik?: boolean };
export const EX_STILLER: ExStil[] = [
  { tohum: "ex-2dillustrator", ad: "2D İllüstrasyon", kisa: "Sıcak, anlatıcı", font: "poppins", vurgu: "#facc15", yazi: "#ffffff", aciklama: "flat 2D illustration, warm palette, clean shapes, friendly characters" },
  { tohum: "ex-isometric", ad: "İzometrik Vektör", kisa: "Teknik, net", font: "grotesk", vurgu: "#22d3ee", yazi: "#ffffff", aciklama: "isometric flat vector illustration, soft gradients, tech diagram feel" },
  { tohum: "ex-whiteboard", ad: "Beyaz Tahta", kisa: "Eğitici", font: "caveat", vurgu: "#2563eb", yazi: "#0f172a", acik: true, aciklama: "whiteboard marker doodle illustration, hand drawn, black ink on white" },
  { tohum: "ex-claymotion", ad: "Kil Animasyon", kisa: "Oyuncu, dokulu", font: "poppins", vurgu: "#fb923c", yazi: "#ffffff", aciklama: "claymation stop-motion style, plasticine textures, soft studio light" },
  { tohum: "ex-papercraft", ad: "Kağıt Katlama", kisa: "El yapımı", font: "dmserif", vurgu: "#f472b6", yazi: "#ffffff", aciklama: "3D papercraft diorama, layered paper cutouts, soft shadows" },
  { tohum: "ex-3dmix", ad: "3D Karışım", kisa: "Modern, parlak", font: "montserrat", vurgu: "#a78bfa", yazi: "#ffffff", aciklama: "glossy 3D render, pastel colors, soft global illumination" },
  { tohum: "ex-lowpoly", ad: "Düşük Poligon", kisa: "Geometrik", font: "oswald", vurgu: "#34d399", yazi: "#ffffff", aciklama: "low poly 3D art, faceted geometry, gradient sky" },
  { tohum: "ex-mixedmedia", ad: "Karışık Medya", kisa: "Editoryal", font: "bebas", vurgu: "#f87171", yazi: "#ffffff", aciklama: "mixed media collage, photo cutouts, paper texture, editorial design" },
  { tohum: "ex-pixelart", ad: "Piksel Sanat", kisa: "Retro oyun", font: "archivo", vurgu: "#4ade80", yazi: "#ffffff", aciklama: "16-bit pixel art, retro game palette, crisp pixels" },
  { tohum: "ex-needlefelt", ad: "İğne Keçe", kisa: "Yumuşak, sevimli", font: "lobster", vurgu: "#fda4af", yazi: "#ffffff", aciklama: "needle felted wool miniature, fuzzy texture, cozy lighting" },
];
/** Özel stil: "ozel|<taban tohum>|<tarif>". Tarif senaryo ve görsel istemine gider; hazır görsel yoksa taban stilin klibi kullanılır. */
export const ozelStil = (taban: string, tarif: string) => `ozel|${taban}|${tarif.replace(/\|/g, " ").trim()}`;
export const stilTaban = (t: string) => (t.startsWith("ozel|") ? t.split("|")[1] || EX_STILLER[0].tohum : t);
export const stilBul = (t: string): ExStil => {
  if (t.startsWith("ozel|")) {
    const [, taban, ...r] = t.split("|"); const tarif = r.join(" ").trim();
    const b = EX_STILLER.find((s) => s.tohum === taban) ?? EX_STILLER[0];
    return { ...b, tohum: t, ad: tarif.length > 24 ? `${tarif.slice(0, 23).trim()}…` : tarif || "Özel stil", kisa: "Özel stil", aciklama: `${tarif}. Base look: ${b.aciklama}` };
  }
  return EX_STILLER.find((s) => s.tohum === t) ?? EX_STILLER[0];
};
export const stilVideo = (t: string) => `/gercek/explainer-video/${stilTaban(t)}.mp4`;
export const stilPoster = (t: string) => `/gercek/explainer-video/${stilTaban(t)}.webp`;

export const SAHNE_TURLERI: { id: SahneTur; ad: string; alt: string }[] = [
  { id: "baslik", ad: "Başlık", alt: "Açılış kartı" },
  { id: "anlatim", ad: "Anlatım", alt: "Görsel + yazı" },
  { id: "liste", ad: "Liste", alt: "2–4 madde" },
  { id: "istatistik", ad: "İstatistik", alt: "Büyük rakam" },
  { id: "alinti", ad: "Alıntı", alt: "Vurgulu söz" },
  { id: "cta", ad: "Çağrı", alt: "Kapanış + eylem" },
];

/* ═══════════ Süre ═══════════ */

const sozcuk = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
/** Türkçe seslendirme ~2,4 sözcük/sn; en az 3 sn. */
export function tahminiSure(s: ExSahne): number {
  const okuma = sozcuk(s.anlatim) / 2.4 + 0.8;
  const liste = s.tur === "liste" ? (s.maddeler?.filter(Boolean).length ?? 0) * 0.6 : 0;
  return Math.max(3, Math.round((okuma + liste) * 10) / 10);
}
/** Sahnenin gerçek süresi: elle kilitlenen > seslendirme > tahmin. */
export function sahneSure(s: ExSahne): number {
  if (s.sure) return s.sure;
  if (s.sesUrl && s.sesSure && s.sesMetni === s.anlatim) return Math.max(2.5, Math.round((s.sesSure + 0.5) * 10) / 10);
  return tahminiSure(s);
}
export const toplamSure = (l: ExSahne[]) => l.reduce((a, s) => a + sahneSure(s), 0);

/* ═══════════ Rakam → istatistik ═══════════ */

/** Metindeki ilk anlamlı rakamı bulur ("%73", "2,4 milyon", "3 kat"). Grafik/istatistik sahnesi önermek için. */
export function rakamBul(metin: string): { deger: string; etiket: string } | null {
  // "yüzde 68" → %68
  const yuzde = metin.match(/yüzde\s?(\d+(?:[.,]\d+)?)/i);
  const m = yuzde ?? metin.match(/(%\s?\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s?(?:%|milyar|milyon|bin|kat|kişi|dakika|saat|gün|yıl|TL|dolar|€|\$)(?:\s?\w+)?)/i);
  if (!m || m.index === undefined) return null;
  const deger = yuzde ? `%${yuzde[1]}` : m[0].replace(/\s+/g, " ").trim();
  // Etiket: rakamın geçtiği cümlenin rakamsız, kısaltılmış hali
  const cumle = metin.split(/(?<=[.!?])\s+/).find((c) => c.includes(m[0])) ?? metin;
  const etiket = cumle.replace(m[0], "").replace(/\s+/g, " ").replace(/^[\s,.-]+|[\s,.-]+$/g, "").split(" ").slice(0, 9).join(" ");
  return { deger, etiket: etiket || "Öne çıkan rakam" };
}

/* ═══════════ Yerel taslak senaryo (AI bağlı değilken) ═══════════ */

const CUMLE = (s: string) => s.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9"“])/).map((x) => x.trim()).filter((x) => x.length > 2);
const kisalt = (s: string, n = 7) => { const w = s.replace(/[.!?]+$/, "").split(/\s+/); return w.length <= n ? w.join(" ") : `${w.slice(0, n).join(" ")}…`; };
const yeni = (p: Partial<ExSahne> & { tur: SahneTur }): ExSahne => ({ id: exId("sh"), baslik: "", anlatim: "", gorselIstem: "", ...p });

/**
 * Metinden sahne: yapıştırılan metni cümlelere böler, hedef süreye göre gruplar;
 * rakam geçen cümleler istatistik, virgülle sayılan öğeler liste sahnesi olur. Kelimeler değişmez.
 */
export function metindenSahneler(konu: string, metin: string, ayar: ExAyar): ExSahne[] {
  const cumleler = CUMLE(metin);
  if (!cumleler.length) return [];
  const hedefSahne = Math.max(3, Math.min(14, Math.round(ayar.hedefSn / 7)));
  const sozHedef = Math.max(10, Math.round(sozcuk(metin) / hedefSahne));
  const gruplar: string[][] = [];
  let g: string[] = [];
  for (const c of cumleler) { g.push(c); if (sozcuk(g.join(" ")) >= sozHedef) { gruplar.push(g); g = []; } }
  if (g.length) gruplar.push(g);
  return gruplar.map((gr, i) => {
    const anlatim = gr.join(" ");
    const r = rakamBul(anlatim);
    // "…: a, b ve c" ya da "…: a, b, c" → liste
    const listeM = anlatim.match(/:\s*([^.:]+?(?:,|\sve\s)[^.:]+?)(?:\.|$)/);
    if (i === 0) return yeni({ tur: "baslik", baslik: konu.trim() ? kisalt(konu, 8) : kisalt(gr[0], 6), anlatim, gorselIstem: konu || gr[0] });
    if (i === gruplar.length - 1 && gruplar.length > 2) return yeni({ tur: "cta", baslik: kisalt(gr[gr.length - 1], 6), anlatim, etiket: "Hemen başla", gorselIstem: anlatim });
    const listeOge = listeM ? listeM[1].split(/,\s*|\s+ve\s+/).map((x) => kisalt(x.trim(), 5)).filter(Boolean).slice(0, 4) : [];
    if (listeOge.length >= 2) return yeni({ tur: "liste", baslik: kisalt(gr.find((c) => c.includes(":"))?.split(":")[0] ?? gr[0], 6), anlatim, maddeler: listeOge, gorselIstem: anlatim });
    if (r) return yeni({ tur: "istatistik", baslik: kisalt(gr[0], 6), anlatim, deger: r.deger, etiket: r.etiket, gorselIstem: anlatim });
    return yeni({ tur: "anlatim", baslik: kisalt(gr[0], 6), anlatim, gorselIstem: anlatim });
  });
}

/** Konunun ilk cümlesi/sorusu (başlık ve anlatım içinde doğal kullanılacak kısa hali). */
function konuKisa(k: string): { baslik: string; soru: boolean } {
  const ilk = k.replace(/\[.*?\]/g, "").trim().split(/(?<=[?.!:])\s+/)[0]?.trim() ?? k;
  const soru = /\?$/.test(ilk);
  return { baslik: kisalt(ilk.replace(/[.!:]+$/, ""), 8), soru };
}

/**
 * Yalnız konu varken: anlatı iskeleti (açılış, sorun, çözüm, nasıl, rakam, özet, çağrı).
 * Konu cümleye gömülmez (Türkçe ek uyumu bozulmasın); metinler kullanıcının düzenleyeceği taslaktır.
 */
export function taslakSenaryo(konu: string, ayar: ExAyar): ExSahne[] {
  const { baslik, soru } = konuKisa(konu || "Konun");
  const ham = konu.trim() || baslik;
  // Konudaki sayı ("3 faydası") madde sayısını ve liste başlığını verir; uydurma rakam/madde basılmaz, alanlar boş kalır (videoda görünmez)
  const sayiM = ham.match(/\b([2-5])\s+(\p{L}+)/u);
  const sayi = sayiM ? Number(sayiM[1]) : 3;
  const nesne = sayiM ? sayiM[2].toLocaleLowerCase("tr").replace(/(ları|leri|sı|si|su|sü|ı|i|u|ü)$/, "") : "";
  const uzun = ayar.hedefSn >= 90;
  return [
    yeni({ tur: "baslik", baslik, anlatim: soru ? "Cevap sandığından basit. Adım adım bakalım." : "Çoğu kişi bunu bilmiyor. Adım adım bakalım.", gorselIstem: `${ham}: dikkat çeken açılış karesi` }),
    yeni({ tur: "anlatim", baslik: "Neden önemli?", anlatim: "", gorselIstem: `${ham}: bunun önemini gösteren gündelik bir an` }),
    yeni({ tur: "liste", baslik: nesne ? `${sayi} ${nesne}` : "Öne çıkanlar", anlatim: nesne ? `İşte ${sayi} ${nesne}.` : "Öne çıkan noktalar şunlar.", maddeler: Array.from({ length: sayi }, () => ""), gorselIstem: `${ham}: maddeleri özetleyen sade kompozisyon` }),
    ...(uzun ? [yeni({ tur: "anlatim", baslik: "Nasıl uygulanır?", anlatim: "", gorselIstem: `${ham}: adım adım uygulama` })] : []),
    yeni({ tur: "cta", baslik: "Şimdi sıra sende", anlatim: "Merak ettiklerini yorumlarda sor, daha fazlası için takipte kal.", etiket: "Takip et", gorselIstem: `${ham}: sıcak kapanış karesi` }),
  ];
}

/* ═══════════ Montaj derleme ═══════════ */

const kId = (p: string) => exId(p);
function klip(p: Partial<MontajKlip> & { ad: string; tur: MontajKlip["tur"]; baslangic: number; sure: number }): MontajKlip {
  return { id: kId("kl"), basKirp: 0, sonKirp: 0, hiz: 1, sesDuzey: p.tur === "ses" ? 100 : 0, opaklik: 100, efektler: [], gecis: "yok", gecisSure: 0.5, ...p };
}
function katman(tur: MontajKatman["tur"], ad: string, klipler: MontajKlip[], ek?: Partial<MontajKatman>): MontajKatman {
  return { id: kId("kat"), tur, ad, klipler, sessiz: false, kilitli: false, gizli: false, ...ek };
}

/** Anlatımı altyazı parçalarına böler (≈5 sözcük ya da noktalama). */
function altyaziParcalari(metin: string): string[] {
  const w = metin.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const l: string[] = []; let p: string[] = [];
  for (const x of w) { p.push(x); if (p.length >= 5 || /[.!?,;:]$/.test(x) && p.length >= 3) { l.push(p.join(" ")); p = []; } }
  if (p.length) l.push(p.join(" "));
  return l;
}

const KOYU: RenkAyar = { pozlama: -32, kontrast: 6, doygunluk: -8, sicaklik: 0, tonlama: 0, parlaklik: 0 };

/**
 * Explainer → montaj projesi. Katman sırası (üstten): ekran yazıları, maddeler, altyazı, görsel, seslendirme, müzik, efekt.
 * `kalici` verilmezse geçici (önizleme/dışa aktarma) proje döner.
 */
export function explainerMontaj(p: ExProje, ek: { marka?: MontajMarka; sfxUrl?: string } = {}): MontajProje {
  const a = p.ayar, st = stilBul(a.stil);
  const dikey = a.oran === "9:16";
  const font = a.marka && ek.marka?.font ? ek.marka.font : st.font;
  const vurgu = a.marka && ek.marka?.renkler?.[0] ? ek.marka.renkler[0] : st.vurgu;
  const yazilar: MontajKlip[] = [], maddeler: MontajKlip[] = [], altyazi: MontajKlip[] = [], gorsel: MontajKlip[] = [], sesler: MontajKlip[] = [], efekt: MontajKlip[] = [];
  const baslikBoyut = dikey ? 84 : 92;
  let t = 0;
  p.sahneler.forEach((s, i) => {
    const d = sahneSure(s);
    const yaziYogun = s.tur !== "anlatim";
    /* Görsel: AI/yüklenen görsel (Ken Burns) > AI video > stil klibi */
    const ortak = { baslangic: t, gecis: i === 0 ? ("fade" as const) : (["fade", "kaydir", "yakinlas", "bulanik"] as const)[i % 4], gecisSure: 0.45, renk: yaziYogun && !(st.acik && !s.gorselUrl && !s.videoUrl) ? KOYU : undefined, efektler: st.acik ? [] : ["vinyet" as const] };
    if (s.gorselUrl && !s.videoUrl) gorsel.push(klip({ ad: s.baslik || `Sahne ${i + 1}`, tur: "gorsel", sure: d, gorselUrl: s.gorselUrl, ...ortak, efektler: ["yakinlas", "vinyet"] }));
    else {
      const src = s.videoUrl ?? stilVideo(a.stil);
      const kaynakSure = s.videoUrl ? Math.max(d, 5) : 10;
      const bas = s.videoUrl ? 0 : (i * 3.1) % Math.max(0.1, kaynakSure - Math.min(d, kaynakSure));
      const yeterli = kaynakSure - bas >= d;
      const hiz = yeterli ? 1 : Math.max(0.4, (kaynakSure - bas) / d);
      gorsel.push(klip({ ad: s.baslik || `Sahne ${i + 1}`, tur: "video", videoUrl: src, sesUrl: src, gorselUrl: s.videoUrl ? s.gorselUrl : stilPoster(a.stil), sure: kaynakSure, basKirp: bas, sonKirp: Math.max(0, kaynakSure - bas - d * hiz), hiz, ...ortak }));
    }
    /* Ekran yazıları — sahne düzenine göre */
    // Açık zeminli stilde (stil klibi üstünde) koyu yazı; görsel/videoda karartılmış zemin üstünde beyaz
    const acikZemin = !!st.acik && !s.gorselUrl && !s.videoUrl;
    const yaziRenk = acikZemin ? st.yazi : "#ffffff";
    const yk = (k: Partial<MontajKlip> & { metin: string }, gec = 0.25, sure = d - gec - 0.15) => yazilar.push(klip({ ad: k.metin.slice(0, 30), tur: "metin", baslangic: t + gec, sure: Math.max(1, sure), metinFont: font, metinRenk: yaziRenk, metinGolge: !acikZemin, metinHiza: "orta", metinCikis: "fade", ...k }));
    if (s.tur === "baslik") {
      yk({ metin: s.baslik, metinStil: "baslik", metinBoyut: baslikBoyut + 16, metinKonum: "orta", metinAnim: "pop" });
    } else if (s.tur === "anlatim") {
      if (s.baslik) yk({ metin: s.baslik, metinStil: "baslik", metinGolge: false, metinBoyut: dikey ? 44 : 40, metinKonum: "ust", metinAnim: "yukari", metinArka: true, metinKutuRenk: vurgu, metinRenk: "#06121a", metinFont: font });
    } else if (s.tur === "liste") {
      yk({ metin: s.baslik, metinStil: "baslik", metinBoyut: baslikBoyut - 10, metinKonum: "ust", metinAnim: "yukari" });
      const l = (s.maddeler ?? []).filter(Boolean).slice(0, 4);
      l.forEach((m, j) => maddeler.push(klip({ ad: m.slice(0, 30), tur: "metin", metin: `${j + 1}  ${m}`, baslangic: t + 0.6 + j * 0.7, sure: Math.max(1, d - 0.75 - j * 0.7), metinStil: "altbaslik", metinBoyut: dikey ? 52 : 54, metinKonum: "orta", konumY: (j - (l.length - 1) / 2) * (dikey ? 9 : 13), metinAnim: "yukari", metinFont: font, metinRenk: "#ffffff", metinArka: true, metinKutuRenk: j % 2 ? "#0b0d10" : "#111827", metinCikis: "fade" })));
    } else if (s.tur === "istatistik") {
      yk({ metin: s.deger || "%0", metinStil: "baslik", metinBoyut: dikey ? 190 : 210, metinKonum: "orta", konumY: -6, metinAnim: "pop", metinRenk: vurgu, metinKontur: 0 });
      if (s.etiket) yk({ metin: s.etiket, metinStil: "altbaslik", metinBoyut: dikey ? 44 : 46, metinKonum: "orta", konumY: dikey ? 11 : 16, metinAnim: "yukari" }, 0.7);
    } else if (s.tur === "alinti") {
      yk({ metin: `“${s.baslik.replace(/^["“]|["”]$/g, "")}”`, metinStil: "alinti", metinBoyut: dikey ? 72 : 78, metinKonum: "orta", metinAnim: "fade", metinFont: font === "caveat" ? "caveat" : "playfair" });
    } else if (s.tur === "cta") {
      yk({ metin: s.baslik, metinStil: "baslik", metinBoyut: baslikBoyut, metinKonum: "orta", konumY: -5, metinAnim: "pop" });
      if (s.etiket) yk({ metin: s.etiket.toLocaleUpperCase("tr"), metinStil: "etiket", metinBoyut: 44, metinKonum: "orta", konumY: dikey ? 8 : 12, metinAnim: "pop", metinArka: true, metinKutuRenk: vurgu, metinRenk: "#06121a" }, 0.8);
    }
    /* Altyazı — seslendirme sözcük zamanlarıyla değil, karakter oranıyla dağıtılır */
    if (a.altyazi !== "yok" && s.anlatim.trim()) {
      const parca = altyaziParcalari(s.anlatim);
      const konusma = s.sesUrl && s.sesSure ? Math.min(d - 0.2, s.sesSure) : d - 0.3;
      const top = parca.reduce((x, y) => x + y.length, 0);
      let c = t + 0.15;
      for (const m of parca) {
        const ds = Math.max(0.6, (m.length / top) * konusma);
        altyazi.push(klip({ ad: m.slice(0, 30), tur: "metin", metin: m, baslangic: c, sure: ds, metinStil: a.altyazi === "altyazi" ? "altyazi" : a.altyazi, metinBoyut: a.altyazi === "tiktok" ? (dikey ? 62 : 56) : dikey ? 50 : 44, metinKonum: "alt", metinAnim: a.altyazi === "tiktok" ? "pop" : "fade", metinCikis: "yok", metinRenk: "#ffffff", vurguRenk: vurgu, metinFont: a.altyazi === "tiktok" ? "montserrat" : font === "caveat" || font === "lobster" ? "poppins" : font }));
        c += ds;
      }
    }
    if (s.sesUrl) sesler.push(klip({ ad: `Ses · ${s.baslik || i + 1}`, tur: "ses", sesUrl: s.sesUrl, baslangic: t + 0.15, sure: s.sesSure ?? d, sesDuzey: 100 }));
    if (ek.sfxUrl && i > 0) efekt.push(klip({ ad: "Geçiş sesi", tur: "ses", sesUrl: ek.sfxUrl, baslangic: Math.max(0, t - 0.25), sure: 0.9, sesDuzey: 55 }));
    t += d;
  });
  const toplam = t;
  if (a.ilerleme && toplam > 0) yazilar.push(klip({ ad: "İlerleme", tur: "metin", oge: { tip: "ilerleme", renk: vurgu }, baslangic: 0, sure: toplam }));
  if (a.marka && ek.marka?.logo && toplam > 0) yazilar.push(klip({ ad: "Logo", tur: "metin", oge: { tip: "logo", renk: "#ffffff" }, gorselUrl: ek.marka.logo, baslangic: 0, sure: toplam, opaklik: 90 }));
  const muzik = a.muzik !== "yok" && a.muzikUrl ? [klip({ ad: "Müzik", tur: "ses", sesUrl: a.muzikUrl, baslangic: 0, sure: Math.ceil(toplam), sesDuzey: 45, sesGiris: 1, sesCikis: 2 })] : [];
  const katmanlar = [
    katman("metin", "Ekran yazıları", yazilar),
    katman("metin", "Maddeler", maddeler),
    katman("metin", "Altyazı", altyazi),
    katman("video", "Görseller", gorsel),
    katman("ses", "Seslendirme", sesler, { rol: "konusma" }),
    katman("ses", "Müzik", muzik, { rol: "muzik" }),
    ...(efekt.length ? [katman("ses", "Efektler", efekt)] : []),
  ];
  return { id: `exm_${p.id}`, ad: p.ad, katmanlar, altyazi: a.altyazi !== "yok", enBoy: a.oran, cozunurluk: "1080p", fps: 30, aiTalimat: "", guncelleme: p.guncelleme, olusturma: p.olusturma, arkaRenk: "#05070a", kisma: true, medya: [] };
}

/** Sahnelerin başlangıç anları (önizlemede sahneye atlamak için). */
export function sahneAnlari(l: ExSahne[]): number[] {
  const r: number[] = []; let t = 0;
  for (const s of l) { r.push(t); t += sahneSure(s); }
  return r;
}

/* ═══════════ Müzik ve geçiş sesi ═══════════ */

export const MUZIK_RUH: Record<Exclude<ExAyar["muzik"], "yok">, { ad: string; bpm: number; minor: boolean; yogunluk: number; parlaklik: number }> = {
  sakin: { ad: "Sakin", bpm: 82, minor: false, yogunluk: 0.35, parlaklik: 0.45 },
  kurumsal: { ad: "Kurumsal", bpm: 104, minor: false, yogunluk: 0.55, parlaklik: 0.65 },
  enerjik: { ad: "Enerjik", bpm: 124, minor: false, yogunluk: 0.85, parlaklik: 0.8 },
  duygusal: { ad: "Duygusal", bpm: 76, minor: true, yogunluk: 0.4, parlaklik: 0.4 },
};

let sfxOnbellek: Promise<string> | null = null;
/** Geçiş "whoosh" sesi: filtrelenmiş beyaz gürültü süpürmesi, tarayıcıda sentezlenir (WAV data URL). */
export function gecisSesi(): Promise<string> {
  sfxOnbellek ??= (async () => {
    const sr = 44100, n = Math.round(sr * 0.9);
    const ctx = new OfflineAudioContext(2, n, sr);
    const buf = ctx.createBuffer(1, n, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const kaynak = ctx.createBufferSource(); kaynak.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, 0); bp.frequency.exponentialRampToValueAtTime(5200, 0.45); bp.frequency.exponentialRampToValueAtTime(900, 0.9);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, 0); g.gain.exponentialRampToValueAtTime(0.9, 0.4); g.gain.exponentialRampToValueAtTime(0.0001, 0.9);
    const pan = ctx.createStereoPanner(); pan.pan.setValueAtTime(-0.7, 0); pan.pan.linearRampToValueAtTime(0.7, 0.9);
    kaynak.connect(bp); bp.connect(g); g.connect(pan); pan.connect(ctx.destination); kaynak.start();
    const r = await ctx.startRendering();
    // WAV kodla
    const kanal = r.numberOfChannels, uz = r.length * kanal * 2 + 44, ab = new ArrayBuffer(uz), v = new DataView(ab);
    const yaz = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    yaz(0, "RIFF"); v.setUint32(4, uz - 8, true); yaz(8, "WAVE"); yaz(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, kanal, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * kanal * 2, true); v.setUint16(32, kanal * 2, true); v.setUint16(34, 16, true); yaz(36, "data"); v.setUint32(40, uz - 44, true);
    let o = 44; for (let i = 0; i < r.length; i++) for (let c = 0; c < kanal; c++) { const x = Math.max(-1, Math.min(1, r.getChannelData(c)[i])); v.setInt16(o, x * 0x7fff, true); o += 2; }
    const blob = new Blob([ab], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  })();
  return sfxOnbellek;
}

/* ═══════════ Telaffuz ═══════════ */

/** Seslendirmeye gidecek metne telaffuz sözlüğünü uygular (ekrandaki yazı değişmez). */
export function telaffuzUygula(metin: string, sozluk: { yazim: string; okunus: string }[]): string {
  let s = metin;
  for (const x of sozluk) if (x.yazim.trim()) s = s.replace(new RegExp(`(?<![\\p{L}])${x.yazim.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "giu"), x.okunus);
  return s;
}
