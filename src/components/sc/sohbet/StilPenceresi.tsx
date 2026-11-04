"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, PenLine, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { stilCikar, useScStil, type ScOzelStil } from "@/lib/scStil";

/**
 * Özel stil oluştur / düzenle (Claude "Create custom style"): yazı örneğinden çıkar ya da elle tarif et;
 * çıkan talimat kaydetmeden önce düzenlenebilir.
 */
export function StilPenceresi({ duzenle, onKapat, onKaydet }: { duzenle?: ScOzelStil; onKapat: () => void; onKaydet?: (id: string) => void }) {
  const { ekle, guncelle, sil } = useScStil();
  const [kip, setKip] = useState<"ornek" | "elle">(duzenle ? "elle" : "ornek");
  const [ornek, setOrnek] = useState("");
  const [ad, setAd] = useState(duzenle?.ad ?? "");
  const [talimat, setTalimat] = useState(duzenle?.talimat ?? "");
  const [cikariyor, setCikariyor] = useState(false);
  const [olculdu, setOlculdu] = useState(false);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);

  const cikar = async () => {
    setCikariyor(true);
    const r = await stilCikar(ornek);
    setCikariyor(false);
    if (!r) { toast.error("Stil çıkarılamadı", { description: "Örnek metin çok kısa. Biraz daha uzun bir örnek dene." }); return; }
    setAd(r.ad); setTalimat(r.talimat); setOlculdu(!!r.demo); setKip("elle");
  };
  const dosya = async (f?: File) => {
    if (!f) return;
    if (f.size > 1048576) { mesaj.dosyaCokBuyuk(1); return; }
    setOrnek((await f.text()).slice(0, 20000));
  };
  const kaydet = () => {
    if (!ad.trim() || talimat.trim().length < 10) return;
    if (duzenle) { guncelle(duzenle.id, { ad: ad.trim(), talimat: talimat.trim() }); toast.success("Stil güncellendi"); onKaydet?.(duzenle.id); }
    else { const id = ekle({ ad: ad.trim(), talimat: talimat.trim() }); toast.success("Stil oluşturuldu", { description: "Yanıt stili menüsünden seçebilirsin." }); onKaydet?.(id); }
    onKapat();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div role="dialog" aria-modal="true" aria-label={duzenle ? "Stili düzenle" : "Stil oluştur"} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative flex max-h-[min(720px,92vh)] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] bg-[#18181b] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.1]">
        <div className="flex items-start gap-3 px-6 pb-2 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold">{duzenle ? "Stili düzenle" : "Özel stil oluştur"}</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">Yanıtlar senin üslubunla yazılsın: bir yazı örneği ver ya da stili kendin tarif et.</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>
        {!duzenle && (
          <div className="mx-6 mt-2 grid grid-cols-2 gap-1 rounded-[12px] bg-white/[0.04] p-1" role="tablist">
            {([["ornek", Sparkles, "Yazı örneğinden"], ["elle", PenLine, "Elle tarif et"]] as const).map(([k, I, a]) => (
              <button key={k} role="tab" aria-selected={kip === k} onClick={() => setKip(k)}
                className={cn("flex h-9 items-center justify-center gap-1.5 rounded-[9px] text-[13px] font-medium transition-colors", kip === k ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]")}><I className="h-3.5 w-3.5" />{a}</button>
            ))}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {kip === "ornek" ? (
            <div className="space-y-2">
              <textarea value={ornek} onChange={(e) => setOrnek(e.target.value)} rows={9} autoFocus
                placeholder="Kendi yazdığın bir e-posta, blog yazısı ya da gönderiyi yapıştır (en az birkaç paragraf)…"
                className="w-full resize-y rounded-[14px] bg-[var(--sc-zemin)] p-3.5 text-[13.5px] leading-relaxed outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" />
              <div className="flex items-center justify-between text-[12.5px] text-[var(--sc-metin-3)]">
                <label className="cursor-pointer rounded-lg px-2 py-1 hover:bg-white/[0.05] hover:text-[var(--sc-metin)]">Dosyadan yükle (.txt, .md)<input type="file" accept=".txt,.md,text/plain,text/markdown" className="sr-only" onChange={(e) => void dosya(e.target.files?.[0])} /></label>
                <span className="tabular-nums">{ornek.trim().length < 80 ? `En az 80 karakter · ${ornek.trim().length}` : `${ornek.length.toLocaleString("tr")} karakter`}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {olculdu && <p className="rounded-[12px] bg-amber-400/[0.08] px-3 py-2 text-[12.5px] leading-relaxed text-amber-200/90">Model bağlı olmadığı için stil, örnekteki ölçülebilir özelliklerden (cümle uzunluğu, hitap, madde ve emoji kullanımı) çıkarıldı. Dilediğin gibi düzenleyebilirsin.</p>}
              <label className="block">
                <span className="text-[13px] font-medium text-[var(--sc-metin-2)]">Stil adı</span>
                <input value={ad} onChange={(e) => setAd(e.target.value.slice(0, 40))} placeholder="Ör. Bülten dilim" autoFocus={!duzenle}
                  className="mt-1.5 h-10 w-full rounded-[12px] bg-[var(--sc-zemin)] px-3 text-[14px] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-[var(--sc-metin-2)]">Nasıl yazsın?</span>
                <textarea value={talimat} onChange={(e) => setTalimat(e.target.value.slice(0, 3000))} rows={8}
                  placeholder={"- Samimi ama özenli yaz, okura \"sen\" diye hitap et\n- Kısa paragraflar, gerektiğinde maddeler\n- Teknik terimleri günlük dille açıkla"}
                  className="mt-1.5 w-full resize-y rounded-[14px] bg-[var(--sc-zemin)] p-3.5 text-[13.5px] leading-relaxed outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" />
              </label>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-white/[0.07] px-6 py-3.5">
          {duzenle && <button onClick={() => { sil(duzenle.id); toast("Stil silindi"); onKapat(); }} className="flex h-10 items-center gap-1.5 rounded-full px-3 text-[13.5px] text-rose-300 hover:bg-rose-400/10"><Trash2 className="h-4 w-4" />Sil</button>}
          <span className="flex-1" />
          <button onClick={onKapat} className="h-10 rounded-full px-4 text-[13.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.05]">Vazgeç</button>
          {kip === "ornek" ? (
            <button disabled={ornek.trim().length < 80 || cikariyor} onClick={() => void cikar()} className="flex h-10 items-center gap-2 rounded-full bg-[var(--sc-metin)] px-5 text-[13.5px] font-semibold text-[#111113] disabled:opacity-40">
              {cikariyor && <Loader2 className="h-4 w-4 animate-spin" />}Stili çıkar
            </button>
          ) : (
            <button disabled={!ad.trim() || talimat.trim().length < 10} onClick={kaydet} className="h-10 rounded-full bg-[var(--sc-metin)] px-5 text-[13.5px] font-semibold text-[#111113] disabled:opacity-40">{duzenle ? "Kaydet" : "Stili kaydet"}</button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
