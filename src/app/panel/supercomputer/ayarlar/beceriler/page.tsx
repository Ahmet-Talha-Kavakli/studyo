"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Zap, BadgeCheck, Search, ChevronRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { BECERILER, type Beceri } from "@/lib/scMarket";
import { useScKurulum } from "@/store/useScKurulum";
import { AyarBolum, BosDurum, Anahtar } from "@/components/kabuk/sc/SCAyarParcalari";
import { cn } from "@/lib/utils";

/* ============================================================
   AYARLAR › BECERİLER — Claude'un ayar dili.

   Higgsfield sunumu kaldırıldı: kategori çipi çubuğu, gradyan kapaklı kart
   ızgarası, "NELER YAPABİLİRSİN" örnek şeritleri ve hover'da beliren kurulum
   sayısı rozeti.

   Claude karşılığı: KATEGORİYE GÖRE gruplanmış liste. Her satır — ikon · ad ·
   /slash komutu · özet · sağda anahtar. Komut, becerinin composer'da nasıl
   çağrıldığını gösterir (Claude'un skill listesindeki mantık).
   ============================================================ */

export default function BecerilerAyar() {
  const [ara, setAra] = useState("");
  /* Açık/kapalı durumu KALICI store'da (önce useState'teydi ve sayfa
     yenilenince ayar kayboluyordu). Selector düz dizi döndürür — içinde
     .filter/.map YOK, aksi halde her render yeni referans üretip sonsuz
     döngüye giriyor. */
  const acikListe = useScKurulum((s) => s.beceriler);
  const beceriDegistir = useScKurulum((s) => s.beceriDegistir);
  const kurulu = useMemo(() => new Set(acikListe), [acikListe]);

  const q = ara.trim().toLocaleLowerCase("tr");

  /** Aramaya uyan beceriler, KATEGORİ sırası korunarak gruplanır. */
  const gruplar = useMemo(() => {
    const uyan = !q ? BECERILER : BECERILER.filter((b) =>
      `${b.ad} ${b.ozet} ${b.kat} ${b.komut ?? ""}`.toLocaleLowerCase("tr").includes(q));
    // Kategori sırası veri dosyasındaki ilk görülme sırasıdır (alfabetik değil) —
    // böylece "İçerik Üretimi" gibi ana gruplar üstte kalır.
    const sira: string[] = [];
    for (const b of BECERILER) if (!sira.includes(b.kat)) sira.push(b.kat);
    return sira
      .map((kat) => ({ kat, liste: uyan.filter((b) => b.kat === kat) }))
      .filter((g) => g.liste.length > 0);
  }, [q]);

  const acikSayi = BECERILER.filter((b) => kurulu.has(b.slug)).length;

  const degistir = (b: Beceri) => {
    const acilacak = !kurulu.has(b.slug);
    beceriDegistir(b.slug);
    if (acilacak) toast.success(`${b.ad} açıldı`); else toast(`${b.ad} kapatıldı`);
  };

  return (
    <div className="space-y-6">
      <AyarBolum
        baslik="Beceriler"
        ozet="Beceriler Supercomputer'a belirli yetenekler kazandırır. Açık olanlar composer'da eğik çizgi komutuyla çağrılır."
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--sc-kenar)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" strokeWidth={1.9} />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Beceri veya komut ara"
            className="w-full bg-transparent text-[14px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]"
          />
          <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">
            {acikSayi}/{BECERILER.length} açık
          </span>
        </div>

        {gruplar.length === 0 && (
          <BosDurum
            ikon={Search}
            baslik="Eşleşen beceri yok"
            ozet={`"${ara}" ile eşleşen bir beceri bulunamadı.`}
          />
        )}

        {gruplar.map((g) => (
          <div key={g.kat}>
            {/* Kategori başlığı — liste içi ayırıcı şerit. */}
            <p className="border-b border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--sc-metin-3)]">
              {g.kat}
            </p>
            <ul>
              {g.liste.map((b) => {
                const bu = kurulu.has(b.slug);
                return (
                  <li key={b.slug}
                    className="flex items-center gap-3 border-b border-[var(--sc-kenar)] px-4 py-3.5">
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      bu ? "bg-[var(--sc-aksan-zayif)] text-[var(--sc-aksan)]" : "bg-[var(--sc-cip)] text-[var(--sc-metin-3)]",
                    )}>
                      <Zap className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    </span>
                    <Link href={`/panel/supercomputer/beceriler/${b.slug}`} className="group/b min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] font-medium text-[var(--sc-metin)] group-hover/b:text-[var(--sc-aksan)]">
                          {b.ad}
                        </span>
                        {b.dogrulanmis && (
                          <BadgeCheck className="h-[14px] w-[14px] shrink-0 text-[var(--sc-aksan)]" aria-label="Doğrulanmış" role="img" />
                        )}
                        {/* Slash komutu — Claude'da beceri böyle çağrılır. */}
                        <code className="shrink-0 rounded border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-1.5 py-px font-mono text-[11.5px] text-[var(--sc-metin-3)]">
                          /{b.komut}
                        </code>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)] opacity-0 transition-opacity group-hover/b:opacity-100" />
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] text-[var(--sc-metin-3)]">
                        {b.ozet} · {b.guclu}
                      </span>
                    </Link>
                    <Anahtar acik={bu} onDegis={() => degistir(b)} etiket={`${b.ad} becerisini ${bu ? "kapat" : "aç"}`} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </AyarBolum>
    </div>
  );
}
