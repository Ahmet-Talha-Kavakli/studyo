"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ListChecks } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BilgiSatir, Bos, HataKutusu, Kart, KartBaslik, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { JOB_DURUM, JOB_TUR } from "@/lib/admin/isEtiket";
import { useAdminVeri, sayi, sure, tarihSaat } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Satir { id: string; tur: string; ad: string; kaynak: string; durum: string; zaman: number; sure?: number; kredi: number; uid?: string; email?: string; ayrinti?: string }
interface Hareket { sira: number; id: string; zaman: number; tur: string; miktar: number; bakiye: number; kaynak: string; aciklama: string }
interface Adim { tur: string; ad: string; baslik: string; durum: string; sure: number; hata?: string; cikti?: string }
type Ayrinti =
  | { tur: "studyo"; satir: Satir | null; hareket: Hareket; ilgili: Hareket[] }
  | { tur: "ajan"; satir: Satir | null; ajan: string; calisma: { durum: string; kanal: string; model: string; baslangic: number; bitis?: number; sure: number; kredi: number; kullanim?: { girdi: number; cikti: number }; girdi: string; cikti: string; hata?: string }; adimlar: Adim[] }
  | { tur: "sistem"; satir: Satir | null; sistem: string; calisma: { durum: string; baslangic: number; bitis?: number; kredi?: number; hata?: string } | null; adimlar: Adim[] };

