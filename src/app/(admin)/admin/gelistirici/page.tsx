"use client";

import { useMemo, useState } from "react";
import {
  Code2, KeyRound, Activity, Webhook, Gauge, Package, TrendingUp,
  Plus, Copy, Check, RefreshCw, Trash2, Play, Power, ShieldCheck, BookOpen, Terminal, Filter,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD, DurumNokta } from "@/components/admin/ui/temel";
import { Cekmece } from "@/components/admin/ui/tablo";
import { useOnay } from "@/components/admin/ui/Onay";
import { AlanGrafik, DonutGrafik, YatayCubuk } from "@/components/admin/grafik";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import {
  useAdminApiKey, WEBHOOK_OLAYLAR,
  type ApiScope, type WebhookOlay,
} from "@/store/admin/useAdminApiKey";
import { endpointStatlari, sdkDagilim, apiMetrik, uretApiLoglar, type ApiLog } from "@/lib/admin/seed/gelistirici";
import { kisaSayi, sayi, yuzde, goreceZaman, tarihSaat } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

const SCOPE_ETIKET: Record<ApiScope, string> = { read: "Okuma", write: "Yazma", admin: "Yönetim" };
const SCOPE_TON: Record<ApiScope, "aksan" | "uyari" | "tehlike"> = { read: "aksan", write: "uyari", admin: "tehlike" };

function statusTon(s: number): "basari" | "uyari" | "tehlike" | "notr" {
  if (s >= 500) return "tehlike";
  if (s === 429) return "uyari";
  if (s >= 400) return "uyari";
  if (s >= 200 && s < 300) return "basari";
  return "notr";
}

