"use client";

/**
 * Tarih aralığı — iki aylık takvim popover'ı. Önceki/sonraki ay ve yıl okları, bugün camgöbeği,
 * aralık vurgulu; Temizle · Vazgeç · Tamam (seçim yokken Tamam pasif). Ay ve gün adları,
 * hafta başlangıcı ve aralık yazısı kullanıcının yerel ayarından (Intl).
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useMasaustu } from "@/hooks/useMasaustu";
import { cn } from "@/lib/utils";
import { Katman } from "./Katman";

export interface Aralik { bas?: number; bit?: number }

const GUN = 86_400_000;
export const gunBasi = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
/** Aralığa uyuyor mu (bitiş günü dahil). */
export const aralikta = (t: number, a: Aralik) => (!a.bas || t >= a.bas) && (!a.bit || t < a.bit + GUN);

function yerelDil() { try { return navigator.language || "tr-TR"; } catch { return "tr-TR"; } }

/** Haftanın ilk günü (0 pazar, 1 pazartesi) — Intl.Locale weekInfo, yoksa bölgeye göre. */
function haftaBasi(dil: string): number {
  try {
    const L = new Intl.Locale(dil) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const w = L.getWeekInfo?.() ?? L.weekInfo;
    if (w?.firstDay) return w.firstDay % 7;
    const bolge = (L.maximize().region ?? "").toUpperCase();
    return ["US", "CA", "JP", "BR", "MX", "IL", "KR", "TW", "HK", "PH", "SA", "IN", "ZA", "AU"].includes(bolge) ? 0 : 1;
  } catch { return 1; }
}

