"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useState, useEffect } from "react";
import {
  Info, Upload, Sparkles, ChevronDown, Type, ImageIcon, Layers, Check, X, Shuffle, Lightbulb, Minus, Plus,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  SANAT_STILLERI, MODEL_TURLERI, UC_BOYUT_MODELLERI, POZLAR, LISANSLAR,
  NESIL_SAYILARI, UC_BOYUT_ORNEK_KARTLAR, type UcBoyutMod,
} from "@/lib/uc-boyut";
import { onizlemeArka, cn } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";

export interface UretimAyar {
  altMod: "gorsel" | "toplu" | "metin";
  stil: string;
  modelTuru: string;
  aiModel: string;
  poz: string;
  lisans: string;
  poligon: number;
  nesil: number;
  otomatikBol: boolean;
  gorseller: string[]; // yüklenen görsel adları
}

/**
 * Sol create paneli — Meshy birebir: 3 mod sekmesi (Görüntü / Toplu / Metin) +
 * İstek/yükleme + Örnekler modalı + Model Türü + AI Modeli + Poligon + Otomatik Bölme +
 * Poz + Nesil Sayısı + Lisans + maliyet + Üret CTA. Vayra lime tema.
 */
export function CreatePanel({
  mod, prompt, onPrompt, kredi, onUret, baslangicGorsel,
}: {
  mod: UcBoyutMod;
  prompt: string;
  onPrompt: (v: string) => void;
  kredi: number;
  onUret: (ayar: UretimAyar) => void;
  /** Görsel stüdyosundan "3D sahne oluştur" ile gelen referans görsel URL'i (madde 10). */
  baslangicGorsel?: string;
}) {
  // Sekme: metin modundaysa "metin", görsel modundaysa "gorsel" başlangıcı.
  const [altMod, setAltMod] = useState<"gorsel" | "toplu" | "metin">(mod === "gorsel" ? "gorsel" : "metin");
  const [stil, setStil] = useState("gercekci");
  const [modelTuru, setModelTuru] = useState("standart");
  const [aiModel, setAiModel] = useState(modelTuru === "akilli" ? "vayra-3d-t2" : "vayra-3d-6");
  const [aiMenu, setAiMenu] = useState(false);
  const [poz, setPoz] = useState("Hiçbiri");
  const [lisans, setLisans] = useState("cc");
  const [poligon, setPoligon] = useState(4000);
  const [nesil, setNesil] = useState(1);
  const [otomatikBol, setOtomatikBol] = useState(false);
  const [gorseller, setGorseller] = useState<string[]>([]);
  const [ornekModal, setOrnekModal] = useState(false);
  const [ornekTur, setOrnekTur] = useState(0); // "Başkasını göster" — örnek görsellerini döndürür

  const secilenModel = UC_BOYUT_MODELLERI.find((m) => m.id === aiModel)!;
  const gorselMod = altMod === "gorsel" || altMod === "toplu";
  const toplu = altMod === "toplu";

  const modTuruSec = (id: string) => {
    setModelTuru(id);
    setAiModel(id === "akilli" ? "vayra-3d-t2" : "vayra-3d-6");
  };

  const uret = () => {
    if (!gorselMod && prompt.trim().length < 3) return toast.error("Model tarifi çok kısa", { description: "Üretmek istediğin modeli birkaç kelimeyle tarif et." });
    if (gorselMod && gorseller.length === 0) return toast.error("Görsel eksik", { description: "Görselden model üretmek için önce bir görsel yükle." });
    onUret({ altMod, stil, modelTuru, aiModel, poz, lisans, poligon, nesil, otomatikBol, gorseller });
  };

  const gorselEkle = (ad: string) => {
    if (toplu) setGorseller((g) => (g.length >= 10 ? g : [...g, ad]));
    else setGorseller([ad]);
    toast.success("Görsel yüklendi");
  };

  // Görsel stüdyosundan gelen referansı otomatik yükle + görsel moduna geç (madde 10).
  useEffect(() => {
    if (baslangicGorsel) {
      setAltMod("gorsel");
      setGorseller([baslangicGorsel]);
    }
  }, [baslangicGorsel]);

  const ornekSec = (istem: string) => {
    onPrompt(istem);
    setAltMod("metin");
    setOrnekModal(false);
    toast.success("Örnek istem yüklendi", { description: "İstediğin gibi düzenleyip üretebilirsin." });
  };

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-white/[0.06] bg-yuzey">
      {/* Üst mod sekmeleri — Görüntü / Toplu / Metin */}
      <div className="flex gap-1.5 border-b border-white/[0.06] p-2.5">
        <SekmeBtn ikon={ImageIcon} ad="Görüntü" aktif={altMod === "gorsel"} onClick={() => setAltMod("gorsel")} />
        <SekmeBtn ikon={Layers} ad="Toplu" aktif={altMod === "toplu"} onClick={() => setAltMod("toplu")} />
        <SekmeBtn ikon={Type} ad="Metin" aktif={altMod === "metin"} onClick={() => setAltMod("metin")} />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 [scrollbar-width:thin]">
        {gorselMod ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold">{toplu ? `Görüntüler (${gorseller.length}/10)` : "Görüntü"}</label>
              <button onClick={() => setOrnekModal(true)} title="Örnekler" className="flex items-center gap-1 text-[11px] text-aksan hover:opacity-80">
                <Lightbulb className="h-3.5 w-3.5" /> Örnekler
              </button>
            </div>
            {toplu ? (
              <div className="grid grid-cols-3 gap-2">
                {gorseller.map((g, i) => (
                  <div key={i} className="relative aspect-square rounded-xl" style={{ background: onizlemeArka(g, "3d") }}>
                    <button onClick={() => setGorseller((x) => x.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white/80 hover:text-white"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {gorseller.length < 10 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/12 text-center transition-colors hover:border-aksan/40">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => gorselEkle(f.name.slice(0, 20))); e.target.value = ""; }} />
                    <Plus className="h-4 w-4 text-aksan" />
                    <span className="text-[9px] text-metin-3">+10 Maks</span>
                  </label>
                )}
              </div>
            ) : gorseller[0] ? (
              <div className="flex items-center gap-3 rounded-2xl border border-aksan/25 bg-aksan/[0.06] p-3">
                {/^(data:|https?:|\/)/.test(gorseller[0]) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={gorseller[0]} alt="Referans" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg" style={{ background: onizlemeArka(gorseller[0], "3d") }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-metin">{/^(data:|https?:|\/)/.test(gorseller[0]) ? "Görsel stüdyosundan referans" : gorseller[0]}</div>
                  <div className="mt-0.5 text-[11px] text-aksan">✓ 3D'ye hazır</div>
                </div>
                <button onClick={() => setGorseller([])} className="text-xs text-metin-2 hover:text-metin">Değiştir</button>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] text-center transition-colors hover:border-aksan/40 hover:bg-aksan/[0.03]">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) gorselEkle(f.name.slice(0, 30)); }} />
                <Upload className="h-6 w-6 text-aksan" />
                <span className="text-xs text-metin-2">Tıkla · Sürükle-bırak · Yapıştır</span>
                <span className="text-[10px] text-metin-3">.png .jpg .jpeg .webp · Maks 20MB</span>
              </label>
            )}
            {(modelTuru === "akilli") && (
              <div className="panel-ic mt-2.5 flex gap-2 rounded-xl p-2.5 text-[11px] text-metin-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aksan/70" />
                2D veya el çizimi sanat için daha iyi sonuç almak adına önce "Görsel Üretimi" ile görselini 3B'ye hazırlaman önerilir.
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-aksan" />
                <label className="text-sm font-semibold">İstek</label>
              </div>
              <button onClick={() => setOrnekModal(true)} title="Örnekler" className="flex items-center gap-1 text-[11px] text-aksan hover:opacity-80">
                <Lightbulb className="h-3.5 w-3.5" /> Örnekler
              </button>
            </div>
            <div className="relative">
              <textarea value={prompt} onChange={(e) => onPrompt(e.target.value.slice(0, 800))} rows={4}
                placeholder="Üretmek istediğin nesneyi tanımla. Ana dilini kullanabilirsin — örn: bir ortaçağ baltası, sevimli robot maskot…"
                className="w-full resize-none rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/40" />
              <span className="absolute bottom-2 right-3 text-[10px] text-metin-3">{prompt.length}/800</span>
            </div>
          </div>
        )}

        {/* Sanat stili */}
        <Alan ad="Sanat stili">
          <div className="flex flex-wrap gap-1.5">
            {SANAT_STILLERI.map((s) => (
              <button key={s.id} onClick={() => setStil(s.id)} title={s.ipucu}
                className={cn("hf-btn rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  stil === s.id ? "bg-aksan/15 text-aksan ring-1 ring-aksan/25" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>{s.ad}</button>
            ))}
          </div>
        </Alan>

        {/* Model türü */}
        <Alan ad="Model türü" bilgi>
          <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
            {MODEL_TURLERI.map((m) => (
              <button key={m.id} onClick={() => modTuruSec(m.id)} title={m.ipucu}
                className={cn("relative flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                  modelTuru === m.id ? "bg-yuzey-3 text-aksan" : "text-metin-2 hover:text-metin")}>
                {m.ad}
                {m.id === "akilli" && <span className="absolute -right-1 -top-1.5 rounded-[4px] bg-aksan px-1 py-px text-[8px] font-extrabold text-zemin">YENİ</span>}
              </button>
            ))}
          </div>
        </Alan>

        {/* AI modeli */}
        <Alan ad="Yapay zeka modeli" bilgi>
          <div className="relative">
            <button onClick={() => setAiMenu((v) => !v)}
              className="hf-btn panel-ic panel-ic-hover flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-metin">
              <span className="flex items-center gap-2">{secilenModel.ad}
                {secilenModel.rozet && <span className="rounded-[4px] bg-aksan px-1.5 py-0.5 text-[9px] font-bold text-zemin">{secilenModel.rozet.toUpperCase()}</span>}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-metin-2 transition-transform", aiMenu && "rotate-180")} />
            </button>
            <Yuzen acik={!!(aiMenu)} onKapat={() => setAiMenu(false)} sol={0} sag={0} ust={48} bosluk={0} className="menu-surface rounded-2xl p-1.5">
                  {UC_BOYUT_MODELLERI.map((m) => (
                    <button key={m.id} onClick={() => { setAiModel(m.id); setAiMenu(false); }}
                      className="flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm text-metin">{m.ad}
                          {m.rozet && <span className="rounded-[4px] bg-aksan px-1 py-0.5 text-[8px] font-bold text-zemin">{m.rozet.toUpperCase()}</span>}
                        </div>
                        <div className="mt-0.5 text-[11px] text-metin-3">{m.ipucu}</div>
                      </div>
                      {aiModel === m.id && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-aksan" />}
                    </button>
                  ))}
                </Yuzen>
          </div>
        </Alan>

        {/* Otomatik Bölme */}
        <ToggleAlan ad="Otomatik Bölme" bilgi ipucu="Üretimden sonra modeli otomatik parçalara ayırır. +10 kredi." acik={otomatikBol} onToggle={() => setOtomatikBol((v) => !v)} yeni />

        {/* Poligon (akıllı topoloji) */}
        {modelTuru === "akilli" && (
          <Alan ad="Poligon sayısı">
            <div className="flex items-center gap-3">
              <input type="range" min={1000} max={30000} step={500} value={poligon} onChange={(e) => setPoligon(+e.target.value)}
                className="flex-1 accent-aksan" />
              <span className="w-14 shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-center text-xs text-metin">{poligon}</span>
            </div>
          </Alan>
        )}

        {/* Poz */}
        <Alan ad="Poz" bilgi>
          <div className="flex flex-wrap gap-1.5">
            {POZLAR.map((p) => (
              <button key={p} onClick={() => setPoz(p)}
                className={cn("hf-btn rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  poz === p ? "bg-aksan/15 text-aksan ring-1 ring-aksan/25" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>{p}</button>
            ))}
          </div>
        </Alan>

        {/* Nesil sayısı (yalnızca metin modu) */}
        {altMod === "metin" && (
          <Alan ad="Nesil sayısı" bilgi>
            <div className="flex items-center gap-1.5">
              {NESIL_SAYILARI.map((n) => (
                <button key={n} onClick={() => setNesil(n)}
                  className={cn("hf-btn h-8 w-10 rounded-lg text-xs font-semibold transition-colors",
                    nesil === n ? "bg-aksan/15 text-aksan ring-1 ring-aksan/25" : "bg-white/[0.03] text-metin-2 hover:bg-white/[0.06] hover:text-metin")}>{n}×</button>
              ))}
              <span className="ml-1 text-[11px] text-metin-3">varyasyon</span>
            </div>
          </Alan>
        )}

        {/* Lisans */}
        <Alan ad="Lisans" bilgi>
          <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
            {LISANSLAR.map((l) => (
              <button key={l.id} onClick={() => setLisans(l.id)} title={l.ipucu}
                className={cn("flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                  lisans === l.id ? "bg-yuzey-3 text-aksan" : "text-metin-2 hover:text-metin")}>{l.ad}</button>
            ))}
          </div>
        </Alan>
      </div>

      {/* Footer: maliyet + Üret */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] text-metin-3">
          <span>yaklaşık {modelTuru === "akilli" ? "15 sn" : "1 dk"}</span>
          <span className="text-amber-glow">🪙 {kredi + (otomatikBol ? 10 : 0)}</span>
        </div>
        <button onClick={uret}
          className="hf-btn flex w-full items-center justify-center gap-2 rounded-2xl bg-aksan py-3 text-sm font-semibold text-zemin">
          <Sparkles className="h-4 w-4" /> {toplu ? "Toplu Üret" : "Üret"}
        </button>
      </div>

      {/* Örnekler modalı */}
      {ornekModal && (
        <div className="perde fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOrnekModal(false)}>
          <div className="menu-surface w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-metin">Örnekler</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setOrnekTur((t) => t + 1); toast("Yeni örnekler gösteriliyor"); }} className="flex items-center gap-1 text-[11px] text-metin-2 hover:text-metin">
                  <Shuffle className="h-3.5 w-3.5" /> Başkasını göster
                </button>
                <button onClick={() => setOrnekModal(false)} className="text-metin-2 hover:text-metin"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mb-4 text-xs text-metin-3">Ne deneyeceğinden emin değil misin? Bir örneğe tıkla, istemini girdi olarak kullan.</p>
            <div className="grid grid-cols-3 gap-3">
              {UC_BOYUT_ORNEK_KARTLAR.map((o) => (
                <button key={o.ad} onClick={() => ornekSec(o.istem)} className="group text-left">
                  <div className="aspect-square rounded-2xl border border-white/[0.06] transition-transform group-hover:scale-[1.03]" style={{ background: origArka(o.tohum + (ornekTur ? "-" + ornekTur : ""), o.kategori) }} />
                  <div className="mt-1.5 truncate text-center text-[11px] text-metin-2">{o.ad}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SekmeBtn({ ikon: Ikon, ad, aktif, onClick }: { ikon: typeof Type; ad: string; aktif: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("hf-btn flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors",
        aktif ? "bg-aksan/15 text-aksan ring-1 ring-aksan/25" : "text-metin-2 hover:bg-white/[0.05] hover:text-metin")}>
      <Ikon className="h-4 w-4" /> {ad}
    </button>
  );
}

function Alan({ ad, bilgi, children }: { ad: string; bilgi?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        <label className="text-xs font-semibold text-metin-2">{ad}</label>
        {bilgi && <Info className="h-3 w-3 text-metin-3" />}
      </div>
      {children}
    </div>
  );
}

function ToggleAlan({ ad, bilgi, ipucu, acik, onToggle, yeni }: { ad: string; bilgi?: boolean; ipucu?: string; acik: boolean; onToggle: () => void; yeni?: boolean }) {
  return (
    <div className="flex items-center justify-between" title={ipucu}>
      <div className="flex items-center gap-1">
        <label className="text-xs font-semibold text-metin-2">{ad}</label>
        {bilgi && <Info className="h-3 w-3 text-metin-3" />}
        {yeni && <span className="rounded-[4px] bg-aksan px-1 py-px text-[8px] font-extrabold text-zemin">YENİ</span>}
      </div>
      <button onClick={onToggle}
        className={cn("relative h-5 w-9 rounded-full transition-colors", acik ? "bg-white" : "bg-white/20")}>
        <span className={cn("absolute left-0 top-0.5 h-4 w-4 rounded-full transition-[left,background-color]", acik ? "left-[18px] bg-[#0a0a0b]" : "left-0.5 bg-white")} />
      </button>
    </div>
  );
}
