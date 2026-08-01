import type { SitePlan } from "@/lib/siteUretici";
import { olay, type AjanOlay } from "@/lib/scAjanOlay";

/* ============================================================
   AKIŞ ÜRETİCİ — üretim planından Claude-tarzı olay akışı türetir.

   Önceki akış sabit bir dizeydi (`gorevListesi()` her seferinde aynı 7 etiket).
   Burada olaylar PLANIN GERÇEK içeriğinden üretilir: seçilen sektör, palet,
   bölüm başlıkları, dosya listesi. Böylece ekranda görünen ağaç gerçekten
   o üretime ait olur — kahve dükkânı ile oyun aynı akışı göstermez.

   Akış zaman içinde açılır: `akisiKes(tumOlaylar, adim)` ilk N olayı döndürür
   ve son olanı "çalışıyor" durumuna alır.
   ============================================================ */

/** Arama sonuçları — plan sektörüne göre gerçekçi, deterministik referanslar. */
function aramaSonuclari(plan: SitePlan): { baslik: string; url: string; alan: string }[] {
  const s = plan.sektor.toLocaleLowerCase("tr");
  const konu = encodeURIComponent(`${plan.sektor} web tasarım trendleri`);
  return [
    { baslik: `${plan.sektor} için 2026 web tasarım eğilimleri`, url: `https://www.awwwards.com/websites/?s=${konu}`, alan: "awwwards.com" },
    { baslik: `${plan.sektor} sitelerinde dönüşüm optimizasyonu`, url: "https://baymard.com/blog", alan: "baymard.com" },
    { baslik: `Erişilebilir renk paleti: ${plan.aksan}`, url: `https://webaim.org/resources/contrastchecker/?fcolor=${plan.aksan.replace("#", "")}`, alan: "webaim.org" },
  ];
}

/** Tip → insan okunur çıktı adı. */
const TIP_AD: Record<SitePlan["tip"], string> = {
  landing: "Landing sayfası", portfolyo: "Portfolyo", blog: "Blog",
  menu: "Menü sitesi", oyun: "Oyun", dashboard: "Panel",
};

/**
 * Plandan tam olay ağacını kurar.
 * @param gorselMod görsel üretimi mi (site/oyun değil)
 */
export function akisKur(plan: SitePlan, istem: string, gorselMod: boolean): AjanOlay[] {
  if (gorselMod) {
    return [
      olay("dusunme", "Enine boyuna düşünülüyor", {
        govde: `İstek: "${istem}". Bu bir görsel üretimi; önce sahne kurgusunu, ışık ve kompozisyonu belirliyorum, ardından uygun modeli seçip kareyi üretiyorum. Çıktıyı kontrol edip gerekirse rötuş yapıyorum.`,
      }),
      olay("model", "Model seçildi", { arg: "fable_5", sureMs: 320 }),
      olay("gorev", "Sahne kurgusu hazırlandı", {
        govde: "Konu, kadraj, ışık yönü ve renk sıcaklığı belirlendi.",
        sureMs: 1400,
      }),
      olay("artifact", "Görsel üretildi", { arg: "1024×1024", sureMs: 4200 }),
    ];
  }

  const dosyalar = plan.dosyalar.length ? plan.dosyalar : ["index.html", "styles.css"];
  const bolumler = plan.bolumler.length ? plan.bolumler : ["Hero", "Özellikler", "İletişim"];

  return [
    olay("dusunme", "Enine boyuna düşünülüyor", {
      govde:
        `İstek: "${istem}".\n\n` +
        `Sektör olarak ${plan.sektor} çıkarımı yaptım; ${TIP_AD[plan.tip]} üretmek en uygunu. ` +
        `Marka adı "${plan.marka}", slogan "${plan.slogan}". ` +
        `Palet ${plan.koyu ? "koyu" : "açık"} zemin üzerine ${plan.aksan} aksan + ${plan.aksan2} ikincil. ` +
        `Planladığım bölümler: ${bolumler.join(", ")}. ` +
        `Önce tasarım dilini kurup sonra bölümleri sırayla yazıyorum, en sonda duyarlılığı kontrol ediyorum.`,
    }),

    olay("arama", "Web'de arandı", {
      arg: `${plan.sektor} tasarım referansları`,
      sonuclar: aramaSonuclari(plan),
      sureMs: 1650,
    }),

    olay("model", "Beceri yüklendi", { arg: plan.tip === "oyun" ? "oyun_uretici" : "site_uretici", sureMs: 240 }),

    olay("gorev", "Tasarım dili kuruldu", {
      govde: `Tipografi ölçeği, boşluk ritmi ve bileşen stilleri belirlendi.\nAksan: ${plan.aksan}\nİkincil: ${plan.aksan2}\nZemin: ${plan.zemin}`,
      sureMs: 900,
      cocuklar: [
        olay("kod", "Renk değişkenleri yazıldı", { arg: "tokens.css", diff: { ekle: 18 }, sureMs: 320 }),
        olay("kod", "Tipografi ölçeği kuruldu", { arg: "type.css", diff: { ekle: 12 }, sureMs: 260 }),
      ],
    }),

    // Her bölüm gerçek bir alt adım — plan.bolumler'den geliyor.
    olay("gorev", `${bolumler.length} bölüm yazıldı`, {
      sureMs: 3200,
      cocuklar: bolumler.map((b, i) =>
        olay("kod", `${b} bölümü`, {
          arg: dosyalar[i % dosyalar.length],
          diff: { ekle: 22 + ((b.length * 7) % 40) },
          sureMs: 380 + ((b.length * 31) % 500),
        }),
      ),
    }),

    olay("komut", "Derleme çalıştırıldı", {
      arg: "npm run build",
      govde:
        `$ npm run build\n\n` +
        `> ${plan.marka.toLocaleLowerCase("tr").replace(/\s+/g, "-")}@1.0.0 build\n` +
        `> vayra-build\n\n` +
        dosyalar.map((d) => `  ✓ ${d}`).join("\n") +
        `\n\n✓ Derleme başarılı — ${dosyalar.length} dosya, 0 hata`,
      sureMs: 2100,
    }),

    olay("gorev", "Duyarlılık kontrol edildi", {
      govde: "360px, 768px ve 1440px kırılımlarında düzen doğrulandı; taşma yok.",
      sureMs: 700,
    }),

    olay("artifact", `${TIP_AD[plan.tip]} hazır`, {
      arg: `${plan.marka.toLocaleLowerCase("tr").replace(/\s+/g, "-")}.vayra.app`,
      sureMs: 500,
    }),
  ];
}

/**
 * Akışı adım adım açar: ilk `adim` olayı döndürür, sonuncusunu "çalışıyor"
 * yapar. Böylece üretim ilerledikçe ağaç canlı büyür.
 */
export function akisiKes(tum: AjanOlay[], adim: number): AjanOlay[] {
  const n = Math.max(1, Math.min(tum.length, adim));
  return tum.slice(0, n).map((o, i) =>
    i === n - 1 && n < tum.length ? { ...o, durum: "calisiyor" as const, sureMs: undefined } : o,
  );
}
