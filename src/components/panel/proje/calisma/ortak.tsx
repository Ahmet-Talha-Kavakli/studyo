"use client";

/** Proje çalışma alanının ortak parçaları: veri yardımcıları, roller, brif bölümleri, kapak ve avatar. */

import { useId, useMemo, useState } from "react";
import { Clapperboard, Folder, Megaphone, Music, Sparkles } from "lucide-react";
import { useProje, type Proje, type ProjeRol, type ProjeUye } from "@/store/useSinema";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

export const ease = [0.22, 1, 0.36, 1] as const;
export const yay = { type: "spring", stiffness: 420, damping: 36 } as const;
export { KART, Hap } from "@/components/kitaplik/KitaplikKarti";
export const SERIT = "flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5";
export const ALT = "flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 sm:px-5";
export const GRI = "flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white/90 transition hover:bg-white/[0.12] disabled:opacity-40";
export const BEYAZ = "flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black transition hover:bg-white/90 disabled:opacity-40";
export const MENU = "rounded-[16px] border border-white/[0.08] bg-[#151517] p-1.5";
export const MSATIR = "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/85 transition-colors hover:bg-white/[0.06] hover:text-white";

export type Bolum = "genel" | "varliklar" | "elementler" | "brif" | "canvas" | "yonetmen";

/* ── Roller (Higgsfield: Owner / Admin / Collaborator / Viewer) ── */
export const ROLLER: { id: ProjeRol; ad: string; ozet: string; izin: [boolean, boolean, boolean, boolean, boolean] }[] = [
  { id: "sahip", ad: "Sahip", ozet: "Her şeye erişir, projeyi silebilir ve devredebilir.", izin: [true, true, true, true, true] },
  { id: "yonetici", ad: "Yönetici", ozet: "Varlıkları, elementleri ve üyeleri yönetir.", izin: [true, true, true, true, false] },
  { id: "katilimci", ad: "Katılımcı", ozet: "Üretir, kendi işini düzenler, yorum yapar.", izin: [true, true, true, false, false] },
  { id: "izleyici", ad: "İzleyici", ozet: "Görüntüler, indirir ve yorum yapar.", izin: [true, false, false, false, false] },
];
export const IZINLER = ["Görüntüle, indir, yorum yap", "Üret ve kendi işini düzenle", "Sahneleri, brifi ve elementleri düzenle", "Üyeleri ve klasörleri yönet", "Projeyi sil ya da devret"];
export const rolAdi = (r: ProjeRol) => ROLLER.find((x) => x.id === r)?.ad ?? r;
const UYE_RENK = ["#f472b6", "#a3e635", "#fb923c", "#a78bfa", "#facc15", "#38bdf8"];
export const uyeRengi = (i: number) => UYE_RENK[i % UYE_RENK.length];

/** Sahip (oturumdaki kullanıcı) + kayıtlı üyeler. */
export function useUyeler(p?: Proje): ProjeUye[] {
  const k = useAuth((s) => s.kullanici);
  return useMemo(() => {
    const sahip: ProjeUye = { email: k?.email ?? "sen@vayra.ai", ad: k?.ad ? `${k.ad} (sen)` : "Sen", rol: "sahip", renk: "#55d6fd", davet: p?.olusturma ?? 0 };
    return [sahip, ...(p?.uyeler ?? [])];
  }, [k, p]);
}

export function Avatar({ u, boyut = 28, halka = "ring-[#0b0b0c]" }: { u: Pick<ProjeUye, "ad" | "renk" | "bekliyor">; boyut?: number; halka?: string }) {
  return (
    <span title={u.ad} className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-black ring-2", halka, u.bekliyor && "opacity-55")}
      style={{ width: boyut, height: boyut, background: u.renk, fontSize: Math.round(boyut * 0.4) }}>
      {u.ad.replace(/[^\p{L}]/gu, "").slice(0, 1).toLocaleUpperCase("tr") || "?"}
    </span>
  );
}
export function AvatarYigini({ uyeler, boyut = 28, en = 4, halka }: { uyeler: ProjeUye[]; boyut?: number; en?: number; halka?: string }) {
  return (
    <span className="flex -space-x-2">
      {uyeler.slice(0, en).map((u) => <Avatar key={u.email} u={u} boyut={boyut} halka={halka} />)}
      {uyeler.length > en && <span className={cn("flex items-center justify-center rounded-full bg-white/[0.12] text-[11px] font-semibold text-white ring-2", halka ?? "ring-[#0b0b0c]")} style={{ width: boyut, height: boyut }}>+{uyeler.length - en}</span>}
    </span>
  );
}

