"use client";

import { useState } from "react";
import { Rocket, CheckCircle2, AlertTriangle, XCircle, RotateCw, ChevronDown, KeyRound, Loader2, PlayCircle } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, BolumBaslik, FiltreCip, HataKutusu, Kart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { useAdminVeri, sorgu, tarihSaat } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

type Durum = "hazir" | "eksik" | "uyari";
interface Madde { id: string; baslik: string; durum: Durum; ozet: string; yapilacak?: string; ayrinti?: { ad: string; deger: string }[] }
interface Bolum { id: string; baslik: string; aciklama: string; maddeler: Madde[] }
interface Degisken { ad: string; aciklama: string; zorunlu?: boolean; gizli?: boolean; tanimli: boolean }
interface Grup { id: string; baslik: string; ozellik: string; kural: "hepsi" | "biri" | "istege-bagli"; acik: boolean; tanimli: number; toplam: number; degiskenler: Degisken[] }
interface Rapor { zaman: number; uretim: boolean; genel: Durum; sayi: Record<Durum, number>; bolumler: Bolum[]; ortam: { gruplar: Grup[]; diger: { ad: string; tanimli: boolean }[] } }

const STIL: Record<Durum, { ad: string; ikon: typeof CheckCircle2; renk: string; ton: "basari" | "uyari" | "tehlike" }> = {
  hazir: { ad: "Hazır", ikon: CheckCircle2, renk: "var(--ad-basari)", ton: "basari" },
  uyari: { ad: "Uyarı", ikon: AlertTriangle, renk: "var(--ad-uyari)", ton: "uyari" },
  eksik: { ad: "Eksik", ikon: XCircle, renk: "var(--ad-tehlike)", ton: "tehlike" },
};
const GENEL_METIN: Record<Durum, string> = {
  hazir: "Bütün maddeler hazır. Sunucu canlıya çıkabilir.",
  uyari: "Zorunlu bir eksik yok, ama gözden geçirilmesi gereken uyarılar var.",
  eksik: "Canlıya çıkmadan önce tamamlanması gereken eksikler var.",
};

