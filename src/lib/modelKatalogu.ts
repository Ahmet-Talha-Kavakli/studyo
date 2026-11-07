/* /modeller kataloğu — stüdyoların GERÇEKTE sunduğu modellerden türetilir.
   Kredi, çözünürlük, süre ve oran değerleri stüdyonun kullandığı kaynaklardan gelir
   (videoModelVeri, gorselModelVeri, sesVeri, useMuzik, catalog-3D); burada elle sayı yazılmaz. */
import { MODEL_AILELERI, videoKrediHesap, videoModelOzellik } from "@/lib/videoModelVeri";
import { videoErisim } from "@/lib/videoSaglayici";
import { GORSEL_MODELLER, GORSEL_ORANLAR } from "@/lib/gorselModelVeri";
import { SES_URETIM_MODELLERI } from "@/lib/sesVeri";
import { MUZIK_MODELLERI, muzikKredi } from "@/lib/muzikVeri";
import { MODELLER as API_MODELLERI } from "@/lib/catalog";
import { modelBul as specBul } from "@/lib/videoModelSpec";
const KATALOG_3D = API_MODELLERI;

export type KatalogTur = "video" | "gorsel" | "ses" | "muzik" | "3d";

export interface KatalogModel {
  slug: string;
  ad: string;
  aile: string;
  saglayici: string;
  /** 3D gibi Vayra katmanı olan modellerde altyapı. */
  altyapi?: string;
  tur: KatalogTur;
  ozet: string;
  /** Üretim başına en düşük kredi (sıralama/karşılaştırma için). */
  kredi: number;
  /** Kullanıcıya gösterilen bedel: "42 kredi / video", "2–7 kredi / şarkı". */
  bedel: string;
  rozet?: string;
  /** Stüdyonun "Öne çıkan" listesinde mi. */
  oneCikan?: boolean;
  /** Ayrıntı panelindeki teknik satırlar (yalnız stüdyonun gerçekten sunduğu). */
  ozellikler: { ad: string; deger: string }[];
  etiketler: string[];
  /** Bu modelle üretmek için stüdyo adresi (model seçili açılır). */
  href: string;
  /** Bu model ailesiyle üretilmiş örnek görsel. */
  kapak?: string;
  /** REST API'de de sunuluyorsa API kimliği ve API bedeli. */
  api?: { id: string; kredi: number };
}

export const TUR_AD: Record<KatalogTur, string> = { video: "Video", gorsel: "Görsel", ses: "Ses", muzik: "Müzik", "3d": "3D" };
const TUR_BIRIM: Record<KatalogTur, string> = { video: "video", gorsel: "görsel", ses: "seslendirme", muzik: "şarkı", "3d": "model" };

export const slugla = (s: string) =>
  s.toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c]!).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Model adından sağlayıcı (geliştiren şirket). */
export function saglayiciBul(ad: string): string {
  const a = ad.toLowerCase();
  if (/kling/.test(a)) return "Kuaishou";
  if (/sora|gpt image/.test(a)) return "OpenAI";
  if (/veo|gemini|nano banana|lyria/.test(a)) return "Google";
  if (/seedance|seedream|seed (audio|speech)/.test(a)) return "ByteDance";
  if (/\bwan\b|z-image/.test(a)) return "Alibaba";
  if (/grok/.test(a)) return "xAI";
  if (/hailuo|minimax/.test(a)) return "MiniMax";
  if (/flux/.test(a)) return "Black Forest Labs";
  if (/recraft/.test(a)) return "Recraft";
  if (/eleven/.test(a)) return "ElevenLabs";
  if (/vibevoice/.test(a)) return "Microsoft";
  if (/happyhorse/.test(a)) return "HappyHorse";
  if (/çoklu referans/.test(a)) return "Vayra";
  return "Vayra";
}

const sureMetni = (s: number[]) => (!s.length ? "Model belirler" : s.length > 1 ? `${s[0]}–${s[s.length - 1]} sn` : `${s[0]} sn`);
const tekrarsiz = <T,>(l: T[]) => [...new Set(l)];

