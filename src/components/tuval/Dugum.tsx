"use client";

import { memo, useEffect, useRef, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { AlertTriangle, ChevronLeft, ChevronRight, Download, ListOrdered, Loader2, Box, Lock, Paintbrush, Play, RefreshCw, SlidersHorizontal, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { gorselYukle } from "@/components/arac/kit";
import { dosyaYukle } from "@/components/montaj/ortak";
import { KATALOG, PORT_AD, PORT_RENK, saydam } from "@/lib/tuval/katalog";
import { ayarDeger, kontroller, modelListesi, modelNotu } from "@/lib/tuval/ayarlar";
import { girdileriTopla, hazirMi, listeAyir, dugumOgeleri, tahminiKredi } from "@/lib/tuval/calistir";
import { aktifCikti, type Dugum as TDugum, type Surum, type Tuval } from "@/store/useTuval";
import { ModelSecici, SecimCipi, SesSecici } from "./Secicler";

/**
 * Canvas düğüm kartı: başlıkta tür rengi + model seçici, gövdede türüne göre içerik (yükleme, önizleme, oynatıcı, liste),
 * altta modelin gerçek yeteneklerinden gelen ayar çipleri, kredi ve Üret. Tüm ayarlar sağdaki Ayarlar panelinde.
 */
export const BASLIK_Y = 46, PORT_Y0 = 64, PORT_ARA = 30;
export const portY = (i: number) => PORT_Y0 + i * PORT_ARA;
const NOT_RENK = ["#3a3420", "#1f3a2e", "#3a2230", "#20304a"];
const YUKLE_KABUL: Record<string, string> = { yukle: "image/png,image/jpeg,image/webp,image/gif", videoYukle: "video/mp4,video/webm,video/quicktime", sesYukle: "audio/*" };

function Sure({ basla }: { basla?: number }) {
  const [, tik] = useState(0);
  useEffect(() => { const z = setInterval(() => tik((x) => x + 1), 1000); return () => clearInterval(z); }, []);
  return <>{basla ? Math.max(0, Math.round((Date.now() - basla) / 1000)) : 0} sn</>;
}

function Karsilastir({ a, b }: { a?: string; b?: string }) {
  const [x, setX] = useState(50);
  if (!a || !b) return <div className="flex aspect-[4/3] items-center justify-center rounded-[10px] border border-dashed border-white/12 px-4 text-center text-[12px] text-[var(--sc-metin-3)]">A ve B girişlerine iki görsel bağla</div>;
  const ayarla = (e: React.PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); setX(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))); };
  return (
    <div className="relative aspect-[4/3] cursor-ew-resize select-none overflow-hidden rounded-[10px]" data-etkilesim onPointerMove={(e) => { if (e.buttons === 1) ayarla(e); }} onPointerDown={ayarla}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={b} alt="B" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a} alt="A" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} />
      <span className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${x}%` }}><span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">⇆</span></span>
      <span className="absolute left-2 top-2 rounded-full bg-black/60 px-1.5 text-[10.5px] text-white">A</span><span className="absolute right-2 top-2 rounded-full bg-black/60 px-1.5 text-[10.5px] text-white">B</span>
    </div>
  );
}

/** Ses çıktısı: oynatıcı + basit dalga. */
function SesCikti({ c, renk }: { c: Surum; renk: string }) {
  if (!c.url) return <p className="flex h-[72px] items-center justify-center rounded-[10px] bg-white/[0.045] px-3 text-center text-[11.5px] text-[var(--sc-metin-3)]">Ses dosyası yok</p>;
  const cubuk = Array.from({ length: 36 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7 + (c.id.charCodeAt(1) || 1))) * 0.75);
  return (
    <div data-etkilesim className="space-y-1.5 rounded-[10px] bg-white/[0.045] p-2">
      <div className="flex h-8 items-center gap-[2px] px-1">{cubuk.map((h, i) => <span key={i} className="w-[3px] flex-1 rounded-full" style={{ height: `${h * 100}%`, background: saydam(renk, 60) }} />)}</div>
      <audio src={c.url} controls className="h-8 w-full" />
    </div>
  );
}

export const Dugum = memo(function Dugum({ d, t, secili, baglanabilir, onDegis, onCalistir, onIptal, onGovdeBas, onAyarlar, saltOkunur }: {
  d: TDugum; t: Tuval; secili: boolean;
  /** Bağlantı sürüklenirken bu düğümün uyumlu girişleri (vurgulanır). */
  baglanabilir?: string[];
  onDegis: (p: Partial<TDugum>, gecmis?: boolean) => void; onCalistir: () => void; onIptal: () => void;
  onGovdeBas: (e: React.PointerEvent) => void;
  onAyarlar?: () => void;
  /** Paylaşılan görünüm: düzenleme ve çalıştırma gizli. */
  saltOkunur?: boolean;
}) {
  const tn = KATALOG[d.tur];
  const I = tn.ikon;
  const renk = tn.cikti ? PORT_RENK[tn.cikti] : "#8693a5";
  const c = aktifCikti(d);
  const girdi = girdileriTopla(t, d);
  const engel = tn.calisir ? hazirMi(t, d) : null;
  const kredi = tn.calisir ? tahminiKredi(t, d) : 0;
  const ogeSayisi = dugumOgeleri(d, girdi).length;
  const calisiyor = d.durum === "calisiyor", sirada = d.durum === "sirada";
  const dosya = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  /** Ad yalnız çift tıklayınca düzenlenir; tek tık düğümü seçer ve taşır (kısayollar çalışmaya devam eder). */
  const [adDuzen, setAdDuzen] = useState(false);
  const sonAdBas = useRef(0);
  const adDuzenle = (el: HTMLInputElement) => { setAdDuzen(true); requestAnimationFrame(() => { el.focus(); el.select(); }); };
  const modeller = modelListesi(d.tur);
  const tumKontrol = kontroller(d.tur, d.model);
  const cipler = tumKontrol.filter((k) => "cip" in k && k.cip);
  const not = modelNotu(d.tur, d.model);
  const ayarYaz = (k: string, v: string | number | boolean) => onDegis({ ayar: { ...d.ayar, [k]: v }, ...(d.surumler.length ? { eski: true } : {}) });

  const yukle = async (f?: File) => {
    if (!f) return;
    const tip = d.tur === "yukle" ? "image/" : d.tur === "videoYukle" ? "video/" : "audio/";
    if (!f.type.startsWith(tip)) { toast.error("Bu dosya türü desteklenmiyor", { description: d.tur === "yukle" ? "Bu düğüme görsel yükle (PNG, JPG, WEBP)." : d.tur === "videoYukle" ? "Bu düğüme video yükle (MP4, WEBM, MOV)." : "Bu düğüme ses dosyası yükle." }); return; }
    if (f.size > (d.tur === "yukle" ? 10 : 200) * 1048576) { mesaj.dosyaCokBuyuk(d.tur === "yukle" ? 10 : 200); return; }
    setYukleniyor(true);
    try {
      const url = d.tur === "yukle"
        ? await gorselYukle(await new Promise<string>((coz, red) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.onerror = red; r.readAsDataURL(f); }))
        : await dosyaYukle(f);
      const tipAd = d.tur === "yukle" ? "gorsel" : d.tur === "videoYukle" ? "video" : "ses";
      onDegis({ surumler: [...d.surumler, { id: `s${Date.now().toString(36)}`, tip: tipAd, url, metin: f.name, zaman: Date.now() }], aktif: d.surumler.length, durum: "bitti" });
    } catch { mesaj.yuklenemedi(f.name); }
    setYukleniyor(false);
  };

  const oranK = tumKontrol.find((k) => k.id === "oran");
  const oran = oranK ? String(ayarDeger(oranK, d.ayar)) : "";
  const oranCss = /^\d+:\d+$/.test(oran) ? oran.replace(":", "/") : d.tur === "video" ? "16/9" : "1/1";

  const surumGezgini = d.surumler.length > 1 && !saltOkunur && (
    <div data-etkilesim className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-black/65 p-0.5 text-[10.5px] text-white">
      <button aria-label="Önceki sürüm" disabled={d.aktif === 0} onClick={() => onDegis({ aktif: d.aktif - 1 })} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-30"><ChevronLeft className="h-3 w-3" /></button>
      <span className="tabular-nums">{d.aktif + 1}/{d.surumler.length}</span>
      <button aria-label="Sonraki sürüm" disabled={d.aktif >= d.surumler.length - 1} onClick={() => onDegis({ aktif: d.aktif + 1 })} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-30"><ChevronRight className="h-3 w-3" /></button>
    </div>
  );
  const durumKatmani = (calisiyor || sirada) && (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
      <Loader2 className={cn("h-5 w-5 text-white", calisiyor && "animate-spin")} />
      <span className="text-[11.5px] text-white/90">{sirada ? "Sırada" : <>Üretiliyor · <Sure basla={d.baslangic} />{ogeSayisi > 1 ? ` · ${ogeSayisi} öğe` : ""}</>}</span>
    </div>
  );
  const demoRozet = null;
  const indir = c?.url && <a data-etkilesim href={c.url} download target="_blank" rel="noopener noreferrer" aria-label="İndir" className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover/dugum:opacity-100"><Download className="h-3 w-3" /></a>;

  const govde = (() => {
    if (d.kucuk) return c?.url && c.tip !== "ses" ? <div className="h-16 overflow-hidden rounded-[10px] bg-cover bg-center" style={{ backgroundImage: `url("${c.poster ?? c.url}")` }} /> : null;
    if (d.tur === "karsilastir") return <Karsilastir a={girdi.find((x) => x.port === "a")?.url} b={girdi.find((x) => x.port === "b")?.url} />;
    if (d.tur === "istem" || d.tur === "not" || d.tur === "liste") {
      const n = d.tur === "liste" ? listeAyir(d.metin ?? "").length : 0;
      return (
        <>
          <textarea data-etkilesim readOnly={saltOkunur} value={d.metin ?? ""} onChange={(e) => onDegis({ metin: e.target.value }, false)} onBlur={() => onDegis({ metin: d.metin }, true)}
            placeholder={d.tur === "istem" ? "Ne üretmek istiyorsun? Sahneyi, ışığı, kamerayı anlat…" : d.tur === "liste" ? "Her satıra bir öğe yaz:\nKırmızı spor ayakkabı\nMavi sırt çantası\nSiyah güneş gözlüğü" : "Not yaz…"} rows={d.tur === "not" ? 3 : 5}
            className={cn("w-full resize-y rounded-[10px] p-2.5 text-[12.5px] leading-relaxed outline-none placeholder:text-[var(--sc-metin-3)] [scrollbar-width:thin]", d.tur === "not" ? "bg-transparent text-[#f3ecd8]" : "bg-white/[0.045] text-[var(--sc-metin)] focus:bg-white/[0.065]")} />
          {d.tur === "liste" && <p className="flex items-center gap-1.5 px-1 text-[11.5px] text-[var(--sc-metin-3)]"><ListOrdered className="h-3 w-3" />{n} öğe · bağlı düğüm her öğe için ayrı çalışır</p>}
          {d.tur === "istem" && d.metin && <p className="px-1 text-right text-[10.5px] tabular-nums text-[var(--sc-metin-3)]">{d.metin.length} karakter</p>}
        </>
      );
    }
    if (d.tur === "yukle" || d.tur === "videoYukle" || d.tur === "sesYukle") {
      if (c?.url) return (
        <div className="group/y relative overflow-hidden rounded-[10px] bg-black/30">
          {c.tip === "gorsel" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.url} alt={c.metin ?? ""} draggable={false} className="max-h-[320px] w-full object-cover" />}
          {c.tip === "video" && <video data-etkilesim src={c.url} controls muted playsInline className="max-h-[260px] w-full" />}
          {c.tip === "ses" && <SesCikti c={c} renk={renk} />}
          {!saltOkunur && <button data-etkilesim onClick={() => dosya.current?.click()} className="absolute right-2 top-2 flex h-7 items-center gap-1 rounded-full bg-black/60 px-2.5 text-[11.5px] text-white opacity-0 transition-opacity group-hover/y:opacity-100"><RefreshCw className="h-3 w-3" />Değiştir</button>}
          {c.metin && <p className="truncate px-2 py-1 text-[11px] text-[var(--sc-metin-3)]">{c.metin}</p>}
        </div>
      );
      return (
        <button data-etkilesim disabled={saltOkunur} onClick={() => dosya.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); void yukle(e.dataTransfer.files[0]); }}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/15 text-[12.5px] text-[var(--sc-metin-2)] transition-colors hover:border-[var(--tv-aksan)]/50 hover:text-[var(--sc-metin)]">
          {yukleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          {yukleniyor ? "Yükleniyor…" : d.tur === "yukle" ? "Görsel seç ya da bırak" : d.tur === "videoYukle" ? "Video seç ya da bırak" : "Ses dosyası seç ya da bırak"}
          <span className="text-[11px] text-[var(--sc-metin-3)]">{d.tur === "yukle" ? "PNG, JPG, WEBP · 10 MB" : d.tur === "videoYukle" ? "MP4, WEBM, MOV · 200 MB" : "MP3, WAV, M4A · 200 MB"}</span>
        </button>
      );
    }
    if (tn.cikti === "metin" && tn.calisir) {
      const liste = (d.tur === "asistan" && d.ayar.cikti === "liste") || d.tur === "sahneler";
      if (!c?.metin) return calisiyor || sirada ? <div className="relative h-[72px] overflow-hidden rounded-[10px] bg-[var(--tv-zemin)]">{durumKatmani}</div> : d.tur === "asistan" ? null
        : <div className="flex h-[64px] flex-col items-center justify-center gap-1 rounded-[10px] bg-[var(--tv-zemin)] text-[11.5px] text-[var(--sc-metin-3)]"><I className="h-4 w-4 opacity-60" />{tn.girisler.some((g) => g.zorunlu) && !girdi.length ? `${tn.girisler.find((g) => g.zorunlu)!.ad} bağla` : "Metin burada çıkar"}</div>;
      return (
        <div className="relative">
          <div data-etkilesim data-kaydirilabilir className="max-h-[200px] overflow-y-auto whitespace-pre-line rounded-[10px] bg-white/[0.045] p-2.5 text-[12.5px] leading-relaxed text-[var(--sc-metin-2)] [scrollbar-width:thin]">{c.metin}</div>
          {liste && <p className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-[var(--sc-metin-3)]"><ListOrdered className="h-3 w-3" />{listeAyir(c.metin).length} öğe · bağlı düğüm her biri için çalışır</p>}
          
          {(calisiyor || sirada) && <div className="absolute inset-0 overflow-hidden rounded-[10px]">{durumKatmani}</div>}
          {surumGezgini}
        </div>
      );
    }
    if (tn.cikti === "ses" && tn.calisir) {
      return (
        <div className="relative">
          {c ? <SesCikti c={c} renk={renk} /> : !calisiyor && !sirada && <div className="flex h-[72px] flex-col items-center justify-center gap-1 rounded-[10px] bg-[var(--tv-zemin)] text-[11.5px] text-[var(--sc-metin-3)]"><I className="h-5 w-5 opacity-60" />Üretilince burada çalınır</div>}
          {(calisiyor || sirada) && <div className="relative h-[72px] overflow-hidden rounded-[10px] bg-[var(--tv-zemin)]">{durumKatmani}</div>}
          
          {surumGezgini}
        </div>
      );
    }
    const dogal = (c?.tip === "gorsel" && d.tur !== "gorsel") || d.tur === "videoBuyut";
    return (
      <div className="relative overflow-hidden rounded-[10px] bg-[var(--tv-zemin)]" style={{ aspectRatio: dogal ? undefined : oranCss }}>
        {c?.tip === "gorsel" && c.url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.url} alt="" draggable={false} className={cn("h-full w-full object-cover", d.tur === "arkaplan" && "bg-[conic-gradient(#2a2f38_25%,#1d2129_0_50%,#2a2f38_0_75%,#1d2129_0)] bg-[length:16px_16px] object-contain")} />}
        {c?.tip === "video" && (c.url ? <video data-etkilesim src={c.url} poster={c.poster} controls loop muted playsInline className="h-full w-full object-cover" /> : c.poster ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.poster} alt="" className="h-full w-full object-cover" /> : null)}
        {d.tur === "maske" && !c && girdi.find((x) => x.port === "gorsel")?.url && <>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src={girdi.find((x) => x.port === "gorsel")!.url} alt="" draggable={false} className="h-full w-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}{typeof d.ayar.maskeUrl === "string" && <img src={d.ayar.maskeUrl} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-screen [filter:sepia(1)_hue-rotate(140deg)_saturate(6)]" />}
        </>}
        {d.tur === "maske" && !saltOkunur && girdi.some((x) => x.port === "gorsel" && x.url) && !calisiyor && (
          <button data-etkilesim onClick={() => window.dispatchEvent(new CustomEvent("tuval-maske", { detail: d.id }))} className="absolute bottom-2 left-1/2 z-[2] flex h-8 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/70 px-3 text-[12px] font-medium text-white ring-1 ring-white/15 hover:bg-black/85">
            <Paintbrush className="h-3.5 w-3.5" />{d.ayar.maskeUrl ? "Maskeyi düzenle" : "Değişecek alanı boya"}
          </button>
        )}
        {!c && !calisiyor && !sirada && !(d.tur === "maske" && girdi.some((x) => x.port === "gorsel" && x.url)) && <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1.5 text-[11.5px] text-[var(--sc-metin-3)]"><I className="h-5 w-5 opacity-60" />{tn.girisler.some((g) => g.zorunlu) && !girdi.length ? `${tn.girisler.find((g) => g.zorunlu)!.ad} bağla` : "Üretilince burada görünür"}</div>}
        {c?.glb && !calisiyor && <button data-etkilesim onClick={() => window.dispatchEvent(new CustomEvent("tuval-3d", { detail: { glb: c.glb, poster: c.url, ad: d.ad ?? tn.ad } }))} className="absolute bottom-2 left-1/2 z-[2] flex h-8 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/70 px-3 text-[12px] font-medium text-white ring-1 ring-white/15 hover:bg-black/85"><Box className="h-3.5 w-3.5" />3D görüntüle</button>}
        {durumKatmani}{demoRozet}{surumGezgini}{indir}
      </div>
    );
  })();

  return (
    <div onPointerDown={onGovdeBas} data-dugum={d.id} onDoubleClick={(e) => { if ((e.target as HTMLElement).closest("[data-baslik]")) onAyarlar?.(); }}
      className={cn("group/dugum absolute select-none rounded-[18px] transition-[box-shadow,opacity] duration-150", d.kapali && "opacity-45 saturate-50",
        d.tur === "not" ? "" : "bg-[var(--tv-kart)]",
        secili ? "ring-2 ring-white shadow-[0_0_0_6px_rgba(255,255,255,0.08)]" : d.durum === "hata" ? "ring-1 ring-rose-400/60" : "ring-1 ring-[var(--tv-kenar)] hover:ring-white/[0.2]")}
      style={{ left: d.x, top: d.y, width: tn.genislik, ...(d.tur === "not" ? { background: d.renk ?? NOT_RENK[0] } : {}) }}>
      {d.tur !== "not" && <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[64px] rounded-t-[18px]" style={{ background: `linear-gradient(180deg, ${saydam(renk, 13)}, transparent)` }} />}
      {d.tur !== "not" && <span aria-hidden className="pointer-events-none absolute left-5 right-5 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${saydam(renk, 80)}, transparent)` }} />}
      {d.etiket && d.tur !== "not" && <span aria-hidden className="pointer-events-none absolute -top-[3px] left-6 h-[5px] w-14 rounded-full" style={{ background: d.etiket }} />}
      {d.kapali && <span className="pointer-events-none absolute -top-3 right-4 z-[3] rounded-full bg-[var(--tv-yukselti)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--sc-metin-2)] ring-1 ring-white/[0.12]">Devre dışı</span>}
      {(calisiyor || sirada) && <span aria-hidden className="pointer-events-none absolute -inset-[3px] rounded-[21px] ring-2 ring-white/70 [animation:tv-parilti_1.6s_ease-in-out_infinite]" />}

      {/* Girişler */}
      {tn.girisler.map((g, i) => {
        const bagli = t.kenarlar.some((e) => e.hedef === d.id && e.port === g.id);
        const vurgu = baglanabilir?.includes(g.id);
        return (
          <div key={g.id} data-giris={`${d.id}:${g.id}`} title={`${g.ad} (${PORT_AD[g.tip]})${g.coklu ? " · birden çok" : ""}${g.zorunlu ? " · gerekli" : ""}`}
            className="group/port absolute -left-[10px] flex h-[20px] w-[20px] cursor-crosshair items-center justify-center" style={{ top: portY(i) - 10 }}>
            <span className={cn("h-3 w-3 rounded-full border-2 ring-[3px] ring-[var(--tv-kart)] transition-transform group-hover/port:scale-125", vurgu && "scale-150 ring-white/80", g.zorunlu && !bagli && !vurgu && "border-dashed")} style={{ borderColor: PORT_RENK[g.tip], background: bagli || vurgu ? PORT_RENK[g.tip] : "var(--tv-kart)" }} />
            {/* Çok girişli düğümde boş girişlerin adı hep görünür; diğerleri üzerine gelince. */}
            <span className={cn("pointer-events-none absolute right-6 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-opacity", vurgu ? "bg-black/80 text-white opacity-100" : "bg-black/80 text-white opacity-0 group-hover/port:opacity-100")}>{g.ad}{g.zorunlu && !bagli ? " *" : ""}</span>
          </div>
        );
      })}
      {tn.cikti && (
        <div data-cikis={d.id} title={`Çıktı: ${PORT_AD[tn.cikti]} · sürükleyip bağla`} className="group/cikis absolute -right-[10px] flex h-[20px] w-[20px] cursor-crosshair items-center justify-center" style={{ top: portY(0) - 10 }}>
          <span className="h-3 w-3 rounded-full border-2 ring-[3px] ring-[var(--tv-kart)] transition-transform group-hover/cikis:scale-150" style={{ borderColor: renk, background: t.kenarlar.some((e) => e.kaynak === d.id) ? renk : "var(--tv-kart)" }} />
        </div>
      )}

      {/* Başlık */}
      <div data-baslik className="relative flex items-center gap-2 px-3 pt-2.5" style={{ height: BASLIK_Y - 6 }}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px]" style={{ background: saydam(renk, 18), color: renk, boxShadow: `inset 0 0 0 1px ${saydam(renk, 30)}` }}><I className="h-3.5 w-3.5" /></span>
        <input data-etkilesim={adDuzen || undefined} data-ad-salt={!adDuzen || undefined} readOnly={saltOkunur || !adDuzen} tabIndex={adDuzen ? 0 : -1} value={d.ad ?? tn.ad} onChange={(e) => onDegis({ ad: e.target.value.slice(0, 40) }, false)} aria-label="Düğüm adı"
          title={saltOkunur ? undefined : "Yeniden adlandırmak için çift tıkla"}
          onMouseDown={(e) => { if (!adDuzen) e.preventDefault(); }}
          onPointerDown={(e) => {
            if (adDuzen || saltOkunur || e.button !== 0) return;
            /* Tuval işaretçiyi yakaladığı için dblclick buraya gelmez; iki hızlı basışı kendimiz sayarız. */
            const simdi = performance.now();
            if (simdi - sonAdBas.current < 380) { e.stopPropagation(); sonAdBas.current = 0; adDuzenle(e.currentTarget); return; }
            sonAdBas.current = simdi;
          }}
          onDoubleClick={(e) => { if (saltOkunur) return; e.stopPropagation(); if (!adDuzen) adDuzenle(e.currentTarget); }}
          onBlur={() => setAdDuzen(false)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); e.currentTarget.blur(); } }}
          className={cn("min-w-0 flex-1 truncate rounded-[6px] bg-transparent px-1 -mx-1 text-[13px] font-medium text-[var(--sc-metin)] outline-none transition", adDuzen ? "cursor-text ring-1 ring-white/50" : "cursor-default select-none")} />
        {d.kilit && <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)]" aria-label="Kilitli" />}
        {modeller.length > 0 && d.model && !saltOkunur && <ModelSecici kucuk deger={d.model} modeller={modeller} onSec={(m) => onDegis({ model: m, ...(d.surumler.length ? { eski: true } : {}) })} />}
        {modeller.length > 0 && d.model && saltOkunur && <span className="truncate rounded-full bg-white/[0.075] px-2 py-0.5 text-[11px] text-[var(--sc-metin-2)]">{d.model}</span>}
      </div>

      <div className="relative space-y-2 px-2.5 pb-2.5 pt-1.5">
        {d.tur === "not" && !saltOkunur && (
          <div data-etkilesim className="flex gap-1 px-1">{NOT_RENK.map((r) => <button key={r} onClick={() => onDegis({ renk: r })} aria-label="Not rengi" className={cn("h-4 w-4 rounded-full ring-1 ring-white/20", (d.renk ?? NOT_RENK[0]) === r && "ring-2 ring-white")} style={{ background: r }} />)}</div>
        )}
        {govde}
        {tn.istemli && !d.kucuk && (!saltOkunur || d.metin) && (
          <textarea data-etkilesim readOnly={saltOkunur} value={d.metin ?? ""} onChange={(e) => onDegis({ metin: e.target.value, ...(d.surumler.length ? { eski: true } : {}) }, false)}
            placeholder={d.tur === "asistan" ? "Asistana ne yazdıralım? Ör. bu ürün için 5 farklı reklam istemi" : d.tur === "ses" ? "Okunacak metin (ya da bir metin bağla)" : d.tur === "muzik" ? "Tarz, tempo, duygu: “lo-fi, 80 bpm, yağmurlu akşam”" : d.tur === "efekt" ? "Sesi tarif et: “uzaktan gök gürültüsü, yağmur”" : d.tur === "duzenle" ? "Ne değişsin? “arka planı mermer yap, ışığı yumuşat”" : d.tur === "zemin" ? "Yeni zemin: “gün batımında sahil, sıcak ışık”" : d.tur === "genislet" ? "Yeni alanlarda ne olsun? (isteğe bağlı)" : d.tur === "isik" ? "Ek ışık tarifi (isteğe bağlı): “pencereden süzülen ışık”" : d.tur === "eskiz" ? "Bitmiş görsel nasıl olsun? “sulu boya, pastel”" : d.tur === "videoUzat" ? "Sonra ne olsun? “kamera geri çekilir, şehir görünür”" : d.tur === "gelistir" ? "Kısa fikir: “yağmurda neon sokak”" : d.tur === "sahneler" ? "Hikâye: “Bir kedi kaybolan sahibini arıyor…”" : d.tur === "birlestir" ? "Şablon: “{1}, {2} stilinde, {3}”" : girdi.some((x) => x.tip === "metin") ? "Ek istem (bağlı isteme eklenir)" : "İstem yaz ya da bir istem bağla"} rows={2}
            className="w-full resize-y rounded-[10px] bg-white/[0.045] p-2 text-[12px] leading-relaxed text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)] focus:bg-white/[0.065] [scrollbar-width:thin]" />
        )}

        {/* Hızlı ayar çipleri (modelin yetenekleri) */}
        {!saltOkunur && !d.kucuk && (cipler.length > 0 || d.tur === "ses" || d.tur === "sesDegistir") && (
          <div className="flex flex-wrap items-center gap-1">
            {(d.tur === "ses" || d.tur === "sesDegistir") && <SesSecici kucuk deger={String(d.ayar.sesAd ?? "George")} onSec={(v) => ayarYaz("sesAd", v)} />}
            {cipler.map((k) => k.tur === "secim"
              ? <SecimCipi key={k.id} k={k} deger={String(ayarDeger(k, d.ayar))} onSec={(v) => ayarYaz(k.id, v)} />
              : k.tur === "anahtar" ? <button key={k.id} data-etkilesim onClick={() => ayarYaz(k.id, !ayarDeger(k, d.ayar))} aria-pressed={!!ayarDeger(k, d.ayar)} title={k.aciklama}
                className={cn("h-6 rounded-full px-2 text-[11.5px] ring-1 ring-inset transition-colors", ayarDeger(k, d.ayar) ? "bg-white font-medium text-black ring-white" : "bg-white/[0.065] text-[var(--sc-metin-2)] ring-white/[0.06] hover:text-[var(--sc-metin)]")}><span className="flex items-center gap-1"><span className={cn("h-1.5 w-1.5 rounded-full", ayarDeger(k, d.ayar) ? "bg-black" : "bg-white/30")} />{k.ad}</span></button> : null)}
            {onAyarlar && <button data-etkilesim onClick={onAyarlar} aria-label="Tüm ayarlar" title="Tüm ayarlar (başlığa çift tık)" className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--sc-metin-3)] hover:bg-white/[0.08] hover:text-[var(--sc-metin)]"><SlidersHorizontal className="h-3.5 w-3.5" /></button>}
          </div>
        )}
        {not && !saltOkunur && !d.kucuk && <p className="px-1 text-[11px] leading-snug text-[var(--sc-metin-3)]">{not}</p>}

        {d.durum === "hata" && d.hata && <p className="flex items-start gap-1.5 rounded-[9px] bg-rose-500/[0.08] px-2 py-1.5 text-[11.5px] text-rose-200"><AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-rose-300" />{d.hata}</p>}

        {/* Alt satır */}
        {tn.calisir && !saltOkunur && (
          <div className="flex items-center gap-2 pt-0.5">
            <span className="flex items-center gap-1 text-[11.5px] tabular-nums text-[var(--sc-metin-3)]" title="Bu çalıştırmanın tahmini kredisi">{kredi ? <><KrediJeton boyut={14} />{kredi}</> : d.tur === "buyut" || d.tur === "sonKare" || d.tur === "kirp" || d.tur === "renk" || d.tur === "birlestir" ? "Ücretsiz · tarayıcıda" : "Ücretsiz"}</span>
            {ogeSayisi > 1 && <span className="rounded-full bg-white/[0.075] px-1.5 py-0.5 text-[10.5px] text-[var(--sc-metin-2)]" title="Liste girdisi: her öğe için ayrı üretim">×{ogeSayisi}</span>}
            {d.eski && !calisiyor && <span className="rounded-full bg-amber-300/12 px-1.5 py-0.5 text-[10.5px] text-amber-200" title="Girdiler değişti">Güncel değil</span>}
            <span className="flex-1" />
            {calisiyor || sirada ? (
              <button data-etkilesim onClick={onIptal} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.085] px-2.5 text-[11.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.12]"><X className="h-3 w-3" />İptal</button>
            ) : (
              <button data-etkilesim onClick={onCalistir} disabled={!!engel || d.kilit} title={d.kilit ? "Kilitli" : engel ?? `Üret · ${kredi ? `${kredi} kredi` : "ücretsiz"} (Ctrl Enter)`}
                className="flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[11.5px] font-semibold text-black transition-[filter,opacity] hover:brightness-110 disabled:bg-transparent disabled:px-0 disabled:font-medium disabled:text-[var(--sc-metin-3)]">
                {engel ? "Önce bağlı adım" : <><Play className="h-3 w-3 fill-current" />{d.surumler.length ? "Yeniden" : "Üret"}</>}
              </button>
            )}
          </div>
        )}
      </div>
      {(d.tur === "yukle" || d.tur === "videoYukle" || d.tur === "sesYukle") && <input ref={dosya} type="file" accept={YUKLE_KABUL[d.tur]} className="hidden" onChange={(e) => { void yukle(e.target.files?.[0]); e.target.value = ""; }} />}
    </div>
  );
}, (a, b) => {
  /* Tuvalin görünüm/ad gibi alanları değişince kartı yeniden çizme; yalnız düğümler, bağlantılar ve kendi propları. */
  for (const k of Object.keys(b) as (keyof typeof b)[]) if (k !== "t" && a[k] !== b[k]) return false;
  return a.t.dugumler === b.t.dugumler && a.t.kenarlar === b.t.kenarlar;
});
