"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, RotateCw } from "lucide-react";
import { api, ApiHatasi } from "@/lib/build/istemci";

/**
 * Yan yana kıyasın sol yarısı: içe aktarılan orijinal site. Sayfa sunucuda okunur ve betiksiz kum havuzunda
 * gösterilir (çerçeveye girmeyi engelleyen siteler de görünür). Ölçü ve ölçek sağdaki önizlemeyle aynıdır.
 */
export function KaynakKiyas({ projeId, genislik, yukseklik, oran }: { projeId: string; genislik: number | null; yukseklik: number | null; oran: number }) {
  const [v, setV] = useState<{ url: string; html: string } | null>(null);
  const [hata, setHata] = useState("");
  const [n, setN] = useState(0);
  useEffect(() => {
    setV(null); setHata("");
    api<{ url: string; html: string }>(`/api/build/proje/${projeId}/kaynak${n ? "?tazele=1" : ""}`).then(setV).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Orijinal site okunamadı."));
  }, [projeId, n]);
  const alan = (
    <div className="relative h-full w-full bg-white">
      {v ? <iframe title="Orijinal site" srcDoc={v.html} sandbox="" referrerPolicy="no-referrer" className="h-full w-full border-0 bg-white" />
        : <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#141518] px-6 text-center">{hata ? <><p className="text-[13px] text-rose-200">{hata}</p><button type="button" onClick={() => setN((x) => x + 1)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white"><RotateCw className="h-3.5 w-3.5" />Yeniden dene</button></> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>}
    </div>
  );
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center">
      <div className="mb-2 flex h-7 w-full max-w-full items-center gap-2 px-1 text-[12px] text-white/55">
        <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] font-medium text-white/80">Orijinal</span>
        <span className="min-w-0 flex-1 truncate">{v?.url ?? ""}</span>
        {v && <a href={v.url} target="_blank" rel="noopener noreferrer" title="Yeni sekmede aç" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>}
      </div>
      {genislik && yukseklik ? (
        <div className="relative overflow-hidden rounded-[18px] ring-1 ring-white/10" style={{ width: Math.round(genislik * oran), height: Math.round(yukseklik * oran) }}>
          <div style={{ width: genislik, height: yukseklik, transform: `scale(${oran})`, transformOrigin: "0 0" }}>{alan}</div>
        </div>
      ) : <div className="min-h-0 w-full flex-1 overflow-hidden rounded-[14px] ring-1 ring-white/10">{alan}</div>}
    </div>
  );
}
