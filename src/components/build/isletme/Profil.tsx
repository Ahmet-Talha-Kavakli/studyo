"use client";

import { useEffect, useState } from "react";
import { AtSign, CheckCircle2, Clock, Copy, Earth, Globe, Landmark, Loader2, MapPin, RefreshCcw, Search, ShieldCheck, Share2, Store } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { BOS_PROFIL, EPOSTA_SAGLAYICILARI, ISLETME_TURLERI, VARSAYILAN_EPOSTA, type KurumsalEposta, type Profil } from "@/lib/build/isletmeTipler";
import { cn } from "@/lib/utils";
import { ALT_BOLGELER, ULKE_GRUPLARI, ULKELER, adresBicimi, dilimEtiketi, paraSimgesi, paraYaz, saatDilimleri, ulkeBul } from "@/lib/build/bolge";
import { Alan, BilgiSatiri, birincil, Girdi, GorselAlani, HaftaDuzenleyici, HataSatiri, ikincil, imza, isletmeApi, KaydetSeridi, MetinAlani, Rozet, SecenekCipleri, simgeDugme, useTaslak, type IsletmeKanca } from "./ortak";

type Ortak = { k: IsletmeKanca; projeId: string; goster: (m: string, t?: "iyi" | "kotu") => void; alanAdlari: string[]; alanaGit?: () => void };
type Denetim = { maddeler: { id: string; ad: string; durum: "tamam" | "uyari" | "eksik"; alt: string }[] };

