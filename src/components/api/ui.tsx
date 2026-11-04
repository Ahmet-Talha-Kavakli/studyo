"use client";

/**
 * Vayra API arayüz parçaları — kod editörü, rozetler, kartlar, başlıklar.
 * Tüm /panel/api sayfaları bu dosyadaki dili konuşur.
 */

import { Yuzen } from "@/components/ui/Yuzen";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { LayoutGroup, motion } from "framer-motion";
import Link from "next/link";
import { Check, ChevronDown, Copy, Eye, EyeOff, FlaskConical, KeyRound, Plus, Radio, WrapText, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { renklendir, PARCA_RENK, dilBul } from "@/lib/api/renklendir";
import { YONTEM_RENK, type Yontem } from "@/lib/api/ucnoktalar";
import { useApiAnahtar, anahtarMaske, type AnahtarOrtam, type ApiAnahtar } from "@/store/useApiAnahtar";
import { cn } from "@/lib/utils";

export async function panoyaKopyala(metin: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(metin); return true; } catch { /* yedek */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = metin; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch { return false; }
}

export function KopyalaDugme({ metin, etiket, className, sessiz }: { metin: string; etiket?: string; className?: string; sessiz?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" aria-label={etiket ? `${etiket} kopyala` : "Kopyala"} title="Kopyala"
      onClick={async () => {
        if (!(await panoyaKopyala(metin))) return mesaj.kopyalanamadi();
        setOk(true);
        if (!sessiz) toast.success(etiket ? `${etiket} kopyalandı` : "Panoya kopyalandı");
        setTimeout(() => setOk(false), 1500);
      }}
      className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-[#a9b1d6] transition-colors hover:bg-white/[0.08] hover:text-white", className)}>
      {ok ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
      {etiket !== undefined && <span>{ok ? "Kopyalandı" : "Kopyala"}</span>}
    </button>
  );
}

/* ── Kod editörü ── */

export interface KodSekme { id: string; ad: string; kod: string; dil?: string }

export function KodEditor({
  kod, dil = "duz", baslik, sekmeler, aktif, onSekme, satirNo = true, maxH = 520, className, sag, alt, gizle, dosyaAdi,
}: {
  kod?: string; dil?: string; baslik?: ReactNode; sekmeler?: KodSekme[]; aktif?: string; onSekme?: (id: string) => void;
  satirNo?: boolean; maxH?: number | "none"; className?: string; sag?: ReactNode; alt?: ReactNode;
  /** Bu metin geçen yerleri maskele (anahtar), göz düğmesiyle aç */
  gizle?: string; dosyaAdi?: string;
}) {
  const [sarma, setSarma] = useState(false);
  const [goster, setGoster] = useState(false);
  const sekme = sekmeler?.find((s) => s.id === aktif) ?? sekmeler?.[0];
  const metin = sekme?.kod ?? kod ?? "";
  const gorunen = gizle && !goster ? metin.split(gizle).join(anahtarMaske(gizle)) : metin;
  const d = dilBul(sekme?.dil ?? sekme?.id ?? dil);
  const satirlar = useMemo(() => renklendir(gorunen, d), [gorunen, d]);
  const genislik = String(satirlar.length).length;

  return (
    <div className={cn("overflow-hidden rounded-[18px] bg-[#111216] ring-1 ring-white/[0.08]", className)}>
      <div className="flex h-11 items-center gap-2 border-b border-white/[0.06] bg-[#14151a] pl-3.5 pr-1.5">
        <span className="mr-1 hidden items-center gap-1.5 sm:flex" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </span>
        {sekmeler && sekmeler.length > 1 ? (
          <div className="-mb-px flex h-full min-w-0 items-stretch overflow-x-auto [scrollbar-width:none]" role="tablist">
            {sekmeler.map((s) => (
              <button key={s.id} role="tab" aria-selected={s.id === sekme?.id} onClick={() => onSekme?.(s.id)}
                className={cn("relative shrink-0 px-3 text-[12.5px] font-medium transition-colors", s.id === sekme?.id ? "text-white" : "text-[#787c99] hover:text-[#c0caf5]")}>
                {s.ad}
                {s.id === sekme?.id && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-[#55d6fd]" />}
              </button>
            ))}
          </div>
        ) : (
          <span className="truncate text-[12.5px] text-[#787c99]">{dosyaAdi ?? baslik ?? sekme?.ad ?? dilAdi(d)}</span>
        )}
        <div className="ml-auto flex shrink-0 items-center">
          {sag}
          {gizle && (
            <button onClick={() => setGoster((v) => !v)} aria-label={goster ? "Anahtarı gizle" : "Anahtarı göster"} title={goster ? "Anahtarı gizle" : "Anahtarı göster"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a9b1d6] hover:bg-white/[0.08] hover:text-white">{goster ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
          )}
          <button onClick={() => setSarma((v) => !v)} aria-pressed={sarma} aria-label="Satırları kaydır" title="Satırları kaydır"
            className={cn("hidden h-8 w-8 items-center justify-center rounded-lg hover:bg-white/[0.08] sm:flex", sarma ? "text-white" : "text-[#787c99]")}><WrapText className="h-3.5 w-3.5" /></button>
          <KopyalaDugme metin={metin} etiket="" sessiz className="[&>span]:hidden sm:[&>span]:inline" />
        </div>
      </div>
      <div className="overflow-auto [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin]" style={{ maxHeight: maxH === "none" ? undefined : maxH }}>
        <pre className={cn("py-3.5 font-mono text-[12.5px] leading-[1.75]", sarma ? "whitespace-pre-wrap break-all" : "w-max min-w-full whitespace-pre")}>
          {satirlar.map((satir, i) => (
            <div key={i} className="flex pr-5 hover:bg-white/[0.025]">
              {satirNo && <span className="sticky left-0 select-none bg-[#111216] pl-4 pr-4 text-right text-[#3b3f5c]" style={{ minWidth: `${genislik + 3}ch` }}>{i + 1}</span>}
              <code className={cn("min-w-0", !satirNo && "pl-4")}>
                {satir.length ? satir.map((p, j) => <span key={j} style={{ color: PARCA_RENK[p.c], fontStyle: p.c === "yorum" ? "italic" : undefined }}>{p.t}</span>) : " "}
              </code>
            </div>
          ))}
        </pre>
      </div>
      {alt}
    </div>
  );
}

const DIL_ADI: Record<string, string> = { bash: "cURL", js: "JavaScript", ts: "TypeScript", py: "Python", json: "JSON", go: "Go", duz: "Metin" };
const dilAdi = (d: string) => DIL_ADI[d] ?? d;

/* ── Rozetler ── */

export function YontemRozet({ yontem, className }: { yontem: Yontem | string; className?: string }) {
  return <span className={cn("inline-flex h-[22px] shrink-0 items-center rounded-md px-1.5 font-mono text-[11px] font-semibold ring-1 ring-inset", YONTEM_RENK[yontem as Yontem] ?? "text-metin-2 ring-white/15", className)}>{yontem}</span>;
}

const DURUM_STIL: Record<string, [string, string]> = {
  queued: ["Kuyrukta", "bg-white/[0.06] text-metin-2 ring-white/10"],
  processing: ["İşleniyor", "bg-[#55d6fd]/10 text-[#55d6fd] ring-[#55d6fd]/25"],
  succeeded: ["Başarılı", "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"],
  failed: ["Başarısız", "bg-rose-400/10 text-rose-300 ring-rose-400/25"],
  canceled: ["İptal", "bg-white/[0.05] text-metin-2 ring-white/10"],
  pending: ["Bekliyor", "bg-amber-400/10 text-amber-200 ring-amber-400/25"],
};
export function DurumRozet({ durum }: { durum: string }) {
  const [ad, s] = DURUM_STIL[durum] ?? [durum, "bg-white/[0.06] text-metin-2 ring-white/10"];
  return (
    <span className={cn("inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 text-[11.5px] font-medium ring-1 ring-inset", s)}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", durum === "processing" && "animate-pulse")} />{ad}
    </span>
  );
}
export function HttpRozet({ kod }: { kod: number }) {
  const s = kod === 0 ? "text-rose-300" : kod < 300 ? "text-emerald-300" : kod < 500 ? "text-amber-200" : "text-rose-300";
  return <span className={cn("font-mono text-[12px] font-semibold tabular-nums", s)}>{kod || "ERR"}</span>;
}
export function OrtamRozet({ ortam }: { ortam: "canli" | "test" | "live" }) {
  const canli = ortam !== "test";
  return <span className={cn("inline-flex h-[20px] shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium", canli ? "bg-[#55d6fd]/12 text-[#55d6fd]" : "bg-amber-400/12 text-amber-200")}><span className="h-1 w-1 rounded-full bg-current" />{canli ? "Canlı" : "Test"}</span>;
}

/* ── Yerleşim ── */

export function SayfaBaslik({ baslik, aciklama, sag, ust }: { baslik: ReactNode; aciklama?: ReactNode; sag?: ReactNode; ust?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-[720px]">
        {ust && <div className="mb-2">{ust}</div>}
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-white sm:text-[30px]">{baslik}</h1>
        {aciklama && <p className="mt-1.5 text-[14.5px] leading-relaxed text-metin-2">{aciklama}</p>}
      </div>
      {sag && <div className="flex flex-wrap items-center gap-2">{sag}</div>}
    </header>
  );
}

export function Kart({ children, className, baslik, sag, aciklama, govdeSinif }: { children: ReactNode; className?: string; baslik?: ReactNode; sag?: ReactNode; aciklama?: ReactNode; govdeSinif?: string }) {
  return (
    <section className={cn("rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]", className)}>
      {(baslik || sag) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-white">{baslik}</h2>
            {aciklama && <p className="mt-0.5 text-[13px] text-white/60">{aciklama}</p>}
          </div>
          {sag && <div className="flex items-center gap-2">{sag}</div>}
        </div>
      )}
      <div className={cn(baslik || sag ? "p-5" : "", govdeSinif)}>{children}</div>
    </section>
  );
}

export function Istatistik({ etiket, deger, alt, ikon: I, renk = "vurgu" }: { etiket: string; deger: ReactNode; alt?: ReactNode; ikon?: React.ElementType; renk?: "vurgu" | "yesil" | "kirmizi" | "sari" | "mavi" }) {
  const r = { vurgu: "text-[#55d6fd] bg-[#55d6fd]/12", yesil: "text-emerald-300 bg-emerald-400/10", kirmizi: "text-rose-300 bg-rose-400/10", sari: "text-amber-200 bg-amber-400/10", mavi: "text-sky-300 bg-sky-400/10" }[renk];
  return (
    <div className="rounded-[18px] bg-white/[0.025] p-4 ring-1 ring-white/[0.08]">
      <div className="flex items-center gap-2 text-[12.5px] text-metin-2">
        {I && <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", r)}><I className="h-3.5 w-3.5" /></span>}
        {etiket}
      </div>
      <div className="mt-2.5 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-white">{deger}</div>
      {alt && <div className="mt-0.5 text-[12.5px] text-metin-2">{alt}</div>}
    </div>
  );
}

export function BosDurum({ ikon: I, baslik, aciklama, eylem }: { ikon: React.ElementType; baslik: string; aciklama: string; eylem?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd]/12 text-[#55d6fd]"><I className="h-5 w-5" /></span>
      <p className="mt-4 text-[15.5px] font-medium text-white">{baslik}</p>
      <p className="mt-1.5 max-w-[420px] text-[13.5px] leading-relaxed text-metin-2">{aciklama}</p>
      {eylem && <div className="mt-5 flex flex-wrap justify-center gap-2">{eylem}</div>}
    </div>
  );
}

export const birincil = "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#55d6fd] px-4 text-[13px] font-semibold text-[#06222b] transition hover:brightness-110 active:scale-[0.97] disabled:bg-white/[0.07] disabled:text-white/35 disabled:hover:brightness-100 disabled:active:scale-100";
export const ikincil = "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100";
export const vurguBtn = birincil;
export const girdi = "h-11 w-full rounded-[14px] bg-white/[0.045] px-3.5 text-[14px] text-white outline-none ring-1 ring-white/[0.09] transition placeholder:text-white/40 hover:ring-white/[0.16] focus:bg-white/[0.06] focus:ring-[#55d6fd]/60";
export const etiket = "mb-2 block text-[13px] font-medium text-white/80";

/* ── Anahtar seçici ── */

export function AnahtarSecici({ secili, onSec, className, testeIzin = true }: { secili: ApiAnahtar | null; onSec: (a: ApiAnahtar) => void; className?: string; testeIzin?: boolean }) {
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar).filter((a) => testeIzin || a.ortam === "canli");
  const olustur = useApiAnahtar((s) => s.anahtarOlustur);
  const [acik, setAcik] = useState(false);
  return (
    <div className={cn("relative", className)}>
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="flex h-9 w-full items-center gap-2 rounded-full bg-white/[0.05] px-3 text-left text-[13px] text-white ring-1 ring-white/[0.09] transition hover:ring-white/20">
        <KeyRound className="h-3.5 w-3.5 shrink-0 text-metin-2" />
        {secili ? <><span className="min-w-0 flex-1 truncate">{secili.ad}</span><OrtamRozet ortam={secili.ortam} /></> : <span className="flex-1 text-metin-2">Anahtar seç</span>}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-metin-2" />
      </button>
      <Yuzen acik={!!(acik)} onKapat={() => setAcik(false)} sag={0} ust={"tam"} bosluk={6} className="w-[300px] max-w-[calc(100vw-32px)] rounded-[16px] bg-[#17181b] p-1.5 ring-1 ring-white/[0.1]">
            {anahtarlar.map((a) => (
              <button key={a.id} onClick={() => { onSec(a); setAcik(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/[0.06]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-white">{a.ad}</p>
                  <p className="truncate font-mono text-[11px] text-metin-2">{anahtarMaske(a.tam)}</p>
                </div>
                <OrtamRozet ortam={a.ortam} />
                {secili?.id === a.id && <Check className="h-3.5 w-3.5 text-[#55d6fd]" />}
              </button>
            ))}
            {!anahtarlar.length && <p className="px-2.5 py-2 text-[12.5px] text-metin-2">Henüz anahtar yok.</p>}
            <div className="mt-1 border-t border-white/[0.06] pt-1">
              <button onClick={async () => { const a = await olustur({ ad: "Test anahtarı", ortam: "test" }); onSec(a); setAcik(false); toast.success("Test anahtarı oluşturuldu", { description: "Kredi harcamaz; örnek çıktı döndürür." }); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-white hover:bg-white/[0.06]"><Plus className="h-3.5 w-3.5 text-metin-2" />Hızlı test anahtarı oluştur</button>
              <Link href="/panel/api/anahtarlar" onClick={() => setAcik(false)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-metin-2 hover:bg-white/[0.06] hover:text-white"><KeyRound className="h-3.5 w-3.5" />Anahtarları yönet</Link>
            </div>
          </Yuzen>
    </div>
  );
}

/** Seçili anahtar — oturum boyunca hatırlanır; yoksa varsayılan ortamın ilk anahtarı, o da yoksa ilk anahtar. */
export function useSeciliAnahtar(): [ApiAnahtar | null, (a: ApiAnahtar) => void] {
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const ortam = useApiAnahtar((s) => s.varsayilanOrtam);
  const [id, setId] = useState<string | null>(() => { try { return sessionStorage.getItem("vayra-api-secili"); } catch { return null; } });
  // Elle seçilen anahtar yoksa kenar çubuğundaki varsayılan ortamın ilk anahtarı.
  const secili = anahtarlar.find((a) => a.id === id) ?? anahtarlar.find((a) => a.ortam === ortam) ?? anahtarlar[0] ?? null;
  return [secili, (a) => { setId(a.id); try { sessionStorage.setItem("vayra-api-secili", a.id); } catch { /* yok */ } }];
}

/* ── Zaman ── */
export function goreli(t: number | string | null | undefined): string {
  if (!t) return "—";
  const ms = Date.now() - (typeof t === "string" ? Date.parse(t) : t);
  if (ms < 45_000) return "az önce";
  if (ms < 3600_000) return `${Math.round(ms / 60_000)} dk önce`;
  if (ms < 86400_000) return `${Math.round(ms / 3600_000)} sa önce`;
  if (ms < 30 * 86400_000) return `${Math.round(ms / 86400_000)} gün önce`;
  return new Date(typeof t === "string" ? Date.parse(t) : t).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}
export const tarihSaat = (t: number | string) => new Date(typeof t === "string" ? Date.parse(t) : t).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
export const sureMetin = (ms: number | null | undefined) => (ms === null || ms === undefined ? "—" : ms < 1000 ? `${Math.round(ms)} ms` : `${Number((ms / 1000).toFixed(ms < 10_000 ? 2 : 1)).toLocaleString("tr-TR")} sn`);

/* ── Modal (body'ye portal; panel geçiş animasyonunun transform'undan etkilenmez) ── */
export function Modal({ acik, onKapat, baslik, aciklama, children, genislik = 520, alt }: {
  acik: boolean; onKapat: () => void; baslik: ReactNode; aciklama?: ReactNode; children: ReactNode; genislik?: number; alt?: ReactNode;
}) {
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    window.addEventListener("keydown", tus, true);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tus, true); document.body.style.overflow = eski; };
  }, [acik, onKapat]);
  if (!acik || typeof document === "undefined") return null;
  return createPortal(
    <div className="perde kesfet-tema fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
      <div role="dialog" aria-modal="true" className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-[#141416] ring-1 ring-white/[0.1] sm:rounded-[24px]" style={{ maxWidth: genislik }}>
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-white">{baslik}</h2>
            {aciklama && <p className="mt-1 text-[13.5px] leading-relaxed text-metin-2">{aciklama}</p>}
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3">{children}</div>
        {alt && <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.06] px-6 py-4">{alt}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Onay penceresi — geri alınamaz işlemler için. */
export function Onay({ acik, onKapat, baslik, aciklama, eylem, onOnay, tehlike = true }: { acik: boolean; onKapat: () => void; baslik: string; aciklama: ReactNode; eylem: string; onOnay: () => void; tehlike?: boolean }) {
  return (
    <Modal acik={acik} onKapat={onKapat} baslik={baslik} genislik={440}
      alt={<><button onClick={onKapat} className={ikincil}>Vazgeç</button><button onClick={() => { onOnay(); onKapat(); }} className={cn(birincil, tehlike && "bg-rose-500 text-white hover:brightness-110")}>{eylem}</button></>}>
      <div className="text-[14px] leading-relaxed text-metin-2">{aciklama}</div>
    </Modal>
  );
}

export function Secenek({ secili, onClick, baslik, aciklama, ikon: I, className }: { secili: boolean; onClick: () => void; baslik: ReactNode; aciklama?: ReactNode; ikon?: React.ElementType; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={secili}
      className={cn("group relative flex w-full items-start gap-3 rounded-[18px] p-3.5 text-left ring-1 transition active:scale-[0.99]", secili ? "bg-[#55d6fd]/[0.07] ring-[#55d6fd]/55" : "bg-white/[0.025] ring-white/[0.08] hover:bg-white/[0.04] hover:ring-white/[0.16]", className)}>
      {I && <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition-colors", secili ? "bg-[#55d6fd]/15 text-[#55d6fd]" : "bg-white/[0.06] text-white/70 group-hover:text-white")}><I className="h-4 w-4" /></span>}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[14px] font-semibold text-white">{baslik}</p>
        {aciklama && <p className="mt-0.5 text-[12.5px] leading-snug text-white/60">{aciklama}</p>}
      </div>
      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition", secili ? "bg-[#55d6fd] text-[#06222b]" : "ring-1 ring-inset ring-white/20")}>{secili && <Check className="h-3 w-3" strokeWidth={3.2} />}</span>
    </button>
  );
}

/** Kayan beyaz zeminli seçim şeridi — enum seçimleri, sekmeler, aralıklar. */
export function SecimSerit<T extends string | number>({ secenek, deger, onDegis, id, kucuk, className }: { secenek: { id: T; ad: ReactNode }[]; deger: T; onDegis: (v: T) => void; id: string; kucuk?: boolean; className?: string }) {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" className={cn("inline-flex max-w-full flex-wrap gap-0.5 rounded-full bg-white/[0.05] p-1 ring-1 ring-white/[0.08]", className)}>
        {secenek.map((s) => (
          <button key={String(s.id)} type="button" role="radio" aria-checked={deger === s.id} onClick={() => onDegis(s.id)}
            className={cn("relative rounded-full font-medium transition active:scale-[0.96]", kucuk ? "h-7 px-3 text-[12.5px]" : "h-8 px-3.5 text-[13px]")}>
            {deger === s.id && <motion.span layoutId={id + "-z"} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className={cn("relative whitespace-nowrap transition-colors", deger === s.id ? "text-black" : "text-white/70 hover:text-white")}>{s.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

export function Anahtar({ acik, onDegis, etiket: e }: { acik: boolean; onDegis: (v: boolean) => void; etiket: string }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={e} onClick={() => onDegis(!acik)}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", acik ? "bg-[#55d6fd]" : "bg-white/[0.14]")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", acik ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

/** Dar alanlar için: "şimdi", "4 dk", "2 sa", "3 g". */
export function kisaZaman(t: number | string): string {
  const ms = Date.now() - (typeof t === "string" ? Date.parse(t) : t);
  if (ms < 60_000) return "şimdi";
  if (ms < 3600_000) return `${Math.floor(ms / 60_000)} dk`;
  if (ms < 86400_000) return `${Math.floor(ms / 3600_000)} sa`;
  return `${Math.floor(ms / 86400_000)} g`;
}

/** Gelecekteki bir an için kalan süre: "45 dk", "5 saat", "12 gün". */
export function kalanSure(t: number): string {
  const ms = t - Date.now();
  if (ms <= 0) return "şimdi";
  if (ms < 3600_000) return `${Math.max(1, Math.round(ms / 60_000))} dk`;
  if (ms < 86400_000) return `${Math.round(ms / 3600_000)} saat`;
  return `${Math.round(ms / 86400_000)} gün`;
}

/** Nötr ortam seçici (Test/Canlı): seçili zemin beyaz cam, ortam rengi yalnızca ikonda. Varsayılan ortama bağlı. */
export function OrtamSecici({ id, tam, className }: { id: string; tam?: boolean; className?: string }) {
  const ortam = useApiAnahtar((s) => s.varsayilanOrtam);
  const set = useApiAnahtar((s) => s.setVarsayilanOrtam);
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" aria-label="Varsayılan ortam" title="Oyun alanı ve konsolda önce bu ortamın anahtarı seçilir"
        className={cn("grid grid-cols-2 rounded-full bg-white/[0.04] p-[3px] ring-1 ring-white/[0.08]", tam ? "w-full" : "w-max", className)}>
        {(["test", "canli"] as AnahtarOrtam[]).map((o) => {
          const s = ortam === o;
          const Ik = o === "test" ? FlaskConical : Radio;
          return (
            <button key={o} role="radio" aria-checked={s} onClick={() => set(o)} className="relative flex h-8 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium active:scale-[0.97]">
              {s && <motion.span layoutId={id + "-z"} className="absolute inset-0 rounded-full bg-white/[0.11] ring-1 ring-white/[0.14]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <Ik className="relative h-3.5 w-3.5 transition-colors duration-300" style={{ color: s ? (o === "test" ? "#fcd34d" : "#55d6fd") : "rgba(255,255,255,0.45)" }} />
              <span className={cn("relative transition-colors", s ? "text-white" : "text-white/55 hover:text-white")}>{o === "test" ? "Test" : "Canlı"}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
