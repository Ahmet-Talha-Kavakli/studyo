"use client";

import Link from "next/link";
import { Users, Wallet, ListChecks, CreditCard, UserPlus, Activity, Coins, Rocket, ShieldCheck, ArrowRight, Flame } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { MetrikKart, BolumBaslik, Kart, KartBaslik, AD, Bos, HataKutusu, Yukleniyor, Rozet } from "@/components/admin/ui/temel";
import { AlanGrafik, DonutGrafik } from "@/components/admin/grafik";
import { useAdminVeri, para, paraListe, sayi, yuzde, gorece, gunEtiket, PLAN_AD, PLAN_RENK } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Pano {
  kullanici: { toplam: number; yeni30: number; yeni7: number; aktif7: number; dogrulanmis: number; askida: number; admin: number };
  gelir: { gun30: Record<string, number>; onceki30: Record<string, number>; etkinAbone: number; paralar: string[] };
  is: { gun1: number; hata24: number; basari24: number | null; suruyor: number; gun30: number };
  kredi: { toplamBakiye: number };
  planlar: Record<string, number>;
  seri: { gun: string; tutar: Record<string, number>; kayit: number; uretim: number }[];
  harcayan: { uid: string; ad: string; email: string; kredi: number }[];
  akis: { tur: "kayit" | "odeme" | "job" | "yonetim"; zaman: number; metin: string; alt: string; href?: string }[];
}
interface Yayin { genel: "hazir" | "uyari" | "eksik"; sayi: { hazir: number; uyari: number; eksik: number } }

const AKIS = { kayit: { ikon: UserPlus, renk: "var(--ad-mor)" }, odeme: { ikon: CreditCard, renk: "var(--ad-basari)" }, job: { ikon: ListChecks, renk: "var(--ad-aksan)" }, yonetim: { ikon: ShieldCheck, renk: "var(--ad-uyari)" } } as const;

function degisim(simdi: number, once: number): number | undefined {
  if (!once) return undefined;
  return ((simdi - once) / once) * 100;
}

