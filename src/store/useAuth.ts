"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PLAN_KREDI } from "@/lib/fiyat";
import * as H from "@/lib/hesap/istemci";
import type { BenYaniti, HesapOzeti, KrediOzeti, SunucuDurumu } from "@/lib/hesap/tipler";
import { toast } from "@/lib/toast";

/**
 * Oturum ve profil deposu. Kaynak sunucu (/api/hesap/*): uygulama açılınca /api/hesap/ben ile eşitlenir,
 * giriş, kayıt ve çıkış API'ye gider, profil değişiklikleri sunucuya yazılır. Bu depo yalnız önbellektir.
 *
 * Kredi: krediDus iyimser düşer ve sunucu defterine bir işlem anahtarıyla bildirir (aynı harcama iki kez düşülmez).
 * Sunucu reddederse ekrandaki bakiye sunucununkine döner. İşlemler tek sırada gider; sayfa yenilense de
 * gönderilmemiş işlemler yerel kuyruktan sürer. krediEkle önce yakın zamandaki aynı tutarlı harcamanın iadesi
 * sayılır; değilse yükleme olarak gider (ödeme altyapısı yoksa sunucu reddeder ve kredi geri alınır).
 *
 * Krediyi kendisi kesen rotalar (/api/uretim, /api/muzik, /api/upscale, /api/ses, /api/karakter …) için krediDus
 * kullanılmaz: krediAyir ekranda iyimser düşer ama sunucuya bildirmez, yanıt gelince krediBirak bakiyeyi sunucunun
 * bildirdiğine eşitler (çift düşme olmaz). İstemci yardımcısı: lib/krediIstek.
 *
 * Eski sürümlerin tarayıcıda tuttuğu profiller (şifresiz) sunucu hesabına taşınamaz: üretimde bir kez giriş
 * sayfasına yönlendirilir; geliştirmede yerel profil olarak çalışmayı sürdürür (yerel: true).
 */

export interface Kullanici {
  ad: string;
  email: string;
  plan: "baslangic" | "arti" | "ultra" | "kurumsal";
  krediler: number;
  /** Bu dönemde plan kotasının üstüne eklenen kredi (devreden + satın alınan): halka paydasına eklenir (M10). */
  ekKredi?: number;
  avatar?: string;
  // Profil alanları (Higgsfield Edit profile karşılığı)
  slogan?: string; // headline
  bio?: string;
  konum?: string;
  sosyal?: { x?: string; instagram?: string; youtube?: string; tiktok?: string };
  /** Profil kapak görseli (sunucudaki adres ya da yüklenirken data URL). */
  kapak?: string;
  /** @kullanıcı adı — profil bağlantısında ve toplulukta görünür. */
  kullaniciAdi?: string;
  website?: string;
  /** Davet bağlantısıyla geldiyse davet edenin kodu ve ilk ödeme indiriminin durumu. */
  davetEden?: string;
  davetIndirimi?: "bekliyor" | "kullanildi";
}

type Ben = Omit<BenYaniti, "ok">;

