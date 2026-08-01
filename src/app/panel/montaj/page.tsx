"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  Combine, Sparkles, Plus, Trash2, Wand2, Music2, Captions, Play, Pause, Settings2,
  ChevronRight, X, Check, Clapperboard, Scissors, Palette, Film, Image as ImageIcon,
  Layers, Undo2, Redo2, Copy, SkipBack, SkipForward, ZoomIn, ZoomOut, Type as TypeIcon,
  Eye, EyeOff, Lock, Unlock, Volume2, VolumeX, Gauge, Download, Video as VideoIcon,
  Maximize2, AudioLines, Keyboard, PanelLeft, PanelRight, SlidersHorizontal, GripHorizontal,
  Diamond,
} from "lucide-react";
import {
  useMontaj, montajToplamSure, klipSure, anlikKlip, efektCss, tamFilter,
  klipDonusum, sesZarf, bosRenk, aiOnizle,
  MONTAJ_EFEKT_META, MONTAJ_GECIS_META, AI_KOMUT_META,
  type MontajProje, type MontajKlip, type MontajEfekt, type MontajGecis,
  type MontajKatman, type KatmanTur, type AiKomutId, type RenkAyar, type KfOzellik,
} from "@/store/useMontaj";
import { useProjeler } from "@/store/useProjeler";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { sureBicim } from "@/store/useUzunVideo";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { BetaUyari, BetaRozet } from "@/components/kabuk/BetaUyari";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";

/**
 * Montaj Stüdyosu — GERÇEK çok katmanlı video editörü.
 *
 * Düzen: sol AI/araç paneli · orta önizleme oynatıcı · sağ klip denetleyici,
 * altta çok katmanlı zaman çizelgesi (cetvel + playhead + sürüklenebilir klipler).
 * Önizleme playhead'i takip eder; efekt/geçiş/opaklık/metin CANLI render edilir.
 */

const arkaPlan = (k: { id: string; gorselUrl?: string }) =>
  k.gorselUrl && /^(data:|https?:|\/)/.test(k.gorselUrl)
    ? `url("${k.gorselUrl}") center/cover`
    : origArka(k.id, "sinematik");

export default function MontajStudyo() {
  const projeler = useMontaj((s) => s.projeler);
  const aktifId = useMontaj((s) => s.aktifId);
  const projeOlustur = useMontaj((s) => s.projeOlustur);
  const projeSec = useMontaj((s) => s.projeSec);
  const aktif = useMemo(() => projeler.find((p) => p.id === aktifId) ?? null, [projeler, aktifId]);

  return (
    <>
      {/* M2: Montaj beta — ilk girişte bir kez uyarı (Supercomputer deseni) */}
      <BetaUyari
        anahtar="vayra-montaj-beta-goruldu"
        baslik="Montaj Stüdyosu"
        ikon={Combine}
        aciklama={<>
          Montaj Stüdyosu şu an <span className="font-semibold text-white">beta aşamasında</span>.
          Çok katmanlı kurgu, AI komutları ve render akışı hâlâ geliştiriliyor —
          bazı sonuçlar beklediğin gibi olmayabilir. Geri bildirimlerin bizim için çok değerli 🙏
        </>}
      />
      {!aktif
        ? <BaslangicEkrani projeler={projeler} onYeni={() => projeOlustur()} onSec={projeSec} />
        : <Editor proje={aktif} />}
    </>
  );
}

/* ═══════════ BAŞLANGIÇ ═══════════ */

