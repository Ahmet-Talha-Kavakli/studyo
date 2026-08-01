"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, Banknote, ArrowDownToLine, TrendingUp, Clock } from "lucide-react";
import { useEarn, bakiye, bekleyen, toplamKazanc, tierBul, tl, KREDI_TL, MIN_CEKIM, type Cekim } from "@/store/useEarn";
import { SayfaBaslik, Kart, MetrikKart, DurumRozet, YesilDugme, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

const YONTEMLER: { id: Cekim["yontem"]; ad: string; ipucu: string }[] = [
  { id: "IBAN", ad: "IBAN", ipucu: "TR__ ____ ____ ____ ____ __" },
  { id: "PayPal", ad: "PayPal", ipucu: "e-posta adresi" },
  { id: "Papara", ad: "Papara", ipucu: "Papara numarası" },
];

export default function Cuzdan() {
  const s = useEarn();
  const bak = bakiye(s.hareketler, s.cekimler);
  const bek = bekleyen(s.hareketler);
  const toplam = toplamKazanc(s.hareketler);
  const tier = tierBul(s.xp);

  const [tutar, setTutar] = useState("");
  const [yontem, setYontem] = useState<Cekim["yontem"]>("IBAN");
  const [hesap, setHesap] = useState("");

  const kredi = parseInt(tutar.replace(/\D/g, "")) || 0;
  const yeterli = kredi >= MIN_CEKIM && kredi <= bak && kredi <= tier.cekimLimiti;

  const cek = () => {
    if (kredi < MIN_CEKIM) { toast.error(`Minimum çekim ${MIN_CEKIM.toLocaleString("tr-TR")} kredi (${tl(MIN_CEKIM)}).`); return; }
    if (kredi > bak) { toast.error("Bakiyen yetersiz."); return; }
    if (kredi > tier.cekimLimiti) { toast.error(`${tier.ad} tier çekim limiti ${tier.cekimLimiti.toLocaleString("tr-TR")} kredi.`); return; }
    if (!hesap.trim()) { toast.error("Hesap bilgisini gir."); return; }
    const ok = s.cekimTalep(kredi, yontem, hesap.trim());
    if (ok) { toast.success(`${tl(kredi)} çekim talebin alındı — 1-3 iş günü içinde ödenir.`); setTutar(""); setHesap(""); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Cüzdan & Çekim" ozet="Kazancını yönet, eşiği geçince nakde çevir. 1 kredi = 0,01 ₺." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Çekilebilir" deger={tl(bak)} alt={`${bak.toLocaleString("tr-TR")} kredi`} ikon={<Wallet className="h-4 w-4" />} vurgu />
        <MetrikKart etiket="Onay bekleyen" deger={tl(bek)} ikon={<Clock className="h-4 w-4" />} />
        <MetrikKart etiket="Toplam kazanç" deger={tl(toplam)} ikon={<TrendingUp className="h-4 w-4" />} />
        <MetrikKart etiket="Tier çekim limiti" deger={tl(tier.cekimLimiti)} alt={`${tier.rozet} ${tier.ad}`} ikon={<Banknote className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* çekim talebi */}
        <Kart>
          <h2 className="mb-4 flex items-center gap-2 font-bold text-white"><ArrowDownToLine className="h-4.5 w-4.5 text-sky-400" /> Para Çek</h2>

          <label className="mb-1.5 block text-xs font-semibold text-white/60">Çekilecek tutar (kredi)</label>
          <input value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder={`min ${MIN_CEKIM.toLocaleString("tr-TR")}`} inputMode="numeric" className="mb-1 h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-white/40">= {tl(kredi)}</span>
            <button onClick={() => setTutar(String(Math.min(bak, tier.cekimLimiti)))} className="font-semibold text-sky-400">Tümü ({tl(Math.min(bak, tier.cekimLimiti))})</button>
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-white/60">Ödeme yöntemi</label>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {YONTEMLER.map((y) => (
              <button key={y.id} onClick={() => setYontem(y.id)} className={cn("rounded-xl border py-2 text-xs font-semibold", yontem === y.id ? "border-sky-400/40 bg-sky-500/10 text-white" : "border-white/[0.08] text-white/50")}>{y.ad}</button>
            ))}
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-white/60">{YONTEMLER.find((y) => y.id === yontem)?.ad} bilgisi</label>
          <input value={hesap} onChange={(e) => setHesap(e.target.value)} placeholder={YONTEMLER.find((y) => y.id === yontem)?.ipucu} className="mb-4 h-11 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />

          {bak < MIN_CEKIM && (
            <Link href="/earn/yollar" className="mb-3 flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/[0.06] px-3.5 py-2.5 text-sm">
              <span className="text-amber-200">Çekim için <b>{(MIN_CEKIM - bak).toLocaleString("tr-TR")} kredi</b> daha kazan</span>
              <span className="font-semibold text-amber-300">Kazan →</span>
            </Link>
          )}
          <YesilDugme onClick={cek} disabled={!yeterli || !hesap.trim()} className="w-full">Çekim Talebi Oluştur</YesilDugme>
          <p className="mt-2 text-center text-[11px] text-white/35">Min. {MIN_CEKIM.toLocaleString("tr-TR")} kredi · 1-3 iş günü · komisyonsuz</p>
        </Kart>

        {/* çekim geçmişi */}
        <Kart>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Çekim geçmişi</h2>
            {s.cekimler.length > 0 && <Link href="/earn/basvurular" className="text-sm font-semibold text-sky-400 hover:text-sky-300">Takip →</Link>}
          </div>
          {s.cekimler.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/40">Henüz çekim yapmadın.</p>
          ) : (
            <div className="space-y-2">
              {s.cekimler.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/[0.06] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{tl(c.kredi)}</div>
                      <div className="text-[11px] text-white/40">{c.yontem} · {new Date(c.tarih).toLocaleDateString("tr")}</div>
                    </div>
                    <DurumRozet durum={c.durum} />
                  </div>
                  {c.redNedeni && <div className="mt-1.5 text-[11px] text-rose-300">{c.redNedeni}</div>}
                </div>
              ))}
            </div>
          )}
        </Kart>
      </div>
    </div>
  );
}
