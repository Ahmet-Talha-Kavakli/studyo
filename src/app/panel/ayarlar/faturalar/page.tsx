"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronRight, Coins, CreditCard, Download, Gauge, Gift, Infinity as Sonsuz, Printer, RotateCcw, Search, Send, Ticket, Trophy, User, X } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { KDV_ORANI, type FaturaBilgisi, type Hareket, type HareketTur } from "@/store/useHesap";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Grup, KaydetCubugu, Satir, Sayfa, Segment, alan, dugme, akis } from "@/components/ayarlar/ui";
import { kesfetFont } from "@/components/kesfet/font";
import { tlKurus } from "@/lib/fiyat";
import { metinIndir } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

const TUR: Record<HareketTur, { ad: string; ikon: React.ElementType; renk: string }> = {
  kredi: { ad: "Kredi paketi", ikon: Coins, renk: "#f472b6" }, plan: { ad: "Abonelik", ikon: CreditCard, renk: "#55d6fd" },
  sinirsiz: { ad: "Sınırsız erişim", ikon: Sonsuz, renk: "#55d6fd" }, hiz: { ad: "Hız", ikon: Gauge, renk: "#a78bfa" },
  promo: { ad: "Promosyon", ikon: Ticket, renk: "#fbbf24" }, hediye: { ad: "Hediye kodu", ikon: Gift, renk: "#fbbf24" },
  odul: { ad: "Görev ödülü", ikon: Trophy, renk: "#34d399" }, iade: { ad: "İade", ikon: RotateCcw, renk: "#9ca3af" },
  "hediye-gonder": { ad: "Hediye gönderimi", ikon: Send, renk: "#a78bfa" },
};

