"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Check, Gauge, KeyRound, Loader2, Zap } from "lucide-react";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { apiIstek, senkronize } from "@/lib/api/istemci";
import { toast } from "@/lib/toast";
import { AnahtarSecici, Kart, KodEditor, OrtamRozet, SayfaBaslik, birincil, ikincil, useSeciliAnahtar } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

const SINIRLAR: [string, string, string][] = [
  ["İstek hızı", "Anahtar başına, dakikada", "Canlı 60 · test 20 varsayılan; 1–600 arası ayarlanabilir"],
  ["İstem uzunluğu", "input.prompt", "4.000 karakter"],
  ["Görsel adedi", "input.num_images", "Modele göre 1–4"],
  ["Senkron bekleme", "sync: true", "En çok 55 saniye; sonra 201 ile kuyruktaki üretim döner"],
  ["Kayıt saklama", "GET /v1/generations", "24 saat"],
  ["Webhook uç noktası", "Hesap başına", "20"],
  ["Webhook zaman aşımı", "Teslim başına", "10 saniye · 3 deneme (0, 2, 8 sn)"],
  ["metadata", "İstek başına", "16 anahtar"],
  ["Idempotency-Key", "Geçerlilik", "24 saat"],
];

/** Orta sütunda kod olan satırlar (alan adı, uç nokta); diğerleri düz metin. */
const KOD_SUTUN = new Set(["input.prompt", "input.num_images", "sync: true", "GET /v1/generations"]);

const GERI_CEKILME = `async function vayraIstek(url, secenek, deneme = 0) {
  const yanit = await fetch(url, secenek);
  if (yanit.status !== 429 || deneme >= 5) return yanit;

  // Retry-After saniye cinsinden; yoksa üstel geri çekilme + titreşim
  const bekle = Number(yanit.headers.get("retry-after")) * 1000
    || Math.min(30_000, 2 ** deneme * 500) + Math.random() * 250;
  await new Promise((r) => setTimeout(r, bekle));
  return vayraIstek(url, secenek, deneme + 1);
}`;

type Olcum = { limit: number; kalan: number; sifirlanma: number };

