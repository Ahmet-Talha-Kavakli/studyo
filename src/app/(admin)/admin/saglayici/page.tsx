"use client";

import { useMemo, useState } from "react";
import { kopyala as panoyaKopyala } from "@/lib/gercekEylem";
import {
  Server, Activity, DollarSign, Zap, RefreshCcw, GitBranch, Power, Check, X, Pencil,
  KeyRound, Gauge, Copy, AlertTriangle, TimerReset,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, DurumNokta, AD } from "@/components/admin/ui/temel";
import { AlanGrafik } from "@/components/admin/grafik";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminProvider, type ProviderAyar } from "@/store/admin/useAdminProvider";
import { PROVIDERLAR } from "@/lib/admin/tablolar";
import { providerDetaylari, type SaglikDurum, type CircuitDurum } from "@/lib/admin/seed/providerDetay";
import { dolar, sayi, yuzde } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const SAGLIK_TON: Record<SaglikDurum, "basari" | "uyari" | "tehlike"> = {
  saglikli: "basari", uyari: "uyari", kritik: "tehlike",
};
const SAGLIK_ETIKET: Record<SaglikDurum, string> = { saglikli: "Sağlıklı", uyari: "Uyarı", kritik: "Kritik" };
const CIRCUIT_ETIKET: Record<CircuitDurum, string> = { kapali: "Kapalı", yarim: "Yarım", acik: "AÇIK" };
const CIRCUIT_RENK: Record<CircuitDurum, string> = {
  kapali: "var(--ad-basari)", yarim: "var(--ad-uyari)", acik: "var(--ad-tehlike)",
};

