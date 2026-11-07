"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Loader2, Trophy } from "lucide-react";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim, Secici } from "./AjanDuzenleyici";
import { SayiSecici } from "./KurulumEk";
import { birincil, ikincil, sayi, type Ajan } from "./ortak";

export type AbKol = { kol: "A" | "B"; surum: number | null; konusma: number; biten: number; cozumOrani: number | null; memnuniyet: number | null; memnuniyetSayi: number; devir: number | null; ortKredi: number | null; ortMesaj: number | null };
export type AbVeri = { acik: boolean; oran: number; baslangic: number | null; bSurum: number | null; kollar: AbKol[]; anlamli: "yetersiz" | "fark-yok" | "A" | "B" };
const yuzde = (x: number | null) => (x === null ? "Veri yok" : `yüzde ${Math.round(x * 100)}`);
const ondalik = (x: number | null, n = 1) => (x === null ? "Veri yok" : x.toLocaleString("tr-TR", { maximumFractionDigits: n }));

/** İki kolun yan yana karşılaştırması: iyi olan değer camgöbeği; altında anlamlılık sonucu. */
export function AbSonuc({ v }: { v: AbVeri }) {
  const [a, b] = v.kollar;
  const satirlar: { ad: string; deger: (k: AbKol) => string; ham: (k: AbKol) => number | null; ters?: boolean }[] = [
    { ad: "Konuşma", deger: (k) => sayi(k.konusma), ham: () => null },
    { ad: "Çözüm oranı", deger: (k) => yuzde(k.cozumOrani), ham: (k) => k.cozumOrani },
    { ad: "Memnuniyet", deger: (k) => (k.memnuniyet === null ? "Veri yok" : `5 üzerinden ${ondalik(k.memnuniyet)}`), ham: (k) => k.memnuniyet },
    { ad: "İnsana devir", deger: (k) => yuzde(k.devir), ham: (k) => k.devir, ters: true },
    { ad: "Konuşma başına kredi", deger: (k) => ondalik(k.ortKredi), ham: (k) => k.ortKredi, ters: true },
    { ad: "Ortalama mesaj", deger: (k) => ondalik(k.ortMesaj), ham: (k) => k.ortMesaj, ters: true },
  ];
  const iyi = (s: (typeof satirlar)[number], k: AbKol) => { const x = s.ham(a), y = s.ham(b); if (x === null || y === null || x === y) return false; const kazanan = s.ters ? (x < y ? "A" : "B") : x > y ? "A" : "B"; return kazanan === k.kol; };
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto] text-[12.5px]">
        <span className="px-3 py-2 text-white/45" />
        {[a, b].map((k) => <span key={k.kol} className="w-[112px] px-3 py-2 text-right font-semibold text-white sm:w-[132px]">{k.kol}<span className="ml-1.5 font-normal text-white/45">{k.surum ? `sürüm ${k.surum}` : ""}</span></span>)}
        {satirlar.map((s) => (
          <div key={s.ad} className="contents">
            <span className="border-t border-white/[0.05] px-3 py-2 text-white/60">{s.ad}</span>
            {[a, b].map((k) => <span key={k.kol} className={cn("border-t border-white/[0.05] px-3 py-2 text-right tabular-nums", iyi(s, k) ? "text-[#8be6ff]" : "text-white/85")}>{s.deger(k)}</span>)}
          </div>
        ))}
      </div>
      <p className={cn("mt-2 flex items-start gap-2 rounded-[12px] px-3 py-2 text-[12.5px] leading-relaxed", v.anlamli === "A" || v.anlamli === "B" ? "bg-[#55d6fd]/[0.08] text-[#bdf0ff]" : "bg-white/[0.04] text-white/60")}>
        {v.anlamli === "A" || v.anlamli === "B" ? <Trophy className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
        {v.anlamli === "yetersiz" ? "Karar için her kolda en az 30 biten konuşma gerekiyor; sonuçlar şimdilik yön gösterir." : v.anlamli === "fark-yok" ? "Çözüm oranındaki fark istatistiksel olarak anlamlı değil (yüzde 95 güven düzeyinde)." : `${v.anlamli} kolunun çözüm oranı yüzde 95 güven düzeyinde daha yüksek.`}
      </p>
    </div>
  );
}

