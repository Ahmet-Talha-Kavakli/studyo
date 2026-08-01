"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, RefreshCcw, GitBranch, Ban, Coins, Trash2, ShieldAlert, MessageSquare,
  Check, ChevronRight, Clock, Play,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { Kart, Rozet, Dugme, AD, AdIkon, DurumNokta } from "@/components/admin/ui/temel";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminJob, type JobIslem } from "@/store/admin/useAdminJob";
import { veri, kullaniciBul } from "@/lib/admin/seed";
import { jobInput, jobTimeline, jobMaliyet, jobPayload, jobModerasyon } from "@/lib/admin/seed/jobDetay";
import { onizlemeArka } from "@/lib/utils";
import { JOB_DURUM, TUR_ETIKET } from "@/lib/admin/etiketler";
import { PLAN_ADI } from "@/store/useAuth";
import { para, dolar, sayi, tarihSaat, goreceZaman } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function JobDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const jobStore = useAdminJob();
  const { joblar } = veri();
  const jHam = joblar.find((x) => x.id === id);
  if (!jHam) notFound();
  // Efektif durum: store delta'sı seed üstüne uygulanır
  const efektifDurum = jobStore.durumGetir(id) ?? jHam.durum;
  const efektifOncelik = jobStore.oncelikGetir(id) ?? jHam.oncelik;
  const j = { ...jHam, durum: efektifDurum as typeof jHam.durum, oncelik: efektifOncelik };
  const islemGecmis = jobStore.jobIslemleri(id);
  const kul = kullaniciBul(j.kullaniciId);

  const inp = useMemo(() => jobInput(j), [j]);
  const timeline = useMemo(() => jobTimeline(j), [j]);
  const maliyet = useMemo(() => jobMaliyet(j), [j]);
  const payload = useMemo(() => jobPayload(j), [j]);
  const mod = useMemo(() => jobModerasyon(j), [j]);
  const [payloadAcik, setPayloadAcik] = useState(false);

  const admin = oturum.aktifAdmin ?? "admin";
  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik") =>
    oturum.denetle({ admin, rol: oturum.aktifRol!, eylem, hedef: j.id, onem, arac: "manuel" });

  // Gerçek job aksiyonu — store'a yazar, durum efektif değişir, işlem geçmişine düşer.
  const aksiyon = async (
    baslik: string, risk: 0 | 1, tur: JobIslem["tur"],
    opts: { yeniDurum?: string; onem?: "bilgi" | "uyari" | "kritik"; toast?: string } = {},
  ) => {
    const ok = await onayIste({ baslik, aciklama: `${j.modelAd} · ${j.id}`, risk, eylemEtiket: "Uygula" });
    if (!ok) return;
    if (opts.yeniDurum) jobStore.durumDegistir(id, opts.yeniDurum);
    jobStore.islemEkle({ jobId: id, tur, yapan: admin, detay: baslik });
    denetle(baslik, opts.onem ?? "bilgi");
    toast.success(opts.toast ?? "İşlem uygulandı");
  };
  const oncelikVer = async () => {
    const ok = await onayIste({ baslik: "Öncelik ver (10/10)", aciklama: `${j.id} kuyrukta en öne alınır.`, risk: 0, eylemEtiket: "Öncele" });
    if (!ok) return;
    jobStore.oncelikVer(id, 10);
    jobStore.islemEkle({ jobId: id, tur: "oncelik", yapan: admin, detay: "Öncelik 10/10" });
    denetle("Öncelik verildi (10/10)", "bilgi");
    toast.success("Öncelik verildi");
  };

  return (
    <RotaGuard modul="joblar">
      <Link href="/admin/joblar" className={cn("mb-4 inline-flex items-center gap-1.5 text-sm font-medium", AD.metin2)}>
        <ArrowLeft className="h-4 w-4" /> Joblar
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sol: Output önizleme + aksiyonlar */}
        <div className="space-y-4">
          <Kart>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cn("text-sm font-bold", AD.metin)}>Çıktı önizleme</h3>
              <Rozet ton={JOB_DURUM[j.durum].ton}>{JOB_DURUM[j.durum].ad}</Rozet>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl" style={{ background: onizlemeArka(j.id, j.tur === "ses" || j.tur === "muzik" ? "soyut" : "sinematik") }}>
              {(j.tur === "video") && <div className="absolute inset-0 flex items-center justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur"><Play className="h-5 w-5 text-white" /></span></div>}
              {j.durum === "hata" && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><span className="text-sm font-semibold text-rose-300">Üretim başarısız</span></div>}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px]">
              <Rozet ton="notr">{TUR_ETIKET[j.tur]}</Rozet>
              <span className={AD.metin3}>{inp.cozunurluk} · {inp.oran}{j.tur === "video" && ` · ${inp.sure}`}</span>
            </div>
          </Kart>

          <Kart>
            <p className={cn("mb-3 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Aksiyonlar</p>
            <div className="flex flex-wrap gap-2">
              <Dugme boyut="sm" ikon={RefreshCcw} onClick={() => aksiyon("Ücretsiz yeniden çalıştır", 0, "retry", { yeniDurum: "kuyrukta", toast: "Yeniden kuyruğa alındı" })}>Yeniden çalıştır</Dugme>
              <Dugme boyut="sm" tur="glass" ikon={GitBranch} onClick={() => aksiyon("Farklı provider ile çalıştır", 0, "retry", { yeniDurum: "kuyrukta" })}>Farklı provider</Dugme>
              <Dugme boyut="sm" tur="glass" ikon={Clock} onClick={oncelikVer}>Öncelik ver</Dugme>
              <Dugme boyut="sm" tur="glass" ikon={Coins} onClick={() => aksiyon("Kredi iade et", 1, "iade", { onem: "kritik", toast: "Kredi iade edildi" })}>Kredi iade</Dugme>
              <Dugme boyut="sm" tur="glass" ikon={ShieldAlert} onClick={() => aksiyon("Moderasyona gönder", 0, "moderasyon")}>Moderasyon</Dugme>
              <Dugme boyut="sm" tur="glass" ikon={MessageSquare} onClick={() => aksiyon("Kullanıcıya mesaj at", 0, "moderasyon")}>Mesaj at</Dugme>
              <Dugme boyut="sm" tur="tehlike" ikon={Ban} onClick={() => aksiyon("Job'u iptal et", 1, "iptal", { yeniDurum: "iptal", onem: "uyari", toast: "Job iptal edildi" })}>İptal</Dugme>
              <Dugme boyut="sm" tur="tehlike" ikon={Trash2} onClick={() => aksiyon("Çıktıyı sil", 1, "sil", { onem: "uyari", toast: "Çıktı silindi" })}>Çıktıyı sil</Dugme>
            </div>
            {islemGecmis.length > 0 && (
              <div className="mt-4 border-t border-[color:var(--ad-kenar)] pt-3">
                <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wider", AD.metin3)}>Admin işlem geçmişi</p>
                <div className="space-y-1.5">
                  {islemGecmis.map((i) => (
                    <div key={i.id} className="flex items-center gap-2 text-[12px]">
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className={AD.metin}>{i.detay}</span>
                      <span className={cn("ml-auto", AD.metin3)}>{i.yapan} · {goreceZaman(i.tarih)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Kart>

          {/* Kullanıcı özeti */}
          {kul && (
            <Link href={`/admin/kullanicilar/${kul.id}`}>
              <Kart hover className="!p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-[11px] font-bold text-[#04222c]">{kul.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
                  <div className="min-w-0 flex-1"><div className={cn("truncate text-[13px] font-medium", AD.metin)}>{kul.ad}</div><div className={cn("text-[11px]", AD.metin3)}>{PLAN_ADI[kul.plan as keyof typeof PLAN_ADI]} · {sayi(kul.krediBakiye)} kredi</div></div>
                  <ChevronRight className="h-4 w-4 text-[color:var(--ad-metin-3)]" />
                </div>
              </Kart>
            </Link>
          )}
        </div>

        {/* Sağ: detaylar */}
        <div className="space-y-4 lg:col-span-2">
          {/* Timeline */}
          <Kart>
            <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Clock className="h-4 w-4 text-[color:var(--ad-aksan)]" /> İşlem timeline'ı</h3>
            <div className="relative space-y-3 border-l-2 border-[color:var(--ad-kenar)] pl-6">
              {timeline.map((t, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-[color:var(--ad-yuzey)]"
                    style={{ background: t.durum === "tamam" ? "var(--ad-basari)" : t.durum === "aktif" ? "var(--ad-aksan)" : t.durum === "hata" ? "var(--ad-tehlike)" : "var(--ad-kenar-2)" }}>
                    {t.durum === "tamam" && <Check className="h-2.5 w-2.5 text-black" />}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[13px]", t.durum === "bekliyor" ? AD.metin3 : AD.metin)}>{t.ad}</span>
                    <span className={cn("text-[11px] tabular-nums", AD.metin3)}>{t.durum !== "bekliyor" ? `${tarihSaat(t.zaman)} · ${(t.sureMs / 1000).toFixed(1)}sn` : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </Kart>

          {/* Input parametreleri + Maliyet + Moderasyon */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Kart>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Girdi parametreleri</h3>
              <div className="space-y-1.5 text-[13px]">
                {[["Prompt", inp.prompt], ["Negatif", inp.negatif], ["Seed", sayi(inp.seed)], ["Steps", String(inp.steps)], ["CFG", String(inp.cfg)], ["Çözünürlük", inp.cozunurluk], ["Oran", inp.oran], ...(j.tur === "video" ? [["Süre", inp.sure], ["FPS", String(inp.fps)]] : [])].map(([k2, v]) => (
                  <div key={k2} className="flex gap-2"><span className={cn("w-24 shrink-0", AD.metin3)}>{k2}</span><span className={cn("min-w-0 flex-1 break-words", AD.metin)}>{v}</span></div>
                ))}
              </div>
            </Kart>
            <div className="space-y-4">
              <Kart>
                <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Maliyet kırılımı</h3>
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between"><span className={AD.metin3}>Provider ücreti</span><span className="tabular-nums text-[color:var(--ad-metin)]">{dolar(maliyet.providerUsd)}</span></div>
                  <div className="flex justify-between"><span className={AD.metin3}>Storage</span><span className="tabular-nums text-[color:var(--ad-metin)]">{dolar(maliyet.storageUsd)}</span></div>
                  <div className="flex justify-between"><span className={AD.metin3}>Alınan kredi</span><span className="tabular-nums text-[color:var(--ad-metin)]">{maliyet.alinanKredi}</span></div>
                  <div className="flex justify-between border-t border-[color:var(--ad-kenar)] pt-1.5"><span className={AD.metin3}>Gelir</span><span className="tabular-nums text-emerald-400">{para(maliyet.gelirTry)}</span></div>
                  <div className="flex justify-between"><span className={AD.metin3}>Maliyet</span><span className="tabular-nums text-rose-400">{para(maliyet.maliyetTry)}</span></div>
                  <div className="flex justify-between font-bold"><span className={AD.metin}>Net marj</span><span className="tabular-nums" style={{ color: maliyet.netMarj >= 0 ? "var(--ad-basari)" : "var(--ad-tehlike)" }}>{para(maliyet.netMarj)}</span></div>
                </div>
              </Kart>
              <Kart>
                <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Moderasyon</h3>
                <div className="mb-2 flex items-center gap-2">
                  <DurumNokta ton={mod.sonuc === "temiz" ? "basari" : mod.sonuc === "flag" ? "uyari" : "tehlike"} />
                  <Rozet ton={mod.sonuc === "temiz" ? "basari" : mod.sonuc === "flag" ? "uyari" : "tehlike"}>{mod.sonuc}</Rozet>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                  {[["NSFW", mod.nsfw], ["Şiddet", mod.siddet], ["Ünlü", mod.unlu], ["Telif", mod.telif]].map(([k2, v]) => (
                    <div key={k2 as string} className="flex justify-between"><span className={AD.metin3}>{k2}</span><span className="tabular-nums" style={{ color: (v as number) > 0.5 ? "var(--ad-tehlike)" : (v as number) > 0.3 ? "var(--ad-uyari)" : "var(--ad-metin)" }}>{((v as number) * 100).toFixed(0)}%</span></div>
                  ))}
                </div>
              </Kart>
            </div>
          </div>

          {/* Provider payload */}
          <Kart>
            <button onClick={() => setPayloadAcik((v) => !v)} className="flex w-full items-center justify-between">
              <h3 className={cn("text-sm font-bold", AD.metin)}>Provider request/response payload</h3>
              <ChevronRight className={cn("h-4 w-4 text-[color:var(--ad-metin-3)] transition-transform", payloadAcik && "rotate-90")} />
            </button>
            {payloadAcik && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className={cn("mb-1.5 text-[11px] font-semibold uppercase", AD.metin3)}>İstek</p>
                  <pre className="ad-ince-scroll overflow-x-auto rounded-lg border border-[color:var(--ad-kenar)] bg-black/30 p-3 text-[12px] text-[color:var(--ad-metin-2)]">{JSON.stringify(payload.istek, null, 2)}</pre>
                </div>
                <div>
                  <p className={cn("mb-1.5 text-[11px] font-semibold uppercase", AD.metin3)}>Yanıt {j.durum === "hata" && <span className="text-rose-400">· HATA</span>}</p>
                  <pre className="ad-ince-scroll overflow-x-auto rounded-lg border border-[color:var(--ad-kenar)] bg-black/30 p-3 text-[12px] text-[color:var(--ad-metin-2)]">{JSON.stringify(payload.yanit, null, 2)}</pre>
                </div>
              </div>
            )}
          </Kart>

          {/* Meta */}
          <Kart className="!p-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
              <span className={AD.metin3}>ID: <span className="font-mono text-[color:var(--ad-metin)]">{j.id}</span></span>
              <span className={AD.metin3}>Provider: <span className={AD.metin}>{j.saglayici}</span></span>
              <span className={AD.metin3}>Öncelik: <span className={AD.metin}>{j.oncelik}/10</span></span>
              <span className={AD.metin3}>Oluşturma: <span className={AD.metin}>{goreceZaman(j.olusturma)}</span></span>
              {j.hataKodu && <span className={AD.metin3}>Hata: <span className="font-mono text-rose-400">{j.hataKodu}</span></span>}
            </div>
          </Kart>
        </div>
      </div>
    </RotaGuard>
  );
}
