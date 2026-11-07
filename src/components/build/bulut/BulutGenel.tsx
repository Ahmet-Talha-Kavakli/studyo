"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Cloud, Database, FolderOpen, Globe, HardDrive, Lock, Rocket, Users } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { HesapKullanimi } from "./HesapKullanimi";
import { api, yayinAdresi } from "@/lib/build/istemci";
import { BildirimKutusu } from "./Bildirimler";

export type BulutOzeti = {
  id: string; ad: string; tur: string; kapak?: string; altAlan: string; yayin: { surumId: string; surumNo: number; zaman: number } | null; sonSurum: number;
  alanAdlari: { ad: string; durum: string; birincil: boolean }[]; sifreli: boolean;
  istek: number; hata: number; ortSure: number; gunler: { tarih: string; istek: number; hata: number }[];
  goruntuleme: number; ziyaretci: number; kayit: number; koleksiyon: number; uye: number; depolama: number; dosya: number; guncelleme: number;
};
export const boyutYaz = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} KB` : `${(b / 1024 ** 2).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`);
export const sayi = (n: number) => n.toLocaleString("tr-TR");

/** 7 günlük istek çubukları (tek seri; değer üzerine gelince görünür). */
export function MiniCubuk({ l, yukseklik = 28 }: { l: { tarih: string; istek: number }[]; yukseklik?: number }) {
  const en = Math.max(1, ...l.map((x) => x.istek));
  return (
    <span className="flex items-end gap-[3px]" style={{ height: yukseklik }} aria-label="Son 7 gün istekleri">
      {l.map((x) => <span key={x.tarih} title={`${new Date(x.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}: ${sayi(x.istek)} istek`} className="w-[6px] rounded-t-[2px] bg-[#1e9fcf] hover:bg-[#55d6fd]" style={{ height: `${Math.max(2, (x.istek / en) * yukseklik)}px`, opacity: x.istek ? 1 : 0.25 }} />)}
    </span>
  );
}

export function Durum({ o }: { o: Pick<BulutOzeti, "yayin" | "sifreli" | "sonSurum"> }) {
  return o.yayin
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.12] px-2.5 py-1 text-[11.5px] font-medium text-[#8be6ff]">{o.sifreli && <Lock className="h-3 w-3" />}Yayında, sürüm {o.yayin.surumNo}</span>
    : <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] font-medium text-white/55">Yayında değil</span>;
}

/** Vayra Bulut genel bakış: bütün projelerin barındırma, veri, kimlik ve depolama özeti. */
export function BulutGenel() {
  const [l, setL] = useState<BulutOzeti[] | null>(null);
  useEffect(() => { api<{ projeler: BulutOzeti[] }>("/api/build/bulut").then((v) => setL(v.projeler)).catch(() => setL([])); }, []);
  const t = (f: (x: BulutOzeti) => number) => (l ?? []).reduce((a, x) => a + f(x), 0);
  const kutular: { ad: string; deger: string; I: typeof Cloud }[] = [
    { ad: "Yayındaki proje", deger: `${(l ?? []).filter((x) => x.yayin).length} / ${(l ?? []).length}`, I: Rocket },
    { ad: "İstek, 7 gün", deger: sayi(t((x) => x.istek)), I: Globe },
    { ad: "Ziyaretçi, 7 gün", deger: sayi(t((x) => x.ziyaretci)), I: Users },
    { ad: "Veri kaydı", deger: sayi(t((x) => x.kayit)), I: Database },
    { ad: "Üye", deger: sayi(t((x) => x.uye)), I: Users },
    { ad: "Depolama", deger: boyutYaz(t((x) => x.depolama)), I: HardDrive },
  ];
  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <Kart ikon={Cloud} baslik="Vayra Bulut" alt="Yayın, alan adı, veritabanı, kimlik, dosya ve günlükler tek yerde; ayrı hesap ya da fatura yok">
        <div className="grid grid-cols-2 divide-white/[0.06] sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
          {kutular.map((k) => (
            <div key={k.ad} className="border-b border-white/[0.06] px-4 py-4 sm:px-5 lg:border-b-0">
              <k.I className="h-4 w-4 text-white/40" />
              <p className="mt-2 text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-white">{l ? k.deger : "…"}</p>
              <p className="text-[12px] text-white/45">{k.ad}</p>
            </div>
          ))}
        </div>
      </Kart>
      {l && l.length > 0 && <BildirimKutusu sinir={5} />}
      <Kart ikon={FolderOpen} baslik="Projeler" alt={l ? `${l.length} proje · bir projeye tıkla, bulut konsolu açılsın` : "Yükleniyor"}>
        {l === null ? <div className="h-40 animate-pulse" /> : !l.length ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <p className="text-[14px] text-white/60">Henüz proje yok. Bir site ya da uygulama yap; yayın, veri ve kimlik burada görünsün.</p>
            <Link href="/panel/build" className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Proje başlat</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            <div className="hidden grid-cols-[1fr_150px_120px_90px_80px_90px_24px] gap-4 px-5 py-2 text-[11.5px] font-medium text-white/40 lg:grid">
              <span>Proje</span><span>Durum</span><span>İstek, 7 gün</span><span className="text-right">Ziyaretçi</span><span className="text-right">Kayıt</span><span className="text-right">Depolama</span><span />
            </div>
            {l.map((x) => {
              const adres = yayinAdresi(x.altAlan);
              const alan = x.alanAdlari.find((a) => a.birincil && a.durum === "bagli")?.ad;
              return (
                <Link key={x.id} href={`/panel/build/bulut/${x.id}`} className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 hover:bg-white/[0.02] sm:px-5 lg:grid-cols-[1fr_150px_120px_90px_80px_90px_24px]">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-[9px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">
                      {x.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.kapak} alt="" className="h-full w-full object-cover object-top" />}
                    </span>
                    <span className="min-w-0"><span className="block truncate text-[14px] font-semibold text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/45">{alan ?? adres.gorunen}{x.hata ? <span className="text-rose-300"> · {x.hata} hata</span> : ""}</span></span>
                  </span>
                  <span className="lg:hidden"><Durum o={x} /></span>
                  <span className="hidden lg:block"><Durum o={x} /></span>
                  <span className="hidden items-center gap-2 lg:flex"><MiniCubuk l={x.gunler} /><span className="text-[12.5px] tabular-nums text-white/60">{sayi(x.istek)}</span></span>
                  <span className="hidden text-right text-[13px] tabular-nums text-white/70 lg:block">{sayi(x.ziyaretci)}</span>
                  <span className="hidden text-right text-[13px] tabular-nums text-white/70 lg:block">{sayi(x.kayit)}</span>
                  <span className="hidden text-right text-[13px] tabular-nums text-white/70 lg:block">{boyutYaz(x.depolama)}</span>
                  <ChevronRight className="hidden h-4 w-4 text-white/30 lg:block" />
                </Link>
              );
            })}
          </div>
        )}
      </Kart>
      <HesapKullanimi />
    </div>
  );
}
