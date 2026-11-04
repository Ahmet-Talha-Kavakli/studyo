"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { KURALLAR, kampanyaBul, seviyeBul, type Kampanya, type Platform } from "@/lib/earn/kampanyalar";
import { kodUret } from "@/lib/earn/dogrulama";

/* ============================================================
   useEarn — Vayra Earn verisi (v3).

   Hesaba bağlıdır: `sahip` (e-posta) değişirse veri sıfırlanır; her kullanıcı
   boş başlar. Örnek/sahte kayıt yoktur.

   Gönderi yaşam döngüsü ZAMANDAN hesaplanır:
     inceleme (72 sa) → kazanıyor (7 gün) → bekleme (3 gün) → çekilebilir
   Görev: inceleme → bekleme → çekilebilir (sabit ödül).
   Yarışma: kampanya bitene kadar "jüride"; derece açıklanınca ödül, yoksa "sonuçlandı".

   Görüntülenme: platform API'si bağlıysa (bkz. lib/earn/entegrasyon) gerçek değer
   `istatistik` alanına yazılır ve o kullanılır; değilse takipçiye bağlı
   deterministik tahmin eğrisi çalışır.
   ============================================================ */

const SA = 3_600_000, GUN = 86_400_000;

export type GonderiDurum = "inceleme" | "kazaniyor" | "bekleme" | "cekilebilir" | "reddedildi" | "degerlendirme" | "sonuclandi";
export type GonderiKontrol = { gercek: boolean; sahibiMi: boolean | null; baslik?: string; kucukResim?: string };
export type Gonderi = {
  id: string; kampanyaId: string; platform: Platform; link: string; tarih: number;
  /** Simülasyon için hedef görüntülenme (takipçi + bağlantıdan türetilir). */
  hedef: number;
  /** Gönderide kullanılan Vayra üretimi (kitaplık). */
  uretimId?: string;
  uretimGorsel?: string;
  kontrol?: GonderiKontrol;
  /** Platform API'sinden okunan son görüntülenme. */
  istatistik?: { goruntulenme: number; zaman: number };
  red?: string; itiraz?: "inceleniyor" | "reddedildi";
  derece?: number;
};
export type HesapDurum = "bekliyor" | "dogrulaniyor" | "dogrulandi";
export type BagliHesap = { platform: Platform; kadi: string; kod: string; durum: HesapDurum; takipci: number; tarih: number; ad?: string; gercek?: boolean; hata?: string };
export type Kimlik = { ad: string; soyad: string; tckn: string; dogumYili: number; gercek: boolean; tarih: number };
export type OdemeYontemi = { id: string; tur: "iban" | "papara"; ad: string; deger: string };
export type CekimDurum = "isleniyor" | "odendi" | "basarisiz";
export type Cekim = {
  id: string; tutar: number; ucret: number; yontemId: string; yontemAd: string; tarih: number;
  referans: string; gercek: boolean; durum?: CekimDurum; hata?: string;
};
export type GelirKaynak = "davet" | "ortaklik" | "marketplace";
export type Gelir = { id: string; kaynak: GelirKaynak; baslik: string; tutar: number; tarih: number };
export type Davetli = { id: string; kadi: string; durum: "kayit" | "uretti" | "abone"; plan?: string; komisyon: number; tarih: number };
export type DestekTalep = { id: string; konu: string; mesaj: string; durum: "gonderiliyor" | "iletildi" | "hata"; tarih: number };

