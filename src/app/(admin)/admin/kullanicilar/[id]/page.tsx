"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown, Ban, MailWarning, ShieldCheck, Coins, Wallet, Monitor, Smartphone, Tablet, Boxes, KeyRound, ScrollText } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { KullaniciAksiyonlar } from "@/components/admin/kullanici/Aksiyonlar";
import { AD, BilgiSatir, Bos, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Sekmeler, Yukleniyor } from "@/components/admin/ui/temel";
import { useAdminVeri, para, sayi, tarih, tarihSaat, gorece, PLAN_AD } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Hareket { sira: number; id: string; zaman: number; tur: string; miktar: number; bakiye: number; kaynak: string; aciklama: string }
interface Siparis { no: string; tur: string; ad: string; durum: string; para: "TRY" | "USD"; toplam: number; saglayici: string; mod: string; olusturma: number; odemeZamani?: number; makbuzNo?: string; kart?: string; taksit?: number; iade?: { tutar: number; zaman: number }; hata?: string }
interface Ayrinti {
  hesap: {
    id: string; ad: string; email: string; kullaniciAdi?: string; avatar?: string; plan: string; bakiye: number | null; olusturma: number; sonGorulme: number; dogrulandi: boolean;
    admin: boolean; askida: boolean; ikiAdim: boolean; saglayicilar: string[]; oturum: number; guncelleme: number; bekleyenEposta?: string; sifreVar: boolean;
    sifreGuncelleme: number | null; ikiAdimAcilis: number | null; askidaAyrinti: { zaman: number; neden: string; admin: string } | null; yeniGirisEposta: boolean;
    profil: { konum?: string; website?: string; davetEden?: string; slogan?: string };
  };
  defter: { plan: string; bakiye: number; planKredi: number; ekKredi: number; donemBaslangic: number; donemBitis: number; donemToplam: number; ozelKota: number | null; planBitis: number | null; planOtomatik: boolean; planGecis: { zaman: number; plan: string } | null } | null;
  kredi: { harcanan: number; eklenen: number; iade: number; uretim: number; hareketSayisi: number };
  hareketler: Hareket[];
  odeme: { siparisler: Siparis[]; abonelik: { plan: string; durum: string; donem: string; para: string; saglayici: string; donemBitis: number; otomatik: boolean; iptalTarihi?: number } | null; promolar: number; gorevler: number; hediyeler: { kredi: number; zaman: number; kullanildi?: number; iptal?: number }[]; fatura: { tip: string; il: string; ulke: string } | null };
  oturumlar: { id: string; tarayici: string; isletim: string; tur: string; baslangic: number; sonGorulme: number; bitis: number; yontem: string; ip: string }[];
  olaylar: { id: string; zaman: number; tur: string; cihaz: string; ayrinti?: string; ip?: string }[];
  build: { sayi: number; projeler: { id: string; ad: string; tur: string; guncelleme: number; yayinda: boolean }[] } | null;
  apiAnahtar: number;
  denetim: { id: string; zaman: number; admin: { email: string }; eylem: string; ayrinti?: string; onem: string }[];
}

const OLAY_AD: Record<string, string> = {
  giris: "Giriş", "giris-hatali": "Hatalı giriş", cikis: "Çıkış", kayit: "Kayıt", sifre: "Şifre değişti", "2fa-ac": "İki adım açıldı", "2fa-kapat": "İki adım kapatıldı",
  "yedek-kod": "Yedek kod kullanıldı", "yedek-yenile": "Yedek kodlar yenilendi", eposta: "E-posta değişikliği", "oturum-kapat": "Oturum kapatıldı", "veri-indir": "Veri indirildi",
  "eposta-dogrula": "E-posta doğrulandı", sifirla: "Şifre sıfırlandı", "saglayici-bagla": "Sosyal hesap bağlandı", "saglayici-kaldir": "Sosyal hesap kaldırıldı", kilit: "Kilit ya da askı",
};
const HAREKET_AD: Record<string, string> = { acilis: "Açılış", kota: "Aylık kota", harcama: "Harcama", iade: "İade", ekleme: "Ekleme", plan: "Plan", duzeltme: "Düzeltme", "sona-erdi": "Süresi doldu" };
const DURUM_AD: Record<string, string> = { odendi: "Ödendi", bekliyor: "Bekliyor", basarisiz: "Başarısız", iade: "İade edildi" };
const CIHAZ = { masaustu: Monitor, mobil: Smartphone, tablet: Tablet } as const;

