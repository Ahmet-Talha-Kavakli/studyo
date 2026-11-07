"use client";

import { useMemo, useState } from "react";
import { Boxes, Plug, Star } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, AramaKutu, BolumBaslik, Bos, FiltreCip, HataKutusu, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { useAdminVeri, sayi } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Model { slug: string; ad: string; aile: string; saglayici: string; tur: string; turAd: string; kredi: number; bedel: string; oneCikan: boolean; kullanim30: number; adaptor: string; bagli: boolean | null }
interface Rapor { modeller: Model[]; turSayisi: Record<string, number>; toplam: number }

export default function Modeller() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/modeller");
  const [q, setQ] = useState("");
  const [tur, setTur] = useState("hepsi");
  const [bag, setBag] = useState("hepsi");
  const [sira, setSira] = useState<"kullanim" | "kredi" | "ad">("kullanim");
  const l = useMemo(() => {
    if (!r) return [];
    const s = q.trim().toLocaleLowerCase("tr");
    return r.modeller.filter((m) => (tur === "hepsi" || m.turAd === tur) && (bag === "hepsi" || (bag === "bagli" ? m.bagli : !m.bagli))
      && (!s || m.ad.toLocaleLowerCase("tr").includes(s) || m.saglayici.toLocaleLowerCase("tr").includes(s) || m.aile.toLocaleLowerCase("tr").includes(s)))
      .sort((a, b) => sira === "kullanim" ? b.kullanim30 - a.kullanim30 || a.ad.localeCompare(b.ad, "tr") : sira === "kredi" ? b.kredi - a.kredi : a.ad.localeCompare(b.ad, "tr"));
  }, [r, q, tur, bag, sira]);

  return (
    <RotaGuard modul="modeller">
      <BolumBaslik baslik="Modeller" ozet="Stüdyoların sunduğu model kataloğu, kredi bedeli, sağlayıcı bağlantısı ve son 30 günlük kullanım." ikon={Boxes} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={3} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Katalogdaki model" deger={sayi(r.toplam)} ikon={Boxes} alt={Object.entries(r.turSayisi).map(([k, v]) => `${v} ${k.toLocaleLowerCase("tr")}`).join(", ")} />
            <MetrikKart etiket="Sağlayıcısı bağlı" deger={sayi(r.modeller.filter((m) => m.bagli).length)} ikon={Plug} alt="anahtarı tanımlı adaptör" />
            <MetrikKart etiket="Son 30 günde kullanılan" deger={sayi(r.modeller.filter((m) => m.kullanim30 > 0).length)} ikon={Star} alt={`${sayi(r.modeller.reduce((a, m) => a + m.kullanim30, 0))} üretim`} />
            <MetrikKart etiket="Öne çıkan" deger={sayi(r.modeller.filter((m) => m.oneCikan).length)} ikon={Star} />
          </div>
          <div className="mb-3 mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <AramaKutu deger={q} degis={setQ} yer="Model, aile ya da şirket ara" className="lg:w-80" />
            <div className="flex items-center gap-2">
              <label htmlFor="m-sira" className={cn("text-[13px]", AD.metin3)}>Sırala</label>
              <select id="m-sira" value={sira} onChange={(e) => setSira(e.target.value as typeof sira)} className="h-9 rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-3 text-sm text-[color:var(--ad-metin)]">
                <option value="kullanim">Kullanım</option><option value="kredi">Kredi</option><option value="ad">Ad</option>
              </select>
            </div>
          </div>
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
            <FiltreCip aktif={tur === "hepsi"} onClick={() => setTur("hepsi")}>Bütün türler</FiltreCip>
            {Object.keys(r.turSayisi).map((t) => <FiltreCip key={t} aktif={tur === t} onClick={() => setTur(t)}>{t}</FiltreCip>)}
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
            {[["hepsi", "Hepsi"], ["bagli", "Sağlayıcısı bağlı"], ["bagsiz", "Bağlı değil"]].map(([k, a]) => <FiltreCip key={k} aktif={bag === k} onClick={() => setBag(k)}>{a}</FiltreCip>)}
          </div>
          {l.length === 0 ? <Bos ikon={Boxes} baslik="Bu süzgeçle model yok" /> : (
            <BasitTablo baslik={["Model", "Tür", "Şirket", "Bedel", "Bağlantı", "Kullanım, 30 gün"]} sag={[5]} enAz={820}>
              {l.map((m) => (
                <tr key={`${m.tur}-${m.slug}`} className={satirSinif}>
                  <td className={hucre}><div className={cn("flex items-center gap-1.5", AD.metin)}>{m.ad}{m.oneCikan && <Star className="h-3.5 w-3.5 text-amber-300" aria-label="Öne çıkan" />}</div><div className={cn("text-[11px]", AD.metin3)}>{m.aile}</div></td>
                  <td className={cn(hucre, AD.metin2)}>{m.turAd}</td>
                  <td className={cn(hucre, AD.metin2)}>{m.saglayici}</td>
                  <td className={cn(hucre, AD.metin)}>{m.bedel}</td>
                  <td className={hucre}>{m.bagli === null ? <span className={cn("text-[12px]", AD.metin3)}>Bilinmiyor</span> : m.bagli ? <Rozet ton="basari">Bağlı, {m.adaptor}</Rozet> : <Rozet ton="notr">Bağlı değil</Rozet>}</td>
                  <td className={cn(hucre, "text-right tabular-nums", m.kullanim30 ? AD.metin : AD.metin3)}>{sayi(m.kullanim30)}</td>
                </tr>
              ))}
            </BasitTablo>
          )}
          <p className={cn("mt-3 text-[12px]", AD.metin3)}>Kullanım, son 30 günün kredi hareketlerinde model adının geçtiği üretimlerden sayılır. Bağlantı sütunu modelin geçtiği adaptörün anahtarına bakar; bağlı olmayan model kredi düşmeden hata verir.</p>
        </>
      )}
    </RotaGuard>
  );
}
