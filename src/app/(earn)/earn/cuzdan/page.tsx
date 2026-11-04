"use client";

/**
 * Earn › Cüzdan — "C · Kart cüzdanı" (2026-10-29, kullanıcı seçimi):
 * solda Apple Wallet usulü kart destesi (Earn bakiyesi, Papara, banka; seçili kart önde, ok tuşlarıyla gezilir),
 * sağda seçili kartın ayrıntısı: bakiye + iki adımlı çekim (kimlik → para çek), hesapta "Bu hesaba çek" ve o hesabın hareketleri.
 * Altta ödeme takvimi. Parçalar components/earn/para/cuzdan.tsx'te.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, Lock, Plus, Trash2 } from "lucide-react";
import { useEarn, cuzdan, cekimDurum } from "@/store/useEarn";
import { tl, KURALLAR } from "@/lib/earn/kampanyalar";
import { useSimdi } from "@/components/earn/ortak";
import { Baslik, OdemeLogo, Sayac, bankaBul, birincil, ease, ikincil, maskele, yuzey } from "@/components/earn/para/ui";
import { CekimFormu, Hareketler, KartDestesi, KimlikFormu, Takvim, YontemPenceresi, useCekimUcreti, useHareketler, type Kart } from "@/components/earn/para/cuzdan";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function CuzdanSayfasi() {
  const s = useEarn();
  const simdi = useSimdi();
  const c = cuzdan(s, simdi);
  const { ucret, hakMetni } = useCekimUcreti(simdi);
  const hareketler = useHareketler(simdi);
  const [secili, setSecili] = useState("earn");
  const [onerilen, setOnerilen] = useState<string | null>(null);
  const [pencere, setPencere] = useState<null | "iban" | "papara">(null);

  const kartlar = useMemo<Kart[]>(() => {
    const y: Kart[] = s.odemeYontemleri.map((o) => ({ id: o.id, tur: o.tur, yontem: o }));
    // Hiç yöntem yoksa destede eklenebilecek iki boş kart (gerçek logolarla).
    const bos: Kart[] = [];
    if (!y.some((k) => k.tur === "iban")) bos.push({ id: "ekle-iban", tur: "iban", ekle: true });
    if (!y.some((k) => k.tur === "papara")) bos.push({ id: "ekle-papara", tur: "papara", ekle: true });
    return [...bos, ...y, { id: "earn", tur: "earn" }];
  }, [s.odemeYontemleri]);
  const kart = kartlar.find((k) => k.id === secili) ?? kartlar[kartlar.length - 1];

  return (
    <div>
      <Baslik baslik="Cüzdan" alt={`Kazancını IBAN ya da Papara hesabına aktar. En az ${tl(KURALLAR.minCekim)}; Papara anında, banka havalesi 1 iş günü içinde.`} />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] xl:gap-10">
        {/* Deste */}
        <div className="lg:sticky lg:top-[calc(var(--ust-nav)+24px)]">
          <KartDestesi kartlar={kartlar} secili={kart.id} sec={setSecili} c={c} />
          <div className="mt-4 flex items-center justify-between gap-3 px-1">
            <p className="text-[12.5px] text-white/45">Karta dokun, öne gelsin</p>
            <button onClick={() => setPencere("papara")} className="flex items-center gap-1.5 text-[13px] font-medium text-white/70 transition hover:text-white"><Plus className="h-3.5 w-3.5" />Hesap ekle</button>
          </div>
        </div>

        {/* Ayrıntı */}
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={kart.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.28, ease }}>
              {kart.tur === "earn" ? (
                <EarnAyrinti c={c} ucret={ucret} hakMetni={hakMetni} onerilen={onerilen} yontemEkle={() => setPencere("papara")} />
              ) : kart.ekle ? (
                <EkleAyrinti tur={kart.tur as "iban" | "papara"} ac={() => setPencere(kart.tur as "iban" | "papara")} />
              ) : (
                <HesapAyrinti kart={kart} simdi={simdi} cek={() => { setOnerilen(kart.id); setSecili("earn"); }} kaldir={() => {
                  const y = kart.yontem!;
                  if (!window.confirm(`${y.ad} ödeme yöntemi kaldırılsın mı?`)) return;
                  s.yontemSil(y.id); setSecili("earn");
                  toast.success("Ödeme yöntemi kaldırıldı", { description: y.ad });
                }} />
              )}
              {!kart.ekle && (
                <Hareketler
                  liste={kart.tur === "earn" ? hareketler : hareketler.filter((h) => h.yontem?.id === kart.id)}
                  baslik={kart.tur === "earn" ? "Hareketler" : "Bu hesabın hareketleri"}
                  bosMetin={kart.tur === "earn" ? undefined : "Bu hesaba henüz çekim yapmadın."} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Takvim />
      <AnimatePresence>{pencere && <YontemPenceresi kimlik={s.kimlik} baslangic={pencere} kapat={() => setPencere(null)} />}</AnimatePresence>
    </div>
  );
}

