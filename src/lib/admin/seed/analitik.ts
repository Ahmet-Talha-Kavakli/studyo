/**
 * Analitik verileri — cohort retention, LTV/CAC, churn, kullanım dağılımı,
 * attribution/UTM, Flow topluluk analitiği, GEO/SEO, marka bilinirliği.
 *
 * GERÇEK hesap: cohort/churn/kullanım/LTV metrikleri kullanicilar.kayitTarih +
 * oturumlar.baslangic üzerinden .filter/.reduce ile türetilir. Sabit PRNG katsayı YOK.
 * Deterministik → cache deseni (SSR-safe).
 */
import { prng, tohumla, tamsayi, normal, sec, BUGUN, GUN } from "../cekirdek";
import { KAYNAKLAR, ULKELER, PLANLAR, type PlanId } from "../tablolar";
import { veri } from "./index";
import type { AdminOzet } from "./index";

/* ── Cohort retention matrisi (kayıt haftası × D1/D7/D30/D90) ── */
export interface CohortSatir {
  cohort: string;
  boyut: number;
  d1: number; d7: number; d30: number; d90: number;
  gelir: number; // kohortun toplam ödediği ₺
}

let _cohort: CohortSatir[] | null = null;
export function cohortRetention(): CohortSatir[] {
  if (_cohort) return _cohort;
  const { kullanicilar, oturumlar } = veri();

  // kullaniciId → o kullanıcının oturum başlangıç zaman damgaları
  const oturumMap = new Map<string, number[]>();
  for (const o of oturumlar) {
    if (!o.kullaniciId) continue;
    (oturumMap.get(o.kullaniciId) ?? oturumMap.set(o.kullaniciId, []).get(o.kullaniciId)!).push(o.baslangic);
  }

  // Son 8 hafta kohortları: haftaIndex 0 = en eski (8 hafta önce) … 7 = geçen hafta
  const HAFTA = 7 * GUN;
  const kova: {
    label: string; baslangic: number; bitis: number;
    boyut: number; d1: number; d7: number; d30: number; d90: number; gelir: number;
  }[] = [];
  for (let w = 8; w >= 1; w--) {
    kova.push({
      label: w === 1 ? "Geçen hafta" : `${w} hafta önce`,
      baslangic: BUGUN - w * HAFTA,
      bitis: BUGUN - (w - 1) * HAFTA,
      boyut: 0, d1: 0, d7: 0, d30: 0, d90: 0, gelir: 0,
    });
  }

  for (const k of kullanicilar) {
    const kv = kova.find((c) => k.kayitTarih >= c.baslangic && k.kayitTarih < c.bitis);
    if (!kv) continue;
    kv.boyut++;
    kv.gelir += k.toplamOdenen;

    // Geri dönüş: kayıt sonrası ilgili pencerede bir oturum başlangıcı var mı?
    // Oturum yoksa (örneklenmemiş kullanıcı) sonAktif'i tekil dönüş sinyali say.
    const ziyaretler = oturumMap.get(k.id) ?? (k.sonAktif > k.kayitTarih ? [k.sonAktif] : []);
    const geldi = (gunPencere: number) => {
      const esik = k.kayitTarih + gunPencere * GUN;
      return ziyaretler.some((t) => t > k.kayitTarih && t <= esik + GUN);
    };
    // D_n = kayıttan n gün sonrasına kadar en az bir dönüş
    if (geldi(1)) kv.d1++;
    if (geldi(7)) kv.d7++;
    if (geldi(30)) kv.d30++;
    if (geldi(90)) kv.d90++;
  }

  _cohort = kova.map((c) => ({
    cohort: c.label,
    boyut: c.boyut,
    d1: c.boyut ? Math.round((c.d1 / c.boyut) * 100) : 0,
    d7: c.boyut ? Math.round((c.d7 / c.boyut) * 100) : 0,
    d30: c.boyut ? Math.round((c.d30 / c.boyut) * 100) : 0,
    d90: c.boyut ? Math.round((c.d90 / c.boyut) * 100) : 0,
    gelir: c.gelir,
  }));
  return _cohort;
}

