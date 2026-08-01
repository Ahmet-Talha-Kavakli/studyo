"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";
import { HAZIR_PERSONALAR, type Persona } from "@/lib/muzik";

/** Persona (ses/stil kimliği) deposu — Suno Personas. Kalıcı (localStorage). */
interface PersonaState {
  personalar: Persona[];
  ekle: (p: Omit<Persona, "id">) => string;
  sil: (id: string) => void;
}

export const usePersona = create<PersonaState>()(
  persist(
    (set) => ({
      personalar: HAZIR_PERSONALAR,
      ekle: (p) => {
        const id = `p-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
        set((s) => ({ personalar: [{ ...p, id }, ...s.personalar] }));
        return id;
      },
      sil: (id) => set((s) => ({ personalar: s.personalar.filter((x) => x.id !== id) })),
    }),
    { name: "vayra-persona", version: 1, migrate: alanlariKoru },
  ),
);
