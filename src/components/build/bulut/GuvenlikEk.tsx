"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, KeyRound, Loader2, Package, RotateCw, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { YanPanel } from "./ortak";
import { Dugme, KuralSecici, KURAL_AD, Olcu, Rozet, SecHap, Uyari, type KuralUc } from "./veriOrtak";
import type { GuvenlikBulgu } from "./Guvenlik";

type Oneri = { ozet: string; kurallar?: KuralUc; gerekce?: string; ajanIstemi: string; etki: string[] };
type Acik = { id: string; ozet: string; seviye: "kritik" | "yuksek" | "orta" | "dusuk" | "bilinmiyor"; duzeltilen?: string; adres: string; takma?: string[] };
type Bag = { ad: string; surum: string | null; kaynak: string; dosyalar: string[]; sabit: boolean; butunluk: boolean | null; tur: string; aciklar: Acik[]; yayinda: boolean };
type Sizinti = { id: string; tur: string; saglayici: string; seviye: "kritik" | "uyari"; maske: string; yerler: { dosya: string; satir: number; surum: number | "taslak" | "ortam"; yayinlandi: boolean }[]; ilkSurum: number | null; yayinda: boolean; yayinlanmisti: boolean; tarayicida: boolean; iptal?: string; ajan: string };

const ACIK_SEV: Record<Acik["seviye"], { ad: string; ton: "tehlike" | "uyari" | "notr" }> = { kritik: { ad: "Kritik", ton: "tehlike" }, yuksek: { ad: "Yüksek", ton: "tehlike" }, orta: { ad: "Orta", ton: "uyari" }, dusuk: { ad: "Düşük", ton: "notr" }, bilinmiyor: { ad: "Seviyesi bilinmiyor", ton: "notr" } };

