import "server-only";
import { rolHesapla } from "@/lib/hesap/hesap";
import { ipGizle } from "@/lib/hesap/guvenlik";
import { sonHareketler } from "@/lib/hesap/kredi";
import type { HesapKaydi } from "@/lib/hesap/depo";
import type { PlanKimligi } from "@/lib/hesap/tipler";
import { kayitOku, siparisOku } from "@/lib/odeme/depo";
import { coz } from "@/lib/build/sifre";
import { denetimOku } from "./denetim";
import { apiAnahtarSahipleri, defterOku, hareketlerOku, sonGorulme, tumHesaplar, type DefterHam } from "./veri";

/** Liste satırı: gizli alan yok (şifre özeti, iki adım sırrı, oturum belirteç özetleri dönmez). */
export interface KullaniciSatiri {
  id: string;
  ad: string;
  email: string;
  kullaniciAdi?: string;
  avatar?: string;
  plan: PlanKimligi;
  bakiye: number | null;
  olusturma: number;
  sonGorulme: number;
  dogrulandi: boolean;
  admin: boolean;
  askida: boolean;
  ikiAdim: boolean;
  saglayicilar: string[];
  oturum: number;
}

function satir(h: HesapKaydi, d: DefterHam | null): KullaniciSatiri {
  const simdi = Date.now();
  return {
    id: h.uid, ad: h.profil?.ad || h.email.split("@")[0], email: h.email, ...(h.profil?.kullaniciAdi ? { kullaniciAdi: h.profil.kullaniciAdi } : {}),
    ...(h.profil?.avatar ? { avatar: h.profil.avatar } : {}),
    plan: d?.plan ?? h.plan, bakiye: d ? d.planKredi + d.ekKredi : null, olusturma: h.olusturma, sonGorulme: sonGorulme(h),
    dogrulandi: h.epostaDogrulandi, admin: rolHesapla(h) === "admin", askida: !!h.askida, ikiAdim: !!h.ikiAdim,
    saglayicilar: [...new Set((h.saglayicilar ?? []).map((s) => s.tur))], oturum: h.oturumlar.filter((o) => o.bitis > simdi).length,
  };
}

export async function tumSatirlar(): Promise<KullaniciSatiri[]> {
  const hesaplar = await tumHesaplar();
  return Promise.all(hesaplar.map(async (h) => satir(h, await defterOku(h.uid))));
}

export type Durum = "hepsi" | "aktif" | "askida" | "dogrulanmamis" | "admin" | "ikiAdim";
export type Siralama = "yeni" | "eski" | "son" | "bakiye" | "ad";

export interface ListeSorgu { q?: string; plan?: string; durum?: Durum; sirala?: Siralama; sayfa?: number; boyut?: number }

export async function kullaniciListesi(s: ListeSorgu) {
  const tum = await tumSatirlar();
  const q = (s.q ?? "").trim().toLocaleLowerCase("tr");
  const yedi = Date.now() - 7 * 86_400_000;
  let l = tum.filter((k) => {
    if (q && !(k.email.includes(q) || k.ad.toLocaleLowerCase("tr").includes(q) || k.id.toLowerCase().includes(q) || (k.kullaniciAdi ?? "").includes(q))) return false;
    if (s.plan && s.plan !== "hepsi" && k.plan !== s.plan) return false;
    switch (s.durum) {
      case "aktif": return k.sonGorulme > yedi && !k.askida;
      case "askida": return k.askida;
      case "dogrulanmamis": return !k.dogrulandi;
      case "admin": return k.admin;
      case "ikiAdim": return k.ikiAdim;
      default: return true;
    }
  });
  const sir = s.sirala ?? "yeni";
  l = l.sort((a, b) => sir === "eski" ? a.olusturma - b.olusturma : sir === "son" ? b.sonGorulme - a.sonGorulme
    : sir === "bakiye" ? (b.bakiye ?? 0) - (a.bakiye ?? 0) : sir === "ad" ? a.ad.localeCompare(b.ad, "tr") : b.olusturma - a.olusturma);
  const boyut = Math.min(100, Math.max(10, s.boyut ?? 25));
  const sayfaSayisi = Math.max(1, Math.ceil(l.length / boyut));
  const sayfa = Math.min(sayfaSayisi, Math.max(1, s.sayfa ?? 1));
  const planlar: Record<string, number> = {};
  for (const k of tum) planlar[k.plan] = (planlar[k.plan] ?? 0) + 1;
  return {
    satirlar: l.slice((sayfa - 1) * boyut, sayfa * boyut), toplam: l.length, sayfa, sayfaSayisi, boyut,
    ozet: {
      toplam: tum.length, aktif7: tum.filter((k) => k.sonGorulme > yedi).length, askida: tum.filter((k) => k.askida).length,
      dogrulanmamis: tum.filter((k) => !k.dogrulandi).length, admin: tum.filter((k) => k.admin).length, ikiAdim: tum.filter((k) => k.ikiAdim).length, planlar,
    },
  };
}

