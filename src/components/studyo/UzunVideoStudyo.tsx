"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  Sparkles, Plus, Trash2, ChevronUp, ChevronDown, Clock, Film,
  Wand2, Music2, Captions, LayoutList, AlignLeft, Play, Settings2, GripVertical,
  ChevronRight, X, Check, Layers, AtSign, Camera, ImagePlus, Copy, Coins,
  UserRound, MapPin, Package, Palette, Link2, StickyNote, Mic,
  GalleryHorizontal, GanttChartSquare, ArrowRight, Pencil,
  TrendingUp, Activity, Eye, Pause, SkipBack, SkipForward, Volume2,
} from "lucide-react";
import {
  useUzunVideo, toplamSure, sureBicim, sahneKredi, projeKredi, GECISLER,
  aiSahneGenislet, aiSahneOner,
  type UzunSahne, type UzunProje, type UzunGecis, type SahneElement,
} from "@/store/useUzunVideo";
import { useElements } from "@/store/useElements";
import { useProjeler } from "@/store/useProjeler";
import { ElementSeciciModal } from "@/components/panel/element/ElementSeciciModal";
import { KAMERA_HAREKETLERI } from "@/lib/sinemaVeri";
import { MODELLER } from "@/lib/catalog";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";

/**
 * Uzun Video Stüdyosu (M24 + M6) — 1 dakikadan 1 saate kadar çok-sahneli video.
 *
 * İki mod: STORYBOARD (sahne sahne tam kontrol) + TEK PROMPT (AI otomatik böler).
 * M6 ile her sahne artık tam bir çekim fişi:
 *   prompt · model · süre · geçiş · KAMERA HAREKETİ · ELEMENTLER (@karakter/@mekan)
 *   · referans görsel · seslendirme · müzik notu · karakter tutarlılığı · yönetmen notu
 * Kredi hesabı gerçek: model × süre × çözünürlük × element sayısı + ek yükler.
 */

const VIDEO_MODELLER = MODELLER.filter((m) => m.tur === "video");
const SURELER = [4, 6, 8, 10, 12, 15, 20];

/** Editör görünümleri — aynı sahnelerin 3 farklı okunuşu. */
type Gorunum = "serit" | "storyboard" | "zaman";
const GORUNUMLER: { id: Gorunum; ad: string; ikon: typeof Film }[] = [
  { id: "serit", ad: "Şerit", ikon: LayoutList },
  { id: "storyboard", ad: "Film şeridi", ikon: GalleryHorizontal },
  { id: "zaman", ad: "Zaman çizelgesi", ikon: GanttChartSquare },
];

/** Geçiş türüne göre kısa etiket + renk (film şeridi bağlantı noktalarında). */
const GECIS_STIL: Record<UzunGecis, { kisa: string; renk: string }> = {
  kesme: { kisa: "Kes", renk: "text-metin-3" },
  erime: { kisa: "Erime", renk: "text-sky-300" },
  kaydir: { kisa: "Kaydır", renk: "text-emerald-300" },
  yakinlas: { kisa: "Zoom", renk: "text-amber-300" },
  bulanik: { kisa: "Bulanık", renk: "text-fuchsia-300" },
};

/** Dramatik yoğunluk eğrisi — beat konumuna göre 0–1 (storyboard/zaman görünümünde ısı çubuğu). */
function yogunluk(i: number, toplam: number): number {
  if (toplam <= 1) return 0.5;
  const t = i / (toplam - 1);           // 0..1
  // klasik gerilim eğrisi: yavaş yüksel, ~%75'te doruk, sonra düş
  const doruk = 0.72;
  return t <= doruk
    ? 0.25 + (t / doruk) * 0.75
    : 1 - ((t - doruk) / (1 - doruk)) * 0.55;
}

/** Model adına göre 5sn taban kredisi (katalogdan). */
function modelKredisi(ad: string): number {
  return VIDEO_MODELLER.find((m) => m.ad === ad)?.kredi ?? 42;
}

const TUR_IKON: Record<string, typeof UserRound> = {
  karakter: UserRound, mekan: MapPin, obje: Package, stil: Palette,
};
const TUR_RENK: Record<string, string> = {
  karakter: "text-sky-300", mekan: "text-emerald-300", obje: "text-amber-300", stil: "text-fuchsia-300",
};

export function UzunVideoStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  /* Gömülüyken üretim, gömüldüğü projeye yazılır ve dış sayfaya haber verilir.
     Tek sarmalayıcı: her `uretimBaslat` çağrısını ayrı ayrı değiştirmeye gerek
     kalmadan hepsi buradan geçer (2026-08-02). */
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(gomulu && projeId ? { ...istek, projeId } : istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };

  const projeler = useUzunVideo((s) => s.projeler);
  const aktifId = useUzunVideo((s) => s.aktifId);
  const projeOlustur = useUzunVideo((s) => s.projeOlustur);
  const projeSec = useUzunVideo((s) => s.projeSec);

  const aktif = useMemo(() => projeler.find((p) => p.id === aktifId) ?? null, [projeler, aktifId]);

  if (!aktif) return <BaslangicEkrani projeler={projeler} onYeni={(mod) => projeOlustur({ mod })} onSec={projeSec} />;

  return <Editor proje={aktif} />;
}

/* ═══════════ BAŞLANGIÇ EKRANI ═══════════ */