/** Bulgu için yapay zekâ önerisi: kural (doğrudan uygulanır) ve ajan isteği; uygulanmadan önce gösterilir. */
export function AiDuzeltPaneli({ projeId, b, kapat, ajanaGonder, bitti }: { projeId: string; b: GuvenlikBulgu | null; kapat: () => void; ajanaGonder: (m: string) => void; bitti: () => void }) {
  const [o, setO] = useState<Oneri | null>(null);
  const [k, setK] = useState<KuralUc | null>(null);
  const [hata, setHata] = useState("");
  const [isleniyor, setIsleniyor] = useState(false);
  const iste = useCallback(() => {
    if (!b) return;
    setO(null); setHata(""); setK(null);
    api<{ oneri: Oneri }>(`/api/build/bulut/${projeId}/guvenlik`, { govde: { aiOner: b.id } }).then((v) => { setO(v.oneri); setK(v.oneri.kurallar ?? null); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Öneri alınamadı."));
  }, [b, projeId]);
  useEffect(() => { iste(); }, [iste]);
  const tablo = b ? /"([a-zA-Z0-9_-]{1,40})"/.exec(b.baslik)?.[1] : undefined;
  const uygula = async () => {
    if (!k || !tablo) return;
    setIsleniyor(true); setHata("");
    try { await api(`/api/build/bulut/${projeId}/guvenlik`, { govde: { kuralUygula: { tablo, kurallar: k } } }); bitti(); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Uygulanamadı."); } finally { setIsleniyor(false); }
  };
  return (
    <YanPanel acik={!!b} kapat={kapat} genis baslik="Yapay zekâyla düzelt" alt={b?.baslik}
      alt2={o ? <><Dugme onClick={iste}><RotateCw className="h-3.5 w-3.5" />Yeni öneri</Dugme><span className="flex-1" /><Dugme onClick={() => { ajanaGonder(o.ajanIstemi); kapat(); }}><Wand2 className="h-3.5 w-3.5" />Build ajanına gönder</Dugme>{k && tablo && <Dugme tur="birincil" yukleniyor={isleniyor} onClick={uygula}>Kuralı uygula</Dugme>}</> : undefined}>
      {hata ? <div className="space-y-3"><Uyari>{hata}</Uyari>{b && <Dugme onClick={() => { ajanaGonder(b.ajan ?? `${b.baslik}: ${b.ayrinti} Düzelt.`); kapat(); }}><Wand2 className="h-3.5 w-3.5" />Doğrudan ajana gönder</Dugme>}</div>
        : !o ? <div className="flex items-center gap-2 py-6 text-[13px] text-white/55"><Loader2 className="h-4 w-4 animate-spin" />Bulgu, tablo şeması ve sitenin bu tabloyu nasıl kullandığı inceleniyor</div> : (
        <div className="space-y-4">
          <p className="flex gap-2 text-[13.5px] leading-relaxed text-white"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" />{o.ozet}</p>
          {k && tablo && (
            <div>
              <p className="mb-1.5 text-[12.5px] text-white/55">Önerilen erişim kuralı: <span className="font-mono text-white/80">{tablo}</span> (değiştirebilirsin)</p>
              <KuralSecici k={k} set={setK} />
              {o.gerekce && <p className="mt-2 text-[12px] leading-relaxed text-white/50">{o.gerekce}</p>}
              <p className="mt-1 text-[12px] text-white/40">Uygulanacak: okuma {KURAL_AD[k.okuma]}, ekleme {KURAL_AD[k.ekleme]}, düzenleme {KURAL_AD[k.duzenleme]}.</p>
            </div>
          )}
          {o.etki.length > 0 && <div className="space-y-1.5"><p className="text-[12.5px] text-white/55">Etkisi</p>{o.etki.map((e, i) => <Uyari key={i} ton="uyari">{e}</Uyari>)}</div>}
          <div><p className="mb-1.5 text-[12.5px] text-white/55">Ajana gidecek istek</p><p className="whitespace-pre-wrap rounded-[12px] bg-white/[0.03] p-3 text-[12.5px] leading-relaxed text-white/75 ring-1 ring-inset ring-white/[0.07]">{o.ajanIstemi}</p></div>
        </div>
      )}
    </YanPanel>
  );
}

/** Bağımlılık listesi (SBOM) ve OSV.dev bilinen açıkları. */
export function Bagimliliklar({ projeId, ajanaGonder }: { projeId: string; ajanaGonder: (m: string) => void }) {
  const [v, setV] = useState<{ bagimliliklar: Bag[]; osv: "tamam" | "ulasilamadi" | "gerekmedi"; zaman: number } | null>(null);
  const [hata, setHata] = useState("");
  const [suz, setSuz] = useState<"hepsi" | "acik" | "sabitsiz">("hepsi");
  const getir = useCallback(() => { setV(null); api<NonNullable<typeof v>>(`/api/build/bulut/${projeId}/guvenlik?kapsam=bagimlilik`).then(setV).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Okunamadı.")); }, [projeId]);
  useEffect(() => { getir(); }, [getir]);
  if (hata) return <Uyari>{hata}</Uyari>;
  if (!v) return <div className="flex h-32 items-center justify-center gap-2 text-[13px] text-white/50"><Loader2 className="h-4 w-4 animate-spin" />Kod taranıyor, açık veritabanı sorgulanıyor</div>;
  const l = v.bagimliliklar;
  const acikli = l.filter((b) => b.aciklar.length);
  const goster = suz === "acik" ? acikli : suz === "sabitsiz" ? l.filter((b) => !b.sabit) : l;
  const indir = () => {
    const sbom = { bomFormat: "CycloneDX", specVersion: "1.5", version: 1, metadata: { timestamp: new Date(v.zaman).toISOString(), tools: [{ name: "Vayra Bulut" }] }, components: l.map((b) => ({ type: "library", name: b.ad, ...(b.surum ? { version: b.surum, purl: `pkg:npm/${b.ad}@${b.surum}` } : {}), properties: [{ name: "vayra:kaynak", value: b.kaynak }] })) };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(sbom, null, 2)], { type: "application/json" })); a.download = "sbom.cdx.json"; a.click();
  };
  return (
    <div className="space-y-4">
      {v.osv === "ulasilamadi" && <Uyari ton="uyari">Açık veritabanına (OSV.dev) şu an ulaşılamadı; liste sürümleriyle gösteriliyor, açık bilgisi eksik olabilir. Biraz sonra yeniden tara.</Uyari>}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Olcu ad="Bağımlılık" deger={l.length} />
        <Olcu ad="Bilinen açığı olan" deger={acikli.length} ton={acikli.length ? "tehlike" : undefined} />
        <Olcu ad="Sürümü sabit değil" deger={l.filter((b) => !b.sabit).length} ton={l.some((b) => !b.sabit) ? "uyari" : undefined} />
        <Olcu ad="Bütünlük denetimsiz betik" deger={l.filter((b) => b.butunluk === false && b.tur !== "paket").length} />
      </div>
      <Kart ikon={Package} baslik="Bağımlılıklar" alt={`Sitenin yüklediği dış kütüphaneler; açıklar OSV.dev'den${v.zaman ? `, ${gorece(v.zaman)}` : ""}`}
        sag={<><Dugme onClick={getir}><RotateCw className="h-3.5 w-3.5" /><span className="max-sm:hidden">Yeniden tara</span></Dugme>{l.length > 0 && <Dugme onClick={indir}><span className="max-sm:hidden">SBOM indir</span><span className="sm:hidden">SBOM</span></Dugme>}</>}>
        {!l.length ? <p className="flex items-center gap-2 px-5 py-6 text-[13px] text-white/60"><ShieldCheck className="h-4 w-4 text-emerald-300" />Kodda CDN'den yüklenen kütüphane, adresli import ya da package.json bulunmadı.</p> : <>
          <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] p-3"><SecHap secili={suz === "hepsi"} onClick={() => setSuz("hepsi")}>Hepsi</SecHap><SecHap secili={suz === "acik"} onClick={() => setSuz("acik")}>Açığı olan</SecHap><SecHap secili={suz === "sabitsiz"} onClick={() => setSuz("sabitsiz")}>Sürümü sabit değil</SecHap></div>
          <div className="divide-y divide-white/[0.05]">{goster.map((b) => (
            <div key={`${b.ad}@${b.surum}`} className="px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] text-white">{b.ad}</span><span className="font-mono text-[12.5px] text-white/55">{b.surum ?? "sürüm yok"}</span>
                <Rozet>{b.kaynak}</Rozet>{b.yayinda && <Rozet ton="imza">Yayında</Rozet>}
                {!b.sabit && <Rozet ton="uyari">Sürüm sabitlenmemiş</Rozet>}
                {b.butunluk === false && <Rozet>integrity yok</Rozet>}
                {b.aciklar.length > 0 ? <Rozet ton="tehlike">{b.aciklar.length} açık</Rozet> : b.surum ? <Rozet ton="iyi">Bilinen açık yok</Rozet> : null}
              </div>
              <p className="mt-0.5 truncate text-[12px] text-white/40">{b.dosyalar.join(", ")}</p>
              {b.aciklar.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {b.aciklar.map((a) => (
                    <a key={a.id} href={a.adres} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 rounded-[12px] bg-white/[0.03] px-3 py-2 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.05]">
                      <Rozet ton={ACIK_SEV[a.seviye].ton}>{ACIK_SEV[a.seviye].ad}</Rozet>
                      <span className="min-w-0 flex-1"><span className="block text-[12.5px] text-white/85">{a.ozet}</span><span className="block font-mono text-[11.5px] text-white/40">{[a.id, ...(a.takma ?? [])].join(", ")}{a.duzeltilen ? ` · ${a.duzeltilen} sürümünde düzeltildi` : ""}</span></span>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />
                    </a>
                  ))}
                  <Dugme kucuk onClick={() => ajanaGonder(`${b.dosyalar.join(", ")} dosyalarında yüklenen ${b.ad} ${b.surum ?? ""} kütüphanesinde bilinen güvenlik açıkları var (${b.aciklar.map((a) => a.id).join(", ")}). ${b.aciklar.find((a) => a.duzeltilen)?.duzeltilen ? `En az ${b.aciklar.map((a) => a.duzeltilen).filter(Boolean).at(-1)} sürümüne` : "Açığı olmayan güncel bir sürüme"} yükselt, sürümü adreste sabitle ve CDN betiklerine integrity ve crossorigin ekle; değişiklik sonrası siteyi dene.`)}><Wand2 className="h-3 w-3" />Ajana yükselttir</Dugme>
                </div>
              )}
            </div>
          ))}</div>
        </>}
      </Kart>
    </div>
  );
}

