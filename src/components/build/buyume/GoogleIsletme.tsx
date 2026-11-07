"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, CalendarClock, Copy, KeyRound, MapPin, Plus, Send, Sparkles, Trash2, Unplug } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import { GBP_CTALAR, GBP_SINIR, GBP_TURLERI, type GbpGonderi, type GbpTur } from "@/lib/build/buyumeKanalTipler";
import { cn } from "@/lib/utils";
import { Secici } from "./ortak";
import { alan, birincil, Cip, Etiket, HataSatiri, ikincil, Kart, ModelYokKart, Rozet, Sayac, SecenekMenusu, Suruyor, useKopyala, YanPanel } from "./ortak";
import { ModelYokEk } from "./useBuyumeEk";
import type { BolumProps } from "./BuyumeSekme";

export const oauthAc = (adres: string) => { const w = window.open(adres, "vayra-oauth", "width=560,height=760"); if (!w) location.href = adres; };
const DURUM: Record<GbpGonderi["durum"], { ad: string; ton: "soluk" | "amber" | "aksan" | "rose" }> = { taslak: { ad: "Taslak", ton: "soluk" }, zamanlandi: { ad: "Zamanlandı", ton: "amber" }, yayinda: { ad: "Yayında", ton: "aksan" }, hata: { ad: "Hata", ton: "rose" } };

