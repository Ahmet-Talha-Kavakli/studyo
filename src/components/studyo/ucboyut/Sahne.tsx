"use client";

import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Gorunum = "doku" | "kil" | "tel";
export type Isik = "studyo" | "gun" | "los" | "parlak";
export type Arka = "koyu" | "gri" | "acik";
export interface SahneBilgi { ucgen: number; kose: number; doku: number; olcu: { x: number; y: number; z: number } }
export interface SahneApi { goruntu: () => Promise<Blob | null>; kadraj: () => void; tamEkran: () => void; donusVideo: (o: { sn: number; zemin: string; ilerleme?: (o: number) => void }) => Promise<{ blob: Blob; uzanti: string } | null> }

export const ISIKLAR: { id: Isik; ad: string; alt: string; env: string; poz: number; golge: number }[] = [
  { id: "studyo", ad: "Stüdyo", alt: "Dengeli, yumuşak gölge", env: "neutral", poz: 1.05, golge: 1 },
  { id: "gun", ad: "Gün ışığı", alt: "Sıcak, doğal yansıma", env: "legacy", poz: 1.2, golge: 0.8 },
  { id: "parlak", ad: "Parlak", alt: "Detayları açar", env: "neutral", poz: 1.6, golge: 0.5 },
  { id: "los", ad: "Loş", alt: "Dramatik, koyu", env: "neutral", poz: 0.62, golge: 1.3 },
];
export const ARKALAR: { id: Arka; ad: string; renk: string }[] = [
  { id: "koyu", ad: "Koyu", renk: "#141517" },
  { id: "gri", ad: "Gri", renk: "#3b3d42" },
  { id: "acik", ad: "Açık", renk: "#dcdee3" },
];
const KAMERA = "30deg 74deg 150%";

/* model-viewer'ın three.js sahnesine erişim (görünüm modları ve gerçek mesh istatistikleri için). */
type Malzeme = { clone: () => Malzeme; map?: unknown; normalMap?: unknown; emissiveMap?: unknown; roughnessMap?: unknown; metalnessMap?: unknown; aoMap?: unknown; wireframe?: boolean; roughness?: number; metalness?: number; color?: { set: (c: string) => void }; emissive?: { set: (c: string) => void }; needsUpdate?: boolean };
type Dugum = { isMesh?: boolean; material: Malzeme | Malzeme[]; userData: Record<string, unknown>; geometry?: { index?: { count: number } | null; attributes?: { position?: { count: number } } } };
type Sahne3 = { traverse: (f: (o: Dugum) => void) => void; queueRender?: () => void; shadow?: { traverse: (f: (o: Dugum) => void) => void } | null };

/** Modelin mesh'leri (model-viewer'ın gölge düzlemi hariç). */
function meshler(sahne: Sahne3, f: (o: Dugum) => void) {
  const haric = new Set<Dugum>();
  sahne.shadow?.traverse((x) => haric.add(x));
  sahne.traverse((o) => { if (o.isMesh && !haric.has(o)) f(o); });
}
type MV = HTMLElement & { toBlob: (o?: { mimeType?: string; idealAspect?: boolean }) => Promise<Blob>; getDimensions: () => { x: number; y: number; z: number }; cameraOrbit: string; jumpCameraToGoal: () => void; resetTurntableRotation?: () => void };

const sahneAl = (mv: HTMLElement): Sahne3 | null => {
  const s = Object.getOwnPropertySymbols(mv).find((x) => x.description === "scene");
  return s ? ((mv as unknown as Record<symbol, Sahne3>)[s] ?? null) : null;
};

