"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUp, BarChart3, BookOpen, Bot, CheckCircle2, Inbox, Loader2, Mail, MessageSquare, Phone, Star, Trash2, UserRound, Users } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Md } from "@/components/build/sohbet/SohbetEkrani";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { KANAL_AD, type Kanal } from "@/lib/build/ajanKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AjanSimge, BosDurum, KanalSimge, OlayAyrac, TON_SINIF, YanPanel, ikincil, saatYaz, sayi } from "./ortak";

export type KonusmaDurum = "acik" | "devredildi" | "insan" | "cozuldu";
export type KonusmaOzetI = {
  id: string; ilk: string; son: string; mesaj: number; guncelleme: number; kaynak: Exclude<Kanal, "test" | "zamanlama" | "webhook" | "ekip" | "eval">; site?: string;
  durum: KonusmaDurum; okunmadi: boolean; iletisim?: { ad?: string; eposta?: string; telefon?: string }; devir?: { zaman: number; neden: string }; etiket?: { sonuc: "cozuldu" | "yukseltildi" | "terk" };
  etiketler?: string[]; csat?: number; tahmin?: number; aktifAjan?: string; kaliteIhlal?: number;
};
type KMesaj = { id: string; rol: "kullanici" | "asistan"; metin?: string; zaman: number; insan?: string; parcalar?: { tur: string; metin?: string; baslik?: string; durum?: string }[]; kaynaklar?: { no: number; ad: string }[]; olay?: { tur: string; metin: string }; yanitlayan?: { id: string; ad: string; simge: string } };
type Konusma = { id: string; mesajlar: KMesaj[]; kaynak: KonusmaOzetI["kaynak"]; site?: string; durum: KonusmaDurum; iletisim?: KonusmaOzetI["iletisim"]; devir?: KonusmaOzetI["devir"] };

export const KONUSMA_DURUM: Record<KonusmaDurum, { ad: string; ton: keyof typeof TON_SINIF }> = {
  acik: { ad: "Ajanda", ton: "notr" }, devredildi: { ad: "Temsilci bekliyor", ton: "bekliyor" }, insan: { ad: "Temsilcide", ton: "iyi" }, cozuldu: { ad: "Çözüldü", ton: "iyi" },
};
const SONUC = { cozuldu: "Çözüldü", yukseltildi: "Yükseltildi", terk: "Terk edildi" } as const;

