"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, CircleSlash, Clapperboard, Cookie, ExternalLink, EyeOff, Flame, Loader2, Lock, Play, RefreshCw, RotateCcw, ShieldCheck,
  SlidersHorizontal, Sparkles, Trash2, Wand2,
} from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, KodKutusu, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import type { ProjeKanca } from "@/components/build/calisma/useProje";
import { api, ApiHatasi, gorece, yayinAdresi } from "@/lib/build/istemci";
import { CIHAZ_AD, OTURUM_SINIR, sureYazi, type OturumAi, type OturumCihaz, type OturumOzet } from "@/lib/build/oturumTipler";
import type { OturumAyar } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { boyutYaz } from "./BulutGenel";
import { YanPanel, YuzeySatiri } from "./ortak";
import { CIHAZ_SIMGE, OturumOynatici } from "./OturumOynatici";

type Veri = { ayar: OturumAyar; yayinda: boolean; oturumlar: OturumOzet[]; toplam: { adet: number; bayt: number; sinir: number }; cerezBandi: boolean };
type Suzgec = { cihaz: "" | OturumCihaz; sayfa: string; isaret: ("hata" | "ofkeli" | "olu")[]; enAz: string; enAzOzel: number; zaman: string; bas: number; bit: number };
const BOS_SUZGEC: Suzgec = { cihaz: "", sayfa: "", isaret: [], enAz: "0", enAzOzel: 45, zaman: "tum", bas: 0, bit: 0 };
const ZAMANLAR = [{ id: "tum", ad: "Bütün tarihler" }, { id: "24s", ad: "Son 24 saat" }, { id: "7g", ad: "Son 7 gün" }, { id: "30g", ad: "Son 30 gün" }, { id: "ozel", ad: "Özel aralık" }];
const SURELER = [{ id: "0", ad: "Her süre" }, { id: "10", ad: "En az 10 sn" }, { id: "30", ad: "En az 30 sn" }, { id: "60", ad: "En az 1 dk" }, { id: "180", ad: "En az 3 dk" }, { id: "ozel", ad: "Özel süre" }];
const ORANLAR = [{ id: "100", ad: "Tüm ziyaretler" }, { id: "50", ad: "Yarısı" }, { id: "10", ad: "Onda biri" }];
const SAKLAMALAR = [{ id: "7", ad: "7 gün" }, { id: "30", ad: "30 gün" }, { id: "90", ad: "90 gün" }];
const ISARET_AD = { hata: "Hatalı", ofkeli: "Öfkeli tık", olu: "Sonuçsuz tık" } as const;
const gunGirdi = (z: number) => { const d = new Date(z); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Boş durum görseli: küçük bir oynatıcı (sayfa, imleç izi, işaretli zaman çubuğu); kaydın ne yaptığını gösterir. */
function MiniOynatici() {
  return (
    <div aria-hidden className="relative h-[92px] w-[150px] shrink-0 overflow-hidden rounded-[14px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.08] max-sm:hidden">
      <div className="absolute inset-x-2.5 top-2.5 h-[52px] rounded-[8px] bg-white/[0.9]">
        <span className="absolute left-2 top-2 h-1.5 w-10 rounded-full bg-black/25" />
        <span className="absolute left-2 top-5 h-1 w-16 rounded-full bg-black/12" />
        <span className="absolute left-2 top-7 h-1 w-12 rounded-full bg-black/12" />
        <span className="absolute bottom-2 left-2 h-3 w-9 rounded-full bg-black/70" />
        <svg className="absolute inset-0" viewBox="0 0 130 52"><path d="M20 44 C 40 30, 60 40, 78 20 S 104 18, 108 26" fill="none" stroke="#55d6fd" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 3" /></svg>
        <motion.span className="absolute h-3.5 w-3.5 rounded-full ring-2 ring-[#55d6fd]" style={{ left: 101, top: 19 }} animate={{ scale: [0.6, 1.4, 0.6], opacity: [1, 0, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
      </div>
      <div className="absolute inset-x-2.5 bottom-3 h-1 rounded-full bg-white/[0.12]"><span className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-[#55d6fd]" /></div>
      {[18, 44, 62, 80].map((x, i) => <span key={x} className="absolute bottom-[19px] h-1.5 w-1.5 -translate-x-1/2 rounded-full" style={{ left: `${x}%`, background: i === 2 ? "#f2b84b" : i === 3 ? "#f0627a" : "rgba(255,255,255,0.6)" }} />)}
    </div>
  );
}

/** Ayar satırı: solda ad ve açıklama, sağda denetim (telefonda alt alta). */
function Satir({ ad, alt, children, ust }: { ad: string; alt?: React.ReactNode; children?: React.ReactNode; ust?: boolean }) {
  return (
    <div className={cn("flex gap-x-4 gap-y-2.5 px-4 py-3.5 sm:px-5", ust ? "max-sm:flex-col sm:items-center" : "items-center")}>
      <div className="min-w-0 flex-1"><p className="text-[13.5px] font-medium text-white">{ad}</p>{alt && <div className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{alt}</div>}</div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Bulut > Oturumlar: ziyaretçi oturum kaydı (aç/kapat, örnekleme, saklama, gizlilik, çerez onayı), süzgeçli liste ve oynatıcı. */
export function Oturumlar({ k, ajana }: { k: ProjeKanca; ajana: (metin: string) => void }) {
  const p = k.proje!;
  /** Ekipte izleyici: oturumları görür ve oynatır; ayar değiştiremez, silemez, özet yazdıramaz (sunucu da 403 verir). */
  const izleyici = p.ekipRol === "izleyici";
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState("");
  const [kayit, setKayit] = useState<"" | "k" | "ok">("");
  const [s, setS] = useState<Suzgec>(BOS_SUZGEC);
  const [panel, setPanel] = useState(false);
  const [secili, setSecili] = useState<string | null>(null);
  const [sinir, setSinir] = useState(50);
  const [ozelOran, setOzelOran] = useState(false);
  const [ozelSaklama, setOzelSaklama] = useState(false);
  const [yenileniyor, setYenileniyor] = useState(false);
  const adres = yayinAdresi(p.ayarlar.altAlan);

  const getir = useCallback(async () => {
    try {
      const x = await api<Veri>(`/api/build/oturum/${p.id}`);
      setV(x); setHata("");
      setOzelOran((o) => o || !ORANLAR.some((r) => Number(r.id) === x.ayar.oran));
      setOzelSaklama((o) => o || !SAKLAMALAR.some((r) => Number(r.id) === x.ayar.saklama));
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Oturumlar yüklenemedi."); }
  }, [p.id]);
  useEffect(() => { getir(); }, [getir]);
  // Kayıt açıkken yeni oturumlar kendiliğinden düşsün (oynatıcı kapalıyken 15 saniyede bir).
  useEffect(() => { if (!v?.ayar.acik || secili) return; const t = setInterval(getir, 15_000); return () => clearInterval(t); }, [v?.ayar.acik, secili, getir]);

  const kaydet = async (y: Partial<OturumAyar>) => {
    if (!v) return;
    setV({ ...v, ayar: { ...v.ayar, ...y } }); setKayit("k");
    try {
      const r = await api<{ ayar: OturumAyar }>(`/api/build/oturum/${p.id}`, { method: "PATCH", govde: { ayar: y } });
      setV((x) => (x ? { ...x, ayar: r.ayar } : x)); setKayit("ok"); setTimeout(() => setKayit(""), 1400);
      k.yukle();
    } catch (e) { setKayit(""); setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); getir(); }
  };
  const yenile = async () => { setYenileniyor(true); await getir(); setYenileniyor(false); };
  const tumunuSil = async () => {
    if (!v?.oturumlar.length || !confirm(`${v.oturumlar.length} oturum kaydının hepsi silinsin mi? Bu geri alınamaz.`)) return;
    await api(`/api/build/oturum/${p.id}`, { method: "DELETE" }).catch(() => {});
    setSecili(null); getir();
  };
  const d = (x: Partial<Suzgec>) => { setS((o) => ({ ...o, ...x })); setSinir(50); };
  const temiz = !s.cihaz && !s.sayfa && !s.isaret.length && s.enAz === "0" && s.zaman === "tum";

  const tum = useMemo(() => v?.oturumlar ?? [], [v]);
  const l = useMemo(() => {
    const enAz = (s.enAz === "ozel" ? s.enAzOzel : Number(s.enAz)) * 1000;
    const simdi = Date.now();
    const [a, b] = s.zaman === "24s" ? [simdi - 864e5, simdi] : s.zaman === "7g" ? [simdi - 7 * 864e5, simdi] : s.zaman === "30g" ? [simdi - 30 * 864e5, simdi] : s.zaman === "ozel" ? [s.bas, s.bit + 864e5 - 1] : [0, Infinity];
    return tum.filter((o) => (!s.cihaz || o.cihaz === s.cihaz) && (!s.sayfa || o.sayfalar.some((x) => x.yol === s.sayfa)) && o.sure >= enAz && o.alinma >= a && o.alinma <= b
      && (!s.isaret.includes("hata") || o.hata > 0) && (!s.isaret.includes("ofkeli") || o.ofkeli > 0) && (!s.isaret.includes("olu") || o.olu > 0));
  }, [tum, s]);
  const sayfalar = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of tum) for (const y of new Set(o.sayfalar.map((x) => x.yol))) m.set(y, (m.get(y) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [tum]);
  const seciliOzet = tum.find((o) => o.id === secili) ?? null;
  const aiGeldi = useCallback((id: string, ai: OturumAi) => setV((x) => (x ? { ...x, oturumlar: x.oturumlar.map((o) => (o.id === id ? { ...o, ai } : o)) } : x)), []);
  const silindi = useCallback((id: string) => setV((x) => (x ? { ...x, oturumlar: x.oturumlar.filter((o) => o.id !== id) } : x)), []);

  if (!v) return hata ? <p className="rounded-[18px] bg-rose-500/[0.06] px-4 py-3 text-[13px] text-rose-200 ring-1 ring-inset ring-rose-300/[0.12]">{hata}</p> : <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;
  const a = v.ayar;
  const n = tum.length;
  const yuzde = (x: number) => (n ? `yüzde ${Math.round((x / n) * 100)}` : "Henüz yok");
  const ortSure = n ? tum.reduce((t, o) => t + o.sure, 0) / n : 0;
  const tiklama = tum.filter((o) => o.ofkeli > 0 || o.olu > 0).length;
  const hatali = tum.filter((o) => o.hata > 0).length;
  const doluluk = Math.min(1, v.toplam.bayt / Math.max(1, v.toplam.sinir));

  const yuzeyler = (
    <div className="space-y-4">
      <div>
        <p className="mb-1 px-2.5 text-[12px] text-white/40">Cihaz</p>
        <YuzeySatiri secili={!s.cihaz} onClick={() => d({ cihaz: "" })} ad="Bütün cihazlar" sayi={n} />
        {(["masaustu", "tablet", "telefon"] as OturumCihaz[]).map((c) => <YuzeySatiri key={c} secili={s.cihaz === c} onClick={() => d({ cihaz: s.cihaz === c ? "" : c })} ad={CIHAZ_AD[c]} sayi={tum.filter((o) => o.cihaz === c).length} />)}
      </div>
      <div>
        <p className="mb-1 px-2.5 text-[12px] text-white/40">İşaretler</p>
        {(["hata", "ofkeli", "olu"] as const).map((x) => (
          <YuzeySatiri key={x} secili={s.isaret.includes(x)} onClick={() => d({ isaret: s.isaret.includes(x) ? s.isaret.filter((y) => y !== x) : [...s.isaret, x] })} ad={ISARET_AD[x]} nokta={x === "hata" ? "#f0627a" : x === "ofkeli" ? "#f2b84b" : "#b9a4ff"} sayi={tum.filter((o) => o[x] > 0).length} />
        ))}
      </div>
      {sayfalar.length > 0 && (
        <div>
          <p className="mb-1 px-2.5 text-[12px] text-white/40">Ziyaret edilen sayfa</p>
          <YuzeySatiri secili={!s.sayfa} onClick={() => d({ sayfa: "" })} ad="Bütün sayfalar" />
          {sayfalar.map(([y, c]) => <YuzeySatiri key={y} secili={s.sayfa === y} onClick={() => d({ sayfa: s.sayfa === y ? "" : y })} ad={y} sayi={c} />)}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {hata && <p className="flex items-start gap-2 rounded-[16px] bg-rose-500/[0.06] px-4 py-2.5 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-300/[0.12]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{hata}</p>}

      <Kart ikon={Clapperboard} baslik="Oturum kaydı" alt="Ziyaretçilerin sitende ne yaptığını video gibi izle; form alanları her zaman gizlenir"
        sag={izleyici ? <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/60">{a.acik ? "Kayıt açık" : "Kayıt kapalı"}</span> : <span className="flex items-center gap-2.5"><span className="text-[12.5px] text-white/55 max-sm:hidden">{kayit === "k" ? "Kaydediliyor" : kayit === "ok" ? "Kaydedildi" : a.acik ? "Kayıt açık" : "Kayıt kapalı"}</span><Anahtar acik={a.acik} set={(x) => kaydet({ acik: x })} etiket="Oturum kaydı" /></span>}>
        <div className="grid grid-cols-2 gap-px overflow-hidden bg-white/[0.05] lg:grid-cols-4">
          {[
            ["Oturum", n.toLocaleString("tr-TR"), `${a.saklama} gün saklanır`],
            ["Ortalama süre", n ? sureYazi(ortSure) : "Henüz yok", "Oturum başına"],
            ["Öfkeli ya da sonuçsuz tık", yuzde(tiklama), `${tiklama.toLocaleString("tr-TR")} oturumda`],
            ["Hata görülen", yuzde(hatali), `${hatali.toLocaleString("tr-TR")} oturumda`],
          ].map(([x, y, z]) => (
            <div key={x} className="bg-[#141518] px-4 py-3.5">
              <p className="truncate text-[12px] text-white/45">{x}</p>
              <motion.p key={y} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="mt-0.5 text-[17px] font-semibold tabular-nums text-white">{y}</motion.p>
              <p className="truncate text-[11.5px] text-white/40">{z}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2.5 px-4 pb-4 pt-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.07]"><div className={cn("h-full rounded-full", doluluk >= 0.9 ? "bg-amber-300" : "bg-[#55d6fd]")} style={{ width: `${Math.max(1, doluluk * 100)}%` }} /></div>
            <span className="shrink-0 text-[12px] tabular-nums text-white/50">{boyutYaz(v.toplam.bayt)} / {boyutYaz(v.toplam.sinir)}</span>
          </div>
          <p className="text-[12px] leading-relaxed text-white/40">Kayıt yalnız yayındaki sitede çalışır, yeniden yayınlamak gerekmez. Oturum başına en çok {boyutYaz(OTURUM_SINIR.oturumBayt)}; sınır dolunca en eski oturumlar silinir. IP adresi saklanmaz.</p>
          {a.acik && !v.yayinda && <p className="flex items-start gap-2 rounded-[12px] bg-amber-400/[0.07] px-3 py-2 text-[12.5px] text-amber-100/85 ring-1 ring-inset ring-amber-200/[0.12]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Proje henüz yayında değil. Yayınladığında ziyaretler kaydedilmeye başlar.</p>}
        </div>
      </Kart>

      <Kart ikon={Play} baslik="Oturumlar" alt={n ? `${l.length.toLocaleString("tr-TR")} oturum${temiz ? "" : `, ${n.toLocaleString("tr-TR")} içinden süzüldü`}` : "Kaydedilen ziyaretler burada listelenir"}
        sag={<>
          <button type="button" onClick={yenile} aria-label="Yenile" title="Yenile" className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><RefreshCw className={cn("h-4 w-4", yenileniyor && "animate-spin")} /></button>
          {n > 0 && !izleyici && <button type="button" onClick={tumunuSil} aria-label="Bütün oturumları sil" title="Bütün oturumları sil" className="flex h-9 w-9 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-200"><Trash2 className="h-4 w-4" /></button>}
        </>}>
        {!n ? (
          <div className="flex items-center gap-4 p-4 sm:p-5">
            <MiniOynatici />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-white">{a.acik ? "Henüz oturum yok" : "Kayıt kapalı"}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">{a.acik ? "Sitene gelen ilk ziyaret birkaç saniye içinde burada görünür: tıkları, kaydırmaları, takıldığı yerler ve hatalarıyla." : "Açtığında yayındaki sitenin ziyaretleri burada birikir. Her oturumu oynatabilir, öfkeli tıkları ve hataları işaretli görebilir, yapay zekâya özetletebilirsin."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!a.acik && !izleyici && <button type="button" onClick={() => kaydet({ acik: true })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Play className="h-3.5 w-3.5" fill="currentColor" />Kaydı aç</button>}
                {v.yayinda && <a href={adres.tam} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white hover:bg-white/[0.13]"><ExternalLink className="h-3.5 w-3.5" />Siteyi aç</a>}
                {a.acik && <button type="button" onClick={yenile} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white hover:bg-white/[0.13]"><RefreshCw className={cn("h-3.5 w-3.5", yenileniyor && "animate-spin")} />Yenile</button>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[420px]">
            <aside className="w-[220px] shrink-0 border-r border-white/[0.06] p-2.5 max-md:hidden">{yuzeyler}</aside>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3 sm:px-4">
                <div className="w-[210px] shrink-0 max-sm:w-[calc(50%-4px)]"><AcilirSecim deger={s.zaman} set={(x) => d({ zaman: x, ...(x === "ozel" && !s.bas ? { bas: Date.now() - 7 * 864e5, bit: Date.now() } : {}) })} l={ZAMANLAR} /></div>
                <div className="w-[160px] shrink-0 max-sm:w-[calc(50%-4px)]"><AcilirSecim deger={s.enAz} set={(x) => d({ enAz: x })} l={SURELER} /></div>
                {s.enAz === "ozel" && <label className="flex items-center gap-2 text-[12.5px] text-white/50"><span>En az</span><input type="number" min={1} max={3600} value={s.enAzOzel} onChange={(e) => d({ enAzOzel: Math.max(1, Math.min(3600, Number(e.target.value) || 1)) })} className={cn(alanSinif, "h-9 w-[84px] text-[13px]")} /><span>saniye</span></label>}
                <button type="button" onClick={() => setPanel(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] text-white md:hidden"><SlidersHorizontal className="h-3.5 w-3.5" />Süzgeçler{(s.cihaz || s.sayfa || s.isaret.length > 0) && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}</button>
                {!temiz && <button type="button" onClick={() => d(BOS_SUZGEC)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Temizle</button>}
                {s.zaman === "ozel" && (
                  <div className="flex w-full flex-wrap items-center gap-2 text-[12.5px] text-white/50">
                    <input type="date" value={gunGirdi(s.bas)} max={gunGirdi(s.bit)} onChange={(e) => { const z = new Date(`${e.target.value}T00:00`).getTime(); if (z) d({ bas: z }); }} className={cn(alanSinif, "h-9 w-auto text-[12.5px] [color-scheme:dark]")} />
                    <span>ile</span>
                    <input type="date" value={gunGirdi(s.bit)} min={gunGirdi(s.bas)} onChange={(e) => { const z = new Date(`${e.target.value}T00:00`).getTime(); if (z) d({ bit: z }); }} className={cn(alanSinif, "h-9 w-auto text-[12.5px] [color-scheme:dark]")} />
                    <span>arası</span>
                  </div>
                )}
              </div>
              {!l.length ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <SlidersHorizontal className="h-6 w-6 text-white/25" />
                  <p className="text-[13.5px] text-white/65">Bu süzgeçlere uyan oturum yok.</p>
                  <button type="button" onClick={() => d(BOS_SUZGEC)} className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12]"><RotateCcw className="h-3.5 w-3.5" />Süzgeçleri temizle</button>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {l.slice(0, sinir).map((o, i) => {
                    const CS = CIHAZ_SIMGE[o.cihaz], ilk = o.sayfalar[0]?.yol ?? "index.html", ek = Math.max(0, o.sayfalar.length - 1);
                    return (
                      <motion.button key={o.id} type="button" onClick={() => setSecili(o.id)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }}
                        className="group flex w-full items-center gap-3 px-3 py-3 max-md:items-start text-left transition-colors hover:bg-white/[0.035] sm:px-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/75 ring-1 ring-inset ring-white/[0.07]" title={`${CIHAZ_AD[o.cihaz]}${o.en ? `, ${o.en} piksel` : ""}`}><CS className="h-[18px] w-[18px]" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-baseline gap-1.5"><span className="truncate text-[13.5px] font-medium text-white">{ilk}</span><span className="shrink-0 text-[12px] text-white/45">{ek ? `ve ${ek} sayfa daha` : "tek sayfa"}</span></span>
                          <span className="mt-0.5 block truncate text-[12px] text-white/45">{[gorece(o.alinma), o.tarayici, o.ulke, o.ref ? `${o.ref} üzerinden` : ""].filter(Boolean).join(" · ")}</span>
                          <span className="mt-1.5 flex flex-wrap gap-1.5 md:hidden"><Isaretler o={o} /></span>
                        </span>
                        <span className="hidden max-w-[300px] shrink-0 flex-wrap justify-end gap-1.5 md:flex"><Isaretler o={o} /></span>
                        <span className="w-[64px] shrink-0 text-right text-[13px] tabular-nums text-white/80">{sureYazi(o.sure)}</span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors group-hover:bg-white group-hover:text-black max-sm:hidden"><Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" /></span>
                      </motion.button>
                    );
                  })}
                  {l.length > sinir && <div className="p-3 text-center"><button type="button" onClick={() => setSinir((x) => x + 50)} className="inline-flex h-9 items-center rounded-full bg-white/[0.07] px-4 text-[12.5px] text-white hover:bg-white/[0.12]">Daha fazla göster ({(l.length - sinir).toLocaleString("tr-TR")})</button></div>}
                </div>
              )}
            </div>
          </div>
        )}
      </Kart>

      <fieldset disabled={izleyici} className="min-w-0 space-y-4">
        {izleyici && <p className="flex items-start gap-2 rounded-[16px] bg-white/[0.04] px-4 py-2.5 text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.07]"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />Bu projede izleyicisin. Oturumları izleyebilirsin; kayıt ayarlarını yalnız proje sahibi ve düzenleyiciler değiştirir.</p>}
        <Kart ikon={SlidersHorizontal} baslik="Kayıt ayarları" alt="Kimin, ne kadar süreyle ve hangi koşulda kaydedileceği">
          <div className="divide-y divide-white/[0.05]">
            <Satir ad="Örnekleme" alt="Karar oturum başında bir kez verilir; bir ziyaretçinin bütün sayfaları birlikte kaydedilir." ust>
              <Secici id="oturum-oran" kucuk deger={ozelOran ? "ozel" : String(a.oran)} set={(x) => { if (x === "ozel") setOzelOran(true); else { setOzelOran(false); kaydet({ oran: Number(x) }); } }} l={[...ORANLAR, { id: "ozel", ad: "Özel" }]} />
              {ozelOran && <label className="flex items-center gap-2 text-[12.5px] text-white/50"><span>yüzde</span><input type="number" min={1} max={100} defaultValue={a.oran} onBlur={(e) => kaydet({ oran: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} className={cn(alanSinif, "h-9 w-[76px] text-[13px]")} /></label>}
            </Satir>
            <Satir ad="Saklama süresi" alt="Süresi dolan oturumlar kendiliğinden silinir." ust>
              <Secici id="oturum-saklama" kucuk deger={ozelSaklama ? "ozel" : String(a.saklama)} set={(x) => { if (x === "ozel") setOzelSaklama(true); else { setOzelSaklama(false); kaydet({ saklama: Number(x) }); } }} l={[...SAKLAMALAR, { id: "ozel", ad: "Özel" }]} />
              {ozelSaklama && <label className="flex items-center gap-2 text-[12.5px] text-white/50"><input type="number" min={1} max={90} defaultValue={a.saklama} onBlur={(e) => kaydet({ saklama: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })} className={cn(alanSinif, "h-9 w-[70px] text-[13px]")} /><span>gün, en çok 90</span></label>}
            </Satir>
            <Satir ad="Çerez onayını bekle" alt={<>Vayra Build sitene çerez bandı eklemiyor ve kayıt çerez kullanmıyor; oturum kimliği yalnız o sekmenin belleğinde durur. Sitende kendi bandın varsa kayıt, bant analitik onayını verene kadar başlamaz.</>}>
              <Anahtar acik={a.onayBekle} set={(x) => kaydet({ onayBekle: x })} etiket="Çerez onayını bekle" />
            </Satir>
            <AnimatePresence initial={false}>
              {a.onayBekle && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-2.5 px-4 py-3.5 sm:px-5">
                    <KodKutusu kod={`// Çerez bandın analitik onayını verince\nvayra.kayit.onayla();\n// Ziyaretçi onayı geri alınca\nvayra.kayit.reddet();`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Cookie className="h-3.5 w-3.5 text-white/40" />
                      <span className="min-w-0 flex-1 text-[12px] text-white/45">Bandın yoksa Build ajanı kurabilir.</span>
                      <button type="button" onClick={() => ajana("Siteye KVKK uyumlu bir çerez bandı ekle: Zorunlu, Analitik ve Pazarlama seçenekleri olsun, Kabul et / Reddet / Ayarlar düğmeleri bulunsun ve seçim localStorage'da saklansın. Analitik onayı verilince vayra.kayit.onayla(), reddedilince ya da geri alınınca vayra.kayit.reddet() çağır. Bant her sayfada görünsün, telefonda da düzgün dursun.")} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Wand2 className="h-3.5 w-3.5" />Ajana kurdur</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Kart>

        <Kart ikon={ShieldCheck} baslik="Gizlilik" alt="Kayda neyin girmediği; ziyaretçi verisi oynatmada da görünmez">
          <div className="grid gap-px bg-white/[0.05] sm:grid-cols-3">
            {([
              [Lock, "Form alanları maskelenir", "Yazılanın yerine yıldız görünür; değerler sunucuya hiç gelmez."],
              [EyeOff, "Parola, kart ve kimlik kaydedilmez", "Kart numarası, CVV, IBAN, TC kimlik ve tek kullanımlık kod alanları kayıtta boş kutudur."],
              [ShieldCheck, "E-posta ve uzun sayılar yıldızlanır", "Sayfa metnindeki e-posta adresi, telefon ve 9 haneden uzun sayılar. IP adresi saklanmaz."],
            ] as const).map(([I, x, y]) => (
              <div key={x} className="bg-[#141518] px-4 py-3.5 sm:px-5">
                <span className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.07] text-white/80"><I className="h-3.5 w-3.5" /></span><span className="text-[11.5px] text-white/45">Her zaman</span></span>
                <p className="mt-2 text-[13.5px] font-medium leading-snug text-white">{x}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">{y}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-white/[0.05] border-t border-white/[0.05]">
            <Satir ad="Metinleri de maskele" alt="Sayfadaki bütün yazılar yıldızlanır; tıklanan öğe ve alan adları da gönderilmez. Düzen görünür, içerik görünmez.">
              <Anahtar acik={a.metinMaskele} set={(x) => kaydet({ metinMaskele: x })} etiket="Metinleri de maskele" />
            </Satir>
            <Satir ad="İzlenmek istemeyenleri kaydetme" alt="Tarayıcısında Do Not Track ya da Global Privacy Control açık olan ziyaretçiler kaydedilmez.">
              <Anahtar acik={a.izlemeIstemeyen} set={(x) => kaydet({ izlemeIstemeyen: x })} etiket="İzlenmek istemeyenleri kaydetme" />
            </Satir>
            <div className="flex gap-x-5 gap-y-2.5 px-4 py-3.5 sm:px-5 max-lg:flex-col lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-white">Bir bölümü tamamen gizle</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">data-vayra-gizli öznitelikli öğe ve içindeki her şey kayıtta yalnız boş bir kutu olarak görünür.</p>
              </div>
              <div className="min-w-0 lg:w-[360px] lg:shrink-0">
              <KodKutusu kod={`<section data-vayra-gizli>\n  Hesap bilgilerin, sipariş geçmişin\n</section>`} />
              </div>
            </div>
          </div>
        </Kart>
      </fieldset>

      <YanPanel acik={panel} kapat={() => setPanel(false)} baslik="Süzgeçler" alt={`${l.length.toLocaleString("tr-TR")} oturum`} alt2={<><button type="button" onClick={() => d(BOS_SUZGEC)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white"><RotateCcw className="h-3.5 w-3.5" />Temizle</button><span className="flex-1" /><button type="button" onClick={() => setPanel(false)} className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black">Göster</button></>}>
        {yuzeyler}
      </YanPanel>

      <OturumOynatici projeId={p.id} izleyici={izleyici} ozet={seciliOzet} kapat={() => setSecili(null)} silindi={silindi} ajana={ajana} aiGeldi={aiGeldi} />
    </div>
  );
}

/** Satırdaki işaret hapları: öfkeli tık, sonuçsuz tık, hata, yapay zekâ özeti, sınırda kesildi. */
function Isaretler({ o }: { o: OturumOzet }) {
  const hap = "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-medium tabular-nums";
  return (
    <>
      {o.ofkeli > 0 && <span className={cn(hap, "bg-amber-400/[0.1] text-amber-200")}><Flame className="h-3 w-3" />Öfkeli tık {o.ofkeli}</span>}
      {o.olu > 0 && <span className={cn(hap, "bg-violet-400/[0.1] text-violet-200")}><CircleSlash className="h-3 w-3" />Sonuçsuz tık {o.olu}</span>}
      {o.hata > 0 && <span className={cn(hap, "bg-rose-500/[0.12] text-rose-200")}><AlertTriangle className="h-3 w-3" />Hata {o.hata}</span>}
      {o.ai && <span className={cn(hap, "bg-white/[0.06] text-white/65")} title="Yapay zekâ özeti var"><Sparkles className="h-3 w-3" />Özet</span>}
      {o.dolu && <span className={cn(hap, "bg-white/[0.06] text-white/50")}>Sınırda kesildi</span>}
    </>
  );
}
