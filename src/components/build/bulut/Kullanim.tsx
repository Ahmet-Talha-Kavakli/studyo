"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Gauge, Loader2, PauseCircle, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Kart } from "@/components/film/ortak";
import { Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, yayinAdresi } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { YiginCubuk } from "./ortak";
import type { BulutBolum } from "./BulutProje";

type Kalem = { id: string; ad: string; kullanilan: number; sinir: number; birim: "adet" | "bayt" | "ms"; donem: "ay" | "gun" | "toplam"; uygulanan: boolean; not?: string; tahmin?: number; uyari?: "dolu" | "yakin" | "asacak" };
type Gun = { gun: string; s: { istek: number; bant: number; fonksiyon: number; ai: number; engel: number; gorsel: number; fonksiyonMs: number } };
type Ozet = { gunler: Gun[]; plan: { ad: string; aciklama: string }; ay: string; kalemler: Kalem[]; gecmis: { ay: string; s: { istek: number; bant: number; fonksiyon: number; ai: number; engel: number } }[]; ayar: { aiDuraklat: boolean; bakim: { acik: boolean; mesaj: string; zaman?: number }; kota: { dolunca: "uyar" | "bakim" } }; ai: { acik: boolean }; duvarEngel: number };
const boyut = (b: number) => (b < 1024 ** 2 ? `${(b / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} KB` : b < 1024 ** 3 ? `${(b / 1024 ** 2).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB` : `${(b / 1024 ** 3).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} GB`);
const deger = (k: Kalem, n: number) => (k.birim === "bayt" ? boyut(n) : k.birim === "ms" ? (n < 60_000 ? `${Math.round(n / 1000)} sn` : n < 3600_000 ? `${Math.round(n / 60_000)} dk` : `${(n / 3600_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} saat`) : n.toLocaleString("tr-TR"));
const GUN_SERI = { istek: { ad: "İstek", renk: "#1e9fcf" }, fonksiyon: { ad: "Fonksiyon çağrısı", renk: "#55d6fd" }, fonksiyonMs: { ad: "Fonksiyon süresi (sn)", renk: "#8be6ff" }, ai: { ad: "Yapay zekâ isteği", renk: "#b8801c" } } as const;
const DONEM = { ay: "aylık kota", gun: "günlük sınır", toplam: "sınır" };
const ayAdi = (a: string) => new Date(`${a}-15T12:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

/** Kullanım çubuğu: yüzde 50 ve 75 eşik çizgileri, renk eşiğe göre (camgöbeği, kehribar, gül). */
function Cubuk({ oran }: { oran: number }) {
  const r = Math.min(1, oran);
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.07]">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(oran > 0 ? 1.5 : 0, r * 100)}%` }} transition={{ type: "spring", stiffness: 120, damping: 22 }} className={cn("absolute inset-y-0 left-0 rounded-full", oran >= 1 ? "bg-[#e8546c]" : oran >= 0.75 ? "bg-[#b8801c]" : "bg-[#1e9fcf]")} />
      {[0.5, 0.75].map((e) => <span key={e} className="absolute inset-y-0 w-px bg-black/50" style={{ left: `${e * 100}%` }} />)}
    </div>
  );
}

