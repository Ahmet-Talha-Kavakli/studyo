import "server-only";
import { isletmeOku } from "./isletme";
import { listeOku } from "./isletme";
import { projeyeYaz } from "./isletmeIcerik";
import { isletmePara, type Yazi } from "./isletmeTipler";
import { siteAdresi } from "./bulutKimlik";
import { kampanyaYaz } from "./buyumeAnaliz";
import { bioAyir, bioBirak, bioBul, ekGuncelle, ekOku } from "./buyumeEkDepo";
import { abKazananSec, epostaDurumu, buyumeTuruCalistir } from "./buyumeEposta";
import { kisileriKur } from "./buyumeKisiler";
import { bultenKur } from "./buyumeBulten";
import { akisDenemesi, akisIstemci, akisKayitlariniSil, akisOku, kisiAkislariniSil, akisTohumla, akisTuru, akistanCikar, dizinEkle, saatProfili } from "./buyumeAkis";
import { akisSablonu, akisSorunlari, AKIS_SINIRI, butunAdimlar, TETIKLER, type Adim, type Akis, type TetikTur } from "./buyumeAkisTipler";
import { BIO_OGELERI, BIO_SOSYAL, BIO_TEMALARI, bioKodGecerli, bosBioIst, type BioOge, type BioSayfa, type BioTema } from "./buyumeBio";
import { gorunurlukDenetle, MOTORLAR, type AnilmaMotor } from "./buyumeGorunurluk";
import { anilmaTesti, llmsUret, motorDurumlari, soruOner, soruOnerAi } from "./buyumeAnilma";
import { GBP_SINIR, IYS_KAYNAKLARI, iysSatirlari, type GbpCta, type GbpGonderi, type GbpTur, type IysKaynak, type SosyalAg } from "./buyumeKanalTipler";
import { anahtarDurumu, baglantiyiKes, belirtecAl, donusAdresi, gonderiPaylas, SAGLAYICILAR, yetkiAdresi, type OauthAg } from "./buyumeSosyal";
import { gbpDurumu, gbpKaynakTaslaklari, gbpKonumlari, gbpTaslakYaz, gbpYayinla } from "./buyumeGbp";
import { iysDurumu, iysGonder, iysIstekDurumu } from "./buyumeIys";
import { EPOSTA_REJIMLERI, kimlikUret, type Blok, type EkVeri, type EpostaRejim, type KonuDeneyi } from "./buyumeEkTipler";
import { listeDegistir } from "./isletme";
import type { Abone } from "./isletmeTipler";
import type { Proje } from "./tipler";

/**
 * Büyüme v5 uçlarının iş mantığı (rota dosyası ince kalsın diye): otomasyon akışları, bülten, konu satırı denemesi,
 * bio sayfası, yapay zekâ görünürlüğü, Google İşletme Profili, İYS ve sosyal hesap bağlantıları.
 */
export const metin = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");
export const sayi = (x: unknown, en: number) => { const n = Number(x); return Number.isFinite(n) ? Math.max(0, Math.min(en, n)) : 0; };
const etiket = (x: unknown) => String(x ?? "").trim().toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 30);
const SAAT_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const idGecerli = (x: unknown) => typeof x === "string" && /^[a-z0-9]{4,24}$/i.test(x);

