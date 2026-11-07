"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BuildHero, type HeroTur } from "@/components/build/ana/BuildHero";
import { sohbetBaslat } from "@/components/build/sohbet/SohbetEkrani";
import { ElindekiyleBasla, Projeler, Sablonlar } from "@/components/build/ana/Bolumler";
import { DevamKarti } from "@/components/build/ana/DevamKarti";
import type { KomutEki } from "@/components/build/Komut";
import type { AjanMod } from "@/lib/build/ajan";
import { ApiHatasi, projeleriGetir, projeOlustur } from "@/lib/build/istemci";
import { BUILD_MODELLERI, VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { PROJE_TURLERI, type ProjeOzet, type ProjeTur } from "@/lib/build/tipler";

function oku<T>(k: string, v: T): T { try { const x = localStorage.getItem(k); return x ? (JSON.parse(x) as T) : v; } catch { return v; } }

/** Görseli 1600 px'e küçültüp data URL yapar (ekran görüntüsünden başla). */
async function gorselEki(f: File): Promise<KomutEki | null> {
  if (!f.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, red) => { const i = new Image(); i.onload = () => ok(i); i.onerror = red; i.src = url; });
    const o = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return { tur: "gorsel", url: c.toDataURL("image/jpeg", 0.86), ad: f.name || "görsel" };
  } catch { return null; } finally { URL.revokeObjectURL(url); }
}

/**
 * Vayra Build ana sayfası: akan proje duvarlı hero + cam komut kutusu, elindekiyle başla (adres, görsel, zip),
 * projelerin (ara, süz, menü), şablon galerisi (canlı önizle, kullan).
 */
function BuildAna() {
  const router = useRouter();
  const ara = useSearchParams();
  const kutu = useRef<HTMLDivElement>(null);
  const [tur, setTur] = useState<HeroTur>("site");
  const [deger, setDeger] = useState("");
  const [mod, setMod] = useState<AjanMod>("yap");
  const [model, setModel] = useState(VARSAYILAN_MODEL);
  const [ekler, setEkler] = useState<KomutEki[]>([]);
  const [tasarimIste, setTasarimIste] = useState(false);
  const [baglantilar, setBaglantilar] = useState<Record<string, string | null>>();
  const [projeler, setProjeler] = useState<ProjeOzet[] | null>(null);
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState<string | null>(null);

  const yenile = useCallback(() => { projeleriGetir().then(setProjeler).catch(() => setProjeler([])); }, []);
  useEffect(() => {
    setModel(oku("vayra-build-model", VARSAYILAN_MODEL));
    /* ?model= (üst çubuktaki vitrin ve komut paleti): o model seçili açılır ve tercih olarak saklanır. */
    const am = ara.get("model");
    if (am && BUILD_MODELLERI.some((x) => x.id === am)) modelSec(am);
    const t = ara.get("tur");
    if (t && (t === "sohbet" || PROJE_TURLERI.some((x) => x.id === t))) setTur(t as HeroTur);
    const istem = ara.get("istem");
    if (istem) setDeger(istem.slice(0, 4000));
    yenile();
    fetch("/api/build/modeller").then((r) => r.json()).then((v) => setBaglantilar(v.baglantilar)).catch(() => {});
  }, [ara, yenile]);

  const modelSec = (m: string) => { setModel(m); try { localStorage.setItem("vayra-build-model", JSON.stringify(m)); } catch { /* özel pencere */ } };
  const kutuyaGit = () => {
    const r = kutu.current?.getBoundingClientRect();
    if (r) scrollTo({ top: scrollY + r.top - 140, behavior: "smooth" });
    setTimeout(() => kutu.current?.querySelector("textarea")?.focus({ preventScroll: true }), 350);
  };

  const basla = async () => {
    if (gidiyor) return;
    setHata(""); setGidiyor("yeni");
    if (tur === "sohbet") {
      if (!deger.trim() && !ekler.length) { setGidiyor(null); return; }
      try { router.push(`/panel/build/sohbet/${await sohbetBaslat(deger.trim(), ekler, model)}`); }
      catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Sohbet açılamadı. Bağlantını kontrol et."); setGidiyor(null); }
      return;
    }
    try {
      const id = await projeOlustur({ tur: tur as ProjeTur, istem: deger });
      try { sessionStorage.setItem(`vayra-build-ilk-${id}`, JSON.stringify({ istem: deger, mod, model, ekler, tasarimIste })); } catch { /* büyük ekler */ }
      router.push(`/panel/build/${id}`);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Proje oluşturulamadı. Bağlantını kontrol et."); setGidiyor(null); }
  };
  const remix = async (sablon: string) => {
    if (gidiyor) return;
    setGidiyor(sablon);
    try { router.push(`/panel/build/${await projeOlustur({ sablon })}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Şablon açılamadı."); setGidiyor(null); }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <BuildHero tur={tur} setTur={setTur} deger={deger} setDeger={setDeger} gonder={basla} mod={mod} setMod={setMod} model={model} setModel={modelSec}
        baglantilar={baglantilar} ekler={ekler} setEkler={setEkler} gidiyor={gidiyor === "yeni"} hata={hata} kutuRef={kutu} tasarimIste={tasarimIste} setTasarimIste={setTasarimIste} />
      <div className="relative mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-4 sm:px-6">
        {/* Proje yokken boş kart gösterilmez: üretim noktası hero'daki kutu. */}
        {projeler !== null && projeler.length > 0 && <DevamKarti projeler={projeler} />}
        {projeler !== null && projeler.length > 0 && <div id="projeler" className="scroll-mt-6"><Projeler projeler={projeler.slice(0, 7)} toplam={projeler.length} yenile={yenile} yeni={kutuyaGit} ozet /></div>}
        <ElindekiyleBasla ekranGoruntusu={async (f) => {
          const e = await gorselEki(f);
          if (!e) return;
          setEkler([e]);
          if (!deger.trim()) setDeger("Bu görseldeki tasarıma benzeyen bir site yap; düzeni, renkleri ve yazı tiplerini örnek al.");
          kutuyaGit();
        }} />
        <div id="sablonlar" className="scroll-mt-6"><Sablonlar kullan={remix} gidiyor={gidiyor} ozet /></div>
      </div>
    </div>
  );
}

export default function BuildSayfasi() {
  return <Suspense fallback={null}><BuildAna /></Suspense>;
}
