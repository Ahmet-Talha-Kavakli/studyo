"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Monitor, Sparkles, Zap, ZapOff } from "lucide-react";
import { useTercih, VURGU_RENKLERI } from "@/store/useTercih";
import { useAyarTercih } from "@/store/useAyarTercih";
import { gecisler } from "@/components/panel/Kisayollar";
import { Anahtar, Grup, Satir, Sayfa, Secici, Segment, kaydedildi, yay } from "@/components/ayarlar/ui";
import { cn } from "@/lib/utils";
import { GorunumOnizleme } from "@/components/ayarlar/YanPaneller";

const HAREKETLER = [
  { id: "sistem", ad: "Sisteme uy", alt: "İşletim sisteminin ayarını izler", ikon: Monitor },
  { id: "tam", ad: "Tam", alt: "Tüm geçiş ve animasyonlar açık", ikon: Zap },
  { id: "azalt", ad: "Azalt", alt: "Geçişler anında, hareket yok", ikon: ZapOff },
] as const;

const SAAT_DILIMLERI = ["Europe/Istanbul", "Europe/London", "Europe/Berlin", "Europe/Moscow", "Asia/Dubai", "Asia/Tokyo", "America/New_York", "America/Los_Angeles", "UTC"];

export default function GorunumAyarlari() {
  const t = useTercih();
  const b = useAyarTercih((s) => s.bolge);
  const ayarla = useAyarTercih((s) => s.ayarla);
  const setB = (p: Partial<typeof b>) => ayarla("bolge", p);
  const secili = VURGU_RENKLERI.find((v) => v.id === t.vurgu) ?? VURGU_RENKLERI[0];
  const [sistemAzalt, setSistemAzalt] = useState(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    setSistemAzalt(m.matches);
    const f = () => setSistemAzalt(m.matches);
    m.addEventListener("change", f); return () => m.removeEventListener("change", f);
  }, []);
  const [simdi, setSimdi] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setSimdi(new Date()), 30_000); return () => clearInterval(i); }, []);

  const saatOrnek = (tz: string) => { try { return simdi.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: tz }); } catch { return ""; } };
  const tarihOrnek = useMemo(() => ({
    gun: simdi.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: b.saatDilimi }),
    uzun: simdi.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: b.saatDilimi }),
    iso: simdi.toLocaleDateString("sv-SE", { timeZone: b.saatDilimi }),
  }), [simdi, b.saatDilimi]);

  return (
    <Sayfa baslik="Görünüm ve dil" aciklama="Arayüzün rengi, hareketi, dili ve klavyeyle çalışma biçimin. Değişiklikler anında uygulanır." yan={<GorunumOnizleme />}>
      <style>{`@keyframes ayar-kay{0%,100%{transform:translateX(0)}50%{transform:translateX(56px)}}`}</style>

      <Grup id="vurgu" baslik="Vurgu rengi" aciklama="Stüdyolardaki seçimler, ilerleme çubukları ve odak halkalarında kullanılan renk." govde>
        <div role="radiogroup" aria-label="Vurgu rengi" className="flex flex-wrap gap-3">
          {VURGU_RENKLERI.map((v) => {
            const a = v.id === secili.id;
            return (
              <button key={v.id} type="button" role="radio" aria-checked={a} aria-label={v.ad} onClick={() => { if (!a) { t.gorunumAyarla({ vurgu: v.id }); kaydedildi(); } }}
                className="group flex flex-col items-center gap-2">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 group-active:scale-95" style={{ background: v.renk }}>
                  {a && <motion.span layoutId="vurgu-halka" transition={yay} className="absolute -inset-[5px] rounded-full ring-2 ring-white" />}
                </span>
                <span className={cn("text-[12.5px] transition-colors", a ? "font-medium text-white" : "text-white/45")}>{v.ad}</span>
              </button>
            );
          })}
        </div>
      </Grup>

      <Grup id="hareket" baslik="Hareket" aciklama={`Animasyonlar ve geçişler. İşletim sistemin şu an ${sistemAzalt ? "hareketi azaltmayı" : "tam hareketi"} istiyor.`} govde>
        <div role="radiogroup" aria-label="Hareket" className="grid gap-2.5 sm:grid-cols-3">
          {HAREKETLER.map((h) => {
            const a = t.hareket === h.id;
            const oynar = h.id === "tam" || (h.id === "sistem" && !sistemAzalt);
            return (
              <button key={h.id} type="button" role="radio" aria-checked={a} onClick={() => { if (!a) { t.gorunumAyarla({ hareket: h.id }); kaydedildi(); } }}
                className={cn("relative overflow-hidden rounded-[18px] text-left transition-colors", a ? "bg-white/[0.06]" : "bg-white/[0.03] hover:bg-white/[0.05]")}>
                {a && <motion.span layoutId="hareket-cerceve" transition={yay} className="pointer-events-none absolute inset-0 z-10 rounded-[18px] ring-[1.5px] ring-inset ring-white" />}
                <span aria-hidden className="relative block h-[72px] bg-black/25">
                  <span className="absolute inset-x-6 top-1/2 h-px bg-white/[0.08]" />
                  <span className={cn("absolute left-6 top-1/2 -mt-3 h-6 w-6 rounded-[8px]", a ? "bg-[#55d6fd]" : "bg-white/35")}
                    style={oynar ? { animation: "ayar-kay 1.9s cubic-bezier(.6,0,.4,1) infinite" } : { transform: "translateX(56px)" }} />
                </span>
                <span className="flex items-start gap-2.5 p-3.5">
                  <h.ikon className={cn("mt-0.5 h-4 w-4 shrink-0", a ? "text-[#55d6fd]" : "text-white/40")} />
                  <span className="min-w-0"><span className="block text-[14px] font-semibold text-white">{h.ad}</span><span className="mt-0.5 block text-[12.5px] leading-snug text-white/45">{h.alt}</span></span>
                </span>
              </button>
            );
          })}
        </div>
      </Grup>

      <Grup baslik="Dil ve bölge">
        <Satir id="dil" ad="Arayüz dili">
          <Secici deger={b.dil} onSec={(v) => setB({ dil: v })} genislik={220} secenekler={[
            { deger: "tr", ad: "Türkçe", on: <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-white/[0.08] text-[10.5px] font-semibold text-white/80">TR</span> },
            { deger: "en", ad: "English", alt: "Yakında", kapali: true, on: <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-white/[0.08] text-[10.5px] font-semibold text-white/80">EN</span> },
          ]} />
        </Satir>
        <Satir id="saat-dilimi" ad="Saat dilimi" alt="Üretim geçmişi, makbuzlar ve bildirimlerdeki saatler.">
          <Secici deger={b.saatDilimi} onSec={(v) => setB({ saatDilimi: v })} genislik={300} secenekler={SAAT_DILIMLERI.map((z) => ({ deger: z, ad: z.replace(/_/g, " ").replace("/", ", "), sag: <span className="text-[12px] tabular-nums text-white/40">{saatOrnek(z)}</span> }))} />
        </Satir>
        <Satir id="tarih" ad="Tarih biçimi">
          <Segment deger={b.tarih} onSec={(v) => setB({ tarih: v })} kucuk secenekler={[{ deger: "gun", ad: tarihOrnek.gun }, { deger: "uzun", ad: tarihOrnek.uzun }, { deger: "iso", ad: tarihOrnek.iso }]} />
        </Satir>
        <Satir ad="Haftanın ilk günü">
          <Segment deger={b.hafta} onSec={(v) => setB({ hafta: v })} secenekler={[{ deger: "pzt", ad: "Pazartesi" }, { deger: "paz", ad: "Pazar" }]} />
        </Satir>
      </Grup>

      <Grup id="kisayollar" baslik="Klavye kısayolları" aciklama="Bir yazı alanında değilken tek tuşla bölümler arasında geç. ? tuşu listeyi açar.">
        <Satir ad="Tek tuş kısayolları" alt={t.kisayollar ? "Açık" : "Kapalı. Arama (Ctrl K) her zaman çalışır."}>
          <Anahtar acik={t.kisayollar} onDegis={(v) => t.gorunumAyarla({ kisayollar: v })} etiket="Tek tuş kısayolları" />
        </Satir>
        <motion.div initial={false} animate={{ opacity: t.kisayollar ? 1 : 0.4 }} className="grid gap-x-6 px-6 py-3 sm:grid-cols-2">
          {[...gecisler, { tus: "?", ad: "Kısayol listesi", href: "" }].map((g) => (
            <div key={g.tus} className="flex items-center justify-between border-b border-white/[0.05] py-2.5 text-[14px] last:border-0 sm:[&:nth-last-child(2)]:border-0">
              <span className="text-white/70">{g.ad}</span>
              <kbd className="flex h-7 min-w-7 items-center justify-center rounded-[8px] bg-white/[0.07] px-2 font-sans text-[12.5px] font-medium text-white shadow-[inset_0_-1.5px_0_rgba(255,255,255,0.08)]">{g.tus.toUpperCase()}</kbd>
            </div>
          ))}
        </motion.div>
        <Satir ad="Arama" alt="Her yerden">
          <span className="flex gap-1">{["Ctrl", "K"].map((k) => <kbd key={k} className="flex h-7 min-w-7 items-center justify-center rounded-[8px] bg-white/[0.07] px-2 font-sans text-[12.5px] font-medium text-white shadow-[inset_0_-1.5px_0_rgba(255,255,255,0.08)]">{k}</kbd>)}</span>
        </Satir>
      </Grup>

    </Sayfa>
  );
}
