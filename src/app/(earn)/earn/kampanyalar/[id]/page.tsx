"use client";

/**
 * Kampanya detayı (2026-10-29, seçilen "C · Adım adım"): kompakt videolu poster başlık, dört adımlı yolculuk
 * (Katıl, Vayra'da üret, Paylaş, Bağlantını gönder; gerçek durumla işaretlenir), bu kampanyadaki gönderilerin
 * (açılır durum satırları), sağda yapışkan kazanç merdiveni. Giriş kapısı, gönderim akışı, kota ve itiraz korunur.
 */

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEarn, cuzdan } from "@/store/useEarn";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { kampanyaBul, bittiMi } from "@/lib/earn/kampanyalar";
import { useSimdi } from "@/components/earn/ortak";
import { KazancMerdiveni, Yolculuk, YolculukBaslik } from "@/components/earn/kampanya/Yolculuk";
import { GonderiTablosu } from "@/components/earn/kampanya/GonderiTablosu";
import { toast } from "@/lib/toast";

export default function KampanyaDetay() {
  const { id } = useParams<{ id: string }>();
  const simdi = useSimdi();
  const k = kampanyaBul(id, simdi);
  const s = useEarn();
  const girisli = useAuth((a) => a.girisYapildi);
  const kapi = useAuthKapi((a) => a.kapiKontrol);
  if (!k) notFound();

  const katildi = s.katilimlar.includes(k.id) && !!s.sahip;
  const bitti = bittiMi(k, simdi);
  const benim = s.gonderiler.filter((g) => g.kampanyaId === k.id).sort((a, b) => b.tarih - a.tarih);
  const bonus = cuzdan(s, simdi).seviye.bonus;
  const katil = () => kapi(() => { useEarn.getState().katil(k.id); toast.success("Kampanyaya katıldın", { description: "Üretim kiti açıldı; istemler ikinci adımda." }); },
    { baslik: "Katılmak için giriş yap", altBaslik: "Ücretsiz hesabınla kampanyalara katıl, ürettiğinle kazan." });

  return (
    <div>
      <Link href="/earn/kampanyalar" className="group mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-white/55 transition hover:text-white"><ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />Kampanyalar</Link>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <YolculukBaslik k={k} simdi={simdi} katildi={katildi} bitti={bitti} />
          <div className="mt-12"><Yolculuk k={k} katildi={katildi} bitti={bitti} girisli={girisli} benim={benim} hesaplar={s.hesaplar} gonderiler={s.gonderiler} katil={katil} /></div>
          {benim.length > 0 && (
            <section className="mt-14">
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-white">Bu kampanyadaki gönderilerin</h2>
                <Link href="/earn/gonderiler" className="flex items-center gap-1 text-[13.5px] font-medium text-white/60 transition hover:text-white">Tümü<ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
              <GonderiTablosu satirlar={benim} simdi={simdi} bonus={bonus} />
            </section>
          )}
        </div>
        <aside className="lg:sticky lg:top-[calc(var(--ust-nav)+24px)] lg:self-start">
          <KazancMerdiveni k={k} benim={benim} simdi={simdi} bonus={bonus} />
        </aside>
      </div>
    </div>
  );
}
