"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, BarChart3, Brain, CalendarClock, Check, Copy, FileText, GitBranch, GraduationCap, Headphones, Info, Layers3, PanelRight, Pencil, Presentation, Quote, RotateCcw, Search, SlidersHorizontal, Square, ThumbsDown, ThumbsUp, Volume2, Wand2 } from "lucide-react";
import type { DosyaBilgisi } from "@/lib/build/belgeTipler";
import { SaglayiciLogo, mesajKredisi } from "@/components/build/ModelSecici";
import { AnahtarYok } from "@/components/build/calisma/Sohbet";
import { AjanSimge } from "@/components/build/ajanlar/ortak";
import { KrediJeton } from "@/components/ui/KrediHap";
import { BUILD_MODELLERI, SAGLAYICILAR, modelBul } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { ArastirmaIlerleme, PlanKarti, RaporKarti } from "./Arastirma";
import { EkKarosu } from "./Besteci";
import { KaynakListesi, bilgiDizini, bilgiIsaretle, kaynakDizini, metinGruplari } from "./Kaynaklar";
import { KurulGorunumu } from "./Kurul";
import { Md } from "./Metin";
import { AracKarti, Dusunce } from "./Parcalar";
import { VeriKarti } from "./Veri";
import type { GorselIslem } from "./GorselDuzenle";
import { Acilir, Eylem, MenuSatir, SurumGecis, sayi, sn, useAcilir } from "./ortak";
import type { AracParca, Ek, Mesaj, Onayla, PlanParca } from "./tipler";

export type MesajEylemleri = {
  onizle: (h: string) => void;
  surumSec: (m: Mesaj, kardes: Mesaj) => void;
  yenidenDene: (m: Mesaj, model?: string) => void;
  duzenle: (m: Mesaj, metin: string) => void;
  onayla: Onayla;
  arastirmaBaslat: (m: Mesaj, plan: { baslik: string; adimlar: string[] }) => void;
  geri: (m: Mesaj, deger: "iyi" | "kotu" | null) => void;
  sesliOku: (m: Mesaj) => void;
  durdur: () => void;
  modelAc: () => void;
  /** Model bu sunucuda bağlı mı (bilinmiyorsa true). */
  bagli: (modelId: string) => boolean;
  /** Dosya kartı ve görselleştirme açıcıları (sağ panel), görselleştirme hatasını düzelttirme. */
  dosyaAc: (d: DosyaBilgisi) => void;
  htmlAc: (belge: string) => void;
  duzelt: (istek: string) => void;
  /** MCP Apps görünümünden gelen metni yeni kullanıcı mesajı olarak gönderir; sohbet meşgulse false. */
  gonder: (metin: string) => boolean;
  /** v4: yanıtı değiştir (yeni sürüm), bu mesajdan yeni sohbet, dönüştür, tuval aç, görsel işlemleri. */
  degistir: (m: Mesaj, etiket: string, talimat: string) => void;
  dallan: (m: Mesaj) => void;
  donustur: (m: Mesaj, istek: string, tuval?: boolean) => void;
  tuvalAc: (id: string) => void;
  gorselIslem?: GorselIslem;
};

/** Ekteki Office dosyasından panel bilgisi (sürüm ve özet önizleme yanıtından gelir). */
export const ekDosyasi = (x: Ek): DosyaBilgisi => ({ id: x.belge ?? "", url: x.url, ad: x.ad, bicim: x.bicim ?? "docx", boyut: x.boyut ?? 0, surum: 1, ozet: "" });

