"use client";

import { useState } from "react";
import { Search, Plus, Check, PersonStanding } from "lucide-react";
import { toast } from "@/lib/toast";
import { ANIMASYONLAR, ANIMASYON_KATEGORILERI } from "@/lib/uc-boyut";
import { cn } from "@/lib/utils";

/**
 * Canlandır modu sol paneli — Meshy birebir: arama + Kütüphane/Eklendi sekmesi
 * + kategori filtresi + animasyon preset grid'i (hover'da + Ekle).
 */
export function AnimasyonPaneli({
  eklenenler, onEkle,
}: {
  eklenenler: string[];
  onEkle: (ad: string) => void;
}) {
  const [sekme, setSekme] = useState<"kutuphane" | "eklendi">("kutuphane");
  const [kategori, setKategori] = useState("hepsi");
  const [ara, setAra] = useState("");
  const [yerinde, setYerinde] = useState(false);

  const liste = (sekme === "eklendi"
    ? ANIMASYONLAR.filter((a) => eklenenler.includes(a.ad))
    : ANIMASYONLAR
  ).filter((a) =>
    (kategori === "hepsi" || a.kategori === kategori) &&
    (!ara || a.ad.toLowerCase().includes(ara.toLowerCase()))
  );

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-white/[0.06] bg-yuzey">
      <div className="space-y-3 border-b border-white/[0.06] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-metin-3" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Animasyon ara"
            className="glass-cip w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none placeholder:text-metin-3" />
        </div>
        <div className="flex items-center gap-2">
          <div className="glass-cip flex flex-1 gap-1 rounded-lg p-0.5">
            {[["kutuphane", "Kütüphane"], ["eklendi", `Eklendi${eklenenler.length ? ` (${eklenenler.length})` : ""}`]].map(([id, ad]) => (
              <button key={id} onClick={() => setSekme(id as "kutuphane" | "eklendi")}
                className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                  sekme === id ? "glass-cip-aktif text-aksan" : "text-metin-2")}>{ad}</button>
            ))}
          </div>
          <button onClick={() => setYerinde((v) => !v)} title="Yerinde (in-place)"
            className={cn("rounded-lg px-2 py-1.5 text-xs transition-colors", yerinde ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2")}>
            Yerinde
          </button>
        </div>
        {/* Kategori chip'leri */}
        <div className="flex flex-wrap gap-1.5">
          {ANIMASYON_KATEGORILERI.map((k) => {
            const say = k.id === "hepsi" ? ANIMASYONLAR.length : ANIMASYONLAR.filter((a) => a.kategori === k.id).length;
            return (
              <button key={k.id} onClick={() => setKategori(k.id)}
                className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  kategori === k.id ? "glass-cip-aktif text-aksan" : "glass-cip text-metin-2 hover:text-white")}>
                {k.ad} <span className="opacity-60">{say}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        {liste.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PersonStanding className="h-8 w-8 text-metin-3" />
            <p className="mt-2 text-xs text-metin-3">
              {sekme === "eklendi" ? "Henüz animasyon eklemedin." : "Sonuç yok."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {liste.map((a) => {
              const ekli = eklenenler.includes(a.ad);
              return (
                <button key={a.ad} onClick={() => { onEkle(a.ad); toast.success(ekli ? `${a.ad} kaldırıldı` : `${a.ad} eklendi`); }}
                  className="hf-kart group relative aspect-square overflow-hidden bg-gradient-to-br from-yuzey-2 to-zemin">
                  <PersonStanding className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-metin-3" />
                  {ekli && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-aksan text-zemin"><Check className="h-2.5 w-2.5" /></span>}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-zemin to-transparent px-1 pb-1 pt-3 text-[9px] font-medium text-metin">{a.ad}</span>
                  {!ekli && (
                    <span className="absolute inset-0 flex items-center justify-center bg-zemin/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1 rounded-full border border-aksan/50 px-2 py-0.5 text-[10px] text-aksan"><Plus className="h-3 w-3" /> Ekle</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
