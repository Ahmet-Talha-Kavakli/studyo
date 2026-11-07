"use client";

import { useEffect, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  AtSign, BarChart3, CalendarCheck, CalendarDays, CheckCircle2, Circle, CreditCard, FileText, Globe, LayoutDashboard, Loader2, Mail, MessagesSquare, Package, Plug, Scale, Settings2, ShoppingCart, Star, Store, Tag, Truck, Users,
} from "lucide-react";
import { Kart } from "@/components/film/ortak";
import type { ProjeKanca } from "@/components/build/calisma/useProje";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { Diller } from "./Diller";
import { EklentiAyarlari } from "./Eklentiler";
import { Blog, YasalMetinler } from "./Icerik";
import { KargoVergi, Kuponlar, RaporBolumu, Sepetler, Siparisler, Urunler, type MagazaOrtak } from "./Magaza";
import { Aboneler, CanliSohbet, Yorumlar } from "./Musteri";
import { EpostaBolumu, ProfilBolumu } from "./Profil";
import { RandevuAyarlari, RandevuTakvimi, YaklasanRandevular } from "./Randevu";
import { BilgiSatiri, HataSatiri, Istatistikler, Rozet, useBildirim, useIsletme, yay, type IsletmeKanca } from "./ortak";

export type IsletmeBolum = "ozet" | "urunler" | "siparisler" | "kuponlar" | "kargo" | "sepetler" | "rapor" | "randevular" | "randevuAyar" | "blog" | "diller" | "yasal" | "sohbet" | "yorumlar" | "aboneler" | "eklentiler" | "profil" | "eposta";
type Oge = { id: IsletmeBolum; ad: string; ikon: typeof Store };
const GRUPLAR: { ad: string; l: Oge[] }[] = [
  { ad: "", l: [{ id: "ozet", ad: "Genel bakış", ikon: LayoutDashboard }] },
  { ad: "Mağaza", l: [{ id: "urunler", ad: "Ürünler", ikon: Package }, { id: "siparisler", ad: "Siparişler", ikon: ShoppingCart }, { id: "kuponlar", ad: "Kuponlar", ikon: Tag }, { id: "kargo", ad: "Para, vergi ve kargo", ikon: Truck }, { id: "sepetler", ad: "Terk edilen sepetler", ikon: ShoppingCart }, { id: "rapor", ad: "Raporlar", ikon: BarChart3 }] },
  { ad: "Randevu", l: [{ id: "randevular", ad: "Takvim", ikon: CalendarDays }, { id: "randevuAyar", ad: "Hizmetler ve saatler", ikon: CalendarCheck }] },
  { ad: "İçerik", l: [{ id: "blog", ad: "Blog", ikon: FileText }, { id: "diller", ad: "Diller", ikon: Globe }, { id: "yasal", ad: "Yasal metinler", ikon: Scale }] },
  { ad: "Müşteriler", l: [{ id: "sohbet", ad: "Canlı sohbet", ikon: MessagesSquare }, { id: "yorumlar", ad: "Yorumlar", ikon: Star }, { id: "aboneler", ad: "Aboneler", ikon: Users }] },
  { ad: "Site", l: [{ id: "eklentiler", ad: "Eklentiler", ikon: Plug }, { id: "profil", ad: "İşletme profili", ikon: Store }, { id: "eposta", ad: "Alan adı ve e-posta", ikon: AtSign }] },
];
const HEPSI = GRUPLAR.flatMap((g) => g.l);

/**
 * İşletme sekmesi: siteyi işleten esnafın paneli (Hostinger Store Manager, Wix Dashboard, Squarespace Commerce ve
 * Scheduling karşılığı). Mağaza, randevu, blog, diller, yasal metinler, müşteri iletişimi ve site eklentileri tek yerde.
 */
