"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageCircle, MapPin, Send, Briefcase, Newspaper, Handshake, ShieldCheck, Clock, Check, Building2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { Hero, BolumBaslik, MiniSSS } from "@/components/kurumsal/UI";
import { ILETISIM, OFISLER } from "@/lib/kurumsal/site";
import { CALISMA_SAATLERI, ILETISIM_SSS } from "@/lib/kurumsal/detay";

const KONULAR = ["Genel", "Satış & Kurumsal", "Destek", "İş Ortaklığı", "Basın"] as const;

const KANALLAR = [
  { ikon: Briefcase, ad: "Satış & Kurumsal", deger: ILETISIM.genel, href: `mailto:${ILETISIM.genel}` },
  { ikon: Handshake, ad: "İş Ortaklığı", deger: ILETISIM.partner, href: "/partner" },
  { ikon: Newspaper, ad: "Basın & Medya", deger: ILETISIM.basin, href: "/basin" },
  { ikon: ShieldCheck, ad: "Güvenlik & Veri Koruma", deger: ILETISIM.gizlilik, href: `mailto:${ILETISIM.gizlilik}` },
];

export default function Iletisim() {
  const [form, setForm] = useState({ ad: "", email: "", konu: "Genel", mesaj: "" });
  const [gonderildi, setGonderildi] = useState(false);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ad || !form.email.includes("@") || form.mesaj.length < 5) {
      return toast.error("Lütfen tüm alanları doğru doldur.");
    }
    setGonderildi(true);
    try {
      const yanit = await fetch("/api/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const veri = await yanit.json();
      if (!yanit.ok || !veri.ok) throw new Error(veri.hata ?? "Gönderilemedi");
      toast.success("Mesajın alındı", { description: "En kısa sürede dönüş yapacağız." });
      setForm({ ad: "", email: "", konu: "Genel", mesaj: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mesaj gönderilemedi, lütfen tekrar dene.");
    } finally {
      setTimeout(() => setGonderildi(false), 3000);
    }
  };

  const alan = "h-12 w-full rounded-xl border border-[color:var(--color-kenar)] bg-white px-4 text-sm text-[color:var(--color-metin)] outline-none placeholder:text-[color:var(--color-metin-3)] focus:border-[color:var(--color-kenar-2)]";

  return (
    <>
      <Hero ustBaslik="İletişim" baslik="Bize ulaş" aciklama="Soruların, iş birliği teklifin veya kurumsal ihtiyacın için buradayız. Doğru ekibe yönlendirelim." izgara={false} />

      <section className="mx-auto grid max-w-5xl gap-8 px-4 pb-8 md:grid-cols-5">
        {/* Sol: kanallar + bilgiler */}
        <div className="space-y-4 md:col-span-2">
          <div className="kr-kart p-5">
            <div className="flex items-center gap-3">
              <span className="kr-ikon flex h-11 w-11 items-center justify-center rounded-xl"><Mail className="h-5 w-5" /></span>
              <div>
                <div className="text-sm text-[color:var(--color-metin-3)]">Genel e-posta</div>
                <a href={`mailto:${ILETISIM.genel}`} className="font-semibold text-[color:var(--color-metin)]">{ILETISIM.genel}</a>
              </div>
            </div>
          </div>

          <div className="kr-kart p-5">
            <div className="flex items-center gap-3">
              <span className="kr-ikon flex h-11 w-11 items-center justify-center rounded-xl"><MessageCircle className="h-5 w-5" /></span>
              <div>
                <div className="text-sm text-[color:var(--color-metin-3)]">Canlı destek</div>
                <div className="font-semibold text-[color:var(--color-metin)]">Panel içinden 7/24</div>
              </div>
            </div>
          </div>

          <div className="kr-kart p-5">
            <div className="flex items-center gap-3">
              <span className="kr-ikon flex h-11 w-11 items-center justify-center rounded-xl"><MapPin className="h-5 w-5" /></span>
              <div>
                <div className="text-sm text-[color:var(--color-metin-3)]">Genel merkez</div>
                <div className="font-semibold text-[color:var(--color-metin)]">{ILETISIM.adres}</div>
              </div>
            </div>
          </div>

          {/* Departman kanalları */}
          <div className="kr-kart p-5">
            <p className="mb-3 text-sm font-semibold text-[color:var(--color-metin)]">Doğrudan departmanlar</p>
            <div className="space-y-1">
              {KANALLAR.map((k) => (
                <Link key={k.ad} href={k.href as never} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[color:var(--color-yuzey-2)]">
                  <k.ikon className="h-4 w-4 text-[color:var(--kr-lime-metin)]" />
                  <span className="text-sm text-[color:var(--color-metin)]">{k.ad}</span>
                  <span className="ml-auto text-xs text-[color:var(--color-metin-3)]">{k.deger}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: form */}
        <form onSubmit={gonder} className="kr-kart h-fit p-6 md:col-span-3">
          <h2 className="mb-4 text-lg font-bold text-[color:var(--color-metin)]">Mesaj gönder</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })} placeholder="Adın" className={alan} />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-postan" className={alan} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[color:var(--color-metin-2)]">Konu</label>
              <div className="flex flex-wrap gap-2">
                {KONULAR.map((k) => (
                  <button type="button" key={k} onClick={() => setForm({ ...form, konu: k })}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${form.konu === k ? "kr-cta border-transparent" : "border-[color:var(--color-kenar)] text-[color:var(--color-metin-2)] hover:text-[color:var(--color-metin)]"}`}>{k}</button>
                ))}
              </div>
            </div>
            <textarea value={form.mesaj} onChange={(e) => setForm({ ...form, mesaj: e.target.value })} rows={5} placeholder="Mesajın…"
              className="w-full resize-none rounded-xl border border-[color:var(--color-kenar)] bg-white p-4 text-sm text-[color:var(--color-metin)] outline-none placeholder:text-[color:var(--color-metin-3)] focus:border-[color:var(--color-kenar-2)]" />
            <button type="submit" disabled={gonderildi} className="kr-cta flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold disabled:opacity-60">
              {gonderildi ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />} {gonderildi ? "Gönderildi" : "Mesajı gönder"}
            </button>
            <p className="text-center text-xs text-[color:var(--color-metin-3)]">Genellikle 1 iş günü içinde yanıtlıyoruz.</p>
          </div>
        </form>
      </section>

      {/* Ofisler — global varlık */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <BolumBaslik baslik="Ofislerimiz" ozet="Üç kıtada, dört şehirde. Sana en yakın ekiple konuş." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OFISLER.map((o) => (
            <div key={o.sehir} className="kr-kart">
              <div className="flex items-center gap-2.5">
                <span className="kr-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Building2 className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[color:var(--color-metin)]">{o.sehir}</div>
                  <div className="truncate text-xs text-[color:var(--color-metin-3)]">{o.ulke}</div>
                </div>
              </div>
              <div className="mt-3 border-t border-[color:var(--color-kenar)] pt-3">
                <div className="text-[13px] font-medium text-[color:var(--color-metin-2)]">{o.rol}</div>
                <div className="mt-0.5 text-xs text-[color:var(--color-metin-3)]">{o.saat}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Çalışma saatleri */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <BolumBaslik baslik="Çalışma saatlerimiz" ozet="Destek ekibimiz bölgeler arasında dönüşümlü çalışır — hafta içi kesintisiz yanıt." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALISMA_SAATLERI.map((c) => (
            <div key={c.gun} className="kr-kart flex items-center gap-3">
              <span className="kr-ikon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><Clock className="h-4.5 w-4.5" /></span>
              <div>
                <div className="text-sm font-semibold text-[color:var(--color-metin)]">{c.gun}</div>
                <div className="text-xs text-[color:var(--color-metin-3)]">{c.saat}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* İletişim SSS */}
      <section className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <BolumBaslik baslik="Sıkça sorulanlar" />
        <MiniSSS maddeler={ILETISIM_SSS} />
      </section>
    </>
  );
}