function gorunumUygula(sahne: Sahne3, g: Gorunum) {
  const donustur = (m: Malzeme): Malzeme => {
    const c = m.clone();
    c.map = null; c.emissiveMap = null; c.emissive?.set("#000000");
    if (g === "tel") { c.wireframe = true; c.normalMap = null; c.roughnessMap = null; c.metalnessMap = null; c.aoMap = null; c.color?.set("#7fdcf5"); c.emissive?.set("#0b3540"); c.metalness = 0; }
    else { c.color?.set("#c7cad0"); c.roughness = 0.68; c.metalness = 0; c.metalnessMap = null; }
    c.needsUpdate = true;
    return c;
  };
  meshler(sahne, (o) => {
    const orj = (o.userData.vOrj ??= o.material) as Malzeme | Malzeme[];
    if (g === "doku") { o.material = orj; return; }
    const anahtar = g === "kil" ? "vKil" : "vTel";
    o.material = (o.userData[anahtar] ??= Array.isArray(orj) ? orj.map(donustur) : donustur(orj)) as Malzeme | Malzeme[];
  });
  sahne.queueRender?.();
}

function bilgiTopla(mv: MV, sahne: Sahne3): SahneBilgi {
  let ucgen = 0, kose = 0;
  const dokular = new Set<unknown>();
  meshler(sahne, (o) => {
    if (!o.geometry) return;
    const p = o.geometry.attributes?.position?.count ?? 0;
    kose += p;
    ucgen += Math.round((o.geometry.index?.count ?? p) / 3);
    const orj = (o.userData.vOrj ?? o.material) as Malzeme | Malzeme[];
    for (const m of Array.isArray(orj) ? orj : [orj]) for (const t of [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.emissiveMap]) if (t) dokular.add(t);
  });
  return { ucgen, kose, doku: dokular.size, olcu: mv.getDimensions() };
}

let kutuphane: Promise<unknown> | null = null;

/**
 * Canlı 3D sahne (model-viewer). Dokulu / kil / tel kafes görünümleri malzemeleri sahnede değiştirir;
 * üçgen, köşe, doku sayısı ve boyutlar yüklenen GLB'den ölçülür. GLB inene kadar poster görünür.
 */
