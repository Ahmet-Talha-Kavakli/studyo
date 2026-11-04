"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Globe, Link2, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { useSupercomputer, type SCSohbet } from "@/store/useSupercomputer";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;

/** Sohbetin paylaşılacak kopyası: atıf işaretleri korunur (paylaşım sayfasında kaynak çipi olur). */
const kopya = (s: SCSohbet) => ({
  baslik: s.baslik,
  mesajlar: s.mesajlar.filter((m) => !m.is?.bekleyen).map((m) => ({
    rol: m.rol === "kullanici" ? "kullanici" : "asistan",
    metin: m.rol === "kullanici" ? m.metin : m.yanit ? m.yanit.parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("") : m.metin.replace(/<b>/g, "**").replace(/<\/b>/g, "**").replace(/<[^>]+>/g, ""),
    alinti: m.alinti,
    demo: m.yanit?.demo || undefined,
    kaynaklar: m.yanit?.kaynaklar.map((k) => ({ url: k.url, baslik: k.baslik })),
    ciktilar: m.ciktilar?.map((c) => ({ tur: c.tur, ad: c.ad, html: c.html, url: c.url && !c.url.startsWith("data:") ? c.url : undefined })),
  })),
});

/** Paylaş penceresi — Claude gibi: bağlantı oluştur, kopyala, son mesajlarla güncelle ya da kaldır. */
export function PaylasPenceresi({ sohbet, onKapat }: { sohbet: SCSohbet; onKapat: () => void }) {
  const ref = useOdakTuzagi<HTMLDivElement>(true);
  const [is, setIs] = useState<"olustur" | "sil" | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  const p = sohbet.paylasim;
  const url = p ? `${typeof location !== "undefined" ? location.origin : ""}/s/${p.id}` : "";
  const yeniMesaj = p ? sohbet.mesajlar.filter((m) => m.zaman > p.zaman).length : 0;
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);

  const olustur = async () => {
    setIs("olustur");
    try {
      const r = await fetch("/api/sc/paylas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...kopya(sohbet), ...(p ? { id: p.id, anahtar: p.anahtar } : {}) }) });
      const j = (await r.json()) as { ok: boolean; id?: string; anahtar?: string; hata?: string };
      if (!j.ok || !j.id || !j.anahtar) throw new Error(j.hata ?? "Paylaşılamadı.");
      useSupercomputer.getState().sohbetGuncelle(sohbet.id, { paylasim: { id: j.id, anahtar: j.anahtar, zaman: Date.now() } });
      const u = `${location.origin}/s/${j.id}`;
      const panoda = await navigator.clipboard.writeText(u).then(() => true, () => false);
      if (p) toast.success("Paylaşım güncellendi", { description: "Bağlantıyı açan herkes sohbetin son halini görür." });
      else toast.success(panoda ? "Paylaşım bağlantısı kopyalandı" : "Paylaşım bağlantısı oluşturuldu", panoda ? undefined : { description: "Panoya kopyalanamadı. Bağlantıyı pencereden kopyala." });
    } catch (e) { toast.error("Sohbet paylaşılamadı", { description: `${(e as Error).message} Yeniden dene.` }); }
    setIs(null);
  };
  const kaldir = async () => {
    if (!p) return;
    setIs("sil");
    await fetch("/api/sc/paylas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, anahtar: p.anahtar }) }).catch(() => {});
    useSupercomputer.getState().sohbetGuncelle(sohbet.id, { paylasim: undefined });
    toast("Paylaşım kaldırıldı", { description: "Bağlantı artık açılmaz." });
    setIs(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-label="Sohbeti paylaş" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={YAY}
        className="relative w-full max-w-[480px] rounded-[22px] bg-[#18181b] p-6 ring-1 ring-inset ring-white/[0.1] max-sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)]/12 text-[var(--sc-aksan)]">{p ? <Globe className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold text-[var(--sc-metin)]">{p ? "Sohbet paylaşılıyor" : "Sohbeti paylaş"}</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">
              {p ? "Bağlantıya sahip herkes sohbetin paylaştığın andaki hâlini görebilir." : "Bağlantıya sahip herkes sohbetin şu anki hâlini salt okunur görebilir. Sonra yazdığın mesajlar eklenmez."}
            </p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>

        {p ? (
          <>
            <div className="mt-5 flex items-center gap-2 rounded-[14px] bg-black/20 p-1.5 pl-3.5 ring-1 ring-inset ring-white/[0.08]">
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--sc-metin)]">{url}</span>
              <button onClick={() => { void navigator.clipboard.writeText(url); setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1600); }}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-[var(--sc-metin)] px-3.5 text-[13px] font-semibold text-[#111113]">
                {kopyalandi ? <><Check className="h-4 w-4" />Kopyalandı</> : <><Copy className="h-4 w-4" />Kopyala</>}
              </button>
            </div>
            {yeniMesaj > 0 && <p className="mt-2.5 text-[12.5px] text-amber-200/90">Paylaşımdan sonra {yeniMesaj} yeni mesaj yazıldı; bağlantıda görünmüyor.</p>}
            <div className="mt-5 flex items-center gap-2">
              <button onClick={kaldir} disabled={!!is} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">{is === "sil" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Paylaşımı kaldır</button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto flex h-9 items-center rounded-full px-3 text-[13px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">Görüntüle</a>
              <button onClick={olustur} disabled={!!is} className="flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.14] hover:bg-white/[0.06] disabled:opacity-50">{is === "olustur" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Güncelle</button>
            </div>
          </>
        ) : (
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onKapat} className="h-10 rounded-full px-4 text-[14px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06]">Vazgeç</button>
            <button onClick={olustur} disabled={!!is} className="flex h-10 items-center gap-2 rounded-full bg-[var(--sc-metin)] px-5 text-[14px] font-semibold text-[#111113] disabled:opacity-60">{is ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Bağlantı oluştur</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
