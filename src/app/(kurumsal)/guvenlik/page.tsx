import type { Metadata } from "next";
import {
  Activity, BrainCircuit, Bug, Check, Cloud, DatabaseBackup, Fingerprint, KeyRound, Lock, ShieldCheck, Sparkles,
} from "lucide-react";
import { Belir, Bolum, SirketHero, butonSinif } from "@/components/sirket/ortak";
import { BelgeTalebi } from "@/components/sirket/BelgeTalebi";
import { SikSorulanlar } from "@/components/kesfet/Kapanis";
import { ALT_ISLEYICILER, GUVENLIK_SERTIFIKA, GUVENLIK_SSS, VERI_BOLGELERI } from "@/lib/kurumsal/detay";
import { ILETISIM } from "@/lib/kurumsal/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Güvenlik",
  description: "Vayra güvenlik merkezi: şifreleme, erişim kontrolü, veri ikameti, uyum durumu, alt işleyiciler, belge talebi ve sorumlu açık bildirimi.",
};

const TAAHHUTLER = [
  { ikon: BrainCircuit, baslik: "Verinle model eğitilmez", metin: "İstemlerin, dosyaların ve çıktıların ne bizim ne de sağlayıcılarımızın modellerini eğitir." },
  { ikon: Fingerprint, baslik: "İçeriğin senindir", metin: "Ürettiğin her şeyin hakları sende; istediğin an indirip silebilirsin." },
  { ikon: Cloud, baslik: "Varsayılan AB bölgesi", metin: "Veriler varsayılan olarak Frankfurt ve Amsterdam'da; kurumsal planda bölgeyi sen seçersin." },
  { ikon: Lock, baslik: "Uçtan uca şifreleme", metin: "Aktarımda TLS 1.3, depoda AES-256; anahtarlar ayrı bir anahtar yönetim hizmetinde." },
];

const KONTROLLER = [
  { ikon: Cloud, baslik: "Altyapı", maddeler: ["Sertifikalı bulut sağlayıcılarında izole ağlar", "WAF ve DDoS koruması", "Altyapı kod olarak yönetilir, her değişiklik incelenir", "Üretim ortamına doğrudan erişim yok"] },
  { ikon: KeyRound, baslik: "Erişim yönetimi", maddeler: ["Çalışanlar için zorunlu SSO ve donanım anahtarı", "En az yetki ilkesi, 90 günde bir erişim gözden geçirmesi", "Müşteri verisine erişim yalnız destek talebiyle ve kayıt altında", "Kurumsal müşteriler için SAML SSO ve SCIM"] },
  { ikon: ShieldCheck, baslik: "Uygulama güvenliği", maddeler: ["Her kod değişikliği için akran incelemesi ve otomatik tarama", "Bağımlılık açıkları için sürekli izleme", "Yılda en az bir bağımsız sızma testi", "Gizli anahtarlar kasada; kodda anahtar yok"] },
  { ikon: Activity, baslik: "İzleme ve olay müdahalesi", maddeler: ["7/24 merkezi kayıt ve alarm", "Yazılı olay müdahale planı ve yıllık tatbikat", "İhlallerde 72 saat içinde bildirim", "Büyük olaylardan sonra kamuya açık değerlendirme raporu"] },
  { ikon: DatabaseBackup, baslik: "İş sürekliliği", maddeler: ["Veritabanları için 2 saatte bir şifreli yedek, 30 gün saklama", "Çok bölgeli yedekleme", "Felaket kurtarma hedefleri: RPO 2 saat, RTO 8 saat", "Kritik sağlayıcılar için yedek plan"] },
  { ikon: Sparkles, baslik: "Yapay zekâ güvenliği", maddeler: ["İstem ve çıktılar için katmanlı içerik denetimi", "Çocuk istismarı içeriklerine karşı sıfır tolerans ve bildirim", "Çıktılarda C2PA içerik kimlik bilgisi ve filigran", "Ses klonlamada rıza doğrulaması"] },
];

