/**
 * MarkaIkon — model sağlayıcılarının imza ikonları (Higgsfield birebir).
 *
 * Referansta her sağlayıcı kendi ikonuyla görünüyor: Kling lime düğüm,
 * Seedance yeşil çubuklar, Google "G", Sora yeşil damla, Wan origami,
 * Minimax dalga formu, Grok çizili daire, HappyHorse el yazısı.
 * Gerçek logolar telifli olduğu için markanın SİLUETİNİ ve rengini
 * yeniden çiziyoruz — tanınır ama birebir kopya değil.
 */

import { cn } from "@/lib/utils";

const LIME = "var(--sn-lime, #55d6fd)";

/* GERÇEK marka logoları (kullanıcı kararı: "gerçek birebir logoları kullan").
   Kaynak: Simple Icons (CC0) — public/marka/*.svg olarak indirildi.
   Anahtarı burada olan marka gerçek logosunu gösterir; olmayanlar aşağıdaki
   silüet çizimlerine düşer (Vayra'nın kendi modelleri ve logosu bulunmayan
   sağlayıcılar: happyhorse, flux, recraft, zimage, vayra, coklu).

   Not: bu dosyalar başka şirketlerin ticari markalarıdır ve yalnızca
   destekledikleri modeli tanıtmak için kullanılır. */
const GERCEK_LOGO: Record<string, string> = {
  kling: "/marka/kuaishou.svg",      // Kling = Kuaishou
  seedance: "/marka/bytedance.svg",  // Seedance = ByteDance
  google: "/marka/googlegemini.svg", // Veo / Gemini
  openai: "/marka/openai_alt.svg",   // Sora
  minimax: "/marka/minimax.svg",     // Hailuo
  wan: "/marka/alibaba.svg",         // Wan = Alibaba
  grok: "/marka/xai.svg",            // Grok = xAI
};

export function MarkaIkon({ marka, className }: { marka: string; className?: string }) {
  const c = cn("shrink-0", className);

  const logo = GERCEK_LOGO[marka];
  if (logo) {
    /* Logolar tek renk (currentColor değil, kendi marka rengi) SVG'ler.
       <img> ile basılır: harici istek yok, dosyalar public/ içinde.
       object-contain — farklı en/boy oranlarında taşma olmasın. */
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt="" aria-hidden loading="lazy"
        className={cn("shrink-0 object-contain", className)} />
    );
  }

  switch (marka) {
    /* Kling — iç içe geçmiş lime düğüm/sonsuzluk */
    case "kling":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke={LIME} strokeWidth="1.6">
          <ellipse cx="12" cy="12" rx="9" ry="5.2" transform="rotate(-30 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="5.2" transform="rotate(30 12 12)" />
        </svg>
      );
    /* Seedance — yükselen yeşil çubuklar (equalizer) */
    case "seedance":
      return (
        <svg viewBox="0 0 24 24" className={c} fill={LIME}>
          <rect x="3" y="13" width="3.4" height="8" rx="1.2" />
          <rect x="8.4" y="7" width="3.4" height="14" rx="1.2" />
          <rect x="13.8" y="10" width="3.4" height="11" rx="1.2" />
          <rect x="19.2" y="4" width="1.8" height="17" rx="0.9" opacity=".55" />
        </svg>
      );
    /* Google / Gemini / Veo — "G" */
    case "google":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          <path d="M21 12.2A9 9 0 1 0 18.4 18" />
          <path d="M21 12.2h-8" />
        </svg>
      );
    /* OpenAI Sora — yuvarlak damla + iki göz */
    case "openai":
      return (
        <svg viewBox="0 0 24 24" className={c} fill={LIME}>
          <path d="M12 2.6c5.4 0 9.4 3.6 9.4 8.6 0 5.6-4 9.9-9.4 9.9S2.6 16.8 2.6 11.2C2.6 6.2 6.6 2.6 12 2.6Z" />
          <circle cx="9" cy="11" r="1.5" fill="#0e0f11" />
          <circle cx="15" cy="11" r="1.5" fill="#0e0f11" />
        </svg>
      );
    /* Wan — katlanmış origami/uçak */
    case "wan":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke={LIME} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
          <path d="M12 3v18M4 7.5l8 4.5 8-4.5" />
        </svg>
      );
    /* Minimax Hailuo — dalga formu */
    case "minimax":
      return (
        <svg viewBox="0 0 24 24" className={c} fill={LIME}>
          {[[2.5, 9, 6], [5.8, 6, 12], [9.1, 3, 18], [12.4, 7, 10], [15.7, 5, 14], [19, 9, 6]].map(([x, y, h], i) => (
            <rect key={i} x={x} y={y} width="2.2" height={h} rx="1.1" />
          ))}
        </svg>
      );
    /* Grok — üzeri çizili daire */
    case "grok":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke={LIME} strokeWidth="1.7">
          <circle cx="12" cy="12" r="8.6" />
          <path d="M6 18 18 6" />
        </svg>
      );
    /* HappyHorse — el yazısı kıvrım */
    case "happyhorse":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke={LIME} strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 17c3.2 0 4.6-2.3 5.4-5.2C11 9.4 11.6 6.5 14 6.5c1.7 0 2.6 1.3 2.6 3 0 3.4-3.6 5.3-7.2 5.3" />
          <path d="M14.5 17.5H19" />
        </svg>
      );
    /* FLUX (Black Forest Labs) — üçgen dağ */
    case "flux":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke={LIME} strokeWidth="1.7" strokeLinejoin="round">
          <path d="M12 3.5 21 19.5H3z" />
          <path d="M12 11.5 16 19.5H8z" fill={LIME} stroke="none" />
        </svg>
      );
    /* Recraft — stilize "R" */
    case "recraft":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke={LIME} strokeWidth="1.9" strokeLinecap="round">
          <path d="M7 20V4.5h5.6a4.2 4.2 0 0 1 0 8.4H7" />
          <path d="m12.4 12.9 5 7.1" />
        </svg>
      );
    /* Z-Image — açılı pervane */
    case "zimage":
      return (
        <svg viewBox="0 0 24 24" className={c} fill={LIME}>
          <path d="M12 2.5 14.6 9 21 12l-6.4 3L12 21.5 9.4 15 3 12l6.4-3z" opacity=".9" />
        </svg>
      );
    /* Çoklu Referans — üst üste kareler + artı */
    case "coklu":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke={LIME} strokeWidth="1.6">
          <rect x="3" y="3" width="12" height="12" rx="2.5" />
          <path d="M9 21h10a2 2 0 0 0 2-2V9" />
          <path d="M18.5 3.5v5M21 6h-5" />
        </svg>
      );
    /* Vayra / Higgsfield — parlayan yıldız */
    case "vayra":
      return (
        <svg viewBox="0 0 24 24" className={c} fill={LIME}>
          <path d="M12 2.5 14 9.4l6.9 2-6.9 2L12 21.5l-2-8.1-6.9-2 6.9-2z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
          <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
