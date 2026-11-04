"use client";

/* Sahne şeridi: seçilen çekimler sırayla oynar (kare 3 sn hafif yakınlaşmayla, video kendi
   süresiyle). Altta sürükleyerek sıralanan film şeridi; sahneler arası geçiş, ad değiştirme,
   montaja aktarma. Ardışık iki çekim "son kareden devam" ile bağlıysa aradaki bağ gösterilir. */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  Clapperboard, Download, FastForward, FileText, Rewind, Film, GripVertical, Image as ImageIcon, Link2, ListPlus, Pause, Pencil, Play, Plus, Repeat, Scissors, SkipBack, SkipForward, Trash2, X,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { Uretim } from "@/store/useProjeler";
import { useMontaj, type MontajKlip, type MontajOran } from "@/store/useMontaj";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { MarkaKare } from "@/components/studyo/hf";
import { useSahne } from "./useSahne";

const KARE_SN = 3;
export const cekimSn = (u: Uretim) => (u.tur === "video" ? parseInt(u.meta?.sure ?? "", 10) || 8 : KARE_SN);
const sureYaz = (sn: number) => `${Math.floor(sn / 60)}:${String(Math.round(sn % 60)).padStart(2, "0")}`;

/** Sahneyi montaj projesine çevirir: görüntü katmanı (video ya da yavaş yakınlaşan kare) + başlık. */
export function sahneMontaj(ad: string, l: Uretim[]): string {
  let t = 0;
  const klipler: MontajKlip[] = l.map((u, i) => {
    const sure = cekimSn(u);
    const k: MontajKlip = {
      id: `kl_${Date.now().toString(36)}${i}`, kaynakId: u.id, ad: u.baslik || `Çekim ${i + 1}`, tur: u.tur === "video" ? "video" : "gorsel",
      baslangic: t, sure, basKirp: 0, sonKirp: 0, hiz: 1, sesDuzey: u.tur === "video" ? 100 : 0, opaklik: 100,
      efektler: u.tur === "video" ? [] : ["yakinlas"], gecis: i ? "fade" : "yok", gecisSure: 0.4,
      ...(u.tur === "video" ? { videoUrl: u.videoUrl, sesUrl: u.videoUrl } : {}), gorselUrl: saltUrl(u.gorselUrl),
    };
    t += sure;
    return k;
  });
  const oran = (["16:9", "9:16", "1:1", "4:5"] as MontajOran[]).includes(l[0]?.meta?.oran as MontajOran) ? (l[0].meta!.oran as MontajOran) : "16:9";
  const m = useMontaj.getState();
  const kat = (tur: "video" | "ses" | "metin", ad2: string, k: MontajKlip[]) => ({ id: `kat_${tur}_${Date.now().toString(36)}`, tur, ad: ad2, klipler: k, sessiz: false, kilitli: false, gizli: false });
  return m.projeOlustur({ ad, enBoy: oran, katmanlar: [kat("metin", "Yazılar", []), kat("video", "Çekimler", klipler), kat("ses", "Müzik", [])] });
}

