"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import { X, Share2, Sparkles, LayoutGrid, Coins } from "lucide-react";
import { usePaylasim, presetMinFiyat, type PaylasimTur } from "@/store/usePaylasim";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { cn } from "@/lib/utils";

/**
 * PaylasimModal — kullanıcının kendi preset/uygulamasını toplulukla paylaşması
 * (büyüme sistemi, M20). Paylaşılan içerik "Topluluk" sekmesinde görünür,
 * kullanım topladıkça sahibi Para Kazan'da kredi kazanır.
 */
export function PaylasimModal({ onKapat, varsayilan }: {
  onKapat: () => void;
  varsayilan?: { tur?: PaylasimTur; ad?: string; aciklama?: string; tohum?: string; kategori?: string; prompt?: string; model?: string };
}) {
  const paylas = usePaylasim((s) => s.paylas);
  const girisYapildi = useAuth((s) => s.girisYapildi);
  const kullaniciAd = useAuth((s) => s.kullanici?.ad);
  const acKapi = useAuthKapi((s) => s.ac);
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const [tur, setTur] = useState<PaylasimTur>(varsayilan?.tur ?? "preset");
  const [ad, setAd] = useState(varsayilan?.ad ?? "");
  const [aciklama, setAciklama] = useState(varsayilan?.aciklama ?? "");
  // m26: fiyat/komisyon — taban (min) fiyat modele göre; kullanıcı üstüne ekler.
  const minFiyat = presetMinFiyat(varsayilan?.model);
  const [ekstra, setEkstra] = useState(0); // yayıncının eklediği fiyat (kredi)
  const toplamFiyat = minFiyat + ekstra;
  const senKazanirsin = Math.floor(ekstra / 2); // ekstranın yarısı yayıncıya (kullanım başına)

  const gonder = () => {
    if (!girisYapildi) { onKapat(); acKapi({ baslik: "Paylaşmak için giriş yap", altBaslik: "Toplulukla paylaş, görüntülenmeyle kazan." }); return; }
    if (!ad.trim()) { toast.error("Ad eksik", { description: "Toplulukta görünecek bir ad yaz." }); return; }
    const yazar = "@" + (kullaniciAd?.replace(/\s+/g, "").toLowerCase() || "ben");
    paylas({
      tur, ad: ad.trim(), aciklama: aciklama.trim(),
      tohum: varsayilan?.tohum ?? "pl-" + ad.trim().toLowerCase(),
      kategori: varsayilan?.kategori ?? (tur === "preset" ? "sinematik" : "urun"),
      yazar, prompt: varsayilan?.prompt, model: varsayilan?.model,
      minFiyat, ekstraFiyat: ekstra, kazanc: 0,
    });
    toast.success(`"${ad.trim()}" yayınlandı`, { description: `Kullanım başı fiyat ${toplamFiyat} kredi, her kullanımda ${senKazanirsin} kredi kazanırsın.` });
    onKapat();
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="perde fixed inset-0 z-[200] bg-black/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        className="fixed left-1/2 top-1/2 z-[201] w-[min(94vw,480px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#151517] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[18px] font-bold text-white"><Share2 className="h-5 w-5 text-aksan" /> Toplulukla paylaş</h2>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* kazanç bandı */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><Coins className="h-5 w-5" /></span>
          <p className="text-[13px] leading-snug text-metin-2">Paylaşımın ne kadar çok kullanılırsa o kadar çok <span className="font-semibold text-emerald-300">kredi kazanırsın</span>. 1.000 kullanım = 250 kredi, 100K = 5.000 kredi.</p>
        </div>

        {/* tür */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {([["preset", "Preset", Sparkles], ["uygulama", "Uygulama", LayoutGrid]] as const).map(([id, et, Ik]) => (
            <button key={id} onClick={() => setTur(id)}
              className={cn("flex items-center justify-center gap-2 rounded-xl border py-3 text-[14px] font-semibold transition-colors",
                tur === id ? "border-aksan/50 bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>
              <Ik className="h-4 w-4" /> {et}
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-[13px] font-semibold text-metin-2">Ad</label>
        <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: Neon Yürüyüş"
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[14px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />

        <label className="mb-1.5 block text-[13px] font-semibold text-metin-2">Açıklama</label>
        <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2} placeholder="Bu paylaşımın ne yaptığını anlat…"
          className="mb-5 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[14px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />

        {/* m26: fiyatlandırma — taban (min) fiyat + kullanıcının eklediği ekstra */}
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-metin-2">Fiyatlandırma</span>
            <span className="text-[11.5px] text-metin-3">Taban: {minFiyat} kredi <span className="text-white/30">(model + %30 komisyon)</span></span>
          </div>
          <div className="mb-1 flex items-center justify-between text-[12.5px]">
            <span className="text-metin-3">Sen ne kadar eklemek istersin?</span>
            <span className="font-bold text-aksan">+{ekstra} kredi</span>
          </div>
          <input type="range" min={0} max={50} step={1} value={ekstra} onChange={(e) => setEkstra(Number(e.target.value))}
            className="mb-3 h-1.5 w-full cursor-pointer accent-aksan" aria-label="Ekstra fiyat" />
          <div className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2.5">
            <div>
              <p className="text-[12px] text-metin-3">Kullanıcı öder</p>
              <p className="text-[16px] font-bold text-white">{toplamFiyat} <span className="text-[12px] font-normal text-metin-3">kredi/kullanım</span></p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-metin-3">Sen kazanırsın</p>
              <p className="flex items-center justify-end gap-1 text-[16px] font-bold text-emerald-300"><Coins className="h-4 w-4" /> +{senKazanirsin} <span className="text-[12px] font-normal text-metin-3">/kullanım</span></p>
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-metin-3">Eklediğin fiyatın yarısı sana bakiye olarak gelir; diğer yarısı ve taban maliyet platforma gider.</p>
        </div>

        <button onClick={gonder}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-aksan py-3.5 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.02]">
          <Share2 className="h-4.5 w-4.5" /> Toplulukla paylaş
        </button>
      </motion.div>
    </>
  );
}
