"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BellRing, BrickWall, CalendarClock, Database, Download, FlaskConical, Globe, HardDrive, History, KeyRound, Loader2, Search, Settings2, ShieldCheck, Table2, Users } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { YuzeySatiri } from "./ortak";

type Satir = { z: number; tur: string; mesaj: string; kim: string; ortam?: "canli" | "test" };
const TUR: Record<string, { ad: string; I: typeof History }> = {
  veri: { ad: "Veri", I: Database }, kural: { ad: "Erişim kuralı", I: ShieldCheck }, sema: { ad: "Şema", I: Table2 }, tablo: { ad: "Tablo", I: Table2 },
  dosya: { ad: "Dosyalar", I: HardDrive }, kimlik: { ad: "Kimlik ayarı", I: KeyRound }, uye: { ad: "Üye", I: Users }, zamanli: { ad: "Zamanlanmış", I: CalendarClock },
  uyari: { ad: "Uyarı kuralı", I: BellRing }, duvar: { ad: "Güvenlik duvarı", I: BrickWall }, alan: { ad: "Alan adı", I: Globe }, ortam: { ad: "Test ve Canlı", I: FlaskConical },
  yedek: { ad: "Yedek", I: History }, ayar: { ad: "Ayar", I: Settings2 },
};
const KIM = (k: string) => (k === "sahip" ? "Sen" : k === "ekip" ? "Ekip üyesi" : k === "onizleme" ? "Önizleme" : k === "fonksiyon" ? "Sunucu fonksiyonu" : k === "ajan" ? "Build ajanı" : k === "sistem" ? "Sistem" : k.startsWith("uye:") ? "Site üyesi" : "Ziyaretçi");

/** Bulut > Denetim günlüğü: projedeki yapı ve ayar değişiklikleri, kim ne zaman (90 gün). */
export function Denetim({ p }: { p: Proje }) {
  const [tur, setTur] = useState("hepsi");
  const [ara, setAra] = useState("");
  const [gecikmeli, setGecikmeli] = useState("");
  const [v, setV] = useState<{ satirlar: Satir[]; sayilar: Record<string, number>; toplam: number } | null>(null);
  useEffect(() => { const t = setTimeout(() => setGecikmeli(ara), 300); return () => clearTimeout(t); }, [ara]);
  const getir = useCallback(() => api<NonNullable<typeof v>>(`/api/build/bulut/${p.id}/denetim?tur=${tur}${gecikmeli ? `&ara=${encodeURIComponent(gecikmeli)}` : ""}`).then(setV).catch(() => setV({ satirlar: [], sayilar: {}, toplam: 0 })), [p.id, tur, gecikmeli]);
  useEffect(() => { getir(); }, [getir]);
  const disa = () => {
    if (!v) return;
    const q = (x: string) => `"${x.replace(/"/g, '""')}"`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + ["zaman,tur,kim,ortam,mesaj", ...v.satirlar.map((s) => [new Date(s.z).toISOString(), TUR[s.tur]?.ad ?? s.tur, KIM(s.kim), s.ortam ?? "", s.mesaj].map((x) => q(String(x))).join(","))].join("\n")], { type: "text/csv;charset=utf-8" }));
    a.download = "denetim-gunlugu.csv"; a.click();
  };
  const turler = Object.entries(v?.sayilar ?? {}).sort((a, b) => b[1] - a[1]);
  return (
    <Kart ikon={History} baslik="Denetim günlüğü" alt="Erişim kuralı, şema, tablo, dosya kovası, kimlik ayarı, zamanlanmış görev, uyarı ve güvenlik duvarı değişiklikleri; 90 gün"
      sag={v?.satirlar.length ? <button type="button" onClick={disa} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">CSV</span></button> : undefined}>
      <div className="flex max-md:flex-col">
        <div className="w-full shrink-0 space-y-0.5 border-white/[0.06] p-2 md:w-[220px] md:border-r">
          <YuzeySatiri secili={tur === "hepsi"} onClick={() => setTur("hepsi")} ad="Hepsi" sayi={v?.toplam} />
          {turler.map(([t, n]) => <YuzeySatiri key={t} secili={tur === t} onClick={() => setTur(t)} ad={TUR[t]?.ad ?? t} sayi={n} />)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="border-b border-white/[0.06] p-3"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Değişikliklerde ara" className="h-9 w-full rounded-full bg-white/[0.05] pl-9 pr-3 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/30 focus:ring-white/25" /></label></div>
          {!v ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
            : !v.satirlar.length ? <div className="px-6 py-12 text-center"><History className="mx-auto h-5 w-5 text-white/25" /><p className="mt-2 text-[13.5px] text-white/70">{gecikmeli || tur !== "hepsi" ? "Bu süzgece uyan değişiklik yok" : "Henüz kayıtlı değişiklik yok"}</p><p className="mt-1 text-[12.5px] text-white/45">Tablo kuralı değiştirdiğinde, görev eklediğinde ya da kova sildiğinde burada görünür.</p></div>
            : (
              <div className="divide-y divide-white/[0.04]">
                {v.satirlar.map((s, i) => { const T = TUR[s.tur] ?? { ad: s.tur, I: History }; return (
                  <motion.div key={`${s.z}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 12) * 0.015 }} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/65"><T.I className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[13px] leading-snug text-white">{s.mesaj}</span><span className="mt-0.5 block text-[12px] text-white/45">{T.ad} · {KIM(s.kim)}{s.ortam === "test" ? " · Test" : ""}</span></span>
                    <span className={cn("shrink-0 text-[12px] text-white/40")} title={new Date(s.z).toLocaleString("tr-TR")}>{gorece(s.z)}</span>
                  </motion.div>
                ); })}
              </div>
            )}
        </div>
      </div>
    </Kart>
  );
}
