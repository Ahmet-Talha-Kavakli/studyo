"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "@/lib/toast";
import { X, Plus, ChevronDown, Check, Sparkles } from "lucide-react";
import { useElements, type VElement, type ElementTur } from "@/store/useElements";
import { useAuth } from "@/store/useAuth";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { TUR_META } from "./elementMeta";

/**
 * ElementDuzenleModal — Higgsfield "New Element" / "Edit Element" BİREBİR.
 * İki sütun: sol (Ad, Açıklama, Kategori dropdown, Workspace) + sağ (Upload media
 * drag&drop çoklu görsel). Alt: Cancel / Create|Save.
 */
/**
 * Yeni Element / Elementi Düzenle modalı.
 *
 * `element` verilirse düzenleme, verilmezse oluşturma modudur.
 * `tohumDeger` (M1): bir ÜRETİMDEN element oluştururken formu ön-doldurur —
 * kullanıcı "Element oluştur"a bastığında boş form yerine üretimin adı,
 * istemi ve görseli hazır gelir; yine de düzenleyip onaylar.
 */
/* `onKaydedildi`: mevcut bir element GÜNCELLENDİĞİNDE tetiklenir.
   Gerekliydi çünkü çağıran taraf "kaydedildi mi, iptal mi edildi" ayrımını
   yapamıyordu: element seçicinin içinden düzenleyip kaydedince düzenleme
   kutusu kapanıyor ama arkadaki seçici açık kalıyordu (bildirilen hata —
   "kaydete basınca ekran kapanmıyor"). Yeni element için zaten onOlustu
   vardı; bu onun güncelleme karşılığı. */