export default function Saglayici() {
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const prov = useAdminProvider();
  const [sekme, setSekme] = useState("saglik");
  const [duzenle, setDuzenle] = useState<string | null>(null);
  const [taslak, setTaslak] = useState<Partial<ProviderAyar>>({});

  const detaylar = useMemo(() => providerDetaylari(), []);

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  const kritikSayi = PROVIDERLAR.filter((p) => detaylar[p.id]?.saglik === "kritik").length;
  const toplam24s = PROVIDERLAR.reduce((a, p) => a + (detaylar[p.id]?.son24sHarcama ?? 0), 0);
  const toplamBakiye = PROVIDERLAR.reduce((a, p) => a + p.bakiyeUsd, 0);
  const aktifSayi = PROVIDERLAR.filter((p) => prov.ayar(p.id).aktif).length;

  const providerToggle = async (id: string, ad: string) => {
    const aktif = prov.ayar(id).aktif;
    const ok = await onayIste({
      baslik: aktif ? "Provider'ı kapat" : "Provider'ı aç",
      aciklama: `${ad} ${aktif ? "trafiğe kapatılacak; açık istekler failover hedefine yönlenir." : "yeniden trafiğe açılacak."}`,
      risk: aktif ? 2 : 0, eylemEtiket: aktif ? "Kapat" : "Aç",
    });
    if (!ok) return;
    prov.toggle(id);
    denetle(`Provider ${aktif ? "kapatıldı" : "açıldı"}`, "kritik", ad);
    toast.success(aktif ? "Sağlayıcı kapatıldı" : "Sağlayıcı açıldı", { description: aktif ? `${ad} trafiği failover hedefine yönlendirildi.` : `${ad} yeniden trafik alıyor.` });
  };

  const anahtarRotate = async (id: string, ad: string) => {
    const ok = await onayIste({
      baslik: "API anahtarını döndür",
      aciklama: `${ad} için yeni API anahtarı üretilecek. Eski anahtar anında geçersiz olur — devam eden entegrasyonlar etkilenebilir.`,
      risk: 2, onayMetin: "ROTATE", eylemEtiket: "Anahtarı döndür",
    });
    if (!ok) return;
    const yeni = prov.keyRotate(id);
    denetle("API anahtarı döndürüldü", "kritik", ad);
    toast.success("API anahtarı döndürüldü", { description: `${ad} yeni anahtarı: ${yeni}` });
  };

  const kopyala = (deger: string) => {
    void panoyaKopyala(deger, "Anahtar kopyalandı");
  };

  const duzenleAc = (id: string) => {
    const a = prov.ayar(id);
    setDuzenle(id);
    setTaslak({ baseUrl: a.baseUrl, rateLimit: a.rateLimit, esZamanlilikLimiti: a.esZamanlilikLimiti });
  };

  const baglantiKaydet = async (id: string, ad: string) => {
    const ok = await onayIste({
      baslik: "Bağlantı ayarlarını kaydet",
      aciklama: `${ad}: base URL / rate limit / eşzamanlılık güncellenecek. Anlık geçerli olur.`,
      risk: 1, eylemEtiket: "Kaydet",
    });
    if (!ok) return;
    prov.guncelle(id, taslak);
    denetle(`Provider bağlantısı güncellendi (rate ${taslak.rateLimit}/dk, eşzaman ${taslak.esZamanlilikLimiti})`, "uyari", ad);
    toast.success("Bağlantı ayarları kaydedildi", { description: `${ad} için hemen geçerli.` });
    setDuzenle(null);
  };

  const circuitAyarla = (id: string, ad: string, esik: number) => {
    prov.guncelle(id, { circuitBreakerEsik: esik });
    denetle(`Circuit breaker eşiği ayarlandı: %${esik}`, "uyari", ad);
  };

  const failoverAyarla = (id: string, ad: string, hedef: string) => {
    prov.failoverAyarla(id, hedef);
    const hedefAd = PROVIDERLAR.find((p) => p.id === hedef)?.ad ?? "yok";
    denetle(`Failover hedefi ayarlandı: ${hedefAd}`, "uyari", ad);
    toast.success("Failover hedefi güncellendi", { description: `${ad} → ${hedefAd}` });
  };

  const alarmAyarla = (id: string, ad: string, esik: number) => {
    prov.guncelle(id, { alarmEsigiUsd: esik });
    denetle(`Bakiye alarm eşiği ayarlandı: ${dolar(esik)}`, "uyari", ad);
  };

  const sekmeler = [
    { id: "saglik", ad: "Sağlık & Bakiye", sayi: PROVIDERLAR.length },
    { id: "baglanti", ad: "Bağlantı & Limit" },
    { id: "failover", ad: "Failover & Circuit" },
  ];

  return (
    <RotaGuard modul="modeller">
      <BolumBaslik baslik="Provider Yönetimi" ozet="AI sağlayıcı sağlığı, bağlantı, limit ve failover kontrolü" ikon={Server} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Aktif provider" deger={`${aktifSayi}/${PROVIDERLAR.length}`} ikon={Server} alt="trafiğe açık" />
        <MetrikKart etiket="Kritik durum" deger={sayi(kritikSayi)} ikon={AlertTriangle} renk={kritikSayi ? "tehlike" : "basari"} alt="sağlık uyarısı" />
        <MetrikKart etiket="24s harcama" deger={dolar(toplam24s)} ikon={DollarSign} renk="mor" alt="tüm providerlar" />
        <MetrikKart etiket="Toplam bakiye" deger={dolar(toplamBakiye)} ikon={Gauge} renk="basari" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* ── Sağlık & Bakiye ── */}
      {sekme === "saglik" && (
        <div className="grid gap-4 md:grid-cols-2">
          {PROVIDERLAR.map((pr) => {
            const d = detaylar[pr.id];
            const a = prov.ayar(pr.id);
            if (!d) return null;
            const dusukBakiye = pr.bakiyeUsd < a.alarmEsigiUsd;
            const tukenmeYakin = d.tahminiTukenmeGun < 14;
            return (
              <Kart key={pr.id} className={cn(!a.aktif && "opacity-60")}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Server className="h-4 w-4" /></span>
                    <div>
                      <div className={cn("font-semibold", AD.metin)}>{pr.ad}</div>
                      <div className={cn("text-[11px]", AD.metin3)}>öncelik {a.oncelik} · {sayi(d.istek5dk)} istek/5dk</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rozet ton={SAGLIK_TON[d.saglik]}>{SAGLIK_ETIKET[d.saglik]}</Rozet>
                    <button onClick={() => providerToggle(pr.id, pr.ad)} title={a.aktif ? "Kapat" : "Aç"}>
                      <Power className={cn("h-4 w-4", a.aktif ? "text-emerald-400" : "text-[color:var(--ad-metin-3)]")} />
                    </button>
                  </div>
                </div>

                {/* latency + başarı */}
                <div className="mb-3 grid grid-cols-4 gap-2 text-center">
                  <div><div className={cn("text-sm font-bold tabular-nums", AD.metin)}>{yuzde(d.basariOran)}</div><div className={cn("text-[10px]", AD.metin3)}>başarı 5dk</div></div>
                  <div><div className={cn("text-sm font-bold tabular-nums", AD.metin)}>{d.p50}<span className="text-[10px] font-normal">ms</span></div><div className={cn("text-[10px]", AD.metin3)}>p50</div></div>
                  <div><div className={cn("text-sm font-bold tabular-nums", AD.metin)}>{d.p95}<span className="text-[10px] font-normal">ms</span></div><div className={cn("text-[10px]", AD.metin3)}>p95</div></div>
                  <div><div className={cn("text-sm font-bold tabular-nums", AD.metin)}>{d.p99}<span className="text-[10px] font-normal">ms</span></div><div className={cn("text-[10px]", AD.metin3)}>p99</div></div>
                </div>

                {/* bakiye + tükenme + circuit */}
                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <div><div className={cn("text-sm font-bold tabular-nums", dusukBakiye ? "text-rose-400" : AD.metin)}>{dolar(pr.bakiyeUsd)}</div><div className={cn("text-[10px]", AD.metin3)}>bakiye</div></div>
                  <div><div className={cn("text-sm font-bold tabular-nums", tukenmeYakin ? "text-amber-400" : AD.metin)}>{d.tahminiTukenmeGun}g</div><div className={cn("text-[10px]", AD.metin3)}>tahmini tükenme</div></div>
                  <div><div className="text-sm font-bold tabular-nums" style={{ color: CIRCUIT_RENK[d.circuitDurum] }}>{CIRCUIT_ETIKET[d.circuitDurum]}</div><div className={cn("text-[10px]", AD.metin3)}>circuit</div></div>
                </div>

                <div className="mb-1 flex items-center justify-between">
                  <span className={cn("text-[11px]", AD.metin3)}>30 günlük harcama</span>
                  <span className={cn("text-[11px] tabular-nums", AD.metin2)}>{dolar(d.gunlukHarcama)}/gün</span>
                </div>
                <AlanGrafik veri={d.aylikHarcamaSerisi} renk="#a78bfa" yukseklik={56} />

                {(dusukBakiye || tukenmeYakin) && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[12px] text-rose-300">
                    <Zap className="h-3.5 w-3.5" />
                    {dusukBakiye ? `Bakiye eşik (${dolar(a.alarmEsigiUsd)}) altında — yükleme gerek` : `yaklaşık ${d.tahminiTukenmeGun} günde tükeniyor`}
                  </div>
                )}
              </Kart>
            );
          })}
        </div>
      )}

      {/* ── Bağlantı & Limit ── */}
      {sekme === "baglanti" && (
        <div className="space-y-3">
          {PROVIDERLAR.map((pr) => {
            const a = prov.ayar(pr.id);
            const dzn = duzenle === pr.id;
            return (
              <Kart key={pr.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Server className="h-4 w-4" /></span>
                    <span className={cn("font-semibold", AD.metin)}>{pr.ad}</span>
                    <DurumNokta ton={a.aktif ? "basari" : "notr"} />
                  </div>
                  {dzn ? (
                    <div className="flex gap-1">
                      <button onClick={() => baglantiKaydet(pr.id, pr.ad)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setDuzenle(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)]"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => duzenleAc(pr.id)} className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[12px] text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-aksan)]"><Pencil className="h-3.5 w-3.5" /> Düzenle</button>
                  )}
                </div>

                {/* API anahtar (maskeli) + rotate */}
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-2.5">
                  <KeyRound className="h-4 w-4 text-[color:var(--ad-aksan)]" />
                  <code className={cn("font-mono text-[13px] tracking-wide", AD.metin)}>{a.apiKey}</code>
                  <button onClick={() => kopyala(a.apiKey)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin)]" title="Kopyala"><Copy className="h-3.5 w-3.5" /></button>
                  <button onClick={() => anahtarRotate(pr.id, pr.ad)} className="ml-auto flex h-7 items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 text-[12px] text-rose-300 hover:bg-rose-500/20"><RefreshCcw className="h-3.5 w-3.5" /> Anahtarı döndür</button>
                </div>

                {/* base URL / rate / eşzamanlılık */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className={cn("mb-1 block text-[11px] uppercase tracking-wide", AD.metin3)}>Base URL</label>
                    {dzn ? (
                      <input value={taslak.baseUrl ?? ""} onChange={(e) => setTaslak((t) => ({ ...t, baseUrl: e.target.value }))} className="h-9 w-full rounded-lg border border-[color:var(--ad-aksan)]/40 bg-white/[0.03] px-3 font-mono text-[13px]" />
                    ) : (
                      <div className={cn("font-mono text-[13px]", AD.metin2)}>{a.baseUrl}</div>
                    )}
                  </div>
                  <div>
                    <label className={cn("mb-1 block text-[11px] uppercase tracking-wide", AD.metin3)}>Rate limit (istek/dk)</label>
                    {dzn ? (
                      <input type="number" value={taslak.rateLimit ?? 0} onChange={(e) => setTaslak((t) => ({ ...t, rateLimit: +e.target.value }))} className="h-9 w-full rounded-lg border border-[color:var(--ad-aksan)]/40 bg-white/[0.03] px-3 text-sm tabular-nums" />
                    ) : (
                      <div className={cn("text-sm font-semibold tabular-nums", AD.metin)}>{sayi(a.rateLimit)}<span className={cn("ml-1 text-[11px] font-normal", AD.metin3)}>/dk</span></div>
                    )}
                  </div>
                  <div>
                    <label className={cn("mb-1 block text-[11px] uppercase tracking-wide", AD.metin3)}>Eşzamanlılık</label>
                    {dzn ? (
                      <input type="number" value={taslak.esZamanlilikLimiti ?? 0} onChange={(e) => setTaslak((t) => ({ ...t, esZamanlilikLimiti: +e.target.value }))} className="h-9 w-full rounded-lg border border-[color:var(--ad-aksan)]/40 bg-white/[0.03] px-3 text-sm tabular-nums" />
                    ) : (
                      <div className={cn("text-sm font-semibold tabular-nums", AD.metin)}>{sayi(a.esZamanlilikLimiti)}<span className={cn("ml-1 text-[11px] font-normal", AD.metin3)}>paralel</span></div>
                    )}
                  </div>
                  <div>
                    <label className={cn("mb-1 block text-[11px] uppercase tracking-wide", AD.metin3)}>Öncelik</label>
                    <div className={cn("text-sm font-semibold tabular-nums", AD.metin)}>{a.oncelik}</div>
                  </div>
                </div>

                {/* bakiye alarm eşiği */}
                <div className="mt-3 flex items-center gap-3 border-t border-[color:var(--ad-kenar)] pt-3">
                  <Zap className="h-3.5 w-3.5 text-[color:var(--ad-metin-3)]" />
                  <span className={cn("w-40 text-[12px]", AD.metin3)}>Bakiye alarm eşiği</span>
                  <input
                    type="range" min={0} max={2000} step={50} value={a.alarmEsigiUsd}
                    onChange={(e) => alarmAyarla(pr.id, pr.ad, +e.target.value)}
                    className="flex-1 accent-[color:var(--ad-aksan)]"
                  />
                  <span className={cn("w-20 text-right text-[13px] font-semibold tabular-nums", AD.metin)}>{dolar(a.alarmEsigiUsd)}</span>
                </div>
              </Kart>
            );
          })}
        </div>
      )}

      {/* ── Failover & Circuit ── */}
      {sekme === "failover" && (
        <div className="space-y-3">
          <Kart>
            <h3 className={cn("mb-1 flex items-center gap-2 text-sm font-bold", AD.metin)}><GitBranch className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Failover zinciri & circuit breaker</h3>
            <p className={cn("mb-4 text-[13px]", AD.metin3)}>Hata oranı eşiği aşınca devre açılır ve trafik failover hedefine yönlenir. Anlık geçerli.</p>
            <div className="space-y-2.5">
              {PROVIDERLAR.map((pr) => {
                const a = prov.ayar(pr.id);
                const d = detaylar[pr.id];
                const digerler = PROVIDERLAR.filter((p) => p.id !== pr.id);
                return (
                  <div key={pr.id} className="rounded-xl border border-[color:var(--ad-kenar)] p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <DurumNokta ton={d?.circuitDurum === "acik" ? "tehlike" : d?.circuitDurum === "yarim" ? "uyari" : "basari"} />
                      <span className={cn("w-36 font-medium", AD.metin)}>{pr.ad}</span>
                      <span className={cn("text-[12px]", AD.metin3)}>hata &gt;%{a.circuitBreakerEsik} →</span>
                      <RefreshCcw className="h-3.5 w-3.5 text-[color:var(--ad-aksan)]" />
                      <select
                        value={a.failoverHedef}
                        onChange={(e) => failoverAyarla(pr.id, pr.ad, e.target.value)}
                        className="h-8 rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.03] px-2.5 text-[13px] text-[color:var(--ad-metin)]"
                      >
                        <option value="">failover yok</option>
                        {digerler.map((o) => <option key={o.id} value={o.id}>{o.ad}</option>)}
                      </select>
                      <span className="ml-auto text-[12px]" style={{ color: d ? CIRCUIT_RENK[d.circuitDurum] : undefined }}>
                        circuit: <b>{d ? CIRCUIT_ETIKET[d.circuitDurum] : "-"}</b>
                      </span>
                    </div>
                    {/* circuit breaker eşik slider */}
                    <div className="mt-3 flex items-center gap-3">
                      <TimerReset className="h-3.5 w-3.5 text-[color:var(--ad-metin-3)]" />
                      <span className={cn("w-40 text-[12px]", AD.metin3)}>Circuit breaker eşiği</span>
                      <input
                        type="range" min={1} max={30} step={1} value={a.circuitBreakerEsik}
                        onChange={(e) => circuitAyarla(pr.id, pr.ad, +e.target.value)}
                        className="flex-1 accent-[color:var(--ad-aksan)]"
                      />
                      <span className={cn("w-12 text-right text-[13px] font-semibold tabular-nums", AD.metin)}>%{a.circuitBreakerEsik}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Kart>

          <Kart>
            <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><Activity className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Son 5 dk sağlık özeti</h3>
            <div className="overflow-x-auto ad-ince-scroll">
              <table className="w-full min-w-[520px] text-sm">
                <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                  <th className="px-3 py-2">Provider</th><th className="px-3 py-2 text-right">Başarı</th>
                  <th className="px-3 py-2 text-right">İstek</th><th className="px-3 py-2 text-right">Hata</th><th className="px-3 py-2 text-center">Circuit</th>
                </tr></thead>
                <tbody>
                  {PROVIDERLAR.map((pr) => {
                    const d = detaylar[pr.id];
                    if (!d) return null;
                    return (
                      <tr key={pr.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                        <td className={cn("px-3 py-2.5 font-medium", AD.metin)}>{pr.ad}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: d.basariOran < 96 ? "var(--ad-tehlike)" : d.basariOran < 98 ? "var(--ad-uyari)" : "var(--ad-basari)" }}>{yuzde(d.basariOran)}</td>
                        <td className={cn("px-3 py-2.5 text-right tabular-nums", AD.metin2)}>{sayi(d.istek5dk)}</td>
                        <td className={cn("px-3 py-2.5 text-right tabular-nums", AD.metin2)}>{sayi(d.hata5dk)}</td>
                        <td className="px-3 py-2.5 text-center"><span className="text-[12px] font-semibold" style={{ color: CIRCUIT_RENK[d.circuitDurum] }}>{CIRCUIT_ETIKET[d.circuitDurum]}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Kart>
        </div>
      )}
    </RotaGuard>
  );
}
