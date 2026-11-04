"use client";

import { uretimBaslat } from "@/lib/uretimMotoru";
import { useProjeler } from "@/store/useProjeler";
import { useAuth } from "@/store/useAuth";
import { yerelBuyut } from "@/lib/yerelBuyut";
import { besteWavUrl } from "@/lib/muzikMotoru";
import { gorselYukle } from "@/components/arac/kit";
import { dosyaYukle } from "@/components/montaj/ortak";
import { kareYakala } from "@/components/studyo/VideoGoruntuleyici";
import { HAREKETLER } from "@/components/studyo/video/veri";
import { bosYanit, olayUygula, sohbetAkisi, yanitMetni, SC_VARSAYILAN_MODEL, type ScOlay } from "@/lib/scSohbet";
import { SESLER, SES_URETIM_MODELLERI } from "@/lib/sesVeri";
import { KATALOG, dugumKredi, type PortTip } from "./katalog";
import { ayarKredi, ayarNormalize, sonKareDestek } from "./ayarlar";
import { dataUrlAl, katmanBirlestir, kirpBoyutla, kolajYap, renkAyarla, yaziEkle } from "./yerelIslem";
import { videoIsle } from "./videoIslem";
import { aktifCikti, useTuval, yeniId, type CalismaAdim, type CalismaKaydi, type Dugum, type Surum, type Tuval } from "@/store/useTuval";
import { MODELLER_3D, STILLER } from "@/components/studyo/ucboyut/veri";

/**
 * Canvas çalıştırıcısı: düğümün girdilerini (bağlı düğümlerin AKTİF sürümleri) toplar, gerçek üretim motorunu
 * stüdyolarla aynı istek alanlarıyla çağırır, sonucu düğümün sürüm geçmişine ekler.
 * Liste girdisi (Liste düğümü ya da liste çıktılı Asistan) varsa düğüm her öğe için ayrı çalışır.
 * "Tümünü çalıştır" bağımlılık sırasıyla ilerler; başarısız adıma bağlı adımlar atlanır. Sağlayıcı yoksa çıktılar "demo".
 */
export type Girdi = { port: string; tip: PortTip; metin?: string; url?: string; liste?: string[]; kaynak: string };

/** CSS arka planı ("url(...) center/cover") ya da düz adres → adres. */
export const adresAyikla = (u?: string) => (!u ? undefined : /^(data:|https?:|\/|blob:)/.test(u) ? u : u.match(/url\(["']?([^"')]+)["']?\)/)?.[1]);
/** Metni liste öğelerine böl (numara ve madde işaretleri atılır). */
export const listeAyir = (m: string) => m.split(/\r?\n/).map((x) => x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim()).filter((x) => x.length > 1).slice(0, 20);

export function girdileriTopla(t: Tuval, d: Dugum): Girdi[] {
  return t.kenarlar.filter((e) => e.hedef === d.id).flatMap((e): Girdi[] => {
    const k = t.dugumler.find((x) => x.id === e.kaynak); if (!k) return [];
    const tip = KATALOG[k.tur].cikti!;
    if (k.tur === "istem") return k.metin?.trim() ? [{ port: e.port, tip, metin: k.metin.trim(), kaynak: k.id }] : [];
    if (k.tur === "liste") { const l = listeAyir(k.metin ?? ""); return l.length ? [{ port: e.port, tip, liste: l, metin: l[0], kaynak: k.id }] : []; }
    const c = aktifCikti(k); if (!c) return [];
    if (((k.tur === "asistan" && k.ayar.cikti === "liste") || k.tur === "sahneler") && c.metin) { const l = listeAyir(c.metin); return [{ port: e.port, tip, liste: l, metin: l[0], kaynak: k.id }]; }
    return [{ port: e.port, tip, metin: c.metin, url: c.url, kaynak: k.id }];
  });
}

/** Liste girdisi varsa öğeleri (yoksa tek "boş" öğe). */
export const ogeler = (g: Girdi[]) => g.find((x) => x.liste?.length)?.liste ?? [""];
/** Listeyi bütün olarak tüketen düğümler (her öğe için ayrı çalışmaz). */
const LISTE_TUKETEN = new Set(["sec", "kolaj", "videoBirlestir"]);
export const dugumOgeleri = (d: Pick<Dugum, "tur">, g: Girdi[]) => (LISTE_TUKETEN.has(d.tur) ? [""] : ogeler(g));

/** Düğüm çalışmaya hazır mı; değilse nedeni. */
export function hazirMi(t: Tuval, d: Dugum): string | null {
  const tn = KATALOG[d.tur];
  if (!tn.calisir) return "Bu düğüm çalıştırılmaz.";
  const g = girdileriTopla(t, d);
  for (const gi of tn.girisler) {
    const bagli = t.kenarlar.some((e) => e.hedef === d.id && e.port === gi.id);
    if (bagli && !g.some((x) => x.port === gi.id)) return `${gi.ad} girdisi henüz hazır değil`;
    if (gi.zorunlu && !bagli) return `${gi.ad} bağla`;
  }
  if (d.tur === "ses") { const m = SES_URETIM_MODELLERI.find((x) => x.ad === d.model); if (m && !m.saglayici) return "Bu ses modeli yakında"; }
  if (tn.istemli) {
    const metin = [...g.filter((x) => x.tip === "metin" && x.port !== "soz").map((x) => x.metin), d.metin].filter(Boolean).join(" ").trim();
    if (d.tur === "video" && !metin && !g.some((x) => x.port === "kare")) return "İstem yaz ya da ilk kare bağla";
    if (d.tur === "maske") { if (!d.ayar.maskeUrl) return "Değişecek alanı boya"; if (d.ayar.mod === "sil" || metin) return null; return "Boyanan alanda ne olacağını yaz"; }
    if (d.tur === "yazi") { if (!metin) return "Eklenecek yazıyı gir ya da bağla"; return null; }
    if (d.tur === "birlestir") { if (!metin && !g.length) return "Metin bağla ya da şablon yaz"; return null; }
    if (d.tur === "genislet" || d.tur === "isik" || d.tur === "videoUzat" || d.tur === "sahneler" && g.length || d.tur === "gelistir" && g.length) return null;
    if (d.tur !== "video" && d.tur !== "asistan" && !metin) return d.tur === "ses" ? "Okunacak metni yaz ya da bağla" : d.tur === "efekt" ? "Sesi tarif et" : "İstem yaz ya da bir istem bağla";
    if (d.tur === "asistan" && !metin && !g.length) return "Asistana ne yazdıracağını söyle";
  }
  return null;
}

