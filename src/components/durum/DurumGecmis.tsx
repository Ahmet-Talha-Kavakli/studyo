"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DURUM, GRUPLAR, OLAYLAR, TUM_BILESENLER, gunAnahtari } from "@/lib/durum";
import { AYLAR, GunCubuklari, gunleriKur, olayAraligi, useDurum, yuzdeMetni, type GunBilgi } from "./ortak";
import { cn } from "@/lib/utils";

type Ay = { yil: number; ay: number };
const ayEkle = (a: Ay, n: number): Ay => { const d = new Date(a.yil, a.ay + n, 1); return { yil: d.getFullYear(), ay: d.getMonth() }; };
const ayAnahtari = (a: Ay) => `${a.yil}-${String(a.ay + 1).padStart(2, "0")}`;
const ILK_AY: Ay = { yil: 2026, ay: 6 }; // en eski kayıt: Temmuz 2026

/** Olay geçmişi (aylara göre, 3 aylık pencere) ve bileşen bazlı çalışma süresi takvimi. */
export function DurumGecmis() {
  const params = useSearchParams();
  const router = useRouter();
  const yol = usePathname();
  const sekme = params.get("sekme") === "calisma" ? "calisma" : "olaylar";
  const simdi = new Date();
  const [son, setSon] = useState<Ay>({ yil: simdi.getFullYear(), ay: simdi.getMonth() });
  const [filtre, setFiltre] = useState<string>("");
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [genis, setGenis] = useState<Set<string>>(new Set());
  const [bilesen, setBilesen] = useState("web");
  const { veri } = useDurum();

  const aylar = [ayEkle(son, -2), ayEkle(son, -1), son];
  const sonAy = ayAnahtari(son) >= ayAnahtari({ yil: simdi.getFullYear(), ay: simdi.getMonth() });
  const ilkAy = ayAnahtari(aylar[0]) <= ayAnahtari(ILK_AY);
  const sekmeAyarla = (s: string) => router.replace(s === "calisma" ? `${yol}?sekme=calisma` : yol, { scroll: false });

  const olaylar = useMemo(() => OLAYLAR.filter((o) => !filtre || o.bilesenler.includes(filtre)), [filtre]);
  const veriB = veri?.bilesenler.find((b) => b.id === bilesen);

  return (
    <>
      <div role="tablist" className="flex border-b border-white/[0.1]">
        {([["olaylar", "Olaylar"], ["calisma", "Çalışma süresi"]] as const).map(([id, ad]) => (
          <button key={id} role="tab" aria-selected={sekme === id} onClick={() => sekmeAyarla(id)}
            className={cn("-mb-px border border-b-0 px-4 py-2.5 text-[14px] transition-colors", sekme === id ? "rounded-t-lg border-white/[0.1] bg-zemin text-white" : "border-transparent text-metin-3 hover:text-white")}>{ad}</button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {sekme === "olaylar" ? (
          <div className="relative">
            <button onClick={() => setFiltreAcik((v) => !v)} aria-expanded={filtreAcik} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.1] px-3.5 text-[13.5px] text-metin-2 hover:text-white">
              {filtre ? TUM_BILESENLER.find((b) => b.id === filtre)?.ad : "Bileşene göre süz"}<ChevronDown className="h-3.5 w-3.5" />
            </button>
            {filtreAcik && (
              <>
                <div className="fixed inset-0 z-30" onMouseDown={() => setFiltreAcik(false)} aria-hidden />
                <div className="absolute left-0 top-12 z-40 max-h-[320px] w-[280px] overflow-y-auto rounded-xl border border-white/[0.1] bg-[#17171a] p-1.5">
                  <button onClick={() => { setFiltre(""); setFiltreAcik(false); }} className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-white hover:bg-white/[0.06]">Tüm bileşenler</button>
                  {GRUPLAR.map((g) => (
                    <div key={g.id}>
                      <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-metin-3">{g.ad}</p>
                      {g.bilesenler.map((b) => <button key={b.id} onClick={() => { setFiltre(b.id); setFiltreAcik(false); }} className={cn("w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-white/[0.06]", filtre === b.id ? "text-white" : "text-metin-2")}>{b.ad}</button>)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <select value={bilesen} onChange={(e) => setBilesen(e.target.value)} aria-label="Bileşen" className="h-10 rounded-lg border border-white/[0.1] bg-yuzey px-3 text-[13.5px] text-white outline-none">
            {GRUPLAR.map((g) => <optgroup key={g.id} label={g.ad}>{g.bilesenler.map((b) => <option key={b.id} value={b.id}>{b.ad}</option>)}</optgroup>)}
          </select>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => setSon((a) => ayEkle(a, -3))} disabled={ilkAy} aria-label="Önceki aylar" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-metin-2 hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[190px] text-center text-[14px] text-white">{AYLAR[aylar[0].ay]} {aylar[0].yil} – {AYLAR[son.ay]} {son.yil}</span>
          <button onClick={() => setSon((a) => ayEkle(a, 3))} disabled={sonAy} aria-label="Sonraki aylar" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-metin-2 hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {sekme === "olaylar" ? (
        <div className="mt-8 space-y-10">
          {[...aylar].reverse().map((a) => {
            const anahtar = ayAnahtari(a);
            const liste = olaylar.filter((o) => o.baslangic.startsWith(anahtar) || o.bitis.startsWith(anahtar));
            const hepsi = genis.has(anahtar);
            const gorunen = hepsi ? liste : liste.slice(0, 3);
            return (
              <section key={anahtar}>
                <h2 className="border-b border-white/[0.08] pb-2.5 text-[24px] font-semibold tracking-[-0.01em] text-white">{AYLAR[a.ay]} {a.yil}</h2>
                {liste.length ? (
                  <div className="mt-4 space-y-5">
                    {gorunen.map((o) => (
                      <div key={o.id}>
                        <Link href={`/durum/olay/${o.id}`} className="text-[16.5px] font-medium hover:underline" style={{ color: DURUM[o.etki].renk }}>{o.baslik}</Link>
                        <p className="mt-1 text-[14px] leading-relaxed text-metin-2">{o.guncellemeler[0].metin}</p>
                        <p className="mt-1 text-[12.5px] text-metin-3">{olayAraligi(o)} · {o.kaynak.ad}</p>
                      </div>
                    ))}
                    {liste.length > 3 && (
                      <button onClick={() => setGenis((s) => { const n = new Set(s); if (n.has(anahtar)) n.delete(anahtar); else n.add(anahtar); return n; })}
                        className="w-full rounded-lg border border-white/[0.1] py-2 text-[13px] text-metin-2 hover:text-white">{hepsi ? "Daha az göster" : `+ Tüm ${liste.length} olayı göster`}</button>
                    )}
                  </div>
                ) : <p className="mt-4 text-[14px] text-metin-3">Bu ay olay bildirilmedi.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {aylar.map((a) => <AyTakvimi key={ayAnahtari(a)} ay={a} gunler={gunleriKur(bilesen, veriB, veri?.olcumBaslangic ?? null, 400)} />)}
        </div>
      )}
      <p className="mt-10 text-[12.5px] text-metin-3">
        Olay kayıtları sürüm notlarından derlenir; otomatik çalışma süresi ölçümü {veri ? new Date(veri.olcumBaslangic).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "…"} tarihinde başladı.
      </p>
    </>
  );
}

function AyTakvimi({ ay, gunler }: { ay: Ay; gunler: GunBilgi[] }) {
  const anahtar = ayAnahtari(ay);
  const harita = new Map(gunler.map((g) => [g.gun, g]));
  const gunSayisi = new Date(ay.yil, ay.ay + 1, 0).getDate();
  const bosluk = (new Date(ay.yil, ay.ay, 1).getDay() + 6) % 7; // Pazartesi başlangıç
  const bugun = gunAnahtari(Date.now());
  const hucreler = Array.from({ length: gunSayisi }, (_, i) => {
    const gun = `${anahtar}-${String(i + 1).padStart(2, "0")}`;
    return harita.get(gun) ?? { gun, durum: null, olaylar: [], olcumOncesi: true };
  });
  const kayitlar = hucreler.map((h) => h.kayit).filter(Boolean);
  const top = kayitlar.reduce((t, k) => ({ o: t.o + k!.olcum, b: t.b + k!.basarisiz }), { o: 0, b: 0 });
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[15px] text-white">{AYLAR[ay.ay]} {ay.yil}</p>
        <p className="text-[12.5px] text-metin-3">{top.o ? yuzdeMetni(((top.o - top.b) / top.o) * 100) : "ölçüm yok"}</p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: bosluk }, (_, i) => <span key={`b${i}`} />)}
        {hucreler.map((h) => (
          <div key={h.gun} className={cn("aspect-square", h.gun > bugun && "opacity-40")}>
            {h.gun > bugun ? <span className="block h-full w-full rounded-[3px] bg-white/[0.04]" /> : <GunCubuklari gunler={[h]} etiket={h.gun} />}
          </div>
        ))}
      </div>
    </div>
  );
}
