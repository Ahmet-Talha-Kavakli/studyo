"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ListChecks, Clock, AlertTriangle, CheckCircle2, Loader2, Coins } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, AramaKutu, BolumBaslik, Bos, FiltreCip, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, SayfaGezgini, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { CubukGrafik } from "@/components/admin/grafik";
import { useAdminVeri, sorgu, sayi, sure, tarihSaat, yuzde } from "@/lib/admin/istemci";
import { JOB_DURUM, JOB_TUR } from "@/lib/admin/isEtiket";
import { cn } from "@/lib/utils";

interface JobSatiri { id: string; tur: string; ad: string; kaynak: string; durum: string; zaman: number; sure?: number; kredi: number; uid?: string; email?: string; ayrinti?: string }
interface Liste {
  satirlar: JobSatiri[]; toplam: number; sayfa: number; sayfaSayisi: number;
  ozet: { toplam: number; gun1: number; gun7: number; basari24: number | null; basari7: number | null; suruyor: number; bekliyor: number; hata24: number; kredi7: number; turler: Record<string, number>; medyanSure: number | null };
  kaynakDagilim: { kaynak: string; etiket: string; adet: number; kredi: number; hata: number }[];
  saatlik: { saat: number; adet: number }[];
}

const GUNLER = [{ id: "0", ad: "Tümü" }, { id: "1", ad: "Son 24 saat" }, { id: "7", ad: "Son 7 gün" }, { id: "30", ad: "Son 30 gün" }];

