"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Maximize2, Minimize2, RotateCw, X } from "lucide-react";
import { Logo } from "@/components/build/baglantilar/ortak";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { cn } from "@/lib/utils";
import type { UygulamaSonucu } from "./tipler";

/**
 * MCP Apps görünümü (Claude ve ChatGPT'deki gibi): arayüzlü bir bağlantı aracının ui:// kaynağı kum havuzlu
 * çerçevede (sandbox="allow-scripts allow-forms", ayrı köken) canlı çizilir. Başa sıkı bir CSP eklenir; kaynak
 * _meta.ui.csp ile adres bildirdiyse yalnız onlara izin verilir, yoksa dış bağlantı yok.
 * Çerçeveyle postMessage üzerinden JSON-RPC 2.0 (protokol 2026-01-26):
 *  ui/initialize → ui/notifications/initialized → tool-input → tool-result (ya da tool-cancelled),
 *  size-changed (yükseklik), ui/open-link, ui/message (sohbete kullanıcı mesajı), tools/call ve resources/read
 *  (sunucuya vekil, izin kuralıyla), ui/request-display-mode (tam ekran sağ panelde), ui/resource-teardown.
 * Çerçeve React dışında tutulur: tam ekrana geçerken taşınır (moveBefore destekleniyorsa durum korunur).
 */
const PROTOKOL = "2026-01-26";
/** Satır içi yükseklik üst sınırı; üstündeki içerik çerçevenin içinde kayar. */
const SATIR_UST = 880;
const VARSAYILAN_Y = 220;
const ALAN = /^(https?|wss?):\/\/(\*\.)?[A-Za-z0-9.-]{1,253}(:\d{1,5})?$/;
type Csp = { connectDomains?: string[]; resourceDomains?: string[]; frameDomains?: string[]; baseUriDomains?: string[] };
type Kaynak = { html: string; csp?: Csp; izinler?: { clipboardWrite?: boolean }; kenarlik?: boolean };
type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown>; result?: unknown; error?: { code: number; message: string } };
/** ui/message geri çağrısı: false dönerse mesaj gönderilemedi (sohbet meşgul). */
export type UygulamaGonder = (metin: string) => boolean | void;
type Kopru = { sok: () => Promise<void>; baglamGonder: (mod: "inline" | "fullscreen") => void; beklenenYukleme: () => void };

/** Sahip anahtarı yalnız tarayıcıda zaten varsa gönderilir (ziyaretçiye yeni anahtar üretilmez). */
function sahipBasligi(): Record<string, string> {
  try { const a = localStorage.getItem("vayra-build-sahip"); return a && /^[A-Za-z0-9_-]{24,80}$/.test(a) ? { "x-build-sahip": a } : {}; } catch { return {}; }
}
const alanlar = (l?: string[]) => (l ?? []).filter((x) => ALAN.test(x)).join(" ");
/** Görünümün CSP'si: bildirilmeyen hiçbir dış adrese bağlanılamaz, form gönderilemez, base değiştirilemez. */
export function cspKur(c?: Csp): string {
  const r = alanlar(c?.resourceDomains), con = alanlar(c?.connectDomains), fr = alanlar(c?.frameDomains), base = alanlar(c?.baseUriDomains);
  return [
    "default-src 'none'", `script-src 'unsafe-inline' ${r}`, `style-src 'unsafe-inline' ${r}`, `img-src data: blob: ${r}`, `font-src data: ${r}`, `media-src data: blob: ${r}`,
    `connect-src ${con || "'none'"}`, `frame-src ${fr || "'none'"}`, `base-uri ${base || "'none'"}`, "form-action 'none'", "object-src 'none'",
  ].map((x) => x.trim()).join("; ");
}
/** CSP meta etiketi belgenin en başına konur (yorum ya da sahte head ile atlatılamaz); belge standart kipte kalır. */
export const belgeKur = (k: Kaynak) => `<!DOCTYPE html><meta http-equiv="Content-Security-Policy" content="${cspKur(k.csp)}"><meta name="color-scheme" content="dark"><style>html{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}</style>${k.html}`;

