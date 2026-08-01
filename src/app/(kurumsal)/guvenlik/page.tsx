import type { Metadata } from "next";
import { Lock, ShieldCheck, Server, Eye, KeyRound, FileCheck, RefreshCw, UserCheck, Check, Clock, Globe } from "lucide-react";
import { Hero, BolumBaslik, DegerKart, Kart, CTASerit, MiniSSS } from "@/components/kurumsal/UI";
import { ILETISIM } from "@/lib/kurumsal/site";
import { GUVENLIK_SERTIFIKA, ALT_ISLEYICILER, GUVENLIK_SSS, VERI_BOLGELERI } from "@/lib/kurumsal/detay";

export const metadata: Metadata = {
  title: "Güvenlik — Vayra",
  description: "Vayra'da veri güvenliği: uçtan uca şifreleme, güvenli altyapı, GDPR/CCPA uyumu ve sorumlu AI üretimi. Güvenliği bir özellik değil, temel kabul ediyoruz.",
};

const ilkeler = [
  { ikon: Lock, ad: "Şifreleme her yerde", ozet: "Verilerin aktarımda (TLS 1.3) ve durağan hâlde (AES-256) şifrelenir. Anahtarlar düzenli olarak döndürülür." },
  { ikon: Server, ad: "Güvenli altyapı", ozet: "Sektör lideri bulut sağlayıcılarında, izole ağlarda ve en az yetki ilkesiyle çalışır." },
  { ikon: Eye, ad: "İzleme & tespit", ozet: "7/24 anomali tespiti, denetim günlükleri ve gerçek zamanlı uyarılarla sistemleri sürekli izleriz." },
  { ikon: UserCheck, ad: "Erişim kontrolü", ozet: "Rol tabanlı erişim, zorunlu iki adımlı doğrulama ve düzenli erişim gözden geçirmeleri." },
];

const uyum = [
  { ikon: FileCheck, ad: "GDPR & CCPA uyumu", ozet: "Kişisel veriler ilgili mevzuata uygun işlenir; veri işleme kayıtları tutulur." },
  { ikon: KeyRound, ad: "Veri minimizasyonu", ozet: "Yalnızca hizmet için gerekli veriyi toplar, gereğinden fazlasını saklamayız." },
  { ikon: RefreshCw, ad: "Veri saklama & silme", ozet: "Talep üzerine verilerin silinir; saklama süreleri şeffaf şekilde tanımlıdır." },
  { ikon: ShieldCheck, ad: "Sorumlu AI", ozet: "Kullanıcı içeriğin izinsiz eğitime kullanılmaz; kötüye kullanım moderasyonla önlenir." },
];

export default function Guvenlik() {
  return (
    <>
      <Hero
        ustBaslik="Güvenlik"
        baslik="Güvenlik bir özellik değil, temeldir"
        aciklama="Verilerinin güvenliği ve gizliliği önceliğimiz. Altyapımızı, uyumluluğumuzu ve sorumlu AI ilkelerimizi şeffafça paylaşıyoruz."
      />

      {/* Güvenlik ilkeleri */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <BolumBaslik baslik="Güvenlik ilkelerimiz" ozet="Sistemi baştan güvenli tasarlıyoruz." />
        <div className="grid gap-5 sm:grid-cols-2">
          {ilkeler.map((i) => <DegerKart key={i.ad} {...i} />)}
        </div>
      </section>

      {/* Uyum & veri koruma */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <BolumBaslik baslik="Uyum & veri koruma" ozet="Verini koruyan yasal ve teknik güvenceler." />
        <div className="grid gap-5 sm:grid-cols-2">
          {uyum.map((u) => <DegerKart key={u.ad} {...u} />)}
        </div>
      </section>

      {/* Sertifika & uyum durumu */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <BolumBaslik baslik="Sertifikalar & standartlar" ozet="Uyguladığımız ve süreçteki güvenlik standartları." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GUVENLIK_SERTIFIKA.map((s) => {
            const aktif = s.durum === "Aktif" || s.durum === "Uyumlu";
            return (
              <Kart key={s.ad} className="flex items-center justify-between">
                <span className="font-medium text-[color:var(--color-metin)]">{s.ad}</span>
                <span className={`flex items-center gap-1.5 text-sm font-semibold ${aktif ? "text-emerald-600" : "text-amber-600"}`}>
                  {aktif ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />} {s.durum}
                </span>
              </Kart>
            );
          })}
        </div>
      </section>

      {/* Veri ikamet bölgeleri */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <BolumBaslik baslik="Veri ikamet bölgeleri" ozet="Verilerinin hangi bölgede tutulacağını kurumsal planlarda sen seçersin." />
        <div className="grid gap-4 sm:grid-cols-3">
          {VERI_BOLGELERI.map((v) => (
            <Kart key={v.bolge}>
              <span className="kr-ikon flex h-10 w-10 items-center justify-center rounded-xl"><Globe className="h-4.5 w-4.5" /></span>
              <h3 className="mt-3 font-semibold text-[color:var(--color-metin)]">{v.bolge}</h3>
              <p className="mt-1 text-sm text-[color:var(--color-metin-2)]">{v.konum}</p>
              <p className="mt-2 border-t border-[color:var(--color-kenar)] pt-2 text-xs text-[color:var(--color-metin-3)]">{v.not}</p>
            </Kart>
          ))}
        </div>
      </section>

      {/* Alt işleyiciler */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <BolumBaslik baslik="Alt işleyiciler" ozet="Hizmeti sunmak için birlikte çalıştığımız veri işleyen taraflar (GDPR md.28 şeffaflığı)." />
        <div className="kr-kart divide-y divide-[color:var(--color-kenar)] !p-0">
          {ALT_ISLEYICILER.map((a) => (
            <div key={a.ad} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <div className="font-medium text-[color:var(--color-metin)]">{a.ad}</div>
                <div className="text-sm text-[color:var(--color-metin-3)]">{a.amac}</div>
              </div>
              <span className="shrink-0 rounded-full border border-[color:var(--color-kenar)] px-2.5 py-1 text-xs text-[color:var(--color-metin-2)]">{a.konum}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Güvenlik SSS */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <BolumBaslik baslik="Güvenlik hakkında sık sorulanlar" />
        <MiniSSS maddeler={GUVENLIK_SSS} />
      </section>

      {/* Sorumlu açıklama */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <Kart className="!p-8">
          <div className="flex items-start gap-4">
            <span className="kr-ikon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"><ShieldCheck className="h-6 w-6" /></span>
            <div>
              <h3 className="text-xl font-bold text-[color:var(--color-metin)]">Bir güvenlik açığı mı buldun?</h3>
              <p className="mt-2 leading-relaxed text-[color:var(--color-metin-2)]">
                Sorumlu açıklamaya inanıyoruz. Bir güvenlik zafiyeti tespit ettiysen, herkese açık paylaşmadan önce{" "}
                <a href={`mailto:${ILETISIM.guvenlik}`} className="font-semibold text-[color:var(--kr-lime-metin)]">{ILETISIM.guvenlik}</a>{" "}
                adresine bildir. Bildirimini en kısa sürede inceler ve düzeltiriz.
              </p>
            </div>
          </div>
        </Kart>
      </section>

      <CTASerit
        baslik="Sorularınız mı var?"
        ozet="Güvenlik, uyum veya veri işleme hakkında ekibimizle görüşün."
        birincil={{ ad: "Bize ulaş", href: "/iletisim" }}
        ikincil={{ ad: "Gizlilik Politikası", href: "/gizlilik" }}
      />
    </>
  );
}
