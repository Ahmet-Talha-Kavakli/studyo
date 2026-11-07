"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Bolum, KAPSAM_AD, Kopyala, PENCERE_AD, Satir, type AracSiniri, type BaglantiAcik } from "./ortak";

type Yama = (g: Record<string, unknown>, e?: string) => Promise<boolean>;
const aracAdi = (b: BaglantiAcik, ad: string) => (ad === "*" ? "Bütün araçlar" : ad === "okuma" ? "Okuma araçları" : ad === "yazma" ? "Yazma araçları" : b.araclar.find((a) => a.name === ad)?.annotations?.title ?? ad);

/** Sağlık geçmişi: son denemeler şerit olarak, çalışma yüzdesi ve ortalama yanıt süresi. */
export function SaglikSeridi({ b }: { b: BaglantiAcik }) {
  const l = (b.saglik ?? []).slice(-30);
  if (!l.length) return null;
  const iyi = l.filter((x) => x.d === "etkin");
  const ort = iyi.length ? Math.round(iyi.reduce((t, x) => t + x.ms, 0) / iyi.length) : 0;
  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex items-center justify-between text-[12px] text-white/55"><span>Son {l.length} denemenin yüzde {Math.round((iyi.length / l.length) * 100)} kadarı sağlıklı</span><span className="tabular-nums">ortalama {ort} ms</span></div>
      <div className="flex h-6 items-end gap-[2px]" role="img" aria-label="Sağlık geçmişi">
        {l.map((x, i) => <span key={i} title={`${new Date(x.z).toLocaleString("tr-TR")} · ${x.d === "etkin" ? `sağlıklı, ${x.ms} ms` : x.d === "giris-gerekli" ? "yeniden bağlanmalı" : `hata${x.h ? `: ${x.h}` : ""}`}`}
          className={cn("min-w-[4px] flex-1 rounded-[2px]", x.d === "etkin" ? "bg-[#1aa3d1]" : x.d === "giris-gerekli" ? "bg-amber-300" : "bg-[#e25c5c]")} style={{ height: x.d === "etkin" ? "100%" : "55%" }} />)}
      </div>
    </div>
  );
}

