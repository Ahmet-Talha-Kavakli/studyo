"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, Eye, Timer, MousePointerClick, LogOut, GitBranch,
  UserSearch, Flame, Users2, ArrowRight, TrendingDown, Sparkles, Target, ChevronRight,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Rozet, AD, Sekmeler } from "@/components/admin/ui/temel";
import { YatayCubuk, DonutGrafik, CubukGrafik } from "@/components/admin/grafik";
import { Heatmap } from "@/components/admin/grafik/Heatmap";
import { Funnel } from "@/components/admin/grafik/Funnel";
import { Cekmece } from "@/components/admin/ui/tablo";
import {
  sayfaMetrikleri, pathAkisi, sonrakiSayfalar, exitSayfalari, tiklamaHaritasi,
  modelTercihleri, davranisFunnel, ayniIpKumeleri, leadler, davranisOzet, trafikHeatmap,
} from "@/lib/admin/seed/davranis";
import { sayi, kisaSayi, yuzde } from "@/lib/admin/cekirdek";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* Kullanıcı İzleme / Davranış Analitiği — hangi sayfada kaç kişi, geçirilen süre,
   kim nereden nereye gitti, exit noktaları, tıklama ısı haritası, lead'ler, çoklu-hesap.
   Tüm veri oturum evreninden GERÇEK hesaplanır (davranis.ts). */

const AKSAN = "#55d6fd";
const MOR = "#a78bfa";
const SEKMELER = [
  { id: "sayfalar", ad: "Sayfalar" },
  { id: "akis", ad: "Yolculuk & Akış" },
  { id: "tiklama", ad: "Tıklama Isısı" },
  { id: "funnel", ad: "Funnel & Zaman" },
  { id: "leadler", ad: "Lead'ler" },
  { id: "coklu", ad: "Çoklu Hesap" },
];

