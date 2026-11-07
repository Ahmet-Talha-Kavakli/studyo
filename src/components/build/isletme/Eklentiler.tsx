"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Code2, Cookie, Copy, Map, MessageCircle, PanelTop, Star, Wand2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { VARSAYILAN_EKLENTI, type Eklentiler as EklentiAyar } from "@/lib/build/isletmeTipler";
import { cn } from "@/lib/utils";
import { Alan, BilgiSatiri, Girdi, GorselAlani, isletmeApi, KaydetSeridi, MetinAlani, SecenekCipleri, simgeDugme, useTaslak, type IsletmeKanca } from "./ortak";
import { SatirAyar } from "./Magaza";

type Ortak = { k: IsletmeKanca; projeId: string; goster: (m: string, t?: "iyi" | "kotu") => void; ajanaGonder?: (m: string) => void; git: (b: string) => void };
const RENKLER = ["#111111", "#0f766e", "#1d4ed8", "#b91c1c", "#c2410c", "#7c3aed"];

export function EklentiAyarlari({ o }: { o: Ortak }) {
  const tk = useTaslak<EklentiAyar>(o.k.d?.veri.eklentiler ?? VARSAYILAN_EKLENTI, (v) => o.k.kaydet("eklentiler", v));
  const t = tk.t;
  const [cerez, setCerez] = useState<{ gun: string; hepsi: number; kismi: number; red: number }[]>([]);
  useEffect(() => { isletmeApi<{ gunler: typeof cerez }>(o.projeId, "cerez").then((r) => setCerez(r.gunler)).catch(() => {}); }, [o.projeId]);
  const kuponlar = (o.k.d?.veri.kuponlar ?? []).filter((k) => k.aktif);
  const seri = <KaydetSeridi {...tk} kaydet={tk.kaydet} />;
  const w = t.whatsapp, s = t.sohbet, d = t.duyuru, p = t.popup, c = t.cerez, y = t.yorum;
  const dw = (x: Partial<typeof w>) => tk.d("whatsapp", { ...w, ...x });
  const ds = (x: Partial<typeof s>) => tk.d("sohbet", { ...s, ...x });
  const dd = (x: Partial<typeof d>) => tk.d("duyuru", { ...d, ...x });
  const dp = (x: Partial<typeof p>) => tk.d("popup", { ...p, ...x });
  const dc = (x: Partial<typeof c>) => tk.d("cerez", { ...c, ...x });
  const dy = (x: Partial<typeof y>) => tk.d("yorum", { ...y, ...x });
  const toplamOnay = cerez.reduce((a, g) => ({ hepsi: a.hepsi + g.hepsi, kismi: a.kismi + g.kismi, red: a.red + g.red }), { hepsi: 0, kismi: 0, red: 0 });
  const onayToplam = toplamOnay.hepsi + toplamOnay.kismi + toplamOnay.red;
  return (
    <div className="space-y-4">
      <BilgiSatiri ton="imza">Bu bölümdekiler sitenin her sayfasına kendiliğinden eklenir; kod yazmak ya da ajanı çalıştırmak gerekmez. Değişiklik kaydedilince önizlemede ve yayındaki sitede hemen görünür.</BilgiSatiri>

      <Kart ikon={MessageCircle} baslik="WhatsApp düğmesi" alt="Sayfanın köşesinde; tıklayınca hazır mesajla sohbet açılır" sag={<Anahtar acik={w.acik} set={(x) => dw({ acik: x })} etiket="WhatsApp düğmesi" />} altSerit={seri}>
        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_200px]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Alan etiket="WhatsApp numarası" alt="ülke koduyla"><Girdi value={w.numara} onChange={(e) => dw({ numara: e.target.value.replace(/\D/g, "") })} placeholder="905321234567" inputMode="numeric" maxLength={15} /></Alan>
              <Alan etiket="Düğme yazısı" alt="boşsa yalnız simge"><Girdi value={w.etiket} onChange={(e) => dw({ etiket: e.target.value })} maxLength={40} /></Alan>
            </div>
            <Alan etiket="Hazır mesaj"><Girdi value={w.mesaj} onChange={(e) => dw({ mesaj: e.target.value })} maxLength={300} /></Alan>
            <div className="flex flex-wrap items-center gap-3"><Secici id="wa-konum" kucuk deger={w.konum} set={(x) => dw({ konum: x })} l={[{ id: "sag-alt", ad: "Sağ alt" }, { id: "sol-alt", ad: "Sol alt" }]} /><label className="flex items-center gap-2 text-[12.5px] text-white/65"><Anahtar acik={w.urunSayfasi} set={(x) => dw({ urunSayfasi: x })} etiket="Sayfa adını ekle" />Mesaja sayfa adını ekle</label></div>
            {w.acik && w.numara.length < 11 && <BilgiSatiri ton="uyari">Numara 90 ile başlayan 12 hane olmalı (örnek 905321234567).</BilgiSatiri>}
          </div>
          <div className="flex items-end justify-end rounded-[18px] bg-[#f1f2f4] p-4" aria-hidden>
            <span className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-[#15171a] ring-1 ring-black/10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/whatsapp-color.svg" alt="" className="h-8 w-8" />{w.etiket}</span>
          </div>
        </div>
      </Kart>

      <Kart ikon={MessageCircle} baslik="Canlı sohbet" alt="Ziyaretçi siteden yazar, sen Müşteriler bölümünden yanıtlarsın" sag={<Anahtar acik={s.acik} set={(x) => ds({ acik: x })} etiket="Canlı sohbet" />} altSerit={seri}>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Alan etiket="Başlık"><Girdi value={s.baslik} onChange={(e) => ds({ baslik: e.target.value })} maxLength={60} /></Alan>
            <Alan etiket="Konum"><Secici id="sohbet-konum" kucuk deger={s.konum} set={(x) => ds({ konum: x })} l={[{ id: "sag-alt", ad: "Sağ alt" }, { id: "sol-alt", ad: "Sol alt" }]} /></Alan>
          </div>
          <Alan etiket="Karşılama" alt="çevrim içiyken"><Girdi value={s.karsilama} onChange={(e) => ds({ karsilama: e.target.value })} maxLength={300} /></Alan>
          <Alan etiket="Çevrim dışı mesajı"><Girdi value={s.cevrimdisi} onChange={(e) => ds({ cevrimdisi: e.target.value })} maxLength={300} /></Alan>
          <label className="flex items-center gap-2 text-[12.5px] text-white/65"><Anahtar acik={s.eposta} set={(x) => ds({ eposta: x })} etiket="Ad ve e-posta iste" />İlk mesajda ad ve e-posta iste</label>
          <button type="button" onClick={() => o.git("sohbet")} className="text-[12.5px] font-medium text-[#8be6ff]">Gelen sohbetleri aç</button>
        </div>
      </Kart>

      <Kart ikon={PanelTop} baslik="Duyuru çubuğu" alt="Sayfanın en üstünde kampanya ya da bilgi şeridi" sag={<Anahtar acik={d.acik} set={(x) => dd({ acik: x })} etiket="Duyuru çubuğu" />} altSerit={seri}>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.08]"><div className="px-4 py-2.5 text-center text-[13.5px] font-medium" style={{ background: d.renk, color: d.yaziRengi }}>{d.metin || "Duyuru metni"}{d.kupon && <b className="ml-1.5">{d.kupon}</b>}{d.baglantiMetni && <u className="ml-1.5 font-bold">{d.baglantiMetni}</u>}</div></div>
          <Alan etiket="Metin"><Girdi value={d.metin} onChange={(e) => dd({ metin: e.target.value })} maxLength={200} placeholder="Belirli tutarın üzerindeki siparişlerde kargo ücretsiz" /></Alan>
          <div className="grid gap-3 sm:grid-cols-3">
            <Alan etiket="Bağlantı"><Girdi value={d.baglanti} onChange={(e) => dd({ baglanti: e.target.value })} maxLength={300} placeholder="urunler.html" /></Alan>
            <Alan etiket="Bağlantı yazısı"><Girdi value={d.baglantiMetni} onChange={(e) => dd({ baglantiMetni: e.target.value })} maxLength={40} placeholder="Alışverişe başla" /></Alan>
            <Alan etiket="Kupon kodu"><select value={d.kupon} onChange={(e) => dd({ kupon: e.target.value })} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]"><option value="">Yok</option>{kuponlar.map((k) => <option key={k.id} value={k.kod}>{k.kod}</option>)}</select></Alan>
          </div>
          <Alan etiket="Zemin rengi">
            <div className="flex flex-wrap items-center gap-2">{RENKLER.map((r) => <button key={r} type="button" onClick={() => dd({ renk: r, yaziRengi: "#ffffff" })} className={cn("h-8 w-8 rounded-full ring-1 ring-inset ring-white/20", d.renk === r && "ring-2 ring-white ring-offset-2 ring-offset-[#121315]")} style={{ background: r }} aria-label={r} />)}
              <label className={cn("flex h-8 items-center gap-2 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/70", !RENKLER.includes(d.renk) && "ring-2 ring-white")}>Özel<input type="color" value={d.renk} onChange={(e) => dd({ renk: e.target.value })} className="h-5 w-6 cursor-pointer bg-transparent" /></label>
              <label className="flex h-8 items-center gap-2 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/70">Yazı<input type="color" value={d.yaziRengi} onChange={(e) => dd({ yaziRengi: e.target.value })} className="h-5 w-6 cursor-pointer bg-transparent" /></label></div>
          </Alan>
          <div className="flex flex-wrap items-center gap-4"><Alan etiket="Bitiş tarihi" alt="isteğe bağlı" className="w-[200px]"><Girdi type="date" value={d.bitis} onChange={(e) => dd({ bitis: e.target.value })} /></Alan><label className="mt-5 flex items-center gap-2 text-[12.5px] text-white/65"><Anahtar acik={d.kapatilabilir} set={(x) => dd({ kapatilabilir: x })} etiket="Kapatılabilir" />Ziyaretçi kapatabilsin</label></div>
        </div>
      </Kart>

      <Kart ikon={BadgePercent} baslik="Açılır pencere" alt="Bülten kaydı, e-posta karşılığı indirim kodu ya da duyuru" sag={<Anahtar acik={p.acik} set={(x) => dp({ acik: x })} etiket="Açılır pencere" />} altSerit={seri}>
        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <Alan etiket="Tür"><Secici id="popup-tur" kucuk deger={p.tur} set={(x) => dp({ tur: x })} l={[{ id: "eposta", ad: "Bülten" }, { id: "kupon", ad: "İndirim kodu" }, { id: "duyuru", ad: "Duyuru" }]} /></Alan>
            <Alan etiket="Başlık"><Girdi value={p.baslik} onChange={(e) => dp({ baslik: e.target.value })} maxLength={80} /></Alan>
            <Alan etiket="Metin"><MetinAlani value={p.metin} onChange={(e) => dp({ metin: e.target.value })} rows={2} maxLength={300} className="min-h-[60px]" /></Alan>
            <div className="grid gap-3 sm:grid-cols-2">
              <Alan etiket="Düğme"><Girdi value={p.dugme} onChange={(e) => dp({ dugme: e.target.value })} maxLength={30} /></Alan>
              {p.tur === "kupon" && <Alan etiket="Verilecek kupon"><select value={p.kuponKod} onChange={(e) => dp({ kuponKod: e.target.value })} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08]"><option value="">Kupon seç</option>{kuponlar.map((k) => <option key={k.id} value={k.kod}>{k.kod}</option>)}</select></Alan>}
            </div>
            {p.tur === "kupon" && !p.kuponKod && <BilgiSatiri ton="uyari">Kupon seçilmezse e-posta alınır ama kod gösterilmez. Kuponlar bölümünden oluştur.</BilgiSatiri>}
            <Alan etiket="Ne zaman"><Secici id="popup-tetik" kucuk deger={p.tetik} set={(x) => dp({ tetik: x })} l={[{ id: "gecikme", ad: "Bir süre sonra" }, { id: "kaydirma", ad: "Sayfanın yarısında" }, { id: "cikis", ad: "Çıkarken" }]} /></Alan>
            {p.tetik === "gecikme" && <SecenekCipleri<number> deger={p.gecikme} set={(x) => dp({ gecikme: x })} l={[3, 8, 15, 30].map((x) => ({ id: x, ad: `${x} sn` }))} ozel birim="sn" />}
            <Alan etiket="Ne sıklıkla"><Secici id="popup-siklik" kucuk deger={p.siklik} set={(x) => dp({ siklik: x })} l={[{ id: "bir", ad: "Bir kez" }, { id: "gunluk", ad: "Günde bir" }, { id: "her", ad: "Her ziyarette" }]} /></Alan>
            <Alan etiket="Yalnız bu sayfalarda" alt="virgülle; boşsa hepsi"><Girdi value={p.sayfalar} onChange={(e) => dp({ sayfalar: e.target.value })} placeholder="index.html, urunler.html" maxLength={300} /></Alan>
          </div>
          <div>
            <GorselAlani projeId={o.projeId} deger={p.gorsel} set={(x) => dp({ gorsel: x })} oran="aspect-video" etiket="Görsel (isteğe bağlı)" />
            <div className="mt-3 overflow-hidden rounded-[18px] bg-white text-[#15171a]" aria-hidden>
              {p.gorsel && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.gorsel} alt="" className="aspect-video w-full object-cover" />}
              <div className="p-4"><p className="text-[16px] font-semibold leading-tight">{p.baslik}</p>{p.metin && <p className="mt-1 text-[12.5px] text-[#4a505a]">{p.metin}</p>}{p.tur !== "duyuru" && <div className="mt-3 h-9 rounded-[10px] border border-[#d6d9de] px-3 text-[12.5px] leading-9 text-[#8a8f98]">E-posta adresin</div>}<div className="mt-2 h-9 rounded-full bg-[#15171a] text-center text-[13px] font-semibold leading-9 text-white">{p.dugme}</div></div>
            </div>
          </div>
        </div>
      </Kart>

      <Kart ikon={Cookie} baslik="Çerez onay bandı" alt="Ziyaretçinin bölgesine göre: AB, İngiltere ve Türkiye'de önceden onay, ABD'de reddetme hakkı, diğer yerlerde bildirim" sag={<Anahtar acik={c.acik} set={(x) => dc({ acik: x })} etiket="Çerez bandı" />} altSerit={seri}>
        <div className="space-y-3 p-4 sm:p-5">
          <Alan etiket="Onay biçimi">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {([
                { id: "bolge", ad: "Bölgeye göre", alt: "Ülkeye göre otomatik (önerilen)" },
                { id: "onay", ad: "Önceden onay", alt: "GDPR, UK GDPR, KVKK: onaydan önce analitik ve reklam çalışmaz" },
                { id: "ret", ad: "Reddetme hakkı", alt: "CCPA: varsayılan açık, satmama bağlantısı ve GPC" },
                { id: "bildirim", ad: "Yalnız bildirim", alt: "Onay şartı olmayan bölgeler" },
              ] as const).map((b) => <button key={b.id} type="button" onClick={() => dc({ bicim: b.id })} className={cn("rounded-[14px] px-3 py-2.5 text-left ring-1 ring-inset", c.bicim === b.id ? "bg-[#55d6fd]/[0.1] ring-[#55d6fd]/45" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}><span className="block text-[13px] font-medium text-white">{b.ad}</span><span className="mt-0.5 block text-[11.5px] leading-snug text-white/50">{b.alt}</span></button>)}
            </div>
          </Alan>
          <Alan etiket="Metin"><MetinAlani value={c.metin} onChange={(e) => dc({ metin: e.target.value })} rows={2} maxLength={400} className="min-h-[60px]" /></Alan>
          {(c.bicim === "bolge" || c.bicim === "ret") && <div className="grid gap-3 sm:grid-cols-2">
            <Alan etiket="Reddetme düğmesi" alt="ABD ziyaretçileri"><Girdi value={c.retMetni} onChange={(e) => dc({ retMetni: e.target.value })} maxLength={80} /></Alan>
            <label className="flex items-center gap-2 self-end pb-2 text-[12.5px] text-white/65"><Anahtar acik={c.gpc} set={(x) => dc({ gpc: x })} etiket="Global Privacy Control" />Global Privacy Control sinyalini ret say</label>
          </div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Alan etiket="Politika sayfası"><Girdi value={c.politika} onChange={(e) => dc({ politika: e.target.value })} maxLength={120} /></Alan>
            <Alan etiket="Konum"><Secici id="cerez-konum" kucuk deger={c.konum} set={(x) => dc({ konum: x })} l={[{ id: "alt", ad: "Alt orta" }, { id: "sol-alt", ad: "Sol alt" }]} /></Alan>
          </div>
          <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-[12.5px] text-white/65"><Anahtar acik={c.analitik} set={(x) => dc({ analitik: x })} etiket="Analitik seçeneği" />Analitik tercihi</label><label className="flex items-center gap-2 text-[12.5px] text-white/65"><Anahtar acik={c.pazarlama} set={(x) => dc({ pazarlama: x })} etiket="Pazarlama seçeneği" />Pazarlama tercihi</label></div>
          {onayToplam > 0 && <p className="text-[12.5px] text-white/55">Son 60 günde {onayToplam} karar: yüzde {Math.round((toplamOnay.hepsi / onayToplam) * 100)} hepsini kabul, yüzde {Math.round((toplamOnay.kismi / onayToplam) * 100)} kısmi, yüzde {Math.round((toplamOnay.red / onayToplam) * 100)} ret.</p>}
          <p className="text-[12px] text-white/45">Site kodu tercihi <code className="rounded bg-white/[0.08] px-1">vayra.cerez.durum()</code> ile okur, <code className="rounded bg-white/[0.08] px-1">data-vayra-cerez-ayar</code> öğesi bandı yeniden açar. Politika metnini Yasal metinler bölümünden ekle.</p>
          <button type="button" onClick={() => o.git("yasal")} className="text-[12.5px] font-medium text-[#8be6ff]">Çerez politikasını oluştur</button>
        </div>
      </Kart>

      <Kart ikon={Star} baslik="Yorum toplama" alt="İşletme ve ürün değerlendirmeleri; spam için hız sınırı ve onay" sag={<Anahtar acik={y.acik} set={(x) => dy({ acik: x })} etiket="Yorum toplama" />} altSerit={seri}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="Yayına alma" alt="Otomatikte 3 yıldız ve üstü hemen yayınlanır, altı onay bekler"><Secici id="yorum-onay" kucuk deger={y.onay} set={(x) => dy({ onay: x })} l={[{ id: "elle", ad: "Ben onaylarım" }, { id: "otomatik", ad: "Otomatik" }]} /></SatirAyar>
          <SatirAyar baslik="İşletme yorumları" alt="Google'da yıldız olarak görünebilir"><Anahtar acik={y.isletme} set={(x) => dy({ isletme: x })} etiket="İşletme yorumları" /></SatirAyar>
          <SatirAyar baslik="Ürün yorumları"><Anahtar acik={y.urun} set={(x) => dy({ urun: x })} etiket="Ürün yorumları" /></SatirAyar>
        </div>
      </Kart>

      <Kart ikon={Map} baslik="Yapılandırılmış veri ve harita" alt="Google'ın işletmeni anlaması için LocalBusiness verisi; adres haritası" altSerit={seri}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="LocalBusiness verisi" alt="Ad, adres, telefon, saatler, sosyal hesaplar ve puan ana sayfaya eklenir"><Anahtar acik={t.yapisalVeri} set={(x) => tk.d("yapisalVeri", x)} etiket="Yapılandırılmış veri" /></SatirAyar>
          <SatirAyar baslik="Harita" alt="data-vayra-harita öğesine OpenStreetMap haritası ve yol tarifi bağlantısı"><Anahtar acik={t.harita} set={(x) => tk.d("harita", x)} etiket="Harita" /></SatirAyar>
        </div>
      </Kart>

      <SitedeKullan o={o} />
    </div>
  );
}

