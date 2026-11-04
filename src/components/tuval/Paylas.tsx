"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Link2, Loader2, Trash2, Users, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useTuval, type Tuval } from "@/store/useTuval";

/**
 * Paylaş: tuvalin salt okunur kopyası için bağlantı (görüntüleyen "Kopyasını aç" ile kendi Canvas'ına alır).
 * Kopya o anın görüntüsüdür; değişiklikleri yansıtmak için "Güncelle". Anahtar yalnız bu tarayıcıda.
 */
export function PaylasPenceresi({ tuval, onKapat }: { tuval: Tuval; onKapat: () => void }) {
  const [mesgul, setMesgul] = useState(false);
  const [kopya, setKopya] = useState(false);
  const p = tuval.paylasim;
  const url = p ? `${typeof window !== "undefined" ? window.location.origin : ""}/t/${p.id}` : "";
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  const yerel = tuval.dugumler.some((d) => d.surumler.some((s) => s.url?.startsWith("data:") || s.url?.startsWith("blob:")));

  const paylas = async () => {
    setMesgul(true);
    try {
      const r = await fetch("/api/tuval/paylas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: tuval.ad, dugumler: tuval.dugumler, kenarlar: tuval.kenarlar, id: p?.id, anahtar: p?.anahtar }) });
      const j = (await r.json()) as { ok: boolean; id?: string; anahtar?: string; hata?: string };
      if (!j.ok || !j.id || !j.anahtar) throw new Error(j.hata);
      useTuval.getState().guncelle(tuval.id, (t) => ({ ...t, paylasim: { id: j.id!, anahtar: j.anahtar!, zaman: Date.now() } }), false);
      toast.success(p ? "Paylaşım güncellendi" : "Paylaşım bağlantısı oluşturuldu");
    } catch (e) { toast.error("Tuval paylaşılamadı", { description: `${e instanceof Error && e.message ? e.message : "Sunucuya ulaşılamadı."} Yeniden dene.` }); }
    setMesgul(false);
  };
  /* Birlikte düzenleme: bağlantıyı bilen herkes aynı tuvali canlı düzenler. */
  const o = tuval.ortak;
  const ortakUrl = o ? `${typeof window !== "undefined" ? window.location.origin : ""}/panel/canvas/ortak/${o.id}?k=${o.anahtar}` : "";
  const [ortakKopya, setOrtakKopya] = useState(false);
  const ortakAc = async () => {
    setMesgul(true);
    try {
      const j = await fetch("/api/tuval/ortak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "olustur", ad: tuval.ad, dugumler: tuval.dugumler, kenarlar: tuval.kenarlar, gruplar: tuval.gruplar ?? [], yorumlar: tuval.yorumlar ?? [] }) }).then((x) => x.json()) as { ok: boolean; id?: string; anahtar?: string; hata?: string };
      if (!j.ok || !j.id || !j.anahtar) throw new Error(j.hata);
      useTuval.getState().guncelle(tuval.id, (t) => ({ ...t, ortak: { id: j.id!, anahtar: j.anahtar!, sahip: true } }), false);
      void navigator.clipboard?.writeText(`${location.origin}/panel/canvas/ortak/${j.id}?k=${j.anahtar}`).catch(() => {});
      toast.success("Birlikte düzenleme açıldı", { description: "Davet bağlantısı panoya kopyalandı." });
    } catch (e) { toast.error("Birlikte düzenleme açılamadı", { description: `${e instanceof Error && e.message ? e.message : "Sunucuya ulaşılamadı."} Yeniden dene.` }); }
    setMesgul(false);
  };
  const ortakKapat = async () => {
    if (!o) return; setMesgul(true);
    if (o.sahip) await fetch("/api/tuval/ortak", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id, k: o.anahtar }) }).catch(() => null);
    useTuval.getState().guncelle(tuval.id, (t) => ({ ...t, ortak: undefined }), false);
    setMesgul(false); toast(o.sahip ? "Birlikte düzenleme kapatıldı" : "Ortak tuvalden ayrıldın", { description: "Tuvalin bu kopyası sende kalır." });
  };
  const kaldir = async () => {
    if (!p) return; setMesgul(true);
    await fetch("/api/tuval/paylas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, anahtar: p.anahtar }) }).catch(() => null);
    useTuval.getState().guncelle(tuval.id, (t) => ({ ...t, paylasim: undefined }), false);
    setMesgul(false); toast("Paylaşım kaldırıldı", { description: "Bağlantı artık açılmaz." });
  };

  return (
    <div data-arayuz className="fixed inset-0 z-[80] flex justify-end p-2" onPointerDown={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div role="dialog" aria-modal="true" aria-label="Paylaş" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="relative h-full w-full max-w-[440px] overflow-y-auto rounded-[22px] bg-[var(--tv-kart)] p-5 text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.1]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.085] text-white"><Link2 className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[16px] font-semibold">Tuvali paylaş</h2><p className="mt-0.5 text-[13px] leading-relaxed text-[var(--sc-metin-3)]">Bağlantıyı açan herkes akışı ve sonuçları görür; isterse kopyasını kendi Canvas'ına alır. Düzenleyemez.</p></div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><X className="h-4 w-4" /></button>
        </div>
        {p && (
          <div className="mt-4 flex items-center gap-1 rounded-[12px] bg-[var(--sc-zemin)] py-1 pl-3 pr-1 ring-1 ring-inset ring-[var(--sc-kenar)]">
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--sc-metin-2)]">{url.replace(/^https?:\/\//, "")}</span>
            <button onClick={() => { void navigator.clipboard.writeText(url); setKopya(true); setTimeout(() => setKopya(false), 1400); }} aria-label="Bağlantıyı kopyala" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/[0.075]">{kopya ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}</button>
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Yeni sekmede aç" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/[0.075]"><ExternalLink className="h-4 w-4" /></a>
          </div>
        )}
        {p && <p className="mt-2 text-[12px] text-[var(--sc-metin-3)]">Son güncelleme: {new Date(p.zaman).toLocaleString("tr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. Sonraki değişiklikler için “Güncelle”.</p>}
        {yerel && <p className="mt-3 rounded-[10px] bg-amber-300/[0.07] px-3 py-2 text-[12.5px] text-amber-100">Bazı çıktılar yalnız bu tarayıcıda; paylaşılan kopyada görünmezler.</p>}
        <div className="mt-5 flex items-center gap-2">
          {p && <button onClick={() => void kaldir()} disabled={mesgul} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-400/10"><Trash2 className="h-3.5 w-3.5" />Kaldır</button>}
          <button onClick={() => void paylas()} disabled={mesgul} className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{mesgul && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{p ? "Güncelle" : "Bağlantı oluştur"}</button>
        </div>
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.085] text-white"><Users className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><h3 className="text-[14.5px] font-semibold">Birlikte düzenle</h3><p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--sc-metin-3)]">Davet bağlantısını açan kişi bu tuvali seninle canlı düzenler: düğümler, bağlantılar, yorumlar ve imleçler anında görünür. Herkes kendi kredisiyle üretir.</p></div>
          </div>
          {o ? (
            <>
              <div className="mt-3 flex items-center gap-1 rounded-[12px] bg-[var(--sc-zemin)] py-1 pl-3 pr-1 ring-1 ring-inset ring-emerald-400/25">
                <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--sc-metin-2)]">{ortakUrl.replace(/^https?:\/\//, "")}</span>
                <button onClick={() => { void navigator.clipboard.writeText(ortakUrl); setOrtakKopya(true); setTimeout(() => setOrtakKopya(false), 1400); }} aria-label="Davet bağlantısını kopyala" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/[0.075]">{ortakKopya ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}</button>
              </div>
              <div className="mt-2 flex items-center"><span className="flex-1 text-[12px] text-[var(--sc-metin-3)]">Bağlantıyı bilen herkes düzenleyebilir.</span><button onClick={() => void ortakKapat()} disabled={mesgul} className="h-8 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-400/10">{o.sahip ? "Kapat" : "Ayrıl"}</button></div>
            </>
          ) : <button onClick={() => void ortakAc()} disabled={mesgul} className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[13px] font-medium ring-1 ring-white/[0.1] hover:bg-white/[0.14] disabled:opacity-50"><Users className="h-3.5 w-3.5" />Davet bağlantısı oluştur</button>}
        </div>
      </motion.div>
    </div>
  );
}
