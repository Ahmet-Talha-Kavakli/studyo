"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, BadgeCheck, Plus, Search, ChevronRight, Sparkles, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSupercomputer } from "@/store/useSupercomputer";
import { CALISANLAR, type Calisan } from "@/lib/scMarket";
import { useScKurulum } from "@/store/useScKurulum";
import { AyarBolum, BosDurum, AyarButon, Anahtar } from "@/components/kabuk/sc/SCAyarParcalari";
import { cn } from "@/lib/utils";

/* ============================================================
   AYARLAR › AI ÇALIŞANLAR — Claude'un ayar dili.

   Higgsfield marketplace sunumu tamamen kaldırıldı: ALL-CAPS hero, asılı
   kimlik kartları (kordonlu rozet animasyonu), 3:2 gradyan kapak ızgarası,
   "Keşfet / Çalışanlarım" segment barı ve tam ekran oluşturma modalı.

   Claude karşılığı: tek sütun LİSTE. Her satır — ikon · ad(+doğrulama) · özet ·
   sağda açma/kapama anahtarı. Üstte tek arama, altta "Yeni çalışan" satırı.
   ============================================================ */

/** Yeni çalışan isteminde hızlı başlangıç şablonları. */
const SABLONLAR = [
  { ad: "UGC Üretici", istem: "Kısa-form video reklamları için kanca, senaryo ve çekim listesi yazan bir UGC üreticisi." },
  { ad: "Araştırmacı", istem: "Derin web araştırması yapıp kaynaklı raporlar yazan bir araştırmacı." },
  { ad: "Oyun Geliştirici", istem: "Tarayıcıda çalışan küçük oyunlar tasarlayıp kodlayan bir oyun geliştirici." },
  { ad: "Kişisel Yönetici", istem: "Görevlerimi, takvimimi ve önceliklerimi yöneten bir kişisel yönetici." },
];

