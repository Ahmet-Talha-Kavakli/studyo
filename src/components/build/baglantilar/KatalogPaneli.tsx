"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, KeyRound, Loader2, LogIn, Plug, Search, ShieldCheck } from "lucide-react";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { ADAPTORLER } from "@/lib/build/baglantiAdaptorTanim";
import { BAGLANTI_KATALOGU, BAGLANTI_KATEGORI, katalogAdresi, type KatalogBaglanti } from "@/lib/build/baglantiKatalog";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AracTuru, ayYaz, Bolum, donusAdresi, HataKutusu, katalogLogo, Kopyala, oauthBaslat, Panel, pencereAc, Rozet, type BaglantiAcik, type McpArac } from "./ortak";

const KAYIT_AD = { dcr: "Otomatik istemci kaydı", cimd: "Yayınlanmış istemci kimliği", uygulama: "Kendi OAuth uygulaman gerekir" } as const;
const YONTEM_AD = { oauth: "Hesapla giriş", anahtar: "Anahtarla", yok: "Girişsiz" } as const;
const REST_YETKI = { bearer: "Authorization: Bearer belirteç", baslik: "başlıkta anahtar", sorgu: "sorgu parametresinde anahtar", temel: "HTTP Basic (kullanıcı adı ve şifre)", yok: "kimlik yok" } as const;
/** REST yolundaki servisin kimlik alanları (sunucudaki restKimlikAlanlari ile aynı kurallar). */
function restAlanlari(r: NonNullable<KatalogBaglanti["rest"]>) {
  const l: { id: string; ad: string; gizli?: boolean; ipucu?: string; istege?: boolean; secenekler?: { id: string; ad: string }[] }[] = [];
  if (r.yetki === "temel") l.push({ id: "kullanici", ad: "Kullanıcı adı" }, { id: "sifre", ad: "Şifre ya da API anahtarı", gizli: true });
  else if (r.yetki !== "yok") l.push({ id: "anahtar", ad: r.yetki === "bearer" ? "Erişim belirteci" : r.anahtarAd ?? "API anahtarı", gizli: true, ipucu: r.yetki === "bearer" ? "Authorization: Bearer başlığıyla gönderilir" : r.yetki === "baslik" ? `${r.anahtarAd} başlığıyla gönderilir` : `${r.anahtarAd} sorgu parametresiyle gönderilir` });
  for (const e of r.ekAlanlar ?? []) if (!e.deger) l.push({ id: `ek.${e.ad}`, ad: e.ad, gizli: !!e.gizli, ipucu: e.aciklama });
  return l;
}

/** Kimlik alanları formu (adaptör ve istemci kimliği akışı). */
export function KimlikAlanlari({ tanimlar, degerler, set, duzenle }: { tanimlar: { id: string; ad: string; gizli?: boolean; ipucu?: string; ornek?: string; secenekler?: { id: string; ad: string }[]; varsayilan?: string; istege?: boolean }[]; degerler: Record<string, string>; set: (d: Record<string, string>) => void; duzenle?: { id: string; deger: string }[] }) {
  return (
    <div className="space-y-3 p-4">
      {tanimlar.map((a) => {
        const eski = duzenle?.find((x) => x.id === a.id)?.deger;
        return (
          <label key={a.id} className="block space-y-1.5">
            <span className="flex items-center gap-2 text-[12.5px] text-white/70">{a.ad}{a.istege && <span className="text-white/40">isteğe bağlı</span>}{a.gizli && <KeyRound className="h-3 w-3 text-white/40" />}</span>
            {a.secenekler ? (
              <Secici id={`alan-${a.id}`} deger={degerler[a.id] ?? eski ?? a.varsayilan ?? a.secenekler[0].id} set={(v) => set({ ...degerler, [a.id]: v })} l={a.secenekler} />
            ) : (
              <input value={degerler[a.id] ?? ""} onChange={(e) => set({ ...degerler, [a.id]: e.target.value })} type={a.gizli ? "password" : "text"} autoComplete="off" spellCheck={false}
                placeholder={eski ? `Kayıtlı: ${eski}${a.gizli ? " (değiştirmek için yaz)" : ""}` : a.ornek ?? (a.gizli ? "Yapıştır" : "")} className={cn(alanSinif, "h-10", a.gizli && "font-mono text-[13px]")} />
            )}
            {a.ipucu && <span className="block text-[11.5px] leading-snug text-white/45">{a.ipucu}</span>}
          </label>
        );
      })}
      <p className="flex items-start gap-1.5 text-[12px] text-white/40"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Değerler şifreli kasada saklanır; tarayıcıya ve yapay zekâya gönderilmez.</p>
    </div>
  );
}

