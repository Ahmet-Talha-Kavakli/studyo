"use client";

/**
 * Tek preset sayfası (2026-10-29, stüdyo düzeni; dar sol form paneli kaldırıldı):
 * üstte ince satır (geri, alt çizgili sekmeler Önizleme / Sonuçların / Nasıl çalışır, kaydet + bağlantı);
 * tam genişlik sahne (efektin rengiyle ortam ışığı, büyük ad, büyük önce/sonra, karışımlar, benzer efektler);
 * altta yüzen komut kutusu (fotoğraf yuvaları, ek talimat, efekt/ikinci efekt/model/kalite/oran/adet çipleri, Oluştur).
 *
 * Fotoğraf ve ayarlar oturumda kalır (usePresetOturum): başka presete geçince yeniden yüklenmez.
 * Bedel presetBedel'den (model ve kaliteye göre); demo modda kredi iade edilir.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, Bookmark, Copy, Link2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { usePresetler } from "@/store/usePresetler";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { RESMI_PRESETLER, karisimTarifi, type KatalogPreset } from "@/lib/presetKatalog";
import { tumPresetler, tutamac, yaraticiBul } from "@/lib/presetTopluluk";
import { PresetKapak } from "./PresetKarti";
import { usePaylasim } from "@/store/usePaylasim";
import type { ElementReferans } from "@/lib/elementCekirdek";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ARAC, GIRDI, PRESET_MODELLER, fotoOku, presetBasligi, presetBedel, presetGirdi, presetinMi, usePresetOturum } from "./presetOrtak";
import { OnizlemeSahnesi } from "./uygula/Sahne";
import { KomutKutusu } from "./uygula/Komut";
import { NasilCalisir, PresetSecici, Sonuclar } from "./uygula/Yanlar";

type Sahne = "onizleme" | "sonuc" | "nasil";
const yay = { type: "spring" as const, stiffness: 420, damping: 34 };

export function PresetUygula({ slug }: { slug: string }) {
  const router = useRouter();
  const arama = useSearchParams();
  const girisli = useAuth((s) => !!s.kullanici);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const uretimler = useProjeler((s) => s.uretimler);
  const kayitliListe = usePresetler((s) => s.kayitli);
  const kayitDegis = usePresetler((s) => s.kayitDegis);
  const ozel = usePresetler((s) => s.ozel);
  const ozelSil = usePresetler((s) => s.ozelSil);
  const sag = useSaglayicilar();
  const { aktifProjeId } = useAktifProje();
  const o = usePresetOturum();

  const benimTutamac = tutamac(useAuth((s) => s.kullanici?.ad));
  const paylasimlar = usePaylasim((s) => s.benimPaylasimlar);
  const tumu = useMemo(() => tumPresetler(ozel, benimTutamac, paylasimlar), [ozel, benimTutamac, paylasimlar]);
  const p = tumu.find((x) => x.slug === slug) ?? null;
  const [ek, setEk] = useState<KatalogPreset | null>(() => RESMI_PRESETLER.find((x) => x.slug === arama.get("ek") && x.slug !== slug) ?? null);
  const [sahne, setSahne] = useState<Sahne>("onizleme");
  const [secici, setSecici] = useState<null | "degistir" | "karistir">(null);
  const [talimat, setTalimat] = useState("");
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  useEffect(() => { if (hazir && !p) { toast.error("Preset bulunamadı", { description: "Silinmiş ya da bağlantı hatalı olabilir. Seni preset galerisine yönlendirdik." }); router.replace("/panel/presetler"); } }, [hazir, p, router]);
  useEffect(() => { if (p?.taslak) router.replace(`/panel/presetler/olustur?id=${p.slug}`); }, [p?.taslak, p?.slug, router]);

  const model = PRESET_MODELLER.find((m) => m.ad === o.model) ?? PRESET_MODELLER[0];
  // Model oranı desteklemiyorsa (Hailuo) oran gönderilmez; desteklenmeyen oran seçiliyse ilk orana dön.
  useEffect(() => { if (model.oranlar.length && !model.oranlar.includes(o.oran)) o.ayarla({ oran: model.oranlar[0] }); }, [model, o]);

  // Ana fotoğrafı Ctrl+V ile yapıştır (yazı alanlarında değil).
  const yapistirAl = useCallback(async (d: File) => { const m = await fotoOku(d); if (m) { o.ayarla({ foto: m }); toast.success("Fotoğraf yapıştırıldı"); } }, [o]);
  useEffect(() => {
    const yapistir = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement;
      if (h.tagName === "TEXTAREA" || h.tagName === "INPUT") return;
      const d = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (d) { e.preventDefault(); void yapistirAl(d); }
    };
    window.addEventListener("paste", yapistir);
    return () => window.removeEventListener("paste", yapistir);
  }, [yapistirAl]);

  const presetUretimleri = useMemo(() => uretimler.filter((u) => u.arac === ARAC), [uretimler]);
  const buPresetin = useMemo(() => (p ? presetUretimleri.filter((u) => presetinMi(u.baslik, p.ad)) : []), [presetUretimleri, p]);

  if (!p) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;

  const girdi = GIRDI[presetGirdi(p)];
  const birim = presetBedel(p, model.ad, o.kalite, ek);
  const toplam = birim * o.adet;
  const kayitli = kayitliListe.includes(p.slug);
  const bagli = sag ? !!sag[model.saglayici] : null;
  const yetersiz = girisli && bagli !== false && krediler < toplam;
  const oran = model.oranlar.length ? o.oran : "9:16";
  const kayitDegistir = () => { const v = kayitDegis(p.slug); toast.success(v ? "Preset kaydedildi" : "Kayıtlılardan çıkarıldı", { description: p.ad }); };

  const uret = () => {
    if (!o.foto) { document.getElementById("preset-foto-girdi")?.click(); return; }
    const refler: ElementReferans[] = [];
    let ekIstem = "";
    if (o.mekan) { refler.push({ ad: "Mekan", tur: "mekan", aciklama: "Sahnenin geçtiği yer", gorseller: [o.mekan.url] }); ekIstem += " Set the scene in the location shown in the location reference image."; }
    if (o.urun && presetGirdi(p) !== "urun") { refler.push({ ad: "Urun", tur: "obje", aciklama: "Sahnede görünecek ürün", gorseller: [o.urun.url] }); ekIstem += " The subject naturally holds or showcases the product from the product reference image."; }
    if (talimat.trim()) ekIstem += ` Additional direction from the user: ${talimat.trim()}`;
    const ad = ek ? `${p.ad} + ${ek.ad}` : presetBasligi(p.ad);
    let basarili = 0;
    for (let i = 0; i < o.adet; i++) {
      const s = uretimBaslat({
        baslik: ad, tur: "video", model: model.ad, prompt: (ek ? karisimTarifi(p, ek) : p.tarif) + ekIstem, kredi: bagli === false ? 0 : birim, arac: ARAC,
        projeId: aktifProjeId ?? undefined,
        meta: { oran: model.oranlar.length ? o.oran : undefined, sure: model.sure ? `${model.sure} sn` : undefined, cozunurluk: model.coz[o.kalite], gorselUrl: o.foto.url, hamIstem: ek ? `${p.ad} + ${ek.ad}` : p.ad, ...(p.video ? { demoKlip: { video: p.video, poster: p.kapak } } : {}) },
        girdi: refler.length ? { referanslar: refler } : undefined,
      });
      if (!s.ok) { if (!basarili) uretimHataToast(s, "Üretilemedi"); break; }
      basarili++;
    }
    if (basarili) {
      setSahne("sonuc");
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(basarili > 1 ? `${basarili} video üretiliyor` : "Video üretiliyor", { description: `${ek ? `${p.ad} + ${ek.ad}` : p.ad} · ${model.ad} · ${bagli === false ? "Kredi düşmez." : `${birim * basarili} kredi.`}` });
    }
  };

  const SEKMELER: [Sahne, string, number?][] = [["onizleme", "Önizleme"], ["sonuc", "Sonuçlar", buPresetin.length], ["nasil", "Nasıl çalışır"]];

  return (
    <div className="min-h-[calc(100dvh-var(--ust-nav))]">
      {/* Üst çubuk: geri + preset kimliği | kayan beyaz sekmeler | tek parça eylem grubu */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-zemin/75 backdrop-blur-2xl sm:top-[var(--ust-nav)]">
        <div className="mx-auto grid h-16 w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link href="/panel/presetler" aria-label="Presetlere dön" title="Presetler"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/80 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.11] hover:text-white active:scale-95">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-[9px] ring-1 ring-inset ring-white/15 max-sm:hidden"><PresetKapak p={p} kucuk /></span>
            <span className="min-w-0 leading-tight max-md:hidden">
              <span lang="en" className="block truncate text-[14.5px] font-semibold text-white">{p.ad}{ek && <span className="text-white/45"> + {ek.ad}</span>}</span>
              <span className="block truncate text-[12px] text-white/50">{p.yazar ? (yaraticiBul(p.yazar)?.ad ?? p.yazar) : "Vayra"} · {p.sureSn} sn</span>
            </span>
          </div>

          <LayoutGroup id="preset-sahne">
            <nav role="tablist" aria-label="Preset sayfası" className="flex h-10 items-center gap-0.5 rounded-full bg-white/[0.06] p-1 ring-1 ring-inset ring-white/[0.06]">
              {SEKMELER.map(([id, ad, n]) => (
                <button key={id} role="tab" aria-selected={sahne === id} onClick={() => setSahne(id)}
                  className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors active:scale-[0.97] sm:px-3.5", sahne === id ? "text-black" : "text-white/60 hover:text-white")}>
                  {sahne === id && <motion.span layoutId="preset-sahne-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <span className="relative whitespace-nowrap">{ad}</span>
                  {!!n && <span className={cn("relative text-[11.5px] tabular-nums", sahne === id ? "text-black/45" : "text-white/40")}>{n}</span>}
                </button>
              ))}
            </nav>
          </LayoutGroup>

          <div className="flex justify-end">
            <div className="flex h-10 items-center gap-0.5 rounded-full bg-white/[0.06] p-1 ring-1 ring-inset ring-white/[0.06]">
              {p.ozel ? (
                <>
                  <Link href={`/panel/presetler/olustur?id=${p.slug}`} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white"><Pencil className="h-3.5 w-3.5" /><span className="max-lg:hidden">Düzenle</span></Link>
                  <button onClick={() => { ozelSil(p.slug); toast.success("Preset silindi"); router.push("/panel/presetler?sekme=benim"); }} aria-label="Sil" title="Sil" className="flex h-8 w-8 items-center justify-center rounded-full text-rose-300/80 transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                </>
              ) : (
                <>
                  <Link href={`/panel/presetler/olustur?kaynak=${p.slug}`} title="Bu efektten kendi versiyonunu yap" className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-white/80 transition hover:bg-white/[0.08] hover:text-white max-md:hidden"><Copy className="h-3.5 w-3.5" /><span className="max-xl:hidden">Kendi versiyonun</span></Link>
                  <button onClick={() => void kopyala(`${window.location.origin}/panel/presetler/${p.slug}`, "Bağlantı kopyalandı")} aria-label="Bağlantıyı kopyala" title="Bağlantıyı kopyala"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/[0.08] hover:text-white max-sm:hidden"><Link2 className="h-4 w-4" /></button>
                </>
              )}
              <button onClick={kayitDegistir} aria-pressed={kayitli} aria-label={kayitli ? "Kayıtlılardan çıkar" : "Kaydet"} title={kayitli ? "Kaydedildi" : "Kaydet"}
                className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition active:scale-95", kayitli ? "bg-white text-black" : "text-white/80 hover:bg-white/[0.08] hover:text-white")}>
                <motion.span key={String(kayitli)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={yay}><Bookmark className={cn("h-4 w-4", kayitli && "fill-current")} /></motion.span>
                <span className="max-lg:hidden">{kayitli ? "Kaydedildi" : "Kaydet"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <motion.div key={sahne} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {sahne === "onizleme"
          ? <OnizlemeSahnesi p={p} ek={ek} setEk={setEk} foto={o.foto} onFoto={(m) => o.ayarla({ foto: m })} oran={oran} birim={birim} />
          : sahne === "sonuc"
            ? <Sonuclar liste={buPresetin} tumu={presetUretimleri} p={p} onOnizleme={() => setSahne("onizleme")} />
            : <NasilCalisir p={p} foto={o.foto} />}
      </motion.div>

      <KomutKutusu
        p={p} ek={ek} setEk={setEk}
        foto={o.foto} mekan={o.mekan} urun={o.urun} urunVar={presetGirdi(p) !== "urun"}
        setFoto={(m) => o.ayarla({ foto: m })} setMekan={(m) => o.ayarla({ mekan: m })} setUrun={(m) => o.ayarla({ urun: m })}
        talimat={talimat} setTalimat={setTalimat}
        model={model} setModel={(ad) => o.ayarla({ model: ad })} kalite={o.kalite} setKalite={(k) => o.ayarla({ kalite: k })}
        oran={o.oran} setOran={(r) => o.ayarla({ oran: r })} adet={o.adet} setAdet={(n) => o.ayarla({ adet: n })}
        birim={birim} toplam={toplam} bagli={bagli} sag={sag as Record<string, unknown> | null}
        yetersiz={yetersiz} girisli={girisli} krediler={krediler} girdiSlot={girdi.slot}
        onUret={uret} onDegistir={() => setSecici("degistir")} onKaristir={() => setSecici("karistir")} />

      {secici && (
        <PresetSecici mod={secici} tumu={tumu} seciliSlug={secici === "karistir" ? ek?.slug ?? null : p.slug} haric={secici === "karistir" ? p.slug : null}
          onKapat={() => setSecici(null)}
          onSec={(x) => {
            if (secici === "karistir") { setEk(x); toast.success(`${x.ad} eklendi`, { description: `İkinci efekt olarak eklendi, +${Math.ceil(x.kredi / 2)} kredi.` }); }
            else router.push(`/panel/presetler/${x.slug}`);
            setSecici(null);
          }} />
      )}
    </div>
  );
}
