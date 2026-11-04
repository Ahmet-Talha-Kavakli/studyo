"use client";

import { toast } from "@/lib/toast";
import { saltUrl } from "@/lib/utils";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { videoErisim } from "@/lib/videoSaglayici";

/** Çekim süresini modelin izin verdiği en yakın süreye oturtur (ör. Hailuo yalnız 6 ve 10 sn). */
export function modelSureleri(model: string): number[] {
  const e = videoErisim(model);
  return e.durum === "gercek" && e.sureler.length ? e.sureler : [4, 5, 6, 7, 8, 9, 10];
}
export function sureUydur(model: string, sn: number): number {
  const l = modelSureleri(model);
  return l.reduce((a, b) => (Math.abs(b - sn) < Math.abs(a - sn) ? b : a), l[0]);
}
import { besteWavUrl } from "@/lib/muzikMotoru";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useElements } from "@/store/useElements";
import { useMontaj, type MontajProje, type MontajKlip, type MontajKatman } from "@/store/useMontaj";
import { useFilm, type FilmProje } from "@/store/useFilm";
import { cekimIstemi, cekimAdi, planOlustur, fId, turBul, bolumCekimleri, FILM_KAMERALAR, CEKIM_BOYLARI, ZAMANLAR, HAVALAR, type FilmBolum, type FilmCekim } from "@/lib/filmMotor";
import { kareYakala } from "@/components/studyo/VideoGoruntuleyici";
import { dosyaYukle } from "@/components/montaj/ortak";
import { perdeRengi } from "./ortak";

/** Görsel stiller: kapak + modele giden tarif. */
export const FILM_STILLER = [
  { id: "sinema", ad: "Sinematik", en: "cinematic film still, anamorphic lens, rich color grading, 35mm film grain", kapak: "/gercek/gorsel/mood-teatral-isik.webp" },
  { id: "gercek", ad: "Gerçekçi", en: "photorealistic, natural light, documentary look", kapak: "/gercek/gorsel/mood-doga-isigi.webp" },
  { id: "noir", ad: "Kara film", en: "film noir, high contrast black and white, hard shadows", kapak: "/gercek/gorsel/mood-80ler-korku.webp" },
  { id: "pastel", ad: "Pastel film", en: "soft pastel palette, airy light, indie film look", kapak: "/gercek/gorsel/mood-notr-pastel-film.webp" },
  { id: "neon", ad: "Neon gece", en: "neon-lit night, cyberpunk color palette, wet reflections", kapak: "/gercek/gorsel/mood-y2k-sokak.webp" },
  { id: "animasyon", ad: "2D animasyon", en: "2D animated film, clean shapes, warm palette", kapak: "/gercek/explainer-video/ex-2dillustrator.webp" },
  { id: "3d", ad: "3D animasyon", en: "3D animated feature film look, soft global illumination", kapak: "/gercek/explainer-video/ex-3dmix.webp" },
  { id: "kil", ad: "Kil", en: "claymation stop-motion look, handcrafted textures", kapak: "/gercek/explainer-video/ex-claymotion.webp" },
] as const;
export const stilBul = (id: string) => (id.startsWith("ozel:") ? { id, ad: id.slice(5), en: id.slice(5), kapak: FILM_STILLER[0].kapak } : FILM_STILLER.find((s) => s.id === id) ?? FILM_STILLER[0]);
export const KARE_KREDI = 5;

/** Çekimin seçili ya da son take'i (useProjeler kaydı). */
export function cekimTake(c: FilmCekim, uretimler: Uretim[]): { video?: Uretim; kare?: Uretim; secili?: Uretim } {
  const bul = (id: string) => uretimler.find((u) => u.id === id);
  const l = c.takes.map((t) => ({ t, u: bul(t.uretimId) })).filter((x) => x.u);
  const secili = c.secili ? bul(c.secili) : undefined;
  const video = (secili?.tur === "video" ? secili : undefined) ?? [...l].reverse().find((x) => x.t.tip === "video" && x.u!.durum === "tamam")?.u;
  const kare = [...l].reverse().find((x) => x.t.tip === "kare" && x.u!.durum === "tamam")?.u;
  return { video, kare, secili: secili ?? video ?? kare };
}
export const cekimKredi = (c: FilmCekim, p: FilmProje) => videoKrediHesap(c.model ?? p.model);

