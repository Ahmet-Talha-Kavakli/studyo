import { gorselHazirla } from "./video";
import type { SaglayiciIstek } from "./tipler";
import type { GorselApi } from "@/lib/gorselModelVeri";

/**
 * Görsel adaptörlerinin ortak hazırlığı: girdi görselleri (kaynak + referans + @element + stil) ve
 * sağlayıcıya giden istem. Ayarlar istem metnine "not" olarak gömülmez; gerçek parametreler ayrı gider.
 * Yalnız sağlayıcının parametresi olmayan yönergeler (palet, stil rolü, kaçınılacaklar) metne eklenir
 * ve bilgi panelinde "gönderilen istem" olarak görünür.
 */
export type GorselGirdi = {
  /** Sırasıyla: düzenlenecek kaynak, kullanıcı referansları, @element görselleri. */
  icerik: string[];
  /** Stil referansları (ruh panosu) — yalnız ışık/renk/doku için. */
  stil: string[];
  maske?: string;
};

export async function gorselGirdileri(istek: SaglayiciIstek, max: number): Promise<GorselGirdi> {
  const m = istek.meta ?? {};
  const hazirla = async (l: (string | undefined)[]) => {
    const c: string[] = [];
    for (const u of l) {
      if (!u) continue;
      const d = await gorselHazirla(u).catch(() => undefined);
      if (d && !c.includes(d)) c.push(d);
    }
    return c;
  };
  const elementler: string[] = [];
  const refs = istek.girdi?.referanslar ?? [];
  for (let tur = 0; tur < 4; tur++) for (const r of refs) if (r.gorseller[tur]) elementler.push(r.gorseller[tur]);
  const icerik = await hazirla([m.gorselUrl, ...(m.referanslar ?? []), ...elementler]);
  const stil = await hazirla(m.stilRefler ?? []);
  // Sınır: önce içerik (kaynak her zaman ilk), kalan yer stile.
  const ic = icerik.slice(0, max);
  return { icerik: ic, stil: stil.slice(0, Math.max(0, max - ic.length)), maske: m.maskeUrl ? await gorselHazirla(m.maskeUrl).catch(() => undefined) : undefined };
}

const RECETE: Record<NonNullable<GorselApi["recete"]>, string> = {
  ruh: "Ultra-realistic editorial fashion photograph, natural skin texture, real fabric detail, authentic lighting, shot on a professional camera.",
  sinema: "Cinematic film still, anamorphic lens look, rich color grade, subtle film grain, motivated dramatic lighting, high dynamic range.",
};

/** Sağlayıcıya giden istem (reçete + yönergeler). `negatifDestekli` ise kaçınılacaklar ayrı parametreye gider. */
export function gorselIstem(istek: SaglayiciIstek, api: GorselApi, g: GorselGirdi, negatifDestekli: boolean): string {
  const m = istek.meta ?? {};
  const parca: string[] = [];
  if (api.recete) parca.push(RECETE[api.recete]);
  parca.push(istek.prompt.trim());
  if (m.stilIstem?.trim()) parca.push(`Visual style: ${m.stilIstem.trim()}.`);
  // Kullanıcı referanslarının rolleri: görsel sırası kaynak + referanslar (kaynak çoğu zaman 1. referansın kendisi).
  if (m.refRolleri?.some((r) => r && r !== "genel")) {
    const ilkAyni = !!m.gorselUrl && m.referanslar?.[0] === m.gorselUrl;
    const kayma = m.gorselUrl && !ilkAyni ? 1 : 0;
    const ROL: Record<string, string> = {
      stil: "use it only as a style reference (lighting, color palette, texture, mood); do not copy its subject",
      karakter: "keep this person's or character's face, identity and outfit consistent",
      kompozisyon: "follow its composition, framing and pose",
      urun: "keep this product exactly as it is (shape, label, colors)",
    };
    m.refRolleri.forEach((r, i) => { const n = i + 1 + kayma; if (ROL[r] && n <= g.icerik.length) parca.push(`Image ${n}: ${ROL[r]}.`); });
  }
  if (g.stil.length) {
    const bas = g.icerik.length + 1;
    const son = g.icerik.length + g.stil.length;
    const guc = m.stilGuc === "hafif" ? " Apply the style subtly; the prompt has priority." : m.stilGuc === "guclu" ? " Match their look very closely: same lighting, color grading, grain and atmosphere." : "";
    parca.push(`Use image${g.stil.length > 1 ? `s ${bas}–${son}` : ` ${bas}`} only as a style reference for lighting, color palette, texture and mood; do not copy their subjects.${guc}`);
  }
  if (m.renkler?.length) parca.push(`Color palette: ${m.renkler.join(", ")}. Keep the image within these colors.`);
  if (m.negatif?.trim() && !negatifDestekli) parca.push(`Avoid: ${m.negatif.trim()}.`);
  return parca.join("\n\n");
}

/** "#aabbcc" → {r,g,b} (Recraft `colors`). */
export const hexRgb = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

/** http(s) adresini data URI'ye çevirir (yalnız inline görsel isteyen sağlayıcılar için). */
export async function dataUriYap(u: string): Promise<string> {
  if (u.startsWith("data:")) return u;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`Referans görsel indirilemedi (${r.status})`);
  const mime = r.headers.get("content-type")?.split(";")[0] || "image/png";
  return `data:${mime};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
}

export const base64Parca =(d: string) => ({ mime: d.match(/^data:([^;]+)/)?.[1] ?? "image/png", veri: d.replace(/^data:[^;]+;base64,/, "") });
