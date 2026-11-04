"use client";

import { ScSecici } from "@/components/sc/ScSecici";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { CalendarClock, Globe, Info, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { GUNLER, SIKLIK_AD, useScGorev, zamanAd, type GorevSiklik, type ScGorev } from "@/lib/scGorev";
import { calistir } from "@/components/sc/GorevCalistirici";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const bugun = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

const SABLONLAR: { baslik: string; istem: string; siklik: GorevSiklik; saat: string; gun?: number; web: boolean }[] = [
  { baslik: "Sabah sektör özeti", istem: "Pazarlama ve yapay zekâ dünyasında son 24 saatin en önemli 5 gelişmesini kaynaklarıyla kısaca özetle.", siklik: "haftaici", saat: "08:30", web: true },
  { baslik: "Haftalık içerik planı", istem: "Bu hafta için sosyal medyada paylaşabileceğim 5 gönderi fikri öner; her biri için başlık, kısa metin ve görsel önerisi yaz.", siklik: "haftalik", saat: "09:00", gun: 1, web: false },
  { baslik: "Cuma değerlendirmesi", istem: "Haftayı kapatmam için kısa bir değerlendirme şablonu hazırla: neler iyi gitti, neler takıldı, gelecek haftanın 3 önceliği.", siklik: "haftalik", saat: "17:00", gun: 5, web: false },
];

const tarif = (g: Pick<ScGorev, "siklik" | "saat" | "gun" | "tarih">) =>
  g.siklik === "bir" ? `${g.tarih ? new Date(g.tarih).toLocaleDateString("tr", { day: "numeric", month: "long" }) : ""} ${g.saat}`
    : g.siklik === "haftalik" ? `Her ${GUNLER[g.gun ?? 1].toLocaleLowerCase("tr")} ${g.saat}`
      : g.siklik === "aylik" ? `Her ayın ${g.tarih ? Number(g.tarih.split("-")[2]) : 1}. günü ${g.saat}` : `${SIKLIK_AD[g.siklik]} ${g.saat}`;

type Taslak = { baslik: string; istem: string; siklik: GorevSiklik; saat: string; gun: number; tarih: string; web: boolean };

function GorevPenceresi({ ilk, onKapat }: { ilk?: ScGorev | Partial<Taslak>; onKapat: () => void }) {
  const { ekle, guncelle } = useScGorev();
  const duzen = ilk && "id" in ilk ? ilk : undefined;
  const [t, setT] = useState<Taslak>({ baslik: ilk?.baslik ?? "", istem: ilk?.istem ?? "", siklik: ilk?.siklik ?? "gunluk", saat: ilk?.saat ?? "09:00", gun: ilk?.gun ?? 1, tarih: ilk?.tarih ?? bugun(), web: ilk?.web ?? false });
  const d = (p: Partial<Taslak>) => setT((x) => ({ ...x, ...p }));
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onKapat]);
  const gecerli = t.baslik.trim() && t.istem.trim().length > 5 && /^\d{2}:\d{2}$/.test(t.saat) && (t.siklik !== "bir" || new Date(`${t.tarih}T${t.saat}`).getTime() > Date.now());
  const kaydet = () => {
    if (!gecerli) return;
    const g = { baslik: t.baslik.trim(), istem: t.istem.trim(), siklik: t.siklik, saat: t.saat, gun: t.siklik === "haftalik" ? t.gun : undefined, tarih: t.siklik === "bir" || t.siklik === "aylik" ? t.tarih : undefined, web: t.web };
    if (duzen) { guncelle(duzen.id, { ...g, acik: true }); toast.success("Görev güncellendi"); }
    else { ekle(g); toast.success("Görev zamanlandı", { description: `${tarif(g)}.` }); }
    onKapat();
  };
  const alan = "h-10 w-full rounded-[12px] bg-[var(--sc-zemin)] px-3 text-[14px] text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] focus:ring-[var(--sc-aksan)]/50 [color-scheme:dark]";
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div role="dialog" aria-modal="true" aria-label={duzen ? "Görevi düzenle" : "Yeni görev"} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] bg-[#18181b] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.1]">
        <div className="flex items-center gap-3 px-6 pb-2 pt-5">
          <h2 className="flex-1 text-[17px] font-semibold">{duzen ? "Görevi düzenle" : "Yeni görev"}</h2>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-3">
          <label className="block"><span className="text-[13px] font-medium text-[var(--sc-metin-2)]">Ad</span>
            <input value={t.baslik} onChange={(e) => d({ baslik: e.target.value.slice(0, 60) })} autoFocus placeholder="Ör. Sabah haber özeti" className={cn(alan, "mt-1.5")} /></label>
          <label className="block"><span className="text-[13px] font-medium text-[var(--sc-metin-2)]">Ne yapsın?</span>
            <textarea value={t.istem} onChange={(e) => d({ istem: e.target.value.slice(0, 4000) })} rows={4} placeholder="Usta'ya her seferinde ne sormak istiyorsun?"
              className="mt-1.5 w-full resize-y rounded-[14px] bg-[var(--sc-zemin)] p-3 text-[14px] leading-relaxed outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" /></label>
          <div>
            <span className="text-[13px] font-medium text-[var(--sc-metin-2)]">Ne zaman?</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(Object.keys(SIKLIK_AD) as GorevSiklik[]).map((s) => (
                <button key={s} onClick={() => d({ siklik: s })} aria-pressed={t.siklik === s}
                  className={cn("h-8 rounded-full px-3 text-[13px] ring-1 ring-inset transition-colors", t.siklik === s ? "bg-[var(--sc-aksan)]/15 text-[var(--sc-aksan)] ring-[var(--sc-aksan)]/40" : "text-[var(--sc-metin-2)] ring-white/[0.1] hover:bg-white/[0.05]")}>{SIKLIK_AD[s]}</button>
              ))}
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {t.siklik === "haftalik" && <ScSecici tam deger={t.gun} etiket="Gün" baslik="Gün" genislik={200} secenekler={[1, 2, 3, 4, 5, 6, 0].map((g) => ({ id: g, ad: GUNLER[g] }))} onSec={(v) => d({ gun: v })} />}
              {(t.siklik === "bir" || t.siklik === "aylik") && <input type="date" value={t.tarih} min={t.siklik === "bir" ? bugun() : undefined} onChange={(e) => d({ tarih: e.target.value })} aria-label="Tarih" className={alan} />}
              <input type="time" value={t.saat} onChange={(e) => d({ saat: e.target.value })} aria-label="Saat" className={alan} />
            </div>
          </div>
          <button onClick={() => d({ web: !t.web })} aria-pressed={t.web} className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-3 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]">
            <Globe className="h-4 w-4 shrink-0 text-[var(--sc-metin-2)]" />
            <span className="min-w-0 flex-1"><span className="block text-[14px]">Web'de ara</span><span className="block text-[12.5px] text-[var(--sc-metin-3)]">Güncel bilgi gereken görevler için (haber, fiyat, takip).</span></span>
            <span aria-hidden className={cn("relative flex h-[18px] w-8 shrink-0 items-center rounded-full px-[2px] transition-colors", t.web ? "justify-end bg-[var(--sc-aksan)]" : "justify-start bg-white/[0.16]")}><span className="h-[14px] w-[14px] rounded-full bg-white" /></span>
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] px-6 py-3.5">
          <button onClick={onKapat} className="h-10 rounded-full px-4 text-[13.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.05]">Vazgeç</button>
          <button disabled={!gecerli} onClick={kaydet} className="h-10 rounded-full bg-[var(--sc-metin)] px-5 text-[13.5px] font-semibold text-[#111113] disabled:opacity-40">{duzen ? "Kaydet" : "Zamanla"}</button>
        </div>
      </motion.div>
    </div>
  );
}

