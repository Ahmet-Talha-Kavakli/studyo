"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Gamepad2, Globe, LayoutDashboard, Loader2, MessageSquare, Plus, Search, Smartphone } from "lucide-react";
import { SaglayiciLogo } from "@/components/build/ModelSecici";
import { useStudyo } from "@/components/build/kabuk/useStudyo";
import { api, gorece } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { tarihGrubu, TARIH_GRUPLARI } from "@/lib/build/sohbetYol";
import { cn } from "@/lib/utils";
import { SagPanel } from "./ortak";
import type { SohbetOzet } from "./tipler";

const TUR_IKON = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone } as const;
type Satir = { id: string; href: string; baslik: string; alt: string; zaman?: number; ikon: React.ReactNode; grup: string };

/** Ctrl K araması (sağdan panel): sohbetlerde başlık ve içerik, projelerde ad; boşken son sohbetler tarih gruplarıyla. */
export function AramaPaneli({ acik, kapat }: { acik: boolean; kapat: () => void }) {
  const router = useRouter();
  const projeler = useStudyo((s) => s.projeler);
  const [q, setQ] = useState("");
  const [son, setSon] = useState<SohbetOzet[]>([]);
  const [sonuc, setSonuc] = useState<SohbetOzet[] | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sira, setSira] = useState(0);
  const liste = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!acik) return; setQ(""); setSonuc(null); setSira(0); api<{ sohbetler: SohbetOzet[] }>("/api/build/sohbet").then((v) => setSon(v.sohbetler)).catch(() => {}); }, [acik]);
  useEffect(() => {
    const t = q.trim();
    if (!t) { setSonuc(null); return; }
    setYukleniyor(true);
    const z = setTimeout(() => api<{ sonuclar: SohbetOzet[] }>(`/api/build/sohbet/ara?q=${encodeURIComponent(t)}`).then((v) => { setSonuc(v.sonuclar); setSira(0); }).catch(() => setSonuc([])).finally(() => setYukleniyor(false)), 180);
    return () => clearTimeout(z);
  }, [q]);
  const satirlar = useMemo<Satir[]>(() => {
    const sohbet = (o: SohbetOzet, grup: string): Satir => ({ id: o.id, href: `/panel/build/sohbet/${o.id}`, baslik: o.baslik, alt: o.parca ?? o.ozet, zaman: o.guncelleme, grup, ikon: <SaglayiciLogo m={modelBul(o.model)} boyut={16} /> });
    const t = q.trim().toLocaleLowerCase("tr");
    if (t) {
      const p = (projeler ?? []).filter((x) => x.ad.toLocaleLowerCase("tr").includes(t)).slice(0, 5).map((x): Satir => { const I = TUR_IKON[x.tur] ?? FolderOpen; return { id: `p-${x.id}`, href: `/panel/build/${x.id}`, baslik: x.ad, alt: "Build projesi", zaman: x.guncelleme, grup: "Projeler", ikon: <I className="h-4 w-4 text-white/70" /> }; });
      return [...(sonuc ?? []).map((o) => sohbet(o, "Sohbetler")), ...p];
    }
    const o: Satir[] = son.filter((x) => x.sabit).map((x) => sohbet(x, "Sabitlenenler"));
    for (const g of TARIH_GRUPLARI) o.push(...son.filter((x) => !x.sabit && tarihGrubu(x.guncelleme) === g).slice(0, 12).map((x) => sohbet(x, g)));
    return o;
  }, [q, sonuc, son, projeler]);
  const git = (s?: Satir) => { if (!s) return; kapat(); router.push(s.href); };
  useEffect(() => { liste.current?.querySelector(`[data-sira="${sira}"]`)?.scrollIntoView({ block: "nearest" }); }, [sira]);
  let onceki = "";
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Ara" alt="Sohbetlerin başlıkları ve mesajları, projelerin" ikon={<Search className="h-[18px] w-[18px]" />} genislik={600}>
      <div className="-mt-1 mb-3 flex h-12 items-center gap-2.5 rounded-[16px] bg-white/[0.05] px-4 ring-1 ring-inset ring-white/[0.1] focus-within:ring-white/30">
        {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin text-white/50" /> : <Search className="h-4 w-4 text-white/50" />}
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ne arıyorsun?"
          onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setSira((i) => Math.min(satirlar.length - 1, i + 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setSira((i) => Math.max(0, i - 1)); } else if (e.key === "Enter") { e.preventDefault(); git(satirlar[sira]); } }}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/40" />
      </div>
      <button type="button" onClick={() => { kapat(); router.push("/panel/build/sohbet/yeni"); }} className="mb-2 flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[14px] text-white/85 hover:bg-white/[0.05]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black"><Plus className="h-4 w-4" /></span>Yeni sohbet
      </button>
      <div ref={liste}>
        {satirlar.map((s, i) => {
          const baslik = s.grup !== onceki ? s.grup : null;
          onceki = s.grup;
          return (
            <div key={s.id}>
              {baslik && <p className="px-3 pb-1 pt-3 text-[12px] font-medium text-white/45">{baslik}</p>}
              <button type="button" data-sira={i} onMouseEnter={() => setSira(i)} onClick={() => git(s)}
                className={cn("flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left", i === sira ? "bg-white/[0.07] ring-1 ring-inset ring-white/60" : "hover:bg-white/[0.04]")}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]">{s.ikon}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{s.baslik}</span>{s.alt && <span className="block truncate text-[12px] text-white/45">{s.alt}</span>}</span>
                {s.zaman && <span className="shrink-0 text-[11.5px] text-white/40">{gorece(s.zaman)}</span>}
              </button>
            </div>
          );
        })}
        {!satirlar.length && <p className="flex items-center gap-2 px-3 py-6 text-[13.5px] text-white/50"><MessageSquare className="h-4 w-4" />{q.trim() ? (yukleniyor ? "Aranıyor" : `"${q.trim()}" için sonuç yok.`) : "Henüz sohbet yok."}</p>}
      </div>
    </SagPanel>
  );
}
