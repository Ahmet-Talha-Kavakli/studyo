"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { KeyRound, Loader2, Network, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Bolum, HataKutusu, katalogLogo, Kopyala, Panel, Satir, type BaglantiAcik } from "./ortak";

type Secim = { baglantiId: string; araclar: "*" | string[] };
type GecitAcik = { id: string; ad: string; secim: Secim[]; onayliDahil: boolean; saltOkunur: boolean; kapali?: boolean; onEk: string; olusturma: number; sonKullanim?: number; cagri: number; aracSayisi: number };

/** İstemci kurulum metinleri (anahtar yalnız oluştururken ya da yenileyince görünür). */
function Kurulum({ adres, anahtar, ad }: { adres: string; anahtar?: string; ad: string }) {
  const [istemci, setIstemci] = useState<"claude" | "cursor" | "vscode" | "diger">("claude");
  const k = anahtar ?? "<ağ geçidi anahtarı>";
  const kisa = ad.toLocaleLowerCase("tr").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "vayra";
  const metin = istemci === "claude" ? `claude mcp add --transport http ${kisa} ${adres} --header "Authorization: Bearer ${k}"`
    : istemci === "cursor" ? JSON.stringify({ mcpServers: { [kisa]: { url: adres, headers: { Authorization: `Bearer ${k}` } } } }, null, 2)
      : istemci === "vscode" ? JSON.stringify({ servers: { [kisa]: { type: "http", url: adres, headers: { Authorization: `Bearer ${k}` } } } }, null, 2)
        : `Adres: ${adres}\nTaşıma: Streamable HTTP\nBaşlık: Authorization: Bearer ${k}`;
  const yer = istemci === "claude" ? "Claude Code terminalinde çalıştır" : istemci === "cursor" ? "Cursor: .cursor/mcp.json ya da ~/.cursor/mcp.json" : istemci === "vscode" ? "VS Code: .vscode/mcp.json" : "Başlık ekleyebilen her MCP istemcisi";
  return (
    <div className="space-y-2 p-4">
      <Secici id="gecit-istemci" kucuk deger={istemci} set={setIstemci} l={[{ id: "claude", ad: "Claude Code" }, { id: "cursor", ad: "Cursor" }, { id: "vscode", ad: "VS Code" }, { id: "diger", ad: "Özel" }]} />
      <p className="text-[12px] text-white/50">{yer}</p>
      <div className="flex items-start gap-2"><pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre rounded-[12px] bg-black/30 p-3 font-mono text-[11.5px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">{metin}</pre><Kopyala metin={metin} etiket="Kurulum metnini kopyala" /></div>
    </div>
  );
}

/** Ağ geçidi düzenleme paneli: ad, bağlantı ve araç seçimi, seçenekler, anahtar ve kurulum. */
function GecitPaneli({ g: g0, baglantilar, adres, kapat, kaydedildi, silindi }: { g?: GecitAcik; baglantilar: BaglantiAcik[]; adres: string; kapat: () => void; kaydedildi: (g: GecitAcik, anahtar?: string) => void; silindi: (id: string) => void }) {
  const [olusan, setOlusan] = useState<GecitAcik | undefined>();
  const g = g0 ?? olusan;
  const [ad, setAd] = useState(g?.ad ?? "Vayra araçları");
  const [secim, setSecim] = useState<Secim[]>(g?.secim ?? []);
  const [onayli, setOnayli] = useState(g?.onayliDahil ?? false);
  const [salt, setSalt] = useState(g?.saltOkunur ?? false);
  const [anahtar, setAnahtar] = useState<string | undefined>();
  const [acik, setAcik] = useState<string | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [silOnay, setSilOnay] = useState(false);
  const etkin = baglantilar.filter((b) => b.durum === "etkin");
  const sec = (b: BaglantiAcik) => secim.find((s) => s.baglantiId === b.id);
  const degistir = (b: BaglantiAcik, v: Secim | null) => setSecim((l) => [...l.filter((s) => s.baglantiId !== b.id), ...(v ? [v] : [])]);
  const kaydet = async (ek: Record<string, unknown> = {}, etiket = "kaydet") => {
    setGidiyor(etiket); setHata("");
    try {
      const v = g ? await api<{ gecit: GecitAcik; anahtar?: string; aracSayisi: number }>(`/api/build/baglantilar/gecit/${g.id}`, { method: "PATCH", govde: { ad, secim, onayliDahil: onayli, saltOkunur: salt, ...ek } })
        : await api<{ gecit: GecitAcik; anahtar?: string; aracSayisi: number }>("/api/build/baglantilar/gecit", { govde: { ad, secim, onayliDahil: onayli, saltOkunur: salt } });
      if (v.anahtar) setAnahtar(v.anahtar);
      if (!g) setOlusan({ ...v.gecit, aracSayisi: v.aracSayisi });
      kaydedildi({ ...v.gecit, aracSayisi: v.aracSayisi }, v.anahtar);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
    finally { setGidiyor(null); }
  };
  const izinli = (b: BaglantiAcik) => b.araclar.filter((a) => { const gor = (a as { _meta?: { ui?: { visibility?: string[] } } })._meta?.ui?.visibility; if (Array.isArray(gor) && !gor.includes("model")) return false; const iz = b.izinler[a.name] ?? (a.annotations?.readOnlyHint ? "her-zaman" : "sor"); return iz !== "kapali" && (onayli || iz === "her-zaman") && (!salt || a.annotations?.readOnlyHint); });
  const toplam = secim.reduce((t, s) => { const b = etkin.find((x) => x.id === s.baglantiId); if (!b) return t; const l = izinli(b); return t + (s.araclar === "*" ? l.length : l.filter((a) => (s.araclar as string[]).includes(a.name)).length); }, 0);
  return (
    <Panel baslik={g ? g.ad : "Yeni ağ geçidi"} alt={g ? `${g.aracSayisi} araç sunuyor · ${g.cagri} çağrı${g.sonKullanim ? ` · son ${gorece(g.sonKullanim)}` : ""}` : "Seçtiğin araçlar tek bir MCP adresinde"} logo={<span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.07] text-white"><Network className="h-5 w-5" /></span>} kapat={kapat}
      alt2={<>
        {g && <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/baglantilar/gecit/${g.id}`, { method: "DELETE" }).catch(() => {}); silindi(g.id); }} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px]", silOnay ? "bg-rose-500/[0.14] font-semibold text-rose-200" : "text-rose-300/90 hover:bg-rose-500/[0.08]")}><Trash2 className="h-4 w-4" />{silOnay ? "Silmek için tekrar tıkla" : "Sil"}</button>}
        <span className="flex-1" />
        <span className="text-[12px] tabular-nums text-white/45">{toplam} araç</span>
        <button type="button" onClick={() => kaydet()} disabled={!secim.length || !!gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "kaydet" && <Loader2 className="h-4 w-4 animate-spin" />}{g ? "Kaydet" : "Oluştur"}</button>
      </>}>
      {anahtar && <HataKutusu tur="bilgi"><span className="block font-medium">Anahtar yalnız şimdi görünür; kopyalayıp sakla.</span><span className="mt-1.5 flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-1.5 font-mono text-[12px]">{anahtar}</code><Kopyala metin={anahtar} etiket="Anahtarı kopyala" /></span></HataKutusu>}
      {hata && <HataKutusu>{hata}</HataKutusu>}
      <Bolum baslik="Ad"><div className="p-4"><input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={60} className={cn(alanSinif, "h-10 text-[13.5px]")} /></div></Bolum>
      <Bolum baslik="Bağlantılar ve araçlar" alt="Yalnız sağlıklı bağlantılar; izni Kapalı olan araçlar hiçbir zaman sunulmaz">
        {etkin.length ? (
          <div className="divide-y divide-white/[0.05]">
            {etkin.map((b) => { const s = sec(b); const l = izinli(b); const secili = s ? (s.araclar === "*" ? l.length : l.filter((a) => (s.araclar as string[]).includes(a.name)).length) : 0; return (
              <div key={b.id}>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {katalogLogo(katalogBul(b.katalogId), b, 32)}
                  <button type="button" onClick={() => setAcik(acik === b.id ? null : b.id)} className="min-w-0 flex-1 text-left"><span className="block truncate text-[13.5px] text-white">{b.ad}</span><span className="block text-[11.5px] text-white/45">{s ? `${secili} / ${l.length} araç seçili` : `${l.length} araç uygun`} · araç seçmek için aç</span></button>
                  <Anahtar acik={!!s} set={(v) => degistir(b, v ? { baglantiId: b.id, araclar: "*" } : null)} etiket={`${b.ad} ağ geçidinde`} />
                </div>
                {acik === b.id && s && (
                  <div className="space-y-1 bg-white/[0.015] px-4 pb-3 pt-1">
                    <label className="flex items-center gap-2 py-1 text-[12.5px] text-white/70"><input type="checkbox" checked={s.araclar === "*"} onChange={(e) => degistir(b, { baglantiId: b.id, araclar: e.target.checked ? "*" : l.map((a) => a.name) })} className="accent-[#55d6fd]" />Bütün uygun araçlar (sonradan eklenenler dahil)</label>
                    {s.araclar !== "*" && l.map((a) => { const on = (s.araclar as string[]).includes(a.name); return (
                      <label key={a.name} className="flex items-center gap-2 py-0.5 pl-5 text-[12.5px] text-white/65"><input type="checkbox" checked={on} onChange={() => degistir(b, { baglantiId: b.id, araclar: on ? (s.araclar as string[]).filter((x) => x !== a.name) : [...(s.araclar as string[]), a.name] })} className="accent-[#55d6fd]" /><span className="truncate">{a.annotations?.title ?? a.title ?? a.name}</span><span className="text-white/35">{a.annotations?.readOnlyHint ? "okuma" : "yazma"}</span></label>
                    ); })}
                  </div>
                )}
              </div>
            ); })}
          </div>
        ) : <p className="px-4 py-3 text-[13px] text-white/50">Önce bir servisi bağla; sağlıklı bağlantılar burada listelenir.</p>}
      </Bolum>
      <Bolum baslik="Seçenekler">
        <Satir ad="Onay isteyen araçlar da sunulsun" alt="İzni Sor olan araçlar dış istemciye açılır; onayı istemci ister (Claude ve Cursor çalıştırmadan önce sorar)"><Anahtar acik={onayli} set={setOnayli} etiket="Onay isteyen araçlar" /></Satir>
        <Satir ad="Yalnız okuma araçları" alt="Yazma araçları bu ağ geçidinden hiç sunulmaz"><Anahtar acik={salt} set={setSalt} etiket="Yalnız okuma" /></Satir>
      </Bolum>
      {g && (
        <Bolum baslik="Anahtar" alt={`${g.onEk}… ile başlıyor · ${gorece(g.olusturma)} oluşturuldu`} sag={<button type="button" onClick={() => kaydet({ anahtarYenile: true }, "anahtar")} disabled={!!gidiyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12] disabled:opacity-50">{gidiyor === "anahtar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Yenile</button>}>
          <p className="px-4 py-3 text-[12px] leading-relaxed text-white/50">Yenileyince eski anahtar hemen çalışmaz; bağlı istemcileri yeni anahtarla güncelle. Kapatınca istemciler bağlanamaz.</p>
          <Satir ad="Ağ geçidi açık"><Anahtar acik={!g.kapali} set={(v) => kaydet({ kapali: !v }, "kapali")} etiket="Ağ geçidi açık" /></Satir>
        </Bolum>
      )}
      {(g || anahtar) && <Bolum baslik="Kurulum" alt={adres}><Kurulum adres={adres} anahtar={anahtar} ad={ad} /></Bolum>}
    </Panel>
  );
}

/** MCP ağ geçidi kartı: Vayra bağlantılarını Claude, Cursor, VS Code ve diğer MCP istemcilerinde kullan. */
export function GecitKarti({ baglantilar }: { baglantilar: BaglantiAcik[] }) {
  const [v, setV] = useState<{ adres: string; gecitler: GecitAcik[] } | null>(null);
  const [acik, setAcik] = useState<string | "yeni" | null>(null);
  useEffect(() => { api<{ adres: string; gecitler: GecitAcik[] }>("/api/build/baglantilar/gecit").then(setV).catch(() => setV({ adres: "", gecitler: [] })); }, []);
  const secili = v?.gecitler.find((g) => g.id === acik);
  return (
    <Kart ikon={Network} baslik="MCP ağ geçidi" alt="Seçtiğin araçları tek bir MCP adresinde topla; Türk adaptörleri ve REST bağlantıları dahil hepsi Claude, Cursor ve VS Code'da çalışır"
      sag={<button type="button" onClick={() => setAcik("yeni")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]"><Plus className="h-3.5 w-3.5" /><span className="max-sm:hidden">Ağ geçidi kur</span></button>}>
      {v === null ? <div className="h-16 animate-pulse" /> : v.gecitler.length ? (
        <div className="divide-y divide-white/[0.05]">
          {v.gecitler.map((g) => (
            <button key={g.id} type="button" onClick={() => setAcik(g.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] text-white/80"><KeyRound className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{g.ad}</span><span className="block truncate text-[12.5px] text-white/45">{g.secim.length} bağlantı · {g.aracSayisi} araç · {g.cagri} çağrı{g.sonKullanim ? ` · son ${gorece(g.sonKullanim)}` : ""}{g.saltOkunur ? " · yalnız okuma" : ""}</span></span>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium", g.kapali ? "bg-white/[0.07] text-white/55" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}>{g.kapali ? "Kapalı" : "Açık"}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
          <p className="min-w-[220px] flex-1 text-[13px] leading-relaxed text-white/55">Henüz ağ geçidi yok. Kurunca bir adres ve anahtar alırsın; seçtiğin araçlar izinleri, sabit alanları ve hız sınırlarıyla birlikte dış istemcilere açılır, her çağrı Kayıtlar'a yazılır.</p>
          <button type="button" onClick={() => setAcik("yeni")} className="h-9 shrink-0 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Ağ geçidi kur</button>
        </div>
      )}
      <AnimatePresence>
        {acik && v && <GecitPaneli key={acik} g={secili} baglantilar={baglantilar} adres={v.adres} kapat={() => setAcik(null)}
          kaydedildi={(g) => { setV((x) => x ? { ...x, gecitler: x.gecitler.some((y) => y.id === g.id) ? x.gecitler.map((y) => (y.id === g.id ? g : y)) : [g, ...x.gecitler] } : x); }}
          silindi={(id) => { setV((x) => x ? { ...x, gecitler: x.gecitler.filter((y) => y.id !== id) } : x); setAcik(null); }} />}
      </AnimatePresence>
    </Kart>
  );
}
