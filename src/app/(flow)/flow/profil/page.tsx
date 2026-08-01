"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Grid3x3, Clapperboard, Bookmark, UserSquare, BadgeCheck, BarChart3, Plus } from "lucide-react";
import { X } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { AyarMenu } from "@/components/flow/AyarMenu";
import { TakipModal } from "@/components/flow/TakipModal";
import { Iskelet } from "@/components/ui/Iskelet";
import { flowVeri, type FlowGonderi } from "@/lib/flow/seed";

/** Profil yükleme iskeleti — avatar + istatistik + 3'lü gönderi ızgarası izdüşümü. */
function ProfilIskelet() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center gap-6">
        <Iskelet className="h-20 w-20 shrink-0 rounded-full md:h-28 md:w-28" />
        <div className="flex-1 space-y-3">
          <Iskelet className="h-5 w-40" />
          <div className="flex gap-6">
            <Iskelet className="h-4 w-16" />
            <Iskelet className="h-4 w-16" />
            <Iskelet className="h-4 w-16" />
          </div>
          <Iskelet className="h-3 w-3/4" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => <Iskelet key={i} className="aspect-square rounded-none" />)}
      </div>
    </div>
  );
}
import { sayiKisa } from "@/lib/flow/cekirdek";
import { useFlow } from "@/store/useFlow";
import { useAuth } from "@/store/useAuth";
import { Avatar, KullaniciAdi, cn } from "@/components/flow/UI";
import { ProfilGrid } from "@/components/flow/ProfilGrid";