export const tahminiKredi = (t: Tuval, d: Dugum) => { const g = girdileriTopla(t, d); return dugumKredi(d, g.filter((x) => x.tip === "metin").map((x) => x.metin).join(" "), dugumOgeleri(d, g).length); };

const iptaller = new Set<string>();
export const iptalEt = (dugumId: string) => iptaller.add(dugumId);

const yaz = (tuvalId: string, dugumId: string, p: Partial<Dugum> | ((d: Dugum) => Partial<Dugum>)) =>
  useTuval.getState().guncelle(tuvalId, (t) => ({ ...t, dugumler: t.dugumler.map((d) => (d.id === dugumId ? { ...d, ...(typeof p === "function" ? p(d) : p) } : d)) }), false);

/** Bir üretim kaydını bitene kadar bekler. */
function uretimBekle(id: string) {
  return new Promise<{ gorselUrl?: string; videoUrl?: string; sesUrl?: string; gercek?: boolean; durum: string; hata?: string; meta?: { demoKlip?: { video: string; poster: string } } }>((coz) => {
    const kontrol = () => { const x = useProjeler.getState().uretimler.find((v) => v.id === id); if (x && (x.durum === "tamam" || x.durum === "hata")) { coz(x as never); return true; } return false; };
    if (kontrol()) return;
    const iptal = useProjeler.subscribe(() => { if (kontrol()) iptal(); });
  });
}
async function basla(istek: Parameters<typeof uretimBaslat>[0]) {
  const r = uretimBaslat(istek);
  if (!r.ok || !r.id) throw new Error(r.hata ?? "Başlatılamadı");
  const u = await uretimBekle(r.id);
  if (u.durum === "hata") throw new Error(u.hata ?? "Sağlayıcı hatası; kredi iade edildi");
  return u;
}

let saglayici: Record<string, boolean> | null = null;
async function saglayiciDurum() {
  if (saglayici) return saglayici;
  try { saglayici = ((await (await fetch("/api/saglayici-durum")).json()) as { saglayicilar?: Record<string, boolean> }).saglayicilar ?? {}; } catch { saglayici = {}; }
  return saglayici;
}

/** Aşağı akıştaki düğümleri "eski" işaretle (girdisi değişti). */
export function asagiEski(tuvalId: string, dugumId: string) {
  useTuval.getState().guncelle(tuvalId, (t) => {
    const ulas = new Set<string>(); const yigin = [dugumId];
    while (yigin.length) { const u = yigin.pop()!; t.kenarlar.filter((e) => e.kaynak === u).forEach((e) => { if (!ulas.has(e.hedef)) { ulas.add(e.hedef); yigin.push(e.hedef); } }); }
    return { ...t, dugumler: t.dugumler.map((d) => (ulas.has(d.id) && d.surumler.length ? { ...d, eski: true } : d)) };
  }, false);
}

