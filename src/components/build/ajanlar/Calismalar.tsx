"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Bot, BookOpen, Brain, ChevronDown, Clock3, Cpu, History, Loader2, Search, ShieldCheck, Users, Webhook, Wrench } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { DURUM_AD, KANAL_AD, type CalismaDurum, type Kanal } from "@/lib/build/ajanKatalog";
import { api, gorece } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { AcilirSecim, alanSinif } from "./AjanDuzenleyici";
import { BosDurum, DurumHapi, KanalSimge, YanPanel, saatYaz, sayi, sureYaz } from "./ortak";

export type AdimI = {
  tur: "model" | "arac" | "ekip" | "bilgi" | "koruma" | "devir" | "kanal" | "filtre" | "bellek"; ad: string; baslik: string;
  durum: "bitti" | "hata" | "onay" | "reddedildi" | "suruyor" | "atlandi"; baslangic: number; sure: number;
  girdi?: string; cikti?: string; hata?: string; kredi?: number; altCalisma?: { ajanId: string; id: string; ad: string };
};
export type CalismaI = {
  id: string; ajanId: string; kanal: Kanal; surum: number | null; model: string; durum: CalismaDurum; baslangic: number; bitis?: number; sure: number;
  girdi: string; cikti: string; hata?: string; adimlar: AdimI[]; kullanim: { girdi: number; cikti: number; onbellek: number; yazilan: number }; kredi: number;
  kaynaklar?: { no: number; ad: string; url?: string; parca: string }[]; konusma?: string; tetik?: { id: string; ad: string }; ust?: { ajanId: string; id: string };
  bekleyen?: { ad: string; girdi: Record<string, string> }[];
};
export type CalismaOzetI = {
  id: string; kanal: Kanal; surum: number | null; model: string; durum: CalismaDurum; baslangic: number; sure: number; kredi: number; girdi: string; cikti: string;
  araclar: { ad: string; hata: boolean; sure: number }[]; token: number; tetik?: { id: string; ad: string }; hata?: string; bekleyen?: string[];
};

const ADIM_IKON = { model: Cpu, arac: Wrench, ekip: Users, bilgi: BookOpen, koruma: ShieldCheck, devir: Users, kanal: Webhook, filtre: Webhook, bellek: Brain } as const;
const ADIM_TON: Record<AdimI["durum"], string> = { bitti: "text-[#8be6ff]", hata: "text-rose-300", onay: "text-amber-200", reddedildi: "text-white/45", suruyor: "text-[#8be6ff]", atlandi: "text-white/45" };

function IcerikKutusu({ baslik, metin }: { baslik: string; metin: string }) {
  return (
    <div className="mt-2">
      <p className="mb-1 text-[11.5px] font-medium text-white/45">{baslik}</p>
      <pre className="sc-kod max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-[12px] bg-[#0c0d0f] p-3 text-[12px] leading-relaxed text-white/75 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{metin}</pre>
    </div>
  );
}

function AdimSatiri({ a, i, toplam, ac }: { a: AdimI; i: number; toplam: number; ac: (x: NonNullable<AdimI["altCalisma"]>) => void }) {
  const [acik, setAcik] = useState(a.durum === "hata" || a.durum === "onay");
  const I = ADIM_IKON[a.tur] ?? Wrench;
  const ayrinti = !!(a.girdi || a.cikti || a.hata || a.altCalisma);
  return (
    <li className="relative pl-9">
      {i < toplam - 1 && <span className="absolute bottom-[-10px] left-[13px] top-8 w-px bg-white/[0.08]" />}
      <span className={cn("absolute left-0 top-1 flex h-[27px] w-[27px] items-center justify-center rounded-[9px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]", ADIM_TON[a.durum])}><I className="h-3.5 w-3.5" /></span>
      <button type="button" disabled={!ayrinti} onClick={() => setAcik((x) => !x)} className="flex w-full items-start gap-2 rounded-[10px] py-1 text-left enabled:hover:bg-white/[0.02]">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-white/90">{a.baslik}</span>
          <span className="block text-[11.5px] text-white/40">{a.tur === "model" ? modelBul(a.ad).ad : a.ad} · {sureYaz(a.sure)}{a.kredi ? ` · ${sayi(a.kredi)} kredi` : ""}{a.durum === "hata" ? " · hata" : a.durum === "onay" ? " · onay bekliyor" : a.durum === "reddedildi" ? " · reddedildi" : a.durum === "atlandi" ? " · çalıştırılmadı" : ""}</span>
        </span>
        {ayrinti && <ChevronDown className={cn("mt-1 h-3.5 w-3.5 shrink-0 text-white/35 transition-transform", acik && "rotate-180")} />}
      </button>
      {acik && (
        <div className="pb-2">
          {a.hata && <p className="mt-1.5 rounded-[10px] bg-rose-500/[0.08] px-3 py-2 text-[12px] leading-relaxed text-rose-200/90 ring-1 ring-inset ring-rose-400/15">{a.hata}</p>}
          {a.girdi && <IcerikKutusu baslik="Girdi" metin={a.girdi} />}
          {a.cikti && <IcerikKutusu baslik={a.tur === "model" ? "Yazdığı" : "Çıktı"} metin={a.cikti} />}
          {a.altCalisma && <button type="button" onClick={() => ac(a.altCalisma!)} className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Bot className="h-3.5 w-3.5" />{a.altCalisma.ad} çalışmasını aç</button>}
        </div>
      )}
    </li>
  );
}