export default function GenelBakis() {
  const { veri: p, hata, yenile } = useAdminVeri<Pano>("/api/admin/pano", 60_000);
  const { veri: y } = useAdminVeri<Yayin>("/api/admin/yayin");
  const etiket = (l: { gun: string }[]) => l.map((g, i) => (i % 7 === 0 || i === l.length - 1 ? gunEtiket(g.gun) : ""));

  return (
    <RotaGuard modul="genel">
      <BolumBaslik baslik="Genel bakış" ozet="Hesaplar, gelir ve üretim işleri; depodaki gerçek kayıtlardan."
        sag={y && (
          <Link href="/admin/yayin" className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--ad-kenar)] px-3 py-2 text-[13px] hover:bg-white/[0.04]">
            <Rocket className="h-4 w-4 text-[color:var(--ad-aksan)]" />
            <span className={AD.metin2}>Yayın hazırlığı</span>
            <Rozet ton={y.genel === "hazir" ? "basari" : y.genel === "uyari" ? "uyari" : "tehlike"}>{y.genel === "hazir" ? "Hazır" : y.genel === "uyari" ? `${y.sayi.uyari} uyarı` : `${y.sayi.eksik} eksik`}</Rozet>
          </Link>
        )} />

      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!p && !hata && <Yukleniyor satir={4} />}
      {p && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Toplam hesap" deger="" sayacHedef={p.kullanici.toplam} ikon={Users} alt={`son 7 günde ${sayi(p.kullanici.yeni7)} yeni`} />
            <MetrikKart etiket="Son 7 günde aktif" deger="" sayacHedef={p.kullanici.aktif7} ikon={Activity} alt={`${sayi(p.kullanici.dogrulanmis)} hesap doğrulanmış`} />
            <MetrikKart etiket="Gelir, son 30 gün" deger={p.gelir.paralar[0] ? para(p.gelir.gun30[p.gelir.paralar[0]], p.gelir.paralar[0]) : "Henüz yok"} ikon={Wallet} delta={p.gelir.paralar[0] ? degisim(p.gelir.gun30[p.gelir.paralar[0]], p.gelir.onceki30[p.gelir.paralar[0]] ?? 0) : undefined} alt={p.gelir.paralar.length > 1 ? `ayrıca ${paraListe(Object.fromEntries(p.gelir.paralar.slice(1).map((x) => [x, p.gelir.gun30[x]])))}` : p.gelir.paralar.length ? "tek para birimi" : "ödenmiş sipariş yok"} />
            <MetrikKart etiket="Etkin abonelik" deger="" sayacHedef={p.gelir.etkinAbone} ikon={CreditCard} alt="deneme ödemeleri hariç" />
            <MetrikKart etiket="İşler, son 24 saat" deger="" sayacHedef={p.is.gun1} ikon={ListChecks} alt={p.is.basari24 === null ? "sonuçlanan iş yok" : `başarı ${yuzde(p.is.basari24)}`} />
            <MetrikKart etiket="Hatalı iş, son 24 saat" deger="" sayacHedef={p.is.hata24} ikon={Flame} alt={`${sayi(p.is.suruyor)} iş sürüyor`} />
            <MetrikKart etiket="Dolaşımdaki kredi" deger="" sayacHedef={p.kredi.toplamBakiye} ikon={Coins} alt="bütün hesapların bakiyesi" />
            <MetrikKart etiket="Askıdaki hesap" deger="" sayacHedef={p.kullanici.askida} ikon={ShieldCheck} alt={`${sayi(p.kullanici.admin)} yönetici`} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <KartBaslik ikon={Wallet}>Günlük gelir, son 30 gün{p.gelir.paralar[0] ? ` (${p.gelir.paralar[0]})` : ""}</KartBaslik>
              {p.gelir.paralar[0] && p.seri.some((g) => (g.tutar[p.gelir.paralar[0]] ?? 0) > 0)
                ? <>
                    <AlanGrafik veri={p.seri.map((g) => (g.tutar[p.gelir.paralar[0]] ?? 0) / 100)} etiketler={etiket(p.seri)} yukseklik={170} />
                    {p.gelir.paralar.length > 1 && <p className={cn("mt-2 text-[12px]", AD.metin3)}>Diğer para birimleri: {paraListe(Object.fromEntries(p.gelir.paralar.slice(1).map((x) => [x, p.gelir.gun30[x]])))}. Para birimleri birbirine çevrilmez; ayrıntı Finans sayfasında.</p>}
                  </>
                : <Bos baslik="Henüz gelir yok" ozet="Son 30 günde ödenmiş sipariş bulunmuyor. Deneme ödemeleri sayılmaz." />}
              <div className="mt-4 grid gap-4 border-t border-[color:var(--ad-kenar)] pt-4 sm:grid-cols-2">
                <div>
                  <p className={cn("mb-2 text-[12px]", AD.metin3)}>Günlük kayıt</p>
                  {p.seri.some((g) => g.kayit > 0) ? <AlanGrafik veri={p.seri.map((g) => g.kayit)} renk="#a78bfa" yukseklik={80} /> : <p className={cn("text-[13px]", AD.metin3)}>Son 30 günde kayıt yok.</p>}
                </div>
                <div>
                  <p className={cn("mb-2 text-[12px]", AD.metin3)}>Günlük iş</p>
                  {p.seri.some((g) => g.uretim > 0) ? <AlanGrafik veri={p.seri.map((g) => g.uretim)} renk="#34d399" yukseklik={80} /> : <p className={cn("text-[13px]", AD.metin3)}>Son 30 günde iş yok.</p>}
                </div>
              </div>
            </Kart>
            <Kart>
              <KartBaslik>Plan dağılımı</KartBaslik>
              {Object.keys(p.planlar).length
                ? <DonutGrafik veri={Object.entries(p.planlar).map(([k, v]) => ({ etiket: PLAN_AD[k] ?? k, deger: v, renk: PLAN_RENK[k] ?? "#64748b" }))} boyut={150} />
                : <Bos baslik="Hesap yok" />}
            </Kart>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <KartBaslik ikon={Activity}>Son olaylar</KartBaslik>
              {p.akis.length === 0 ? <Bos baslik="Henüz olay yok" ozet="Kayıt, ödeme, iş ve yönetici işlemleri burada görünür." /> : (
                <div className="divide-y divide-[color:var(--ad-kenar)]">
                  {p.akis.map((o, i) => {
                    const s = AKIS[o.tur];
                    const ic = (
                      <div className="flex items-center gap-3 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${s.renk} 14%, transparent)`, color: s.renk }}><s.ikon className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <div className={cn("truncate text-[13px]", AD.metin)}>{o.metin}</div>
                          <div className={cn("truncate text-[12px]", AD.metin3)}>{o.alt}</div>
                        </div>
                        <span className={cn("shrink-0 text-[12px]", AD.metin3)}>{gorece(o.zaman)}</span>
                      </div>
                    );
                    return o.href ? <Link key={i} href={o.href} className="block rounded-lg px-1 hover:bg-white/[0.03]">{ic}</Link> : <div key={i} className="px-1">{ic}</div>;
                  })}
                </div>
              )}
            </Kart>
            <Kart>
              <KartBaslik ikon={Flame} sag={<Link href="/admin/kullanicilar?sirala=bakiye" className={cn("inline-flex items-center gap-1 text-[12px]", AD.metin3)}>Tümü <ArrowRight className="h-3.5 w-3.5" /></Link>}>En çok kredi harcayanlar</KartBaslik>
              <p className={cn("-mt-1 mb-2 text-[12px]", AD.metin3)}>Son 30 gün, stüdyo, API ve Build kullanımı</p>
              {p.harcayan.length === 0 ? <Bos baslik="Henüz harcama yok" /> : (
                <div className="space-y-0.5">
                  {p.harcayan.map((h, i) => (
                    <Link key={h.uid} href={`/admin/kullanicilar/${h.uid}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
                      <span className={cn("w-4 text-center text-[12px] font-bold tabular-nums", i < 3 ? AD.aksan : AD.metin3)}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className={cn("truncate text-[13px] font-medium", AD.metin)}>{h.ad || h.email}</div>
                        <div className={cn("truncate text-[11px]", AD.metin3)}>{h.email}</div>
                      </div>
                      <span className={cn("shrink-0 text-[13px] font-semibold tabular-nums", AD.metin)}>{sayi(h.kredi)} kredi</span>
                    </Link>
                  ))}
                </div>
              )}
            </Kart>
          </div>
        </>
      )}
    </RotaGuard>
  );
}
