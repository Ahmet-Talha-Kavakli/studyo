"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check, ImagePlus, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { neden } from "@/components/studyo/bildirim";
import { mesaj } from "@/lib/mesaj";
import { useElements } from "@/store/useElements";
import { usePanolar, PANO_MAKS_GORSEL } from "@/store/usePanolar";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { useEscKapat } from "@/hooks/useScrollKilit";
import { paletCikar } from "@/lib/paletCikar";
import { HAZIR_PANOLAR_TAM } from "@/lib/panoVeri";

/**
 * Ruh (Soul) modellerinin üç yardımcısı — hepsi gerçek veriyle çalışır:
 *  · Karakter: kullanıcının karakter elementleri. Seçilen karakter istemde @ad olur; fotoğrafları
 *    üretimde referans olarak gider (eğitim yok, çoklu referans).
 *  · Ruh panosu: hazır panolar ya da kullanıcının yüklediği panolar. Görselleri stil referansı gider.
 *  · Renk: hazır paletler ya da görselden tarayıcıda çıkarılan palet. Hex kodları istemde renk
 *    yönergesi olarak gider; kredi düşmez.
 */

/** Hazır panolar — Ruh panosu sayfasıyla tek liste (`@/lib/panoVeri`). */
export const HAZIR_PANOLAR: { ad: string; gorsel: string; gorseller: string[] }[] = HAZIR_PANOLAR_TAM.map((p) => ({ ad: p.ad, gorsel: p.gorseller[0], gorseller: p.gorseller }));

export const HAZIR_PALETLER: { ad: string; renkler: string[]; gorsel: string }[] = [
  { ad: "Film Renkleri", renkler: ["#3a4a3f", "#c9b596", "#8a6d5a", "#2b2118"], gorsel: "/gercek/gorsel/renk-film.webp" },
  { ad: "Lime Jam", renkler: ["#a6e22e", "#2d3a12", "#f0f7d4", "#5a7020"], gorsel: "/gercek/gorsel/renk-lime.webp" },
  { ad: "Şeker Pembe", renkler: ["#ff9ec7", "#ffd6e8", "#c44f8a", "#5a1f3a"], gorsel: "/gercek/gorsel/renk-pembe.webp" },
  { ad: "Nostaljik Mavi", renkler: ["#4a6b8a", "#a8c4d8", "#2b3a4a", "#dce8f0"], gorsel: "/gercek/gorsel/renk-mavi.webp" },
  { ad: "Yumuşak Palet", renkler: ["#d8c4b0", "#a89078", "#f0e4d4", "#6b5a48"], gorsel: "/gercek/gorsel/renk-yumusak.webp" },
  { ad: "Siyah Parlak", renkler: ["#1c1e20", "#3a3a3a", "#6b6b6b", "#0f1113"], gorsel: "/gercek/gorsel/renk-siyah.webp" },
];

export type SeciliPano = { ad: string; gorseller: string[]; kullanici?: boolean; tarif?: string; kacin?: string; guc?: "hafif" | "dengeli" | "guclu"; renkler?: string[] };
export type SeciliPalet = { ad: string; renkler: string[] };