/* ── LTV/CAC kanal bazlı — kayıt/gelir GERÇEK kaynaktan ── */
export interface KanalMetrik {
  kanal: string;
  kanalId: string;
  kayit: number;
  cac: number;
  ltv: number;
  ltvCac: number;
  payback: number; // ay
  gelir: number;
}

let _kanal: KanalMetrik[] | null = null;
export function kanalMetrikleri(_o: AdminOzet): KanalMetrik[] {
  if (_kanal) return _kanal;
  const { kullanicilar } = veri();

  // Kaynak bazlı gerçek kayıt sayısı + toplam ödenen (LTV proxy'si)
  const grup = new Map<string, { kayit: number; gelir: number; odeyen: number }>();
  for (const s of KAYNAKLAR) grup.set(s.id, { kayit: 0, gelir: 0, odeyen: 0 });
  for (const k of kullanicilar) {
    const g = grup.get(k.kaynak);
    if (!g) continue;
    g.kayit++;
    g.gelir += k.toplamOdenen;
    if (k.toplamOdenen > 0) g.odeyen++;
  }

  // CAC: paid kanallarda tıklama başı maliyet varsayımı (deterministik, kanala sabit).
  const cacTabani: Record<string, number> = { organic: 40, referral: 90, affiliate: 140, sosyal: 180, paid: 320 };

  _kanal = KAYNAKLAR.map((s) => {
    const g = grup.get(s.id)!;
    // LTV = ödeyen başına ortalama gelir × 2,4 (yaşam boyu katsayısı)
    const ltv = g.odeyen ? Math.round((g.gelir / g.odeyen) * 2.4) : 0;
    const cac = cacTabani[s.kanal] ?? 200;
    const ltvCac = cac ? +(ltv / cac).toFixed(1) : 0;
    return {
      kanal: s.ad, kanalId: s.id, kayit: g.kayit, cac, ltv, ltvCac,
      payback: ltv ? +(cac / (ltv / 24)).toFixed(1) : 0,
      gelir: g.gelir,
    };
  }).sort((a, b) => b.ltvCac - a.ltvCac);
  return _kanal;
}

/* ── Tier (plan) bazlı LTV ── */
export interface TierLtv { plan: string; abone: number; ortOdenen: number; ltv: number; toplamGelir: number }
let _tier: TierLtv[] | null = null;
export function tierLtv(): TierLtv[] {
  if (_tier) return _tier;
  const { kullanicilar } = veri();
  _tier = PLANLAR.map((p) => {
    const uyeler = kullanicilar.filter((k) => k.plan === p.id && k.toplamOdenen > 0);
    const toplamGelir = uyeler.reduce((a, k) => a + k.toplamOdenen, 0);
    const ortOdenen = uyeler.length ? Math.round(toplamGelir / uyeler.length) : 0;
    return { plan: p.ad, abone: uyeler.length, ortOdenen, ltv: Math.round(ortOdenen * 2.4), toplamGelir };
  }).sort((a, b) => b.ltv - a.ltv);
  return _tier;
}

/* ── Churn analizi — GERÇEK pasif/askıda aboneler ── */
export interface ChurnSebep { sebep: string; sayi: number; oran: number }

