"use client";

/**
 * Çalışan oluşturucu (2026-11-03 baştan): solda kartlı ayarlar, sağda canlı deneme.
 * Hızlı başlangıç (tariften model taslağı ya da hazır çalışandan kopya) → Kimlik → Talimat (iskelet + kapsam ölçeri)
 * → Yetenekler (model + araç anahtarları) → Başlangıç soruları → Bilgi dosyaları → Görünürlük.
 * Sağda iki sekme: Sohbet (kaydetmeden gerçek uç noktayla dene) ve Vitrin kartı.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowLeft, ArrowUp, Brain, Check, FileText, Globe, Loader2, Pin, Plus, RotateCcw, Sparkles, Square, Telescope, Trash2, Upload, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { CALISAN_IKONLARI, CALISAN_KATEGORILERI, CALISAN_RENKLERI, HAZIR_CALISANLAR, calisanBul, useScCalisan, type CalisanIkon, type ScCalisan } from "@/lib/scCalisan";
import { SC_VARSAYILAN_MODEL, bosYanit, modelAdi, olayUygula, sohbetAkisi, type ScYanit } from "@/lib/scSohbet";
import { ScModelSecici } from "@/components/sc/ScSecici";
import { Markdown } from "../sohbet/Markdown";
import { CALISAN_IKON, CalisanAvatar, CalisanKapak } from "./CalisanGorsel";

type Taslak = Omit<ScCalisan, "id">;
const BOS: Taslak = { ad: "", ikon: "bot", kategori: "Kişisel", renk: CALISAN_RENKLERI[0], aciklama: "", talimat: "", araclar: {}, baslaticilar: ["", ""], dosyalar: [], model: SC_VARSAYILAN_MODEL };
const YAY = { type: "spring", stiffness: 460, damping: 36 } as const;
const GIRDI = "block w-full rounded-[12px] bg-black/25 px-3.5 text-[14px] text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/[0.08] transition placeholder:text-[var(--sc-metin-3)] focus:ring-white/30";
const ETIKET = "mb-1.5 block text-[12.5px] font-medium text-[var(--sc-metin-2)]";
const SINIR = 512 * 1024;

/** Talimat iskeletleri ve kapsam ölçeri bunlara bakar. */
const ISKELET: { ad: string; metin: string; ara: RegExp }[] = [
  { ad: "Rol", metin: "## Rol\nSen deneyimli bir … uzmanısın.\n", ara: /\b(sen|rol)\b|uzman/i },
  { ad: "Görev", metin: "## Görev\nKullanıcının … yapmasına yardım edersin.\n", ara: /görev|yardım ed|amaç/i },
  { ad: "Ton", metin: "## Ton\nSamimi ama profesyonel; kısa cümleler.\n", ara: /\bton\b|üslup|samimi|resmî|resmi/i },
  { ad: "Kurallar", metin: "## Kurallar\n- Bilmediğin bilgiyi uydurma\n- Belirsizse önce en fazla 2 soru sor\n", ara: /kural|uydurma|asla|yapma/i },
  { ad: "Biçim", metin: "## Yanıt biçimi\n- Kısa giriş\n- Maddeler ya da tablo\n- Tek cümlelik sonuç\n", ara: /biçim|format|madde|tablo|başlık/i },
  { ad: "Örnek", metin: "## Örnek\nKullanıcı: …\nSen: …\n", ara: /örnek/i },
];

function Kart({ baslik, alt, sag, children, className }: { baslik: string; alt?: string; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("overflow-hidden rounded-[20px] bg-[var(--sc-kart)] ring-1 ring-inset ring-white/[0.07]", className)}>
      <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1"><h2 className="text-[14.5px] font-semibold">{baslik}</h2>{alt && <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--sc-metin-3)]">{alt}</p>}</div>
        {sag}
      </header>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </motion.section>
  );
}

function Anahtar({ acik }: { acik: boolean }) {
  return (
    <span className={cn("relative flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors", acik ? "bg-white" : "bg-white/[0.12]")}>
      <motion.span layout transition={YAY} className={cn("h-[17px] w-[17px] rounded-full", acik ? "ml-[18px] bg-[#0b0b0c]" : "ml-[3px] bg-white")} />
    </span>
  );
}

