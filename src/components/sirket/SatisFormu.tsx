"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { etiketSinif } from "./ortak";

const girdiSinif = "h-11 w-full rounded-[14px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-white/[0.09] transition placeholder:text-metin-2 focus:ring-[#55d6fd]/60";
import { cn } from "@/lib/utils";

const BUYUKLUK = ["1–10", "11–50", "51–200", "201–1.000", "1.000+"];
const SEKTOR = ["Ajans", "E-ticaret / perakende", "Medya & yayıncılık", "Film & prodüksiyon", "Oyun", "Eğitim", "Teknoloji", "Finans", "Diğer"];
const ILGI = ["Ekip planı", "Kurumsal sözleşme", "API & entegrasyon", "Özel model / marka eğitimi", "Güvenlik değerlendirmesi"];
const KISISEL = /@(gmail|hotmail|outlook|yahoo|icloud|yandex|live)\./i;

/** Kurumsal satış formu — /api/iletisim'e "Satış & Kurumsal" konusuyla gider. */
export function SatisFormu({ kaynak = "Kurumsal sayfası" }: { kaynak?: string }) {
  const [f, setF] = useState({ ad: "", soyad: "", email: "", sirket: "", buyukluk: "", sektor: "", mesaj: "" });
  const [ilgi, setIlgi] = useState<string[]>(["Kurumsal sözleşme"]);
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "tamam">("bos");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const emailGecerli = /^\S+@\S+\.\S+$/.test(f.email);
  const gecerli = f.ad.trim() && f.soyad.trim() && emailGecerli && f.sirket.trim() && f.buyukluk && f.sektor;

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gecerli) return;
    setDurum("gonderiliyor");
    try {
      const r = await fetch("/api/iletisim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: `${f.ad} ${f.soyad}`, email: f.email, konu: "Satış & Kurumsal",
          mesaj: [`Şirket: ${f.sirket}`, `Büyüklük: ${f.buyukluk}`, `Sektör: ${f.sektor}`, `İlgi: ${ilgi.join(", ") || "-"}`, `Kaynak: ${kaynak}`, "", f.mesaj.trim() || "(Mesaj yok)"].join("\n"),
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.hata ?? "Sunucu isteği kabul etmedi. Biraz sonra yeniden dene.");
      setDurum("tamam");
    } catch (err) {
      setDurum("bos");
      toast.error("Form gönderilemedi", { description: err instanceof Error && !(err instanceof TypeError) ? err.message : "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene." });
    }
  };

  if (durum === "tamam") {
    return (
      <div className="rounded-[24px] bg-white/[0.03] p-8 ring-1 ring-white/[0.08]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd] text-[#06222b]"><Check className="h-6 w-6" /></span>
        <p className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">Teşekkürler {f.ad}, talebin bize ulaştı.</p>
        <ol className="mt-5 space-y-3 text-[14px] text-metin-2">
          <li><b className="text-white">1 iş günü içinde</b> satış ekibimizden biri {f.email} adresine yazacak.</li>
          <li>30 dakikalık bir görüşmede ihtiyaçlarını dinleyip sana özel bir demo hazırlayacağız.</li>
          <li>Ekibin için deneme alanı ve teklif aynı hafta içinde hazır olur.</li>
        </ol>
      </div>
    );
  }

  return (
    <form onSubmit={gonder} className="rounded-[24px] bg-white/[0.03] p-5 ring-1 ring-white/[0.08] sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="sf-ad" className={etiketSinif}>Ad</label><input id="sf-ad" value={f.ad} onChange={set("ad")} autoComplete="given-name" className={girdiSinif} /></div>
        <div><label htmlFor="sf-soyad" className={etiketSinif}>Soyad</label><input id="sf-soyad" value={f.soyad} onChange={set("soyad")} autoComplete="family-name" className={girdiSinif} /></div>
        <div className="sm:col-span-2">
          <label htmlFor="sf-email" className={etiketSinif}>İş e-postası</label>
          <input id="sf-email" type="email" value={f.email} onChange={set("email")} autoComplete="email" placeholder="ad@sirket.com" className={girdiSinif} />
          {KISISEL.test(f.email) && <p className="mt-1.5 text-[12px] text-amber-200">Daha hızlı dönüş için şirket e-postanı kullanmanı öneririz.</p>}
        </div>
        <div className="sm:col-span-2"><label htmlFor="sf-sirket" className={etiketSinif}>Şirket</label><input id="sf-sirket" value={f.sirket} onChange={set("sirket")} autoComplete="organization" className={girdiSinif} /></div>
        <div>
          <label htmlFor="sf-buyukluk" className={etiketSinif}>Şirket büyüklüğü</label>
          <select id="sf-buyukluk" value={f.buyukluk} onChange={set("buyukluk")} className={cn(girdiSinif, "appearance-none", !f.buyukluk && "text-metin-2")}>
            <option value="" disabled>Seç</option>
            {BUYUKLUK.map((b) => <option key={b} value={b} className="bg-[#1d1e22]">{b} kişi</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sf-sektor" className={etiketSinif}>Sektör</label>
          <select id="sf-sektor" value={f.sektor} onChange={set("sektor")} className={cn(girdiSinif, "appearance-none", !f.sektor && "text-metin-2")}>
            <option value="" disabled>Seç</option>
            {SEKTOR.map((s) => <option key={s} className="bg-[#1d1e22]">{s}</option>)}
          </select>
        </div>
      </div>
      <p className={cn(etiketSinif, "mt-5")}>İlgilendiğin konular</p>
      <div className="flex flex-wrap gap-2">
        {ILGI.map((x) => {
          const a = ilgi.includes(x);
          return (
            <button type="button" key={x} aria-pressed={a} onClick={() => setIlgi(a ? ilgi.filter((y) => y !== x) : [...ilgi, x])}
              className={cn("rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 transition-colors active:scale-[0.97]", a ? "bg-[#55d6fd]/15 text-[#55d6fd] ring-[#55d6fd]/40" : "text-metin-2 ring-white/[0.1] hover:text-white")}>{x}</button>
          );
        })}
      </div>
      <label htmlFor="sf-mesaj" className={cn(etiketSinif, "mt-5")}>Ekibinin ihtiyacı <span className="text-metin-2">(isteğe bağlı)</span></label>
      <textarea id="sf-mesaj" value={f.mesaj} onChange={set("mesaj")} rows={4} placeholder="Kaç kişi kullanacak, hangi içerikleri üretiyorsunuz, bir son tarihiniz var mı?"
        className={cn(girdiSinif, "h-auto resize-none py-3")} />
      <button disabled={!gecerli || durum === "gonderiliyor"} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#55d6fd] text-[14.5px] font-semibold text-[#06222b] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-40">
        {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Satış ekibiyle görüş"}
      </button>
      <p className="mt-3 text-center text-[12px] text-metin-2">Göndererek bilgilerinin bu talep için işlenmesini kabul edersin. <a href="/gizlilik" className="underline underline-offset-4 hover:text-white">Gizlilik</a></p>
    </form>
  );
}
