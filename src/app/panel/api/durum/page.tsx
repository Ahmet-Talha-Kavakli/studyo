"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, Check, CircleDashed, Loader2, RefreshCw, Webhook, X } from "lucide-react";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { apiIstek } from "@/lib/api/istemci";
import { MODELLER } from "@/lib/catalog";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { SayfaBaslik, ikincil, sureMetin, useSeciliAnahtar } from "@/components/api/ui";
import { useHazir, yuzdelik } from "@/components/api/veri";
import { cn } from "@/lib/utils";

type Durum = "ok" | "uyari" | "hata" | "bilinmiyor" | "demo";
type Bilesen = { id: string; ad: string; ozet: string; durum: Durum; detay?: string; ms?: number; tur?: string; saglayici?: string };
const TUR_ADLARI: Record<string, string> = { gorsel: "Görsel modelleri", video: "Video modelleri", ses: "Ses ve müzik modelleri", "3d": "3D modelleri" };
const kart = "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";

const DURUM_STIL: Record<Durum, { ad: string; hap: string; karo: string; ikon: React.ElementType }> = {
  ok: { ad: "Çalışıyor", hap: "bg-emerald-400/12 text-emerald-300", karo: "bg-emerald-400/12 text-emerald-300", ikon: Check },
  uyari: { ad: "Dikkat", hap: "bg-amber-300/12 text-amber-200", karo: "bg-amber-300/12 text-amber-200", ikon: AlertTriangle },
  hata: { ad: "Hata", hap: "bg-rose-400/12 text-rose-300", karo: "bg-rose-400/12 text-rose-300", ikon: X },
  demo: { ad: "Önizleme", hap: "bg-amber-300/12 text-amber-200", karo: "bg-white/[0.06] text-white/70", ikon: CircleDashed },
  bilinmiyor: { ad: "Veri yok", hap: "bg-white/[0.06] text-white/55", karo: "bg-white/[0.06] text-white/50", ikon: CircleDashed },
};

/** Bir türdeki katalog modellerinin sağlayıcıları (tekil, en çok 4) — logolar için. */
function turSaglayicilari(tur: string) {
  const turler = tur === "ses" ? ["ses", "muzik"] : [tur];
  const gorulen = new Set<string>();
  return MODELLER.filter((m) => turler.includes(m.tur)).filter((m) => (gorulen.has(m.saglayici) ? false : (gorulen.add(m.saglayici), true))).slice(0, 4);
}

function DurumHap({ d }: { d: Durum }) {
  const s = DURUM_STIL[d];
  return <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium", s.hap)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{s.ad}</span>;
}

