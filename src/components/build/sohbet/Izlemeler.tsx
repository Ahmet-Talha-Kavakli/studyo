"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, CircleDashed, CloudRain, Coins, FileSearch, Globe, History, Loader2, MessageSquare, MoreHorizontal, Pencil, Play, Plus, Radar, Sparkles, Tag, Trash2, XCircle } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { ModelSecici } from "@/components/build/ModelSecici";
import { bildirimMerkeziniAc } from "@/components/build/bildirim/BildirimMerkezi";
import { api, gorece } from "@/lib/build/istemci";
import { VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { ARALIKLAR, HAVA_OLCUTLERI, IZLEME_SINIRI, IZLEME_TURLERI, KUR_SECENEKLERI, aralikMetni, izlemeAciklamasi, type Islec, type Izleme, type IzlemeKosulu, type IzlemeOnizleme, type IzlemeTur } from "@/lib/build/sohbetIzlemeOrtak";
import { cn } from "@/lib/utils";
import { Acilir, MenuSatir, SagPanel, useAcilir, Secici } from "./ortak";

const TUR_IKON: Record<IzlemeTur, typeof Radar> = { sayfa: FileSearch, deger: Tag, kur: Coins, hava: CloudRain, yapay: Sparkles };
type Form = {
  tur: IzlemeTur; ad: string; aralik: number; ozelAralik: string; tekrar: "bir-kez" | "her-seferinde";
  adres: string; kip: "yeni-oge" | "degisim" | "kelime"; kelime: string; odak: string;
  etiket: string; islec: Islec; esik: string; kod: string; ozelKod: string;
  yer: string; olcut: Extract<IzlemeKosulu, { tur: "hava" }>["olcut"]; gun: number; soru: string; model: string;
};
const BOS: Form = { tur: "sayfa", ad: "", aralik: 60, ozelAralik: "", tekrar: "her-seferinde", adres: "", kip: "yeni-oge", kelime: "", odak: "", etiket: "", islec: "alt", esik: "", kod: "USD", ozelKod: "", yer: "", olcut: "yagis", gun: 1, soru: "", model: VARSAYILAN_MODEL };

/** Hazır izlemeler (ChatGPT'nin izleme önerileri gibi; Türkiye'ye göre). */
export const IZLEME_SABLONLARI: { id: string; ad: string; alt: string; kapak: string; form: Partial<Form> }[] = [
  { id: "dolar", ad: "Dolar eşiği", alt: "Dolar 45 TL altına düşünce", kapak: "/gercek/havuz/gorsel/mk-is-308.webp", form: { tur: "kur", kod: "USD", islec: "alt", esik: "45", aralik: 60, tekrar: "bir-kez" } },
  { id: "altin", ad: "Gram altın", alt: "Gram altın yüzde 2 oynayınca", kapak: "/gercek/havuz/gorsel/mk-isik-38.webp", form: { tur: "kur", kod: "GRAM-ALTIN", islec: "degisim", esik: "2", aralik: 30 } },
  { id: "yagmur", ad: "Yarın yağmur", alt: "Yağış olasılığı yüzde 60 olursa", kapak: "/gercek/havuz/gorsel/mk-isik-2846.webp", form: { tur: "hava", olcut: "yagis", esik: "60", gun: 1, aralik: 360 } },
  { id: "duyuru", ad: "Yeni duyuru", alt: "Okul, belediye ya da şirket sayfasında", kapak: "/gercek/havuz/gorsel/mk-is-4809.webp", form: { tur: "sayfa", kip: "yeni-oge", aralik: 60 } },
  { id: "fiyat", ad: "Fiyat düşünce", alt: "Ürün sayfasındaki fiyat eşiğin altına inince", kapak: "/gercek/havuz/gorsel/mk-sehir-4451.webp", form: { tur: "deger", islec: "alt", aralik: 180, tekrar: "bir-kez" } },
  { id: "gazete", ad: "Resmî Gazete'de kelime", alt: "Bugünkü sayıda aradığın kelime geçince", kapak: "/gercek/havuz/gorsel/mk-yasam-4948.webp", form: { tur: "sayfa", kip: "kelime", adres: "https://www.resmigazete.gov.tr/", aralik: 360 } },
];

function formdanKosul(f: Form): IzlemeKosulu | { hata: string } {
  const esik = Number(f.esik.replace(/\./g, "").replace(",", "."));
  switch (f.tur) {
    case "sayfa": return f.adres.trim() ? { tur: "sayfa", adres: f.adres.trim(), kip: f.kip, ...(f.kelime.trim() ? { kelime: f.kelime.trim() } : {}), ...(f.odak.trim() ? { odak: f.odak.trim() } : {}) } : { hata: "Sayfanın adresini yaz." };
    case "deger": return !f.adres.trim() ? { hata: "Sayfanın adresini yaz." } : f.islec !== "degisim" && !Number.isFinite(esik) ? { hata: "Eşik değerini yaz." } : { tur: "deger", adres: f.adres.trim(), islec: f.islec, ...(f.esik.trim() && Number.isFinite(esik) ? { esik } : {}), ...(f.etiket.trim() ? { etiket: f.etiket.trim() } : {}) };
    case "kur": { const kod = f.kod === "ozel" ? f.ozelKod.trim().toUpperCase() : f.kod; return !kod ? { hata: "Kur kodunu yaz (ör. JPY)." } : !Number.isFinite(esik) || esik <= 0 ? { hata: f.islec === "degisim" ? "Yüzde değerini yaz." : "Eşik değerini yaz." } : { tur: "kur", kod, islec: f.islec, esik }; }
    case "hava": return !f.yer.trim() ? { hata: "Yeri yaz." } : { tur: "hava", yer: f.yer.trim(), olcut: f.olcut, gun: f.gun, esik: Number.isFinite(esik) ? esik : 0 };
    case "yapay": return f.soru.trim() ? { tur: "yapay", soru: f.soru.trim(), ...(f.adres.trim() ? { adres: f.adres.trim() } : {}), model: f.model } : { hata: "Hangi koşulun denetleneceğini yaz." };
  }
}
function kosuldanForm(x: Izleme): Form {
  const k = x.kosul, f: Form = { ...BOS, tur: k.tur, ad: x.ad, aralik: ARALIKLAR.some((a) => a.dk === x.aralik) ? x.aralik : -1, ozelAralik: String(x.aralik), tekrar: x.tekrar };
  if (k.tur === "sayfa") return { ...f, adres: k.adres, kip: k.kip, kelime: k.kelime ?? "", odak: k.odak ?? "" };
  if (k.tur === "deger") return { ...f, adres: k.adres, islec: k.islec, esik: k.esik !== undefined ? String(k.esik) : "", etiket: k.etiket ?? "" };
  if (k.tur === "kur") { const bilinen = KUR_SECENEKLERI.some((s) => s.kod === k.kod); return { ...f, kod: bilinen ? k.kod : "ozel", ozelKod: bilinen ? "" : k.kod, islec: k.islec, esik: String(k.esik) }; }
  if (k.tur === "hava") return { ...f, yer: k.yer, olcut: k.olcut, gun: k.gun, esik: String(k.esik) };
  return { ...f, soru: k.soru, adres: k.adres ?? "", model: k.model };
}

type Kurulum = { push: { kurulu: boolean }; eposta: { kurulu: boolean } };
/** İzleme paneli: tür, koşul, sıklık, bildirim biçimi; "Şimdi dene" koşulun şu anki değerini gösterir. */
export function IzlemePaneli({ acik, kapat, izleme, ilk, sohbet, bitti }: { acik: boolean; kapat: () => void; izleme?: Izleme | null; ilk?: Partial<Form>; sohbet?: string; bitti?: (x: Izleme) => void }) {
  const [f, setF] = useState<Form>(BOS);
  const [deneme, setDeneme] = useState<IzlemeOnizleme | null>(null);
  const [is, setIs] = useState<"" | "dene" | "kaydet">("");
  const [hata, setHata] = useState("");
  const [kanal, setKanal] = useState<{ kurulum: Kurulum; abonelik: number; eposta: string } | null>(null);
  const [baglantilar, setBaglantilar] = useState<Record<string, string | null>>();
  useEffect(() => {
    if (!acik) return;
    setHata(""); setDeneme(null);
    setF(izleme ? kosuldanForm(izleme) : { ...BOS, ...ilk });
    api<{ kurulum: Kurulum; abonelikler: unknown[]; ayar: { eposta: string } }>("/api/build/bildirim").then((v) => setKanal({ kurulum: v.kurulum, abonelik: v.abonelikler.length, eposta: v.ayar.eposta })).catch(() => {});
    fetch("/api/build/modeller").then((r) => r.json()).then((v) => setBaglantilar(v.baglantilar)).catch(() => {});
  }, [acik, izleme, ilk]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); setDeneme(null); };
  const kosul = useMemo(() => formdanKosul(f), [f]);
  const aralik = f.aralik === -1 ? Math.round(Number(f.ozelAralik)) : f.aralik;
  const dene = async () => {
    if ("hata" in kosul) { setHata(kosul.hata); return; }
    setIs("dene"); setHata("");
    try { setDeneme((await api<{ onizleme: IzlemeOnizleme }>("/api/build/sohbet/izleme/dene", { govde: { kosul } })).onizleme); } catch (e) { setHata(e instanceof Error ? e.message : "Denenemedi."); } finally { setIs(""); }
  };
  const kaydet = async () => {
    if ("hata" in kosul) { setHata(kosul.hata); return; }
    if (!Number.isFinite(aralik) || aralik < 10) { setHata("Denetim aralığını en az 10 dakika yaz."); return; }
    setIs("kaydet"); setHata("");
    try {
      const govde = { ad: f.ad.trim() || izlemeAciklamasi(kosul), kosul, aralik, tekrar: f.tekrar, sohbet };
      const r = izleme ? await api<{ izleme: Izleme }>(`/api/build/sohbet/izleme/${izleme.id}`, { method: "PATCH", govde }) : await api<{ izleme: Izleme }>("/api/build/sohbet/izleme", { govde });
      bitti?.(r.izleme); kapat();
    } catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); } finally { setIs(""); }
  };
  const satir = "flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/[0.06] px-4 py-3 first:border-0";
  const etiket = "w-24 shrink-0 text-[13px] text-white/55";
  const girdi = "min-w-[160px] flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40";
  const sec = (id: string, deger: string, l: { id: string; ad: string }[], setV: (v: string) => void) => <Secici id={id} deger={deger} set={setV} kucuk l={l} />;
  const birim = f.tur === "kur" ? (f.islec === "degisim" ? "yüzde" : f.kod === "ONS-ALTIN" ? "dolar" : "TL") : f.tur === "hava" ? HAVA_OLCUTLERI.find((o) => o.id === f.olcut)?.birim : "";
  return (
    <SagPanel acik={acik} kapat={kapat} baslik={izleme ? "İzlemeyi düzenle" : "Yeni izleme"} alt="Koşul gerçekleşince haber verilir" ikon={<Radar className="h-[18px] w-[18px]" />} genislik={580}
      alt2={<>
        {hata && <p className="flex items-center gap-1.5 text-[12.5px] text-rose-300"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{hata}</p>}
        <span className="ml-auto" />
        <button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button>
        <button type="button" onClick={kaydet} disabled={!!is} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-50">{is === "kaydet" && <Loader2 className="h-4 w-4 animate-spin" />}{izleme ? "Kaydet" : "İzlemeyi kur"}</button>
      </>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {IZLEME_TURLERI.map((t) => {
            const I = TUR_IKON[t.id], secili = f.tur === t.id;
            return (
              <button key={t.id} type="button" onClick={() => set("tur", t.id)} className={cn("flex min-h-[86px] flex-col items-start gap-1.5 rounded-[16px] p-3 text-left ring-1 ring-inset transition-colors", secili ? "bg-white/[0.07] ring-2 ring-white" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-[10px]", secili ? "bg-[#55d6fd]/[0.16] text-[#8be6ff]" : "bg-white/[0.06] text-white/75")}><I className="h-4 w-4" /></span>
                <span className="text-[13px] font-semibold leading-tight text-white">{t.ad}</span>
                <span className="line-clamp-2 text-[11.5px] leading-snug text-white/50">{t.alt}</span>
              </button>
            );
          })}
        </div>
        <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
          {(f.tur === "sayfa" || f.tur === "deger") && <label className={satir}><span className={etiket}>Sayfa</span><input value={f.adres} onChange={(e) => set("adres", e.target.value)} inputMode="url" placeholder="https://okul.edu.tr/duyurular" className={girdi} /></label>}
          {f.tur === "sayfa" && <>
            <div className={satir}><span className={etiket}>Ne zaman</span>{sec("iz-kip", f.kip, [{ id: "yeni-oge", ad: "Yeni öğe çıkınca" }, { id: "degisim", ad: "Değişince" }, { id: "kelime", ad: "Kelime görününce" }], (v) => set("kip", v as Form["kip"]))}</div>
            {f.kip === "kelime" && <label className={satir}><span className={etiket}>Kelime</span><input value={f.kelime} onChange={(e) => set("kelime", e.target.value)} placeholder="Örneğin: burs, ihale, kayıt" className={girdi} /></label>}
            {f.kip !== "kelime" && <label className={satir}><span className={etiket}>Odak</span><input value={f.odak} onChange={(e) => set("odak", e.target.value)} placeholder="İsteğe bağlı: yalnız bu kelimeyi içerenler" className={girdi} /></label>}
          </>}
          {f.tur === "deger" && <label className={satir}><span className={etiket}>Değer</span><input value={f.etiket} onChange={(e) => set("etiket", e.target.value)} placeholder="Boş bırakırsan ürün fiyatı okunur; ya da önündeki yazı" className={girdi} /></label>}
          {f.tur === "kur" && (
            <div className={cn(satir, "items-start")}><span className={cn(etiket, "pt-1.5")}>Ne izlensin</span>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {[...KUR_SECENEKLERI, { kod: "ozel", ad: "Özel" }].map((k) => <button key={k.kod} type="button" onClick={() => set("kod", k.kod)} className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors", f.kod === k.kod ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:text-white")}>{k.ad}</button>)}
                {f.kod === "ozel" && <input value={f.ozelKod} onChange={(e) => set("ozelKod", e.target.value.toUpperCase().slice(0, 3))} placeholder="JPY" aria-label="TCMB kur kodu" className="h-8 w-20 rounded-full bg-white/[0.06] px-3 text-[12.5px] uppercase text-white outline-none ring-1 ring-inset ring-white/15" />}
              </div>
            </div>
          )}
          {f.tur === "hava" && <>
            <label className={satir}><span className={etiket}>Yer</span><input value={f.yer} onChange={(e) => set("yer", e.target.value)} placeholder="Kadıköy, İstanbul" className={girdi} /></label>
            <div className={satir}><span className={etiket}>Gün</span>{sec("iz-gun", String(f.gun), [{ id: "0", ad: "Bugün" }, { id: "1", ad: "Yarın" }, { id: "2", ad: "2 gün sonra" }], (v) => set("gun", Number(v)))}</div>
            <div className={cn(satir, "items-start")}><span className={cn(etiket, "pt-1.5")}>Ölçüt</span>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">{HAVA_OLCUTLERI.map((o) => <button key={o.id} type="button" onClick={() => setF((x) => ({ ...x, olcut: o.id, esik: o.id === "yagis" ? "60" : o.id === "ruzgar" ? "40" : o.id === "sicaklik-alt" ? "0" : o.id === "sicaklik-ust" ? "35" : "" }))} className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors", f.olcut === o.id ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:text-white")}>{o.ad}</button>)}</div>
            </div>
          </>}
          {f.tur === "yapay" && <>
            <label className={cn(satir, "items-start")}><span className={cn(etiket, "pt-0.5")}>Koşul</span><textarea value={f.soru} onChange={(e) => set("soru", e.target.value)} rows={3} maxLength={1000} placeholder="Örneğin: Bu sayfada iPhone 17 için Türkiye fiyatı açıklandı mı?" className={cn(girdi, "resize-y leading-relaxed")} /></label>
            <label className={satir}><span className={etiket}>Kaynak</span><input value={f.adres} onChange={(e) => set("adres", e.target.value)} inputMode="url" placeholder="İsteğe bağlı: okunacak sayfa" className={girdi} /></label>
            <div className={satir}><span className={etiket}>Model</span><ModelSecici deger={f.model} sec={(m) => set("model", m)} baglantilar={baglantilar} ayrinti /></div>
          </>}
          {(f.tur === "deger" || f.tur === "kur") && <div className={satir}><span className={etiket}>Koşul</span>{sec("iz-islec", f.islec, [{ id: "alt", ad: "Altına düşünce" }, { id: "ust", ad: "Üstüne çıkınca" }, { id: "degisim", ad: f.tur === "kur" ? "Yüzde oynayınca" : "Değişince" }], (v) => set("islec", v as Islec))}</div>}
          {((f.tur === "deger" && f.islec !== "degisim") || f.tur === "kur" || (f.tur === "hava" && f.olcut !== "kar")) && (
            <label className={satir}><span className={etiket}>{f.tur === "kur" && f.islec === "degisim" ? "Yüzde" : "Eşik"}</span><input value={f.esik} onChange={(e) => set("esik", e.target.value)} inputMode="decimal" placeholder={f.tur === "kur" ? (f.islec === "degisim" ? "2" : "45") : f.tur === "hava" ? "60" : "1000"} className="w-28 rounded-[10px] bg-white/[0.06] px-3 py-1.5 text-[14px] tabular-nums text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />{birim && <span className="text-[12.5px] text-white/50">{birim}</span>}</label>
          )}
        </div>
        <div className="rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-[200px] flex-1 text-[13px] font-medium text-white">{"hata" in kosul ? "Koşulu tamamla" : izlemeAciklamasi(kosul)}</span>
            <button type="button" onClick={dene} disabled={!!is || "hata" in kosul} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-40">{is === "dene" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Şimdi dene</button>
          </div>
          <AnimatePresence>
            {deneme && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                {deneme.ok ? (
                  <dl className="mt-3 divide-y divide-white/[0.05] rounded-[14px] bg-black/20 px-3.5 text-[13px]">
                    <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 text-white/45">Şu an</dt><dd className="min-w-0 flex-1 font-medium text-white">{deneme.deger}</dd></div>
                    {deneme.kaynak && <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 text-white/45">Kaynak</dt><dd className="min-w-0 flex-1 break-words text-white/75">{deneme.kaynak}</dd></div>}
                    <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 text-white/45">Durum</dt><dd className={cn("min-w-0 flex-1", deneme.simdi ? "text-[#8be6ff]" : "text-white/75")}>{f.tur === "sayfa" && f.kip !== "kelime" ? "Sayfa okundu; bundan sonraki değişiklikler bildirilir." : deneme.simdi ? "Koşul şu an tutuyor; kurarsan ilk denetimde bildirilir." : "Koşul şu an tutmuyor; tutunca bildirilir."}</dd></div>
                    {deneme.mesaj && <div className="flex gap-3 py-2"><dt className="w-24 shrink-0 text-white/45">Not</dt><dd className="min-w-0 flex-1 text-white/70">{deneme.mesaj}</dd></div>}
                  </dl>
                ) : <p className="mt-3 flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] text-amber-100 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{deneme.hata}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
          <label className={satir}><span className={etiket}>Ad</span><input value={f.ad} onChange={(e) => set("ad", e.target.value)} maxLength={80} placeholder={"hata" in kosul ? "İzlemenin adı" : izlemeAciklamasi(kosul)} className={girdi} /></label>
          <div className={cn(satir, "items-start")}><span className={cn(etiket, "pt-1.5")}>Sıklık</span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {[...ARALIKLAR.filter((a) => !(f.tur === "yapay" || f.tur === "hava") || a.dk >= 60), { dk: -1, ad: "Özel" }].map((a) => <button key={a.dk} type="button" onClick={() => set("aralik", a.dk)} className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors", f.aralik === a.dk ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:text-white")}>{a.ad}</button>)}
              {f.aralik === -1 && <span className="flex items-center gap-1.5"><input value={f.ozelAralik} onChange={(e) => set("ozelAralik", e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" placeholder="90" aria-label="Dakika" className="h-8 w-16 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/15" /><span className="text-[12px] text-white/50">dakikada bir</span></span>}
            </div>
          </div>
          <div className={satir}><span className={etiket}>Bildirim</span>{sec("iz-tekrar", f.tekrar, [{ id: "her-seferinde", ad: "Her gerçekleşmede" }, { id: "bir-kez", ad: "Bir kez, sonra dur" }], (v) => set("tekrar", v as Form["tekrar"]))}</div>
          <div className={satir}>
            <span className={etiket}>Kanallar</span>
            <span className="min-w-[180px] flex-1 text-[12.5px] leading-snug text-white/65">
              {!kanal ? "Yükleniyor" : <>Vayra içinde{kanal.kurulum.push.kurulu && kanal.abonelik ? ", tarayıcıda" : ""}{kanal.kurulum.eposta.kurulu && kanal.eposta ? `, ${kanal.eposta} adresine` : ""}
                {(!kanal.kurulum.push.kurulu || !kanal.abonelik || !kanal.kurulum.eposta.kurulu || !kanal.eposta) && <span className="block text-white/45">{!kanal.kurulum.push.kurulu ? "Tarayıcı bildirimi sunucuda kurulu değil. " : !kanal.abonelik ? "Tarayıcı bildirimi bu hesapta açılmadı. " : ""}{!kanal.kurulum.eposta.kurulu ? "E-posta servisi kurulu değil." : !kanal.eposta ? "E-posta adresi eklenmedi." : ""}</span>}</>}
            </span>
            <button type="button" onClick={bildirimMerkeziniAc} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12]"><Bell className="h-3.5 w-3.5" />Ayarlar</button>
          </div>
        </div>
        <p className="px-1 text-[12px] leading-relaxed text-white/40">İlk denetim sayfanın şu anki hâlini kaydeder; bundan sonraki yenilikler ve eşik geçişleri bildirilir. Eşik koşulu sürdükçe tekrar bildirilmez, koşul bozulup yeniden gerçekleşince yine haber verilir.{f.tur === "yapay" ? " Serbest koşul her denetimde seçtiğin modelin kredisini harcar." : ""}</p>
      </div>
    </SagPanel>
  );
}

const SONUC_METNI = { tetiklendi: "Gerçekleşti", tutmadi: "Tutmadı", ilk: "İlk okuma", hata: "Hata" } as const;
/** Bir izlemenin denetim geçmişi (sağ panel). */
function GecmisPaneli({ x, kapat }: { x: Izleme | null; kapat: () => void }) {
  return (
    <SagPanel acik={!!x} kapat={kapat} baslik={x?.ad ?? ""} alt={x ? `${aralikMetni(x.aralik)} · ${x.kontrol} denetim · ${x.tetiklenme} bildirim` : ""} ikon={<History className="h-[18px] w-[18px]" />} genislik={500}>
      {x && (
        <div className="space-y-3">
          <dl className="divide-y divide-white/[0.05] rounded-[18px] px-4 text-[13px] ring-1 ring-inset ring-white/[0.08]">
            <div className="flex gap-3 py-2.5"><dt className="w-28 shrink-0 text-white/45">Koşul</dt><dd className="min-w-0 flex-1 text-white">{izlemeAciklamasi(x.kosul)}</dd></div>
            {x.sonDeger && <div className="flex gap-3 py-2.5"><dt className="w-28 shrink-0 text-white/45">Son değer</dt><dd className="min-w-0 flex-1 text-white">{x.sonDeger}</dd></div>}
            <div className="flex gap-3 py-2.5"><dt className="w-28 shrink-0 text-white/45">Sonraki</dt><dd className="min-w-0 flex-1 text-white/80">{x.durum === "acik" ? new Date(x.sonraki).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : x.duraklatmaNedeni ?? "Duraklatıldı"}</dd></div>
          </dl>
          {!x.gecmis.length ? <p className="px-1 text-[13px] text-white/50">Henüz denetlenmedi.</p> : (
            <ol className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
              {x.gecmis.map((k) => (
                <li key={k.zaman} className="flex items-start gap-3 border-t border-white/[0.06] px-4 py-2.5 first:border-0">
                  {k.sonuc === "tetiklendi" ? <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#8be6ff]" /> : k.sonuc === "hata" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" /> : k.sonuc === "ilk" ? <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-white/50" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />}
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[13px]"><span className={cn("font-medium", k.sonuc === "tetiklendi" ? "text-[#8be6ff]" : k.sonuc === "hata" ? "text-rose-200" : "text-white/80")}>{SONUC_METNI[k.sonuc]}</span>{k.deger && <span className="truncate text-white/60">{k.deger}</span>}</span>{k.not && <span className="block text-[12px] text-white/45">{k.not}</span>}</span>
                  <span className="shrink-0 text-[11.5px] text-white/40">{new Date(k.zaman).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </SagPanel>
  );
}

function IzlemeMenu({ x, degisti, duzenle, gecmis }: { x: Izleme; degisti: () => void; duzenle: () => void; gecmis: () => void }) {
  const a = useAcilir(240);
  const [sil, setSil] = useState(false);
  useEffect(() => { if (!a.acik) setSil(false); }, [a.acik]);
  return (
    <div ref={a.kok}>
      <button type="button" onClick={() => a.setAcik(!a.acik)} aria-label="İzleme menüsü" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
      <Acilir a={a}>
        <MenuSatir ikon={<Pencil className="h-4 w-4" />} ad="Düzenle" onClick={() => { a.setAcik(false); duzenle(); }} />
        <MenuSatir ikon={<History className="h-4 w-4" />} ad="Denetim geçmişi" alt={`${x.kontrol} denetim`} onClick={() => { a.setAcik(false); gecmis(); }} />
        {x.sohbet && <MenuSatir ikon={<MessageSquare className="h-4 w-4" />} ad="Sohbete git" alt="Bildirimler burada birikir" onClick={() => { location.href = `/panel/build/sohbet/${x.sohbet}`; }} />}
        {x.kosul.tur !== "kur" && x.kosul.tur !== "hava" && "adres" in x.kosul && x.kosul.adres && <MenuSatir ikon={<Globe className="h-4 w-4" />} ad="Sayfayı aç" onClick={() => { a.setAcik(false); window.open((x.kosul as { adres: string }).adres, "_blank", "noopener"); }} />}
        <div className="my-1 h-px bg-white/[0.07]" />
        <MenuSatir tehlike secili={sil} ikon={<Trash2 className="h-4 w-4" />} ad={sil ? "Silmek için tekrar tıkla" : "Sil"} onClick={async () => { if (!sil) { setSil(true); return; } a.setAcik(false); await api(`/api/build/sohbet/izleme/${x.id}`, { method: "DELETE" }).catch(() => {}); degisti(); }} />
      </Acilir>
    </div>
  );
}

/** İzlemeler sekmesi (Görevler sayfasında): liste, şimdi denetle, duraklat, geçmiş, hazır izlemeler. */
export function IzlemeListesi({ yeniAc }: { yeniAc?: boolean }) {
  const [l, setL] = useState<Izleme[] | null>(null);
  const [panel, setPanel] = useState<{ izleme?: Izleme | null; ilk?: Partial<Form> } | null>(yeniAc ? {} : null);
  const [gecmis, setGecmis] = useState<Izleme | null>(null);
  const [is, setIs] = useState("");
  const [hata, setHata] = useState("");
  const yenile = useCallback(() => api<{ izlemeler: Izleme[] }>("/api/build/sohbet/izleme").then((v) => setL(v.izlemeler)).catch(() => setL([])), []);
  useEffect(() => { yenile(); const t = setInterval(yenile, 60_000); return () => clearInterval(t); }, [yenile]);
  const denetle = async (x: Izleme) => {
    setIs(`d-${x.id}`); setHata("");
    try { const r = await api<{ izleme: Izleme }>(`/api/build/sohbet/izleme/${x.id}/denetle`, { govde: {} }); setL((y) => y?.map((z) => (z.id === x.id ? r.izleme : z)) ?? null); }
    catch (e) { setHata(e instanceof Error ? e.message : "Denetlenemedi."); } finally { setIs(""); }
  };
  const durum = async (x: Izleme) => {
    setIs(`s-${x.id}`); setHata("");
    try { const r = await api<{ izleme: Izleme }>(`/api/build/sohbet/izleme/${x.id}`, { method: "PATCH", govde: { durum: x.durum === "acik" ? "duraklatildi" : "acik" } }); setL((y) => y?.map((z) => (z.id === x.id ? r.izleme : z)) ?? null); }
    catch (e) { setHata(e instanceof Error ? e.message : "Değiştirilemedi."); } finally { setIs(""); }
  };
  const etkin = (l ?? []).filter((x) => x.durum === "acik").length;
  return (
    <>
      <Kart ikon={Radar} baslik={<span className="flex items-center gap-2">İzleme{l && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/65">{etkin} / {IZLEME_SINIRI}<span className="max-sm:hidden"> etkin</span></span>}</span>}
        alt="Koşul gerçekleşince Vayra içinde, tarayıcıda ve e-postayla haber verir" govde=""
        sag={<button type="button" onClick={() => setPanel({})} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black max-sm:w-9 max-sm:justify-center max-sm:px-0"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Yeni izleme</span></button>}>
        {hata && <p className="flex items-center gap-2 border-b border-white/[0.06] bg-rose-500/[0.07] px-5 py-2.5 text-[13px] text-rose-200"><AlertTriangle className="h-4 w-4" />{hata}</p>}
        {l === null ? <div className="space-y-2 p-4">{[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-[14px] bg-white/[0.03]" />)}</div>
          : !l.length ? (
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Radar className="h-5 w-5" /></span>
                <span className="min-w-[200px] flex-1"><span className="block text-[14.5px] font-semibold text-white">Henüz izleme yok</span><span className="block text-[13px] text-white/55">Aşağıdan hazır bir izleme seç ya da sohbette &quot;dolar 45&apos;in altına düşünce haber ver&quot; de.</span></span>
                <Link href="/panel/build/sohbet/yeni" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><MessageSquare className="h-4 w-4" />Sohbette kur</Link>
                <button type="button" onClick={() => setPanel({})} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni izleme</button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              <AnimatePresence initial={false}>
                {l.map((x) => {
                  const I = TUR_IKON[x.kosul.tur];
                  const son = x.gecmis[0];
                  return (
                    <motion.li key={x.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                      <span className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]", x.durum === "acik" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/45")}>
                        {is === `d-${x.id}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <I className="h-5 w-5" />}
                        {!!x.okunmamis && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#55d6fd] px-1 text-[11px] font-semibold text-black">{x.okunmamis}</span>}
                      </span>
                      <span className="min-w-[200px] flex-1">
                        <span className="flex items-center gap-2"><button type="button" onClick={() => setGecmis(x)} className="truncate text-left text-[14.5px] font-semibold text-white hover:underline">{x.ad}</button>{x.durum !== "acik" && <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/55">Duraklatıldı</span>}</span>
                        <span className="block truncate text-[12.5px] text-white/50">{x.durum === "acik" ? izlemeAciklamasi(x.kosul) : x.duraklatmaNedeni ?? izlemeAciklamasi(x.kosul)} · {aralikMetni(x.aralik)}</span>
                      </span>
                      <span className="hidden min-w-[170px] max-w-[240px] flex-col text-right md:flex">
                        {x.sonDeger && <span className="truncate text-[13px] font-medium tabular-nums text-white">{x.sonDeger}</span>}
                        <span className={cn("flex items-center justify-end gap-1.5 text-[12px]", son?.sonuc === "hata" ? "text-rose-300/90" : "text-white/45")}>{son ? <>{son.sonuc === "tetiklendi" && <Bell className="h-3 w-3 text-[#8be6ff]" />}{SONUC_METNI[son.sonuc]} · {gorece(son.zaman)}</> : "Henüz denetlenmedi"}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <button type="button" disabled={!!is} onClick={() => denetle(x)} title="Şimdi denetle" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12] disabled:opacity-40"><Play className="h-3.5 w-3.5" /><span className="max-sm:hidden">Şimdi denetle</span></button>
                        <button type="button" disabled={!!is} onClick={() => durum(x)} role="switch" aria-checked={x.durum === "acik"} title={x.durum === "acik" ? "Duraklat" : "Sürdür"} className={cn("relative h-[24px] w-[40px] shrink-0 rounded-full transition-colors disabled:opacity-40", x.durum === "acik" ? "bg-white" : "bg-white/[0.14]")}>
                          <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 34 }} className={cn("absolute top-[3px] h-[18px] w-[18px] rounded-full", x.durum === "acik" ? "right-[3px] bg-[#0a0a0b]" : "left-[3px] bg-white")} />
                        </button>
                        <IzlemeMenu x={x} degisti={yenile} duzenle={() => setPanel({ izleme: x })} gecmis={() => setGecmis(x)} />
                      </span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
      </Kart>
      <Kart ikon={Plus} baslik="Hazır izlemeler" alt="Birini seç, adresi ve eşiği kendine göre değiştir" govde="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IZLEME_SABLONLARI.map((s) => (
            <button key={s.id} type="button" onClick={() => setPanel({ ilk: s.form })} className="group relative flex h-[120px] flex-col justify-end overflow-hidden rounded-[18px] p-3.5 text-left ring-1 ring-inset ring-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.kapak} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.04]" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d] via-[#0b0c0d]/70 to-transparent" />
              <span className="relative block text-[14.5px] font-semibold text-white">{s.ad}</span>
              <span className="relative mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/70"><Radar className="h-3.5 w-3.5 text-[#8be6ff]" />{s.alt}</span>
            </button>
          ))}
        </div>
      </Kart>
      <IzlemePaneli acik={!!panel} kapat={() => setPanel(null)} izleme={panel?.izleme} ilk={panel?.ilk} bitti={() => yenile()} />
      <GecmisPaneli x={gecmis} kapat={() => setGecmis(null)} />
    </>
  );
}
