"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "framer-motion";
import {
  AlertTriangle, ArrowUpRight, Ban, Check, CheckCircle2, ChevronDown, CircleDashed, Code2, Copy, Download, ExternalLink, FileText, History,
  Info, KeyRound, LayoutGrid, Loader2, Play, Search, ShieldCheck, Sparkles, Terminal, Wallet, XCircle,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { anahtarMaske } from "@/store/useApiAnahtar";
import { AnahtarSecici, KodEditor, KopyalaDugme, OrtamRozet, panoyaKopyala, useSeciliAnahtar, sureMetin } from "@/components/api/ui";
import { kesfetFont } from "@/components/kesfet/font";
import type { McpArac } from "@/lib/mcp/araclar";
import { MODELLER } from "@/lib/catalog";
import { ISTEMCILER, IstemciLogo, McpSahne, type IstemciId } from "@/components/mcp/McpSahne";
import { KapanisCta, McpSss, Senaryolar } from "@/components/mcp/McpVitrin";
import { cn } from "@/lib/utils";

const yay = { type: "spring" as const, stiffness: 420, damping: 34 };

/* ── Yardımcılar ── */

type Rpc = { jsonrpc: "2.0"; id: number; result?: Record<string, unknown>; error?: { code: number; message: string } };

async function rpc(url: string, anahtar: string | null, method: string, params?: Record<string, unknown>): Promise<{ ms: number; http: number; j: Rpc | null }> {
  const t0 = performance.now();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18", ...(anahtar ? { authorization: `Bearer ${anahtar}` } : {}) },
      body: JSON.stringify({ jsonrpc: "2.0", id: Math.floor(Math.random() * 1e6), method, ...(params ? { params } : {}) }),
    });
    return { ms: Math.round(performance.now() - t0), http: r.status, j: await r.json().catch(() => null) };
  } catch {
    return { ms: Math.round(performance.now() - t0), http: 0, j: null };
  }
}

function useKok() {
  const [kok, setKok] = useState("");
  useEffect(() => setKok(window.location.origin), []);
  return kok;
}

const git = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

/* ── İstemci yapılandırmaları ── */