export default function JobDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { veri: v, hata, yenile } = useAdminVeri<Ayrinti & { ok: true }>(`/api/admin/joblar/${encodeURIComponent(decodeURIComponent(id))}`);
  const s = v?.satir;
  return (
    <RotaGuard modul="joblar">
      <Link href="/admin/joblar" className={cn("mb-4 inline-flex items-center gap-1.5 text-sm hover:text-[color:var(--ad-metin)]", AD.metin2)}><ArrowLeft className="h-4 w-4" /> İşler</Link>
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!v && !hata && <Yukleniyor satir={3} />}
      {v && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Kart className="lg:col-span-1">
            <KartBaslik ikon={ListChecks}>{s?.ad ?? (v.tur === "ajan" ? v.ajan : v.tur === "sistem" ? v.sistem : "İş")}</KartBaslik>
            {s && <div className="mb-3"><Rozet ton={JOB_DURUM[s.durum]?.ton ?? "notr"}>{JOB_DURUM[s.durum]?.ad ?? s.durum}</Rozet></div>}
            <BilgiSatir etiket="Tür">{JOB_TUR[s?.tur ?? v.tur] ?? v.tur}</BilgiSatir>
            {s && <BilgiSatir etiket="Kaynak">{s.kaynak}</BilgiSatir>}
            {s && <BilgiSatir etiket="Zaman">{tarihSaat(s.zaman)}</BilgiSatir>}
            {s && <BilgiSatir etiket="Kredi">{sayi(s.kredi)}</BilgiSatir>}
            {s?.sure !== undefined && <BilgiSatir etiket="Süre">{sure(s.sure)}</BilgiSatir>}
            {s?.uid && <BilgiSatir etiket="Hesap"><Link href={`/admin/kullanicilar/${s.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{s.email}</Link></BilgiSatir>}
            <BilgiSatir etiket="Kimlik"><span className="font-mono text-[11px]">{decodeURIComponent(id)}</span></BilgiSatir>
          </Kart>

          <div className="space-y-4 lg:col-span-2">
            {v.tur === "studyo" && (
              <>
                <Kart>
                  <KartBaslik>Defter kaydı</KartBaslik>
                  <BilgiSatir etiket="Açıklama">{v.hareket.aciklama}</BilgiSatir>
                  <BilgiSatir etiket="Kaynak">{v.hareket.kaynak}</BilgiSatir>
                  <BilgiSatir etiket="Kesilen">{sayi(-v.hareket.miktar)} kredi</BilgiSatir>
                  <BilgiSatir etiket="Sonraki bakiye">{sayi(v.hareket.bakiye)}</BilgiSatir>
                  <BilgiSatir etiket="Sıra">{v.hareket.sira}</BilgiSatir>
                  {s?.ayrinti && <BilgiSatir etiket="Sonuç">{s.ayrinti}</BilgiSatir>}
                </Kart>
                <Kart>
                  <KartBaslik>Aynı kaynaktan yakın hareketler</KartBaslik>
                  {v.ilgili.length <= 1 ? <p className={cn("text-sm", AD.metin3)}>Başka hareket yok.</p> : v.ilgili.map((x) => (
                    <div key={x.id} className="flex items-center justify-between gap-3 border-b border-[color:var(--ad-kenar)] py-2 text-[13px] last:border-0">
                      <span className={cn("min-w-0 truncate", x.sira === v.hareket.sira ? AD.metin : AD.metin2)}>{tarihSaat(x.zaman)} · {x.aciklama}</span>
                      <span className="shrink-0 tabular-nums" style={{ color: x.miktar > 0 ? "var(--ad-basari)" : "var(--ad-metin)" }}>{x.miktar > 0 ? `artı ${x.miktar}` : `eksi ${-x.miktar}`}</span>
                    </div>
                  ))}
                </Kart>
                <p className={cn("text-[12px]", AD.metin3)}>Stüdyo üretimlerinin istem ve çıktısı yalnız kullanıcının kendi kitaplığında tutulur; sunucu defterinde açıklama, kaynak ve tutar bulunur.</p>
              </>
            )}
            {v.tur === "ajan" && (
              <>
                <Kart>
                  <KartBaslik>Çalışma</KartBaslik>
                  <BilgiSatir etiket="Ajan">{v.ajan}</BilgiSatir>
                  <BilgiSatir etiket="Kanal ve model">{v.calisma.kanal}, {v.calisma.model}</BilgiSatir>
                  <BilgiSatir etiket="Süre">{sure(v.calisma.sure)}</BilgiSatir>
                  {v.calisma.kullanim && <BilgiSatir etiket="Belirteç">{sayi(v.calisma.kullanim.girdi)} girdi, {sayi(v.calisma.kullanim.cikti)} çıktı</BilgiSatir>}
                  {v.calisma.hata && <BilgiSatir etiket="Hata"><span className="text-rose-300">{v.calisma.hata}</span></BilgiSatir>}
                </Kart>
                <Kart>
                  <KartBaslik>Girdi ve çıktı</KartBaslik>
                  <p className={cn("mb-1 text-[12px]", AD.metin3)}>Girdi</p>
                  <pre className="ad-ince-scroll mb-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-[color:var(--ad-kenar)] bg-black/20 p-3 text-[12px] text-[color:var(--ad-metin-2)]">{v.calisma.girdi || "Boş"}</pre>
                  <p className={cn("mb-1 text-[12px]", AD.metin3)}>Çıktı</p>
                  <pre className="ad-ince-scroll max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-[color:var(--ad-kenar)] bg-black/20 p-3 text-[12px] text-[color:var(--ad-metin-2)]">{v.calisma.cikti || "Boş"}</pre>
                </Kart>
                <Adimlar adimlar={v.adimlar} />
              </>
            )}
            {v.tur === "sistem" && (
              <>
                <Kart>
                  <KartBaslik>Çalışma</KartBaslik>
                  <BilgiSatir etiket="Sistem">{v.sistem}</BilgiSatir>
                  {v.calisma ? (
                    <>
                      <BilgiSatir etiket="Başlangıç">{tarihSaat(v.calisma.baslangic)}</BilgiSatir>
                      {v.calisma.bitis && <BilgiSatir etiket="Bitiş">{tarihSaat(v.calisma.bitis)}</BilgiSatir>}
                      {v.calisma.hata && <BilgiSatir etiket="Hata"><span className="text-rose-300">{v.calisma.hata}</span></BilgiSatir>}
                    </>
                  ) : <p className={cn("text-sm", AD.metin3)}>Çalışmanın ayrıntı dosyası bulunamadı; yalnız özet var.</p>}
                </Kart>
                <Adimlar adimlar={v.adimlar} />
              </>
            )}
          </div>
        </div>
      )}
    </RotaGuard>
  );
}

function Adimlar({ adimlar }: { adimlar: Adim[] }) {
  return (
    <Kart>
      <KartBaslik>Adımlar</KartBaslik>
      {adimlar.length === 0 ? <Bos baslik="Adım kaydı yok" /> : (
        <ol className="space-y-2">
          {adimlar.map((a, i) => (
            <li key={i} className="rounded-xl border border-[color:var(--ad-kenar)] px-3 py-2 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("min-w-0 truncate", AD.metin)}>{i + 1}. {a.baslik || a.ad}</span>
                <span className={cn("shrink-0 text-[12px]", a.hata ? "text-rose-300" : AD.metin3)}>{a.durum}{a.sure ? `, ${sure(a.sure)}` : ""}</span>
              </div>
              {a.hata && <p className="mt-1 text-[12px] text-rose-300">{a.hata}</p>}
              {a.cikti && <p className={cn("mt-1 line-clamp-3 text-[12px]", AD.metin3)}>{a.cikti}</p>}
            </li>
          ))}
        </ol>
      )}
    </Kart>
  );
}