function ProfilIc() {
  const s = useFlow();
  const { kullanici } = useAuth();
  const params = useSearchParams();
  const [sekme, setSekme] = useState<"gonderi" | "reels" | "kayitli" | "etiketli" | "istatistik">("gonderi");
  const [takipModal, setTakipModal] = useState<"takipci" | "takip" | null>(null);
  const [oneCikModal, setOneCikModal] = useState(false);
  const [oneCikAd, setOneCikAd] = useState("");
  const [arsivAcik, setArsivAcik] = useState(false);

  useEffect(() => { const q = params.get("sekme"); if (q === "kayitli" || q === "istatistik") setSekme(q); }, [params]);

  const e = flowVeri();
  const kadi = kullanici?.ad?.toLowerCase().replace(/\s/g, "_") ?? "sen";
  // kaydedilen gönderiler
  const kayitliGonderiler = useMemo(() => e.gonderiler.filter((g) => s.kaydedilenler[g.id]), [e, s.kaydedilenler]);
  // "kendi gönderilerim" = gerçekten paylaştıklarım (store) + demo seed
  const paylasilanlar = useMemo<FlowGonderi[]>(() => s.benimGonderilerim.map((p) => ({
    id: p.id, sahipId: "ben", tur: "gonderi", medya: [{ tohum: p.tohum, kat: p.kat }], aciklama: p.aciklama, hashtagler: [],
    konum: p.konum, zaman: p.zaman, begeni: 0, yorumSayisi: 0, paylasim: 0, ses: undefined, yorumlar: [],
  } as unknown as FlowGonderi)), [s.benimGonderilerim]);
  const benimGonderiler = useMemo(() => [...paylasilanlar, ...e.gonderiler.slice(0, 9)], [paylasilanlar, e]);
  const benimReels = useMemo(() => benimGonderiler.filter((g) => g.tur === "reels"), [benimGonderiler]);

  const takipSayi = Object.values(s.takipler).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      {/* profil başlık */}
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-16">
        <Avatar tohum={kullanici?.email ?? "ben"} ad={kullanici?.ad} boyut={150} />
        <div className="flex-1">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-5">
            <KullaniciAdi kadi={kadi} onayli={s.maviTik === "onayli"} className="text-[20px]" />
            <div className="flex items-center gap-2">
              <Link href="/flow/ayarlar" className="rounded-lg bg-white/[0.08] px-4 py-1.5 text-[14px] font-semibold hover:bg-white/[0.12]">Profili düzenle</Link>
              <button onClick={() => setArsivAcik(true)} className="rounded-lg bg-white/[0.08] px-4 py-1.5 text-[14px] font-semibold hover:bg-white/[0.12]">Arşivi gör</button>
              {!s.proHesap ? (
                <Link href="/flow/pro" className="rounded-lg bg-white/[0.08] px-4 py-1.5 text-[14px] font-semibold hover:bg-white/[0.12]">Profesyonele geç</Link>
              ) : (
                <Link href="/flow/profil?sekme=istatistik" className="rounded-lg bg-white/[0.08] px-4 py-1.5 text-[14px] font-semibold hover:bg-white/[0.12]">İstatistikler</Link>
              )}
              <AyarMenu />
            </div>
          </div>
          {/* sayaçlar — takipçi/takip tıklanınca modal */}
          <div className="mt-5 flex justify-center gap-10 md:justify-start">
            <span><b>{benimGonderiler.length}</b> <span className="text-white/60">gönderi</span></span>
            <button onClick={() => setTakipModal("takipci")} className="hover:opacity-70"><b>{sayiKisa(1240)}</b> <span className="text-white/60">takipçi</span></button>
            <button onClick={() => setTakipModal("takip")} className="hover:opacity-70"><b>{takipSayi}</b> <span className="text-white/60">takip</span></button>
          </div>
          {/* ad + bio */}
          <div className="mt-4 text-center md:text-left">
            <div className="text-[14px] font-semibold">{kullanici?.ad ?? "Vayra Kullanıcısı"}</div>
            {s.proHesap && s.proKategori && <div className="text-[13px] text-white/50">{s.proKategori}</div>}
            <div className="mt-0.5 text-[14px] text-white/85">{kullanici?.bio ?? "Vayra ile üretiyorum ✨ AI görsel & video"}</div>
            {s.maviTik === "beklemede" && <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[12px] text-amber-300"><BadgeCheck className="h-3.5 w-3.5" />Doğrulama başvurun inceleniyor</div>}
          </div>
        </div>
      </div>

      {/* öne çıkanlar (highlights) — Instagram "Yeni +" + oluşturulanlar */}
      <div className="mt-8 flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button className="flex shrink-0 flex-col items-center gap-1.5" onClick={() => setOneCikModal(true)}>
          <span className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-white/[0.15] text-white/60 transition-colors hover:bg-white/[0.04]"><Plus className="h-7 w-7" /></span>
          <span className="text-[12px] text-white/80">Yeni</span>
        </button>
        {s.oneCikanlar.map((oc, i) => (
          <button key={oc + i} onClick={() => toast.success(`"${oc}" öne çıkarması`)} className="flex shrink-0 flex-col items-center gap-1.5">
            <span className="flex h-[86px] w-[86px] items-center justify-center rounded-full p-[3px]" style={{ background: onizlemeArka(oc + i, "sinematik") }}><span className="flex h-full w-full items-center justify-center rounded-full bg-[#12171c] text-[22px]">✨</span></span>
            <span className="max-w-[86px] truncate text-[12px] text-white/80">{oc}</span>
          </button>
        ))}
      </div>

      {/* sekmeler */}
      <div className="mt-10 flex justify-center border-t border-white/[0.08]">
        {[
          { k: "gonderi", ad: "GÖNDERİLER", ikon: Grid3x3 },
          { k: "reels", ad: "REELS", ikon: Clapperboard },
          { k: "kayitli", ad: "KAYDEDİLEN", ikon: Bookmark },
          { k: "etiketli", ad: "ETİKETLİ", ikon: UserSquare },
          ...(s.proHesap ? [{ k: "istatistik", ad: "İSTATİSTİK", ikon: BarChart3 }] : []),
        ].map((t) => (
          <button key={t.k} onClick={() => setSekme(t.k as typeof sekme)}
            className={cn("flex items-center gap-1.5 border-t-2 px-6 py-3.5 text-[12px] font-semibold tracking-wide transition-colors -mt-px",
              sekme === t.k ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70")}>
            <t.ikon className="h-3.5 w-3.5" />{t.ad}
          </button>
        ))}
      </div>

      <div className="pt-1">
        {sekme === "gonderi" && <ProfilGrid gonderiler={benimGonderiler} />}
        {sekme === "reels" && <ProfilGrid gonderiler={benimReels} bosMesaj="Henüz reels yok" />}
        {sekme === "kayitli" && <ProfilGrid gonderiler={kayitliGonderiler} bosMesaj="Kaydettiğin gönderiler burada görünür 🔖" />}
        {sekme === "etiketli" && <div className="py-16 text-center text-[14px] text-white/40">Seni etiketleyen gönderi yok</div>}
        {sekme === "istatistik" && <ProfilIstatistik />}
      </div>

      {takipModal && <TakipModal tur={takipModal} sahipKadi={kadi} kapat={() => setTakipModal(null)} />}

      {/* Arşiv modalı */}
      {arsivAcik && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setArsivAcik(false)}>
          <div className="flex max-h-[70vh] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-[#262626]" onClick={(ev) => ev.stopPropagation()}>
            <div className="relative flex items-center justify-center border-b border-white/[0.1] py-3">
              <span className="text-[16px] font-bold">Arşiv</span>
              <button onClick={() => setArsivAcik(false)} className="absolute right-3 text-white/80 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/60 text-[26px]">🗂️</div>
              <div className="text-[16px] font-semibold">Arşivin boş</div>
              <p className="max-w-xs px-6 text-[13px] text-white/50">Arşivlediğin gönderiler ve hikayeler yalnızca sana görünür ve burada birikir.</p>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Öne Çıkarma modalı (Instagram birebir) */}
      {oneCikModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setOneCikModal(false)}>
          <div className="w-full max-w-[400px] overflow-hidden rounded-xl bg-[#262626]" onClick={(ev) => ev.stopPropagation()}>
            <div className="relative flex items-center justify-center border-b border-white/[0.1] py-3">
              <button onClick={() => setOneCikModal(false)} className="absolute left-3 text-white/80 hover:text-white"><X className="h-6 w-6" /></button>
              <span className="text-[16px] font-bold">Yeni Öne Çıkarma</span>
            </div>
            <div className="p-5">
              <input value={oneCikAd} onChange={(ev) => setOneCikAd(ev.target.value)} placeholder="Öne Çıkan Ad" className="w-full rounded-lg bg-white/[0.06] px-4 py-3 text-[14px] outline-none placeholder:text-white/40" />
            </div>
            <button onClick={() => { if (oneCikAd.trim()) { s.oneCikanEkle(oneCikAd.trim()); toast.success(`"${oneCikAd}" öne çıkarması oluşturuldu`); setOneCikModal(false); setOneCikAd(""); } else { toast.success("Bir ad gir"); } }} className="w-full border-t border-white/[0.1] py-3.5 text-[15px] font-semibold text-[#0095f6] hover:bg-white/[0.04]">İleri</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilIstatistik() {
  const veri = [
    { e: "Erişim (30g)", d: "48,2 B", alt: "+12,4%" },
    { e: "Gösterim", d: "126 B", alt: "+8,1%" },
    { e: "Profil ziyareti", d: "3.410", alt: "+21%" },
    { e: "Yeni takipçi", d: "+842", alt: "bu ay" },
    { e: "Etkileşim", d: "9,2 B", alt: "beğeni+yorum" },
    { e: "Paylaşım", d: "1.204", alt: "" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 py-4 md:grid-cols-3">
      {veri.map((v) => (
        <div key={v.e} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="text-[12px] text-white/45">{v.e}</div>
          <div className="mt-1 text-[22px] font-bold">{v.d}</div>
          {v.alt && <div className="text-[12px] text-emerald-400">{v.alt}</div>}
        </div>
      ))}
    </div>
  );
}

export default function ProfilPage() {
  return <Suspense fallback={<ProfilIskelet />}><ProfilIc /></Suspense>;
}
