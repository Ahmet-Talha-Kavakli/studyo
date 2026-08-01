"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play, RotateCcw, Palette, X, Check, Loader2, Code2, KeyRound, FlaskConical,
  ExternalLink, Sparkles,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { MODELLER } from "@/lib/catalog";
import { PRESETLER } from "@/lib/presetVeri";
import { onizlemeArka, saltUrl } from "@/lib/utils";
import { origArka } from "@/lib/gercekVeri";
import { cozunurlukSecenekleri, kodUret, DIL_ADLARI, type Dil } from "@/lib/apiPlatform";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { KodBlok, KopyalaDugme } from "@/components/api/parcalar";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { cn } from "@/lib/utils";

/* ============================================================
   MODEL OYUN ALANI — Higgsfield "Playground" birebir.

   Sol: Girdi formu (Form / Kod sekmesi) — istem, boyut, kalite, stil modalı,
        stil gücü, sonuç adedi, referans URL, istem iyileştir, seed → ÜRET.
   Sağ: Çıktı — GERÇEK üretim (uretimBaslat) canlı progress ile izlenir.

   GERÇEK: Üret → uretimBaslat (@/lib/uretimMotoru) krediyi düşer, /api/uretim'e
   POST atar, sonucu useProjeler'e yazar. Bu sayfa o üretimi id ile izler.
   Sandbox modu açıkken kredi harcanmaz (yalnız kod/istek önizlemesi üretilir).
   ============================================================ */

const STILLER = PRESETLER.slice(0, 24);

