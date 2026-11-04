"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { useScGorev, sonrakiZaman, type ScGorev } from "@/lib/scGorev";
import { SC_VARSAYILAN_MODEL, bosYanit, olayUygula, sohbetAkisi, yanitMetni, type ScOlay } from "@/lib/scSohbet";
import { useSupercomputer } from "@/store/useSupercomputer";
import { kisiselBaglam } from "@/store/useHafiza";
import { useScTercih } from "@/store/useScTercih";

/**
 * Zamanı gelen görevleri çalıştırır (Usta sayfalarında, sekme açıkken).
 * Her çalışma yeni bir sohbet açar; birden çok sekmede aynı görevin iki kez çalışmaması için localStorage kilidi kullanılır.
 */
const calisan = new Set<string>();

/** @param elle "Şimdi çalıştır": zamanlamaya dokunmaz. */
export async function calistir(g: ScGorev, ac: (id: string) => void, elle = false) {
  if (calisan.has(g.id)) return;
  const kilit = `sc-gorev-kilit:${g.id}:${elle ? `elle-${Date.now()}` : g.sonraki}`;
  try { if (localStorage.getItem(kilit)) return; localStorage.setItem(kilit, "1"); } catch { /* depolama kapalı */ }
  calisan.add(g.id);
  const simdi = Date.now();
  const st = useScGorev.getState();
  if (!elle) st.guncelle(g.id, g.siklik === "bir" ? { acik: false, sonraki: null, sonCalisma: simdi } : { sonraki: sonrakiZaman(g, simdi), sonCalisma: simdi });
  const sc = useSupercomputer.getState();
  const id = sc.sohbetAc(`${g.baslik} · ${new Date(simdi).toLocaleDateString("tr", { day: "numeric", month: "short" })}`);
  sc.mesajEkle(id, { rol: "kullanici", metin: g.istem });
  const mid = sc.mesajEkle(id, { rol: "ajan", metin: "", yanit: bosYanit() });
  sc.calisiyorAyarla(id, true);
  let y = bosYanit();
  try {
    await sohbetAkisi({ mesajlar: [{ rol: "kullanici", metin: `${g.istem}\n\n(Bu, kullanıcının zamanladığı "${g.baslik}" görevidir; ${new Date(simdi).toLocaleString("tr")} itibarıyla yanıtla.)` }], model: SC_VARSAYILAN_MODEL, dusun: false, web: g.web, stil: "normal", kisisel: kisiselBaglam() },
      (o: ScOlay) => { y = olayUygula(y, o); }, () => { y = { ...y, demo: true }; }, new AbortController().signal);
  } catch { y = { ...y, durum: "hata", hata: "Görev çalıştırılamadı." }; }
  if (y.durum === "akiyor") y = { ...y, durum: "bitti" };
  useSupercomputer.getState().mesajGuncelle(id, mid, { yanit: y });
  useSupercomputer.getState().calisiyorAyarla(id, false);
  useScGorev.getState().guncelle(g.id, { sonSohbet: id, sonCalisma: simdi, calismaSayisi: (useScGorev.getState().gorevler.find((x) => x.id === g.id)?.calismaSayisi ?? 0) + 1 });
  calisan.delete(g.id);
  const ozet = y.demo ? "Model bağlı değil, örnek yanıt üretildi." : yanitMetni(y).replace(/[#*_`>|]/g, "").replace(/\s+/g, " ").slice(0, 120);
  toast.success("Görev tamamlandı", { description: `${g.baslik}: ${ozet || "Sonuç hazır."}`, action: { label: "Aç", onClick: () => ac(id) } });
  if (document.hidden && useScTercih.getState().bildirim && "Notification" in window && Notification.permission === "granted") {
    const n = new Notification(`Görev tamamlandı: ${g.baslik}`, { body: ozet || "Sonuç hazır.", icon: "/icon.svg", tag: `sc-gorev-${g.id}` });
    n.onclick = () => { window.focus(); ac(id); n.close(); };
  }
}

export function GorevCalistirici() {
  const router = useRouter();
  useEffect(() => {
    const ac = (id: string) => router.push(`/panel/supercomputer/${id}`);
    const kontrol = () => {
      const simdi = Date.now();
      for (const g of useScGorev.getState().gorevler) if (g.acik && g.sonraki && g.sonraki <= simdi && !calisan.has(g.id)) void calistir(g, ac);
    };
    kontrol();
    const z = setInterval(kontrol, 20000);
    document.addEventListener("visibilitychange", kontrol);
    return () => { clearInterval(z); document.removeEventListener("visibilitychange", kontrol); };
  }, [router]);
  return null;
}