interface AuthState {
  kullanici: Kullanici | null;
  girisYapildi: boolean;
  /** Şifre verilirse sunucuda giriş yapar; verilmezse yalnız sunucuyla eşitler. Giriş yapıldıysa true. */
  girisYap: (email: string, ad?: string, sifre?: string) => Promise<boolean>;
  /** Şifreyle sunucuda hesap açar. Hesap açıldıysa true. */
  kayitOl: (ad: string, email: string, sifre?: string) => Promise<boolean>;
  /** Sunucudaki oturumu kapatır ve bu cihazdaki hesap önbelleğini temizler. */
  cikisYap: () => void;
  /** Eski sürüm uyumluluğu: profiller artık sunucuda, burası hep boş. */
  profiller: Record<string, Kullanici>;
  /** Yerel durumu temizler. Sunucudaki silme /api/hesap/sil ile (şifre ve onayla) yapılır. */
  hesapSil: () => void;
  /** Yeni adrese onay bağlantısı ister; değişiklik bağlantı onaylanınca uygulanır. */
  epostaDegistir: (yeni: string) => void;
  krediDus: (miktar: number) => boolean;
  krediEkle: (miktar: number) => void;
  /** Satın alınan paket — hem bakiyeyi hem kotayı (halka paydası) artırır. */
  ekKrediEkle: (miktar: number) => void;
  /**
   * Yalnız yerel düş (sunucu kendisi kesen rotalar için): bakiye ekranda hemen azalır, sunucuya harcama
   * bildirilmez. Bakiye yetmezse null döner. Dönen jeton iş bitince krediBirak'a verilir.
   */
  krediAyir: (miktar: number) => string | null;
  /** Ayrılan krediyi bırakır: sunucu bakiyesi verilirse ekrandaki bakiye ona eşitlenir, verilmezse ayrılan kredi geri eklenir. */
  krediBirak: (jeton: string | null, sunucuBakiyesi?: number) => void;
  /** Sunucu yanıtındaki bakiyeyi uygular (gönderilmemiş kuyruk ve süren ayırmalar hesaba katılır). */
  krediEsitle: (bakiye: number) => void;
  profilGuncelle: (patch: Partial<Kullanici>) => void;

  /** Sunucu hesabının güvenlik özeti (rol, e-posta doğrulama, iki adım, oturumlar). */
  hesap: HesapOzeti | null;
  /** Sunucunun yetenekleri (e-posta servisi, sosyal girişler, ödeme denemesi). */
  sunucu: SunucuDurumu | null;
  /** Bu sayfa açılışında sunucuyla en az bir kez eşitlendi mi. */
  esitlendi: boolean;
  /** Sunucu oturumu olmayan eski tarayıcı profili (yalnız geliştirmede yaşar). */
  yerel: boolean;
  esitle: () => Promise<"oturum" | "yok" | "hata">;
  benUygula: (b: Ben) => void;
}

const gelistirme = process.env.NODE_ENV !== "production";
const kaynak = () => (typeof location !== "undefined" ? location.pathname.split("/").slice(0, 4).join("/") || "/" : "sunucu");

/* ── Kredi işlem kuyruğu ── */

interface Islem { tur: "harca" | "iade" | "yukle"; delta: number; anahtar: string; hedef?: string; ek?: boolean; kaynak: string; deneme?: number }
const KUYRUK_ANAHTARI = "vayra-kredi-kuyruk";
let kuyruk: Islem[] = [];
let calisiyor = false;
/** Depoya en son kendi yazdığımız bakiye: başka yerden (setState, profilGuncelle) gelen değişiklik bundan anlaşılır. */
let beklenen: number | null = null;
/** Yakın zamandaki harcamalar: krediEkle aynı tutarı iade sayabilsin. */
const harcamalar: { anahtar: string; miktar: number; zaman: number; iade: boolean }[] = [];

function kuyrukKaydet() { try { if (kuyruk.length) localStorage.setItem(KUYRUK_ANAHTARI, JSON.stringify(kuyruk.slice(0, 200))); else localStorage.removeItem(KUYRUK_ANAHTARI); } catch { /* gizli pencere */ } }
function kuyrukYukle() {
  try { const v = JSON.parse(localStorage.getItem(KUYRUK_ANAHTARI) ?? "[]"); if (Array.isArray(v)) kuyruk = v.filter((x) => x && typeof x.anahtar === "string" && typeof x.delta === "number"); } catch { kuyruk = []; }
}
const bekleyenToplam = () => kuyruk.reduce((t, i) => t + i.delta, 0);
/** krediAyir ile ekranda düşülmüş, sunucu yanıtı beklenen tutarlar (jeton → kredi). */
const ayrilan = new Map<string, number>();
let ayirmaSayaci = 0;
const ayrilanToplam = () => { let t = 0; for (const v of ayrilan.values()) t += v; return t; };

