"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { Ban, ChevronDown, Copy, Download, ExternalLink, ListTree, Play, RefreshCw, Search, Terminal, X } from "lucide-react";
import { useApiAnahtar, type ApiUretim } from "@/store/useApiAnahtar";
import { apiIstek, apiTaban, senkronize } from "@/lib/api/istemci";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { modelBulKatalog } from "./katalog";
import { BosDurum, DurumRozet, HttpRozet, KodEditor, OrtamRozet, SecimSerit, YontemRozet, goreli, ikincil, panoyaKopyala, sureMetin, tarihSaat } from "./ui";
import { csvIndir } from "./veri";
import { cn } from "@/lib/utils";

const DURUMLAR = ["succeeded", "failed", "processing", "queued", "canceled"] as const;
const SAYFA = 25;
const kart = "rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";
const logoAd = (id: string) => { const m = modelBulKatalog(id); return m ? `${m.ad} ${m.saglayici} ${m.id}` : id; };

/** Yerel select'i hap görünümüne sokar: kendi okuyla, süzgeç etkinken vurgulu. */
function Secim({ deger, onDegis, etiket, children, aktif }: { deger: string; onDegis: (v: string) => void; etiket: string; children: React.ReactNode; aktif: boolean }) {
  return (
    <label className={cn("relative inline-flex h-9 items-center rounded-full ring-1 transition", aktif ? "bg-white/[0.09] ring-white/[0.2]" : "bg-white/[0.04] ring-white/[0.09] hover:ring-white/[0.18]")}>
      <select value={deger} onChange={(e) => onDegis(e.target.value)} aria-label={etiket}
        className={cn("h-full cursor-pointer appearance-none bg-transparent pl-3.5 pr-8 text-[13px] outline-none [&>option]:bg-[#17181b]", aktif ? "font-medium text-white" : "text-white/75")}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-white/50" />
    </label>
  );
}

function CiktiOnEk({ u }: { u: ApiUretim }) {
  return u.type === "image" && u.output?.urls[0]
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={u.output.urls[0]} alt="" className="h-10 w-10 shrink-0 rounded-[11px] object-cover ring-1 ring-white/[0.08]" />
    : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"><ModelLogo ad={logoAd(u.model)} boyut={18} /></span>;
}

