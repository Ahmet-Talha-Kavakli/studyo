"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { api } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { etkinYol } from "@/lib/build/sohbetYol";
import { matematikHazirla } from "./Metin";
import type { Mesaj, Sohbet } from "./tipler";

const metinOf = (m: Mesaj) => (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").trim() || m.kurul?.sentez || "";
const ekler = (m: Mesaj) => (m.parcalar ?? []).flatMap((p) => (p.tur === "arac" && p.sonuc ? [p.sonuc.tur === "dosya" ? `Dosya: ${p.sonuc.dosya.ad}` : p.sonuc.tur === "tuval" ? `Tuval: ${p.sonuc.baslik}` : p.sonuc.tur === "gorsellestirme" ? `Görselleştirme: ${p.sonuc.baslik}` : p.sonuc.tur === "test" ? `Test: ${p.sonuc.baslik}` : ""] : [])).filter(Boolean);

/**
 * Sohbetin yazdırma sayfası (PDF olarak dışa aktarma): görünen dal, beyaz kâğıt düzeninde. Açılınca yazdırma penceresi
 * kendiliğinden gelir; tarayıcının "PDF olarak kaydet" seçeneğiyle dosya olur. Yazdırırken yalnız kâğıt basılır.
 */
export function YazdirSayfasi({ id }: { id: string }) {
  const [s, setS] = useState<Sohbet | null>(null);
  const [hata, setHata] = useState("");
  useEffect(() => { api<{ sohbet: Sohbet }>(`/api/build/sohbet/${id}`).then((v) => setS(v.sohbet)).catch((e) => setHata(e instanceof Error ? e.message : "Sohbet açılamadı.")); }, [id]);
  useEffect(() => { if (!s) return; const t = setTimeout(() => window.print(), 700); return () => clearTimeout(t); }, [s]);
  const yol = s ? etkinYol(s.mesajlar, s.secim) : [];
  return (
    <div className="min-h-screen px-4 pb-16 pt-16 md:pt-8">
      <style>{`@media print { body * { visibility: hidden !important; } #vayra-yazdir, #vayra-yazdir * { visibility: visible !important; } #vayra-yazdir { position: absolute; inset: 0 auto auto 0; width: 100%; box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; } @page { margin: 18mm; } }`}</style>
      <div className="mx-auto mb-4 flex max-w-[820px] items-center gap-2 print:hidden">
        <Link href={`/panel/build/sohbet/${id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white hover:bg-white/[0.12]"><ArrowLeft className="h-4 w-4" />Sohbete dön</Link>
        <span className="text-[13px] text-white/50 max-sm:hidden">Yazdırma penceresinde hedef olarak &quot;PDF olarak kaydet&quot;i seç.</span>
        <button type="button" onClick={() => window.print()} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Printer className="h-4 w-4" />Yazdır ya da PDF kaydet</button>
      </div>
      {hata ? <p className="text-center text-[14px] text-rose-300">{hata}</p> : !s ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div> : (
        <article id="vayra-yazdir" className="mx-auto max-w-[820px] rounded-[18px] bg-white px-10 py-10 text-[#16181d] max-sm:px-5">
          <header className="mb-8 border-b border-black/10 pb-5">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{s.baslik}</h1>
            <p className="mt-1 text-[13px] text-black/50">Vayra sohbeti · {new Date(s.guncelleme ?? Date.now()).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} · {yol.length} mesaj</p>
          </header>
          <div className="space-y-6">
            {yol.map((m) => {
              const t = m.rol === "kullanici" ? m.metin ?? "" : metinOf(m);
              const ek = m.rol === "kullanici" ? (m.ekler ?? []).map((e) => `Ek: ${e.ad}`) : ekler(m);
              if (!t && !ek.length) return null;
              return (
                <section key={m.id} className="break-inside-avoid-page">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#0b7ea8]">{m.rol === "kullanici" ? (m.istek?.gorev ? `Zamanlanmış görev: ${m.istek.gorev.ad}` : "Sen") : `Vayra${m.model ? ` · ${modelBul(m.model).ad}` : ""}`}</p>
                  {m.rol === "kullanici" ? <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{t}</p> : (
                    <div className="text-[14.5px] leading-[1.7] [&_a]:text-[#0a66c2] [&_blockquote]:border-l-2 [&_blockquote]:border-[#55d6fd] [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-black/[0.05] [&_code]:px-1 [&_h1]:mt-4 [&_h1]:text-[20px] [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-[17px] [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:my-2 [&_pre]:whitespace-pre-wrap [&_pre]:rounded-[8px] [&_pre]:bg-black/[0.04] [&_pre]:p-3 [&_pre]:text-[12.5px] [&_table]:my-2 [&_table]:w-full [&_td]:border [&_td]:border-black/15 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-black/15 [&_th]:bg-black/[0.03] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore", output: "html" }]]}>{matematikHazirla(t)}</ReactMarkdown>
                    </div>
                  )}
                  {ek.length > 0 && <ul className="mt-1.5 text-[12.5px] text-black/55">{ek.map((x) => <li key={x}>{x}</li>)}</ul>}
                </section>
              );
            })}
          </div>
        </article>
      )}
    </div>
  );
}