export function ElementDuzenleModal({ element, onKapat, onOlustu, onKaydedildi, tohumDeger, hedefKapsam }: {
  element: VElement | null;
  onKapat: () => void;
  onOlustu?: (id: string) => void;
  /** Mevcut element güncellendiğinde — çağıran kendi katmanını da kapatabilir. */
  onKaydedildi?: (id: string) => void;
  tohumDeger?: { ad?: string; tur?: ElementTur; aciklama?: string; gorsel?: string };
  /** Yeni element hangi klasöre/projeye yazılsın (seçici'deki aktif kapsam).
      ID'lerle tutulur ki aynı isimli klasörler karışmasın (2026-08-01). */
  hedefKapsam?: { klasorId?: string; projeId?: string; klasorAd?: string };
}) {
  const ekle = useElements((s) => s.ekle);
  const guncelle = useElements((s) => s.guncelle);
  const kullaniciAd = useAuth((s) => s.kullanici?.ad ?? "Çalışma Alanım");
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const [ad, setAd] = useState(element?.ad ?? tohumDeger?.ad ?? "");
  const [tur, setTur] = useState<ElementTur | "auto">(element?.tur ?? tohumDeger?.tur ?? "auto");
  const [aciklama, setAciklama] = useState(element?.aciklama ?? tohumDeger?.aciklama ?? "");
  const [gorseller, setGorseller] = useState<string[]>(
    element?.gorseller ?? (tohumDeger?.gorsel ? [tohumDeger.gorsel] : []),
  );
  const [katAcik, setKatAcik] = useState(false);
  /* Kategori menüsü portal'a çıktığı için konumu tetikleyiciden ÖLÇÜLÜR.
     Menü yüksekliği ~5 satır (≈230px); ekran altından taşarsa yukarı kaydır. */
  const katBtnRef = useRef<HTMLButtonElement>(null);
  const [katKonum, setKatKonum] = useState<{ top: number; left: number } | null>(null);
  const katAc = () => {
    const r = katBtnRef.current?.getBoundingClientRect();
    if (r) {
      const MENU_YUK = 236, MENU_GEN = 208;
      const sagaSigar = r.right + 10 + MENU_GEN < window.innerWidth;
      setKatKonum({
        top: Math.max(12, Math.min(r.top, window.innerHeight - 12 - MENU_YUK)),
        left: sagaSigar ? r.right + 10 : Math.max(12, r.left - 10 - MENU_GEN),
      });
    }
    setKatAcik((v) => !v);
  };
  const [suruklu, setSuruklu] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const kapak = element ? onizlemeArka(element.tohum, TUR_META[element.tur].kat) : null;

  const dosyaOku = (fl: FileList | null) => {
    if (!fl) return;
    Array.from(fl).slice(0, 6).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      const r = new FileReader();
      r.onload = () => setGorseller((g) => [...g, r.result as string].slice(0, 6));
      r.readAsDataURL(f);
    });
  };

  const kaydet = () => {
    const temizAd = ad.trim().replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]/g, "");
    if (!temizAd) { toast.error("Bir ad gir"); return; }
    const gercekTur: ElementTur = tur === "auto" ? "karakter" : tur;
    if (element) {
      guncelle(element.id, { ad: temizAd, tur: gercekTur, aciklama: aciklama.trim(), gorseller });
      toast.success(`@${temizAd} güncellendi`);
      onKapat();
      onKaydedildi?.(element.id);
    } else {
      const id = ekle({
        ad: temizAd, tur: gercekTur, aciklama: aciklama.trim(), gorseller,
        tohum: "el-" + temizAd.toLowerCase(),
        // Seçili kapsamda oluşturulduysa oraya yaz.
        klasorId: hedefKapsam?.klasorId,
        projeId: hedefKapsam?.projeId,
        klasor: hedefKapsam?.klasorAd,
      });
      toast.success(`@${temizAd} oluşturuldu`, { description: "Artık composer'da @ ile çağırabilirsin." });
      onOlustu?.(id);
      onKapat();
    }
  };

  /* PORTAL ŞART (ölçüldü 2026-07-31): composer'ın bir üst kutusunda
     `will-change: transform` var. Bu, tıpkı `transform` gibi position:fixed
     için YENİ BİR KAPSAYICI BLOK yaratıyor → `top:50%` viewport'a değil o
     130px'lik composer kutusuna göre çözülüyor ve modal ekranın ortası yerine
     y=861'de (ekran 950px) açılıyordu. Elementler sayfasında sorun yoktu,
     çünkü orada böyle bir ata yok. body'ye taşıyınca her iki çağıran da
     ekranın tam ortasında açılır. */
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[220] bg-black/60 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        /* YÜKSEKLİK: sabit `min-h:78vh` kaldırıldı (kullanıcı: "saçma bi kutu
           düzeni var"). Form kısa olduğu için kutu zorla uzuyor, sol sütunun
           altında kocaman boşluk kalıyordu. Artık kutu içeriği kadar yüksek
           olur; yüklenen görsel sayısı arttıkça büyür, %90'da durur. */
        className="fixed left-1/2 top-1/2 z-[221] flex w-[min(96vw,980px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#151517] shadow-2xl">
        {/* başlık */}
        <div className="flex items-center justify-between px-7 pt-6">
          <h2 className="text-[22px] font-bold text-white">{element ? "Elementi Düzenle" : "Yeni Element"}</h2>
          <button onClick={onKapat} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4.5 w-4.5" /></button>
        </div>

        {/* İKİ SÜTUN — eşit paylaşım (1fr 1fr). Önceki `1fr 1.15fr` sağ sütunu
            şişirip sol formu daraltıyordu; iki taraf da `items-start` ile
            ÜSTTEN hizalanır, böylece kısa form uzun yükleme kutusunun
            ortasına kaymaz. */}
        <div className="grid flex-1 grid-cols-1 items-start gap-7 overflow-y-auto p-7 sm:grid-cols-2">
          {/* SOL — form */}
          {/* Alanlar tek sütunda, her biri kendi etiketiyle. Önce etiketsiz
              alanlar + yanlarında etiketli alanlar karışıktı (iki farklı
              hizalama düzeni) — kullanıcının şikâyet ettiği "saçma kutu
              düzeni" büyük ölçüde buydu. */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-metin-3">Ad</label>
              {/* Cam alan dili (.el-alan): kenarlık/odak halkası CSS'te — hem
                  input hem textarea hem seçici aynı görünsün. */}
              <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Zara"
                className="el-alan w-full rounded-xl px-4 py-3 text-[15px] text-white outline-none placeholder:text-metin-3" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-metin-3">Açıklama</label>
              <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={3} placeholder="Bu elementi tarif et — model üretirken buna sadık kalır."
                className="el-alan w-full resize-none rounded-xl px-4 py-3 text-[14px] text-white outline-none placeholder:text-metin-3" />
            </div>

            {/* Kategori */}
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-metin-3">Kategori</label>
              <div className="relative">
                <button ref={katBtnRef} onClick={katAc}
                  className="el-alan flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] text-white">
                  <span className="flex items-center gap-2">
                    {tur === "auto" ? <><Sparkles className="h-4 w-4 text-metin-3" /> Otomatik</> : <>{(() => { const I = TUR_META[tur].ikon; return <I className={cn("h-4 w-4", TUR_META[tur].renk)} />; })()} {TUR_META[tur].ad}</>}
                  </span>
                  <ChevronDown className="h-4 w-4 text-metin-3" />
                </button>
                {/* SAĞA açılır (kullanıcı isteği 2026-07-31) ve PORTAL ile body'ye
                    çıkar: modalın içerik ızgarası `overflow-y-auto` olduğu için
                    içeride kalan menünün ALT SATIRLARI kırpılıyordu (ölçüldü —
                    "Stil" görünmüyordu). Portal + fixed koordinat ikisini de çözer. */}
                {katAcik && katKonum && createPortal(
                  <>
                    <div className="fixed inset-0 z-[240]" onClick={() => setKatAcik(false)} />
                    <div style={{ position: "fixed", top: katKonum.top, left: katKonum.left }}
                      className="z-[241] w-52 overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1f] py-1 shadow-2xl">
                      <button onClick={() => { setTur("auto"); setKatAcik(false); }}
                        className="flex w-full items-center justify-between px-3.5 py-2.5 text-[14px] text-white hover:bg-white/[0.06]">
                        <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-metin-3" /> Otomatik</span>
                        {tur === "auto" && <Check className="h-4 w-4 text-aksan" />}
                      </button>
                      {(Object.keys(TUR_META) as ElementTur[]).map((t) => {
                        const I = TUR_META[t].ikon;
                        return (
                          <button key={t} onClick={() => { setTur(t); setKatAcik(false); }}
                            className="flex w-full items-center justify-between px-3.5 py-2.5 text-[14px] text-white hover:bg-white/[0.06]">
                            <span className="flex items-center gap-2"><I className={cn("h-4 w-4", TUR_META[t].renk)} /> {TUR_META[t].ad}</span>
                            {tur === t && <Check className="h-4 w-4 text-aksan" />}
                          </button>
                        );
                      })}
                    </div>
                  </>,
                  document.body,
                )}
              </div>
            </div>

            {/* Workspace */}
            <div>
              <label className="mb-1.5 block text-[13.5px] font-medium text-metin-3">Çalışma alanı</label>
              <div className="el-alan flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[14px] text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-aksan/20 text-[11px] font-bold text-aksan">{kullaniciAd.charAt(0).toUpperCase()}</span>
                {kullaniciAd}
              </div>
            </div>
          </div>

          {/* SAĞ — medya yükleme (çoklu) */}
          <div>
            <p className="mb-2 text-[13.5px] font-medium text-metin-3">Medya</p>
            <input ref={dosyaRef} type="file" accept="image/*" multiple hidden onChange={(e) => dosyaOku(e.target.files)} />
            {gorseller.length === 0 && !kapak ? (
              /* Yükseklik: `h-full min-h-[380px]` yerine sabit bir kare oran.
                 h-full, sütun `items-start` olunca çöküyordu; 380px ise sol
                 formdan uzun olup düzeni dengesiz gösteriyordu. */
              <div onClick={() => dosyaRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setSuruklu(true); }}
                onDragLeave={() => setSuruklu(false)}
                onDrop={(e) => { e.preventDefault(); setSuruklu(false); dosyaOku(e.dataTransfer.files); }}
                className={cn("flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-3.5 rounded-2xl border border-dashed transition-colors",
                  suruklu ? "border-aksan/60 bg-aksan/[0.06]" : "el-alan !border-dashed !border-white/15 hover:!border-white/25")}>
                <span className="el-btn flex h-16 w-16 items-center justify-center rounded-full text-metin-2"><Plus className="h-8 w-8" /></span>
                <div className="text-center">
                  <p className="text-[16px] font-medium text-white">Medya yükle</p>
                  <p className="text-[13px] text-metin-3">Sürükle-bırak veya tıklayıp yükle</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => dosyaRef.current?.click()}
                  className="el-alan flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl !border-dashed !border-white/15 text-metin-3 hover:!border-white/25">
                  <Plus className="h-6 w-6" /><span className="text-[11px]">Ekle</span>
                </button>
                {kapak && gorseller.length === 0 && (
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    <span className="absolute inset-0" style={{ background: kapak }} />
                    {saltUrl(kapak) && <img src={saltUrl(kapak)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  </div>
                )}
                {gorseller.map((g, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                    <img src={g} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setGorseller((gs) => gs.filter((_, j) => j !== i))}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-500/80"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* alt aksiyon */}
        {/* Alt aksiyon — px-7 (içerik ızgarasıyla AYNI): px-6 idi ve butonlar
            formun sağ kenarıyla 4px kayıyordu (kullanıcı: "sol ila sağ hizasız"). */}
        <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.06] px-7 py-4">
          <button onClick={onKapat} className="el-btn rounded-xl px-5 py-2.5 text-[14px] font-medium text-white">İptal</button>
          <button onClick={kaydet} className="rounded-xl bg-white px-6 py-2.5 text-[14px] font-bold text-black transition-transform hover:scale-[1.02]">{element ? "Kaydet" : "Oluştur"}</button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

/** Edit onay diyaloğu — "X, N üretimde kullanıldı. Doğrudan düzenle ya da çoğalt." */
export function ElementDuzenleOnay({ element, onCogalt, onDuzenle, onKapat }: {
  element: VElement;
  onCogalt: () => void;
  onDuzenle: () => void;
  onKapat: () => void;
}) {
  useEscKapat(true, onKapat);
  // Aynı kapsayıcı-blok tuzağı (bkz. ElementDuzenleModal notu) — body'ye taşı.
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[230] bg-black/55 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="fixed left-1/2 top-1/2 z-[231] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#1a1a1d] p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-white">"{element.ad}" düzenlensin mi?</h3>
          <button onClick={onKapat} className="flex h-7 w-7 items-center justify-center rounded-full border border-aksan/50 text-aksan hover:bg-aksan/10"><X className="h-3.5 w-3.5" /></button>
        </div>
        <p className="text-[14px] leading-relaxed text-metin-2">
          <span className="font-bold text-white">{element.ad}</span>, <span className="font-bold text-white">{element.kullanim} üretimde</span> kullanıldı. Doğrudan düzenle, ya da orijinali korumak için önce çoğalt.
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button onClick={onCogalt} className="rounded-xl bg-white/8 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-white/12">Çoğalt ve Düzenle</button>
          <button onClick={onDuzenle} className="rounded-xl bg-white px-5 py-2.5 text-[14px] font-bold text-black hover:scale-[1.02]">Orijinali Düzenle</button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}
