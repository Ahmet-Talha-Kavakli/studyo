"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Accessibility, Braces, FileCode2, FileText, Gauge, History, Image as Gorsel, Languages, Layers, ListChecks, MessageSquare, Palette, Rocket, Search, Smartphone, Target, TestTube2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Oneri = { id: string; ad: string; alt: string; ikon: React.ReactNode; sec: () => void };

/** Komut kutusuna metin olarak gelen hazır istekler: seçilince kutuya yazılır, kullanıcı düzenleyip gönderir. */
const SABLONLAR: { komut: string; alt: string; I: typeof Search; metin: string }[] = [
  { komut: "test", alt: "Siteyi tarayıcıda baştan sona dene, bozuk yerleri düzelt", I: TestTube2, metin: "Sitedeki bütün sayfaları ve formları gerçek bir tarayıcıda baştan sona dene; bozuk bağlantı, çalışmayan düğme ve hata varsa düzelt." },
  { komut: "mobil", alt: "Telefon görünümünü gözden geçir", I: Smartphone, metin: "Telefon görünümünü (390 piksel) gözden geçir; taşan, sıkışan ve küçük kalan yerleri düzelt, dokunma alanlarını büyüt." },
  { komut: "seo", alt: "Arama ve paylaşım bilgilerini tamamla", I: Search, metin: "Bütün sayfalarda SEO başlığı, açıklaması, paylaşım görseli ve yapılandırılmış veriyi denetle; eksikleri tamamla." },
  { komut: "erisim", alt: "Erişilebilirlik denetimi ve düzeltmesi", I: Accessibility, metin: "Erişilebilirlik denetimi yap: renk kontrastı, görsel alt metinleri, form etiketleri ve klavyeyle gezinme; bulduklarını düzelt." },
  { komut: "hiz", alt: "Sayfa hızını iyileştir", I: Gauge, metin: "Sayfa hızını iyileştir: görselleri küçült ve tembel yükle, yazı tiplerini ve betikleri hafiflet, ilk ekranın hızlı açılmasını sağla." },
  { komut: "ceviri", alt: "İngilizce dil seçeneği ekle", I: Languages, metin: "Siteye İngilizce dil seçeneği ekle; bütün metinleri çevir ve üst menüye dil değiştirici koy." },
  { komut: "tasarim", alt: "Önce 3 tasarım yönü sun, sen seç", I: Palette, metin: "Kod yazmadan önce bu proje için 3 farklı tasarım yönü sun; ben seçince o yönde kur." },
  { komut: "gorsel", alt: "Eksik görselleri Vayra stüdyosunda üret", I: Gorsel, metin: "Sitede yer tutucu ya da eksik görsel varsa Vayra görsel stüdyosunda markaya uygun görseller üret ve yerleştir." },
];

/**
 * Build çalışma alanının komut kutusu için "/" komutları (kip, hedef, paralel görev, geçmiş, yayın ve hazır istekler)
 * ve "@" ile proje dosyası anma. Komut'un ustIcerik ve tusYakala uçlarına bağlanır.
 */
