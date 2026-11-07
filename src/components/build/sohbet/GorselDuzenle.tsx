"use client";

import { useEffect, useRef, useState } from "react";
import { Brush, Download, Eraser, ExternalLink, Expand, ImagePlus, Loader2, Paintbrush, Scissors, Shuffle, Undo2, Wand2 } from "lucide-react";
import type { GorselIslemTur } from "@/lib/build/sohbetTipler";
import { cn } from "@/lib/utils";
import { ekYukle } from "./Besteci";
import { SagPanel } from "./ortak";

export type GorselIslem = (url: string, tur: "duzenle" | "varyasyon" | "referans") => void;

/** Sohbetteki görseller: üzerine gelince Düzenle, Varyasyon, Referans olarak kullan, İndir, Yeni sekmede aç. */
export function GorselIzgara({ urller, islem }: { urller: string[]; islem?: GorselIslem }) {
  return (
    <div className={cn("mt-2.5 grid gap-2", urller.length > 1 ? "grid-cols-2" : "max-w-[460px] grid-cols-1")}>
      {urller.map((u) => (
        <div key={u} className="group relative overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u} alt="Üretilen görsel" className="w-full transition-transform duration-500 group-hover:scale-[1.02]" />
          <div className="absolute inset-x-2 bottom-2 flex items-center gap-1 rounded-full bg-[#111214]/85 p-1 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 max-sm:opacity-100">
            {islem && <button type="button" onClick={() => islem(u, "duzenle")} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Düzenle</button>}
            {islem && <button type="button" onClick={() => islem(u, "varyasyon")} title="Varyasyon üret" aria-label="Varyasyon üret" className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/[0.1]"><Shuffle className="h-3.5 w-3.5" /></button>}
            {islem && <button type="button" onClick={() => islem(u, "referans")} title="Referans olarak ekle" aria-label="Referans olarak ekle" className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/[0.1]"><ImagePlus className="h-3.5 w-3.5" /></button>}
            <span className="ml-auto" />
            <a href={u} download title="İndir" aria-label="İndir" className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/[0.1]"><Download className="h-3.5 w-3.5" /></a>
            <a href={u} target="_blank" rel="noopener noreferrer" title="Yeni sekmede aç" aria-label="Yeni sekmede aç" className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/[0.1]"><ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      ))}
    </div>
  );
}

const ISLEMLER: { id: GorselIslemTur; ad: string; alt: string; I: typeof Wand2; maske?: boolean; istem: boolean }[] = [
  { id: "duzenle", ad: "Talimatla düzenle", alt: "Ne değişeceğini yaz", I: Wand2, istem: true },
  { id: "maske", ad: "Bölgeyi değiştir", alt: "Fırçayla boya, yerine ne geleceğini yaz", I: Paintbrush, maske: true, istem: true },
  { id: "sil", ad: "Nesne sil", alt: "Silinecek yeri fırçayla boya", I: Eraser, maske: true, istem: false },
  { id: "arkaplan", ad: "Arka planı kaldır", alt: "Şeffaf arka plan", I: Scissors, istem: false },
  { id: "genislet", ad: "Genişlet", alt: "Kenarlara doğru sahneyi büyüt", I: Expand, istem: true },
];
type Cizgi = { r: number; n: [number, number][] };

/**
 * Görsel düzenleme paneli (ChatGPT Select, Gemini Markup gibi): işlem seç, gerekiyorsa fırçayla bölge boya, ne
 * değişeceğini yaz. Maske beyaz-siyah PNG olarak yüklenir; istek sohbete gider, Vayra gorsel_duzenle ile yapar.
 */
export function GorselDuzenlePaneli({ url, kapat, gonder }: { url: string | null; kapat: () => void; gonder: (g: { metin: string; islem: GorselIslemTur; maske?: string }) => void }) {
  const [islem, setIslem] = useState<GorselIslemTur>("duzenle");
  const [istem, setIstem] = useState("");
  const [cizgiler, setCizgiler] = useState<Cizgi[]>([]);
  const [firca, setFirca] = useState(0.05);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [boyut, setBoyut] = useState<{ w: number; h: number } | null>(null);
  const tuval = useRef<HTMLCanvasElement>(null);
  const ciziyor = useRef(false);
  const secili = ISLEMLER.find((x) => x.id === islem)!;
  useEffect(() => { if (url) { setIslem("duzenle"); setIstem(""); setCizgiler([]); setHata(""); setBoyut(null); } }, [url]);

  useEffect(() => {
    const c = tuval.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "rgba(85,214,253,0.55)"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const z of cizgiler) {
      ctx.lineWidth = z.r * c.width;
      ctx.beginPath();
      z.n.forEach(([x, y], i) => (i ? ctx.lineTo(x * c.width, y * c.height) : ctx.moveTo(x * c.width, y * c.height)));
      if (z.n.length === 1) ctx.lineTo(z.n[0][0] * c.width + 0.1, z.n[0][1] * c.height);
      ctx.stroke();
    }
  }, [cizgiler, boyut]);

  const nokta = (e: React.PointerEvent): [number, number] => { const r = tuval.current!.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  const maskeYap = async (): Promise<string> => {
    const c = document.createElement("canvas");
    c.width = boyut!.w; c.height = boyut!.h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#fff"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (const z of cizgiler) { ctx.lineWidth = z.r * c.width; ctx.beginPath(); z.n.forEach(([x, y], i) => (i ? ctx.lineTo(x * c.width, y * c.height) : ctx.moveTo(x * c.width, y * c.height))); if (z.n.length === 1) ctx.lineTo(z.n[0][0] * c.width + 0.1, z.n[0][1] * c.height); ctx.stroke(); }
    const b = await new Promise<Blob>((ok, red) => c.toBlob((x) => (x ? ok(x) : red(new Error("Maske oluşturulamadı."))), "image/png"));
    const ek = await ekYukle(new File([b], "maske.png", { type: "image/png" }));
    return ek.url;
  };
  const gonderTikla = async () => {
    if ((islem === "duzenle" || islem === "maske") && !istem.trim()) { setHata("Ne değişeceğini yaz."); return; }
    if (secili.maske && !cizgiler.length) { setHata("Önce görselde değişecek bölgeyi fırçayla boya."); return; }
    setGidiyor(true); setHata("");
    try {
      const maske = secili.maske ? await maskeYap() : undefined;
      gonder({ metin: istem.trim() ? `${secili.ad}: ${istem.trim()}` : secili.ad, islem, maske });
      kapat();
    } catch (e) { setHata(e instanceof Error ? e.message : "Gönderilemedi."); }
    finally { setGidiyor(false); }
  };

  return (
    <SagPanel acik={!!url} kapat={kapat} baslik="Görseli düzenle" alt="Vayra görsel stüdyosuyla" ikon={<Wand2 className="h-[18px] w-[18px]" />} genislik={600}
      alt2={<>
        {hata && <p className="mr-auto text-[12.5px] text-rose-300">{hata}</p>}
        <span className="ml-auto" />
        <button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button>
        <button type="button" onClick={gonderTikla} disabled={gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}Düzenle</button>
      </>}>
      {url && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[16px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Düzenlenecek görsel" className="block w-full select-none" draggable={false} onLoad={(e) => setBoyut({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
            {secili.maske && boyut && (
              <canvas ref={tuval} width={Math.min(1200, boyut.w)} height={Math.round(Math.min(1200, boyut.w) * boyut.h / boyut.w)} className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                onPointerDown={(e) => { ciziyor.current = true; e.currentTarget.setPointerCapture(e.pointerId); setCizgiler((l) => [...l, { r: firca, n: [nokta(e)] }]); }}
                onPointerMove={(e) => { if (!ciziyor.current) return; const p = nokta(e); setCizgiler((l) => { const k = [...l]; const s = k[k.length - 1]; k[k.length - 1] = { ...s, n: [...s.n, p] }; return k; }); }}
                onPointerUp={() => { ciziyor.current = false; }} />
            )}
          </div>
          {secili.maske && (
            <div className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/[0.07]">
              <Brush className="h-4 w-4 text-[#8be6ff]" />
              <input type="range" min={0.015} max={0.15} step={0.005} value={firca} onChange={(e) => setFirca(Number(e.target.value))} aria-label="Fırça boyutu" className="min-w-0 flex-1 accent-[#55d6fd]" />
              <button type="button" disabled={!cizgiler.length} onClick={() => setCizgiler((l) => l.slice(0, -1))} title="Geri al" aria-label="Geri al" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 enabled:hover:bg-white/[0.07] disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
              <button type="button" disabled={!cizgiler.length} onClick={() => setCizgiler([])} className="h-8 rounded-full px-3 text-[12.5px] text-white/70 enabled:hover:bg-white/[0.07] disabled:opacity-30">Temizle</button>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {ISLEMLER.map((x) => (
              <button key={x.id} type="button" onClick={() => { setIslem(x.id); setHata(""); }} className={cn("relative flex items-center gap-2.5 rounded-[14px] bg-white/[0.04] p-2.5 text-left transition-colors hover:bg-white/[0.07]", islem === x.id && "ring-2 ring-white")}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><x.I className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/50">{x.alt}</span></span>
              </button>
            ))}
          </div>
          {secili.istem && (
            <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={3} maxLength={1500} autoFocus
              placeholder={islem === "maske" ? "Boyadığın yere ne gelsin? Örneğin: kırmızı bir kahve fincanı" : islem === "genislet" ? "Genişleyen kısımda ne olsun? Boş bırakırsan sahne doğal devam eder" : "Ne değişsin? Örneğin: arka planı gün batımında bir sahil yap"}
              className="w-full resize-none rounded-[14px] bg-white/[0.05] px-3.5 py-3 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/45 focus:ring-white/30" />
          )}
          <p className="text-[12px] leading-relaxed text-white/45">Düzenleme isteği sohbete mesaj olarak gider; sonuç yeni görsel olarak yanıtta görünür. Görsel sağlayıcısı bağlı değilse Vayra bunu açıkça söyler.</p>
        </div>
      )}
    </SagPanel>
  );
}