/* ── Earn kartı: bakiye + iki adımlı çekim ── */
function EarnAyrinti({ c, ucret, hakMetni, onerilen, yontemEkle }: { c: ReturnType<typeof cuzdan>; ucret: number; hakMetni: string; onerilen: string | null; yontemEkle: () => void }) {
  const kimlik = useEarn((s) => s.kimlik);
  const oran = c.sonraki ? Math.min(1, (c.seviyeKazanc - c.seviye.minKazanc) / (c.sonraki.minKazanc - c.seviye.minKazanc)) : 1;
  return (
    <section className={cn(yuzey, "overflow-hidden")}>
      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13.5px] text-white/55">Çekilebilir bakiye</p>
            <p className="mt-1.5 text-[48px] font-semibold leading-none tabular-nums tracking-[-0.045em] text-white sm:text-[56px]"><Sayac hedef={c.cekilebilir} bicim={(v) => tl(v, true)} /></p>
          </div>
          {c.isleniyor > 0 && <span className="mt-1 rounded-full bg-amber-300/12 px-3 py-1 text-[12.5px] font-medium text-amber-200">{tl(c.isleniyor, true)} yolda</span>}
        </div>
        <dl className="mt-6 grid grid-cols-3 divide-x divide-white/[0.07] rounded-[18px] bg-white/[0.03] py-3.5 ring-1 ring-white/[0.06]">
          {[["Bekleyen", c.bekleyen, `${KURALLAR.kazanmaGun + KURALLAR.beklemeGun} gün içinde`], ["Ödenen", c.odenen, "hesabına geçen"], ["Toplam", c.toplam, "bugüne kadar"]].map(([a, v, alt]) => (
            <div key={a as string} className="min-w-0 px-3 sm:px-4"><dt className="truncate text-[12.5px] text-white/50">{a as string}</dt><dd className="mt-0.5 truncate text-[18px] font-semibold tabular-nums tracking-[-0.02em] text-white sm:text-[20px]"><Sayac hedef={v as number} bicim={(n) => tl(n)} /></dd><dd className="truncate text-[11.5px] text-white/40">{alt as string}</dd></div>
          ))}
        </dl>
        <div className="mt-5">
          <div className="flex items-center justify-between text-[12.5px]"><span className="font-medium text-white/80">{c.seviye.ad}{c.seviye.bonus > 0 && <span className="text-[#8fe6ff]"> +%{Math.round(c.seviye.bonus * 100)}</span>}</span><span className="text-white/45">{c.sonraki ? `${tl(Math.max(0, c.sonraki.minKazanc - c.seviyeKazanc))} daha kazanınca ${c.sonraki.ad}` : "En üst seviye"}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, oran * 100)}%` }} transition={{ duration: 1, delay: 0.15, ease }} className="h-full rounded-full bg-gradient-to-r from-[#55d6fd] to-[#a5ecff]" /></div>
        </div>
      </div>

      <div className="border-t border-white/[0.07] p-6 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-white">Para çek</h2>
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <Adim n={1} ad="Kimlik" tamam={!!kimlik} aktif={!kimlik} />
            <span className="h-px w-4 bg-white/15" />
            <Adim n={2} ad="Çekim" aktif={!!kimlik} />
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {kimlik
            ? <motion.div key="c" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25, ease }}><CekimFormu cekilebilir={c.cekilebilir} ucret={ucret} hakMetni={hakMetni} kimlik={kimlik} onerilen={onerilen} yontemEkle={yontemEkle} /></motion.div>
            : <motion.div key="k" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25, ease }}><KimlikFormu /></motion.div>}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Adim({ n, ad, tamam, aktif }: { n: number; ad: string; tamam?: boolean; aktif?: boolean }) {
  return (
    <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors", aktif ? "bg-white/[0.08] font-medium text-white" : "text-white/50")}>
      <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold", tamam ? "bg-[#55d6fd] text-[#06222b]" : aktif ? "bg-white text-black" : "ring-1 ring-white/30")}>{tamam ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : n}</span>{ad}
    </span>
  );
}

/* ── Kayıtlı hesap ── */
function HesapAyrinti({ kart, simdi, cek, kaldir }: { kart: Kart; simdi: number; cek: () => void; kaldir: () => void }) {
  const cekimler = useEarn((s) => s.cekimler);
  const y = kart.yontem!;
  const buHesap = cekimler.filter((x) => x.yontemId === y.id && cekimDurum(x, simdi) !== "basarisiz");
  const toplam = buHesap.reduce((a, x) => a + x.tutar, 0);
  const son = buHesap[0];
  const banka = y.tur === "iban" ? bankaBul(y.deger) : null;
  return (
    <section className={cn(yuzey, "p-6 sm:p-7")}>
      <div className="flex flex-wrap items-center gap-4">
        <OdemeLogo tur={y.tur} deger={y.deger} boyut="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[20px] font-semibold tracking-[-0.02em] text-white">{y.tur === "papara" ? "Papara" : banka?.ad ?? "Banka hesabı"}</p>
          <p className="truncate text-[13.5px] tabular-nums text-white/55">{maskele(y.deger)}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12.5px] text-white/75 ring-1 ring-white/[0.08]"><BadgeCheck className="h-3.5 w-3.5 text-[#8fe6ff]" />{y.tur === "papara" ? "Anında" : "1 iş günü"}</span>
      </div>
      <dl className="mt-6 grid grid-cols-2 divide-x divide-white/[0.07] rounded-[18px] bg-white/[0.03] py-3.5 ring-1 ring-white/[0.06]">
        <div className="px-4"><dt className="text-[12.5px] text-white/50">Bu hesaba çekilen</dt><dd className="mt-0.5 text-[20px] font-semibold tabular-nums text-white">{tl(toplam, true)}</dd></div>
        <div className="min-w-0 px-4"><dt className="text-[12.5px] text-white/50">Son çekim</dt><dd className="mt-0.5 truncate text-[20px] font-semibold text-white">{son ? new Date(son.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "Henüz yok"}</dd></div>
      </dl>
      <div className="mt-4 rounded-[16px] bg-white/[0.025] px-4 py-3 text-[13px] ring-1 ring-white/[0.06]">
        <p className="flex justify-between gap-3"><span className="text-white/55">Hesap sahibi</span><span className="truncate text-white">{y.ad.replace(/^.* · /, "")}</span></p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={cek} className={birincil}>Bu hesaba para çek<ArrowRight className="h-4 w-4" /></button>
        <button onClick={kaldir} className={ikincil}><Trash2 className="h-4 w-4" />Kaldır</button>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[12.5px] text-white/45"><Lock className="h-3.5 w-3.5" />Hesap, kimlikteki adınla aynı kişiye ait olmalı.</p>
    </section>
  );
}

/* ── Henüz eklenmemiş hesap ── */
function EkleAyrinti({ tur, ac }: { tur: "iban" | "papara"; ac: () => void }) {
  const papara = tur === "papara";
  return (
    <section className={cn(yuzey, "p-6 sm:p-7")}>
      <OdemeLogo tur={tur} boyut="lg" />
      <h2 className="mt-5 text-[24px] font-semibold tracking-[-0.03em] text-white">{papara ? "Papara hesabını ekle" : "Banka hesabını ekle"}</h2>
      <p className="mt-2 max-w-[460px] text-[14.5px] leading-relaxed text-white/60">{papara ? "Çekimlerin birkaç dakika içinde Papara hesabına geçer. 10 haneli Papara numaran yeterli." : "IBAN'ı yazınca banka otomatik tanınır; Ziraat, Garanti BBVA, İş Bankası, Akbank, VakıfBank, Halkbank ve diğerleri. Havale 1 iş günü içinde."}</p>
      <ul className="mt-5 space-y-2 text-[13.5px] text-white/70">
        {["Her ay en az 1 çekim ücretsiz; sonrası seviyene göre", "Hesap, kimlikteki adınla aynı kişiye ait olmalı", "İstediğin zaman kaldırabilirsin"].map((x) => (
          <li key={x} className="flex items-center gap-2.5"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#55d6fd]/15"><Check className="h-2.5 w-2.5 text-[#8fe6ff]" strokeWidth={3.5} /></span>{x}</li>
        ))}
      </ul>
      <button onClick={ac} className={cn(birincil, "mt-6")}><Plus className="h-4 w-4" />{papara ? "Papara numaranı ekle" : "IBAN ekle"}</button>
    </section>
  );
}
