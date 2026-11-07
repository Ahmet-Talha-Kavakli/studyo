"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Lock, LogIn, Loader2, Play, RefreshCw, Search, Trash2, Download } from "lucide-react";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { ADAPTORLER } from "@/lib/build/baglantiAdaptorTanim";
import { katalogBul } from "@/lib/build/baglantiKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { IstemciAlanlari, KimlikAlanlari } from "./KatalogPaneli";
import { AracDene } from "./DenePaneli";
import { Kullanim } from "./Kullanim";
import { Inceleme, RestAyari, SaglikSeridi, Sinirlar, UcHesaplar } from "./Yonetim";
import { AracTuru, Bolum, DURUM, HataKutusu, katalogLogo, oauthBaslat, Panel, pencereAc, Rozet, Satir, sureYaz, type BaglantiAcik, type Izin, type McpArac } from "./ortak";

const IZIN_L = (kilit: boolean) => [{ id: "kapali" as Izin, ad: "Kapalı" }, { id: "sor" as Izin, ad: "Sor", kapali: kilit }, { id: "her-zaman" as Izin, ad: "Açık", kapali: kilit }];
const okur = (a: McpArac) => !!a.annotations?.readOnlyHint;
const KAYNAK_AD = (k: string): string => k.startsWith("uc:") ? `Uç kullanıcı · ${KAYNAK_AD(k.slice(3))}` : k === "deneme" ? "Deneme" : k.startsWith("gecit:") ? `Ağ geçidi: ${k.slice(6)}` : (k.startsWith("ajan:") ? `Ajan: ${k.slice(5)}` : k.startsWith("sistem:") ? `Sistem: ${k.slice(7)}` : k.startsWith("ziyaretci") ? "Ziyaretçi" : k === "sohbet" ? "Sohbet" : k);

/** İzin ön ayarı: araçların izinlerinden hangi kalıba uyduğu. */
function onAyar(b: BaglantiAcik): "onerilen" | "salt" | "sor" | "ozel" {
  const iz = (a: McpArac) => b.izinler[a.name] ?? (okur(a) ? "her-zaman" : "sor");
  const ok = b.araclar.filter(okur), yz = b.araclar.filter((a) => !okur(a));
  const hepsi = (l: McpArac[], v: Izin) => l.every((a) => iz(a) === v);
  if (hepsi(ok, "her-zaman") && hepsi(yz, "sor")) return "onerilen";
  if (hepsi(ok, "her-zaman") && hepsi(yz, "kapali")) return "salt";
  if (hepsi(b.araclar, "sor")) return "sor";
  return "ozel";
}
const grupIzni = (b: BaglantiAcik, l: McpArac[]): Izin | "karisik" => { const s = new Set(l.map((a) => b.izinler[a.name] ?? (okur(a) ? "her-zaman" : "sor"))); return s.size === 1 ? [...s][0] : "karisik"; };

type AjanSatir = { id: string; ad: string; simge?: string; yayinda: boolean; kullaniyor: boolean };