export function IsletmeSekme({ k, ajanaGonder, bulutaGit, alanaGit }: { k: ProjeKanca; ajanaGonder?: (m: string) => void; bulutaGit?: (b: string) => void; alanaGit?: () => void }) {
  const p = k.proje as Proje;
  const ik = useIsletme(p.id);
  const [bolum, setBolum] = useState<IsletmeBolum>("ozet");
  const [ortam, setOrtam] = useState<"canli" | "test">("canli");
  const b = useBildirim();
  useEffect(() => { try { const x = sessionStorage.getItem(`vayra-isletme-bolum-${p.id}`); if (x && HEPSI.some((y) => y.id === x)) setBolum(x as IsletmeBolum); } catch { /* yok */ } }, [p.id]);
  useEffect(() => { try { sessionStorage.setItem(`vayra-isletme-bolum-${p.id}`, bolum); } catch { /* yok */ } document.getElementById("isletme-icerik")?.scrollTo({ top: 0 }); }, [bolum, p.id]);
  useEffect(() => { const t = setInterval(() => { if (!document.hidden) ik.yukle(); }, 45_000); return () => clearInterval(t); }, [ik.yukle]); // eslint-disable-line react-hooks/exhaustive-deps
  const git = (x: string) => { if (HEPSI.some((y) => y.id === x)) setBolum(x as IsletmeBolum); };
  const oz = ik.d?.ozet;
  const rozet: Partial<Record<IsletmeBolum, number>> = oz ? { siparisler: oz.bekleyenSiparis, randevular: oz.onayBekleyenRandevu, yorumlar: oz.bekleyenYorum, sohbet: oz.okunmamisSohbet } : {};
  const ortak = { k: ik, projeId: p.id, goster: b.goster, ajanaGonder, git };
  const mo: MagazaOrtak = { k: ik, projeId: p.id, ortam, setOrtam, bulutaGit, goster: b.goster };
  return (
    <div className="flex h-full min-h-0 max-md:flex-col">
      <LayoutGroup id="isletme-bolum">
        <nav className="flex w-[218px] shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] p-2 [scrollbar-width:none] max-md:w-full max-md:flex-row max-md:gap-1 max-md:overflow-x-auto max-md:border-b max-md:border-r-0">
          {GRUPLAR.map((g) => (
            <div key={g.ad || "ana"} className="max-md:flex max-md:gap-1 md:mb-2">
              {g.ad && <p className="px-3 pb-1 pt-2 text-[11.5px] font-medium text-white/40 max-md:hidden">{g.ad}</p>}
              {g.l.map((x) => (
                <button key={x.id} type="button" onClick={() => setBolum(x.id)} className={cn("relative flex w-full items-center gap-2.5 rounded-[11px] px-3 py-[7px] text-left text-[13px] transition-colors max-md:w-auto max-md:shrink-0 max-md:whitespace-nowrap", bolum === x.id ? "text-white" : "text-white/55 hover:text-white")}>
                  {bolum === x.id && <motion.span layoutId="isletme-z" transition={yay} className="absolute inset-0 rounded-[11px] bg-white/[0.08]" />}
                  <x.ikon className="relative h-4 w-4 shrink-0" /><span className="relative min-w-0 flex-1 truncate">{x.ad}</span>
                  {!!rozet[x.id] && <span className="relative min-w-[18px] rounded-full bg-[#55d6fd] px-1.5 text-center text-[11px] font-semibold tabular-nums text-[#04212b]">{rozet[x.id]}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </LayoutGroup>
      <div id="isletme-icerik" className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:thin] sm:p-5">
        <div className="mx-auto max-w-[960px]">
          {p.ekipRol === "izleyici" && <div className="mb-3"><BilgiSatiri ton="uyari">Bu projede izleyicisin: işletme verilerini görürsün, değiştiremezsin.</BilgiSatiri></div>}
          {ik.hata && <div className="mb-3"><HataSatiri mesaj={ik.hata} kapat={() => ik.setHata("")} /></div>}
          {!ik.d ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : (
            <>
              {bolum === "ozet" && <GenelBakis ik={ik} git={git} bulutaGit={bulutaGit} projeId={p.id} />}
              {bolum === "urunler" && <Urunler o={mo} />}
              {bolum === "siparisler" && <Siparisler o={mo} />}
              {bolum === "kuponlar" && <Kuponlar o={mo} />}
              {bolum === "kargo" && <KargoVergi o={mo} />}
              {bolum === "sepetler" && <Sepetler o={mo} git={git} />}
              {bolum === "rapor" && <RaporBolumu o={mo} />}
              {bolum === "randevular" && <RandevuTakvimi o={ortak} ayaraGit={() => setBolum("randevuAyar")} />}
              {bolum === "randevuAyar" && <RandevuAyarlari o={ortak} />}
              {bolum === "blog" && <Blog o={{ ...ortak, calisiyor: k.calisiyor, projeYenile: () => k.yukle() }} />}
              {bolum === "diller" && <Diller o={ortak} />}
              {bolum === "yasal" && <YasalMetinler o={{ ...ortak, calisiyor: k.calisiyor, projeYenile: () => k.yukle() }} />}
              {bolum === "sohbet" && <CanliSohbet o={ortak} />}
              {bolum === "yorumlar" && <Yorumlar o={ortak} />}
              {bolum === "aboneler" && <Aboneler o={ortak} />}
              {bolum === "eklentiler" && <EklentiAyarlari o={ortak} />}
              {bolum === "profil" && <ProfilBolumu o={{ ...ortak, alanAdlari: p.alanAdlari.map((a) => a.ad), alanaGit }} />}
              {bolum === "eposta" && <EpostaBolumu o={{ ...ortak, alanAdlari: [...new Set(p.alanAdlari.map((a) => a.ad.replace(/^www\./, "")))], alanaGit }} />}
            </>
          )}
        </div>
      </div>
      {b.ogesi}
    </div>
  );
}

/* ───────── Genel bakış ───────── */
function GenelBakis({ ik, git, bulutaGit, projeId }: { ik: IsletmeKanca; git: (b: string) => void; bulutaGit?: (b: string) => void; projeId: string }) {
  const d = ik.d!;
  const v = d.veri, oz = d.ozet, s = d.servis;
  const maddeler: { id: string; ad: string; alt: string; tamam: boolean; git: () => void }[] = [
    { id: "profil", ad: "İşletme profili", alt: oz.profilEksik.length ? `Eksik: ${oz.profilEksik.join(", ")}` : "Ad, adres, telefon ve saatler tamam", tamam: !oz.profilEksik.length, git: () => git("profil") },
    { id: "odeme", ad: "Ödeme sağlayıcısı", alt: s.odeme ? `${({ paytr: "PayTR", stripe: "Stripe", paypal: "PayPal", iyzico: "iyzico" } as Record<string, string>)[s.odeme] ?? s.odeme} · ${s.odemeMod === "canli" ? "canlı" : "test modu"}` : "Stripe, PayPal, iyzico ya da PayTR bağla", tamam: !!s.odeme, git: () => (bulutaGit ? bulutaGit("odemeler") : git("urunler")) },
    { id: "kargo", ad: "Para birimi, vergi ve kargo", alt: v.magaza.kargo.filter((x) => x.aktif).length ? `${v.magaza.paraBirimi}${v.magaza.ekParaBirimleri.length ? ` ve ${v.magaza.ekParaBirimleri.length} ek birim` : ""} · ${v.magaza.kargo.filter((x) => x.aktif).length} kargo yöntemi · ${v.magaza.vergi.model === "yok" ? "vergi yok" : v.magaza.vergi.model === "sales" ? `satış vergisi, ${v.magaza.vergi.kurallar.filter((k) => k.ulke === "US").length} eyalet kuralı` : `${v.magaza.vergi.model === "gst" ? "GST" : v.magaza.vergi.model === "vat" ? "VAT" : "KDV"} yüzde ${v.magaza.vergi.varsayilanOran}`}` : "Para birimi, vergi düzeni ve kargo bölgeleri", tamam: v.magaza.kargo.some((x) => x.aktif), git: () => git("kargo") },
    { id: "yasal", ad: "Yasal metinler", alt: Object.keys(v.yasal.sayfalar).length ? `${Object.keys(v.yasal.sayfalar).length} sayfa sitede` : v.profil.ulkeKodu === "TR" ? "KVKK, çerez, mesafeli satış ve iade metinleri" : "Gizlilik (GDPR, CCPA), çerez, satış ve iade metinleri", tamam: Object.keys(v.yasal.sayfalar).length >= 3, git: () => git("yasal") },
    { id: "cerez", ad: "Çerez onay bandı", alt: v.eklentiler.cerez.acik ? (v.eklentiler.cerez.bicim === "bolge" ? "Sitede açık, ziyaretçinin bölgesine göre" : "Sitede açık") : "GDPR, UK GDPR ve KVKK için gerekli; ABD'de reddetme hakkı", tamam: v.eklentiler.cerez.acik, git: () => git("eklentiler") },
    { id: "iletisim", ad: "WhatsApp ya da canlı sohbet", alt: v.eklentiler.whatsapp.acik || v.eklentiler.sohbet.acik ? [v.eklentiler.whatsapp.acik && "WhatsApp", v.eklentiler.sohbet.acik && "canlı sohbet"].filter(Boolean).join(" ve ") + " açık" : "Ziyaretçi tek tıkla ulaşsın", tamam: v.eklentiler.whatsapp.acik || v.eklentiler.sohbet.acik, git: () => git("eklentiler") },
    { id: "eposta", ad: "Kurumsal e-posta", alt: v.eposta.saglayici && v.eposta.alan ? `${v.eposta.alan} için kayıtlar hazır` : "info@alanadin.com gibi bir adres", tamam: !!(v.eposta.saglayici && v.eposta.alan), git: () => git("eposta") },
  ];
  const tamam = maddeler.filter((m) => m.tamam).length;
  return (
    <div className="space-y-4">
      <Kart ikon={LayoutDashboard} baslik={v.profil.ad || "İşletmen"} alt={d.yayinda ? "Site yayında" : "Site henüz yayında değil; işletme ayarları yayınlayınca sitede çalışır"} sag={<Rozet ton={tamam === maddeler.length ? "iyi" : "imza"}>{tamam} / {maddeler.length} hazır</Rozet>}>
        <div className="space-y-4 p-3 sm:p-4">
          <Istatistikler l={[
            { ad: "Hazırlanacak sipariş", deger: oz.bekleyenSiparis, alt: "ödemesi alınmış" },
            { ad: "Bugünkü randevu", deger: oz.bugunRandevu, alt: oz.onayBekleyenRandevu ? `${oz.onayBekleyenRandevu} onay bekliyor` : undefined },
            { ad: "Okunmamış sohbet", deger: oz.okunmamisSohbet, alt: oz.bekleyenYorum ? `${oz.bekleyenYorum} yorum onay bekliyor` : undefined },
            { ad: "Bülten abonesi", deger: oz.abone, alt: `${oz.yazi} blog yazısı` },
          ]} />
          <div className="grid gap-2 sm:grid-cols-3">
            {[{ ad: "E-posta servisi", ok: s.eposta, alt: s.eposta ? "Sipariş, randevu ve hatırlatma e-postaları gider" : "RESEND_API_KEY yok; müşteri e-postaları gitmez" }, { ad: "Yapay zekâ", ok: s.ai, alt: s.ai ? "Çeviri, blog taslağı, ürün açıklaması" : "Model bağlı değil; elle yazılır" }, { ad: "Ödeme", ok: !!s.odeme, alt: s.odeme ? (s.odemeMod === "canli" ? "Canlı ödeme alınıyor" : "Test modunda; gerçek para çekilmez") : "Sağlayıcı bağlı değil" }].map((x) => (
              <div key={x.ad} className="flex items-start gap-2.5 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", x.ok ? "bg-[#55d6fd]" : "bg-amber-300")} />
                <span className="min-w-0"><span className="block text-[13px] font-medium text-white">{x.ad}</span><span className="block text-[12px] leading-snug text-white/50">{x.alt}</span></span>
              </div>
            ))}
          </div>
        </div>
      </Kart>
      <Kart ikon={CheckCircle2} baslik="Kurulum listesi" alt="Satışa ve randevuya hazır bir işletme sitesi için">
        <div className="divide-y divide-white/[0.06]">
          {maddeler.map((m) => (
            <button key={m.id} type="button" onClick={m.git} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] sm:px-5">
              {m.tamam ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#55d6fd]" /> : <Circle className="h-5 w-5 shrink-0 text-white/25" />}
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{m.ad}</span><span className="block truncate text-[12px] text-white/50">{m.alt}</span></span>
              <span className="text-[12.5px] text-white/40">{m.tamam ? "Düzenle" : "Ayarla"}</span>
            </button>
          ))}
        </div>
      </Kart>
      <div className="grid gap-4 lg:grid-cols-2">
        <Kart ikon={CalendarDays} baslik="Yaklaşan randevular" alt={v.randevu.hizmetler.length ? `${v.randevu.hizmetler.length} hizmet` : "Randevu sistemi kurulmadı"} sag={<button type="button" onClick={() => git("randevular")} className="text-[12.5px] text-white/55 hover:text-white">Takvim</button>}>
          <YaklasanRandevular o={{ k: ik, projeId, goster: () => {} }} git={() => git("randevular")} />
          {!v.randevu.hizmetler.length && <button type="button" onClick={() => git("randevuAyar")} className="m-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#8be6ff]"><Settings2 className="h-3.5 w-3.5" />Hizmet ekleyip randevu almaya başla</button>}
        </Kart>
        <Kart ikon={Mail} baslik="Hızlı erişim" alt="Sık kullanılanlar">
          <div className="grid grid-cols-2 gap-2 p-3">
            {[["siparisler", "Siparişler", ShoppingCart], ["urunler", "Ürün ekle", Package], ["kuponlar", "Kupon oluştur", Tag], ["blog", "Blog yazısı", FileText], ["sohbet", "Sohbetler", MessagesSquare], ["eklentiler", "Eklentiler", Plug]].map(([id, ad, I]) => {
              const Ik = I as typeof Store;
              return <button key={id as string} type="button" onClick={() => git(id as string)} className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.03] px-3 py-3 text-left text-[13px] text-white ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]"><Ik className="h-4 w-4 text-white/60" />{ad as string}</button>;
            })}
          </div>
          {bulutaGit && <button type="button" onClick={() => bulutaGit("odemeler")} className="mx-3 mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-white/55 hover:text-white"><CreditCard className="h-3.5 w-3.5" />Bulut ödeme ayarları</button>}
        </Kart>
      </div>
    </div>
  );
}
