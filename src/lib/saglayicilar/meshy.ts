import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * Meshy AI 3D adaptörü (resmî OpenAPI: docs.meshy.ai). MESHY_API_KEY tanımlıysa gerçek çağrı yapar,
 * görevi oluşturur ve bitene dek sorgular. Sıfır bağımlılık: native fetch.
 *
 * meta.mod işin türünü seçer:
 *   taslak (varsayılan) → text-to-3d preview, image-to-3d ya da multi-image-to-3d
 *   detay   → metinden gelen taslak: text-to-3d refine (preview_task_id); görselden gelen: retexture
 *   doku    → retexture (text_style_prompt, enable_pbr, texture_resolution)
 *   remesh  → remesh (topology, target_polycount)
 *   rig     → rigging (height_meters); yalnız insansı karakter. Yürüme ve koşu animasyonları birlikte gelir.
 *   baski   → resize (resize_height, origin_at bottom) ardından convert (glb, stl, 3mf)
 * Kaynak model meta.kaynakGorev (önceki Meshy görevi) ya da meta.kaynakGlb (herkese açık adres) ile gelir.
 */
const TEMEL = "https://api.meshy.ai/openapi";

async function bekle(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type GorevYaniti = {
  status: string;
  progress?: number;
  model_urls?: Record<string, string | undefined>;
  thumbnail_url?: string;
  task_error?: { message?: string };
  result?: {
    rigged_character_glb_url?: string;
    basic_animations?: { walking_glb_url?: string; running_glb_url?: string } | null;
  };
};

/** Görevin hangi uçta açıldığı: sonraki işlem (refine) bunu bilmeli. */
export type MeshyGorevTuru = "text-to-3d" | "image-to-3d" | "multi-image-to-3d" | "retexture" | "remesh" | "rigging" | "resize" | "convert";
const YOL: Record<MeshyGorevTuru, string> = {
  "text-to-3d": "/v2/text-to-3d", "image-to-3d": "/v1/image-to-3d", "multi-image-to-3d": "/v1/multi-image-to-3d",
  retexture: "/v1/retexture", remesh: "/v1/remesh", rigging: "/v1/rigging", resize: "/v1/resize", convert: "/v1/convert",
};

type Kurulum = { topoloji?: "quad" | "triangle"; poligon?: number; simetri?: boolean | "auto" | "on" | "off"; poz?: string; stil?: string; tohum?: number; pbr?: boolean; onizleme?: string[] };
type AracMeta = {
  mod?: string; kurulum?: Kurulum & Record<string, unknown>;
  kaynakGorev?: { id?: string; tur?: string }; kaynakGlb?: string;
};

async function gorevCalistir(tur: MeshyGorevTuru, govde: Record<string, unknown>, baslik: Record<string, string>): Promise<{ id: string; d: GorevYaniti }> {
  const olustur = await fetch(`${TEMEL}${YOL[tur]}`, { method: "POST", headers: baslik, body: JSON.stringify(govde) });
  if (!olustur.ok) {
    const t = await olustur.text().catch(() => "");
    throw new Error(`Meshy ${tur} ${olustur.status}: ${t.slice(0, 200)}`);
  }
  const { result: id } = (await olustur.json()) as { result: string };
  // 3D işleri uzun sürer: 3 saniyede bir, en çok 5 dakika sorgulanır.
  for (let i = 0; i < 100; i++) {
    await bekle(3000);
    const y = await fetch(`${TEMEL}${YOL[tur]}/${id}`, { headers: baslik });
    if (!y.ok) continue;
    const d = (await y.json()) as GorevYaniti;
    if (d.status === "SUCCEEDED") return { id, d };
    if (d.status === "FAILED" || d.status === "CANCELED") throw new Error(`Meshy ${tur} tamamlanamadı${d.task_error?.message ? `: ${d.task_error.message.slice(0, 160)}` : "."}`);
  }
  throw new Error("Meshy zaman aşımı");
}

/** Kaynak model: önceki Meshy görevi ya da herkese açık GLB adresi. İkisi de yoksa işlem yapılamaz. */
function kaynakGirdisi(m: AracMeta): Record<string, string> {
  const g = m.kaynakGorev?.id;
  if (g && /^[\w-]{6,80}$/.test(g)) return { input_task_id: g };
  const u = m.kaynakGlb;
  if (u && /^https:\/\//.test(u)) return { model_url: u };
  throw new Error("Kaynak modelin dosyası sağlayıcıya gönderilemiyor. Bu işlem yalnız Meshy ile üretilmiş ya da herkese açık adresi olan modellerde çalışır.");
}

const sonuc = (tur: MeshyGorevTuru, id: string, d: GorevYaniti, ek: Record<string, unknown> = {}): SaglayiciSonuc => {
  const glb = (ek.glb as string | undefined) ?? d.model_urls?.glb;
  if (!glb) throw new Error("Meshy sonuç dosyası döndürmedi.");
  return { ciktiUrl: glb, saglayici: "meshy", gercek: true, detay: { taskId: id, gorev: { id, tur }, thumbnail: d.thumbnail_url, glb, ...ek } };
};

export const meshyAdapter: SaglayiciAdapter = {
  ad: "meshy",

  hazir() {
    return Boolean(process.env.MESHY_API_KEY);
  },

  destekler(tur: UretimTuru) {
    return tur === "3d";
  },

  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const anahtar = process.env.MESHY_API_KEY!;
    const baslik = { Authorization: `Bearer ${anahtar}`, "Content-Type": "application/json" };
    const m = (istek.meta ?? {}) as AracMeta;
    const k = (m.kurulum ?? {}) as Kurulum & Record<string, unknown>;
    const mod = m.mod ?? "taslak";

    if (mod === "remesh") {
      const { id, d } = await gorevCalistir("remesh", {
        ...kaynakGirdisi(m), target_formats: ["glb"],
        topology: k.tip === "triangle" ? "triangle" : "quad",
        target_polycount: Math.max(100, Math.min(300000, Math.round(Number(k.poligon) || 30000))),
      }, baslik);
      return sonuc("remesh", id, d);
    }
    if (mod === "doku") {
      const metin = [String(k.istem ?? "").trim(), String(k.stilIstem ?? "").trim()].filter(Boolean).join(", ") || istek.prompt;
      const { id, d } = await gorevCalistir("retexture", {
        ...kaynakGirdisi(m), text_style_prompt: metin.slice(0, 800), enable_pbr: k.pbr !== false, enable_original_uv: true,
        texture_resolution: k.cozunurluk === "4K" ? "4k" : "2k",
      }, baslik);
      return sonuc("retexture", id, d);
    }
    if (mod === "rig") {
      if (k.tur && k.tur !== "insansi") throw new Error("Rig yalnız insansı (iki ayaklı) karakterlerde çalışır.");
      const boy = Number(k.boy);
      const { id, d } = await gorevCalistir("rigging", { ...kaynakGirdisi(m), height_meters: boy > 0 ? Math.min(10, boy) : 1.7 }, baslik);
      const a = d.result?.basic_animations;
      const animasyonlar = [
        ...(a?.walking_glb_url ? [{ ad: "Yürüme", glb: a.walking_glb_url }] : []),
        ...(a?.running_glb_url ? [{ ad: "Koşu", glb: a.running_glb_url }] : []),
      ];
      return sonuc("rigging", id, d, { glb: d.result?.rigged_character_glb_url, animasyonlar });
    }
    if (mod === "baski") {
      const mm = Number(k.yukseklik);
      if (!(mm >= 5 && mm <= 2000)) throw new Error("Baskı yüksekliği geçersiz.");
      const boyut = await gorevCalistir("resize", { ...kaynakGirdisi(m), resize_height: mm / 1000, origin_at: "bottom" }, baslik);
      const { id, d } = await gorevCalistir("convert", { input_task_id: boyut.id, target_formats: ["glb", "stl", "3mf"] }, baslik);
      const dosyalar = Object.fromEntries(["stl", "3mf"].filter((f) => d.model_urls?.[f]).map((f) => [f, d.model_urls![f]]));
      return sonuc("convert", id, d, { dosyalar });
    }
    if (mod === "detay") {
      const kaynak = m.kaynakGorev;
      if (kaynak?.tur === "text-to-3d" && kaynak.id) {
        const { id, d } = await gorevCalistir("text-to-3d", {
          mode: "refine", preview_task_id: kaynak.id, enable_pbr: k.pbr !== false,
          ...(k.cozunurluk === "4K" ? { texture_resolution: "4k" } : {}),
        }, baslik);
        return sonuc("text-to-3d", id, d);
      }
      // Görselden gelen model: kaynak görselin stiliyle yeniden dokunur.
      const stilGorseli = (k.onizleme ?? []).find((x) => typeof x === "string" && x.startsWith("data:image/"));
      const { id, d } = await gorevCalistir("retexture", {
        ...kaynakGirdisi(m), enable_pbr: k.pbr !== false, enable_original_uv: true,
        ...(stilGorseli ? { image_style_url: stilGorseli } : { text_style_prompt: istek.prompt.slice(0, 800) }),
      }, baslik);
      return sonuc("retexture", id, d);
    }

    // Taslak: çoklu görsel, tek görsel ya da metin.
    const gorseller = (istek.girdi?.gorseller ?? []).filter(Boolean);
    const gorsel = gorseller[0] ?? istek.girdi?.kaynak ?? istek.meta?.gorselUrl;
    const ortak = {
      ...(k.topoloji ? { topology: k.topoloji } : {}),
      ...(k.poligon ? { target_polycount: Math.max(100, Math.min(300000, Math.round(k.poligon))) } : {}),
      ...(k.simetri !== undefined ? { symmetry_mode: typeof k.simetri === "string" ? k.simetri : k.simetri ? "on" : "off" } : {}),
      ...(k.poz === "a" ? { pose_mode: "a-pose" } : k.poz === "t" ? { pose_mode: "t-pose" } : {}),
      should_remesh: true,
    };
    const coklu = gorseller.length > 1;
    const tur: MeshyGorevTuru = coklu ? "multi-image-to-3d" : gorsel ? "image-to-3d" : "text-to-3d";
    const govde = coklu
      ? { image_urls: gorseller.slice(0, 4), enable_pbr: k.pbr ?? true, ...ortak }
      : gorsel
        ? { image_url: gorsel, enable_pbr: k.pbr ?? true, ...ortak }
        : { mode: "preview", prompt: istek.prompt.slice(0, 600), art_style: k.stil === "kil" ? "sculpture" : "realistic", ...(Number.isInteger(k.tohum) ? { seed: k.tohum } : {}), ...ortak };
    const { id, d } = await gorevCalistir(tur, govde, baslik);
    return sonuc(tur, id, d, { glb: d.model_urls?.glb });
  },
};
