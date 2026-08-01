import type { Metadata } from "next";
import { Flag, Eye, Users, Check, ArrowRight, MapPin } from "lucide-react";
import { Hero, BolumBaslik, DegerKart, IstatistikBandi, CTASerit, Kart, CTAButon, GhostButon } from "@/components/kurumsal/UI";
import { DEGERLER, LIDERLIK, DANISMANLAR, ZAMAN_CIZELGESI, ISTATISTIKLER, HIZLI_GERCEKLER, NEDEN_BIZ } from "@/lib/kurumsal/icerik";

export const metadata: Metadata = {
  title: "Hakkımızda — Vayra",
  description: "Vayra'nın hikayesi, misyonu, vizyonu, değerleri ve ekibi. Yaratıcılığın altyapısını kuran insanları ve kilometre taşlarımızı yakından tanıyın.",
};

export default function Hakkinda() {
  return (
    <>
      <Hero
        ustBaslik="Hakkımızda"
        baslik="Yaratıcılığın altyapısını kuruyoruz"
        aciklama="Vayra; video, görsel, 3D ve sesi tek panelde birleştiren yeni nesil bir yaratıcı platform. Fikirle yayın arasındaki mesafeyi sıfırlamak için buradayız."
        cta={<>
          <CTAButon href="/kariyer">Ekibimize katıl</CTAButon>
          <GhostButon href="/kurumsal">Kurumsal genel bakış</GhostButon>
        </>}
      />

      {/* Sayılar */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <IstatistikBandi ogeler={ISTATISTIKLER} />
      </section>

      {/* Hikaye */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="kr-kart p-8 text-center md:p-12">
          <p className="text-lg leading-relaxed text-[color:var(--color-metin-2)]">
            En iyi araçlar dağınık ve pahalı olmamalı. Biz sektörün en güçlü AI modellerini —
            video, görsel, 3D ve ses — tek bir sinematik panelde topladık. Üstüne rakiplerde
            nadir bulunan <span className="font-semibold text-[color:var(--color-metin)]">3D modelleme</span> ve{" "}
            <span className="font-semibold text-[color:var(--color-metin)]">profesyonel ses üretimini</span> ekledik.
            Sonuç: herkesin cebinde bir stüdyoya sahip olabildiği bir dünya.
          </p>
        </div>
      </section>

      {/* Misyon & Vizyon */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Kart className="!p-8">
            <span className="kr-ikon flex h-12 w-12 items-center justify-center rounded-2xl"><Flag className="h-6 w-6" /></span>
            <h3 className="mt-4 text-xl font-bold text-[color:var(--color-metin)]">Misyonumuz</h3>
            <p className="mt-2 leading-relaxed text-[color:var(--color-metin-2)]">
              Yaratıcı üretimi herkes için erişilebilir kılmak. Bütçesi, ekibi veya teknik
              bilgisi ne olursa olsun her yaratıcının profesyonel kalitede içerik üretebilmesini sağlamak.
            </p>
          </Kart>
          <Kart className="!p-8">
            <span className="kr-ikon flex h-12 w-12 items-center justify-center rounded-2xl"><Eye className="h-6 w-6" /></span>
            <h3 className="mt-4 text-xl font-bold text-[color:var(--color-metin)]">Vizyonumuz</h3>
            <p className="mt-2 leading-relaxed text-[color:var(--color-metin-2)]">
              Fikirle yayın arasındaki mesafenin sıfırlandığı bir gelecek. Yaratıcılığın önündeki
              teknik engellerin kalktığı, tek bir panelin bir stüdyo ekibinin yerini tuttuğu bir dünya.
            </p>
          </Kart>
        </div>
      </section>

      {/* Neden Vayra */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <BolumBaslik baslik="Bizi ne farklı kılıyor?" ozet="Vayra'yı diğerlerinden ayıran noktalar." />
        <div className="grid gap-4 sm:grid-cols-2">
          {NEDEN_BIZ.map((n) => (
            <Kart key={n.baslik} className="flex gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--kr-lime-metin)]" />
              <div>
                <h3 className="font-semibold text-[color:var(--color-metin)]">{n.baslik}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{n.metin}</p>
              </div>
            </Kart>
          ))}
        </div>
      </section>

      {/* Değerler */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <BolumBaslik baslik="Değerlerimiz" ozet="Her kararımızı yönlendiren ilkeler." />
        <div className="grid gap-5 sm:grid-cols-2">
          {DEGERLER.map((d) => <DegerKart key={d.ad} {...d} />)}
        </div>
      </section>

      {/* Hızlı gerçekler */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="kr-kart grid grid-cols-2 gap-px overflow-hidden bg-[color:var(--color-kenar)] !p-0 sm:grid-cols-3 lg:grid-cols-6">
          {HIZLI_GERCEKLER.map((h) => (
            <div key={h.etiket} className="bg-white px-4 py-5 text-center">
              <div className="text-xs uppercase tracking-wider text-[color:var(--color-metin-3)]">{h.etiket}</div>
              <div className="mt-1.5 font-semibold text-[color:var(--color-metin)]">{h.deger}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Zaman çizelgesi */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <BolumBaslik baslik="Yolculuğumuz" ozet="Bir fikirden dünyaya yayılan bir platforma." />
        <div className="relative space-y-4 border-l-2 border-[color:var(--color-kenar)] pl-8">
          {ZAMAN_CIZELGESI.map((z) => (
            <div key={z.yil} className="relative">
              <span className="absolute -left-[41px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#b8e02f] ring-4 ring-white" />
              <div className="kr-kart p-5">
                <span className="text-sm font-bold text-[color:var(--kr-lime-metin)]">{z.yil}</span>
                <h3 className="mt-1 font-semibold text-[color:var(--color-metin)]">{z.baslik}</h3>
                <p className="mt-1 text-sm text-[color:var(--color-metin-2)]">{z.metin}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Liderlik ekibi (detaylı) */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <BolumBaslik ustBaslik="Liderlik" baslik="Perde arkasındaki insanlar" ozet="Vayra'yı yöneten çekirdek ekip." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LIDERLIK.map((k) => (
            <Kart key={k.ad} hover className="flex h-full flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8ff7a] to-[#a8d61e] text-lg font-bold text-[#14160b]">{k.mono}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-[color:var(--color-metin)]">{k.ad}</p>
                  <p className="text-sm text-[color:var(--kr-lime-metin)]">{k.unvan}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--color-metin-3)]">
                    <MapPin className="h-3 w-3 shrink-0" /> {k.konum}
                  </p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{k.bio}</p>
              <p className="mt-3 border-t border-[color:var(--color-kenar)] pt-3 text-xs text-[color:var(--color-metin-3)]">{k.gecmis}</p>
            </Kart>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-[color:var(--color-metin-2)]">
          <Users className="h-4 w-4 text-[color:var(--kr-lime-metin)]" />
          Ekibimiz 18 ülkede 30+ kişi ve büyüyor. <a href="/kariyer" className="inline-flex items-center gap-1 font-semibold text-[color:var(--kr-lime-metin)]">Açık pozisyonlara bak <ArrowRight className="h-3.5 w-3.5" /></a>
        </div>
      </section>

      {/* Danışma kurulu */}
      <section className="mx-auto max-w-5xl px-4 pb-14">
        <BolumBaslik ustBaslik="Danışma Kurulu" baslik="Bize yön verenler" ozet="Sektör deneyimiyle yolumuzu açan bağımsız isimler." />
        <div className="grid gap-5 sm:grid-cols-3">
          {DANISMANLAR.map((d) => (
            <Kart key={d.ad} hover className="flex h-full flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-kenar)] bg-[color:var(--color-yuzey-2)] text-sm font-bold text-[color:var(--color-metin)]">{d.mono}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-[color:var(--color-metin)]">{d.ad}</p>
                  <p className="text-xs text-[color:var(--color-metin-3)]">{d.unvan}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{d.not}</p>
            </Kart>
          ))}
        </div>
      </section>

      <CTASerit
        baslik="Geleceği birlikte inşa edelim"
        ozet="İster ekibimize katıl, ister Vayra ile üretmeye başla — kapımız açık."
        birincil={{ ad: "Ücretsiz başla", href: "/kayit" }}
        ikincil={{ ad: "Açık pozisyonlar", href: "/kariyer" }}
      />
    </>
  );
}
