"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useMasaustu } from "@/hooks/useMasaustu";
import { Lightbulb, FileText, Link2, Loader2, Clock, Monitor, Mic, Music2, Copy, Trash2, X, Paperclip, SlidersHorizontal, ArrowRight, Check, Play, Plus, Film, Search, Smile, Briefcase, GraduationCap, Zap, Sparkles, Users, Sprout, Award, Baby, Captions } from "lucide-react";
import { Bayrak } from "@/components/ui/Bayrak";
import { cn } from "@/lib/utils";
import { SesAvatar } from "@/components/studyo/ses/ortak";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { KCip, IzgaraSec } from "@/components/studyo/Cip";
import { SESLER, type SesModel } from "@/lib/sesVeri";
import { useMuzik } from "@/store/useMuzik";
import { useExplainer, varsayilanAyar, type ExAyar, type ExProje, type ExTon, type ExKitle, type ExAltyazi, type ExMuzik } from "@/store/useExplainer";
import { EX_STILLER, stilBul, stilVideo, stilPoster, toplamSure, MUZIK_RUH, ozelStil, stilTaban } from "@/lib/explainerMotor";
import { OzelGirdi } from "@/components/film/ortak";
import { Dalga } from "@/components/speak/SesSecici";
import { kisaSure } from "@/components/montaj/ortak";
import { Segment } from "@/components/montaj/ui";
import { senaryoOlustur, yazarHazir, baglantiOku } from "./exUretim";
import { konuAnlamli } from "@/components/shorts/konuSenaryo";
import { explainerVideoUret, EX_ARAC } from "./exVideo";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { ExUretilenler } from "./ExUretilenler";
import { MenuKart } from "@/components/kitaplik/Katmanlar";
import { Tooltip } from "@/components/ui/Tooltip";
import { SesListe, sesBilgi, useSesOnizle, type SesAnahtar } from "@/components/speak/SesSecici";
import { useOzelSesler } from "@/store/useOzelSesler";
import { KlonModal } from "@/components/studyo/ses/KlonModal";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";

type Mod = "konu" | "metin" | "baglanti";
const MODLAR: [Mod, string, typeof Lightbulb][] = [["konu", "Konudan", Lightbulb], ["metin", "Metinden", FileText], ["baglanti", "Bağlantıdan", Link2]];

/** Hazır başlangıçlar: konu kalıbı + ton + süre (köşeli parantez seçili gelir, üstüne yaz). */
const BASLANGIC: { ad: string; konu: string; ton: ExTon; sn: number; oran?: ExAyar["oran"]; stil: string }[] = [
  { ad: "Ürün tanıtımı", konu: "Yeni ürünümüz [ürün adı]: hangi sorunu çözüyor, nasıl çalışıyor ve neden denemelisin", ton: "enerjik", sn: 60, stil: "ex-3dmix" },
  { ad: "Eğitim dersi", konu: "[Konu] nedir ve nasıl çalışır? Yeni başlayanlar için adım adım", ton: "egitici", sn: 90, stil: "ex-whiteboard" },
  { ad: "Nasıl yapılır", konu: "[Görev] nasıl yapılır: 3 kolay adımda rehber", ton: "samimi", sn: 60, stil: "ex-isometric" },
  { ad: "Şirket duyurusu", konu: "Ekibimize duyuru: [değişiklik] ve bu sizin için ne anlama geliyor", ton: "profesyonel", sn: 45, stil: "ex-mixedmedia" },
  { ad: "Veri hikâyesi", konu: "[Rapor] sonuçları: 3 çarpıcı bulgu ve anlamı", ton: "profesyonel", sn: 75, stil: "ex-lowpoly" },
  { ad: "Sosyal medya ipucu", konu: "[Konu] hakkında kimsenin söylemediği 3 ipucu", ton: "enerjik", sn: 30, oran: "9:16", stil: "ex-2dillustrator" },
];
const SURELER: [number, string][] = [[30, "30 saniye"], [45, "45 saniye"], [60, "1 dakika"], [90, "1,5 dakika"], [120, "2 dakika"], [180, "3 dakika"]];
const TONLAR: [ExTon, string][] = [["samimi", "Samimi"], ["profesyonel", "Profesyonel"], ["egitici", "Eğitici"], ["enerjik", "Enerjik"], ["ilham", "İlham"]];
const KITLELER: [ExKitle, string][] = [["genel", "Genel"], ["baslangic", "Yeni başlayan"], ["uzman", "Uzman"], ["yonetici", "Yönetici"], ["cocuk", "Çocuk"]];
const TON_BILGI: Record<ExTon, { alt: string; ikon: typeof Smile }> = { samimi: { alt: "Sohbet eder gibi", ikon: Smile }, profesyonel: { alt: "Net ve güvenilir", ikon: Briefcase }, egitici: { alt: "Adım adım öğretir", ikon: GraduationCap }, enerjik: { alt: "Hızlı ve coşkulu", ikon: Zap }, ilham: { alt: "Duygulu, harekete geçirir", ikon: Sparkles } };
const KITLE_BILGI: Record<ExKitle, { alt: string; ikon: typeof Smile }> = { genel: { alt: "Herkes anlar", ikon: Users }, baslangic: { alt: "Terim yok, temelden", ikon: Sprout }, uzman: { alt: "Teknik ve derin", ikon: Award }, yonetici: { alt: "Özet ve sonuç", ikon: Briefcase }, cocuk: { alt: "Basit ve eğlenceli", ikon: Baby } };
const ORANLAR: [ExAyar["oran"], string, string][] = [["16:9", "16:9 yatay", "YouTube · sunum · web"], ["9:16", "9:16 dikey", "Reels · TikTok · Shorts"], ["1:1", "1:1 kare", "Gönderi · reklam"]];
const ALTYAZI: [ExAltyazi, string][] = [["karaoke", "Karaoke"], ["tiktok", "Kalın"], ["altyazi", "Klasik"], ["yok", "Kapalı"]];
const MUZIKLER: [ExMuzik, string][] = [["kurumsal", "Kurumsal"], ["sakin", "Sakin"], ["enerjik", "Enerjik"], ["duygusal", "Duygusal"], ["yok", "Müziksiz"]];
const MUZIK_RENK: Record<ExMuzik, string> = { kurumsal: "#60a5fa", sakin: "#34d399", enerjik: "#f59e0b", duygusal: "#f472b6", yok: "#71717a" };
const MUZIK_ALT: Record<ExMuzik, string> = { kurumsal: "Güven veren, dengeli", sakin: "Yumuşak, odaklı", enerjik: "Hızlı, coşkulu", duygusal: "Dokunaklı, minör", yok: "Sessiz arka plan" };

