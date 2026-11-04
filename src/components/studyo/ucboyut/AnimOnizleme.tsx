"use client";

import { createElement, useEffect, useRef, useState } from "react";

/**
 * Animasyon önizlemesi: gerçek iskeletli 3D manken (CC0 RobotExpressive, Quaternius) o hareketi oynatır.
 * Durağanken önceden çekilmiş kare (poster) gösterilir; oynat=true olunca canlı model-viewer yüklenir.
 */
const GLB = "/gercek/3d/anim/robot-anim.glb";

/** Hareket adı → modeldeki klip ve hız. */
export const ANIM_KLIP: Record<string, { klip: string; hiz?: number }> = {
  "Yürüme": { klip: "Walking" },
  "Koşu": { klip: "Running" },
  "Alkış Koşusu": { klip: "WalkJump" },
  "Geriye Koşu": { klip: "Running", hiz: -1 },
  "Boşta Bekleme": { klip: "Idle" },
  "Alkışlama": { klip: "Yes", hiz: 1.4 },
  "Selamlama": { klip: "Wave" },
  "Oturma": { klip: "Sitting" },
  "Zıplama": { klip: "Jump" },
  "Düşme": { klip: "Death" },
  "Geriye Takla": { klip: "WalkJump", hiz: -1 },
  "Esneme": { klip: "Standing" },
  "Yumruk Atma": { klip: "Punch" },
  "Tekme": { klip: "Punch", hiz: 0.8 },
  "Kılıç Savurma": { klip: "Punch", hiz: 1.3 },
  "Savunma": { klip: "No" },
  "Hip Hop Dansı": { klip: "Dance" },
  "360 Güç Dönüşü": { klip: "Dance", hiz: 1.5 },
  "Salsa": { klip: "Dance", hiz: 0.8 },
  "Robot Dansı": { klip: "ThumbsUp" },
};
export const animPoster = (ad: string) => `/gercek/3d/anim/${(ANIM_KLIP[ad]?.klip ?? "Idle").toLowerCase()}.png`;

let kutuphane: Promise<unknown> | null = null;

export function AnimOnizleme({ ad, oynat, className }: { ad: string; oynat: boolean; className?: string }) {
  const [hazir, setHazir] = useState(false);
  const [yuklendi, setYuklendi] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const k = ANIM_KLIP[ad] ?? { klip: "Idle" };

  useEffect(() => {
    if (!oynat) return;
    kutuphane ??= import("@google/model-viewer");
    let iptal = false;
    void kutuphane.then(() => { if (!iptal) setHazir(true); });
    return () => { iptal = true; };
  }, [oynat]);

  useEffect(() => {
    const mv = ref.current as (HTMLElement & { model?: { materials: { pbrMetallicRoughness: { setBaseColorFactor: (c: number[]) => void; setMetallicFactor: (n: number) => void; setRoughnessFactor: (n: number) => void } }[] }; play?: (o?: { repetitions?: number }) => void; timeScale?: number; animationName?: string }) | null;
    if (!mv || !hazir || !oynat) return;
    const yukle = () => {
      for (const m of mv.model?.materials ?? []) { m.pbrMetallicRoughness.setBaseColorFactor([0.46, 0.48, 0.52, 1]); m.pbrMetallicRoughness.setMetallicFactor(0); m.pbrMetallicRoughness.setRoughnessFactor(0.6); }
      mv.timeScale = k.hiz ?? 1;
      mv.play?.({ repetitions: Infinity });
      setYuklendi(true);
    };
    mv.addEventListener("load", yukle);
    return () => mv.removeEventListener("load", yukle);
  }, [hazir, oynat, k.hiz]);

  return (
    <span className={className} style={{ position: "relative", display: "block" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={animPoster(ad)} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: oynat && yuklendi ? 0 : 1, transition: "opacity .25s" }} />
      {oynat && hazir && createElement("model-viewer", {
        ref, src: GLB, "animation-name": k.klip, autoplay: true, "environment-image": "neutral", exposure: "0.62", "shadow-intensity": "1.2", "shadow-softness": "0.8",
        "camera-orbit": "28deg 82deg 15.2m", "camera-target": "0.03m 2.21m 0.07m", "field-of-view": "30deg", "max-camera-orbit": "auto auto 60m", "interaction-prompt": "none", "disable-zoom": true, "disable-pan": true, "disable-tap": true, loading: "eager",
        style: { position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", opacity: yuklendi ? 1 : 0, transition: "opacity .25s", pointerEvents: "none", ["--poster-color" as string]: "transparent", ["--progress-bar-height" as string]: "0px" },
      })}
    </span>
  );
}