const GUNCELLEMELER = [
  { tarih: "1 Ekim 2026", baslik: "Vayra Earn için kimlik doğrulama", metin: "Kreatör ödemelerinde NVİ kimlik doğrulaması ve IBAN kontrolleri devreye alındı." },
  { tarih: "12 Eylül 2026", baslik: "Yıllık sızma testi tamamlandı", metin: "Bağımsız firma tarafından yapılan testte kritik bulgu yok; orta seviye iki bulgu 14 gün içinde kapatıldı." },
  { tarih: "1 Temmuz 2026", baslik: "Türkiye veri sorumlusu", metin: "Türkiye'deki kullanıcılar için veri sorumlusu Vayra Teknoloji A.Ş. olarak belirlendi; KVKK standart sözleşmeleri Kurum'a bildirildi." },
  { tarih: "18 Mayıs 2026", baslik: "SOC 2 Tip II denetimi başladı", metin: "Gözlem dönemi başladı; raporun 2027 ilk çeyreğinde yayınlanması bekleniyor." },
];

export default function Guvenlik() {
  return (
    <>
      <SirketHero ust="Güvenlik merkezi" baslik="Güvenlik bir özellik değil, temel."
        alt="Vayra'yı ajanslar, markalar ve kurumlar kullanıyor. Verilerini nasıl koruduğumuzu açıkça anlatıyor, kanıtlarını talep eden herkesle paylaşıyoruz."
        medya={
          <div className="rounded-[24px] border border-white/[0.08] bg-yuzey p-6">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-white">Uyum durumu</p>
              <span className="text-[12px] text-metin-3">Son gözden geçirme: Eylül 2026</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {GUVENLIK_SERTIFIKA.map((s) => {
                const surecte = s.durum === "Süreçte";
                return (
                  <div key={s.ad} className="rounded-xl border border-white/[0.06] bg-zemin px-3.5 py-3">
                    <p className="text-[13px] font-medium text-white">{s.ad}</p>
                    <p className={cn("mt-0.5 flex items-center gap-1 text-[11.5px]", surecte ? "text-amber-200" : "text-tur-3d")}>
                      {surecte ? <Activity className="h-3 w-3" /> : <Check className="h-3 w-3" />}{s.durum}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        }>
        <a href="#belgeler" className={butonSinif("beyaz")}>Güvenlik belgelerini iste</a>
        <a href="#bildirim" className={butonSinif("ikincil")}>Açık bildir</a>
      </SirketHero>

      <Bolum ust="Taahhütlerimiz" baslik="Sözleşmeye yazdığımız dört söz.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TAAHHUTLER.map((t, i) => (
            <Belir key={t.baslik} gecikme={i * 0.04} className="h-full">
              <div className="h-full rounded-[22px] border border-white/[0.07] bg-yuzey p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vurgu/15 text-vurgu"><t.ikon className="h-5 w-5" /></span>
                <p className="mt-6 text-[17px] font-semibold text-white">{t.baslik}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-metin-2">{t.metin}</p>
              </div>
            </Belir>
          ))}
        </div>
      </Bolum>

      <Bolum ust="Kontroller" baslik="Nasıl koruyoruz?">
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {KONTROLLER.map((k) => (
            <div key={k.baslik} className="border-t border-white/[0.1] pt-6">
              <k.ikon className="h-5 w-5 text-white/80" />
              <h3 className="mt-4 text-[19px] font-semibold text-white">{k.baslik}</h3>
              <ul className="mt-3 space-y-2">
                {k.maddeler.map((m) => <li key={m} className="flex gap-2.5 text-[14px] leading-relaxed text-metin-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-tur-3d" />{m}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Bolum>

      <Bolum ust="Veri ikameti" baslik="Verin nerede duracağını sen seç.">
        <div className="grid gap-3 md:grid-cols-3">
          {VERI_BOLGELERI.map((b, i) => (
            <div key={b.bolge} className={cn("rounded-[22px] border p-6", i === 0 ? "border-vurgu/40 bg-[color-mix(in_oklab,var(--vurgu-renk)_12%,#111113)]" : "border-white/[0.07] bg-yuzey")}>
              <p className="text-[12px] font-medium text-metin-3">{b.not}</p>
              <p className="mt-6 text-[24px] font-semibold tracking-[-0.02em] text-white">{b.bolge}</p>
              <p className="mt-1 text-[14px] text-metin-2">{b.konum}</p>
            </div>
          ))}
        </div>
      </Bolum>

      <Bolum id="alt-isleyiciler" ust="Şeffaflık" baslik="Alt işleyiciler" alt="Kişisel verileri bizim adımıza işleyen hizmet sağlayıcılar. Yeni bir alt işleyici eklemeden 30 gün önce kurumsal müşterilerimize bildiririz.">
        <div className="overflow-x-auto rounded-[22px] border border-white/[0.07]">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-white/[0.03]">
              <tr className="text-[13px] text-white">{["Hizmet", "Amaç", "Konum", "Aktarım güvencesi"].map((h) => <th key={h} className="px-5 py-3.5 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[14px]">
              {ALT_ISLEYICILER.map((a) => (
                <tr key={a.ad}>
                  <td className="px-5 py-3.5 text-white">{a.ad}</td>
                  <td className="px-5 py-3.5 text-metin-2">{a.amac}</td>
                  <td className="px-5 py-3.5 text-metin-2">{a.konum}</td>
                  <td className="px-5 py-3.5 text-metin-3">{a.konum === "AB" ? "AB içinde" : "Standart sözleşme maddeleri"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bolum>

      <Bolum id="belgeler" ust="Belge kütüphanesi" baslik="Güvenlik ekibin için hazır." alt="Tedarikçi değerlendirmeni hızlandıracak belgeleri seç; gizlilik sözleşmesinden sonra paylaşalım.">
        <BelgeTalebi />
      </Bolum>

      <Bolum id="bildirim">
        <div className="grid gap-10 rounded-[28px] border border-white/[0.07] bg-yuzey p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Bug className="h-6 w-6 text-vurgu" />
            <h2 className="mt-5 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[38px]">Bir açık mı buldun?</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-metin-2">Güvenlik araştırmacılarıyla birlikte çalışıyoruz. Bulduğun açığı sorumlu şekilde bildirirsen 1 iş günü içinde yanıtlar, doğrulanan bulgular için ödül veririz.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`mailto:${ILETISIM.guvenlik}?subject=G%C3%BCvenlik%20bildirimi`} className={butonSinif("beyaz")}>{ILETISIM.guvenlik}</a>
              <a href="/.well-known/security.txt" className={butonSinif("ikincil")}>security.txt</a>
            </div>
          </div>
          <div className="space-y-5 text-[14px]">
            <div>
              <p className="font-semibold text-white">Ödül aralıkları</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[["Kritik", "₺75.000'e kadar"], ["Yüksek", "₺25.000'e kadar"], ["Orta", "₺7.500'e kadar"], ["Düşük", "Teşekkür + Vayra kredisi"]].map(([a, b]) => (
                  <div key={a} className="rounded-xl border border-white/[0.06] bg-zemin px-3.5 py-3"><p className="text-[12px] text-metin-3">{a}</p><p className="mt-0.5 font-medium text-white">{b}</p></div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">Kurallar</p>
              <ul className="mt-2 space-y-1.5 text-metin-2">
                <li>· Yalnız kendi hesabınla test et; başka kullanıcıların verisine erişme.</li>
                <li>· Hizmet kesintisine yol açacak testler (DoS) ve sosyal mühendislik kapsam dışıdır.</li>
                <li>· Açık düzeltilene kadar kamuoyuyla paylaşma; düzeltme sonrası birlikte duyuralım.</li>
              </ul>
            </div>
          </div>
        </div>
      </Bolum>

      <Bolum id="guncellemeler" ust="Güncellemeler" baslik="Güvenlik günlüğü">
        <ol className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {GUNCELLEMELER.map((g) => (
            <li key={g.baslik} className="grid gap-2 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8">
              <span className="text-[13px] tabular-nums text-metin-3">{g.tarih}</span>
              <span><span className="block text-[16px] font-semibold text-white">{g.baslik}</span><span className="mt-1 block text-[14px] leading-relaxed text-metin-2">{g.metin}</span></span>
            </li>
          ))}
        </ol>
      </Bolum>

      <SikSorulanlar sorular={GUVENLIK_SSS} baslik="Güvenlik soruları." />
    </>
  );
}
