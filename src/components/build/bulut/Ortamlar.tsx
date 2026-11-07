"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Code2, Database, ExternalLink, FlaskConical, GitBranch, GitCompareArrows, History, Loader2, RefreshCw, Rocket, ShieldAlert } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { YanPanel } from "./ortak";
import { Dugme, HazirSecim, OnayDugme, Rozet, SecHap, SecimHalka, Uyari, sayiYaz, tarihSaat } from "./veriOrtak";

type Sutun = { ad: string; tur: string; zorunlu?: boolean; benzersiz?: boolean; varsayilan?: unknown; secenekler?: string[]; iliski?: string };
type SutunFarki = { ad: string; durum: "eklendi" | "kaldirildi" | "degisti"; once?: Sutun; sonra?: Sutun; alanlar?: string[] };
type Denetim = { seviye: "engel" | "uyari" | "bilgi"; metin: string; adet?: number };
type Tablo = { ad: string; durum: "yeni" | "degisti" | "ayni" | "yalnizHedefte"; sutunlar: SutunFarki[]; kural: { alan: string; once: string; sonra: string }[]; aciklama: boolean; kaynakAdet: number; hedefAdet: number; ortamaOzgu: boolean; denetimler: Denetim[]; plan: string[] };
type OrtamAyari = { test: boolean; kurulum?: number; sonAktarim?: number; aktarimlar?: { zaman: number; tablolar: number; veri: boolean; yedek?: string }[] };
type Dal = { id: string; ad: string; olusturma: number; guncelleme: number; gorev: boolean; ozet: { tablo: number; kayit: number } };
type Veri = { ortamAyari: OrtamAyari; canli: { tablo: number; kayit: number }; test: { tablo: number; kayit: number } | null; dallar: Dal[]; ana: { id: string; ad: string; test: boolean } | null; onizleme: string; fark: Tablo[]; yedekler: { ad: string; zaman: number; tur: string }[] };

const TUR_AD: Record<string, string> = { metin: "metin", uzunMetin: "uzun metin", sayi: "sayı", mantiksal: "evet/hayır", tarih: "tarih", eposta: "e-posta", url: "adres", gorsel: "görsel", secim: "seçim", iliski: "ilişki", json: "JSON" };
const KURAL_AD: Record<string, string> = { herkes: "herkes", uyeler: "üyeler", sahibi: "kaydın sahibi", kapali: "yalnız sen" };
const ALAN_AD: Record<string, string> = { tur: "tür", zorunlu: "zorunlu", benzersiz: "benzersiz", varsayilan: "varsayılan", secenekler: "seçenekler", iliski: "ilişki", silinince: "silinince", aciklama: "açıklama" };
const DURUM = { yeni: { ad: "Yeni tablo", ton: "imza" as const }, degisti: { ad: "Değişti", ton: "uyari" as const }, ayni: { ad: "Aynı", ton: "notr" as const }, yalnizHedefte: { ad: "Yalnız hedefte", ton: "notr" as const } };
const sut = (s?: Sutun) => (s ? `${TUR_AD[s.tur] ?? s.tur}${s.zorunlu ? ", zorunlu" : ""}${s.benzersiz ? ", benzersiz" : ""}${s.iliski ? `, ${s.iliski}` : ""}` : "");

type Karsi = { kaynak: string; hedef: string; ad: string };

