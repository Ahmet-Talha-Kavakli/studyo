"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, Globe, LayoutDashboard, Loader2, RotateCcw, Smartphone, Trash2, Undo2 } from "lucide-react";
import { YanPanel, birincil, ikincil } from "@/components/build/paylasim/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { ProjeTur } from "@/lib/build/tipler";
import type { CopKaydi } from "@/lib/build/depo";
import { cn } from "@/lib/utils";

const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
const kalanGun = (silinme: number, gun: number) => Math.max(0, Math.ceil((silinme + gun * 86_400_000 - Date.now()) / 86_400_000));

/** Çöp kutusu listesi; projeler sayfası açılınca ve silme sonrası yenilenir. */
export function useCop() {
  const [l, setL] = useState<CopKaydi[] | null>(null);
  const [gun, setGun] = useState(30);
  const yukle = useCallback(async () => {
    try { const v = await api<{ projeler: CopKaydi[]; gun: number }>("/api/build/cop"); setL(v.projeler); setGun(v.gun); } catch { setL([]); }
  }, []);
  useEffect(() => { yukle(); }, [yukle]);
  return { l, gun, yukle };
}

export function CopDugmesi({ ac, sayi }: { ac: () => void; sayi: number }) {
  return (
    <button type="button" onClick={ac} title="Çöp kutusu" aria-label="Çöp kutusu" className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[13px] text-white/80 hover:bg-white/[0.13] hover:text-white">
      <Trash2 className="h-4 w-4" /><span className="max-sm:hidden">Çöp kutusu</span>
      {sayi > 0 && <span className="min-w-[18px] rounded-full bg-white/[0.12] px-1 text-center text-[11px] font-semibold tabular-nums text-white/85">{sayi}</span>}
    </button>
  );
}

/** Çöp kutusu (sağ panel): geri al, kalıcı sil, hepsini boşalt. */
export function CopPaneli({ acik, kapat, cop, yenile }: { acik: boolean; kapat: () => void; cop: ReturnType<typeof useCop>; yenile: () => void }) {
  const [is, setIs] = useState("");
  const [onay, setOnay] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  useEffect(() => { if (acik) { setOnay(""); setHata(""); setBilgi(""); cop.yukle(); } }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  const islem = async (anahtar: string, govde: Record<string, unknown>) => {
    setIs(anahtar); setHata(""); setBilgi("");
    try {
      const v = await api<{ uyari?: string; altAlan?: string }>("/api/build/cop", { govde });
      if (v.uyari) setBilgi(v.uyari);
      await cop.yukle(); yenile(); setOnay("");
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); }
    finally { setIs(""); }
  };
  const l = cop.l ?? [];
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Çöp kutusu" alt={`Silinen projeler ${cop.gun} gün burada kalır, sonra kalıcı silinir`}
      alt2={<>
        {onay === "bosalt" ? (
          <>
            <span className="min-w-0 flex-1 text-[12.5px] text-rose-100/80">{l.length} proje veritabanı ve dosyalarıyla kalıcı silinir</span>
            <button type="button" onClick={() => setOnay("")} className={ikincil}>Vazgeç</button>
            <button type="button" disabled={!!is} onClick={() => islem("bosalt", { islem: "bosalt" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-4 text-[13px] font-semibold text-white">{is === "bosalt" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Boşalt</button>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/45">{l.length ? `${l.length} proje` : "Boş"}</span>
            {l.length > 0 && <button type="button" onClick={() => setOnay("bosalt")} className={cn(ikincil, "text-rose-200")}>Çöpü boşalt</button>}
            <button type="button" onClick={kapat} className={birincil}>Bitti</button>
          </>
        )}
      </>}>
      {hata && <p className="mb-3 text-[12.5px] text-rose-300">{hata}</p>}
      {bilgi && <p className="mb-3 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12.5px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/20">{bilgi}</p>}
      {cop.l === null ? <div className="flex justify-center py-14"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></div>
        : !l.length ? (
          <div className="rounded-[18px] bg-white/[0.025] px-5 py-10 text-center ring-1 ring-inset ring-white/[0.06]">
            <Trash2 className="mx-auto h-5 w-5 text-white/35" />
            <p className="mt-2.5 text-[14px] font-medium text-white">Çöp kutusu boş</p>
            <p className="mx-auto mt-1 max-w-[320px] text-[12.5px] leading-relaxed text-white/50">Sildiğin projeler {cop.gun} gün burada bekler; bu sürede veritabanı, dosyalar ve sohbetiyle birlikte geri alabilirsin.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
            {l.map((x) => {
              const I = TUR_IKON[x.tur] ?? Globe;
              const kalan = kalanGun(x.silinme, cop.gun);
              return (
                <li key={x.id} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">
                    {x.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.kapak} alt="" className="h-full w-full object-cover object-top opacity-70 grayscale-[40%]" /> : I ? <I className="h-4 w-4 text-white/40" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-white">{x.ad}</span>
                    <span className="block truncate text-[12px] text-white/45">{gorece(x.silinme)} silindi{x.yayindaydi ? " · yayındaydı" : ""}</span>
                    <span className={cn("block truncate text-[12px]", kalan <= 3 ? "text-amber-200/85" : "text-white/35")}>{kalan ? `${kalan} gün sonra kalıcı silinir` : "Bugün kalıcı silinir"}</span>
                  </span>
                  {onay === x.id ? (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => setOnay("")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Vazgeç</button>
                      <button type="button" disabled={!!is} onClick={() => islem(`sil-${x.id}`, { islem: "sil", id: x.id })} className="inline-flex h-8 items-center gap-1 rounded-full bg-rose-500 px-3 text-[12.5px] font-semibold text-white">{is === `sil-${x.id}` && <Loader2 className="h-3 w-3 animate-spin" />}Kalıcı sil</button>
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1">
                      <button type="button" disabled={!!is} onClick={() => islem(`geri-${x.id}`, { islem: "geri", id: x.id })} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{is === `geri-${x.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}Geri al</button>
                      <button type="button" onClick={() => setOnay(x.id)} title="Kalıcı sil" aria-label="Kalıcı sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </YanPanel>
  );
}

/** Silme sonrası alttaki "Geri al" bildirimi (8 sn). */
export function GeriAlBildirimi({ olay, kapat, yenile }: { olay: { ids: string[]; ad: string; anahtar: number } | null; kapat: () => void; yenile: () => void }) {
  const [is, setIs] = useState(false);
  useEffect(() => { if (!olay) return; const t = setTimeout(kapat, 8000); return () => clearTimeout(t); }, [olay, kapat]);
  const geri = async () => {
    if (!olay) return;
    setIs(true);
    for (const id of olay.ids) await api("/api/build/cop", { govde: { islem: "geri", id } }).catch(() => {});
    setIs(false); kapat(); yenile();
  };
  return (
    <AnimatePresence>
      {olay && (
        <motion.div key={olay.anahtar} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}
          role="status" className="bd-panel fixed bottom-6 left-1/2 z-[120] flex w-[min(440px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-full py-2 pl-4 pr-2">
          <Trash2 className="h-4 w-4 shrink-0 text-white/50" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-white/85">{olay.ids.length > 1 ? `${olay.ids.length} proje çöp kutusuna taşındı` : `${olay.ad} çöp kutusuna taşındı`}</span>
          <button type="button" disabled={is} onClick={geri} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">{is ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}Geri al</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