/** Bağlantı ayrıntısı: Genel (sağlık, kimlik, kullanım yeri, yükleme), Araçlar (izinler), Kayıtlar (çağrı geçmişi). */
export function AyrintiPaneli({ b, setB, kapat, silindi }: { b: BaglantiAcik; setB: (b: BaglantiAcik) => void; kapat: () => void; silindi: () => void }) {
  const [sekme, setSekme] = useState<"genel" | "araclar" | "dene" | "kullanim" | "kayitlar">("genel");
  const [denenecek, setDenenecek] = useState<string | undefined>();
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [silOnay, setSilOnay] = useState(false);
  const k = katalogBul(b.katalogId);
  const D = DURUM[b.durum];
  const yama = async (g: Record<string, unknown>, etiket = "yama") => {
    setGidiyor(etiket); setHata("");
    try { const v = await api<{ baglanti: BaglantiAcik }>(`/api/build/baglantilar/${b.id}`, { method: "PATCH", govde: g }); setB(v.baglanti); return true; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); return false; }
    finally { setGidiyor(null); }
  };
  const dene = async (yenile = false) => {
    setGidiyor(yenile ? "yenile" : "dene"); setHata(""); setBilgi("");
    try { const v = await api<{ baglanti: BaglantiAcik; yenilendi?: boolean; neden?: string }>(`/api/build/baglantilar/${b.id}/test`, { govde: { yenile } }); setB(v.baglanti); if (yenile) setBilgi(v.yenilendi ? "Belirteç yenilendi ve bağlantı denendi." : v.neden ?? "Bağlantı denendi."); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Denenemedi."); } finally { setGidiyor(null); }
  };
  const giris = async () => { const w = pencereAc(); setGidiyor("giris"); setHata(""); const o = await oauthBaslat(b.id, w); if (o.hata) setHata(o.hata); const v = await api<{ baglanti: BaglantiAcik }>(`/api/build/baglantilar/${b.id}`); setB(v.baglanti); setGidiyor(null); };
  const oauthVar = b.yetki.tur === "oauth" || (k?.yetki.includes("oauth") ?? false);
  const host = (() => { try { return b.url.startsWith("vayra://") ? "Vayra adaptörü" : (b.rest ? "REST · " : "") + new URL(b.url).host; } catch { return b.url; } })();
  const inceleSayi = b.incelenecek?.length ?? 0;

  return (
    <Panel baslik={b.ad} alt={<span className="flex items-center gap-2"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", D.sinif)}>{D.ad}</span><span className="truncate">{host}{b.sunucu?.version ? ` · sürüm ${b.sunucu.version}` : ""}</span></span>} logo={katalogLogo(k, b, 40)} kapat={kapat}
      ust={<div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]"><Secici id="baglanti-sekme" deger={sekme} set={setSekme} l={[{ id: "genel", ad: "Genel" }, { id: "araclar", ad: `Araçlar ${b.araclar.length}${inceleSayi ? ` · ${inceleSayi} yeni` : ""}` }, { id: "dene", ad: "Dene" }, { id: "kullanim", ad: "Kullanım" }, { id: "kayitlar", ad: `Kayıtlar ${b.kayit.length}` }]} /></div>}
      alt2={<>
        <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/baglantilar/${b.id}`, { method: "DELETE" }).catch(() => {}); silindi(); }} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[13px]", silOnay ? "bg-rose-500/[0.14] font-semibold text-rose-200" : "text-rose-300/90 hover:bg-rose-500/[0.08]")}><Trash2 className="h-4 w-4" />{silOnay ? "Silmek için tekrar tıkla" : "Kaldır"}</button>
        <span className="flex-1" />
        {oauthVar && b.durum !== "etkin" && <button type="button" onClick={giris} disabled={!!gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-60">{gidiyor === "giris" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{b.yetki.oauthHazir ? "Yeniden giriş yap" : "Giriş yap"}</button>}
        <button type="button" onClick={() => dene(true)} disabled={!!gidiyor} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold disabled:opacity-60", oauthVar && b.durum !== "etkin" ? "bg-white/[0.08] text-white hover:bg-white/[0.13]" : "bg-white text-black")}>{gidiyor === "yenile" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Bağlantıyı yenile</button>
      </>}>
      {b.hata && b.durum !== "etkin" && <HataKutusu tur="uyari"><span className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{b.hata}</span></HataKutusu>}
      {hata && <HataKutusu>{hata}</HataKutusu>}
      {bilgi && <HataKutusu tur="bilgi">{bilgi}</HataKutusu>}
      {sekme === "genel" && <Genel b={b} k={k} yama={yama} gidiyor={gidiyor} dene={() => dene(false)} />}
      {sekme === "araclar" && <><Inceleme b={b} yama={yama} gidiyor={gidiyor} /><Araclar b={b} yama={yama} dene={(a) => { setDenenecek(a); setSekme("dene"); }} /></>}
      {sekme === "dene" && <AracDene key={denenecek} b={b} setB={setB} ilk={denenecek} />}
      {sekme === "kullanim" && <Kullanim b={b} dene={() => setSekme("dene")} />}
      {sekme === "kayitlar" && <Kayitlar b={b} />}
    </Panel>
  );
}

function Genel({ b, k, yama, gidiyor, dene }: { b: BaglantiAcik; k: ReturnType<typeof katalogBul>; yama: (g: Record<string, unknown>, e?: string) => Promise<boolean>; gidiyor: string | null; dene: () => void }) {
  const [anahtar, setAnahtar] = useState("");
  const [alanlar, setAlanlar] = useState<Record<string, string>>({});
  const [istId, setIstId] = useState("");
  const [istGizli, setIstGizli] = useState("");
  const [istAcik, setIstAcik] = useState(false);
  const [ajanlar, setAjanlar] = useState<AjanSatir[] | null>(null);
  useEffect(() => { api<{ ajanlar: AjanSatir[] }>(`/api/build/baglantilar/${b.id}/ajanlar`).then((v) => setAjanlar(v.ajanlar)).catch(() => setAjanlar([])); }, [b.id]);
  const tanimlar = k?.adaptor ? ADAPTORLER[k.adaptor].alanlar : k?.kimlikAlanlari ?? [];
  const acikSayi = b.araclar.filter((a) => (b.izinler[a.name] ?? "sor") !== "kapali").length;
  const ajanDegis = async (a: AjanSatir, v: boolean) => {
    setAjanlar((l) => l?.map((x) => (x.id === a.id ? { ...x, kullaniyor: v } : x)) ?? l);
    await api(`/api/build/baglantilar/${b.id}/ajanlar`, { govde: { ajanId: a.id, acik: v } }).catch(() => setAjanlar((l) => l?.map((x) => (x.id === a.id ? { ...x, kullaniyor: !v } : x)) ?? l));
  };
  const dl = [
    { ad: "Durum", deger: <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-medium", DURUM[b.durum].sinif)}>{DURUM[b.durum].ad}</span> },
    { ad: "Son denetim", deger: b.sonKontrol ? gorece(b.sonKontrol) : "Henüz denenmedi" },
    ...(b.sonBasari ? [{ ad: "Son başarılı", deger: gorece(b.sonBasari) }] : []),
    ...(b.yetki.tur === "oauth" || b.yetki.yenilenebilir ? [{ ad: "Belirteç yenileme", deger: b.sonYenileme ? `${gorece(b.sonYenileme)}${b.yetki.yenilenebilir ? "" : " · yenileme belirteci yok"}` : "Henüz yenilenmedi" }] : []),
    ...(b.yetki.tokenBitis ? [{ ad: "Belirteç süresi", deger: b.yetki.tokenBitis > Date.now() ? `${sureYaz(b.yetki.tokenBitis)} doluyor${b.yetki.yenilenebilir ? ", kendiliğinden yenilenir" : ""}` : `doldu (${sureYaz(b.yetki.tokenBitis)})` }] : []),
    { ad: "Giriş", deger: b.yetki.tur === "oauth" ? `Hesapla giriş${b.yetki.kayit === "istemci" ? " · kendi istemcin" : b.yetki.kayit === "cimd" ? " · yayınlanmış kimlik" : b.yetki.kayit === "dcr" ? " · otomatik kayıt" : ""}` : b.yetki.tur === "anahtar" ? (tanimlar.length ? "Anahtarlar" : `Anahtar ${b.yetki.maske ?? ""}`) : "Girişsiz" },
  ];
  return (
    <>
      <Bolum baslik="Sağlık" sag={<button type="button" onClick={dene} disabled={!!gidiyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12] disabled:opacity-50">{gidiyor === "dene" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Dene</button>}>
        <SaglikSeridi b={b} />
        <dl className="divide-y divide-white/[0.05] border-t border-white/[0.05]">{dl.map((x) => <div key={x.ad} className="flex items-center gap-3 px-4 py-2.5"><dt className="w-[140px] shrink-0 text-[12.5px] text-white/50">{x.ad}</dt><dd className="min-w-0 flex-1 text-[13px] text-white/85">{x.deger}</dd></div>)}</dl>
      </Bolum>

      {b.rest && <RestAyari b={b} yama={yama} gidiyor={gidiyor} />}
      <Bolum baslik="Kullanım yeri" alt="Bu bağlantının araçlarını kimler kullanabilir">
        <div className="divide-y divide-white/[0.05]">
          <Satir ad="Genel sohbet" alt="Vayra sohbetinde araçları açık olur"><Anahtar acik={b.sohbette} set={(v) => yama({ sohbette: v })} etiket="Genel sohbette kullan" /></Satir>
          <Satir ad="Sistemler" alt="Otomasyon adımları bu bağlantıyı çağırabilir"><Anahtar acik={b.kullanim?.sistemler ?? true} set={(v) => yama({ kullanim: { sistemler: v } })} etiket="Sistemlerde kullan" /></Satir>
          <Satir ad="Yayındaki ajanların ziyaretçileri" alt="Ziyaretçiye yalnız izni Açık olan araçlar sunulur"><Anahtar acik={b.kullanim?.ziyaretci ?? true} set={(v) => yama({ kullanim: { ziyaretci: v } })} etiket="Ziyaretçilerde kullan" /></Satir>
          {ajanlar === null ? <div className="h-12 animate-pulse" /> : ajanlar.length ? ajanlar.map((a) => (
            <Satir key={a.id} ad={<span className="flex items-center gap-2">{a.simge && /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.simge} alt="" className="h-6 w-6 rounded-[7px] object-cover" />}<span className="truncate">{a.ad}</span>{a.yayinda && <Rozet>Yayında</Rozet>}</span>} alt={a.yayinda && a.kullaniyor ? "Yayındaki sürüm bir sonraki yayında güncellenir" : "Ajan"}>
              <Anahtar acik={a.kullaniyor} set={(v) => ajanDegis(a, v)} etiket={`${a.ad} ajanında kullan`} />
            </Satir>
          )) : <p className="px-4 py-3 text-[12.5px] text-white/45">Henüz ajanın yok; ajan kurunca buradan bu bağlantıyı açabilirsin.</p>}
        </div>
      </Bolum>

      <Bolum baslik="Araç yükleme" alt={`${acikSayi} açık araç`}>
        <div className="space-y-2 p-4">
          <Secici id="arac-yukleme" deger={b.aracYukleme ?? "otomatik"} set={(v) => yama({ aracYukleme: v })} l={[{ id: "otomatik", ad: "Otomatik" }, { id: "hepsi", ad: "Hep yüklü" }, { id: "istekle", ad: "Gerektiğinde" }]} />
          <p className="text-[12px] leading-relaxed text-white/45">{(b.aracYukleme ?? "otomatik") === "otomatik" ? "30 aracı aşınca araçlar gerektiğinde yüklenir; az araçta hepsi baştan sunulur." : b.aracYukleme === "hepsi" ? "Bütün açık araçlar her konuşmada modele sunulur." : "Model önce bu servisin araçları arasında arar, yalnız gerekeni çalıştırır; çok bağlantıda bağlamı korur. Onay isteyen araçlar yine onay ister."}</p>
        </div>
      </Bolum>

      <Sinirlar b={b} yama={yama} gidiyor={gidiyor} />
      <UcHesaplar b={b} yama={yama} />
      <Bolum baslik="Hesap etiketi" alt="Aynı servise birden çok hesap bağladıysan ayırt etmek için (ör. İş, Kişisel)">
        <form className="flex gap-2 p-4" onSubmit={(e) => { e.preventDefault(); const v = String(new FormData(e.currentTarget).get("etiket") ?? ""); yama({ etiket: v }); }}>
          <input name="etiket" defaultValue={b.etiket ?? ""} maxLength={30} placeholder="Etiket yok" className={cn(alanSinif, "h-9 text-[13px]")} />
          <button type="submit" className="h-9 shrink-0 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white">Kaydet</button>
        </form>
      </Bolum>
      <Bolum baslik="Güvenlik">
        <Satir ad="Salt okunur" alt={`${k?.saltOkunurUrl ? "Sunucunun salt okunur adresi kullanılır; " : ""}yalnız okuma araçları açık kalır`}><Anahtar acik={b.saltOkunur} set={(v) => yama({ saltOkunur: v }, "salt")} etiket="Salt okunur" /></Satir>
      </Bolum>

      {tanimlar.length > 0 && (
        <Bolum baslik={k?.adaptor ? "Anahtarlar" : "Uygulama kimliği"} alt="Boş bıraktığın gizli alanlar değişmez">
          <KimlikAlanlari tanimlar={tanimlar} degerler={alanlar} set={setAlanlar} duzenle={b.yetki.alanlar} />
          <div className="flex justify-end px-4 pb-4"><button type="button" disabled={!Object.values(alanlar).some((x) => x.trim()) || !!gidiyor} onClick={async () => { if (await yama({ alanlar }, "alan")) setAlanlar({}); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor === "alan" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet ve dene</button></div>
        </Bolum>
      )}
      {b.yetki.tur === "anahtar" && !tanimlar.length && (
        <Bolum baslik="Erişim anahtarı">
          <form className="flex items-center gap-2 p-4" onSubmit={async (e) => { e.preventDefault(); if (anahtar.trim() && (await yama({ anahtar }, "anahtar"))) setAnahtar(""); }}>
            <input value={anahtar} onChange={(e) => setAnahtar(e.target.value)} type="password" autoComplete="off" placeholder={`Kayıtlı ${b.yetki.maske ?? ""}; yenisini yapıştır`} className={cn(alanSinif, "h-9 flex-1 text-[13px]")} />
            <button type="submit" disabled={!anahtar.trim()} className="h-9 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white disabled:opacity-40">Değiştir</button>
          </form>
        </Bolum>
      )}
      {(b.yetki.tur === "oauth" || k?.yetki.includes("oauth")) && (
        <Bolum baslik="OAuth istemcisi" alt={b.yetki.istemci ? `Kendi istemcin: ${b.yetki.istemci.id}` : "Vayra'nın istemci kimliği"}
          sag={<button type="button" onClick={() => setIstAcik((x) => !x)} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12]">{b.yetki.istemci ? "Değiştir" : "Kendi istemcimi gir"}<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", istAcik && "rotate-180")} /></button>}>
          {istAcik && <>
            <IstemciAlanlari k={k} id={istId} gizli={istGizli} setId={setIstId} setGizli={setIstGizli} kayitli={b.yetki.istemci} />
            <div className="flex justify-end gap-2 px-4 pb-4">
              {b.yetki.istemci && <button type="button" onClick={async () => { if (await yama({ istemci: null }, "istemci")) setIstAcik(false); }} className="h-9 rounded-full px-3.5 text-[12.5px] text-white/60 hover:text-white">Kendi istemcimi kaldır</button>}
              <button type="button" disabled={istId.trim().length < 3 || !!gidiyor} onClick={async () => { if (await yama({ istemci: { id: istId, gizli: istGizli } }, "istemci")) { setIstAcik(false); setIstId(""); setIstGizli(""); } }} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">Kaydet</button>
            </div>
            <p className="px-4 pb-4 text-[12px] text-white/45">Kaydedince eski giriş düşer; yeni istemciyle yeniden giriş yaparsın.</p>
          </>}
        </Bolum>
      )}
    </>
  );
}

function Araclar({ b, yama, dene }: { b: BaglantiAcik; yama: (g: Record<string, unknown>, e?: string) => Promise<boolean>; dene: (arac: string) => void }) {
  const [ara, setAra] = useState("");
  const [ozelAcik, setOzelAcik] = useState(false);
  const on = onAyar(b);
  const okumalar = b.araclar.filter(okur), yazmalar = b.araclar.filter((a) => !okur(a));
  const secili = ozelAcik ? "ozel" : on;
  const uygula = (v: "onerilen" | "salt" | "sor" | "ozel") => {
    if (v === "ozel") { setOzelAcik(true); return; }
    setOzelAcik(false);
    yama({ topluIzin: v === "onerilen" ? { okuma: "her-zaman", yazma: "sor" } : v === "salt" ? { okuma: "her-zaman", yazma: "kapali" } : { okuma: "sor", yazma: "sor" } }, "toplu");
  };
  const l = useMemo(() => b.araclar.filter((a) => !ara.trim() || `${a.name} ${a.title ?? ""} ${a.description ?? ""}`.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr"))), [b.araclar, ara]);
  if (!b.araclar.length) return <Bolum baslik="Araçlar"><p className="px-4 py-3 text-[13px] text-white/50">{b.durum === "etkin" ? "Bu sunucu araç sunmuyor." : "Bağlantı kurulunca araçlar burada listelenir."}</p></Bolum>;
  const grup = (ad: string, alt: string, liste: McpArac[], anahtar: "okuma" | "yazma") => {
    if (!liste.length) return null;
    const g = grupIzni(b, liste);
    return (
      <Satir ad={`${ad} (${liste.length})`} alt={g === "karisik" ? `${alt} · araç araç farklı` : alt}>
        <Secici id={`grup-${anahtar}`} kucuk deger={g === "karisik" ? ("" as Izin) : g} set={(v) => yama({ topluIzin: { [anahtar]: v } }, "toplu")} l={IZIN_L(b.saltOkunur && anahtar === "yazma")} />
      </Satir>
    );
  };
  return (
    <>
      <Bolum baslik="İzinler" alt="Açık: sormadan çalışır · Sor: her seferinde onay ister · Kapalı: modele sunulmaz">
        <div className="space-y-2 p-4">
          <Secici id="izin-on-ayar" deger={secili} set={uygula} l={[{ id: "onerilen", ad: "Önerilen" }, { id: "salt", ad: "Yalnız okuma" }, { id: "sor", ad: "Hepsine sor" }, { id: "ozel", ad: "Özel" }]} />
          <p className="text-[12px] leading-relaxed text-white/45">{secili === "onerilen" ? "Okuma araçları açık, yazma araçları onay ister." : secili === "salt" ? "Okuma araçları açık, yazma araçları kapalı." : secili === "sor" ? "Her araç çağrısı onayına gelir." : "Aşağıda grup grup ya da araç araç seç."}</p>
        </div>
        <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
          {grup("Okuma araçları", "Veri okur, değiştirmez", okumalar, "okuma")}
          {grup("Yazma araçları", "Kayıt oluşturur, değiştirir ya da siler", yazmalar, "yazma")}
        </div>
      </Bolum>
      <Bolum baslik={`Araç araç (${b.araclar.length})`} sag={b.araclar.length > 6 ? <label className="flex h-8 w-[170px] items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 text-white/45"><Search className="h-3.5 w-3.5" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Araç ara" className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none" /></label> : undefined}>
        <div className="divide-y divide-white/[0.04]">
          {l.map((a) => {
            const kilit = b.saltOkunur && !okur(a);
            const v = kilit ? "kapali" : b.izinler[a.name] ?? (okur(a) ? "her-zaman" : "sor");
            return (
              <div key={a.name} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
                <span className="min-w-[180px] flex-1">
                  <span className="flex items-center gap-1.5"><span className="truncate text-[13px] font-medium text-white">{a.annotations?.title ?? a.title ?? a.name}</span><AracTuru a={a} />{b.sabitAlanlar?.[a.name] && <span title={`Sabit alanlar: ${Object.keys(b.sabitAlanlar[a.name]).join(", ")}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#55d6fd]/[0.1] px-1.5 py-px text-[10.5px] text-[#8be6ff]"><Lock className="h-2.5 w-2.5" />{Object.keys(b.sabitAlanlar[a.name]).length} sabit</span>}</span>
                  <span className="block truncate text-[11.5px] text-white/40">{a.description ?? a.name}</span>
                </span>
                <button type="button" onClick={() => dene(a.name)} aria-label={`${a.name} aracını dene`} title="Dene" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white"><Play className="h-3.5 w-3.5" /></button>
                <Secici id={`izin-${b.id}-${a.name}`} kucuk deger={v} set={(x) => yama({ izinler: { [a.name]: x } })} l={IZIN_L(kilit)} />
              </div>
            );
          })}
          {!l.length && <p className="px-4 py-3 text-[13px] text-white/50">Aramana uyan araç yok.</p>}
        </div>
      </Bolum>
    </>
  );
}

