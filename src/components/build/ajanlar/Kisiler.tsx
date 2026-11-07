"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Fingerprint, GitMerge, Inbox, Loader2, Search, ShieldCheck, StickyNote, Trash2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { KANAL_AD, type Kanal } from "@/lib/build/ajanKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim, alanSinif } from "./AjanDuzenleyici";
import { AjanSimge, BosDurum, KanalSimge, YanPanel, birincil, ikincil, saatYaz } from "./ortak";

type Ozet = { id: string; ad?: string; eposta?: string; telefon?: string; kanallar: Kanal[]; konusma: number; son: number; olusturma: number; not: number; oneri: number; etiketler: string[] };
type Kimlik = { tur: string; deger: string; guclu: boolean; ilk: number; son: number; kanal?: Kanal };
type Konusma = { ajanId: string; dosyaId: string; kanal: Kanal; zaman: number; ilk?: string; ajan: { id: string; ad: string; simge: string } | null; var: boolean; durum: string; mesaj: number; csat?: number; etiketler: string[] };
type Tam = { id: string; ad?: string; olusturma: number; son: number; kimlikler: Kimlik[]; konusmalar: Konusma[]; notlar: { id: string; metin: string; zaman: number; kaynak: string; yazan?: string }[]; etiketler: string[]; ozellikler: Record<string, string>; oneriler: { kisi: string; neden: string; kisiOzet: Ozet }[]; birlesen?: string[] };
const KIMLIK_AD: Record<string, string> = { eposta: "E-posta", telefon: "Telefon", telegram: "Telegram", messenger: "Messenger", instagram: "Instagram", slack: "Slack", discord: "Discord", teams: "Microsoft Teams", line: "LINE", ziyaretci: "Web tarayıcısı", api: "API oturumu", site: "Site sohbeti" };
const DURUM_AD: Record<string, string> = { acik: "Ajanda", devredildi: "Temsilci bekliyor", insan: "Temsilcide", cozuldu: "Çözüldü" };
const goster = (k: Kimlik) => (k.tur === "ziyaretci" || k.tur === "api" ? `•••${k.deger.slice(-6)}` : k.deger);

