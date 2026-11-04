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

/* Not: şablon motoru gerçek web araması ya da derleme yapmaz; akışta yalnız motorun gerçekten
   yaptığı adımlar (plan, tasarım dili, bölümler, duyarlılık) gösterilir. */
export function aramaSonuclari(plan: SitePlan): { baslik: string; url: string; alan: string }[] {
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
  menu: "Menü sitesi", oyun: "Oyun", dashboard: "Panel", uygulama: "Uygulama",
};

/**
 * Plandan tam olay ağacını kurar.
 * @param gorselMod görsel üretimi mi (site/oyun değil)
 */
export function akisKur(plan: SitePlan, istem: string, gorselMod: boolean): AjanOlay[] {
  if (gorselMod) {
    return [
      olay("dusunme", "İstek planlandı", {
        govde: `İstek: "${istem}". Bu bir görsel üretimi; önce sahne kurgusunu, ışık ve kompozisyonu belirliyorum, ardından uygun modeli seçip kareyi üretiyorum. Çıktıyı kontrol edip gerekirse rötuş yapıyorum.`,
      }),
      olay("model", "Görsel modeli seçildi", { sureMs: 320 }),
      olay("gorev", "Sahne kurgusu hazırlandı", {
        govde: "Konu, kadraj, ışık yönü ve renk sıcaklığı belirlendi.",
        sureMs: 1400,
      }),
      olay("artifact", "Görsel üretildi", { sureMs: 4200 }),
    ];
  }

  const bolumler = plan.bolumler.length ? plan.bolumler : ["Hero", "Özellikler", "İletişim"];

  return [
    olay("dusunme", "İstek planlandı", {
      govde:
        `İstek: "${istem}".\n\n` +
        `Sektör olarak ${plan.sektor} çıkarımı yaptım; ${TIP_AD[plan.tip]} üretmek en uygunu. ` +
        `Marka adı "${plan.marka}", slogan "${plan.slogan}". ` +
        `Palet ${plan.koyu ? "koyu" : "açık"} zemin üzerine ${plan.aksan} aksan + ${plan.aksan2} ikincil. ` +
        `Planladığım bölümler: ${bolumler.join(", ")}. ` +
        `Önce tasarım dilini kurup sonra bölümleri sırayla yazıyorum, en sonda duyarlılığı kontrol ediyorum.`,
    }),

    olay("model", "Şablon seçildi", { arg: TIP_AD[plan.tip], sureMs: 240 }),

    olay("gorev", "Tasarım dili kuruldu", {
      govde: `Tipografi ölçeği, boşluk ritmi ve bileşen stilleri belirlendi.\nAksan: ${plan.aksan}\nİkincil: ${plan.aksan2}\nZemin: ${plan.zemin}`,
      sureMs: 900,
      cocuklar: [
        olay("kod", "Renk paleti belirlendi", { sureMs: 320 }),
        olay("kod", "Yazı ölçeği ve boşluklar kuruldu", { sureMs: 260 }),
      ],
    }),

    // Her bölüm gerçek bir alt adım — plan.bolumler'den geliyor.
    olay("gorev", `${bolumler.length} bölüm yazıldı`, {
      sureMs: 3200,
      cocuklar: bolumler.map((b, i) =>
        olay("kod", b, { sureMs: 380 + ((b.length * 31 + i) % 500) }),
      ),
    }),

    olay("gorev", "Mobil uyum eklendi", {
      govde: "Dar ekranlarda düzen tek sütuna iner, menü sadeleşir.",
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
