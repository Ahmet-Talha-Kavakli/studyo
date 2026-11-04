"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Braces, ChevronDown, History, Loader2, Plus, Radar, Send, Trash2, Wand2 } from "lucide-react";
import { useApiAnahtar, type ApiUretim } from "@/store/useApiAnahtar";
import { apiIstek, apiTaban, senkronize, type ApiYanit } from "@/lib/api/istemci";
import { UC_GRUPLARI, UC_NOKTALAR, YONTEM_RENK, ucBul, type UcNokta, type Yontem } from "@/lib/api/ucnoktalar";
import { DILLER, kodUret, type Dil } from "@/lib/api/kod";
import { ornekInput } from "@/lib/api/sema";
import { MODELLER } from "@/lib/catalog";
import { toast } from "@/lib/toast";
import { AnahtarSecici, HttpRozet, KodEditor, SayfaBaslik, SecimSerit, YontemRozet, birincil, girdi, ikincil, sureMetin, useSeciliAnahtar, kisaZaman } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

const kart = "rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";
const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
const YONTEM_YAZI: Record<Yontem, string> = { GET: "text-emerald-300", POST: "text-sky-300", PUT: "text-amber-300", DELETE: "text-rose-300" };

export default function KonsolSayfasi() {
  return <Suspense><Konsol /></Suspense>;
}

type Baslik = { k: string; v: string };

