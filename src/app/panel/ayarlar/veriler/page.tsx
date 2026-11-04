"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Download, FileJson, ShieldCheck } from "lucide-react";
import { useCerezOnay, type CerezKategori } from "@/store/useCerezOnay";
import { olayYaz } from "@/store/useHesap";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Anahtar, Grup, Hap, Satir, Sayfa, dugme, akis } from "@/components/ayarlar/ui";
import { CEREZ_KATEGORILERI } from "@/components/kabuk/CerezBandi";
import { metinIndir } from "@/lib/gercekEylem";
import { tarih } from "@/lib/ayarlar";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

/** Yerel depoların okunur adları; listede olmayanlar önekten ya da "Diğer tercihler" olarak gösterilir. */
const DEPO_ADI: Record<string, string> = {
  "vayra-projeler": "Üretimler ve çöp kutusu", "vayra-kitaplik": "Kitaplık", "vayra-sinema": "Sinema projeleri", "vayra-api-anahtar": "API anahtarları ve günlükler",
  "vayra-hesap": "Hesap, güvenlik ve faturalar", "vayra-auth": "Profil", "vayra-bildirim": "Bildirimler", "vayra-karakterler": "Karakterler", "vayra-elements": "Öğeler",
  "vayra-canvas": "Tuval", "vayra-montaj": "Montaj", "vayra-muzik": "Müzik", "vayra-pazarlama": "Pazarlama", "vayra-supercomputer": "Usta",
  "vayra-tercih": "Tercihler", "vayra-ayar-tercih": "Ayarlar", "vayra-arama-gecmis": "Arama geçmişi", "vayra-arama-son": "Son açılanlar", "vayra-koleksiyon": "Koleksiyonlar",
  "vayra-yorumlar": "Yorumlar", "vayra-taslak": "Taslaklar", "vayra-uzun-video": "Uzun video", "vayra-earn": "Kazan", "vayra-hafiza": "Asistan hafızası",
  "vayra-cerez": "Çerez tercihi", "vayra-duyuru": "Duyurular", "vayra-oturum": "Oturum", "vayra-proje-senkron-v1": "Proje eşitleme", "vayra-sc-tercih": "Usta tercihleri",
  "vayra-sc-beceri": "Usta becerileri", "vayra-sc-calisan": "Usta çalışanları", "vayra-sc-gorev": "Usta görevleri", "vayra-sc-kurulum": "Usta kurulumu", "vayra-sc-mcp": "Usta bağlantıları",
  "vayra-sc-stil": "Usta stilleri", "vayra-gorsel": "Görsel stüdyosu", "vayra-video": "Video stüdyosu", "vayra-video-2": "Video stüdyosu", "vayra-video-fav": "Favori videolar",
  "vayra-ses": "Ses stüdyosu", "vayra-3d": "3D stüdyosu", "vayra-film": "Film", "vayra-explainer": "Explainer", "vayra-influencer": "AI influencer", "vayra-presetler": "Presetler",
  "vayra-panolar": "Ruh panoları", "vayra-tuval": "Tuval", "vayra-tuval-sablonlarim": "Tuval şablonları", "vayra-akis": "Akışlar", "vayra-akis-board": "Akış panoları",
  "vayra-gorevler": "Görevler", "vayra-davet": "Davetler", "vayra-paylasim": "Paylaşımlar", "vayra-panel": "Panel düzeni", "vayra-sidebar": "Kenar çubuğu", "vayra-onboarding": "Tanıtım adımları",
  "vayra-son-bakilan": "Son bakılanlar", "vayra-surum-son": "Sürüm notları", "vayra-ozel-sesler": "Özel sesler", "vayra-ozel-mcp": "Özel MCP sunucuları", "vayra-ekler": "Ekler",
  "vayra-iletisim-taslak": "İletişim taslağı", "vayra-iletisim-talepler": "Destek talepleri", "vayra-uretim": "Süren üretimler", "vayra-upscale": "Büyütme", "vayra-cizim": "Çizim",
  "vayra-model": "Model tercihleri", "vayra-api": "API ayarları", "vayra-bulten": "Bülten", "vayra-durum": "Sistem durumu", "vayra-yerel": "Yerel ayarlar", "vayra-persona": "Personalar",
};
/** Listede olmayan depo: önekten okunur ad (ham anahtar adı arayüzde görünmez). */
const ONEK: [string, string][] = [["vayra-sc-", "Usta"], ["vayra-3d", "3D stüdyosu"], ["vayra-sinema", "Sinema"], ["vayra-tuval", "Tuval"], ["vayra-canvas", "Tuval"], ["vayra-earn", "Kazan"],
  ["vayra-muse", "Müzik"], ["vayra-kenar-", "Panel genişlikleri"], ["vayra-preset", "Presetler"], ["vayra-ses", "Ses stüdyosu"], ["vayra-video", "Video stüdyosu"], ["vayra-gorsel", "Görsel stüdyosu"], ["vayra-durum", "Sistem durumu"]];