export default function Gelistirici() {
  const oturum = useAdminOturum();
  const { onayIste } = useOnay();
  const store = useAdminApiKey();
  const [sekme, setSekme] = useState("genel");

  const endpoints = useMemo(() => endpointStatlari(), []);
  const sdk = useMemo(() => sdkDagilim(), []);
  const metrik = apiMetrik();
  const loglar = useMemo(() => uretApiLoglar(80), []);

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik" = "uyari") =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, onem, arac: "manuel" });

  /* ── Yeni anahtar oluşturma ── */
  const [keyModal, setKeyModal] = useState(false);
  const [yeniAd, setYeniAd] = useState("");
  const [yeniScope, setYeniScope] = useState<ApiScope[]>(["read"]);
  const [uretilenTam, setUretilenTam] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [rotateGoster, setRotateGoster] = useState<{ ad: string; tam: string } | null>(null);

  const scopeToggle = (s: ApiScope) =>
    setYeniScope((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const keyOlustur = () => {
    if (!yeniAd.trim()) { toast.error("Anahtar adı eksik", { description: "Anahtarı tanıyabilmek için bir ad yaz." }); return; }
    const { tam } = store.keyOlustur(yeniAd, yeniScope);
    denetle(`API anahtarı oluşturuldu: ${yeniAd}`);
    setUretilenTam(tam);
    setKopyalandi(false);
    toast.success("API anahtarı oluşturuldu", { description: "Anahtarı şimdi kopyala; bir daha tam hâli gösterilmez." });
  };

  const kopyala = async (metin: string) => {
    try { await navigator.clipboard.writeText(metin); } catch { mesaj.kopyalanamadi(); return; }
    setKopyalandi(true);
    mesaj.kopyalandi("Anahtar");
    setTimeout(() => setKopyalandi(false), 1500);
  };

  const modalKapat = () => {
    setKeyModal(false); setUretilenTam(null); setYeniAd(""); setYeniScope(["read"]);
  };

  const iptalEt = async (id: string, ad: string) => {
    const ok = await onayIste({ baslik: "Anahtarı iptal et", aciklama: `“${ad}” kalıcı olarak silinir. Bu anahtarla yapılan tüm istekler anında 401 döner.`, risk: 2, eylemEtiket: "İptal et" });
    if (!ok) return;
    store.keyIptal(id); denetle(`API anahtarı iptal edildi: ${ad}`, "kritik"); toast.success("Anahtar iptal edildi", { description: `${ad} ile yapılan istekler artık 401 döner.` });
  };

  const rotate = async (id: string, ad: string) => {
    const ok = await onayIste({ baslik: "Anahtarı yenile (rotate)", aciklama: `“${ad}” için yeni anahtar üretilir, eski anahtar anında geçersiz olur. İstek sayacı korunur.`, risk: 1, eylemEtiket: "Yenile" });
    if (!ok) return;
    const tam = store.keyRotate(id);
    if (tam) { setRotateGoster({ ad, tam }); denetle(`API anahtarı yenilendi: ${ad}`); toast.success("Anahtar yenilendi", { description: "Eski anahtar geçersiz oldu. Yenisini entegrasyonlara gir." }); }
  };

  /* ── Webhook ekleme ── */
  const [whModal, setWhModal] = useState(false);
  const [whUrl, setWhUrl] = useState("");
  const [whOlaylar, setWhOlaylar] = useState<WebhookOlay[]>(["job.completed"]);
  const whOlayToggle = (o: WebhookOlay) =>
    setWhOlaylar((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));

  const whEkle = () => {
    if (!/^https?:\/\/.+/.test(whUrl.trim())) { toast.error("Adres geçersiz", { description: "https:// ile başlayan tam bir adres gir." }); return; }
    if (!whOlaylar.length) { toast.error("Olay seçilmedi", { description: "Webhook için en az bir olay seç." }); return; }
    store.webhookEkle(whUrl, whOlaylar); denetle(`Webhook eklendi: ${whUrl}`);
    toast.success("Webhook eklendi");
    setWhModal(false); setWhUrl(""); setWhOlaylar(["job.completed"]);
  };
  const whTest = (id: string, url: string) => { store.webhookTest(id); denetle(`Webhook test edildi: ${url}`, "bilgi"); toast.success("Test olayı gönderildi", { description: `${url} adresinden 200 OK döndü sayıldı.` }); };
  const whSil = async (id: string, url: string) => {
    const ok = await onayIste({ baslik: "Webhook sil", aciklama: `${url} silinecek. Bu adrese artık olay gönderilmez.`, risk: 1, eylemEtiket: "Sil" });
    if (!ok) return;
    store.webhookSil(id); denetle(`Webhook silindi: ${url}`); toast.success("Webhook silindi", { description: `${url} adresine artık olay gönderilmez.` });
  };

  /* ── Rate limit düzenleme ── */
  const [tierDzn, setTierDzn] = useState<string | null>(null);

  /* ── Log filtresi ── */
  const [logMethod, setLogMethod] = useState<"hepsi" | "GET" | "POST" | "DELETE">("hepsi");
  const [logSadeceHata, setLogSadeceHata] = useState(false);
  const filtreLog = loglar.filter((l) =>
    (logMethod === "hepsi" || l.method === logMethod) && (!logSadeceHata || l.status >= 400),
  );

  const aktifKey = store.keyler.filter((k) => k.aktif).length;

  const sekmeler = [
    { id: "genel", ad: "Genel Bakış" },
    { id: "anahtar", ad: "API Anahtarları", sayi: store.keyler.length },
    { id: "webhook", ad: "Webhooklar", sayi: store.webhooklar.length },
    { id: "loglar", ad: "API Logları", sayi: loglar.length },
    { id: "ratelimit", ad: "Rate Limit" },
    { id: "docs", ad: "Dokümantasyon" },
  ];

  return (
    <RotaGuard modul="gelistirici">
      <BolumBaslik baslik="Geliştirici Platformu" ozet="dev.vayra — API anahtarları, webhooklar, loglar ve rate limit yönetimi" ikon={Code2} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Toplam anahtar" deger={sayi(store.keyler.length)} ikon={KeyRound} alt={`${aktifKey} aktif`} />
        <MetrikKart etiket="API çağrısı (30g)" deger={kisaSayi(metrik.cagri30)} ikon={Activity} delta={12.1} renk="basari" />
        <MetrikKart etiket="Ort. latency" deger={metrik.ortLatency + "ms"} ikon={Gauge} renk="aksan" />
        <MetrikKart etiket="Hata oranı" deger={yuzde(metrik.hataOran)} ikon={TrendingUp} alt={`${metrik.rateLimitAsim} rate limit aşımı`} renk={metrik.hataOran > 2 ? "tehlike" : "basari"} />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* ── Genel Bakış ── */}
      {sekme === "genel" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Kart className="lg:col-span-2"><h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Günlük API çağrısı (30 gün)</h3><AlanGrafik veri={metrik.aylikCagriSeri} yukseklik={170} /></Kart>
          <Kart><h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Package className="h-4 w-4 text-[color:var(--ad-aksan)]" /> SDK dağılımı</h3><DonutGrafik veri={sdk} boyut={140} /></Kart>
          <Kart className="lg:col-span-3">
            <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Endpoint istatistikleri (30 gün)</h3>
            <div className="space-y-2">
              {endpoints.map((e) => (
                <div key={e.endpoint} className="flex items-center gap-3 rounded-lg border border-[color:var(--ad-kenar)] p-2.5">
                  <code className={cn("flex-1 font-mono text-[13px]", AD.metin)}>{e.endpoint}</code>
                  <span className={cn("text-[12px] tabular-nums", AD.metin2)}>{kisaSayi(e.cagri)} çağrı</span>
                  <span className={cn("text-[12px] tabular-nums", AD.metin3)}>{e.ortMs}ms</span>
                  <Rozet ton={e.hataOran > 2 ? "tehlike" : e.hataOran > 1 ? "uyari" : "basari"}>%{e.hataOran} hata</Rozet>
                </div>
              ))}
            </div>
          </Kart>
        </div>
      )}

      {/* ── API Anahtarları ── */}
      {sekme === "anahtar" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className={cn("text-[13px]", AD.metin3)}>Anahtarlar bir kez tam gösterilir, sonra maskeli tutulur.</p>
            <Dugme boyut="sm" ikon={Plus} onClick={() => setKeyModal(true)}>Yeni anahtar</Dugme>
          </div>
          <Kart className="overflow-hidden !p-0">
            <div className="overflow-x-auto ad-ince-scroll">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-4 py-3">Ad / Anahtar</th><th className="px-4 py-3">İzinler</th><th className="px-4 py-3 text-right">İstek</th><th className="px-4 py-3 text-right">Son kullanım</th><th className="px-4 py-3 text-center">Durum</th><th className="px-4 py-3 text-right">İşlem</th></tr></thead>
                <tbody>{store.keyler.map((k) => (
                  <tr key={k.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                    <td className="px-4 py-3">
                      <div className={cn("font-medium", AD.metin)}>{k.ad}</div>
                      <code className={cn("font-mono text-[12px]", AD.metin3)}>{k.anahtar}</code>
                    </td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{k.scope.map((s) => <Rozet key={s} ton={SCOPE_TON[s]}>{SCOPE_ETIKET[s]}</Rozet>)}</div></td>
                    <td className="px-4 py-3 text-right tabular-nums text-[color:var(--ad-metin)]">{kisaSayi(k.istekSayisi)}</td>
                    <td className="px-4 py-3 text-right"><span className={cn("text-[12px]", AD.metin3)}>{k.sonKullanim ? goreceZaman(k.sonKullanim) : "—"}</span></td>
                    <td className="px-4 py-3 text-center"><Rozet ton={k.aktif ? "basari" : "notr"}>{k.aktif ? "aktif" : "pasif"}</Rozet></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => store.keyToggle(k.id)} title={k.aktif ? "Pasifleştir" : "Aktifleştir"} className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--ad-metin)]"><Power className="h-4 w-4" /></button>
                        <button onClick={() => rotate(k.id, k.ad)} title="Yenile (rotate)" className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--ad-aksan)]"><RefreshCw className="h-4 w-4" /></button>
                        <button onClick={() => iptalEt(k.id, k.ad)} title="İptal et" className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Kart>
        </div>
      )}

      {/* ── Webhooklar ── */}
      {sekme === "webhook" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className={cn("text-[13px]", AD.metin3)}>Olaylar imzalı POST ile bildirim URL&apos;ine iletilir.</p>
            <Dugme boyut="sm" ikon={Plus} onClick={() => setWhModal(true)}>Webhook ekle</Dugme>
          </div>
          {store.webhooklar.length === 0 && <Kart><p className={cn("py-6 text-center text-[13px]", AD.metin3)}>Henüz webhook yok.</p></Kart>}
          <div className="space-y-2">
            {store.webhooklar.map((w) => (
              <Kart key={w.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <DurumNokta ton={w.aktif ? "basari" : "notr"} nabiz={w.aktif} />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Webhook className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <code className={cn("block truncate text-[13px]", AD.metin)}>{w.url}</code>
                    <div className={cn("flex flex-wrap items-center gap-1.5 pt-1 text-[11px]", AD.metin3)}>
                      {w.olaylar.map((o) => <span key={o} className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono">{o}</span>)}
                      {w.sonTeslim && <span>· son teslim {goreceZaman(w.sonTeslim)}</span>}
                    </div>
                  </div>
                  {w.sonDurum != null && <Rozet ton={statusTon(w.sonDurum)}>{w.sonDurum}</Rozet>}
                  <span className="text-[12px] tabular-nums text-emerald-400">{kisaSayi(w.basari)} ✓</span>
                  {w.basarisiz > 0 && <span className="text-[12px] tabular-nums text-rose-400">{w.basarisiz} ✗</span>}
                  <div className="flex items-center gap-1">
                    <button onClick={() => whTest(w.id, w.url)} title="Test gönder" className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--ad-aksan)]"><Play className="h-4 w-4" /></button>
                    <button onClick={() => store.webhookToggle(w.id)} title={w.aktif ? "Duraklat" : "Etkinleştir"} className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--ad-metin)]"><Power className="h-4 w-4" /></button>
                    <button onClick={() => whSil(w.id, w.url)} title="Sil" className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </Kart>
            ))}
          </div>
        </div>
      )}

      {/* ── API Logları ── */}
      {sekme === "loglar" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-[color:var(--ad-metin-3)]" />
            {(["hepsi", "GET", "POST", "DELETE"] as const).map((m) => (
              <button key={m} onClick={() => setLogMethod(m)}
                className={cn("rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
                  logMethod === m ? "border-[color:var(--ad-aksan)] bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] hover:text-[color:var(--ad-metin)]")}>
                {m === "hepsi" ? "Tümü" : m}
              </button>
            ))}
            <button onClick={() => setLogSadeceHata((v) => !v)}
              className={cn("ml-auto rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
                logSadeceHata ? "border-rose-400/50 bg-rose-500/10 text-rose-400" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] hover:text-[color:var(--ad-metin)]")}>
              Sadece hatalar
            </button>
          </div>
          <Kart className="overflow-hidden !p-0">
            <div className="overflow-x-auto ad-ince-scroll">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-4 py-2.5">Zaman</th><th className="px-4 py-2.5">Method</th><th className="px-4 py-2.5">Endpoint</th><th className="px-4 py-2.5 text-center">Status</th><th className="px-4 py-2.5 text-right">Latency</th><th className="px-4 py-2.5">Anahtar</th><th className="px-4 py-2.5">IP</th></tr></thead>
                <tbody>{filtreLog.map((l: ApiLog) => (
                  <tr key={l.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap text-[12px] tabular-nums text-[color:var(--ad-metin-3)]">{tarihSaat(l.zaman)}</td>
                    <td className="px-4 py-2"><span className={cn("font-mono text-[11px] font-bold", l.method === "GET" ? "text-emerald-400" : l.method === "POST" ? "text-[color:var(--ad-aksan)]" : "text-rose-400")}>{l.method}</span></td>
                    <td className="px-4 py-2"><code className={cn("font-mono text-[12px]", AD.metin2)}>{l.endpoint}</code></td>
                    <td className="px-4 py-2 text-center"><Rozet ton={statusTon(l.status)}>{l.status}</Rozet></td>
                    <td className={cn("px-4 py-2 text-right tabular-nums text-[12px]", l.latencyMs > 2000 ? "text-amber-400" : AD.metin2)}>{l.latencyMs}ms</td>
                    <td className="px-4 py-2"><code className={cn("font-mono text-[11px]", AD.metin3)}>{l.apiKeyId}</code></td>
                    <td className="px-4 py-2 tabular-nums text-[12px] text-[color:var(--ad-metin-3)]">{l.ip}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {filtreLog.length === 0 && <p className={cn("py-6 text-center text-[13px]", AD.metin3)}>Filtreye uyan log yok.</p>}
          </Kart>
        </div>
      )}

      {/* ── Rate Limit ── */}
      {sekme === "ratelimit" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart>
            <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Gauge className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Tier bazlı rate limitler</h3>
            <div className="space-y-2">
              {store.tierler.map((t) => {
                const dzn = tierDzn === t.id;
                return (
                  <div key={t.id} className="rounded-xl border border-[color:var(--ad-kenar)] p-3">
                    <div className="flex items-center justify-between">
                      <span className={cn("font-medium", AD.metin)}>{t.ad}</span>
                      <button onClick={() => setTierDzn(dzn ? null : t.id)} className={cn("text-[12px] font-semibold", dzn ? "text-[color:var(--ad-metin-3)]" : "text-[color:var(--ad-aksan)]")}>{dzn ? "Kapat" : "Düzenle"}</button>
                    </div>
                    {dzn ? (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {([["istekDk", "istek/dk"], ["istekGun", "istek/gün"], ["esZamanli", "eş zamanlı"]] as const).map(([alan, et]) => (
                          <label key={alan} className="block">
                            <span className={cn("mb-1 block text-[11px]", AD.metin3)}>{et}</span>
                            <input type="number" min={0} value={t[alan]} onChange={(e) => store.tierGuncelle(t.id, alan, +e.target.value)}
                              className="h-8 w-full rounded-lg border border-[color:var(--ad-aksan)]/40 bg-white/[0.03] px-2 text-right text-sm tabular-nums text-[color:var(--ad-metin)]" />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-4 text-[13px]">
                        <span className={cn("tabular-nums", AD.metin2)}>{sayi(t.istekDk)}/dk</span>
                        <span className={cn("tabular-nums", AD.metin3)}>{kisaSayi(t.istekGun)}/gün</span>
                        <span className={cn("tabular-nums", AD.metin3)}>{t.esZamanli} eş zamanlı</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Dugme boyut="sm" className="mt-3" onClick={() => { denetle("Rate limit tierleri güncellendi"); toast.success("Hız limitleri kaydedildi"); setTierDzn(null); }}>Değişiklikleri kaydet</Dugme>
          </Kart>
          <Kart>
            <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Endpoint bazlı çağrı hacmi</h3>
            <YatayCubuk veri={endpoints.slice(0, 6).map((e) => ({ etiket: e.endpoint.split(" ")[1], deger: e.cagri, alt: kisaSayi(e.cagri) }))} renk="#a78bfa" />
          </Kart>
        </div>
      )}

      {/* ── Dokümantasyon ── */}
      {sekme === "docs" && <Dokumantasyon />}

      {/* ── Yeni anahtar modalı (Cekmece) ── */}
      <Cekmece acik={keyModal} kapat={modalKapat} baslik="Yeni API anahtarı" genislik="max-w-md">
        {!uretilenTam ? (
          <div className="space-y-4">
            <label className="block">
              <span className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Anahtar adı</span>
              <input value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder="ör. Production API"
                className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
            </label>
            <div>
              <span className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>İzinler (scope)</span>
              <div className="space-y-2">
                {(["read", "write", "admin"] as ApiScope[]).map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[color:var(--ad-kenar)] p-2.5 hover:border-[color:var(--ad-aksan)]/40">
                    <input type="checkbox" checked={yeniScope.includes(s)} onChange={() => scopeToggle(s)} className="h-4 w-4 accent-[color:var(--ad-aksan)]" />
                    <span className={cn("text-sm font-medium", AD.metin)}>{SCOPE_ETIKET[s]}</span>
                    <span className={cn("ml-auto font-mono text-[11px]", AD.metin3)}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <Dugme className="w-full" ikon={KeyRound} onClick={keyOlustur}>Anahtar oluştur</Dugme>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-[12px] text-amber-200/90">Bu anahtar yalnızca bir kez gösterilir. Şimdi kopyala ve güvenli sakla — sonra maskeli tutulacak.</p>
            </div>
            <div className="rounded-xl border border-[color:var(--ad-kenar)] bg-black/30 p-3">
              <code className="block break-all font-mono text-[13px] text-[color:var(--ad-aksan)]">{uretilenTam}</code>
            </div>
            <div className="flex gap-2">
              <Dugme className="flex-1" ikon={kopyalandi ? Check : Copy} onClick={() => kopyala(uretilenTam)}>{kopyalandi ? "Kopyalandı" : "Kopyala"}</Dugme>
              <Dugme tur="glass" onClick={modalKapat}>Kapat</Dugme>
            </div>
          </div>
        )}
      </Cekmece>

      {/* ── Rotate sonucu modalı ── */}
      <Cekmece acik={!!rotateGoster} kapat={() => setRotateGoster(null)} baslik="Anahtar yenilendi" genislik="max-w-md">
        {rotateGoster && (
          <div className="space-y-4">
            <p className={cn("text-[13px]", AD.metin2)}>“{rotateGoster.ad}” için yeni anahtar. Eski anahtar artık geçersiz.</p>
            <div className="rounded-xl border border-[color:var(--ad-kenar)] bg-black/30 p-3">
              <code className="block break-all font-mono text-[13px] text-[color:var(--ad-aksan)]">{rotateGoster.tam}</code>
            </div>
            <div className="flex gap-2">
              <Dugme className="flex-1" ikon={Copy} onClick={() => kopyala(rotateGoster.tam)}>Kopyala</Dugme>
              <Dugme tur="glass" onClick={() => setRotateGoster(null)}>Kapat</Dugme>
            </div>
          </div>
        )}
      </Cekmece>

      {/* ── Webhook ekleme modalı ── */}
      <Cekmece acik={whModal} kapat={() => setWhModal(false)} baslik="Webhook ekle" genislik="max-w-md">
        <div className="space-y-4">
          <label className="block">
            <span className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Bildirim URL&apos;i</span>
            <input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://app.example.com/hooks/vayra"
              className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 font-mono text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" />
          </label>
          <div>
            <span className={cn("mb-1.5 block text-[13px] font-medium", AD.metin2)}>Olaylar</span>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_OLAYLAR.map((o) => (
                <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[color:var(--ad-kenar)] p-2 hover:border-[color:var(--ad-aksan)]/40">
                  <input type="checkbox" checked={whOlaylar.includes(o)} onChange={() => whOlayToggle(o)} className="h-3.5 w-3.5 accent-[color:var(--ad-aksan)]" />
                  <span className={cn("font-mono text-[11px]", AD.metin)}>{o}</span>
                </label>
              ))}
            </div>
          </div>
          <Dugme className="w-full" ikon={Webhook} onClick={whEkle}>Webhook ekle</Dugme>
        </div>
      </Cekmece>
    </RotaGuard>
  );
}

/* ── Statik ama gerçek içerikli dokümantasyon ── */
function Dokumantasyon() {
  const DOK: { baslik: string; method: string; yol: string; ozet: string; ornek: string }[] = [
    {
      baslik: "Üretim başlat", method: "POST", yol: "/v1/generate",
      ozet: "Metin/görsel isteğinden yeni üretim job'ı oluşturur. Yanıtta job id döner, durumu ayrı çekilir.",
      ornek: `curl -X POST https://api.vayra.dev/v1/generate \\
  -H "Authorization: Bearer vay_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"vayra-video-2","prompt":"gün batımında sahil","duration":5}'`,
    },
    {
      baslik: "Job durumu", method: "GET", yol: "/v1/jobs/:id",
      ozet: "Bir üretim job'ının durumunu ve tamamlandıysa sonuç URL'lerini döner.",
      ornek: `curl https://api.vayra.dev/v1/jobs/job_8f2a1c \\
  -H "Authorization: Bearer vay_live_xxxx"`,
    },
    {
      baslik: "Model listesi", method: "GET", yol: "/v1/models",
      ozet: "Hesabın erişebildiği modelleri, kredi maliyetlerini ve yeteneklerini listeler.",
      ornek: `curl https://api.vayra.dev/v1/models \\
  -H "Authorization: Bearer vay_live_xxxx"`,
    },
    {
      baslik: "Bakiye sorgula", method: "GET", yol: "/v1/account/balance",
      ozet: "Kalan kredi ve mevcut rate limit tier bilgisini döner.",
      ornek: `curl https://api.vayra.dev/v1/account/balance \\
  -H "Authorization: Bearer vay_live_xxxx"`,
    },
    {
      baslik: "Job iptal", method: "DELETE", yol: "/v1/jobs/:id",
      ozet: "Beklemede/işlenmekte olan bir job'ı iptal eder ve rezerve krediyi iade eder.",
      ornek: `curl -X DELETE https://api.vayra.dev/v1/jobs/job_8f2a1c \\
  -H "Authorization: Bearer vay_live_xxxx"`,
    },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Kart>
        <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><BookOpen className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Başlangıç</h3>
        <div className={cn("space-y-3 text-[13px] leading-relaxed", AD.metin2)}>
          <p>Tüm istekler <code className="rounded bg-white/[0.06] px-1 font-mono text-[12px] text-[color:var(--ad-aksan)]">https://api.vayra.dev</code> üzerinden HTTPS ile yapılır.</p>
          <p>Kimlik doğrulama <span className="font-semibold">Bearer</span> başlığı ile: <code className="rounded bg-white/[0.06] px-1 font-mono text-[12px] text-[color:var(--ad-aksan)]">Authorization: Bearer vay_live_...</code></p>
          <p>Rate limit aşımında <code className="rounded bg-white/[0.06] px-1 font-mono text-[12px] text-amber-400">429</code> döner; <code className="font-mono text-[12px]">Retry-After</code> başlığına uyun.</p>
          <p>Webhook imzası <code className="font-mono text-[12px]">X-Vayra-Signature</code> başlığında HMAC-SHA256 ile gönderilir.</p>
        </div>
      </Kart>
      <div className="space-y-3 lg:col-span-2">
        {DOK.map((d) => (
          <Kart key={d.yol} className="!p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className={cn("font-mono text-[11px] font-bold", d.method === "GET" ? "text-emerald-400" : d.method === "POST" ? "text-[color:var(--ad-aksan)]" : "text-rose-400")}>{d.method}</span>
              <code className={cn("font-mono text-[13px] font-semibold", AD.metin)}>{d.yol}</code>
              <span className={cn("ml-auto text-[13px] font-semibold", AD.metin2)}>{d.baslik}</span>
            </div>
            <p className={cn("mb-2.5 text-[12px]", AD.metin3)}>{d.ozet}</p>
            <div className="flex items-start gap-2 overflow-x-auto rounded-lg border border-[color:var(--ad-kenar)] bg-black/40 p-3 ad-ince-scroll">
              <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--ad-metin-3)]" />
              <pre className="font-mono text-[11.5px] leading-relaxed text-[color:var(--ad-metin-2)]">{d.ornek}</pre>
            </div>
          </Kart>
        ))}
      </div>
    </div>
  );
}
