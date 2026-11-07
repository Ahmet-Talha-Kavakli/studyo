"use client";

import { useState, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCw, Workflow, MoreHorizontal, PersonStanding, Pencil, Download,
  Tag, Copyright, Trash2, Share2, Printer, Plug, ChevronRight, Check,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { DCC_HEDEFLERI, UC_BOYUT_FORMATLARI } from "@/lib/uc-boyut";
import type { Uretim } from "@/store/useProjeler";
import { cn, saltUrl } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";

/**
 * Sağ galeri model kartı — Meshy birebir: thumbnail + hover'da 3 yuvarlak
 * aksiyon (yeniden üret / remesh / ⋯ context menü) + tarih + x4 varyant rozeti.
 * Context menü çok-katmanlı: Animasyon / Düzenle / Yazdır / DCC / Paylaş / İndir…
 */
export function Model3DKarti({
  u, aktif, onSec, onAnimasyon, onIndir, onSil, onYenidenUret,
  onYenidenAdlandir, onEtiket, onLisans, onAltAksiyon, onYayinla,
}: {
  u: Uretim;
  aktif: boolean;
  onSec: () => void;
  onAnimasyon: () => void;
  onIndir: () => void;
  onSil: () => void;
  onYenidenUret: () => void;
  onYenidenAdlandir: () => void;
  onEtiket: () => void;
  onLisans: () => void;
  onAltAksiyon: (kategori: string, oge: string) => void;
  onYayinla: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [altMenu, setAltMenu] = useState<string | null>(null);
  const [menuKonum, setMenuKonum] = useState<{ x: number; y: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Menüyü butonun ekran konumuna göre fixed konumlandır (overflow-hidden kırpmasını aşar).
  const menuAc = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menu) { setMenu(false); return; }
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (r) {
      const menuG = 200, menuY = 340;
      // Sağ kenardan taşarsa sola, alt kenardan taşarsa yukarı aç.
      const x = Math.min(r.right, window.innerWidth - 12) - menuG;
      const y = r.top - menuY > 12 ? r.top - menuY : Math.min(r.bottom, window.innerHeight - menuY - 12);
      setMenuKonum({ x: Math.max(12, x), y: Math.max(12, y) });
    }
    setMenu(true);
  };

  return (
    <div onClick={onSec}
      className={cn("group relative cursor-pointer overflow-hidden rounded-xl border bg-yuzey transition-all",
        aktif ? "border-aksan ring-1 ring-aksan/40" : "border-white/[0.06] hover:border-white/[0.12]")}>
      {(() => {
        // thumbnailUrl ham; gorselUrl ham/CSS/gradyan olabilir → saltUrl ile temiz görsel çıkar.
        const gorsel = u.thumbnailUrl ?? saltUrl(u.gorselUrl);
        return (
          <div className="relative aspect-square w-full overflow-hidden rounded-t-xl"
            style={!gorsel && u.gorselUrl ? { background: u.gorselUrl } : undefined}>
            {gorsel ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gorsel} alt={u.baslik} className="h-full w-full object-cover" />
            ) : null}

        {/* Varyant rozeti */}
        {u.varyasyonlar && u.varyasyonlar.length > 1 && (
          <span className="absolute bottom-2 left-2 rounded bg-aksan px-1.5 py-0.5 text-[10px] font-bold text-zemin">
            x{u.varyasyonlar.length}
          </span>
        )}
        {u.animasyonlar && u.animasyonlar.length > 0 && (
          <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full glass-ikon text-aksan ">
            <PersonStanding className="h-3.5 w-3.5" />
          </span>
        )}

        {/* Hover aksiyon rayı */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-zemin/85 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <RayBtn ikon={RotateCw} etiket="Yeniden üret" onClick={(e) => { e.stopPropagation(); onYenidenUret(); }} />
          <RayBtn ikon={Workflow} etiket="Remesh" onClick={(e) => { e.stopPropagation(); onAltAksiyon("duzenle", "Remesh"); }} />
          <div className="relative">
            <RayBtn ref={menuBtnRef} ikon={MoreHorizontal} etiket="Daha fazla" onClick={menuAc} />
          </div>
        </div>
          </div>
        );
      })()}
      <div className="truncate px-2.5 py-2 text-xs font-medium text-metin">{u.baslik}</div>

      {/* Context menü — body'ye portal + fixed konum (overflow-hidden/scroll kırpmasını aşar) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {menu && menuKonum && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={(e) => { e.stopPropagation(); setMenu(false); setAltMenu(null); }} />
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ left: menuKonum.x, top: menuKonum.y }}
                className="menu-surface fixed z-[91] max-h-[70vh] w-52 overflow-y-auto rounded-xl p-1.5 text-sm [scrollbar-width:thin]">
                <MenuOge ikon={PersonStanding} ad="Animasyon ekle" onClick={() => { onAnimasyon(); setMenu(false); }} />
                <AltMenu ad="Düzenle" ikon={Pencil} acik={altMenu === "duzenle"} onToggle={() => setAltMenu(altMenu === "duzenle" ? null : "duzenle")}
                  ogeler={["Doku düzenle", "Yeniden dokuma", "Remesh", "Rig & Vinç"]}
                  onSec={(o) => { onAltAksiyon("duzenle", o); setMenu(false); }} />
                <AltMenu ad="Yazdır" ikon={Printer} acik={altMenu === "yazdir"} onToggle={() => setAltMenu(altMenu === "yazdir" ? null : "yazdir")}
                  ogeler={["Çok renkli baskı", "Taban ekle", "Tam renkli 3D baskı"]}
                  onSec={(o) => { onAltAksiyon("yazdir", o); setMenu(false); }} />
                <AltMenu ad="DCC Köprüsü" ikon={Plug} acik={altMenu === "dcc"} onToggle={() => setAltMenu(altMenu === "dcc" ? null : "dcc")}
                  ogeler={DCC_HEDEFLERI.filter((d) => d.aktif).map((d) => `${d.ad}'a gönder`)}
                  onSec={(o) => { onAltAksiyon("dcc", o); setMenu(false); }} />
                <AltMenu ad="Paylaş" ikon={Share2} acik={altMenu === "paylas"} onToggle={() => setAltMenu(altMenu === "paylas" ? null : "paylas")}
                  ogeler={["Bağlantı paylaş", "Topluluğa yayınla", "Sketchfab'da yayınla"]}
                  onSec={(o) => { if (o === "Topluluğa yayınla") onYayinla(); else onAltAksiyon("paylas", o); setMenu(false); }} />
                <MenuOge ikon={Download} ad="İndir" onClick={() => { onIndir(); setMenu(false); }} />
                <div className="my-1 h-px bg-white/10" />
                <MenuOge ikon={Pencil} ad="Yeniden adlandır" onClick={() => { onYenidenAdlandir(); setMenu(false); }} />
                <MenuOge ikon={Tag} ad="Etiket ekle" sag={u.etiketler?.length ? `${u.etiketler.length}` : undefined} onClick={() => { onEtiket(); setMenu(false); }} />
                <MenuOge ikon={Copyright} ad="Lisansı değiştir" sag={u.meta?.oran === "cc" ? "CC BY 4.0" : "Özel"} onClick={() => { onLisans(); setMenu(false); }} />
                <MenuOge ikon={Trash2} ad="Sil" kirmizi onClick={() => { onSil(); setMenu(false); }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

const RayBtn = forwardRef<HTMLButtonElement, { ikon: typeof RotateCw; etiket: string; onClick: (e: React.MouseEvent) => void }>(
  function RayBtn({ ikon: Ikon, etiket, onClick }, ref) {
    return (
      <Tooltip label={etiket} side="left">
        <button ref={ref} onClick={onClick} aria-label={etiket}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full glass-ikon text-white/90 transition-colors">
          <Ikon className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    );
  }
);

function MenuOge({ ikon: Ikon, ad, sag, kirmizi, onClick }: { ikon: typeof Pencil; ad: string; sag?: string; kirmizi?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.06]",
        kirmizi ? "text-rose-400" : "text-metin")}>
      <Ikon className="h-4 w-4 shrink-0" /> <span className="flex-1">{ad}</span>
      {sag && <span className="text-xs text-metin-3">{sag}</span>}
    </button>
  );
}

function AltMenu({ ad, ikon: Ikon, acik, onToggle, ogeler, onSec }: { ad: string; ikon: typeof Pencil; acik: boolean; onToggle: () => void; ogeler: string[]; onSec: (oge: string) => void }) {
  return (
    <div>
      <button onClick={onToggle} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-metin transition-colors hover:bg-white/[0.06]">
        <Ikon className="h-4 w-4 shrink-0" /> <span className="flex-1">{ad}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-90")} />
      </button>
      {acik && (
        <div className="ml-6 border-l border-white/10 pl-1.5">
          {ogeler.map((o) => (
            <button key={o} onClick={() => onSec(o)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs text-metin-2 transition-colors hover:bg-white/[0.05] hover:text-white">
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** İndirme Ayarları modalı — Meshy birebir: format + karakter/animasyon toggle. */
export function IndirmeModal({ acik, onKapat, baslik, glbUrl }: { acik: boolean; onKapat: () => void; baslik: string; glbUrl?: string }) {
  const [format, setFormat] = useState("GLB");
  const [duzenlenmis, setDuzenlenmis] = useState(false);
  const [tekDosya, setTekDosya] = useState(false);
  const [anim, setAnim] = useState("tum");

  const dosyaIndir = (href: string, adSonek: string) => {
    const a = document.createElement("a");
    a.href = href; a.download = `${baslik.slice(0, 40).replace(/[^\w\s-]/g, "")}.${adSonek}`; a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
  };

  const indir = () => {
    if (glbUrl) {
      // Gerçek Meshy GLB varsa doğrudan onu indir.
      dosyaIndir(glbUrl, format.toLowerCase());
      toast.success(`Model ${format} olarak indiriliyor`, { description: baslik });
    } else {
      // Sağlayıcıdan gelmiş bir model dosyası yoksa yer tutucu dosya üretilmez.
      return void toast.error("İndirilecek model dosyası yok", { description: "Bu kayıtta sağlayıcıdan gelmiş bir 3D dosyası bulunmuyor." });
    }
    onKapat();
  };

  return (
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="perde fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onKapat} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="menu-surface fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">İndirme Ayarları</h3>
              <button onClick={onKapat} className="text-metin-3 hover:text-white"><Download className="hidden" /><span className="text-lg leading-none">×</span></button>
            </div>

            <label className="mb-1.5 block text-xs text-metin-2">Biçim</label>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {UC_BOYUT_FORMATLARI.map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    format === f ? "bg-aksan text-zemin" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>{f}</button>
              ))}
            </div>

            <ModalToggle ad="Düzenlenmiş karakter" acik={duzenlenmis} onToggle={() => setDuzenlenmis((v) => !v)} />
            <div className="my-2 flex items-center justify-between text-sm">
              <span className="text-metin">Animasyon</span>
              <div className="flex gap-1 rounded-lg bg-white/6 p-0.5">
                {[["mevcut", "Mevcut"], ["tum", "Tüm eklendi"]].map(([id, ad]) => (
                  <button key={id} onClick={() => setAnim(id)}
                    className={cn("rounded-md px-2 py-1 text-xs transition-colors", anim === id ? "bg-aksan text-zemin" : "text-metin-2")}>{ad}</button>
                ))}
              </div>
            </div>
            <ModalToggle ad="Tek dosya" acik={tekDosya} onToggle={() => setTekDosya((v) => !v)} />

            <button onClick={indir}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-2.5 text-sm font-semibold text-zemin transition-transform hover:scale-[1.02]">
              <Download className="h-4 w-4" /> İndir
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ModalToggle({ ad, acik, onToggle }: { ad: string; acik: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center justify-between py-2 text-sm">
      <span className="text-metin">{ad}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", acik ? "bg-white" : "bg-white/15")}>
        <span className={cn("absolute left-0 top-0.5 h-4 w-4 rounded-full transition-all", acik ? "left-[18px] bg-[#0a0a0b]" : "left-0.5 bg-white")} />
      </span>
    </button>
  );
}