/** Kişiler: kanallar arası tek kimlik, ortak hafıza, birleştirme ve unutulma hakkı. */
export function Kisiler() {
  const ara0 = useSearchParams();
  const [ara, setAra] = useState("");
  const [kanal, setKanal] = useState("");
  const [oneri, setOneri] = useState(false);
  const [l, setL] = useState<{ kisiler: Ozet[]; toplam: number } | null>(null);
  const [secili, setSecili] = useState<string | null>(ara0.get("id"));
  const yukle = useCallback(() => { const q = new URLSearchParams({ ...(ara.trim() ? { ara: ara.trim() } : {}), ...(kanal ? { kanal } : {}), ...(oneri ? { oneri: "1" } : {}) }); return api<{ kisiler: Ozet[]; toplam: number }>(`/api/build/ajanlar/kisiler?${q}`).then(setL).catch(() => setL({ kisiler: [], toplam: 0 })); }, [ara, kanal, oneri]);
  useEffect(() => { const t = setTimeout(yukle, ara ? 250 : 0); return () => clearTimeout(t); }, [yukle, ara]);
  const kanallar = [...new Set((l?.kisiler ?? []).flatMap((k) => k.kanallar))];
  return (
    <div className="mx-auto max-w-[1180px] px-3 pb-10 pt-16 sm:px-4 md:pt-6">
      <Kart ikon={Fingerprint} baslik="Kişiler" alt="Aynı müşteri e-postada, WhatsApp'ta, web kutusunda ve diğer kanallarda tek kişi; hafızası bütün ajanlarda ortak"
        sag={<>{l && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] tabular-nums text-white/60 max-sm:hidden">{l.toplam} kişi</span>}<Link href="/panel/build/ajanlar/gelen" className={cn(ikincil, "max-sm:px-2.5")}><Inbox className="h-3.5 w-3.5" /><span className="max-sm:hidden">Gelen kutusu</span></Link><Link href="/panel/build/ajanlar" className={cn(ikincil, "max-sm:px-2.5")}><ArrowLeft className="h-3.5 w-3.5" /><span className="max-sm:hidden">Ajanlar</span></Link></>}>
        <div className="grid gap-2 border-b border-white/[0.06] p-3 sm:grid-cols-[1fr_200px_auto]">
          <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ad, e-posta, telefon ya da bilinen bilgide ara" className={cn(alanSinif, "h-10 pl-8 text-[13px]")} /></label>
          <AcilirSecim deger={kanal} set={setKanal} bos="Bütün kanallar" l={kanallar.map((k) => ({ id: k, ad: KANAL_AD[k] ?? k }))} />
          <button type="button" onClick={() => setOneri((x) => !x)} aria-pressed={oneri} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px] ring-1 ring-inset", oneri ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/70 ring-white/[0.08]")}><GitMerge className="h-3.5 w-3.5" />Olası eşleşmeler</button>
        </div>
        {!l ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : l.kisiler.length ? (
          <div className="divide-y divide-white/[0.04]">
            {l.kisiler.map((k) => (
              <button key={k.id} type="button" onClick={() => setSecili(k.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.1] text-[13px] font-semibold text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{(k.ad ?? k.eposta ?? "?").slice(0, 1).toLocaleUpperCase("tr")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-white">{k.ad ?? k.eposta ?? k.telefon ?? "Adı bilinmiyor"}</span>
                  <span className="block truncate text-[12px] text-white/45">{[k.eposta, k.telefon].filter(Boolean).join(" · ") || "İletişim bilgisi yok"}</span>
                </span>
                <span className="flex shrink-0 -space-x-1.5">{k.kanallar.slice(0, 5).map((c) => <span key={c} className="rounded-[10px] ring-2 ring-[#121315]"><KanalSimge k={c} boyut={26} /></span>)}</span>
                <span className="w-[120px] shrink-0 text-right text-[11.5px] text-white/45 max-sm:hidden">{k.konusma} konuşma{k.not ? ` · ${k.not} not` : ""}<span className="block">{gorece(k.son)}</span></span>
                {k.oneri > 0 && <span className="shrink-0 rounded-full bg-amber-400/[0.12] px-2 py-0.5 text-[11px] text-amber-200">{k.oneri} eşleşme</span>}
              </button>
            ))}
          </div>
        ) : <BosDurum ikon={Fingerprint} baslik={ara || kanal || oneri ? "Eşleşen kişi yok" : "Henüz kişi yok"} alt="Ziyaretçiler herhangi bir kanaldan yazınca kendiliğinden kişi kaydı açılır; kanalın doğruladığı kimlik (WhatsApp numarası, e-posta gönderen, sitenin imzaladığı e-posta) aynıysa aynı kişiye bağlanır." />}
      </Kart>
      <KisiPaneli id={secili} kapat={() => setSecili(null)} degisti={yukle} ac={setSecili} />
    </div>
  );
}