/** Tek bir öğe için üretim; sürüm listesi döner. */
async function tekCalistir(d: Dugum, g: Girdi[], oge: string): Promise<Surum[]> {
  const model = d.model ?? KATALOG[d.tur].model;
  const a = ayarNormalize(d.tur, model, d.ayar);
  const metinler = g.filter((x) => x.tip === "metin" && x.port !== "soz").map((x) => (x.liste ? oge : x.metin));
  const metin = [...metinler, d.metin?.trim()].filter(Boolean).join("\n").trim();
  const url = (port: string) => g.filter((x) => x.port === port).map((x) => adresAyikla(x.url)).filter(Boolean) as string[];
  const s: Surum[] = [];
  const yeni = (p: Omit<Surum, "id" | "zaman">) => s.push({ id: yeniId("s"), zaman: Date.now(), ...p, ...(oge ? { metin: p.metin ?? oge } : {}) });

  if (d.tur === "gorsel" || d.tur === "duzenle") {
    const refs = url("ref"); const kaynak = url("gorsel")[0];
    const n = d.tur === "gorsel" ? Math.max(1, Math.min(4, Number(a.adet ?? 1))) : 1;
    const birim = ayarKredi(d.tur, model, { ...a, adet: 1 });
    const meta = {
      hamIstem: metin, ...(a.oran && a.oran !== "Auto" ? { oran: String(a.oran) } : d.tur === "duzenle" ? { oran: "Auto" } : {}),
      ...(a.cozunurluk ? { cozunurluk: String(a.cozunurluk) } : {}), ...(a.kalite ? { kalite: String(a.kalite) } : {}),
      ...(a.seffaf ? { seffaf: true } : {}), ...(a.negatif ? { negatif: String(a.negatif) } : {}), ...(a.tohum !== undefined && a.tohum !== "" ? { tohum: Number(a.tohum) } : {}),
      ...(d.tur === "duzenle" ? { islem: "duzenle" as const, gorselUrl: kaynak, ...(refs.length ? { referanslar: refs } : {}) } : refs.length ? { referanslar: refs, islem: "uret" as const } : {}),
    };
    const sonuclar = await Promise.all(Array.from({ length: n }, () => basla({ baslik: metin.slice(0, 40) || (d.tur === "duzenle" ? "Canvas düzenleme" : "Canvas görseli"), tur: "gorsel", model: model!, prompt: metin, kredi: birim, arac: "Canvas", meta })));
    sonuclar.forEach((u) => yeni({ tip: "gorsel", url: adresAyikla(u.gorselUrl), demo: !u.gercek }));
  } else if (d.tur === "video") {
    const kare = url("kare")[0], son = url("son")[0];
    const h = HAREKETLER.find((x) => x.ad === a.hareket);
    const istem = metin || (h ? `Animate the scene with ${h.en}` : "Animate the starting frame naturally");
    const prompt = h ? `${istem}${/[.!?]$/.test(istem) ? "" : "."} Camera and motion: ${h.en}.` : istem;
    const u = await basla({ baslik: metin.slice(0, 40) || "Canvas videosu", tur: "video", model: model!, prompt, kredi: ayarKredi("video", model, a), arac: "Canvas",
      meta: { hamIstem: metin, ...(a.sure ? { sure: `${a.sure}sn` } : {}), ...(a.cozunurluk ? { cozunurluk: String(a.cozunurluk) } : {}), ...(a.oran ? { oran: String(a.oran) } : {}),
        ...(h ? { hareket: h.ad } : {}), ...(a.cokCekim ? { cokCekim: true } : {}), ...(a.ses ? { ses: "Açık" } : {}),
        ...(kare ? { gorselUrl: kare } : {}), ...(kare && son && sonKareDestek(model) ? { bitisKareUrl: son } : {}) } });
    yeni({ tip: "video", url: u.videoUrl ?? u.meta?.demoKlip?.video, poster: adresAyikla(u.meta?.demoKlip?.poster ?? u.gorselUrl), demo: !u.gercek });
  } else if (d.tur === "ses") {
    const ses = SESLER.find((x) => x.ad === d.ayar.sesAd) ?? SESLER.find((x) => x.ad === "George") ?? SESLER[0];
    const m = SES_URETIM_MODELLERI.find((x) => x.ad === model);
    const u = await basla({ baslik: metin.slice(0, 40), tur: "ses", model: model!, prompt: metin, kredi: ayarKredi("ses", model, a, metin.length), arac: "Canvas",
      meta: { mod: "seslendirme", ses: ses.ad, ...(ses.sesId ? { sesId: ses.sesId } : {}), hamIstem: metin, karakter: metin.length, bicim: String(a.bicim ?? "mp3_44100_128"),
        kararlilik: Number(a.kararlilik ?? 0.5), ...(a.dil ? { dil: String(a.dil) } : {}), ...(m?.ayrintiliAyar ? { hiz: Number(a.hiz ?? 1), benzerlik: Number(a.benzerlik ?? 0.75), stil: Number(a.stil ?? 0) } : {}),
        ...(a.tohum !== undefined && a.tohum !== "" ? { tohum: Number(a.tohum) } : {}) } });
    yeni({ tip: "ses", url: u.sesUrl, metin, demo: !u.gercek || !u.sesUrl });
  } else if (d.tur === "efekt") {
    const u = await basla({ baslik: metin.slice(0, 40), tur: "ses", model: "Eleven Sound Effects", prompt: metin, kredi: ayarKredi("efekt", model, a), arac: "Canvas",
      meta: { mod: "efekt", hamIstem: metin, dongu: !!a.dongu, istemEtkisi: Number(a.istemEtkisi ?? 0.3), ...(a.sure ? { efektSn: Number(a.sure) } : {}) } });
    yeni({ tip: "ses", url: u.sesUrl, metin, demo: !u.gercek || !u.sesUrl });
  } else if (d.tur === "muzik") {
    const soz = g.find((x) => x.port === "soz")?.metin ?? "";
    const sureSn = a.sure ? Number(a.sure) : null;
    const kredi = ayarKredi("muzik", model, a);
    const sg = await saglayiciDurum();
    if (sg.eleven && /^Eleven/.test(model ?? "")) {
      if (!useAuth.getState().krediDus(kredi)) throw new Error(`Yetersiz kredi (${kredi})`);
      const r = (await (await fetch("/api/muzik/uret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, istem: metin, sozler: a.enstrumantal ? "" : soz, stiller: [], haric: a.haric ? String(a.haric).split(",").map((x) => x.trim()).filter(Boolean) : [], enstrumantal: !!a.enstrumantal, sureSn }) })).json()) as { ok: boolean; sesUrl?: string; hata?: string };
      if (!r.ok || !r.sesUrl) { useAuth.getState().krediEkle(kredi); throw new Error(r.hata ?? "Müzik üretilemedi; kredi iade edildi"); }
      useProjeler.getState().ekle({ baslik: metin.slice(0, 40), tur: "muzik", model: model!, prompt: metin, durum: "tamam", ilerleme: 100, kredi, arac: "Canvas", sesUrl: r.sesUrl, gercek: true, saglayici: "eleven" });
      yeni({ tip: "ses", url: r.sesUrl, metin });
    } else {
      // Sağlayıcı yok: tarayıcıda gerçek bir enstrümantal sentezlenir (kredi düşmez, "demo" işaretli).
      const hizli = /hızlı|enerjik|aksiyon|dans|tempo|heyecan|upbeat|edm/i.test(metin), huzun = /hüzün|duygusal|yavaş|sakin|melankolik|lofi|piano/i.test(metin);
      const wav = await besteWavUrl({ tohum: metin, bpm: hizli ? 128 : huzun ? 78 : 104, key: "A", minor: huzun || !hizli, sure: Math.min(60, sureSn ?? 30), yogunluk: hizli ? 0.85 : huzun ? 0.35 : 0.6, parlaklik: hizli ? 0.75 : 0.5, enstrumantal: true });
      const u = await dosyaYukle(await (await fetch(wav)).blob(), "audio/wav");
      yeni({ tip: "ses", url: u, metin: `${metin} · tarayıcıda sentezlendi`, demo: true });
    }
  } else if (d.tur === "sonKare") {
    const v = url("video")[0]; if (!v) throw new Error("Video bağla");
    const an = a.an === "ilk" ? 0.05 : a.an === "orta" ? "orta" : "son";
    const ad = an === 0.05 ? "İlk kare" : an === "orta" ? "Ortadaki kare" : "Son kare";
    const veri = await kareYakala(v, an).catch(() => { throw new Error(`Videonun ${ad.toLocaleLowerCase("tr")}si alınamadı`); });
    yeni({ tip: "gorsel", url: await gorselYukle(veri).catch(() => veri), metin: ad });
  } else if (d.tur === "katman") {
    const zemin = g.find((y) => y.port === "zemin")?.url, ust = g.find((y) => y.port === "ust")?.url;
    if (!zemin || !ust) throw new Error("Zemin ve üst katman görsellerini bağla");
    const r = await katmanBirlestir(zemin, ust, a);
    yeni({ tip: "gorsel", url: await gorselYukle(r.url).catch(() => r.url), metin: `${r.w}×${r.h}` });
  } else if (d.tur === "buyut") {
    const kaynak = url("gorsel")[0]; if (!kaynak) throw new Error("Görsel bağla");
    const r = await yerelBuyut(kaynak, Number(a.olcek ?? 2), Number(a.keskinlik ?? 0.35));
    yeni({ tip: "gorsel", url: await gorselYukle(r.url).catch(() => r.url), metin: `${r.w}×${r.h}` });
  } else if (d.tur === "arkaplan") {
    const u = await basla({ baslik: "Arka plan kaldırma", tur: "gorsel", model: "Nano Banana 2.1", prompt: "Ürünün arka planını kaldır", kredi: 1, arac: "Canvas", meta: { islem: "arkaplan", gorselUrl: url("gorsel")[0], zemin: "seffaf" } });
    yeni({ tip: "gorsel", url: adresAyikla(u.gorselUrl), demo: !u.gercek });
  } else if (d.tur === "maske") {
    const kaynak = url("gorsel")[0]; if (!kaynak) throw new Error("Görsel bağla");
    const maskeUrl = String(d.ayar.maskeUrl ?? ""); if (!maskeUrl) throw new Error("Değişecek alanı boya");
    const sil = d.ayar.mod === "sil";
    const not = sil ? "Boyanan alandaki nesneyi kaldır, çevresiyle doğal doldur." : `İşaretli alanda: ${metin}. Maskenin dışını değiştirme.`;
    const u = await basla({ baslik: sil ? "Nesne silme" : `Bölgesel · ${metin.slice(0, 30)}`, tur: "gorsel", model: "Bölgesel Düzenleme", prompt: not, kredi: ayarKredi("maske", model, a), arac: "Canvas",
      meta: { islem: sil ? "sil" : "maske", gorselUrl: kaynak, maskeUrl: new URL(maskeUrl, location.href).href, hamIstem: not } });
    yeni({ tip: "gorsel", url: adresAyikla(u.gorselUrl), demo: !u.gercek });
  } else if (d.tur === "genislet" || d.tur === "isik" || d.tur === "zemin" || d.tur === "eskiz") {
    const kaynak = url("gorsel")[0]; if (!kaynak) throw new Error("Görsel bağla");
    const islem = d.tur === "genislet" ? "genislet" : d.tur === "isik" ? "isik" : d.tur === "zemin" ? "zemin-degistir" : "eskiz";
    const not = d.tur === "genislet" ? `Görseli ${a.oran} orana genişlet (outpaint); mevcut içeriği koru, yeni kenarları doğal doldur.${metin ? ` Yeni alanlarda: ${metin}` : ""}`
      : d.tur === "isik" ? `${String(a.sertlik).toLocaleLowerCase("tr")}, ${String(a.renk).toLocaleLowerCase("tr")} ışık${metin ? `, ${metin}` : ""}`
      : metin;
    const arac = { genislet: "Yeniden Çerçevele", isik: "Yeniden Işıklandır", zemin: "Zemin Değiştir", eskiz: "Eskizden Görsel" }[d.tur];
    const u = await basla({ baslik: `${arac}${metin ? ` · ${metin.slice(0, 30)}` : ""}`, tur: "gorsel", model: arac, prompt: not, kredi: ayarKredi(d.tur, model, a), arac: "Canvas",
      meta: { islem, gorselUrl: kaynak, hamIstem: not, ...(d.tur === "genislet" ? { oran: String(a.oran) } : {}), ...(d.tur === "isik" ? { yon: ({ Sol: "Left", Sağ: "Right", Üst: "Top", Arka: "Behind", Ön: "Front", Alt: "Bottom" } as Record<string, string>)[String(a.yon)] ?? "Left" } : {}) } });
    yeni({ tip: "gorsel", url: adresAyikla(u.gorselUrl), demo: !u.gercek });
  } else if (d.tur === "yuz" || d.tur === "giydir") {
    const [a1, a2] = d.tur === "yuz" ? [url("yuz")[0], url("hedef")[0]] : [url("model")[0], url("kiyafet")[0]];
    if (!a1 || !a2) throw new Error(d.tur === "yuz" ? "Yüz ve hedef görsel bağla" : "Model ve kıyafet görseli bağla");
    const arac = d.tur === "yuz" ? "Yüz Değiştir" : "Sanal Giydirme";
    const u = await basla({ baslik: arac, tur: "gorsel", model: arac, prompt: arac, kredi: ayarKredi(d.tur, model, a), arac: "Canvas",
      meta: { islem: d.tur === "yuz" ? "swap-yuz" : "giydir", referanslar: [a1, a2], oran: "Auto", ...(d.tur === "giydir" ? { giysi: { kategori: String(a.kategori), foto: String(a.foto), mod: String(a.mod) } } : {}) } });
    yeni({ tip: "gorsel", url: adresAyikla(u.gorselUrl), demo: !u.gercek });
  } else if (d.tur === "aiBuyut" || d.tur === "videoBuyut") {
    const kaynak = url(d.tur === "aiBuyut" ? "gorsel" : "video")[0]; if (!kaynak) throw new Error(d.tur === "aiBuyut" ? "Görsel bağla" : "Video bağla");
    const sg = await fetch("/api/upscale/durum").then((x) => x.json()).catch(() => ({ fal: false })) as { fal?: boolean };
    const olcek = Number(a.olcek ?? 2);
    if (!sg.fal) {
      if (d.tur === "videoBuyut") throw new Error("Video büyütme sağlayıcısı bağlı değil");
      // Sağlayıcı yok: tarayıcıda büyütülür (ücretsiz, "demo" işaretli).
      const r = await yerelBuyut(kaynak, Math.min(4, olcek), 0.35);
      yeni({ tip: "gorsel", url: await gorselYukle(r.url).catch(() => r.url), metin: `${r.w}×${r.h} · tarayıcıda büyütüldü`, demo: true });
    } else {
      const kredi = ayarKredi(d.tur, model, a);
      if (!useAuth.getState().krediDus(kredi)) throw new Error(`Yetersiz kredi (${kredi})`);
      const { olcek: _o, ...ayar } = a; void _o;
      const j = await fetch("/api/upscale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, kaynakUrl: new URL(kaynak, location.href).href, olcek, ayar }) }).then((x) => x.json()) as { ok: boolean; jeton?: string; hata?: string };
      if (!j.ok || !j.jeton) { useAuth.getState().krediEkle(kredi); throw new Error(j.hata ?? "Büyütme başlatılamadı; kredi iade edildi"); }
      for (let i = 0; i < 400; i++) {
        await new Promise((z) => setTimeout(z, 3000));
        const q = await fetch(`/api/upscale?jeton=${encodeURIComponent(j.jeton)}`).then((x) => x.json()).catch(() => ({ durum: "isleniyor" })) as { durum: string; url?: string; hata?: string; genislik?: number; yukseklik?: number };
        if (q.durum === "tamam" && q.url) { yeni({ tip: d.tur === "aiBuyut" ? "gorsel" : "video", url: q.url, metin: q.genislik ? `${q.genislik}×${q.yukseklik}` : `${olcek}×` }); break; }
        if (q.durum === "hata") { useAuth.getState().krediEkle(kredi); throw new Error(q.hata ?? "Büyütme başarısız; kredi iade edildi"); }
      }
      if (!s.length) throw new Error("Büyütme zaman aşımına uğradı");
    }
  } else if (d.tur === "kirp" || d.tur === "renk") {
    const kaynak = url("gorsel")[0]; if (!kaynak) throw new Error("Görsel bağla");
    const r = await (d.tur === "kirp" ? kirpBoyutla(kaynak, a) : renkAyarla(kaynak, a));
    yeni({ tip: "gorsel", url: await gorselYukle(r.url).catch(() => r.url), metin: `${r.w}×${r.h}` });
  } else if (d.tur === "videoUzat") {
    const v = url("video")[0]; if (!v) throw new Error("Video bağla");
    const kare = await kareYakala(v, "son").catch(() => { throw new Error("Videonun son karesi alınamadı"); });
    const kareUrl = await gorselYukle(kare).catch(() => kare);
    const h = HAREKETLER.find((x) => x.ad === a.hareket);
    const istem = metin || "Continue the shot naturally from this frame, same subject, lighting and camera style";
    const u = await basla({ baslik: `Devam · ${metin.slice(0, 30) || "uzatma"}`, tur: "video", model: model!, prompt: h ? `${istem}. Camera and motion: ${h.en}.` : istem, kredi: ayarKredi("videoUzat", model, a), arac: "Canvas",
      meta: { hamIstem: metin, gorselUrl: kareUrl, ...(a.sure ? { sure: `${a.sure}sn` } : {}), ...(a.cozunurluk ? { cozunurluk: String(a.cozunurluk) } : {}), ...(a.oran ? { oran: String(a.oran) } : {}), ...(a.ses ? { ses: "Açık" } : {}) } });
    yeni({ tip: "video", url: u.videoUrl ?? u.meta?.demoKlip?.video, poster: adresAyikla(u.meta?.demoKlip?.poster ?? u.gorselUrl) ?? kareUrl, demo: !u.gercek });
  } else if (d.tur === "transkript" || d.tur === "sesDegistir" || d.tur === "dublaj" || d.tur === "sesTemizle") {
    const kaynak = url("ses")[0]; if (!kaynak) throw new Error("Ses bağla");
    const sg = await saglayiciDurum();
    if (!sg.eleven) throw new Error("Bu işlem için ses sağlayıcısı (ElevenLabs) bağlı olmalı");
    const { veri, ad } = await dataUrlAl(kaynak);
    const mod = { transkript: "transkript", sesDegistir: "sesdegistir", dublaj: "ceviri", sesTemizle: "temizle" }[d.tur];
    const modeller = { transkript: "Eleven Scribe", sesdegistir: "Eleven Speech to Speech", ceviri: "Eleven Dubbing", temizle: "Eleven Voice Isolator" } as Record<string, string>;
    const ses = SESLER.find((x) => x.ad === d.ayar.sesAd) ?? SESLER.find((x) => x.ad === "George") ?? SESLER[0];
    const u = await basla({ baslik: `${KATALOG[d.tur].ad} · ${ad}`.slice(0, 48), tur: "ses", model: modeller[mod], prompt: `${ad} · ${KATALOG[d.tur].ad}`, kredi: ayarKredi(d.tur, model, a), arac: "Canvas",
      meta: { mod, kaynakAd: ad,
        ...(mod === "sesdegistir" ? { ses: ses.ad, ...(ses.sesId ? { sesId: ses.sesId } : {}), gurultuTemizle: !!a.gurultu, kararlilik: Number(a.kararlilik ?? 0.5), benzerlik: Number(a.benzerlik ?? 0.75) } : {}),
        ...(mod === "ceviri" ? { hedefDil: String(a.hedefDil ?? "en"), konusmaciSayisi: Number(a.konusmaci ?? 0) } : {}),
        ...(mod === "transkript" && a.dil ? { kaynakDil: String(a.dil) } : {}) },
      girdi: { kaynak: veri } } as Parameters<typeof uretimBaslat>[0]);
    if (d.tur === "transkript") {
      const m = (u as { meta?: { transkript?: string } }).meta?.transkript;
      if (!m) throw new Error("Transkript boş döndü");
      yeni({ tip: "metin", metin: m });
    } else yeni({ tip: "ses", url: u.sesUrl, metin: KATALOG[d.tur].ad, demo: !u.gercek || !u.sesUrl });
  } else if (d.tur === "gelistir" || d.tur === "tarif" || d.tur === "sahneler") {
    const istek = d.tur === "tarif" ? { islem: "tarif", gorselUrl: new URL(url("gorsel")[0] ?? "", location.href).href, adet: 1 }
      : d.tur === "sahneler" ? { islem: "sahneler", istem: metin, adet: Number(a.adet ?? 4) } : { islem: "gelistir", istem: metin };
    const j = await fetch("/api/istem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(istek) }).then((x) => x.json()).catch(() => ({ ok: false })) as { ok?: boolean; istem?: string; istemler?: string[]; sahneler?: { istem: string; cekim?: string }[]; hata?: string };
    let cikti = d.tur === "tarif" ? j.istemler?.[0] : d.tur === "sahneler" ? j.sahneler?.map((x) => `${x.cekim ? `${x.cekim}: ` : ""}${x.istem}`).join("\n") : j.istem;
    let demo = false;
    if (!cikti) {
      // İstem yardımcısı yoksa sohbet modeline düşülür (yoksa açık bir demo metni).
      const talimat = d.tur === "tarif" ? `Bu görseli bir görsel üretim istemi olarak tarif et${a.odak === "stil" ? " (yalnız stil, ışık, renk, kamera)" : a.odak === "ozne" ? " (yalnız özne)" : ""}. Görsel: ${url("gorsel")[0]}`
        : d.tur === "sahneler" ? `Şu hikâyeyi ${a.adet ?? 4} sahnelik çekim listesine böl; her satır bir sahnenin somut görsel istemi olsun, numara koyma:\n${metin}`
        : `Şu fikri ayrıntılı, somut, tek paragraflık bir görsel üretim istemine çevir; yalnız istemi yaz:\n${metin}`;
      let y = bosYanit();
      await sohbetAkisi({ mesajlar: [{ rol: "kullanici", metin: talimat }], model: SC_VARSAYILAN_MODEL, dusun: false, web: false, stil: "kisa" }, (o: ScOlay) => { y = olayUygula(y, o); }, () => { demo = true; }, new AbortController().signal);
      cikti = yanitMetni(y).trim();
      if (!cikti) throw new Error(j.hata ?? y.hata ?? "Yanıt alınamadı");
    }
    yeni({ tip: "metin", metin: cikti, demo });
  } else if (d.tur === "videoKes" || d.tur === "videoBirlestir" || d.tur === "sesEkle") {
    const klipler = d.tur === "videoBirlestir" ? ["v1", "v2", "v3", "v4"].map((p) => url(p)[0]).filter(Boolean) as string[] : [url("video")[0]].filter(Boolean) as string[];
    if (!klipler.length) throw new Error("Video bağla");
    const ses = url("ses")[0];
    if (d.tur === "sesEkle" && !ses) throw new Error("Ses bağla");
    const r = await videoIsle(klipler.map((u) => (d.tur === "videoKes" ? { url: u, bas: Number(a.bas ?? 0), ...(Number(a.son) > 0 ? { son: Number(a.son) } : {}), hiz: Number(a.hiz ?? 1) } : { url: u })),
      d.tur === "videoBirlestir" ? { gecis: a.gecis as "yok" | "karartma" | "beyaz", gecisSn: Number(a.gecisSn ?? 0.4), klipSes: Number(a.klipSes ?? 1), ...(ses ? { ses: { url: ses, seviye: Number(a.muzikSes ?? 0.6), dongu: true } } : {}) }
        : d.tur === "sesEkle" ? { klipSes: Number(a.klipSes ?? 0.3), ses: { url: ses!, seviye: Number(a.yeniSes ?? 1), dongu: !!a.dongu } } : {},
      () => iptaller.has(d.id));
    const v = await dosyaYukle(r.blob, r.mime.split(";")[0]);
    const kare = await kareYakala(v, 0.1).catch(() => undefined);
    yeni({ tip: "video", url: v, poster: kare ? await gorselYukle(kare).catch(() => kare) : undefined, metin: `${r.w}×${r.h} · ${r.sure.toFixed(1)} sn` });
  } else if (d.tur === "yazi" || d.tur === "kolaj") {
    const gorseller = url("gorsel"); if (!gorseller.length) throw new Error("Görsel bağla");
    const r = d.tur === "yazi" ? await yaziEkle(gorseller[0], metin, a) : await kolajYap(gorseller, a);
    yeni({ tip: "gorsel", url: await gorselYukle(r.url).catch(() => r.url), metin: `${r.w}×${r.h}` });
  } else if (d.tur === "sec") {
    const x = g.find((y) => y.port === "liste");
    const l = x?.liste ?? listeAyir(x?.metin ?? "");
    if (!l.length) throw new Error("Bağlı liste boş");
    const i = a.yontem === "rastgele" ? Math.floor(Math.random() * l.length) : Math.min(l.length, Math.max(1, Number(a.sira ?? 1))) - 1;
    yeni({ tip: "metin", metin: l[i] });
  } else if (d.tur === "ucBoyut") {
    const m = MODELLER_3D.find((x) => x.ad === model) ?? MODELLER_3D[0];
    const gorseller = url("gorsel").map((u) => new URL(u, location.href).href).slice(0, 4);
    if (!gorseller.length && !metin) throw new Error("İstem yaz ya da görsel bağla");
    const u = await basla({ baslik: (metin || "Görselden 3D").slice(0, 36), tur: "3d", model: m.ad, prompt: [metin || (gorseller.length > 1 ? "Çoklu görünümden 3D" : "Görselden 3D"), STILLER.find((x) => x.id === a.stil)?.istem ?? ""].filter(Boolean).join(" · ").slice(0, 600), kredi: ayarKredi("ucBoyut", model, a), arac: "Canvas",
      meta: { mod: "taslak", hamIstem: metin, kurulum: { model: m.id, stil: String(a.stil ?? "gercekci"), poz: "serbest", topoloji: "quad" in m && m.quad ? "quad" : String(a.topoloji ?? "triangle"), poligon: Number(a.poligon ?? 30000), girdi: gorseller.length > 1 ? "coklu" : gorseller.length ? "gorsel" : "metin" } },
      ...(gorseller.length ? { girdi: { gorseller } } : {}) } as Parameters<typeof uretimBaslat>[0]);
    const x = u as { glbUrl?: string; thumbnailUrl?: string; gorselUrl?: string; gercek?: boolean };
    // Sağlayıcı yoksa: görüntüleyici denenebilsin diye örnek model (açıkça "Demo").
    if (!x.gercek && !x.glbUrl) yeni({ tip: "gorsel", url: "/gercek/3d/robot-poster.png", glb: "/gercek/3d/robot.glb", metin: "Örnek model · sağlayıcı bağlı değil", demo: true });
    else yeni({ tip: "gorsel", url: adresAyikla(x.thumbnailUrl ?? x.gorselUrl), glb: x.glbUrl, metin: x.glbUrl ? "3D model (GLB)" : "Önizleme", demo: !x.gercek });
  } else if (d.tur === "birlestir") {
    const deg = (port: string) => { const x = g.find((y) => y.port === port); return x ? (x.liste ? oge : x.metin ?? "") : ""; };
    const sablon = d.metin?.trim();
    const m = sablon ? sablon.replace(/\{1\}/g, deg("a")).replace(/\{2\}/g, deg("b")).replace(/\{3\}/g, deg("c")) : ["a", "b", "c"].map(deg).filter(Boolean).join("\n");
    yeni({ tip: "metin", metin: m.trim() });
  } else if (d.tur === "asistan") {
    let y = bosYanit(); let demo = false;
    const baglam = g.filter((x) => x.tip === "metin").map((x) => (x.liste ? oge : x.metin)).filter(Boolean);
    const gorseller = url("gorsel");
    const uz = a.uzunluk === "kisa" ? "Kısa tut (en çok 2 cümle)." : a.uzunluk === "uzun" ? "Ayrıntılı yaz." : "";
    const bicim = a.cikti === "liste" ? "Her öğeyi ayrı satıra yaz; numara, madde işareti ya da açıklama ekleme." : "Yalnız istenen metni yaz; açıklama ekleme. Üretim istemi yazıyorsan tek paragraf, somut ve görsel olsun.";
    await sohbetAkisi({ mesajlar: [{ rol: "kullanici", metin: `${d.metin?.trim() || "Bağlamı kullanarak bir görsel/video üretim istemi yaz."}${baglam.length ? `\n\n<baglam>\n${baglam.join("\n---\n")}\n</baglam>` : ""}${gorseller.length ? `\n\nBağlı görseller: ${gorseller.join(", ")}` : ""}\n\n${bicim} ${uz}` }],
      model: SC_VARSAYILAN_MODEL, dusun: false, web: false, stil: "kisa" }, (o: ScOlay) => { y = olayUygula(y, o); }, () => { demo = true; }, new AbortController().signal);
    let m = yanitMetni(y).trim();
    if (!m) throw new Error(y.hata ?? "Yanıt alınamadı");
    if (demo && a.cikti === "liste") m = ["Sahne 1: Sisli ormanda yürüyen kaşif", "Sahne 2: Eski bir taş köprü", "Sahne 3: Gün batımında vadi"].join("\n");
    yeni({ tip: "metin", metin: m, demo });
  }
  return s;
}

/* ── Çalıştırma geçmişi ── */
const aktifKayit = new Map<string, string>();
function kayitYaz(tuvalId: string, f: (l: CalismaKaydi[]) => CalismaKaydi[]) {
  useTuval.getState().guncelle(tuvalId, (t) => ({ ...t, gecmis: f(t.gecmis ?? []).slice(0, 40) }), false);
}
function kayitBaslat(tuvalId: string, ids: string[], kapsam: CalismaKaydi["kapsam"]) {
  const t = useTuval.getState().tuvaller.find((x) => x.id === tuvalId); if (!t) return "";
  const id = yeniId("k");
  const adimlar: CalismaAdim[] = ids.map((did) => { const d = t.dugumler.find((x) => x.id === did)!; return { dugum: did, ad: d.ad ?? KATALOG[d.tur].ad, tur: d.tur, durum: "sirada", kredi: tahminiKredi(t, d) }; });
  kayitYaz(tuvalId, (l) => [{ id, bas: Date.now(), kapsam, adimlar }, ...l]);
  return id;
}
function adimYaz(tuvalId: string, dugumId: string, p: Partial<CalismaAdim>) {
  const kid = aktifKayit.get(tuvalId); if (!kid) return;
  kayitYaz(tuvalId, (l) => l.map((k) => (k.id === kid ? { ...k, adimlar: k.adimlar.map((a) => (a.dugum === dugumId ? { ...a, ...p } : a)) } : k)));
}
const kayitBitir = (tuvalId: string, kid: string) => kayitYaz(tuvalId, (l) => l.map((k) => (k.id === kid ? { ...k, bit: Date.now(), adimlar: k.adimlar.map((a) => (a.durum === "sirada" || a.durum === "calisiyor" ? { ...a, durum: "atlandi" as const } : a)) } : k)));

export async function dugumCalistir(tuvalId: string, dugumId: string): Promise<boolean> {
  // Tek başına çalıştırılan düğüm kendi kaydını açar.
  if (aktifKayit.has(tuvalId)) return dugumCalistirIc(tuvalId, dugumId);
  const kid = kayitBaslat(tuvalId, [dugumId], "tek"); aktifKayit.set(tuvalId, kid);
  try { return await dugumCalistirIc(tuvalId, dugumId); } finally { aktifKayit.delete(tuvalId); kayitBitir(tuvalId, kid); }
}

async function dugumCalistirIc(tuvalId: string, dugumId: string): Promise<boolean> {
  const t = useTuval.getState().tuvaller.find((x) => x.id === tuvalId); const d = t?.dugumler.find((x) => x.id === dugumId);
  if (!t || !d) return false;
  const engel = hazirMi(t, d);
  if (engel) { yaz(tuvalId, dugumId, { durum: "hata", hata: engel }); adimYaz(tuvalId, dugumId, { durum: "hata", hata: engel }); return false; }
  iptaller.delete(dugumId);
  adimYaz(tuvalId, dugumId, { durum: "calisiyor", bas: Date.now() });
  yaz(tuvalId, dugumId, { durum: "calisiyor", hata: undefined, baslangic: Date.now() });
  const g = girdileriTopla(t, d);
  const l = dugumOgeleri(d, g);
  const yeni: Surum[] = [];
  try {
    for (const oge of l) {
      if (iptaller.has(dugumId)) break;
      yeni.push(...await tekCalistir(d, g, oge));
      if (l.length > 1) yaz(tuvalId, dugumId, (x) => ({ surumler: [...x.surumler, ...yeni.slice(-1)].slice(-60), aktif: Math.min(59, x.surumler.length) }));
    }
  } catch (e) {
    const hata = e instanceof Error ? e.message : "Başarısız";
    if (!iptaller.has(dugumId)) yaz(tuvalId, dugumId, { durum: "hata", hata });
    adimYaz(tuvalId, dugumId, { durum: iptaller.has(dugumId) ? "atlandi" : "hata", hata, bit: Date.now() });
    return false;
  }
  if (iptaller.has(dugumId)) { iptaller.delete(dugumId); adimYaz(tuvalId, dugumId, { durum: "atlandi", bit: Date.now(), hata: "Durduruldu" }); return false; }
  adimYaz(tuvalId, dugumId, { durum: "bitti", bit: Date.now() });
  yaz(tuvalId, dugumId, (x) => {
    const surumler = l.length > 1 ? x.surumler : [...x.surumler, ...yeni].slice(-60);
    return { durum: "bitti", eski: false, hata: undefined, surumler, aktif: surumler.length - 1 };
  });
  asagiEski(tuvalId, dugumId);
  return true;
}

/** Bağımlılık sırası (Kahn). `hedefler` verilirse yalnız onlar ve gereken atalar. */
export function sirala(t: Tuval, hedefler?: string[]): string[] {
  let kume = new Set(t.dugumler.filter((d) => KATALOG[d.tur].calisir).map((d) => d.id));
  if (hedefler) {
    const gerek = new Set<string>(); const yigin = [...hedefler];
    while (yigin.length) { const u = yigin.pop()!; if (gerek.has(u)) continue; gerek.add(u); t.kenarlar.filter((e) => e.hedef === u).forEach((e) => yigin.push(e.kaynak)); }
    kume = new Set([...kume].filter((id) => gerek.has(id)));
  }
  const gir = new Map<string, number>(); kume.forEach((id) => gir.set(id, 0));
  t.kenarlar.forEach((e) => { if (kume.has(e.kaynak) && kume.has(e.hedef)) gir.set(e.hedef, (gir.get(e.hedef) ?? 0) + 1); });
  const kuyruk = [...kume].filter((id) => !gir.get(id)); const sonuc: string[] = [];
  while (kuyruk.length) { const u = kuyruk.shift()!; sonuc.push(u); t.kenarlar.filter((e) => e.kaynak === u && kume.has(e.hedef)).forEach((e) => { gir.set(e.hedef, gir.get(e.hedef)! - 1); if (!gir.get(e.hedef)) kuyruk.push(e.hedef); }); }
  return sonuc;
}

/** Çalıştırılacak düğümler: sonucu olmayan ya da eskimiş olanlar (+ açıkça hedeflenenler). Kilitli olanlar atlanır. */
export function calisacaklar(t: Tuval, hedefler?: string[], hepsi = false) {
  return sirala(t, hedefler).filter((id) => { const d = t.dugumler.find((x) => x.id === id)!; return !d.kilit && !d.kapali && (hepsi || !d.surumler.length || d.eski || (hedefler?.includes(id) ?? false)); });
}

/** Aynı anda en çok bu kadar düğüm çalışır (bağımsız dallar paralel ilerler). */
export const ESZAMANLI = 4;

export async function tumunuCalistir(tuvalId: string, hedefler?: string[], hepsi = false) {
  const t = useTuval.getState().tuvaller.find((x) => x.id === tuvalId); if (!t) return { biten: 0, hata: 0 };
  const sira = calisacaklar(t, hedefler, hepsi);
  const kume = new Set(sira);
  const kid = kayitBaslat(tuvalId, sira, hedefler ? "secili" : "tum"); aktifKayit.set(tuvalId, kid);
  sira.forEach((id) => yaz(tuvalId, id, { durum: "sirada", hata: undefined }));
  const basarisiz = new Set<string>(), bitti = new Set<string>(), calisan = new Set<string>(); let biten = 0;
  /* Bir düğüm, bu çalıştırmadaki tüm atası bitince başlar; ata başarısızsa atlanır. */
  const atalar = (id: string) => t.kenarlar.filter((e) => e.hedef === id && kume.has(e.kaynak)).map((e) => e.kaynak);
  await new Promise<void>((coz) => {
    const dongu = () => {
      for (const id of sira) {
        if (calisan.size >= ESZAMANLI) break;
        if (bitti.has(id) || calisan.has(id) || basarisiz.has(id)) continue;
        const d = useTuval.getState().tuvaller.find((x) => x.id === tuvalId)?.dugumler.find((x) => x.id === id);
        if (!d || d.durum !== "sirada") { bitti.add(id); continue; }
        const a = atalar(id);
        if (a.some((x) => basarisiz.has(x))) { yaz(tuvalId, id, { durum: d.surumler.length ? "bitti" : "bos", hata: "Önceki adım başarısız olduğu için atlandı" }); adimYaz(tuvalId, id, { durum: "atlandi", hata: "Önceki adım başarısız" }); basarisiz.add(id); continue; }
        if (!a.every((x) => bitti.has(x))) continue;
        calisan.add(id);
        void dugumCalistir(tuvalId, id).then((ok) => { calisan.delete(id); if (ok) { bitti.add(id); biten++; } else basarisiz.add(id); dongu(); });
      }
      if (!calisan.size && sira.every((id) => bitti.has(id) || basarisiz.has(id))) coz();
      else if (!calisan.size && !sira.some((id) => !bitti.has(id) && !basarisiz.has(id) && atalar(id).every((x) => bitti.has(x)))) coz();
    };
    dongu();
  });
  aktifKayit.delete(tuvalId); kayitBitir(tuvalId, kid);
  return { biten, hata: basarisiz.size };
}

export function siradakileriIptal(tuvalId: string) {
  const t = useTuval.getState().tuvaller.find((x) => x.id === tuvalId); if (!t) return;
  t.dugumler.forEach((d) => { if (d.durum === "sirada" || d.durum === "calisiyor") { iptalEt(d.id); yaz(tuvalId, d.id, { durum: d.surumler.length ? "bitti" : "bos" }); } });
}
