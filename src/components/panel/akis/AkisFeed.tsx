"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { Flame, UserCheck, Sparkles, ChevronUp, ChevronDown, RefreshCw, X, Search, BadgeCheck } from "lucide-react";
import { AkisKart } from "./AkisKart";
import { YorumSheet } from "./YorumSheet";
import { useAkis, birlesikFeed, type FeedGonderi } from "@/store/useAkis";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useAktifProje } from "@/lib/useAktifProje";
import { cn } from "@/lib/utils";
import { kopyala } from "@/lib/gercekEylem";
import { AKIS_PROFILLER, kisaSayi } from "@/lib/akisVeri";

type Sekme = "sana" | "takip" | "trend";

const SEKMELER: { id: Sekme; ad: string; ikon: typeof Flame }[] = [
  { id: "sana", ad: "Sana Özel", ikon: Sparkles },
  { id: "takip", ad: "Takip", ikon: UserCheck },
  { id: "trend", ad: "Trend", ikon: Flame },
];

/** Akış ana feed — dikey snap-scroll TikTok deneyimi + sekmeler + yorum/recreate. */
export function AkisFeed() {
  const router = useRouter();
  const { aktifProjeId } = useAktifProje();
  const paylasimlar = useAkis((s) => s.paylasimlar);
  const gizlenenler = useAkis((s) => s.gizlenenler);
  const takipler = useAkis((s) => s.takipler);
  const [sekme, setSekme] = useState<Sekme>("sana");
  // m4: profil arama
  const [aramaAcik, setAramaAcik] = useState(false);
  const [aramaMetin, setAramaMetin] = useState("");
  const aramaSonuc = useMemo(() => {
    const q = aramaMetin.trim().toLocaleLowerCase("tr");
    if (!q) return [];
    return AKIS_PROFILLER.filter((p) =>
      p.ad.toLocaleLowerCase("tr").includes(q) || p.kullanici.toLocaleLowerCase("tr").includes(q),
    ).slice(0, 8);
  }, [aramaMetin]);
  const [aktifIdx, setAktifIdx] = useState(0);
  const [yorumGonderi, setYorumGonderi] = useState<FeedGonderi | null>(null);
  const [yenileme, setYenileme] = useState(0);
  const [yenileniyor, setYenileniyor] = useState(false);
  const kapsayiciRef = useRef<HTMLDivElement>(null);

  const tumFeed = useMemo(() => birlesikFeed(paylasimlar, gizlenenler), [paylasimlar, gizlenenler]);

  // m4: ?etiket=<x> ile gelince o etikete ait gönderilere filtrele.
  const sp = useSearchParams();
  const derinG = sp.get("g");
  const etiketFiltre = sp.get("etiket");

  const feed = useMemo(() => {
    let liste: FeedGonderi[];
    if (sekme === "takip") liste = tumFeed.filter((g) => g.benimMi || takipler.includes(g.kullanici));
    else if (sekme === "trend") liste = [...tumFeed].sort((a, b) => b.goruntulenmeTohum - a.goruntulenmeTohum);
    else liste = tumFeed;
    // m4: etiket filtresi — etiketi (# temizlenmiş, küçük harf) içerenler.
    if (etiketFiltre) {
      const et = etiketFiltre.toLocaleLowerCase("tr");
      liste = liste.filter((g) => g.etiketler.some((e) => e.replace(/^#/, "").toLocaleLowerCase("tr") === et));
    }
    // Yenileme: deterministik "döndürme" (offset) — her yenilemede farklı sıra hissi.
    if (yenileme > 0 && liste.length > 1) {
      const k = yenileme % liste.length;
      liste = [...liste.slice(k), ...liste.slice(0, k)];
    }
    return liste;
  }, [tumFeed, sekme, takipler, yenileme, etiketFiltre]);
  useEffect(() => {
    if (!derinG) return;
    const idx = feed.findIndex((x) => x.id === derinG);
    if (idx >= 0) {
      const el = kapsayiciRef.current;
      // Kapsayıcı hazır olunca kaydır (bir sonraki frame).
      requestAnimationFrame(() => {
        if (el) { el.scrollTo({ top: idx * el.clientHeight }); setAktifIdx(idx); }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derinG, feed.length]);

  // Aktif kartı scroll konumundan bul + TikTok "en üstte yukarı çek → yenile".
  const yukariCekmeRef = useRef(0);
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = kapsayiciRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setAktifIdx(idx);
    // En üstteyken (scrollTop≈0) yukarı doğru wheel/scroll denemesi → yenile.
    if (el.scrollTop <= 2) {
      const now = (e.nativeEvent as WheelEvent).deltaY ?? 0;
      if (now < -8) {
        yukariCekmeRef.current += 1;
        if (yukariCekmeRef.current >= 2) { yukariCekmeRef.current = 0; yenile(); }
      }
    } else yukariCekmeRef.current = 0;
  }, []);

  // En üstteyken yukarı wheel → yenile (TikTok masaüstü hissi).
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = kapsayiciRef.current;
    if (el && el.scrollTop <= 2 && e.deltaY < -30) yenile();
  }, []);

  const yenile = useCallback(() => {
    setYenileniyor(true);
    setYenileme((v) => v + 1);
    kapsayiciRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setAktifIdx(0);
    setTimeout(() => setYenileniyor(false), 650);
  }, []);

  // Sekme değişince başa dön.
  useEffect(() => {
    kapsayiciRef.current?.scrollTo({ top: 0 });
    setAktifIdx(0);
  }, [sekme]);

  // Aktif sekmeye tekrar tıkla (çift-tık) → yenile (TikTok birebir).
  const sekmeTikla = (id: Sekme) => {
    if (id === sekme) yenile();
    else setSekme(id);
  };

  const kaydir = (yon: 1 | -1) => {
    const el = kapsayiciRef.current;
    if (!el) return;
    el.scrollTo({ top: (aktifIdx + yon) * el.clientHeight, behavior: "smooth" });
  };

  // Recreate — izinli gönderiyi gerçek üretim olarak yeniden başlat.
  const recreate = (g: FeedGonderi) => {
    const sonuc = uretimBaslat({
      baslik: g.baslik,
      tur: g.tur,
      model: g.model,
      prompt: `${g.baslik} — ${g.aciklama}`,
      kredi: g.kredi,
      arac: "Akış — Yeniden Oluştur",
      projeId: aktifProjeId ?? undefined,
      meta: { oran: g.oran, gorselUrl: g.gorselUrl },
    });
    if (!sonuc.ok) { uretimHataToast(sonuc, "Yeniden oluşturulamadı"); return; }
    toast.success("Yeniden oluşturma başladı", {
      description: `${g.baslik} kitaplığına ekleniyor.`,
      action: { label: "Kitaplığa git", onClick: () => router.push("/panel/kitaplik") },
    });
  };

  return (
    <div className="relative h-[calc(100vh-3rem)] w-full overflow-hidden bg-black sm:h-[calc(100vh-3rem)]">
      {/* m4: sağ üst — profil arama + içerik üretici merkezi */}
      <div className="absolute right-3 top-3 z-40 flex items-center gap-2">
        <button onClick={() => setAramaAcik(true)} aria-label="Profil ara"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60">
          <Search className="h-[18px] w-[18px]" />
        </button>
        <button onClick={() => router.push("/panel/uretici")}
          className="flex h-9 items-center gap-1.5 rounded-full bg-black/40 px-3 text-[13px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/60">
          <Sparkles className="h-3.5 w-3.5 text-aksan" /> Üretici
        </button>
      </div>

      {/* m4: profil arama sheet */}
      <AnimatePresence>
        {aramaAcik && (
          <div className="absolute inset-0 z-50 flex items-start justify-center px-4 pt-16">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setAramaAcik(false); setAramaMetin(""); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#161618] ring-1 ring-white/10">
              <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
                <Search className="h-4 w-4 text-metin-3" />
                <input autoFocus value={aramaMetin} onChange={(e) => setAramaMetin(e.target.value)}
                  placeholder="Yaratıcı ara…" className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-metin-3" />
                <button onClick={() => { setAramaAcik(false); setAramaMetin(""); }} className="text-metin-3 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {aramaSonuc.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-metin-3">{aramaMetin ? "Yaratıcı bulunamadı" : "Aramak için yaz…"}</p>
                ) : aramaSonuc.map((p) => (
                  <button key={p.kullanici} onClick={() => { setAramaAcik(false); setAramaMetin(""); router.push(`/panel/akis/profil/${p.kullanici.replace("@", "")}`); }}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-white/6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-emerald-400 text-[15px] font-bold text-zemin">{p.ad.charAt(0)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5"><span className="truncate text-[14px] font-semibold text-white">{p.ad}</span>{p.dogrulanmis && <BadgeCheck className="h-3.5 w-3.5 fill-sky-400 text-zemin" />}</span>
                      <span className="block truncate text-[12px] text-metin-3">{p.kullanici} · {kisaSayi(p.takipci)} takipçi</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* m4: etiket filtresi başlığı — etikete tıklanınca sekme yerine bu görünür */}
      {etiketFiltre ? (
        <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-3">
          <div className="flex items-center gap-2.5 rounded-full bg-black/50 py-1.5 pl-4 pr-2 backdrop-blur-md ring-1 ring-white/10">
            <span className="text-[14px] font-bold text-aksan">#{etiketFiltre}</span>
            <span className="text-[12px] text-white/60">{feed.length} gönderi</span>
            <button onClick={() => router.push("/panel/akis")}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Sekme şeridi — üstte ortalı */
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-3">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur-md ring-1 ring-white/10">
            {SEKMELER.map((s) => (
              <button key={s.id} onClick={() => sekmeTikla(s.id)} title={sekme === s.id ? "Yenilemek için tekrar dokun" : undefined}
                className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  sekme === s.id ? "bg-white text-black" : "text-white/80 hover:text-white")}>
                <s.ikon className={cn("h-3.5 w-3.5", yenileniyor && sekme === s.id && "animate-spin")} /> {s.ad}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Yenileme göstergesi — TikTok "yenilendi" hissi */}
      <AnimatePresence>
        {yenileniyor && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none absolute inset-x-0 top-14 z-30 flex justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-aksan px-3.5 py-1.5 text-[12px] font-bold text-zemin shadow-lg">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Yenileniyor
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Masaüstü yön okları */}
      <div className="pointer-events-none absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <button onClick={() => kaydir(-1)} disabled={aktifIdx === 0}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-30">
          <ChevronUp className="h-5 w-5" />
        </button>
        <button onClick={() => kaydir(1)} disabled={aktifIdx >= feed.length - 1}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 disabled:opacity-30">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Snap feed */}
      {feed.length === 0 ? (
        <BosDurum sekme={sekme} onKesfet={() => setSekme("sana")} />
      ) : (
        <div
          ref={kapsayiciRef}
          onScroll={onScroll}
          onWheel={onWheel}
          className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {feed.map((g, i) => (
            <div key={g.id} className="flex h-full w-full snap-start snap-always items-center justify-center p-2">
              <AkisKart
                g={g}
                aktif={i === aktifIdx}
                onYorum={() => setYorumGonderi(g)}
                onPaylas={() => { void kopyala(`vayra.app/akis/${g.id}`, "Paylaşım bağlantısı kopyalandı"); }}
                onRecreate={() => recreate(g)}
              />
            </div>
          ))}
        </div>
      )}

      <YorumSheet gonderi={yorumGonderi} onKapat={() => setYorumGonderi(null)} />
    </div>
  );
}

function BosDurum({ sekme, onKesfet }: { sekme: Sekme; onKesfet: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/8">
        <UserCheck className="h-7 w-7 text-metin-2" />
      </span>
      <div>
        <p className="text-lg font-bold text-white">
          {sekme === "takip" ? "Henüz kimseyi takip etmiyorsun" : "Burada henüz içerik yok"}
        </p>
        <p className="mt-1 text-sm text-metin-3">
          {sekme === "takip" ? "Yaratıcıları takip et, akışın onların işleriyle dolsun." : "Yakında yeni içerikler burada."}
        </p>
      </div>
      <button onClick={onKesfet} className="rounded-full bg-aksan px-5 py-2.5 text-sm font-semibold text-zemin transition-transform hover:scale-105">
        Sana Özel'i keşfet
      </button>
    </div>
  );
}
