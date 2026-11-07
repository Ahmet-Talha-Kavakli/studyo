"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Gauge, Layers, Loader2, RotateCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim, Anahtar, KodKutusu, Secici } from "./AjanDuzenleyici";
import { birincil, ikincil, saatYaz, type Ajan } from "./ortak";

type Kol = { surum: number; konusma: number; devir: number; hata: number; csat: number | null };
type Rapor = { yeni: Kol; eski: Kol; karar: "yetersiz" | "iyi" | "geri-al"; neden: string } | null;
const yz = (x: number) => `yüzde ${Math.round(x * 100)}`;

/** Taslak, deneme ortamı ve canlı; kademeli yayın (yüzdeli, plan adımlı, koruma eşikli, anında geri alma). */
export function OrtamKarti({ a, islem, gidiyor, anahtar }: { a: Ajan; islem: (g: Record<string, unknown>) => Promise<void>; gidiyor: string | null; anahtar: string | null }) {
  const yayinda = a.yayin.durum === "yayinda";
  const dn = a.yayin.ortam?.deneme;
  const kd = a.yayin.kademe;
  const [aday, setAday] = useState("taslak");
  const [denemeAday, setDenemeAday] = useState("taslak");
  const [plan, setPlan] = useState("10-25-50-100");
  const [otomatik, setOtomatik] = useState(false);
  const [koruma, setKoruma] = useState(true);
  const [rapor, setRapor] = useState<Rapor>(null);
  const [koken, setKoken] = useState("");
  useEffect(() => setKoken(location.origin), []);
  useEffect(() => { if (!kd?.acik) { setRapor(null); return; } api<{ rapor: Rapor }>(`/api/build/ajanlar/${a.id}/yayinla?kademe=1`).then((v) => setRapor(v.rapor)).catch(() => {}); }, [a.id, kd?.acik, kd?.oran]);
  const surumler = [...a.surumler].reverse();
  const adaylar = [{ id: "taslak", ad: "Şu anki taslak", alt: "Yeni sürüm olarak dondurulur" }, ...surumler.filter((s) => s.no !== a.yayin.surum).map((s) => ({ id: String(s.no), ad: `Sürüm ${s.no}`, alt: s.not || saatYaz(s.tarih) }))];
  const ortamlar = [
    { ad: "Taslak", alt: "Düzenleyicideki ayarlar · Dene sohbeti", ton: "bg-white/[0.06] text-white/70" },
    { ad: "Deneme", alt: dn ? `Sürüm ${dn.surum} · ayrı adres ve anahtar` : "Kurulmadı", ton: dn ? "bg-amber-400/[0.12] text-amber-200" : "bg-white/[0.04] text-white/40" },
    { ad: "Canlı", alt: yayinda ? `Sürüm ${a.yayin.surum}${kd?.acik ? ` · yüzde ${kd.oran} sürüm ${kd.surum}` : ""}` : "Yayında değil", ton: yayinda ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.04] text-white/40" },
  ];
  const planDizi = plan.split("-").map(Number);
  return (
    <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
      <p className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white"><Layers className="h-3.5 w-3.5" />Ortamlar ve kademeli yayın</p>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-1.5">
          {ortamlar.map((o) => <div key={o.ad} className={cn("rounded-[14px] px-3 py-2.5", o.ton)}><p className="text-[13px] font-semibold">{o.ad}</p><p className="mt-0.5 text-[11.5px] leading-snug opacity-80">{o.alt}</p></div>)}
        </div>

        {/* Deneme ortamı */}
        <div className="space-y-2.5 rounded-[16px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[13px] font-medium text-white">Deneme ortamı</p>
          <p className="text-[12.5px] leading-relaxed text-white/55">Ekibin ve test kullanıcıların canlıya dokunmadan dener. Konuşmaları canlıdan ayrı tutulur; kutu betiğinde ortam niteliği deneme yapılır, API'de ayrı anahtar kullanılır.</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <AcilirSecim deger={denemeAday} set={setDenemeAday} l={[{ id: "taslak", ad: "Şu anki taslak", alt: "Yeni sürüm olarak dondurulur, canlıya çıkmaz" }, ...surumler.map((s) => ({ id: String(s.no), ad: `Sürüm ${s.no}`, alt: s.not || saatYaz(s.tarih) }))]} />
            <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "ortam-deneme", ...(denemeAday === "taslak" ? { taslak: true } : { surum: Number(denemeAday) }) })} className={birincil}>{gidiyor === "ortam-deneme" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Deneme ortamına koy</button>
          </div>
          {dn && (
            <>
              <div className="flex items-center gap-2"><span className="sc-kod min-w-0 flex-1 truncate rounded-[12px] bg-white/[0.05] px-3 py-2 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.07]">{koken}/ajan/{a.id}?ortam=deneme</span><button type="button" onClick={() => navigator.clipboard?.writeText(`${koken}/ajan/${a.id}?ortam=deneme`)} aria-label="Kopyala" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/75 hover:text-white"><Copy className="h-3.5 w-3.5" /></button><a href={`/ajan/${a.id}?ortam=deneme`} target="_blank" rel="noopener noreferrer" aria-label="Aç" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/75 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a></div>
              {anahtar && <div className="space-y-1"><p className="text-[12.5px] font-medium text-amber-200">Deneme API anahtarı yalnız şimdi görünür.</p><KodKutusu kod={anahtar} /></div>}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!!gidiyor || !!kd?.acik} onClick={() => islem({ islem: "ortam-canliya" })} className={ikincil}>Canlıya al</button>
                <button type="button" disabled={!!gidiyor || !!kd?.acik || !yayinda || dn.surum === a.yayin.surum} onClick={() => islem({ islem: "kademe-baslat", surum: dn.surum, plan: planDizi, otomatik, koruma: { acik: koruma } })} className={ikincil}><TrendingUp className="h-3.5 w-3.5" />Kademeli canlıya al</button>
                <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "ortam-anahtar" })} className={ikincil}>{a.yayin.ortam?.anahtarSonu ? "Yeni deneme anahtarı" : "Deneme API anahtarı"}</button>
                <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "ortam-kaldir" })} className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]">Kaldır</button>
              </div>
            </>
          )}
        </div>

        {/* Kademeli yayın */}
        <div className="space-y-2.5 rounded-[16px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="flex items-center gap-2 text-[13px] font-medium text-white"><Gauge className="h-3.5 w-3.5" />Kademeli yayın{kd?.acik && <span className="ml-auto rounded-full bg-[#55d6fd]/[0.12] px-2.5 py-0.5 text-[11.5px] font-medium text-[#8be6ff]">Sürüyor · yüzde {kd.oran}</span>}</p>
          {!yayinda ? <p className="text-[12.5px] text-white/50">Önce bir sürümü yayınla.</p> : kd?.acik ? (
            <>
              <p className="text-[12.5px] leading-relaxed text-white/55">Yeni konuşmaların yüzde {kd.oran} kadarı sürüm {kd.surum} ile, kalanı sürüm {kd.onceki} ile konuşuyor. Konuşma başladığı sürümde kalır.{kd.otomatik ? ` Koruma eşikleri tutarsa her ${kd.adimSaat} saatte bir sonraki adıma çıkar.` : ""}</p>
              <div className="flex items-center gap-1">{kd.plan.map((p) => <span key={p} className={cn("h-1.5 flex-1 rounded-full", p <= kd.oran ? "bg-[#55d6fd]" : "bg-white/[0.08]")} title={`Yüzde ${p}`} />)}</div>
              {rapor && (
                <div className="grid grid-cols-[1fr_auto_auto] text-[12.5px]">
                  <span /><span className="w-[110px] px-2 py-1 text-right font-semibold text-white">Yeni (s{rapor.yeni.surum})</span><span className="w-[110px] px-2 py-1 text-right font-semibold text-white">Eski (s{rapor.eski.surum})</span>
                  {([["Konuşma", (k: Kol) => String(k.konusma)], ["İnsana devir", (k: Kol) => yz(k.devir)], ["Hata", (k: Kol) => yz(k.hata)], ["Memnuniyet", (k: Kol) => (k.csat === null ? "Veri yok" : `5 üzerinden ${k.csat.toFixed(1)}`)]] as const).map(([ad, f]) => (
                    <div key={ad} className="contents"><span className="border-t border-white/[0.05] px-2 py-1.5 text-white/55">{ad}</span><span className="border-t border-white/[0.05] px-2 py-1.5 text-right tabular-nums text-white/85">{f(rapor.yeni)}</span><span className="border-t border-white/[0.05] px-2 py-1.5 text-right tabular-nums text-white/85">{f(rapor.eski)}</span></div>
                  ))}
                </div>
              )}
              {rapor && <p className={cn("flex items-start gap-2 rounded-[12px] px-3 py-2 text-[12.5px] leading-relaxed", rapor.karar === "geri-al" ? "bg-rose-500/[0.08] text-rose-100" : "bg-white/[0.04] text-white/60")}><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />{rapor.neden}</p>}
              <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-white/60"><span className="flex items-center gap-2">Otomatik ilerle<Anahtar acik={kd.otomatik} set={(v) => islem({ islem: "kademe-ayar", otomatik: v })} etiket="Otomatik ilerle" /></span><span className="flex items-center gap-2">Koruma<Anahtar acik={kd.koruma.acik} set={(v) => islem({ islem: "kademe-ayar", koruma: { ...kd.koruma, acik: v } })} etiket="Koruma" /></span><span className="text-white/40">Devir eşiği {kd.koruma.devirPuan} puan, hata eşiği {kd.koruma.hataPuan} puan, en az {kd.koruma.enAz} konuşma</span></div>
              <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "kademe-ilerle" })} className={birincil}>{gidiyor === "kademe-ilerle" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}{(kd.plan.find((p) => p > kd.oran) ?? 100) >= 100 ? "Herkese aç" : `Yüzde ${kd.plan.find((p) => p > kd.oran)} adımına çık`}</button>
                <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "kademe-denetle" })} className={ikincil}><ShieldCheck className="h-3.5 w-3.5" />Korumayı şimdi denetle</button>
                <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "kademe-geri" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500/[0.1] px-3.5 text-[13px] font-medium text-rose-200 hover:bg-rose-500/[0.16]"><RotateCcw className="h-3.5 w-3.5" />Geri al</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[12.5px] leading-relaxed text-white/55">Yeni sürümü önce yeni konuşmaların küçük bir payına aç; devir ve hata oranı eski sürüme göre kötüleşirse kendiliğinden geri alınır.</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><AcilirSecim deger={aday} set={setAday} l={adaylar} /><Secici id="kademe-plan" deger={plan} set={setPlan} l={[{ id: "10-25-50-100", ad: "10, 25, 50" }, { id: "5-20-100", ad: "5, 20" }, { id: "50-100", ad: "50" }]} /></div>
              <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-white/60"><span className="flex items-center gap-2">Günde bir adım otomatik<Anahtar acik={otomatik} set={setOtomatik} etiket="Otomatik" /></span><span className="flex items-center gap-2">Koruma ile geri alma<Anahtar acik={koruma} set={setKoruma} etiket="Koruma" /></span></div>
              <button type="button" disabled={!!gidiyor || !!a.yayin.ab?.acik} onClick={() => islem({ islem: "kademe-baslat", plan: planDizi, otomatik, koruma: { acik: koruma }, ...(aday === "taslak" ? { taslak: true } : { surum: Number(aday) }) })} className={birincil}>{gidiyor === "kademe-baslat" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}Kademeli yayını başlat</button>
              {a.yayin.ab?.acik && <p className="text-[12px] text-amber-200/90">A/B karşılaştırması sürerken kademeli yayın başlatılamaz.</p>}
            </>
          )}
          {(kd?.gecmis.length ?? 0) > 0 && <ol className="space-y-1 border-t border-white/[0.06] pt-2.5">{[...kd!.gecmis].reverse().slice(0, 6).map((g, i) => <li key={i} className="flex gap-2 text-[12px]"><span className="shrink-0 tabular-nums text-white/35">{saatYaz(g.zaman)}</span><span className="text-white/70">{g.olay}</span></li>)}</ol>}
        </div>
      </div>
    </section>
  );
}