export function aralikYazisi(a: Aralik, dil = yerelDil()): string {
  if (!a.bas) return "";
  const f = new Intl.DateTimeFormat(dil, { day: "numeric", month: "short", year: new Date(a.bas).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
  if (!a.bit || a.bit === a.bas) return f.format(a.bas);
  try { return (f as Intl.DateTimeFormat & { formatRange: (x: number, y: number) => string }).formatRange(a.bas, a.bit); } catch { return `${f.format(a.bas)} – ${f.format(a.bit)}`; }
}

export function TarihAraligi({ deger, onDegis, className }: { deger: Aralik; onDegis: (a: Aralik) => void; className?: string }) {
  const [acik, setAcik] = useState(false);
  const etkin = !!deger.bas;
  const yazi = aralikYazisi(deger);
  return (
    <div className={cn("relative shrink-0", className)}>
      <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => setAcik((v) => !v)} aria-expanded={acik} aria-haspopup="dialog"
        className={cn("flex h-9 items-center gap-2 rounded-full pl-3 text-[13px] font-medium ring-1 ring-inset transition-colors", etkin ? "bg-white pr-1.5 text-[#0d0e10] ring-white" : "bg-white/[0.06] pr-3 text-metin ring-white/[0.08] hover:bg-white/[0.1]")}>
        <CalendarRange className="h-4 w-4" />
        <span className="max-w-[180px] truncate">{etkin ? yazi : "Tarih aralığı"}</span>
        {etkin ? (
          <Tooltip label="Tarihi temizle" side="bottom">
            <span role="button" tabIndex={0} aria-label="Tarihi temizle" onClick={(e) => { e.stopPropagation(); onDegis({}); }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 transition hover:bg-black/20"><X className="h-3.5 w-3.5" /></span>
          </Tooltip>
        ) : <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />}
      </motion.button>
      <Katman acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" genislik={612} baslik="Tarih aralığı" etiket="Tarih aralığı seç">
        <Takvim ilk={deger} onVazgec={() => setAcik(false)} onTamam={(a) => { onDegis(a); setAcik(false); }} />
      </Katman>
    </div>
  );
}

function Takvim({ ilk, onVazgec, onTamam }: { ilk: Aralik; onVazgec: () => void; onTamam: (a: Aralik) => void }) {
  const masaustu = useMasaustu();
  const dil = useMemo(yerelDil, []);
  const ilkGun = useMemo(() => haftaBasi(dil), [dil]);
  const bugun = gunBasi(Date.now());
  const [secim, setSecim] = useState<Aralik>(ilk);
  const [uzerinde, setUzerinde] = useState<number | null>(null);
  // Görünen sol ay: seçimin başlangıcı ya da bir önceki ay (sağda bu ay görünsün)
  const [ay, setAy] = useState(() => {
    const d = new Date(ilk.bas ?? bugun);
    if (!ilk.bas) d.setMonth(d.getMonth() - 1);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  });
  const [yon, setYon] = useState(0);
  useEffect(() => setSecim(ilk), [ilk]);

  const kaydir = (ayFark: number) => {
    setYon(ayFark > 0 ? 1 : -1);
    setAy((a) => { const d = new Date(a); return new Date(d.getFullYear(), d.getMonth() + ayFark, 1).getTime(); });
  };
  const ayAdi = (t: number) => new Intl.DateTimeFormat(dil, { month: "long", year: "numeric" }).format(t);
  const gunAdlari = useMemo(() => {
    const f = new Intl.DateTimeFormat(dil, { weekday: "short" });
    // 2023-01-01 pazar
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(2023, 0, 1 + ((ilkGun + i) % 7))));
  }, [dil, ilkGun]);
  const tamYazi = useMemo(() => new Intl.DateTimeFormat(dil, { dateStyle: "full" }), [dil]);

  const tikla = (t: number) => {
    if (!secim.bas || secim.bit) { setSecim({ bas: t, bit: undefined }); return; }
    setSecim(t < secim.bas ? { bas: t, bit: secim.bas } : { bas: secim.bas, bit: t });
  };
  // Önizleme: başlangıç seçili, bitiş henüz yokken üzerine gelinen güne kadar
  const gorunen: Aralik = secim.bas && !secim.bit && uzerinde ? (uzerinde < secim.bas ? { bas: uzerinde, bit: secim.bas } : { bas: secim.bas, bit: uzerinde }) : secim;

  const ay2 = (() => { const d = new Date(ay); return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(); })();
  const aylar = [ay, ay2];
  const simdiD = new Date(bugun);
  const hazir: { ad: string; a: Aralik }[] = [
    { ad: "Bugün", a: { bas: bugun, bit: bugun } },
    { ad: "Son 7 gün", a: { bas: bugun - 6 * GUN, bit: bugun } },
    { ad: "Son 30 gün", a: { bas: bugun - 29 * GUN, bit: bugun } },
    { ad: "Bu ay", a: { bas: new Date(simdiD.getFullYear(), simdiD.getMonth(), 1).getTime(), bit: bugun } },
    { ad: "Bu yıl", a: { bas: new Date(simdiD.getFullYear(), 0, 1).getTime(), bit: bugun } },
  ];
  const hazirSec = (a: Aralik) => {
    setSecim(a);
    const d = new Date(a.bit ?? bugun);
    setYon(-1);
    setAy(new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime());
  };

  return (
    <div className="p-1.5">
      <div className="gizli-scroll mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
        {hazir.map((h) => {
          const s = secim.bas === h.a.bas && (secim.bit ?? secim.bas) === h.a.bit;
          return (
            <motion.button key={h.ad} type="button" whileTap={{ scale: 0.95 }} onClick={() => hazirSec(h.a)} aria-pressed={s}
              className={cn("h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition-colors", s ? "bg-white text-[#0d0e10] ring-white" : "bg-white/[0.05] text-metin-2 ring-white/[0.08] hover:text-metin")}>{h.ad}</motion.button>
          );
        })}
      </div>
      <div className={cn("grid gap-4", masaustu ? "grid-cols-2" : "grid-cols-1")}>
        {aylar.map((a, i) => (
          <div key={i} className="min-w-0">
            <div className="mb-1.5 flex h-9 items-center gap-0.5">
              {(i === 0 || !masaustu) && (
                <>
                  <OkDugme etiket="Önceki yıl" onClick={() => kaydir(-12)}><ChevronsLeft className="h-4 w-4" /></OkDugme>
                  <OkDugme etiket="Önceki ay" onClick={() => kaydir(-1)}><ChevronLeft className="h-4 w-4" /></OkDugme>
                </>
              )}
              <div className="relative h-9 flex-1 overflow-hidden">
                <AnimatePresence initial={false} custom={yon} mode="popLayout">
                  <motion.p key={a} custom={yon} initial={{ x: yon * 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -yon * 24, opacity: 0 }} transition={{ duration: 0.18 }}
                    className="absolute inset-0 flex items-center justify-center text-[14px] font-semibold capitalize text-metin">{ayAdi(a)}</motion.p>
                </AnimatePresence>
              </div>
              {(i === 1 || !masaustu) && (
                <>
                  <OkDugme etiket="Sonraki ay" onClick={() => kaydir(1)}><ChevronRight className="h-4 w-4" /></OkDugme>
                  <OkDugme etiket="Sonraki yıl" onClick={() => kaydir(12)}><ChevronsRight className="h-4 w-4" /></OkDugme>
                </>
              )}
            </div>
            <div className="grid grid-cols-7 text-center">
              {gunAdlari.map((g) => <span key={g} className="pb-1 text-[11.5px] font-medium text-metin-3">{g}</span>)}
              <AyIzgarasi ay={a} ilkGun={ilkGun} bugun={bugun} gorunen={gorunen} tamYazi={tamYazi} onTikla={tikla} onUzerinde={setUzerinde} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] px-1 pt-2.5">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-metin-2">{secim.bas ? aralikYazisi(secim.bit ? secim : { bas: secim.bas }, dil) : "Başlangıç ve bitiş gününü seç"}</span>
        <button type="button" onClick={() => setSecim({})} disabled={!secim.bas} className="h-9 rounded-full px-3 text-[13px] font-medium text-metin-2 transition hover:text-metin disabled:opacity-40">Temizle</button>
        <button type="button" onClick={onVazgec} className="h-9 rounded-full px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]">Vazgeç</button>
        <motion.button type="button" whileTap={{ scale: 0.96 }} disabled={!secim.bas} onClick={() => onTamam(secim.bas ? { bas: secim.bas, bit: secim.bit ?? secim.bas } : {})}
          className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0d0e10] transition disabled:cursor-not-allowed disabled:bg-white/[0.12] disabled:text-metin-3">Tamam</motion.button>
      </div>
    </div>
  );
}

function OkDugme({ etiket, onClick, children }: { etiket: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip label={etiket} side="top">
      <motion.button type="button" whileTap={{ scale: 0.88 }} aria-label={etiket} onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-metin">{children}</motion.button>
    </Tooltip>
  );
}

function AyIzgarasi({ ay, ilkGun, bugun, gorunen, tamYazi, onTikla, onUzerinde }: {
  ay: number; ilkGun: number; bugun: number; gorunen: Aralik; tamYazi: Intl.DateTimeFormat; onTikla: (t: number) => void; onUzerinde: (t: number | null) => void;
}) {
  const d = new Date(ay);
  const y = d.getFullYear(), m = d.getMonth();
  const bosluk = (new Date(y, m, 1).getDay() - ilkGun + 7) % 7;
  const gunSayisi = new Date(y, m + 1, 0).getDate();
  const hucreler: (number | null)[] = [...Array(bosluk).fill(null), ...Array.from({ length: gunSayisi }, (_, i) => new Date(y, m, i + 1).getTime())];
  while (hucreler.length % 7) hucreler.push(null);
  const bas = gorunen.bas, bit = gorunen.bit ?? gorunen.bas;
  return (
    <>
      {hucreler.map((t, i) => {
        if (t === null) return <span key={`b${i}`} className="h-9" />;
        const uc = t === bas || t === bit;
        const icinde = !!bas && !!bit && t > bas && t < bit;
        const solUc = t === bas && bit !== bas, sagUc = t === bit && bit !== bas;
        const bugunMu = t === bugun;
        return (
          <span key={t} className={cn("relative flex h-9 items-center justify-center", icinde && "bg-white/[0.09]",
            solUc && "bg-gradient-to-r from-transparent from-50% to-white/[0.09] to-50%", sagUc && "bg-gradient-to-l from-transparent from-50% to-white/[0.09] to-50%")}
            onMouseEnter={() => onUzerinde(t)} onMouseLeave={() => onUzerinde(null)}>
            <button type="button" onClick={() => onTikla(t)} aria-label={tamYazi.format(t)} aria-pressed={uc} aria-current={bugunMu ? "date" : undefined}
              className={cn("relative z-[1] flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums transition-colors",
                uc ? "bg-white font-semibold text-[#0d0e10]" : bugunMu ? "font-semibold text-aksan ring-1 ring-inset ring-aksan/60 hover:bg-aksan/10" : "text-metin hover:bg-white/[0.1]")}>
              {new Date(t).getDate()}
            </button>
          </span>
        );
      })}
    </>
  );
}
