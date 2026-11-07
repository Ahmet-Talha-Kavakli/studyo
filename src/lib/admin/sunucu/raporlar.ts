import "server-only";
import path from "path";
import { ipGizle } from "@/lib/hesap/guvenlik";
import { rolHesapla } from "@/lib/hesap/hesap";
import type { HesapKaydi } from "@/lib/hesap/depo";
import type { KrediHareketi } from "@/lib/hesap/tipler";
import { ODEME_KOK, type HediyeKaydi } from "@/lib/odeme/depo";
import { bultenAboneleri } from "@/lib/bultenDepo";
import { denetimOku } from "./denetim";
import { tumJoblar } from "./joblar";
import {
  defterOku, dizin, GUN_MS, gunAnahtari, hareketlerOku, jsonDosya, KAYNAK_AD, kaynakEtiket, kaynakKisa, kaynakSinifi, sonGorulme, sonGunler,
  tumHesaplar, tumOdemeKayitlari, tumSiparisler, type KaynakSinif,
} from "./veri";

/* Analitik, davranış, büyüme, KVKK ve pano raporları. Hepsi depodaki gerçek kayıtlardan hesaplanır; tahmin ya da uydurma sayı yok. */

async function hesapVeHareket(): Promise<{ h: HesapKaydi; x: KrediHareketi[] }[]> {
  const hesaplar = await tumHesaplar();
  return Promise.all(hesaplar.map(async (h) => ({ h, x: await hareketlerOku(h.uid) })));
}
const kullanimMi = (x: KrediHareketi) => x.tur === "harcama" && ["studyo", "api", "build"].includes(kaynakSinifi(x.kaynak));

/* ── Analitik ── */

export async function analitikRaporu(gun = 30) {
  gun = Math.min(365, Math.max(7, gun));
  const simdi = Date.now();
  const bas = simdi - gun * GUN_MS;
  const veri = await hesapVeHareket();
  const siparisler = await tumSiparisler();
  const gunler = sonGunler(gun, simdi);
  const seri = new Map(gunler.map((g) => [g, { gun: g, kayit: 0, aktif: 0, uretim: 0, kredi: 0, odeme: 0 }]));
  const aktifGun = new Map<string, Set<string>>();

  const odeyen = new Set(siparisler.filter((s) => s.durum === "odendi" && s.saglayici !== "deneme").map((s) => s.uid));
  for (const s of siparisler) { if (s.durum !== "odendi" || s.saglayici === "deneme") continue; const g = seri.get(gunAnahtari(s.odemeZamani ?? s.olusturma)); if (g) g.odeme++; }

  const kaynak: Record<string, { adet: number; kredi: number; kullanici: Set<string> }> = {};
  const sinif: Record<KaynakSinif, number> = { studyo: 0, api: 0, build: 0, odeme: 0, yonetim: 0, hediye: 0, sistem: 0, diger: 0 };
  let kayitAralik = 0, dogrulanan = 0, ilkUretim = 0, ilkOdeme = 0;
  for (const { h, x } of veri) {
    const g = seri.get(gunAnahtari(h.olusturma));
    if (g) g.kayit++;
    const yeni = h.olusturma >= bas;
    if (yeni) { kayitAralik++; if (h.epostaDogrulandi) dogrulanan++; if (x.some(kullanimMi)) ilkUretim++; if (odeyen.has(h.uid)) ilkOdeme++; }
    for (const y of x) {
      if (y.zaman < bas) continue;
      if (y.tur === "harcama") sinif[kaynakSinifi(y.kaynak)] += -y.miktar;
      if (!kullanimMi(y)) continue;
      const gg = gunAnahtari(y.zaman);
      const s = seri.get(gg);
      if (s) { s.uretim++; s.kredi += -y.miktar; }
      (aktifGun.get(gg) ?? aktifGun.set(gg, new Set()).get(gg)!).add(h.uid);
      const k = (kaynak[kaynakKisa(y.kaynak)] ??= { adet: 0, kredi: 0, kullanici: new Set() });
      k.adet++; k.kredi += -y.miktar; k.kullanici.add(h.uid);
    }
  }
  for (const [g, s] of aktifGun) { const x = seri.get(g); if (x) x.aktif = s.size; }

  // Haftalık kohort: kayıt haftası, sonraki haftalarda kredi harcayan (üretim yapan) kullanıcı oranı.
  const HAFTA = 7 * GUN_MS;
  const kohortlar: { hafta: string; boyut: number; oranlar: (number | null)[] }[] = [];
  for (let w = 7; w >= 0; w--) {
    const hb = simdi - (w + 1) * HAFTA, hs = hb + HAFTA;
    const grup = veri.filter(({ h }) => h.olusturma >= hb && h.olusturma < hs);
    const oranlar: (number | null)[] = [];
    for (let k = 0; k <= 7 - w; k++) {
      const pb = hb + k * HAFTA, ps = pb + HAFTA;
      if (pb > simdi) { oranlar.push(null); continue; }
      const aktif = grup.filter(({ x }) => x.some((y) => kullanimMi(y) && y.zaman >= pb && y.zaman < ps)).length;
      oranlar.push(grup.length ? Math.round((aktif / grup.length) * 100) : null);
    }
    kohortlar.push({ hafta: gunAnahtari(hb), boyut: grup.length, oranlar });
  }

  // Plan dağılımı (defterden).
  const planlar: Record<string, number> = {};
  for (const { h } of veri) { const d = await defterOku(h.uid); const p = d?.plan ?? h.plan; planlar[p] = (planlar[p] ?? 0) + 1; }

  const son7 = new Set<string>(), son30 = new Set<string>();
  for (const { h, x } of veri) for (const y of x) { if (!kullanimMi(y)) continue; if (y.zaman > simdi - 7 * GUN_MS) son7.add(h.uid); if (y.zaman > simdi - 30 * GUN_MS) son30.add(h.uid); }

  return {
    gun,
    seri: [...seri.values()],
    huni: [
      { asama: "Kayıt", sayi: kayitAralik },
      { asama: "E-posta doğrulandı", sayi: dogrulanan },
      { asama: "İlk üretim", sayi: ilkUretim },
      { asama: "İlk ödeme", sayi: ilkOdeme },
    ],
    kohortlar,
    kaynaklar: Object.entries(kaynak).map(([k, v]) => ({ kaynak: k, etiket: kaynakEtiket(k), adet: v.adet, kredi: v.kredi, kullanici: v.kullanici.size })).sort((a, b) => b.kredi - a.kredi),
    harcamaSinif: Object.entries(sinif).filter(([, v]) => v > 0).map(([k, v]) => ({ sinif: k, etiket: KAYNAK_AD[k as KaynakSinif], kredi: v })),
    planlar,
    aktif: { gun7: son7.size, gun30: son30.size, toplam: veri.length },
  };
}

