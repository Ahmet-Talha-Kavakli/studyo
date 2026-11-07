"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";

type Sonuc = { ad: string; uzanti: string; durum: "bos" | "kayitli" | "bilinmiyor"; kesin: boolean; kaynak: string; firma?: string; bitis?: string; not?: string };
type Firma = { ad: string; adres: string; not?: string };

/**
 * Alan adı bul: uzantılarda uygunluk (RDAP, yoksa DNS). Vayra alan adı satmaz; satın alma kayıt firmasında aranan adla
 * açılır, alınan ad tek tıkla bu projeye bağlanır.
 */
export function AlanAra({ projeId, bagla }: { projeId: string; bagla: (ad: string) => Promise<void> }) {
  const [q, setQ] = useState("");
  const [v, setV] = useState<{ sonuclar: Sonuc[]; firmalar: Firma[]; rdap: boolean } | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [baglaniyor, setBaglaniyor] = useState(false);
  const [hata, setHata] = useState("");
  const ara = async () => {
    setYukleniyor(true); setHata("");
    try { const x = await api<{ sonuclar: Sonuc[]; firmalar: Firma[]; rdap: boolean }>(`/api/build/alanadi/${projeId}?ara=${encodeURIComponent(q.trim())}`); setV(x); setSecili(x.sonuclar.find((s) => s.durum === "bos")?.ad ?? null); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Aranamadı."); } finally { setYukleniyor(false); }
  };
  const firmaAdres = (f: Firma) => (secili ? f.adres.replace(encodeURIComponent(v?.sonuclar.find((s) => s.durum === "bos")?.ad ?? ""), encodeURIComponent(secili)) : f.adres);
  return (
    <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
      <p className="text-[14px] font-semibold text-white">Alan adı bul</p>
      <p className="mt-0.5 text-[12.5px] text-white/50">Boşta olanları gör, kayıt firmasından al, buradan tek tıkla bağla. Vayra alan adı satmaz ve aracılık ücreti almaz.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim().length >= 2) ara(); }} className="mt-3 flex gap-2 max-sm:flex-col">
        <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="markanın adı, ya da kahvecim.com" autoCapitalize="none" spellCheck={false} className="h-10 w-full rounded-[12px] bg-white/[0.05] pl-9 pr-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-[#55d6fd]/60" /></label>
        <button disabled={q.trim().length < 2 || yukleniyor} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black disabled:opacity-35">{yukleniyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Ara</button>
      </form>
      {hata && <p className="mt-2 text-[12.5px] text-rose-300">{hata}</p>}
      {v && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {v.sonuclar.map((s) => (
              <button key={s.ad} type="button" disabled={s.durum === "kayitli"} onClick={() => setSecili(s.ad)} aria-pressed={secili === s.ad}
                className={cn("flex items-center gap-2.5 rounded-[12px] px-3 py-2 text-left ring-inset transition-colors", secili === s.ad ? "bg-white/[0.07] ring-2 ring-white" : "bg-white/[0.02] ring-1 ring-white/[0.07] enabled:hover:bg-white/[0.05]", s.durum === "kayitli" && "opacity-55")}>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", s.durum === "bos" ? (s.kesin ? "bg-emerald-400" : "bg-amber-300") : s.durum === "kayitli" ? "bg-white/30" : "bg-white/15")} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{s.ad}</span><span className="block truncate text-[11.5px] text-white/45">{s.durum === "bos" ? (s.kesin ? "Boşta (kayıt sorgusu)" : "Kayıtlı görünmüyor, kesin değil") : s.durum === "kayitli" ? `Alınmış${s.firma ? `, ${s.firma}` : ""}${s.bitis ? `, ${new Date(s.bitis).toLocaleDateString("tr-TR")} tarihine kadar` : ""}` : "Sorgulanamadı"}</span></span>
              </button>
            ))}
          </div>
          {v.sonuclar.some((s) => !s.kesin && s.durum === "bos") && <p className="text-[11.5px] leading-relaxed text-white/45">{v.sonuclar.find((s) => !s.kesin && s.durum === "bos")?.not}</p>}
          {secili && (
            <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <p className="text-[12.5px] text-white/60"><span className="font-medium text-white">{secili}</span> için kayıt firmaları (fiyat ve yenileme ücreti firmadadır):</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{v.firmalar.filter((f) => !f.not || !/\.tr/.test(f.not) || secili.endsWith(".tr")).map((f) => <a key={f.ad} href={firmaAdres(f)} target="_blank" rel="noopener noreferrer" title={f.not} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/[0.08] hover:text-white">{f.ad}<ExternalLink className="h-3 w-3" /></a>)}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3"><p className="min-w-0 flex-1 text-[12px] text-white/50">Aldıktan sonra bağla: DNS kayıtlarını gösteririz, kontrol kendiliğinden yapılır.</p><button type="button" disabled={baglaniyor} onClick={async () => { setBaglaniyor(true); setHata(""); try { await bagla(secili); setV(null); setQ(""); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Bağlanamadı."); } finally { setBaglaniyor(false); } }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-40">{baglaniyor && <Loader2 className="h-3 w-3 animate-spin" />}Aldım, bağla</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
