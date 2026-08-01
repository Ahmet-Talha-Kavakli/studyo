"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, ChevronLeft, ShieldCheck, Upload } from "lucide-react";
import { useFlow } from "@/store/useFlow";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { Avatar, KullaniciAdi, cn } from "@/components/flow/UI";

/** Onaylı içerik üreticiliği (mavi tik) başvuru akışı. */
const KRITERLER = [
  { ad: "Gerçek", aciklama: "Gerçek bir kişi, marka veya kuruluşu temsil ediyor olmalı" },
  { ad: "Benzersiz", aciklama: "Temsil ettiğin varlığın benzersiz hesabı olmalı" },
  { ad: "Eksiksiz", aciklama: "Herkese açık, biyografili ve profil fotoğraflı aktif hesap" },
  { ad: "Dikkat çeken", aciklama: "Tanınan, çok aranan bir kişi/marka olmalı" },
];

export default function DogrulamaSayfa() {
  const s = useFlow();
  const { kullanici } = useAuth();
  const router = useRouter();
  const [kategori, setKategori] = useState("Yaratıcı / Etkileyici");
  const [belge, setBelge] = useState(false);
  const kadi = kullanici?.ad?.toLowerCase().replace(/\s/g, "_") ?? "sen";

  if (s.maviTik === "beklemede") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3897f0]/15"><BadgeCheck className="h-8 w-8 text-[#3897f0]" /></div>
        <h1 className="text-[22px] font-bold">Başvurun inceleniyor</h1>
        <p className="mt-2 text-[14px] text-white/55">Doğrulama başvurun bize ulaştı. Genellikle birkaç gün içinde sonuçlanır. Sonucu bildirimlerden göreceksin.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => router.push("/flow/profil")} className="rounded-lg bg-white/[0.08] px-5 py-2.5 text-[14px] font-semibold">Profile dön</button>
          {/* demo: onaylat */}
          <button onClick={() => { useFlow.setState({ maviTik: "onayli" }); toast.success("Tebrikler! Hesabın doğrulandı 🎉"); }} className="rounded-lg bg-[#3897f0] px-5 py-2.5 text-[14px] font-semibold">(Demo) Onayla</button>
        </div>
      </div>
    );
  }
  if (s.maviTik === "onayli") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <BadgeCheck className="mx-auto h-16 w-16 fill-[#3897f0] text-white" />
        <h1 className="mt-3 text-[22px] font-bold">Hesabın doğrulandı</h1>
        <p className="mt-2 text-[14px] text-white/55">Artık adının yanında mavi tik görünüyor. Tebrikler!</p>
        <div className="mt-4 flex items-center justify-center gap-2"><Avatar tohum={kullanici?.email ?? "ben"} ad={kullanici?.ad} boyut={36} /><KullaniciAdi kadi={kadi} onayli className="text-[16px]" /></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-[14px] text-white/60"><ChevronLeft className="h-4 w-4" />Geri</button>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3897f0]/15"><BadgeCheck className="h-8 w-8 text-[#3897f0]" /></div>
      <h1 className="text-center text-[24px] font-bold">Doğrulama iste</h1>
      <p className="mt-2 text-center text-[14px] text-white/55">Onaylı içerik üreticiliği (mavi tik) başvurusu. Kimliğin ve hesabın kriterlere uygun olmalı.</p>

      <div className="mt-8 space-y-3">
        {KRITERLER.map((k) => (
          <div key={k.ad} className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#3897f0]" />
            <div><div className="text-[14px] font-semibold">{k.ad}</div><div className="text-[13px] text-white/50">{k.aciklama}</div></div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <label className="mb-1.5 block text-[13px] font-semibold text-white/70">Kategori</label>
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#3897f0]/50">
          {["Yaratıcı / Etkileyici", "Sanatçı", "Marka / İşletme", "Medya / Haber", "Spor", "Diğer"].map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>

      <button onClick={() => setBelge(!belge)} className={cn("mt-4 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors", belge ? "border-[#3897f0]/50 bg-[#3897f0]/[0.08]" : "border-white/[0.1] hover:bg-white/[0.1]")}>
        {belge ? <Check className="h-5 w-5 text-[#3897f0]" /> : <Upload className="h-5 w-5 text-white/50" />}
        <div><div className="text-[14px] font-semibold">Kimlik belgesi {belge ? "yüklendi" : "yükle"}</div><div className="text-[12px] text-white/45">Resmi kimlik veya kuruluş belgesi</div></div>
      </button>

      <button onClick={() => { s.maviTikBasvur(); toast.success("Başvurun gönderildi ✓"); }} disabled={!belge}
        className="mt-8 w-full rounded-xl bg-[#3897f0] py-3 text-[15px] font-bold text-white transition-all hover:brightness-110 disabled:opacity-40">
        Başvuruyu gönder
      </button>
    </div>
  );
}
