"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Pencil, Plus, RefreshCw, Send, Trash2, Webhook } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { YanPanel, sureYaz } from "./ortak";

type Olay = "ekle" | "guncelle" | "sil";
type Kanca = { id: string; ad: string; tablo: string; olaylar: Olay[]; adres: string; sir: string; acik: boolean; olusturma: number };
type Teslim = { id: string; kancaId: string; z: number; olay: string; tablo: string; durum: number; sure: number; deneme: number; hata?: string; yanit?: string };
const OLAY_AD: Record<Olay, string> = { ekle: "Eklenince", guncelle: "Güncellenince", sil: "Silinince" };

/** Veri kancaları: tablo olaylarında dış adrese imzalı POST, teslim günlüğü, deneme teslimi. */
export function VeriKancalari({ projeId, tablolar }: { projeId: string; tablolar: string[] }) {
  const [v, setV] = useState<{ kancalar: Kanca[]; teslimler: Teslim[] } | null>(null);
  const [form, setForm] = useState<Partial<Kanca> | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [kopya, setKopya] = useState<string | null>(null);
  const kok = `/api/build/bulut/${projeId}/kanca`;
  const getir = useCallback(() => api<NonNullable<typeof v>>(kok).then(setV).catch(() => setV({ kancalar: [], teslimler: [] })), [kok]);
  useEffect(() => { getir(); }, [getir]);
  const islem = async (govde: Record<string, unknown>, anahtar: string) => {
    setGidiyor(anahtar); setHata("");
    try { const x = await api<NonNullable<typeof v>>(kok, { govde }); setV({ kancalar: x.kancalar, teslimler: x.teslimler }); return true; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); return false; }
    finally { setGidiyor(null); }
  };
  return (
    <Kart ikon={Webhook} baslik="Veri kancaları" alt="Tabloda kayıt değişince başka bir servise (Zapier, Make, kendi sunucun) imzalı istek gönderilir; yalnız Canlı veri"
      sag={<button type="button" onClick={() => setForm({ tablo: tablolar[0] ?? "*", olaylar: ["ekle"], adres: "", ad: "" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black"><Plus className="h-3.5 w-3.5" /><span className="max-sm:hidden">Kanca ekle</span></button>}>
      {!v ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div> : !v.kancalar.length ? (
        <p className="px-5 py-4 text-[13px] leading-relaxed text-white/55">Örnek: &quot;siparisler&quot; tablosuna kayıt eklenince muhasebe yazılımına ya da Slack&apos;e haber ver. Her istek <code className="font-mono text-white/75">X-Vayra-Imza</code> başlığında gövdenin HMAC-SHA256 imzasını taşır; alıcı kancanın sırrıyla doğrular.</p>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {v.kancalar.map((k) => { const son = v.teslimler.find((t) => t.kancaId === k.id); const basarili = son && son.durum >= 200 && son.durum < 300; return (
            <div key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <span className="min-w-[200px] flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{k.ad}</span><span className="block truncate text-[12px] text-white/50">{k.tablo === "*" ? "Bütün tablolar" : k.tablo} · {k.olaylar.map((o) => OLAY_AD[o].toLocaleLowerCase("tr")).join(", ")} · {(() => { try { return new URL(k.adres).host; } catch { return k.adres; } })()}</span></span>
              <span className="shrink-0 text-right text-[12px] max-sm:hidden">{son ? <><span className={cn("block tabular-nums", basarili ? "text-emerald-200" : "text-rose-200")}>{son.durum || "Ağ hatası"}{son.deneme > 1 ? `, ${son.deneme}. deneme` : ""}</span><span className="block text-white/40">{gorece(son.z)}</span></> : <span className="text-white/40">Henüz teslim yok</span>}</span>
              <span className="flex shrink-0 items-center gap-1">
                <button type="button" title="Deneme gönder" aria-label="Deneme gönder" disabled={!!gidiyor} onClick={() => islem({ islem: "dene", id: k.id }, `d-${k.id}`)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white">{gidiyor === `d-${k.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}</button>
                <button type="button" title="Düzenle" aria-label="Düzenle" onClick={() => setForm(k)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                <Anahtar acik={k.acik} set={(a) => islem({ islem: "guncelle", id: k.id, acik: a }, `a-${k.id}`)} etiket={`${k.ad} açık`} />
              </span>
            </div>
          ); })}
          {v.teslimler.length > 0 && (
            <div className="bg-white/[0.015]">
              <p className="px-4 pb-1 pt-3 text-[12px] font-medium text-white/50 sm:px-5">Son teslimler</p>
              <div className="max-h-[220px] divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">{v.teslimler.slice(0, 30).map((t) => (
                <div key={`${t.id}-${t.deneme}`} className="flex items-center gap-3 px-4 py-2 text-[12px] sm:px-5" title={t.hata ?? t.yanit}>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", t.durum >= 200 && t.durum < 300 ? "bg-emerald-400" : "bg-rose-400")} />
                  <span className="w-[54px] shrink-0 tabular-nums text-white/70">{t.durum || "Hata"}</span>
                  <span className="min-w-0 flex-1 truncate text-white/60">{t.tablo}.{t.olay}{t.hata ? `, ${t.hata}` : ""}</span>
                  <span className="shrink-0 tabular-nums text-white/40">{sureYaz(t.sure)} · {gorece(t.z)}</span>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      )}
      {hata && <p className="border-t border-white/[0.06] px-5 py-2.5 text-[12.5px] text-rose-300">{hata}</p>}
      <YanPanel acik={!!form} kapat={() => setForm(null)} baslik={form?.id ? "Kancayı düzenle" : "Veri kancası"} alt="Gövde: { olay, tablo, kayit, onceki, zaman }"
        alt2={form ? <>
          <button type="button" disabled={!!gidiyor || !form.adres} onClick={async () => { if (await islem({ islem: form.id ? "guncelle" : "ekle", ...form }, "kaydet")) setForm(null); }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "kaydet" && <Loader2 className="h-4 w-4 animate-spin" />}{form.id ? "Kaydet" : "Kancayı oluştur"}</button>
          {form.id && <button type="button" onClick={async () => { if (await islem({ islem: "sil", id: form.id }, "sil")) setForm(null); }} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/55 hover:bg-rose-500/[0.1] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Sil</button>}
        </> : undefined}>
        {form && <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Ad</span><input value={form.ad ?? ""} onChange={(e) => setForm({ ...form, ad: e.target.value })} placeholder="Yeni sipariş bildirimi" className={cn(alanSinif, "h-10")} /></label>
          <div><span className="mb-1.5 block text-[12.5px] text-white/55">Tablo</span><AcilirSecim deger={form.tablo ?? "*"} set={(t) => setForm({ ...form, tablo: t })} l={[{ id: "*", ad: "Bütün tablolar" }, ...tablolar.map((t) => ({ id: t, ad: t }))]} /></div>
          <div><span className="mb-1.5 block text-[12.5px] text-white/55">Olaylar</span><div className="flex flex-wrap gap-1.5">{(["ekle", "guncelle", "sil"] as Olay[]).map((o) => { const s = form.olaylar?.includes(o); return <button key={o} type="button" onClick={() => setForm({ ...form, olaylar: s ? form.olaylar!.filter((x) => x !== o) : [...(form.olaylar ?? []), o] })} className={cn("inline-flex h-8 items-center rounded-full px-3 text-[12.5px]", s ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 ring-1 ring-inset ring-white/[0.07]")}>{OLAY_AD[o]}</button>; })}</div></div>
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Adres</span><input value={form.adres ?? ""} onChange={(e) => setForm({ ...form, adres: e.target.value.trim() })} placeholder="https://hooks.zapier.com/..." className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} /></label>
          {form.sir && <div><span className="mb-1.5 flex items-center justify-between text-[12.5px] text-white/55">İmza sırrı<button type="button" onClick={() => islem({ islem: "sirYenile", id: form.id }, "sir").then(() => setForm(null))} className="inline-flex items-center gap-1 text-[12px] text-white/55 hover:text-white"><RefreshCw className="h-3 w-3" />Yenile</button></span>
            <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[10px] bg-black/30 px-2.5 py-2 font-mono text-[12px] text-white/85 ring-1 ring-inset ring-white/[0.07]">{form.sir}</code><button type="button" onClick={() => { navigator.clipboard?.writeText(form.sir!); setKopya("sir"); setTimeout(() => setKopya(null), 1300); }} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white">{kopya === "sir" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}Kopyala</button></div>
            <p className="mt-1.5 text-[12px] text-white/45">Alıcı tarafta: HMAC-SHA256(gövde, sır) onaltılık değeri, X-Vayra-Imza başlığındaki sha256= sonrasıyla aynı olmalı.</p></div>}
          <p className="text-[12px] leading-relaxed text-white/45">Başarısız teslim (ağ hatası, 429 ya da 500 ve üstü) 1 ve 5 dakika sonra yeniden denenir. İç ağ ve yerel adreslere istek gönderilmez.</p>
        </div>}
      </YanPanel>
    </Kart>
  );
}
