"use client";

/**
 * Earn yardım merkezi (2026-10-29, seçilen "A · Ortalı konular", Notion/Apple Support dilinde):
 * ortalı başlık + büyük arama + öneri çipleri (en iyi eşleşme "Kısa yanıt" kartında),
 * altı konu kartı (her birinde kullanıcının GERÇEK verisiyle küçük bir ürün anı),
 * seçili konunun soruları yerinde animasyonlu akordeonla açılır (#seviyeler çapası Seviyeler'i açar),
 * "Bulamadın mı?" destek formu (gönderiliyor / iletildi / hata durumları + geçmiş talepler).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Loader2, RotateCcw, Search, Send, Sparkles, X } from "lucide-react";
import { useEarn, cuzdan, gonderiHesap } from "@/store/useEarn";
import { useAuth } from "@/store/useAuth";
import { KURALLAR, PLATFORMLAR, SEVIYELER, kisaSayi, tl } from "@/lib/earn/kampanyalar";
import { PlatformLogo, useSimdi } from "@/components/earn/ortak";
import { ease, yay } from "./ortak";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Soru = { s: string; c: string };
type Konu = { id: string; ad: string; ozet: string; sorular: Soru[] };

const KONULAR: Konu[] = [
  { id: "odeme", ad: "Ödemeler", ozet: "Kazancın ne zaman ve nasıl cüzdanına geçer", sorular: [
    { s: "Ödeme ne zaman yapılır?", c: "Ödeme sistemi henüz açık değil. Gönderilerin şu an Vayra ekibince incelenip onaylanıyor ya da gerekçesiyle reddediliyor; kazanç tutarları ve para çekme ödeme sistemi açıldığında devreye girecek. Açıldığında bildirim alacaksın." },
    { s: "Parayı nasıl çekerim?", c: `Cüzdan sayfasında kimliğini bir kez doğrula, IBAN ya da Papara hesabını ekle. En az ${tl(KURALLAR.minCekim)} ile çekebilirsin; Papara anında, banka havalesi 1 iş günü içinde.` },
    { s: "Çekim ücreti var mı?", c: `Çekim başına ${tl(KURALLAR.cekimUcreti)} ücret alınır. Seviyen yükseldikçe ücretsiz çekim hakların artar; Profesyonel seviyede sınırsızdır.` },
    { s: "Vergi ve fatura nasıl işliyor?", c: "Yıllık kazancın yasal sınırı aştığında kimlik ve vergi bilgilerin istenir. Ödemeler Türk lirası yapılır; şahıs ya da şirket olarak fatura kesebilirsin." },
  ] },
  { id: "gonderi", ad: "Gönderiler", ozet: "İnceleme, ret ve itiraz", sorular: [
    { s: "Gönderim neden reddedildi?", c: "En sık sebepler: içeriğin Vayra'da üretilmemesi, zorunlu etiketlerin eksik olması, telif ya da marka ihlali ve gönderinin kampanya başlamadan önce paylaşılmış olması. Her ret için gerekçe yazılır." },
    { s: "İtiraz nasıl işler?", c: `Reddedilen her gönderi için ${KURALLAR.itirazHakki} kez itiraz edebilirsin. İtiraz Gönderilerim sayfasından yapılır; karar verilince bildirim alırsın.` },
    { s: "Bir kampanyaya kaç gönderi yapabilirim?", c: "Görüntülenme kampanyalarında sınırsız gönderi yapabilirsin; her gönderi için ayrı alt ve üst sınır geçerlidir. Görevlerde ve yarışmalarda kişi başı 1 başvuru kabul edilir." },
    { s: "Gönderimi silersem ne olur?", c: "Kazanma ya da bekleme süresi bitmeden silinen gönderilerin kazancı iptal edilir. Süre dolduktan sonra gönderiyi yayında tutmak zorunda değilsin." },
  ] },
  { id: "izlenme", ad: "Görüntülenme", ozet: "Neyin sayıldığı, neyin sayılmadığı", sorular: [
    { s: "Nitelikli görüntülenme nedir?", c: "Gerçek hesaplardan gelen, en az 3 saniye izlenen görüntülenmelerdir. Bot, satın alınmış ya da reklamla artırılmış görüntülenmeler sayılmaz ve hesabın askıya alınmasına yol açabilir." },
    { s: "Görüntülenmelerim ne sıklıkla güncellenir?", c: "Platform izin verdiğinde istatistikler düzenli aralıklarla platformdan okunur; kazanma süresi boyunca kazancın buna göre güncellenir." },
    { s: "Kampanya bütçesi biterse ne olur?", c: "Bütçe bittiğinde kampanya yeni gönderi almaz. Kazanma süresindeki gönderilerin kazancı korunur ve ödenir." },
  ] },
  { id: "hesap", ad: "Hesap doğrulama", ozet: "Bio koduyla hesabının sana ait olduğunu göster", sorular: [
    { s: "Hesabımı nasıl doğrularım?", c: "Bağlı hesaplar sayfasında platformu seç, kullanıcı adını yaz, sana verilen kodu profil açıklamana ekle ve doğrula. Doğrulama bitince kodu silebilirsin." },
    { s: "Kod bulunamadı diyor, ne yapmalıyım?", c: "Profili kaydettiğinden ve hesabının herkese açık olduğundan emin ol. Platformlar değişikliği birkaç dakikada yansıtabilir; biraz bekleyip tekrar dene." },
    { s: "Şifremi ya da hesap erişimimi istiyor musunuz?", c: "Hayır. Yalnızca herkese açık profil açıklamandaki kodu okuruz; hesabına giriş yapmayız." },
  ] },
  { id: "seviye", ad: "Seviyeler", ozet: "Kazandıkça tüm kazancına eklenen bonus", sorular: [
    { s: "Seviyem nasıl yükselir?", c: "Seviye, bonuslar hariç toplam kazancınla belirlenir. Bir sonraki eşiği geçtiğin anda yeni bonus tüm kampanya kazançlarına eklenir." },
    { s: "Seviyem düşer mi?", c: "Hayır. Ulaştığın seviye, kurallara aykırı bir durum olmadıkça kalıcıdır." },
  ] },
  { id: "kural", ad: "Kurallar", ozet: "Kabul edilen içerik ve hesaplar", sorular: [
    { s: "Hangi içerikler kabul edilir?", c: "Gönderideki görsel, video ya da müzik Vayra'da üretilmiş olmalı; üretim geçmişin incelemede kontrol edilir. Kampanyanın zorunlu etiketleri açıklamada yer almalı." },
    { s: "Hangi hesaplardan gönderi yapabilirim?", c: "Yalnızca bio koduyla doğruladığın kendi hesaplarından." },
    { s: "Etkileşim artırma yasak mı?", c: "Evet. Bot, takipçi satın alma ya da etkileşim grupları yasaktır; tespitinde bekleyen kazanç iptal edilir." },
  ] },
];
const ONERI = ["Ödeme ne zaman", "Reddedildi", "Para çekme", "Kod bulunamadı"];
const TUM = KONULAR.flatMap((k) => k.sorular.map((q) => ({ ...q, konu: k })));
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

export function YardimMerkezi() {
  const [q, setQ] = useState("");
  const [konu, setKonu] = useState("odeme");
  const [acik, setAcik] = useState<string | null>(KONULAR[0].sorular[0].s);
  const panel = useRef<HTMLDivElement>(null);
  const destek = useRef<HTMLDivElement>(null);

  // /earn/yardim#seviyeler gibi çapalar ilgili konuyu açar.
  useEffect(() => {
    const ac = () => {
      const h = window.location.hash.replace("#", "");
      const k = KONULAR.find((x) => x.id === h || (h === "seviyeler" && x.id === "seviye") || (h === "kurallar" && x.id === "kural"));
      if (k) { setKonu(k.id); setAcik(k.sorular[0].s); setTimeout(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150); }
    };
    ac();
    window.addEventListener("hashchange", ac);
    return () => window.removeEventListener("hashchange", ac);
  }, []);

  const sonuc = useMemo(() => {
    const t = sade(q.trim());
    if (!t) return null;
    const k = t.split(/\s+/);
    return TUM.map((x) => ({ x, p: k.filter((w) => sade(`${x.s} ${x.c} ${x.konu.ad}`).includes(w)).length + (sade(x.s).includes(t) ? 3 : 0) }))
      .filter((r) => r.p).sort((a, b) => b.p - a.p).map((r) => r.x);
  }, [q]);
  const k = KONULAR.find((x) => x.id === konu)!;
  const sec = (id: string) => { const x = KONULAR.find((y) => y.id === id)!; setKonu(id); setAcik(x.sorular[0].s); };

  return (
    <div>
      {/* Başlık + arama */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="pt-4 text-center sm:pt-8">
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-[50px]">Nasıl yardımcı olabiliriz?</h1>
        <p className="mx-auto mt-3 max-w-[460px] text-[15.5px] text-white/55">Ödemeler, gönderiler ve hesap doğrulama hakkında kısa yanıtlar.</p>
        <div className="mx-auto mt-8 flex h-[58px] max-w-[640px] items-center gap-3 rounded-full bg-white/[0.04] pl-5 pr-2 ring-1 ring-white/[0.12] transition focus-within:bg-white/[0.06] focus-within:ring-white/[0.32]">
          <Search className="h-5 w-5 shrink-0 text-white/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setQ(""); }} placeholder="Bir soru yaz: ödeme, ret, çekim" aria-label="Yardımda ara"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/35" />
          <AnimatePresence>{q && <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setQ("")} aria-label="Temizle" className="flex h-10 w-10 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></motion.button>}</AnimatePresence>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {ONERI.map((o) => <button key={o} onClick={() => setQ(o)} className={cn("rounded-full px-3.5 py-1.5 text-[13px] ring-1 transition active:scale-[0.97]", q === o ? "bg-white text-black ring-white" : "bg-white/[0.04] text-white/70 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}>{o}</button>)}
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        {sonuc ? (
          <motion.section key="arama" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease }} className="mx-auto mt-10 max-w-[720px]">
            {sonuc.length ? (
              <>
                <div className="relative overflow-hidden rounded-[26px] bg-[#55d6fd]/[0.06] p-6 ring-1 ring-[#55d6fd]/30">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#8fe6ff]"><Sparkles className="h-3.5 w-3.5" />En iyi eşleşme · {sonuc[0].konu.ad}</p>
                  <p className="mt-2.5 text-[19px] font-semibold tracking-[-0.01em] text-white">{sonuc[0].s}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/75">{sonuc[0].c}</p>
                </div>
                {sonuc.length > 1 && (
                  <>
                    <p className="mb-2 mt-7 px-1 text-[13.5px] text-white/50">Diğer sonuçlar</p>
                    <div className="rounded-[24px] bg-[#0f1013] px-5 ring-1 ring-white/[0.08]">
                      {sonuc.slice(1, 6).map((x) => <Akordeon key={x.s} soru={x} acik={acik === x.s} onTik={() => setAcik(acik === x.s ? null : x.s)} />)}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="rounded-[24px] bg-[#0f1013] p-8 text-center ring-1 ring-white/[0.08]">
                <p className="text-[17px] font-semibold text-white">&ldquo;{q}&rdquo; için yanıt bulamadık</p>
                <p className="mt-1.5 text-[14px] text-white/55">Sorunu kreatör ekibine yaz; iş günlerinde yanıtlıyoruz.</p>
                <button onClick={() => destek.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black active:scale-[0.97]">Ekibe yaz<ArrowRight className="h-4 w-4" /></button>
              </div>
            )}
          </motion.section>
        ) : (
          <motion.section key="konular" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-14">
            <h2 className="mb-5 text-[24px] font-semibold tracking-[-0.03em] text-white">Popüler konular</h2>
            <LayoutGroup id="konu">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {KONULAR.map((x, i) => {
                  const a = konu === x.id;
                  return (
                    <motion.button key={x.id} onClick={() => sec(x.id)} aria-pressed={a} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease }}
                      className={cn("group relative flex h-[164px] flex-col overflow-hidden rounded-[26px] p-5 text-left ring-1 transition-[background-color,box-shadow,transform] duration-300 active:scale-[0.985] sm:h-[200px]", a ? "bg-white/[0.06] ring-white/[0.22]" : "bg-[#0f1013] ring-white/[0.07] hover:-translate-y-0.5 hover:ring-white/[0.16]")}>
                      {a && <motion.span layoutId="konu-z" className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-white/[0.3]" transition={yay} />}
                      <div className="h-[58px]"><KonuAni id={x.id} /></div>
                      <span className="mt-auto">
                        <span className="flex items-center justify-between gap-2 text-[16.5px] font-semibold tracking-[-0.01em] text-white">{x.ad}<span className="text-[12px] font-normal text-white/40">{x.sorular.length}</span></span>
                        <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/55">{x.ozet}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </LayoutGroup>
            <div ref={panel} id={konu === "seviye" ? "seviyeler" : undefined} className="scroll-mt-24">
              <AnimatePresence mode="wait">
                <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease }}
                  className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 rounded-[28px] bg-[#0f1013] p-2 ring-1 ring-white/[0.08] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                  <div className="px-4 pt-3 sm:px-5">
                    <p className="text-[13px] text-white/50">{k.ad}</p>
                    <div className="mt-1">{k.sorular.map((x) => <Akordeon key={x.s} soru={x} acik={acik === x.s} onTik={() => setAcik(acik === x.s ? null : x.s)} />)}</div>
                  </div>
                  <KonuAyrinti id={k.id} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <section ref={destek} className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-8 rounded-[30px] bg-[radial-gradient(70%_90%_at_0%_0%,rgba(85,214,253,0.08),transparent_60%),#0f1013] p-6 ring-1 ring-white/[0.08] sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-white">Bulamadın mı?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-white/60">Kreatör ekibi gönderi, ödeme ve hesap sorularını iş günlerinde yanıtlar. Kampanya adını ve gönderi bağlantısını eklersen daha hızlı yardımcı oluruz.</p>
          <GecmisTalepler />
        </div>
        <DestekFormu />
      </section>
    </div>
  );
}

function Akordeon({ soru, acik, onTik }: { soru: Soru; acik: boolean; onTik: () => void }) {
  return (
    <div className="border-t border-white/[0.06] first:border-t-0">
      <button onClick={onTik} aria-expanded={acik} className="group flex w-full items-center justify-between gap-4 py-4 text-left">
        <span className={cn("text-[15.5px] font-medium transition-colors", acik ? "text-white" : "text-white/85 group-hover:text-white")}>{soru.s}</span>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors", acik ? "bg-white/[0.1]" : "group-hover:bg-white/[0.06]")}>
          <ChevronDown className={cn("h-4 w-4 text-white/55 transition-transform duration-300", acik && "rotate-180 text-white")} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease }} className="overflow-hidden">
            <p className="pb-5 pr-10 text-[14.5px] leading-relaxed text-white/65">{soru.c}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function useVeri() {
  const s = useEarn();
  const simdi = useSimdi();
  const c = cuzdan(s, simdi);
  const h = s.gonderiler.map((g) => gonderiHesap(g, simdi, c.seviye.bonus));
  return { s, c, h };
}

/** Konu kartının üstündeki küçük ürün anı: kullanıcının gerçek verisiyle. */
function KonuAni({ id }: { id: string }) {
  const { s, c, h } = useVeri();
  const pil = "whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px]";
  if (id === "odeme") return (
    <div>
      <p className="text-[24px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white">{tl(c.cekilebilir, true)}</p>
      <p className="mt-1.5 text-[12px] text-white/45">çekilebilir · bekleyen {tl(c.bekleyen)}</p>
    </div>
  );
  if (id === "gonderi") {
    const say = (d: string[]) => h.filter((x) => d.includes(x.durum)).length;
    return (
      <div className="flex flex-wrap gap-1.5">
        <span className={cn(pil, "bg-white/[0.07] text-white/75")}>İncelemede {say(["inceleme", "degerlendirme"])}</span>
        <span className={cn(pil, "bg-[#55d6fd]/15 text-[#8fe6ff]")}>Kazanıyor {say(["kazaniyor"])}</span>
        <span className={cn(pil, "bg-white/[0.07] text-white/75")}>Reddedildi {say(["reddedildi"])}</span>
      </div>
    );
  }
  if (id === "izlenme") {
    const iz = h.map((x) => x.goruntulenme).slice(0, 8).reverse();
    const max = Math.max(1, ...iz);
    if (!iz.length) return (
      <div>
        <p className="text-[24px] font-semibold leading-none tracking-[-0.03em] text-white">3 sn</p>
        <p className="mt-1.5 text-[12px] text-white/45">gerçek hesaptan izlenme sayılır</p>
      </div>
    );
    const bos = false;
    return (
      <div className="flex items-end gap-3">
        <div className="flex h-10 items-end gap-[3px]">
          {(bos ? [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25] : iz.map((v) => v / max)).map((o, i) => <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2 + i * 0.04, ease }} className={cn("w-[7px] origin-bottom rounded-[2px]", bos ? "bg-white/[0.1]" : "bg-[#55d6fd]")} style={{ height: `${Math.max(10, o * 100)}%` }} />)}
        </div>
        <p className="pb-0.5 text-[12px] text-white/50"><span className="block text-[15px] font-semibold text-white">{kisaSayi(h.reduce((a, x) => a + x.goruntulenme, 0))}</span>izlenme</p>
      </div>
    );
  }
  if (id === "hesap") return (
    <div className="flex gap-1.5">
      {PLATFORMLAR.map((p) => {
        const ok = s.hesaplar.some((x) => x.platform === p.id && x.durum === "dogrulandi");
        return (
          <span key={p.id} className={cn("relative flex h-10 w-10 items-center justify-center rounded-[12px] ring-1", ok ? "bg-white/[0.08] ring-white/[0.14]" : "bg-white/[0.03] ring-white/[0.06] [&>img]:opacity-40")}>
            <PlatformLogo id={p.id} boyut={17} />
            {ok && <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#55d6fd] ring-2 ring-[#0f1013]"><Check className="h-2.5 w-2.5 text-[#06222b]" strokeWidth={4} /></span>}
          </span>
        );
      })}
    </div>
  );
  if (id === "seviye") {
    const ix = SEVIYELER.findIndex((x) => x.id === c.seviye.id);
    return (
      <div className="flex h-11 items-end gap-1.5">
        {SEVIYELER.map((sv, i) => <span key={sv.id} className={cn("w-5 rounded-t-[5px] transition-colors", i === ix ? "bg-[#55d6fd]" : i < ix ? "bg-white/40" : "bg-white/[0.1]")} style={{ height: `${32 + i * 22}%` }} />)}
        <span className="ml-1.5 pb-0.5 text-[12.5px] font-medium text-[#8fe6ff]">{c.seviye.ad}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={cn(pil, "bg-white/[0.07] text-white/75")}>Vayra&apos;da üretilmiş</span>
      <span className={cn(pil, "bg-white/[0.07] text-white/75")}>{KURALLAR.itirazHakki} itiraz hakkı</span>
    </div>
  );
}

/** Seçili konunun sağ tarafı: konuyu somutlaştıran tek görsel (gerçek kurallar ve kullanıcının verisi). */
function KonuAyrinti({ id }: { id: string }) {
  const { c } = useVeri();
  const kutu = "rounded-[22px] bg-white/[0.03] p-5 ring-1 ring-white/[0.06]";
  if (id === "odeme") {
    const adim = [["Gönderi", "Bağlantını gönderirsin"], ["İnceleme", `${KURALLAR.incelemeSaat} saat`], ["Kazanma", `${KURALLAR.kazanmaGun} gün`], ["Güvenlik", `${KURALLAR.beklemeGun} gün`], ["Cüzdan", `En az ${tl(KURALLAR.minCekim)} ile çek`]];
    return (
      <div className={kutu}>
        <p className="text-[13px] text-white/50">Gönderiden cüzdana</p>
        <ol className="relative mt-4 space-y-4">
          <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.9, ease }} className="absolute bottom-2 left-[11px] top-2 w-px origin-top bg-gradient-to-b from-white/15 to-[#55d6fd]" aria-hidden />
          {adim.map(([a, b], i) => (
            <motion.li key={a} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="relative flex items-center gap-3">
              <span className={cn("relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold", i === adim.length - 1 ? "bg-white text-black" : "bg-[#1a1b1f] text-white ring-1 ring-white/[0.14]")}>{i + 1}</span>
              <span className="text-[14px] font-medium text-white">{a}</span><span className="ml-auto text-[12.5px] text-white/50">{b}</span>
            </motion.li>
          ))}
        </ol>
        <Link href="/earn/cuzdan" className="mt-5 flex items-center justify-between rounded-[16px] bg-white/[0.04] px-4 py-3 text-[13.5px] text-white/75 ring-1 ring-white/[0.06] transition hover:bg-white/[0.07] hover:text-white">
          <span>Çekilebilir <b className="font-semibold text-white">{tl(c.cekilebilir, true)}</b></span><ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }
  if (id === "seviye") {
    const ix = SEVIYELER.findIndex((x) => x.id === c.seviye.id);
    const oran = c.sonraki ? Math.min(1, (c.seviyeKazanc - c.seviye.minKazanc) / (c.sonraki.minKazanc - c.seviye.minKazanc)) : 1;
    return (
      <div className={kutu}>
        <p className="text-[13px] text-white/50">Senin seviyen</p>
        <div className="mt-4 grid grid-cols-4 items-end gap-2">
          {SEVIYELER.map((sv, i) => (
            <div key={sv.id} className="text-center">
              <motion.div initial={{ height: 0 }} animate={{ height: 36 + i * 22 }} transition={{ delay: i * 0.07, duration: 0.5, ease }} className={cn("rounded-t-[12px] ring-1", i === ix ? "bg-[#55d6fd]/20 ring-[#55d6fd]/45" : "bg-white/[0.05] ring-white/[0.08]")} />
              <p className={cn("mt-2 truncate text-[12.5px] font-semibold", i === ix ? "text-white" : "text-white/60")}>{sv.ad}</p>
              <p className="text-[11.5px] text-white/45">{sv.bonus ? `yüzde ${Math.round(sv.bonus * 100)} ek` : "Taban"}</p>
            </div>
          ))}
        </div>
        {c.sonraki ? (
          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, oran * 100)}%` }} transition={{ duration: 1, delay: 0.2, ease }} className="h-full rounded-full bg-[#55d6fd]" /></div>
            <p className="mt-2 text-[12.5px] text-white/55">{tl(Math.max(0, c.sonraki.minKazanc - c.seviyeKazanc))} daha kazanınca {c.sonraki.ad}: tüm kazançlara yüzde {Math.round(c.sonraki.bonus * 100)} ek</p>
          </div>
        ) : <p className="mt-5 text-[12.5px] text-white/55">En üst seviyedesin.</p>}
      </div>
    );
  }
  if (id === "hesap") return (
    <div className={kutu}>
      <p className="text-[13px] text-white/50">Profil açıklaması</p>
      <p className="mt-2 text-[14.5px] text-white/80">Yapay zekâ ile kısa filmler</p>
      <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...yay, delay: 0.2 }} className="mt-1.5 inline-flex rounded-[9px] bg-white/[0.06] px-2.5 py-1 text-[14px] font-semibold tracking-[0.08em] text-[#8fe6ff]">VYR-7K2Q</motion.span>
      <p className="mt-4 text-[13px] leading-relaxed text-white/55">Kod yalnız doğrulama içindir; hesabın doğrulanınca silebilirsin. Örnek kod.</p>
      <Link href="/earn/hesaplar" className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">Hesap bağla<ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
  if (id === "gonderi") return (
    <div className={kutu}>
      <p className="text-[13px] text-white/50">Ret gerekçesi örneği</p>
      <div className="mt-3 rounded-[16px] bg-rose-400/[0.06] p-4 ring-1 ring-rose-300/15">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-rose-200"><AlertTriangle className="h-3.5 w-3.5" />Zorunlu etiket eksik</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">Açıklamada kampanyanın etiketi bulunamadı. Etiketi ekleyip itiraz edebilirsin.</p>
      </div>
      <Link href="/earn/gonderiler" className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium text-white ring-1 ring-white/[0.14] transition hover:bg-white/[0.05]">Gönderilerim<ArrowRight className="h-4 w-4" /></Link>
    </div>
  );
  if (id === "izlenme") return (
    <div className={kutu}>
      <p className="text-[13px] text-white/50">Sayılan ve sayılmayan</p>
      <ul className="mt-3 space-y-2.5 text-[13.5px]">
        {[["Gerçek hesaptan, en az 3 saniye", true], ["Organik keşfet ve takipçi akışı", true], ["Bot ya da satın alınmış izlenme", false], ["Reklamla artırılmış izlenme", false]].map(([t, ok]) => (
          <li key={t as string} className="flex items-center gap-2.5 text-white/75"><span className={cn("flex h-5 w-5 items-center justify-center rounded-full", ok ? "bg-[#55d6fd]/15 text-[#8fe6ff]" : "bg-rose-400/15 text-rose-300")}>{ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}</span>{t as string}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className={kutu}>
      <p className="text-[13px] text-white/50">Kısaca</p>
      <ul className="mt-3 space-y-2.5 text-[13.5px] text-white/75">
        {["İçerik Vayra'da üretilmiş olmalı", "Kampanya etiketleri açıklamada", "Yalnız doğrulanmış kendi hesapların", `Ret başına ${KURALLAR.itirazHakki} itiraz`].map((t) => <li key={t} className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#8fe6ff]" />{t}</li>)}
      </ul>
    </div>
  );
}

const DESTEK_KONU = ["Gönderi incelemesi", "Ödeme ve çekim", "Hesap doğrulama", "Kampanya önerisi", "Diğer"];
function DestekFormu() {
  const { destekEkle, destekGuncelle } = useEarn();
  const kullanici = useAuth((a) => a.kullanici);
  const [konu, setKonu] = useState(DESTEK_KONU[0]);
  const [mesaj, setMesaj] = useState("");
  const [durum, setDurum] = useState<"bos" | "gidiyor" | "iletildi" | "hata">("bos");
  const [son, setSon] = useState<{ konu: string; mesaj: string } | null>(null);
  const email = kullanici?.email ?? "";
  const gecerli = mesaj.trim().length >= 10 && email.includes("@");

  const gonder = async (k = konu, m = mesaj.trim()) => {
    setDurum("gidiyor"); setSon({ konu: k, mesaj: m });
    const id = destekEkle(k, m);
    try {
      const r = await fetch("/api/iletisim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ad: kullanici?.ad ?? "Kreatör", email, konu: `Earn · ${k}`, mesaj: m }) });
      const j = await r.json();
      destekGuncelle(id, j.ok ? "iletildi" : "hata");
      if (j.ok) { setDurum("iletildi"); setMesaj(""); }
      else { setDurum("hata"); toast.error("Talep gönderilemedi", { description: j.hata ?? "Sunucu talebi kabul etmedi. Biraz sonra yeniden dene." }); }
    } catch {
      destekGuncelle(id, "hata"); setDurum("hata");
      toast.error("Talep gönderilemedi", { description: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene." });
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {durum === "iletildi" ? (
        <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }} className="flex flex-col items-center justify-center rounded-[22px] bg-white/[0.03] p-8 text-center ring-1 ring-white/[0.07]">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd] text-[#06222b]"><Check className="h-6 w-6" strokeWidth={3} /></motion.span>
          <p className="mt-4 text-[18px] font-semibold text-white">Talebin iletildi</p>
          <p className="mt-1.5 text-[14px] text-white/55">Yanıt {email} adresine gelecek.</p>
          <button onClick={() => setDurum("bos")} className="mt-5 h-10 rounded-full px-4 text-[13.5px] font-medium text-white ring-1 ring-white/[0.14] transition hover:bg-white/[0.05]">Yeni talep</button>
        </motion.div>
      ) : (
        <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={(e) => { e.preventDefault(); if (gecerli && durum !== "gidiyor") void gonder(); }}>
          <p className="text-[13px] text-white/55">Konu</p>
          <LayoutGroup id="destek-konu">
            <div role="radiogroup" aria-label="Konu" className="mt-2 flex flex-wrap gap-1.5">
              {DESTEK_KONU.map((k) => (
                <button type="button" key={k} role="radio" aria-checked={konu === k} onClick={() => setKonu(k)} className="relative rounded-full px-3.5 py-1.5 text-[13px] ring-1 ring-white/[0.1] transition active:scale-[0.97]">
                  {konu === k && <motion.span layoutId="destek-konu-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <span className={cn("relative", konu === k ? "font-medium text-black" : "text-white/65 hover:text-white")}>{k}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <div className="relative mt-4">
            <textarea value={mesaj} onChange={(e) => setMesaj(e.target.value.slice(0, 1200))} rows={5} aria-label="Mesaj"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && gecerli) { e.preventDefault(); void gonder(); } }}
              placeholder="Ne oldu? Kampanya adını ve gönderi bağlantısını eklersen daha hızlı yardımcı oluruz."
              className="w-full resize-none rounded-[18px] bg-black/30 p-4 pb-8 text-[14.5px] leading-relaxed text-white outline-none ring-1 ring-white/[0.1] transition placeholder:text-white/35 focus:bg-black/40 focus:ring-white/[0.3]" />
            <span className={cn("pointer-events-none absolute bottom-3 right-4 text-[11.5px] tabular-nums", mesaj.trim().length && mesaj.trim().length < 10 ? "text-amber-200/80" : "text-white/35")}>{mesaj.trim().length < 10 && mesaj.trim().length ? `En az 10 karakter` : `${mesaj.length}/1200`}</span>
          </div>
          <AnimatePresence>
            {durum === "hata" && son && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="mt-3 flex items-center gap-2.5 rounded-[14px] bg-rose-400/[0.07] p-3 text-[13px] text-rose-200 ring-1 ring-rose-300/20">
                  <AlertTriangle className="h-4 w-4 shrink-0" /><span className="flex-1">Talep gönderilemedi. Mesajın kaydedildi; tekrar deneyebilirsin.</span>
                  <button type="button" onClick={() => void gonder(son.konu, son.mesaj)} className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-3 py-1 text-[12.5px] text-white hover:bg-white/[0.14]"><RotateCcw className="h-3 w-3" />Tekrar dene</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[12.5px] text-white/45">Yanıt <span className="text-white/70">{email || "e-posta adresine"}</span> gelir</span>
            <button disabled={!gecerli || durum === "gidiyor"} className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97] disabled:bg-white/[0.07] disabled:text-white/35">
              {durum === "gidiyor" ? <><Loader2 className="h-4 w-4 animate-spin" />Gönderiliyor</> : <><Send className="h-4 w-4" />Gönder</>}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function GecmisTalepler() {
  const destek = useEarn((s) => s.destek);
  if (!destek.length) return null;
  const DURUM = { gonderiliyor: ["Gönderiliyor", "text-white/60"], iletildi: ["İletildi", "text-[#8fe6ff]"], hata: ["Gönderilemedi", "text-rose-300"] } as const;
  return (
    <div className="mt-7">
      <p className="mb-2 text-[13px] text-white/50">Taleplerin</p>
      <ul className="space-y-1.5">
        {destek.slice(0, 3).map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-white/[0.06]">
            <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{d.konu}</span><span className="block truncate text-[12px] text-white/45">{d.mesaj}</span></span>
            <span className={cn("shrink-0 text-[12px] font-medium", DURUM[d.durum][1])}>{DURUM[d.durum][0]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
