"use client";

/**
 * İndir menüsü — kart eylem çubuğundaki İndir düğmesi ve açılan menü.
 *  · Türüne göre asıl dosya: Görseller (PNG, JPG, WEBP) · Video (+ kare) · Ses · Model (+ önizleme)
 *  · "Önce ve sonra şablonuyla indir": kaynağı olan üretimlerde yan yana ya da sürgülü karşılaştırma
 *  · "Filigransız": plan hakkına bağlı; Başlangıç planında kilitli ve "Artı planla" rozeti
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, Box, ChevronDown, Columns2, Download, Film, ImageIcon, Loader2, Lock, SplitSquareHorizontal, Stamp } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAuth } from "@/store/useAuth";
import { useAyarTercih } from "@/store/useAyarTercih";
import type { Uretim } from "@/store/useProjeler";
import { cn, saltUrl } from "@/lib/utils";
import { filigransizAyarla, indirTuru, kaynakBul, kareIndir, onceSonraIndir, uretimDosyasiIndir, type GorselBicim, type OnceSonraSablon } from "@/lib/galeri/indir";
import { Anahtar, KayanSegment, Katman } from "./Katman";

type Yan = "top" | "bottom" | "left" | "right";

export function IndirDugmesi({ u, className, ikonSinif = "h-4 w-4", side = "left", etiket = "İndir", yerlesim = "alt-sag", children }: {
  u: Uretim; className?: string; ikonSinif?: string; side?: Yan; etiket?: string;
  yerlesim?: "alt-sag" | "alt-sol" | "sol-ust" | "sag-ust" | "ust-sag" | "ust-sol";
  /** Düğmenin içeriği (varsayılan: indirme ikonu). */
  children?: React.ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <span className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <Tooltip label={etiket} side={side}>
        <button type="button" aria-label={etiket} aria-haspopup="menu" aria-expanded={acik}
          onClick={(e) => { e.stopPropagation(); setAcik((v) => !v); }} className={className}>
          {children ?? <Download className={ikonSinif} />}
        </button>
      </Tooltip>
      <Katman acik={acik} onKapat={() => setAcik(false)} yerlesim={yerlesim} genislik={304} baslik="İndir" etiket="İndirme seçenekleri">
        <IndirIcerik u={u} onBitti={() => setAcik(false)} />
      </Katman>
    </span>
  );
}

const BICIMLER: { id: GorselBicim; ad: string }[] = [{ id: "png", ad: "PNG" }, { id: "jpg", ad: "JPG" }, { id: "webp", ad: "WEBP" }];

