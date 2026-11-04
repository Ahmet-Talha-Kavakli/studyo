"use client";

/**
 * Earn › Marketplace parçaları (2026-10-29, seçilen "B · Satıcı paneli"; Gumroad satıcı paneli incelendi):
 * tarayıcı çerçeveli satış paneli (3 büyük sayı + kapaklı preset tablosu), fiyat bölünmesi, yayınlama penceresi.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { usePaylasim, presetMinFiyat } from "@/store/usePaylasim";
import { useProjeler } from "@/store/useProjeler";
import { useAuth } from "@/store/useAuth";
import { KrediJeton } from "@/components/ui/KrediHap";
import { PRESET_KATEGORILERI, PRESET_KREDI_TL, tl } from "@/lib/earn/kampanyalar";
import { birincil, ease, yay } from "./ui";
import { toast } from "@/lib/toast";
import { cn, saltUrl } from "@/lib/utils";

/* ── Yayınlama penceresi ── */
export function PresetFormu({ kapat }: { kapat: () => void }) {
  const paylas = usePaylasim((s) => s.paylas);
  const benim = usePaylasim((s) => s.benimPaylasimlar);
  const yayinda = benim.map((p) => p.uretimId);
  const kullaniciAd = useAuth((s) => s.kullanici?.ad);
  const uretimler = useProjeler((s) => s.uretimler);
  const adaylar = uretimler.filter((u) => u.durum === "tamam" && (u.tur === "gorsel" || u.tur === "video") && !yayinda.includes(u.id) && saltUrl(u.gorselUrl ?? u.thumbnailUrl))
    .sort((a, b) => b.olusturma - a.olusturma).slice(0, 18);
  const [secId, setSecId] = useState<string | null>(adaylar[0]?.id ?? null);
  const sec = adaylar.find((u) => u.id === secId);
  const [ad, setAd] = useState("");
  const [kategori, setKategori] = useState(PRESET_KATEGORILERI[0]);
  const [ekstra, setEkstra] = useState(10);
  const minFiyat = presetMinFiyat(sec?.model);
  const gecerli = ad.trim().length >= 3 && !!sec;
  const pay = Math.floor(ekstra / 2);

  useEffect(() => { if (sec && !ad) setAd(sec.baslik.slice(0, 40)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [secId]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && kapat();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [kapat]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat}
      className="perde kesfet-tema earn-kapsam fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.25, ease }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Preset yayınla"
        className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-t-[28px] bg-[#141518] ring-1 ring-white/[0.1] sm:rounded-[28px]">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Preset yayınla</h2>
          <button onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {!adaylar.length ? (
          <div className="m-6 flex flex-col items-start gap-3 rounded-[20px] bg-white/[0.03] p-5 ring-1 ring-white/[0.08]">
            <p className="text-[15px] font-medium text-white">Yayınlanabilecek bir üretimin yok</p>
            <p className="text-[13.5px] text-white/55">Önce bir görsel ya da video üret; preset, o üretimin istemi ve modeliyle oluşturulur.</p>
            <Link href="/panel/gorsel" className={cn(birincil, "mt-1 h-10 px-4 text-[13.5px]")}>Görsel üret</Link>
          </div>
        ) : (
          <form className="grid gap-6 p-6 sm:grid-cols-[240px_minmax(0,1fr)]" onSubmit={(e) => {
            e.preventDefault(); if (!gecerli || !sec) return;
            paylas({
              tur: "preset", ad: ad.trim(), aciklama: sec.prompt.slice(0, 160), tohum: sec.id, kategori,
              yazar: "@" + (kullaniciAd?.replace(/\s+/g, "").toLowerCase() || "ben"), prompt: sec.prompt, model: sec.model,
              minFiyat, ekstraFiyat: ekstra, kazanc: 0, gorsel: saltUrl(sec.gorselUrl ?? sec.thumbnailUrl), uretimId: sec.id,
            });
            toast.success("Preset yayınlandı", { description: "Presetler › Topluluk bölümünde görünüyor." });
            kapat();
          }}>
            {/* Önizleme */}
            <div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-white/[0.03] ring-1 ring-white/[0.1]">
                <AnimatePresence mode="wait">
                  {sec && <motion.img key={sec.id} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} src={saltUrl(sec.gorselUrl ?? sec.thumbnailUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                </AnimatePresence>
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <span className="absolute inset-x-3 bottom-3"><span className="block truncate text-[14px] font-semibold text-white">{ad || "Preset adı"}</span><span className="text-[12px] text-white/65">{kategori} · {minFiyat + ekstra} kredi</span></span>
              </div>
              {sec && <p className="mt-2.5 line-clamp-3 text-[12px] leading-snug text-white/50">{sec.prompt} · {sec.model}</p>}
            </div>
            <div className="min-w-0 space-y-5">
              <div>
                <p className="text-[13px] text-white/60">Kaynak üretim</p>
                <div className="mt-2 grid grid-cols-6 gap-1.5">
                  {adaylar.map((u) => (
                    <button type="button" key={u.id} onClick={() => setSecId(u.id)} aria-pressed={secId === u.id} title={u.baslik}
                      className={cn("relative aspect-square overflow-hidden rounded-[10px] outline outline-2 -outline-offset-2 transition", secId === u.id ? "outline-white" : "outline-transparent opacity-55 hover:opacity-100")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={saltUrl(u.gorselUrl ?? u.thumbnailUrl)} alt="" className="h-full w-full object-cover" />
                      {secId === u.id && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black"><Check className="h-2.5 w-2.5" strokeWidth={3.5} /></span>}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-[13px] text-white/60">Ad</span>
                <input value={ad} onChange={(e) => setAd(e.target.value.slice(0, 40))} placeholder="Örneğin Altın Saat Portresi"
                  className="mt-2 h-11 w-full rounded-[14px] bg-black/25 px-3.5 text-[14px] text-white outline-none ring-1 ring-white/[0.1] transition placeholder:text-white/30 focus:ring-white/25" />
              </label>
              <div>
                <p className="text-[13px] text-white/60">Kategori</p>
                <LayoutGroup id="preset-kat">
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PRESET_KATEGORILERI.map((k) => (
                      <button type="button" key={k} onClick={() => setKategori(k)} aria-pressed={kategori === k} className="relative rounded-full px-3.5 py-1.5 text-[13px] active:scale-95">
                        {kategori === k ? <motion.span layoutId="preset-kat-z" className="absolute inset-0 rounded-full bg-white" transition={yay} /> : <span className="absolute inset-0 rounded-full ring-1 ring-white/[0.12]" />}
                        <span className={cn("relative", kategori === k ? "font-medium text-black" : "text-white/65")}>{k}</span>
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              </div>
              <div className="rounded-[18px] bg-black/25 p-4 ring-1 ring-white/[0.08]">
                <p className="flex justify-between text-[13px]"><span className="text-white/60">Ek fiyat</span><span className="tabular-nums text-white"><b>{minFiyat + ekstra} kredi</b><span className="text-white/50"> · taban {minFiyat}, ek {ekstra}</span></span></p>
                <input type="range" min={0} max={40} step={2} value={ekstra} onChange={(e) => setEkstra(Number(e.target.value))} aria-label="Ek fiyat"
                  className="fiyat-kaydirici mt-3 w-full" style={{ "--dolu": `${(ekstra / 40) * 100}%` } as React.CSSProperties} />
                <p className="mt-3 flex items-center gap-1.5 text-[13px] text-white/60">Her kullanımda sana <span className="flex items-center gap-1 font-semibold text-white"><KrediJeton boyut={12} />{pay} kredi</span><span className="text-emerald-300">{tl(pay * PRESET_KREDI_TL, true)}</span></p>
                <p className="mt-1 text-[12px] text-white/40">Taban fiyat modelin maliyetidir.</p>
              </div>
              <button disabled={!gecerli} className={cn(birincil, "w-full")}>Yayınla</button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
