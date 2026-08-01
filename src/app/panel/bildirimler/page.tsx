"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, CheckCheck, Sparkles, Info, AlertTriangle, Inbox, ArrowRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { Baslik } from "@/components/panel/Baslik";
import { useBildirim } from "@/store/useBildirim";
import { cn } from "@/lib/utils";

const filtreler = [
  { id: "tumu", ad: "Tümü", ikon: Bell },
  { id: "okunmamis", ad: "Okunmamış", ikon: Inbox },
  { id: "basari", ad: "Başarı", ikon: Sparkles },
  { id: "bilgi", ad: "Bilgi", ikon: Info },
  { id: "uyari", ad: "Uyarı", ikon: AlertTriangle },
  { id: "hata", ad: "Hata", ikon: AlertTriangle },
] as const;

function zamanFarki(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dakika önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} saat önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

export default function BildirimlerPage() {
  const router = useRouter();
  const { bildirimler, okunduIsaretle, tumunuOku, sil, tumunuSil } = useBildirim();
  const bildirimAc = (id: string, link?: string) => { okunduIsaretle(id); if (link) router.push(link); };
  const [filtre, setFiltre] = useState<string>("tumu");
  const okunmamis = bildirimler.filter((b) => !b.okundu).length;

  const liste = bildirimler.filter((b) =>
    filtre === "tumu" ? true : filtre === "okunmamis" ? !b.okundu : b.tur === filtre,
  );

  return (
    <div className="max-w-2xl">
      <Baslik
        baslik="Bildirimler"
        aciklama={okunmamis > 0 ? `${okunmamis} okunmamış bildirim` : "Tüm bildirimler okundu"}
        aksiyon={
          <div className="flex gap-2">
            {okunmamis > 0 && (
              <button onClick={tumunuOku} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/8">
                <CheckCheck className="h-4 w-4" /> Tümünü oku
              </button>
            )}
            {bildirimler.length > 0 && (
              <button onClick={() => { tumunuSil(); toast("Tüm bildirimler temizlendi"); }} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-rose-500/15 hover:text-rose-400">
                <Trash2 className="h-4 w-4" /> Temizle
              </button>
            )}
          </div>
        }
      />

      {/* Tür filtreleri */}
      <div className="mb-5 flex flex-wrap gap-2">
        {filtreler.map((f) => {
          const say = f.id === "tumu" ? bildirimler.length
            : f.id === "okunmamis" ? okunmamis
            : bildirimler.filter((b) => b.tur === f.id).length;
          return (
            <button key={f.id} onClick={() => setFiltre(f.id)}
              className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                filtre === f.id ? "border-aksan/50 bg-aksan/15 text-white" : "border-white/10 text-white/60 hover:border-white/20")}>
              <f.ikon className="h-3.5 w-3.5" /> {f.ad}
              <span className="rounded-full bg-white/10 px-1.5 text-xs">{say}</span>
            </button>
          );
        })}
      </div>

      {liste.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 py-16 text-center">
          <Bell className="h-10 w-10 text-white/25" />
          <p className="mt-3 text-sm text-white/50">{filtre === "tumu" ? "Henüz bildirim yok." : "Bu filtrede bildirim yok."}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence>
          {liste.map((b) => (
            <motion.div key={b.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              className={cn("flex gap-3 rounded-2xl border p-4 transition-colors",
                b.okundu ? "border-white/10 bg-yuzey" : "border-aksan/30 bg-aksan/[0.07]")}>
              <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                b.tur === "basari" ? "bg-emerald-400" : b.tur === "uyari" ? "bg-amber-glow" : b.tur === "hata" ? "bg-rose-400" : "bg-aksan")} />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{b.baslik}</h3>
                <p className="mt-0.5 text-sm text-white/55">{b.mesaj}</p>
                <div className="mt-1 flex items-center gap-3">
                  <p className="text-xs text-white/30">{zamanFarki(b.zaman)}</p>
                  {b.link && (
                    <button onClick={() => bildirimAc(b.id, b.link)} className="flex items-center gap-1 text-xs font-medium text-aksan transition-colors hover:opacity-75">
                      Görüntüle <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-1">
                {!b.okundu && (
                  <button onClick={() => okunduIsaretle(b.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 hover:text-white" aria-label="Okundu">
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => sil(b.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-rose-500/15 hover:text-rose-400" aria-label="Sil">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
