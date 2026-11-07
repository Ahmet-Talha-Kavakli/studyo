"use client";

import { dilimZaman } from "@/lib/build/bolge";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, CalendarClock, Clock, Copy, FlaskConical, Heading1, Image as ImageIcon, Laptop, Link2, Mail, Minus, MousePointerClick, Newspaper, PenLine, Pilcrow, Plus, Send, Smartphone, Trash2, Users, Wand2, X,
} from "lucide-react";
import { HAFTA_GUN, type KonuDeneyi, type SaatProfili } from "@/lib/build/buyumeEkTipler";
import { gorece } from "@/lib/build/istemci";
import {
  BLOKLAR, ETIKETLER_EPOSTA, kampanyaHtml, kimlikUret, kitleHesapla, konuIpuclari, suzgecOzeti, type Blok, type BlokTur, type KampanyaOzet, type MarkaOzet, type Suzgec,
} from "@/lib/build/buyumeEkTipler";
import { TONLAR } from "@/lib/build/buyumeTipler";
import { cn } from "@/lib/utils";
import { Secici } from "./ortak";
import { alan, birincil, Cip, Etiket, Halka, HataSatiri, ikincil, Kart, ModelYokKart, Rozet, SecenekMenusu, simgeDugme, Suruyor, YanPanel } from "./ortak";
import { ModelYokEk } from "./useBuyumeEk";
import { SuzgecCubugu } from "./Kisiler";
import type { BolumProps } from "./BuyumeSekme";

const BLOK_SIMGE: Record<BlokTur, typeof Mail> = { baslik: Heading1, metin: Pilcrow, dugme: MousePointerClick, gorsel: ImageIcon, ayirici: Minus };
const DURUM: Record<KampanyaOzet["durum"], { ad: string; ton: "soluk" | "notr" | "aksan" | "amber" | "rose" }> = { taslak: { ad: "Taslak", ton: "soluk" }, zamanlandi: { ad: "Zamanlandı", ton: "amber" }, gonderiliyor: { ad: "Gönderiliyor", ton: "aksan" }, gonderildi: { ad: "Gönderildi", ton: "notr" }, durdu: { ad: "Durduruldu", ton: "rose" } };
const oran = (a: number, b: number) => (b ? `yüzde ${Math.round((a / b) * 100)}` : "yok");

export function markaOzetiIstemci(p: BolumProps["p"], e: BolumProps["e"]): MarkaOzet {
  const m = e.d?.ek.marka;
  return { site: p.ad, renk: m?.renkler[0]?.hex ?? "#111111", logo: m?.logo, iletisim: m?.iletisim?.trim() || undefined, yazi: m?.govdeYazi ? `${m.govdeYazi},-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif` : undefined, koken: typeof location !== "undefined" ? location.origin : "" };
}

