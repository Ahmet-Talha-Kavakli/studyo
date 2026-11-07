"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCw, Shield, ShieldCheck, Sparkles, Undo2, Wand2, Wrench } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { AiDuzeltPaneli, Bagimliliklar, Sizintilar } from "./GuvenlikEk";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";

export type GuvenlikBulgu = {
  id: string; seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; yer: string;
  duzelt?: { etiket: string }; ajan?: string; yoksayildi?: { neden: string; zaman: number };
};
const SEVIYE = {
  kritik: { ad: "Kritik", sinif: "bg-rose-500/[0.14] text-rose-200", serit: "bg-rose-400" },
  uyari: { ad: "Uyarı", sinif: "bg-amber-400/[0.12] text-amber-200", serit: "bg-amber-300" },
  bilgi: { ad: "Bilgi", sinif: "bg-white/[0.07] text-white/60", serit: "bg-white/30" },
} as const;
const YER_AD: Record<string, string> = { veri: "Veritabanı", dosyalar: "Dosyalar", kod: "Kod", fonksiyon: "Fonksiyonlar", alan: "Alan adları", yayin: "Yayın", ortam: "Ortam ve sırlar" };

/** Ajan düzeltmeleri tek isteğe toplanır. */
export const bulgulardanIstek = (l: GuvenlikBulgu[]) => `Güvenlik taramasında şu sorunlar bulundu; hepsini düzelt ve her birini nasıl çözdüğünü tek cümleyle özetle:\n${l.map((b) => `- [${SEVIYE[b.seviye].ad}] ${b.ajan ?? `${b.baslik}: ${b.ayrinti}`}`).join("\n")}`;

/**
 * Bulut > Güvenlik: veri kuralları, koddaki sırlar ve riskli kalıplar, webhook imzaları, kovalar, ortam değişkenleri.
 * Her bulguda tek tıkla düzelt (varsa), ajana düzelttir ve gerekçeyle yok say; kritik bulguda yayını durdurma ayarı.
 */
export function GuvenlikTaramasi({ projeId, ajanaGonder, yenilendi }: { projeId: string; ajanaGonder: (metin: string) => void; yenilendi?: () => void }) {
  const [sekme, setSekme] = useState<"bulgular" | "bagimlilik" | "sizinti">("bulgular");
  return (
    <div className="space-y-4">
      <div className="flex"><Secici id="guvenlik-sekme" deger={sekme} set={setSekme} l={[{ id: "bulgular", ad: "Bulgular" }, { id: "bagimlilik", ad: "Bağımlılıklar" }, { id: "sizinti", ad: "Sızan anahtarlar" }]} /></div>
      {sekme === "bulgular" && <Bulgular projeId={projeId} ajanaGonder={ajanaGonder} yenilendi={yenilendi} />}
      {sekme === "bagimlilik" && <Bagimliliklar projeId={projeId} ajanaGonder={ajanaGonder} />}
      {sekme === "sizinti" && <Sizintilar projeId={projeId} ajanaGonder={ajanaGonder} />}
    </div>
  );
}

