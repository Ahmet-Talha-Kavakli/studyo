"use client";

import { useRef, useState } from "react";
import { Check, FileText, Loader2, Upload, X } from "lucide-react";
import { etiketSinif } from "./ortak";

/** Başvuru girdisi — iletişim kutusuyla aynı dil: dolgu + ince halka, camgöbeği odak. */
const girdiSinif = "h-11 w-full rounded-[14px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-white/[0.09] transition placeholder:text-metin-2 focus:ring-[#55d6fd]/60";
import { cn } from "@/lib/utils";

/** İş başvurusu — CV (PDF/Word, ≤8 MB) ile /api/basvuru'ya multipart gönderilir. */
export function BasvuruFormu({ pozisyon, pozisyonAd }: { pozisyon: string; pozisyonAd: string }) {
  const [ad, setAd] = useState("");
  const [email, setEmail] = useState("");
  const [konum, setKonum] = useState("");
  const [baglanti, setBaglanti] = useState("");
  const [not, setNot] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [onay, setOnay] = useState(false);
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "tamam">("bos");
  const [hata, setHata] = useState<string | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const cvSec = (f?: File) => {
    setHata(null);
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return setHata("CV en fazla 8 MB olabilir.");
    if (!/\.(pdf|docx?)$/i.test(f.name)) return setHata("CV PDF ya da Word dosyası olmalı.");
    setCv(f);
  };
  const gecerli = ad.trim().length >= 3 && /^\S+@\S+\.\S+$/.test(email) && !!cv && onay;

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gecerli || !cv) return;
    setDurum("gonderiliyor"); setHata(null);
    const f = new FormData();
    f.set("pozisyon", pozisyon); f.set("ad", ad); f.set("email", email); f.set("konum", konum); f.set("baglanti", baglanti); f.set("not", not); f.set("cv", cv);
    try {
      const r = await fetch("/api/basvuru", { method: "POST", body: f });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.hata ?? "Başvuru gönderilemedi.");
      setDurum("tamam");
    } catch (err) {
      setDurum("bos");
      setHata(err instanceof Error ? err.message : "Başvuru gönderilemedi.");
    }
  };

  if (durum === "tamam") {
    return (
      <div className="rounded-[24px] bg-white/[0.03] p-8 ring-1 ring-white/[0.08]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd] text-[#06222b]"><Check className="h-6 w-6" /></span>
        <p className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">Başvurun alındı, {ad.split(" ")[0]}.</p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-metin-2">{pozisyonAd} başvurunu ekibimiz okuyacak. 5 iş günü içinde {email} adresine dönüş yapacağız; hangi aşamaya geçtiğini her adımda bildireceğiz.</p>
      </div>
    );
  }

  return (
    <form onSubmit={gonder} className="rounded-[24px] bg-white/[0.03] p-5 ring-1 ring-white/[0.08] sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="bf-ad" className={etiketSinif}>Ad soyad</label><input id="bf-ad" value={ad} onChange={(e) => setAd(e.target.value)} autoComplete="name" className={girdiSinif} /></div>
        <div><label htmlFor="bf-email" className={etiketSinif}>E-posta</label><input id="bf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={girdiSinif} /></div>
        <div><label htmlFor="bf-konum" className={etiketSinif}>Yaşadığın şehir ve ülke</label><input id="bf-konum" value={konum} onChange={(e) => setKonum(e.target.value)} placeholder="İstanbul, Türkiye" className={girdiSinif} /></div>
        <div><label htmlFor="bf-link" className={etiketSinif}>Portföy / LinkedIn / GitHub</label><input id="bf-link" value={baglanti} onChange={(e) => setBaglanti(e.target.value)} placeholder="https://" className={girdiSinif} /></div>
      </div>

      <p className={cn(etiketSinif, "mt-5")}>CV</p>
      <input ref={dosyaRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => cvSec(e.target.files?.[0])} />
      {cv ? (
        <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.05] px-4 py-3 ring-1 ring-white/[0.09]">
          <FileText className="h-5 w-5 shrink-0 text-[#55d6fd]" />
          <span className="min-w-0 flex-1"><span className="block truncate text-[14px] text-white">{cv.name}</span><span className="block text-[12px] text-metin-2">{Math.round(cv.size / 1024)} KB</span></span>
          <button type="button" onClick={() => setCv(null)} aria-label="CV'yi kaldır" className="rounded-lg p-1.5 text-metin-2 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => dosyaRef.current?.click()}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); cvSec(e.dataTransfer.files?.[0]); }}
          className="flex w-full flex-col items-center gap-2 rounded-[16px] border border-dashed border-white/[0.14] px-4 py-8 text-center transition-colors hover:border-[#55d6fd]/50 hover:bg-[#55d6fd]/[0.04]">
          <Upload className="h-5 w-5 text-metin-2" />
          <span className="text-[14px] font-medium text-white">CV&apos;ni sürükle ya da seç</span>
          <span className="text-[12px] text-metin-2">PDF ya da Word · en fazla 8 MB</span>
        </button>
      )}

      <label htmlFor="bf-not" className={cn(etiketSinif, "mt-5")}>Neden Vayra? <span className="text-metin-2">(isteğe bağlı)</span></label>
      <textarea id="bf-not" value={not} onChange={(e) => setNot(e.target.value.slice(0, 2000))} rows={4} className={cn(girdiSinif, "h-auto resize-none py-3")}
        placeholder="Bu rolle ilgili seni heyecanlandıran şeyi ve gurur duyduğun bir işini birkaç cümleyle anlat." />

      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-metin-2">
        <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#55d6fd]" />
        Başvuru bilgilerimin işe alım süreci boyunca ve sonrasında 12 ay işlenmesini kabul ediyorum. <a href="/gizlilik" className="underline underline-offset-4 hover:text-white">Gizlilik</a>
      </label>
      {hata && <p className="mt-3 text-[13px] text-rose-300">{hata}</p>}
      <button disabled={!gecerli || durum === "gonderiliyor"} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#55d6fd] text-[14.5px] font-semibold text-[#06222b] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-40">
        {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Başvuruyu gönder"}
      </button>
    </form>
  );
}
