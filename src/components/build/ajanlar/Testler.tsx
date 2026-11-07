"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, FileUp, FlaskConical, History, Loader2, MessagesSquare, Minus, Pencil, Play, Plus, RotateCcw, Trash2, UserRound } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Md } from "@/components/build/sohbet/SohbetEkrani";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Secici, alanSinif } from "./AjanDuzenleyici";
import { BosDurum, TON_SINIF, YanPanel, birincil, ikincil, sureYaz, type Ajan } from "./ortak";

type Test = { id: string; soru: string; beklenen: string; tur?: "tek" | "persona"; persona?: string; turSiniri?: number; kaynak?: "elle" | "csv" | "konusma" };
type Diyalog = { rol: "musteri" | "ajan"; metin: string }[];
type Yanit = { yanit: string; gecti: boolean; neden: string; yargic: "model" | "kelime"; kredi: number; calisma: string; araclar: string[]; sure: number; diyalog?: Diyalog; not?: string };
type Sonuc = { testId: string; soru: string; beklenen: string; persona?: string; taslak?: Yanit; yayin?: Yanit };
type Calisma = { id: string; zaman: number; durum: "calisiyor" | "bitti" | "hata"; hedefler: ("taslak" | "yayin")[]; surum: number | null; sonuclar: Sonuc[]; hata?: string };
type Oneri = { soru: string; beklenen: string };

const ozet = (c: Calisma, h: "taslak" | "yayin") => { const l = c.sonuclar.map((s) => s[h]).filter((x): x is Yanit => !!x); return { gecen: l.filter((x) => x.gecti).length, biten: l.length, toplam: c.sonuclar.length }; };
const etiketSinif = "rounded-full px-2 py-px text-[11px] font-medium";

