"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bell, Check, CheckCircle2, Coins, Heart, Lock, Mail, Megaphone, MonitorUp, Play, Receipt, Rocket, Sparkles, Timer, Volume2 } from "lucide-react";
import { useTercih } from "@/store/useTercih";
import { useAyarTercih, type BildirimKanal, type BildirimOlay } from "@/store/useAyarTercih";
import { Anahtar, Grup, Hap, Satir, Sayfa, dugme, kaydedildi, akis } from "@/components/ayarlar/ui";
import { bildir, bildirimSesiCal } from "@/lib/bildirimler";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

type Izin = NotificationPermission | "desteklenmiyor";
const OLAYLAR: { id: BildirimOlay; ad: string; alt: string; ikon: typeof Bell; renk: string; zorunlu?: BildirimKanal[] }[] = [
  { id: "uretim", ad: "Üretim bitti", alt: "Görsel, ses ve kısa işler", ikon: CheckCircle2, renk: "#34d399" },
  { id: "uzun", ad: "Uzun işler", alt: "Video, 3D ve sinema sahneleri hazır", ikon: Timer, renk: "#55d6fd" },
  { id: "kredi", ad: "Kredi azaldı", alt: "Bakiye uyarı eşiğinin altına indi", ikon: Coins, renk: "#fbbf24" },
  { id: "fatura", ad: "Ödeme ve makbuz", alt: "Ödeme alındı, yenileme yaklaşıyor", ikon: Receipt, renk: "#a78bfa" },
  { id: "guvenlik", ad: "Güvenlik", alt: "Yeni giriş, şifre ve e-posta değişikliği", ikon: Lock, renk: "#fb7185", zorunlu: ["uygulama"] },
  { id: "topluluk", ad: "Topluluk", alt: "Beğeni, yorum ve remiks", ikon: Heart, renk: "#f472b6" },
  { id: "urun", ad: "Yeni modeller ve özellikler", alt: "Ayda en fazla iki kez", ikon: Rocket, renk: "#55d6fd" },
  { id: "kampanya", ad: "Kampanyalar", alt: "İndirimler ve yarışmalar", ikon: Megaphone, renk: "#f97316" },
];
const KANALLAR: { id: BildirimKanal; ad: string; ikon: typeof Bell }[] = [
  { id: "uygulama", ad: "Uygulama", ikon: Bell },
  { id: "tarayici", ad: "Tarayıcı", ikon: MonitorUp },
  { id: "eposta", ad: "E-posta", ikon: Mail },
];

