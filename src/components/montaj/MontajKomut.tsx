"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Scissors, Copy, Trash2, Waves, Flag, Download, Save, Undo2, Redo2, Maximize, Wand2, Monitor, Smartphone, Square, RectangleVertical,
  MoveHorizontal, Type as TypeIcon, Sparkles, Activity, CornerDownLeft, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { useMontaj, AI_KOMUT_META, montajToplamSure, type MontajProje, type AiKomutId, type MontajOran } from "@/store/useMontaj";
import { PANELLER, type PanelId } from "./MontajKutuphane";
import { rippleSil, surumKaydet, ritimIsaretle, ritmeHizala, katmanBul } from "./ortak";

type Komut = { id: string; grup: "Eylem" | "Panel" | "Kurgu tarifi" | "Format"; ad: string; alt?: string; ikon: LucideIcon; kisa?: string; anahtar: string; calistir: () => void | Promise<void> };

/** Türkçe karakterleri sadeleştirip küçük harfe çevirir (arama için). */
const sade = (s: string) => s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");

/**
 * Komut paleti (Ctrl+K): editördeki her eylemi, paneli ve kurgu tarifini yazarak bulup çalıştırır.
 * Doğal dille de çalışır — "müziği ritme göre kes", "dikey yap", "sessizliği sil" gibi.
 */
