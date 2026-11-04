"use client";

/**
 * /durum — "A + C" (2026-10-29, incident.io dili):
 *  Sakin durum kartı (renk genel duruma göre) + Web/API/MCP canlı ms hapları
 *  Açılır gruplar: başlıkta bileşen sayısı ve ortalama çalışma yüzdesi; satırda kendi yüzdesi, gün çubukları,
 *  model sağlayıcılarında gerçek logolar
 *  Olay geçmişi: renkli ay takvimi + seçilen günün olay ayrıntısı (etki, bileşenler, güncellemeler, kaynak)
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, RefreshCw, TriangleAlert, Wrench } from "lucide-react";
import { BAKIMLAR, DURUM, EVRE_AD, GRUPLAR, OLAYLAR, TUM_BILESENLER, enKotu, gunAnahtari, type DurumKodu } from "@/lib/durum";
import { GunCubuklari, type GunBilgi, anlikDurum, calismaYuzdesi, gunMetni, gunleriKur, useDurum, useGunSayisi, useSaatDilimi, yuzdeMetni } from "./ortak";
import { cn } from "@/lib/utils";

const ACIK_ANAHTAR = "vayra-durum-gruplar-2";
const yay = { type: "spring", stiffness: 420, damping: 34 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const GENEL: Record<DurumKodu, [string, string]> = {
  calisiyor: ["Her şey yolunda", "Bilinen bir sorun yok."], demo: ["Her şey yolunda", "Bilinen bir sorun yok."],
  bakim: ["Planlı bakım sürüyor", "Bazı bileşenler kısa süre yavaşlayabilir."], yavas: ["Bazı sistemler yavaş", "Üretimler normalden uzun sürebilir."],
  kismi: ["Kısmi kesinti", "Bazı bileşenler çalışmıyor; ekip üzerinde."], kesinti: ["Büyük kesinti", "Ekip üzerinde çalışıyor; güncellemeler aşağıda."],
};
const ANA = [{ id: "web", ad: "Web", uzun: "Web uygulaması" }, { id: "api", ad: "API", uzun: "REST API" }, { id: "mcp", ad: "MCP", uzun: "MCP sunucusu" }];

/* Model sağlayıcılarının gerçek logoları (koyu: beyaz dolgulu logo) */
const LOGO: Record<string, { src: string; koyu?: boolean }> = {
  veo: { src: "/marka/renkli/google-color.svg" }, gemini: { src: "/marka/renkli/nanobanana-color.svg" }, kling: { src: "/marka/renkli/kling-color.svg" },
  seedance: { src: "/marka/renkli/bytedance-color.svg" }, seedream: { src: "/marka/renkli/bytedance-color.svg" }, minimax: { src: "/marka/renkli/minimax-color.svg" },
  openai: { src: "/marka/renkli/openai.svg", koyu: true }, eleven: { src: "/marka/renkli/elevenlabs.svg", koyu: true }, meshy: { src: "/marka/renkli/meshy-color.svg" },
};

export function DurumIkon({ d, k = 18 }: { d: DurumKodu | null; k?: number }) {
  if (!d) return <span className="shrink-0 rounded-full bg-white/15" style={{ width: k, height: k }} />;
  if (d === "demo") return <span title="Önizleme modu" className="flex shrink-0 items-center justify-center rounded-full bg-white/15 font-bold text-white/70" style={{ width: k, height: k, fontSize: k * 0.5 }}>D</span>;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full text-[#0b0b0d]" style={{ width: k, height: k, background: DURUM[d].renk }}>
      {d === "calisiyor" ? <Check className="h-[65%] w-[65%]" strokeWidth={3} /> : d === "bakim" ? <Wrench className="h-[58%] w-[58%]" /> : <TriangleAlert className="h-[58%] w-[58%]" />}
    </span>
  );
}

function Nokta({ d, k = 10 }: { d: DurumKodu | null; k?: number }) {
  const r = !d ? "rgba(255,255,255,.25)" : DURUM[d].renk;
  return (
    <span className="relative flex shrink-0" style={{ width: k, height: k }}>
      {d === "calisiyor" && <span className="absolute inset-0 animate-ping rounded-full opacity-50" style={{ background: r }} />}
      <span className="relative h-full w-full rounded-full" style={{ background: r }} />
    </span>
  );
}

