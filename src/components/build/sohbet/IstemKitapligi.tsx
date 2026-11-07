"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, BookMarked, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { api } from "@/lib/build/istemci";
import { HAZIR_ISTEMLER, ISTEM_KATEGORILERI, alanEtiketi, alanlar, doldur, type HazirIstem, type IstemKategori } from "@/lib/build/sohbetIstemKatalog";
import { cn } from "@/lib/utils";
import type { KayitliIstemOzeti } from "./Besteci";
import { SagPanel } from "./ortak";

const KIP_AD: Record<NonNullable<HazirIstem["kip"]>, string> = { tuval: "Tuval", arastirma: "Araştırma", ogrenme: "Öğrenme", gorsel: "Görsel üret" };
type Secim = { baslik: string; metin: string; kip?: HazirIstem["kip"]; kayitli?: KayitliIstemOzeti };

/**
 * İstem kitaplığı (Copilot Prompt Gallery gibi): kategorili hazır istemler ve kayıtlı istemlerim. Değişkenli istemde
 * alanlar küçük bir formla doldurulur, sonra kutuya yazılır. Kendi istemini kaydet: kısayol adıyla "/" menüsüne girer.
 */
export function IstemKitapligi({ acik, kapat, kullan, taslak, istemler, yenile }: {
  acik: boolean; kapat: () => void; kullan: (metin: string, kip?: HazirIstem["kip"]) => void; taslak?: string;
  istemler: KayitliIstemOzeti[]; yenile: () => void;
}) {
  const [sekme, setSekme] = useState<"hazir" | "benim">("hazir");
  const [kategori, setKategori] = useState<IstemKategori | "hepsi">("hepsi");
  const [ara, setAra] = useState("");
  const [secim, setSecim] = useState<Secim | null>(null);
  const [degerler, setDegerler] = useState<Record<string, string>>({});
  const [kayit, setKayit] = useState<{ id?: string; ad: string; baslik: string; metin: string } | null>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setSecim(null); setAra(""); setHata(""); setKayit(null); } }, [acik]);
  const q = ara.trim().toLocaleLowerCase("tr");
  const hazir = useMemo(() => HAZIR_ISTEMLER.filter((x) => (kategori === "hepsi" || x.kategori === kategori) && (!q || `${x.baslik} ${x.metin}`.toLocaleLowerCase("tr").includes(q))), [kategori, q]);
  const benim = istemler.filter((x) => !q || `${x.ad} ${x.baslik} ${x.metin}`.toLocaleLowerCase("tr").includes(q));
  const sec = (x: Secim) => { setSecim(x); setDegerler({}); };
  const al = secim ? alanlar(secim.metin) : [];
  const kaydet = async () => {
    if (!kayit) return;
    setGidiyor(true); setHata("");
    try { await api("/api/build/sohbet/istemler", { govde: kayit }); setKayit(null); setSekme("benim"); yenile(); }
    catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); } finally { setGidiyor(false); }
  };
  const sil = async (id: string) => { await api(`/api/build/sohbet/istemler?id=${id}`, { method: "DELETE" }).catch(() => {}); yenile(); };

  return (
    <SagPanel acik={acik} kapat={kapat} baslik="İstem kitaplığı" alt="Hazır istemler ve kaydettiklerin; / ile de çağrılır" ikon={<BookMarked className="h-[18px] w-[18px]" />} genislik={600}
      alt2={secim ? (
        <>
          <button type="button" onClick={() => setSecim(null)} className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]"><ArrowLeft className="h-4 w-4" />Geri</button>
          <span className="ml-auto" />
          <button type="button" onClick={() => { kullan(doldur(secim.metin, degerler), secim.kip); if (secim.kayitli) api("/api/build/sohbet/istemler", { govde: { id: secim.kayitli.id, kullanildi: true } }).catch(() => {}); kapat(); }} className="h-10 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black">Kutuya yaz</button>
        </>
      ) : kayit ? (
        <>
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
          <span className="ml-auto" />
          <button type="button" onClick={() => setKayit(null)} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button>
          <button type="button" onClick={kaydet} disabled={gidiyor || !kayit.metin.trim() || !kayit.ad.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor && <Loader2 className="h-4 w-4 animate-spin" />}Kaydet</button>
        </>
      ) : (
        <>
          <span className="text-[12.5px] text-white/45">{sekme === "hazir" ? `${HAZIR_ISTEMLER.length} hazır istem` : `${istemler.length} kayıtlı istem`}</span>
          <span className="ml-auto" />
          <button type="button" onClick={() => setKayit({ ad: "", baslik: "", metin: taslak ?? "" })} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni istem</button>
        </>
      )}>
      <AnimatePresence mode="wait" initial={false}>
        {kayit ? (
          <motion.div key="kayit" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
              <label className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"><span className="w-24 shrink-0 text-[13px] text-white/55">Başlık</span><input value={kayit.baslik} onChange={(e) => setKayit({ ...kayit, baslik: e.target.value })} placeholder="Örneğin: Haftalık rapor özeti" maxLength={80} className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" /></label>
              <label className="flex items-center gap-3 px-4 py-3"><span className="w-24 shrink-0 text-[13px] text-white/55">Kısayol</span><span className="text-white/40">/</span><input value={kayit.ad} onChange={(e) => setKayit({ ...kayit, ad: e.target.value.toLocaleLowerCase("tr").replace(/\s+/g, "-") })} placeholder="rapor-ozeti" maxLength={32} className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" /></label>
            </div>
            <textarea value={kayit.metin} onChange={(e) => setKayit({ ...kayit, metin: e.target.value })} rows={9} maxLength={8000} placeholder="İstemin metni. Her seferinde değişecek yerleri {konu} gibi süslü ayraçla yaz; kullanırken sorulur."
              className="w-full resize-y rounded-[16px] bg-white/[0.05] px-4 py-3 text-[14px] leading-relaxed text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/45 focus:ring-white/30" />
            {alanlar(kayit.metin).length > 0 && <p className="text-[12.5px] text-white/50">Doldurulacak alanlar: {alanlar(kayit.metin).map(alanEtiketi).join(", ")}</p>}
          </motion.div>
        ) : secim ? (
          <motion.div key="secim" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2"><p className="text-[16px] font-semibold text-white">{secim.baslik}</p>{secim.kip && <span className="rounded-full bg-[#55d6fd]/[0.12] px-2.5 py-0.5 text-[12px] text-[#8be6ff]">{KIP_AD[secim.kip]}</span>}</div>
            {al.length > 0 && (
              <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
                {al.map((a, i) => (
                  <label key={a} className={cn("flex items-start gap-3 px-4 py-3", i && "border-t border-white/[0.06]")}>
                    <span className="w-28 shrink-0 pt-1 text-[13px] text-white/55">{alanEtiketi(a)}</span>
                    {/^(metin|kod|notlar|hata|giderler|tablolar)$/.test(a)
                      ? <textarea value={degerler[a] ?? ""} onChange={(e) => setDegerler({ ...degerler, [a]: e.target.value })} rows={4} className="min-w-0 flex-1 resize-y bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" placeholder="Buraya yapıştır" />
                      : <input value={degerler[a] ?? ""} onChange={(e) => setDegerler({ ...degerler, [a]: e.target.value })} autoFocus={i === 0} className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" placeholder="Yaz" />}
                  </label>
                ))}
              </div>
            )}
            <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.06]">
              <p className="mb-1 text-[12px] text-white/45">Kutuya yazılacak</p>
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-white/80">{doldur(secim.metin, degerler)}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="liste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <LayoutGroup id="istem-sekme">
                <div className="flex rounded-full bg-white/[0.06] p-0.5">
                  {([["hazir", "Hazır"], ["benim", `Benim istemlerim${istemler.length ? ` ${istemler.length}` : ""}`]] as const).map(([k, a]) => (
                    <button key={k} type="button" onClick={() => setSekme(k)} className={cn("relative h-8 rounded-full px-3.5 text-[13px] font-medium", sekme === k ? "text-black" : "text-white/65 hover:text-white")}>
                      {sekme === k && <motion.span layoutId="istem-z" transition={{ duration: 0.28, ease: "easeOut" }} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{a}</span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>
              <label className="flex h-9 min-w-[160px] flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-3 text-white/45 ring-1 ring-inset ring-white/[0.08]"><Search className="h-3.5 w-3.5" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="İstem ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" /></label>
            </div>
            {sekme === "hazir" ? (
              <>
                <div className="mb-3 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {[{ id: "hepsi" as const, ad: "Hepsi" }, ...ISTEM_KATEGORILERI].map((k) => <button key={k.id} type="button" onClick={() => setKategori(k.id)} className={cn("h-8 shrink-0 rounded-full px-3 text-[12.5px] transition-colors", kategori === k.id ? "bg-white text-black" : "bg-white/[0.05] text-white/70 hover:text-white")}>{k.ad}</button>)}
                </div>
                <div key={kategori} className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
                  {hazir.map((x, i) => (
                    <button key={x.id} type="button" onClick={() => sec({ baslik: x.baslik, metin: x.metin, kip: x.kip })} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]", i && "border-t border-white/[0.05]")}>
                      <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[14px] font-medium text-white">{x.baslik}{x.kip && <span className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5 text-[11px] font-normal text-[#8be6ff]">{KIP_AD[x.kip]}</span>}</span><span className="line-clamp-2 text-[12.5px] text-white/50">{x.metin}</span></span>
                    </button>
                  ))}
                  {!hazir.length && <p className="px-4 py-6 text-center text-[13px] text-white/50">Eşleşen istem yok.</p>}
                </div>
              </>
            ) : benim.length ? (
              <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
                {benim.map((x, i) => (
                  <div key={x.id} className={cn("group flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04]", i && "border-t border-white/[0.05]")}>
                    <button type="button" onClick={() => sec({ baslik: x.baslik, metin: x.metin, kayitli: x })} className="min-w-0 flex-1 text-left"><span className="flex items-center gap-2 text-[14px] font-medium text-white">{x.baslik}<span className="sc-kod rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-normal text-white/60">/{x.ad}</span></span><span className="line-clamp-2 text-[12.5px] text-white/50">{x.metin}</span></button>
                    <button type="button" onClick={() => setKayit({ id: x.id, ad: x.ad, baslik: x.baslik, metin: x.metin })} title="Düzenle" aria-label="Düzenle" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => sil(x.id)} title="Sil" aria-label="Sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><BookMarked className="h-5 w-5" /></span>
                <span className="min-w-[180px] flex-1"><span className="block text-[14px] font-semibold text-white">Henüz kayıtlı istemin yok</span><span className="block text-[12.5px] text-white/55">Sık yazdığın istemleri kaydet, / ile tek tuşla çağır.</span></span>
                <button type="button" onClick={() => setKayit({ ad: "", baslik: "", metin: taslak ?? "" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni istem</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </SagPanel>
  );
}