const metinOf = (m: Mesaj) => (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").trim();

function Kopyala({ metin }: { metin: string }) {
  const [ok, setOk] = useState(false);
  return <Eylem title={ok ? "Kopyalandı" : "Kopyala"} onClick={() => { navigator.clipboard?.writeText(metin); setOk(true); setTimeout(() => setOk(false), 1300); }}>{ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</Eylem>;
}

/** Kullanıcı mesajı: ekler, balon; üzerine gelince kopyala ve düzenle (yeni dal açar), dal geçişi. */
export const KullaniciMesaji = memo(function KullaniciMesaji({ m, kardesler, e, kilitli }: { m: Mesaj; kardesler: Mesaj[]; e: MesajEylemleri; kilitli: boolean }) {
  const [duzen, setDuzen] = useState<string | null>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (duzen !== null && alan.current) { alan.current.focus(); alan.current.style.height = "0px"; alan.current.style.height = `${Math.min(alan.current.scrollHeight, 320)}px`; } }, [duzen]);
  const sira = kardesler.findIndex((x) => x.id === m.id);
  const istek = m.istek;
  if (istek?.gorev) return (
    <div className="flex justify-center">
      <span title={m.metin} className="flex max-w-full items-center gap-2 rounded-full bg-[#55d6fd]/[0.08] px-3.5 py-1.5 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">
        <CalendarClock className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Zamanlanmış görev çalıştı: {istek.gorev.ad}</span><span className="shrink-0 text-white/40">· {new Date(m.zaman).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
      </span>
    </div>
  );
  if (duzen !== null) return (
    <div className="ml-auto w-full max-w-[85%] rounded-[20px] bg-white/[0.08] p-2.5 ring-1 ring-inset ring-white/15">
      <textarea ref={alan} value={duzen} onChange={(x) => { setDuzen(x.target.value); x.target.style.height = "0px"; x.target.style.height = `${Math.min(x.target.scrollHeight, 320)}px`; }}
        onKeyDown={(x) => { if (x.key === "Escape") setDuzen(null); if (x.key === "Enter" && !x.shiftKey && !x.nativeEvent.isComposing) { x.preventDefault(); if (duzen.trim()) { e.duzenle(m, duzen.trim()); setDuzen(null); } } }}
        className="block w-full resize-none bg-transparent px-1.5 py-1 text-[15px] leading-relaxed text-white outline-none" />
      <div className="mt-1.5 flex items-center justify-end gap-2">
        <span className="mr-auto px-1.5 text-[12px] text-white/45">Gönderince yeni bir dal açılır; eski yanıt kaybolmaz</span>
        <button type="button" onClick={() => setDuzen(null)} className="h-8 rounded-full px-3.5 text-[13px] text-white/70 hover:bg-white/[0.07] hover:text-white">İptal</button>
        <button type="button" disabled={!duzen.trim() || kilitli} onClick={() => { e.duzenle(m, duzen.trim()); setDuzen(null); }} className="h-8 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">Gönder</button>
      </div>
    </div>
  );
  return (
    <div className="group/k ml-auto flex max-w-[85%] flex-col items-end gap-1.5">
      {m.ekler?.length ? (
        <div className="flex flex-wrap justify-end gap-1.5">
          {m.ekler.map((x: Ek, i) => x.tur === "gorsel"
            ? <span key={i} className="group/g relative block">
                <a href={x.url} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={x.url} alt={x.ad} className="h-24 w-24 rounded-[14px] object-cover ring-1 ring-inset ring-white/10" /></a>
                {e.gorselIslem && <button type="button" onClick={() => e.gorselIslem!(x.url, "duzenle")} title="Bu görseli düzenle" aria-label="Bu görseli düzenle" className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#111214]/85 text-white opacity-0 transition-opacity group-hover/g:opacity-100 max-sm:opacity-100"><Wand2 className="h-3.5 w-3.5" /></button>}
              </span>
            : (x.tur === "metin" && /\.(csv|tsv)$/i.test(x.ad)) || (x.tur === "ofis" && x.bicim === "xlsx") ? <VeriKarti key={i} url={x.url} ad={x.ad} sor={kilitli ? undefined : (q) => { e.gonder(q); }} />
            : x.tur === "ofis" && x.belge ? <button key={i} type="button" onClick={() => e.dosyaAc(ekDosyasi(x))} className="rounded-[12px] text-left transition-transform active:scale-[0.98]"><EkKarosu e={x} /></button>
            : <a key={i} href={x.url} target="_blank" rel="noopener noreferrer"><EkKarosu e={x} /></a>)}
        </div>
      ) : null}
      {(istek?.arastirma || istek?.kurul || istek?.arac || istek?.yetenekler?.length || istek?.baglantilar?.length || istek?.tuval || istek?.duzenle || istek?.sohbetler?.length) && (
        <div className="flex flex-wrap justify-end gap-1 text-[11.5px] text-[#8be6ff]">
          {istek.arastirma && <span className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5">Araştırma</span>}
          {istek.kurul && <span className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5">Model kurulu · {istek.kurul.modeller.length} model</span>}
          {istek.arac && <span className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5">{({ gorsel_uret: "Görsel üret", video_uret: "Video üret", muzik_uret: "Müzik üret", ses_uret: "Seslendir", model_3d_uret: "3D model üret" } as Record<string, string>)[istek.arac]}</span>}
          {istek.tuval && <span className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5">Tuval</span>}
          {istek.duzenle && <span className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5">Görsel düzenleme</span>}
          {istek.sohbetler?.map((x) => <span key={x.id} className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5">Sohbet: {x.baslik}</span>)}
          {[...(istek.yetenekler ?? []), ...(istek.baglantilar ?? [])].map((x) => <span key={x} className="rounded-full bg-[#55d6fd]/[0.1] px-2 py-0.5">@{x}</span>)}
        </div>
      )}
      {istek?.alinti && (
        <div className="flex max-w-full items-start gap-2 rounded-[14px] bg-white/[0.035] px-3 py-2 text-[13px] leading-relaxed text-white/60 ring-1 ring-inset ring-white/[0.06]">
          <Quote className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /><p className="line-clamp-3 min-w-0 whitespace-pre-wrap break-words">{istek.alinti}</p>
        </div>
      )}
      {m.metin && <div className="whitespace-pre-wrap break-words rounded-[20px] rounded-tr-[6px] bg-white/[0.08] px-4 py-2.5 text-[15px] leading-relaxed text-white">{m.metin}</div>}
      <div className={cn("flex items-center gap-0.5 transition-opacity", kardesler.length > 1 ? "opacity-100" : "opacity-0 group-hover/k:opacity-100 max-sm:opacity-100")}>
        <SurumGecis sira={sira} toplam={kardesler.length} sec={(i) => e.surumSec(m, kardesler[i])} />
        {m.metin && <Kopyala metin={m.metin} />}
        {!kilitli && !m.id.startsWith("gecici-") && <Eylem title="Düzenle" onClick={() => setDuzen(m.metin ?? "")}><Pencil className="h-3.5 w-3.5" /></Eylem>}
      </div>
    </div>
  );
});

/** "Yeniden dene" menüsü: aynı modelle ya da listedeki başka bir modelle (gerçek logolar). */
function YenidenDene({ m, e }: { m: Mesaj; e: MesajEylemleri }) {
  const a = useAcilir(320, "yukari");
  const [ara, setAra] = useState("");
  const model = modelBul(m.model);
  const l = BUILD_MODELLERI.filter((x) => x.id !== model.id && (!ara.trim() || `${x.ad} ${SAGLAYICILAR[x.saglayici].ad}`.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr"))));
  return (
    <div ref={a.kok}>
      <Eylem title="Yeniden dene" onClick={() => a.setAcik(!a.acik)} aktif={a.acik}><RotateCcw className="h-3.5 w-3.5" /></Eylem>
      <Acilir a={a}>
        <MenuSatir ikon={<SaglayiciLogo m={model} boyut={16} />} ad="Aynı modelle yeniden dene" alt={model.ad} onClick={() => { a.setAcik(false); e.yenidenDene(m); }} />
        <div className="my-1 h-px bg-white/[0.07]" />
        <label className="mx-1 mb-1 flex h-9 items-center gap-2 rounded-[12px] bg-white/[0.05] px-3 text-white/45">
          <Search className="h-3.5 w-3.5" /><input value={ara} onChange={(x) => setAra(x.target.value)} placeholder="Başka modelle dene" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" />
        </label>
        {l.map((x) => (
          <button key={x.id} type="button" onClick={() => { a.setAcik(false); e.yenidenDene(m, x.id); }} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-1.5 text-left hover:bg-white/[0.06]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06]"><SaglayiciLogo m={x} boyut={15} /></span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-white">{x.ad}</span>
            <span className="flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-white/45"><KrediJeton boyut={9} />{mesajKredisi(x)}</span>
          </button>
        ))}
      </Acilir>
    </div>
  );
}

const DEGISIKLIKLER: { etiket: string; talimat: string }[] = [
  { etiket: "Daha kısa", talimat: "Daha kısa ve öz yaz; yalnız en önemli noktalar kalsın." },
  { etiket: "Daha uzun", talimat: "Daha ayrıntılı yaz; açıklama ve örnek ekle." },
  { etiket: "Daha sade", talimat: "Daha sade ve anlaşılır yaz; teknik terimleri açıkla." },
  { etiket: "Daha resmî", talimat: "Daha resmî ve profesyonel bir dille yaz." },
  { etiket: "Daha samimi", talimat: "Daha samimi ve sıcak bir dille yaz." },
  { etiket: "Madde madde", talimat: "Yanıtı kısa maddeler hâlinde düzenle." },
  { etiket: "İngilizce", talimat: "Yanıtı İngilizceye çevir." },
];
/** Yanıtı değiştir (Gemini ve Copilot gibi): yön seçilir ya da yazılır, yeni sürüm olarak gelir. */
function Degistir({ m, e }: { m: Mesaj; e: MesajEylemleri }) {
  const a = useAcilir(280, "yukari");
  const [ozel, setOzel] = useState("");
  return (
    <div ref={a.kok}>
      <Eylem title="Yanıtı değiştir" onClick={() => a.setAcik(!a.acik)} aktif={a.acik}><SlidersHorizontal className="h-3.5 w-3.5" /></Eylem>
      <Acilir a={a}>
        <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-white/55">Yanıtı değiştir</p>
        <div className="flex flex-wrap gap-1 px-1.5 pb-2">
          {DEGISIKLIKLER.map((d) => <button key={d.etiket} type="button" onClick={() => { a.setAcik(false); e.degistir(m, d.etiket, d.talimat); }} className="h-8 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.12] hover:text-white">{d.etiket}</button>)}
        </div>
        <form onSubmit={(x) => { x.preventDefault(); if (!ozel.trim()) return; a.setAcik(false); e.degistir(m, "Özel", ozel.trim()); setOzel(""); }} className="mx-1 mb-1 flex h-10 items-center gap-1.5 rounded-[12px] bg-white/[0.05] pl-3 pr-1 ring-1 ring-inset ring-white/[0.08]">
          <input value={ozel} onChange={(x) => setOzel(x.target.value)} placeholder="Özel: nasıl değişsin?" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" />
          <button type="submit" disabled={!ozel.trim()} className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-30">Yaz</button>
        </form>
      </Acilir>
    </div>
  );
}

const DONUSUMLER: { ad: string; alt: string; I: typeof FileText; istek: string; tuval?: boolean }[] = [
  { ad: "Tuvalde aç", alt: "Birlikte düzenlenecek belge", I: PanelRight, istek: "Bu yanıtı tuvale belge olarak aktar; içeriği koru, başlıklarla düzenle.", tuval: true },
  { ad: "Sunum", alt: "PowerPoint dosyası", I: Presentation, istek: "Bu içerikten 6 ile 10 slaytlık bir PowerPoint sunumu hazırla (sunum_olustur)." },
  { ad: "Word belgesi", alt: "İndirilebilir rapor", I: FileText, istek: "Bu içeriği düzenli bir Word belgesine dönüştür (belge_olustur)." },
  { ad: "İnfografik", alt: "Etkileşimli görsel özet", I: BarChart3, istek: "Bu içeriğin ana noktalarını etkileşimli bir infografik olarak çiz (gorsellestir)." },
  { ad: "Test", alt: "Kendini sına", I: GraduationCap, istek: "Bu içerikten 6 soruluk karışık bir test hazırla (test_hazirla)." },
  { ad: "Bilgi kartları", alt: "Tekrar için", I: Layers3, istek: "Bu içerikteki temel kavramlardan bilgi kartları hazırla (bilgi_kartlari)." },
  { ad: "Sesli özet", alt: "İki sunuculu anlatım", I: Headphones, istek: "Bu içeriği iki sunuculu kısa bir sesli özet olarak anlat (sesli_ozet)." },
];
/** Dönüştür (Gemini Canvas Create menüsü gibi): yanıttan sunum, belge, infografik, test, kart, sesli özet. */
function Donustur({ m, e }: { m: Mesaj; e: MesajEylemleri }) {
  const a = useAcilir(290, "yukari");
  return (
    <div ref={a.kok}>
      <Eylem title="Dönüştür" onClick={() => a.setAcik(!a.acik)} aktif={a.acik}><Wand2 className="h-3.5 w-3.5" /></Eylem>
      <Acilir a={a}>
        <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-white/55">Bu yanıttan oluştur</p>
        {DONUSUMLER.map((d) => <MenuSatir key={d.ad} ikon={<d.I className="h-4 w-4" />} ad={d.ad} alt={d.alt} onClick={() => { a.setAcik(false); e.donustur(m, d.istek, d.tuval); }} />)}
      </Acilir>
    </div>
  );
}

/** Bellek kaynağı: yanıtın dayandığı kayıtlar. */
function BellekKaynagi({ l }: { l: { id: string; metin: string }[] }) {
  const a = useAcilir(320, "yukari");
  return (
    <div ref={a.kok}>
      <button type="button" onClick={() => a.setAcik(!a.acik)} title="Bu yanıt belleğindeki bilgilere dayandı" className="inline-flex h-7 items-center gap-1 rounded-full bg-[#55d6fd]/[0.1] px-2.5 text-[11.5px] text-[#8be6ff] hover:bg-[#55d6fd]/[0.18]"><Brain className="h-3 w-3" />Bellek</button>
      <Acilir a={a}>
        <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-white/60">Bu yanıtta kullanılan bellek</p>
        {l.map((k) => <p key={k.id} className="mx-1 my-1 rounded-[10px] bg-white/[0.04] px-2.5 py-2 text-[12.5px] leading-snug text-white/85">{k.metin}</p>)}
        <Link href="/panel/build/sohbet/bellek" className="mt-1 flex h-9 items-center gap-2 rounded-[10px] px-2.5 text-[12.5px] text-white/70 hover:bg-white/[0.05] hover:text-white"><Brain className="h-3.5 w-3.5" />Belleği düzenle</Link>
      </Acilir>
    </div>
  );
}

/** Asistan mesajı: düşünce, araç kartları, alıntılı metin, kaynaklar; araştırma ve kurul görünümleri; eylem satırı. */
export const AsistanMesaji = memo(function AsistanMesaji({ m, canli, kardesler, e, bekleyen, okunuyor, genel, son }: { m: Mesaj; canli: boolean; kardesler: Mesaj[]; e: MesajEylemleri; bekleyen: boolean; okunuyor: boolean; genel: boolean; son?: boolean }) {
  const p = useMemo(() => m.parcalar ?? [], [m.parcalar]);
  // Ajan yanıtında bilgi kaynağı alıntıları ([n]), diğerlerinde web alıntıları.
  const d = useMemo(() => (m.kaynaklar?.length ? bilgiDizini(m.kaynaklar) : kaynakDizini(p)), [p, m.kaynaklar]);
  const gruplar = useMemo(() => { const g = metinGruplari(p, d); return m.kaynaklar?.length ? g.map((x) => (x.tur === "metin" ? { ...x, metin: bilgiIsaretle(x.metin, d) } : x)) : g; }, [p, d, m.kaynaklar]);
  const sira = kardesler.findIndex((x) => x.id === m.id);
  if (m.durum === "anahtar-yok") return (
    <div>
      <AnahtarYok sohbet modelId={m.model ?? ""} tekrar={() => e.yenidenDene(m)} modelDegistir={e.modelAc} />
      {kardesler.length > 1 && <div className="mt-2"><SurumGecis sira={sira} toplam={kardesler.length} sec={(i) => e.surumSec(m, kardesler[i])} /></div>}
    </div>
  );
  const model = m.model ? modelBul(m.model) : null;
  const arastirma = m.mod === "arastirma";
  const metinTum = metinOf(m);
  const plan = p.find((x): x is PlanParca => x.tur === "plan");
  const sonGrup = gruplar.length - 1;
  const kullanim = m.kullanim;
  const acicilar = { dosyaAc: e.dosyaAc, htmlAc: e.htmlAc, duzelt: e.duzelt, gonder: e.gonder, tuvalAc: e.tuvalAc, gorselIslem: e.gorselIslem };
  const krediBaslik = [kullanim && `Model: ${sayi(kullanim.girdi + kullanim.onbellek)} girdi, ${sayi(kullanim.cikti)} çıktı token${kullanim.onbellek ? ` (${sayi(kullanim.onbellek)} önbellekten)` : ""}`, m.aracKredi ? `Araçlar: ${m.aracKredi} kredi` : "", m.kurul ? `Kurul: ${m.kurul.cevaplar.map((c) => `${modelBul(c.model).ad} ${c.kredi ?? 0}`).join(", ")}` : ""].filter(Boolean).join(" · ");
  return (
    <div className="group/a">
      {m.ajan && <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-white/80"><AjanSimge src={m.ajan.simge} boyut={22} />{m.ajan.ad}</p>}
      {m.degistir && <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/65"><SlidersHorizontal className="h-3 w-3" />{m.degistir === "Özel" ? "Değiştirilmiş sürüm" : `${m.degistir} sürüm`}</p>}
      <div data-alintilanabilir="">
      {m.mod === "kurul" && <KurulGorunumu m={m} canli={canli} onizle={e.onizle} />}
      {!p.length && canli && !m.kurul && <p className="flex items-center gap-2 text-[13.5px] text-white/50"><span className="build-nokta" /><span className="build-parilti">{model?.ad ?? "Vayra"} düşünüyor</span></p>}
      {plan && <PlanKarti p={plan} beklemede={m.durum === "plan-bekliyor" && !canli} baslat={(x) => e.arastirmaBaslat(m, x)} yenile={() => e.yenidenDene(m)} model={m.model} bagli={e.bagli} />}
      {arastirma && plan?.durum === "basladi" && <ArastirmaIlerleme m={m} canli={canli} durdur={e.durdur} />}
      {arastirma && !canli && m.durum === "bitti" && <RaporKarti m={m} onizle={e.onizle} />}
      {gruplar.map((g, gi) => {
        if (g.tur === "metin") return <Md key={`m${g.son}`} metin={g.metin} akiyor={canli && gi === sonGrup} onizle={e.onizle} kaynaklar={d.liste} />;
        const x = g.parca;
        if (x.tur === "plan") return null;
        if (x.tur === "dusunce") return <Dusunce key={g.i} metin={x.metin} suruyor={canli && gi === sonGrup} />;
        if (x.tur !== "arac") return null;
        if (arastirma && (x.ad === "web_search" || x.ad === "web_fetch")) return null;
        return <AracKarti key={g.i} a={x as AracParca} onayla={bekleyen && !canli ? e.onayla : undefined} hepEtiketi={genel ? "Bu sohbette hep izin ver" : undefined} acicilar={acicilar} />;
      })}
      </div>
      {!canli && <KaynakListesi d={d} />}
      {m.durum === "hata" && (
        <div className="mt-2 flex items-center gap-2.5 rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[13px] text-rose-200/90 ring-1 ring-inset ring-rose-400/15">
          <AlertTriangle className="h-4 w-4 shrink-0" /><span className="flex-1">{m.hata ?? "Bir sorun çıktı."}</span>
          <button type="button" onClick={() => e.yenidenDene(m)} className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] text-white hover:bg-white/[0.14]">Tekrar dene</button>
        </div>
      )}
      {m.durum === "durduruldu" && <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-white/45"><Info className="h-3.5 w-3.5" />Durduruldu.</p>}
      {!canli && m.durum !== "suruyor" && m.durum !== "onay-bekliyor" && m.durum !== "plan-bekliyor" && (
        <div className="mt-2.5 flex flex-wrap items-center gap-0.5 text-[12px] text-white/40">
          <SurumGecis sira={sira} toplam={kardesler.length} sec={(i) => e.surumSec(m, kardesler[i])} />
          {metinTum && <Kopyala metin={metinTum} />}
          <YenidenDene m={m} e={e} />
          {metinTum && genel && <Degistir m={m} e={e} />}
          {metinTum.length > 300 && genel && <Donustur m={m} e={e} />}
          {genel && <Eylem title="Bu mesajdan yeni sohbet" onClick={() => e.dallan(m)}><GitBranch className="h-3.5 w-3.5" /></Eylem>}
          {metinTum && <Eylem title={okunuyor ? "Okumayı durdur" : "Sesli oku"} onClick={() => e.sesliOku(m)} aktif={okunuyor}>{okunuyor ? <Square className="h-3 w-3 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}</Eylem>}
          {metinTum && <Eylem title="İyi yanıt" onClick={() => e.geri(m, m.geri === "iyi" ? null : "iyi")} aktif={m.geri === "iyi"}><ThumbsUp className={cn("h-3.5 w-3.5", m.geri === "iyi" && "fill-current")} /></Eylem>}
          {metinTum && <Eylem title="Kötü yanıt" onClick={() => e.geri(m, m.geri === "kotu" ? null : "kotu")} aktif={m.geri === "kotu"}><ThumbsDown className={cn("h-3.5 w-3.5", m.geri === "kotu" && "fill-current")} /></Eylem>}
          {m.bellek?.length ? <span className="ml-1"><BellekKaynagi l={m.bellek} /></span> : null}
          <span className="ml-auto flex min-w-0 items-center gap-1.5 pl-2 transition-opacity sm:opacity-0 sm:group-hover/a:opacity-100 max-sm:hidden">
            {model && <span className="flex min-w-0 items-center gap-1.5"><SaglayiciLogo m={model} boyut={12} /><span className="truncate">{model.ad}</span></span>}
            {sn(m.sureMs) && <span className="whitespace-nowrap">· {sn(m.sureMs)}</span>}
            {!!m.kredi && <span title={krediBaslik} className="flex cursor-help items-center gap-1 whitespace-nowrap">· <KrediJeton boyut={10} />{m.kredi} kredi</span>}
          </span>
        </div>
      )}
      {son && !canli && m.oneriler && m.oneriler.length > 0 && (
        <div className="mt-3 flex flex-col items-start gap-1.5">
          {m.oneriler.map((o) => <button key={o} type="button" onClick={() => e.gonder(o)} className="group/o inline-flex max-w-full items-center gap-2 rounded-full bg-white/[0.04] py-1.5 pl-3.5 pr-2.5 text-left text-[13px] text-white/75 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08] hover:text-white"><span className="truncate">{o}</span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/40 group-hover/o:text-[#8be6ff]" /></button>)}
        </div>
      )}
    </div>
  );
});