function krediYaz(n: number, ek?: Partial<Kullanici>) {
  const k = useAuth.getState().kullanici;
  if (!k) return;
  beklenen = n;
  useAuth.setState({ kullanici: { ...k, ...ek, krediler: n } });
}
const ekKrediOzetten = (o: KrediOzeti) => Math.max(0, o.donemToplam - o.kota);
/** Sunucunun bildirdiği bakiye + henüz işlenmemiş kuyruk. */
function sunucuBakiyesi(o: KrediOzeti | undefined, bakiye?: number) {
  const b = o?.bakiye ?? bakiye;
  if (typeof b !== "number") return;
  krediYaz(Math.max(0, b + bekleyenToplam()), o ? { ekKredi: ekKrediOzetten(o) } : undefined);
}

function kuyrugaEkle(i: Islem) {
  kuyruk.push(i);
  kuyrukKaydet();
  void kuyrukIsle();
}

async function gonder(i: Islem) {
  if (i.tur === "harca") return H.krediHarcaIstek({ miktar: -i.delta, anahtar: i.anahtar, kaynak: i.kaynak });
  if (i.tur === "iade") return H.krediIadeIstek({ anahtar: i.hedef!, kaynak: i.kaynak });
  return H.krediYukleIstek({ miktar: i.delta, anahtar: i.anahtar, kaynak: i.kaynak, aciklama: i.ek ? "Ek kredi paketi" : undefined });
}

async function kuyrukIsle(): Promise<void> {
  if (calisiyor) return;
  const s = useAuth.getState();
  if (!s.hesap || s.yerel) return;
  calisiyor = true;
  try {
    while (kuyruk.length) {
      const i = kuyruk[0];
      const r = await gonder(i);
      if (!r.ok && (r.durum === 0 || r.durum >= 500 || r.durum === 429)) {
        // Ağ ya da sunucu hatası: işlem kuyrukta kalır, aynı anahtarla sonra yeniden denenir (iki kez düşülmez).
        i.deneme = (i.deneme ?? 0) + 1;
        kuyrukKaydet();
        setTimeout(() => void kuyrukIsle(), Math.min(60_000, 2000 * 2 ** Math.min(5, i.deneme)));
        return;
      }
      kuyruk.shift();
      kuyrukKaydet();
      if (r.ok) { sunucuBakiyesi(r.ozet, r.bakiye); continue; }
      if (r.durum === 401) { kuyruk = []; kuyrukKaydet(); void useAuth.getState().esitle(); return; }
      if (typeof r.bakiye === "number") sunucuBakiyesi(undefined, r.bakiye);
      else { const k = useAuth.getState().kullanici; if (k) krediYaz(Math.max(0, k.krediler - i.delta)); }
      if (i.tur === "harca" && r.kod === "yetersiz") toast.error("Sunucudaki kredin bu işleme yetmedi", { description: "Kredi düşülmedi; bakiyen sunucudaki değere döndü." });
      else if (i.tur === "yukle") toast.error("Kredi eklenmedi", { description: r.hata });
    }
  } finally { calisiyor = false; }
}

/* ── Profil yazımı (art arda değişiklikler tek istekte birleşir) ── */

let profilBekleyen: Record<string, unknown> = {};
let profilZaman: ReturnType<typeof setTimeout> | null = null;
function profilGonder(patch: Record<string, unknown>) {
  profilBekleyen = { ...profilBekleyen, ...patch };
  if (profilZaman) clearTimeout(profilZaman);
  profilZaman = setTimeout(async () => {
    const p = profilBekleyen;
    profilBekleyen = {}; profilZaman = null;
    const r = await H.profilYaz(p);
    const k = useAuth.getState().kullanici;
    if (r.ok && k) {
      const { krediler, ekKredi, ...profil } = r.kullanici;
      // Yalnız bu istekte gönderilen alanlar sunucunun değeriyle yerine yazılır (avatar data URL yerine kısa adres gibi).
      const yeni: Partial<Kullanici> = {};
      for (const a of Object.keys(p) as (keyof typeof profil)[]) (yeni as Record<string, unknown>)[a] = profil[a];
      useAuth.setState({ kullanici: { ...k, ...yeni } });
      // Plan değişince sunucu yeni dönemi başlatır: bakiye ve halka paydası sunucudan gelir.
      if ("plan" in p) krediYaz(Math.max(0, krediler + bekleyenToplam()), { ekKredi });
      return;
    }
    if (!r.ok) {
      toast.error("Profil kaydedilemedi", { description: r.hata });
      void useAuth.getState().esitle();
    }
  }, 350);
}