export function IndirIcerik({ u, onBitti }: { u: Uretim; onBitti?: () => void }) {
  const plan = useAuth((s) => s.kullanici?.plan ?? null);
  const hak = !!plan && plan !== "baslangic";
  const tercihFiligran = useAyarTercih((s) => s.gizlilik.filigran);
  const filigransiz = hak && !tercihFiligran;
  const [bicim, setBicim] = useState<GorselBicim>("png");
  const [is, setIs] = useState<string | null>(null);
  const [sablonAcik, setSablonAcik] = useState(false);
  const tur = indirTuru(u);
  const kaynak = useMemo(() => kaynakBul(u), [u]);
  const kapak = saltUrl(u.gorselUrl) ?? saltUrl(u.thumbnailUrl);

  const calistir = async (ad: string, f: () => Promise<boolean>) => {
    if (is) return;
    setIs(ad);
    try { if (await f()) onBitti?.(); } finally { setIs(null); }
  };

  const ana = {
    gorsel: { ad: "Görseller", alt: `${bicim.toUpperCase()} · ${u.meta?.cozunurluk ?? "özgün çözünürlük"}`, ikon: ImageIcon },
    video: { ad: "Video", alt: `MP4 · ${[u.meta?.cozunurluk, u.meta?.sure?.replace(/(\d)\s*sn$/, "$1 sn")].filter(Boolean).join(" · ") || "özgün kalite"}`, ikon: Film },
    ses: { ad: "Ses", alt: `${(String(u.sesUrl ?? "").match(/\.(mp3|wav|ogg|m4a|opus)(\?|$)/)?.[1] ?? "mp3").toUpperCase()} · ${u.meta?.sureSn ? `${Math.round(u.meta.sureSn)} sn` : "özgün kalite"}`, ikon: AudioLines },
    model: { ad: "Model", alt: "GLB · dokulu 3D model", ikon: Box },
  }[tur];

  return (
    <div className="p-0.5">
      <Satir ikon={ana.ikon} ad={ana.ad} alt={ana.alt} yukleniyor={is === "ana"} onClick={() => calistir("ana", () => uretimDosyasiIndir(u, { bicim, filigran: tur === "gorsel" ? !filigransiz : undefined }))} />
      {tur === "gorsel" && (
        <div className="px-2 pb-1.5 pt-0.5">
          <KayanSegment grup={`indir-bicim-${u.id}`} etiket="Biçim" deger={bicim} onDegis={setBicim} secenekler={BICIMLER} />
        </div>
      )}
      {tur === "video" && (kapak || u.videoUrl) ? (
        <Satir ikon={ImageIcon} ad="Kare" alt="PNG · videonun bir karesi" yukleniyor={is === "kare"} onClick={() => calistir("kare", () => kareIndir(u, !filigransiz))} />
      ) : null}
      {tur === "model" && kapak && (
        <Satir ikon={ImageIcon} ad="Önizleme görseli" alt="PNG · modelin kapağı" yukleniyor={is === "kapak"} onClick={() => calistir("kapak", () => kareIndir({ ...u, videoUrl: undefined }, !filigransiz))} />
      )}

      {kaynak && (
        <div className="mt-0.5 border-t border-white/[0.06] pt-1">
          <button type="button" onClick={() => setSablonAcik((v) => !v)} aria-expanded={sablonAcik}
            className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.06]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-metin"><Columns2 className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[13.5px] font-medium text-metin">Önce ve sonra şablonuyla indir</span>
              <span className="block text-[12px] text-metin-2">Kaynakla sonucu tek görselde karşılaştır</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-metin-2 transition-transform", sablonAcik && "rotate-180")} />
          </button>
          <AnimatePresence initial={false}>
            {sablonAcik && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-2 gap-2 px-2 pb-2 pt-1">
                  {([["yanyana", "Yan yana", Columns2], ["surgulu", "Sürgülü", SplitSquareHorizontal]] as [OnceSonraSablon, string, React.ElementType][]).map(([id, ad, I]) => (
                    <motion.button key={id} type="button" whileTap={{ scale: 0.96 }} disabled={!!is} onClick={() => calistir(id, () => onceSonraIndir(u, id, !filigransiz))}
                      className="group overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.08] transition hover:ring-white/40 disabled:opacity-60">
                      <SablonOnizleme sablon={id} once={kaynak.tur === "gorsel" ? kaynak.url : undefined} sonra={kapak} />
                      <span className="flex items-center gap-1.5 px-2 py-1.5 text-[12.5px] font-medium text-metin">
                        {is === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <I className="h-3.5 w-3.5 text-metin-2" />}{ad}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {tur !== "ses" && (
        <div className="mt-0.5 flex items-center gap-3 border-t border-white/[0.06] px-2 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-metin-2"><Stamp className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin">
              Filigransız
              {!hak && (
                <Link href="/panel/ayarlar/abonelik" onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 rounded-full bg-aksan/15 px-2 py-0.5 text-[11px] font-semibold text-aksan ring-1 ring-inset ring-aksan/30 transition hover:bg-aksan/25">
                  <Lock className="h-3 w-3" />Artı planla
                </Link>
              )}
            </span>
            <span className={cn("block text-[12px]", filigransiz ? "text-aksan" : "text-metin-2")}>
              {!hak ? "Başlangıç planında Vayra işareti eklenir" : filigransiz ? "Açık: işaretsiz iner" : "Kapalı: Vayra işareti eklenir"}
              {tur === "video" ? ". Kare indirmelerinde uygulanır" : ""}
            </span>
          </span>
          <Anahtar acik={filigransiz} kilitli={!hak} onDegis={(v) => filigransizAyarla(v)} etiket="Filigransız" />
        </div>
      )}
    </div>
  );
}

function Satir({ ikon: I, ad, alt, onClick, yukleniyor }: { ikon: React.ElementType; ad: string; alt: string; onClick: () => void; yukleniyor?: boolean }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClick} disabled={yukleniyor}
      className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.06] disabled:opacity-70">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-metin">
        {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <I className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[13.5px] font-medium text-metin">{ad}</span>
        <span className="block truncate text-[12px] text-metin-2">{alt}</span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-metin-2" />
    </motion.button>
  );
}

/** Şablonun küçük önizlemesi — gerçek önce ve sonra görselleriyle. */
function SablonOnizleme({ sablon, once, sonra }: { sablon: OnceSonraSablon; once?: string; sonra?: string }) {
  const bg = (u?: string) => (u ? `url("${u}") center/cover no-repeat, #1b1c1f` : "linear-gradient(135deg,#24262b,#17181b)");
  if (sablon === "yanyana") {
    return (
      <span className="flex aspect-[16/10] gap-[2px] bg-[#0d0e10]">
        <span className="relative flex-1" style={{ background: bg(once) }}><Etiket>Önce</Etiket></span>
        <span className="relative flex-1" style={{ background: bg(sonra) }}><Etiket>Sonra</Etiket></span>
      </span>
    );
  }
  return (
    <span className="relative block aspect-[16/10] overflow-hidden" style={{ background: bg(sonra) }}>
      <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden"><span className="absolute inset-y-0 left-0 w-[200%]" style={{ background: bg(once) }} /></span>
      <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white" />
      <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      <Etiket>Önce</Etiket><Etiket sag>Sonra</Etiket>
    </span>
  );
}
const Etiket = ({ children, sag }: { children: React.ReactNode; sag?: boolean }) => (
  <span className={cn("absolute top-1 rounded-full bg-black/60 px-1.5 text-[9.5px] font-semibold leading-[15px] text-white", sag ? "right-1" : "left-1")}>{children}</span>
);