/* ── Video ── */
const GIRDI: Record<string, string> = {
  tek: "Metin, isteğe bağlı başlangıç görseli",
  kareler: "Metin, başlangıç ve bitiş karesi",
  edit: "Düzenlenecek video",
  hareket: "Hareket videosu + karakter görseli",
};
function videolar(): KatalogModel[] {
  const gorulen = new Map<string, KatalogModel>();
  // "tum" aileleri önce: aile adı ve özeti en doğru oradadır; "one" yalnız öne çıkan işaretini ekler.
  const aileler = [...MODEL_AILELERI.filter((a) => a.grup === "tum"), ...MODEL_AILELERI.filter((a) => a.grup === "one")];
  for (const aile of aileler) {
    for (const v of aile.varyantlar) {
      const var_ = gorulen.get(v.ad);
      if (var_) { if (aile.grup === "one" && videoErisim(v.ad).durum === "gercek") var_.oneCikan = true; continue; }
      const oz = videoModelOzellik(v.ad);
      const sp = specBul(v.ad);
      const kredi = videoKrediHesap(v.ad);
      const sesli = !!(v.ses || oz.sesToggle || sp?.cipler.includes("ses"));
      const kutu = sp?.kutular.includes("bitis") ? "kareler" : sp?.kutular.includes("videoRef") ? "medya" : oz.kutu;
      const girdi = kutu === "medya" && sp?.kutular.includes("videoRef") && oz.kutu !== "medya" ? "Metin, video referansı" : oz.kutu === "medya" ? `Metin, ${(oz.medyaTipi ?? "medya").toLocaleLowerCase("tr-TR")} referansı${oz.medyaSayisi ? ` (en fazla ${oz.medyaSayisi})` : ""}` : GIRDI[kutu] ?? GIRDI.tek;
      const ozellikler = [
        { ad: "Çözünürlük", deger: oz.cozGizli ? oz.coz : tekrarsiz(oz.cozler).join(", ") },
        { ad: "Süre", deger: sureMetni(oz.sureler) },
        { ad: "En-boy oranı", deger: oz.oranGizli || !oz.oranlar.length ? "Girdiye göre otomatik" : oz.oranlar.map((o) => (o === "Auto" ? "Otomatik" : o)).join(", ") },
        { ad: "Ses", deger: sesli ? "Sesli üretim" : "Sessiz" },
        { ad: "Girdi", deger: girdi },
      ];
      if (oz.cokCekim) ozellikler.push({ ad: "Çok çekim", deger: "Var" });
      if (oz.not) ozellikler.push({ ad: "Not", deger: oz.not });
      const etiketler = [
        oz.cozler.includes("4K") ? "4K" : oz.cozler.includes("1080p") ? "1080p" : oz.coz,
        sureMetni(oz.sureler),
        ...(sesli ? ["Sesli"] : []),
        ...(oz.cokCekim ? ["Çok çekim"] : []),
        ...(oz.kutu === "edit" ? ["Düzenleme"] : oz.kutu === "hareket" ? ["Hareket aktarımı"] : []),
      ];
      gorulen.set(v.ad, {
        slug: slugla(v.ad), ad: v.ad, aile: aile.ad.trim(), saglayici: saglayiciBul(v.ad), tur: "video",
        ozet: aile.ozet, kredi, bedel: `${kredi} kredi / video`,
        rozet: (() => { const e = videoErisim(v.ad); return e.durum === "kapandi" ? "Kapandı" : e.durum === "yakinda" ? "Bağlı değil" : v.rozet; })(),
        oneCikan: aile.grup === "one" && videoErisim(v.ad).durum === "gercek",
        ozellikler, etiketler, href: `/panel/video?model=${encodeURIComponent(v.ad)}`,
      });
    }
  }
  return [...gorulen.values()];
}

/* ── Görsel ── */
const GORSEL_TIP: Record<string, string> = {
  swap: "Yüz / karakter değiştirme (iki görsel)", kontext: "Görsel düzenleme ve referans", flux: "Metinden görsel, gelişmiş CFG ayarı",
  recraft: "Metinden görsel, vektör kipi", vary: "Metin ve çizimle yönlendirme",
};
/** Görsel model ailesi — stüdyo seçicisindeki aile adlarıyla aynı. */
function gorselAile(ad: string): string {
  const aileler: [RegExp, string][] = [
    [/nano banana/i, "Nano Banana"], [/seedream/i, "Seedream"], [/gpt image/i, "GPT Image"], [/flux/i, "FLUX"], [/recraft/i, "Recraft"],
    [/grok/i, "Grok Imagine"], [/kling/i, "Kling"], [/z-image/i, "Z-Image"], [/wan/i, "Wan"],
  ];
  return aileler.find(([d]) => d.test(ad))?.[1] ?? "Vayra";
}