export default function BildirimAyarlari() {
  const t = useTercih();
  const matris = useAyarTercih((s) => s.bildirim);
  const bAyarla = useAyarTercih((s) => s.bildirimAyarla);
  const [izin, setIzin] = useState<Izin>("default");
  useEffect(() => { setIzin("Notification" in window ? Notification.permission : "desteklenmiyor"); }, []);
  const tarayiciAcik = t.masaustuBildirim && izin === "granted";

  /** Üretim ve kampanya hücreleri, motorun gerçekten baktığı eski tercihlerle birlikte güncellenir. */
  const hucre = (o: BildirimOlay, k: BildirimKanal, v: boolean) => {
    bAyarla(o, k, v);
    if (k === "uygulama" && o === "uretim") t.bildirimTercihAyarla({ uretim: v });
    if (k === "uygulama" && o === "kampanya") t.bildirimTercihAyarla({ pazarlama: v });
    if (k === "eposta") t.bildirimTercihAyarla({ email: Object.entries(matris).some(([id, x]) => (id === o ? v : x.eposta)) });
    kaydedildi();
  };
  const deger = (o: BildirimOlay, k: BildirimKanal) => o === "uretim" && k === "uygulama" ? t.bildirimTercih.uretim : o === "kampanya" && k === "uygulama" ? t.bildirimTercih.pazarlama : matris[o][k];

  const tarayiciDegis = async (v: boolean) => {
    if (!v) { t.gorunumAyarla({ masaustuBildirim: false }); return; }
    if (izin === "desteklenmiyor") return toast.error("Tarayıcı bildirimi desteklenmiyor", { description: "Bu tarayıcı bildirim göstermiyor. Güncel bir tarayıcıyla yeniden dene." });
    let s = izin;
    if (s === "default") { s = await Notification.requestPermission(); setIzin(s); }
    if (s !== "granted") return mesaj.izinGerekli("Bildirim");
    t.gorunumAyarla({ masaustuBildirim: true });
    kaydedildi();
  };
  const tarayiciDene = () => {
    if (izin !== "granted") return;
    const n = new Notification("Videon hazır", { body: "Seedance 2.5 üretimin tamamlandı. Görmek için tıkla.", icon: "/icon.png", tag: "vayra-deneme" });
    n.onclick = () => { window.focus(); n.close(); };
  };
  const denemeGonder = () => {
    bildir({ kategori: "uretim", tur: "basari", baslik: "Deneme bildirimi", mesaj: "Bildirim ayarların çalışıyor.", link: "/panel/ayarlar/bildirimler" });
    toast.success(t.bildirimTercih.uretim ? "Deneme bildirimi gönderildi" : "Üretim bildirimleri kapalı", { description: t.bildirimTercih.uretim ? "Sağ üstteki zile bak." : "Aşağıdan açarsan bildirim kutuna düşer." });
  };

  const onizleme = (
    <div className="grid gap-3">
      <OnizlemeKart baslik="Uygulamada" acik={t.bildirimTercih.uretim} ikon={Bell}>
        <div className="flex gap-3 rounded-[16px] bg-white/[0.06] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0"><span className="block text-[13.5px] font-semibold text-white">Videon hazır</span><span className="block truncate text-[12.5px] text-white/50">Seedance 2.5, 8 saniye, az önce</span></span>
        </div>
      </OnizlemeKart>
      <OnizlemeKart baslik="Tarayıcıda" acik={tarayiciAcik} ikon={MonitorUp}>
        <div className="flex gap-3 rounded-[16px] bg-[#2a2a2e] p-3">
          <img src="/icon.png" alt="" className="h-9 w-9 shrink-0 rounded-[10px]" />
          <span className="min-w-0"><span className="block text-[13.5px] font-semibold text-white">Videon hazır</span><span className="block text-[12.5px] leading-snug text-white/60">Seedance 2.5 üretimin tamamlandı.</span></span>
        </div>
      </OnizlemeKart>
    </div>
  );

  return (
    <Sayfa baslik="Bildirimler" aciklama="Neyi, nerede duymak istediğini seç. Bir üretim bittiğinde bildirimler böyle görünür." yan={onizleme}
      sag={<Link href="/panel/bildirimler" className={cn(dugme.hayalet, "h-8 text-[13px]")}>Bildirim kutusu<ArrowUpRight className="h-3.5 w-3.5" /></Link>}>

      <Grup id="olaylar" baslik="Ne hakkında, nereden" aciklama="Her olay için kanal seç."
        alt={<span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" />E-posta bildirimleri yakında gönderilmeye başlıyor; seçimin şimdiden kaydedilir.</span>}>
        <div className="hidden items-center gap-3 px-6 pb-2 pt-3.5 sm:flex">
          <span className="flex-1 text-[12.5px] text-white/35">Olay</span>
          {KANALLAR.map((k) => <span key={k.id} className="flex w-[72px] items-center justify-center gap-1.5 text-[12.5px] text-white/45"><k.ikon className="h-3.5 w-3.5" />{k.ad}</span>)}
        </div>
        {OLAYLAR.map((o) => (
          <div key={o.id} className="flex flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: `${o.renk}1c`, color: o.renk }}><o.ikon className="h-[17px] w-[17px]" /></span>
              <span className="min-w-0"><span className="block text-[14.5px] font-medium text-white">{o.ad}</span><span className="block text-[13px] text-white/45">{o.alt}</span></span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
              {KANALLAR.map((k) => {
                const zorunlu = o.zorunlu?.includes(k.id);
                const v = zorunlu || deger(o.id, k.id);
                return <KanalKutusu key={k.id} acik={v} kilit={zorunlu} etiket={`${o.ad}, ${k.ad}`} kisa={k.ad} ikon={k.ikon} soluk={k.id === "tarayici" && !tarayiciAcik} onDegis={(x) => hucre(o.id, k.id, x)} />;
              })}
            </div>
          </div>
        ))}
      </Grup>

      <Grup baslik="Tarayıcı ve ses">
        <Satir id="masaustu" ad={<span className="flex items-center gap-2">Tarayıcı bildirimleri{izin === "denied" && <Hap ton="kirmizi">Engellendi</Hap>}</span>}
          alt={izin === "denied" ? "Tarayıcı ayarlarından bu siteye bildirim izni ver." : "Sekme arka plandayken işin bitince işletim sistemi bildirimi gelir."}>
          {tarayiciAcik && <button type="button" onClick={tarayiciDene} className={dugme.hayalet}><Play className="h-3.5 w-3.5" />Dene</button>}
          <Anahtar acik={tarayiciAcik} kayit={false} disabled={izin === "denied" || izin === "desteklenmiyor"} onDegis={(v) => void tarayiciDegis(v)} etiket="Tarayıcı bildirimleri" />
        </Satir>
        <Satir id="ses" ad="Bildirim sesi" alt="Üretim bittiğinde kısa bir ses çalar.">
          <button type="button" onClick={() => bildirimSesiCal(false)} className={dugme.hayalet}><Volume2 className="h-3.5 w-3.5" />Dinle</button>
          <Anahtar acik={t.bildirimSesi} onDegis={(v) => { t.gorunumAyarla({ bildirimSesi: v }); if (v) bildirimSesiCal(false); }} etiket="Bildirim sesi" />
        </Satir>
        <Satir ad="Deneme bildirimi" alt="Ayarlarının çalıştığını gör.">
          <button type="button" onClick={denemeGonder} className={dugme.ikincil}><Sparkles className="h-3.5 w-3.5" />Gönder</button>
        </Satir>
        <Satir ad="Düşük kredi eşiği" alt={`Bakiyen ${t.krediEsigi} kredinin altına inince uyarılırsın.`}>
          <Link href="/panel/ayarlar/kullanim#esik" className={dugme.ikincil}>Değiştir</Link>
        </Satir>
      </Grup>
    </Sayfa>
  );
}

function OnizlemeKart({ baslik, acik, ikon: I, children }: { baslik: string; acik: boolean; ikon: typeof Bell; children: React.ReactNode }) {
  return (
    <motion.div animate={{ opacity: acik ? 1 : 0.45 }} transition={{ duration: 0.3 }} className="rounded-[22px] bg-[#121214] p-4 ring-1 ring-inset ring-white/[0.07]">
      <p className="mb-3 flex items-center justify-between text-[12.5px] text-white/45"><span className="flex items-center gap-1.5"><I className="h-3.5 w-3.5" />{baslik}</span><span>{acik ? "Açık" : "Kapalı"}</span></p>
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.25 }}>{children}</motion.div>
    </motion.div>
  );
}