function Icerik() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [gq, setGq] = useState(q);
  const tur = sp.get("tur") ?? "hepsi", durum = sp.get("durum") ?? "hepsi", gun = sp.get("gun") ?? "0", sayfa = Number(sp.get("sayfa") ?? 1) || 1;
  useEffect(() => { const t = setTimeout(() => setGq(q), 300); return () => clearTimeout(t); }, [q]);
  const git = (p: Record<string, string | number>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(p)) { if (v === "" || v === "hepsi" || (k === "gun" && v === "0") || (k === "sayfa" && v === 1)) u.delete(k); else u.set(k, String(v)); }
    router.replace(`/admin/joblar${u.toString() ? `?${u}` : ""}`, { scroll: false });
  };
  useEffect(() => { if ((sp.get("q") ?? "") !== gq) git({ q: gq, sayfa: 1 }); }, [gq]); // eslint-disable-line react-hooks/exhaustive-deps
  const { veri: v, hata, yenile, yukleniyor } = useAdminVeri<Liste>(sorgu("/api/admin/joblar", { q: gq, tur, durum, gun, sayfa, boyut: 30 }), 30_000);

  return (
    <RotaGuard modul="joblar">
      <BolumBaslik baslik="İşler" ozet="Stüdyo ve API üretimleri kredi defterinden; Build ajan ve sistem çalışmaları kendi kayıtlarından." ikon={ListChecks} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!v && !hata && <Yukleniyor satir={4} />}
      {v && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Son 24 saat" deger={sayi(v.ozet.gun1)} ikon={ListChecks} alt={`son 7 gün ${sayi(v.ozet.gun7)}`} />
            <MetrikKart etiket="Başarı, son 24 saat" deger={v.ozet.basari24 === null ? "Yok" : yuzde(v.ozet.basari24)} ikon={CheckCircle2} alt={`son 7 gün ${v.ozet.basari7 === null ? "yok" : yuzde(v.ozet.basari7)}`} />
            <MetrikKart etiket="Hatalı, son 24 saat" deger={sayi(v.ozet.hata24)} ikon={AlertTriangle} alt="iade edilen ya da hatayla biten" />
            <MetrikKart etiket="Süren" deger={sayi(v.ozet.suruyor)} ikon={Loader2} alt={`${sayi(v.ozet.bekliyor)} iş sonuç bekliyor`} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <KartBaslik ikon={Clock}>Saatlik iş, son 24 saat</KartBaslik>
              {v.saatlik.some((s) => s.adet) ? <CubukGrafik veri={v.saatlik.map((s, i) => ({ etiket: i === 23 ? "şimdi" : `${23 - i} sa`, deger: s.adet }))} yukseklik={140} /> : <Bos baslik="Son 24 saatte iş yok" />}
            </Kart>
            <Kart>
              <KartBaslik ikon={Coins}>Kaynağa göre, son 7 gün</KartBaslik>
              {v.kaynakDagilim.length === 0 ? <p className={cn("text-sm", AD.metin3)}>Henüz veri yok.</p> : (
                <div className="space-y-2">
                  {v.kaynakDagilim.slice(0, 8).map((k) => (
                    <div key={k.kaynak} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className={cn("truncate", AD.metin2)}>{k.etiket}</span>
                      <span className={cn("shrink-0 tabular-nums", AD.metin)}>{sayi(k.adet)} iş{k.hata ? <span className="text-rose-300">, {sayi(k.hata)} hata</span> : null}</span>
                    </div>
                  ))}
                </div>
              )}
            </Kart>
          </div>

          <div className="mb-3 mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <AramaKutu deger={q} degis={setQ} yer="İş, e-posta ya da kaynak ara" className="lg:w-80" />
            <div className="flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">{GUNLER.map((g) => <FiltreCip key={g.id} aktif={gun === g.id} onClick={() => git({ gun: g.id, sayfa: 1 })}>{g.ad}</FiltreCip>)}</div>
          </div>
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
            <FiltreCip aktif={tur === "hepsi"} onClick={() => git({ tur: "hepsi", sayfa: 1 })}>Bütün türler</FiltreCip>
            {Object.entries(JOB_TUR).map(([k, a]) => <FiltreCip key={k} aktif={tur === k} onClick={() => git({ tur: k, sayfa: 1 })}>{a} ({sayi(v.ozet.turler[k] ?? 0)})</FiltreCip>)}
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
            <FiltreCip aktif={durum === "hepsi"} onClick={() => git({ durum: "hepsi", sayfa: 1 })}>Bütün durumlar</FiltreCip>
            {Object.entries(JOB_DURUM).map(([k, d]) => <FiltreCip key={k} aktif={durum === k} onClick={() => git({ durum: k, sayfa: 1 })}>{d.ad}</FiltreCip>)}
          </div>

          {v.satirlar.length === 0 ? <Bos ikon={ListChecks} baslik={v.ozet.toplam ? "Bu süzgeçle iş yok" : "Henüz iş yok"} ozet={v.ozet.toplam ? "Süzgeçleri değiştir." : "Stüdyolarda kredi harcayan ilk üretimde ya da ilk Build çalışmasında burada görünür."} /> : (
            <div className={cn("transition-opacity", yukleniyor && "opacity-60")}>
              <BasitTablo baslik={["İş", "Tür", "Hesap", "Durum", "Kredi", "Süre", "Zaman"]} sag={[4]} enAz={900}
                alt={<SayfaGezgini sayfa={v.sayfa} sayfaSayisi={v.sayfaSayisi} toplam={v.toplam} birim="iş" git={(s) => git({ sayfa: s })} />}>
                {v.satirlar.map((j) => (
                  <tr key={j.id} className={cn(satirSinif, "cursor-pointer hover:bg-white/[0.03]")} onClick={() => router.push(`/admin/joblar/${encodeURIComponent(j.id)}`)}>
                    <td className={hucre}><div className={cn("max-w-[280px] truncate", AD.metin)} title={j.ad}>{j.ad}</div><div className={cn("max-w-[280px] truncate text-[11px]", AD.metin3)}>{j.kaynak}</div></td>
                    <td className={cn(hucre, AD.metin2)}>{JOB_TUR[j.tur] ?? j.tur}</td>
                    <td className={hucre} onClick={(e) => e.stopPropagation()}>{j.uid ? <Link href={`/admin/kullanicilar/${j.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{j.email}</Link> : <span className={AD.metin3}>Bilinmiyor</span>}</td>
                    <td className={hucre}><Rozet ton={JOB_DURUM[j.durum]?.ton ?? "notr"}>{JOB_DURUM[j.durum]?.ad ?? j.durum}</Rozet></td>
                    <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{sayi(j.kredi)}</td>
                    <td className={cn(hucre, AD.metin2)}>{j.sure !== undefined ? sure(j.sure) : "Yok"}</td>
                    <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(j.zaman)}</td>
                  </tr>
                ))}
              </BasitTablo>
            </div>
          )}
          <p className={cn("mt-3 text-[12px]", AD.metin3)}>Stüdyo işlerinde süre yalnız hata ve iade durumunda bilinir. Kredi düşmeyen örnek üretimler deftere yazılmadığı için burada görünmez.</p>
        </>
      )}
    </RotaGuard>
  );
}

export default function Joblar() {
  return <Suspense fallback={<Yukleniyor satir={4} />}><Icerik /></Suspense>;
}
