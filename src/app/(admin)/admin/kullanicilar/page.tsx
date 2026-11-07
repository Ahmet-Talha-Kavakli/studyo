"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, ChevronLeft, ChevronRight, ShieldCheck, Ban, MailWarning, Crown } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, AramaKutu, BolumBaslik, Bos, FiltreCip, HataKutusu, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { useAdminVeri, sorgu, sayi, gorece, tarih, PLAN_AD } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Satir {
  id: string; ad: string; email: string; kullaniciAdi?: string; avatar?: string; plan: string; bakiye: number | null; olusturma: number; sonGorulme: number;
  dogrulandi: boolean; admin: boolean; askida: boolean; ikiAdim: boolean; saglayicilar: string[]; oturum: number;
}
interface Liste {
  satirlar: Satir[]; toplam: number; sayfa: number; sayfaSayisi: number; boyut: number;
  ozet: { toplam: number; aktif7: number; askida: number; dogrulanmamis: number; admin: number; ikiAdim: number; planlar: Record<string, number> };
}

const DURUMLAR = [
  { id: "hepsi", ad: "Hepsi" }, { id: "aktif", ad: "Son 7 günde aktif" }, { id: "dogrulanmamis", ad: "Doğrulanmamış" },
  { id: "askida", ad: "Askıda" }, { id: "admin", ad: "Yönetici" }, { id: "ikiAdim", ad: "İki adım açık" },
];
const SIRALAR = [{ id: "yeni", ad: "En yeni" }, { id: "eski", ad: "En eski" }, { id: "son", ad: "Son görülme" }, { id: "bakiye", ad: "Bakiye" }, { id: "ad", ad: "Ad" }];

