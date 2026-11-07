"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Braces, Brain, Check, Copy, FileArchive, Import, Loader2, MessageSquare, Search, Upload, X } from "lucide-react";
import { api } from "@/lib/build/istemci";
import { dosyadanSohbetler, HAFIZA_ISTEMI, notlariAyikla, type IceAday, type IceKaynak } from "@/lib/build/sohbetIceAktar";
import { cn } from "@/lib/utils";
import { SagPanel, sayi, yay } from "./ortak";

/**
 * İçe aktar paneli: (1) ChatGPT ya da Claude dışa aktarma ZIP'inden (ya da özel JSON'dan) sohbetleri seçerek
 * Vayra sohbetine çevirir (ZIP tarayıcıda açılır, yalnız seçilenler gönderilir; daha önce aktarılanlar işaretli);
 * (2) Hafızanı getir: diğer asistana yapıştırılacak hazır istem ve yanıtından ayıklanan notları Belleğe ekler.
 */
export const KAYNAK_LOGO: Record<IceKaynak, string | null> = { chatgpt: "/marka/renkli/openai.svg", claude: "/marka/renkli/claude-color.svg", ozel: null };
const KAYNAKLAR: { id: IceKaynak; ad: string; alt: string }[] = [
  { id: "chatgpt", ad: "ChatGPT", alt: "OpenAI dışa aktarma ZIP'i" },
  { id: "claude", ad: "Claude", alt: "Anthropic dışa aktarma ZIP'i" },
  { id: "ozel", ad: "Özel", alt: "Kendi JSON dosyan" },
];
const ADIMLAR: Record<IceKaynak, string[]> = {
  chatgpt: ["ChatGPT'de profil menüsünden Ayarlar, sonra Veri denetimleri bölümünü aç.", "Verileri dışa aktar düğmesine bas ve onayla.", "E-postana gelen bağlantıdan ZIP dosyasını indir, buraya bırak."],
  claude: ["Claude'da Ayarlar, sonra Gizlilik bölümünü aç.", "Verileri dışa aktar düğmesine bas.", "E-postana gelen bağlantıdan ZIP dosyasını indir, buraya bırak."],
  ozel: ["Sohbetlerini aşağıdaki biçimde bir JSON dosyasına yaz.", "Rol için kullanici ya da asistan, metin için düz yazı ya da Markdown kullan.", "Dosyayı buraya bırak."],
};
const OZEL_ORNEK = `[{ "baslik": "Tatil planı",
   "mesajlar": [
     { "rol": "kullanici", "metin": "..." },
     { "rol": "asistan", "metin": "..." } ] }]`;

export function KaynakSimge({ k, boyut = 18 }: { k: IceKaynak; boyut?: number }) {
  const l = KAYNAK_LOGO[k];
  /* eslint-disable-next-line @next/next/no-img-element */
  return l ? <img src={l} alt="" style={{ width: boyut, height: boyut }} className="object-contain" /> : <Braces style={{ width: boyut, height: boyut }} className="text-white/75" />;
}

/** Seçim kutusu: beyaz halka, seçilince içte nokta (tik yok). */
function Kutu({ secili, yarim }: { secili: boolean; yarim?: boolean }) {
  return (
    <span className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] transition-[box-shadow]", secili || yarim ? "ring-2 ring-white" : "ring-1 ring-white/30")}>
      <AnimatePresence>{(secili || yarim) && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className={cn("bg-white", yarim && !secili ? "h-[2px] w-2 rounded-full" : "h-2 w-2 rounded-[3px]")} />}</AnimatePresence>
    </span>
  );
}

const tarih = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

