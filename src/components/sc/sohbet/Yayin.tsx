"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, Copy, ExternalLink, Info, Loader2, Rocket, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Yuzen } from "@/components/ui/Yuzen";
import { yayinKontrol } from "@/lib/scDuzenleyici";
import type { SCCikti, SCYayin } from "@/store/useSupercomputer";

/**
 * Yayınla (Lovable/v0 "Publish" + Higgsfield Games "Deployed/Published"): önce hızlı kontrol listesi, sonra herkese açık
 * bağlantı (/y/<id>). Yayındaki sürümden sonra değişiklik olursa "Değişiklikleri yayınla" görünür. Remix izni isteğe bağlı.
 */
export function YayinDugmesi({ c, yayin, onDegis }: { c: SCCikti; yayin?: SCYayin; onDegis: (y: SCYayin | undefined) => void }) {
  const [acik, setAcik] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [remix, setRemix] = useState(yayin?.remix ?? true);
  const [kopya, setKopya] = useState(false);
  const kontrol = useMemo(() => (acik && c.html ? yayinKontrol(c.html) : []), [acik, c.html]);
  const url = yayin && typeof window !== "undefined" ? `${window.location.origin}/y/${yayin.id}` : "";
  const guncel = !!yayin && yayin.ciktiId === c.id && yayin.remix === remix;

  const yayinla = async () => {
    if (!c.html) return;
    setMesgul(true);
    try {
      const r = await fetch("/api/sc/yayin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: c.ad, html: c.html, tur: c.tur, remix, id: yayin?.id, anahtar: yayin?.anahtar }) });
      const j = (await r.json()) as { ok: boolean; id?: string; anahtar?: string; hata?: string };
      if (!j.ok || !j.id || !j.anahtar) throw new Error(j.hata ?? "Yayınlanamadı.");
      onDegis({ id: j.id, anahtar: j.anahtar, ciktiId: c.id, zaman: Date.now(), remix });
      toast.success(yayin ? "Değişiklikler yayınlandı" : "Uygulama yayınlandı", { description: `${window.location.origin}/y/${j.id} adresinde açık.` });
    } catch (e) { toast.error("Yayınlanamadı", { description: `${e instanceof Error ? e.message : "Sunucuya ulaşılamadı."} Yeniden dene.` }); }
    setMesgul(false);
  };
  const kaldir = async () => {
    if (!yayin) return;
    setMesgul(true);
    await fetch("/api/sc/yayin", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: yayin.id, anahtar: yayin.anahtar }) }).catch(() => null);
    onDegis(undefined); setMesgul(false); setAcik(false); toast("Yayından kaldırıldı", { description: "Bağlantı artık açılmıyor." });
  };

  return (
    <div className="relative">
      <button onClick={() => setAcik((v) => !v)} aria-expanded={acik}
        className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors", yayin ? "bg-emerald-400/12 text-emerald-300 hover:bg-emerald-400/20" : "bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] hover:brightness-110")}>
        {yayin ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : <Rocket className="h-3.5 w-3.5" />}<span className="max-sm:sr-only">{yayin ? "Yayında" : "Yayınla"}</span>
      </button>
      <AnimatePresence>
        <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="Yayınla" className="rounded-[16px] border border-white/[0.09] bg-[#18181b] p-4" style={{ width: 340 }}>
          <p className="text-[14.5px] font-semibold text-[var(--sc-metin)]">{yayin ? "Uygulaman yayında" : "Herkese açık yayınla"}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--sc-metin-3)]">{yayin ? (guncel ? "Panelde gördüğün sürüm yayında." : "Yayındaki sürümden sonra değişiklik yaptın.") : "Bağlantıya sahip herkes açıp kullanabilir; istediğin an kaldırırsın."}</p>
          {yayin && (
            <div className="mt-3 flex items-center gap-1 rounded-[10px] bg-[var(--sc-zemin)] py-1 pl-3 pr-1 ring-1 ring-inset ring-[var(--sc-kenar)]">
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--sc-metin-2)]">{url.replace(/^https?:\/\//, "")}</span>
              <button onClick={() => { void navigator.clipboard.writeText(url); setKopya(true); setTimeout(() => setKopya(false), 1400); }} aria-label="Bağlantıyı kopyala" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--sc-metin-2)] hover:bg-white/[0.06]">{kopya ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}</button>
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Yeni sekmede aç" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          )}
          <button onClick={() => setRemix((v) => !v)} aria-pressed={remix} className="mt-3 flex w-full items-center gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-left ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.05]">
            <span className="min-w-0 flex-1"><span className="block text-[13px] text-[var(--sc-metin)]">Remixe izin ver</span><span className="block text-[12px] text-[var(--sc-metin-3)]">Başkaları kendi sohbetinde kopyalayıp değiştirebilir.</span></span>
            <span aria-hidden className={cn("relative flex h-[18px] w-8 shrink-0 items-center rounded-full px-[2px] transition-colors", remix ? "justify-end bg-[var(--sc-aksan)]" : "justify-start bg-white/[0.16]")}><span className="h-[14px] w-[14px] rounded-full bg-white" /></span>
          </button>
          {kontrol.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[12px] font-medium text-[var(--sc-metin-3)]">Yayın öncesi kontrol</p>
              {kontrol.map((k, i) => (
                <p key={i} className={cn("flex gap-2 rounded-[10px] px-2.5 py-2 text-[12.5px] leading-snug", k.tur === "uyari" ? "bg-amber-300/[0.08] text-amber-100" : "bg-white/[0.03] text-[var(--sc-metin-2)]")}>
                  {k.tur === "uyari" ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" /> : <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)]" />}{k.metin}
                </p>
              ))}
            </div>
          )}
          {kontrol.length === 0 && <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-emerald-300/90"><Check className="h-3.5 w-3.5" />Hızlı kontrolde sorun bulunmadı</p>}
          <div className="mt-4 flex items-center gap-2">
            {yayin && <button onClick={() => void kaldir()} disabled={mesgul} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-400/10"><Trash2 className="h-3.5 w-3.5" />Kaldır</button>}
            <span className="flex-1" />
            {(!yayin || !guncel) && (
              <button onClick={() => void yayinla()} disabled={mesgul} className="flex h-9 items-center gap-2 rounded-full bg-[var(--sc-metin)] px-4 text-[13px] font-semibold text-[#111113] disabled:opacity-50">
                {mesgul && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{yayin ? "Değişiklikleri yayınla" : "Yayınla"}
              </button>
            )}
          </div>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
}