/* ── Deterministik yardımcılar ── */
export function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Gönderinin anlık durumu, görüntülenmesi ve kazancı. */
export function gonderiHesap(g: Gonderi, simdi = Date.now(), seviyeBonus = 0) {
  const k = kampanyaBul(g.kampanyaId); // bitiş tarihleri bugüne sabitlidir; geçmiş "simdi" ile kaymaz
  const gecen = simdi - g.tarih;
  const inceleme = KURALLAR.incelemeSaat * SA, kazanma = KURALLAR.kazanmaGun * GUN, bekleme = KURALLAR.beklemeGun * GUN;
  const sonuc = { durum: "inceleme" as GonderiDurum, goruntulenme: 0, kazanc: 0, sabit: 0, bonus24: 0, bonus7: 0, ilerleme: 0, sonrakiAsama: 0, minAltinda: false, gercekVeri: false, kampanya: k };
  if (!k) return sonuc;
  if (g.red && g.itiraz !== "inceleniyor") return { ...sonuc, durum: "reddedildi" as GonderiDurum };

  if (k.tur === "yarisma") {
    if (k.bitis > simdi) return { ...sonuc, durum: "degerlendirme" as GonderiDurum, sonrakiAsama: k.bitis };
    if (!g.derece) return { ...sonuc, durum: "sonuclandi" as GonderiDurum };
    const odul = k.dereceler?.[g.derece - 1] ?? 0;
    const tamam = k.bitis + bekleme;
    return { ...sonuc, durum: (simdi >= tamam ? "cekilebilir" : "bekleme") as GonderiDurum, kazanc: odul, sonrakiAsama: tamam };
  }
  if (gecen < inceleme) return { ...sonuc, ilerleme: gecen / inceleme, sonrakiAsama: g.tarih + inceleme };

  if (k.tur === "gorev") {
    const odul = Math.round((k.odul ?? 0) * (1 + seviyeBonus));
    const tamam = g.tarih + inceleme + bekleme;
    return { ...sonuc, durum: (simdi >= tamam ? "cekilebilir" : "bekleme") as GonderiDurum, kazanc: odul, sabit: odul, ilerleme: Math.min(1, (gecen - inceleme) / bekleme), sonrakiAsama: tamam };
  }

  // Görüntülenme kampanyası
  const t = Math.min(gecen - inceleme, kazanma);
  const tau = (1.2 + (g.hedef % 7) / 5) * GUN;
  const egri = (x: number) => 1 - Math.exp(-x / tau);
  const tahmin = Math.round(g.hedef * egri(t) / egri(kazanma));
  const gercekVeri = !!g.istatistik;
  const goruntulenme = gercekVeri ? g.istatistik!.goruntulenme : tahmin;
  // 24. saat bonusu: ilk 24 saatin payı eğriyle oranlanır (gerçek veride de).
  const pay24 = egri(Math.min(t, GUN)) / Math.max(1e-9, egri(t));
  const g24 = Math.round(goruntulenme * Math.min(1, pay24));
  const oran = k.oran ?? 0, sabit = k.sabitOdeme ?? 0;
  const ham = (goruntulenme / 1000) * oran;
  const bonus24 = t >= GUN ? (g24 / 1000) * oran * KURALLAR.bonus24 : 0;
  const bonus7 = t >= kazanma ? ham * KURALLAR.bonus7 : 0;
  let kazanc = (sabit + ham + bonus24 + bonus7) * (1 + seviyeBonus);
  kazanc = Math.min(kazanc, k.maxOdeme ?? Infinity);
  const bitti = gecen >= inceleme + kazanma;
  const minAltinda = bitti && kazanc < (k.minOdeme ?? 0);
  if (minAltinda) kazanc = 0;
  kazanc = Math.round(kazanc * 100) / 100;
  if (!bitti) return { ...sonuc, durum: "kazaniyor" as GonderiDurum, goruntulenme, kazanc, sabit, bonus24, bonus7, gercekVeri, ilerleme: t / kazanma, sonrakiAsama: g.tarih + inceleme + kazanma };
  const tamam = g.tarih + inceleme + kazanma + bekleme;
  return { ...sonuc, durum: (simdi >= tamam ? "cekilebilir" : "bekleme") as GonderiDurum, goruntulenme, kazanc, sabit, bonus24, bonus7, gercekVeri, minAltinda, ilerleme: Math.min(1, (gecen - inceleme - kazanma) / bekleme), sonrakiAsama: tamam };
}

/** Çekimin durumu. Papara (gerçek) anında sonuçlanır; banka havalesi 1 iş günü içinde. */
export function cekimDurum(c: Cekim, simdi = Date.now()): CekimDurum {
  if (c.durum) return c.durum;
  return simdi - c.tarih >= 24 * SA ? "odendi" : "isleniyor";
}

/** Cüzdan özeti. */
export function cuzdan(s: Pick<EarnState, "gonderiler" | "gelirler" | "cekimler">, simdi = Date.now()) {
  const digerToplam = s.gelirler.reduce((a, g) => a + g.tutar, 0);
  // Seviye, bonussuz toplam kazançla belirlenir (bonus seviyeye, seviye bonusa bağlı olmasın).
  const bonussuz = s.gonderiler.reduce((a, g) => { const h = gonderiHesap(g, simdi, 0); return h.durum === "reddedildi" ? a : a + h.kazanc; }, 0);
  const sv = seviyeBul(bonussuz + digerToplam);
  let bekleyen = 0, gonderiCekilebilir = 0, gonderiToplam = 0;
  for (const g of s.gonderiler) {
    const h = gonderiHesap(g, simdi, sv.seviye.bonus);
    if (h.durum === "kazaniyor" || h.durum === "bekleme") bekleyen += h.kazanc;
    if (h.durum === "cekilebilir") gonderiCekilebilir += h.kazanc;
    if (h.durum !== "reddedildi") gonderiToplam += h.kazanc;
  }
  const gecerli = s.cekimler.filter((c) => cekimDurum(c, simdi) !== "basarisiz");
  const cekilen = gecerli.reduce((a, c) => a + c.tutar + c.ucret, 0);
  const odenen = gecerli.filter((c) => cekimDurum(c, simdi) === "odendi").reduce((a, c) => a + c.tutar, 0);
  const isleniyor = gecerli.filter((c) => cekimDurum(c, simdi) === "isleniyor").reduce((a, c) => a + c.tutar, 0);
  const yuvarla = (n: number) => Math.round(n * 100) / 100;
  return {
    bekleyen: yuvarla(bekleyen),
    cekilebilir: Math.max(0, yuvarla(gonderiCekilebilir + digerToplam - cekilen)),
    odenen, isleniyor,
    toplam: yuvarla(gonderiToplam + digerToplam),
    /** Seviyeyi belirleyen bonussuz toplam (ilerleme çubukları bununla hesaplanır). */
    seviyeKazanc: yuvarla(bonussuz + digerToplam),
    ...sv,
  };
}

