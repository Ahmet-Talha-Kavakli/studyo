"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Link2, Loader2, Radio, RotateCcw, ScrollText, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Alan, SEVIYE_SERI, YanPanel, YiginCubuk, YuzeySatiri, sureYaz, zamanEtiketi } from "./ortak";

export type DisIstek = { a: string; y: string; d: number; ms: number; h?: string };
export type Gunluk = {
  z: number; t: string; d?: number; y?: string; ms?: number; m?: string; c?: string; k?: string; i?: string; yt?: string; q?: string; u?: string; ip?: string; ua?: string; b?: number; e?: string;
  f?: { log?: string[]; dis?: DisIstek[]; hata?: string; onizleme?: boolean };
};
type Seviye = "basarili" | "uyari" | "hata";
type Gezgin = { gunlukler: Gunluk[]; hacim: { z: number; basarili: number; uyari: number; hata: number }[]; kova: number; yuzey: { tur: Record<string, number>; seviye: Record<Seviye, number>; cihaz: Record<string, number>; yol: { ad: string; adet: number }[] }; toplam: number; ortSure: number; bas: number; bit: number };

export const TUR_AD: Record<string, string> = { istek: "İstek", fonksiyon: "Fonksiyon", hata: "Tarayıcı hatası", ai: "Yapay zekâ", uye: "Üyelik", veri: "Veri", form: "Form", dosya: "Dosya", yayin: "Yayın", sistem: "Sistem", bulut: "Bulut ayarı" };
const SEVIYE_AD: Record<Seviye, string> = { basarili: "Başarılı", uyari: "Uyarı (4xx)", hata: "Hata (5xx ve hatalar)" };
const CIHAZ_AD: Record<string, string> = { masaustu: "Masaüstü", mobil: "Mobil", bot: "Bot" };
const ZAMANLAR = [{ id: "1s", ad: "Son 1 saat" }, { id: "6s", ad: "Son 6 saat" }, { id: "24s", ad: "Son 24 saat" }, { id: "3g", ad: "Son 3 gün" }, { id: "7g", ad: "Son 7 gün" }, { id: "14g", ad: "Son 14 gün" }, { id: "ozel", ad: "Özel aralık" }];
export const seviyeBul = (g: Gunluk): Seviye => (g.t === "hata" || (g.d ?? 0) >= 500 || g.f?.hata ? "hata" : (g.d ?? 0) >= 400 ? "uyari" : "basarili");
const RENK: Record<Seviye, string> = { basarili: "text-emerald-300/80", uyari: "text-amber-200", hata: "text-rose-300" };
const yerelGirdi = (z: number) => { const d = new Date(z); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const boyut = (b?: number) => (b == null ? "" : b < 1024 ? `${b} B` : `${(b / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} KB`);

type Suzgec = { turler: string[]; seviye: string[]; cihaz: string[]; yol: string; ara: string; zaman: string; bas: number; bit: number };
function adrestenOku(ilk?: string): Suzgec & { kayit: string } {
  const q = new URLSearchParams(ilk ?? (typeof window === "undefined" ? "" : location.search));
  const l = (a: string) => (q.get(a) ?? "").split(",").filter(Boolean);
  return { turler: l("tur"), seviye: l("seviye"), cihaz: l("cihaz"), yol: q.get("yol") ?? "", ara: q.get("ara") ?? "", zaman: ZAMANLAR.some((z) => z.id === q.get("zaman")) ? q.get("zaman")! : "24s", bas: Number(q.get("bas")) || Date.now() - 864e5, bit: Number(q.get("bit")) || Date.now(), kayit: q.get("kayit") ?? "" };
}
function suzgecSorgu(s: Suzgec) {
  const q = new URLSearchParams();
  if (s.turler.length) q.set("tur", s.turler.join(","));
  if (s.seviye.length) q.set("seviye", s.seviye.join(","));
  if (s.cihaz.length) q.set("cihaz", s.cihaz.join(","));
  if (s.yol) q.set("yol", s.yol);
  if (s.ara) q.set("ara", s.ara);
  if (s.zaman !== "24s") q.set("zaman", s.zaman);
  if (s.zaman === "ozel") { q.set("bas", String(s.bas)); q.set("bit", String(s.bit)); }
  return q;
}

/** Hata satırını ajana gidecek düzeltme isteğine çevirir. */
export function hataIstemi(g: Gunluk): string {
  const sat = [`Bulut günlüklerinde şu hata var (${new Date(g.z).toLocaleString("tr-TR")}):`, `Tür: ${TUR_AD[g.t] ?? g.t}${g.d ? `, durum ${g.d}` : ""}${g.yt ? `, ${g.yt}` : ""}`, g.y ? `Yol: ${g.y}${g.q ? `?${g.q}` : ""}` : "", g.m ? `Mesaj: ${g.m}` : "", g.f?.hata ? `Fonksiyon hatası: ${g.f.hata}` : ""];
  if (g.f?.log?.length) sat.push(`Console çıktısı:\n${g.f.log.slice(-10).join("\n")}`);
  if (g.f?.dis?.length) sat.push(`Dış istekler:\n${g.f.dis.map((x) => `${x.y} ${x.a} durum ${x.d || "ağ hatası"}${x.h ? ` (${x.h})` : ""}, ${x.ms} ms`).join("\n")}`);
  if (g.ua) sat.push(`Tarayıcı: ${g.ua}`);
  sat.push("Nedenini kodda bul, düzelt ve neyi değiştirdiğini kısaca açıkla.");
  return sat.filter(Boolean).join("\n");
}

/** Bulut > Günlükler: süzgeç kenar çubuğu, hacim grafiği, arama, canlı akış, ayrıntı paneli, derin bağlantı. */
export function Gunlukler({ id, ajana, gomulu, ilkSorgu }: { id: string; ajana: (metin: string) => void; gomulu?: boolean; ilkSorgu?: string }) {
  const ilk = useMemo(() => adrestenOku(ilkSorgu), [ilkSorgu]);
  const [s, setS] = useState<Suzgec>(ilk);
  const [araGirdi, setAraGirdi] = useState(ilk.ara);
  const [yolGirdi, setYolGirdi] = useState(ilk.yol);
  const [v, setV] = useState<Gezgin | null>(null);
  const [canli, setCanli] = useState(false);
  const [secili, setSecili] = useState<Gunluk | null>(null);
  const [panel, setPanel] = useState(false);
  const [kopya, setKopya] = useState(false);
  const [yeni, setYeni] = useState<Set<string>>(new Set());
  const d = (p: Partial<Suzgec>) => setS((x) => ({ ...x, ...p }));
  const sorgu = useMemo(() => suzgecSorgu(s), [s]);
  const getir = useCallback(async () => {
    const q = new URLSearchParams(sorgu);
    q.set("gezgin", "1"); if (s.zaman !== "24s") q.set("zaman", s.zaman); else q.set("zaman", "24s");
    if (q.get("tur")) { q.set("turler", q.get("tur")!); q.delete("tur"); }
    const x = await api<Gezgin>(`/api/build/bulut/${id}/gunluk?${q}`).catch(() => null);
    setV(x ?? { gunlukler: [], hacim: [], kova: 60_000, yuzey: { tur: {}, seviye: { basarili: 0, uyari: 0, hata: 0 }, cihaz: {}, yol: [] }, toplam: 0, ortSure: 0, bas: Date.now() - 864e5, bit: Date.now() });
  }, [id, sorgu, s.zaman]);
  useEffect(() => { const z = setTimeout(getir, 200); return () => clearTimeout(z); }, [getir]);
  useEffect(() => { const z = setTimeout(() => d({ ara: araGirdi.trim() }), 350); return () => clearTimeout(z); }, [araGirdi]);
  useEffect(() => { const z = setTimeout(() => d({ yol: yolGirdi.trim() }), 350); return () => clearTimeout(z); }, [yolGirdi]);
  // Derin bağlantı: süzgeçler adres çubuğunda (gömülü çalışma alanında adrese dokunulmaz).
  useEffect(() => {
    if (gomulu) return;
    const q = suzgecSorgu(s); q.set("bolum", "gunluk"); if (secili?.i) q.set("kayit", secili.i);
    history.replaceState(history.state, "", `${location.pathname}?${q}`);
  }, [s, secili, gomulu]);
  // Bağlantıyla gelen kayıt: 14 gün içinde bulunup ayrıntısı açılır.
  useEffect(() => {
    if (!ilk.kayit) return;
    api<{ gunlukler: Gunluk[] }>(`/api/build/bulut/${id}/gunluk?gezgin=1&zaman=14g&id=${encodeURIComponent(ilk.kayit)}&sinir=1`).then((x) => { if (x.gunlukler[0]) setSecili(x.gunlukler[0]); }).catch(() => {});
  }, [id, ilk.kayit]);
  // Canlı akış: 3 sn'de bir yalnız yeni kayıtlar; grafik son kovaya işlenir.
  const sonZ = useRef(0);
  useEffect(() => { sonZ.current = v?.gunlukler[0]?.z ?? Date.now() - 5000; }, [v]);
  useEffect(() => {
    if (!canli || s.zaman === "ozel") return;
    const z = setInterval(async () => {
      const q = new URLSearchParams(sorgu); q.set("gezgin", "1"); q.set("zaman", s.zaman); q.set("sonra", String(sonZ.current));
      if (q.get("tur")) { q.set("turler", q.get("tur")!); q.delete("tur"); }
      const x = await api<{ gunlukler: Gunluk[] }>(`/api/build/bulut/${id}/gunluk?${q}`).catch(() => null);
      if (!x?.gunlukler.length) return;
      sonZ.current = x.gunlukler[0].z;
      setYeni(new Set(x.gunlukler.map((g) => g.i ?? "")));
      setV((o) => {
        if (!o) return o;
        const hacim = o.hacim.map((h) => ({ ...h }));
        for (const g of x.gunlukler) { let k = hacim.length - 1; while (k >= 0 && hacim[k].z > g.z) k--; if (k >= 0) hacim[k][seviyeBul(g)]++; }
        return { ...o, gunlukler: [...x.gunlukler, ...o.gunlukler].slice(0, 600), hacim, toplam: o.toplam + x.gunlukler.length };
      });
    }, 3000);
    return () => clearInterval(z);
  }, [canli, id, sorgu, s.zaman]);
  const degistir = (a: "turler" | "seviye" | "cihaz", x: string) => d({ [a]: s[a].includes(x) ? s[a].filter((y) => y !== x) : [...s[a], x] } as Partial<Suzgec>);
  const temiz = !s.turler.length && !s.seviye.length && !s.cihaz.length && !s.yol && !s.ara;
  const sifirla = () => { setAraGirdi(""); setYolGirdi(""); d({ turler: [], seviye: [], cihaz: [], yol: "", ara: "" }); };
  const baglanti = (g: Gunluk) => { const q = suzgecSorgu(s); q.set("bolum", "gunluk"); q.set("zaman", "14g"); if (g.i) q.set("kayit", g.i); return `${location.origin}/panel/build/bulut/${id}?${q}`; };

  const yuzeyler = (
    <div className="space-y-4">
      <div>
        <p className="mb-1 px-2.5 text-[12px] font-medium text-white/45">Tür</p>
        {Object.keys(TUR_AD).filter((t) => (v?.yuzey.tur[t] ?? 0) > 0 || s.turler.includes(t)).map((t) => <YuzeySatiri key={t} secili={s.turler.includes(t)} onClick={() => degistir("turler", t)} ad={TUR_AD[t]} sayi={v?.yuzey.tur[t] ?? 0} />)}
        {v && !Object.keys(v.yuzey.tur).length && !s.turler.length && <p className="px-2.5 text-[12px] text-white/35">Bu aralıkta kayıt yok</p>}
      </div>
      <div>
        <p className="mb-1 px-2.5 text-[12px] font-medium text-white/45">Seviye</p>
        {(["basarili", "uyari", "hata"] as Seviye[]).map((x) => <YuzeySatiri key={x} secili={s.seviye.includes(x)} onClick={() => degistir("seviye", x)} ad={SEVIYE_AD[x]} sayi={v?.yuzey.seviye[x] ?? 0} nokta={SEVIYE_SERI.find((y) => y.anahtar === x)!.renk} />)}
      </div>
      <div>
        <p className="mb-1 px-2.5 text-[12px] font-medium text-white/45">Cihaz</p>
        {Object.keys(CIHAZ_AD).map((x) => <YuzeySatiri key={x} secili={s.cihaz.includes(x)} onClick={() => degistir("cihaz", x)} ad={CIHAZ_AD[x]} sayi={v?.yuzey.cihaz[x] ?? 0} />)}
      </div>
      <div>
        <p className="mb-1.5 px-2.5 text-[12px] font-medium text-white/45">Yol</p>
        <div className="px-1"><input value={yolGirdi} onChange={(e) => setYolGirdi(e.target.value)} placeholder="/api ile başlayan" className={cn(alanSinif, "h-8 rounded-[10px] px-2.5 text-[12.5px]")} /></div>
        <div className="mt-1">{(v?.yuzey.yol ?? []).slice(0, 8).map((x) => <YuzeySatiri key={x.ad} secili={s.yol === x.ad} onClick={() => { const y = s.yol === x.ad ? "" : x.ad; setYolGirdi(y); d({ yol: y }); }} ad={<span className="font-mono text-[12px]">{x.ad}</span>} sayi={x.adet} />)}</div>
      </div>
      {!temiz && <button type="button" onClick={sifirla} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><RotateCcw className="h-3.5 w-3.5" />Süzgeçleri temizle</button>}
    </div>
  );

  const seviyeSayisi = (s.seviye.length ? s.seviye : ["basarili", "uyari", "hata"]).length;
  return (
    <Kart ikon={ScrollText} baslik="Günlükler" alt={v ? `${v.toplam.toLocaleString("tr-TR")} kayıt${v.ortSure ? `, ortalama ${sureYaz(v.ortSure)}` : ""} · 14 gün saklanır, IP düz tutulmaz` : "İstekler, fonksiyonlar, tarayıcı hataları ve platform olayları"}
      sag={<label className="flex items-center gap-2 text-[12.5px] text-white/60"><Radio className={cn("h-3.5 w-3.5", canli && "animate-pulse text-[#55d6fd]")} /><span className="max-sm:hidden">Canlı</span><Anahtar acik={canli} set={(x) => { setCanli(x); if (x && s.zaman === "ozel") d({ zaman: "1s" }); }} etiket="Canlı akış" /></label>}>
      <div className="flex min-h-[560px]">
        <aside className="w-[220px] shrink-0 border-r border-white/[0.06] p-2.5 max-md:hidden">{yuzeyler}</aside>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3 sm:px-4">
            <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-white/45"><Search className="h-3.5 w-3.5 shrink-0" /><input value={araGirdi} onChange={(e) => setAraGirdi(e.target.value)} placeholder="Yol, mesaj, durum kodu ya da console metni ara" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />{araGirdi && <button type="button" onClick={() => setAraGirdi("")} aria-label="Aramayı temizle"><X className="h-3.5 w-3.5" /></button>}</label>
            <div className="w-[170px] shrink-0"><AcilirSecim deger={s.zaman} set={(x) => d({ zaman: x, ...(x === "ozel" ? { bas: v?.bas ?? Date.now() - 864e5, bit: Date.now() } : {}) })} l={ZAMANLAR} /></div>
            <button type="button" onClick={() => setPanel(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] text-white md:hidden"><SlidersHorizontal className="h-3.5 w-3.5" />Süzgeçler{!temiz && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}</button>
            {s.zaman === "ozel" && (
              <div className="flex w-full flex-wrap items-center gap-2 text-[12.5px] text-white/50">
                <input type="datetime-local" value={yerelGirdi(s.bas)} max={yerelGirdi(s.bit)} onChange={(e) => { const z = new Date(e.target.value).getTime(); if (z) d({ bas: z }); }} className={cn(alanSinif, "h-9 w-auto text-[12.5px] [color-scheme:dark]")} />
                <span>ile</span>
                <input type="datetime-local" value={yerelGirdi(s.bit)} min={yerelGirdi(s.bas)} onChange={(e) => { const z = new Date(e.target.value).getTime(); if (z) d({ bit: z }); }} className={cn(alanSinif, "h-9 w-auto text-[12.5px] [color-scheme:dark]")} />
                <span>arası</span>
              </div>
            )}
          </div>
          <div className="border-b border-white/[0.06] px-3 pb-3 pt-3.5 sm:px-4">
            {!v ? <div className="h-[178px] animate-pulse rounded-[12px] bg-white/[0.02]" /> : (
              <YiginCubuk veri={v.hacim} seriler={SEVIYE_SERI.filter((x) => !s.seviye.length || s.seviye.includes(x.anahtar))} yukseklik={130}
                etiket={(z) => zamanEtiketi(z, v.kova)} ipucuBaslik={(z) => `${new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ile ${new Date(z + v.kova).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} arası`}
                onSec={(i) => { const h = v.hacim[i]; if (h) { setCanli(false); d({ zaman: "ozel", bas: h.z, bit: h.z + v.kova }); } }} />
            )}
            {seviyeSayisi < 3 && <p className="sr-only">Grafik seçili seviyelerle süzülü</p>}
          </div>
          {!v ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !v.gunlukler.length ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <ScrollText className="h-6 w-6 text-white/25" />
              <p className="text-[13.5px] text-white/65">{temiz ? "Bu aralıkta kayıt yok." : "Bu süzgeçlere uyan kayıt yok."}</p>
              <p className="max-w-[420px] text-[12.5px] text-white/40">{temiz ? "Site yayındaysa her ziyaret, fonksiyon çağrısı ve tarayıcı hatası burada akar. Canlı akışı açıp siteyi ziyaret edebilirsin." : "Süzgeçleri gevşet ya da zaman aralığını genişlet."}</p>
              {!temiz && <button type="button" onClick={sifirla} className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12]"><RotateCcw className="h-3.5 w-3.5" />Süzgeçleri temizle</button>}
            </div>
          ) : (
            <div className="max-h-[640px] overflow-y-auto text-[12px] [scrollbar-width:thin]">
              {v.gunlukler.map((g, i) => {
                const sev = seviyeBul(g);
                return (
                  <button key={`${g.i}-${i}`} type="button" onClick={() => setSecili(g)} className={cn("grid w-full grid-cols-[60px_40px_1fr_auto] items-center gap-2.5 border-b border-l-2 border-b-white/[0.04] px-3 py-1.5 text-left transition-colors hover:bg-white/[0.03] sm:grid-cols-[66px_86px_40px_48px_1fr_auto] sm:px-4", sev === "hata" ? "border-l-rose-400/70" : sev === "uyari" ? "border-l-amber-300/60" : "border-l-transparent", secili?.i === g.i && "bg-white/[0.05]", yeni.has(g.i ?? "") && "animate-[pulse_1.2s_ease-out_1]")}>
                    <span className="font-mono text-white/40" title={new Date(g.z).toLocaleString("tr-TR")}>{new Date(g.z).toLocaleTimeString("tr-TR")}</span>
                    <span className="truncate text-[11.5px] text-white/55 max-sm:hidden">{TUR_AD[g.t] ?? g.t}</span>
                    <span className={cn("font-mono tabular-nums", RENK[sev])}>{g.d ?? (g.t === "hata" ? "Hata" : "")}</span>
                    <span className="font-mono text-[11px] text-white/40 max-sm:hidden">{g.yt ?? ""}</span>
                    <span className="min-w-0 truncate"><span className="font-mono text-white/80">{g.y ?? ""}</span>{g.m ? <span className="text-white/60">{g.y ? "  " : ""}{g.m}</span> : null}{g.e ? <span className="ml-1.5 rounded-full bg-rose-500/[0.12] px-1.5 text-[10.5px] text-rose-200">Engellendi</span> : null}</span>
                    <span className="shrink-0 font-mono text-white/35">{sureYaz(g.ms)}</span>
                  </button>
                );
              })}
              {v.gunlukler.length >= 300 && <p className="px-4 py-3 text-center text-[12px] text-white/40">İlk 300 kayıt gösteriliyor. Daha eskiler için aralığı daralt ya da süzgeç ekle.</p>}
            </div>
          )}
        </div>
      </div>

      <YanPanel acik={panel} kapat={() => setPanel(false)} baslik="Süzgeçler" alt="Tür, seviye, cihaz ve yol">{yuzeyler}</YanPanel>

      <YanPanel acik={!!secili} kapat={() => setSecili(null)} genis
        baslik={secili ? <span className="flex items-center gap-2"><span className={cn("font-mono", RENK[seviyeBul(secili)])}>{secili.d ?? (secili.t === "hata" ? "Hata" : "")}</span><span className="truncate font-mono text-[14px]">{secili.y || TUR_AD[secili.t]}</span></span> : ""}
        alt={secili ? `${TUR_AD[secili.t] ?? secili.t} · ${new Date(secili.z).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}
        alt2={secili && <>
          {seviyeBul(secili) !== "basarili" && <button type="button" onClick={() => { ajana(hataIstemi(secili)); setSecili(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Sparkles className="h-3.5 w-3.5" />Ajana düzelt</button>}
          <button type="button" onClick={() => { navigator.clipboard?.writeText(baglanti(secili)); setKopya(true); setTimeout(() => setKopya(false), 1400); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]">{kopya ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}{kopya ? "Kopyalandı" : "Bağlantıyı kopyala"}</button>
          {secili.y && <button type="button" onClick={() => { const y = secili.y!.replace(/ \((önizleme|deneme)\)$/, ""); setYolGirdi(y); d({ yol: y }); setSecili(null); }} className="inline-flex h-9 items-center rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]">Bu yolu süz</button>}
        </>}>
        {secili && <KayitAyrintisi g={secili} />}
      </YanPanel>
    </Kart>
  );
}

/** Ayrıntı paneli gövdesi: bütün alanlar, console satırları, dış istekler. */
export function KayitAyrintisi({ g }: { g: Gunluk }) {
  const sev = seviyeBul(g);
  return (
    <div className="space-y-5">
      {g.m && <p className={cn("rounded-[14px] px-3.5 py-3 text-[13px] leading-relaxed ring-1 ring-inset", sev === "hata" ? "bg-rose-500/[0.07] text-rose-100 ring-rose-300/15" : sev === "uyari" ? "bg-amber-400/[0.06] text-amber-100 ring-amber-200/15" : "bg-white/[0.04] text-white/80 ring-white/[0.07]")}>{g.m}</p>}
      <dl className="divide-y divide-white/[0.05]">
        <Alan ad="Zaman">{new Date(g.z).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "medium" })}</Alan>
        <Alan ad="Tür">{TUR_AD[g.t] ?? g.t}{g.f?.onizleme || / \(önizleme\)$/.test(g.y ?? "") ? ", önizleme" : / \(deneme\)$/.test(g.y ?? "") ? ", deneme" : ""}</Alan>
        {g.d != null && <Alan ad="Durum"><span className={RENK[sev]}>{g.d}</span> <span className="text-white/45">{sev === "basarili" ? "başarılı" : sev === "uyari" ? "istemci hatası" : "sunucu hatası"}</span></Alan>}
        {g.yt && <Alan ad="Yöntem" mono>{g.yt}</Alan>}
        {g.y && <Alan ad="Yol" mono>{g.y}</Alan>}
        {g.q && <Alan ad="Sorgu" mono>{g.q}</Alan>}
        {g.ms != null && <Alan ad="Süre">{sureYaz(g.ms)}</Alan>}
        {g.b != null && <Alan ad="Yanıt boyutu">{boyut(g.b)}</Alan>}
        {g.c && <Alan ad="Cihaz">{CIHAZ_AD[g.c] ?? g.c}</Alan>}
        {g.ua && <Alan ad="Tarayıcı">{g.ua}</Alan>}
        {g.u && <Alan ad="Ülke">{g.u}</Alan>}
        {g.k && <Alan ad="Yönlendiren">{g.k === "istemci" ? "Ziyaretçinin tarayıcısı" : g.k}</Alan>}
        {g.ip && <Alan ad="IP özeti" mono>{g.ip}</Alan>}
        {g.e && <Alan ad="Güvenlik duvarı"><span className="text-rose-200">{g.e}</span></Alan>}
        {g.i && <Alan ad="Kayıt kimliği" mono>{g.i}</Alan>}
      </dl>
      {g.f?.hata && <section><h4 className="mb-1.5 text-[12.5px] font-medium text-white/55">Fonksiyon hatası</h4><pre className="whitespace-pre-wrap break-words rounded-[12px] bg-rose-500/[0.06] p-3 font-mono text-[12px] text-rose-100 ring-1 ring-inset ring-rose-300/15">{g.f.hata}</pre></section>}
      {g.t === "fonksiyon" && (
        <section>
          <h4 className="mb-1.5 text-[12.5px] font-medium text-white/55">Console satırları</h4>
          {g.f?.log?.length ? <pre className="max-h-[260px] overflow-auto rounded-[12px] bg-[#0c0d0f] p-3 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{g.f.log.join("\n")}</pre> : <p className="text-[12.5px] text-white/40">Bu çağrıda console çıktısı yok.</p>}
        </section>
      )}
      {g.t === "fonksiyon" && (
        <section>
          <h4 className="mb-1.5 text-[12.5px] font-medium text-white/55">Dış istekler</h4>
          {g.f?.dis?.length ? (
            <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.07]">
              {g.f.dis.map((x, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 text-[12px]">
                  <span className="w-12 shrink-0 font-mono text-white/45">{x.y}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-white/80" title={x.a}>{x.a}{x.h && <span className="block truncate font-sans text-rose-200/80">{x.h}</span>}</span>
                  <span className={cn("shrink-0 font-mono", !x.d || x.d >= 500 ? "text-rose-300" : x.d >= 400 ? "text-amber-200" : "text-emerald-300/80")}>{x.d || "Ağ hatası"}</span>
                  <span className="w-14 shrink-0 text-right font-mono text-white/40">{sureYaz(x.ms)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-white/40">Bu çağrı dışarıya istek yapmadı.</p>}
        </section>
      )}
    </div>
  );
}
