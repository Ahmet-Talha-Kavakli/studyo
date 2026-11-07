"use client";

import { useState } from "react";
import { FileJson, Loader2, Plug, ShieldCheck } from "lucide-react";
import { Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { HataKutusu, type BaglantiAcik } from "./ortak";

type Yetki = "yok" | "bearer" | "baslik" | "sorgu" | "temel";

/**
 * REST API bağlantısı: OpenAPI ya da Swagger belgesinin adresi, yapıştırılan belge (JSON ya da YAML) ya da yalnız kök
 * adres (uç noktalar sonra elle eklenir). Kimlik biçimi belgede tanımlıysa ondan okunur; burada seçilen ezmez.
 */
export function RestEkle({ eklendi }: { eklendi: (b: BaglantiAcik) => void }) {
  const [kaynak, setKaynak] = useState<"adres" | "belge" | "elle">("adres");
  const [adres, setAdres] = useState("");
  const [belge, setBelge] = useState("");
  const [taban, setTaban] = useState("");
  const [ad, setAd] = useState("");
  const [yetki, setYetki] = useState<Yetki>("bearer");
  const [anahtarAd, setAnahtarAd] = useState("X-API-Key");
  const [anahtar, setAnahtar] = useState("");
  const [kullanici, setKullanici] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const hazir = (kaynak === "adres" ? /^https?:\/\/\S+/.test(adres.trim()) : kaynak === "belge" ? belge.trim().length > 20 : /^https?:\/\/[^\s/]+/.test(taban.trim()))
    && (yetki === "yok" || anahtar.trim().length > 0) && (!["baslik", "sorgu"].includes(yetki) || kaynak !== "elle" || anahtarAd.trim().length > 0);
  const ekle = async () => {
    setGidiyor(true); setHata("");
    try {
      const v = await api<{ baglanti: BaglantiAcik }>("/api/build/baglantilar", { govde: {
        ad: ad.trim() || undefined,
        rest: { ...(kaynak === "adres" ? { openapi: adres.trim() } : kaynak === "belge" ? { belge } : {}), ...(taban.trim() ? { taban: taban.trim() } : {}), yetki, anahtarAd: anahtarAd.trim() || undefined },
        alanlar: yetki === "temel" ? { kullanici, sifre: anahtar } : yetki === "yok" ? {} : { anahtar },
      } });
      eklendi(v.baglanti);
      setAdres(""); setBelge(""); setTaban(""); setAd(""); setAnahtar(""); setKullanici("");
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); }
    finally { setGidiyor(false); }
  };
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] leading-relaxed text-white/55">Resmî MCP sunucusu olmayan bir servisi ya da kendi API'ni bağla. Vayra OpenAPI belgesindeki her işlemi bir araca çevirir; GET işlemleri okuma, diğerleri yazma aracı olur ve onay ister.</p>
      <Secici id="rest-kaynak" deger={kaynak} set={setKaynak} l={[{ id: "adres", ad: "OpenAPI adresi" }, { id: "belge", ad: "Belgeyi yapıştır" }, { id: "elle", ad: "Elle" }]} />
      {kaynak === "adres" && <input value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="https://api.servis.com/openapi.json" spellCheck={false} className={cn(alanSinif, "h-11 font-mono text-[13px]")} />}
      {kaynak === "belge" && <textarea value={belge} onChange={(e) => setBelge(e.target.value)} rows={6} spellCheck={false} placeholder="openapi: 3.0.0 ile başlayan YAML ya da JSON belgesi" className={cn(alanSinif, "resize-y py-2.5 font-mono text-[12px] leading-relaxed")} />}
      <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
        <input value={taban} onChange={(e) => setTaban(e.target.value)} placeholder={kaynak === "elle" ? "API kök adresi, ör. https://api.servis.com/v1" : "Kök adres (belgedekinden farklıysa)"} spellCheck={false} className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} />
        <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Ad (isteğe bağlı)" className={cn(alanSinif, "h-10 text-[13px]")} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[12.5px] text-white/50">Kimlik</span>
        <Secici id="rest-yetki" kucuk deger={yetki} set={setYetki} l={[{ id: "bearer", ad: "Bearer" }, { id: "baslik", ad: "Başlıkta anahtar" }, { id: "sorgu", ad: "Sorguda anahtar" }, { id: "temel", ad: "Kullanıcı ve şifre" }, { id: "yok", ad: "Yok" }]} />
      </div>
      {yetki !== "yok" && (
        <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
          {(yetki === "baslik" || yetki === "sorgu") && <input value={anahtarAd} onChange={(e) => setAnahtarAd(e.target.value.replace(/[^\w.-]/g, ""))} placeholder={yetki === "baslik" ? "Başlık adı" : "Parametre adı"} className={cn(alanSinif, "h-10 text-[13px]")} />}
          {yetki === "temel" && <input value={kullanici} onChange={(e) => setKullanici(e.target.value)} autoComplete="off" placeholder="Kullanıcı adı" className={cn(alanSinif, "h-10 text-[13px]")} />}
          <input value={anahtar} onChange={(e) => setAnahtar(e.target.value)} type="password" autoComplete="off" placeholder={yetki === "temel" ? "Şifre ya da API anahtarı" : yetki === "bearer" ? "Erişim belirteci" : "Anahtar"} className={cn(alanSinif, "h-10 font-mono text-[13px]", yetki === "bearer" && "sm:col-span-2")} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <p className="flex flex-1 items-start gap-1.5 text-[12px] text-white/40"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Anahtar şifreli kasada kalır; istekler Vayra sunucusundan gider.</p>
        <button type="button" onClick={ekle} disabled={!hazir || gidiyor} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : kaynak === "elle" ? <Plug className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}{kaynak === "elle" ? "Bağlantıyı kur" : "Araçları üret"}</button>
      </div>
      {hata && <HataKutusu>{hata}</HataKutusu>}
    </div>
  );
}
