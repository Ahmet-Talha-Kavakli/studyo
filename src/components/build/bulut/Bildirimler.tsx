"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Bell, BellOff, CheckCheck, ChevronRight, Loader2, Mail, Settings2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { YanPanel } from "./ortak";

export type Bildirim = { id: string; z: number; tur: string; seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; bolum?: string; baglanti?: string; okundu?: boolean; eposta?: "gonderildi" | "gonderilemedi"; projeId?: string; projeAd?: string };
const TURLER: { id: string; ad: string; alt: string }[] = [
  { id: "hata-artisi", ad: "Hata artışı", alt: "Son bir saatteki sunucu hataları önceki 24 saatin üç katını geçince" },
  { id: "istemci-hatasi", ad: "Canlı sitede tarayıcı hatası", alt: "Ziyaretçinin tarayıcısında yeni bir hata görülünce" },
  { id: "zamanli-hata", ad: "Zamanlanmış görev hatası", alt: "Zamanlı ya da gecikmeli bir iş başarısız olunca (gün başına bir kez)" },
  { id: "uyari-kurali", ad: "Uyarı kuralları", alt: "Performans bölümündeki eşik kuralları tetiklenince" },
  { id: "yayin-hatasi", ad: "Başarısız yayın", alt: "Yayın durdurulunca ya da tamamlanamayınca" },
  { id: "kullanim", ad: "Kullanım ve sınırlar", alt: "Kota ya da sınırın yüzde 50, 75 ve 100'ünde" },
  { id: "alan-adi", ad: "Alan adı ve SSL", alt: "DNS kaydı bozulunca ya da sertifika alınamayınca" },
  { id: "guvenlik", ad: "Kritik güvenlik bulgusu", alt: "Güvenlik taraması kritik bir sorun bulunca" },
];
const NOKTA = { kritik: "bg-rose-400", uyari: "bg-amber-300", bilgi: "bg-[#55d6fd]" };

/** Bildirim satırı. */
function Satir({ b, ac, okundu, cokProje }: { b: Bildirim; ac: () => void; okundu: () => void; cokProje?: boolean }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className={cn("group flex items-start gap-3 px-4 py-3 sm:px-5", !b.okundu && "bg-white/[0.02]")}>
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", NOKTA[b.seviye], b.okundu && "opacity-40")} />
      <button type="button" onClick={ac} className="min-w-0 flex-1 text-left">
        <span className={cn("block text-[13.5px]", b.okundu ? "text-white/65" : "font-medium text-white")}>{b.baslik}</span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/50">{b.ayrinti}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-white/35">{cokProje && b.projeAd && <span className="text-white/55">{b.projeAd}</span>}<span>{gorece(b.z)}</span>{b.eposta === "gonderildi" && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />e-posta gitti</span>}{b.eposta === "gonderilemedi" && <span className="text-rose-300/80">e-posta gönderilemedi</span>}</span>
      </button>
      {!b.okundu && <button type="button" onClick={okundu} title="Okundu say" aria-label="Okundu say" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.07] hover:text-white"><CheckCheck className="h-3.5 w-3.5" /></button>}
      {(b.bolum || b.projeId) && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/25" />}
    </motion.div>
  );
}

/** Bildirim ayarları paneli (proje başına): türler, e-posta adresi; e-posta servisi yoksa yalnız uygulama içi. */
function AyarPaneli({ projeId, acik, kapat }: { projeId: string; acik: boolean; kapat: () => void }) {
  const [v, setV] = useState<{ ayar: { bildirim: { turler: Record<string, boolean>; eposta: string } }; eposta: { kurulu: boolean } } | null>(null);
  const [eposta, setEposta] = useState("");
  const [hata, setHata] = useState("");
  const [kaydedildi, setKaydedildi] = useState(false);
  useEffect(() => { if (acik) api<NonNullable<typeof v>>(`/api/build/bulut/${projeId}/ayar`).then((x) => { setV(x); setEposta(x.ayar.bildirim.eposta); }).catch(() => {}); }, [acik, projeId]);
  const kaydet = async (b: Record<string, unknown>) => {
    setHata("");
    try { const x = await api<{ ayar: NonNullable<typeof v>["ayar"] }>(`/api/build/bulut/${projeId}/ayar`, { method: "PATCH", govde: { bildirim: b } }); setV((o) => (o ? { ...o, ayar: x.ayar } : o)); setKaydedildi(true); setTimeout(() => setKaydedildi(false), 1400); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Bildirim ayarları" alt="Bu proje için hangi olaylarda haber alacağını seç">
      {!v ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
        <div className="space-y-5">
          <div className="divide-y divide-white/[0.05] rounded-[16px] ring-1 ring-inset ring-white/[0.07]">
            {TURLER.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1"><p className="text-[13.5px] text-white">{t.ad}</p><p className="text-[12px] leading-relaxed text-white/45">{t.alt}</p></div>
                <Anahtar acik={v.ayar.bildirim.turler[t.id] !== false} set={(x) => kaydet({ turler: { [t.id]: x } })} etiket={t.ad} />
              </div>
            ))}
          </div>
          <section className="space-y-2">
            <h4 className="text-[13px] font-medium text-white">E-postayla da gönder</h4>
            {!v.eposta.kurulu ? (
              <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.05] p-3 text-[12.5px] leading-relaxed text-amber-100/90 ring-1 ring-inset ring-amber-200/15"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />Bu sunucuda e-posta servisi kurulu değil (RESEND_API_KEY tanımlı değil). Bildirimler yalnız burada, uygulama içinde görünür; e-posta gönderilmez.</p>
            ) : (
              <>
                <p className="text-[12.5px] text-white/50">Kritik ve uyarı bildirimleri bu adrese de gider. Boş bırakırsan yalnız uygulama içinde görünür.</p>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); kaydet({ eposta }); }}>
                  <input value={eposta} onChange={(e) => setEposta(e.target.value)} type="email" placeholder="ornek@alan.com" className={cn(alanSinif, "h-10 min-w-0 flex-1")} />
                  <button type="submit" className="inline-flex h-10 shrink-0 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black">Kaydet</button>
                </form>
              </>
            )}
          </section>
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
          {kaydedildi && <p className="text-[12.5px] text-[#8be6ff]">Kaydedildi</p>}
        </div>
      )}
    </YanPanel>
  );
}

