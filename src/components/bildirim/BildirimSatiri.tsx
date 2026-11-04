"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle, Archive, ArchiveRestore, Check, CircleDot, Infinity as Sonsuz, Megaphone, Play, ShieldAlert,
  Mail, Sparkles, Wallet, type LucideIcon,
} from "lucide-react";
import { useBildirim, type Bildirim, type BildirimKategori } from "@/store/useBildirim";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useTercih } from "@/store/useTercih";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/* ── Zaman ── */

export function kisaZaman(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "şimdi";
  if (s < 3600) return `${Math.floor(s / 60)} dk`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} g`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/** Göreli zamanların ("4 dk") tazelenmesi için dakikada bir yeniden çizer. */
export function useDakika() {
  const [, setT] = useState(0);
  useEffect(() => { const i = setInterval(() => setT((x) => x + 1), 60_000); return () => clearInterval(i); }, []);
}

/** Bugün · Dün · Bu hafta · Daha eski */
export function gunGrupla<T extends { zaman: number }>(liste: T[]) {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const b = bugun.getTime(), GUN = 86_400_000;
  const gruplar: { etiket: string; oge: T[] }[] = [
    { etiket: "Bugün", oge: [] }, { etiket: "Dün", oge: [] }, { etiket: "Bu hafta", oge: [] }, { etiket: "Daha eski", oge: [] },
  ];
  for (const o of liste) {
    const i = o.zaman >= b ? 0 : o.zaman >= b - GUN ? 1 : o.zaman >= b - 6 * GUN ? 2 : 3;
    gruplar[i].oge.push(o);
  }
  return gruplar.filter((g) => g.oge.length);
}

/* ── Demetleme ── */

/**
 * Liste öğesi: tek bildirim ya da art arda gelen aynı türden başarılı üretimlerin demeti
 * ("12 görsel hazır"). Demet tek satır sayılır; okundu/arşiv tüm üyelere uygulanır.
 */
export interface Oge { id: string; zaman: number; ana: Bildirim; uyeler: Bildirim[] }

const DEMET_ARALIK = 3 * 3_600_000;
/** "4 görsel hazır" → { adet: 4, tur: "görsel" } */
function hazirTuru(b: Bildirim) {
  if (b.kategori !== "uretim" || b.tur !== "basari") return null;
  const m = /^(?:(\d+)\s+)?(.+?) hazır$/i.exec(b.baslik);
  return m ? { adet: Number(m[1] ?? 1), tur: m[2].toLocaleLowerCase("tr-TR") } : null;
}

export function demetle(liste: Bildirim[]): Oge[] {
  const cikti: Oge[] = [];
  for (const b of liste) {
    const son = cikti[cikti.length - 1];
    const t = hazirTuru(b);
    const st = son && hazirTuru(son.ana);
    const yakin = son && son.uyeler[son.uyeler.length - 1].zaman - b.zaman;
    // Aynı türden üretimler 3 saat içinde; aynı başlıklı diğer olaylar (ör. art arda kredi yüklemesi) 24 saat içinde birleşir.
    const ayniUretim = son && t && st && t.tur === st.tur && yakin! < DEMET_ARALIK;
    const ayniOlay = son && !t && !st && son.ana.kategori === b.kategori && son.ana.baslik === b.baslik && yakin! < 24 * 3_600_000;
    if (ayniUretim || ayniOlay) son!.uyeler.push(b);
    else cikti.push({ id: b.id, zaman: b.zaman, ana: b, uyeler: [b] });
  }
  return cikti;
}

/** Üretim demeti mi (görsel ızgarası), yoksa tekrar eden olay mı (×N). */
export const uretimDemeti = (o: Oge) => o.uyeler.length > 1 && !!hazirTuru(o.ana);

export function demetBaslik(o: Oge) {
  const t = hazirTuru(o.ana);
  if (o.uyeler.length < 2 || !t) return o.ana.baslik;
  const adet = o.uyeler.reduce((a, b) => a + (hazirTuru(b)?.adet ?? 1), 0);
  return `${adet} ${t.tur} hazır`;
}
export const demetOkunmamis = (o: Oge) => o.uyeler.some((b) => !b.okundu);
export const demetDemo = (o: Oge) => o.uyeler.some((b) => b.demo);

/* ── Medya ── */

const GERCEK = /^(\/|https?:|data:image|blob:)/;
export interface Medya { gorsel?: string; video?: string; uretim?: Uretim }

/** Bildirimin görseli: önce bağlı üretimin güncel çıktısı, yoksa bildirimdeki küçük resim. */
export function medyaBul(b: Bildirim, uretimler: Uretim[]): Medya {
  const u = b.uretimId ? uretimler.find((x) => x.id === b.uretimId) : undefined;
  const aday = [u?.thumbnailUrl, u?.meta?.demoKlip?.poster, u?.gorselUrl, u?.muzik?.kapak, b.gorsel].find((x) => x && GERCEK.test(x));
  const video = u?.videoUrl && GERCEK.test(u.videoUrl) ? u.videoUrl : u?.meta?.demoKlip?.video;
  return { gorsel: aday, video: u?.tur === "video" ? video : undefined, uretim: u };
}

export function useMedya(o: Oge) {
  const uretimler = useProjeler((s) => s.uretimler);
  return useMemo(() => o.uyeler.map((b) => ({ b, ...medyaBul(b, uretimler) })), [o, uretimler]);
}

/* ── Simge ve kapak ── */

const KAT: Record<BildirimKategori, { ikon: LucideIcon; renk: string }> = {
  uretim: { ikon: Sparkles, renk: "from-[#55d6fd]/25 to-[#55d6fd]/[0.04] text-[#7fe1ff] ring-[#55d6fd]/25" },
  hesap: { ikon: Wallet, renk: "from-[#55d6fd]/20 to-[#8b7bff]/[0.06] text-[#7fe1ff] ring-[#55d6fd]/20" },
  duyuru: { ikon: Megaphone, renk: "from-violet-400/25 to-violet-400/[0.04] text-violet-200 ring-violet-300/25" },
  earn: { ikon: Wallet, renk: "from-emerald-400/25 to-emerald-400/[0.04] text-emerald-200 ring-emerald-300/25" },
};
export const KATEGORI_AD: Record<BildirimKategori, string> = { uretim: "Üretimler", hesap: "Hesap", earn: "Earn", duyuru: "Duyurular" };

export function Simge({ b, boyut = 36 }: { b: Bildirim; boyut?: number }) {
  const kredi = b.kategori === "hesap" && /kredi/i.test(b.baslik);
  const I = b.tur === "hata" ? AlertTriangle : b.tur === "uyari" && b.kategori === "uretim" ? ShieldAlert : /sınırsız/i.test(b.baslik) ? Sonsuz : KAT[b.kategori].ikon;
  const renk = b.tur === "hata" ? "from-rose-400/25 to-rose-400/[0.04] text-rose-300 ring-rose-300/25" : b.tur === "uyari" ? "from-amber-300/25 to-amber-300/[0.04] text-amber-200 ring-amber-300/25" : KAT[b.kategori].renk;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-b ring-1 ring-inset", renk)} style={{ width: boyut, height: boyut }}>
      {kredi ? <KrediJeton boyut={Math.round(boyut * 0.44)} az={b.tur === "uyari"} className="kredi-isilti-yildiz" /> : <I className={boyut > 38 ? "h-[18px] w-[18px]" : "h-4 w-4"} strokeWidth={2} />}
    </span>
  );
}

/** Kapak: tek küçük resim, demette üst üste binen kareler + adet; görsel yoksa simge. */
export function Kapak({ o, boyut = 44 }: { o: Oge; boyut?: number }) {
  const medya = useMedya(o).filter((m) => m.gorsel);
  if (!medya.length || (o.uyeler.length > 1 && !uretimDemeti(o))) return <Simge b={o.ana} boyut={Math.min(boyut, 40)} />;
  if (o.uyeler.length < 2) {
    const m = medya[0];
    return (
      <span className="relative block shrink-0 overflow-hidden rounded-[10px] bg-white/[0.04] ring-1 ring-white/[0.08]" style={{ width: boyut, height: boyut }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />
        {m.video && <span className="absolute inset-0 flex items-center justify-center bg-black/25"><Play className="h-3.5 w-3.5 fill-white text-white" /></span>}
        {o.ana.tur === "hata" && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><AlertTriangle className="h-4 w-4 text-rose-300" /></span>}
      </span>
    );
  }
  const k = boyut - 4;
  return (
    <span className="relative block shrink-0" style={{ width: boyut + 6, height: boyut }}>
      {medya.slice(0, 3).map((m, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={m.b.id} src={m.gorsel} alt="" loading="lazy" className="absolute rounded-[10px] bg-[#16171a] object-cover ring-2 ring-[var(--bd-zemin,#111214)]"
          style={{ width: k, height: k, left: i * 4, top: i * 2, zIndex: 3 - i, opacity: 1 - i * 0.2, transform: `rotate(${(i - 1) * 4}deg)` }} />
      ))}
      <span className="absolute -bottom-1 -right-1 z-10 rounded-full bg-[#55d6fd] px-1.5 text-[10.5px] font-bold leading-[16px] tabular-nums text-[#06202a] ring-2 ring-[var(--bd-zemin,#111214)]">{o.uyeler.length}</span>
    </span>
  );
}

export function DemoRozet() {
  return <span className="shrink-0 rounded-full bg-amber-300/12 px-1.5 py-px text-[11px] font-semibold text-amber-200 ring-1 ring-inset ring-amber-300/25">Örnek</span>;
}

/* ── Eylemler ── */

/** Arşivle + "Geri al" bildirimi. */
export function arsivleGeriAlinir(ids: string[]) {
  const s = useBildirim.getState();
  const giden = s.arsivle(ids);
  if (!giden.length) return;
  const okunmamis = giden.filter((b) => !b.okundu).map((b) => b.id);
  toast(giden.length > 1 ? `${giden.length} bildirim arşivlendi` : "Bildirim arşivlendi", {
    action: { label: "Geri al", onClick: () => { s.arsivdenCikar(giden.map((b) => b.id)); okunmamis.forEach((id) => useBildirim.getState().okunmadiIsaretle(id)); } },
  });
}
export function okunduDegistir(o: Oge) {
  const s = useBildirim.getState();
  if (demetOkunmamis(o)) o.uyeler.forEach((b) => s.okunduIsaretle(b.id));
  else s.okunmadiIsaretle(o.ana.id);
}

/* ── Satır ── */

/**
 * Bildirim satırı — açılır panelde ve sayfanın sol listesinde aynı.
 * `onSec` verilirse satır seçer (sayfa), yoksa `href`e gider (panel).
 */
export function BildirimSatiri({ o, secili, onSec, href, onGit, arsivde }: {
  o: Oge; secili?: boolean; onSec?: () => void; href?: string; onGit?: () => void; arsivde?: boolean;
}) {
  const b = o.ana;
  const okunmamis = demetOkunmamis(o);
  const model = useMedya(o)[0]?.uretim?.model;
  const ic = (
    <>
      <span className={cn("absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#55d6fd] transition-transform", okunmamis ? "scale-100" : "scale-0")} />
      <span className="ml-2 block shrink-0"><Kapak o={o} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={cn("truncate text-[13.5px]", okunmamis ? "font-semibold text-white" : "font-medium text-white/75")}>{demetBaslik(o)}</span>
          {o.uyeler.length > 1 && !uretimDemeti(o) && <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 text-[11px] font-semibold tabular-nums leading-[18px] text-white/75">×{o.uyeler.length}</span>}
          {demetDemo(o) && <DemoRozet />}
          <span className="ml-auto shrink-0 pl-1 text-[12px] tabular-nums text-white/45 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">{kisaZaman(o.zaman)}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/50">
          {model && <ModelLogo ad={model} boyut={12} />}
          <span className="truncate">{uretimDemeti(o) ? o.uyeler.map((x) => istemi(x)).join(" · ") : b.mesaj}</span>
        </span>
      </span>
    </>
  );
  const sinif = cn("group relative flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60",
    secili ? "bg-white/[0.07]" : "hover:bg-white/[0.04]");
  return (
    <div className="group relative">
      {onSec ? (
        <button onClick={onSec} aria-current={secili || undefined} className={sinif}>{ic}</button>
      ) : (
        <Link href={href ?? "/panel/bildirimler"} onClick={() => { o.uyeler.forEach((x) => useBildirim.getState().okunduIsaretle(x.id)); onGit?.(); }} className={sinif}>{ic}</Link>
      )}
      <span className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:hidden">
        {!arsivde && (
          <button onClick={() => okunduDegistir(o)} aria-label={okunmamis ? "Okundu say" : "Okunmadı yap"} title={okunmamis ? "Okundu say" : "Okunmadı yap"}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b1c1f] text-white/70 ring-1 ring-white/[0.08] transition-colors hover:text-white active:scale-90">
            {okunmamis ? <Check className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
          </button>
        )}
        <button onClick={() => (arsivde ? useBildirim.getState().arsivdenCikar(o.uyeler.map((x) => x.id)) : arsivleGeriAlinir(o.uyeler.map((x) => x.id)))}
          aria-label={arsivde ? "Gelen kutusuna taşı" : "Arşivle"} title={arsivde ? "Gelen kutusuna taşı" : "Arşivle"}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b1c1f] text-white/70 ring-1 ring-white/[0.08] transition-colors hover:text-white active:scale-90">
          {arsivde ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
        </button>
      </span>
    </div>
  );
}

/** Mesajdaki tırnaklı istem ("…" · model) — demet özetinde yalnız istemler gösterilir. */
export function istemi(b: Bildirim) {
  const m = /"([^"]+)"/.exec(b.mesaj);
  return m ? m[1] : b.mesaj;
}

/* ── Sürüyor ── */

/** Devam eden üretimler: bulanık küçük resim + canlı ilerleme çubuğu. */
export function Suruyor({ onGit, en = 3 }: { onGit?: () => void; en?: number }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const liste = useMemo(() => uretimler.filter((u) => u.durum === "isleniyor" || u.durum === "kuyrukta").slice(0, en), [uretimler, en]);
  if (!liste.length) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 px-2 pb-1 pt-3 text-[12.5px] font-medium text-white/50"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#55d6fd]" />Sürüyor · {liste.length}</p>
      {liste.map((u) => {
        const g = [u.meta?.demoKlip?.poster, u.gorselUrl, u.meta?.referanslar?.[0]].find((x) => x && GERCEK.test(x));
        const yuzde = u.durum === "kuyrukta" ? 0 : Math.round(u.ilerleme);
        return (
          <Link key={u.id} href={`/panel/kitaplik?u=${u.id}`} onClick={onGit} className="flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-white/[0.04]">
            <span className="relative ml-2 block h-10 w-10 shrink-0 overflow-hidden rounded-[10px] bg-[#55d6fd]/[0.06] ring-1 ring-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {g ? <img src={g} alt="" className="h-full w-full scale-105 object-cover blur-[2px] brightness-75" /> : <Sparkles className="m-auto mt-3 h-4 w-4 text-[#55d6fd]/70" />}
              <span className="absolute inset-0 animate-pulse bg-[#55d6fd]/10" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2 text-[13px]">
                <span className="truncate font-medium text-white">{u.baslik}</span>
                <span className="shrink-0 tabular-nums text-white/55">{yuzde ? `%${yuzde}` : "Sırada"}</span>
              </span>
              <span className="relative mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.08]">
                {yuzde ? <motion.span className="block h-full rounded-full bg-[#55d6fd]" initial={false} animate={{ width: `${yuzde}%` }} transition={{ duration: 0.5 }} />
                  : <span className="bildirim-kayan absolute inset-y-0 w-1/4 rounded-full bg-white/25" />}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Tercihler ── */

/** Bildirim tercihleri — useTercih.bildirimTercih'e yazar; üreticiler (lib/bildirimler) buna uyar. */
export function Tercihler() {
  const t = useTercih((s) => s.bildirimTercih);
  const ayarla = useTercih((s) => s.bildirimTercihAyarla);
  const satirlar: { id: keyof typeof t | "hesap"; ad: string; ozet: string; ikon: LucideIcon; renk: string }[] = [
    { id: "uretim", ad: "Üretimler", ozet: "Görsel, video ya da ses hazır olduğunda veya başarısız olduğunda.", ikon: Sparkles, renk: KAT.uretim.renk },
    { id: "hesap", ad: "Hesap ve ödemeler", ozet: "Kredi, satın alma, plan ve Earn hareketleri. Kapatılamaz.", ikon: Wallet, renk: KAT.hesap.renk },
    { id: "pazarlama", ad: "Duyurular", ozet: "Yeni modeller, özellikler ve kampanyalar.", ikon: Megaphone, renk: KAT.duyuru.renk },
    { id: "email", ad: "E-posta özeti", ozet: "Önemli bildirimleri e-postayla da gönder.", ikon: Mail, renk: "" },
  ];
  return (
    <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[20px] bg-[#2a2a2e]/75 ring-1 ring-inset ring-white/[0.07]">
      {satirlar.map((s) => {
        const sabit = s.id === "hesap";
        const acik = sabit ? true : t[s.id as keyof typeof t];
        return (
          <label key={s.id} className={cn("flex items-center gap-3 px-3.5 py-3", sabit ? "cursor-default" : "cursor-pointer hover:bg-white/[0.02]")}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#1a1a1d] text-white/70 ring-1 ring-inset ring-white/[0.08]"><s.ikon className="h-4 w-4" strokeWidth={1.8} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium text-white">{s.ad}</span>
              <span className="block text-[12px] leading-snug text-white/50">{s.ozet}</span>
            </span>
            <button role="switch" aria-checked={acik} aria-label={s.ad} disabled={sabit} onClick={() => ayarla({ [s.id]: !acik })}
              className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40", acik ? "bg-[#55d6fd]" : "bg-white/[0.14]")}>
              <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 35 }} className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white", acik ? "right-0.5" : "left-0.5")} />
            </button>
          </label>
        );
      })}
    </div>
  );
}

/* ── Sade satır (açılır panel · "A · Sade gelen kutusu") ── */

/** Tek renk simge: üretimde model logosu, diğerlerinde nötr daire içinde ikon. */
export function SadeSimge({ o }: { o: Oge }) {
  const b = o.ana;
  const model = useMedya(o)[0]?.uretim?.model ?? (b.kategori === "uretim" ? b.mesaj.split(" · ")[1] : undefined);
  const kredi = b.kategori === "hesap" && /kredi/i.test(b.baslik);
  const I = b.tur === "hata" ? AlertTriangle : b.tur === "uyari" && b.kategori === "uretim" ? ShieldAlert : /sınırsız/i.test(b.baslik) ? Sonsuz : KAT[b.kategori].ikon;
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">
      {b.kategori === "uretim" && model && b.tur === "basari" ? <ModelLogo ad={model} boyut={16} />
        : kredi ? <KrediJeton boyut={14} az={b.tur === "uyari"} />
        : <I className={cn("h-[15px] w-[15px]", b.tur === "hata" ? "text-rose-300" : b.tur === "uyari" ? "text-amber-200" : "text-white/75")} strokeWidth={2} />}
    </span>
  );
}

export function SadeSatir({ o, href, onGit, arsivde }: { o: Oge; href: string; onGit?: () => void; arsivde?: boolean }) {
  const b = o.ana;
  const okunmamis = demetOkunmamis(o);
  const medya = useMedya(o);
  const kapak = medya.find((m) => m.gorsel);
  const uretimMi = b.kategori === "uretim" && b.tur === "basari";
  const model = medya[0]?.uretim?.model ?? (uretimMi ? b.mesaj.split(" · ")[1] : undefined);
  const ikinci = uretimMi ? (uretimDemeti(o) ? o.uyeler.map(istemi).join(" · ") : istemi(b)) : b.mesaj;
  return (
    <div className="group relative border-b border-white/[0.05]">
      <Link href={href} onClick={() => { o.uyeler.forEach((x) => useBildirim.getState().okunduIsaretle(x.id)); onGit?.(); }}
        className="flex items-start gap-3 px-4 py-3 outline-none transition-colors hover:bg-white/[0.025] focus-visible:bg-white/[0.04]">
        <SadeSimge o={o} />
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] leading-snug text-white/60 [overflow-wrap:anywhere]">
            <b className={cn("font-semibold", okunmamis ? "text-white" : "text-white/85")}>{demetBaslik(o)}</b>
            {uretimMi && model && <> · {model}</>}
            {o.uyeler.length > 1 && !uretimDemeti(o) && <span className="ml-1.5 rounded-full bg-white/[0.08] px-1.5 text-[11px] font-semibold tabular-nums text-white/75">×{o.uyeler.length}</span>}
            {demetDemo(o) && <span className="ml-1.5 inline-block align-[1px]"><DemoRozet /></span>}
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-white/45">{ikinci}</span>
          <span className="mt-1 block text-[12px] tabular-nums text-white/35">
            {kisaZaman(o.zaman)}{kisaZaman(o.zaman) !== "şimdi" && " önce"}
            {!arsivde && (uretimDemeti(o) ? <> · <span className="font-medium text-white/65 transition-colors group-hover:text-white">Hepsini gör</span></> : b.eylem && <> · <span className="font-medium text-white/65 transition-colors group-hover:text-white">{b.eylem.ad}</span></>)}
          </span>
        </span>
        {kapak && (
          <span className="relative mt-0.5 block h-11 w-11 shrink-0 overflow-hidden rounded-[8px] bg-white/[0.04] ring-1 ring-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kapak.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" />
            {kapak.video && !uretimDemeti(o) && <span className="absolute inset-0 flex items-center justify-center bg-black/20"><Play className="h-3 w-3 fill-white text-white" /></span>}
            {uretimDemeti(o) && <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] font-semibold tabular-nums text-white">+{o.uyeler.length - 1}</span>}
          </span>
        )}
      </Link>
      <span className={cn("pointer-events-none absolute right-2 top-3.5 h-1.5 w-1.5 rounded-full bg-[#55d6fd] transition-[transform,opacity]", okunmamis ? "scale-100 group-hover:opacity-0" : "scale-0")} />
      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:hidden">
        {!arsivde && (
          <button onClick={() => okunduDegistir(o)} aria-label={okunmamis ? "Okundu say" : "Okunmadı yap"} title={okunmamis ? "Okundu say" : "Okunmadı yap"}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1d] text-white/60 ring-1 ring-white/[0.08] transition-colors hover:text-white active:scale-90">
            {okunmamis ? <Check className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
          </button>
        )}
        <button onClick={() => (arsivde ? useBildirim.getState().arsivdenCikar(o.uyeler.map((x) => x.id)) : arsivleGeriAlinir(o.uyeler.map((x) => x.id)))}
          aria-label={arsivde ? "Gelen kutusuna taşı" : "Arşivle"} title={arsivde ? "Gelen kutusuna taşı" : "Arşivle"}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1d] text-white/60 ring-1 ring-white/[0.08] transition-colors hover:text-white active:scale-90">
          {arsivde ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
        </button>
      </span>
    </div>
  );
}

/** Süren üretimler — ince tek satırlar: nabız noktası, istem · model, mini çubuk, yüzde. */
export function SadeSuruyor({ onGit }: { onGit?: () => void }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const liste = useMemo(() => uretimler.filter((u) => u.durum === "isleniyor" || u.durum === "kuyrukta").slice(0, 2), [uretimler]);
  if (!liste.length) return null;
  return (
    <div className="border-b border-white/[0.07] bg-white/[0.015]">
      {liste.map((u) => {
        const yuzde = u.durum === "kuyrukta" ? 0 : Math.round(u.ilerleme);
        return (
          <Link key={u.id} href={`/panel/kitaplik?u=${u.id}`} onClick={onGit} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03]">
            <span className="relative flex h-2 w-2 shrink-0"><span className="absolute inset-0 animate-ping rounded-full bg-[#55d6fd]/60" /><span className="relative h-2 w-2 rounded-full bg-[#55d6fd]" /></span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/60"><span className="font-medium text-white">{u.baslik}</span> · {u.model}</span>
            <span className="relative h-1 w-16 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
              {yuzde ? <motion.span className="block h-full rounded-full bg-[#55d6fd]" initial={false} animate={{ width: `${yuzde}%` }} transition={{ duration: 0.5 }} />
                : <span className="bildirim-kayan absolute inset-y-0 w-1/3 rounded-full bg-white/30" />}
            </span>
            <span className="w-11 shrink-0 text-right text-[12px] tabular-nums text-white/50">{yuzde ? `%${yuzde}` : "Sırada"}</span>
          </Link>
        );
      })}
    </div>
  );
}
