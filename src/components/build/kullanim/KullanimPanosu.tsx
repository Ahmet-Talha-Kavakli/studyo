"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot, ChevronRight, FolderOpen, Gauge, Loader2, MessageSquare, Table2, Workflow, BarChart3, Cpu } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { SaglayiciLogo } from "@/components/build/ModelSecici";
import { api } from "@/lib/build/istemci";
import { modelBul, type BuildModel, type BuildSaglayici } from "@/lib/build/modeller";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import type { KullanimRaporu, KullanimTur } from "@/lib/build/kullanim";

/** Listede artık olmayan eski model kimliklerini okunur ada ve doğru sağlayıcıya çevirir (claude-sonnet-4-5: Claude Sonnet 4.5). */
const ONEKLER: [RegExp, BuildSaglayici][] = [[/^claude/i, "anthropic"], [/^(gpt|o\d|chatgpt)/i, "openai"], [/^(gemini|gemma)/i, "google"], [/^(kimi|moonshot)/i, "moonshot"], [/^deepseek/i, "deepseek"], [/^grok/i, "xai"], [/^qwen/i, "qwen"], [/^glm/i, "zai"], [/^(mistral|codestral|magistral|devstral)/i, "mistral"], [/^minimax/i, "minimax"], [/^mimo/i, "xiaomi"], [/^command/i, "cohere"], [/^llama/i, "meta"]];
function modelGorunumu(id: string): BuildModel {
  const md = modelBul(id);
  if (md.id === id) return md;
  const ham = id.replace(/^ozel:/, "").split("/").pop() ?? id;
  const ad = ham.split(/[-_]/).filter(Boolean).reduce<string[]>((l, p) => {
    const once = l.at(-1) ?? "";
    if (/^\d+$/.test(p) && /\d$/.test(once)) return [...l.slice(0, -1), `${once}.${p}`];
    return [...l, /^gpt$/i.test(p) ? "GPT" : p[0].toUpperCase() + p.slice(1)];
  }, []).join(" ");
  return { ...md, id, ad, saglayici: ONEKLER.find(([r]) => r.test(ham))?.[1] ?? md.saglayici };
}