export default function KullaniciDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sekme, setSekme] = useState("ozet");
  const { veri: v, hata, yenile } = useAdminVeri<Ayrinti>(`/api/admin/kullanicilar/${encodeURIComponent(id)}`);

  if (hata) return <RotaGuard modul="kullanicilar"><Geri /><HataKutusu hata={hata} yenile={yenile} /></RotaGuard>;
  if (!v) return <RotaGuard modul="kullanicilar"><Geri /><Yukleniyor satir={4} /></RotaGuard>;
  const h = v.hesap;

  return (
    <RotaGuard modul="kullanicilar">
      <Geri />
      <Kart className="mb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            {h.avatar
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={h.avatar} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
              : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-xl font-bold text-[color:var(--ad-metin-2)]">{(h.ad || h.email)[0]?.toLocaleUpperCase("tr")}</span>}
            <div className="min-w-0">
              <h1 className={cn("flex items-center gap-2 truncate text-lg font-bold", AD.metin)}>{h.ad}{h.admin && <Crown className="h-4 w-4 text-amber-300" aria-label="Yönetici" />}</h1>
              <p className={cn("truncate text-sm", AD.metin2)}>{h.email}{h.kullaniciAdi && <span className={AD.metin3}> · @{h.kullaniciAdi}</span>}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Rozet ton={h.plan === "baslangic" ? "notr" : "aksan"}>{PLAN_AD[h.plan] ?? h.plan}</Rozet>
                {h.admin && <Rozet ton="uyari">Yönetici</Rozet>}
                {h.askida && <Rozet ton="tehlike"><Ban className="h-3 w-3" /> Askıda</Rozet>}
                {!h.dogrulandi && <Rozet ton="uyari"><MailWarning className="h-3 w-3" /> E-posta doğrulanmamış</Rozet>}
                {h.ikiAdim && <Rozet ton="basari"><ShieldCheck className="h-3 w-3" /> İki adım açık</Rozet>}
              </div>
            </div>
          </div>
          <div className={cn("shrink-0 text-[12px] md:text-right", AD.metin3)}>
            <div>Kayıt {tarih(h.olusturma)}</div><div>Son görülme {gorece(h.sonGorulme)}</div><div className="font-mono">{h.id}</div>
          </div>
        </div>
        {h.askidaAyrinti && (
          <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/[0.06] px-3 py-2 text-[13px] text-rose-100">
            {tarihSaat(h.askidaAyrinti.zaman)} tarihinde {h.askidaAyrinti.admin} askıya aldı. Neden: {h.askidaAyrinti.neden}
          </div>
        )}
        <div className="mt-4 border-t border-[color:var(--ad-kenar)] pt-4">
          <KullaniciAksiyonlar h={h} degisti={yenile} silindi={() => router.replace("/admin/kullanicilar")} />
        </div>
      </Kart>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Bakiye" deger={v.defter ? sayi(v.defter.bakiye) : "Yok"} ikon={Coins} alt={v.defter ? `aylık ${sayi(v.defter.planKredi)}, ek ${sayi(v.defter.ekKredi)}` : "defter açılmamış"} />
        <MetrikKart etiket="Harcanan kredi" deger={sayi(v.kredi.harcanan)} ikon={Wallet} alt={`${sayi(v.kredi.uretim)} üretim, ${sayi(v.kredi.iade)} iade`} />
        <MetrikKart etiket="Ödeme" deger={sayi(v.odeme.siparisler.filter((s) => s.durum === "odendi").length)} ikon={Wallet} alt={`${sayi(v.odeme.siparisler.length)} sipariş`} />
        <MetrikKart etiket="Build projesi" deger={v.build ? sayi(v.build.sayi) : "Bilinmiyor"} ikon={Boxes} alt={`${sayi(v.apiAnahtar)} API anahtarı bağlı`} />
      </div>

      <div className="mb-4">
        <Sekmeler aktif={sekme} sec={setSekme} sekmeler={[
          { id: "ozet", ad: "Özet" }, { id: "kredi", ad: "Kredi defteri", sayi: v.kredi.hareketSayisi }, { id: "odeme", ad: "Ödemeler", sayi: v.odeme.siparisler.length },
          { id: "oturum", ad: "Oturumlar", sayi: v.oturumlar.length }, { id: "guvenlik", ad: "Güvenlik olayları", sayi: v.olaylar.length }, { id: "build", ad: "Build", sayi: v.build?.sayi },
          { id: "denetim", ad: "Yönetici kayıtları", sayi: v.denetim.length },
        ]} />
      </div>

      {sekme === "ozet" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart>
            <KartBaslik>Hesap</KartBaslik>
            <BilgiSatir etiket="Giriş yöntemi">{[h.sifreVar && "E-posta ve şifre", ...h.saglayicilar.map((s) => s[0].toLocaleUpperCase("tr") + s.slice(1))].filter(Boolean).join(", ") || "Yok"}</BilgiSatir>
            <BilgiSatir etiket="Şifre değişimi">{h.sifreGuncelleme ? tarih(h.sifreGuncelleme) : "Yok"}</BilgiSatir>
            <BilgiSatir etiket="İki adımlı doğrulama">{h.ikiAdim ? `Açık, ${tarih(h.ikiAdimAcilis)}` : "Kapalı"}</BilgiSatir>
            <BilgiSatir etiket="Yeni girişte e-posta">{h.yeniGirisEposta ? "Açık" : "Kapalı"}</BilgiSatir>
            {h.bekleyenEposta && <BilgiSatir etiket="Bekleyen e-posta">{h.bekleyenEposta}</BilgiSatir>}
            {h.profil.davetEden && <BilgiSatir etiket="Davet eden">{h.profil.davetEden}</BilgiSatir>}
            {h.profil.konum && <BilgiSatir etiket="Konum">{h.profil.konum}</BilgiSatir>}
            <BilgiSatir etiket="Son güncelleme">{tarihSaat(h.guncelleme)}</BilgiSatir>
          </Kart>
          <Kart>
            <KartBaslik>Plan ve dönem</KartBaslik>
            {v.defter ? (
              <>
                <BilgiSatir etiket="Plan">{PLAN_AD[v.defter.plan] ?? v.defter.plan}{v.defter.ozelKota ? `, özel kota ${sayi(v.defter.ozelKota)}` : ""}</BilgiSatir>
                <BilgiSatir etiket="Dönem">{tarih(v.defter.donemBaslangic)} ile {tarih(v.defter.donemBitis)} arası</BilgiSatir>
                <BilgiSatir etiket="Dönem toplamı">{sayi(v.defter.donemToplam)} kredi</BilgiSatir>
                {v.defter.planBitis && <BilgiSatir etiket="Ödenmiş dönem sonu">{tarih(v.defter.planBitis)}{v.defter.planOtomatik ? ", otomatik yenilenir" : ""}</BilgiSatir>}
                {v.defter.planGecis && <BilgiSatir etiket="Planlanan geçiş">{tarih(v.defter.planGecis.zaman)} tarihinde {PLAN_AD[v.defter.planGecis.plan] ?? v.defter.planGecis.plan}</BilgiSatir>}
              </>
            ) : <p className={cn("text-sm", AD.metin3)}>Kredi defteri henüz açılmamış.</p>}
            <BilgiSatir etiket="Abonelik">{v.odeme.abonelik ? `${PLAN_AD[v.odeme.abonelik.plan] ?? v.odeme.abonelik.plan}, ${v.odeme.abonelik.durum}, ${v.odeme.abonelik.saglayici}, ${tarih(v.odeme.abonelik.donemBitis)} bitiş` : "Yok"}</BilgiSatir>
            <BilgiSatir etiket="Promosyon ve görev">{sayi(v.odeme.promolar)} promosyon, {sayi(v.odeme.gorevler)} görev ödülü</BilgiSatir>
            <BilgiSatir etiket="Oluşturduğu hediye kodu">{sayi(v.odeme.hediyeler.length)}</BilgiSatir>
          </Kart>
        </div>
      )}

      {sekme === "kredi" && (v.hareketler.length === 0 ? <Bos ikon={Coins} baslik="Kredi hareketi yok" /> : (
        <Tablo baslik={["Zaman", "Tür", "Açıklama", "Miktar", "Bakiye"]} sag={[3, 4]}>
          {v.hareketler.map((x) => (
            <tr key={x.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
              <td className={cn("whitespace-nowrap px-4 py-2.5 text-[13px]", AD.metin2)}>{tarihSaat(x.zaman)}</td>
              <td className="px-4 py-2.5"><Rozet ton={x.miktar > 0 ? "basari" : x.miktar < 0 ? "uyari" : "notr"}>{HAREKET_AD[x.tur] ?? x.tur}</Rozet></td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin)}><div className="max-w-md truncate" title={x.aciklama}>{x.aciklama}</div><div className={cn("text-[11px]", AD.metin3)}>{x.kaynak}</div></td>
              <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums" style={{ color: x.miktar > 0 ? "var(--ad-basari)" : x.miktar < 0 ? "var(--ad-metin)" : "var(--ad-metin-3)" }}>{x.miktar > 0 ? `artı ${sayi(x.miktar)}` : x.miktar < 0 ? `eksi ${sayi(-x.miktar)}` : "0"}</td>
              <td className={cn("px-4 py-2.5 text-right text-[13px] tabular-nums", AD.metin2)}>{sayi(x.bakiye)}</td>
            </tr>
          ))}
        </Tablo>
      ))}

      {sekme === "odeme" && (v.odeme.siparisler.length === 0 ? <Bos ikon={Wallet} baslik="Ödeme yok" ozet="Bu hesap henüz sipariş oluşturmamış." /> : (
        <Tablo baslik={["Sipariş", "Ürün", "Durum", "Tutar", "Sağlayıcı", "Tarih"]} sag={[3]}>
          {v.odeme.siparisler.map((s) => (
            <tr key={s.no} className="border-b border-[color:var(--ad-kenar)] last:border-0">
              <td className="px-4 py-2.5 font-mono text-[12px] text-[color:var(--ad-metin-2)]">{s.no}{s.makbuzNo && <div className={cn("font-sans text-[11px]", AD.metin3)}>{s.makbuzNo}</div>}</td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin)}>{s.ad}</td>
              <td className="px-4 py-2.5"><Rozet ton={s.durum === "odendi" ? "basari" : s.durum === "basarisiz" ? "tehlike" : s.durum === "iade" ? "mor" : "notr"}>{DURUM_AD[s.durum] ?? s.durum}</Rozet>{s.hata && <div className="mt-0.5 max-w-[200px] truncate text-[11px] text-rose-300" title={s.hata}>{s.hata}</div>}</td>
              <td className={cn("whitespace-nowrap px-4 py-2.5 text-right text-[13px] tabular-nums", AD.metin)}>{para(s.toplam, s.para)}{s.iade && <div className="text-[11px] text-violet-300">iade {para(s.iade.tutar, s.para)}</div>}</td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin2)}>{s.saglayici === "deneme" ? "Deneme" : s.saglayici}{s.mod === "test" && s.saglayici !== "deneme" ? ", test" : ""}{s.kart ? `, ${s.kart}` : ""}</td>
              <td className={cn("whitespace-nowrap px-4 py-2.5 text-[13px]", AD.metin2)}>{tarihSaat(s.odemeZamani ?? s.olusturma)}</td>
            </tr>
          ))}
        </Tablo>
      ))}

      {sekme === "oturum" && (v.oturumlar.length === 0 ? <Bos baslik="Açık oturum yok" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {v.oturumlar.map((o) => {
            const Ikon = CIHAZ[o.tur as keyof typeof CIHAZ] ?? Monitor;
            return (
              <Kart key={o.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <span className="ad-ikon h-9 w-9 shrink-0"><Ikon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1 text-[13px]">
                    <div className={cn("font-semibold", AD.metin)}>{o.tarayici}, {o.isletim}</div>
                    <div className={AD.metin3}>{o.yontem} · {o.ip}</div>
                    <div className={AD.metin3}>Açılış {tarihSaat(o.baslangic)} · son görülme {gorece(o.sonGorulme)}</div>
                  </div>
                </div>
              </Kart>
            );
          })}
        </div>
      ))}

      {sekme === "guvenlik" && (v.olaylar.length === 0 ? <Bos baslik="Güvenlik olayı yok" /> : (
        <Tablo baslik={["Zaman", "Olay", "Cihaz", "Ayrıntı"]}>
          {v.olaylar.map((o) => (
            <tr key={o.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
              <td className={cn("whitespace-nowrap px-4 py-2.5 text-[13px]", AD.metin2)}>{tarihSaat(o.zaman)}</td>
              <td className="px-4 py-2.5"><Rozet ton={o.tur === "giris-hatali" || o.tur === "kilit" ? "tehlike" : o.tur.startsWith("2fa") || o.tur === "sifre" || o.tur === "sifirla" ? "uyari" : "notr"}>{OLAY_AD[o.tur] ?? o.tur}</Rozet></td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin2)}>{o.cihaz}{o.ip ? ` · ${o.ip}` : ""}</td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin3)}>{o.ayrinti ?? ""}</td>
            </tr>
          ))}
        </Tablo>
      ))}

      {sekme === "build" && (!v.build ? <Bos ikon={Boxes} baslik="Build verisi okunamadı" /> : v.build.projeler.length === 0 ? <Bos ikon={Boxes} baslik="Build projesi yok" /> : (
        <Tablo baslik={["Proje", "Tür", "Yayın", "Güncelleme"]}>
          {v.build.projeler.map((p) => (
            <tr key={p.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin)}>{p.ad}<div className={cn("font-mono text-[11px]", AD.metin3)}>{p.id}</div></td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin2)}>{p.tur}</td>
              <td className="px-4 py-2.5">{p.yayinda ? <Rozet ton="basari">Yayında</Rozet> : <span className={cn("text-[12px]", AD.metin3)}>Taslak</span>}</td>
              <td className={cn("whitespace-nowrap px-4 py-2.5 text-[13px]", AD.metin2)}>{gorece(p.guncelleme)}</td>
            </tr>
          ))}
        </Tablo>
      ))}

      {sekme === "denetim" && (v.denetim.length === 0 ? <Bos ikon={ScrollText} baslik="Bu hesapta yönetici işlemi yok" /> : (
        <Tablo baslik={["Zaman", "Yönetici", "İşlem", "Ayrıntı"]}>
          {v.denetim.map((d) => (
            <tr key={d.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
              <td className={cn("whitespace-nowrap px-4 py-2.5 text-[13px]", AD.metin2)}>{tarihSaat(d.zaman)}</td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin2)}>{d.admin.email}</td>
              <td className="px-4 py-2.5"><span className={cn("text-[13px]", d.onem === "kritik" ? "text-rose-300" : d.onem === "uyari" ? "text-amber-300" : AD.metin)}>{d.eylem}</span></td>
              <td className={cn("px-4 py-2.5 text-[13px]", AD.metin3)}>{d.ayrinti ?? ""}</td>
            </tr>
          ))}
        </Tablo>
      ))}
      <p className={cn("mt-4 flex items-center gap-1.5 text-[12px]", AD.metin3)}><KeyRound className="h-3.5 w-3.5" /> Şifre özeti, iki adım sırrı ve oturum belirteçleri hiçbir zaman gösterilmez.</p>
    </RotaGuard>
  );
}

function Geri() {
  return <Link href="/admin/kullanicilar" className={cn("mb-4 inline-flex items-center gap-1.5 text-sm", AD.metin2, "hover:text-[color:var(--ad-metin)]")}><ArrowLeft className="h-4 w-4" /> Kullanıcılar</Link>;
}

function Tablo({ baslik, sag = [], children }: { baslik: string[]; sag?: number[]; children: React.ReactNode }) {
  return (
    <div className="ad-glass overflow-hidden !p-0">
      <div className="overflow-x-auto ad-ince-scroll">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-[color:var(--ad-kenar)]">{baslik.map((b, i) => <th key={b} className={cn("whitespace-nowrap px-4 py-3 text-left text-[12px] font-semibold", AD.metin3, sag.includes(i) && "text-right")}>{b}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
