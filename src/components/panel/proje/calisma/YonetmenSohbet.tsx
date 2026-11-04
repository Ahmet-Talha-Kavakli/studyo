"use client";

/**
 * AI Yönetmen sohbetinin parçaları (Claude dili): Markdown, düşünce bloğu, mesaj eylemleri, ek görseller,
 * oturum menüsü (arama, gruplar, yeniden adlandırma, silme onayı).
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, History, Pencil, Pin, PinOff, Plus, RotateCcw, Search, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { Yuzen } from "@/components/ui/Yuzen";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";
import type { YonetmenOturum } from "@/store/useSinema";
import { gorece } from "@/components/panel/projeler/projeVeri";
import { ease } from "./ortak";

/* ── Markdown (sade): başlık, liste, alıntı, kod bloğu, kalın, italik, satır içi kod, bağlantı, @element ── */
function satirIci(s: string, k: string): React.ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*|\[[^\]]+\]\(https?:[^)\s]+\)|@[\p{L}\d_-]+)/u).map((p, i) => {
    const a = `${k}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={a} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(p)) return <code key={a} className="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.88em] text-[#ffb4c1]">{p.slice(1, -1)}</code>;
    if (/^\*[^*].*\*$/.test(p)) return <em key={a}>{p.slice(1, -1)}</em>;
    const l = p.match(/^\[([^\]]+)\]\((https?:[^)\s]+)\)$/);
    if (l) return <a key={a} href={l[2]} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-white/35 underline-offset-4 hover:decoration-white">{l[1]}</a>;
    if (/^@[\p{L}\d_-]+$/u.test(p)) return <span key={a} className="rounded-[5px] bg-[#55d6fd]/15 px-1 text-[#8be4ff]">{p}</span>;
    return <Fragment key={a}>{p}</Fragment>;
  });
}

export function Md({ metin, akiyor }: { metin: string; akiyor?: boolean }) {
  const bloklar = useMemo(() => {
    const out: React.ReactNode[] = [];
    const satirlar = metin.replace(/\r/g, "").split("\n");
    let i = 0, n = 0;
    while (i < satirlar.length) {
      const s = satirlar[i];
      if (/^```/.test(s)) {
        const dil = s.slice(3).trim();
        const kod: string[] = [];
        i++;
        while (i < satirlar.length && !/^```/.test(satirlar[i])) kod.push(satirlar[i++]);
        i++;
        out.push(<KodBlok key={n++} dil={dil} kod={kod.join("\n")} />);
        continue;
      }
      const h = s.match(/^(#{1,3})\s+(.*)$/);
      if (h) { out.push(<p key={n++} className={cn("font-semibold text-white", h[1].length === 1 ? "mt-1 text-[17px]" : "text-[15.5px]")}>{satirIci(h[2], `h${n}`)}</p>); i++; continue; }
      if (/^\s*[-*•]\s+/.test(s) || /^\s*\d+[.)]\s+/.test(s)) {
        const sirali = /^\s*\d+[.)]\s+/.test(s);
        const ogeler: string[] = [];
        while (i < satirlar.length && (sirali ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/).test(satirlar[i])) ogeler.push(satirlar[i++].replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ""));
        const L = sirali ? "ol" : "ul";
        out.push(<L key={n++} className={cn("space-y-1 pl-5", sirali ? "list-decimal marker:text-white/50" : "list-disc marker:text-white/40")}>{ogeler.map((o, j) => <li key={j} className="pl-1">{satirIci(o, `l${n}-${j}`)}</li>)}</L>);
        continue;
      }
      if (/^>\s?/.test(s)) {
        const q: string[] = [];
        while (i < satirlar.length && /^>\s?/.test(satirlar[i])) q.push(satirlar[i++].replace(/^>\s?/, ""));
        out.push(<blockquote key={n++} className="border-l-2 border-white/30 pl-3 text-white/75">{satirIci(q.join(" "), `q${n}`)}</blockquote>);
        continue;
      }
      if (/^-{3,}$/.test(s.trim())) { out.push(<hr key={n++} className="border-white/10" />); i++; continue; }
      if (!s.trim()) { i++; continue; }
      const p: string[] = [];
      while (i < satirlar.length && satirlar[i].trim() && !/^(```|#{1,3}\s|\s*[-*•]\s|\s*\d+[.)]\s|>)/.test(satirlar[i])) p.push(satirlar[i++]);
      out.push(<p key={n++}>{p.flatMap((x, j) => (j ? [<br key={`b${j}`} />, ...satirIci(x, `p${n}-${j}`)] : satirIci(x, `p${n}-${j}`)))}</p>);
    }
    return out;
  }, [metin]);
  return (
    <div className="space-y-3 text-[14.5px] leading-[1.7] text-white/90 [&>*:last-child]:inline-block">
      {bloklar}
      {akiyor && <span className="ml-0.5 inline-block h-[1.05em] w-[7px] translate-y-[3px] animate-pulse rounded-[2px] bg-white/80" />}
    </div>
  );
}