export function IceAktarPaneli({ acik, kapat, bitti, ilkSekme = "sohbet" }: { acik: boolean; kapat: () => void; bitti?: () => void; ilkSekme?: "sohbet" | "hafiza" }) {
  const [sekme, setSekme] = useState<"sohbet" | "hafiza">(ilkSekme);
  useEffect(() => { if (acik) setSekme(ilkSekme); }, [acik, ilkSekme]);
  /* ── Sohbetler ── */
  const [kaynak, setKaynak] = useState<IceKaynak>("chatgpt");
  const [veri, setVeri] = useState<{ kaynak: IceKaynak; l: IceAday[]; ad: string } | null>(null);
  const [okunuyor, setOkunuyor] = useState(false);
  const [hata, setHata] = useState("");
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [ara, setAra] = useState("");
  const [goster, setGoster] = useState(150);
  const [aktarilan, setAktarilan] = useState<Record<string, string>>({});
  const [ilerleme, setIlerleme] = useState<{ yapilan: number; toplam: number } | null>(null);
  const [sonuc, setSonuc] = useState<{ eklenen: number; atlanan: number; ilk?: string } | null>(null);
  const [surukle, setSurukle] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  /* ── Hafıza ── */
  const [kopya, setKopya] = useState(false);
  const [yapistir, setYapistir] = useState("");
  const [hariç, setHaric] = useState<Set<number>>(new Set());
  const [hafizaKaynak, setHafizaKaynak] = useState("ChatGPT");
  const [ozelAd, setOzelAd] = useState("");
  const [hafizaDurum, setHafizaDurum] = useState<{ yukleniyor?: boolean; eklenen?: number; hata?: string }>({});
  const notlar = useMemo(() => notlariAyikla(yapistir), [yapistir]);
  useEffect(() => setHaric(new Set()), [yapistir]);

  useEffect(() => { if (acik) api<{ aktarilan: Record<string, string> }>("/api/build/sohbet/ice-aktar").then((v) => setAktarilan(v.aktarilan)).catch(() => {}); }, [acik]);

  const oku = async (f: File) => {
    setHata(""); setOkunuyor(true); setSonuc(null);
    try {
      const r = await dosyadanSohbetler(f);
      setVeri({ ...r, ad: f.name });
      setKaynak(r.kaynak);
      setSecili(new Set(r.l.filter((x) => !aktarilan[`${r.kaynak}:${x.kimlik}`]).map((x) => x.kimlik)));
      setGoster(150); setAra("");
    } catch (e) { setHata(e instanceof Error ? e.message : "Dosya okunamadı."); setVeri(null); }
    finally { setOkunuyor(false); }
  };
  const gorunen = useMemo(() => {
    if (!veri) return [];
    const q = ara.trim().toLocaleLowerCase("tr");
    return q ? veri.l.filter((x) => x.baslik.toLocaleLowerCase("tr").includes(q) || x.mesajlar[0]?.metin.toLocaleLowerCase("tr").includes(q)) : veri.l;
  }, [veri, ara]);
  const yeniMi = (x: IceAday) => !!veri && !aktarilan[`${veri.kaynak}:${x.kimlik}`];
  const secilebilir = gorunen.filter(yeniMi);
  const hepsiSecili = secilebilir.length > 0 && secilebilir.every((x) => secili.has(x.kimlik));
  const tumunuSec = () => setSecili((s) => { const y = new Set(s); if (hepsiSecili) secilebilir.forEach((x) => y.delete(x.kimlik)); else secilebilir.forEach((x) => y.add(x.kimlik)); return y; });
  const onceAktarilan = veri ? veri.l.filter((x) => !yeniMi(x)).length : 0;

  const aktar = async () => {
    if (!veri || !secili.size || ilerleme) return;
    const l = veri.l.filter((x) => secili.has(x.kimlik));
    setIlerleme({ yapilan: 0, toplam: l.length }); setHata("");
    let eklenen = 0, atlanan = 0, ilk: string | undefined;
    const yeniHarita = { ...aktarilan };
    try {
      for (let i = 0; i < l.length;) {
        const parti: IceAday[] = [];
        let boyut = 0;
        while (i < l.length && parti.length < 25 && (boyut < 1_500_000 || !parti.length)) { const x = l[i++]; parti.push(x); boyut += x.mesajlar.reduce((t, m) => t + m.metin.length, 0); }
        const v = await api<{ eklenen: { kimlik: string; id: string }[]; atlanan: number }>("/api/build/sohbet/ice-aktar", { govde: { kaynak: veri.kaynak, sohbetler: parti } });
        eklenen += v.eklenen.length; atlanan += v.atlanan;
        for (const e of v.eklenen) { yeniHarita[`${veri.kaynak}:${e.kimlik}`] = e.id; ilk ??= e.id; }
        setIlerleme({ yapilan: i, toplam: l.length });
      }
      setSonuc({ eklenen, atlanan, ilk });
      setAktarilan(yeniHarita);
      setSecili(new Set());
      bitti?.();
    } catch (e) { setHata(e instanceof Error ? e.message : "Aktarma yarıda kaldı."); }
    finally { setIlerleme(null); }
  };

  const hafizaEkle = async () => {
    const l = notlar.filter((_, i) => !hariç.has(i));
    if (!l.length) return;
    setHafizaDurum({ yukleniyor: true });
    try {
      const once = await api<{ bellek: { kayitlar: unknown[] } }>("/api/build/sohbet/bellek");
      const v = await api<{ bellek: { kayitlar: unknown[] } }>("/api/build/sohbet/bellek", { method: "PATCH", govde: { ekleToplu: l, aktarim: hafizaKaynak === "Özel" ? ozelAd.trim() || "Başka asistan" : hafizaKaynak } });
      setHafizaDurum({ eklenen: v.bellek.kayitlar.length - once.bellek.kayitlar.length });
      setYapistir("");
    } catch (e) { setHafizaDurum({ hata: e instanceof Error ? e.message : "Eklenemedi." }); }
  };

  const altSohbet = veri && !sonuc ? (
    <>
      <span className="text-[12.5px] tabular-nums text-white/55">{sayi(secili.size)} seçili</span>
      <span className="ml-auto" />
      <button type="button" onClick={aktar} disabled={!secili.size || !!ilerleme} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black transition-transform active:scale-[0.98] disabled:opacity-40">
        {ilerleme ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}{ilerleme ? `${sayi(ilerleme.yapilan)} / ${sayi(ilerleme.toplam)}` : `Seçilenleri içe aktar`}
      </button>
    </>
  ) : undefined;
  const secNot = notlar.length - hariç.size;
  const altHafiza = notlar.length ? (
    <>
      <span className="text-[12.5px] tabular-nums text-white/55">{sayi(secNot)} / {sayi(notlar.length)} not</span>
      <span className="ml-auto" />
      <button type="button" onClick={hafizaEkle} disabled={!secNot || hafizaDurum.yukleniyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{hafizaDurum.yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}Belleğe ekle</button>
    </>
  ) : undefined;

  return (
    <SagPanel acik={acik} kapat={kapat} baslik="İçe aktar" alt="Sohbetlerini ve hafızanı başka yapay zekâlardan getir" ikon={<Import className="h-[18px] w-[18px]" />} genislik={620} alt2={sekme === "sohbet" ? altSohbet : altHafiza}>
      <LayoutGroup id="ice-sekme">
        <div className="mb-4 flex rounded-full bg-white/[0.06] p-1">
          {([["sohbet", "Sohbetler", MessageSquare], ["hafiza", "Hafızanı getir", Brain]] as const).map(([id, ad, I]) => (
            <button key={id} type="button" onClick={() => setSekme(id)} className={cn("relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", sekme === id ? "text-black" : "text-white/65 hover:text-white")}>
              {sekme === id && <motion.span layoutId="ice-sekme-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
              <I className="relative h-4 w-4" /><span className="relative">{ad}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <AnimatePresence mode="wait" initial={false}>
        {sekme === "sohbet" ? (
          <motion.div key="sohbet" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
            {sonuc ? (
              <div className="rounded-[20px] bg-[#55d6fd]/[0.07] p-5 text-center ring-1 ring-inset ring-[#55d6fd]/20">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd]/[0.15] text-[#8be6ff]"><Import className="h-5 w-5" /></span>
                <p className="mt-3 text-[16px] font-semibold text-white">{sayi(sonuc.eklenen)} sohbet aktarıldı</p>
                <p className="mt-1 text-[13px] text-white/60">{sonuc.atlanan ? `${sayi(sonuc.atlanan)} sohbet zaten vardı ya da boştu, atlandı. ` : ""}Sohbet listende kaynak logosuyla görünürler; kaldığın yerden devam edebilirsin.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {sonuc.ilk && <Link href={`/panel/build/sohbet/${sonuc.ilk}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">İlk sohbeti aç<ArrowRight className="h-3.5 w-3.5" /></Link>}
                  <button type="button" onClick={() => setSonuc(null)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]">Başka sohbet seç</button>
                </div>
              </div>
            ) : !veri ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {KAYNAKLAR.map((k) => (
                    <button key={k.id} type="button" onClick={() => setKaynak(k.id)}
                      className={cn("flex flex-col items-start gap-2 rounded-[16px] bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.07]", kaynak === k.id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "ring-1 ring-inset ring-white/[0.07]")}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.07]"><KaynakSimge k={k.id} boyut={20} /></span>
                      <span className="min-w-0"><span className="block text-[13.5px] font-semibold text-white">{k.ad}</span><span className="block text-[11.5px] leading-snug text-white/50">{k.alt}</span></span>
                    </button>
                  ))}
                </div>
                <ol className="space-y-2 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.06]">
                  {ADIMLAR[kaynak].map((a, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-white/75"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold tabular-nums text-white">{i + 1}</span>{a}</li>
                  ))}
                  {kaynak === "ozel" && <pre className="sc-kod mt-1 overflow-x-auto rounded-[10px] bg-[#0c0d0f] p-3 text-[11.5px] leading-relaxed text-white/75 ring-1 ring-inset ring-white/[0.06]">{OZEL_ORNEK}</pre>}
                </ol>
                <input ref={dosyaRef} type="file" hidden accept=".zip,.json,application/zip,application/json" onChange={(e) => { const f = e.target.files?.[0]; if (f) oku(f); e.target.value = ""; }} />
                <div onDragOver={(e) => { e.preventDefault(); setSurukle(true); }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); const f = e.dataTransfer.files[0]; if (f) oku(f); }}
                  className={cn("flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.04] p-4 ring-1 ring-inset transition-colors", surukle ? "bg-white/[0.08] ring-2 ring-white" : "ring-white/[0.08]")}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.12] text-[#8be6ff]">{okunuyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileArchive className="h-5 w-5" />}</span>
                  <span className="min-w-[180px] flex-1"><span className="block text-[14px] font-semibold text-white">{okunuyor ? "Dosya okunuyor" : "ZIP ya da JSON dosyasını bırak"}</span><span className="block text-[12.5px] leading-snug text-white/55">Dosya tarayıcında açılır; yalnız seçtiğin sohbetler Vayra&apos;ya kaydedilir.</span></span>
                  <button type="button" disabled={okunuyor} onClick={() => dosyaRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50"><Upload className="h-4 w-4" />Dosya seç</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.07]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07]"><KaynakSimge k={veri.kaynak} boyut={20} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{sayi(veri.l.length)} sohbet bulundu</span><span className="block truncate text-[12.5px] text-white/50">{veri.ad}{onceAktarilan ? ` · ${sayi(onceAktarilan)} tanesi daha önce aktarıldı` : ""}</span></span>
                  <button type="button" onClick={() => { setVeri(null); setSecili(new Set()); }} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" />Değiştir</button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-white/[0.05] px-3 text-white/45 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25">
                    <Search className="h-4 w-4 shrink-0" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sohbetlerde ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />
                  </label>
                  <button type="button" onClick={tumunuSec} disabled={!secilebilir.length} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[14px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.09] disabled:opacity-40">
                    <Kutu secili={hepsiSecili} yarim={!hepsiSecili && secilebilir.some((x) => secili.has(x.kimlik))} /><span className="max-sm:hidden">Tümünü seç</span><span className="sm:hidden">Tümü</span>
                  </button>
                </div>
                <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
                  {gorunen.slice(0, goster).map((x) => {
                    const yeni = yeniMi(x);
                    const s = secili.has(x.kimlik);
                    return (
                      <li key={x.kimlik}>
                        <button type="button" disabled={!yeni} onClick={() => setSecili((l) => { const y = new Set(l); if (y.has(x.kimlik)) y.delete(x.kimlik); else y.add(x.kimlik); return y; })}
                          className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors", yeni ? "hover:bg-white/[0.04]" : "opacity-60", s && "bg-white/[0.035]")}>
                          {yeni ? <Kutu secili={s} /> : <span className="h-[18px] w-[18px] shrink-0" />}
                          <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{x.baslik}</span><span className="block truncate text-[12px] text-white/45">{tarih(x.guncelleme)} · {sayi(x.mesajlar.length)} mesaj · {x.mesajlar[0]?.metin.replace(/\s+/g, " ").slice(0, 80)}</span></span>
                          {!yeni && <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/60">Aktarıldı</span>}
                        </button>
                      </li>
                    );
                  })}
                  {!gorunen.length && <li className="px-4 py-6 text-center text-[13px] text-white/50">&quot;{ara.trim()}&quot; geçen sohbet yok.</li>}
                </ul>
                {gorunen.length > goster && <button type="button" onClick={() => setGoster((g) => g + 300)} className="w-full rounded-full bg-white/[0.05] py-2 text-[12.5px] text-white/70 hover:bg-white/[0.09]">{sayi(gorunen.length - goster)} sohbet daha göster</button>}
              </>
            )}
            {hata && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[13px] text-rose-200 ring-1 ring-inset ring-rose-400/15"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{hata}</p>}
          </motion.div>
        ) : (
          <motion.div key="hafiza" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
            <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-semibold text-black">1</span>
                <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-white">Bu istemi diğer asistana yapıştır</span><span className="flex items-center gap-1.5 text-[12px] text-white/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {["/marka/renkli/openai.svg", "/marka/renkli/claude-color.svg", "/marka/renkli/gemini-color.svg"].map((l) => <img key={l} src={l} alt="" className="h-3.5 w-3.5" />)}ChatGPT, Claude ya da Gemini</span></span>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(HAFIZA_ISTEMI); setKopya(true); setTimeout(() => setKopya(false), 1500); }} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">{kopya ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{kopya ? "Kopyalandı" : "Kopyala"}</button>
              </div>
              <pre className="max-h-[170px] overflow-y-auto whitespace-pre-wrap bg-[#0e0f11] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/65 [font-family:inherit] [scrollbar-width:thin]">{HAFIZA_ISTEMI}</pre>
            </section>
            <section className="space-y-2.5">
              <p className="flex items-center gap-2.5 text-[13.5px] font-semibold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] text-black">2</span>Gelen yanıtı buraya yapıştır</p>
              <div className="cam-istemci rounded-[18px] p-1.5">
                <textarea value={yapistir} onChange={(e) => setYapistir(e.target.value)} rows={5} placeholder="Diğer asistanın verdiği listeyi olduğu gibi yapıştır" className="block w-full resize-y bg-transparent px-2.5 py-2 text-[13.5px] leading-relaxed text-white outline-none placeholder:text-white/45" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[12.5px] text-white/50">Kaynak</span>
                {[["ChatGPT", "/marka/renkli/openai.svg"], ["Claude", "/marka/renkli/claude-color.svg"], ["Gemini", "/marka/renkli/gemini-color.svg"], ["Özel", ""]].map(([ad, logo]) => (
                  <button key={ad} type="button" onClick={() => setHafizaKaynak(ad)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/80 transition-colors hover:bg-white/[0.09]", hafizaKaynak === ad ? "ring-2 ring-inset ring-white text-white" : "ring-1 ring-inset ring-white/[0.07]")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {logo ? <img src={logo} alt="" className="h-3.5 w-3.5" /> : null}{ad}
                  </button>
                ))}
                {hafizaKaynak === "Özel" && <input value={ozelAd} onChange={(e) => setOzelAd(e.target.value)} maxLength={40} placeholder="Asistanın adı" className="h-8 w-[150px] rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-white/40 focus:ring-white/30" />}
              </div>
            </section>
            {notlar.length > 0 && (
              <section className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
                <p className="border-b border-white/[0.06] px-3.5 py-2.5 text-[12.5px] text-white/55">{sayi(notlar.length)} not bulundu. Eklemek istemediklerinin seçimini kaldır.</p>
                <ul className="max-h-[300px] divide-y divide-white/[0.05] overflow-y-auto [scrollbar-width:thin]">
                  {notlar.map((n, i) => {
                    const s = !hariç.has(i);
                    return (
                      <li key={i}><button type="button" onClick={() => setHaric((h) => { const y = new Set(h); if (y.has(i)) y.delete(i); else y.add(i); return y; })} className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left hover:bg-white/[0.035]">
                        <span className="mt-0.5"><Kutu secili={s} /></span><span className={cn("text-[13px] leading-snug", s ? "text-white/90" : "text-white/40 line-through")}>{n}</span>
                      </button></li>
                    );
                  })}
                </ul>
              </section>
            )}
            {yapistir.trim() && !notlar.length && <p className="text-[12.5px] text-white/50">Yanıtta not bulunamadı. Diğer asistandan listeyi madde madde vermesini iste.</p>}
            {hafizaDurum.eklenen !== undefined && (
              <p className="flex items-center gap-2 rounded-[14px] bg-[#55d6fd]/[0.08] px-3.5 py-2.5 text-[13px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">
                <Brain className="h-4 w-4 shrink-0" /><span className="flex-1">{hafizaDurum.eklenen ? `${sayi(hafizaDurum.eklenen)} not belleğe eklendi.` : "Notların hepsi zaten bellekteydi."}</span>
                <Link href="/panel/build/sohbet/bellek" className="shrink-0 font-semibold underline-offset-2 hover:underline">Belleği aç</Link>
              </p>
            )}
            {hafizaDurum.hata && <p className="text-[12.5px] text-rose-300">{hafizaDurum.hata}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </SagPanel>
  );
}