/* ═════════════ İşletme profili ═════════════ */
export function ProfilBolumu({ o }: { o: Ortak }) {
  const tk = useTaslak<Profil>(o.k.d?.veri.profil ?? BOS_PROFIL, (v) => o.k.kaydet("profil", v));
  const t = tk.t;
  const da = (x: Partial<Profil["adres"]>) => tk.d("adres", { ...t.adres, ...x });
  const ds = (x: Partial<Profil["sosyal"]>) => tk.d("sosyal", { ...t.sosyal, ...x });
  const dr = (x: Partial<Profil["resmi"]>) => tk.d("resmi", { ...t.resmi, ...x });
  const [denetim, setDenetim] = useState<Denetim | null>(null);
  const [denetliyor, setDenetliyor] = useState(false);
  const [konum, setKonum] = useState<{ enlem: number; boylam: number; ad: string }[] | null>(null);
  const [konumHata, setKonumHata] = useState("");
  const [ozelGun, setOzelGun] = useState({ tarih: "", ad: "" });
  const denetle = async () => { setDenetliyor(true); try { if (tk.degisti) await tk.kaydet(); setDenetim((await isletmeApi<{ denetim: Denetim }>(o.projeId, "profil/denetle")).denetim); } finally { setDenetliyor(false); } };
  useEffect(() => { isletmeApi<{ denetim: Denetim }>(o.projeId, "profil/denetle").then((r) => setDenetim(r.denetim)).catch(() => {}); }, [o.projeId]);
  const konumBul = async () => {
    setKonumHata(""); setKonum(null);
    try { const r = await isletmeApi<{ sonuclar: { enlem: number; boylam: number; ad: string }[] }>(o.projeId, `profil/konum?adres=${encodeURIComponent([t.adres.sokak, t.adres.ilce, t.adres.il, t.adres.bolge, t.adres.ulke].filter(Boolean).join(", "))}`); if (!r.sonuclar.length) setKonumHata("Bu adres haritada bulunamadı; koordinatı elle yaz."); setKonum(r.sonuclar); }
    catch (e) { setKonumHata((e as Error).message); }
  };
  const seri = <KaydetSeridi {...tk} kaydet={tk.kaydet} />;
  const ab = adresBicimi(t.ulkeKodu);
  const tr = t.ulkeKodu === "TR";
  const para = o.k.d?.veri.magaza.paraBirimi ?? ulkeBul(t.ulkeKodu)?.para ?? "USD";
  const simge = paraSimgesi(para, t.yerel || "en-US");
  /** Ülke değişince saat dilimi ve biçim ülkenin varsayılanına geçer (elle değiştirilmişse korunur). */
  const ulkeSec = (kod: string) => {
    const u = ulkeBul(kod), eski = ulkeBul(t.ulkeKodu);
    tk.setT((x) => ({
      ...x, ulkeKodu: kod, adres: { ...x.adres, ulke: u?.ad ?? "", bolge: "" },
      saatDilimi: !x.saatDilimi || x.saatDilimi === "UTC" || x.saatDilimi === eski?.dilim ? u?.dilim ?? x.saatDilimi : x.saatDilimi,
      yerel: !x.yerel || x.yerel === eski?.yerel ? u?.yerel ?? x.yerel : x.yerel,
    }));
  };
  const [dilimAra, setDilimAra] = useState("");
  const dilimler = saatDilimleri();
  const tarayiciDilimi = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ""; } })();
  const YERELLER = [...new Set([t.yerel, ulkeBul(t.ulkeKodu)?.yerel, "en-US", "en-GB", "de-DE", "fr-FR", "es-ES", "it-IT", "nl-NL", "pt-BR", "ja-JP", "tr-TR"].filter((x): x is string => !!x))];
  const gorunum = (y: string) => { try { return `${paraYaz(1250.5, para, y)} · ${new Date().toLocaleString(y, { timeZone: t.saatDilimi || "UTC", dateStyle: "medium", timeStyle: "short" })}`; } catch { return y; } };
  return (
    <div className="space-y-4">
      <Kart ikon={Earth} baslik="Ülke, saat dilimi ve biçim" alt="Vergi, para birimi, adres biçimi ve yasal metin önerileri ülkeden gelir; randevu ve raporlar bu saat dilimindedir" altSerit={seri}>
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <Alan etiket="Ülke">
            <select value={t.ulkeKodu} onChange={(e) => ulkeSec(e.target.value)} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13.5px] text-white ring-1 ring-inset ring-white/[0.08]">
              <option value="">Ülke seç</option>
              {ULKE_GRUPLARI.map((g) => <optgroup key={g.id} label={g.ad}>{ULKELER.filter((u) => u.grup === g.id).sort((a, b) => a.ad.localeCompare(b.ad, "tr")).map((u) => <option key={u.kod} value={u.kod}>{u.ad}</option>)}</optgroup>)}
            </select>
          </Alan>
          <Alan etiket="Saat dilimi" alt={t.saatDilimi ? dilimEtiketi(t.saatDilimi) : undefined}>
            <select value={t.saatDilimi} onChange={(e) => tk.d("saatDilimi", e.target.value)} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13.5px] text-white ring-1 ring-inset ring-white/[0.08]">
              {[...new Set([t.saatDilimi, ...(tarayiciDilimi ? [tarayiciDilimi] : []), ...dilimler.filter((z) => !dilimAra || z.toLowerCase().includes(dilimAra.toLowerCase()))])].filter(Boolean).slice(0, 600).map((z) => <option key={z} value={z}>{z.replace(/_/g, " ")}{z === tarayiciDilimi ? " (bu cihaz)" : ""}</option>)}
            </select>
          </Alan>
          <Alan etiket="Sayı ve tarih biçimi" alt="sitede">
            <select value={t.yerel} onChange={(e) => tk.d("yerel", e.target.value)} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13.5px] text-white ring-1 ring-inset ring-white/[0.08]">
              {YERELLER.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Alan>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
            <Girdi value={dilimAra} onChange={(e) => setDilimAra(e.target.value)} placeholder="Saat dilimi ara: London, Chicago, Tokyo" className="h-9 max-w-[280px]" />
            {tarayiciDilimi && tarayiciDilimi !== t.saatDilimi && <button type="button" onClick={() => tk.d("saatDilimi", tarayiciDilimi)} className={ikincil}><Clock className="h-4 w-4" />Bu cihazın saat dilimini kullan</button>}
            <span className="text-[12.5px] text-white/50">Sitede görünüm: {gorunum(t.yerel || "en-US")}</span>
          </div>
        </div>
      </Kart>
      <Kart ikon={Store} baslik="İşletme kartı" alt="Sitede, yasal metinlerde, e-postalarda ve Google'a giden yapılandırılmış veride kullanılır" altSerit={seri}>
        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[140px_1fr]">
          <div className="space-y-2 max-md:grid max-md:grid-cols-[110px_1fr] max-md:gap-2 max-md:space-y-0"><GorselAlani projeId={o.projeId} deger={t.logo} set={(x) => tk.d("logo", x)} etiket="Logo" /><GorselAlani projeId={o.projeId} deger={t.gorsel} set={(x) => tk.d("gorsel", x)} oran="aspect-video" etiket="Kapak" /></div>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Alan etiket="İşletme adı" alt="Google'daki adla aynı"><Girdi value={t.ad} onChange={(e) => tk.d("ad", e.target.value)} maxLength={120} /></Alan>
              <Alan etiket="İşletme türü"><select value={t.tur} onChange={(e) => tk.d("tur", e.target.value)} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13.5px] text-white ring-1 ring-inset ring-white/[0.08]">{ISLETME_TURLERI.map((x) => <option key={x.id} value={x.id}>{x.ad}</option>)}</select></Alan>
            </div>
            <Alan etiket="Slogan"><Girdi value={t.slogan} onChange={(e) => tk.d("slogan", e.target.value)} maxLength={160} /></Alan>
            <Alan etiket="Kısa tanıtım"><MetinAlani value={t.aciklama} onChange={(e) => tk.d("aciklama", e.target.value)} rows={3} maxLength={1200} /></Alan>
            <div className="grid gap-3 sm:grid-cols-3">
              <Alan etiket="Telefon"><Girdi type="tel" value={t.telefon} onChange={(e) => tk.d("telefon", e.target.value)} maxLength={30} placeholder={tr ? "0216 123 45 67" : "+1 415 555 0100"} /></Alan>
              <Alan etiket="E-posta"><Girdi type="email" value={t.eposta} onChange={(e) => tk.d("eposta", e.target.value)} maxLength={120} /></Alan>
              <Alan etiket="WhatsApp"><Girdi type="tel" value={t.whatsapp} onChange={(e) => tk.d("whatsapp", e.target.value)} maxLength={30} placeholder={tr ? "0532 123 45 67" : "+44 7700 900123"} /></Alan>
            </div>
            <Alan etiket="Fiyat düzeyi" alt="Google'da gösterilir"><SecenekCipleri<Profil["fiyatAraligi"]> deger={t.fiyatAraligi} set={(x) => tk.d("fiyatAraligi", x)} l={[{ id: "", ad: "Belirtme" }, { id: "1", ad: `${simge} Uygun` }, { id: "2", ad: `${simge.repeat(2)} Orta` }, { id: "3", ad: `${simge.repeat(3)} Üst` }, { id: "4", ad: `${simge.repeat(4)} Lüks` }]} /></Alan>
          </div>
        </div>
      </Kart>
      <Kart ikon={MapPin} baslik="Adres ve konum" alt="Harita, yol tarifi ve yerel arama için" altSerit={seri}>
        <div className="space-y-3 p-4 sm:p-5">
          <label className="flex items-center gap-2 text-[13px] text-white/75"><Anahtar acik={t.adresGizli} set={(x) => tk.d("adresGizli", x)} etiket="Adresi gizle" />Adresimi gösterme (yerinde hizmet veriyorum ya da evden çalışıyorum)</label>
          {t.adresGizli ? <Alan etiket="Hizmet bölgesi"><Girdi value={t.hizmetBolgesi} onChange={(e) => tk.d("hizmetBolgesi", e.target.value)} maxLength={200} placeholder={tr ? "İstanbul Anadolu yakası" : "Greater London"} /></Alan> : (
            <>
              <Alan etiket={tr ? "Açık adres" : "Adres satırı"}><Girdi value={t.adres.sokak} onChange={(e) => da({ sokak: e.target.value })} maxLength={200} placeholder={tr ? "Caferağa Mah. Moda Cad. No: 12" : "350 Fifth Avenue, Suite 210"} /></Alan>
              <div className="grid gap-3 sm:grid-cols-4">
                {tr ? <>
                  <Alan etiket="İlçe"><Girdi value={t.adres.ilce} onChange={(e) => da({ ilce: e.target.value })} maxLength={60} /></Alan>
                  <Alan etiket="İl"><Girdi value={t.adres.il} onChange={(e) => da({ il: e.target.value })} maxLength={60} /></Alan>
                </> : <>
                  <Alan etiket="Şehir"><Girdi value={t.adres.il} onChange={(e) => da({ il: e.target.value })} maxLength={60} /></Alan>
                  {ab.bolge !== "" && (ab.secenekler ? (
                    <Alan etiket={ab.bolgeEtiket}><select value={t.adres.bolge} onChange={(e) => da({ bolge: e.target.value })} className="h-10 w-full rounded-[14px] bg-white/[0.05] px-3 text-[13.5px] text-white ring-1 ring-inset ring-white/[0.08]"><option value="">Seç</option>{(ALT_BOLGELER[t.ulkeKodu] ?? []).map((b) => <option key={b.kod} value={b.kod}>{b.ad}</option>)}</select></Alan>
                  ) : <Alan etiket={ab.bolgeEtiket}><Girdi value={t.adres.bolge} onChange={(e) => da({ bolge: e.target.value })} maxLength={60} /></Alan>)}
                </>}
                {ab.posta !== "yok" && <Alan etiket={ab.postaEtiket}><Girdi value={t.adres.postaKodu} onChange={(e) => da({ postaKodu: e.target.value })} maxLength={12} /></Alan>}
                <Alan etiket="Ülke"><Girdi value={t.adres.ulke || "Yukarıdan seç"} readOnly className="text-white/60" /></Alan>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Alan etiket="Enlem" className="w-[140px]"><Girdi value={t.konum.enlem ?? ""} onChange={(e) => tk.d("konum", { ...t.konum, enlem: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) })} inputMode="decimal" /></Alan>
                <Alan etiket="Boylam" className="w-[140px]"><Girdi value={t.konum.boylam ?? ""} onChange={(e) => tk.d("konum", { ...t.konum, boylam: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) })} inputMode="decimal" /></Alan>
                <button type="button" disabled={!t.adres.sokak && !t.adres.il} onClick={konumBul} className={ikincil}><Search className="h-4 w-4" />Adresten bul</button>
                {t.konum.enlem != null && t.konum.boylam != null && <a href={`https://www.openstreetmap.org/?mlat=${t.konum.enlem}&mlon=${t.konum.boylam}#map=17/${t.konum.enlem}/${t.konum.boylam}`} target="_blank" rel="noopener noreferrer" className="pb-2.5 text-[12.5px] text-[#8be6ff]">Haritada gör</a>}
              </div>
              {konumHata && <p className="text-[12.5px] text-amber-200">{konumHata}</p>}
              {konum && konum.length > 0 && <div className="space-y-1">{konum.map((x, i) => <button key={i} type="button" onClick={() => { tk.d("konum", { enlem: Math.round(x.enlem * 1e6) / 1e6, boylam: Math.round(x.boylam * 1e6) / 1e6 }); setKonum(null); }} className="block w-full rounded-[12px] bg-white/[0.04] px-3 py-2 text-left text-[12.5px] text-white/75 hover:bg-white/[0.07]">{x.ad}</button>)}<p className="text-[11px] text-white/35">Konum verisi OpenStreetMap katkıcılarından.</p></div>}
            </>
          )}
        </div>
      </Kart>
      <Kart ikon={Clock} baslik="Çalışma saatleri" alt="Sitede ve Google'da görünen açılış saatleri" altSerit={seri}>
        <div className="space-y-3 p-3 sm:p-4">
          <HaftaDuzenleyici deger={t.saatler} set={(x) => tk.d("saatler", x)} />
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-white/75">Özel günler <span className="font-normal text-white/45">bayram, tatil, farklı saat</span></p>
            <div className="space-y-1.5">
              {t.ozelGunler.map((g, i) => (
                <div key={g.tarih} className="flex flex-wrap items-center gap-2 rounded-[12px] bg-white/[0.03] px-3 py-2 ring-1 ring-inset ring-white/[0.06]">
                  <span className="w-[110px] text-[12.5px] tabular-nums text-white">{g.tarih}</span><span className="min-w-[80px] flex-1 truncate text-[12.5px] text-white/65">{g.ad}</span>
                  <Secici id={`ozel-${i}`} kucuk deger={g.acik ? "acik" : "kapali"} set={(x) => tk.d("ozelGunler", t.ozelGunler.map((y, j) => (j === i ? { ...y, acik: x === "acik", bas: y.bas ?? "10:00", bit: y.bit ?? "16:00" } : y)))} l={[{ id: "kapali", ad: "Kapalı" }, { id: "acik", ad: "Farklı saat" }]} />
                  {g.acik && <><input type="time" value={g.bas} onChange={(e) => tk.d("ozelGunler", t.ozelGunler.map((y, j) => (j === i ? { ...y, bas: e.target.value } : y)))} className="h-8 rounded-[10px] bg-white/[0.05] px-2 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.08]" /><input type="time" value={g.bit} onChange={(e) => tk.d("ozelGunler", t.ozelGunler.map((y, j) => (j === i ? { ...y, bit: e.target.value } : y)))} className="h-8 rounded-[10px] bg-white/[0.05] px-2 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.08]" /></>}
                  <button type="button" onClick={() => tk.d("ozelGunler", t.ozelGunler.filter((_, j) => j !== i))} className={simgeDugme} aria-label="Kaldır">×</button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2"><Girdi type="date" value={ozelGun.tarih} onChange={(e) => setOzelGun({ ...ozelGun, tarih: e.target.value })} className="h-9 w-[160px]" /><Girdi value={ozelGun.ad} onChange={(e) => setOzelGun({ ...ozelGun, ad: e.target.value })} placeholder="Kurban Bayramı" maxLength={60} className="h-9 w-[180px]" /><button type="button" disabled={!ozelGun.tarih} onClick={() => { tk.d("ozelGunler", [...t.ozelGunler.filter((x) => x.tarih !== ozelGun.tarih), { tarih: ozelGun.tarih, ad: ozelGun.ad, acik: false }].sort((a, b) => a.tarih.localeCompare(b.tarih))); setOzelGun({ tarih: "", ad: "" }); }} className={ikincil}>Ekle</button></div>
            </div>
          </div>
        </div>
      </Kart>
      <Kart ikon={Share2} baslik="Sosyal hesaplar ve Google" alt="Yapılandırılmış veride sameAs olarak eklenir; arama motoru hesapların sana ait olduğunu anlar" altSerit={seri}>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          {([["instagram", "Instagram", "/marka/renkli/instagram-color.svg"], ["facebook", "Facebook", "/marka/renkli/meta-color.svg"], ["tiktok", "TikTok", "/marka/renkli/tiktok-color.svg"], ["x", "X", "/marka/renkli/x-beyaz.svg"], ["linkedin", "LinkedIn", "/marka/renkli/linkedin-color.svg"], ["youtube", "YouTube", ""]] as const).map(([k, ad, logo]) => (
            <Alan key={k} etiket={<span className="inline-flex items-center gap-1.5">{logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt="" className="h-3.5 w-3.5" />}{ad}</span>}><Girdi value={t.sosyal[k]} onChange={(e) => ds({ [k]: e.target.value })} placeholder={`https://${k === "x" ? "x.com" : `${k}.com`}/...`} maxLength={300} /></Alan>
          ))}
          <Alan etiket={<span className="inline-flex items-center gap-1.5">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/marka/renkli/google-color.svg" alt="" className="h-3.5 w-3.5" />Google İşletme Profili</span>} alt="Haritalardaki işletme bağlantısı" className="sm:col-span-2"><Girdi value={t.googleProfil} onChange={(e) => tk.d("googleProfil", e.target.value)} placeholder="https://maps.app.goo.gl/..." maxLength={300} /></Alan>
        </div>
      </Kart>
      <Kart ikon={Landmark} baslik="Resmî bilgiler" alt={tr ? "Mesafeli satış sözleşmesi, ön bilgilendirme formu ve KVKK metni için" : "Satış koşulları, gizlilik politikası ve faturalar için"} altSerit={seri}>
        <div className="space-y-3 p-4 sm:p-5">
          <Secici id="resmi-tur" kucuk deger={t.resmi.tur} set={(x) => dr({ tur: x })} l={[{ id: "sahis", ad: "Şahıs işletmesi" }, { id: "sirket", ad: "Şirket" }]} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Alan etiket={t.resmi.tur === "sirket" ? "Ticari unvan" : "Ad soyad ya da ticari ad"}><Girdi value={t.resmi.unvan} onChange={(e) => dr({ unvan: e.target.value })} maxLength={160} /></Alan>
            {tr ? <>
              <Alan etiket="Vergi dairesi"><Girdi value={t.resmi.vergiDairesi} onChange={(e) => dr({ vergiDairesi: e.target.value })} maxLength={80} /></Alan>
              <Alan etiket={t.resmi.tur === "sirket" ? "Vergi numarası" : "TC kimlik ya da vergi no"}><Girdi value={t.resmi.vergiNo} onChange={(e) => dr({ vergiNo: e.target.value.replace(/\D/g, "") })} maxLength={11} inputMode="numeric" /></Alan>
              {t.resmi.tur === "sirket" && <Alan etiket="MERSİS numarası"><Girdi value={t.resmi.mersis} onChange={(e) => dr({ mersis: e.target.value.replace(/\D/g, "") })} maxLength={16} inputMode="numeric" /></Alan>}
              <Alan etiket="KEP adresi" alt="varsa"><Girdi value={t.resmi.kep} onChange={(e) => dr({ kep: e.target.value })} maxLength={120} /></Alan>
            </> : <>
              <Alan etiket="Vergi kimliği" alt={t.ulkeKodu === "US" ? "EIN" : t.ulkeKodu === "AU" ? "ABN" : t.ulkeKodu === "IN" ? "GSTIN" : t.ulkeKodu === "CA" ? "GST/HST no" : "VAT numarası"}><Girdi value={t.resmi.vergiNo} onChange={(e) => dr({ vergiNo: e.target.value.toUpperCase() })} maxLength={24} placeholder={t.ulkeKodu === "US" ? "12-3456789" : t.ulkeKodu === "GB" ? "GB123456789" : "DE123456789"} /></Alan>
              <Alan etiket="Şirket sicil numarası" alt="varsa"><Girdi value={t.resmi.sicilNo} onChange={(e) => dr({ sicilNo: e.target.value })} maxLength={40} placeholder={t.ulkeKodu === "GB" ? "Companies House 01234567" : t.ulkeKodu === "DE" ? "HRB 12345, Amtsgericht München" : ""} /></Alan>
            </>}
          </div>
        </div>
      </Kart>
      <Kart ikon={ShieldCheck} baslik="Google ile tutarlılık" alt="Sitedeki ad, telefon ve adres profille ve Google İşletme Profili ile aynı olmalı" sag={<button type="button" disabled={denetliyor} onClick={denetle} className={ikincil}>{denetliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}<span className="max-sm:hidden">Denetle</span></button>}>
        <div className="divide-y divide-white/[0.06]">
          {!denetim ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : denetim.maddeler.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", m.durum === "tamam" ? "bg-emerald-400/[0.12] text-emerald-200" : m.durum === "uyari" ? "bg-amber-400/[0.12] text-amber-200" : "bg-rose-500/[0.12] text-rose-200")}>{m.durum === "tamam" ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[13px] font-bold">!</span>}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{m.ad}</span><span className="block text-[12px] text-white/55">{m.alt}</span></span>
            </div>
          ))}
        </div>
      </Kart>
    </div>
  );
}