/** Tek konuşma: döküm, iletişim bilgisi, temsilci yanıtı ve durum eylemleri. */
export function KonusmaPaneli({ ajanId, konusmaId, kapat }: { ajanId: string; konusmaId: string | null; kapat: () => void }) {
  const [k, setK] = useState<Konusma | null>(null);
  const [yanit, setYanit] = useState("");
  const [gidiyor, setGidiyor] = useState("");
  const [hata, setHata] = useState("");
  const alt = useRef<HTMLDivElement>(null);
  const yukle = useCallback(() => {
    if (!konusmaId) return;
    api<{ konusma: Konusma }>(`/api/build/ajanlar/${ajanId}/konusmalar?k=${konusmaId}`).then((v) => setK(v.konusma)).catch(() => setHata("Konuşma bulunamadı."));
  }, [ajanId, konusmaId]);
  useEffect(() => { setK(null); setHata(""); setYanit(""); yukle(); }, [yukle]);
  useEffect(() => { if (!konusmaId || !k || (k.durum !== "insan" && k.durum !== "devredildi")) return; const t = setInterval(yukle, 6000); return () => clearInterval(t); }, [konusmaId, k, yukle]);
  useEffect(() => { alt.current?.scrollIntoView({ block: "end" }); }, [k?.mesajlar.length]);
  const islem = async (g: Record<string, unknown>) => {
    setGidiyor(String(g.islem === "durum" ? g.durum : g.islem)); setHata("");
    try { const v = await api<{ konusma: Konusma; kanalHata?: string }>(`/api/build/ajanlar/${ajanId}/konusmalar`, { govde: { k: konusmaId, ...g } }); setK((x) => (x ? { ...x, ...v.konusma } : x)); if (g.islem === "yanit") setYanit(""); if (v.kanalHata) setHata(v.kanalHata); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); } finally { setGidiyor(""); }
  };
  const d = k ? KONUSMA_DURUM[k.durum] : null;
  return (
    <YanPanel acik={!!konusmaId} kapat={kapat} genis
      baslik={k ? <span className="flex items-center gap-2">{k.iletisim?.ad ?? "Ziyaretçi"}{d && <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", TON_SINIF[d.ton])}>{d.ad}</span>}</span> : "Konuşma"}
      alt={k ? `${KANAL_AD[k.kaynak]}${k.site ? ` · ${k.site}` : ""} · ${k.mesajlar.length} mesaj` : undefined}
      alt2={k ? (
        <div className="w-full space-y-2">
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
          <form className="cam-istemci flex items-end gap-2 rounded-[20px] p-1.5 pl-4" onSubmit={(e) => { e.preventDefault(); if (yanit.trim()) islem({ islem: "yanit", metin: yanit }); }}>
            <textarea value={yanit} onChange={(e) => setYanit(e.target.value)} rows={1} maxLength={4000} placeholder={k.durum === "acik" ? "Temsilci olarak yaz; konuşma senin üzerine geçer" : "Ziyaretçiye yanıt yaz"}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (yanit.trim()) islem({ islem: "yanit", metin: yanit }); } }}
              className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/40" />
            <button type="submit" disabled={!yanit.trim() || !!gidiyor} aria-label="Yanıtı gönder" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-35">{gidiyor === "yanit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}</button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {k.durum !== "acik" && <button type="button" onClick={() => islem({ islem: "durum", durum: "acik" })} disabled={!!gidiyor} className={cn(ikincil, "h-8 text-[12.5px]")}><Bot className="h-3.5 w-3.5" />Ajana geri ver</button>}
            {k.durum === "devredildi" && <button type="button" onClick={() => islem({ islem: "durum", durum: "insan" })} disabled={!!gidiyor} className={cn(ikincil, "h-8 text-[12.5px]")}><Users className="h-3.5 w-3.5" />Devral</button>}
            {k.durum !== "cozuldu" && <button type="button" onClick={() => islem({ islem: "durum", durum: "cozuldu" })} disabled={!!gidiyor} className={cn(ikincil, "h-8 text-[12.5px]")}><CheckCircle2 className="h-3.5 w-3.5" />Çözüldü</button>}
            <Link href="/panel/build/ajanlar/gelen" className={cn(ikincil, "h-8 text-[12.5px]")}><Inbox className="h-3.5 w-3.5" />Gelen kutusu</Link>
            <span className="flex-1" />
            <button type="button" onClick={async () => { await api(`/api/build/ajanlar/${ajanId}/konusmalar`, { govde: { islem: "sil", k: konusmaId } }).catch(() => {}); kapat(); }} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300/80 hover:bg-rose-500/[0.1]"><Trash2 className="h-3.5 w-3.5" />Sil</button>
          </div>
        </div>
      ) : undefined}>
      {!k ? (hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>) : (
        <div className="space-y-4">
          {(k.iletisim || k.devir) && (
            <div className="grid gap-2 sm:grid-cols-2">
              {k.iletisim && (
                <div className="rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.07]">
                  <p className="text-[11.5px] text-white/45">Formdan gelen</p>
                  {k.iletisim.ad && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white"><UserRound className="h-3.5 w-3.5 text-white/45" />{k.iletisim.ad}</p>}
                  {k.iletisim.eposta && <a href={`mailto:${k.iletisim.eposta}`} className="mt-1 flex items-center gap-1.5 text-[13px] text-[#8be6ff] hover:underline"><Mail className="h-3.5 w-3.5" />{k.iletisim.eposta}</a>}
                  {k.iletisim.telefon && <a href={`tel:${k.iletisim.telefon}`} className="mt-1 flex items-center gap-1.5 text-[13px] text-white/85"><Phone className="h-3.5 w-3.5 text-white/45" />{k.iletisim.telefon}</a>}
                </div>
              )}
              {k.devir && (
                <div className="rounded-[14px] bg-amber-400/[0.06] p-3 ring-1 ring-inset ring-amber-300/15">
                  <p className="text-[11.5px] text-amber-200/70">Devir nedeni · {gorece(k.devir.zaman)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-amber-50/90">{k.devir.neden}</p>
                </div>
              )}
            </div>
          )}
          <div className="space-y-4">
            {k.mesajlar.map((m) => m.olay ? <OlayAyrac key={m.id} tur={m.olay.tur} metin={m.olay.metin} /> : m.rol === "kullanici" ? (
              <div key={m.id} className="ml-auto w-fit max-w-[85%]">
                <p className="whitespace-pre-wrap break-words rounded-[18px] rounded-tr-[5px] bg-white/[0.09] px-3.5 py-2 text-[13.5px] leading-relaxed text-white">{m.metin}</p>
                <p className="mt-1 text-right text-[11px] text-white/35">{saatYaz(m.zaman)}</p>
              </div>
            ) : (
              <div key={m.id} className={cn("max-w-[92%]", m.insan && "rounded-[16px] bg-amber-400/[0.05] p-3 ring-1 ring-inset ring-amber-300/15")}>
                <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-white/45">{m.insan ? <><Users className="h-3 w-3 text-amber-200" /><span className="text-amber-200/90">{m.insan}</span></> : m.yanitlayan ? <><AjanSimge src={m.yanitlayan.simge} boyut={14} />{m.yanitlayan.ad}</> : <><Bot className="h-3 w-3" />Ajan</>} · {saatYaz(m.zaman)}</p>
                <div className="text-[13.5px]">{(m.parcalar ?? []).map((p, j) => p.tur === "metin" ? <Md key={j} metin={p.metin ?? ""} onizle={() => {}} /> : p.tur === "arac" ? <p key={j} className="text-[12.5px] text-white/45">{p.baslik}</p> : null)}</div>
                {m.kaynaklar?.length ? <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-white/45"><BookOpen className="h-3 w-3" />{m.kaynaklar.map((x) => x.ad).join(", ")}</p> : null}
              </div>
            ))}
            <div ref={alt} />
          </div>
        </div>
      )}
    </YanPanel>
  );
}

/** Konuşmalar sekmesi: sayaçlar, durum süzgeci, liste ve konuşma paneli. */
export function Konusmalar({ ajanId }: { ajanId: string }) {
  const [durum, setDurum] = useState<"" | "bekliyor" | "cozuldu" | "kalite">("");
  const [etiket, setEtiket] = useState("");
  const [v, setV] = useState<{ etiketler: string[]; konusmalar: KonusmaOzetI[]; sayilar: { hepsi: number; bekliyor: number; cozuldu: number; form: number; kalite: number }; istatistik: { ziyaretciMesaj: number; kredi: number; bugun: number; tavan: number } } | null>(null);
  const [acik, setAcik] = useState<string | null>(null);
  const yukle = useCallback(() => api<NonNullable<typeof v>>(`/api/build/ajanlar/${ajanId}/konusmalar?${new URLSearchParams({ ...(durum ? { durum } : {}), ...(etiket ? { etiket } : {}) })}`).then(setV).catch(() => {}), [ajanId, durum, etiket]);
  useEffect(() => { yukle(); }, [yukle]);
  const i = v?.istatistik;
  return (
    <Kart ikon={BarChart3} baslik="Ziyaretçi konuşmaları" alt="Paylaşım sayfası, web sitesi, API, Telegram ve WhatsApp"
      sag={i ? <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] tabular-nums text-white/55">Bugün {i.bugun} / {i.tavan}</span> : undefined}>
      {!v ? <div className="h-40 animate-pulse" /> : (
        <>
          <dl className="grid grid-cols-4 divide-x divide-white/[0.06] border-b border-white/[0.06] max-sm:grid-cols-2 max-sm:divide-y">
            {[["Konuşma", v.sayilar.hepsi], ["Temsilci bekliyor", v.sayilar.bekliyor], ["Form dolduran", v.sayilar.form], ["Harcanan kredi", i!.kredi]].map(([a, b]) => (
              <div key={String(a)} className="px-4 py-3 sm:px-5"><dd className="text-[20px] font-semibold tabular-nums text-white">{sayi(Number(b))}</dd><dt className="text-[12px] text-white/45">{a}</dt></div>
            ))}
          </dl>
          <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5"><Suzgec id={`konusma-durum-${ajanId}`} deger={durum} set={setDurum} l={[{ id: "" as const, ad: "Hepsi", sayi: v.sayilar.hepsi }, { id: "bekliyor" as const, ad: "Temsilcide", sayi: v.sayilar.bekliyor }, { id: "cozuldu" as const, ad: "Çözüldü", sayi: v.sayilar.cozuldu }, ...(v.sayilar.kalite ? [{ id: "kalite" as const, ad: "Kalite ihlali", sayi: v.sayilar.kalite }] : [])]} />
            {v.etiketler.length > 0 && <div className="mt-2 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">{v.etiketler.map((e) => <button key={e} type="button" aria-pressed={etiket === e} onClick={() => setEtiket(etiket === e ? "" : e)} className={cn("h-7 shrink-0 rounded-full px-2.5 text-[12px] ring-1 ring-inset transition", etiket === e ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>{e}</button>)}</div>}
          </div>
          {v.konusmalar.length ? (
            <div className="divide-y divide-white/[0.04]">
              {v.konusmalar.map((k) => { const d = KONUSMA_DURUM[k.durum]; return (
                <button key={k.id} type="button" onClick={() => setAcik(k.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.025] sm:px-5">
                  <KanalSimge k={k.kaynak} boyut={34} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2"><span className="truncate text-[13.5px] text-white/90">{k.iletisim?.ad ? `${k.iletisim.ad} · ` : ""}{k.ilk || "Mesajsız"}</span>{k.okunmadi && <span className="h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" />}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-white/40">{k.mesaj} mesaj · {k.site ?? KANAL_AD[k.kaynak]} · {gorece(k.guncelleme)}{k.etiket ? ` · ${SONUC[k.etiket.sonuc]}` : ""}{k.etiketler?.length ? ` · ${k.etiketler.join(", ")}` : ""}{k.aktifAjan ? ` · ${k.aktifAjan}` : ""}</span>
                  </span>
                  {k.kaliteIhlal ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-300" aria-label="Kalite kuralı ihlali" /> : null}
                  {k.csat ? <span className="inline-flex shrink-0 items-center gap-0.5 text-[11.5px] tabular-nums text-amber-200/90"><Star className="h-3 w-3 fill-current" />{k.csat}</span> : null}
                  {k.durum !== "acik" && <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", TON_SINIF[d.ton])}>{d.ad}</span>}
                </button>
              ); })}
            </div>
          ) : <BosDurum ikon={MessageSquare} baslik={durum ? "Bu durumda konuşma yok" : "Henüz ziyaretçi konuşması yok"} alt={durum ? "Başka bir süzgeç seç." : "Ajanı yayınla; paylaşım bağlantısını gönder, web sitene ekle ya da Telegram ve WhatsApp'a bağla."} />}
        </>
      )}
      <KonusmaPaneli ajanId={ajanId} konusmaId={acik} kapat={() => { setAcik(null); yukle(); }} />
    </Kart>
  );
}
