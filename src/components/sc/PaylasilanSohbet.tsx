"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Globe, ImageIcon, Link2, MessageSquarePlus, Quote, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSupercomputer } from "@/store/useSupercomputer";
import type { ScPaylasim } from "@/lib/scPaylasim";
import { Markdown, alanAdi, favikon } from "./sohbet/Markdown";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";

const tarih = (z: number) => new Date(z).toLocaleDateString("tr", { day: "numeric", month: "long", year: "numeric" });

/** Paylaşılan sohbetin salt okunur görünümü; "Sohbeti sürdür" kopyayı okuyanın kendi sohbetlerine ekler. */
export function PaylasilanSohbet({ k }: { k: ScPaylasim }) {
  const router = useRouter();
  const [tam, setTam] = useState<string | null>(null);

  const surdur = () => {
    const sc = useSupercomputer.getState();
    const id = sc.sohbetAc(k.baslik);
    for (const m of k.mesajlar) {
      sc.mesajEkle(id, {
        rol: m.rol === "kullanici" ? "kullanici" : "ajan", metin: m.metin, ...(m.alinti ? { alinti: m.alinti } : {}),
        ...(m.ciktilar?.length ? { ciktilar: m.ciktilar.map((c, i) => ({ id: `pay_${k.id}_${i}_${Math.random().toString(36).slice(2, 6)}`, tur: c.tur as "site", ad: c.ad, url: c.url, html: c.html, durum: "tamam" as const })) } : {}),
      });
    }
    router.push(`/panel/supercomputer/${id}`);
  };

  return (
    <div className="sc-kapsam min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[var(--sc-zemin)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[860px] items-center gap-3 px-5 max-sm:px-4">
          <Link href="/" className="flex items-center gap-2"><VayraIsaret size={22} /><span className="text-[15px] font-semibold max-sm:hidden">Usta</span></Link>
          <span className="h-4 w-px bg-white/[0.12] max-sm:hidden" />
          <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--sc-metin-2)]">{k.baslik}</span>
          <button onClick={() => { void navigator.clipboard.writeText(location.href); toast.success("Bağlantı kopyalandı"); }} aria-label="Bağlantıyı kopyala"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Link2 className="h-4 w-4" /><span className="max-sm:hidden">Kopyala</span></button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[780px] px-5 pb-40 pt-8 max-sm:px-4">
        <div className="mb-8 border-b border-white/[0.06] pb-6">
          <h1 className="text-[26px] font-normal leading-tight tracking-[-0.02em] max-sm:text-[22px]">{k.baslik}</h1>
          <p className="mt-2 text-[13px] text-[var(--sc-metin-3)]">Paylaşılan sohbet · {tarih(k.guncelleme)} · Paylaşıldığı andaki salt okunur kopya</p>
        </div>

        <div className="space-y-7">
          {k.mesajlar.map((m, i) => m.rol === "kullanici" ? (
            <div key={i} className="flex flex-col items-end">
              {m.alinti && <div className="mb-1.5 flex max-w-[560px] items-start gap-2 px-3 text-[13px] leading-relaxed text-[var(--sc-metin-3)]"><Quote className="mt-1 h-3 w-3 shrink-0" /><p className="line-clamp-3">{m.alinti}</p></div>}
              <div className="max-w-[640px] whitespace-pre-wrap break-words rounded-[20px] bg-[#1c1c1f] px-4 py-2.5 text-[15.5px] leading-relaxed">{m.metin}</div>
            </div>
          ) : (
            <div key={i}>
              {m.demo && <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-300/15 px-2.5 py-1 text-[12px] font-medium text-amber-200">Örnek yanıt · model bağlı değilken üretilmiş örnek</p>}
              {m.metin && <Markdown metin={m.metin} kaynaklar={m.kaynaklar} />}
              {!!m.ciktilar?.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.ciktilar.map((c, j) => c.html ? (
                    <button key={j} onClick={() => setTam(c.html!)} className="group flex w-full max-w-[460px] items-center gap-3 rounded-[16px] bg-white/[0.035] p-2.5 pr-3 text-left ring-1 ring-inset ring-white/[0.09] hover:bg-white/[0.06]">
                      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[10px] bg-white"><iframe srcDoc={c.html.replace(/<script[\s\S]*?<\/script>/gi, "")} title="" tabIndex={-1} aria-hidden sandbox="" className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] border-0" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{c.ad}</span><span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[var(--sc-metin-2)]"><Globe className="h-3.5 w-3.5" />Canlı önizleme</span></span>
                      <span className="flex h-8 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium">Aç<ExternalLink className="h-3.5 w-3.5" /></span>
                    </button>
                  ) : c.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={j} src={c.url} alt={c.ad} className="w-[260px] rounded-[16px] ring-1 ring-inset ring-white/[0.1]" />
                  ) : (
                    <span key={j} className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] px-3 py-2 text-[13px] text-[var(--sc-metin-2)]"><ImageIcon className="h-4 w-4" />{c.ad}</span>
                  ))}
                </div>
              )}
              {!!m.kaynaklar?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.kaynaklar.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" title={s.baslik} className="flex h-7 max-w-[220px] items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.08] hover:text-[var(--sc-metin)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={favikon(s.url)} alt="" className="h-3.5 w-3.5 rounded-sm" /><span className="truncate">{alanAdi(s.url)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--sc-zemin)] via-[var(--sc-zemin)]/95 to-transparent pb-5 pt-10">
        <div className="mx-auto flex w-full max-w-[780px] items-center gap-3 px-5 max-sm:px-4">
          <button onClick={surdur} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--sc-metin)] text-[15px] font-semibold text-[#111113] hover:bg-white">
            <MessageSquarePlus className="h-[18px] w-[18px]" />Bu sohbeti Usta&apos;da sürdür
          </button>
        </div>
      </div>

      {tam && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Çıktı önizlemesi">
          <div className="mb-2 flex justify-end"><button onClick={() => setTam(null)} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button></div>
          <iframe srcDoc={tam} title="Önizleme" sandbox="allow-scripts" className="min-h-0 flex-1 rounded-[14px] border-0 bg-white" />
        </div>
      )}
    </div>
  );
}
