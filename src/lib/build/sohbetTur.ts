import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { ajanGetir, ajanSayacArtir, type Ajan } from "./ajanDepo";
import { ajanTurCalistir } from "./sohbetAjanTur";
import { ARAC_KATALOG, type AracIzni } from "./ajanKatalog";
import { baglantiGetir, baglantiKullanilabilir, baglantilariListele, mcpAracYurut, mcpAraclariHazirla, type Baglanti } from "./baglantiDepo";
import { sahipOzeti } from "./depo";
import { modelBagli } from "./disAjan";
import { krediHesapla, modelBul, VARSAYILAN_MODEL, type BuildModel } from "./modeller";
import { ajanSistemi, sohbetAraciYurut, sohbetAraclari, sohbetSistemi, type AracCiktisi } from "./sohbetAjan";
import { bellekAraclari, bellekBolumu, bellekGetir, bellekGuncelle, bellekKimligi } from "./sohbetBellek";
import { sohbetKaydet, yeniMesajId, type BekleyenCagri, type Kullanim, type Sohbet, type SohbetEki, type SohbetMesaji, type SohbetParca, type TurIstegi } from "./sohbetDepo";
import { ekKaydet } from "./sohbetEk";
import { asistanMetni, baglamTahmini, gecmisKur } from "./sohbetGecmis";
import { sikistirmaGerekli, sohbetiSikistir } from "./sohbetOzet";
import { bellekModu, klasorBilgisi, klasorBolumu, klasorGetir, klasorGetirOz, klasorlerGuncelleOz } from "./sohbetKlasor";
import { klasorErisimi } from "./sohbetOrtak";
import { motoruCalistir, sunucuAraclari, type MotorSonucu } from "./sohbetMotoru";
import { bellekEtiketiniGizle, bellekKimlikleri, cocuklar, etkinYol, mesajaKadar, secimiAyarla } from "./sohbetYol";
import { yayinAkisi, yayinBaslat, yayinBitir, yayinYaz, yayinlar, type Yayin } from "./sohbetYayin";
import { yetenekGetir, yetenekleriCagriyaGoreHazirla, yetenekleriListele, type Yetenek } from "./yetenekDepo";
import { icerikDenetle } from "@/lib/moderasyon";
import { buildKrediKes, buildKrediYeterli } from "@/lib/hesap/buildKredi";
import { asistanBolumu, asistanBul } from "./sohbetAsistan";
import { ekAracBolumu, ekAraclar, ekAracYurut, HEP_SOR } from "./sohbetEkAraclar";
import { sohbetBaglami } from "./sohbetBagla";
import { tuvalBolumu } from "./sohbetTuval";
import { YETENEK_BETIK_ARACI, calisirBetikler, yetenekBetikAraciYurut } from "./yetenekBetik";
import { ekTablolari, tabloTarifi, veriEkiMi, type VeriTablosu } from "./sohbetVeri";

/**
 * Sohbet turu: yeni mesaj, düzenleme (dal), yeniden deneme (sürüm, istenirse başka modelle), onay kartı yanıtı,
 * araştırma (plan → onay → web araştırması → rapor) ve model kurulu (aynı soru 2-4 modele, sonra birleşik yanıt).
 * Tur istekten bağımsız çalışır ve olaylarını yayına yazar (sohbetYayin): sayfa yenilense de sürer, istemci yeniden
 * bağlanır. Olaylar:
 *  basla {kullanici?, asistan, secim, baslik}  ekle {parca}  metin {i, ek}  dusunce {i, ek}  guncelle {i, parca}
 *  kurul {i, ek}  kurul-durum {i, cevap}  bitti {mesaj, turKredi}  hata {mesaj}
 */
export type Efor = "low" | "medium" | "high" | "max";
export type TurGovdesi = {
  metin?: string; ekler?: SohbetEki[]; model?: string; efor?: Efor; ust?: string | null; istek?: TurIstegi;
  duzenle?: string; yenidenDene?: string; tekrar?: boolean;
  /** Yanıtı değiştir: yeniden denemede yanıtın yönü (ör. "Daha kısa yaz."); etiket mesajda görünür. */
  degistir?: { etiket: string; talimat: string };
  onay?: { karar: "onay" | "ret"; hep?: boolean };
  arastirmaBaslat?: { mesajId: string; plan: { baslik: string; adimlar: string[] } };
};

const SUNUCU_ARACLARI = new Set(ARAC_KATALOG.filter((a) => a.yalnizClaude).map((a) => a.id));
const YAN_ETKILI = new Set(["gorsel_uret", "video_uret", "muzik_uret", "ses_uret", "model_3d_uret", "proje_olustur"]);
const AJAN_OKUMA = new Set(["bellege_yaz", "bilgide_ara", "yetenek_oku", "yetenek_dosyasi"]);
const EK = /^(data:image\/(png|jpeg|webp|gif);base64,|\/api\/build\/sohbet\/ek\/[A-Za-z0-9_-]{20,40}\.(png|jpg|webp|gif|pdf|txt)$|\/api\/build\/sohbet\/belge\/[A-Za-z0-9_-]{24}\.(docx|xlsx|pptx)$|https:\/\/)/;
const hataYaniti = (mesaj: string, durum = 400) => Response.json({ ok: false, hata: mesaj }, { status: durum });
export const acikMesaj = (m: SohbetMesaji) => { const { api: _a, ekBaglam: _b, ...x } = m; void _a; void _b; return x; };

