"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Share2, Target, Trophy, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEarn, tl } from "@/store/useEarn";
import { SayfaBaslik, Kart, DurumRozet, cn } from "@/components/earn/UI";

/* Başvurular & Takip — tüm gönderim/başvuruların tek yerden durum takibi + zaman çizelgesi. */

type Kayit = { id: string; tur: string; ikon: typeof Share2; baslik: string; alt: string; kredi: number; durum: string; tarih: number; redNedeni?: string };

const AKIS = ["taslak", "inceleniyor", "onaylandi", "odendi"];

export default function Basvurular() {
  const s = useEarn();
  const [filtre, setFiltre] = useState<string>("hepsi");

  const kayitlar = useMemo<Kayit[]>(() => {
    const list: Kayit[] = [];
    s.paylasimlar.forEach((p) => list.push({ id: p.id, tur: "paylasim", ikon: Share2, baslik: `${p.platform} paylaşımı`, alt: `${p.goruntulenme.toLocaleString("tr-TR")} görüntülenme`, kredi: p.kredi, durum: p.durum, tarih: p.tarih, redNedeni: p.redNedeni }));
    s.gorevBasvurular.forEach((g) => list.push({ id: g.id, tur: "gorev", ikon: Target, baslik: g.baslik, alt: "Görev başvurusu", kredi: g.odul, durum: g.durum, tarih: g.tarih, redNedeni: g.redNedeni }));
    s.yarismaKatilimlar.forEach((y) => list.push({ id: y.id, tur: "yarisma", ikon: Trophy, baslik: y.ad, alt: "Yarışma katılımı", kredi: 0, durum: y.durum, tarih: y.tarih }));
    s.cekimler.forEach((c) => list.push({ id: c.id, tur: "cekim", ikon: Wallet, baslik: `Çekim · ${c.yontem}`, alt: c.hesap, kredi: -c.kredi, durum: c.durum, tarih: c.tarih, redNedeni: c.redNedeni }));
    return list.sort((a, b) => b.tarih - a.tarih);
  }, [s.paylasimlar, s.gorevBasvurular, s.yarismaKatilimlar, s.cekimler]);

  const suzulmus = filtre === "hepsi" ? kayitlar : kayitlar.filter((k) => k.durum === filtre);
  const say = (d: string) => kayitlar.filter((k) => k.durum === d).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Başvurular & Takip" ozet="Tüm gönderim, başvuru ve çekimlerinin durumunu buradan takip et." />

      {/* filtreler */}
      <div className="mb-5 flex flex-wrap gap-2">
        {[["hepsi", "Hepsi", kayitlar.length], ["inceleniyor", "İnceleniyor", say("inceleniyor")], ["onaylandi", "Onaylandı", say("onaylandi")], ["reddedildi", "Reddedildi", say("reddedildi")], ["odendi", "Ödendi", say("odendi")]].map(([k, ad, n]) => (
          <button key={k as string} onClick={() => setFiltre(k as string)} className={cn("rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors", filtre === k ? "bg-sky-400 text-[#04141a]" : "border border-white/[0.08] text-white/60 hover:text-white")}>
            {ad} <span className="opacity-60">{n as number}</span>
          </button>
        ))}
      </div>

      {suzulmus.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.1] py-16 text-center">
          <ClipboardList className="h-10 w-10 text-white/25" />
          <p className="text-sm text-white/50">Bu filtrede kayıt yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suzulmus.map((k) => {
            const adim = k.tur === "cekim" ? ["inceleniyor", "onaylandi", "odendi"] : AKIS;
            const aktifAdim = adim.indexOf(k.durum);
            const reddedildi = k.durum === "reddedildi";
            return (
              <Kart key={k.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10"><k.ikon className="h-4.5 w-4.5 text-sky-400" /></span>
                    <div>
                      <div className="font-semibold text-white">{k.baslik}</div>
                      <div className="text-xs text-white/45">{k.alt} · {new Date(k.tarih).toLocaleDateString("tr")}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <DurumRozet durum={k.durum} />
                    {k.kredi !== 0 && <div className={cn("mt-1 text-sm font-bold", k.kredi > 0 ? "text-sky-300" : "text-rose-300")}>{k.kredi > 0 ? "+" : ""}{k.kredi.toLocaleString("tr-TR")} kr</div>}
                  </div>
                </div>

                {/* zaman çizelgesi */}
                {!reddedildi ? (
                  <div className="mt-4 flex items-center gap-1">
                    {adim.map((a, i) => (
                      <div key={a} className="flex flex-1 items-center gap-1">
                        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]", i <= aktifAdim ? "bg-sky-400 text-[#04141a]" : "bg-white/[0.08] text-white/40")}>
                          {i < aktifAdim ? <CheckCircle2 className="h-3.5 w-3.5" /> : i === aktifAdim ? <Clock className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                        {i < adim.length - 1 && <div className={cn("h-0.5 flex-1 rounded", i < aktifAdim ? "bg-sky-400" : "bg-white/[0.08]")} />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/[0.08] px-3 py-2 text-xs text-rose-300">
                    <XCircle className="h-3.5 w-3.5" /> {k.redNedeni ?? "Reddedildi"}
                  </div>
                )}
              </Kart>
            );
          })}
        </div>
      )}
    </div>
  );
}