/* ── Hesap ayarları sayfalarının okuduğu yerel kayıtla eşleme ── */

async function aynala(h: HesapOzeti) {
  try {
    const { useHesap } = await import("./useHesap");
    useHesap.setState((s) => {
      const hesaplar = { ...s.hesaplar };
      // Eski sürümlerin tarayıcıda tuttuğu şifre özetleri ve iki adım sırları artık kullanılmıyor: temizlenir.
      for (const [e, x] of Object.entries(hesaplar)) if (x.sifre?.hash || x.ikiAdim?.sir) hesaplar[e] = { ...x, ...(x.sifre ? { sifre: { hash: "", tuz: "", guncelleme: x.sifre.guncelleme } } : {}), ...(x.ikiAdim ? { ikiAdim: { ...x.ikiAdim, sir: "" } } : {}) };
      return { hesaplar };
    });
    useHesap.getState().guncelle(h.email, (x) => ({
      ...x,
      olusturma: h.olusturma,
      sifre: h.sifreVar ? { hash: "", tuz: "", guncelleme: h.sifreGuncelleme ?? h.olusturma } : undefined,
      ikiAdim: h.ikiAdim.aktif ? { sir: "", aktif: true, acilis: h.ikiAdim.acilis, yedekler: h.ikiAdim.yedekDurum.map((k, i) => ({ kod: `sunucu-${i + 1}`, kullanildi: k ? 1 : null })) } : undefined,
      saglayici: h.saglayicilar[0],
      oturumlar: h.oturumlar.map((o) => ({ id: o.id, tarayici: o.tarayici, isletim: o.isletim, tur: o.tur, baslangic: o.baslangic, sonGorulme: o.sonGorulme })),
    }));
    localStorage.setItem("vayra-oturum", h.oturumId);
  } catch { /* depolama yok */ }
}

function yerelTemizle(buildAnahtariniSil = true) {
  kuyruk = []; kuyrukKaydet();
  harcamalar.length = 0;
  beklenen = null;
  profilBekleyen = {};
  if (profilZaman) { clearTimeout(profilZaman); profilZaman = null; }
  try {
    // Build sahip anahtarı hesapta duruyor; cihazdaki kopyası çıkışta silinir (oturumsuz erişim kalmasın).
    if (buildAnahtariniSil) localStorage.removeItem("vayra-build-sahip");
    localStorage.removeItem("vayra-oturum");
  } catch { /* yok */ }
}

/** Sunucu oturumu olmayan eski profil. */
function eskiProfil() {
  const isaret = "vayra-hesap-gecis";
  let gosterildi = false;
  try { gosterildi = !!localStorage.getItem(isaret); localStorage.setItem(isaret, "1"); } catch { /* yok */ }
  if (gelistirme) {
    if (!gosterildi && !navigator.webdriver) {
      toast("Bu tarayıcıdaki profil yerel", {
        description: "Hesaplar artık sunucuda. Bu profil sunucuya bağlı değil; kredi ve ayarların yalnız bu cihazda kalıyor.",
        action: { label: "Giriş yap", onClick: () => location.assign("/giris?gecis=1") },
      });
    }
    return;
  }
  useAuth.setState({ kullanici: null, girisYapildi: false, hesap: null, yerel: false });
  // Build anahtarı kalır: giriş yapınca hesap onu benimser, bu cihazdaki eski projeler kaybolmaz.
  yerelTemizle(false);
  if (!gosterildi && !/^\/(giris|kayit|sifirla|dogrula)/.test(location.pathname)) {
    location.assign(`/giris?gecis=1&geri=${encodeURIComponent(location.pathname + location.search)}`);
  }
}

