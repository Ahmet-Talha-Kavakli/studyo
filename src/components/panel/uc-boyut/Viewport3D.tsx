"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3x3, Circle, CircleDashed, Hexagon, Sun, Bone, PersonStanding,
  RotateCw, ZoomIn, Move, Sparkles, Lightbulb, Check, X, Undo2, Redo2,
  Palette, Grid2x2, Boxes, Scan, Plug, Share2, Download, Waypoints, Sparkle,
} from "lucide-react";
import { ModelGoruntuleyici } from "@/components/panel/ModelGoruntuleyici";
import { RENDER_MODLARI, HDRI_ORTAMLARI, PBR_KANALLARI, POZ_PRESETLERI, DCC_HEDEFLERI } from "@/lib/uc-boyut";
import type { Uretim } from "@/store/useProjeler";
import { cn, saltUrl, onizlemeArka } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";
import { toast } from "@/lib/toast";

/**
 * Meshy birebir 3D viewport: boş karşılama / seçili modelin 3D önizlemesi +
 * üst render-modu şeridi (+Ekran/Bloom/Çevre popover) + HDRI şeridi +
 * istatistik overlay + iskelet + PBR harita inceleyici + Poz Özelleştir paneli +
 * alt merkez kontrol dock (Doku/Remesh/Rig/UV/DCC/Paylaş/İndir) + kamera ipuçları.
 * Vayra lime tema.
 */
