"use client";

/**
 * Usta projeleri = ana Projeler (useProje). Usta'ya ayrı proje listesi YOK.
 * Yalnız Usta'ya özgü ekler (talimat, bilgi dosyaları, sabit) useSupercomputer.projeler
 * içinde proje kimliğine göre saklanır; ad/açıklama ana projeden gelir ve ona yazılır.
 */

import { useMemo } from "react";
import { useProje, type Proje } from "@/store/useSinema";
import { useSupercomputer, type SCProje } from "@/store/useSupercomputer";

const EN_ESKI = Date.UTC(2020, 0, 1);

function birlestir(ana: Proje[], ek: SCProje[]): (SCProje & { renk?: string })[] {
  return ana.filter((p) => !p.klasor).map((p) => {
    const e = ek.find((x) => x.id === p.id);
    return {
      id: p.id, ad: p.ad, aciklama: p.aciklama, renk: p.renk,
      talimat: e?.talimat, dosyalar: e?.dosyalar ?? [], sabit: e?.sabit ?? p.sabit,
      olusturma: (p.olusturma ?? 0) > EN_ESKI ? p.olusturma! : e?.olusturma ?? 0,
    };
  });
}

/** Ana projeler + Usta ekleri. */
export function useSCProjeler() {
  const ana = useProje((s) => s.projeler);
  const ek = useSupercomputer((s) => s.projeler);
  return useMemo(() => birlestir(ana, ek), [ana, ek]);
}
export function useSCProje(id?: string) {
  const l = useSCProjeler();
  return id ? l.find((p) => p.id === id) : undefined;
}
export const scProjeler = () => birlestir(useProje.getState().projeler, useSupercomputer.getState().projeler);

/** Yeni proje ana Projeler'de açılır. */
export function scProjeAc(ad: string, aciklama?: string) {
  return useProje.getState().projeOlustur(ad, "Genel", { kaynakStudyo: "Usta", ...(aciklama ? { aciklama } : {}) });
}

export function scProjeGuncelle(id: string, patch: Partial<SCProje>) {
  const { ad, aciklama, talimat, dosyalar, sabit } = patch;
  const anaYama: Partial<Proje> = {};
  if (ad !== undefined) anaYama.ad = ad;
  if (aciklama !== undefined) anaYama.aciklama = aciklama;
  if (sabit !== undefined) anaYama.sabit = sabit;
  if (Object.keys(anaYama).length) useProje.getState().projeGuncelle(id, anaYama);
  if (talimat !== undefined || dosyalar !== undefined || sabit !== undefined || "talimat" in patch) {
    useSupercomputer.setState((s) => {
      const var_ = s.projeler.some((x) => x.id === id);
      const yeni = { ...(talimat !== undefined || "talimat" in patch ? { talimat } : {}), ...(dosyalar !== undefined ? { dosyalar } : {}), ...(sabit !== undefined ? { sabit } : {}) };
      return { projeler: var_ ? s.projeler.map((x) => (x.id === id ? { ...x, ...yeni } : x)) : [...s.projeler, { id, ad: "", dosyalar: [], olusturma: Date.now(), ...yeni }] };
    });
  }
}

export function scProjeSil(id: string) {
  useProje.getState().projeSil(id);
  useSupercomputer.getState().projeSil(id);
}