let _churn: { aylikOran: number; sebepler: ChurnSebep[]; riskliSayi: number; churnAbone: number; winbackOran: number } | null = null;
export function churnAnaliz(): { aylikOran: number; sebepler: ChurnSebep[]; riskliSayi: number; churnAbone: number; winbackOran: number } {
  if (_churn) return _churn;
  const { kullanicilar } = veri();

  // Abone tabanı = ücretli plan (baslangic hariç)
  const aboneler = kullanicilar.filter((k) => k.plan !== "baslangic");
  const aktifAbone = aboneler.filter((k) => k.durum === "aktif").length;
  // Churn eden abone: ücretli ama artık aktif değil (pasif/askida/silinme)
  const churnAbone = aboneler.filter((k) => k.durum === "pasif" || k.durum === "askida" || k.durum === "silinme_talebi").length;
  const banli = aboneler.filter((k) => k.durum === "banli").length;
  const taban = aktifAbone + churnAbone + banli;
  // Aylık churn oranı ≈ churn eden / toplam abone (yaklaşık 18 aylık pencere → aya böl)
  const aylikOran = taban ? +((churnAbone / taban) * 100 / 12).toFixed(1) : 0;

  // Risk altındaki: aktif abone ama son 21 günden fazla dönmemiş (kullanım düşüşü)
  const riskEsik = BUGUN - 21 * GUN;
  const riskliSayi = aboneler.filter((k) => k.durum === "aktif" && k.sonAktif < riskEsik).length;

  // İptal sebepleri: churn eden abone sayısına deterministik ağırlıklı dağılım
  const sebepAgirlik: [string, number][] = [
    ["Çok pahalı", 26], ["Yeterince kullanmadım", 24], ["Kalite yetersiz", 16],
    ["Rakibe geçtim", 14], ["Geçici ara", 12], ["Diğer", 8],
  ];
  const agirlikToplam = sebepAgirlik.reduce((a, s) => a + s[1], 0);
  const sebepler = sebepAgirlik.map(([sebep, ag]) => {
    const sayi = Math.round((churnAbone * ag) / agirlikToplam);
    return { sebep, sayi, oran: (ag / agirlikToplam) * 100 };
  }).sort((a, b) => b.sayi - a.sayi);

  // Win-back: pasif olup sonradan geri gelmiş görünüm → pasif ama sonAktif kayıttan çok sonra
  const pasifAbone = aboneler.filter((k) => k.durum === "pasif");
  const geriKazanilan = pasifAbone.filter((k) => k.sonAktif - k.kayitTarih > 60 * GUN).length;
  const winbackOran = pasifAbone.length ? Math.round((geriKazanilan / pasifAbone.length) * 100) : 0;

  _churn = { aylikOran, sebepler, riskliSayi, churnAbone, winbackOran };
  return _churn;
}

/* ── Churn risk listesi (isimli abone tablosu — proaktif kampanya için) ── */
export interface ChurnRisk {
  id: string;
  ad: string;
  plan: string;
  sonAktif: number;
  risk: number; // 0-100
  sebep: string;
}
let _riskListe: ChurnRisk[] | null = null;
export function churnRiskListesi(): ChurnRisk[] {
  if (_riskListe) return _riskListe;
  const { kullanicilar, oturumlar } = veri();

  // kullaniciId → en son oturum başlangıcı (aktivite düşüşü sinyali)
  const sonOturum = new Map<string, number>();
  const oturumSay = new Map<string, number>();
  for (const o of oturumlar) {
    if (!o.kullaniciId) continue;
    const mevcut = sonOturum.get(o.kullaniciId) ?? 0;
    if (o.baslangic > mevcut) sonOturum.set(o.kullaniciId, o.baslangic);
    oturumSay.set(o.kullaniciId, (oturumSay.get(o.kullaniciId) ?? 0) + 1);
  }

  const planAd = new Map(PLANLAR.map((p) => [p.id, p.ad]));
  const list: ChurnRisk[] = [];
  for (const k of kullanicilar) {
    if (k.plan === "baslangic" || k.durum === "banli") continue;
    const son = sonOturum.get(k.id) ?? k.sonAktif;
    const gunUzak = Math.floor((BUGUN - son) / GUN);
    let risk = 0;
    const sebepler: string[] = [];
    // Zaten churn etmiş
    if (k.durum === "askida") { risk += 45; sebepler.push("Aboneliği askıda"); }
    else if (k.durum === "pasif") { risk += 40; sebepler.push("Pasif hesap"); }
    else if (k.durum === "silinme_talebi") { risk += 60; sebepler.push("Silme talebi"); }
    // Aktivite düşüşü
    if (gunUzak >= 30) { risk += 30; sebepler.push(`${gunUzak}g giriş yok`); }
    else if (gunUzak >= 14) { risk += 18; sebepler.push(`${gunUzak}g pasif`); }
    // Yenileme yaklaşıyor: kayıttan bu yana ~30 günün katına yakın (fatura döngüsü)
    const gunYas = (BUGUN - k.kayitTarih) / GUN;
    const doneme = gunYas % 30;
    if (doneme > 26 || doneme < 3) { risk += 15; sebepler.push("Yenileme yaklaşıyor"); }
    // Kredi bitmiş + düşük kullanım
    if (k.krediBakiye < 20 && (oturumSay.get(k.id) ?? 0) < 3) { risk += 10; sebepler.push("Kredi bitti, az kullanım"); }

    if (risk >= 40) {
      list.push({
        id: k.id, ad: k.ad, plan: planAd.get(k.plan as PlanId) ?? k.plan,
        sonAktif: son, risk: Math.min(100, risk),
        sebep: sebepler.slice(0, 2).join(" · ") || "Risk sinyali",
      });
    }
  }
  _riskListe = list.sort((a, b) => b.risk - a.risk).slice(0, 40);
  return _riskListe;
}

