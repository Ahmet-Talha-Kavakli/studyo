"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingUp, Users2, Ticket, Megaphone, Plus, Trash2, ShieldAlert, Send, Copy,
  X, Mail, Bell, LayoutTemplate, Workflow, FlaskConical, Trophy, Download, Zap, Eye,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD } from "@/components/admin/ui/temel";
import { AlanGrafik } from "@/components/admin/grafik";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminKupon } from "@/store/admin/useAdminKupon";
import { useAdminKampanya, type Kampanya, type AbTest } from "@/store/admin/useAdminKampanya";
import { veri } from "@/lib/admin/seed";
import { referansAgaci, referansMetrik, affiliateler, kFactorSeri, segmentler, abTestOrnekleri } from "@/lib/admin/seed/buyume";
import { para, kisaPara, kisaSayi, sayi, yuzde, tarihEtiket } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 320, damping: 30 } as const;
const TUR_IKON = { email: Mail, push: Bell, inapp: LayoutTemplate } as const;
const TUR_AD: Record<Kampanya["tur"], string> = { email: "E-posta", push: "Push", inapp: "Uygulama içi" };

export default function Buyume() {
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const kuponStore = useAdminKupon();
  const kmpStore = useAdminKampanya();
  const evren = veri();
  const [sekme, setSekme] = useState("referans");
  const [yeniKupon, setYeniKupon] = useState<{ kod: string; tur: "yuzde" | "bonus_kredi"; deger: number }>({ kod: "", tur: "yuzde", deger: 25 });
  const [topluAdet, setTopluAdet] = useState(50);
  const [kmpModal, setKmpModal] = useState(false);
  const [abModal, setAbModal] = useState(false);

  const referans = useMemo(() => referansAgaci(evren), [evren]);
  const refMetrik = referansMetrik();
  const affiliate = useMemo(() => affiliateler(), []);
  const kFactor = useMemo(() => kFactorSeri(), []);
  const segler = useMemo(() => segmentler(), []);
  const abOrnek = useMemo(() => abTestOrnekleri(), []);

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik") =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, onem, arac: "manuel" });

  /* ── Kupon ── */
  const kuponEkle = async () => {
    if (!yeniKupon.kod.trim()) { toast.error("Kod gir."); return; }
    const ok = await onayIste({ baslik: "Kupon oluştur", aciklama: `${yeniKupon.kod} · ${yeniKupon.tur === "yuzde" ? `%${yeniKupon.deger}` : yeniKupon.deger}`, risk: 0, eylemEtiket: "Oluştur" });
    if (!ok) return;
    kuponStore.ekle({ kod: yeniKupon.kod.toUpperCase(), tur: yeniKupon.tur, deger: yeniKupon.deger, kullanimLimit: 1000, kisiBasiLimit: 1, baslangic: Date.now(), bitis: Date.now() + 30 * 86400000, planlar: "Tümü", yeniKullanici: false, aktif: true });
    denetle(`Kupon oluşturuldu: ${yeniKupon.kod}`, "bilgi");
    toast.success("Kupon oluşturuldu");
    setYeniKupon({ kod: "", tur: "yuzde", deger: 25 });
  };

  const kuponSil = async (id: string, kod: string) => {
    const ok = await onayIste({ baslik: "Kuponu sil", aciklama: `${kod} silinecek.`, risk: 1, eylemEtiket: "Sil" });
    if (!ok) return;
    kuponStore.sil(id);
    denetle(`Kupon silindi: ${kod}`, "uyari");
    toast.success("Kupon silindi");
  };

  /* CSV toplu üretim — gerçek Blob indirme. */
  const topluCsvUret = () => {
    const N = Math.max(1, Math.min(5000, topluAdet));
    const harf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const satirlar = ["kod,tur,deger,gecerlilik"];
    const kodlar: { kod: string; tur: "yuzde" | "bonus_kredi"; deger: number; kullanimLimit: number; kisiBasiLimit: number; baslangic: number; bitis: number; planlar: string; yeniKullanici: boolean; aktif: boolean }[] = [];
    const bitis = Date.now() + 30 * 86400000;
    for (let i = 0; i < N; i++) {
      let kod = "VYR-";
      for (let j = 0; j < 8; j++) kod += harf[Math.floor(Math.random() * harf.length)];
      const tur = yeniKupon.tur;
      const deger = yeniKupon.deger;
      satirlar.push(`${kod},${tur === "yuzde" ? "%indirim" : "bonus_kredi"},${deger},${new Date(bitis).toLocaleDateString("tr-TR")}`);
      kodlar.push({ kod, tur, deger, kullanimLimit: 1, kisiBasiLimit: 1, baslangic: Date.now(), bitis, planlar: "Tümü", yeniKullanici: false, aktif: true });
    }
    // İlk 10 kodu gerçek store'a da yaz (izlenebilirlik) — kalanı CSV'de dağıtım için.
    kodlar.slice(0, 10).forEach((k) => kuponStore.ekle(k));
    const blob = new Blob([satirlar.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vayra-kupon-${N}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    denetle(`Toplu kupon üretildi: ${N} kod (CSV)`, "bilgi");
    toast.success(`${N} kod üretildi ve CSV indirildi`);
  };

  /* ── Kampanya durum ── */
  const kampanyaBaslat = async (k: Kampanya) => {
    const hedef = k.durum === "taslak" ? "gönderilecek" : "yeniden gönderilecek";
    const ok = await onayIste({ baslik: "Kampanyayı başlat", aciklama: `"${k.ad}" (${k.segment}) ${hedef}.`, risk: 1, eylemEtiket: "Başlat" });
    if (!ok) return;
    kmpStore.durumDegistir(k.id, "gonderildi");
    denetle(`Kampanya başlatıldı: ${k.ad}`, "uyari");
    toast.success("Kampanya gönderildi");
  };

  const kampanyaSil = async (k: Kampanya) => {
    const ok = await onayIste({ baslik: "Kampanyayı sil", aciklama: `"${k.ad}" silinecek.`, risk: 1, eylemEtiket: "Sil" });
    if (!ok) return;
    kmpStore.kampanyaSil(k.id);
    denetle(`Kampanya silindi: ${k.ad}`, "uyari");
    toast.success("Kampanya silindi");
  };

  const abDurdur = async (t: AbTest) => {
    const kazanan = t.donusumA / Math.max(1, t.gorunumA) >= t.donusumB / Math.max(1, t.gorunumB) ? "A" : "B";
    const ok = await onayIste({ baslik: "Testi durdur", aciklama: `"${t.ad}" testi durdurulacak. Kazanan: Varyant ${kazanan}.`, risk: 1, eylemEtiket: "Durdur" });
    if (!ok) return;
    kmpStore.abTestDurdur(t.id, kazanan);
    denetle(`A/B test durduruldu: ${t.ad} (kazanan ${kazanan})`, "uyari");
    toast.success(`Test durduruldu · Varyant ${kazanan} kazandı`);
  };

  const aktifKampanya = kmpStore.kampanyalar.filter((k) => k.durum !== "taslak").length;

  const sekmeler = [
    { id: "referans", ad: "Referans", sayi: referans.length },
    { id: "affiliate", ad: "Affiliate / Influencer", sayi: affiliate.length },
    { id: "kupon", ad: "Kupon & Promo", sayi: kuponStore.kuponlar.length },
    { id: "kampanya", ad: "Kampanyalar", sayi: kmpStore.kampanyalar.length },
    { id: "drip", ad: "Drip akışlar", sayi: kmpStore.dripAkislar.length },
    { id: "abtest", ad: "A/B Test", sayi: kmpStore.abTestler.length },
    { id: "viral", ad: "Viral katsayı" },
  ];

  return (
    <RotaGuard modul="buyume">
      <BolumBaslik baslik="Büyüme" ozet="Referans, affiliate, kupon, kampanya, drip ve A/B test" ikon={TrendingUp} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Toplam referans" deger={kisaSayi(refMetrik.toplamReferans)} ikon={Users2} delta={6.2} />
        <MetrikKart etiket="K-Factor" deger={refMetrik.kFactor.toFixed(2)} ikon={TrendingUp} alt="viral katsayı" renk="basari" />
        <MetrikKart etiket="Aktif kupon" deger={sayi(kuponStore.kuponlar.filter((k) => k.aktif).length)} ikon={Ticket} renk="mor" />
        <MetrikKart etiket="Aktif kampanya" deger={sayi(aktifKampanya)} ikon={Megaphone} renk="aksan" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Referans */}
      {sekme === "referans" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Kart className="lg:col-span-2 overflow-hidden !p-0">
            <div className="p-5"><h3 className={cn("text-sm font-bold", AD.metin)}>Referans ağacı — en çok getiren</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-y border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-5 py-2">Kullanıcı</th><th className="px-3 py-2 text-right">Getirdiği</th><th className="px-3 py-2 text-right">Kazanılan</th><th className="px-5 py-2 text-right">Fraud</th></tr></thead>
              <tbody>{referans.map((r) => (
                <tr key={r.kullaniciId} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                  <td className="px-5 py-2.5"><Link href={`/admin/kullanicilar/${r.kullaniciId}`} className={cn("font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{r.ad}</Link></td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--ad-metin)]">{r.getirdigi}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--ad-metin-2)]">{sayi(r.kazanilanKredi)} kredi</td>
                  <td className="px-5 py-2.5 text-right">{r.fraudSkoru > 0.6 ? <Rozet ton="tehlike"><ShieldAlert className="h-3 w-3" /> {(r.fraudSkoru * 100).toFixed(0)}%</Rozet> : <span className={cn("text-[12px]", AD.metin3)}>temiz</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </Kart>
          <div className="space-y-4">
            <Kart>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Ödül kuralları</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between"><span className={AD.metin2}>Davet edene</span><span className={cn("font-semibold", AD.metin)}>100 kredi</span></div>
                <div className="flex justify-between"><span className={AD.metin2}>Davet edilene</span><span className={cn("font-semibold", AD.metin)}>50 kredi</span></div>
                <div className="flex justify-between"><span className={AD.metin2}>Koşul</span><span className={cn("font-semibold", AD.metin)}>İlk ödeme</span></div>
              </div>
            </Kart>
            <Kart>
              <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Metrikler</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between"><span className={AD.metin2}>Referanslı LTV</span><span className="text-emerald-400">{para(refMetrik.referansliLtv)}</span></div>
                <div className="flex justify-between"><span className={AD.metin2}>Organik LTV</span><span className={AD.metin}>{para(refMetrik.organikLtv)}</span></div>
                <div className="flex justify-between"><span className={AD.metin2}>Bekleyen ödül</span><span className="text-amber-400">{refMetrik.bekleyenOdul}</span></div>
              </div>
            </Kart>
          </div>
        </div>
      )}

      {/* Affiliate */}
      {sekme === "affiliate" && (
        <Kart className="overflow-hidden !p-0">
          <div className="p-5"><h3 className={cn("text-sm font-bold", AD.metin)}>Affiliate / Influencer partnerleri</h3></div>
          <div className="overflow-x-auto ad-ince-scroll">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-y border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-5 py-2">Partner</th><th className="px-3 py-2 text-right">Takipçi</th><th className="px-3 py-2 text-right">Komisyon</th><th className="px-3 py-2 text-right">Kayıt</th><th className="px-3 py-2 text-right">Gelir</th><th className="px-3 py-2 text-right">Ödenecek</th><th className="px-5 py-2 text-right">ROI</th></tr></thead>
              <tbody>{affiliate.map((a) => (
                <tr key={a.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                  <td className="px-5 py-3"><span className="font-medium text-[color:var(--ad-metin)]">{a.ad}</span> <span className={cn("text-[11px]", AD.metin3)}>· {a.platform}</span></td>
                  <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{kisaSayi(a.takipci)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">%{a.komisyon}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{a.kayit}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin)]">{kisaPara(a.gelir)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-amber-400">{kisaPara(a.odenecek)}</td>
                  <td className="px-5 py-3 text-right"><Rozet ton="basari">{a.roi}x</Rozet></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Kart>
      )}

      {/* Kupon */}
      {sekme === "kupon" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            {kuponStore.kuponlar.map((k) => (
              <Kart key={k.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Ticket className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className={cn("font-mono text-[14px] font-bold", AD.metin)}>{k.kod}</span><button onClick={() => { navigator.clipboard?.writeText(k.kod); toast.success("Kopyalandı"); }}><Copy className="h-3.5 w-3.5 text-[color:var(--ad-metin-3)]" /></button></div>
                    <div className={cn("text-[11px]", AD.metin3)}>{k.tur === "yuzde" ? `%${k.deger} indirim` : k.tur === "bonus_kredi" ? `${k.deger} bonus kredi` : k.tur === "sabit" ? `${para(k.deger)} indirim` : `${k.deger} gün trial`} · {k.kullanildi}/{k.kullanimLimit} · {k.planlar}</div>
                  </div>
                  <span className={cn("text-[12px] tabular-nums", AD.metin3)}>{kisaPara(k.uretilenGelir)}</span>
                  <button onClick={() => kuponStore.toggle(k.id)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", k.aktif ? "bg-emerald-500" : "bg-white/15")}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", k.aktif ? "left-[22px]" : "left-0.5")} /></button>
                  <button onClick={() => kuponSil(k.id, k.kod)} className="text-[color:var(--ad-metin-3)] hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Kart>
            ))}
          </div>
          <div className="space-y-4">
            <Kart>
              <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><Plus className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Yeni kupon</h3>
              <div className="space-y-3">
                <input value={yeniKupon.kod} onChange={(e) => setYeniKupon({ ...yeniKupon, kod: e.target.value.toUpperCase() })} placeholder="KUPON KODU" className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 font-mono text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
                <div className="grid grid-cols-2 gap-2">
                  {(["yuzde", "bonus_kredi"] as const).map((t) => <button key={t} onClick={() => setYeniKupon({ ...yeniKupon, tur: t })} className={cn("rounded-lg border py-2 text-[13px] font-semibold", yeniKupon.tur === t ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>{t === "yuzde" ? "% İndirim" : "Bonus kredi"}</button>)}
                </div>
                <div><label className={cn("mb-1.5 block text-[13px]", AD.metin2)}>Değer: <b className={AD.metin}>{yeniKupon.deger}</b></label><input type="range" min={5} max={yeniKupon.tur === "yuzde" ? 90 : 2000} step={5} value={yeniKupon.deger} onChange={(e) => setYeniKupon({ ...yeniKupon, deger: +e.target.value })} className="w-full accent-[color:var(--ad-aksan)]" /></div>
                <Dugme className="w-full" onClick={kuponEkle}>Kupon oluştur</Dugme>
              </div>
            </Kart>
            <Kart>
              <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><Download className="h-4 w-4 text-[color:var(--ad-mor)]" /> Toplu kod üretimi</h3>
              <div className="space-y-3">
                <p className={cn("text-[12px] leading-relaxed", AD.metin3)}>Seçili tür/değer ile <b className={AD.metin}>{topluAdet}</b> benzersiz kod üretir ve CSV indirir.</p>
                <input type="range" min={10} max={1000} step={10} value={topluAdet} onChange={(e) => setTopluAdet(+e.target.value)} className="w-full accent-[color:var(--ad-mor)]" />
                <Dugme tur="glass" className="w-full" ikon={Download} onClick={topluCsvUret}>CSV indir ({topluAdet} kod)</Dugme>
              </div>
            </Kart>
          </div>
        </div>
      )}

      {/* Kampanyalar */}
      {sekme === "kampanya" && (
        <div className="space-y-3">
          <div className="flex justify-end"><Dugme ikon={Plus} onClick={() => setKmpModal(true)}>Yeni Kampanya</Dugme></div>
          {kmpStore.kampanyalar.map((k) => {
            const Ikon = TUR_IKON[k.tur];
            const g = k.metrikler.gonderim;
            return (
              <Kart key={k.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400"><Ikon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-[13px] font-medium", AD.metin)}>{k.ad}</div>
                    <div className={cn("text-[11px]", AD.metin3)}>{TUR_AD[k.tur]} · {k.segment} · {g > 0 ? `${sayi(g)} gönderim` : k.zamanlama ? tarihEtiket(k.zamanlama) : "taslak"}</div>
                  </div>
                  {g > 0 && (
                    <div className="hidden gap-4 text-[12px] sm:flex">
                      <span className={AD.metin3}>açılma <b className={AD.metin}>{yuzde((k.metrikler.acilma / g) * 100, 0)}</b></span>
                      <span className={AD.metin3}>tıklama <b className={AD.metin}>{yuzde((k.metrikler.tiklama / g) * 100, 0)}</b></span>
                      <span className={AD.metin3}>dönüşüm <b className="text-emerald-400">{sayi(k.metrikler.donusum)}</b></span>
                    </div>
                  )}
                  <Rozet ton={k.durum === "gonderildi" ? "basari" : k.durum === "zamanlandi" ? "aksan" : "notr"}>{k.durum === "gonderildi" ? "gönderildi" : k.durum === "zamanlandi" ? "zamanlandı" : "taslak"}</Rozet>
                  {k.durum !== "gonderildi" && <Dugme boyut="sm" ikon={Send} onClick={() => kampanyaBaslat(k)}>Başlat</Dugme>}
                  <button onClick={() => kampanyaSil(k)} className="text-[color:var(--ad-metin-3)] hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Kart>
            );
          })}
        </div>
      )}

      {/* Drip akışlar */}
      {sekme === "drip" && (
        <div className="grid gap-3 lg:grid-cols-2">
          {kmpStore.dripAkislar.map((d) => (
            <Kart key={d.id} className="!p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Workflow className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className={cn("text-[13px] font-semibold", AD.metin)}>{d.ad}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>tetik: {d.tetik} · {d.adimlar.length} adım</div>
                </div>
                <button onClick={() => { kmpStore.dripToggle(d.id); denetle(`Drip ${d.aktif ? "durduruldu" : "başlatıldı"}: ${d.ad}`, "bilgi"); toast.success(d.aktif ? "Akış durduruldu" : "Akış aktif"); }} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", d.aktif ? "bg-emerald-500" : "bg-white/15")}>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", d.aktif ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              <ol className="space-y-1.5">
                {d.adimlar.map((a, i) => {
                  const Ikon = TUR_IKON[a.kanal];
                  return (
                    <li key={i} className="flex items-center gap-2.5 text-[12px]">
                      <span className={cn("flex h-5 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-[10px] font-semibold", AD.metin3)}>G+{a.gun}</span>
                      <Ikon className="h-3.5 w-3.5 shrink-0 text-[color:var(--ad-metin-3)]" />
                      <span className={cn("truncate", AD.metin2)}>{a.metin}</span>
                    </li>
                  );
                })}
              </ol>
            </Kart>
          ))}
        </div>
      )}

      {/* A/B Test */}
      {sekme === "abtest" && (
        <div className="space-y-3">
          <div className="flex justify-end"><Dugme ikon={Plus} onClick={() => setAbModal(true)}>Yeni test</Dugme></div>
          <div className="grid gap-3 lg:grid-cols-2">
            {kmpStore.abTestler.map((t) => {
              const oranA = t.gorunumA > 0 ? (t.donusumA / t.gorunumA) * 100 : 0;
              const oranB = t.gorunumB > 0 ? (t.donusumB / t.gorunumB) * 100 : 0;
              const onde = oranA >= oranB ? "A" : "B";
              return (
                <Kart key={t.id} className="!p-4">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-mor)]/12 text-[color:var(--ad-mor)]"><FlaskConical className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className={cn("text-[13px] font-semibold", AD.metin)}>{t.ad}</div>
                      <div className={cn("text-[11px]", AD.metin3)}>{t.tur}</div>
                    </div>
                    <Rozet ton={t.durum === "calisiyor" ? "aksan" : "notr"}>{t.durum === "calisiyor" ? "çalışıyor" : "durduruldu"}</Rozet>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["A", "B"] as const).map((v) => {
                      const varyant = v === "A" ? t.varyantA : t.varyantB;
                      const gorunum = v === "A" ? t.gorunumA : t.gorunumB;
                      const oran = v === "A" ? oranA : oranB;
                      const kazandi = t.kazanan === v;
                      const lider = !t.kazanan && onde === v;
                      return (
                        <div key={v} className={cn("rounded-xl border p-3", kazandi || lider ? "border-emerald-400/40 bg-emerald-400/[0.06]" : "border-[color:var(--ad-kenar)] bg-white/[0.02]")}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className={cn("text-[11px] font-bold uppercase", AD.metin3)}>Varyant {v}</span>
                            {kazandi && <Rozet ton="basari"><Trophy className="h-3 w-3" /> kazanan</Rozet>}
                            {lider && <span className="text-[10px] font-semibold text-emerald-400">önde</span>}
                          </div>
                          <div className={cn("mb-2 line-clamp-2 text-[12px]", AD.metin)}>{varyant}</div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={cn("flex items-center gap-1", AD.metin3)}><Eye className="h-3 w-3" /> {kisaSayi(gorunum)}</span>
                            <span className="font-bold tabular-nums text-[color:var(--ad-metin)]">{yuzde(oran, 1)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {t.durum === "calisiyor" && <Dugme tur="glass" boyut="sm" className="mt-3 w-full" onClick={() => abDurdur(t)}>Testi durdur</Dugme>}
                </Kart>
              );
            })}
          </div>
        </div>
      )}

      {/* Viral katsayı */}
      {sekme === "viral" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Kart className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><Zap className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Viral katsayı (K-Factor) — 30 gün</h3>
              <Rozet ton="basari">{kFactor.seri[kFactor.seri.length - 1].toFixed(2)}</Rozet>
            </div>
            <AlanGrafik veri={kFactor.seri} etiketler={kFactor.etiketler} renk="var(--ad-aksan)" yukseklik={200} />
            <p className={cn("mt-3 text-[12px] leading-relaxed", AD.metin3)}>Her kullanıcının ortalama getirdiği yeni kullanıcı sayısı. 1.0 üzeri = kendi kendine büyüyen viral döngü.</p>
          </Kart>
          <Kart>
            <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Segment büyüklükleri</h3>
            <div className="space-y-2.5">
              {segler.map((s) => (
                <div key={s.ad} className="flex items-center justify-between text-[13px]">
                  <span className={AD.metin2}>{s.ad}</span>
                  <span className={cn("font-semibold tabular-nums", AD.metin)}>{kisaSayi(s.kisi)}</span>
                </div>
              ))}
            </div>
          </Kart>
        </div>
      )}

      {/* ── Kampanya editör modalı ── */}
      <AnimatePresence>
        {kmpModal && <KampanyaModal segler={segler} onKapat={() => setKmpModal(false)} onKaydet={(payload, gonder) => {
          kmpStore.kampanyaEkle({ ...payload, durum: gonder ? "gonderildi" : payload.zamanlama ? "zamanlandi" : "taslak" });
          denetle(`Kampanya oluşturuldu: ${payload.ad}${gonder ? " (gönderildi)" : ""}`, "bilgi");
          toast.success(gonder ? "Kampanya oluşturuldu ve gönderildi" : payload.zamanlama ? "Kampanya zamanlandı" : "Taslak kaydedildi");
          setKmpModal(false);
        }} />}
      </AnimatePresence>

      {/* ── A/B test modalı ── */}
      <AnimatePresence>
        {abModal && <AbModal ornekler={abOrnek} onKapat={() => setAbModal(false)} onKaydet={(payload) => {
          kmpStore.abTestEkle(payload);
          denetle(`A/B test oluşturuldu: ${payload.ad}`, "bilgi");
          toast.success("A/B test başlatıldı");
          setAbModal(false);
        }} />}
      </AnimatePresence>
    </RotaGuard>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Kampanya editör modalı — canlı değişken önizleme                */
type KmpPayload = { ad: string; tur: Kampanya["tur"]; segment: string; sablon: string; zamanlama: number | null };

function KampanyaModal({ segler, onKapat, onKaydet }: { segler: { ad: string; kisi: number }[]; onKapat: () => void; onKaydet: (p: KmpPayload, gonder: boolean) => void }) {
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState<Kampanya["tur"]>("email");
  const [segment, setSegment] = useState(segler[0]?.ad ?? "Tüm kullanıcılar");
  const [sablon, setSablon] = useState("Merhaba {isim}, {kredi} kredin var.");
  const [zamanla, setZamanla] = useState(false);
  const [tarih, setTarih] = useState("");

  const segKisi = segler.find((s) => s.ad === segment)?.kisi ?? 0;
  const onizleme = sablon
    .replace(/\{isim\}/g, "Ahmet")
    .replace(/\{kredi\}/g, "1.250")
    .replace(/\{tier\}/g, "Ultra");

  const degiskenEkle = (d: string) => setSablon((s) => `${s}${s && !s.endsWith(" ") ? " " : ""}${d}`);

  const gecerli = ad.trim() && sablon.trim() && (!zamanla || tarih);
  const payload = (): KmpPayload => ({ ad: ad.trim(), tur, segment, sablon: sablon.trim(), zamanlama: zamanla && tarih ? new Date(tarih).getTime() : null });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={SPRING}
        className="ad-panel relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[color:var(--ad-kenar)] p-5">
          <h3 className={cn("flex items-center gap-2 text-base font-bold", AD.metin)}><Megaphone className="h-4.5 w-4.5 text-violet-400" /> Yeni kampanya</h3>
          <button onClick={onKapat} className="text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin)]"><X className="h-5 w-5" /></button>
        </div>
        <div className="ad-ince-scroll flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Kampanya adı</label>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Ağustos win-back" className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
          </div>
          <div>
            <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Kanal</label>
            <div className="grid grid-cols-3 gap-2">
              {(["email", "push", "inapp"] as const).map((t) => {
                const Ikon = TUR_IKON[t];
                return <button key={t} onClick={() => setTur(t)} className={cn("flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[12px] font-semibold", tur === t ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}><Ikon className="h-3.5 w-3.5" />{TUR_AD[t]}</button>;
              })}
            </div>
          </div>
          <div>
            <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Segment</label>
            <select value={segment} onChange={(e) => setSegment(e.target.value)} className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50">
              {segler.map((s) => <option key={s.ad} value={s.ad}>{s.ad}</option>)}
            </select>
            <p className={cn("mt-1.5 text-[12px]", AD.metin3)}>Tahmini erişim: <b className="text-[color:var(--ad-aksan)]">{sayi(segKisi)}</b> kişi</p>
          </div>
          <div>
            <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Şablon</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {["{isim}", "{kredi}", "{tier}"].map((d) => <button key={d} onClick={() => degiskenEkle(d)} className="rounded-md border border-[color:var(--ad-kenar)] bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-[color:var(--ad-aksan)] hover:bg-[color:var(--ad-aksan)]/10">{d}</button>)}
            </div>
            <textarea value={sablon} onChange={(e) => setSablon(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
            <div className="mt-2 rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.02] p-3">
              <span className={cn("mb-1 block text-[10px] font-bold uppercase tracking-wide", AD.metin3)}>Önizleme</span>
              <p className={cn("text-[13px] leading-relaxed", AD.metin)}>{onizleme}</p>
            </div>
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[color:var(--ad-metin-2)]">
              <input type="checkbox" checked={zamanla} onChange={(e) => setZamanla(e.target.checked)} className="accent-[color:var(--ad-aksan)]" /> Zamanla
            </label>
            {zamanla && <input type="datetime-local" value={tarih} onChange={(e) => setTarih(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50 [color-scheme:dark]" />}
          </div>
        </div>
        <div className="flex gap-2 border-t border-[color:var(--ad-kenar)] p-5">
          <Dugme tur="glass" className="flex-1" disabled={!gecerli} onClick={() => gecerli && onKaydet(payload(), false)}>{zamanla ? "Zamanla" : "Taslak kaydet"}</Dugme>
          {!zamanla && <Dugme className="flex-1" ikon={Send} disabled={!gecerli} onClick={() => gecerli && onKaydet(payload(), true)}>Oluştur & gönder</Dugme>}
        </div>
      </motion.div>
    </div>
  );
}

/* A/B test oluşturma modalı */
type AbPayload = { ad: string; tur: AbTest["tur"]; varyantA: string; varyantB: string };

function AbModal({ ornekler, onKapat, onKaydet }: { ornekler: { id: string; ad: string; tur: AbTest["tur"]; varyantA: string; varyantB: string }[]; onKapat: () => void; onKaydet: (p: AbPayload) => void }) {
  const [ad, setAd] = useState("");
  const [tur, setTur] = useState<AbTest["tur"]>("landing");
  const [varyantA, setVaryantA] = useState("");
  const [varyantB, setVaryantB] = useState("");

  const ornekDoldur = (o: { id: string; ad: string; tur: AbTest["tur"]; varyantA: string; varyantB: string }) => {
    setAd(o.ad); setTur(o.tur); setVaryantA(o.varyantA); setVaryantB(o.varyantB);
  };
  const gecerli = ad.trim() && varyantA.trim() && varyantB.trim();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={SPRING}
        className="ad-panel relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[color:var(--ad-kenar)] p-5">
          <h3 className={cn("flex items-center gap-2 text-base font-bold", AD.metin)}><FlaskConical className="h-4.5 w-4.5 text-[color:var(--ad-mor)]" /> Yeni A/B test</h3>
          <button onClick={onKapat} className="text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin)]"><X className="h-5 w-5" /></button>
        </div>
        <div className="ad-ince-scroll flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Test adı</label>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Fiyat sayfası CTA" className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
          </div>
          <div>
            <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Tür</label>
            <div className="grid grid-cols-3 gap-2">
              {(["thumbnail", "prompt", "landing"] as const).map((t) => <button key={t} onClick={() => setTur(t)} className={cn("rounded-lg border py-2 text-[12px] font-semibold capitalize", tur === t ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>{t}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Varyant A</label>
              <textarea value={varyantA} onChange={(e) => setVaryantA(e.target.value)} rows={3} placeholder="Kontrol" className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
            </div>
            <div>
              <label className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Varyant B</label>
              <textarea value={varyantB} onChange={(e) => setVaryantB(e.target.value)} rows={3} placeholder="Deney" className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
            </div>
          </div>
          <div>
            <span className={cn("mb-2 block text-[12px] font-medium", AD.metin3)}>Hazır örnekler</span>
            <div className="space-y-1.5">
              {ornekler.map((o) => (
                <button key={o.id ?? o.ad} onClick={() => ornekDoldur(o)} className="w-full rounded-lg border border-[color:var(--ad-kenar)] bg-white/[0.02] px-3 py-2 text-left text-[12px] hover:border-[color:var(--ad-aksan)]/40">
                  <span className={cn("font-medium", AD.metin)}>{o.ad}</span> <span className={AD.metin3}>· {o.tur}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-[color:var(--ad-kenar)] p-5">
          <Dugme className="w-full" ikon={FlaskConical} disabled={!gecerli} onClick={() => gecerli && onKaydet({ ad: ad.trim(), tur, varyantA: varyantA.trim(), varyantB: varyantB.trim() })}>Testi başlat</Dugme>
        </div>
      </motion.div>
    </div>
  );
}