export default function CalisanlarAyar() {
  const router = useRouter();
  const [ara, setAra] = useState("");
  const [olusturAcik, setOlusturAcik] = useState(false);
  const [metin, setMetin] = useState("");
  /* Açık/kapalı durumu KALICI store'da (önce useState'teydi → yenilemede
     ayar kayboluyordu). Selector düz dizi döndürür (.filter/.map YOK). */
  const acikListe = useScKurulum((s) => s.calisanlar);
  const calisanDegistir = useScKurulum((s) => s.calisanDegistir);
  const kurulu = useMemo(() => new Set(acikListe), [acikListe]);

  const q = ara.trim().toLocaleLowerCase("tr");
  const liste = useMemo(
    () => (!q ? CALISANLAR : CALISANLAR.filter((c) =>
      `${c.ad} ${c.ozet} ${c.kategori}`.toLocaleLowerCase("tr").includes(q))),
    [q],
  );
  const acikSayi = CALISANLAR.filter((c) => kurulu.has(c.slug)).length;

  const degistir = (c: Calisan) => {
    const acilacak = !kurulu.has(c.slug);
    calisanDegistir(c.slug);
    if (acilacak) toast.success(`${c.ad} açıldı`); else toast(`${c.ad} kapatıldı`);
  };

  /** İstemden gerçek sohbet başlat — çalışan oluşturma akışı korunuyor. */
  const olustur = (istem: string) => {
    const t = istem.trim();
    if (t.length < 4) return;
    const sc = useSupercomputer.getState();
    const id = sc.sohbetAc("Yeni AI çalışan oluştur");
    sc.mesajEkle(id, { rol: "kullanici", metin: `Bir AI çalışan oluştur: ${t}` });
    sc.calisiyorAyarla(id, true);
    setOlusturAcik(false);
    router.push(`/panel/supercomputer/${id}`);
  };

  return (
    <div className="space-y-6">
      <AyarBolum
        baslik="AI Çalışanlar"
        ozet="Her çalışan kendi hafızası, becerileri ve bağlayıcılarıyla belirli bir işi yapar. Açık olanlar composer'dan çağrılabilir."
        sagUst={
          <AyarButon onClick={() => { setMetin(""); setOlusturAcik(true); }}>
            <Plus className="h-4 w-4" strokeWidth={2.2} /> Yeni çalışan
          </AyarButon>
        }
      >
        {/* Arama — Claude'da liste içi sade alan (yuvarlak hap değil). */}
        <div className="flex items-center gap-2.5 border-b border-[var(--sc-kenar)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" strokeWidth={1.9} />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Çalışan ara"
            className="w-full bg-transparent text-[14px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]"
          />
          <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">
            {acikSayi}/{CALISANLAR.length} açık
          </span>
        </div>

        {liste.length === 0 ? (
          <BosDurum
            ikon={Search}
            baslik="Eşleşen çalışan yok"
            ozet={`"${ara}" ile eşleşen bir çalışan bulunamadı.`}
          />
        ) : (
          <ul>
            {liste.map((c) => {
              const bu = kurulu.has(c.slug);
              return (
                <li key={c.slug}
                  className="flex items-center gap-3 border-b border-[var(--sc-kenar)] px-4 py-3.5 last:border-b-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sc-cip)] text-[var(--sc-metin-2)]">
                    <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>
                  {/* Ad + özet detay sayfasına götürür (detay ekranı korunuyor). */}
                  <Link href={`/panel/supercomputer/calisanlar/${c.slug}`}
                    className="group/c min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-medium text-[var(--sc-metin)] group-hover/c:text-[var(--sc-aksan)]">
                        {c.ad}
                      </span>
                      {c.dogrulanmis && (
                        <BadgeCheck className="h-[14px] w-[14px] shrink-0 text-[var(--sc-aksan)]" aria-label="Doğrulanmış" role="img" />
                      )}
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)] opacity-0 transition-opacity group-hover/c:opacity-100" />
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[var(--sc-metin-3)]">
                      {c.kategori} · {c.ozet}
                    </span>
                  </Link>
                  <Anahtar acik={bu} onDegis={() => degistir(c)} etiket={`${c.ad} çalışanını ${bu ? "kapat" : "aç"}`} />
                </li>
              );
            })}
          </ul>
        )}
      </AyarBolum>

      {/* Yeni çalışan — Claude'da tam ekran wizard yok, satır içi genişleyen alan. */}
      {olusturAcik && (
        <AyarBolum
          baslik="Yeni çalışan oluştur"
          ozet="Çalışanın ne yapacağını anlat; hafıza, beceri ve bağlayıcıları sonra ekleyebilirsin."
          sagUst={
            <button onClick={() => setOlusturAcik(false)} aria-label="Kapat"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]">
              <X className="h-4 w-4" />
            </button>
          }
        >
          <div className="px-4 py-3.5">
            <textarea
              autoFocus
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); olustur(metin); }
                if (e.key === "Escape") setOlusturAcik(false);
              }}
              rows={3}
              placeholder="Örn: Instagram Reels için kanca ve senaryo yazan bir içerik üreticisi…"
              className="w-full resize-none rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-3 py-2.5 text-[14px] leading-relaxed text-[var(--sc-metin)] outline-none transition-colors placeholder:text-[var(--sc-metin-3)] focus:border-[var(--sc-aksan)]"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SABLONLAR.map((s) => (
                <button key={s.ad} onClick={() => setMetin(s.istem)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border border-[var(--sc-kenar)] px-2.5 py-1.5 text-[13px] transition-colors",
                    metin === s.istem
                      ? "bg-[var(--sc-aksan-zayif)] text-[var(--sc-aksan)]"
                      : "bg-[var(--sc-kart)] text-[var(--sc-metin-2)] hover:bg-[var(--sc-cip)]",
                  )}>
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.9} /> {s.ad}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <AyarButon ikincil onClick={() => setOlusturAcik(false)}>İptal</AyarButon>
              <AyarButon disabled={metin.trim().length < 4} onClick={() => olustur(metin)}>
                <Sparkles className="h-4 w-4" strokeWidth={2} /> Oluştur
              </AyarButon>
            </div>
          </div>
        </AyarBolum>
      )}
    </div>
  );
}
