"use client";

import { MagazaDenetimi } from "./MagazaDenetimi";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot, Check, ChevronDown, Download, ShieldAlert, ShieldCheck, CircleDashed, Copy, ExternalLink, Eye, Globe, History, Loader2, Lock, PenLine, RotateCcw, Rocket, Sparkles, Star, Upload, Wand2, X, GitCompare,
} from "lucide-react";
import { Pencere } from "@/components/ayarlar/ui";
import { api, ApiHatasi, gorece, sahipAnahtari, yayinAdresi } from "@/lib/build/istemci";
import type { Proje, Surum } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { QrKod } from "./Onizleme";
import { bulgulariMetne, denetle, type Bulgu } from "@/lib/build/denetim";
import { Anahtar } from "@/components/build/ajanlar/AjanDuzenleyici";
import { parcala, satirFarki } from "./fark";
import type { ProjeKanca } from "./useProje";

const KAYNAK: Record<Surum["kaynak"], { ad: string; ikon: typeof Bot }> = {
  ajan: { ad: "Ajan", ikon: Sparkles }, elle: { ad: "Elle düzenleme", ikon: PenLine }, stil: { ad: "Görsel düzenleme", ikon: Wand2 },
  geri: { ad: "Geri dönüş", ikon: RotateCcw }, sablon: { ad: "Şablon", ikon: Upload },
};