/** Kendi OAuth istemcin (istemci kimliği + sır). */
export function IstemciAlanlari({ k, id, gizli, setId, setGizli, kayitli }: { k?: KatalogBaglanti; id: string; gizli: string; setId: (v: string) => void; setGizli: (v: string) => void; kayitli?: { id: string; gizli: boolean } }) {
  const [donus, setDonus] = useState("");
  useEffect(() => setDonus(donusAdresi()), []);
  return (
    <div className="space-y-2.5 p-4">
      {k?.istemciIpucu && <p className="text-[12.5px] leading-relaxed text-white/60">Nerede oluşturulur: {k.istemciIpucu}</p>}
      <div className="space-y-1"><span className="text-[12px] text-white/50">Geri dönüş adresi (uygulamaya ekle)</span>
        <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[12px] bg-black/30 px-3 py-2 text-[12px] text-white/75 ring-1 ring-inset ring-white/[0.06]">{donus}</code><Kopyala metin={donus} etiket="Adresi kopyala" /></div>
      </div>
      <input value={id} onChange={(e) => setId(e.target.value)} autoComplete="off" spellCheck={false} placeholder={kayitli ? `Kayıtlı: ${kayitli.id}` : "İstemci kimliği (client ID)"} className={cn(alanSinif, "h-10 font-mono text-[13px]")} />
      <input value={gizli} onChange={(e) => setGizli(e.target.value)} type="password" autoComplete="off" placeholder={kayitli?.gizli ? "İstemci sırrı kayıtlı (değiştirmek için yaz)" : "İstemci sırrı (client secret, açık istemcide boş)"} className={cn(alanSinif, "h-10 font-mono text-[13px]")} />
    </div>
  );
}