/** Ana uygulamanın tema değişkenleri (koyu, nötr; gölge yok). */
function stilDegiskenleri(): Record<string, string> {
  // Sitenin yazı tipi dosyaları çerçeveye yüklenmez (CSP); sistem yazı tipleri kullanılır.
  const yazi = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const bg = { primary: "#121315", secondary: "#1a1b1e", tertiary: "#232427", inverse: "#f4f4f5", ghost: "rgba(255,255,255,0.04)", info: "rgba(85,214,253,0.12)", danger: "rgba(244,63,94,0.12)", success: "rgba(52,211,153,0.12)", warning: "rgba(251,191,36,0.12)", disabled: "rgba(255,255,255,0.03)" };
  const tx = { primary: "#ffffff", secondary: "rgba(255,255,255,0.7)", tertiary: "rgba(255,255,255,0.5)", inverse: "#0b0b0c", ghost: "rgba(255,255,255,0.36)", info: "#8be6ff", danger: "#fda4af", success: "#6ee7b7", warning: "#fcd34d", disabled: "rgba(255,255,255,0.3)" };
  const br = { primary: "rgba(255,255,255,0.16)", secondary: "rgba(255,255,255,0.1)", tertiary: "rgba(255,255,255,0.06)", inverse: "rgba(0,0,0,0.12)", ghost: "rgba(255,255,255,0.04)", info: "rgba(85,214,253,0.35)", danger: "rgba(244,63,94,0.35)", success: "rgba(52,211,153,0.35)", warning: "rgba(251,191,36,0.35)", disabled: "rgba(255,255,255,0.05)" };
  const ring = { primary: "#ffffff", secondary: "rgba(255,255,255,0.5)", inverse: "#0b0b0c", info: "#55d6fd", danger: "#fb7185", success: "#34d399", warning: "#fbbf24" };
  const v: Record<string, string> = {};
  for (const [k, x] of Object.entries(bg)) v[`--color-background-${k}`] = x;
  for (const [k, x] of Object.entries(tx)) v[`--color-text-${k}`] = x;
  for (const [k, x] of Object.entries(br)) v[`--color-border-${k}`] = x;
  for (const [k, x] of Object.entries(ring)) v[`--color-ring-${k}`] = x;
  const metin = { xs: ["12px", "1.4"], sm: ["13px", "1.45"], md: ["14px", "1.5"], lg: ["16px", "1.5"] };
  const baslik = { xs: ["14px", "1.3"], sm: ["16px", "1.3"], md: ["18px", "1.25"], lg: ["20px", "1.25"], xl: ["24px", "1.2"], "2xl": ["28px", "1.15"], "3xl": ["34px", "1.1"] };
  for (const [k, [b, s]] of Object.entries(metin)) { v[`--font-text-${k}-size`] = b; v[`--font-text-${k}-line-height`] = s; }
  for (const [k, [b, s]] of Object.entries(baslik)) { v[`--font-heading-${k}-size`] = b; v[`--font-heading-${k}-line-height`] = s; }
  Object.assign(v, {
    "--font-sans": yazi, "--font-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    "--font-weight-normal": "400", "--font-weight-medium": "500", "--font-weight-semibold": "600", "--font-weight-bold": "700",
    "--border-radius-xs": "6px", "--border-radius-sm": "10px", "--border-radius-md": "14px", "--border-radius-lg": "18px", "--border-radius-xl": "22px", "--border-radius-full": "9999px",
    "--border-width-regular": "1px", "--shadow-hairline": "inset 0 0 0 1px rgba(255,255,255,0.08)", "--shadow-sm": "none", "--shadow-md": "none", "--shadow-lg": "none",
  });
  return v;
}
const sonucMetni = (s: UygulamaSonucu) => (s.sonuc?.content ?? []).flatMap((c) => { const x = c as { type?: string; text?: string }; return x.type === "text" && x.text ? [x.text] : []; }).join("\n\n").trim();
/** Çerçeveyi yeni yerine taşır; moveBefore varsa çerçevenin durumu korunur, yoksa yeniden yüklenir (el sıkışma tekrarlanır). */
function tasi(f: HTMLIFrameElement | null, hedef: HTMLElement | null, kopru: Kopru | null) {
  if (!f || !hedef || f.parentElement === hedef) return;
  const mb = (hedef as HTMLElement & { moveBefore?: (n: Node, r: Node | null) => void }).moveBefore;
  if (typeof mb === "function" && f.isConnected && hedef.isConnected) { try { mb.call(hedef, f, null); return; } catch { /* aşağıda */ } }
  kopru?.beklenenYukleme();
  hedef.appendChild(f);
}

