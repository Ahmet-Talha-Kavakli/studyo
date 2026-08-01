"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Coins, Calendar, ShieldCheck, ChevronDown, Trophy, Award } from "lucide-react";
import { TIERLER, GORUNTULENME_PAKETLERI, MIN_CEKIM, tl } from "@/store/useEarn";
import { SayfaBaslik, Kart, GlassIkon, cn } from "@/components/earn/UI";

const SSS = [
  { s: "Kazancım ne zaman onaylanır?", c: "Paylaşım ve görev teslimleri genelde 24-48 saat içinde moderasyon ekibince incelenir. Onaylandığında kredi bakiyene otomatik yatar." },
  { s: "Minimum çekim tutarı nedir?", c: `Minimum çekim ${MIN_CEKIM.toLocaleString("tr-TR")} kredi (${tl(MIN_CEKIM)}). Tier'in yükseldikçe çekim limitin de artar.` },
  { s: "Kredi ile nakit oranı nedir?", c: "1 kredi = 0,01 ₺ (100 kredi = 1 ₺). Bu oran sabittir ve tüm kazançlarda şeffafça uygulanır." },
  { s: "Paylaşımım neden reddedilebilir?", c: "Sahte görüntülenme, alakasız içerik, kanıt ekran görüntüsü eksikliği veya topluluk kurallarını ihlal reddedilme sebebidir. Red nedeni her zaman belirtilir." },
  { s: "Referans kazancı nasıl işler?", c: "Davet ettiğin kişi üretim yapınca 1. kademe (2.500 kredi + %10), onun davet ettiklerinden ise 2. kademe (%5) kazanırsın." },
  { s: "Ödemeler ne zaman yapılır?", c: "Çekim talepleri her hafta Salı ve Cuma günleri toplu işlenir. Onaylanan çekimler 1-3 iş günü içinde hesabına geçer." },
];

const ODEME_TAKVIM = [
  { gun: "Pazartesi", olay: "Haftalık performans kredileri hesaplanır" },
  { gun: "Salı", olay: "Çekim talepleri işlenir (1. parti)" },
  { gun: "Perşembe", olay: "Yarışma sonuçları ve ödül dağıtımı" },
  { gun: "Cuma", olay: "Çekim talepleri işlenir (2. parti)" },
];

export default function Bilgi() {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Bilgilendirmeler" ozet="Kazanç kuralları, ödül tabloları, ödeme takvimi ve sık sorulanlar." />

      {/* seviye tablosu */}
      <Kart className="mb-6">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-white"><Trophy className="h-4.5 w-4.5 text-sky-400" /> Seviyeler</h2>
        <p className="mb-3 text-sm text-white/50">Ne kadar çok üretir ve kazanırsan, seviyen o kadar yükselir. Yüksek seviyede kazancın katlanır, daha fazla para çekebilirsin.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TIERLER.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/[0.06] bg-[#14151799] p-3.5 backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <GlassIkon boyut={34}><Award className="h-4 w-4" /></GlassIkon>
                <span className="font-bold text-white">{t.ad}</span>
              </div>
              <div className="mt-2 space-y-0.5 text-[12px] text-white/55">
                <div>Kazanç <span className="font-semibold text-sky-300">×{t.carpan}</span> katına çıkar</div>
                <div>{tl(t.cekimLimiti)}'ye kadar çekim</div>
              </div>
            </div>
          ))}
        </div>
      </Kart>

      {/* ödül tablosu */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Kart>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-white"><Coins className="h-4.5 w-4.5 text-sky-400" /> Görüntülenme Ödülleri</h2>
          <div className="space-y-2">
            {GORUNTULENME_PAKETLERI.map((p) => (
              <div key={p.esik} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <span className="text-white/70">{p.ad} görüntülenme</span>
                <span className="font-bold text-sky-300">+{p.kredi.toLocaleString("tr-TR")} kr</span>
              </div>
            ))}
          </div>
        </Kart>
        <Kart>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-white"><Calendar className="h-4.5 w-4.5 text-sky-400" /> Ödeme Takvimi</h2>
          <div className="space-y-2">
            {ODEME_TAKVIM.map((o) => (
              <div key={o.gun} className="flex gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <span className="w-24 shrink-0 font-semibold text-sky-300">{o.gun}</span>
                <span className="text-white/60">{o.olay}</span>
              </div>
            ))}
          </div>
        </Kart>
      </div>

      {/* SSS */}
      <Kart>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-white"><Info className="h-4.5 w-4.5 text-sky-400" /> Sık Sorulanlar</h2>
        <div className="divide-y divide-white/[0.05]">
          {SSS.map((f, i) => (
            <div key={i}>
              <button onClick={() => setAcik(acik === i ? null : i)} className="flex w-full items-center justify-between gap-3 py-3 text-left">
                <span className="text-sm font-medium text-white">{f.s}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", acik === i && "rotate-180")} />
              </button>
              {acik === i && <p className="pb-3 text-sm leading-relaxed text-white/55">{f.c}</p>}
            </div>
          ))}
        </div>
      </Kart>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-[#14151799] backdrop-blur-xl px-4 py-3.5">
        <div className="flex items-center gap-2 text-sm text-white/60"><ShieldCheck className="h-4 w-4 text-sky-400" /> Sorun mu var? Destek ekibimiz yardımcı olur.</div>
        <Link href="/earn/destek" className="rounded-xl bg-sky-400 px-3.5 py-2 text-sm font-bold text-[#04141a] hover:bg-sky-300">Destek Al</Link>
      </div>
    </div>
  );
}
