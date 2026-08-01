"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2, Upload, Link2, Check, ExternalLink, Image as ImgIkon } from "lucide-react";
import { useEarn, PLATFORMLAR, GORUNTULENME_PAKETLERI, paketBul, tierBul, tl, type Platform } from "@/store/useEarn";
import { SayfaBaslik, Kart, DurumRozet, YesilDugme, Rozet, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

export default function SosyalPaylasim() {
  const s = useEarn();
  const tier = tierBul(s.xp);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [link, setLink] = useState("");
  const [goruntulenme, setGoruntulenme] = useState("");
  const [kanit, setKanit] = useState<string | null>(null);

  const bagli = s.bagliHesaplar.find((h) => h.platform === platform);
  const gorSayi = parseInt(goruntulenme.replace(/\D/g, "")) || 0;
  const paket = paketBul(gorSayi);
  const tahminiKredi = paket ? Math.round(paket.kredi * tier.carpan) : 0;

  const gonder = () => {
    if (!bagli?.dogrulandi) { toast.error("Önce bu platformdaki hesabını bağlayıp doğrula."); return; }
    if (!link.trim()) { toast.error("Paylaşım linkini gir."); return; }
    if (!kanit) { toast.error("Görüntülenme ekran görüntüsü ekle (kanıt)."); return; }
    if (gorSayi < 1000) { toast.error("En az 1.000 görüntülenme gerekli."); return; }
    s.paylasimGonder({ platform, link: link.trim(), kanitUrl: kanit, goruntulenme: gorSayi });
    toast.success(`Paylaşım gönderildi — moderasyon onayı sonrası ${tahminiKredi.toLocaleString("tr-TR")} kredi yatar.`);
    setLink(""); setGoruntulenme(""); setKanit(null);
  };

  const dosyaSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => setKanit(okuyucu.result as string);
    okuyucu.readAsDataURL(f);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Sosyal Paylaşım" ozet="Vayra içeriğini paylaş, görüntülenmene göre kazan. Tier'in çarpanını uygular." />

      {/* görüntülenme paketleri */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GORUNTULENME_PAKETLERI.map((p) => (
          <div key={p.esik} className={cn("rounded-2xl border p-4 text-center", paket?.esik === p.esik ? "border-sky-400/40 bg-sky-500/[0.08]" : "border-white/[0.06] bg-[#14151799] backdrop-blur-xl")}>
            <div className="text-lg font-bold text-white">{p.ad}</div>
            <div className="text-[11px] text-white/40">görüntülenme</div>
            <div className="mt-2 text-sm font-bold text-sky-300">+{p.kredi.toLocaleString("tr-TR")} kr</div>
            <div className="text-[10px] text-white/35">×{tier.carpan} = {Math.round(p.kredi * tier.carpan).toLocaleString("tr-TR")}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* paylaşım gönder */}
        <Kart>
          <h2 className="mb-4 flex items-center gap-2 font-bold text-white"><Share2 className="h-4.5 w-4.5 text-sky-400" /> Paylaşım Gönder</h2>

          {/* platform seç */}
          <label className="mb-1.5 block text-xs font-semibold text-white/60">Platform</label>
          <div className="mb-3 grid grid-cols-4 gap-2">
            {PLATFORMLAR.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className={cn("rounded-xl border py-2 text-xs font-semibold transition-colors", platform === p.id ? "border-sky-400/40 bg-sky-500/10 text-white" : "border-white/[0.08] text-white/50 hover:text-white")}>
                {p.ad}
              </button>
            ))}
          </div>

          {/* hesap bağlı mı */}
          {bagli?.dogrulandi ? (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-sky-500/[0.08] px-3 py-2 text-xs text-sky-300">
              <Check className="h-3.5 w-3.5" /> @{bagli.kullaniciAdi} bağlı ve doğrulanmış
            </div>
          ) : (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-400/25 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-200">
              <span>Bu platformda hesabın bağlı değil.</span>
              <Link href="/earn/hesaplar" className="font-semibold underline">Bağla</Link>
            </div>
          )}

          <label className="mb-1.5 block text-xs font-semibold text-white/60">Paylaşım linki</label>
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3">
            <Link2 className="h-4 w-4 text-white/40" />
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/reel/…" className="h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-white/60">Görüntülenme sayısı</label>
          <input value={goruntulenme} onChange={(e) => setGoruntulenme(e.target.value)} placeholder="örn. 12500" inputMode="numeric" className="mb-3 h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />

          <label className="mb-1.5 block text-xs font-semibold text-white/60">Kanıt (görüntülenme ekran görüntüsü)</label>
          <label className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.15] py-5 text-white/50 hover:bg-white/[0.03]">
            {kanit ? (
              <>{/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kanit} alt="kanıt" className="max-h-24 rounded-lg" />
                <span className="text-[11px] text-sky-300">Görüntü eklendi · değiştir</span>
              </>
            ) : (
              <><Upload className="h-6 w-6" /><span className="text-xs">Ekran görüntüsü yükle</span></>
            )}
            <input type="file" accept="image/*" onChange={dosyaSec} className="hidden" />
          </label>

          {tahminiKredi > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-sky-500/[0.06] px-3 py-2 text-sm">
              <span className="text-white/60">Tahmini ödül</span>
              <span className="font-bold text-sky-300">+{tahminiKredi.toLocaleString("tr-TR")} kredi ({tl(tahminiKredi)})</span>
            </div>
          )}

          <YesilDugme onClick={gonder} className="w-full">Paylaşımı Gönder</YesilDugme>
        </Kart>

        {/* gönderilerim */}
        <Kart>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Gönderdiğim paylaşımlar</h2>
            {s.paylasimlar.length > 0 && <Link href="/earn/basvurular" className="text-sm font-semibold text-sky-400 hover:text-sky-300">Takip →</Link>}
          </div>
          {s.paylasimlar.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/40">Henüz paylaşım göndermedin.</p>
          ) : (
            <div className="space-y-2">
              {s.paylasimlar.map((p) => {
                const pl = PLATFORMLAR.find((x) => x.id === p.platform);
                return (
                  <div key={p.id} className="rounded-xl border border-white/[0.06] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: pl?.renk }} />
                        <span className="text-sm font-medium text-white">{pl?.ad}</span>
                        <span className="text-xs text-white/40">· {p.goruntulenme.toLocaleString("tr-TR")} gör.</span>
                      </div>
                      <DurumRozet durum={p.durum} />
                    </div>
                    <a href={p.link} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 truncate text-xs text-white/45 hover:text-sky-300">
                      <ExternalLink className="h-3 w-3 shrink-0" /> {p.link}
                    </a>
                    <div className="mt-1 flex items-center justify-between">
                      <span className={cn("text-sm font-bold", p.durum === "onaylandi" ? "text-sky-300" : "text-white/50")}>+{p.kredi.toLocaleString("tr-TR")} kr</span>
                      {p.redNedeni && <span className="text-[11px] text-rose-300">{p.redNedeni}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Kart>
      </div>
    </div>
  );
}