/** Kullanıcı ayrıntısı: profil, defter, hareketler, ödemeler, oturumlar, güvenlik olayları, Build, API, denetim. */
export async function kullaniciAyrinti(h: HesapKaydi) {
  const d = await defterOku(h.uid);
  const hareketler = await sonHareketler(h.uid, 300);
  const tumHareket = await hareketlerOku(h.uid);
  let harcanan = 0, eklenen = 0, iade = 0, uretim = 0;
  for (const x of tumHareket) {
    if (x.tur === "harcama") { harcanan += -x.miktar; if (x.kaynak.startsWith("sunucu:") || x.kaynak.startsWith("istemci:") || x.kaynak.startsWith("build")) uretim++; }
    else if (x.tur === "ekleme") eklenen += x.miktar;
    else if (x.tur === "iade") iade += x.miktar;
  }
  const odeme = await kayitOku(h.uid);
  const siparisler = (await Promise.all(odeme.siparisler.slice(0, 100).map((no) => siparisOku(no)))).filter((s) => !!s).map((s) => ({
    no: s!.no, tur: s!.tur, ad: s!.ad, durum: s!.durum, para: s!.para, toplam: s!.toplam, net: s!.net, kdv: s!.kdv, saglayici: s!.saglayici, mod: s!.mod,
    olusturma: s!.olusturma, odemeZamani: s!.odemeZamani, makbuzNo: s!.makbuzNo, kart: s!.kart, taksit: s!.taksit, iade: s!.iade, hata: s!.hata,
  }));
  const simdi = Date.now();
  const oturumlar = h.oturumlar.filter((o) => o.bitis > simdi).map((o) => ({
    id: o.id, tarayici: o.tarayici, isletim: o.isletim, tur: o.tur, baslangic: o.olusturma, sonGorulme: o.sonGorulme, bitis: o.bitis, yontem: o.yontem, ip: ipGizle(o.ip ?? ""),
  }));
  // Build projeleri (yalnız okunur). Anahtar çözülemezse sayı bilinmez.
  let build: { sayi: number; projeler: { id: string; ad: string; tur: string; guncelleme: number; yayinda: boolean }[] } | null = null;
  const anahtar = h.build ? coz(h.build.anahtar) : null;
  if (anahtar) {
    try {
      const { sahipProjeleri } = await import("@/lib/build/depo");
      const l = (await sahipProjeleri(anahtar)).filter((p) => !p.ekipRol);
      build = { sayi: l.length, projeler: l.slice(0, 50).map((p) => ({ id: p.id, ad: p.ad, tur: String(p.tur), guncelleme: p.guncelleme, yayinda: !!p.yayin })) };
    } catch { build = null; }
  } else build = { sayi: 0, projeler: [] };
  const apiAnahtar = (await apiAnahtarSahipleri()).filter((a) => a.uid === h.uid).length;
  const denetim = (await denetimOku(2000)).filter((k) => k.hedef?.uid === h.uid).slice(0, 100);
  return {
    hesap: {
      ...satir(h, d), profil: { ...h.profil }, guncelleme: h.guncelleme, bekleyenEposta: h.bekleyenEposta,
      sifreVar: !!h.sifre, sifreGuncelleme: h.sifre?.guncelleme ?? null, ikiAdimAcilis: h.ikiAdim?.acilis ?? null,
      askidaAyrinti: h.askida ?? null, yeniGirisEposta: h.tercih?.yeniGirisEposta !== false,
    },
    defter: d ? {
      plan: d.plan, bakiye: d.planKredi + d.ekKredi, planKredi: d.planKredi, ekKredi: d.ekKredi, donemBaslangic: d.donemBaslangic, donemBitis: d.donemBitis,
      donemToplam: d.donemToplam, ozelKota: d.ozelKota ?? null, planBitis: d.planBitis ?? null, planOtomatik: !!d.planOtomatik, planGecis: d.planGecis ?? null,
    } : null,
    kredi: { harcanan, eklenen, iade, uretim, hareketSayisi: tumHareket.length },
    hareketler,
    odeme: {
      siparisler, abonelik: odeme.abonelik ?? null, gecmis: odeme.gecmis ?? [], sinirsiz: odeme.sinirsiz ?? [], hiz: odeme.hiz ?? null,
      promolar: Object.keys(odeme.promolar ?? {}).length, gorevler: Object.keys(odeme.gorevler ?? {}).length, hediyeler: (odeme.hediyeler ?? []).map(({ kod: _k, ...x }) => { void _k; return x; }),
      fatura: odeme.fatura ? { tip: odeme.fatura.tip, il: odeme.fatura.il, ulke: odeme.fatura.ulke ?? "TR" } : null,
    },
    oturumlar,
    olaylar: (h.olaylar ?? []).slice(0, 100).map((o) => ({ ...o, ip: o.ip ? ipGizle(o.ip) : undefined })),
    build, apiAnahtar, denetim,
  };
}
