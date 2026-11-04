"use client";

/* Görsel kartlarının hover araç rayı — Görsel stüdyosu ve Kitaplık aynı rayı kullanır. */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, AtSign, Box, Briefcase, Check, ChevronRight, Copy, Download, FileArchive, FileImage, FileType2, FolderPlus, Heart, ImagePlus, Link2,
  Expand, Maximize2, MessageCircle, MoreHorizontal, Pin, Plus, RefreshCw, Share2, Shuffle, Trash2, Upload, Video as VideoIcon,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { kopyala } from "@/lib/gercekEylem";
import { cn, saltUrl } from "@/lib/utils";

/* ═══ KART ARAÇLARI — hover'da çıkan araç ray'ı. Kartın GERÇEK boyutuna göre
   ölçeklenir (Y2), üç-nokta menüsü Higgsfield birebir (Y4), paylaş alt-menüsü
   kartın ekrandaki konumuna göre sağa/sola açılır (Y3). ═══ */
export function KartAraclari({
  begenili, onBegen, onIndir, onKopyala, onAc, onYenidenUret,
  onReferans, onAnimate, on3d, onVaryasyon, onBuyut, onElement, onYayinla, onKlasor, onSil,
  klasorler, onKlasoreEkle, onYeniKlasor, indirmeFormatlari, onFormatIndir, gorselUrl, klasorAdi = "klasör",
}: {
  /** Hedef adı: stüdyoda "klasör", kitaplıkta "proje". */
  klasorAdi?: "klasör" | "proje";
  begenili: boolean;
  /** Kopyala/yeniden üret/yayınla/sil yalnız kendi üretimlerinde verilir; örnek görselde menüde çıkmaz. */
  onBegen: () => void; onIndir: () => void; onKopyala?: () => void; onAc: () => void; onYenidenUret?: () => void;
  /** Paylaşılacak görselin adresi (sayfa adresi değil). */
  gorselUrl?: string;
  onReferans?: () => void; onAnimate?: () => void; on3d?: () => void;
  /** Varyasyon: "hafif" kompozisyonu korur, "guclu" kadrajı/pozu değiştirir. */
  onVaryasyon?: (guc: "hafif" | "guclu") => void;
  /** Büyüt stüdyosunda aç. */
  onBuyut?: () => void;
  onElement?: () => void; onYayinla?: () => void; onKlasor?: () => void; onSil?: () => void;
  /** GERÇEK klasör listesi — "Klasöre ekle" hover'ında yandan açılır (madde 1). */
  klasorler?: { id: string; ad: string; adet: number }[];
  onKlasoreEkle?: (id: string) => void;
  onYeniKlasor?: () => void;
  /** İndirme formatları — "İndir" hover'ında yandan açılır (madde 2). */
  indirmeFormatlari?: string[];
  onFormatIndir?: (format: string) => void;
}) {
  const [menuAcik, setMenuAcik] = useState(false);
  const [paylasAcik, setPaylasAcik] = useState(false);
  const [klasorAcik, setKlasorAcik] = useState(false);
  const [indirAcik, setIndirAcik] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const kokRef = useRef<HTMLDivElement>(null);
  const [menuKonum, setMenuKonum] = useState<{ top: number; left: number; paylasSaga: boolean } | null>(null);
  // Kartın gerçek genişliğini ölç → araç boyutunu ORANTILI seç (Y2: her zaman sığar).
  const [kartGen, setKartGen] = useState(240);
  const [kartYuk, setKartYuk] = useState(300);
  useEffect(() => {
    const el = kokRef.current?.parentElement; // .group kart div'i
    if (!el) return;
    const olc = () => { setKartGen(el.clientWidth); setKartYuk(el.clientHeight); };
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const boyutSinif: "kucuk" | "orta" | "buyuk" = kartGen < 150 ? "kucuk" : kartGen < 230 ? "orta" : "buyuk";
  // Kart KISA/yatay ise (4 dikey ikon sığmıyor) → ray'ı yatay yap. Buton yüksekliği ~28-40px;
  // 4 ikon + alt-orta 3 ikon dikeyde ~ kartYuk gerektirir. Eşik: 4 buton + boşluk < kartYuk.
  const btnPx = boyutSinif === "kucuk" ? 24 : boyutSinif === "orta" ? 32 : 36;
  const yatayRay = kartYuk < btnPx * 4 + 40; // dikey 4 ikon + üst/alt pay sığmıyorsa yatay diz

  const menuRef = useRef<HTMLDivElement>(null);
  // Açık menü: sayfa ya da herhangi bir kaydırma alanı kayınca, pencere boyutu değişince ve Esc'te kapanır
  // (eskiden sabit koordinatta ekranda asılı kalıyordu).
  useEffect(() => {
    if (!menuAcik) return;
    const kapat = () => setMenuAcik(false);
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    window.addEventListener("scroll", kapat, true);
    window.addEventListener("resize", kapat);
    window.addEventListener("keydown", tus);
    return () => { window.removeEventListener("scroll", kapat, true); window.removeEventListener("resize", kapat); window.removeEventListener("keydown", tus); };
  }, [menuAcik]);
  // Menü çizildikten sonra yüksekliğini ölç: alta taşıyorsa yukarı kaydır (ekrana sığdır).
  useLayoutEffect(() => {
    if (!menuAcik || !menuKonum || !menuRef.current) return;
    const h = menuRef.current.offsetHeight;
    const sinir = window.innerHeight - 8;
    if (menuKonum.top + h > sinir) setMenuKonum((k) => (k ? { ...k, top: Math.max(8, sinir - h) } : k));
  }, [menuAcik, menuKonum]);
  // Menüyü aç: fixed koordinat + paylaş alt-menüsünün yönünü kartın konumuna göre belirle (Y3).
  const menuAc = () => {
    const r = menuBtnRef.current?.getBoundingClientRect();
    if (r) {
      const menuGen = 224;
      const sagaSigar = r.right + 8 + menuGen < window.innerWidth;
      const left = sagaSigar ? r.right + 8 : r.left - 8 - menuGen;
      // Paylaş alt-menüsü: ana menü ekranın sol yarısındaysa sağa, sağ yarısındaysa sola aç.
      // Alt menüler (Paylaş, Klasör, İndir ~240px): sağda yer varsa sağa, yoksa sola açılır.
      const paylasSaga = left + menuGen + 8 + 244 < window.innerWidth;
      setMenuKonum({ top: r.top, left, paylasSaga });
    }
    setMenuAcik((v) => !v);
  };
  // Paylaşım hedefleri (Higgsfield Share alt-menüsü birebir) — her biri ikonlu
  // Paylaşılan şey görselin kendisi: http(s)/göreli adres mutlaklaştırılır; data: adresi paylaşılamaz → sayfa adresi.
  const paylasAdresi = () => {
    if (typeof location === "undefined") return "";
    const u = gorselUrl ? (saltUrl(gorselUrl) ?? gorselUrl) : "";
    if (u.startsWith("http")) return u;
    if (u.startsWith("/")) return new URL(u, location.origin).href;
    return location.href;
  };
  const ac = (adres: string) => { if (typeof window !== "undefined") window.open(adres, "_blank", "noopener"); };
  const paylasHedefleri: { ad: string; ikon: typeof Link2; fn: () => void }[] = [
    { ad: "Bağlantıyı kopyala", ikon: Link2, fn: () => { void kopyala(paylasAdresi(), "Görsel bağlantısı kopyalandı"); } },
    { ad: "X'te paylaş", ikon: AtSign, fn: () => ac("https://twitter.com/intent/tweet?url=" + encodeURIComponent(paylasAdresi())) },
    { ad: "WhatsApp'ta paylaş", ikon: MessageCircle, fn: () => ac("https://wa.me/?text=" + encodeURIComponent(paylasAdresi())) },
    { ad: "Pinterest'te paylaş", ikon: Pin, fn: () => ac("https://pinterest.com/pin/create/button/?url=" + encodeURIComponent(paylasAdresi()) + "&media=" + encodeURIComponent(paylasAdresi())) },
    { ad: "LinkedIn'de paylaş", ikon: Briefcase, fn: () => ac("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(paylasAdresi())) },
  ];
  // Kutu boyutuna göre buton + ikon ölçekleri (Y2)
  const btn = boyutSinif === "kucuk" ? "h-6 w-6" : boyutSinif === "orta" ? "h-8 w-8" : "h-9 w-9";
  const ik = boyutSinif === "kucuk" ? "h-3 w-3" : boyutSinif === "orta" ? "h-4 w-4" : "h-[18px] w-[18px]";
  const yerlesim = boyutSinif === "kucuk" ? "gap-1 right-1.5 top-1.5" : "gap-1.5 right-2 top-2";
  const rayYon = yatayRay ? "flex-row" : "flex-col"; // kısa kartta yatay diz (üç-nokta hep görünür)
  const IK = (Ikon: typeof Heart, etiket: string, fn: () => void, ekstra = "") => (
    <Tooltip label={etiket} side="left">
      <button onClick={(e) => { e.stopPropagation(); fn(); }} aria-label={etiket}
        className={cn("hf-btn glass-ikon flex items-center justify-center rounded-full text-white", btn, ekstra)}>
        <Ikon className={ik} />
      </button>
    </Tooltip>
  );
  const altBtn = boyutSinif === "kucuk" ? "h-6 w-6" : boyutSinif === "orta" ? "h-8 w-8" : "h-9 w-9";
  const altIk = boyutSinif === "kucuk" ? "h-3 w-3" : "h-4 w-4";
  const AltIK = (Ikon: typeof Heart, etiket: string, fn?: () => void, gizli = false) => (
    !gizli && fn ? (
      <Tooltip label={etiket} side="left">
        <button onClick={(e) => { e.stopPropagation(); fn(); }} aria-label={etiket}
          className={cn("hf-btn glass-ikon flex items-center justify-center rounded-full text-white hover:bg-white hover:text-black", altBtn)}>
          <Ikon className={altIk} />
        </button>
      </Tooltip>
    ) : null
  );

  // Higgsfield birebir menü sırası (Y4): Aç · Yeniden üret · Yeniden kullan · Element oluştur ·
  // Beğen · Paylaş> · Klasöre ekle> · Yayınla · İndir · —— · Sil
  const menuSatir = (Ikon: typeof Maximize2, ad: string, fn: () => void, tehlike = false) => (
    <button onClick={() => { fn(); setMenuAcik(false); }}
      className={cn("flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium transition-colors",
        tehlike ? "text-tehlike hover:bg-tehlike/10" : "text-white hover:bg-white/8")}>
      <Ikon className={cn("h-[18px] w-[18px]", tehlike ? "" : "text-white/70")} /> {ad}
    </button>
  );

  return (
    <div ref={kokRef}>
    {/* Alt-orta hızlı eylemler (Referans · Animate · 3D). Kısa/yatay kartta gizlenir —
        dikey ray yatayken çakışmasın; bu eylemler zaten ⋯ menüsünden erişilebilir. */}
    {(onReferans || onAnimate || on3d || onVaryasyon) && !yatayRay && (
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        {AltIK(Shuffle, "Varyasyon üret", onVaryasyon ? () => onVaryasyon("hafif") : undefined)}
        {AltIK(ImagePlus, "Referans olarak ekle", onReferans)}
        {AltIK(VideoIcon, "Animate (videoya çevir)", onAnimate)}
        {AltIK(Expand, "Büyüt", onBuyut, boyutSinif === "kucuk")}
        {AltIK(Box, "3D sahne oluştur", on3d, boyutSinif === "kucuk")}
      </div>
    )}
    {/* KALICI BEĞENİ ROZETİ (kullanıcı kararı 2026-07-31): beğenilmiş kartta
        kalp hover OLMADAN da görünür — /panel'deki galeri kartlarıyla aynı
        davranış. Araç rayının tamamı hover'a bağlı olduğu için beğeni durumu
        kartta hiç görünmüyordu; bu rozet yalnız beğeniliyken çıkar ve
        hover'da rayın kendi kalbine yerini bırakır (çift kalp olmasın). */}
    {begenili && (
      <span aria-hidden
        className={cn(
          "kart-begeni pointer-events-none absolute z-20 flex items-center justify-center rounded-full transition-opacity group-hover:opacity-0",
          // Rayın ilk butonuyla AYNI konum: hover'da rozet solup yerine ray
          // kalbi gelir, kayma hissi olmaz.
          boyutSinif === "kucuk" ? "right-1.5 top-1.5 h-6 w-6" : "right-2 top-2 h-8 w-8",
        )}>
        <Heart className={cn("fill-rose-400 text-rose-400", boyutSinif === "kucuk" ? "h-3 w-3" : "h-4 w-4")} />
      </span>
    )}
    <div className={cn("pointer-events-none absolute z-20 flex opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100", menuAcik && "pointer-events-auto opacity-100", rayYon, yerlesim)}>
      {IK(Heart, begenili ? "Beğeniyi kaldır" : "Beğen", onBegen, begenili ? "text-rose-400 [&>svg]:fill-current" : "")}
      {IK(Download, "İndir", onIndir)}
      {onKopyala && IK(Copy, "Yeniden kullan", onKopyala)}
      <div className="relative">
        <button ref={menuBtnRef} onClick={(e) => { e.stopPropagation(); menuAc(); }} aria-label="Daha fazla"
          className={cn("hf-btn glass-ikon flex items-center justify-center rounded-full text-white", btn)}>
          <MoreHorizontal className={ik} />
        </button>
        {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {menuAcik && menuKonum && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={(e) => { e.stopPropagation(); setMenuAcik(false); }} onContextMenu={(e) => { e.preventDefault(); setMenuAcik(false); }} />
              <motion.div ref={menuRef} role="menu" initial={{ opacity: 0, scale: 0.97, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }} transition={{ duration: 0.13 }}
                onClick={(e) => e.stopPropagation()}
                style={{ position: "fixed", top: menuKonum.top, left: menuKonum.left }}
                className="menu-surface z-[91] w-56 rounded-2xl p-1.5">
                {menuSatir(ArrowUpRight, "Aç", onAc)}
                {onYenidenUret && menuSatir(RefreshCw, "Yeniden üret", onYenidenUret)}
                {onKopyala && menuSatir(Copy, "Yeniden kullan", onKopyala)}
                {onVaryasyon && menuSatir(Shuffle, "Hafif varyasyon", () => onVaryasyon("hafif"))}
                {onVaryasyon && menuSatir(Shuffle, "Güçlü varyasyon", () => onVaryasyon("guclu"))}
                {onBuyut && menuSatir(Expand, "Büyüt", onBuyut)}
                {onReferans && menuSatir(ImagePlus, "Referans olarak ekle", onReferans)}
                {/* Bu kart bir ÜRETİM kaydı değilse (örnek görsel) ilgili eylem verilmez ve satır hiç çıkmaz. */}
                {onElement && menuSatir(AtSign, "Element oluştur", onElement)}
                {menuSatir(Heart, "Beğen", onBegen)}
                {/* Paylaş → alt-menü (Higgsfield Share birebir) — Y3: konuma göre sağa/sola */}
                <div className="relative"
                  onMouseEnter={() => setPaylasAcik(true)} onMouseLeave={() => setPaylasAcik(false)}>
                  <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                    <Share2 className="h-[18px] w-[18px] text-white/70" /> Paylaş
                    <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                  </button>
                  <AnimatePresence>
                    {paylasAcik && (
                      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                        className={cn("menu-surface absolute top-0 w-56 rounded-2xl p-1.5", menuKonum.paylasSaga ? "left-full ml-1.5" : "right-full mr-1.5")}>
                        {paylasHedefleri.map((h) => (
                          <button key={h.ad} onClick={() => { h.fn(); setPaylasAcik(false); setMenuAcik(false); }}
                            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                            <h.ikon className="h-[18px] w-[18px] text-white/70" /> {h.ad}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* KLASÖRE EKLE → alt-menü (madde 1, 2026-07-31).
                    Eskiden tek tıkla sabit "Görseller" klasörüne atıyordu — kullanıcı
                    haklı olarak "tamamen fake" dedi. Artık Paylaş ile aynı desende
                    GERÇEK klasör listesi açılır; yoksa yeni klasör kurulur. */}
                {!klasorler && !onKlasor ? null : klasorler && onKlasoreEkle ? (
                  <div className="relative"
                    onMouseEnter={() => setKlasorAcik(true)} onMouseLeave={() => setKlasorAcik(false)}>
                    <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                      <FolderPlus className="h-[18px] w-[18px] text-white/70" /> {klasorAdi === "proje" ? "Projeye ekle" : "Klasöre ekle"}
                      <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                    </button>
                    <AnimatePresence>
                      {klasorAcik && (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                          className={cn("menu-surface absolute bottom-0 max-h-64 w-60 overflow-y-auto rounded-2xl p-1.5", menuKonum.paylasSaga ? "left-full ml-1.5" : "right-full mr-1.5")}>
                          {klasorler.length === 0 && (
                            <p className="px-3 py-2 text-[13px] text-metin-3">Henüz {klasorAdi} yok</p>
                          )}
                          {klasorler.map((k) => (
                            <button key={k.id} onClick={() => { onKlasoreEkle(k.id); setKlasorAcik(false); setMenuAcik(false); }}
                              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                              <FolderPlus className="h-[18px] w-[18px] shrink-0 text-white/70" />
                              <span className="min-w-0 flex-1 truncate">{k.ad}</span>
                              <span className="shrink-0 text-[12px] tabular-nums text-white/40">{k.adet}</span>
                            </button>
                          ))}
                          {onYeniKlasor && (
                            <>
                              <div className="my-1 h-px bg-white/8" />
                              <button onClick={() => { onYeniKlasor(); setKlasorAcik(false); setMenuAcik(false); }}
                                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                                <Plus className="h-[18px] w-[18px]" /> {klasorAdi === "proje" ? "Yeni proje" : "Yeni klasör"}
                              </button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  onKlasor ? menuSatir(FolderPlus, "Klasöre ekle", onKlasor) : null
                )}
                {onYayinla && menuSatir(Upload, "Yayınla", onYayinla)}
                {/* İNDİR → alt-menü (madde 2). Hover'da format seçenekleri açılır;
                    doğrudan tıklanırsa varsayılan formatta iner. */}
                {indirmeFormatlari && onFormatIndir ? (
                  <div className="relative"
                    onMouseEnter={() => setIndirAcik(true)} onMouseLeave={() => setIndirAcik(false)}>
                    <button onClick={() => { onIndir(); setMenuAcik(false); }}
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] font-medium text-white transition-colors hover:bg-white/8">
                      <Download className="h-[18px] w-[18px] text-white/70" /> İndir
                      <ChevronRight className="ml-auto h-4 w-4 text-white/40" />
                    </button>
                    <AnimatePresence>
                      {indirAcik && (
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.12 }}
                          className={cn("menu-surface absolute bottom-0 w-56 rounded-2xl p-1.5", menuKonum.paylasSaga ? "left-full ml-1.5" : "right-full mr-1.5")}>
                          {indirmeFormatlari.map((f, i) => {
                            // Her formatın kendi ikonu + ne işe yaradığı (kullanıcı isteği).
                            const bilgi: Record<string, { ikon: typeof FileImage; not: string }> = {
                              png: { ikon: FileImage, not: "kayıpsız · saydam" },
                              jpg: { ikon: FileType2, not: "küçük dosya" },
                              webp: { ikon: FileArchive, not: "web için ideal" },
                            };
                            const { ikon: FIkon, not } = bilgi[f] ?? { ikon: FileImage, not: "" };
                            return (
                              <button key={f} onClick={() => { onFormatIndir(f); setIndirAcik(false); setMenuAcik(false); }}
                                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-white/8">
                                <FIkon className="h-[18px] w-[18px] shrink-0 text-white/70" />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[15px] font-medium text-white">{f.toUpperCase()}</span>
                                  <span className="block text-[11px] text-white/40">{not}</span>
                                </span>
                                {i === 0 && <Check className="h-3.5 w-3.5 shrink-0 text-white" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  menuSatir(Download, "İndir", onIndir)
                )}
                {onSil && <div className="my-1 h-px bg-white/8" />}
                {onSil && menuSatir(Trash2, "Sil", onSil, true)}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body)}
      </div>
    </div>
    </div>
  );
}