export default function DurumSayfasi() {
  const hazir = useHazir();
  const olcumler = useApiAnahtar((s) => s.olcumler);
  const teslimler = useApiAnahtar((s) => s.teslimler);
  const uretimler = useApiAnahtar((s) => s.uretimler);
  const olcumEkle = useApiAnahtar((s) => s.olcumEkle);
  const [anahtar] = useSeciliAnahtar();
  const [bilesenler, setBilesenler] = useState<Bilesen[]>([]);
  const [olculuyor, setOlculuyor] = useState(false);
  const [son, setSon] = useState<number | null>(null);

  const olc = useCallback(async () => {
    setOlculuyor(true);
    const pingler = [];
    for (let i = 0; i < 3; i++) pingler.push(await apiIstek(null, "GET", "/ping", { kaydetme: true }));
    const pOk = pingler.every((p) => p.durum === 200);
    const pMs = Math.round(pingler.reduce((t, p) => t + p.sureMs, 0) / pingler.length);
    olcumEkle({ zaman: Date.now(), ms: pMs, ok: pOk });
    const liste: Bilesen[] = [{ id: "ping", ad: "API ağ geçidi", ozet: "GET /v1/ping", durum: pOk ? (pMs > 1500 ? "uyari" : "ok") : "hata", detay: pOk ? "3 ölçüm ortalaması" : "yanıt yok", ms: pOk ? pMs : undefined }];
    if (anahtar) {
      const a = await apiIstek(anahtar.tam, "GET", "/account", { kaydetme: true });
      liste.push({ id: "hesap", ad: "Kimlik doğrulama ve hesap", ozet: "GET /v1/account", durum: a.durum === 200 ? "ok" : a.durum === 401 ? "uyari" : "hata", detay: a.durum === 200 ? undefined : `HTTP ${a.durum}`, ms: a.durum === 200 ? a.sureMs : undefined });
      const m = await apiIstek(anahtar.tam, "GET", "/models", { kaydetme: true });
      liste.push({ id: "katalog", ad: "Model kataloğu", ozet: "GET /v1/models", durum: m.durum === 200 ? "ok" : "hata", detay: m.durum === 200 ? `${(m.govde as { total?: number }).total ?? "?"} model` : `HTTP ${m.durum}`, ms: m.durum === 200 ? m.sureMs : undefined });
    } else {
      liste.push({ id: "hesap", ad: "Kimlik doğrulama ve hesap", ozet: "Ölçmek için bir API anahtarı oluştur", durum: "bilinmiyor" });
    }
    const son24 = teslimler.filter((t) => Date.now() - Date.parse(t.created_at) < 86400_000 && t.state !== "pending");
    const basarili = son24.filter((t) => t.state === "succeeded").length;
    liste.push({ id: "webhook", ad: "Webhook teslimi", ozet: "Son 24 saatteki teslimlerin", durum: !son24.length ? "bilinmiyor" : basarili / son24.length >= 0.95 ? "ok" : "uyari", detay: son24.length ? `yüzde ${Math.round((basarili / son24.length) * 100)} başarılı · ${son24.length} teslim` : "teslim yok" });
    try {
      const r = await fetch("/api/saglayici-durum", { cache: "no-store" });
      const j = (await r.json()) as { durum: Record<string, { saglayici: string; gercek: boolean }> };
      for (const [t, v] of Object.entries(j.durum)) liste.push({ id: "tur-" + t, tur: t, saglayici: v.gercek ? v.saglayici : undefined, ad: TUR_ADLARI[t] ?? t, ozet: v.gercek ? `Sağlayıcı: ${v.saglayici}` : "Sağlayıcı anahtarı tanımlı değil; örnek çıktı döner", durum: v.gercek ? "ok" : "demo", detay: v.gercek ? "gerçek model" : "simulated: true" });
    } catch { liste.push({ id: "saglayici", ad: "Model sağlayıcıları", ozet: "/api/saglayici-durum", durum: "hata" }); }
    setBilesenler(liste); setSon(Date.now()); setOlculuyor(false);
  }, [anahtar, olcumEkle, teslimler]);

  useEffect(() => { if (hazir) void olc(); }, [hazir]); // eslint-disable-line react-hooks/exhaustive-deps

  const saatler = useMemo(() => {
    const simdi = Date.now(), dilim = 3600_000;
    return Array.from({ length: 48 }, (_, i) => {
      const bas = simdi - (48 - i) * dilim;
      const o = olcumler.filter((x) => x.zaman >= bas && x.zaman < bas + dilim);
      return { bas, toplam: o.length, hata: o.filter((x) => !x.ok).length, p50: yuzdelik(o.filter((x) => x.ok).map((x) => x.ms), 50) };
    });
  }, [olcumler]);
  const olculmus = saatler.filter((s) => s.toplam);
  const erisim = olculmus.length ? (olculmus.reduce((t, s) => t + (s.toplam - s.hata), 0) / olculmus.reduce((t, s) => t + s.toplam, 0)) * 100 : null;
  const p50 = yuzdelik(olcumler.filter((o) => o.ok && Date.now() - o.zaman < 86400_000).map((o) => o.ms), 50);
  const genel = bilesenler.some((b) => b.durum === "hata") ? "hata" : bilesenler.some((b) => b.durum === "uyari") ? "uyari" : "ok";
  const demo = bilesenler.some((b) => b.durum === "demo");
  const basarisizUretim = uretimler.filter((u) => Date.now() - Date.parse(u.created_at) < 86400_000 && u.error?.code === "provider_error").length;
  const ilk = olculuyor && !bilesenler.length;
  const renk = ilk ? "#ffffff" : genel === "ok" ? "#34d399" : genel === "uyari" ? "#fcd34d" : "#fb7185";
  const platform = bilesenler.filter((b) => !b.tur);
  const modeller = bilesenler.filter((b) => b.tur);

  if (!hazir) return <div className="h-[60vh]" />;
  return (
    <>
      <SayfaBaslik baslik="Durum" aciklama="Bu sayfa iddia etmez, ölçer: her bileşen şimdi bu tarayıcıdan gerçek istekle denenir. Geçmiş, panel açıkken dakikada bir yapılan ölçümlerden oluşur." />

      {/* Genel durum */}
      <motion.section className="relative mb-6 overflow-hidden rounded-[30px] ring-1 ring-white/[0.09]" style={{ background: "#0b0d0e" }}>
        <span className="pointer-events-none absolute -left-24 -top-32 h-80 w-[460px] rounded-full opacity-60 blur-[90px] transition-colors duration-700" style={{ background: `${renk}33` }} />
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,transparent,black_45%,transparent)]" />
        <div className="relative flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-7">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            {!ilk && <span className="absolute inset-0 animate-ping rounded-full opacity-20" style={{ background: renk }} />}
            <span className="absolute inset-1 rounded-full opacity-25" style={{ background: renk }} />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full" style={{ background: renk }}>
              {ilk ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : genel === "ok" ? <Check className="h-5 w-5 text-[#04170f]" strokeWidth={3} /> : genel === "uyari" ? <AlertTriangle className="h-5 w-5 text-[#1d1503]" /> : <X className="h-5 w-5 text-white" strokeWidth={3} />}
            </span>
          </div>
          <div className="w-full min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.p key={ilk ? "o" : genel + demo} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-[24px] font-semibold tracking-[-0.025em] text-white sm:text-[28px]">
                {ilk ? "Ölçülüyor" : genel === "ok" ? "Her şey yanıt veriyor" : genel === "uyari" ? "Çalışıyor, dikkat gereken bileşen var" : "Bir bileşende sorun var"}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1 text-[14px] text-white/70">
              {demo && !ilk ? "Modeller demo modunda: sağlayıcı anahtarı tanımlı olmayan türler örnek çıktı döndürür. " : ""}
              {son ? `Son ölçüm ${new Date(son).toLocaleTimeString("tr-TR")}` : ""}{basarisizUretim ? ` · son 24 saatte ${basarisizUretim} sağlayıcı hatası` : ""}
            </p>
          </div>
          <button onClick={olc} disabled={olculuyor} className={cn(ikincil, "h-10 bg-black/30 backdrop-blur")}>{olculuyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Yeniden ölç</button>
        </div>
        <dl className="relative grid grid-cols-3 gap-px border-t border-white/[0.07] bg-white/[0.05]">
          {[
            ["API p50", p50 === null ? null : sureMetin(Math.round(p50))],
            ["Erişim · 48 sa", erisim === null ? null : `yüzde ${erisim.toFixed(erisim === 100 ? 0 : 2).replace(".", ",")}`],
            ["Bileşen", bilesenler.length ? `${bilesenler.filter((b) => b.durum !== "bilinmiyor").length} / ${bilesenler.length}` : null],
          ].map(([e, v]) => (
            <div key={e} className="min-w-0 bg-[#0b0d0e]/80 px-3.5 py-3.5 sm:px-5">
              <dt className="truncate text-[12px] text-white/55">{e}</dt>
              <dd className={cn("mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight", v ? "text-white" : "text-white/35")}>{v ?? "Veri yok"}</dd>
            </div>
          ))}
        </dl>
      </motion.section>

      {/* Platform */}
      <Grup baslik="Platform" aciklama="Ağ geçidi, kimlik, katalog ve webhook teslimi">
        {platform.map((b, i) => <Satir key={b.id} b={b} i={i} saatler={b.id === "ping" ? saatler.slice(-24) : undefined} />)}
        {!platform.length && <Iskelet />}
      </Grup>

      {/* Modeller */}
      <Grup baslik="Model sağlayıcıları" aciklama="Tür başına gerçek sağlayıcı mı, örnek çıktı mı">
        {modeller.map((b, i) => <Satir key={b.id} b={b} i={i} />)}
        {!modeller.length && <Iskelet />}
      </Grup>

      {/* 48 saat */}
      <section className={cn(kart, "p-5 sm:p-6")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15.5px] font-semibold text-white">Son 48 saat</h2>
            <p className="mt-0.5 text-[13px] text-white/60">Bu tarayıcıdan yapılan ping ölçümleri · saatlik</p>
          </div>
          <p className="text-[13px] text-white/60">Erişilebilirlik <span className="ml-1 text-[18px] font-semibold tabular-nums text-white">{erisim === null ? "Veri yok" : `yüzde ${erisim.toFixed(2).replace(".", ",")}`}</span></p>
        </div>
        <SaatCubugu saatler={saatler} yukseklik={52} />
        <div className="mt-2 flex justify-between text-[11.5px] text-white/50"><span>48 sa önce</span><span>Şimdi</span></div>
        <div className="mt-4 flex flex-wrap gap-4 text-[12px] text-white/60">
          {[["bg-emerald-400", "Sorunsuz"], ["bg-amber-300", "Kısmi hata"], ["bg-rose-400", "Kesinti"], ["bg-white/[0.08]", "Ölçüm yok"]].map(([r, a]) => <span key={a} className="inline-flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-[3px]", r)} />{a}</span>)}
        </div>
      </section>
    </>
  );
}

