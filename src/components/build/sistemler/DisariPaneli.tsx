"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Braces, Check, Copy, Eye, EyeOff, Info, KeyRound, Loader2, Plug, RefreshCw, Rocket } from "lucide-react";
import { Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi } from "@/lib/build/istemci";
import type { GirdiAlani } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { GirdiAlanlariDuzenleyici } from "./GirdiAlanlari";
import { YanPanel, useKopya, type SistemAcik } from "./ortak";

type Durum = { disari: { api: boolean; mcp: boolean; anahtar: string | null; aracAdi: string; aracAciklama: string; olusturma: number } | null; arac: { name: string; description: string; inputSchema: Record<string, unknown> }; girdi: GirdiAlani[]; yayin: number | null };
type Istemci = "claude" | "cursor" | "chatgpt";
const ISTEMCI: Record<Istemci, { ad: string; logo: string }> = {
  claude: { ad: "Claude", logo: "/marka/renkli/claude-color.svg" },
  cursor: { ad: "Cursor", logo: "/marka/renkli/cursor-beyaz.svg" },
  chatgpt: { ad: "ChatGPT", logo: "/marka/renkli/openai.svg" },
};

function KodBlok({ metin, ad, kopya, kopyala }: { metin: string; ad: string; kopya: string; kopyala: (v: string, ad: string) => void }) {
  return (
    <div className="relative">
      <pre className="sc-kod max-h-[220px] overflow-auto whitespace-pre-wrap break-all rounded-[14px] bg-[#0c0d0f] p-3 pr-11 text-[11.5px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{metin}</pre>
      <button type="button" onClick={() => kopyala(metin, ad)} aria-label="Kopyala" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-white/80 hover:bg-white/[0.14]">{kopya === ad ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
    </div>
  );
}

