"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, Copy, ExternalLink, FileText, Globe, ImageIcon, LayoutDashboard, Gamepad2, Pencil, RotateCcw, ThumbsDown, ThumbsUp,
  TriangleAlert, Volume2, VolumeX, X, ChevronDown, Square, CornerDownRight, ArrowUp, AppWindow, GitBranch, Zap, Download, FileText as BelgeIkon, Table2, MoreHorizontal, BookmarkCheck , Minimize2, Maximize2, Feather, Briefcase, Smile, List as ListIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Yuzen } from "@/components/ui/Yuzen";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import type { SCMesaj, SCCikti } from "@/store/useSupercomputer";
import type { AjanOlay } from "@/lib/scAjanOlay";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { SC_MODELLER, yanitMetni, type ScKaynak } from "@/lib/scSohbet";
import { Markdown, alanAdi, favikon } from "./Markdown";
import { AjanPlani, AracAdim, AramaAdim, KodAdim, DusunmeBlok, IkonYigini, sureYaz } from "./Adimlar";
import { Ipucu } from "./Ipucu";
import { SCLogoCanli } from "@/components/kabuk/sc/SCLogoCanli";
import { MesajAlintisi } from "./Alinti";
import { useScTercih } from "@/store/useScTercih";
import { csvIndir, mdIndir, pdfYazdir, tablolariCsv, wordIndir } from "@/lib/scIndir";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const IKON = "flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors duration-100 hover:bg-white/[0.06] hover:text-[var(--sc-metin)]";
const saatYaz = (z: number) => {
  const d = new Date(z), bugun = new Date();
  const saat = d.toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });
  return d.toDateString() === bugun.toDateString() ? saat : `${d.toLocaleDateString("tr", { day: "numeric", month: "short" })} ${saat}`;
};

