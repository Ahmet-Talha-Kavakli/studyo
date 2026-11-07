"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, FileText, Loader2, Plus, Share2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Md } from "@/components/build/sohbet/SohbetEkrani";
import { YetenekSimge, CAGRI_AD } from "@/components/build/yetenekler/YetenekListesi";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";

type Paylasilan = { ad: string; baslik: string; aciklama: string; govde: string; simge: string; dosyalar: { yol: string; boyut: number }[]; surum: number; cagri: "model" | "elle" | "her-zaman"; gerekenBaglantilar: string[]; kaynak?: { tur: string; lisans?: string }; guncelleme: number };

/** Paylaşılan yetenek: salt okuma önizleme, SKILL.md ve .zip indirme, kendi yeteneklerine kopyalama. */
export default function PaylasilanYetenek({ params }: { params: Promise<{ anahtar: string }> }) {
  const { anahtar } = use(params);
  const router = useRouter();
  const [y, setY] = useState<Paylasilan | null>(null);
  const [yok, setYok] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  useEffect(() => { fetch(`/api/build/yetenekler/paylasim/${anahtar}`).then(async (r) => { const v = await r.json(); if (!r.ok) setYok(v.hata ?? "Paylaşım bulunamadı."); else setY(v.yetenek); }).catch(() => setYok("Paylaşım açılamadı.")); }, [anahtar]);
  const ekle = async () => {
    setGidiyor(true); setHata("");
    try { const v = await api<{ id: string }>("/api/build/yetenekler", { govde: { paylasim: anahtar } }); router.push(`/panel/build/yetenekler/${v.id}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); setGidiyor(false); }
  };
  if (yok) return (
    <div className="mx-auto max-w-[760px] px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <Kart ikon={Share2} baslik="Paylaşım açılamadı" alt={yok} govde="flex flex-wrap gap-2 p-4 sm:p-5">
        <Link href="/panel/build/yetenekler" className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Yeteneklere git</Link>
      </Kart>
    </div>
  );
  if (!y) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  return (
    <div className="mx-auto max-w-[860px] space-y-4 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <section className="overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
        <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
          <YetenekSimge src={y.simge} boyut={64} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[20px] font-semibold tracking-[-0.02em] text-white">{y.baslik}</h1>
            <p className="truncate text-[13px] text-white/50">Paylaşılan yetenek · {y.ad} · sürüm {y.surum} · {gorece(y.guncelleme)} güncellendi</p>
          </div>
          <button type="button" onClick={ekle} disabled={gidiyor} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black disabled:opacity-60">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Yeteneklerime ekle</button>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-4 py-3 sm:px-5">
          <span className="inline-flex h-7 items-center rounded-full bg-white/[0.07] px-2.5 text-[11.5px] text-white/60">{CAGRI_AD[y.cagri]}</span>
          {y.kaynak?.lisans && <span className="inline-flex h-7 items-center rounded-full bg-white/[0.07] px-2.5 text-[11.5px] text-white/60">Lisans: {y.kaynak.lisans}</span>}
          {y.gerekenBaglantilar.map((b) => <span key={b} className="inline-flex h-7 items-center rounded-full bg-white/[0.07] px-2.5 text-[11.5px] text-white/60">{katalogBul(b)?.ad ?? b.replace(/^url:/, "")} bağlantısı gerekir</span>)}
          <span className="flex-1" />
          <a href={`/api/build/yetenekler/paylasim/${anahtar}?bicim=md`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><FileText className="h-3.5 w-3.5" />SKILL.md</a>
          <a href={`/api/build/yetenekler/paylasim/${anahtar}?bicim=zip`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Download className="h-3.5 w-3.5" />.zip</a>
        </div>
      </section>
      {hata && <p className="text-[13px] text-rose-300">{hata}</p>}
      <Kart ikon={FileText} baslik="Ne zaman kullanılır" govde="px-4 py-3 sm:px-5"><p className="text-[14px] leading-relaxed text-white/75">{y.aciklama}</p></Kart>
      <Kart ikon={FileText} baslik="Talimat" alt="SKILL.md gövdesi" govde="px-4 py-3 sm:px-5"><Md metin={y.govde} onizle={() => {}} /></Kart>
      {y.dosyalar.length > 0 && (
        <Kart ikon={FileText} baslik={`Ek dosyalar (${y.dosyalar.length})`}>
          <div className="divide-y divide-white/[0.04]">{y.dosyalar.map((d) => <p key={d.yol} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-white/70 sm:px-5"><span className="min-w-0 flex-1 truncate">{d.yol}</span><span className="text-white/35">{d.boyut < 1000 ? `${d.boyut} karakter` : `${Math.round(d.boyut / 1000)} bin karakter`}</span></p>)}</div>
        </Kart>
      )}
    </div>
  );
}