/* ── Davranış: oturumlar, cihazlar, giriş olayları, aynı IP'den çoklu hesap ── */

export async function davranisRaporu() {
  const hesaplar = await tumHesaplar();
  const simdi = Date.now();
  const say = (m: Record<string, number>, k: string) => { m[k] = (m[k] ?? 0) + 1; };
  const tur: Record<string, number> = {}, tarayici: Record<string, number> = {}, isletim: Record<string, number> = {}, yontem: Record<string, number> = {};
  const isi = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  const olayTur: Record<string, number> = {};
  const ipHesap = new Map<string, Set<string>>();
  let acikOturum = 0;
  const son: { zaman: number; tur: string; uid: string; email: string; cihaz: string; ayrinti?: string; ip?: string }[] = [];
  for (const h of hesaplar) {
    for (const o of h.oturumlar) {
      if (o.bitis > simdi) { acikOturum++; say(tur, o.tur); say(tarayici, o.tarayici || "Bilinmiyor"); say(isletim, o.isletim || "Bilinmiyor"); say(yontem, o.yontem || "Bilinmiyor"); }
      if (o.ip && o.ip !== "bilinmiyor") (ipHesap.get(o.ip) ?? ipHesap.set(o.ip, new Set()).get(o.ip)!).add(h.uid);
    }
    for (const e of h.olaylar ?? []) {
      if (e.zaman < simdi - 90 * GUN_MS) continue;
      say(olayTur, e.tur);
      if (e.tur === "giris") { const d = new Date(e.zaman + 3 * 3_600_000); isi[(d.getUTCDay() + 6) % 7][d.getUTCHours()]++; }
      if (e.ip && e.tur === "kayit") (ipHesap.get(e.ip) ?? ipHesap.set(e.ip, new Set()).get(e.ip)!).add(h.uid);
      son.push({ zaman: e.zaman, tur: e.tur, uid: h.uid, email: h.email, cihaz: e.cihaz, ayrinti: e.ayrinti, ip: e.ip ? ipGizle(e.ip) : undefined });
    }
  }
  const email = new Map(hesaplar.map((h) => [h.uid, h.email]));
  const cokluHesap = [...ipHesap.entries()].filter(([, s]) => s.size > 1).map(([ip, s]) => ({ ip: ipGizle(ip), hesaplar: [...s].map((uid) => ({ uid, email: email.get(uid) ?? "" })) }))
    .sort((a, b) => b.hesaplar.length - a.hesaplar.length).slice(0, 50);
  const l = (m: Record<string, number>) => Object.entries(m).map(([etiket, deger]) => ({ etiket, deger })).sort((a, b) => b.deger - a.deger);
  return {
    acikOturum, cihazTuru: l(tur), tarayici: l(tarayici).slice(0, 10), isletim: l(isletim).slice(0, 10), yontem: l(yontem),
    girisIsi: isi, olayTur: l(olayTur), cokluHesap,
    sonOlaylar: son.sort((a, b) => b.zaman - a.zaman).slice(0, 150),
    sonGorulme: hesaplar.map((h) => ({ uid: h.uid, email: h.email, ad: h.profil?.ad ?? "", son: sonGorulme(h) })).sort((a, b) => b.son - a.son).slice(0, 20),
  };
}

