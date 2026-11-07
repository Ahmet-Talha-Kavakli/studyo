"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Database, ExternalLink, FileCode2, Globe, KeyRound, Link2, Loader2, MessageSquare, ScrollText, ShieldAlert, Trash2, Users, Inbox, Gamepad2, LayoutDashboard, Smartphone } from "lucide-react";
import { AcilirSecim, Anahtar, KodKutusu, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { paylasimYolu, type PaylasimAyari, type PaylasimSurumOzeti } from "@/lib/build/paylasimOrtak";
import { bulguSatiri } from "@/lib/build/toplulukDenetim";
import type { ToplulukOzet } from "@/lib/build/toplulukOrtak";
import type { ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { Grup, KayitDurumu, Satir, YanPanel, YazarSecici, birincil, ikincil, paylasimDurumuYenile, sayiYaz, sonYazar, yazarHatirla } from "./ortak";

type Veri = { paylasim: PaylasimAyari | null; surumler: PaylasimSurumOzeti[]; proje: { ad: string; tur: ProjeTur; kapak: string | null; dosyaSayisi: number; sunucuDosyasi?: number }; topluluk: ToplulukOzet | null };
const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };

/** Neler gider, neler gitmez: kısa ve kesin. */
export function Kapsam({ topluluk }: { topluluk?: boolean }) {
  const gitmez = [[KeyRound, "Sırlar ve ortam değişkenleri"], [Inbox, "Form gelen kutusu"], [Database, "Veritabanı kayıtları"], [Users, "Üyeler"], [ScrollText, "Günlükler"], [MessageSquare, "Ajan sohbeti"]] as const;
  return (
    <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
      <p className="flex items-center gap-2 text-[13px] font-medium text-white"><FileCode2 className="h-4 w-4 text-[#7fe0ff]" />Yalnız dosyalar paylaşılır</p>
      <p className="mt-1 text-[12px] leading-relaxed text-white/50">{topluluk
        ? "Seçtiğin sürümün dosyalarının kopyası şablon olur; projeni sonra değiştirsen de şablon aynı kalır, istersen güncellersin. Remix eden herkes kendi projesinde açar."
        : "Sayfa, seçtiğin sürümün HTML, CSS ve JavaScript dosyalarını gösterir. Önizlemede formlar kaydedilmez, veritabanı ve sunucu fonksiyonları çalışmaz."}</p>
      <p className="mt-3 text-[12px] font-medium text-white/70">Hiçbir zaman paylaşılmayanlar</p>
      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {gitmez.map(([I, ad]) => <span key={ad} className="flex items-center gap-2 text-[12px] text-white/55"><I className="h-3.5 w-3.5 shrink-0 text-white/35" />{ad}</span>)}
      </div>
    </div>
  );
}

/**
 * Paylaş paneli (sahip): herkese açık bağlantı, remix ve kod izinleri, sürüm (son ya da sabit), görünen ad, açıklama,
 * görüntülenme ve remix sayısı, gömme kodu, bağlantıyı kaldırma. Her değişiklik anında kaydedilir.
 */
export function PaylasPaneli({ projeId, acik, kapat, toplulugaEkle }: { projeId: string | null; acik: boolean; kapat: () => void; toplulugaEkle?: () => void }) {
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState("");
  const [is, setIs] = useState<"" | "olustur" | "kaldir">("");
  const [kaldirOnay, setKaldirOnay] = useState(false);
  const [kayit, setKayit] = useState<"bos" | "kaydediliyor" | "kaydedildi">("bos");
  const [kopya, setKopya] = useState(false);
  const [aciklama, setAciklama] = useState("");
  const [koken, setKoken] = useState("");
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yukle = useCallback(async () => {
    if (!projeId) return;
    try {
      const x = await api<Veri>(`/api/build/paylasim?proje=${projeId}`);
      setV(x); setAciklama(x.paylasim?.aciklama ?? "");
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi."); }
  }, [projeId]);
  useEffect(() => { setKoken(location.origin); }, []);
  useEffect(() => { if (acik) { setV(null); setHata(""); setKaldirOnay(false); setKayit("bos"); yukle(); } }, [acik, yukle]);

  const p = v?.paylasim ?? null;
  const adres = p ? `${koken}${paylasimYolu(p.id)}` : "";

  const olustur = async () => {
    if (!projeId) return;
    setIs("olustur"); setHata("");
    try {
      const x = await api<{ paylasim: PaylasimAyari }>("/api/build/paylasim", { govde: { projeId, yazar: sonYazar() } });
      setV((o) => (o ? { ...o, paylasim: x.paylasim } : o)); setAciklama(x.paylasim.aciklama); paylasimDurumuYenile();
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Bağlantı oluşturulamadı."); }
    finally { setIs(""); }
  };
  const kaydet = useCallback(async (g: Record<string, unknown>) => {
    if (!p) return;
    setKayit("kaydediliyor"); setHata("");
    try { const x = await api<{ paylasim: PaylasimAyari }>(`/api/build/paylasim/${p.id}`, { method: "PATCH", govde: g }); setV((o) => (o ? { ...o, paylasim: x.paylasim } : o)); setKayit("kaydedildi"); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); setKayit("bos"); }
  }, [p]);
  const gecikmeli = (g: Record<string, unknown>) => { if (zaman.current) clearTimeout(zaman.current); zaman.current = setTimeout(() => kaydet(g), 650); };
  const kaldir = async () => {
    if (!p) return;
    setIs("kaldir");
    try { await api(`/api/build/paylasim/${p.id}`, { method: "DELETE" }); setV((o) => (o ? { ...o, paylasim: null } : o)); setKaldirOnay(false); paylasimDurumuYenile(); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaldırılamadı."); }
    finally { setIs(""); }
  };
  const kopyala = () => { navigator.clipboard?.writeText(adres).catch(() => {}); setKopya(true); setTimeout(() => setKopya(false), 1500); };

  const surumListesi = v ? [
    { id: "son", ad: "Her zaman son sürüm", alt: v.surumler[0] ? `Şu an sürüm ${v.surumler[0].no}; yeni değişiklikler kendiliğinden görünür` : "Henüz sürüm yok" },
    ...(p && p.surum !== "son" && !v.surumler.some((s) => s.id === (p.surum as { id: string }).id) ? [{ id: p.surum.id, ad: `Sürüm ${p.surum.no}`, alt: "Sabitlendi; projenin geçmişinde artık yok" }] : []),
    ...v.surumler.map((s) => ({ id: s.id, ad: `Sürüm ${s.no}`, alt: `${s.aciklama} · ${gorece(s.zaman)}` })),
  ] : [];
  const TurIkon = v ? TUR_IKON[v.proje.tur] : Globe;

  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Paylaş" alt={v ? `${v.proje.ad} için herkese açık sayfa` : "Herkese açık sayfa"} durum={<KayitDurumu d={kayit} />}
      alt2={p ? (
        <>
          <AnimatePresence mode="wait" initial={false}>
            {kaldirOnay ? (
              <motion.span key="onay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-rose-100/80">Adres hemen çalışmaz olur</span>
                <button type="button" onClick={kaldir} disabled={is === "kaldir"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-4 text-[12.5px] font-semibold text-white">{is === "kaldir" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaldır</button>
                <button type="button" onClick={() => setKaldirOnay(false)} className="h-9 rounded-full px-3 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button>
              </motion.span>
            ) : (
              <motion.button key="kaldir" type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setKaldirOnay(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Bağlantıyı kaldır</motion.button>
            )}
          </AnimatePresence>
          <span className="flex-1" />
          <button type="button" onClick={kapat} className={birincil}>Bitti</button>
        </>
      ) : undefined}>
      {!v ? (
        hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></div>
      ) : !p ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-[18px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.08]">
            {v.proje.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.proje.kapak} alt="" className="h-14 w-[88px] shrink-0 rounded-[10px] object-cover object-top ring-1 ring-inset ring-white/[0.08]" />
              : <span className="flex h-14 w-[88px] shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/60"><TurIkon className="h-5 w-5" /></span>}
            <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold text-white">{v.proje.ad}</span><span className="block text-[12.5px] text-white/50">{v.surumler[0] ? `Sürüm ${v.surumler[0].no} · ${v.proje.dosyaSayisi} dosya` : "Henüz sürüm yok"}</span></span>
          </div>
          <div className="rounded-[18px] bg-[#55d6fd]/[0.06] p-4 ring-1 ring-inset ring-[#55d6fd]/15">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-white"><Link2 className="h-4 w-4 text-[#7fe0ff]" />Bağlantıyla paylaş</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">Bağlantıyı alan herkes projenin canlı önizlemesini açar, istersen kodunu görür ve kendi projelerine remix eder. Sonra izinleri değiştirebilir ya da bağlantıyı kaldırabilirsin.</p>
            <button type="button" onClick={olustur} disabled={is === "olustur" || !v.surumler.length} className={cn(birincil, "mt-3.5 h-10 px-5")}>{is === "olustur" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Bağlantı oluştur</button>
          </div>
          {hata && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />{hata}</p>}
          <Kapsam />
        </div>
      ) : (
        <div className="space-y-4">
          {/* bağlantı */}
          <div className="rounded-[18px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.08]">
            <div className="flex items-center gap-3">
              {v.proje.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.proje.kapak} alt="" className="h-12 w-[76px] shrink-0 rounded-[9px] object-cover object-top ring-1 ring-inset ring-white/[0.08]" />
                : <span className="flex h-12 w-[76px] shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06] text-white/60"><TurIkon className="h-5 w-5" /></span>}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Paylaşılıyor</span>
                <span className="block truncate text-[12.5px] text-white/55" title={adres}>{adres.replace(/^https?:\/\//, "")}</span>
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={kopyala} className={cn(birincil, "flex-1")}>{kopya ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{kopya ? "Kopyalandı" : "Bağlantıyı kopyala"}</button>
              <a href={adres} target="_blank" rel="noopener noreferrer" className={ikincil}><ExternalLink className="h-4 w-4" />Aç</a>
            </div>
            <dl className="mt-3 grid grid-cols-3 divide-x divide-white/[0.06] rounded-[14px] bg-black/20 py-2.5 text-center ring-1 ring-inset ring-white/[0.05]">
              {([["Görüntülenme", sayiYaz(p.goruntulenme)], ["Remix", sayiYaz(p.remixSayisi)], ["Açıldı", gorece(p.olusturma)]] as const).map(([a, d]) => (
                <div key={a}><dt className="text-[11.5px] text-white/45">{a}</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{d}</dd></div>
              ))}
            </dl>
          </div>

          {p.engel.length > 0 && (
            <div className="rounded-[16px] bg-rose-500/[0.08] p-3.5 ring-1 ring-inset ring-rose-400/20">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-rose-100"><ShieldAlert className="h-4 w-4" />Sayfa şu anda kapalı</p>
              <p className="mt-1 text-[12px] leading-relaxed text-rose-100/70">Paylaşılan sürümde gizli bilgi bulundu; ziyaretçiler sayfayı açamaz. Koddan çıkarınca kendiliğinden açılır.</p>
              <ul className="mt-2 space-y-1">{p.engel.map((b) => <li key={bulguSatiri(b)} className="text-[12px] text-rose-100/85">{bulguSatiri(b)}</li>)}</ul>
            </div>
          )}

          <Grup>
            <Satir baslik="Remix'e izin ver" alt="Bakan kişi dosyaların kopyasını kendi projelerinde açabilir; kopyada senin projenin adı anılır."><Anahtar acik={p.remix} set={(x) => kaydet({ remix: x })} etiket="Remix'e izin ver" /></Satir>
            <Satir baslik="Kodu göster" alt="Dosya ağacı ve kod salt okunur görünür. Kapalıyken yalnız canlı önizleme açılır."><Anahtar acik={p.kod} set={(x) => kaydet({ kod: x })} etiket="Kodu göster" /></Satir>
            {!!v.proje.sunucuDosyasi && (p.kod || p.remix) && <p className="mx-4 mb-3 rounded-[12px] bg-amber-400/[0.07] px-3 py-2.5 text-[12px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15">Projede {v.proje.sunucuDosyasi} sunucu fonksiyonu (api klasörü) var. Kod açıkken ve remix'te bu dosyaların kaynağı da görünür ve kopyalanır. Gizli anahtarlar vayra.sir ile okunduğu için paylaşılmaz; yine de iş kuralların gizliyse ikisini de kapat.</p>}
            <Satir baslik="Paylaşılan sürüm" alt="Son sürümde her değişiklik sayfaya yansır; bir sürümü sabitlersen sayfa o hâlde kalır."
              alt3={<AcilirSecim deger={p.surum === "son" ? "son" : p.surum.id} set={(x) => kaydet({ surum: x })} l={surumListesi} />} />
          </Grup>

          <Grup>
            <Satir baslik="Görünen ad" alt="Sayfada sahibi olarak bu ad yazar. Seçmezsen Anonim görünür."
              alt3={<YazarSecici id="paylas-yazar" deger={p.yazar} set={(x) => { setV((o) => (o && o.paylasim ? { ...o, paylasim: { ...o.paylasim, yazar: x } } : o)); yazarHatirla(x); gecikmeli({ yazar: x }); }} />} />
            <Satir baslik="Açıklama" alt="Bağlantıyı açan kişi önce bunu okur: ne işe yarıyor, neyi var."
              alt3={<>
                <textarea value={aciklama} onChange={(e) => { setAciklama(e.target.value); gecikmeli({ aciklama: e.target.value }); }} rows={3} maxLength={280} placeholder="Ör. Kadıköy'deki kahvecimiz için menü ve rezervasyon sayfası." className={cn(alanSinif, "resize-none py-2.5 leading-relaxed")} />
                <p className="mt-1 text-right text-[11.5px] tabular-nums text-white/35">{aciklama.length} / 280</p>
              </>} />
          </Grup>

          {hata && <p className="rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15">{hata}</p>}

          <Grup>
            <Satir baslik="Sitende göster" alt="Canlı önizlemeyi başka bir sayfaya gömmek için bu kodu yapıştır."
              alt3={<KodKutusu kod={`<iframe src="${koken}/api/build/paylasim/${p.id}/onizleme" title="${v.proje.ad.replace(/"/g, "")}" width="100%" height="640" style="border:0;border-radius:12px" sandbox="allow-scripts allow-forms allow-popups"></iframe>`} />} />
          </Grup>

          {toplulugaEkle && (
            <button type="button" onClick={toplulugaEkle} className="flex w-full items-center gap-3 rounded-[18px] bg-white/[0.03] p-3.5 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.05]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#7fe0ff]"><Users className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{v.topluluk ? "Toplulukta yayında" : "Topluluğa da ekle"}</span><span className="block text-[12px] text-white/50">{v.topluluk ? `${sayiYaz(v.topluluk.remix)} remix · ${sayiYaz(v.topluluk.begeni)} beğeni` : "Şablonlar galerisinde herkes bulsun ve remix etsin"}</span></span>
            </button>
          )}
          <Kapsam />
        </div>
      )}
    </YanPanel>
  );
}
