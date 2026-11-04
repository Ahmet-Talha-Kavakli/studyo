"use client";

/**
 * Earn › Cüzdan parçaları (2026-10-29, seçilen "C · Kart cüzdanı"):
 * Apple Wallet usulü kart destesi (Earn bakiyesi + Papara + banka hesapları), kimlik ve çekim formları,
 * ödeme yöntemi penceresi, aylara göre gruplu hareketler ve ödeme takvimi.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, BadgeCheck, Check, Clock, Gift, Link2, Loader2, Plus, ShieldCheck, Store, Wallet, X } from "lucide-react";
import { useEarn, cuzdan, cekimDurum, gonderiHesap, type Kimlik, type OdemeYontemi } from "@/store/useEarn";
import { useAuth } from "@/store/useAuth";
import { tl, KURALLAR } from "@/lib/earn/kampanyalar";
import { ibanGecerli, paparaGecerli, tcknGecerli } from "@/lib/earn/dogrulama";
import { cekimIstek, kimlikIstek } from "@/lib/earn/istemci";
import { bildir } from "@/lib/bildirimler";
import { BANKALAR, Bolum, OdemeLogo, OrnekRozet, bankaBul, birincil, ease, ikincil, maskele, yay, yuzey } from "./ui";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";

const AY = 30 * 86_400_000;
const tarihFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
const ayFmt = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
/** Seviyeye göre ayda ücretsiz çekim hakkı (Infinity = sınırsız). */
const UCRETSIZ_HAK: Record<string, number> = { baslangic: 1, yukselen: 2, profesyonel: Infinity, elit: Infinity };
const sonDort = (d: string) => d.replace(/\s/g, "").slice(-4);

/** Çekim ücreti ve ücretsiz hak metni (seviyeye ve bu ayki çekimlere göre). */
export function useCekimUcreti(simdi: number) {
  const s = useEarn();
  const c = cuzdan(s, simdi);
  const buAy = s.cekimler.filter((x) => x.tarih > simdi - AY && cekimDurum(x, simdi) !== "basarisiz").length;
  const hak = UCRETSIZ_HAK[c.seviye.id] ?? 0;
  return {
    ucret: buAy < hak ? 0 : KURALLAR.cekimUcreti,
    hakMetni: hak === Infinity ? `${c.seviye.ad} seviyesinde çekimler ücretsiz` : `Bu ay ${Math.max(0, hak - buAy)}/${hak} ücretsiz çekim hakkın kaldı`,
  };
}

/* ═════════ Kart destesi ═════════ */
export type Kart = { id: string; tur: "earn" | "iban" | "papara"; yontem?: OdemeYontemi; ekle?: boolean };
const KART_Y = 216;
const SERIT = 60;

export function KartDestesi({ kartlar, secili, sec, c }: { kartlar: Kart[]; secili: string; sec: (id: string) => void; c: ReturnType<typeof cuzdan> }) {
  // Seçili kart en önde (en altta) tam görünür; diğerleri üstte şerit olarak dizilir.
  const sira = [...kartlar.filter((k) => k.id !== secili), kartlar.find((k) => k.id === secili) ?? kartlar[0]];
  const i = kartlar.findIndex((k) => k.id === secili);
  const tus = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); sec(kartlar[(i + 1) % kartlar.length].id); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); sec(kartlar[(i - 1 + kartlar.length) % kartlar.length].id); }
  };
  return (
    <div role="listbox" aria-label="Kartların" tabIndex={-1} onKeyDown={tus} className="relative" style={{ height: KART_Y + (sira.length - 1) * SERIT }}>
      {sira.map((k, j) => {
        const on = j === sira.length - 1;
        return (
          <motion.button key={k.id} role="option" aria-selected={on} onClick={() => sec(k.id)} initial={false}
            animate={{ y: j * SERIT, scale: on ? 1 : 0.94 + (j / sira.length) * 0.05 }} transition={yay}
            whileHover={on ? undefined : { y: j * SERIT - 8 }}
            className="absolute inset-x-0 top-0 rounded-[24px] text-left outline-none focus-visible:ring-2 focus-visible:ring-white/70" style={{ height: KART_Y, zIndex: j }}>
            <KartYuzu k={k} c={c} />
          </motion.button>
        );
      })}
    </div>
  );
}