export function MontajKomut({ proje, onKapat, onPanel, onDisaAktar }: { proje: MontajProje; onKapat: () => void; onPanel: (p: PanelId) => void; onDisaAktar: () => void }) {
  const [q, setQ] = useState("");
  const [sec, setSec] = useState(0);
  const kutu = useOdakTuzagi<HTMLDivElement>(true);
  const girdi = useRef<HTMLInputElement>(null);
  const st = useMontaj.getState;
  useEffect(() => { girdi.current?.focus(); }, []);

  const komutlar = useMemo<Komut[]>(() => {
    const s = st();
    const id = s.seciliKlipId;
    const l: Komut[] = [
      { id: "bol", grup: "Eylem", ad: "Oynatma çizgisinde böl", ikon: Scissors, kisa: "S", anahtar: "bol kes ayir split", calistir: () => { if (!id) return void toast.error("Klip seçilmedi", { description: "Bölmek için önce zaman çizelgesinde bir klip seç." }); s.klipBol(proje.id, id, s.playhead); } },
      { id: "cogalt", grup: "Eylem", ad: "Seçili klibi çoğalt", ikon: Copy, kisa: "Ctrl+D", anahtar: "cogalt kopya duplicate", calistir: () => { if (id) s.klipCogalt(proje.id, id); } },
      { id: "sil", grup: "Eylem", ad: "Sil ve boşluğu kapat", ikon: Trash2, kisa: "Ctrl+Del", anahtar: "sil kaldir ripple delete", calistir: () => { if (!id) return; s.anlikKaydet(proje.id); rippleSil(proje.id, id); } },
      { id: "ripple", grup: "Eylem", ad: s.ripple ? "Ripple modunu kapat" : "Ripple modunu aç", ikon: Waves, anahtar: "ripple dalga kaydir mod", calistir: () => s.rippleAyarla(!s.ripple) },
      { id: "isaret", grup: "Eylem", ad: "İşaretçi ekle", ikon: Flag, kisa: "M", anahtar: "isaret marker bayrak", calistir: () => s.projeGuncelle(proje.id, { isaretler: [...(proje.isaretler ?? []), { t: s.playhead }].sort((a, b) => a.t - b.t) }) },
      { id: "yazi", grup: "Eylem", ad: "Oynatma çizgisine yazı ekle", ikon: TypeIcon, anahtar: "yazi metin baslik text ekle", calistir: () => { const t = s.playhead; const kat = katmanBul(proje.id, "metin", [t, t + 3]); if (kat) s.klipSec(s.klipEkle(proje.id, kat, { ad: "Başlık", tur: "metin", metin: "Başlık", sure: 3, baslangic: t, metinStil: "baslik", metinBoyut: 72, metinKonum: "orta", metinAnim: "pop" })); } },
      { id: "bosluk", grup: "Eylem", ad: "Tüm boşlukları kapat", ikon: MoveHorizontal, anahtar: "bosluk kapat sikistir gap", calistir: () => { for (const k of proje.katmanlar) s.klipleriSirala(proje.id, k.id); } },
      { id: "ritim", grup: "Eylem", ad: "Müziği ritme göre kes", alt: "Vuruşları bulur, kesimleri hizalar", ikon: Activity, anahtar: "ritim beat vurus muzik senkron hizala tempo", calistir: async () => {
        const m = proje.katmanlar.flatMap((k) => k.klipler).find((k) => k.tur === "ses" && k.sesUrl);
        if (!m) return void toast.error("Montajda müzik yok", { description: "Ritme göre kesmek için önce Ses panelinden bir müzik ekle." });
        const n = await ritimIsaretle(proje.id, m.id);
        const vur = (st().projeler.find((x) => x.id === proje.id)?.isaretler ?? []).filter((x) => x.ad === "Ritim").map((x) => x.t);
        const d = ritmeHizala(proje.id, vur);
        toast.success(`${d} kesim vuruşa hizalandı`, { description: `${n} vuruş bulundu. Ctrl+Z ile geri alabilirsin.` });
      } },
      { id: "surum", grup: "Eylem", ad: "Sürüm kaydet", ikon: Save, kisa: "Ctrl+S", anahtar: "surum kaydet version save", calistir: () => surumKaydet(proje.id) },
      { id: "geri", grup: "Eylem", ad: "Geri al", ikon: Undo2, kisa: "Ctrl+Z", anahtar: "geri al undo", calistir: () => s.geriAl(proje.id) },
      { id: "yinele", grup: "Eylem", ad: "Yinele", ikon: Redo2, kisa: "Ctrl+Shift+Z", anahtar: "yinele redo", calistir: () => s.yinele(proje.id) },
      { id: "disa", grup: "Eylem", ad: "Dışa aktar", ikon: Download, anahtar: "disa aktar indir export kaydet mp4 png ses", calistir: onDisaAktar },
      ...PANELLER.map((p): Komut => ({ id: `p-${p.id}`, grup: "Panel", ad: `${p.ad} panelini aç`, ikon: p.ikon, anahtar: `${sade(p.ad)} panel ac`, calistir: () => onPanel(p.id) })),
      ...(Object.keys(AI_KOMUT_META) as AiKomutId[]).map((k): Komut => ({ id: `ai-${k}`, grup: "Kurgu tarifi", ad: AI_KOMUT_META[k].ad, alt: AI_KOMUT_META[k].ozet, ikon: Wand2, anahtar: sade(`${AI_KOMUT_META[k].ad} ${AI_KOMUT_META[k].ozet} otomatik ai`), calistir: () => { const r = s.aiUygula(proje.id, k); toast.success("Kurgu tarifi uygulandı", { description: `${AI_KOMUT_META[k].ad}: ${r}. Ctrl+Z ile geri alabilirsin.` }); } })),
      ...([["16:9", "Yatay (16:9)", Monitor, "yatay youtube genis"], ["9:16", "Dikey (9:16)", Smartphone, "dikey reels tiktok shorts"], ["1:1", "Kare (1:1)", Square, "kare instagram"], ["4:5", "Portre (4:5)", RectangleVertical, "portre instagram dikey"]] as [MontajOran, string, LucideIcon, string][])
        .map(([o, ad, ik, a]): Komut => ({ id: `f-${o}`, grup: "Format", ad: `Formatı ${ad} yap`, ikon: ik, anahtar: `${a} format oran ${o}`, calistir: () => s.projeGuncelle(proje.id, { enBoy: o }) })),
      { id: "ai-sessiz", grup: "Eylem", ad: "Sessizlikleri bul ve kes", alt: "Akıllı panelinde incele", ikon: Sparkles, anahtar: "sessiz sessizlik bosluk kes sil durak", calistir: () => onPanel("akilli") },
      { id: "sigdir", grup: "Eylem", ad: "Zaman çizelgesini sığdır", ikon: Maximize, anahtar: "sigdir zoom yakinlas fit", calistir: () => s.zoomAyarla(Math.max(10, Math.min(200, 900 / Math.max(1, montajToplamSure(proje))))) },
    ];
    return l;
  }, [proje]); // eslint-disable-line react-hooks/exhaustive-deps

  const sonuc = useMemo(() => {
    const kelimeler = sade(q).split(/\s+/).filter(Boolean);
    if (!kelimeler.length) return komutlar;
    return komutlar
      .map((k) => { const h = sade(`${k.ad} ${k.alt ?? ""} ${k.anahtar}`); const puan = kelimeler.reduce((a, w) => a + (h.includes(w) ? (sade(k.ad).startsWith(w) ? 3 : 2) : w.length > 3 && h.includes(w.slice(0, 4)) ? 1 : 0), 0); return { k, puan }; })
      .filter((x) => x.puan > 0).sort((a, b) => b.puan - a.puan).map((x) => x.k);
  }, [q, komutlar]);
  useEffect(() => setSec(0), [q]);

  const calistir = (k?: Komut) => { if (!k) return; onKapat(); void Promise.resolve(k.calistir()).catch((e) => toast.error("Komut çalışmadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` })); };
  const gruplu = sonuc.reduce<Record<string, Komut[]>>((a, k) => { (a[k.grup] ??= []).push(k); return a; }, {});
  let sira = -1;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]" onClick={onKapat} />
      <motion.div ref={kutu} role="dialog" aria-modal="true" aria-label="Komut paleti" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.14 }}
        className="menu-surface fixed left-1/2 top-[12vh] z-[201] flex max-h-[70vh] w-[min(94vw,620px)] -translate-x-1/2 flex-col overflow-hidden rounded-[18px]"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setSec((v) => Math.min(sonuc.length - 1, v + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setSec((v) => Math.max(0, v - 1)); }
          else if (e.key === "Enter") { e.preventDefault(); calistir(sonuc[sec]); }
          else if (e.key === "Escape") { e.preventDefault(); onKapat(); }
          e.stopPropagation();
        }}>
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <Search className="h-4 w-4 shrink-0 text-aksan" />
          <input ref={girdi} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ne yapmak istiyorsun? ör. ritme göre kes, dikey yap, yazı ekle" aria-label="Komut ara"
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-metin outline-none placeholder:text-metin-3" />
          <kbd className="rounded-md bg-white/[0.085] px-1.5 py-0.5 text-[10.5px] text-metin-3">Esc</kbd>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
          {!sonuc.length && <p className="px-3 py-8 text-center text-[13px] text-metin-3">Eşleşen komut yok. Farklı bir sözcük dene.</p>}
          {Object.entries(gruplu).map(([grup, l]) => (
            <div key={grup} className="mb-1.5">
              <p className="px-2.5 pb-1 pt-2 text-[12px] font-medium text-metin-3">{grup}</p>
              {l.map((k) => {
                sira++;
                const aktif = sira === sec;
                const i = sira;
                return (
                  <button key={k.id} onMouseEnter={() => setSec(i)} onClick={() => calistir(k)}
                    className={cn("flex w-full items-center gap-3 rounded-[11px] px-2.5 py-2 text-left transition-colors", aktif ? "bg-aksan/[0.1] ring-1 ring-inset ring-aksan/30" : "hover:bg-white/[0.04]")}>
                    <span className={cn("bg-white/[0.075] text-metin-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", aktif && "text-aksan")}><k.ikon className={cn("h-4 w-4", aktif ? "text-aksan" : "text-metin-2")} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-metin">{k.ad}</span>{k.alt && <span className="block truncate text-[11.5px] text-metin-3">{k.alt}</span>}</span>
                    {k.kisa && <kbd className="shrink-0 rounded-md bg-white/[0.085] px-1.5 py-0.5 text-[10.5px] text-metin-3">{k.kisa}</kbd>}
                    {aktif && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-aksan" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-2 text-[11px] text-metin-3">
          <span><kbd>Yukarı aşağı ok</kbd> gez</span><span><kbd>Enter</kbd> çalıştır</span><span className="ml-auto">{sonuc.length} komut</span>
        </div>
      </motion.div>
    </>
  );
}