/** Dizin ayrıntısı + bağlanma: yayıncı, giriş yöntemi, adres, araç listesi (okuma/yazma), belgeler; altta bağlan formu. */
export function KatalogPaneli({ k, bagli: bagli0, kapat, bitti, ac, degistir }: { k: KatalogBaglanti; bagli?: BaglantiAcik; kapat: () => void; bitti: (b: BaglantiAcik) => void; ac: (id: string) => void; degistir?: (k: KatalogBaglanti) => void }) {
  const [ekHesap, setEkHesap] = useState(false);
  const [etiket, setEtiket] = useState("");
  const bagli = ekHesap ? undefined : bagli0;
  const rest = k.yol === "rest" ? k.rest : undefined;
  const ilgili = BAGLANTI_KATALOGU.filter((x) => x.kategori === k.kategori && x.id !== k.id).sort((a, b) => (b.populerlik ?? (b.turkiye ? 1 : 0)) - (a.populerlik ?? (a.turkiye ? 1 : 0))).slice(0, 4);
  const [yontem, setYontem] = useState<"oauth" | "anahtar" | "yok">(k.yetki[0]);
  const [anahtar, setAnahtar] = useState("");
  const [sablon, setSablon] = useState<Record<string, string>>({});
  const [ozelAlan, setOzelAlan] = useState<Record<string, boolean>>({});
  const [alanlar, setAlanlar] = useState<Record<string, string>>({});
  const [kendi, setKendi] = useState(k.oauthKayit === "uygulama");
  const [istId, setIstId] = useState("");
  const [istGizli, setIstGizli] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [onizleme, setOnizleme] = useState<{ araclar: McpArac[] | null; kaynak: string } | null>(null);
  const [ara, setAra] = useState("");
  useEffect(() => { api<{ araclar: McpArac[] | null; kaynak: string }>(`/api/build/baglantilar/katalog/${k.id}`).then(setOnizleme).catch(() => setOnizleme({ araclar: null, kaynak: "giris" })); }, [k.id]);
  const tanimlar = k.adaptor ? ADAPTORLER[k.adaptor].alanlar : rest ? restAlanlari(rest) : k.kimlikAlanlari ?? [];
  const sablonAlanlari = (k.alanlar ?? []).filter((a) => !a.yalniz || a.yalniz === yontem);
  const araclar = bagli?.araclar.length ? bagli.araclar : onizleme?.araclar ?? null;
  const gorunen = useMemo(() => (araclar ?? []).filter((a) => !ara.trim() || `${a.name} ${a.title ?? ""} ${a.description ?? ""}`.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr"))), [araclar, ara]);
  const okumaSayi = (araclar ?? []).filter((a) => a.annotations?.readOnlyHint).length;
  let adres = rest ? rest.taban : katalogAdresi(k, yontem) || k.ozelAdres || "";
  for (const a of k.alanlar ?? []) { const v = sablon[a.id] ?? ""; const s = a.secenekler?.find((x) => x.id === (v || a.secenekler![0].id)); adres = adres.split(`{${a.id}}`).join(s ? s.deger : v.trim() || `{${a.ad.toLocaleLowerCase("tr")}}`); }

  const baglan = async () => {
    setGidiyor(true); setHata("");
    const w = yontem === "oauth" ? pencereAc() : null;
    try {
      const v = await api<{ baglanti: BaglantiAcik }>("/api/build/baglantilar", { govde: {
        katalog: k.id, yetki: yontem, anahtar: yontem === "anahtar" && !tanimlar.length ? anahtar : undefined, sablon, alanlar: tanimlar.length ? alanlar : undefined, etiket: etiket.trim() || undefined,
        istemci: yontem === "oauth" && kendi && istId.trim() ? { id: istId.trim(), gizli: istGizli.trim() || undefined } : undefined,
      } });
      if (yontem === "oauth") {
        const o = await oauthBaslat(v.baglanti.id, w);
        const son = await api<{ baglanti: BaglantiAcik }>(`/api/build/baglantilar/${v.baglanti.id}`);
        bitti(son.baglanti);
        if (!o.ok) { setHata(o.hata ?? "Giriş tamamlanmadı. Pencere kapandıysa bağlantının ayrıntısından yeniden dene."); if (o.istemciGerekli) setKendi(true); setGidiyor(false); return; }
        ac(son.baglanti.id); return;
      }
      bitti(v.baglanti);
      if (v.baglanti.durum === "etkin") ac(v.baglanti.id); else { setHata(v.baglanti.hata ?? "Bağlantı denenemedi."); setGidiyor(false); }
    } catch (e) { w?.close(); setHata(e instanceof ApiHatasi ? e.message : "Bağlanamadı."); setGidiyor(false); }
  };
  const alanTamam = (!ekHesap || etiket.trim().length > 0) && sablonAlanlari.every((a) => (a.secenekler && !ozelAlan[a.id]) || (sablon[a.id] ?? "").trim().length > 1) && tanimlar.every((a) => a.istege || a.secenekler || (alanlar[a.id] ?? "").trim().length > 0);
  const hazir = alanTamam && (yontem !== "anahtar" || tanimlar.length > 0 || anahtar.trim().length > 6) && (yontem !== "oauth" || !kendi || istId.trim().length > 3 || (!k.adaptor && k.oauthKayit !== "uygulama"));
  const D = [
    { ad: "Yayıncı", deger: k.yapanUrl ? <a href={k.yapanUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-white hover:underline">{k.adaptor ? `Vayra adaptörü, ${k.ad} resmî API'si` : k.yapan}<ExternalLink className="h-3 w-3 text-white/40" /></a> : k.yapan },
    { ad: "Kategori", deger: BAGLANTI_KATEGORI[k.kategori] },
    { ad: "Giriş", deger: k.yetki.map((y) => YONTEM_AD[y]).join(", ") },
    ...(k.oauthKayit && k.yetki.includes("oauth") ? [{ ad: "OAuth istemcisi", deger: KAYIT_AD[k.oauthKayit] }] : []),
    ...(k.yayin ? [{ ad: k.adaptor || rest ? "Eklenme" : "Yayın", deger: ayYaz(k.yayin) }] : []),
    ...(rest ? [{ ad: "Bağlantı yolu", deger: `REST API (resmî MCP sunucusu yok) · ${REST_YETKI[rest.yetki]}` }] : []),
  ];
  return (
    <Panel baslik={k.ad} alt={`${k.yapan} · ${BAGLANTI_KATEGORI[k.kategori]}`} logo={katalogLogo(k, undefined, 40)} kapat={kapat}
      alt2={<>
        <a href={k.belge} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/60 hover:text-white"><BookOpen className="h-4 w-4" />Belgeler</a>
        <span className="flex-1" />
        {bagli ? <><button type="button" onClick={() => setEkHesap(true)} className="inline-flex h-11 items-center rounded-full px-3 text-[13px] text-white/65 hover:text-white">Başka hesap ekle</button><button type="button" onClick={() => ac(bagli.id)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black">Bağlantıyı aç</button></>
          : <button type="button" onClick={baglan} disabled={!hazir || gidiyor} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : yontem === "oauth" ? <LogIn className="h-4 w-4" /> : <Plug className="h-4 w-4" />}{yontem === "oauth" ? `${k.ad} ile giriş yap` : "Bağlan"}</button>}
      </>}>
      <p className="text-[14px] leading-relaxed text-white/75">{k.aciklama}</p>
      <div className="flex flex-wrap gap-1.5">
        {k.resmi && <Rozet vurgu>Resmî</Rozet>}{k.adaptor && <Rozet vurgu>Vayra adaptörü</Rozet>}{k.turkiye && <Rozet>Türkiye</Rozet>}{k.etkilesimli && <Rozet>Etkileşimli</Rozet>}
        {k.yetki.map((y) => <Rozet key={y}>{YONTEM_AD[y]}</Rozet>)}
      </div>
      {rest && <HataKutusu tur="bilgi">{k.ad} resmî bir MCP sunucusu yayımlamıyor. Vayra servisin resmî REST API'sine bağlanır{rest.openapi ? " ve araçları servisin yayımladığı OpenAPI belgesinden üretir" : rest.islemler?.length ? ` ve belgesindeki ${rest.islemler.length} uç noktayı araç olarak kurar; diğer uç noktaları bağlandıktan sonra ekleyebilirsin` : "; uç noktaları belgesinden bağlandıktan sonra eklersin"}. Anahtar kasada şifreli durur.</HataKutusu>}
      {k.adaptor && <HataKutusu tur="bilgi">Bu servisin resmî uzak MCP sunucusu yok. Araçlar Vayra sunucusunda çalışır ve {k.ad} resmî API'sini senin anahtarlarınla çağırır; anahtarlar yalnız bu çağrılarda kullanılır. Yazma araçları varsayılan olarak onay ister.</HataKutusu>}
      {k.etkilesimli && <p className="text-[12px] leading-relaxed text-white/45">Etkileşimli: bu servisin araç sonuçları Vayra sohbetinde, ajan denemesinde ve yayındaki ajan sayfasında canlı panel olarak açılır.</p>}

      <Bolum baslik="Bilgiler">
        <dl className="divide-y divide-white/[0.05]">
          {D.map((x) => <div key={x.ad} className="flex items-center gap-3 px-4 py-2.5"><dt className="w-[130px] shrink-0 text-[12.5px] text-white/50">{x.ad}</dt><dd className="min-w-0 flex-1 text-[13px] text-white/85">{x.deger}</dd></div>)}
          {!k.adaptor && <div className="flex items-center gap-3 px-4 py-2.5"><dt className="w-[130px] shrink-0 text-[12.5px] text-white/50">{rest ? "API adresi" : "Bağlantı adresi"}</dt><dd className="flex min-w-0 flex-1 items-center gap-2"><code className="min-w-0 flex-1 truncate text-[12.5px] text-white/80">{adres}</code><Kopyala metin={adres} etiket="Adresi kopyala" /></dd></div>}
        </dl>
      </Bolum>

      <Bolum baslik={araclar ? `Araçlar (${araclar.length})` : "Araçlar"} alt={araclar ? `${okumaSayi} okuma, ${araclar.length - okumaSayi} yazma${onizleme?.kaynak === "sunucu" && !bagli?.araclar.length ? " · sunucudan canlı okundu" : ""}` : undefined}
        sag={araclar && araclar.length > 6 ? <label className="flex h-8 w-[170px] items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 text-white/45"><Search className="h-3.5 w-3.5" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Araç ara" className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none" /></label> : undefined}>
        {onizleme === null && !bagli ? <div className="h-16 animate-pulse" /> : araclar ? (
          <div className="max-h-[340px] divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">
            {gorunen.map((a) => (
              <div key={a.name} className="px-4 py-2.5">
                <span className="flex items-center gap-2"><span className="truncate text-[13px] font-medium text-white">{a.annotations?.title ?? a.title ?? a.name}</span><AracTuru a={a} /></span>
                {a.description && <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-white/45">{a.description}</span>}
              </div>
            ))}
            {!gorunen.length && <p className="px-4 py-3 text-[13px] text-white/50">Aramana uyan araç yok.</p>}
          </div>
        ) : <p className="px-4 py-3 text-[13px] leading-relaxed text-white/55">Bu sunucu araç listesini girişten sonra veriyor. Bağlanınca araçlar okuma ve yazma diye ayrılarak burada listelenir; her birine ayrı izin verirsin.</p>}
      </Bolum>

      {k.ornekler && k.ornekler.length > 0 && (
        <Bolum baslik="Neler isteyebilirsin">
          <div className="flex flex-wrap gap-1.5 p-4">{k.ornekler.map((o) => <span key={o} className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07]">{o}</span>)}</div>
        </Bolum>
      )}
      {!bagli && <>
        {ekHesap && (
          <Bolum baslik="Hesap etiketi" alt="Aynı servisin hesaplarını ayırt eder; araç adları da bu etiketle ayrılır">
            <div className="p-4"><input value={etiket} onChange={(e) => setEtiket(e.target.value)} maxLength={30} placeholder="ör. İş, Kişisel, Mağaza 2" className={cn(alanSinif, "h-10")} /></div>
          </Bolum>
        )}
        {k.yetki.length > 1 && (
          <Bolum baslik="Giriş yöntemi">
            <div className="p-4"><Secici id="baglan-yontem" deger={yontem} set={setYontem} l={k.yetki.map((y) => ({ id: y, ad: YONTEM_AD[y] }))} /></div>
          </Bolum>
        )}
        {sablonAlanlari.length > 0 && (
          <Bolum baslik="Adres" alt="Bağlanılacak sunucu senin hesabına ya da bölgene göre değişir">
            <div className="space-y-3 p-4">
              {sablonAlanlari.map((a) => (
                <label key={a.id} className="block space-y-1.5">
                  <span className="text-[12.5px] text-white/70">{a.ad}</span>
                  {a.secenekler ? (a.secenekler.length > 3
                    ? <>
                      <AcilirSecim deger={ozelAlan[a.id] ? "__ozel" : sablon[a.id] ?? a.secenekler[0].id} set={(v) => { if (v === "__ozel") { setOzelAlan({ ...ozelAlan, [a.id]: true }); setSablon({ ...sablon, [a.id]: "" }); } else { setOzelAlan({ ...ozelAlan, [a.id]: false }); setSablon({ ...sablon, [a.id]: v }); } }}
                        l={[...a.secenekler.map((x) => ({ id: x.id, ad: x.ad, alt: x.deger })), ...(a.ozelDeger ? [{ id: "__ozel", ad: "Özel", alt: "Değeri kendin yaz" }] : [])]} />
                      {ozelAlan[a.id] && <input value={sablon[a.id] ?? ""} onChange={(e) => setSablon({ ...sablon, [a.id]: e.target.value })} placeholder="ör. eu3" spellCheck={false} className={cn(alanSinif, "mt-2 h-10")} />}
                    </>
                    : <Secici id={`sablon-${a.id}`} deger={sablon[a.id] ?? a.secenekler[0].id} set={(v) => setSablon({ ...sablon, [a.id]: v })} l={a.secenekler.map((x) => ({ id: x.id, ad: x.ad }))} />)
                    : <input value={sablon[a.id] ?? ""} onChange={(e) => setSablon({ ...sablon, [a.id]: e.target.value })} placeholder={a.ornek} spellCheck={false} className={cn(alanSinif, "h-10")} />}
                  {a.ipucu && <span className="block text-[11.5px] text-white/45">{a.ipucu}</span>}
                </label>
              ))}
            </div>
          </Bolum>
        )}
        {(tanimlar.length > 0 && yontem !== "yok") && <Bolum baslik={k.adaptor ? `${k.ad} anahtarları` : "Uygulama kimliği"} alt={k.anahtarIpucu}><KimlikAlanlari tanimlar={tanimlar} degerler={alanlar} set={setAlanlar} /></Bolum>}
        {yontem === "anahtar" && !tanimlar.length && (
          <Bolum baslik="Erişim anahtarı" sag={<KeyRound className="h-3.5 w-3.5 text-white/45" />}>
            <div className="space-y-2 p-4">
              <input value={anahtar} onChange={(e) => setAnahtar(e.target.value)} type="password" autoComplete="off" placeholder="Anahtarı yapıştır" className={cn(alanSinif, "h-10 font-mono text-[13px]")} />
              {k.anahtarIpucu && <p className="text-[12.5px] leading-relaxed text-white/50">Nerede bulunur: {k.anahtarIpucu}</p>}
              <p className="flex items-start gap-1.5 text-[12px] text-white/40"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />Anahtar şifreli kasada saklanır; tarayıcıya ve yapay zekâya gönderilmez.</p>
            </div>
          </Bolum>
        )}
        {yontem === "oauth" && (
          <Bolum baslik="Hesapla giriş" alt={k.oauthKayit ? KAYIT_AD[k.oauthKayit] : undefined}
            sag={k.oauthKayit !== "uygulama" && !k.adaptor ? <label className="flex items-center gap-2 text-[12px] text-white/55"><span className="max-sm:hidden">Kendi istemcim</span><Anahtar acik={kendi} set={setKendi} etiket="Kendi OAuth istemcimi kullan" /></label> : undefined}>
            {!kendi && <p className="p-4 text-[13px] leading-relaxed text-white/60">{k.ad} kendi giriş sayfasını açar; izin verdiğin hesaba bağlanırız. Vayra istemci kimliğini sunucunun desteklediği yolla alır: önce yayınlanmış kimlik, olmazsa otomatik kayıt.</p>}
            {kendi && <IstemciAlanlari k={k} id={istId} gizli={istGizli} setId={setIstId} setGizli={setIstGizli} />}
          </Bolum>
        )}
        {yontem === "yok" && <HataKutusu tur="bilgi">Bu sunucu giriş istemiyor; bağlanınca araçlar hemen kullanılabilir.</HataKutusu>}
      </>}
      {hata && <HataKutusu>{hata}</HataKutusu>}
      {ilgili.length > 0 && degistir && (
        <Bolum baslik="İlgili servisler">
          <div className="grid gap-1 p-2 sm:grid-cols-2">
            {ilgili.map((x) => <button key={x.id} type="button" onClick={() => degistir(x)} className="flex min-w-0 items-center gap-2.5 rounded-[12px] px-2 py-2 text-left hover:bg-white/[0.04]">{katalogLogo(x, undefined, 32)}<span className="min-w-0"><span className="block truncate text-[13px] text-white">{x.ad}</span><span className="block truncate text-[11.5px] text-white/45">{x.aciklama}</span></span></button>)}
          </div>
        </Bolum>
      )}
    </Panel>
  );
}