/* ═════════════ Alan adı ve kurumsal e-posta ═════════════ */
type Kayit = { tur: string; ad: string; deger: string; oncelik?: number; amac: string; durum?: "dogru" | "yok" | "yanlis" | "kullanici"; bulunan?: string[] };
type Sorgu = { ad: string; durum: "musait" | "kayitli" | "sorgulanamadi"; kayitci?: string; bitis?: string; neden?: string };
const KAYIT_FIRMALARI = [
  { ad: "GoDaddy", adres: "https://www.godaddy.com/tr-tr", logo: "/marka/baglanti/godaddy.svg" },
  { ad: "Cloudflare Registrar", adres: "https://www.cloudflare.com/products/registrar/", logo: "/marka/baglanti/cloudflare.svg" },
  { ad: "İsimtescil", adres: "https://www.isimtescil.net", logo: "" },
  { ad: "Natro", adres: "https://www.natro.com", logo: "" },
  { ad: "Turhost", adres: "https://www.turhost.com", logo: "" },
];
const ADIMLAR: Record<string, string[]> = {
  google: ["admin.google.com adresinde Google Workspace hesabı aç ve alan adını ekle.", "Google'ın verdiği doğrulama TXT kaydını alan adı firmanın DNS paneline ekle.", "Aşağıdaki MX, SPF ve DMARC kayıtlarını ekle.", "Gmail ayarlarındaki E-posta kimlik doğrulaması bölümünden DKIM anahtarını oluştur, buraya yapıştırıp kaydet ve DNS'e ekle.", "Denetle düğmesiyle kayıtların yayıldığını kontrol et (birkaç dakika ile 24 saat)."],
  microsoft: ["admin.microsoft.com adresinde Microsoft 365 aboneliği al ve Ayarlar menüsündeki Alan adları bölümünden alan adını ekle.", "Microsoft'un verdiği TXT doğrulama kaydını ekle.", "Aşağıdaki MX, SPF, autodiscover ve DMARC kayıtlarını ekle.", "Microsoft Defender portalındaki E-posta kimlik doğrulaması bölümünden DKIM CNAME kayıtlarını al ve ekle.", "Denetle düğmesiyle kontrol et."],
  zoho: ["mail.zoho.com adresinde kuruluş hesabı aç ve alan adını ekle.", "Zoho'nun verdiği zoho-verification TXT kaydını ekle.", "Aşağıdaki MX, SPF ve DMARC kayıtlarını ekle.", "Zoho Mail yönetici panelinde Alan adları altındaki DKIM bölümünden seçici ve anahtarı al, buraya yaz.", "Denetle düğmesiyle kontrol et."],
  yandex: ["admin.yandex.com adresinde Yandex 360 hesabı aç ve alan adını ekle.", "Yandex'in verdiği doğrulama kaydını ekle.", "Aşağıdaki MX, SPF ve DMARC kayıtlarını ekle.", "DKIM anahtarını alan adı ayarlarından kopyala ve buraya yaz.", "Denetle düğmesiyle kontrol et."],
  diger: ["Sağlayıcının kurulum belgesindeki MX sunucularını ve SPF eklentisini buraya yaz.", "Kayıtları alan adı firmanın DNS paneline ekle.", "Denetle düğmesiyle kontrol et."],
};
export function EpostaBolumu({ o }: { o: Ortak }) {
  const tk = useTaslak<KurumsalEposta>(o.k.d?.veri.eposta ?? VARSAYILAN_EPOSTA, (v) => o.k.kaydet("eposta", v));
  const t = tk.t;
  const [ad, setAd] = useState("");
  const [sorgular, setSorgular] = useState<Sorgu[] | null>(null);
  const [sorguluyor, setSorguluyor] = useState(false);
  const [dns, setDns] = useState<{ kayitlar: Kayit[]; notlar: string[]; uyarilar: string[] } | null>(null);
  const [denetliyor, setDenetliyor] = useState(false);
  const [hata, setHata] = useState("");
  const sorgula = async (oneri: boolean) => {
    setSorguluyor(true); setHata("");
    try { if (oneri) setSorgular((await isletmeApi<{ sonuclar: Sorgu[] }>(o.projeId, `alan/oneri?ad=${encodeURIComponent(ad || o.k.d?.veri.profil.ad || "")}`)).sonuclar); else setSorgular([(await isletmeApi<{ sonuc: Sorgu }>(o.projeId, `alan?ad=${encodeURIComponent(ad.trim().toLowerCase())}`)).sonuc]); }
    catch (e) { setHata((e as Error).message); } finally { setSorguluyor(false); }
  };
  const denetle = async () => {
    setDenetliyor(true); setHata("");
    try { if (tk.degisti) await o.k.kaydet("eposta", t); setDns(await isletmeApi<{ kayitlar: Kayit[]; notlar: string[]; uyarilar: string[] }>(o.projeId, "eposta/dns")); }
    catch (e) { setHata((e as Error).message); } finally { setDenetliyor(false); }
  };
  const kayitli = o.k.d?.veri.eposta;
  useEffect(() => { if (kayitli?.saglayici && kayitli.alan) isletmeApi<{ kayitlar: Kayit[]; notlar: string[]; uyarilar: string[] }>(o.projeId, "eposta/dns").then(setDns).catch(() => {}); }, [o.projeId, kayitli?.saglayici, kayitli?.alan]);
  const kopyala = (s: string) => { navigator.clipboard.writeText(s); o.goster("Kopyalandı"); };
  const dogru = dns?.kayitlar.filter((k) => k.durum === "dogru").length ?? 0;
  return (
    <div className="space-y-4">
      <HataSatiri mesaj={hata} kapat={() => setHata("")} />
      <Kart ikon={Globe} baslik="Alan adı bul" alt="Resmî kayıt sorgusu (RDAP); Vayra'da alan adı satışı yok, müsait adı bir kayıt firmasından alıp buradan bağlarsın">
        <div className="space-y-3 p-4 sm:p-5">
          <div className="cam-istemci flex items-center gap-2 rounded-[18px] p-1.5 pl-3.5">
            <Search className="h-4 w-4 shrink-0 text-white/50" />
            <input value={ad} onChange={(e) => setAd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ad.includes(".") && sorgula(false)} placeholder="seramikatolyesi.com ya da işletme adı" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" />
            <button type="button" disabled={sorguluyor || !ad.includes(".")} onClick={() => sorgula(false)} className={birincil}>{sorguluyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Sorgula</button>
            <button type="button" disabled={sorguluyor} onClick={() => sorgula(true)} className={cn(ikincil, "max-sm:hidden")}>Öner</button>
          </div>
          <button type="button" disabled={sorguluyor} onClick={() => sorgula(true)} className="text-[12.5px] text-[#8be6ff] sm:hidden">İşletme adından öner</button>
          {sorgular && (
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
              {sorgular.map((s) => (
                <div key={s.ad} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                  <span className="min-w-0 flex-1 text-[13.5px] font-medium text-white">{s.ad}<span className="block text-[12px] font-normal text-white/45">{s.durum === "kayitli" ? [s.kayitci, s.bitis ? `${s.bitis} tarihine kadar kayıtlı` : null].filter(Boolean).join(" · ") || "Başkası adına kayıtlı" : s.durum === "musait" ? "Kayıt firmasından hemen alınabilir" : s.neden}</span></span>
                  {s.durum === "musait" ? <Rozet ton="iyi">Müsait</Rozet> : s.durum === "kayitli" ? <Rozet>Alınmış</Rozet> : <Rozet ton="uyari">Sorgulanamadı</Rozet>}
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-white/50">Kayıt firmaları:</span>
            {KAYIT_FIRMALARI.map((f) => <a key={f.ad} href={f.adres} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/75 hover:text-white">{f.logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.logo} alt="" className="h-3.5 w-3.5" />}{f.ad}</a>)}
          </div>
          {o.alanaGit && <button type="button" onClick={o.alanaGit} className="text-[12.5px] font-medium text-[#8be6ff]">Aldığın alan adını siteye bağla</button>}
        </div>
      </Kart>
      <Kart ikon={AtSign} baslik="Kurumsal e-posta" alt="info@alanadin.com gibi adresler için sağlayıcı kurulumu ve DNS kayıtları" altSerit={<KaydetSeridi {...tk} kaydet={tk.kaydet} ek={<button type="button" disabled={denetliyor || !t.saglayici || !t.alan} onClick={denetle} className={imza}>{denetliyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}DNS'i denetle</button>} />}>
        <div className="space-y-4 p-4 sm:p-5">
          <BilgiSatiri>Vayra posta kutusu barındırmıyor; kutuyu aşağıdaki sağlayıcılardan birinde açarsın. Bu bölüm alan adına eklemen gereken kayıtları hazırlar ve canlı DNS'te doğrular. Sitenin kendi bildirim e-postaları (sipariş, randevu) Vayra Bulut e-postasıyla gider.</BilgiSatiri>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {EPOSTA_SAGLAYICILARI.map((s) => (
              <button key={s.id} type="button" onClick={() => tk.d("saglayici", s.id)} className={cn("flex min-h-[86px] flex-col items-start gap-2 rounded-[16px] p-3 text-left transition-colors", t.saglayici === s.id ? "bg-white/[0.08] ring-2 ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.06]")}>
                {s.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.logo} alt="" className="h-6 w-6" /> : s.id === "diger" ? <AtSign className="h-6 w-6 text-white/50" /> : <span className="h-6" />}
                <span className="text-[13px] font-medium text-white">{s.ad}</span>{s.fiyat && <span className="text-[11px] leading-snug text-white/45">{s.fiyat}</span>}
              </button>
            ))}
          </div>
          {t.saglayici && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Alan etiket="Alan adı">
                  {o.alanAdlari.length ? <SecenekCipleri<string> deger={t.alan} set={(x) => tk.d("alan", x.toLowerCase())} l={o.alanAdlari.map((x) => ({ id: x, ad: x }))} ozel ozelTur="metin" /> : <Girdi value={t.alan} onChange={(e) => tk.d("alan", e.target.value.toLowerCase())} placeholder="alanadin.com" maxLength={253} />}
                </Alan>
                <Alan etiket="DMARC raporları" alt="isteğe bağlı"><Girdi type="email" value={t.dmarcEposta} onChange={(e) => tk.d("dmarcEposta", e.target.value)} placeholder="dmarc@alanadin.com" /></Alan>
              </div>
              {t.saglayici === "zoho" && <Alan etiket="Zoho veri merkezi"><Secici id="zoho-bolge" kucuk deger={t.zohoBolge} set={(x) => tk.d("zohoBolge", x)} l={[{ id: "eu", ad: "Avrupa (zoho.eu)" }, { id: "com", ad: "ABD (zoho.com)" }]} /></Alan>}
              {t.saglayici === "diger" && <div className="grid gap-3 sm:grid-cols-2"><Alan etiket="MX sunucuları" alt="öncelik ve ad"><Girdi value={t.mxOzel} onChange={(e) => tk.d("mxOzel", e.target.value)} placeholder="10 mx1.saglayici.com, 20 mx2.saglayici.com" /></Alan><Alan etiket="SPF eklentisi"><Girdi value={t.spfOzel} onChange={(e) => tk.d("spfOzel", e.target.value)} placeholder="spf.saglayici.com" /></Alan></div>}
              <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                <Alan etiket="DKIM kayıt adı"><Girdi value={t.dkimAd} onChange={(e) => tk.d("dkimAd", e.target.value)} placeholder={t.saglayici === "google" ? "google._domainkey" : t.saglayici === "microsoft" ? "selector1._domainkey" : "seçici._domainkey"} /></Alan>
                <Alan etiket="DKIM değeri" alt="sağlayıcı panelinden"><Girdi value={t.dkimDeger} onChange={(e) => tk.d("dkimDeger", e.target.value)} placeholder={t.saglayici === "microsoft" ? "selector1-alanadin-com._domainkey.kurulus.onmicrosoft.com" : "v=DKIM1; k=rsa; p=..."} /></Alan>
              </div>
              <ol className="space-y-1.5 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">{(ADIMLAR[t.saglayici] ?? []).map((a, i) => <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-white/75"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white">{i + 1}</span>{a}</li>)}</ol>
            </>
          )}
          {dns && dns.kayitlar.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2"><span className="text-[13px] font-medium text-white">DNS kayıtları</span><Rozet ton={dogru === dns.kayitlar.length ? "iyi" : "uyari"}>{dogru} / {dns.kayitlar.length} doğru</Rozet></div>
              {dns.uyarilar.map((u, i) => <div key={i} className="mb-2"><BilgiSatiri ton="uyari">{u}</BilgiSatiri></div>)}
              <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
                {dns.kayitlar.map((k, i) => (
                  <div key={i} className="grid gap-2 px-3.5 py-3 text-[12.5px] sm:grid-cols-[64px_150px_1fr_auto] sm:items-center">
                    <span className="font-semibold text-white">{k.tur}{k.oncelik !== undefined && <span className="ml-1 font-normal text-white/45">{k.oncelik}</span>}</span>
                    <span className="truncate text-white/75">{k.ad}</span>
                    <span className="min-w-0"><span className="flex items-center gap-1"><code className="min-w-0 flex-1 truncate rounded-[8px] bg-white/[0.05] px-2 py-1 text-[11.5px] text-white/80">{k.deger}</code>{k.durum !== "kullanici" && <button type="button" onClick={() => kopyala(k.deger)} className={simgeDugme} aria-label="Kopyala"><Copy className="h-3.5 w-3.5" /></button>}</span><span className="mt-0.5 block text-[11px] text-white/40">{k.amac}{k.durum === "yanlis" && k.bulunan?.length ? `; bulunan: ${k.bulunan.slice(0, 2).join(", ")}` : ""}</span></span>
                    <span>{k.durum === "dogru" ? <Rozet ton="iyi">Doğru</Rozet> : k.durum === "yanlis" ? <Rozet ton="kotu">Farklı</Rozet> : k.durum === "kullanici" ? <Rozet>Değer gerekli</Rozet> : <Rozet ton="uyari">Yok</Rozet>}</span>
                  </div>
                ))}
              </div>
              <ul className="mt-2 space-y-1">{dns.notlar.map((n, i) => <li key={i} className="text-[12px] leading-relaxed text-white/50">{n}</li>)}</ul>
            </div>
          )}
        </div>
      </Kart>
    </div>
  );
}