function gorseller(): KatalogModel[] {
  return GORSEL_MODELLER.filter((m) => m.ad !== "Auto").map((m) => {
    const kredi = m.kredi ?? 2;
    // Değerler modelin gerçek sağlayıcı yeteneklerinden gelir (gorselModelVeri.api).
    const a = m.api;
    const ozellikler = [
      ...(a.cozunurluklar.length ? [{ ad: "Çözünürlük", deger: a.cozunurluklar.join(", ") }] : []),
      ...(m.kaliteSeviye ? [{ ad: "Kalite", deger: m.kaliteSeviye.join(" / ") }] : []),
      ...(a.oranlar.length ? [{ ad: "En-boy oranı", deger: GORSEL_ORANLAR.filter((o) => a.oranlar.includes(o.deger)).map((o) => o.deger).join(", ") }] : []),
      { ad: "Adet", deger: m.adetGizli ? "Tek görsel" : "Üretim başına 1–8 görsel (bedel adetle çarpılır)" },
      { ad: "Girdi", deger: GORSEL_TIP[m.tip ?? ""] ?? (a.refMax ? `Metin + en fazla ${a.refMax} referans görsel` : "Yalnız metin") },
      ...(m.temel ? [{ ad: "Temel model", deger: m.temel }] : []),
      ...(a.tohum ? [{ ad: "Tohum", deger: "Destekler (tekrarlanabilir sonuç)" }] : []),
      ...(a.seffaf ? [{ ad: "Şeffaf arka plan", deger: "Destekler (PNG)" }] : []),
    ];
    if (m.soul) ozellikler.push({ ad: "Karakter", deger: "Kayıtlı karakterle kimlik tutarlılığı" });
    if (m.sinirsizToggle) ozellikler.push({ ad: "Sınırsız", deger: "Sınırsız erişim ekiyle kredi harcamadan" });
    const etiketler = [
      ...(m.api.cozunurluklar.length ? [`${m.api.cozunurluklar[m.api.cozunurluklar.length - 1]}'ya kadar`] : m.kaliteSeviye ? [m.kaliteSeviye[m.kaliteSeviye.length - 1] + " kalite"] : []),
      ...(m.tip === "swap" ? ["Yüz değiştirme"] : m.tip === "kontext" ? ["Düzenleme"] : m.tip === "recraft" ? ["Vektör"] : m.tip === "vary" ? ["Çizim"] : []),
      ...(m.soul ? ["Karakter"] : []),
      ...(m.rozet === "Sınırsız" ? ["Sınırsız"] : []),
    ];
    return {
      slug: slugla(m.ad), ad: m.ad, aile: gorselAile(m.ad),
      saglayici: saglayiciBul(m.ad), tur: "gorsel" as const, ozet: m.ozet, kredi,
      bedel: `${kredi.toLocaleString("tr-TR")} kredi / görsel`, rozet: m.rozet === "Yeni" ? "Yeni" : undefined, oneCikan: m.grup === "one",
      ozellikler, etiketler, href: `/panel/gorsel?model=${encodeURIComponent(m.ad)}`,
    };
  });
}

/* ── Ses ── */
function sesler(): KatalogModel[] {
  // Seslendirme metin uzunluğuyla ücretlenir: 1.000 karakter başına 1 kredi (en az 1). Çeviri dk başına 12, ses değiştirme dk başına 1, klonlama 40.
  return SES_URETIM_MODELLERI.map((m, i) => ({
    slug: slugla(m.ad), ad: m.ad, aile: m.ad.split(" ")[0], saglayici: saglayiciBul(m.ad), tur: "ses" as const, ozet: m.ozet,
    kredi: 1, bedel: "1 kredi / 1.000 karakter", oneCikan: i < 2, rozet: !m.saglayici ? "Bağlı değil" : m.rozet,
    ozellikler: [
      { ad: "Girdi", deger: "Metin" },
      { ad: "Tek üretimde", deger: `En fazla ${m.karakterSiniri.toLocaleString("tr-TR")} karakter` },
      { ad: "Ses kütüphanesi", deger: "Hazır sesler ya da kendi klonun" },
      { ad: "Ek işlemler", deger: "Diyalog 1 kredi / 1.000 karakter · ses efekti 2 kredi · ses değiştirme 1 kredi/dk · çeviri 12 kredi/dk · klonlama 40 kredi" },
    ],
    etiketler: ["Seslendirme", ...(m.etiketler ? ["Duygu etiketleri"] : /seed audio/i.test(m.ad) ? ["Çok konuşmacı"] : /vibevoice/i.test(m.ad) ? ["Uzun form"] : /speech 2\.8/i.test(m.ad) ? ["HD"] : /flash/i.test(m.ad) ? ["Düşük gecikme"] : ["Çok dilli"])],
    href: `/panel/ses?model=${encodeURIComponent(m.ad)}`,
  }));
}

