"use client";

import { Iskelet, IskeletListeSatiri } from "@/components/ui/Iskelet";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronRight, Coins, CreditCard, Download, Gauge, Gift, Infinity as Sonsuz, Printer, RotateCcw, Search, Send, Ticket, Trophy, User, X, FlaskConical } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { Grup, Hap, KaydetCubugu, Satir, Sayfa, Segment, alan, dugme, akis } from "@/components/ayarlar/ui";
import { kesfetFont } from "@/components/kesfet/font";
import { paraYaz } from "@/lib/odeme/katalog";
import { BOS_FATURA, tcknGecerli, vknGecerli } from "@/lib/odeme/fatura";
import * as O from "@/lib/odeme/istemci";
import type { FaturaBilgisi, KrediKaydi, OdemeDurumu, SiparisOzeti } from "@/lib/odeme/tipler";
import { SAGLAYICI_AD } from "@/lib/odeme/tipler";
import { metinIndir } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

/**
 * Ayarlar, Faturalar: ödeme geçmişi ve makbuzlar sunucudaki siparişlerden; kod, hediye ve görev kredileri kredi
 * defterinden. Fatura bilgisi sunucuda saklanır ve ödemede kullanılır. e-Arşiv entegratörü bağlı değil: makbuz mali
 * değeri olan faturanın yerine geçmez; bu açıkça yazılır.
 */
type HareketTur = "kredi" | "plan" | "sinirsiz" | "hiz" | "promo" | "hediye" | "odul" | "iade" | "hediye-gonder" | "hediye-iade" | "deneme";
interface Hareket { id: string; zaman: number; tur: HareketTur; aciklama: string; kredi: number; toplam?: number; para?: "TRY" | "USD"; belgeNo?: string; siparis?: SiparisOzeti; durum?: SiparisOzeti["durum"] }

const TUR: Record<HareketTur, { ad: string; ikon: React.ElementType; renk: string }> = {
  kredi: { ad: "Kredi paketi", ikon: Coins, renk: "#f472b6" }, plan: { ad: "Abonelik", ikon: CreditCard, renk: "#55d6fd" },
  sinirsiz: { ad: "Sınırsız erişim", ikon: Sonsuz, renk: "#55d6fd" }, hiz: { ad: "Hız", ikon: Gauge, renk: "#a78bfa" },
  promo: { ad: "Promosyon", ikon: Ticket, renk: "#fbbf24" }, hediye: { ad: "Hediye kodu", ikon: Gift, renk: "#fbbf24" },
  odul: { ad: "Görev ödülü", ikon: Trophy, renk: "#34d399" }, iade: { ad: "İade", ikon: RotateCcw, renk: "#9ca3af" },
  "hediye-gonder": { ad: "Hediye gönderimi", ikon: Send, renk: "#a78bfa" }, "hediye-iade": { ad: "Hediye iadesi", ikon: RotateCcw, renk: "#a78bfa" },
  deneme: { ad: "Deneme yüklemesi", ikon: FlaskConical, renk: "#9ca3af" },
};
const DURUM_AD: Record<SiparisOzeti["durum"], string> = { odendi: "Ödendi", bekliyor: "Bekliyor", basarisiz: "Başarısız", iade: "İade edildi" };
const tarihSaat = (t: number) => new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const ayBasligi = (t: number) => new Date(t).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

function TurSimgesi({ tur, boyut = 36 }: { tur: HareketTur; boyut?: number }) {
  const T = TUR[tur];
  return <span className="flex shrink-0 items-center justify-center rounded-[10px]" style={{ width: boyut, height: boyut, background: `${T.renk}1c`, color: T.renk }}><T.ikon className="h-4 w-4" /></span>;
}

function hareketler(siparisler: SiparisOzeti[], kayitlar: KrediKaydi[]): Hareket[] {
  const a: Hareket[] = siparisler.map((s) => ({
    id: s.no, zaman: s.odemeZamani ?? s.olusturma, tur: s.durum === "iade" ? "iade" : s.tur, aciklama: s.ad, kredi: s.durum === "odendi" ? s.kredi ?? 0 : 0,
    toplam: s.tahsil ?? s.toplam, para: s.para, belgeNo: s.makbuzNo, siparis: s, durum: s.durum,
  }));
  const b: Hareket[] = kayitlar.map((k) => ({ id: k.id, zaman: k.zaman, tur: k.tur === "duzeltme" ? "deneme" : k.tur, aciklama: k.aciklama, kredi: k.kredi }));
  return [...a, ...b].sort((x, y) => y.zaman - x.zaman);
}

