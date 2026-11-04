"use client";

/**
 * Kampanya detayı "Adım adım" yolculuğu (2026-10-29, seçilen C): kompakt videolu poster başlık,
 * dört adım (Katıl, Vayra'da üret, Paylaş, Bağlantını gönder) gerçek duruma göre işaretlenir ve çizgi dolar;
 * her adımın içeriği yerinde. Sağda yapışkan "bu kampanyadan kazancın" + türe göre ödeme merdiveni.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Copy, Film, Hash, Lock, Sparkles, Timer, Trophy, Users, Wand2 } from "lucide-react";
import { KURALLAR, TUR_AD, kisaSayi, platformBul, tl, type Kampanya } from "@/lib/earn/kampanyalar";
import { gonderiHesap, kampanyaHakki, type BagliHesap, type Gonderi } from "@/store/useEarn";
import { kopyala } from "@/lib/gercekEylem";
import { PlatformLogo } from "../ortak";
import { KampanyaKapak, kampanyaOdul, tarihMetni } from "../PosterKart";
import { GonderimAkisi } from "./GonderimAkisi";
import { Sayac, ease } from "./parcalar";
import { cn } from "@/lib/utils";

const GUN = 86_400_000;
const ikonu = (g: string) => (/etiket|#|@/i.test(g) ? Hash : /gün|yayında|süre/i.test(g) ? Timer : /saniye|format|9:16|dikey/i.test(g) ? Film : Sparkles);

export function YolculukBaslik({ k, simdi, katildi, bitti }: { k: Kampanya; simdi: number; katildi: boolean; bitti: boolean }) {
  const o = kampanyaOdul(k);
  const gun = Math.max(0, Math.ceil((k.bitis - simdi) / GUN));
  const oran = k.butce ? Math.min(1, (k.odenen ?? 0) / k.butce) : null;
  return (
    <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="flex gap-5 sm:gap-7">
      <div className="relative aspect-[3/4] w-[96px] shrink-0 self-start overflow-hidden rounded-[18px] sm:w-[168px] sm:rounded-[22px] bg-black ring-1 ring-white/[0.12]">
        <KampanyaKapak k={k} oynat={!bitti} className={cn(bitti && "grayscale-[60%]")} />
        <span className="absolute left-2 top-2 flex gap-1 rounded-full bg-black/45 px-1.5 py-1 backdrop-blur-md">{k.platformlar.map((p) => <PlatformLogo key={p} id={p} boyut={12} />)}</span>
      </div>
      <div className="min-w-0 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="rounded-full bg-white/[0.08] px-2.5 py-1 font-medium text-white ring-1 ring-white/[0.1]">{TUR_AD[k.tur]}</span>
          <span className="text-white/50">{k.kategori}</span>
          {bitti ? <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-white/65">Sona erdi</span>
            : katildi && <span className="flex items-center gap-1 rounded-full bg-[#55d6fd]/15 px-2.5 py-1 font-medium text-[#8fe6ff] ring-1 ring-[#55d6fd]/30"><Check className="h-3 w-3" strokeWidth={3} />Katıldın</span>}
        </div>
        <h1 className="mt-2.5 text-[24px] font-semibold leading-[1.1] tracking-[-0.035em] text-white sm:text-[38px]">{k.ad}</h1>
        <p className="mt-2 hidden max-w-[560px] text-[15px] leading-relaxed text-white/60 sm:block">{k.ozet}</p>
        <dl className="mt-4 flex flex-wrap items-end gap-x-7 gap-y-3">
          <div><dt className="text-[12px] text-white/50">Ödeme</dt><dd className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[28px]">{o.deger}<span className="ml-1.5 text-[12.5px] font-normal tracking-normal text-white/50">{o.birim}</span></dd></div>
          <div><dt className="text-[12px] text-white/50">{bitti ? "Bitti" : "Bitiş"}</dt><dd className="text-[17px] font-semibold text-white">{tarihMetni(k.bitis)}<span className="ml-1.5 text-[12.5px] font-normal text-white/50">{bitti ? "" : `${gun} gün kaldı`}</span></dd></div>
          <div><dt className="text-[12px] text-white/50">Katılımcı</dt><dd className="flex items-center gap-1 text-[17px] font-semibold text-white"><Users className="h-4 w-4 text-white/45" />{kisaSayi(k.katilimci)}</dd></div>
        </dl>
        {oran !== null && !bitti && (
          <div className="mt-4 max-w-[340px]">
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} animate={{ width: `${oran * 100}%` }} transition={{ duration: 1, delay: 0.2, ease }} className="h-full rounded-full bg-gradient-to-r from-[#55d6fd] to-[#a5ecff]" /></div>
            <p className="mt-1.5 text-[12px] text-white/50">Bütçeden {tl(k.butce! - (k.odenen ?? 0))} kaldı · toplam {tl(k.butce!)}</p>
          </div>
        )}
      </div>
    </motion.header>
  );
}

function KopyaHap({ metin }: { metin: string }) {
  return (
    <button onClick={() => { void kopyala(metin, `${metin} kopyalandı`); }}
      className="group inline-flex h-9 items-center gap-2 rounded-full bg-white/[0.06] pl-3.5 pr-3 text-[13.5px] font-medium text-white ring-1 ring-white/[0.1] transition hover:bg-white hover:text-black active:scale-[0.96]">
      {metin}<Copy className="h-3.5 w-3.5 text-white/45 transition group-hover:text-black/60" />
    </button>
  );
}

export function Yolculuk({ k, katildi, bitti, girisli, benim, hesaplar, gonderiler, katil }: {
  k: Kampanya; katildi: boolean; bitti: boolean; girisli: boolean; benim: Gonderi[]; hesaplar: BagliHesap[]; gonderiler: Gonderi[]; katil: () => void;
}) {
  const hak = kampanyaHakki(k, gonderiler);
  const gonderdi = benim.length > 0;
  const adimlar = [{ ad: "Katıl", tamam: katildi }, { ad: "Vayra'da üret", tamam: gonderdi }, { ad: "Paylaş", tamam: gonderdi }, { ad: "Bağlantını gönder", tamam: gonderdi }];
  const aktif = bitti ? -1 : adimlar.findIndex((a) => !a.tamam);
  const dolu = aktif < 0 ? (bitti ? adimlar.filter((a) => a.tamam).length / adimlar.length : 1) : aktif / (adimlar.length - 1);

  return (
    <ol className="relative">
      <span className="absolute bottom-8 left-[19px] top-5 w-px bg-white/[0.08]" aria-hidden />
      <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: Math.min(1, dolu) }} transition={{ duration: 1.1, delay: 0.2, ease }} className="absolute bottom-8 left-[19px] top-5 w-px origin-top bg-gradient-to-b from-[#55d6fd] to-[#55d6fd]/40" aria-hidden />
      {adimlar.map((a, i) => {
        const su = i === aktif;
        const soluk = !su && !a.tamam;
        return (
          <motion.li key={a.ad} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.45, ease }} className="relative pb-12 pl-14 last:pb-0">
            <span className={cn("absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold transition-colors duration-500",
              a.tamam ? "bg-[#55d6fd] text-[#06222b]" : su ? "bg-white text-black" : "bg-[#141518] text-white/50 ring-1 ring-white/[0.1]")}>
              {a.tamam ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              {su && <span className="absolute inset-0 animate-ping rounded-full bg-white/20 [animation-duration:2.2s]" />}
            </span>
            <p className={cn("pt-2 text-[19px] font-semibold tracking-[-0.02em]", soluk ? "text-white/45" : "text-white")}>{a.ad}</p>

            <div className={cn("mt-4 transition-opacity duration-500", soluk && "opacity-55")}>
              {i === 0 && (
                <div className="rounded-[22px] bg-white/[0.03] p-5 ring-1 ring-white/[0.07]">
                  <p className="max-w-[620px] text-[15px] leading-[1.7] text-white/80">{k.brief}</p>
                  {bitti ? <p className="mt-4 text-[13.5px] text-white/55">Kampanya sona erdi; yeni katılım ve gönderi kabul edilmiyor.</p>
                    : katildi ? <p className="mt-4 flex items-center gap-2 text-[13.5px] text-[#8fe6ff]"><Check className="h-4 w-4" strokeWidth={3} />Katıldın; üretim kiti açıldı.</p>
                    : <button onClick={katil} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">{girisli ? "Kampanyaya katıl" : "Giriş yap ve katıl"}<ArrowRight className="h-4 w-4" /></button>}
                </div>
              )}

              {i === 1 && (k.kit.length ? (
                <div className="relative">
                  <div className={cn("grid gap-3 sm:grid-cols-2", !katildi && "pointer-events-none select-none")} aria-hidden={!katildi}>
                    {k.kit.map((x) => (
                      <div key={x.istem} className="group overflow-hidden rounded-[22px] bg-[#101114] ring-1 ring-white/[0.08]">
                        <div className="relative aspect-[16/9] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={x.gorsel ?? k.kapak} alt="" className={cn("h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]", !katildi && "blur-md")} />
                          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#101114] to-transparent" />
                        </div>
                        <div className="-mt-3 px-4 pb-4">
                          <p className={cn("relative line-clamp-3 text-[14px] leading-relaxed text-white/85", !katildi && "blur-[4px]")}>{x.istem}</p>
                          <div className="mt-3.5 flex gap-2">
                            <Link href={`${x.studyo}?istem=${encodeURIComponent(x.istem)}`} tabIndex={katildi ? 0 : -1} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"><Wand2 className="h-3.5 w-3.5" />Vayra&apos;da üret</Link>
                            <button onClick={() => { void kopyala(x.istem, "İstem kopyalandı"); }} tabIndex={katildi ? 0 : -1} aria-label="İstemi kopyala" className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 ring-1 ring-white/[0.14] transition hover:bg-white/[0.06] hover:text-white active:scale-95"><Copy className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!katildi && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex items-center gap-2 rounded-full bg-[#141518]/90 py-2 pl-3 pr-4 text-[13.5px] text-white ring-1 ring-white/[0.12] backdrop-blur-xl"><Lock className="h-4 w-4 text-white/70" />Kit katılınca açılır</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.07]">
                  <Wand2 className="h-4 w-4 text-white/55" /><p className="flex-1 text-[14px] text-white/65">Bu kampanyada hazır istem yok; brife uygun içeriği Vayra&apos;da kendin üret.</p>
                  {!bitti && <Link href={k.ciktiTurleri.includes("video") ? "/panel/video" : "/panel/gorsel"} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold leading-9 text-black transition hover:bg-white/90 active:scale-[0.97]">Stüdyoyu aç</Link>}
                </div>
              ))}

              {i === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {k.gereksinimler.map((g) => {
                      const I = ikonu(g);
                      return <div key={g} className="flex items-start gap-3 rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-white/[0.07]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><I className="h-4 w-4 text-white/80" /></span><span className="pt-1 text-[13.5px] leading-snug text-white/85">{g}</span></div>;
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[13px] text-white/50">Açıklamaya ekle</span>
                    {k.etiketler.map((e) => <KopyaHap key={e} metin={e} />)}
                    {k.etiketler.length > 1 && <button onClick={() => { void kopyala(k.etiketler.join(" "), "Tüm etiketler kopyalandı"); }} className="h-9 rounded-full px-3 text-[13px] font-medium text-white/55 transition hover:text-white">Hepsini kopyala</button>}
                  </div>
                </div>
              )}

              {i === 3 && (bitti ? (
                <div className="rounded-[20px] bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.07]"><p className="text-[14px] text-white/60">Gönderi kabulü kapandı.</p><Link href="/earn/kampanyalar" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Açık kampanyalar<ArrowRight className="h-3.5 w-3.5" /></Link></div>
              ) : !katildi ? (
                <div className="rounded-[20px] bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.07]">
                  <p className="text-[14px] text-white/60">Katıldıktan sonra bağlantını buradan gönderirsin. Kabul edilen platformlar:</p>
                  <div className="mt-3 flex flex-wrap gap-2">{k.platformlar.map((p) => {
                    const b = hesaplar.some((h) => h.platform === p && h.durum === "dogrulandi");
                    return <span key={p} className={cn("flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] ring-1", b ? "bg-white/[0.08] text-white ring-white/[0.16]" : "text-white/55 ring-white/[0.08]")}><PlatformLogo id={p} boyut={15} />{platformBul(p).ad}{b && <Check className="h-3.5 w-3.5 text-[#8fe6ff]" strokeWidth={3} />}</span>;
                  })}</div>
                </div>
              ) : !hak.hakKaldi || hak.kotaKalan === 0 ? (
                <div className="rounded-[20px] bg-white/[0.03] px-5 py-4 ring-1 ring-white/[0.07]"><p className="text-[14px] text-white/65">{hak.kotaKalan === 0 ? "Görev kontenjanı doldu; yeni teslim kabul edilmiyor." : "Bu kampanyada gönderi hakkını kullandın; sonucu Gönderilerim'den izle."}</p><Link href="/earn/gonderiler" className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Gönderilerim<ArrowRight className="h-3.5 w-3.5" /></Link></div>
              ) : <GonderimAkisi k={k} hesaplar={hesaplar} />)}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/** Sağ sütun: bu kampanyadan kazancın + türe göre ödeme merdiveni. */
