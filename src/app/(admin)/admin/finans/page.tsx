"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, Receipt, RotateCcw, AlertTriangle, CreditCard, Repeat, Globe } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, Bos, FiltreCip, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Sekmeler, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { CubukGrafik, YatayCubuk } from "@/components/admin/grafik";
import { useAdminVeri, sorgu, para, paraListe, sayi, tarih, tarihSaat, gunEtiket, PLAN_AD } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

type P = Record<string, number>;
interface Siparis { no: string; uid: string; email: string; tur: string; ad: string; durum: string; para: string; toplam: number; tahsil?: number; net: number; kdv: number; saglayici: string; mod: string; olusturma: number; odemeZamani?: number; makbuzNo?: string; kart?: string; taksit?: number; iade?: { tutar: number; zaman: number }; hata?: string; amac?: string; ulke?: string }
interface Abonelik { uid: string; email: string; plan: string; kota: number; donem: string; para: string; durum: string; saglayici: string; mod: string; baslangic: number; donemBitis: number; otomatik: boolean; iptalTarihi?: number; sonOdeme?: { no: string; toplam: number; zaman: number }; ulke?: string }
interface Rapor {
  aralik: { bas: number; bit: number };
  gelir: { brut: P; iade: P; kdv: P; net: P; mrr: P };
  sayilar: { siparis: number; durum: Record<string, number>; deneme: number; odenen: number; etkinAbonelik: number };
  turGelir: Record<string, P>; saglayiciGelir: Record<string, P>;
  seri: { gun: string; tutar: P; adet: number }[];
  paralar: string[];
  ulkeler: { ulke: string; gelir: P; siparis: number; musteri: number }[];
  siparisler: Siparis[]; iadeler: Siparis[]; basarisiz: Siparis[]; makbuzlar: Siparis[]; abonelikler: Abonelik[];
}

const TUR_AD: Record<string, string> = { plan: "Plan", kredi: "Kredi paketi", sinirsiz: "Sınırsız kullanım", hiz: "Hız artırma" };
const DURUM_AD: Record<string, string> = { odendi: "Ödendi", bekliyor: "Bekliyor", basarisiz: "Başarısız", iade: "İade edildi" };
const SAG_AD: Record<string, string> = { stripe: "Stripe", iyzico: "iyzico", deneme: "Deneme ödemesi" };
const AB_DURUM: Record<string, string> = { etkin: "Etkin", odenemedi: "Ödenemedi", iptal: "İptal", bitti: "Bitti" };
const ARALIK = [{ id: "7", ad: "Son 7 gün" }, { id: "30", ad: "Son 30 gün" }, { id: "90", ad: "Son 90 gün" }, { id: "365", ad: "Son 1 yıl" }, { id: "ozel", ad: "Tarih seç" }];
const gunMs = 86_400_000;
const gunBaslangic = (s: string) => new Date(`${s}T00:00:00+03:00`).getTime();

