"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Video, Heart, MessageCircle, Eye, TrendingUp, Wallet } from "lucide-react";
import { useEarn, tierBul, tl } from "@/store/useEarn";
import { useFlow } from "@/store/useFlow";
import { toast } from "@/lib/toast";
import { SayfaBaslik, Kart, MetrikKart, GlassIkon, YesilDugme, cn } from "@/components/earn/UI";
import { AlanGrafik } from "@/components/earn/Grafik";

/* Flow İçerik Performansı — Flow'da paylaştığın içeriğin metriğine göre kazanç.
   Kazanç formülü (şeffaf): görüntülenme×0.5 + beğeni×2 + yorum×5 kredi (tier çarpanıyla). */

const KATSAYI = { goruntulenme: 0.5, begeni: 2, yorum: 5 };

export default function FlowPerformans() {
  const s = useEarn();
  const flow = useFlow();
  const tier = tierBul(s.xp);

  // Kullanıcının Flow'da paylaştığı gönderiler (benimGonderilerim)
  const icerikler = useMemo(() => {
    return flow.benimGonderilerim.map((g, i) => {
      // deterministik sahte metrik (paylaşım id'sinden)
      let h = 0; for (const c of g.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const goruntulenme = 2000 + (h % 48000);
      const begeni = Math.round(goruntulenme * (0.04 + (h % 6) / 100));
      const yorum = Math.round(begeni * 0.08);
      const hamKredi = goruntulenme * KATSAYI.goruntulenme + begeni * KATSAYI.begeni + yorum * KATSAYI.yorum;
      const kredi = Math.round(hamKredi * tier.carpan / 100); // ölçekle
      return { ...g, goruntulenme, begeni, yorum, kredi };
    });
  }, [flow.benimGonderilerim, tier.carpan]);

  const toplamKredi = icerikler.reduce((a, c) => a + c.kredi, 0);
  const toplamGor = icerikler.reduce((a, c) => a + c.goruntulenme, 0);
  const toplamBeg = icerikler.reduce((a, c) => a + c.begeni, 0);
  const aktarilabilir = Math.max(0, toplamKredi - s.flowAktarilan);

  const aktar = () => {
    if (aktarilabilir <= 0) { toast.error("Aktarılacak yeni kazanç yok."); return; }
    s.flowKazancAktar(aktarilabilir);
    toast.success(`${tl(aktarilabilir)} bakiyene aktarıldı`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Flow İçerik Performansı" ozet="Flow'da ürettiğin içeriğin performansına göre kredi kazanırsın." />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Bu içeriklerden" deger={tl(toplamKredi)} alt={`${toplamKredi.toLocaleString("tr-TR")} kredi`} ikon={<TrendingUp className="h-4 w-4" />} vurgu />
        <MetrikKart etiket="Toplam görüntülenme" deger={toplamGor.toLocaleString("tr-TR")} ikon={<Eye className="h-4 w-4" />} />
        <MetrikKart etiket="Toplam beğeni" deger={toplamBeg.toLocaleString("tr-TR")} ikon={<Heart className="h-4 w-4" />} />
        <MetrikKart etiket="İçerik sayısı" deger={String(icerikler.length)} ikon={<Video className="h-4 w-4" />} />
      </div>

      {/* aktarım şeridi — kazancı bakiyeye geçir (kopukluk çözümü) */}
      {icerikler.length > 0 && (
        <Kart className="mb-6 !border-sky-400/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <GlassIkon boyut={44} aktif><Wallet className="h-4.5 w-4.5" /></GlassIkon>
              <div>
                <div className="font-semibold text-white">{aktarilabilir > 0 ? `${tl(aktarilabilir)} aktarmaya hazır` : "Tüm kazancın aktarıldı"}</div>
                <div className="text-xs text-white/50">{aktarilabilir > 0 ? "İçeriklerinden biriken kazancı çekilebilir bakiyene geçir." : `Şimdiye dek ${tl(s.flowAktarilan)} aktardın.`}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <YesilDugme onClick={aktar} disabled={aktarilabilir <= 0}>Bakiyeye Aktar</YesilDugme>
              <Link href="/earn/basvurular" className="text-sm font-semibold text-sky-400 hover:text-sky-300">Takip →</Link>
            </div>
          </div>
        </Kart>
      )}

      {/* kazanç formülü */}
      <Kart className="mb-6">
        <h2 className="mb-2 font-bold text-white">Kazanç formülü (şeffaf)</h2>
        <div className="flex flex-wrap gap-3 text-sm text-white/60">
          <span className="rounded-lg bg-white/[0.04] px-3 py-1.5"><Eye className="mr-1 inline h-3.5 w-3.5" /> Görüntülenme × {KATSAYI.goruntulenme}</span>
          <span className="rounded-lg bg-white/[0.04] px-3 py-1.5"><Heart className="mr-1 inline h-3.5 w-3.5" /> Beğeni × {KATSAYI.begeni}</span>
          <span className="rounded-lg bg-white/[0.04] px-3 py-1.5"><MessageCircle className="mr-1 inline h-3.5 w-3.5" /> Yorum × {KATSAYI.yorum}</span>
          <span className="rounded-lg bg-sky-500/[0.1] px-3 py-1.5 text-sky-300">Tier çarpanı × {tier.carpan}</span>
        </div>
      </Kart>

      {/* içerik listesi */}
      <Kart>
        <h2 className="mb-4 font-bold text-white">İçeriklerim</h2>
        {icerikler.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Video className="h-9 w-9 text-white/25" />
            <p className="text-sm text-white/50">Henüz Flow'da içerik paylaşmadın.</p>
            <Link href="/flow/olustur" className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-[#04141a] hover:bg-sky-300">Flow'da içerik üret</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {icerikler.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-3">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-sky-500/10" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">{c.aciklama || "Vayra üretimi"}</div>
                  <div className="mt-0.5 flex gap-3 text-[11px] text-white/40">
                    <span><Eye className="mr-0.5 inline h-3 w-3" />{c.goruntulenme.toLocaleString("tr-TR")}</span>
                    <span><Heart className="mr-0.5 inline h-3 w-3" />{c.begeni.toLocaleString("tr-TR")}</span>
                    <span><MessageCircle className="mr-0.5 inline h-3 w-3" />{c.yorum}</span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-sky-300">+{c.kredi.toLocaleString("tr-TR")}</span>
              </div>
            ))}
          </div>
        )}
      </Kart>
    </div>
  );
}
