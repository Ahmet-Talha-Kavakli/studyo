"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Sparkles, PencilLine, RotateCcw, Share2, Trash2, MoreHorizontal, Loader2, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { useKarakterler, type Karakter } from "@/store/useKarakterler";

/* ============================================================
   KARAKTERLER — Higgsfield /character BİREBİR.

   Boş durum: ortada dev "KENDİ KARAKTERİNİ OLUŞTUR" + lime CTA.
   Dolu durum: aynı hero + altta kart ızgarası.
   Kart: SOUL rozeti (sol üst) · hover'da ortada lime "Üret" ·
         altta "N fotoğraf" + ad + ⋯ menü
         (Kapağı düzenle / Yeniden kullan / Ekiple paylaş / Sil).
   ============================================================ */

const LIME = "var(--sn-lime)";

export default function KarakterlerSayfa() {
  const karakterler = useKarakterler((s) => s.karakterler);
  const guncelle = useKarakterler((s) => s.guncelle);

  /* Eğitim ilerlemesi — "egitiliyor" durumundaki karakterleri ilerlet.
     Gerçek bir kuyruk simülasyonu: her karakter kendi hızında biter. */
  useEffect(() => {
    const egitilen = karakterler.filter((k) => k.durum === "egitiliyor");
    if (!egitilen.length) return;
    const t = setInterval(() => {
      egitilen.forEach((k) => {
        const yeni = Math.min(100, k.ilerleme + 4 + (k.fotolar.length % 3));
        guncelle(k.id, yeni >= 100 ? { ilerleme: 100, durum: "hazir" } : { ilerleme: yeni });
        if (yeni >= 100) toast.success(`${k.ad} hazır ✦`, { description: "Artık tüm üretimlerde kullanabilirsin." });
      });
    }, 700);
    return () => clearInterval(t);
  }, [karakterler, guncelle]);

  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-[var(--sn-zemin)] text-[var(--sn-metin)]">
      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center px-4 pb-10 pt-10 text-center sm:pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="hf-baslik text-[26px] uppercase text-white sm:text-6xl sm:normal-case"
        >
          Kendi Karakterini Oluştur
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--sn-metin-2)]"
        >
          Karakterini eğitmek için farklı açılardan fotoğraflar yükle.
          Sonra aynı tutarlı karakteri yeni görsellerde ve videolarda kullan.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Link
            href="/panel/karakter/yeni"
            className="hf-uret hf-btn mt-8 inline-flex items-center gap-2 px-7 py-3.5 text-[16px] font-bold"
          >
            Karakter oluştur <Sparkles className="h-[18px] w-[18px]" />
          </Link>
        </motion.div>
      </section>

      {/* ═══ KART IZGARASI ═══ */}
      {karakterler.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-6 pb-24">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {karakterler.map((k, i) => <KarakterKarti key={k.id} k={k} gecikme={i * 0.04} />)}
          </div>
        </section>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KARAKTER KARTI
   ══════════════════════════════════════════════════════════════ */

function KarakterKarti({ k, gecikme }: { k: Karakter; gecikme: number }) {
  const router = useRouter();
  const sil = useKarakterler((s) => s.sil);
  const guncelle = useKarakterler((s) => s.guncelle);
  const [menu, setMenu] = useState(false);
  const [kapakSecici, setKapakSecici] = useState(false);
  const [konum, setKonum] = useState<{ top: number; left: number } | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);

  const kapak = k.fotolar.find((f) => f.id === k.kapakId) ?? k.fotolar[0];
  const arka = kapak?.url ?? onizlemeArka(k.id, "portre");
  const hazir = k.durum === "hazir";

  const menuAc = () => {
    if (menu) return setMenu(false);
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (r) {
      const gen = 200, yuk = 190;
      setKonum({
        top: Math.max(12, Math.min(r.bottom + 6, window.innerHeight - 12 - yuk)),
        left: Math.max(12, Math.min(r.right - gen, window.innerWidth - 12 - gen)),
      });
    }
    setMenu(true);
  };

  /* "Üret" → karakteri @mention olarak görsel stüdyosuna taşı. */
  const uret = () => {
    if (!hazir) return toast("Karakter hâlâ eğitiliyor", { description: `%${k.ilerleme} tamamlandı` });
    try { sessionStorage.setItem("vayra-gecis-prompt", `@${k.ad.replace(/\s+/g, "")} `); } catch { /* yoksay */ }
    toast.success(`${k.ad} ile üretim`, { description: "Görsel stüdyosuna taşındı" });
    router.push("/panel/gorsel");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: gecikme }}
      className="group relative aspect-[3/4] overflow-hidden rounded-[18px]"
      style={{ background: arka }}
    >
      {saltUrl(arka) && (
        <img src={saltUrl(arka)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {/* alt karartma — ad okunabilirliği */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 to-transparent" />
      {/* hover karartma */}
      <span className="pointer-events-none absolute inset-0 bg-black/35 opacity-0 transition-opacity group-hover:opacity-100" />

      {/* ── SOUL rozeti (sol üst, italik, lime) ── */}
      <span
        className="absolute left-3 top-3 rounded-[5px] px-2 py-[3px] text-[11px] font-extrabold italic tracking-tight"
        style={{ background: LIME, color: "#0a0a0a" }}
      >
        {k.model.toLocaleUpperCase("tr")}
      </span>

      {/* ── Eğitim durumu ── */}
      {!hazir && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/55">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: LIME }} />
          <span className="text-[12px] font-medium text-white">Eğitiliyor · %{k.ilerleme}</span>
          <span className="h-1 w-24 overflow-hidden rounded-full bg-white/20">
            <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${k.ilerleme}%`, background: LIME }} />
          </span>
        </div>
      )}

      {/* ── Hover: ortada lime "Üret" ── */}
      {hazir && (
        <button
          onClick={uret}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-[14px] px-6 py-3.5 text-[17px] font-semibold opacity-0 backdrop-blur-md transition-all group-hover:opacity-100"
          style={{ background: "rgba(85, 214, 253,0.16)", color: LIME, border: `1px solid ${LIME}55` }}
        >
          <Sparkles className="h-5 w-5" /> Üret
        </button>
      )}

      {/* ── Alt bilgi ── */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
        <span className="min-w-0">
          <span className="block text-[12px] text-white/65">{k.fotolar.length} fotoğraf</span>
          <span className="block truncate text-[16px] font-semibold text-white">{k.ad}</span>
        </span>
        <button
          ref={menuBtnRef}
          onClick={(e) => { e.stopPropagation(); menuAc(); }}
          aria-label="Daha fazla"
          className="hf-btn shrink-0 rounded-lg p-1 text-white/80 transition-colors hover:text-white"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* ── ⋯ MENÜ (portal) ──
          AnimatePresence portalın İÇİNDE olmalı: dışarıda olduğunda
          createPortal'ın döndürdüğü düğümü çocuk olarak takip edemiyor
          ve menü hiç render edilmiyordu. */}
      {portalHazir && createPortal(
        <AnimatePresence>
          {menu && konum && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                style={{ position: "fixed", top: konum.top, left: konum.left }}
                className="sinema-kapsam menu-surface z-[61] w-[200px] rounded-2xl p-1.5"
              >
                <MenuSatir ikon={PencilLine} ad="Kapağı düzenle"
                  onClick={() => { setMenu(false); setKapakSecici(true); }} />
                <MenuSatir ikon={RotateCcw} ad="Yeniden kullan"
                  onClick={() => { setMenu(false); uret(); }} />
                <MenuSatir ikon={Share2} ad="Ekiple paylaş"
                  onClick={() => {
                    guncelle(k.id, { paylasildi: !k.paylasildi });
                    toast.success(k.paylasildi ? "Ekip paylaşımı kaldırıldı" : "Ekiple paylaşıldı", { description: k.ad });
                    setMenu(false);
                  }} />
                <div className="my-1 h-px bg-white/8" />
                <MenuSatir ikon={Trash2} ad="Sil" tehlike
                  onClick={() => { sil(k.id); toast("Karakter silindi", { description: k.ad }); setMenu(false); }} />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* ── KAPAK SEÇİCİ ── */}
      {portalHazir && createPortal(
        <AnimatePresence>
          {kapakSecici && <KapakSecici k={k} onKapat={() => setKapakSecici(false)} />}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}

function MenuSatir({ ikon: Ikon, ad, onClick, tehlike }: {
  ikon: typeof PencilLine; ad: string; onClick: () => void; tehlike?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium transition-colors",
        tehlike ? "text-tehlike hover:bg-tehlike/10" : "text-white hover:bg-white/8",
      )}
    >
      <Ikon className={cn("h-[17px] w-[17px]", !tehlike && "text-white/70")} /> {ad}
    </button>
  );
}

/* ── Kapak seçici modalı — "Kapağı düzenle" gerçek bir iş yapar ── */
function KapakSecici({ k, onKapat }: { k: Karakter; onKapat: () => void }) {
  const kapakSec = useKarakterler((s) => s.kapakSec);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onKapat]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="sinema-kapsam fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onKapat}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] overflow-hidden rounded-[20px] border border-white/10 bg-[var(--sn-yuzey)]"
      >
        <div className="border-b border-[var(--sn-kenar)] px-6 py-4">
          <h2 className="hf-baslik text-[18px] text-white">Kapağı Seç</h2>
          <p className="mt-1 text-[13px] text-[var(--sn-metin-2)]">{k.ad} kartında hangi fotoğraf görünsün?</p>
        </div>
        <div className="grid max-h-[60vh] grid-cols-4 gap-2.5 overflow-y-auto p-5 sm:grid-cols-5">
          {k.fotolar.map((f) => {
            const secili = (k.kapakId ?? k.fotolar[0]?.id) === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { kapakSec(k.id, f.id); toast.success("Kapak güncellendi"); onKapat(); }}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-xl transition-all",
                  secili ? "ring-2" : "opacity-80 hover:opacity-100",
                )}
                style={secili ? { boxShadow: `0 0 0 2px ${LIME}` } : undefined}
              >
                <img src={f.url} alt="" className="h-full w-full object-cover" />
                {secili && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: LIME }}>
                    <Check className="h-3 w-3 text-black" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
