"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Boxes, Code2, Download, Layers, Loader2, Undo2 } from "lucide-react";
import { AlanSayfa, type AlanSayfaBaglam } from "@/components/alan/AlanSayfa";
import { DIL, RolHap, goreliZaman, saatDilimi, sayiYaz } from "@/components/alan/ortak";
import { CubukGrafik, type Cubuk } from "@/components/api/grafik";
import { Grup, Hap, Segment, dugme } from "@/components/ayarlar/ui";
import { Avatar } from "@/components/ayarlar/AyarKabugu";
import { KrediJeton } from "@/components/ui/KrediHap";
import * as A from "@/lib/alan/istemci";
import { URUN_AD, type AlanUrun } from "@/lib/alan/tipler";
import { alanDegisinceDinle } from "@/store/useAlan";
import { cn } from "@/lib/utils";

const RENK: Record<AlanUrun, string> = { studyo: "#55d6fd", build: "#a78bfa", api: "#f08a4b", diger: "#8b8b93" };
const IKON: Record<AlanUrun, typeof Layers> = { studyo: Layers, build: Boxes, api: Code2, diger: Layers };

/** Kullanım: ürüne ve üyeye göre harcama, günlük grafik, son hareketler, CSV dışa aktarım. */
export default function AlanKullanim() {
  return (
    <AlanSayfa baslik="Kullanım" aciklama="Alanın ortak kredisinin kim tarafından, hangi üründe harcandığı. İadeler düşülmüş net tutarlar.">
      {(b) => <Icerik {...b} />}
    </AlanSayfa>
  );
}