/** Tek çalışmanın tam izi: özet, girdi, adımlar (açılır girdi ve çıktı), alıntılar, çıktı. Alt ajan izine iner. */
export function CalismaPaneli({ ajanId, calismaId, kapat, eylemler }: { ajanId: string; calismaId: string | null; kapat: () => void; eylemler?: (c: CalismaI) => React.ReactNode }) {
  const [yigin, setYigin] = useState<{ ajanId: string; id: string; ad?: string }[]>([]);
  const [c, setC] = useState<CalismaI | null>(null);
  const [hata, setHata] = useState("");
  useEffect(() => { setYigin(calismaId ? [{ ajanId, id: calismaId }] : []); }, [ajanId, calismaId]);
  const ust = yigin.at(-1);
  useEffect(() => {
    if (!ust) return;
    setC(null); setHata("");
    api<{ calisma: CalismaI }>(`/api/build/ajanlar/${ajanId}/calismalar?c=${ust.id}${ust.ajanId !== ajanId ? `&ajan=${ust.ajanId}` : ""}`).then((v) => setC(v.calisma)).catch(() => setHata("Çalışma bulunamadı."));
  }, [ajanId, ust]);
  const m = c ? modelBul(c.model) : null;
  return (
    <YanPanel acik={!!calismaId} kapat={kapat} genis
      ust={yigin.length > 1 ? <button type="button" onClick={() => setYigin((l) => l.slice(0, -1))} aria-label="Üst çalışmaya dön" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><ArrowLeft className="h-4 w-4" /></button> : undefined}
      baslik={c ? <span className="flex items-center gap-2">{ust?.ad ? `${ust.ad} çalışması` : "Çalışma"}<DurumHapi d={c.durum} /></span> : "Çalışma"}
      alt={c ? `${KANAL_AD[c.kanal]}${c.tetik ? ` · ${c.tetik.ad}` : ""} · ${c.surum ? `Sürüm ${c.surum}` : "Taslak"} · ${saatYaz(c.baslangic)}` : undefined}
      alt2={c && eylemler ? eylemler(c) : undefined}>
      {hata ? <p className="text-[13px] text-rose-300">{hata}</p> : !c ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.07] sm:grid-cols-4">
            {[["Süre", sureYaz(c.sure)], ["Kredi", sayi(c.kredi)], ["Token", sayi(c.kullanim.girdi + c.kullanim.cikti)], ["Model", m?.ad ?? c.model]].map(([a, b]) => (
              <div key={a} className="bg-[#161618] px-3.5 py-2.5"><dt className="text-[11.5px] text-white/45">{a}</dt><dd className="mt-0.5 truncate text-[14px] font-semibold tabular-nums text-white">{b}</dd></div>
            ))}
          </dl>
          {c.hata && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{c.hata}</p>}
          {c.bekleyen?.length ? (
            <section className="rounded-[16px] bg-amber-400/[0.06] p-3.5 ring-1 ring-inset ring-amber-300/15">
              <p className="text-[13px] font-semibold text-amber-100">Onayın bekleniyor</p>
              {c.bekleyen.map((b, i) => (
                <div key={i} className="mt-2 rounded-[12px] bg-black/20 p-2.5">
                  <p className="text-[12.5px] font-medium text-white">{b.ad}</p>
                  {Object.entries(b.girdi).map(([k, v]) => <p key={k} className="mt-0.5 text-[12px] text-white/60"><span className="text-white/40">{k}: </span>{v}</p>)}
                </div>
              ))}
            </section>
          ) : null}
          <section>
            <p className="mb-1.5 text-[12px] font-medium text-white/45">{c.kanal === "zamanlama" || c.kanal === "webhook" ? "Görev" : "Gelen mesaj"}</p>
            <p className="whitespace-pre-wrap rounded-[14px] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white/85 ring-1 ring-inset ring-white/[0.07]">{c.girdi || "Boş"}</p>
          </section>
          <section>
            <p className="mb-2 text-[12px] font-medium text-white/45">Adımlar · {c.adimlar.length}</p>
            {c.adimlar.length ? <ol className="space-y-2.5">{c.adimlar.map((a, i) => <AdimSatiri key={i} a={a} i={i} toplam={c.adimlar.length} ac={(x) => setYigin((l) => [...l, { ajanId: x.ajanId, id: x.id, ad: x.ad }])} />)}</ol> : <p className="text-[12.5px] text-white/45">Adım kaydı yok.</p>}
          </section>
          {c.kaynaklar?.length ? (
            <section>
              <p className="mb-1.5 text-[12px] font-medium text-white/45">Yanıtlayan kaynaklar</p>
              <div className="space-y-1.5">{c.kaynaklar.map((k) => <div key={k.no} className="rounded-[12px] bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/[0.06]"><p className="text-[12.5px] font-medium text-white"><span className="mr-1.5 text-[#8be6ff]">[{k.no}]</span>{k.ad}</p><p className="mt-0.5 line-clamp-3 text-[12px] leading-relaxed text-white/50">{k.parca}</p></div>)}</div>
            </section>
          ) : null}
          {c.cikti && (
            <section>
              <p className="mb-1.5 text-[12px] font-medium text-white/45">Yanıt</p>
              <p className="whitespace-pre-wrap rounded-[14px] bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07]">{c.cikti}</p>
            </section>
          )}
        </div>
      )}
    </YanPanel>
  );
}