export default function DavranisSayfa() {
  const [sekme, setSekme] = useState("sayfalar");
  const oz = useMemo(() => davranisOzet(), []);

  return (
    <RotaGuard modul="analitik">
      <BolumBaslik
        baslik="Davranış · Kullanıcı İzleme"
        ozet="Hangi sayfada kaç kişi, ne kadar durdu, kim nereden nereye gitti — gerçek oturum verisinden"
        ikon={Activity}
      />

      {/* Üst metrikler */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <MetrikKart etiket="Toplam oturum" deger={sayi(oz.toplamOturum)} sayacHedef={oz.toplamOturum} ikon={Eye} />
        <MetrikKart etiket="Ort. oturum süresi" deger={`${Math.floor(oz.ortOturumSn / 60)}dk ${oz.ortOturumSn % 60}sn`} ikon={Timer} />
        <MetrikKart etiket="Ort. sayfa/oturum" deger={oz.ortSayfaOturum} ikon={GitBranch} />
        <MetrikKart etiket="Bounce oranı" deger={yuzde(oz.bounceOran)} delta={-2.4} ikon={TrendingDown} />
        <MetrikKart etiket="Dönüşüm oranı" deger={yuzde(oz.donusumOran)} delta={1.8} ikon={Target} />
        <MetrikKart etiket="Sıcak lead" deger={sayi(oz.leadSayi)} sayacHedef={oz.leadSayi} ikon={Flame} renk="uyari" />
      </div>

      <div className="mb-4"><Sekmeler sekmeler={SEKMELER} aktif={sekme} sec={setSekme} /></div>

      {sekme === "sayfalar" && <SayfalarSekme />}
      {sekme === "akis" && <AkisSekme />}
      {sekme === "tiklama" && <TiklamaSekme />}
      {sekme === "funnel" && <FunnelSekme />}
      {sekme === "leadler" && <LeadSekme />}
      {sekme === "coklu" && <CokluSekme />}
    </RotaGuard>
  );
}

/* ── SAYFALAR: hangi sayfada kaç kişi, dwell, çıkış, dönüşüm katkısı ── */
function SayfalarSekme() {
  const sayfalar = useMemo(() => sayfaMetrikleri(), []);
  const [secili, setSecili] = useState<string | null>(null);
  const enCok = Math.max(...sayfalar.map((s) => s.goruntuleme));

  const detay = secili ? sayfalar.find((s) => s.yol === secili) : null;
  const sonraki = secili ? sonrakiSayfalar(secili, 8) : [];

  return (
    <>
      <Kart className="!p-0 overflow-hidden">
        <div className="overflow-x-auto ad-ince-scroll">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[color:var(--ad-kenar)] text-left">
                {["Sayfa", "Görüntüleme", "Benzersiz", "Ort. Süre", "Çıkış %", "Dönüşüm katkı", ""].map((h, i) => (
                  <th key={h} className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wider", AD.metin3, i > 0 && i < 6 && "text-right")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sayfalar.map((s, i) => (
                <motion.tr key={s.yol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                  onClick={() => setSecili(s.yol)}
                  className="cursor-pointer border-b border-[color:var(--ad-kenar)] last:border-0 transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className={cn("font-medium", AD.metin)}>{s.ad}</div>
                    <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: `${(s.goruntuleme / enCok) * 100}%`, background: AKSAN }} />
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", AD.metin)}>{sayi(s.goruntuleme)}</td>
                  <td className={cn("px-4 py-3 text-right tabular-nums", AD.metin2)}>{sayi(s.benzersiz)}</td>
                  <td className={cn("px-4 py-3 text-right tabular-nums", AD.metin2)}>{Math.floor(s.ortDwellSn / 60)}:{String(s.ortDwellSn % 60).padStart(2, "0")}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span style={{ color: s.cikisOran > 40 ? "var(--ad-tehlike)" : s.cikisOran > 30 ? "var(--ad-uyari)" : "var(--ad-metin-2)" }}>{yuzde(s.cikisOran, 0)}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums"><span className={AD.aksan}>{yuzde(s.donusumKatki, 0)}</span></td>
                  <td className="px-2 py-3 text-right"><ChevronRight className="ml-auto h-4 w-4 text-[color:var(--ad-metin-3)]" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kart>

      <Cekmece acik={!!secili} kapat={() => setSecili(null)} baslik={detay?.ad} genislik="max-w-md">
        {detay && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat etiket="Görüntüleme" deger={sayi(detay.goruntuleme)} />
              <MiniStat etiket="Benzersiz ziyaretçi" deger={sayi(detay.benzersiz)} />
              <MiniStat etiket="Ort. kalma" deger={`${Math.floor(detay.ortDwellSn / 60)}dk ${detay.ortDwellSn % 60}sn`} />
              <MiniStat etiket="Bu sayfada çıkış" deger={yuzde(detay.cikisOran, 0)} vurgu={detay.cikisOran > 40} />
              <MiniStat etiket="Giriş (landing) oranı" deger={yuzde(detay.girisOran, 1)} />
              <MiniStat etiket="Dönüşüm katkısı" deger={yuzde(detay.donusumKatki, 0)} />
            </div>
            <div>
              <h4 className={cn("mb-2 flex items-center gap-2 text-sm font-bold", AD.metin)}><ArrowRight className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Buradan sonra nereye gidiyorlar?</h4>
              {sonraki.length ? (
                <div className="space-y-1.5">
                  {sonraki.map((g) => (
                    <div key={g.hedef} className="flex items-center justify-between rounded-lg border border-[color:var(--ad-kenar)] px-3 py-2">
                      <span className={cn("text-[13px]", AD.metin2)}>{g.hedef}</span>
                      <span className={cn("text-[13px] font-semibold tabular-nums", AD.metin)}>{sayi(g.sayi)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className={cn("text-[13px]", AD.metin3)}>Bu sayfa çoğunlukla çıkış noktası.</p>}
            </div>
          </div>
        )}
      </Cekmece>
    </>
  );
}

/* ── AKIŞ: kim nereden nereye — path geçiş matrisi ── */
function AkisSekme() {
  const gecisler = useMemo(() => pathAkisi().slice(0, 24), []);
  const enCok = Math.max(...gecisler.map((g) => g.sayi));
  const kisa = (y: string) => y.replace("/panel/", "·").replace("/panel", "Panel").replace("/", "") || "Ana";
  return (
    <Kart>
      <h3 className={cn("mb-1 flex items-center gap-2 text-sm font-bold", AD.metin)}><GitBranch className="h-4 w-4 text-[color:var(--ad-aksan)]" /> En güçlü sayfa geçişleri</h3>
      <p className={cn("mb-4 text-[13px]", AD.metin3)}>Kullanıcılar hangi sayfadan hangi sayfaya akıyor — en yoğun 24 geçiş</p>
      <div className="space-y-2">
        {gecisler.map((g, i) => (
          <motion.div key={`${g.kaynak}-${g.hedef}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3">
            <div className="flex w-[38%] shrink-0 items-center justify-end gap-1.5 text-right">
              <span className={cn("truncate text-[13px]", AD.metin2)}>{kisa(g.kaynak)}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ad-metin-3)]" />
            <div className="flex w-[38%] shrink-0 items-center gap-1.5">
              <span className={cn("truncate text-[13px] font-medium", AD.metin)}>{kisa(g.hedef)}</span>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(g.sayi / enCok) * 100}%` }} transition={{ delay: i * 0.02, duration: 0.5 }}
                  className="h-full rounded-full" style={{ background: AKSAN }} />
              </div>
              <span className={cn("w-12 text-right text-[12px] tabular-nums", AD.metin3)}>{kisaSayi(g.sayi)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Kart>
  );
}

/* ── TIKLAMA: hangi buton/model/araç en çok tıklanıyor ── */
function TiklamaSekme() {
  const tiklamalar = useMemo(() => tiklamaHaritasi().slice(0, 14), []);
  const modeller = useMemo(() => modelTercihleri(), []);
  const donutRenkler = [AKSAN, MOR, "#34d399", "#fbbf24", "#f472b6", "#60a5fa"];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Kart>
        <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><MousePointerClick className="h-4 w-4 text-[color:var(--ad-aksan)]" /> En çok tıklanan hedefler</h3>
        <YatayCubuk veri={tiklamalar.map((t) => ({ etiket: t.hedef, deger: t.sayi, alt: t.yol.replace("/panel", "Panel").replace("/", "") || "Ana" }))} />
      </Kart>
      <Kart>
        <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><Sparkles className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Model tercihleri</h3>
        <p className={cn("mb-3 text-[13px]", AD.metin3)}>Kullanıcılar hangi modeli seçiyor</p>
        <div className="flex items-center gap-5">
          <DonutGrafik veri={modeller.slice(0, 6).map((m, i) => ({ etiket: m.model, deger: m.sayi, renk: donutRenkler[i % donutRenkler.length] }))} />
          <div className="flex-1 space-y-1.5">
            {modeller.slice(0, 6).map((m, i) => (
              <div key={m.model} className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: donutRenkler[i % donutRenkler.length] }} />
                  <span className={AD.metin2}>{m.model}</span>
                </span>
                <span className={cn("font-semibold tabular-nums", AD.metin)}>{sayi(m.sayi)}</span>
              </div>
            ))}
          </div>
        </div>
      </Kart>
    </div>
  );
}

/* ── FUNNEL + zaman ── */
function FunnelSekme() {
  const funnel = useMemo(() => davranisFunnel(), []);
  const exit = useMemo(() => exitSayfalari().slice(0, 8), []);
  // trafikHeatmap: [utcGün][saat] ham → Pzt-başı sırala + 0-100 normalize
  const hm = useMemo(() => {
    const ham = trafikHeatmap();
    const pztBasi = [1, 2, 3, 4, 5, 6, 0].map((g) => ham[g]);
    const enCok = Math.max(...pztBasi.flat(), 1);
    return pztBasi.map((satir) => satir.map((v) => Math.round((v / enCok) * 100)));
  }, []);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Kart>
          <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><Target className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Dönüşüm hunisi</h3>
          <Funnel adimlar={funnel.map((f) => ({ asama: f.ad, sayi: f.sayi, oran: f.oran }))} />
        </Kart>
        <Kart>
          <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><LogOut className="h-4 w-4 text-[color:var(--ad-tehlike)]" /> En çok terk edilen sayfalar</h3>
          <YatayCubuk renk="#f87171" veri={exit.map((e) => ({ etiket: e.ad, deger: e.cikis, alt: yuzde(e.oran, 1) }))} />
        </Kart>
      </div>
      <Kart>
        <h3 className={cn("mb-1 flex items-center gap-2 text-sm font-bold", AD.metin)}><Activity className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Trafik ısı haritası</h3>
        <p className={cn("mb-4 text-[13px]", AD.metin3)}>Hafta günü × saat — en yoğun ziyaret saatleri (peak kapasite planlaması)</p>
        <Heatmap veri={hm} />
      </Kart>
    </div>
  );
}

/* ── LEAD'ler: satın alma niyeti yüksek ziyaretçi/kullanıcılar ── */
function LeadSekme() {
  const tumu = useMemo(() => leadler(), []);
  const [tip, setTip] = useState<"hepsi" | "anonim" | "kayitli">("hepsi");
  const liste = useMemo(() => (tip === "hepsi" ? tumu : tumu.filter((l) => l.tip === tip)).slice(0, 60), [tumu, tip]);
  const kayitli = tumu.filter((l) => l.tip === "kayitli").length;
  return (
    <>
      <Kart className="mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className={cn("text-[13px]", AD.metin2)}>
            <span className={cn("text-xl font-bold", AD.metin)}>{sayi(tumu.length)}</span> sıcak lead ·
            <span className="text-[color:var(--ad-aksan)]"> {sayi(kayitli)} upsell adayı</span> (ücretsiz ama limit zorluyor)
          </div>
          <div className="ml-auto flex gap-1.5">
            {(["hepsi", "anonim", "kayitli"] as const).map((t) => (
              <button key={t} onClick={() => setTip(t)}
                className={cn("rounded-full border px-3 py-1.5 text-[12px] font-semibold capitalize transition-colors",
                  tip === t ? "border-[color:var(--ad-aksan)]/40 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>
                {t === "hepsi" ? "Hepsi" : t === "anonim" ? "Anonim" : "Kayıtlı"}
              </button>
            ))}
          </div>
        </div>
      </Kart>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {liste.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}
            className="ad-glass ad-glass-hover p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {l.tip === "kayitli" ? <UserSearch className="h-4 w-4 text-[color:var(--ad-aksan)]" /> : <Eye className="h-4 w-4 text-[color:var(--ad-metin-3)]" />}
                <span className={cn("text-[13px] font-semibold", AD.metin)}>{l.ad ?? "Anonim ziyaretçi"}</span>
              </div>
              <LeadSkor skor={l.skor} />
            </div>
            <div className={cn("mb-2 flex flex-wrap gap-1 text-[11px]", AD.metin3)}>
              <span>{l.kaynak}</span>·<span>{l.ulkeKod}</span>·<span>{l.cihaz}</span>
            </div>
            <div className="space-y-1">
              {l.sinyal.map((s) => (
                <div key={s} className={cn("flex items-center gap-1.5 text-[12px]", AD.metin2)}>
                  <span className="h-1 w-1 rounded-full bg-[color:var(--ad-aksan)]" /> {s}
                </div>
              ))}
            </div>
            {l.kullaniciId && (
              <Link href={`/admin/kullanicilar/${l.kullaniciId}`} className={cn("mt-3 inline-flex items-center gap-1 text-[12px] font-semibold", AD.aksan)}>
                Kullanıcıya git <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );
}

/* ── ÇOKLU HESAP: aynı IP kümeleri (fraud) ── */
function CokluSekme() {
  const kumeler = useMemo(() => ayniIpKumeleri().slice(0, 40), []);
  const banliKume = kumeler.filter((k) => k.kullanicilar.some((u) => u.durum === "banli")).length;
  return (
    <>
      <Kart className="mb-4 !p-4">
        <div className={cn("text-[13px]", AD.metin2)}>
          <span className={cn("text-xl font-bold", AD.metin)}>{sayi(kumeler.length)}</span> IP'de çoklu hesap ·
          <span className="text-[color:var(--ad-tehlike)]"> {sayi(banliKume)} küme banlı hesap içeriyor</span> — self-referral / sahte hesap zinciri şüphesi
        </div>
      </Kart>
      <div className="grid gap-3 md:grid-cols-2">
        {kumeler.map((k, i) => {
          const banli = k.kullanicilar.filter((u) => u.durum === "banli").length;
          return (
            <motion.div key={k.ip} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="ad-glass ad-glass-hover p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-[color:var(--ad-aksan)]" />
                  <span className={cn("font-mono text-[13px] font-semibold", AD.metin)}>{k.ip}</span>
                </div>
                <div className="flex gap-1.5">
                  <Rozet ton="uyari">{k.kullanicilar.length} hesap</Rozet>
                  {banli > 0 && <Rozet ton="tehlike">{banli} banlı</Rozet>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {k.kullanicilar.slice(0, 8).map((u) => (
                  <Link key={u.id} href={`/admin/kullanicilar/${u.id}`}
                    className={cn("rounded-lg border px-2 py-1 text-[12px] transition-colors hover:border-[color:var(--ad-aksan)]/40",
                      u.durum === "banli" ? "border-rose-400/30 text-rose-300" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>
                    {u.ad}
                  </Link>
                ))}
                {k.kullanicilar.length > 8 && <span className={cn("px-2 py-1 text-[12px]", AD.metin3)}>+{k.kullanicilar.length - 8}</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* ── küçük yardımcılar ── */
function MiniStat({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--ad-kenar)] p-3">
      <div className={cn("text-[11px]", AD.metin3)}>{etiket}</div>
      <div className={cn("mt-1 text-[17px] font-bold tabular-nums", vurgu ? "text-[color:var(--ad-tehlike)]" : AD.metin)}>{deger}</div>
    </div>
  );
}

function LeadSkor({ skor }: { skor: number }) {
  const ton = skor >= 80 ? "var(--ad-tehlike)" : skor >= 60 ? "var(--ad-uyari)" : "var(--ad-aksan)";
  return (
    <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums" style={{ background: `${ton}1f`, color: ton }}>
      <Flame className="h-3 w-3" /> {skor}
    </span>
  );
}
