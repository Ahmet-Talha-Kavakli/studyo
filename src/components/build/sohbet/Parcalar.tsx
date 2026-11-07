"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Ban, BarChart3, Box, Brain, Check, ChevronDown, Clock3, Code2, FileSpreadsheet, FileText, Globe, Hand, ImageIcon, Loader2, Music, Plug, Presentation, Search, ShieldCheck, Sparkles, Terminal, Video, Wrench, GraduationCap, CalendarClock, History, Calculator, Coins, CloudSun, CalendarPlus, QrCode, Radar } from "lucide-react";
import type { DosyaBilgisi } from "@/lib/build/belgeTipler";
import { cn } from "@/lib/utils";
import { DosyaKarti } from "./DosyaKarti";
import { GorselKarti } from "./Gorsellestirme";
import { McpUygulama, type UygulamaGonder } from "./McpUygulama";
import { GorevKarti, KartlarKarti, SesliOzetKarti, SohbetlerKarti, TestKarti } from "./Kartlar";
import { DokumKarti } from "./Dokum";
import { HavaKarti, HesapKarti, IzlemeKarti, KarekodKarti, KurKarti, SayfalarKarti, TakvimKarti } from "./AracKartlari";
import { TuvalKarti } from "./Tuval";
import { AnalizKarti } from "./Veri";
import { GorselIzgara, type GorselIslem } from "./GorselDuzenle";
import { alanAdi, favicon } from "./ortak";
import type { AracParca, Onayla } from "./tipler";

export const ARAC_ADI: Record<string, string> = { gorsel_uret: "Görsel üret", video_uret: "Video üret", muzik_uret: "Müzik üret", ses_uret: "Seslendir", model_3d_uret: "3D model üret", proje_olustur: "Build projesi aç", projelerim: "Projelere bak", bellege_yaz: "Belleğe yaz", bellekten_sil: "Bellekten sil", belge_olustur: "Word belgesi", tablo_olustur: "Excel tablosu", sunum_olustur: "Sunum", gorsellestir: "Görselleştirme", tuval_yaz: "Tuval", veri_analiz: "Veri analizi", test_hazirla: "Test", bilgi_kartlari: "Bilgi kartları", gorev_zamanla: "Zamanlanmış görev", gecmis_sohbet_ara: "Geçmiş sohbetlerde arama", gorsel_duzenle: "Görsel düzenleme", sesli_ozet: "Sesli özet", web_oku: "Web sayfası okuma", hesapla: "Hesap", kur_getir: "Döviz ve altın", hava_durumu: "Hava durumu", takvim_olustur: "Takvim dosyası", karekod_olustur: "Karekod", izleme_kur: "İzleme", yetenek_betigi: "Yetenek betiği" };
const ARAC_IKON: Record<string, typeof ImageIcon> = { bellege_yaz: Brain, bellekten_sil: Brain, bilgide_ara: Search, yetenek_oku: Sparkles, yetenek_dosyasi: FileText, gorsel_uret: ImageIcon, video_uret: Video, muzik_uret: Music, ses_uret: Music, model_3d_uret: Box, proje_olustur: Code2, projelerim: Code2, belge_olustur: FileText, tablo_olustur: FileSpreadsheet, sunum_olustur: Presentation, gorsellestir: BarChart3, web_search: Search, web_fetch: Globe, bash_code_execution: Terminal, text_editor_code_execution: Terminal, code_execution: Terminal, tuval_yaz: FileText, veri_analiz: BarChart3, test_hazirla: GraduationCap, bilgi_kartlari: GraduationCap, gorev_zamanla: CalendarClock, gecmis_sohbet_ara: History, gorsel_duzenle: ImageIcon, sesli_ozet: Music, web_oku: Globe, hesapla: Calculator, kur_getir: Coins, hava_durumu: CloudSun, takvim_olustur: CalendarPlus, karekod_olustur: QrCode, izleme_kur: Radar };

/**
 * Çok araçlı bağlantıların ara araçları (<servis>__araclari_ara, __arac_calistir, __onayli_arac_calistir) ve
 * diğer bağlantı araçları için okunur Türkçe ad ve başlık. Servis adı etiketin ("GitHub: araç ara") başından gelir.
 */