/** Kanal hücresi: açıkken beyaz dolu (kanal simgesiyle), kapalıyken sönük. Tik kullanılmaz (site kuralı). */
function KanalKutusu({ acik, onDegis, etiket, kisa, kilit, soluk, ikon: I }: { acik: boolean; onDegis: (v: boolean) => void; etiket: string; kisa: string; kilit?: boolean; soluk?: boolean; ikon: typeof Bell }) {
  return (
    <button type="button" role="checkbox" aria-checked={acik} aria-label={etiket} disabled={kilit} title={kilit ? "Güvenliğin için kapatılamaz" : undefined} onClick={() => onDegis(!acik)}
      className={cn("flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] px-2 text-[12.5px] font-medium transition-colors sm:w-[72px] sm:px-0", acik ? "bg-white text-black" : "bg-white/[0.04] text-white/35 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.08] hover:text-white/70", soluk && acik && "opacity-50", kilit && "cursor-default")}>
      <AnimatePresence mode="wait" initial={false}>
        {acik ? <motion.span key="a" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.18, ease: akis }}>{kilit ? <Lock className="h-3.5 w-3.5" /> : <I className="h-3.5 w-3.5" strokeWidth={2.2} />}</motion.span>
          : <motion.span key="k" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><I className="h-3.5 w-3.5" /></motion.span>}
      </AnimatePresence>
      <span className="sm:hidden">{kisa}</span>
    </button>
  );
}