function MaddeSatiri({ m }: { m: Madde }) {
  const [acik, setAcik] = useState(m.durum !== "hazir");
  const s = STIL[m.durum];
  return (
    <div className="border-b border-[color:var(--ad-kenar)] last:border-0">
      <button onClick={() => setAcik((x) => !x)} className="flex w-full items-start gap-3 py-3 text-left" aria-expanded={acik}>
        <s.ikon className="mt-0.5 h-4.5 w-4.5 shrink-0" style={{ color: s.renk }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-[14px] font-semibold", AD.metin)}>{m.baslik}</span>
            <Rozet ton={s.ton}>{s.ad}</Rozet>
          </div>
          <p className={cn("mt-0.5 text-[13px]", AD.metin2)}>{m.ozet}</p>
        </div>
        {(m.yapilacak || m.ayrinti?.length) ? <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", AD.metin3, acik && "rotate-180")} /> : null}
      </button>
      {acik && (m.yapilacak || m.ayrinti?.length) ? (
        <div className="mb-3 ml-7.5 space-y-2 pl-0.5">
          {m.yapilacak && <p className="rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] px-3 py-2 text-[13px] leading-relaxed text-[color:var(--ad-metin)]"><span className={AD.aksan}>Ne yapılmalı: </span>{m.yapilacak}</p>}
          {m.ayrinti?.length ? (
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {m.ayrinti.map((a) => <div key={a.ad} className="flex justify-between gap-3 text-[12px]"><span className={AD.metin3}>{a.ad}</span><span className={cn("min-w-0 truncate text-right", AD.metin2)} title={a.deger}>{a.deger}</span></div>)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function YayinHazirligi() {
  const [dene, setDene] = useState(0);
  const [suzgec, setSuzgec] = useState<"hepsi" | "sorun">("hepsi");
  const { veri: r, hata, yenile, yukleniyor } = useAdminVeri<Rapor>(sorgu("/api/admin/yayin", { tarayici: dene ? "1" : "", d: dene || "" }));
  const [ortamAcik, setOrtamAcik] = useState<string | null>(null);

  return (
    <RotaGuard modul="sistem">
      <BolumBaslik baslik="Yayın hazırlığı" ozet="Sunucunun canlıya çıkmaya hazır olup olmadığı. Ortam değişkenlerinin değeri hiçbir zaman gösterilmez." ikon={Rocket}
        sag={<button onClick={yenile} disabled={yukleniyor} className="ad-btn-glass inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold disabled:opacity-50"><RotateCw className={cn("h-4 w-4", yukleniyor && "animate-spin")} /> Yeniden denetle</button>} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={4} />}
      {r && (
        <>
          <div className="ad-glass mb-4 flex flex-col gap-4 p-5 md:flex-row md:items-center">
            {(() => { const s = STIL[r.genel]; return (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${s.renk} 14%, transparent)`, color: s.renk }}><s.ikon className="h-7 w-7" /></span>
            ); })()}
            <div className="min-w-0 flex-1">
              <h2 className={cn("text-lg font-bold", AD.metin)}>{r.genel === "hazir" ? "Yayına hazır" : r.genel === "uyari" ? "Uyarılarla hazır" : "Henüz hazır değil"}</h2>
              <p className={cn("text-sm", AD.metin2)}>{GENEL_METIN[r.genel]}</p>
              <p className={cn("mt-1 text-[12px]", AD.metin3)}>Son denetim {tarihSaat(r.zaman)} · {r.uretim ? "Üretim modu" : "Geliştirme modu"}</p>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
              {(["hazir", "uyari", "eksik"] as Durum[]).map((d) => (
                <div key={d} className="min-w-[78px] rounded-xl border border-[color:var(--ad-kenar)] px-3 py-2">
                  <div className="text-xl font-bold tabular-nums" style={{ color: STIL[d].renk }}>{r.sayi[d]}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>{STIL[d].ad}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <FiltreCip aktif={suzgec === "hepsi"} onClick={() => setSuzgec("hepsi")}>Bütün maddeler</FiltreCip>
            <FiltreCip aktif={suzgec === "sorun"} onClick={() => setSuzgec("sorun")}>Yalnız eksik ve uyarılar ({r.sayi.eksik + r.sayi.uyari})</FiltreCip>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {r.bolumler.map((b) => {
              const l = suzgec === "sorun" ? b.maddeler.filter((m) => m.durum !== "hazir") : b.maddeler;
              if (!l.length) return null;
              const kotu = b.maddeler.some((m) => m.durum === "eksik") ? "eksik" : b.maddeler.some((m) => m.durum === "uyari") ? "uyari" : "hazir";
              return (
                <Kart key={b.id} className="min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className={cn("text-[15px] font-bold", AD.metin)}>{b.baslik}</h3>
                    <Rozet ton={STIL[kotu as Durum].ton}>{STIL[kotu as Durum].ad}</Rozet>
                  </div>
                  <p className={cn("mb-2 text-[12px]", AD.metin3)}>{b.aciklama}</p>
                  {l.map((m) => <MaddeSatiri key={m.id} m={m} />)}
                  {b.id === "arka" && (
                    <button onClick={() => setDene((x) => x + 1)} disabled={yukleniyor} className="ad-btn-glass mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold disabled:opacity-50">
                      {yukleniyor && dene ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />} Tarayıcıyı başlatarak dene
                    </button>
                  )}
                </Kart>
              );
            })}
          </div>

          <h2 className={cn("mb-1 mt-8 flex items-center gap-2 text-[15px] font-bold", AD.metin)}><KeyRound className="h-4.5 w-4.5 text-[color:var(--ad-aksan)]" /> Ortam değişkenleri</h2>
          <p className={cn("mb-3 text-[13px]", AD.metin3)}>Yalnız tanımlı olup olmadığı gösterilir. Önce global çalışmak için gerekenler (sunucu, gizli anahtarlar, e-posta, Stripe, modeller); her grup hangi özelliği açtığını söyler.</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {r.ortam.gruplar.map((g) => {
              const acik = ortamAcik === g.id;
              const zorunluEksik = g.degiskenler.some((d) => d.zorunlu && !d.tanimli);
              const ton = g.acik && !zorunluEksik ? "basari" : g.kural === "istege-bagli" && !zorunluEksik ? "notr" : zorunluEksik || !g.acik ? (g.kural === "istege-bagli" ? "notr" : "uyari") : "basari";
              return (
                <div key={g.id} className="ad-glass min-w-0 !p-0">
                  <button onClick={() => setOrtamAcik(acik ? null : g.id)} className="flex w-full items-start gap-3 p-4 text-left" aria-expanded={acik}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("text-[14px] font-semibold", AD.metin)}>{g.baslik}</span>
                        <Rozet ton={ton}>{g.acik ? "Açık" : g.kural === "istege-bagli" ? "İsteğe bağlı" : "Kapalı"}</Rozet>
                        <span className={cn("text-[12px]", AD.metin3)}>{g.tanimli} tanımlı, toplam {g.toplam}</span>
                      </div>
                      <p className={cn("mt-0.5 text-[12px]", AD.metin2)}>{g.ozellik}</p>
                    </div>
                    <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", AD.metin3, acik && "rotate-180")} />
                  </button>
                  {acik && (
                    <div className="border-t border-[color:var(--ad-kenar)] px-4 py-2">
                      {g.degiskenler.map((d) => (
                        <div key={d.ad} className="flex items-start gap-3 border-b border-[color:var(--ad-kenar)] py-2 last:border-0">
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", d.tanimli ? "bg-emerald-400" : d.zorunlu ? "bg-rose-400" : "bg-white/25")} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><code className={cn("break-all text-[12px]", AD.metin)}>{d.ad}</code>{d.zorunlu && <span className="text-[11px] text-amber-300">zorunlu</span>}</div>
                            <p className={cn("text-[12px]", AD.metin3)}>{d.aciklama}</p>
                          </div>
                          <span className={cn("shrink-0 text-[12px]", d.tanimli ? "text-emerald-300" : AD.metin3)}>{d.tanimli ? "Var" : "Yok"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {r.ortam.diger.length > 0 && (
            <Kart className="mt-3">
              <p className={cn("mb-2 text-[13px] font-semibold", AD.metin)}>.env.example içindeki diğer değişkenler</p>
              <div className="flex flex-wrap gap-1.5">
                {r.ortam.diger.map((d) => <span key={d.ad} className={cn("rounded-lg border px-2 py-1 text-[11px]", d.tanimli ? "border-emerald-400/30 text-emerald-300" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-3)]")}>{d.ad}</span>)}
              </div>
            </Kart>
          )}
        </>
      )}
    </RotaGuard>
  );
}