/* ── Sağ: canlı deneme ── */
function Deneme({ c }: { c: Taslak }) {
  const [mesajlar, setMesajlar] = useState<{ rol: "kullanici" | "asistan"; metin: string; yanit?: ScYanit }[]>([]);
  const [girdi, setGirdi] = useState("");
  const [akiyor, setAkiyor] = useState(false);
  const kesici = useRef<AbortController | null>(null);
  const kaydir = useRef<HTMLDivElement>(null);
  useEffect(() => { kaydir.current?.scrollTo({ top: kaydir.current.scrollHeight, behavior: "smooth" }); }, [mesajlar]);
  const hazir = c.talimat.trim().length >= 10;

  const gonder = async (t: string) => {
    const metin = t.trim(); if (!metin || akiyor || !hazir) return;
    const gecmis = [...mesajlar.map((m) => ({ rol: m.rol, metin: m.rol === "asistan" ? (m.yanit ? m.yanit.parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("") : m.metin) : m.metin })), { rol: "kullanici" as const, metin }];
    setMesajlar((l) => [...l, { rol: "kullanici", metin }, { rol: "asistan", metin: "", yanit: bosYanit() }]); setGirdi(""); setAkiyor(true);
    const k = new AbortController(); kesici.current = k;
    let y = bosYanit(); let bagliDegil = false;
    const yaz = () => setMesajlar((l) => { const x = [...l]; x[x.length - 1] = { rol: "asistan", metin: "", yanit: y }; return x; });
    try {
      await sohbetAkisi({ mesajlar: gecmis, model: c.model ?? SC_VARSAYILAN_MODEL, dusun: !!c.araclar.dusun, web: !!c.araclar.web, arastir: !!c.araclar.arastir, stil: "normal",
        calisan: { ad: c.ad || "Yeni çalışan", talimat: c.talimat, dosyalar: c.dosyalar.map((d) => ({ ad: d.ad, icerik: d.icerik })) } },
        (o) => { if (!bagliDegil) { y = olayUygula(y, o); yaz(); } }, () => { bagliDegil = true; k.abort(); }, k.signal);
      if (y.durum === "akiyor") y = { ...y, durum: "bitti" };
    } catch (e) { y = bagliDegil ? { ...y, durum: "hata", hata: "Deneme için model bağlantısı gerekiyor; çalışanı yine de kaydedebilirsin." } : (e as Error).name === "AbortError" ? { ...y, durum: "durdu" } : { ...y, durum: "hata", hata: "Bağlantı kurulamadı." }; }
    yaz(); setAkiyor(false); kesici.current = null;
  };

  const sorular = c.baslaticilar.filter((b) => b.trim());
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={kaydir} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:thin]">
        {mesajlar.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center py-6 text-center">
            <motion.div key={`${c.ikon}${c.renk}`} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={YAY}><CalisanAvatar c={c} boyut={68} /></motion.div>
            <p className="mt-3.5 text-[20px] font-semibold tracking-[-0.02em]">{c.ad.trim() || "Yeni çalışan"}</p>
            <p className="mt-1 max-w-[360px] text-[13.5px] leading-snug text-[var(--sc-metin-2)]">{c.aciklama.trim() || "Kısa açıklama burada görünür."}</p>
            <span className="mt-3 flex items-center gap-1.5 rounded-full bg-white/[0.065] px-2.5 py-1 text-[12px] text-[var(--sc-metin-2)]">{modelAdi(c.model ?? SC_VARSAYILAN_MODEL)}{c.araclar.web && " · Web"}{c.araclar.dusun && " · Uzun düşün"}{c.araclar.arastir && " · Derin araştırma"}</span>
            {sorular.length > 0 && (
              <div className="mt-6 grid w-full max-w-[480px] grid-cols-2 gap-2 max-sm:grid-cols-1">
                {sorular.map((b) => <button key={b} disabled={!hazir} onClick={() => void gonder(b)} className="rounded-[14px] bg-white/[0.045] px-3.5 py-3 text-left text-[13px] leading-snug text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.085] hover:text-[var(--sc-metin)] active:scale-[0.98] disabled:opacity-50">{b}</button>)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {mesajlar.map((m, i) => m.rol === "kullanici"
              ? <div key={i} className="flex justify-end"><p className="max-w-[85%] whitespace-pre-wrap rounded-[18px] bg-[#1f1f23] px-3.5 py-2 text-[14px]">{m.metin}</p></div>
              : (
                <div key={i} className="flex gap-2.5">
                  <CalisanAvatar c={c} boyut={26} className="mt-0.5" />
                  <div className="min-w-0 flex-1 text-[14px]">
                    {m.yanit && (m.yanit.parcalar.some((p) => p.tur === "metin")
                      ? <Markdown metin={m.yanit.parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")} akiyor={m.yanit.durum === "akiyor"} />
                      : m.yanit.durum === "akiyor" ? <span className="sc-parilti text-[13.5px] font-medium">Düşünüyor</span> : null)}
                    {m.yanit?.durum === "hata" && <p className="rounded-[12px] bg-white/[0.055] px-3 py-2 text-[13px] text-[var(--sc-metin-2)]">{m.yanit.hata}</p>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      <div className="shrink-0 p-3">
        <div className="flex items-end gap-2 rounded-[20px] bg-[#1c1c1f] p-2 pl-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/[0.2]">
          <textarea value={girdi} onChange={(e) => setGirdi(e.target.value)} rows={1} placeholder={hazir ? `${c.ad.trim() || "Çalışan"} ile dene` : "Denemek için önce talimat yaz"} disabled={!hazir} aria-label="Deneme mesajı"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void gonder(girdi); } }}
            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-[14px] outline-none [field-sizing:content] placeholder:text-[var(--sc-metin-3)] disabled:opacity-60" />
          {mesajlar.length > 0 && !akiyor && <button onClick={() => setMesajlar([])} aria-label="Denemeyi sıfırla" title="Denemeyi sıfırla" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--sc-metin-2)] transition hover:bg-white/[0.085] hover:text-[var(--sc-metin)]"><RotateCcw className="h-4 w-4" /></button>}
          {akiyor
            ? <button onClick={() => kesici.current?.abort()} aria-label="Durdur" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0b0c]"><Square className="h-3 w-3 fill-current" /></button>
            : <button onClick={() => void gonder(girdi)} disabled={!girdi.trim() || !hazir} aria-label="Gönder" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0b0c] transition active:scale-90 disabled:bg-white/[0.085] disabled:text-[var(--sc-metin-3)]"><ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ── Sağ: vitrin kartı önizlemesi (Çalışanlar sayfasındaki kartın aynısı) ── */
function VitrinOnizleme({ c }: { c: Taslak }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <div className="w-full max-w-[320px] overflow-hidden rounded-[20px] bg-[var(--sc-kart)] ring-1 ring-inset ring-white/[0.08]">
        <CalisanKapak c={c} className="aspect-[16/9] w-full" />
        <div className="relative px-4 pb-4 pt-7">
          <CalisanAvatar c={c} boyut={44} className="absolute -top-6 left-4 ring-4 ring-[var(--sc-kart)]" />
          <p className="truncate text-[16px] font-semibold">{c.ad.trim() || "Yeni çalışan"}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[var(--sc-metin-2)]">{c.aciklama.trim() || "Kısa açıklama"}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/[0.065] px-2 py-0.5 text-[11.5px] text-[var(--sc-metin-2)]">{c.kategori}</span>
            {c.araclar.web && <span className="flex items-center gap-1 rounded-full bg-white/[0.065] px-2 py-0.5 text-[11.5px] text-[var(--sc-metin-2)]"><Globe className="h-3 w-3" />Web</span>}
            {c.araclar.arastir && <span className="flex items-center gap-1 rounded-full bg-white/[0.065] px-2 py-0.5 text-[11.5px] text-[var(--sc-metin-2)]"><Telescope className="h-3 w-3" />Araştırma</span>}
            {c.araclar.dusun && <span className="flex items-center gap-1 rounded-full bg-white/[0.065] px-2 py-0.5 text-[11.5px] text-[var(--sc-metin-2)]"><Brain className="h-3 w-3" />Uzun düşün</span>}
          </div>
        </div>
      </div>
      <p className="max-w-[320px] text-center text-[12.5px] text-[var(--sc-metin-3)]">Çalışanlar sayfasında ve ana ekranda bu kartla görünür.</p>
    </div>
  );
}

export function CalisanOlusturucu() {
  const router = useRouter();
  const sp = useSearchParams();
  const duzenId = sp.get("id"), kopyaId = sp.get("kopya");
  const [c, setC] = useState<Taslak>(BOS);
  const [sekme, setSekme] = useState<"ayar" | "deneme">("ayar");
  const [sag, setSag] = useState<"sohbet" | "vitrin">("sohbet");
  const [hazir, setHazir] = useState(false);
  const [sabit, setSabit] = useState(true);
  const [tarif, setTarif] = useState("");
  const [yaziyor, setYaziyor] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const metinRef = useRef<HTMLTextAreaElement>(null);
  const [surukle, setSurukle] = useState(false);
  useEffect(() => {
    const kaynak = calisanBul(duzenId ?? kopyaId ?? undefined);
    if (kaynak) { const { id: _id, ...geri } = kaynak; void _id; setC({ ...geri, ad: kopyaId ? `${kaynak.ad} (kopya)` : kaynak.ad, baslaticilar: geri.baslaticilar.length ? [...geri.baslaticilar] : ["", ""], ozel: true }); }
    if (duzenId) setSabit(useScCalisan.getState().sabitler.includes(duzenId));
    setHazir(true);
  }, [duzenId, kopyaId]);
  const yeni = !duzenId;

  const toplam = c.dosyalar.reduce((t, d) => t + d.boyut, 0);
  const kapsam = useMemo(() => ISKELET.map((k) => ({ ...k, var: k.ara.test(c.talimat) })), [c.talimat]);
  const adimlar = [c.ad.trim().length >= 2, c.aciklama.trim().length > 0, c.talimat.trim().length >= 10, c.baslaticilar.some((b) => b.trim())];
  const eksik = c.ad.trim().length < 2 ? "Ad en az 2 harf" : c.talimat.trim().length < 10 ? "Talimat en az 10 harf" : null;

  const kaydet = () => {
    if (eksik) return;
    const v = { ...c, ad: c.ad.trim(), aciklama: c.aciklama.trim(), talimat: c.talimat.trim(), baslaticilar: c.baslaticilar.map((b) => b.trim()).filter(Boolean), ozel: true };
    const st = useScCalisan.getState();
    if (duzenId && st.ozel.some((x) => x.id === duzenId)) {
      st.guncelle(duzenId, v);
      if (sabit !== st.sabitler.includes(duzenId)) st.sabitle(duzenId);
      toast.success("Çalışan güncellendi"); router.push("/panel/supercomputer/calisanlar");
    } else {
      const id = st.ekle(v);
      if (!sabit) st.sabitle(id);
      toast.success(`${v.ad} oluşturuldu`, { description: sabit ? "Ana ekrana sabitlendi." : "Çalışanlar sayfasında." });
      router.push(`/panel/supercomputer?calisan=${id}`);
    }
  };

  const dosyaEkle = async (l: File[]) => {
    const eklenen = [] as ScCalisan["dosyalar"]; let kalan = SINIR - toplam;
    for (const f of l) {
      if (!/\.(txt|md|csv|json|html?|css|js|ts|tsx|py|xml|ya?ml)$/i.test(f.name) && !f.type.startsWith("text/")) { toast.error(`${f.name} eklenemedi`, { description: "Şimdilik yalnızca metin dosyaları (txt, md, csv, json, kod) eklenebiliyor." }); continue; }
      if (f.size > kalan) { toast.error("Bilgi alanı doldu", { description: "Çalışan başına en çok 512 KB eklenebilir." }); break; }
      eklenen.push({ id: Math.random().toString(36).slice(2, 9), ad: f.name, boyut: f.size, icerik: await f.text() }); kalan -= f.size;
    }
    if (eklenen.length) { setC((x) => ({ ...x, dosyalar: [...x.dosyalar, ...eklenen] })); toast.success(eklenen.length > 1 ? `${eklenen.length} dosya eklendi` : "Dosya eklendi"); }
  };

  const iskeletEkle = (m: string) => {
    setC((x) => ({ ...x, talimat: (x.talimat.trim() ? `${x.talimat.trimEnd()}\n\n${m}` : m).slice(0, 8000) }));
    setTimeout(() => { const el = metinRef.current; if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; el.scrollTop = el.scrollHeight; } }, 30);
  };

  /** Tariften taslak: model JSON döndürür; bağlantı yoksa dürüstçe söylenir. */
  const taslakYaz = async () => {
    const t = tarif.trim(); if (t.length < 8 || yaziyor) return;
    setYaziyor(true);
    const k = new AbortController(); let metin = ""; let bagliDegil = false;
    const istem = `Bir yapay zekâ çalışanı tasarla. Tarif: "${t}".\nYalnız şu JSON'u döndür, başka hiçbir şey yazma:\n{"ad":"en çok 3 kelime","aciklama":"tek cümle, en çok 70 karakter","kategori":"${CALISAN_KATEGORILERI.join("|")}","ikon":"${CALISAN_IKONLARI.join("|")}","talimat":"Rol, Görev, Ton, Kurallar ve Yanıt biçimi başlıklı (## ile), Türkçe, 120-220 kelime","baslaticilar":["4 kısa başlangıç sorusu"],"web":true|false,"dusun":true|false}`;
    try {
      await sohbetAkisi({ mesajlar: [{ rol: "kullanici", metin: istem }], model: "claude-sonnet-5-5", dusun: false, web: false, stil: "normal" },
        (o) => { if (o.t === "metin") metin += o.metin; }, () => { bagliDegil = true; k.abort(); }, k.signal);
    } catch { /* aşağıda ele alınır */ }
    setYaziyor(false);
    if (bagliDegil) { toast.error("Taslak yazılamadı", { description: "Tariften taslak için model bağlantısı gerekiyor. Hazır bir çalışandan başlayabilir ya da alanları kendin doldurabilirsin." }); return; }
    try {
      const j = JSON.parse(metin.slice(metin.indexOf("{"), metin.lastIndexOf("}") + 1)) as { ad?: string; aciklama?: string; kategori?: string; ikon?: string; talimat?: string; baslaticilar?: string[]; web?: boolean; dusun?: boolean };
      setC((x) => ({
        ...x,
        ad: (j.ad ?? x.ad).slice(0, 40), aciklama: (j.aciklama ?? x.aciklama).slice(0, 80), talimat: (j.talimat ?? x.talimat).slice(0, 8000),
        kategori: (CALISAN_KATEGORILERI as readonly string[]).includes(j.kategori ?? "") ? (j.kategori as ScCalisan["kategori"]) : x.kategori,
        ikon: (CALISAN_IKONLARI as string[]).includes(j.ikon ?? "") ? (j.ikon as CalisanIkon) : x.ikon,
        baslaticilar: (j.baslaticilar ?? []).map((b) => String(b).slice(0, 80)).slice(0, 6).concat(j.baslaticilar?.length ? [] : x.baslaticilar),
        araclar: { ...x.araclar, web: !!j.web, dusun: !!j.dusun },
      }));
      toast.success("Taslak hazır", { description: "Alanları gözden geçir, sağda dene." });
    } catch { toast.error("Taslak okunamadı", { description: "Tarifi biraz daha açık yazıp yeniden dene." }); }
  };

  const sablondan = (h: ScCalisan) => {
    const { id: _id, ...geri } = h; void _id;
    setC({ ...geri, ad: `${h.ad} (kopya)`, baslaticilar: [...h.baslaticilar], ozel: true });
    toast.success(`${h.ad} taslağa alındı`, { description: "İstediğin gibi değiştir." });
  };

  if (!hazir) return null;
  const ARACLAR: [keyof ScCalisan["araclar"], typeof Globe, string, string][] = [
    ["web", Globe, "Web araması", "Güncel bilgi bulur, kaynak gösterir"],
    ["dusun", Brain, "Uzun düşün", "Zor işlerde adım adım akıl yürütür"],
    ["arastir", Telescope, "Derin araştırma", "Çok kaynaklı, uzun rapor hazırlar"],
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-screen flex-col bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        {/* Üst çubuk */}
        <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 max-md:pl-14">
          <Link href="/panel/supercomputer/calisanlar" aria-label="Çalışanlara dön" className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--sc-metin-2)] transition hover:bg-white/[0.085] hover:text-[var(--sc-metin)]"><ArrowLeft className="h-[18px] w-[18px]" /></Link>
          <motion.span key={`${c.ikon}${c.renk}`} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={YAY} className="max-sm:hidden"><CalisanAvatar c={c} boyut={32} /></motion.span>
          <span className="flex-1 sm:hidden" />
          <div className="min-w-0 flex-1 max-sm:hidden">
            <p className="truncate text-[15px] font-semibold">{c.ad.trim() || (yeni ? "Yeni çalışan" : "Çalışanı düzenle")}</p>
            <p className="flex items-center gap-1.5 text-[12px] text-[var(--sc-metin-3)]">
              <span className="flex gap-0.5">{adimlar.map((a, i) => <span key={i} className={cn("h-1.5 w-4 rounded-full transition-colors", a ? "bg-white" : "bg-white/[0.15]")} />)}</span>
              {adimlar.filter(Boolean).length} / {adimlar.length} hazır
            </p>
          </div>
          <div role="tablist" className="relative flex rounded-full bg-black/25 p-0.5 ring-1 ring-inset ring-white/[0.08] lg:hidden">
            {(["ayar", "deneme"] as const).map((s) => (
              <button key={s} role="tab" aria-selected={sekme === s} onClick={() => setSekme(s)} className={cn("relative h-8 rounded-full px-3.5 text-[13px] font-semibold", sekme === s ? "text-[#0b0b0c]" : "text-[var(--sc-metin-2)]")}>
                {sekme === s && <motion.span layoutId="cal-mobil-sekme" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
                <span className="relative">{s === "ayar" ? "Ayarlar" : "Dene"}</span>
              </button>
            ))}
          </div>
          {eksik && <span className="rounded-full bg-white/[0.065] px-2.5 py-1 text-[12px] text-[var(--sc-metin-3)] max-md:hidden">{eksik}</span>}
          <motion.button whileTap={{ scale: 0.96 }} disabled={!!eksik} onClick={kaydet} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0b0b0c] transition hover:bg-white/90 disabled:opacity-40">
            <Check className="h-4 w-4" />{yeni ? "Oluştur" : "Kaydet"}
          </motion.button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] max-lg:grid-cols-1">
          {/* ── Ayarlar ── */}
          <div className={cn("min-h-0 overflow-y-auto px-6 py-6 [scrollbar-width:thin] max-sm:px-3", sekme !== "ayar" && "max-lg:hidden")}>
            <div className="mx-auto max-w-[660px] space-y-4">
              {yeni && (
                <Kart baslik="Hızlı başlangıç" alt="Ne yapmasını istediğini tek cümleyle yaz; taslağı Usta hazırlasın.">
                  <div className="flex items-end gap-2 rounded-[16px] bg-black/25 p-2 pl-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25">
                    <textarea value={tarif} onChange={(e) => setTarif(e.target.value.slice(0, 400))} rows={2} aria-label="Çalışan tarifi"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void taslakYaz(); } }}
                      placeholder="Ör. Kahve dükkânım için Instagram gönderileri ve menü açıklamaları yazan samimi bir asistan"
                      className="min-h-[44px] flex-1 resize-none bg-transparent py-1 text-[14px] leading-snug outline-none [field-sizing:content] placeholder:text-[var(--sc-metin-3)]" />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => void taslakYaz()} disabled={tarif.trim().length < 8 || yaziyor}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-[#0b0b0c] disabled:opacity-40">
                      {yaziyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}{yaziyor ? "Yazıyor" : "Taslağı yaz"}
                    </motion.button>
                  </div>
                  <div>
                    <p className={ETIKET}>Ya da hazır bir çalışandan başla</p>
                    <div className="gizli-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                      {HAZIR_CALISANLAR.map((h) => (
                        <button key={h.id} onClick={() => sablondan(h)} title={h.aciklama}
                          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-black/20 pl-1.5 pr-3.5 text-[13px] font-medium text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.085] hover:text-[var(--sc-metin)] active:scale-[0.97]">
                          <CalisanAvatar c={h} boyut={30} />{h.ad}
                        </button>
                      ))}
                    </div>
                  </div>
                </Kart>
              )}

              <Kart baslik="Kimlik" alt="Vitrinde, ana ekranda ve sohbet başlığında böyle görünür.">
                <div className="grid grid-cols-[1fr_120px] gap-3 max-sm:grid-cols-1 [&>div:last-child]:max-sm:hidden">
                  <label className="block"><span className={ETIKET}>Ad</span><input value={c.ad} onChange={(e) => setC({ ...c, ad: e.target.value.slice(0, 40) })} placeholder="Ör. Menü Yazarı" className={cn("h-10", GIRDI)} /></label>
                  <div><span className={ETIKET}>Önizleme</span><div className="flex h-10 items-center gap-2 rounded-[12px] bg-black/25 px-2 ring-1 ring-inset ring-white/[0.08]"><CalisanAvatar c={c} boyut={26} /><span className="truncate text-[12.5px] text-[var(--sc-metin-2)]">{c.kategori}</span></div></div>
                </div>
                <label className="block"><span className={ETIKET}>Kısa açıklama</span><input value={c.aciklama} onChange={(e) => setC({ ...c, aciklama: e.target.value.slice(0, 80) })} placeholder="Ne işe yaradığını tek cümleyle yaz" className={cn("h-10", GIRDI)} /></label>
                <div>
                  <span className={ETIKET}>Kategori</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CALISAN_KATEGORILERI.map((k) => (
                      <button key={k} type="button" onClick={() => setC({ ...c, kategori: k })} aria-pressed={c.kategori === k}
                        className={cn("relative h-8 rounded-full px-3.5 text-[13px] font-medium transition active:scale-95", c.kategori === k ? "text-[#0b0b0c]" : "bg-white/[0.055] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.07] hover:text-[var(--sc-metin)]")}>
                        {c.kategori === k && <motion.span layoutId="cal-kategori" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
                        <span className="relative">{k}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className={ETIKET}>Simge</span>
                  <div className="grid grid-cols-9 gap-1.5 max-sm:grid-cols-6">
                    {CALISAN_IKONLARI.map((k) => { const I = CALISAN_IKON[k]; const a = c.ikon === k; return (
                      <button key={k} type="button" onClick={() => setC((x) => ({ ...x, ikon: k }))} aria-label={`Simge: ${k}`} aria-pressed={a}
                        className={cn("relative flex aspect-square items-center justify-center rounded-[12px] transition active:scale-90", a ? "text-white" : "bg-black/20 text-[var(--sc-metin-3)] hover:bg-white/[0.065] hover:text-[var(--sc-metin)]")}
                        style={a ? { background: `linear-gradient(145deg, ${c.renk}, color-mix(in srgb, ${c.renk} 45%, #0b0b0c))` } : undefined}>
                        <I className="h-[18px] w-[18px]" />
                        <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset", a ? "ring-2 ring-white" : "ring-1 ring-white/[0.06]")} />
                      </button>
                    ); })}
                  </div>
                </div>
                <div>
                  <span className={ETIKET}>Renk</span>
                  <div className="flex flex-wrap gap-2.5">
                    {CALISAN_RENKLERI.map((r) => <button key={r} type="button" onClick={() => setC((x) => ({ ...x, renk: r }))} aria-label={`Renk ${r}`} aria-pressed={c.renk === r}
                      className={cn("h-8 w-8 rounded-full ring-offset-[3px] ring-offset-[var(--sc-kart)] transition active:scale-90", c.renk === r ? "ring-2 ring-white" : "hover:scale-110")} style={{ background: r }} />)}
                  </div>
                </div>
              </Kart>

              <Kart baslik="Talimat" alt="Çalışan kim, nasıl davranmalı, neyi yapmamalı? Her mesajda modele gider."
                sag={<span className="rounded-full bg-white/[0.085] px-2 text-[11.5px] tabular-nums leading-5 text-[var(--sc-metin-2)]">{c.talimat.length.toLocaleString("tr")} / 8.000</span>}>
                <div className="flex flex-wrap gap-1.5">
                  {kapsam.map((k) => (
                    <button key={k.ad} type="button" onClick={() => iskeletEkle(k.metin)} title={k.var ? `${k.ad} talimatta var; yine de eklemek için tıkla` : `${k.ad} bölümünü ekle`}
                      className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition active:scale-95", k.var ? "bg-white/[0.1] text-[var(--sc-metin)] ring-white/[0.14]" : "bg-black/20 text-[var(--sc-metin-2)] ring-white/[0.07] hover:bg-white/[0.065] hover:text-[var(--sc-metin)]")}>
                      {k.var ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <Plus className="h-3.5 w-3.5" />}{k.ad}
                    </button>
                  ))}
                </div>
                <textarea ref={metinRef} value={c.talimat} onChange={(e) => setC({ ...c, talimat: e.target.value.slice(0, 8000) })} rows={10} aria-label="Talimat"
                  placeholder={"Ör. Sen bir kahve dükkânının menü yazarısın.\nHer ürün için 2 cümlelik iştah açıcı açıklama yaz; fiyat ve içerik uydurma.\nTon samimi ama özenli; emoji kullanma."}
                  className={cn("min-h-[220px] resize-y py-3 leading-relaxed", GIRDI)} />
                <div className="flex items-center gap-2.5 rounded-[14px] bg-black/20 px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
                  <span className="text-[12.5px] font-medium text-[var(--sc-metin-2)]">Kapsam</span>
                  <span className="flex h-1.5 flex-1 gap-1">{kapsam.map((k) => <span key={k.ad} className={cn("flex-1 rounded-full transition-colors duration-300", k.var ? "bg-white" : "bg-white/[0.1]")} />)}</span>
                  <span className="text-[12px] tabular-nums text-[var(--sc-metin-3)]">{kapsam.filter((k) => k.var).length} / {kapsam.length} bölüm</span>
                </div>
              </Kart>

              <Kart baslik="Yetenekler" alt="Hangi modelle çalışsın, hangi araçları kullanabilsin.">
                <div><span className={ETIKET}>Model</span><ScModelSecici tam deger={c.model ?? SC_VARSAYILAN_MODEL} onSec={(v) => setC({ ...c, model: v })} /></div>
                <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-black/20 ring-1 ring-inset ring-white/[0.06]">
                  {ARACLAR.map(([k, I, ad, alt]) => (
                    <button key={k} type="button" role="switch" aria-checked={!!c.araclar[k]} onClick={() => setC((x) => ({ ...x, araclar: { ...x.araclar, [k]: !x.araclar[k] } }))}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.035]">
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", c.araclar[k] ? "bg-white text-[#0b0b0c]" : "bg-white/[0.065] text-[var(--sc-metin-2)]")}><I className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold">{ad}</span><span className="block text-[12.5px] text-[var(--sc-metin-3)]">{alt}</span></span>
                      <Anahtar acik={!!c.araclar[k]} />
                    </button>
                  ))}
                </div>
              </Kart>

              <Kart baslik="Başlangıç soruları" alt="Sohbet açılınca tek dokunuşla sorulabilir."
                sag={<span className="rounded-full bg-white/[0.085] px-2 text-[11.5px] tabular-nums leading-5 text-[var(--sc-metin-2)]">{c.baslaticilar.filter((b) => b.trim()).length} / 6</span>}>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {c.baslaticilar.map((b, i) => (
                      <motion.div key={i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.065] text-[12px] font-semibold tabular-nums text-[var(--sc-metin-2)]">{i + 1}</span>
                        <input value={b} onChange={(e) => setC((x) => ({ ...x, baslaticilar: x.baslaticilar.map((y, j) => (j === i ? e.target.value.slice(0, 80) : y)) }))} placeholder={i === 0 ? "Ör. Bu haftanın menüsü için açıklama yaz" : "Başka bir soru"} aria-label={`Başlangıç sorusu ${i + 1}`} className={cn("h-10 flex-1", GIRDI)} />
                        <button type="button" onClick={() => setC((x) => ({ ...x, baslaticilar: x.baslaticilar.filter((_, j) => j !== i) }))} aria-label={`Soru ${i + 1} sil`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--sc-metin-3)] transition hover:bg-white/[0.065] hover:text-rose-300"><X className="h-4 w-4" /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {c.baslaticilar.length < 6 && (
                  <button type="button" onClick={() => setC((x) => ({ ...x, baslaticilar: [...x.baslaticilar, ""] }))} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.065] px-3.5 text-[13px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.1] active:scale-95"><Plus className="h-4 w-4" />Soru ekle</button>
                )}
              </Kart>

              <Kart baslik="Bilgi" alt="Çalışanın her sohbette bileceği metin dosyaları."
                sag={<span className="rounded-full bg-white/[0.085] px-2 text-[11.5px] tabular-nums leading-5 text-[var(--sc-metin-2)]">{Math.round(toplam / 1024)} / 512 KB</span>}>
                <button type="button" onClick={() => dosyaRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setSurukle(true); }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); void dosyaEkle([...e.dataTransfer.files]); }}
                  className={cn("relative flex w-full items-center gap-3.5 rounded-[16px] px-4 py-4 text-left transition", surukle ? "bg-white/[0.085]" : "bg-black/20 hover:bg-white/[0.045]")}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Upload className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">Dosya ekle ya da buraya bırak</span><span className="block text-[12.5px] text-[var(--sc-metin-3)]">txt, md, csv, json ve kod dosyaları</span></span>
                  <span className={cn("pointer-events-none absolute inset-0 rounded-[16px] ring-inset", surukle ? "ring-2 ring-white" : "ring-1 ring-white/[0.07]")} />
                </button>
                <input ref={dosyaRef} type="file" multiple hidden accept=".txt,.md,.csv,.json,.html,.css,.js,.ts,.tsx,.py,.xml,.yaml,.yml,text/*" onChange={(e) => { void dosyaEkle([...(e.target.files ?? [])]); e.target.value = ""; }} />
                {toplam > 0 && <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.085]"><motion.div animate={{ width: `${Math.min(100, (toplam / SINIR) * 100)}%` }} className="h-full rounded-full bg-white" /></div>}
                {c.dosyalar.length > 0 && (
                  <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[14px] bg-black/20 ring-1 ring-inset ring-white/[0.06]">
                    {c.dosyalar.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 px-3.5 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.065]"><FileText className="h-4 w-4 text-[var(--sc-metin-2)]" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{d.ad}</span><span className="block text-[12px] tabular-nums text-[var(--sc-metin-3)]">{d.boyut < 1024 ? `${d.boyut} B` : `${(d.boyut / 1024).toFixed(1)} KB`}</span></span>
                        <button type="button" onClick={() => setC((x) => ({ ...x, dosyalar: x.dosyalar.filter((y) => y.id !== d.id) }))} aria-label={`${d.ad} kaldır`} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--sc-metin-3)] transition hover:bg-white/[0.065] hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </Kart>

              <Kart baslik="Görünürlük">
                <button type="button" role="switch" aria-checked={sabit} onClick={() => setSabit((v) => !v)} className="-m-1 flex w-[calc(100%+8px)] items-center gap-3 rounded-[14px] p-1 text-left">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", sabit ? "bg-white text-[#0b0b0c]" : "bg-white/[0.065] text-[var(--sc-metin-2)]")}><Pin className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold">Ana ekrana sabitle</span><span className="block text-[12.5px] text-[var(--sc-metin-3)]">Ana ekrandaki "Çalışanla başla" şeridinde görünür.</span></span>
                  <Anahtar acik={sabit} />
                </button>
              </Kart>
              <div className="h-4" />
            </div>
          </div>

          {/* ── Deneme ── */}
          <div className={cn("min-h-0 border-l border-white/[0.06] p-4 max-lg:border-l-0 max-lg:p-2", sekme !== "deneme" && "max-lg:hidden")}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] bg-[#101012] ring-1 ring-inset ring-white/[0.08]">
              <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
                <div role="tablist" className="flex rounded-full bg-black/25 p-0.5 ring-1 ring-inset ring-white/[0.07]">
                  {(["sohbet", "vitrin"] as const).map((s) => (
                    <button key={s} role="tab" aria-selected={sag === s} onClick={() => setSag(s)} className={cn("relative h-8 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors", sag === s ? "text-[#0b0b0c]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                      {sag === s && <motion.span layoutId="cal-sag-sekme" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
                      <span className="relative">{s === "sohbet" ? "Sohbette dene" : "Vitrin kartı"}</span>
                    </button>
                  ))}
                </div>
                <span className="ml-auto flex items-center gap-1.5 text-[12px] text-[var(--sc-metin-3)] max-sm:hidden"><Sparkles className="h-3.5 w-3.5" />Kaydetmeden dene</span>
              </div>
              <div className="min-h-0 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={sag} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="h-full">
                    {sag === "sohbet" ? <Deneme c={c} /> : <VitrinOnizleme c={c} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