function KartYuzu({ k, c }: { k: Kart; c: ReturnType<typeof cuzdan> }) {
  if (k.tur === "earn") return (
    <div className="relative h-full overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#6fe0ff_0%,#2bb5e0_48%,#8f9cff_100%)] p-5 text-[#05222b] ring-1 ring-white/20">
      <span className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/35 blur-2xl" aria-hidden />
      <span className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-[#05222b]/15 blur-2xl" aria-hidden />
      <div className="relative flex h-7 items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-semibold"><Wallet className="h-4 w-4" />Vayra Earn</span>
        <span className="text-[14px] font-semibold tabular-nums">{tl(c.cekilebilir, true)}</span>
      </div>
      <div className="relative mt-9">
        <p className="text-[12.5px] font-semibold opacity-60">Çekilebilir</p>
        <p className="text-[38px] font-bold leading-none tabular-nums tracking-[-0.045em]">{tl(c.cekilebilir, true)}</p>
      </div>
      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between text-[12.5px] font-semibold">
        <span className="opacity-70">Bekleyen {tl(c.bekleyen)}</span>
        <span className="rounded-full bg-[#05222b]/10 px-2.5 py-0.5">{c.seviye.ad}</span>
      </div>
    </div>
  );
  const y = k.yontem;
  if (k.tur === "papara") return (
    <div className="relative h-full overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#e04a5a_0%,#b8357a_55%,#7f2a8f_100%)] p-5 text-white ring-1 ring-white/[0.14]">
      <span className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/[0.14] blur-2xl" aria-hidden />
      <div className="relative flex h-7 items-center justify-between">
        <span className="flex h-7 items-center rounded-[8px] bg-white px-2.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/papara.png" alt="Papara" className="h-[13px]" /></span>
        <span className="text-[14px] font-semibold tabular-nums">{y ? `•••• ${sonDort(y.deger)}` : <Plus className="h-4 w-4" />}</span>
      </div>
      <div className="relative mt-9">
        <p className="text-[12.5px] font-medium opacity-70">{y ? "Papara hesabı" : "Henüz eklenmedi"}</p>
        <p className="text-[22px] font-semibold tabular-nums tracking-[0.04em]">{y ? maskele(y.deger) : "Papara ekle"}</p>
      </div>
      <p className="absolute inset-x-5 bottom-4 flex items-center justify-between text-[12.5px] font-medium opacity-80"><span className="truncate">{y ? y.ad.replace(/^Papara · /, "") : "Çekimler birkaç dakikada"}</span><span className="shrink-0">Anında</span></p>
    </div>
  );
  const b = y ? bankaBul(y.deger) : null;
  return (
    <div className={cn("relative h-full overflow-hidden rounded-[24px] p-5 text-white ring-1", y ? "bg-[linear-gradient(140deg,#2a2c33_0%,#17181d_60%,#0f1013_100%)] ring-white/[0.12]" : "bg-[#121317] ring-white/[0.1]")}>
      <span className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/[0.06] blur-2xl" aria-hidden />
      <div className="relative flex h-7 items-center justify-between">
        {y ? (b ? <span className="flex h-7 w-[84px] items-center justify-center rounded-[8px] bg-white px-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={b.logo} alt={b.ad} className="max-h-[62%] w-full object-contain" /></span> : <OdemeLogo tur="iban" deger={y.deger} boyut="sm" />) : <span className="flex gap-1">{Object.entries(BANKALAR).slice(0, 4).map(([kod, x]) => <span key={kod} className="flex h-7 w-[52px] items-center justify-center rounded-[7px] bg-white px-1.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={x.logo} alt={x.ad} className="max-h-[60%] w-full object-contain" /></span>)}</span>}
        <span className="text-[14px] font-semibold tabular-nums">{y ? `•••• ${sonDort(y.deger)}` : <Plus className="h-4 w-4" />}</span>
      </div>
      <div className="relative mt-9">
        <p className="text-[12.5px] font-medium text-white/55">{y ? b?.ad ?? "Banka hesabı" : "Henüz eklenmedi"}</p>
        <p className="text-[22px] font-semibold tabular-nums tracking-[0.04em]">{y ? maskele(y.deger) : "Banka hesabı ekle"}</p>
      </div>
      <p className="absolute inset-x-5 bottom-4 flex items-center justify-between text-[12.5px] font-medium text-white/60"><span className="truncate">{y ? y.ad.replace(/^.* · /, "") : "IBAN ile, banka otomatik tanınır"}</span><span className="shrink-0">1 iş günü</span></p>
    </div>
  );
}

/* ═════════ Kimlik ═════════ */
const satirGirdi = "h-12 min-w-0 flex-1 bg-transparent text-right text-[14.5px] text-white outline-none placeholder:text-white/30";