export function blokTemizle(x: unknown): Blok[] {
  return (Array.isArray(x) ? x : []).slice(0, 40).map((b0) => {
    const b = (b0 ?? {}) as Record<string, unknown>;
    const tur = (["baslik", "metin", "dugme", "gorsel", "ayirici"].includes(String(b.tur)) ? b.tur : "metin") as Blok["tur"];
    const adres = metin(b.adres, 600).trim();
    const gorsel = metin(b.gorsel, 600).trim();
    return { id: idGecerli(b.id) ? String(b.id) : kimlikUret(), tur, metin: metin(b.metin, 4000) || undefined, adres: adres || undefined, gorsel: /^(https:\/\/|\/api\/dosya\/gorsel\/)[^\s"'<>]+$/.test(gorsel) ? gorsel : undefined };
  });
}
export function abTemizle(x: unknown, konu: string): KonuDeneyi | undefined {
  if (!x || typeof x !== "object") return undefined;
  const o = x as Record<string, unknown>;
  const konular = [konu, ...(Array.isArray(o.konular) ? o.konular.slice(1, 3) : []).map((k) => metin(k, 150))];
  return { konular, pay: Math.round(Math.min(50, Math.max(10, sayi(o.pay, 50) || 20))), sure: [1, 2, 4, 8, 12, 24].includes(Number(o.sure)) ? Number(o.sure) : 4, olcut: o.olcut === "tik" ? "tik" : "acilma" };
}

/* ── Akış temizleme ── */
function adimTemizle(x: unknown, derinlik = 0): Adim | null {
  const a = (x ?? {}) as Record<string, unknown>;
  const id = idGecerli(a.id) ? String(a.id) : kimlikUret();
  switch (a.tur) {
    case "bekle": return { id, tur: "bekle", sure: Math.max(1, Math.round(sayi(a.sure, 365))), birim: a.birim === "dakika" || a.birim === "saat" ? a.birim : "gun" };
    case "eposta": return { id, tur: "eposta", ad: metin(a.ad, 60).trim() || "E-posta", konu: metin(a.konu, 150), onMetin: metin(a.onMetin, 150), bloklar: blokTemizle(a.bloklar), saat: a.saat === "kisisel" || a.saat === "sabit" ? a.saat : "hemen", sabitSaat: SAAT_RE.test(String(a.sabitSaat)) ? String(a.sabitSaat) : undefined, kupon: metin(a.kupon, 30).trim().toUpperCase() || undefined };
    case "kosul": {
      if (derinlik >= 2) return null;
      const k = ["siparis-verdi", "acti", "tikladi", "etiket-var", "harcama", "siparis-sayisi", "izin-onay"].includes(String(a.kosul)) ? a.kosul : "tikladi";
      const dal = (l: unknown) => (Array.isArray(l) ? l : []).slice(0, 12).map((y) => adimTemizle(y, derinlik + 1)).filter((y): y is Adim => !!y);
      return { id, tur: "kosul", kosul: k as never, deger: k === "etiket-var" ? etiket(a.deger) : metin(a.deger, 12).replace(/[^\d.]/g, "") || undefined, evet: dal(a.evet), hayir: dal(a.hayir) };
    }
    case "etiket": return { id, tur: "etiket", etiket: etiket(a.etiket) };
    default: return null;
  }
}
const yapi = (l: Adim[]): string => l.map((a) => (a.tur === "kosul" ? `${a.id}(${yapi(a.evet)}|${yapi(a.hayir)})` : a.id)).join(",");

/** PATCH: v5 düzenlemeleri. undefined: bu tür burada değil. */
export function v5Duzenle(tur: string, g: Record<string, unknown>, v: EkVeri, p: Proje, id: string, sonra: (f: () => Promise<unknown>) => void): string | null | undefined {
  switch (tur) {
    case "akis": {
      const x = (g.akis ?? {}) as Record<string, unknown>;
      let a = v.akislar.find((y) => y.id === x.id);
      if (!a) {
        if (v.akislar.length >= AKIS_SINIRI) return `En çok ${AKIS_SINIRI} akış tutulur.`;
        const t = (TETIKLER.some((y) => y.id === x.tetik) ? x.tetik : "hosgeldin") as TetikTur;
        const s = akisSablonu(t, siteAdresi(p, String(g.koken ?? "")), metin(x.kupon, 30).toUpperCase());
        a = { id: kimlikUret(), ...s, ...(x.bos ? { adimlar: [], ad: "Yeni akış" } : {}), durum: "taslak", izin: "onayli", akilli: true, sessiz: true, gecmis: false, olusturma: Date.now(), guncelleme: Date.now() } as Akis;
        v.akislar.unshift(a);
        return null;
      }
      if ("adimlar" in x) {
        const yeni = (Array.isArray(x.adimlar) ? x.adimlar : []).slice(0, 30).map((y) => adimTemizle(y)).filter((y): y is Adim => !!y);
        if (butunAdimlar(yeni).length > 60) return "Bir akışta en çok 60 adım olabilir.";
        if (a.durum === "acik" && yapi(yeni) !== yapi(a.adimlar)) return "Açık akışın adımları eklenip çıkarılamaz ya da yer değiştiremez; önce durdur. İçerik ve süreler açıkken de düzenlenebilir.";
        a.adimlar = yeni;
      }
      if ("ad" in x) a.ad = metin(x.ad, 80).trim() || a.ad;
      if ("tetik" in x && x.tetik !== a.tetik) { if (a.durum === "acik") return "Açık akışın tetiği değiştirilemez; önce durdur."; if (TETIKLER.some((y) => y.id === x.tetik)) a.tetik = x.tetik as TetikTur; }
      if (x.ayar && typeof x.ayar === "object") {
        const s = x.ayar as Record<string, unknown>;
        a.ayar = {
          kaynak: (Array.isArray(s.kaynak) ? s.kaynak : []).filter((k): k is "abone" | "uye" | "form" => ["abone", "uye", "form"].includes(String(k))),
          ilk: s.ilk === true, enAzTutar: sayi(s.enAzTutar, 1e7) || undefined, gunOnce: Math.round(sayi(s.gunOnce, 14)), gun: Math.round(Math.max(14, sayi(s.gun, 365) || 90)),
          hizmet: metin(s.hizmet, 40) || undefined, etiket: etiket(s.etiket) || undefined, saat: SAAT_RE.test(String(s.saat)) ? String(s.saat) : undefined,
        };
      }
      if ("izin" in x) { a.izin = x.izin === "belirsiz-dahil" ? "belirsiz-dahil" : "onayli"; if (a.izin === "onayli") a.izinBeyan = undefined; }
      for (const k of ["siparisCikis", "akilli", "sessiz", "gecmis"] as const) if (k in x) a[k] = x[k] === true;
      if ("yeniden" in x) a.yeniden = Math.round(sayi(x.yeniden, 365));
      a.guncelleme = Date.now();
      return null;
    }
    case "akisSil": {
      const a = v.akislar.find((y) => y.id === g.id);
      if (!a) return null;
      v.akislar = v.akislar.filter((y) => y.id !== a.id);
      sonra(() => akisKayitlariniSil(id, a.id));
      return null;
    }
    case "bio": {
      const x = (g.bio ?? {}) as Record<string, unknown>;
      const b = v.bio;
      if (!b) return "Önce bio sayfasını oluştur.";
      if ("kod" in x) {
        const k = metin(x.kod, 32).trim().toLowerCase();
        if (!bioKodGecerli(k)) return "Adres 3 ile 32 karakter; küçük harf, rakam, tire ve alt çizgi.";
        if (k !== b.kod) { if (!bioAyir(k, id, b.kod)) return "Bu adres başkası tarafından kullanılıyor."; b.kod = k; }
      }
      if ("acik" in x) b.acik = x.acik === true;
      if ("baslik" in x) b.baslik = metin(x.baslik, 80).trim() || b.baslik;
      if ("aciklama" in x) b.aciklama = metin(x.aciklama, 300);
      if ("avatar" in x) { const u = metin(x.avatar, 600).trim(); b.avatar = /^(https:\/\/|\/api\/dosya\/gorsel\/)[^\s"'<>]+$/.test(u) ? u : undefined; }
      if ("rozet" in x) b.rozet = x.rozet !== false;
      if (x.tema && typeof x.tema === "object") {
        const t = x.tema as Record<string, unknown>; const h = (r: unknown, v0: string) => (/^#[0-9a-f]{6}$/i.test(String(r)) ? String(r).toLowerCase() : v0);
        const taban = BIO_TEMALARI.find((y) => y.id === t.id) ?? b.tema;
        b.tema = { id: (t.id === "ozel" || BIO_TEMALARI.some((y) => y.id === t.id) ? t.id : b.tema.id) as BioTema["id"], zemin: h(t.zemin, taban.zemin), zemin2: h(t.zemin2, taban.zemin2), yazi: h(t.yazi, taban.yazi), dugme: h(t.dugme, taban.dugme), dugmeYazi: h(t.dugmeYazi, taban.dugmeYazi), stil: (["dolu", "cerceve", "yumusak"].includes(String(t.stil)) ? t.stil : taban.stil) as BioTema["stil"], kose: (["hap", "yuvarlak", "keskin"].includes(String(t.kose)) ? t.kose : taban.kose) as BioTema["kose"], yaziTipi: (["sistem", "serif", "yuvarlak"].includes(String(t.yaziTipi)) ? t.yaziTipi : taban.yaziTipi) as BioTema["yaziTipi"] };
      }
      if (Array.isArray(x.ogeler)) b.ogeler = x.ogeler.slice(0, 40).map((o0): BioOge => { const o = (o0 ?? {}) as Record<string, unknown>; const tur = (BIO_OGELERI.some((y) => y.id === o.tur) ? o.tur : "baglanti") as BioOge["tur"]; const adres = metin(o.adres, 800).trim(); const gorsel = metin(o.gorsel, 600).trim(); const tarih = (s: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? String(s) : undefined); return { id: idGecerli(o.id) ? String(o.id) : kimlikUret(), tur, ad: metin(o.ad, 140).trim(), alt: metin(o.alt, 160).trim() || undefined, adres: /^(https?:\/\/|mailto:|tel:)[^\s"'<>]+$/i.test(adres) ? adres : undefined, gorsel: /^(https:\/\/|\/api\/dosya\/gorsel\/)[^\s"'<>]+$/.test(gorsel) ? gorsel : undefined, acik: o.acik !== false, vurgu: o.vurgu === true, bas: tarih(o.bas), bit: tarih(o.bit), numara: metin(o.numara, 20).replace(/\D/g, "") || undefined, mesaj: metin(o.mesaj, 300) || undefined }; });
      if (x.sosyal && typeof x.sosyal === "object") { const s = x.sosyal as Record<string, unknown>; b.sosyal = Object.fromEntries(BIO_SOSYAL.map((y) => [y.id, metin(s[y.id], 200).trim()]).filter(([, u]) => u)); }
      if (x.seo && typeof x.seo === "object") { const s = x.seo as Record<string, unknown>; b.seo = { baslik: metin(s.baslik, 70), aciklama: metin(s.aciklama, 160), indeks: s.indeks !== false }; }
      b.guncelleme = Date.now();
      return null;
    }
    case "bioSil": { if (v.bio) bioBirak(v.bio.kod, id); v.bio = null; return null; }
    case "bioIstSifirla": { if (v.bio) v.bio.ist = bosBioIst(); return null; }
    case "gbpGonderi": {
      const x = (g.gonderi ?? {}) as Record<string, unknown>;
      let k = v.gbp.gonderiler.find((y) => y.id === x.id);
      if (!k) { if (v.gbp.gonderiler.length >= 60) return "En çok 60 gönderi tutulur."; k = { id: kimlikUret(), tur: "STANDARD", metin: "", cta: "LEARN_MORE", durum: "taslak", olusturma: Date.now(), guncelleme: Date.now() } as GbpGonderi; v.gbp.gonderiler.unshift(k); }
      if (k.durum === "yayinda") return "Yayımlanan gönderi buradan düzenlenemez; Google İşletme Profili'nde düzenle.";
      if ("tur" in x) k.tur = (["STANDARD", "OFFER", "EVENT"].includes(String(x.tur)) ? x.tur : "STANDARD") as GbpTur;
      if ("metin" in x) k.metin = metin(x.metin, GBP_SINIR);
      if ("cta" in x) k.cta = (["", "LEARN_MORE", "BOOK", "ORDER", "SHOP", "SIGN_UP", "CALL"].includes(String(x.cta)) ? x.cta : "") as GbpCta;
      if ("adres" in x) { const u = metin(x.adres, 600).trim(); k.adres = /^https?:\/\/[^\s"'<>]+$/.test(u) ? u : undefined; }
      if ("gorsel" in x) { const u = metin(x.gorsel, 600).trim(); k.gorsel = /^https:\/\/[^\s"'<>]+$/.test(u) ? u : undefined; }
      if (x.etkinlik && typeof x.etkinlik === "object") { const e = x.etkinlik as Record<string, unknown>; const t = (s: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? String(s) : ""); k.etkinlik = { baslik: metin(e.baslik, 58), bas: t(e.bas), bit: t(e.bit) }; }
      if (x.teklif && typeof x.teklif === "object") { const e = x.teklif as Record<string, unknown>; k.teklif = { kod: metin(e.kod, 30).toUpperCase(), kosullar: metin(e.kosullar, 300) }; }
      if (k.durum === "hata") k.durum = "taslak";
      k.guncelleme = Date.now();
      return null;
    }
    case "gbpGonderiSil": v.gbp.gonderiler = v.gbp.gonderiler.filter((y) => y.id !== g.id); return null;
    case "gbpKonum": { const x = (g.konum ?? null) as Record<string, unknown> | null; v.gbp.konum = x && /^accounts\/[\w-]+$/.test(String(x.hesap)) && /^locations\/[\w-]+$/.test(String(x.konum)) ? { hesap: String(x.hesap), konum: String(x.konum), ad: metin(x.ad, 120), adres: metin(x.adres, 200) || undefined } : undefined; return null; }
    case "izinAyar": {
      const x = v.izinAyar ?? { ciftOnay: "bolge", rejimler: [], postaAdresi: "" };
      if (g.ciftOnay === "kapali" || g.ciftOnay === "bolge" || g.ciftOnay === "herkes") x.ciftOnay = g.ciftOnay;
      if (Array.isArray(g.rejimler)) x.rejimler = [...new Set(g.rejimler.filter((y): y is EpostaRejim => EPOSTA_REJIMLERI.some((z) => z.id === y)))];
      if (typeof g.postaAdresi === "string") x.postaAdresi = metin(g.postaAdresi, 300).trim();
      v.izinAyar = x; return null;
    }
    case "iysAyar": { v.iys.kaynakVarsayilan = IYS_KAYNAKLARI.some((k) => k.id === g.kaynak) ? (g.kaynak as IysKaynak) : v.iys.kaynakVarsayilan; if ("tacirEtiket" in g) v.iys.tacirEtiket = etiket(g.tacirEtiket) || undefined; return null; }
    case "sosyalSecili": { const h = v.sosyal.find((y) => y.ag === g.ag); if (!h) return "Hesap bağlı değil."; h.secili = (Array.isArray(g.secili) ? g.secili : []).map(String).filter((x) => h.hedefler.some((y) => y.id === x)); return null; }
    case "sosyalOtomatik": v.sosyalOtomatik = g.acik === true; return null;
    case "yayinSifirla": { const k = metin(g.anahtar, 120); if (v.yayinlar[k]?.durum === "hata") delete v.yayinlar[k]; return null; }
    case "gorunurlukSorular": v.gorunurluk.sorular = (Array.isArray(g.sorular) ? g.sorular : []).map((s) => metin(s, 200).trim()).filter(Boolean).slice(0, 10); return null;
    case "anilmaSil": v.gorunurluk.testler = []; return null;
    default: return undefined;
  }
}

/** GET'e eklenen v5 verisi. */
export async function v5Veri(p: Proje, id: string, ek: EkVeri, koken: string) {
  const [ak, isletme, gbp] = await Promise.all([akisIstemci(id, ek), isletmeOku(id).catch(() => null), gbpDurumu(id, ek)]);
  const bugun = new Date().toLocaleDateString("en-CA", { timeZone: isletme?.profil.saatDilimi || "UTC" });
  const bagli = await Promise.all((["meta", "linkedin", "x", "tiktok"] as SosyalAg[]).map(async (ag) => ({ ag, ...anahtarDurumu(ag), bagli: !!(await belirtecAl(id, ag)), donus: donusAdresi(koken, ag) })));
  return {
    akislar: ak.akislar, akisSon: ak.son, akisUyari: ak.uyari, saatProfili: ak.saat,
    isletme: {
      kuponlar: (isletme?.kuponlar ?? []).filter((k) => k.aktif && (!k.bitis || k.bitis >= bugun)).map((k) => ({ kod: k.kod, ozet: k.tur === "yuzde" ? `yüzde ${k.deger} indirim` : k.tur === "tutar" ? `${isletme ? isletmePara(isletme)(k.deger) : k.deger} indirim` : "ücretsiz kargo", bitis: k.bitis || undefined })),
      hizmetler: (isletme?.randevu.hizmetler ?? []).map((h) => ({ id: h.id, ad: h.ad })),
      terkAcik: !!isletme?.magaza.terk.acik, profilAd: isletme?.profil.ad ?? "", googleProfil: isletme?.profil.googleProfil ?? "", whatsapp: isletme?.profil.whatsapp || isletme?.eklentiler.whatsapp.numara || "",
      sosyal: isletme?.profil.sosyal ?? {}, logo: isletme?.profil.logo ?? "", kvkk: isletme?.yasal.sayfalar.kvkk?.dosya ?? "",
      gizlilik: isletme?.yasal.sayfalar.gizlilik?.dosya ?? "", ulkeKodu: isletme?.profil.ulkeKodu ?? "", saatDilimi: isletme?.profil.saatDilimi || "UTC",
      postaAdresi: isletme && !isletme.profil.adresGizli ? [isletme.profil.resmi.unvan || isletme.profil.ad, isletme.profil.adres.sokak, [isletme.profil.adres.il, isletme.profil.adres.bolge, isletme.profil.adres.postaKodu].filter(Boolean).join(" "), isletme.profil.adres.ulke].filter(Boolean).join(", ") : "",
      randevuAcik: !!isletme?.randevu.hizmetler?.some((h) => h.aktif),
    },
    sosyalDurum: bagli, gbpDurum: { ...gbp, donus: donusAdresi(koken, "google") },
    iysDurum: (() => { const d = iysDurumu(); return { anahtar: d.anahtar, eksik: d.eksik, adres: d.adres }; })(),
    motorlar: motorDurumlari(), bioAdres: ek.bio ? `${koken}/l/${ek.bio.kod}` : null,
  };
}

/** POST: v5 işlemleri. null: bu işlem burada değil. */
export async function v5Islem(islem: string, g: Record<string, unknown>, c: { p: Proje; id: string; sahip: string; koken: string; ek: EkVeri; tamam: (x?: Record<string, unknown>) => Promise<Response>; hata: (m: string, d?: number) => Response }): Promise<Response | null> {
  const { p, id, koken, ek, tamam, hata } = c;
  const akis = () => ek.akislar.find((x) => x.id === g.akisId);
  switch (islem) {
    case "akis-baslat": {
      const a = akis(); if (!a) return hata("Akış bulunamadı.", 404);
      const sorun = akisSorunlari(a);
      if (sorun.length) return hata(sorun[0]);
      if (!epostaDurumu().kurulu) return hata("E-posta servisi kurulu değil; akış açılırsa hiçbir e-posta gönderilemez.", 424);
      if (!ek.marka?.iletisim?.trim()) return hata("Marka kitinde gönderen bilgisi (işletme adı ve iletişim) yok; ticari iletide zorunlu.");
      if (a.izin === "belirsiz-dahil" && g.izinBeyan !== true) return hata("İzni belirsiz kişileri katmak için ticari ileti onayı aldığını ya da alıcıların tacir veya esnaf olduğunu beyan etmelisin.");
      await ekGuncelle(id, (v) => { const x = v.akislar.find((y) => y.id === a.id); if (x) { x.durum = "acik"; x.acilis = Date.now(); x.izinBeyan = x.izin === "belirsiz-dahil" ? Date.now() : undefined; x.guncelleme = Date.now(); } });
      dizinEkle(id);
      await akisTohumla(id, { ...a, acilis: Date.now() });
      await akisTuru(id);
      return tamam();
    }
    case "akis-durdur": { await ekGuncelle(id, (v) => { const x = v.akislar.find((y) => y.id === g.akisId); if (x) { x.durum = "durdu"; x.guncelleme = Date.now(); } }); return tamam(); }
    case "akis-calistir": { dizinEkle(id); await akisTuru(id); return tamam(); }
    case "akis-deneme": {
      const a = akis(); if (!a) return hata("Akış bulunamadı.", 404);
      const kime = metin(g.kime, 200).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kime)) return hata("Deneme adresi geçersiz.");
      if (!epostaDurumu().kurulu) return hata("E-posta servisi kurulu değil; deneme gönderilemez.", 424);
      const r = await akisDenemesi(id, a, metin(g.adimId, 24), kime, koken);
      return r.ok ? tamam() : hata(r.hata, 502);
    }
    case "akis-cikar": { await akistanCikar(id, metin(g.akisId, 24), metin(g.kayitId, 40)); return tamam(); }
    case "akis-eposta-yaz": {
      const a = akis(); if (!a) return hata("Akış bulunamadı.", 404);
      const adim = butunAdimlar(a.adimlar).find((x) => x.id === g.adimId);
      if (!adim || adim.tur !== "eposta") return hata("E-posta adımı bulunamadı.", 404);
      const t = TETIKLER.find((x) => x.id === a.tetik)!;
      const r = await kampanyaYaz(p, ek, { amac: `${t.ad} otomasyonunun "${adim.ad}" e-postası. ${metin(g.amac, 300)}`.trim(), kitle: t.alt, ton: metin(g.ton, 60) || "samimi", adres: siteAdresi(p, koken) });
      const yeni = (l: Adim[]): Adim[] => l.map((x) => (x.id === adim.id && x.tur === "eposta" ? { ...x, konu: r.konu, onMetin: r.onMetin, bloklar: r.bloklar } : x.tur === "kosul" ? { ...x, evet: yeni(x.evet), hayir: yeni(x.hayir) } : x));
      await ekGuncelle(id, (v) => { const x = v.akislar.find((y) => y.id === a.id); if (x) { x.adimlar = yeni(x.adimlar); x.guncelleme = Date.now(); } });
      return tamam({ alternatifler: r.alternatifler, kredi: r.kredi });
    }
    case "bulten-olustur": {
      const b = await bultenKur(p, koken, { yazi: Math.round(sayi(g.yazi, 6)), urun: Math.round(sayi(g.urun, 6)), baslik: metin(g.baslik, 120), sonGun: sayi(g.sonGun, 365) || undefined });
      if (!b.yazi && !b.urun) return hata("Yayında blog yazısı ya da mağazada etkin ürün yok; bülteni kendin yaz ya da İşletme sekmesinden yazı ekle.");
      const { sonuc } = await ekGuncelle(id, (v) => { const k = { id: kimlikUret(), ad: `Bülten: ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`, konu: b.konu, onMetin: b.onMetin, bloklar: b.bloklar, suzgec: { kaynak: ["abone", "bio"] as ("abone" | "bio")[], izin: "tum" as const }, durum: "taslak" as const, baglantilar: [], alicilar: [], denemeler: [], olusturma: Date.now(), guncelleme: Date.now(), bulten: true }; v.kampanyalar.unshift(k); return k.id; });
      return tamam({ kampanyaId: sonuc, yazi: b.yazi, urun: b.urun });
    }
    case "bio-olustur": {
      if (ek.bio) return tamam();
      const isletme = await isletmeOku(id).catch(() => null);
      let kod = (p.ayarlar.altAlan || "bio").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 28) || "bio";
      if (!bioKodGecerli(kod)) kod = `bio-${id.slice(0, 6).toLowerCase()}`;
      for (let i = 2; bioBul(kod) && bioBul(kod) !== id; i++) kod = `${kod.replace(/-\d+$/, "")}-${i}`;
      if (!bioAyir(kod, id)) return hata("Adres ayrılamadı; yeniden dene.");
      const site = siteAdresi(p, koken);
      const pr = isletme?.profil;
      const yazilar = (await listeOku<Yazi>(id, "yazilar").catch(() => [] as Yazi[])).filter((y) => y.durum === "yayinda").slice(0, 2);
      const ogeler: BioOge[] = [
        { id: kimlikUret(), tur: "baglanti", ad: "Web sitemiz", alt: site.replace(/^https?:\/\//, "").replace(/\/$/, ""), adres: site, acik: true, vurgu: true },
        ...(isletme?.randevu.hizmetler?.some((h) => h.aktif) ? [{ id: kimlikUret(), tur: "randevu" as const, ad: "Randevu al", adres: site, acik: true }] : []),
        ...((pr?.whatsapp || isletme?.eklentiler.whatsapp.numara) ? [{ id: kimlikUret(), tur: "whatsapp" as const, ad: "WhatsApp ile yaz", numara: (pr?.whatsapp || isletme?.eklentiler.whatsapp.numara || "").replace(/\D/g, ""), mesaj: "Merhaba, bio sayfanızdan yazıyorum.", acik: true }] : []),
        ...yazilar.map((y) => ({ id: kimlikUret(), tur: "yazi" as const, ad: y.baslik, alt: "Blog", adres: `${site.replace(/\/$/, "")}/blog/${y.slug}.html`, gorsel: /^https:/.test(y.kapak) ? y.kapak : undefined, acik: true })),
        { id: kimlikUret(), tur: "abone", ad: "Bültene katıl", alt: "Yeniliklerden ilk sen haberdar ol.", acik: true },
      ];
      const sosyal = Object.fromEntries(Object.entries(pr?.sosyal ?? {}).filter(([k, u]) => u && BIO_SOSYAL.some((s) => s.id === k)));
      const b: BioSayfa = { kod, acik: true, baslik: pr?.ad || p.ad, aciklama: pr?.slogan || p.ayarlar.seo.aciklama?.slice(0, 160) || "", avatar: pr?.logo && /^(https:|\/api\/dosya\/gorsel\/)/.test(pr.logo) ? pr.logo : undefined, tema: { ...BIO_TEMALARI[0] }, ogeler, sosyal, seo: { baslik: "", aciklama: "", indeks: true }, rozet: true, ist: bosBioIst(), olusturma: Date.now(), guncelleme: Date.now() };
      await ekGuncelle(id, (v) => { v.bio = b; });
      return tamam();
    }
    case "gorunurluk-denetle": {
      const isletme = await isletmeOku(id).catch(() => null);
      const yazilar = await listeOku<Yazi>(id, "yazilar").catch(() => [] as Yazi[]);
      const s = gorunurlukDenetle({ p, profil: isletme?.profil, eklentiVeri: !!isletme?.eklentiler.yapisalVeri && !!isletme?.profil.ad, yazilar: yazilar.filter((y) => y.durum !== "taslak") });
      await ekGuncelle(id, (v) => { v.gorunurluk.son = s; const t = v.gorunurluk.testler; const an = t.length ? Math.round((t.filter((x) => x.anildi).length / t.filter((x) => !x.hata).length || 0) * 100) : undefined; v.gorunurluk.gecmis = [...v.gorunurluk.gecmis, { z: s.zaman, puan: s.puan, anilma: Number.isFinite(an) ? an : undefined }].slice(-30); });
      return tamam();
    }
    case "gorunurluk-llms": {
      const llms = await llmsUret(p, koken);
      if (g.onizle) return Response.json({ ok: true, llms });
      const r = await projeyeYaz(id, c.sahip, { "llms.txt": llms }, "llms.txt yazıldı (Büyüme, yapay zekâ görünürlüğü)");
      return tamam({ surumNo: r.surumNo, llms });
    }
    case "anilma-soru": {
      if (g.ai) { const r = await soruOnerAi(p, ek); return Response.json({ ok: true, sorular: r.sorular, kredi: r.kredi }); }
      return Response.json({ ok: true, sorular: await soruOner(p) });
    }
    case "anilma-test": {
      const sorular = (Array.isArray(g.sorular) ? g.sorular : ek.gorunurluk.sorular).map((s) => metin(s, 200).trim()).filter(Boolean).slice(0, 8);
      if (!sorular.length) return hata("Önce en az bir soru yaz.");
      const motorlar = (Array.isArray(g.motorlar) ? g.motorlar : MOTORLAR.map((m) => m.id)).filter((m): m is AnilmaMotor => MOTORLAR.some((x) => x.id === m));
      const isletme = await isletmeOku(id).catch(() => null);
      let l;
      try { l = await anilmaTesti(p, koken, sorular, motorlar, isletme?.profil.ad || p.ad); } catch (e) { return hata((e as Error).message, 424); }
      await ekGuncelle(id, (v) => { v.gorunurluk.sorular = sorular; v.gorunurluk.testler = [...l, ...v.gorunurluk.testler].slice(0, 120); });
      return tamam({ adet: l.length });
    }
    case "gbp-taslak": {
      const tur = (["STANDARD", "OFFER", "EVENT"].includes(String(g.tur)) ? g.tur : "STANDARD") as GbpTur;
      const r = g.kaynak === "ai" ? await gbpTaslakYaz(p, ek, { konu: metin(g.konu, 300), tur, koken }) : { gonderiler: await gbpKaynakTaslaklari(p, koken), kredi: 0 };
      if (!r.gonderiler.length) return hata(g.kaynak === "ai" ? "Taslak yazılamadı; yeniden dene." : "Projede taslağa dönüştürülecek ürün, yazı ya da kupon yok. Yapay zekâyla yaz ya da boş taslak aç.");
      await ekGuncelle(id, (v) => { v.gbp.gonderiler = [...r.gonderiler, ...v.gbp.gonderiler].slice(0, 60); });
      return tamam({ adet: r.gonderiler.length, kredi: r.kredi });
    }
    case "gbp-konumlar": { try { return Response.json({ ok: true, konumlar: await gbpKonumlari(id) }); } catch (e) { return hata((e as Error).message, 502); } }
    case "gbp-yayinla": { try { await gbpYayinla(id, metin(g.gonderiId, 24)); return tamam(); } catch (e) { return hata((e as Error).message, 502); } }
    case "gbp-zamanla": {
      const z = Number(g.zaman);
      if (!Number.isFinite(z) || z < Date.now() + 60_000 || z > Date.now() + 90 * 864e5) return hata("Zaman en az 1 dakika, en çok 90 gün sonrası olmalı.");
      if (!ek.gbp.konum) return hata("Önce işletmeyi seç.");
      await ekGuncelle(id, (v) => { const x = v.gbp.gonderiler.find((y) => y.id === g.gonderiId); if (x && x.durum !== "yayinda") { x.durum = g.iptal ? "taslak" : "zamanlandi"; x.zaman = g.iptal ? undefined : z; } });
      return tamam();
    }
    case "sosyal-bagla": {
      const ag = String(g.ag) as OauthAg;
      if (!(ag in SAGLAYICILAR)) return hata("Bilinmeyen ağ.");
      try { return Response.json({ ok: true, adres: yetkiAdresi(id, ag, koken) }); } catch (e) { return hata((e as Error).message, 424); }
    }
    case "sosyal-kes": { const ag = String(g.ag) as OauthAg; if (!(ag in SAGLAYICILAR)) return hata("Bilinmeyen ağ."); await baglantiyiKes(id, ag); return tamam(); }
    case "sosyal-paylas": { const r = await gonderiPaylas(id, metin(g.gonderiId, 24)); return r.ok ? tamam({ adres: r.adres, not: r.hata }) : hata(r.hata ?? "Paylaşılamadı.", 502); }
    case "kisi-unut": {
      // Unutulma hakkı (GDPR madde 17, CCPA silme, KVKK madde 7): kişinin pazarlama verisi silinir, yalnız e-postanın özeti kalır.
      const e = metin(g.eposta, 120).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return hata("Geçerli bir e-posta adresi yaz.");
      const { epostaOzeti } = await import("./buyumeEposta");
      const oz = epostaOzeti(e);
      let abone = 0;
      await listeDegistir<Abone>(id, "aboneler", (l) => { const once = l.length; for (let i = l.length - 1; i >= 0; i--) if (l[i].eposta === e) l.splice(i, 1); abone = once - l.length; }, 20000);
      let kampanya = 0;
      await ekGuncelle(id, (v) => {
        v.silinenler = { ...(v.silinenler ?? {}), [oz]: Date.now() };
        for (const [a, m] of Object.entries(v.kisiMeta)) if (a === e || a.endsWith(`:${e}`) || (m as { eposta?: string }).eposta === e) delete v.kisiMeta[a];
        delete v.cikanlar[e];
        for (const k of v.kampanyalar) { const once = k.alicilar.length; k.alicilar = k.alicilar.filter((x) => x.e !== e); kampanya += once - k.alicilar.length; }
      });
      await kisiAkislariniSil(id, e).catch(() => {});
      return tamam({ abone, kampanya, ozet: oz });
    }
    case "iys-aktar": {
      if (!iysDurumu().anahtar) return hata(`İYS API bilgileri tanımlı değil: ${iysDurumu().eksik.join(", ")}. Dosyayı indirip İYS'ye elle yükleyebilirsin.`, 424);
      const kisiler = await kisileriKur(id, ek);
      const { satirlar } = iysSatirlari(kisiler, ek.iys);
      const gonderilen = ek.iys.sonGonderilen ?? {};
      const yeni = g.hepsi ? satirlar : satirlar.filter((s) => gonderilen[`${s.recipient}:${s.status}`] !== Date.parse(s.consentDate.replace(" ", "T") + "+03:00"));
      try {
        const r = await iysGonder(yeni);
        await ekGuncelle(id, (v) => { v.iys.aktarimlar = [{ z: Date.now(), adet: r.adet, durum: "gonderildi" as const, istek: r.istekler.join(", ") || undefined, yanit: r.yanit }, ...v.iys.aktarimlar].slice(0, 30); const m = (v.iys.sonGonderilen ??= {}); for (const s of yeni) m[`${s.recipient}:${s.status}`] = Date.parse(s.consentDate.replace(" ", "T") + "+03:00"); });
        return tamam({ adet: r.adet });
      } catch (e) {
        await ekGuncelle(id, (v) => { v.iys.aktarimlar = [{ z: Date.now(), adet: yeni.length, durum: "hata" as const, hata: (e as Error).message.slice(0, 300) }, ...v.iys.aktarimlar].slice(0, 30); });
        return hata((e as Error).message, 424);
      }
    }
    case "iys-dosya": { await ekGuncelle(id, (v) => { v.iys.aktarimlar = [{ z: Date.now(), adet: Math.round(sayi(g.adet, 1e6)), durum: "dosya" as const }, ...v.iys.aktarimlar].slice(0, 30); }); return tamam(); }
    case "iys-sorgula": { try { return Response.json({ ok: true, yanit: await iysIstekDurumu(metin(g.istek, 80)) }); } catch (e) { return hata((e as Error).message, 502); } }
    case "ab-kazanan": { const m = await abKazananSec(id, metin(g.kampanyaId, 24), typeof g.kazanan === "number" ? g.kazanan : undefined); return m ? hata(m) : tamam(); }
    case "tur-calistir": { await buyumeTuruCalistir(); return tamam(); }
    case "saat-profili": { return Response.json({ ok: true, profil: saatProfili(ek, await akisOku(id), (await isletmeOku(id).catch(() => null))?.profil.saatDilimi || "UTC") }); }
    default: return null;
  }
}