function Bulgular({ projeId, ajanaGonder, yenilendi }: { projeId: string; ajanaGonder: (metin: string) => void; yenilendi?: () => void }) {
  const [ai, setAi] = useState<GuvenlikBulgu | null>(null);
  const [l, setL] = useState<GuvenlikBulgu[] | null>(null);
  const [durdur, setDurdur] = useState(true);
  const [taraniyor, setTaraniyor] = useState(false);
  const [zaman, setZaman] = useState(0);
  const [isleniyor, setIsleniyor] = useState<string | null>(null);
  const [yoksay, setYoksay] = useState<{ id: string; neden: string } | null>(null);
  const [hata, setHata] = useState("");
  const tara = useCallback(async () => {
    setTaraniyor(true);
    try { const v = await api<{ bulgular: GuvenlikBulgu[]; kritikteDurdur: boolean; zaman: number }>(`/api/build/bulut/${projeId}/guvenlik`); setL(v.bulgular); setDurdur(v.kritikteDurdur); setZaman(v.zaman); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Taranamadı."); setL((x) => x ?? []); }
    finally { setTaraniyor(false); }
  }, [projeId]);
  useEffect(() => { tara(); }, [tara]);
  const islem = async (anahtar: string, govde: Record<string, unknown>) => {
    setIsleniyor(anahtar); setHata("");
    try { await api(`/api/build/bulut/${projeId}/guvenlik`, { govde }); await tara(); yenilendi?.(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); }
    finally { setIsleniyor(null); }
  };
  if (!l) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;
  const acik = l.filter((b) => !b.yoksayildi);
  const yoksayilan = l.filter((b) => b.yoksayildi);
  const say = (s: GuvenlikBulgu["seviye"]) => acik.filter((b) => b.seviye === s).length;
  const ajanlik = acik.filter((b) => b.ajan || !b.duzelt);

  return (
    <div className="space-y-4">
      <Kart ikon={Shield} baslik="Güvenlik taraması" alt={zaman ? `Son tarama ${gorece(zaman)} · bir sonraki yayın taranır` : "Bir sonraki yayın taranır"}
        sag={<button type="button" onClick={tara} disabled={taraniyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13] disabled:opacity-50"><RotateCw className={cn("h-3.5 w-3.5", taraniyor && "animate-spin")} />Yeniden tara</button>}>
        <div className="grid grid-cols-3 gap-px bg-white/[0.05]">
          {(["kritik", "uyari", "bilgi"] as const).map((s) => (
            <div key={s} className="bg-[#141518] px-4 py-3.5">
              <p className="text-[12px] text-white/45">{SEVIYE[s].ad}</p>
              <p className={cn("mt-0.5 text-[22px] font-semibold tabular-nums", say(s) ? (s === "kritik" ? "text-rose-200" : s === "uyari" ? "text-amber-200" : "text-white") : "text-white/35")}>{say(s)}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
          <label className="flex min-w-0 flex-1 items-center gap-3">
            <Anahtar acik={durdur} set={(v) => { setDurdur(v); islem("ayar", { kritikteDurdur: v }); }} etiket="Kritik sorunda yayını durdur" />
            <span className="min-w-0"><span className="block text-[13.5px] text-white">Kritik sorunda yayını durdur</span><span className="block text-[12px] text-white/45">Çözülmemiş ya da yok sayılmamış kritik bulgu varken yayın engellenir</span></span>
          </label>
          {ajanlik.length > 0 && <button type="button" onClick={() => ajanaGonder(bulgulardanIstek(ajanlik))} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />Hepsini ajana düzelttir</button>}
        </div>
        {hata && <p className="border-t border-white/[0.05] px-5 py-2.5 text-[12.5px] text-rose-200">{hata}</p>}
      </Kart>

      <Kart ikon={ShieldCheck} baslik="Bulgular" alt={acik.length ? `${acik.length} açık bulgu` : "Açık bulgu yok"}>
        {!acik.length ? <p className="flex items-center gap-2 px-5 py-5 text-[13.5px] text-white/65"><ShieldCheck className="h-5 w-5 text-[#8be6ff]" />Sorun bulunmadı. Tablo, kova ya da kod değiştikçe tarama yenilenir.</p> : (
          <div className="divide-y divide-white/[0.05]">
            {acik.map((b) => (
              <div key={b.id} className="relative px-4 py-3.5 pl-5 sm:px-5 sm:pl-6">
                <span className={cn("absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full", SEVIYE[b.seviye].serit)} />
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <span className="min-w-0 flex-1 basis-[260px]">
                    <span className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", SEVIYE[b.seviye].sinif)}>{SEVIYE[b.seviye].ad}</span><span className="text-[11.5px] text-white/40">{YER_AD[b.yer] ?? b.yer}</span></span>
                    <span className="mt-1 block text-[13.5px] font-medium text-white">{b.baslik}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/55">{b.ayrinti}</span>
                  </span>
                  <span className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {b.duzelt && <button type="button" disabled={!!isleniyor} onClick={() => islem(b.id, { duzelt: b.id })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-50">{isleniyor === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}{b.duzelt.etiket}</button>}
                    <button type="button" onClick={() => setAi(b)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.12] px-3 text-[12.5px] text-[#8be6ff] hover:bg-[#55d6fd]/[0.2]"><Sparkles className="h-3.5 w-3.5" />Yapay zekâyla düzelt</button>
                    {(b.ajan || !b.duzelt) && <button type="button" onClick={() => ajanaGonder(bulgulardanIstek([b]))} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><Wand2 className="h-3.5 w-3.5" />Ajana düzelttir</button>}
                    <button type="button" onClick={() => setYoksay(yoksay?.id === b.id ? null : { id: b.id, neden: "" })} className={cn("inline-flex h-8 items-center rounded-full px-3 text-[12.5px] transition-colors", yoksay?.id === b.id ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/60" : "text-white/50 hover:bg-white/[0.06] hover:text-white")}>Yok say</button>
                  </span>
                </div>
                {yoksay?.id === b.id && (
                  <form onSubmit={(e) => { e.preventDefault(); islem(b.id, { yoksay }).then(() => setYoksay(null)); }} className="mt-2.5 flex flex-wrap items-center gap-2">
                    <input autoFocus value={yoksay.neden} onChange={(e) => setYoksay({ ...yoksay, neden: e.target.value })} placeholder="Neden yok sayıyorsun? Örneğin bu tablo bilerek herkese açık" className={cn(alanSinif, "h-10 min-w-[220px] flex-1 text-[13px]")} />
                    <button disabled={yoksay.neden.trim().length < 3} className="inline-flex h-10 items-center rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">Kaydet</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </Kart>

      {yoksayilan.length > 0 && (
        <Kart ikon={Undo2} baslik="Yok sayılanlar" alt="Yayını durdurmaz; gerekçesiyle kayıtlı">
          <div className="divide-y divide-white/[0.05]">
            {yoksayilan.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", SEVIYE[b.seviye].sinif)}>{SEVIYE[b.seviye].ad}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white/80">{b.baslik}</span><span className="block truncate text-[12px] text-white/45">{b.yoksayildi!.neden} · {gorece(b.yoksayildi!.zaman)}</span></span>
                <button type="button" disabled={!!isleniyor} onClick={() => islem(b.id, { geriAl: b.id })} className="inline-flex h-8 items-center rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.12]">Geri al</button>
              </div>
            ))}
          </div>
        </Kart>
      )}
      <AiDuzeltPaneli projeId={projeId} b={ai} kapat={() => setAi(null)} ajanaGonder={ajanaGonder} bitti={() => { setAi(null); tara(); yenilendi?.(); }} />
    </div>
  );
}