/* ───────────── Geçmiş ───────────── */
export function GecmisPanel({ k, acik, kapat, odak, onizle }: { k: ProjeKanca; acik: boolean; kapat: () => void; odak?: string | null; /** Sürümü çalışma alanında salt okunur aç. */ onizle?: (s: Surum) => void }) {
  const p = k.proje as Proje;
  const [yildizli, setYildizli] = useState(false);
  const [onay, setOnay] = useState<string | null>(null);
  const [isleniyor, setIsleniyor] = useState<string | null>(null);
  const [adlandir, setAdlandir] = useState<{ id: string; ad: string } | null>(null);
  const [hata, setHata] = useState("");
  const l = useMemo(() => [...p.surumler].reverse().filter((s) => !yildizli || s.yerImi), [p.surumler, yildizli]);
  const sonId = p.surumler.at(-1)?.id;
  const [fark, setFark] = useState<{ surumId: string; yol: string } | null>(null);
  /** İki sürümü karşılaştır: seçim kipi ve seçilen sürümler (en çok iki). */
  const [kiyas, setKiyas] = useState<string[] | null>(null);
  const kiyasSec = (id: string) => setKiyas((x) => { const l = x ?? []; return l.includes(id) ? l.filter((y) => y !== id) : [...l, id].slice(-2); });
  const kiyasSurumleri = kiyas?.length === 2 ? kiyas.map((id) => p.surumler.find((x) => x.id === id)!).filter(Boolean).sort((a, b) => a.no - b.no) : null;

  const geriDon = async (s: Surum) => { setIsleniyor(s.id); try { await k.guncelle({ geriYukle: s.id }); setOnay(null); } catch (e) { setHata(e instanceof Error ? e.message : "Olmadı"); } setIsleniyor(null); };
  const yayinla = async (s: Surum) => { setIsleniyor(`y${s.id}`); try { await api(`/api/build/yayinla/${p.id}`, { govde: { surumId: s.id } }); await k.yukle(); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yayınlanamadı"); } setIsleniyor(null); };

  return (
    <Pencere acik={acik} onKapat={() => { kapat(); setFark(null); setKiyas(null); }} genislik={fark || kiyasSurumleri ? 860 : 460} baslik="Geçmiş" aciklama={`${p.surumler.length} sürüm. Her ajan turu, elle düzenleme ve geri dönüş yeni bir sürümdür; hiçbir şey kaybolmaz.`}>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={() => setYildizli((x) => !x)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] ring-1 ring-inset transition-colors", yildizli ? "bg-white text-black ring-white" : "bg-white/[0.05] text-white/70 ring-white/[0.08] hover:text-white")}><Star className={cn("h-3.5 w-3.5", yildizli && "fill-current")} />Yıldızlılar</button>
        <button type="button" onClick={() => setKiyas((x) => (x ? null : []))} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] ring-1 ring-inset transition-colors", kiyas ? "bg-white text-black ring-white" : "bg-white/[0.05] text-white/70 ring-white/[0.08] hover:text-white")}><GitCompare className="h-3.5 w-3.5" />İki sürümü karşılaştır</button>
        {hata && <span className="truncate text-[12px] text-rose-300">{hata}</span>}
      </div>
      {kiyas && !kiyasSurumleri && <p className="mb-3 rounded-[12px] bg-white/[0.04] px-3 py-2.5 text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.07]">{kiyas.length ? "Bir sürüm daha seç." : "Karşılaştırmak istediğin iki sürümü seç."}</p>}
      {kiyasSurumleri && <SurumKiyasi a={kiyasSurumleri[0]} b={kiyasSurumleri[1]} kapat={() => setKiyas([])} />}
      {!l.length && <p className="py-8 text-center text-[13px] text-white/45">{yildizli ? "Yıldızlı sürüm yok. Önemli anları yıldızla işaretle, burada kolayca bul." : "Henüz sürüm yok."}</p>}
      <div className="space-y-2">
        {l.map((s) => {
          const K = KAYNAK[s.kaynak];
          const yayinda = p.yayin?.surumId === s.id;
          const ekle = s.degisen.reduce((t, d) => t + d.ekle, 0), sil = s.degisen.reduce((t, d) => t + d.sil, 0);
          return (
            <div key={s.id} className={cn("rounded-[16px] bg-white/[0.03] p-3 ring-inset", kiyas?.includes(s.id) ? "ring-2 ring-white" : odak === s.id ? "ring-1 ring-white/70" : "ring-1 ring-white/[0.07]")}>
              <div className="flex items-start gap-2.5">
                {kiyas && <button type="button" role="checkbox" aria-checked={kiyas.includes(s.id)} aria-label={`Sürüm ${s.no} karşılaştırmaya ekle`} onClick={() => kiyasSec(s.id)} className={cn("mt-1.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] ring-inset", kiyas.includes(s.id) ? "bg-white/[0.12] ring-2 ring-white" : "ring-1 ring-white/30 hover:ring-white/60")}>{kiyas.includes(s.id) && <span className="h-2 w-2 rounded-[3px] bg-white" />}</button>}
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><K.ikon className="h-3.5 w-3.5 text-white/65" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-white">Sürüm {s.no}
                    {s.id === sonId && <span className="rounded-full bg-white/[0.08] px-1.5 py-px text-[10.5px] font-medium text-white/70">Şu anki</span>}
                    {yayinda && <span className="flex items-center gap-1 rounded-full bg-[#55d6fd]/12 px-1.5 py-px text-[10.5px] font-medium text-[#55d6fd]"><span className="h-1 w-1 rounded-full bg-[#55d6fd]" />Yayında</span>}
                  </p>
                  {adlandir?.id === s.id ? (
                    <form onSubmit={async (e) => { e.preventDefault(); await k.guncelle({ surumAdi: { surumId: s.id, ad: adlandir.ad } }); setAdlandir(null); }}>
                      <input autoFocus value={adlandir.ad} onChange={(e) => setAdlandir({ id: s.id, ad: e.target.value })} onBlur={() => setAdlandir(null)} maxLength={120} className="mt-1 h-8 w-full rounded-[8px] bg-white/[0.06] px-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/25" />
                    </form>
                  ) : <p className="mt-0.5 text-[12.5px] leading-snug text-white/70">{s.aciklama}</p>}
                  <p className="mt-1 text-[11.5px] text-white/40">{K.ad} · {gorece(s.zaman)} · {s.degisen.length} dosya{ekle ? <span className="text-emerald-300/70"> · {ekle} ekleme</span> : null}{sil ? <span className="text-rose-300/60"> · {sil} silme</span> : null}</p>
                </div>
                <button type="button" title={s.yerImi ? "Yıldızı kaldır" : "Yıldızla"} onClick={() => k.guncelle({ yerImi: { surumId: s.id, acik: !s.yerImi } })} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.06]", s.yerImi ? "text-amber-300" : "text-white/35 hover:text-white")}><Star className={cn("h-3.5 w-3.5", s.yerImi && "fill-current")} /></button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[42px]">
                {onizle && s.id !== sonId ? <button type="button" onClick={() => onizle(s)} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-white/70 hover:text-white"><Eye className="h-3 w-3" />Önizle</button> : null}<a href={`/api/build/onizleme/${p.id}/${p.onizlemeBelirteci}~${s.id}/`} target="_blank" rel="noopener" title="Yeni sekmede aç" className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-white/70 hover:text-white"><ExternalLink className="h-3 w-3" />{onizle && s.id !== sonId ? "" : "Önizle"}</a>
                {s.id !== sonId && (onay === s.id ? (
                  <span className="flex items-center gap-1">
                    <button type="button" disabled={!!isleniyor} onClick={() => geriDon(s)} className="inline-flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[12px] font-semibold text-black">{isleniyor === s.id && <Loader2 className="h-3 w-3 animate-spin" />}Evet, bu sürüme dön</button>
                    <button type="button" onClick={() => setOnay(null)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06]"><X className="h-3 w-3" /></button><span className="basis-full text-[11.5px] text-white/45">Kod ve dosyalar bu sürüme döner; veritabanı kayıtları olduğu gibi kalır.</span>
                  </span>
                ) : <button type="button" onClick={() => setOnay(s.id)} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-white/70 hover:text-white"><RotateCcw className="h-3 w-3" />Bu sürüme dön</button>)}
                {!yayinda && <button type="button" disabled={!!isleniyor} onClick={() => yayinla(s)} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-white/70 hover:text-white">{isleniyor === `y${s.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}Bunu yayınla</button>}
                <button type="button" onClick={() => setAdlandir({ id: s.id, ad: s.aciklama })} className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] text-white/45 hover:text-white"><PenLine className="h-3 w-3" />Adlandır</button>
              </div>
              {s.degisen.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1 pl-[42px]">
                  {s.degisen.slice(0, 12).map((d) => {
                    const ac = fark?.surumId === s.id && fark.yol === d.yol;
                    return (
                      <button key={d.yol} type="button" onClick={() => setFark(ac ? null : { surumId: s.id, yol: d.yol })}
                        className={cn("inline-flex h-7 max-w-full items-center gap-1.5 rounded-[9px] px-2 font-mono text-[11.5px] ring-1 ring-inset transition-colors", ac ? "bg-white/[0.1] text-white ring-white/60" : "bg-white/[0.03] text-white/60 ring-white/[0.07] hover:text-white")}>
                        <span className="truncate">{d.yol}</span>{d.ekle > 0 && <span className="text-emerald-300/80">{d.ekle}</span>}{d.sil > 0 && <span className="text-rose-300/70">{d.sil}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
              {fark?.surumId === s.id && <FarkGorunumu p={p} s={s} yol={fark.yol} />}
            </div>
          );
        })}
      </div>
    </Pencere>
  );
}

/* ───────────── İki sürüm kıyası ───────────── */
function SurumKiyasi({ a, b, kapat }: { a: Surum; b: Surum; kapat: () => void }) {
  const dosyalar = useMemo(() => {
    const l = [...new Set([...Object.keys(a.dosyalar), ...Object.keys(b.dosyalar)])].sort();
    return l.flatMap((yol) => {
      const e = a.dosyalar[yol], y = b.dosyalar[yol];
      if (e === y) return [];
      const f = satirFarki(e ?? "", y ?? "");
      return [{ yol, durum: e === undefined ? "eklendi" : y === undefined ? "silindi" : "degisti", ekle: f.filter((x) => x.tur === "ekle").length, sil: f.filter((x) => x.tur === "sil").length }];
    });
  }, [a, b]);
  const [acik, setAcik] = useState<string | null>(null);
  const kutu = useRef<HTMLDivElement>(null);
  useEffect(() => { kutu.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [a.id, b.id]);
  useEffect(() => setAcik(dosyalar[0]?.yol ?? null), [dosyalar]);
  return (
    <div ref={kutu} className="mb-4 scroll-mt-2 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.1]">
      <div className="mb-2.5 flex items-center gap-2">
        <GitCompare className="h-4 w-4 text-[#8be6ff]" />
        <p className="flex-1 text-[13px] font-semibold text-white">Sürüm {a.no} ile Sürüm {b.no} arası <span className="font-normal text-white/45">· {dosyalar.length} dosya farklı</span></p>
        <button type="button" onClick={kapat} aria-label="Kıyası kapat" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.06] hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>
      {!dosyalar.length ? <p className="py-3 text-[12.5px] text-white/50">İki sürümde dosyalar aynı.</p> : (
        <>
          <div className="flex flex-wrap gap-1">
            {dosyalar.map((d) => (
              <button key={d.yol} type="button" onClick={() => setAcik(d.yol)} className={cn("inline-flex h-7 max-w-full items-center gap-1.5 rounded-[9px] px-2 text-[11.5px] ring-inset transition-colors", acik === d.yol ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.03] text-white/60 ring-1 ring-white/[0.07] hover:text-white")}>
                <span className="truncate">{d.yol}</span>
                {d.durum !== "degisti" ? <span className={d.durum === "eklendi" ? "text-emerald-300/80" : "text-rose-300/70"}>{d.durum === "eklendi" ? "yeni" : "silindi"}</span> : <>{d.ekle > 0 && <span className="text-emerald-300/80">{d.ekle}</span>}{d.sil > 0 && <span className="text-rose-300/70">{d.sil}</span>}</>}
              </button>
            ))}
          </div>
          {acik && <DosyaFarki yol={acik} eski={a.dosyalar[acik] ?? ""} yeni={b.dosyalar[acik] ?? ""} etiket={`Sürüm ${a.no} ile Sürüm ${b.no} arası`} />}
        </>
      )}
    </div>
  );
}

/* ───────────── Sürüm farkı ───────────── */
function FarkGorunumu({ p, s, yol }: { p: Proje; s: Surum; yol: string }) {
  const onceki = p.surumler[p.surumler.findIndex((x) => x.id === s.id) - 1];
  return <DosyaFarki yol={yol} eski={onceki?.dosyalar[yol] ?? ""} yeni={s.dosyalar[yol] ?? ""} etiket={onceki ? `Sürüm ${onceki.no} ile Sürüm ${s.no} arası` : "İlk sürüm"} />;
}

function DosyaFarki({ yol, eski, yeni, etiket }: { yol: string; eski: string; yeni: string; etiket: string }) {
  const parcalar = useMemo(() => parcala(satirFarki(eski, yeni)), [eski, yeni]);
  return (
    <div className="mt-2.5 overflow-hidden rounded-[12px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 text-[11.5px] text-white/50">
        <span className="font-mono">{yol}</span><span>{etiket}</span>
      </div>
      <div className="max-h-[420px] overflow-auto py-1 font-mono text-[11.5px] leading-[1.65] [scrollbar-width:thin]">
        {parcalar.map((x, i) => x.tur === "atla" ? (
          <div key={i} className="my-0.5 bg-white/[0.03] px-3 py-0.5 text-center text-[11px] text-white/35">{x.adet} satır aynı</div>
        ) : (
          <div key={i} className={cn("flex min-w-max", x.tur === "ekle" ? "bg-emerald-400/[0.09]" : x.tur === "sil" ? "bg-rose-500/[0.09]" : "")}>
            <span className="w-10 shrink-0 select-none pr-2 text-right text-white/20">{x.eski ?? ""}</span>
            <span className="w-10 shrink-0 select-none pr-2 text-right text-white/20">{x.yeni ?? ""}</span>
            <span className={cn("w-3 shrink-0 select-none", x.tur === "ekle" ? "bg-emerald-400/60" : x.tur === "sil" ? "bg-rose-400/60" : "")} style={{ width: 2, marginRight: 10 }} />
            <span className={cn("whitespace-pre pr-4", x.tur === "ekle" ? "text-emerald-100" : x.tur === "sil" ? "text-rose-100/80 line-through decoration-rose-300/30" : "text-white/55")}>{x.metin || " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Mağaza görselleri ───────────── */
function MagazaGorselleri({ p }: { p: Proje }) {
  const [basliklar, setBasliklar] = useState<string[]>([p.ad, p.ayarlar.seo.aciklama || "Her gün yanında", "Basit, hızlı, senin için"]);
  const [d, setD] = useState<"" | "uretiliyor" | "hazir" | string>("");
  const uret = async () => {
    setD("uretiliyor");
    try {
      const r = await fetch(`/api/build/magaza/${p.id}`, { method: "POST", headers: { "x-build-sahip": sahipAnahtari(), "Content-Type": "application/json" }, body: JSON.stringify({ basliklar: basliklar.map((x) => x.trim()).filter(Boolean) }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.hata || "Üretilemedi."); }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(await r.blob()); a.download = `${p.ayarlar.altAlan}-magaza-gorselleri.zip`; a.click();
      setD("hazir");
    } catch (e) { setD((e as Error).message); }
  };
  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4">
      <p className="text-[13px] font-semibold text-white">Mağaza görselleri</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-white/45">Uygulamanın ekranları çekilir, başlıklı App Store ve Google Play görseline (1290 × 2796) dönüştürülür.</p>
      <div className="mt-2.5 space-y-1.5">
        {basliklar.map((b, i) => (
          <input key={i} value={b} maxLength={60} onChange={(e) => setBasliklar((l) => l.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Görsel ${i + 1} başlığı`}
            className="h-9 w-full rounded-[10px] bg-white/[0.05] px-3 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/30" />
        ))}
      </div>
      <button type="button" onClick={uret} disabled={d === "uretiliyor"} className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-60">
        {d === "uretiliyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}{d === "uretiliyor" ? "Ekranlar çekiliyor" : "Görselleri üret ve indir"}
      </button>
      {d && d !== "uretiliyor" && d !== "hazir" && <p className="mt-2 text-[12px] text-rose-300">{d}</p>}
      {d === "hazir" && <p className="mt-2 text-[12px] text-emerald-300/80">İndirildi. Zip'teki görselleri mağaza panelinde ekran görüntüsü olarak yükle.</p>}
    </div>
  );
}

/* ───────────── Mağaza hazırlığı (mobil) ───────────── */
function MagazaSihirbazi({ p, adres, duzelt }: { p: Proje; adres: string; duzelt: (metin: string) => void }) {
  const d = p.dosyalar;
  const html = d["index.html"] ?? "";
  const manifest = Object.keys(d).find((y) => /manifest\.(webmanifest|json)$/.test(y));
  let man: { name?: string; short_name?: string; icons?: { sizes?: string; src?: string }[]; display?: string; start_url?: string; theme_color?: string } = {};
  try { man = manifest ? JSON.parse(d[manifest]) : {}; } catch { /* bozuk */ }
  const kontroller = [
    { ad: "Uygulama bildirimi (manifest)", ok: !!manifest && /rel=["']manifest["']/.test(html), ipucu: "manifest.webmanifest dosyası ve index.html'de bağlantısı" },
    { ad: "Uygulama adı", ok: !!(man.name && man.short_name), ipucu: "name ve short_name alanları" },
    { ad: "Tam ekran açılış", ok: man.display === "standalone" || man.display === "fullscreen", ipucu: "display: standalone" },
    { ad: "Simge", ok: !!man.icons?.length, ipucu: "En az bir simge; mağaza için 512 piksel önerilir" },
    { ad: "Tema rengi", ok: !!man.theme_color || /name=["']theme-color["']/.test(html), ipucu: "theme-color" },
    { ad: "Mobil görünüm", ok: /name=["']viewport["']/.test(html), ipucu: "viewport etiketi" },
    { ad: "Yayında", ok: !!p.yayin, ipucu: "Paketleme yayındaki adres üzerinden yapılır" },
  ];
  const hazir = kontroller.every((x) => x.ok);
  return (
    <div className="mt-5 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
      <p className="text-[14px] font-semibold text-white">Mağazalarda yayınla</p>
      <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">Uygulaman bir PWA olarak hazırlanır; Google Play ve App Store paketi bu adresten üretilir. Mağaza hesapları senin adına açılır: Google Play bir kerelik 25 dolar, Apple yıllık 99 dolar.</p>
      <div className="mt-3 space-y-1.5">
        {kontroller.map((x) => (
          <p key={x.ad} className="flex items-center gap-2 text-[12.5px]">
            {x.ok ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <CircleDashed className="h-3.5 w-3.5 shrink-0 text-white/35" />}
            <span className={x.ok ? "text-white/80" : "text-white/55"}>{x.ad}</span>{!x.ok && <span className="truncate text-white/35">· {x.ipucu}</span>}
          </p>
        ))}
      </div>
      {!hazir && <p className="mt-3 text-[12px] text-white/45">Eksikleri ajana tek cümleyle yaptırabilirsin: &quot;Uygulamayı mağaza yayınına hazırla&quot;.</p>}
      <MagazaDenetimi p={p} duzelt={duzelt} />
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <a href={hazir ? `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(adres)}` : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!hazir}
          className={cn("flex items-center gap-2.5 rounded-[14px] p-3 ring-1 ring-inset", hazir ? "bg-white/[0.05] ring-white/[0.1] hover:bg-white/[0.08]" : "pointer-events-none opacity-40 ring-white/[0.06]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/googleplay.svg" alt="" className="h-4 w-4" /><span><span className="block text-[13px] text-white">Google Play</span><span className="text-[11.5px] text-white/45">Android paketi (.aab)</span></span>
        </a>
        <a href={hazir ? `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(adres)}` : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!hazir}
          className={cn("flex items-center gap-2.5 rounded-[14px] p-3 ring-1 ring-inset", hazir ? "bg-white/[0.05] ring-white/[0.1] hover:bg-white/[0.08]" : "pointer-events-none opacity-40 ring-white/[0.06]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/appstore.svg" alt="" className="h-4 w-4" /><span><span className="block text-[13px] text-white">App Store</span><span className="text-[11.5px] text-white/45">iOS paketi (Xcode)</span></span>
        </a>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-white/35">Paketler, Microsoft&apos;un açık kaynaklı PWABuilder aracıyla senin yayın adresinden üretilir. Adresin herkese açık olmalı.</p>
      <MagazaGorselleri p={p} />
    </div>
  );
}

/* ───────────── Yayınla ───────────── */
/** Yayın öncesi denetim kartı: bulgular, seviye sayıları, ücretsiz toplu düzeltme. */
function DenetimKarti({ bulgular, duzelt }: { bulgular: Bulgu[]; duzelt: () => void }) {
  const [acik, setAcik] = useState(bulgular.some((x) => x.seviye === "kritik"));
  const say = (sv: Bulgu["seviye"]) => bulgular.filter((x) => x.seviye === sv).length;
  if (!bulgular.length) {
    return (
      <div className="mt-3 flex items-center gap-2.5 rounded-[16px] bg-emerald-400/[0.06] px-3.5 py-3 text-[12.5px] text-emerald-100/85 ring-1 ring-inset ring-emerald-300/15">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />Denetim temiz: kırık bağlantı, açıkta anahtar ve eksik etiket yok.
      </div>
    );
  }
  const RENK = { kritik: "text-rose-300", uyari: "text-amber-200", bilgi: "text-white/55" } as const;
  return (
    <div className="mt-3 overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left">
        <ShieldAlert className={cn("h-4 w-4 shrink-0", say("kritik") ? "text-rose-300" : "text-amber-200")} />
        <span className="min-w-0 flex-1 text-[13px] font-medium text-white">Yayın öncesi denetim</span>
        <span className="flex shrink-0 items-center gap-1.5 text-[11.5px]">
          {say("kritik") > 0 && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-200">{say("kritik")} kritik</span>}
          {say("uyari") > 0 && <span className="rounded-full bg-amber-400/12 px-2 py-0.5 text-amber-200">{say("uyari")} uyarı</span>}
          {say("bilgi") > 0 && <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-white/60">{say("bilgi")} öneri</span>}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/40 transition-transform", acik && "rotate-180")} />
      </button>
      {acik && (
        <div className="border-t border-white/[0.06] px-3.5 py-2.5">
          <ul className="space-y-2">
            {bulgular.slice(0, 12).map((x, i) => (
              <li key={i} className="text-[12.5px] leading-snug">
                <span className={cn("font-medium", RENK[x.seviye])}>{x.baslik}</span>{x.dosya && <span className="font-mono text-[11.5px] text-white/35"> · {x.dosya}</span>}
                <span className="block text-white/50">{x.ayrinti}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={duzelt} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Hepsini ajana düzelttir</button>
          <span className="ml-2 text-[11.5px] text-white/40">Ücretsiz</span>
        </div>
      )}
    </div>
  );
}

export function YayinPanel({ k, acik, kapat, alanAdinaGit, gecmisAc, duzelt }: { k: ProjeKanca; acik: boolean; kapat: () => void; alanAdinaGit: () => void; gecmisAc: () => void; duzelt: (metin: string) => void }) {
  const p = k.proje as Proje;
  const [adim, setAdim] = useState(-1);
  const [hata, setHata] = useState("");
  const [kopya, setKopya] = useState(false);
  const [yeni, setYeni] = useState(false);
  const son = p.surumler.at(-1);
  const yayindaki = p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId) : null;
  const guncel = !!p.yayin && p.yayin.surumId === son?.id;
  const adres = yayinAdresi(p.ayarlar.altAlan);
  const bagli = p.alanAdlari.filter((a) => a.durum === "bagli");
  const ADIMLAR = ["Dosyalar denetleniyor", "Sürüm hazırlanıyor", "Yayına alınıyor"];
  // Güvenlik taraması sunucuda (veri kuralları, sırlar, webhook imzaları); kalite önerileri istemcide.
  const [tarama, setTarama] = useState<{ seviye: Bulgu["seviye"]; baslik: string; ayrinti: string; ajan?: string; yoksayildi?: unknown }[] | null>(null);
  const tara = useCallback(() => { api<{ bulgular: NonNullable<typeof tarama> }>(`/api/build/bulut/${p.id}/guvenlik`).then((v) => setTarama(v.bulgular.filter((x) => !x.yoksayildi))).catch(() => setTarama([])); }, [p.id]);
  useEffect(() => { if (acik) tara(); }, [acik, tara, son?.id]);
  const bulgular = useMemo<Bulgu[]>(() => [
    ...(tarama ?? []).map((x) => ({ seviye: x.seviye, baslik: x.baslik, ayrinti: x.ayrinti })),
    ...denetle(p.dosyalar).filter((x) => x.seviye === "bilgi"),
  ], [tarama, p.dosyalar]);
  const kritik = bulgular.some((x) => x.seviye === "kritik");
  const [riskOnay, setRiskOnay] = useState(false);

  const yayinla = async () => {
    setHata(""); setYeni(false);
    if (!p.dosyalar["index.html"]) { setHata("Projede index.html yok; giriş sayfası olmadan yayınlanamaz."); return; }
    setAdim(0);
    const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      await bekle(380); setAdim(1);
      const istek = api(`/api/build/yayinla/${p.id}`, { govde: riskOnay ? { zorla: true } : {} });
      await bekle(380); setAdim(2);
      await istek; await k.yukle();
      setAdim(3); setYeni(true);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yayınlanamadı."); setAdim(-1); tara(); }
  };

  return (
    <Pencere acik={acik} onKapat={() => { kapat(); setAdim(-1); setYeni(false); }} genislik={460} baslik={yeni ? "Yayında" : p.yayin ? "Yayın" : "Yayınla"}
      aciklama={yeni ? "Siten herkese açık. Bağlantıyı paylaşabilirsin." : p.yayin ? `Sürüm ${yayindaki?.no ?? "?"} yayında · ${gorece(p.yayin.zaman)}` : "Projeni herkesin açabileceği bir adrese koy. Yayından sonra yaptığın değişiklikler, sen yeniden yayınlayana kadar ziyaretçilere görünmez."}>
      <AnimatePresence mode="wait">
        {adim >= 0 && adim < 3 ? (
          <motion.div key="adim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-2">
            {ADIMLAR.map((a, i) => (
              <p key={a} className={cn("flex items-center gap-3 text-[14px] transition-colors", i <= adim ? "text-white" : "text-white/35")}>
                <span className="flex h-6 w-6 items-center justify-center">{i < adim ? <Check className="h-4 w-4 text-emerald-300" /> : i === adim ? <Loader2 className="h-4 w-4 animate-spin text-[#55d6fd]" /> : <CircleDashed className="h-4 w-4" />}</span>{a}
              </p>
            ))}
          </motion.div>
        ) : (
          <motion.div key="ana" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {yeni && (
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 22 }} className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
                <Check className="h-7 w-7 text-emerald-300" />
              </motion.div>
            )}
            <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
              <p className="text-[12px] text-white/45">{p.yayin ? "Yayın adresi" : "Yayınlanacağı adres"}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", p.yayin ? "bg-emerald-400" : "bg-white/25")} />
                <span className="min-w-0 flex-1 truncate text-[14.5px] text-white">{adres.gorunen}</span>
                {p.ayarlar.gorunurluk === "sifreli" && <span title="Şifreli"><Lock className="h-3.5 w-3.5 text-white/50" /></span>}
                {p.yayin && <button type="button" title="Kopyala" onClick={() => { navigator.clipboard?.writeText(adres.tam); setKopya(true); setTimeout(() => setKopya(false), 1300); }} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white">{kopya ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>}
                {p.yayin && <a href={adres.tam} target="_blank" rel="noopener noreferrer" title="Aç" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>}
              </div>
              {bagli.map((a) => (
                <div key={a.ad} className="mt-2 flex items-center gap-2 border-t border-white/[0.05] pt-2">
                  <Globe className="h-3.5 w-3.5 text-white/45" /><span className="min-w-0 flex-1 truncate text-[13.5px] text-white/85">{a.ad}</span>
                  <a href={`https://${a.ad}`} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              ))}
              {p.yayin && (
                <div className="mt-3 flex items-center gap-4 border-t border-white/[0.05] pt-3">
                  <QrKod adres={adres.tam} boyut={96} />
                  <p className="text-[12.5px] leading-relaxed text-white/50">Telefon kamerasıyla tara, siteyi gerçek cihazda aç.</p>
                </div>
              )}
            </div>

            {hata && <p className="mt-3 text-[13px] text-rose-300">{hata}</p>}
            {(!p.yayin || !guncel) && (tarama === null ? <p className="mt-3 flex items-center gap-2 px-1 text-[12.5px] text-white/50"><Loader2 className="h-3.5 w-3.5 animate-spin" />Güvenlik taranıyor</p> : <DenetimKarti bulgular={bulgular} duzelt={() => duzelt(`${bulgulariMetne(bulgular)}${(tarama ?? []).some((x) => x.ajan) ? `\nAyrıntılar:\n${(tarama ?? []).filter((x) => x.ajan).map((x) => `- ${x.ajan}`).join("\n")}` : ""}`)} />)}
            {kritik && (!p.yayin || !guncel) && (
              <div className="mt-2.5 flex items-center gap-3 rounded-[14px] px-1 py-1">
                <Anahtar acik={riskOnay} set={setRiskOnay} etiket="Kritik bulguyu biliyorum, yine de yayınla" />
                <span className="text-[12.5px] leading-snug text-white/60">Kritik bulguyu biliyorum, yine de yayınla</span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {!p.yayin ? (
                <button type="button" onClick={yayinla} disabled={!son || (kritik && !riskOnay)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black disabled:opacity-35"><Rocket className="h-4 w-4" />Yayınla</button>
              ) : !guncel ? (
                <button type="button" onClick={yayinla} disabled={kritik && !riskOnay} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black disabled:opacity-35"><Rocket className="h-4 w-4" />Değişiklikleri yayınla{son ? ` (Sürüm ${son.no})` : ""}</button>
              ) : (
                <p className="flex items-center justify-center gap-1.5 py-1 text-[13px] text-white/50"><Check className="h-3.5 w-3.5 text-emerald-300" />Son sürüm yayında</p>
              )}
              {!p.alanAdlari.length && <button type="button" onClick={alanAdinaGit} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white/[0.06] text-[13.5px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1]"><Globe className="h-4 w-4" />Kendi alan adını bağla</button>}
              <button type="button" onClick={gecmisAc} className="inline-flex h-9 items-center justify-center gap-1.5 text-[12.5px] text-white/45 hover:text-white"><History className="h-3.5 w-3.5" />Eski bir sürümü yayınlamak için Geçmiş&apos;i aç</button>
            </div>

            {p.tur === "mobil" && <MagazaSihirbazi p={p} adres={adres.tam} duzelt={duzelt} />}
          </motion.div>
        )}
      </AnimatePresence>
    </Pencere>
  );
}