/** Görevler — ChatGPT "Tasks" sayfası: zamanlanmış istemler, sonraki çalışma, son sonuç. */
export function Gorevler() {
  const router = useRouter();
  const { gorevler, guncelle, sil } = useScGorev();
  const [pencere, setPencere] = useState<ScGorev | Partial<Taslak> | null>(null);
  const [hazir, setHazir] = useState(false);
  const [, tik] = useState(0);
  useEffect(() => { setHazir(true); const z = setInterval(() => tik((x) => x + 1), 30000); return () => clearInterval(z); }, []);
  const ac = (id: string) => router.push(`/panel/supercomputer/${id}`);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        <div className="mx-auto w-full max-w-[820px] px-6 pb-28 pt-12 max-md:pt-16 max-sm:px-4">
          <div className="flex items-center gap-3">
            <h1 className="flex-1 text-[28px] font-normal tracking-[-0.02em] max-sm:text-[24px]">Görevler</h1>
            <button onClick={() => setPencere({})} className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--sc-metin)] pl-3.5 pr-4 text-[14px] font-semibold text-[#111113] hover:bg-white"><Plus className="h-4 w-4" strokeWidth={2.4} />Yeni görev</button>
          </div>
          <p className="mt-2 text-[14.5px] text-[var(--sc-metin-2)]">Usta'ya düzenli işler ver: zamanı gelince çalışır, sonucu yeni bir sohbette bulursun.</p>
          <p className="mt-4 flex items-start gap-2 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.06]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />Görevler Vayra bir sekmede açıkken çalışır; kaçırılan görev sekmeyi açtığında bir kez çalıştırılır. Arka plandayken bitince haber almak için Ayarlar'dan bildirimleri aç.
          </p>

          {hazir && gorevler.length === 0 ? (
            <div className="mt-8">
              <p className="text-[13.5px] font-medium text-[var(--sc-metin-2)]">Hazır şablonlarla başla</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {SABLONLAR.map((s) => (
                  <button key={s.baslik} onClick={() => setPencere(s)} className="group flex flex-col rounded-[16px] bg-[#18181b] p-4 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-[#1c1c1f] hover:ring-white/[0.12]">
                    <CalendarClock className="h-5 w-5 text-[var(--sc-aksan)]" />
                    <span className="mt-3 text-[14.5px] font-medium">{s.baslik}</span>
                    <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[var(--sc-metin-3)]">{s.istem}</span>
                    <span className="mt-3 text-[12.5px] text-[var(--sc-metin-2)]">{tarif(s)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="mt-6 space-y-2.5">
              <AnimatePresence initial={false}>
                {gorevler.map((g) => (
                  <motion.li key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={YAY}
                    className={cn("rounded-[16px] bg-[#18181b] p-4 ring-1 ring-inset ring-white/[0.07]", !g.acik && "opacity-70")}>
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", g.acik ? "bg-[var(--sc-aksan)]/12 text-[var(--sc-aksan)]" : "bg-white/[0.05] text-[var(--sc-metin-3)]")}><CalendarClock className="h-[18px] w-[18px]" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[15px] font-medium">{g.baslik}{g.web && <Globe className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" aria-label="Web araması açık" />}</p>
                        <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-relaxed text-[var(--sc-metin-3)]">{g.istem}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--sc-metin-2)]">
                          <span>{tarif(g)}</span>
                          <span className="text-[var(--sc-metin-3)]">·</span>
                          <span>{g.acik ? (g.sonraki ? `Sonraki: ${zamanAd(g.sonraki)}` : "Zamanı geçti") : g.siklik === "bir" && g.sonCalisma ? "Tamamlandı" : "Duraklatıldı"}</span>
                          {g.sonSohbet && <><span className="text-[var(--sc-metin-3)]">·</span><Link href={`/panel/supercomputer/${g.sonSohbet}`} className="text-[var(--sc-aksan)] hover:underline">Son sonuç ({zamanAd(g.sonCalisma)})</Link></>}
                        </div>
                      </div>
                      <button role="switch" aria-checked={g.acik} aria-label={g.acik ? "Görevi duraklat" : "Görevi sürdür"} onClick={() => { guncelle(g.id, { acik: !g.acik }); toast(g.acik ? "Görev duraklatıldı" : "Görev yeniden başlatıldı"); }}
                        className={cn("relative mt-1 flex h-[20px] w-9 shrink-0 items-center rounded-full px-[2px] transition-colors", g.acik ? "justify-end bg-[var(--sc-aksan)]" : "justify-start bg-white/[0.16]")}>
                        <motion.span layout transition={YAY} className="h-4 w-4 rounded-full bg-white" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
                      <button onClick={() => { toast("Görev çalıştırıldı", { description: `${g.baslik} şimdi çalışıyor. Bitince bildirim gelir.` }); void calistir(g, ac, true); }} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[13px] hover:bg-white/[0.09]"><Play className="h-3.5 w-3.5" />Şimdi çalıştır</button>
                      <button onClick={() => setPencere(g)} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]"><Pencil className="h-3.5 w-3.5" />Düzenle</button>
                      <button onClick={() => { sil(g.id); toast("Görev silindi"); }} className="ml-auto flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] text-[var(--sc-metin-3)] hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" />Sil</button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
      {pencere && <GorevPenceresi ilk={pencere} onKapat={() => setPencere(null)} />}
    </MotionConfig>
  );
}