/* ── Kullanım dağılımı histogramı — kullanıcı başına job sayısı bucket'ları ── */
let _hist: { etiket: string; deger: number }[] | null = null;
export function kullanimHistogram(): { etiket: string; deger: number }[] {
  if (_hist) return _hist;
  const { kullanicilar } = veri();
  const kovalar = [
    { etiket: "0", test: (n: number) => n <= 0, deger: 0 },
    { etiket: "1-5", test: (n: number) => n >= 1 && n <= 5, deger: 0 },
    { etiket: "6-20", test: (n: number) => n >= 6 && n <= 20, deger: 0 },
    { etiket: "21-50", test: (n: number) => n >= 21 && n <= 50, deger: 0 },
    { etiket: "51-150", test: (n: number) => n >= 51 && n <= 150, deger: 0 },
    { etiket: "150+", test: (n: number) => n > 150, deger: 0 },
  ];
  for (const k of kullanicilar) {
    const j = Math.max(0, k.jobSayisi);
    const kv = kovalar.find((c) => c.test(j));
    if (kv) kv.deger++;
  }
  _hist = kovalar.map((c) => ({ etiket: c.etiket, deger: c.deger }));
  return _hist;
}

/* ── Kullanım özet metrikleri (time-to-value dahil) ── */
export interface KullanimOzet {
  ortJob: number;
  medyanJob: number;
  ttvSaat: number; // ort. ilk üretime süre (saat)
  ilkDenemeBasari: number; // %
  aktifOran: number; // job>0 kullanıcı oranı %
}
let _kullanimOzet: KullanimOzet | null = null;
export function kullanimOzet(): KullanimOzet {
  if (_kullanimOzet) return _kullanimOzet;
  const { kullanicilar, oturumlar } = veri();
  const joblar = kullanicilar.map((k) => Math.max(0, k.jobSayisi)).sort((a, b) => a - b);
  const toplamJob = joblar.reduce((a, n) => a + n, 0);
  const ortJob = kullanicilar.length ? Math.round(toplamJob / kullanicilar.length) : 0;
  const medyanJob = joblar.length ? joblar[Math.floor(joblar.length / 2)] : 0;
  const uretenler = kullanicilar.filter((k) => k.jobSayisi > 0).length;
  const aktifOran = kullanicilar.length ? +((uretenler / kullanicilar.length) * 100).toFixed(1) : 0;

  // Time-to-value: kayıtlı oturumlarda kayıt→ilk üretim event zamanı ortalaması
  let ttvToplamMs = 0, ttvN = 0;
  const kmap = new Map(kullanicilar.map((k) => [k.id, k]));
  for (const o of oturumlar) {
    if (!o.kullaniciId) continue;
    const uretim = o.olaylar.find((e) => e.tur === "uretim");
    const k = kmap.get(o.kullaniciId);
    if (uretim && k) {
      const d = uretim.ms - k.kayitTarih;
      if (d > 0 && d < 30 * GUN) { ttvToplamMs += d; ttvN++; }
    }
  }
  const ttvSaat = ttvN ? +((ttvToplamMs / ttvN) / 3600000).toFixed(1) : 0;

  // İlk deneme başarısı: aktif+dogrulanmis oranı proxy (deterministik)
  const dogrulanan = kullanicilar.filter((k) => k.dogrulanmis).length;
  const ilkDenemeBasari = kullanicilar.length ? +((dogrulanan / kullanicilar.length) * 100).toFixed(0) : 0;

  _kullanimOzet = { ortJob, medyanJob, ttvSaat, ilkDenemeBasari, aktifOran };
  return _kullanimOzet;
}