export function useKomutOnerileri(g: {
  deger: string; setDeger: (s: string) => void; alanRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  dosyalar: string[]; kapali?: boolean; /** Komut kutusu çizildi mi (proje yüklendi); imleç dinleyicisi o zaman bağlanır. */ etkin: boolean;
  eylem: { kip: (m: "yap" | "plan" | "sohbet") => void; hedef: () => void; gorev: (metin: string) => void; gecmis: () => void; yayin: () => void; sekme: (s: "veriler" | "kod") => void };
}) {
  const [sira, setSira] = useState(0);
  const [gizli, setGizli] = useState<string | null>(null);
  const [imlec, setImlec] = useState(0);
  const { deger, setDeger, alanRef } = g;
  // İmleç konumu: yazdıkça ve tıkladıkça güncellenir (render sırasında DOM okunmaz).
  const sonDeger = useRef(deger);
  useEffect(() => {
    sonDeger.current = deger;
    const el = alanRef.current;
    setImlec(Math.min(deger.length, el?.selectionStart ?? deger.length));
  }, [deger, alanRef]);
  useEffect(() => {
    const el = alanRef.current;
    if (!el) return;
    const f = () => setImlec(Math.min(sonDeger.current.length, el.selectionStart ?? sonDeger.current.length));
    el.addEventListener("click", f); el.addEventListener("keyup", f);
    return () => { el.removeEventListener("click", f); el.removeEventListener("keyup", f); };
  }, [alanRef, g.etkin]);

  const once = g.kapali || gizli === deger ? "" : deger.slice(0, imlec);
  const slash = /^\/([\p{L}\p{N}_-]*)$/u.exec(once);
  const at = /(?:^|\s)@([\p{L}\p{N}_./-]*)$/u.exec(once);
  const odakla = () => setTimeout(() => { const el = alanRef.current; if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 0);
  const temizle = (uzunluk: number) => { setDeger((deger.slice(0, imlec - uzunluk) + deger.slice(imlec)).replace(/^\s+/, "")); odakla(); };

  const oneriler = useMemo<Oneri[]>(() => {
    if (slash) {
      const q = slash[1].toLocaleLowerCase("tr");
      const kalan = deger.slice(imlec).trim();
      const l: Oneri[] = [
        { id: "plan", ad: "/plan", alt: "Plan kipi: önce plan çıkarır, onaylayınca kurar", ikon: <ListChecks className="h-4 w-4" />, sec: () => { g.eylem.kip("plan"); temizle(slash[0].length); } },
        { id: "sohbet", ad: "/sohbet", alt: "Sohbet kipi: kod yazmadan sor, fikir al", ikon: <MessageSquare className="h-4 w-4" />, sec: () => { g.eylem.kip("sohbet"); temizle(slash[0].length); } },
        { id: "yap", ad: "/yap", alt: "Yap kipi: doğrudan kurar ve düzenler", ikon: <Wand2 className="h-4 w-4" />, sec: () => { g.eylem.kip("yap"); temizle(slash[0].length); } },
        { id: "hedef", ad: "/hedef", alt: "Hedef kipi: kredi tavanına kadar kendi başına çalışır", ikon: <Target className="h-4 w-4" />, sec: () => { g.eylem.hedef(); temizle(slash[0].length); } },
        { id: "gorev", ad: "/gorev", alt: "Paralel görev: arka planda projenin kopyasında çalıştır", ikon: <Layers className="h-4 w-4" />, sec: () => { setDeger(""); g.eylem.gorev(kalan); } },
        ...SABLONLAR.map((s) => ({ id: s.komut, ad: `/${s.komut}`, alt: s.alt, ikon: <s.I className="h-4 w-4" />, sec: () => { setDeger(s.metin); odakla(); } })),
        { id: "veri", ad: "/veri", alt: "Veritabanını aç", ikon: <Braces className="h-4 w-4" />, sec: () => { temizle(slash[0].length); g.eylem.sekme("veriler"); } },
        { id: "gecmis", ad: "/gecmis", alt: "Sürüm geçmişini aç, önceki sürüme dön", ikon: <History className="h-4 w-4" />, sec: () => { temizle(slash[0].length); g.eylem.gecmis(); } },
        { id: "yayinla", ad: "/yayinla", alt: "Yayın panelini aç", ikon: <Rocket className="h-4 w-4" />, sec: () => { temizle(slash[0].length); g.eylem.yayin(); } },
      ];
      return l.filter((x) => !q || x.ad.toLocaleLowerCase("tr").includes(q) || x.alt.toLocaleLowerCase("tr").includes(q)).slice(0, 9);
    }
    if (at) {
      const q = at[1].toLocaleLowerCase("tr");
      return [...g.dosyalar]
        .sort((a, b) => (a.endsWith(".html") === b.endsWith(".html") ? a.localeCompare(b) : a.endsWith(".html") ? -1 : 1))
        .filter((y) => !q || y.toLocaleLowerCase("tr").includes(q))
        .slice(0, 8)
        .map((y) => ({
          id: y, ad: `@${y}`, alt: y.endsWith(".html") ? "Sayfa" : /\.(css)$/.test(y) ? "Stil dosyası" : /\.(js|mjs|ts)$/.test(y) ? (y.startsWith("api/") ? "Sunucu fonksiyonu" : "Betik") : "Dosya",
          ikon: y.endsWith(".html") ? <FileText className="h-4 w-4" /> : <FileCode2 className="h-4 w-4" />,
          sec: () => { setDeger(`${deger.slice(0, imlec - at[1].length - 1)}@${y} ${deger.slice(imlec)}`); odakla(); },
        }));
    }
    return [];
  }, [slash?.[0], at?.[0], deger, imlec, g.dosyalar]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setSira(0), [oneriler.length, slash?.[0], at?.[0]]);

  const tusYakala = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!oneriler.length) return false;
    if (e.key === "ArrowDown") { e.preventDefault(); setSira((i) => (i + 1) % oneriler.length); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setSira((i) => (i - 1 + oneriler.length) % oneriler.length); return true; }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); oneriler[sira]?.sec(); return true; }
    if (e.key === "Escape") { e.preventDefault(); setGizli(deger); return true; }
    return false;
  };

  const ustIcerik = oneriler.length > 0 ? (
    <div role="listbox" aria-label={slash ? "Komutlar" : "Dosyalar"} className="bd-panel absolute inset-x-2 bottom-full z-30 mb-2 max-h-[340px] overflow-y-auto rounded-[18px] p-1.5 [scrollbar-width:thin]">
      <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-medium text-white/45">{slash ? "Komutlar" : "Dosya ya da sayfa an"}</p>
      {oneriler.map((o, i) => (
        <button key={o.id} type="button" role="option" aria-selected={i === sira} onMouseDown={(e) => { e.preventDefault(); o.sec(); }} onMouseEnter={() => setSira(i)}
          className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-1.5 text-left", i === sira ? "bg-white/[0.08] ring-1 ring-inset ring-white/60" : "hover:bg-white/[0.05]")}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/80">{o.ikon}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{o.ad}</span><span className="block truncate text-[12px] text-white/50">{o.alt}</span></span>
        </button>
      ))}
    </div>
  ) : undefined;

  return { ustIcerik, tusYakala };
}