export function SahneSeridi({ uretimler, onPanoCanlandir, panoBilgi, onAc, onDevam, onOncesi, onKopru, onCanlandir, onCekimlereGit, onMontaj, onIndir }: {
  uretimler: Uretim[];
  onAc: (u: Uretim) => void;
  onDevam: (u: Uretim) => void;
  onOncesi?: (u: Uretim) => void;
  onKopru?: (a: Uretim, b: Uretim) => void;
  onCanlandir: (u: Uretim) => void;
  onCekimlereGit: () => void;
  onMontaj: (montajId: string) => void;
  onIndir: (l: Uretim[]) => void;
  /** Sahnedeki anahtar kareleri toplu videoya çevirir. */
  onPanoCanlandir?: (kareler: Uretim[]) => void;
  panoBilgi?: { model: string; sure: number; birim: number; demo: boolean };
}) {
  const { sahneler, aktifId, sec, yeni, adDegis, sil, cikar, sirala, ekle } = useSahne();
  const sahne = sahneler.find((s) => s.id === aktifId) ?? sahneler[0];
  const harita = useMemo(() => new Map(uretimler.map((u) => [u.id, u])), [uretimler]);
  /** Silinmiş ya da henüz bitmemiş üretimler oynatılmaz; sırada olanlar şeritte bekler. */
  const cekimler = useMemo(() => sahne.cekimler.map((id) => harita.get(id)).filter((u): u is Uretim => !!u), [sahne.cekimler, harita]);
  const oynar = useMemo(() => cekimler.filter((u) => u.durum === "tamam"), [cekimler]);
  const [panoAcik, setPanoAcik] = useState(false);
  const panoKareler = useMemo(() => cekimler.filter((u) => u.tur !== "video" && u.durum === "tamam" && saltUrl(u.gorselUrl)), [cekimler]);
  const sonCekimler = useMemo(() => uretimler.filter((u) => u.arac === "Sinema Stüdyosu" && u.durum === "tamam" && !u.id.startsWith("seed_") && saltUrl(u.gorselUrl) && !sahne.cekimler.includes(u.id)).slice(0, 5), [uretimler, sahne.cekimler]);
  const toplam = oynar.reduce((n, u) => n + cekimSn(u), 0);

  const [i, setI] = useState(0);
  const [oynuyor, setOynuyor] = useState(false);
  const [dongu, setDongu] = useState(false);
  const [gecen, setGecen] = useState(0); // aktif çekimde geçen süre
  const [adDuzen, setAdDuzen] = useState(false);
  const [ad, setAd] = useState(sahne.ad);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { setAd(sahne.ad); setI(0); setGecen(0); setOynuyor(false); }, [sahne.id, sahne.ad]);
  useEffect(() => { if (i >= oynar.length) setI(Math.max(0, oynar.length - 1)); }, [i, oynar.length]);
  const aktif = oynar[i];

  const sonraki = () => {
    if (i + 1 < oynar.length) { setI(i + 1); setGecen(0); }
    else if (dongu && oynar.length) { setI(0); setGecen(0); }
    else { setOynuyor(false); setGecen(0); }
  };
  // Kare zamanlayıcısı (video kendi olaylarıyla ilerler).
  useEffect(() => {
    if (!oynuyor || !aktif || aktif.tur === "video") return;
    const bas = performance.now() - gecen * 1000;
    let r = 0;
    const tik = () => {
      const g = (performance.now() - bas) / 1000;
      if (g >= KARE_SN) { sonraki(); return; }
      setGecen(g); r = requestAnimationFrame(tik);
    };
    r = requestAnimationFrame(tik);
    return () => cancelAnimationFrame(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oynuyor, aktif?.id]);
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (oynuyor) void v.play().catch(() => setOynuyor(false)); else v.pause();
  }, [oynuyor, aktif?.id]);

  const onceki = oynar.slice(0, i).reduce((n, u) => n + cekimSn(u), 0);
  const zaman = onceki + gecen;
  const git = (j: number) => { setI(j); setGecen(0); };

  /** Çekim listesi: sıra, zaman kodu, süre, tür, model, kurulum ve istem; tabloya açılır (CSV). */
  const listeIndir = () => {
    if (!cekimler.length) return void toast.error("Sahnede çekim yok", { description: "Çekim listesi için önce sahneye çekim ekle." });
    const h = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    let t = 0;
    const satirlar = cekimler.map((u, j) => {
      const sn = cekimSn(u), bas = sureYaz(t); t += sn;
      const k = u.meta?.kurulum as Record<string, unknown> | undefined;
      const kur = k ? Object.entries(k).filter(([, v]) => typeof v === "string" && v && v !== "oto").map(([a, v]) => `${a}: ${v}`).join("; ") : "";
      return [j + 1, bas, sn, u.tur === "video" ? "Video" : "Kare", u.model, u.meta?.hareket ?? "", kur, u.baslik, (u.meta?.hamIstem as string | undefined) ?? u.prompt].map(h).join(";");
    });
    const csv = "\uFEFF" + [["Sıra", "Başlangıç", "Süre (sn)", "Tür", "Model", "Kamera hareketi", "Kurulum", "Başlık", "İstem"].map(h).join(";"), ...satirlar].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${sahne.ad.replace(/[\\/:*?"<>|]+/g, "-")}-cekim-listesi.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast.success("Çekim listesi indirildi", { description: `${cekimler.length} çekim, toplam ${sureYaz(t)}. Excel ya da Sheets ile açılır.` });
  };
  const montaj = () => {
    if (!oynar.length) return void toast.error("Sahnede hazır çekim yok", { description: "Montaja aktarmak için sahneye tamamlanmış bir çekim ekle." });
    const id = sahneMontaj(sahne.ad, oynar);
    toast.success("Sahne montaja aktarıldı", { description: `${oynar.length} çekim, toplam ${sureYaz(toplam)}. Montaj Stüdyosu'nda düzenleyebilirsin.` });
    onMontaj(id);
  };

  /* ── Sahne seçici ── */
  const ust = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="gizli-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {sahneler.map((s) => {
          const a = s.id === sahne.id;
          return (
            <button key={s.id} onClick={() => sec(s.id)} aria-pressed={a}
              className={cn("flex h-9 shrink-0 items-center gap-2 rounded-full pl-3.5 pr-2.5 text-[13px] font-medium transition-colors", a ? "bg-white text-[#0a0a0b]" : "bg-white/[0.05] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.09] hover:text-metin")}>
              {s.ad}<span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", a ? "bg-black/10" : "bg-white/[0.07] text-metin-3")}>{s.cekimler.length}</span>
            </button>
          );
        })}
        <button onClick={() => { yeni(); toast.success("Yeni sahne açıldı", { description: "Çekimlerinden ekleyerek doldurabilirsin." }); }} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08] hover:text-metin">
          <Plus className="h-3.5 w-3.5" />Yeni sahne
        </button>
      </div>
    </div>
  );

  if (!cekimler.length) {
    return (
      <div className="mx-auto max-w-[1180px] px-6 pt-2">
        {ust}
        <div className="mt-6 grid items-center gap-8 rounded-[24px] bg-white/[0.02] p-8 ring-1 ring-inset ring-white/[0.06] md:grid-cols-[1fr_1.1fr]">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-metin ring-1 ring-inset ring-white/30"><Film className="h-5 w-5" /></span>
            <p className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-metin">{sahne.ad} boş</p>
            <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-metin-2">Çekimlerinin üzerindeki <span className="inline-flex translate-y-[3px] items-center rounded-md bg-white/[0.08] p-0.5"><ListPlus className="h-3.5 w-3.5" /></span> düğmesiyle kareleri ve videoları buraya ekle. Sırayı sürükleyerek değiştir, sahneyi baştan sona izle, hazır olunca montaja aktar.</p>
            <button onClick={onCekimlereGit} className="mt-5 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0a0a0b] transition-transform hover:-translate-y-px"><Clapperboard className="h-4 w-4" />Çekimlerime git</button>
          </div>
          {/* Boş şerit önizlemesi */}
          <div className="relative">
            <div className="flex gap-2.5">
              {[0, 1, 2].map((k) => (
                <div key={k} className="relative aspect-video flex-1 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.08]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={["/gercek/sinema/sh-open.webp", "/gercek/sinema/sh-hero.webp", "/gercek/sinema/sh-tension.webp"][k]} alt="" className="h-full w-full object-cover opacity-50 grayscale-[40%]" />
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 text-[10.5px] font-bold tabular-nums text-white">{k + 1}</span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex h-2 gap-1">{[3, 5, 4].map((w, k) => <span key={k} className="rounded-full bg-white/[0.08]" style={{ flex: w }} />)}</div>
          </div>
        </div>
        {sonCekimler.length > 0 ? (
          <section className="mt-4 overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-metin"><ListPlus className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 text-[14px] font-semibold text-metin">Son çekimlerinden ekle</span>
              <button onClick={() => { sonCekimler.forEach((u) => ekle(u.id, sahne.id)); toast.success(`${sonCekimler.length} çekim eklendi`, { description: "Sürükleyerek sırala, sonra baştan sona izle." }); }}
                className="rounded-full bg-white/[0.07] px-3 py-1.5 text-[12.5px] font-medium text-metin transition-colors hover:bg-white/[0.12] active:scale-95">Hepsini ekle</button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-6">
              {sonCekimler.map((u) => (
                <button key={u.id} onClick={() => { ekle(u.id, sahne.id); toast.success("Sahneye eklendi", { description: u.baslik || "Çekim" }); }} className="group text-left">
                  <span className="relative block aspect-video overflow-hidden rounded-[12px] bg-black ring-1 ring-inset ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={saltUrl(u.gorselUrl)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"><span className="flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-[#0a0a0b]"><Plus className="h-3.5 w-3.5" />Ekle</span></span>
                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">{u.tur === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{cekimSn(u)} sn</span>
                  </span>
                  <span className="mt-1.5 block line-clamp-2 text-[12px] leading-snug font-medium text-metin-2">{u.baslik || "Çekim"}</span>
                </button>
              ))}
              <button onClick={onCekimlereGit} className="group text-left">
                <span className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-[12px] bg-white/[0.03] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors group-hover:bg-white/[0.06] group-hover:text-metin"><Clapperboard className="h-4 w-4" /><span className="text-[12px] font-medium">Yeni çekim yap</span></span>
                <span className="mt-1.5 block text-[12px] text-metin-3">Çekimlerim sayfasında</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-4 grid gap-3 sm:grid-cols-3">
            {([[ListPlus, "Ekle", "Kareleri ve videoları sahneye at"], [GripVertical, "Sırala", "Sürükleyerek kurguyu kur"], [Scissors, "Montaja aktar", "Müzik ve yazıyla bitir"]] as const).map(([I, a, n], k) => (
              <div key={a} className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11.5px] font-bold text-[#0a0a0b]">{k + 1}</span><span className="text-[14px] font-semibold text-metin">{a}</span></div>
                <p className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-metin-2"><I className="h-4 w-4 shrink-0 text-metin" />{n}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 pt-2">
      {ust}

      {/* Başlık satırı */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {adDuzen ? (
          <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} onBlur={() => { adDegis(sahne.id, ad); setAdDuzen(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setAd(sahne.ad); setAdDuzen(false); } }}
            className="min-w-0 rounded-lg bg-white/[0.05] px-2 py-1 text-[20px] font-semibold tracking-[-0.02em] text-metin outline-none ring-1 ring-white/30" />
        ) : (
          <button onClick={() => setAdDuzen(true)} className="group flex items-center gap-2 text-[20px] font-semibold tracking-[-0.02em] text-metin">
            {sahne.ad}<Pencil className="h-3.5 w-3.5 text-metin-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
        <span className="text-[13px] tabular-nums text-metin-3">{cekimler.length} çekim · {sureYaz(toplam)}</span>
        <span className="flex-1" />
        <Tooltip label="Sahneyi sil" side="top">
          <button onClick={() => { const eski = sahne; const sira = useSahne.getState().sahneler.findIndex((x) => x.id === eski.id); sil(eski.id); toast(`${eski.ad} silindi`, { description: "Çekimler silinmedi, Çekimlerim'de duruyor.", action: { label: "Geri al", onClick: () => useSahne.setState((d) => { const l = d.sahneler.filter((x) => x.id !== eski.id); l.splice(Math.max(0, sira), 0, eski); return { sahneler: l, aktifId: eski.id }; }) } }); }} aria-label="Sahneyi sil"
            className="flex h-9 w-9 items-center justify-center rounded-full text-metin-3 ring-1 ring-inset ring-white/[0.07] transition-colors hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
        </Tooltip>
        {onPanoCanlandir && panoBilgi && panoKareler.length > 0 && (
          <div className="relative">
            <button onClick={() => setPanoAcik((v) => !v)} aria-expanded={panoAcik} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.09]">
              <Clapperboard className="h-4 w-4" />Kareleri canlandır<span className="rounded-full bg-white/[0.1] px-1.5 text-[11.5px] tabular-nums text-metin-2">{panoKareler.length}</span>
            </button>
            <Yuzen acik={panoAcik} onKapat={() => setPanoAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="pano" className="w-[min(340px,calc(100vw-24px))] rounded-[18px] border border-white/[0.08] bg-[#151517] p-2">
              <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="flex-1 text-[13px] font-semibold text-metin">Panoyu canlandır</span><span className="text-[11.5px] tabular-nums text-metin-3">{panoKareler.length} kare</span></div>
                <div className="grid grid-cols-4 gap-1.5 p-2">
                  {panoKareler.slice(0, 8).map((u, j) => (
                    <span key={u.id} className="relative aspect-video overflow-hidden rounded-[8px] ring-1 ring-inset ring-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={saltUrl(u.gorselUrl)} alt="" className="h-full w-full object-cover" />
                      <span className="absolute left-1 top-1 rounded bg-black/65 px-1 text-[9.5px] font-bold tabular-nums text-white">{j + 1}</span>
                    </span>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-white/[0.06] px-3 py-2.5 text-[12.5px]">
                  <p className="flex items-center justify-between"><span className="text-metin-3">Model</span><span className="flex items-center gap-1.5 font-medium text-metin"><span className="[&>span]:!h-4 [&>span]:!w-4 [&>span]:!rounded"><MarkaKare ad={panoBilgi.model} boyut={16} /></span>{panoBilgi.model}</span></p>
                  {panoBilgi.sure > 0 && <p className="flex items-center justify-between"><span className="text-metin-3">Her çekim</span><span className="font-medium tabular-nums text-metin">{panoBilgi.sure} sn</span></p>}
                  <p className="flex items-center justify-between"><span className="text-metin-3">Toplam</span><span className="flex items-center gap-1 font-medium tabular-nums text-metin">{panoBilgi.demo ? "Kredi düşmez" : panoBilgi.birim ? <><KrediYildiz className="h-3 w-3" />{panoBilgi.birim * panoKareler.length}</> : "Sınırsız erişim"}</span></p>
                </div>
                <p className="border-t border-white/[0.06] px-3 py-2 text-[12px] leading-snug text-metin-2">Her kare kendi istemi ve kurulumuyla videoya döner; videolar sahnede karelerin yerine geçer. Model ve süreyi yönetmen kutusundan değiştirebilirsin.</p>
              </div>
              <button onClick={() => { setPanoAcik(false); onPanoCanlandir(panoKareler); }} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[13.5px] font-semibold text-[#0a0a0b] transition active:scale-[0.98]">
                <Clapperboard className="h-4 w-4" />{panoKareler.length} kareyi canlandır
              </button>
            </Yuzen>
          </div>
        )}
        <button onClick={listeIndir} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.09]"><FileText className="h-4 w-4" />Çekim listesi</button>
        <button onClick={() => onIndir(oynar)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.09]"><Download className="h-4 w-4" />Çekimleri indir</button>
        <button onClick={montaj} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0a0a0b] transition-transform hover:-translate-y-px"><Scissors className="h-4 w-4" />Montaja aktar</button>
      </div>

      {/* Oynatıcı */}
      <div className="mt-4 overflow-hidden rounded-[22px] bg-black ring-1 ring-inset ring-white/[0.08]">
        <div className="relative mx-auto h-[clamp(200px,calc(100vh-560px),520px)] w-full max-md:h-auto max-md:aspect-video">
          <AnimatePresence mode="sync">
            {aktif && (
              <motion.div key={aktif.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
                {aktif.tur === "video" && aktif.videoUrl ? (
                  <video ref={videoRef} src={aktif.videoUrl} poster={saltUrl(aktif.gorselUrl)} playsInline className="absolute inset-0 h-full w-full object-contain"
                    onTimeUpdate={(e) => setGecen(e.currentTarget.currentTime)} onEnded={sonraki} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <motion.img src={saltUrl(aktif.gorselUrl)} alt="" className="absolute inset-0 h-full w-full object-contain"
                    initial={false} animate={{ scale: oynuyor ? 1.06 : 1 }} transition={{ duration: oynuyor ? KARE_SN : 0.3, ease: "linear" }} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {!oynuyor && (
            <button onClick={() => setOynuyor(true)} aria-label="Sahneyi oynat" className="group absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#0a0a0b] transition-transform group-hover:scale-105"><Play className="h-6 w-6 translate-x-0.5 fill-current" /></span>
            </button>
          )}
          {aktif && (
            <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur">
              {aktif.tur === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}Çekim {i + 1} / {oynar.length}<span className="text-white/60 max-md:hidden">· {aktif.baslik}</span>
            </span>
          )}
        </div>
        {/* Taşıyıcı */}
        <div className="flex items-center gap-3 border-t border-white/[0.06] bg-[#0e0e10] px-3 py-2.5">
          <button onClick={() => git(Math.max(0, i - 1))} aria-label="Önceki çekim" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.06] hover:text-metin"><SkipBack className="h-4 w-4" /></button>
          <button onClick={() => setOynuyor((v) => !v)} aria-label={oynuyor ? "Duraklat" : "Oynat"} className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0a0a0b]">{oynuyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-px fill-current" />}</button>
          <button onClick={() => git(Math.min(oynar.length - 1, i + 1))} aria-label="Sonraki çekim" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.06] hover:text-metin"><SkipForward className="h-4 w-4" /></button>
          <span className="w-[84px] shrink-0 text-[12px] tabular-nums text-metin-2">{sureYaz(zaman)} / {sureYaz(toplam)}</span>
          {/* Çekim çekim ilerleme */}
          <div className="flex h-7 min-w-0 flex-1 items-center gap-[3px]">
            {oynar.map((u, j) => {
              const sn = cekimSn(u), dolu = j < i ? 1 : j === i ? Math.min(1, gecen / sn) : 0;
              return (
                <button key={u.id} onClick={() => git(j)} aria-label={`Çekim ${j + 1}`} className="group relative h-full" style={{ flex: sn }}>
                  <span className={cn("absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 overflow-hidden rounded-full transition-[height]", j === i ? "bg-white/20" : "bg-white/[0.1] group-hover:h-[7px]")}>
                    <span className="block h-full rounded-full bg-white" style={{ width: `${dolu * 100}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
          <Tooltip label={dongu ? "Döngü açık" : "Döngü"} side="top">
            <button onClick={() => setDongu((v) => !v)} aria-pressed={dongu} aria-label="Döngü" className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", dongu ? "bg-white/[0.08] text-metin" : "text-metin-3 hover:bg-white/[0.06] hover:text-metin")}><Repeat className="h-4 w-4" /></button>
          </Tooltip>
        </div>
      </div>

      {/* Film şeridi */}
      <section className="mb-6 mt-5 overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-white/[0.06] px-4 py-3">
        <p className="text-[14px] font-semibold text-metin">Çekim sırası</p>
        <p className="text-[12px] text-metin-3">Sürükleyerek sırala; aradaki artıyla iki videoyu köprüle</p>
      </div>
      <Reorder.Group axis="x" values={sahne.cekimler} onReorder={(l) => sirala(l, sahne.id)} className="gizli-scroll flex gap-3 overflow-x-auto p-4 pb-3">
        {sahne.cekimler.map((id, j) => {
          const u = harita.get(id);
          if (!u) return null;
          const onc = j > 0 ? harita.get(sahne.cekimler[j - 1]) : undefined;
          const bagli = !!onc && u.meta?.kaynakId === onc.id;
          const oi = oynar.findIndex((x) => x.id === u.id);
          const hazir = u.durum === "tamam";
          return (
            <Reorder.Item key={id} value={id} className="relative w-[212px] shrink-0 cursor-grab list-none active:cursor-grabbing" whileDrag={{ scale: 1.03, zIndex: 10 }}>
              {j > 0 && (bagli || !onKopru || onc?.tur !== "video" || u.tur !== "video" || onc.durum !== "tamam" || !hazir ? (
                <span className={cn("absolute -left-[13px] top-[52px] z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full ring-2 ring-[#0b0b0c]", bagli ? "bg-white text-[#0a0a0b]" : "bg-[#1c1c1f] text-metin-3")} title={bagli ? "Önceki çekimin son karesinden devam ediyor" : "Kesme"}>
                  {bagli ? <Link2 className="h-3 w-3" /> : <span className="h-px w-2 bg-current" />}
                </span>
              ) : (
                <span className="absolute -left-[15px] top-[52px] z-20 -translate-y-1/2"><Tooltip label="Köprü çek: iki çekimi bağla" side="top">
                  <button onClick={() => onKopru(onc, u)} aria-label="Köprü çek" onPointerDown={(e) => e.stopPropagation()}
                    className="group/k flex h-6 w-6 items-center justify-center rounded-full bg-[#1c1c1f] text-metin-2 ring-2 ring-[#0b0b0c] transition-[background-color,color,transform] hover:scale-110 hover:bg-white hover:text-[#0a0a0b]">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </Tooltip></span>
              ))}
              <div className={cn("group relative aspect-video overflow-hidden rounded-[14px] bg-[#111113] ring-inset transition-shadow", oi === i && hazir ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.08] hover:ring-white/25")}>
                {saltUrl(u.gorselUrl)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={saltUrl(u.gorselUrl)} alt="" draggable={false} className={cn("absolute inset-0 h-full w-full object-cover", !hazir && "opacity-30 blur-sm")} />
                  : <span className="absolute inset-0 bg-gradient-to-br from-[#1a1a1e] to-[#101012]" />}
                {!hazir && <span className="absolute inset-0 flex items-center justify-center text-[11.5px] font-medium text-metin-2">{u.durum === "hata" ? "Üretilemedi" : "Üretiliyor…"}</span>}
                <button onClick={() => (hazir && oi >= 0 ? git(oi) : onAc(u))} className="absolute inset-0" aria-label={`Çekim ${j + 1}: ${u.baslik}`} />
                <span className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-white backdrop-blur"><GripVertical className="-ml-0.5 h-3 w-3 text-white/50" />{j + 1}</span>
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-white backdrop-blur">
                  {u.tur === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{cekimSn(u)} sn
                </span>
                <span className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                  {hazir && (u.tur === "video"
                    ? <>{onOncesi && <Tooltip label="Öncesini çek" side="top"><button onClick={() => onOncesi(u)} aria-label="Öncesini çek" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur hover:bg-black/85"><Rewind className="h-3.5 w-3.5" /></button></Tooltip>}<Tooltip label="Son kareden devam çekimi" side="top"><button onClick={() => onDevam(u)} aria-label="Son kareden devam çekimi" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur hover:bg-black/85"><FastForward className="h-3.5 w-3.5" /></button></Tooltip></>
                    : <Tooltip label="Canlandır" side="top"><button onClick={() => onCanlandir(u)} aria-label="Canlandır" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur hover:bg-black/85"><Clapperboard className="h-3.5 w-3.5" /></button></Tooltip>)}
                  <Tooltip label="Sahneden çıkar" side="top"><button onClick={() => cikar(u.id, sahne.id)} aria-label="Sahneden çıkar" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur hover:bg-rose-500"><X className="h-3.5 w-3.5" /></button></Tooltip>
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 px-0.5 text-[12px] leading-snug font-medium text-metin-2">{u.baslik || `Çekim ${j + 1}`}</p>
            </Reorder.Item>
          );
        })}
        <li className="list-none">
          <button onClick={onCekimlereGit} className="flex aspect-video w-[160px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[14px] bg-white/[0.03] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.07] hover:text-metin">
            <Plus className="h-4 w-4" /><span className="text-[12px] font-medium">Çekim ekle</span>
          </button>
        </li>
      </Reorder.Group>
      </section>
    </div>
  );
}
