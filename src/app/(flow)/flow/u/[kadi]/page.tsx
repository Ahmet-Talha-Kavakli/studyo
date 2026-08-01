"use client";

import { useMemo, useState, use } from "react";
import { notFound } from "next/navigation";
import { Grid3x3, Clapperboard, UserSquare, MoreHorizontal, Lock } from "lucide-react";
import { flowVeri } from "@/lib/flow/seed";
import { sayiKisa } from "@/lib/flow/cekirdek";
import { useFlow } from "@/store/useFlow";
import { toast } from "@/lib/toast";
import { Avatar, KullaniciAdi, cn } from "@/components/flow/UI";
import { ProfilGrid } from "@/components/flow/ProfilGrid";
import { TakipButon } from "@/components/flow/TakipButon";
import { TakipModal } from "@/components/flow/TakipModal";

export default function KullaniciProfil({ params }: { params: Promise<{ kadi: string }> }) {
  const { kadi } = use(params);
  const s = useFlow();
  const [sekme, setSekme] = useState<"gonderi" | "reels" | "etiketli">("gonderi");
  const [menu, setMenu] = useState(false);
  const [sikayetModu, setSikayetModu] = useState(false);
  const [hakkindaAcik, setHakkindaAcik] = useState(false);
  const [takipModal, setTakipModal] = useState<"takipci" | "takip" | null>(null);

  const e = flowVeri();
  const u = e.kullanicilar.find((x) => x.kadi === decodeURIComponent(kadi));
  if (!u) return notFound();

  const engelli = s.engellenenler[u.id];
  const gonderiler = useMemo(() => e.gonderiler.filter((g) => g.sahipId === u.id), [e, u.id]);
  const reels = useMemo(() => gonderiler.filter((g) => g.tur === "reels"), [gonderiler]);

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-16">
        <Avatar tohum={u.avatarTohum} ad={u.ad} boyut={150} story={u.hikayeVar} izlendi={!!s.izlenenStoryler[u.id]} />
        <div className="flex-1">
          <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4">
            <KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="text-[20px]" />
            <div className="flex gap-2">
              {/* DM YOK kuralı: "Mesaj" butonu yok. Takip + Süper Beğeni köprüsü. */}
              {!engelli ? <TakipButon kullaniciId={u.id} kadi={u.kadi} boyut="buton" />
                : <button onClick={() => { s.engelle(u.id); toast.success("Engel kaldırıldı"); }} className="rounded-lg bg-white/[0.08] px-4 py-1.5 text-[14px] font-semibold">Engeli kaldır</button>}
              <button onClick={() => setMenu(true)} className="flex items-center rounded-lg bg-white/[0.08] px-2.5 hover:bg-white/[0.12]"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-5 flex justify-center gap-10 md:justify-start">
            <span><b>{u.gonderiSayisi}</b> <span className="text-white/60">gönderi</span></span>
            <button onClick={() => setTakipModal("takipci")} className="hover:opacity-70"><b>{sayiKisa(u.takipci)}</b> <span className="text-white/60">takipçi</span></button>
            <button onClick={() => setTakipModal("takip")} className="hover:opacity-70"><b>{sayiKisa(u.takip)}</b> <span className="text-white/60">takip</span></button>
          </div>
          <div className="mt-4 text-center md:text-left">
            <div className="text-[14px] font-semibold">{u.ad}</div>
            {u.profesyonel && u.kategori && <div className="text-[13px] text-white/50">{u.kategori}</div>}
            <div className="mt-0.5 text-[14px] text-white/85">{u.bio}</div>
          </div>
        </div>
      </div>

      {engelli ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center"><Lock className="h-8 w-8 text-white/30" /><p className="text-[15px] font-semibold">Bu kullanıcıyı engelledin</p><p className="text-[13px] text-white/45">Gönderilerini görmüyorsun.</p></div>
      ) : (
        <>
          <div className="mt-10 flex justify-center border-t border-white/[0.08]">
            {[{ k: "gonderi", ad: "GÖNDERİLER", ikon: Grid3x3 }, { k: "reels", ad: "REELS", ikon: Clapperboard }, { k: "etiketli", ad: "ETİKETLİ", ikon: UserSquare }].map((t) => (
              <button key={t.k} onClick={() => setSekme(t.k as typeof sekme)}
                className={cn("-mt-px flex items-center gap-1.5 border-t-2 px-6 py-3.5 text-[12px] font-semibold tracking-wide transition-colors", sekme === t.k ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70")}>
                <t.ikon className="h-3.5 w-3.5" />{t.ad}
              </button>
            ))}
          </div>
          <div className="pt-1">
            {sekme === "gonderi" && <ProfilGrid gonderiler={gonderiler} />}
            {sekme === "reels" && <ProfilGrid gonderiler={reels} bosMesaj="Reels yok" />}
            {sekme === "etiketli" && <div className="py-16 text-center text-[14px] text-white/40">Etiketli gönderi yok</div>}
          </div>
        </>
      )}

      {/* ⋯ menü */}
      {menu && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => { setMenu(false); setSikayetModu(false); }}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#262626] text-center" onClick={(e) => e.stopPropagation()}>
            {!sikayetModu ? (
              <>
                <button onClick={() => { s.engelle(u.id); toast.success("Engellendi"); setMenu(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] font-bold text-[#ed4956] hover:bg-white/[0.1]">Engelle</button>
                <button onClick={() => { s.kisitla(u.id); toast.success(s.kisitlananlar[u.id] ? "Kısıtlama kaldırıldı" : "Kısıtlandı"); setMenu(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] font-bold text-[#ed4956] hover:bg-white/[0.1]">{s.kisitlananlar[u.id] ? "Kısıtlamayı kaldır" : "Kısıtla"}</button>
                <button onClick={() => setSikayetModu(true)} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] font-bold text-[#ed4956] hover:bg-white/[0.1]">Şikayet Et</button>
                <button onClick={() => { s.sessizeAl(u.id); toast.success("Sessize alındı"); setMenu(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] hover:bg-white/[0.1]">Sessize al</button>
                <button onClick={() => { const url = `${typeof window !== "undefined" ? window.location.origin : ""}/flow/u/${u.kadi}`; navigator.clipboard?.writeText(url).then(() => toast.success("Bağlantı kopyalandı")).catch(() => toast.success("Bağlantı kopyalandı")); setMenu(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] hover:bg-white/[0.1]">Bağlantıyı kopyala</button>
                <button onClick={() => { setHakkindaAcik(true); setMenu(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] hover:bg-white/[0.1]">Bu hesap hakkında</button>
                <button onClick={() => setMenu(false)} className="block w-full py-3.5 text-[14px] hover:bg-white/[0.1]">İptal</button>
              </>
            ) : (
              <>
                <div className="border-b border-white/[0.08] py-3.5 text-[15px] font-bold">Neden şikayet ediyorsun?</div>
                {["Uygunsuz içerik", "Spam", "Sahte hesap", "Nefret söylemi", "Dolandırıcılık"].map((sb) => (
                  <button key={sb} onClick={() => { toast.success("Şikayetin alındı, inceleyeceğiz 🙏"); setMenu(false); setSikayetModu(false); }} className="block w-full border-b border-white/[0.08] py-3.5 text-[14px] hover:bg-white/[0.1]">{sb}</button>
                ))}
                <button onClick={() => setSikayetModu(false)} className="block w-full py-3.5 text-[14px] hover:bg-white/[0.1]">Geri</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bu hesap hakkında modalı */}
      {hakkindaAcik && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setHakkindaAcik(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#262626]" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
              <Avatar tohum={u.avatarTohum} ad={u.ad} boyut={70} />
              <KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="text-[16px]" />
              <p className="text-[13px] text-white/60">Bu hesabın şeffaflığını sağlamak için bilgileri gösteriyoruz.</p>
            </div>
            <div className="space-y-0 border-t border-white/[0.08] px-6 py-4 text-[14px]">
              <div className="flex justify-between py-1.5"><span className="text-white/50">Katılım tarihi</span><span>Mart 2024</span></div>
              <div className="flex justify-between py-1.5"><span className="text-white/50">Konum</span><span>Türkiye</span></div>
              <div className="flex justify-between py-1.5"><span className="text-white/50">Takipçi</span><span>{sayiKisa(u.takipci)}</span></div>
            </div>
            <button onClick={() => setHakkindaAcik(false)} className="block w-full border-t border-white/[0.08] py-3.5 text-[14px] font-semibold text-[#0095f6] hover:bg-white/[0.04]">Kapat</button>
          </div>
        </div>
      )}

      {takipModal && <TakipModal tur={takipModal} sahipKadi={u.kadi} kapat={() => setTakipModal(null)} />}
    </div>
  );
}