function Grup({ baslik, aciklama, children }: { baslik: string; aciklama: string; children: React.ReactNode }) {
  return (
    <section className={cn(kart, "mb-6 overflow-hidden")}>
      <div className="flex items-end justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15.5px] font-semibold text-white">{baslik}</h2>
          <p className="mt-0.5 text-[13px] text-white/60">{aciklama}</p>
        </div>
      </div>
      <ul className="divide-y divide-white/[0.05]">{children}</ul>
    </section>
  );
}

function Iskelet() {
  return <li className="flex items-center gap-3 px-5 py-6 text-[13px] text-white/55 sm:px-6"><Loader2 className="h-4 w-4 animate-spin" />Ölçülüyor</li>;
}

function Satir({ b, i, saatler }: { b: Bilesen; i: number; saatler?: { bas: number; toplam: number; hata: number; p50: number | null }[] }) {
  const s = DURUM_STIL[b.durum];
  const logolar = b.tur ? turSaglayicilari(b.tur) : [];
  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-5 py-4 sm:px-6">
      {b.tur ? (
        <span className="flex shrink-0 -space-x-2">
          {logolar.map((m) => (
            <span key={m.saglayici} title={m.saglayici} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141518] ring-2 ring-[#0d0e10]"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={17} /></span>
          ))}
        </span>
      ) : (
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", s.karo)}>{b.id === "webhook" ? <Webhook className="h-4 w-4" /> : b.id === "ping" ? <Activity className="h-4 w-4" /> : <s.ikon className="h-4 w-4" />}</span>
      )}
      <div className="min-w-[180px] flex-1">
        <p className="text-[14.5px] font-medium text-white">{b.ad}</p>
        <p className="text-[12.5px] text-white/60">{b.ozet}</p>
      </div>
      {saatler && <div className="hidden w-[180px] md:block"><SaatCubugu saatler={saatler} yukseklik={22} /></div>}
      <div className="flex items-center gap-2">
        {b.detay && <span className="text-[12.5px] text-white/55">{b.detay}</span>}
        {b.ms !== undefined && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium tabular-nums text-white/85">{sureMetin(b.ms)}</span>}
        <DurumHap d={b.durum} />
      </div>
    </motion.li>
  );
}