function SiparisTablosu({ l }: { l: Siparis[] }) {
  if (!l.length) return <Bos ikon={Receipt} baslik="Bu aralıkta kayıt yok" />;
  return (
    <BasitTablo baslik={["Sipariş", "Hesap", "Ürün", "Durum", "Tutar", "Sağlayıcı", "Tarih"]} sag={[4]} enAz={900}>
      {l.map((s) => (
        <tr key={s.no} className={satirSinif}>
          <td className={cn(hucre, "font-mono text-[12px]", AD.metin2)}>{s.no}{s.makbuzNo && <div className={cn("font-sans text-[11px]", AD.metin3)}>{s.makbuzNo}</div>}</td>
          <td className={hucre}>{s.uid && s.uid !== "silindi" ? <Link href={`/admin/kullanicilar/${s.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{s.email || s.uid}</Link> : <span className={AD.metin3}>{s.email || "Silinmiş hesap"}</span>}</td>
          <td className={cn(hucre, AD.metin)}>{s.ad}<div className={cn("text-[11px]", AD.metin3)}>{TUR_AD[s.tur] ?? s.tur}{s.amac === "yukseltme" ? ", yükseltme" : s.amac === "yenileme" ? ", yenileme" : ""}</div></td>
          <td className={hucre}><Rozet ton={s.durum === "odendi" ? "basari" : s.durum === "basarisiz" ? "tehlike" : s.durum === "iade" ? "mor" : "notr"}>{DURUM_AD[s.durum] ?? s.durum}</Rozet>{s.hata && <div className="mt-0.5 max-w-[220px] truncate text-[11px] text-rose-300" title={s.hata}>{s.hata}</div>}</td>
          <td className={cn(hucre, "whitespace-nowrap text-right tabular-nums", AD.metin)}>{para(s.tahsil ?? s.toplam, s.para)}<div className={cn("text-[11px]", AD.metin3)}>KDV {para(s.kdv, s.para)}</div>{s.iade && <div className="text-[11px] text-violet-300">iade {para(s.iade.tutar, s.para)}</div>}{s.ulke && s.ulke !== "Bilinmiyor" && <div className={cn("text-[11px]", AD.metin3)}>{s.ulke}</div>}</td>
          <td className={cn(hucre, AD.metin2)}>{SAG_AD[s.saglayici] ?? s.saglayici}{s.mod === "test" && s.saglayici !== "deneme" ? ", test" : ""}{s.taksit && s.taksit > 1 ? `, ${s.taksit} taksit` : ""}{s.kart ? <div className={cn("text-[11px]", AD.metin3)}>{s.kart}</div> : null}</td>
          <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(s.odemeZamani ?? s.olusturma)}</td>
        </tr>
      ))}
    </BasitTablo>
  );
}

export default function Finans() {
  const [aralik, setAralik] = useState("30");
  const bugun = new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);
  const [bas, setBas] = useState(new Date(Date.now() - 30 * gunMs + 3 * 3_600_000).toISOString().slice(0, 10));
  const [bit, setBit] = useState(bugun);
  const [deneme, setDeneme] = useState(false);
  const [sekme, setSekme] = useState("ozet");

  const yol = useMemo(() => {
    if (aralik === "ozel") return sorgu("/api/admin/finans", { bas: gunBaslangic(bas), bit: gunBaslangic(bit) + gunMs - 1, deneme: deneme ? "1" : "" });
    const simdi = Date.now();
    return sorgu("/api/admin/finans", { bas: simdi - Number(aralik) * gunMs, bit: simdi, deneme: deneme ? "1" : "" });
  }, [aralik, bas, bit, deneme]);
  const { veri: r, hata, yenile, yukleniyor } = useAdminVeri<Rapor>(yol);
  const ana = r?.paralar[0] ?? null;
  const [secPara, setGrafikPara] = useState<string | null>(null);
  const grafikPara = secPara && r?.paralar.includes(secPara) ? secPara : ana;
  const digerleri = (m: P) => Object.fromEntries(Object.entries(m).filter(([p]) => p !== ana));

  return (
    <RotaGuard modul="finans">
      <BolumBaslik baslik="Finans" ozet="Ödeme sağlayıcılarından gelen gerçek siparişler. Her para birimi ayrı toplanır, birbirine çevrilmez." ikon={Wallet} />
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
          {ARALIK.map((a) => <FiltreCip key={a.id} aktif={aralik === a.id} onClick={() => setAralik(a.id)}>{a.ad}</FiltreCip>)}
          <FiltreCip aktif={deneme} onClick={() => setDeneme((d) => !d)}>Deneme ödemelerini kat</FiltreCip>
        </div>
        {aralik === "ozel" && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <label className={AD.metin3} htmlFor="f-bas">Başlangıç</label>
            <input id="f-bas" type="date" value={bas} max={bit} onChange={(e) => setBas(e.target.value)} className="h-9 rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-3 text-[color:var(--ad-metin)] [color-scheme:dark]" />
            <label className={AD.metin3} htmlFor="f-bit">Bitiş</label>
            <input id="f-bit" type="date" value={bit} min={bas} max={bugun} onChange={(e) => setBit(e.target.value)} className="h-9 rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-3 text-[color:var(--ad-metin)] [color-scheme:dark]" />
          </div>
        )}
      </div>

      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <div className={cn("transition-opacity", yukleniyor && "opacity-60")}>
          <p className={cn("mb-3 text-[13px]", AD.metin3)}>{tarih(r.aralik.bas)} ile {tarih(r.aralik.bit)} arası{r.sayilar.deneme ? `, ${sayi(r.sayilar.deneme)} deneme ödemesi ${deneme ? "dahil" : "hariç"}` : ""}</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Brüt gelir" deger={ana ? para(r.gelir.brut[ana] ?? 0, ana) : "Henüz yok"} ikon={Wallet} alt={r.paralar.length > 1 ? `ayrıca ${paraListe(digerleri(r.gelir.brut))}` : ana ? `vergi ${para(r.gelir.kdv[ana] ?? 0, ana)}` : "ödenmiş sipariş yok"} />
            <MetrikKart etiket="Net gelir, vergi hariç" deger={ana ? para(r.gelir.net[ana] ?? 0, ana) : "Henüz yok"} ikon={Wallet} alt={r.paralar.length > 1 ? `ayrıca ${paraListe(digerleri(r.gelir.net))}` : `${sayi(r.sayilar.odenen)} ödenmiş sipariş`} />
            <MetrikKart etiket="İadeler" deger={paraListe(r.gelir.iade, r.paralar)} ikon={RotateCcw} alt={`${sayi(r.iadeler.length)} sipariş`} />
            <MetrikKart etiket="Aylık yinelenen gelir" deger={paraListe(r.gelir.mrr, r.paralar)} ikon={Repeat} alt={`${sayi(r.sayilar.etkinAbonelik)} etkin abonelik`} />
          </div>

          <div className="my-4"><Sekmeler aktif={sekme} sec={setSekme} sekmeler={[
            { id: "ozet", ad: "Özet" }, { id: "ulke", ad: "Ülkeler", sayi: r.ulkeler.length }, { id: "siparis", ad: "Siparişler", sayi: r.siparisler.length }, { id: "abonelik", ad: "Abonelikler", sayi: r.abonelikler.length },
            { id: "iade", ad: "İadeler", sayi: r.iadeler.length }, { id: "basarisiz", ad: "Başarısız", sayi: r.basarisiz.length }, { id: "makbuz", ad: "Makbuzlar", sayi: r.makbuzlar.length },
          ]} /></div>

          {sekme === "ozet" && (
            <div className="grid gap-4 lg:grid-cols-3">
              <Kart className="lg:col-span-2">
                <KartBaslik ikon={Wallet} sag={r.paralar.length > 1 ? <div className="flex gap-1.5">{r.paralar.map((p) => <FiltreCip key={p} aktif={grafikPara === p} onClick={() => setGrafikPara(p)}>{p}</FiltreCip>)}</div> : undefined}>Günlük tahsilat{grafikPara ? `, ${grafikPara}` : ""}</KartBaslik>
                {grafikPara && r.seri.some((g) => (g.tutar[grafikPara] ?? 0) > 0)
                  ? <CubukGrafik veri={r.seri.slice(-60).map((g) => ({ etiket: gunEtiket(g.gun), deger: Math.round((g.tutar[grafikPara] ?? 0) / 100) }))} yukseklik={180} />
                  : <Bos baslik="Bu aralıkta tahsilat yok" />}
              </Kart>
              <div className="space-y-4">
                <Kart>
                  <KartBaslik>Ürün türüne göre</KartBaslik>
                  {Object.keys(r.turGelir).length ? <YatayCubuk veri={Object.entries(r.turGelir).map(([k, v]) => ({ etiket: TUR_AD[k] ?? k, deger: Math.round((ana ? v[ana] ?? 0 : 0) / 100), alt: paraListe(v, r.paralar) }))} /> : <p className={cn("text-sm", AD.metin3)}>Henüz veri yok.</p>}
                </Kart>
                <Kart>
                  <KartBaslik>Sipariş durumları</KartBaslik>
                  {Object.keys(r.sayilar.durum).length ? Object.entries(r.sayilar.durum).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1.5 text-[13px]"><span className={AD.metin2}>{DURUM_AD[k] ?? k}</span><span className={cn("tabular-nums", AD.metin)}>{sayi(v)}</span></div>
                  )) : <p className={cn("text-sm", AD.metin3)}>Henüz veri yok.</p>}
                  {Object.keys(r.saglayiciGelir).length > 0 && (
                    <div className="mt-2 border-t border-[color:var(--ad-kenar)] pt-2">
                      {Object.entries(r.saglayiciGelir).map(([k, v]) => <div key={k} className="flex items-center justify-between py-1 text-[13px]"><span className={AD.metin2}>{SAG_AD[k] ?? k}</span><span className={cn("text-right tabular-nums", AD.metin)}>{paraListe(v, r.paralar)}</span></div>)}
                    </div>
                  )}
                </Kart>
              </div>
            </div>
          )}
          {sekme === "ulke" && (r.ulkeler.length === 0 ? <Bos ikon={Globe} baslik="Bu aralıkta ödenmiş sipariş yok" /> : (
            <BasitTablo baslik={["Ülke", "Sipariş", "Müşteri", "Gelir"]} sag={[1, 2, 3]} enAz={520}>
              {r.ulkeler.map((u) => (
                <tr key={u.ulke} className={satirSinif}>
                  <td className={cn(hucre, AD.metin)}>{u.ulke}</td>
                  <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(u.siparis)}</td>
                  <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{sayi(u.musteri)}</td>
                  <td className={cn(hucre, "text-right tabular-nums", AD.metin)}>{paraListe(u.gelir, r.paralar)}</td>
                </tr>
              ))}
            </BasitTablo>
          ))}
          {sekme === "siparis" && <SiparisTablosu l={r.siparisler} />}
          {sekme === "iade" && <SiparisTablosu l={r.iadeler} />}
          {sekme === "basarisiz" && <SiparisTablosu l={r.basarisiz} />}
          {sekme === "makbuz" && <SiparisTablosu l={r.makbuzlar} />}
          {sekme === "abonelik" && (r.abonelikler.length === 0 ? <Bos ikon={CreditCard} baslik="Henüz abonelik yok" /> : (
            <BasitTablo baslik={["Hesap", "Plan", "Durum", "Dönem", "Son ödeme", "Sağlayıcı", "Dönem sonu"]} enAz={860}>
              {r.abonelikler.map((a) => (
                <tr key={a.uid} className={satirSinif}>
                  <td className={hucre}><Link href={`/admin/kullanicilar/${a.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{a.email || a.uid}</Link></td>
                  <td className={cn(hucre, AD.metin)}>{PLAN_AD[a.plan] ?? a.plan}<div className={cn("text-[11px]", AD.metin3)}>{sayi(a.kota)} kredi</div></td>
                  <td className={hucre}><Rozet ton={a.durum === "etkin" ? "basari" : a.durum === "odenemedi" ? "tehlike" : "notr"}>{AB_DURUM[a.durum] ?? a.durum}</Rozet>{a.iptalTarihi && <div className="mt-0.5 text-[11px] text-amber-300">iptal {tarih(a.iptalTarihi)}</div>}</td>
                  <td className={cn(hucre, AD.metin2)}>{a.donem === "yillik" ? "Yıllık" : "Aylık"}, {a.otomatik ? "otomatik" : "elle yenileme"}</td>
                  <td className={cn(hucre, "whitespace-nowrap", AD.metin)}>{a.sonOdeme ? para(a.sonOdeme.toplam, a.para) : "Yok"}</td>
                  <td className={cn(hucre, AD.metin2)}>{SAG_AD[a.saglayici] ?? a.saglayici}{a.mod === "test" && a.saglayici !== "deneme" ? ", test" : ""}</td>
                  <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarih(a.donemBitis)}</td>
                </tr>
              ))}
            </BasitTablo>
          ))}
          {r.sayilar.siparis === 0 && sekme === "ozet" && (
            <p className={cn("mt-4 flex items-center gap-2 text-[13px]", AD.metin3)}><AlertTriangle className="h-4 w-4" /> Bu aralıkta sipariş yok. Ödeme sağlayıcılarının durumu için Yayın hazırlığı sayfasına bak.</p>
          )}
        </div>
      )}
    </RotaGuard>
  );
}
