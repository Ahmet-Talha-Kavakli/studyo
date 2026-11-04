"use client";

/**
 * PazElleUrun — "Elle oluştur" akışı (Ürün / Uygulama).
 *
 * Kullanıcı isteği (2026-07-31): "Ürününü eklemede ve uygulama eklemede elle
 * oluşturma akışı yok şuanda hallet agam."
 *
 * Öncesi: "Elle oluştur" butonu yalnız `toast("Elle ürün oluşturma")` basıyordu
 * — hiçbir ekran açılmıyor, hiçbir kayıt oluşmuyordu. URL ile çekme akışında
 * da yalnız "app" kipinde listeye ekleniyordu; "urun" kipinde başarı toast'ı
 * basılıp kayıt DÜŞÜYORDU.
 *
 * Şimdi: ad + açıklama + (isteğe bağlı) bağlantı + çoklu görsel yükleme ile
 * GERÇEK kayıt oluşturulur ve listeye eklenir.
 */

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Upload, Link2, Trash2, Box, Ban } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import type { KayitliUrun } from "@/lib/pazarlamaVeri";

export function PazElleUrun({ kip, onKapat, onOlustu }: {
  kip: "urun" | "app";
  onKapat: () => void;
  onOlustu: (u: KayitliUrun) => void;
}) {
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [url, setUrl] = useState("");
  const [gorseller, setGorseller] = useState<string[]>([]);
  const dosyaRef = useRef<HTMLInputElement>(null);

  useScrollKilit(true);
  useEscKapat(true, onKapat);

  const uygulamaMi = kip === "app";

  const olustur = () => {
    const temizAd = ad.trim();
    if (temizAd.length < 2) { toast.error("Ad eksik", { description: "En az 2 karakterlik bir ad yaz." }); return; }
    if (aciklama.trim().length < 8) {
      toast.error("Açıklama çok kısa", {
        description: `Üretimlerde bu açıklama kullanılır. ${uygulamaMi ? "Uygulamanı" : "Ürününü"} birkaç cümleyle tarif et.`,
      });
      return;
    }
    const id = `elle_${Date.now().toString(36)}`;
    onOlustu({
      id,
      ad: temizAd,
      aciklama: aciklama.trim(),
      url: url.trim(),
      tohum: `${kip}-${temizAd.toLocaleLowerCase("tr").replace(/\s+/g, "-")}`,
      // Yüklenen görseller doğrudan data-uri olarak taşınır; yoksa boş kalır
      // ve kart deterministik tohum desenine düşer.
      gorseller: gorseller,
    });
    toast.success(`${temizAd} oluşturuldu`, {
      description: gorseller.length ? `${gorseller.length} görsel eklendi.` : "Görselleri sonradan ekleyebilirsin.",
    });
    onKapat();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="perde fixed inset-0 z-[260] bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        className="fixed left-1/2 top-1/2 z-[261] flex max-h-[88vh] w-[min(94vw,680px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#232323]">

        <input ref={dosyaRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => {
            const liste = Array.from(e.target.files ?? []);
            e.target.value = "";
            liste.slice(0, 5).forEach((f) => {
              const r = new FileReader();
              r.onload = () => setGorseller((v) => [...v, String(r.result)].slice(0, 5));
              r.readAsDataURL(f);
            });
          }} />

        {/* Başlık */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.07] p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aksan/15 text-aksan">
              {uygulamaMi ? <Ban className="h-5 w-5" /> : <Box className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <h3 className="text-[19px] font-black uppercase text-white">
                {uygulamaMi ? "Uygulamayı elle oluştur" : "Ürünü elle oluştur"}
              </h3>
              <p className="mt-0.5 text-[13px] text-[#9A9A9A]">
                Bağlantı olmadan da ekleyebilirsin — ad ve açıklama yeterli.
              </p>
            </div>
          </div>
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#333] text-white/80 transition-colors hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#C9C9D1]">
              <span className="text-rose-400">*</span> {uygulamaMi ? "Uygulama adı" : "Ürün adı"}
            </label>
            <input value={ad} onChange={(e) => setAd(e.target.value)} autoFocus
              placeholder={uygulamaMi ? "Örn. Finovela" : "Örn. Deri Cüzdan"}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[14px] text-white outline-none focus:border-aksan/60" />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#C9C9D1]">
              <span className="text-rose-400">*</span> Açıklama
            </label>
            <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={4}
              placeholder={uygulamaMi
                ? "Uygulaman ne yapıyor, kime hitap ediyor, hangi sorunu çözüyor?"
                : "Ürünün ne, kimin için, öne çıkan özelliği ne? Reklam metni buradan üretilecek."}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[14px] leading-relaxed text-white outline-none focus:border-aksan/60" />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#C9C9D1]">Bağlantı (isteğe bağlı)</label>
            <span className="flex h-11 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5">
              <Link2 className="h-[17px] w-[17px] shrink-0 text-[#7A7A7A]" />
              <input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder={uygulamaMi ? "www.uygulaman.com" : "www.urununuz.com"}
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[#6E6E6E]" />
            </span>
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-[#C9C9D1]">
              Görseller (isteğe bağlı)
              {gorseller.length > 0 && <span className="text-[12px] tabular-nums text-[#8A8A92]">{gorseller.length}/5</span>}
            </label>
            {gorseller.length === 0 ? (
              <button onClick={() => dosyaRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-8 transition-colors hover:border-white/30">
                <Upload className="h-6 w-6 text-[#9A9A9A]" />
                <span className="text-[13.5px] font-medium text-white">Görsel yükle</span>
                <span className="text-[12px] text-[#8A8A92]">5 adede kadar — farklı açılar sonucu iyileştirir</span>
              </button>
            ) : (
              <div className="grid grid-cols-5 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                {gorseller.map((g, i) => (
                  <div key={i} className="group/gr relative aspect-square overflow-hidden rounded-lg bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => setGorseller((v) => v.filter((_, j) => j !== i))}
                      aria-label="Kaldır"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover/gr:opacity-100 hover:bg-rose-500/75">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {gorseller.length < 5 && (
                  <button onClick={() => dosyaRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 text-[#8A8A92] transition-colors hover:border-white/30 hover:text-white">
                    <Upload className="h-4 w-4" /><span className="text-[10px]">Ekle</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-white/[0.07] px-5 py-4">
          <button onClick={onKapat}
            className="rounded-xl border border-white/12 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.06]">İptal</button>
          <button onClick={olustur}
            className="rounded-xl bg-white px-6 py-2.5 text-[14px] font-bold text-[#0A0A0A] transition-transform hover:scale-[1.02]">
            Oluştur
          </button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}
