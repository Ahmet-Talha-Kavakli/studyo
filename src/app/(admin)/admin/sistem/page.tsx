"use client";

import { useMemo, useState } from "react";
import {
  Server, Flag, Settings2, Webhook, Clock, HardDrive, AlertOctagon, RefreshCcw, Power,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD, DurumNokta } from "@/components/admin/ui/temel";
import { IlerlemeHalka as Halka } from "@/components/admin/grafik";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminSistem } from "@/store/admin/useAdminSistem";
import { servisler, webhookLoglari, cronJoblar, storageDurum, hataLoglari } from "@/lib/admin/seed/sistem";
import { useLiveTik } from "@/lib/admin/useLiveTik";
import { aksiyonRisk } from "@/lib/admin/guvenlik/roller";
import { sayi, para, goreceZaman } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function Sistem() {
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const sis = useAdminSistem();
  const tik = useLiveTik(5000);
  const [sekme, setSekme] = useState("saglik");

  const servis = useMemo(() => servisler(tik), [tik]);
  const webhook = useMemo(() => webhookLoglari(), []);
  const cron = useMemo(() => cronJoblar(), []);
  const storage = useMemo(() => storageDurum(), []);
  const hatalar = useMemo(() => hataLoglari(), []);

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik") =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, onem, arac: "manuel" });

  const bakimToggle = async () => {
    const risk = aksiyonRisk("bakim_modu");
    const ok = await onayIste({ baslik: sis.bakimModu ? "Bakım modunu kapat" : "Bakım moduna al", aciklama: sis.bakimModu ? "Site normale döner." : "TÜM kullanıcılar için site bakım moduna geçer. Sadece whitelist IP'ler erişebilir.", risk: sis.bakimModu ? 0 : risk.risk, onayMetin: sis.bakimModu ? undefined : risk.onayMetin, eylemEtiket: sis.bakimModu ? "Kapat" : "BAKIM" });
    if (!ok) return;
    sis.bakimToggle();
    denetle(`Bakım modu ${sis.bakimModu ? "kapatıldı" : "AÇILDI"}`, "kritik");
    toast.success("Bakım modu güncellendi");
  };

  const kayitToggle = async () => {
    const risk = aksiyonRisk("kayit_kapat");
    const ok = await onayIste({ baslik: sis.kayitAcik ? "Kayıtları kapat" : "Kayıtları aç", aciklama: sis.kayitAcik ? "Yeni kullanıcı kaydı DURDURULUR." : "Kayıtlar açılır.", risk: sis.kayitAcik ? risk.risk : 0, onayMetin: sis.kayitAcik ? risk.onayMetin : undefined, eylemEtiket: sis.kayitAcik ? "KAPAT" : "Aç" });
    if (!ok) return;
    sis.kayitToggle();
    denetle(`Kayıtlar ${sis.kayitAcik ? "KAPATILDI" : "açıldı"}`, "kritik");
    toast.success("Kayıt durumu güncellendi");
  };

  const flagToggle = (id: string, ad: string, durum: "acik" | "kapali" | "kismi") => { sis.flagDurum(id, durum); denetle(`Feature flag: ${ad} → ${durum}`, "uyari"); toast.success("Flag güncellendi"); };
  const cronTetikle = (ad: string) => { denetle(`Cron manuel tetiklendi: ${ad}`, "uyari"); toast.success(`${ad} tetiklendi`); };
  const webhookYeniden = (id: string) => { denetle("Webhook yeniden gönderildi", "bilgi"); toast.success("Webhook yeniden gönderildi"); void id; };

  const saglikliSay = servis.filter((s) => s.durum === "saglikli").length;

  const sekmeler = [
    { id: "saglik", ad: "Servis Sağlığı", sayi: servis.length },
    { id: "flag", ad: "Feature Flags", sayi: sis.flagler.length },
    { id: "ayar", ad: "Global Ayarlar" },
    { id: "webhook", ad: "Webhook Logları", sayi: webhook.length },
    { id: "cron", ad: "Cron & Jobs", sayi: cron.length },
    { id: "storage", ad: "Storage" },
    { id: "hata", ad: "Error Logları", sayi: hatalar.length },
  ];

  return (
    <RotaGuard modul="sistem">
      <BolumBaslik baslik="Sistem" ozet="Altyapı, feature flag, webhook ve bakım yönetimi" ikon={Server}
        sag={sis.bakimModu ? <Rozet ton="tehlike"><Power className="h-3 w-3" /> Bakım modu AÇIK</Rozet> : <Rozet ton="basari"><DurumNokta ton="basari" /> Çalışıyor</Rozet>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Sağlıklı servis" deger={`${saglikliSay}/${servis.length}`} ikon={Server} renk="basari" />
        <MetrikKart etiket="Aktif flag" deger={sayi(sis.flagler.filter((f) => f.durum !== "kapali").length)} ikon={Flag} renk="aksan" />
        <MetrikKart etiket="Storage" deger={storage.toplamTB + " TB"} ikon={HardDrive} alt={para(storage.aylikMaliyet) + "/ay"} renk="mor" />
        <MetrikKart etiket="Hata (24s)" deger={sayi(hatalar.reduce((a, h) => a + h.sayi, 0))} ikon={AlertOctagon} renk="tehlike" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Servis sağlığı */}
      {sekme === "saglik" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {servis.map((s) => (
            <Kart key={s.ad} className="!p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <DurumNokta ton={s.durum === "saglikli" ? "basari" : s.durum === "yavas" ? "uyari" : "tehlike"} nabiz={s.durum === "saglikli"} />
                  <span className={cn("font-semibold", AD.metin)}>{s.ad}</span>
                </div>
                <Rozet ton={s.durum === "saglikli" ? "basari" : s.durum === "yavas" ? "uyari" : "tehlike"}>{s.durum}</Rozet>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span className={AD.metin3}>uptime {s.uptime}</span>
                <span className={cn("tabular-nums", AD.metin2)}>{s.latency}ms</span>
              </div>
              <div className={cn("mt-1 text-[11px]", AD.metin3)}>son kontrol {goreceZaman(s.sonKontrol)}</div>
            </Kart>
          ))}
        </div>
      )}

      {/* Feature Flags */}
      {sekme === "flag" && (
        <div className="space-y-2">
          {sis.flagler.map((f) => (
            <Kart key={f.id} className="!p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Flag className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{f.ad}</div><div className={cn("text-[11px]", AD.metin3)}>{f.aciklama} · {f.hedef}</div></div>
                {f.durum === "kismi" && (
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} step={5} value={f.yuzde} onChange={(e) => sis.flagYuzde(f.id, +e.target.value)} className="w-24 accent-[color:var(--ad-aksan)]" />
                    <span className={cn("w-10 text-right tabular-nums text-[13px]", AD.metin)}>%{f.yuzde}</span>
                  </div>
                )}
                <div className="flex gap-1">
                  {(["kapali", "kismi", "acik"] as const).map((d) => (
                    <button key={d} onClick={() => flagToggle(f.id, f.ad, d)} className={cn("rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition-colors", f.durum === d ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-3)]")}>{d === "kapali" ? "Kapalı" : d === "kismi" ? "Kısmi" : "Açık"}</button>
                  ))}
                </div>
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* Global Ayarlar */}
      {sekme === "ayar" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart>
            <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Settings2 className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Kritik anahtarlar</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3">
                <div><div className={cn("text-[13px] font-medium", AD.metin)}>Bakım modu</div><div className={cn("text-[11px]", AD.metin3)}>Site erişimini durdurur</div></div>
                <button onClick={bakimToggle} className={cn("relative h-6 w-11 rounded-full transition-colors", sis.bakimModu ? "bg-rose-500" : "bg-white/15")}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", sis.bakimModu ? "left-[22px]" : "left-0.5")} /></button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3">
                <div><div className={cn("text-[13px] font-medium", AD.metin)}>Yeni kayıt</div><div className={cn("text-[11px]", AD.metin3)}>Kayıt açık/kapalı</div></div>
                <button onClick={kayitToggle} className={cn("relative h-6 w-11 rounded-full transition-colors", sis.kayitAcik ? "bg-emerald-500" : "bg-white/15")}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", sis.kayitAcik ? "left-[22px]" : "left-0.5")} /></button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3">
                <div><div className={cn("text-[13px] font-medium", AD.metin)}>Davetiye modu</div><div className={cn("text-[11px]", AD.metin3)}>Sadece davetliler</div></div>
                <button onClick={() => { sis.davetToggle(); toast.success("Güncellendi"); }} className={cn("relative h-6 w-11 rounded-full transition-colors", sis.davetModu ? "bg-emerald-500" : "bg-white/15")}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", sis.davetModu ? "left-[22px]" : "left-0.5")} /></button>
              </div>
            </div>
          </Kart>
          <Kart>
            <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Global limitler</h3>
            <div className="space-y-4">
              {[
                { k: "Max dosya boyutu (MB)", v: sis.maxDosyaMB, min: 10, max: 200, s: 10, set: (n: number) => sis.ayarGuncelle({ maxDosyaMB: n }) },
                { k: "Max eşzamanlı job", v: sis.maxEszamanliJob, min: 1, max: 20, s: 1, set: (n: number) => sis.ayarGuncelle({ maxEszamanliJob: n }) },
                { k: "Günlük generation tavanı", v: sis.gunlukGenerationTavan, min: 50, max: 1000, s: 50, set: (n: number) => sis.ayarGuncelle({ gunlukGenerationTavan: n }) },
                { k: "Yeni kullanıcı bonus kredi", v: sis.yeniKullaniciBonusKredi, min: 0, max: 500, s: 25, set: (n: number) => sis.ayarGuncelle({ yeniKullaniciBonusKredi: n }) },
              ].map((a) => (
                <div key={a.k}>
                  <div className="mb-1.5 flex justify-between text-[13px]"><span className={AD.metin2}>{a.k}</span><span className={cn("tabular-nums font-semibold", AD.metin)}>{a.v}</span></div>
                  <input type="range" min={a.min} max={a.max} step={a.s} value={a.v} onChange={(e) => a.set(+e.target.value)} className="w-full accent-[color:var(--ad-aksan)]" />
                </div>
              ))}
            </div>
          </Kart>
        </div>
      )}

      {/* Webhook */}
      {sekme === "webhook" && (
        <div className="ad-glass overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-4 py-3">Kaynak / Olay</th><th className="px-4 py-3">Yön</th><th className="px-4 py-3 text-center">HTTP</th><th className="px-4 py-3 text-right">Retry</th><th className="px-4 py-3 text-right">Tarih</th><th className="px-4 py-3"></th></tr></thead>
            <tbody>
              {webhook.map((w) => (
                <tr key={w.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                  <td className="px-4 py-3"><span className="font-medium text-[color:var(--ad-metin)]">{w.kaynak}</span> <span className={cn("font-mono text-[11px]", AD.metin3)}>{w.olay}</span></td>
                  <td className="px-4 py-3"><Rozet ton={w.yon === "gelen" ? "aksan" : "mor"}>{w.yon}</Rozet></td>
                  <td className="px-4 py-3 text-center"><span className={cn("tabular-nums font-semibold", w.durum === 200 ? "text-emerald-400" : "text-rose-400")}>{w.durum}</span></td>
                  <td className="px-4 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{w.retry || "—"}</td>
                  <td className="px-4 py-3 text-right"><span className={cn("text-[12px]", AD.metin3)}>{goreceZaman(w.tarih)}</span></td>
                  <td className="px-4 py-3 text-right">{w.durum !== 200 && <Dugme boyut="sm" tur="glass" ikon={RefreshCcw} onClick={() => webhookYeniden(w.id)}>Yeniden</Dugme>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cron */}
      {sekme === "cron" && (
        <div className="space-y-2">
          {cron.map((c) => (
            <Kart key={c.ad} className="!p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Clock className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{c.ad}</div><div className={cn("text-[11px]", AD.metin3)}>{c.aciklama} · {c.sikilik}</div></div>
                <span className={cn("text-[11px]", AD.metin3)}>son: {goreceZaman(c.sonCalisma)} · {(c.sureMs / 1000).toFixed(1)}sn</span>
                <Rozet ton={c.durum === "basarili" ? "basari" : c.durum === "calisiyor" ? "aksan" : "tehlike"}>{c.durum}</Rozet>
                <Dugme boyut="sm" tur="glass" ikon={RefreshCcw} onClick={() => cronTetikle(c.ad)}>Tetikle</Dugme>
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* Storage */}
      {sekme === "storage" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Kart className="flex flex-col items-center justify-center">
            <Halka deger={72} boyut={100} renk="#a78bfa" etiket="doluluk" />
            <div className={cn("mt-3 text-center text-[13px]", AD.metin2)}>{storage.toplamTB} TB · {para(storage.aylikMaliyet)}/ay</div>
            <div className={cn("text-[11px] text-emerald-400")}>+%{storage.buyumeYuzde} büyüme</div>
          </Kart>
          <Kart className="lg:col-span-2">
            <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>En çok yer kaplayan kullanıcılar</h3>
            <div className="space-y-2">
              {storage.enCokKaplayan.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn("w-4 text-center text-[11px] font-bold", AD.metin3)}>{i + 1}</span>
                  <span className={cn("flex-1 text-[13px]", AD.metin)}>{s.kullanici}</span>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(s.boyutGB / 400) * 100}%` }} /></div>
                  <span className={cn("w-16 text-right text-[12px] tabular-nums", AD.metin2)}>{s.boyutGB} GB</span>
                </div>
              ))}
            </div>
            <div className={cn("mt-4 rounded-xl border border-[color:var(--ad-kenar)] p-3 text-[12px]", AD.metin3)}>
              CDN bandwidth: {storage.cdnBandwidth} TB · {para(storage.cdnMaliyet)}/ay · Saklama politikası: 90 gün sonra soğuk depolamaya taşı
            </div>
          </Kart>
        </div>
      )}

      {/* Error logları */}
      {sekme === "hata" && (
        <div className="space-y-2">
          {hatalar.map((h) => (
            <Kart key={h.id} className="!p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: h.seviye === "fatal" ? "rgba(248,113,113,0.15)" : h.seviye === "error" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)", color: h.seviye === "warning" ? "var(--ad-uyari)" : "var(--ad-tehlike)" }}><AlertOctagon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className={cn("font-mono text-[13px]", AD.metin)}>{h.mesaj}</div><div className={cn("text-[11px]", AD.metin3)}>{h.servis} · {goreceZaman(h.tarih)}</div></div>
                <Rozet ton={h.seviye === "fatal" ? "tehlike" : h.seviye === "error" ? "tehlike" : "uyari"}>{h.seviye}</Rozet>
                <span className={cn("text-[13px] tabular-nums font-semibold", AD.metin)}>{sayi(h.sayi)}×</span>
              </div>
            </Kart>
          ))}
        </div>
      )}
    </RotaGuard>
  );
}