function Logo({ id, k = 26 }: { id: string; k?: number }) {
  const l = LOGO[id];
  if (!l) return null;
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-[8px]", l.koyu ? "bg-black ring-1 ring-white/15" : "bg-white")} style={{ width: k, height: k }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={l.src} alt="" style={{ width: k * 0.62, height: k * 0.62 }} />
    </span>
  );
}

export function DurumAna() {
  const { veri, hata, yukleniyor, yenile } = useDurum();
  const dilim = useSaatDilimi();
  const gunSayisi = useGunSayisi();
  const [acik, setAcik] = useState<Record<string, boolean>>({ uygulama: true, studyo: false, gelistirici: true, saglayici: false });
  useEffect(() => { try { const k = localStorage.getItem(ACIK_ANAHTAR); if (k) setAcik(JSON.parse(k)); } catch { /* yok */ } }, []);
  const grupDegis = (id: string) => setAcik((a) => { const y = { ...a, [id]: !a[id] }; try { localStorage.setItem(ACIK_ANAHTAR, JSON.stringify(y)); } catch { /* yok */ } return y; });

  const harita = useMemo(() => new Map((veri?.bilesenler ?? []).map((b) => [b.id, b])), [veri]);
  const bugun = gunAnahtari(Date.now());
  const aktifOlaylar = OLAYLAR.filter((o) => o.bitis >= bugun && o.guncellemeler[0]?.evre !== "cozuldu");
  const tumDurumlar = GRUPLAR.flatMap((g) => g.bilesenler.map((b) => anlikDurum(b.id, harita.get(b.id)))).filter(Boolean) as DurumKodu[];
  const genel: DurumKodu | null = hata ? "kesinti" : veri ? enKotu(tumDurumlar.filter((d) => d !== "demo")) : null;
  const demoVar = tumDurumlar.includes("demo");
  const renk = genel ? DURUM[genel].renk : "#6b7280";
  /* Platformun günleri: Web, API ve MCP'nin her gün en kötü durumu; olaylar o güne düşen tüm kayıtlar. */
  const platformGunleri = useMemo<GunBilgi[]>(() => {
    const l = ANA.map((a) => gunleriKur(a.id, harita.get(a.id), veri?.olcumBaslangic ?? null, 30));
    return l[0].map((g, i) => {
      const ds = l.map((x) => x[i].durum).filter((d): d is DurumKodu => !!d);
      const olaylar = OLAYLAR.filter((o) => o.baslangic <= g.gun && o.bitis >= g.gun);
      const kayit = l.reduce<GunBilgi["kayit"]>((t, x) => {
        const k = x[i].kayit; if (!k) return t;
        return t ? { gun: g.gun, olcum: t.olcum + k.olcum, basarisiz: t.basarisiz + k.basarisiz, yavas: t.yavas + k.yavas } : { ...k };
      }, undefined);
      return { gun: g.gun, durum: ds.length || olaylar.length ? enKotu([...ds, ...olaylar.map((o) => o.etki)]) : null, kayit, olaylar, olcumOncesi: g.olcumOncesi };
    });
  }, [harita, veri]);
  const yuzdeler = ANA.map((a) => calismaYuzdesi(harita.get(a.id))).filter((y): y is number => y !== null);
  const genelYuzde = yuzdeler.length ? yuzdeler.reduce((a, b) => a + b, 0) / yuzdeler.length : null;
  const sonOlay = OLAYLAR.reduce<string | null>((m, o) => (!m || o.bitis > m ? o.bitis : m), null);
  const sonOlayGun = sonOlay ? Math.max(0, Math.floor((new Date(bugun).getTime() - new Date(sonOlay).getTime()) / 864e5)) : null;
  const sonOlcum = veri?.zaman ? new Date(veri.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

  return (
    <MotionConfig reducedMotion="user">
      {/* Genel durum: halkalı durum simgesi + başlık, tüm platformun 30 günü, Web/API/MCP kartları */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} aria-live="polite"
        className="relative overflow-hidden rounded-[28px] bg-[#111113]" style={{ boxShadow: `inset 0 0 0 1px ${renk}38` }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(70% 90% at 0% 0%, ${renk}24, transparent 62%)` }} />
        <div className="relative p-5 sm:p-8">
          <div className="flex items-start gap-4 sm:items-center sm:gap-6">
            <span className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
              {genel === "calisiyor" && [0, 1].map((k) => (
                <motion.span key={k} className="absolute inset-0 rounded-full" style={{ border: `1.5px solid ${renk}` }}
                  initial={{ scale: 0.55, opacity: 0.7 }} animate={{ scale: 1.15, opacity: 0 }} transition={{ duration: 2.6, repeat: Infinity, delay: k * 1.3, ease: "easeOut" }} />
              ))}
              <span className="absolute inset-[10%] rounded-full" style={{ background: `${renk}22` }} />
              {genel ? <DurumIkon d={genel} k={40} /> : <Loader2 className="h-6 w-6 animate-spin text-white/60" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[26px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[36px]">{hata ? "Durum bilgisi alınamadı" : genel ? GENEL[genel][0] : "Durum ölçülüyor"}</p>
              <p className="mt-1 text-[14px] text-white/70 sm:text-[15.5px]">
                {hata ? "Ölçüm sunucusuna ulaşılamadı; birazdan tekrar denenecek." : genel ? GENEL[genel][1] : "İlk ölçüm yapılıyor."}
                {!hata && sonOlayGun !== null && <span className="text-white/55"> Son olaydan bu yana {sonOlayGun} gün.</span>}
              </p>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => void yenile()} disabled={yukleniyor}
                className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.12] disabled:opacity-60">
                <RefreshCw className={cn("h-3.5 w-3.5", yukleniyor && "animate-spin")} />Yeniden ölç
              </motion.button>
              <span className="text-[12px] tabular-nums text-white/55">{sonOlcum ? `Son ölçüm ${sonOlcum}` : "Ölçülüyor"}</span>
            </div>
          </div>

          {/* Platformun son 30 günü: Web, API ve MCP'nin her gün en kötü durumu */}
          <div className="mt-7">
            <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-white/65">Son 30 gün · tüm platform</span>
              <span className="tabular-nums text-white/85">{genelYuzde !== null ? <><span className="font-semibold text-white">{yuzdeMetni(genelYuzde)}</span> çalışma</> : "Ölçülüyor"}</span>
            </div>
            <GunCubuklari gunler={platformGunleri} etiket="Tüm platform: son 30 gün" />
          </div>
        </div>

        <div className="relative grid grid-cols-3 border-t border-white/[0.07]">
          {ANA.map((a, i) => {
            const b = harita.get(a.id), d = anlikDurum(a.id, b), y = calismaYuzdesi(b);
            return (
              <div key={a.id} className={cn("min-w-0 px-4 py-4 sm:px-8 sm:py-5", i > 0 && "border-l border-white/[0.07]")}>
                <p className="flex items-center gap-2 text-[12.5px] text-white/65 sm:text-[13.5px]"><Nokta d={d} k={7} /><span className="truncate sm:hidden">{a.ad}</span><span className="hidden truncate sm:inline">{a.uzun}</span></p>
                <p className="mt-1.5 text-[22px] font-semibold leading-none tracking-[-0.03em] text-white sm:text-[28px]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={b?.ms ?? "x"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="inline-block tabular-nums">{b?.ms ?? "…"}</motion.span>
                  </AnimatePresence>
                  <span className="ml-1 text-[13px] font-normal text-white/55">ms</span>
                </p>
                <p className="mt-1.5 truncate text-[12px] text-white/55 sm:text-[12.5px]">{y !== null ? <>{yuzdeMetni(y)}<span className="hidden sm:inline"> çalışma</span></> : "Ölçülüyor"}</p>
              </div>
            );
          })}
        </div>
      </motion.section>
      <div className="mt-2 flex items-center justify-between px-1 sm:hidden">
        <span className="text-[12px] tabular-nums text-white/55">{sonOlcum ? `Son ölçüm ${sonOlcum}` : "Ölçülüyor"}</span>
        <button onClick={() => void yenile()} disabled={yukleniyor} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.1]">
          <RefreshCw className={cn("h-3.5 w-3.5", yukleniyor && "animate-spin")} />Yeniden ölç
        </button>
      </div>

      {demoVar && (
        <p className="mt-3 flex gap-2.5 rounded-[16px] bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-white/65 ring-1 ring-white/[0.07]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span><b className="font-medium text-white">Önizleme</b> yazan bileşenler bu ortamda önizleme modunda: model sağlayıcısının anahtarı tanımlı değil, üretimler önizlemeyle tamamlanıyor ve çalışma süresi ölçülmüyor.</span>
        </p>
      )}

      {/* Aktif olaylar + bakımlar */}
      {aktifOlaylar.map((o) => (
        <Link key={o.id} href={`/durum/olay/${o.id}`} className="mt-4 block rounded-[20px] p-5 transition hover:brightness-110" style={{ background: `${DURUM[o.etki].renk}14`, boxShadow: `inset 0 0 0 1px ${DURUM[o.etki].renk}66` }}>
          <p className="flex items-center gap-2 text-[16px] font-semibold text-white"><DurumIkon d={o.etki} k={18} />{o.baslik}</p>
          <p className="mt-2 text-[14px] text-white/70"><b className="font-medium text-white">{EVRE_AD[o.guncellemeler[0].evre]}</b> · {o.guncellemeler[0].metin}</p>
        </Link>
      ))}
      {BAKIMLAR.map((b) => (
        <Link key={b.id} href={`/durum/olay/${b.id}`} className="mt-4 flex items-center gap-3 rounded-[20px] p-4 ring-1 ring-sky-500/40 transition hover:bg-sky-500/[0.05]">
          <DurumIkon d="bakim" k={18} /><span className="flex-1 text-[15px] text-white">{b.baslik}</span><span className="text-[13px] text-sky-300">Planlı bakım</span>
        </Link>
      ))}

      {/* Gruplar */}
      <div className="mb-3 mt-10 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Bileşenler</h2>
        <span className="text-[13px] text-white/60">Son {gunSayisi} gün{veri && <> · ölçüm {gunMetni(gunAnahtari(veri.olcumBaslangic))} tarihinde başladı</>}</span>
      </div>
      <div className="space-y-2">
        {GRUPLAR.map((g, gi) => {
          const durumlar = g.bilesenler.map((b) => anlikDurum(b.id, harita.get(b.id)));
          const hepsiDemo = !!veri && durumlar.every((d) => d === "demo");
          const gd: DurumKodu | null = !veri ? null : hepsiDemo ? "demo" : enKotu(durumlar.filter((d): d is DurumKodu => !!d && d !== "demo"));
          const yuzdeler = g.bilesenler.map((b) => calismaYuzdesi(harita.get(b.id))).filter((y): y is number => y !== null);
          const ort = yuzdeler.length ? yuzdeler.reduce((a, b) => a + b, 0) / yuzdeler.length : null;
          const ac = !!acik[g.id];
          return (
            <motion.section key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + gi * 0.05, ease: EASE }} className="overflow-hidden rounded-[20px] bg-[#111113] ring-1 ring-white/[0.08]">
              <button onClick={() => grupDegis(g.id)} aria-expanded={ac} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]">
                <Nokta d={gd} />
                <span className="min-w-0 flex-1 text-[16px] font-semibold text-white">{g.ad}<span className="ml-2 text-[13px] font-normal text-white/55">{g.bilesenler.length} bileşen</span></span>
                {g.id === "saglayici" && !ac && <span className="hidden gap-1 sm:flex">{g.bilesenler.filter((b, i, l) => l.findIndex((x) => LOGO[x.id]?.src === LOGO[b.id]?.src) === i).slice(0, 6).map((b) => <Logo key={b.id} id={b.id} k={22} />)}</span>}
                <span className="shrink-0 text-[14px] tabular-nums" style={{ color: gd && gd !== "demo" && gd !== "calisiyor" ? DURUM[gd].renk : undefined }}>
                  <span className={cn(gd === "calisiyor" || !gd || gd === "demo" ? "text-white/80" : "")}>{!gd ? "Ölçülüyor" : gd === "demo" ? "Önizleme modu" : gd !== "calisiyor" ? DURUM[gd].ad : ort !== null ? yuzdeMetni(ort) : "Çalışıyor"}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/50 transition-transform duration-200", ac && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {ac && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }} className="overflow-hidden">
                    <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                      {g.bilesenler.map((b) => {
                        const bd = harita.get(b.id), d = anlikDurum(b.id, bd), y = calismaYuzdesi(bd);
                        return (
                          <div key={b.id} data-bilesen={b.id} className="px-5 py-3.5">
                            <p className="mb-2.5 flex items-center justify-between gap-3 text-[14px]">
                              <span className="flex min-w-0 items-center gap-2.5" title={b.aciklama}>
                                {LOGO[b.id] ? <Logo id={b.id} /> : <DurumIkon d={d} k={14} />}
                                <span className="truncate text-white">{b.ad}</span>
                                {LOGO[b.id] && <span className="hidden truncate text-[12.5px] text-white/50 sm:inline">{b.aciklama}</span>}
                              </span>
                              <span className="shrink-0 text-[13px] tabular-nums text-white/70">{d === "demo" ? "Önizleme" : y !== null ? yuzdeMetni(y) : d ? DURUM[d].kisa : ""}{bd?.ms && d !== "demo" ? <span className="ml-2 text-white/45">{bd.ms} ms</span> : null}</span>
                            </p>
                            <GunCubuklari gunler={gunleriKur(b.id, bd, veri?.olcumBaslangic ?? null, gunSayisi)} etiket={`${b.ad}: son ${gunSayisi} gün`} />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-white/60">
        {(["calisiyor", "yavas", "kismi", "kesinti", "bakim"] as DurumKodu[]).map((d) => <span key={d} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: DURUM[d].renk }} />{DURUM[d].ad}</span>)}
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-white/[0.09]" />Ölçüm yok</span>
        {dilim && <span className="ml-auto">Saatler: {dilim}</span>}
      </div>

      <OlayTakvimi />
    </MotionConfig>
  );
}

/* ── Olay geçmişi: ay takvimi + seçilen günün olayı ── */
const HAFTA = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function OlayTakvimi() {
  const bugun = gunAnahtari(Date.now());
  const ilkOlay = OLAYLAR[0]?.baslangic ?? bugun;
  const [ay, setAy] = useState(() => { const [y, a] = ilkOlay.split("-").map(Number); return new Date(y, a - 1, 1); });
  const [sec, setSec] = useState(ilkOlay);
  const gunler = useMemo(() => {
    const bos = (ay.getDay() + 6) % 7, son = new Date(ay.getFullYear(), ay.getMonth() + 1, 0).getDate();
    return [...Array<null>(bos).fill(null), ...Array.from({ length: son }, (_, i) => gunAnahtari(new Date(ay.getFullYear(), ay.getMonth(), i + 1)))];
  }, [ay]);
  const ayOlaySayisi = OLAYLAR.filter((o) => gunler.some((g) => g && o.baslangic <= g && o.bitis >= g)).length;
  const olaylar = OLAYLAR.filter((o) => o.baslangic <= sec && o.bitis >= sec);
  const buAy = ay.getFullYear() === new Date().getFullYear() && ay.getMonth() === new Date().getMonth();
  const ayDegis = (n: number) => setAy(new Date(ay.getFullYear(), ay.getMonth() + n, 1));

  return (
    <section className="mt-14">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Olay geçmişi</h2>
        <Link href="/durum/gecmis" className="group flex items-center gap-1 text-[13.5px] text-white/65 transition hover:text-white">Tüm geçmiş<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
      </div>
      <div className="grid gap-3 md:grid-cols-[330px_minmax(0,1fr)]">
        <div className="rounded-[24px] bg-[#111113] p-5 ring-1 ring-white/[0.08]">
          <div className="flex items-center justify-between">
            <button onClick={() => ayDegis(-1)} aria-label="Önceki ay" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/[0.12]"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-center">
              <p className="text-[15px] font-semibold capitalize text-white">{ay.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</p>
              <p className="text-[12px] text-white/55">{ayOlaySayisi ? `${ayOlaySayisi} kayıtlı olay` : "Olay bildirilmedi"}</p>
            </div>
            <button onClick={() => ayDegis(1)} disabled={buAy} aria-label="Sonraki ay" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white transition hover:bg-white/[0.12] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[12px] text-white/50">{HAFTA.map((g) => <span key={g}>{g}</span>)}</div>
          <LayoutGroup id="durum-takvim">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={ay.getTime()} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }} className="mt-1.5 grid grid-cols-7 gap-1.5">
                {gunler.map((g, i) => {
                  if (!g) return <span key={`b${i}`} />;
                  const o = OLAYLAR.filter((x) => x.baslangic <= g && x.bitis >= g);
                  const d = o.length ? enKotu(o.map((x) => x.etki)) : null;
                  const gelecek = g > bugun;
                  return (
                    <button key={g} onClick={() => setSec(g)} disabled={gelecek} aria-label={gunMetni(g)} aria-pressed={sec === g}
                      className={cn("relative flex aspect-square items-center justify-center rounded-[10px] text-[13px] tabular-nums transition-[filter]", gelecek ? "text-white/20" : "text-white hover:brightness-150", g === bugun && "font-semibold")}
                      style={{ background: gelecek ? undefined : d ? `${DURUM[d].renk}55` : "rgba(63,179,127,.13)" }}>
                      {sec === g && <motion.span layoutId="durum-takvim-z" transition={yay} className="absolute inset-0 rounded-[10px] ring-2 ring-white" />}
                      <span className="relative">{Number(g.slice(8))}</span>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-white/60">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-[#3fb37f]/40" />Sorunsuz</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `${DURUM.yavas.renk}aa` }} />Yavaş</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `${DURUM.kismi.renk}aa` }} />Kısmi kesinti</span>
          </div>
        </div>

        <div className="rounded-[24px] bg-[#111113] p-5 ring-1 ring-white/[0.08] sm:p-6">
          <p className="text-[13px] text-white/55">{gunMetni(sec)}</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={sec} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: EASE }}>
              {olaylar.length ? olaylar.map((o) => (
                <div key={o.id} className="mt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-black" style={{ background: DURUM[o.etki].renk }}>{DURUM[o.etki].ad}</span>
                    {o.guncellemeler[0]?.evre === "cozuldu" && <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[12px] font-medium text-emerald-300">Çözüldü</span>}
                  </div>
                  <Link href={`/durum/olay/${o.id}`} className="mt-3 block text-[21px] font-semibold leading-snug tracking-[-0.02em] text-white hover:underline sm:text-[22px]">{o.baslik}</Link>
                  <div className="mt-4 rounded-[16px] bg-white/[0.04] p-4">
                    <p className="text-[13px] text-white/60">Etkilenen bileşenler</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.bilesenler.map((b) => <span key={b} className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[12.5px] text-white">{TUM_BILESENLER.find((x) => x.id === b)?.ad ?? b}</span>)}
                    </div>
                  </div>
                  {/* Güncellemeler: nokta ve çizgi akışın içinde (mutlak konum metnin üstüne biniyordu) */}
                  <ol className="mt-5">
                    {o.guncellemeler.map((u, k) => (
                      <li key={u.zaman + u.evre} className="flex gap-3.5">
                        <span className="flex w-3 shrink-0 flex-col items-center pt-[5px]">
                          <span className="h-3 w-3 shrink-0 rounded-full ring-4 ring-white/[0.06]" style={{ background: u.evre === "cozuldu" ? "#3fb37f" : DURUM[o.etki].renk }} />
                          {k < o.guncellemeler.length - 1 && <span className="mt-1.5 w-px flex-1 bg-white/10" />}
                        </span>
                        <div className="min-w-0 flex-1 pb-4">
                          <p className="text-[14px] font-semibold text-white">{EVRE_AD[u.evre]}<span className="ml-2 font-normal text-white/55">{gunMetni(u.zaman)}</span></p>
                          <p className="mt-1 text-[14px] leading-relaxed text-white/75">{u.metin}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <Link href={o.kaynak.href} className="mt-2 inline-flex items-center gap-1 text-[13px] text-white/60 transition hover:text-white">Kaynak: {o.kaynak.ad}<ArrowUpRight className="h-3.5 w-3.5" /></Link>
                </div>
              )) : (
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/15"><Check className="h-5 w-5 text-emerald-300" strokeWidth={2.6} /></span>
                  <div><p className="text-[18px] font-semibold text-white">Bu gün olay bildirilmedi</p><p className="text-[13.5px] text-white/60">Renkli günlere dokunarak kayıtlı olayları gör.</p></div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <p className="mt-6 text-[12.5px] leading-relaxed text-white/50">Kayıtlar sürüm notlarında belgelenmiş, çözülmüş hatalardır. Saati bilinmeyen kayıtlarda saat yazmıyoruz.</p>
        </div>
      </div>
    </section>
  );
}
