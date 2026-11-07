"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Inbox, Loader2, MessageSquare, Users } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { KANAL_AD } from "@/lib/build/ajanKatalog";
import { api, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim } from "./AjanDuzenleyici";
import { CalismaPaneli, type CalismaOzetI } from "./Calismalar";
import { KonusmaPaneli, type KonusmaOzetI } from "./Konusmalar";
import { AjanSimge, BosDurum, DurumHapi, birincil, ikincil } from "./ortak";

type GAjan = { id: string; ad: string; simge: string };
type Gorev = { tur: "onay" | "hata" | "tamam"; ajan: GAjan; calisma: CalismaOzetI & { goruldu?: boolean } } | { tur: "devir"; ajan: GAjan; konusma: KonusmaOzetI };
type Veri = { onay: Gorev[]; hata: Gorev[]; tamam: Gorev[]; devir: Gorev[]; sayac: number; ajanlar: GAjan[] };
type Sekme = "bekliyor" | "hata" | "tamam";
const anahtar = (g: Gorev) => (g.tur === "devir" ? `k:${g.ajan.id}:${g.konusma.id}` : `c:${g.ajan.id}:${g.calisma.id}`);

/** Görevler kutusu: bütün ajanlarda onay bekleyenler (toplu onay), temsilci bekleyen konuşmalar, hatalar ve tamamlananlar. */
export function Gorevler() {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<Sekme>("bekliyor");
  const [ajan, setAjan] = useState("");
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [iz, setIz] = useState<{ ajanId: string; id: string } | null>(null);
  const [konusma, setKonusma] = useState<{ ajanId: string; id: string } | null>(null);
  const [mesaj, setMesaj] = useState("");
  const yukle = useCallback(() => api<Veri>("/api/build/ajanlar/gorevler").then(setV).catch(() => setV({ onay: [], hata: [], tamam: [], devir: [], sayac: 0, ajanlar: [] })), []);
  useEffect(() => { yukle(); const t = setInterval(yukle, 20_000); return () => clearInterval(t); }, [yukle]);
  useEffect(() => setSecili(new Set()), [sekme, ajan]);

  const suz = (l: Gorev[]) => l.filter((g) => !ajan || g.ajan.id === ajan);
  const listeler = useMemo(() => (v ? { bekliyor: [...suz(v.onay), ...suz(v.devir)], hata: suz(v.hata), tamam: suz(v.tamam) } : null), [v, ajan]); // eslint-disable-line react-hooks/exhaustive-deps
  const l = listeler?.[sekme] ?? [];
  const onaylar = l.filter((g) => g.tur === "onay");

  const toplu = async (islem: "onayla" | "reddet" | "goruldu", ogeler: Gorev[], hep = false) => {
    const o = ogeler.filter((g): g is Extract<Gorev, { calisma: unknown }> => g.tur !== "devir").map((g) => ({ ajanId: g.ajan.id, calisma: g.calisma.id }));
    if (!o.length) return;
    setGidiyor(islem + (o.length === 1 ? o[0].calisma : "")); setMesaj("");
    try {
      const r = await api<{ sonuclar: { hata?: string; durum?: string }[] }>("/api/build/ajanlar/gorevler", { govde: { islem, ogeler: o, hep } });
      const hatali = r.sonuclar.filter((x) => x.hata).length;
      if (islem !== "goruldu") setMesaj(hatali ? `${o.length - hatali} işlem sürdü, ${hatali} işlem yapılamadı.` : o.length > 1 ? `${o.length} işlem ${islem === "onayla" ? "onaylandı" : "reddedildi"}.` : "");
      setSecili(new Set()); setIz(null);
      await yukle();
    } finally { setGidiyor(null); }
  };
  const ac = (g: Gorev) => {
    if (g.tur === "devir") { setKonusma({ ajanId: g.ajan.id, id: g.konusma.id }); return; }
    setIz({ ajanId: g.ajan.id, id: g.calisma.id });
    if (g.tur === "hata" && !g.calisma.goruldu) toplu("goruldu", [g]);
  };
  const secimDegistir = (g: Gorev) => setSecili((s) => { const x = new Set(s); const k = anahtar(g); if (x.has(k)) x.delete(k); else x.add(k); return x; });
  const seciliOnaylar = onaylar.filter((g) => secili.has(anahtar(g)));
  const acikGorev = iz && v ? [...v.onay, ...v.hata, ...v.tamam].find((g) => g.tur !== "devir" && g.ajan.id === iz.ajanId && g.calisma.id === iz.id) : undefined;

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <Kart ikon={Inbox} baslik="Görevler" alt="Onayını bekleyen işler, temsilci bekleyen konuşmalar, hatalar ve kendiliğinden biten çalışmalar"
        sag={<><Link href="/panel/build/ajanlar" className={cn(ikincil, "max-sm:hidden")}><ArrowLeft className="h-3.5 w-3.5" />Ajanlar</Link><Link href="/panel/build/ajanlar" aria-label="Ajanlara dön" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white sm:hidden"><ArrowLeft className="h-4 w-4" /></Link></>}
        altSerit={sekme === "bekliyor" && onaylar.length > 0 ? (
          <>
            <button type="button" onClick={() => setSecili(seciliOnaylar.length === onaylar.length ? new Set() : new Set(onaylar.map(anahtar)))} className="text-[12.5px] text-white/60 hover:text-white">{seciliOnaylar.length === onaylar.length ? "Seçimi kaldır" : "Tümünü seç"}</button>
            <span className="text-[12.5px] tabular-nums text-white/45">{seciliOnaylar.length ? `${seciliOnaylar.length} seçili` : "Toplu işlem için satır seç"}</span>
            <span className="flex-1" />
            {mesaj && <span className="text-[12.5px] text-[#8be6ff]">{mesaj}</span>}
            <button type="button" disabled={!seciliOnaylar.length || !!gidiyor} onClick={() => toplu("reddet", seciliOnaylar)} className={ikincil}>Reddet</button>
            <button type="button" disabled={!seciliOnaylar.length || !!gidiyor} onClick={() => toplu("onayla", seciliOnaylar)} className={birincil}>{gidiyor === "onayla" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Seçilenleri onayla</button>
          </>
        ) : sekme === "hata" && l.some((g) => g.tur === "hata" && !g.calisma.goruldu) ? (
          <><span className="flex-1 text-[12.5px] text-white/45">Görülmemiş hatalar bildirim sayısına girer</span><button type="button" onClick={() => toplu("goruldu", l.filter((g) => g.tur === "hata" && !g.calisma.goruldu))} className={ikincil}>Tümünü görüldü say</button></>
        ) : undefined}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <Suzgec id="gorev-sekme" deger={sekme} set={setSekme} l={[{ id: "bekliyor" as const, ad: "Girdi bekliyor", sayi: listeler?.bekliyor.length ?? 0 }, { id: "hata" as const, ad: "Hatalı", sayi: listeler?.hata.length ?? 0 }, { id: "tamam" as const, ad: "Tamamlandı", sayi: listeler?.tamam.length ?? 0 }]} />
          <div className="ml-auto w-[220px] max-sm:w-full"><AcilirSecim deger={ajan} set={setAjan} bos="Bütün ajanlar" l={(v?.ajanlar ?? []).map((a) => ({ id: a.id, ad: a.ad, gorsel: a.simge }))} /></div>
        </div>
        {!v ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !l.length ? (
          sekme === "bekliyor" ? <BosDurum ikon={CheckCircle2} baslik="Bekleyen bir şey yok" alt="Zamanlanmış ya da web kancasıyla çalışan bir ajan onay gerektiren bir araç kullanmak isteyince ya da bir konuşma insana devredilince burada görünür." />
            : sekme === "hata" ? <BosDurum ikon={CheckCircle2} baslik="Hata yok" alt="Son 30 günde paylaşım sayfası, web kutusu, API, Telegram, WhatsApp, zamanlama ya da web kancası çalışmalarında hata olmadı." />
              : <BosDurum ikon={Inbox} baslik="Henüz kendiliğinden biten iş yok" alt="Bir ajana zamanlama ya da web kancası kur; her çalışmanın çıktısı burada birikir."><Link href="/panel/build/ajanlar" className={birincil}>Ajanlara git</Link></BosDurum>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {l.map((g) => {
              const k = anahtar(g);
              const sec = secili.has(k);
              return (
                <div key={k} className={cn("relative flex items-start gap-3 px-4 py-3.5 transition-colors sm:px-5", sec ? "bg-white/[0.04] ring-1 ring-inset ring-white" : "hover:bg-white/[0.02]")}>
                  {g.tur === "onay" && <button type="button" onClick={() => secimDegistir(g)} aria-pressed={sec} aria-label="Seç" className={cn("mt-2.5 h-[18px] w-[18px] shrink-0 rounded-full ring-2 ring-inset transition", sec ? "bg-white ring-white" : "ring-white/25 hover:ring-white/50")} />}
                  <AjanSimge src={g.ajan.simge} boyut={38} className="mt-0.5" />
                  <button type="button" onClick={() => ac(g)} className="min-w-0 flex-1 text-left">
                    {g.tur === "devir" ? (
                      <>
                        <span className="flex items-center gap-2"><span className="truncate text-[13.5px] font-medium text-white">{g.konusma.iletisim?.ad ?? "Ziyaretçi"} temsilci bekliyor</span>{g.konusma.okunmadi && <span className="h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" />}</span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-white/60">{g.konusma.devir?.neden ?? g.konusma.son}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/40"><Users className="h-3 w-3" />{g.ajan.ad} · {KANAL_AD[g.konusma.kaynak]} · {gorece(g.konusma.guncelleme)}</span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium text-white">{g.tur === "onay" ? `${(g.calisma.bekleyen ?? ["Araç"]).join(", ")} onayını bekliyor` : g.tur === "hata" ? (g.calisma.hata ?? "Çalışma hatayla bitti") : g.calisma.tetik?.ad ?? "Çalışma tamamlandı"}</span>
                          {g.tur === "hata" && !g.calisma.goruldu && <span className="h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" />}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-white/60">{g.tur === "tamam" ? g.calisma.cikti || "Boş çıktı" : g.calisma.girdi}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/40">{g.tur === "hata" ? <AlertTriangle className="h-3 w-3 text-rose-300/80" /> : <MessageSquare className="h-3 w-3" />}{g.ajan.ad} · {g.calisma.tetik?.ad ?? KANAL_AD[g.calisma.kanal]} · {gorece(g.calisma.baslangic)}</span>
                      </>
                    )}
                  </button>
                  {g.tur === "onay" ? (
                    <span className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                      <button type="button" disabled={!!gidiyor} onClick={() => toplu("reddet", [g])} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Reddet</button>
                      <button type="button" disabled={!!gidiyor} onClick={() => toplu("onayla", [g])} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{gidiyor === `onayla${g.calisma.id}` && <Loader2 className="h-3 w-3 animate-spin" />}Onayla</button>
                    </span>
                  ) : g.tur === "devir" ? <DurumHapi d="devredildi" className="mt-1" /> : <DurumHapi d={g.calisma.durum} className="mt-1" />}
                </div>
              );
            })}
          </div>
        )}
      </Kart>
      <CalismaPaneli ajanId={iz?.ajanId ?? ""} calismaId={iz?.id ?? null} kapat={() => setIz(null)}
        eylemler={acikGorev?.tur === "onay" ? () => (
          <>
            <span className="flex-1" />
            <button type="button" disabled={!!gidiyor} onClick={() => toplu("reddet", [acikGorev])} className={ikincil}>Reddet</button>
            <button type="button" disabled={!!gidiyor} onClick={() => toplu("onayla", [acikGorev], true)} className={ikincil}>Onayla, bir daha sorma</button>
            <button type="button" disabled={!!gidiyor} onClick={() => toplu("onayla", [acikGorev])} className={birincil}>{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Onayla</button>
          </>
        ) : undefined} />
      <KonusmaPaneli ajanId={konusma?.ajanId ?? ""} konusmaId={konusma?.id ?? null} kapat={() => { setKonusma(null); yukle(); }} />
    </div>
  );
}