/* ── Büyüme: davetler, hediye kodları, promosyon ve görev ödülleri, kayıt yöntemleri ── */

export async function buyumeRaporu() {
  const [hesaplar, kayitlar, bulten] = await Promise.all([tumHesaplar(), tumOdemeKayitlari(), bultenAboneleri()]);
  const simdi = Date.now();
  const davet: Record<string, { davetEden: string; sayi: number; indirimKullanan: number; son: number }> = {};
  const kayitYontem: Record<string, number> = {};
  for (const h of hesaplar) {
    const d = h.profil?.davetEden;
    if (d) { const x = (davet[d] ??= { davetEden: d, sayi: 0, indirimKullanan: 0, son: 0 }); x.sayi++; if (h.profil.davetIndirimi === "kullanildi") x.indirimKullanan++; x.son = Math.max(x.son, h.olusturma); }
    const k = (h.olaylar ?? []).find((e) => e.tur === "kayit");
    const y = k?.ayrinti || (h.saglayicilar?.[0]?.tur ? h.saglayicilar[0].tur : "E-posta ve şifre");
    kayitYontem[y] = (kayitYontem[y] ?? 0) + 1;
  }
  // Hediye kodları: oluşturan hesapların kayıtlarından (kodun kendisi döndürülmez).
  const hediyeler: { olusturan: string; kredi: number; zaman: number; kullanildi?: number; iptal?: number }[] = [];
  const promo: Record<string, number> = {}, gorev: Record<string, number> = {};
  for (const k of kayitlar) {
    for (const x of k.hediyeler ?? []) hediyeler.push({ olusturan: hesaplar.find((h) => h.uid === k.uid)?.email ?? k.uid, kredi: x.kredi, zaman: x.zaman, kullanildi: x.kullanildi, iptal: x.iptal });
    for (const p of Object.keys(k.promolar ?? {})) promo[p] = (promo[p] ?? 0) + 1;
    for (const g of Object.keys(k.gorevler ?? {})) gorev[g] = (gorev[g] ?? 0) + 1;
  }
  const hediyeDiz = path.join(ODEME_KOK, "hediye");
  let hediyeKayit = 0;
  for (const a of await dizin(hediyeDiz)) if (a.endsWith(".json") && (await jsonDosya<HediyeKaydi>(path.join(hediyeDiz, a)))) hediyeKayit++;
  const hafta = sonGunler(12 * 7, simdi);
  const haftalik: { hafta: string; kayit: number; davetli: number }[] = [];
  for (let i = 0; i < 12; i++) haftalik.push({ hafta: hafta[i * 7], kayit: 0, davetli: 0 });
  for (const h of hesaplar) {
    const fark = Math.floor((simdi - h.olusturma) / (7 * GUN_MS));
    if (fark < 0 || fark > 11) continue;
    const x = haftalik[11 - fark]; x.kayit++; if (h.profil?.davetEden) x.davetli++;
  }
  return {
    toplamKayit: hesaplar.length,
    davetli: hesaplar.filter((h) => h.profil?.davetEden).length,
    davetler: Object.values(davet).sort((a, b) => b.sayi - a.sayi).slice(0, 50),
    kayitYontem: Object.entries(kayitYontem).map(([etiket, deger]) => ({ etiket, deger })).sort((a, b) => b.deger - a.deger),
    hediye: {
      kayit: hediyeKayit, olusturulan: hediyeler.length, kullanilan: hediyeler.filter((x) => x.kullanildi).length, iptal: hediyeler.filter((x) => x.iptal).length,
      kredi: hediyeler.reduce((a, x) => a + x.kredi, 0), son: hediyeler.sort((a, b) => b.zaman - a.zaman).slice(0, 30),
    },
    promolar: Object.entries(promo).map(([kod, sayi]) => ({ kod, sayi })).sort((a, b) => b.sayi - a.sayi),
    gorevler: Object.entries(gorev).map(([kod, sayi]) => ({ kod, sayi })).sort((a, b) => b.sayi - a.sayi),
    haftalik,
    bulten: { sayi: bulten.length, son30: bulten.filter((b) => b.ilk > simdi - 30 * GUN_MS).length, konular: Object.entries(bulten.flatMap((b) => b.konular).reduce<Record<string, number>>((m, k) => { m[k] = (m[k] ?? 0) + 1; return m; }, {})).map(([etiket, deger]) => ({ etiket, deger })), aboneler: bulten.slice(0, 100) },
  };
}

