"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2, Lock, Table2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

type Kural = "herkes" | "uyeler" | "sahibi" | "kapali";
type Karar = { izin: boolean; kural: Kural; kuralAd: string; neden: string; gorulen?: number; degisebilen?: number };
type Tablo = { ad: string; toplam: number; okuma: Karar; ekleme: Karar; duzenleme: Karar; onizleme: Record<string, unknown>[] };
type Sonuc = { kim: { id: string; ad: string; eposta: string; yasakli: boolean } | null; tablolar: Tablo[] };
const KURALLAR: { id: Kural; ad: string }[] = [{ id: "herkes", ad: "Herkes" }, { id: "uyeler", ad: "Üyeler" }, { id: "sahibi", ad: "Kaydın sahibi" }, { id: "kapali", ad: "Yalnız sen" }];
const ISLEM = { okuma: "Okuyabilir mi", ekleme: "Ekleyebilir mi", duzenleme: "Değiştirebilir mi" } as const;

/** Tek işlem kararı: sonuç, dört kural (karar veren beyaz çerçeveli) ve gerekçe. */
function KararKutusu({ islem, k, toplam }: { islem: keyof typeof ISLEM; k: Karar; toplam: number }) {
  const ayrinti = islem === "okuma" && k.izin ? `${toplam} kayıttan ${k.gorulen} tanesini görür` : islem === "duzenleme" && k.izin && k.kural === "sahibi" ? `${k.degisebilen} kaydı değiştirebilir` : "";
  return (
    <div className="min-w-0 rounded-[16px] bg-white/[0.025] p-3 ring-1 ring-inset ring-white/[0.06]">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[12.5px] text-white/55">{ISLEM[islem]}</span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-semibold", k.izin ? "bg-emerald-400/[0.13] text-emerald-200" : "bg-rose-500/[0.13] text-rose-200")}>{k.izin ? "Evet" : "Hayır"}</span>
      </div>
      {ayrinti && <p className="mt-1 text-[12px] tabular-nums text-white/50">{ayrinti}</p>}
      <div className="mt-2.5 flex flex-wrap gap-1">
        {KURALLAR.map((x) => <span key={x.id} className={cn("rounded-full px-2 py-0.5 text-[11px]", x.id === k.kural ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white" : "text-white/30")}>{x.ad}</span>)}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-white/60">{k.neden}</p>
    </div>
  );
}

/** Üye gibi gör: ziyaretçi ya da belirli bir üye seçilir; her tabloda ne okuyup ekleyip değiştirebileceği gösterilir. */
export function KuralTesti({ p, uyeler }: { p: Proje; uyeler: { id: string; ad: string; eposta: string }[] }) {
  const [kim, setKim] = useState("ziyaretci");
  const [v, setV] = useState<Sonuc | null>(null);
  useEffect(() => { setV(null); api<Sonuc>(`/api/build/bulut/${p.id}/kural-testi?kim=${encodeURIComponent(kim)}`).then(setV).catch(() => setV({ kim: null, tablolar: [] })); }, [p.id, kim]);
  return (
    <div className="space-y-4">
      <Kart ikon={Eye} baslik="Üye gibi gör" alt="Erişim kurallarını bir ziyaretçinin ya da üyenin gözünden dene; karar sitedekiyle birebir aynı">
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
          <span className="text-[13px] text-white/60">Kimin gözünden</span>
          <div className="w-full max-w-[340px]"><AcilirSecim deger={kim} set={setKim} l={[{ id: "ziyaretci", ad: "Ziyaretçi", alt: "Giriş yapmamış herhangi biri" }, ...uyeler.map((u) => ({ id: u.id, ad: u.ad, alt: u.eposta }))]} /></div>
          {v?.kim?.yasakli && <span className="rounded-full bg-rose-500/[0.14] px-2.5 py-1 text-[12px] text-rose-200">Bu üye yasaklı; site onu ziyaretçi gibi görür</span>}
          {!uyeler.length && <span className="text-[12px] text-white/40">Belirli bir üyeyi denemek için önce üye ekle.</span>}
        </div>
      </Kart>
      {!v ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !v.tablolar.length ? (
        <Kart ikon={Table2} baslik="Tablo yok" alt="Veritabanında henüz tablo yok"><p className="px-5 py-5 text-[13px] text-white/55">Site veri kaydetmeye başlayınca ya da Veritabanı bölümünden tablo oluşturunca kuralları burada deneyebilirsin.</p></Kart>
      ) : v.tablolar.map((t) => (
        <Kart key={t.ad} ikon={t.okuma.kural === "kapali" ? Lock : Table2} baslik={t.ad} alt={`${t.toplam} kayıt`}>
          <div className="grid gap-2.5 p-3 sm:grid-cols-3 sm:p-4">
            <KararKutusu islem="okuma" k={t.okuma} toplam={t.toplam} />
            <KararKutusu islem="ekleme" k={t.ekleme} toplam={t.toplam} />
            <KararKutusu islem="duzenleme" k={t.duzenleme} toplam={t.toplam} />
          </div>
          <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 sm:px-5">
            <p className="mb-2 text-[12.5px] font-medium text-white/55">{v.kim ? `${v.kim.ad} şunları görür` : "Ziyaretçi şunları görür"}</p>
            {!t.okuma.izin ? <p className="text-[12.5px] text-white/40">Hiçbir kayıt görünmez.</p> : !t.onizleme.length ? <p className="text-[12.5px] text-white/40">Görebileceği kayıt yok.</p> : (
              <div className="overflow-x-auto rounded-[12px] ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">
                <table className="w-full text-[12px]">
                  <thead><tr className="text-left text-white/40">{Object.keys(t.onizleme[0]).map((a) => <th key={a} className="whitespace-nowrap px-3 py-1.5 font-medium">{a}</th>)}</tr></thead>
                  <tbody>{t.onizleme.map((r, i) => <tr key={i} className="border-t border-white/[0.05]">{Object.keys(t.onizleme[0]).map((a) => <td key={a} className="max-w-[220px] truncate px-3 py-1.5 text-white/75">{r[a] == null ? "" : String(r[a])}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        </Kart>
      ))}
    </div>
  );
}
