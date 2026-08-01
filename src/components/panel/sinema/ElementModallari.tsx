"use client";

/**
 * ElementModallari — Higgsfield Cinema Studio "Element" sistemi modalleri (spec 121-126) BİREBİR.
 *
 * export ElementDetayModal (122-123): element detay + 3×2 referans grid + metadata + alt aksiyon
 *   çubuğu (Sil/Taşı/Kopyala/Paylaş/İndir/Düzenle) + Düzenle onay diyaloğu.
 * export YeniElementModal (125-126): oluşturma formu (Ad/Açıklama/Kategori/Çalışma alanı) + upload
 *   drop-zone + İptal/Oluştur.
 *
 * .sinema-kapsam içinde render edilir → --sn-* değişkenleri erişilebilir.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  X,
  Trash2,
  FolderInput,
  Copy,
  Share2,
  Download,
  Pencil,
  Folder,
  ChevronDown,
  Plus,
  UploadCloud,
  Settings2,
} from "lucide-react";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { onizlemeArka } from "@/lib/utils";
import { topluIndir } from "@/lib/gercekEylem";

/* ============================================================
 * Ortak overlay kabuğu
 * ============================================================ */
function ModalKabuk({
  acik,
  onKapat,
  genislik = 870,
  children,
}: {
  acik: boolean;
  onKapat: () => void;
  genislik?: number;
  children: React.ReactNode;
}) {
  useScrollKilit(acik);
  useEscKapat(acik, onKapat);
  return (
    <AnimatePresence>
      {acik && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          style={{ background: "rgba(4,4,6,.72)", backdropFilter: "blur(6px)" }}
          onClick={onKapat}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              maxWidth: genislik,
              background: "var(--sn-yuzey)",
              borderColor: "var(--sn-kenar)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
 * ElementDetayModal (122-123)
 * ============================================================ */
export interface ElementVerisi {
  id: string;
  ad: string;
  aciklama?: string;
  yazar: string;
  tur?: string; // "Karakter" vb.
  durum?: string; // "Aktif"
  kullanim?: string; // "1 üretim"
  sonKullanim?: string; // "8 saat önce"
  olusturuldu?: string; // "4 gün önce"
  klasor?: string; // "Game of Thrones"
  gorseller?: string[]; // referans görsel url'leri (yoksa tohumdan üretilir)
  tohum?: string;
}

interface ElementDetayModalProps {
  acik: boolean;
  veri: ElementVerisi | null;
  onKapat: () => void;
  onDuzenle?: (mod: "cogalt" | "orijinal", veri: ElementVerisi) => void;
}

export function ElementDetayModal({
  acik,
  veri,
  onKapat,
  onDuzenle,
}: ElementDetayModalProps) {
  const [onayAcik, setOnayAcik] = useState(false);

  if (!veri) return null;

  const gorseller =
    veri.gorseller && veri.gorseller.length
      ? veri.gorseller
      : Array.from({ length: 6 }, (_, i) =>
          onizlemeArka(`${veri.tohum ?? veri.id}-${i}`, "portre"),
        );

  const meta = [
    { etiket: "Durum", deger: veri.durum ?? "Aktif" },
    { etiket: "Tür", deger: veri.tur ?? "Karakter" },
    { etiket: "Kullanım", deger: veri.kullanim ?? "1 üretim" },
    { etiket: "Son kullanım", deger: veri.sonKullanim ?? "8 saat önce" },
    { etiket: "Oluşturuldu", deger: veri.olusturuldu ?? "4 gün önce" },
  ];

  const aksiyonlar: { ad: string; ikon: typeof Trash2; vurgu?: boolean; onTikla: () => void }[] =
    [
      { ad: "Sil", ikon: Trash2, onTikla: () => toast("Silindi") },
      { ad: "Taşı", ikon: FolderInput, onTikla: () => toast("Taşındı") },
      { ad: "Kopyala", ikon: Copy, onTikla: () => toast("Kopyalandı") },
      { ad: "Paylaş", ikon: Share2, onTikla: () => toast("Paylaşım bağlantısı kopyalandı") },
      {
        ad: "İndir",
        ikon: Download,
        onTikla: () =>
          topluIndir(
            gorseller.map((g, i) => ({
              id: `${veri.id}-${i}`,
              baslik: `${veri.ad}-${i + 1}`,
              prompt: veri.aciklama ?? veri.ad,
              model: veri.tur ?? "element",
              gorselUrl: g,
            })),
            `${veri.ad} · ${gorseller.length} referans`,
          ),
      },
      { ad: "Düzenle", ikon: Pencil, vurgu: true, onTikla: () => setOnayAcik(true) },
    ];

  return (
    <ModalKabuk acik={acik} onKapat={onKapat}>
      {/* Başlık */}
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: "var(--sn-kenar)" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--sn-metin)" }}>
          Element
        </h2>
        <button
          onClick={onKapat}
          className="grid h-8 w-8 place-items-center rounded-full transition hover:opacity-80"
          style={{ background: "var(--sn-cip)", color: "var(--sn-metin-2)" }}
        >
          <X size={17} />
        </button>
      </div>

      {/* Gövde: sol içerik + sağ metadata */}
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_240px]">
        {/* Sol */}
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3
                className="text-2xl font-bold"
                style={{ color: "var(--sn-metin)" }}
              >
                {veri.ad}
              </h3>
              <p className="mt-0.5 text-sm" style={{ color: "var(--sn-metin-3)" }}>
                {veri.aciklama || "Açıklama yok"}
              </p>
            </div>
            <div
              className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3"
              style={{ background: "var(--sn-cip)" }}
            >
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold"
                style={{ background: "var(--sn-lime)", color: "var(--sn-lime-metin)" }}
              >
                {veri.yazar.charAt(0).toUpperCase()}
              </span>
              <span className="text-xs" style={{ color: "var(--sn-metin-2)" }}>
                {veri.yazar}
              </span>
            </div>
          </div>

          {/* 3×2 referans grid */}
          <div className="grid grid-cols-3 gap-2">
            {gorseller.slice(0, 6).map((g, i) => (
              <div
                key={i}
                className="aspect-[3/4] overflow-hidden rounded-lg"
                style={{ background: g }}
              />
            ))}
          </div>
        </div>

        {/* Sağ metadata */}
        <div className="space-y-3">
          <dl className="space-y-2.5">
            {meta.map((m) => (
              <div key={m.etiket} className="flex items-center justify-between text-sm">
                <dt style={{ color: "var(--sn-metin-3)" }}>{m.etiket}</dt>
                <dd className="font-medium" style={{ color: "var(--sn-metin)" }}>
                  {m.deger}
                </dd>
              </div>
            ))}
          </dl>
          <div className="pt-2">
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--sn-metin-3)" }}
            >
              Klasörler
            </div>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--sn-cip)", color: "var(--sn-metin)" }}
            >
              <Folder size={15} style={{ color: "var(--sn-metin-2)" }} />
              {veri.klasor ?? "Game of Thrones"}
            </div>
          </div>
        </div>
      </div>

      {/* Alt aksiyon çubuğu */}
      <div
        className="flex flex-wrap items-center justify-end gap-2 border-t px-6 py-4"
        style={{ borderColor: "var(--sn-kenar)" }}
      >
        {aksiyonlar.map((a) => {
          const Ikon = a.ikon;
          return (
            <button
              key={a.ad}
              onClick={a.onTikla}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition hover:brightness-125"
              style={{
                background: a.vurgu ? "var(--sn-menu)" : "var(--sn-cip)",
                borderColor: a.vurgu ? "var(--sn-metin-3)" : "var(--sn-kenar)",
                color: "var(--sn-metin)",
              }}
            >
              <Ikon size={14} style={{ color: "var(--sn-metin-2)" }} />
              {a.ad}
            </button>
          );
        })}
      </div>

      {/* Düzenle onay diyaloğu (123) */}
      <AnimatePresence>
        {onayAcik && (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(4,4,6,.8)" }}
            onClick={() => setOnayAcik(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-[460px] rounded-2xl border p-6"
              style={{
                maxWidth: 460,
                background: "var(--sn-yuzey)",
                borderColor: "var(--sn-kenar)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h4
                  className="text-lg font-semibold"
                  style={{ color: "var(--sn-metin)" }}
                >
                  &apos;{veri.ad}&apos; düzenlensin mi?
                </h4>
                <button
                  onClick={() => setOnayAcik(false)}
                  className="grid h-7 w-7 place-items-center rounded-full border transition hover:opacity-80"
                  style={{ borderColor: "var(--sn-lime)", color: "var(--sn-metin-2)" }}
                >
                  <X size={15} />
                </button>
              </div>
              <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--sn-metin-3)" }}>
                {veri.ad}, {veri.kullanim ?? "1 üretim"} içinde kullanıldı · son kullanım{" "}
                {veri.sonKullanim ?? "8 saat önce"}. Doğrudan düzenleyin ya da orijinali korumak için
                önce çoğaltın.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setOnayAcik(false);
                    onDuzenle?.("cogalt", veri);
                    toast("Çoğaltıldı ve düzenleniyor");
                  }}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:brightness-125"
                  style={{
                    background: "var(--sn-cip)",
                    borderColor: "var(--sn-kenar)",
                    color: "var(--sn-metin)",
                  }}
                >
                  Çoğalt ve Düzenle
                </button>
                <button
                  onClick={() => {
                    setOnayAcik(false);
                    onDuzenle?.("orijinal", veri);
                    toast("Orijinal düzenleniyor");
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                  style={{ background: "#f2f2f3", color: "#0f1113" }}
                >
                  Orijinali Düzenle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalKabuk>
  );
}

/* ============================================================
 * YeniElementModal (125-126)
 * ============================================================ */
export interface YeniElementVerisi {
  ad: string;
  aciklama: string;
  kategori: string;
  calismaAlani: string;
  /** Yüklenen medyanın GERÇEK data URL'leri (FileReader ile okunur). Opsiyonel:
      mevcut çağıranlar değişmeden çalışmaya devam eder. */
  gorseller?: string[];
}

interface YeniElementModalProps {
  acik: boolean;
  onKapat: () => void;
  onKaydet?: (veri: YeniElementVerisi) => void;
  calismaAlani?: string; // "Ahmet Talha Kavaklı"
}

const KATEGORILER = ["Oto", "Karakter", "Mekan", "Prop"];

export function YeniElementModal({
  acik,
  onKapat,
  onKaydet,
  calismaAlani = "Ahmet Talha Kavaklı",
}: YeniElementModalProps) {
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [kategori, setKategori] = useState("Oto");
  const [katAcik, setKatAcik] = useState(false);
  /* Yüklenen medya — GERÇEK data URL'ler (eskiden dosya hiç okunmuyordu,
     yalnızca "Medya yüklendi" toast'ı basılıyordu). */
  const [gorseller, setGorseller] = useState<string[]>([]);

  /** Seçilen dosyaları FileReader ile GERÇEKTEN okur, data URL olarak saklar. */
  function medyaSecildi(dosyalar: FileList | null) {
    const liste = Array.from(dosyalar ?? []);
    if (!liste.length) return;
    const MAKS = 8 * 1024 * 1024; // 8 MB — data URL olarak saklandığı için sınırlı
    const uygun = liste.filter((d) => d.size <= MAKS);
    const buyuk = liste.length - uygun.length;
    if (!uygun.length) {
      toast.error("Dosya çok büyük", { description: "Her dosya en fazla 8 MB olabilir." });
      return;
    }
    Promise.all(
      uygun.map(
        (d) =>
          new Promise<string | null>((coz) => {
            const okuyucu = new FileReader();
            okuyucu.onload = () => coz(typeof okuyucu.result === "string" ? okuyucu.result : null);
            okuyucu.onerror = () => coz(null);
            okuyucu.readAsDataURL(d);
          }),
      ),
    ).then((sonuclar) => {
      const okunan = sonuclar.filter(Boolean) as string[];
      if (!okunan.length) {
        toast.error("Medya okunamadı");
        return;
      }
      setGorseller((s) => [...s, ...okunan].slice(0, 12));
      toast.success(`${okunan.length} medya yüklendi`, {
        description: buyuk ? `${buyuk} dosya 8 MB sınırını aştığı için atlandı.` : "Element oluşturulunca kaydedilecek.",
      });
    });
  }

  function olustur() {
    if (!ad.trim()) {
      toast.error("Lütfen bir ad girin");
      return;
    }
    onKaydet?.({ ad: ad.trim(), aciklama, kategori, calismaAlani, gorseller });
    toast.success("Element oluşturuldu", {
      description: gorseller.length ? `${gorseller.length} medya eklendi` : undefined,
    });
    setAd(""); setAciklama(""); setKategori("Oto"); setGorseller([]);
    onKapat();
  }

  return (
    <ModalKabuk acik={acik} onKapat={onKapat}>
      {/* Başlık */}
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: "var(--sn-kenar)" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--sn-metin)" }}>
          Yeni Element
        </h2>
        <button
          onClick={onKapat}
          className="grid h-8 w-8 place-items-center rounded-full transition hover:opacity-80"
          style={{ background: "var(--sn-cip)", color: "var(--sn-metin-2)" }}
        >
          <X size={17} />
        </button>
      </div>

      {/* Gövde: sol form + sağ upload */}
      <div className="grid gap-6 p-6 md:grid-cols-2">
        {/* Sol form */}
        <div className="space-y-4">
          <input
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            placeholder="Ad girin"
            className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none placeholder:opacity-60"
            style={{
              background: "var(--sn-cip)",
              borderColor: "var(--sn-kenar)",
              color: "var(--sn-metin)",
            }}
          />
          <textarea
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder="Açıklama ekle"
            rows={4}
            className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none placeholder:opacity-60"
            style={{
              background: "var(--sn-cip)",
              borderColor: "var(--sn-kenar)",
              color: "var(--sn-metin)",
            }}
          />

          {/* Kategori dropdown */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-3">
            <label className="text-sm" style={{ color: "var(--sn-metin-3)" }}>
              Kategori
            </label>
            <div className="relative">
              <button
                onClick={() => setKatAcik((v) => !v)}
                className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition"
                style={{
                  background: "var(--sn-cip)",
                  borderColor: "var(--sn-kenar)",
                  color: "var(--sn-metin)",
                }}
              >
                <Settings2 size={15} style={{ color: "var(--sn-metin-2)" }} />
                <span className="flex-1 text-left">{kategori}</span>
                <ChevronDown
                  size={15}
                  className="transition"
                  style={{
                    color: "var(--sn-metin-3)",
                    transform: katAcik ? "rotate(180deg)" : "none",
                  }}
                />
              </button>
              <AnimatePresence>
                {katAcik && (
                  <motion.ul
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.14 }}
                    className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border py-1 shadow-xl"
                    style={{
                      background: "var(--sn-menu)",
                      borderColor: "var(--sn-kenar)",
                    }}
                  >
                    {KATEGORILER.map((k) => (
                      <li key={k}>
                        <button
                          onClick={() => {
                            setKategori(k);
                            setKatAcik(false);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm transition hover:brightness-125"
                          style={{ color: "var(--sn-metin)" }}
                        >
                          {k}
                          {kategori === k && (
                            <span style={{ color: "var(--sn-lime)" }}>✓</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Çalışma alanı dropdown */}
          <div className="grid grid-cols-[90px_1fr] items-center gap-3">
            <label className="text-sm" style={{ color: "var(--sn-metin-3)" }}>
              Çalışma alanı
            </label>
            <button
              onClick={() => toast.success("Çalışma alanı: Otomatik", { description: "Element türü içeriğe göre otomatik belirlenir." })}
              className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition"
              style={{
                background: "var(--sn-cip)",
                borderColor: "var(--sn-kenar)",
                color: "var(--sn-metin)",
              }}
            >
              <span
                className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold"
                style={{ background: "var(--sn-lime)", color: "var(--sn-lime-metin)" }}
              >
                {calismaAlani.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 text-left">{calismaAlani}</span>
              <ChevronDown size={15} style={{ color: "var(--sn-metin-3)" }} />
            </button>
          </div>
        </div>

        {/* Sağ upload drop-zone */}
        <label
          className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center transition hover:brightness-125"
          style={{ background: "var(--sn-cip)", borderColor: "var(--sn-kenar)" }}
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => { medyaSecildi(e.target.files); e.target.value = ""; }}
          />
          {gorseller.length > 0 ? (
            /* GERÇEK önizlemeler — okunan data URL'ler */
            <div className="grid w-full grid-cols-3 gap-2 p-3">
              {gorseller.map((g, i) => (
                <span key={i} className="relative block aspect-square overflow-hidden rounded-lg" style={{ background: "var(--sn-menu)" }}>
                  {g.startsWith("data:video") ? (
                    <video src={g} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    <img src={g} alt="" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setGorseller((s) => s.filter((_, x) => x !== i)); }}
                    aria-label="Kaldır"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white transition hover:bg-black"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <span className="grid aspect-square place-items-center rounded-lg border border-dashed"
                style={{ borderColor: "var(--sn-kenar)", color: "var(--sn-metin-3)" }}>
                <Plus size={18} />
              </span>
            </div>
          ) : (
            <>
              <span
                className="grid h-12 w-12 place-items-center rounded-full"
                style={{ background: "var(--sn-menu)", color: "var(--sn-metin-2)" }}
              >
                <Plus size={22} />
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--sn-metin)" }}>
                <UploadCloud size={14} className="mr-1 inline align-[-2px]" />
                Medya yükle
              </span>
              <span className="text-xs" style={{ color: "var(--sn-metin-3)" }}>
                Sürükle bırak veya tıkla
              </span>
            </>
          )}
        </label>
      </div>

      {/* Alt aksiyon */}
      <div
        className="flex items-center justify-end gap-2 border-t px-6 py-4"
        style={{ borderColor: "var(--sn-kenar)" }}
      >
        <button
          onClick={onKapat}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:brightness-125"
          style={{
            background: "var(--sn-cip)",
            borderColor: "var(--sn-kenar)",
            color: "var(--sn-metin)",
          }}
        >
          İptal
        </button>
        <button
          onClick={olustur}
          className="rounded-lg px-5 py-2 text-sm font-semibold transition hover:opacity-90"
          style={{ background: "#f2f2f3", color: "#0f1113" }}
        >
          Oluştur
        </button>
      </div>
    </ModalKabuk>
  );
}