export function GoogleIsletmeBolumu({ e }: BolumProps) {
  const d = e.d!;
  const g = d.gbpDurum;
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [kurulum, setKurulum] = useState(false);
  const [konumlar, setKonumlar] = useState<{ hesap: string; konum: string; ad: string; adres?: string }[] | null>(null);
  const [acik, setAcik] = useState<string | null>(null);
  const [konu, setKonu] = useState("");
  const [tur, setTur] = useState<GbpTur>("STANDARD");
  const yap = async (f: () => Promise<unknown>, ok?: string) => { setHata(""); setBilgi(""); setModelYok(false); try { await f(); if (ok) setBilgi(ok); } catch (x) { if (x instanceof ModelYokEk) setModelYok(true); else setHata(x instanceof Error ? x.message : "İşlem yapılamadı."); } };
  const l = d.ek.gbp.gonderiler;
  const secili = l.find((x) => x.id === acik) ?? null;
  const yayinlanabilir = g.anahtar && g.bagli && !!g.konum;
  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex flex-wrap items-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/google-color.svg" alt="Google" className="h-4 w-4" />Google İşletme Profili<Rozet ton={yayinlanabilir ? "aksan" : g.bagli ? "amber" : "soluk"}>{yayinlanabilir ? "Yayına hazır" : g.bagli ? "İşletme seçilmedi" : g.anahtar ? "Bağlı değil" : "Anahtar yok"}</Rozet></span>}
        aciklama="Haritalar ve aramadaki işletme kartına güncelleme, teklif ve etkinlik gönderisi. Gemini ve Google Yapay Zekâ Özeti yerel sorularda bu profili kullanır.">
        {!g.anahtar ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-amber-400/[0.05] px-3.5 py-3 ring-1 ring-inset ring-amber-300/15">
            <KeyRound className="h-4 w-4 shrink-0 text-amber-300" />
            <p className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed text-white/75">Doğrudan yayın için Google uygulama anahtarı yok ({g.eksik.join(", ")}). Gönderileri şimdi hazırlayıp kopyalayabilir, Google'da elle paylaşabilirsin.</p>
            <button type="button" onClick={() => setKurulum(true)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Kurulum adımları</button>
          </div>
        ) : !g.bagli ? (
          <div className="flex flex-wrap items-center gap-3"><p className="min-w-[200px] flex-1 text-[12.5px] text-white/65">İşletme Profili yöneticisi olan Google hesabınla bağlan.</p><button type="button" disabled={e.suruyor("gbp-bagla")} onClick={() => yap(async () => { const j = await e.islem("sosyal-bagla", { ag: "google" }, "gbp-bagla"); oauthAc(String(j.adres)); })} className={birincil}>Google ile bağla</button></div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex min-w-[200px] flex-1 items-center gap-2 text-[13px] text-white"><MapPin className="h-4 w-4 text-[#8be6ff]" />{g.konum ? <span className="min-w-0"><span className="block truncate">{g.konum.ad}</span>{g.konum.adres && <span className="block truncate text-[11.5px] text-white/45">{g.konum.adres}</span>}</span> : <span className="text-white/55">Gönderilerin gideceği işletmeyi seç</span>}</span>
            <button type="button" disabled={e.suruyor("gbp-konumlar")} onClick={() => yap(async () => { const j = await e.islem("gbp-konumlar", {}, "gbp-konumlar"); setKonumlar(j.konumlar as never); })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{e.suruyor("gbp-konumlar") ? <span className="build-nokta" /> : null}{g.konum ? "Değiştir" : "İşletmeyi seç"}</button>
            <button type="button" onClick={() => yap(() => e.islem("sosyal-kes", { ag: "google" }), "Bağlantı kesildi.")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Unplug className="h-3.5 w-3.5" />Bağlantıyı kes</button>
          </div>
        )}
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {bilgi && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}
      {modelYok && <ModelYokKart tekrar={() => setModelYok(false)} />}

      <div className="cam-istemci rounded-[22px] p-3">
        <textarea value={konu} onChange={(x) => setKonu(x.target.value)} rows={2} maxLength={300} placeholder="Ne paylaşalım? Hafta sonu açık mutfak atölyesi, yeni menü, kış indirimi" className="w-full resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/40" />
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <SecenekMenusu genislik={280} baslik="Gönderi türü" deger={tur} sec={(id) => setTur(id as GbpTur)} l={GBP_TURLERI.map((x) => ({ id: x.id, ad: x.ad, alt: x.alt }))} tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{GBP_TURLERI.find((x) => x.id === tur)?.ad}</Cip>} />
          <button type="button" disabled={e.suruyor("gbp-proje")} onClick={() => yap(() => e.islem("gbp-taslak", { kaynak: "proje" }, "gbp-proje"), "Ürün, yazı ve kuponlardan taslaklar eklendi.")} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white">{e.suruyor("gbp-proje") ? <span className="build-nokta" /> : <Plus className="h-3.5 w-3.5" />}Projeden taslak</button>
          <button type="button" onClick={() => yap(async () => { const j = await e.duzenle("gbpGonderi", { gonderi: { tur, metin: konu } }); setAcik((j.ek as { gbp: { gonderiler: GbpGonderi[] } }).gbp.gonderiler[0].id); setKonu(""); })} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-white">Kendim yazarım</button>
          <button type="button" disabled={e.suruyor("gbp-ai")} onClick={() => yap(async () => { await e.islem("gbp-taslak", { kaynak: "ai", konu: konu.trim(), tur }, "gbp-ai"); setKonu(""); }, "Üç taslak yazıldı.")} className={cn(birincil, "ml-auto h-9")}>{e.suruyor("gbp-ai") ? <span className="build-nokta" /> : <Sparkles className="h-4 w-4" />}Yaz</button>
        </div>
      </div>
      {e.suruyor("gbp-ai") && <Suruyor metin="Gönderiler yazılıyor" alt="Ajan işletmeni ve marka kitini okuyup üç farklı gönderi hazırlıyor." />}

      <Kart baslik={<span className="flex items-center gap-2">Gönderiler<Rozet>{l.length}</Rozet></span>}>
        {l.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">{l.map((x) => (
            <li key={x.id}><button type="button" onClick={() => setAcik(x.id)} className="flex h-full w-full flex-col gap-2 rounded-[14px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]">
              <span className="flex items-center gap-2"><Rozet>{GBP_TURLERI.find((t) => t.id === x.tur)?.ad}</Rozet><Rozet ton={DURUM[x.durum].ton}>{DURUM[x.durum].ad}</Rozet><span className="ml-auto text-[11px] text-white/40">{x.durum === "zamanlandi" && x.zaman ? new Date(x.zaman).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : gorece(x.guncelleme)}</span></span>
              <span className="line-clamp-3 text-[12.5px] leading-relaxed text-white/80">{x.metin || "Metin yok"}</span>
              {x.kaynak && <span className="text-[11px] text-white/35">{x.kaynak}</span>}
            </button></li>
          ))}</ul>
        ) : <p className="text-[12.5px] text-white/50">Henüz gönderi yok. Haftada bir gönderi, profilin güncel görünmesi için yeterli.</p>}
      </Kart>

      <GonderiPaneli x={secili} kapat={() => setAcik(null)} pr={e} yayinlanabilir={yayinlanabilir} />

      <YanPanel acik={!!konumlar} kapat={() => setKonumlar(null)} baslik="İşletmeyi seç" alt="Gönderiler bu konuma yayımlanır">
        {konumlar?.length ? <ul className="space-y-1.5">{konumlar.map((k) => <li key={k.konum}><button type="button" onClick={() => yap(async () => { await e.duzenle("gbpKonum", { konum: k }); setKonumlar(null); }, `${k.ad} seçildi.`)} className={cn("flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left", g.konum?.konum === k.konum ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]")}><MapPin className="h-4 w-4 text-white/60" /><span className="min-w-0"><span className="block truncate text-[13px] text-white">{k.ad}</span>{k.adres && <span className="block truncate text-[11.5px] text-white/45">{k.adres}</span>}</span></button></li>)}</ul> : <p className="text-[12.5px] text-white/55">Bu Google hesabında yönetilen işletme bulunamadı.</p>}
      </YanPanel>
      <YanPanel acik={kurulum} kapat={() => setKurulum(false)} baslik="Google İşletme Profili kurulumu" alt="Doğrudan yayın için bir kez yapılır">
        <ol className="space-y-2.5">{[
          "console.cloud.google.com'da bir proje aç.",
          "My Business Account Management, My Business Business Information ve Google My Business API'lerini etkinleştir.",
          "Business Profile API erişim başvurusunu yap (Google, projeye kota tanıyana kadar istekler reddedilir; onay birkaç gün sürebilir).",
          "OAuth izin ekranını yapılandır, business.manage kapsamını ekle.",
          `Web uygulaması türünde OAuth istemcisi oluştur; yetkili yönlendirme adresine şunu yaz: ${g.donus}`,
          "İstemci kimliğini ve gizli anahtarı sunucuya GOOGLE_ISLETME_ISTEMCI_ID ve GOOGLE_ISLETME_ISTEMCI_GIZLI olarak ekle.",
        ].map((x, i) => <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-white/85"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white">{i + 1}</span><span className="min-w-0 break-words">{x}</span></li>)}</ol>
        <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className={cn(ikincil, "mt-4 w-full justify-center")}>Google Cloud'u aç<ArrowUpRight className="h-3.5 w-3.5" /></a>
      </YanPanel>
    </div>
  );
}

function GonderiPaneli({ x, kapat, pr: e, yayinlanabilir }: { x: GbpGonderi | null; kapat: () => void; pr: BolumProps["e"]; yayinlanabilir: boolean }) {
  const [t, setT] = useState<GbpGonderi | null>(null);
  const [zaman, setZaman] = useState("");
  const [hata, setHata] = useState("");
  const [kopya, kopyala] = useKopyala();
  const g = t && x && t.id === x.id ? t : x;
  if (!g) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const degis = (y: Partial<GbpGonderi>) => setT({ ...g, ...y });
  const kaydet = async () => { if (!t) return true; try { await e.duzenle("gbpGonderi", { gonderi: t }); setT(null); return true; } catch (z) { setHata(z instanceof Error ? z.message : "Kaydedilemedi."); return false; } };
  const yap = async (f: () => Promise<unknown>) => { setHata(""); try { if (await kaydet()) await f(); } catch (z) { setHata(z instanceof Error ? z.message : "İşlem yapılamadı."); } };
  const kilit = g.durum === "yayinda";
  return (
    <YanPanel acik={!!x} kapat={async () => { await kaydet(); setT(null); kapat(); }} genis baslik="Google gönderisi" alt={DURUM[g.durum].ad + (g.yayin ? `, ${gorece(g.yayin.z)}` : "")}
      alt2={<>
        {!kilit && <button type="button" onClick={() => yap(async () => { await e.duzenle("gbpGonderiSil", { id: g.id }); kapat(); })} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button>}
        <button type="button" onClick={() => kopyala("m", g.metin)} className={cn(ikincil, kilit && "ml-auto")}><Copy className="h-3.5 w-3.5" />{kopya === "m" ? "Kopyalandı" : "Kopyala"}</button>
        {!kilit && <button type="button" disabled={!yayinlanabilir || !g.metin.trim() || e.suruyor("gbp-yayinla")} onClick={() => yap(() => e.islem("gbp-yayinla", { gonderiId: g.id }, "gbp-yayinla"))} className={birincil}>{e.suruyor("gbp-yayinla") ? <span className="build-nokta" /> : <Send className="h-3.5 w-3.5" />}Yayımla</button>}
      </>}>
      <div className="space-y-4">
        {hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}
        {g.hata && <HataSatiri mesaj={g.hata} />}
        {g.yayin?.adres && <a href={g.yayin.adres} target="_blank" rel="noopener noreferrer" className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Google'da gör<ArrowUpRight className="h-3.5 w-3.5" /></a>}
        <div className="flex max-w-full overflow-x-auto [scrollbar-width:none]"><Secici id="gbp-tur" kucuk deger={g.tur} set={(v) => !kilit && degis({ tur: v })} l={GBP_TURLERI.map((y) => ({ id: y.id, ad: y.ad }))} /></div>
        <Etiket ad="Metin" sag={<Sayac n={[...g.metin].length} sinir={GBP_SINIR} />}><textarea disabled={kilit} value={g.metin} onChange={(z) => degis({ metin: z.target.value })} rows={7} className={cn(alan, "resize-y py-2.5 leading-relaxed")} /></Etiket>
        <p className="-mt-2 text-[11.5px] text-white/45">İlk 100 karakter kartta görünür. Google, metinde telefon numarası olan gönderileri reddedebilir.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Düğme</p><SecenekMenusu genislik={260} deger={g.cta || "yok"} sec={(id) => degis({ cta: (id === "yok" ? "" : id) as GbpGonderi["cta"] })} l={GBP_CTALAR.map((y) => ({ id: y.id || "yok", ad: y.ad }))} tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{GBP_CTALAR.find((y) => y.id === g.cta)?.ad}</Cip>} /></div>
          {g.cta && g.cta !== "CALL" && <Etiket ad="Düğme adresi"><input disabled={kilit} value={g.adres ?? ""} onChange={(z) => degis({ adres: z.target.value })} placeholder="https://" className={cn(alan, "h-9")} /></Etiket>}
          <Etiket ad="Görsel adresi (herkese açık https)" className="sm:col-span-2"><input disabled={kilit} value={g.gorsel ?? ""} onChange={(z) => degis({ gorsel: z.target.value })} placeholder="https://" className={cn(alan, "h-9")} /></Etiket>
        </div>
        {(g.tur === "EVENT" || g.tur === "OFFER") && <div className="grid gap-3 sm:grid-cols-3">
          <Etiket ad="Başlık"><input disabled={kilit} value={g.etkinlik?.baslik ?? ""} onChange={(z) => degis({ etkinlik: { bas: "", bit: "", ...g.etkinlik, baslik: z.target.value } })} maxLength={58} className={cn(alan, "h-9")} /></Etiket>
          <Etiket ad="Başlangıç"><input type="date" disabled={kilit} value={g.etkinlik?.bas ?? ""} onChange={(z) => degis({ etkinlik: { baslik: "", bit: "", ...g.etkinlik, bas: z.target.value } })} className={cn(alan, "h-9 [color-scheme:dark]")} /></Etiket>
          <Etiket ad="Bitiş"><input type="date" disabled={kilit} value={g.etkinlik?.bit ?? ""} onChange={(z) => degis({ etkinlik: { baslik: "", bas: "", ...g.etkinlik, bit: z.target.value } })} className={cn(alan, "h-9 [color-scheme:dark]")} /></Etiket>
        </div>}
        {g.tur === "OFFER" && <div className="grid gap-3 sm:grid-cols-2"><Etiket ad="Kupon kodu"><input disabled={kilit} value={g.teklif?.kod ?? ""} onChange={(z) => degis({ teklif: { kosullar: "", ...g.teklif, kod: z.target.value.toUpperCase() } })} className={cn(alan, "h-9")} /></Etiket><Etiket ad="Koşullar"><input disabled={kilit} value={g.teklif?.kosullar ?? ""} onChange={(z) => degis({ teklif: { kod: "", ...g.teklif, kosullar: z.target.value } })} className={cn(alan, "h-9")} /></Etiket></div>}
        {!kilit && <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          <p className="text-[13px] font-medium text-white">Zamanla</p>
          {g.durum === "zamanlandi" && g.zaman ? <div className="mt-2 flex items-center gap-2"><span className="flex-1 text-[12.5px] text-white/70">{new Date(g.zaman).toLocaleString("tr-TR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span><button type="button" onClick={() => yap(() => e.islem("gbp-zamanla", { gonderiId: g.id, zaman: Date.now() + 120_000, iptal: true }))} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>İptal</button></div>
            : <div className="mt-2 flex gap-2"><input type="datetime-local" value={zaman} onChange={(z) => setZaman(z.target.value)} className={cn(alan, "h-9 min-w-0 flex-1 [color-scheme:dark]")} /><button type="button" disabled={!zaman || !yayinlanabilir} onClick={() => yap(() => e.islem("gbp-zamanla", { gonderiId: g.id, zaman: new Date(zaman).getTime() }))} className={cn(ikincil, "h-9")}><CalendarClock className="h-3.5 w-3.5" />Zamanla</button></div>}
          {!yayinlanabilir && <p className="mt-1.5 text-[11.5px] text-white/45">Yayımlamak ve zamanlamak için Google bağlantısı ve işletme seçimi gerekir. O zamana kadar metni kopyalayıp <a href="https://business.google.com/" target="_blank" rel="noopener noreferrer" className="text-[#8be6ff] underline-offset-2 hover:underline">Google İşletme Profili</a>'nde elle paylaşabilirsin.</p>}
        </div>}
      </div>
    </YanPanel>
  );
}