function Kayitlar({ b }: { b: BaglantiAcik }) {
  const [arac, setArac] = useState("");
  const [sonuc, setSonuc] = useState<"hepsi" | "basarili" | "hatali">("hepsi");
  const [tur, setTur] = useState<"hepsi" | "okuma" | "yazma">("hepsi");
  const [kaynak, setKaynak] = useState("");
  const [acik, setAcik] = useState<number | null>(null);
  const araclar = [...new Set(b.kayit.map((x) => x.arac))];
  const kaynaklar = [...new Set(b.kayit.map((x) => x.kaynak))];
  const l = b.kayit.filter((x) => (!arac || x.arac === arac) && (sonuc === "hepsi" || (sonuc === "basarili") === x.basarili) && (tur === "hepsi" || (tur === "yazma") === !!x.yazma) && (!kaynak || x.kaynak === kaynak));
  if (!b.kayit.length) return <Bolum baslik="Son çağrılar"><p className="px-4 py-4 text-[13px] leading-relaxed text-white/50">Henüz çağrı yok. Sohbette, ajanlarda ya da sistemlerde bu bağlantının bir aracı çalışınca girdisi ve sonucu burada görünür (gizli değerler ve kart numaraları maskelenir).</p></Bolum>;
  const basarili = b.kayit.filter((x) => x.basarili).length;
  return (
    <Bolum baslik={`Son çağrılar (${l.length})`} alt={`${b.kayit.length} kayıt · yüzde ${Math.round((basarili / b.kayit.length) * 100)} başarılı · ortalama ${Math.round(b.kayit.reduce((t, x) => t + x.sure, 0) / b.kayit.length)} ms`}>
      <div className="grid gap-2 border-b border-white/[0.06] p-3 sm:grid-cols-2">
        <AcilirSecim deger={arac} set={setArac} bos="Bütün araçlar" l={araclar.map((x) => ({ id: x, ad: x }))} />
        <AcilirSecim deger={kaynak} set={setKaynak} bos="Bütün kaynaklar" l={kaynaklar.map((x) => ({ id: x, ad: KAYNAK_AD(x) }))} />
        <Secici id="kayit-sonuc" kucuk deger={sonuc} set={setSonuc} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "basarili", ad: "Başarılı" }, { id: "hatali", ad: "Hatalı" }]} />
        <Secici id="kayit-tur" kucuk deger={tur} set={setTur} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "okuma", ad: "Okuma" }, { id: "yazma", ad: "Yazma" }]} />
        <button type="button" disabled={!l.length} onClick={() => {
          const h = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
          const satir = [["zaman", "arac", "tur", "kaynak", "sonuc", "sure_ms", "girdi", "cikti"].join(","), ...l.map((x) => [new Date(x.zaman).toISOString(), x.arac, x.yazma === undefined ? "" : x.yazma ? "yazma" : "okuma", KAYNAK_AD(x.kaynak), x.basarili ? "basarili" : "hata", x.sure, x.ozet, x.cikti ?? ""].map(h).join(","))];
          const u = URL.createObjectURL(new Blob(["﻿" + satir.join("\r\n")], { type: "text/csv;charset=utf-8" }));
          const a = document.createElement("a"); a.href = u; a.download = `${b.ad.replace(/[^\p{L}\p{N}]+/gu, "-")}-cagrilar.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 2000);
        }} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white/80 hover:bg-white/[0.12] disabled:opacity-40 sm:col-span-2 sm:justify-self-end"><Download className="h-3.5 w-3.5" />CSV olarak indir</button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {l.slice(0, 60).map((x) => { const i = b.kayit.indexOf(x); return (
          <div key={`${x.zaman}-${i}`}>
            <button type="button" onClick={() => setAcik(acik === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.02]">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", x.basarili ? "bg-[#55d6fd]" : "bg-rose-400")} />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-[12.5px] text-white/85">{x.arac}</span>{x.yazma !== undefined && <span className={cn("rounded-full px-1.5 py-px text-[10px]", x.yazma ? "bg-amber-400/[0.1] text-amber-200/90" : "bg-white/[0.06] text-white/50")}>{x.yazma ? "Yazma" : "Okuma"}</span>}</span><span className="block truncate text-[11px] text-white/35">{x.ozet}</span></span>
              <span className="shrink-0 text-right text-[11px] leading-tight text-white/40"><span className="block">{KAYNAK_AD(x.kaynak)}</span><span className="block">{x.sure} ms · {gorece(x.zaman)}</span></span>
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/30 transition-transform", acik === i && "rotate-180")} />
            </button>
            {acik === i && (
              <div className="space-y-2 px-4 pb-3">
                <div><p className="mb-1 text-[11.5px] text-white/45">Girdi</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-[12px] bg-black/30 p-2.5 font-mono text-[11.5px] text-white/75 ring-1 ring-inset ring-white/[0.06]">{x.ozet}</pre></div>
                {x.cikti && <div><p className="mb-1 text-[11.5px] text-white/45">{x.basarili ? "Sonuç" : "Hata"}</p><pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-[12px] bg-black/30 p-2.5 font-mono text-[11.5px] text-white/75 ring-1 ring-inset ring-white/[0.06]">{x.cikti}</pre></div>}
              </div>
            )}
          </div>
        ); })}
        {!l.length && <p className="px-4 py-3 text-[13px] text-white/50">Süzgece uyan çağrı yok.</p>}
      </div>
    </Bolum>
  );
}