export default function Faturalar() {
  const [veri, setVeri] = useState<{ siparisler: SiparisOzeti[]; kayitlar: KrediKaydi[]; fatura: FaturaBilgisi | null; durum: OdemeDurumu | null } | null>(null);
  const [ara, setAra] = useState("");
  const [filtre, setFiltre] = useState<"tumu" | "odeme" | "kredi">("tumu");
  const [secili, setSecili] = useState<SiparisOzeti | null>(null);

  useEffect(() => {
    void O.gecmisGetir().then((r) => setVeri(r.ok ? { siparisler: r.siparisler, kayitlar: r.krediKayitlari, fatura: r.fatura, durum: r.durum } : { siparisler: [], kayitlar: [], fatura: null, durum: null }));
  }, []);

  const tumu = useMemo(() => (veri ? hareketler(veri.siparisler, veri.kayitlar) : []), [veri]);
  const liste = useMemo(() => tumu
    .filter((h) => (filtre === "tumu" || (filtre === "odeme" ? !!h.siparis : !h.siparis))
      && (!ara || `${h.aciklama} ${h.belgeNo ?? ""} ${h.id} ${TUR[h.tur].ad}`.toLocaleLowerCase("tr-TR").includes(ara.toLocaleLowerCase("tr-TR")))), [tumu, filtre, ara]);
  const gruplar = useMemo(() => { const m = new Map<string, Hareket[]>(); for (const h of liste) { const k = ayBasligi(h.zaman); m.set(k, [...(m.get(k) ?? []), h]); } return [...m.entries()]; }, [liste]);
  const odenen = (veri?.siparisler ?? []).filter((s) => s.durum === "odendi");
  const yil = new Date().getFullYear();
  const buYil = odenen.filter((s) => s.para === "TRY" && new Date(s.odemeZamani ?? s.olusturma).getFullYear() === yil).reduce((t, s) => t + (s.tahsil ?? s.toplam), 0);
  const krediGelen = tumu.filter((h) => h.kredi > 0).reduce((a, h) => a + h.kredi, 0);
  const son = odenen[0];

  const csv = () => {
    const satir = (x: (string | number)[]) => x.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
    const icerik = "﻿" + [satir(["Tarih", "Makbuz no", "Sipariş no", "Tür", "Açıklama", "Durum", "Kredi", "Para", "KDV hariç", "KDV", "Toplam"]),
      ...liste.map((h) => { const s = h.siparis; return satir([new Date(h.zaman).toLocaleString("tr-TR"), h.belgeNo ?? "", s?.no ?? "", TUR[h.tur].ad, h.aciklama, s ? DURUM_AD[s.durum] : "", h.kredi, s?.para ?? "", s ? (s.net / 100).toFixed(2) : "", s ? (s.kdv / 100).toFixed(2) : "", s ? ((s.tahsil ?? s.toplam) / 100).toFixed(2) : ""]); })].join("\r\n");
    if (metinIndir(icerik, `vayra-odemeler-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")) toast.success("Hareketler indirildi", { description: `${liste.length} hareket CSV olarak kaydedildi.` });
    else mesaj.indirilemedi("Tarayıcı indirmeyi engelledi.");
  };

  const ozet = (
    <dl className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
      {[
        [`${yil} ödemeleri`, paraYaz(buYil, "TRY"), "KDV dahil, Türk lirası"],
        ["Makbuz", String(odenen.filter((s) => s.makbuzNo).length), "ödenmiş işlem"],
        ["Eklenen kredi", krediGelen.toLocaleString("tr-TR"), "paket, kod ve ödüller"],
        ["Son ödeme", son ? new Date(son.odemeZamani ?? son.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "Yok", son ? paraYaz(son.tahsil ?? son.toplam, son.para) : "henüz ödeme yok"],
      ].map(([e, d, a], i) => (
        <motion.div key={e} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: akis }}
          className={cn("border-white/[0.06] px-5 py-4", i % 2 === 1 && "border-l", i > 1 && "border-t")}>
          <dt className="text-[12.5px] text-white/45">{e}</dt>
          <dd className="mt-1 truncate text-[20px] font-semibold tracking-[-0.02em] tabular-nums text-white">{veri ? d : "…"}</dd>
          <dd className="truncate text-[12px] text-white/35">{a}</dd>
        </motion.div>
      ))}
    </dl>
  );

  return (
    <Sayfa baslik="Faturalar" aciklama="Ödemelerinin makbuzları, kredi hareketlerin ve faturada görünecek bilgiler." yan={ozet}
      sag={tumu.length > 0 && <button type="button" onClick={csv} className={cn(dugme.hayalet, "h-8 text-[13px]")}><Download className="h-3.5 w-3.5" />CSV</button>}>
      <Grup id="makbuzlar" baslik="Hareketler" aciklama="Ödemeli satıra tıkla; makbuzu önizle, yazdır ya da PDF olarak kaydet."
        sag={tumu.length > 0 && <Segment kucuk kayit={false} deger={filtre} onSec={setFiltre} secenekler={[{ deger: "tumu", ad: "Tümü" }, { deger: "odeme", ad: "Ödemeler" }, { deger: "kredi", ad: "Ücretsiz" }]} />}
        alt={tumu.length > 0 ? <><span>{tumu.length} hareketten {liste.length} tanesi</span><span>Tutarlar KDV dahil</span></> : undefined}>
        {!veri ? (
          <div aria-busy aria-label="Hareketler yükleniyor"><div className="px-6 py-3"><Iskelet className="h-10 rounded-[12px]" /></div><div className="px-6 pb-1 pt-3"><Iskelet className="h-3 w-24 rounded-full" /></div>{[0, 1, 2].map((i) => <IskeletListeSatiri key={i} ilk={["w-56", "w-44", "w-52"][i]} ikinci={["w-36", "w-28", "w-32"][i]} />)}</div>
        ) : tumu.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex -space-x-2">{(["kredi", "plan", "hediye"] as HareketTur[]).map((t) => <span key={t} className="rounded-[12px] ring-4 ring-[#121214]"><TurSimgesi tur={t} boyut={40} /></span>)}</span>
            <p className="mt-4 text-[16px] font-semibold text-white">Henüz hareket yok</p>
            <p className="mt-1.5 max-w-[400px] text-[14px] leading-relaxed text-white/50">Kredi paketi, plan ya da sınırsız erişim aldığında makbuzları burada görünür. Kodlar ve ödüller de listelenir.</p>
            <div className="mt-5 flex gap-2"><Link href="/panel/kredi?sekme=kredi" className={dugme.birincil}>Kredi yükle</Link><Link href="/panel/ayarlar/hediye" className={dugme.ikincil}>Kod kullan</Link></div>
          </div>
        ) : (
          <>
            <div className="px-6 py-3">
              <label className="flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.07] focus-within:ring-[#55d6fd]/60">
                <Search className="h-4 w-4 text-white/35" />
                <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Açıklama, makbuz ya da sipariş numarası ara" aria-label="Hareketlerde ara" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/35" />
                {ara && <button type="button" onClick={() => setAra("")} aria-label="Temizle" className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
              </label>
            </div>
            {gruplar.map(([ay, hs]) => (
              <div key={ay}>
                <p className="px-6 pb-1 pt-3 text-[12.5px] font-medium text-white/40">{ay}</p>
                {hs.map((h) => {
                  const T = TUR[h.tur];
                  const s = h.siparis;
                  const Kap = s ? "button" : "div";
                  return (
                    <Kap key={h.id} {...(s ? { type: "button" as const, onClick: () => setSecili(s), "aria-label": `${h.aciklama} makbuzu` } : {})}
                      className={cn("group flex w-full items-center gap-3.5 px-6 py-3 text-left transition-colors", s && "hover:bg-white/[0.025]")}>
                      <TurSimgesi tur={h.tur} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-white">{h.aciklama}</span>
                        <span className="block truncate text-[12.5px] text-white/40">{new Date(h.zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · {T.ad}{h.belgeNo && <span className="sc-kod"> · {h.belgeNo}</span>}{s?.saglayici === "deneme" && " · Deneme ödemesi"}{s?.mod === "test" && s.saglayici !== "deneme" && " · Test"}</span>
                      </span>
                      {s && s.durum !== "odendi" && <Hap ton={s.durum === "basarisiz" ? "kirmizi" : s.durum === "iade" ? "notr" : "sari"}>{DURUM_AD[s.durum]}</Hap>}
                      <span className="shrink-0 text-right">
                        <span className="block text-[14px] font-medium tabular-nums text-white">{s ? paraYaz(h.toplam ?? 0, h.para ?? "TRY") : <span className="font-normal text-white/40">Ücretsiz</span>}</span>
                        <span className={cn("block text-[12.5px] tabular-nums", h.kredi > 0 ? "text-emerald-300" : h.kredi < 0 ? "text-rose-300" : "text-white/35")}>{h.kredi ? `${h.kredi > 0 ? "+" : ""}${h.kredi.toLocaleString("tr-TR")} kredi` : ""}</span>
                      </span>
                      {s ? <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" /> : <span className="w-4 shrink-0" />}
                    </Kap>
                  );
                })}
              </div>
            ))}
            {!liste.length && <p className="px-6 py-8 text-center text-[14px] text-white/45">Eşleşen hareket yok.</p>}
          </>
        )}
      </Grup>

      {veri && <FaturaBilgileri ilk={veri.fatura} />}
      <MakbuzCekmecesi s={secili} onKapat={() => setSecili(null)} />
    </Sayfa>
  );
}

function FaturaBilgileri({ ilk }: { ilk: FaturaBilgisi | null }) {
  const email = useAuth((s) => s.kullanici?.email ?? "");
  const [kayitli, setKayitli] = useState<FaturaBilgisi>(() => ({ ...BOS_FATURA, eposta: email, ...(ilk ?? {}) }));
  const [f, setF] = useState<FaturaBilgisi>(kayitli);
  const [kaydediyor, setKaydediyor] = useState(false);
  const degisti = (Object.keys(f) as (keyof FaturaBilgisi)[]).some((k) => (f[k] ?? "") !== (kayitli[k] ?? ""));
  const ayarla = (k: keyof FaturaBilgisi, v: string) => setF((x) => ({ ...x, [k]: v }));
  const h: Partial<Record<keyof FaturaBilgisi, string>> = {};
  if (f.tip === "bireysel") {
    if (f.adSoyad && f.adSoyad.trim().split(/\s+/).length < 2) h.adSoyad = "Ad ve soyad gir.";
    if (f.tckn && !tcknGecerli(f.tckn)) h.tckn = "Geçerli bir T.C. kimlik numarası değil.";
  } else {
    if (f.vkn && !vknGecerli(f.vkn)) h.vkn = "Geçerli bir vergi kimlik numarası değil.";
    if (f.vkn && !f.vergiDairesi.trim()) h.vergiDairesi = "Vergi dairesini gir.";
  }
  if (f.postaKodu && !/^\d{5}$/.test(f.postaKodu)) h.postaKodu = "5 haneli olmalı.";
  if (f.eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.eposta)) h.eposta = "Geçerli bir e-posta gir.";
  const hataSay = Object.keys(h).length;

  const kaydet = async () => {
    setKaydediyor(true);
    const r = await O.faturaKaydet(f);
    setKaydediyor(false);
    if (!r.ok) return toast.error("Fatura bilgileri kaydedilemedi", { description: r.hata });
    const yeni = { ...BOS_FATURA, ...r.fatura };
    setKayitli(yeni); setF(yeni);
    toast.success("Fatura bilgileri kaydedildi", { description: "Sonraki ödemelerde ve makbuzlarda kullanılacak." });
  };

  const satir = (k: keyof FaturaBilgisi, ad: string, ek?: { sayisal?: number; ipucu?: string; otomatik?: string; yer?: string; genis?: boolean }) => (
    <label key={k} id={`fatura-${k}`} className={cn("block min-w-0 scroll-mt-28", ek?.genis && "sm:col-span-2")}>
      <span className="mb-1.5 block text-[13px] font-medium text-white/80">{ad}</span>
      <input value={String(f[k] ?? "")} autoComplete={ek?.otomatik} placeholder={ek?.yer}
        onChange={(e) => ayarla(k, ek?.sayisal ? e.target.value.replace(/\D/g, "").slice(0, ek.sayisal) : e.target.value)}
        inputMode={ek?.sayisal ? "numeric" : undefined} className={cn(alan, h[k] && "ring-rose-500/60")} />
      {(h[k] || ek?.ipucu) && <span className={cn("mt-1.5 block text-[12.5px]", h[k] ? "text-rose-300" : "text-white/45")}>{h[k] ?? ek?.ipucu}</span>}
    </label>
  );

  return (
    <Grup id="bilgi" baslik="Fatura bilgileri" aciklama="Ödemede ve makbuzlarında kullanılır; hesabınla birlikte sunucuda saklanır."
      alt="Kimlik ve vergi numaraları resmî algoritmayla doğrulanır. e-Arşiv ve e-Fatura entegrasyonu bu sürümde bağlı değil: makbuzlar mali değeri olan faturanın yerine geçmez, fatura bilgilerin her siparişle birlikte saklanır.">
      <Satir ad="Fatura tipi">
        <Segment kayit={false} deger={f.tip} onSec={(v) => ayarla("tip", v)} secenekler={[{ deger: "bireysel", ad: "Bireysel", ikon: <User className="h-3.5 w-3.5" /> }, { deger: "kurumsal", ad: "Kurumsal", ikon: <Building2 className="h-3.5 w-3.5" /> }]} />
      </Satir>
      <div className="grid gap-x-4 gap-y-4 px-6 py-5 sm:grid-cols-2">
        {f.tip === "bireysel" ? <>
          {satir("adSoyad", "Ad soyad", { otomatik: "name", yer: "Ayşe Yılmaz" })}
          {satir("tckn", "T.C. kimlik no", { sayisal: 11, ipucu: "e-Arşiv fatura için gerekli.", yer: "11 haneli" })}
        </> : <>
          {satir("unvan", "Şirket unvanı", { otomatik: "organization", yer: "Şirketin tam unvanı", genis: true })}
          {satir("vkn", "Vergi kimlik no", { sayisal: 10, yer: "10 haneli" })}
          {satir("vergiDairesi", "Vergi dairesi", { yer: "Kadıköy" })}
        </>}
        {satir("adres", "Adres", { otomatik: "street-address", yer: "Mahalle, cadde, kapı no", genis: true })}
        {satir("ilce", "İlçe", { otomatik: "address-level2", yer: "Kadıköy" })}
        {satir("il", "İl", { otomatik: "address-level1", yer: "İstanbul" })}
        {satir("postaKodu", "Posta kodu", { sayisal: 5, otomatik: "postal-code", yer: "34710" })}
        {satir("eposta", "Fatura e-postası", { otomatik: "email", ipucu: "Makbuzlar bu adrese gönderilir.", yer: "ad@alanadi.com" })}
      </div>
      <KaydetCubugu gorunur={degisti || kaydediyor} onSifirla={() => setF(kayitli)} hata={hataSay ? `${hataSay} alanı düzelt` : null} onKaydet={() => void kaydet()} />
    </Grup>
  );
}

/** Sağdan açılan makbuz önizlemesi; yazdırılabilir makbuz sayfasına geçer. */
function MakbuzCekmecesi({ s, onKapat }: { s: SiparisOzeti | null; onKapat: () => void }) {
  const email = useAuth((x) => x.kullanici?.email ?? "");
  const ad = useAuth((x) => x.kullanici?.ad ?? "");
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    if (!s) return;
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    addEventListener("keydown", tus); return () => removeEventListener("keydown", tus);
  }, [s, onKapat]);
  if (!hazir) return null;

  const icerik = s && (() => {
    const fb = s.fatura;
    const alici = fb ? (fb.tip === "kurumsal" ? [fb.unvan, `VKN ${fb.vkn}, ${fb.vergiDairesi} V.D.`] : [fb.adSoyad, fb.tckn ? `TCKN ${fb.tckn.slice(0, 3)}*****${fb.tckn.slice(-3)}` : ""]) : [ad, email];
    const adres = fb ? [fb.adres, [fb.ilce, fb.il, fb.postaKodu].filter(Boolean).join(" ")].filter(Boolean) : [];
    const tur: HareketTur = s.durum === "iade" ? "iade" : s.tur;
    return (
      <>
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <TurSimgesi tur={tur} boyut={40} />
            <div className="min-w-0"><h2 className="truncate text-[18px] font-semibold text-white">Makbuz</h2><p className="sc-kod truncate text-[12.5px] text-white/40">{s.makbuzNo ?? s.no}</p></div>
          </div>
          <button type="button" onClick={onKapat} aria-label="Kapat" className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[16px] bg-white/[0.03] p-4 text-[13px]">
            <div><dt className="text-white/40">Tarih</dt><dd className="mt-0.5 text-white">{tarihSaat(s.odemeZamani ?? s.olusturma)}</dd></div>
            <div><dt className="text-white/40">Durum</dt><dd className="mt-0.5 text-white">{DURUM_AD[s.durum]}</dd></div>
            <div><dt className="text-white/40">Ödeme</dt><dd className="mt-0.5 text-white">{SAGLAYICI_AD[s.saglayici]}{s.taksit ? `, ${s.taksit} taksit` : ""}</dd></div>
            <div><dt className="text-white/40">Toplam</dt><dd className="mt-0.5 tabular-nums text-white">{paraYaz(s.tahsil ?? s.toplam, s.para)}</dd></div>
          </dl>
          <div className="rounded-[16px] bg-white p-5 text-[13px] text-[#111]">
            <div className="flex items-start justify-between border-b-2 border-[#111] pb-3">
              <div><p className="text-[18px] font-bold">Vayra</p><p className="text-[11.5px] text-[#666]">vayra.ai</p></div>
              <div className="text-right"><p className="font-semibold">Ödeme makbuzu</p><p className="text-[11.5px] text-[#666]">{tarihSaat(s.odemeZamani ?? s.olusturma)}</p></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div><p className="text-[11.5px] text-[#666]">Alıcı</p>{alici.filter(Boolean).map((x) => <p key={x}>{x}</p>)}{adres.map((x) => <p key={x}>{x}</p>)}</div>
              <div><p className="text-[11.5px] text-[#666]">Hesap</p><p className="break-all">{fb?.eposta || email}</p></div>
            </div>
            <div className="mt-4 flex justify-between gap-3 border-b border-[#ddd] py-2"><span>{s.ad}</span><span className="tabular-nums">{paraYaz(s.liste, s.para)}</span></div>
            {s.indirimler.map((x) => <div key={x.ad} className="flex justify-between gap-3 border-b border-[#eee] py-2 text-[#166534]"><span>{x.ad}</span><span className="tabular-nums">{paraYaz(x.tutar, s.para)} indirim</span></div>)}
            <div className="ml-auto mt-2 w-[64%] space-y-1 tabular-nums">
              <div className="flex justify-between"><span className="text-[#666]">Ara toplam</span><span>{paraYaz(s.net, s.para)}</span></div>
              {s.kdv > 0 && <div className="flex justify-between"><span className="text-[#666]">KDV, yüzde 20</span><span>{paraYaz(s.kdv, s.para)}</span></div>}
              <div className="flex justify-between border-t-2 border-[#111] pt-1.5 text-[15px] font-bold"><span>Toplam</span><span>{paraYaz(s.toplam, s.para)}</span></div>
            </div>
            <p className="mt-5 text-[10.5px] text-[#888]">Bu belge ödeme makbuzudur; mali değeri olan fatura yerine geçmez.{s.saglayici === "deneme" ? " Deneme ödemesi: para çekilmedi." : s.mod === "test" ? " Test ödemesi: para çekilmedi." : ""}</p>
          </div>
          {!fb && <p className="mt-3 text-[13px] text-white/45">Bu siparişte fatura bilgisi yoktu. <a href="#bilgi" onClick={onKapat} className="text-[#55d6fd] hover:underline">Fatura bilgilerini ekle</a>; sonraki ödemelerde kullanılır.</p>}
          {s.hata && <p className="mt-3 text-[13px] text-rose-300">{s.hata}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={onKapat} className={dugme.hayalet}>Kapat</button>
          <Link href={`/odeme/makbuz/${s.no}`} target="_blank" className={dugme.birincil}><Printer className="h-4 w-4" />Yazdır ya da PDF</Link>
        </div>
      </>
    );
  })();

  return createPortal(
    <AnimatePresence>
      {s && (
        <div className={cn("kesfet-tema fixed inset-0 z-[120]", kesfetFont.variable)} style={{ background: "transparent" }}>
          <motion.div className="perde absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onKapat} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Makbuz" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute inset-y-2 right-2 flex w-[calc(100%-16px)] max-w-[480px] flex-col overflow-hidden rounded-[28px] bg-[#161618] ring-1 ring-white/[0.09]">
            {icerik}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
