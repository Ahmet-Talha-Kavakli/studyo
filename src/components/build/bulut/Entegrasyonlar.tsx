"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Check, Copy, Loader2, Mail, RotateCw, Send, Trash2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";

type Kayit = { record?: string; name: string; type: string; value: string; priority?: number; status?: string };
type EpostaAlan = { alan: string; durum: string; kayitlar: Kayit[]; gonderen: string; ad?: string; sonKontrol?: number };
const DURUM: Record<string, { ad: string; s: string }> = {
  verified: { ad: "Doğrulandı", s: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" }, pending: { ad: "Doğrulanıyor", s: "bg-amber-400/[0.12] text-amber-200" },
  not_started: { ad: "DNS bekleniyor", s: "bg-white/[0.07] text-white/60" }, failed: { ad: "Doğrulanamadı", s: "bg-rose-500/[0.12] text-rose-200" }, temporary_failure: { ad: "Geçici sorun", s: "bg-amber-400/[0.12] text-amber-200" },
};

function Kopyala({ m }: { m: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" aria-label="Kopyala" onClick={() => { navigator.clipboard?.writeText(m); setOk(true); setTimeout(() => setOk(false), 1200); }} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white">{ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>;
}

/** Sitenin kendi alan adından e-posta gönderimi (Resend alan adı doğrulaması ve DNS kayıtları). */
export function EpostaGonderenAlan({ projeId, onerilen }: { projeId: string; onerilen?: string }) {
  const [v, setV] = useState<{ kurulu: boolean; epostaAlan: EpostaAlan | null } | null>(null);
  const [g, setG] = useState({ alan: onerilen ?? "", yerel: "bilgi", ad: "" });
  const [is, setIs] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [kime, setKime] = useState("");
  const [mesaj, setMesaj] = useState("");
  const kok = `/api/build/bulut/${projeId}/eposta-alan`;
  const getir = useCallback(() => api<NonNullable<typeof v>>(kok).then(setV).catch(() => setV({ kurulu: false, epostaAlan: null })), [kok]);
  useEffect(() => { getir(); }, [getir]);
  const islem = async (govde: Record<string, unknown>, ad: string) => {
    setIs(ad); setHata(""); setMesaj("");
    try { const x = await api<{ epostaAlan?: EpostaAlan | null }>(kok, { govde }); if ("epostaAlan" in x) setV((o) => o && { ...o, epostaAlan: x.epostaAlan ?? null }); if (ad === "dene") setMesaj("Deneme e-postası gönderildi."); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); }
    finally { setIs(null); }
  };
  const e = v?.epostaAlan;
  const d = e ? DURUM[e.durum] ?? { ad: e.durum, s: "bg-white/[0.07] text-white/60" } : null;
  return (
    <Kart ikon={Mail} baslik="E-posta gönderen alan adı" alt={e ? `${e.ad ? `${e.ad} ` : ""}<${e.gonderen}> adresinden sipariş, randevu ve üyelik e-postaları` : "Sipariş, randevu ve üyelik e-postaları sitenin kendi alan adından gitsin"}
      sag={d ? <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-medium", d.s)}>{d.ad}</span> : undefined}>
      {!v ? <div className="flex h-20 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
        : !v.kurulu ? <p className="px-5 py-4 text-[13px] leading-relaxed text-white/60">E-posta servisi kurulu değil: sunucuda RESEND_API_KEY tanımlı olmadığı için alan adı doğrulanamaz ve e-posta gönderilmez. Anahtar eklenince bu bölüm alan adını Resend&apos;e ekler ve gereken DNS kayıtlarını gösterir.</p>
        : !e ? (
          <form onSubmit={(x) => { x.preventDefault(); islem({ islem: "ekle", ...g }, "ekle"); }} className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <input value={g.yerel} onChange={(x) => setG({ ...g, yerel: x.target.value.toLowerCase() })} aria-label="Gönderen adı" className={cn(alanSinif, "h-10 w-[110px] text-[13.5px]")} />
              <span className="text-white/45">@</span>
              <input value={g.alan} onChange={(x) => setG({ ...g, alan: x.target.value.trim().toLowerCase() })} placeholder="kahvem.com" aria-label="Alan adı" className={cn(alanSinif, "h-10 min-w-[160px] flex-1 text-[13.5px]")} />
            </div>
            <input value={g.ad} onChange={(x) => setG({ ...g, ad: x.target.value })} placeholder="Görünen ad (Lumen Kahve)" aria-label="Görünen ad" className={cn(alanSinif, "h-10 text-[13.5px]")} />
            <button disabled={!g.alan || is === "ekle"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{is === "ekle" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Alan adını ekle</button>
            <p className="text-[12px] leading-relaxed text-white/45">Resend alan adı için SPF ve DKIM kayıtları üretir; bunları alan adının DNS paneline eklemen gerekir. Alt alan adı (posta.kahvem.com) kullanırsan mevcut e-posta kutuların etkilenmez.</p>
          </form>
        ) : (
          <div className="space-y-3 p-4 sm:p-5">
            {e.durum !== "verified" && <p className="text-[12.5px] leading-relaxed text-white/60">Aşağıdaki kayıtları {e.alan} alan adının DNS paneline ekle, sonra Doğrula&apos;ya bas. Yayılması birkaç dakika ile birkaç saat sürebilir; doğrulanana kadar e-postalar ortak adresten gider.</p>}
            <div className="overflow-x-auto rounded-[14px] ring-1 ring-inset ring-white/[0.08] [scrollbar-width:thin]">
              <table className="w-full min-w-[560px] text-[12px]">
                <thead><tr className="border-b border-white/[0.07] text-left text-white/45"><th className="px-3 py-2 font-medium">Tür</th><th className="px-3 py-2 font-medium">Ad</th><th className="px-3 py-2 font-medium">Değer</th><th className="px-3 py-2 font-medium">Durum</th></tr></thead>
                <tbody>{e.kayitlar.map((k, i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-3 py-2 text-white/80">{k.type}{k.priority != null ? ` ${k.priority}` : ""}</td>
                    <td className="max-w-[160px] px-3 py-2"><span className="flex items-center gap-1"><code className="truncate font-mono text-white/80">{k.name}</code><Kopyala m={k.name} /></span></td>
                    <td className="max-w-[260px] px-3 py-2"><span className="flex items-center gap-1"><code className="truncate font-mono text-white/80">{k.value}</code><Kopyala m={k.value} /></span></td>
                    <td className={cn("px-3 py-2", k.status === "verified" ? "text-[#8be6ff]" : k.status === "failed" ? "text-rose-200" : "text-white/50")}>{k.status === "verified" ? "Doğru" : k.status === "failed" ? "Hatalı" : "Bekleniyor"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" disabled={!!is} onClick={() => islem({ islem: "denetle" }, "denetle")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">{is === "denetle" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}Doğrula</button>
              {e.sonKontrol && <span className="text-[12px] text-white/40">Son kontrol {gorece(e.sonKontrol)}</span>}
              <span className="flex-1" />
              <button type="button" disabled={!!is} onClick={() => islem({ islem: "kaldir" }, "kaldir")} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/55 hover:bg-rose-500/[0.1] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Kaldır</button>
            </div>
            {e.durum === "verified" && (
              <form onSubmit={(x) => { x.preventDefault(); islem({ islem: "dene", kime }, "dene"); }} className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                <input value={kime} onChange={(x) => setKime(x.target.value)} placeholder="Deneme için e-posta adresin" className={cn(alanSinif, "h-9 min-w-[200px] flex-1 text-[13px]")} />
                <button disabled={!kime || !!is} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13] disabled:opacity-40">{is === "dene" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Deneme gönder</button>
              </form>
            )}
          </div>
        )}
      {(hata || mesaj) && <p className={cn("border-t border-white/[0.06] px-5 py-2.5 text-[12.5px]", hata ? "text-rose-300" : "text-[#8be6ff]")}>{hata || mesaj}</p>}
    </Kart>
  );
}

/** GA4 ve Meta Pixel: kimlikler ve çerez onayı davranışı. */
export function OlcumEntegrasyonlari({ projeId }: { projeId: string }) {
  const [z, setZ] = useState<{ ga4: string; metaPixel: string; onaysiz: boolean } | null>(null);
  const [g, setG] = useState({ ga4: "", metaPixel: "" });
  const [is, setIs] = useState(false);
  const [hata, setHata] = useState("");
  const [tamam, setTamam] = useState(false);
  const kok = `/api/build/bulut/${projeId}/ayar`;
  useEffect(() => { api<{ ayar: { izleme: { ga4: string; metaPixel: string; onaysiz: boolean } } }>(kok).then((x) => { setZ(x.ayar.izleme); setG({ ga4: x.ayar.izleme.ga4, metaPixel: x.ayar.izleme.metaPixel }); }).catch(() => {}); }, [kok]);
  const kaydet = async (yeni: Partial<{ ga4: string; metaPixel: string; onaysiz: boolean }>) => {
    setIs(true); setHata(""); setTamam(false);
    try { const x = await api<{ ayar: { izleme: { ga4: string; metaPixel: string; onaysiz: boolean } } }>(kok, { method: "PATCH", govde: { izleme: yeni } }); setZ(x.ayar.izleme); setTamam(true); setTimeout(() => setTamam(false), 1500); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
    finally { setIs(false); }
  };
  return (
    <Kart ikon={BarChart3} baslik="Google Analytics 4 ve Meta Pixel" alt="Vayra'nın çerezsiz ölçümüne ek olarak; ziyaretçi çerez onayı verince yüklenir">
      {!z ? <div className="flex h-20 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div> : (
        <form onSubmit={(x) => { x.preventDefault(); kaydet(g); }} className="space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 flex items-center gap-2 text-[12.5px] text-white/55">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/google-color.svg" alt="" className="h-3.5 w-3.5" />GA4 ölçüm kimliği</span><input value={g.ga4} onChange={(x) => setG({ ...g, ga4: x.target.value.toUpperCase() })} placeholder="G-XXXXXXXXXX" className={cn(alanSinif, "h-10 font-mono text-[13px]")} /></label>
            <label className="block"><span className="mb-1.5 flex items-center gap-2 text-[12.5px] text-white/55">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/meta-color.svg" alt="" className="h-3.5 w-3.5" />Meta Pixel kimliği</span><input value={g.metaPixel} onChange={(x) => setG({ ...g, metaPixel: x.target.value.replace(/\D/g, "") })} placeholder="123456789012345" className={cn(alanSinif, "h-10 font-mono text-[13px]")} /></label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button disabled={is} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{is ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : tamam ? <Check className="h-3.5 w-3.5" /> : null}Kaydet</button>
            {hata && <span className="text-[12.5px] text-rose-300">{hata}</span>}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.06]">
            <span className="min-w-0"><span className="block text-[13px] text-white">Çerez onayı beklemeden yükle</span><span className="block text-[12px] leading-snug text-white/45">Kapalıyken GA4 analitik onayıyla, Pixel pazarlama onayıyla yüklenir (sitenin çerez bandı: İşletme sekmesi). KVKK için kapalı tutman önerilir.</span></span>
            <Anahtar acik={z.onaysiz} set={(v) => kaydet({ onaysiz: v })} etiket="Onaysız yükle" />
          </div>
          <p className="text-[12px] leading-relaxed text-white/45">Yayındaki site güvenlik için kum havuzunda çalışır ve çerez tutamaz: GA4 çerezsiz kipte (oturum başına ziyaretçi kimliği) çalışır, Meta Pixel tarayıcı çerezi olmadan sayfa görüntüleme ve olayları gönderir. vayra.olay çağrıları ikisine de iletilir. Kimlikler yeniden yayına gerek olmadan bir dakika içinde etkinleşir.</p>
        </form>
      )}
    </Kart>
  );
}