function goreli(t: number): string {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return "az önce"; if (d < 3600) return `${Math.floor(d / 60)} dk önce`; if (d < 86400) return `${Math.floor(d / 3600)} sa önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function ExGiris() {
  const projeler = useExplainer((s) => s.projeler);
  const [mod, setMod] = useState<Mod>("konu");
  const [konu, setKonu] = useState("");
  const [metin, setMetin] = useState("");
  const [url, setUrl] = useState("");
  const [dosyaAd, setDosyaAd] = useState<string | null>(null);
  const [ayar, setAyar] = useState<ExAyar>(varsayilanAyar());
  const [mesgul, setMesgul] = useState<null | "baglanti" | "senaryo">(null);
  const [yazar, setYazar] = useState<boolean | null>(null);
  const [cip, setCip] = useState<string | null>(null);
  const [sesAra, setSesAra] = useState("");
  const [sesCins, setSesCins] = useState<"hepsi" | "Kadın" | "Erkek">("hepsi");
  const [surukle, setSurukle] = useState(false);
  const [sekme, setSekme] = useState<"ilham" | "projeler">("ilham");
  const [klon, setKlon] = useState(false);
  const [ozelStilTarif, setOzelStilTarif] = useState("");
  const ozelSesler = useOzelSesler((x) => x.sesler);
  const onizle = useSesOnizle();
  const sag = useSaglayicilar();
  const masaustu = useMasaustu();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const konuRef = useRef<HTMLTextAreaElement>(null);
  const uretilenRef = useRef<HTMLElement>(null);
  const tumUretim = useProjeler((s) => s.uretimler);
  const exUretim = tumUretim.filter((u) => u.arac === EX_ARAC);
  const [izle, setIzle] = useState<Uretim | null>(null);
  const videoBul = (id: string) => exUretim.find((u) => u.meta?.kaynakId === id && u.durum === "tamam");
  /** Proje kartı: düzenleyici açılmaz. Videosu varsa oynar, kuruluyorsa bekletir, yoksa doğrudan kurulur. */
  const kartAc = (p: ExProje) => {
    const v = videoBul(p.id);
    if (v) return setIzle(v);
    if (exUretim.some((u) => u.meta?.kaynakId === p.id && u.durum === "isleniyor")) return void toast("Video kuruluyor", { description: "Bitince Üretilenler'de oynar." });
    setSekme("ilham");
    setTimeout(() => uretilenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    void explainerVideoUret(p.id);
  };
  useEffect(() => { void yazarHazir().then(setYazar); }, []);
  const a = (p: Partial<ExAyar>) => setAyar((x) => ({ ...x, ...p }));
  const stil = stilBul(ayar.stil);
  const cipAc = (id: string) => (v: boolean) => setCip(v ? id : null);

  const dosyaOku = async (d: File) => {
    if (!/\.(txt|md|markdown|csv|srt|vtt)$/i.test(d.name) && !d.type.startsWith("text/")) return void toast.error("Bu dosya türü desteklenmiyor", { description: "Şimdilik .txt, .md, .srt, .vtt ve .csv okunur. PDF ya da DOCX için metni kopyalayıp yapıştır." });
    if (d.size > 2 * 1024 * 1024) return void mesaj.dosyaCokBuyuk(2);
    let t = await d.text();
    if (/\.(srt|vtt)$/i.test(d.name)) t = t.replace(/^WEBVTT.*$/m, "").replace(/^\d+\s*$/gm, "").replace(/^[\d:.,]+\s*-->.*$/gm, "").replace(/\n{2,}/g, "\n");
    setMod("metin"); setMetin(t.slice(0, 12000)); setDosyaAd(d.name);
    if (!konu.trim()) setKonu(d.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    toast.success("Dosya okundu", { description: `${t.trim().split(/\s+/).length} sözcük okundu. Senaryo bu metinden çıkarılacak.` });
  };
  const baglanti = async () => {
    if (!url.trim()) return;
    setMesgul("baglanti");
    try {
      const r = await baglantiOku(/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);
      setMetin(r.metin); if (!konu.trim()) setKonu(r.baslik.slice(0, 120));
      toast.success("Sayfa okundu", { description: `${r.baslik.slice(0, 60)}: ${r.metin.split(/\s+/).length} sözcük okundu.` });
    } catch (e) { toast.error("Sayfa okunamadı", { description: `${e instanceof Error ? e.message : "Sayfaya ulaşılamadı."} Metni kopyalayıp yapıştırmayı dene.` }); }
    finally { setMesgul(null); }
  };

  const olustur = async () => {
    const kaynak = mod === "konu" ? "" : metin.trim();
    if (konu.trim().length < 3 && kaynak.length < 40) {
      konuRef.current?.focus();
      return void toast.error("Konu boş", { description: mod === "baglanti" ? "Bağlantıyı yapıştırıp Oku'ya bas." : "Videonun ne anlatacağını yaz ya da metin ekle." });
    }
    if (mod === "konu" && !konuAnlamli(konu)) { konuRef.current?.focus(); return void toast.error("Konu anlaşılmadı", { description: "Anlamlı bir konu yaz, örneğin: Yapay zekâ küçük işletmelere nasıl zaman kazandırır?" }); }
    const kalip = konu.match(/\[[^\]]*\]/);
    if (kalip) {
      const el = konuRef.current; if (el) { el.focus(); el.setSelectionRange(kalip.index!, kalip.index! + kalip[0].length); }
      return void toast.error("Konuyu tamamla", { description: `Köşeli parantezli yeri (${kalip[0]}) kendi konunla değiştir.` });
    }
    setMesgul("senaryo");
    const st = useExplainer.getState();
    const ad = (konu.trim() || kaynak.split(/[.!?\n]/)[0] || "Explainer").replace(/\[.*?\]/g, "").trim().slice(0, 60) || "Explainer";
    const id = st.olustur({ ad, konu: konu.trim(), kaynakMetin: kaynak || undefined, kaynakUrl: mod === "baglanti" ? url.trim() : undefined, ayar });
    st.sec(null); // düzenleyici açılmaz; video doğrudan kurulur ve Üretilenler'e düşer
    setSekme("ilham");
    let tamam = false;
    try {
      const p = useExplainer.getState().projeler.find((x) => x.id === id)!;
      const r = await senaryoOlustur(p);
      st.sahneleriAyarla(id, r.sahneler, r.kaynak);
      tamam = true;
    } catch (e) {
      const p = useExplainer.getState().projeler.find((x) => x.id === id)!;
      const { taslakSenaryo } = await import("@/lib/explainerMotor");
      st.sahneleriAyarla(id, taslakSenaryo(p.konu || kaynak, p.ayar), "taslak");
      tamam = true;
      toast.warning("Taslak senaryoyla kuruluyor", { description: `AI senaryo yazılamadı: ${e instanceof Error ? e.message : "model yanıt vermedi."}` });
    } finally {
      setMesgul(null);
    }
    if (tamam) {
      setTimeout(() => uretilenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      void explainerVideoUret(id);
    }
  };
  const baslangicSec = (b: (typeof BASLANGIC)[number]) => {
    setMod("konu"); setKonu(b.konu); a({ ton: b.ton, hedefSn: b.sn, stil: b.stil, ...(b.oran ? { oran: b.oran } : {}) });
    setTimeout(() => { const el = konuRef.current; if (el) { el.focus(); const i = b.konu.indexOf("["); if (i >= 0) el.setSelectionRange(i, b.konu.indexOf("]") + 1); } }, 350);
  };
  const st = useExplainer.getState;
  const sil = (p: ExProje) => { st().sil(p.id); toast("Explainer silindi", { description: `${p.ad} silindi.`, action: { label: "Geri al", onClick: () => useExplainer.setState((s) => ({ projeler: [p, ...s.projeler] })) } }); };
  const sahneTahmini = Math.max(3, Math.min(14, Math.round(ayar.hedefSn / 8)));
  const sureAd = SURELER.find(([s]) => s === ayar.hedefSn)?.[1] ?? kisaSure(ayar.hedefSn);
  const sirali = [...projeler].filter((p) => p.sahneler.length).sort((x, y) => y.guncelleme - x.guncelleme);

  const girdiAlani = mod === "konu" ? (
    <textarea ref={konuRef} value={konu} onChange={(e) => setKonu(e.target.value.slice(0, 600))} rows={2} aria-label="Konu"
      placeholder="Video neyi anlatsın? Örn. yapay zekâ küçük işletmelere nasıl zaman kazandırır"
      className="block w-full resize-none bg-transparent px-2 py-2 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-2 max-sm:pr-2" />
  ) : mod === "metin" ? (
    <div className="px-2 pt-1">
      <input value={konu} onChange={(e) => setKonu(e.target.value.slice(0, 120))} placeholder="Başlık (isteğe bağlı)" aria-label="Başlık" className="mb-1 h-10 w-full border-b border-white/[0.07] bg-transparent text-[15px] font-semibold text-metin outline-none placeholder:font-normal placeholder:text-metin-2" />
      <textarea value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 12000))} rows={3} aria-label="Metin"
        placeholder="Senaryonu, makaleni ya da notlarını yapıştır. Her paragraf bir ya da birkaç sahne olur."
        className="block w-full resize-none bg-transparent py-1 text-[14px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [scrollbar-width:thin]" />
      <div className="flex items-center gap-2 pb-1.5 pt-1.5">
        <AnimatePresence mode="wait" initial={false}>
          {dosyaAd ? (
            <motion.span key="dosya" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
              className="flex h-10 min-w-0 items-center gap-2 rounded-full px-1 ring-1 ring-inset ring-white/[0.12]" style={{ background: "rgba(255,255,255,0.09)" }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-metin"><FileText className="h-4 w-4" /></span>
              <span className="min-w-0 truncate text-[13px] font-medium text-metin max-sm:max-w-[130px]">{dosyaAd}</span>
              <button onClick={() => { setDosyaAd(null); setMetin(""); }} aria-label="Dosyayı kaldır" title="Kaldır" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
            </motion.span>
          ) : (
            <motion.button key="ekle" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
              onClick={() => dosyaRef.current?.click()} title="TXT, MD, SRT, VTT ya da CSV; dosyayı sayfaya sürükleyip de bırakabilirsin"
              className="group flex h-10 items-center gap-2 rounded-full pl-1 pr-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.12] transition hover:ring-white/30 active:scale-95" style={{ background: "rgba(255,255,255,0.09)" }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:-rotate-12"><Paperclip className="h-4 w-4" /></span>
              Dosyadan ekle<span className="font-normal text-metin-2 max-sm:hidden">TXT, MD, SRT</span>
            </motion.button>
          )}
        </AnimatePresence>
        <span className="flex-1" />
        {(() => {
          const n = metin.trim().split(/\s+/).filter(Boolean).length, sn = Math.round(n / 2.5);
          return n > 0 && (
            <motion.span initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} title="Ortalama konuşma hızıyla seslendirme süresi" className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] tabular-nums text-metin-2">
              <span className="text-metin">{n.toLocaleString("tr-TR")}</span>sözcük<span className="text-white/25">·</span><Clock className="h-3.5 w-3.5" />{sn < 60 ? `${sn} sn` : `${Math.floor(sn / 60)}:${String(sn % 60).padStart(2, "0")} dk`}
            </motion.span>
          );
        })()}
      </div>
    </div>
  ) : (
    <div className="px-2 pt-2">
      <div className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void baglanti(); }} placeholder="https:// makale, blog ya da ürün sayfası" aria-label="Bağlantı"
          className="h-12 min-w-0 flex-1 rounded-full px-4 text-[15px] text-metin outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-metin-2 focus:ring-white/40" style={{ background: "rgba(255,255,255,0.06)" }} />
        <Tooltip side="top" label="Sayfanın ana metni okunur; menü ve reklamlar atılır.">
          <button onClick={() => void baglanti()} disabled={!url.trim() || mesgul === "baglanti"} className="flex h-12 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0b0c0e] transition active:scale-95 disabled:opacity-40">{mesgul === "baglanti" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Oku</button>
        </Tooltip>
      </div>
      {metin && <div className="flex pb-1.5 pt-2"><span className="flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-emerald-400/[0.1] px-3 text-[12.5px] text-emerald-200 ring-1 ring-inset ring-emerald-300/20"><Check className="h-3.5 w-3.5 shrink-0" /><span className="shrink-0 tabular-nums">{metin.split(/\s+/).length} sözcük okundu</span><span className="min-w-0 truncate text-emerald-200/70">{konu}</span></span></div>}
    </div>
  );

  /* ── İstem kutusu çipleri: büyük çip (etiket + değer + görsel), hepsi kutunun üstünde açılır ── */
  const satir = (sec: boolean, ad: string, alt: string | undefined, on: React.ReactNode, f: () => void) => (
    <button key={ad} onClick={f} aria-pressed={sec} className={cn("flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left ring-1 ring-inset transition-colors", sec ? "bg-white/[0.07] ring-white/60" : "ring-transparent hover:bg-white/[0.05]")}>
      {on}<span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{ad}</span>{alt && <span className="block truncate text-[12px] text-metin-3">{alt}</span>}</span>
    </button>
  );
  const ikonKutu = (n: React.ReactNode) => <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-metin-2">{n}</span>;
  const oranSekil = (o: string, k = 16) => { const [w, h] = o.split(":").map(Number); const c = k / Math.max(w, h); return <span className="block rounded-[3px]" style={{ border: "1.5px solid rgba(255,255,255,0.85)", width: w * c, height: h * c }} />; };
  const sesAnahtar: SesAnahtar = (() => { const o = ozelSesler.find((x) => x.ad === ayar.ses); return o ? `ozel:${o.id}` as SesAnahtar : `hazir:${ayar.ses}` as SesAnahtar; })();
  const sesListe = [...useMuzik.getState().sesler.map((x): SesModel => ({ ad: x.ad, cinsiyet: x.cinsiyet === "Erkek" ? "Erkek" : "Kadın", renk: "#55d6fd", dil: "Özel ses" })), ...SESLER];
  const sesBul = sesListe.find((x) => x.ad === ayar.ses);
  const sesAvatar = (x?: SesModel, b = 36) => <SesAvatar ad={x?.ad ?? ayar.ses} renk={x?.renk ?? "#55d6fd"} boyut={b} />;
  const karo = (sec: boolean) => cn("flex min-w-0 flex-col items-start gap-2 rounded-[14px] p-2.5 text-left ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-2 ring-white" : "ring-1 ring-white/[0.06] hover:bg-white/[0.05] hover:ring-white/20");
  const ikonDaire = (sec: boolean, I: typeof Smile) => <span className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><I className="h-4 w-4" /></span>;
  const ALTYAZI_ORNEK: Record<ExAltyazi, React.ReactNode> = {
    karaoke: <span className="text-[12px] font-bold text-white">Merhaba <span className="text-[#facc15]">dünya</span></span>,
    tiktok: <span className="text-[12.5px] font-black uppercase tracking-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000]">Merhaba</span>,
    altyazi: <span className="rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[11px] text-white">Merhaba dünya</span>,
    yok: <span className="text-[11.5px] text-metin-3">Yazı yok</span>,
  };
  const ayrintilar = (
    <KCip buyuk okGizli etiket="Ton" ikon={(() => { const I = TON_BILGI[ayar.ton].ikon; return <I className="h-4 w-4" />; })()} deger={TONLAR.find((t) => t[0] === ayar.ton)?.[1]} acik={cip === "ayrinti"} setAcik={cipAc("ayrinti")} genislik={560}
      sag={<span className="text-[11.5px] text-metin-3">Senaryonun sesi ve sunumu</span>}>
      <div className="space-y-2 p-0.5">
        <MenuKart baslik="Anlatım tonu" sag={<span className="text-[11.5px] text-metin-3">Sözcük seçimi ve tempo</span>}>
          <div className="grid grid-cols-5 gap-1.5 p-1.5 max-sm:grid-cols-3">
            {TONLAR.map(([v, ad]) => { const sec = ayar.ton === v; return (
              <button key={v} onClick={() => a({ ton: v })} aria-pressed={sec} className={karo(sec)} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
                {ikonDaire(sec, TON_BILGI[v].ikon)}<span className="w-full leading-tight"><span className="block text-[13px] font-semibold text-metin">{ad}</span><span className="block text-[11px] text-metin-3">{TON_BILGI[v].alt}</span></span>
              </button>); })}
          </div>
        </MenuKart>
        <MenuKart baslik="Hedef kitle" sag={<span className="text-[11.5px] text-metin-3">Anlatımın derinliği</span>}>
          <div className="grid grid-cols-5 gap-1.5 p-1.5 max-sm:grid-cols-3">
            {KITLELER.map(([v, ad]) => { const sec = ayar.kitle === v; return (
              <button key={v} onClick={() => a({ kitle: v })} aria-pressed={sec} className={karo(sec)} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
                {ikonDaire(sec, KITLE_BILGI[v].ikon)}<span className="w-full leading-tight"><span className="block text-[13px] font-semibold text-metin">{ad}</span><span className="block text-[11px] text-metin-3">{KITLE_BILGI[v].alt}</span></span>
              </button>); })}
          </div>
        </MenuKart>
        <MenuKart baslik="Altyazı" sag={<span className="text-[11.5px] text-metin-3">Videonun üstünde görünür</span>}>
          <div className="grid grid-cols-4 gap-1.5 p-1.5 max-sm:grid-cols-2">
            {ALTYAZI.map(([v, ad]) => { const sec = ayar.altyazi === v; return (
              <button key={v} onClick={() => a({ altyazi: v })} aria-pressed={sec} className={cn(karo(sec), "items-stretch")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
                <span className="flex h-12 items-end justify-center rounded-[9px] pb-1.5" style={{ background: `url(${stilPoster(ayar.stil)}) center/cover` }}>{ALTYAZI_ORNEK[v]}</span>
                <span className="text-center text-[12.5px] font-semibold text-metin">{ad}</span>
              </button>); })}
          </div>
        </MenuKart>
      </div>
    </KCip>
  );
  const DILLER_EX: ["tr" | "en", string, string, string][] = [["tr", "Türkçe", "TR", "Senaryo ve seslendirme Türkçe"], ["en", "English", "US", "Script and voice in English"]];
  const dilCip = (
    <KCip buyuk okGizli etiket="Dil" ikon={<Bayrak b={ayar.dil === "en" ? "US" : "TR"} boyut={18} />} deger={ayar.dil === "en" ? "English" : "Türkçe"} acik={cip === "dil"} setAcik={cipAc("dil")} genislik={380}
      sag={<span className="text-[11.5px] text-metin-3">Senaryo bu dilde yazılır</span>}>
      <div className="grid grid-cols-2 gap-1.5 p-0.5">
        {DILLER_EX.map(([v, ad, b, alt]) => { const sec = ayar.dil === v; return (
          <button key={v} onClick={() => { a({ dil: v }); setCip(null); }} aria-pressed={sec} className={cn(karo(sec), "flex-row items-center gap-3 p-3")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
            <Bayrak b={b} boyut={28} /><span className="min-w-0 leading-tight"><span className="block text-[14px] font-semibold text-metin">{ad}</span><span className="block text-[11.5px] text-metin-3">{alt}</span></span>
          </button>); })}
      </div>
    </KCip>
  );
  const CIPLER = (
    <>
      <KCip buyuk okGizli etiket="Süre" ikon={<Clock className="h-4 w-4" />} deger={sureAd} acik={cip === "sure"} setAcik={cipAc("sure")} genislik={300}>
        <div className="grid grid-cols-2 gap-1.5 p-1">
          {SURELER.map(([sn, ad]) => (
            <button key={sn} onClick={() => { a({ hedefSn: sn }); setCip(null); }} aria-pressed={ayar.hedefSn === sn}
              className={cn("rounded-[12px] px-3 py-2.5 text-left ring-1 ring-inset transition", ayar.hedefSn === sn ? "bg-white/[0.08] ring-white/70" : "ring-white/[0.07] hover:bg-white/[0.04] hover:ring-white/20")}>
              <span className="block text-[14px] font-semibold text-metin">{ad}</span>
              <span className="block text-[12px] text-metin-3">Yaklaşık {Math.max(3, Math.min(14, Math.round(sn / 8)))} sahne</span>
            </button>
          ))}
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Format" ikon={oranSekil(ayar.oran)} deger={ayar.oran} acik={cip === "oran"} setAcik={cipAc("oran")} genislik={300}>
        {ORANLAR.map(([o, ad, alt]) => satir(ayar.oran === o, ad, alt, ikonKutu(oranSekil(o, 18)), () => { a({ oran: o }); setCip(null); }))}
      </KCip>
      <KCip buyuk okGizli etiket="Görsel stil" ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={stilPoster(ayar.stil)} alt="" className="h-full w-full object-cover" />} deger={stil.ad} acik={cip === "stil"} setAcik={cipAc("stil")} genislik={560}
        sag={<span className="text-[11.5px] text-metin-3">Üzerine gel, örneği oynasın</span>}>
        <OzelGirdi deger={ozelStilTarif} set={setOzelStilTarif} secili={ayar.stil.startsWith("ozel|")} ph="Ör. sulu boya, pastel tonlar, yumuşak kenarlar"
          alt={`Kendi stilini tarif et; taban olarak ${EX_STILLER.find((x) => x.tohum === stilTaban(ayar.stil))?.ad ?? "seçili stil"} kullanılır`}
          uygula={() => { a({ stil: ozelStil(stilTaban(ayar.stil), ozelStilTarif) }); setCip(null); toast.success("Özel stil uygulandı", { description: "Tarifin senaryoya ve görsellere işlenir." }); }} />
        <div className="grid grid-cols-3 gap-2 p-1">
          {EX_STILLER.map((x) => <IzgaraSec key={x.tohum} sec={stilTaban(ayar.stil) === x.tohum && !ayar.stil.startsWith("ozel|")} ad={x.ad} alt={x.kisa} kapak={stilPoster(x.tohum)} video={stilVideo(x.tohum)} oran="aspect-video" onClick={() => { a({ stil: ayar.stil.startsWith("ozel|") ? ozelStil(x.tohum, ayar.stil.split("|").slice(2).join(" ")) : x.tohum }); if (!ayar.stil.startsWith("ozel|")) setCip(null); }} />)}
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Anlatıcı" ikon={sesAvatar(sesBul, 36)} deger={ayar.ses} acik={cip === "ses"} setAcik={cipAc("ses")} genislik={560}
        sag={<span className="text-[11.5px] text-metin-3">Dinlemek için küreye bas</span>}>
        <div className="-m-2 flex h-[min(520px,60vh)] flex-col">
          <SesListe secili={sesAnahtar} cal={onizle.cal} calan={onizle.calan} onKlonla={() => { setCip(null); setKlon(true); }}
            onSec={(k) => { const b = sesBilgi(k, ozelSesler); a({ ses: b.ad, sesId: b.sesId }); setCip(null); toast.success(`Anlatıcı ${b.ad} olarak seçildi`); }} />
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Müzik" ikon={<span className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(140deg, ${MUZIK_RENK[ayar.muzik]}, ${MUZIK_RENK[ayar.muzik]}55)` }}><Music2 className="h-4 w-4 text-white" /></span>} deger={MUZIKLER.find((m) => m[0] === ayar.muzik)?.[1]} acik={cip === "muzik"} setAcik={cipAc("muzik")} genislik={520}
        sag={<span className="text-[11.5px] text-metin-3">Videonun süresine göre bestelenir</span>}>
        <div className="grid grid-cols-2 gap-1.5 p-0.5">
          {MUZIKLER.map(([m, ad]) => {
            const sec = ayar.muzik === m, r = MUZIK_RENK[m], ruh = m === "yok" ? null : MUZIK_RUH[m];
            return (
              <button key={m} onClick={() => { a({ muzik: m }); setCip(null); }} aria-pressed={sec}
                className={cn("flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-[14px] p-3 text-left ring-inset transition-[box-shadow,transform] hover:-translate-y-px", m === "yok" && "col-span-2", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:ring-white/25")}
                style={{ background: `radial-gradient(120% 100% at 0% 0%, ${r}${sec ? "40" : "26"}, transparent 65%), rgba(255,255,255,0.03)` }}>
                <span className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/20" style={{ background: `linear-gradient(145deg, ${r}, ${r}80)` }}><Music2 className="h-4 w-4 text-white" /></span>
                  <span className="min-w-0 flex-1 leading-tight"><span className="flex items-center gap-1.5"><span className="text-[14px] font-semibold text-metin">{ad}</span>{ruh && <span className="rounded-full bg-black/25 px-1.5 py-px text-[10.5px] font-medium tabular-nums text-white/80">{ruh.bpm} BPM</span>}</span><span className="block text-[11.5px] text-metin-3">{MUZIK_ALT[m]}</span></span>
                </span>
                {ruh ? <Dalga ad={`muzik-${m}`} renk={r} adet={30} yukseklik={22} className="w-full justify-between" /> : <span className="text-[12px] text-metin-2">Yalnız anlatım ve efektler duyulur</span>}
              </button>
            );
          })}
        </div>
      </KCip>
      {dilCip}
      {ayrintilar}
    </>
  );

  /* ═════════ A · Stüdyo düzeni: üstte sekmeler, ortada vitrin, altta yüzen komut kutusu ═════════ */
  const kaynakSecici = (
    <div role="tablist" aria-label="Kaynak" className="cam-istemci pointer-events-auto isolate mb-2 inline-grid grid-cols-3 gap-0.5 self-start rounded-full p-1 max-sm:grid max-sm:w-full">
      {MODLAR.map(([id, ad, I]) => (
        <button key={id} role="tab" aria-selected={mod === id} onClick={() => { setMod(id); setCip(null); }}
          className={cn("relative flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors max-sm:px-1.5", mod === id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {mod === id && <motion.span layoutId="ex-mod" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
          <I className="h-3.5 w-3.5" />{ad}
        </button>
      ))}
    </div>
  );
  const komut = (
    <div className="pointer-events-auto flex w-full flex-col">
    {kaynakSecici}
    <div className="cam-istemci relative w-full rounded-[26px] p-3"
      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void olustur(); } }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mod} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>{girdiAlani}</motion.div>
      </AnimatePresence>
      <div className="mt-1 flex items-center gap-2 border-t border-white/[0.08] px-0.5 pt-2.5 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] max-sm:grid max-sm:grid-cols-2 max-sm:[&>*>button]:w-full max-sm:[&_.whitespace-nowrap]:block max-sm:[&_.whitespace-nowrap]:max-w-full max-sm:[&_.whitespace-nowrap]:truncate">{CIPLER}</div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => void olustur()} disabled={!!mesgul} title="Ctrl+Enter"
          className="group flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition disabled:opacity-60 max-sm:justify-center">
          {mesgul === "senaryo" ? <><Loader2 className="h-4 w-4 animate-spin" />Senaryo yazılıyor</> : <>Video oluştur<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
        </motion.button>
      </div>
    </div>
    </div>
  );


  const ilham = (
    <div className="space-y-4">
      <ExUretilenler ref={uretilenRef} onTumu={() => setSekme("projeler")} />
      {/* Hero: arkada seçili stilin klibi, solda başlık + adımlar, sağda camda canlı mekanizma */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0b0c0e] ring-1 ring-inset ring-white/[0.08] lg:min-h-[440px]">
        <video key={`bg-${stilTaban(ayar.stil)}`} src={stilVideo(ayar.stil)} poster={stilPoster(ayar.stil)} autoPlay muted loop playsInline aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70" />
        <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0c0e_0%,rgba(11,12,14,0.92)_34%,rgba(11,12,14,0.55)_66%,rgba(11,12,14,0.3)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,14,0.6)_0%,rgba(11,12,14,0.9)_55%,#0b0c0e_100%)]" />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-7 sm:px-10 lg:min-h-[440px] lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-center lg:gap-10 lg:py-10">
          <div className="min-w-0">
            <h1 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[56px]">Konunu yaz.<br /><span className="hero-isilti">Explainer hazır.</span></h1>
            <p className="mt-4 max-w-[460px] text-[15.5px] leading-relaxed text-white/70">Konu, metin ya da bir bağlantı ver. Senaryo sahnelere bölünür; görsel, seslendirme, müzik ve altyazıyla video doğrudan kurulur, MP4 hazır gelir.</p>
            <ol className="mt-6 flex flex-wrap gap-2">
              {([["Konunu yaz", Lightbulb], ["Senaryo sahnelere bölünür", FileText], ["MP4 hazır", Film]] as const).map(([ad, I], i) => (
                <motion.li key={ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06 }} className="flex h-9 items-center gap-2 rounded-full bg-white/[0.08] pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.12] text-[12px] font-semibold tabular-nums text-white">{i + 1}</span><I className="h-3.5 w-3.5 text-white/60" />{ad}
                </motion.li>
              ))}
            </ol>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="cam-istemci relative rounded-[24px] p-3">
            <ExMekanizma stil={ayar.stil} konu={konu.replace(/\[|\]/g, "").trim()} />
          </motion.div>
        </div>
      </section>

      {/* Kalıplar */}
      <section className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><Lightbulb className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Bir kalıpla başla</span><span className="block text-[12.5px] text-metin-3">Tıkla; konu, ton, süre ve stil kutuya yerleşsin, köşeli parantezi doldur</span></span>
          <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin-2">{BASLANGIC.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {BASLANGIC.map((b, i) => <KalipKart key={b.ad} b={b} sira={i} onSec={() => baslangicSec(b)} />)}
        </div>
      </section>

      {/* Görsel stiller: oynayan örnekler */}
      <section className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><Film className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Görsel stil</span><span className="block text-[12.5px] text-metin-3">Üzerine gel, örneği oynasın. Yazı tipi ve vurgu rengi stile göre kurulur.</span></span>
          <span className="rounded-full px-2.5 py-0.5 text-[12px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.08]">{EX_STILLER.length} stil</span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {EX_STILLER.map((s, i) => <StilKart key={s.tohum} sira={i} tohum={s.tohum} ad={s.ad} kisa={s.kisa} sec={ayar.stil === s.tohum} onSec={() => { a({ stil: s.tohum }); toast.success(`${s.ad} seçildi`, { description: "Komut kutusundaki stil güncellendi." }); }} />)}
        </div>
      </section>
    </div>
  );

  const projelerim = sirali.length ? (
    <section className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
    <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><Film className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Explainer&apos;larım</span><span className="block text-[12.5px] text-metin-3">Tıkla, videosunu izle; videosu olmayanlar tek tıkla kurulur</span></span>
      <span className="rounded-full px-2.5 py-0.5 text-[12px] tabular-nums text-metin-3 ring-1 ring-inset ring-white/[0.08]">{sirali.length}</span>
    </div>
    <div className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sirali.map((p, i) => {
        const kapak = videoBul(p.id)?.gorselUrl ?? p.sahneler.find((s) => s.gorselUrl)?.gorselUrl ?? stilPoster(p.ayar.stil);
        const sesli = p.sahneler.filter((s) => s.sesUrl).length;
        return (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} whileHover={{ y: -3 }}
            className="group relative overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition-colors hover:ring-white/[0.18]">
            <button onClick={() => kartAc(p)} aria-label={`${p.ad} aç`} className="block w-full text-left">
              <span className="relative block aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />
                <span className="absolute left-3 top-3 flex gap-1.5">
                  <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-white backdrop-blur">{p.ayar.oran}</span>
                  <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-white backdrop-blur"><Clock className="h-3 w-3" />{kisaSure(toplamSure(p.sahneler))}</span>
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black">{videoBul(p.id) ? <><Play className="h-3.5 w-3.5 fill-current" />İzle</> : <><Film className="h-3.5 w-3.5" />Videoyu kur</>}</span>
                </span>
              </span>
              <span className="block p-3.5 pt-3">
                <span className="block truncate text-[15px] font-semibold text-metin">{p.ad}</span>
                <span className="mt-0.5 block truncate text-[12.5px] text-metin-3">{p.sahneler.length} sahne · {stilBul(p.ayar.stil).ad}{sesli ? ` · ${sesli} sesli` : ""} · {goreli(p.guncelleme)}</span>
              </span>
            </button>
            <span className="absolute right-2.5 top-2.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <button onClick={() => { st().cogalt(p.id); toast.success("Explainer çoğaltıldı"); }} aria-label="Çoğalt" title="Çoğalt" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75 active:scale-90"><Copy className="h-3.5 w-3.5" /></button>
              <button onClick={() => sil(p)} aria-label="Sil" title="Sil" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-rose-500/80 active:scale-90"><Trash2 className="h-3.5 w-3.5" /></button>
            </span>
          </motion.div>
        );
      })}
    </div>
    </section>
  ) : (
    <section className="mx-auto max-w-[920px] overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><Film className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Henüz explainer yok</span><span className="block text-[12.5px] text-metin-3">Alttaki kutuya konunu yaz ya da bir kalıpla başla</span></span>
      </div>
      <div className="p-1.5">
        {BASLANGIC.map((k) => (
          <button key={k.ad} onClick={() => { baslangicSec(k); setSekme("ilham"); }} className="group flex w-full items-center gap-3 rounded-[14px] p-2 text-left transition-colors hover:bg-white/[0.05] active:scale-[0.995]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stilPoster(k.stil)} alt="" className="h-12 w-16 shrink-0 sm:w-20 rounded-[10px] object-cover ring-1 ring-inset ring-white/10" />
            <span className="min-w-0 flex-1"><span className="block text-[14px] font-medium text-metin">{k.ad}</span><span className="block truncate text-[12.5px] text-metin-3">{k.konu.replace(/\[|\]/g, "")}</span></span>
            <span className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] tabular-nums text-metin-2">{k.sn < 60 ? `${k.sn} sn` : `${(k.sn / 60).toLocaleString("tr-TR")} dk`}{k.oran === "9:16" ? " · 9:16" : ""}</span>
            <span className="flex h-8 shrink-0 items-center rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white opacity-0 transition group-hover:bg-white group-hover:text-black group-hover:opacity-100 max-sm:hidden">Başla</span>
          </button>
        ))}
      </div>
    </section>
  );

  const surukleme = {
    onDragOver: (e: React.DragEvent) => { if (!e.dataTransfer.types.includes("Files")) return; e.preventDefault(); setSurukle(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSurukle(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSurukle(false); const d = e.dataTransfer.files[0]; if (d) void dosyaOku(d); },
  };
  const sekmeCubugu = (
    <div className="shrink-0 px-6 pt-4 max-sm:px-4">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 rounded-[20px] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.05)" }}><Film className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0 leading-tight max-sm:hidden"><span className="block text-[15px] font-semibold text-metin">Explainer stüdyosu</span><span className="block text-[12.5px] text-metin-3">Konudan senaryo, sahnelerden video</span></span>
        <span className="flex-1" />
        <div role="tablist" className="isolate flex gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
          {([["ilham", "İlham", Lightbulb, 0], ["projeler", "Explainer'larım", Film, sirali.length]] as const).map(([id, ad, I, n]) => (
            <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)}
              className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {sekme === id && <motion.span layoutId="ex-sekme" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
              <I className="h-4 w-4" />{ad}
              {n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", sekme === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  const icerik = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={sekme} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>{sekme === "ilham" ? ilham : projelerim}</motion.div>
    </AnimatePresence>
  );
  const dosyaGirdi = <input ref={dosyaRef} type="file" accept=".txt,.md,.markdown,.srt,.vtt,.csv,text/*" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void dosyaOku(d); }} />;
  const surukleKatman = surukle && <div className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-[24px] border-2 border-dashed border-white/40 bg-black/70 text-[15px] font-semibold text-metin">Metin dosyasını bırak: .txt, .md, .srt</div>;

  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-[calc(100dvh-var(--ust-nav))] overflow-x-hidden bg-zemin" {...surukleme}>
          {dosyaGirdi}{surukleKatman}<AnimatePresence>{izle && <UretimGoruntuleyici key="izle" u={izle} liste={exUretim.filter((x) => x.durum === "tamam")} onSec={(id) => { const u = exUretim.find((x) => x.id === id); if (u) setIzle(u); }} onKapat={() => setIzle(null)} />}</AnimatePresence>
          <AnimatePresence>{klon && <KlonModal gercek={sag ? sag.eleven === true : null} onKapat={() => setKlon(false)} onKlonlandi={(ad) => { const o = useOzelSesler.getState().sesler.find((x) => x.ad === ad); if (o) a({ ses: o.ad, sesId: o.sesId }); }} />}</AnimatePresence>
          {sekmeCubugu}
          <div className="space-y-6 px-4 pb-10 pt-5">
            {sekme === "ilham" && <div>{komut}</div>}
            {icerik}
          </div>
          
        </div>
      </MotionConfig>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-[calc(100dvh-var(--ust-nav))] flex-col overflow-hidden bg-zemin" {...surukleme}>
        {dosyaGirdi}{surukleKatman}<AnimatePresence>{izle && <UretimGoruntuleyici key="izle" u={izle} liste={exUretim.filter((x) => x.durum === "tamam")} onSec={(id) => { const u = exUretim.find((x) => x.id === id); if (u) setIzle(u); }} onKapat={() => setIzle(null)} />}</AnimatePresence>
        <AnimatePresence>{klon && <KlonModal gercek={sag ? sag.eleven === true : null} onKapat={() => setKlon(false)} onKlonlandi={(ad) => { const o = useOzelSesler.getState().sesler.find((x) => x.ad === ad); if (o) a({ ses: o.ad, sesId: o.sesId }); }} />}</AnimatePresence>
        {sekmeCubugu}
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className="mx-auto max-w-[1440px] px-6 pb-[280px] pt-4">{icerik}</div>
        </div>
        <motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 34, delay: 0.05 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
          <div className="flex justify-center px-6 pb-5 pt-6"><div className="w-full max-w-[1240px]">{komut}</div></div>
        </motion.div>
        
      </div>
    </MotionConfig>
  );
}