function Alan({ ad, ipucu, children }: { ad: string; ipucu?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex items-baseline gap-2 text-[12.5px] font-medium text-white/60">{ad}{ipucu && <span className="font-normal text-white/35">{ipucu}</span>}</span>{children}</label>;
}

function TestPaneli({ a, t, kapat, kaydedildi }: { a: Ajan; t: Test | null; kapat: () => void; kaydedildi: (l: Test[]) => void }) {
  const [tur, setTur] = useState<"tek" | "persona">(t?.tur ?? "tek");
  const [soru, setSoru] = useState(t?.soru ?? "");
  const [beklenen, setBeklenen] = useState(t?.beklenen ?? "");
  const [persona, setPersona] = useState(t?.persona ?? "");
  const [turSiniri, setTurSiniri] = useState(t?.turSiniri ?? 4);
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const p = tur === "persona";
  const hazir = beklenen.trim() && (p ? persona.trim() : soru.trim());
  const kaydet = async () => {
    setGidiyor(true); setHata("");
    const g = { tur, soru, beklenen, ...(p ? { persona, turSiniri } : {}) };
    try { const v = await api<{ testler: Test[] }>(`/api/build/ajanlar/${a.id}/testler`, { govde: t ? { islem: "guncelle", test: t.id, ...g } : { islem: "ekle", ...g } }); kaydedildi(v.testler); kapat(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik kapat={kapat} baslik={t ? "Testi düzenle" : "Yeni test"} alt={p ? "Yapay zekâ müşteriyi canlandırır, ajanla birkaç tur konuşur" : "Bir ziyaretçi sorusu ve ajandan beklediğin davranış"}
      alt2={<><span className="flex-1" /><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" onClick={kaydet} disabled={gidiyor || !hazir} className={birincil}>{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button></>}>
      <div className="space-y-4">
        <Secici id={`test-tur-${a.id}`} deger={tur} set={setTur} l={[{ id: "tek", ad: "Tek soru" }, { id: "persona", ad: "Persona konuşması" }]} />
        {p ? (
          <>
            <Alan ad="Persona ve hedef"><textarea value={persona} onChange={(e) => setPersona(e.target.value)} rows={4} maxLength={1500} placeholder="Örneğin: Siparişi 5 gün gecikmiş, sabırsız bir müşteri. İade değil, kargonun nerede olduğunu öğrenmek istiyor; sipariş numarasını ancak sorulursa veriyor." className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} /></Alan>
            <Alan ad="İlk mesaj" ipucu="isteğe bağlı; boşsa canlandırıcı yazar"><textarea value={soru} onChange={(e) => setSoru(e.target.value)} rows={2} maxLength={2000} placeholder="Siparişim hâlâ gelmedi, ne oluyor?" className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} /></Alan>
            <Alan ad="Başarı ölçütü"><textarea value={beklenen} onChange={(e) => setBeklenen(e.target.value)} rows={3} maxLength={2000} placeholder="Sipariş numarasını ister, kargo durumunu araçla sorgular, sakin kalır, uydurma tarih vermez." className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} /></Alan>
            <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
              <span className="min-w-0 flex-1"><span className="block text-[13px] text-white/85">En çok tur</span><span className="block text-[12px] text-white/45">Müşteri hedefe ulaşınca konuşma erken biter</span></span>
              <button type="button" aria-label="Turu azalt" disabled={turSiniri <= 2} onClick={() => setTurSiniri((x) => Math.max(2, x - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white/70 hover:bg-white/[0.12] disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
              <span className="w-6 text-center text-[14px] font-semibold tabular-nums text-white">{turSiniri}</span>
              <button type="button" aria-label="Turu artır" disabled={turSiniri >= 8} onClick={() => setTurSiniri((x) => Math.min(8, x + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white/70 hover:bg-white/[0.12] disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
            </div>
          </>
        ) : (
          <>
            <Alan ad="Soru"><textarea value={soru} onChange={(e) => setSoru(e.target.value)} rows={3} maxLength={2000} placeholder="Örneğin: Siparişimi iade etmek istiyorum, ne yapmalıyım?" className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} /></Alan>
            <Alan ad="Beklenen davranış"><textarea value={beklenen} onChange={(e) => setBeklenen(e.target.value)} rows={4} maxLength={2000} placeholder="Örneğin: 14 günlük iade süresini söyler, iade kargosunun ücretsiz olduğunu belirtir, kaynak gösterir." className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} /></Alan>
          </>
        )}
        <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/50 ring-1 ring-inset ring-white/[0.06]">Testler kuru çalışır: yazan araçlar (üretim, proje, bağlantıda yazma, devir) gerçekten çalışmaz, yalnız çağrıldığı kaydedilir. Yapay zekâ yargıcı {p ? "bütün konuşmayı başarı ölçütüyle" : "yanıtı beklenen davranışla"} karşılaştırıp geçti ya da kaldı der.</p>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      </div>
    </YanPanel>
  );
}

/** CSV ya da yapıştırılan tablo: ilk iki sütun soru ve beklenen davranış; başlık satırı varsa atlanır. */
function csvCoz(metin: string): Oneri[] {
  const satirlar: string[][] = [];
  const ayirici = (metin.split("\n")[0].match(/;/g)?.length ?? 0) > (metin.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : metin.includes("\t") ? "\t" : ",";
  let alan = "", satir: string[] = [], tirnak = false;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) { if (c === '"' && metin[i + 1] === '"') { alan += '"'; i++; } else if (c === '"') tirnak = false; else alan += c; continue; }
    if (c === '"') tirnak = true;
    else if (c === ayirici) { satir.push(alan); alan = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && metin[i + 1] === "\n") i++; satir.push(alan); satirlar.push(satir); satir = []; alan = ""; }
    else alan += c;
  }
  if (alan || satir.length) { satir.push(alan); satirlar.push(satir); }
  const l = satirlar.map((s) => ({ soru: (s[0] ?? "").trim(), beklenen: (s[1] ?? "").trim() })).filter((x) => x.soru && x.beklenen);
  if (l.length && /^(soru|question|girdi|input)$/i.test(l[0].soru)) l.shift();
  return l;
}

function IceAktarPaneli({ a, kapat, eklendi }: { a: Ajan; kapat: () => void; eklendi: (l: Test[], n: number) => void }) {
  const [metin, setMetin] = useState("");
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  const l = useMemo(() => csvCoz(metin), [metin]);
  const ekle = async () => {
    setGidiyor(true); setHata("");
    try { const v = await api<{ testler: Test[]; eklenen: number }>(`/api/build/ajanlar/${a.id}/testler`, { govde: { islem: "toplu", kaynak: "csv", testler: l } }); eklendi(v.testler, v.eklenen); kapat(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik kapat={kapat} baslik="Testleri içe aktar" alt="CSV dosyası ya da tablodan yapıştırılan iki sütun: soru ve beklenen davranış"
      alt2={<><span className="flex-1 text-[12.5px] text-white/45">{l.length ? `${l.length} test okundu` : ""}</span><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" onClick={ekle} disabled={gidiyor || !l.length} className={birincil}>{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{l.length ? `${l.length} testi ekle` : "Ekle"}</button></>}>
      <div className="space-y-4">
        <input ref={dosya} type="file" accept=".csv,.tsv,.txt,text/csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setMetin(await f.text()); e.target.value = ""; }} />
        <button type="button" onClick={() => dosya.current?.click()} className="flex w-full items-center gap-3 rounded-[16px] bg-white/[0.03] px-4 py-3.5 text-left ring-1 ring-inset ring-dashed ring-white/[0.12] transition-colors hover:bg-white/[0.05]">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.1] text-[#8be6ff]"><FileUp className="h-[18px] w-[18px]" /></span>
          <span><span className="block text-[13.5px] font-medium text-white">CSV dosyası seç</span><span className="block text-[12px] text-white/45">Virgül, noktalı virgül ya da sekmeyle ayrılmış; başlık satırı olabilir</span></span>
        </button>
        <Alan ad="Ya da yapıştır"><textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={8} placeholder={"soru,beklenen\nKargo ne zaman gelir?,1 ile 3 iş günü der ve takip bağlantısını nereden bulacağını anlatır"} className={cn(alanSinif, "resize-y py-2.5 font-mono text-[12.5px] leading-relaxed")} /></Alan>
        {l.length > 0 && (
          <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {l.slice(0, 6).map((x, i) => <div key={i} className="border-b border-white/[0.05] px-3.5 py-2.5 last:border-0"><p className="truncate text-[13px] text-white/85">{x.soru}</p><p className="truncate text-[12px] text-white/45">{x.beklenen}</p></div>)}
            {l.length > 6 && <p className="px-3.5 py-2 text-[12px] text-white/40">ve {l.length - 6} test daha</p>}
          </div>
        )}
        <p className="text-[12px] text-white/40">Bir test setinde en çok 25 test olur; fazlası eklenmez.</p>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      </div>
    </YanPanel>
  );
}

function OneriPaneli({ a, kapat, eklendi }: { a: Ajan; kapat: () => void; eklendi: (l: Test[], n: number) => void }) {
  const [v, setV] = useState<{ oneriler: Oneri[]; model: boolean } | null>(null);
  const [secim, setSecim] = useState<Set<number>>(new Set());
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => {
    api<{ oneriler: Oneri[]; model: boolean }>(`/api/build/ajanlar/${a.id}/testler`, { govde: { islem: "oneri" } })
      .then((x) => { setV(x); setSecim(new Set(x.oneriler.map((_, i) => i))); })
      .catch((e) => { setHata(e instanceof ApiHatasi ? e.message : "Öneri alınamadı."); setV({ oneriler: [], model: false }); });
    // hata metni boş durumda gösterilir
  }, [a.id]);
  const ekle = async () => {
    if (!v) return;
    setGidiyor(true); setHata("");
    try { const r = await api<{ testler: Test[]; eklenen: number }>(`/api/build/ajanlar/${a.id}/testler`, { govde: { islem: "toplu", kaynak: "konusma", testler: v.oneriler.filter((_, i) => secim.has(i)) } }); eklendi(r.testler, r.eklenen); kapat(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik kapat={kapat} baslik="Konuşmalardan test üret" alt="Gerçek ziyaretçi sorularından ve ajanın yapması gerekenden"
      alt2={<><span className="flex-1" /><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" onClick={ekle} disabled={gidiyor || !secim.size} className={birincil}>{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{secim.size ? `${secim.size} testi ekle` : "Ekle"}</button></>}>
      {v === null ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-[16px] bg-white/[0.03]" />)}<p className="flex items-center gap-2 pt-1 text-[12.5px] text-white/45"><Loader2 className="h-3.5 w-3.5 animate-spin" />Son konuşmalar okunuyor</p></div>
      ) : (
        <div className="space-y-2.5">
          {!v.model && v.oneriler.length > 0 && <p className="rounded-[14px] bg-amber-400/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-100/80 ring-1 ring-inset ring-amber-300/15">Yardımcı model bağlı olmadığı için beklenen davranış, ajanın o konuşmadaki yanıtından alındı. Eklemeden önce düzenleyebilirsin.</p>}
          {v.oneriler.map((o, i) => {
            const s = secim.has(i);
            return (
              <button key={i} type="button" aria-pressed={s} onClick={() => setSecim((x) => { const y = new Set(x); if (y.has(i)) y.delete(i); else y.add(i); return y; })}
                className={cn("block w-full rounded-[16px] px-3.5 py-3 text-left ring-inset transition-colors", s ? "bg-white/[0.06] ring-2 ring-white" : "bg-white/[0.025] ring-1 ring-white/[0.07] hover:bg-white/[0.045]")}>
                <span className="block text-[13.5px] text-white/90">{o.soru}</span>
                <span className="mt-1 block text-[12px] leading-relaxed text-white/50">Beklenen: {o.beklenen}</span>
              </button>
            );
          })}
          {!v.oneriler.length && <BosDurum ikon={MessagesSquare} baslik="Henüz ziyaretçi konuşması yok" alt={hata || "Öneri çıkarılacak konuşma bulunamadı."} />}
          {hata && v.oneriler.length > 0 && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        </div>
      )}
    </YanPanel>
  );
}

function YanitHucresi({ y, izAc }: { y?: Yanit; izAc: (id: string) => void }) {
  const [acik, setAcik] = useState(false);
  if (!y) return <div className="flex items-center gap-2 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12px] text-white/40 ring-1 ring-inset ring-white/[0.06]"><Loader2 className="h-3 w-3 animate-spin" />Bekliyor</div>;
  const tur = y.diyalog ? y.diyalog.filter((d) => d.rol === "ajan").length : 0;
  return (
    <div className={cn("rounded-[12px] ring-1 ring-inset", y.gecti ? "bg-[#55d6fd]/[0.05] ring-[#55d6fd]/20" : "bg-rose-500/[0.05] ring-rose-400/20")}>
      <button type="button" onClick={() => y.calisma && izAc(y.calisma)} className="block w-full rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className={cn("rounded-full px-2 py-px text-[11px] font-semibold", y.gecti ? TON_SINIF.iyi : TON_SINIF.hata)}>{y.gecti ? "Geçti" : "Kaldı"}</span><span className="text-[11px] text-white/40">{y.yargic === "model" ? "Yapay zekâ yargıcı" : "Kelime eşleşmesi"} · {sureYaz(y.sure)}{y.diyalog ? ` · ${tur} tur` : ""}</span></span>
        <span className="mt-1.5 block text-[12.5px] leading-relaxed text-white/75">{y.neden}</span>
        {!y.diyalog && <span className="mt-1 line-clamp-2 block text-[12px] leading-relaxed text-white/45">{y.yanit || "Boş yanıt"}</span>}
        {y.not && y.not !== y.neden && <span className="mt-1 block text-[12px] text-amber-200/80">{y.not}</span>}
        {y.araclar.length > 0 && <span className="mt-1 block truncate text-[11.5px] text-white/40">Araçlar: {y.araclar.join(", ")}</span>}
      </button>
      {!!y.diyalog?.length && (
        <div className="border-t border-white/[0.06] px-3 pb-2.5 pt-1.5">
          <button type="button" aria-expanded={acik} onClick={() => setAcik((x) => !x)} className="flex items-center gap-1.5 text-[12px] text-white/55 hover:text-white"><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} />{acik ? "Konuşmayı gizle" : "Konuşmayı gör"}</button>
          {acik && (
            <div className="mt-2 space-y-1.5">
              {y.diyalog.map((d, i) => (
                <div key={i} className={cn("flex", d.rol === "musteri" ? "justify-end" : "justify-start")}>
                  {d.rol === "musteri"
                    ? <p className="max-w-[88%] whitespace-pre-wrap rounded-[14px] bg-white/[0.08] px-3 py-2 text-[12.5px] leading-relaxed text-white/85">{d.metin}</p>
                    : <div className="max-w-[92%] rounded-[14px] bg-black/25 px-3 py-2 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/[0.06]"><Md metin={d.metin} onizle={() => {}} /></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Testler sekmesi: tek soru ve persona testleri, CSV ve konuşmadan içe aktarma, taslak ve yayındaki sürümü yan yana çalıştırma, yargıç sonuçları ve geçmiş. */
export function Testler({ a, izAc }: { a: Ajan; izAc: (id: string) => void }) {
  const [testler, setTestler] = useState<Test[] | null>(null);
  const [calismalar, setCalismalar] = useState<Calisma[]>([]);
  const [secili, setSecili] = useState<string | null>(null);
  const [hedef, setHedef] = useState<"taslak" | "yayin" | "ikisi">(a.yayin.durum === "yayinda" ? "ikisi" : "taslak");
  const [panel, setPanel] = useState<{ tur: "test"; t: Test | null } | { tur: "csv" } | { tur: "oneri" } | null>(null);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const yukle = useCallback(() => api<{ testler: Test[]; calismalar: Calisma[] }>(`/api/build/ajanlar/${a.id}/testler`).then((v) => { setTestler(v.testler); setCalismalar(v.calismalar); }).catch(() => setTestler([])), [a.id]);
  useEffect(() => { yukle(); }, [yukle]);
  const suruyor = calismalar.some((c) => c.durum === "calisiyor");
  useEffect(() => { if (!suruyor) return; const t = setInterval(yukle, 1500); return () => clearInterval(t); }, [suruyor, yukle]);
  const calistir = async (sadece?: string[]) => { setHata(""); try { const v = await api<{ calisma: string }>(`/api/build/ajanlar/${a.id}/testler`, { govde: { islem: "calistir", hedef, ...(sadece ? { testler: sadece } : {}) } }); setSecili(v.calisma); await yukle(); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Çalıştırılamadı."); } };
  const sil = async (id: string) => { const v = await api<{ testler: Test[] }>(`/api/build/ajanlar/${a.id}/testler`, { govde: { islem: "sil", test: id } }).catch(() => null); if (v) setTestler(v.testler); };
  const eklendi = (l: Test[], n: number) => { setTestler(l); setBilgi(`${n} test eklendi`); setTimeout(() => setBilgi(""), 3000); };
  const c = calismalar.find((x) => x.id === secili) ?? calismalar[0];
  const yayinda = a.yayin.durum === "yayinda";
  const kalanlar = c && c.durum !== "calisiyor" ? c.sonuclar.filter((s) => c.hedefler.some((h) => s[h] && !s[h]!.gecti)).map((s) => s.testId).filter((id) => testler?.some((t) => t.id === id)) : [];
  const dolu = (testler?.length ?? 0) >= 25;
  return (
    <div className="space-y-4">
      <Kart ikon={FlaskConical} baslik="Test seti" alt="Tek sorular ve persona konuşmaları; her değişiklikten sonra çalıştır"
        sag={<>
          <button type="button" onClick={() => setPanel({ tur: "oneri" })} disabled={dolu} className={cn(ikincil, "w-9 px-0")} title="Konuşmalardan test üret" aria-label="Konuşmalardan test üret"><MessagesSquare className="h-4 w-4" /></button>
          <button type="button" onClick={() => setPanel({ tur: "csv" })} disabled={dolu} className={cn(ikincil, "w-9 px-0")} title="CSV ya da tablodan içe aktar" aria-label="CSV ya da tablodan içe aktar"><FileUp className="h-4 w-4" /></button>
          <button type="button" onClick={() => setPanel({ tur: "test", t: null })} disabled={dolu} className={ikincil}><Plus className="h-3.5 w-3.5" />Test</button>
        </>}
        altSerit={testler?.length ? (
          <>
            {yayinda && <Secici id={`test-hedef-${a.id}`} kucuk deger={hedef} set={setHedef} l={[{ id: "taslak", ad: "Taslak" }, { id: "yayin", ad: `Sürüm ${a.yayin.surum}` }, { id: "ikisi", ad: "Yan yana" }]} />}
            <span className="flex-1 text-[12px] text-white/40">{bilgi || `${testler.length} test${hata ? "" : " · yazan araçlar çalıştırılmaz"}`}</span>
            {hata && <span className="text-[12.5px] text-rose-300">{hata}</span>}
            <button type="button" onClick={() => calistir()} disabled={suruyor} className={birincil}>{suruyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Çalıştır</button>
          </>
        ) : undefined}>
        {testler === null ? <div className="h-20 animate-pulse" /> : !testler.length ? (
          <BosDurum ikon={FlaskConical} baslik="Henüz test yok" alt="Ziyaretçilerin soracağı soruları ya da yapay zekânın canlandıracağı müşteri personalarını yaz. Talimatı değiştirdikten sonra çalıştır; taslağın yayındakinden iyi olup olmadığını yan yana gör.">
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setPanel({ tur: "test", t: null })} className={birincil}><Plus className="h-3.5 w-3.5" />İlk testi ekle</button>
              <button type="button" onClick={() => setPanel({ tur: "oneri" })} className={ikincil}><MessagesSquare className="h-3.5 w-3.5" />Konuşmalardan üret</button>
              <button type="button" onClick={() => setPanel({ tur: "csv" })} className={ikincil}><FileUp className="h-3.5 w-3.5" />CSV içe aktar</button>
            </div>
          </BosDurum>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {testler.map((t, i) => (
              <div key={t.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <span className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/[0.07] px-1.5 text-[11.5px] tabular-nums text-white/60">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  {t.tur === "persona" ? (
                    <span className="flex items-start gap-1.5 text-[13.5px] text-white/90"><UserRound className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /><span>{t.persona}</span></span>
                  ) : <span className="block text-[13.5px] text-white/90">{t.soru}</span>}
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-white/45">{t.tur === "persona" ? "Başarı ölçütü" : "Beklenen"}: {t.beklenen}</span>
                  {(t.tur === "persona" || (t.kaynak && t.kaynak !== "elle")) && (
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {t.tur === "persona" && <span className={cn(etiketSinif, TON_SINIF.iyi)}>Persona · en çok {t.turSiniri ?? 4} tur</span>}
                      {t.kaynak === "konusma" && <span className={cn(etiketSinif, TON_SINIF.notr)}>Konuşmadan</span>}
                      {t.kaynak === "csv" && <span className={cn(etiketSinif, TON_SINIF.notr)}>CSV</span>}
                    </span>
                  )}
                </span>
                <button type="button" onClick={() => setPanel({ tur: "test", t })} aria-label="Testi düzenle" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => sil(t.id)} aria-label="Testi sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </Kart>
      {c && (
        <Kart ikon={History} baslik="Sonuçlar" alt={`${gorece(c.zaman)} · ${c.hedefler.map((h) => (h === "taslak" ? "taslak" : `sürüm ${c.surum}`)).join(" ve ")}${c.durum === "calisiyor" ? " · sürüyor" : ""}`}
          sag={<span className="flex flex-wrap justify-end gap-1.5">{c.hedefler.map((h) => { const o = ozet(c, h); return <span key={h} className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium tabular-nums", o.biten && o.gecen === o.biten ? TON_SINIF.iyi : o.gecen < o.biten ? TON_SINIF.bekliyor : TON_SINIF.notr)}>{h === "taslak" ? "Taslak" : `Sürüm ${c.surum}`} {o.gecen} / {o.toplam}</span>; })}</span>}
          altSerit={kalanlar.length > 0 && !suruyor ? <><span className="flex-1 text-[12px] text-white/45">{kalanlar.length} test kaldı</span><button type="button" onClick={() => calistir(kalanlar)} className={ikincil}><RotateCcw className="h-3.5 w-3.5" />Kalanları yeniden çalıştır</button></> : undefined}>
          {c.hata && <p className="px-4 pt-3 text-[12.5px] text-rose-300 sm:px-5">{c.hata}</p>}
          <div className="divide-y divide-white/[0.05]">
            {c.hedefler.length > 1 && <div className="grid grid-cols-2 gap-2 px-4 pt-3 text-[11.5px] font-medium text-white/45 sm:px-5"><span>Taslak</span><span>Sürüm {c.surum}</span></div>}
            {c.sonuclar.map((s, i) => (
              <div key={s.testId} className="space-y-2 px-4 py-3 sm:px-5">
                <p className="text-[13px] text-white/85"><span className="mr-1.5 tabular-nums text-white/40">{i + 1}.</span>{s.persona ? <><UserRound className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-[#8be6ff]" />{s.persona}</> : s.soru}</p>
                <div className={cn("grid gap-2", c.hedefler.length > 1 ? "grid-cols-2" : "grid-cols-1")}>{c.hedefler.map((h) => <YanitHucresi key={h} y={s[h]} izAc={izAc} />)}</div>
              </div>
            ))}
          </div>
          {calismalar.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] px-4 py-3 sm:px-5">
              <span className="mr-1 text-[12px] text-white/40">Önceki</span>
              {calismalar.slice(0, 8).map((x) => <button key={x.id} type="button" onClick={() => setSecili(x.id)} className={cn("h-7 rounded-full px-2.5 text-[11.5px] tabular-nums ring-1 ring-inset", x.id === c.id ? "bg-white/[0.1] text-white ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>{gorece(x.zaman)} · {x.hedefler.map((h) => `${ozet(x, h).gecen}/${ozet(x, h).toplam}`).join(" ve ")}</button>)}
            </div>
          )}
        </Kart>
      )}
      {panel?.tur === "test" && <TestPaneli a={a} t={panel.t} kapat={() => setPanel(null)} kaydedildi={setTestler} />}
      {panel?.tur === "csv" && <IceAktarPaneli a={a} kapat={() => setPanel(null)} eklendi={eklendi} />}
      {panel?.tur === "oneri" && <OneriPaneli a={a} kapat={() => setPanel(null)} eklendi={eklendi} />}
    </div>
  );
}
