"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, FlaskConical, ListChecks, Loader2, Play, Plus, Save, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { AcilirSecim, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { TestKosusu, TestOlcut, TestVakasi } from "@/lib/build/sistemDegerlendir";
import { cn } from "@/lib/utils";
import { YanPanel, sureYaz, type SistemAcik } from "./ortak";

/** Sistem testleri paneli (n8n Evaluations): vakalar, ölçütler, koşu ilerlemesi ve geçmiş. */
const OLCUTLER: { id: TestOlcut; ad: string; alt: string }[] = [
  { id: "basarili", ad: "Hatasız bitsin", alt: "Çalışma başarılı biterse geçer" },
  { id: "iceriyor", ad: "Çıktı şunu içersin", alt: "Beklenen metin çıktıda geçmeli" },
  { id: "esit", ad: "Çıktı tam olarak bu olsun", alt: "Büyük küçük harf ve boşluk önemsiz" },
  { id: "benzerlik", ad: "Beklenene benzesin", alt: "Kelime ve harf benzerliği, eşikle" },
  { id: "yz", ad: "Yapay zekâ yargıcı", alt: "Model beklenen davranışı karşılıyor mu der; kredi harcar" },
];
const kimlik = () => Math.random().toString(36).slice(2, 10);

export function TestPaneli({ acik, kapat, s }: { acik: boolean; kapat: () => void; s: SistemAcik }) {
  const [l, setL] = useState<TestVakasi[] | null>(null);
  const [kosular, setKosular] = useState<TestKosusu[]>([]);
  const [degisti, setDegisti] = useState(false);
  const [gidiyor, setGidiyor] = useState<"" | "kaydet" | "calistir">("");
  const [hata, setHata] = useState("");
  const [acikVaka, setAcikVaka] = useState<string | null>(null);
  const [girdiMetni, setGirdiMetni] = useState<Record<string, string>>({});
  const yukle = () => api<{ testler: TestVakasi[]; kosular: TestKosusu[] }>(`/api/build/sistemler/${s.id}/testler`).then((v) => { setL((x) => (degistiRef.current && x ? x : v.testler)); setKosular(v.kosular); return v; }).catch(() => null);
  const degistiRef = useRef(false);
  degistiRef.current = degisti;
  useEffect(() => { if (acik) { setDegisti(false); setHata(""); setL(null); yukle(); } }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  const suruyor = !!kosular[0] && !kosular[0].bitti;
  useEffect(() => { if (!acik || !suruyor) return; const z = setInterval(yukle, 1500); return () => clearInterval(z); }, [acik, suruyor]); // eslint-disable-line react-hooks/exhaustive-deps
  const d = (id: string, p: Partial<TestVakasi>) => { setL((x) => x?.map((t) => (t.id === id ? { ...t, ...p } : t)) ?? x); setDegisti(true); };
  const ekle = (girdi: unknown = {}) => { const t: TestVakasi = { id: kimlik(), ad: `Test ${(l?.length ?? 0) + 1}`, girdi, olcut: "basarili" }; setL((x) => [...(x ?? []), t]); setAcikVaka(t.id); setDegisti(true); };
  const kaydet = async () => {
    if (!l) return false;
    for (const t of l) { const m = girdiMetni[t.id]; if (m !== undefined) { try { t.girdi = m.trim() ? JSON.parse(m) : {}; } catch { setHata(`${t.ad}: girdi geçerli JSON değil.`); setAcikVaka(t.id); return false; } } }
    setGidiyor("kaydet"); setHata("");
    try { const v = await api<{ testler: TestVakasi[] }>(`/api/build/sistemler/${s.id}/testler`, { govde: { islem: "kaydet", testler: l } }); setL(v.testler); setDegisti(false); setGirdiMetni({}); return true; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); return false; } finally { setGidiyor(""); }
  };
  const calistir = async () => {
    if (degisti && !(await kaydet())) return;
    setGidiyor("calistir"); setHata("");
    try { await api(`/api/build/sistemler/${s.id}/testler`, { govde: { islem: "calistir" } }); await yukle(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Başlatılamadı."); } finally { setGidiyor(""); }
  };
  const son = kosular[0], onceki = kosular.find((k, i) => i > 0 && k.bitti);
  const oran = (k?: TestKosusu) => (k && k.toplam ? Math.round((k.gecen / k.toplam) * 100) : 0);
  const fark = son?.bitti && onceki ? oran(son) - oran(onceki) : null;
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Sistem testleri" alt="Örnek girdilerle taslağı çalıştır, çıktıyı beklenenle karşılaştır" genislik={560}
      alt2={<>
        <button type="button" onClick={calistir} disabled={!!gidiyor || suruyor || !l?.length} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "calistir" || suruyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{suruyor ? `Çalışıyor ${son.sonuclar.length}/${son.toplam}` : "Hepsini çalıştır"}</button>
        {degisti && <button type="button" onClick={kaydet} disabled={!!gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13.5px] text-white hover:bg-white/[0.13]">{gidiyor === "kaydet" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Kaydet</button>}
      </>}>
      <div className="space-y-4">
        {son && (
          <section className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
            <dl className="grid grid-cols-3 gap-3">
              <div><dt className="text-[11.5px] text-white/45">Geçen</dt><dd className="mt-0.5 flex items-baseline gap-1 text-[22px] font-semibold tabular-nums text-white">{son.gecen}<span className="text-[13px] font-normal text-white/45">/ {son.toplam}</span></dd></div>
              <div><dt className="text-[11.5px] text-white/45">Ortalama puan</dt><dd className="mt-0.5 text-[22px] font-semibold tabular-nums text-white">{son.ortalama}</dd></div>
              <div><dt className="text-[11.5px] text-white/45">Önceki koşuya göre</dt><dd className={cn("mt-1.5 flex items-center gap-1 text-[13.5px] font-medium", fark === null ? "text-white/45" : fark >= 0 ? "text-emerald-300" : "text-rose-300")}>{fark === null ? (son.bitti ? "İlk koşu" : "Sürüyor") : <>{fark >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{fark === 0 ? "Aynı" : `${Math.abs(fark)} puan ${fark > 0 ? "iyi" : "kötü"}`}</>}</dd></div>
            </dl>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={false} animate={{ width: `${son.toplam ? (son.sonuclar.length / son.toplam) * 100 : 0}%` }} className={cn("h-full rounded-full", son.bitti ? (son.gecen === son.toplam ? "bg-emerald-400" : "bg-amber-300") : "bg-[#55d6fd]")} /></div>
            <p className="mt-2 text-[11.5px] text-white/40">{gorece(son.zaman)}{son.kredi ? ` · ${son.kredi} kredi` : ""}</p>
          </section>
        )}
        {hata && <p className="rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/15">{hata}</p>}
        <section className="space-y-2">
          <div className="flex items-center gap-2"><p className="flex-1 text-[13.5px] font-semibold text-white">Vakalar{l ? ` ${l.length}` : ""}</p>
            <button type="button" onClick={() => ekle(s.test?.sabitTetik ?? s.test?.tetik ?? s.test?.sonTetik ?? {})} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.1]"><FlaskConical className="h-3.5 w-3.5" />Deneme verisinden</button>
            <button type="button" onClick={() => ekle()} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Vaka ekle</button>
          </div>
          {l === null ? <div className="h-24 animate-pulse rounded-[16px] bg-white/[0.03]" /> : !l.length ? (
            <div className="flex items-start gap-3 rounded-[16px] bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/60"><ListChecks className="h-4 w-4" /></span>
              <p className="text-[12.5px] leading-relaxed text-white/55">Her vaka bir örnek tetik verisi ve beklenen sonuçtur. Değişiklik yaptıktan sonra hepsini çalıştır; bozulan davranışı yayından önce yakala. Testler taslağı çalıştırır, kayıt adımları gerçekten yazar.</p>
            </div>
          ) : l.map((t) => {
            const r = son?.sonuclar.find((x) => x.testId === t.id);
            const ac = acikVaka === t.id;
            return (
              <motion.div key={t.id} layout className="overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button type="button" onClick={() => setAcikVaka(ac ? null : t.id)} aria-label="Ayrıntı" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07]"><ChevronRight className={cn("h-4 w-4 transition-transform", ac && "rotate-90")} /></button>
                  <input value={t.ad} onChange={(e) => d(t.id, { ad: e.target.value.slice(0, 80) })} aria-label="Vaka adı" className="h-8 min-w-0 flex-1 rounded-[10px] bg-transparent px-1.5 text-[13.5px] font-medium text-white outline-none hover:bg-white/[0.04] focus:bg-white/[0.06]" />
                  {r ? <span title={r.neden} className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium", r.gecti ? "bg-emerald-400/[0.12] text-emerald-200" : "bg-rose-500/[0.12] text-rose-200")}>{r.gecti ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}{r.gecti ? "Geçti" : "Kaldı"} · {r.puan}</span>
                    : suruyor && son?.sonuclar.length !== undefined ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-white/40" /> : null}
                  <button type="button" onClick={() => { setL((x) => x?.filter((y) => y.id !== t.id) ?? x); setDegisti(true); }} aria-label="Vakayı sil" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <AnimatePresence initial={false}>
                  {ac && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="space-y-2.5 border-t border-white/[0.05] px-3.5 py-3">
                        <label className="block"><span className="mb-1 block text-[11.5px] text-white/50">Tetik verisi (JSON)</span>
                          <textarea value={girdiMetni[t.id] ?? JSON.stringify(t.girdi ?? {}, null, 2)} onChange={(e) => { setGirdiMetni((x) => ({ ...x, [t.id]: e.target.value })); setDegisti(true); }} rows={5} spellCheck={false} className={cn(alanSinif, "sc-kod resize-y bg-[#0c0d0f] py-2 text-[12px]")} /></label>
                        <label className="block"><span className="mb-1 block text-[11.5px] text-white/50">Ölçüt</span><AcilirSecim deger={t.olcut} set={(v) => d(t.id, { olcut: v as TestOlcut })} l={OLCUTLER} /></label>
                        {t.olcut !== "basarili" && <label className="block"><span className="mb-1 block text-[11.5px] text-white/50">{t.olcut === "yz" ? "Beklenen davranış" : "Beklenen çıktı"}</span><textarea value={t.beklenen ?? ""} onChange={(e) => d(t.id, { beklenen: e.target.value })} rows={2} placeholder={t.olcut === "yz" ? "Kibar olmalı, sipariş numarasını sormalı" : "Teşekkürler"} className={cn(alanSinif, "resize-y py-2 text-[13px]")} /></label>}
                        {t.olcut === "benzerlik" && <label className="flex items-center gap-2 text-[12px] text-white/60">Geçme eşiği<input type="number" min={1} max={100} value={t.esik ?? 70} onChange={(e) => d(t.id, { esik: Math.max(1, Math.min(100, Number(e.target.value) || 70)) })} className={cn(alanSinif, "h-9 w-20")} /></label>}
                        {r && (
                          <div className={cn("rounded-[12px] px-3 py-2 text-[12px] leading-relaxed ring-1 ring-inset", r.gecti ? "bg-emerald-400/[0.05] ring-emerald-300/15" : "bg-rose-500/[0.06] ring-rose-400/15")}>
                            <p className="flex items-center gap-2 text-white/70"><span className="flex-1">Son çıktı · {sureYaz(r.sure)}</span>{r.calisma && <Link href={`/panel/build/sistemler/${s.id}/calisma/${r.calisma}`} className="text-[#8be6ff] hover:underline">Çalışmayı aç</Link>}</p>
                            <p className="mt-1 line-clamp-4 whitespace-pre-wrap break-words text-white/85">{r.cikti || "Çıktı yok"}</p>
                            {r.neden && <p className="mt-1 text-white/55">{r.neden}</p>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </section>
        {kosular.filter((k) => k.bitti).length > 1 && (
          <section className="space-y-2">
            <p className="text-[13.5px] font-semibold text-white">Geçmiş koşular</p>
            <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
              {kosular.filter((k) => k.bitti).map((k) => (
                <div key={k.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="w-24 shrink-0 text-[12px] text-white/50">{gorece(k.zaman)}</span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><span className={cn("block h-full rounded-full", k.gecen === k.toplam ? "bg-emerald-400" : "bg-amber-300")} style={{ width: `${oran(k)}%` }} /></span>
                  <span className="shrink-0 text-[12px] tabular-nums text-white/70">{k.gecen}/{k.toplam} · {k.ortalama} puan</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </YanPanel>
  );
}
