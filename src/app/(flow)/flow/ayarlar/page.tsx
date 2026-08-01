"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, UserX, VolumeX, Bell, BadgeCheck, Briefcase, ChevronRight, Shield, Type, Eye, AtSign, Star } from "lucide-react";
import { flowVeri } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { toast } from "@/lib/toast";
import { Avatar, KullaniciAdi, cn } from "@/components/flow/UI";

export default function AyarlarSayfa() {
  const s = useFlow();
  const e = flowVeri();
  const [gizli, setGizli] = useState(false);
  const [begeniGizle, setBegeniGizle] = useState(false);
  const [bildirim, setBildirim] = useState(true);
  const [yorumGizle, setYorumGizle] = useState(true);
  const [gelismisFiltre, setGelismisFiltre] = useState(false);
  const [hassas, setHassas] = useState<"az" | "standart" | "fazla">("standart");
  const [etiketKim, setEtiketKim] = useState<"herkes" | "takip" | "kimse">("herkes");

  const engellenenler = useMemo(() => e.kullanicilar.filter((k) => s.engellenenler[k.id]), [e, s.engellenenler]);
  const sessizler = useMemo(() => e.kullanicilar.filter((k) => s.sessizler[k.id]), [e, s.sessizler]);

  const Anahtar = ({ deger, degis }: { deger: boolean; degis: () => void }) => (
    <button onClick={degis} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", deger ? "bg-[#0095f6]" : "bg-white/15")}>
      <span className={cn("absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-transform", deger ? "translate-x-[22px]" : "translate-x-0")} />
    </button>
  );

  return (
    <div className="mx-auto max-w-[600px] px-4 py-6">
      <h1 className="mb-5 text-[20px] font-bold">Ayarlar</h1>

      {/* hesap türü */}
      <div className="mb-6 space-y-2">
        <div className="text-[13px] font-semibold uppercase tracking-wide text-white/40">Hesap</div>
        <Link href="/flow/pro" className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3.5 hover:bg-white/[0.1]"><Briefcase className="h-5 w-5 text-[#E1306C]" /><div className="flex-1"><div className="text-[14px] font-medium">{s.proHesap ? "Profesyonel hesap" : "Profesyonel hesaba geç"}</div>{s.proHesap && <div className="text-[12px] text-white/45">{s.proKategori}</div>}</div><ChevronRight className="h-4 w-4 text-white/30" /></Link>
        <Link href="/flow/dogrulama" className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3.5 hover:bg-white/[0.1]"><BadgeCheck className="h-5 w-5 text-[#3897f0]" /><div className="flex-1"><div className="text-[14px] font-medium">Doğrulama (Mavi tik)</div><div className="text-[12px] text-white/45">{s.maviTik === "onayli" ? "Hesabın doğrulandı ✓" : s.maviTik === "beklemede" ? "Başvurun inceleniyor" : "Onaylı içerik üreticiliği başvur"}</div></div><ChevronRight className="h-4 w-4 text-white/30" /></Link>
      </div>

      {/* gizlilik */}
      <div className="mb-6 space-y-1">
        <div className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-white/40">Gizlilik</div>
        <div className="flex items-center gap-3 px-4 py-3"><Lock className="h-5 w-5 text-white/60" /><div className="flex-1 text-[14px]">Gizli hesap</div><Anahtar deger={gizli} degis={() => { setGizli(!gizli); toast.success(gizli ? "Hesap herkese açık" : "Hesap gizli"); }} /></div>
        <div className="flex items-center gap-3 px-4 py-3"><Shield className="h-5 w-5 text-white/60" /><div className="flex-1 text-[14px]">Beğeni sayılarını gizle</div><Anahtar deger={begeniGizle} degis={() => setBegeniGizle(!begeniGizle)} /></div>
        <div className="flex items-center gap-3 px-4 py-3"><Bell className="h-5 w-5 text-white/60" /><div className="flex-1 text-[14px]">Bildirimler</div><Anahtar deger={bildirim} degis={() => setBildirim(!bildirim)} /></div>
      </div>

      {/* gizlenen sözcükler */}
      <div className="mb-6 space-y-1">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/40"><Type className="h-4 w-4" />Gizlenen Sözcükler</div>
        <div className="flex items-start gap-3 px-4 py-3"><Shield className="mt-0.5 h-5 w-5 shrink-0 text-white/60" /><div className="flex-1"><div className="text-[14px]">Yorumları gizle</div><div className="text-[12px] text-white/45">Rahatsız edici, spam veya yanıltıcı yorumlar ayrı bir bölüme taşınır.</div></div><Anahtar deger={yorumGizle} degis={() => setYorumGizle(!yorumGizle)} /></div>
        <div className="flex items-start gap-3 px-4 py-3"><Eye className="mt-0.5 h-5 w-5 shrink-0 text-white/60" /><div className="flex-1"><div className="text-[14px]">Gelişmiş yorum filtreleme</div><div className="text-[12px] text-white/45">Kriterlere uyan daha fazla yorum otomatik gizlenir.</div></div><Anahtar deger={gelismisFiltre} degis={() => setGelismisFiltre(!gelismisFiltre)} /></div>
      </div>

      {/* etiketler ve bahsetmeler */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/40"><AtSign className="h-4 w-4" />Etiketler ve bahsetmeler</div>
        <div className="px-4 text-[13px] text-white/50">Seni kimler etiketleyebilir?</div>
        <div className="mt-1.5 space-y-1 px-2">
          {([["herkes", "Herkesin etiketlemesine izin ver"], ["takip", "Takip ettiklerinin etiketlemesine izin ver"], ["kimse", "Etiketlere izin verme"]] as const).map(([k, ad]) => (
            <button key={k} onClick={() => setEtiketKim(k)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-white/[0.04]">
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", etiketKim === k ? "border-[#0095f6]" : "border-white/30")}>{etiketKim === k && <span className="h-2.5 w-2.5 rounded-full bg-[#0095f6]" />}</span>
              <span className="text-[14px]">{ad}</span>
            </button>
          ))}
        </div>
      </div>

      {/* hassas içerik kontrolü */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/40"><Star className="h-4 w-4" />Hassas içerik kontrolü</div>
        <div className="px-4 text-[13px] text-white/50">Ne kadar hassas içerik göreceğini seç:</div>
        <div className="mt-1.5 space-y-1 px-2">
          {([["az", "Daha az", "Daha az hassas içerik görebilirsin."], ["standart", "Standart", "Biraz hassas içerik görebilirsin."], ["fazla", "Daha fazla", "Daha fazla hassas içerik görebilirsin."]] as const).map(([k, ad, alt]) => (
            <button key={k} onClick={() => setHassas(k)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-white/[0.04]">
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", hassas === k ? "border-[#0095f6]" : "border-white/30")}>{hassas === k && <span className="h-2.5 w-2.5 rounded-full bg-[#0095f6]" />}</span>
              <div><div className="text-[14px]">{ad}</div><div className="text-[12px] text-white/45">{alt}</div></div>
            </button>
          ))}
        </div>
      </div>

      {/* engellenenler */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/40"><UserX className="h-4 w-4" />Engellenen hesaplar ({engellenenler.length})</div>
        {engellenenler.length === 0 ? <div className="px-4 py-3 text-[13px] text-white/40">Engellenen hesap yok</div> :
          engellenenler.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5"><Avatar tohum={u.avatarTohum} ad={u.ad} boyut={40} /><KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="flex-1 text-[14px]" /><button onClick={() => { s.engelle(u.id); toast.success("Engel kaldırıldı"); }} className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold">Engeli kaldır</button></div>
          ))}
      </div>

      {/* sessize alınanlar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-white/40"><VolumeX className="h-4 w-4" />Sessize alınanlar ({sessizler.length})</div>
        {sessizler.length === 0 ? <div className="px-4 py-3 text-[13px] text-white/40">Sessize alınan hesap yok</div> :
          sessizler.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5"><Avatar tohum={u.avatarTohum} ad={u.ad} boyut={40} /><KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="flex-1 text-[14px]" /><button onClick={() => { s.sessizeAl(u.id); toast.success("Sesi açıldı"); }} className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold">Sesi aç</button></div>
          ))}
      </div>

      <Link href="/panel" className="block rounded-xl bg-white/[0.03] px-4 py-3.5 text-center text-[14px] font-medium hover:bg-white/[0.1]">Vayra paneline dön</Link>
    </div>
  );
}