const elementAdlari = (c: FilmCekim) => c.elementler.map((id) => useElements.getState().elementler.find((e) => e.id === id)?.ad).filter(Boolean) as string[];

/* ═══════════ Demo eşleme ═══════════
 * Sağlayıcı bağlı değilken taslak kare rastgele stok görsel olmasın: çekimin istemine, perdenin ortamına ve
 * çekim boyuna en yakın sinema karesi seçilir (aynı filmde önceden kullanılanlar geri plana düşer).
 * Demo video, seçili kamera hareketinin kendi örnek klibidir. */
const DEMO_KARELER: [string, string][] = [
  ["sh-city", "şehir gece neon yağmur gökdelen kent genis"], ["sh-street", "sokak gece neon yağmur yürü dedektif adam cadde genis"],
  ["tur-Genel", "büro oda pencere gece adam masa ofis ev iç orta"], ["ps-superdollyin", "yüz adam yakın yağmur bakış dedektif karakter yorgun yakin"],
  ["ps-cry", "kadın yüz ağla gözyaşı hüzün yağmur yakin"], ["top-nala", "kadın cadde sokak kalabalık şehir yürü orta"],
  ["sh-tension", "arka sokak gölge gerilim gece iz karanlık orta"], ["ps-eyes", "göz detay bakış ayrıntı detay"],
  ["ps-train", "tren gar istasyon ray yolculuk genis"], ["ps-static", "katedral kilise ışık sessiz salon genis"],
  ["sh-hero", "gün doğumu tepe zirve yüzleşme doruk şafak genis"], ["sh-open", "sis vadi sabah manzara doğa kapanış genis"],
  ["cs-p1", "sis dağ vadi gün batımı doğa yolculuk genis"], ["sh-dune", "çöl kum gün batımı genis"],
  ["ps-concert", "konser sahne kalabalık müzik ışık performans nakarat genis"], ["top-anime", "neon kadın şehir çatı gece orta"],
  ["ps-car", "araba yol otoyol kaza gece genis"], ["ps-crashzoomout", "kaza enkaz araba kaos patlama genis"],
  ["top-gothic", "uçurum deniz kıyı kadın rüzgar fırtına genis"], ["top-kokboru", "at atlı bozkır gün batımı savaşçı genis"],
  ["cs-hero-avci", "orman avcı karanlık ağaç genis"], ["cs-hero-kokboru", "kurt dağ fırtına vahşi genis"],
  ["ps-sandstorm", "kum fırtına çöl gezgin genis"], ["ps-selfie", "arkadaş gülümse park mutlu gün orta"],
  ["ps-sprint", "koşu stadyum sporcu hız orta"], ["ps-snorricam", "sokak bisiklet adam şehir orta"],
  ["tur-Dram", "sarıl ev şömine aile dram duygusal orta"], ["top-4k", "patlama asker köprü aksiyon savaş genis"],
  ["tur-Epik", "dağ kale epik krallık genis"], ["ps-skate", "kaykay atla şehir hareket orta"],
];
const tr = (s: string) => s.toLocaleLowerCase("tr");
export function demoKareSec(p: FilmProje, c: FilmCekim, kullanilan: Set<string>): string {
  const b = p.bolumler.find((x) => x.cekimler.some((k) => k.id === c.id));
  const metin = tr(`${c.istem} ${b?.mekan ?? ""} ${b?.zaman === "gece" ? "gece" : ""} ${b?.hava === "yagmur" ? "yağmur" : ""} ${b?.hava === "sis" ? "sis" : ""} ${p.logline}`);
  let h = 0; for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const puan = DEMO_KARELER.map(([ad, etiket], n) => {
    const e = etiket.split(" ");
    let s = e.reduce((a, k) => a + (k.length > 2 && metin.includes(k) ? (k === c.boy ? 0 : 2) : 0), 0);
    if (e.includes(c.boy)) s += 1.5;
    if (kullanilan.has(ad)) s -= 8; // önce havuzdaki bütün kareler bir kez kullanılır
    return { ad, s: s + ((h + n * 7) % 10) / 100 };
  }).sort((a, b) => b.s - a.s);
  return `/gercek/sinema/${puan[0].ad}.webp`;
}
/** Demo video: çekimin içeriğine en yakın gerçek klip (kamera adına göre seçilen dağ klibi noir filme gelmesin). */
const DEMO_KLIP: [string, string][] = [
  ["low-shutter", "şehir neon gece sokak cadde kalabalık yürü genis"], ["orbit-right", "şehir çatı gece silüet gün batımı bekle kent genis"],
  ["whip-pan", "şehir meydan tabela reklam kalabalık enerjik genis"], ["dolly-out", "salon koridor depo yalnız figür genis"],
  ["dutch-angle", "sokak gece adam dedektif gerilim arka gölge yabancı orta"], ["action-run", "sokak adam koş takip kaç ara orta"],
  ["push-to-glass", "yağmur cam pencere damla gece detay"], ["hand-transition", "bokeh lamba gece el detay"],
  ["vertigo", "adam büro gerilim karar bakış fark yüz yakin"], ["emotion-zoom", "yüz kadın ağla gözyaşı duygu yakin"],
  ["morph", "göz bakış yüz detay"], ["dolly-in", "oda adam koltuk ev düşünceli büro iç orta"], ["camera-move", "ev salon oda iç modern genis"],
  ["handheld", "pazar çarşı yaşlı usta insan yerel belgesel tanık orta"], ["focus-pull", "kahve fincan sabah sakin masa ürün detay"],
  ["drone-orbit", "dağ zirve kar manzara havadan genis"], ["crane-up", "kıyı deniz uçurum manzara genis"], ["jib-down", "tarla buğday yalnız gün batımı genis"],
  ["orbit-left", "araba ürün reklam otomobil orta"], ["jib-up", "orman ağaç doğa sis genis"], ["zoom-out", "kar çöl uzak yalnız genis"],
  ["tilt-up", "bina gökdelen cam kule genis"], ["k-pop", "dans sahne performans müzik nakarat orta"], ["smoke-transition", "duman bulut fırtına karanlık genis"],
  ["skate-cruise", "yol kaykay gün yaz orta"],
];
/** Demo video: çekimin kendi metni (istem + perde ortamı) ağır, hikâye hafif basar; plan boyu ve kamera eşleşmesi artı, kullanılan klip eksi. */
function demoKlip(p: FilmProje, c: FilmCekim, kullanilan: Set<string> = new Set()) {
  const b = p.bolumler.find((x) => x.cekimler.some((k) => k.id === c.id));
  const cekim = tr(`${c.istem} ${b?.mekan ?? ""} ${b?.zaman === "gece" ? "gece" : ""} ${b?.hava === "yagmur" ? "yağmur" : ""} ${b?.hava === "sis" ? "sis" : ""} ${b?.hava === "kar" ? "kar" : ""}`);
  const hikaye = tr(p.logline);
  const kamera = FILM_KAMERALAR.find((x) => x.id === c.kamera)?.klip;
  const en = DEMO_KLIP.map(([ad, e]) => {
    const k = e.split(" "), boy = k[k.length - 1];
    const s = k.slice(0, -1).reduce((a, w) => a + (w.length > 2 && cekim.includes(w) ? 2 : 0) + (w.length > 2 && hikaye.includes(w) ? 0.4 : 0), 0) + (boy === c.boy ? 1.5 : 0) + (ad === kamera ? 0.5 : 0) - (kullanilan.has(ad) ? 2 : 0);
    return { ad, s };
  }).sort((a, x) => x.s - a.s)[0];
  const k = en && en.s > 0 ? en.ad : kamera ?? "focus-pull";
  return { video: `/gercek/video-hareket/${k}.mp4`, poster: `/gercek/video-hareket/${k}-poster.webp` };
}