const depoAdi = (k: string) => DEPO_ADI[k] ?? ONEK.find(([o]) => k.startsWith(o))?.[1] ?? "Diğer tercihler";
const KOTA = 5 * 1024 * 1024;
const RENK = ["#55d6fd", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];
const boyut = (b: number) => (b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 ** 2).toFixed(2)} MB`);

function depolariOku() {
  const m: { anahtar: string; ad: string; bayt: number }[] = [];
  try {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith("vayra-") || k.startsWith("vayra-admin")) continue;
      m.push({ anahtar: k, ad: depoAdi(k), bayt: (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2 });
    }
  } catch { /* erişim yok */ }
  return m.sort((a, b) => b.bayt - a.bayt);
}

export default function Verilerim() {
  const { email } = useHesapKaydi();
  const cerez = useCerezOnay();
  const [depolar, setDepolar] = useState<ReturnType<typeof depolariOku>>([]);
  const yenile = () => setDepolar(depolariOku());
  useEffect(yenile, []);
  const toplam = depolar.reduce((a, d) => a + d.bayt, 0);
  const aramaBayt = depolar.filter((d) => d.anahtar.startsWith("vayra-arama")).reduce((a, d) => a + d.bayt, 0);
  // Gösterimde aynı ada düşen depolar tek kalemde toplanır (dışa aktarma ham depolarla yapılır).
  const kalemler = Object.values(depolar.reduce<Record<string, { anahtar: string; ad: string; bayt: number }>>((m, d) => { const v = m[d.ad]; m[d.ad] = v ? { ...v, bayt: v.bayt + d.bayt } : { ...d }; return m; }, {})).sort((a, b) => b.bayt - a.bayt);
  const ilk = kalemler.slice(0, 5);
  const digerBayt = kalemler.slice(5).reduce((a, d) => a + d.bayt, 0);

  const disaAktar = () => {
    const veri: Record<string, unknown> = {};
    for (const d of depolar) { try { veri[d.anahtar] = JSON.parse(localStorage.getItem(d.anahtar) ?? "null"); } catch { veri[d.anahtar] = localStorage.getItem(d.anahtar); } }
    // Gizli değerler dışa aktarılmaz: şifre özeti, 2FA sırrı ve yedek kodlar
    const hesap = veri["vayra-hesap"] as { state?: { hesaplar?: Record<string, Record<string, unknown>> } } | undefined;
    if (hesap?.state?.hesaplar) {
      const benim = hesap.state.hesaplar[email.toLowerCase()];
      hesap.state.hesaplar = benim ? { [email.toLowerCase()]: { ...benim, sifre: benim.sifre ? "[gizli]" : undefined, ikiAdim: benim.ikiAdim ? { aktif: (benim.ikiAdim as { aktif: boolean }).aktif, sir: "[gizli]", yedekler: "[gizli]" } : undefined } } : {};
    }
    const icerik = JSON.stringify({ disaAktarim: { hesap: email, tarih: new Date().toISOString(), surum: 1, not: "Vayra hesabındaki veriler. Şifre ve doğrulama sırları güvenlik için dahil edilmez." }, veri }, null, 2);
    if (metinIndir(icerik, `vayra-verilerim-${new Date().toISOString().slice(0, 10)}.json`, "application/json")) {
      olayYaz(email, "veri-indir", boyut(new Blob([icerik]).size));
      toast.success("Verilerin indirildi", { description: `${depolar.length} bölüm, toplam ${boyut(new Blob([icerik]).size)}.` });
    } else mesaj.indirilemedi("Tarayıcı indirmeyi engelledi.");
  };
  const cerezDegis = (k: CerezKategori, v: boolean) => cerez.kaydet({ ...(cerez.karar ?? { islevsel: false, analitik: false, pazarlama: false }), [k]: v });

  const indirKart = (
    <div id="indir" className="ayar-satir overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-wrap items-center gap-4 p-5">
        <motion.span initial={{ rotate: -8, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#55d6fd]/12 text-[#55d6fd]"><FileJson className="h-7 w-7" /></motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold text-white">Verilerini indir</p>
          <p className="mt-0.5 text-[14px] text-white/50">Profilin, üretim kayıtların, projelerin, faturaların ve tercihlerin tek bir JSON dosyasında.</p>
        </div>
        <button type="button" onClick={disaAktar} disabled={!depolar.length} className={cn(dugme.birincil, "h-10 w-full")}><Download className="h-4 w-4" />Verilerimi indir</button>
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-5 py-4">
        {kalemler.map((d, i) => (
          <motion.span key={d.anahtar} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.015, ease: akis }}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-[12px] text-white/65">{d.ad}<span className="tabular-nums text-white/35">{boyut(d.bayt)}</span></motion.span>
        ))}
      </div>
      <p className="flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3 text-[13px] text-white/45"><ShieldCheck className="h-3.5 w-3.5 shrink-0" />Şifre özeti, iki adımlı doğrulama sırrı ve yedek kodlar güvenliğin için dosyaya eklenmez.</p>
    </div>
  );

  return (
    <Sayfa baslik="Verilerim" aciklama="Hakkında tuttuğumuz verileri gör, indir ya da sil. KVKK kapsamındaki hakların burada." yan={indirKart}
      sag={<Link href="/gizlilik" className={cn(dugme.hayalet, "h-8 text-[13px]")}>Gizlilik politikası<ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
      <Grup id="cerezler" baslik="Çerezler" aciklama={cerez.tarih ? `Son güncelleme ${tarih(cerez.tarih)}.` : "Henüz tercih yapmadın; yalnız zorunlu çerezler kullanılıyor."}
        sag={<Link href="/cerezler" className={cn(dugme.hayalet, "h-8 text-[13px]")}>Çerez politikası</Link>}>
        {CEREZ_KATEGORILERI.map((c) => (
          <Satir key={c.id} ad={c.ad} alt={c.ozet}>
            {c.id === "zorunlu" ? <Hap>Her zaman açık</Hap> : <Anahtar acik={!!cerez.karar?.[c.id]} onDegis={(v) => cerezDegis(c.id as CerezKategori, v)} etiket={c.ad} />}
          </Satir>
        ))}
      </Grup>

      <Grup id="yerel" baslik="Bu tarayıcıdaki veriler" aciklama="Vayra hızlı açılsın diye çalışmalarını tarayıcının yerel deposunda tutar.">
        <div className="px-6 py-4">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-white"><b className="text-[20px] font-semibold tabular-nums">{boyut(toplam)}</b> <span className="text-white/45">kullanılıyor</span></span>
            <span className="text-white/40">Sınır yaklaşık {boyut(KOTA)}</span>
          </div>
          <div className="mt-3 flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-white/[0.06]" role="img" aria-label={`${boyut(toplam)} kullanılıyor`}>
            {ilk.map((d, i) => <motion.span key={d.anahtar} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: akis }} className="h-full origin-left" style={{ width: `${Math.max(0.6, (d.bayt / KOTA) * 100)}%`, background: RENK[i] }} />)}
            {digerBayt > 0 && <span className="h-full bg-white/30" style={{ width: `${Math.max(0.6, (digerBayt / KOTA) * 100)}%` }} />}
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5">
            {ilk.map((d, i) => <span key={d.anahtar} className="flex items-center gap-2 text-[13px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: RENK[i] }} /><span className="text-white/70">{d.ad}</span><span className="tabular-nums text-white/35">{boyut(d.bayt)}</span></span>)}
            {digerBayt > 0 && <span className="flex items-center gap-2 text-[13px]"><span className="h-2.5 w-2.5 rounded-full bg-white/30" /><span className="text-white/70">Diğer {kalemler.length - 5} bölüm</span><span className="tabular-nums text-white/35">{boyut(digerBayt)}</span></span>}
          </div>
        </div>
        <Satir ad="Arama geçmişi" alt={aramaBayt ? `Son aramaların ve açtığın sonuçlar, ${boyut(aramaBayt)}` : "Temiz"}>
          <button type="button" disabled={!aramaBayt} onClick={() => { try { localStorage.removeItem("vayra-arama-gecmis"); localStorage.removeItem("vayra-arama-son"); } catch { /* */ } yenile(); toast.success("Arama geçmişi temizlendi"); }} className={dugme.ikincil}>Temizle</button>
        </Satir>
        <Satir ad="Çöp kutusu ve indirme" alt="Depolama bölümünde">
          <Link href="/panel/ayarlar/depolama" className={dugme.ikincil}>Depolama</Link>
        </Satir>
      </Grup>

      <Grup baslik="KVKK kapsamındaki hakların" alt={<span>Talepler en geç 30 gün içinde yanıtlanır. Ayrıntılar <Link href="/veri-koruma" className="text-white/70 underline decoration-white/25 underline-offset-2 hover:decoration-white">aydınlatma metninde</Link>.</span>}>
        <Satir ad="Erişim ve taşınabilirlik" alt="Hakkındaki verilerin bir kopyasını al."><button type="button" onClick={disaAktar} className={dugme.ikincil}>İndir</button></Satir>
        <Satir ad="Düzeltme" alt="Yanlış ya da eksik bilgileri güncelle."><Link href="/panel/ayarlar/hesap" className={dugme.ikincil}>Hesap</Link></Satir>
        <Satir ad="İtiraz ve bilgi talebi" alt="İşleme amacına itiraz et ya da ayrıntılı bilgi iste."><Link href="/iletisim?konu=destek&mesaj=KVKK%20kapsam%C4%B1nda%20bilgi%20talebi%3A%20" className={dugme.ikincil}>Talep oluştur</Link></Satir>
      </Grup>

      <Grup baslik="Hesabı sil" tehlike>
        <Satir ad="Hesabını ve tüm verilerini kalıcı olarak sil" alt="Silmeden önce verilerini indirmeni öneririz.">
          <Link href="/panel/ayarlar/hesap#sil" className={dugme.tehlike}>Hesabı sil</Link>
        </Satir>
      </Grup>
    </Sayfa>
  );
}
