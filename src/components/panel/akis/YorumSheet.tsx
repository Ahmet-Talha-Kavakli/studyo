"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Send, CheckCircle2, Smile } from "lucide-react";
import { useAkis, tumYorumlar, type FeedGonderi } from "@/store/useAkis";
import { profilBul, kisaSayi, goreliZaman } from "@/lib/akisVeri";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { cn } from "@/lib/utils";

const HIZLI_EMOJI = ["❤️", "🔥", "😍", "👏", "😂", "🙌", "✨", "💯"];
const EMOJI_PALET = ["❤️", "🔥", "😍", "👏", "😂", "🙌", "✨", "💯", "😮", "😢", "😅", "🥰", "😎", "🤯", "👀", "🙏", "💪", "🎉", "🌟", "💎", "🚀", "🎨", "🎬", "🖤"];

/** Akış yorum sheet'i — TikTok tarzı alttan/sağdan açılan yorum paneli. */
export function YorumSheet({ gonderi, onKapat }: { gonderi: FeedGonderi | null; onKapat: () => void }) {
  useScrollKilit(gonderi !== null);
  return (
    <AnimatePresence>
      {gonderi && <YorumIcerik gonderi={gonderi} onKapat={onKapat} />}
    </AnimatePresence>
  );
}

function YorumIcerik({ gonderi, onKapat }: { gonderi: FeedGonderi; onKapat: () => void }) {
  const ekYorumlar = useAkis((s) => s.ekYorumlar);
  const yorumBegeni = useAkis((s) => s.yorumBegeni);
  const ekYanitlar = useAkis((s) => s.ekYanitlar);
  const { yorumEkle, yorumBegeniToggle, yanitEkle } = useAkis();
  const [metin, setMetin] = useState("");
  const [yanitAcik, setYanitAcik] = useState<string | null>(null);
  const [yanitMetin, setYanitMetin] = useState("");
  const [emojiAcik, setEmojiAcik] = useState(false);

  const yorumlar = useMemo(() => tumYorumlar(gonderi.id, ekYorumlar), [gonderi.id, ekYorumlar]);

  const gonder = () => {
    const t = metin.trim();
    if (!t) return;
    yorumEkle(gonderi.id, t);
    setMetin("");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onKapat}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[78vh] flex-col rounded-t-2xl border-t border-white/10 bg-[#141416] sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] sm:max-h-none sm:rounded-none sm:border-l sm:border-t-0"
      >
        {/* başlık */}
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3.5">
          <span className="text-[15px] font-bold text-white">
            {kisaSayi(yorumlar.length + gonderi.yorumTohum - (gonderi.id.startsWith("akis_pay_") ? 0 : 0))} yorum
          </span>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* liste */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {yorumlar.length === 0 && (
            <p className="py-10 text-center text-sm text-metin-3">İlk yorumu sen yaz ✨</p>
          )}
          {yorumlar.map((y) => {
            const begenili = yorumBegeni.includes(y.id);
            const profil = profilBul(y.kullanici);
            const benim = y.kullanici === "@ben";
            return (
              <div key={y.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-emerald-400 text-[13px] font-bold text-zemin">
                  {y.kullanici.replace("@", "").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {benim ? (
                      <span className="text-[13px] font-semibold text-white">Sen</span>
                    ) : (
                      <Link href={`/panel/akis/profil/${y.kullanici.replace("@", "")}`} className="text-[13px] font-semibold text-metin-2 hover:text-white hover:underline">
                        {y.kullanici}
                      </Link>
                    )}
                    {profil?.dogrulanmis && <CheckCircle2 className="h-3 w-3 fill-aksan text-zemin" />}
                    <span className="text-[11px] text-metin-3">· {goreliZaman(y.ofset)}</span>
                  </div>
                  {/* m4: salt-emoji yorumlar BÜYÜK render (küçük görünme sorunu giderildi) */}
                  <p className={cn("mt-0.5 leading-snug text-white/90", /^(\p{Extended_Pictographic}|️|‍|\s){1,8}$/u.test(y.metin) ? "text-3xl leading-tight" : "text-[14px]")}>{y.metin}</p>
                  {/* Yanıtla + yanıt listesi */}
                  <button onClick={() => setYanitAcik(yanitAcik === y.id ? null : y.id)}
                    className="mt-1 text-[12px] font-medium text-metin-3 transition-colors hover:text-white">Yanıtla</button>
                  {(ekYanitlar[y.id]?.length ?? 0) > 0 && (
                    <div className="mt-2 space-y-2 border-l border-white/10 pl-3">
                      {ekYanitlar[y.id].map((r) => (
                        <div key={r.id} className="flex items-start gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-emerald-400 text-[11px] font-bold text-zemin">{r.kullanici.replace("@", "").charAt(0).toUpperCase()}</span>
                          <div className="min-w-0">
                            <span className="text-[12px] font-semibold text-white">{r.kullanici === "@ben" ? "Sen" : r.kullanici}</span>
                            <p className="text-[13px] leading-snug text-white/85">{r.metin}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {yanitAcik === y.id && (
                    <div className="mt-2 flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-0.5 ring-1 ring-inset ring-white/8 focus-within:ring-aksan/50">
                      <input autoFocus value={yanitMetin} onChange={(e) => setYanitMetin(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && yanitMetin.trim()) { yanitEkle(y.id, yanitMetin.trim()); setYanitMetin(""); setYanitAcik(null); } }}
                        placeholder={`${y.kullanici === "@ben" ? "kendine" : y.kullanici} yanıtla…`}
                        className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-white placeholder:text-metin-3 focus:outline-none" />
                      <button onClick={() => { if (yanitMetin.trim()) { yanitEkle(y.id, yanitMetin.trim()); setYanitMetin(""); setYanitAcik(null); } }}
                        className="text-[12px] font-semibold text-aksan">Gönder</button>
                    </div>
                  )}
                </div>
                <button onClick={() => yorumBegeniToggle(y.id)} className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
                  <Heart className={cn("h-4 w-4 transition-transform active:scale-125", begenili ? "fill-rose-500 text-rose-500" : "text-metin-3")} />
                  <span className="text-[11px] text-metin-3">{kisaSayi(y.begeni + (begenili ? 1 : 0))}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* giriş */}
        <div className="relative border-t border-white/8 p-3">
          {/* hızlı emoji şeridi */}
          <div className="mb-2 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HIZLI_EMOJI.map((e) => (
              <button key={e} onClick={() => setMetin((m) => m + e)}
                className="shrink-0 rounded-lg px-1.5 py-0.5 text-[19px] transition-transform hover:scale-125">{e}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1 ring-1 ring-inset ring-white/8 focus-within:ring-aksan/50">
            <button onClick={() => setEmojiAcik((v) => !v)} className="shrink-0 text-metin-3 hover:text-white"><Smile className="h-5 w-5" /></button>
            <input
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") gonder(); }}
              placeholder="Yorum ekle…"
              className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-white placeholder:text-metin-3 focus:outline-none"
            />
            <button onClick={gonder} disabled={!metin.trim()}
              className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                metin.trim() ? "bg-aksan text-zemin" : "text-metin-3")}>
              <Send className="h-[17px] w-[17px]" />
            </button>
          </div>

          {/* emoji paleti */}
          <AnimatePresence>
            {emojiAcik && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full left-3 right-3 mb-2 grid grid-cols-8 gap-1 rounded-2xl border border-white/10 bg-[#1c1c1e] p-2.5 shadow-2xl">
                {EMOJI_PALET.map((e) => (
                  <button key={e} onClick={() => { setMetin((m) => m + e); }}
                    className="rounded-lg py-1 text-[20px] transition-transform hover:scale-125">{e}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
