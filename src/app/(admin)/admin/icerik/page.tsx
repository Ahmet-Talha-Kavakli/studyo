"use client";

import { useMemo, useState } from "react";
import { FileText, ExternalLink, EyeOff, Share2 } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { useOnay } from "@/components/admin/ui/Onay";
import { AD, AramaKutu, BolumBaslik, Bos, FiltreCip, HataKutusu, MetrikKart, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { useAdminVeri, adminIslem, sayi, bayt, gorece } from "@/lib/admin/istemci";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Paylasim { tur: string; turAd: string; id: string; baslik: string; olusturma: number; guncelleme: number; adres: string; boyut: number; ozet?: string }
interface EarnBasvuru { id: string; uid: string; email: string; kampanyaAd: string; platform: string; link: string; tarih: number; durum: "inceleme" | "onaylandi" | "reddedildi"; red?: string; itiraz?: "inceleniyor" | "reddedildi"; kontrol?: { gercek: boolean; sahibiMi: boolean | null } }
interface Rapor { paylasimlar: Paylasim[]; turler: { id: string; ad: string; yol: string }[]; earn?: EarnBasvuru[] }

const EARN_DURUM: Record<EarnBasvuru["durum"], { ad: string; sinif: string }> = {
  inceleme: { ad: "İncelemede", sinif: "text-amber-300" },
  onaylandi: { ad: "Onaylandı", sinif: "text-emerald-300" },
  reddedildi: { ad: "Reddedildi", sinif: "text-rose-300" },
};

/** Vayra Earn başvuruları: kullanıcıların kampanyaya gönderdiği bağlantılar. Durum yalnız buradaki kararla değişir. */
function EarnBasvurulari({ liste, yenile }: { liste: EarnBasvuru[]; yenile: () => void }) {
  const [sure, setSure] = useState<"bekleyen" | "hepsi">("bekleyen");
  const [redId, setRedId] = useState<string | null>(null);
  const [redMetin, setRedMetin] = useState("");
  const [mesgul, setMesgul] = useState<string | null>(null);
  const bekleyen = liste.filter((b) => b.durum === "inceleme" || b.itiraz === "inceleniyor");
  const l = sure === "bekleyen" ? bekleyen : liste;
  const karar = async (b: EarnBasvuru, durum: "onaylandi" | "reddedildi") => {
    setMesgul(b.id);
    const s = await adminIslem("/api/admin/icerik/earn", { uid: b.uid, id: b.id, durum, red: durum === "reddedildi" ? redMetin : "" });
    setMesgul(null);
    if (!s.ok) { toast.error(s.hata); return; }
    toast.success(durum === "onaylandi" ? "Başvuru onaylandı" : "Başvuru reddedildi");
    setRedId(null); setRedMetin("");
    yenile();
  };
  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className={cn("text-[15px] font-semibold", AD.metin)}>Earn başvuruları</h2>
        <span className={cn("text-[12px]", AD.metin3)}>{sayi(bekleyen.length)} inceleme bekliyor</span>
        <div className="ml-auto flex gap-2">
          <FiltreCip aktif={sure === "bekleyen"} onClick={() => setSure("bekleyen")}>Bekleyen</FiltreCip>
          <FiltreCip aktif={sure === "hepsi"} onClick={() => setSure("hepsi")}>Hepsi ({sayi(liste.length)})</FiltreCip>
        </div>
      </div>
      {l.length === 0 ? <Bos ikon={FileText} baslik={liste.length ? "İnceleme bekleyen başvuru yok" : "Henüz Earn başvurusu yok"} /> : (
        <BasitTablo baslik={["Başvuru", "Kullanıcı", "Bağlantı", "Durum", ""]} enAz={860}>
          {l.map((b) => (
            <tr key={b.id} className={satirSinif}>
              <td className={hucre}><div className={cn("max-w-[260px] truncate", AD.metin)}>{b.kampanyaAd}</div><div className={cn("text-[11px]", AD.metin3)}>{b.platform} · {gorece(b.tarih)}{b.kontrol ? (b.kontrol.gercek ? (b.kontrol.sahibiMi === false ? " · sahibi eşleşmedi" : " · bağlantı doğrulandı") : " · otomatik kontrol yapılamadı") : ""}</div></td>
              <td className={cn(hucre, AD.metin2)}><div className="max-w-[200px] truncate">{b.email}</div></td>
              <td className={hucre}><a href={b.link} target="_blank" rel="noreferrer" className="inline-flex max-w-[240px] items-center gap-1 truncate text-[12px] text-[color:var(--ad-aksan)] hover:underline"><span className="truncate">{b.link.replace(/^https:\/\/(www\.)?/, "")}</span><ExternalLink className="h-3 w-3 shrink-0" /></a></td>
              <td className={cn(hucre, "whitespace-nowrap text-[12.5px]", EARN_DURUM[b.durum].sinif)}>{EARN_DURUM[b.durum].ad}{b.itiraz === "inceleniyor" ? ", itiraz var" : ""}{b.red ? <div className={cn("max-w-[200px] truncate text-[11px]", AD.metin3)}>{b.red}</div> : null}</td>
              <td className={cn(hucre, "text-right")}>
                {redId === b.id ? (
                  <div className="flex items-center justify-end gap-2">
                    <input value={redMetin} onChange={(e) => setRedMetin(e.target.value)} placeholder="Ret gerekçesi" maxLength={300}
                      className="h-8 w-48 rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-2.5 text-[12px] text-[color:var(--ad-metin)] outline-none" />
                    <button disabled={mesgul === b.id} onClick={() => karar(b, "reddedildi")} className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[12px] font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">Reddet</button>
                    <button onClick={() => { setRedId(null); setRedMetin(""); }} className={cn("px-1.5 text-[12px]", AD.metin3)}>Vazgeç</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    {(b.durum !== "onaylandi" || b.itiraz === "inceleniyor") && <button disabled={mesgul === b.id} onClick={() => karar(b, "onaylandi")} className="rounded-lg border border-emerald-400/30 px-2.5 py-1 text-[12px] font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50">Onayla</button>}
                    {(b.durum !== "reddedildi" || b.itiraz === "inceleniyor") && <button onClick={() => setRedId(b.id)} className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[12px] font-semibold text-rose-300 hover:bg-rose-500/10">Reddet</button>}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </BasitTablo>
      )}
      <p className={cn("mt-3 text-[12px]", AD.metin3)}>Başvurular zamanla kendiliğinden onaylanmaz. Kazanç defteri ve ödeme henüz yok; onay yalnız başvurunun kampanya kurallarına uyduğunu kaydeder. Her karar denetim günlüğüne yazılır.</p>
    </section>
  );
}

export default function Icerik() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/icerik");
  const { onayIste } = useOnay();
  const [tur, setTur] = useState("hepsi");
  const [q, setQ] = useState("");
  const l = useMemo(() => {
    if (!r) return [];
    const s = q.trim().toLocaleLowerCase("tr");
    return r.paylasimlar.filter((p) => (tur === "hepsi" || p.tur === tur) && (!s || p.baslik.toLocaleLowerCase("tr").includes(s) || p.id.includes(q.trim()) || (p.ozet ?? "").toLocaleLowerCase("tr").includes(s)));
  }, [r, tur, q]);

  const kaldir = async (p: Paylasim) => {
    const ok = await onayIste({ baslik: "Yayından kaldır", aciklama: `"${p.baslik}" (${p.adres}) kalıcı olarak kaldırılacak; bağlantı açılmaz olur. Kullanıcının kendi kopyası etkilenmez.`, risk: 1, eylemEtiket: "Kaldır" });
    if (!ok) return;
    const s = await adminIslem("/api/admin/icerik/kaldir", { tur: p.tur, id: p.id });
    if (!s.ok) { toast.error(s.hata); return; }
    toast.success("Paylaşım yayından kaldırıldı");
    yenile();
  };

  return (
    <RotaGuard modul="icerik">
      <BolumBaslik baslik="İçerik" ozet="Kullanıcıların bağlantıyla herkese açtığı paylaşımlar ve Earn başvuruları. Uygunsuz olanı kaldır, başvuruları onayla ya da reddet." ikon={FileText} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={3} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Herkese açık paylaşım" deger={sayi(r.paylasimlar.length)} ikon={Share2} />
            <MetrikKart etiket="Son 7 günde" deger={sayi(r.paylasimlar.filter((p) => p.olusturma > Date.now() - 7 * 86_400_000).length)} ikon={Share2} />
            <MetrikKart etiket="Toplam boyut" deger={bayt(r.paylasimlar.reduce((a, p) => a + p.boyut, 0))} ikon={FileText} alt="yalnız kayıt dosyaları" />
            <MetrikKart etiket="Tür" deger={sayi(new Set(r.paylasimlar.map((p) => p.tur)).size)} ikon={FileText} alt={`toplam ${r.turler.length} tür`} />
          </div>
          <div className="mb-4 mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
              <FiltreCip aktif={tur === "hepsi"} onClick={() => setTur("hepsi")}>Hepsi</FiltreCip>
              {r.turler.map((t) => <FiltreCip key={t.id} aktif={tur === t.id} onClick={() => setTur(t.id)}>{t.ad} ({sayi(r.paylasimlar.filter((p) => p.tur === t.id).length)})</FiltreCip>)}
            </div>
            <AramaKutu deger={q} degis={setQ} yer="Başlık ya da kimlik ara" className="lg:ml-auto lg:w-72" />
          </div>
          {l.length === 0 ? <Bos ikon={Share2} baslik={r.paylasimlar.length ? "Bu süzgeçle paylaşım yok" : "Henüz herkese açık paylaşım yok"} /> : (
            <BasitTablo baslik={["Paylaşım", "Tür", "Adres", "Güncelleme", ""]} enAz={780}>
              {l.map((p) => (
                <tr key={`${p.tur}-${p.id}`} className={satirSinif}>
                  <td className={hucre}><div className={cn("max-w-[320px] truncate", AD.metin)}>{p.baslik}</div>{p.ozet && <div className={cn("max-w-[320px] truncate text-[11px]", AD.metin3)}>{p.ozet}</div>}</td>
                  <td className={cn(hucre, AD.metin2)}>{p.turAd}</td>
                  <td className={hucre}><a href={p.adres} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[12px] text-[color:var(--ad-aksan)] hover:underline">{p.adres}<ExternalLink className="h-3 w-3" /></a></td>
                  <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{gorece(p.guncelleme)}</td>
                  <td className={cn(hucre, "text-right")}><button onClick={() => kaldir(p)} className="inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2.5 py-1 text-[12px] font-semibold text-rose-300 hover:bg-rose-500/10"><EyeOff className="h-3.5 w-3.5" /> Kaldır</button></td>
                </tr>
              ))}
            </BasitTablo>
          )}
          <p className={cn("mt-3 text-[12px]", AD.metin3)}>Paylaşım kayıtları sahibine bağlı tutulmaz; bağlantıyı açan herkes görür. Kaldırma işlemi denetim günlüğüne yazılır.</p>
          <EarnBasvurulari liste={r.earn ?? []} yenile={yenile} />
        </>
      )}
    </RotaGuard>
  );
}
