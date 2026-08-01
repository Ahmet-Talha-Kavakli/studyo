"use client";

/**
 * INPAINT (Görseli Düzenle / fırça) — Higgsfield create-inpaint mobil BİREBİR.
 * Referans: ~/Desktop/responsive/create-inpaint (3 ekran).
 *
 * Yapı (tam ekran editör, üst normal başlık):
 *  ┌ "Görsel Düzenle ⌄" mod dropdown + ✕
 *  │ SOL DİKEY 5-RAIL: Fırça(lime-seçili) / Silgi / El / Geri / İleri
 *  │ maske tuvali: görsel + fırçayla boyanan yarı-saydam maske
 *  ├ alt panel: "Düzenlenecek alanı fırçala ve değişikliği anlat" istem +
 *  │   "+ Ürün/görsel ekle" + lime "Üret ✦3" + indir
 *  └
 *
 * Model dropdown: Nano Banana Pro Inpaint / Nano Banana Inpaint / Soul Inpaint /
 *   Ürün yerleştirme. Fırça çizimi HTML canvas ile (gerçek maske).
 */

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Brush, Eraser, Hand, Undo2, Redo2, Plus, Download, ChevronDown, X, Check, ImagePlus } from "lucide-react";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";

type Arac = "firca" | "silgi" | "el";

const MODELLER = [
  { id: "nano-pro", ad: "Nano Banana Pro Inpaint", ozet: "Maksimum detay ve doğruluk" },
  { id: "nano", ad: "Nano Banana Inpaint", ozet: "Hızlı, hafif düzenlemeler" },
  { id: "soul", ad: "Soul Inpaint", ozet: "Stilize sanatsal düzenlemeler" },
  { id: "urun", ad: "Ürün Yerleştirme", ozet: "Kusursuz ürün entegrasyonu" },
];