let esitleniyor: Promise<"oturum" | "yok" | "hata"> | null = null;
/** Çıkış isteği sürerken eşitleme beklenir: sunucu oturumu kapanmadan eski oturum geri gelmesin. */
let cikisSozu: Promise<unknown> | null = null;

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      kullanici: null,
      girisYapildi: false,
      profiller: {},
      hesap: null,
      sunucu: null,
      esitlendi: false,
      yerel: false,

      benUygula: (b) => {
        const onceki = get().hesap;
        if (onceki && onceki.uid !== b.hesap.uid) { kuyruk = []; kuyrukKaydet(); harcamalar.length = 0; }
        const krediler = Math.max(0, b.kullanici.krediler + bekleyenToplam());
        beklenen = krediler;
        set({ kullanici: { ...b.kullanici, krediler }, girisYapildi: true, hesap: b.hesap, sunucu: b.sunucu, yerel: false, esitlendi: true });
        void aynala(b.hesap);
        void kuyrukIsle();
        // Etkin çalışma alanı: krediler bu durumda alandaki kullanılabilir kredidir (alan seçici bunu gösterir).
        void import("./useAlan").then((m) => m.useAlan.getState().benAlan(b.alan ?? null)).catch(() => {});
      },

      esitle: () => (esitleniyor ??= (async () => {
        try {
          if (cikisSozu) await cikisSozu;
          const r = await H.benGetir();
          if (r.ok) { get().benUygula(r); return "oturum" as const; }
          if (r.durum !== 401) { set({ esitlendi: true }); return "hata" as const; }
          const s = get();
          set({ esitlendi: true, ...(r.sunucu ? { sunucu: r.sunucu } : {}) });
          if (s.kullanici && s.yerel) { eskiProfil(); return "yok" as const; }
          if (s.kullanici && s.hesap) {
            yerelTemizle();
            set({ kullanici: null, girisYapildi: false, hesap: null });
            if (!/^\/(giris|kayit|sifirla|dogrula)/.test(location.pathname)) toast("Oturumun kapandı", { description: "Güvenliğin için yeniden giriş yap.", action: { label: "Giriş yap", onClick: () => location.assign(`/giris?geri=${encodeURIComponent(location.pathname)}`) } });
          } else if (s.kullanici) set({ kullanici: null, girisYapildi: false });
          return "yok" as const;
        } finally { esitleniyor = null; }
      })()),

      girisYap: async (email, _ad, sifre) => {
        if (!sifre) return (await get().esitle()) === "oturum";
        const r = await H.girisIstek(email, sifre);
        if (r.ok && !("bekleyen" in r)) { get().benUygula(r); return true; }
        return false;
      },
      kayitOl: async (ad, email, sifre) => {
        if (!sifre) return false;
        const r = await H.kayitIstek(ad, email, sifre);
        if (r.ok) { get().benUygula(r); return true; }
        return false;
      },
      cikisYap: () => {
        if (get().hesap) cikisSozu = H.cikisIstek().finally(() => { cikisSozu = null; });
        yerelTemizle();
        set({ kullanici: null, girisYapildi: false, hesap: null, yerel: false });
        void import("./useAlan").then((m) => m.useAlan.getState().temizle()).catch(() => {});
      },
      hesapSil: () => {
        yerelTemizle();
        set({ kullanici: null, girisYapildi: false, hesap: null, yerel: false });
      },
      epostaDegistir: (yeni) => {
        void H.epostaDegistirIste(yeni).then((r) => {
          if (r.ok) toast.success("Onay bağlantısı istendi", { description: `${yeni} adresine gelen bağlantıyı onaylayınca e-postan değişir.` });
          else toast.error("E-posta değiştirilemedi", { description: r.hata });
        });
      },

      krediDus: (miktar) => {
        const k = get().kullanici;
        if (!k || k.krediler < miktar) return false;
        if (!(miktar > 0)) return true;
        const m = Math.ceil(miktar);
        const yeni = k.krediler - m;
        beklenen = yeni;
        set({ kullanici: { ...k, krediler: yeni } });
        if (get().hesap && !get().yerel) {
          const anahtar = H.islemAnahtari("h");
          harcamalar.unshift({ anahtar, miktar: m, zaman: Date.now(), iade: false });
          harcamalar.length = Math.min(harcamalar.length, 100);
          kuyrugaEkle({ tur: "harca", delta: -m, anahtar, kaynak: kaynak() });
        }
        return true;
      },
      krediEkle: (miktar) => {
        const k = get().kullanici;
        if (!k || !(miktar > 0)) return;
        const m = Math.ceil(miktar);
        beklenen = k.krediler + m;
        set({ kullanici: { ...k, krediler: k.krediler + m } });
        if (get().hesap && !get().yerel) sunucuyaEkle(m, false);
      },
      ekKrediEkle: (miktar) => {
        const k = get().kullanici;
        if (!k || !(miktar > 0)) return;
        const m = Math.ceil(miktar);
        beklenen = k.krediler + m;
        set({ kullanici: { ...k, krediler: k.krediler + m, ekKredi: (k.ekKredi ?? 0) + m } });
        if (get().hesap && !get().yerel) kuyrugaEkle({ tur: "yukle", delta: m, anahtar: H.islemAnahtari("y"), ek: true, kaynak: kaynak() });
      },
      krediAyir: (miktar) => {
        const k = get().kullanici;
        const m = Math.max(0, Math.ceil(Number(miktar) || 0));
        if (!k || k.krediler < m) return null;
        const jeton = `ay${++ayirmaSayaci}`;
        if (!m) return jeton;
        ayrilan.set(jeton, m);
        krediYaz(k.krediler - m);
        return jeton;
      },
      krediBirak: (jeton, sunucuBakiyesi) => {
        const m = (jeton && ayrilan.get(jeton)) || 0;
        if (jeton) ayrilan.delete(jeton);
        const k = get().kullanici;
        if (!k) return;
        if (typeof sunucuBakiyesi === "number" && Number.isFinite(sunucuBakiyesi)) krediYaz(Math.max(0, sunucuBakiyesi + bekleyenToplam() - ayrilanToplam()));
        else if (m) krediYaz(k.krediler + m);
      },
      krediEsitle: (bakiye) => {
        if (!get().kullanici || typeof bakiye !== "number" || !Number.isFinite(bakiye)) return;
        krediYaz(Math.max(0, bakiye + bekleyenToplam() - ayrilanToplam()));
      },
      profilGuncelle: (patch) => {
        const k = get().kullanici;
        if (!k) return;
        set({ kullanici: { ...k, ...patch } });
        const { krediler: _k, ekKredi: _e, email: _m, ...profil } = patch; void _k; void _e; void _m;
        if (get().hesap && !get().yerel && Object.keys(profil).length) profilGonder(profil);
      },
    }),
    {
      name: "vayra-auth",
      version: 1,
      partialize: (s) => ({ kullanici: s.kullanici, girisYapildi: s.girisYapildi, hesap: s.hesap, yerel: s.yerel }),
      migrate: (eski, surum) => {
        const d = (eski ?? {}) as { kullanici?: Kullanici | null; girisYapildi?: boolean; hesap?: HesapOzeti | null; yerel?: boolean };
        // 0: tarayıcıda tutulan eski profil; sunucu oturumu yok.
        if (surum < 1) return { kullanici: d.kullanici ?? null, girisYapildi: !!d.kullanici && d.girisYapildi !== false, hesap: null, yerel: !!d.kullanici } as unknown as AuthState;
        return d as unknown as AuthState;
      },
    },
  ),
);