export default function HizLimitleri() {
  const hazir = useHazir();
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const guncelle = useApiAnahtar((s) => s.anahtarGuncelle);
  const [anahtar, setAnahtar] = useSeciliAnahtar();
  const [olcum, setOlcum] = useState<Olcum | null>(null);
  const [simdi, setSimdi] = useState(Date.now());
  const [test, setTest] = useState<{ calisiyor: boolean; ok: number; red: number; retry: string | null } | null>(null);
  const [taslak, setTaslak] = useState<Record<string, number>>({});

  useEffect(() => { const t = setInterval(() => setSimdi(Date.now()), 1000); return () => clearInterval(t); }, []);
  const olc = async () => {
    if (!anahtar) return;
    const r = await apiIstek(anahtar.tam, "GET", "/account", { kaydetme: true });
    if (r.baslik["x-ratelimit-limit"]) setOlcum({ limit: Number(r.baslik["x-ratelimit-limit"]), kalan: Number(r.baslik["x-ratelimit-remaining"]), sifirlanma: Number(r.baslik["x-ratelimit-reset"]) * 1000 });
  };
  useEffect(() => { void olc(); }, [anahtar?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hazir) return <div className="h-[60vh]" />;

  const patlama = async () => {
    if (!anahtar) return;
    const n = Math.min(anahtar.hizLimiti + 3, 80);
    setTest({ calisiyor: true, ok: 0, red: 0, retry: null });
    const sonuclar = await Promise.all(Array.from({ length: n }, () => apiIstek(anahtar.tam, "GET", "/models?type=image", { kaydetme: true })));
    const red = sonuclar.filter((r) => r.durum === 429);
    setTest({ calisiyor: false, ok: sonuclar.filter((r) => r.durum === 200).length, red: red.length, retry: red[0]?.baslik["retry-after"] ?? null });
    void olc();
  };

  const kalanSn = olcum ? Math.max(0, Math.ceil((olcum.sifirlanma - simdi) / 1000)) : 0;
  const kullanilan = olcum ? olcum.limit - olcum.kalan : 0;

  return (
    <>
      <SayfaBaslik baslik="Hız limitleri" aciklama="Limitler anahtar başına, 60 saniyelik kayan pencerede uygulanır. Her yanıt kalan hakkı başlıklarda taşır; aşıldığında 429 ve Retry-After döner." />

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Kart baslik="Canlı durum" aciklama="Seçili anahtarın penceresi, sunucudan okunur" sag={<AnahtarSecici secili={anahtar} onSec={setAnahtar} className="w-[220px]" />}>
          {!anahtar ? <p className="flex items-center gap-2.5 py-6 text-[13.5px] text-white/60"><Gauge className="h-4 w-4" />Ölçmek için bir anahtar seç.</p> : (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="flex items-baseline gap-1.5">
                    <motion.span key={olcum?.kalan ?? "y"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[46px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-white">{olcum ? olcum.kalan : "…"}</motion.span>
                    <span className="text-[16px] tabular-nums text-white/50">/ {olcum?.limit ?? anahtar.hizLimiti}</span>
                  </p>
                  <p className="mt-1.5 text-[13px] text-white/60">bu dakika kalan istek</p>
                </div>
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90" aria-hidden>
                    <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke="#55d6fd" strokeWidth="4" strokeLinecap="round" strokeDasharray={113.1} strokeDashoffset={113.1 * (1 - kalanSn / 60)} className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
                  </svg>
                  <div className="text-right">
                    <p className="text-[22px] font-semibold leading-none tabular-nums text-white">{kalanSn}<span className="ml-0.5 text-[13px] font-normal text-white/55">sn</span></p>
                    <p className="mt-1 text-[12.5px] text-white/60">sıfırlanmaya</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div initial={false} animate={{ width: `${olcum ? (olcum.kalan / Math.max(1, olcum.limit)) * 100 : 100}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("h-full rounded-full", olcum && olcum.kalan === 0 ? "bg-rose-400" : "bg-[linear-gradient(90deg,rgba(85,214,253,0.55),#55d6fd)]")} />
              </div>
              <div className="mt-2 flex justify-between text-[12px] tabular-nums text-white/50"><span>{kullanilan} kullanıldı</span><span>{olcum?.limit ?? anahtar.hizLimiti} / dk</span></div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button onClick={olc} className={ikincil}><Activity className="h-4 w-4" />Yeniden ölç</button>
                <button onClick={patlama} disabled={test?.calisiyor} className={birincil}>{test?.calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}Limiti dene</button>
                <span className="text-[12.5px] text-white/55">Limit + 3 eşzamanlı istek gönderir; kredi harcamaz.</span>
              </div>
              {test && !test.calisiyor && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-3 gap-2">
                  {[["Kabul edildi", `${test.ok}`, "200", "text-emerald-300"], ["Reddedildi", `${test.red}`, "429", test.red ? "text-rose-300" : "text-white/60"], ["Retry-After", test.retry ? `${test.retry} sn` : "Yok", "başlık", "text-amber-200"]].map(([e, d, k, r]) => (
                    <div key={e} className="rounded-[14px] bg-white/[0.035] px-3.5 py-2.5 ring-1 ring-white/[0.06]">
                      <p className="text-[12px] text-white/55">{e} <span className="text-white/35">· {k}</span></p>
                      <p className={cn("text-[18px] font-semibold tabular-nums", r)}>{d}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </Kart>
        <KodEditor dosyaAdi="geri-cekilme.js" dil="js" kod={GERI_CEKILME} maxH={330} />
      </div>

      <Kart className="mb-6" baslik="Anahtar başına limit" aciklama="Değişiklik kaydedildiği an sunucuda geçerli olur" govdeSinif="p-0">
        {anahtarlar.length === 0 ? <p className="py-10 text-center text-[13px] text-metin-2">Önce bir API anahtarı oluştur.</p> : (
          <ul className="divide-y divide-white/[0.05]">
            {anahtarlar.map((a) => {
              const v = taslak[a.id] ?? a.hizLimiti;
              const degisti = v !== a.hizLimiti;
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
                  <div className="flex w-56 min-w-0 items-center gap-3">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", a.ortam === "test" ? "bg-amber-300/12 text-amber-200" : "bg-[#55d6fd]/12 text-[#55d6fd]")}><KeyRound className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-white">{a.ad}</p>
                      <div className="mt-0.5"><OrtamRozet ortam={a.ortam} /></div>
                    </div>
                  </div>
                  <input type="range" min={1} max={600} value={v} onChange={(e) => setTaslak({ ...taslak, [a.id]: Number(e.target.value) })} aria-label={`${a.ad} hız limiti`}
                    className="fiyat-kaydirici min-w-[160px] flex-1" style={{ "--dolu": `${(v / 600) * 100}%` } as React.CSSProperties} />
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 items-center rounded-full bg-white/[0.05] pl-3 pr-3.5 ring-1 ring-white/[0.09] focus-within:ring-[#55d6fd]/60">
                      <input type="number" min={1} max={600} value={v} onChange={(e) => setTaslak({ ...taslak, [a.id]: Math.max(1, Math.min(600, Number(e.target.value) || 1)) })} aria-label="İstek/dk"
                        className="w-12 bg-transparent text-right text-[14px] font-semibold tabular-nums text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                      <span className="ml-1 text-[12.5px] text-white/55">/ dk</span>
                    </div>
                    <AnimatePresence initial={false} mode="popLayout">
                      {degisti ? (
                        <motion.button key="k" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                          onClick={() => { guncelle(a.id, { hizLimiti: v }); const t = { ...taslak }; delete t[a.id]; setTaslak(t); void senkronize().then(() => { if (anahtar?.id === a.id) void olc(); }); toast.success("Hız limiti güncellendi", { description: `${a.ad}: dakikada en çok ${v} istek.` }); }}
                          className={cn(birincil, "h-10")}>Kaydet</motion.button>
                      ) : (
                        <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-10 items-center gap-1.5 px-2 text-[12.5px] text-white/45"><Check className="h-3.5 w-3.5" />Kayıtlı</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Kart>

      <Kart baslik="Diğer sınırlar" govdeSinif="p-0">
        <table className="w-full text-left text-[13px]">
          <tbody className="divide-y divide-white/[0.05]">
            {SINIRLAR.map(([a, b, c]) => <tr key={a} className="transition-colors hover:bg-white/[0.02]"><td className="px-5 py-3.5 text-[13.5px] font-medium text-white">{a}</td><td className="hidden px-3 py-3.5 sm:table-cell"><span className={cn("rounded-[7px] px-2 py-1 text-[12px]", KOD_SUTUN.has(b) ? "bg-white/[0.05] font-mono text-white/70" : "text-white/60")}>{b}</span></td><td className="px-5 py-3.5 text-[13.5px] text-white/75">{c}</td></tr>)}
          </tbody>
        </table>
      </Kart>
    </>
  );
}