/* ── Müzik ── (gerçek sağlayıcı modelleri; muzikVeri ile aynı kaynak) */
function muzikler(): KatalogModel[] {
  return MUZIK_MODELLERI.map((m, i) => {
    const kredi = muzikKredi(m.ad, m.sure.tur === "sabit" ? m.sure.sn : 120);
    return {
      slug: slugla(m.ad), ad: m.ad, aile: m.saglayici === "eleven" ? "Eleven Music" : "Lyria", saglayici: saglayiciBul(m.ad), tur: "muzik" as const, ozet: m.ozet,
      kredi, bedel: m.saglayici === "eleven" ? "2 kredi / 30 sn" : `${kredi} kredi / şarkı`, oneCikan: i === 0, rozet: m.rozet,
      ozellikler: [
        { ad: "Süre", deger: m.sure.tur === "aralik" ? "3 sn – 10 dk" : m.sure.tur === "sabit" ? `${m.sure.sn} sn` : "İstemle yönlendirilir" },
        { ad: "Girdi", deger: m.plan ? "İstem, sözler, stiller ya da bölüm planı" : "İstem, sözler ve stiller" },
        { ad: "Çıktı", deger: m.saglayici === "eleven" ? "MP3/Opus · vokalli ya da enstrümantal · stem ayırma" : "MP3 · vokalli ya da enstrümantal · SynthID" },
      ],
      etiketler: ["Şarkı", "Vokal", ...(m.plan ? ["Bölüm planı"] : []), "Enstrümantal"],
      href: `/panel/muzik?model=${encodeURIComponent(m.ad)}`,
    };
  });
}

/* ── 3D ── */
function ucBoyutlar(): KatalogModel[] {
  return KATALOG_3D.filter((m) => m.tur === "3d").map((m) => ({
    slug: slugla(m.ad), ad: m.ad, aile: "Vayra 3D", saglayici: "Vayra", altyapi: "Meshy", tur: "3d" as const, ozet: m.aciklama,
    kredi: m.kredi, bedel: `${m.kredi} kredi / ${TUR_BIRIM["3d"]}`, rozet: m.rozet === "Yeni" ? "Yeni" : undefined, oneCikan: m.id === "meshy-metin3d",
    ozellikler: [
      { ad: "Girdi", deger: /gorsel/.test(m.id) ? "Tek görsel" : /doku/.test(m.id) ? "Mevcut 3D model + metin" : /animasyon/.test(m.id) ? "3D karakter" : "Metin" },
      { ad: "Çıktı", deger: "GLB / FBX, PBR doku" },
      { ad: "Ek", deger: "Otomatik bölme +10 kredi" },
    ],
    etiketler: m.yetenekler,
    href: "/panel/3d",
  }));
}

