"use client";

/**
 * Kampanyaya bağlantı gönderme: 1) hesap (gerçek platform logoları, doğrulanmış olanlar seçilebilir),
 * 2) kitaplıktan Vayra üretimi, 3) gönderi bağlantısı (biçim + kopya + platformda sahiplik kontrolü),
 * gereksinim onayı, beyaz Gönder. Hak, kontenjan ve doğrulama kuralları eskisiyle aynı.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, ImageOff, Info, Link2, Loader2, ShieldCheck } from "lucide-react";
import { useEarn, kampanyaHakki, type BagliHesap, type GonderiKontrol } from "@/store/useEarn";
import { useProjeler } from "@/store/useProjeler";
import { gonderiKontrolIstek } from "@/lib/earn/istemci";
import { KURALLAR, platformBul, type Kampanya, type Platform } from "@/lib/earn/kampanyalar";
import { PlatformLogo } from "../ortak";
import { toast } from "@/lib/toast";
import { cn, saltUrl } from "@/lib/utils";
import { yay, yuzey } from "./parcalar";

/** Bağlantının seçilen platforma ait olup olmadığı. */
const ALAN: Record<Platform, RegExp> = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[\w-]+/i,
  tiktok: /^https?:\/\/(www\.|vm\.)?tiktok\.com\/.+/i,
  youtube: /^https?:\/\/(www\.)?(youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)[\w-]+/i,
  x: /^https?:\/\/(www\.)?(x|twitter)\.com\/\w+\/status\/\d+/i,
};

type KontrolDurumu = { d: "bos" } | { d: "bekliyor" } | { d: "hata"; mesaj: string } | { d: "tamam"; kontrol: GonderiKontrol; yazar?: string };

