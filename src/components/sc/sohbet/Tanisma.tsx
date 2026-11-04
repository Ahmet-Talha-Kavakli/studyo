"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useHafiza } from "@/store/useHafiza";
import { useScTercih } from "@/store/useScTercih";

/**
 * İlk açılış tanışması (Claude "What should I call you?" + ChatGPT kişiselleştirme):
 * hitap, iş ve kullanım amacı sorulur; cevaplar Kişisel talimatlar'a yazılır, sonradan Ayarlar'dan değişir.
 */
const ISLER = ["Pazarlama", "Yazılım", "Tasarım", "İçerik üretimi", "Girişimci", "Satış", "Öğrenci", "Eğitim", "Araştırma", "Diğer"];
const AMACLAR = ["Yazı ve e-posta", "Araştırma", "Kod", "Görsel ve video", "Site ve uygulama", "Fikir ve plan", "Öğrenme", "Veri ve tablo"];
const UZUNLUK = [["kisa", "Kısa ve öz"], ["dengeli", "Dengeli"], ["ayrintili", "Ayrıntılı"]] as const;

export function Tanisma({ varsayilanAd, onBitti }: { varsayilanAd: string; onBitti: () => void }) {
  const [adim, setAdim] = useState(0);
  const [hitap, setHitap] = useState(varsayilanAd);
  const [is, setIs] = useState<string | null>(null);
  const [isDiger, setIsDiger] = useState("");
  const [amac, setAmac] = useState<string[]>([]);
  const [uzunluk, setUzunluk] = useState<(typeof UZUNLUK)[number][0]>("dengeli");

  const kapat = () => { useScTercih.getState().ayarla({ tanisma: true }); onBitti(); };
  const bitir = () => {
    const isMetin = is === "Diğer" ? isDiger.trim() : is ?? "";
    const tercih = [
      amac.length ? `Usta'yı en çok şunlar için kullanıyorum: ${amac.join(", ").toLocaleLowerCase("tr")}.` : "",
      uzunluk === "kisa" ? "Yanıtların kısa ve öz olmasını tercih ederim." : uzunluk === "ayrintili" ? "Ayrıntılı ve örnekli yanıtları tercih ederim." : "",
    ].filter(Boolean).join(" ");
    const h = useHafiza.getState();
    const eski = h.profil ?? { hitap: "", is: "", tercih: "" };
    h.profilAyarla({ hitap: hitap.trim() || eski.hitap, is: isMetin || eski.is, tercih: [eski.tercih, tercih].filter((x) => x.trim()).join(" ") });
    toast.success("Tercihlerin kaydedildi", { description: "Tercihlerin Ayarlar › Kişisel talimatlar'a kaydedildi." });
    kapat();
  };

  const ADIMLAR = 3;
  const ileri = adim === 0 ? hitap.trim().length > 0 : adim === 1 ? !!is && (is !== "Diğer" || isDiger.trim().length > 1) : true;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" />
      <motion.div role="dialog" aria-modal="true" aria-label="Tanışalım" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[24px] bg-[#18181b] text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.1]">
        <div className="flex items-center gap-3 px-6 pt-5">
          {adim > 0 ? <button onClick={() => setAdim(adim - 1)} aria-label="Geri" className="-ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><ArrowLeft className="h-4 w-4" /></button> : <span className="w-6" />}
          <div className="flex flex-1 justify-center gap-1.5" aria-label={`Adım ${adim + 1} / ${ADIMLAR}`}>
            {Array.from({ length: ADIMLAR }, (_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === adim ? "w-6 bg-[var(--sc-aksan)]" : i < adim ? "w-1.5 bg-[var(--sc-aksan)]/50" : "w-1.5 bg-white/15")} />)}
          </div>
          <button onClick={kapat} className="rounded-lg px-2 py-1 text-[13px] text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]">Atla</button>
        </div>

        <div className="min-h-[300px] px-6 pb-2 pt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={adim} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              {adim === 0 && (
                <>
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Sana nasıl hitap edelim?</h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--sc-metin-2)]">Usta yanıtlarında seni bu adla anar.</p>
                  <input value={hitap} onChange={(e) => setHitap(e.target.value.slice(0, 40))} autoFocus onKeyDown={(e) => { if (e.key === "Enter" && ileri) setAdim(1); }} aria-label="Hitap"
                    placeholder="Adın ya da takma adın" className="mt-6 h-12 w-full rounded-[14px] bg-[var(--sc-zemin)] px-4 text-[16px] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/60" />
                </>
              )}
              {adim === 1 && (
                <>
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Ne iş yapıyorsun?</h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--sc-metin-2)]">Örnekleri ve terimleri işine göre seçmesine yardım eder.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {ISLER.map((x) => (
                      <button key={x} onClick={() => setIs(x)} aria-pressed={is === x}
                        className={cn("h-9 rounded-full px-3.5 text-[13.5px] ring-1 ring-inset transition-colors", is === x ? "bg-[var(--sc-aksan)]/15 text-[var(--sc-aksan)] ring-[var(--sc-aksan)]/40" : "text-[var(--sc-metin-2)] ring-white/[0.1] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]")}>{x}</button>
                    ))}
                  </div>
                  {is === "Diğer" && <input value={isDiger} onChange={(e) => setIsDiger(e.target.value.slice(0, 80))} autoFocus placeholder="Ör. Mimar, kafe işletmecisi" aria-label="İşin"
                    className="mt-3 h-11 w-full rounded-[14px] bg-[var(--sc-zemin)] px-4 text-[14.5px] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/60" />}
                </>
              )}
              {adim === 2 && (
                <>
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em]">En çok ne için kullanacaksın?</h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--sc-metin-2)]">Birden fazla seçebilirsin.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {AMACLAR.map((x) => { const s = amac.includes(x); return (
                      <button key={x} onClick={() => setAmac((l) => (s ? l.filter((y) => y !== x) : [...l, x]))} aria-pressed={s}
                        className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] ring-1 ring-inset transition-colors", s ? "bg-[var(--sc-aksan)]/15 text-[var(--sc-aksan)] ring-[var(--sc-aksan)]/40" : "text-[var(--sc-metin-2)] ring-white/[0.1] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]")}>{s && <Check className="h-3.5 w-3.5" />}{x}</button>
                    ); })}
                  </div>
                  <p className="mt-6 text-[13.5px] font-medium text-[var(--sc-metin-2)]">Yanıtlar nasıl olsun?</p>
                  <div className="mt-2 grid grid-cols-3 gap-1 rounded-[12px] bg-white/[0.04] p-1" role="radiogroup" aria-label="Yanıt uzunluğu">
                    {UZUNLUK.map(([k, a]) => <button key={k} role="radio" aria-checked={uzunluk === k} onClick={() => setUzunluk(k)} className={cn("h-9 rounded-[9px] text-[13px] font-medium transition-colors", uzunluk === k ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]")}>{a}</button>)}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-5 pt-3">
          <p className="text-[12px] leading-snug text-[var(--sc-metin-3)]">Sonradan Ayarlar'dan değiştirebilirsin.</p>
          <button disabled={!ileri} onClick={() => (adim < ADIMLAR - 1 ? setAdim(adim + 1) : bitir())}
            className="h-11 shrink-0 rounded-full bg-[var(--sc-metin)] px-6 text-[14px] font-semibold text-[#111113] transition-opacity disabled:opacity-40">{adim < ADIMLAR - 1 ? "Devam" : "Başlayalım"}</button>
        </div>
      </motion.div>
    </div>
  );
}
