/** Ayarlar › Görünüm'deki vurgu renkleri. Sunucu bileşenlerinden de içe aktarılabilir. */
export const VURGU_RENKLERI: { id: string; ad: string; renk: string; ust: string }[] = [
  { id: "elektrik", ad: "Elektrik", renk: "#6d6bff", ust: "#ffffff" },
  { id: "okyanus", ad: "Okyanus", renk: "#2f8cff", ust: "#ffffff" },
  { id: "zumrut", ad: "Zümrüt", renk: "#16b37a", ust: "#ffffff" },
  { id: "kehribar", ad: "Kehribar", renk: "#f2a623", ust: "#1a1206" },
  { id: "mercan", ad: "Mercan", renk: "#ff5d5d", ust: "#ffffff" },
  { id: "magenta", ad: "Magenta", renk: "#e046c8", ust: "#ffffff" },
];

/** Hidrasyondan önce çalışır: kayıtlı vurgu rengini ve hareket tercihini hemen uygular (renk sıçraması olmaz). */
export const TERCIH_BETIGI = `try{var s=JSON.parse(localStorage.getItem("vayra-tercih")||"{}").state||{};var R=${JSON.stringify(
  Object.fromEntries(VURGU_RENKLERI.map((v) => [v.id, [v.renk, v.ust]])),
)};var r=R[s.vurgu];if(r){var d=document.documentElement.style;d.setProperty("--vurgu-renk",r[0]);d.setProperty("--vurgu-ust",r[1]);}if(s.hareket==="azalt")document.documentElement.classList.add("hareket-azalt");}catch(e){}`;