function SaatCubugu({ saatler, yukseklik }: { saatler: { bas: number; toplam: number; hata: number; p50: number | null }[]; yukseklik: number }) {
  const [ust, setUst] = useState<number | null>(null);
  return (
    <div className="relative mt-3 flex gap-[3px]" style={{ height: yukseklik }} onMouseLeave={() => setUst(null)}>
      {saatler.map((s, i) => (
        <motion.span key={s.bas} onMouseEnter={() => setUst(i)} initial={{ scaleY: 0.3, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ delay: i * 0.008, duration: 0.3 }}
          className={cn("min-w-0 flex-1 origin-bottom rounded-[3px] transition-opacity", !s.toplam ? "bg-white/[0.08]" : s.hata === 0 ? "bg-emerald-400" : s.hata / s.toplam < 0.2 ? "bg-amber-300" : "bg-rose-400", ust !== null && ust !== i && "opacity-50")} />
      ))}
      <AnimatePresence>
        {ust !== null && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className="pointer-events-none absolute bottom-full z-20 mb-2 w-48 rounded-[12px] bg-[#17181c]/95 px-3 py-2 text-[12px] ring-1 ring-white/[0.12] backdrop-blur-xl"
            style={{ left: `clamp(0px, calc(${((ust + 0.5) / saatler.length) * 100}% - 96px), calc(100% - 192px))` }}>
            <p className="font-medium text-white">{new Date(saatler[ust].bas).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
            <p className="mt-0.5 text-white/60">{saatler[ust].toplam ? `${saatler[ust].toplam} ölçüm · ${saatler[ust].hata} hata · p50 ${sureMetin(saatler[ust].p50)}` : "Ölçüm yok (panel kapalıydı)"}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