export function KazancMerdiveni({ k, benim, simdi, bonus }: { k: Kampanya; benim: Gonderi[]; simdi: number; bonus: number }) {
  const toplam = benim.reduce((a, g) => { const h = gonderiHesap(g, simdi, bonus); return h.durum === "reddedildi" ? a : a + h.kazanc; }, 0);
  const o = kampanyaOdul(k);
  const basamak: { a: string; c: string; b: string }[] =
    k.tur === "goruntulenme" ? [
      { a: "Onay", c: `${KURALLAR.incelemeSaat} saatte`, b: `${tl(k.sabitOdeme ?? 0)} sabit` },
      { a: "Her 1.000 izlenme", c: `${KURALLAR.kazanmaGun} gün sayılır`, b: o.deger },
      { a: "24. saat", c: "ilk günün kazancına", b: `+%${Math.round(KURALLAR.bonus24 * 100)}` },
      { a: "7. gün", c: "toplam kazanca", b: `+%${Math.round(KURALLAR.bonus7 * 100)}` },
      { a: "Sınırlar", c: "gönderi başına", b: `${tl(k.minOdeme ?? 0)} ile ${tl(k.maxOdeme ?? 0)}` },
    ] : k.tur === "gorev" ? [
      { a: "Onaylı teslim", c: `${KURALLAR.incelemeSaat} saatte incelenir`, b: o.deger },
      { a: "Güvenlik beklemesi", c: "sonra cüzdana", b: `${KURALLAR.beklemeGun} gün` },
      { a: "Kontenjan", c: "kişi başı bir teslim", b: `${k.kotaKalan}/${k.kota}` },
    ] : (k.dereceler ?? []).slice(0, 5).map((v, i) => ({ a: `${i + 1}. sıra`, c: i === 0 ? "jüri seçimi" : "", b: tl(v) }));
  return (
    <div className="rounded-[26px] bg-[#0f1013] p-5 ring-1 ring-white/[0.08]">
      <p className="text-[13px] text-white/55">Bu kampanyadan kazancın</p>
      <p className="mt-1 text-[34px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-white"><Sayac hedef={toplam} bicim={(v) => tl(v, true)} /></p>
      <p className="mt-1.5 text-[12.5px] text-white/45">{benim.length ? `${benim.length} gönderi` : "Henüz gönderi yok"}</p>
      <p className="mb-2.5 mt-5 flex items-center gap-1.5 text-[13px] font-medium text-white/75">{k.tur === "yarisma" && <Trophy className="h-3.5 w-3.5 text-amber-300" />}{k.tur === "yarisma" ? `${tl(k.havuz ?? 0)} ödül havuzu` : "Bir gönderi nasıl ödenir"}</p>
      <ol className="space-y-1.5">
        {basamak.map((x, i) => (
          <motion.li key={x.a} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06, ease }} className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-white/[0.06]">
            <span className="min-w-0"><span className="block text-[13.5px] text-white">{x.a}</span>{x.c && <span className="text-[11.5px] text-white/45">{x.c}</span>}</span>
            <span className="shrink-0 text-right text-[14.5px] font-semibold tabular-nums text-white">{x.b}</span>
          </motion.li>
        ))}
      </ol>
      <Link href="/earn/yardim" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-white/50 transition hover:text-white">Ödeme kuralları<ArrowRight className="h-3 w-3" /></Link>
    </div>
  );
}