function Icerik({ alan }: AlanSayfaBaglam) {
  const [gun, setGun] = useState<"7" | "30" | "90">("30");
  const [v, setV] = useState<A.KullanimYaniti | null>(null);
  const [hata, setHata] = useState("");
  const getir = useCallback(async () => {
    const r = await A.kullanimGetir(alan.id, +gun);
    if (r.ok) { setV(r); setHata(""); } else setHata(r.hata);
  }, [alan.id, gun]);
  useEffect(() => { void getir(); }, [getir]);
  useEffect(() => alanDegisinceDinle(() => void getir()), [getir]);
  const tz = encodeURIComponent(saatDilimi());
  if (!v) return hata ? <p className="text-[13.5px] text-rose-300">{hata}</p> : <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  const degisim = v.onceki ? Math.round(((v.toplam - v.onceki) / v.onceki) * 100) : null;
  const cubuklar: Cubuk[] = v.seri.map((s) => {
    const d = new Date(s.gun);
    return {
      anahtar: String(s.gun), etiket: d.toLocaleDateString(DIL, { day: "numeric", month: "numeric", timeZone: "UTC" }), uzunEtiket: d.toLocaleDateString(DIL, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
      parcalar: (["studyo", "build", "api"] as AlanUrun[]).map((u) => ({ ad: URUN_AD[u], deger: Math.max(0, s[u]), renk: RENK[u] })),
    };
  });
  const urunler = (["studyo", "build", "api"] as AlanUrun[]).concat(v.urunler.diger ? ["diger"] : []);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Segment kayit={false} deger={gun} onSec={setGun} secenekler={[{ deger: "7", ad: "7 gün" }, { deger: "30", ad: "30 gün" }, { deger: "90", ad: "90 gün" }]} />
        <span className="flex-1" />
        {v.csv && (
          <>
            <a href={`/api/alan/${alan.id}/kullanim?csv=uye&gun=${gun}&tz=${tz}`} className={dugme.ikincil}><Download className="h-4 w-4" />Üye özeti CSV</a>
            <a href={`/api/alan/${alan.id}/kullanim?csv=hareket&tz=${tz}`} className={dugme.ikincil}><Download className="h-4 w-4" />Bütün hareketler CSV</a>
          </>
        )}
      </div>

      <Grup id="rapor" baslik={<span className="flex items-center gap-2">Harcama<Hap ton="vurgu"><KrediJeton boyut={12} />{sayiYaz(v.toplam)} kredi</Hap></span>}
        aciklama={degisim === null ? `Son ${gun} gün.` : `Son ${gun} gün; önceki ${gun} güne göre yüzde ${Math.abs(degisim)} ${degisim >= 0 ? "fazla" : "az"}.`} govde>
        <div className="mb-5 grid gap-2.5 sm:grid-cols-3">
          {urunler.map((u, i) => {
            const I = IKON[u];
            const pay = v.toplam ? v.urunler[u] / v.toplam : 0;
            return (
              <motion.div key={u} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-[14px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
                <div className="flex items-center gap-2 text-[13px] text-white/60"><I className="h-4 w-4" style={{ color: RENK[u] }} />{URUN_AD[u]}</div>
                <p className="mt-1.5 text-[22px] font-semibold tabular-nums text-white">{sayiYaz(v.urunler[u])}</p>
                <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${pay * 100}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: RENK[u] }} /></div>
                <p className="mt-1.5 text-[12px] text-white/40">toplamın yüzde {Math.round(pay * 100)}</p>
              </motion.div>
            );
          })}
        </div>
        <CubukGrafik veri={cubuklar} birim="kredi" yukseklik={210} bosMetin="Bu aralıkta alanda harcama yok" />
      </Grup>

      <Grup baslik="Üyelere göre" aciklama="Seçili aralıkta her üyenin ürün kırılımıyla harcaması.">
        {!v.uyeler.length ? <p className="px-6 py-6 text-[13.5px] text-white/45">Bu aralıkta harcama yapan üye yok.</p> : (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_80px_80px_80px_90px] gap-3 px-6 py-2.5 text-[12px] text-white/40 md:grid">
              <span>Üye</span><span className="text-right">Stüdyolar</span><span className="text-right">Build</span><span className="text-right">API</span><span className="text-right">Toplam</span>
            </div>
            {v.uyeler.map((u) => (
              <div key={u.uid} className="grid grid-cols-[minmax(0,1fr)_90px] items-center gap-3 px-6 py-3 md:grid-cols-[minmax(0,1fr)_80px_80px_80px_90px]">
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar ad={u.ad} boyut={32} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2"><span className="truncate text-[14px] font-medium text-white">{u.ad}</span>{u.ben && <Hap>Sen</Hap>}</span>
                    <span className="flex items-center gap-2 text-[12px] text-white/45">{u.rol ? <RolHap rol={u.rol} className="h-[18px] text-[10.5px]" /> : "Ayrıldı"}<span>{sayiYaz(u.adet)} işlem{u.iade ? `, ${sayiYaz(u.iade)} iade` : ""}</span></span>
                  </span>
                </span>
                {(["studyo", "build", "api"] as AlanUrun[]).map((x) => <span key={x} className="hidden text-right text-[13.5px] tabular-nums text-white/70 md:block">{sayiYaz(u.urun[x])}</span>)}
                <span className="text-right text-[14px] font-semibold tabular-nums text-white">{sayiYaz(u.toplam)}</span>
              </div>
            ))}
          </>
        )}
      </Grup>

      <Grup baslik="En çok harcanan işler" aciklama="Son hareketlerde işe göre toplanmış harcama." govde>
        {(() => {
          const l = Object.values(v.son.filter((s) => !s.iade).reduce<Record<string, { ad: string; deger: number; urun: AlanUrun }>>((t, s) => {
            const a = s.aciklama.split(":").pop()!.trim() || s.kaynak;
            t[a] ??= { ad: a, deger: 0, urun: s.urun };
            t[a].deger += s.miktar;
            return t;
          }, {})).sort((x, y) => y.deger - x.deger).slice(0, 6);
          const tepe = Math.max(1, ...l.map((x) => x.deger));
          if (!l.length) return <p className="text-[13.5px] text-white/45">Bu aralıkta harcama yok.</p>;
          return (
            <ul className="space-y-3.5">
              {l.map((x, i) => (
                <li key={x.ad}>
                  <div className="flex items-baseline justify-between gap-3 text-[13.5px]"><span className="truncate text-white">{x.ad}</span><span className="shrink-0 tabular-nums text-white/60"><b className="font-semibold text-white">{sayiYaz(x.deger)}</b> kredi · {URUN_AD[x.urun]}</span></div>
                  <div className="mt-1.5 h-[6px] overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${(x.deger / tepe) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.04 }} className="h-full rounded-full" style={{ background: RENK[x.urun] }} /></div>
                </li>
              ))}
            </ul>
          );
        })()}
      </Grup>

      <Grup baslik="Son hareketler" aciklama="En yeni 80 harcama ve iade.">
        {!v.son.length ? <p className="px-6 py-6 text-[13.5px] text-white/45">Henüz harcama yok.</p> : v.son.map((s, i) => {
          const I = s.iade ? Undo2 : IKON[s.urun];
          return (
            <div key={`${s.zaman}-${i}`} className="flex items-center gap-3 px-6 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05]"><I className="h-4 w-4" style={{ color: s.iade ? "#34d399" : RENK[s.urun] }} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{s.aciklama}</span><span className="block text-[12px] text-white/40">{s.ad} · {URUN_AD[s.urun]} · {goreliZaman(s.zaman)}</span></span>
              <span className={cn("shrink-0 text-[14px] font-semibold tabular-nums", s.iade ? "text-emerald-300" : "text-white/85")}>{s.iade ? "+" : ""}{sayiYaz(Math.abs(s.miktar))}</span>
            </div>
          );
        })}
      </Grup>
    </>
  );
}