/* ── Attribution / UTM — gerçek kayıt/gelir + reklam harcaması varsayımı ── */
export interface AttrSatir {
  kaynak: string;
  ortam: string;
  kayit: number;
  ilkUretim: number;
  ilkOdeme: number;
  gelir: number;
  reklamHarcama: number;
  roas: number;
}

let _attr: AttrSatir[] | null = null;
export function attributionRapor(): AttrSatir[] {
  if (_attr) return _attr;
  const { kullanicilar } = veri();
  // Reklam harcaması (paid kanal başına aylık bütçe varsayımı ₺)
  const reklamBut: Record<string, number> = { meta: 42000, tiktok: 28000, google: 35000, instagram: 8000, youtube: 12000 };

  const grup = new Map<string, { kayit: number; gelir: number; odeyen: number; ureten: number }>();
  for (const s of KAYNAKLAR) grup.set(s.id, { kayit: 0, gelir: 0, odeyen: 0, ureten: 0 });
  for (const k of kullanicilar) {
    const g = grup.get(k.kaynak);
    if (!g) continue;
    g.kayit++;
    g.gelir += k.toplamOdenen;
    if (k.toplamOdenen > 0) g.odeyen++;
    if (k.jobSayisi > 0) g.ureten++;
  }

  _attr = KAYNAKLAR.map((s) => {
    const g = grup.get(s.id)!;
    const reklam = reklamBut[s.id] ?? 0;
    return {
      kaynak: s.ad, ortam: s.kanal, kayit: g.kayit,
      ilkUretim: g.ureten, ilkOdeme: g.odeyen, gelir: g.gelir,
      reklamHarcama: reklam, roas: reklam ? +(g.gelir / reklam).toFixed(1) : 0,
    };
  }).sort((a, b) => b.gelir - a.gelir);
  return _attr;
}

/* ── Flow topluluk analitiği ── */
export interface FlowAnalitik {
  toplamGonderi: number;
  aktifPaylasan: number;
  toplamBegeni: number;
  toplamYorum: number;
  toplamPaylasim: number;
  ortEtkilesim: number; // %
  viralIcerik: number;
  gunlukAktif: number;
  enPopulerGonderiler: { baslik: string; begeni: number; yorum: number; kullanici: string }[];
}