function Konsol() {
  const hazir = useHazir();
  const sp = useSearchParams();
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const uretimler = useApiAnahtar((s) => s.uretimler);
  const cagrilar = useApiAnahtar((s) => s.cagrilar);
  const [anahtar, setAnahtar] = useSeciliAnahtar();
  const [uc, setUc] = useState<UcNokta>(() => ucBul(sp.get("uc") ?? "") ?? UC_NOKTALAR[0]);
  const [yontem, setYontem] = useState<Yontem>(uc.yontem);
  const [yol, setYol] = useState(uc.yol);
  const [paramlar, setParamlar] = useState<Record<string, string>>({});
  const [sorgu, setSorgu] = useState<Record<string, string>>({});
  const [govde, setGovde] = useState("");
  const [basliklar, setBasliklar] = useState<Baslik[]>([]);
  const [sekme, setSekme] = useState<"govde" | "baslik" | "kod">("govde");
  const [yanitSekme, setYanitSekme] = useState<"govde" | "baslik">("govde");
  const [dil, setDil] = useState<Dil>("curl");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [izliyor, setIzliyor] = useState(false);
  const [yanit, setYanit] = useState<ApiYanit | null>(null);

  // ?anahtar=
  useEffect(() => { const id = sp.get("anahtar"); const a = id && anahtarlar.find((x) => x.id === id); if (a) setAnahtar(a); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ucSec = (u: UcNokta, ilk = false) => {
    setUc(u); setYontem(u.yontem); setYol(u.yol); setYanit(null);
    const p: Record<string, string> = {};
    for (const a of u.yolParam ?? []) p[a.ad] = a.ad === "id" && u.grup === "Üretimler" ? uretimler[0]?.id ?? "" : a.ad === "id" ? "nano-banana-pro" : "";
    setParamlar(p);
    setSorgu(Object.fromEntries((u.sorgu ?? []).filter((a) => a.varsayilan !== undefined).map((a) => [a.ad, String(a.varsayilan)])));
    let g = u.ornekGovde ? JSON.stringify(u.ornekGovde, null, 2) : "";
    if (ilk && sp.get("govde")) { try { g = JSON.stringify(JSON.parse(sp.get("govde")!), null, 2); } catch { /* yok say */ } }
    else if (ilk && sp.get("model") && u.id === "uretim-olustur") { const m = MODELLER.find((x) => x.id === sp.get("model")); if (m) g = JSON.stringify({ model: m.id, input: ornekInput(m) }, null, 2); }
    setGovde(g);
    setSekme(g ? "govde" : "baslik");
  };
  useEffect(() => { ucSec(uc, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tamYol = useMemo(() => {
    let y = yol;
    for (const [k, v] of Object.entries(paramlar)) y = y.replace(`{${k}}`, encodeURIComponent(v || `{${k}}`));
    const q = new URLSearchParams(Object.entries(sorgu).filter(([, v]) => v !== ""));
    return q.toString() ? `${y}?${q}` : y;
  }, [yol, paramlar, sorgu]);

  const jsonHata = useMemo(() => { if (!govde.trim()) return null; try { JSON.parse(govde); return null; } catch (e) { return (e as Error).message; } }, [govde]);
  const govdeVar = yontem === "POST" || yontem === "PUT";
  const ekBaslik = Object.fromEntries(basliklar.filter((b) => b.k.trim()).map((b) => [b.k.trim(), b.v]));

  const gonder = async () => {
    if (uc.kapsam !== "yok" && !anahtar) { toast.error("API anahtarı seçilmedi", { description: "Bu uç nokta kimlik doğrulama istiyor. Yukarıdan bir anahtar seç." }); return; }
    if (govdeVar && jsonHata) { toast.error("Gövde geçerli JSON değil", { description: `Gövdeyi düzeltip yeniden gönder. Ayrıntı: ${jsonHata}` }); return; }
    if (/\{[a-z_]+\}/.test(tamYol)) { toast.error("Yol parametresi eksik", { description: `${tamYol} içindeki {…} alanlarını doldurup yeniden gönder.` }); return; }
    setGonderiliyor(true);
    const r = await apiIstek(uc.kapsam === "yok" ? null : anahtar!.tam, yontem, tamYol, { govde: govdeVar && govde.trim() ? govde : undefined, baslik: ekBaslik, kaynak: "konsol", anahtarId: anahtar?.id ?? null });
    setYanit(r); setGonderiliyor(false); setYanitSekme("govde");
    if (r.durum < 300) void senkronize();
  };

  const uretimYaniti = yanit && (yanit.govde as { object?: string })?.object === "generation" ? (yanit.govde as Omit<ApiUretim, "anahtarId">) : null;
  const izle = async () => {
    if (!uretimYaniti || !anahtar) return;
    setIzliyor(true);
    let son: ApiYanit | null = null;
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      son = await apiIstek(anahtar.tam, "GET", `/generations/${uretimYaniti.id}`, { kaydetme: true });
      setYanit(son);
      const s = (son.govde as { status?: string })?.status;
      if (s !== "queued" && s !== "processing") break;
    }
    setIzliyor(false);
    void senkronize();
  };

  useEffect(() => {
    const tus = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void gonder(); } };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  });

  if (!hazir) return <div className="h-[60vh]" />;
  const gecmis = cagrilar.filter((c) => c.kaynak === "konsol").slice(0, 8);
  const boyut = yanit ? new Blob([yanit.ham]).size : 0;


  return (
    <>
      <SayfaBaslik baslik="Konsol" aciklama="Herhangi bir uç noktaya gerçek istek gönder, yanıtı başlıklarıyla incele, isteği koda çevir."
        sag={<span className="hidden items-center gap-1.5 text-[12.5px] text-white/55 sm:inline-flex"><kbd>Ctrl</kbd><kbd>Enter</kbd>gönderir</span>} />
      <div className="grid items-start gap-5 xl:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="order-last space-y-4 xl:sticky xl:top-20 xl:order-none">
          <LayoutGroup id="konsol-uc">
            <nav className={cn(kart, "hidden p-2 xl:block")} aria-label="Uç noktalar">
              {UC_GRUPLARI.map((g) => (
                <div key={g} className="mb-1 last:mb-0">
                  <p className="px-2.5 pb-1 pt-2.5 text-[12.5px] font-medium text-white/50">{g}</p>
                  {UC_NOKTALAR.filter((u) => u.grup === g).map((u) => {
                    const s = uc.id === u.id;
                    return (
                      <button key={u.id} onClick={() => ucSec(u)} className={cn("group relative flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left text-[13.5px] transition-colors", s ? "text-white" : "text-white/65 hover:text-white")}>
                        {s && <motion.span layoutId="konsol-uc-z" className="absolute inset-0 rounded-[12px] bg-white/[0.08] ring-1 ring-white/[0.08]" transition={yay} />}
                        <span className={cn("relative w-[46px] shrink-0 text-[11px] font-semibold", YONTEM_YAZI[u.yontem])}>{u.yontem}</span>
                        <span className="relative truncate">{u.ad}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </LayoutGroup>
          {gecmis.length > 0 && (
            <div className={cn(kart, "p-2")}>
              <p className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-2 text-[12.5px] font-medium text-white/50"><History className="h-3.5 w-3.5" />Son istekler</p>
              {gecmis.map((c) => (
                <button key={c.id} onClick={() => {
                  const u = UC_NOKTALAR.find((x) => x.yontem === c.yontem && new RegExp(`^${x.yol.replace(/\{[a-z_]+\}/g, "[^/?]+")}(\\?|$)`).test(c.yol)) ?? uc;
                  setUc(u); setYontem(c.yontem as Yontem); setYol(c.yol.split("?")[0]); setParamlar({}); setSorgu(Object.fromEntries(new URLSearchParams(c.yol.split("?")[1] ?? ""))); setGovde(c.istek ? JSON.stringify(JSON.parse(c.istek), null, 2) : ""); setYanit(null);
                }} className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.04]">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", c.durumKodu > 0 && c.durumKodu < 300 ? "bg-emerald-400" : c.durumKodu >= 400 && c.durumKodu < 500 ? "bg-amber-300" : "bg-rose-400")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[12.5px]"><span className={cn("text-[11px] font-semibold", YONTEM_YAZI[c.yontem as Yontem])}>{c.yontem}</span><span className="truncate font-mono text-[12px] text-white/70">{c.yol}</span></span>
                  </span>
                  <span className="shrink-0 text-[11.5px] tabular-nums text-white/45"><HttpRozet kod={c.durumKodu} /> · {kisaZaman(c.zaman)}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="min-w-0 space-y-5">
          {/* İstek çubuğu */}
          <section className={cn(kart, "relative overflow-hidden p-5")}>
            <span className="pointer-events-none absolute -right-16 -top-24 h-56 w-72 rounded-full bg-[#55d6fd]/[0.07] blur-3xl" aria-hidden />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 max-w-[720px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={uc.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
                    <p className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] text-white"><YontemRozet yontem={uc.yontem} />{uc.ad}</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">{uc.ozet}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              {uc.kapsam === "yok" && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/65">Anahtar gerekmez</span>}
            </div>
            <label className="relative mt-4 flex h-11 items-center rounded-full bg-white/[0.05] ring-1 ring-white/[0.1] xl:hidden">
              <span className="pl-4 text-[12.5px] text-white/55">Uç nokta</span>
              <select value={uc.id} onChange={(e) => { const u = UC_NOKTALAR.find((x) => x.id === e.target.value); if (u) ucSec(u); }} aria-label="Uç nokta seç"
                className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pl-2 pr-9 text-[13.5px] font-medium text-white outline-none [&>optgroup]:bg-[#17181b] [&>optgroup>option]:bg-[#17181b]">
                {UC_GRUPLARI.map((g) => <optgroup key={g} label={g}>{UC_NOKTALAR.filter((u) => u.grup === g).map((u) => <option key={u.id} value={u.id}>{u.yontem} · {u.ad}</option>)}</optgroup>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 text-white/50" />
            </label>
            <div className="relative mt-3 flex flex-wrap items-stretch gap-2 xl:mt-4">
              <div className="flex h-12 min-w-0 flex-1 basis-[420px] items-center overflow-hidden rounded-full bg-black/30 ring-1 ring-white/[0.1] transition focus-within:ring-[#55d6fd]/55">
                <label className={cn("relative ml-1.5 flex h-9 shrink-0 items-center rounded-full ring-1 ring-inset", YONTEM_RENK[yontem])}>
                  <select value={yontem} onChange={(e) => setYontem(e.target.value as Yontem)} aria-label="Yöntem" className="h-full cursor-pointer appearance-none bg-transparent pl-3.5 pr-7 text-[12.5px] font-semibold outline-none [&>option]:bg-[#17181b] [&>option]:text-white">
                    {(["GET", "POST", "PUT", "DELETE"] as const).map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 opacity-70" />
                </label>
                <span className="hidden whitespace-nowrap pl-3 font-mono text-[12.5px] text-white/40 md:inline">{apiTaban()}</span>
                <input value={yol} onChange={(e) => setYol(e.target.value)} aria-label="Yol" spellCheck={false} className="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-[13px] text-white outline-none max-md:pl-3" />
              </div>
              {uc.kapsam !== "yok" && <AnahtarSecici secili={anahtar} onSec={setAnahtar} className="w-full sm:w-[230px] [&>button]:h-12" />}
              <button onClick={gonder} disabled={gonderiliyor} className={cn(birincil, "h-12 px-6 text-[14px]")}>
                {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Gönder
              </button>
            </div>
            {(uc.yolParam?.length || uc.sorgu?.length) ? (
              <div className="relative mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
                {(uc.yolParam ?? []).map((a) => (
                  <label key={a.ad} className="block">
                    <span className="mb-1.5 flex items-baseline gap-2 text-[12.5px]"><code className="font-mono font-semibold text-white">{a.ad}</code><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/55">yol</span></span>
                    {a.ad === "id" && uc.grup === "Üretimler" && uretimler.length ? (
                      <select value={paramlar[a.ad] ?? ""} onChange={(e) => setParamlar({ ...paramlar, [a.ad]: e.target.value })} className={cn(girdi, "font-mono text-[12.5px] [&>option]:bg-[#17181b]")}>
                        {uretimler.slice(0, 30).map((u) => <option key={u.id} value={u.id}>{u.id} · {u.status}</option>)}
                      </select>
                    ) : a.ad === "id" && uc.grup === "Modeller" ? (
                      <select value={paramlar[a.ad] ?? ""} onChange={(e) => setParamlar({ ...paramlar, [a.ad]: e.target.value })} className={cn(girdi, "font-mono text-[12.5px] [&>option]:bg-[#17181b]")}>
                        {MODELLER.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
                      </select>
                    ) : <input value={paramlar[a.ad] ?? ""} onChange={(e) => setParamlar({ ...paramlar, [a.ad]: e.target.value })} placeholder={a.aciklama} className={cn(girdi, "font-mono text-[12.5px]")} />}
                  </label>
                ))}
                {(uc.sorgu ?? []).map((a) => (
                  <label key={a.ad} className="block">
                    <span className="mb-1.5 flex items-baseline gap-2 text-[12.5px]"><code className="font-mono font-semibold text-white">{a.ad}</code><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/55">sorgu</span></span>
                    {a.secenekler ? (
                      <select value={sorgu[a.ad] ?? ""} onChange={(e) => setSorgu({ ...sorgu, [a.ad]: e.target.value })} className={cn(girdi, "font-mono text-[12.5px] [&>option]:bg-[#17181b]")}>
                        <option value="">Seçilmedi</option>{a.secenekler.map((s) => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
                      </select>
                    ) : <input value={sorgu[a.ad] ?? ""} onChange={(e) => setSorgu({ ...sorgu, [a.ad]: e.target.value })} placeholder={a.aciklama} className={cn(girdi, "font-mono text-[12.5px]")} />}
                  </label>
                ))}
              </div>
            ) : null}
          </section>

          <div className="grid items-start gap-5 2xl:grid-cols-2">
            {/* İstek */}
            <section className={cn(kart, "overflow-hidden")}>
              <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <SecimSerit id="konsol-sekme" kucuk deger={sekme} onDegis={setSekme}
                  secenek={[{ id: "govde" as const, ad: "Gövde" }, { id: "baslik" as const, ad: <>Başlıklar{basliklar.length ? <span className="ml-1 opacity-55">{basliklar.length}</span> : null}</> }, { id: "kod" as const, ad: "Kod" }]} />
                {sekme === "govde" && govdeVar && (
                  <div className="ml-auto flex gap-1">
                    {uc.ornekGovde && <button onClick={() => setGovde(JSON.stringify(uc.ornekGovde, null, 2))} title="Örnek gövde" className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-white/70 ring-1 ring-white/[0.1] transition hover:bg-white/[0.06] hover:text-white active:scale-[0.97]"><Wand2 className="h-3.5 w-3.5" />Örnek</button>}
                    <button onClick={() => { try { setGovde(JSON.stringify(JSON.parse(govde), null, 2)); } catch { /* geçersiz */ } }} disabled={!!jsonHata} title="Biçimlendir" className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-white/70 ring-1 ring-white/[0.1] transition hover:bg-white/[0.06] hover:text-white active:scale-[0.97] disabled:opacity-40"><Braces className="h-3.5 w-3.5" />Biçimlendir</button>
                  </div>
                )}
              </div>
              <div className="p-4">
                {sekme === "govde" && (govdeVar ? (
                  <>
                    <textarea value={govde} onChange={(e) => setGovde(e.target.value)} spellCheck={false} aria-label="İstek gövdesi"
                      onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget, s = t.selectionStart; setGovde(govde.slice(0, s) + "  " + govde.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 2; }); } }}
                      className="h-[340px] w-full resize-y rounded-[18px] bg-[#111216] p-4 font-mono text-[12.5px] leading-relaxed text-[#c0caf5] outline-none ring-1 ring-white/[0.08] transition focus:ring-[#55d6fd]/50" placeholder="{ }" />
                    <p className={cn("mt-2.5 flex items-center gap-1.5 text-[12.5px]", jsonHata ? "text-rose-300" : govde.trim() ? "text-emerald-300/90" : "text-white/50")}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", jsonHata ? "bg-rose-400" : govde.trim() ? "bg-emerald-400" : "bg-white/30")} />
                      {jsonHata ? `JSON hatası: ${jsonHata}` : govde.trim() ? "Geçerli JSON" : "Gövde boş"}
                    </p>
                  </>
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-[18px] bg-white/[0.02] text-center ring-1 ring-white/[0.05]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06]"><Braces className="h-4 w-4 text-white/60" /></span>
                    <p className="text-[13.5px] font-medium text-white">{yontem} isteği gövde taşımaz</p>
                    <p className="text-[12.5px] text-white/55">Parametreleri yukarıdaki alanlardan ver.</p>
                  </div>
                ))}
                {sekme === "baslik" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 font-mono text-[12px] ring-1 ring-white/[0.05]"><span className="text-[#7dcfff]">Authorization</span><span className="truncate text-white/55">Bearer {anahtar ? `${anahtar.tam.slice(0, 12)}…` : "anahtar seçilmedi"}</span><span className="ml-auto shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 font-sans text-[11px] text-white/55">otomatik</span></div>
                    {govdeVar && <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 font-mono text-[12px] ring-1 ring-white/[0.05]"><span className="text-[#7dcfff]">Content-Type</span><span className="text-white/55">application/json</span><span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 font-sans text-[11px] text-white/55">otomatik</span></div>}
                    <AnimatePresence initial={false}>
                      {basliklar.map((b, i) => (
                        <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 overflow-hidden">
                          <input value={b.k} onChange={(e) => setBasliklar(basliklar.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} placeholder="Başlık" aria-label="Başlık adı" className={cn(girdi, "h-10 font-mono text-[12.5px]")} />
                          <input value={b.v} onChange={(e) => setBasliklar(basliklar.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} placeholder="Değer" aria-label="Başlık değeri" className={cn(girdi, "h-10 font-mono text-[12.5px]")} />
                          <button onClick={() => setBasliklar(basliklar.filter((_, j) => j !== i))} aria-label="Başlığı sil" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.06] hover:text-white active:scale-90"><Trash2 className="h-4 w-4" /></button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={() => setBasliklar([...basliklar, { k: "", v: "" }])} className={ikincil}><Plus className="h-4 w-4" />Başlık ekle</button>
                      {govdeVar && !basliklar.some((b) => b.k.toLowerCase() === "idempotency-key") && <button onClick={() => setBasliklar([...basliklar, { k: "Idempotency-Key", v: crypto.randomUUID() }])} className={ikincil}>Idempotency-Key ekle</button>}
                    </div>
                  </div>
                )}
                {sekme === "kod" && (
                  <KodEditor sekmeler={DILLER.map((d) => ({ id: d.id, ad: d.ad, kod: kodUret(d.id, { taban: apiTaban(), yontem, yol: tamYol, anahtar: uc.kapsam === "yok" ? undefined : anahtar?.tam, govde: govdeVar && govde.trim() && !jsonHata ? JSON.parse(govde) : undefined, baslik: ekBaslik }) }))}
                    aktif={dil} onSekme={(d) => setDil(d as Dil)} gizle={anahtar?.tam} maxH={360} />
                )}
              </div>
            </section>

            {/* Yanıt */}
            <section className={cn(kart, "overflow-hidden 2xl:sticky 2xl:top-20")}>
              <div className="flex flex-wrap items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
                <span className="text-[14px] font-semibold text-white">Yanıt</span>
                <AnimatePresence>
                  {yanit && (
                    <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums", yanit.durum && yanit.durum < 300 ? "bg-emerald-400/12 text-emerald-300" : yanit.durum < 500 && yanit.durum ? "bg-amber-400/12 text-amber-200" : "bg-rose-400/12 text-rose-300")}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />{yanit.durum || "Ağ hatası"}
                      </span>
                      <span className="whitespace-nowrap rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] tabular-nums text-white/65">{sureMetin(yanit.sureMs)}</span>
                      <span className="whitespace-nowrap rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] tabular-nums text-white/65">{boyut < 1024 ? `${boyut} B` : `${(boyut / 1024).toFixed(1).replace(".", ",")} KB`}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="ml-auto flex items-center gap-2">
                  {uretimYaniti && (uretimYaniti.status === "queued" || uretimYaniti.status === "processing") && (
                    <button onClick={izle} disabled={izliyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#55d6fd]/15 px-3 text-[12.5px] font-medium text-[#8fe6ff] transition hover:bg-[#55d6fd]/25 active:scale-[0.97] disabled:opacity-70">
                      {izliyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radar className="h-3.5 w-3.5" />}{izliyor ? "İzleniyor" : "Bitene kadar izle"}
                    </button>
                  )}
                  {yanit && <SecimSerit id="konsol-yanit" kucuk deger={yanitSekme} onDegis={setYanitSekme} secenek={[{ id: "govde" as const, ad: "Gövde" }, { id: "baslik" as const, ad: "Başlıklar" }]} />}
                </div>
              </div>
              <div className="p-4">
                {!yanit ? (
                  <div className="relative flex h-[360px] flex-col items-center justify-center overflow-hidden rounded-[18px] bg-[#0e0f12] text-center ring-1 ring-white/[0.05]">
                    <div className="absolute inset-x-6 top-6 space-y-2.5 opacity-[0.35] [mask-image:linear-gradient(180deg,black,transparent_85%)]" aria-hidden>
                      {[38, 62, 48, 74, 30, 56, 44].map((w, i) => <span key={i} className="block h-2.5 rounded-full bg-white/[0.08]" style={{ width: `${w}%`, marginLeft: i % 3 === 0 ? 0 : i % 3 === 1 ? 16 : 32 }} />)}
                    </div>
                    <motion.span animate={gonderiliyor ? { rotate: 360 } : { y: [0, -4, 0] }} transition={gonderiliyor ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd]/12 text-[#55d6fd] ring-1 ring-[#55d6fd]/25">
                      {gonderiliyor ? <Loader2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </motion.span>
                    <p className="relative mt-4 text-[15px] font-semibold text-white">{gonderiliyor ? "İstek gönderiliyor" : "Yanıt burada açılır"}</p>
                    <p className="relative mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-white/55">Durum kodu, süre ve boyut üstte; gövde ve başlıklar ayrı sekmelerde.</p>
                    {!gonderiliyor && <button onClick={gonder} className={cn(birincil, "relative mt-4")}><Send className="h-3.5 w-3.5" />Şimdi gönder</button>}
                  </div>
                ) : yanitSekme === "govde" ? (
                  <motion.div key={yanit.sureMs + yanit.ham.length} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    {uretimYaniti?.status === "succeeded" && uretimYaniti.output?.urls[0] && uretimYaniti.type === "image" && (
                      <div className="mb-3 flex gap-2 overflow-x-auto">{uretimYaniti.output.urls.map((u) => <img key={u} src={u} alt="Çıktı" className="h-32 rounded-[14px] object-cover ring-1 ring-white/[0.08]" />)}</div>
                    )}
                    <KodEditor dosyaAdi="response.json" dil="json" kod={typeof yanit.govde === "string" ? yanit.govde : JSON.stringify(yanit.govde, null, 2)} maxH={480} />
                  </motion.div>
                ) : (
                  <div className="overflow-hidden rounded-[16px] ring-1 ring-white/[0.06]">
                    <table className="w-full text-[12.5px]">
                      <tbody className="divide-y divide-white/[0.05]">
                        {Object.entries(yanit.baslik).sort().map(([k, v]) => (
                          <tr key={k} className="transition-colors hover:bg-white/[0.02]"><td className={cn("whitespace-nowrap px-3.5 py-2 pr-4 font-mono", k.startsWith("x-ratelimit") || k === "retry-after" || k === "x-request-id" ? "text-[#e0af68]" : "text-[#7dcfff]")}>{k}</td><td className="break-all px-3.5 py-2 font-mono text-white/60">{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