/* ── Varlıklar ── */
export const gorselAdresi = (u: Uretim) => [u.gorselUrl, u.thumbnailUrl, u.muzik?.kapak, u.meta?.demoKlip?.poster].find((x) => x && /^(https?:|data:image|blob:|\/)/.test(x));
export function projeVarliklari(p: Proje, uretimler: Uretim[]) {
  const ref = new Set([...(p.uretimIdler ?? []), ...(p.shortsKlipleri ?? [])]);
  return uretimler.filter((u) => u.projeId === p.id || ref.has(u.id)).sort((a, b) => b.olusturma - a.olusturma);
}
export function useProjeVarliklari(p?: Proje) {
  const uretimler = useProjeler((s) => s.uretimler);
  return useMemo(() => (p ? projeVarliklari(p, uretimler) : []), [p, uretimler]);
}

/* ── Proje ağacı ── */
export function altProjeler(hepsi: Proje[], id: string) { return hepsi.filter((p) => !p.klasor && p.ustProjeId === id); }
export function ataYolu(hepsi: Proje[], p: Proje): Proje[] {
  const yol: Proje[] = [];
  let u = p.ustProjeId ? hepsi.find((x) => x.id === p.ustProjeId) : undefined;
  for (let i = 0; u && i < 8; i++) { yol.unshift(u); u = u.ustProjeId ? hepsi.find((x) => x.id === u!.ustProjeId) : undefined; }
  return yol;
}
/** p'nin kendisi ve tüm torunları (taşıma hedefi seçerken döngüyü engellemek için). */
export function altAgac(hepsi: Proje[], id: string): Set<string> {
  const s = new Set([id]);
  let degisti = true;
  while (degisti) { degisti = false; for (const p of hepsi) if (p.ustProjeId && s.has(p.ustProjeId) && !s.has(p.id)) { s.add(p.id); degisti = true; } }
  return s;
}

/** Kare ya da video küçük resmi: görsel yoksa videonun kendisi sessiz döngüde gösterilir. */
export function Medya({ gorsel, video, className, oynat = true }: { gorsel?: string; video?: string; className?: string; oynat?: boolean }) {
  if (gorsel) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={gorsel} alt="" className={className} />;
  }
  if (video) return <video src={video} muted loop playsInline autoPlay={oynat} preload="metadata" className={className} />;
  return null;
}
export const videoAdresi = (u: Uretim) => u.videoUrl || u.meta?.demoKlip?.video;

/* ── Kapak ── */
export function turIkonu(tur: string): React.ElementType {
  const t = tur.toLocaleLowerCase("tr");
  if (/reklam|ugc|ürün/.test(t)) return Megaphone;
  if (/müzik|klip/.test(t)) return Music;
  if (/karakter/.test(t)) return Sparkles;
  if (/belgesel|genel/.test(t)) return Folder;
  return Clapperboard;
}
export function projeKapakAdresi(p: Proje, varlik: Uretim[]) {
  const k = p.kapakUrl && /^(https?:|data:image|blob:|\/)/.test(p.kapakUrl) ? p.kapakUrl : undefined;
  return k ?? varlik.map(gorselAdresi).find(Boolean) ?? p.cekimler.map((c) => c.gorselUrl).find(Boolean);
}
/**
 * macOS Finder klasörü: sekmeli arka kapak + açık tonlu ön kapak, projenin rengiyle.
 * Görsel verilirse ön kapağın arkasından fotoğraf gibi taşar (klasörün içinde ne olduğu görünür).
 */
export function MacKlasor({ renk = "#4aa8f0", className, kapali, gorsel }: { renk?: string; className?: string; kapali?: boolean; gorsel?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 50" className={cn("shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: `color-mix(in srgb, ${renk} 78%, #000)` }} /><stop offset="1" style={{ stopColor: `color-mix(in srgb, ${renk} 62%, #000)` }} /></linearGradient>
        <linearGradient id={`o${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: `color-mix(in srgb, ${renk} 72%, #fff)` }} /><stop offset="1" style={{ stopColor: renk }} /></linearGradient>
      </defs>
      <path d="M6 2.5h14.6c1.3 0 2.5.5 3.4 1.4l3.1 3.1H58a6 6 0 0 1 6 6V44a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V8.5a6 6 0 0 1 6-6Z" fill={`url(#a${id})`} />
      {gorsel ? (
        <>
          <clipPath id={`g${id}`}><rect x="5" y="5" width="54" height="34" rx="3.5" /></clipPath>
          <image href={gorsel} x="5" y="5" width="54" height="34" preserveAspectRatio="xMidYMid slice" clipPath={`url(#g${id})`} />
        </>
      ) : !kapali && <rect x="6" y="8" width="52" height="30" rx="3" fill="#fff" opacity="0.9" />}
      {/* Ön kapak: üzerine gelince (satırın group'u) hafifçe öne yatar, macOS'ta klasöre sürüklerken açılması gibi. */}
      <g className="origin-bottom transition-transform duration-300 ease-out [transform-box:fill-box] group-hover:[transform:perspective(80px)_rotateX(-12deg)] group-hover/as:[transform:perspective(80px)_rotateX(-12deg)] group-hover/b:[transform:perspective(80px)_rotateX(-12deg)]">
        <path d="M0 18.5a6 6 0 0 1 6-6h52a6 6 0 0 1 6 6V44a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6Z" fill={`url(#o${id})`} />
        <path d="M6 13h52a5.5 5.5 0 0 1 5.5 5.5" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" />
      </g>
    </svg>
  );
}