let _flow: FlowAnalitik | null = null;
export function flowAnalitik(): FlowAnalitik {
  if (_flow) return _flow;
  const { kullanicilar, joblar } = veri();
  // Gönderi ≈ tamamlanan job'ların bir kısmı topluluğa paylaşılır (~%18)
  const tamamJob = joblar.filter((j) => j.durum === "tamam").length;
  const toplamGonderi = Math.round(tamamJob * 0.18);
  const aktifKul = kullanicilar.filter((k) => k.durum === "aktif");
  // Paylaşan: aktif kullanıcının bir kısmı (job'u olanlar)
  const aktifPaylasan = aktifKul.filter((k) => k.jobSayisi > 3).length;
  // Etkileşim: gönderi başına ort. beğeni türetimi (deterministik dağılım)
  const rBase = prng(tohumla("flow-etk"));
  const ortBegeniPerGonderi = 14 + Math.round(normal(rBase) * 6);
  const toplamBegeni = toplamGonderi * ortBegeniPerGonderi;
  const toplamYorum = Math.round(toplamBegeni * 0.14);
  const toplamPaylasim = Math.round(toplamBegeni * 0.063);
  const ortEtkilesim = aktifPaylasan ? +((toplamBegeni / Math.max(1, toplamGonderi)) / 100 * 8.4).toFixed(1) : 0;

  const basliklar = ["Sinematik gün batımı reel'i", "AI moda editoryal", "3D karakter turu", "Neon şehir animasyonu", "Ürün tanıtım videosu", "Portre serisi"];
  // Popüler gönderi yazarları: gerçek yüksek-kullanım kullanıcılardan
  const enCok = [...aktifKul].sort((a, b) => b.jobSayisi - a.jobSayisi).slice(0, 6);
  const enPopulerGonderiler = basliklar.map((baslik, i) => {
    const rr = prng(tohumla(`flowpop-${i}`));
    const k = enCok[i];
    return {
      baslik,
      begeni: tamsayi(rr, 8000, 45000),
      yorum: tamsayi(rr, 400, 3200),
      kullanici: k ? k.ad : sec(rr, ["Selin A.", "Emre K.", "Deniz Y."]),
    };
  }).sort((a, b) => b.begeni - a.begeni);

  _flow = {
    toplamGonderi, aktifPaylasan, toplamBegeni, toplamYorum, toplamPaylasim,
    ortEtkilesim,
    viralIcerik: Math.round(toplamGonderi * 0.006),
    gunlukAktif: Math.round(aktifKul.length * 0.24),
    enPopulerGonderiler,
  };
  return _flow;
}

/* ── GEO / SEO ── */
export interface SeoMetrik {
  anahtarKelime: string;
  siralama: number;
  hacim: number;
  tiklama: number;
  degisim: number;
}

let _seo: { organikTrafik: number; toplamAnahtar: number; ort: number; backlink: number; kelimeler: SeoMetrik[]; ulkeTrafik: { ulke: string; oturum: number; oran: number }[] } | null = null;
export function seoAnalitik(): { organikTrafik: number; toplamAnahtar: number; ort: number; backlink: number; kelimeler: SeoMetrik[]; ulkeTrafik: { ulke: string; oturum: number; oran: number }[] } {
  if (_seo) return _seo;
  const { oturumlar } = veri();

  // Organik trafik: kaynak==="organik" oturum sayısı
  const organikOturum = oturumlar.filter((o) => o.kaynak === "organik").length;

  const kelimeler = [
    "ai video üretici", "yapay zeka görsel", "3d model oluşturma", "ai seslendirme",
    "video jeneratörü", "metin to video", "ai reklam üretici", "sinematik ai",
  ].map((anahtarKelime, i) => {
    const r = prng(tohumla(`seo-${i}`));
    return { anahtarKelime, siralama: tamsayi(r, 1, 25), hacim: tamsayi(r, 1000, 40000), tiklama: tamsayi(r, 200, 8000), degisim: tamsayi(r, -5, 12) };
  }).sort((a, b) => a.siralama - b.siralama);
  const ortSira = kelimeler.length ? +(kelimeler.reduce((a, k) => a + k.siralama, 0) / kelimeler.length).toFixed(1) : 0;

  // Ülke bazlı organik trafik: gerçek oturumların ülke dağılımı (organik kaynak)
  const ulkeSay = new Map<string, number>();
  for (const o of oturumlar) {
    if (o.kaynak !== "organik") continue;
    ulkeSay.set(o.ulkeKod, (ulkeSay.get(o.ulkeKod) ?? 0) + 1);
  }
  const toplamOrg = organikOturum || 1;
  const ulkeTrafik = ULKELER.slice(0, 8).map((u) => {
    const say = ulkeSay.get(u.kod) ?? 0;
    return { ulke: u.ad, oturum: say, oran: +((say / toplamOrg) * 100).toFixed(1) };
  }).sort((a, b) => b.oturum - a.oturum);

  _seo = { organikTrafik: organikOturum, toplamAnahtar: 1240, ort: ortSira, backlink: 3400, kelimeler, ulkeTrafik };
  return _seo;
}

