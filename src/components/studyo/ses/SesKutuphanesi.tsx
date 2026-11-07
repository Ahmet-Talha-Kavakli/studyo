"use client";

import { Iskelet } from "@/components/ui/Iskelet";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Pause, Play, Search, Trash2, Mic, Wand2, Globe2, Library, Loader2, Users, Sparkles, Heart, Info, Lock, Languages, Headphones, SlidersHorizontal, MoreHorizontal, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { neden } from "@/components/studyo/bildirim";
import { DILLER, SESLER, SES_KULLANIMLARI, aksanBayrak, type SesKullanim, type SesModel } from "@/lib/sesVeri";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import { yerelDepo } from "@/lib/yerelDepo";
import { useOzelSesler, type OzelSes, type ToplulukOzet } from "@/store/useOzelSesler";
import { AramaliSecici } from "@/components/ui/AramaliSecici";
import { Bayrak } from "@/components/ui/Bayrak";
import { SesAvatar } from "./ortak";
import { KLON_KREDI } from "./KlonModal";

/** Seçilebilir ses: hazır ses, kullanıcının kendi sesi (klon/tasarım) ya da topluluk sesi. */
export type SecilenSes = {
  ad: string; cinsiyet: "Kadın" | "Erkek" | "Nötr"; renk: string; sesId?: string; ozel?: boolean;
  /** Topluluk sesiyse sahibinin kimliği (üretimden önce hesaba eklenir). */
  paylasimSahibi?: string;
};

const OZEL_RENK = "#8b7bff";
const TASARIM_RENK = "#f0abfc";
const TOPLULUK_RENKLER = ["#a78bfa", "#fb923c", "#f472b6", "#60a5fa", "#2dd4bf", "#fbbf24", "#34d399", "#f87171", "#67e8f9", "#c084fc"];
const adRengi = (ad: string) => TOPLULUK_RENKLER[[...ad].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % TOPLULUK_RENKLER.length];

export const ozeldenSes = (o: OzelSes): SecilenSes => ({ ad: o.ad, cinsiyet: o.cinsiyet, renk: o.kaynak === "tasarim" ? TASARIM_RENK : OZEL_RENK, sesId: o.sesId, ozel: true });
export const hazirdanSes = (s: SesModel): SecilenSes => ({ ad: s.ad, cinsiyet: s.cinsiyet, renk: s.renk, sesId: s.sesId });
const topluluktanSes = (s: ToplulukOzet): SecilenSes => ({ ad: s.ad, cinsiyet: s.cinsiyet, renk: adRengi(s.ad), sesId: s.sesId, paylasimSahibi: s.sahip });

/** Özel sesin kaydedilmiş örneğini çalar (IndexedDB'den). */
async function ornekCal(o: OzelSes) {
  const blob = await yerelDepo.oku(o.ornekAnahtar).catch(() => undefined);
  if (!blob) return void toast.error("Ses örneği bulunamadı", { description: "Örnek bu tarayıcıda kayıtlı değil, başka bir cihazda kaydedilmiş olabilir. O cihazdan dinleyebilirsin." });
  void sesCalici.cal("ornek-" + o.id, { tur: "dosya", url: URL.createObjectURL(blob) });
}

const CINSIYETLER = ["Tümü", "Kadın", "Erkek", "Nötr"] as const;
type Cinsiyet = (typeof CINSIYETLER)[number];
const YASLAR = ["Tümü", "Genç", "Orta yaş", "Olgun"] as const;
type Yas = (typeof YASLAR)[number];
const AKSANLAR = [...new Set(SESLER.map((s) => s.aksan).filter((a): a is string => !!a))].sort((a, b) => a.localeCompare(b, "tr"));

/** Dokunmatik ekranda hep görünür; fareyle yalnız kartın üzerine gelince. */
const UZERINDE = "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:!opacity-100";

/**
 * Ses kartı (Görsel/Video kart dili): renk halesi olan küre = dinle düğmesi; ad + bayrak, tanım,
 * cam etiket çipleri; üzerine gelince "Kullan", seçili seste camgöbeği halka ve ✓ çipi.
 */