export const Sahne = forwardRef<SahneApi, {
  glb?: string; poster?: string; gorunum: Gorunum; isik: Isik; donme: boolean; onBilgi?: (b: SahneBilgi | null) => void; className?: string; children?: React.ReactNode;
}>(function Sahne({ glb, poster, gorunum, isik, donme, onBilgi, className, children }, ref) {
  const kap = useRef<HTMLDivElement>(null);
  const mvRef = useRef<MV | null>(null);
  const [hazir, setHazir] = useState(false);
  const [yuklendi, setYuklendi] = useState(false);
  const [hata, setHata] = useState(false);
  const gorunumRef = useRef(gorunum);
  gorunumRef.current = gorunum;
  const bilgiRef = useRef(onBilgi);
  bilgiRef.current = onBilgi;

  useEffect(() => {
    let iptal = false;
    kutuphane ??= import("@google/model-viewer");
    kutuphane.then(() => !iptal && setHazir(true)).catch(() => !iptal && setHata(true));
    return () => { iptal = true; };
  }, []);

  useEffect(() => {
    setYuklendi(false); setHata(false); bilgiRef.current?.(null);
    const el = mvRef.current;
    if (!hazir || !el || !glb) return;
    const tamam = () => {
      setYuklendi(true);
      const s = sahneAl(el);
      if (!s) return;
      gorunumUygula(s, gorunumRef.current);
      bilgiRef.current?.(bilgiTopla(el, s));
    };
    const patladi = () => setHata(true);
    el.addEventListener("load", tamam);
    el.addEventListener("error", patladi);
    return () => { el.removeEventListener("load", tamam); el.removeEventListener("error", patladi); };
  }, [hazir, glb]);

  useEffect(() => {
    const el = mvRef.current;
    const s = el && yuklendi ? sahneAl(el) : null;
    if (s) gorunumUygula(s, gorunum);
  }, [gorunum, yuklendi]);

  useImperativeHandle(ref, () => ({
    goruntu: async () => (mvRef.current && yuklendi ? mvRef.current.toBlob({ mimeType: "image/png", idealAspect: false }).catch(() => null) : null),
    kadraj: () => { const el = mvRef.current; if (!el) return; el.cameraOrbit = KAMERA; el.resetTurntableRotation?.(); el.jumpCameraToGoal(); },
    donusVideo: async ({ sn, zemin, ilerleme }) => {
      const el = mvRef.current;
      if (!el || !yuklendi || typeof MediaRecorder === "undefined") return null;
      // 1) Kareleri yakala: her açıda sahnenin görüntüsü (toBlob, WebGL tamponundan güvenli kopya).
      const kare = Math.round(sn * 30), eskiOrbit = el.cameraOrbit, bloblar: Blob[] = [];
      for (let i = 0; i < kare; i++) {
        el.cameraOrbit = `${30 + (i / kare) * 360}deg 74deg 150%`; el.jumpCameraToGoal();
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        bloblar.push(await el.toBlob({ mimeType: "image/png", idealAspect: false }));
        ilerleme?.((i + 1) / kare * 0.7);
      }
      el.cameraOrbit = eskiOrbit; el.jumpCameraToGoal();
      // 2) Gerçek hızda oynatıp kaydet (kare yakalama yavaş olsa da video akıcı ve doğru sürede olur).
      const boy = 1080, c = document.createElement("canvas"); c.width = boy; c.height = boy;
      const x = c.getContext("2d"); if (!x) return null;
      const tur = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
      // Kare ortadan kırpılır (geniş sahnede model küçük kalmasın); şeffaf alanlar sahnenin arka plan rengini alır.
      const ciz = (img: ImageBitmap) => { x.fillStyle = zemin; x.fillRect(0, 0, boy, boy); const k = Math.min(img.width, img.height) * 0.82; x.drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, boy, boy); };
      let img = await createImageBitmap(bloblar[0]); ciz(img);
      const kayit = new MediaRecorder(c.captureStream(30), { mimeType: tur, videoBitsPerSecond: 8_000_000 });
      const parca: Blob[] = []; kayit.ondataavailable = (e) => { if (e.data.size) parca.push(e.data); };
      const bitti = new Promise<void>((ok) => { kayit.onstop = () => ok(); });
      kayit.start();
      const bas = performance.now();
      for (let i = 0; i < kare; i++) {
        const sonraki = createImageBitmap(bloblar[Math.min(i + 1, kare - 1)]);
        ciz(img); img.close();
        ilerleme?.(0.7 + (i + 1) / kare * 0.3);
        const bekle = bas + ((i + 1) * 1000) / 30 - performance.now();
        img = await sonraki;
        if (bekle > 0) await new Promise((ok) => setTimeout(ok, bekle));
      }
      kayit.stop(); await bitti;
      return { blob: new Blob(parca, { type: tur.split(";")[0] }), uzanti: tur.startsWith("video/mp4") ? "mp4" : "webm" };
    },
    tamEkran: () => { const k = kap.current; if (!k) return; if (document.fullscreenElement) void document.exitFullscreen(); else void k.requestFullscreen?.(); },
  }), [yuklendi]);

  const ayar = ISIKLAR.find((x) => x.id === isik) ?? ISIKLAR[0];
  return (
    <div ref={kap} className={cn("relative h-full w-full overflow-hidden", className)}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden draggable={false}
          className={cn("pointer-events-none absolute inset-0 m-auto h-[62%] w-[62%] object-contain transition-opacity duration-500", yuklendi && !hata ? "opacity-0" : "opacity-100", !yuklendi && glb && !hata && "animate-pulse")} />
      )}
      {hazir && glb && !hata && createElement("model-viewer", {
        ref: mvRef, key: glb, src: glb, alt: "3D model",
        "camera-controls": true, "auto-rotate": donme || undefined, "auto-rotate-delay": 0, "rotation-per-second": "24deg",
        "shadow-intensity": String(ayar.golge), "shadow-softness": "0.9", exposure: String(ayar.poz), "environment-image": ayar.env, "tone-mapping": "aces",
        "camera-orbit": KAMERA, "min-camera-orbit": "auto auto 60%", "max-camera-orbit": "auto auto 260%", "interaction-prompt": "none",
        style: { width: "100%", height: "100%", background: "transparent", opacity: yuklendi ? 1 : 0, transition: "opacity .5s" },
      })}
      {children}
    </div>
  );
});