export default function OyunAlani({ params }: { params: Promise<{ model: string }> }) {
  const { model: modelId } = use(params);
  const model = MODELLER.find((m) => m.id === modelId)!;

  const { kullanici } = useAuth();
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const sandbox = useApiAnahtar((s) => s.sandbox);
  const cagriKaydet = useApiAnahtar((s) => s.cagriKaydet);
  const cagriGuncelle = useApiAnahtar((s) => s.cagriGuncelle);
  const uretimler = useProjeler((s) => s.uretimler);

  const [gorunum, setGorunum] = useState<"form" | "kod">("form");
  const [dil, setDil] = useState<Dil>("curl");
  const [istem, setIstem] = useState("");
  const [boyut, setBoyut] = useState(() => cozunurlukSecenekleri(model)[0]);
  const [kalite, setKalite] = useState(model.kisit?.cozunurlukler?.[0] ?? "720p");
  const [stil, setStil] = useState<string | null>(null);
  const [stilGucu, setStilGucu] = useState(1);
  const [adet, setAdet] = useState(1);
  const [referans, setReferans] = useState("");
  const [iyilestir, setIyilestir] = useState(true);
  const [seed, setSeed] = useState(1);
  const [stilModal, setStilModal] = useState(false);
  const [gecici, setGecici] = useState<string[]>([]);
  const [aktifUretimId, setAktifUretimId] = useState<string | null>(null);
  const [cagriId, setCagriId] = useState<string | null>(null);
  const [sandboxCikti, setSandboxCikti] = useState<string | null>(null);
  const [baslangic, setBaslangic] = useState<number>(0);

  useScrollKilit(stilModal);
  useEscKapat(stilModal, () => setStilModal(false));

  const aktifUretim = useMemo(
    () => (aktifUretimId ? uretimler.find((u) => u.id === aktifUretimId) : undefined),
    [aktifUretimId, uretimler],
  );

  const anahtarMetni = anahtarlar[0]?.tam ?? "vy_live_ANAHTARINI_BURAYA_KOY";
  const maksAdet = model.kisit?.maksAdet ?? 4;

  const ekstra = useMemo(() => {
    const e: Record<string, string | number> = {};
    if (model.tur === "gorsel") {
      e.width_and_height = boyut;
      e.quality = kalite;
      e.result_images = adet;
      if (stil) { e.style = stil; e.style_strength = stilGucu; }
    } else if (model.tur === "video") {
      e.resolution = kalite;
      if (model.kisit?.sureler?.[0]) e.duration = model.kisit.sureler[0];
    }
    if (referans.trim()) e.input_image_url = referans.trim();
    if (iyilestir) e.enhance_prompt = 1;
    e.seed = seed;
    return e;
  }, [model, boyut, kalite, adet, stil, stilGucu, referans, iyilestir, seed]);

  const kod = useMemo(
    () => kodUret(dil, { model, prompt: istem, anahtar: anahtarMetni, ekstra }),
    [dil, model, istem, anahtarMetni, ekstra],
  );

  // Üretim tamamlanınca çağrı günlüğünü GERÇEK gecikme ve durumla kapat.
  useEffect(() => {
    if (!aktifUretim || !cagriId) return;
    if (aktifUretim.durum === "tamam") {
      cagriGuncelle(cagriId, { durum: "completed", gecikmeMs: Math.round(performance.now() - baslangic) });
      setCagriId(null);
    } else if (aktifUretim.durum === "hata") {
      cagriGuncelle(cagriId, { durum: "failed", gecikmeMs: Math.round(performance.now() - baslangic) });
      setCagriId(null);
    } else if (aktifUretim.durum === "isleniyor") {
      cagriGuncelle(cagriId, { durum: "in_progress" });
    }
  }, [aktifUretim, cagriId, cagriGuncelle, baslangic]);

  const calistir = () => {
    if (istem.trim().length < 3) return toast.error("Bir istem gir.", { description: "En az 3 karakter." });
    if (anahtarlar.length === 0) {
      return toast.error("Önce bir API anahtarı oluştur.", {
        description: "API Anahtarları sayfasından ekle.",
        action: { label: "Anahtar oluştur", onClick: () => { window.location.href = "/panel/api/anahtarlar"; } },
      });
    }

    // SANDBOX: kredi harcamaz, gerçek istek atmaz — yalnız istek gövdesini ve
    // beklenen 202 yanıtını gösterir (geliştirici entegrasyonunu test eder).
    if (sandbox) {
      const id = `req_${Math.random().toString(16).slice(2, 10)}`;
      cagriKaydet({
        anahtarId: anahtarlar[0].id, modelId: model.id,
        tur: model.tur === "muzik" ? "muzik" : model.tur,
        durum: "completed", kredi: 0, gecikmeMs: 42, sandbox: true,
      });
      setSandboxCikti(JSON.stringify({
        request_id: id,
        status: "queued",
        sandbox: true,
        credits_charged: 0,
        model: model.id,
        input: { prompt: istem, ...ekstra },
      }, null, 2));
      setAktifUretimId(null);
      return toast.success("Sandbox isteği doğrulandı", { description: "Kredi harcanmadı." });
    }

    const sonuc = uretimBaslat({
      baslik: istem.slice(0, 60) || model.ad,
      tur: model.tur,
      model: model.id,
      prompt: istem,
      kredi: model.kredi,
      arac: "API Oyun Alanı",
      meta: { cozunurluk: model.tur === "gorsel" ? boyut : kalite },
    });

    if (!sonuc.ok) return uretimHataToast(sonuc);

    setSandboxCikti(null);
    setBaslangic(performance.now());
    setAktifUretimId(sonuc.id!);
    const kayitId = cagriKaydet({
      anahtarId: anahtarlar[0].id,
      modelId: model.id,
      tur: model.tur === "muzik" ? "muzik" : model.tur,
      durum: "queued",
      kredi: model.kredi,
      gecikmeMs: 0,
      sandbox: false,
      uretimId: sonuc.id,
    });
    setCagriId(kayitId);
    toast.success("İstek kuyruğa alındı", { description: `${model.kredi} kredi · ${model.ad}` });
  };

  const sifirla = () => {
    setIstem(""); setStil(null); setReferans(""); setSeed(1);
    setAktifUretimId(null); setSandboxCikti(null);
  };

  const ciktiGorsel = aktifUretim?.durum === "tamam" ? saltUrl(aktifUretim.gorselUrl) : undefined;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* GİRDİ */}
      <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-metin">Girdi</h2>
          <div className="flex gap-1 rounded-xl bg-white/[0.05] p-0.5">
            {(["form", "kod"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGorunum(g)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  gorunum === g ? "bg-aksan text-[#12140c]" : "text-metin-2 hover:text-metin",
                )}
              >
                {g === "form" ? "Form" : "Kod"}
              </button>
            ))}
          </div>
        </div>

        {gorunum === "form" ? (
          <div className="space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-metin-3">
              {model.ad} Oyun Alanı
            </p>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                İstem <span className="text-rose-400">*</span>
              </label>
              <textarea
                data-istem
                value={istem}
                onChange={(e) => setIstem(e.target.value)}
                rows={3}
                placeholder="Üretmek istediğini tanımla…"
                className="w-full resize-none rounded-xl border border-white/[0.1] bg-yuzey-2 p-3 text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/50"
              />
            </div>

            {model.tur === "gorsel" && (
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                  Genişlik ve Yükseklik <span className="text-rose-400">*</span>
                </label>
                <select
                  value={boyut}
                  onChange={(e) => setBoyut(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/[0.1] bg-yuzey-2 px-3 text-sm text-metin outline-none focus:border-aksan/50"
                >
                  {cozunurlukSecenekleri(model).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                Kalite
              </label>
              <select
                value={kalite}
                onChange={(e) => setKalite(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/[0.1] bg-yuzey-2 px-3 text-sm text-metin outline-none focus:border-aksan/50"
              >
                {(model.kisit?.cozunurlukler ?? ["720p", "1080p"]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {model.tur === "gorsel" && (
              <>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                    Stil
                  </label>
                  <button
                    onClick={() => setStilModal(true)}
                    className="glass-cip flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-metin"
                  >
                    <Palette className="h-4 w-4 text-metin-2" />
                    <span className={cn(stil ? "text-metin" : "text-metin-3")}>{stil ?? "Stil Seç"}</span>
                  </button>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                      Stil Gücü
                    </label>
                    <span className="text-xs text-metin-2">{stilGucu}</span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.1}
                    value={stilGucu}
                    onChange={(e) => setStilGucu(Number(e.target.value))}
                    aria-label="Stil gücü"
                    className="w-full accent-[var(--color-aksan)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                    Sonuç Görselleri
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, maksAdet].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAdet(n)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                          adet === n
                            ? "border-aksan/50 bg-aksan/[0.08] text-metin"
                            : "border-white/[0.1] bg-yuzey-2 text-metin-2",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border",
                            adet === n ? "border-aksan" : "border-white/25",
                          )}
                        >
                          {adet === n && <span className="h-2 w-2 rounded-full bg-aksan" />}
                        </span>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                Görsel Referansı
              </label>
              <input
                value={referans}
                onChange={(e) => setReferans(e.target.value)}
                placeholder="https://… görsel URL'i"
                className="h-11 w-full rounded-xl border border-white/[0.1] bg-yuzey-2 px-3 text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-metin-2">
                İstemi İyileştir
              </label>
              <button
                onClick={() => setIyilestir((v) => !v)}
                role="switch"
                aria-checked={iyilestir}
                aria-label="İstemi iyileştir"
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  iyilestir ? "bg-aksan" : "bg-white/15",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-[#12140c] transition-all",
                    iyilestir ? "left-6" : "left-1 bg-white",
                  )}
                />
              </button>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-metin-2">Seed</label>
                <span className="text-xs text-metin-2">{seed}</span>
              </div>
              <input
                type="range" min={1} max={1000} step={1}
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                aria-label="Seed"
                className="w-full accent-[var(--color-aksan)]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                data-uret
                onClick={calistir}
                disabled={aktifUretim?.durum === "isleniyor" || aktifUretim?.durum === "kuyrukta"}
                className="hf-btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-aksan py-3 text-sm font-bold text-[#12140c] disabled:opacity-60"
              >
                {aktifUretim && (aktifUretim.durum === "isleniyor" || aktifUretim.durum === "kuyrukta")
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Play className="h-4 w-4" />}
                Üret
              </button>
              <button
                onClick={sifirla}
                className="hf-btn glass-cip flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm text-metin-2"
              >
                <RotateCcw className="h-4 w-4" /> Sıfırla
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-metin-3">
                Bakiye: <span className="font-semibold text-aksan">{(kullanici?.krediler ?? 0).toLocaleString("tr")} kredi</span>
              </p>
              <button
                onClick={() => { setGorunum("kod"); toast.success("İstek kodu hazır", { description: DIL_ADLARI[dil] }); }}
                className="hf-btn glass-cip flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-metin-2"
              >
                <Code2 className="h-3.5 w-3.5" /> Bu isteği kodla
              </button>
            </div>

            {sandbox && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[0.07] p-3 text-[11px] text-amber-200/80">
                <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                Sandbox modu açık — istekler doğrulanır ama kredi harcanmaz ve gerçek üretim yapılmaz.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-1 rounded-xl bg-white/[0.05] p-0.5">
              {(Object.keys(DIL_ADLARI) as Dil[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDil(d)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    dil === d ? "bg-yuzey-3 text-metin" : "text-metin-2 hover:text-metin",
                  )}
                >
                  {DIL_ADLARI[d]}
                </button>
              ))}
            </div>
            <KodBlok kod={kod} baslik={`${DIL_ADLARI[dil]} · üretim isteği`} />
            {anahtarlar.length === 0 && (
              <Link
                href="/panel/api/anahtarlar"
                className="flex items-center gap-1.5 rounded-xl border border-aksan/25 bg-aksan/[0.06] px-3 py-2.5 text-xs text-aksan"
              >
                <KeyRound className="h-3.5 w-3.5" /> Kodu çalıştırmak için önce bir API anahtarı oluştur
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ÇIKTI */}
      <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-metin">Çıktı</h2>
          {aktifUretim && (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                aktifUretim.durum === "tamam"
                  ? "border-aksan/30 bg-aksan/12 text-aksan"
                  : aktifUretim.durum === "hata"
                    ? "border-rose-400/30 bg-rose-500/12 text-rose-300"
                    : "border-white/[0.1] bg-white/[0.05] text-metin-2",
              )}
            >
              {aktifUretim.durum === "tamam" ? "completed"
                : aktifUretim.durum === "hata" ? "failed"
                : aktifUretim.durum === "isleniyor" ? "in_progress" : "queued"}
            </span>
          )}
        </div>

        {sandboxCikti ? (
          <KodBlok kod={sandboxCikti} baslik="202 · Sandbox yanıtı" satirNo={false} />
        ) : !aktifUretim ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-center text-sm text-metin-3">
            Üretimden sonra çıktı burada görünecek
          </div>
        ) : aktifUretim.durum !== "tamam" && aktifUretim.durum !== "hata" ? (
          <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.06] bg-yuzey-2">
            <Loader2 className="h-8 w-8 animate-spin text-aksan" />
            <div className="w-56">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-aksan"
                  animate={{ width: `${aktifUretim.ilerleme}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-metin-2">
                %{aktifUretim.ilerleme} · {aktifUretim.durum === "kuyrukta" ? "kuyrukta" : "işleniyor"}
              </p>
            </div>
          </div>
        ) : aktifUretim.durum === "hata" ? (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.07] p-4 text-sm text-rose-200">
            Üretim başarısız oldu. Kredi iade edildi — bildirimlerini kontrol et.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/[0.06] bg-yuzey-2">
              {ciktiGorsel ? (
                <Image
                  src={ciktiGorsel}
                  alt={aktifUretim.baslik}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: aktifUretim.gorselUrl ?? onizlemeArka(aktifUretim.id, "portre") }}
                />
              )}
            </div>
            <KodBlok
              kod={JSON.stringify(
                {
                  request_id: cagriId ?? `req_${aktifUretim.id.slice(-8)}`,
                  status: "completed",
                  model: model.id,
                  credits_charged: aktifUretim.kredi,
                  output: { url: ciktiGorsel ?? "https://cdn.vayra.ai/…" },
                },
                null, 2,
              )}
              baslik="200 · Başarılı yanıt"
              satirNo={false}
            />
            <Link
              href="/panel/kitaplik"
              className="flex items-center justify-center gap-1.5 rounded-xl glass-cip py-2.5 text-sm text-metin-2 transition-colors hover:text-metin"
            >
              <ExternalLink className="h-4 w-4" /> Kitaplıkta aç
            </Link>
          </div>
        )}
      </div>

      {/* Stil seçim modalı */}
      <AnimatePresence>
        {stilModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setStilModal(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              role="dialog"
              aria-modal="true"
              className="menu-surface fixed left-1/2 top-1/2 z-[81] flex max-h-[86vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-metin">
                  <Sparkles className="h-4.5 w-4.5 text-aksan" /> Stil Seç
                </h3>
                <button onClick={() => setStilModal(false)} aria-label="Kapat" className="text-metin-3 hover:text-metin">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="-mx-1 grid flex-1 grid-cols-2 gap-3 overflow-y-auto px-1 sm:grid-cols-3 [scrollbar-width:thin]">
                {STILLER.map((p) => (
                  <button
                    key={p.ad}
                    onClick={() => setGecici([p.ad])}
                    className={cn(
                      "overflow-hidden rounded-2xl border text-left transition-all",
                      gecici[0] === p.ad
                        ? "border-aksan/60 ring-1 ring-aksan/40"
                        : "border-white/[0.08] hover:border-white/20",
                    )}
                  >
                    <div
                      className="aspect-[4/3] w-full"
                      style={{ background: origArka(p.ad, p.kat) }}
                    />
                    <div className="bg-yuzey-2 p-2.5">
                      <div className="truncate text-xs font-semibold text-metin">{p.ad}</div>
                      <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-metin-3">
                        {p.aciklama}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
                <button
                  onClick={() => { setGecici([]); setStilModal(false); }}
                  className="hf-btn glass-cip rounded-xl px-4 py-2.5 text-sm text-metin-2"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    setStil(gecici[0] ?? null);
                    setStilModal(false);
                    if (gecici[0]) toast.success(`Stil: ${gecici[0]}`);
                  }}
                  className="hf-btn flex items-center gap-1.5 rounded-xl bg-aksan px-4 py-2.5 text-sm font-bold text-[#12140c]"
                >
                  <Check className="h-4 w-4" /> Seçimi Onayla
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sağ alt: hızlı kopyala (kod görünümündeyken formdan da erişilebilsin) */}
      {gorunum === "form" && (
        <div className="lg:hidden">
          <KopyalaDugme metin={kod} etiket="İstek kodu" />
        </div>
      )}
    </div>
  );
}
