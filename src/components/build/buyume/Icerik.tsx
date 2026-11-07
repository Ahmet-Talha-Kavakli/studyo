"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarDays, Copy, CopyPlus, Download, ImagePlus, Link2, Minus, PenLine, Plus, RefreshCcw, Trash2, Wand2, X } from "lucide-react";
import { Secici } from "./ortak";
import { yayinAdresi } from "@/lib/build/istemci";
import {
  bugunTR, DURUMLAR, gonderiKanalAdi, gonderiMetni, gonderiOrani, gonderiSiniri, gonderiUzunlugu, hashtagNormalize, icerikKanali, ICERIK_KANALLARI, ogeTarihi, oranSayi, PLANDAN_ICERIGE, say, TONLAR,
  type Gonderi, type GonderiDurum, type IcerikKanalId, type OzelKanal, type TonId,
} from "@/lib/build/buyumeTipler";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Cip, Etiket, HataSatiri, ikincil, Kart, KanalLogo, ModelYokKart, Rozet, SecenekMenusu, simgeDugme, Sayac, Suruyor, turkceTarih, useKopyala, YanPanel, yay, SatirSecici } from "./ortak";
import { ModelYokHatasi, type BuyumeKanca } from "./useBuyume";
import type { Git, IcerikIstegi } from "./BuyumeSekme";

const DURUM_TON: Record<GonderiDurum, "soluk" | "notr" | "aksan"> = { taslak: "soluk", hazir: "notr", paylasildi: "aksan" };
const SONRAKI: Record<GonderiDurum, GonderiDurum> = { taslak: "hazir", hazir: "paylasildi", paylasildi: "taslak" };
const kanalLogosu = (g: Pick<Gonderi, "kanal">) => icerikKanali(g.kanal).plan;

/** Gönderideki takip bağlantısı: Vayra Analitik kampanya olarak sayar. */
export function takipAdresi(p: Proje, g: Pick<Gonderi, "kanal">) {
  const alanAdi = p.alanAdlari.find((a) => a.birincil && a.durum === "bagli") ?? p.alanAdlari.find((a) => a.durum === "bagli");
  const kok = alanAdi ? `https://${alanAdi.ad}/` : yayinAdresi(p.ayarlar.altAlan).tam;
  const kaynak = g.kanal === "hikaye" ? "instagram" : g.kanal === "ozel" ? "diger" : g.kanal;
  return `${kok}?utm_source=${kaynak}&utm_medium=${g.kanal === "eposta" ? "email" : "social"}&utm_campaign=vayra-buyume`;
}