/* Kimlik numarası doğrulama (resmî algoritmalar) */
function tcknGecerli(t: string) {
  if (!/^[1-9]\d{10}$/.test(t)) return false;
  const d = t.split("").map(Number);
  const tek = d[0] + d[2] + d[4] + d[6] + d[8], cift = d[1] + d[3] + d[5] + d[7];
  if ((((tek * 7 - cift) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}
function vknGecerli(v: string) {
  if (!/^\d{10}$/.test(v)) return false;
  const d = v.split("").map(Number);
  let top = 0;
  for (let i = 0; i < 9; i++) { const t = (d[i] + 9 - i) % 10; top += t === 9 ? 9 : (t * 2 ** (9 - i)) % 9; }
  return (10 - (top % 10)) % 10 === d[9];
}
const BOS: FaturaBilgisi = { tip: "bireysel", adSoyad: "", tckn: "", unvan: "", vkn: "", vergiDairesi: "", adres: "", il: "", ilce: "", postaKodu: "", eposta: "" };
const tarihSaat = (t: number) => new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const ayBasligi = (t: number) => new Date(t).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

function TurSimgesi({ tur, boyut = 36 }: { tur: HareketTur; boyut?: number }) {
  const T = TUR[tur];
  return <span className="flex shrink-0 items-center justify-center rounded-[10px]" style={{ width: boyut, height: boyut, background: `${T.renk}1c`, color: T.renk }}><T.ikon className="h-4 w-4" /></span>;
}

export default function Faturalar() {
  const { kayit } = useHesapKaydi();
  const [ara, setAra] = useState("");
  const [filtre, setFiltre] = useState<"tumu" | "odeme" | "kredi">("tumu");
  const [secili, setSecili] = useState<Hareket | null>(null);
  const odemeler = kayit.hareketler.filter((h) => h.tutar);
  const liste = useMemo(() => kayit.hareketler
    .filter((h) => (filtre === "tumu" || (filtre === "odeme" ? !!h.tutar : !h.tutar))
      && (!ara || `${h.aciklama} ${h.belgeNo ?? ""} ${TUR[h.tur].ad}`.toLocaleLowerCase("tr-TR").includes(ara.toLocaleLowerCase("tr-TR"))))
    .sort((a, b) => b.zaman - a.zaman), [kayit.hareketler, filtre, ara]);
  const gruplar = useMemo(() => { const m = new Map<string, Hareket[]>(); for (const h of liste) { const k = ayBasligi(h.zaman); m.set(k, [...(m.get(k) ?? []), h]); } return [...m.entries()]; }, [liste]);
  const yil = new Date().getFullYear();
  const buYil = odemeler.filter((h) => new Date(h.zaman).getFullYear() === yil).reduce((a, h) => a + h.tutar! + (h.kdv ?? 0), 0);
  const krediGelen = kayit.hareketler.filter((h) => h.kredi > 0).reduce((a, h) => a + h.kredi, 0);
  const sonOdeme = [...odemeler].sort((a, b) => b.zaman - a.zaman)[0];

  const csv = () => {
    const satir = (x: (string | number)[]) => x.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
    const icerik = "﻿" + [satir(["Tarih", "Belge no", "Tür", "Açıklama", "Kredi", "Tutar (KDV hariç)", "KDV", "Toplam"]),
      ...liste.map((h) => satir([new Date(h.zaman).toLocaleString("tr-TR"), h.belgeNo ?? "", TUR[h.tur].ad, h.aciklama, h.kredi, h.tutar?.toFixed(2) ?? "", h.kdv?.toFixed(2) ?? "", h.tutar ? (h.tutar + (h.kdv ?? 0)).toFixed(2) : ""]))].join("\r\n");
    if (metinIndir(icerik, `vayra-hareketler-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8")) toast.success("Hareketler indirildi", { description: `${liste.length} hareket CSV olarak kaydedildi.` });
    else mesaj.indirilemedi("Tarayıcı indirmeyi engelledi.");
  };

  const ozet = (
    <dl className="grid grid-cols-2 overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
      {[
        [`${yil} ödemeleri`, tlKurus(buYil), "KDV dahil"],
        ["Makbuz", String(odemeler.length), "ödemeli işlem"],
        ["Eklenen kredi", krediGelen.toLocaleString("tr-TR"), "paket, kod ve ödüller"],
        ["Son ödeme", sonOdeme ? new Date(sonOdeme.zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "Yok", sonOdeme ? tlKurus(sonOdeme.tutar! + (sonOdeme.kdv ?? 0)) : "henüz ödeme yok"],
      ].map(([e, d, a], i) => (
        <motion.div key={e} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: akis }}
          className={cn("border-white/[0.06] px-5 py-4", i % 2 === 1 && "border-l", i > 1 && "border-t")}>
          <dt className="text-[12.5px] text-white/45">{e}</dt>
          <dd className="mt-1 truncate text-[20px] font-semibold tracking-[-0.02em] tabular-nums text-white">{d}</dd>
          <dd className="truncate text-[12px] text-white/35">{a}</dd>
        </motion.div>
      ))}
    </dl>
  );

  return (
    <Sayfa baslik="Faturalar" aciklama="Ödemelerinin makbuzları, kredi hareketlerin ve faturada görünecek bilgiler." yan={ozet}
      sag={kayit.hareketler.length > 0 && <button type="button" onClick={csv} className={cn(dugme.hayalet, "h-8 text-[13px]")}><Download className="h-3.5 w-3.5" />CSV</button>}>
      <Grup id="makbuzlar" baslik="Hareketler" aciklama="Makbuzlu satıra tıkla; önizle, yazdır ya da PDF olarak kaydet."
        sag={kayit.hareketler.length > 0 && <Segment kucuk kayit={false} deger={filtre} onSec={setFiltre} secenekler={[{ deger: "tumu", ad: "Tümü" }, { deger: "odeme", ad: "Ödemeler" }, { deger: "kredi", ad: "Ücretsiz" }]} />}
        alt={kayit.hareketler.length > 0 ? <><span>{kayit.hareketler.length} hareketten {liste.length} tanesi</span><span>Tutarlar KDV dahil</span></> : undefined}>
        {kayit.hareketler.length === 0 ? (
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
                <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Açıklama ya da belge numarası ara" aria-label="Hareketlerde ara" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/35" />
                {ara && <button type="button" onClick={() => setAra("")} aria-label="Temizle" className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
              </label>
            </div>
            {gruplar.map(([ay, hs]) => (
              <div key={ay}>
                <p className="px-6 pb-1 pt-3 text-[12.5px] font-medium text-white/40">{ay}</p>
                {hs.map((h) => {
                  const T = TUR[h.tur];
                  const Kap = h.belgeNo ? "button" : "div";
                  return (
                    <Kap key={h.id} {...(h.belgeNo ? { type: "button" as const, onClick: () => setSecili(h), "aria-label": `${h.aciklama} makbuzu` } : {})}
                      className={cn("group flex w-full items-center gap-3.5 px-6 py-3 text-left transition-colors", h.belgeNo && "hover:bg-white/[0.025]")}>
                      <TurSimgesi tur={h.tur} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-white">{h.aciklama}</span>
                        <span className="block truncate text-[12.5px] text-white/40">{new Date(h.zaman).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · {T.ad}{h.belgeNo && <span className="sc-kod"> · {h.belgeNo}</span>}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[14px] font-medium tabular-nums text-white">{h.tutar ? tlKurus(h.tutar + (h.kdv ?? 0)) : <span className="font-normal text-white/40">Ücretsiz</span>}</span>
                        <span className={cn("block text-[12.5px] tabular-nums", h.kredi > 0 ? "text-emerald-300" : h.kredi < 0 ? "text-rose-300" : "text-white/35")}>{h.kredi ? `${h.kredi > 0 ? "+" : ""}${h.kredi.toLocaleString("tr-TR")} kredi` : ""}</span>
                      </span>
                      {h.belgeNo ? <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" /> : <span className="w-4 shrink-0" />}
                    </Kap>
                  );
                })}
              </div>
            ))}
            {!liste.length && <p className="px-6 py-8 text-center text-[14px] text-white/45">Eşleşen hareket yok.</p>}
          </>
        )}
      </Grup>

      <FaturaBilgileri />
      <MakbuzCekmecesi hareket={secili} onKapat={() => setSecili(null)} />
    </Sayfa>
  );
}

function FaturaBilgileri() {
  const { kayit, guncelle } = useHesapKaydi();
  const email = useAuth((s) => s.kullanici?.email ?? "");
  const kayitli = useMemo(() => kayit.fatura ?? { ...BOS, eposta: email }, [kayit.fatura, email]);
  const [f, setF] = useState<FaturaBilgisi>(kayitli);
  const degisti = (Object.keys(f) as (keyof FaturaBilgisi)[]).some((k) => f[k] !== kayitli[k]);
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

  /* Form ızgarası: etiket üstte, alan altında, ipucu ya da hata en altta (satır düzeninde alanlar etiketin
     altına kayıp büyük boşluk bırakıyordu). */
  const satir = (k: keyof FaturaBilgisi, ad: string, ek?: { sayisal?: number; ipucu?: string; otomatik?: string; yer?: string; genis?: boolean }) => (
    <label key={k} id={`fatura-${k}`} className={cn("block min-w-0 scroll-mt-28", ek?.genis && "sm:col-span-2")}>
      <span className="mb-1.5 block text-[13px] font-medium text-white/80">{ad}</span>
      <input value={f[k]} autoComplete={ek?.otomatik} placeholder={ek?.yer}
        onChange={(e) => ayarla(k, ek?.sayisal ? e.target.value.replace(/\D/g, "").slice(0, ek.sayisal) : e.target.value)}
        inputMode={ek?.sayisal ? "numeric" : undefined} className={cn(alan, h[k] && "ring-rose-500/60")} />
      {(h[k] || ek?.ipucu) && <span className={cn("mt-1.5 block text-[12.5px]", h[k] ? "text-rose-300" : "text-white/45")}>{h[k] ?? ek?.ipucu}</span>}
    </label>
  );

  return (
    <Grup id="bilgi" baslik="Fatura bilgileri" aciklama="Makbuzlarında ve e-faturalarda görünür."
      alt="Kimlik ve vergi numaraları resmî algoritmayla doğrulanır; yalnız bu hesapta saklanır. Makbuzlar mali değeri olan e-Arşiv faturanın yerine geçmez.">
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
        {satir("eposta", "Fatura e-postası", { otomatik: "email", ipucu: "Makbuz ve faturalar bu adrese gönderilir.", yer: "ad@alanadi.com" })}
      </div>
      <KaydetCubugu gorunur={degisti} onSifirla={() => setF(kayitli)} hata={hataSay ? `${hataSay} alanı düzelt` : null}
        onKaydet={() => { guncelle((x) => ({ ...x, fatura: f })); toast.success("Fatura bilgileri kaydedildi", { description: "Sonraki makbuzlarda kullanılacak." }); }} />
    </Grup>
  );
}

/** Sağdan açılan makbuz önizlemesi; yazdır ya da PDF olarak kaydet. */
function MakbuzCekmecesi({ hareket: h, onKapat }: { hareket: Hareket | null; onKapat: () => void }) {
  const { kayit, email } = useHesapKaydi();
  const ad = useAuth((s) => s.kullanici?.ad ?? "");
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    if (!h) return;
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    addEventListener("keydown", tus); return () => removeEventListener("keydown", tus);
  }, [h, onKapat]);
  if (!hazir) return null;

  const icerik = h && (() => {
    const fb = kayit.fatura;
    const kdv = h.kdv ?? Math.round((h.tutar ?? 0) * KDV_ORANI);
    const toplam = (h.tutar ?? 0) + kdv;
    const alici = fb ? (fb.tip === "kurumsal" ? [fb.unvan, `VKN ${fb.vkn}, ${fb.vergiDairesi} V.D.`] : [fb.adSoyad, fb.tckn ? `TCKN ${fb.tckn.slice(0, 3)}•••••${fb.tckn.slice(-3)}` : ""]) : [ad, email];
    const adres = fb ? [fb.adres, [fb.ilce, fb.il, fb.postaKodu].filter(Boolean).join(" ")].filter(Boolean) : [];
    const yazdir = () => {
      const w = window.open("", "_blank", "width=720,height=900");
      if (!w) return mesaj.acilirPencereEngellendi();
      const e = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
      w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${e(h.belgeNo!)}</title><style>
        body{font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#111;margin:48px;max-width:640px}
        h1{font-size:22px;margin:0}.k{color:#666;font-size:12px}.ust{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px}
        .iki{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:24px 0}table{width:100%;border-collapse:collapse;margin-top:8px}
        td,th{padding:10px 0;border-bottom:1px solid #ddd;text-align:left}th{font-size:12px;color:#666;font-weight:600}.r{text-align:right}
        .t td{border:0;padding:4px 0}.top td{font-weight:700;font-size:16px;border-top:2px solid #111;padding-top:10px}</style></head><body>
        <div class="ust"><div><h1>Vayra</h1><div class="k">Vayra Teknoloji A.Ş. · vayra.ai</div></div><div style="text-align:right"><b>Ödeme makbuzu</b><div class="k">${e(h.belgeNo!)}</div><div class="k">${e(tarihSaat(h.zaman))}</div></div></div>
        <div class="iki"><div><div class="k">Alıcı</div>${alici.filter(Boolean).map((x) => `<div>${e(x)}</div>`).join("")}${adres.map((x) => `<div>${e(x)}</div>`).join("")}</div>
        <div><div class="k">Hesap</div><div>${e(email)}</div></div></div>
        <table><tr><th>Açıklama</th><th class="r">Kredi</th><th class="r">Tutar</th></tr><tr><td>${e(h.aciklama)}</td><td class="r">${h.kredi ? h.kredi.toLocaleString("tr-TR") : ""}</td><td class="r">${tlKurus(h.tutar ?? 0)}</td></tr></table>
        <table class="t" style="margin-top:16px;width:50%;margin-left:auto"><tr><td>Ara toplam</td><td class="r">${tlKurus(h.tutar ?? 0)}</td></tr><tr><td>KDV (%${KDV_ORANI * 100})</td><td class="r">${tlKurus(kdv)}</td></tr><tr class="top"><td>Toplam</td><td class="r">${tlKurus(toplam)}</td></tr></table>
        <p class="k" style="margin-top:48px">Bu belge ödeme makbuzudur; mali değeri olan fatura yerine geçmez.</p>
        <script>window.onload=()=>{window.print()}<\/script></body></html>`);
      w.document.close();
    };
    return (
      <>
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <TurSimgesi tur={h.tur} boyut={40} />
            <div className="min-w-0"><h2 className="truncate text-[18px] font-semibold text-white">Makbuz</h2><p className="sc-kod truncate text-[12.5px] text-white/40">{h.belgeNo}</p></div>
          </div>
          <button type="button" onClick={onKapat} aria-label="Kapat" className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[16px] bg-white/[0.03] p-4 text-[13px]">
            <div><dt className="text-white/40">Tarih</dt><dd className="mt-0.5 text-white">{tarihSaat(h.zaman)}</dd></div>
            <div><dt className="text-white/40">Tür</dt><dd className="mt-0.5 text-white">{TUR[h.tur].ad}</dd></div>
            <div><dt className="text-white/40">Kredi</dt><dd className="mt-0.5 tabular-nums text-white">{h.kredi ? `${h.kredi > 0 ? "+" : ""}${h.kredi.toLocaleString("tr-TR")}` : "Yok"}</dd></div>
            <div><dt className="text-white/40">Toplam</dt><dd className="mt-0.5 tabular-nums text-white">{tlKurus(toplam)}</dd></div>
          </dl>
          <div className="rounded-[16px] bg-white p-5 text-[13px] text-[#111]">
            <div className="flex items-start justify-between border-b-2 border-[#111] pb-3">
              <div><p className="text-[18px] font-bold">Vayra</p><p className="text-[11.5px] text-[#666]">Vayra Teknoloji A.Ş.</p></div>
              <div className="text-right"><p className="font-semibold">Ödeme makbuzu</p><p className="text-[11.5px] text-[#666]">{tarihSaat(h.zaman)}</p></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div><p className="text-[11.5px] text-[#666]">Alıcı</p>{alici.filter(Boolean).map((x) => <p key={x}>{x}</p>)}{adres.map((x) => <p key={x}>{x}</p>)}</div>
              <div><p className="text-[11.5px] text-[#666]">Hesap</p><p className="break-all">{email}</p></div>
            </div>
            <div className="mt-4 flex justify-between gap-3 border-b border-[#ddd] py-2"><span>{h.aciklama}</span><span className="tabular-nums">{tlKurus(h.tutar ?? 0)}</span></div>
            <div className="ml-auto mt-2 w-[64%] space-y-1 tabular-nums">
              <div className="flex justify-between"><span className="text-[#666]">Ara toplam</span><span>{tlKurus(h.tutar ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#666]">KDV (%{KDV_ORANI * 100})</span><span>{tlKurus(kdv)}</span></div>
              <div className="flex justify-between border-t-2 border-[#111] pt-1.5 text-[15px] font-bold"><span>Toplam</span><span>{tlKurus(toplam)}</span></div>
            </div>
            <p className="mt-5 text-[10.5px] text-[#888]">Bu belge ödeme makbuzudur; mali değeri olan fatura yerine geçmez.</p>
          </div>
          {!fb && <p className="mt-3 text-[13px] text-white/45">Makbuzda adın ve e-postan görünüyor. <a href="#bilgi" onClick={onKapat} className="text-[#55d6fd] hover:underline">Fatura bilgilerini ekle</a>; sonraki makbuzlarda onlar kullanılır.</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
          <button type="button" onClick={onKapat} className={dugme.hayalet}>Kapat</button>
          <button type="button" onClick={yazdir} className={dugme.birincil}><Printer className="h-4 w-4" />Yazdır ya da PDF</button>
        </div>
      </>
    );
  })();

  return createPortal(
    <AnimatePresence>
      {h && (
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