function BaslangicEkrani({ projeler, onYeni, onSec }: {
  projeler: MontajProje[]; onYeni: () => void; onSec: (id: string) => void;
}) {
  const projeSil = useMontaj((s) => s.projeSil);
  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-zemin">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-aksan/25 bg-aksan/[0.07] px-4 py-1.5 text-[13px] font-semibold text-aksan">
            <Combine className="h-3.5 w-3.5" /> AI Montaj
          </span>
          <h1 className="mt-5 flex items-center justify-center gap-2.5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Montaj <span className="text-aksan">Stüdyosu</span>
            <BetaRozet className="translate-y-1" />
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-metin-2">
            Çok katmanlı zaman çizelgesi, canlı önizleme, kırpma, hız, geçiş ve
            renk — profesyonel kurgu, AI hızında.
          </p>
          <button onClick={onYeni}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-aksan px-6 py-3.5 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.02]">
            <Plus className="h-5 w-5" /> Yeni montaj başlat
          </button>
        </div>

        {projeler.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-[15px] font-semibold text-metin-2">Montajların</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projeler.map((p) => {
                const klipSayi = p.katmanlar.reduce((a, k) => a + k.klipler.length, 0);
                return (
                  <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <button onClick={() => onSec(p.id)} className="block w-full text-left">
                      <div className="relative aspect-video overflow-hidden" style={{ background: origArka(p.id, "sinematik") }}>
                        {(() => { const u = saltUrl(origArka(p.id, "sinematik")); return u ? <img src={u} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null; })()}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">{sureBicim(montajToplamSure(p))}</span>
                      </div>
                      <div className="p-3">
                        <p className="truncate text-[14px] font-semibold text-white">{p.ad}</p>
                        <p className="text-[12px] text-metin-3">{klipSayi} klip · {p.katmanlar.length} katman · {p.cozunurluk}</p>
                      </div>
                    </button>
                    <button onClick={() => { projeSil(p.id); toast.success("Montaj silindi"); }}
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

function Editor({ proje }: { proje: MontajProje }) {
  const projeSec = useMontaj((s) => s.projeSec);
  const projeGuncelle = useMontaj((s) => s.projeGuncelle);
  const aiUygula = useMontaj((s) => s.aiUygula);
  const geriAl = useMontaj((s) => s.geriAl);
  const yinele = useMontaj((s) => s.yinele);
  const gecmisVar = useMontaj((s) => s.gecmisVar);
  const playhead = useMontaj((s) => s.playhead);
  const playheadAyarla = useMontaj((s) => s.playheadAyarla);
  const oynuyor = useMontaj((s) => s.oynuyor);
  const oynatDurdur = useMontaj((s) => s.oynatDurdur);
  const seciliKlipId = useMontaj((s) => s.seciliKlipId);
  const klipSec = useMontaj((s) => s.klipSec);
  const klipSil = useMontaj((s) => s.klipSil);
  const klipBol = useMontaj((s) => s.klipBol);
  const klipCogalt = useMontaj((s) => s.klipCogalt);
  const klipKopyala = useMontaj((s) => s.klipKopyala);
  const klipYapistir = useMontaj((s) => s.klipYapistir);

  const [klipSecici, setKlipSecici] = useState<{ katmanId: string; tur: KatmanTur } | null>(null);
  const [ayarAcik, setAyarAcik] = useState(false);
  /* ── LAYOUT DURUMU — panel aç/kapa + sürüklenebilir timeline yüksekliği ── */
  const [solAcik, setSolAcik] = useState(true);
  const [sagAcik, setSagAcik] = useState(true);
  const [kisayolAcik, setKisayolAcik] = useState(false);
  const [seritYuk, setSeritYuk] = useState(256);
  const [aiOnay, setAiOnay] = useState<AiKomutId | null>(null);

  const toplam = montajToplamSure(proje);
  const gecmis = gecmisVar(proje.id);
  const secili = useMemo(
    () => proje.katmanlar.flatMap((k) => k.klipler).find((k) => k.id === seciliKlipId) ?? null,
    [proje.katmanlar, seciliKlipId]);

  /* ── OYNATMA MOTORU — playhead'i gerçek zamanda ilerletir ── */
  useEffect(() => {
    if (!oynuyor) return;
    if (toplam <= 0) { oynatDurdur(false); return; }
    let ram = 0;
    let onceki = performance.now();
    const tik = (t: number) => {
      const fark = (t - onceki) / 1000;
      onceki = t;
      const su = useMontaj.getState().playhead + fark;
      if (su >= toplam) { playheadAyarla(toplam); oynatDurdur(false); return; }
      playheadAyarla(su);
      ram = requestAnimationFrame(tik);
    };
    ram = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(ram);
  }, [oynuyor, toplam, playheadAyarla, oynatDurdur]);

  /* ── KLAVYE KISAYOLLARI ──
     CAPTURE fazında dinleriz: panel kabuğundaki global tek-tuş navigasyonu
     (Kisayollar.tsx — "s" → /panel/sinema, "d" → /panel/3d …) document üzerinde
     bubble fazında çalışıyor. Editörde S=böl, D=çoğalt gibi tuşlar öncelikli
     olmalı; bu yüzden yakalayıp stopPropagation ile kabuğa ulaşmasını engelleriz. */
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const hedef = e.target as HTMLElement;
      if (hedef && /^(INPUT|TEXTAREA)$/.test(hedef.tagName)) return; // yazarken çalışma
      /** Editör tuşu işlendi → kabuk kısayoluna sızdırma. */
      const yut = () => { e.preventDefault(); e.stopPropagation(); };
      if (e.key === "Escape") { setKisayolAcik(false); return; }
      if (e.code === "Space") { yut(); oynatDurdur(); return; }
      if (e.key === "s" && !e.metaKey && !e.ctrlKey) {
        yut();
        if (seciliKlipId) { klipBol(proje.id, seciliKlipId, playhead); toast("Klip bölündü ✂️"); }
        else toast.error("Önce bir klip seç");
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && seciliKlipId) { yut(); klipSil(proje.id, seciliKlipId); toast("Klip silindi"); return; }
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && seciliKlipId) { yut(); klipCogalt(proje.id, seciliKlipId); toast("Klip çoğaltıldı"); return; }
      if (e.key === "c" && (e.metaKey || e.ctrlKey) && seciliKlipId) { yut(); klipKopyala(proje.id, seciliKlipId); toast("Klip kopyalandı 📋"); return; }
      if (e.key === "v" && (e.metaKey || e.ctrlKey)) {
        yut();
        // seçili klibin katmanına, yoksa ilk uygun katmana playhead'de yapıştır
        const secK = proje.katmanlar.find((kk) => kk.klipler.some((x) => x.id === seciliKlipId));
        const pano = useMontaj.getState().pano;
        const hedef = secK ?? proje.katmanlar.find((kk) => kk.tur === (pano?.tur === "ses" ? "ses" : pano?.tur === "metin" ? "metin" : "video"));
        if (!pano) { toast.error("Önce bir klip kopyala (⌘C)"); return; }
        if (hedef) { const id = klipYapistir(proje.id, hedef.id, playhead); if (id) { klipSec(id); toast("Yapıştırıldı ✓"); } }
        return;
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { yut(); geriAl(proje.id); return; }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) { yut(); yinele(proje.id); return; }
      if (e.key === "ArrowLeft") { yut(); playheadAyarla(Math.max(0, playhead - (e.shiftKey ? 1 : 1 / proje.fps))); return; }
      if (e.key === "ArrowRight") { yut(); playheadAyarla(Math.min(toplam, playhead + (e.shiftKey ? 1 : 1 / proje.fps))); return; }
      if (e.key === "Home") { yut(); playheadAyarla(0); return; }
      if (e.key === "End") { yut(); playheadAyarla(toplam); return; }
      /* Kabuğun diğer tek-tuş navigasyonları (o/p/m/k/h/d) editörde kazara
         sayfa değiştirmesin — montaj ekranında hepsini yut. */
      if (!e.metaKey && !e.ctrlKey && !e.altKey && /^[opmkhd]$/i.test(e.key)) { e.stopPropagation(); return; }
    };
    document.addEventListener("keydown", tus, true);
    return () => document.removeEventListener("keydown", tus, true);
  }, [proje.id, proje.fps, proje.katmanlar, seciliKlipId, playhead, toplam, oynatDurdur, klipBol, klipSil, klipCogalt, klipKopyala, klipYapistir, klipSec, geriAl, yinele, playheadAyarla]);

  /* ── ZAMAN ÇİZELGESİ YÜKSEKLİK TUTAMAĞI (ses sayfasındaki panelSurukle deseni) ── */
  const seritSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const tasi = (ev: PointerEvent) => {
      const alt = window.innerHeight - ev.clientY;
      setSeritYuk(Math.max(150, Math.min(Math.round(window.innerHeight * 0.66), alt)));
    };
    const birak = () => {
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  /* Klip seçilince denetleyici kapalıysa otomatik aç — ama YALNIZCA seçim boştan
     dolu'ya geçtiğinde (ilk seçim). Kullanıcı paneli bilerek kapattıysa, klipler
     arasında gezerken panel her seferinde zorla açılmasın. (Eleştiri #10) */
  const oncekiSecim = useRef<string | null>(null);
  useEffect(() => {
    if (seciliKlipId && !oncekiSecim.current) setSagAcik(true);
    oncekiSecim.current = seciliKlipId;
  }, [seciliKlipId]);

  // AI: tıklayınca ÖNCE onay şeridi göster (etki tahmini), onaydan sonra uygula.
  const ai = (komut: AiKomutId) => {
    const videoKlip = proje.katmanlar.filter((k) => k.tur === "video").reduce((a, k) => a + k.klipler.length, 0);
    if (videoKlip === 0 && komut !== "altyazi") {
      toast.error("Önce klip ekle");
      const vk = proje.katmanlar.find((k) => k.tur === "video");
      if (vk) setKlipSecici({ katmanId: vk.id, tur: "video" });
      return;
    }
    setAiOnay(komut);
  };
  const aiOnayla = (komut: AiKomutId) => {
    const sonuc = aiUygula(proje.id, komut);
    setAiOnay(null);
    if (sonuc === "Önce klip ekle") { toast.error("Önce klip ekle"); return; }
    toast.success(AI_KOMUT_META[komut].ad + " ✨", { description: sonuc + " · geri almak için ⌘Z" });
  };

  const uret = () => {
    const klipSayi = proje.katmanlar.reduce((a, k) => a + k.klipler.length, 0);
    if (klipSayi === 0) { toast.error("En az bir klip ekle"); return; }
    const kredi = 15 + klipSayi * 6;

    // EDL — kurulan timeline'ı render isteğine GERÇEKTEN taşı (eleştiri #1 düzeltmesi).
    // Video klipleri baslangıç sırasına göre bir kurgu senaryosu (shot list) olarak,
    // ses/metin katmanları da ayrı ayrı prompt'a girer; böylece render kullanıcının
    // kurgusunu yok saymaz.
    const GECIS_AD: Record<string, string> = {
      yok: "", kesme: "kes", fade: "erime", kaydir: "kaydırma", yakinlas: "yakınlaş", bulanik: "bulanık geçiş", beyazparla: "beyaz parlama",
    };
    const videolar = proje.katmanlar
      .filter((k) => k.tur === "video" && !k.gizli)
      .flatMap((k) => k.klipler)
      .sort((a, b) => a.baslangic - b.baslangic);
    const shotList = videolar.map((k, i) => {
      const g = GECIS_AD[k.gecis] ? ` →${GECIS_AD[k.gecis]}` : "";
      const hz = k.hiz !== 1 ? ` ${k.hiz}×` : "";
      const ef = k.efektler.length ? ` (${k.efektler.join(",")})` : "";
      return `${i + 1}. ${k.ad} ${klipSure(k).toFixed(1)}s${hz}${ef}${g}`;
    }).join("  ·  ");

    const sesKatmanlari = proje.katmanlar.filter((k) => k.tur === "ses" && !k.sessiz && k.klipler.length);
    const sesOzet = sesKatmanlari.flatMap((k) => k.klipler).map((k) => k.ad).join(", ");
    const metinKatmanlari = proje.katmanlar.filter((k) => k.tur === "metin" && k.klipler.length);
    const metinler = metinKatmanlari.flatMap((k) => k.klipler).map((k) => k.ad);

    const kurguMetni = [
      proje.aiTalimat?.trim() && `Yön: ${proje.aiTalimat.trim()}`,
      shotList && `Kurgu: ${shotList}`,
      sesOzet && `Ses: ${sesOzet}`,
      metinler.length && `Metin: ${metinler.join(" / ")}`,
    ].filter(Boolean).join("\n");

    const sonuc = uretimBaslat({
      baslik: proje.ad, tur: "video", model: "Vayra Montaj AI",
      prompt: kurguMetni || `${klipSayi} klipten ${proje.katmanlar.length} katmanlı montaj`,
      kredi, arac: "Montaj Stüdyosu",
      meta: {
        oran: proje.enBoy, cozunurluk: proje.cozunurluk, sure: sureBicim(toplam),
        ...(sesOzet ? { ses: sesOzet } : {}),
        // İlk video klibin görselini render çıpası olarak geçir (varsa).
        ...(videolar[0]?.gorselUrl ? { gorselUrl: videolar[0].gorselUrl } : {}),
      },
    });
    if (!sonuc.ok) { uretimHataToast(sonuc); return; }
    toast.success("Montaj render ediliyor 🎬", { description: `${videolar.length} kesim · ${sureBicim(toplam)} · ${kredi} kredi` });
  };

  return (
    <div className="sinema-kapsam flex h-[calc(100vh-3rem)] flex-col overflow-hidden bg-zemin">
      {/* ═══ ÜST ÇUBUK ═══ */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <button onClick={() => projeSec(null)} title="Montajlara dön"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><ChevronRight className="h-4 w-4 rotate-180" /></button>
        <input value={proje.ad} onChange={(e) => projeGuncelle(proje.id, { ad: e.target.value })}
          className="w-[150px] min-w-0 shrink bg-transparent text-[15px] font-bold text-white outline-none xl:w-[210px]" placeholder="Montaj adı" />
        {/* M2: editörde de beta olduğu görünsün */}
        <BetaRozet className="hidden shrink-0 lg:inline-flex" />

        <div className="mx-0.5 h-5 w-px shrink-0 bg-white/10" />
        {/* panel görünürlüğü */}
        <button onClick={() => setSolAcik((v) => !v)} title="AI panelini aç/kapat"
          className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/8 hover:text-white",
            solAcik ? "text-white" : "text-metin-3")}><PanelLeft className="h-4 w-4" /></button>
        <button onClick={() => setSagAcik((v) => !v)} title="Denetleyiciyi aç/kapat"
          className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/8 hover:text-white",
            sagAcik ? "text-white" : "text-metin-3")}><PanelRight className="h-4 w-4" /></button>

        <div className="mx-0.5 h-5 w-px shrink-0 bg-white/10" />
        {/* geri al / yinele */}
        <button onClick={() => geriAl(proje.id)} disabled={!gecmis.geri} title="Geri al (⌘Z)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
        <button onClick={() => yinele(proje.id)} disabled={!gecmis.ileri} title="Yinele (⇧⌘Z)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>

        <div className="mx-0.5 h-5 w-px shrink-0 bg-white/10" />
        {/* klip araçları */}
        <button onClick={() => { if (seciliKlipId) { klipBol(proje.id, seciliKlipId, playhead); toast("Klip bölündü ✂️"); } else toast.error("Önce bir klip seç"); }}
          title="Playhead'de böl (S)"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/8 hover:text-white"><Scissors className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Böl</span></button>
        <button onClick={() => { if (seciliKlipId) { klipCogalt(proje.id, seciliKlipId); toast("Çoğaltıldı"); } else toast.error("Önce bir klip seç"); }}
          title="Çoğalt (⌘D)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
        <button onClick={() => { if (seciliKlipId) { klipSil(proje.id, seciliKlipId); toast("Silindi"); } else toast.error("Önce bir klip seç"); }}
          title="Sil (Delete)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="hidden rounded-full bg-white/[0.05] px-3 py-1.5 font-mono text-[12.5px] tabular-nums text-metin-2 md:block">
            {sureBicim(playhead)} <span className="text-metin-3">/ {sureBicim(toplam)}</span>
          </span>
          {/* kısayol popover — sol panelden buraya taşındı, orada yer kaplıyordu */}
          <div className="relative">
            <button onClick={() => setKisayolAcik((v) => !v)} title="Klavye kısayolları"
              className={cn("relative z-50 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/8 hover:text-white",
                kisayolAcik ? "bg-white/10 text-white" : "text-metin-2")}><Keyboard className="h-4 w-4" /></button>
            <AnimatePresence>
              {kisayolAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setKisayolAcik(false)} />
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    className="menu-surface absolute right-0 top-10 z-50 w-[236px] rounded-2xl border border-white/10 p-3 shadow-2xl">
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-metin-3">Kısayollar</p>
                    <div className="space-y-1.5 text-[12px] text-metin-2">
                      {[["Boşluk", "Oynat / duraklat"], ["S", "Playhead'de böl"], ["⌘D", "Çoğalt"], ["Delete", "Sil"], ["← →", "Kare ilerle"], ["⇧← ⇧→", "1 saniye"], ["Home / End", "Başa / sona"], ["⌘Z", "Geri al"], ["⇧⌘Z", "Yinele"]].map(([t, a]) => (
                        <div key={t} className="flex items-center justify-between gap-2">
                          <kbd className="shrink-0 rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10.5px] text-white">{t}</kbd>
                          <span className="truncate text-metin-3">{a}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setAyarAcik(true)} title="Çıktı ayarları"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/8 hover:text-white"><Settings2 className="h-4 w-4" /> <span className="hidden xl:inline">Ayarlar</span></button>
          <button onClick={uret}
            className="flex items-center gap-1.5 rounded-xl bg-aksan px-4 py-2 text-[13.5px] font-bold text-zemin transition-transform hover:scale-[1.03]">
            <Download className="h-4 w-4" /> Render et
          </button>
        </div>
      </div>

      {/* ═══ ORTA: sol AI · önizleme · sağ inspector ═══ */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* ═══ SOL — KOMPAKT AI RAYI ═══
            Eski 248px kart yığını yerine 196px'lik sıkı bir ray: talimat kutusu +
            2 kolonluk AI çip ızgarası. Kısayol listesi üst çubuktaki popover'a taşındı,
            böylece panel scroll gerektirmiyor ve önizlemeye yer açılıyor. */}
        {solAcik && (
          <aside className="hidden w-[196px] shrink-0 flex-col border-r border-white/[0.06] bg-yuzey lg:flex">
            <div className="flex shrink-0 items-center justify-between gap-1 px-3 pb-1.5 pt-2.5">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-metin-3">
                <Sparkles className="h-3.5 w-3.5 text-aksan" /> AI Montaj
              </p>
              <button onClick={() => setSolAcik(false)} title="Paneli daralt"
                className="flex h-6 w-6 items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/8 hover:text-white"><PanelLeft className="h-3.5 w-3.5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">
              <textarea value={proje.aiTalimat} onChange={(e) => projeGuncelle(proje.id, { aiTalimat: e.target.value })} rows={3}
                placeholder="Montajı anlat: enerjik 30sn tanıtım, hızlı kesimler…"
                className="mb-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[12.5px] leading-snug text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />
              {/* AI komutları — 2 kolon kompakt çip ızgarası */}
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(AI_KOMUT_META) as AiKomutId[]).map((id) => (
                  <button key={id} onClick={() => ai(id)} title={`${AI_KOMUT_META[id].ad} — ${AI_KOMUT_META[id].ozet}`}
                    className="group flex min-h-[58px] flex-col items-start justify-start gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2 text-left transition-colors hover:border-aksan/40 hover:bg-aksan/[0.08]">
                    <Wand2 className="h-3.5 w-3.5 shrink-0 text-aksan" />
                    <span className="text-[10.5px] font-semibold leading-[1.25] text-white">{AI_KOMUT_META[id].ad}</span>
                  </button>
                ))}
              </div>
              {/* katman hızlı ekleme — timeline başlığındaki butonların ikizi değil, kısayol */}
              <p className="mb-1.5 mt-3.5 text-[11.5px] font-semibold uppercase tracking-wide text-metin-3">Katman ekle</p>
              <div className="grid grid-cols-3 gap-1.5">
                <KatmanCip proje={proje} tur="video" ikon={<VideoIcon className="h-3.5 w-3.5" />} ad="Video" />
                <KatmanCip proje={proje} tur="ses" ikon={<Music2 className="h-3.5 w-3.5" />} ad="Ses" />
                <KatmanCip proje={proje} tur="metin" ikon={<TypeIcon className="h-3.5 w-3.5" />} ad="Metin" />
              </div>
            </div>
          </aside>
        )}
        {/* daraltılmış sol ray — sadece ikon şeridi */}
        {!solAcik && (
          <aside className="hidden w-[48px] shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] bg-yuzey py-2.5 lg:flex">
            <button onClick={() => setSolAcik(true)} title="AI panelini aç"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-3 transition-colors hover:bg-white/8 hover:text-white"><PanelLeft className="h-4 w-4" /></button>
            <div className="my-1 h-px w-6 bg-white/10" />
            {(Object.keys(AI_KOMUT_META) as AiKomutId[]).map((id) => (
              <button key={id} onClick={() => ai(id)} title={`${AI_KOMUT_META[id].ad} — ${AI_KOMUT_META[id].ozet}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-3 transition-colors hover:bg-aksan/12 hover:text-aksan"><Wand2 className="h-3.5 w-3.5" /></button>
            ))}
          </aside>
        )}

        {/* ═══ ORTA — ÖNİZLEME (asıl iş alanı) ═══ */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-[#08080a]">
          <Onizleme proje={proje} playhead={playhead} />
          {/* BOŞ MONTAJ → hızlı başlangıç yönlendirmesi (higgs deseni: kullanıcı asla boş ekranda kalmaz) */}
          {toplam === 0 && (
            <BosBaslangic proje={proje}
              onKlipEkle={(katmanId, tur) => setKlipSecici({ katmanId, tur })}
              onAI={() => setSolAcik(true)} />
          )}
          {/* transport — kompakt tek satır */}
          <div className="relative flex shrink-0 items-center justify-center gap-2 border-t border-white/[0.06] bg-black/25 px-3 py-2">
            <button onClick={() => playheadAyarla(0)} title="Başa dön (Home)"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><SkipBack className="h-4 w-4" /></button>
            <button onClick={() => oynatDurdur()} title="Oynat / duraklat (Boşluk)"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zemin transition-transform hover:scale-105">
              {oynuyor ? <Pause className="h-[18px] w-[18px]" /> : <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />}
            </button>
            <button onClick={() => playheadAyarla(toplam)} title="Sona git (End)"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><SkipForward className="h-4 w-4" /></button>
            <span className="ml-1.5 font-mono text-[12.5px] tabular-nums text-metin-2">{sureBicim(playhead)} <span className="text-metin-3">/ {sureBicim(toplam)}</span></span>
            {/* dar ekranda denetleyiciyi açma düğmesi (xl altı) */}
            {!sagAcik && (
              <button onClick={() => setSagAcik(true)} title="Denetleyiciyi aç"
                className="absolute right-3 flex h-8 items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.1] hover:text-white">
                <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Denetleyici</span>
              </button>
            )}
          </div>
        </div>

        {/* ═══ SAĞ — KLİP DENETLEYİCİ ═══
            Artık xl: değil md:'den itibaren görünür; dar ekranda üstte kayan panel olur
            ki klip seçilince ayar her zaman yapılabilsin. */}
        {sagAcik && (
          <aside className="absolute inset-y-0 right-0 z-30 hidden w-[300px] shrink-0 flex-col border-l border-white/[0.06] bg-yuzey shadow-2xl md:flex xl:static xl:z-auto xl:shadow-none">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-metin-3">
                <SlidersHorizontal className="h-3.5 w-3.5 text-aksan" /> {secili ? "Klip denetleyici" : "Montaj özeti"}
              </p>
              <button onClick={() => setSagAcik(false)} title="Denetleyiciyi kapat"
                className="flex h-6 w-6 items-center justify-center rounded-md text-metin-3 transition-colors hover:bg-white/8 hover:text-white"><PanelRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 [scrollbar-width:thin]">
              {secili
                ? <KlipDenetleyici proje={proje} klip={secili} />
                : <BosDenetleyici proje={proje} onAyar={() => setAyarAcik(true)} />}
            </div>
          </aside>
        )}
      </div>

      {/* GERÇEK SES — playhead ile senkron çalar (görünmez motor) */}
      <SesMotoru proje={proje} playhead={playhead} oynuyor={oynuyor} />

      {/* ═══ ALT: ZAMAN ÇİZELGESİ (sürüklenerek yeniden boyutlandırılır) ═══ */}
      <ZamanCizelgesi proje={proje} yukseklik={seritYuk} onSurukle={seritSurukle}
        onSifirla={() => setSeritYuk(256)}
        onKlipEkle={(katmanId, tur) => setKlipSecici({ katmanId, tur })} />

      {/* KEY ŞART: bu üç modalin her biri iki `motion.div` (karartma + panel)
          döndürüyor. AnimatePresence anahtarsız kardeşlere BOŞ anahtar veriyor
          ve iki çocuk aynı anahtarı alınca React "two children with the same
          key" hatası basıyordu (ölçüldü: anahtar değeri boş string). */}
      <AnimatePresence>
        {klipSecici && <KlipSecici key="klip-secici" proje={proje} katmanId={klipSecici.katmanId} tur={klipSecici.tur} onKapat={() => setKlipSecici(null)} />}
        {ayarAcik && <CiktiAyarModal key="cikti-ayar" proje={proje} onKapat={() => setAyarAcik(false)} />}
        {aiOnay && <AiOnayModal key="ai-onay" proje={proje} komut={aiOnay} onUygula={() => aiOnayla(aiOnay)} onKapat={() => setAiOnay(null)} />}
      </AnimatePresence>
    </div>
  );
}

/** Sol raydaki kompakt "katman ekle" çipi. */
function KatmanCip({ proje, tur, ikon, ad }: { proje: MontajProje; tur: KatmanTur; ikon: React.ReactNode; ad: string }) {
  const katmanEkle = useMontaj((s) => s.katmanEkle);
  return (
    <button onClick={() => { katmanEkle(proje.id, tur); toast(`${ad} katmanı eklendi`); }} title={`${ad} katmanı ekle`}
      className="flex h-[46px] flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] text-metin-2 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white">
      {ikon}<span className="text-[10.5px] font-medium leading-none">{ad}</span>
    </button>
  );
}

/* ═══════════ SES MOTORU — playhead ile senkron GERÇEK ses ═══════════ */

/**
 * Aktif ses/video kliplerini playhead ile senkronlar. Her çalınabilir kaynak için
 * bir <audio> elemanı tutar; oynatma sırasında currentTime'ı playhead'e hizalar,
 * ses düzeyi × fade zarfı × katman sessiz durumunu uygular. Gerçek URL yoksa sessiz.
 */
function SesMotoru({ proje, playhead, oynuyor }: { proje: MontajProje; playhead: number; oynuyor: boolean }) {
  const audioRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Çalınabilir klipler: ses katmanı + video katmanı (sesUrl'ü olan, katman sessiz değil)
  const sesli = useMemo(() => proje.katmanlar
    .filter((kat) => !kat.sessiz && (kat.tur === "ses" || kat.tur === "video"))
    .flatMap((kat) => kat.klipler
      .filter((k) => !!k.sesUrl && k.sesDuzey > 0)
      .map((k) => ({ k, katmanId: kat.id }))),
    [proje.katmanlar]);

  // Her tik: her klibin durumunu güncelle
  useEffect(() => {
    const harita = audioRef.current;
    const gecerliIdler = new Set(sesli.map((x) => x.k.id));
    // artık listede olmayan sesleri durdur & temizle
    for (const [id, el] of harita) {
      if (!gecerliIdler.has(id)) { el.pause(); harita.delete(id); }
    }
    for (const { k } of sesli) {
      let el = harita.get(k.id);
      if (!el) {
        el = new Audio(k.sesUrl);
        el.preload = "auto";
        harita.set(k.id, el);
      }
      const gorunen = klipSure(k);
      const yerel = playhead - k.baslangic;
      const aktif = yerel >= 0 && yerel < gorunen;
      if (aktif && oynuyor) {
        // kaynak-içi konum: kırpma + hız hesaba katılır
        const kaynakT = k.basKirp + yerel * Math.max(0.25, k.hiz);
        if (Math.abs((el.currentTime || 0) - kaynakT) > 0.3) el.currentTime = kaynakT;
        el.volume = Math.max(0, Math.min(1, (k.sesDuzey / 100) * sesZarf(k, yerel)));
        el.playbackRate = Math.max(0.25, Math.min(4, k.hiz));
        if (el.paused) el.play().catch(() => {});
      } else {
        if (!el.paused) el.pause();
      }
    }
  }, [sesli, playhead, oynuyor]);

  // Ayrılırken tüm sesleri durdur
  useEffect(() => {
    const harita = audioRef.current;
    return () => { for (const el of harita.values()) el.pause(); harita.clear(); };
  }, []);

  return null;
}

/* ═══════════ BOŞ MONTAJ — hızlı başlangıç yönlendirmesi ═══════════ */

/** Timeline boşken önizlemenin üzerine biner: 3 adımlı görsel rehber + hızlı ekleme. */
function BosBaslangic({ proje, onKlipEkle, onAI }: {
  proje: MontajProje;
  onKlipEkle: (katmanId: string, tur: KatmanTur) => void;
  onAI: () => void;
}) {
  const videoKat = proje.katmanlar.find((k) => k.tur === "video");
  const sesKat = proje.katmanlar.find((k) => k.tur === "ses");
  const metinKat = proje.katmanlar.find((k) => k.tur === "metin");

  const ADIMLAR = [
    { no: 1, ad: "Klip ekle", ikon: Clapperboard, aciklama: "Kitaplığındaki video/görsel üretimlerini timeline'a diz" },
    { no: 2, ad: "Düzenle", ikon: Scissors, aciklama: "Kırp, hızlandır, geçiş ve efekt ver — hepsi canlı önizlemeli" },
    { no: 3, ad: "Render et", ikon: Download, aciklama: "Kurgunu tek videoya birleştir, kitaplığına düşsün" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0d0d0f]/80 p-6 text-center backdrop-blur-md sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-aksan/12 text-aksan">
          <Film className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-[19px] font-extrabold text-white">Montajına başla</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-metin-2">
          Üretimlerini bir zaman çizelgesinde birleştir, kırp ve geçişlerle bağla.
          Aşağıdan ilk klibini ekle.
        </p>

        {/* 3 adım */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {ADIMLAR.map((a) => {
            const I = a.ikon;
            return (
              <div key={a.no} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-aksan/15 text-[11px] font-bold text-aksan">{a.no}</span>
                  <I className="h-3.5 w-3.5 text-metin-2" />
                </div>
                <p className="mt-1.5 text-[12.5px] font-bold text-white">{a.ad}</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-metin-3">{a.aciklama}</p>
              </div>
            );
          })}
        </div>

        {/* hızlı ekleme */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {videoKat && (
            <button onClick={() => onKlipEkle(videoKat.id, "video")}
              className="flex items-center gap-1.5 rounded-xl bg-aksan px-4 py-2.5 text-[13.5px] font-bold text-zemin transition-transform hover:scale-[1.03]">
              <VideoIcon className="h-4 w-4" /> Video/görsel klip ekle
            </button>
          )}
          {sesKat && (
            <button onClick={() => onKlipEkle(sesKat.id, "ses")}
              className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08]">
              <Music2 className="h-4 w-4 text-sky-300" /> Ses
            </button>
          )}
          {metinKat && (
            <button onClick={() => onKlipEkle(metinKat.id, "metin")}
              className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.08]">
              <TypeIcon className="h-4 w-4 text-fuchsia-300" /> Metin
            </button>
          )}
        </div>
        <button onClick={onAI}
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-metin-3 transition-colors hover:text-aksan">
          <Sparkles className="h-3.5 w-3.5" /> veya AI komutlarıyla otomatik kur
        </button>
      </div>
    </div>
  );
}

/* ═══════════ ÖNİZLEME — playhead'i canlı render eder ═══════════ */

function Onizleme({ proje, playhead }: { proje: MontajProje; playhead: number }) {
  const oran = proje.enBoy === "9:16" ? "9 / 16" : proje.enBoy === "1:1" ? "1 / 1" : "16 / 9";

  // O anda görünür video klipleri (katman sırası: üstteki katman üstte çizilir)
  const videoKatmanlar = proje.katmanlar.filter((k) => k.tur === "video" && !k.gizli);
  const metinKatmanlar = proje.katmanlar.filter((k) => k.tur === "metin" && !k.gizli);
  const sesKatmanlar = proje.katmanlar.filter((k) => k.tur === "ses" && !k.sessiz);

  const aktifSes = sesKatmanlar.map((k) => anlikKlip(k, playhead)).filter(Boolean) as MontajKlip[];

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-3 xl:p-5">
      {/* aspect-ratio + h-full/w-auto: dikey (9:16) formatta da kutu daima görünür
          kalır — sabit width vermek 9:16'da kutuyu taşırıp boş gösteriyordu. */}
      <div className="relative h-full max-h-full w-auto max-w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10"
        style={{ aspectRatio: oran }}>
        {/* video katmanları */}
        {[...videoKatmanlar].reverse().map((kat) => {
          const k = anlikKlip(kat, playhead);
          if (!k) return null;
          const yerel = playhead - k.baslangic;
          const gorunen = klipSure(k);
          // geçiş: klibin ilk gecisSure saniyesinde uygulanır
          const gOran = k.gecis !== "yok" && k.gecis !== "kesme" && yerel < k.gecisSure
            ? Math.max(0, Math.min(1, yerel / Math.max(0.05, k.gecisSure))) : 1;
          const zoomEfekt = k.efektler.includes("yakinlas") ? 1 + (yerel / Math.max(0.1, gorunen)) * 0.12 : 1;
          // KEYFRAME dönüşümü — o anki opaklık/ölçek/konum/dönme (interpolasyonlu)
          const d = klipDonusum(k, yerel);
          // sarsıntı efekti: hafif deterministik titreşim (playhead'e bağlı)
          const sars = k.efektler.includes("sarsinti")
            ? { x: Math.sin(playhead * 47) * 0.6, y: Math.cos(playhead * 61) * 0.6 } : { x: 0, y: 0 };
          // Geçişte opaklık tabanı: tam 0 olursa klibin ilk karesi kapkara görünür
          // (durdurulmuş playhead'de "önizleme boş" hissi verir). 0.15'ten başlat.
          const gOpak = 0.15 + gOran * 0.85;
          const gecisStil: React.CSSProperties =
            k.gecis === "fade" ? { opacity: gOpak }
              : k.gecis === "kaydir" ? { transform: `translateX(${(1 - gOran) * 100}%)` }
                : k.gecis === "bulanik" ? { filter: `blur(${(1 - gOran) * 14}px)`, opacity: 0.4 + gOran * 0.6 }
                  : k.gecis === "yakinlas" ? { transform: `scale(${1 + (1 - gOran) * 0.25})`, opacity: gOpak }
                    : {};
          // birleşik dönüşüm: keyframe konum/ölçek/dönme + geçiş + zoom efekt + sarsıntı
          const olcek = (d.olcek / 100) * zoomEfekt * (k.gecis === "yakinlas" ? 1 + (1 - gOran) * 0.25 : 1);
          const cevir = `translate(${d.x + sars.x + (k.gecis === "kaydir" ? (1 - gOran) * 100 : 0)}%, ${d.y + sars.y}%)`;
          const gecisFiltre = k.gecis === "bulanik" ? ` blur(${(1 - gOran) * 14}px)` : "";
          const tam = tamFilter(k);
          return (
            <div key={kat.id} className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 transition-none"
                style={{
                  background: arkaPlan(k),
                  filter: (tam === "none" ? "" : tam) + gecisFiltre || "none",
                  opacity: (d.opaklik / 100) * (gecisStil.opacity !== undefined ? Number(gecisStil.opacity) : 1),
                  transform: `${cevir} scale(${olcek}) rotate(${d.donme}deg)`,
                }}>
                {(() => { const u = saltUrl(arkaPlan(k)); return u ? <img src={u} alt="" className="h-full w-full object-cover" /> : null; })()}
              </div>
              {/* vinyet efekti */}
              {k.efektler.includes("vinyet") && (
                <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.65)" }} />
              )}
              {/* beyaz parlama geçişi */}
              {k.gecis === "beyazparla" && gOran < 1 && (
                <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: 1 - gOran }} />
              )}
              {/* grenli doku */}
              {k.efektler.includes("grenli") && (
                <div className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
                  style={{ backgroundImage: "repeating-conic-gradient(#fff 0% 25%, #000 0% 50%)", backgroundSize: "3px 3px" }} />
              )}
            </div>
          );
        })}

        {/* metin katmanları (altyazı / başlık) */}
        {metinKatmanlar.map((kat) => {
          const k = anlikKlip(kat, playhead);
          if (!k?.metin) return null;
          const konum = k.metinKonum === "ust" ? "top-[8%]" : k.metinKonum === "orta" ? "top-1/2 -translate-y-1/2" : "bottom-[8%]";
          return (
            <div key={kat.id} className={cn("pointer-events-none absolute inset-x-0 px-[6%] text-center", konum)}>
              <span className="inline-block rounded-lg bg-black/45 px-3 py-1.5 font-bold leading-tight backdrop-blur-sm"
                style={{ color: k.metinRenk, fontSize: `clamp(12px, ${(k.metinBoyut ?? 38) / 12}vw, ${k.metinBoyut}px)`, opacity: k.opaklik / 100 }}>
                {k.metin}
              </span>
            </div>
          );
        })}

        {/* boş durum */}
        {videoKatmanlar.every((kat) => !anlikKlip(kat, playhead)) && metinKatmanlar.every((kat) => !anlikKlip(kat, playhead)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-metin-3">
            <Film className="h-9 w-9 opacity-50" />
            <p className="text-[13px]">{montajToplamSure(proje) === 0 ? "Klip ekleyerek başla" : "Bu anda görüntü yok"}</p>
          </div>
        )}

        {/* çalan ses rozetleri */}
        {aktifSes.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {aktifSes.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-aksan backdrop-blur-sm">
                <AudioLines className="h-3 w-3" /> {s.ad} · %{s.sesDuzey}
              </span>
            ))}
          </div>
        )}

        {/* çözünürlük rozeti */}
        <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur-sm">
          {proje.cozunurluk} · {proje.enBoy} · {proje.fps}fps
        </span>
      </div>
    </div>
  );
}

/* ═══════════ ZAMAN ÇİZELGESİ ═══════════ */

function ZamanCizelgesi({ proje, yukseklik, onSurukle, onSifirla, onKlipEkle }: {
  proje: MontajProje;
  yukseklik: number;
  onSurukle: (e: React.PointerEvent) => void;
  onSifirla: () => void;
  onKlipEkle: (katmanId: string, tur: KatmanTur) => void;
}) {
  const playhead = useMontaj((s) => s.playhead);
  const playheadAyarla = useMontaj((s) => s.playheadAyarla);
  const zoom = useMontaj((s) => s.zoom);
  const zoomAyarla = useMontaj((s) => s.zoomAyarla);
  const katmanEkle = useMontaj((s) => s.katmanEkle);
  const katmanSil = useMontaj((s) => s.katmanSil);
  const katmanGuncelle = useMontaj((s) => s.katmanGuncelle);
  const klipleriSirala = useMontaj((s) => s.klipleriSirala);
  const seritRef = useRef<HTMLDivElement>(null);
  const basliklarRef = useRef<HTMLDivElement>(null);

  /** Şerit dikey kaydırılınca katman başlıkları sütununu senkron tut. */
  const kaydir = (e: React.UIEvent<HTMLDivElement>) => {
    if (basliklarRef.current) basliklarRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  const toplam = montajToplamSure(proje);
  const genislik = Math.max(600, (toplam + 6) * zoom);

  // cetvel işaretleri — zoom'a göre aralık
  const adim = zoom > 90 ? 1 : zoom > 45 ? 2 : zoom > 22 ? 5 : 10;
  const isaretler = Math.ceil((toplam + 6) / adim) + 1;

  const cetveleTikla = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left + (seritRef.current?.scrollLeft ?? 0);
    playheadAyarla(Math.max(0, x / zoom));
  };

  return (
    <div className="relative flex shrink-0 flex-col border-t border-white/[0.06] bg-[#0d0d0f]" style={{ height: yukseklik }}>
      {/* YÜKSEKLİK TUTAMAĞI — sürükleyerek çizelgeyi büyüt/küçült (çift tık: sıfırla) */}
      <span onPointerDown={onSurukle} onDoubleClick={onSifirla}
        title="Sürükleyerek yüksekliği ayarla · çift tık: sıfırla"
        className="group/tut absolute inset-x-0 -top-1 z-30 flex h-2.5 cursor-row-resize items-center justify-center">
        <span className="h-px w-full bg-transparent transition-colors group-hover/tut:bg-aksan/50" />
        <GripHorizontal className="absolute h-3 w-3 text-white/15 transition-colors group-hover/tut:text-aksan" />
      </span>

      {/* çizelge başlığı */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-metin-2"><Layers className="h-3.5 w-3.5" /> <span className="hidden lg:inline">Zaman çizelgesi</span></p>
        <div className="ml-1 flex items-center gap-1">
          <button onClick={() => katmanEkle(proje.id, "video")} title="Video katmanı ekle"
            className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1 text-[11.5px] font-medium text-white hover:bg-white/[0.09]"><VideoIcon className="h-3 w-3" /> Video</button>
          <button onClick={() => katmanEkle(proje.id, "ses")} title="Ses katmanı ekle"
            className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1 text-[11.5px] font-medium text-white hover:bg-white/[0.09]"><Music2 className="h-3 w-3" /> Ses</button>
          <button onClick={() => katmanEkle(proje.id, "metin")} title="Metin katmanı ekle"
            className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2 py-1 text-[11.5px] font-medium text-white hover:bg-white/[0.09]"><TypeIcon className="h-3 w-3" /> Metin</button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => zoomAyarla(zoom - 12)} title="Uzaklaş"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><ZoomOut className="h-3.5 w-3.5" /></button>
          <span className="w-10 text-center text-[11px] tabular-nums text-metin-3">{Math.round(zoom)}px</span>
          <button onClick={() => zoomAyarla(zoom + 12)} title="Yakınlaş"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><ZoomIn className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* katman başlıkları (sabit sol sütun) — şeritle dikey senkron kaydırılır */}
        <div className="flex w-[132px] shrink-0 flex-col border-r border-white/[0.06]">
          <div className="h-7 shrink-0 border-b border-white/[0.06]" />
          <div ref={basliklarRef} className="min-h-0 flex-1 overflow-hidden">
            {proje.katmanlar.map((kat) => (
              <div key={kat.id} className="group/kat flex h-[58px] items-center gap-1 border-b border-white/[0.04] px-2">
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  kat.tur === "video" ? "bg-aksan/15 text-aksan" : kat.tur === "ses" ? "bg-sky-400/15 text-sky-300" : "bg-fuchsia-400/15 text-fuchsia-300")}>
                  {kat.tur === "video" ? <VideoIcon className="h-3 w-3" /> : kat.tur === "ses" ? <Music2 className="h-3 w-3" /> : <TypeIcon className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-metin-2">{kat.ad}</span>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/kat:opacity-100">
                  {kat.tur === "ses" ? (
                    <button onClick={() => katmanGuncelle(proje.id, kat.id, { sessiz: !kat.sessiz })} title={kat.sessiz ? "Sesi aç" : "Sustur"}
                      className="flex h-5 w-5 items-center justify-center rounded text-metin-3 hover:text-white">{kat.sessiz ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}</button>
                  ) : (
                    <button onClick={() => katmanGuncelle(proje.id, kat.id, { gizli: !kat.gizli })} title={kat.gizli ? "Göster" : "Gizle"}
                      className="flex h-5 w-5 items-center justify-center rounded text-metin-3 hover:text-white">{kat.gizli ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</button>
                  )}
                  <button onClick={() => katmanGuncelle(proje.id, kat.id, { kilitli: !kat.kilitli })} title={kat.kilitli ? "Kilidi aç" : "Kilitle"}
                    className="flex h-5 w-5 items-center justify-center rounded text-metin-3 hover:text-white">{kat.kilitli ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}</button>
                  <button onClick={() => klipleriSirala(proje.id, kat.id)} title="Boşlukları kapat"
                    className="flex h-5 w-5 items-center justify-center rounded text-metin-3 hover:text-white"><Combine className="h-3 w-3" /></button>
                  {proje.katmanlar.length > 1 && (
                    <button onClick={() => katmanSil(proje.id, kat.id)} title="Katmanı sil"
                      className="flex h-5 w-5 items-center justify-center rounded text-metin-3 hover:text-rose-400"><X className="h-3 w-3" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* kaydırılabilir şerit — yatay zaman, dikey katman */}
        <div ref={seritRef} onScroll={kaydir}
          className="relative min-w-0 flex-1 overflow-auto [scrollbar-width:thin]">
          <div className="relative" style={{ width: genislik }}>
            {/* cetvel — dikey kaydırmada üstte yapışık kalır */}
            <div onClick={cetveleTikla} className="sticky top-0 z-10 h-7 cursor-pointer border-b border-white/[0.06] bg-[#111113]">
              {Array.from({ length: isaretler }).map((_, i) => {
                const sn = i * adim;
                return (
                  <span key={i} className="absolute top-0 flex h-7 items-center border-l border-white/10 pl-1 text-[9.5px] tabular-nums text-metin-3"
                    style={{ left: sn * zoom }}>{sureBicim(sn)}</span>
                );
              })}
            </div>

            {/* katman şeritleri */}
            {proje.katmanlar.map((kat) => (
              <KatmanSerit key={kat.id} proje={proje} kat={kat} zoom={zoom} onKlipEkle={onKlipEkle} />
            ))}

            {/* PLAYHEAD */}
            <div className="pointer-events-none absolute inset-y-0 z-20 w-px bg-aksan" style={{ left: playhead * zoom }}>
              <span className="sticky top-0 -ml-[5px] block h-2.5 w-2.5 rounded-sm bg-aksan" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KatmanSerit({ proje, kat, zoom, onKlipEkle }: {
  proje: MontajProje; kat: MontajKatman; zoom: number; onKlipEkle: (katmanId: string, tur: KatmanTur) => void;
}) {
  const seciliKlipId = useMontaj((s) => s.seciliKlipId);
  const klipSec = useMontaj((s) => s.klipSec);
  const klipTasi = useMontaj((s) => s.klipTasi);
  const klipGuncelle = useMontaj((s) => s.klipGuncelle);
  const [snapX, setSnapX] = useState<number | null>(null); // görsel snap çizgisi konumu (px)

  /**
   * Sürükleme sırasında yapışma (magnet) noktaları: TÜM diğer kliplerin baş/son
   * kenarları + playhead + 0. Eşik dahilindeyse en yakınına kilitlenir.
   */
  const snapNoktalari = (haricId: string): number[] => {
    const nok = new Set<number>([0, useMontaj.getState().playhead]);
    for (const kt of proje.katmanlar) for (const x of kt.klipler) {
      if (x.id === haricId) continue;
      nok.add(x.baslangic);
      nok.add(x.baslangic + klipSure(x));
    }
    return [...nok];
  };

  /** Klibi sürükleyerek timeline'da taşı (kilitli katmanda çalışmaz). */
  const surukle = (e: React.PointerEvent, k: MontajKlip) => {
    if (kat.kilitli) { toast.error("Katman kilitli"); return; }
    e.preventDefault();
    klipSec(k.id);
    const baslaX = e.clientX;
    const baslaBas = k.baslangic;
    const noktalar = snapNoktalari(k.id);
    const esikSn = 8 / zoom; // ~8px yapışma eşiği
    const tasi = (ev: PointerEvent) => {
      const dx = (ev.clientX - baslaX) / zoom;
      let yeni = Math.max(0, Math.round((baslaBas + dx) * 4) / 4);
      const gorSure = klipSure(k);
      // baş VEYA son kenarı en yakın snap noktasına yapıştır
      let enIyi: { fark: number; hedef: number; nokta: number } | null = null;
      for (const n of noktalar) {
        for (const kenar of [yeni, yeni + gorSure]) {
          const fark = Math.abs(kenar - n);
          if (fark <= esikSn && (!enIyi || fark < enIyi.fark)) enIyi = { fark, hedef: yeni + (n - kenar), nokta: n };
        }
      }
      if (enIyi) { yeni = Math.max(0, enIyi.hedef); setSnapX(enIyi.nokta * zoom); }
      else setSnapX(null);
      // Dikey: imlecin üzerinde AYNI TÜRDE farklı bir katman varsa oraya taşı
      const alt = document.elementFromPoint(ev.clientX, ev.clientY);
      const satir = alt?.closest<HTMLElement>("[data-katman-id]");
      const hedefId = satir?.dataset.katmanId;
      const hedefTur = satir?.dataset.katmanTur;
      const hedef = hedefId && hedefId !== kat.id && hedefTur === kat.tur ? hedefId : undefined;
      klipTasi(proje.id, k.id, yeni, hedef);
    };
    const birak = () => {
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
      document.body.style.cursor = "";
      setSnapX(null);
    };
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  /** Kenardan çekerek kırp (sol = basKirp, sağ = sonKirp). */
  const kirp = (e: React.PointerEvent, k: MontajKlip, taraf: "sol" | "sag") => {
    if (kat.kilitli) return;
    e.preventDefault();
    e.stopPropagation();
    klipSec(k.id);
    const baslaX = e.clientX;
    const bas0 = k.basKirp, son0 = k.sonKirp, baslangic0 = k.baslangic;
    const tasi = (ev: PointerEvent) => {
      const dSn = ((ev.clientX - baslaX) / zoom) * Math.max(0.25, k.hiz);
      if (taraf === "sol") {
        const yeni = Math.max(0, Math.min(k.sure - son0 - 0.3, bas0 + dSn));
        klipGuncelle(proje.id, k.id, { basKirp: yeni, baslangic: Math.max(0, baslangic0 + (yeni - bas0) / Math.max(0.25, k.hiz)) });
      } else {
        const yeni = Math.max(0, Math.min(k.sure - bas0 - 0.3, son0 - dSn));
        klipGuncelle(proje.id, k.id, { sonKirp: yeni });
      }
    };
    const birak = () => {
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "ew-resize";
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  return (
    <div data-katman-id={kat.id} data-katman-tur={kat.tur}
      className={cn("relative h-[58px] border-b border-white/[0.04]", kat.gizli && "opacity-40")}>
      {/* boş alan → klip ekle */}
      {kat.klipler.length === 0 && (
        <button onClick={() => onKlipEkle(kat.id, kat.tur)}
          className="absolute inset-y-1.5 left-2 flex items-center gap-1.5 rounded-lg border border-dashed border-white/12 px-3 text-[11.5px] text-metin-3 transition-colors hover:border-aksan/40 hover:text-white">
          <Plus className="h-3 w-3" /> {kat.tur === "video" ? "Klip" : kat.tur === "ses" ? "Ses" : "Metin"} ekle
        </button>
      )}

      {kat.klipler.map((k) => {
        const g = klipSure(k) * zoom;
        const secili = seciliKlipId === k.id;
        const renk = kat.tur === "video" ? "aksan" : kat.tur === "ses" ? "sky" : "fuchsia";
        return (
          <div key={k.id}
            onPointerDown={(e) => surukle(e, k)}
            onClick={() => klipSec(k.id)}
            className={cn("group/klip absolute inset-y-1.5 cursor-grab overflow-hidden rounded-lg border-2 transition-colors active:cursor-grabbing",
              secili ? "border-aksan ring-1 ring-aksan/40" : "border-white/10 hover:border-white/25")}
            style={{ left: k.baslangic * zoom, width: Math.max(18, g) }}>
            {/* zemin — renk grade timeline'da da yansır */}
            {kat.tur === "video" ? (
              <span className="absolute inset-0" style={{ background: arkaPlan(k), filter: tamFilter(k) }} />
            ) : (
              <span className={cn("absolute inset-0", kat.tur === "ses" ? "bg-sky-500/20" : "bg-fuchsia-500/20")} />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

            {/* ses dalgası */}
            {kat.tur === "ses" && (
              <span className="absolute inset-x-1 bottom-1 flex h-4 items-end gap-px overflow-hidden">
                {Array.from({ length: Math.max(4, Math.floor(g / 3)) }).map((_, i) => (
                  <span key={i} className="w-[2px] shrink-0 rounded-full bg-sky-300/70" style={{ height: `${25 + ((i * 53) % 70)}%` }} />
                ))}
              </span>
            )}

            {/* etiket */}
            <span className="absolute left-1.5 top-1 max-w-[calc(100%-12px)] truncate text-[10.5px] font-semibold text-white drop-shadow">
              {kat.tur === "metin" ? (k.metin || k.ad) : k.ad}
            </span>
            {/* süre + rozetler */}
            <span className="absolute bottom-0.5 right-1.5 text-[9.5px] font-medium tabular-nums text-white/85">{klipSure(k).toFixed(1)}s</span>
            {k.hiz !== 1 && (
              <span className="absolute bottom-0.5 left-1.5 rounded bg-black/60 px-1 text-[9px] font-bold text-aksan">{k.hiz}×</span>
            )}
            {k.efektler.length > 0 && kat.tur === "video" && (
              <span className="absolute right-1.5 top-1 flex h-3.5 items-center gap-0.5 rounded bg-aksan/90 px-1 text-[8.5px] font-bold text-zemin"><Wand2 className="h-2 w-2" />{k.efektler.length}</span>
            )}
            {/* geçiş göstergesi (sol kenar) */}
            {k.gecis !== "yok" && k.gecis !== "kesme" && (
              <span className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/45 to-transparent" title={MONTAJ_GECIS_META[k.gecis].ad} />
            )}
            {/* KEYFRAME elmasları — klibin alt kenarında, hareketin görünür kanıtı */}
            {(() => {
              const tumKf = Object.values(k.keyframeler ?? {}).flat().filter(Boolean) as { t: number }[];
              if (tumKf.length === 0) return null;
              const gorSure = klipSure(k);
              return (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2">
                  {tumKf.map((kf, i) => (
                    <span key={i} className="absolute bottom-0 h-1.5 w-1.5 -translate-x-1/2 rotate-45 rounded-[1px] bg-amber-300 shadow"
                      style={{ left: `${Math.min(100, Math.max(0, (kf.t / Math.max(0.1, gorSure)) * 100))}%` }} />
                  ))}
                </span>
              );
            })()}

            {/* kırpma tutamakları */}
            <span onPointerDown={(e) => kirp(e, k, "sol")} title="Baştan kırp"
              className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-aksan/0 transition-colors hover:bg-aksan/70" />
            <span onPointerDown={(e) => kirp(e, k, "sag")} title="Sondan kırp"
              className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-aksan/0 transition-colors hover:bg-aksan/70" />
          </div>
        );
      })}

      {/* katmanın sonuna hızlı ekleme */}
      {kat.klipler.length > 0 && (
        <button onClick={() => onKlipEkle(kat.id, kat.tur)} title="Bu katmana ekle"
          className="absolute inset-y-1.5 flex w-7 items-center justify-center rounded-lg border border-dashed border-white/12 text-metin-3 transition-colors hover:border-aksan/40 hover:text-white"
          style={{ left: kat.klipler.reduce((a, k) => Math.max(a, k.baslangic + klipSure(k)), 0) * zoom + 6 }}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}

      {/* SNAP ÇİZGİSİ — sürüklerken yapışılan noktayı gösterir (magnet) */}
      {snapX !== null && (
        <span className="pointer-events-none absolute inset-y-0 z-30 w-px bg-amber-300" style={{ left: snapX }}>
          <span className="absolute -left-[3px] top-0 h-1.5 w-1.5 rounded-full bg-amber-300" />
        </span>
      )}
    </div>
  );
}

/* ═══════════ KLİP DENETLEYİCİ (sağ panel) ═══════════ */

function KlipDenetleyici({ proje, klip }: { proje: MontajProje; klip: MontajKlip }) {
  const klipGuncelle = useMontaj((s) => s.klipGuncelle);
  const klipEfektToggle = useMontaj((s) => s.klipEfektToggle);
  const klipSil = useMontaj((s) => s.klipSil);
  const klipCogalt = useMontaj((s) => s.klipCogalt);
  const gorunen = klipSure(klip);
  const metinMi = klip.tur === "metin";
  const sesMi = klip.tur === "ses";
  const gorselMi = klip.tur === "video" || klip.tur === "gorsel";

  const gruplar: { g: "renk" | "stil" | "hareket"; ad: string }[] = [
    { g: "renk", ad: "Renk" }, { g: "stil", ad: "Stil" }, { g: "hareket", ad: "Hareket" },
  ];

  // Sekmeler — ses klibinde Renk/Hareket yok
  const sekmeler: { id: "ayar" | "renk" | "hareket"; ad: string; ik: typeof SlidersHorizontal }[] = [
    { id: "ayar", ad: "Ayar", ik: SlidersHorizontal },
    ...(gorselMi ? [{ id: "renk" as const, ad: "Renk", ik: Palette }] : []),
    ...(!sesMi ? [{ id: "hareket" as const, ad: "Hareket", ik: Maximize2 }] : []),
  ];
  const [sekme, setSekme] = useState<"ayar" | "renk" | "hareket">("ayar");
  // klip değişince sekmeyi güvenli tut
  useEffect(() => { if (!sekmeler.some((s) => s.id === sekme)) setSekme("ayar"); }, [klip.id]); // eslint-disable-line

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-white">{klip.ad}</p>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => klipCogalt(proje.id, klip.id)} title="Çoğalt"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-metin-2 hover:bg-white/8 hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={() => { klipSil(proje.id, klip.id); toast("Klip silindi"); }} title="Sil"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-metin-2 hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <p className="mb-3 text-[11.5px] text-metin-3">
        {klip.tur === "video" ? "Video" : klip.tur === "gorsel" ? "Görsel" : klip.tur === "ses" ? "Ses" : "Metin"} ·
        başlangıç {klip.baslangic.toFixed(1)}s · süre {gorunen.toFixed(1)}s
      </p>

      {/* SEKME ÇUBUĞU */}
      {sekmeler.length > 1 && (
        <div className="mb-4 flex gap-1 rounded-xl bg-white/[0.04] p-1">
          {sekmeler.map((s) => {
            const I = s.ik;
            return (
              <button key={s.id} onClick={() => setSekme(s.id)}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-semibold transition-colors",
                  sekme === s.id ? "bg-aksan text-zemin" : "text-metin-2 hover:text-white")}>
                <I className="h-3.5 w-3.5" /> {s.ad}
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ RENK SEKMESİ ═══ */}
      {sekme === "renk" && gorselMi && <RenkPaneli proje={proje} klip={klip} />}

      {/* ═══ HAREKET SEKMESİ (keyframe + speed-ramp) ═══ */}
      {sekme === "hareket" && !sesMi && <HareketPaneli proje={proje} klip={klip} />}

      {/* ═══ AYAR SEKMESİ (mevcut tüm alanlar) ═══ */}
      {sekme === "ayar" && <>

      {/* METİN klibi alanları */}
      {metinMi && (
        <>
          <Etiket>Metin</Etiket>
          <textarea value={klip.metin ?? ""} onChange={(e) => klipGuncelle(proje.id, klip.id, { metin: e.target.value })} rows={2}
            className="mb-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-aksan/50" />
          <Etiket>Boyut: {klip.metinBoyut}px</Etiket>
          <input type="range" min={16} max={96} value={klip.metinBoyut ?? 38}
            onChange={(e) => klipGuncelle(proje.id, klip.id, { metinBoyut: Number(e.target.value) })} className="kredi-slider mb-3 w-full" />
          <Etiket>Konum</Etiket>
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {(["ust", "orta", "alt"] as const).map((k) => (
              <button key={k} onClick={() => klipGuncelle(proje.id, klip.id, { metinKonum: k })}
                className={cn("rounded-lg py-1.5 text-[12px] font-medium transition-colors",
                  klip.metinKonum === k ? "bg-aksan text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>
                {k === "ust" ? "Üst" : k === "orta" ? "Orta" : "Alt"}</button>
            ))}
          </div>
          <Etiket>Renk</Etiket>
          <div className="mb-4 flex gap-1.5">
            {["#ffffff", "#55d6fd", "#ff2d6f", "#7cc0ff", "#111111"].map((c) => (
              <button key={c} onClick={() => klipGuncelle(proje.id, klip.id, { metinRenk: c })}
                className={cn("h-7 w-7 rounded-lg border-2 transition-transform hover:scale-110", klip.metinRenk === c ? "border-aksan" : "border-white/20")}
                style={{ background: c }} aria-label={c} />
            ))}
          </div>
        </>
      )}

      {/* KIRPMA */}
      {!metinMi && (
        <>
          <Etiket>Baştan kırp: {klip.basKirp.toFixed(1)}s</Etiket>
          <input type="range" min={0} max={Math.max(0.1, klip.sure - klip.sonKirp - 0.3)} step={0.1} value={klip.basKirp}
            onChange={(e) => klipGuncelle(proje.id, klip.id, { basKirp: Number(e.target.value) })} className="kredi-slider mb-3 w-full" />
          <Etiket>Sondan kırp: {klip.sonKirp.toFixed(1)}s</Etiket>
          <input type="range" min={0} max={Math.max(0.1, klip.sure - klip.basKirp - 0.3)} step={0.1} value={klip.sonKirp}
            onChange={(e) => klipGuncelle(proje.id, klip.id, { sonKirp: Number(e.target.value) })} className="kredi-slider mb-3 w-full" />
        </>
      )}

      {/* HIZ */}
      {!metinMi && (
        <>
          <Etiket><span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> Hız: {klip.hiz}×</span></Etiket>
          <div className="mb-3 grid grid-cols-5 gap-1">
            {[0.5, 0.75, 1, 1.5, 2].map((h) => (
              <button key={h} onClick={() => klipGuncelle(proje.id, klip.id, { hiz: h })}
                className={cn("rounded-lg py-1.5 text-[11.5px] font-semibold transition-colors",
                  klip.hiz === h ? "bg-aksan text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>{h}×</button>
            ))}
          </div>
        </>
      )}

      {/* SES + FADE */}
      {(sesMi || klip.tur === "video") && (
        <>
          <Etiket><span className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Ses: %{klip.sesDuzey}</span></Etiket>
          <input type="range" min={0} max={100} value={klip.sesDuzey}
            onChange={(e) => klipGuncelle(proje.id, klip.id, { sesDuzey: Number(e.target.value) })} className="kredi-slider mb-3 w-full" />
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[11px] text-metin-3">Giriş fade: {(klip.sesGiris ?? 0).toFixed(1)}s</p>
              <input type="range" min={0} max={Math.min(5, Math.max(0.5, gorunen / 2))} step={0.1} value={klip.sesGiris ?? 0}
                onChange={(e) => klipGuncelle(proje.id, klip.id, { sesGiris: Number(e.target.value) })} className="kredi-slider w-full" aria-label="Ses giriş fade" />
            </div>
            <div>
              <p className="mb-1 text-[11px] text-metin-3">Çıkış fade: {(klip.sesCikis ?? 0).toFixed(1)}s</p>
              <input type="range" min={0} max={Math.min(5, Math.max(0.5, gorunen / 2))} step={0.1} value={klip.sesCikis ?? 0}
                onChange={(e) => klipGuncelle(proje.id, klip.id, { sesCikis: Number(e.target.value) })} className="kredi-slider w-full" aria-label="Ses çıkış fade" />
            </div>
          </div>
        </>
      )}

      {/* OPAKLIK */}
      {!sesMi && (
        <>
          <Etiket>Opaklık: %{klip.opaklik}</Etiket>
          <input type="range" min={0} max={100} value={klip.opaklik}
            onChange={(e) => klipGuncelle(proje.id, klip.id, { opaklik: Number(e.target.value) })} className="kredi-slider mb-3 w-full" />
        </>
      )}

      {/* GEÇİŞ */}
      {!sesMi && (
        <>
          <Etiket>Giriş geçişi</Etiket>
          <select value={klip.gecis} onChange={(e) => klipGuncelle(proje.id, klip.id, { gecis: e.target.value as MontajGecis })}
            className="mb-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[13px] text-white outline-none focus:border-aksan/50">
            {(Object.keys(MONTAJ_GECIS_META) as MontajGecis[]).map((g) => (
              <option key={g} value={g} className="bg-[#151517]">{MONTAJ_GECIS_META[g].ad}</option>
            ))}
          </select>
          {klip.gecis !== "yok" && klip.gecis !== "kesme" && (
            <>
              <Etiket>Geçiş süresi: {klip.gecisSure.toFixed(1)}s</Etiket>
              <input type="range" min={0.1} max={2} step={0.1} value={klip.gecisSure}
                onChange={(e) => klipGuncelle(proje.id, klip.id, { gecisSure: Number(e.target.value) })} className="kredi-slider mb-3 w-full" />
            </>
          )}
        </>
      )}

      {/* EFEKTLER — stil + hareket presetleri (renk presetleri Renk sekmesinde) */}
      {klip.tur !== "ses" && klip.tur !== "metin" && (
        <div className="mt-2">
          {gruplar.filter((x) => x.g !== "renk").map(({ g, ad }) => {
            const liste = (Object.keys(MONTAJ_EFEKT_META) as MontajEfekt[]).filter((e) => MONTAJ_EFEKT_META[e].grup === g);
            return (
              <div key={g} className="mb-3">
                <Etiket><span className="flex items-center gap-1.5">
                  {g === "stil" ? <Sparkles className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />} {ad}
                </span></Etiket>
                <div className="flex flex-wrap gap-1.5">
                  {liste.map((e) => {
                    const aktif = klip.efektler.includes(e);
                    return (
                      <button key={e} onClick={() => klipEfektToggle(proje.id, klip.id, e)}
                        className={cn("rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                          aktif ? "bg-aksan text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>
                        {aktif && <Check className="mr-1 inline h-3 w-3" />}{MONTAJ_EFEKT_META[e].ad}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      </>}
    </div>
  );
}

/* ═══════════ RENK PANELİ — 6 slider canlı color grade ═══════════ */

function RenkPaneli({ proje, klip }: { proje: MontajProje; klip: MontajKlip }) {
  const renkAyarla = useMontaj((s) => s.renkAyarla);
  const renkSifirla = useMontaj((s) => s.renkSifirla);
  const klipEfektToggle = useMontaj((s) => s.klipEfektToggle);
  const r = klip.renk ?? bosRenk();

  const kaydiricilar: { k: keyof RenkAyar; ad: string; ik?: string }[] = [
    { k: "pozlama", ad: "Pozlama" },
    { k: "kontrast", ad: "Kontrast" },
    { k: "doygunluk", ad: "Doygunluk" },
    { k: "parlaklik", ad: "Parlaklık" },
    { k: "sicaklik", ad: "Sıcaklık" },
    { k: "tonlama", ad: "Tonlama" },
  ];

  // renk grade presetleri (efekt) — hızlı bakış
  const gradePresetler = (Object.keys(MONTAJ_EFEKT_META) as MontajEfekt[]).filter((e) => MONTAJ_EFEKT_META[e].grup === "renk");
  const degistiMi = Object.values(r).some((v) => v !== 0);

  return (
    <div>
      {/* preset LUT'lar */}
      <Etiket><span className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Renk paleti (LUT)</span></Etiket>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {gradePresetler.map((e) => {
          const aktif = klip.efektler.includes(e);
          return (
            <button key={e} onClick={() => klipEfektToggle(proje.id, klip.id, e)}
              className={cn("rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                aktif ? "bg-aksan text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>
              {aktif && <Check className="mr-1 inline h-3 w-3" />}{MONTAJ_EFEKT_META[e].ad}
            </button>
          );
        })}
      </div>

      {/* 6 kaydırıcı — canlı */}
      <div className="mb-2 flex items-center justify-between">
        <Etiket>Manuel düzeltme</Etiket>
        {degistiMi && (
          <button onClick={() => { renkSifirla(proje.id, klip.id); toast("Renk sıfırlandı"); }}
            className="flex items-center gap-1 text-[11px] font-medium text-metin-3 hover:text-white">
            <Undo2 className="h-3 w-3" /> Sıfırla
          </button>
        )}
      </div>
      {kaydiricilar.map(({ k, ad }) => (
        <div key={k} className="mb-2.5">
          <div className="mb-1 flex items-center justify-between text-[11.5px]">
            <span className="text-metin-2">{ad}</span>
            <span className={cn("tabular-nums", r[k] !== 0 ? "font-semibold text-aksan" : "text-metin-3")}>{r[k] > 0 ? "+" : ""}{r[k]}</span>
          </div>
          <input type="range" min={-100} max={100} value={r[k]}
            onChange={(e) => renkAyarla(proje.id, klip.id, { [k]: Number(e.target.value) })}
            className="kredi-slider w-full" aria-label={ad} />
        </div>
      ))}
      <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[11px] leading-relaxed text-metin-3">
        Tüm düzeltmeler önizlemede canlı uygulanır. LUT preset'leri manuel ayarların üstüne biner.
      </p>
    </div>
  );
}

/* ═══════════ HAREKET PANELİ — keyframe editörü + speed-ramp ═══════════ */

const KF_OZELLIK: { k: KfOzellik; ad: string; min: number; max: number; birim: string; taban: number }[] = [
  { k: "olcek", ad: "Ölçek", min: 20, max: 300, birim: "%", taban: 100 },
  { k: "x", ad: "Konum X", min: -100, max: 100, birim: "%", taban: 0 },
  { k: "y", ad: "Konum Y", min: -100, max: 100, birim: "%", taban: 0 },
  { k: "donme", ad: "Dönme", min: -180, max: 180, birim: "°", taban: 0 },
  { k: "opaklik", ad: "Opaklık", min: 0, max: 100, birim: "%", taban: 100 },
];

function HareketPaneli({ proje, klip }: { proje: MontajProje; klip: MontajKlip }) {
  const klipGuncelle = useMontaj((s) => s.klipGuncelle);
  const keyframeEkle = useMontaj((s) => s.keyframeEkle);
  const keyframeTemizle = useMontaj((s) => s.keyframeTemizle);
  const playhead = useMontaj((s) => s.playhead);
  const gorunen = klipSure(klip);
  // playhead'in klip-içi konumu (0..gorunen); klip dışındaysa clamp
  const yerel = Math.max(0, Math.min(gorunen, playhead - klip.baslangic));
  const icinde = playhead >= klip.baslangic && playhead < klip.baslangic + gorunen;

  return (
    <div>
      {/* SPEED RAMP */}
      <Etiket><span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> Hız rampası</span></Etiket>
      <div className="mb-1.5 grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[11px] text-metin-3">Başlangıç: {klip.hiz}×</p>
          <input type="range" min={0.25} max={4} step={0.25} value={klip.hiz}
            onChange={(e) => klipGuncelle(proje.id, klip.id, { hiz: Number(e.target.value) })}
            className="kredi-slider w-full" aria-label="Başlangıç hızı" />
        </div>
        <div>
          <p className="mb-1 text-[11px] text-metin-3">Bitiş: {klip.hizSonu ?? klip.hiz}×</p>
          <input type="range" min={0.25} max={4} step={0.25} value={klip.hizSonu ?? klip.hiz}
            onChange={(e) => klipGuncelle(proje.id, klip.id, { hizSonu: Number(e.target.value) })}
            className="kredi-slider w-full" aria-label="Bitiş hızı" />
        </div>
      </div>
      {(klip.hizSonu !== undefined && Math.abs((klip.hizSonu ?? klip.hiz) - klip.hiz) > 0.01) && (
        <button onClick={() => klipGuncelle(proje.id, klip.id, { hizSonu: undefined })}
          className="mb-3 flex items-center gap-1 text-[11px] font-medium text-metin-3 hover:text-white"><Undo2 className="h-3 w-3" /> Sabit hıza dön</button>
      )}
      <p className="mb-4 mt-1 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] text-metin-3">
        Başlangıç ≠ bitiş → klip boyunca hız yumuşakça değişir (ağır çekim / hızlanma).
      </p>

      {/* KEYFRAME EDİTÖRÜ */}
      <div className="mb-2 flex items-center justify-between">
        <Etiket><span className="flex items-center gap-1.5"><Diamond className="h-3.5 w-3.5" /> Anahtar kareler</span></Etiket>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", icinde ? "bg-aksan/15 text-aksan" : "bg-white/[0.05] text-metin-3")}>
          {icinde ? `${yerel.toFixed(1)}s` : "playhead klip dışında"}
        </span>
      </div>
      <div className="space-y-2.5">
        {KF_OZELLIK.map(({ k, ad, min, max, birim, taban }) => {
          const kfs = klip.keyframeler?.[k] ?? [];
          const anlik = kfAnlikDegerLocal(klip, k, yerel);
          return (
            <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-white">
                  {ad}
                  {kfs.length > 0 && <span className="rounded bg-aksan/15 px-1.5 text-[10px] font-bold text-aksan">{kfs.length}◆</span>}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => { if (!icinde) { toast.error("Playhead'i klibin üzerine getir"); return; } keyframeEkle(proje.id, klip.id, k, yerel); toast(`${ad} anahtarı eklendi ◆`); }}
                    title="Bu ana anahtar kare koy"
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-metin-2 transition-colors hover:bg-aksan hover:text-zemin"><Plus className="h-3.5 w-3.5" /></button>
                  {kfs.length > 0 && (
                    <button onClick={() => { keyframeTemizle(proje.id, klip.id, k); toast(`${ad} anahtarları temizlendi`); }}
                      title="Tüm anahtarları sil"
                      className="flex h-6 w-6 items-center justify-center rounded-md text-metin-3 hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                  )}
                </div>
              </div>
              {/* anlık değer slider'ı — keyframe yoksa taban değeri değiştirir */}
              <div className="flex items-center gap-2">
                <input type="range" min={min} max={max} value={Math.round(anlik)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (kfs.length > 0 && icinde) keyframeEkle(proje.id, klip.id, k, yerel); // önce anahtar oluştur
                    // taban özelliği güncelle (keyframe yoksa doğrudan etki eder)
                    const alan = k === "opaklik" ? "opaklik" : k === "olcek" ? "olcek" : k === "x" ? "konumX" : k === "y" ? "konumY" : "donme";
                    klipGuncelle(proje.id, klip.id, { [alan]: v } as Partial<MontajKlip>);
                  }}
                  className="kredi-slider flex-1" aria-label={ad} />
                <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-metin-2">{Math.round(anlik)}{birim}</span>
              </div>
              {/* keyframe zaman şeridi */}
              {kfs.length > 0 && (
                <div className="relative mt-2 h-4 rounded bg-white/[0.04]">
                  {kfs.map((kf, i) => (
                    <span key={i} title={`${kf.t.toFixed(1)}s → ${Math.round(kf.deger)}${birim}`}
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-aksan"
                      style={{ left: `${Math.min(100, Math.max(0, (kf.t / Math.max(0.1, gorunen)) * 100))}%` }} />
                  ))}
                  {/* playhead işareti */}
                  {icinde && <span className="absolute top-0 h-full w-px bg-white/60" style={{ left: `${(yerel / Math.max(0.1, gorunen)) * 100}%` }} />}
                  {void taban}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-[11px] leading-relaxed text-metin-3">
        Playhead'i taşı, değeri ayarla, <span className="text-aksan">＋</span> ile anahtar koy. İki anahtar arası yumuşak (ease) geçişle canlanır — pan, zoom, döndürme.
      </p>
    </div>
  );
}

/** kfAnlikDeger'in bileşen-içi kullanımı (store'dan re-export yerine yerel sarmalayıcı). */
function kfAnlikDegerLocal(k: MontajKlip, ozellik: KfOzellik, t: number): number {
  const kfs = k.keyframeler?.[ozellik];
  const taban = ozellik === "opaklik" ? (k.opaklik ?? 100) : ozellik === "olcek" ? (k.olcek ?? 100)
    : ozellik === "x" ? (k.konumX ?? 0) : ozellik === "y" ? (k.konumY ?? 0) : (k.donme ?? 0);
  if (!kfs || kfs.length === 0) return taban;
  if (t <= kfs[0].t) return kfs[0].deger;
  if (t >= kfs[kfs.length - 1].t) return kfs[kfs.length - 1].deger;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const oran = (t - a.t) / Math.max(0.001, b.t - a.t);
      const e = oran < 0.5 ? 2 * oran * oran : 1 - Math.pow(-2 * oran + 2, 2) / 2;
      return a.deger + (b.deger - a.deger) * e;
    }
  }
  return taban;
}

function Etiket({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[12px] font-semibold text-metin-2">{children}</p>;
}

function BosDenetleyici({ proje, onAyar }: { proje: MontajProje; onAyar: () => void }) {
  const klipSayi = proje.katmanlar.reduce((a, k) => a + k.klipler.length, 0);
  const toplam = montajToplamSure(proje);
  // Katman türü dağılımı — mini görsel özet
  const videoKlip = proje.katmanlar.filter((k) => k.tur === "video").reduce((a, k) => a + k.klipler.length, 0);
  const sesKlip = proje.katmanlar.filter((k) => k.tur === "ses").reduce((a, k) => a + k.klipler.length, 0);
  const metinKlip = proje.katmanlar.filter((k) => k.tur === "metin").reduce((a, k) => a + k.klipler.length, 0);

  return (
    <div>
      {/* yönlendirme kutusu — panelin en görünür yeri */}
      <div className="mb-4 rounded-2xl border border-aksan/20 bg-aksan/[0.06] p-3.5">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-white">
          <SlidersHorizontal className="h-4 w-4 text-aksan" /> Klip seç, ince ayar yap
        </p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-metin-2">
          Zaman çizelgesinden bir klibe tıkla — kırpma, hız, ses düzeyi, geçiş ve efektler burada açılır.
        </p>
      </div>

      {/* içerik dağılımı */}
      <p className="mb-2 text-[12px] font-semibold text-metin-2">İçerik</p>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { ad: "Video", n: videoKlip, ik: VideoIcon, renk: "text-aksan bg-aksan/12" },
          { ad: "Ses", n: sesKlip, ik: Music2, renk: "text-sky-300 bg-sky-400/12" },
          { ad: "Metin", n: metinKlip, ik: TypeIcon, renk: "text-fuchsia-300 bg-fuchsia-400/12" },
        ].map((k) => {
          const I = k.ik;
          return (
            <div key={k.ad} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
              <span className={cn("mx-auto flex h-7 w-7 items-center justify-center rounded-lg", k.renk)}><I className="h-3.5 w-3.5" /></span>
              <p className="mt-1.5 text-[16px] font-bold leading-none text-white">{k.n}</p>
              <p className="mt-0.5 text-[10px] text-metin-3">{k.ad}</p>
            </div>
          );
        })}
      </div>

      {/* proje künyesi */}
      <p className="mb-2 text-[12px] font-semibold text-metin-2">Proje</p>
      <div className="space-y-1.5">
        {[
          ["Toplam süre", sureBicim(toplam)],
          ["Klip · Katman", `${klipSayi} · ${proje.katmanlar.length}`],
          ["Format", `${proje.enBoy} · ${proje.cozunurluk}`],
          ["Kare hızı", `${proje.fps} fps`],
          ["Altyazı", proje.altyazi ? "Açık" : "Kapalı"],
        ].map(([a, d]) => (
          <div key={a} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <span className="text-[12px] text-metin-3">{a}</span>
            <span className="text-[12px] font-semibold text-white">{d}</span>
          </div>
        ))}
      </div>
      <button onClick={onAyar}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-[13px] font-medium text-white hover:bg-white/[0.07]">
        <Settings2 className="h-4 w-4" /> Çıktı ayarları
      </button>
    </div>
  );
}

/* ═══════════ AI ONAY MODALI — uygulamadan önce fark önizlemesi ═══════════ */

function AiOnayModal({ proje, komut, onUygula, onKapat }: {
  proje: MontajProje; komut: AiKomutId; onUygula: () => void; onKapat: () => void;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const meta = AI_KOMUT_META[komut];
  const on = aiOnizle(proje, komut);
  const suSure = montajToplamSure(proje);
  const sureFark = on.sonrakiSure - suSure;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        className="fixed left-1/2 top-1/2 z-[201] w-[min(94vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#151517] p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-aksan/12 text-aksan"><Wand2 className="h-5 w-5" /></span>
          <div>
            <h2 className="text-[17px] font-bold text-white">{meta.ad}</h2>
            <p className="text-[12px] text-metin-3">{meta.ozet}</p>
          </div>
        </div>

        {/* etki özeti */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[11px] text-metin-3">Etkilenen klip</p>
            <p className="mt-0.5 text-[18px] font-bold text-white">{on.etkilenen}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[11px] text-metin-3">Süre</p>
            <p className="mt-0.5 flex items-baseline gap-1.5 text-[15px] font-bold text-white">
              {sureBicim(suSure)}
              {Math.abs(sureFark) > 0.3 && <>
                <ChevronRight className="h-3 w-3 text-metin-3" />
                <span className="text-aksan">{sureBicim(on.sonrakiSure)}</span>
              </>}
            </p>
          </div>
        </div>

        {/* yapılacaklar */}
        <div className="mt-3 space-y-1.5">
          {/* key METİN OLAMAZ: `aiOnizle` aynı notu birden çok kez üretebiliyor
              (ör. "Süre değişmez") → React "two children with the same key"
              hatası veriyordu (ölçüldü: AI onay diyaloğu açılınca). Notlar
              sıralı ve sabit bir liste olduğu için indeks güvenli anahtardır. */}
          {on.notlar.map((n, i) => (
            <div key={`${i}-${n}`} className="flex items-center gap-2 text-[13px] text-metin-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-aksan" /> {n}
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2.5">
          <button onClick={onKapat} className="flex-1 rounded-xl border border-white/12 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.06]">Vazgeç</button>
          <button onClick={onUygula}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-aksan py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.02]">
            <Wand2 className="h-4 w-4" /> Uygula
          </button>
        </div>
        <p className="mt-2.5 text-center text-[11px] text-metin-3">Beğenmezsen ⌘Z ile tek adımda geri alabilirsin.</p>
      </motion.div>
    </>
  );
}

/* ═══════════ ÇIKTI AYARLARI MODALI ═══════════ */

function CiktiAyarModal({ proje, onKapat }: { proje: MontajProje; onKapat: () => void }) {
  const projeGuncelle = useMontaj((s) => s.projeGuncelle);
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        className="fixed left-1/2 top-1/2 z-[201] w-[min(94vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-[#151517] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-white"><Settings2 className="h-5 w-5 text-aksan" /> Çıktı ayarları</h2>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <Etiket>En-boy oranı</Etiket>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(["16:9", "9:16", "1:1"] as const).map((o) => (
            <button key={o} onClick={() => projeGuncelle(proje.id, { enBoy: o })}
              className={cn("rounded-xl border py-2.5 text-[13px] font-medium transition-colors",
                proje.enBoy === o ? "border-aksan/50 bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>{o}</button>
          ))}
        </div>

        <Etiket>Çözünürlük</Etiket>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(["720p", "1080p", "4K"] as const).map((c) => (
            <button key={c} onClick={() => projeGuncelle(proje.id, { cozunurluk: c })}
              className={cn("rounded-xl border py-2.5 text-[13px] font-medium transition-colors",
                proje.cozunurluk === c ? "border-aksan/50 bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>{c}</button>
          ))}
        </div>

        <Etiket>Kare hızı</Etiket>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {([24, 30, 60] as const).map((f) => (
            <button key={f} onClick={() => projeGuncelle(proje.id, { fps: f })}
              className={cn("rounded-xl border py-2.5 text-[13px] font-medium transition-colors",
                proje.fps === f ? "border-aksan/50 bg-aksan/10 text-aksan" : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]")}>{f} fps</button>
          ))}
        </div>

        <button onClick={() => projeGuncelle(proje.id, { altyazi: !proje.altyazi })}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-[13.5px] text-white"><Captions className="h-4 w-4 text-metin-2" /> Otomatik altyazı</span>
          <span className={cn("relative h-5 w-9 rounded-full transition-colors", proje.altyazi ? "bg-aksan" : "bg-white/15")}>
            <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", proje.altyazi ? "left-[18px]" : "left-0.5")} />
          </span>
        </button>

        <button onClick={onKapat} className="mt-5 w-full rounded-xl bg-aksan py-3 text-[14px] font-bold text-zemin hover:scale-[1.02]">Tamam</button>
      </motion.div>
    </>
  );
}

/* ═══════════ KLİP SEÇİCİ (kitaplıktan) ═══════════ */

function KlipSecici({ proje, katmanId, tur, onKapat }: {
  proje: MontajProje; katmanId: string; tur: KatmanTur; onKapat: () => void;
}) {
  const uretimler = useProjeler((s) => s.uretimler);
  const klipEkle = useMontaj((s) => s.klipEkle);
  const [metin, setMetin] = useState("");
  const [mod, setMod] = useState<"kitaplik" | "uret">("kitaplik");
  const [uretPrompt, setUretPrompt] = useState("");
  const [bekleyenId, setBekleyenId] = useState<string | null>(null);
  const eklendiRef = useRef(false);
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  // ── ÜRETİM HATTI: montajdan üret → tamamlanınca timeline'a OTOMATİK akıt ──
  const bekleyen = useMemo(() => uretimler.find((u) => u.id === bekleyenId) ?? null, [uretimler, bekleyenId]);
  useEffect(() => {
    if (!bekleyen || eklendiRef.current) return;
    if (bekleyen.durum === "tamam") {
      eklendiRef.current = true;
      const varsayilan = tur === "ses" ? 15 : bekleyen.tur === "video" ? 8 : 4;
      klipEkle(proje.id, katmanId, {
        kaynakId: bekleyen.id, ad: bekleyen.baslik,
        tur: tur === "ses" ? "ses" : bekleyen.tur === "video" ? "video" : "gorsel",
        sure: bekleyen.tur === "gorsel" ? 4 : varsayilan,
        gorselUrl: bekleyen.gorselUrl ?? bekleyen.videoUrl ?? bekleyen.thumbnailUrl,
        sesUrl: tur === "ses" ? bekleyen.sesUrl : bekleyen.videoUrl,
      });
      toast.success("Üretim tamamlandı → timeline'a eklendi 🎬");
      onKapat();
    } else if (bekleyen.durum === "hata") {
      toast.error("Üretim başarısız oldu");
      setBekleyenId(null);
    }
  }, [bekleyen, tur, proje.id, katmanId, klipEkle, onKapat]);

  // Katman türüne göre uygun üretimler
  const uygun = useMemo(() => uretimler.filter((u) => {
    if (u.durum !== "tamam") return false;
    if (tur === "ses") return u.tur === "ses" || u.tur === "muzik";
    return u.tur === "video" || u.tur === "gorsel";
  }), [uretimler, tur]);

  // Üretimin GERÇEK süresini meta'dan çöz ("0:15", "15sn", "1:05" → saniye).
  // Yoksa türüne göre makul bir varsayılana düş. (Eleştiri #8 düzeltmesi.)
  const metaSure = (m?: { sure?: string }, varsayilan = 8): number => {
    const s = m?.sure?.trim();
    if (!s) return varsayilan;
    const mm = s.match(/^(\d+):(\d{1,2})$/);           // 0:15 / 1:05
    if (mm) return parseInt(mm[1]) * 60 + parseInt(mm[2]);
    const sn = s.match(/(\d+(?:\.\d+)?)\s*(?:sn|s|sec)?/i); // 15sn / 8s
    return sn ? Math.max(0.5, parseFloat(sn[1])) : varsayilan;
  };

  const ekle = (u: typeof uretimler[number]) => {
    const varsayilan = tur === "ses" ? 15 : u.tur === "video" ? 8 : 4;
    klipEkle(proje.id, katmanId, {
      kaynakId: u.id, ad: u.baslik,
      tur: tur === "ses" ? "ses" : u.tur === "video" ? "video" : "gorsel",
      // Görsel klip zamansızdır → 4sn sabit; video/ses gerçek süresini kullan.
      sure: u.tur === "gorsel" ? 4 : metaSure(u.meta, varsayilan),
      gorselUrl: u.gorselUrl ?? u.videoUrl ?? u.thumbnailUrl,
      // GERÇEK ses kaynağı: ses klibi → sesUrl; video klibi → videoUrl (sesi çıkarılır)
      sesUrl: tur === "ses" ? u.sesUrl : u.videoUrl,
    });
    toast.success(`"${u.baslik}" eklendi`);
  };

  const metinEkle = () => {
    if (!metin.trim()) { toast.error("Metin yaz"); return; }
    klipEkle(proje.id, katmanId, { ad: metin.slice(0, 24), tur: "metin", metin: metin.trim(), sure: 4 });
    toast.success("Metin klibi eklendi");
    setMetin("");
    onKapat();
  };

  // Montajın içinden GERÇEK üretim başlat (görsel/video/ses) → bekleyene bağla
  const uret = () => {
    if (!uretPrompt.trim()) { toast.error("Ne üreteceğini yaz"); return; }
    const uTur = tur === "ses" ? "ses" : "video";
    const model = tur === "ses" ? "ElevenLabs v3" : "Kling 3.0";
    const sonuc = uretimBaslat({
      baslik: uretPrompt.slice(0, 40), tur: uTur as "video" | "ses", model,
      prompt: uretPrompt.trim(), kredi: tur === "ses" ? 8 : 42, arac: "Montaj Stüdyosu",
      meta: { oran: proje.enBoy, cozunurluk: proje.cozunurluk },
    });
    if (!sonuc.ok) { uretimHataToast(sonuc); return; }
    if (sonuc.id) { setBekleyenId(sonuc.id); eklendiRef.current = false; }
    toast.success("Üretim başladı — tamamlanınca timeline'a düşecek ⏳");
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        className="fixed left-1/2 top-1/2 z-[201] flex h-[80vh] w-[min(94vw,860px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#151517] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-white">
            {tur === "ses" ? <Music2 className="h-5 w-5 text-sky-300" /> : tur === "metin" ? <TypeIcon className="h-5 w-5 text-fuchsia-300" /> : <Clapperboard className="h-5 w-5 text-aksan" />}
            {tur === "ses" ? "Ses / müzik ekle" : tur === "metin" ? "Metin klibi ekle" : "Kitaplığından klip ekle"}
          </h2>
          <button onClick={onKapat} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* KİTAPLIK | ÜRET sekmesi (metin hariç) */}
        {tur !== "metin" && (
          <div className="flex gap-1 border-b border-white/[0.06] px-6 py-2">
            {([["kitaplik", "Kitaplığından seç", Clapperboard], ["uret", "Montajdan üret", Sparkles]] as const).map(([id, ad, Ik]) => (
              <button key={id} onClick={() => setMod(id)}
                className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  mod === id ? "bg-aksan text-zemin" : "text-metin-2 hover:text-white")}>
                <Ik className="h-3.5 w-3.5" /> {ad}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {tur !== "metin" && mod === "uret" ? (
            <div className="mx-auto max-w-lg">
              <Etiket><span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-aksan" /> {tur === "ses" ? "Ses / müzik üret" : "Video / görsel üret"}</span></Etiket>
              <textarea value={uretPrompt} onChange={(e) => setUretPrompt(e.target.value)} rows={3} autoFocus
                disabled={!!bekleyen && bekleyen.durum !== "tamam"}
                placeholder={tur === "ses" ? "Örn: gerilimli sinematik yaylılar, yavaş nabız…" : "Örn: gün batımında sahilde koşan bir figür, sinematik…"}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50 disabled:opacity-50" />
              {bekleyen && bekleyen.durum !== "tamam" ? (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-aksan/25 bg-aksan/[0.06] py-3 text-[14px] font-semibold text-aksan">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-aksan/40 border-t-aksan" />
                  Üretiliyor… tamamlanınca otomatik eklenecek
                </div>
              ) : (
                <button onClick={uret}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-3 text-[14px] font-bold text-zemin transition-transform hover:scale-[1.01]">
                  <Sparkles className="h-4 w-4" /> Üret ve timeline'a ekle
                </button>
              )}
              <p className="mt-3 text-center text-[12px] text-metin-3">Üretim gerçek modelle yapılır; bitince bu montajın {tur === "ses" ? "ses" : "video"} katmanına düşer.</p>
            </div>
          ) : tur === "metin" ? (
            <div className="mx-auto max-w-lg">
              <Etiket>Ekrana yazılacak metin</Etiket>
              <textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={3} autoFocus
                placeholder="Örn: Yeni koleksiyon — şimdi keşfet"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white outline-none placeholder:text-metin-3 focus:border-aksan/50" />
              <button onClick={metinEkle} className="mt-3 w-full rounded-xl bg-aksan py-3 text-[14px] font-bold text-zemin hover:scale-[1.01]">Metin klibi ekle</button>
              <p className="mt-3 text-center text-[12px] text-metin-3">Eklendikten sonra sağ panelden boyut, renk ve konumu ayarlayabilirsin.</p>
            </div>
          ) : uygun.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-metin-3">
              {tur === "ses" ? <Music2 className="h-10 w-10" /> : <Film className="h-10 w-10" />}
              <p>{tur === "ses" ? "Henüz ses/müzik üretimin yok." : "Henüz montajlanacak video/görsel üretimin yok."}</p>
              <button onClick={() => setMod("uret")}
                className="mt-1 flex items-center gap-2 rounded-xl bg-aksan px-4 py-2.5 text-[13.5px] font-bold text-zemin transition-transform hover:scale-[1.03]">
                <Sparkles className="h-4 w-4" /> Buradan hemen üret
              </button>
              <p className="text-[12px]">…ya da Görsel / Video / Ses Stüdyosu'ndan üret, sonra buraya gel.</p>
            </div>
          ) : (
            <div className={cn("grid gap-3", tur === "ses" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
              {uygun.map((u) => {
                if (tur === "ses") {
                  return (
                    <button key={u.id} onClick={() => ekle(u)}
                      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:border-sky-400/40 hover:bg-sky-400/[0.06]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300"><AudioLines className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-white">{u.baslik}</span>
                        <span className="block text-[11.5px] text-metin-3">{u.model} · {u.meta?.sure ?? "0:15"}</span>
                      </span>
                      <Plus className="h-4 w-4 shrink-0 text-metin-3 group-hover:text-sky-300" />
                    </button>
                  );
                }
                const arka = arkaPlan(u);
                return (
                  <button key={u.id} onClick={() => ekle(u)} className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 text-left" style={{ background: arka }}>
                    {(() => { const url = saltUrl(arka); return url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null; })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-aksan text-zemin"><Plus className="h-5 w-5" /></span>
                    </span>
                    <span className="absolute bottom-1.5 left-2 right-2 truncate text-[12px] font-medium text-white">{u.baslik}</span>
                    <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium uppercase text-white">{u.tur}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
