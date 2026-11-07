"use client";

import { useState } from "react";
import { Server, Cpu, HardDrive, MemoryStick, Timer, RotateCw, FolderTree } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BilgiSatir, BolumBaslik, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { useAdminVeri, sorgu, bayt, sayi, sure, gorece, tarihSaat } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Rapor {
  surec: { node: string; platform: string; mimari: string; pid: number; mod: string; calismaSn: number; izlemeBaslangic: number; bellek: { rss: number; heapKullanilan: number; heapToplam: number; harici: number }; sistemBellek: { bos: number; toplam: number }; cpu: number; yuk: number[] };
  disk: { bos: number; toplam: number } | null;
  depo: { hesap: number | null; hesaplaniyor: boolean; klasorler: { ad: string; etiket: string; bayt: number; dosya: number; tam: boolean }[] };
  zamanlayicilar: { id: string; ad: string; aciklama: string; aralikSn: number; kurulu: boolean; izlenebilir: boolean; damga: { son: number; sure: number; sayac: number; hata?: string; hataZamani?: number } | null }[];
}

export default function Sistem() {
  const [yenileSay, setYenileSay] = useState(0);
  const { veri: r, hata, yenile, yukleniyor } = useAdminVeri<Rapor>(sorgu("/api/admin/sistem", { yenile: yenileSay ? "1" : "", n: yenileSay || "" }), 15_000);
  const yuzdeBar = (a: number, b: number) => (b ? Math.min(100, Math.round((a / b) * 100)) : 0);
  return (
    <RotaGuard modul="sistem">
      <BolumBaslik baslik="Sistem" ozet="Sunucu süreci, bellek, disk, veri klasörü ve arka plan zamanlayıcıları. 15 saniyede bir yenilenir." ikon={Server} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Çalışma süresi" deger={sure(r.surec.calismaSn * 1000)} ikon={Timer} alt={`${r.surec.mod === "production" ? "üretim" : "geliştirme"} modu, süreç ${r.surec.pid}`} />
            <MetrikKart etiket="Süreç belleği" deger={bayt(r.surec.bellek.rss)} ikon={MemoryStick} alt={`yığın ${bayt(r.surec.bellek.heapKullanilan)}, toplam ${bayt(r.surec.bellek.heapToplam)}`} />
            <MetrikKart etiket="İşlemci yükü" deger={r.surec.yuk[0] ? r.surec.yuk[0].toFixed(2).replace(".", ",") : "Yok"} ikon={Cpu} alt={`${r.surec.cpu} çekirdek${r.surec.yuk[0] ? "" : ", Windows yük bildirmez"}`} />
            <MetrikKart etiket="Disk boş alan" deger={r.disk ? bayt(r.disk.bos) : "Bilinmiyor"} ikon={HardDrive} alt={r.disk ? `toplam ${bayt(r.disk.toplam)}` : "statfs desteklenmiyor"} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart>
              <KartBaslik ikon={Server}>Sunucu</KartBaslik>
              <BilgiSatir etiket="Node.js">{r.surec.node}</BilgiSatir>
              <BilgiSatir etiket="Platform">{r.surec.platform}, {r.surec.mimari}</BilgiSatir>
              <BilgiSatir etiket="Sistem belleği">{bayt(r.surec.sistemBellek.toplam - r.surec.sistemBellek.bos)} kullanılıyor, toplam {bayt(r.surec.sistemBellek.toplam)}</BilgiSatir>
              <BilgiSatir etiket="Yük ortalaması">{r.surec.yuk.map((x) => x.toFixed(2).replace(".", ",")).join(", ")}</BilgiSatir>
              {r.disk && (
                <div className="mt-3">
                  <div className={cn("mb-1 flex justify-between text-[12px]", AD.metin3)}><span>Disk doluluğu</span><span>yüzde {yuzdeBar(r.disk.toplam - r.disk.bos, r.disk.toplam)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full" style={{ width: `${yuzdeBar(r.disk.toplam - r.disk.bos, r.disk.toplam)}%`, background: yuzdeBar(r.disk.toplam - r.disk.bos, r.disk.toplam) > 90 ? "var(--ad-tehlike)" : "var(--ad-aksan)" }} /></div>
                </div>
              )}
            </Kart>
            <Kart className="lg:col-span-2">
              <KartBaslik ikon={Timer}>Arka plan zamanlayıcıları</KartBaslik>
              {r.zamanlayicilar.map((z) => {
                const d = z.damga;
                const gec = d && Date.now() - d.son > Math.max(3 * z.aralikSn * 1000, 5 * 60_000);
                return (
                  <div key={z.id} className="flex items-start justify-between gap-3 border-b border-[color:var(--ad-kenar)] py-2 text-[13px] last:border-0">
                    <div className="min-w-0">
                      <div className={AD.metin}>{z.ad}</div>
                      <div className={cn("text-[11px]", AD.metin3)}>{z.aciklama} Aralık {z.aralikSn >= 60 ? `${z.aralikSn / 60} dakika` : `${z.aralikSn} saniye`}.</div>
                      {d?.hata && d.hataZamani === d.son && <div className="text-[11px] text-rose-300">Son hata: {d.hata}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      <Rozet ton={!z.kurulu ? "tehlike" : gec || (d?.hata && d.hataZamani === d.son) ? "uyari" : "basari"}>{!z.kurulu ? "Başlatılmamış" : !z.izlenebilir ? "Çalışıyor" : d ? (gec ? "Gecikti" : "Çalışıyor") : "Bekleniyor"}</Rozet>
                      <div className={cn("mt-0.5 text-[11px]", AD.metin3)}>{d ? `${gorece(d.son)}, ${sayi(d.sayac)} tur` : z.izlenebilir ? "Henüz tur görülmedi" : "Son tur kaydedilmiyor"}</div>
                    </div>
                  </div>
                );
              })}
            </Kart>
          </div>

          <div className="mb-3 mt-6 flex items-center justify-between gap-3">
            <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><FolderTree className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Veri klasörü</h3>
            <button onClick={() => setYenileSay((x) => x + 1)} disabled={yukleniyor} className="ad-btn-glass inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold disabled:opacity-50"><RotateCw className={cn("h-3.5 w-3.5", yukleniyor && "animate-spin")} /> Boyutları yeniden hesapla</button>
          </div>
          {r.depo.klasorler.length === 0 ? <Kart><p className={cn("text-sm", AD.metin3)}>{r.depo.hesaplaniyor ? "Klasör boyutları arka planda hesaplanıyor; birkaç saniye sonra sayfa kendiliğinden yenilenir." : "Veri klasörü boş."}</p></Kart> : (
          <BasitTablo baslik={["Klasör", "Boyut", "Dosya"]} sag={[1, 2]} enAz={460}>
            {r.depo.klasorler.map((k) => (
              <tr key={k.ad} className={satirSinif}>
                <td className={hucre}><div className={AD.metin}>{k.etiket}</div><div className={cn("font-mono text-[11px]", AD.metin3)}>{k.ad}</div></td>
                <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{bayt(k.bayt)}{!k.tam && <span className={cn("text-[11px]", AD.metin3)}> en az</span>}</td>
                <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(k.dosya)}</td>
              </tr>
            ))}
          </BasitTablo>
          )}
          {r.depo.hesap && <p className={cn("mt-3 text-[12px]", AD.metin3)}>Klasör boyutları {tarihSaat(r.depo.hesap)} tarihinde hesaplandı{r.depo.hesaplaniyor ? ", yenisi hesaplanıyor" : ""}; on dakikada bir kendiliğinden yenilenir. Dosya sayısı klasör başına 40.000 ile sınırlıdır.</p>}
        </>
      )}
    </RotaGuard>
  );
}