/** Yayın panelinde A/B: yayındaki sürüme karşı başka bir sürümü (ya da taslağı) trafiğin bir payıyla dener. */
export function AbKarti({ a, islem, gidiyor }: { a: Ajan; islem: (g: Record<string, unknown>) => Promise<void>; gidiyor: string | null }) {
  const ab = a.yayin.ab;
  const [aday, setAday] = useState<string>("taslak");
  const [oran, setOran] = useState(ab?.oran ?? 50);
  const [v, setV] = useState<AbVeri | null>(null);
  useEffect(() => { if (!ab) { setV(null); return; } api<{ ab: AbVeri | null }>(`/api/build/ajanlar/${a.id}/analitik?gun=90`).then((x) => setV(x.ab)).catch(() => {}); }, [a.id, ab?.acik, ab?.surum, ab?.baslangic]); // eslint-disable-line react-hooks/exhaustive-deps
  const yayinda = a.yayin.durum === "yayinda";
  const adaylar = [{ id: "taslak", ad: "Şu anki taslak", alt: "Taslak yeni sürüm olarak dondurulur, yayına çıkmaz" }, ...[...a.surumler].reverse().filter((s) => s.no !== a.yayin.surum).map((s) => ({ id: String(s.no), ad: `Sürüm ${s.no}`, alt: s.not || "Notsuz sürüm" }))];
  return (
    <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
      <p className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white"><FlaskConical className="h-3.5 w-3.5" />A/B karşılaştırması
        {ab?.acik && <span className="ml-auto rounded-full bg-[#55d6fd]/[0.12] px-2.5 py-0.5 text-[11.5px] font-medium text-[#8be6ff]">Sürüyor · yüzde {ab.oran} B</span>}</p>
      {!yayinda ? <p className="px-4 py-3.5 text-[13px] leading-relaxed text-white/50">Önce ajanı yayınla; sonra yayındaki sürüme karşı bir taslağı ya da eski bir sürümü gerçek ziyaretçilerle dene.</p> : ab?.acik ? (
        <div className="space-y-3 p-4">
          <p className="text-[12.5px] leading-relaxed text-white/55">Yeni konuşmaların yüzde {ab.oran} kadarı sürüm {ab.surum} (B), kalanı yayındaki sürüm {a.yayin.surum} (A) ile konuşuyor. Her konuşma başladığı kolda kalır. Yeni bir sürüm yayınlarsan karşılaştırma biter.</p>
          {v ? <AbSonuc v={v} /> : <div className="h-24 animate-pulse rounded-[14px] bg-white/[0.03]" />}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-white/55">B payı</span>
            <SayiSecici id="ab-oran" deger={oran} set={(x) => { setOran(x); if (x >= 5 && x <= 95) islem({ islem: "ab-oran", oran: x }); }} hazir={[10, 25, 50]} birim="yüzde" />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
            <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "ab-bitir", kol: "A" })} className={ikincil}>A kalsın, bitir</button>
            <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "ab-bitir", kol: "B" })} className={birincil}>{gidiyor === "ab-bitir" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}B'yi yayınla</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <p className="text-[12.5px] leading-relaxed text-white/55">Yayındaki sürüm {a.yayin.surum} A koludur. B için bir sürüm seç; yeni konuşmaların seçtiğin payı B ile konuşur, çözüm oranı, memnuniyet, devir ve kredi kol kol karşılaştırılır.</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <AcilirSecim deger={aday} set={setAday} l={adaylar} />
            <Secici id="ab-oran-yeni" deger={String(oran)} set={(x) => setOran(Number(x))} l={[{ id: "10", ad: "Yüzde 10" }, { id: "25", ad: "Yüzde 25" }, { id: "50", ad: "Yüzde 50" }]} />
          </div>
          {v && v.kollar.some((k) => k.konusma) && <div className="rounded-[14px] bg-white/[0.02] p-2 ring-1 ring-inset ring-white/[0.06]"><p className="px-3 pb-1 pt-1 text-[12px] text-white/45">Son karşılaştırma</p><AbSonuc v={v} /></div>}
          <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "ab-baslat", oran, ...(aday === "taslak" ? { taslak: true } : { surum: Number(aday) }) })} className={birincil}>{gidiyor === "ab-baslat" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}Karşılaştırmayı başlat</button>
        </div>
      )}
    </section>
  );
}