/** Hero mekanizması: stilin klibi oynar, senaryonun sahneleri sırayla altyazı olur, üstte sahne çubukları ilerler. */
function ExMekanizma({ stil, konu }: { stil: string; konu: string }) {
  const sahneler = [konu || "Yapay zekâ işini nasıl hızlandırır?", "Neden önemli?", "3 adımda nasıl çalışır", "Şimdi sıra sende"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % 4), 2400); return () => clearInterval(t); }, []);
  return (
    <div className="relative aspect-video overflow-hidden rounded-[16px] bg-black ring-1 ring-inset ring-white/15">
      <video key={stilTaban(stil)} src={stilVideo(stil)} poster={stilPoster(stil)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
      <span className="absolute inset-x-3 top-3 flex gap-1">
        {sahneler.map((_, k) => (
          <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            {k < i ? <span className="block h-full w-full bg-white" /> : k === i ? <motion.span key={`s${i}`} className="block h-full bg-white" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.4, ease: "linear" }} /> : null}
          </span>
        ))}
      </span>
      <span className="absolute left-3 top-6 rounded-full bg-black/55 px-2.5 py-0.5 text-[11.5px] font-medium tabular-nums text-white backdrop-blur">Sahne {i + 1} / 4</span>
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
          className="absolute inset-x-4 bottom-4 text-center text-[17px] font-extrabold leading-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000]">
          {sahneler[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/** Hazır kalıp karosu: üzerine gelince stilin örnek videosu oynar, tıklayınca kutuya kurulur. */
function KalipKart({ b, sira, onSec }: { b: (typeof BASLANGIC)[number]; sira: number; onSec: () => void }) {
  const [oyna, setOyna] = useState(false);
  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34, delay: 0.12 + sira * 0.04 }} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
      onClick={onSec} onPointerEnter={(e) => e.pointerType === "mouse" && setOyna(true)} onPointerLeave={() => setOyna(false)}
      className="group relative aspect-[3/4] overflow-hidden rounded-[18px] bg-black text-left ring-1 ring-white/10 transition hover:ring-white/35">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stilPoster(b.stil)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {oyna && <video src={stilVideo(b.stil)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">{b.sn < 60 ? `${b.sn} sn` : `${String(b.sn / 60).replace(".", ",")} dk`}{b.oran ? ` · ${b.oran}` : ""}</span>
      <span className="absolute inset-x-2.5 bottom-2.5 text-center"><span className="block text-[11.5px] text-white/70">{stilBul(b.stil).ad}</span><span className="block truncate text-[14.5px] font-semibold text-white">{b.ad}</span></span>
    </motion.button>
  );
}

function StilKart({ tohum, ad, kisa, sec, onSec, sira = 0 }: { tohum: string; ad: string; kisa: string; sec: boolean; onSec: () => void; sira?: number }) {
  const [oyna, setOyna] = useState(false);
  return (
    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + Math.min(sira, 10) * 0.03 }} onClick={onSec} aria-pressed={sec}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOyna(true)} onPointerLeave={() => setOyna(false)} className="group min-w-0 text-left">
      <span className={cn("relative block aspect-video overflow-hidden rounded-[14px] bg-black transition duration-300 group-hover:-translate-y-0.5", sec ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/25")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stilPoster(tohum)} alt="" className="absolute inset-0 -z-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {oyna && <video src={stilVideo(tohum)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
        {!oyna && <span className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"><Play className="h-3 w-3 fill-current" /></span>}
      </span>
      <span className="mt-1.5 flex items-baseline gap-1.5"><span className={cn("truncate text-[13.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{ad}</span><span className="truncate text-[12px] text-metin-3">{kisa}</span></span>
    </motion.button>
  );
}