export function KimlikFormu() {
  const kaydet = useEarn((s) => s.kimlikKaydet);
  const adSoyad = useAuth((s) => s.kullanici?.ad ?? "");
  const [ad, setAd] = useState(adSoyad.split(" ").slice(0, -1).join(" ") || adSoyad);
  const [soyad, setSoyad] = useState(adSoyad.split(" ").length > 1 ? adSoyad.split(" ").pop()! : "");
  const [tckn, setTckn] = useState("");
  const [yil, setYil] = useState("");
  const [bekle, setBekle] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const yilN = Number(yil);
  const yasOk = yilN > 1900 && new Date().getFullYear() - yilN >= 18;
  const tcknHata = tckn.length === 11 && !tcknGecerli(tckn) ? "Geçersiz T.C. kimlik numarası." : null;
  const yasHata = yil.length === 4 && !yasOk ? "Ödeme alabilmek için 18 yaşından büyük olmalısın." : null;
  const hazir = ad.trim().length >= 2 && soyad.trim().length >= 2 && tcknGecerli(tckn) && yasOk && !bekle;

  const gonder = async () => {
    setBekle(true); setHata(null);
    const r = await kimlikIstek(tckn, ad, soyad, yilN);
    setBekle(false);
    if (!r.ok) return setHata(r.hata ?? "Doğrulama yapılamadı.");
    if (r.gercek && !r.dogru) return setHata("Bilgiler Nüfus ve Vatandaşlık İşleri kayıtlarıyla eşleşmedi. Ad, soyad ve doğum yılını kimliğindeki gibi yaz.");
    kaydet({ ad: ad.trim(), soyad: soyad.trim(), tckn, dogumYili: yilN, gercek: !!r.gercek, tarih: Date.now() });
    toast.success("Kimliğin doğrulandı", { description: r.gercek ? "Bilgilerin nüfus kayıtlarıyla eşleşti." : "Biçim doğru; ilk çekimde ekibimiz ayrıca kontrol edecek." });
  };

  const satir = (etiket: string, ic: React.ReactNode, ok?: boolean) => (
    <label className="flex items-center gap-3 px-4">
      <span className="w-[112px] shrink-0 text-[13.5px] text-white/60">{etiket}</span>
      {ic}
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition", ok ? "bg-[#55d6fd] text-[#06222b]" : "bg-white/[0.06]")}>{ok && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}</span>
    </label>
  );

  return (
    <div>
      <p className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-white/60"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8fe6ff]" />Yasal zorunluluk: ilk çekimden önce kimliğini bir kez doğrula. 18 yaşından büyük olmalısın.</p>
      <div className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-black/25 ring-1 ring-white/[0.08]">
        {satir("Ad", <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Adın" aria-label="Ad" className={satirGirdi} />, ad.trim().length >= 2)}
        {satir("Soyad", <input value={soyad} onChange={(e) => setSoyad(e.target.value)} placeholder="Soyadın" aria-label="Soyad" className={satirGirdi} />, soyad.trim().length >= 2)}
        {satir("T.C. kimlik no", <input value={tckn} onChange={(e) => setTckn(e.target.value.replace(/\D/g, "").slice(0, 11))} inputMode="numeric" placeholder="11 hane" aria-label="T.C. kimlik numarası" className={cn(satirGirdi, "tabular-nums tracking-[0.04em]")} />, tcknGecerli(tckn))}
        {satir("Doğum yılı", <input value={yil} onChange={(e) => setYil(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="Örneğin 1998" aria-label="Doğum yılı" className={cn(satirGirdi, "tabular-nums")} />, yasOk)}
      </div>
      <AnimatePresence>
        {(tcknHata || yasHata || hata) && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2.5 flex gap-1.5 overflow-hidden text-[12.5px] leading-snug text-rose-300">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />{hata ?? tcknHata ?? yasHata}
          </motion.p>
        )}
      </AnimatePresence>
      <button disabled={!hazir} onClick={gonder} className={cn(birincil, "mt-4 w-full")}>{bekle ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kimliğimi doğrula"}</button>
      <p className="mt-3 text-center text-[12px] leading-relaxed text-white/45">Bilgilerin yalnız kimlik doğrulama ve yasal bildirim için kullanılır.</p>
    </div>
  );
}

/* ═════════ Çekim ═════════ */
export function CekimFormu({ cekilebilir, ucret, hakMetni, kimlik, onerilen, yontemEkle }: { cekilebilir: number; ucret: number; hakMetni: string; kimlik: Kimlik; onerilen?: string | null; yontemEkle: () => void }) {
  const { odemeYontemleri, cekimEkle, cekimGuncelle } = useEarn();
  const [tutar, setTutar] = useState("");
  const [yontem, setYontem] = useState(onerilen ?? odemeYontemleri[0]?.id ?? "");
  const [bekle, setBekle] = useState(false);
  useEffect(() => { if (onerilen) setYontem(onerilen); }, [onerilen]);
  useEffect(() => { if (!odemeYontemleri.some((y) => y.id === yontem)) setYontem(odemeYontemleri[0]?.id ?? ""); }, [odemeYontemleri, yontem]);
  const n = Number(tutar.replace(/\./g, "").replace(",", "."));
  const hata = !tutar ? null : !Number.isFinite(n) || n <= 0 ? "Geçerli bir tutar gir." : n < KURALLAR.minCekim ? `En az ${tl(KURALLAR.minCekim)} çekebilirsin.` : n + ucret > cekilebilir ? "Bakiyen yetersiz (işlem ücreti dahil)." : null;
  const secili = odemeYontemleri.find((y) => y.id === yontem) ?? odemeYontemleri[0];
  const hazir = !!tutar && !hata && !!secili && !bekle;
  const enCok = Math.max(0, Math.floor((cekilebilir - ucret) * 100) / 100);
  const yetersiz = enCok < KURALLAR.minCekim;

  const cek = async () => {
    if (!hazir || !secili) return;
    setBekle(true);
    const tutarN = Math.round(n * 100) / 100;
    const referans = `VYR${Date.now().toString(36).toUpperCase()}`;
    const r = await cekimIstek({ tur: secili.tur, hesapNo: secili.deger.replace(/\s/g, ""), tutar: tutarN, referans, tckn: kimlik.tckn });
    if (!r.ok) {
      setBekle(false);
      toast.error("Çekim talebi oluşturulamadı", { description: r.hata ?? "Ödeme sağlayıcısı yanıt vermedi. Biraz sonra yeniden dene." });
      return;
    }
    const id = cekimEkle({ tutar: tutarN, ucret, yontemId: secili.id, yontemAd: secili.ad, referans: r.referans ?? referans, gercek: !!r.gercek });
    if (r.gercek) {
      // Papara: sonuç anında belli
      cekimGuncelle(id, { durum: "odendi" });
      useEarn.getState().bildirildi(`${id}:odendi`); // gözcü aynı olayı tekrar bildirmesin
      bildir({ kategori: "hesap", tur: "basari", baslik: `${tl(tutarN, true)} Papara hesabına gönderildi`, mesaj: `${secili.ad} · Referans ${r.referans ?? referans}`, link: "/earn/cuzdan" });
    }
    setBekle(false); setTutar("");
    toast.success("Çekim talebin alındı", { description: r.gercek ? `${tl(tutarN, true)} ${secili.ad} hesabına gönderildi.` : `${tl(tutarN, true)} 1 iş günü içinde ${secili.ad} hesabına geçecek.` });
  };

  return (
    <div>
      <p className="flex items-center gap-1.5 text-[12.5px] text-white/55"><BadgeCheck className="h-3.5 w-3.5 text-[#8fe6ff]" />{kimlik.ad} {kimlik.soyad} adına doğrulandı</p>
      {/* Dev rakamlı tutar */}
      <div className={cn("mt-3 rounded-[20px] bg-black/25 px-5 pb-4 pt-3 ring-1 transition focus-within:ring-white/25", hata ? "ring-rose-400/40" : "ring-white/[0.08]")}>
        <div className="flex items-center justify-between text-[12.5px] text-white/50"><span>Tutar</span>
          <button onClick={() => setTutar(String(enCok).replace(".", ","))} disabled={yetersiz} className="rounded-full bg-white/[0.08] px-3 py-1 font-medium text-white transition hover:bg-white/[0.14] active:scale-95 disabled:opacity-35">Tümü</button>
        </div>
        <label className="mt-1 flex items-baseline gap-1">
          <span className={cn("text-[40px] font-semibold leading-none tracking-[-0.04em] transition-colors", tutar ? "text-white" : "text-white/25")}>₺</span>
          <input inputMode="decimal" value={tutar} onChange={(e) => setTutar(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0" aria-label="Tutar"
            className="h-14 min-w-0 flex-1 bg-transparent text-[48px] font-semibold leading-none tabular-nums tracking-[-0.045em] text-white outline-none placeholder:text-white/20" />
        </label>
      </div>
      <p className={cn("mt-2 text-[12.5px]", hata ? "text-rose-300" : "text-white/45")}>{hata ?? (yetersiz ? `Çekim için en az ${tl(KURALLAR.minCekim)} çekilebilir bakiye gerekir.` : `En çok ${tl(enCok, true)} çekebilirsin.`)}</p>

      <p className="mt-5 text-[13px] text-white/60">Nereye</p>
      {odemeYontemleri.length ? (
        <LayoutGroup id="cekim-yontem">
          <div className="mt-2 space-y-1.5">
            {odemeYontemleri.map((y) => {
              const a = secili?.id === y.id;
              return (
                <button key={y.id} onClick={() => setYontem(y.id)} aria-pressed={a} className="relative flex w-full items-center gap-3 rounded-[16px] p-2 pr-3.5 text-left transition active:scale-[0.99]">
                  {a ? <motion.span layoutId="cekim-yontem-z" className="absolute inset-0 rounded-[16px] bg-white/[0.07] ring-1 ring-white/[0.18]" transition={yay} /> : <span className="absolute inset-0 rounded-[16px] ring-1 ring-white/[0.06]" />}
                  <span className="relative"><OdemeLogo tur={y.tur} deger={y.deger} /></span>
                  <span className="relative min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-white">{y.ad}</span><span className="block truncate text-[12.5px] tabular-nums text-white/50">{maskele(y.deger)} · {y.tur === "papara" ? "anında" : "1 iş günü"}</span></span>
                  <span className={cn("relative flex h-5 w-5 items-center justify-center rounded-full transition", a ? "bg-white text-black" : "ring-1 ring-white/25")}>{a && <Check className="h-3 w-3" strokeWidth={3.5} />}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      ) : (
        <button onClick={yontemEkle} className="mt-2 flex w-full items-center gap-3 rounded-[16px] p-2 pr-3.5 text-left ring-1 ring-white/[0.08] transition hover:bg-white/[0.04]">
          <span className="flex h-10 w-16 items-center justify-center rounded-[11px] bg-white/[0.06]"><Plus className="h-4 w-4 text-white" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-medium text-white">Ödeme yöntemi ekle</span><span className="block text-[12.5px] text-white/50">IBAN ya da Papara</span></span>
          <OdemeLogo tur="papara" boyut="sm" />
        </button>
      )}

      <dl className="mt-4 divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.025] px-4 text-[13.5px] ring-1 ring-white/[0.06]">
        <div className="flex justify-between py-2.5"><dt className="text-white/55">İşlem ücreti</dt><dd className="tabular-nums text-white">{ucret ? tl(ucret) : "Ücretsiz"}</dd></div>
        <div className="flex justify-between py-2.5"><dt className="text-white/55">Hesabına geçecek</dt><dd className="font-semibold tabular-nums text-white">{tl(hazir ? n : 0, true)}</dd></div>
      </dl>
      <button disabled={!hazir} onClick={cek} className={cn(birincil, "mt-4 w-full")}>{bekle ? <Loader2 className="h-4 w-4 animate-spin" /> : yetersiz ? `${tl(KURALLAR.minCekim)} birikince çekebilirsin` : "Çekim talebi oluştur"}</button>
      <p className="mt-3 text-center text-[12px] text-white/45">{hakMetni}</p>
    </div>
  );
}

/* ═════════ Ödeme yöntemi penceresi ═════════ */
export function YontemPenceresi({ kimlik, kapat, baslangic = "papara" }: { kimlik: Kimlik | null; kapat: () => void; baslangic?: "iban" | "papara" }) {
  const yontemEkle = useEarn((s) => s.yontemEkle);
  const [tur, setTur] = useState<"iban" | "papara">(baslangic);
  const [banka, setBanka] = useState("");
  const [deger, setDeger] = useState("");
  const temiz = deger.replace(/\s/g, "").toUpperCase();
  const tam = tur === "iban" ? temiz.length === 26 : temiz.length === 10;
  const gecerli = tur === "iban" ? ibanGecerli(temiz) : paparaGecerli(temiz);
  const taninan = tur === "iban" ? bankaBul(temiz) : null;
  const sahip = kimlik ? `${kimlik.ad} ${kimlik.soyad}` : "";
  const iban = (v: string) => v.replace(/\s/g, "").toUpperCase().slice(0, 26).replace(/(.{4})/g, "$1 ").trim();
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === "Escape" && kapat(); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [kapat]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="perde kesfet-tema earn-kapsam fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <motion.div initial={{ y: 24, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.25, ease }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Ödeme yöntemi ekle" className="w-full max-w-[480px] rounded-t-[28px] bg-[#141518] p-6 ring-1 ring-white/[0.1] sm:rounded-[28px]">
        <div className="flex items-center justify-between"><h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Ödeme yöntemi ekle</h2><button onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button></div>
        <LayoutGroup id="yt-tur">
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(["papara", "iban"] as const).map((t) => (
              <button key={t} type="button" onClick={() => { setTur(t); setDeger(""); }} aria-pressed={tur === t}
                className={cn("relative flex flex-col items-start gap-3 rounded-[18px] p-3.5 text-left ring-1 transition active:scale-[0.98]", tur === t ? "bg-white/[0.07] ring-white/[0.3]" : "ring-white/[0.08] hover:ring-white/[0.16]")}>
                {t === "papara" ? <OdemeLogo tur="papara" /> : (
                  <span className="flex h-10 gap-1">{Object.entries(BANKALAR).slice(0, 3).map(([kod, x]) => <span key={kod} className="flex h-10 w-12 items-center justify-center rounded-[10px] bg-white px-1.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={x.logo} alt={x.ad} className="max-h-[55%] w-full object-contain" /></span>)}</span>
                )}
                <span><span className="block text-[14px] font-medium text-white">{t === "papara" ? "Papara" : "Banka (IBAN)"}</span><span className="text-[12px] text-white/50">{t === "papara" ? "Anında aktarım" : "1 iş günü içinde"}</span></span>
                {tur === t && <motion.span layoutId="yt-tik" className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black" transition={yay}><Check className="h-3 w-3" strokeWidth={3.5} /></motion.span>}
              </button>
            ))}
          </div>
        </LayoutGroup>
        <form className="mt-5 space-y-3" onSubmit={(e) => {
          e.preventDefault(); if (!gecerli) return;
          const ad = tur === "iban" ? `${banka.trim() || taninan?.ad || "Banka"} · ${sahip || "Hesap sahibi"}` : `Papara · ${sahip || "Hesap sahibi"}`;
          yontemEkle({ tur, ad, deger: tur === "iban" ? iban(temiz) : temiz });
          toast.success("Ödeme yöntemi eklendi", { description: "Çekimlerde artık bu hesabı seçebilirsin." }); kapat();
        }}>
          <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-black/25 ring-1 ring-white/[0.08]">
            <label className="flex items-center gap-3 px-4">
              <span className="w-[96px] shrink-0 text-[13.5px] text-white/60">{tur === "iban" ? "IBAN" : "Papara no"}</span>
              <input autoFocus value={deger} onChange={(e) => setDeger(tur === "iban" ? iban(e.target.value) : e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder={tur === "iban" ? "TR00 0000 0000 0000 0000 0000 00" : "10 hane"} aria-label={tur === "iban" ? "IBAN" : "Papara numarası"}
                className="h-12 min-w-0 flex-1 bg-transparent text-[14px] tabular-nums tracking-[0.03em] text-white outline-none placeholder:text-white/25" />
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full", gecerli ? "bg-[#55d6fd] text-[#06222b]" : "bg-white/[0.06]")}>{gecerli && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}</span>
            </label>
            {tur === "iban" && (
              <label className="flex items-center gap-3 px-4">
                <span className="w-[96px] shrink-0 text-[13.5px] text-white/60">Banka</span>
                {taninan ? <span className="flex h-12 flex-1 items-center gap-2 text-[14px] text-white"><OdemeLogo tur="iban" deger={temiz} boyut="sm" />{taninan.ad}</span>
                  : <input value={banka} onChange={(e) => setBanka(e.target.value.slice(0, 30))} placeholder="IBAN'dan tanınır ya da yaz" aria-label="Banka adı" className="h-12 min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/25" />}
              </label>
            )}
            <div className="flex items-center gap-3 px-4 py-3.5"><span className="w-[96px] shrink-0 text-[13.5px] text-white/60">Hesap sahibi</span><span className="truncate text-[14px] text-white">{sahip || "Kimlik doğrulamasındaki adın"}</span></div>
          </div>
          {tam && !gecerli && <p className="flex gap-1.5 text-[12.5px] text-rose-300"><AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />{tur === "iban" ? "IBAN doğrulama basamakları tutmuyor; numarayı kontrol et." : "Papara numarası 10 haneli olmalı."}</p>}
          <p className="text-[12px] leading-relaxed text-white/45">Başka birinin hesabına ödeme yapılmaz; hesap {sahip ? <span className="text-white/70">{sahip}</span> : "kimlikteki adınla aynı kişi"} adına olmalı.</p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={kapat} className={cn(ikincil, "flex-1")}>Vazgeç</button>
            <button disabled={!gecerli} className={cn(birincil, "flex-1")}>Kaydet</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ═════════ Hareketler ═════════ */
type Hareket = { id: string; baslik: string; alt: string; tutar: number; tarih: number; durum: string | null; hata?: string; kapak?: string; tur: "kampanya" | "davet" | "ortaklik" | "marketplace" | "cekim"; yontem?: OdemeYontemi };

export function useHareketler(simdi: number) {
  const s = useEarn();
  const c = cuzdan(s, simdi);
  return useMemo<Hareket[]>(() => [
    ...s.gonderiler.map((g) => ({ g, h: gonderiHesap(g, simdi, c.seviye.bonus) }))
      .filter(({ h }) => h.durum === "cekilebilir" && h.kazanc > 0)
      .map(({ g, h }) => ({ id: g.id, baslik: h.kampanya!.ad, alt: "Kampanya kazancı", tutar: h.kazanc, tarih: h.sonrakiAsama, durum: null, kapak: g.uretimGorsel ?? h.kampanya!.kapak, tur: "kampanya" as const })),
    ...s.gelirler.map((x) => ({ id: x.id, baslik: x.baslik, alt: x.kaynak === "marketplace" ? "Marketplace" : x.kaynak === "davet" ? "Davet ödülü" : "Ortaklık komisyonu", tutar: x.tutar, tarih: x.tarih, durum: null, tur: x.kaynak })),
    ...s.cekimler.map((x) => ({ id: x.id, baslik: x.yontemAd, alt: `${x.ucret ? `İşlem ücreti ${tl(x.ucret)}` : "Ücretsiz"} · Ref. ${x.referans}`, tutar: -x.tutar, tarih: x.tarih, durum: cekimDurum(x, simdi), hata: x.hata, tur: "cekim" as const, yontem: s.odemeYontemleri.find((y) => y.id === x.yontemId) })),
  ].sort((a, b) => b.tarih - a.tarih), [s.gonderiler, s.gelirler, s.cekimler, s.odemeYontemleri, simdi, c.seviye.bonus]);
}

const ORNEK: Hareket[] = [
  { id: "o1", baslik: "Kling 4.0 ile 30 saniyelik sinematik sahne", alt: "Kampanya kazancı", tutar: 412.8, tarih: 0, durum: null, kapak: havuzSec("cuzdan-o1", "gece").poster, tur: "kampanya" },
  { id: "o2", baslik: "Davet ödülü · @deniz", alt: "Davet ödülü", tutar: 25, tarih: 0, durum: null, tur: "davet" },
  { id: "o3", baslik: "Papara · Hesap sahibi", alt: "Ücretsiz", tutar: -400, tarih: 0, durum: "odendi", tur: "cekim", yontem: { id: "x", tur: "papara", ad: "Papara", deger: "1234567890" } },
];

export function Hareketler({ liste, baslik = "Hareketler", bosMetin }: { liste: Hareket[]; baslik?: string; bosMetin?: string }) {
  const gruplar = useMemo(() => {
    const m = new Map<string, Hareket[]>();
    for (const h of liste) { const k = ayFmt.format(h.tarih); m.set(k, [...(m.get(k) ?? []), h]); }
    return [...m.entries()];
  }, [liste]);
  return (
    <Bolum baslik={baslik} sag={!liste.length && !bosMetin ? <OrnekRozet>Örnek görünüm</OrnekRozet> : undefined} className="mt-10">
      {liste.length ? (
        <div className="space-y-5">
          {gruplar.map(([ay, xs]) => (
            <div key={ay}>
              <p className="mb-2 px-1 text-[13px] font-medium capitalize text-white/50">{ay}</p>
              <div className={cn(yuzey, "divide-y divide-white/[0.05] overflow-hidden")}>{xs.map((h, i) => <HareketSatiri key={h.id} h={h} i={i} />)}</div>
            </div>
          ))}
        </div>
      ) : bosMetin ? (
        <p className="rounded-[20px] bg-white/[0.025] px-5 py-4 text-[14px] text-white/60 ring-1 ring-white/[0.08]">{bosMetin}</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-[20px] bg-white/[0.025] px-5 py-4 ring-1 ring-white/[0.08] sm:flex-row sm:items-center">
            <p className="flex-1 text-[14px] text-white/65">Henüz hareket yok. Gönderilerinin bekleme süresi dolunca kazancın burada görünür.</p>
            <div className="flex gap-2">
              <Link href="/earn/kampanyalar" className={cn(birincil, "h-10 px-4 text-[13.5px]")}>Kampanya seç</Link>
              <Link href="/earn/davet" className={cn(ikincil, "h-10 px-4 text-[13.5px]")}>Davet et</Link>
            </div>
          </div>
          <div className={cn(yuzey, "pointer-events-none mt-3 divide-y divide-white/[0.05] overflow-hidden opacity-50")} aria-hidden>{ORNEK.map((h, i) => <HareketSatiri key={h.id} h={h} i={i} ornek />)}</div>
        </>
      )}
    </Bolum>
  );
}

function HareketSatiri({ h, i, ornek }: { h: Hareket; i: number; ornek?: boolean }) {
  const Ik = h.tur === "davet" || h.tur === "ortaklik" ? Gift : h.tur === "marketplace" ? Store : Wallet;
  const cikis = h.tutar < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.035, duration: 0.35, ease }} className="flex items-center gap-3.5 px-4 py-3 sm:px-5">
      {h.kapak
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={h.kapak} alt="" className="h-11 w-11 shrink-0 rounded-[12px] object-cover" />
        : h.tur === "cekim" && h.yontem ? <OdemeLogo tur={h.yontem.tur} deger={h.yontem.deger} boyut="sm" />
          : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-[#8fe6ff]"><Ik className="h-[18px] w-[18px]" /></span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium text-white">{cikis ? `Para çekme · ${h.baslik}` : h.baslik}</p>
        <p className="truncate text-[12.5px] text-white/50">{h.alt}{ornek ? "" : ` · ${tarihFmt.format(h.tarih)}`}</p>
        {h.hata && <p className="text-[12px] text-rose-300">{h.hata}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("text-[15px] font-semibold tabular-nums", h.durum === "basarisiz" ? "text-white/40 line-through" : cikis ? "text-white" : "text-emerald-300")}>{cikis ? "-" : "+"}{tl(Math.abs(h.tutar), true)}</p>
        {h.durum && <p className={cn("mt-0.5 inline-flex items-center gap-1 text-[12px]", h.durum === "odendi" ? "text-white/45" : h.durum === "basarisiz" ? "text-rose-300" : "text-amber-200")}>{h.durum === "isleniyor" && <Clock className="h-3 w-3" />}{h.durum === "odendi" ? "Ödendi" : h.durum === "basarisiz" ? "İade edildi" : "İşleniyor"}</p>}
      </div>
    </motion.div>
  );
}

/* ═════════ Ödeme takvimi: her adımda küçük bir ürün anı ═════════ */
export function Takvim() {
  const adimlar = [
    { ad: "Gönderi", alt: "Paylaşımının bağlantısını eklersin", Gorsel: () => (
      <div className="flex h-9 w-[150px] items-center gap-1.5 rounded-[10px] bg-black/30 px-2.5 text-[11.5px] ring-1 ring-white/[0.08]"><Link2 className="h-3.5 w-3.5 text-white/45" /><span className="truncate text-white">tiktok.com/@sen/7k2…</span></div>
    ) },
    { ad: "İnceleme", alt: `${KURALLAR.incelemeSaat} saat içinde onay, sabit ödeme`, Gorsel: () => (
      <span className="relative flex h-16 w-16 items-center justify-center">
        <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90"><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" /><motion.circle cx="32" cy="32" r="27" fill="none" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 0.7 }} transition={{ duration: 1.2, ease }} /></svg>
        <span className="text-[13px] font-semibold text-white">{KURALLAR.incelemeSaat} sa</span>
      </span>
    ) },
    { ad: "Kazanma", alt: `${KURALLAR.kazanmaGun} gün izlenme sayılır, bonuslar eklenir`, Gorsel: () => (
      <div className="flex h-14 items-end gap-1">{[30, 46, 58, 68, 76, 82, 86].map((h, j) => <motion.span key={j} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2 + j * 0.06, duration: 0.4, ease }} className="block w-3 origin-bottom rounded-[3px] bg-[#55d6fd]" style={{ height: `${h}%`, opacity: 0.35 + j * 0.1 }} />)}</div>
    ) },
    { ad: "Çekilebilir", alt: `${KURALLAR.beklemeGun} gün güvenlik beklemesinden sonra`, Gorsel: () => (
      <div className="rounded-[12px] bg-[linear-gradient(135deg,#55d6fd,#8f9cff)] px-3 py-2 text-[#05222b]"><p className="text-[10.5px] font-medium opacity-70">Çekilebilir</p><p className="text-[17px] font-semibold leading-tight">Cüzdanda</p></div>
    ) },
  ];
  return (
    <Bolum baslik="Ödeme takvimi" alt="Bir gönderinin parası cüzdanına böyle gelir." className="mt-14">
      <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {adimlar.map((a, i) => (
          <motion.li key={a.ad} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07, duration: 0.45, ease }}>
            <div className="relative flex h-[130px] items-center justify-center overflow-hidden rounded-[22px] bg-[radial-gradient(90%_70%_at_50%_0%,rgba(85,214,253,0.08),transparent_70%),#101114] ring-1 ring-white/[0.07]"><a.Gorsel /></div>
            <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-white"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black">{i + 1}</span>{a.ad}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/55">{a.alt}</p>
          </motion.li>
        ))}
      </ol>
      <Link href="/earn/yardim" className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-medium text-white/60 transition hover:text-white">Ödeme kuralları<ArrowUpRight className="h-3.5 w-3.5" /></Link>
    </Bolum>
  );
}