/** Bulut > Ortamlar: Canlı, Test ve deneme dalları; şema farkı, ön denetim, geçiş planı, veri kopyası ve aktarım. */
export function Ortamlar({ p }: { p: Proje }) {
  const kok = `/api/build/veritabani/${p.id}/ortam`;
  const [karsi, setKarsi] = useState<Karsi>({ kaynak: "test", hedef: "canli", ad: "Test ile Canlı" });
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [acik, setAcik] = useState<string | null>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<null | { tur: "aktar" } | { tur: "yenile" } | { tur: "dal"; dal: Dal } | { tur: "anadan" }>(null);
  const [isleniyor, setIsleniyor] = useState("");
  const izleyici = p.ekipRol === "izleyici";
  const getir = useCallback(() => api<Veri>(`${kok}?kaynak=${encodeURIComponent(karsi.kaynak)}&hedef=${encodeURIComponent(karsi.hedef)}`).then((x) => { setV(x); setHata(""); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [kok, karsi]);
  useEffect(() => { getir(); }, [getir]);
  const degisen = useMemo(() => (v?.fark ?? []).filter((t) => t.durum === "yeni" || t.durum === "degisti"), [v]);
  useEffect(() => { setSecili(new Set(degisen.filter((t) => !t.ortamaOzgu).map((t) => t.ad))); }, [degisen]);
  const islem = async (ad: string, govde: Record<string, unknown>, basari: (r: Record<string, unknown>) => string) => {
    setIsleniyor(ad); setHata(""); setMesaj("");
    try { const r = await api<Record<string, unknown>>(kok, { govde }); setMesaj(basari(r)); setPanel(null); await getir(); return r; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); return null; }
    finally { setIsleniyor(""); }
  };
  if (!v) return <div className="flex h-40 items-center justify-center">{hata ? <Uyari>{hata}</Uyari> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>;
  const testAcik = v.ortamAyari.test;
  const karsilar: Karsi[] = [
    { kaynak: "test", hedef: "canli", ad: "Test ile Canlı" },
    ...v.dallar.map((d) => ({ kaynak: `dal:${d.id}`, hedef: "test", ad: `${d.ad} ile Test` })),
    ...v.dallar.map((d) => ({ kaynak: `dal:${d.id}`, hedef: "canli", ad: `${d.ad} ile Canlı` })),
    ...(v.ana ? [{ kaynak: "canli", hedef: "ana:canli", ad: `Bu dal ile ana proje` }] : []),
  ];
  const testCanli = karsi.kaynak === "test" && karsi.hedef === "canli";
  const dalTest = karsi.kaynak.startsWith("dal:") && karsi.hedef === "test";
  const engelSayisi = degisen.filter((t) => secili.has(t.ad)).reduce((n, t) => n + t.denetimler.filter((d) => d.seviye === "engel").length, 0);
  return (
    <div className="space-y-4">
      {v.ana && (
        <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-[#55d6fd]/[0.06] px-4 py-3 ring-1 ring-inset ring-[#55d6fd]/15">
          <GitBranch className="h-4 w-4 shrink-0 text-[#8be6ff]" />
          <p className="min-w-0 flex-1 text-[13px] text-white/80">Bu proje <span className="font-medium text-white">{v.ana.ad}</span> projesinin deneme dalı ve kendi veritabanı var. Ana projeden şema ya da veri alıp burada güvenle dene.</p>
          {!izleyici && <Dugme tur="birincil" onClick={() => setPanel({ tur: "anadan" })}><Database className="h-3.5 w-3.5" />Ana projeden veri al</Dugme>}
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-3">
        <OrtamKarti ikon={Rocket} ad="Canlı" ton="imza" alt="Yayındaki site her zaman bunu kullanır" ozet={v.canli} />
        <OrtamKarti ikon={FlaskConical} ad="Test" alt={testAcik ? `Önizleme, ajan ve test ödemeleri bunu kullanır${v.ortamAyari.kurulum ? `; ${gorece(v.ortamAyari.kurulum)} açıldı` : ""}` : "Kapalı: önizleme şu an Canlı veriyi kullanır"} ozet={testAcik ? v.test : null}
          sag={<>
            {testAcik && <a href={v.onizleme} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><ExternalLink className="h-3 w-3" />Önizleme</a>}
            {!izleyici && (testAcik
              ? <Dugme kucuk yukleniyor={isleniyor === "testKapat"} onClick={() => islem("testKapat", { islem: "testKapat" }, () => "Test ortamı kapatıldı; önizleme Canlı veriye döndü. Test verisi saklanıyor.")}>Kapat</Dugme>
              : <Dugme kucuk tur="birincil" yukleniyor={isleniyor === "testAc"} onClick={() => islem("testAc", { islem: "testAc" }, () => "Test ortamı açıldı; Canlı tablolar bir kez Test'e kopyalandı.")}>Test'i aç</Dugme>)}
          </>} />
        <Kart ikon={GitBranch} baslik="Deneme dalları" alt={v.dallar.length ? `${v.dallar.length} dal; her birinin kendi veritabanı var` : "Çalışma alanından deneme dalı açınca burada görünür"} govde="p-2">
          {!v.dallar.length ? <p className="px-3 py-3 text-[12.5px] leading-relaxed text-white/50">Deneme dalı ana projenin kopyasıdır; kodu ve veritabanı ayrıdır. Dal açıldığında veritabanı boştur: buradan ana projenin şemasını ya da maskeli verisini kopyalayabilirsin.</p>
            : <div className="space-y-1">{v.dallar.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-[12px] px-2.5 py-2 hover:bg-white/[0.03]">
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{d.ad}</span><span className="block text-[11.5px] text-white/45">{d.ozet.tablo} tablo, {sayiYaz(d.ozet.kayit)} kayıt · {gorece(d.guncelleme)}</span></span>
                {!izleyici && <Dugme kucuk onClick={() => setPanel({ tur: "dal", dal: d })}>Veri</Dugme>}
                <Link href={`/panel/build/${d.id}`} aria-label="Dalın çalışma alanı" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><Code2 className="h-3.5 w-3.5" /></Link>
              </div>
            ))}</div>}
        </Kart>
      </div>

      {mesaj && <Uyari ton="bilgi">{mesaj}</Uyari>}
      {hata && <Uyari>{hata}</Uyari>}

      <Kart ikon={GitCompareArrows} baslik="Şema farkı" alt="Kaynaktaki şema ve kurallar hedefe uygulanırsa ne değişir; hedefteki kayıtlarla ön denetim ve geçiş planı"
        sag={karsilar.length > 1 ? <KarsiSec l={karsilar} deger={karsi} set={setKarsi} /> : undefined}
        altSerit={!izleyici && (testCanli || dalTest) && degisen.length > 0 ? <>
          <span className="min-w-0 flex-1 text-[12.5px] text-white/55">{secili.size} tablo seçili{engelSayisi ? `, ${engelSayisi} engel` : ""}</span>
          {testCanli && <Dugme onClick={() => setPanel({ tur: "yenile" })}><RefreshCw className="h-3.5 w-3.5" />Test'i Canlı'dan yenile</Dugme>}
          {testCanli && <Dugme tur="birincil" disabled={!secili.size} onClick={() => setPanel({ tur: "aktar" })}><Rocket className="h-3.5 w-3.5" />Canlı'ya taşı</Dugme>}
          {dalTest && <Dugme tur="birincil" disabled={!secili.size} yukleniyor={isleniyor === "daldanAl"} onClick={() => islem("daldanAl", { islem: "daldanAl", dal: karsi.kaynak.slice(4), tablolar: [...secili] }, (r) => `${(r.tablolar as string[]).length} tablonun şeması Test'e uygulandı. Önizlemede dene, sonra Canlı'ya taşı.`)}><ArrowRight className="h-3.5 w-3.5" />Şemayı Test'e uygula</Dugme>}
        </> : testCanli && !izleyici && testAcik ? <><span className="flex-1 text-[12.5px] text-white/50">Test ile Canlı'nın şeması ve kuralları aynı.</span><Dugme onClick={() => setPanel({ tur: "yenile" })}><RefreshCw className="h-3.5 w-3.5" />Test'i Canlı'dan yenile</Dugme></> : undefined}>
        {testCanli && !testAcik ? (
          <div className="px-5 py-8 text-center">
            <FlaskConical className="mx-auto h-5 w-5 text-white/30" />
            <p className="mt-2 text-[13.5px] text-white/75">Test ortamı kapalı</p>
            <p className="mx-auto mt-1 max-w-[520px] text-[12.5px] leading-relaxed text-white/45">Test'i açınca Canlı'daki tablolar bir kez kopyalanır. Şema ve kural değişikliklerini önce Test'te dener, burada farkı ve ön denetimi görür, sonra seçtiğin tabloları Canlı'ya taşırsın. Taşımadan önce Canlı yedeklenir.</p>
          </div>
        ) : !v.fark.length ? <p className="px-5 py-6 text-[13px] text-white/50">İki tarafta da tablo yok.</p> : (
          <div className="divide-y divide-white/[0.05]">
            {v.fark.map((t) => {
              const ac = acik === t.ad;
              const degisir = t.durum === "yeni" || t.durum === "degisti";
              const engel = t.denetimler.filter((d) => d.seviye === "engel").length, uyari = t.denetimler.filter((d) => d.seviye === "uyari").length;
              return (
                <div key={t.ad}>
                  <div role="button" tabIndex={0} onClick={() => setAcik(ac ? null : t.ad)} onKeyDown={(e) => { if (e.key === "Enter") setAcik(ac ? null : t.ad); }} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-white/[0.02] sm:px-5">
                    {degisir && (testCanli || dalTest) && !izleyici ? <SecimHalka secili={secili.has(t.ad)} etiket={`${t.ad} tablosunu seç`} degis={() => setSecili((s) => { const n = new Set(s); if (n.has(t.ad)) n.delete(t.ad); else n.add(t.ad); return n; })} /> : <span className="w-[18px] shrink-0" />}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><span className="truncate font-mono text-[13px] text-white">{t.ad}</span><Rozet ton={DURUM[t.durum].ton}>{DURUM[t.durum].ad}</Rozet>{t.ortamaOzgu && <Rozet>Ortama özgü</Rozet>}{engel > 0 && <Rozet ton="tehlike">{engel} engel</Rozet>}{uyari > 0 && <Rozet ton="uyari">{uyari} uyarı</Rozet>}</span>
                      <span className="mt-0.5 block text-[12px] text-white/45">{t.durum === "yalnizHedefte" ? `Yalnız hedefte, ${sayiYaz(t.hedefAdet)} kayıt; taşımada silinmez` : `${t.sutunlar.length ? `${t.sutunlar.length} sütun farkı` : "Sütunlar aynı"}${t.kural.length ? `, ${t.kural.length} kural farkı` : ""} · kaynakta ${sayiYaz(t.kaynakAdet)}, hedefte ${sayiYaz(t.hedefAdet)} kayıt`}</span>
                    </span>
                    {degisir && <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", ac && "rotate-180")} />}
                  </div>
                  <AnimatePresence initial={false}>
                    {ac && degisir && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pl-[52px]">
                          {t.sutunlar.length > 0 && (
                            <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
                              {t.sutunlar.map((s) => (
                                <div key={s.ad} className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b border-white/[0.04] px-3 py-2 text-[12.5px] last:border-0">
                                  <span className={cn("w-[74px] shrink-0 font-medium", s.durum === "eklendi" ? "text-[#8be6ff]" : s.durum === "kaldirildi" ? "text-rose-200" : "text-amber-200")}>{s.durum === "eklendi" ? "Eklenir" : s.durum === "kaldirildi" ? "Çıkar" : "Değişir"}</span>
                                  <span className="font-mono text-white">{s.ad}</span>
                                  <span className="min-w-0 flex-1 text-white/55">{s.durum === "degisti" ? <>{sut(s.once)} <ArrowRight className="mx-0.5 inline h-3 w-3" /> {sut(s.sonra)}<span className="text-white/35"> ({s.alanlar?.map((a) => ALAN_AD[a] ?? a).join(", ")})</span></> : sut(s.sonra ?? s.once)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {t.kural.length > 0 && <div className="flex flex-wrap gap-1.5">{t.kural.map((k) => <span key={k.alan} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.07]">{k.alan === "okuma" ? "Okuma" : k.alan === "ekleme" ? "Ekleme" : "Düzenleme"}: {KURAL_AD[k.once]} <ArrowRight className="mx-0.5 inline h-3 w-3" /> {KURAL_AD[k.sonra]}</span>)}</div>}
                          {t.denetimler.length > 0 && <div className="space-y-1.5">{t.denetimler.map((d, i) => <Uyari key={i} ton={d.seviye === "engel" ? "tehlike" : d.seviye === "uyari" ? "uyari" : "bilgi"}>{d.metin}</Uyari>)}</div>}
                          {t.plan.length > 0 && (
                            <div>
                              <p className="mb-1 text-[12px] font-medium text-white/60">Geçiş planı</p>
                              <ol className="space-y-1">{t.plan.map((x, i) => <li key={i} className="flex gap-2 text-[12.5px] text-white/70"><span className="w-4 shrink-0 text-right tabular-nums text-white/35">{i + 1}.</span><span className="min-w-0">{x}</span></li>)}</ol>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </Kart>

      {(v.ortamAyari.aktarimlar?.length || v.yedekler.length) ? (
        <Kart ikon={History} baslik="Aktarım geçmişi" alt="Her aktarımdan önce Canlı yedeklenir; istersen o yedeğe dön">
          <div className="divide-y divide-white/[0.05]">
            {(v.ortamAyari.aktarimlar ?? []).slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <span className="min-w-0 flex-1"><span className="block text-[13px] text-white">{a.tablolar} tablo {a.veri ? "kayıtlarıyla" : "şema ve kurallarıyla"} taşındı</span><span className="block text-[12px] text-white/45">{tarihSaat(a.zaman)}</span></span>
                {a.yedek && !izleyici && v.yedekler.some((y) => y.ad === a.yedek) && <OnayDugme kucuk onay="Canlı geri dönsün mü?" yukleniyor={isleniyor === a.yedek} calistir={() => islem(a.yedek!, { islem: "geriAl", yedek: a.yedek }, (r) => `Canlı, aktarım öncesine döndü: ${(r.tablolar as string[]).length} tablo değişti. Şu anki hâl önce yedeklendi.`)}>Öncesine dön</OnayDugme>}
              </div>
            ))}
          </div>
        </Kart>
      ) : null}

      <AktarPaneli acik={panel?.tur === "aktar"} kapat={() => setPanel(null)} tablolar={degisen.filter((t) => secili.has(t.ad))} isleniyor={isleniyor === "aktar"}
        aktar={(veri, zorla) => islem("aktar", { islem: "aktar", tablolar: [...secili], veri, zorla }, (r) => `${(r.tablolar as string[]).length} tablo Canlı'ya taşındı${r.veri ? " (kayıtlarıyla)" : ""}. Önce Canlı yedeklendi.`)} />
      <KopyaPaneli acik={panel?.tur === "yenile" || panel?.tur === "dal" || panel?.tur === "anadan"} kapat={() => setPanel(null)} isleniyor={!!isleniyor}
        baslik={panel?.tur === "dal" ? `"${panel.dal.ad}" dalına veri kopyala` : panel?.tur === "anadan" ? "Ana projeden veri al" : "Test'i Canlı'dan yenile"}
        alt={panel?.tur === "yenile" ? "Seçilen tablolar Test'te Canlı'nın kopyasıyla değişir; Test'teki önceki hâl kayıt geçmişine düşer" : "Dalın seçilen tabloları kaynağın kopyasıyla değişir; önceki hâl kayıt geçmişine düşer"}
        kaynakSec={panel?.tur === "dal" || panel?.tur === "anadan"} anaTestAcik={panel?.tur === "anadan" ? !!v.ana?.test : testAcik}
        tablolar={panel?.tur === "yenile" ? v.fark.filter((t) => t.durum !== "yeni" && !t.ortamaOzgu).map((t) => t.ad) : null}
        uygula={(g) => panel?.tur === "dal" ? islem("dal", { islem: "dalaKopyala", dal: panel.dal.id, ...g }, (r) => `${(r.tablolar as unknown[]).length} tablo dala kopyalandı${(r.maskelenen as string[]).length ? `, ${(r.maskelenen as string[]).length} alan maskelendi` : ""}.`)
          : panel?.tur === "anadan" ? islem("anadan", { islem: "anadanAl", ...g }, (r) => `${(r.tablolar as unknown[]).length} tablo ana projeden alındı.`)
          : islem("yenile", { islem: "yenile", ...g }, (r) => `${(r.tablolar as unknown[]).length} tablo Test'te Canlı'dan yenilendi.`)} />
    </div>
  );
}

function OrtamKarti({ ikon: I, ad, alt, ozet, sag, ton }: { ikon: typeof Rocket; ad: string; alt: string; ozet: { tablo: number; kayit: number } | null; sag?: React.ReactNode; ton?: "imza" }) {
  return (
    <div className="flex flex-col rounded-[22px] bg-[#121315] p-4 ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center gap-2.5">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-[11px]", ton === "imza" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.07] text-white")}><I className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-white">{ad}</span><span className="block text-[12px] leading-snug text-white/45">{alt}</span></span>
      </div>
      <div className="mt-3 flex items-end gap-4">
        {ozet ? <><span><span className="block text-[20px] font-semibold tabular-nums text-white">{ozet.tablo}</span><span className="text-[11.5px] text-white/45">tablo</span></span><span><span className="block text-[20px] font-semibold tabular-nums text-white">{sayiYaz(ozet.kayit)}</span><span className="text-[11.5px] text-white/45">kayıt</span></span></> : <span className="text-[12.5px] text-white/40">Veri yok</span>}
        <span className="ml-auto flex flex-wrap justify-end gap-1.5">{sag}</span>
      </div>
    </div>
  );
}

function KarsiSec({ l, deger, set }: { l: Karsi[]; deger: Karsi; set: (k: Karsi) => void }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setAcik((x) => !x)} className="inline-flex h-9 max-w-[220px] items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><span className="truncate">{deger.ad}</span><ChevronDown className="h-3.5 w-3.5 shrink-0" /></button>
      <AnimatePresence>{acik && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bd-panel absolute right-0 top-11 z-30 w-[260px] rounded-[16px] p-1.5">
          {l.map((x) => <button key={`${x.kaynak}-${x.hedef}`} type="button" onClick={() => { set(x); setAcik(false); }} className={cn("block w-full truncate rounded-[10px] px-3 py-2 text-left text-[13px]", x.kaynak === deger.kaynak && x.hedef === deger.hedef ? "bg-white/[0.07] text-white ring-1 ring-inset ring-white" : "text-white/70 hover:bg-white/[0.05]")}>{x.ad}</button>)}
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

function AktarPaneli({ acik, kapat, tablolar, aktar, isleniyor }: { acik: boolean; kapat: () => void; tablolar: Tablo[]; aktar: (veri: boolean, zorla: boolean) => Promise<unknown>; isleniyor: boolean }) {
  const [veri, setVeri] = useState(false);
  const [zorla, setZorla] = useState(false);
  useEffect(() => { if (acik) { setVeri(false); setZorla(false); } }, [acik]);
  const engeller = tablolar.flatMap((t) => t.denetimler.filter((d) => d.seviye === "engel").map((d) => ({ t: t.ad, d })));
  const uyarilar = tablolar.flatMap((t) => t.denetimler.filter((d) => d.seviye === "uyari").map((d) => ({ t: t.ad, d })));
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Canlı'ya taşı" alt="Yayındaki site bu değişiklikleri hemen kullanır; önce Canlı yedeklenir"
      alt2={<><span className="flex-1" /><Dugme onClick={kapat}>Vazgeç</Dugme><Dugme tur="birincil" yukleniyor={isleniyor} disabled={!!engeller.length && !zorla} onClick={() => aktar(veri, zorla)}><Rocket className="h-3.5 w-3.5" />{tablolar.length} tabloyu taşı</Dugme></>}>
      <div className="space-y-4">
        <div className="space-y-1.5">{tablolar.map((t) => <div key={t.ad} className="rounded-[12px] bg-white/[0.03] px-3 py-2 ring-1 ring-inset ring-white/[0.06]"><p className="font-mono text-[13px] text-white">{t.ad}</p><p className="text-[12px] text-white/50">{t.plan.length} adım{t.denetimler.length ? `, ${t.denetimler.length} ön denetim notu` : ""}</p></div>)}</div>
        <label className="flex items-start gap-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          <Anahtar acik={veri} set={setVeri} etiket="Kayıtları da taşı" />
          <span className="text-[12.5px] leading-relaxed text-white/65"><span className="block font-medium text-white">Kayıtları da taşı</span>Kapalıyken yalnız şema, kurallar ve açıklama taşınır; Canlı kayıtlarına dokunulmaz. Açıkken seçili tabloların Canlı kayıtları Test'tekilerle değişir (siparişler hariç).</span>
        </label>
        {engeller.length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-rose-200"><ShieldAlert className="h-3.5 w-3.5" />Ön denetimde {engeller.length} engel</p>
            {engeller.map((x, i) => <Uyari key={i}><span className="font-mono">{x.t}</span>: {x.d.metin}</Uyari>)}
            <label className="flex items-center gap-2.5 pt-1 text-[12.5px] text-white/70"><Anahtar acik={zorla} set={setZorla} etiket="Yine de taşı" />Engellere rağmen taşı (sonra düzeltirim)</label>
          </div>
        )}
        {uyarilar.length > 0 && <div className="space-y-1.5">{uyarilar.map((x, i) => <Uyari key={i} ton="uyari"><span className="font-mono">{x.t}</span>: {x.d.metin}</Uyari>)}</div>}
      </div>
    </YanPanel>
  );
}

function KopyaPaneli({ acik, kapat, baslik, alt, kaynakSec, anaTestAcik, tablolar, uygula, isleniyor }: { acik: boolean; kapat: () => void; baslik: string; alt: string; kaynakSec: boolean; anaTestAcik: boolean; tablolar: string[] | null; uygula: (g: Record<string, unknown>) => Promise<unknown>; isleniyor: boolean }) {
  const [kip, setKip] = useState<"sema" | "son" | "tum">("sema");
  const [adet, setAdet] = useState(50);
  const [maske, setMaske] = useState(true);
  const [kaynak, setKaynak] = useState<"canli" | "test">("canli");
  const [secili, setSecili] = useState<Set<string>>(new Set());
  useEffect(() => { if (acik) { setKip("sema"); setAdet(50); setMaske(true); setKaynak("canli"); setSecili(new Set(tablolar ?? [])); } }, [acik, tablolar]);
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={baslik} alt={alt}
      alt2={<><span className="flex-1" /><Dugme onClick={kapat}>Vazgeç</Dugme><Dugme tur="birincil" yukleniyor={isleniyor} disabled={!!tablolar && !secili.size} onClick={() => uygula({ kip, adet, maske, ...(kaynakSec ? { kaynak } : {}), ...(tablolar ? { tablolar: [...secili] } : {}) })}>Kopyala</Dugme></>}>
      <div className="space-y-4">
        {kaynakSec && (
          <div><p className="mb-1.5 text-[12.5px] text-white/55">Kaynak</p><div className="flex flex-wrap gap-1.5"><SecHap secili={kaynak === "canli"} onClick={() => setKaynak("canli")}>Canlı</SecHap><SecHap secili={kaynak === "test"} kapali={!anaTestAcik} onClick={() => setKaynak("test")}>Test</SecHap></div></div>
        )}
        <div>
          <p className="mb-1.5 text-[12.5px] text-white/55">Ne kopyalansın</p>
          <div className="grid gap-1.5">
            {([["sema", "Yalnız şema", "Tablolar, sütunlar ve kurallar; kayıtlar boş"], ["son", "Son kayıtlar", "Her tablodan son N kayıt"], ["tum", "Bütün kayıtlar", "Tam kopya (siparişler hariç)"]] as const).map(([id, ad, a]) => (
              <button key={id} type="button" onClick={() => setKip(id)} aria-pressed={kip === id} className={cn("rounded-[14px] px-3 py-2.5 text-left", kip === id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}><span className="block text-[13px] font-medium text-white">{ad}</span><span className="block text-[11.5px] text-white/45">{a}</span></button>
            ))}
          </div>
        </div>
        {kip === "son" && <div><p className="mb-1.5 text-[12.5px] text-white/55">Tablo başına kayıt</p><HazirSecim deger={adet} set={setAdet} l={[{ d: 20, ad: "20" }, { d: 50, ad: "50" }, { d: 200, ad: "200" }, { d: 1000, ad: "1.000" }]} en={1} cok={5000} birim="kayıt" /></div>}
        {kip !== "sema" && (
          <label className="flex items-start gap-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <Anahtar acik={maske} set={setMaske} etiket="Kişisel alanları maskele" />
            <span className="text-[12.5px] leading-relaxed text-white/65"><span className="block font-medium text-white">Kişisel alanları maskele</span>E-posta, telefon, ad soyad, adres, kimlik ve IBAN gibi alanlar uydurma değerlerle değişir; üye bağlantıları koparılır.</span>
          </label>
        )}
        {tablolar && (
          <div>
            <p className="mb-1.5 text-[12.5px] text-white/55">Tablolar</p>
            {!tablolar.length ? <p className="text-[12.5px] text-white/45">Kopyalanacak tablo yok.</p> : <div className="flex flex-wrap gap-1.5">{tablolar.map((t) => <SecHap key={t} secili={secili.has(t)} onClick={() => setSecili((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; })}><span className="font-mono">{t}</span></SecHap>)}</div>}
          </div>
        )}
      </div>
    </YanPanel>
  );
}
