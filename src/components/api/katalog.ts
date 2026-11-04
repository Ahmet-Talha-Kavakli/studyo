import { MODELLER, type ModelTur } from "@/lib/catalog";
import { modelTurRenk } from "@/lib/renk";

export const modelBulKatalog = (id: string) => MODELLER.find((m) => m.id === id);
export const API_TUR_ADI: Record<string, ModelTur> = { image: "gorsel", video: "video", audio: "ses", music: "muzik", "3d": "3d" };
export const turRenkApi = (t: string) => modelTurRenk(API_TUR_ADI[t] ?? t);