/** Kampanyanın bu kullanıcı için kalan kontenjanı ve katılım hakkı. */
export function kampanyaHakki(k: Kampanya, gonderiler: Gonderi[]) {
  const benim = gonderiler.filter((g) => g.kampanyaId === k.id && !(g.red && g.itiraz !== "inceleniyor"));
  // Görev ve yarışmada kişi başı 1 gönderi; görüntülenme kampanyasında sınırsız.
  const tekHak = k.tur !== "goruntulenme";
  return {
    gonderiSayisi: benim.length,
    hakKaldi: !tekHak || benim.length === 0,
    kotaKalan: k.tur === "gorev" ? Math.max(0, (k.kotaKalan ?? 0) - benim.length) : null,
  };
}

/** Son `gun` günün günlük kazancı (gönderi artışları + diğer gelirler). Grafik için. */
export function gunlukSeri(s: Pick<EarnState, "gonderiler" | "gelirler">, simdi = Date.now(), gun = 30) {
  const bugun = new Date(simdi); bugun.setHours(23, 59, 59, 999);
  const son = bugun.getTime();
  const veri: number[] = [], etiketler: string[] = [];
  const fmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
  const kumulatif = (t: number) => s.gonderiler.reduce((a, g) => {
    if (g.tarih > t) return a;
    const h = gonderiHesap(g, Math.min(t, simdi), 0);
    return h.durum === "reddedildi" ? a : a + h.kazanc;
  }, 0);
  let onceki = kumulatif(son - gun * GUN);
  for (let i = gun - 1; i >= 0; i--) {
    const bit = son - i * GUN;
    const k = kumulatif(bit);
    const diger = s.gelirler.filter((x) => x.tarih > bit - GUN && x.tarih <= bit).reduce((a, x) => a + x.tutar, 0);
    veri.push(Math.max(0, Math.round((k - onceki + diger) * 100) / 100));
    etiketler.push(fmt.format(new Date(bit)));
    onceki = k;
  }
  return { veri, etiketler };
}

interface EarnVeri {
  sahip: string | null;
  katilimlar: string[];
  gonderiler: Gonderi[];
  hesaplar: BagliHesap[];
  kimlik: Kimlik | null;
  odemeYontemleri: OdemeYontemi[];
  cekimler: Cekim[];
  gelirler: Gelir[];
  davetKodu: string;
  kuponKodu: string;
  davetliler: Davetli[];
  destek: DestekTalep[];
  karsilamaKapali: boolean;
  /** Bildirimi gönderilmiş olay anahtarları (tekrar bildirilmesin). */
  bildirilen: string[];
}

interface EarnState extends EarnVeri {
  sahipAyarla: (email: string, ad: string) => void;
  katil: (kampanyaId: string) => void;
  gonder: (g: { kampanyaId: string; platform: Platform; link: string; uretimId?: string; uretimGorsel?: string; kontrol?: GonderiKontrol }) => string;
  istatistikYaz: (id: string, goruntulenme: number) => void;
  itirazEt: (id: string) => void;
  hesapEkle: (platform: Platform, kadi: string) => void;
  hesapGuncelle: (platform: Platform, patch: Partial<BagliHesap>) => void;
  hesapKaldir: (platform: Platform) => void;
  kimlikKaydet: (k: Kimlik) => void;
  yontemEkle: (y: Omit<OdemeYontemi, "id">) => void;
  yontemSil: (id: string) => void;
  cekimEkle: (c: Omit<Cekim, "id" | "tarih">) => string;
  cekimGuncelle: (id: string, patch: Partial<Cekim>) => void;
  kuponDegistir: (kod: string) => void;
  destekEkle: (konu: string, mesaj: string) => string;
  destekGuncelle: (id: string, durum: DestekTalep["durum"]) => void;
  karsilamaKapat: () => void;
  bildirildi: (anahtar: string) => void;
}