function KisiPaneli({ id, kapat, degisti, ac }: { id: string | null; kapat: () => void; degisti: () => void; ac: (id: string) => void }) {
  const [k, setK] = useState<Tam | null>(null);
  const [not, setNot] = useState("");
  const [hata, setHata] = useState("");
  const [sil, setSil] = useState<"" | "kisi" | "hepsi">("");
  const [gidiyor, setGidiyor] = useState("");
  const yukle = useCallback(() => { if (!id) return; api<{ kisi: Tam }>(`/api/build/ajanlar/kisiler?id=${id}`).then((v) => setK(v.kisi)).catch(() => setK(null)); }, [id]);
  useEffect(() => { setK(null); setSil(""); setHata(""); yukle(); }, [yukle]);
  const islem = async (g: Record<string, unknown>) => {
    setGidiyor(String(g.islem)); setHata("");
    try { await api("/api/build/ajanlar/kisiler", { govde: { id, ...g } }); if (g.islem === "sil") { kapat(); } else yukle(); degisti(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yapılamadı."); }
    finally { setGidiyor(""); }
  };
  return (
    <YanPanel acik={!!id} kapat={kapat} genis baslik={k?.ad ?? k?.kimlikler.find((x) => x.tur === "eposta")?.deger ?? "Kişi"} alt={k ? `İlk görülme ${saatYaz(k.olusturma)} · son ${gorece(k.son)}${k.birlesen?.length ? ` · ${k.birlesen.length} kayıt birleşti` : ""}` : undefined}
      alt2={k ? <><span className="flex-1 text-[12px] text-white/40">{sil ? (sil === "hepsi" ? "Kişi ve bütün konuşmaları kalıcı silinecek." : "Kişi silinir, konuşmalar kalır.") : "Unutulma hakkı: kişiyi ve konuşmalarını silebilirsin."}</span>
        <button type="button" onClick={() => (sil === "kisi" ? islem({ islem: "sil" }) : setSil("kisi"))} className={cn(ikincil, sil === "kisi" && "bg-rose-500/[0.14] text-rose-200")}>{sil === "kisi" ? "Onayla" : "Kişiyi sil"}</button>
        <button type="button" onClick={() => (sil === "hepsi" ? islem({ islem: "sil", konusmalar: true }) : setSil("hepsi"))} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300/90 hover:bg-rose-500/[0.1]"><Trash2 className="h-3.5 w-3.5" />{sil === "hepsi" ? "Kalıcı sil" : "Konuşmalarıyla sil"}</button></> : undefined}>
      {!k ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
        <div className="space-y-4">
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
          {k.oneriler.length > 0 && (
            <section className="rounded-[16px] bg-amber-400/[0.06] ring-1 ring-inset ring-amber-300/15">
              <p className="flex items-center gap-2 border-b border-amber-300/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-amber-100"><GitMerge className="h-3.5 w-3.5" />Olası eşleşmeler</p>
              {k.oneriler.map((o) => (
                <div key={o.kisi} className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
                  <button type="button" onClick={() => ac(o.kisi)} className="min-w-0 flex-1 text-left"><span className="block truncate text-[13px] text-white">{o.kisiOzet.ad ?? o.kisiOzet.eposta ?? "Adsız kişi"}</span><span className="block text-[11.5px] text-amber-100/70">{o.neden}</span></button>
                  <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "birlestir", kaynak: o.kisi })} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{gidiyor === "birlestir" && <Loader2 className="h-3 w-3 animate-spin" />}Birleştir</button>
                  <button type="button" disabled={!!gidiyor} onClick={() => islem({ islem: "oneri-reddet", kisi: o.kisi })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Aynı kişi değil</button>
                </div>
              ))}
            </section>
          )}
          <section className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <p className="flex items-center gap-2 border-b border-white/[0.05] px-3.5 py-2.5 text-[12.5px] font-semibold text-white"><Fingerprint className="h-3.5 w-3.5 text-white/55" />Kimlikler</p>
            <ul className="divide-y divide-white/[0.04]">
              {k.kimlikler.map((x) => (
                <li key={`${x.tur}:${x.deger}`} className="flex items-center gap-2.5 px-3.5 py-2">
                  {x.kanal ? <KanalSimge k={x.kanal} boyut={24} /> : <span className="h-6 w-6" />}
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{goster(x)}</span><span className="block text-[11.5px] text-white/45">{KIMLIK_AD[x.tur] ?? x.tur} · {gorece(x.son)}</span></span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", x.guclu ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/55")}>{x.guclu && <ShieldCheck className="h-3 w-3" />}{x.guclu ? "Doğrulanmış" : "Ziyaretçinin yazdığı"}</span>
                  <button type="button" onClick={() => islem({ islem: "kimlik-ayir", tur: x.tur, deger: x.deger })} title="Bu kimliği kişiden ayır" aria-label="Ayır" className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          </section>
          {Object.keys(k.ozellikler).length > 0 && (
            <section className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
              <p className="border-b border-white/[0.05] px-3.5 py-2.5 text-[12.5px] font-semibold text-white">Bilinen bilgiler</p>
              <dl className="divide-y divide-white/[0.04]">{Object.entries(k.ozellikler).map(([a, v]) => <div key={a} className="flex gap-3 px-3.5 py-2 text-[12.5px]"><dt className="sc-kod w-[40%] shrink-0 truncate text-white/50">{a}</dt><dd className="min-w-0 flex-1 break-words text-white/85">{v}</dd></div>)}</dl>
            </section>
          )}
          <section className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <p className="flex items-center gap-2 border-b border-white/[0.05] px-3.5 py-2.5 text-[12.5px] font-semibold text-white"><StickyNote className="h-3.5 w-3.5 text-white/55" />Ortak hafıza</p>
            <ul className="divide-y divide-white/[0.04]">
              {k.notlar.length ? k.notlar.slice().reverse().map((n) => (
                <li key={n.id} className="flex items-start gap-2 px-3.5 py-2"><span className="min-w-0 flex-1"><span className="block text-[13px] leading-relaxed text-white/85">{n.metin}</span><span className="block text-[11px] text-white/40">{n.kaynak === "ajan" ? "Ajan yazdı" : n.yazan ? `${n.yazan} yazdı` : "Temsilci yazdı"} · {gorece(n.zaman)}</span></span><button type="button" onClick={() => islem({ islem: "not-sil", not: n.id })} aria-label="Notu sil" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/35 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button></li>
              )) : <li className="px-3.5 py-2.5 text-[12.5px] text-white/45">Ajanların bu kişi hakkında yazdığı notlar burada toplanır ve bütün kanallarda kullanılır.</li>}
            </ul>
            <form className="flex gap-2 border-t border-white/[0.05] p-2.5" onSubmit={(e) => { e.preventDefault(); if (not.trim()) { islem({ islem: "not", metin: not }); setNot(""); } }}><input value={not} onChange={(e) => setNot(e.target.value)} maxLength={400} placeholder="Ajanların bilmesi gereken bir not ekle" className={cn(alanSinif, "h-9 text-[13px]")} /><button type="submit" disabled={!not.trim()} className={cn(ikincil, "h-9")}>Ekle</button></form>
          </section>
          <section className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <p className="border-b border-white/[0.05] px-3.5 py-2.5 text-[12.5px] font-semibold text-white">Bütün kanallardaki konuşmalar</p>
            <ol className="divide-y divide-white/[0.04]">
              {k.konusmalar.map((c) => (
                <li key={`${c.ajanId}:${c.dosyaId}`}>
                  <Link href={`/panel/build/ajanlar/${c.ajanId}?bolum=konusmalar`} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-white/[0.03]">
                    <span className="relative shrink-0"><KanalSimge k={c.kanal} boyut={30} />{c.ajan && <AjanSimge src={c.ajan.simge} boyut={15} className="absolute -bottom-1 -right-1 ring-2 ring-[#141416]" />}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white/85">{c.ilk || "Mesajsız"}</span><span className="block truncate text-[11.5px] text-white/45">{KANAL_AD[c.kanal]} · {c.ajan?.ad ?? "Silinmiş ajan"} · {c.var ? `${c.mesaj} mesaj · ${DURUM_AD[c.durum] ?? c.durum}` : "Konuşma silinmiş"}</span></span>
                    <span className="shrink-0 text-[11px] text-white/35">{gorece(c.zaman)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </YanPanel>
  );
}