function KodBlok({ dil, kod }: { dil: string; kod: string }) {
  const [tamam, setTamam] = useState(false);
  return (
    <div className="block w-full overflow-hidden rounded-[12px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5 text-[12px] text-white/50">
        <span>{dil || "Metin"}</span>
        <button onClick={async () => { if (await mesaj.kopyala(kod, "Kod")) { setTamam(true); setTimeout(() => setTamam(false), 1400); } }} className="flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 hover:bg-white/[0.08] hover:text-white">
          {tamam ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{tamam ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[13px] leading-relaxed text-white/90 [scrollbar-width:thin]">{kod}</pre>
    </div>
  );
}

/* ── Düşünce bloğu ── */
export function DusunceBlok({ metin, sn, akiyor }: { metin?: string; sn?: number; akiyor?: boolean }) {
  const [acik, setAcik] = useState(false);
  const satirlar = (metin ?? "").trim();
  if (!akiyor && !satirlar) return null;
  return (
    <div className="mb-2.5">
      <button onClick={() => setAcik((v) => !v)} disabled={!satirlar} aria-expanded={acik}
        className="group/d flex items-center gap-1.5 rounded-full py-0.5 text-[13px] text-white/55 transition hover:text-white disabled:hover:text-white/55">
        {akiyor ? <span className="bg-[linear-gradient(90deg,rgba(255,255,255,.45),#fff,rgba(255,255,255,.45))] bg-[length:200%_100%] bg-clip-text text-transparent [animation:dusunce-isilti_1.6s_linear_infinite]">Düşünüyor</span>
          : <span>{sn ? `${sn} saniye düşündü` : "Düşündü"}</span>}
        {satirlar && <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} />}
      </button>
      <style>{`@keyframes dusunce-isilti{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
      <AnimatePresence initial={false}>
        {(acik || (akiyor && satirlar)) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease }} className="overflow-hidden">
            <div className={cn("mt-1.5 whitespace-pre-wrap border-l-2 border-white/[0.12] pl-3 text-[13px] leading-relaxed text-white/50", akiyor && !acik && "max-h-[4.6em] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_40%)]")}>
              {akiyor && !acik ? satirlar.slice(-320) : satirlar}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Mesaj eylem düğmesi ── */
export function Eylem({ etiket, onClick, aktif, children }: { etiket: string; onClick: () => void; aktif?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={etiket} title={etiket}
      className={cn("flex h-7 w-7 items-center justify-center rounded-[8px] transition hover:bg-white/[0.08] hover:text-white", aktif ? "text-white" : "text-white/50")}>{children}</button>
  );
}

export function YanitEylemleri({ metin, begeni, surumNo, surumSayisi, onBegeni, onYeniden, onSurum, zaman, demo }: {
  metin: string; begeni?: 1 | -1; surumNo: number; surumSayisi: number; onBegeni: (v: 1 | -1) => void; onYeniden: () => void; onSurum: (n: number) => void; zaman: number; demo?: boolean;
}) {
  const [kopya, setKopya] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-0.5">
      <Eylem etiket={kopya ? "Kopyalandı" : "Kopyala"} onClick={async () => { if (await mesaj.kopyala(metin, "Yanıt")) { setKopya(true); setTimeout(() => setKopya(false), 1400); } }}>{kopya ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</Eylem>
      <Eylem etiket="İyi yanıt" aktif={begeni === 1} onClick={() => onBegeni(1)}><ThumbsUp className={cn("h-3.5 w-3.5", begeni === 1 && "fill-white/20")} /></Eylem>
      <Eylem etiket="Kötü yanıt" aktif={begeni === -1} onClick={() => onBegeni(-1)}><ThumbsDown className={cn("h-3.5 w-3.5", begeni === -1 && "fill-white/20")} /></Eylem>
      <Eylem etiket="Yeniden oluştur" onClick={onYeniden}><RotateCcw className="h-3.5 w-3.5" /></Eylem>
      {surumSayisi > 1 && (
        <span className="ml-1 flex items-center text-[12px] tabular-nums text-white/55">
          <button onClick={() => onSurum(surumNo - 1)} disabled={surumNo <= 1} aria-label="Önceki yanıt" className="flex h-7 w-6 items-center justify-center rounded-[7px] hover:bg-white/[0.08] hover:text-white disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
          {surumNo} / {surumSayisi}
          <button onClick={() => onSurum(surumNo + 1)} disabled={surumNo >= surumSayisi} aria-label="Sonraki yanıt" className="flex h-7 w-6 items-center justify-center rounded-[7px] hover:bg-white/[0.08] hover:text-white disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
        </span>
      )}
      <span className="ml-1.5 text-[11.5px] text-white/35">{gorece(zaman) || "az önce"}</span>
      
    </div>
  );
}

/* ── Ek görseller ── */
export function EkKare({ src, onKaldir, buyuk }: { src: string; onKaldir?: () => void; buyuk?: boolean }) {
  return (
    <motion.span layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} className={cn("group/e relative block shrink-0 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10", buyuk ? "h-24 w-24" : "h-14 w-14")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {onKaldir && <button onClick={onKaldir} aria-label="Görseli kaldır" className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover/e:opacity-100 focus:opacity-100"><X className="h-3 w-3" /></button>}
    </motion.span>
  );
}

/* ── Oturum menüsü ── */
export function OturumMenusu({ oturumlar, aktif, onSec, onYeni, onSil, onAd, onSabit }: {
  oturumlar: YonetmenOturum[]; aktif: YonetmenOturum | null; onSec: (id: string) => void; onYeni: () => void; onSil: (id: string) => void; onAd: (id: string, ad: string) => void; onSabit: (id: string) => void;
}) {
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const [duzen, setDuzen] = useState<string | null>(null);
  const [sil, setSil] = useState<string | null>(null);
  const araRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!acik) { setQ(""); setDuzen(null); setSil(null); return; } const t = setTimeout(() => araRef.current?.focus(), 60); return () => clearTimeout(t); }, [acik]);
  const gruplar = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("tr");
    const l = oturumlar.filter((o) => !t || o.ad.toLocaleLowerCase("tr").includes(t) || o.mesajlar.some((m) => m.metin.toLocaleLowerCase("tr").includes(t)));
    const bugun = new Date(new Date().toDateString()).getTime();
    const g: [string, YonetmenOturum[]][] = [["Sabitlenenler", []], ["Bugün", []], ["Dün", []], ["Son 7 gün", []], ["Daha önce", []]];
    for (const o of [...l].sort((a, b) => b.zaman - a.zaman)) g[o.sabit ? 0 : o.zaman >= bugun ? 1 : o.zaman >= bugun - 86400e3 ? 2 : o.zaman >= bugun - 7 * 86400e3 ? 3 : 4][1].push(o);
    return g.filter(([, x]) => x.length);
  }, [oturumlar, q]);
  return (
    <>
      <div className="relative min-w-0 flex-1">
        <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={cn("flex h-9 max-w-full items-center gap-2 rounded-[10px] px-2.5 text-left transition hover:bg-white/[0.05]", acik && "bg-white/[0.06]")}>
          <History className="h-4 w-4 shrink-0 text-white/50" />
          <span className="truncate text-[13.5px] font-medium text-white">{aktif?.ad ?? "Yeni oturum"}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/50 transition-transform", acik && "rotate-180")} />
        </button>
        <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Oturumlar" className="w-[320px] overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#18191c]">
          <label className="flex h-11 items-center gap-2 border-b border-white/[0.06] px-3">
            <Search className="h-4 w-4 text-white/45" />
            <input ref={araRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Oturumlarda ara" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/35" />
          </label>
          <div className="max-h-[360px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {!gruplar.length && <p className="px-2.5 py-3 text-[13px] text-white/50">{oturumlar.length ? `"${q}" ile eşleşen oturum yok.` : "Henüz oturum yok. İlk mesajınla bir oturum başlar."}</p>}
            {gruplar.map(([ad, l]) => (
              <div key={ad}>
                <p className="px-2.5 pb-1 pt-2 text-[11.5px] font-medium text-white/40">{ad}</p>
                {l.map((o) => (
                  <div key={o.id} className={cn("group/o relative flex items-center rounded-[10px]", aktif?.id === o.id && "bg-white/[0.06]")}>
                    {duzen === o.id ? (
                      <input autoFocus defaultValue={o.ad} onKeyDown={(e) => { if (e.key === "Enter") { onAd(o.id, e.currentTarget.value.trim() || o.ad); setDuzen(null); } if (e.key === "Escape") setDuzen(null); }} onBlur={(e) => { onAd(o.id, e.currentTarget.value.trim() || o.ad); setDuzen(null); }}
                        className="m-1 h-8 min-w-0 flex-1 rounded-[8px] bg-white/[0.07] px-2 text-[13px] text-white outline-none ring-1 ring-inset ring-white/20" />
                    ) : sil === o.id ? (
                      <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-[13px] text-rose-200">Silinsin mi?</span>
                        <button onClick={() => setSil(null)} className="h-7 rounded-full px-2.5 text-[12px] text-white/70 hover:bg-white/[0.08]">Vazgeç</button>
                        <button onClick={() => { onSil(o.id); setSil(null); }} className="h-7 rounded-full bg-rose-500 px-2.5 text-[12px] font-semibold text-white">Sil</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { onSec(o.id); setAcik(false); }} className="min-w-0 flex-1 px-2.5 py-1.5 text-left">
                          <span className="block truncate text-[13px] text-white/90">{o.ad}</span>
                          <span className="block text-[11.5px] text-white/40">{o.mesajlar.length} mesaj · {gorece(o.zaman) || "az önce"}</span>
                        </button>
                        <span className="flex shrink-0 items-center pr-1 opacity-0 transition group-hover/o:opacity-100">
                          <Eylem etiket={o.sabit ? "Sabitlemeyi kaldır" : "Sabitle"} onClick={() => onSabit(o.id)}>{o.sabit ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}</Eylem>
                          <Eylem etiket="Yeniden adlandır" onClick={() => setDuzen(o.id)}><Pencil className="h-3.5 w-3.5" /></Eylem>
                          <Eylem etiket="Sil" onClick={() => setSil(o.id)}><Trash2 className="h-3.5 w-3.5" /></Eylem>
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={() => { onYeni(); setAcik(false); }} className="flex w-full items-center gap-2 border-t border-white/[0.06] px-3.5 py-2.5 text-left text-[13px] text-white/80 hover:bg-white/[0.04] hover:text-white"><Plus className="h-4 w-4" />Yeni oturum</button>
        </Yuzen>
      </div>
    </>
  );
}