export default function InpaintPage() {
  const router = useRouter();
  const [medya, setMedya] = useState<string | null>(null);
  const [arac, setArac] = useState<Arac>("firca");
  const [model, setModel] = useState(MODELLER[0]);
  const [modelAcik, setModelAcik] = useState(false);
  const [istem, setIstem] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gorselRef = useRef<HTMLImageElement>(null);
  const [ciziyor, setCiziyor] = useState(false);
  const [gecmis, setGecmis] = useState<ImageData[]>([]);
  const [ileri, setIleri] = useState<ImageData[]>([]);

  const yukle = (dosyalar: FileList) => {
    const d = dosyalar[0];
    const r = new FileReader();
    r.onload = () => setMedya(String(r.result));
    r.readAsDataURL(d);
  };

  // Görsel yüklenince canvas boyutunu görsel oranına ayarla.
  const gorselYuklendi = () => {
    const img = gorselRef.current, cv = canvasRef.current;
    if (!img || !cv) return;
    cv.width = img.clientWidth;
    cv.height = img.clientHeight;
  };

  const noktaCiz = (e: React.PointerEvent) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (arac === "silgi") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(85, 214, 253,0.45)";
      ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    }
  };

  const basla = (e: React.PointerEvent) => {
    if (arac === "el") return;
    const cv = canvasRef.current, ctx = cv?.getContext("2d");
    if (cv && ctx) setGecmis((g) => [...g.slice(-9), ctx.getImageData(0, 0, cv.width, cv.height)]);
    setIleri([]);
    setCiziyor(true);
    noktaCiz(e);
  };
  const surukle = (e: React.PointerEvent) => { if (ciziyor) noktaCiz(e); };
  const bitir = () => setCiziyor(false);

  const geri = () => {
    const cv = canvasRef.current, ctx = cv?.getContext("2d");
    if (!cv || !ctx || gecmis.length === 0) return;
    setIleri((f) => [ctx.getImageData(0, 0, cv.width, cv.height), ...f].slice(0, 10));
    const son = gecmis[gecmis.length - 1];
    ctx.putImageData(son, 0, 0);
    setGecmis((g) => g.slice(0, -1));
  };
  const tekrar = () => {
    const cv = canvasRef.current, ctx = cv?.getContext("2d");
    if (!cv || !ctx || ileri.length === 0) return;
    setGecmis((g) => [...g, ctx.getImageData(0, 0, cv.width, cv.height)]);
    ctx.putImageData(ileri[0], 0, 0);
    setIleri((f) => f.slice(1));
  };

  const uret = () => {
    const s = uretimBaslat({
      baslik: `Düzenlenmiş görsel`, tur: "gorsel", model: model.ad,
      prompt: `${istem || "seçili alan yeniden çizildi"} · ${model.ad} inpaint`, kredi: 3, arac: "Inpaint",
    });
    if (!s.ok) return uretimHataToast(s, "Düzenlenemedi");
    toast.success("Düzenleniyor ✦", { description: model.ad });
    router.push("/panel/kitaplik");
  };

  const ARACLAR: { id: Arac | "geri" | "ileri"; ikon: typeof Brush; fn: () => void }[] = [
    { id: "firca", ikon: Brush, fn: () => setArac("firca") },
    { id: "silgi", ikon: Eraser, fn: () => setArac("silgi") },
    { id: "el", ikon: Hand, fn: () => setArac("el") },
    { id: "geri", ikon: Undo2, fn: geri },
    { id: "ileri", ikon: Redo2, fn: tekrar },
  ];

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      {/* Başlık: mod dropdown + ✕ */}
      <header className="flex h-[52px] shrink-0 items-center justify-between px-3">
        <button onClick={() => setModelAcik((v) => !v)}
          className="flex items-center gap-1.5 rounded-[10px] bg-yuzey-2 px-3 py-2 text-[15px] font-semibold text-white">
          {model.ad} <ChevronDown className="h-4 w-4 text-metin-2" />
        </button>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white">
          <X className="h-[22px] w-[22px]" />
        </button>
      </header>

      {/* Model dropdown */}
      {modelAcik && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setModelAcik(false)} />
          <div className="absolute left-3 top-[52px] z-50 w-[300px] rounded-[14px] menu-surface p-1.5">
            {MODELLER.map((m) => (
              <button key={m.id} onClick={() => { setModel(m); setModelAcik(false); }}
                className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left active:bg-white/[0.05]">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-white">{m.ad}</span>
                  <span className="block text-[12.5px] text-metin-2">{m.ozet}</span>
                </span>
                {m.id === model.id && <Check className="h-[18px] w-[18px] shrink-0 text-aksan" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Tuval alanı */}
      <div className="relative flex flex-1 items-center justify-center px-3">
        {/* Sol dikey rail */}
        {medya && (
          <div className="absolute left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
            {ARACLAR.map((a) => {
              const aktif = a.id === arac;
              return (
                <button key={a.id} onClick={a.fn} aria-label={a.id}
                  className={cn("flex h-11 w-11 items-center justify-center rounded-[12px] transition-colors",
                    aktif ? "bg-aksan text-zemin" : "bg-yuzey-2 text-white")}>
                  <a.ikon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        )}

        {medya ? (
          <div className="relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={gorselRef} src={medya} alt="Düzenlenen" onLoad={gorselYuklendi}
              className="max-h-[52vh] w-auto rounded-[12px]" />
            <canvas ref={canvasRef}
              className={cn("absolute inset-0 h-full w-full rounded-[12px]", arac === "el" ? "cursor-grab" : "cursor-crosshair touch-none")}
              onPointerDown={basla} onPointerMove={surukle} onPointerUp={bitir} onPointerLeave={bitir} />
          </div>
        ) : (
          <label className="flex h-[280px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-white/12">
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.length) yukle(e.target.files); e.target.value = ""; }} />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.07] text-metin-2">
              <ImagePlus className="h-6 w-6" />
            </span>
            <span className="text-[14px] text-metin-2">Düzenlemek için görsel yükle</span>
          </label>
        )}
      </div>

      {/* Alt panel */}
      <div className="shrink-0 space-y-3 rounded-t-[18px] bg-yuzey-2 p-4">
        <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={2}
          placeholder="Düzenlenecek alanı fırçala ve değişikliği anlat"
          className="w-full resize-none bg-transparent text-[15px] text-white outline-none placeholder:text-metin-3" />
        <button className="flex items-center gap-2 rounded-[10px] bg-[#2a2c2e] px-3.5 py-2.5 text-[14px] font-medium text-white">
          <Plus className="h-4 w-4" /> Ürün/görsel ekle
        </button>
        <div className="flex items-center gap-2">
          <button onClick={uret} disabled={!medya}
            className="hf-uret flex h-14 flex-1 items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold disabled:opacity-45">
            Üret <span className="flex items-center gap-1">✦ 3</span>
          </button>
          <button
            onClick={() => {
              if (!medya) { toast.error("İndirilecek görsel yok"); return; }
              const a = document.createElement("a");
              a.href = medya; a.download = "vayra-inpaint.webp";
              document.body.appendChild(a); a.click(); a.remove();
              toast.success("İndirildi 📦");
            }}
            disabled={!medya} aria-label="İndir"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#2a2c2e] text-white disabled:opacity-45">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