export function McpUygulama({ s, parcaId, gonder, ziyaretci }: { s: UygulamaSonucu; parcaId: string; gonder?: UygulamaGonder; ziyaretci?: boolean }) {
  const [kaynak, setKaynak] = useState<Kaynak | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  /** Yeniden yüklemenin işe yaramayacağı hata (yetki yok, süresi doldu). */
  const [kalici, setKalici] = useState(false);
  const [hazir, setHazir] = useState(false);
  const [yukseklik, setYukseklik] = useState<number | null>(null);
  const [tam, setTam] = useState(false);
  const [yukleme, setYukleme] = useState(0);
  const [dom, setDom] = useState(false);
  const [metinAcik, setMetinAcik] = useState(false);
  const kartYeri = useRef<HTMLDivElement>(null);
  const tamYeri = useRef<HTMLDivElement | null>(null);
  const cerceve = useRef<HTMLIFrameElement | null>(null);
  const kopru = useRef<Kopru | null>(null);
  const son = useRef({ s, gonder, ziyaretci, tam, parcaId });
  son.current = { s, gonder, ziyaretci, tam, parcaId };
  const panel = useKenarStili("mcp-uygulama", 760, 420, 1280);
  const baslik = s.baslik || s.arac;
  useEffect(() => setDom(true), []);

  const buyut = useCallback(() => setTam(true), []);
  const kucult = useCallback(() => {
    tasi(cerceve.current, kartYeri.current, kopru.current);
    setTam(false);
    requestAnimationFrame(() => kopru.current?.baglamGonder("inline"));
  }, []);
  const eylem = useRef({ buyut, kucult });
  eylem.current = { buyut, kucult };
  const tamYeriRef = useCallback((el: HTMLDivElement | null) => {
    tamYeri.current = el;
    if (!el) return;
    tasi(cerceve.current, el, kopru.current);
    requestAnimationFrame(() => kopru.current?.baglamGonder("fullscreen"));
  }, []);

  // Görünüm kaynağı: sahip başlığıyla ya da (ajan sayfasında) parçadaki belirteçle.
  useEffect(() => {
    let iptal = false;
    setKaynak(null); setHata(null); setKalici(false); setHazir(false);
    const q = new URLSearchParams({ uri: s.resourceUri, ...(s.belirtec ? { b: s.belirtec } : {}), ...(s.ajanId && !ziyaretci ? { ajan: s.ajanId } : {}), ...(yukleme ? { taze: "1" } : {}) });
    fetch(`/api/build/baglantilar/${encodeURIComponent(s.baglantiId)}/ui?${q}`, { headers: ziyaretci ? {} : sahipBasligi(), cache: "no-store" })
      .then(async (r) => { const v = await r.json().catch(() => ({})); if (!r.ok || !v.ok) { if (!iptal && (r.status === 403 || r.status === 410)) setKalici(true); throw new Error(v.hata ?? `Görünüm açılamadı (${r.status}).`); } return v as Kaynak; })
      .then((v) => { if (!iptal) setKaynak(v); })
      .catch((e: Error) => { if (!iptal) setHata(e.message || "Görünüm açılamadı."); });
    return () => { iptal = true; };
  }, [s.baglantiId, s.resourceUri, s.belirtec, s.ajanId, ziyaretci, yukleme]);

  // Çerçeve ve JSON-RPC köprüsü (çerçeve React dışında; kaynak değişince yeniden kurulur).
  useEffect(() => {
    if (!kaynak) return;
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", "allow-scripts allow-forms");
    f.setAttribute("referrerpolicy", "no-referrer");
    f.setAttribute("title", son.current.s.baslik || son.current.s.arac);
    if (kaynak.izinler?.clipboardWrite) f.setAttribute("allow", "clipboard-write");
    f.className = "block h-full w-full border-0 bg-transparent";
    f.srcdoc = belgeKur(kaynak);
    cerceve.current = f;
    let ilkYukleme = true, beklenen = false, baslatildi = false, sokuldu = false, sayac = 0;
    let gecik: ReturnType<typeof setTimeout> | undefined;
    const bekleyenler = new Map<number, () => void>();
    const yolla = (o: Rpc) => { try { f.contentWindow?.postMessage({ jsonrpc: "2.0", ...o }, "*"); } catch { /* çerçeve gitti */ } };
    const yanit = (id: Rpc["id"], result: unknown) => yolla({ id, result });
    const hataYanit = (id: Rpc["id"], code: number, message: string) => yolla({ id, error: { code, message } });
    const baglam = (mod: "inline" | "fullscreen") => {
      const yer = (mod === "fullscreen" ? tamYeri.current : kartYeri.current) ?? f.parentElement;
      const w = Math.round(yer?.clientWidth || f.clientWidth || 600);
      const x = son.current.s;
      return {
        toolInfo: { id: son.current.parcaId, tool: { name: x.arac, ...(x.baslik ? { title: x.baslik } : {}), inputSchema: { type: "object" } } },
        theme: "dark", styles: { variables: stilDegiskenleri() },
        displayMode: mod, availableDisplayModes: ["inline", "fullscreen"],
        containerDimensions: mod === "fullscreen" ? { height: Math.round(yer?.clientHeight || innerHeight), width: w } : { maxHeight: SATIR_UST, width: w },
        locale: "tr-TR", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, userAgent: "Vayra/1.0", platform: matchMedia("(pointer: coarse)").matches ? "mobile" : "web",
        deviceCapabilities: { touch: navigator.maxTouchPoints > 0, hover: matchMedia("(hover: hover)").matches }, safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      };
    };
    const veriGonder = () => {
      const x = son.current.s;
      yolla({ method: "ui/notifications/tool-input", params: { arguments: x.girdi ?? {} } });
      if (x.iptal) yolla({ method: "ui/notifications/tool-cancelled", params: { reason: x.iptal } });
      else if (x.sonuc) yolla({ method: "ui/notifications/tool-result", params: x.sonuc as Record<string, unknown> });
    };
    const vekil = async (yontem: string, params: unknown) => {
      const x = son.current.s;
      const r = await fetch(`/api/build/baglantilar/${encodeURIComponent(x.baglantiId)}/ui`, {
        method: "POST", headers: { "Content-Type": "application/json", ...(son.current.ziyaretci ? {} : sahipBasligi()) },
        body: JSON.stringify({ yontem, params, ...(x.belirtec ? { belirtec: x.belirtec } : {}), ...(x.ajanId && !son.current.ziyaretci ? { ajanId: x.ajanId } : {}) }),
      });
      const v = await r.json().catch(() => ({}));
      if (!r.ok || !v.ok) throw new Error(v.hata ?? `İstek başarısız (${r.status}).`);
      return v.sonuc;
    };
    const istek = async (m: Rpc) => {
      const id = m.id, p = m.params ?? {};
      switch (m.method) {
        case "ui/initialize": {
          baslatildi = false;
          const g = !!son.current.gonder;
          return yanit(id, {
            protocolVersion: PROTOKOL, hostInfo: { name: "Vayra", version: "1.0.0" },
            hostCapabilities: { openLinks: {}, serverTools: {}, serverResources: {}, logging: {}, ...(g ? { message: { text: {} } } : {}), sandbox: { ...(kaynak.izinler?.clipboardWrite ? { permissions: { clipboardWrite: {} } } : {}), ...(kaynak.csp ? { csp: kaynak.csp } : {}) } },
            hostContext: baglam(son.current.tam ? "fullscreen" : "inline"),
          });
        }
        case "ping": return yanit(id, {});
        case "tools/call": case "resources/read":
          try { return yanit(id, await vekil(m.method, p)); } catch (e) { return hataYanit(id, -32000, (e as Error).message); }
        case "ui/open-link": {
          const u = String(p.url ?? "");
          if (!/^(https?:\/\/|mailto:)/i.test(u) || u.length > 4000) return yanit(id, { isError: true });
          window.open(u, "_blank", "noopener,noreferrer");
          return yanit(id, {});
        }
        case "ui/message": {
          const l = Array.isArray(p.content) ? (p.content as { type?: string; text?: unknown }[]) : [];
          const metin = l.flatMap((c) => (c?.type === "text" && typeof c.text === "string" ? [c.text] : [])).join("\n\n").trim().slice(0, 8000);
          const g = son.current.gonder;
          // Gönderme olmayan yerlerde (herkese açık kayıt görünümü) yok sayılır.
          if (!g || !metin || p.role !== "user") return yanit(id, { isError: true });
          return yanit(id, g(metin) === false ? { isError: true } : {});
        }
        case "ui/request-display-mode": {
          const mod = p.mode === "fullscreen" ? "fullscreen" : "inline";
          if (mod === "fullscreen") eylem.current.buyut(); else if (son.current.tam) eylem.current.kucult();
          return yanit(id, { mode: mod });
        }
        case "ui/update-model-context": return yanit(id, {});
        default: return hataYanit(id, -32601, "Bu istek desteklenmiyor.");
      }
    };
    const bildirim = (m: Rpc) => {
      if (m.method === "ui/notifications/initialized") {
        if (baslatildi) return;
        baslatildi = true;
        setHazir(true);
        veriGonder();
        clearTimeout(gecik);
        // Boyut bildirmeyen görünümler makul bir yükseklikte açılır.
        gecik = setTimeout(() => setYukseklik((y) => y ?? 360), 1500);
      } else if (m.method === "ui/notifications/size-changed") {
        const h = Number(m.params?.height);
        if (Number.isFinite(h) && h > 0) setYukseklik(Math.round(Math.min(SATIR_UST, Math.max(48, h))));
      }
      // notifications/message (günlük) ve diğer bildirimler yutulur.
    };
    const dinle = (e: MessageEvent) => {
      if (e.source !== f.contentWindow || sokuldu) return;
      const m = e.data as Rpc;
      if (!m || typeof m !== "object" || m.jsonrpc !== "2.0") return;
      if (typeof m.method === "string") { if (m.id !== undefined && m.id !== null) void istek(m); else bildirim(m); }
      else if (m.id !== undefined && m.id !== null) { const c = bekleyenler.get(Number(m.id)); if (c) { bekleyenler.delete(Number(m.id)); c(); } }
    };
    addEventListener("message", dinle);
    f.addEventListener("load", () => {
      if (ilkYukleme) { ilkYukleme = false; return; }
      if (beklenen) { beklenen = false; return; }
      // Görünüm kendi belgesinden başka bir adrese geçti: CSP dışına çıkmasın diye durdurulur.
      sokuldu = true;
      f.remove();
      setHata("Görünüm başka bir sayfaya geçmeye çalıştı; güvenlik için durduruldu.");
    });
    // Hiç el sıkışmayan görünüm de bir süre sonra gösterilir.
    const zaman = setTimeout(() => setHazir(true), 5000);
    kopru.current = {
      sok: () => new Promise<void>((bitti) => {
        if (sokuldu || !baslatildi) { bitti(); return; }
        const id = 100_000 + ++sayac;
        const t = setTimeout(bitti, 400);
        bekleyenler.set(id, () => { clearTimeout(t); bitti(); });
        yolla({ id, method: "ui/resource-teardown", params: {} });
      }),
      baglamGonder: (mod) => { if (baslatildi) yolla({ method: "ui/notifications/host-context-changed", params: { displayMode: mod, containerDimensions: baglam(mod).containerDimensions } }); },
      beklenenYukleme: () => { beklenen = true; },
    };
    // Genişlik değişince (pencere, kenar çubuğu) görünüme yeni kap boyutu bildirilir; yükseklik görünümün kendisinden gelir.
    let sonGenislik = 0;
    const gozcu = new ResizeObserver((l) => {
      const w = Math.round(l[0]?.contentRect.width ?? 0);
      if (!w || w === sonGenislik) return;
      sonGenislik = w;
      if (!son.current.tam) kopru.current?.baglamGonder("inline");
    });
    if (kartYeri.current) gozcu.observe(kartYeri.current);
    (son.current.tam && tamYeri.current ? tamYeri.current : kartYeri.current)?.appendChild(f);
    return () => {
      // Kart kapanırken görünüme haber verilir (yanıt beklenmez).
      if (!sokuldu && baslatildi) yolla({ id: 100_000 + ++sayac, method: "ui/resource-teardown", params: {} });
      sokuldu = true;
      clearTimeout(gecik); clearTimeout(zaman);
      gozcu.disconnect();
      removeEventListener("message", dinle);
      f.remove();
      if (cerceve.current === f) cerceve.current = null;
    };
  }, [kaynak]);

  useEffect(() => {
    if (!tam) return;
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") kucult(); };
    addEventListener("keydown", t);
    return () => removeEventListener("keydown", t);
  }, [tam, kucult]);

  const yenidenYukle = useCallback(async () => {
    await kopru.current?.sok().catch(() => {});
    setYukseklik(null);
    setYukleme((n) => n + 1);
  }, []);

  const metin = sonucMetni(s);
  const yukleniyor = !hata && (!kaynak || !hazir);
  const h = yukseklik ?? VARSAYILAN_Y;
  const dugme = "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white";
  const ust = (kapat?: boolean) => (
    <>
      <Logo src={s.servis.logo} ad={s.servis.ad} boyut={30} acik={s.servis.acik} genis={s.servis.genis} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-white">{baslik}</p>
          <span className="shrink-0 rounded-full bg-[#55d6fd]/[0.1] px-2 py-px text-[11px] font-medium text-[#8be6ff]">Etkileşimli</span>
        </div>
        <p className="truncate text-[11.5px] text-white/45">{s.servis.ad}</p>
      </div>
      <button type="button" onClick={yenidenYukle} title="Yeniden yükle" aria-label="Yeniden yükle" className={dugme}><RotateCw className="h-3.5 w-3.5" /><span className="@max-[600px]:hidden">Yeniden yükle</span></button>
      {kapat
        ? <><button type="button" onClick={kucult} title="Sohbete geri al" aria-label="Sohbete geri al" className={dugme}><Minimize2 className="h-3.5 w-3.5" /><span className="@max-[600px]:hidden">Küçült</span></button>
            <button type="button" onClick={kucult} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button></>
        : <button type="button" onClick={tam ? kucult : buyut} disabled={!!hata} title={tam ? "Sohbete geri al" : "Tam ekran"} aria-label={tam ? "Sohbete geri al" : "Tam ekran"} className={cn(dugme, "disabled:opacity-40")}>{tam ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}<span className="@max-[600px]:hidden">{tam ? "Küçült" : "Tam ekran"}</span></button>}
    </>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="@container my-3 overflow-hidden rounded-[18px] bg-[#121315] ring-1 ring-inset ring-white/[0.09]" data-mcp-uygulama={s.resourceUri}>
      <div className="flex h-[52px] items-center gap-2.5 border-b border-white/[0.06] pl-2.5 pr-1.5">{ust()}</div>
      <div className="relative">
        {hata && (
          <div className="flex flex-col items-center gap-2 px-5 py-7 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/[0.1] text-amber-300"><AlertTriangle className="h-[18px] w-[18px]" /></span>
            <p className="mt-0.5 text-[14px] font-semibold text-white">Görünüm açılamadı</p>
            <p className="max-w-[440px] text-[12.5px] leading-relaxed text-white/55">{hata}</p>
            {!kalici && <button type="button" onClick={yenidenYukle} className="mt-1.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><RotateCw className="h-3.5 w-3.5" />Yeniden yükle</button>}
          </div>
        )}
        {yukleniyor && !tam && <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-[#121315]"><div className="absolute inset-3 animate-pulse rounded-[12px] bg-white/[0.025]" /><span className="build-parilti relative text-[12.5px] text-white/45">Görünüm yükleniyor</span></div>}
        <div ref={kartYeri} style={{ height: hata || tam ? 0 : h }} className={cn("overflow-hidden transition-[height] duration-200", (hata || tam) && "invisible")} />
        {tam && <div className="flex h-14 items-center justify-center gap-2 text-[12.5px] text-white/50">Görünüm tam ekranda açık<button type="button" onClick={kucult} className="rounded-full bg-white/[0.07] px-3 py-1 text-[12px] text-white/80 hover:bg-white/[0.12]">Buraya al</button></div>}
      </div>
      {metin && (hata || s.sonuc?.isError || s.iptal) && (
        <div className="border-t border-white/[0.06]">
          <button type="button" onClick={() => setMetinAcik((x) => !x)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[12.5px] text-white/55 hover:text-white/85">Araç sonucu<ChevronDown className={cn("h-3 w-3 transition-transform", metinAcik && "rotate-180")} /></button>
          {metinAcik && <p className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words px-3.5 pb-3 text-[13px] leading-relaxed text-white/70 [scrollbar-width:thin]">{metin.slice(0, 20_000)}</p>}
        </div>
      )}
      {dom && createPortal(
        <AnimatePresence>
          {tam && (
            <div key="mcp-tam" className="fixed inset-0 z-[140]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kucult} className="absolute inset-0 bg-black/45" />
              <motion.aside role="dialog" aria-modal="true" aria-label={baslik} style={panel.stil} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }}
                className="bd-panel @container absolute inset-y-0 right-0 flex w-full flex-col sm:w-[var(--yan-en)] sm:rounded-l-[22px]">
                <KenarTutamac en={panel.en} anahtar={panel.anahtar} varsayilan={panel.varsayilan} min={panel.min} max={panel.max} etiket="Panel genişliği" className="max-sm:hidden" />
                <header className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-white/[0.07] pl-4 pr-2">{ust(true)}</header>
                <div ref={tamYeriRef} className="relative min-h-0 flex-1 overflow-hidden bg-[#121315] sm:rounded-bl-[22px]" />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
}