/** Ekleme: yakın zamanda aynı tutarda iade edilmemiş harcama varsa onun iadesi; yoksa yükleme. */
function sunucuyaEkle(m: number, ek: boolean) {
  const h = harcamalar.find((x) => !x.iade && x.miktar === m && Date.now() - x.zaman < 2 * 3_600_000);
  if (h) { h.iade = true; kuyrugaEkle({ tur: "iade", delta: m, anahtar: H.islemAnahtari("i"), hedef: h.anahtar, kaynak: kaynak() }); return; }
  kuyrugaEkle({ tur: "yukle", delta: m, anahtar: H.islemAnahtari("y"), ek, kaynak: kaynak() });
}

/* Başka yerden gelen bakiye değişikliği (useAuth.setState, profilGuncelle({ krediler })) da sunucuya bildirilir. */
useAuth.subscribe((s, p) => {
  const k = s.kullanici;
  if (!k || !p.kullanici || k.email !== p.kullanici.email || beklenen === null) { beklenen = k?.krediler ?? null; return; }
  if (k.krediler === beklenen) return;
  const fark = k.krediler - beklenen;
  beklenen = k.krediler;
  if (!s.hesap || s.yerel || !Number.isFinite(fark)) return;
  if (fark < 0) {
    const anahtar = H.islemAnahtari("h");
    harcamalar.unshift({ anahtar, miktar: -fark, zaman: Date.now(), iade: false });
    kuyrugaEkle({ tur: "harca", delta: fark, anahtar, kaynak: kaynak() });
  } else sunucuyaEkle(Math.round(fark), false);
});