/** Proje simgesi her yerde macOS klasörü; projede görsel varsa klasörün içinden görünür. */
export function ProjeKapak({ p, className }: { p: Proje; className?: string; ikon?: string }) {
  return <MacKlasor renk={p.renk ?? "#4aa8f0"} className={className} />;
}

/* ── Brif (Higgsfield: Context, Narrative, Visuals, Production, Status, Resources, Notes) ── */
export const BRIF_BOLUMLERI = [
  { ad: "Bağlam", ipucu: "Proje ne için var, kim için, nerede yayınlanacak?" },
  { ad: "Anlatı", ipucu: "Hikâye, mesaj, akış ve hedef kitle." },
  { ad: "Görseller", ipucu: "Ruh hâli, renk paleti, ışık, referanslar ve yaratıcı yön." },
  { ad: "Prodüksiyon", ipucu: "Teslim tarihleri, formatlar, kanallar ve sorumlular." },
  { ad: "Durum", ipucu: "Nerede kaldınız, engeller neler, sıradaki adım ne?" },
  { ad: "Kaynaklar", ipucu: "Senaryo, moodboard, marka kılavuzu, bağlantılar." },
  { ad: "Notlar", ipucu: "Alınan kararlar ve önemli güncellemeler." },
] as const;
const EMOJI = /[\p{Extended_Pictographic}️]/gu;
/** Markdown brif → bölüm metinleri. Eski emojili başlıklar ("🎭 Anlatı") da okunur. */
export function brifCoz(md?: string): Record<string, string> {
  const r: Record<string, string> = {};
  if (!md?.trim()) return r;
  let aktif = "Bağlam";
  for (const satir of md.split("\n")) {
    const b = satir.match(/^#{2,3}\s+(.*)$/);
    if (b) {
      const ad = b[1].replace(EMOJI, "").trim();
      const es = BRIF_BOLUMLERI.find((x) => x.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"));
      aktif = es ? es.ad : ad;
      continue;
    }
    const temiz = satir.replace(/<!--.*?-->/g, "");
    r[aktif] = r[aktif] ? `${r[aktif]}\n${temiz}` : temiz;
  }
  /* Eski şablonun ipucu satırları içerik sayılmaz. */
  const ESKI_IPUCU = ["Hikâye, mesaj ve hedef kitle.", "Referanslar, ruh hâli, renk paleti ve yaratıcı yön.", "Takvim, mekânlar, ekip ve lojistik.", "Mevcut ilerleme, engeller ve sonraki adımlar.", "Senaryo, moodboard, storyboard, takvim ve varlıklar.", "Önemli kararlar, güncellemeler ve proje geçmişi.", "Bu proje neden var?"];
  for (const k of Object.keys(r)) { const v = r[k].split("\n").filter((x) => !ESKI_IPUCU.includes(x.trim())).join("\n").trim(); if (v) r[k] = v; else delete r[k]; }
  return r;
}
export function brifYaz(b: Record<string, string>) {
  return BRIF_BOLUMLERI.map((x) => `## ${x.ad}\n${(b[x.ad] ?? "").trim()}`).join("\n\n");
}

/* ── Proje ayarları kısayolu ── */
export function useProjeEylem() {
  return useProje.getState();
}

/** Sahnenin görünen durumu: çıktısı yoksa "tamam" kaydı da taslak sayılır. */
export const sahneDurumu = (c: { durum: string; gorselUrl?: string; videoUrl?: string }): "tamam" | "uretiliyor" | "taslak" =>
  c.durum === "uretiliyor" ? "uretiliyor" : c.gorselUrl || c.videoUrl ? "tamam" : "taslak";

export const sayiMetni = (g: number, v: number, s: number) => [g && `${g} görsel`, v && `${v} video`, s && `${s} ses`].filter(Boolean).join(" · ") || "Boş";
export function turSayilari(liste: Uretim[]) {
  let g = 0, v = 0, s = 0;
  for (const u of liste) { if (u.tur === "video") v++; else if (u.tur === "ses" || u.tur === "muzik") s++; else g++; }
  return { g, v, s };
}
