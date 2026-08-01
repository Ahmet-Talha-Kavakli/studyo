"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import {
  Heart, MessageCircle, Bookmark, Share2, RefreshCw, Music2, Play,
  CheckCircle2, Lock, MoreHorizontal, EyeOff, Volume2, VolumeX, Flag, Link2, Disc3,
  Repeat2, Gift, Download, ThumbsDown, X,
} from "lucide-react";
import { useAkis, canliBegeni, canliGoruntulenme, HEDIYELER, type HediyeTur, type FeedGonderi } from "@/store/useAkis";
import { useAuth } from "@/store/useAuth";
import { profilBul, kisaSayi, goreliZaman } from "@/lib/akisVeri";
import { saltUrl, cn } from "@/lib/utils";
import { kopyala, uretimIndir } from "@/lib/gercekEylem";

/**
 * Akış — TikTok dikey tam-ekran kartı. Sağda dikey aksiyon çubuğu (avatar/beğeni/
 * yorum/kaydet/paylaş/recreate), altta yazar + açıklama + müzik şeridi.
 */
export function AkisKart({
  g,
  aktif,
  onYorum,
  onPaylas,
  onRecreate,
}: {
  g: FeedGonderi;
  aktif: boolean;
  onYorum: () => void;
  onPaylas: () => void;
  onRecreate: () => void;
}) {
  const router = useRouter();
  const { begeniler, begenmeyenler, repostlar, kayitlar, ekGoruntulenme, gizle, goruntulendi, maviTik: benimMaviTik } = useAkis();
  const begenili = begeniler.includes(g.id);
  const begenmedim = begenmeyenler.includes(g.id);
  const repostli = repostlar.includes(g.id);
  const kayitli = kayitlar.includes(g.id);
  const [menu, setMenu] = useState(false);
  const [sessiz, setSessiz] = useState(true);
  const [kalpAnim, setKalpAnim] = useState(false);
  const [hediyeAcik, setHediyeAcik] = useState(false); // m4: hediye seçici sheet
  const gorunmusRef = useRef(false);
  // m4: hediye gönderme — krediyi GERÇEKTEN düşer (profilGuncelle ile yalnız
  // krediler alanı; ekKredi=satın alınan bakiye bozulmasın) + hediyeyi kaydeder.
  const hediyeGonder = (tur: HediyeTur) => {
    const meta = HEDIYELER.find((h) => h.tur === tur)!;
    const k = useAuth.getState().kullanici;
    if (!k) return;
    if (k.krediler < meta.kredi) { toast.error("Yetersiz kredi", { description: `${meta.ad} için ${meta.kredi} kredi gerekli.` }); return; }
    useAuth.getState().profilGuncelle({ krediler: k.krediler - meta.kredi });
    useAkis.getState().hediyeGonder(g.id, tur);
    setHediyeAcik(false);
    toast.success(`${meta.ikon} ${meta.ad} gönderildi!`, { description: `${g.kullanici} sana teşekkür ediyor · -${meta.kredi} kredi` });
  };

  const profil = profilBul(g.kullanici);
  const poster = saltUrl(g.gorselUrl);

  // Kart aktif olunca (viewport'a girince) görüntülenme say — bir kez.
  useEffect(() => {
    if (aktif && !gorunmusRef.current) {
      gorunmusRef.current = true;
      goruntulendi(g.id);
    }
  }, [aktif, g.id, goruntulendi]);

  const begeniSayi = canliBegeni(g, begenili);
  const goruntulenmeSayi = canliGoruntulenme(g, ekGoruntulenme[g.id] ?? 0);

  const cifTikBegen = () => {
    if (!begenili) useAkis.getState().begeniToggle(g.id);
    setKalpAnim(true);
    setTimeout(() => setKalpAnim(false), 700);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Medya — 9:16 dikey kart, tıklanınca çift-tık beğeni */}
      <div
        onDoubleClick={cifTikBegen}
        className="relative h-full w-full max-w-[min(100%,calc((100vh-1rem)*9/16))] overflow-hidden rounded-2xl bg-ink-900"
        style={{ background: g.gorselUrl }}
      >
        {poster && (
          <img src={poster} alt={g.baslik} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        )}
        {/* video türü → oynatma katmanı ipucu */}
        {g.tur === "video" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-opacity duration-500",
              aktif ? "opacity-0" : "opacity-90",
            )}>
              <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
            </span>
          </div>
        )}

        {/* çift-tık kalp animasyonu */}
        <AnimatePresence>
          {kalpAnim && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart className="h-28 w-28 fill-white text-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* alt gradyan — metin okunurluğu */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {/* üst-sağ: sessiz + ... menü */}
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          {g.tur === "video" && (
            <button onClick={() => setSessiz((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55">
              {sessiz ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
            </button>
          )}
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55">
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </button>
            <AnimatePresence>
              {menu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="menu-surface absolute right-0 top-11 z-40 w-52 overflow-hidden rounded-xl p-1.5"
                  >
                    <button onClick={() => { void kopyala(`vayra.app/akis/${g.id}`, "Bağlantı kopyalandı"); setMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-white hover:bg-white/8">
                      <Link2 className="h-4 w-4 text-metin-2" /> Bağlantıyı kopyala
                    </button>
                    {/* m4: İndir — YALNIZCA paylaşan izin verdiyse (izinYenidenOlustur). */}
                    <button onClick={() => {
                        if (!g.izinYenidenOlustur) { toast.error("İndirme kapalı", { description: "Bu yaratıcı içeriğinin indirilmesine izin vermemiş." }); setMenu(false); return; }
                        uretimIndir({ baslik: g.baslik, gorselUrl: g.gorselUrl, videoUrl: g.videoUrl });
                        setMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-white hover:bg-white/8">
                      <Download className={cn("h-4 w-4", g.izinYenidenOlustur ? "text-metin-2" : "text-white/30")} /> İndir {!g.izinYenidenOlustur && <Lock className="ml-auto h-3 w-3 text-white/30" />}
                    </button>
                    <button onClick={() => { useAkis.getState().kayitToggle(g.id); toast.success(kayitli ? "Kayıtlardan çıkarıldı" : "Kaydedildi"); setMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-white hover:bg-white/8">
                      <Bookmark className={cn("h-4 w-4", kayitli ? "fill-aksan text-aksan" : "text-metin-2")} /> {kayitli ? "Kayıtlardan çıkar" : "Kaydet"}
                    </button>
                    <button onClick={() => { gizle(g.id); toast("Bu gönderi gizlendi", { description: "Artık akışında görünmeyecek." }); setMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-white hover:bg-white/8">
                      <EyeOff className="h-4 w-4 text-metin-2" /> İlgilenmiyorum
                    </button>
                    <div className="my-1 h-px bg-white/8" />
                    {/* m4: Şikayet et — GERÇEK raporla (feed'den de gizler). */}
                    <button onClick={() => { useAkis.getState().raporla(g.id); toast.success("Gönderi şikayet edildi", { description: "İncelenmek üzere ekibimize iletildi ve akışından kaldırıldı." }); setMenu(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10">
                      <Flag className="h-4 w-4" /> Şikayet et
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* alt metin — yazar + açıklama + müzik */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pr-16 sm:pr-20">
          <Link href={`/panel/akis/profil/${g.kullanici.replace("@", "")}`}
            className="mb-2 flex items-center gap-2 text-white">
            <span className="text-[15px] font-bold hover:underline">{g.kullanici}</span>
            {/* m4: mavi tik — kurgusal yaratıcıda dogrulanmis, kendi gönderinde satın alınan maviTik */}
            {(profil?.dogrulanmis || (g.benimMi && benimMaviTik)) && <CheckCircle2 className="h-[15px] w-[15px] fill-sky-400 text-zemin" />}
            {g.benimMi && <span className="rounded-full bg-aksan px-2 py-0.5 text-[10px] font-bold text-zemin">Sen</span>}
          </Link>
          <p className="mb-1.5 line-clamp-2 text-[14px] leading-snug text-white/95">{g.baslik}</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {/* m4: etikete tıklayınca o etiketin içeriklerine git (gerçek — yakında değil) */}
            {g.etiketler.slice(0, 3).map((e) => (
              <button key={e} onClick={() => router.push(`/panel/akis?etiket=${encodeURIComponent(e.replace(/^#/, ""))}`)}
                className="text-[13px] font-medium text-aksan hover:underline">{e}</button>
            ))}
          </div>
          {/* müzik şeridi — kayan yazı hissi (TikTok) */}
          <div className="flex items-center gap-2 overflow-hidden text-[12.5px] text-white/85">
            <Music2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{g.muzik}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-[11.5px] text-white/55">
            <span>{kisaSayi(goruntulenmeSayi)} görüntülenme</span>
            <span>·</span>
            <span>{goreliZaman(g.olusturmaOfset)}</span>
            <span>·</span>
            <span>{g.model}</span>
          </div>
        </div>

        {/* SAĞ dikey aksiyon çubuğu — TikTok birebir */}
        <div className="absolute bottom-4 right-2.5 z-20 flex flex-col items-center gap-4">
          {/* avatar + takip + */}
          <Link href={`/panel/akis/profil/${g.kullanici.replace("@", "")}`} className="relative mb-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-white"
              style={{ background: profil ? undefined : "var(--sn-lime, #55d6fd)" }}>
              <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-aksan to-emerald-400 text-[15px] font-bold text-zemin">
                {g.kullanici.replace("@", "").charAt(0).toUpperCase()}
              </span>
            </span>
            {!g.benimMi && <TakipDugmesi kullanici={g.kullanici} />}
          </Link>

          <AksiyonDugme
            ikon={<Heart className={cn("h-8 w-8 transition-transform", begenili ? "fill-rose-500 text-rose-500 scale-110" : "text-white")} />}
            etiket={kisaSayi(begeniSayi)}
            vurgu={begenili}
            onClick={() => useAkis.getState().begeniToggle(g.id)}
          />
          {/* m4: dislike (beğenmeme) — ücretsiz, beğeniyle karşılıklı dışlar */}
          <AksiyonDugme
            ikon={<ThumbsDown className={cn("h-7 w-7 transition-transform", begenmedim ? "fill-white/90 text-white scale-110" : "text-white")} />}
            etiket="İlgim yok"
            vurgu={begenmedim}
            onClick={() => useAkis.getState().begenmeToggle(g.id)}
          />
          <AksiyonDugme
            ikon={<MessageCircle className="h-8 w-8 text-white" />}
            etiket={kisaSayi(g.yorumTohum + (useAkis.getState().ekYorumlar[g.id]?.length ?? 0))}
            onClick={onYorum}
          />
          {/* m4: hediye gönder — ücretli (alev/ejderha…) */}
          <AksiyonDugme
            ikon={<Gift className="h-8 w-8 text-amber-300" />}
            etiket="Hediye"
            onClick={() => setHediyeAcik(true)}
          />
          {/* m4: repost (yeniden paylaş) */}
          <AksiyonDugme
            ikon={<Repeat2 className={cn("h-8 w-8", repostli ? "text-emerald-400" : "text-white")} />}
            etiket={repostli ? "Repostlandı" : "Repost"}
            vurgu={repostli}
            onClick={() => { useAkis.getState().repostToggle(g.id); toast.success(repostli ? "Repost geri alındı" : "Yeniden paylaşıldı 🔁", { description: repostli ? undefined : "Takipçilerin bu gönderiyi görecek." }); }}
          />
          <AksiyonDugme
            ikon={<Bookmark className={cn("h-8 w-8", kayitli ? "fill-aksan text-aksan" : "text-white")} />}
            etiket={kayitli ? "Kayıtlı" : "Kaydet"}
            vurgu={kayitli}
            onClick={() => { useAkis.getState().kayitToggle(g.id); toast.success(kayitli ? "Kayıtlardan çıkarıldı" : "Kaydedildi"); }}
          />
          <AksiyonDugme
            ikon={<Share2 className="h-8 w-8 text-white" />}
            etiket={kisaSayi(g.paylasimTohum)}
            onClick={onPaylas}
          />
          {/* Recreate — yalnızca izin verilmişse aktif */}
          <button
            onClick={() => g.izinYenidenOlustur ? onRecreate() : toast.error("Bu yaratıcı yeniden oluşturmaya izin vermemiş", { icon: <Lock className="h-4 w-4" /> })}
            className="flex flex-col items-center gap-1"
          >
            <span className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
              g.izinYenidenOlustur ? "bg-aksan text-zemin hover:scale-105" : "bg-white/15 text-white/50",
            )}>
              {g.izinYenidenOlustur ? <RefreshCw className="h-[22px] w-[22px]" /> : <Lock className="h-[19px] w-[19px]" />}
            </span>
            <span className="text-[11px] font-semibold text-white">
              {g.izinYenidenOlustur ? "Yeniden" : "Kilitli"}
            </span>
          </button>

          {/* Dönen müzik plağı — m4: tıklayınca "bu ses" sayfasına git (o sesi kullan
              + o sesteki diğer videolar). Gerçek — yakında değil. */}
          <motion.button
            onClick={() => router.push(`/panel/akis/ses/${encodeURIComponent(g.muzik)}`)}
            animate={aktif ? { rotate: 360 } : { rotate: 0 }}
            transition={aktif ? { repeat: Infinity, duration: 6, ease: "linear" } : { duration: 0.3 }}
            className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 ring-2 ring-white/20"
            aria-label="Ses">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-emerald-400 text-zemin">
              <Disc3 className="h-3.5 w-3.5" />
            </span>
          </motion.button>
        </div>

        {/* m4: HEDİYE SEÇİCİ sheet — alttan açılır (TikTok "Send gift") */}
        <AnimatePresence>
          {hediyeAcik && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setHediyeAcik(false)} className="absolute inset-0 z-30 bg-black/50 backdrop-blur-[2px]" />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
                className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-white/10 bg-[#161618] p-4 pb-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-[15px] font-bold text-white"><Gift className="h-5 w-5 text-amber-300" /> Hediye gönder</p>
                  <button onClick={() => setHediyeAcik(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                <p className="mb-3 text-[12.5px] text-white/50">{g.kullanici}&rsquo;a bir hediye gönder — krediyle.</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {HEDIYELER.map((h) => (
                    <button key={h.tur} onClick={() => hediyeGonder(h.tur)}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] py-3.5 transition-all hover:border-amber-300/40 hover:bg-amber-300/[0.06] active:scale-95">
                      <span className="text-3xl leading-none">{h.ikon}</span>
                      <span className="text-[12px] font-medium text-white">{h.ad}</span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300">🪙 {h.kredi}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AksiyonDugme({ ikon, etiket, onClick, vurgu }: { ikon: React.ReactNode; etiket: string; onClick: () => void; vurgu?: boolean }) {
  return (
    <motion.button onClick={onClick} className="flex flex-col items-center gap-1"
      whileTap={{ scale: 0.82 }}
      animate={vurgu ? { scale: [1, 1.35, 1] } : { scale: 1 }}
      transition={{ duration: vurgu ? 0.42 : 0.2, ease: "easeOut" }}>
      {ikon}
      <span className="text-[12px] font-semibold text-white drop-shadow">{etiket}</span>
    </motion.button>
  );
}

function TakipDugmesi({ kullanici }: { kullanici: string }) {
  const takipler = useAkis((s) => s.takipler);
  const takipli = takipler.includes(kullanici);
  if (takipli) return null;
  return (
    <button
      onClick={(e) => { e.preventDefault(); useAkis.getState().takipToggle(kullanici); toast.success(`${kullanici} takip edildi`); }}
      className="absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-rose-500 text-white ring-2 ring-black/10"
      aria-label="Takip et"
    >
      <span className="text-[15px] font-bold leading-none">+</span>
    </button>
  );
}