/** Aynı adı taşıyan farklı türdeki modeller (ör. Grok Imagine video/görsel) ayrı adres alır. */
/* ── Kapaklar: o model ailesiyle üretilmiş gerçek örnek görseller (Keşfet galerisi) ── */
const K = (ad: string) => `/gercek/kesfet/${ad}.webp`;
const KAPAK_HAVUZU: [RegExp, string[]][] = [
  [/kling/i, ["kling-3-0kuaishou", "futuristik-metrokling-3-0", "samuray-duellosukling-3-0", "karnaval-gecesikling-3-0-turbo", "robot-bahcivankling-3-0", "yagmurlu-tokyo-sokagikling-3-0-turbo", "sci-fi-robot-yuruyusukling-3-0", "kutup-ekspresikling-3-0-turbo"].map(K)],
  [/sora/i, ["sora-2openai", "cyberpunk-sokak-yagmurusora-2", "titan-savasisora-2", "nebula-yolculugusora-2", "golge-avcisisora-2", "zaman-makinesisora-2"].map(K)],
  [/veo|gemini/i, ["veo-3-1google", "deniz-feneri-firtinasiveo-3-1", "neon-sehir-turuveo-3-1", "kristal-magara-kesfiveo-3-1", "antik-tapinak-kesfiveo-3-1", "uzay-istasyonu-yorungesiveo-3-1"].map(K)],
  [/seedance/i, ["seedance-2-0bytedance", "gun-batimi-sahiliseedance-2-0", "isik-festivaliseedance-2-0", "sisli-vadi-safagiseedance-2-0", "volkanik-manzaraseedance-2-0", "seedance-2-0video"].map(K)],
  [/hailuo|minimax/i, [K("minimax-hailuo-2-3minimax"), K("gun-batimi-sahiliwanderer")]],
  [/\bwan\b/i, [K("wan-2-7alibaba"), K("gun-batimi-sahiliwanderer")]],
  [/nano banana/i, ["nano-banana-progoogle", "altin-saat-portresinano-banana-pro", "aurora-gecesinano-banana-pro", "buz-sarayinano-banana-pro", "col-gulunano-banana-pro", "ejder-yuvasinano-banana-pro"].map(K)],
  [/seedream/i, ["seedream-5-0-probytedance", "kozmik-bahceseedream-5-0-pro", "su-alti-kristal-sehriseedream-5-0-pro", "tropik-cennet-adasiseedream-5-0-pro", "vahsi-bati-kasabasiseedream-5-0-pro"].map(K)],
  [/ruh|yüz değiştir|karakter değiştir/i, ["ruh-2-0vayra", "ruh-sinemavayra", "editoryel-moda-serisiruh-2-0", "barok-balo-salonuruh-2-0", "fantastik-orman-perisiruh-sinema", "denizati-kralligiruh-sinema", "mistik-dag-manastiriruh-sinema", "ruya-kapisiruh-2-0", "retro-sinemaskop-ruyasiruh-sinema"].map(K)],
  [/flux/i, [K("flux-2black-forest-labs")]],
  [/gpt image/i, [K("gpt-image-2openai")]],
  [/recraft/i, ["kuantum-laboratuvarirecraft-v4-1", "piksel-kahramanirecraft-v4-1", "steampunk-atolyerecraft-v4-1"].map(K)],
  [/eleven/i, [K("elevenlabs-ttselevenlabs"), K("elevenlabsses")]],
];
const TUR_YEDEK: Record<KatalogTur, string[]> = {
  video: ["/gercek/sinema/ps-hyper.webp", "/gercek/sinema/ps-fpv.webp", "/gercek/sinema/ps-bullet.webp", "/gercek/sinema/ps-glitch.webp", "/gercek/sinema/ps-train.webp"],
  gorsel: ["/gercek/arac/gorsel-ilham-portre.webp", "/gercek/arac/fashion-noir.webp", "/gercek/arac/fashion-sky.webp", "/gercek/arac/gorsel-ilham-manzara.webp"],
  ses: [K("blog-ses"), K("ses-klonuelevenlabs"), K("elevenlabsses")],
  muzik: ["/gercek/muzik/ms-neon.webp", "/gercek/muzik/ms-velvet.webp", "/gercek/muzik/ms-brass.webp"],
  "3d": ["/gercek/3d/robot-poster.png", "/gercek/3d/kask-poster.png", "/gercek/3d/savasci-poster.png", "/gercek/3d/lamba-poster.png"],
};
function kapakla(l: KatalogModel[]): KatalogModel[] {
  const sira = new Map<string, number>();
  return l.map((m) => {
    const havuz = (m.tur === "video" || m.tur === "gorsel" || m.tur === "ses" ? KAPAK_HAVUZU.find(([d]) => d.test(m.ad))?.[1] : undefined) ?? TUR_YEDEK[m.tur];
    const anahtar = havuz.join("|");
    const i = sira.get(anahtar) ?? 0;
    sira.set(anahtar, i + 1);
    return { ...m, kapak: havuz[i % havuz.length] };
  });
}

/** REST API kataloğunda aynı model varsa kimliğini ekler (ad eşleşmesiyle; "Google"/"Vayra" önekleri yok sayılır). */
const apiNorm = (s: string) => s.toLowerCase().replace(/^(google|vayra)\s+/, "").replace(/[^a-z0-9]/g, "");
function apiEsle(l: KatalogModel[]): KatalogModel[] {
  return l.map((m) => {
    const a = API_MODELLERI.find((x) => x.tur === m.tur && apiNorm(x.ad) === apiNorm(m.ad));
    return a ? { ...m, api: { id: a.id, kredi: a.kredi } } : m;
  });
}

function benzersiz(l: KatalogModel[]): KatalogModel[] {
  const sayac = new Map<string, number>();
  for (const m of l) sayac.set(m.slug, (sayac.get(m.slug) ?? 0) + 1);
  return l.map((m) => (sayac.get(m.slug)! > 1 && m.tur !== "video" ? { ...m, slug: `${m.slug}-${m.tur}` } : m));
}

export const KATALOG: KatalogModel[] = kapakla(apiEsle(benzersiz([...videolar(), ...gorseller(), ...sesler(), ...muzikler(), ...ucBoyutlar()])));
export const TUR_SIRASI: KatalogTur[] = ["video", "gorsel", "ses", "muzik", "3d"];