/** Sızdırılmış anahtar taraması: taslak, bütün sürümler ve herkese açık ortam değişkenleri. */
export function Sizintilar({ projeId, ajanaGonder }: { projeId: string; ajanaGonder: (m: string) => void }) {
  const [v, setV] = useState<{ sizintilar: Sizinti[]; surum: number; zaman: number } | null>(null);
  const [hata, setHata] = useState("");
  const getir = useCallback(() => { setV(null); api<NonNullable<typeof v>>(`/api/build/bulut/${projeId}/guvenlik?kapsam=sizinti`).then(setV).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Taranamadı.")); }, [projeId]);
  useEffect(() => { getir(); }, [getir]);
  if (hata) return <Uyari>{hata}</Uyari>;
  if (!v) return <div className="flex h-32 items-center justify-center gap-2 text-[13px] text-white/50"><Loader2 className="h-4 w-4 animate-spin" />Bütün sürümler taranıyor</div>;
  return (
    <Kart ikon={KeyRound} baslik="Sızan anahtarlar" alt={`Taslak ve ${v.surum} sürüm, herkese açık ortam değişkenleri; AWS, Stripe, OpenAI, Anthropic, Google, GitHub, Slack, iyzico, PayTR ve diğerleri`}
      sag={<Dugme onClick={getir}><RotateCw className="h-3.5 w-3.5" /><span className="max-sm:hidden">Yeniden tara</span></Dugme>}>
      {!v.sizintilar.length ? <p className="flex items-center gap-2 px-5 py-6 text-[13px] text-white/60"><ShieldCheck className="h-4 w-4 text-emerald-300" />Kodda, eski sürümlerde ve herkese açık değişkenlerde bilinen biçimde bir anahtar bulunmadı.</p> : (
        <div className="divide-y divide-white/[0.05]">{v.sizintilar.map((s) => (
          <div key={s.id} className="px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-2"><Rozet ton={s.seviye === "kritik" ? "tehlike" : "uyari"}>{s.seviye === "kritik" ? "Kritik" : "Uyarı"}</Rozet><span className="text-[13.5px] font-medium text-white">{s.tur}</span><span className="font-mono text-[12px] text-white/50">{s.maske}</span></div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">{s.yayinlanmisti ? "Bu değer yayınlanmış bir sürümde tarayıcıya gitti; herkes görebildi. Koddan silmek yetmez: anahtarı sağlayıcıda iptal edip yenisini sunucu sırrı olarak sakla." : s.tarayicida ? "Tarayıcı koduna yazılmış; yayınlarsan herkes görür. Sunucu sırrına taşı." : "Sunucu fonksiyonunda düz yazılmış; ziyaretçi göremez ama sürümlerde ve ekipte görünür. Sunucu sırrına taşı."}{s.ilkSurum ? ` İlk görüldüğü sürüm ${s.ilkSurum}.` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">{s.yerler.slice(0, 6).map((y, i) => <span key={i} className={cn("rounded-full px-2.5 py-0.5 font-mono text-[11.5px] ring-1 ring-inset", y.yayinlandi ? "bg-rose-500/[0.07] text-rose-100/80 ring-rose-300/15" : "bg-white/[0.04] text-white/60 ring-white/[0.07]")}>{y.dosya}{y.satir ? `:${y.satir}` : ""} · {y.surum === "taslak" ? "taslak" : y.surum === "ortam" ? "ortam" : `sürüm ${y.surum}`}</span>)}{s.yerler.length > 6 && <span className="text-[11.5px] text-white/40">ve {s.yerler.length - 6} yer daha</span>}</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {s.iptal && <a href={s.iptal} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">{s.saglayici} anahtarını iptal et<ExternalLink className="h-3 w-3" /></a>}
              <Dugme kucuk onClick={() => ajanaGonder(s.ajan)}><Wand2 className="h-3 w-3" />Ajanla sunucu sırrına taşı</Dugme>
            </div>
          </div>
        ))}</div>
      )}
    </Kart>
  );
}
