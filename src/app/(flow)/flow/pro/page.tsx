"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, BarChart3, Megaphone, Users, Check, ChevronLeft } from "lucide-react";
import { useFlow, type ProKategori } from "@/store/useFlow";
import { toast } from "@/lib/toast";
import { IG_GRADIENT, cn } from "@/components/flow/UI";

const KATEGORILER: ProKategori[] = ["Dijital Yaratıcı", "Sanatçı", "Video İçerik Üreticisi", "Fotoğrafçı", "Tasarımcı"];
const AVANTAJLAR = [
  { ikon: BarChart3, ad: "Detaylı istatistikler", aciklama: "Erişim, gösterim, etkileşim ve takipçi analizleri" },
  { ikon: Megaphone, ad: "Tanıtım araçları", aciklama: "Gönderilerini öne çıkar, daha fazla kişiye ulaş" },
  { ikon: Users, ad: "Kitle bilgisi", aciklama: "Takipçilerinin demografisi ve aktif olduğu saatler" },
  { ikon: Briefcase, ad: "İletişim seçenekleri", aciklama: "Profiline iletişim butonu ekle" },
];

export default function ProSayfa() {
  const s = useFlow();
  const router = useRouter();
  const [kategori, setKategori] = useState<ProKategori>("Dijital Yaratıcı");

  if (s.proHesap) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: IG_GRADIENT }}><Briefcase className="h-8 w-8 text-white" /></div>
        <h1 className="text-[22px] font-bold">Profesyonel hesabın aktif</h1>
        <p className="mt-2 text-[14px] text-white/55">Kategori: <b className="text-white">{s.proKategori}</b></p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => router.push("/flow/profil?sekme=istatistik")} className="rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white" style={{ background: IG_GRADIENT }}>İstatistikleri gör</button>
          <button onClick={() => { s.proKapat(); toast.success("Kişisel hesaba dönüldü"); }} className="rounded-lg bg-white/[0.08] px-5 py-2.5 text-[14px] font-semibold">Kişisele dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-[14px] text-white/60"><ChevronLeft className="h-4 w-4" />Geri</button>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: IG_GRADIENT }}><Briefcase className="h-8 w-8 text-white" /></div>
      <h1 className="text-center text-[24px] font-bold">Profesyonel hesaba geç</h1>
      <p className="mt-2 text-center text-[14px] text-white/55">Yaratıcılar ve markalar için gelişmiş araçlar. Ücretsiz.</p>

      <div className="mt-8 space-y-3">
        {AVANTAJLAR.map((a) => (
          <div key={a.ad} className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <a.ikon className="mt-0.5 h-5 w-5 shrink-0 text-[#E1306C]" />
            <div><div className="text-[14px] font-semibold">{a.ad}</div><div className="text-[13px] text-white/50">{a.aciklama}</div></div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-2 text-[14px] font-semibold">Kategorini seç</div>
        <div className="flex flex-wrap gap-2">
          {KATEGORILER.map((k) => (
            <button key={k} onClick={() => setKategori(k)}
              className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all", kategori === k ? "border-[#E1306C] bg-[#E1306C]/15 text-white" : "border-white/[0.1] text-white/60 hover:text-white")}>
              {kategori === k && <Check className="mr-1 inline h-3.5 w-3.5" />}{k}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { s.proAktifEt(kategori); toast.success("Profesyonel hesap aktif 🎉"); router.push("/flow/profil"); }}
        className="mt-8 w-full rounded-xl py-3 text-[15px] font-bold text-white transition-all hover:brightness-110" style={{ background: IG_GRADIENT }}>
        Profesyonel hesaba geç
      </button>
    </div>
  );
}