/* ── Marka bilinirliği ── */
let _marka: { mention: number; sentiment: number; sov: number; kanalDagilim: { etiket: string; deger: number; renk: string }[]; trend: number[] } | null = null;
export function markaBilinirlik(): { mention: number; sentiment: number; sov: number; kanalDagilim: { etiket: string; deger: number; renk: string }[]; trend: number[] } {
  if (_marka) return _marka;
  const { oturumlar } = veri();
  // Mention proxy: sosyal kaynaklı oturum sayısı × faktör
  const sosyal = oturumlar.filter((o) => ["instagram", "youtube", "tiktok", "meta"].includes(o.kaynak)).length;
  const mention = Math.round(sosyal * 2.2);

  _marka = {
    mention,
    sentiment: 72,
    sov: 18.4,
    kanalDagilim: [
      { etiket: "Twitter/X", deger: Math.round(mention * 0.34), renk: "#55d6fd" },
      { etiket: "Instagram", deger: Math.round(mention * 0.31), renk: "#f472b6" },
      { etiket: "TikTok", deger: Math.round(mention * 0.23), renk: "#a78bfa" },
      { etiket: "YouTube", deger: Math.round(mention * 0.12), renk: "#34d399" },
    ],
    trend: Array.from({ length: 30 }, (_, i) => {
      const r = prng(tohumla(`marka-${i}`));
      return Math.round(300 + i * 8 + normal(r) * 120);
    }),
  };
  return _marka;
}

/* ── SQL Editörü hazır sorguları — gerçek sonuç (kullanicilar dizisinden) ── */
export interface SqlKolon { anahtar: string; ad: string; hiza?: "sol" | "sag"; bicim?: "para" | "sayi" | "metin" }
export interface HazirSorgu {
  id: string;
  ad: string;
  sql: string;
  kolonlar: SqlKolon[];
  calistir: () => Record<string, string | number>[];
}

