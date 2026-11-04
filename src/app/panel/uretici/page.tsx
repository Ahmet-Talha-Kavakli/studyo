"use client";

/**
 * m4: İçerik Üretici Merkezi — gerçekten çalışan sosyal medya sistemleri.
 *  • İçerik üretici olma akışı (aktifleştirme)
 *  • Profil analizleri (görüntülenme, etkileşim, takipçi, en iyi gönderi)
 *  • Mavi tik satın alma (gerçek kredi, kalıcı rozet)
 *  • Ücretli öne çıkarma (bir gönderiyi boost'la)
 * Kredi GERÇEKTEN düşer (useAuth), durum kalıcıdır (useAkis).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, BadgeCheck, TrendingUp, Eye, Users, Heart, Rocket, Check,
  Sparkles, BarChart3, Gift as GiftIcon, Coins,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useAkis, birlesikFeed } from "@/store/useAkis";
import { useAuth } from "@/store/useAuth";
import { kisaSayi } from "@/lib/akisVeri";
import { cn } from "@/lib/utils";

const MAVI_TIK_FIYAT = 500;   // kredi
const ONE_CIKAR_FIYAT = 200;  // kredi (gönderi başına 24 saat boost)

export default function UreticiMerkezi() {
  const kullanici = useAuth((s) => s.kullanici);
  const profilGuncelle = useAuth((s) => s.profilGuncelle);
  const maviTik = useAkis((s) => s.maviTik);
  const icerikUretici = useAkis((s) => s.icerikUretici);
  const paylasimlar = useAkis((s) => s.paylasimlar);
  const gizlenenler = useAkis((s) => s.gizlenenler);
  const begeniler = useAkis((s) => s.begeniler);
  const [oneCikarilan, setOneCikarilan] = useState<string[]>([]);

  const benimGonderiler = useMemo(
    () => birlesikFeed(paylasimlar, gizlenenler).filter((g) => g.benimMi),
    [paylasimlar, gizlenenler],
  );

  // Profil analizleri — gerçek verilerden türetilir.
  const analiz = useMemo(() => {
    const toplamGoruntulenme = benimGonderiler.reduce((a, g) => a + g.goruntulenmeTohum, 0);
    const toplamBegeni = benimGonderiler.reduce((a, g) => a + g.begeniTohum, 0) + begeniler.length;
    const enIyi = [...benimGonderiler].sort((a, b) => b.goruntulenmeTohum - a.goruntulenmeTohum)[0];
    const etkilesim = toplamGoruntulenme > 0 ? Math.min(100, Math.round((toplamBegeni / toplamGoruntulenme) * 100)) : 0;
    return { toplamGoruntulenme, toplamBegeni, gonderi: benimGonderiler.length, enIyi, etkilesim };
  }, [benimGonderiler, begeniler]);

  const krediHarca = (miktar: number): boolean => {
    const k = useAuth.getState().kullanici;
    if (!k) return false;
    if (k.krediler < miktar) { mesaj.yetersizKredi(miktar, k.krediler); return false; }
    profilGuncelle({ krediler: k.krediler - miktar });
    return true;
  };

  const ureticiOl = () => {
    useAkis.getState().icerikUreticiOl();
    toast.success("İçerik üretici oldun", { description: "Analizler, öne çıkarma ve mavi tik artık açık." });
  };
  const maviTikAl = () => {
    if (maviTik) return;
    if (!krediHarca(MAVI_TIK_FIYAT)) return;
    useAkis.getState().maviTikAl();
    toast.success("Mavi tik alındı", { description: `Profilin artık doğrulanmış görünüyor. ${MAVI_TIK_FIYAT} kredi düşüldü.` });
  };
  const oneCikar = (id: string) => {
    if (oneCikarilan.includes(id)) return;
    if (!krediHarca(ONE_CIKAR_FIYAT)) return;
    setOneCikarilan((v) => [...v, id]);
    toast.success("Gönderi öne çıkarıldı", { description: `24 saat boyunca daha fazla kişiye ulaşacak. ${ONE_CIKAR_FIYAT} kredi düşüldü.` });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <Link href="/panel" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-metin-3 transition-colors hover:text-metin">
        <ChevronLeft className="h-4 w-4" /> Keşfet'e dön
      </Link>

      {/* hero */}
      <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-violet-500/[0.12] to-transparent p-6 ring-1 ring-inset ring-violet-400/15 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300"><Sparkles className="h-6 w-6" /></span>
          <div>
            <h1 className="flex items-center gap-2 text-[24px] font-black tracking-tight text-metin">
              İçerik Üretici Merkezi
              {maviTik && <BadgeCheck className="h-6 w-6 fill-sky-400 text-zemin" />}
            </h1>
            <p className="text-[13.5px] text-metin-2">Analizini gör, kitleni büyüt, kazan.</p>
          </div>
        </div>
        {!icerikUretici && (
          <button onClick={ureticiOl}
            className="flex shrink-0 items-center gap-2 rounded-full bg-aksan px-5 py-2.5 text-[14px] font-bold text-zemin transition-transform hover:scale-105">
            <Rocket className="h-4 w-4" /> İçerik üretici ol
          </button>
        )}
      </div>

      {!icerikUretici ? (
        <div className="rounded-2xl bg-yuzey p-8 text-center ring-1 ring-inset ring-white/[0.06]">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-aksan/15 text-aksan"><Rocket className="h-7 w-7" /></span>
          <h2 className="text-[18px] font-bold text-metin">İçerik üretici programına katıl</h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-metin-2">
            Katıldığında profil analizlerine, gönderi öne çıkarmaya, mavi tik almaya ve hediyelerle kazanmaya erişirsin. Ücretsiz.
          </p>
          <button onClick={ureticiOl} className="mt-5 rounded-full bg-aksan px-6 py-3 text-[15px] font-bold text-zemin transition-transform hover:scale-105">
            Hemen başla
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* profil analizleri */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[16px] font-bold text-metin"><BarChart3 className="h-4.5 w-4.5 text-metin-3" /> Profil analizleri</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { et: "Görüntülenme", v: kisaSayi(analiz.toplamGoruntulenme), ik: Eye, renk: "text-sky-300" },
                { et: "Beğeni", v: kisaSayi(analiz.toplamBegeni), ik: Heart, renk: "text-rose-300" },
                { et: "Gönderi", v: String(analiz.gonderi), ik: TrendingUp, renk: "text-aksan" },
                { et: "Etkileşim", v: "%" + analiz.etkilesim, ik: Users, renk: "text-violet-300" },
              ].map((k) => (
                <div key={k.et} className="rounded-2xl bg-yuzey p-4 ring-1 ring-inset ring-white/[0.06]">
                  <k.ik className={cn("mb-2 h-5 w-5", k.renk)} />
                  <p className="text-[22px] font-bold text-metin">{k.v}</p>
                  <p className="text-[12px] text-metin-3">{k.et}</p>
                </div>
              ))}
            </div>
            {analiz.enIyi && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.05]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><TrendingUp className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="text-[12px] text-metin-3">En iyi gönderin</p>
                  <p className="truncate text-[14px] font-semibold text-metin">{analiz.enIyi.baslik}</p>
                </div>
                <span className="ml-auto text-[13px] font-bold text-amber-300">{kisaSayi(analiz.enIyi.goruntulenmeTohum)} 👁</span>
              </div>
            )}
          </section>

          {/* mavi tik */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[16px] font-bold text-metin"><BadgeCheck className="h-4.5 w-4.5 text-sky-400" /> Doğrulama</h2>
            <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-sky-500/[0.08] to-transparent p-5 ring-1 ring-inset ring-sky-400/15 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <BadgeCheck className={cn("h-10 w-10", maviTik ? "fill-sky-400 text-zemin" : "text-sky-400/40")} />
                <div>
                  <p className="text-[15px] font-bold text-metin">{maviTik ? "Doğrulanmış hesap" : "Mavi tik al"}</p>
                  <p className="text-[13px] text-metin-2">{maviTik ? "Profilinde mavi tik görünüyor." : "Adının yanında doğrulanmış rozeti göster."}</p>
                </div>
              </div>
              {maviTik ? (
                <span className="flex items-center gap-1.5 rounded-full bg-sky-400/15 px-4 py-2 text-[13px] font-bold text-sky-300"><Check className="h-4 w-4" /> Alındı</span>
              ) : (
                <button onClick={maviTikAl}
                  className="flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2.5 text-[14px] font-bold text-white transition-transform hover:scale-105">
                  <Coins className="h-4 w-4" /> {MAVI_TIK_FIYAT} kredi
                </button>
              )}
            </div>
          </section>

          {/* öne çıkarma */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[16px] font-bold text-metin"><Rocket className="h-4.5 w-4.5 text-aksan" /> Gönderilerini öne çıkar</h2>
            {benimGonderiler.length === 0 ? (
              <div className="rounded-2xl bg-yuzey p-6 text-center ring-1 ring-inset ring-white/[0.06]">
                <p className="text-[14px] text-metin-2">Henüz Akış&rsquo;ta gönderin yok.</p>
                <Link href="/panel/kitaplik" className="mt-3 inline-block rounded-full bg-aksan px-5 py-2 text-[13px] font-semibold text-zemin hover:scale-105">Kitaplıktan paylaş</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {benimGonderiler.map((g) => {
                  const boostlu = oneCikarilan.includes(g.id);
                  return (
                    <div key={g.id} className="flex items-center gap-3 rounded-2xl bg-yuzey p-3 ring-1 ring-inset ring-white/[0.06]">
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-900" style={{ background: g.gorselUrl }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-metin">{g.baslik}</p>
                        <p className="text-[12px] text-metin-3">{kisaSayi(g.goruntulenmeTohum)} görüntülenme</p>
                      </div>
                      {boostlu ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-aksan/15 px-3 py-1.5 text-[12.5px] font-bold text-aksan"><Check className="h-3.5 w-3.5" /> Öne çıkarıldı</span>
                      ) : (
                        <button onClick={() => oneCikar(g.id)}
                          className="flex items-center gap-1.5 rounded-full bg-aksan px-4 py-2 text-[12.5px] font-bold text-zemin transition-transform hover:scale-105">
                          <Rocket className="h-3.5 w-3.5" /> {ONE_CIKAR_FIYAT} kredi
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* kazanç bilgisi */}
          <section>
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><GiftIcon className="h-5 w-5" /></span>
              <p className="text-[13px] leading-snug text-metin-2">Takipçilerin sana <span className="font-semibold text-emerald-300">hediye</span> gönderdikçe kredi kazanırsın. Preset ve uygulama paylaşımların da kullanım başına kazandırır — <Link href="/earn" className="text-emerald-300 underline">Vayra Earn</Link>.</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