/** Bulut > Kullanım: bu ayın istek, bant, fonksiyon, yapay zekâ, depolama, kayıt ve üye kullanımı; duraklatma ve bakım. */
export function Kullanim({ p, git }: { p: Proje; git: (b: BulutBolum) => void }) {
  const [v, setV] = useState<Ozet | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [gunSeri, setGunSeri] = useState<keyof typeof GUN_SERI>("istek");
  const getir = useCallback(() => api<Ozet>(`/api/build/bulut/${p.id}/kullanim`).then((x) => { setV(x); setMesaj(x.ayar.bakim.mesaj); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [p.id]);
  useEffect(() => { getir(); }, [getir]);
  const ayarla = async (g: Record<string, unknown>, ad: string) => {
    setGidiyor(ad); setHata("");
    try { await api(`/api/build/bulut/${p.id}/ayar`, { method: "PATCH", govde: g }); await getir(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
    finally { setGidiyor(null); }
  };
  if (!v) return <div className="flex h-40 items-center justify-center">{hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>;
  const adres = yayinAdresi(p.ayarlar.altAlan);
  const uyari = v.kalemler.filter((k) => k.sinir && k.kullanilan / k.sinir >= 0.5 && !(k.id === "ai" && !v.ai.acik));
  return (
    <div className="space-y-4">
      {v.ayar.bakim.acik && (
        <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-amber-400/[0.07] px-4 py-3 ring-1 ring-inset ring-amber-200/20 sm:px-5">
          <Wrench className="h-4 w-4 shrink-0 text-amber-300" />
          <p className="min-w-0 flex-1 text-[13px] text-amber-100">Site bakım modunda; ziyaretçiler bakım sayfasını görüyor{v.ayar.bakim.zaman ? `, ${new Date(v.ayar.bakim.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} itibarıyla` : ""}.</p>
          <button type="button" onClick={() => ayarla({ bakim: { acik: false } }, "bakim")} className="inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Siteyi aç</button>
        </div>
      )}
      <Kart ikon={Gauge} baslik="Kullanım" alt={`${ayAdi(v.ay)}; aylık kotalar her ayın ilk günü sıfırlanır`}>
        <div className="divide-y divide-white/[0.05]">
          {v.kalemler.map((k) => {
            const oran = k.sinir ? k.kullanilan / k.sinir : 0;
            const esik = oran >= 1 ? 100 : oran >= 0.75 ? 75 : oran >= 0.5 ? 50 : 0;
            const pasif = k.id === "ai" && !v.ai.acik;
            return (
              <div key={k.id} className={cn("px-4 py-3.5 sm:px-5", pasif && "opacity-55")}>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-[13.5px] font-medium text-white">{k.ad}</p>
                  <p className="text-[12.5px] tabular-nums text-white/60"><span className="text-white">{deger(k, k.kullanilan)}</span>, {DONEM[k.donem]} {deger(k, k.sinir)}</p>
                  {k.uyari === "asacak" && !pasif && <span className="rounded-full bg-amber-400/[0.12] px-2 py-0.5 text-[11px] font-medium text-amber-200">Bu hızla ay sonunda aşacak</span>}
                  {esik > 0 && !pasif && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", esik === 100 ? "bg-rose-500/[0.14] text-rose-200" : esik === 75 ? "bg-amber-400/[0.12] text-amber-200" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}>{esik === 100 ? "Doldu" : `Yüzde ${esik}'i geçti`}</span>}
                  <span className="ml-auto text-[11.5px] text-white/40">{k.uygulanan ? "Sınır uygulanır" : "Kota, aşılınca bildirim gelir"}</span>
                </div>
                <div className="relative"><Cubuk oran={oran} />{k.tahmin !== undefined && k.tahmin > k.kullanilan && <span title={`Ay sonu tahmini ${deger(k, k.tahmin)}`} className="pointer-events-none absolute inset-y-0 rounded-full bg-white/[0.12]" style={{ left: `${Math.min(100, oran * 100)}%`, width: `${Math.max(0, Math.min(100, (k.tahmin / Math.max(1, k.sinir)) * 100) - Math.min(100, oran * 100))}%` }} />}</div>
                <p className="mt-1.5 text-[12px] text-white/45">{oran > 0 && oran < 0.01 ? "Yüzde 1'den az kullanıldı" : `Yüzde ${Math.min(999, Math.round(oran * 100))} kullanıldı`}{k.tahmin !== undefined ? `; ay sonu tahmini ${deger(k, k.tahmin)}` : ""}{k.not ? `. ${k.not}` : ""}</p>
              </div>
            );
          })}
        </div>
        {uyari.length > 0 && <p className="flex items-start gap-2 border-t border-white/[0.06] px-4 py-3 text-[12.5px] text-white/60 sm:px-5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />Yüzde 50, 75 ve 100 eşiklerinde Genel bakıştaki bildirimlere kayıt düşer.<button type="button" onClick={() => git("genel")} className="ml-1 text-[#8be6ff] hover:underline">Bildirimlere git</button></p>}
      </Kart>

      <Kart ikon={Gauge} baslik="Son 30 gün" alt="Gün gün kullanım; tahminler son 7 günün ortalamasıyla" govde="p-4 sm:p-5"
        sag={<div className="flex flex-wrap justify-end gap-1 max-sm:hidden">{(Object.keys(GUN_SERI) as (keyof typeof GUN_SERI)[]).map((s) => <button key={s} type="button" onClick={() => setGunSeri(s)} aria-pressed={gunSeri === s} className={cn("h-8 rounded-full px-3 text-[12px]", gunSeri === s ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "text-white/55 hover:text-white")}>{GUN_SERI[s].ad}</button>)}</div>}>
        <div className="mb-3 flex flex-wrap gap-1 sm:hidden">{(Object.keys(GUN_SERI) as (keyof typeof GUN_SERI)[]).map((s) => <button key={s} type="button" onClick={() => setGunSeri(s)} aria-pressed={gunSeri === s} className={cn("h-8 rounded-full px-3 text-[12px]", gunSeri === s ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "text-white/55")}>{GUN_SERI[s].ad}</button>)}</div>
        <YiginCubuk veri={v.gunler.map((g) => ({ z: new Date(`${g.gun}T12:00:00`).getTime(), d: gunSeri === "fonksiyonMs" ? Math.round((g.s.fonksiyonMs ?? 0) / 1000) : g.s[gunSeri] ?? 0 }))} seriler={[{ anahtar: "d", ad: GUN_SERI[gunSeri].ad, renk: GUN_SERI[gunSeri].renk }]} yukseklik={140}
          etiket={(z) => new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ipucuBaslik={(z) => new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })} />
      </Kart>

      <Kart ikon={Gauge} baslik={`Sınırlar: ${v.plan.ad}`} alt={v.plan.aciklama}>
        <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-[12.5px]"><thead><tr className="border-b border-white/[0.06] text-left text-white/45"><th className="px-5 py-2 font-normal">Kalem</th><th className="px-3 py-2 text-right font-normal">Sınır</th><th className="px-3 py-2 font-normal">Dönem</th><th className="px-5 py-2 font-normal">Aşılınca</th></tr></thead>
          <tbody>{v.kalemler.map((k) => <tr key={k.id} className="border-b border-white/[0.04] last:border-0"><td className="px-5 py-2 text-white/85">{k.ad}</td><td className="px-3 py-2 text-right tabular-nums text-white">{deger(k, k.sinir)}</td><td className="px-3 py-2 text-white/55">{k.donem === "ay" ? "Takvim ayı" : k.donem === "gun" ? "Gün" : "Toplam"}</td><td className="px-5 py-2 text-white/55">{k.uygulanan ? "İşlem reddedilir" : v.ayar.kota.dolunca === "bakim" && ["istek", "bant", "fonksiyon"].includes(k.id) ? "Bildirim, site bakım moduna geçer" : "Bildirim gelir, site çalışır"}</td></tr>)}</tbody></table></div>
      </Kart>

      <div className="grid gap-4 xl:grid-cols-2">
        <Kart ikon={PauseCircle} baslik="Duraklat ve koru" alt="Hemen geçerli olur; yeniden yayın gerekmez">
          <div className="divide-y divide-white/[0.05]">
            <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1"><p className="text-[13.5px] font-medium text-white">Yapay zekâyı duraklat</p><p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{!v.ai.acik ? "Sitede yapay zekâ zaten kapalı." : v.ayar.aiDuraklat ? "Duraklatıldı: sitenin yapay zekâ istekleri reddediliyor, ayarların korunuyor." : "Site vayra.ai ile metin ve görsel üretebiliyor. Duraklatınca istekler geçici olarak reddedilir."}</p></div>
              {gidiyor === "ai" ? <Loader2 className="mt-1 h-4 w-4 animate-spin text-white/40" /> : <Anahtar acik={v.ayar.aiDuraklat} set={(x) => ayarla({ aiDuraklat: x }, "ai")} etiket="Yapay zekâyı duraklat" />}
            </div>
            <div className="space-y-2.5 px-4 py-3.5 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1"><p className="text-[13.5px] font-medium text-white">Siteyi bakım moduna al</p><p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">Ziyaretçiler sitenin yerine kısa bir bakım sayfası görür (503); fonksiyonlar da durur. Veri ve dosyalar etkilenmez.</p></div>
                {gidiyor === "bakim" ? <Loader2 className="mt-1 h-4 w-4 animate-spin text-white/40" /> : <Anahtar acik={v.ayar.bakim.acik} set={(x) => ayarla({ bakim: { acik: x, mesaj } }, "bakim")} etiket="Bakım modu" />}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input value={mesaj} onChange={(e) => setMesaj(e.target.value)} onBlur={() => mesaj !== v.ayar.bakim.mesaj && ayarla({ bakim: { mesaj } }, "mesaj")} maxLength={300} placeholder="Bakım sayfası mesajı (boşsa varsayılan)" className={cn(alanSinif, "h-10 min-w-0 flex-1 text-[13px]")} />
                {v.ayar.bakim.acik && p.yayin && <a href={adres.tam} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><ExternalLink className="h-3.5 w-3.5" />Sayfayı gör</a>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-[200px] flex-1"><p className="text-[13.5px] font-medium text-white">Aylık kota dolunca</p><p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">İstek, bant ya da fonksiyon kotası dolduğunda</p></div>
              <Secici id="kota-dolunca" kucuk deger={v.ayar.kota.dolunca} set={(x) => ayarla({ kota: { dolunca: x } }, "kota")} l={[{ id: "uyar", ad: "Yalnız bildir" }, { id: "bakim", ad: "Bakım moduna al" }]} />
            </div>
          </div>
          {hata && <p className="border-t border-white/[0.06] px-5 py-2.5 text-[12.5px] text-rose-300">{hata}</p>}
        </Kart>
        <Kart ikon={Gauge} baslik="Son 6 ay" alt="Aylık istek sayısı" govde="p-4 sm:p-5">
          <YiginCubuk veri={v.gecmis.map((g) => ({ z: new Date(`${g.ay}-01T12:00:00`).getTime(), istek: g.s.istek }))} seriler={[{ anahtar: "istek", ad: "İstek", renk: "#1e9fcf" }]} yukseklik={150}
            etiket={(z) => new Date(z).toLocaleDateString("tr-TR", { month: "short" })} ipucuBaslik={(z) => { const g = v.gecmis.find((x) => new Date(`${x.ay}-01T12:00:00`).getTime() === z); return `${new Date(z).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}${g ? `, ${boyut(g.s.bant)} bant, ${g.s.fonksiyon.toLocaleString("tr-TR")} fonksiyon` : ""}`; }} />
          {v.duvarEngel > 0 && <p className="mt-3 text-[12px] text-white/50">Bu ay güvenlik duvarı {v.duvarEngel.toLocaleString("tr-TR")} isteği engelledi ya da sınava aldı.</p>}
        </Kart>
      </div>
    </div>
  );
}