/** Simge düğmesi + ipucu. */
function Eylem({ ipucu, tus, children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { ipucu: string; tus?: string }) {
  return <Ipucu metin={ipucu} tus={tus}><button aria-label={ipucu} {...p} className={cn(IKON, className)}>{children}</button></Ipucu>;
}

/** Dal gezintisi: ‹ 2/3 › */
export function DalGezgini({ i, n, onGit }: { i: number; n: number; onGit: (y: -1 | 1) => void }) {
  if (n < 2) return null;
  return (
    <span className="mr-1 flex items-center text-[12.5px] tabular-nums text-[var(--sc-metin-2)]">
      <Ipucu metin="Önceki sürüm"><button onClick={() => onGit(-1)} disabled={i === 0} aria-label="Önceki sürüm" className="flex h-7 w-6 items-center justify-center rounded-md hover:bg-white/[0.06] hover:text-[var(--sc-metin)] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button></Ipucu>
      <span className="min-w-[26px] text-center">{i + 1}/{n}</span>
      <Ipucu metin="Sonraki sürüm"><button onClick={() => onGit(1)} disabled={i === n - 1} aria-label="Sonraki sürüm" className="flex h-7 w-6 items-center justify-center rounded-md hover:bg-white/[0.06] hover:text-[var(--sc-metin)] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></Ipucu>
    </span>
  );
}

function KopyalaDugme({ metin, etiket = "Kopyala", tus }: { metin: string; etiket?: string; tus?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Eylem ipucu={ok ? "Kopyalandı" : etiket} tus={ok ? undefined : tus} onClick={() => { void navigator.clipboard.writeText(metin); setOk(true); setTimeout(() => setOk(false), 1600); }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={String(ok)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }}>
          {ok ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </Eylem>
  );
}

/* ═══════════ KULLANICI ═══════════ */
const UZUN_SATIR = 9;
export function KullaniciMesaji({ m, dal, onDalGit, onDuzenle, kilitli, sonKullanici }: {
  m: SCMesaj; dal?: { i: number; n: number }; onDalGit?: (y: -1 | 1) => void; onDuzenle: (metin: string) => void; kilitli?: boolean; sonKullanici?: boolean;
}) {
  const [duzen, setDuzen] = useState(false);
  const [taslak, setTaslak] = useState(m.metin);
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const kutu = useRef<HTMLDivElement>(null);
  const uzun = m.metin.split("\n").length > UZUN_SATIR || m.metin.length > 700;
  /* Boş kutuda ↑ → son mesajı düzenle. */
  useEffect(() => {
    if (!sonKullanici || kilitli) return;
    const ac = () => { setTaslak(m.metin); setDuzen(true); };
    window.addEventListener("sc-son-duzenle", ac); return () => window.removeEventListener("sc-son-duzenle", ac);
  }, [sonKullanici, kilitli, m.metin]);
  useEffect(() => {
    if (!duzen) return;
    const t = ref.current; t?.focus(); t?.setSelectionRange(t.value.length, t.value.length);
    kutu.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [duzen]);
  const kaydet = () => { const t = taslak.trim(); if (!t) return; setDuzen(false); if (t !== m.metin) onDuzenle(t); };

  if (duzen) {
    return (
      <motion.div ref={kutu} initial={{ opacity: 0.6, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={YAY}
        className="ml-auto w-full max-w-[640px] rounded-[20px] bg-[#1c1c1f] p-3 ring-1 ring-inset ring-[var(--sc-aksan)]/40">
        <textarea ref={ref} value={taslak} onChange={(e) => setTaslak(e.target.value)} aria-label="Mesajı düzenle"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); kaydet(); } else if (e.key === "Escape") { e.preventDefault(); setDuzen(false); setTaslak(m.metin); } }}
          className="block max-h-[40vh] w-full resize-none bg-transparent px-1 text-[15.5px] leading-relaxed text-[var(--sc-metin)] caret-[var(--sc-aksan)] outline-none [field-sizing:content]" />
        <div className="mt-2.5 flex items-center justify-end gap-2">
          <span className="mr-auto text-[12px] leading-snug text-[var(--sc-metin-3)]">Yeni bir dal açılır; önceki yanıta ‹ › ile dönebilirsin.</span>
          <button onClick={() => { setDuzen(false); setTaslak(m.metin); }} className="h-8 rounded-full px-3.5 text-[13px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">İptal</button>
          <button onClick={kaydet} disabled={!taslak.trim()} className="h-8 rounded-full bg-[var(--sc-metin)] px-3.5 text-[13px] font-semibold text-[#111113] transition-opacity disabled:opacity-40">Gönder</button>
        </div>
      </motion.div>
    );
  }
  return (
    <div className="group flex flex-col items-end">
      {m.alinti && <MesajAlintisi metin={m.alinti} />}
      {m.calisan && <span className="mb-1.5 flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-medium text-[var(--sc-metin-2)]">@{m.calisan}</span>}
      {m.beceri && <span className="mb-1.5 flex items-center gap-1 rounded-full bg-[var(--sc-aksan)]/10 px-2.5 py-0.5 text-[12px] font-medium text-[var(--sc-aksan)]"><Zap className="h-3 w-3" />{m.beceri}</span>}
      {!!m.ekler?.length && (
        <div className="mb-2 flex max-w-[640px] flex-wrap justify-end gap-2">
          {m.ekler.map((e, i) => e.tur === "gorsel" && e.onizleme
            // eslint-disable-next-line @next/next/no-img-element
            ? <img key={i} src={e.onizleme} alt={e.ad} title={e.ad} className="h-[96px] w-[96px] rounded-[14px] object-cover ring-1 ring-inset ring-white/10" />
            : (
              <span key={i} title={e.ad} className="flex h-[56px] w-[200px] flex-col justify-center gap-0.5 rounded-[12px] bg-white/[0.045] px-3 ring-1 ring-inset ring-white/[0.08]">
                <span className="truncate text-[12.5px] font-medium text-[var(--sc-metin)]">{e.ad}</span>
                <span className="flex items-center gap-1 text-[11px] text-[var(--sc-metin-3)]"><FileText className="h-3 w-3" />{e.ad === "Yapıştırılan metin" ? "Metin" : e.ad.split(".").pop()?.toLocaleUpperCase("tr")}</span>
              </span>
            ))}
        </div>
      )}
      {m.metin && (
        <div className="relative max-w-[640px] rounded-[20px] bg-[#1c1c1f] px-4 py-2.5 text-[15.5px] leading-relaxed text-[var(--sc-metin)]">
          <div className={cn("whitespace-pre-wrap break-words", uzun && !acik && "max-h-[13.5em] overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]")}>{m.metin}</div>
          {uzun && (
            <button onClick={() => setAcik((v) => !v)} className="mt-1 flex items-center gap-1 text-[13px] font-medium text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]">
              {acik ? "Daha az göster" : "Devamını göster"}<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} />
            </button>
          )}
        </div>
      )}
      <div className={cn("sc-yazdirma-gizle -mb-2 mt-0.5 flex items-center gap-0.5 transition-opacity", dal && dal.n > 1 ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100")}>
        <span className="mr-1.5 text-[12px] tabular-nums text-[var(--sc-metin-3)] opacity-0 transition-opacity group-hover:opacity-100">{saatYaz(m.zaman)}</span>
        {dal && onDalGit && <DalGezgini i={dal.i} n={dal.n} onGit={onDalGit} />}
        <span className="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          <KopyalaDugme metin={m.metin} />
          {!kilitli && <Eylem ipucu="Düzenle" tus={sonKullanici ? "↑" : undefined} onClick={() => { setTaslak(m.metin); setDuzen(true); }}><Pencil className="h-4 w-4" /></Eylem>}
        </span>
      </div>
    </div>
  );
}

/* ═══════════ GERİ BİLDİRİM ═══════════ */
const NEDENLER = { "-1": ["Yanlış bilgi", "İsteği anlamadı", "Eksik yanıt", "Çok uzun", "Kod çalışmıyor", "Diğer"], "1": ["Doğru ve net", "İşime yaradı", "İyi biçimlendirilmiş", "Yaratıcı"] };
export function GeriBildirimPenceresi({ puan, onKapat, onGonder }: { puan: 1 | -1; onKapat: () => void; onGonder: (neden: string[], not: string) => void }) {
  const [sec, setSec] = useState<string[]>([]);
  const [not, setNot] = useState("");
  const odak = useOdakTuzagi(true);
  useEffect(() => { const t = (e: KeyboardEvent) => e.key === "Escape" && onKapat(); window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return (
    <div className="perde fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4" onClick={onKapat}>
      <motion.div ref={odak} role="dialog" aria-modal="true" aria-label="Geri bildirim" initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={YAY} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] rounded-[22px] bg-[#18181b] p-5 ring-1 ring-inset ring-white/[0.1]">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", puan === 1 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300")}>{puan === 1 ? <ThumbsUp className="h-5 w-5" /> : <ThumbsDown className="h-5 w-5" />}</span>
          <div className="flex-1"><h2 className="text-[16px] font-semibold text-[var(--sc-metin)]">{puan === 1 ? "Neyi beğendin?" : "Ne ters gitti?"}</h2><p className="text-[13px] text-[var(--sc-metin-2)]">Geri bildirimin yanıtları iyileştirmemize yardım eder.</p></div>
          <button onClick={onKapat} aria-label="Kapat" className={IKON}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {NEDENLER[String(puan) as "1" | "-1"].map((n) => {
            const s = sec.includes(n);
            return <button key={n} onClick={() => setSec((l) => (s ? l.filter((x) => x !== n) : [...l, n]))} aria-pressed={s}
              className={cn("h-8 rounded-full px-3 text-[13px] font-medium ring-1 ring-inset transition-colors", s ? "bg-[var(--sc-aksan)]/[0.12] text-[var(--sc-aksan)] ring-[var(--sc-aksan)]/40" : "text-[var(--sc-metin-2)] ring-white/[0.12] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]")}>{n}</button>;
          })}
        </div>
        <textarea value={not} onChange={(e) => setNot(e.target.value.slice(0, 1000))} rows={3} placeholder="İstersen ayrıntı yaz (isteğe bağlı)"
          className="mt-4 block w-full resize-none rounded-[14px] bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-[var(--sc-metin-3)] focus:ring-white/20" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onKapat} className="h-9 rounded-full px-4 text-[13.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">Vazgeç</button>
          <button onClick={() => onGonder(sec, not.trim())} className="h-9 rounded-full bg-[var(--sc-metin)] px-4 text-[13.5px] font-semibold text-[#111113]">Gönder</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════ ÇIKTI KARTI ═══════════ */
const CIKTI_IKON = { site: Globe, oyun: Gamepad2, dashboard: LayoutDashboard, uygulama: AppWindow, gorsel: ImageIcon, video: ImageIcon };
const CIKTI_AD = { site: "Web sitesi", oyun: "Oyun", dashboard: "Panel", uygulama: "Uygulama", gorsel: "Görsel", video: "Video" };
export function CiktiKarti({ c, surum, secili, onAc }: { c: SCCikti; surum?: number; secili?: boolean; onAc: () => void }) {
  const I = CIKTI_IKON[c.tur] ?? Globe;
  if (c.tur === "gorsel" && c.url) {
    const bg = c.url.startsWith("data:") || c.url.startsWith("http") || c.url.startsWith("/") ? `url("${c.url}") center/cover` : c.url;
    return (
      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={onAc} className={cn("group relative block aspect-square w-[260px] overflow-hidden rounded-[18px] ring-1 ring-inset transition-shadow", secili ? "ring-2 ring-[var(--sc-aksan)]" : "ring-white/[0.1]")}>
        <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]" style={{ background: bg }} />
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8 text-left text-[13px] font-medium text-white"><ImageIcon className="h-4 w-4" /><span className="truncate">{c.ad}</span></span>
        
      </motion.button>
    );
  }
  return (
    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }} onClick={onAc}
      className={cn("group flex w-full max-w-[460px] items-center gap-3 rounded-[16px] bg-white/[0.035] p-2.5 pr-3 text-left ring-1 ring-inset transition-colors hover:bg-white/[0.06]", secili ? "ring-[var(--sc-aksan)]/50" : "ring-white/[0.09]")}>
      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[10px] bg-white ring-1 ring-white/10">
        {c.html ? <iframe srcDoc={c.html.replace(/<script[\s\S]*?<\/script>/gi, "")} title="" tabIndex={-1} aria-hidden sandbox="" className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] border-0" /> : <I className="m-auto h-5 w-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-[var(--sc-metin)]">{c.ad}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[var(--sc-metin-2)]"><I className="h-3.5 w-3.5" />{CIKTI_AD[c.tur]}{surum ? ` · Sürüm ${surum}` : ""}</span>
      </span>
      <span className="flex h-8 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-[var(--sc-metin)] transition-colors group-hover:bg-white/[0.12]">Aç<ExternalLink className="h-3.5 w-3.5" /></span>
    </motion.button>
  );
}

/** Yanıtın kaynakları: ikon yığını + sayı; tıklayınca liste, her kaynağın üzerine gelince alıntı kartı. */
function Kaynaklar({ kaynaklar }: { kaynaklar: ScKaynak[] }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="mt-3">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="flex h-8 items-center gap-2 rounded-full bg-white/[0.05] pl-1.5 pr-3 text-[13px] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.08] transition-colors hover:text-[var(--sc-metin)]">
        <IkonYigini kaynaklar={kaynaklar} />{kaynaklar.length} kaynak<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 grid gap-1.5 overflow-hidden sm:grid-cols-2">
            {kaynaklar.map((k, i) => (
              <li key={k.url}>
                <a href={k.url} target="_blank" rel="noopener noreferrer" title={k.alinti ? `"${k.alinti}"` : k.baslik}
                  className="flex h-full gap-2.5 rounded-[12px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]">
                  <span className="mt-0.5 text-[11px] tabular-nums text-[var(--sc-metin-3)]">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[12px] text-[var(--sc-metin-3)]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={favikon(k.url)} alt="" className="h-3.5 w-3.5 rounded-sm" />{alanAdi(k.url)}</span>
                    <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[var(--sc-metin)]">{k.baslik}</span>
                  </span>
                </a>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Son yanıtın altında takip soruları — tıklanınca gönderilir. */
function Oneriler({ liste, onSec }: { liste: string[]; onSec: (s: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="sc-yazdirma-gizle mt-4 border-t border-white/[0.06] pt-3">
      <p className="mb-1.5 px-1 text-[12.5px] font-medium text-[var(--sc-metin-3)]">Sonra sorabileceklerin</p>
      <ul>
        {liste.map((s, i) => (
          <motion.li key={s} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
            <button onClick={() => onSec(s)} className="group/oneri flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-[14px] text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.04] hover:text-[var(--sc-metin)]">
              <CornerDownRight className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)] transition-colors group-hover/oneri:text-[var(--sc-aksan)]" />
              <span className="min-w-0 flex-1">{s}</span>
              <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/oneri:opacity-100" />
            </button>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ═══════════ ASİSTAN ═══════════ */
export function AsistanMesaji({ m, son, calisiyor, dal, onDalGit, onYeniden, onGeri, onCiktiAc, seciliCikti, surumNo, planOlaylari, planToplam, ustSlot, onOneri, onDal, onBelgeAc, baslik, onKarsilastirmaSec, onDegistir }: {
  m: SCMesaj; son: boolean; calisiyor: boolean; dal?: { i: number; n: number }; onDalGit?: (y: -1 | 1) => void;
  onYeniden: (model?: string) => void; onGeri: (puan: 1 | -1, neden: string[], not: string) => void; onCiktiAc: (c: SCCikti) => void;
  seciliCikti?: string | null; surumNo: (c: SCCikti) => number | undefined; planOlaylari?: AjanOlay[]; planToplam?: number; ustSlot?: React.ReactNode;
  /** Takip önerisine tıklanınca o soruyu gönderir. */
  onOneri?: (soru: string) => void;
  /** Bu yanıta kadarki sohbeti yeni bir sohbette sürdür (ChatGPT "yeni sohbette dal aç"). */
  onDal?: () => void;
  /** Yanıtı belge panelinde aç (Canvas). */
  onBelgeAc?: () => void;
  /** Yanıtı değiştir ya da doğrula (yeni dal). */
  onDegistir?: (talimat: string, web?: boolean) => void;
  /** Karşılaştırmada A ya da B yanıtını seç. */
  onKarsilastirmaSec?: (alan: "yanit" | "ikinci") => void;
  /** Dışa aktarılan dosyanın adı için sohbet başlığı. */
  baslik?: string;
}) {
  const [geriPencere, setGeriPencere] = useState<1 | -1 | null>(null);
  const [okuyor, setOkuyor] = useState(false);
  const [yenidenMenu, setYenidenMenu] = useState(false);
  const [indir, setIndir] = useState(false);
  const kok = useRef<HTMLDivElement>(null);
  const y = m.yanit;
  const akiyor = y?.durum === "akiyor";
  const duzMetin = y ? yanitMetni(y) : m.metin.replace(/<[^>]+>/g, "");
  const olaylar = (planOlaylari ?? (m.olaylar as AjanOlay[] | undefined)) ?? [];
  useEffect(() => () => { if (okuyor) speechSynthesis.cancel(); }, [okuyor]);

  const oku = () => {
    if (okuyor) { speechSynthesis.cancel(); setOkuyor(false); return; }
    const u = new SpeechSynthesisUtterance(duzMetin.replace(/[#*`>|_-]/g, " ").slice(0, 4000));
    u.lang = "tr-TR"; u.rate = useScTercih.getState().sesHizi; u.onend = () => setOkuyor(false); speechSynthesis.cancel(); speechSynthesis.speak(u); setOkuyor(true);
  };
  const bitti = !akiyor && !(son && calisiyor && !y);
  const ilkMetin = y?.parcalar.findIndex((p) => p.tur === "metin") ?? -1;
  const demoNotu = (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex items-start gap-2.5 rounded-[14px] bg-amber-300/[0.07] px-3.5 py-3 ring-1 ring-inset ring-amber-300/20">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <p className="text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]"><b className="font-semibold text-amber-100">Örnek yanıt.</b> Sohbet modeli bağlı değil; aşağıdaki metin gerçek bir yanıt değil, arayüzün örneğidir. Sunucuya <code className="sc-kod rounded bg-white/[0.07] px-1 text-[12.5px] text-[#f0c9a8]">ANTHROPIC_API_KEY</code> eklenince gerçek yanıt akar.</p>
    </motion.div>
  );

  const canli = akiyor || (son && calisiyor && !!m.is && !m.is.bitis && !m.is.bekleyen);
  const menuSinif = "rounded-[14px] border border-white/[0.09] bg-[#1a1a1d] p-1.5";
  const eylemVar = bitti && !!(duzMetin || m.ciktilar?.length);

  return (
    <div ref={kok} className="group/asistan" data-alintilanabilir>
      {ustSlot}
      {m.is && olaylar.length > 0 && <AjanPlani olaylar={olaylar} toplam={planToplam ?? olaylar.length} basla={m.is.basla ?? m.zaman} bitis={m.is.bitis} baslik={m.is.tur === "gorsel" ? "Görsel hazırlanıyor" : "Site kuruluyor"} />}
      {m.ikinci && y ? (
        /* Karşılaştırma: iki modelin yanıtı yan yana (mobilde alt alta); biri seçilince diğeri kalkar. */
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {([["yanit", y], ["ikinci", m.ikinci]] as const).map(([alan, yy]) => {
            const ak = yy.durum === "akiyor";
            const ad = yy.demo || yy.model === "demo" ? "Örnek yanıt" : SC_MODELLER.find((x) => yy.model?.startsWith(x.id))?.ad ?? (alan === "yanit" ? "Model A" : "Model B");
            return (
              <div key={alan} className="min-w-0 rounded-[18px] bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.08]">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-medium text-[var(--sc-metin-2)]">{alan === "yanit" ? "A" : "B"} · {ak ? "yazıyor…" : ad}</span>
                  {!ak && !akiyor && m.ikinci?.durum !== "akiyor" && onKarsilastirmaSec && (
                    <button onClick={() => onKarsilastirmaSec(alan)} className="ml-auto flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium text-[var(--sc-aksan)] ring-1 ring-inset ring-[var(--sc-aksan)]/30 hover:bg-[var(--sc-aksan)]/10"><Check className="h-3.5 w-3.5" />Bunu seç</button>
                  )}
                </div>
                {yy.parcalar.map((p, i) => p.tur === "dusunme" ? <DusunmeBlok key={i} metin={p.metin} basla={p.basla} bitis={p.bitis ?? (ak ? undefined : p.basla)} />
                  : p.tur === "arama" ? <AramaAdim key={i} {...p} bitis={p.bitis ?? (ak ? undefined : p.basla)} />
                  : p.tur === "arac" ? <AracAdim key={i} {...p} bitis={p.bitis ?? (ak ? undefined : p.basla)} />
                  : p.tur === "kod" ? <KodAdim key={i} {...p} bitis={p.bitis ?? (ak ? undefined : p.basla)} />
                  : <div key={i} className="my-1"><Markdown metin={p.metin} akiyor={ak && i === yy.parcalar.length - 1} kaynaklar={yy.kaynaklar} /></div>)}
                {yy.durum === "hata" && <p className="mt-2 text-[13px] text-rose-300">{yy.hata ?? "Yanıt alınamadı."}</p>}
              </div>
            );
          })}
        </div>
      ) : y?.parcalar.map((p, i) => p.tur === "dusunme" ? <DusunmeBlok key={i} metin={p.metin} basla={p.basla} bitis={p.bitis ?? (akiyor ? undefined : p.basla)} />
        : p.tur === "arama" ? <AramaAdim key={i} {...p} bitis={p.bitis ?? (akiyor ? undefined : p.basla)} />
        : p.tur === "arac" ? <AracAdim key={i} {...p} bitis={p.bitis ?? (akiyor ? undefined : p.basla)} />
        : p.tur === "kod" ? <KodAdim key={i} {...p} bitis={p.bitis ?? (akiyor ? undefined : p.basla)} />
          : <div key={i} className="my-1">{y.demo && i === ilkMetin && demoNotu}<Markdown metin={p.metin} akiyor={akiyor && i === y.parcalar.length - 1} kaynaklar={y.kaynaklar} /></div>)}
      {m.ikinci && y?.demo && <p className="mt-2 text-[12.5px] text-amber-200/90">Model bağlı değil; iki sütun aynı örnek metni gösterir.</p>}
      {!y && m.metin && <Markdown metin={m.metin.replace(/<b>/g, "**").replace(/<\/b>/g, "**")} />}
      {y?.durum === "hata" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[13.5px] text-rose-100 ring-1 ring-inset ring-rose-400/20">
          <TriangleAlert className="h-4 w-4 shrink-0 text-rose-300" /><span className="flex-1">{y.hata ?? "Yanıt alınamadı."}</span>
          <button onClick={() => onYeniden()} className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 font-medium text-[var(--sc-metin)] hover:bg-white/[0.12]"><RotateCcw className="h-3.5 w-3.5" />Yeniden dene</button>
        </div>
      )}
      {y?.durum === "red" && <p className="mt-3 rounded-[14px] bg-amber-300/[0.07] px-3.5 py-2.5 text-[13.5px] text-amber-100 ring-1 ring-inset ring-amber-300/20">Bu isteğe güvenlik nedeniyle yanıt verilemedi. Farklı biçimde sormayı deneyebilirsin.</p>}
      {y?.durum === "durdu" && <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--sc-metin-3)]"><Square className="h-3 w-3 fill-current" />Yanıtı durdurdun</p>}
      {!!m.ciktilar?.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {m.ciktilar.map((c) => <CiktiKarti key={c.id} c={c} surum={surumNo(c)} secili={seciliCikti === c.id} onAc={() => onCiktiAc(c)} />)}
        </div>
      )}
      {!!y?.kaynaklar.length && !akiyor && <Kaynaklar kaynaklar={y.kaynaklar} />}

      {((son && !m.is?.bekleyen) || eylemVar) && (
        <div className={cn("sc-yazdirma-gizle mt-2.5 flex min-h-9 items-center gap-0.5", !son && !(dal && dal.n > 1) && "opacity-0 transition-opacity focus-within:opacity-100 group-hover/asistan:opacity-100 [@media(hover:none)]:opacity-100")}>
          {son && !m.is?.bekleyen && (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} className="relative isolate -ml-1 mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center" aria-label={canli ? "Yanıt yazılıyor" : undefined}>
              {/* Logo videosu siyah zeminli, `screen` ile karışır; giriş animasyonu (opaklık) yalıtılmış grup açtığı için
                  arkasına zemin rengi bir katman konur — yoksa giriş boyunca siyah kare görünür. */}
              <span aria-hidden className="absolute inset-0 bg-[var(--sc-zemin)]" />
              <SCLogoCanli boyut={32} calisiyor={canli} className="relative" />
            </motion.span>
          )}
          <AnimatePresence>
            {eylemVar && (
              <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-0.5">
                {dal && onDalGit && <DalGezgini i={dal.i} n={dal.n} onGit={onDalGit} />}
                <KopyalaDugme metin={duzMetin} tus={son ? "Ctrl Shift C" : undefined} />
                <div className="relative">
                  <Ipucu metin="Yeniden üret" kapali={yenidenMenu}>
                    <button onClick={() => setYenidenMenu((v) => !v)} aria-expanded={yenidenMenu} aria-haspopup="menu" aria-label="Yeniden üret" className={cn(IKON, yenidenMenu && "bg-white/[0.08] text-[var(--sc-metin)]")}><RotateCcw className="h-4 w-4" /></button>
                  </Ipucu>
                  <AnimatePresence>
                    <Yuzen acik={yenidenMenu} onKapat={() => setYenidenMenu(false)} yerlesim="ust-sol" bosluk={6} etiket="Yeniden üret" className={menuSinif} style={{ width: 268 }}>
                      <div role="menu">
                        <button role="menuitem" onClick={() => { setYenidenMenu(false); onYeniden(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-[var(--sc-metin)] hover:bg-white/[0.06]"><RotateCcw className="h-4 w-4 text-[var(--sc-metin-2)]" />Yeniden dene</button>
                        <div className="mx-2 my-1 h-px bg-white/[0.07]" />
                        <p className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-[var(--sc-metin-3)]">Başka modelle dene</p>
                        {SC_MODELLER.filter((md) => md.ana || md.id === y?.model).map((md) => (
                          <button role="menuitem" key={md.id} onClick={() => { setYenidenMenu(false); onYeniden(md.id); }} className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-left hover:bg-white/[0.06]">
                            <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-[var(--sc-metin)]">{md.ad}</span><span className="block truncate text-[12px] text-[var(--sc-metin-3)]">{md.alt}</span></span>
                            {y?.model === md.id && <Check className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />}
                          </button>
                        ))}
                      </div>
                    </Yuzen>
                  </AnimatePresence>
                </div>
                <Eylem ipucu={m.geri?.puan === 1 ? "Beğendin" : "İyi yanıt"} aria-pressed={m.geri?.puan === 1} onClick={() => (m.geri?.puan === 1 ? undefined : setGeriPencere(1))} className={cn(m.geri?.puan === 1 && "text-emerald-300 hover:text-emerald-300")}>
                  <motion.span key={String(m.geri?.puan === 1)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={YAY}><ThumbsUp className={cn("h-4 w-4", m.geri?.puan === 1 && "fill-current")} /></motion.span>
                </Eylem>
                <Eylem ipucu={m.geri?.puan === -1 ? "Geri bildirim gönderildi" : "Kötü yanıt"} aria-pressed={m.geri?.puan === -1} onClick={() => (m.geri?.puan === -1 ? undefined : setGeriPencere(-1))} className={cn(m.geri?.puan === -1 && "text-rose-300 hover:text-rose-300")}>
                  <motion.span key={String(m.geri?.puan === -1)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={YAY}><ThumbsDown className={cn("h-4 w-4", m.geri?.puan === -1 && "fill-current")} /></motion.span>
                </Eylem>
                {okuyor && <Eylem ipucu="Okumayı durdur" aria-pressed onClick={oku} className="text-[var(--sc-aksan)] hover:text-[var(--sc-aksan)]"><VolumeX className="h-4 w-4" /></Eylem>}
                {/* Diğer eylemler tek menüde (Claude / ChatGPT gibi): belge, sesli oku, dal, indir, yanıt bilgisi. */}
                {duzMetin && (
                  <div className="relative">
                    <Ipucu metin="Diğer" kapali={indir}>
                      <button onClick={() => setIndir((v) => !v)} aria-expanded={indir} aria-haspopup="menu" aria-label="Diğer eylemler" className={cn(IKON, indir && "bg-white/[0.08] text-[var(--sc-metin)]")}><MoreHorizontal className="h-4 w-4" /></button>
                    </Ipucu>
                    <AnimatePresence>
                      <Yuzen acik={indir} onKapat={() => setIndir(false)} yerlesim="ust-sol" bosluk={6} etiket="Diğer eylemler" className={cn(menuSinif, "!p-0 overflow-hidden")} style={{ width: 300 }}>
                        <div role="menu">
                          {(() => {
                            const ad = baslik ?? "Usta yanıtı";
                            const html = () => [...(kok.current?.querySelectorAll(".sc-md") ?? [])].map((e) => e.innerHTML).join("");
                            const csv = tablolariCsv(duzMetin);
                            const satir = (I: typeof Download, a: string, f: () => void) => <button key={a} role="menuitem" onClick={() => { setIndir(false); f(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] text-[var(--sc-metin)] transition-colors hover:bg-white/[0.065]"><I className="h-4 w-4 text-[var(--sc-metin-2)]" />{a}</button>;
                            const mdl = y && y.model && y.model !== "demo" ? SC_MODELLER.find((x) => y.model?.startsWith(x.id)) : undefined;
                            const bilgi = [y?.sureMs ? sureYaz(y.sureMs) : null, saatYaz(m.zaman), y?.token?.cikti ? `${(y.token.girdi + y.token.cikti).toLocaleString("tr")} token` : null].filter(Boolean).join(" · ");
                            const DEGIS: [string, typeof Download, string][] = [
                              ["Kısalt", Minimize2, "Bu yanıtı yaklaşık yarı uzunluğa indir; önemli bilgiyi koru."], ["Uzat", Maximize2, "Bu yanıtı daha ayrıntılı ve örnekli yaz."],
                              ["Sadeleştir", Feather, "Bu yanıtı sade, günlük bir dille ve kısa cümlelerle yeniden yaz."], ["Daha resmî", Briefcase, "Bu yanıtı resmî ve profesyonel bir tonda yeniden yaz."],
                              ["Daha samimi", Smile, "Bu yanıtı samimi ve sıcak bir tonda yeniden yaz."], ["Maddele", ListIcon, "Bu yanıtı net başlıklar ve maddeler halinde yeniden düzenle."],
                            ];
                            const DOSYA: [string, string, () => void][] = [
                              ["Word", "DOC", () => { wordIndir(html(), ad); toast.success("Yanıt indirildi", { description: "Word belgesi (.doc) indirilenler klasörüne kaydedildi." }); }],
                              ["PDF", "PDF", () => { if (!pdfYazdir(html(), ad)) mesaj.acilirPencereEngellendi(); }],
                              ["Markdown", "MD", () => { mdIndir(duzMetin, ad); toast.success("Yanıt indirildi", { description: "Markdown (.md) dosyası indirilenler klasörüne kaydedildi." }); }],
                              ...(csv ? [["Tablolar", "CSV", () => { csvIndir(csv, ad); toast.success("Tablolar indirildi", { description: "CSV dosyası indirilenler klasörüne kaydedildi. Excel ile açabilirsin." }); }] as [string, string, () => void]] : []),
                            ];
                            return (
                              <>
                                <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3 py-2.5">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.085]">{mdl ? <ModelLogo ad={"saglayici" in mdl && mdl.saglayici === "openai" ? "gpt" : "saglayici" in mdl && mdl.saglayici === "google" ? "gemini" : "claude"} boyut={14} /> : <Sparkles className="h-3.5 w-3.5 text-[var(--sc-metin-2)]" />}</span>
                                  <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13px] font-semibold text-[var(--sc-metin)]">{mdl?.ad ?? "Usta"}</span>{bilgi && <span className="block truncate text-[11.5px] tabular-nums text-[var(--sc-metin-3)]">{bilgi}</span>}</span>
                                </div>
                                {onDegistir && (
                                  <div className="border-b border-white/[0.06] p-2">
                                    <p className="px-1 pb-1.5 text-[12px] font-semibold text-[var(--sc-metin-2)]">Yanıtı değiştir</p>
                                    <div className="grid grid-cols-3 gap-1">
                                      {DEGIS.map(([a, I, t]) => (
                                        <button key={a} role="menuitem" onClick={() => { setIndir(false); onDegistir(t); }}
                                          className="flex h-[58px] flex-col items-center justify-center gap-1.5 rounded-[12px] bg-black/20 text-[12px] font-medium text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.085] hover:text-[var(--sc-metin)] active:scale-95">
                                          <I className="h-4 w-4" />{a}
                                        </button>
                                      ))}
                                    </div>
                                    <button role="menuitem" onClick={() => { setIndir(false); onDegistir("Bu yanıttaki somut iddiaları web'de kontrol et. Her iddiayı Doğru / Yanlış / Belirsiz diye işaretle, kaynak göster ve gerekirse düzeltilmiş özeti ver.", true); }}
                                      className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-[12px] bg-black/20 px-3 text-left text-[13px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.085] active:scale-[0.98]">
                                      <Globe className="h-4 w-4 text-[var(--sc-metin-2)]" /><span className="flex-1">Web'de doğrula</span><span className="text-[11.5px] font-normal text-[var(--sc-metin-3)]">kaynaklı</span>
                                    </button>
                                  </div>
                                )}
                                <div className="border-b border-white/[0.06] p-1.5">
                                  {onBelgeAc && duzMetin.length > 300 && satir(BelgeIkon, m.belge ? "Belgeyi aç" : "Belgede aç ve düzenle", onBelgeAc)}
                                  {satir(okuyor ? VolumeX : Volume2, okuyor ? "Okumayı durdur" : "Sesli oku", oku)}
                                  {onDal && satir(GitBranch, "Yeni sohbette dal aç", onDal)}
                                </div>
                                <div className="p-2">
                                  <p className="px-1 pb-1.5 text-[12px] font-semibold text-[var(--sc-metin-2)]">İndir</p>
                                  <div className={cn("grid gap-1", DOSYA.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
                                    {DOSYA.map(([a, uz, f]) => (
                                      <button key={uz} role="menuitem" onClick={() => { setIndir(false); f(); }} title={`${a} olarak indir`}
                                        className="group/d flex h-[62px] flex-col items-center justify-center gap-1.5 rounded-[12px] bg-black/20 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.085] active:scale-95">
                                        <span className="relative flex h-7 w-6 items-end justify-center rounded-[4px] bg-white/[0.12] pb-0.5 [clip-path:polygon(0_0,70%_0,100%_25%,100%_100%,0_100%)]"><span className="text-[7.5px] font-bold tracking-wide text-[var(--sc-metin)]">{uz}</span></span>
                                        <span className="text-[11.5px] font-medium text-[var(--sc-metin-2)] group-hover/d:text-[var(--sc-metin)]">{a}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </Yuzen>
                    </AnimatePresence>
                  </div>
                )}
                
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {!!m.anilar?.length && (
        <Link href="/panel/supercomputer/ayarlar/hafiza" title={m.anilar.join("\n")}
          className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[12.5px] text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.07] transition-colors hover:text-[var(--sc-metin)]">
          <BookmarkCheck className="h-3.5 w-3.5 shrink-0 text-[var(--sc-aksan)]" /><span className="truncate">Bellek güncellendi · {m.anilar[0]}</span>
        </Link>
      )}
      {son && !calisiyor && bitti && !!m.oneriler?.length && onOneri && <Oneriler liste={m.oneriler} onSec={onOneri} />}
      {geriPencere && <GeriBildirimPenceresi puan={geriPencere} onKapat={() => setGeriPencere(null)} onGonder={(n, t) => { onGeri(geriPencere, n, t); setGeriPencere(null); }} />}
    </div>
  );
}
