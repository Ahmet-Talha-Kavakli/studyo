"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, ChevronRight, Database, Globe2, KeyRound, Plug, Star, Variable, Workflow } from "lucide-react";
import { api, gorece } from "@/lib/build/istemci";
import { VERI_ISLEMLERI, duzListe, veriIslemi } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { CALISMA_SINIF, DURUM_SINIF, TETIK_IKON, YanPanel, tetikOzeti, type SistemAcik } from "./ortak";
import { EtiketDuzenleyici } from "./Paneller";

type Ad = { id: string; ad: string; logo?: string; simge?: string };
type Satir = { anahtar: string; ikon: typeof Workflow; logo?: string; ad: string; alt: string; href?: string };

/** Sistemin kullandığı ve onu kullanan her şey (adımlar, tetikler ve hata bildirimi taranır). */
export function bagimliliklar(s: SistemAcik, tum: SistemAcik[], ad: { projeler: Ad[]; ajanlar: Ad[]; baglantilar: Ad[] }) {
  const akis = s.yayin ?? { tetikler: s.tetikler, adimlar: s.adimlar };
  const adimlar = duzListe([...s.adimlar, ...(s.yayin?.adimlar ?? [])]).map((x) => x.a);
  const tekil = <T extends { anahtar: string }>(l: T[]) => l.filter((x, i) => l.findIndex((y) => y.anahtar === x.anahtar) === i);
  const proje = (id: string) => ad.projeler.find((p) => p.id === id)?.ad ?? "Silinmiş proje";
  const baglanti: Satir[] = tekil(adimlar.filter((a) => a.tur === "baglanti" && a.ayar.baglantiId).map((a) => { const b = ad.baglantilar.find((x) => x.id === a.ayar.baglantiId); return { anahtar: String(a.ayar.baglantiId), ikon: Plug, logo: b?.logo, ad: b?.ad ?? "Silinmiş bağlantı", alt: `Araç: ${String(a.ayar.arac || "seçilmedi")}`, href: "/panel/build/baglantilar" }; }));
  const tablolar: Satir[] = tekil([
    ...akis.tetikler.flatMap((t) => (t.tur === "veri" && t.projeId ? [{ anahtar: `${t.projeId}:${t.koleksiyon}`, ikon: Database, ad: t.koleksiyon || "tablo seçilmedi", alt: `${proje(t.projeId)} · tetik`, href: `/panel/build/bulut/${t.projeId}` }] : t.tur === "form" && t.projeId ? [{ anahtar: `form:${t.projeId}`, ikon: Database, ad: "Site formu", alt: `${proje(t.projeId)} · tetik`, href: `/panel/build/${t.projeId}` }] : [])),
    ...adimlar.filter((a) => a.tur === "veri" && a.ayar.projeId).map((a) => ({ anahtar: `${a.ayar.projeId}:${a.ayar.koleksiyon}`, ikon: Database, ad: String(a.ayar.koleksiyon || "tablo seçilmedi"), alt: `${proje(String(a.ayar.projeId))} · ${VERI_ISLEMLERI.find((x) => x.id === veriIslemi(a))?.ad.toLocaleLowerCase("tr")}`, href: `/panel/build/bulut/${a.ayar.projeId}` })),
  ]);
  const ajanlar: Satir[] = tekil(adimlar.filter((a) => a.tur === "ajan").map((a) => { const x = a.ayar.ajanId ? ad.ajanlar.find((y) => y.id === a.ayar.ajanId) : null; return { anahtar: String(a.ayar.ajanId || "vayra"), ikon: Bot, logo: x?.simge, ad: a.ayar.ajanId ? x?.ad ?? "Silinmiş ajan" : "Vayra (genel asistan)", alt: `Adım: ${a.ad}`, href: a.ayar.ajanId ? `/panel/build/ajanlar/${a.ayar.ajanId}` : undefined }; }));
  const sistemAd = (id: string) => tum.find((x) => x.id === id)?.ad ?? "Silinmiş sistem";
  const alt: Satir[] = tekil([
    ...adimlar.filter((a) => a.tur === "cagir" && a.ayar.sistemId).map((a) => ({ anahtar: String(a.ayar.sistemId), ikon: Workflow, ad: sistemAd(String(a.ayar.sistemId)), alt: a.ayar.mod === "baslat" ? "Çağırır, beklemeden devam eder" : "Çağırır ve bitmesini bekler", href: `/panel/build/sistemler/${a.ayar.sistemId}` })),
    ...akis.tetikler.flatMap((t) => (t.tur === "sistem" && t.sistemId ? [{ anahtar: `t:${t.sistemId}`, ikon: Workflow, ad: sistemAd(t.sistemId), alt: "O bitince bu sistem çalışır", href: `/panel/build/sistemler/${t.sistemId}` }] : [])),
    ...(s.ayar.hataSistemi ? [{ anahtar: `h:${s.ayar.hataSistemi}`, ikon: Workflow, ad: sistemAd(s.ayar.hataSistemi), alt: "Hata bildirimi olarak çalışır", href: `/panel/build/sistemler/${s.ayar.hataSistemi}` }] : []),
  ]);
  const j = JSON.stringify([s.adimlar, s.tetikler]);
  const degiskenler: Satir[] = tekil([...j.matchAll(/\{\{\s*(degisken|sir)\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => ({ anahtar: `${m[1]}.${m[2]}`, ikon: m[1] === "sir" ? KeyRound : Variable, ad: m[2], alt: m[1] === "sir" ? "Şifreli sır" : "Hesap değişkeni" })));
  const servisler: Satir[] = tekil(adimlar.filter((a) => a.tur === "http" && a.ayar.url).flatMap((a) => { try { const h = new URL(String(a.ayar.url).replace(/\{\{[^}]+\}\}/g, "x")).hostname; return [{ anahtar: h, ikon: Globe2, ad: h, alt: `${a.ayar.yontem || "POST"} isteği · ${a.ad}` }]; } catch { return []; } }));
  const kullananlar: Satir[] = tum.filter((x) => x.id !== s.id).flatMap((x) => {
    const l: Satir[] = [];
    const xa = duzListe([...x.adimlar, ...(x.yayin?.adimlar ?? [])]).map((y) => y.a);
    if (xa.some((a) => a.tur === "cagir" && a.ayar.sistemId === s.id)) l.push({ anahtar: `c:${x.id}`, ikon: Workflow, ad: x.ad, alt: "Bu sistemi çağırıyor", href: `/panel/build/sistemler/${x.id}` });
    if ([...x.tetikler, ...(x.yayin?.tetikler ?? [])].some((t) => t.tur === "sistem" && t.sistemId === s.id)) l.push({ anahtar: `t:${x.id}`, ikon: Workflow, ad: x.ad, alt: "Bu sistem bitince çalışıyor", href: `/panel/build/sistemler/${x.id}` });
    if (x.ayar.hataSistemi === s.id) l.push({ anahtar: `h:${x.id}`, ikon: Workflow, ad: x.ad, alt: "Hatasını bu sisteme bildiriyor", href: `/panel/build/sistemler/${x.id}` });
    return l;
  });
  return { baglanti, tablolar, ajanlar, alt, degiskenler, servisler, kullananlar };
}

function Grup({ baslik, l, bos }: { baslik: string; l: Satir[]; bos: string }) {
  return (
    <section>
      <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-white/90">{baslik}<span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[11px] font-medium tabular-nums text-white/55">{l.length}</span></p>
      {!l.length ? <p className="rounded-[14px] bg-white/[0.02] px-3.5 py-2.5 text-[12px] text-white/40 ring-1 ring-inset ring-white/[0.05]">{bos}</p> : (
        <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
          {l.map((x) => { const I = x.ikon; const ic = (<>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.06] text-white/70">{x.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.logo} alt="" className="h-full w-full object-cover" /> : <I className="h-3.5 w-3.5" />}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{x.ad}</span><span className="block truncate text-[11.5px] text-white/45">{x.alt}</span></span>
            {x.href && <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />}
          </>); return x.href ? <Link key={x.anahtar} href={x.href} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.03]">{ic}</Link> : <div key={x.anahtar} className="flex items-center gap-2.5 px-3 py-2">{ic}</div>; })}
        </div>
      )}
    </section>
  );
}

/** Sağ panel: sistemin özeti, etiketleri, yıldızı ve bağımlılıkları. */
export function SistemAyrinti({ s, tum, kapat, guncelle }: { s: SistemAcik | null; tum: SistemAcik[]; kapat: () => void; guncelle: (p: Partial<SistemAcik>) => void }) {
  const [ad, setAd] = useState<{ projeler: Ad[]; ajanlar: Ad[]; baglantilar: Ad[] }>({ projeler: [], ajanlar: [], baglantilar: [] });
  useEffect(() => {
    if (!s) return;
    Promise.all([
      api<{ projeler: Ad[] }>("/api/build/proje").catch(() => ({ projeler: [] })),
      api<{ ajanlar: Ad[] }>("/api/build/ajanlar").catch(() => ({ ajanlar: [] })),
      api<{ baglantilar: Ad[] }>("/api/build/baglantilar").catch(() => ({ baglantilar: [] })),
    ]).then(([p, a, b]) => setAd({ projeler: p.projeler, ajanlar: a.ajanlar, baglantilar: b.baglantilar }));
  }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = useMemo(() => (s ? bagimliliklar(s, tum, ad) : null), [s, tum, ad]);
  const oneriler = useMemo(() => [...new Set(tum.flatMap((x) => x.etiketler ?? []))], [tum]);
  const D = s ? DURUM_SINIF[s.durum] : null;
  const t = s ? (s.yayin?.tetikler ?? s.tetikler)[0] : undefined;
  const T = t ? TETIK_IKON[t.tur] : Workflow;
  return (
    <YanPanel acik={!!s} kapat={kapat} genislik={480} baslik={s ? <span className="flex items-center gap-2"><span className="truncate">{s.ad}</span>{D && <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", D.sinif)}>{D.ad}</span>}</span> : ""} alt={s?.aciklama || "Sistem ayrıntısı ve bağımlılıkları"}
      alt2={s ? <><Link href={`/panel/build/sistemler/${s.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black">Düzenleyicide aç<ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={() => guncelle({ yildiz: !s.yildiz })} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px]", s.yildiz ? "bg-amber-400/[0.12] text-amber-200" : "bg-white/[0.07] text-white/80 hover:bg-white/[0.12]")}><Star className={cn("h-4 w-4", s.yildiz && "fill-current")} />{s.yildiz ? "Yıldızlı" : "Yıldızla"}</button></> : undefined}>
      {s && b && (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
            <div className="col-span-2 min-w-0"><dt className="text-[11.5px] text-white/45">Tetik</dt><dd className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] font-medium text-white"><T className="h-3.5 w-3.5 shrink-0 text-white/55" />{t ? tetikOzeti(t) : "Yok"}</dd></div>
            <div><dt className="text-[11.5px] text-white/45">Adım</dt><dd className="mt-0.5 text-[13px] font-medium tabular-nums text-white">{duzListe(s.adimlar).length}</dd></div>
            <div><dt className="text-[11.5px] text-white/45">Çalışma</dt><dd className="mt-0.5 text-[13px] font-medium tabular-nums text-white">{s.ozet.calisma}{s.ozet.calisma ? `, ${s.ozet.basarili} başarılı` : ""}</dd></div>
            <div><dt className="text-[11.5px] text-white/45">Son çalışma</dt><dd className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-white">{s.ozet.sonCalisma ? <><span className={cn("h-1.5 w-1.5 rounded-full", CALISMA_SINIF[s.ozet.sonDurum ?? "durdu"].nokta)} />{gorece(s.ozet.sonCalisma)}</> : "Hiç"}</dd></div>
            <div><dt className="text-[11.5px] text-white/45">Yayın</dt><dd className="mt-0.5 text-[13px] font-medium text-white">{s.yayin ? `Sürüm ${s.yayin.surum}` : "Yayınlanmadı"}</dd></div>
          </dl>
          <section><p className="mb-1.5 text-[13px] font-semibold text-white/90">Etiketler</p><EtiketDuzenleyici l={s.etiketler ?? []} set={(l) => guncelle({ etiketler: l })} oneriler={oneriler} /></section>
          <Grup baslik="Alt sistemler" l={b.alt} bos="Başka bir sistemi çağırmıyor ya da dinlemiyor." />
          <Grup baslik="Bu sistemi kullananlar" l={b.kullananlar} bos="Hiçbir sistem bunu çağırmıyor." />
          <Grup baslik="Veri tabloları" l={b.tablolar} bos="Veri tablosu kullanmıyor." />
          <Grup baslik="Ajanlar" l={b.ajanlar} bos="Ajan adımı yok." />
          <Grup baslik="Bağlantılar" l={b.baglanti} bos="Bağlantı adımı yok." />
          <Grup baslik="Değişkenler ve sırlar" l={b.degiskenler} bos="Hesap değişkeni ya da sır kullanmıyor." />
          {b.servisler.length > 0 && <Grup baslik="Dış servisler" l={b.servisler} bos="" />}
        </div>
      )}
    </YanPanel>
  );
}