/** Görsel alanı: kartta en uzun dikey 4:5'e kırpılır, ayrıntıda gerçek oran. */
function GorselAlani({ g, b, kart, uret }: { g: Gonderi; b: BuyumeKanca; kart?: boolean; uret: () => void }) {
  const oran = oranSayi(gonderiOrani(g));
  const goster = kart ? Math.max(0.8, Math.min(1.91, oran)) : oran;
  const suruyor = b.suruyor(`gorsel:${g.id}`);
  /* Görsel yoksa büyük boş kutu yerine: oran çerçevesi, görsel tarifi ve üret düğmesi. */
  if (!g.gorsel) {
    const h = 58, w = Math.round(Math.min(96, Math.max(32, h * oran)));
    return (
      <div className="mx-3 flex gap-3 rounded-[14px] bg-gradient-to-br from-white/[0.04] to-[#55d6fd]/[0.05] p-3 ring-1 ring-inset ring-white/[0.06]">
        <span className="flex shrink-0 items-center justify-center rounded-[8px] border border-dashed border-white/25 text-[10.5px] tabular-nums text-white/50" style={{ width: w, height: h }} title={`${gonderiOrani(g)} oranında üretilir`}>
          {suruyor ? <span className="build-nokta" /> : gonderiOrani(g)}
        </span>
        <div className="min-w-0 flex-1">
          {suruyor ? <p className="build-parilti text-[12.5px] font-medium">Görsel üretiliyor</p>
            : g.gorselHata ? <p className="flex items-start gap-1.5 text-[12px] leading-snug text-amber-200/90"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />{g.gorselHata}</p>
              : <p className="line-clamp-2 text-[12px] leading-relaxed text-white/60"><ImagePlus className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-white/40" />{g.gorselIstemi || "Görsel tarifi yok; Düzenle'den yazabilirsin."}</p>}
          {!suruyor && (
            <button type="button" onClick={uret} className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-white px-2.5 text-[12px] font-semibold text-black hover:opacity-90">
              <Wand2 className="h-3.5 w-3.5" />{g.gorselHata ? "Tekrar dene" : "Görsel üret"}<span className="font-normal text-black/50">2 kredi</span>
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="group/g relative overflow-hidden bg-[#141518]" style={{ aspectRatio: String(goster) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={g.gorsel} alt={g.gorselIstemi || "Gönderi görseli"} className={cn("h-full w-full object-cover transition-opacity", suruyor && "opacity-40")} />
      {kart && oran < 0.8 && <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white/85 backdrop-blur">{gonderiOrani(g)}</span>}
      {suruyor && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[12px] text-white backdrop-blur"><span className="build-nokta" /><span className="build-parilti">Görsel üretiliyor</span></span>
        </div>
      )}
      {!suruyor && g.gorselHata && (
        <div className="absolute inset-x-2.5 top-2.5 flex items-start gap-2 rounded-[12px] bg-[#1c1a16]/95 px-3 py-2 text-[12px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/20">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" /><span className="min-w-0 flex-1">Yeni görsel üretilemedi: {g.gorselHata.replace(/^Görsel üretilemedi:\s*/, "")}</span>
        </div>
      )}
      {!suruyor && (
        <div className={cn("absolute bottom-2.5 right-2.5 flex gap-1.5", kart && "opacity-0 transition-opacity group-hover/g:opacity-100 max-md:opacity-100")}>
          <button type="button" onClick={uret} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black hover:opacity-90">
            <RefreshCcw className="h-3.5 w-3.5" />Yeniden üret<span className="font-normal text-black/50">2 kredi</span>
          </button>
        </div>
      )}
    </div>
  );
}

function GonderiKarti({ p, g, b, ac, uretGorsel, benzer, sil, kopyalandi, kopyala }: { p: Proje; g: Gonderi; b: BuyumeKanca; ac: () => void; uretGorsel: () => void; benzer: () => void; sil: () => void; kopyalandi: boolean; kopyala: () => void }) {
  const n = gonderiUzunlugu(g), sinir = gonderiSiniri(g);
  return (
    <motion.article layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={yay}
      className="flex flex-col overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <KanalLogo kanal={kanalLogosu(g)} boyut={26} className="rounded-[8px]" />
        <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-white">{gonderiKanalAdi(g)}</span>{g.tarih && <span className="flex items-center gap-1 text-[11px] text-white/45"><CalendarDays className="h-3 w-3" />{turkceTarih(g.tarih, { day: "numeric", month: "short", weekday: "short" })}</span>}</span>
        <button type="button" title="Durumu değiştir" onClick={() => b.degistir((v) => { const x = v.gonderiler.find((y) => y.id === g.id); if (x) x.durum = SONRAKI[g.durum]; }, { gonderi: { id: g.id, durum: SONRAKI[g.durum] } })}>
          <Rozet ton={DURUM_TON[g.durum]} className="cursor-pointer hover:brightness-125">{g.durum === "paylasildi" && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}{DURUMLAR.find((d) => d.id === g.durum)?.ad}</Rozet>
        </button>
      </header>
      <GorselAlani g={g} b={b} kart uret={uretGorsel} />
      <button type="button" onClick={ac} className="flex-1 px-3.5 pb-2 pt-3 text-left">
        {g.baslik && <p className="mb-1 text-[13px] font-semibold text-white">{g.baslik}</p>}
        <p className="line-clamp-4 whitespace-pre-line text-[13px] leading-relaxed text-white/80">{g.metin}</p>
        {!!g.hashtagler.length && <p className="mt-1.5 line-clamp-2 text-[12.5px] text-[#8be6ff]/85">{g.hashtagler.join(" ")}</p>}
      </button>
      <footer className="flex items-center gap-0.5 border-t border-white/[0.05] px-2 py-1.5">
        <Sayac n={n} sinir={sinir} className="ml-1.5 mr-auto" />
        <button type="button" onClick={kopyala} className={simgeDugme} title={kopyalandi ? "Kopyalandı" : "Metni kopyala"} aria-label="Metni kopyala">{kopyalandi ? <span className="text-[10.5px] font-semibold text-[#8be6ff]">Tamam</span> : <Copy className="h-3.5 w-3.5" />}</button>
        {g.gorsel && <a href={g.gorsel} download={`${p.ayarlar.altAlan}-${g.kanal}-${g.id}.${g.gorsel.split(".").pop()}`} className={simgeDugme} title="Görseli indir" aria-label="Görseli indir"><Download className="h-3.5 w-3.5" /></a>}
        <button type="button" onClick={benzer} disabled={b.suruyor(`benzer:${g.id}`)} className={simgeDugme} title="Bunun gibi 3 tane daha" aria-label="Bunun gibi 3 tane daha"><CopyPlus className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={sil} className={cn(simgeDugme, "hover:text-rose-200")} title="Sil" aria-label="Gönderiyi sil"><Trash2 className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={ac} className="ml-0.5 inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium text-white/80 hover:bg-white/[0.08] hover:text-white"><PenLine className="h-3.5 w-3.5" />Düzenle</button>
      </footer>
    </motion.article>
  );
}

/** Kanalın kendi görünümüne benzeyen önizleme (akış, tam ekran, e-posta). */
function KanalOnizleme({ p, g }: { p: Proje; g: Gonderi }) {
  const dikey = g.kanal === "hikaye" || g.kanal === "tiktok" || g.kanal === "whatsapp";
  const avatar = <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20">{p.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.kapak} alt="" className="h-full w-full object-cover" />}</span>;
  if (dikey) return (
    <div className="mx-auto w-[220px] overflow-hidden rounded-[22px] bg-black ring-1 ring-white/10">
      <div className="relative" style={{ aspectRatio: "9 / 16" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {g.gorsel ? <img src={g.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-b from-[#1b2a30] to-[#0d0f12]" />}
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-2.5">{avatar}<span className="truncate text-[11.5px] font-semibold text-white">{p.ad}</span></div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
          <p className={cn("whitespace-pre-line text-white", g.kanal === "hikaye" ? "text-center text-[14px] font-semibold leading-snug" : "line-clamp-4 text-[11.5px] leading-snug")}>{g.metin}</p>
          {g.kanal === "tiktok" && !!g.hashtagler.length && <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-white/90">{g.hashtagler.join(" ")}</p>}
        </div>
      </div>
    </div>
  );
  if (g.kanal === "eposta") return (
    <div className="overflow-hidden rounded-[14px] bg-white text-[#1f2328]">
      <div className="border-b border-black/10 px-4 py-2.5 text-[12px]"><p><span className="text-black/45">Kimden </span>{p.ad}</p><p className="mt-0.5 font-semibold">{g.baslik || "Konu satırı yok"}</p></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {g.gorsel ? <img src={g.gorsel} alt="" className="w-full object-cover" style={{ aspectRatio: "2 / 1" }} /> : <div className="bg-[#eef2f4]" style={{ aspectRatio: "2 / 1" }} />}
      <p className="line-clamp-6 whitespace-pre-line px-4 py-3 text-[12.5px] leading-relaxed">{g.metin}</p>
    </div>
  );
  const kisa = g.kanal === "instagram" && say(g.metin) > 125;
  return (
    <div className="overflow-hidden rounded-[14px] bg-[#0f1012] ring-1 ring-white/10">
      <div className="flex items-center gap-2 px-3 py-2.5">{avatar}<span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-white">{p.ad}</span><KanalLogo kanal={kanalLogosu(g)} boyut={22} className="rounded-[6px]" /></div>
      {g.kanal === "x" || g.kanal === "linkedin" ? <p className="line-clamp-5 whitespace-pre-line px-3 pb-2.5 text-[12.5px] leading-relaxed text-white/90">{g.metin} <span className="text-[#8be6ff]">{g.hashtagler.join(" ")}</span></p> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {g.gorsel ? <img src={g.gorsel} alt="" className="w-full object-cover" style={{ aspectRatio: String(oranSayi(gonderiOrani(g))) }} /> : <div className="bg-gradient-to-br from-white/[0.06] to-[#55d6fd]/[0.06]" style={{ aspectRatio: String(oranSayi(gonderiOrani(g))) }} />}
      {g.kanal !== "x" && g.kanal !== "linkedin" && (
        <p className="whitespace-pre-line px-3 py-2.5 text-[12.5px] leading-relaxed text-white/90"><span className="font-semibold">{p.ayarlar.altAlan} </span>{kisa ? [...g.metin].slice(0, 125).join("") : g.metin}{kisa && <span className="text-white/45"> ... devamı</span>}{!kisa && !!g.hashtagler.length && <span className="text-[#8be6ff]"> {g.hashtagler.join(" ")}</span>}</p>
      )}
    </div>
  );
}

/** Gönderi düzenleme paneli (İçerik ve Takvim ortak). */
export function GonderiPaneli({ p, b, id, kapat }: { p: Proje; b: BuyumeKanca; id: string | null; kapat: () => void }) {
  const kayitli = b.veri?.gonderiler.find((x) => x.id === id) ?? null;
  const [g, setG] = useState<Gonderi | null>(null);
  const [etiketler, setEtiketler] = useState("");
  const [hata, setHata] = useState("");
  const [kopya, kopyala] = useKopyala();
  const acilan = useRef<string | null>(null);
  useEffect(() => { if (kayitli && acilan.current !== kayitli.id) { acilan.current = kayitli.id; setG(structuredClone(kayitli)); setEtiketler(kayitli.hashtagler.join(" ")); setHata(""); } if (!id) acilan.current = null; }, [kayitli, id]);
  /* Görsel sunucuda yazılır: yalnız görsel alanlarını tazele, düzenlenen metne dokunma. */
  useEffect(() => { if (kayitli && g && (kayitli.gorsel !== g.gorsel || kayitli.gorselHata !== g.gorselHata)) setG({ ...g, gorsel: kayitli.gorsel, gorselHata: kayitli.gorselHata }); }, [kayitli?.gorsel, kayitli?.gorselHata]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!g) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const k = icerikKanali(g.kanal);
  const taslak: Gonderi = { ...g, hashtagler: hashtagNormalize(etiketler, 30) };
  const n = gonderiUzunlugu(taslak), sinir = gonderiSiniri(g);
  const kirli = !!kayitli && JSON.stringify({ ...kayitli, guncelleme: 0 }) !== JSON.stringify({ ...taslak, gorsel: kayitli.gorsel, gorselHata: kayitli.gorselHata, guncelleme: 0 });
  const kaydet = async () => {
    const govde = { id: g.id, baslik: taslak.baslik, metin: taslak.metin, hashtagler: taslak.hashtagler, gorselIstemi: taslak.gorselIstemi, durum: taslak.durum, tarih: taslak.tarih ?? null };
    await b.degistir((v) => { const i = v.gonderiler.findIndex((x) => x.id === g.id); if (i >= 0) v.gonderiler[i] = { ...v.gonderiler[i], ...taslak, gorsel: v.gonderiler[i].gorsel }; }, { gonderi: govde });
  };
  const gorselUret = async () => {
    setHata("");
    if (kirli) await kaydet();
    try { await b.uret("gorsel", { gonderiId: g.id, gorselIstemi: taslak.gorselIstemi }, `gorsel:${g.id}`); } catch (e) { setHata(e instanceof ModelYokHatasi ? "Model bağlı değil." : e instanceof Error ? e.message : "Görsel üretilemedi."); }
  };
  const benzer = async () => { setHata(""); if (kirli) await kaydet(); try { await b.uret("benzer", { gonderiId: g.id }, `benzer:${g.id}`); kapat(); } catch (e) { setHata(e instanceof ModelYokHatasi ? "Yapay zekâ modeli bağlı değil; benzer gönderi yazılamıyor." : e instanceof Error ? e.message : "Yazılamadı."); } };
  const adres = takipAdresi(p, g);
  return (
    <YanPanel acik={!!id} kapat={kapat} genis baslik={<span className="flex items-center gap-2"><KanalLogo kanal={kanalLogosu(g)} boyut={24} className="rounded-[7px]" />{gonderiKanalAdi(g)}</span>}
      alt={`${k.oranAd} görsel · en çok ${sinir.toLocaleString("tr-TR")} karakter${k.hashtag[1] ? ` · ${k.hashtag[0]} ile ${k.hashtag[1]} hashtag önerilir` : ""}`}
      alt2={<>
        <button type="button" onClick={() => { b.degistir((v) => { v.gonderiler = v.gonderiler.filter((x) => x.id !== g.id); }, { gonderiSil: g.id }); kapat(); }} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button>
        <button type="button" onClick={() => kopyala("m", gonderiMetni(taslak))} className={ikincil}><Copy className="h-3.5 w-3.5" />{kopya === "m" ? "Kopyalandı" : "Kopyala"}</button>
        <button type="button" onClick={benzer} disabled={b.suruyor(`benzer:${g.id}`)} className={cn(ikincil, "max-sm:hidden")}><CopyPlus className="h-3.5 w-3.5" />Bunun gibi 3 tane daha</button>
        <button type="button" disabled={!kirli} onClick={async () => { await kaydet(); kapat(); }} className={birincil}>Kaydet</button>
      </>}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[230px_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[240px] space-y-2.5 sm:max-w-none">
          <KanalOnizleme p={p} g={taslak} />
          {g.gorsel && (
            <div className="flex gap-1.5">
              <a href={g.gorsel} download={`${p.ayarlar.altAlan}-${g.kanal}-${g.id}.${g.gorsel.split(".").pop()}`} className={cn(ikincil, "h-8 flex-1 justify-center px-2 text-[12.5px]")}><Download className="h-3.5 w-3.5" />Görseli indir</a>
              <button type="button" onClick={() => b.degistir((v) => { const x = v.gonderiler.find((y) => y.id === g.id); if (x) x.gorsel = undefined; }, { gonderi: { id: g.id, gorselKaldir: true } })} className={cn(simgeDugme, "ring-1 ring-inset ring-white/[0.08]")} title="Görseli kaldır" aria-label="Görseli kaldır"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-3.5">
          {hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}
          {k.konu && <Etiket ad="Konu satırı" sag={<Sayac n={say(g.baslik ?? "")} sinir={k.konu} />}><input value={g.baslik ?? ""} onChange={(e) => setG({ ...g, baslik: e.target.value })} maxLength={120} className={cn(alan, "h-10", say(g.baslik ?? "") > k.konu && "ring-rose-400/60")} /></Etiket>}
          <Etiket ad="Metin" sag={<Sayac n={n} sinir={sinir} />}>
            <textarea value={g.metin} onChange={(e) => setG({ ...g, metin: e.target.value })} rows={8} className={cn(alan, "resize-y py-2.5 leading-relaxed", n > sinir && "ring-rose-400/60")} />
          </Etiket>
          {(k.hashtag[1] > 0 || g.kanal === "ozel") && (
            <Etiket ad="Hashtag'ler" sag={<span className={cn("text-[11.5px] tabular-nums", taslak.hashtagler.length > Math.max(k.hashtag[1], 1) ? "text-amber-200/90" : "text-white/40")}>{taslak.hashtagler.length} hashtag</span>}>
              <input value={etiketler} onChange={(e) => setEtiketler(e.target.value)} placeholder="#kadıköy #kahve" className={cn(alan, "h-10")} />
            </Etiket>
          )}
          <Etiket ad="Görsel tarifi" sag={<span className="text-[11.5px] text-white/40">Vayra görsel stüdyosu, {gonderiOrani(g)}</span>}>
            <textarea value={g.gorselIstemi} onChange={(e) => setG({ ...g, gorselIstemi: e.target.value })} rows={3} maxLength={1500} className={cn(alan, "resize-none py-2.5")} />
          </Etiket>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={b.suruyor(`gorsel:${g.id}`)} onClick={gorselUret} className={cn(ikincil, "h-8 text-[12.5px]")}>{b.suruyor(`gorsel:${g.id}`) ? <span className="build-nokta" /> : <Wand2 className="h-3.5 w-3.5" />}{b.suruyor(`gorsel:${g.id}`) ? "Görsel üretiliyor" : g.gorsel ? "Görseli yeniden üret" : "Görsel üret"}<span className="text-white/45">2 kredi</span></button>
            {g.gorselHata && !b.suruyor(`gorsel:${g.id}`) && <span className="text-[12px] leading-snug text-amber-200/90">{g.gorselHata}</span>}
          </div>
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Durum</p><SatirSecici id="buyume-durum" deger={g.durum} set={(v) => setG({ ...g, durum: v })} l={DURUMLAR} /></div>
          <Etiket ad="Paylaşım günü">
            <span className="flex gap-2">
              <input type="date" value={g.tarih ?? ""} onChange={(e) => setG({ ...g, tarih: e.target.value || undefined })} className={cn(alan, "h-10 min-w-0 flex-1 [color-scheme:dark]")} />
              {g.tarih && <button type="button" onClick={() => setG({ ...g, tarih: undefined })} className={cn(ikincil, "h-10")}>Takvimden çıkar</button>}
            </span>
          </Etiket>
          <Etiket ad="Takip bağlantısı" sag={<span className="text-[11.5px] text-white/40">Vayra Analitik kampanya olarak sayar</span>}>
            <span className="flex gap-2">
              <span className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[12px] bg-white/[0.03] px-3 ring-1 ring-inset ring-white/[0.07]"><Link2 className="h-3.5 w-3.5 shrink-0 text-white/40" /><span className="truncate text-[12.5px] text-white/70">{adres}</span></span>
              <button type="button" onClick={() => kopyala("a", adres)} className={cn(ikincil, "h-10")}>{kopya === "a" ? "Kopyalandı" : "Kopyala"}</button>
            </span>
          </Etiket>
        </div>
      </div>
    </YanPanel>
  );
}

const ORAN_SEC = ["1:1", "4:5", "9:16", "16:9"];

export function IcerikBolumu({ p, b, git, istek, istegiTuket }: { p: Proje; b: BuyumeKanca; git: Git; istek: IcerikIstegi | null; istegiTuket: () => void }) {
  const v = b.veri!;
  const [kanal, setKanal] = useState<IcerikKanalId>("instagram");
  const [ozelKanal, setOzelKanal] = useState<OzelKanal>({ ad: "", sinir: 1000, oran: "1:1" });
  const [ton, setTon] = useState<TonId>("samimi");
  const [tonOzel, setTonOzel] = useState("");
  const [adet, setAdet] = useState(3);
  const [konu, setKonu] = useState("");
  const [baglam, setBaglam] = useState<{ tarih?: string; takvimId?: string; baslik?: string } | null>(null);
  const [hata, setHata] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [durum, setDurum] = useState<"tum" | GonderiDurum>("tum");
  const [kanalSuz, setKanalSuz] = useState<string>("tum");
  const [acik, setAcik] = useState<string | null>(null);
  const [kopya, kopyala] = useKopyala();
  const kutu = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!istek) return;
    if (istek.kanal) setKanal(istek.kanal);
    if (istek.konu) setKonu(istek.konu);
    if (istek.tarih || istek.takvimId) setBaglam({ tarih: istek.tarih, takvimId: istek.takvimId }); else setBaglam(null);
    if (istek.takvimId) setAdet(1);
    istegiTuket();
    setTimeout(() => kutu.current?.focus(), 60);
  }, [istek, istegiTuket]);

  const uretiliyor = b.suruyor("icerik");
  const kanalTanim = icerikKanali(kanal);
  const ozelGecerli = kanal !== "ozel" || ozelKanal.ad.trim().length >= 2;
  const uret = async () => {
    setHata(""); setModelYok(false);
    try {
      await b.uret("icerik", { kanal, ozelKanal: kanal === "ozel" ? ozelKanal : undefined, konu: konu.trim(), ton, tonOzel: ton === "ozel" ? tonOzel : undefined, adet, tarih: baglam?.tarih, takvimId: baglam?.takvimId });
      setKonu(""); setBaglam(null); setDurum("tum"); setKanalSuz("tum");
    } catch (e) { if (e instanceof ModelYokHatasi) setModelYok(true); else setHata(e instanceof Error ? e.message : "Gönderi yazılamadı."); }
  };
  const gorselUret = async (g: Gonderi) => { setHata(""); try { await b.uret("gorsel", { gonderiId: g.id }, `gorsel:${g.id}`); } catch (e) { if (!(e instanceof ModelYokHatasi) && !(e instanceof Error && /görsel/i.test(e.message))) setHata(e instanceof Error ? e.message : "Görsel üretilemedi."); } };
  const benzer = async (g: Gonderi) => { setHata(""); try { await b.uret("benzer", { gonderiId: g.id }, `benzer:${g.id}`); } catch (e) { if (e instanceof ModelYokHatasi) setModelYok(true); else setHata(e instanceof Error ? e.message : "Yazılamadı."); } };

  /* Plandaki sıradaki gönderiler: takvimde henüz gönderisi olmayan ilk üç adım. */
  const siradaki = useMemo(() => {
    const pl = v.plan;
    if (!pl) return [];
    const bugun = bugunTR();
    return pl.takvim.filter((o) => (o.tur === "gonderi" || o.tur === "eposta") && PLANDAN_ICERIGE[o.kanal] && ogeTarihi(pl, o) >= bugun && !v.gonderiler.some((g) => g.takvimId === o.id)).slice(0, 3).map((o) => ({ ...o, tarih: ogeTarihi(pl, o) }));
  }, [v.plan, v.gonderiler]);

  const sayi = (d: GonderiDurum) => v.gonderiler.filter((g) => g.durum === d).length;
  const kanallarVar = [...new Set(v.gonderiler.map((g) => g.kanal))];
  const liste = v.gonderiler.filter((g) => (durum === "tum" || g.durum === durum) && (kanalSuz === "tum" || g.kanal === kanalSuz));
  const surenler = b.suren.filter((s) => s === "icerik" || s.startsWith("benzer:"));

  return (
    <div className="space-y-4">
      {/* Komut kutusu */}
      <div className="cam-istemci rounded-[22px] p-3">
        {baglam?.tarih && (
          <div className="mb-2 flex items-center gap-2 px-1 text-[12.5px] text-white/65">
            <CalendarDays className="h-3.5 w-3.5 text-[#8be6ff]" />Takvimdeki {turkceTarih(baglam.tarih, { day: "numeric", month: "long", weekday: "long" })} adımı için
            <button type="button" onClick={() => setBaglam(null)} aria-label="Takvim bağlantısını kaldır" className="ml-auto text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        <textarea ref={kutu} value={konu} onChange={(e) => setKonu(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !uretiliyor && ozelGecerli) { e.preventDefault(); uret(); } }} rows={2} maxLength={300}
          placeholder={`Ne hakkında paylaşalım? Yeni sezon çekirdeği, hafta sonu rezervasyonu, ekibin hikâyesi`} className="w-full resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/40" />
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <SecenekMenusu genislik={340} baslik="Kanal" deger={kanal} sec={(id) => setKanal(id as IcerikKanalId)}
            l={ICERIK_KANALLARI.filter((x) => x.id !== "ozel").map((x) => ({ id: x.id, ad: x.ad, alt: `${x.sinir.toLocaleString("tr-TR")} karakter, ${x.oranAd}`, logo: <KanalLogo kanal={x.plan} boyut={30} /> }))}
            ozel={{ deger: ozelKanal.ad, set: (a) => setOzelKanal({ ...ozelKanal, ad: a }), yer: "Kanalın adı: Pinterest, Telegram kanalı", alt: "Adını, sınırını ve oranını belirle",
              ek: <div className="space-y-2">
                <span className="flex h-9 items-center rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]"><input inputMode="numeric" value={ozelKanal.sinir || ""} onChange={(e) => setOzelKanal({ ...ozelKanal, sinir: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || 0 })} className="h-full min-w-0 flex-1 bg-transparent pl-3 text-[13px] text-white outline-none" /><span className="pr-3 text-[12px] text-white/45">karakter</span></span>
                <div className="flex flex-wrap gap-1">{ORAN_SEC.map((o) => <button key={o} type="button" onClick={() => setOzelKanal({ ...ozelKanal, oran: o })} className={cn("h-7 rounded-full px-2.5 text-[12px]", ozelKanal.oran === o ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/60 ring-1 ring-inset ring-white/[0.08]")}>{o}</button>)}</div>
              </div> }}
            tetik={(ac, a) => <Cip onClick={ac} acik={a}><KanalLogo kanal={kanalTanim.plan} boyut={22} className="rounded-full" /><span className="truncate">{kanal === "ozel" ? ozelKanal.ad || "Özel kanal" : kanalTanim.ad}</span></Cip>} />
          <SecenekMenusu genislik={280} baslik="Ton" deger={ton} sec={(id) => setTon(id as TonId)} l={TONLAR.filter((t) => t.id !== "ozel").map((t) => ({ id: t.id, ad: t.ad, alt: t.alt }))}
            ozel={{ deger: tonOzel, set: setTonOzel, yer: "Tonu tarif et: kısa, şiirsel, mahalle ağzı", alt: "Tonu kendin tarif et" }}
            tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{ton === "ozel" ? tonOzel || "Özel ton" : TONLAR.find((t) => t.id === ton)?.ad}</Cip>} />
          <span className="inline-flex h-8 items-center rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">
            <button type="button" aria-label="Azalt" disabled={adet <= 1} onClick={() => setAdet((n) => Math.max(1, n - 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
            <motion.span key={adet} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="min-w-[64px] text-center text-[12.5px] tabular-nums text-white/85">{adet} gönderi</motion.span>
            <button type="button" aria-label="Artır" disabled={adet >= 5} onClick={() => setAdet((n) => Math.min(5, n + 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
          </span>
          <button type="button" onClick={uret} disabled={uretiliyor || !ozelGecerli} className={cn(birincil, "ml-auto h-9")}>{uretiliyor ? <span className="build-nokta" /> : <Wand2 className="h-4 w-4" />}{uretiliyor ? "Yazılıyor" : "Yaz"}</button>
        </div>
      </div>

      {siradaki.length > 0 && (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {siradaki.map((o) => (
            <button key={o.id} type="button" onClick={() => { const ik = PLANDAN_ICERIGE[o.kanal]!; setKanal(ik); setKonu(`${o.baslik}${o.aciklama ? `: ${o.aciklama}` : ""}`); setBaglam({ tarih: o.tarih, takvimId: o.id }); setAdet(1); kutu.current?.focus(); }}
              className="flex min-w-[220px] max-w-[280px] flex-1 items-center gap-2.5 rounded-[14px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]">
              <KanalLogo kanal={o.kanal} boyut={30} />
              <span className="min-w-0"><span className="block text-[11.5px] text-white/45">Plandan, {turkceTarih(o.tarih, { day: "numeric", month: "short", weekday: "short" })}</span><span className="block truncate text-[13px] text-white">{o.baslik}</span></span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {modelYok && <ModelYokKart tekrar={() => { setModelYok(false); b.yukle(); }} />}
      {surenler.map((s) => {
        const ornek = s.startsWith("benzer:") ? v.gonderiler.find((g) => g.id === s.slice(7)) : null;
        const kanalAd = kanal === "ozel" ? `${ozelKanal.ad || "özel kanal"} gönderisi` : /gönderisi|hikâyesi|durumu|bülteni/.test(kanalTanim.ad) ? kanalTanim.ad : `${kanalTanim.ad} gönderisi`;
        return <Suruyor key={s} metin={ornek ? `${gonderiKanalAdi(ornek)} için 3 benzer gönderi yazılıyor` : `${adet} ${kanalAd} yazılıyor`} alt="Ajan siteni ve planını okuyup kanalın sınırına göre yazıyor." />;
      })}

      {v.gonderiler.length > 0 ? (
        <Kart baslik={<span className="flex items-center gap-2">Gönderiler<Rozet>{v.gonderiler.length}</Rozet></span>}
          sag={<>
            <Secici id="buyume-gonderi-durum" kucuk deger={durum} set={setDurum} l={[{ id: "tum" as const, ad: "Tümü" }, ...DURUMLAR.map((d) => ({ id: d.id, ad: `${d.ad} ${sayi(d.id)}` }))]} />
            {kanallarVar.length > 1 && (
              <SecenekMenusu genislik={280} hiza="sag" deger={kanalSuz} sec={setKanalSuz} l={[{ id: "tum", ad: "Bütün kanallar", alt: `${v.gonderiler.length} gönderi` }, ...kanallarVar.map((x) => ({ id: x, ad: icerikKanali(x).ad, alt: `${v.gonderiler.filter((g) => g.kanal === x).length} gönderi`, logo: <KanalLogo kanal={icerikKanali(x).plan} boyut={26} /> }))]}
                tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-7 pl-2.5 text-[12px]">{kanalSuz === "tum" ? "Bütün kanallar" : icerikKanali(kanalSuz).ad}</Cip>} />
            )}
          </>}>
          {liste.length ? (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {liste.map((g) => (
                  <GonderiKarti key={g.id} p={p} g={g} b={b} ac={() => setAcik(g.id)} uretGorsel={() => gorselUret(g)} benzer={() => benzer(g)}
                    sil={() => b.degistir((x) => { x.gonderiler = x.gonderiler.filter((y) => y.id !== g.id); }, { gonderiSil: g.id })}
                    kopyalandi={kopya === g.id} kopyala={() => kopyala(g.id, gonderiMetni(g))} />
                ))}
              </AnimatePresence>
            </div>
          ) : <p className="rounded-[14px] bg-white/[0.02] px-3.5 py-3 text-[13px] text-white/55 ring-1 ring-inset ring-white/[0.06]">Bu süzgeçte gönderi yok.</p>}
        </Kart>
      ) : !surenler.length && (
        <Kart>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex -space-x-3">
              {(["instagram", "tiktok", "linkedin", "whatsapp"] as const).map((x, i) => <motion.span key={x} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}><KanalLogo kanal={x} boyut={44} className="rounded-[14px] bg-[#1a1b1f] ring-2 ring-[#131416]" /></motion.span>)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white">İlk gönderilerini yaz</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">Kanal seç, konuyu yaz; ajan kanalın karakter sınırına göre metni ve hashtag'leri hazırlar, görseli Vayra görsel stüdyosu kanalın oranında üretir.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {!v.plan && <button type="button" onClick={() => git("plan")} className={ikincil}>Önce plan çıkar</button>}
              <button type="button" onClick={() => kutu.current?.focus()} className={birincil}>Konuyu yaz</button>
            </div>
          </div>
        </Kart>
      )}
      <GonderiPaneli p={p} b={b} id={acik} kapat={() => setAcik(null)} />
    </div>
  );
}