function aracAdi(a: AracParca): { ad: string; baslik: string } {
  const m = /__(araclari_ara|arac_calistir|onayli_arac_calistir)$/.exec(a.ad);
  if (!m) return { ad: ARAC_ADI[a.ad] ?? a.etiket ?? a.ad, baslik: a.baslik };
  const servis = (a.etiket ?? "").split(":")[0].trim() || "Bağlantı";
  const islem = a.girdi?.["Araç"];
  if (m[1] === "araclari_ara") return { ad: `${servis}: araç arama`, baslik: a.durum === "suruyor" ? `${servis} araçlarında aranıyor` : a.durum === "hata" ? `${servis}: ${a.baslik.toLocaleLowerCase("tr")}` : `${servis} araçlarında arandı` };
  return {
    ad: m[1] === "onayli_arac_calistir" ? `${servis}: onay isteyen işlem` : `${servis}: işlem`,
    baslik: a.durum === "suruyor" ? `${servis}${islem ? ` · ${islem}` : ""} çalışıyor` : a.durum === "hata" ? `${servis}: ${a.baslik.toLocaleLowerCase("tr")}` : `${servis}${islem ? ` · ${islem}` : " aracı"} çalıştı`,
  };
}
const aracIkonu = (a: AracParca) => ARAC_IKON[a.ad] ?? (a.ad.includes("__") ? Plug : Wrench);