/* ── KVKK: veri indirme ve silme kayıtları, saklama süreleri ── */

export async function kvkkRaporu() {
  const hesaplar = await tumHesaplar();
  const indirme: { zaman: number; uid: string; email: string; cihaz: string }[] = [];
  for (const h of hesaplar) for (const e of h.olaylar ?? []) if (e.tur === "veri-indir") indirme.push({ zaman: e.zaman, uid: h.uid, email: h.email, cihaz: e.cihaz });
  const denetim = await denetimOku(5000);
  const silinen = denetim.filter((d) => d.tur === "hesap-sil");
  const siparisler = await tumSiparisler();
  return {
    indirme: indirme.sort((a, b) => b.zaman - a.zaman).slice(0, 200),
    yoneticiSilme: silinen.slice(0, 200),
    kimliksizSiparis: siparisler.filter((s) => s.uid === "silindi").length,
    dogrulanmamisEski: hesaplar.filter((h) => !h.epostaDogrulandi && h.olusturma < Date.now() - 30 * GUN_MS).map((h) => ({ uid: h.uid, email: h.email, olusturma: h.olusturma, son: sonGorulme(h) })).slice(0, 100),
    hesapSayisi: hesaplar.length,
  };
}

/** Bir hesabın kişisel veri dökümü (KVKK erişim hakkı). Gizli alanlar (şifre özeti, iki adım sırrı, oturum belirteç özetleri, Build anahtarı) çıkarılır. */
export async function veriDokumu(h: HesapKaydi) {
  const { sifre: _s, ikiAdim: _i, ikiAdimKurulum: _k, build: _b, oturumlar, ...temel } = h; void _s; void _i; void _k; void _b;
  const { kayitOku } = await import("@/lib/odeme/depo");
  const odeme = await kayitOku(h.uid);
  const siparisler = (await tumSiparisler()).filter((s) => s.uid === h.uid).map(({ token: _t, oturum: _o, ip: _ip, ...s }) => { void _t; void _o; void _ip; return s; });
  return {
    olusturma: new Date().toISOString(),
    hesap: { ...temel, ikiAdimAcik: !!h.ikiAdim, sifreVar: !!h.sifre, oturumlar: oturumlar.map(({ ozet: _oz, ...o }) => { void _oz; return o; }) },
    kredi: { durum: await defterOku(h.uid), hareketler: await hareketlerOku(h.uid) },
    odeme: { ...odeme, hediyeler: (odeme.hediyeler ?? []).map(({ kod: _kod, ...x }) => { void _kod; return x; }) },
    siparisler,
  };
}

/* ── Pano ── */