function SesKarti({ ad, renk, bayrak, tanim, cipler, calan, hata, dinle, dinleKapali, onDinle, secili, onKullan, kullanKapali, kullanIpucu, kullanEtiket, favori, onFavori, sagUst, ustte }: {
  ad: string; renk: string; bayrak?: string | null; tanim?: string; cipler: (string | undefined | null | false)[];
  calan: boolean; hata?: boolean; dinle: boolean; dinleKapali?: string; onDinle: () => void;
  secili: boolean; onKullan?: () => void; kullanKapali?: boolean; kullanIpucu?: string; kullanEtiket?: string;
  favori?: boolean; onFavori?: () => void; sagUst?: React.ReactNode;
  /** Açık menüsü olan kart komşularının üstünde durur. */
  ustte?: boolean;
}) {
  return (
    <div className={cn("panel-ic group relative flex items-center gap-3 rounded-2xl p-2.5 pr-3 transition-colors", !secili && "panel-ic-hover", ustte && "z-20")}>
      {secili && <span aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-inset ring-white" />}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute inset-0" style={{ background: `radial-gradient(110px 80px at 0% 0%, color-mix(in srgb, ${renk} 22%, transparent), transparent 70%)` }} />
      </span>
      <span className="relative shrink-0">
        <button onClick={onDinle} disabled={!dinle} aria-label={calan ? `${ad} örneğini duraklat` : `${ad} örneğini dinle`} title={dinle ? "Dinle" : dinleKapali}
          className="relative block rounded-full disabled:cursor-not-allowed">
          <SesAvatar ad={ad} renk={renk} boyut={48} aktif={calan} />
          {dinle && (
            <span className={cn("absolute inset-0 flex items-center justify-center rounded-full bg-black/45 transition-opacity", calan ? "opacity-100" : UZERINDE)}>
              {calan ? <Pause className="h-4 w-4 fill-white text-white" /> : <Play className="ml-0.5 h-4 w-4 fill-white text-white" />}
            </span>
          )}
        </button>
        {onFavori && (
          <button onClick={onFavori} aria-pressed={!!favori} aria-label={favori ? `${ad} favorilerden çıkar` : `${ad} favorilere ekle`} title={favori ? "Favorilerden çıkar" : "Favorilere ekle"}
            className={cn("absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yuzey ring-1 ring-white/10 transition-opacity",
              favori ? "text-rose-400" : cn("text-metin-3 hover:text-rose-300", UZERINDE))}>
            <Heart className={cn("h-3 w-3", favori && "fill-current")} />
          </button>
        )}
      </span>
      <button onClick={onKullan} disabled={!onKullan || kullanKapali} className="relative min-w-0 flex-1 text-left disabled:cursor-default">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14.5px] font-semibold text-metin">{ad}</span>
          {bayrak && bayrak !== "🌐" && <Bayrak b={bayrak} boyut={15} />}
        </span>
        {tanim && <span className="mt-0.5 block truncate text-[12.5px] text-metin-2">{tanim}</span>}
        <span className="mt-1.5 flex flex-wrap gap-1">
          {hata && <span className="flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300"><AlertTriangle className="h-2.5 w-2.5" />Örnek yüklenemedi</span>}
          {[...new Set(cipler.filter(Boolean))].slice(0, 3).map((c) => <span key={c as string} className="glass-cip rounded px-1.5 py-0.5 text-[10px] font-medium text-metin-2">{c}</span>)}
        </span>
      </button>
      {sagUst}
      {onKullan && (secili ? null : (
        <button onClick={onKullan} disabled={kullanKapali} title={kullanIpucu} aria-label={kullanEtiket ? `${ad} sesini klonla` : `${ad} sesini kullan`}
          className={cn("relative h-8 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition-opacity disabled:bg-white/10 disabled:text-metin-3", UZERINDE)}>
          {kullanEtiket ?? "Kullan"}
        </button>
      ))}
    </div>
  );
}

