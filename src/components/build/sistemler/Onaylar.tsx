"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Clock3, Inbox, LayoutGrid, Loader2, Pencil, Plus, UserCheck, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { SistemSekmeleri, sureYaz, tarihSaat } from "./ortak";

type Bekleyen = { calismaId: string; anahtar?: string; sistemId: string; sistemAd: string; adim: string; baslik: string; icerik: string; duzenlenebilir: boolean; varsayilan: "onay" | "ret"; zamanAsimi?: number; istendi: number; deneme: boolean };
type Gecmis = { calismaId: string; sistemId: string; sistemAd: string; baslik: string; karar: "onay" | "ret"; duzenlendi: boolean; not?: string; zaman: number; kararVeren: string };

function OnayKarti({ o, bitti }: { o: Bekleyen; bitti: (karar: "onay" | "ret") => void }) {
  const [icerik, setIcerik] = useState(o.icerik);
  const [duzen, setDuzen] = useState(false);
  const [not, setNot] = useState("");
  const [gidiyor, setGidiyor] = useState<"onay" | "ret" | null>(null);
  const [hata, setHata] = useState("");
  const degisti = icerik !== o.icerik;
  const kalan = o.zamanAsimi ? o.zamanAsimi - Date.now() : null;
  const karar = async (k: "onay" | "ret") => {
    setGidiyor(k); setHata("");
    try { await api("/api/build/sistemler/onaylar", { govde: { sistemId: o.sistemId, calismaId: o.calismaId, anahtar: o.anahtar, karar: k, not, ...(degisti ? { icerik } : {}) } }); bitti(k); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Karar kaydedilemedi."); setGidiyor(null); }
  };
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="overflow-hidden rounded-[22px] bg-[#121315] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-start gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-violet-400/[0.13] text-violet-200"><UserCheck className="h-[18px] w-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-white"><span className="min-w-0 truncate">{o.baslik || o.adim}</span>{o.deneme && <span className="hidden shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-white/60 sm:inline">Deneme çalışması</span>}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-white/50"><Link href={`/panel/build/sistemler/${o.sistemId}`} className="hover:text-white">{o.sistemAd}</Link><span className="text-white/25">·</span><span>{o.adim}</span><span className="text-white/25">·</span><span>{gorece(o.istendi)} istendi</span>{o.deneme && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-white/60 sm:hidden">Deneme</span>}</p>
          {kalan !== null && <span className={cn("mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] sm:hidden", kalan < 3_600_000 ? "bg-amber-400/[0.12] text-amber-200" : "bg-white/[0.06] text-white/60")}><Clock3 className="h-3.5 w-3.5" />{kalan > 0 ? `${sureYaz(kalan)} kaldı, sonra ${o.varsayilan === "onay" ? "onaylanır" : "reddedilir"}` : "Süre doldu"}</span>}
        </div>
        {kalan !== null && <span className={cn("hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] sm:flex", kalan < 3_600_000 ? "bg-amber-400/[0.12] text-amber-200" : "bg-white/[0.06] text-white/60")} title={`${tarihSaat(o.zamanAsimi!)} zamanında ${o.varsayilan === "onay" ? "onaylanmış" : "reddedilmiş"} sayılır`}><Clock3 className="h-3.5 w-3.5" />{kalan > 0 ? `${sureYaz(kalan)} kaldı, sonra ${o.varsayilan === "onay" ? "onaylanır" : "reddedilir"}` : "Süre doldu"}</span>}
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        {duzen ? <textarea value={icerik} onChange={(e) => setIcerik(e.target.value)} rows={Math.min(14, Math.max(4, icerik.split("\n").length + 1))} className={cn(alanSinif, "resize-y py-3 text-[14px] leading-relaxed")} />
          : <div className="max-h-[320px] overflow-y-auto whitespace-pre-wrap break-words rounded-[16px] bg-white/[0.03] px-4 py-3 text-[14px] leading-relaxed text-white/85 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">{icerik || <span className="text-white/40">İçerik boş</span>}</div>}
        <input value={not} onChange={(e) => setNot(e.target.value)} maxLength={2000} placeholder="Not ekle, isteğe bağlı (sonraki adımlar not alanıyla kullanır)" className={cn(alanSinif, "h-10 text-[13.5px]")} />
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => karar("onay")} disabled={!!gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-50">{gidiyor === "onay" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{degisti ? "Düzenleyip onayla" : "Onayla"}</button>
          <button type="button" onClick={() => karar("ret")} disabled={!!gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-rose-500/[0.12] px-4 text-[13.5px] font-medium text-rose-200 hover:bg-rose-500/[0.18] disabled:opacity-50">{gidiyor === "ret" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}Reddet</button>
          {o.duzenlenebilir && !duzen && <button type="button" onClick={() => setDuzen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] text-white/70 hover:bg-white/[0.06] hover:text-white"><Pencil className="h-4 w-4" />Düzenle</button>}
          {duzen && degisti && <button type="button" onClick={() => { setIcerik(o.icerik); setDuzen(false); }} className="h-10 rounded-full px-3.5 text-[13px] text-white/55 hover:bg-white/[0.06]">Değişikliği geri al</button>}
          <Link href={`/panel/build/sistemler/${o.sistemId}/calisma/${o.calismaId}`} className="ml-auto inline-flex h-10 items-center gap-1 rounded-full px-3 text-[13px] text-white/50 hover:bg-white/[0.06] hover:text-white">Çalışmayı aç<ChevronRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </motion.div>
  );
}

/** Onay kutusu: insan onayı adımlarının bekleyen istekleri ve son kararlar. */
export function Onaylar() {
  const router = useRouter();
  const [l, setL] = useState<Bekleyen[] | null>(null);
  const [gecmis, setGecmis] = useState<Gecmis[]>([]);
  const [kuruluyor, setKuruluyor] = useState(false);
  const yukle = useCallback(() => api<{ bekleyen: Bekleyen[]; gecmis: Gecmis[] }>("/api/build/sistemler/onaylar").then((v) => { setL(v.bekleyen); setGecmis(v.gecmis); }).catch(() => setL([])), []);
  useEffect(() => { yukle(); const z = setInterval(yukle, 10_000); return () => clearInterval(z); }, [yukle]);
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <SistemSekmeleri sayilar={{ onay: l?.length }} />
      <Kart ikon={Inbox} baslik={<span className="flex items-center gap-2">Onaylar{!!l?.length && <span className="rounded-full bg-amber-400/[0.14] px-2 py-0.5 text-[12px] font-medium tabular-nums text-amber-200">{l.length} bekliyor</span>}</span>}
        alt="İnsan onayı adımları burada bekler; onayla, reddet ya da içeriği düzenleyip onayla" govde="p-4 sm:p-5">
        {l === null ? <div className="h-40 animate-pulse rounded-[18px] bg-white/[0.03]" /> : !l.length ? (
          <div className="flex flex-col gap-3 rounded-[18px] bg-white/[0.025] p-4 ring-1 ring-inset ring-white/[0.06] sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-violet-400/[0.12] text-violet-200"><UserCheck className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold text-white">Bekleyen onay yok</p><p className="text-[12.5px] leading-relaxed text-white/50">Bir sisteme İnsan onayı adımı ekle; çalışma o adıma gelince istek buraya düşer ve sen karar verene kadar bekler.</p></div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" disabled={kuruluyor} onClick={async () => { setKuruluyor(true); try { const v = await api<{ id: string }>("/api/build/sistemler", { govde: { sablon: "icerik-onay" } }); router.push(`/panel/build/sistemler/${v.id}`); } catch { setKuruluyor(false); } }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{kuruluyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Onaylı gönderi sistemi kur</button>
              <Link href="/panel/build/sistemler#hazir" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white/85 hover:bg-white/[0.12]"><LayoutGrid className="h-3.5 w-3.5" />Hazır sistemler</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3"><AnimatePresence initial={false}>{l.map((o) => <OnayKarti key={`${o.calismaId}:${o.anahtar ?? ""}`} o={o} bitti={() => { setL((x) => x?.filter((y) => !(y.calismaId === o.calismaId && y.anahtar === o.anahtar)) ?? null); setTimeout(yukle, 600); }} />)}</AnimatePresence></div>
        )}
      </Kart>
      {gecmis.length > 0 && (
        <Kart ikon={Clock3} baslik="Son kararlar" alt="Uygulamadan, devam adresinden ya da zaman aşımıyla verilen kararlar">
          <div className="divide-y divide-white/[0.05]">
            {gecmis.slice(0, 20).map((g) => (
              <Link key={`${g.calismaId}-${g.zaman}`} href={`/panel/build/sistemler/${g.sistemId}/calisma/${g.calismaId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] sm:px-5">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", g.karar === "onay" ? "bg-emerald-400/[0.12] text-emerald-200" : "bg-rose-500/[0.12] text-rose-200")}>{g.karar === "onay" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{g.baslik}</span><span className="block truncate text-[12px] text-white/45">{g.sistemAd} · {g.karar === "onay" ? (g.duzenlendi ? "Düzenlenip onaylandı" : "Onaylandı") : "Reddedildi"} · {g.kararVeren === "zaman-asimi" ? "zaman aşımı" : g.kararVeren === "adres" ? "devam adresinden" : "uygulamadan"}{g.not ? ` · ${g.not}` : ""}</span></span>
                <span className="shrink-0 text-[12px] text-white/40">{gorece(g.zaman)}</span>
              </Link>
            ))}
          </div>
        </Kart>
      )}
    </div>
  );
}