/**
 * Bildirim gelen kutusu. projeId verilirse o projenin (ayarlar düğmesiyle), verilmezse bütün projelerin bildirimleri.
 * git: proje içi bölüme gitmek için (verilmezse proje sayfasına bağlantı).
 */
export function BildirimKutusu({ projeId, git, sinir = 6, sayac }: { projeId?: string; git?: (bolum: string, sorgu?: string) => void; sinir?: number; sayac?: (n: number) => void }) {
  const [l, setL] = useState<Bildirim[] | null>(null);
  const [tumu, setTumu] = useState(false);
  const [ayar, setAyar] = useState(false);
  const router = useRouter();
  const kok = projeId ? `/api/build/bulut/${projeId}/bildirim` : "/api/build/bulut/bildirim";
  const getir = useCallback(() => api<{ bildirimler: Bildirim[] }>(kok).then((x) => setL(x.bildirimler)).catch(() => setL([])), [kok]);
  useEffect(() => { getir(); const z = setInterval(getir, 60_000); return () => clearInterval(z); }, [getir]);
  const okunmamis = (l ?? []).filter((b) => !b.okundu).length;
  useEffect(() => { sayac?.(okunmamis); }, [okunmamis, sayac]);
  const okundu = async (b: Bildirim | "hepsi") => {
    setL((x) => (x ?? []).map((y) => (b === "hepsi" || y.id === b.id ? { ...y, okundu: true } : y)));
    if (b === "hepsi") { const ids = [...new Set((l ?? []).filter((y) => !y.okundu).map((y) => y.projeId ?? projeId!))]; await Promise.all(ids.map((p) => api(`/api/build/bulut/${p}/bildirim`, { govde: { islem: "okundu", kimlikler: "hepsi" } }).catch(() => {}))); }
    else await api(`/api/build/bulut/${b.projeId ?? projeId}/bildirim`, { govde: { islem: "okundu", kimlikler: [b.id] } }).catch(() => {});
  };
  const goster = tumu ? (l ?? []) : (l ?? []).slice(0, sinir);
  return (
    <Kart ikon={Bell} baslik={<span className="flex items-center gap-2">Bildirimler{okunmamis > 0 && <span className="rounded-full bg-[#55d6fd] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-[#04212b]">{okunmamis}</span>}</span>}
      alt={projeId ? "Hata artışı, başarısız yayın, sınırlar, alan adı, güvenlik ve canlı site hataları" : "Bütün projelerden; hata artışı, yayın, sınır, alan adı ve güvenlik"}
      sag={<>{okunmamis > 0 && <button type="button" onClick={() => okundu("hepsi")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><CheckCheck className="h-3.5 w-3.5" /><span className="max-sm:hidden">Tümünü okundu say</span></button>}
        {projeId && <button type="button" onClick={() => setAyar(true)} aria-label="Bildirim ayarları" title="Bildirim ayarları" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white hover:bg-white/[0.13]"><Settings2 className="h-4 w-4" /></button>}</>}>
      {l === null ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !l.length ? (
        <div className="flex items-center gap-3 px-5 py-5"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.05] text-white/45"><BellOff className="h-4 w-4" /></span><p className="text-[13px] leading-relaxed text-white/55">Şu an bildirim yok. Hata artarsa, yayın başarısız olursa, sınıra yaklaşırsan ya da alan adında sorun çıkarsa burada görünür.</p></div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          <AnimatePresence initial={false}>
            {goster.map((b) => {
              const hedef = b.projeId ? `/panel/build/bulut/${b.projeId}?bolum=${b.bolum ?? "genel"}${b.baglanti ? `&${b.baglanti}` : ""}` : null;
              return <Satir key={b.id} b={b} cokProje={!!b.projeId} okundu={() => okundu(b)} ac={() => { if (!b.okundu) okundu(b); if (git && !b.projeId) { if (b.bolum) git(b.bolum, b.baglanti); } else if (hedef) router.push(hedef); }} />;
            })}
          </AnimatePresence>
          {l.length > sinir && <button type="button" onClick={() => setTumu((x) => !x)} className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[12.5px] text-white/55 hover:text-white">{tumu ? <><X className="h-3.5 w-3.5" />Daralt</> : `Tümünü göster, ${l.length} bildirim`}</button>}
        </div>
      )}
      {projeId && <AyarPaneli projeId={projeId} acik={ayar} kapat={() => setAyar(false)} />}
    </Kart>
  );
}
