"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/useAuth";
import { girdiSinif, etiketSinif } from "./ortak";
import { cn } from "@/lib/utils";

const TALEPLER = [
  { id: "erisim", ad: "Verilerime erişim", ozet: "Hangi verilerimin işlendiğini öğrenmek ve bir kopyasını almak istiyorum." },
  { id: "duzeltme", ad: "Düzeltme", ozet: "Eksik ya da yanlış verilerimin düzeltilmesini istiyorum." },
  { id: "silme", ad: "Silme", ozet: "Hesabımın ve verilerimin silinmesini istiyorum." },
  { id: "itiraz", ad: "İtiraz / kısıtlama", ozet: "Belirli bir işlemeye itiraz ediyorum ya da kısıtlanmasını istiyorum." },
  { id: "tasima", ad: "Taşınabilirlik", ozet: "Verilerimin makine tarafından okunabilir bir kopyasını istiyorum." },
  { id: "diger", ad: "Diğer", ozet: "Başka bir talebim ya da sorum var." },
] as const;

/**
 * KVKK md. 11 / GDPR md. 15–22 başvurusu — /api/iletisim'e "Veri talebi" konusuyla gider.
 * Yasal süre (30 gün) bilgisi ve kimlik doğrulama adımı açıkça belirtilir.
 */
export function VeriTalebiFormu() {
  const kullanici = useAuth((s) => s.kullanici);
  const [tur, setTur] = useState<(typeof TALEPLER)[number]["id"]>("erisim");
  const [ad, setAd] = useState(kullanici?.ad ?? "");
  const [email, setEmail] = useState(kullanici?.email ?? "");
  const [ulke, setUlke] = useState<"tr" | "diger">("tr");
  const [aciklama, setAciklama] = useState("");
  const [onay, setOnay] = useState(false);
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "tamam">("bos");
  const gecerli = ad.trim().length >= 3 && /^\S+@\S+\.\S+$/.test(email) && onay;

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gecerli) return;
    setDurum("gonderiliyor");
    const secili = TALEPLER.find((t) => t.id === tur)!;
    try {
      const r = await fetch("/api/iletisim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad, email, konu: `Veri talebi · ${secili.ad} · ${ulke === "tr" ? "KVKK" : "GDPR"}`,
          mesaj: `${secili.ozet}\n\n${aciklama.trim() || "(Ek açıklama yok)"}`,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.hata ?? "Sunucu isteği kabul etmedi. Biraz sonra yeniden dene.");
      setDurum("tamam");
      toast.success("Talebin alındı", { description: "Kimlik doğrulama için e-posta adresine yazacağız." });
    } catch (err) {
      setDurum("bos");
      toast.error("Talep gönderilemedi", { description: err instanceof Error && !(err instanceof TypeError) ? err.message : "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene." });
    }
  };

  if (durum === "tamam") {
    return (
      <div className="rounded-[22px] border border-white/[0.07] bg-yuzey p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tur-3d/15 text-tur-3d"><Check className="h-6 w-6" /></span>
        <p className="mt-4 text-[18px] font-semibold text-white">Talebin kayda alındı</p>
        <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-relaxed text-metin-2">Kimliğini doğrulamak için {email} adresine yazacağız. Talebin en geç 30 gün içinde ücretsiz sonuçlandırılır.</p>
        <button onClick={() => { setDurum("bos"); setAciklama(""); setOnay(false); }} className="mt-5 text-[13px] font-medium text-metin-2 hover:text-white">Yeni talep oluştur</button>
      </div>
    );
  }

  return (
    <form onSubmit={gonder} className="rounded-[22px] border border-white/[0.07] bg-yuzey p-6 sm:p-8">
      <p className={etiketSinif}>Talep türü</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {TALEPLER.map((t) => (
          <button type="button" key={t.id} onClick={() => setTur(t.id)} aria-pressed={tur === t.id}
            className={cn("rounded-xl border px-3.5 py-3 text-left transition-colors", tur === t.id ? "border-vurgu/60 bg-[color-mix(in_oklab,var(--vurgu-renk)_16%,#111113)]" : "border-white/[0.08] hover:border-white/20")}>
            <span className="block text-[13.5px] font-semibold text-white">{t.ad}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-metin-3">{t.ozet}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="vt-ad" className={etiketSinif}>Ad soyad</label><input id="vt-ad" value={ad} onChange={(e) => setAd(e.target.value)} className={girdiSinif} /></div>
        <div><label htmlFor="vt-email" className={etiketSinif}>Hesabındaki e-posta</label><input id="vt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={girdiSinif} /></div>
      </div>
      <p className={cn(etiketSinif, "mt-5")}>Bulunduğun yer</p>
      <div className="flex gap-2">
        {([["tr", "Türkiye (KVKK)"], ["diger", "Diğer ülkeler (GDPR)"]] as const).map(([id, a]) => (
          <button type="button" key={id} onClick={() => setUlke(id)} aria-pressed={ulke === id}
            className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium", ulke === id ? "border-white bg-white text-zemin" : "border-white/[0.12] text-metin-2 hover:text-white")}>{a}</button>
        ))}
      </div>
      <label htmlFor="vt-aciklama" className={cn(etiketSinif, "mt-5")}>Açıklama <span className="text-metin-3">(isteğe bağlı)</span></label>
      <textarea id="vt-aciklama" value={aciklama} onChange={(e) => setAciklama(e.target.value.slice(0, 2000))} rows={4}
        className={cn(girdiSinif, "h-auto resize-none py-3")} placeholder="Talebinle ilgili ayrıntıları yaz." />
      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-metin-2">
        <input type="checkbox" checked={onay} onChange={(e) => setOnay(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--vurgu-renk)]" />
        Bu talebi kendi verilerim için yaptığımı ve kimliğimi doğrulamak için benimle iletişime geçilebileceğini kabul ediyorum.
      </label>
      <button disabled={!gecerli || durum === "gonderiliyor"} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-zemin hover:opacity-90 disabled:opacity-40 sm:w-auto sm:px-6">
        {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Talebi gönder
      </button>
    </form>
  );
}
