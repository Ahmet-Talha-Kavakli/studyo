"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, KeyRound, Loader2, Lock, Unplug } from "lucide-react";
import { Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import type { ProjeKanca } from "./useProje";

type Durum = { bagli: boolean; kullanici: string | null; avatar: string | null; depo: string | null; dal: string | null; ozel: boolean; son: { sha: string; url: string; zaman: number; yon: "gonder" | "cek"; surumNo: number } | null };

/** Ayarlar > GitHub: hesabı bağla (kişisel erişim anahtarı), depo seç ya da oluştur, gönder ve çek. */
export function GitHubBolumu({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const [d, setD] = useState<Durum | null>(null);
  const [anahtar, setAnahtar] = useState("");
  const [depoAd, setDepoAd] = useState(p.ayarlar.altAlan);
  const [ozel, setOzel] = useState(true);
  const [mesaj, setMesaj] = useState("");
  const [is, setIs] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const getir = useCallback(() => api<Durum>(`/api/build/github/${p.id}`).then(setD).catch(() => setD({ bagli: false, kullanici: null, avatar: null, depo: null, dal: null, ozel: true, son: null })), [p.id]);
  useEffect(() => { getir(); }, [getir]);
  const islem = async (ad: string, govde: Record<string, unknown>, sonra?: (v: Record<string, unknown>) => void) => {
    setIs(ad); setHata(""); setBilgi("");
    try { const v = await api<Record<string, unknown>>(`/api/build/github/${p.id}`, { govde }); sonra?.(v); await getir(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Olmadı."); }
    finally { setIs(null); }
  };
  if (!d) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;
  const yayinlanmamis = d.son && d.son.yon === "gonder" ? (p.surumler.at(-1)?.no ?? 0) - d.son.surumNo : null;

  return (
    <div className="overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marka/baglanti/github_dark.svg" alt="GitHub" className="h-9 w-9 shrink-0 rounded-[11px] bg-white p-1.5" />
        <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">GitHub</p><p className="truncate text-[12.5px] text-white/50">{d.bagli ? `${d.kullanici} hesabı bağlı${d.depo ? ` · ${d.depo}` : ""}` : "Kodu kendi deponda tut, başka araçlarla birlikte çalış"}</p></div>
        {d.bagli && <button type="button" onClick={() => islem("kes", { islem: "kes" })} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/55 hover:bg-white/[0.06] hover:text-rose-200"><Unplug className="h-3.5 w-3.5" />Bağlantıyı kes</button>}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {!d.bagli ? (
          <form onSubmit={(e) => { e.preventDefault(); islem("baglan", { islem: "baglan", anahtar }, () => setAnahtar("")); }} className="space-y-3">
            <p className="text-[13px] leading-relaxed text-white/60">GitHub&apos;da Settings, Developer settings ve Personal access tokens yolunu izleyip bu depo için <span className="text-white/85">Contents: Read and write</span> ve <span className="text-white/85">Administration: Read and write</span> izinli bir anahtar oluştur ve buraya yapıştır. Anahtar şifreli saklanır, sitede görünmez.</p>
            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-[240px] flex-1"><KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" /><input type="password" value={anahtar} onChange={(e) => setAnahtar(e.target.value)} placeholder="github_pat_..." className={cn(alanSinif, "h-11 pl-10 font-mono text-[13px]")} /></label>
              <button disabled={!anahtar.trim() || !!is} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-40">{is === "baglan" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bağla</button>
            </div>
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-[#8be6ff] hover:underline">Yeni anahtar oluştur<ExternalLink className="h-3 w-3" /></a>
          </form>
        ) : !d.depo ? (
          <form onSubmit={(e) => { e.preventDefault(); islem("depo", { islem: "depo", ad: depoAd, ozel }); }} className="space-y-3">
            <p className="text-[13px] text-white/60">Projeyi bağlayacağın depo. Yoksa {d.kullanici} hesabında oluşturulur.</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-white/45">{d.kullanici} /</span>
              <input value={depoAd} onChange={(e) => setDepoAd(e.target.value.replace(/[^A-Za-z0-9._-]/g, ""))} className={cn(alanSinif, "h-11 min-w-[200px] flex-1")} />
              <button disabled={!depoAd || !!is} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-40">{is === "depo" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Depoyu bağla</button>
            </div>
            <label className="flex items-center gap-3 text-[13px] text-white/75"><Anahtar acik={ozel} set={setOzel} etiket="Gizli depo" /><Lock className="h-3.5 w-3.5 text-white/45" />Gizli depo olarak oluştur</label>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-[16px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.06]">
              <a href={`https://github.com/${d.depo}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1.5 text-[13.5px] font-medium text-white hover:underline"><span className="truncate">{d.depo}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/45" /></a>
              <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/60">{d.dal}</span>
              {d.ozel && <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/60"><Lock className="h-3 w-3" />Gizli</span>}
              <span className="flex-1" />
              {d.son && <a href={d.son.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-white/50 hover:text-white">{d.son.yon === "gonder" ? "Son gönderim" : "Son çekme"} {gorece(d.son.zaman)} · <span className="font-mono">{d.son.sha.slice(0, 7)}</span></a>}
            </div>
            {yayinlanmamis !== null && yayinlanmamis > 0 && <p className="text-[12.5px] text-amber-200/85">Son gönderimden bu yana {yayinlanmamis} yeni sürüm var.</p>}
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2 rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.07]">
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-white"><ArrowUpFromLine className="h-4 w-4 text-[#8be6ff]" />Depoya gönder</p>
                <p className="text-[12.5px] leading-relaxed text-white/50">Projenin son sürümü tek bir commit olarak gönderilir; depo projeyle birebir aynı olur.</p>
                <input value={mesaj} onChange={(e) => setMesaj(e.target.value)} placeholder={`Vayra Build: sürüm ${p.surumler.at(-1)?.no ?? 1}`} className={cn(alanSinif, "h-10 text-[13px]")} />
                <button type="button" disabled={!!is} onClick={() => islem("gonder", { islem: "gonder", mesaj }, (v) => { setMesaj(""); setBilgi(`Gönderildi: ${String(v.sha).slice(0, 7)}`); })} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black disabled:opacity-40">{is === "gonder" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}Gönder</button>
              </div>
              <div className="space-y-2 rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.07]">
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-white"><ArrowDownToLine className="h-4 w-4 text-[#8be6ff]" />Depodan çek</p>
                <p className="text-[12.5px] leading-relaxed text-white/50">Depoda başka yerde yapılan değişiklikler yeni bir sürüm olarak gelir; eski sürüme her zaman Geçmiş&apos;ten dönebilirsin.</p>
                <button type="button" disabled={!!is} onClick={() => islem("cek", { islem: "cek" }, (v) => { setBilgi(Number(v.degisen) ? `${v.degisen} dosya değişti, yeni sürüm oluştu.` : "Depo projeyle zaten aynı."); k.yukle(); })} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12] disabled:opacity-40">{is === "cek" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}Çek</button>
              </div>
            </div>
          </>
        )}
        {hata && <p className="rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/20">{hata}</p>}
        {bilgi && <p className="rounded-[14px] bg-[#55d6fd]/[0.08] px-3.5 py-2.5 text-[12.5px] text-[#a8ecff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}
      </div>
    </div>
  );
}
