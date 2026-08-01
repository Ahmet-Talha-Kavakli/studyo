"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Check, Pin, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { onizlemeArka, cn } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";

export interface SecimOge {
  id: string;
  ad: string;
  kategori: string;
  aciklama?: string;
}

/**
 * Higgsfield tarzı seçim modalı: başlık + pill sekme filtreleri + arama +
 * çok kolonlu görsel kart grid. Stil/Avatar/Şablon/Ortam seçimi için.
 */
export function SecimModal({
  baslik,
  aciklama,
  ogeler,
  kategoriler,
  secili,
  onSec,
  onKapat,
  onOlustur,
  olusturEtiket = "Oluştur",
  oran = "portre",
}: {
  baslik: string;
  aciklama?: string;
  ogeler: SecimOge[];
  kategoriler: string[];
  secili?: string;
  onSec: (o: SecimOge) => void;
  onKapat: () => void;
  onOlustur?: () => void;
  olusturEtiket?: string;
  oran?: "portre" | "kare" | "manzara";
}) {
  const [kat, setKat] = useState(kategoriler[0] ?? "Tümü");
  const [q, setQ] = useState("");
  const [pinli, setPinli] = useState<string[]>([]);

  // "Sabitli" özel kategorisi pin'lenmişleri gösterir.
  const kategorilerTam = pinli.length > 0 && !kategoriler.includes("Sabitli")
    ? [kategoriler[0] ?? "Tümü", "Sabitli", ...kategoriler.slice(1)]
    : kategoriler;

  const liste = ogeler
    .filter((o) =>
      (kat === "Sabitli" ? pinli.includes(o.id) : kat === "Tümü" || o.kategori === kat) &&
      o.ad.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => Number(pinli.includes(b.id)) - Number(pinli.includes(a.id)));
  const aspect = oran === "portre" ? "aspect-[3/4]" : oran === "kare" ? "aspect-square" : "aspect-video";

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="menu-surface relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
      >
        {/* Başlık */}
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-lg font-bold">{baslik}</h2>
            {aciklama && <p className="mt-0.5 text-sm text-white/55">{aciklama}</p>}
          </div>
          <button onClick={onKapat} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {/* Filtreler + arama */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-4">
          {kategorilerTam.map((k) => (
            <button key={k} onClick={() => setKat(k)}
              className={cn("flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                kat === k ? "bg-white text-ink-950" : "bg-white/8 text-white/60 hover:bg-white/12")}>
              {k === "Sabitli" && <Pin className="h-3 w-3" />}{k}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara…"
              className="h-9 w-40 rounded-lg border border-white/12 bg-white/5 pl-8 pr-3 text-sm outline-none placeholder:text-white/35 focus:border-cyan-glow/50" />
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-4">
          {liste.length === 0 && !onOlustur ? (
            <p className="py-12 text-center text-sm text-white/40">Sonuç yok.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {/* Oluştur kartı */}
              {onOlustur && kat !== "Sabitli" && !q && (
                <button onClick={() => { onOlustur(); onKapat(); }}
                  className={cn(aspect, "group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 text-white/60 transition-colors hover:border-cyan-glow/50 hover:bg-cyan-glow/5 hover:text-white")}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full glass-ikon transition-colors group-hover:bg-cyan-glow/15">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">{olusturEtiket}</span>
                </button>
              )}
              {liste.map((o) => {
                const sec = o.id === secili;
                const pin = pinli.includes(o.id);
                return (
                  <button key={o.id} onClick={() => { onSec(o); onKapat(); }}
                    className={cn("group relative overflow-hidden rounded-2xl border text-left transition-all",
                      sec ? "border-cyan-glow ring-2 ring-cyan-glow/40" : "border-white/10 hover:border-white/25")}>
                    <div className={aspect} style={{ background: kabukArka(o.ad + o.kategori, "sinematik") }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
                    {sec && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-glow">
                        <Check className="h-3.5 w-3.5 text-ink-950" strokeWidth={3} />
                      </span>
                    )}
                    {/* Pin mikro-aksiyon */}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinli((v) => v.includes(o.id) ? v.filter((x) => x !== o.id) : [...v, o.id]);
                        toast.success(pin ? `${o.ad} sabitlemeden çıkarıldı` : `${o.ad} sabitlendi`);
                      }}
                      className={cn("absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-md transition-all",
                        pin ? "bg-cyan-glow text-ink-950" : "bg-ink-950/50 text-white/70 opacity-0 group-hover:opacity-100")}
                      aria-label="Sabitle"
                    >
                      <Pin className="h-3 w-3" />
                    </span>
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <div className="text-sm font-semibold">{o.ad}</div>
                      {o.aciklama && <div className="truncate text-[11px] text-white/60">{o.aciklama}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
