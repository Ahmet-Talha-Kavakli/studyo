"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type, ImageIcon, Video, AudioLines, Plus, Play, Trash2,
  Sparkles, Link2, Layers, MousePointer2, Hand, StickyNote, Users,
  Pencil, Frame, Spline, MessageSquare,
  Maximize2, Map as MapIcon, ChevronDown, Upload, FolderOpen, Mic, Languages, Repeat,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { PaylasModal } from "@/components/panel/PaylasModal";
import { IsbirlikciGosterge } from "@/components/panel/IsbirlikciGosterge";
import { useCanvas, nodeKur, type NodeTur, type CanvasNode } from "@/store/useCanvas";
import { onizlemeArka, cn } from "@/lib/utils";

/**
 * Akış — klasik "Proje Akışı" görünümü (Canvas'ın basit/lineer kardeşi).
 * Yeni board-tabanlı useCanvas store'unu tek sabit "akış board'u" üzerinden kullanır.
 * (Tam node-graph editörü ayrı: /panel/canvas/[id].)
 */

const AKIS_BOARD_ANAHTAR = "vayra-akis-board";

const nodeTipleri: { tur: NodeTur; ad: string; ikon: typeof Type; renk: string }[] = [
  { tur: "istem", ad: "Metin / İstem", ikon: Type, renk: "from-slate-400 to-slate-600" },
  { tur: "gorsel", ad: "Görsel Üret", ikon: ImageIcon, renk: "from-cyan-glow to-blue-500" },
  { tur: "video", ad: "Video Üret", ikon: Video, renk: "from-vayra-400 to-vayra-600" },
  { tur: "ses", ad: "Ses Üret", ikon: AudioLines, renk: "from-emerald-400 to-teal-500" },
];

const ikonMap: Record<string, typeof Type> = {
  istem: Type, metin: Type, gorsel: ImageIcon, video: Video, ses: AudioLines, not: StickyNote, sticky: StickyNote,
};

type PaletOge = { tur: NodeTur; ad: string; ikon: typeof Type; renk: string };
const PALET_GRUPLAR: { grup: string; ogeler: PaletOge[] }[] = [
  { grup: "Girdi", ogeler: [
    { tur: "istem", ad: "Yükle", ikon: Upload, renk: "from-slate-400 to-slate-600" },
    { tur: "gorsel", ad: "Varlıklar", ikon: FolderOpen, renk: "from-amber-400 to-orange-500" },
  ] },
  { grup: "Görsel", ogeler: [{ tur: "gorsel", ad: "Görsel Üret", ikon: ImageIcon, renk: "from-cyan-glow to-blue-500" }] },
  { grup: "Video", ogeler: [{ tur: "video", ad: "Video Üret", ikon: Video, renk: "from-vayra-400 to-vayra-600" }] },
  { grup: "Ses", ogeler: [
    { tur: "ses", ad: "Seslendirme", ikon: Mic, renk: "from-emerald-400 to-teal-500" },
    { tur: "ses", ad: "Ses Değiştir", ikon: Repeat, renk: "from-emerald-400 to-teal-500" },
    { tur: "ses", ad: "Çeviri", ikon: Languages, renk: "from-emerald-400 to-teal-500" },
  ] },
  { grup: "Yardımcılar", ogeler: [
    { tur: "istem", ad: "Metin / İstem", ikon: Type, renk: "from-slate-400 to-slate-600" },
    { tur: "sticky", ad: "Yapışkan Not", ikon: StickyNote, renk: "from-yellow-300 to-amber-500" },
  ] },
];

const SABLONLAR: { ad: string; ozet: string; ikon: typeof Type; adimlar: NodeTur[] }[] = [
  { ad: "Basit Görsel Akışı", ozet: "İstem → Görsel", ikon: ImageIcon, adimlar: ["istem", "gorsel"] },
  { ad: "Görselden Video", ozet: "İstem → Görsel → Video", ikon: Video, adimlar: ["istem", "gorsel", "video"] },
  { ad: "Seslendirmeli Klip", ozet: "İstem → Video → Ses", ikon: Mic, adimlar: ["istem", "video", "ses"] },
  { ad: "Storyboard", ozet: "İstem → Görsel × 2", ikon: Frame, adimlar: ["istem", "gorsel", "istem", "gorsel"] },
];