export function Viewport3D({
  model, onOlustur, iskelet, onIskelet, animasyon, onAnimasyon,
  onDoku, onIndir, onPoz, onYenidenUret,
  onRemesh, onUV, onDCC, onBaglantiPaylas, onYayinla,
}: {
  model: Uretim | null;
  onOlustur: () => void;
  iskelet: boolean;
  onIskelet: () => void;
  animasyon: boolean;
  onAnimasyon: () => void;
  onDoku: () => void;
  onIndir: () => void;
  onPoz: (poz: string) => void;
  onYenidenUret: () => void;
  onRemesh: () => void;
  onUV: () => void;
  onDCC: (hedef: string) => void;
  onBaglantiPaylas: () => void;
  onYayinla: () => void;
}) {
  const [renderMod, setRenderMod] = useState("kati");
  const [hdri, setHdri] = useState("ic");
  const [ipucuKapali, setIpucuKapali] = useState(false);
  const [ekranAyar, setEkranAyar] = useState(false);
  const [cevreAyar, setCevreAyar] = useState(false);
  const [bloomAyar, setBloomAyar] = useState(false);
  const [izgara, setIzgara] = useState(true);
  const [istatistik, setIstatistik] = useState(true);
  const [otoDon, setOtoDon] = useState(true);
  const [bloom, setBloom] = useState(35);
  const [hdriGuc, setHdriGuc] = useState(60);
  const [pbrAcik, setPbrAcik] = useState(false);
  const [pbrKanal, setPbrKanal] = useState("albedo");
  const [pozAcik, setPozAcik] = useState(false);
  const [pozSecili, setPozSecili] = useState("ozel");
  const [dccMenu, setDccMenu] = useState(false);
  const [paylasMenu, setPaylasMenu] = useState(false);
  const govdeRef = useRef<HTMLDivElement>(null);

  // Viewport içindeki gerçek <model-viewer> elementini bul (kamera kontrolü için).
  const modelViewer = () => govdeRef.current?.querySelector("model-viewer") as (HTMLElement & { cameraOrbit?: string; resetTurntableRotation?: () => void; jumpCameraToGoal?: () => void }) | null;
  const kameraSifirla = () => {
    const mv = modelViewer();
    if (mv) { mv.cameraOrbit = "0deg 75deg 105%"; mv.jumpCameraToGoal?.(); toast.success("Kamera sıfırlandı"); }
    else toast.info("Sıfırlanacak model yok", { description: "Önce bir model seç ya da üret." });
  };
  const kameraDondur = () => {
    const mv = modelViewer();
    if (mv) { mv.cameraOrbit = "45deg 75deg 105%"; toast("Görünüm döndürüldü"); }
  };

  const ikonlar: Record<string, typeof Circle> = {
    circle: Circle, "circle-dashed": CircleDashed, hexagon: Hexagon, sun: Sun,
  };

  // İskelet için deterministik humanoid eklem konumları (yüzde).
  const eklemler = [
    [50, 12], [50, 22], [50, 34], [38, 26], [62, 26], [30, 38], [70, 38],
    [50, 46], [42, 60], [58, 60], [40, 78], [60, 78], [40, 92], [60, 92],
  ];

  if (!model) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-zemin">
        {izgara && (
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        )}
        <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
          <div className="mb-5 flex gap-1.5">
            <span className="h-6 w-6 rounded-full bg-aksan" />
            <span className="h-6 w-6 rotate-45 bg-aksan/70" />
            <span className="h-6 w-6 rounded-md bg-white/20" />
          </div>
          <h2 className="hf-baslik text-2xl text-aksan">Bugün ne yaratacaksın?</h2>
          <p className="mt-2 text-sm leading-relaxed text-metin-2">
            Metin ya da görselden yeni bir 3D model üret veya kitaplığından bir modeli düzenle. Bir sonraki şaheserin seni bekliyor.
          </p>
          <button onClick={onOlustur}
            className="hf-btn mt-6 flex items-center gap-2 rounded-full bg-aksan px-6 py-2.5 text-sm font-semibold text-zemin">
            <Sparkles className="h-4 w-4" /> Model Oluştur
          </button>
        </div>
      </div>
    );
  }

  const hazir = model.durum === "tamam";

  return (
    <div ref={govdeRef} className="relative flex flex-1 flex-col overflow-hidden bg-zemin">
      {/* Üst render-modu toolbar */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-xl border border-white/[0.06] bg-yuzey/85 p-1 backdrop-blur-md">
        <div className="relative">
          <ToolbarBtn ikon={Grid3x3} etiket="Ekran Ayarları" aktif={ekranAyar} onClick={() => { setEkranAyar((v) => !v); setCevreAyar(false); setBloomAyar(false); }} />
          <AnimatePresence>
            <Yuzen acik={!!(ekranAyar)} onKapat={() => setEkranAyar(false)} sol={0} ust={44} bosluk={0}><motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="menu-surface w-56 rounded-xl p-2.5 text-sm">
                  <div className="mb-1.5 px-1 text-xs font-semibold text-metin-2">Ekran Ayarları</div>
                  <AyarSatiri ad="Izgara" acik={izgara} onToggle={() => setIzgara((v) => !v)} />
                  <AyarSatiri ad="İstatistik" acik={istatistik} onToggle={() => setIstatistik((v) => !v)} />
                  <AyarSatiri ad="Otomatik döndürme" acik={otoDon} onToggle={() => setOtoDon((v) => !v)} />
                  <div className="mt-1 px-1 pt-2">
                    <div className="mb-1 flex items-center justify-between text-xs text-metin-2"><span>Dikey FOV</span><RotateCw className="h-3 w-3 text-metin-3" /></div>
                    <input type="range" min={20} max={90} defaultValue={50} className="w-full accent-aksan" />
                  </div>
                </motion.div></Yuzen>
          </AnimatePresence>
        </div>
        <span className="mx-0.5 h-5 w-px bg-white/10" />
        {RENDER_MODLARI.map((r) => (
          <ToolbarBtn key={r.id} ikon={ikonlar[r.ikon] ?? Circle} etiket={r.ad}
            aktif={renderMod === r.id} onClick={() => setRenderMod(r.id)} />
        ))}
        <span className="mx-0.5 h-5 w-px bg-white/10" />
        {/* Bloom / Parlama */}
        <div className="relative">
          <ToolbarBtn ikon={Sparkle} etiket="Parlama" aktif={bloomAyar} onClick={() => { setBloomAyar((v) => !v); setCevreAyar(false); setEkranAyar(false); }} />
          <AnimatePresence>
            <Yuzen acik={!!(bloomAyar)} onKapat={() => setBloomAyar(false)} sol={0} ust={44} bosluk={0}><motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="menu-surface w-52 rounded-xl p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-metin-2">Bloom Ayarları
                    <span className="h-3.5 w-6 rounded-full bg-aksan"><span className="ml-3 block h-3 w-3 translate-y-px rounded-full bg-white" /></span>
                  </div>
                  <div className="mb-1 text-[11px] text-metin-2">Güç</div>
                  <input type="range" min={0} max={100} value={bloom} onChange={(e) => setBloom(+e.target.value)} className="w-full accent-aksan" />
                </motion.div></Yuzen>
          </AnimatePresence>
        </div>
        {/* Çevre / HDRI */}
        <div className="relative">
          <ToolbarBtn ikon={Sun} etiket="Çevre Ayarları" aktif={cevreAyar} onClick={() => { setCevreAyar((v) => !v); setBloomAyar(false); setEkranAyar(false); }} />
          <AnimatePresence>
            <Yuzen acik={!!(cevreAyar)} onKapat={() => setCevreAyar(false)} sol={0} ust={44} bosluk={0}><motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="menu-surface w-60 rounded-xl p-3 text-sm">
                  <div className="mb-2 text-xs font-semibold text-metin-2">Çevre Ayarları</div>
                  <div className="mb-1 text-[11px] text-metin-2">HDRI</div>
                  <div className="mb-3 grid grid-cols-5 gap-1.5">
                    {HDRI_ORTAMLARI.map((h) => (
                      <button key={h.id} onClick={() => setHdri(h.id)} title={h.ad}
                        className={cn("h-7 rounded-md bg-gradient-to-br ring-1 transition-all", h.grad,
                          hdri === h.id ? "ring-aksan ring-2" : "ring-white/15 hover:ring-white/40")} />
                    ))}
                  </div>
                  <div className="mb-1 text-[11px] text-metin-2">Güç</div>
                  <input type="range" min={0} max={100} value={hdriGuc} onChange={(e) => setHdriGuc(+e.target.value)} className="mb-2 w-full accent-aksan" />
                  <AyarSatiri ad="Otomatik döndürme" acik={otoDon} onToggle={() => setOtoDon((v) => !v)} />
                </motion.div></Yuzen>
          </AnimatePresence>
        </div>
        <span className="mx-0.5 h-5 w-px bg-white/10" />
        <ToolbarBtn ikon={Bone} etiket={`İskelet — ${iskelet ? "Açık" : "Kapalı"}`} aktif={iskelet} onClick={onIskelet} />
        <ToolbarBtn ikon={PersonStanding} etiket={`Animasyon — ${animasyon ? "Açık" : "Kapalı"}`} aktif={animasyon} onClick={onAnimasyon} />
      </div>

      {/* PBR harita kanal şeridi (sağ üst) — yalnızca dokulu/PBR modelde */}
      {hazir && model.topoloji?.pbr && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-xl border border-white/[0.06] bg-yuzey/85 p-1 backdrop-blur-md">
          {PBR_KANALLARI.map((k) => (
            <button key={k.id} onClick={() => { setPbrKanal(k.id); setPbrAcik(true); }} title={k.ad}
              className={cn("h-6 w-6 rounded-md bg-gradient-to-br ring-1 transition-all", k.grad,
                pbrKanal === k.id ? "ring-aksan ring-2" : "ring-white/15 hover:ring-white/40")} />
          ))}
          <span className="mx-0.5 h-5 w-px bg-white/10" />
          <ToolbarBtn ikon={ZoomIn} etiket="Dokuyu incele" onClick={() => setPbrAcik(true)} />
        </div>
      )}

      {/* İstatistik kutusu — üst şeritin hemen altında (top-16), model rozetiyle çakışmaz */}
      {istatistik && model.topoloji && (
        <div className="absolute left-3 top-16 z-10 rounded-lg border border-white/[0.06] bg-yuzey/80 px-3 py-2 text-[11px] backdrop-blur-md">
          <div className="flex justify-between gap-6"><span className="text-metin-3">Topoloji</span><span className="font-medium">{model.topoloji.tip === "quad" ? "Dörtgen" : "Üçgen"}</span></div>
          <div className="flex justify-between gap-6"><span className="text-metin-3">Yüzler</span><span className="font-medium">{model.topoloji.poligon.toLocaleString("tr")}</span></div>
          <div className="flex justify-between gap-6"><span className="text-metin-3">Köşeler</span><span className="font-medium">{Math.round(model.topoloji.poligon * 0.62).toLocaleString("tr")}</span></div>
        </div>
      )}

      {/* 3D önizleme */}
      <div className="relative flex flex-1 items-center justify-center p-8">
        {(model.durum === "isleniyor" || model.durum === "kuyrukta") ? (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}>
              <Sparkles className="h-10 w-10 text-aksan" />
            </motion.div>
            <p className="text-sm text-metin-2">{model.durum === "kuyrukta" ? "Kuyrukta…" : "Model üretiliyor…"}</p>
            <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-aksan transition-all" style={{ width: `${Math.max(6, model.ilerleme)}%` }} />
            </div>
            <span className="text-xs text-metin-3">%{Math.round(model.ilerleme)}</span>
          </div>
        ) : (
        <div className="relative w-full max-w-md">
          <ModelGoruntuleyici glbUrl={model.glbUrl}
            thumbnail={saltUrl(model.thumbnailUrl ?? model.gorselUrl)}
            baslik={model.baslik} gercek={model.gercek} />
          {iskelet && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[[0,1],[1,2],[1,3],[1,4],[3,5],[4,6],[2,7],[7,8],[7,9],[8,10],[9,11],[10,12],[11,13]].map(([a,b],i) => (
                <line key={i} x1={eklemler[a][0]} y1={eklemler[a][1]} x2={eklemler[b][0]} y2={eklemler[b][1]}
                  stroke="var(--color-aksan)" strokeWidth="0.7" opacity="0.85" />
              ))}
              {eklemler.map(([x,y],i) => <circle key={i} cx={x} cy={y} r="1.4" fill="var(--color-amber-glow)" />)}
            </svg>
          )}
        </div>
        )}
      </div>

      {/* İpucu barı — üst şeritlerin ALTINA konumlandı (çakışmayı önler) */}
      {!ipucuKapali && hazir && (
        <div className="absolute top-16 left-1/2 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-amber-glow/30 bg-amber-glow/10 px-3 py-1.5 text-xs text-amber-200 backdrop-blur-md">
          <Lightbulb className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Pozu ayarlamak için eklemlere tıkla.</span>
          <button onClick={() => setIpucuKapali(true)} className="ml-1 flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 font-medium hover:bg-white/[0.14]">
            <Check className="h-3 w-3" /> Anladım
          </button>
        </div>
      )}

      {/* Alt merkez kontrol dock (Doku/Remesh/Rig/UV/DCC/Paylaş/İndir) */}
      {hazir && (
        <div className="absolute bottom-14 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/[0.06] bg-yuzey/90 p-1.5 backdrop-blur-md">
          <DockBtn ikon={RotateCw} etiket="Yeniden üret" rozet="4×" onClick={onYenidenUret} />
          <DockBtn ikon={Palette} etiket="Doku (Retexture)" aktif onClick={onDoku} />
          <DockBtn ikon={Grid2x2} etiket="Remesh" onClick={onRemesh} />
          <DockBtn ikon={Boxes} etiket="Rig" onClick={onAnimasyon} />
          <DockBtn ikon={Scan} etiket="UV'leri Aç" onClick={onUV} />
          <span className="mx-0.5 h-6 w-px bg-white/10" />
          {/* DCC Köprüsü */}
          <div className="relative">
            <DockBtn ikon={Plug} etiket="DCC Köprüsü" onClick={() => { setDccMenu((v) => !v); setPaylasMenu(false); }} />
            <AnimatePresence>
              <Yuzen acik={!!(dccMenu)} onKapat={() => setDccMenu(false)} alt={48} sol={0} bosluk={0}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="menu-surface w-52 rounded-xl p-1.5 text-sm">
                    <div className="px-2 py-1 text-xs font-semibold text-metin-2">DCC Köprüsü</div>
                    {DCC_HEDEFLERI.map((d) => (
                      <button key={d.ad} disabled={!d.aktif} onClick={() => { onDCC(d.ad); setDccMenu(false); }}
                        className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors", d.aktif ? "hover:bg-white/[0.06]" : "opacity-40")}>
                        <span className="h-3.5 w-3.5 rounded-sm" style={{ background: d.renk }} /> {d.ad}'a gönder{!d.aktif && " (yakında)"}
                      </button>
                    ))}
                  </motion.div></Yuzen>
            </AnimatePresence>
          </div>
          {/* Paylaş */}
          <div className="relative">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-amber-glow">+$20</span>
              <DockBtn ikon={Share2} etiket="Paylaş" onClick={() => { setPaylasMenu((v) => !v); setDccMenu(false); }} />
            </div>
            <AnimatePresence>
              <Yuzen acik={!!(paylasMenu)} onKapat={() => setPaylasMenu(false)} alt={48} sol={0} bosluk={0}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="menu-surface w-56 rounded-xl p-1.5 text-sm">
                    <button onClick={() => { onBaglantiPaylas(); setPaylasMenu(false); }}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/[0.06]">
                      <span className="flex items-center gap-2"><Share2 className="h-3.5 w-3.5" /> Paylaş ve Kazan</span>
                      <span className="text-[11px] font-bold text-amber-glow">+$20 💰</span>
                    </button>
                    <button onClick={() => { onYayinla(); setPaylasMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/[0.06]">
                      <Waypoints className="h-3.5 w-3.5" /> Topluluğa Yayınla
                    </button>
                  </motion.div></Yuzen>
            </AnimatePresence>
          </div>
          <button onClick={onIndir} title="İndir"
            className="ml-0.5 flex h-9 items-center gap-1.5 rounded-xl bg-aksan px-3 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.03]">
            <Download className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Alt sol: prompt tekrar + poz düzenle (kamera çubuğuyla çakışmaması için z-20 ve sınırlı genişlik) */}
      <div className="absolute bottom-4 left-4 z-20 flex max-w-[45%] flex-wrap items-center gap-2 text-[11px] text-metin-3">
        <button onClick={onYenidenUret} className="flex items-center gap-1 rounded-lg bg-yuzey/85 px-2 py-1 backdrop-blur-md hover:bg-white/[0.1]">
          <Undo2 className="h-3 w-3" /> İstemi yeniden kullan
        </button>
        {hazir && (
          <button onClick={() => setPozAcik(true)} className="flex items-center gap-1 rounded-lg bg-yuzey/85 px-2 py-1 backdrop-blur-md hover:bg-white/[0.1]">
            <PersonStanding className="h-3 w-3" /> Pozu Özelleştir
          </button>
        )}
      </div>

      {/* Alt sağ kamera kontrolleri — gerçek model-viewer kamera kontrolü */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-yuzey/80 px-2.5 py-1.5 text-[11px] text-metin-3 backdrop-blur-md">
        <button title="Görünümü döndür" onClick={kameraDondur} className="flex items-center gap-1 hover:text-white"><RotateCw className="h-3 w-3" /> Döndür</button>
        <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Yakınlaştır</span>
        <span className="flex items-center gap-1"><Move className="h-3 w-3" /> Kaydır</span>
        <span className="h-4 w-px bg-white/10" />
        <button title="Sıfırla" onClick={kameraSifirla} className="flex items-center gap-1 hover:text-white"><RotateCw className="h-3 w-3" /> Sıfırla</button>
      </div>

      {/* PBR harita inceleyici (tam ekran modal) */}
      <AnimatePresence>
        {pbrAcik && hazir && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 p-6" onClick={() => setPbrAcik(false)}>
            <div className="mb-4 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {PBR_KANALLARI.map((k) => (
                <button key={k.id} onClick={() => setPbrKanal(k.id)}
                  className={cn("h-10 w-10 rounded-lg bg-gradient-to-br ring-1 transition-all", k.grad,
                    pbrKanal === k.id ? "ring-aksan ring-2" : "ring-white/15 hover:ring-white/40")} title={k.ad} />
              ))}
              <button onClick={() => setPbrAcik(false)} className="ml-3 rounded-lg bg-white/10 p-2 hover:bg-white/[0.14]"><X className="h-4 w-4" /></button>
            </div>
            <div className="aspect-square w-full max-w-md rounded-2xl bg-gradient-to-br ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}
              style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}>
              <div className={cn("h-full w-full rounded-2xl bg-gradient-to-br", PBR_KANALLARI.find((k) => k.id === pbrKanal)?.grad)} />
            </div>
            <div className="mt-3 text-sm text-metin-2">{PBR_KANALLARI.find((k) => k.id === pbrKanal)?.ad} · UV atlası</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poz Özelleştir paneli (sağ overlay) */}
      <AnimatePresence>
        {pozAcik && hazir && (
          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
            className="absolute right-3 top-3 bottom-3 z-30 flex w-72 flex-col rounded-2xl border border-white/[0.06] bg-yuzey/95 p-3 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Pozu Özelleştir</h3>
              <button onClick={() => setPozAcik(false)} className="text-metin-2 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto [scrollbar-width:thin]">
              {POZ_PRESETLERI.map((p) => (
                <button key={p.id} onClick={() => setPozSecili(p.id)}
                  className={cn("group rounded-lg border p-1 transition-colors",
                    pozSecili === p.id ? "border-aksan bg-aksan/10" : "border-white/8 hover:border-white/25")}>
                  <div className="aspect-square rounded-md" style={{ background: origArka("poz-" + p.id, "3d") }} />
                  <div className="mt-1 truncate text-center text-[9px] text-metin-2">{p.ad}</div>
                </button>
              ))}
            </div>
            <button onClick={() => { onPoz(POZ_PRESETLERI.find((p) => p.id === pozSecili)?.ad ?? "Özel"); setPozAcik(false); }}
              className="mt-3 rounded-xl bg-aksan py-2.5 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02]">
              Özel Poza Gönder
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolbarBtn({ ikon: Ikon, etiket, aktif, onClick }: { ikon: typeof Circle; etiket: string; aktif?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={etiket}
      className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        aktif ? "bg-aksan/20 text-aksan" : "text-metin-2 hover:bg-white/[0.06] hover:text-white")}>
      <Ikon className="h-4 w-4" />
    </button>
  );
}

function DockBtn({ ikon: Ikon, etiket, aktif, rozet, onClick }: { ikon: typeof Circle; etiket: string; aktif?: boolean; rozet?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={etiket}
      className={cn("relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
        aktif ? "bg-aksan/20 text-aksan" : "text-metin-2 hover:bg-white/[0.06] hover:text-white")}>
      <Ikon className="h-4 w-4" />
      {rozet && <span className="absolute -bottom-0.5 -right-0.5 rounded bg-aksan/90 px-1 text-[8px] font-bold text-ink-950">{rozet}</span>}
    </button>
  );
}

function AyarSatiri({ ad, acik, onToggle }: { ad: string; acik: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/[0.05]">
      <span className="text-metin">{ad}</span>
      <span className={cn("relative h-4 w-7 rounded-full transition-colors", acik ? "bg-white" : "bg-white/20")}>
        <span className={cn("absolute top-0.5 h-3 w-3 rounded-full transition-all", acik ? "left-3.5 bg-[#0a0a0b]" : "left-0.5 bg-white")} />
      </span>
    </button>
  );
}