/* Kategorik palet (dataviz referansı, koyu yüzey #121315 için doğrulandı): sabit sıra, tür rengi tür değişse de değişmez. */
const SERILER: { id: KullanimTur; ad: string; renk: string; ikon: typeof Bot }[] = [
  { id: "proje", ad: "Projeler", renk: "#3987e5", ikon: FolderOpen },
  { id: "sohbet", ad: "Sohbetler", renk: "#d95926", ikon: MessageSquare },
  { id: "ajan", ad: "Ajanlar", renk: "#199e70", ikon: Bot },
  { id: "sistem", ad: "Sistemler", renk: "#c98500", ikon: Workflow },
];
const SERI = Object.fromEntries(SERILER.map((s) => [s.id, s])) as Record<KullanimTur, (typeof SERILER)[number]>;
const sayi = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
const gunAdi = (g: string) => new Date(`${g}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

function Kutu({ ad, deger, alt }: { ad: string; deger: string; alt?: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-white/[0.03] px-4 py-3.5 ring-1 ring-inset ring-white/[0.07]">
      <p className="text-[12.5px] text-white/50">{ad}</p>
      <p className="mt-1 truncate text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-white">{deger}</p>
      {alt && <p className="mt-0.5 text-[12px] text-white/45">{alt}</p>}
    </div>
  );
}

/** Günlük yığılmış çubuk: ince çubuklar, parçalar arası 2px yüzey boşluğu, üst uç yuvarlak, tek eksen, çubuk başına ipucu. */
function Grafik({ r }: { r: KullanimRaporu }) {
  const kutu = useRef<HTMLDivElement>(null);
  const [g, setG] = useState(720);
  const [ucu, setUcu] = useState<number | null>(null);
  useEffect(() => { const k = kutu.current; if (!k) return; const o = new ResizeObserver(() => setG(k.offsetWidth)); o.observe(k); return () => o.disconnect(); }, []);
  const Y = 220, ust = 10, alt = 26, sol = 40;
  const enCok = Math.max(1, ...r.gunluk.map((d) => d.proje + d.sohbet + d.ajan + d.sistem));
  const adim = enCok <= 5 ? 1 : Math.pow(10, Math.floor(Math.log10(enCok))) * (enCok / Math.pow(10, Math.floor(Math.log10(enCok))) > 5 ? 2 : 1);
  const tavan = Math.ceil(enCok / adim) * adim;
  const cizgiler = Array.from({ length: Math.floor(tavan / adim) + 1 }, (_, i) => i * adim).filter((_, i, l) => l.length <= 6 || i % 2 === 0);
  const n = r.gunluk.length, alan = g - sol - 4;
  const genis = Math.max(3, Math.min(22, (alan / n) * 0.62));
  const x = (i: number) => sol + (alan / n) * (i + 0.5);
  const y = (v: number) => ust + (Y - ust - alt) * (1 - v / tavan);
  const etiketAdim = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(alan / 70))));
  const d = ucu !== null ? r.gunluk[ucu] : null;
  return (
    <div ref={kutu} className="relative" onMouseLeave={() => setUcu(null)}>
      <svg width={g} height={Y} role="img" aria-label="Günlük kredi kullanımı" className="block">
        {cizgiler.map((v) => <g key={v}><line x1={sol} x2={g - 4} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" /><text x={sol - 8} y={y(v) + 4} textAnchor="end" className="fill-white/40 text-[11px] tabular-nums">{sayi(v)}</text></g>)}
        {r.gunluk.map((dd, i) => {
          let taban = 0;
          const parcalar = SERILER.map((s) => ({ s, v: dd[s.id] })).filter((p) => p.v > 0);
          return (
            <g key={dd.gun}>
              {parcalar.map((p, j) => {
                const y1 = y(taban + p.v), y0 = y(taban);
                taban += p.v;
                const h = Math.max(1, y0 - y1 - (j > 0 ? 2 : 0));
                const ustParca = j === parcalar.length - 1;
                const r4 = ustParca ? Math.min(4, genis / 2, h) : 0;
                const xx = x(i) - genis / 2, yy = y1;
                const yol = `M${xx},${yy + h} L${xx},${yy + r4} Q${xx},${yy} ${xx + r4},${yy} L${xx + genis - r4},${yy} Q${xx + genis},${yy} ${xx + genis},${yy + r4} L${xx + genis},${yy + h} Z`;
                return <path key={p.s.id} d={yol} fill={p.s.renk} opacity={ucu === null || ucu === i ? 1 : 0.45} />;
              })}
              <rect x={x(i) - alan / n / 2} y={ust} width={alan / n} height={Y - ust - alt} fill="transparent" onMouseEnter={() => setUcu(i)} />
              {i % etiketAdim === 0 && <text x={x(i)} y={Y - 8} textAnchor="middle" className="fill-white/40 text-[11px]">{gunAdi(dd.gun)}</text>}
            </g>
          );
        })}
        <line x1={sol} x2={g - 4} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.18)" />
      </svg>
      {d && ucu !== null && (
        <div className="pointer-events-none absolute top-1 z-10 w-[190px] rounded-[12px] bg-[#1b1c1f] p-2.5 text-[12px] ring-1 ring-inset ring-white/[0.12]" style={{ left: Math.min(Math.max(0, x(ucu) - 95), g - 190) }}>
          <p className="mb-1.5 font-medium text-white">{gunAdi(d.gun)} · {sayi(d.proje + d.sohbet + d.ajan + d.sistem)} kredi</p>
          {SERILER.map((s) => <p key={s.id} className="flex items-center gap-2 text-white/70"><span className="h-2 w-2 rounded-[3px]" style={{ background: s.renk }} /><span className="flex-1">{s.ad}</span><span className="tabular-nums text-white/90">{sayi(d[s.id])}</span></p>)}
        </div>
      )}
    </div>
  );
}

function DonemSecici({ gun, ozel, sec, ozelYaz }: { gun: number; ozel: string; sec: (d: number) => void; ozelYaz: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.07]">
      {[7, 30, 90].map((d) => <button key={d} type="button" onClick={() => sec(d)} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium", gun === d && !ozel ? "bg-white text-black" : "text-white/60 hover:text-white")}>{d} gün</button>)}
      <input value={ozel} onChange={(e) => ozelYaz(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Özel" aria-label="Özel gün sayısı" className={cn("h-8 w-[70px] rounded-full bg-transparent px-3 text-[12.5px] tabular-nums text-white outline-none placeholder:text-white/45", ozel && "bg-white/[0.1] ring-2 ring-inset ring-white")} />
    </div>
  );
}

/** Build kredi kullanımı: dönem seçimi, özet, günlük grafik (tablo görünümüyle), kaynak ve model kırılımı. */
export function KullanimPanosu() {
  const [gun, setGun] = useState(30);
  const [ozel, setOzel] = useState("");
  const [r, setR] = useState<KullanimRaporu | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [tablo, setTablo] = useState(false);
  const [tur, setTur] = useState<KullanimTur | "">("");
  const bakiye = useAuth((s) => s.kullanici?.krediler);
  useEffect(() => {
    let iptal = false;
    setYukleniyor(true);
    api<{ rapor: KullanimRaporu }>(`/api/build/kullanim?gun=${gun}`).then((v) => { if (!iptal) setR(v.rapor); }).catch(() => {}).finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, [gun]);
  const degisim = useMemo(() => {
    if (!r) return "";
    if (!r.onceki) return r.toplam ? "Önceki dönemde harcama yok" : "Bu dönemde harcama yok";
    const o = Math.round(((r.toplam - r.onceki) / r.onceki) * 100);
    return o === 0 ? "Önceki dönemle aynı" : `Önceki döneme göre yüzde ${Math.abs(o)} ${o > 0 ? "daha fazla" : "daha az"}`;
  }, [r]);
  const kaynaklar = (r?.kaynaklar ?? []).filter((k) => !tur || k.tur === tur);
  const enBuyuk = Math.max(1, ...kaynaklar.map((k) => k.kredi));
  const donemSec = (d: number) => { setGun(d); setOzel(""); };
  const ozelYaz = (v: string) => { setOzel(v); if (Number(v) >= 1) setGun(Math.min(365, Number(v))); };
  const turSecici = (
    <div className="flex flex-wrap gap-1">
      {([{ id: "", ad: "Hepsi" }, ...SERILER] as { id: KullanimTur | ""; ad: string }[]).map((x) => <button key={x.id || "hepsi"} type="button" onClick={() => setTur(x.id)} className={cn("h-7 rounded-full px-2.5 text-[12px] ring-inset", tur === x.id ? "bg-white/[0.1] text-white ring-2 ring-white" : "text-white/55 ring-1 ring-white/[0.08] hover:text-white")}>{x.ad}</button>)}
    </div>
  );

  return (
    <div className="space-y-5">
      <Kart ikon={Gauge} baslik="Kullanım" alt="Projeler, sohbetler, ajanlar ve sistemlerin harcadığı kredi"
        sag={<div className="max-sm:hidden"><DonemSecici gun={gun} ozel={ozel} sec={donemSec} ozelYaz={ozelYaz} /></div>}
        govde="p-4 sm:p-5">
        <div className="mb-3 sm:hidden"><DonemSecici gun={gun} ozel={ozel} sec={donemSec} ozelYaz={ozelYaz} /></div>
        {!r ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[100px] animate-pulse rounded-[18px] bg-white/[0.03]" />)}</div> : (
          <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", yukleniyor && "opacity-60")}>
            <Kutu ad={`Son ${r.gun} günde harcanan`} deger={`${sayi(r.toplam)} kredi`} alt={degisim} />
            <Kutu ad="Günlük ortalama" deger={`${sayi(r.toplam / r.gun)} kredi`} alt={`${sayi(r.islem)} ücretli işlem`} />
            <Kutu ad="En çok harcayan" deger={r.kaynaklar[0]?.ad ?? "Yok"} alt={r.kaynaklar[0] ? `${SERI[r.kaynaklar[0].tur].ad} · ${sayi(r.kaynaklar[0].kredi)} kredi` : "Bu dönemde harcama yok"} />
            <Kutu ad="Kalan bakiye" deger={bakiye !== undefined ? `${sayi(bakiye)} kredi` : "Bilinmiyor"} alt={bakiye !== undefined && r.toplam ? `Bu hızla yaklaşık ${Math.max(1, Math.round(bakiye / Math.max(0.1, r.toplam / r.gun)))} gün yeter` : undefined} />
          </div>
        )}
      </Kart>

      <Kart ikon={BarChart3} baslik="Günlük harcama" alt="Türe göre yığılmış; üzerine gelince gün ayrıntısı"
        sag={<button type="button" onClick={() => setTablo((x) => !x)} aria-pressed={tablo} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] ring-inset", tablo ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.06] text-white/70 ring-1 ring-white/[0.08] hover:text-white")}><Table2 className="h-3.5 w-3.5" />Tablo</button>}
        govde="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {SERILER.map((s) => <span key={s.id} className="flex items-center gap-1.5 text-[12.5px] text-white/70"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.renk }} />{s.ad}<span className="tabular-nums text-white/45">{r ? sayi(r.turler[s.id]) : ""}</span></span>)}
        </div>
        {!r ? <div className="h-[220px] animate-pulse rounded-[14px] bg-white/[0.03]" /> : tablo ? (
          <div className="max-h-[320px] overflow-auto rounded-[14px] ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">
            <table className="w-full text-left text-[12.5px]">
              <thead className="sticky top-0 bg-[#16171a] text-white/50"><tr><th className="px-3 py-2 font-medium">Gün</th>{SERILER.map((s) => <th key={s.id} className="px-3 py-2 text-right font-medium">{s.ad}</th>)}<th className="px-3 py-2 text-right font-medium">Toplam</th></tr></thead>
              <tbody className="divide-y divide-white/[0.04] text-white/80">
                {[...r.gunluk].reverse().map((d) => <tr key={d.gun}><td className="px-3 py-1.5">{gunAdi(d.gun)}</td>{SERILER.map((s) => <td key={s.id} className="px-3 py-1.5 text-right tabular-nums">{sayi(d[s.id])}</td>)}<td className="px-3 py-1.5 text-right font-medium tabular-nums text-white">{sayi(d.proje + d.sohbet + d.ajan + d.sistem)}</td></tr>)}
              </tbody>
            </table>
          </div>
        ) : r.toplam ? <Grafik r={r} /> : <p className="flex h-[160px] items-center justify-center text-[13px] text-white/45">Bu dönemde kredi harcanmadı.</p>}
      </Kart>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Kart ikon={FolderOpen} baslik="En çok harcayanlar" alt="Proje, sohbet, ajan ve sistem bazında" govde=""
          sag={<div className="max-md:hidden">{turSecici}</div>}>
          <div className="border-b border-white/[0.05] px-4 py-2.5 md:hidden">{turSecici}</div>
          {!r ? <div className="h-40 animate-pulse" /> : !kaynaklar.length ? <p className="px-5 py-8 text-center text-[13px] text-white/45">Bu dönemde harcama yok.</p> : (
            <ul className="divide-y divide-white/[0.04]">
              {kaynaklar.map((k) => { const S = SERI[k.tur]; return (
                <li key={`${k.tur}:${k.id}`}>
                  <Link href={k.href} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.025] sm:px-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><S.ikon className="h-4 w-4 text-white/70" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2"><span className="truncate text-[13.5px] text-white/90">{k.ad}</span><span className="shrink-0 text-[11.5px] text-white/40 max-sm:hidden">{S.ad} · {k.adet} işlem</span></span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><span className="block h-full rounded-full" style={{ width: `${Math.max(2, (k.kredi / enBuyuk) * 100)}%`, background: S.renk }} /></span>
                    </span>
                    <span className="w-[72px] shrink-0 text-right text-[13px] font-medium tabular-nums text-white">{sayi(k.kredi)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
                  </Link>
                </li>
              ); })}
            </ul>
          )}
        </Kart>
        <Kart ikon={Cpu} baslik="Modellere göre" alt="Kredinin hangi modelde harcandığı" govde="">
          {!r ? <div className="h-40 animate-pulse" /> : !r.modeller.length ? <p className="px-5 py-8 text-center text-[13px] text-white/45">Model kullanımı yok.</p> : (
            <ul className="divide-y divide-white/[0.04]">
              {r.modeller.map((m) => { const md = modelGorunumu(m.model); return (
                <li key={m.model} className="flex items-center gap-2.5 px-4 py-2.5 sm:px-5">
                  <SaglayiciLogo m={md} boyut={15} />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-white/85">{md.ad}</span>
                  <span className="text-[12.5px] tabular-nums text-white/70">{sayi(m.kredi)} kredi</span>
                </li>
              ); })}
            </ul>
          )}
        </Kart>
      </div>
      {yukleniyor && r && <p className="flex items-center gap-2 text-[12px] text-white/40"><Loader2 className="h-3.5 w-3.5 animate-spin" />Güncelleniyor</p>}
    </div>
  );
}