function kurulum(id: IstemciId, url: string, anahtar: string) {
  const json = (o: unknown) => JSON.stringify(o, null, 2);
  switch (id) {
    case "claude-code": return {
      adimlar: ["Terminalde çalıştır; sunucu kullanıcı kapsamına eklenir.", "Claude Code'da /mcp yaz; vayra “connected” görünmeli.", "Dene: “nano-banana-pro ile sisli bir orman görseli üret”."],
      dosya: "terminal", dil: "bash",
      kod: `claude mcp add --transport http vayra ${url} \\\n  --header "Authorization: Bearer ${anahtar}" --scope user`,
    };
    case "claude-desktop": return {
      adimlar: ["Ayarlar › Geliştirici › Yapılandırmayı düzenle ile claude_desktop_config.json dosyasını aç.", "Aşağıdakini ekle (Node 18+ gerekir; mcp-remote HTTP sunucusuna köprü kurar).", "Claude Desktop'ı yeniden başlat; araç simgesinde vayra görünür."],
      dosya: "claude_desktop_config.json", dil: "json",
      kod: json({ mcpServers: { vayra: { command: "npx", args: ["-y", "mcp-remote", url, "--header", "Authorization:${VAYRA_AUTH}"], env: { VAYRA_AUTH: `Bearer ${anahtar}` } } } }),
    };
    case "cursor": return {
      adimlar: ["Tek tıkla kur ya da ~/.cursor/mcp.json dosyasına ekle.", "Cursor Ayarlar › MCP'de vayra yeşil görünmeli.", "Agent modunda üretim iste."],
      dosya: "~/.cursor/mcp.json", dil: "json",
      kod: json({ mcpServers: { vayra: { url, headers: { Authorization: `Bearer ${anahtar}` } } } }),
      tekTik: `cursor://anysphere.cursor-deeplink/mcp/install?name=vayra&config=${typeof window !== "undefined" ? btoa(JSON.stringify({ url, headers: { Authorization: `Bearer ${anahtar}` } })) : ""}`,
    };
    case "vscode": return {
      adimlar: ["Tek tıkla kur ya da çalışma alanında .vscode/mcp.json oluştur.", "Copilot Chat'i Agent moduna al; araçlarda vayra görünür.", "Sohbette üretim iste."],
      dosya: ".vscode/mcp.json", dil: "json",
      kod: json({ servers: { vayra: { type: "http", url, headers: { Authorization: `Bearer ${anahtar}` } } } }),
      tekTik: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: "vayra", type: "http", url, headers: { Authorization: `Bearer ${anahtar}` } }))}`,
    };
    case "windsurf": return {
      adimlar: ["Ayarlar › Cascade › MCP sunucuları › Ham yapılandırmayı görüntüle.", "~/.codeium/windsurf/mcp_config.json dosyasına ekle ve yenile.", "Cascade'de üretim iste."],
      dosya: "~/.codeium/windsurf/mcp_config.json", dil: "json",
      kod: json({ mcpServers: { vayra: { serverUrl: url, headers: { Authorization: `Bearer ${anahtar}` } } } }),
    };
    default: return {
      adimlar: ["Streamable HTTP destekleyen her MCP istemcisi bağlanır.", "Adresi ve Authorization başlığını gir.", "initialize, tools/list ve tools/call desteklenir."],
      dosya: "mcp.json", dil: "json",
      kod: json({ mcpServers: { vayra: { type: "http", url, headers: { Authorization: `Bearer ${anahtar}` } } } }),
    };
  }
}

const ORNEK: Record<string, Record<string, unknown>> = {
  list_models: { type: "image" },
  get_model: { model: "nano-banana-pro" },
  generate: { model: "nano-banana-pro", input: { prompt: "Sisli bir çam ormanında sabah ışığı, sinematik", aspect_ratio: "16:9" } },
  get_generation: { id: "gen_…" },
  list_generations: { limit: 5 },
  cancel_generation: { id: "gen_…" },
  get_account: {},
};

/* ── Sayfa ── */

type Sunucu = { ok: boolean; ms: number; surum?: string } | null;

export default function McpSayfasi() {
  const kok = useKok();
  const url = kok ? `${kok}/api/mcp` : "/api/mcp";
  const girisli = useAuth((s) => !!s.kullanici);
  const [secili, sec] = useSeciliAnahtar();
  const anahtar = secili?.tam ?? null;
  const [araclar, setAraclar] = useState<McpArac[] | null>(null);
  const [istemci, setIstemci] = useState<IstemciId>("claude-code");
  const [sunucu, setSunucu] = useState<Sunucu>(null);

  useEffect(() => {
    if (!kok) return;
    (async () => {
      const i = await rpc(url, null, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "vayra-panel", version: "1" } });
      setSunucu({ ok: i.http === 200 && !!i.j?.result, ms: i.ms, surum: i.j?.result?.protocolVersion as string | undefined });
      const t = await rpc(url, null, "tools/list");
      setAraclar((t.j?.result?.tools as McpArac[]) ?? []);
    })();
  }, [kok, url]);

  const yerel = kok.includes("localhost") || kok.includes("127.0.0.1");

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("kesfet-tema min-h-screen bg-zemin pb-28", kesfetFont.variable)}>
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-4 sm:px-8 sm:pt-6">
          <McpSahne istemci={istemci} setIstemci={setIstemci} sunucu={sunucu} onBagla={() => git("kurulum")} />

          <Olgular sunucu={sunucu} araclar={araclar} url={url} />

          <div className="mt-20 space-y-24 sm:mt-24">
            <Kurulum url={url} anahtar={anahtar} secili={secili} sec={sec} girisli={girisli} istemci={istemci} setIstemci={setIstemci} sunucu={sunucu} yerel={yerel} kok={kok} />
            <Araclar araclar={araclar} url={url} anahtar={anahtar} canli={secili?.ortam === "canli"} />
            <Senaryolar istemci={ISTEMCILER.find((i) => i.id === istemci)!.ad} />
            <Cli kok={kok} anahtar={anahtar} />
            <Guvenlik />
            <McpSss />
            <KapanisCta onBaslat={() => git("kurulum")} />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

function BolumBaslik({ ust, baslik, aciklama, sag }: { ust?: string; baslik: string; aciklama?: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-[640px]">
        {ust && <p className="text-[13px] font-medium text-[#55d6fd]">{ust}</p>}
        <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">{baslik}</h2>
        {aciklama && <p className="mt-2 text-[15px] leading-relaxed text-white/70">{aciklama}</p>}
      </div>
      {sag}
    </div>
  );
}

/* ── Olgular şeridi: canlı ölçülen değerler ── */

function Olgular({ sunucu, araclar, url }: { sunucu: Sunucu; araclar: McpArac[] | null; url: string }) {
  const hucreler: [string, React.ReactNode, string][] = [
    ["Model", MODELLER.length, "görsel, video, ses, müzik, 3D"],
    ["Araç", araclar ? araclar.length : "…", araclar ? `${araclar.filter((a) => a.annotations?.readOnlyHint).length} tanesi salt okunur` : "okunuyor"],
    ["Protokol", sunucu?.surum ?? "…", "Streamable HTTP"],
    ["Yanıt süresi", sunucu ? (sunucu.ok ? `${sunucu.ms} ms` : "Ulaşılamıyor") : "…", "şimdi ölçüldü"],
  ];
  return (
    <div className="mt-6 grid gap-px overflow-hidden rounded-[24px] bg-white/[0.07] ring-1 ring-white/[0.07] lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.5fr)]">
      {hucreler.map(([e, d, a], i) => (
        <motion.div key={e} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-[#0d0d0f] px-5 py-4">
          <p className="text-[12.5px] text-white/60">{e}</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-white">{d}</p>
          <p className="text-[12.5px] text-white/50">{a}</p>
        </motion.div>
      ))}
      <div className="flex flex-col justify-center bg-[#0d0d0f] px-5 py-4">
        <p className="text-[12.5px] text-white/60">Sunucu adresi</p>
        <div className="mt-1.5 flex items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-3.5 pr-1 ring-1 ring-white/[0.08]">
          <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-white">{url}</code>
          <KopyalaDugme metin={url} etiket="" sessiz />
        </div>
      </div>
    </div>
  );
}

/* ── Kurulum: istemci + 3 adım ── */

function Adim({ no, tamam, aktif, baslik, aciklama, son, children }: { no: number; tamam: boolean; aktif: boolean; baslik: React.ReactNode; aciklama?: React.ReactNode; son?: boolean; children: React.ReactNode }) {
  return (
    <li className="relative grid grid-cols-[34px_minmax(0,1fr)] gap-4">
      {!son && (
        <span className="absolute bottom-0 left-[16px] top-[38px] w-[2px] overflow-hidden rounded-full bg-white/[0.07]">
          <motion.span initial={false} animate={{ scaleY: tamam ? 1 : 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 origin-top bg-[#55d6fd]/70" />
        </span>
      )}
      <span className={cn("relative z-[1] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[13.5px] font-semibold transition-colors duration-300",
        tamam ? "bg-[#55d6fd] text-[#06222b]" : aktif ? "bg-white text-black" : "bg-white/[0.07] text-white/70 ring-1 ring-white/[0.1]")}>
        <AnimatePresence mode="wait" initial={false}>
          {tamam ? <motion.span key="t" initial={{ scale: 0.3, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={yay}><Check className="h-4 w-4" strokeWidth={3} /></motion.span> : <motion.span key="n" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{no}</motion.span>}
        </AnimatePresence>
      </span>
      <div className={cn("min-w-0", !son && "pb-9")}>
        <h3 className="pt-1 text-[17px] font-semibold tracking-[-0.01em] text-white">{baslik}</h3>
        {aciklama && <p className="mt-1 text-[14px] leading-relaxed text-white/65">{aciklama}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </li>
  );
}

function Kurulum({ url, anahtar, secili, sec, girisli, istemci, setIstemci, sunucu, yerel, kok }: {
  url: string; anahtar: string | null; secili: ReturnType<typeof useSeciliAnahtar>[0]; sec: ReturnType<typeof useSeciliAnahtar>[1]; girisli: boolean;
  istemci: IstemciId; setIstemci: (i: IstemciId) => void; sunucu: Sunucu; yerel: boolean; kok: string;
}) {
  const ist = ISTEMCILER.find((i) => i.id === istemci)!;
  const k = kurulum(istemci, url, anahtar ?? "vy_live_ANAHTARIN");
  const [kopyalandi, setKopyalandi] = useState(false);
  const [dogru, setDogru] = useState(false);
  const [ipucu, setIpucu] = useState(false);
  useEffect(() => { setKopyalandi(false); }, [istemci]);

  const kopyala = async () => {
    if (!(await panoyaKopyala(k.kod))) return;
    setKopyalandi(true); setIpucu(true); setTimeout(() => setIpucu(false), 1800);
  };

  return (
    <section id="kurulum" className="scroll-mt-24">
      <BolumBaslik ust="Kurulum" baslik="Üç adımda bağla" aciklama="İstemcini seç, anahtarını seç, yapılandırmayı ekle. Anahtar yapılandırmaya kendiliğinden yerleşir; sonunda bağlantıyı buradan doğrula." />

      {yerel && (
        <p className="mb-4 flex items-start gap-2.5 rounded-[16px] bg-amber-400/[0.06] px-4 py-3 text-[13.5px] leading-relaxed text-amber-100/90 ring-1 ring-amber-400/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          Sunucu yerel adreste ({kok}). Aynı bilgisayardaki istemciler bağlanır; başka cihazlardan ya da bulut ajanlarından bağlanmak için uygulamayı yayındaki adresiyle aç.
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[30px] bg-[#0e0e10] ring-1 ring-white/[0.08] lg:grid-cols-[290px_minmax(0,1fr)]">
        {/* İstemci seçimi */}
        <aside className="border-b border-white/[0.06] p-3 lg:border-b-0 lg:border-r">
          <p className="px-2.5 pb-2 pt-1.5 text-[13px] font-medium text-white/60">İstemci</p>
          <LayoutGroup id="mcp-kur-ist">
            <div role="tablist" aria-label="İstemci" className="-mx-3 flex gap-1 overflow-x-auto px-3 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:px-0">
              {ISTEMCILER.map((i) => (
                <button key={i.id} role="tab" aria-selected={istemci === i.id} onClick={() => setIstemci(i.id)}
                  className="group relative flex shrink-0 items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left transition active:scale-[0.98]">
                  {istemci === i.id && <motion.span layoutId="mcp-kur-ist-z" className="absolute inset-0 rounded-[16px] bg-white/[0.08] ring-1 ring-white/[0.1]" transition={yay} />}
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] transition group-hover:scale-105"><IstemciLogo id={i.id} boyut={20} /></span>
                  <span className="relative min-w-0 pr-1">
                    <span className={cn("block text-[14.5px] font-semibold transition-colors", istemci === i.id ? "text-white" : "text-white/75 group-hover:text-white")}>{i.ad}</span>
                    <span className="block whitespace-nowrap text-[12.5px] text-white/55">{i.alt}</span>
                  </span>
                  {i.tekTik && <span className="relative ml-auto hidden rounded-full bg-[#55d6fd]/12 px-2 py-0.5 text-[11px] font-medium text-[#8fe6ff] lg:block">Tek tıkla</span>}
                </button>
              ))}
            </div>
          </LayoutGroup>
          <div className="mx-1 mt-4 hidden rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-white/[0.06] lg:block">
            <p className="text-[13px] font-medium text-white">Sunucu</p>
            <p className={cn("mt-1 flex items-center gap-1.5 text-[12.5px]", sunucu === null ? "text-white/55" : sunucu.ok ? "text-emerald-300" : "text-rose-300")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", sunucu === null ? "bg-white/40" : sunucu.ok ? "bg-emerald-400" : "bg-rose-400")} />
              {sunucu === null ? "Ölçülüyor" : sunucu.ok ? `Çalışıyor · ${sunucu.ms} ms` : "Ulaşılamıyor"}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">Listede yok mu? Streamable HTTP destekleyen her istemci bağlanır.</p>
          </div>
        </aside>

        {/* Adımlar */}
        <ol className="min-w-0 p-5 sm:p-7">
          <Adim no={1} tamam={!!secili} aktif={!secili} baslik="API anahtarını seç" aciklama="Ajana tam yetki gerekmez; yalnız üretim yetkili bir anahtar yeterli.">
            <div className="max-w-[520px]">
              {girisli ? <AnahtarSecici secili={secili} onSec={sec} /> : <Link href="/giris?geri=/panel/mcp" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-[0.97]"><KeyRound className="h-4 w-4" />Anahtar için giriş yap</Link>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                {secili && <span className="flex items-center gap-2 text-white/65"><OrtamRozet ortam={secili.ortam} />{secili.ortam === "test" ? "Kredi harcamaz, örnek çıktı döner." : "Gerçek üretim; kredi harcar."}</span>}
                <Link href="/panel/api/anahtarlar" className="inline-flex items-center gap-1 font-medium text-[#8fe6ff] hover:underline">Anahtarları yönet<ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          </Adim>

          <Adim no={2} tamam={kopyalandi} aktif={!!secili && !kopyalandi} baslik={<>{ist.ek[1]} ekle</>}>
            <AnimatePresence mode="wait">
              <motion.div key={istemci} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                <ol className="mb-4 grid gap-2 sm:grid-cols-3">
                  {k.adimlar.map((a, i) => (
                    <li key={a} className="flex gap-2.5 rounded-[14px] bg-white/[0.035] px-3 py-2.5 text-[13px] leading-relaxed text-white/75 ring-1 ring-white/[0.06]">
                      <span className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-[11px] font-semibold text-white">{i + 1}</span>{a}
                    </li>
                  ))}
                </ol>
                <KodEditor kod={k.kod} dil={k.dil} dosyaAdi={k.dosya} gizle={anahtar ?? undefined} satirNo={k.dil === "json"} maxH={320} />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => void kopyala()} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#55d6fd] px-5 text-[14px] font-semibold text-[#06222b] transition hover:brightness-110 active:scale-[0.97]">
                    <AnimatePresence mode="wait" initial={false}>
                      {ipucu ? <motion.span key="ok" initial={{ scale: 0.5 }} animate={{ scale: 1 }}><Check className="h-4 w-4" strokeWidth={3} /></motion.span> : <motion.span key="c" initial={{ scale: 0.5 }} animate={{ scale: 1 }}><Copy className="h-4 w-4" /></motion.span>}
                    </AnimatePresence>
                    {ipucu ? "Kopyalandı" : k.dil === "bash" ? "Komutu kopyala" : "Yapılandırmayı kopyala"}
                  </button>
                  {"tekTik" in k && k.tekTik && (
                    <a href={anahtar ? k.tekTik : undefined} onClick={() => anahtar && setKopyalandi(true)} aria-disabled={!anahtar}
                      className={cn("inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-[0.97]", !anahtar && "pointer-events-none opacity-40")}>
                      <IstemciLogo id={istemci} boyut={16} className={istemci === "cursor" ? "invert" : undefined} />{ist.ek[1]} tek tıkla kur
                    </a>
                  )}
                  <span className="text-[13px] text-white/55">{!anahtar ? "Önce bir anahtar seç; komuta kendiliğinden yerleşir." : "tekTik" in k && k.tekTik ? "Uygulama açılır ve onay ister." : null}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </Adim>

          <Adim no={3} tamam={dogru} aktif={kopyalandi && !dogru} son baslik="Bağlantıyı doğrula" aciklama="İstemcinin yapacağı çağrıları seçili anahtarla şimdi buradan yap; sorun varsa hangi adımda olduğunu gör.">
            <Dogrulama url={url} anahtar={anahtar} onSonuc={setDogru} istemciAd={ist.ek[0]} />
          </Adim>
        </ol>
      </div>
    </section>
  );
}

/* ── Doğrulama ── */

type Adm = { ad: string; yontem: string; durum: "bekliyor" | "calisiyor" | "ok" | "hata"; ms?: number; ozet?: string; ham?: unknown };

function Dogrulama({ url, anahtar, onSonuc, istemciAd }: { url: string; anahtar: string | null; onSonuc: (ok: boolean) => void; istemciAd: string }) {
  const [adimlar, setAdimlar] = useState<Adm[]>([]);
  const [acik, setAcik] = useState<number | null>(null);
  const calisiyor = adimlar.some((a) => a.durum === "calisiyor");

  const baslat = useCallback(async () => {
    const plan: Adm[] = [
      { ad: "El sıkışma", yontem: "initialize", durum: "bekliyor" },
      { ad: "Araçları listele", yontem: "tools/list", durum: "bekliyor" },
      { ad: "Kimlik ve bakiye", yontem: "get_account", durum: "bekliyor" },
    ];
    setAdimlar(plan); setAcik(null); onSonuc(false);
    const guncelle = (i: number, p: Partial<Adm>) => setAdimlar((l) => l.map((a, j) => (j === i ? { ...a, ...p } : a)));
    const cagrilar: [string, Record<string, unknown> | undefined][] = [
      ["initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "vayra-panel", version: "1" } }],
      ["tools/list", undefined],
      ["tools/call", { name: "get_account", arguments: {} }],
    ];
    let hepsi = true;
    for (let i = 0; i < cagrilar.length; i++) {
      guncelle(i, { durum: "calisiyor" });
      const r = await rpc(url, anahtar, cagrilar[i][0], cagrilar[i][1]);
      const res = r.j?.result;
      const hata = !r.j || r.j.error || res?.isError;
      let ozet = r.j?.error?.message ?? (r.http === 0 ? "Sunucuya ulaşılamadı" : "");
      if (!hata) {
        if (i === 0) ozet = `${(res!.serverInfo as { name: string }).name} ${(res!.serverInfo as { version: string }).version} · protokol ${res!.protocolVersion}`;
        if (i === 1) ozet = `${(res!.tools as unknown[]).length} araç görünüyor`;
        if (i === 2) ozet = String(((res!.content as { text: string }[])[0]?.text ?? "").split("\n")[0]);
      } else if (res?.isError) ozet = String(((res.content as { text: string }[])[0]?.text ?? "").split("\n")[0]);
      guncelle(i, { durum: hata ? "hata" : "ok", ms: r.ms, ozet, ham: r.j });
      if (hata) { hepsi = false; for (let j = i + 1; j < cagrilar.length; j++) guncelle(j, { durum: "bekliyor" }); break; }
    }
    onSonuc(hepsi);
  }, [url, anahtar, onSonuc]);

  const bitti = adimlar.length > 0 && !calisiyor;
  const basarili = bitti && adimlar.every((a) => a.durum === "ok");
  const liste: Adm[] = adimlar.length ? adimlar : [
    { ad: "El sıkışma", yontem: "initialize", durum: "bekliyor" },
    { ad: "Araçları listele", yontem: "tools/list", durum: "bekliyor" },
    { ad: "Kimlik ve bakiye", yontem: "get_account", durum: "bekliyor" },
  ];

  return (
    <div className="max-w-[760px] overflow-hidden rounded-[20px] bg-white/[0.03] ring-1 ring-white/[0.08]">
      <ol>
        {liste.map((a, i) => (
          <li key={a.yontem} className={cn(i > 0 && "border-t border-white/[0.06]")}>
            <button onClick={() => a.ham && setAcik(acik === i ? null : i)} disabled={!a.ham} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition enabled:hover:bg-white/[0.025]">
              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={a.durum} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.18 }}>
                    {a.durum === "ok" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : a.durum === "hata" ? <XCircle className="h-5 w-5 text-rose-400" /> : a.durum === "calisiyor" ? <Loader2 className="h-5 w-5 animate-spin text-[#55d6fd]" /> : <CircleDashed className="h-5 w-5 text-white/25" />}
                  </motion.span>
                </AnimatePresence>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-white">{a.ad} <span className="ml-1 font-mono text-[12px] font-normal text-white/50">{a.yontem}</span></p>
                {a.ozet && <p className={cn("mt-0.5 truncate text-[13px]", a.durum === "hata" ? "text-rose-300" : "text-white/65")}>{a.ozet}</p>}
              </div>
              {a.ms !== undefined && <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px] tabular-nums text-white/65">{sureMetin(a.ms)}</span>}
              {a.ham !== undefined && <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/50 transition-transform", acik === i && "rotate-180")} />}
            </button>
            <AnimatePresence initial={false}>
              {acik === i && a.ham !== undefined && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4"><KodEditor kod={JSON.stringify(a.ham, null, 2)} dil="json" dosyaAdi="yanıt" maxH={260} gizle={anahtar ?? undefined} /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ol>
      <div className={cn("flex flex-wrap items-center gap-3 border-t px-4 py-3",
        bitti ? (basarili ? "border-emerald-400/15 bg-emerald-400/[0.05]" : "border-rose-400/15 bg-rose-400/[0.05]") : "border-white/[0.06]")}>
        <p className={cn("min-w-0 flex-1 text-[13.5px]", bitti ? (basarili ? "text-emerald-200" : "text-rose-200") : "text-white/60")}>
          {!anahtar ? "Önce 1. adımda bir anahtar seç." : !adimlar.length ? "El sıkışma, araç listesi ve kimlik sırayla denenir." : calisiyor ? "Deneniyor…" : basarili ? `Her şey yolunda. ${istemciAd} aynı adres ve anahtarla bağlanacak.` : "Bir adım başarısız. Anahtarın iptal edilmemiş ve süresi dolmamış olmalı; ayrıntı için satıra tıkla."}
        </p>
        <button onClick={() => void baslat()} disabled={!anahtar || calisiyor}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97] disabled:opacity-40">
          {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}{adimlar.length ? "Yeniden dene" : "Testi başlat"}
        </button>
      </div>
    </div>
  );
}

/* ── Araçlar: canlı okunan liste + deneme alanı ── */

const ARAC_IKON: Record<string, React.ElementType> = {
  list_models: LayoutGrid, get_model: Info, generate: Sparkles, get_generation: Search, list_generations: History, cancel_generation: Ban, get_account: Wallet,
};

function Araclar({ araclar, url, anahtar, canli }: { araclar: McpArac[] | null; url: string; anahtar: string | null; canli: boolean }) {
  const [secili, setSecili] = useState("generate");
  const arac = araclar?.find((a) => a.name === secili) ?? araclar?.[0];
  const [arg, setArg] = useState("");
  const [sonuc, setSonuc] = useState<{ ms: number; j: Rpc | null } | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  useEffect(() => { if (arac) { setArg(JSON.stringify(ORNEK[arac.name] ?? {}, null, 2)); setSonuc(null); } }, [arac?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  let argHata = "";
  let argNesne: Record<string, unknown> = {};
  try { argNesne = JSON.parse(arg || "{}"); } catch (e) { argHata = (e as Error).message; }

  const calistir = async () => {
    if (!arac || argHata) return;
    setCalisiyor(true); setSonuc(null);
    const r = await rpc(url, anahtar, "tools/call", { name: arac.name, arguments: argNesne });
    setSonuc(r); setCalisiyor(false);
  };

  const res = sonuc?.j?.result as { content?: { text: string }[]; isError?: boolean; structuredContent?: { output?: { urls?: string[]; content_type?: string } } } | undefined;
  const ciktilar = res?.structuredContent?.output?.urls ?? [];
  const ozellikler = useMemo(() => Object.entries((arac?.inputSchema.properties ?? {}) as Record<string, { type?: string; description?: string; enum?: string[]; default?: unknown }>), [arac]);
  const Ikon = arac ? ARAC_IKON[arac.name] ?? Sparkles : Sparkles;

  return (
    <section id="araclar" className="scroll-mt-24">
      <BolumBaslik ust="Araçlar" baslik="Ajanın gördüğü araçlar" aciklama="Liste sunucudan canlı okunur. Birini seç, argümanlarla gerçekten çalıştır; ajanın alacağı yanıtın aynısını gör."
        sag={araclar && <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-2 text-[13px] text-white/75 ring-1 ring-white/[0.08]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{araclar.length} araç · sunucudan okundu</span>} />
      {!araclar ? (
        <div className="iskelet-parca h-[520px] rounded-[30px]" aria-hidden />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[30px] bg-[#0e0e10] ring-1 ring-white/[0.08] lg:grid-cols-[290px_minmax(0,1fr)]">
          <LayoutGroup id="mcp-arac">
            <div role="tablist" aria-label="Araçlar" className="flex gap-1 overflow-x-auto border-b border-white/[0.06] p-3 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
              {araclar.map((a) => {
                const I = ARAC_IKON[a.name] ?? Sparkles;
                const s = a.name === arac?.name;
                return (
                  <button key={a.name} role="tab" aria-selected={s} onClick={() => setSecili(a.name)} className="group relative flex shrink-0 items-center gap-3 rounded-[14px] px-2.5 py-2 text-left transition active:scale-[0.98]">
                    {s && <motion.span layoutId="mcp-arac-z" className="absolute inset-0 rounded-[14px] bg-white/[0.08] ring-1 ring-white/[0.1]" transition={yay} />}
                    <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] transition", s ? "bg-[#55d6fd]/15 text-[#55d6fd]" : "bg-white/[0.06] text-white/70 group-hover:text-white")}><I className="h-4 w-4" /></span>
                    <span className="relative min-w-0">
                      <span className={cn("block text-[14px] font-semibold", s ? "text-white" : "text-white/80")}>{a.title}</span>
                      <span className="block font-mono text-[12px] text-white/50">{a.name}</span>
                    </span>
                    {!a.annotations?.readOnlyHint && <span className="relative ml-auto hidden h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300 lg:block" title="Kredi harcar ya da değişiklik yapar" />}
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          {arac && (
            <AnimatePresence mode="wait">
              <motion.div key={arac.name} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="min-w-0">
                <div className="border-b border-white/[0.06] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#55d6fd]/12 text-[#55d6fd]"><Ikon className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-white">{arac.title}</h3>
                      <p className="font-mono text-[12.5px] text-white/55">{arac.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                      {arac.annotations?.readOnlyHint ? <Rozet renk="yesil">Salt okunur</Rozet> : <Rozet renk="sari">Kredi harcar</Rozet>}
                      {arac.annotations?.destructiveHint && <Rozet renk="kirmizi">Geri alınamaz</Rozet>}
                      {arac.annotations?.idempotentHint && <Rozet>Tekrarlanabilir</Rozet>}
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/72">{arac.description}</p>
                  {ozellikler.length > 0 && (
                    <dl className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-[16px] ring-1 ring-white/[0.07]">
                      {ozellikler.map(([ad, o]) => (
                        <div key={ad} className="grid gap-1 px-4 py-2.5 text-[13px] sm:grid-cols-[170px_minmax(0,1fr)]">
                          <dt className="font-mono text-white">{ad}{arac.inputSchema.required?.includes(ad) && <span className="text-rose-300">*</span>} <span className="text-white/45">{o.type}</span></dt>
                          <dd className="min-w-0 text-white/70">{o.description ?? "Ek açıklama yok."}{o.enum && <span className="mt-0.5 block truncate font-mono text-[12px] text-white/45">{o.enum.slice(0, 8).join(" · ")}{o.enum.length > 8 ? ` · +${o.enum.length - 8}` : ""}</span>}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="arac-arg" className="text-[13.5px] font-medium text-white">Argümanlar</label>
                    <button onClick={() => setArg(JSON.stringify(ORNEK[arac.name] ?? {}, null, 2))} className="text-[12.5px] font-medium text-white/55 transition hover:text-white">Örneğe dön</button>
                  </div>
                  <textarea id="arac-arg" value={arg} onChange={(e) => setArg(e.target.value)} spellCheck={false} rows={Math.min(10, Math.max(3, arg.split("\n").length))}
                    className={cn("mt-2 w-full resize-y rounded-[16px] bg-[#111216] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#c0caf5] outline-none ring-1 transition focus:ring-[#55d6fd]/60", argHata ? "ring-rose-500/50" : "ring-white/[0.08]")} />
                  {argHata && <p className="mt-1.5 text-[12.5px] text-rose-300">JSON hatası: {argHata}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button onClick={() => void calistir()} disabled={!anahtar || !!argHata || calisiyor}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#55d6fd] px-5 text-[14px] font-semibold text-[#06222b] transition hover:brightness-110 active:scale-[0.97] disabled:opacity-40">
                      {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}Çalıştır
                    </button>
                    <span className="text-[13px] text-white/55">
                      {!anahtar ? "Çalıştırmak için kurulumda bir anahtar seç." : !arac.annotations?.readOnlyHint && canli ? "Canlı anahtar: gerçek kredi harcanır." : `tools/call · ${anahtarMaske(anahtar)}`}
                    </span>
                  </div>
                  <AnimatePresence>
                    {sonuc && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 space-y-3">
                        <p className={cn("flex items-center gap-2 text-[13.5px] font-medium", res && !res.isError ? "text-emerald-300" : "text-rose-300")}>
                          {res && !res.isError ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {res && !res.isError ? "Başarılı" : sonuc.j?.error?.message ?? "Araç hata döndürdü"}
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px] font-normal text-white/60">{sureMetin(sonuc.ms)}</span>
                        </p>
                        {ciktilar.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {ciktilar.map((u) => res?.structuredContent?.output?.content_type?.startsWith("image")
                              ? <a key={u} href={u} target="_blank" rel="noreferrer" className="overflow-hidden rounded-[16px] ring-1 ring-white/[0.1]"><img src={u} alt="Üretim çıktısı" className="h-44 object-cover transition duration-500 hover:scale-105" /></a>
                              : <a key={u} href={u} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-white ring-1 ring-white/[0.12] hover:bg-white/[0.06]"><ExternalLink className="h-3.5 w-3.5" />Çıktıyı aç</a>)}
                          </div>
                        )}
                        <KodEditor kod={res?.content?.[0]?.text ?? JSON.stringify(sonuc.j, null, 2)} dil={res?.content ? "duz" : "json"} dosyaAdi="content[0].text" maxH={300} satirNo={false} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </section>
  );
}

function Rozet({ children, renk }: { children: React.ReactNode; renk?: "yesil" | "sari" | "kirmizi" }) {
  const r = renk === "yesil" ? "bg-emerald-400/10 text-emerald-300" : renk === "sari" ? "bg-amber-400/10 text-amber-200" : renk === "kirmizi" ? "bg-rose-400/10 text-rose-300" : "bg-white/[0.06] text-white/70";
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-medium", r)}>{children}</span>;
}

/* ── CLI ve beceri ── */

const KOMUTLAR: [string, string][] = [
  ["login <anahtar>", "Anahtarı doğrular ve ~/.vayra/config.json'a kaydeder"],
  ["account", "Bakiye, bu ay harcanan, hız sınırı"],
  ["models --type video", "Modelleri tür ve kredi bedeliyle listeler"],
  ["model <id>", "Modelin girdi şeması"],
  ['generate <model> "<prompt>" -p aspect_ratio=16:9 --out ./ciktilar', "Üretir, bitmesini bekler, çıktıyı indirir"],
  ["status <id> --out ./ciktilar", "Üretimin durumu; bittiyse indir"],
  ["list --limit 20 --status succeeded", "Son 24 saatteki üretimler"],
  ["cancel <id>", "Üretimi iptal eder, kredi iade edilir"],
  ["mcp", "MCP istemci yapılandırmasını yazdırır"],
];

function Cli({ kok, anahtar }: { kok: string; anahtar: string | null }) {
  const [sekme, setSekme] = useState<"cli" | "beceri">("cli");
  const kur = `curl -fsSL ${kok}/cli/vayra.mjs -o vayra.mjs\nnode vayra.mjs login ${anahtar ?? "vy_live_ANAHTARIN"}\nnode vayra.mjs generate nano-banana-pro "sisli bir orman, sinematik" --out ./ciktilar`;
  const beceri = `mkdir -p ~/.claude/skills/vayra\ncurl -fsSL ${kok}/cli/SKILL.md -o ~/.claude/skills/vayra/SKILL.md`;
  const ikincil = "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]";
  return (
    <section id="cli" className="scroll-mt-24">
      <BolumBaslik ust="MCP olmayan yerler için" baslik="CLI ve Claude becerisi" aciklama="Betikler ve CI için bağımlılıksız tek dosya (Node 18+). Beceri, Claude'a Vayra'yı ne zaman ve nasıl kullanacağını öğretir."
        sag={
          <LayoutGroup id="mcp-cli">
            <div role="tablist" className="flex rounded-full bg-white/[0.05] p-1 ring-1 ring-white/[0.08]">
              {([["cli", "CLI", Terminal], ["beceri", "Beceri", FileText]] as const).map(([id, ad, I]) => (
                <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)} className="relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium">
                  {sekme === id && <motion.span layoutId="mcp-cli-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <I className={cn("relative h-3.5 w-3.5", sekme === id ? "text-black" : "text-white/65")} /><span className={cn("relative", sekme === id ? "text-black" : "text-white/75")}>{ad}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        } />
      <AnimatePresence mode="wait">
        <motion.div key={sekme} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          {sekme === "cli" ? (
            <>
              <div className="space-y-3">
                <KodEditor kod={kur} dil="bash" dosyaAdi="terminal" gizle={anahtar ?? undefined} satirNo={false} />
                <div className="flex flex-wrap gap-2">
                  <a href="/cli/vayra.mjs?indir" className={ikincil}><Download className="h-3.5 w-3.5" />vayra.mjs indir</a>
                  <a href="/cli/vayra.mjs" target="_blank" rel="noreferrer" className={ikincil}><Code2 className="h-3.5 w-3.5" />Kaynağı gör</a>
                </div>
                <p className="text-[13px] leading-relaxed text-white/60">Anahtar ~/.vayra/config.json dosyasına yalnız senin okuyabileceğin izinle yazılır. Ortam değişkeni de olur: <code className="font-mono text-white/80">VAYRA_API_KEY</code>.</p>
              </div>
              <div className="overflow-hidden rounded-[22px] bg-[#0e0e10] ring-1 ring-white/[0.08]">
                {KOMUTLAR.map(([k, a], i) => (
                  <div key={k} className={cn("group flex items-start gap-3 px-4 py-2.5 transition hover:bg-white/[0.025]", i > 0 && "border-t border-white/[0.05]")}>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-mono text-[12.5px] text-white"><span className="text-white/45">vayra </span>{k}</p>
                      <p className="text-[12.5px] text-white/55">{a}</p>
                    </div>
                    <KopyalaDugme metin={`node vayra.mjs ${k}`} etiket="" sessiz className="opacity-60 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <KodEditor kod={beceri} dil="bash" dosyaAdi="terminal" satirNo={false} />
                <div className="flex flex-wrap gap-2">
                  <a href="/cli/SKILL.md?indir" className={ikincil}><Download className="h-3.5 w-3.5" />SKILL.md indir</a>
                  <a href="/cli/SKILL.md" target="_blank" rel="noreferrer" className={ikincil}><FileText className="h-3.5 w-3.5" />İçeriği gör</a>
                </div>
              </div>
              <div className="rounded-[22px] bg-[#0e0e10] p-5 ring-1 ring-white/[0.08]">
                <p className="flex items-center gap-2 text-[15px] font-semibold text-white"><img src="/marka/renkli/claude-color.svg" alt="" className="h-4 w-4" />Beceri ne yapar?</p>
                <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-white/72">
                  {["Görsel, video, ses ya da 3D istendiğinde devreye girer.", "Önce model seçer ve girdi şemasını okur; sonra üretir.", "Pahalı video modellerinden önce kredi bedelini söyler.", "Hata kodlarına göre davranır: bakiye, içerik politikası, hız sınırı.", "MCP bağlıysa araçları, değilse CLI'yi kullanır."].map((m) => (
                    <li key={m} className="flex gap-2.5"><span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/15"><Check className="h-2.5 w-2.5 text-[#55d6fd]" strokeWidth={3} /></span>{m}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ── Bedel ve güvenlik ── */

function Guvenlik() {
  const maddeler = [
    { b: "Önce bedel, sonra üretim", a: "Her araç sonucu kredi bedelini yazar; beceri pahalı modellerden önce onay ister. Test anahtarı kredi harcamaz.", ikon: Wallet, href: "/panel/kredi", l: "Kredi ve planlar" },
    { b: "Kapsamlı anahtarlar", a: "Ajana yalnız üretim ya da salt okunur yetkili anahtar ver; aylık harcama tavanı koy, istediğin an iptal et.", ikon: KeyRound, href: "/panel/api/anahtarlar", l: "Anahtarlar" },
    { b: "Aynı sınırlar", a: "Hız sınırı, harcama tavanı ve içerik denetimi REST API ile birebir aynı uygulanır.", ikon: ShieldCheck, href: "/panel/api/hiz-limitleri", l: "Hız ve harcama sınırları" },
    { b: "Her çağrı kayıtlı", a: "Ajanın başlattığı her üretim İstekler ve Kullanım sayfalarında görünür; webhook'ların da tetiklenir.", ikon: History, href: "/panel/api/istekler", l: "İstek günlüğü" },
  ];
  return (
    <section>
      <BolumBaslik ust="Bedel ve güvenlik" baslik="Kontrol hep sende" aciklama="Ajan yalnız senin verdiğin anahtarla, senin sınırların içinde üretir." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {maddeler.map((m, i) => (
          <motion.div key={m.b} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <Link href={m.href} className="group flex h-full flex-col rounded-[24px] bg-[#0e0e10] p-5 ring-1 ring-white/[0.08] transition hover:bg-white/[0.03] hover:ring-white/[0.14]">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/12 text-[#55d6fd] transition group-hover:scale-105"><m.ikon className="h-5 w-5" /></span>
              <p className="mt-4 text-[15.5px] font-semibold text-white">{m.b}</p>
              <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-white/68">{m.a}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-white/80 transition group-hover:text-white">{m.l}<ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