export function UretimTablosu({ model, seciliId }: { model?: string; seciliId?: string | null }) {
  const tum = useApiAnahtar((s) => s.uretimler);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const [durum, setDurum] = useState<string>("tumu");
  const [ortam, setOrtam] = useState<string>("tumu");
  const [anahtar, setAnahtar] = useState<string>("tumu");
  const [mdl, setMdl] = useState<string>("tumu");
  const [q, setQ] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [acik, setAcik] = useState<string | null>(seciliId ?? null);
  const [yenileniyor, setYenileniyor] = useState(false);
  useEffect(() => { if (seciliId) setAcik(seciliId); }, [seciliId]);

  const kaynak = model ? tum.filter((u) => u.model === model) : tum;
  const modeller = Array.from(new Set(kaynak.map((u) => u.model)));
  const liste = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    return kaynak.filter((u) => (durum === "tumu" || u.status === durum) && (ortam === "tumu" || u.environment === ortam) && (anahtar === "tumu" || u.anahtarId === anahtar) && (mdl === "tumu" || u.model === mdl)
      && (!s || `${u.id} ${u.model} ${String(u.input.prompt ?? "")}`.toLocaleLowerCase("tr").includes(s)));
  }, [kaynak, durum, ortam, anahtar, mdl, q]);
  const gorunen = liste.slice(0, sayfa * SAYFA);
  const secili = acik ? tum.find((u) => u.id === acik) ?? null : null;
  const temizle = () => { setDurum("tumu"); setOrtam("tumu"); setAnahtar("tumu"); setMdl("tumu"); setQ(""); setSayfa(1); };

  const disaAktar = () => csvIndir(`vayra-istekler-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["id", "model", "durum", "ortam", "anahtar", "kredi", "kuyruk_ms", "calisma_ms", "olusturma", "tamamlanma", "istem", "cikti"],
    ...liste.map((u) => [u.id, u.model, u.status, u.environment, anahtarlar.find((a) => a.id === u.anahtarId)?.ad ?? u.anahtarId, u.credits, u.metrics.queue_ms, u.metrics.run_ms, u.created_at, u.completed_at, String(u.input.prompt ?? ""), u.output?.urls.join(" ") ?? ""]),
  ]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex h-9 w-full items-center gap-2 rounded-full bg-white/[0.04] px-3.5 text-white/50 ring-1 ring-white/[0.09] transition focus-within:bg-white/[0.06] focus-within:ring-[#55d6fd]/60 sm:w-[260px]">
          <Search className="h-4 w-4 shrink-0" /><input value={q} onChange={(e) => { setQ(e.target.value); setSayfa(1); }} placeholder="Kimlik ya da istem ara" aria-label="İstek ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" />
          {q && <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="text-white/50 transition hover:text-white"><X className="h-3.5 w-3.5" /></button>}
        </label>
        <Secim deger={durum} onDegis={(v) => { setDurum(v); setSayfa(1); }} etiket="Durum" aktif={durum !== "tumu"}>
          <option value="tumu">Tüm durumlar</option>
          {DURUMLAR.map((d) => <option key={d} value={d}>{({ succeeded: "Başarılı", failed: "Başarısız", processing: "İşleniyor", queued: "Kuyrukta", canceled: "İptal" })[d]}</option>)}
        </Secim>
        <Secim deger={ortam} onDegis={setOrtam} etiket="Ortam" aktif={ortam !== "tumu"}><option value="tumu">Tüm ortamlar</option><option value="live">Canlı</option><option value="test">Test</option></Secim>
        <Secim deger={anahtar} onDegis={setAnahtar} etiket="Anahtar" aktif={anahtar !== "tumu"}><option value="tumu">Tüm anahtarlar</option>{anahtarlar.map((a) => <option key={a.id} value={a.id}>{a.ad}</option>)}</Secim>
        {!model && modeller.length > 1 && <Secim deger={mdl} onDegis={setMdl} etiket="Model" aktif={mdl !== "tumu"}><option value="tumu">Tüm modeller</option>{modeller.map((x) => <option key={x} value={x}>{modelBulKatalog(x)?.ad ?? x}</option>)}</Secim>}
        <div className="ml-auto flex gap-2">
          <button onClick={async () => { setYenileniyor(true); await senkronize(); setYenileniyor(false); }} className={ikincil}><RefreshCw className={cn("h-4 w-4", yenileniyor && "animate-spin")} />Yenile</button>
          <button onClick={disaAktar} disabled={!liste.length} className={ikincil}><Download className="h-4 w-4" />CSV</button>
        </div>
      </div>

      <section className={cn(kart, "overflow-hidden")}>
        {!kaynak.length ? (
          <BosDurum ikon={ListTree} baslik="Henüz istek yok" aciklama="Oyun alanından, Konsol'dan ya da kendi kodundan yapılan üretimler (curl dahil) birkaç saniye içinde burada görünür."
            eylem={<Link href={model ? `/panel/api/modeller/${model}/oyun-alani` : "/panel/api/modeller"} className={ikincil}><Play className="h-4 w-4" />Bir üretim başlat</Link>} />
        ) : !liste.length ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-[14px] font-medium text-white">Süzgeçlere uyan istek yok</p>
            <button onClick={temizle} className={ikincil}>Süzgeçleri temizle</button>
          </div>
        ) : (
          <div>
            <ul className="divide-y divide-white/[0.05] sm:hidden">
              {gorunen.map((u) => (
                <li key={u.id}>
                  <button onClick={() => setAcik(u.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-white/[0.04]">
                    <CiktiOnEk u={u} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] text-white">{String(u.input.prompt ?? u.input.text ?? u.model)}</span>
                      <span className="mt-1 flex items-center gap-2 text-[12px] text-white/55">
                        <DurumRozet durum={u.status} />
                        <span className="truncate">{modelBulKatalog(u.model)?.ad ?? u.model}</span>
                        <span className="ml-auto shrink-0 whitespace-nowrap tabular-nums">{sureMetin(u.metrics.run_ms)} · {goreli(u.created_at)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[820px] text-left text-[13px]">
              <thead><tr className="border-b border-white/[0.06] text-[12px] text-white/50">
                <th className="w-full px-5 py-3 font-medium">İstek</th><th className="px-3 py-3 font-medium">Durum</th><th className="px-3 py-3 font-medium">Ortam</th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium">Süre</th><th className="px-3 py-3 text-right font-medium">Kredi</th><th className="whitespace-nowrap px-5 py-3 text-right font-medium">Zaman</th>
              </tr></thead>
              <tbody className="divide-y divide-white/[0.05]">
                {gorunen.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 12) * 0.02 }} onClick={() => setAcik(u.id)}
                    className={cn("cursor-pointer transition-colors hover:bg-white/[0.03]", acik === u.id && "bg-white/[0.05]")}>
                    <td className="max-w-[1px] px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <CiktiOnEk u={u} />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] text-white">{String(u.input.prompt ?? u.input.text ?? u.model)}</p>
                          <p className="truncate text-[12px] text-white/50">{modelBulKatalog(u.model)?.ad ?? u.model} · <span className="font-mono text-[11.5px]">{u.id}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><DurumRozet durum={u.status} /></td>
                    <td className="px-3 py-2.5"><OrtamRozet ortam={u.environment} /></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] tabular-nums text-white/65">{sureMetin(u.metrics.run_ms)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[12.5px] tabular-nums">{u.environment === "test" ? <span className="text-amber-200/75" title="Test istekleri kredi harcamaz">Test</span> : <span className="text-white">{u.credits}</span>}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right text-[12.5px] text-white/60" title={tarihSaat(u.created_at)}>{goreli(u.created_at)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3 text-[12.5px] text-white/50">
              <span>{gorunen.length} / {liste.length} istek · kayıtlar sunucuda 24 saat, bu panelde son 1000 üretim saklanır</span>
              {gorunen.length < liste.length && <button onClick={() => setSayfa((s) => s + 1)} className={cn(ikincil, "h-8")}>Daha fazla</button>}
            </div>
          </div>
        )}
      </section>
      <UretimCekmecesi u={secili} onKapat={() => setAcik(null)} />
    </>
  );
}

export function UretimCekmecesi({ u, onKapat }: { u: ApiUretim | null; onKapat: () => void }) {
  const teslimler = useApiAnahtar((s) => s.teslimler);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const [sekme, setSekme] = useState<"ozet" | "json">("ozet");
  useEffect(() => {
    if (!u) return;
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    window.addEventListener("keydown", tus, true);
    return () => window.removeEventListener("keydown", tus, true);
  }, [u, onKapat]);
  if (!u || typeof document === "undefined") return null;
  const ilgili = teslimler.filter((t) => t.generation_id === u.id);
  const anahtar = anahtarlar.find((a) => a.id === u.anahtarId);
  const url = u.output?.urls[0];
  const tekrarGovde = encodeURIComponent(JSON.stringify({ model: u.model, input: u.input }));
  const curl = `curl -X POST ${apiTaban()}/generations \\\n  -H "Authorization: Bearer $VAYRA_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ model: u.model, input: u.input, ...(Object.keys(u.metadata ?? {}).length ? { metadata: u.metadata } : {}) }).replace(/'/g, "'\\''")}'`;
  const suruyor = u.status === "queued" || u.status === "processing";
  const iptalEt = async () => {
    if (!anahtar) return toast.error("İptal edilemedi", { description: "Bu isteği yapan API anahtarı bu tarayıcıda kayıtlı değil. İsteği yapan anahtarla iptal et." });
    const r = await apiIstek(anahtar.tam, "POST", `/generations/${u.id}/cancel`, { anahtarId: anahtar.id, kaynak: "panel" });
    if (r.durum < 300) { toast.success("Üretim iptal edildi", { description: "Bu üretim için kredi düşülmez." }); await senkronize(); }
    else toast.error("İptal edilemedi", { description: (r.govde as { error?: { message?: string } })?.error?.message ?? "Üretim bitmiş ya da sunucu yanıt vermedi. Listeyi yenileyip yeniden dene." });
  };

  return createPortal(
    <div className="perde kesfet-tema fixed inset-0 z-[110] flex justify-end bg-black/50 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
      <motion.aside initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", damping: 32, stiffness: 340 }} role="dialog" aria-modal="true" aria-label="Üretim ayrıntısı"
        className="flex h-full w-full max-w-[640px] flex-col bg-[#111214] ring-1 ring-white/[0.08] sm:m-3 sm:h-[calc(100%-24px)] sm:overflow-hidden sm:rounded-[26px]">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"><ModelLogo ad={logoAd(u.model)} boyut={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-semibold text-white">{modelBulKatalog(u.model)?.ad ?? u.model}</p>
            <code className="block truncate font-mono text-[12px] text-white/50">{u.id}</code>
          </div>
          <DurumRozet durum={u.status} />
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.07] hover:text-white active:scale-90"><X className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-white/[0.06] px-5 py-3">
          <SecimSerit id="cekmece-sekme" kucuk secenek={[{ id: "ozet" as const, ad: "Özet" }, { id: "json" as const, ad: "Ham yanıt" }]} deger={sekme} onDegis={setSekme} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {sekme === "json" ? <KodEditor dosyaAdi="generation.json" dil="json" kod={JSON.stringify(u, null, 2)} maxH="none" /> : (
            <div className="space-y-6">
              {url && u.status === "succeeded" && (
                <div className="overflow-hidden rounded-[18px] bg-black/30 ring-1 ring-white/[0.06]">
                  {u.type === "image" ? <img src={url} alt="Çıktı" className="max-h-[360px] w-full object-contain" />
                    : u.type === "video" ? <video src={url} controls muted loop playsInline className="max-h-[360px] w-full" />
                    : u.type === "audio" || u.type === "music" ? <div className="p-4"><audio src={url} controls className="w-full" /></div>
                    : <div className="p-4 text-[13px] text-white/60">3D model (GLB) · <a href={url} className="text-[#55d6fd] hover:underline">İndir</a></div>}
                </div>
              )}
              {u.error && <div className="rounded-[16px] bg-rose-500/[0.07] p-4 text-[13px] ring-1 ring-rose-400/25"><p className="font-mono text-rose-200">{u.error.code}</p><p className="mt-1 text-white">{u.error.message}</p></div>}
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-white/[0.06] text-[13px] ring-1 ring-white/[0.06]">
                {[
                  ["Model", modelBulKatalog(u.model)?.ad ?? u.model], ["Anahtar", anahtar?.ad ?? u.anahtarId],
                  ["Ortam", u.environment === "live" ? "Canlı" : "Test"], ["Kredi", u.environment === "test" ? "Test, kredi harcamaz" : String(u.credits)],
                  ["Sağlayıcı", u.provider ?? "Belirtilmedi"], ["Çıktı", u.simulated ? "Örnek çıktı" : "Gerçek model"],
                  ["Kuyruk", sureMetin(u.metrics.queue_ms)], ["Çalışma", sureMetin(u.metrics.run_ms)],
                ].map(([k, v]) => <div key={k} className="bg-[#131416] px-3.5 py-2.5"><dt className="text-[12px] text-white/50">{k}</dt><dd className="mt-0.5 truncate text-white">{v}</dd></div>)}
              </dl>
              <div>
                <h3 className="mb-3 text-[14px] font-semibold text-white">Zaman çizelgesi</h3>
                <ol className="relative space-y-3 pl-5 text-[13px] before:absolute before:bottom-1.5 before:left-[5px] before:top-1.5 before:w-px before:bg-white/[0.1]">
                  {[["Oluşturuldu", u.created_at], ["İşlenmeye başladı", u.started_at], [u.status === "canceled" ? "İptal edildi" : u.status === "failed" ? "Başarısız oldu" : "Tamamlandı", u.completed_at]].filter(([, t]) => t).map(([ad, t], i, l) => (
                    <li key={ad as string} className="relative flex justify-between gap-4">
                      <span className={cn("absolute -left-5 top-1.5 h-[11px] w-[11px] rounded-full ring-2 ring-[#111214]", i === l.length - 1 ? (u.status === "failed" ? "bg-rose-400" : u.status === "succeeded" ? "bg-emerald-400" : "bg-white/40") : "bg-white/40")} />
                      <span className="text-white/70">{ad}</span><span className="whitespace-nowrap text-[12.5px] tabular-nums text-white/80">{tarihSaat(t as string)}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <KodEditor dosyaAdi="input" dil="json" kod={JSON.stringify(u.input, null, 2)} maxH={260} />
              {Object.keys(u.metadata ?? {}).length > 0 && <KodEditor dosyaAdi="metadata" dil="json" kod={JSON.stringify(u.metadata, null, 2)} maxH={160} />}
              <div>
                <h3 className="mb-3 text-[14px] font-semibold text-white">Webhook teslimleri</h3>
                {ilgili.length ? (
                  <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] ring-1 ring-white/[0.08]">
                    {ilgili.map((t) => (
                      <li key={t.id} className="flex items-center gap-3 px-3.5 py-2.5 text-[12.5px]">
                        <DurumRozet durum={t.state === "succeeded" ? "succeeded" : t.state === "failed" ? "failed" : "pending"} />
                        <span className="font-mono text-white/60">{t.event}</span>
                        <span className="min-w-0 flex-1 truncate text-white/50">{t.url}</span>
                        <HttpRozet kod={t.attempts[t.attempts.length - 1]?.status ?? 0} />
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[13px] text-white/55">Bu üretim için teslim yok. Webhook&apos;ları ayarlamak için <Link href="/panel/api/webhooklar" className="text-[#55d6fd] hover:underline">Webhook&apos;lar</Link>.</p>}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/[0.07] px-5 py-3.5">
          <Link href={`/panel/api/modeller/${u.model}/oyun-alani`} className={ikincil}><Play className="h-4 w-4" />Oyun alanı</Link>
          <Link href={`/panel/api/konsol?uc=uretim-olustur&govde=${tekrarGovde}`} className={ikincil}><Terminal className="h-4 w-4" />Konsolda tekrarla</Link>
          <button onClick={async () => { if (await panoyaKopyala(curl)) toast.success("cURL komutu kopyalandı", { description: "Anahtar yerine $VAYRA_API_KEY kullanılır." }); else mesaj.kopyalanamadi(); }} className={ikincil}><Copy className="h-4 w-4" />cURL olarak kopyala</button>
          {suruyor && <button onClick={() => void iptalEt()} className={cn(ikincil, "text-rose-200 ring-rose-400/30 hover:bg-rose-500/10")}><Ban className="h-4 w-4" />İptal et</button>}
          {url && <a href={url} target="_blank" rel="noreferrer" className={cn(ikincil, "ml-auto")}><ExternalLink className="h-4 w-4" />Çıktıyı aç</a>}
        </div>
      </motion.aside>
    </div>,
    document.body,
  );
}

/** Panelden yapılan HTTP çağrıları (Konsol, Oyun alanı). */
type KodSuzgec = "tumu" | "2xx" | "4xx" | "5xx";
export function HttpGunlugu() {
  const cagrilar = useApiAnahtar((s) => s.cagrilar);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const temizle = useApiAnahtar((s) => s.cagrilariTemizle);
  const [acik, setAcik] = useState<string | null>(null);
  const [kod, setKod] = useState<KodSuzgec>("tumu");
  const liste = cagrilar.filter((c) => kod === "tumu" || (kod === "2xx" ? c.durumKodu < 300 && c.durumKodu > 0 : kod === "4xx" ? c.durumKodu >= 400 && c.durumKodu < 500 : c.durumKodu >= 500 || c.durumKodu === 0));
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SecimSerit id="http-kod" secenek={(["tumu", "2xx", "4xx", "5xx"] as KodSuzgec[]).map((k) => ({ id: k, ad: k === "tumu" ? "Tümü" : k }))} deger={kod} onDegis={setKod} />
        {cagrilar.length > 0 && <button onClick={temizle} className={cn(ikincil, "ml-auto")}>Günlüğü temizle</button>}
      </div>
      <section className={cn(kart, "overflow-hidden")}>
        {!liste.length ? <BosDurum ikon={Terminal} baslik="HTTP günlüğü boş" aciklama="Konsol ve Oyun alanından gönderilen her istek, yanıt gövdesi ve süresiyle burada kaydedilir." /> : (
          <ul className="divide-y divide-white/[0.05]">
            {liste.map((c) => (
              <li key={c.id}>
                <button onClick={() => setAcik(acik === c.id ? null : c.id)} className={cn("flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.03]", acik === c.id && "bg-white/[0.04]")}>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", c.durumKodu > 0 && c.durumKodu < 300 ? "bg-emerald-400" : c.durumKodu >= 400 && c.durumKodu < 500 ? "bg-amber-300" : "bg-rose-400")} />
                  <HttpRozet kod={c.durumKodu} />
                  <YontemRozet yontem={c.yontem} />
                  <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-white">/v1{c.yol}</code>
                  <span className="hidden text-[12px] text-white/55 sm:inline">{anahtarlar.find((a) => a.id === c.anahtarId)?.ad ?? "Anahtarsız"}</span>
                  <span className="w-16 whitespace-nowrap text-right text-[12px] tabular-nums text-white/60">{sureMetin(c.sureMs)}</span>
                  <span className="hidden w-24 whitespace-nowrap text-right text-[12px] text-white/50 md:inline">{goreli(c.zaman)}</span>
                </button>
                {acik === c.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid gap-3 overflow-hidden border-t border-white/[0.05] bg-black/20 p-4 lg:grid-cols-2">
                    <KodEditor dosyaAdi="İstek gövdesi" dil="json" kod={guzel(c.istek) || "// gövde yok"} maxH={320} />
                    <KodEditor dosyaAdi={`Yanıt · ${c.durumKodu}`} dil="json" kod={guzel(c.yanit) || "// boş"} maxH={320} />
                  </motion.div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function guzel(s: string | null) {
  if (!s) return "";
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
}
