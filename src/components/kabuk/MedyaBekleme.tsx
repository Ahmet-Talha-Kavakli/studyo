"use client";

import { useEffect, useLayoutEffect } from "react";
import OLCU from "@/lib/medyaOlcu.json";

const useOncedenEtki = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** public altındaki medyanın bilinen en ve boyu (scripts/medya-olcu.mjs üretir). */
function olcuBul(src: string): [number, number] | null {
  try {
    const yol = decodeURIComponent(new URL(src, location.href).pathname);
    const i = yol.lastIndexOf("/");
    const o = (OLCU as unknown as Record<string, Record<string, [number, number]>>)[yol.slice(0, i + 1)]?.[yol.slice(i + 1)];
    return o ?? null;
  } catch { return null; }
}
import { usePathname } from "next/navigation";

/**
 * Medya bekleme katmanı (iskelet).
 *
 * Sayfadaki her görsel ve video, yüklenene kadar KENDİ kartının yerinde, aynı şekil ve boyutta zarif bir
 * parıltıyla bekler; yüklenince yumuşakça belirir. Ayrı bir "gri kutu" düzeni çizilmez: iskelet gerçek
 * kartın kendisidir, bu yüzden sayısı, yeri ve oranı her zaman gerçek içerikle birebir aynıdır.
 *
 * Nasıl: sayfadaki <img> ve <video> öğeleri izlenir; henüz yüklenmemiş ve kart boyutunda (en az 56 px) olanlara
 * data-yer="bekliyor" verilir. CSS (globals.css, "Medya bekleme") öğeyi gizler, kabına parıltı çizer; yüklenince
 * (ya da hata verince) işaret kalkar ve öğe belirerek gelir. Simgeler ve küçük logolar etkilenmez.
 * Bütün sitede açıktır; yalnız HARIC yollarda kapalı: Usta (kendi kabuğu), kullanıcıların yayınlanan siteleri,
 * gömülü sayfalar ve ajan sohbet kutusu.
 */
const HARIC = [/^\/panel\/supercomputer(\/|$)/, /^\/b\//, /^\/p\/[^/]+\/embed/, /^\/ajan\/[^/]+\/kutu/, /^\/l\//];
export function MedyaBekleme() {
  const yol = usePathname() ?? "";
  const acik = !HARIC.some((r) => r.test(yol));

  // Çizimden önce: sayfadaki medya ilk karede doğru boyutla görünsün.
  useOncedenEtki(() => {
    if (!acik) return;
    const kok = document.body;
    const bitir = (e: HTMLElement) => { if (e.dataset.yer === "bekliyor") { e.dataset.yer = "geldi"; } };

    const isle = (e: Element) => {
      if (!(e instanceof HTMLImageElement || e instanceof HTMLVideoElement)) return;
      const el = e as HTMLElement & { complete?: boolean };
      if (el.dataset.yer || el.closest("header, nav, [data-yer-yok]")) return;
      // Boyutu bilinen medya: görsel gelmeden kartı gerçek oranında tut (taşlı düzen yer değiştirmesin).
      const kaynak = e instanceof HTMLImageElement ? e.currentSrc || e.src : e.currentSrc || e.src || e.querySelector("source")?.src || "";
      const o = kaynak ? olcuBul(kaynak) : null;
      if (o && !e.getAttribute("width") && !e.getAttribute("height")) {
        e.setAttribute("width", String(o[0])); e.setAttribute("height", String(o[1]));
        if (!e.style.aspectRatio) e.style.aspectRatio = `${o[0]} / ${o[1]}`;
      }
      // preload="none" videolar (fareyle oynayan önizlemeler) kendiliğinden yüklenmez: beklenmez.
      if (e instanceof HTMLVideoElement && e.preload === "none") return;
      const hazir = e instanceof HTMLImageElement ? e.complete && e.naturalWidth > 0 : e.readyState >= 2 || !!e.poster;
      if (hazir) return;
      const r = e.getBoundingClientRect();
      if (r.width < 56 || r.height < 56) return;
      el.dataset.yer = "bekliyor";
      const son = () => bitir(el);
      if (e instanceof HTMLImageElement) { e.addEventListener("load", son, { once: true }); e.addEventListener("error", son, { once: true }); }
      else { e.addEventListener("loadeddata", son, { once: true }); e.addEventListener("error", son, { once: true }); }
      // Güvenlik: tembel yüklenen ya da hiç gelmeyen medya parıltıda sonsuza kadar kalmasın.
      window.setTimeout(son, 12_000);
    };
    const tara = (n: ParentNode) => n.querySelectorAll("img, video").forEach(isle);

    tara(kok);
    const gozcu = new MutationObserver((l) => {
      for (const m of l) {
        if (m.type === "attributes" && m.target instanceof HTMLElement) {
          // Kaynak değişti: yeniden bekle.
          if (m.target.dataset.yer) delete m.target.dataset.yer;
          isle(m.target);
          continue;
        }
        m.addedNodes.forEach((d) => { if (d instanceof Element) { isle(d); tara(d); } });
      }
    });
    gozcu.observe(kok, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    return () => gozcu.disconnect();
  }, [acik, yol]);

  return null;
}