export function hazirSorgular(): HazirSorgu[] {
  return [
    {
      id: "topharcayan",
      ad: "En çok harcayan 20 kullanıcı",
      sql: "SELECT ad, plan, toplam_odenen\nFROM kullanicilar\nORDER BY toplam_odenen DESC\nLIMIT 20;",
      kolonlar: [
        { anahtar: "ad", ad: "Kullanıcı", hiza: "sol" },
        { anahtar: "plan", ad: "Plan", hiza: "sol" },
        { anahtar: "toplamOdenen", ad: "Toplam Ödenen", hiza: "sag", bicim: "para" },
      ],
      calistir: () => {
        const { kullanicilar } = veri();
        const planAd = new Map(PLANLAR.map((p) => [p.id, p.ad]));
        return [...kullanicilar]
          .sort((a, b) => b.toplamOdenen - a.toplamOdenen)
          .slice(0, 20)
          .map((k) => ({ ad: k.ad, plan: planAd.get(k.plan as PlanId) ?? k.plan, toplamOdenen: k.toplamOdenen }));
      },
    },
    {
      id: "ulkedagilim",
      ad: "Ülke dağılımı (kullanıcı + gelir)",
      sql: "SELECT ulke, COUNT(*) AS kullanici, SUM(toplam_odenen) AS gelir\nFROM kullanicilar\nGROUP BY ulke\nORDER BY kullanici DESC;",
      kolonlar: [
        { anahtar: "ulke", ad: "Ülke", hiza: "sol" },
        { anahtar: "kullanici", ad: "Kullanıcı", hiza: "sag", bicim: "sayi" },
        { anahtar: "gelir", ad: "Gelir", hiza: "sag", bicim: "para" },
      ],
      calistir: () => {
        const { kullanicilar } = veri();
        const m = new Map<string, { kullanici: number; gelir: number }>();
        for (const k of kullanicilar) {
          const v = m.get(k.ulke) ?? { kullanici: 0, gelir: 0 };
          v.kullanici++; v.gelir += k.toplamOdenen;
          m.set(k.ulke, v);
        }
        return [...m.entries()]
          .map(([ulke, v]) => ({ ulke, kullanici: v.kullanici, gelir: v.gelir }))
          .sort((a, b) => b.kullanici - a.kullanici);
      },
    },
    {
      id: "plandagilim",
      ad: "Plan dağılımı (abone + MRR)",
      sql: "SELECT plan, COUNT(*) AS abone, SUM(ay_ciro) AS mrr\nFROM kullanicilar\nWHERE durum = 'aktif'\nGROUP BY plan;",
      kolonlar: [
        { anahtar: "plan", ad: "Plan", hiza: "sol" },
        { anahtar: "abone", ad: "Aktif Abone", hiza: "sag", bicim: "sayi" },
        { anahtar: "mrr", ad: "MRR", hiza: "sag", bicim: "para" },
      ],
      calistir: () => {
        const { kullanicilar } = veri();
        const planAd = new Map(PLANLAR.map((p) => [p.id, p.ad]));
        return PLANLAR.map((p) => {
          const uyeler = kullanicilar.filter((k) => k.plan === p.id && k.durum === "aktif");
          return {
            plan: planAd.get(p.id) ?? p.id,
            abone: uyeler.length,
            mrr: uyeler.reduce((a, k) => a + k.ayCiro, 0),
          };
        }).sort((a, b) => b.mrr - a.mrr);
      },
    },
    {
      id: "durumdagilim",
      ad: "Hesap durumu dağılımı",
      sql: "SELECT durum, COUNT(*) AS adet\nFROM kullanicilar\nGROUP BY durum\nORDER BY adet DESC;",
      kolonlar: [
        { anahtar: "durum", ad: "Durum", hiza: "sol" },
        { anahtar: "adet", ad: "Adet", hiza: "sag", bicim: "sayi" },
      ],
      calistir: () => {
        const { kullanicilar } = veri();
        const etiket: Record<string, string> = { aktif: "Aktif", pasif: "Pasif", askida: "Askıda", banli: "Banlı", silinme_talebi: "Silme talebi" };
        const m = new Map<string, number>();
        for (const k of kullanicilar) m.set(k.durum, (m.get(k.durum) ?? 0) + 1);
        return [...m.entries()]
          .map(([durum, adet]) => ({ durum: etiket[durum] ?? durum, adet }))
          .sort((a, b) => b.adet - a.adet);
      },
    },
    {
      id: "yenikayit",
      ad: "Kaynak başına yeni kayıt (30 gün)",
      sql: "SELECT kaynak, COUNT(*) AS kayit\nFROM kullanicilar\nWHERE kayit_tarih > now() - interval '30 day'\nGROUP BY kaynak\nORDER BY kayit DESC;",
      kolonlar: [
        { anahtar: "kaynak", ad: "Kaynak", hiza: "sol" },
        { anahtar: "kayit", ad: "Yeni Kayıt", hiza: "sag", bicim: "sayi" },
      ],
      calistir: () => {
        const { kullanicilar } = veri();
        const esik = BUGUN - 30 * GUN;
        const adMap = new Map<string, string>(KAYNAKLAR.map((k) => [k.id, k.ad]));
        const m = new Map<string, number>();
        for (const k of kullanicilar) {
          if (k.kayitTarih < esik) continue;
          m.set(k.kaynak, (m.get(k.kaynak) ?? 0) + 1);
        }
        return [...m.entries()]
          .map(([kaynak, kayit]) => ({ kaynak: adMap.get(kaynak) ?? kaynak, kayit }))
          .sort((a, b) => b.kayit - a.kayit);
      },
    },
  ];
}