function Icerik() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [gq, setGq] = useState(q);
  const durum = sp.get("durum") ?? "hepsi", plan = sp.get("plan") ?? "hepsi", sirala = sp.get("sirala") ?? "yeni", sayfa = Number(sp.get("sayfa") ?? 1) || 1;

  useEffect(() => { const t = setTimeout(() => setGq(q), 300); return () => clearTimeout(t); }, [q]);
  const git = (p: Record<string, string | number>) => {
    const u = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(p)) { if (v === "" || v === "hepsi" || (k === "sayfa" && v === 1) || (k === "sirala" && v === "yeni")) u.delete(k); else u.set(k, String(v)); }
    router.replace(`/admin/kullanicilar${u.toString() ? `?${u}` : ""}`, { scroll: false });
  };
  useEffect(() => { if ((sp.get("q") ?? "") !== gq) git({ q: gq, sayfa: 1 }); }, [gq]); // eslint-disable-line react-hooks/exhaustive-deps

  const { veri, hata, yukleniyor, yenile } = useAdminVeri<Liste>(sorgu("/api/admin/kullanicilar", { q: gq, durum, plan, sirala, sayfa, boyut: 25 }));

  return (
    <RotaGuard modul="kullanicilar">
      <BolumBaslik baslik="Kullanıcılar" ozet="Bütün hesaplar; ara, süz, ayrıntıya gir." ikon={Users} />
      {veri && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetrikKart etiket="Toplam hesap" deger={sayi(veri.ozet.toplam)} />
          <MetrikKart etiket="Son 7 günde aktif" deger={sayi(veri.ozet.aktif7)} />
          <MetrikKart etiket="E-postası doğrulanmamış" deger={sayi(veri.ozet.dogrulanmamis)} />
          <MetrikKart etiket="Askıda" deger={sayi(veri.ozet.askida)} />
        </div>
      )}

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <AramaKutu deger={q} degis={setQ} yer="Ad, e-posta, kullanıcı adı ya da kimlik ara" className="lg:w-96" />
        <div className="flex items-center gap-2">
          <label className={cn("text-[13px]", AD.metin3)} htmlFor="sirala">Sırala</label>
          <select id="sirala" value={sirala} onChange={(e) => git({ sirala: e.target.value, sayfa: 1 })}
            className="h-9 rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-3 text-sm text-[color:var(--ad-metin)] outline-none">
            {SIRALAR.map((s) => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
        {DURUMLAR.map((d) => <FiltreCip key={d.id} aktif={durum === d.id} onClick={() => git({ durum: d.id, sayfa: 1 })}>{d.ad}</FiltreCip>)}
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
        <FiltreCip aktif={plan === "hepsi"} onClick={() => git({ plan: "hepsi", sayfa: 1 })}>Bütün planlar</FiltreCip>
        {Object.entries(PLAN_AD).map(([k, v]) => <FiltreCip key={k} aktif={plan === k} onClick={() => git({ plan: k, sayfa: 1 })}>{v}{veri?.ozet.planlar[k] ? ` (${sayi(veri.ozet.planlar[k])})` : ""}</FiltreCip>)}
      </div>

      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!veri && !hata && <Yukleniyor satir={3} />}
      {veri && (veri.satirlar.length === 0 ? (
        <Bos ikon={Users} baslik={veri.ozet.toplam ? "Bu süzgeçle hesap yok" : "Henüz hesap yok"} ozet={veri.ozet.toplam ? "Aramayı ya da süzgeçleri değiştir." : "İlk kayıt geldiğinde burada görünür."} />
      ) : (
        <div className={cn("ad-glass overflow-hidden !p-0 transition-opacity", yukleniyor && "opacity-60")}>
          <div className="overflow-x-auto ad-ince-scroll">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--ad-kenar)] text-left">
                  {["Hesap", "Plan", "Bakiye", "Durum", "Kayıt", "Son görülme"].map((b, i) => <th key={b} className={cn("whitespace-nowrap px-4 py-3 text-[12px] font-semibold", AD.metin3, i === 2 && "text-right")}>{b}</th>)}
                </tr>
              </thead>
              <tbody>
                {veri.satirlar.map((k) => (
                  <tr key={k.id} onClick={() => router.push(`/admin/kullanicilar/${k.id}`)} className="cursor-pointer border-b border-[color:var(--ad-kenar)] last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {k.avatar
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={k.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                          : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[12px] font-bold text-[color:var(--ad-metin-2)]">{(k.ad || k.email)[0]?.toLocaleUpperCase("tr")}</span>}
                        <div className="min-w-0">
                          <div className={cn("flex items-center gap-1.5 truncate font-medium", AD.metin)}>{k.ad}{k.admin && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-label="Yönetici" />}</div>
                          <div className={cn("truncate text-[12px]", AD.metin3)}>{k.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Rozet ton={k.plan === "baslangic" ? "notr" : k.plan === "ultra" ? "mor" : "aksan"}>{PLAN_AD[k.plan] ?? k.plan}</Rozet></td>
                    <td className={cn("px-4 py-3 text-right tabular-nums", AD.metin)}>{k.bakiye === null ? "Yok" : sayi(k.bakiye)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.askida && <Rozet ton="tehlike"><Ban className="h-3 w-3" /> Askıda</Rozet>}
                        {!k.dogrulandi && <Rozet ton="uyari"><MailWarning className="h-3 w-3" /> Doğrulanmamış</Rozet>}
                        {k.ikiAdim && <Rozet ton="basari"><ShieldCheck className="h-3 w-3" /> İki adım</Rozet>}
                        {!k.askida && k.dogrulandi && !k.ikiAdim && <span className={cn("text-[12px]", AD.metin3)}>Normal</span>}
                      </div>
                    </td>
                    <td className={cn("whitespace-nowrap px-4 py-3 text-[13px]", AD.metin2)}>{tarih(k.olusturma)}</td>
                    <td className={cn("whitespace-nowrap px-4 py-3 text-[13px]", AD.metin2)}>{gorece(k.sonGorulme)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[color:var(--ad-kenar)] px-4 py-3">
            <span className={cn("text-[13px]", AD.metin3)}>{sayi(veri.toplam)} hesap</span>
            <div className="flex items-center gap-1">
              <button aria-label="Önceki sayfa" onClick={() => git({ sayfa: veri.sayfa - 1 })} disabled={veri.sayfa <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] hover:bg-white/[0.05] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className={cn("px-2 text-[13px] tabular-nums", AD.metin2)}>Sayfa {veri.sayfa}, toplam {veri.sayfaSayisi}</span>
              <button aria-label="Sonraki sayfa" onClick={() => git({ sayfa: veri.sayfa + 1 })} disabled={veri.sayfa >= veri.sayfaSayisi} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] hover:bg-white/[0.05] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </RotaGuard>
  );
}

export default function Kullanicilar() {
  return <Suspense fallback={<Yukleniyor satir={3} />}><Icerik /></Suspense>;
}
