"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BellRing, Coins, Download, FileText, KeyRound, Receipt } from "lucide-react";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";
import { KREDI_PAKETLERI } from "@/lib/fiyat";
import { MODELLER } from "@/lib/catalog";
import { senkronize } from "@/lib/api/istemci";
import { TUR_ADI } from "@/lib/api/sema";
import { toast } from "@/lib/toast";
import { Anahtar, Kart, SayfaBaslik, SecimSerit, birincil, girdi, ikincil } from "@/components/api/ui";
import { KrediJeton } from "@/components/ui/KrediHap";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { csvIndir, useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

const tl = (n: number) => n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
const REFERANS = KREDI_PAKETLERI.find((p) => p.populer) ?? KREDI_PAKETLERI[0];
const KREDI_TL = REFERANS.fiyat / REFERANS.kredi;

export default function Faturalama() {
  const hazir = useHazir();
  const kullanici = useAuth((s) => s.kullanici);
  const uretimler = useApiAnahtar((s) => s.uretimler);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const esik = useApiAnahtar((s) => s.dusukBakiyeEsigi);
  const setEsik = useApiAnahtar((s) => s.setDusukBakiyeEsigi);
  const krediAc = useKrediModal((s) => s.ac);
  const [esikTaslak, setEsikTaslak] = useState<string>("");
  const [fiyatTur, setFiyatTur] = useState<string>("gorsel");

  const faturalanan = useMemo(() => uretimler.filter((u) => u.environment === "live" && u.status === "succeeded" && u.credits > 0), [uretimler]);
  const aylar = useMemo(() => {
    const m = new Map<string, { anahtar: string; ad: string; kredi: number; istek: number; kalemler: typeof faturalanan }>();
    for (const u of faturalanan) {
      const d = new Date(u.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const x = m.get(k) ?? { anahtar: k, ad: d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }), kredi: 0, istek: 0, kalemler: [] };
      x.kredi += u.credits; x.istek++; x.kalemler.push(u);
      m.set(k, x);
    }
    return Array.from(m.values()).sort((a, b) => b.anahtar.localeCompare(a.anahtar));
  }, [faturalanan]);

  if (!hazir) return <div className="h-[60vh]" />;
  if (!kullanici) return <><SayfaBaslik baslik="Faturalama" /><Kart><p className="py-10 text-center text-[14px] text-white/60">Bakiyeni ve harcamanı görmek için giriş yap.</p></Kart></>;

  const simdi = new Date();
  const buAyAnahtar = `${simdi.getFullYear()}-${String(simdi.getMonth() + 1).padStart(2, "0")}`;
  const buAy = aylar.find((a) => a.anahtar === buAyAnahtar);
  const gecenGun = simdi.getDate();
  const ayGun = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 0).getDate();
  const tahmin = buAy ? Math.round((buAy.kredi / gecenGun) * ayGun) : 0;
  const kalanGun = buAy && buAy.kredi > 0 ? Math.floor(kullanici.krediler / (buAy.kredi / gecenGun)) : null;

  const disaAktar = (a: (typeof aylar)[number]) => csvIndir(`vayra-api-ekstre-${a.anahtar}.csv`, [
    ["tarih", "uretim_id", "model", "anahtar", "kredi", "tahmini_tl"],
    ...a.kalemler.map((u) => [u.created_at, u.id, u.model, anahtarlar.find((k) => k.id === u.anahtarId)?.ad ?? u.anahtarId, u.credits, (u.credits * KREDI_TL).toFixed(2)]),
    ["", "", "", "Toplam", a.kredi, (a.kredi * KREDI_TL).toFixed(2)],
  ]);

  return (
    <>
      <SayfaBaslik baslik="Faturalama" aciklama="API, uygulamayla aynı kredi bakiyesini kullanır. Canlı üretimin kredisi tamamlandığında düşülür; başarısız ve iptal edilen üretimler ücretsizdir."
        sag={<><Link href="/panel/kredi?sekme=plan" className={ikincil}>Planı yönet</Link><button onClick={() => krediAc("kredi")} className={birincil}><Coins className="h-4 w-4" />Kredi yükle</button></>} />

      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[#0a1013] ring-1 ring-white/[0.09]">
        <span className="pointer-events-none absolute -left-24 -top-32 h-80 w-[420px] rounded-full bg-[#55d6fd]/20 opacity-60 blur-[90px] [animation:gp-leke-1_14s_ease-in-out_infinite]" aria-hidden />
        <span className="pointer-events-none absolute -bottom-40 right-10 h-72 w-[360px] rounded-full bg-violet-400/15 opacity-50 blur-[100px] [animation:gp-leke-2_17s_ease-in-out_infinite]" aria-hidden />
        <div className="relative grid gap-px lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
          <div className="p-5 sm:p-6">
            <p className="flex items-center gap-2 text-[13px] text-white/65"><KrediJeton boyut={15} />Bakiye</p>
            <p className="mt-2 flex items-baseline gap-2"><span className="text-[44px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-white">{kullanici.krediler.toLocaleString("tr-TR")}</span><span className="text-[14px] text-white/55">kredi</span></p>
            <p className="mt-2.5 text-[13px] text-white/65">{PLAN_ADI[kullanici.plan] ?? kullanici.plan} plan · yaklaşık <span className="text-white">{tl(kullanici.krediler * KREDI_TL)}</span></p>
          </div>
          {[
            { e: "Bu ay API", d: (buAy?.kredi ?? 0).toLocaleString("tr-TR"), a: `${buAy?.istek ?? 0} faturalı üretim`, r: "text-white" },
            { e: "Ay sonu tahmini", d: tahmin.toLocaleString("tr-TR"), a: "Bugüne kadarki günlük ortalamayla", r: "text-white" },
            { e: "Bakiye yeter", d: kalanGun === null ? "Harcama yok" : `${kalanGun} gün`, a: "Bu ayın harcama hızıyla", r: kalanGun !== null && kalanGun < 7 ? "text-rose-300" : kalanGun === null ? "text-white/45" : "text-emerald-300" },
          ].map((h, i) => (
            <motion.div key={h.e} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }} className="border-t border-white/[0.07] p-5 sm:p-6 lg:border-l lg:border-t-0">
              <p className="text-[13px] text-white/65">{h.e}</p>
              <p className={cn("mt-2 text-[26px] font-semibold leading-none tabular-nums tracking-[-0.03em]", h.r)}>{h.d}</p>
              <p className="mt-2 text-[12.5px] text-white/50">{h.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Kart baslik="Düşük bakiye uyarısı" aciklama="Eşiğin altına inince bildirim ve credits.low webhook olayı" sag={<Anahtar acik={esik !== null} onDegis={(v) => { setEsik(v ? Number(esikTaslak) || 200 : null); void senkronize(); toast.success(v ? "Düşük bakiye uyarısı açıldı" : "Düşük bakiye uyarısı kapatıldı"); }} etiket="Düşük bakiye uyarısı" />}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-amber-300/12 text-amber-200"><BellRing className="h-[18px] w-[18px]" /></span>
            <p className="flex-1 text-[13.5px] leading-relaxed text-white/70">{esik ? <>Bakiye <span className="font-semibold text-white">{esik}</span> kredinin altına indiğinde haber verilir.</> : "Bir eşik yaz; bakiye altına inince bildirim ve credits.low olayı gelir."}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); const n = Math.max(1, Number(esikTaslak)); if (!n) return; setEsik(n); setEsikTaslak(""); void senkronize(); toast.success("Uyarı eşiği güncellendi", { description: `Bakiye ${n} kredinin altına inince haber vereceğiz.` }); }} className="mt-4 flex gap-2">
            <div className="relative w-40">
              <input type="number" min={1} value={esikTaslak} onChange={(e) => setEsikTaslak(e.target.value)} placeholder={String(esik ?? 200)} aria-label="Eşik (kredi)" className={cn(girdi, "pr-14 tabular-nums")} />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12.5px] text-white/45">kredi</span>
            </div>
            <button disabled={!esikTaslak} className={cn(birincil, "h-11 px-5")}>Kaydet</button>
          </form>
        </Kart>
        <Kart baslik="Anahtar harcama sınırları" aciklama="Bir anahtar sınırını aşarsa 402 spend_limit_reached döner" sag={<Link href="/panel/api/anahtarlar" className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Düzenle</Link>}>
          {anahtarlar.filter((a) => a.ortam === "canli").length === 0 ? (
            <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-white/[0.06]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/12 text-[#55d6fd]"><KeyRound className="h-[18px] w-[18px]" /></span>
              <p className="min-w-0 flex-1 text-[13px] leading-snug text-white/70">Canlı anahtar yok. Sınırlar canlı anahtar oluşturunca burada görünür.</p>
              <Link href="/panel/api/anahtarlar?yeni=1" className={cn(ikincil, "h-8 shrink-0 px-3 text-[12.5px]")}>Oluştur</Link>
            </div>
          ) : (
            <ul className="space-y-3.5">
              {anahtarlar.filter((a) => a.ortam === "canli").map((a) => {
                const h = faturalanan.filter((u) => u.anahtarId === a.id && u.created_at.startsWith(buAyAnahtar)).reduce((t, u) => t + u.credits, 0);
                const oran = a.aylikSinir ? Math.min(1, h / a.aylikSinir) : 0;
                return (
                  <li key={a.id} className="text-[13px]">
                    <div className="flex items-center gap-3">
                      <KeyRound className="h-3.5 w-3.5 shrink-0 text-[#55d6fd]" />
                      <span className="min-w-0 flex-1 truncate font-medium text-white">{a.ad}</span>
                      <span className="tabular-nums text-white/65">{h.toLocaleString("tr-TR")} / {a.aylikSinir === null ? "sınırsız" : a.aylikSinir.toLocaleString("tr-TR")}</span>
                    </div>
                    {a.aylikSinir !== null && <div className="ml-[26px] mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.6 }} className={cn("h-full rounded-full", oran > 0.9 ? "bg-rose-400" : oran > 0.7 ? "bg-amber-300" : "bg-[#55d6fd]")} /></div>}
                  </li>
                );
              })}
            </ul>
          )}
        </Kart>
      </div>

      <Kart className="mb-6" baslik="Aylık ekstreler" aciklama={`Tahmini TL, ${REFERANS.kredi.toLocaleString("tr-TR")} kredilik paket fiyatıyla (${tl(KREDI_TL)} / kredi)`} govdeSinif="p-0">
        {aylar.length === 0 ? (
          <div className="flex flex-wrap items-center gap-4 px-5 py-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/[0.06] text-white/80"><Receipt className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-white">Henüz faturalı API kullanımı yok</p>
              <p className="mt-0.5 text-[13px] text-white/60">Test anahtarı kullanımı ücretsizdir ve burada görünmez. İlk canlı üretimden sonra aylık ekstren oluşur.</p>
            </div>
            <Link href="/panel/api/anahtarlar?yeni=1" className={cn(ikincil, "shrink-0")}>Canlı anahtar oluştur<ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        ) : (
          <table className="w-full text-left text-[13.5px]">
            <thead><tr className="border-b border-white/[0.06] text-[12.5px] text-white/55"><th className="px-5 py-3 font-medium">Dönem</th><th className="px-3 py-3 text-right font-medium">Üretim</th><th className="px-3 py-3 text-right font-medium">Kredi</th><th className="px-3 py-3 text-right font-medium">TL karşılığı</th><th className="w-36 px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-white/[0.05]">
              {aylar.map((a) => (
                <tr key={a.anahtar} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3"><span className="flex items-center gap-2.5 text-white"><span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.06]"><FileText className="h-4 w-4 text-white/70" /></span>{a.ad}{a.anahtar === buAyAnahtar && <span className="rounded-full bg-amber-300/12 px-2 py-0.5 text-[11.5px] font-medium text-amber-200">Açık dönem</span>}</span></td>
                  <td className="px-3 py-3 text-right tabular-nums text-white/60">{a.istek}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-white">{a.kredi.toLocaleString("tr-TR")}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-white/60">{tl(a.kredi * KREDI_TL)}</td>
                  <td className="px-5 py-3 text-right"><button onClick={() => disaAktar(a)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Download className="h-3.5 w-3.5" />CSV ekstre</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Kart>

      <Kart baslik="Model fiyatları" aciklama="Kredi cinsinden; görsel modellerde adet, saniye başı fiyatlı videolarda süre çarpılır"
        sag={<SecimSerit id="fiyat-tur" kucuk secenek={(["gorsel", "video", "ses", "muzik", "3d"] as const).map((t) => ({ id: t as string, ad: TUR_ADI[t] }))} deger={fiyatTur} onDegis={setFiyatTur} />} govdeSinif="p-0">
        <table className="w-full text-left text-[13.5px]">
          <tbody className="divide-y divide-white/[0.05]">
            {MODELLER.filter((m) => m.tur === fiyatTur).map((m) => (
              <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group transition-colors hover:bg-white/[0.025]">
                <td className="px-5 py-3"><Link href={`/panel/api/modeller/${m.id}`} className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] transition group-hover:scale-105"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={18} /></span><span><span className="block font-medium text-white group-hover:underline">{m.ad}</span><span className="block text-[12px] text-white/50">{m.saglayici}</span></span></Link></td>
                <td className="hidden px-3 py-3 font-mono text-[12px] text-white/50 sm:table-cell">{m.id}</td>
                <td className="px-3 py-3 text-right"><span className="text-[15px] font-semibold tabular-nums text-white">{m.kisit?.krediSn ?? m.kredi}</span> <span className="text-white/55">kredi {m.tur === "gorsel" ? "/ görsel" : m.kisit?.krediSn ? "/ sn" : "/ istek"}</span></td>
                <td className="hidden px-5 py-3 text-right tabular-nums text-white/65 sm:table-cell">{tl((m.kisit?.krediSn ?? m.kredi) * KREDI_TL)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-white/[0.06] px-5 py-3 text-[12.5px] text-white/55">Test anahtarıyla yapılan istekler ücretsizdir; örnek çıktı döner.</p>
      </Kart>
    </>
  );
}