/** Sistemi API uç noktası ve MCP aracı olarak dışarı aç: adresler, anahtar, şema ve istemci kurulum metinleri. */
export function DisariPaneli({ acik, kapat, s, setGirdi, yayinla }: { acik: boolean; kapat: () => void; s: SistemAcik; setGirdi: (l: GirdiAlani[]) => void; yayinla: () => void }) {
  const [v, setV] = useState<Durum | null>(null);
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [goster, setGoster] = useState(false);
  const [yenileOnay, setYenileOnay] = useState(false);
  const [istemci, setIstemci] = useState<Istemci>("claude");
  const [arac, setArac] = useState({ ad: "", aciklama: "" });
  const { kopya, kopyala } = useKopya();
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yukle = () => api<Durum>(`/api/build/sistemler/${s.id}/disari`).then((x) => { setV(x); setArac({ ad: x.disari?.aracAdi ?? x.arac.name, aciklama: x.disari?.aracAciklama ?? x.arac.description }); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi."));
  useEffect(() => { if (acik) { setHata(""); setYenileOnay(false); setGoster(false); yukle(); } }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps

  const gonder = async (g: Record<string, unknown>, ad?: string) => {
    setGidiyor(ad ?? "kaydet"); setHata("");
    try { const x = await api<Durum & { sistem: SistemAcik }>(`/api/build/sistemler/${s.id}/disari`, { govde: g }); setV(x); if (g.girdi) setGirdi(x.girdi); return x; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); return null; }
    finally { setGidiyor(null); }
  };
  const gecikmeli = (g: Record<string, unknown>) => { if (zaman.current) clearTimeout(zaman.current); zaman.current = setTimeout(() => { gonder(g); }, 700); };

  const koken = typeof location !== "undefined" ? location.origin : "";
  const anahtar = v?.disari?.anahtar ?? "";
  const gizli = (u: string) => (goster || !anahtar ? u : u.replace(anahtar, `vs_••••${anahtar.slice(-4)}`));
  const apiAdres = anahtar ? `${koken}/api/build/sistemler/api/${anahtar}` : "";
  const mcpAdres = anahtar ? `${koken}/api/build/sistemler/mcp/${anahtar}` : "";
  const ornekGovde = JSON.stringify(Object.fromEntries((v?.girdi ?? []).map((a) => [a.ad, a.tur === "sayi" ? 1 : a.tur === "evet-hayir" ? true : a.secenekler?.[0] ?? a.varsayilan ?? (a.etiket || a.ad)])), null, 2);
  const sunucuAdi = `vayra-${arac.ad || "sistem"}`;
  const kurulum: Record<Istemci, { adimlar: string[]; kod: string }> = {
    claude: { adimlar: ["Claude masaüstünde Ayarlar, Geliştirici, Yapılandırmayı düzenle yolunu aç.", "Aşağıdaki bloğu claude_desktop_config.json dosyasına ekle ve Claude'u yeniden başlat.", "claude.ai'de ise Ayarlar, Bağlayıcılar, Özel bağlayıcı ekle kısmına MCP adresini yapıştır."], kod: JSON.stringify({ mcpServers: { [sunucuAdi]: { command: "npx", args: ["-y", "mcp-remote", mcpAdres] } } }, null, 2) },
    cursor: { adimlar: ["Cursor'da Ayarlar, MCP ve Araçlar, Yeni MCP sunucusu ekle yolunu aç.", "Aşağıdaki bloğu proje içindeki .cursor/mcp.json ya da kullanıcı klasöründeki .cursor/mcp.json dosyasına ekle.", "Araç listede yeşil görününce sohbette adıyla çağır."], kod: JSON.stringify({ mcpServers: { [sunucuAdi]: { url: mcpAdres } } }, null, 2) },
    chatgpt: { adimlar: ["ChatGPT'de Ayarlar, Uygulamalar ve bağlayıcılar, Gelişmiş ayarlar kısmından Geliştirici modunu aç.", "Bağlayıcı oluştur: ad olarak sistem adını, MCP sunucu adresi olarak aşağıdaki adresi yaz, kimlik doğrulamayı Yok seç.", "Sohbette Geliştirici modu menüsünden bağlayıcıyı seç."], kod: mcpAdres },
  };
  const yerel = /localhost|127\.0\.0\.1/.test(koken);
  const d = v?.disari;

  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Dışarı aç" alt="Sistemi anahtarlı bir API uç noktası ve MCP aracı olarak yayınla" genislik={560}>
      {!v ? <div className="space-y-3"><div className="h-28 animate-pulse rounded-[18px] bg-white/[0.03]" /><div className="h-40 animate-pulse rounded-[18px] bg-white/[0.03]" />{hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}</div> : (
        <div className="space-y-4">
          {!v.yayin && (
            <div className="flex items-start gap-2.5 rounded-[16px] bg-amber-400/[0.06] p-3.5 text-[12.5px] leading-relaxed text-amber-100 ring-1 ring-inset ring-amber-300/15">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">API ve MCP yayındaki sürümü çalıştırır; bu sistem henüz yayınlanmadı. Yayınlayınca çağrılar çalışır.</span>
              <button type="button" onClick={yayinla} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><Rocket className="h-3.5 w-3.5" />Yayınla</button>
            </div>
          )}
          <section className="space-y-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
            <div><p className="text-[14px] font-semibold text-white">Girdi alanları</p><p className="mt-0.5 text-[12px] leading-relaxed text-white/50">API gövdesinin ve MCP aracının şeması. Sistemi çağır adımı ve girdi formu da bu alanları kullanır; değerler {"{{"}tetik.alan{"}}"} olarak gelir.</p></div>
            <GirdiAlanlariDuzenleyici l={v.girdi} set={(l) => { setV({ ...v, girdi: l }); setGirdi(l); gecikmeli({ girdi: l }); }} />
            {!v.girdi.length && <p className="text-[12px] text-white/45">Alan eklemezsen her JSON nesnesi kabul edilir.</p>}
          </section>

          <section className="space-y-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><Braces className="h-[18px] w-[18px]" /></span>
              <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">API uç noktası</p><p className="text-[12px] text-white/50">POST ile çağır; yanıt son adımın çıktısıdır</p></div>
              <Anahtar acik={!!d?.api} etiket="API açık" set={(x) => gonder({ api: x }, "api")} />
            </div>
            {d?.api && anahtar && (<>
              <div className="flex items-center gap-2"><span className="sc-kod min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 text-[11.5px] text-white/80">{gizli(apiAdres)}</span><button type="button" onClick={() => kopyala(apiAdres, "api")} aria-label="API adresini kopyala" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80">{kopya === "api" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button></div>
              <KodBlok ad="curl" kopya={kopya} kopyala={kopyala} metin={`curl -X POST "${gizli(apiAdres)}" \\\n  -H "Content-Type: application/json" \\\n  -d '${ornekGovde.replace(/\n\s*/g, " ")}'`} />
              <p className="text-[11.5px] leading-relaxed text-white/45">60 saniyede bitmeyen ya da beklemeye geçen çalışmada 202 ve çalışma kimliği döner; sonucu aynı adrese GET isteğinde calisma parametresiyle sor. Dakikada en çok 60 çağrı.</p>
            </>)}
          </section>

          <section className="space-y-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Plug className="h-[18px] w-[18px]" /></span>
              <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">MCP aracı</p><p className="text-[12px] text-white/50">Claude, Cursor ve ChatGPT bu sistemi araç olarak çağırır</p></div>
              <Anahtar acik={!!d?.mcp} etiket="MCP açık" set={(x) => gonder({ mcp: x }, "mcp")} />
            </div>
            {d?.mcp && anahtar && (<>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block min-w-0"><span className="mb-1 block text-[11.5px] text-white/50">Araç adı</span><input value={arac.ad} onChange={(e) => { const a = e.target.value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64); setArac({ ...arac, ad: a }); gecikmeli({ aracAdi: a }); }} className={cn(alanSinif, "sc-kod h-10 text-[13px]")} /></label>
                <div className="block min-w-0"><span className="mb-1 block text-[11.5px] text-white/50">MCP adresi</span><div className="flex items-center gap-2"><span className="sc-kod min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2.5 text-[11.5px] text-white/80">{gizli(mcpAdres)}</span><button type="button" onClick={() => kopyala(mcpAdres, "mcp")} aria-label="MCP adresini kopyala" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80">{kopya === "mcp" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button></div></div>
              </div>
              <label className="block"><span className="mb-1 block text-[11.5px] text-white/50">Araç açıklaması (yapay zekâ aracı ne zaman çağıracağını buradan anlar)</span><textarea value={arac.aciklama} onChange={(e) => { setArac({ ...arac, aciklama: e.target.value.slice(0, 1000) }); gecikmeli({ aracAciklama: e.target.value.slice(0, 1000) }); }} rows={2} className={cn(alanSinif, "cam-istemci resize-y py-2.5 text-[13px]")} /></label>
              <div className="flex gap-1.5">
                {(Object.keys(ISTEMCI) as Istemci[]).map((k) => (
                  <button key={k} type="button" onClick={() => setIstemci(k)} className={cn("flex h-10 flex-1 items-center justify-center gap-2 rounded-[12px] text-[13px] font-medium transition", istemci === k ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.03] text-white/65 ring-1 ring-inset ring-white/[0.07] hover:text-white")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ISTEMCI[k].logo} alt="" className="h-4 w-4" />{ISTEMCI[k].ad}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={istemci} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-2">
                  <ol className="space-y-1.5">{kurulum[istemci].adimlar.map((x, i) => <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-white/75"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[10.5px] tabular-nums text-white/60">{i + 1}</span>{x}</li>)}</ol>
                  <KodBlok ad={`kur-${istemci}`} kopya={kopya} kopyala={kopyala} metin={goster ? kurulum[istemci].kod : gizli(kurulum[istemci].kod)} />
                </motion.div>
              </AnimatePresence>
              <details className="group rounded-[14px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.06]">
                <summary className="cursor-pointer list-none px-3.5 py-2.5 text-[12.5px] font-medium text-white/70 hover:text-white">Aracın şeması</summary>
                <pre className="sc-kod max-h-[220px] overflow-auto px-3.5 pb-3 text-[11.5px] text-white/70">{JSON.stringify({ name: arac.ad, description: arac.aciklama, inputSchema: v.arac.inputSchema }, null, 2)}</pre>
              </details>
            </>)}
          </section>

          {(d?.api || d?.mcp) && anahtar && (
            <section className="space-y-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-white"><KeyRound className="h-4 w-4 text-amber-200/80" />Anahtar</p>
              <div className="flex items-center gap-2">
                <span className="sc-kod min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 text-[12px] text-white/85">{goster ? anahtar : `vs_••••••••••••${anahtar.slice(-4)}`}</span>
                <button type="button" onClick={() => setGoster(!goster)} aria-label={goster ? "Gizle" : "Göster"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80">{goster ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                <button type="button" onClick={() => kopyala(anahtar, "anahtar")} aria-label="Anahtarı kopyala" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/80">{kopya === "anahtar" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
              </div>
              <p className="text-[12px] leading-relaxed text-white/50">Anahtar adresin içindedir; adresi bilen herkes sistemi çalıştırabilir. Anahtar şifreli saklanır. Sızdığını düşünürsen yenile; eski adresler hemen çalışmaz.</p>
              <button type="button" onClick={async () => { if (!yenileOnay) { setYenileOnay(true); return; } setYenileOnay(false); await gonder({ yenile: true }, "yenile"); }} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium", yenileOnay ? "bg-rose-500/[0.14] text-rose-200" : "bg-white/[0.07] text-white/85 hover:bg-white/[0.12]")}>{gidiyor === "yenile" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{yenileOnay ? "Eski adresler çalışmayacak, onayla" : "Anahtarı yenile"}</button>
            </section>
          )}
          {yerel && (d?.api || d?.mcp) && <p className="flex items-start gap-2 rounded-[14px] bg-white/[0.03] px-3.5 py-3 text-[12px] leading-relaxed text-white/55 ring-1 ring-inset ring-white/[0.06]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Bu sunucu yerel adreste çalışıyor ({koken}). Claude masaüstü ve Cursor aynı bilgisayardan bağlanır; claude.ai ve ChatGPT ise yalnız internetten erişilebilen https adreslerine bağlanır.</p>}
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
          {gidiyor === "kaydet" && <p className="flex items-center gap-1.5 text-[12px] text-white/45"><Loader2 className="h-3 w-3 animate-spin" />Kaydediliyor</p>}
        </div>
      )}
    </YanPanel>
  );
}