/**
 * Çekim üretir: "kare" taslak görsel (ucuz), "video" asıl çekim.
 * Video başlangıç karesi: süreklilik açıksa önceki çekimin seçili videosunun son karesi; değilse çekimin taslak karesi.
 */
export async function cekimUret(p: FilmProje, c: FilmCekim, tip: "kare" | "video", onceki?: FilmCekim): Promise<boolean> {
  const stil = stilBul(p.stil);
  const bolum = p.bolumler.find((x) => x.cekimler.some((k) => k.id === c.id));
  const prompt = cekimIstemi(c, { stil: stil.en, elementAdlari: elementAdlari(c), bolum, hikaye: p.logline });
  const uretimler = useProjeler.getState().uretimler;
  let gorselUrl: string | undefined;
  if (tip === "video") {
    const onc = onceki ? cekimTake(onceki, uretimler).video : undefined;
    if (c.surekli && onc?.videoUrl) { try { gorselUrl = await dosyaYukle(await (await fetch(await kareYakala(onc.videoUrl, "son"))).blob(), "image/jpeg"); } catch { /* son kare alınamadı */ } }
    gorselUrl ??= saltUrl(cekimTake(c, uretimler).kare?.gorselUrl);
  }
  const baslik = `${p.ad} · ${c.baslik}`.slice(0, 60);
  // Bu filmde demo olarak zaten gösterilen kareler (aynı görsel art arda çekimlerde tekrar etmesin)
  const taze = useFilm.getState().projeler.find((x) => x.id === p.id) ?? p; // toplu üretimde p eski kalır; önceki isteklerin karelerini gör
  const kullanilan = new Set(taze.bolumler.flatMap((b) => b.cekimler.flatMap((k) => k.takes)).map((t) => useProjeler.getState().uretimler.find((u) => u.id === t.uretimId)?.meta?.demoOrnek?.match(/sinema\/([^.]+)\.webp/)?.[1]).filter(Boolean) as string[]);
  const r = tip === "kare"
    ? uretimBaslat({ baslik, tur: "gorsel", model: p.kareModel, prompt, kredi: KARE_KREDI, arac: "Uzun Video", meta: { oran: p.oran, hamIstem: c.istem, grupId: p.id, demoOrnek: demoKareSec(p, c, kullanilan) } })
    : uretimBaslat({ baslik, tur: "video", model: c.model ?? p.model, prompt, kredi: cekimKredi(c, p), arac: "Uzun Video", meta: { oran: p.oran, sure: `${sureUydur(c.model ?? p.model, c.sure)}sn`, hamIstem: c.istem, grupId: p.id, demoKlip: demoKlip(p, c, new Set(taze.bolumler.flatMap((b) => b.cekimler.flatMap((k) => k.takes)).map((t) => useProjeler.getState().uretimler.find((u) => u.id === t.uretimId)?.meta?.demoKlip?.video.split("/").pop()?.replace(".mp4", "")).filter(Boolean) as string[])), ...(gorselUrl ? { gorselUrl } : {}) } });
  if (!r.ok || !r.id) { uretimHataToast(r); return false; }
  const take = { uretimId: r.id, tip };
  useFilm.getState().cekimGuncelle(p.id, c.id, { takes: [...c.takes, take], ...(tip === "video" ? { secili: r.id } : {}) });
  return true;
}

