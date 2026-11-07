"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Palette, Plus, Sparkles, Trash2, Type, Wand2, X } from "lucide-react";
import { bosMarka, type MarkaKiti } from "@/lib/build/buyumeEkTipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Etiket, HataSatiri, ikincil, Kart, ModelYokKart, Rozet, simgeDugme } from "./ortak";
import { ModelYokEk } from "./useBuyumeEk";
import type { BolumProps } from "./BuyumeSekme";

/** Marka kiti (Canva Brand Kit, Jasper Brand Voice karşılığı): gönderiler, e-postalar ve reklam metinleri bunu kullanır. */
export function MarkaBolumu({ p, e }: BolumProps) {
  const d = e.d!;
  const [m, setM] = useState<MarkaKiti>(() => structuredClone(d.ek.marka ?? bosMarka()));
  const [kirli, setKirli] = useState(false);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [yasak, setYasak] = useState("");
  useEffect(() => { if (!kirli) setM(structuredClone(d.ek.marka ?? bosMarka())); }, [d.ek.marka]); // eslint-disable-line react-hooks/exhaustive-deps
  const degis = (y: Partial<MarkaKiti>) => { setM((x) => ({ ...x, ...y })); setKirli(true); setBilgi(""); };
  const kaydet = async () => { setHata(""); try { await e.duzenle("marka", { marka: m }); setKirli(false); setBilgi("Marka kiti kaydedildi; bundan sonraki bütün yazımlar bunu kullanır."); } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); } };
  const cikar = async () => { setHata(""); try { const j = await e.islem("marka-cikar"); const y = j.marka as Partial<MarkaKiti>; degis({ renkler: y.renkler?.length ? y.renkler : m.renkler, baslikYazi: y.baslikYazi || m.baslikYazi, govdeYazi: y.govdeYazi || m.govdeYazi, logo: y.logo || m.logo }); setBilgi(`Siteden ${y.renkler?.length ?? 0} renk${y.baslikYazi ? ` ve ${y.baslikYazi} yazı tipi` : ""} çıkarıldı. Kaydetmeyi unutma.`); } catch (x) { setHata(x instanceof Error ? x.message : "Çıkarılamadı."); } };
  const ses = async () => { setHata(""); setModelYok(false); try { const j = await e.islem("marka-ses", {}, "marka-ses"); degis({ ton: String(j.ton ?? m.ton), slogan: String(j.slogan ?? "") || m.slogan, yasakli: [...new Set([...m.yasakli, ...((j.yasakli as string[]) ?? [])])] }); } catch (x) { if (x instanceof ModelYokEk) setModelYok(true); else setHata(x instanceof Error ? x.message : "Çıkarılamadı."); } };
  const ana = m.renkler[0]?.hex ?? "#111111";

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Marka kiti{d.ek.marka?.guncelleme ? <Rozet ton="aksan">Kullanımda</Rozet> : <Rozet ton="soluk">Boş</Rozet>}</span>}
        aciklama="Renk, yazı tipi, ses tonu ve yasaklı sözcükler. Büyüme ajanı her gönderide, e-postada ve reklam metninde buna uyar; e-postaların rengi ve alt bilgisi buradan gelir."
        sag={<><button type="button" onClick={cikar} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Sparkles className="h-3.5 w-3.5" />Siteden çıkar</button><button type="button" disabled={!kirli} onClick={kaydet} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>Kaydet</button></>}>
        {/* Canlı örnek: e-posta başlığı ve düğme marka renginde */}
        <div className="flex flex-wrap items-center gap-4 rounded-[16px] bg-[#f4f5f7] p-4">
          <div className="min-w-[220px] flex-1 overflow-hidden rounded-[12px] bg-white" style={{ borderTop: `4px solid ${ana}` }}>
            <div className="px-4 py-3">
              {m.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.logo} alt="" className="h-7 w-auto" /> : <p className="text-[15px] font-bold text-[#111]" style={{ fontFamily: m.baslikYazi || undefined }}>{p.ad}</p>}
              <p className="mt-2 text-[17px] font-bold leading-snug text-[#111827]" style={{ fontFamily: m.baslikYazi || undefined }}>{m.slogan || "Bu hafta yeni çekirdekler geldi"}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#374151]" style={{ fontFamily: m.govdeYazi || undefined }}>Merhaba Ayşe, seni yeniden görmek isteriz.</p>
              <span className="mt-3 inline-block rounded-[9px] px-4 py-2 text-[13px] font-semibold" style={{ background: ana, color: parseInt(ana.slice(1), 16) > 0x999999 ? "#111" : "#fff" }}>Siteye git</span>
            </div>
            {m.iletisim && <p className="border-t border-black/5 px-4 py-2 text-[11px] text-[#9ca3af]">{m.iletisim}</p>}
          </div>
          <div className="flex flex-wrap gap-2">{m.renkler.map((r) => <span key={r.hex + r.ad} className="flex flex-col items-center gap-1"><span className="h-12 w-12 rounded-[12px] ring-1 ring-black/10" style={{ background: r.hex }} /><span className="text-[10.5px] text-black/55">{r.hex}</span></span>)}</div>
        </div>
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {bilgi && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</motion.p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Kart baslik={<span className="flex items-center gap-2"><Palette className="h-4 w-4 text-white/60" />Renkler</span>} aciklama="İlk renk e-posta düğmesi ve üst çizgisidir."
          sag={m.renkler.length < 8 ? <button type="button" onClick={() => degis({ renkler: [...m.renkler, { ad: "Renk", hex: "#55d6fd" }] })} className={simgeDugme} aria-label="Renk ekle" title="Renk ekle"><Plus className="h-4 w-4" /></button> : undefined}>
          <ul className="space-y-2">
            {m.renkler.map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/15" style={{ background: r.hex }}><input type="color" value={r.hex} onChange={(x) => degis({ renkler: m.renkler.map((y, j) => (j === i ? { ...y, hex: x.target.value } : y)) })} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Renk seç" /></label>
                <input value={r.ad} onChange={(x) => degis({ renkler: m.renkler.map((y, j) => (j === i ? { ...y, ad: x.target.value } : y)) })} maxLength={30} className={cn(alan, "h-9 min-w-0 flex-1")} />
                <input value={r.hex} onChange={(x) => degis({ renkler: m.renkler.map((y, j) => (j === i ? { ...y, hex: x.target.value.slice(0, 7) } : y)) })} className={cn(alan, "h-9 w-[92px] shrink-0 tabular-nums")} />
                <button type="button" onClick={() => degis({ renkler: m.renkler.filter((_, j) => j !== i) })} className={simgeDugme} aria-label="Rengi sil"><Trash2 className="h-3.5 w-3.5" /></button>
              </li>
            ))}
            {!m.renkler.length && <li className="text-[12.5px] text-white/50">Renk yok. Siteden çıkar ya da ekle.</li>}
          </ul>
        </Kart>
        <Kart baslik={<span className="flex items-center gap-2"><Type className="h-4 w-4 text-white/60" />Yazı tipi ve logo</span>}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Etiket ad="Başlık"><input value={m.baslikYazi} onChange={(x) => degis({ baslikYazi: x.target.value })} placeholder="Fraunces" className={cn(alan, "h-9")} /></Etiket>
              <Etiket ad="Metin"><input value={m.govdeYazi} onChange={(x) => degis({ govdeYazi: x.target.value })} placeholder="Inter" className={cn(alan, "h-9")} /></Etiket>
            </div>
            <Etiket ad="Logo adresi" sag={<span className="text-[11.5px] text-white/40">https, e-postada görünür</span>}><input value={m.logo ?? ""} onChange={(x) => degis({ logo: x.target.value })} placeholder="https://.../logo.png" className={cn(alan, "h-9")} /></Etiket>
          </div>
        </Kart>
      </div>

      <Kart baslik="Ses tonu" aciklama="Ajanın yazarken uyduğu tarif. Kime, nasıl konuşur, hangi sözcükleri sever."
        sag={<button type="button" disabled={e.suruyor("marka-ses")} onClick={ses} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{e.suruyor("marka-ses") ? <span className="build-nokta" /> : <Wand2 className="h-3.5 w-3.5" />}Sitemden çıkar</button>}>
        {modelYok && <div className="mb-3"><ModelYokKart tekrar={() => setModelYok(false)} /></div>}
        <textarea value={m.ton} onChange={(x) => degis({ ton: x.target.value })} rows={4} maxLength={1000} placeholder="Sıcak ve sakin bir mahalle kahvecisi gibi konuşuruz. Sen diliyle, kısa cümlelerle; kahveyi anlatırken teknik ama gösterişsiz." className={cn(alan, "resize-none py-2.5 leading-relaxed")} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Etiket ad="Slogan"><input value={m.slogan ?? ""} onChange={(x) => degis({ slogan: x.target.value })} maxLength={120} className={cn(alan, "h-9")} /></Etiket>
          <div>
            <p className="mb-1.5 text-[12.5px] text-white/60">Asla kullanma</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {m.yasakli.map((y) => <span key={y} className="inline-flex h-7 items-center gap-1 rounded-full bg-rose-500/[0.1] pl-2.5 pr-1 text-[12px] text-rose-100">{y}<button type="button" onClick={() => degis({ yasakli: m.yasakli.filter((z) => z !== y) })} aria-label={`${y} sözcüğünü kaldır`} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button></span>)}
              <input value={yasak} onChange={(x) => setYasak(x.target.value)} onKeyDown={(x) => { if (x.key === "Enter" && yasak.trim()) { degis({ yasakli: [...new Set([...m.yasakli, yasak.trim()])] }); setYasak(""); } }} placeholder="sözcük, Enter" className="h-7 w-[120px] rounded-full bg-white/[0.04] px-2.5 text-[12px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40" />
            </div>
          </div>
        </div>
      </Kart>

      <Kart baslik={<span className="flex items-center gap-2"><Mail className="h-4 w-4 text-white/60" />Gönderen bilgisi</span>} aciklama="Her e-postanın altına eklenir. 6563 sayılı Kanun gereği ticari iletide işletmenin adı ve ulaşılabilir iletişim bilgisi bulunmalı.">
        <textarea value={m.iletisim} onChange={(x) => degis({ iletisim: x.target.value })} rows={2} maxLength={400} placeholder="Lumen Kahve, Caferağa Mah. Moda Cad. 12, Kadıköy İstanbul · merhaba@lumenkahve.com" className={cn(alan, "resize-none py-2.5")} />
      </Kart>
      {kirli && <div className="sticky bottom-0 flex justify-end"><button type="button" onClick={kaydet} className={cn(birincil, "h-10 px-5")}>Marka kitini kaydet</button></div>}
    </div>
  );
}