/** Onay kartı: izni "sor" olan (ya da "Onay iste" modunda yan etkili) bir araç çalışmak üzere. */
function OnayKarti({ a, onayla, hepEtiketi }: { a: AracParca; onayla?: Onayla; hepEtiketi?: string }) {
  const I = aracIkonu(a);
  const [gidiyor, setGidiyor] = useState<"" | "onay" | "ret" | "hep">("");
  const alanlar = Object.entries(a.girdi ?? {});
  return (
    <div className="my-3 max-w-[560px] overflow-hidden rounded-[18px] bg-white/[0.04] ring-1 ring-inset ring-[#55d6fd]/25">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-white">{aracAdi(a).ad}</span><span className="block text-[12px] text-white/50">Bunu çalıştırmak için onayını istiyor</span></span>
        <Hand className="h-4 w-4 text-[#8be6ff]" />
      </div>
      {alanlar.length > 0 && (
        <dl className="divide-y divide-white/[0.05] px-3.5">
          {alanlar.map(([k, v]) => <div key={k} className="flex gap-3 py-2 text-[13px]"><dt className="w-[86px] shrink-0 text-white/45">{k}</dt><dd className="min-w-0 flex-1 whitespace-pre-wrap break-words text-white/85">{v}</dd></div>)}
        </dl>
      )}
      {onayla && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3.5 py-3">
          <button type="button" disabled={!!gidiyor} onClick={() => { setGidiyor("onay"); onayla("onay"); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-60">{gidiyor === "onay" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Onayla</button>
          <button type="button" disabled={!!gidiyor} onClick={() => { setGidiyor("ret"); onayla("ret"); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12] disabled:opacity-60"><Ban className="h-3.5 w-3.5" />Reddet</button>
          <button type="button" disabled={!!gidiyor} onClick={() => { setGidiyor("hep"); onayla("onay", true); }} title="Bu aracı bundan sonra sormadan kullanır" className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-60"><ShieldCheck className="h-3.5 w-3.5" />{hepEtiketi ?? "Her zaman izin ver"}</button>
        </div>
      )}
    </div>
  );
}

/**
 * Dosya ve görselleştirme kartları için çağıranın verdiği açıcılar (verilmezse kart kendi panelini açar).
 * gonder: MCP Apps görünümünün ui/message isteği sohbete kullanıcı mesajı olarak gider (verilmezse yok sayılır).
 */
export type KartAcicilar = { dosyaAc?: (d: DosyaBilgisi) => void; htmlAc?: (belge: string) => void; duzelt?: (istek: string) => void; gonder?: UygulamaGonder; tuvalAc?: (id: string) => void; paylasim?: string; gorselIslem?: GorselIslem };

/** ziyaretci: yayındaki ajan sayfası (görünüm sahip anahtarı olmadan, parçadaki belirteçle açılır). */
export function AracKarti({ a, onayla, hepEtiketi, acicilar, ziyaretci }: { a: AracParca; onayla?: Onayla; hepEtiketi?: string; acicilar?: KartAcicilar; ziyaretci?: boolean }) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const I = aracIkonu(a);
  const s = a.sonuc;
  const adlar = aracAdi(a);
  if (a.durum === "onay" && a.girdi) return <OnayKarti a={a} onayla={onayla} hepEtiketi={hepEtiketi} />;
  if (a.durum === "onay") return <p className="my-2 flex items-center gap-2 text-[13px] text-white/45"><Clock3 className="h-3.5 w-3.5" />{adlar.ad}: onaydan sonra çalışacak</p>;
  if (a.durum === "reddedildi") return <p className="my-2 flex items-center gap-2 text-[13px] text-white/40"><Ban className="h-3.5 w-3.5" />{adlar.ad}: {a.baslik.toLocaleLowerCase("tr")}</p>;
  const acilir = !!a.ayrinti || s?.tur === "kod" || s?.tur === "arama";
  // Dosya ve görselleştirme bitince yalnız kartı görünür (durum satırı kartın kendisidir).
  if (a.durum === "bitti" && s?.tur === "dosya") return <DosyaKarti d={s.dosya} kaynakAd={s.kaynakAd} onizle={acicilar?.dosyaAc} />;
  if (a.durum === "bitti" && s?.tur === "gorsellestirme") return <GorselKarti baslik={s.baslik} html={s.html} tip={s.tip} panelAc={acicilar?.htmlAc} duzelt={acicilar?.duzelt} />;
  // MCP Apps: arayüzlü bağlantı aracı; araç hata döndürse de sonucu görünüm kendisi gösterir.
  if ((a.durum === "bitti" || a.durum === "hata") && s?.tur === "uygulama") return <McpUygulama s={s} parcaId={a.id} gonder={acicilar?.gonder} ziyaretci={ziyaretci} />;
  // v4 kartları: tuval, veri analizi (hata da gösterilir), test, bilgi kartları, sesli özet, görev, geçmiş sohbetler.
  if (a.durum === "bitti" && s?.tur === "tuval") return <TuvalKarti s={s} ac={acicilar?.tuvalAc} paylasim={acicilar?.paylasim} />;
  if ((a.durum === "bitti" || a.durum === "hata") && s?.tur === "analiz") return <AnalizKarti a={s} />;
  if (a.durum === "bitti" && s?.tur === "test") return <TestKarti t={s} kimlik={a.id} gonder={acicilar?.gonder} />;
  if (a.durum === "bitti" && s?.tur === "kartlar") return <KartlarKarti k={s} kimlik={a.id} />;
  if (a.durum === "bitti" && s?.tur === "sesliOzet") return <SesliOzetKarti o={s} />;
  if (a.durum === "bitti" && s?.tur === "gorev") return <GorevKarti g={s} salt={!!acicilar?.paylasim} />;
  if (a.durum === "bitti" && s?.tur === "sohbetler") return <SohbetlerKarti s={s} />;
  // v5 kartları: okunan sayfalar (hata da gösterilir), hesap, kur, hava, takvim, karekod, izleme.
  if ((a.durum === "bitti" || a.durum === "hata") && s?.tur === "sayfalar") return <SayfalarKarti s={s} />;
  if (a.durum === "bitti" && s?.tur === "hesap") return <HesapKarti h={s} />;
  if (a.durum === "bitti" && s?.tur === "kur") return <KurKarti k={s} />;
  if (a.durum === "bitti" && s?.tur === "hava") return <HavaKarti h={s} />;
  if (a.durum === "bitti" && s?.tur === "takvim") return <TakvimKarti t={s} />;
  if (a.durum === "bitti" && s?.tur === "karekod") return <KarekodKarti k={s} />;
  if (a.durum === "bitti" && s?.tur === "dokum") return <DokumKarti d={s} />;
  if (a.durum === "bitti" && s?.tur === "izleme") return <IzlemeKarti i={s} salt={!!acicilar?.paylasim} />;
  return (
    <div className="my-2.5">
      <button type="button" onClick={() => setAcik((x) => !x)} disabled={!acilir} className="flex max-w-full items-center gap-2 text-left text-[13px] text-white/55 enabled:hover:text-white/85">
        {a.durum === "suruyor" ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#55d6fd]" /> : a.durum === "hata" ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" /> : <I className="h-3.5 w-3.5 shrink-0" />}
        <span className={cn("truncate", a.durum === "suruyor" && "build-parilti")}>{adlar.baslik}</span>
        {acilir && <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", acik && "rotate-180")} />}
      </button>
      {acik && a.ayrinti && <p className="mt-1.5 border-l border-white/10 pl-3 text-[12.5px] text-white/45">{a.ayrinti}</p>}
      {s?.tur === "arama" && (
        <div className={cn("mt-2 flex flex-wrap gap-1.5", !acik && "max-h-[34px] overflow-hidden")}>
          {s.kaynaklar.map((k) => (
            <a key={k.url} href={k.url} target="_blank" rel="noopener noreferrer" title={k.baslik} className="inline-flex h-8 max-w-[240px] items-center gap-1.5 rounded-full bg-white/[0.06] pl-1.5 pr-3 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={favicon(k.url)} alt="" className="h-4 w-4 rounded-sm" />
              <span className="truncate">{k.baslik || alanAdi(k.url)}</span>
            </a>
          ))}
        </div>
      )}
      {s?.tur === "sayfa" && (
        <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex h-8 max-w-[320px] items-center gap-1.5 rounded-full bg-white/[0.06] pl-1.5 pr-3 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={favicon(s.url)} alt="" className="h-4 w-4 rounded-sm" /><span className="truncate">{s.baslik || alanAdi(s.url)}</span>
        </a>
      )}
      {s?.tur === "kod" && acik && (s.cikti || s.hata) && (
        <pre className="sc-kod mt-2 max-h-[320px] overflow-auto rounded-[12px] bg-[#0c0d0f] p-3 text-[12px] leading-relaxed ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]"><span className="text-white/75">{s.cikti}</span>{s.hata && <span className="text-rose-300/90">{s.hata}</span>}</pre>
      )}
      {s?.tur === "gorsel" && <GorselIzgara urller={s.urller} islem={acicilar?.gorselIslem} />}
      {s?.tur === "video" && <video src={s.url} controls playsInline className="mt-2.5 w-full max-w-[560px] rounded-[16px] ring-1 ring-inset ring-white/[0.08]" />}
      {s?.tur === "ses" && (
        <div className="mt-2.5 max-w-[460px] rounded-[16px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.08]">
          {s.baslik && <p className="mb-2 text-[13px] font-medium text-white">{s.baslik}</p>}
          <audio src={s.url} controls className="w-full" />
        </div>
      )}
      {s?.tur === "3d" && <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white"><Box className="h-3.5 w-3.5" />3D modeli aç</a>}
      {s?.tur === "proje" && (
        <div className="mt-2.5 flex max-w-[520px] items-center gap-3 rounded-[18px] bg-white/[0.04] p-3.5 ring-1 ring-inset ring-white/[0.09]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.12] text-[#7fe0ff]"><Code2 className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold text-white">{s.ad}</span><span className="block truncate text-[12.5px] text-white/50">Vayra Build projesi · {({ site: "Web sitesi", uygulama: "Web uygulaması", oyun: "Oyun", mobil: "Mobil uygulama" } as Record<string, string>)[s.projeTur] ?? s.projeTur}</span></span>
          <button type="button" onClick={() => { try { sessionStorage.setItem(`vayra-build-ilk-${s.id}`, JSON.stringify({ istem: s.istem, mod: "yap", ekler: [] })); } catch { /* yok */ } router.push(`/panel/build/${s.id}`); }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Projeyi aç<ArrowRight className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}

export function Dusunce({ metin, suruyor }: { metin: string; suruyor: boolean }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="my-2">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex items-center gap-2 text-[13px] text-white/50 hover:text-white/80">
        <Brain className={cn("h-3.5 w-3.5", suruyor && "animate-pulse")} />{suruyor ? <span className="build-parilti">Düşünüyor</span> : "Düşündü"}<ChevronDown className={cn("h-3 w-3 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>{acik && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="mt-1.5 whitespace-pre-wrap border-l border-white/10 pl-3 text-[13px] leading-relaxed text-white/45">{metin}</p></motion.div>}</AnimatePresence>
    </div>
  );
}