export default function AkisPage() {
  const boardlar = useCanvas((s) => s.boardlar);
  const icerikler = useCanvas((s) => s.icerikler);
  const boardOlustur = useCanvas((s) => s.boardOlustur);
  const nodeEkle = useCanvas((s) => s.nodeEkle);
  const nodeGuncelle = useCanvas((s) => s.nodeGuncelle);
  const nodeSil = useCanvas((s) => s.nodeSil);
  const nodeTasi = useCanvas((s) => s.nodeTasi);
  const baglantiEkle = useCanvas((s) => s.baglantiEkle);
  const baglantiSil = useCanvas((s) => s.baglantiSil);
  const temizleStore = useCanvas((s) => s.temizle);

  // Sabit akış board'u — localStorage'da id sakla (yoksa oluştur).
  const [boardId, setBoardId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let id = localStorage.getItem(AKIS_BOARD_ANAHTAR);
    if (!id || !useCanvas.getState().boardlar.some((b) => b.id === id)) {
      id = boardOlustur("Akış");
      localStorage.setItem(AKIS_BOARD_ANAHTAR, id);
    }
    setBoardId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const icerik = useMemo(() => (boardId ? icerikler[boardId] : undefined), [boardId, icerikler]);
  const nodelar = useMemo(() => icerik?.nodelar ?? [], [icerik]);
  const baglantilar = useMemo(() => icerik?.baglantilar ?? [], [icerik]);

  const [palet, setPalet] = useState(false);
  const [suruklenen, setSuruklenen] = useState<string | null>(null);
  const [baglantiBasi, setBaglantiBasi] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const [arac, setArac] = useState<"sec" | "el" | "not" | "ciz" | "bagla">("sec");
  const [zoom, setZoom] = useState(100);
  const [minimap, setMinimap] = useState(false);
  const [paylas, setPaylas] = useState(false);

  const merkezEkle = (tur: NodeTur) => {
    if (!boardId) return;
    const sutun = nodelar.length % 3;
    const satir = Math.floor(nodelar.length / 3) % 3;
    const r = canvasRef.current?.getBoundingClientRect();
    const x = 120 + sutun * 260 + (r ? Math.max(0, (r.width - 900) / 2) : 0);
    const y = 100 + satir * 220;
    nodeEkle(boardId, nodeKur(tur, x, y));
    setPalet(false);
  };

  const sablonUygula = (adimlar: NodeTur[]) => {
    if (!boardId) return;
    const r = canvasRef.current?.getBoundingClientRect();
    const x0 = 120 + (r ? Math.max(0, (r.width - 900) / 2) : 0);
    const idler: string[] = [];
    adimlar.forEach((t, i) => idler.push(nodeEkle(boardId, nodeKur(t, x0 + i * 260, 160))));
    for (let i = 0; i < idler.length - 1; i++) baglantiEkle(boardId, idler[i], idler[i + 1]);
    toast.success("Şablon yüklendi ✨", { description: `${adimlar.length} düğüm bağlı olarak eklendi` });
  };

  const onMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
    const r = canvasRef.current!.getBoundingClientRect();
    const s = zoom / 100;
    offset.current = { x: (e.clientX - r.left) / s - node.x, y: (e.clientY - r.top) / s - node.y };
    setSuruklenen(node.id);
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!suruklenen || !boardId) return;
    const r = canvasRef.current!.getBoundingClientRect();
    const s = zoom / 100;
    /* nodeTasi artık DELTA alıyor (çoklu seçim için) — hedef konumdan farkı geç. */
    const hedefX = (e.clientX - r.left) / s - offset.current.x;
    const hedefY = (e.clientY - r.top) / s - offset.current.y;
    const n = nodelar.find((x) => x.id === suruklenen);
    if (n) nodeTasi(boardId, [suruklenen], hedefX - n.x, hedefY - n.y);
  }, [suruklenen, nodeTasi, zoom, boardId, nodelar]);

  const nodeUret = (node: CanvasNode) => {
    if (!boardId || node.tip === "istem" || node.tip === "metin") return;
    const girdiId = baglantilar.find((b) => b.hedef === node.id)?.kaynak;
    const girdi = girdiId ? nodelar.find((n) => n.id === girdiId)?.istem : "";
    const istem = girdi || node.istem || "otomatik";
    nodeGuncelle(boardId, node.id, { durum: "isleniyor", istem });
    setTimeout(() => {
      nodeGuncelle(boardId, node.id, { durum: "tamam", ciktiUrl: onizlemeArka(istem + node.tip, "sinematik") });
      toast.success("Üretildi ✨");
    }, 1800);
  };

  const baglantiTikla = (nodeId: string) => {
    if (!boardId) return;
    if (!baglantiBasi) { setBaglantiBasi(nodeId); toast.info("Hedef düğümü seç", { description: "Bağlantı için başka bir düğüme tıkla." }); }
    else if (baglantiBasi === nodeId) { setBaglantiBasi(null); }
    else {
      const ok = baglantiEkle(boardId, baglantiBasi, nodeId);
      setBaglantiBasi(null);
      if (ok) toast.success("Düğümler bağlandı");
      else toast.error("Bağlanamadı", { description: "Veri tipleri uyuşmuyor ya da döngü oluşur." });
    }
  };

  const nodeMerkez = (n: CanvasNode) => ({ x: n.x + 110, y: n.y + 60 });
  const nodeAd = (t: NodeTur) => nodeTipleri.find((x) => x.tur === t)?.ad ?? "Düğüm";

  return (
    <div className="relative" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Başlık şeridi */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-2 border-b border-white/8 bg-ink-950/70 px-3 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="h-5 w-5 shrink-0 text-cyan-glow" />
          <button className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-white transition-colors hover:bg-white/8">
            <span className="truncate">Akış</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden md:block"><IsbirlikciGosterge /></span>
          <span className="hidden h-5 w-px bg-white/10 md:block" />
          {nodelar.length > 0 && boardId && (
            <button onClick={() => { temizleStore(boardId); toast("Akış temizlendi"); }}
              className="hidden rounded-lg border border-white/12 px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/8 hover:text-white sm:block">
              Temizle
            </button>
          )}
          <button onClick={() => setPaylas(true)} aria-label="Paylaş"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/8 hover:text-white sm:px-3">
            <Users className="h-4 w-4" /> <span className="hidden sm:inline">Paylaş</span>
          </button>
          <button onClick={() => setPalet(true)} aria-label="Düğüm ekle"
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-glow px-2.5 py-1.5 text-sm font-semibold text-ink-950 transition-colors hover:brightness-110 sm:px-3.5">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Düğüm ekle</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {paylas && <PaylasModal baslik="Akış" onKapat={() => setPaylas(false)} />}
      </AnimatePresence>

      {/* Canvas */}
      <div ref={canvasRef} className="relative h-full w-full cursor-default overflow-hidden"
        onMouseMove={onMouseMove} onMouseUp={() => setSuruklenen(null)} onMouseLeave={() => setSuruklenen(null)}
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "26px 26px" }}>
        {/* Bağlantı çizgileri */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "0 0" }}>
          {baglantilar.map((b) => {
            const k = nodelar.find((n) => n.id === b.kaynak);
            const h = nodelar.find((n) => n.id === b.hedef);
            if (!k || !h) return null;
            const km = nodeMerkez(k), hm = nodeMerkez(h);
            const mx = (km.x + hm.x) / 2;
            return (
              <g key={b.id}>
                <path d={`M ${km.x} ${km.y} C ${mx} ${km.y}, ${mx} ${hm.y}, ${hm.x} ${hm.y}`} stroke="#22d3ee" strokeWidth="2" fill="none" opacity="0.6" />
                <circle cx={mx} cy={(km.y + hm.y) / 2} r="8" fill="#12101a" stroke="#22d3ee" strokeWidth="1.5"
                  className="pointer-events-auto cursor-pointer" onClick={() => boardId && baglantiSil(boardId, b.id)} opacity="0.9" />
                <text x={mx} y={(km.y + hm.y) / 2 + 3} textAnchor="middle" fontSize="10" fill="#22d3ee" className="pointer-events-none">×</text>
              </g>
            );
          })}
        </svg>

        {/* Boş durum */}
        {nodelar.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-y-auto py-8 text-center">
            <div className="mb-6 flex items-center gap-3">
              {nodeTipleri.slice(1, 4).map((t) => (
                <button key={t.tur} type="button" onClick={() => { merkezEkle(t.tur); toast.success(`${t.ad} düğümü eklendi`); }}
                  className={`flex h-28 w-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/12 bg-gradient-to-br ${t.renk} shadow-xl transition-transform hover:scale-105 active:scale-[0.97]`}>
                  <t.ikon className="h-7 w-7 text-white" />
                  <span className="px-1 text-center text-[11px] font-medium text-white">{t.ad}</span>
                </button>
              ))}
            </div>
            <h2 className="text-2xl font-bold">Özgürce inşa et, görsel otomatikleştir</h2>
            <p className="mt-2 max-w-md text-sm text-white/55">Düğümleri ekle, birbirine bağla ve tek akışta fikirden videoya. İstem → Görsel → Video zincirini kur.</p>
            <button onClick={() => setPalet(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-glow px-5 py-3 font-semibold text-ink-950 transition-colors hover:brightness-110">
              <Plus className="h-4 w-4" /> İlk düğümü ekle
            </button>
            <div className="mt-10 w-full max-w-2xl px-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/35">Şablonla başla</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {SABLONLAR.map((s) => (
                  <button key={s.ad} onClick={() => sablonUygula(s.adimlar)}
                    className="group/sab flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-yuzey p-3 text-left transition-colors hover:border-cyan-glow/40 hover:bg-white/5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg glass-ikon text-cyan-glow transition-colors group-hover/sab:bg-cyan-glow/15"><s.ikon className="h-4 w-4" /></span>
                    <span className="text-[13px] font-semibold leading-tight">{s.ad}</span>
                    <span className="text-[11px] leading-tight text-white/45">{s.ozet}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Düğümler */}
        <div className="absolute inset-0" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "0 0" }}>
          {nodelar.map((node) => {
            const Ikon = ikonMap[node.tip] ?? Type;
            const tip = nodeTipleri.find((t) => t.tur === node.tip);
            const baglaModu = baglantiBasi === node.id;
            const metinMi = node.tip === "istem" || node.tip === "metin";

            if (node.tip === "sticky") {
              return (
                <div key={node.id} onMouseDown={(e) => onMouseDown(e, node)}
                  className="absolute w-[200px] cursor-grab select-none rounded-xl border border-amber-300/30 bg-amber-200/90 shadow-xl active:cursor-grabbing" style={{ left: node.x, top: node.y }}>
                  <div className="flex items-center justify-between px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-900"><StickyNote className="h-3.5 w-3.5" /> Not</span>
                    <button data-nodrag onClick={() => boardId && nodeSil(boardId, [node.id])} className="text-amber-900/50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <textarea data-nodrag value={node.istem} onChange={(e) => boardId && nodeGuncelle(boardId, node.id, { istem: e.target.value })}
                    placeholder="Not yaz…" rows={4} className="w-full resize-none bg-transparent px-2.5 pb-2.5 text-sm text-amber-900 outline-none placeholder:text-amber-900/40" />
                </div>
              );
            }
            return (
              <div key={node.id} onMouseDown={(e) => onMouseDown(e, node)}
                className={cn("absolute w-[220px] cursor-grab select-none rounded-2xl border bg-ink-850 shadow-xl transition-shadow active:cursor-grabbing",
                  baglaModu ? "border-cyan-glow ring-2 ring-cyan-glow/40" : "border-white/12 hover:border-white/25")}
                style={{ left: node.x, top: node.y }}>
                <div className="flex items-center gap-2 border-b border-white/8 p-2.5">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${tip?.renk ?? "from-slate-400 to-slate-600"}`}><Ikon className="h-3.5 w-3.5 text-white" /></span>
                  <span className="flex-1 truncate text-xs font-semibold">{nodeAd(node.tip)}</span>
                  <button data-nodrag onClick={() => baglantiTikla(node.id)} title="Bağla"
                    className={cn("flex h-6 w-6 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-cyan-glow", baglaModu && "text-cyan-glow")}><Link2 className="h-3.5 w-3.5" /></button>
                  <button data-nodrag onClick={() => boardId && nodeSil(boardId, [node.id])} title="Sil" className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="p-2.5" data-nodrag>
                  {metinMi ? (
                    <textarea value={node.istem} onChange={(e) => boardId && nodeGuncelle(boardId, node.id, { istem: e.target.value })}
                      placeholder="İstem yaz…" rows={3} className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-2 text-xs outline-none placeholder:text-white/30 focus:border-cyan-glow/50" />
                  ) : (
                    <>
                      <div className="relative mb-2 aspect-video overflow-hidden rounded-lg" style={{ background: node.ciktiUrl ?? "linear-gradient(135deg,#1a1725,#12101a)" }}>
                        {node.durum === "isleniyor" && <div className="absolute inset-0 flex items-center justify-center bg-ink-900/60"><div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-cyan-glow" /></div>}
                        {node.durum === "bos" && <div className="absolute inset-0 flex items-center justify-center text-white/30"><Ikon className="h-8 w-8" /></div>}
                      </div>
                      <button onClick={() => nodeUret(node)} disabled={node.durum === "isleniyor"}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/8 py-1.5 text-xs font-medium transition-colors hover:bg-cyan-glow hover:text-ink-950 disabled:opacity-50">
                        {node.durum === "isleniyor" ? "Üretiliyor…" : <><Play className="h-3 w-3" /> Üret</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alt orta araç çubuğu */}
      <div className="menu-surface absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-1.5 shadow-xl">
        {[
          { id: "sec" as const, ikon: MousePointer2, ad: "Seç" },
          { id: "el" as const, ikon: Hand, ad: "Kaydır (boşluk)" },
          { id: "ciz" as const, ikon: Pencil, ad: "Çiz" },
        ].map((a) => (
          <Tooltip key={a.id} label={a.ad} side="top">
            <button onClick={() => setArac(a.id)} className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors", arac === a.id ? "bg-cyan-glow text-ink-950" : "text-white/60 hover:bg-white/8 hover:text-white")}><a.ikon className="h-4.5 w-4.5" /></button>
          </Tooltip>
        ))}
        <div className="mx-0.5 h-6 w-px bg-white/10" />
        <Tooltip label="Metin" side="top"><button onClick={() => { merkezEkle("istem"); toast.success("Metin düğümü eklendi"); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/8 hover:text-white"><Type className="h-4.5 w-4.5" /></button></Tooltip>
        <Tooltip label="Not" side="top"><button onClick={() => { merkezEkle("sticky"); toast.success("Not eklendi 📝"); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/8 hover:text-white"><StickyNote className="h-4.5 w-4.5" /></button></Tooltip>
        <Tooltip label="Çerçeve" side="top"><button onClick={() => toast("Çerçeve aracı", { description: "Bir alanı seçip düğümleri grupla" })} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/8 hover:text-white"><Frame className="h-4.5 w-4.5" /></button></Tooltip>
        <Tooltip label="Bağlantı çiz" side="top"><button onClick={() => { setArac("bagla"); toast("Bağlantı modu", { description: "İki düğüme sırayla tıklayarak bağla" }); }} className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors", arac === "bagla" ? "bg-cyan-glow text-ink-950" : "text-white/60 hover:bg-white/8 hover:text-white")}><Spline className="h-4.5 w-4.5" /></button></Tooltip>
        <div className="mx-0.5 h-6 w-px bg-white/10" />
        <Tooltip label="Yorum / Not" side="top"><button onClick={() => { setArac("not"); toast("Not modu", { description: "Tuvale tıklayıp not/yorum ekle." }); }} className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors", arac === "not" ? "bg-cyan-glow text-ink-950" : "text-white/60 hover:bg-white/8 hover:text-white")}><MessageSquare className="h-4.5 w-4.5" /></button></Tooltip>
        <div className="mx-0.5 h-6 w-px bg-white/10" />
        <Tooltip label="Düğüm ekle" side="top"><button onClick={() => setPalet(true)} className="flex h-9 w-9 items-center justify-center rounded-xl glass-ikon text-white/70 transition-colors hover:bg-cyan-glow hover:text-ink-950"><Plus className="h-4.5 w-4.5" /></button></Tooltip>
      </div>

      {/* Zoom kontrolü */}
      <div className="menu-surface absolute bottom-6 left-6 z-20 flex items-center gap-1 rounded-xl p-1 shadow-xl">
        <Tooltip label="Uzaklaş" side="top"><button onClick={() => setZoom((z) => Math.max(40, z - 10))} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/8 hover:text-white">−</button></Tooltip>
        <button onClick={() => setZoom(100)} className="min-w-[3rem] rounded-lg px-2 py-1 text-center text-xs font-medium text-white/70 transition-colors hover:bg-white/8" title="Sıfırla">%{zoom}</button>
        <Tooltip label="Yakınlaş" side="top"><button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/8 hover:text-white">+</button></Tooltip>
        <div className="mx-0.5 h-5 w-px bg-white/10" />
        <Tooltip label="Sığdır" side="top"><button onClick={() => { setZoom(100); offset.current = { x: 0, y: 0 }; toast("Görünüm sıfırlandı"); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/8 hover:text-white"><Maximize2 className="h-4 w-4" /></button></Tooltip>
        <Tooltip label="Mini harita" side="top"><button onClick={() => setMinimap((v) => !v)} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", minimap ? "bg-cyan-glow text-ink-950" : "text-white/60 hover:bg-white/8 hover:text-white")}><MapIcon className="h-4 w-4" /></button></Tooltip>
      </div>

      {/* Mini harita */}
      <AnimatePresence>
        {minimap && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 8 }}
            className="menu-surface absolute bottom-6 right-6 z-20 h-32 w-48 overflow-hidden rounded-xl p-2 shadow-xl">
            <div className="relative h-full w-full rounded-lg bg-white/[0.03]">
              {nodelar.map((n) => (
                <span key={n.id} className="absolute h-1.5 w-2 rounded-sm bg-cyan-glow/70" style={{ left: `${Math.min(92, Math.max(2, (n.x / 1600) * 100))}%`, top: `${Math.min(88, Math.max(2, (n.y / 900) * 100))}%` }} />
              ))}
              <span className="absolute bottom-1 right-1.5 text-[9px] text-white/40">{nodelar.length} düğüm</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Düğüm paleti */}
      <AnimatePresence>
        {palet && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setPalet(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="menu-surface absolute right-6 top-16 z-40 max-h-[70vh] w-64 overflow-y-auto rounded-2xl p-2">
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">Düğüm ekle</p>
              {PALET_GRUPLAR.map((g) => (
                <div key={g.grup} className="mt-1">
                  <p className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/30">{g.grup}</p>
                  {g.ogeler.map((t) => (
                    <button key={t.ad} onClick={() => { merkezEkle(t.tur); toast.success(`${t.ad} düğümü eklendi`); }}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/8">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${t.renk}`}><t.ikon className="h-4 w-4 text-white" /></span>
                      <span className="text-[13.5px] font-medium">{t.ad}</span>
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
