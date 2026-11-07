"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowRight, ChevronLeft, Clock3, Link2Off, Loader2, TimerOff, UserCheck, Users } from "lucide-react";
import { alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { ProjeKapagi } from "@/components/build/ana/Bolumler";
import { sahipAnahtari } from "@/lib/build/istemci";
import { ROL_ACIKLAMA, kalanSure, type DavetHataKodu, type DavetOnizleme } from "@/lib/build/ekipOrtak";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { KisiAvatari, RolHapi, yay } from "./ortak";

type Yanit = { ok?: boolean; hata?: string; kod?: DavetHataKodu | "uye" | "sahip"; davet?: DavetOnizleme; projeId?: string };
const HATA: Record<DavetHataKodu, { baslik: string; ikon: typeof Link2Off }> = {
  gecersiz: { baslik: "Bu davet geçersiz", ikon: Link2Off },
  "suresi-doldu": { baslik: "Davetin süresi dolmuş", ikon: TimerOff },
  kullanildi: { baslik: "Bu davet kullanılmış", ikon: Link2Off },
};

async function istek(kod: string, govde?: unknown): Promise<{ durum: number; v: Yanit }> {
  const r = await fetch(`/api/build/ekip/davet/${encodeURIComponent(kod)}`, {
    method: govde ? "POST" : "GET", cache: "no-store",
    headers: { "x-build-sahip": sahipAnahtari(), ...(govde ? { "Content-Type": "application/json" } : {}) },
    body: govde ? JSON.stringify(govde) : undefined,
  });
  let v: Yanit = {};
  try { v = await r.json(); } catch { /* boş */ }
  return { durum: r.status, v };
}

/** Davet sayfası: proje kapağı, adı, davet eden, rol; "Projeye katıl". Hata: geçersiz, süresi dolmuş, kullanılmış, zaten üye, kendi projen. */
export function DavetSayfasi({ kod }: { kod: string }) {
  const router = useRouter();
  const hesapAd = useAuth((s) => s.kullanici?.ad?.trim() ?? "");
  const [d, setD] = useState<DavetOnizleme | null>(null);
  const [hata, setHata] = useState<{ kod: DavetHataKodu; metin: string } | null>(null);
  const [ad, setAd] = useState("");
  const [katiliyor, setKatiliyor] = useState(false);
  const [katilHata, setKatilHata] = useState("");

  useEffect(() => { if (hesapAd) setAd((x) => x || hesapAd); }, [hesapAd]);
  useEffect(() => {
    let iptal = false;
    istek(kod).then(({ v }) => {
      if (iptal) return;
      if (v.ok && v.davet) setD(v.davet);
      else setHata({ kod: (v.kod as DavetHataKodu) in HATA ? (v.kod as DavetHataKodu) : "gecersiz", metin: v.hata ?? "Bu davet bağlantısı açılamadı." });
    }).catch(() => !iptal && setHata({ kod: "gecersiz", metin: "Bağlantı kurulamadı; internetini kontrol edip yeniden dene." }));
    return () => { iptal = true; };
  }, [kod]);

  const katil = async () => {
    if (!d) return;
    setKatiliyor(true); setKatilHata("");
    try {
      const { v } = await istek(kod, { ad: ad.trim() || hesapAd });
      if (v.ok && v.projeId) { router.replace(`/panel/build/${v.projeId}`); return; }
      if (v.kod === "uye" || v.kod === "sahip") setD({ ...d, durum: v.kod });
      else if (v.kod && v.kod in HATA) setHata({ kod: v.kod as DavetHataKodu, metin: v.hata ?? "" });
      else setKatilHata(v.hata ?? "Katılınamadı; yeniden dene.");
    } catch { setKatilHata("Bağlantı kurulamadı; yeniden dene."); }
    setKatiliyor(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#0b0b0d] px-4 pb-16 pt-5 text-white sm:pt-8">
        <div className="mx-auto max-w-[460px]">
          <Link href="/panel/build/projeler" className="inline-flex h-9 items-center gap-1 rounded-full pl-1.5 pr-3 text-[13px] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"><ChevronLeft className="h-4 w-4" />Projeler</Link>
          <AnimatePresence mode="wait">
            {!d && !hata ? (
              <motion.div key="yuk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 overflow-hidden rounded-[24px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
                <div className="aspect-[16/10] animate-pulse bg-white/[0.04]" />
                <div className="space-y-3 p-5"><div className="h-4 w-2/3 animate-pulse rounded-full bg-white/[0.06]" /><div className="h-6 w-1/2 animate-pulse rounded-full bg-white/[0.06]" /><div className="h-11 animate-pulse rounded-full bg-white/[0.05]" /></div>
              </motion.div>
            ) : hata ? (
              <motion.div key="hata" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={yay} className="mt-6 rounded-[24px] bg-white/[0.03] p-6 text-center ring-1 ring-inset ring-white/[0.08]">
                {(() => { const I = HATA[hata.kod].ikon; return <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] bg-white/[0.06] text-white/70"><I className="h-5 w-5" /></span>; })()}
                <p className="mt-4 text-[18px] font-semibold tracking-tight">{HATA[hata.kod].baslik}</p>
                <p className="mx-auto mt-1.5 max-w-[340px] text-[13.5px] leading-relaxed text-white/55">{hata.metin}</p>
                <Link href="/panel/build/projeler" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-5 text-[13.5px] font-semibold text-black transition-transform active:scale-[0.97]">Projelerime dön</Link>
              </motion.div>
            ) : d && (
              <motion.div key="davet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={yay} className="mt-6 overflow-hidden rounded-[24px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
                <div className="group relative aspect-[16/10] overflow-hidden bg-[#16171a]">
                  <ProjeKapagi p={{ kapak: d.proje.kapak, tur: d.proje.tur }} />
                  <span className="absolute left-3 top-3"><RolHapi rol={d.rol} koyu /></span>
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-2 text-[13px] text-white/65"><KisiAvatari ad={d.sahipAd} boyut={22} /><span className="min-w-0 truncate"><span className="font-medium text-white">{d.sahipAd}</span> seni ekibine davet etti</span></p>
                  <h1 className="mt-2.5 text-[24px] font-semibold leading-tight tracking-tight">{d.proje.ad}</h1>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/60"><span className="font-medium text-white/85">{d.rol === "duzenleyici" ? "Düzenleyici" : "İzleyici"} olarak:</span> {ROL_ACIKLAMA[d.rol].charAt(0).toLocaleLowerCase("tr-TR") + ROL_ACIKLAMA[d.rol].slice(1)}</p>
                  <dl className="mt-4 grid grid-cols-2 divide-x divide-white/[0.06] rounded-[14px] bg-black/20 py-2.5 text-center ring-1 ring-inset ring-white/[0.05]">
                    <div><dt className="text-[11.5px] text-white/45">Ekip</dt><dd className="mt-0.5 flex items-center justify-center gap-1.5 text-[14px] font-semibold tabular-nums"><Users className="h-3.5 w-3.5 text-white/50" />{d.uyeSayisi + 1} kişi</dd></div>
                    <div><dt className="text-[11.5px] text-white/45">Bağlantı</dt><dd className="mt-0.5 flex items-center justify-center gap-1.5 text-[14px] font-semibold"><Clock3 className="h-3.5 w-3.5 text-white/50" />{kalanSure(d.sonKullanma)}</dd></div>
                  </dl>

                  {d.durum === "gecerli" ? (
                    <>
                      {!hesapAd && (
                        <label className="mt-4 block">
                          <span className="mb-1.5 block text-[12.5px] text-white/65">Ekipte görünecek adın</span>
                          <input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={40} placeholder="Adın, ör. Deniz" className={cn(alanSinif, "h-11")} />
                        </label>
                      )}
                      <button type="button" onClick={katil} disabled={katiliyor || (!hesapAd && !ad.trim())} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition-[opacity,transform] active:scale-[0.98] disabled:opacity-40">
                        {katiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Projeye katıl
                      </button>
                      <AnimatePresence>{katilHata && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2.5 text-center text-[12.5px] text-rose-300">{katilHata}</motion.p>}</AnimatePresence>
                      <p className="mt-3 text-center text-[12px] leading-relaxed text-white/45">{d.tekKullanim ? "Bu bağlantı tek kullanımlık; katılınca kapanır. " : ""}Katılınca proje, Projeler sayfanda Benimle paylaşılan altında görünür.</p>
                    </>
                  ) : (
                    <div className="mt-4 rounded-[16px] bg-[#55d6fd]/[0.06] p-3.5 ring-1 ring-inset ring-[#55d6fd]/15">
                      <p className="flex items-center gap-2 text-[13.5px] font-medium text-white"><UserCheck className="h-4 w-4 text-[#7fe0ff]" />{d.durum === "sahip" ? "Bu senin projen" : "Zaten bu ekiptesin"}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">{d.durum === "sahip" ? "Davet bağlantısı ekibe katılacak kişiler için. Projeni hemen açabilirsin." : "Bu projeye zaten erişimin var; davete yeniden katılman gerekmiyor."}</p>
                      <button type="button" onClick={() => router.push(`/panel/build/${d.proje.id}`)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[13.5px] font-semibold text-black transition-transform active:scale-[0.98]"><ArrowRight className="h-4 w-4" />Projeyi aç</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