const DURUM_SEC: { id: "" | CalismaDurum; ad: string }[] = [{ id: "", ad: "Hepsi" }, { id: "tamamlandi", ad: "Tamamlandı" }, { id: "hata", ad: "Hatalı" }, { id: "girdi-bekliyor", ad: "Onay bekliyor" }, { id: "devredildi", ad: "Devredildi" }, { id: "engellendi", ad: "Engellendi" }, { id: "atlandi", ad: "Filtreye uymadı" }];

/** Çalışmalar sekmesi: süzgeçli liste (kanal, durum, dönem, arama) ve iz paneli. */
export function Calismalar({ ajanId, ac }: { ajanId: string; ac?: string | null }) {
  const [kanal, setKanal] = useState("");
  const [durum, setDurum] = useState<"" | CalismaDurum>("");
  const [donem, setDonem] = useState("30");
  const [ozelGun, setOzelGun] = useState(14);
  const [ara, setAra] = useState("");
  const [arama, setArama] = useState("");
  const [v, setV] = useState<{ calismalar: CalismaOzetI[]; toplam: number; kanallar: Record<string, number>; durumlar: Record<string, number> } | null>(null);
  const [sayfa, setSayfa] = useState(0);
  const [secili, setSecili] = useState<string | null>(ac ?? null);
  useEffect(() => { if (ac) setSecili(ac); }, [ac]);
  useEffect(() => { const t = setTimeout(() => setArama(ara), 300); return () => clearTimeout(t); }, [ara]);
  const gun = donem === "ozel" ? ozelGun : Number(donem) || 0;
  const yukle = useCallback(async (s = 0) => {
    const q = new URLSearchParams({ ...(kanal ? { kanal } : {}), ...(durum ? { durum } : {}), ...(arama ? { ara: arama } : {}), ...(gun ? { gun: String(gun) } : {}), sayfa: String(s) });
    const y = await api<NonNullable<typeof v>>(`/api/build/ajanlar/${ajanId}/calismalar?${q}`).catch(() => null);
    if (!y) return;
    setV((x) => (s && x ? { ...y, calismalar: [...x.calismalar, ...y.calismalar] } : y));
    setSayfa(s);
  }, [ajanId, kanal, durum, arama, gun]);
  useEffect(() => { yukle(0); }, [yukle]);
  const toplamDonem = v ? Object.values(v.kanallar).reduce((a, b) => a + b, 0) : 0;
  return (
    <Kart ikon={History} baslik="Çalışmalar" alt="Her konuşma turu, zamanlama ve web kancası çalışması adım adım" sag={v ? <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] tabular-nums text-white/55">{sayi(v.toplam)} çalışma</span> : undefined}>
      <div className="space-y-2.5 border-b border-white/[0.06] p-4 sm:px-5">
        <div className="grid grid-cols-2 gap-2">
          <AcilirSecim deger={kanal} set={setKanal} bos="Tüm kanallar" l={(Object.keys(KANAL_AD) as Kanal[]).map((k) => ({ id: k, ad: KANAL_AD[k], alt: v?.kanallar[k] ? `${v.kanallar[k]} çalışma` : "Bu dönemde yok" }))} />
          <AcilirSecim deger={donem} set={setDonem} l={[{ id: "1", ad: "Son 24 saat" }, { id: "7", ad: "Son 7 gün" }, { id: "30", ad: "Son 30 gün" }, { id: "90", ad: "Son 90 gün" }, { id: "0", ad: "Tümü" }, { id: "ozel", ad: "Özel", alt: "Gün sayısını kendin yaz" }]} />
        </div>
        {donem === "ozel" && <label className="flex items-center gap-2 text-[12.5px] text-white/55">Son<input type="number" min={1} max={365} value={ozelGun} onChange={(e) => setOzelGun(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} className={cn(alanSinif, "h-9 w-[84px] text-right tabular-nums")} />gün</label>}
        <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Mesajda, yanıtta ya da araç adında ara" className={cn(alanSinif, "h-10 pl-10 text-[13.5px]")} /></div>
        <Suzgec id={`calisma-durum-${ajanId}`} deger={durum} set={setDurum} l={DURUM_SEC.filter((d) => !d.id || v?.durumlar[d.id]).map((d) => ({ ...d, sayi: d.id ? v?.durumlar[d.id] ?? 0 : toplamDonem }))} />
      </div>
      {!v ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
        : !v.calismalar.length ? (
          <BosDurum ikon={History} baslik={toplamDonem || kanal || durum || arama ? "Bu süzgeçle çalışma yok" : "Henüz çalışma yok"} alt={toplamDonem || kanal || durum || arama ? "Süzgeçleri gevşet ya da dönemi genişlet." : "Sağdaki Dene bölümünde bir mesaj yaz ya da bir zamanlama kur; her çalışma adım adım burada görünür."} />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {v.calismalar.map((c) => (
              <button key={c.id} type="button" onClick={() => setSecili(c.id)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.025] sm:px-5", secili === c.id && "bg-white/[0.04]")}>
                <KanalSimge k={c.kanal} boyut={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-white/90">{c.girdi || (c.tetik ? c.tetik.ad : "Boş mesaj")}</span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[11.5px] text-white/40">
                    <span className="min-w-0 truncate">{c.tetik?.ad ?? KANAL_AD[c.kanal]}</span><span className="max-sm:hidden">·</span><Clock3 className="h-3 w-3 shrink-0 max-sm:hidden" /><span className="shrink-0 max-sm:hidden">{sureYaz(c.sure)}</span><span>·</span><span className="shrink-0 tabular-nums">{sayi(c.kredi)} kredi</span>
                    {c.araclar.length > 0 && <><span className="max-sm:hidden">·</span><span className={cn("shrink-0 max-sm:hidden", c.araclar.some((a) => a.hata) && "text-rose-300/80")}>{c.araclar.length} araç</span></>}
                    <span className="max-sm:hidden">· {gorece(c.baslangic)}</span>
                  </span>
                </span>
                <DurumHapi d={c.durum} />
              </button>
            ))}
            {v.calismalar.length < v.toplam && <div className="p-3 text-center"><button type="button" onClick={() => yukle(sayfa + 1)} className="inline-flex h-9 items-center rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]">Daha fazla göster</button></div>}
          </div>
        )}
      <CalismaPaneli ajanId={ajanId} calismaId={secili} kapat={() => setSecili(null)} />
    </Kart>
  );
}
export { DURUM_AD };