function Basamak({ no, baslik, tamam, children }: { no: number; baslik: string; tamam: boolean; children: React.ReactNode }) {
  return (
    <div className="relative pl-10">
      <span className={cn("absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors duration-300", tamam ? "bg-[#55d6fd] text-[#06222b]" : "text-white ring-1 ring-white/[0.18]")}>
        {tamam ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : no}
      </span>
      <p className="pt-0.5 text-[14px] font-medium text-white">{baslik}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function GonderimAkisi({ k, hesaplar }: { k: Kampanya; hesaplar: BagliHesap[] }) {
  const gonder = useEarn((s) => s.gonder);
  const gonderiler = useEarn((s) => s.gonderiler);
  const uretimler = useProjeler((s) => s.uretimler);
  const uygun = k.platformlar.filter((p) => hesaplar.some((h) => h.platform === p && h.durum === "dogrulandi"));
  const [platform, setPlatform] = useState<Platform | null>(uygun[0] ?? null);
  const [uretimId, setUretimId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [kontrol, setKontrol] = useState<KontrolDurumu>({ d: "bos" });
  const [onay, setOnay] = useState(false);
  const hak = kampanyaHakki(k, gonderiler);

  const adaylar = uretimler.filter((u) => u.durum === "tamam" && k.ciktiTurleri.includes(u.tur)).sort((a, b) => b.olusturma - a.olusturma).slice(0, 8);
  const hesap = hesaplar.find((h) => h.platform === platform);
  const temiz = link.trim();
  const bicimGecerli = !!platform && ALAN[platform].test(temiz);
  const kopya = gonderiler.some((g) => g.link.replace(/[?#].*$/, "").toLowerCase() === temiz.replace(/[?#].*$/, "").toLowerCase());

  // Bağlantı değişince sunucuda gerçek kontrol (oEmbed), 600 ms bekleyip.
  useEffect(() => {
    if (!platform || !hesap || !bicimGecerli || kopya) { setKontrol({ d: "bos" }); return; }
    setKontrol({ d: "bekliyor" });
    let iptal = false;
    const t = setTimeout(async () => {
      const r = await gonderiKontrolIstek(platform, temiz, hesap.kadi);
      if (iptal) return;
      if (!r.ok) return setKontrol({ d: "hata", mesaj: r.hata ?? "Bağlantı kontrol edilemedi." });
      if (!r.gercek) return setKontrol({ d: "tamam", kontrol: { gercek: false, sahibiMi: null } });
      if (!r.var) return setKontrol({ d: "hata", mesaj: r.hata ?? "Gönderi bulunamadı." });
      if (r.sahibiMi === false) return setKontrol({ d: "hata", mesaj: `Bu gönderi @${hesap.kadi} hesabına ait değil${r.yazar ? ` (paylaşan: ${r.yazar})` : ""}. Yalnız doğruladığın hesabın gönderileri kabul edilir.` });
      setKontrol({ d: "tamam", yazar: r.yazar, kontrol: { gercek: true, sahibiMi: r.sahibiMi ?? null, baslik: r.baslik, kucukResim: r.kucukResim } });
    }, 600);
    return () => { iptal = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, temiz, hesap?.kadi, bicimGecerli, kopya]);

  if (!uygun.length) {
    return (
      <div className={cn(yuzey, "p-6")}>
        <p className="text-[17px] font-semibold text-white">Önce hesabını doğrula</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">Bu kampanya şu platformlardaki gönderileri kabul ediyor:</p>
        <div className="mt-4 flex gap-2">
          {k.platformlar.map((p) => (
            <span key={p} className="flex items-center gap-2 rounded-full bg-white/[0.05] py-1.5 pl-2 pr-3 text-[13px] text-white ring-1 ring-white/[0.08]"><PlatformLogo id={p} boyut={15} />{platformBul(p).ad}</span>
          ))}
        </div>
        <Link href="/earn/hesaplar" className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"><ShieldCheck className="h-4 w-4" />Hesap doğrula</Link>
      </div>
    );
  }
  if (!hak.hakKaldi) {
    return (
      <div className={cn(yuzey, "p-6")}>
        <p className="flex items-center gap-2 text-[17px] font-semibold text-white"><CheckCircle2 className="h-5 w-5 text-[#8fe6ff]" />Başvurun alındı</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">{k.tur === "yarisma" ? "Yarışmalarda" : "Görevlerde"} kişi başı bir gönderi kabul edilir. Durumunu aşağıdaki gönderilerinden takip edebilirsin.</p>
      </div>
    );
  }
  if (hak.kotaKalan === 0) {
    return <div className={cn(yuzey, "p-6 text-[13.5px] text-white/60")}>Bu görevin kontenjanı doldu. Yeni görevler için kampanyaları takip et.</div>;
  }

  const secili = adaylar.find((u) => u.id === uretimId);
  const hazir = !!platform && !!secili && kontrol.d === "tamam" && onay;
  const linkHata = !temiz ? null : !bicimGecerli ? `Geçerli bir ${platformBul(platform!).ad} gönderi bağlantısı gir.` : kopya ? "Bu bağlantıyı daha önce gönderdin." : kontrol.d === "hata" ? kontrol.mesaj : null;

  const gonderBas = () => {
    if (!hazir || !platform || kontrol.d !== "tamam") return;
    gonder({ kampanyaId: k.id, platform, link: temiz, uretimId: secili.id, uretimGorsel: saltUrl(secili.gorselUrl ?? secili.thumbnailUrl), kontrol: kontrol.kontrol });
    toast.success("Gönderin alındı", { description: "Gönderin incelemede. Vayra ekibi inceleyip sonucu bildirim olarak gönderecek." });
    setLink(""); setOnay(false); setUretimId(null); setKontrol({ d: "bos" });
  };

  return (
    <div id="gonder" className={cn(yuzey, "scroll-mt-24 p-5 sm:p-6")}>
      <p className="text-[13.5px] text-white/60">Gönderin incelemede. Onay ya da ret kararı bildirim olarak gelir.</p>

      <div className="mt-5 space-y-6">
        <Basamak no={1} baslik="Hesap" tamam={!!platform}>
          <div className="grid grid-cols-2 gap-2">
            {k.platformlar.map((p) => {
              const h = hesaplar.find((x) => x.platform === p && x.durum === "dogrulandi");
              const sec = platform === p;
              return (
                <button key={p} disabled={!h} onClick={() => setPlatform(p)} aria-pressed={sec}
                  className={cn("relative flex items-center gap-2.5 rounded-[14px] py-2.5 pl-2.5 pr-7 text-left ring-1 transition active:scale-[0.98]", sec ? "bg-white/[0.08] ring-white/[0.3]" : "ring-white/[0.08] hover:bg-white/[0.03]", !h && "cursor-not-allowed opacity-35")}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><PlatformLogo id={p} boyut={16} /></span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-white">{platformBul(p).ad}</span><span className="block truncate text-[11.5px] text-white/50">{h ? `@${h.kadi}` : "Doğrulanmadı"}</span></span>
                  {sec && <motion.span layoutId={"gp-" + k.id} transition={yay} className="absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-white"><Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} /></motion.span>}
                </button>
              );
            })}
          </div>
        </Basamak>

        <Basamak no={2} baslik="Paylaştığın Vayra üretimi" tamam={!!secili}>
          {adaylar.length ? (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                {adaylar.map((u) => {
                  const kapak = u.gorselUrl ?? u.thumbnailUrl;
                  const sec = uretimId === u.id;
                  return (
                    <button key={u.id} onClick={() => setUretimId(u.id)} aria-pressed={sec} title={u.baslik}
                      className={cn("relative aspect-square overflow-hidden rounded-[12px] bg-white/[0.05] outline outline-2 -outline-offset-2 transition", sec ? "outline-white" : "outline-transparent opacity-70 hover:opacity-100")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {kapak ? <img src={saltUrl(kapak) ?? kapak} alt={u.baslik} className="h-full w-full object-cover" /> : <ImageOff className="m-auto h-4 w-4 text-white/40" />}
                      {sec && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white"><Check className="h-2.5 w-2.5 text-black" strokeWidth={3.5} /></span>}
                    </button>
                  );
                })}
              </div>
              {secili && <p className="mt-2 truncate text-[12px] text-white/50">{secili.baslik} · {secili.model}</p>}
            </>
          ) : (
            <div className="rounded-[14px] bg-white/[0.03] p-3.5 text-[13px] leading-relaxed text-white/60 ring-1 ring-white/[0.07]">
              Kitaplığında bu kampanyaya uygun bir üretim yok.
              {k.kit[0] && <Link href={`${k.kit[0].studyo}?istem=${encodeURIComponent(k.kit[0].istem)}`} className="mt-2 flex w-max items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-black">Kitle şimdi üret</Link>}
            </div>
          )}
        </Basamak>

        <Basamak no={3} baslik="Gönderi bağlantısı" tamam={kontrol.d === "tamam"}>
          <div className={cn("flex h-11 items-center gap-2 rounded-[14px] bg-black/25 px-3 ring-1 transition", linkHata ? "ring-rose-400/50" : "ring-white/[0.1] focus-within:ring-white/[0.3]")}>
            {platform ? <PlatformLogo id={platform} boyut={15} /> : <Link2 className="h-4 w-4 text-white/40" />}
            <input value={link} onChange={(e) => setLink(e.target.value)} aria-label="Gönderi bağlantısı"
              placeholder={platform === "youtube" ? "https://youtube.com/shorts/..." : platform === "x" ? "https://x.com/.../status/..." : `https://${platform ?? "instagram"}.com/...`}
              className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/30" />
            {kontrol.d === "bekliyor" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />}
            {kontrol.d === "tamam" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />}
          </div>
          <AnimatePresence initial={false}>
            {linkHata && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden text-[12.5px] text-rose-300">{linkHata}</motion.p>}
            {kontrol.d === "tamam" && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-2.5 rounded-[14px] bg-white/[0.04] p-2.5 ring-1 ring-white/[0.07]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {kontrol.kontrol.kucukResim && <img src={kontrol.kontrol.kucukResim} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover" />}
                <span className="min-w-0 text-[12.5px] leading-snug">
                  {kontrol.kontrol.gercek ? (
                    <>
                      <span className="block font-medium text-emerald-300">{kontrol.kontrol.sahibiMi ? `Gönderi bulundu · @${hesap?.kadi}` : "Gönderi bulundu"}</span>
                      {kontrol.kontrol.baslik && <span className="block truncate text-white/50">{kontrol.kontrol.baslik}</span>}
                      {kontrol.kontrol.sahibiMi === null && <span className="block text-white/50">Sahiplik incelemede kontrol edilecek.</span>}
                    </>
                  ) : <span className="text-white/60">Bu platform için otomatik kontrol kapalı; gönderin incelemede elle doğrulanacak.</span>}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Basamak>
      </div>

      <button role="checkbox" aria-checked={onay} onClick={() => setOnay((x) => !x)} className="mt-6 flex w-full items-start gap-3 rounded-[14px] p-2 text-left text-[13px] leading-relaxed text-white/65 transition hover:bg-white/[0.03]">
        <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] ring-1 transition", onay ? "bg-white ring-white" : "ring-white/[0.25]")}>
          <AnimatePresence>{onay && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={yay}><Check className="h-3.5 w-3.5 text-black" strokeWidth={3.5} /></motion.span>}</AnimatePresence>
        </span>
        Gönderi tüm gereksinimleri ve zorunlu etiketleri ({k.etiketler.join(" ")}) karşılıyor.
      </button>
      <button onClick={gonderBas} disabled={!hazir}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:bg-white/[0.07] disabled:text-white/35">Gönder</button>
      <p className="mt-3 flex gap-1.5 text-[12px] leading-relaxed text-white/45"><Info className="mt-px h-3.5 w-3.5 shrink-0" />İzlenmeler gönderiden sonraki {KURALLAR.kazanmaGun} gün boyunca sayılır; bu sürede paylaşımı yayından kaldırma.</p>
    </div>
  );
}