let sayac = 0;
const yeniId = (p: string) => `${p}_${Date.now().toString(36)}_${(sayac += 1)}`;
function kod(on: string) { return `${on}-${Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("")}`; }

const bos = (): EarnVeri => ({
  sahip: null, katilimlar: [], gonderiler: [], hesaplar: [], kimlik: null, odemeYontemleri: [], cekimler: [],
  gelirler: [], davetKodu: "", kuponKodu: "", davetliler: [], destek: [], karsilamaKapali: false, bildirilen: [],
});

export const useEarn = create<EarnState>()(
  persist(
    (set, get) => ({
      ...bos(),

      sahipAyarla: (email, ad) => {
        if (get().sahip === email) return;
        const k = kodUret(ad || email.split("@")[0]);
        set({ ...bos(), sahip: email, davetKodu: k, kuponKodu: `${k.toUpperCase().slice(0, 8)}15` });
      },
      katil: (id) => set((s) => (s.katilimlar.includes(id) ? s : { katilimlar: [...s.katilimlar, id] })),
      gonder: ({ kampanyaId, platform, link, uretimId, uretimGorsel, kontrol }) => {
        const id = yeniId("go");
        const takipci = get().hesaplar.find((h) => h.platform === platform)?.takipci ?? 1000;
        // Tahmini hedef: takipçinin 0,4–2,4 katı (bağlantıdan türeyen sabit tohum).
        const hedef = Math.max(500, Math.round(takipci * (0.4 + (hash(link) % 200) / 100)));
        set((s) => ({ gonderiler: [{ id, kampanyaId, platform, link, tarih: Date.now(), hedef, uretimId, uretimGorsel, kontrol }, ...s.gonderiler] }));
        return id;
      },
      istatistikYaz: (id, goruntulenme) => set((s) => ({ gonderiler: s.gonderiler.map((g) => (g.id === id ? { ...g, istatistik: { goruntulenme, zaman: Date.now() } } : g)) })),
      itirazEt: (id) => set((s) => ({ gonderiler: s.gonderiler.map((g) => (g.id === id && !g.itiraz ? { ...g, itiraz: "inceleniyor" } : g)) })),

      hesapEkle: (platform, kadi) => set((s) => ({
        hesaplar: [...s.hesaplar.filter((h) => h.platform !== platform),
          { platform, kadi: kadi.replace(/^@/, "").trim().toLowerCase(), kod: kod("VYR"), durum: "bekliyor", takipci: 0, tarih: Date.now() }],
      })),
      hesapGuncelle: (platform, patch) => set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.platform === platform ? { ...h, ...patch } : h)) })),
      hesapKaldir: (platform) => set((s) => ({ hesaplar: s.hesaplar.filter((h) => h.platform !== platform) })),

      kimlikKaydet: (k) => set({ kimlik: k }),
      yontemEkle: (y) => set((s) => ({ odemeYontemleri: [...s.odemeYontemleri, { ...y, id: yeniId("oy") }] })),
      yontemSil: (id) => set((s) => ({ odemeYontemleri: s.odemeYontemleri.filter((y) => y.id !== id) })),
      cekimEkle: (c) => {
        const id = yeniId("ck");
        set((s) => ({ cekimler: [{ ...c, id, tarih: Date.now() }, ...s.cekimler] }));
        return id;
      },
      cekimGuncelle: (id, patch) => set((s) => ({ cekimler: s.cekimler.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      kuponDegistir: (k) => set({ kuponKodu: k.toLocaleUpperCase("tr-TR").replace(/[^A-Z0-9]/g, "").slice(0, 12) }),
      destekEkle: (konu, mesaj) => {
        const id = yeniId("ds");
        set((s) => ({ destek: [{ id, konu, mesaj, durum: "gonderiliyor", tarih: Date.now() }, ...s.destek] }));
        return id;
      },
      destekGuncelle: (id, durum) => set((s) => ({ destek: s.destek.map((d) => (d.id === id ? { ...d, durum } : d)) })),
      karsilamaKapat: () => set({ karsilamaKapali: true }),
      bildirildi: (a) => set((s) => (s.bildirilen.includes(a) ? s : { bildirilen: [...s.bildirilen.slice(-300), a] })),
    }),
    {
      name: "vayra-earn",
      version: 3,
      // v2 → v3: örnek (demo) veriler kaldırıldı; hesap bazlı, boş başlangıç.
      migrate: () => bos() as EarnState,
    },
  ),
);

export type { Kampanya };