const PARCALAR = [
  { kod: "<div data-vayra-randevu></div>", ad: "Randevu alma", istem: "Siteye randevu.html sayfası ekle, menüye bağla ve içine <div data-vayra-randevu></div> koy." },
  { kod: "<div data-vayra-blog></div>", ad: "Blog listesi", istem: "Ana sayfaya 'Son yazılar' bölümü ekle; içine <div data-vayra-blog data-sayfa-basi=\"3\" data-kategorisiz></div> koy ve altına blog.html bağlantısı ver." },
  { kod: "<div data-vayra-yorumlar></div>", ad: "Yorumlar", istem: "Ana sayfaya müşteri yorumları bölümü ekle: içine <div data-vayra-yorumlar></div> koy. Ürün sayfası varsa ürün açıklamasının altına <div data-vayra-yorumlar data-urun=\"ÜRÜN_KİMLİĞİ\"></div> ekle (ürün kimliğini sayfadaki üründen al)." },
  { kod: "<div data-vayra-harita></div>", ad: "Harita", istem: "İletişim bölümüne işletme adresini, telefonunu, çalışma saatlerini (vayra.isletme.profil() ile) ve altına <div data-vayra-harita></div> haritasını ekle." },
  { kod: "<div data-vayra-siparis-takip></div>", ad: "Sipariş takibi", istem: "siparis-takip.html sayfası ekle, alt bilgiden bağla ve içine <div data-vayra-siparis-takip></div> koy." },
  { kod: "<a href=\"#\" data-vayra-cerez-ayar>Çerez tercihleri</a>", ad: "Çerez tercihleri bağlantısı", istem: "Alt bilgiye 'Çerez tercihleri' bağlantısı ekle: <a href=\"#\" data-vayra-cerez-ayar>Çerez tercihleri</a>." },
  { kod: "<a href=\"#\" data-vayra-satma>Kişisel bilgilerimi satma ya da paylaşma</a>", ad: "CCPA satmama bağlantısı", istem: "Alt bilgiye Kaliforniya ziyaretçileri için şu bağlantıyı ekle: <a href=\"#\" data-vayra-satma>Kişisel bilgilerimi satma ya da paylaşma</a>." },
];
function SitedeKullan({ o }: { o: Ortak }) {
  return (
    <Kart ikon={Code2} baslik="Sitede kullan" alt="Bu öğeleri sayfaya koymak yeterli; içerik işletme panelinden gelir">
      <div className="divide-y divide-white/[0.06]">
        {PARCALAR.map((x) => (
          <div key={x.ad} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
            <span className="w-[150px] text-[13px] font-medium text-white">{x.ad}</span>
            <code className="min-w-0 flex-1 truncate rounded-[10px] bg-white/[0.05] px-2.5 py-2 text-[12px] text-white/70">{x.kod}</code>
            <button type="button" onClick={() => { navigator.clipboard.writeText(x.kod); o.goster("Kopyalandı"); }} className={simgeDugme} aria-label="Kopyala"><Copy className="h-4 w-4" /></button>
            {o.ajanaGonder && <button type="button" onClick={() => o.ajanaGonder!(x.istem)} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#8be6ff]"><Wand2 className="h-3.5 w-3.5" />Ajana ekle</button>}
          </div>
        ))}
      </div>
    </Kart>
  );
}