/** Toplu üretim (sırayla gönderilir; kredi yetmezse durur). */
export async function topluUret(p: FilmProje, hedef: FilmCekim[], tip: "kare" | "video"): Promise<number> {
  let n = 0;
  const hepsi = p.bolumler.flatMap((b) => b.cekimler);
  for (const c of hedef) {
    const taze = useFilm.getState().projeler.find((x) => x.id === p.id)?.bolumler.flatMap((b) => b.cekimler).find((x) => x.id === c.id) ?? c;
    const i = hepsi.findIndex((x) => x.id === c.id);
    if (!(await cekimUret(p, taze, tip, i > 0 ? hepsi[i - 1] : undefined))) break;
    n++;
  }
  return n;
}

/** Plan: Gemini bağlıysa AI; değilse türün perde şablonu. */
let planDurum: Promise<boolean> | null = null;
export const planlayiciHazir = () => (planDurum ??= fetch("/api/film/plan").then((r) => r.json()).then((j: { hazir?: boolean }) => !!j.hazir).catch(() => false));

export async function planKur(o: { logline: string; tur: FilmProje["tur"]; hedefDk: number; ton: string }): Promise<{ bolumler: FilmBolum[]; kaynak: "ai" | "sablon" }> {
  const t = turBul(o.tur);
  if (await planlayiciHazir()) {
    try {
      const r = await fetch("/api/film/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logline: o.logline, tur: t.ad, ton: o.ton, hedefDk: o.hedefDk, bolumSayisi: Math.min(12, Math.max(4, Math.round(o.hedefDk * 60 / 90))), cekimBasina: 4 }) });
      const j = (await r.json()) as { ok: boolean; bolumler?: { baslik: string; ozet: string; anlatim?: string; mekan?: string; zaman?: string; hava?: string; cekimler: { baslik: string; istem: string; boy: string; kamera: string }[] }[] };
      if (j.ok && j.bolumler?.length) {
        const toplam = o.hedefDk * 60, pay = toplam / j.bolumler.length;
        return {
          kaynak: "ai",
          bolumler: j.bolumler.map((b, i) => ({
            id: fId("bl"), baslik: b.baslik, ozet: b.ozet, anlatim: b.anlatim ?? "", hedefSn: Math.round(pay), acik: i === 0,
            mekan: b.mekan?.slice(0, 40) || undefined, zaman: ZAMANLAR.some((z) => z.id === b.zaman) ? b.zaman : undefined, hava: HAVALAR.some((z) => z.id === b.hava) ? b.hava : undefined,
            cekimler: b.cekimler.map((c, k) => ({ id: fId("ck"), baslik: c.baslik, istem: c.istem, boy: (["genis", "orta", "yakin", "detay", "omuz"].includes(c.boy) ? c.boy : "orta") as FilmCekim["boy"], kamera: c.kamera || "sabit", sure: Math.max(4, Math.min(10, Math.round(pay / Math.max(1, b.cekimler.length)))), elementler: [], surekli: k > 0, takes: [] })),
          })),
        };
      }
    } catch { /* şablona düş */ }
  }
  return { kaynak: "sablon", bolumler: planOlustur(o) };
}

/** Bölümün kalan çekimlerini hedef süreyi dolduracak şekilde ekler. */
export function bolumuDoldur(p: FilmProje, b: FilmBolum): number {
  const t = turBul(p.tur);
  const sablon = t.bolumler.find((x) => b.baslik.startsWith(x.ad)) ?? t.bolumler[0];
  const eksik = b.hedefSn - b.cekimler.reduce((a, c) => a + c.sure, 0);
  if (eksik < 3) return 0;
  const n = Math.max(1, Math.round(eksik / t.ortCekim));
  const yeni = bolumCekimleri(b.baslik, b.ozet, sablon, p.logline, eksik, t.ortCekim, n, p.tur, b.cekimler.length).map((c, i) => ({ ...c, baslik: `${b.baslik} · ${b.cekimler.length + i + 1}` }));
  useFilm.getState().bolumYaz(p.id, (l) => l.map((x) => (x.id === b.id ? { ...x, cekimler: [...x.cekimler, ...yeni] } : x)));
  return n;
}

/* ═══════════ Animatik / montaj derleme ═══════════ */

/** Karesi olmayan çekimin storyboard zemini: düz siyah yerine perde renginde üstten süzülen yumuşak ışık. */
const slateZemin = (renk: string) => "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" preserveAspectRatio="none"><defs><radialGradient id="g" cx="50%" cy="-10%" r="95%"><stop offset="0" stop-color="${renk}" stop-opacity="0.26"/><stop offset="0.6" stop-color="${renk}" stop-opacity="0.05"/><stop offset="1" stop-color="${renk}" stop-opacity="0"/></radialGradient><radialGradient id="v" cx="50%" cy="50%" r="75%"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient></defs><rect width="1920" height="1080" fill="#101114"/><rect width="1920" height="1080" fill="url(#g)"/><rect width="1920" height="1080" fill="url(#v)"/></svg>`);

const klip = (k: Partial<MontajKlip> & { ad: string; tur: MontajKlip["tur"]; baslangic: number; sure: number }): MontajKlip => ({ id: fId("kl"), basKirp: 0, sonKirp: 0, hiz: 1, sesDuzey: k.tur === "ses" ? 100 : 0, opaklik: 100, efektler: [], gecis: "yok", gecisSure: 0.4, ...k });
const katman = (tur: MontajKatman["tur"], ad: string, klipler: MontajKlip[], ek?: Partial<MontajKatman>): MontajKatman => ({ id: fId("kat"), tur, ad, klipler, sessiz: false, kilitli: false, gizli: false, ...ek });

/**
 * Film → montaj projesi. Her çekim: seçili video > taslak kare (yavaş yakınlaşma) > stil kapağı (yer tutucu).
 * Bölüm başlarında başlık kartı; isteğe bağlı müzik.
 */
export function filmMontaj(p: FilmProje, uretimler: Uretim[], o: { basliklar?: boolean; muzikUrl?: string } = {}): MontajProje {
  const goruntu: MontajKlip[] = [], yazi: MontajKlip[] = [];
  const stil = stilBul(p.stil);
  let t = 0;
  for (const [bi, b] of p.bolumler.entries()) {
    if (o.basliklar !== false && b.cekimler.length) yazi.push(klip({ ad: b.baslik, tur: "metin", metin: b.baslik, baslangic: t + 0.2, sure: Math.min(2.6, b.cekimler[0].sure - 0.3), metinStil: "sinematik", metinBoyut: 52, metinKonum: "ust", metinAnim: "fade", metinCikis: "fade" }));
    for (const c of b.cekimler) {
      const { video, kare } = cekimTake(c, uretimler);
      const gecis = goruntu.length ? ("fade" as const) : ("yok" as const);
      if (video?.videoUrl) goruntu.push(klip({ ad: c.baslik, tur: "video", videoUrl: video.videoUrl, sesUrl: video.videoUrl, gorselUrl: saltUrl(video.gorselUrl), baslangic: t, sure: c.sure, sesDuzey: 100, gecis }));
      else if (saltUrl(kare?.gorselUrl)) goruntu.push(klip({ ad: c.baslik, tur: "gorsel", gorselUrl: saltUrl(kare!.gorselUrl), baslangic: t, sure: c.sure, efektler: ["yakinlas"], gecis }));
      // Karesi olmayan çekim: alakasız bir görsel yerine koyu zemin üstünde çekimin kendi açıklaması (storyboard yer tutucusu)
      else {
        goruntu.push(klip({ ad: `${c.baslik} zemin`, tur: "gorsel", gorselUrl: slateZemin(perdeRengi(bi)), baslangic: t, sure: c.sure, gecis }));
        yazi.push(klip({ ad: c.baslik, tur: "metin", metin: cekimAdi(c), baslangic: t, sure: c.sure, metinBoyut: 54, metinKonum: "orta", metinRenk: "#ffffffd9", metinAnim: "yok", metinCikis: "yok" }));
        yazi.push(klip({ ad: `${c.baslik} künye`, tur: "metin", metin: [CEKIM_BOYLARI.find((x) => x.id === c.boy)?.ad, FILM_KAMERALAR.find((x) => x.id === c.kamera)?.ad, `${c.sure} sn`, "taslak kare yok"].filter(Boolean).join("  ·  "), baslangic: t, sure: c.sure, metinBoyut: 30, metinKonum: "alt", metinRenk: "#ffffff73", metinAnim: "yok", metinCikis: "yok" }));
      }
      t += c.sure;
    }
  }
  const muzik = o.muzikUrl ? [klip({ ad: "Müzik", tur: "ses", sesUrl: o.muzikUrl, baslangic: 0, sure: Math.ceil(t), sesDuzey: 45, sesGiris: 1, sesCikis: 2 })] : [];
  return {
    id: `flm_${p.id}`, ad: p.ad, enBoy: p.oran, cozunurluk: "1080p", fps: 30, aiTalimat: "", altyazi: false, guncelleme: p.guncelleme, olusturma: p.olusturma, arkaRenk: "#05070a", kisma: true, medya: [],
    katmanlar: [katman("metin", "Bölüm başlıkları", yazi), katman("video", "Çekimler", goruntu), katman("ses", "Müzik", muzik, { rol: "muzik" })],
  };
}

/** Montaj Stüdyosu'na gerçek proje olarak aktarır (müzik varsa bestelenir). */
export async function montajaAktar(p: FilmProje): Promise<string> {
  let muzikUrl: string | undefined;
  if (p.muzik !== "yok") {
    const sure = Math.ceil(p.bolumler.reduce((a, b) => a + b.cekimler.reduce((x, c) => x + c.sure, 0), 0));
    const ayar = { sakin: [82, false, 0.35], kurumsal: [104, false, 0.55], enerjik: [124, false, 0.85], duygusal: [76, true, 0.4] }[p.muzik] as [number, boolean, number];
    try { muzikUrl = await dosyaYukle(await (await fetch(await besteWavUrl({ tohum: p.id, bpm: ayar[0], key: "A", minor: ayar[1], sure: Math.min(600, sure), yogunluk: ayar[2], parlaklik: 0.6, enstrumantal: true }))).blob(), "audio/wav"); } catch { /* müziksiz */ }
  }
  const m = filmMontaj(p, useProjeler.getState().uretimler, { muzikUrl });
  const ms = useMontaj.getState();
  const id = ms.projeOlustur({ ad: p.ad, enBoy: m.enBoy, katmanlar: m.katmanlar, arkaRenk: m.arkaRenk });
  ms.projeGuncelle(id, { kisma: true });
  toast.success("Montaj Stüdyosu'na aktarıldı", { description: "Çekimler, bölüm başlıkları ve müzik ayrı katmanlarda duruyor." });
  return id;
}