/** Kartın ⋯ menüsü; dışarı tıklayınca ya da Esc ile kapanır. */
function KartMenusu({ ad, acik, onAc, onKapat, ogeler }: { ad: string; acik: boolean; onAc: () => void; onKapat: () => void; ogeler: { etiket: string; ikon: typeof Mic; onTikla: () => void }[] }) {
  useEffect(() => {
    if (!acik) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [acik, onKapat]);
  return (
    <span className="relative shrink-0">
      <button onClick={acik ? onKapat : onAc} aria-haspopup="menu" aria-expanded={acik} aria-label={`${ad} için diğer işlemler`}
        className={cn("glass-cip relative flex h-8 w-8 items-center justify-center rounded-full text-metin-3 transition-opacity hover:text-metin", acik ? "opacity-100" : UZERINDE)}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {acik && (
        <>
          <button aria-hidden tabIndex={-1} onClick={onKapat} className="fixed inset-0 z-10 cursor-default" />
          <span role="menu" className="hf-kart absolute right-0 top-10 z-20 min-w-[210px] rounded-xl bg-yuzey p-1">
            {ogeler.map(({ etiket, ikon: I, onTikla }) => (
              <button key={etiket} role="menuitem" onClick={() => { onKapat(); onTikla(); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-metin hover:bg-white/[0.075]">
                <span className="bg-white/[0.075] text-metin-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"><I className="h-3.5 w-3.5" /></span>{etiket}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  );
}

/** Ses ekleme kartı (klonla / tasarla): renkli ikon kutusu, parıltılı zemin, ok. */
function EkleKarti({ ikon: I, renk, baslik, aciklama, rozet, onTikla }: { ikon: typeof Mic; renk: "cyan" | "mor"; baslik: string; aciklama: string; rozet?: string; onTikla: () => void }) {
  const ton = renk === "cyan" ? "#22d3ee" : "#a78bfa";
  return (
    <button onClick={onTikla} aria-label={baslik}
      className="hf-btn panel-ic panel-ic-hover group relative flex items-center gap-3.5 overflow-hidden rounded-2xl p-3 text-left">
      <span className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(160px 110px at 100% 0%, color-mix(in srgb, ${ton} 26%, transparent), transparent 70%)` }} />
      <span className={cn("bg-white/[0.075] text-metin-2 relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl")}><I className="h-5 w-5" /></span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14.5px] font-semibold text-metin">{baslik}{rozet && <span className="rounded bg-white/10 px-1 py-px text-[9px] font-bold text-metin-2">{rozet}</span>}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-metin-3">{aciklama}</span>
      </span>
      <span className="glass-cip relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 transition-transform group-hover:translate-x-0.5 group-hover:text-metin"><ChevronRight className="h-4 w-4" /></span>
    </button>
  );
}

/** Cam hap rayı (sekme / süzgeç). */
function Ray<T extends string>({ deger, onDegis, secenekler, etiket }: { deger: T; onDegis: (v: T) => void; secenekler: [T, string, typeof Mic?, number?][]; etiket: string }) {
  return (
    <div role="radiogroup" aria-label={etiket} className="glass-cip inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 [scrollbar-width:none]">
      {secenekler.map(([v, a, I, sayi]) => (
        <button key={v} role="radio" aria-checked={deger === v} onClick={() => onDegis(v)}
          className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors", deger === v ? "bg-white font-medium text-black" : "text-metin-2 hover:text-metin")}>
          {I && <I className="h-3.5 w-3.5" />}{a}
          {!!sayi && <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", deger === v ? "bg-black/10 text-black/70" : "bg-white/10 text-metin-2")}>{sayi}</span>}
        </button>
      ))}
    </div>
  );
}

/** Arama kutusu. */
function AramaKutusu({ deger, onDegis, yerTutucu }: { deger: string; onDegis: (v: string) => void; yerTutucu: string }) {
  return (
    <label className="panel-ic flex h-11 min-w-[200px] flex-1 items-center gap-2.5 rounded-xl px-3.5 focus-within:ring-1 focus-within:ring-aksan/60">
      <Search className="h-4 w-4 text-metin-3" />
      <input value={deger} onChange={(e) => onDegis(e.target.value)} placeholder={yerTutucu} aria-label={yerTutucu} spellCheck={false}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-3" />
    </label>
  );
}

/** Kullanım alanı çipleri. */
function KullanimCipleri({ deger, onDegis }: { deger: SesKullanim | "Tümü"; onDegis: (v: SesKullanim | "Tümü") => void }) {
  return (
    <div className="gizli-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&>button]:shrink-0" role="group" aria-label="Kullanım alanı">
      {(["Tümü", ...SES_KULLANIMLARI] as const).map((k) => (
        <button key={k} onClick={() => onDegis(k)} aria-pressed={deger === k}
          className={cn("hf-btn rounded-full px-3 py-1.5 text-[12.5px]", deger === k ? "bg-white font-medium text-black" : "bg-white/[0.085] text-metin-2 hover:text-metin")}>{k}</button>
      ))}
    </div>
  );
}

/** Aksan süzgeci — bayraklı, aramalı. */
function AksanSecici({ deger, onDegis }: { deger: string; onDegis: (v: string) => void }) {
  return (
    <AramaliSecici etiket="Aksan" deger={deger} onSec={onDegis} aramaYerTutucu="Aksan ara…" genislik={240}
      secenekler={[{ id: "", ad: "Tüm aksanlar", ikon: <Globe2 className="h-4 w-4 text-metin-2" /> }, ...AKSANLAR.map((a) => ({ id: a, ad: a, ikon: <Bayrak b={aksanBayrak(a)} boyut={16} /> }))]}
      tetik={(acik) => (
        <span className={cn("hf-btn flex h-11 items-center gap-2 rounded-xl px-3.5 text-[13px] text-metin", acik ? "ring-1 ring-aksan" : "panel-ic panel-ic-hover")}>
          {deger ? <Bayrak b={aksanBayrak(deger)} boyut={16} /> : <Globe2 className="h-4 w-4 text-metin-2" />}
          {deger || "Tüm aksanlar"}
        </span>
      )} />
  );
}

/** Kart başlık şeridi (bölüm kartının üstü). */
const Baslik = ({ ikon: I, metin, sayi }: { ikon: typeof Mic; metin: string; sayi?: number }) => (
  <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><I className="h-3.5 w-3.5" /></span>
    <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-metin">{metin}</span>
    {sayi !== undefined && <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{sayi}</span>}
  </div>
);

type ToplulukSesi = {
  sesId: string; sahip: string; ad: string; tanim?: string; aciklama?: string; cinsiyet: "Kadın" | "Erkek" | "Nötr";
  yas?: string; aksan?: string; dil?: string; kullanim?: SesKullanim; onizleme?: string; kullanan: number;
};

const sayiKisa = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} Mn` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(".", ",")} B` : String(n));
const dilAdi = (ad: string) => ad.toLocaleLowerCase("tr").replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr"));

/** Topluluk sesinin önizlemesini çalar/duraklatır. */
function toplulukOnizle(s: { sesId: string; onizleme?: string }) {
  if (!s.onizleme) return;
  const id = "topluluk-" + s.sesId;
  const d = sesCalici.durum();
  if (d.id === id && d.calisiyor) return sesCalici.duraklat();
  void sesCalici.cal(id, { tur: "dosya", url: s.onizleme });
}

/** Kilitli topluluk vitrini — sağlayıcı bağlı değilken neyin açılacağını gösterir. */
function ToplulukKilit({ gercek }: { gercek: boolean | null }) {
  const ozellikler: [typeof Mic, string][] = [
    [Languages, `${DILLER.length} dil ve aksan`],
    [Users, "Ses sanatçılarının paylaşımları"],
    [SlidersHorizontal, "Yaş, cinsiyet, kullanım süzgeci"],
    [Headphones, "Kullanmadan önce dinle"],
    [Heart, "Favorilere ekle"],
  ];
  return (
    <div className="panel-ic relative overflow-hidden rounded-2xl">
      <div aria-hidden className="grid grid-cols-1 gap-2 p-3 opacity-60 blur-[2px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] md:grid-cols-2 xl:grid-cols-3">
        {TOPLULUK_RENKLER.slice(0, 6).map((r, i) => (
          <div key={r} className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white/[0.045] p-2.5 ring-1 ring-inset ring-white/[0.05]">
            <span className="absolute inset-0" style={{ background: `radial-gradient(110px 80px at 0% 0%, color-mix(in srgb, ${r} 22%, transparent), transparent 70%)` }} />
            <span className="relative h-12 w-12 shrink-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${r}, color-mix(in srgb, ${r} 30%, black))` }} />
            <span className="relative flex-1 space-y-1.5">
              <span className="block h-3 rounded bg-white/15" style={{ width: `${55 + ((i * 13) % 30)}%` }} />
              <span className="block h-2.5 w-4/5 rounded bg-white/[0.08]" />
              <span className="flex gap-1"><span className="h-3.5 w-12 rounded bg-white/[0.08]" /><span className="h-3.5 w-9 rounded bg-white/[0.08]" /></span>
            </span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-80 -translate-x-1/2 rounded-full bg-aksan opacity-10 blur-3xl" />
        <span className="bg-white/[0.075] text-metin-2 relative flex h-14 w-14 items-center justify-center rounded-2xl"><Lock className="h-6 w-6" /></span>
        <p className="relative mt-4 text-[16px] font-semibold text-metin">Topluluk kütüphanesi</p>
        <p className="relative mt-1.5 max-w-md text-[13px] leading-relaxed text-metin-3">Seslendirme sanatçılarının paylaştığı on binlerce ses; dile, aksana ve kullanım alanına göre süzülür.</p>
        <span className="relative mt-3 flex max-w-lg flex-wrap justify-center gap-1.5">
          {ozellikler.map(([I, m]) => <span key={m} className="glass-cip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] text-metin-2"><I className="h-3 w-3 text-aksan" />{m}</span>)}
        </span>
        <span className="glass-cip relative mt-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-metin-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]" />{gercek === null ? "Bağlantı kontrol ediliyor…" : "Ses sağlayıcısı bağlanınca açılır"}
        </span>
      </div>
    </div>
  );
}

/** Topluluk kütüphanesi — yalnız ses sağlayıcısı bağlıyken (anahtarsız erişim filtre ve sayfa vermez). */
function Topluluk({ secili, onSec, gercek, izgara }: { secili?: string; onSec?: (s: SecilenSes) => void; gercek: boolean | null; izgara: string }) {
  const [ara, setAra] = useState("");
  const [arama, setArama] = useState("");
  const [dil, setDil] = useState("");
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>("Tümü");
  const [kullanim, setKullanim] = useState<SesKullanim | "Tümü">("Tümü");
  const [sira, setSira] = useState<"populer" | "yeni">("populer");
  const [sesler, setSesler] = useState<ToplulukSesi[]>([]);
  const [sayfa, setSayfa] = useState(0);
  const [dahaVar, setDahaVar] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const favoriler = useOzelSesler((s) => s.favoriler);
  const favoriDegistir = useOzelSesler((s) => s.favoriDegistir);
  const cal = useCalici();

  // Arama yazarken her tuşta istek atılmasın.
  useEffect(() => { const t = setTimeout(() => { if (ara.trim() !== arama) { setSayfa(0); setArama(ara.trim()); } }, 350); return () => clearTimeout(t); }, [ara, arama]);
  /** Filtre değişince aynı anda ilk sayfaya dönülür (eski sayfaya eklenmez). */
  const filtre = <T,>(fn: (v: T) => void) => (v: T) => { setSayfa(0); fn(v); };

  useEffect(() => {
    if (gercek !== true) return;
    let iptal = false;
    setYukleniyor(true); setHata(null);
    const q = new URLSearchParams({ sayfa: String(sayfa), sira: sira === "yeni" ? "yeni" : "populer" });
    if (arama) q.set("ara", arama);
    if (dil) q.set("dil", dil);
    if (cinsiyet !== "Tümü") q.set("cinsiyet", cinsiyet);
    if (kullanim !== "Tümü") q.set("kullanim", kullanim);
    fetch(`/api/ses/topluluk?${q}`).then((r) => r.json()).then((j: { ok: boolean; hata?: string; sesler?: ToplulukSesi[]; dahaVar?: boolean }) => {
      if (iptal) return;
      if (!j.ok) { setHata(j.hata ?? "Topluluk kütüphanesine ulaşılamadı."); return; }
      setSesler((onceki) => (sayfa === 0 ? j.sesler ?? [] : [...onceki, ...(j.sesler ?? [])]));
      setDahaVar(!!j.dahaVar);
    }).catch(() => { if (!iptal) setHata("Topluluk kütüphanesine ulaşılamadı."); })
      .finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
  }, [gercek, arama, dil, cinsiyet, kullanim, sira, sayfa]);

  if (gercek !== true) return <ToplulukKilit gercek={gercek} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <AramaKutusu deger={ara} onDegis={setAra} yerTutucu="Toplulukta ara: anlatıcı, derin, Türkçe…" />
          <AramaliSecici etiket="Dil" deger={dil} onSec={filtre(setDil)} aramaYerTutucu="Dil ara…" genislik={260}
            secenekler={[{ id: "", ad: "Tüm diller", ikon: <Globe2 className="h-4 w-4 text-metin-2" /> }, ...DILLER.map((d) => ({ id: d.kod, ad: dilAdi(d.ad), anahtar: d.kod, ikon: <Bayrak b={d.bayrak} boyut={16} /> }))]}
            tetik={(acik) => (
              <span className={cn("hf-btn flex h-11 items-center gap-2 rounded-xl px-3.5 text-[13px] text-metin", acik ? "ring-1 ring-aksan" : "panel-ic panel-ic-hover")}>
                {dil ? <Bayrak b={DILLER.find((d) => d.kod === dil)?.bayrak} boyut={16} /> : <Globe2 className="h-4 w-4 text-metin-2" />}
                {dil ? dilAdi(DILLER.find((d) => d.kod === dil)?.ad ?? dil) : "Tüm diller"}
              </span>
            )} />
          <Ray etiket="Sıralama" deger={sira} onDegis={filtre(setSira)} secenekler={[["populer", "Popüler", Heart], ["yeni", "Yeni", Sparkles]]} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Ray etiket="Cinsiyet" deger={cinsiyet} onDegis={filtre(setCinsiyet)} secenekler={CINSIYETLER.map((c) => [c, c] as [Cinsiyet, string])} />
          <KullanimCipleri deger={kullanim} onDegis={filtre(setKullanim)} />
        </div>
      </div>

      {hata ? (
        <p className="panel-ic rounded-2xl py-8 text-center text-[13px] text-rose-300">{hata}</p>
      ) : sesler.length === 0 && !yukleniyor ? (
        <p className="panel-ic rounded-2xl py-10 text-center text-[13px] text-metin-3">Bu filtrelere uyan topluluk sesi yok.</p>
      ) : (
        <div className={cn("grid gap-2", izgara)}>
          {sesler.map((s) => {
            const ozet: ToplulukOzet = { sesId: s.sesId, sahip: s.sahip, ad: s.ad, tanim: s.tanim ?? s.aciklama, cinsiyet: s.cinsiyet, aksan: s.aksan, kullanim: s.kullanim, onizleme: s.onizleme };
            const id = "topluluk-" + s.sesId;
            return (
              <SesKarti key={s.sesId} ad={s.ad} renk={adRengi(s.ad)} bayrak={aksanBayrak(s.aksan)} tanim={ozet.tanim}
                cipler={[s.kullanim, s.cinsiyet, s.yas, s.aksan, s.kullanan ? `${sayiKisa(s.kullanan)} kullanım` : null]}
                calan={cal.id === id && cal.calisiyor} hata={cal.id === id && !!cal.hata} dinle={!!s.onizleme} dinleKapali="Örnek kayıt yok" onDinle={() => toplulukOnizle(s)}
                favori={!!favoriler["topluluk:" + s.sesId]} onFavori={() => favoriDegistir("topluluk:" + s.sesId, ozet)}
                secili={secili === s.ad}
                onKullan={onSec ? () => onSec(topluluktanSes(ozet)) : undefined} />
            );
          })}
          {yukleniyor && Array.from({ length: sayfa === 0 ? 6 : 3 }, (_, i) => (
            <div key={"y" + i} aria-hidden className="panel-ic flex items-center gap-3 rounded-2xl p-2.5 pr-3">
              <Iskelet className="h-12 w-12 shrink-0 rounded-full" />
              <span className="min-w-0 flex-1">
                <Iskelet className="h-3.5 w-28 rounded-full" />
                <Iskelet className="mt-2 h-3 w-40 max-w-full rounded-full" />
                <span className="mt-2 flex gap-1">{[40, 52, 36].map((w) => <Iskelet key={w} className="h-4 rounded" style={{ width: w }} />)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      {dahaVar && !yukleniyor && !hata && (
        <button onClick={() => setSayfa((n) => n + 1)} className="hf-btn glass-cip mx-auto rounded-full px-5 py-2 text-[13px] font-medium text-metin">Daha fazla göster</button>
      )}
      <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-metin-3"><Info className="mt-0.5 h-3 w-3 shrink-0" />Topluluk sesleri ilk kullanımda hesabına eklenir. Bazı sesler sahibinin belirlediği ek ücrete tabi olabilir.</p>
    </div>
  );
}

export function SesKutuphanesi({ secili, onSec, gercek, onSesEkle, onTasarla, onKlonla, onRemix, kompakt }: {
  /** Seçili sesin adı (vurgulanır). */
  secili?: string;
  onSec?: (s: SecilenSes) => void;
  /** Ses sağlayıcısı bağlı mı (klonlar, tasarımlar ve topluluk yalnız o zaman kullanılabilir). */
  gercek: boolean | null;
  onSesEkle: () => void;
  onTasarla: () => void;
  /** Kaydedilmiş ama klonlanmamış bir örneği klonla (sağlayıcı bağlıyken). */
  onKlonla?: (o: OzelSes) => void;
  /** Kendi (klon/tasarım) sesinden benzerini türet — TasarimModal'ı `remixSesId` ile açar. */
  onRemix?: (o: OzelSes) => void;
  kompakt?: boolean;
}) {
  const [kaynak, setKaynak] = useState<"kutuphane" | "favoriler" | "topluluk">("kutuphane");
  const [ara, setAra] = useState("");
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>("Tümü");
  const [kullanim, setKullanim] = useState<SesKullanim | "Tümü">("Tümü");
  const [yas, setYas] = useState<Yas>("Tümü");
  const [aksan, setAksan] = useState("");
  const [silOnay, setSilOnay] = useState<string | null>(null);
  const [siliniyor, setSiliniyor] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const ozel = useOzelSesler((s) => s.sesler);
  const ozelSil = useOzelSesler((s) => s.sil);
  const favoriler = useOzelSesler((s) => s.favoriler);
  const favoriDegistir = useOzelSesler((s) => s.favoriDegistir);
  const cal = useCalici();
  const q = ara.trim().toLocaleLowerCase("tr");
  const liste = useMemo(() => SESLER.filter((s) =>
    (!q || s.ad.toLocaleLowerCase("tr").includes(q) || (s.tanim ?? "").toLocaleLowerCase("tr").includes(q) || (s.aksan ?? "").toLocaleLowerCase("tr").includes(q))
    && (cinsiyet === "Tümü" || s.cinsiyet === cinsiyet)
    && (kullanim === "Tümü" || s.kullanim === kullanim)
    && (yas === "Tümü" || s.yas === yas)
    && (!aksan || s.aksan === aksan)), [q, cinsiyet, kullanim, yas, aksan]);
  const ozelListe = ozel.filter((o) => (!q || o.ad.toLocaleLowerCase("tr").includes(q) || (o.aciklama ?? "").toLocaleLowerCase("tr").includes(q)) && (cinsiyet === "Tümü" || o.cinsiyet === cinsiyet));
  /** Kendi seslerin yalnız hazır seslere özgü süzgeçler kapalıyken listelenir. */
  const ozelGoster = kullanim === "Tümü" && yas === "Tümü" && !aksan;
  const filtreVar = !!q || cinsiyet !== "Tümü" || kullanim !== "Tümü" || yas !== "Tümü" || !!aksan;
  const favoriSayisi = Object.keys(favoriler).length;
  const izgara = kompakt ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  useEffect(() => { if (!silOnay) return; const t = setTimeout(() => setSilOnay(null), 4000); return () => clearTimeout(t); }, [silOnay]);
  const menuKapat = useMemo(() => () => setMenu(null), []);

  const onizle = (s: SesModel) => {
    const id = "onizleme-" + s.sesId;
    if (cal.id === id && cal.calisiyor) return sesCalici.duraklat();
    void sesCalici.cal(id, { tur: "dosya", url: `/api/ses/onizleme/${s.sesId}` });
  };
  const filtreTemizle = () => { setAra(""); setCinsiyet("Tümü"); setKullanim("Tümü"); setYas("Tümü"); setAksan(""); };

  /** Sesi sağlayıcıdan da siler; sağlayıcı yoksa yalnız bu cihazdan kaldırıldığı açıkça söylenir. */
  const sil = async (o: OzelSes) => {
    if (silOnay !== o.id) return setSilOnay(o.id);
    setSilOnay(null);
    if (o.durum === "klonlandi" && o.sesId && gercek) {
      setSiliniyor(o.id);
      try {
        const j = (await (await fetch(`/api/ses/klon/${o.sesId}`, { method: "DELETE" })).json()) as { ok: boolean; hata?: string };
        if (!j.ok) throw new Error(j.hata);
      } catch (e) {
        setSiliniyor(null);
        return void toast.error("Ses silinemedi", { description: `${neden(e, "Sağlayıcıya ulaşılamadı.")} Biraz sonra yeniden dene.` });
      }
      setSiliniyor(null);
    }
    if (sesCalici.durum().id === "ornek-" + o.id) sesCalici.durdur();
    ozelSil(o.id);
    void yerelDepo.sil(o.ornekAnahtar).catch(() => {});
    toast(`${o.ad} silindi`, { description: o.durum === "klonlandi" && o.sesId && !gercek ? "Ses sağlayıcısı bağlı olmadığı için yalnız bu cihazdan kaldırıldı." : undefined });
  };

  const hazirKart = (s: SesModel) => {
    const id = "onizleme-" + s.sesId;
    return (
      <SesKarti key={"h" + s.ad} ad={s.ad} renk={s.renk} bayrak={aksanBayrak(s.aksan)} tanim={s.tanim} cipler={[s.kullanim, s.cinsiyet, s.yas, s.aksan, "Çok dilli"]}
        calan={cal.id === id && cal.calisiyor} hata={cal.id === id && !!cal.hata} dinle onDinle={() => onizle(s)}
        favori={!!favoriler["hazir:" + s.ad]} onFavori={() => favoriDegistir("hazir:" + s.ad)}
        secili={secili === s.ad} onKullan={onSec ? () => onSec(hazirdanSes(s)) : undefined} />
    );
  };

  const ozelKart = (o: OzelSes) => {
    const hazir = o.durum === "klonlandi";
    const kullanilabilir = hazir && !!gercek;
    const tasarim = o.kaynak === "tasarim";
    const id = "ornek-" + o.id;
    const remixVar = !!onRemix && hazir && !!o.sesId && !!gercek;
    return (
      <SesKarti key={"o" + o.id} ad={o.ad} renk={tasarim ? TASARIM_RENK : OZEL_RENK} ustte={menu === o.id}
        tanim={o.aciklama ?? (tasarim ? "Tarifle tasarlandı" : hazir ? "Kendi sesin" : "Örnek kaydedildi, klonlanmadı")}
        cipler={[o.remixKaynak ? "Remix" : tasarim ? "Tasarım" : hazir ? "Klon" : "Örnek", o.cinsiyet, o.etiketler?.accent, o.etiketler?.age, o.etiketler?.use_case, `${Math.round(o.ornekSn)} sn örnek`]}
        calan={cal.id === id && cal.calisiyor} hata={cal.id === id && !!cal.hata} dinle onDinle={() => (cal.id === id && cal.calisiyor ? sesCalici.duraklat() : void ornekCal(o))}
        favori={!!favoriler["ozel:" + o.id]} onFavori={() => favoriDegistir("ozel:" + o.id)}
        secili={secili === o.ad}
        onKullan={onSec ? () => { if (kullanilabilir) onSec(ozeldenSes(o)); else if (!hazir && gercek && onKlonla) onKlonla(o); } : undefined}
        kullanKapali={!kullanilabilir && !(!hazir && gercek && onKlonla)}
        kullanEtiket={!hazir && gercek && onKlonla ? `Klonla · ${KLON_KREDI}` : undefined}
        kullanIpucu={kullanilabilir ? undefined : !hazir ? (gercek ? undefined : "Klonlamak için ses sağlayıcısı bağlantısı gerekli") : "Ses sağlayıcısı bağlı değil"}
        sagUst={
          <>
            {remixVar && (
              <KartMenusu ad={o.ad} acik={menu === o.id} onAc={() => setMenu(o.id)} onKapat={menuKapat}
                ogeler={[{ etiket: "Benzerini yap (Remix)", ikon: Shuffle, onTikla: () => onRemix(o) }]} />
            )}
            <button onClick={() => void sil(o)} disabled={siliniyor === o.id} aria-label={silOnay === o.id ? `${o.ad} sesini silmeyi onayla` : `${o.ad} sesini sil`}
              className={cn("relative flex h-8 shrink-0 items-center justify-center gap-1 rounded-full transition-all",
                silOnay === o.id || siliniyor === o.id ? "bg-rose-500/90 px-2.5 text-[11px] font-semibold text-white" : cn("glass-cip w-8 text-metin-3 hover:text-rose-300", UZERINDE))}>
              {siliniyor === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : silOnay === o.id ? "Sil?" : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </>
        } />
    );
  };

  const toplulukKart = (s: ToplulukOzet) => {
    const id = "topluluk-" + s.sesId;
    return (
      <SesKarti key={"t" + s.sesId} ad={s.ad} renk={adRengi(s.ad)} bayrak={aksanBayrak(s.aksan)} tanim={s.tanim}
        cipler={["Topluluk", s.kullanim, s.cinsiyet, s.aksan]}
        calan={cal.id === id && cal.calisiyor} hata={cal.id === id && !!cal.hata} dinle={!!s.onizleme} dinleKapali="Örnek kayıt yok" onDinle={() => toplulukOnizle(s)}
        favori onFavori={() => favoriDegistir("topluluk:" + s.sesId)}
        secili={secili === s.ad}
        onKullan={onSec ? () => onSec(topluluktanSes(s)) : undefined}
        kullanKapali={!gercek} kullanIpucu={gercek ? undefined : "Topluluk sesleri için ses sağlayıcısı bağlantısı gerekli"} />
    );
  };

  /** Favoriler: en son eklenen başta; silinmiş özel sesler atlanır. */
  const favoriKartlari = Object.entries(favoriler).sort((a, b) => b[1].eklendi - a[1].eklendi).map(([anahtar, f]) => {
    const [tur, ...k] = anahtar.split(":"); const deger = k.join(":");
    if (tur === "hazir") { const s = SESLER.find((x) => x.ad === deger); return s ? hazirKart(s) : null; }
    if (tur === "ozel") { const o = ozel.find((x) => x.id === deger); return o ? ozelKart(o) : null; }
    return f.topluluk ? toplulukKart(f.topluluk) : null;
  }).filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <Ray etiket="Ses kaynağı" deger={kaynak} onDegis={setKaynak}
        secenekler={[["kutuphane", "Kütüphanem", Library], ["favoriler", "Favoriler", Heart, favoriSayisi], ...(gercek ? [["topluluk", "Topluluk", Globe2] as ["topluluk", string, typeof Globe2]] : [])]} />

      {kaynak === "topluluk" ? <Topluluk secili={secili} onSec={onSec} gercek={gercek} izgara={izgara} /> : kaynak === "favoriler" ? (
        favoriKartlari.length ? (
          <section className="overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <Baslik ikon={Heart} metin="Favori seslerin" sayi={favoriKartlari.length} />
            <div className={cn("grid gap-2 p-3", izgara)}>{favoriKartlari}</div>
          </section>
        ) : (
          <div className="panel-ic relative flex flex-col items-center overflow-hidden rounded-2xl px-6 py-12 text-center">
            <span className="pointer-events-none absolute left-1/2 top-0 h-32 w-72 -translate-x-1/2 rounded-full bg-rose-400 opacity-10 blur-3xl" />
            <span className="bg-white/[0.075] text-metin-2 relative flex h-14 w-14 items-center justify-center rounded-2xl"><Heart className="h-6 w-6" /></span>
            <p className="relative mt-4 text-[16px] font-semibold text-metin">Henüz favorin yok</p>
            <p className="relative mt-1.5 max-w-sm text-[13px] leading-relaxed text-metin-3">Bir sesin küresindeki kalbe dokun; hazır, kendi ve topluluk sesleri burada bir arada durur.</p>
            <button onClick={() => setKaynak("kutuphane")} className="hf-btn glass-cip relative mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-metin"><Library className="h-3.5 w-3.5 text-aksan" /> Kütüphaneye göz at</button>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <AramaKutusu deger={ara} onDegis={setAra} yerTutucu="Ses ara: ad, aksan, karakter…" />
              <AksanSecici deger={aksan} onDegis={setAksan} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Ray etiket="Cinsiyet" deger={cinsiyet} onDegis={setCinsiyet} secenekler={CINSIYETLER.map((c) => [c, c] as [Cinsiyet, string])} />
              <Ray etiket="Yaş" deger={yas} onDegis={setYas} secenekler={YASLAR.map((y) => [y, y === "Tümü" ? "Her yaş" : y] as [Yas, string])} />
              {filtreVar && <button onClick={filtreTemizle} className="hf-btn rounded-full px-3 py-1.5 text-[12.5px] text-metin-3 hover:text-metin">Süzgeçleri temizle</button>}
            </div>
            <KullanimCipleri deger={kullanim} onDegis={setKullanim} />
          </div>

          {ozelGoster && (
            <section className="overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <Baslik ikon={Sparkles} metin="Kendi seslerin" sayi={ozelListe.length || undefined} />
              <div className={cn("grid gap-2 p-3", izgara)}>
                <EkleKarti ikon={Mic} renk="cyan" baslik="Sesini klonla" aciklama="Kısa kayıtlarla kendi sesini kopyala" rozet={`${KLON_KREDI} kredi`} onTikla={onSesEkle} />
                <EkleKarti ikon={Wand2} renk="mor" baslik="Tarifle tasarla" aciklama="Sesi kelimelerle anlat, üç seçenekten birini seç" onTikla={onTasarla} />
                {ozelListe.map(ozelKart)}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-[20px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
            <Baslik ikon={Library} metin="Hazır sesler" sayi={liste.length} />
            {liste.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="text-[13px] text-metin-3">Bu süzgeçlere uyan ses yok.</p>
                <button onClick={filtreTemizle} className="hf-btn glass-cip mt-3 rounded-full px-4 py-1.5 text-[12.5px] font-medium text-metin">Süzgeçleri temizle</button>
              </div>
            ) : (
              <div className={cn("grid gap-2 p-3", izgara)}>{liste.map(hazirKart)}</div>
            )}
            {gercek === false && (
              <div className="mx-3 mb-3 flex gap-3 rounded-[14px] bg-white/[0.045] p-3 ring-1 ring-inset ring-white/[0.06]">
                <span className="bg-white/[0.075] text-metin-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><Users className="h-4 w-4" /></span>
                <p className="text-[12px] leading-relaxed text-metin-3">
                  <span className="font-medium text-metin">Örnekler sesin gerçek kaydıdır.</span> Ses sağlayıcısı bağlı olmadığından üretimler şimdilik tarayıcının konuşma motoruyla okunur;
                  seçtiğin sesin kendisini değil, aynı cinsiyet ve dilde bir tarayıcı sesini duyarsın.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