export function EpostaBolumu(pr: BolumProps) {
  const { e, git } = pr;
  const d = e.d!;
  const [acik, setAcik] = useState<string | null>(null);
  const [amac, setAmac] = useState("");
  const [ton, setTon] = useState("samimi");
  const [tonOzel, setTonOzel] = useState("");
  const [segment, setSegment] = useState("tum");
  const [hata, setHata] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [alternatif, setAlternatif] = useState<string[]>([]);
  const [yeni, setYeni] = useState(false);
  const k = d.ek.kampanyalar.find((x) => x.id === acik) ?? null;
  const yaziyor = e.suruyor("kampanya-yaz");
  const seg = d.ek.segmentler.find((x) => x.id === segment);
  const suzgec: Suzgec = seg ? seg.suzgec : segment === "abone" ? { kaynak: ["abone", "bio"], izin: "tum" } : { izin: "tum" };
  const [bultenPanel, setBultenPanel] = useState(false);
  const [bulten, setBulten] = useState({ yazi: 3, urun: 3, baslik: "", sonGun: 30 });
  const bultenKur = async () => { setHata(""); try { const j = await e.islem("bulten-olustur", bulten, "bulten"); setBultenPanel(false); setAcik(String(j.kampanyaId)); } catch (x) { setHata(x instanceof Error ? x.message : "Bülten kurulamadı."); } };
  const aboneSayi = d.kisiler.filter((x) => x.eposta && (x.kaynaklar.includes("abone") || x.kaynaklar.includes("bio"))).length;

  const yaz = async () => {
    setHata(""); setModelYok(false);
    try {
      const j = await e.islem("kampanya-yaz", { amac: amac.trim(), kitle: seg ? `${seg.ad}: ${suzgecOzeti(seg.suzgec)}` : "Bütün kişiler", ton: ton === "ozel" ? tonOzel : TONLAR.find((t) => t.id === ton)?.ad, suzgec, segmentId: seg?.id });
      setAmac(""); setAlternatif((j.alternatifler as string[]) ?? []); setAcik(String(j.kampanyaId));
    } catch (x) { if (x instanceof ModelYokEk) setModelYok(true); else setHata(x instanceof Error ? x.message : "Yazılamadı."); }
  };
  const bos = async () => { setHata(""); setYeni(true); try { const j = await e.duzenle("kampanya", { kampanya: { ad: "Yeni kampanya", bloklar: [{ tur: "baslik", metin: "" }, { tur: "metin", metin: "Merhaba {ad},\n\n" }, { tur: "dugme", metin: "Siteye git", adres: d.site }], suzgec } }); setAcik((j.ek as { kampanyalar: KampanyaOzet[] }).kampanyalar[0].id); } catch (x) { setHata(x instanceof Error ? x.message : "Oluşturulamadı."); } finally { setYeni(false); } };

  if (k) return <KampanyaDuzenleyici pr={pr} k={k} geri={() => { setAcik(null); setAlternatif([]); }} alternatifler={alternatif} />;

  const gonderilen = d.ek.kampanyalar.filter((x) => x.sayac.gonderildi);
  const top = gonderilen.reduce((t, x) => ({ g: t.g + x.sayac.gonderildi, a: t.a + x.sayac.acilan, t: t.t + x.sayac.tiklayan, c: t.c + x.sayac.cikan }), { g: 0, a: 0, t: 0, c: 0 });
  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex flex-wrap items-center gap-2">E-posta kampanyaları<Rozet ton={d.eposta.kurulu ? "aksan" : "amber"}>{d.eposta.kurulu ? (d.eposta.deneme ? "Yerel deneme gönderimi" : "Gönderim açık") : "Servis kurulu değil"}</Rozet></span>}
        aciklama="Kişilerine markalı bülten ve duyuru gönder. Açılma ve tık izlenir; her iletide abonelikten çıkma bağlantısı ve tek tık çıkma başlığı bulunur.">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-4">
          {[["Gönderilen", top.g.toLocaleString("tr-TR")], ["Açılma", oran(top.a, top.g)], ["Tıklama", oran(top.t, top.g)], ["Abonelikten çıkma", oran(top.c, top.g)]].map(([a, v]) => <div key={a} className="bg-[#141518] px-3.5 py-3"><dt className="text-[11.5px] text-white/45">{a}</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{v}</dd></div>)}
        </dl>
      </Kart>
      {!d.eposta.kurulu && <ServisUyari />}
      {!d.ek.marka?.iletisim?.trim() && (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-amber-400/[0.05] px-3.5 py-3 ring-1 ring-inset ring-amber-300/15">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" /><p className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed text-white/75">Ticari iletide gönderenin adı ve iletişim bilgisi zorunlu (6563 sayılı Kanun). Marka kitine işletme adını ve adresini yaz; her e-postanın altına eklenir.</p>
          <button type="button" onClick={() => git("marka")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Marka kitini aç</button>
        </div>
      )}

      <div className="cam-istemci rounded-[22px] p-3">
        <textarea value={amac} onChange={(x) => setAmac(x.target.value)} onKeyDown={(x) => { if (x.key === "Enter" && !x.shiftKey && amac.trim() && !yaziyor) { x.preventDefault(); yaz(); } }} rows={2} maxLength={400}
          placeholder="Ne duyuralım? Yeni sezon çekirdekleri geldi, hafta sonu yüzde 10 indirim, yeni şube açılıyor" className="w-full resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/40" />
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <SecenekMenusu genislik={300} baslik="Kime gidecek" deger={segment} sec={setSegment} l={[{ id: "tum", ad: "Bütün kişiler", alt: `${d.kisiler.filter((x) => x.eposta).length} e-postalı kişi`, logo: <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-white/[0.07]"><Users className="h-3.5 w-3.5 text-white/75" /></span> }, { id: "abone", ad: "Bülten aboneleri", alt: `${aboneSayi} kişi: İşletme aboneleri ve bio sayfası`, logo: <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-white/[0.07]"><Newspaper className="h-3.5 w-3.5 text-white/75" /></span> }, ...d.ek.segmentler.map((x) => ({ id: x.id, ad: x.ad, alt: suzgecOzeti(x.suzgec) }))]}
            tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3"><Users className="h-3.5 w-3.5 text-white/50" />{seg?.ad ?? (segment === "abone" ? "Bülten aboneleri" : "Bütün kişiler")}</Cip>} />
          <SecenekMenusu genislik={280} baslik="Ton" deger={ton} sec={setTon} l={TONLAR.filter((t) => t.id !== "ozel").map((t) => ({ id: t.id, ad: t.ad, alt: t.alt }))} ozel={{ deger: tonOzel, set: setTonOzel, yer: "Tonu tarif et", alt: "Tonu kendin tarif et" }}
            tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{ton === "ozel" ? tonOzel || "Özel ton" : TONLAR.find((t) => t.id === ton)?.ad}</Cip>} />
          <button type="button" onClick={() => setBultenPanel(true)} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white"><Newspaper className="h-3.5 w-3.5" />Bülten oluştur</button>
          <button type="button" disabled={yeni} onClick={bos} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white disabled:opacity-60">{yeni ? <span className="build-nokta" /> : <PenLine className="h-3.5 w-3.5" />}Kendim yazarım</button>
          <button type="button" disabled={!amac.trim() || yaziyor} onClick={yaz} className={cn(birincil, "h-9")}>{yaziyor ? <span className="build-nokta" /> : <Wand2 className="h-4 w-4" />}{yaziyor ? "Yazılıyor" : "Yaz"}</button>
        </div>
      </div>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {modelYok && <ModelYokKart tekrar={() => setModelYok(false)} />}
      {yaziyor && <Suruyor metin="Kampanya yazılıyor" alt="Ajan siteni, marka kitini ve kitleyi okuyup konu satırı, giriş ve çağrı yazıyor." />}

      <EnIyiSaat prof={d.saatProfili} />
      <YanPanel acik={bultenPanel} kapat={() => setBultenPanel(false)} baslik="Bülten oluştur" alt="İşletme'nin son yazılarından ve ürünlerinden"
        alt2={<><button type="button" onClick={() => setBultenPanel(false)} className={cn(ikincil, "ml-auto")}>Vazgeç</button><button type="button" disabled={e.suruyor("bulten")} onClick={bultenKur} className={birincil}>{e.suruyor("bulten") ? <span className="build-nokta" /> : <Newspaper className="h-3.5 w-3.5" />}Oluştur</button></>}>
        <div className="space-y-4">
          <p className="text-[12.5px] leading-relaxed text-white/60">Yayındaki blog yazıları görsel, özet ve "Yazıyı oku" düğmesiyle; mağazanın etkin ürünleri görsel ve fiyatla eklenir. Kitle bülten aboneleridir (İşletme aboneleri ve bio sayfası); düzenleyicide değiştirebilirsin.</p>
          <Etiket ad="Başlık (isteğe bağlı)"><input value={bulten.baslik} onChange={(x) => setBulten({ ...bulten, baslik: x.target.value })} placeholder={`${pr.p.ad} bülteni`} className={cn(alan, "h-9")} /></Etiket>
          {([["yazi", "Yazı sayısı"], ["urun", "Ürün sayısı"]] as const).map(([k, ad]) => <div key={k}><p className="mb-1.5 text-[12.5px] text-white/60">{ad}</p><Secici id={`bulten-${k}`} kucuk deger={String(bulten[k]) as "0"} set={(v) => setBulten({ ...bulten, [k]: Number(v) })} l={["0", "1", "2", "3", "4", "6"].map((n) => ({ id: n as "0", ad: n === "0" ? "Yok" : n }))} /></div>)}
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Yazılar hangi dönemden</p><Secici id="bulten-gun" kucuk deger={String(bulten.sonGun) as "30"} set={(v) => setBulten({ ...bulten, sonGun: Number(v) })} l={[{ id: "7" as "30", ad: "Son 7 gün" }, { id: "30" as "30", ad: "Son 30 gün" }, { id: "90" as "30", ad: "Son 90 gün" }, { id: "0" as "30", ad: "Hepsi" }]} /></div>
          <p className="text-[12px] text-white/45">{aboneSayi} bülten abonesi var.</p>
        </div>
      </YanPanel>

      <Kart baslik={<span className="flex items-center gap-2">Kampanyalar<Rozet>{d.ek.kampanyalar.length}</Rozet></span>}>
        {d.ek.kampanyalar.length ? (
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {d.ek.kampanyalar.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => setAcik(x.id)} className="flex w-full flex-wrap items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.03] sm:flex-nowrap">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06]"><Mail className="h-4 w-4 text-white/70" /></span>
                  <span className="min-w-[180px] flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/50">{x.konu || "Konu satırı yok"}</span></span>
                  <Rozet ton={DURUM[x.durum].ton}>{x.durum === "gonderiliyor" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#55d6fd]" />}{DURUM[x.durum].ad}</Rozet>
                  <span className="w-[200px] shrink-0 text-right text-[12px] tabular-nums text-white/55 max-sm:w-auto max-sm:text-left">
                    {x.sayac.gonderildi ? `${x.sayac.gonderildi} kişi, açılma ${oran(x.sayac.acilan, x.sayac.gonderildi)}` : x.durum === "zamanlandi" && x.zaman ? new Date(x.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : gorece(x.guncelleme)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="text-[12.5px] text-white/50">Henüz kampanya yok. Yukarıya ne duyurmak istediğini yaz ya da kendin başla.</p>}
      </Kart>
    </div>
  );
}

function ServisUyari() {
  return (
    <div className="rounded-[16px] bg-amber-400/[0.05] p-4 ring-1 ring-inset ring-amber-300/15">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-amber-300/[0.1]"><Mail className="h-4 w-4 text-amber-200" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-white">E-posta servisi kurulu değil</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">Kampanya yazabilir, önizleyebilir ve zamanlamayı hazırlayabilirsin; ama hiçbir ileti gönderilmez. Göndermek için yöneticinin sunucuya <code className="sc-kod rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 text-[11.5px] text-white">RESEND_API_KEY</code> ve doğrulanmış alan adından bir gönderen (<code className="sc-kod rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 text-[11.5px] text-white">BUILD_EPOSTA_GONDEREN</code>) eklemesi gerekir. Toplu gönderimde Gmail ve Yahoo, alan adında SPF, DKIM ve DMARC ister.</p>
        </div>
      </div>
    </div>
  );
}

/* ── Düzenleyici ve rapor ── */
function KampanyaDuzenleyici({ pr, k, geri, alternatifler }: { pr: BolumProps; k: KampanyaOzet; geri: () => void; alternatifler: string[] }) {
  const { p, b, e, git } = pr;
  const d = e.d!;
  const duzenlenebilir = k.durum === "taslak";
  const [t, setT] = useState({ ad: k.ad, konu: k.konu, onMetin: k.onMetin, bloklar: k.bloklar, suzgec: k.suzgec, segmentId: k.segmentId, izinsizKat: !!k.izinsizKat, ab: k.ab as KonuDeneyi | undefined, saatKip: k.saatKip });
  const [kirli, setKirli] = useState(false);
  const [cihaz, setCihaz] = useState<"masaustu" | "telefon">("masaustu");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [deneme, setDeneme] = useState("");
  const [zaman, setZaman] = useState("");
  const [beyan, setBeyan] = useState(false);
  const [gonderPanel, setGonderPanel] = useState(false);
  const [gorselSec, setGorselSec] = useState<string | null>(null);
  const son = useRef(k.id);
  useEffect(() => { if (son.current !== k.id || !kirli) { son.current = k.id; setT({ ad: k.ad, konu: k.konu, onMetin: k.onMetin, bloklar: k.bloklar, suzgec: k.suzgec, segmentId: k.segmentId, izinsizKat: !!k.izinsizKat, ab: k.ab, saatKip: k.saatKip }); setKirli(false); } }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  const degis = (y: Partial<typeof t>) => { setT((x) => ({ ...x, ...y })); setKirli(true); };
  const blokDegis = (id: string, y: Partial<Blok>) => degis({ bloklar: t.bloklar.map((x) => (x.id === id ? { ...x, ...y } : x)) });
  const tasi = (i: number, n: number) => { const l = [...t.bloklar]; const [x] = l.splice(i, 1); l.splice(i + n, 0, x); degis({ bloklar: l }); };
  const kaydet = async () => { if (!kirli) return true; try { await e.duzenle("kampanya", { kampanya: { id: k.id, ...t } }); setKirli(false); return true; } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); return false; } };
  const yap = async (f: () => Promise<unknown>, ok?: string) => { setHata(""); setBilgi(""); try { await f(); if (ok) setBilgi(ok); } catch (x) { setHata(x instanceof Error ? x.message : "İşlem yapılamadı."); } };

  const marka = markaOzetiIstemci(p, e);
  const html = useMemo(() => kampanyaHtml(t, marka, { ad: "Ayşe", eposta: "ayse@ornek.com", davetKodu: "AYS3K2", davetBaglantisi: `${d.site}?davet=AYS3K2` }), [t, marka.renk, marka.logo, marka.iletisim, marka.yazi, d.site]); // eslint-disable-line react-hooks/exhaustive-deps
  const kitle = kitleHesapla(d.kisiler, t, d.ek);
  const ipucu = konuIpuclari(t.konu);
  const gorseller = (b.veri?.gonderiler ?? []).filter((g) => g.gorsel).slice(0, 24);

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex min-w-0 items-center gap-2"><button type="button" onClick={async () => { await kaydet(); geri(); }} className={cn(simgeDugme, "-ml-1.5")} aria-label="Kampanyalara dön"><ArrowLeft className="h-4 w-4" /></button>
        {duzenlenebilir ? <input value={t.ad} onChange={(x) => degis({ ad: x.target.value })} maxLength={80} className="min-w-0 flex-1 bg-transparent text-[14.5px] font-semibold text-white outline-none" /> : <span className="truncate">{k.ad}</span>}<Rozet ton={DURUM[k.durum].ton}>{DURUM[k.durum].ad}</Rozet></span>}
        aciklama={k.durum === "zamanlandi" && k.zaman ? `${new Date(k.zaman).toLocaleString("tr-TR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} gönderilecek. Sunucu açık olduğu sürece zamanında gider.` : k.gonderimBas ? `${new Date(k.gonderimBas).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} gönderimi başladı` : `Son değişiklik ${gorece(k.guncelleme)}${k.model ? `, ${k.model} yazdı` : ""}`}
        sag={<>
          <button type="button" onClick={() => yap(() => e.islem("kopyala", { kampanyaId: k.id }), "Kopyası oluşturuldu; listede.")} className={simgeDugme} title="Kopyala" aria-label="Kampanyayı kopyala"><Copy className="h-4 w-4" /></button>
          {k.durum !== "gonderiliyor" && <button type="button" onClick={() => yap(async () => { await e.duzenle("kampanyaSil", { id: k.id }); geri(); })} className={cn(simgeDugme, "hover:text-rose-200")} title="Sil" aria-label="Kampanyayı sil"><Trash2 className="h-4 w-4" /></button>}
          {(k.durum === "zamanlandi" || k.durum === "gonderiliyor") && <button type="button" onClick={() => yap(() => e.islem("iptal", { kampanyaId: k.id }))} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{k.durum === "zamanlandi" ? "Zamanlamayı iptal et" : "Durdur"}</button>}
          {duzenlenebilir && <button type="button" disabled={!kirli} onClick={() => yap(kaydet, "Kaydedildi.")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Kaydet</button>}
          {duzenlenebilir && <button type="button" onClick={async () => { if (await kaydet()) setGonderPanel(true); }} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Send className="h-3.5 w-3.5" />Gönder</button>}
        </>} />
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {bilgi && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}
      {k.hata && <HataSatiri mesaj={k.hata} />}
      {k.sayac.toplam > 0 && <KampanyaRaporu k={k} kazan={(v) => yap(() => e.islem("ab-kazanan", { kampanyaId: k.id, kazanan: v }), "Kazanan konu kalan alıcılara gidiyor.")} />}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Kart baslik="İleti">
            <div className="space-y-3">
              <Etiket ad="Konu satırı" sag={<span className={cn("text-[11.5px] tabular-nums", [...t.konu].length > 60 ? "text-amber-200/90" : "text-white/40")}>{[...t.konu].length} karakter</span>}>
                <input disabled={!duzenlenebilir} value={t.konu} onChange={(x) => degis({ konu: x.target.value })} maxLength={150} placeholder="{ad}, bu hafta yeni çekirdek geldi" className={cn(alan, "h-10")} />
              </Etiket>
              {!!t.konu && <ul className="flex flex-wrap gap-1.5">{ipucu.map((x) => <li key={x.metin}><Rozet ton={x.iyi ? "aksan" : "amber"} className="h-6 text-[11px]">{x.metin}</Rozet></li>)}</ul>}
              {duzenlenebilir && alternatifler.length > 0 && (
                <div className="rounded-[12px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]"><p className="mb-1.5 text-[11.5px] text-white/45">Başka konu satırları</p>
                  <div className="flex flex-wrap gap-1.5">{alternatifler.map((a) => <button key={a} type="button" onClick={() => degis({ konu: a })} className={cn("rounded-full px-2.5 py-1 text-left text-[12px] transition-colors", t.konu === a ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/75 hover:text-white")}>{a}</button>)}</div></div>
              )}
              <Etiket ad="Önizleme metni" sag={<span className="text-[11.5px] text-white/40">Gelen kutusunda konunun yanında</span>}>
                <input disabled={!duzenlenebilir} value={t.onMetin} onChange={(x) => degis({ onMetin: x.target.value })} maxLength={150} className={cn(alan, "h-10")} />
              </Etiket>
            </div>
          </Kart>
          <Kart baslik="İçerik" aciklama={<>Kişiselleştirme: {ETIKETLER_EPOSTA.map((x) => <code key={x} className="sc-kod mr-1 rounded-[5px] bg-white/[0.07] px-1 text-[11px] text-white/80">{x}</code>)}</>}>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {t.bloklar.map((x, i) => {
                  const I = BLOK_SIMGE[x.tur];
                  return (
                    <motion.li key={x.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
                      <div className="mb-2 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-white/[0.07]"><I className="h-3.5 w-3.5 text-white/75" /></span><span className="flex-1 text-[12px] text-white/55">{BLOKLAR.find((y) => y.id === x.tur)?.ad}</span>
                        {duzenlenebilir && <><button type="button" disabled={i === 0} onClick={() => tasi(i, -1)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Yukarı"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" disabled={i === t.bloklar.length - 1} onClick={() => tasi(i, 1)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Aşağı"><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => degis({ bloklar: t.bloklar.filter((y) => y.id !== x.id) })} className={cn(simgeDugme, "h-7 w-7 hover:text-rose-200")} aria-label="Bloğu sil"><X className="h-3.5 w-3.5" /></button></>}
                      </div>
                      {x.tur === "baslik" && <input disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => blokDegis(x.id, { metin: y.target.value })} placeholder="Başlık" className={cn(alan, "h-10 text-[15px] font-semibold")} />}
                      {x.tur === "metin" && <textarea disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => blokDegis(x.id, { metin: y.target.value })} rows={Math.min(10, Math.max(3, (x.metin ?? "").split("\n").length + 1))} className={cn(alan, "resize-y py-2.5 leading-relaxed")} />}
                      {x.tur === "dugme" && <div className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><input disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => blokDegis(x.id, { metin: y.target.value })} placeholder="Düğme yazısı" className={cn(alan, "h-9")} /><input disabled={!duzenlenebilir} value={x.adres ?? ""} onChange={(y) => blokDegis(x.id, { adres: y.target.value })} placeholder="https://" className={cn(alan, "h-9")} /></div>}
                      {x.tur === "gorsel" && (
                        <div className="flex items-center gap-2.5">
                          <span className="h-14 w-20 shrink-0 overflow-hidden rounded-[9px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">{x.gorsel && /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.gorsel} alt="" className="h-full w-full object-cover" />}</span>
                          <div className="min-w-0 flex-1 space-y-1.5"><input disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => blokDegis(x.id, { metin: y.target.value })} placeholder="Görsel açıklaması" className={cn(alan, "h-8 text-[12.5px]")} /><input disabled={!duzenlenebilir} value={x.adres ?? ""} onChange={(y) => blokDegis(x.id, { adres: y.target.value })} placeholder="Tıklayınca gidilecek adres (isteğe bağlı)" className={cn(alan, "h-8 text-[12.5px]")} /></div>
                          {duzenlenebilir && <button type="button" onClick={() => setGorselSec(x.id)} className={cn(ikincil, "h-8 px-3 text-[12px]")}>Seç</button>}
                        </div>
                      )}
                      {x.tur === "ayirici" && <div className="h-px bg-white/10" />}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            {duzenlenebilir && <div className="mt-2.5 flex flex-wrap gap-1">{BLOKLAR.map((x) => { const I = BLOK_SIMGE[x.id]; return <button key={x.id} type="button" title={x.alt} onClick={() => degis({ bloklar: [...t.bloklar, { id: kimlikUret(), tur: x.id, metin: x.id === "dugme" ? "Siteye git" : "", adres: x.id === "dugme" ? d.site : undefined }] })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"><Plus className="h-3 w-3" /><I className="h-3.5 w-3.5" />{x.ad}</button>; })}</div>}
          </Kart>
          <Kart baslik="Kitle" aciklama="Pazarlama e-postası yalnız ticari ileti onayı olanlara gider. Reddedenler ve abonelikten çıkanlar hiçbir zaman almaz.">
            {duzenlenebilir && (
              <div className="mb-3 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[{ id: "", ad: "Bütün kişiler" }, ...d.ek.segmentler.map((x) => ({ id: x.id, ad: x.ad }))].map((x) => <button key={x.id || "tum"} type="button" onClick={() => degis({ segmentId: x.id || undefined, suzgec: x.id ? d.ek.segmentler.find((y) => y.id === x.id)!.suzgec : { izin: "tum" } })} className={cn("h-8 rounded-full px-3 text-[12.5px]", (t.segmentId ?? "") === x.id ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/65 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{x.ad}</button>)}
                </div>
                <SuzgecCubugu s={t.suzgec} set={(s) => degis({ suzgec: s, segmentId: undefined })} etiketler={[...new Set(d.kisiler.flatMap((x) => x.etiketler))]} />
              </div>
            )}
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-4">
              {[["Segmentte", kitle.segment], ["Onaylı", kitle.onayli], ["İzni belirsiz", kitle.belirsiz], ["Reddeden ve çıkan", kitle.red + kitle.cikan]].map(([a, n]) => <div key={a as string} className="bg-[#141518] px-3 py-2.5"><dt className="text-[11px] text-white/45">{a}</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{(n as number).toLocaleString("tr-TR")}</dd></div>)}
            </dl>
            {kitle.belirsiz > 0 && duzenlenebilir && (
              <button type="button" role="checkbox" aria-checked={t.izinsizKat} onClick={() => degis({ izinsizKat: !t.izinsizKat })} className="mt-3 flex w-full items-start gap-2.5 rounded-[12px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07]">
                <span className="mt-0.5"><Halka dolu={t.izinsizKat} boyut={18} /></span>
                <span className="text-[12.5px] leading-relaxed text-white/75">İzni belirsiz {kitle.belirsiz} kişiyi de kat. Yalnız onlardan ticari ileti onayı aldıysan ya da tacir ve esnafa gönderiyorsan işaretle; göndermeden önce beyan istenir.</span>
              </button>
            )}
            <p className="mt-3 flex items-center gap-2 text-[13px] text-white"><Users className="h-4 w-4 text-[#8be6ff]" />Bu kampanya <b className="tabular-nums">{kitle.alicilar.length.toLocaleString("tr-TR")}</b> kişiye gidecek</p>
          </Kart>
        </div>
        <div className="min-w-0">
          <div className="sticky top-0 space-y-3">
            <Kart baslik="Önizleme" aciklama="Ayşe adlı bir alıcının göreceği hâl" sag={<Secici id={`eposta-cihaz-${k.id}`} kucuk deger={cihaz} set={setCihaz} l={[{ id: "masaustu" as const, ad: "Masaüstü" }, { id: "telefon" as const, ad: "Telefon" }]} />}>
              <div className="flex justify-center overflow-hidden rounded-[14px] bg-[#f4f5f7]">
                <motion.div animate={{ width: cihaz === "telefon" ? 360 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="max-w-full">
                  <div className="border-b border-black/10 bg-white px-3.5 py-2.5"><p className="truncate text-[12px] text-black/55">{p.ad}</p><p className="truncate text-[13px] font-semibold text-black">{(t.konu || "Konu satırı yok").replace(/\{ad\}/g, "Ayşe").replace(/\{site\}/g, p.ad)}</p>{t.onMetin && <p className="truncate text-[12px] text-black/50">{t.onMetin.replace(/\{ad\}/g, "Ayşe")}</p>}</div>
                  <iframe title="E-posta önizlemesi" sandbox="" srcDoc={html} className="block h-[620px] w-full bg-[#f4f5f7]" />
                </motion.div>
              </div>
            </Kart>
          </div>
        </div>
      </div>

      <YanPanel acik={gonderPanel} kapat={() => setGonderPanel(false)} baslik="Gönder" alt={`${kitle.alicilar.length.toLocaleString("tr-TR")} kişi, konu: ${t.konu || "yok"}`}
        alt2={<>
          <button type="button" onClick={() => setGonderPanel(false)} className={cn(ikincil, "ml-auto")}>Vazgeç</button>
          <button type="button" disabled={!d.eposta.kurulu || !kitle.alicilar.length || !t.konu.trim() || !t.bloklar.length || (t.izinsizKat && !beyan) || !zaman} onClick={() => yap(async () => { await e.islem("zamanla", { kampanyaId: k.id, zaman: dilimZaman(zaman.slice(0, 10), zaman.slice(11, 16), d.isletme.saatDilimi || "UTC"), izinBeyan: beyan }); setGonderPanel(false); }, "Zamanlandı.")} className={ikincil}><CalendarClock className="h-3.5 w-3.5" />Zamanla</button>
          <button type="button" disabled={!d.eposta.kurulu || !kitle.alicilar.length || !t.konu.trim() || !t.bloklar.length || (t.izinsizKat && !beyan)} onClick={() => yap(async () => { await e.islem("gonder", { kampanyaId: k.id, izinBeyan: beyan }); setGonderPanel(false); }, "Gönderim başladı.")} className={birincil}><Send className="h-3.5 w-3.5" />Şimdi gönder</button>
        </>}>
        <div className="space-y-4">
          {!d.eposta.kurulu && <ServisUyari />}
          {d.eposta.kurulu && !d.eposta.alanDogrulandi && !d.eposta.deneme && <p className="rounded-[12px] bg-amber-400/[0.06] px-3 py-2 text-[12.5px] leading-relaxed text-amber-100/90 ring-1 ring-inset ring-amber-300/15">Gönderen adresi Resend'in deneme adresi. Bu adresle yalnız kendi hesabına gönderebilirsin; müşterilere göndermek için doğrulanmış alan adından bir gönderen tanımlanmalı.</p>}
          {!t.konu.trim() && <p className="rounded-[12px] bg-amber-400/[0.06] px-3 py-2 text-[12.5px] text-amber-100/90 ring-1 ring-inset ring-amber-300/15">Konu satırı boş; göndermeden önce yaz.</p>}
          {d.eposta.deneme && <p className="rounded-[12px] bg-white/[0.04] px-3 py-2 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.08]">Bu sunucuda yerel deneme gönderimi açık: iletiler gerçek alıcılara değil deneme adresine yazılır.</p>}
          <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <p className="text-[13px] font-medium text-white">Deneme gönderimi</p>
            <p className="mt-0.5 text-[12px] text-white/50">Konu başına "Deneme:" eklenir, izleme yapılmaz.</p>
            <div className="mt-2.5 flex gap-2"><input value={deneme} onChange={(x) => setDeneme(x.target.value)} type="email" placeholder="sen@alanadi.com" className={cn(alan, "h-9 min-w-0 flex-1")} /><button type="button" disabled={!d.eposta.kurulu || !deneme.trim() || e.suruyor("deneme")} onClick={() => yap(() => e.islem("deneme", { kampanyaId: k.id, kime: deneme.trim() }, "deneme"), `${deneme.trim()} adresine deneme gönderildi.`)} className={cn(ikincil, "h-9")}>{e.suruyor("deneme") ? <span className="build-nokta" /> : <Send className="h-3.5 w-3.5" />}Gönder</button></div>
            {!!k.denemeler.length && <ul className="mt-2 space-y-1">{k.denemeler.slice(0, 3).map((x, i) => <li key={i} className="flex justify-between gap-2 text-[11.5px]"><span className="truncate text-white/60">{x.kime}</span><span className={x.ok ? "text-[#8be6ff]/80" : "text-rose-200/80"}>{x.ok ? `gitti, ${gorece(x.zaman)}` : x.hata}</span></li>)}</ul>}
          </div>
          {t.izinsizKat && (
            <button type="button" role="checkbox" aria-checked={beyan} onClick={() => setBeyan(!beyan)} className="flex w-full items-start gap-2.5 rounded-[14px] bg-amber-400/[0.05] p-3 text-left ring-1 ring-inset ring-amber-300/15">
              <span className="mt-0.5"><Halka dolu={beyan} boyut={18} /></span>
              <span className="text-[12.5px] leading-relaxed text-white/80">İzni belirsiz {kitle.belirsiz} kişiden ticari elektronik ileti onayı aldığımı ya da bu kişilerin tacir veya esnaf olduğunu beyan ederim. Onayın ispatı bana aittir.</span>
            </button>
          )}
          <AbAyar t={t} degis={degis} alici={kitle.alicilar.length} />
          <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-white"><Clock className="h-3.5 w-3.5 text-[#8be6ff]" />Gönderim saati</p>
            <div className="mt-2 flex max-w-full overflow-x-auto [scrollbar-width:none]"><Secici id={`eposta-saat-${k.id}`} kucuk deger={t.saatKip === "kisisel" && !t.ab ? "kisisel" : "hemen"} set={(v) => degis({ saatKip: v === "kisisel" ? "kisisel" : undefined })} l={[{ id: "hemen" as const, ad: "Herkese aynı anda" }, { id: "kisisel" as const, ad: "Kişinin en iyi saatinde", kapali: !!t.ab }]} /></div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/45">{t.ab ? "Konu satırı denemesi açıkken herkes aynı anda alır." : t.saatKip === "kisisel" ? `Her kişi önümüzdeki 24 saat içinde en çok e-posta açtığı saatte alır. ${d.saatProfili.kisiSayisi} kişinin kendi saati biliniyor; diğerleri projenin en iyi saatinde (${String(d.saatProfili.enIyiSaat).padStart(2, "0")}:00${d.saatProfili.toplam < 10 ? ", veri az olduğu için varsayılan" : ""}).` : "Gönderim hemen ya da zamanladığın anda başlar."}</p>
          </div>
          <Etiket ad="Zamanla (isteğe bağlı)" sag={<span className="text-[11.5px] text-white/40">{(d.isletme.saatDilimi || "UTC").replace(/_/g, " ")} saati</span>}>
            <input type="datetime-local" value={zaman} onChange={(x) => setZaman(x.target.value)} className={cn(alan, "h-10 [color-scheme:dark]")} />
          </Etiket>
          <ul className="space-y-1.5 text-[12px] leading-relaxed text-white/55">
            <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#55d6fd]" />Saniyede en çok 2 ileti gider; {kitle.alicilar.length} kişi yaklaşık {Math.max(1, Math.ceil((kitle.alicilar.length * 0.55) / 60))} dakika sürer.</li>
            <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#55d6fd]" />Her iletide çıkma bağlantısı, tek tık çıkma başlığı ve marka kitindeki gönderen bilgisi bulunur.</li>
            <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#55d6fd]" />Bölge kuralları (GDPR, CAN-SPAM, CASL, İYS) Büyüme sekmesindeki İzinler bölümünden; ABD ve Kanada alıcıları için fiziksel posta adresi gerekir.</li>
          </ul>
        </div>
      </YanPanel>

      <YanPanel acik={!!gorselSec} kapat={() => setGorselSec(null)} baslik="Görsel seç" alt="Büyüme gönderilerinde üretilen görseller ya da bir https adresi">
        <div className="space-y-3">
          <AdresGir sec={(u) => { if (gorselSec) blokDegis(gorselSec, { gorsel: u }); setGorselSec(null); }} />
          {gorseller.length ? (
            <div className="grid grid-cols-3 gap-2">{gorseller.map((g) => <button key={g.id} type="button" onClick={() => { if (gorselSec) blokDegis(gorselSec, { gorsel: g.gorsel, metin: g.konu.slice(0, 80) }); setGorselSec(null); }} className="aspect-square overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10 transition hover:ring-2 hover:ring-white">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={g.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" /></button>)}</div>
          ) : <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]"><p className="text-[12.5px] text-white/55">Henüz görselli gönderi yok.</p><button type="button" onClick={() => git("icerik")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Görsel üret</button></div>}
        </div>
      </YanPanel>
    </div>
  );
}

function AdresGir({ sec }: { sec: (u: string) => void }) {
  const [u, setU] = useState("");
  return <div className="flex gap-2"><input value={u} onChange={(x) => setU(x.target.value)} placeholder="https://..." className={cn(alan, "h-9 min-w-0 flex-1")} /><button type="button" disabled={!/^https:\/\/\S+$/.test(u.trim())} onClick={() => sec(u.trim())} className={cn(ikincil, "h-9")}>Kullan</button></div>;
}

function KampanyaRaporu({ k, kazan }: { k: KampanyaOzet; kazan?: (v?: number) => void }) {
  const s = k.sayac;
  const ilerleme = s.toplam ? (s.gonderildi + s.hata) / s.toplam : 0;
  return (
    <Kart baslik="Sonuçlar" aciklama="Apple Mail gizlilik koruması açılmaları olduğundan yüksek gösterebilir; başarıyı tıklamayla ölç.">
      {k.ab && k.konuSonuc && (
        <div className="mb-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-white"><FlaskConical className="h-3.5 w-3.5 text-[#8be6ff]" />Konu satırı denemesi<Rozet ton={k.ab.asama === "bitti" ? "aksan" : "amber"}>{k.ab.asama === "bitti" ? "Kazanan gönderildi" : k.ab.testBitis ? `Kazanan ${new Date(k.ab.testBitis).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} seçilecek` : "Sürüyor"}</Rozet></p>
          <ul className="mt-2 space-y-1.5">{k.konuSonuc.map((x, i) => { const o = x.gonderildi ? (k.ab!.olcut === "tik" ? x.tiklayan : x.acilan) / x.gonderildi : 0; return (
            <li key={i} className={cn("rounded-[10px] px-2.5 py-2", k.ab!.kazanan === i ? "bg-white/[0.06] ring-2 ring-inset ring-white" : "")}>
              <span className="flex justify-between gap-2 text-[12.5px]"><span className="min-w-0 truncate text-white/85">{String.fromCharCode(65 + i)}: {x.konu}</span><span className="shrink-0 tabular-nums text-white">yüzde {Math.round(o * 100)}</span></span>
              <span className="mt-1 block h-1 rounded-full bg-white/[0.06]"><span className="block h-full rounded-full bg-[#55d6fd]" style={{ width: `${Math.round(o * 100)}%` }} /></span>
              <span className="mt-0.5 block text-[11px] text-white/40">{x.gonderildi} kişi, {x.acilan} açtı, {x.tiklayan} tıkladı</span>
            </li>
          ); })}</ul>
          {k.ab.neden && <p className="mt-2 text-[11.5px] text-white/50">{k.ab.neden}</p>}
          {k.ab.asama === "test" && k.durum === "gonderiliyor" && !s.bekliyor && kazan && <div className="mt-2 flex flex-wrap gap-1.5"><button type="button" onClick={() => kazan()} className={cn(ikincil, "h-8 px-3 text-[12px]")}>Kazananı şimdi seç</button>{k.konuSonuc.map((_, i) => <button key={i} type="button" onClick={() => kazan(i)} className={cn(ikincil, "h-8 px-3 text-[12px]")}>{String.fromCharCode(65 + i)} gitsin</button>)}</div>}
        </div>
      )}
      {k.durum === "gonderiliyor" && s.sonraki && <p className="mb-2 text-[12px] text-white/55">Kişiye göre saatle gidiyor: {s.bekliyor} kişi kendi saatini bekliyor, sıradaki {new Date(s.sonraki).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.</p>}
      {k.durum === "gonderiliyor" && (
        <div className="mb-3"><div className="mb-1 flex justify-between text-[12px] text-white/55"><span>Gönderiliyor</span><span className="tabular-nums">{s.gonderildi + s.hata} / {s.toplam}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><motion.div animate={{ width: `${ilerleme * 100}%` }} className="h-full rounded-full bg-[#55d6fd]" /></div></div>
      )}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-5">
        {[["Gönderildi", String(s.gonderildi)], ["Açıldı", `${s.acilan}, ${oran(s.acilan, s.gonderildi)}`], ["Tıkladı", `${s.tiklayan}, ${oran(s.tiklayan, s.gonderildi)}`], ["Çıktı", String(s.cikan)], ["Gönderilemedi", String(s.hata)]].map(([a, v]) => <div key={a} className="bg-[#141518] px-3 py-2.5"><dt className="text-[11px] text-white/45">{a}</dt><dd className="mt-0.5 text-[14px] font-semibold tabular-nums text-white">{v}</dd></div>)}
      </dl>
      {k.baglantilar.length > 0 && (
        <ul className="mt-3 space-y-2">
          {k.baglantilar.map((u, i) => { const n = k.tiklar[i] ?? 0, en = Math.max(1, ...k.tiklar); return (
            <li key={u} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-white/80"><Link2 className="h-3.5 w-3.5 shrink-0 text-white/40" /><span className="truncate">{u}</span></span><span className="text-[12.5px] tabular-nums text-white">{n} kişi</span>
              <span className="col-span-2 h-1.5 rounded-full bg-white/[0.05]"><motion.span initial={{ width: 0 }} animate={{ width: `${(n / en) * 100}%` }} className="block h-full rounded-full bg-[#1e9fcf]" /></span>
            </li>
          ); })}
        </ul>
      )}
    </Kart>
  );
}

/** Konu satırı A/B denemesi ayarı (gönder panelinde). */
function AbAyar({ t, degis, alici }: { t: { konu: string; ab?: KonuDeneyi }; degis: (y: { ab?: KonuDeneyi; saatKip?: "hemen" | "kisisel" }) => void; alici: number }) {
  const ab = t.ab;
  const ac = !!ab;
  const konular = ab?.konular ?? [t.konu, ""];
  const set = (y: Partial<KonuDeneyi>) => degis({ ab: { konular, pay: 20, sure: 4, olcut: "acilma", ...ab, ...y } });
  const konuSayi = Math.max(2, konular.filter((x, i) => i === 0 || x.trim()).length);
  const gerekli = 20 * konuSayi;
  const testN = Math.max(konuSayi * 10, Math.round((alici * (ab?.pay ?? 20)) / 100));
  return (
    <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
      <button type="button" role="switch" aria-checked={ac} onClick={() => degis(ac ? { ab: undefined } : { ab: { konular: [t.konu, ""], pay: 20, sure: 4, olcut: "acilma" }, saatKip: "hemen" })} className="flex w-full items-start gap-2.5 text-left">
        <span className="mt-0.5"><Halka dolu={ac} boyut={18} /></span>
        <span><span className="flex items-center gap-1.5 text-[13px] font-medium text-white"><FlaskConical className="h-3.5 w-3.5 text-[#8be6ff]" />Konu satırı denemesi</span><span className="block text-[11.5px] leading-relaxed text-white/50">Kitlenin bir payı konulara bölünür; süre sonunda en iyi konu kalanlara gider.</span></span>
      </button>
      {ac && ab && <div className="mt-3 space-y-3">
        <div className="space-y-1.5">{[0, 1, 2].map((i) => i === 0 ? <p key={i} className="truncate rounded-[10px] bg-white/[0.04] px-3 py-2 text-[12.5px] text-white/75">A: {t.konu || "Konu satırı yok"}</p> : (i === 1 || konular[1]?.trim()) && <input key={i} value={konular[i] ?? ""} onChange={(x) => { const l = [...konular]; l[i] = x.target.value; set({ konular: l }); }} maxLength={150} placeholder={`${String.fromCharCode(65 + i)} konu satırı${i === 2 ? " (isteğe bağlı)" : ""}`} className={cn(alan, "h-9")} />)}</div>
        <div><p className="mb-1.5 text-[12px] text-white/50">Denemeye giden pay</p><Secici id="ab-pay" kucuk deger={String(ab.pay) as "20"} set={(v) => set({ pay: Number(v) })} l={["10", "20", "30", "50"].map((n) => ({ id: n as "20", ad: `yüzde ${n}` }))} /></div>
        <div><p className="mb-1.5 text-[12px] text-white/50">Kazanan ne zaman seçilsin</p><Secici id="ab-sure" kucuk deger={String(ab.sure) as "4"} set={(v) => set({ sure: Number(v) })} l={["1", "2", "4", "8", "24"].map((n) => ({ id: n as "4", ad: `${n} saat` }))} /></div>
        <div><p className="mb-1.5 text-[12px] text-white/50">Ölçüt</p><Secici id="ab-olcut" kucuk deger={ab.olcut} set={(v) => set({ olcut: v })} l={[{ id: "acilma" as const, ad: "Açılma oranı" }, { id: "tik" as const, ad: "Tıklama oranı" }]} /></div>
        <p className={cn("text-[11.5px]", alici < gerekli ? "text-amber-200/90" : "text-white/45")}>{alici < gerekli ? `Deneme için en az ${gerekli} alıcı gerekir; bu kitlede ${alici} kişi var.` : `${testN} kişi denemeye, kalan ${alici - testN} kişi kazanana gider. Açılma ölçütü Apple Mail yüzünden şişebilir; tıklama daha güvenilir.`}</p>
      </div>}
    </div>
  );
}

/** En iyi gönderim saati: kişilerin e-posta açtığı ve tıkladığı gün ve saatler (işletmenin saat diliminde). */
function EnIyiSaat({ prof }: { prof: SaatProfili }) {
  const en = Math.max(1, ...prof.isi.flat());
  return (
    <Kart baslik="En iyi gönderim saati" aciklama={prof.enIyi ? `Kişilerin en çok ${["pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi", "pazar"][prof.enIyi.gun]} ${String(prof.enIyi.saat).padStart(2, "0")}:00 ile ${String(prof.enIyi.saat + 1).padStart(2, "0")}:00 arasında açıyor. ${prof.kisiSayisi} kişinin kendi saati biliniyor.` : `Henüz yeterli açılma verisi yok (${prof.toplam} olay). İlk kampanyalardan sonra burada kişilerinin ne zaman okuduğu görünür; o zamana kadar varsayılan 10:00.`}>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <div className="min-w-[520px]">
          <div className="ml-9 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px] text-[9.5px] text-white/35">{Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center">{h % 3 === 0 ? h : ""}</span>)}</div>
          {prof.isi.map((satir, g) => <div key={g} className="mt-[3px] flex items-center gap-1.5"><span className="w-[30px] shrink-0 text-[10.5px] text-white/45">{HAFTA_GUN[g]}</span><div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px]">{satir.map((n, h) => <span key={h} title={`${HAFTA_GUN[g]} ${String(h).padStart(2, "0")}:00, ${n}`} className="h-4 rounded-[3px]" style={{ background: n ? `rgba(85,214,253,${0.15 + (n / en) * 0.85})` : "rgba(255,255,255,0.04)" }} />)}</div></div>)}
        </div>
      </div>
    </Kart>
  );
}