/** Data URL'i sunucu deposuna yazar (referans/pano görselleri). */
export async function gorselDepola(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const r = await fetch("/api/gorsel/yukle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) })
    .then((x) => x.json()) as { ok: boolean; url?: string; hata?: string };
  if (!r.ok || !r.url) throw new Error(r.hata ?? "Yüklenemedi");
  return r.url;
}
export const dosyaOku = (d: File) => new Promise<string>((coz, red) => {
  const r = new FileReader();
  r.onload = () => coz(String(r.result));
  r.onerror = () => red(new Error("Dosya okunamadı"));
  r.readAsDataURL(d);
});

function Kabuk({ baslik, aciklama, onKapat, eylem, sekmeler, children }: {
  baslik: string; aciklama: string; onKapat: () => void; eylem?: ReactNode; sekmeler?: ReactNode; children: ReactNode;
}) {
  useEscKapat(true, onKapat);
  if (typeof document === "undefined") return null;
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="perde fixed inset-0 z-[120] flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6" onClick={onKapat}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.18 }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-label={baslik} className="flex max-h-[88vh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-3xl border border-white/[0.06] bg-yuzey sm:rounded-3xl">
        <div className="px-5 pb-3 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <h2 className="min-w-0 flex-1 text-[18px] font-semibold tracking-tight text-metin">{baslik}</h2>
            {eylem}
            <button onClick={onKapat} aria-label="Kapat" className="-mr-1 rounded-lg p-1.5 text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin"><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-1.5 max-w-[600px] text-[13px] leading-relaxed text-metin-3">{aciklama}</p>
        </div>
        {sekmeler && <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 pb-3 sm:px-6">{sekmeler}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin] sm:p-6">{children}</div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function Sekme<T extends string>({ deger, onDegis, secenekler }: { deger: T; onDegis: (v: T) => void; secenekler: [T, string][] }) {
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1" role="tablist">
      {secenekler.map(([id, ad]) => (
        <button key={id} role="tab" aria-selected={deger === id} onClick={() => onDegis(id)}
          className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors", deger === id ? "bg-white/[0.1] text-metin" : "text-metin-2 hover:text-metin")}>{ad}</button>
      ))}
    </div>
  );
}

const SeciliIsaret = () => (
  <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-aksan text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
);

/* ═════════════ Karakter ═════════════ */
export function KarakterModal({ secili, onSec, onYeni, onKapat }: { secili: string | null; onSec: (ad: string | null) => void; onYeni: () => void; onKapat: () => void }) {
  const karakterler = useElements((s) => s.elementler).filter((e) => e.tur === "karakter");
  return (
    <Kabuk baslik="Karakter" onKapat={onKapat}
      aciklama="Karakter, 1–4 fotoğraflı bir elementtir. Seçtiğinde fotoğrafları üretimde referans olarak gider ve aynı kişi tutarlı kalır."
      eylem={<button onClick={onYeni} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-zemin hover:opacity-90"><Plus className="h-4 w-4" />Yeni karakter</button>}>
      {karakterler.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {karakterler.map((k) => (
            <button key={k.id} onClick={() => { onSec(secili === k.ad ? null : k.ad); onKapat(); }} aria-pressed={secili === k.ad}
              className={cn("group relative overflow-hidden rounded-2xl text-left ring-1 transition-all", secili === k.ad ? "ring-2 ring-aksan" : "ring-white/[0.06] hover:ring-white/20")}>
              {secili === k.ad && <SeciliIsaret />}
              <ElementKapak e={k} className="aspect-[3/4] w-full" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-2 pt-8">
                <span className="block truncate text-[13px] font-semibold text-white">@{k.ad}</span>
                <span className="block text-[11px] text-white/60">{k.gorseller.length} fotoğraf</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06]"><ImagePlus className="h-5 w-5 text-metin-2" /></span>
          <p className="mt-3 text-[14px] font-medium text-metin">Henüz karakterin yok</p>
          <p className="mt-1 max-w-[360px] text-[12.5px] leading-relaxed text-metin-3">Yüzü net görünen, farklı açılardan 1–4 fotoğraf yükle. Aynı kişiyi her üretimde @adıyla çağır.</p>
          <button onClick={onYeni} className="mt-4 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-zemin hover:opacity-90">Karakter oluştur</button>
        </div>
      )}
    </Kabuk>
  );
}

/* ═════════════ Ruh panosu ═════════════ */
export function PanoModal({ secili, onSec, onKapat }: { secili: SeciliPano | null; onSec: (p: SeciliPano | null) => void; onKapat: () => void }) {
  const { panolar, panoEkle, panoSil } = usePanolar();
  const [sekme, setSekme] = useState<"hazir" | "benim">(panolar.length && secili?.kullanici ? "benim" : "hazir");
  const [ara, setAra] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const yeniPano = async (fl: FileList | null) => {
    const l = Array.from(fl ?? []).filter((f) => f.type.startsWith("image/")).slice(0, PANO_MAKS_GORSEL);
    if (!l.length) { if (fl?.length) mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP"); return; }
    setYukleniyor(true);
    try {
      const urller = await Promise.all(l.map(async (d) => gorselDepola(await dosyaOku(d))));
      const ad = `Pano ${panolar.length + 1}`;
      panoEkle(ad, urller);
      onSec({ ad, gorseller: urller, kullanici: true });
      toast.success(`${ad} oluşturuldu`, { description: `${urller.length} görsel, üretimlerinde stil referansı olarak kullanılacak.` });
      onKapat();
    } catch (e) {
      toast.error("Pano oluşturulamadı", { description: `${neden(e, "Görseller yüklenemedi.")} Yeniden dene.` });
    } finally { setYukleniyor(false); }
  };

  const q = ara.toLocaleLowerCase("tr");
  return (
    <Kabuk baslik="Ruh panosu" onKapat={onKapat}
      aciklama="Panonun görselleri üretime stil referansı olarak gider: ışık, renk, doku ve ruh hali aktarılır, içerik istemden gelir."
      eylem={(
        <button onClick={() => dosyaRef.current?.click()} disabled={yukleniyor} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-zemin hover:opacity-90 disabled:opacity-60">
          {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Yeni pano
        </button>
      )}
      sekmeler={(
        <>
          <Sekme deger={sekme} onDegis={setSekme} secenekler={[["hazir", "Hazır"], ["benim", `Panolarım${panolar.length ? ` · ${panolar.length}` : ""}`]]} />
          <span className="flex-1" />
          {secili && <button onClick={() => { onSec(null); onKapat(); }} className="text-[12.5px] text-metin-3 hover:text-metin">Panoyu kaldır</button>}
          {sekme === "hazir" && (
            <label className="hidden items-center gap-2 rounded-xl bg-white/[0.05] px-3 py-1.5 sm:flex">
              <Search className="h-3.5 w-3.5 text-metin-3" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" aria-label="Pano ara" className="w-28 bg-transparent text-[12.5px] text-metin outline-none placeholder:text-metin-3" />
            </label>
          )}
        </>
      )}>
      <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(e) => { void yeniPano(e.target.files); e.target.value = ""; }} />
      {sekme === "hazir" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {HAZIR_PANOLAR.filter((p) => p.ad.toLocaleLowerCase("tr").includes(q)).map((p) => {
            const s = !secili?.kullanici && secili?.ad === p.ad;
            return (
              <button key={p.ad} onClick={() => { onSec(s ? null : { ad: p.ad, gorseller: p.gorseller }); onKapat(); }} aria-pressed={s}
                className={cn("group relative aspect-[3/4] overflow-hidden rounded-2xl ring-1 transition-all", s ? "ring-2 ring-aksan" : "ring-white/[0.06] hover:ring-white/20")}>
                {s && <SeciliIsaret />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-10 text-left text-[13px] font-semibold text-white">{p.ad}</span>
              </button>
            );
          })}
        </div>
      ) : panolar.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {panolar.map((p) => {
            const s = !!secili?.kullanici && secili.ad === p.ad;
            return (
              <div key={p.id} className={cn("group relative overflow-hidden rounded-2xl ring-1 transition-all", s ? "ring-2 ring-aksan" : "ring-white/[0.06] hover:ring-white/20")}>
                {s && <SeciliIsaret />}
                <button onClick={() => { onSec(s ? null : { ad: p.ad, gorseller: p.gorseller, kullanici: true, tarif: p.tarif, kacin: p.kacin, guc: p.guc, renkler: p.paletGonder ? p.renkler : undefined }); onKapat(); }} aria-pressed={s} className="block w-full text-left">
                  <span className="grid aspect-[3/4] grid-cols-2 grid-rows-2 gap-px bg-black/40">
                    {Array.from({ length: 4 }).map((_, i) => p.gorseller[i]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img key={i} src={p.gorseller[i]} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : <span key={i} className="bg-white/[0.03]" />)}
                  </span>
                  <span className="block px-3 py-2">
                    <span className="block text-[13px] font-semibold text-metin">{p.ad}</span>
                    <span className="block text-[11.5px] text-metin-3">{p.gorseller.length} görsel</span>
                  </span>
                </button>
                <button onClick={() => { panoSil(p.id); if (s) onSec(null); mesaj.silindi(p.ad, () => usePanolar.getState().panoGeriYukle(p)); }} aria-label={`${p.ad} sil`}
                  className="absolute bottom-2 right-2 rounded-lg p-1.5 text-metin-3 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-metin group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-[14px] font-medium text-metin">Henüz panon yok</p>
          <p className="mt-1 max-w-[360px] text-[12.5px] leading-relaxed text-metin-3">Aynı havayı taşıyan {PANO_MAKS_GORSEL} görsele kadar yükle. Yüz içermeyen, ışığı ve rengi belirgin görseller en iyi sonucu verir.</p>
          <button onClick={() => dosyaRef.current?.click()} className="mt-4 rounded-xl bg-white px-4 py-2 text-[13px] font-semibold text-zemin hover:opacity-90">Görsel seç</button>
        </div>
      )}
    </Kabuk>
  );
}

/* ═════════════ Renk paleti ═════════════ */
export function PaletModal({ secili, onSec, onKapat }: { secili: SeciliPalet | null; onSec: (p: SeciliPalet | null) => void; onKapat: () => void }) {
  const { paletler, paletEkle, paletSil } = usePanolar();
  const [sekme, setSekme] = useState<"hazir" | "benim">(paletler.length ? "benim" : "hazir");
  const [cikariliyor, setCikariliyor] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const cikar = async (d?: File) => {
    if (!d) return;
    setCikariliyor(true);
    try {
      const veri = await dosyaOku(d);
      const renkler = await paletCikar(veri, 6);
      if (!renkler.length) throw new Error("Renk bulunamadı");
      const ad = d.name.replace(/\.[^.]+$/, "").slice(0, 24) || `Palet ${paletler.length + 1}`;
      paletEkle(ad, renkler);
      onSec({ ad, renkler });
      setSekme("benim");
      toast.success("Palet çıkarıldı", { description: `${renkler.length} renk bulundu. Kredi düşmedi.` });
    } catch (e) {
      toast.error("Palet çıkarılamadı", { description: `${neden(e, "Görsel okunamadı.")} Başka bir görselle dene.` });
    } finally { setCikariliyor(false); }
  };

  const serit = (renkler: string[], buyuk = false) => (
    <span className={cn("flex overflow-hidden", buyuk ? "h-16 rounded-xl" : "h-2.5")}>
      {renkler.map((c, i) => <span key={c + i} className="flex-1" style={{ background: c }} />)}
    </span>
  );

  return (
    <Kabuk baslik="Renk paleti" onKapat={onKapat}
      aciklama="Paletin hex kodları istemde renk yönergesi olarak gider. Bir görselden kendi paletini çıkarabilirsin; tarayıcıda yapılır, kredi düşmez."
      eylem={(
        <button onClick={() => dosyaRef.current?.click()} disabled={cikariliyor} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-zemin hover:opacity-90 disabled:opacity-60">
          {cikariliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}Görselden çıkar
        </button>
      )}
      sekmeler={(
        <>
          <Sekme deger={sekme} onDegis={setSekme} secenekler={[["hazir", "Hazır"], ["benim", `Paletlerim${paletler.length ? ` · ${paletler.length}` : ""}`]]} />
          <span className="flex-1" />
          {secili && <button onClick={() => { onSec(null); onKapat(); }} className="text-[12.5px] text-metin-3 hover:text-metin">Paleti kaldır</button>}
        </>
      )}>
      <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void cikar(e.target.files?.[0]); e.target.value = ""; }} />
      {sekme === "hazir" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {HAZIR_PALETLER.map((p) => {
            const s = secili?.ad === p.ad;
            return (
              <button key={p.ad} onClick={() => { onSec(s ? null : { ad: p.ad, renkler: p.renkler }); onKapat(); }} aria-pressed={s}
                className={cn("relative overflow-hidden rounded-2xl text-left ring-1 transition-all", s ? "ring-2 ring-aksan" : "ring-white/[0.06] hover:ring-white/20")}>
                {s && <SeciliIsaret />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.gorsel} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                {serit(p.renkler)}
                <span className="block px-3 py-2 text-[13px] font-medium text-metin">{p.ad}</span>
              </button>
            );
          })}
        </div>
      ) : paletler.length ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {paletler.map((p) => {
            const s = secili?.ad === p.ad && secili.renkler.join() === p.renkler.join();
            return (
              <div key={p.id} className={cn("group relative rounded-2xl p-2.5 ring-1 transition-all", s ? "ring-2 ring-aksan" : "ring-white/[0.06] hover:ring-white/20")}>
                <button onClick={() => { onSec(s ? null : { ad: p.ad, renkler: p.renkler }); onKapat(); }} aria-pressed={s} className="block w-full text-left">
                  {serit(p.renkler, true)}
                  <span className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-metin">{p.ad}</span>
                    <span className="truncate font-mono text-[10.5px] text-metin-3">{p.renkler.slice(0, 3).join(" ")}</span>
                  </span>
                </button>
                <button onClick={() => { paletSil(p.id); if (s) onSec(null); mesaj.silindi(p.ad, () => usePanolar.setState((d) => (d.paletler.some((x) => x.id === p.id) ? d : { paletler: [p, ...d.paletler] }))); }} aria-label={`${p.ad} sil`}
                  className="absolute right-3.5 top-3.5 rounded-lg bg-black/50 p-1.5 text-white/80 opacity-0 transition-opacity hover:text-white group-hover:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-[14px] font-medium text-metin">Henüz paletin yok</p>
          <p className="mt-1 max-w-[340px] text-[12.5px] leading-relaxed text-metin-3">Sevdiğin bir görseli seç; baskın 6 rengi çıkarılıp paletlerine eklenir.</p>
        </div>
      )}
    </Kabuk>
  );
}
