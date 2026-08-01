"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  ArrowLeft, CheckCircle2, Heart, Play, Grid3x3, Bookmark, Lock, Share2, Settings, Award,
  Image as ImageIcon, BarChart3, Eye, TrendingUp,
} from "lucide-react";
import { useAkis, birlesikFeed, type FeedGonderi } from "@/store/useAkis";
import { profilBul, kisaSayi, AKIS_PROFILLER } from "@/lib/akisVeri";
import { useAuth } from "@/store/useAuth";
import { saltUrl, onizlemeArka, cn } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";
import { kopyala } from "@/lib/gercekEylem";

/** Akış profil sayfası — kurgusal yaratıcı VEYA kullanıcının kendi profili (@ben). */
export function AkisProfil({ handle }: { handle: string }) {
  const router = useRouter();
  const kullanici = "@" + handle;
  const benimProfilim = handle === "ben";
  const benKullanici = useAuth((s) => s.kullanici);
  const avatarUrl = benKullanici?.avatar;
  const benimAd = benKullanici?.ad || "Sen";

  const paylasimlar = useAkis((s) => s.paylasimlar);
  const gizlenenler = useAkis((s) => s.gizlenenler);
  const takipler = useAkis((s) => s.takipler);
  const kayitlar = useAkis((s) => s.kayitlar);
  const begeniler = useAkis((s) => s.begeniler);
  const benimMaviTik = useAkis((s) => s.maviTik);
  const [sekme, setSekme] = useState<"gonderiler" | "kayitlar" | "begenilenler">("gonderiler");

  const tumFeed = useMemo(() => birlesikFeed(paylasimlar, gizlenenler), [paylasimlar, gizlenenler]);
  const profil = profilBul(kullanici);

  const gonderiler = useMemo(() => tumFeed.filter((g) => g.kullanici === kullanici), [tumFeed, kullanici]);
  const kaydedilenler = useMemo(() => tumFeed.filter((g) => kayitlar.includes(g.id)), [tumFeed, kayitlar]);
  const begenilenler = useMemo(() => tumFeed.filter((g) => begeniler.includes(g.id)), [tumFeed, begeniler]);

  // m4: Instagram hikaye — kendi hikayelerim + hikaye görüntüleyici (tumFeed sonrası).
  const hikayelerim = useAkis((s) => s.hikayeler);
  const goruntulenenHikayeler = useAkis((s) => s.goruntulenenHikayeler);
  const hikayeGoruldu = useAkis((s) => s.hikayeGoruldu);
  const hikayeRef = useRef<HTMLInputElement>(null);
  const [hikayeIzle, setHikayeIzle] = useState<{ handle: string; gorsel: string; ad: string } | null>(null);
  const hikayeYukle = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { useAkis.getState().hikayeEkle(String(r.result)); toast.success("Hikaye eklendi 📸", { description: "24 saat boyunca görünür olacak." }); };
    r.readAsDataURL(f);
  };
  // Başkasının profilinde: deterministik kurgusal hikaye (highlight) — ilk gönderisinin görseli.
  const digerHikaye = useMemo(() => {
    if (benimProfilim) return null;
    const ilk = tumFeed.find((g) => g.kullanici === kullanici);
    return ilk ? { handle: kullanici, gorsel: ilk.gorselUrl, ad: profil?.ad ?? kullanici } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benimProfilim, kullanici, tumFeed]);
  const hikayeGorulmus = benimProfilim ? false : goruntulenenHikayeler.includes(kullanici);
  const hikayeVar = benimProfilim ? hikayelerim.length > 0 : !!digerHikaye;
  const hikayeAvatarAc = () => {
    if (benimProfilim) {
      if (hikayelerim.length > 0) setHikayeIzle({ handle: kullanici, gorsel: hikayelerim[0].gorselUrl, ad: benimAd });
      else hikayeRef.current?.click();
    } else if (digerHikaye) {
      setHikayeIzle({ handle: digerHikaye.handle, gorsel: saltUrl(digerHikaye.gorsel) || digerHikaye.gorsel, ad: digerHikaye.ad });
      hikayeGoruldu(kullanici);
    }
  };

  const takipli = takipler.includes(kullanici);
  const toplamBegeni = gonderiler.reduce((a, g) => a + g.begeniTohum, 0) + (profil?.begeniToplam ?? 0);

  // Banner — kendi profilinde değiştirilebilir; başkalarında tohumdan deterministik.
  const benimBanner = useAkis((s) => s.benimBanner);
  const bannerAyarla = useAkis((s) => s.bannerAyarla);
  const bannerRef = useRef<HTMLInputElement>(null);
  const bannerUrl = benimProfilim ? benimBanner : saltUrl(origArka("banner-" + kullanici, "sinematik"));
  const bannerArka = origArka("banner-" + kullanici, "sinematik");
  const bannerYukle = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { bannerAyarla(String(r.result)); toast.success("Banner güncellendi"); };
    r.readAsDataURL(f);
  };

  const aktifListe = sekme === "gonderiler" ? gonderiler : sekme === "kayitlar" ? kaydedilenler : begenilenler;

  return (
    <div className="min-h-[calc(100vh-3rem)]">
      {/* BANNER — kapak görseli (kendi profilinde değiştirilebilir) */}
      <div className="relative h-40 w-full overflow-hidden sm:h-56"
        style={{ background: bannerArka }}>
        {bannerUrl && <img src={bannerUrl} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-zemin via-zemin/20 to-transparent" />
        <button onClick={() => router.back()} className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[13px] text-white backdrop-blur-sm hover:bg-black/60">
          <ArrowLeft className="h-4 w-4" /> Akış'a dön
        </button>
        {benimProfilim && (
          <>
            <input ref={bannerRef} type="file" accept="image/*" hidden onChange={(e) => bannerYukle(e.target.files?.[0])} />
            <button onClick={() => bannerRef.current?.click()}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70">
              <ImageIcon className="h-4 w-4" /> Banner değiştir
            </button>
          </>
        )}
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-6">
      {/* profil başlık — avatar banner'a biner (TikTok/Instagram düzeni) */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        {/* m4: Instagram hikaye çemberli avatar — hikaye varsa gradient ring,
            görülmemişse renkli / görülmüşse gri; tıklayınca hikaye açılır. */}
        <input ref={hikayeRef} type="file" accept="image/*" hidden onChange={(e) => hikayeYukle(e.target.files?.[0])} />
        <button onClick={hikayeAvatarAc}
          className={cn("relative -mt-14 flex h-28 w-28 shrink-0 items-center justify-center rounded-full p-[3px] sm:-mt-16 sm:h-32 sm:w-32",
            hikayeVar ? (hikayeGorulmus ? "bg-white/20" : "bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500") : "bg-zemin ring-1 ring-white/10")}>
          <span className="flex h-full w-full items-center justify-center rounded-full bg-zemin p-1">
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-aksan to-emerald-400 text-4xl font-bold text-zemin">
              {benimProfilim && avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : kullanici.replace("@", "").charAt(0).toUpperCase()}
            </span>
          </span>
          {/* kendi profilimde hikaye ekle + rozeti */}
          {benimProfilim && (
            <span onClick={(e) => { e.stopPropagation(); hikayeRef.current?.click(); }}
              className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-aksan text-zemin ring-2 ring-zemin">
              <span className="text-[18px] font-bold leading-none">+</span>
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 pt-1 text-center sm:pb-2 sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold text-white">{benimProfilim ? benimAd : profil?.ad ?? kullanici}</h1>
            {/* m4: mavi tik — başkasında dogrulanmis, kendimde satın alınan maviTik */}
            {((benimProfilim && benimMaviTik) || (!benimProfilim && profil?.dogrulanmis)) && <CheckCircle2 className="h-5 w-5 fill-sky-400 text-zemin" />}
          </div>
          <p className="text-sm text-metin-3">{benimProfilim ? "@" + (benKullanici?.ad?.replace(/\s+/g, "").toLowerCase() || "ben") : kullanici}</p>
          <p className="mt-2 max-w-md text-[14px] leading-snug text-metin-2">
            {benimProfilim ? (benKullanici?.bio || "Vayra ile üretiyorum ✨ · Akış'ta paylaştığım işler") : profil?.bio ?? "Vayra yaratıcısı"}
          </p>

          {/* istatistikler */}
          <div className="mt-3 flex items-center justify-center gap-6 sm:justify-start">
            <Istat sayi={kisaSayi(gonderiler.length)} etiket="Gönderi" />
            <Istat sayi={kisaSayi(profil?.takipci ?? (takipler.length * 0 + 128))} etiket="Takipçi" />
            <Istat sayi={kisaSayi(benimProfilim ? takipler.length : profil?.takip ?? 0)} etiket="Takip" />
            <Istat sayi={kisaSayi(toplamBegeni)} etiket="Beğeni" />
          </div>

          {/* aksiyon */}
          <div className="mt-4 flex items-center justify-center gap-2 sm:justify-start">
            {benimProfilim ? (
              <Link href="/panel/ayarlar" className="flex items-center gap-2 rounded-full bg-white/8 px-5 py-2 text-sm font-semibold text-white hover:bg-white/12">
                <Settings className="h-4 w-4" /> Profili düzenle
              </Link>
            ) : (
              <button
                onClick={() => { useAkis.getState().takipToggle(kullanici); toast.success(takipli ? "Takipten çıkıldı" : `${kullanici} takip edildi`); }}
                className={cn("rounded-full px-8 py-2 text-sm font-bold transition-colors",
                  takipli ? "bg-white/10 text-white hover:bg-white/15" : "bg-aksan text-zemin hover:scale-105")}>
                {takipli ? "Takiptesin" : "Takip et"}
              </button>
            )}
            <button onClick={() => { void kopyala(`vayra.app/akis/profil/${handle}`, "Profil bağlantısı kopyalandı"); }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white hover:bg-white/12">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* rozetler */}
      {profil?.rozetler && profil.rozetler.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {profil.rozetler.map((r) => (
            <span key={r} className="flex items-center gap-1.5 rounded-full bg-aksan/12 px-3 py-1.5 text-[13px] font-semibold text-aksan ring-1 ring-inset ring-aksan/20">
              <Award className="h-3.5 w-3.5" /> {r}
            </span>
          ))}
        </div>
      )}

      {/* ANALİZ — yalnızca kendi profilinde (yaratıcı paneli) */}
      {benimProfilim && (
        <div className="mt-6">
          <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-metin-3"><BarChart3 className="h-4 w-4" /> Analizler</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { et: "Toplam görüntülenme", v: kisaSayi(gonderiler.reduce((a, g) => a + g.goruntulenmeTohum, 0)), ik: Eye, renk: "text-sky-300" },
              { et: "Toplam beğeni", v: kisaSayi(toplamBegeni), ik: Heart, renk: "text-rose-300" },
              { et: "Gönderi", v: String(gonderiler.length), ik: Grid3x3, renk: "text-aksan" },
              { et: "Etkileşim", v: gonderiler.length ? "%" + Math.min(28, 4 + gonderiler.length * 2) : "—", ik: TrendingUp, renk: "text-violet-300" },
            ].map((k) => (
              <div key={k.et} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <k.ik className={cn("mb-2 h-5 w-5", k.renk)} />
                <div className="text-[22px] font-bold text-white">{k.v}</div>
                <div className="text-[12px] text-metin-3">{k.et}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* sekmeler */}
      <div className="mt-6 flex border-b border-white/8">
        <ProfilSekme aktif={sekme === "gonderiler"} onClick={() => setSekme("gonderiler")} ikon={Grid3x3} ad="Gönderiler" />
        {benimProfilim && <ProfilSekme aktif={sekme === "kayitlar"} onClick={() => setSekme("kayitlar")} ikon={Bookmark} ad="Kayıtlar" />}
        {benimProfilim && <ProfilSekme aktif={sekme === "begenilenler"} onClick={() => setSekme("begenilenler")} ikon={Heart} ad="Beğeniler" />}
      </div>

      {/* grid */}
      {aktifListe.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/8">
            {sekme === "kayitlar" ? <Bookmark className="h-6 w-6 text-metin-3" /> : sekme === "begenilenler" ? <Heart className="h-6 w-6 text-metin-3" /> : <Grid3x3 className="h-6 w-6 text-metin-3" />}
          </span>
          <p className="text-sm text-metin-3">
            {benimProfilim && sekme === "gonderiler" ? "Henüz Akış'ta bir şey paylaşmadın. Kitaplığından paylaş!" : "Burada henüz içerik yok."}
          </p>
          {benimProfilim && sekme === "gonderiler" && (
            <Link href="/panel/kitaplik" className="rounded-full bg-aksan px-5 py-2 text-sm font-semibold text-zemin hover:scale-105">
              Kitaplığa git
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* m4: gönderiye tıklayınca artık AÇILIR — akış feed'inde o gönderiye gider. */}
          {aktifListe.map((g) => <ProfilKart key={g.id} g={g} onAc={() => router.push(`/panel/akis?g=${g.id}`)} />)}
        </div>
      )}
      </div>

      {/* m4: HİKAYE GÖRÜNTÜLEYİCİ — Instagram tam-ekran hikaye (üstte ilerleme çubuğu) */}
      <AnimatePresence>
        {hikayeIzle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black"
            onClick={() => setHikayeIzle(null)}>
            {/* ilerleme çubuğu — 5sn sonra otomatik kapanır */}
            <HikayeIlerleme onBitti={() => setHikayeIzle(null)} />
            <div className="absolute left-4 top-6 z-10 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-emerald-400 text-[15px] font-bold text-zemin">{hikayeIzle.ad.charAt(0)}</span>
              <span className="text-[14px] font-semibold text-white drop-shadow">{hikayeIzle.ad}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setHikayeIzle(null); }}
              className="absolute right-4 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur"><span className="text-xl leading-none">×</span></button>
            <img src={saltUrl(hikayeIzle.gorsel) || hikayeIzle.gorsel} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()} />
            {/* kendi hikayemse sil butonu */}
            {benimProfilim && hikayelerim.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); useAkis.getState().hikayeSil(hikayelerim[0].id); setHikayeIzle(null); toast.success("Hikaye silindi"); }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-5 py-2.5 text-[13px] font-medium text-white backdrop-blur hover:bg-white/20">
                Hikayeyi sil
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** m4: hikaye ilerleme çubuğu — 5 saniyede dolar, dolunca kapatır. */
function HikayeIlerleme({ onBitti }: { onBitti: () => void }) {
  return (
    <div className="absolute inset-x-0 top-3 z-20 flex gap-1 px-3">
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
        <motion.span className="block h-full rounded-full bg-white"
          initial={{ width: "0%" }} animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "linear" }}
          onAnimationComplete={onBitti} />
      </span>
    </div>
  );
}

function Istat({ sayi, etiket }: { sayi: string; etiket: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-white">{sayi}</div>
      <div className="text-[12px] text-metin-3">{etiket}</div>
    </div>
  );
}

function ProfilSekme({ aktif, onClick, ikon: Ikon, ad }: { aktif: boolean; onClick: () => void; ikon: typeof Grid3x3; ad: string }) {
  return (
    <button onClick={onClick}
      className={cn("relative flex flex-1 items-center justify-center gap-2 py-3 text-[13.5px] font-semibold transition-colors sm:flex-none sm:px-8",
        aktif ? "text-white" : "text-metin-3 hover:text-metin-2")}>
      <Ikon className="h-4 w-4" /> {ad}
      {aktif && <motion.span layoutId="profilSekme" className="absolute inset-x-0 bottom-0 h-0.5 bg-aksan" />}
    </button>
  );
}

function ProfilKart({ g, onAc }: { g: FeedGonderi; onAc: () => void }) {
  const poster = saltUrl(g.gorselUrl);
  return (
    <button onClick={onAc} className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-ink-900 text-left" style={{ background: g.gorselUrl }}>
      {poster && <img src={poster} alt={g.baslik} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      {g.tur === "video" && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <Play className="h-3 w-3 fill-white text-white" />
        </span>
      )}
      {!g.izinYenidenOlustur && (
        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <Lock className="h-3 w-3 text-white" />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className="line-clamp-1 text-[12px] font-medium text-white">{g.baslik}</p>
        <span className="flex items-center gap-1 text-[11px] text-white/70">
          <Play className="h-3 w-3" /> {kisaSayi(g.goruntulenmeTohum)}
        </span>
      </div>
    </button>
  );
}
