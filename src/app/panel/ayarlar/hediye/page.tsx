"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardPaste, Copy, Gift, Link2, RefreshCw, Send, Sparkles, Ticket } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { hareketYaz } from "@/store/useHesap";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Grup, Hap, Satir, Sayfa, Segment, alan, dugme, akis } from "@/components/ayarlar/ui";
import { goreli } from "@/components/api/ui";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { sayi } from "@/lib/fiyat";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";
import { HediyeOzet } from "@/components/ayarlar/YanPaneller";

const TUTARLAR = [100, 250, 500, 1000, 2500];

async function hediyeApi<T>(govde: Record<string, unknown>): Promise<{ ok: true } & T | { ok: false; hata: string }> {
  try {
    const r = await fetch("/api/hediye", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(govde) });
    return await r.json();
  } catch { return { ok: false, hata: "Sunucuya ulaşılamadı. Bağlantını kontrol et." }; }
}

export default function HediyeSayfasi() {
  return <Suspense><Hediye /></Suspense>;
}

function Hediye() {
  const params = useSearchParams();
  const kullanici = useAuth((s) => s.kullanici)!;
  const krediEkle = useAuth((s) => s.krediEkle);
  const { email, kayit, guncelle } = useHesapKaydi();
  const [kod, setKod] = useState(() => params.get("kod")?.toUpperCase() ?? "");
  const [hata, setHata] = useState("");
  const [bekle, setBekle] = useState(false);
  const [sonuc, setSonuc] = useState<{ kredi: number; aciklama: string } | null>(null);
  const [durumlar, setDurumlar] = useState<Record<string, { kullanildi: number | null }>>({});
  const baglantidan = !!params.get("kod");
  const kullanilanlar = kayit.hareketler.filter((h) => h.tur === "promo" || h.tur === "hediye");
  const gonderilenler = kayit.gonderilenler ?? [];

  const durumYenile = useCallback(async () => {
    if (!gonderilenler.length) return;
    const r = await hediyeApi<{ durumlar: typeof durumlar }>({ islem: "durum", email, kodlar: gonderilenler.map((g) => g.kod) });
    if (r.ok) setDurumlar(r.durumlar);
  }, [gonderilenler.length, email]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void durumYenile(); }, [durumYenile]);

  const uygula = async (e: React.FormEvent) => {
    e.preventDefault();
    const k = kod.trim().toUpperCase().replace(/\s+/g, "");
    if (!k) return;
    setHata(""); setSonuc(null);
    if (kayit.kodlar.includes(k)) return setHata("Bu kodu zaten kullandın.");
    if (gonderilenler.some((g) => g.kod === k)) return setHata("Kendi gönderdiğin hediye kodunu kullanamazsın.");
    setBekle(true);
    const r = await hediyeApi<{ tur: "promo" | "hediye"; kredi: number; aciklama: string }>({ islem: "kullan", kod: k, email });
    setBekle(false);
    if (!r.ok) return setHata(r.hata);
    krediEkle(r.kredi);
    guncelle((h) => ({ ...h, kodlar: [...h.kodlar, k] }));
    hareketYaz({ tur: r.tur, aciklama: `${r.aciklama} · ${k}`, kredi: r.kredi });
    setSonuc({ kredi: r.kredi, aciklama: r.aciklama });
    setKod("");
    toast.success(`${sayi(r.kredi)} kredi eklendi`, { description: r.aciklama });
  };
  const yapistir = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) { setKod(t.trim().toUpperCase()); setHata(""); } }
    catch { toast.error("Panodan okunamadı", { description: "Tarayıcı panoya erişime izin vermedi. Kodu elle yapıştır." }); }
  };

  return (
    <Sayfa baslik="Kodlar ve hediyeler" aciklama="Promosyon ya da hediye kodu kullan, arkadaşlarına kredi hediye et." yan={<HediyeOzet />}>
      <Grup id="kod" baslik="Kod kullan" aciklama="Kampanya kodları ve sana gönderilen hediye kodları. Her kod hesap başına bir kez geçerlidir." govde>
        {baglantidan && !sonuc && kod && (
          <div className="mb-4 flex items-center gap-3 rounded-[14px] bg-[#55d6fd]/[0.07] px-4 py-3 text-[14px] ring-1 ring-inset ring-[#55d6fd]/20">
            <Gift className="h-4 w-4 shrink-0 text-[#55d6fd]" /><span className="text-white/70"><b className="font-semibold text-white">Sana bir hediye gönderildi.</b> Kod yerleştirildi; uygulamak için Uygula'ya bas.</span>
          </div>
        )}
        <form onSubmit={uygula} className="flex flex-col gap-2.5 sm:flex-row">
          <label className={cn("flex h-12 flex-1 items-center gap-3 rounded-[14px] bg-white/[0.05] px-4 ring-1 ring-inset transition-shadow focus-within:ring-[#55d6fd]/60", hata ? "ring-rose-500/60" : "ring-white/[0.08]")}>
            <Ticket className="h-[18px] w-[18px] shrink-0 text-white/35" />
            <input value={kod} onChange={(e) => { setKod(e.target.value.toUpperCase()); setHata(""); }} placeholder="Kodunu gir ya da yapıştır" aria-label="Kod" spellCheck={false} autoComplete="off"
              className="sc-kod h-full min-w-0 flex-1 bg-transparent text-[15px] tracking-[0.06em] text-white outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-white/35" />
            {!kod && <button type="button" onClick={() => void yapistir()} className="flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-2 text-[13px] font-medium text-white/55 hover:bg-white/[0.06] hover:text-white"><ClipboardPaste className="h-3.5 w-3.5" />Yapıştır</button>}
          </label>
          <button type="submit" disabled={!kod.trim() || bekle} className={cn(dugme.birincil, "h-12 px-7")}>{bekle ? "Kontrol ediliyor…" : "Uygula"}</button>
        </form>
        {hata && <p role="alert" className="mt-2.5 text-[13px] text-rose-300">{hata}</p>}
        <AnimatePresence>
          {sonuc && (
            <motion.div role="status" initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: akis }}
              className="mt-3 flex items-center gap-3 rounded-[14px] bg-emerald-400/[0.07] p-4 ring-1 ring-inset ring-emerald-400/20">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-4 w-4" strokeWidth={2.6} /></motion.span>
              <div className="text-[14px]"><p className="font-semibold text-white">{sayi(sonuc.kredi)} kredi hesabına eklendi</p><p className="text-white/50">{sonuc.aciklama}. Yeni bakiye {sayi(kullanici.krediler)} kredi.</p></div>
            </motion.div>
          )}
        </AnimatePresence>
      </Grup>

      <HediyeOlustur onOlustu={() => void durumYenile()} />

      <Grup baslik="Geçmiş" aciklama="Kullandığın kodlar ve gönderdiğin hediyeler."
        sag={gonderilenler.length > 0 ? <button type="button" onClick={() => void durumYenile()} className={cn(dugme.hayalet, "h-8 text-[13px]")}><RefreshCw className="h-3.5 w-3.5" />Yenile</button> : undefined}>
        {!kullanilanlar.length && !gonderilenler.length ? (
          <p className="px-6 py-6 text-[14px] text-white/45">Bir kod uyguladığında ya da hediye gönderdiğinde burada görünür.</p>
        ) : (
          <>
            {gonderilenler.map((g) => {
              const d = durumlar[g.kod];
              return (
                <Satir key={g.kod} on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#a78bfa]/12 text-[#a78bfa]"><Send className="h-4 w-4" /></span>}
                  ad={<span className="flex items-center gap-2">Hediye gönderildi{g.not && <span className="font-normal text-white/50">, {g.not}</span>}</span>}
                  alt={<span><span className="sc-kod">{g.kod}</span> · {goreli(g.zaman)}</span>}>
                  <span className="text-[14px] font-semibold tabular-nums text-white">-{sayi(g.kredi)}</span>
                  {d?.kullanildi ? <Hap ton="yesil">Kullanıldı</Hap> : <Hap>Bekliyor</Hap>}
                  {!d?.kullanildi && <button type="button" onClick={() => void kopyala(g.kod, "Hediye kodu kopyalandı")} aria-label="Kodu kopyala" className="flex h-8 w-8 items-center justify-center rounded-[9px] text-white/40 hover:bg-white/[0.06] hover:text-white"><Copy className="h-3.5 w-3.5" /></button>}
                </Satir>
              );
            })}
            {kullanilanlar.map((h) => (
              <Satir key={h.id} on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-400/10 text-emerald-300"><Ticket className="h-4 w-4" /></span>}
                ad={h.aciklama.split(" · ")[0]} alt={<span>{h.aciklama.split(" · ")[1] && <span className="sc-kod">{h.aciklama.split(" · ")[1]} · </span>}{goreli(h.zaman)}</span>}>
                <span className="text-[14px] font-semibold tabular-nums text-emerald-300">+{sayi(h.kredi)}</span>
              </Satir>
            ))}
          </>
        )}
      </Grup>
    </Sayfa>
  );
}

