"use client";

import { useMemo, useState } from "react";
import { ChevronDown, FileText, Wand2 } from "lucide-react";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

type Kontrol = { ad: string; durum: "iyi" | "uyari" | "eksik"; ayrinti: string; ajan?: string };
type SayfaSonuc = { sayfa: string; puan: number; kontroller: Kontrol[] };

const metin = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Bir sayfanın SEO ve yapay zekâ araması kontrolleri (istemcide, saf). */
function sayfaDenetle(yol: string, h: string, genel: { baslik: string; aciklama: string; ogGorsel?: string }): SayfaSonuc {
  const k: Kontrol[] = [];
  const baslik = h.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const b = baslik || genel.baslik;
  k.push(!b ? { ad: "Sayfa başlığı", durum: "eksik", ayrinti: "Sekmede ve aramada görünen başlık yok.", ajan: `${yol} sayfasına konuyu anlatan 50-60 karakterlik bir <title> ekle.` }
    : b.length < 15 || b.length > 65 ? { ad: "Sayfa başlığı", durum: "uyari", ayrinti: `${b.length} karakter; 30 ile 60 arası en iyisi.`, ajan: `${yol} sayfasının başlığını 30-60 karakter arasına getir, marka adı sonda olsun.` }
      : { ad: "Sayfa başlığı", durum: "iyi", ayrinti: b });
  const acik = h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? "";
  const a = acik || genel.aciklama;
  k.push(!a ? { ad: "Açıklama", durum: "eksik", ayrinti: "Arama sonucunda görünen kısa açıklama yok.", ajan: `${yol} sayfasına 120-155 karakterlik, sayfaya özgü bir meta description ekle.` }
    : a.length < 70 || a.length > 165 ? { ad: "Açıklama", durum: "uyari", ayrinti: `${a.length} karakter; 120 ile 155 arası en iyisi.`, ajan: `${yol} sayfasının meta description metnini 120-155 karaktere getir.` }
      : { ad: "Açıklama", durum: "iyi", ayrinti: `${a.length} karakter` });
  const h1 = (h.match(/<h1\b/gi) ?? []).length;
  k.push(h1 === 1 ? { ad: "Ana başlık", durum: "iyi", ayrinti: "Tek bir h1 var." } : { ad: "Ana başlık", durum: h1 ? "uyari" : "eksik", ayrinti: h1 ? `${h1} tane h1 var; bir tane olmalı.` : "Sayfada h1 yok.", ajan: `${yol} sayfasında tek bir h1 olsun; diğer başlıkları h2 ve h3 yap.` });
  const altsiz = (h.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
  k.push(altsiz ? { ad: "Görsel açıklamaları", durum: "uyari", ayrinti: `${altsiz} görselde alt metni yok.`, ajan: `${yol} sayfasındaki alt metni olmayan görsellere anlamlı Türkçe alt metin ekle.` } : { ad: "Görsel açıklamaları", durum: "iyi", ayrinti: "Bütün görsellerde alt metin var." });
  k.push(/<html[^>]+lang=["'][a-z]{2}/i.test(h) ? { ad: "Dil", durum: "iyi", ayrinti: h.match(/<html[^>]+lang=["']([a-zA-Z-]+)/i)?.[1] ?? "" } : { ad: "Dil", durum: "uyari", ayrinti: "html etiketinde dil (lang) yok.", ajan: `${yol} sayfasının <html> etiketine lang="tr" ekle.` });
  k.push(/<meta[^>]+name=["']viewport["']/i.test(h) ? { ad: "Telefon uyumu", durum: "iyi", ayrinti: "viewport etiketi var." } : { ad: "Telefon uyumu", durum: "eksik", ayrinti: "viewport etiketi yok; telefonda küçük görünür.", ajan: `${yol} sayfasına viewport meta etiketini ekle.` });
  const ld = /application\/ld\+json/i.test(h);
  k.push(ld ? { ad: "Yapılandırılmış veri", durum: "iyi", ayrinti: "JSON-LD var; arama motorları ve yapay zekâ işletmeyi tanır." } : { ad: "Yapılandırılmış veri", durum: "uyari", ayrinti: "JSON-LD yok. İşletme, ürün ya da yazı bilgisi eklemek zengin sonuç ve yapay zekâ aramasında görünürlük sağlar.", ajan: `${yol} sayfasına içeriğe uygun schema.org JSON-LD ekle (işletmeyse LocalBusiness: ad, adres, saatler, telefon; ürünse Product; yazıysa Article).` });
  const kelime = metin(h).split(" ").filter((x) => x.length > 1).length;
  k.push(kelime >= 150 ? { ad: "İçerik", durum: "iyi", ayrinti: `${kelime} kelime` } : { ad: "İçerik", durum: "uyari", ayrinti: `${kelime} kelime; arama motorları ve yapay zekâ için az.`, ajan: `${yol} sayfasına ziyaretçiye gerçekten yararlı, en az 150 kelimelik özgün Türkçe metin ekle (sık sorulan sorular bölümü iyi bir yoldur).` });
  const puan = Math.round((k.reduce((t, x) => t + (x.durum === "iyi" ? 1 : x.durum === "uyari" ? 0.5 : 0), 0) / k.length) * 100);
  return { sayfa: yol, puan, kontroller: k };
}

/** Ayarlar > Arama ve paylaşım: sayfa sayfa SEO ve yapay zekâ araması denetimi, otomatik dosyalar, paylaşım kartı önizlemesi. */
export function SeoDenetimi({ p, ajanaGonder }: { p: Proje; ajanaGonder?: (metin: string) => void }) {
  const sonuclar = useMemo(() => Object.entries(p.dosyalar).filter(([y]) => y.endsWith(".html") && y !== "404.html").map(([y, h]) => sayfaDenetle(y, h, p.ayarlar.seo)).sort((a, b) => a.puan - b.puan), [p.dosyalar, p.ayarlar.seo]);
  const [acik, setAcik] = useState<string | null>(null);
  const ort = sonuclar.length ? Math.round(sonuclar.reduce((t, x) => t + x.puan, 0) / sonuclar.length) : 0;
  const duzeltilecek = sonuclar.flatMap((s) => s.kontroller.filter((x) => x.ajan && x.durum !== "iyi").map((x) => x.ajan!));
  return (
    <div className="overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold tabular-nums ring-2 ring-inset", ort >= 85 ? "text-[#8be6ff] ring-[#55d6fd]/60" : ort >= 60 ? "text-amber-200 ring-amber-300/50" : "text-rose-200 ring-rose-400/50")}>{ort}</span>
        <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">Arama ve yapay zekâ denetimi</p><p className="text-[12.5px] text-white/50">{sonuclar.length} sayfa · 100 üzerinden ortalama puan</p></div>
        {ajanaGonder && duzeltilecek.length > 0 && <button type="button" onClick={() => ajanaGonder(`Arama motorları ve yapay zekâ araması için şunları düzelt, sayfaların görünümünü bozma:\n${duzeltilecek.slice(0, 20).map((x) => `- ${x}`).join("\n")}`)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Hepsini ajana düzelttir</button>}
      </div>
      <div className="grid gap-px bg-white/[0.05] sm:grid-cols-3">
        {[["robots.txt", "Arama motorlarına izinler"], ["sitemap.xml", "Bütün sayfaların listesi"], ["llms.txt", "Yapay zekâ arama motorları için özet"]].map(([a, b]) => (
          <div key={a} className="flex items-center gap-2.5 bg-[#141518] px-4 py-3"><span className="h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" /><span className="min-w-0"><span className="block text-[13px] text-white">{a}</span><span className="block truncate text-[11.5px] text-white/45">{p.dosyalar[a] ? "Projedeki dosya kullanılıyor" : `Kendiliğinden üretiliyor · ${b}`}</span></span></div>
        ))}
      </div>
      <div className="divide-y divide-white/[0.05]">
        {sonuclar.map((s) => (
          <div key={s.sayfa}>
            <button type="button" onClick={() => setAcik(acik === s.sayfa ? null : s.sayfa)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] sm:px-5">
              <FileText className="h-4 w-4 shrink-0 text-white/40" />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-white">{s.sayfa}</span>
              <span className="text-[12px] text-white/45">{s.kontroller.filter((x) => x.durum !== "iyi").length ? `${s.kontroller.filter((x) => x.durum !== "iyi").length} öneri` : "Tamam"}</span>
              <span className={cn("w-10 text-right text-[13px] font-semibold tabular-nums", s.puan >= 85 ? "text-[#8be6ff]" : s.puan >= 60 ? "text-amber-200" : "text-rose-200")}>{s.puan}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/40 transition-transform", acik === s.sayfa && "rotate-180")} />
            </button>
            {acik === s.sayfa && (
              <div className="space-y-1 px-4 pb-3 sm:px-5">
                {s.kontroller.map((x) => (
                  <div key={x.ad} className="flex items-start gap-2.5 rounded-[12px] px-2.5 py-2 hover:bg-white/[0.02]">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", x.durum === "iyi" ? "bg-[#55d6fd]" : x.durum === "uyari" ? "bg-amber-300" : "bg-rose-400")} />
                    <span className="min-w-0 flex-1"><span className="block text-[13px] text-white/85">{x.ad}</span><span className="block text-[12px] leading-snug text-white/45 sm:truncate">{x.ayrinti}</span></span>
                    {x.ajan && x.durum !== "iyi" && ajanaGonder && <button type="button" onClick={() => ajanaGonder(x.ajan!)} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/[0.07] px-2.5 text-[12px] text-white/80 hover:bg-white/[0.12]"><Wand2 className="h-3 w-3" />Düzelt</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Bağlantı paylaşıldığında görünen kart (WhatsApp ve X tarzı). */
export function PaylasimKarti({ baslik, aciklama, gorsel, alan }: { baslik: string; aciklama: string; gorsel?: string; alan: string }) {
  return (
    <div className="mx-auto max-w-[420px] overflow-hidden rounded-[16px] bg-[#1f2c34] ring-1 ring-inset ring-white/[0.06]">
      {gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={gorsel} alt="" className="aspect-[1200/630] w-full object-cover" /> : <div className="flex aspect-[1200/630] items-center justify-center bg-white/[0.04] text-[12.5px] text-white/40">Paylaşım görseli yok</div>}
      <div className="px-3.5 py-3">
        <p className="truncate text-[14px] font-semibold text-white">{baslik}</p>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-white/65">{aciklama || "Açıklama yok"}</p>
        <p className="mt-1.5 text-[11.5px] text-white/40">{alan}</p>
      </div>
    </div>
  );
}