/* Açılışta ve sekmeye dönüldüğünde sunucuyla eşitle; bağlantı gelince bekleyen kredi işlemlerini gönder. */
if (typeof window !== "undefined") {
  const w = window as unknown as { __vayraAuthDinleyici?: boolean };
  kuyrukYukle();
  setTimeout(() => void useAuth.getState().esitle(), 0);
  if (!w.__vayraAuthDinleyici) {
    w.__vayraAuthDinleyici = true;
    let son = Date.now();
    const tazele = () => {
      if (document.visibilityState !== "visible" || Date.now() - son < 60_000) return;
      son = Date.now();
      void useAuth.getState().esitle();
    };
    window.addEventListener("focus", tazele);
    document.addEventListener("visibilitychange", tazele);
    window.addEventListener("online", () => void kuyrukIsle());
  }
}

/** Plan başına AYLIK kredi kotası — tek kaynak: lib/fiyat. */
export const PLAN_AYLIK_KREDI: Record<Kullanici["plan"], number> = PLAN_KREDI;

export const PLAN_ADI: Record<Kullanici["plan"], string> = {
  baslangic: "Başlangıç",
  arti: "Artı",
  ultra: "Ultra",
  kurumsal: "Kurumsal",
};

/**
 * Kredi doluluk oranı ve rengi (M10 — avatar halkası).
 * Payda = planın aylık kotası + bu dönem eklenen (devreden ve satın alınan) kredi.
 * Renk eşiği: yüzde 80 üstü yeşil, yüzde 50 üstü sarı, yüzde 30 üstü turuncu, altı kırmızı.
 */
export function krediDurum(k: Kullanici | null): {
  oran: number; renk: string; toplam: number; kalan: number; etiket: string;
} {
  if (!k) return { oran: 0, renk: "#ef4444", toplam: 0, kalan: 0, etiket: "Kredi yok" };
  const taban = PLAN_AYLIK_KREDI[k.plan] ?? 300;
  const toplam = Math.max(1, taban + (k.ekKredi ?? 0));
  const kalan = Math.max(0, k.krediler);
  const oran = Math.max(0, Math.min(1, kalan / toplam));
  const renk =
    oran > 0.8 ? "#4ade80"      // yeşil
      : oran > 0.5 ? "#facc15"  // sarı
        : oran > 0.3 ? "#fb923c" // turuncu
          : "#ef4444";           // kırmızı
  const etiket =
    oran > 0.8 ? "Kredin bol"
      : oran > 0.5 ? "Kredin yeterli"
        : oran > 0.3 ? "Kredin azalıyor"
          : "Kredin kritik";
  return { oran, renk, toplam, kalan, etiket };
}