/** Hız sınırları ve kotalar: araç (ya da grup) başına dakika, saat, gün sınırı; kapsam (her yer ya da yalnız ziyaretçi vb.). */
export function Sinirlar({ b, yama, gidiyor }: { b: BaglantiAcik; yama: Yama; gidiyor: string | null }) {
  const [arac, setArac] = useState("*");
  const [pencere, setPencere] = useState<AracSiniri["pencere"]>("dakika");
  const [adet, setAdet] = useState("30");
  const [kapsam, setKapsam] = useState<AracSiniri["kapsam"]>("hepsi");
  const l = b.sinirlar ?? [];
  const bugun = (() => { const g = b.istatistik?.[new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10)]; return g?.s ?? 0; })();
  const ekle = async () => { const n = Math.floor(Number(adet)); if (!(n > 0)) return; await yama({ sinirlar: [...l, { arac, pencere, adet: n, kapsam }] }, "sinir"); };
  return (
    <Bolum baslik="Hız sınırları ve kotalar" alt={l.length ? `${l.length} kural${bugun ? ` · bugün ${bugun} çağrı sınıra takıldı` : ""}` : "Sınır yok: çağrılar sınırsız"}>
      {l.length > 0 && (
        <div className="divide-y divide-white/[0.05]">
          {l.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{aracAdi(b, s.arac)}: {PENCERE_AD[s.pencere]} en çok {s.adet.toLocaleString("tr-TR")} çağrı</span><span className="block text-[11.5px] text-white/45">{KAPSAM_AD[s.kapsam]}</span></span>
              <button type="button" onClick={() => yama({ sinirlar: l.filter((x) => x.id !== s.id) }, "sinir")} aria-label="Sınırı kaldır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2.5 border-t border-white/[0.06] p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <AcilirSecim deger={arac} set={setArac} l={[{ id: "*", ad: "Bütün araçlar" }, { id: "yazma", ad: "Yazma araçları", alt: "Kayıt oluşturan, değiştiren ya da silen" }, { id: "okuma", ad: "Okuma araçları" }, ...b.araclar.map((a) => ({ id: a.name, ad: a.annotations?.title ?? a.title ?? a.name, alt: a.name }))]} />
          <AcilirSecim deger={kapsam} set={(v) => setKapsam(v as AracSiniri["kapsam"])} l={(Object.keys(KAPSAM_AD) as AracSiniri["kapsam"][]).map((k) => ({ id: k, ad: KAPSAM_AD[k], alt: k === "ziyaretci" ? "Yayındaki ajanların sayfa, kutu ve kanal ziyaretçileri" : k === "gecit" ? "Dış MCP istemcileri" : undefined }))} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={adet} onChange={(e) => setAdet(e.target.value.replace(/\D/g, "").slice(0, 7))} inputMode="numeric" aria-label="En çok çağrı" className={cn(alanSinif, "h-10 w-[110px] text-[13px] tabular-nums")} />
          <span className="text-[12.5px] text-white/55">çağrı,</span>
          <Secici id="sinir-pencere" kucuk deger={pencere} set={setPencere} l={[{ id: "dakika", ad: "dakikada" }, { id: "saat", ad: "saatte" }, { id: "gun", ad: "günde" }]} />
          <span className="flex-1" />
          <button type="button" onClick={ekle} disabled={!!gidiyor || !(Number(adet) > 0)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "sinir" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Sınır ekle</button>
        </div>
        <p className="text-[11.5px] leading-relaxed text-white/40">Sınır dolunca araç çalışmaz; modele ne zaman yeniden deneyebileceği söylenir ve çağrı Kayıtlar sekmesinde sınıra takıldı diye görünür. Saat ve gün kotaları İstanbul saatine göre sıfırlanır.</p>
      </div>
    </Bolum>
  );
}

/** Araç değişiklikleri ve inceleme: sunucunun eklediği, değiştirdiği araçlar; açıklamasında enjeksiyon kalıbı olanlar. */
export function Inceleme({ b, yama, gidiyor }: { b: BaglantiAcik; yama: Yama; gidiyor: string | null }) {
  const l = b.incelenecek ?? [];
  const NEDEN = { yeni: "Sunucu yeni araç ekledi", degisti: "Açıklaması ya da girdileri değişti", enjeksiyon: "Açıklamasında modele talimat veren kalıp var" } as const;
  return (
    <Bolum baslik="Araç değişiklikleri" alt={l.length ? `${l.length} araç incelenmeyi bekliyor` : b.degisiklikler?.length ? `Son değişiklik ${gorece(b.degisiklikler[0].zaman)}` : "Sunucunun araç listesi her denemede karşılaştırılır"}
      sag={l.length > 1 ? <button type="button" onClick={() => yama({ incele: "hepsi" }, "incele")} disabled={!!gidiyor} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12]"><Check className="h-3.5 w-3.5" />Hepsini onayla</button> : undefined}>
      <Satir ad="Yeni araçları beklet" alt="Sunucu araç eklerse ya da tanımını değiştirirse araç sen onaylayana kadar kapalı kalır">
        <Anahtar acik={b.yeniAraclar === "beklet"} set={(v) => yama({ yeniAraclar: v ? "beklet" : "varsayilan" })} etiket="Yeni araçları beklet" />
      </Satir>
      {l.length > 0 && (
        <div className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
          {l.map((i) => (
            <div key={`${i.arac}-${i.neden}`} className="flex items-start gap-3 px-4 py-2.5">
              <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", i.neden === "enjeksiyon" ? "text-rose-300" : "text-amber-200")} />
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{aracAdi(b, i.arac)}</span><span className="block text-[11.5px] leading-snug text-white/50">{NEDEN[i.neden]}{i.ayrinti ? `: ${i.ayrinti}` : ""} · {gorece(i.zaman)}{b.izinler[i.arac] === "kapali" ? " · şu an kapalı" : ""}</span></span>
              <button type="button" onClick={() => yama({ incele: [i.arac] }, "incele")} disabled={!!gidiyor} className="h-8 shrink-0 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-50">Onayla</button>
            </div>
          ))}
        </div>
      )}
      {(b.degisiklikler ?? []).length > 0 && (
        <div className="divide-y divide-white/[0.04] border-t border-white/[0.06]">
          {b.degisiklikler!.slice(0, 5).map((d) => (
            <p key={d.zaman} className="px-4 py-2 text-[12px] leading-relaxed text-white/55"><span className="text-white/75">{gorece(d.zaman)}</span>{d.eklenen.length ? ` · eklenen: ${d.eklenen.slice(0, 6).join(", ")}${d.eklenen.length > 6 ? ` ve ${d.eklenen.length - 6} araç daha` : ""}` : ""}{d.degisen.length ? ` · değişen: ${d.degisen.slice(0, 6).join(", ")}` : ""}{d.cikan.length ? ` · kaldırılan: ${d.cikan.slice(0, 6).join(", ")}` : ""}</p>
          ))}
        </div>
      )}
    </Bolum>
  );
}

const YONTEM_RENK: Record<string, string> = { GET: "bg-white/[0.07] text-white/70", POST: "bg-[#55d6fd]/[0.12] text-[#8be6ff]", PUT: "bg-amber-400/[0.1] text-amber-200", PATCH: "bg-amber-400/[0.1] text-amber-200", DELETE: "bg-rose-500/[0.12] text-rose-200" };

/** REST bağlantısı: kök adres, OpenAPI kaynağı ve uç noktalar (ekle, sil, şemayı yenile). */
export function RestAyari({ b, yama, gidiyor }: { b: BaglantiAcik; yama: Yama; gidiyor: string | null }) {
  const r = b.rest!;
  const [taban, setTaban] = useState(r.taban);
  const [acik, setAcik] = useState(false);
  const [u, setU] = useState({ yontem: "GET", yol: "/", baslik: "", aciklama: "", sorgu: "" });
  const [ara, setAra] = useState("");
  const gorunen = r.islemler.filter((x) => !ara.trim() || `${x.ad} ${x.baslik} ${x.yol}`.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr")));
  const ekle = async () => {
    const parametreler = u.sorgu.split(",").map((x) => x.trim()).filter(Boolean).map((ad) => ({ ad, konum: "sorgu" }));
    if (await yama({ rest: { islemEkle: { yontem: u.yontem, yol: u.yol.trim(), baslik: u.baslik, aciklama: u.aciklama, parametreler } } }, "islem")) { setAcik(false); setU({ yontem: "GET", yol: "/", baslik: "", aciklama: "", sorgu: "" }); }
  };
  return (
    <Bolum baslik="REST API" alt={`${r.islemler.length} uç nokta${r.kaynak ? ` · OpenAPI ${r.surum ? `sürüm ${r.surum}` : "belgesinden"}` : " · elle eklendi"}`}
      sag={r.kaynak ? <button type="button" onClick={() => yama({ rest: { semaYenile: true } }, "sema")} disabled={!!gidiyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12] disabled:opacity-50">{gidiyor === "sema" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Şemayı yenile</button> : undefined}>
      <form className="flex gap-2 p-4" onSubmit={(e) => { e.preventDefault(); if (taban.trim() !== r.taban) yama({ rest: { taban } }, "taban"); }}>
        <input value={taban} onChange={(e) => setTaban(e.target.value)} spellCheck={false} aria-label="API kök adresi" className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} />
        <button type="submit" disabled={taban.trim() === r.taban || !!gidiyor} className="h-10 shrink-0 rounded-full bg-white/[0.08] px-4 text-[12.5px] text-white disabled:opacity-40">Kaydet</button>
      </form>
      <p className="-mt-2 px-4 pb-3 text-[11.5px] text-white/40">Kimlik: {r.yetki === "bearer" ? "Authorization: Bearer belirteç" : r.yetki === "baslik" ? `${r.anahtarAd} başlığı` : r.yetki === "sorgu" ? `${r.anahtarAd} sorgu parametresi` : r.yetki === "temel" ? "HTTP Basic (kullanıcı adı ve şifre)" : "yok"}{r.kaynak ? ` · kaynak ${r.kaynak.replace(/^https?:\/\//, "").slice(0, 60)}` : ""}</p>
      {r.islemler.length > 8 && <div className="px-4 pb-2"><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Uç nokta ara" className={cn(alanSinif, "h-9 text-[12.5px]")} /></div>}
      <div className="max-h-[300px] divide-y divide-white/[0.04] overflow-y-auto border-t border-white/[0.06] [scrollbar-width:thin]">
        {gorunen.slice(0, 200).map((x) => (
          <div key={x.ad} className="flex items-center gap-2.5 px-4 py-2">
            <span className={cn("w-[54px] shrink-0 rounded-full py-0.5 text-center text-[10.5px] font-semibold", YONTEM_RENK[x.yontem])}>{x.yontem}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-mono text-[12px] text-white/80">{x.yol}</span><span className="block truncate text-[11.5px] text-white/45">{x.baslik}</span></span>
            <button type="button" onClick={() => yama({ rest: { islemSil: x.ad } }, "islem")} aria-label={`${x.ad} uç noktasını kaldır`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {!gorunen.length && <p className="px-4 py-3 text-[12.5px] text-white/50">{r.islemler.length ? "Aramana uyan uç nokta yok." : "Henüz uç nokta yok. Servisin belgesindeki uç noktaları aşağıdan ekle."}</p>}
      </div>
      <div className="border-t border-white/[0.06] p-4">
        {!acik ? <button type="button" onClick={() => setAcik(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><Plus className="h-3.5 w-3.5" />Uç nokta ekle</button> : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select value={u.yontem} onChange={(e) => setU({ ...u, yontem: e.target.value })} aria-label="Yöntem" className={cn(alanSinif, "h-10 w-[104px] shrink-0 text-[13px]")}>{["GET", "POST", "PUT", "PATCH", "DELETE"].map((y) => <option key={y}>{y}</option>)}</select>
              <input value={u.yol} onChange={(e) => setU({ ...u, yol: e.target.value })} placeholder="/siparisler/{id}" spellCheck={false} className={cn(alanSinif, "h-10 font-mono text-[12.5px]")} />
            </div>
            <input value={u.baslik} onChange={(e) => setU({ ...u, baslik: e.target.value })} placeholder="Ne yapar, ör. Siparişi getir" className={cn(alanSinif, "h-10 text-[13px]")} />
            <input value={u.aciklama} onChange={(e) => setU({ ...u, aciklama: e.target.value })} placeholder="Model için açıklama (ne zaman kullanılır)" className={cn(alanSinif, "h-10 text-[13px]")} />
            <input value={u.sorgu} onChange={(e) => setU({ ...u, sorgu: e.target.value })} placeholder="Sorgu parametreleri, virgülle: sayfa, durum" spellCheck={false} className={cn(alanSinif, "h-10 text-[13px]")} />
            <p className="text-[11.5px] text-white/40">Yoldaki {"{ad}"} alanları kendiliğinden zorunlu girdi olur; POST, PUT ve PATCH için JSON gövde alanı eklenir.</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setAcik(false)} className="h-9 rounded-full px-3 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button><button type="button" onClick={ekle} disabled={!u.yol.startsWith("/") || !!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "islem" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Ekle</button></div>
          </div>
        )}
      </div>
    </Bolum>
  );
}

type UcSatir = { kullanici: string; durum: "etkin" | "giris-gerekli"; olusturma: number; guncelleme: number; sonKullanim?: number; cagri: number; yontem: "oauth" | "anahtar" };
/** Uç kullanıcı hesapları: kip, kullanıcılar, bağlanma adresi üretme, geliştirici kullanımı. */
export function UcHesaplar({ b, yama }: { b: BaglantiAcik; yama: Yama }) {
  const [l, setL] = useState<UcSatir[] | null>(null);
  const [kim, setKim] = useState("");
  const [adres, setAdres] = useState("");
  const [hata, setHata] = useState("");
  const yukle = () => api<{ kullanicilar: UcSatir[] }>(`/api/build/baglantilar/${b.id}/uc`).then((v) => setL(v.kullanicilar)).catch(() => setL([]));
  useEffect(() => { yukle(); }, [b.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const acik = !!b.ucKullanici?.acik;
  const link = async () => {
    setHata(""); setAdres("");
    try { setAdres((await api<{ adres: string }>(`/api/build/baglantilar/${b.id}/uc`, { govde: { kullanici: kim.trim() } })).adres); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Adres üretilemedi."); }
  };
  return (
    <Bolum baslik="Kullanıcı hesapları" alt={acik ? `${l?.length ?? 0} kullanıcı kendi hesabını bağladı` : "Kapalı: çağrılar senin hesabınla yapılır"}>
      <Satir ad="Her kullanıcı kendi hesabını bağlasın" alt="Uygulamanı ya da yayındaki ajanını kullanan kişiler bu servise kendi hesaplarıyla bağlanır; onların çağrılarında senin anahtarın hiç kullanılmaz">
        <Anahtar acik={acik} set={(v) => yama({ ucKullanici: { acik: v } })} etiket="Kullanıcı hesapları" />
      </Satir>
      {acik && (
        <div className="space-y-3 border-t border-white/[0.06] p-4">
          <div className="flex gap-2">
            <input value={kim} onChange={(e) => setKim(e.target.value.replace(/[^\w.@:+-]/g, "").slice(0, 128))} placeholder="Kullanıcı kimliği, ör. musteri-42" className={cn(alanSinif, "h-10 text-[13px]")} />
            <button type="button" onClick={link} disabled={!kim.trim()} className="h-10 shrink-0 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">Bağlanma adresi</button>
          </div>
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
          {adres && <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate rounded-[12px] bg-black/30 px-3 py-2 text-[12px] text-white/80 ring-1 ring-inset ring-white/[0.06]">{adres}</code><Kopyala metin={adres} etiket="Adresi kopyala" /></div>}
          <p className="text-[11.5px] leading-relaxed text-white/45">Adres 4 saat geçerlidir. Uygulaman araçları MCP ağ geçidi üzerinden çağırırken kullanıcının kimliğini X-Vayra-Kullanici başlığında gönderir; hesabı bağlı değilse araç yanıtı bağlanma adresini içerir. Adresi sunucundan üretmek için ağ geçidi anahtarıyla POST /api/build/baglantilar/gecit/baglanma çağır: {"{"}"baglantiId": "{b.id}", "kullanici": "musteri-42"{"}"}.</p>
          {l && l.length > 0 && (
            <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
              {l.map((u) => (
                <div key={u.kullanici} className="flex items-center gap-3 px-3 py-2">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", u.durum === "etkin" ? "bg-[#55d6fd]" : "bg-amber-300")} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{u.kullanici}</span><span className="block text-[11.5px] text-white/45">{u.yontem === "oauth" ? "Hesapla giriş" : "Anahtar"} · {u.cagri} çağrı · {u.sonKullanim ? `son ${gorece(u.sonKullanim)}` : `${gorece(u.olusturma)} bağlandı`}{u.durum !== "etkin" ? " · yeniden bağlanmalı" : ""}</span></span>
                  <button type="button" onClick={async () => { await api(`/api/build/baglantilar/${b.id}/uc?kullanici=${encodeURIComponent(u.kullanici)}`, { method: "DELETE" }).catch(() => {}); yukle(); }} aria-label={`${u.kullanici} hesabını kaldır`} className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Bolum>
  );
}
