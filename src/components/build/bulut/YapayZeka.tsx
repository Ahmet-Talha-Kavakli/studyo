"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Code2, ImageIcon, Loader2, MessageSquareText, ScrollText, Sparkles } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, KodKutusu, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import type { ProjeKanca } from "@/components/build/calisma/useProje";
import { api, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";

type Ayar = { acik: boolean; gunlukSinir: number; sistem: string };
type Gun = { gun: string; metin: number; gorsel: number; hata: number };
type Durum = { ayar: Ayar; kullanim: Gun & { gecmis: Gun[] }; motor: { metin: string | null; gorsel: boolean } };
type Gunluk = { z: number; d?: number; ms?: number; m?: string };
const SINIRLAR = ["100", "500", "2000"] as const;

/** Bulut > Yapay zekâ: sitenin vayra.ai geçidi (aç/kapat, günlük sınır, site talimatı), kullanım, son istekler, kod. */
export function YapayZeka({ k }: { k: ProjeKanca }) {
  const p = k.proje!;
  const [d, setD] = useState<Durum | null>(null);
  const [l, setL] = useState<Gunluk[]>([]);
  const [ayar, setAyar] = useState<Ayar | null>(null);
  const [ozelSinir, setOzelSinir] = useState(false);
  const [durum, setDurum] = useState<"" | "k" | "ok">("");
  const getir = useCallback(async () => {
    const [v, g] = await Promise.all([api<Durum>(`/api/build/ai/${p.id}/durum`).catch(() => null), api<{ gunlukler: Gunluk[] }>(`/api/build/bulut/${p.id}/gunluk?tur=ai&gun=7`).catch(() => ({ gunlukler: [] }))]);
    if (v) { setD(v); setAyar((a) => a ?? v.ayar); setOzelSinir((o) => o || !SINIRLAR.includes(String(v.ayar.gunlukSinir) as never)); }
    setL(g.gunlukler);
  }, [p.id]);
  useEffect(() => { getir(); }, [getir]);
  const kaydet = async (a: Ayar) => {
    setAyar(a); setDurum("k");
    try { await k.guncelle({ ayarlar: { ...p.ayarlar, ai: a } }); setDurum("ok"); setTimeout(() => setDurum(""), 1500); getir(); } catch { setDurum(""); }
  };
  if (!d || !ayar) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;

  const bugun = d.kullanim.metin + d.kullanim.gorsel;
  const oran = Math.min(1, bugun / Math.max(1, ayar.gunlukSinir));
  const kayitlar = [{ gun: d.kullanim.gun, metin: d.kullanim.metin, gorsel: d.kullanim.gorsel, hata: d.kullanim.hata }, ...d.kullanim.gecmis];
  const gunler = Array.from({ length: 7 }, (_, i) => { const g = new Date(Date.parse(d.kullanim.gun) - (6 - i) * 864e5).toISOString().slice(0, 10); return kayitlar.find((x) => x.gun === g) ?? { gun: g, metin: 0, gorsel: 0, hata: 0 }; });
  const enCok = Math.max(1, ...gunler.map((g) => g.metin + g.gorsel));
  const basari = l.length ? Math.round((l.filter((x) => (x.d ?? 200) < 400).length / l.length) * 100) : null;
  const ortSure = l.length ? Math.round(l.reduce((t, x) => t + (x.ms ?? 0), 0) / l.length) : null;

  return (
    <div className="space-y-4">
      <Kart ikon={Sparkles} baslik="Yapay zekâ geçidi" alt="Sitendeki kod vayra.ai ile metin ve görsel üretir; API anahtarı gerekmez"
        sag={<span className="flex items-center gap-2.5"><span className="text-[12.5px] text-white/55 max-sm:hidden">{ayar.acik ? "Ziyaretçilere açık" : "Yalnız önizlemede"}</span><Anahtar acik={ayar.acik} set={(v) => kaydet({ ...ayar, acik: v })} etiket="Yapay zekâ geçidi" /></span>}>
        <div className="grid grid-cols-2 gap-px overflow-hidden bg-white/[0.05] lg:grid-cols-4">
          {[
            ["Bugün", `${bugun.toLocaleString("tr-TR")} istek`, `${ayar.gunlukSinir.toLocaleString("tr-TR")} sınırından`],
            ["Başarı", basari === null ? "Henüz yok" : `yüzde ${basari}`, "Son 7 gün"],
            ["Ortalama süre", ortSure === null ? "Henüz yok" : `${(ortSure / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn`, "Son 7 gün"],
            ["Motor", d.motor.metin ?? "Bağlı değil", d.motor.metin ? "Metin; görsel Vayra stüdyosundan" : "Yönetici anahtar eklemeli"],
          ].map(([a, b, c]) => (
            <div key={a} className="bg-[#141518] px-4 py-3.5">
              <p className="text-[12px] text-white/45">{a}</p>
              <p className={cn("mt-0.5 text-[17px] font-semibold", a === "Motor" && !d.motor.metin ? "text-amber-200" : "text-white")}>{b}</p>
              <p className="text-[11.5px] text-white/40">{c}</p>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4 pt-3 sm:px-5">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className={cn("h-full rounded-full", oran >= 0.9 ? "bg-amber-300" : "bg-[#55d6fd]")} style={{ width: `${Math.max(2, oran * 100)}%` }} /></div>
          {!d.motor.metin && <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-amber-100/80"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Bu sunucuda metin motoru bağlı değil; istekler hata döner. Yönetici ANTHROPIC_API_KEY ya da OPENROUTER_API_KEY eklediğinde kendiliğinden çalışır.</p>}
        </div>
      </Kart>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Kart ikon={MessageSquareText} baslik="Ayarlar" alt="Ziyaretçilerin kullanımına sınır ve yön ver" govde="space-y-4 p-4 sm:p-5">
          <div>
            <p className="mb-2 text-[12.5px] text-white/55">Günlük istek sınırı</p>
            <div className="flex flex-wrap items-center gap-2">
              <Secici id="ai-sinir" deger={ozelSinir ? "ozel" : String(ayar.gunlukSinir)} set={(v) => { if (v === "ozel") setOzelSinir(true); else { setOzelSinir(false); kaydet({ ...ayar, gunlukSinir: Number(v) }); } }} l={[...SINIRLAR.map((x) => ({ id: x, ad: Number(x).toLocaleString("tr-TR") })), { id: "ozel", ad: "Özel" }]} />
              {ozelSinir && <input type="number" min={1} defaultValue={ayar.gunlukSinir} onBlur={(e) => kaydet({ ...ayar, gunlukSinir: Math.max(1, Number(e.target.value) || 1) })} className={cn(alanSinif, "h-9 w-[120px] text-[13px]")} />}
            </div>
            <p className="mt-1.5 text-[12px] text-white/40">Sınır dolunca site o gün için nazik bir hata alır. Önizlemedeki denemelerin sayılır ama sınıra takılmaz.</p>
          </div>
          <div>
            <p className="mb-2 text-[12.5px] text-white/55">Site talimatı</p>
            <textarea value={ayar.sistem} onChange={(e) => setAyar({ ...ayar, sistem: e.target.value })} rows={4} maxLength={4000} placeholder="Yalnız kahve, menü ve rezervasyon hakkında konuş; fiyat sorulursa menü sayfasına yönlendir." className={cn(alanSinif, "resize-y py-2.5 text-[13.5px]")} />
            <div className="mt-2 flex items-center justify-between"><p className="text-[12px] text-white/40">Her isteğin başına eklenir, sitenin kodundaki talimatın üstündedir.</p>
              <button type="button" onClick={() => kaydet(ayar)} disabled={durum === "k"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-50">{durum === "k" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{durum === "ok" ? "Kaydedildi" : "Kaydet"}</button></div>
          </div>
        </Kart>
        <Kart ikon={ScrollText} baslik="Son 7 gün" alt="Günlük istek sayısı" govde="p-4 sm:p-5">
          <div className="flex h-[150px] items-end gap-2">
            {gunler.map((g) => (
              <div key={g.gun} className="flex flex-1 flex-col items-center gap-1.5" title={`${g.metin} metin, ${g.gorsel} görsel, ${g.hata} hata`}>
                <span className="text-[11px] tabular-nums text-white/50">{g.metin + g.gorsel || ""}</span>
                <div className="flex w-full max-w-[34px] flex-1 flex-col justify-end"><div className="w-full rounded-t-[4px] bg-[#55d6fd]" style={{ height: `${((g.metin + g.gorsel) / enCok) * 100}%`, minHeight: 2 }} /></div>
                <span className="text-[11px] text-white/40">{new Date(g.gun).toLocaleDateString("tr-TR", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </Kart>
      </div>

      <Kart ikon={ScrollText} baslik="Son istekler" alt={l.length ? `${l.length} istek, son 7 gün` : "Henüz istek yok"}>
        {l.length ? (
          <div className="max-h-[320px] divide-y divide-white/[0.05] overflow-y-auto [scrollbar-width:thin]">
            {l.slice(0, 60).map((x, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px] sm:px-5">
                {x.m?.startsWith("Görsel") ? <ImageIcon className="h-3.5 w-3.5 shrink-0 text-white/40" /> : <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-white/40" />}
                <span className="min-w-0 flex-1 truncate text-white/75">{x.m}</span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", (x.d ?? 200) >= 400 ? "bg-rose-500/[0.12] text-rose-200" : "bg-[#55d6fd]/[0.1] text-[#8be6ff]")}>{(x.d ?? 200) >= 400 ? "Hata" : "Başarılı"}</span>
                <span className="w-[54px] shrink-0 text-right tabular-nums text-white/40">{x.ms ? `${(x.ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn` : ""}</span>
                <span className="w-[86px] shrink-0 text-right text-white/35 max-sm:hidden">{gorece(x.z)}</span>
              </div>
            ))}
          </div>
        ) : <p className="px-5 py-4 text-[13px] text-white/50">Sitedeki kod vayra.ai çağırdığında istekler burada görünür.</p>}
      </Kart>

      <Kart ikon={Code2} baslik="Sitede kullan" alt="Build ajanı bu kodu kendisi yazar; &quot;siteye yapay zekâ asistanı ekle&quot; demen yeter" govde="space-y-3 p-4 sm:p-5">
        <KodKutusu kod={`// Metin: tek soru ya da sohbet geçmişi
const yanit = await vayra.ai.sohbet("Bu kahve için iki cümlelik tadım notu yaz: Etiyopya Yirgacheffe");
const devam = await vayra.ai.sohbet([
  { rol: "kullanici", metin: "Hafta sonu açık mısınız?" },
], { sistem: "Kafenin çalışma saatleri hafta içi 8-20, hafta sonu 9-22.", enCok: 400 });

// Görsel
const url = await vayra.ai.gorsel("minimal seramik kahve fincanı, sabah ışığı", { oran: "1:1" });`} />
      </Kart>
    </div>
  );
}