/** Hediye kartı: tutar ve not seçilir, kart canlı güncellenir; oluşturulunca kod kartın üzerinde belirir. */
function HediyeOlustur({ onOlustu }: { onOlustu: () => void }) {
  const kullanici = useAuth((s) => s.kullanici)!;
  const krediler = kullanici.krediler;
  const krediDus = useAuth((s) => s.krediDus);
  const krediEkle = useAuth((s) => s.krediEkle);
  const { email, guncelle } = useHesapKaydi();
  const [tutar, setTutar] = useState(() => TUTARLAR.find((t) => t <= krediler && t >= 250) ?? 100);
  const [not, setNot] = useState("");
  const [bekle, setBekle] = useState(false);
  const [kod, setKod] = useState<string | null>(null);
  const baglanti = kod ? `${typeof window !== "undefined" ? window.location.origin : ""}/panel/ayarlar/hediye?kod=${kod}` : "";
  const yetersiz = tutar > krediler;

  const olustur = async () => {
    if (yetersiz) return mesaj.yetersizKredi(tutar, krediler);
    setBekle(true);
    if (!krediDus(tutar)) { setBekle(false); return; }
    const r = await hediyeApi<{ kod: string; kredi: number }>({ islem: "olustur", kredi: tutar, email });
    setBekle(false);
    if (!r.ok) { krediEkle(tutar); return toast.error("Hediye kodu oluşturulamadı", { description: r.hata ?? "Sunucu yanıt vermedi; kredin iade edildi. Biraz sonra yeniden dene." }); }
    guncelle((h) => ({ ...h, gonderilenler: [{ kod: r.kod, kredi: r.kredi, zaman: Date.now(), ...(not.trim() ? { not: not.trim() } : {}) }, ...(h.gonderilenler ?? [])] }));
    hareketYaz({ tur: "hediye-gonder", aciklama: `Hediye kodu oluşturuldu${not.trim() ? ` · ${not.trim()}` : ""}`, kredi: -r.kredi });
    setKod(r.kod);
    onOlustu();
  };

  return (
    <Grup id="gonder" baslik="Kredi hediye et" aciklama="Bakiyenden bir miktar ayır, tek kullanımlık bir kod oluştur. Kodu alan kişi kendi hesabında kullanır."
      alt={<><span>Bakiyen <b className="font-semibold tabular-nums text-white/80">{sayi(krediler)}</b> kredi</span>{!kod && <span className="tabular-nums">Oluşturunca {sayi(Math.max(0, krediler - tutar))} kredi kalır</span>}</>} govde>
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        {/* Kart */}
        <motion.div className="relative aspect-[1.6/1] w-full overflow-hidden rounded-[22px] p-5 text-white ring-1 ring-inset ring-white/10"
          style={{ background: "radial-gradient(120% 100% at 0% 0%, rgba(85,214,253,0.55), transparent 55%), radial-gradient(100% 120% at 100% 100%, rgba(140,100,255,0.55), transparent 60%), #10131a" }}>
          <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 text-white/[0.09]" fill="none" stroke="currentColor">
            {[30, 48, 66, 84].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
          </svg>
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[14px] font-semibold"><VayraIsaret size={22} />Vayra</span>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11.5px] font-semibold">Hediye kredisi</span>
            </div>
            <div className="mt-auto">
              <AnimatePresence mode="wait">
                {kod ? (
                  <motion.button key="kod" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} type="button" onClick={() => void kopyala(kod, "Hediye kodu kopyalandı")} aria-label="Hediye kodunu kopyala"
                    className="group mb-2 flex w-full items-center justify-between gap-2 rounded-[12px] bg-black/35 px-3 py-2.5 text-left">
                    <span className="sc-kod break-all text-[13px] font-semibold tracking-wide">{kod}</span><Copy className="h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100" />
                  </motion.button>
                ) : <motion.p key="not" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] text-white/70">{not.trim() ? `${not.trim()} için` : "Bir arkadaşın için"}</motion.p>}
              </AnimatePresence>
              <p className="mt-1 flex items-baseline gap-1.5">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={tutar} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.25, ease: akis }} className="text-[40px] font-semibold leading-none tabular-nums tracking-[-0.035em]">{sayi(tutar)}</motion.span>
                </AnimatePresence>
                <span className="text-[14px] text-white/75">kredi</span>
              </p>
              <p className="mt-1.5 text-[12px] text-white/60">Gönderen {kullanici.ad}</p>
            </div>
          </div>
        </motion.div>

        {kod ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-[16px] font-semibold text-white"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3.5 w-3.5" strokeWidth={2.6} /></span>Hediye kodun hazır</p>
            <p className="text-[14px] leading-relaxed text-white/55">Kodu ya da bağlantıyı paylaş. Bağlantıyı açan kişinin kodu kendiliğinden dolar; kod bir kez kullanılabilir.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void kopyala(kod, "Hediye kodu kopyalandı")} className={dugme.ikincil}><Copy className="h-3.5 w-3.5" />Kodu kopyala</button>
              <button type="button" onClick={() => void kopyala(baglanti, "Hediye bağlantısı kopyalandı")} className={dugme.ikincil}><Link2 className="h-3.5 w-3.5" />Bağlantıyı kopyala</button>
              {typeof navigator !== "undefined" && "share" in navigator && <button type="button" onClick={() => void navigator.share({ title: "Vayra hediye kredisi", text: `Sana ${sayi(tutar)} Vayra kredisi hediye ettim: ${kod}`, url: baglanti }).catch(() => {})} className={dugme.ikincil}><Send className="h-3.5 w-3.5" />Paylaş</button>}
            </div>
            <button type="button" onClick={() => { setKod(null); setNot(""); }} className={cn(dugme.hayalet, "-ml-3")}>Yeni hediye oluştur</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[13px] font-medium text-white/65">Tutar</p>
              <Segment tam kayit={false} deger={String(tutar)} onSec={(v) => setTutar(+v)} secenekler={TUTARLAR.filter((t) => t <= Math.max(100, krediler)).map((t) => ({ deger: String(t), ad: sayi(t) }))} />
            </div>
            <div>
              <label htmlFor="hediye-not" className="mb-2 block text-[13px] font-medium text-white/65">Kime? <span className="font-normal text-white/35">Yalnız sen görürsün</span></label>
              <input id="hediye-not" value={not} onChange={(e) => setNot(e.target.value)} maxLength={40} placeholder="Örneğin: Ayşe, doğum günü" className={alan} />
            </div>
            <button type="button" onClick={() => void olustur()} disabled={bekle || yetersiz} className={cn(dugme.vurgu, "h-11 w-full")}><Sparkles className="h-4 w-4" />{bekle ? "Oluşturuluyor…" : "Hediye kodu oluştur"}</button>
            {yetersiz && <p className="text-[13px] text-amber-300">Bakiyen bu tutar için yetmiyor.</p>}
          </div>
        )}
      </div>
    </Grup>
  );
}