function BaslangicEkrani({ projeler, onYeni, onSec }: {
  projeler: UzunProje[]; onYeni: (mod: "sahne" | "otomatik") => void; onSec: (id: string) => void;
}) {
  const projeSil = useUzunVideo((s) => s.projeSil);
  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-zemin">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-aksan/25 bg-aksan/[0.07] px-4 py-1.5 text-[13px] font-semibold text-aksan">
            <Layers className="h-3.5 w-3.5" /> Nadir bulunan yetenek
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Uzun Video <span className="text-aksan">Stüdyosu</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-metin-2">
            1 dakikadan 1 saate kadar çok-sahneli videolar üret. Her sahneye kendi karakterini,
            mekânını, kamerasını ve modelini ver — ya da tek istemle AI&apos;a kurdur.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <button onClick={() => onYeni("sahne")} data-test="mod-sahne"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-aksan/40 hover:bg-white/[0.04]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aksan/12 text-aksan"><LayoutList className="h-6 w-6" /></span>
            <h3 className="mt-4 text-[19px] font-bold text-white">Storyboard modu</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-metin-2">Sahne sahne aralık seç; her sahneye ayrı prompt, model, kamera ve element ver. Tam sinematik kontrol.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-aksan">Başla <ChevronRight className="h-4 w-4" /></span>
          </button>
          <button onClick={() => onYeni("otomatik")} data-test="mod-otomatik"
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-left transition-colors hover:border-aksan/40 hover:bg-white/[0.04]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aksan/12 text-aksan"><Wand2 className="h-6 w-6" /></span>
            <h3 className="mt-4 text-[19px] font-bold text-white">Tek prompt modu</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-metin-2">Tek bir istem yaz, hedef süreyi seç — AI senaryoyu kamera diliyle sahnelere böler, sen inceleyip üret.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-aksan">Başla <ChevronRight className="h-4 w-4" /></span>
          </button>
        </div>

        {projeler.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-[15px] font-semibold text-metin-2">Projelerin</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projeler.map((p) => {
                const elementSayi = p.sahneler.reduce((a, sh) => a + (sh.elementler?.length ?? 0), 0);
                return (
                  <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <button onClick={() => onSec(p.id)} className="block w-full text-left" data-test="proje-ac">
                      <div className="relative aspect-video overflow-hidden" style={{ background: onizlemeArka(p.id, "sinematik") }}>
                        {(() => { const u = saltUrl(onizlemeArka(p.id, "sinematik")); return u ? <img src={u} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null; })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm"><Clock className="h-3 w-3" /> {sureBicim(toplamSure(p))}</span>
                        <span className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{p.mod === "sahne" ? "Storyboard" : "Tek prompt"}</span>
                      </div>
                      <div className="p-3">
                        <p className="truncate text-[14px] font-semibold text-white">{p.ad}</p>
                        <p className="text-[12px] text-metin-3">
                          {p.sahneler.length} sahne · {p.cozunurluk} · {p.enBoy}
                          {elementSayi > 0 && <> · {elementSayi} element</>}
                        </p>
                      </div>
                    </button>
                    <button onClick={() => { projeSil(p.id); toast.success("Proje silindi"); }} aria-label="Sil"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-500/70"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════ EDİTÖR ═══════════ */

function Editor({ proje }: { proje: UzunProje }) {
  const projeSec = useUzunVideo((s) => s.projeSec);
  const projeGuncelle = useUzunVideo((s) => s.projeGuncelle);
  const sahneEkle = useUzunVideo((s) => s.sahneEkle);
  const otomatikBol = useUzunVideo((s) => s.otomatikBol);
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [ureten, setUreten] = useState(false);
  const [gorunum, setGorunum] = useState<Gorunum>("serit");
  const [oynaticiAcik, setOynaticiAcik] = useState(false);

  // Modal her zaman store'daki GÜNCEL sahneyi gösterir (element eklenince anında yansır).
  const duzenlenen = useMemo(
    () => proje.sahneler.find((sh) => sh.id === duzenlenenId) ?? null,
    [proje.sahneler, duzenlenenId],
  );

  // ── ÜRETİM HATTI: bu projeye ait canlı üretim durumları ──
  const uretimler = useProjeler((s) => s.uretimler);
  const projeUretimleri = useMemo(
    () => uretimler.filter((u) => u.projeId === proje.id),
    [uretimler, proje.id]);
  // sahne başlığındaki "Sahne N" → durum eşlemesi (storyboard'da sahne başına üretim)
  const sahneUretimDurum = useMemo(() => {
    const harita: Record<number, { durum: string; gorselUrl?: string }> = {};
    for (const u of projeUretimleri) {
      const m = u.baslik.match(/Sahne (\d+)/);
      if (m) harita[parseInt(m[1])] = { durum: u.durum, gorselUrl: u.gorselUrl ?? u.videoUrl };
    }
    return harita;
  }, [projeUretimleri]);
  const uretimOzet = useMemo(() => {
    const aktif = projeUretimleri.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
    const biten = projeUretimleri.filter((u) => u.durum === "tamam").length;
    return { aktif, biten, toplam: projeUretimleri.length };
  }, [projeUretimleri]);

  const toplam = toplamSure(proje);
  const hedefSn = proje.hedefSure * 60;
  const dolulukYuzde = Math.min(100, Math.round((toplam / hedefSn) * 100));
  // GERÇEK kredi: model × süre × çözünürlük × element + müzik/altyazı ek yükü.
  const toplamKredi = useMemo(() => projeKredi(proje, modelKredisi), [proje]);
  const elementSayi = proje.sahneler.reduce((a, sh) => a + (sh.elementler?.length ?? 0), 0);
  const doluSahne = proje.sahneler.filter((sh) => sh.prompt.trim()).length;

  const uret = () => {
    if (doluSahne === 0) { toast.error("En az bir sahneye prompt yaz"); return; }
    setUreten(true);

    // Bir sahnenin tam prompt'u: metin + @element mention + kamera hareketi.
    const sahnePromptu = (sh: UzunSahne, sira: number) => {
      const el = (sh.elementler ?? []).map((x) => "@" + x.ad).join(" ");
      const kam = sh.kamera && sh.kamera !== "Statik" ? ` [${sh.kamera}]` : "";
      const not = sh.not?.trim() ? ` — ${sh.not.trim()}` : "";
      return `Sahne ${sira}: ${sh.prompt.trim()}${el ? " " + el : ""}${kam}${not}`;
    };

    const dolular = proje.sahneler.filter((sh) => sh.prompt.trim());

    // TEK PROMPT modu: AI otomatik bölecek → tek video üretimi (higgs birebir).
    if (proje.mod === "otomatik" && proje.tekPrompt.trim()) {
      const sonuc = uretimBaslatHam({
        baslik: proje.ad, tur: "video", model: proje.varsayilanModel,
        prompt: proje.tekPrompt.trim(), kredi: toplamKredi, arac: "Uzun Video Stüdyosu",
        projeId: proje.id,
        meta: {
          oran: proje.enBoy, cozunurluk: proje.cozunurluk, sure: sureBicim(toplam),
          ...(proje.muzik ? { ses: "Arka plan müziği" } : {}),
        },
      });
      setUreten(false);
      if (!sonuc.ok) { uretimHataToast(sonuc); return; }
      toast.success("Uzun video üretimi başladı 🎬", {
        description: `Otomatik bölme · ${sureBicim(toplam)} · ${toplamKredi} kredi`,
      });
      return;
    }

    // STORYBOARD modu: HER dolu sahne için AYRI üretim başlat, hepsi TEK proje altında
    // toplansın (projeId). Böylece 60 sahnelik "1 saatlik video" gerçekten sahne-sahne
    // render edilir, kitaplıkta tek proje olarak birleşir. (Eleştiri #2 düzeltmesi.)
    const sahneKredisi = Math.max(1, Math.round(toplamKredi / dolular.length));
    let baslatilan = 0;
    let hata: ReturnType<typeof uretimBaslatHam> | null = null;
    dolular.forEach((sh, i) => {
      const s = uretimBaslatHam({
        baslik: `${proje.ad} · Sahne ${i + 1}`,
        tur: "video", model: proje.varsayilanModel,
        prompt: sahnePromptu(sh, i + 1),
        kredi: sahneKredisi, arac: "Uzun Video Stüdyosu",
        projeId: proje.id,
        meta: {
          oran: proje.enBoy, cozunurluk: proje.cozunurluk, sure: `${sh.sure}sn`,
          ...(proje.muzik ? { ses: "Arka plan müziği" } : {}),
          ...(sh.referansGorsel ? { gorselUrl: sh.referansGorsel } : {}),
        },
      });
      if (s.ok) baslatilan++; else hata = s;
    });

    setUreten(false);
    if (baslatilan === 0 && hata) { uretimHataToast(hata); return; }
    toast.success("Uzun video üretimi başladı 🎬", {
      description: `${baslatilan} sahne render ediliyor · ${sureBicim(toplam)}${proje.muzik ? " · müzikli" : ""}${proje.altyazi ? " · altyazılı" : ""}`,
    });
  };

  return (
    <div className="sinema-kapsam flex min-h-[calc(100vh-3rem)] flex-col bg-zemin lg:flex-row">
      {/* ANA — sahne şeridi */}
      <div className="min-w-0 flex-1 px-4 py-5 sm:px-6">
        {/* üst bar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button onClick={() => projeSec(null)} aria-label="Geri"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><ChevronRight className="h-4 w-4 rotate-180" /></button>
          <input value={proje.ad} onChange={(e) => projeGuncelle(proje.id, { ad: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-[20px] font-bold text-white outline-none" placeholder="Proje adı" />
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[13px] text-metin-2"><Clock className="h-3.5 w-3.5" /> {sureBicim(toplam)} / {proje.hedefSure} dk</span>
          <span className="flex items-center gap-1.5 rounded-full bg-aksan/12 px-3 py-1.5 text-[13px] font-semibold text-aksan"><Coins className="h-3.5 w-3.5" /> {toplamKredi.toLocaleString("tr-TR")}</span>
          <button onClick={() => setOynaticiAcik((v) => !v)} disabled={proje.sahneler.length === 0}
            className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-40",
              oynaticiAcik ? "bg-aksan text-zemin" : "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]")}>
            <Play className="h-3.5 w-3.5 fill-current" /> Önizle
          </button>
        </div>

        {/* SAHNE OYNATICI — gerçek playback: sahneler sırayla akar */}
        <AnimatePresence>
          {oynaticiAcik && <SahneOynatici proje={proje} onKapat={() => setOynaticiAcik(false)} onDuzenle={(id) => setDuzenlenenId(id)} />}
        </AnimatePresence>

        {/* mod sekmesi + görünüm geçişi */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/10">
            {(["sahne", "otomatik"] as const).map((m) => (
              <button key={m} onClick={() => projeGuncelle(proje.id, { mod: m })}
                className={cn("flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors",
                  proje.mod === m ? "bg-white text-black" : "text-white/70 hover:text-white")}>
                {m === "sahne" ? <><LayoutList className="h-4 w-4" /> Storyboard</> : <><Wand2 className="h-4 w-4" /> Tek prompt</>}
              </button>
            ))}
          </div>

          {/* görünüm geçişi — aynı sahnelerin 3 okunuşu */}
          <div className="ml-auto inline-flex rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/10">
            {GORUNUMLER.map((g) => {
              const G = g.ikon;
              return (
                <button key={g.id} onClick={() => setGorunum(g.id)} title={g.ad}
                  className={cn("flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold transition-colors",
                    gorunum === g.id ? "bg-aksan text-zemin" : "text-white/60 hover:text-white")}>
                  <G className="h-4 w-4" /> <span className="hidden sm:inline">{g.ad}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TEK PROMPT modu */}
        {proje.mod === "otomatik" && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <label className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-metin-2"><AlignLeft className="h-4 w-4" /> Videonun tamamını anlat</label>
            <textarea value={proje.tekPrompt} onChange={(e) => projeGuncelle(proje.id, { tekPrompt: e.target.value })} rows={3}
              placeholder="Örn: Bir kâşifin antik bir tapınağı keşfedişini anlatan 10 dakikalık sinematik belgesel…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[14px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => {
                otomatikBol(proje.id);
                toast.success("Senaryo sahnelere bölündü ✨", { description: "Her sahneye kamera hareketi ve süre önerildi." });
              }}
                className="flex items-center gap-2 rounded-xl bg-aksan px-4 py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.02]">
                <Sparkles className="h-4 w-4" /> Sahnelere böl ({Math.max(2, Math.min(60, Math.round(proje.hedefSure * 60 / 8)))} sahne)
              </button>
              <p className="text-[12px] text-metin-3">AI beat yapısına göre böler; sonra her sahneyi tek tek düzenleyebilirsin.</p>
            </div>
          </div>
        )}

        {/* özet şerit */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { et: "Sahne", v: `${proje.sahneler.length}`, alt: `${doluSahne} promptlu` },
            { et: "Toplam süre", v: sureBicim(toplam), alt: `hedef ${proje.hedefSure} dk` },
            { et: "Element", v: `${elementSayi}`, alt: "sahnelere bağlı" },
            { et: "Tahmini kredi", v: toplamKredi.toLocaleString("tr-TR"), alt: proje.cozunurluk },
          ].map((k) => (
            <div key={k.et} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[11.5px] text-metin-3">{k.et}</p>
              <p className="mt-0.5 text-[18px] font-bold leading-none text-white">{k.v}</p>
              <p className="mt-1 text-[11px] text-metin-3">{k.alt}</p>
            </div>
          ))}
        </div>

        {/* doluluk çubuğu */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-metin-3">
            <span>{proje.sahneler.length} sahne</span>
            <span>{dolulukYuzde}% · hedef {proje.hedefSure} dk</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-aksan transition-all" style={{ width: `${dolulukYuzde}%` }} />
          </div>
        </div>

        {/* ÜRETİM DURUMU ŞERİDİ — canlı render takibi */}
        {uretimOzet.toplam > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-aksan/20 bg-aksan/[0.05] px-4 py-3">
            {uretimOzet.aktif > 0
              ? <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-aksan/40 border-t-aksan" />
              : <Check className="h-4 w-4 shrink-0 text-aksan" />}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white">
                {uretimOzet.aktif > 0 ? `${uretimOzet.aktif} sahne render ediliyor…` : `${uretimOzet.biten} sahne render edildi`}
              </p>
              <p className="text-[11.5px] text-metin-3">{uretimOzet.biten}/{uretimOzet.toplam} tamamlandı · Kitaplığında toplanıyor</p>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-aksan transition-all" style={{ width: `${Math.round((uretimOzet.biten / Math.max(1, uretimOzet.toplam)) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* ═══ SAHNE GÖRÜNÜMLERİ ═══ */}
        {gorunum === "serit" && (
          <>
            <Reorder.Group axis="y" values={proje.sahneler} onReorder={(yeni) => projeGuncelle(proje.id, { sahneler: yeni })} className="space-y-2.5">
              {proje.sahneler.map((sh, i) => (
                <SahneKart key={sh.id} proje={proje} sahne={sh} sira={i} onDuzenle={() => setDuzenlenenId(sh.id)}
                  uretim={sahneUretimDurum[i + 1]} />
              ))}
            </Reorder.Group>
            <button onClick={() => { sahneEkle(proje.id); toast.success("Sahne eklendi"); }} data-test="sahne-ekle"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3.5 text-[14px] font-medium text-metin-2 transition-colors hover:border-aksan/40 hover:text-white">
              <Plus className="h-4 w-4" /> Sahne ekle
            </button>
          </>
        )}

        {gorunum === "storyboard" && (
          <StoryboardGorunum proje={proje}
            onDuzenle={(id) => setDuzenlenenId(id)}
            onEkle={() => { sahneEkle(proje.id); toast.success("Sahne eklendi"); }} />
        )}

        {gorunum === "zaman" && (
          <ZamanGorunum proje={proje} onDuzenle={(id) => setDuzenlenenId(id)} />
        )}
      </div>

      {/* SAĞ — global ayarlar */}
      <aside className="shrink-0 border-t border-white/[0.06] bg-[#0f1113] p-5 lg:w-[320px] lg:border-l lg:border-t-0">
        <div className="lg:sticky lg:top-[4.5rem]">
          <h3 className="mb-4 flex items-center gap-1.5 text-[15px] font-bold text-white"><Settings2 className="h-4 w-4 text-aksan" /> Video ayarları</h3>

          <label className="mb-1.5 block text-[13px] font-semibold text-metin-2">Hedef süre: {proje.hedefSure} dakika</label>
          <input type="range" min={1} max={60} step={1} value={proje.hedefSure}
            onChange={(e) => projeGuncelle(proje.id, { hedefSure: Number(e.target.value) })} className="kredi-slider w-full" aria-label="Hedef süre" />
          <div className="mb-4 mt-1 flex justify-between text-[10.5px] text-metin-3"><span>1 dk</span><span>30 dk</span><span>60 dk</span></div>

          <p className="mb-1.5 text-[13px] font-semibold text-metin-2">En-boy oranı</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(["16:9", "9:16", "1:1"] as const).map((o) => (
              <button key={o} onClick={() => projeGuncelle(proje.id, { enBoy: o })}
                className={cn("rounded-xl border py-2.5 text-[13px] font-medium transition-colors",
                  proje.enBoy === o ? "border-aksan/50 bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>{o}</button>
            ))}
          </div>

          <p className="mb-1.5 text-[13px] font-semibold text-metin-2">Çözünürlük</p>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {(["720p", "1080p", "4K"] as const).map((c) => (
              <button key={c} onClick={() => projeGuncelle(proje.id, { cozunurluk: c })}
                className={cn("rounded-xl border py-2.5 text-[13px] font-medium transition-colors",
                  proje.cozunurluk === c ? "border-aksan/50 bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>{c}</button>
            ))}
          </div>

          <p className="mb-1.5 text-[13px] font-semibold text-metin-2">Varsayılan model</p>
          <select value={proje.varsayilanModel} onChange={(e) => projeGuncelle(proje.id, { varsayilanModel: e.target.value })}
            aria-label="Varsayılan model"
            className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white outline-none focus:border-aksan/50">
            {VIDEO_MODELLER.map((m) => <option key={m.id} value={m.ad} className="bg-[#1c1c1f]">{m.ad}</option>)}
          </select>

          <div className="mb-5 space-y-2">
            <Toggle ik={Music2} et="Arka plan müziği" acik={proje.muzik} onDegis={() => projeGuncelle(proje.id, { muzik: !proje.muzik })} />
            <Toggle ik={Captions} et="Otomatik altyazı" acik={proje.altyazi} onDegis={() => projeGuncelle(proje.id, { altyazi: !proje.altyazi })} />
          </div>

          {/* anlatı yapısı — dramatik yoğunluk haritası */}
          {proje.sahneler.length >= 2 && (
            <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-metin-2">
                <TrendingUp className="h-3.5 w-3.5 text-aksan" /> Anlatı eğrisi
              </p>
              <div className="flex h-14 items-end gap-[3px]">
                {proje.sahneler.map((sh, i) => {
                  const y = yogunluk(i, proje.sahneler.length);
                  const dolu = sh.prompt.trim().length > 0;
                  return (
                    <button key={sh.id} onClick={() => setDuzenlenenId(sh.id)}
                      title={`${i + 1}. ${sh.baslik}`}
                      className="group relative flex flex-1 items-end">
                      <span className={cn("w-full rounded-t-[3px] transition-colors",
                        dolu ? "bg-aksan/70 group-hover:bg-aksan" : "bg-white/12 group-hover:bg-white/25")}
                        style={{ height: `${Math.round(y * 100)}%` }} />
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-metin-3">
                <span>Kuruluş</span><span>Doruk</span><span>Final</span>
              </div>
            </div>
          )}

          {/* kredi dökümü */}
          <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-2 text-[12px] font-semibold text-metin-2">Kredi dökümü</p>
            <div className="space-y-1.5 text-[12px]">
              <div className="flex justify-between text-metin-3"><span>{proje.sahneler.length} sahne render</span>
                <span className="text-white">{proje.sahneler.reduce((a, sh) => a + sahneKredi(sh, modelKredisi(sh.model), proje.cozunurluk), 0).toLocaleString("tr-TR")}</span></div>
              {proje.muzik && <div className="flex justify-between text-metin-3"><span>Müzik</span><span className="text-white">{Math.ceil(toplam / 60) * 4}</span></div>}
              {proje.altyazi && <div className="flex justify-between text-metin-3"><span>Altyazı</span><span className="text-white">{Math.ceil(toplam / 60) * 2}</span></div>}
              <div className="flex justify-between border-t border-white/[0.06] pt-1.5 font-semibold"><span className="text-white">Toplam</span><span className="text-aksan">{toplamKredi.toLocaleString("tr-TR")}</span></div>
            </div>
          </div>

          <button onClick={uret} disabled={ureten} data-test="uret"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-aksan py-3.5 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.02] disabled:opacity-60">
            <Play className="h-4 w-4 fill-current" /> Uzun videoyu üret
          </button>
          <p className="mt-2 text-center text-[11.5px] text-metin-3">{proje.sahneler.length} sahne · {toplamKredi.toLocaleString("tr-TR")} kredi</p>
        </div>
      </aside>

      <AnimatePresence>
        {duzenlenen && <SahneDuzenle proje={proje} sahne={duzenlenen} onKapat={() => setDuzenlenenId(null)} />}
      </AnimatePresence>
    </div>
  );
}

function Toggle({ ik: Ik, et, acik, onDegis }: { ik: typeof Music2; et: string; acik: boolean; onDegis: () => void }) {
  return (
    <button onClick={onDegis} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-[13.5px] text-white"><Ik className="h-4 w-4 text-metin-2" /> {et}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", acik ? "bg-aksan" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", acik ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

/* ═══════════ SAHNE OYNATICI — gerçek playback motoru ═══════════ */

/**
 * Sahneleri baştan sona GERÇEKTEN oynatır: playhead sahneler arası akar, o an
 * görünen sahne büyük önizlemede belirir, sahne sonlarında geçiş (erime/kaydır)
 * animasyonu, seslendirme/kamera göstergeleri, tıklanabilir seek çubuğu.
 */
function SahneOynatici({ proje, onKapat, onDuzenle }: {
  proje: UzunProje; onKapat: () => void; onDuzenle: (id: string) => void;
}) {
  const [t, setT] = useState(0);           // global saniye
  const [oynuyor, setOynuyor] = useState(true);
  const toplam = toplamSure(proje);
  const oran = proje.enBoy === "9:16" ? "9 / 16" : proje.enBoy === "1:1" ? "1 / 1" : "16 / 9";

  // sahne aralıkları (kümülatif başlangıç)
  const araliklar = useMemo(() => {
    let acc = 0;
    return proje.sahneler.map((sh) => { const bas = acc; acc += sh.sure; return { sh, bas, son: acc }; });
  }, [proje.sahneler]);

  // playback motoru
  useEffect(() => {
    if (!oynuyor || toplam <= 0) return;
    let ram = 0; let onceki = performance.now();
    const tik = (now: number) => {
      const fark = (now - onceki) / 1000; onceki = now;
      setT((su) => {
        const yeni = su + fark;
        if (yeni >= toplam) { setOynuyor(false); return toplam; }
        return yeni;
      });
      ram = requestAnimationFrame(tik);
    };
    ram = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(ram);
  }, [oynuyor, toplam]);

  const aktifIdx = araliklar.findIndex((a) => t >= a.bas && t < a.son);
  const aktif = araliklar[aktifIdx] ?? araliklar[araliklar.length - 1];
  if (!aktif) return null;
  const yerel = t - aktif.bas;
  const gecisSuresi = 0.7;
  const geciste = aktif.son - t < gecisSuresi && aktifIdx < araliklar.length - 1;
  const gecisOran = geciste ? 1 - (aktif.son - t) / gecisSuresi : 0;
  const sonraki = araliklar[aktifIdx + 1];

  const arka = onizlemeArka(aktif.sh.id + aktif.sh.prompt, "sinematik");
  const kapak = aktif.sh.referansGorsel ?? saltUrl(arka);
  const sonrakiArka = sonraki ? onizlemeArka(sonraki.sh.id + sonraki.sh.prompt, "sinematik") : "";
  const sonrakiKapak = sonraki ? (sonraki.sh.referansGorsel ?? saltUrl(sonrakiArka)) : null;

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setT(Math.max(0, Math.min(toplam, ((e.clientX - r.left) / r.width) * toplam)));
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      className="mb-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0b0d]">
      <div className="flex flex-col gap-3 p-3 sm:flex-row">
        {/* önizleme penceresi */}
        <div className="relative mx-auto w-full max-w-[420px] shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-white/10"
          style={{ aspectRatio: oran }}>
          {/* aktif sahne */}
          <div className="absolute inset-0" style={{ background: arka, transform: `scale(${1 + (aktif.sh.kamera?.includes("İçeri") || aktif.sh.kamera?.includes("Yakın") ? (yerel / Math.max(1, aktif.sh.sure)) * 0.08 : 0)})` }}>
            {kapak ? <img src={kapak} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          {/* geçiş: sonraki sahne erir */}
          {geciste && sonraki && (
            <div className="absolute inset-0" style={{ background: sonrakiArka, opacity: gecisOran }}>
              {sonrakiKapak ? <img src={sonrakiKapak} alt="" className="h-full w-full object-cover" style={{ opacity: gecisOran }} /> : null}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          {/* boş prompt uyarısı */}
          {!aktif.sh.prompt.trim() && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-lg bg-black/60 px-3 py-1.5 text-[12px] text-white/80 backdrop-blur-sm">Bu sahnede henüz prompt yok</span>
            </div>
          )}
          {/* üst bilgi */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
            <span className="flex items-center gap-1.5 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              Sahne {aktifIdx + 1}/{proje.sahneler.length}
            </span>
            <div className="flex flex-col items-end gap-1">
              {aktif.sh.kamera && aktif.sh.kamera !== "Statik" && (
                <span className="flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[10.5px] font-medium text-white backdrop-blur-sm"><Camera className="h-3 w-3" /> {aktif.sh.kamera}</span>
              )}
              {aktif.sh.seslendirme?.trim() && (
                <span className="flex items-center gap-1 rounded-lg bg-aksan/85 px-2 py-1 text-[10.5px] font-bold text-zemin"><Volume2 className="h-3 w-3" /> Seslendirme</span>
              )}
            </div>
          </div>
          {/* altyazı: seslendirme metni */}
          {aktif.sh.seslendirme?.trim() && (
            <div className="absolute inset-x-0 bottom-8 px-4 text-center">
              <span className="inline-block rounded-md bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm">{aktif.sh.seslendirme}</span>
            </div>
          )}
          {/* sahne başlığı */}
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="truncate text-[13px] font-bold text-white drop-shadow">{aktif.sh.baslik}</p>
          </div>
        </div>

        {/* sağ: transport + sahne listesi mini */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-white">Önizleme oynatıcı</p>
            <button onClick={onKapat} className="flex h-7 w-7 items-center justify-center rounded-lg text-metin-3 hover:bg-white/8 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          {/* transport */}
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => setT(Math.max(0, aktif.bas - 0.01))} title="Önceki sahne"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><SkipBack className="h-4 w-4" /></button>
            <button onClick={() => { if (t >= toplam) setT(0); setOynuyor((v) => !v); }} title="Oynat/Duraklat"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zemin transition-transform hover:scale-105">
              {oynuyor ? <Pause className="h-[18px] w-[18px]" /> : <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />}
            </button>
            <button onClick={() => setT(Math.min(toplam, aktif.son + 0.01))} title="Sonraki sahne"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><SkipForward className="h-4 w-4" /></button>
            <span className="ml-1 font-mono text-[12.5px] tabular-nums text-metin-2">{sureBicim(t)} <span className="text-metin-3">/ {sureBicim(toplam)}</span></span>
            <button onClick={() => onDuzenle(aktif.sh.id)} className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-white/[0.1]"><Pencil className="h-3 w-3" /> Bu sahneyi düzenle</button>
          </div>

          {/* seek çubuğu — sahne segmentli */}
          <div onClick={seek} className="group relative mt-3 h-8 cursor-pointer">
            <div className="absolute inset-x-0 top-1/2 flex h-3 -translate-y-1/2 gap-px overflow-hidden rounded-full">
              {araliklar.map((a, i) => (
                <div key={a.sh.id} title={`${i + 1}. ${a.sh.baslik}`}
                  className={cn("h-full transition-colors", i === aktifIdx ? "bg-aksan" : a.sh.prompt.trim() ? "bg-white/25" : "bg-white/10")}
                  style={{ width: `${(a.sh.sure / toplam) * 100}%` }} />
              ))}
            </div>
            {/* playhead */}
            <div className="pointer-events-none absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${(t / toplam) * 100}%` }} />
          </div>

          {/* aktif sahne prompt önizleme */}
          <div className="mt-3 min-h-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <p className="line-clamp-3 text-[12px] leading-relaxed text-metin-2">
              {aktif.sh.prompt || <span className="italic text-metin-3">Bu sahneye prompt eklemek için &quot;Bu sahneyi düzenle&quot;ye tıkla.</span>}
            </p>
            {(aktif.sh.elementler?.length ?? 0) > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {aktif.sh.elementler!.map((e) => (
                  <span key={e.id} className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[10.5px] text-white">@{e.ad}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════ FİLM ŞERİDİ GÖRÜNÜMÜ ═══════════ */

/** Sahneleri yatay kaydırılan storyboard kartları + aralarında geçiş bağlacı olarak gösterir. */
function StoryboardGorunum({ proje, onDuzenle, onEkle }: {
  proje: UzunProje; onDuzenle: (id: string) => void; onEkle: () => void;
}) {
  const oran = proje.enBoy === "9:16" ? "aspect-[9/16] w-32" : proje.enBoy === "1:1" ? "aspect-square w-44" : "aspect-video w-52";
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 [scrollbar-width:thin]">
      <div className="flex items-stretch gap-0">
        {proje.sahneler.map((sh, i) => {
          const arka = onizlemeArka(sh.id + sh.prompt, "sinematik");
          const kapak = sh.referansGorsel ?? saltUrl(arka);
          const g = GECIS_STIL[sh.gecis];
          const y = yogunluk(i, proje.sahneler.length);
          return (
            <div key={sh.id} className="flex shrink-0 items-stretch">
              {/* sahne kartı */}
              <div className="flex flex-col">
                <button onClick={() => onDuzenle(sh.id)}
                  className={cn("group relative shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] text-left transition-colors hover:border-aksan/50", oran)}
                  style={{ background: arka }}>
                  {kapak ? <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
                  {/* sahne no */}
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg bg-black/55 text-[12px] font-bold text-aksan backdrop-blur-sm">{i + 1}</span>
                  {sh.referansGorsel && <span className="absolute right-2 top-2 rounded bg-aksan/90 px-1.5 py-0.5 text-[9px] font-bold text-zemin">REF</span>}
                  {/* yoğunluk şeridi */}
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-aksan/80" style={{ width: `${Math.round(y * 100)}%` }} />
                  {/* alt bilgi */}
                  <div className="absolute inset-x-0 bottom-1.5 px-2">
                    <p className="truncate text-[12px] font-bold text-white drop-shadow">{sh.baslik}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/75">
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {sh.sure}sn</span>
                      {sh.kamera && sh.kamera !== "Statik" && <span className="flex items-center gap-0.5"><Camera className="h-2.5 w-2.5" /> {sh.kamera}</span>}
                    </div>
                  </div>
                  {/* hover: düzenle */}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-black"><Pencil className="h-3 w-3" /> Düzenle</span>
                  </span>
                </button>
                {/* prompt önizleme */}
                <p className="mt-1.5 line-clamp-2 px-0.5 text-[11px] leading-snug text-metin-3" style={{ width: oran.includes("w-32") ? "8rem" : oran.includes("w-44") ? "11rem" : "13rem" }}>
                  {sh.prompt || <span className="italic">Prompt yok</span>}
                </p>
              </div>

              {/* geçiş bağlacı (son sahne hariç) */}
              {i < proje.sahneler.length - 1 && (
                <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-2 pt-8">
                  <ArrowRight className="h-4 w-4 text-metin-3" />
                  <span className={cn("whitespace-nowrap rounded-full bg-white/[0.05] px-2 py-0.5 text-[9.5px] font-semibold", g.renk)}>{g.kisa}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* sahne ekle kartı */}
        <button onClick={onEkle}
          className={cn("ml-3 flex shrink-0 flex-col items-center justify-center gap-2 self-start rounded-2xl border border-dashed border-white/15 text-metin-3 transition-colors hover:border-aksan/40 hover:text-white", oran)}>
          <Plus className="h-6 w-6" /> <span className="text-[12px] font-medium">Sahne</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════ ZAMAN ÇİZELGESİ GÖRÜNÜMÜ ═══════════ */

/** Sahneleri toplam süreye orantılı yatay bloklar olarak dizer — gerçek zaman ekseniyle. */
function ZamanGorunum({ proje, onDuzenle }: { proje: UzunProje; onDuzenle: (id: string) => void }) {
  const toplam = toplamSure(proje) || 1;
  // saniye başına px — dar sahneler bile okunur kalsın diye min genişlik uygulanır
  const px = Math.max(6, Math.min(24, 720 / toplam));
  const genislik = Math.max(600, toplam * px);
  // eksende 5/10/15sn işaretleri
  const adim = toplam > 300 ? 60 : toplam > 90 ? 30 : toplam > 30 ? 10 : 5;
  const isaretler = Math.floor(toplam / adim) + 1;

  let carier = 0; // sahnenin başlangıç saniyesi

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between text-[12px] text-metin-3">
        <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-aksan" /> {proje.sahneler.length} sahne · {sureBicim(toplam)}</span>
        <span>Her blok süreye orantılı</span>
      </div>
      <div className="overflow-x-auto pb-2 [scrollbar-width:thin]">
        <div style={{ width: genislik }}>
          {/* zaman ekseni */}
          <div className="relative mb-1.5 h-4 border-b border-white/[0.08]">
            {Array.from({ length: isaretler }).map((_, i) => {
              const sn = i * adim;
              return (
                <span key={i} className="absolute top-0 flex h-4 items-center border-l border-white/10 pl-1 text-[9px] tabular-nums text-metin-3" style={{ left: sn * px }}>
                  {sureBicim(sn)}
                </span>
              );
            })}
          </div>
          {/* sahne blokları */}
          <div className="flex h-16 items-stretch">
            {proje.sahneler.map((sh, i) => {
              const bas = carier; carier += sh.sure;
              const w = sh.sure * px;
              const arka = onizlemeArka(sh.id + sh.prompt, "sinematik");
              const kapak = sh.referansGorsel ?? saltUrl(arka);
              const dolu = sh.prompt.trim().length > 0;
              return (
                <button key={sh.id} onClick={() => onDuzenle(sh.id)} title={`${i + 1}. ${sh.baslik} · ${sh.sure}sn`}
                  className={cn("group relative overflow-hidden border-r border-black/40 text-left transition-all first:rounded-l-xl last:rounded-r-xl last:border-r-0 hover:z-10 hover:ring-2 hover:ring-aksan",
                    !dolu && "opacity-60")}
                  style={{ width: Math.max(14, w), background: arka }}>
                  {kapak ? <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
                  {w > 40 && (
                    <div className="absolute inset-x-0 bottom-0 p-1.5">
                      <p className="truncate text-[10.5px] font-bold text-white drop-shadow">{i + 1}. {sh.baslik}</p>
                      {w > 90 && <p className="truncate text-[9px] text-white/70">{sh.sure}sn · {GECIS_STIL[sh.gecis].kisa}</p>}
                    </div>
                  )}
                  <span className="absolute left-1 top-1 rounded bg-black/55 px-1 text-[9px] font-bold text-aksan backdrop-blur-sm">{i + 1}</span>
                </button>
              );
            })}
          </div>
          {/* geçiş şeridi */}
          <div className="mt-1 flex h-1.5 items-stretch">
            {proje.sahneler.map((sh) => (
              <span key={sh.id} className={cn("border-r border-black/40", GECIS_STIL[sh.gecis].renk.replace("text-", "bg-").replace("metin-3", "white/20"))}
                style={{ width: Math.max(14, sh.sure * px), opacity: 0.5 }} />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-metin-3">
        <Eye className="h-3 w-3" /> Bir bloğa tıklayarak sahneyi düzenle
      </p>
    </div>
  );
}

/* ═══════════ SAHNE KARTI (şeritte) ═══════════ */

function SahneKart({ proje, sahne, sira, onDuzenle, uretim }: {
  proje: UzunProje; sahne: UzunSahne; sira: number; onDuzenle: () => void;
  uretim?: { durum: string; gorselUrl?: string };
}) {
  const sahneSil = useUzunVideo((s) => s.sahneSil);
  const sahneTasi = useUzunVideo((s) => s.sahneTasi);
  const sahneCogalt = useUzunVideo((s) => s.sahneCogalt);
  const arka = onizlemeArka(sahne.id + sahne.prompt, "sinematik");
  // üretim tamamlanmışsa gerçek çıktı görselini kapak yap
  const kapak = (uretim?.durum === "tamam" ? uretim.gorselUrl : undefined) ?? sahne.referansGorsel ?? saltUrl(arka);
  const uretiliyor = uretim?.durum === "kuyrukta" || uretim?.durum === "isleniyor";
  const kredi = sahneKredi(sahne, modelKredisi(sahne.model), proje.cozunurluk);
  const elementler = sahne.elementler ?? [];

  return (
    <Reorder.Item value={sahne} className="group flex items-stretch gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5">
      <div className="flex flex-col items-center justify-center gap-1 text-metin-3">
        <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
        <span className="text-[11px] font-bold text-aksan">{sira + 1}</span>
      </div>

      <button onClick={onDuzenle} className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl" style={{ background: arka }}>
        {kapak ? <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">{sahne.sure}sn</span>
        {sahne.referansGorsel && !uretim && (
          <span className="absolute left-1 top-1 rounded bg-aksan/85 px-1.5 py-0.5 text-[9px] font-bold text-zemin">REF</span>
        )}
        {/* CANLI ÜRETİM DURUMU */}
        {uretiliyor && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 backdrop-blur-[1px]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span className="text-[9px] font-semibold text-white">{uretim?.durum === "kuyrukta" ? "Kuyrukta" : "Render…"}</span>
          </span>
        )}
        {uretim?.durum === "tamam" && (
          <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-emerald-500/85 px-1.5 py-0.5 text-[9px] font-bold text-white"><Check className="h-2.5 w-2.5" /> Hazır</span>
        )}
      </button>

      <button onClick={onDuzenle} className="min-w-0 flex-1 text-left" data-test="sahne-duzenle">
        <p className="truncate text-[14px] font-semibold text-white">{sahne.baslik}</p>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-metin-2">
          {sahne.prompt || <span className="italic text-metin-3">Prompt eklemek için tıkla…</span>}
        </p>

        {/* element rozetleri */}
        {elementler.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {elementler.slice(0, 4).map((e) => {
              const I = TUR_IKON[e.tur] ?? Package;
              return (
                <span key={e.id} className="flex items-center gap-1 rounded bg-white/[0.07] px-1.5 py-0.5 text-[10.5px] text-white">
                  <I className={cn("h-2.5 w-2.5", TUR_RENK[e.tur] ?? "text-metin-2")} /> @{e.ad}
                </span>
              );
            })}
            {elementler.length > 4 && <span className="text-[10.5px] text-metin-3">+{elementler.length - 4}</span>}
          </div>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-metin-3">
          <span className="flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5"><Film className="h-2.5 w-2.5" /> {sahne.model}</span>
          {sahne.kamera && sahne.kamera !== "Statik" && (
            <span className="flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5"><Camera className="h-2.5 w-2.5" /> {sahne.kamera}</span>
          )}
          <span className="rounded bg-white/[0.05] px-1.5 py-0.5">{GECISLER.find((g) => g.id === sahne.gecis)?.ad}</span>
          {sahne.seslendirme?.trim() && <span className="flex items-center gap-1 rounded bg-white/[0.05] px-1.5 py-0.5"><Mic className="h-2.5 w-2.5" /> Seslendirme</span>}
          {sahne.karakterTutarlilik && <span className="rounded bg-aksan/12 px-1.5 py-0.5 text-aksan">Tutarlı kadro</span>}
          <span className="flex items-center gap-1 rounded bg-aksan/10 px-1.5 py-0.5 text-aksan"><Coins className="h-2.5 w-2.5" /> {kredi}</span>
        </div>
      </button>

      <div className="flex flex-col items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => sahneTasi(proje.id, sahne.id, -1)} disabled={sira === 0} aria-label="Yukarı taşı"
          className="flex h-6 w-6 items-center justify-center rounded text-metin-3 hover:bg-white/8 hover:text-white disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
        <button onClick={() => sahneTasi(proje.id, sahne.id, 1)} disabled={sira === proje.sahneler.length - 1} aria-label="Aşağı taşı"
          className="flex h-6 w-6 items-center justify-center rounded text-metin-3 hover:bg-white/8 hover:text-white disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
        <button onClick={() => { sahneCogalt(proje.id, sahne.id); toast.success("Sahne çoğaltıldı"); }} aria-label="Çoğalt"
          className="flex h-6 w-6 items-center justify-center rounded text-metin-3 hover:bg-white/8 hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
        <button onClick={() => { sahneSil(proje.id, sahne.id); toast.success("Sahne silindi"); }} aria-label="Sil"
          className="flex h-6 w-6 items-center justify-center rounded text-metin-3 hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </Reorder.Item>
  );
}

/* ═══════════ SAHNE DÜZENLE MODAL ═══════════ */

function SahneDuzenle({ proje, sahne, onKapat }: { proje: UzunProje; sahne: UzunSahne; onKapat: () => void }) {
  const sahneGuncelle = useUzunVideo((s) => s.sahneGuncelle);
  const sahneElementEkle = useUzunVideo((s) => s.sahneElementEkle);
  const sahneElementCikar = useUzunVideo((s) => s.sahneElementCikar);
  const elementler = useElements((s) => s.elementler);

  const [elementSecici, setElementSecici] = useState(false);
  const refInput = useRef<HTMLInputElement>(null);

  // Element seçici kendi scroll kilidini kurar; çakışmasın diye o açıkken bunu bırakırız.
  useScrollKilit(!elementSecici);
  useEscKapat(!elementSecici, onKapat);

  // Yerel taslak: alanlar anında yazılır, "Kaydet" ile store'a işlenir.
  // Elementler ise ANINDA store'a yazılır (seçici modal kapanınca kartta görünsün).
  const [yerel, setYerel] = useState<UzunSahne>(sahne);
  const guncelle = (patch: Partial<UzunSahne>) => setYerel((y) => ({ ...y, ...patch }));

  const sahneElementler = sahne.elementler ?? [];
  const kredi = sahneKredi({ ...yerel, elementler: sahneElementler }, modelKredisi(yerel.model), proje.cozunurluk);

  const kaydet = () => {
    // elementler store'da güncel; yerel kopyanın eskisiyle ezmeyelim.
    const { elementler: _yoksay, ...digerAlanlar } = yerel;
    void _yoksay;
    sahneGuncelle(proje.id, sahne.id, digerAlanlar);
    toast.success("Sahne kaydedildi");
    onKapat();
  };

  const referansSec = (dosya: File) => {
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      guncelle({ referansGorsel: url });
      // Referans görseli anında store'a da yaz (kartta REF rozeti hemen çıksın).
      sahneGuncelle(proje.id, sahne.id, { referansGorsel: url });
      toast.success("Referans görsel eklendi");
    };
    r.readAsDataURL(dosya);
  };

  /** Element seçicideki "Kullan" → sahneye GERÇEKTEN bağlar. */
  const elementEkle = (ad: string) => {
    const el = elementler.find((x) => x.ad === ad);
    if (!el) { toast.error("Element bulunamadı"); return; }
    const yeni: SahneElement = { id: el.id, ad: el.ad, tur: el.tur };
    sahneElementEkle(proje.id, sahne.id, yeni);
    toast.success(`@${el.ad} sahneye eklendi`);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        className="fixed left-1/2 top-1/2 z-[201] flex max-h-[90vh] w-[min(94vw,640px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#151517] shadow-2xl">

        {/* başlık */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] p-5">
          <input value={yerel.baslik} onChange={(e) => guncelle({ baslik: e.target.value })}
            aria-label="Sahne başlığı"
            className="min-w-0 flex-1 bg-transparent text-[18px] font-bold text-white outline-none" />
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-aksan/12 px-2.5 py-1 text-[12px] font-semibold text-aksan"><Coins className="h-3 w-3" /> {kredi}</span>
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {/* prompt */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[13px] font-semibold text-metin-2">Sahne promptu</label>
              <button onClick={() => {
                if (!yerel.prompt.trim()) { toast.error("Önce kısa bir prompt yaz"); return; }
                const genis = aiSahneGenislet({ ...yerel });
                guncelle({ prompt: genis });
                toast.success("Prompt sinematik detaylarla genişletildi ✨");
              }}
                className="flex items-center gap-1.5 rounded-lg bg-aksan/12 px-2.5 py-1.5 text-[12px] font-semibold text-aksan transition-colors hover:bg-aksan/20">
                <Sparkles className="h-3.5 w-3.5" /> AI ile genişlet
              </button>
            </div>
            <textarea autoFocus value={yerel.prompt} onChange={(e) => guncelle({ prompt: e.target.value })} rows={3}
              placeholder="Bu sahnede ne olduğunu anlat… (kısa yaz, AI genişletsin)" data-test="sahne-prompt"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[14px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />
          </div>

          {/* ═══ ELEMENTLER ═══ */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-metin-2"><AtSign className="h-3.5 w-3.5" /> Sahne elementleri</label>
              <button onClick={() => setElementSecici(true)} data-test="element-ekle"
                className="flex items-center gap-1.5 rounded-lg bg-white/[0.07] px-2.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-white/[0.12]">
                <Plus className="h-3.5 w-3.5" /> Element ekle
              </button>
            </div>
            {sahneElementler.length === 0 ? (
              <button onClick={() => setElementSecici(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.14] py-3.5 text-[13px] text-metin-3 transition-colors hover:border-aksan/40 hover:text-white">
                <AtSign className="h-4 w-4" /> Bu sahnede kullanılacak karakter, mekân veya objeyi seç
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sahneElementler.map((e) => {
                  const I = TUR_IKON[e.tur] ?? Package;
                  return (
                    <span key={e.id} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-2.5 pr-1.5 text-[13px] text-white">
                      <I className={cn("h-3.5 w-3.5", TUR_RENK[e.tur] ?? "text-metin-2")} />
                      @{e.ad}
                      <button onClick={() => { sahneElementCikar(proje.id, sahne.id, e.id); toast.success(`@${e.ad} çıkarıldı`); }}
                        aria-label={`${e.ad} elementini çıkar`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/10 hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ REFERANS GÖRSEL ═══ */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-metin-2"><ImagePlus className="h-3.5 w-3.5" /> Referans görsel</label>
            <input ref={refInput} type="file" accept="image/*" hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) referansSec(f); }} />
            {yerel.referansGorsel ? (
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <img src={yerel.referansGorsel} alt="Referans" className="h-36 w-full object-cover" />
                <button onClick={() => { guncelle({ referansGorsel: undefined }); sahneGuncelle(proje.id, sahne.id, { referansGorsel: undefined }); }}
                  aria-label="Referansı kaldır"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm hover:bg-black/85">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => refInput.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.14] py-3.5 text-[13px] text-metin-3 transition-colors hover:border-aksan/40 hover:text-white">
                <ImagePlus className="h-4 w-4" /> Sahnenin görsel çıpasını yükle
              </button>
            )}
          </div>

          {/* ═══ KAMERA ═══ */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[13px] font-semibold text-metin-2"><Camera className="h-3.5 w-3.5" /> Kamera hareketi</label>
              <button onClick={() => {
                const sira = proje.sahneler.findIndex((x) => x.id === sahne.id);
                const oner = aiSahneOner(Math.max(0, sira), proje.sahneler.length);
                guncelle({ kamera: oner.kamera, gecis: oner.gecis, sure: oner.sure });
                toast.success("Akıllı kamera + geçiş + süre önerildi ✨", { description: `${oner.kamera} · ${GECISLER.find((g) => g.id === oner.gecis)?.ad} · ${oner.sure}sn` });
              }}
                className="flex items-center gap-1.5 rounded-lg bg-aksan/12 px-2.5 py-1.5 text-[12px] font-semibold text-aksan transition-colors hover:bg-aksan/20">
                <Wand2 className="h-3.5 w-3.5" /> Akıllı öner
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {KAMERA_HAREKETLERI.map((k) => (
                <button key={k} onClick={() => guncelle({ kamera: k })}
                  className={cn("rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    (yerel.kamera ?? "Statik") === k ? "bg-aksan text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>{k}</button>
              ))}
            </div>
          </div>

          {/* ═══ MODEL + SÜRE ═══ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-metin-2">Model (bu sahneye özel)</label>
              <select value={yerel.model} onChange={(e) => guncelle({ model: e.target.value })} aria-label="Sahne modeli"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[14px] text-white outline-none focus:border-aksan/50">
                {VIDEO_MODELLER.map((m) => <option key={m.id} value={m.ad} className="bg-[#1c1c1f]">{m.ad} · {m.kredi} kredi</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-metin-2">Süre: {yerel.sure} saniye</label>
              <div className="flex flex-wrap gap-1.5">
                {SURELER.map((s) => (
                  <button key={s} onClick={() => guncelle({ sure: s })}
                    className={cn("rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      yerel.sure === s ? "bg-aksan text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>{s}sn</button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ GEÇİŞ ═══ */}
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-metin-2">Sonraki sahneye geçiş</label>
            <div className="flex flex-wrap gap-1.5">
              {GECISLER.map((g) => (
                <button key={g.id} onClick={() => guncelle({ gecis: g.id as UzunGecis })}
                  className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                    yerel.gecis === g.id ? "bg-aksan text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>{g.ad}</button>
              ))}
            </div>
          </div>

          {/* ═══ SES & MÜZİK ═══ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-metin-2"><Mic className="h-3.5 w-3.5" /> Seslendirme metni</label>
              <textarea value={yerel.seslendirme ?? ""} onChange={(e) => guncelle({ seslendirme: e.target.value })} rows={2}
                placeholder="Bu sahnede duyulacak anlatım…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-metin-2"><Music2 className="h-3.5 w-3.5" /> Müzik / ambiyans notu</label>
              <textarea value={yerel.muzikNotu ?? ""} onChange={(e) => guncelle({ muzikNotu: e.target.value })} rows={2}
                placeholder="Örn: gerilimli yaylılar, alçak nabız…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />
            </div>
          </div>

          {/* ═══ TUTARLILIK + NOT ═══ */}
          <button onClick={() => guncelle({ karakterTutarlilik: !yerel.karakterTutarlilik })}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
            <span className="flex items-center gap-2 text-left text-[13.5px] text-white">
              <Link2 className="h-4 w-4 text-metin-2" />
              <span>Karakter tutarlılığı
                <span className="block text-[11.5px] text-metin-3">Önceki sahnenin kadrosu ve stili korunur</span>
              </span>
            </span>
            <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", yerel.karakterTutarlilik ? "bg-aksan" : "bg-white/15")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", yerel.karakterTutarlilik ? "left-[18px]" : "left-0.5")} />
            </span>
          </button>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-metin-2"><StickyNote className="h-3.5 w-3.5" /> Yönetmen notu</label>
            <input value={yerel.not ?? ""} onChange={(e) => guncelle({ not: e.target.value })}
              placeholder="Ekip için not — üretime girmez"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[13.5px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />
          </div>
        </div>

        {/* alt bar */}
        <div className="flex shrink-0 justify-end gap-2.5 border-t border-white/[0.06] p-4">
          <button onClick={onKapat} className="rounded-xl border border-white/12 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.06]">İptal</button>
          <button onClick={kaydet} data-test="sahne-kaydet"
            className="flex items-center gap-1.5 rounded-xl bg-aksan px-5 py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.02]">
            <Check className="h-4 w-4" /> Kaydet
          </button>
        </div>
      </motion.div>

      {/* Element seçici — mevcut Higgsfield birebir modal yeniden kullanılır. */}
      <AnimatePresence>
        {elementSecici && (
          <ElementSeciciModal
            onSec={(ad) => elementEkle(ad)}
            onKapat={() => setElementSecici(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
