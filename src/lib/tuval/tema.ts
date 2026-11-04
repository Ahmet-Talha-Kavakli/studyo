import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Canvas renk teması (globals.css .tv-tema-*). */
export type TuvalTema = "gece" | "siyah" | "grafit";
export const TEMALAR: { id: TuvalTema; ad: string; aksan: string; zemin: string }[] = [
  { id: "gece", ad: "Vayra gece", aksan: "#55d6fd", zemin: "#0a0c11" },
  { id: "siyah", ad: "Saf siyah", aksan: "#d4ff3a", zemin: "#050505" },
  { id: "grafit", ad: "Grafit", aksan: "#a594ff", zemin: "#121214" },
];
export type KenarStil = "egri" | "dik" | "duz";
export const useTuvalTema = create<{ tema: TuvalTema; kenar: KenarStil; izgara: boolean; ayarla: (t: TuvalTema) => void; kenarAyarla: (k: KenarStil) => void; izgaraAyarla: (v: boolean) => void }>()(
  persist((set) => ({ tema: "gece", kenar: "egri", izgara: false, ayarla: (tema) => set({ tema }), kenarAyarla: (kenar) => set({ kenar }), izgaraAyarla: (izgara) => set({ izgara }) }), { name: "vayra-tuval-tema" }),
);
/** Izgara adımı (nokta deseniyle aynı). */
export const IZGARA = 22;
export const ETIKET_RENK = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#818cf8", "#e879f9"];
export const temaSinifi = (t: TuvalTema) => `tv-tema tv-tema-${t}`;