function ekleriTemizle(l: unknown): SohbetEki[] {
  if (!Array.isArray(l)) return [];
  return l.filter((e): e is SohbetEki => !!e && typeof e === "object" && ["gorsel", "pdf", "metin", "ofis"].includes((e as SohbetEki).tur) && typeof (e as SohbetEki).url === "string" && EK.test((e as SohbetEki).url))
    .filter((e) => e.tur === "gorsel" || e.url.startsWith("/api/"))
    .filter((e) => e.tur !== "ofis" || e.url.startsWith("/api/build/sohbet/belge/"))
    .slice(0, 10).map((e) => {
      const ofis = e.tur === "ofis" ? /\/belge\/([A-Za-z0-9_-]{24})\.(docx|xlsx|pptx)$/.exec(e.url) : null;
      return { tur: e.tur, url: e.url, ad: String(e.ad ?? "dosya").slice(0, 120), ...(e.boyut ? { boyut: Number(e.boyut) } : {}), ...(e.mime ? { mime: String(e.mime).slice(0, 120) } : {}), ...(ofis ? { belge: ofis[1], bicim: ofis[2] as "docx" } : {}) };
    });
}
/** Eski istemcilerin data URL görselleri depoya yazılır (sohbet dosyası küçük kalsın). */
async function ekleriKalicilastir(l: SohbetEki[]): Promise<SohbetEki[]> {
  const o: SohbetEki[] = [];
  for (const e of l) {
    const d = /^data:([^;]+);base64,(.+)$/.exec(e.url);
    if (!d) { o.push(e); continue; }
    try { const k = await ekKaydet(Buffer.from(d[2], "base64"), e.ad, d[1]); o.push({ tur: k.tur, url: k.url, ad: k.ad, boyut: k.boyut, mime: k.mime }); } catch { o.push(e); }
  }
  return o;
}
function istekTemizle(i: unknown): TurIstegi | undefined {
  if (!i || typeof i !== "object") return undefined;
  const x = i as TurIstegi;
  const l = (v: unknown, n: number) => (Array.isArray(v) ? v.filter((y) => typeof y === "string").slice(0, n).map((y) => String(y).slice(0, 80)) : undefined);
  const o: TurIstegi = {};
  if (x.arastirma) o.arastirma = true;
  if (typeof x.arac === "string" && YAN_ETKILI.has(x.arac)) o.arac = x.arac;
  const y = l(x.yetenekler, 6); if (y?.length) o.yetenekler = y;
  const b = l(x.baglantilar, 6); if (b?.length) o.baglantilar = b;
  if (typeof x.ajan === "string" && /^[A-Za-z0-9_-]{6,20}$/.test(x.ajan)) o.ajan = x.ajan;
  if (typeof x.alinti === "string" && x.alinti.trim()) o.alinti = x.alinti.trim().slice(0, 4000);
  if (x.tuval) o.tuval = true;
  if (Array.isArray(x.sohbetler)) {
    const l = x.sohbetler.filter((v) => v && typeof v.id === "string" && /^[A-Za-z0-9_-]{12}$/.test(v.id)).slice(0, 3).map((v) => ({ id: v.id, baslik: String(v.baslik ?? "").slice(0, 80) }));
    if (l.length) o.sohbetler = l;
  }
  if (x.duzenle && typeof x.duzenle.gorsel === "string" && /^(\/api\/|https:\/\/)/.test(x.duzenle.gorsel) && ["duzenle", "maske", "arkaplan", "genislet", "sil"].includes(x.duzenle.islem)) {
    o.duzenle = { gorsel: x.duzenle.gorsel.slice(0, 600), islem: x.duzenle.islem, ...(typeof x.duzenle.maske === "string" && /^\/api\/build\/sohbet\/ek\//.test(x.duzenle.maske) ? { maske: x.duzenle.maske.slice(0, 200) } : {}) };
  }
  if (x.kurul && Array.isArray(x.kurul.modeller)) {
    const m = [...new Set(x.kurul.modeller.filter((v) => typeof v === "string").map((v) => modelBul(v).id))].slice(0, 4);
    if (m.length >= 2) o.kurul = { modeller: m, sentez: modelBul(typeof x.kurul.sentez === "string" ? x.kurul.sentez : m[0]).id };
  }
  return Object.keys(o).length ? o : undefined;
}

const baslikYap = (metin: string, ekler: SohbetEki[]) => {
  const b = metin.replace(/\s+/g, " ").trim();
  return (b.length > 52 ? `${b.slice(0, 52).replace(/\s+\S*$/, "")}…` : b) || (ekler.some((e) => e.tur === "pdf") ? "Belge hakkında" : ekler.length ? "Görsel hakkında" : "Yeni sohbet");
};
const kullanimTopla = (a: Kullanim | undefined, b: Kullanim): Kullanim => ({ girdi: (a?.girdi ?? 0) + b.girdi, cikti: (a?.cikti ?? 0) + b.cikti, onbellek: (a?.onbellek ?? 0) + b.onbellek, yazilan: (a?.yazilan ?? 0) + b.yazilan });

/** Araştırma çalıştıran model: seçili model Claude ise o, değilse Opus 5.5 (web arama ve sayfa okuma Claude'un sunucu araçları). */
export const arastirmaModeli = (m: BuildModel) => (m.saglayici === "anthropic" ? m : modelBul(VARSAYILAN_MODEL));

/** Paylaşılan klasördeki sohbette üyeliğin bu tur için doğrulanıp doğrulanmadığı (istek turdan önce bakılır). */
const ortakIzin = new WeakMap<Sohbet, boolean>();

export async function turIstegi(req: Request, s: Sohbet, sahip: string, g: TurGovdesi): Promise<Response> {
  const id = s.id;
  if (s.ortakKlasor) { const u = new URL(req.url); u.searchParams.set("sahip", s.ortakKlasor.sahipOz); ortakIzin.set(s, !!(await klasorErisimi(new Request(u, { headers: req.headers }), s.ortakKlasor.id))); }
  if (yayinlar.get(id) && !yayinlar.get(id)!.bitti) return hataYaniti("Bu sohbette yanıt sürüyor.", 409);
  const krediEngeli = await buildKrediYeterli(sahip);
  if (krediEngeli) return hataYaniti(krediEngeli, 402);

  let ajan: Ajan | null = null;
  if (s.ajanId) {
    ajan = await ajanGetir(s.ajanId, sahip);
    if (!ajan) return hataYaniti("Bu sohbetin ajanı silinmiş.", 410);
  }
  if (g.efor && ["low", "medium", "high", "max"].includes(g.efor)) s.efor = g.efor;

  let kullanici: SohbetMesaji | undefined;
  let asistan: SohbetMesaji;
  let devam: { cagrilar: BekleyenCagri[]; ret: boolean } | undefined;
  let yeniKullanici = false;
  let kip: "normal" | "plan" | "arastirma" | "kurul" = "normal";
  let plan: { baslik: string; adimlar: string[] } | undefined;
  let degistir: { etiket: string; talimat: string; onceki: string } | undefined;

  if (g.onay) {
    if (!s.bekleyen) return hataYaniti("Onay bekleyen bir işlem yok.");
    const a = s.mesajlar.find((m) => m.id === s.bekleyen!.asistanId);
    if (!a) return hataYaniti("Onay bekleyen mesaj bulunamadı.");
    asistan = a;
    kullanici = s.mesajlar.find((m) => m.id === a.ust);
    devam = { cagrilar: s.bekleyen.cagrilar, ret: g.onay.karar === "ret" };
    // "Her zaman izin ver": ajanda çalıştırıcı kalıcılaştırır (bir daha sorma); genel sohbette bu sohbete yazılır.
    if (g.onay.hep && g.onay.karar === "onay" && !ajan && !a.ajan) s.izinliAraclar = [...new Set([...(s.izinliAraclar ?? []), ...devam.cagrilar.map((c) => c.name)])];
    s.bekleyen = undefined;
    if (a.ajan && !ajan) ajan = await ajanGetir(a.ajan.id, sahip);
  } else if (g.arastirmaBaslat) {
    const a = s.mesajlar.find((m) => m.id === g.arastirmaBaslat!.mesajId);
    if (!a || a.durum !== "plan-bekliyor") return hataYaniti("Başlatılacak araştırma planı yok.");
    const adimlar = (Array.isArray(g.arastirmaBaslat.plan?.adimlar) ? g.arastirmaBaslat.plan.adimlar : []).map((x) => String(x).trim().slice(0, 300)).filter(Boolean).slice(0, 10);
    if (!adimlar.length) return hataYaniti("Planda en az bir adım olmalı.");
    plan = { baslik: String(g.arastirmaBaslat.plan.baslik ?? "").trim().slice(0, 160) || "Araştırma", adimlar };
    asistan = a;
    kullanici = s.mesajlar.find((m) => m.id === a.ust);
    a.parcalar = [{ tur: "plan", baslik: plan.baslik, adimlar: plan.adimlar, durum: "basladi" }];
    kip = "arastirma";
    if (!kullanici) return hataYaniti("Araştırma sorusu bulunamadı.");
  } else {
    bekleyeniReddet(s);
    let ust: string | null | undefined;
    if (g.yenidenDene || g.tekrar) {
      const yol = etkinYol(s.mesajlar, s.secim);
      const hedef = g.yenidenDene ? s.mesajlar.find((m) => m.id === g.yenidenDene && m.rol === "asistan") : [...yol].reverse().find((m) => m.rol === "asistan");
      kullanici = hedef ? s.mesajlar.find((m) => m.id === hedef.ust) : [...yol].reverse().find((m) => m.rol === "kullanici");
      if (!kullanici || kullanici.rol !== "kullanici") return hataYaniti("Yeniden gönderilecek mesaj yok.");
      // Yanıtı değiştir: önceki yanıt ve yön modele gider; yeni sürüm etiketiyle görünür.
      if (g.degistir && hedef && typeof g.degistir.talimat === "string" && g.degistir.talimat.trim()) degistir = { etiket: String(g.degistir.etiket ?? "").trim().slice(0, 40) || "Değiştirildi", talimat: g.degistir.talimat.trim().slice(0, 600), onceki: asistanMetni(hedef).slice(0, 30_000) };
      // İçeriksiz sürümler (bağlantı yok, boş hata) tutulmaz.
      if (hedef && (hedef.durum === "anahtar-yok" || (hedef.durum === "hata" && !asistanMetni(hedef))) && !cocuklar(s.mesajlar).get(hedef.id)?.length) s.mesajlar = s.mesajlar.filter((m) => m.id !== hedef.id);
    } else {
      const metin = String(g.metin ?? "").trim().slice(0, 60000);
      const ekler = await ekleriKalicilastir(ekleriTemizle(g.ekler));
      const eski = g.duzenle ? s.mesajlar.find((m) => m.id === g.duzenle && m.rol === "kullanici") : undefined;
      if (g.duzenle && !eski) return hataYaniti("Düzenlenecek mesaj bulunamadı.");
      const sonEkler = g.ekler === undefined && eski ? eski.ekler ?? [] : ekler;
      if (!metin && !sonEkler.length) return hataYaniti("Mesaj boş.");
      const d = icerikDenetle(metin);
      if (!d.izin) return hataYaniti(d.mesaj, 422);
      if (eski) ust = eski.ust ?? null;
      else {
        const yol = etkinYol(s.mesajlar, s.secim);
        ust = g.ust !== undefined && (g.ust === null || s.mesajlar.some((m) => m.id === g.ust)) ? g.ust : yol[yol.length - 1]?.id ?? null;
      }
      const istek = g.istek !== undefined ? istekTemizle(g.istek) : eski?.istek;
      kullanici = { id: yeniMesajId(), rol: "kullanici", zaman: Date.now(), ust, metin, ...(sonEkler.length ? { ekler: sonEkler } : {}), ...(istek ? { istek } : {}) };
      // @ ile anılan sohbetler: metinleri mesaja bağlanır (sonraki turlarda da modele gider).
      if (istek?.sohbetler?.length) { const b = await sohbetBaglami(sahip, istek.sohbetler.map((x) => x.id), s.id); if (b) kullanici.ekBaglam = b; }
      s.mesajlar.push(kullanici);
      yeniKullanici = true;
      if (!ust) s.baslik = s.gecici ? `Geçici: ${baslikYap(metin, sonEkler)}` : baslikYap(metin, sonEkler);
    }
    const istek = kullanici.istek;
    if (istek?.kurul && !ajan) kip = "kurul";
    else if (istek?.arastirma && !ajan) kip = "plan";
    const secilen = modelBul(ajan ? ajan.model : g.model ?? s.model);
    const turModeli = kip === "kurul" ? modelBul(istek!.kurul!.sentez) : secilen;
    if (!ajan && !g.yenidenDene) s.model = secilen.id;
    s.guncelleme = Date.now();
    if (kip === "kurul" ? !istek!.kurul!.modeller.some((m) => modelBagli(modelBul(m))) : !modelBagli(turModeli)) {
      const a: SohbetMesaji = { id: yeniMesajId(), rol: "asistan", zaman: Date.now(), ust: kullanici.id, model: turModeli.id, durum: "anahtar-yok" };
      s.mesajlar.push(a);
      s.secim = secimiAyarla(s.mesajlar, s.secim ?? {}, a.id);
      await sohbetKaydet(s, sahip);
      return Response.json({ ok: true, anahtarYok: true, kullanici: yeniKullanici ? acikMesaj(kullanici) : undefined, asistan: acikMesaj(a), secim: s.secim, baslik: s.baslik });
    }
    asistan = { id: yeniMesajId(), rol: "asistan", zaman: Date.now(), ust: kullanici.id, parcalar: [], model: turModeli.id, durum: "suruyor", ...(kip === "kurul" ? { mod: "kurul" as const } : kip === "plan" ? { mod: "arastirma" as const } : {}), ...(degistir ? { degistir: degistir.etiket } : {}) };
    s.mesajlar.push(asistan);
    if (ajan) await ajanSayacArtir(ajan.id, (a) => { a.istatistik.mesaj += 1; });
  }
  s.secim = secimiAyarla(s.mesajlar, s.secim ?? {}, asistan.id);

  // @ ile çağrılan ajan (genel sohbette bu tur için).
  const istek = kullanici?.istek;
  if (!ajan && istek?.ajan && !g.onay) {
    const x = await ajanGetir(istek.ajan, sahip);
    if (x) { ajan = x; asistan.ajan = { id: x.id, ad: x.ad, simge: x.simge }; asistan.model = x.model; }
  }
  const model = kip === "arastirma" ? arastirmaModeli(modelBul(asistan.model)) : modelBul(asistan.model);
  if (kip === "arastirma") asistan.model = model.id;
  if (kip !== "kurul" && !modelBagli(model)) {
    asistan.durum = "anahtar-yok";
    await sohbetKaydet(s, sahip);
    return Response.json({ ok: true, anahtarYok: true, kullanici: yeniKullanici && kullanici ? acikMesaj(kullanici) : undefined, asistan: acikMesaj(asistan), secim: s.secim, baslik: s.baslik });
  }

  // Tur istekten bağımsız sürer: istemci koparsa yalnız dinleyici düşer, yeniden bağlanılabilir.
  const y = yayinBaslat(id);
  y.asistanId = asistan.id;
  asistan.durum = "suruyor";
  asistan.parcalar ??= [];
  await sohbetKaydet(s, sahip);
  yayinYaz(y, { t: "basla", kullanici: yeniKullanici && kullanici ? acikMesaj(kullanici) : undefined, asistan: acikMesaj(asistan), secim: s.secim, baslik: s.baslik, devam: !!devam });

  // Ajanla sohbet Ajanlar'ın tek çalıştırıcısından geçer (iz, korumalar, ekip, alıntı, devir); genel sohbet bu dosyada.
  const is = (ajan ? ajanTurCalistir({ s, sahip, ajan, kullanici, asistan, y, devam: devam && { ...devam, hep: !!g.onay?.hep } })
    : turCalistir({ s, sahip, ajan, model, kullanici, asistan, devam, kip, plan, efor: (s.efor ?? "medium") as Efor, y, degistir }))
    .catch((e) => { yayinYaz(y, { t: "hata", mesaj: (e as Error).message || "Bir sorun çıktı." }); })
    .finally(() => yayinBitir(id, y));
  try { after(is); } catch { /* istek bağlamı dışında */ }
  return yayinAkisi(y, req.signal);
}

/** Onay beklerken yeni mesaj yazıldı: bekleyen çağrılar reddedilmiş sayılır (o mesajın API parçası geçerli kalsın). */
function bekleyeniReddet(s: Sohbet) {
  if (!s.bekleyen) return;
  const a = s.mesajlar.find((m) => m.id === s.bekleyen!.asistanId);
  a?.parcalar?.forEach((p, i) => { if (p.tur === "arac" && p.durum === "onay") a.parcalar![i] = { ...p, durum: "reddedildi", baslik: "Onaylanmadı" }; });
  if (a) {
    a.durum = "bitti";
    a.api = [...(a.api ?? []), { role: "user", content: s.bekleyen.cagrilar.map((c) => ({ type: "tool_result", tool_use_id: c.id, content: "Kullanıcı bu işlemi onaylamadı; yerine yeni bir mesaj yazdı.", is_error: true })) }];
  }
  s.bekleyen = undefined;
}

type Calistir = {
  s: Sohbet; sahip: string; ajan: Ajan | null; model: BuildModel; kullanici?: SohbetMesaji; asistan: SohbetMesaji;
  devam?: { cagrilar: BekleyenCagri[]; ret: boolean }; kip: "normal" | "plan" | "arastirma" | "kurul"; plan?: { baslik: string; adimlar: string[] };
  efor: Efor; y: Yayin;
  degistir?: { etiket: string; talimat: string; onceki: string };
};

async function turCalistir(c: Calistir) {
  const { s, sahip, ajan, model, kullanici, asistan: a, y } = c;
  const yaz = (o: Record<string, unknown>) => yayinYaz(y, o);
  const bas = Date.now();
  const yol = mesajaKadar(s.mesajlar, a.id);
  // Bağlam modelin sınırının yüzde 80'ini geçtiyse eski mesajlar önce özetlenir (sohbet kesilmeden sürer).
  if (!c.devam && !(a.api?.length) && (c.kip === "normal" || c.kip === "arastirma") && sikistirmaGerekli(s, yol, model, 0)) {
    yaz({ t: "ozet-basla" });
    const r = await sohbetiSikistir({ s, yol, model, signal: y.durdur.signal }).catch(() => ({ yok: "Özetlenemedi." }));
    if ("ozet" in r) { await sohbetKaydet(s, sahip); yaz({ t: "ozet", ozet: r.ozet }); }
    else yaz({ t: "ozet-yok" });
  }
  const { gecmis, n0 } = await gecmisKur(s, yol, model);
  if (!c.devam && !(a.api?.length)) gecmis.length = n0;
  const istek = kullanici?.istek;
  // Yanıtı değiştir: önceki yanıt ve istenen yön son kullanıcı iletisine eklenir (yalnız bu tur).
  if (c.degistir && !c.devam) {
    const son = gecmis[gecmis.length - 1] as { role: string; content: unknown } | undefined;
    const not = { type: "text", text: `<degistir>
Bu mesaja daha önce şu yanıtı verdin:
<onceki-yanit>
${c.degistir.onceki}
</onceki-yanit>
Şimdi aynı yanıtı şu yönde değiştirerek yeniden yaz: ${c.degistir.talimat}
İçeriği koru, yalnız istenen yönde değiştir. Değiştirdiğini söyleme, doğrudan yeni yanıtı ver.
</degistir>` };
    if (son?.role === "user") son.content = [...(Array.isArray(son.content) ? son.content : [{ type: "text", text: String(son.content ?? "") }]), not];
  }
  // v4 araçları (yalnız genel sohbet): tablolar ekte varsa veri analizi, geçici değilse görev ve geçmiş sohbet araması.
  const ekler = ajan ? [] : yol.flatMap((m) => (m.rol === "kullanici" ? m.ekler ?? [] : []));
  const veriVar = ekler.some(veriEkiMi);
  let tabloSozu: Promise<VeriTablosu[]> | null = null;
  const tablolar = () => (tabloSozu ??= ekTablolari(ekler).catch(() => []));

  // Bağlam: yetenekler, bağlantılar, klasör, bellek.
  // Yetenekler etkin hâlleriyle gelir (sabitlenen sürüm, taramadan geçen içerik); kritik bulgulu olanlar null döner ve atlanır.
  const tumYetenekler = ajan ? [] : await yetenekleriListele(sahip).catch(() => [] as Yetenek[]);
  const adaylar: Yetenek[] = ajan
    ? (await Promise.all((ajan.yetenekler ?? []).map((x) => yetenekGetir(x, sahip).catch(() => null)))).filter((x): x is Yetenek => !!x)
    : tumYetenekler.filter((x) => (x.herSohbette && !s.kapaliYetenekler?.includes(x.id)) || s.yetenekler?.includes(x.id) || istek?.yetenekler?.includes(x.ad));
  // Çağrı ilkesi: yalnız elle çağrılanlar mesajda /ad ya da @ad yoksa düşer; her zaman açıkların gövdesi sisteme eklenir.
  // Besteci @ bahsetmelerini metinden çip yapar; burada metne geri eklenir.
  const cagriMetni = [kullanici?.metin ?? "", ...(istek?.yetenekler ?? []).map((y) => `@${y}`)].join(" ");
  const { liste: yetenekler, sistemEki: yetenekEki } = yetenekleriCagriyaGoreHazirla(adaylar, cagriMetni);
  const tumBaglantilar = ajan ? [] : await baglantilariListele(sahip);
  // Genel sohbette yalnız kullanım yeri "sohbet" olan bağlantılar; sohbetin kendi seçimi bunların arasından yapılır.
  const baglantilar: Baglanti[] = ajan
    ? (await Promise.all((ajan.baglantilar ?? []).map((b) => baglantiGetir(b, sahip)))).filter((x): x is Baglanti => !!x)
    : tumBaglantilar.filter((b) => baglantiKullanilabilir(b, "sohbet") && ((s.baglantiSecimi ? s.baglantiSecimi.includes(b.id) : true) || istek?.baglantilar?.includes(b.ad)));
  // Klasör: kendi klasörün ya da (üyeliğin bu turda doğrulandıysa) seninle paylaşılan klasör.
  const klasorOz = s.ortakKlasor && ortakIzin.get(s) ? s.ortakKlasor.sahipOz : null;
  const klasor = ajan || !s.klasor ? null : klasorOz ? await klasorGetirOz(klasorOz, s.ortakKlasor!.id) : s.ortakKlasor ? null : await klasorGetir(sahip, s.klasor);
  const kb = klasor ? klasorBolumu(klasor) : null;
  const hesapBellegi = ajan ? null : await bellekGetir(sahip);
  // Klasör belleği kipinde kayıtlar klasörden gelir ve klasöre yazılır (hesap belleği görülmez); tercihler hesaptan.
  const klasorBellek = !!klasor && bellekModu(klasor) === "klasor";
  const bellek = hesapBellegi && klasorBellek ? { ...hesapBellegi, acik: true, kayitlar: (klasor!.kayitlar ?? []).map((k) => ({ ...k })) } : hesapBellegi;
  const bellekKullan = !!bellek && !s.gecici && !s.bellekKapali && (klasor ? bellekModu(klasor) !== "kapali" : true) && bellek.acik;
  const klasorBellegeYaz = async (f: (l: NonNullable<typeof klasor>["kayitlar"] & object) => void) => {
    if (!klasor) return;
    const oz = klasorOz ?? sahipOzeti(sahip);
    await klasorlerGuncelleOz(oz, (l) => { const x = l.find((y) => y.id === klasor.id); if (x) { x.kayitlar ??= []; f(x.kayitlar); x.kayitlar = x.kayitlar.slice(-200); } });
  };

  const mcp = mcpAraclariHazirla(baglantilar, false, { yer: ajan ? "ajan" : "sohbet" });
  const izin = (ad: string): AracIzni => {
    if (!ajan && HEP_SOR.has(ad)) return s.izinliAraclar?.includes(ad) ? "her-zaman" : "sor";
    const temel: AracIzni = mcp.harita[ad] ? mcp.harita[ad].izin : ajan ? ajan.araclar[ad] ?? (AJAN_OKUMA.has(ad) ? "her-zaman" : "kapali") : "her-zaman";
    if (temel !== "her-zaman" || s.izinModu !== "onay" || s.izinliAraclar?.includes(ad)) return temel;
    return YAN_ETKILI.has(ad) || (mcp.harita[ad] && !mcp.harita[ad].okuma) ? "sor" : temel;
  };
  const acik = (ad: string) => izin(ad) !== "kapali";
  const ozel: Anthropic.Beta.BetaTool[] = c.kip === "plan" || c.kip === "kurul" ? [] : ajan
    ? sohbetAraclari(new Set(Object.keys(ajan.araclar).filter((k) => acik(k) && !SUNUCU_ARACLARI.has(k))), { bellek: ajan.bellek.acik, bilgiArama: ajan.bilgi.reduce((t, b) => t + b.icerik.length, 0) > 60_000, yetenek: yetenekler.length > 0 })
    : sohbetAraclari(null, { yetenek: yetenekler.length > 0, bilgiArama: !!kb?.arama });
  if (c.kip === "normal" || c.kip === "arastirma") {
    ozel.push(...mcp.araclar);
    if (bellekKullan) ozel.push(...bellekAraclari());
    // Etkin yeteneklerden biri betik taşıyorsa genel sohbette betik aracı da verilir (kum havuzunda çalışır).
    if (!ajan && yetenekler.some((y) => calisirBetikler(y).length)) ozel.push(YETENEK_BETIK_ARACI as Anthropic.Beta.BetaTool);
    if (!ajan) ozel.push(...ekAraclar({ veri: veriVar, gecmis: !s.gecici && !!bellek?.acik && !s.bellekKapali, gorev: !s.gecici }));
  }
  const asistanKarti = !ajan && s.asistan ? asistanBul(s.asistan) : null;
  const ekBolum = ajan || c.kip === "plan" || c.kip === "kurul" ? "" : ekAracBolumu({ veri: veriVar, gecmis: !s.gecici && !!bellek?.acik && !s.bellekKapali, gorev: !s.gecici, ogrenme: !!s.ogrenme, tuval: !!istek?.tuval })
    + await tuvalBolumu(sahip, s.tuvaller) + (veriVar ? tabloTarifi(await tablolar()) : "") + (asistanKarti ? asistanBolumu(asistanKarti) : "");
  const arastirmaBolumu = c.kip === "arastirma" && c.plan ? `

<arastirma>
Bu bir derin araştırma görevi. Kullanıcının onayladığı plan: "${c.plan.baslik}"
${c.plan.adimlar.map((x, i) => `${i + 1}. ${x}`).join("\n")}
Çalışma şekli: plandaki her adım için web_search ile birbirinden farklı sorgular yap (toplam 10-20 arama), en değerli kaynakları web_fetch ile oku, bilgileri karşılaştır, çelişkileri not et. Güncel ve birincil kaynakları tercih et.
Rapor: Türkçe, "# Başlık" ile başla, ardından 2-3 cümlelik özet; her plan adımı için "## " bölümü, gerektiğinde tablo; sonunda "## Sonuç". Her önemli iddiayı kaynağına dayandır. Yalnız raporu yaz; süreç anlatma.
</arastirma>` : "";
  const sistem = (ajan ? ajanSistemi(ajan, false, yetenekler) : sohbetSistemi("", yetenekler)) + yetenekEki + mcp.talimat + (kb?.metin ?? "") + (bellek ? bellekBolumu(bellek, bellekKullan) : "") + arastirmaBolumu + ekBolum;
  const baglam = { ajanId: ajan?.id, bilgi: ajan?.bilgi ?? (klasor ? klasorBilgisi(klasor) : undefined), yetenekler, sohbetId: s.id };
  const sahipOz = sahipOzeti(sahip);
  const kaydet = async () => { if (c.kip !== "plan" && c.kip !== "kurul") a.api = gecmis.slice(n0); await sohbetKaydet(s, sahip); };
  const yurut = async (ad: string, girdi: unknown): Promise<AracCiktisi> => {
    const h = mcp.harita[ad];
    if (h) {
      const x = await mcpAracYurut(h, girdi, sahipOz, ajan ? `ajan:${ajan.ad}` : "sohbet");
      // Arayüzlü araç (MCP Apps): parça görünüm verisini saklar; modelin gördüğü metin (icerik) aynı kalır.
      const uyg = x.uygulama ? { ...x.uygulama, ...(ajan ? { ajanId: ajan.id } : {}) } : undefined;
      return { icerik: x.icerik, hata: x.hata, sonuc: uyg ?? (x.gorseller?.length ? { tur: "gorsel", urller: x.gorseller } : undefined) };
    }
    if (!ajan && (ad === "bellege_yaz" || ad === "bellekten_sil")) {
      if (!bellekKullan) return { icerik: "Bellek bu sohbette kapalı.", hata: true };
      const v = (girdi ?? {}) as { not?: string; kimlik?: string };
      if (ad === "bellege_yaz") {
        const not = String(v.not ?? "").trim().slice(0, 400);
        if (!not) return { icerik: "Kayıt boş.", hata: true };
        const kim = bellekKimligi();
        if (klasorBellek) { await klasorBellegeYaz((l) => { l.push({ id: kim, metin: not, zaman: Date.now(), kaynak: { sohbet: s.id, baslik: s.baslik } }); }); return { icerik: `Klasörün belleğine yazıldı [${kim}].` }; }
        await bellekGuncelle(sahip, (b) => { b.kayitlar.push({ id: kim, metin: not, zaman: Date.now(), kaynak: { sohbet: s.id, baslik: s.baslik } }); });
        return { icerik: `Belleğe yazıldı [${kim}].` };
      }
      let silindi = false;
      if (klasorBellek) { await klasorBellegeYaz((l) => { const i = l.findIndex((k) => k.id === v.kimlik); if (i >= 0) { l.splice(i, 1); silindi = true; } }); return silindi ? { icerik: "Kayıt klasörün belleğinden silindi." } : { icerik: "Bu kimlikte kayıt yok.", hata: true }; }
      await bellekGuncelle(sahip, (b) => { const n = b.kayitlar.length; b.kayitlar = b.kayitlar.filter((k) => k.id !== v.kimlik); silindi = b.kayitlar.length < n; });
      return silindi ? { icerik: "Kayıt bellekten silindi." } : { icerik: "Bu kimlikte kayıt yok.", hata: true };
    }
    if (!ajan) { const x = await ekAracYurut(ad, girdi, { sahip, s, calisanlar: new Set(), tablolar }); if (x) return x; }
    if (!ajan && ad === "yetenek_betigi") { const x = await yetenekBetikAraciYurut(yetenekler, girdi); return { icerik: x.icerik, hata: x.hata }; }
    return sohbetAraciYurut(ad, girdi, sahip, baglam);
  };

  let r: MotorSonucu;
  let turKredi = 0;
  if (c.kip === "plan") {
    r = await planHazirla({ model, gecmis, a, yaz, signal: y.durdur.signal, efor: c.efor });
  } else if (c.kip === "kurul") {
    r = await kurulCalistir({ s, a, gecmis, sistem, yaz, signal: y.durdur.signal, efor: c.efor, istek: istek! });
    turKredi += r.aracKredi;
    r = { ...r, aracKredi: 0 };
  } else {
    let sonTur = 0;
    r = await motoruCalistir({
      model, sistem, gecmis, efor: c.kip === "arastirma" ? "high" : c.efor, izin, ozel,
      sunucu: sunucuAraclari(model, acik, c.kip === "arastirma" ? { arama: 20, okuma: 15 } : {}),
      parcalar: a.parcalar!, yaz, signal: y.durdur.signal, yurut, etiket: (ad) => mcp.harita[ad]?.ad, kaydet,
      devam: c.devam, ...(c.kip === "arastirma" ? { turSiniri: 30 } : {}),
      turKullanimi: (k) => { sonTur = k.girdi + k.onbellek + k.yazilan + k.cikti; },
    });
    a.api = gecmis.slice(n0);
    // Son model turunun gördüğü bağlam (sistem istemi ve araçlar dahil) bir sonraki doluluk hesabının temeli olur.
    if (sonTur > 0) a.baglam = sonTur;
  }

  a.durum = r.durum === "bitti" && c.kip === "plan" ? "plan-bekliyor" : r.durum;
  if (r.hata) a.hata = r.hata; else delete a.hata;
  if (r.bekleyen) s.bekleyen = { asistanId: a.id, cagrilar: r.bekleyen };
  a.sureMs = (a.sureMs ?? 0) + (Date.now() - bas);
  a.kullanim = kullanimTopla(a.kullanim, r.kullanim);
  turKredi += krediHesapla(model, r.kullanim) + r.aracKredi;
  a.aracKredi = (a.aracKredi ?? 0) + r.aracKredi;
  const krediOnce = a.kredi ?? 0;
  a.kredi = krediOnce + turKredi;
  const kesinti = await buildKrediKes(sahip, turKredi, { kaynak: "build:sohbet", is: `${s.id}:${a.id}:${krediOnce}`, aciklama: `Sohbet: ${s.baslik || "yanıt"}` });
  // Bellek kaynağı: yanıtın sonundaki gizli etiket.
  const tumMetin = (a.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("");
  const kimlikler = bellekKimlikleri(tumMetin);
  if (kimlikler.length && bellek) a.bellek = bellek.kayitlar.filter((k) => kimlikler.includes(k.id)).map((k) => ({ id: k.id, metin: k.metin }));
  if (tumMetin.includes("<bellek-kaynak")) a.parcalar = (a.parcalar ?? []).map((p) => (p.tur === "metin" ? { ...p, metin: bellekEtiketiniGizle(p.metin.replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "")) } : p));
  if (ajan) { const k = turKredi; await ajanSayacArtir(ajan.id, (x) => { x.istatistik.kredi += k; }); }
  s.guncelleme = Date.now();
  await sohbetKaydet(s, sahip);
  yaz({ t: "bitti", mesaj: acikMesaj(a), turKredi, ...(kesinti ? { bakiye: kesinti.bakiye } : {}), secim: s.secim, baglam: baglamTahmini(s, mesajaKadar(s.mesajlar, a.id)) });
}

/** Araştırma planı: modelden kısa bir JSON plan ister; kullanıcı düzenleyip başlatır. */
async function planHazirla(g: { model: BuildModel; gecmis: unknown[]; a: SohbetMesaji; yaz: (o: Record<string, unknown>) => void; signal: AbortSignal; efor: Efor }): Promise<MotorSonucu> {
  const { a, yaz } = g;
  a.parcalar = [{ tur: "plan", baslik: "", adimlar: [], durum: "hazirlaniyor" }];
  yaz({ t: "ekle", parca: a.parcalar[0] });
  const gecici: SohbetParca[] = [];
  const sistem = `Sen Vayra'nın araştırma planlayıcısısın. Kullanıcının son sorusu için web'de yapılacak derin bir araştırmanın planını çıkar.
Yalnız şu biçimde tek bir JSON döndür, başka hiçbir şey yazma:
{"baslik": "Araştırmanın kısa başlığı", "adimlar": ["Adım 1", "Adım 2", "Adım 3"]}
3 ile 6 arasında adım; her adım ne araştırılacağını anlatan tek bir Türkçe cümle.`;
  const r = await motoruCalistir({ model: g.model, sistem, gecmis: g.gecmis, efor: "low", izin: () => "kapali", ozel: [], sunucu: [], parcalar: gecici, yaz: () => {}, yurut: async () => ({ icerik: "", hata: true }), kaydet: async () => {}, signal: g.signal });
  const t = gecici.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("");
  const plan = planCoz(t);
  if (!plan) {
    a.parcalar = [];
    yaz({ t: "guncelle", i: 0, parca: { tur: "metin", metin: "" } });
    return { ...r, durum: r.durum === "bitti" ? "hata" : r.durum, hata: r.hata ?? "Araştırma planı hazırlanamadı. Tekrar dene." };
  }
  a.parcalar = [{ tur: "plan", baslik: plan.baslik, adimlar: plan.adimlar, durum: "bekliyor" }];
  yaz({ t: "guncelle", i: 0, parca: a.parcalar[0] });
  return r;
}
function planCoz(t: string): { baslik: string; adimlar: string[] } | null {
  const j = /\{[\s\S]*\}/.exec(t)?.[0];
  if (j) {
    try {
      const v = JSON.parse(j) as { baslik?: unknown; adimlar?: unknown };
      const adimlar = Array.isArray(v.adimlar) ? v.adimlar.map((x) => String(x).trim()).filter(Boolean).slice(0, 8) : [];
      if (adimlar.length) return { baslik: String(v.baslik ?? "Araştırma").trim().slice(0, 160) || "Araştırma", adimlar };
    } catch { /* düz metin */ }
  }
  const maddeler = t.split("\n").map((x) => x.replace(/^\s*([-*•]|\d+[.)])\s+/, "").trim()).filter((x, i, l) => x.length > 8 && l.length > 1).slice(0, 8);
  return maddeler.length >= 2 ? { baslik: "Araştırma", adimlar: maddeler } : null;
}

/** Model kurulu: aynı soruyu birden çok modele paralel sorar, sonra sentez modeli birleşik yanıt yazar. */
async function kurulCalistir(g: { s: Sohbet; a: SohbetMesaji; gecmis: unknown[]; sistem: string; yaz: (o: Record<string, unknown>) => void; signal: AbortSignal; efor: Efor; istek: TurIstegi }): Promise<MotorSonucu> {
  const { a, yaz } = g;
  const k = g.istek.kurul!;
  const modeller = k.modeller.map((m) => modelBul(m));
  a.kurul = { cevaplar: modeller.map((m) => ({ model: m.id, metin: "", durum: modelBagli(m) ? "suruyor" : "hata", ...(modelBagli(m) ? {} : { hata: "Bu model sunucuya bağlı değil." }) })), sentez: modelBul(k.sentez).id };
  yaz({ t: "kurul-basla", kurul: a.kurul });
  const kullanim: Kullanim = { girdi: 0, cikti: 0, onbellek: 0, yazilan: 0 };
  let kredi = 0;
  await Promise.all(modeller.map(async (m, i) => {
    const cv = a.kurul!.cevaplar[i];
    if (cv.durum === "hata") { yaz({ t: "kurul-durum", i, cevap: cv }); return; }
    const bas = Date.now();
    const parcalar: SohbetParca[] = [];
    const r = await motoruCalistir({
      model: m, sistem: g.sistem, gecmis: structuredClone(g.gecmis), efor: g.efor, izin: () => "kapali", ozel: [], sunucu: [], parcalar,
      yaz: (o) => { if (o.t === "metin") { cv.metin += String(o.ek); yaz({ t: "kurul", i, ek: o.ek }); } }, yurut: async () => ({ icerik: "", hata: true }), kaydet: async () => {}, signal: g.signal,
    });
    cv.metin = bellekEtiketiniGizle(parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")).trim();
    cv.durum = r.durum === "bitti" ? "bitti" : r.durum === "durduruldu" ? "durduruldu" : "hata";
    if (r.hata) cv.hata = r.hata;
    cv.sureMs = Date.now() - bas;
    cv.kredi = krediHesapla(m, r.kullanim);
    kredi += cv.kredi;
    yaz({ t: "kurul-durum", i, cevap: cv });
  }));
  if (g.signal.aborted) return { durum: "durduruldu", kullanim, aracKredi: kredi };
  const iyi = a.kurul.cevaplar.filter((x) => x.durum === "bitti" && x.metin);
  if (!iyi.length) return { durum: "hata", hata: "Kurul modellerinden yanıt alınamadı.", kullanim, aracKredi: kredi };
  const sentezModeli = modelBagli(modelBul(k.sentez)) ? modelBul(k.sentez) : modelBul(iyi[0].model);
  a.kurul.sentez = sentezModeli.id;
  const sonIleti = (g.gecmis[g.gecmis.length - 1] as { content: string | { type: string; text?: string }[] } | undefined)?.content;
  const soru = typeof sonIleti === "string" ? sonIleti : (sonIleti ?? []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const sistem = `Sen Vayra'nın model kurulu sentezcisisin. Aynı soruyu birden çok yapay zekâ modeli yanıtladı. Görevin:
1. En doğru ve eksiksiz tek bir yanıt yaz (modellerin en iyi kısımlarını birleştir, hatalı olanları ayıkla). Başlık koyma, doğrudan yanıtla başla.
2. Sonra şu bölümleri yaz:
## Uzlaşma
Modellerin hemfikir olduğu noktalar (kısa maddeler).
## Ayrışma
Modellerin farklı düşündüğü noktalar; hangi model ne dedi ve hangisi neden daha doğru.
## Tek modelde olan içgörüler
Yalnız bir modelin söylediği değerli noktalar (model adıyla).
Türkçe yaz, kısa ve net ol. Emoji kullanma.`;
  const ileti = `Soru:\n${soru}\n\n${iyi.map((x) => `<yanit model="${modelBul(x.model).ad}">\n${x.metin.slice(0, 30000)}\n</yanit>`).join("\n\n")}`;
  const sg: unknown[] = [{ role: "user", content: [{ type: "text", text: ileti }] }];
  const r = await motoruCalistir({ model: sentezModeli, sistem, gecmis: sg, efor: g.efor, izin: () => "kapali", ozel: [], sunucu: [], parcalar: a.parcalar!, yaz, yurut: async () => ({ icerik: "", hata: true }), kaydet: async () => {}, signal: g.signal });
  a.model = sentezModeli.id;
  const sentez = asistanMetni(a);
  a.api = sentez ? [{ role: "assistant", content: [{ type: "text", text: sentez }] }] : [];
  // Kurul üyelerinin kredisi araç kredisi gibi toplanır; sentezin kullanımı ayrıca sayılır.
  return { ...r, aracKredi: kredi };
}