export async function panoOzeti() {
  const simdi = Date.now();
  const [hesaplar, siparisler, kayitlar, joblar, denetim] = await Promise.all([tumHesaplar(), tumSiparisler(), tumOdemeKayitlari(), tumJoblar(), denetimOku(50)]);
  const gun30 = simdi - 30 * GUN_MS, gun7 = simdi - 7 * GUN_MS, gun1 = simdi - GUN_MS;
  const gelir30: Record<string, number> = {}, gelirOnceki: Record<string, number> = {};
  const ek = (m: Record<string, number>, p: string, n: number) => { m[p] = (m[p] ?? 0) + n; };
  const gunler = sonGunler(30, simdi);
  const gelirSeri = new Map(gunler.map((g) => [g, { gun: g, tutar: {} as Record<string, number>, kayit: 0, uretim: 0 }]));
  for (const s of siparisler) {
    if (s.saglayici === "deneme" || (s.durum !== "odendi" && s.durum !== "iade")) continue;
    const t = s.odemeZamani ?? s.olusturma, tutar = (s.tahsil ?? s.toplam) - (s.iade?.tutar ?? 0);
    if (t >= gun30) { ek(gelir30, s.para, tutar); const g = gelirSeri.get(gunAnahtari(t)); if (g) ek(g.tutar, s.para, tutar); }
    else if (t >= gun30 - 30 * GUN_MS) ek(gelirOnceki, s.para, tutar);
  }
  for (const h of hesaplar) { const g = gelirSeri.get(gunAnahtari(h.olusturma)); if (g) g.kayit++; }
  for (const j of joblar) { if (j.zaman < gun30) break; const g = gelirSeri.get(gunAnahtari(j.zaman)); if (g) g.uretim++; }
  const planlar: Record<string, number> = {};
  let toplamBakiye = 0;
  for (const h of hesaplar) { const d = await defterOku(h.uid); const p = d?.plan ?? h.plan; planlar[p] = (planlar[p] ?? 0) + 1; if (d) toplamBakiye += d.planKredi + d.ekKredi; }
  const j24 = joblar.filter((j) => j.zaman > gun1);
  const hata24 = j24.filter((j) => j.durum === "iade" || j.durum === "hata").length;
  const tamam24 = j24.filter((j) => j.durum === "tamam").length;
  const etkinAbone = kayitlar.filter((k) => k.abonelik && k.abonelik.durum !== "bitti" && k.abonelik.donemBitis > simdi && k.abonelik.saglayici !== "deneme").length;

  // En çok kredi harcayanlar (30 gün, kullanım).
  const harcayan: { uid: string; ad: string; email: string; kredi: number }[] = [];
  for (const h of hesaplar) {
    const x = await hareketlerOku(h.uid);
    const k = x.filter((y) => y.zaman >= gun30 && kullanimMi(y)).reduce((a, y) => a - y.miktar, 0);
    if (k > 0) harcayan.push({ uid: h.uid, ad: h.profil?.ad ?? "", email: h.email, kredi: k });
  }

  // Son olaylar akışı: kayıtlar, ödemeler, işler, yönetici işlemleri.
  const akis: { tur: "kayit" | "odeme" | "job" | "yonetim"; zaman: number; metin: string; alt: string; href?: string }[] = [];
  for (const h of hesaplar) if (h.olusturma > gun7) akis.push({ tur: "kayit", zaman: h.olusturma, metin: `${h.profil?.ad || h.email} kaydoldu`, alt: h.email, href: `/admin/kullanicilar/${h.uid}` });
  for (const s of siparisler) if (s.durum === "odendi" && (s.odemeZamani ?? 0) > gun7) akis.push({ tur: "odeme", zaman: s.odemeZamani!, metin: s.ad, alt: `${s.saglayici === "deneme" ? "Deneme ödemesi" : s.saglayici} · ${s.no}`, href: "/admin/finans" });
  for (const j of joblar.slice(0, 40)) akis.push({ tur: "job", zaman: j.zaman, metin: j.ad, alt: `${j.email ?? ""}${j.durum === "iade" ? " · iade edildi" : j.durum === "hata" ? " · hata" : ""}`, href: `/admin/joblar/${encodeURIComponent(j.id)}` });
  for (const d of denetim) if (d.tur !== "panel") akis.push({ tur: "yonetim", zaman: d.zaman, metin: d.eylem, alt: `${d.admin.email}${d.hedef?.email ? ` · ${d.hedef.email}` : ""}` });

  return {
    kullanici: {
      toplam: hesaplar.length, yeni30: hesaplar.filter((h) => h.olusturma > gun30).length, yeni7: hesaplar.filter((h) => h.olusturma > gun7).length,
      aktif7: hesaplar.filter((h) => sonGorulme(h) > gun7).length, dogrulanmis: hesaplar.filter((h) => h.epostaDogrulandi).length,
      askida: hesaplar.filter((h) => h.askida).length, admin: hesaplar.filter((h) => rolHesapla(h) === "admin").length,
    },
    gelir: { gun30: gelir30, onceki30: gelirOnceki, etkinAbone, paralar: Object.keys(gelir30).sort((a, b) => gelir30[b] - gelir30[a]) },
    is: { gun1: j24.length, hata24, basari24: tamam24 + hata24 ? Math.round((tamam24 / (tamam24 + hata24)) * 1000) / 10 : null, suruyor: joblar.filter((j) => j.durum === "suruyor").length, gun30: joblar.filter((j) => j.zaman > gun30).length },
    kredi: { toplamBakiye },
    planlar,
    seri: [...gelirSeri.values()],
    harcayan: harcayan.sort((a, b) => b.kredi - a.kredi).slice(0, 10),
    akis: akis.sort((a, b) => b.zaman - a.zaman).slice(0, 12),
  };
}
