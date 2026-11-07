"use client";

import { useMemo, useRef, useState } from "react";
import { Code2, ImagePlus, MessageSquareHeart, Palette, Plus, Route, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Anahtar, KodKutusu, Secici, alanSinif, kareGorsel } from "./AjanDuzenleyici";
import { GenelSohbet, fontAile, fontYukle, ustRenk, type GenelBilgi } from "./GenelSohbet";
import { BolumBaslik, bolumSinif } from "./Kanallar";
import { SayiSecici } from "./KurulumEk";
import { AyarSatiri, ikincil, type Ajan } from "./ortak";
const DOSYA_TURLERI: { id: "gorsel" | "pdf" | "belge"; ad: string }[] = [{ id: "gorsel", ad: "Görsel" }, { id: "pdf", ad: "PDF" }, { id: "belge", ad: "TXT, CSV, DOCX, XLSX" }];

type D = (p: Partial<Ajan>) => void;
const VURGULAR = ["#55d6fd", "#ffffff", "#a78bfa", "#34d399", "#fb923c", "#f472b6"];
const ALANLAR = [{ id: "ad", ad: "Ad" }, { id: "eposta", ad: "E-posta" }, { id: "telefon", ad: "Telefon" }] as const;

/** Sahte site üstünde kutunun canlı önizlemesi: kapalıyken başlatıcı ve balon, açıkken sohbet paneli (gerçek bileşen). */
function Onizleme({ a, acik }: { a: Ajan; acik: boolean }) {
  const k = a.yayin.kutu, v = a.yayin.tema.vurgu, sol = k.konum === "sol";
  const bilgi: GenelBilgi = useMemo(() => ({
    ajan: { id: a.id, ad: a.ad, aciklama: a.aciklama, simge: a.simge, karsilama: a.karsilama, baslangiclar: k.oneriler ? a.baslangiclar : [] },
    tema: a.yayin.tema, kutu: { font: k.font, ozelFont: k.ozelFont, konum: k.konum, bosluk: k.bosluk, baslatici: k.baslatici, baslik: k.baslik, proaktif: k.proaktif, form: k.form, aciklama: k.aciklama, gizlilik: k.gizlilik, ses: k.ses, csat: k.csat, begeni: k.begeni, kurallar: k.kurallar, dosya: k.dosya?.acik ? { acik: true, enCokMb: k.dosya.enCokMb, turler: k.dosya.turler, kabul: "" } : undefined },
  }), [a, k]);
  fontYukle(k);
  const b = Math.round(k.bosluk * 0.6);
  const etiketli = k.baslatici.tur === "etiket" && !!k.baslatici.etiket;
  const simge = k.baslatici.tur === "gorsel" && k.baslatici.gorsel ? k.baslatici.gorsel : a.simge;
  return (
    <div className="relative h-[470px] overflow-hidden rounded-[18px] bg-[#e9eaee] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex h-8 items-center gap-1.5 bg-[#d9dbe0] px-3"><span className="h-2.5 w-2.5 rounded-full bg-black/15" /><span className="h-2.5 w-2.5 rounded-full bg-black/15" /><span className="h-2.5 w-2.5 rounded-full bg-black/15" /><span className="ml-3 h-4 flex-1 rounded-full bg-white/70" /></div>
      <div className="space-y-3 p-5" aria-hidden>
        <div className="h-5 w-40 rounded-full bg-black/[0.12]" /><div className="h-24 rounded-[14px] bg-black/[0.07]" />
        <div className="grid grid-cols-3 gap-3"><div className="h-16 rounded-[12px] bg-black/[0.06]" /><div className="h-16 rounded-[12px] bg-black/[0.06]" /><div className="h-16 rounded-[12px] bg-black/[0.06]" /></div>
        <div className="h-3 w-3/4 rounded-full bg-black/[0.08]" /><div className="h-3 w-1/2 rounded-full bg-black/[0.08]" />
      </div>
      {acik ? (
        <div className={cn("absolute overflow-hidden rounded-[14px] ring-1 ring-black/10", sol ? "origin-bottom-left" : "origin-bottom-right")}
          style={{ [sol ? "left" : "right"]: b, bottom: b + 44, width: 400, height: 600, transform: "scale(0.6)" }}>
          <GenelSohbet id={a.id} kutu onizleme={bilgi} />
        </div>
      ) : k.proaktif.acik && k.proaktif.metin ? (
        <div className={cn("absolute max-w-[220px] rounded-[14px] px-3 py-2 text-[12.5px] leading-snug ring-1", a.yayin.tema.koyu ? "bg-[#161618] text-white ring-white/10" : "bg-white text-[#16161a] ring-black/10")} style={{ [sol ? "left" : "right"]: b, bottom: b + 52, fontFamily: fontAile(k) }}>{k.proaktif.metin}</div>
      ) : null}
      <div className="absolute flex items-center gap-1.5 rounded-full" style={{ [sol ? "left" : "right"]: b, bottom: b, background: v, color: ustRenk(v), padding: etiketli ? "3px 12px 3px 3px" : 2, fontFamily: fontAile(k) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {acik ? <span className="flex h-[34px] w-[34px] items-center justify-center"><X className="h-4 w-4" /></span> : <img src={simge} alt="" className="h-[34px] w-[34px] rounded-full object-cover" />}
        {etiketli && !acik && <span className="text-[12.5px] font-semibold">{k.baslatici.etiket}</span>}
      </div>
    </div>
  );
}

/** Sayfa kuralları: ziyaretçinin bulunduğu sayfanın yoluna göre karşılama balonu başka metinle çıkar. */
function SayfaKurallari({ k, kd }: { k: Ajan["yayin"]["kutu"]; kd: (p: Partial<Ajan["yayin"]["kutu"]>) => void }) {
  const [yol, setYol] = useState("");
  const [metin, setMetin] = useState("");
  const l = k.kurallar ?? [];
  const ekle = () => { if (!yol.trim() || !metin.trim()) return; kd({ kurallar: [...l, { yol: yol.trim().startsWith("/") ? yol.trim() : `/${yol.trim()}`, metin: metin.trim() }].slice(0, 12) }); setYol(""); setMetin(""); };
  return (
    <div className="space-y-2 px-4 py-3 sm:px-5">
      <p className="flex items-center gap-2 text-[13.5px] font-medium text-white"><Route className="h-3.5 w-3.5 text-white/55" />Sayfa kuralları</p>
      <p className="-mt-1 text-[12px] leading-relaxed text-white/45">Ziyaretçi bu yollardan birindeyse balon bu metinle çıkar; ilk eşleşen kural geçerli. Yıldız her şeyle eşleşir, örneğin /urun/*.</p>
      {l.length > 0 && (
        <ul className="space-y-1.5">
          {l.map((x, i) => (
            <li key={`${x.yol}-${i}`} className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] py-1.5 pl-3 pr-1 text-[13px] ring-1 ring-inset ring-white/[0.07]">
              <span className="sc-kod shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] text-white/80">{x.yol}</span>
              <span className="min-w-0 flex-1 truncate text-white/80">{x.metin}</span>
              <button type="button" onClick={() => kd({ kurallar: l.filter((_, j) => j !== i) })} aria-label="Kuralı kaldır" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.1] hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
      <form className="grid gap-2 sm:grid-cols-[150px_1fr_auto]" onSubmit={(e) => { e.preventDefault(); ekle(); }}>
        <input value={yol} onChange={(e) => setYol(e.target.value)} maxLength={120} placeholder="/fiyatlar" className={cn(alanSinif, "sc-kod h-9 text-[13px]")} />
        <input value={metin} onChange={(e) => setMetin(e.target.value)} maxLength={160} placeholder="Paketler hakkında soru sormak ister misin?" className={cn(alanSinif, "h-9 text-[13px]")} />
        <button type="submit" disabled={!yol.trim() || !metin.trim()} className={cn(ikincil, "h-9")}><Plus className="h-3.5 w-3.5" />Ekle</button>
      </form>
    </div>
  );
}

/** Yayın panelinin "Web kutusu" bölümü: görünüm, başlatıcı, balon, form, açıklama, izinli alanlar ve canlı önizleme. */
export function KutuAyarlari({ a, d, koken }: { a: Ajan; d: D; koken: string }) {
  const [acik, setAcik] = useState(true);
  const [alanlar, setAlanlar] = useState(a.yayin.alanlar.join(", "));
  const gorsel = useRef<HTMLInputElement>(null);
  const k = a.yayin.kutu;
  const kd = (p: Partial<Ajan["yayin"]["kutu"]>) => d({ yayin: { ...a.yayin, kutu: { ...k, ...p } } });
  const tema = (p: Partial<Ajan["yayin"]["tema"]>) => d({ yayin: { ...a.yayin, tema: { ...a.yayin.tema, ...p } } });
  return (
    <div className="space-y-3">
      <section className={bolumSinif}>
        <BolumBaslik ikon={Code2} baslik="Web sitene ekle" sag={<Anahtar acik={a.yayin.kanallar.widget} set={(v) => d({ yayin: { ...a.yayin, kanallar: { ...a.yayin.kanallar, widget: v } } })} etiket="Web sitesi kutusu" />} />
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2"><p className="flex-1 text-[12.5px] text-white/55">Canlı önizleme · değişiklik anında görünür, yayınla dendiğinde sitene gelir</p><Secici id="kutu-onizleme" kucuk deger={acik ? "acik" : "kapali"} set={(v) => setAcik(v === "acik")} l={[{ id: "kapali", ad: "Kapalı" }, { id: "acik", ad: "Açık" }]} /></div>
          <Onizleme a={a} acik={acik} />
          <KodKutusu kod={`<script src="${koken}/ajan-kutusu.js" data-ajan="${a.id}" async></script>`} />
          <p className="text-[12px] leading-relaxed text-white/45">Bu satırı sitenin body bölümüne yapıştır. Vayra Build sitelerinde de çalışır. Renk ve tema paylaşım sayfasında da geçerlidir.</p>
        </div>
      </section>
      <section className={bolumSinif}>
        <BolumBaslik ikon={Palette} baslik="Görünüm" />
        <div className="divide-y divide-white/[0.05]">
          <AyarSatiri baslik="Renk">
            <div className="flex flex-wrap items-center gap-1.5">
              {VURGULAR.map((v) => <button key={v} type="button" onClick={() => tema({ vurgu: v })} aria-label={v} className={cn("h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-[#141416]", a.yayin.tema.vurgu === v ? "ring-white" : "ring-transparent")} style={{ background: v }} />)}
              <label className={cn("relative flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] ring-1 ring-inset", VURGULAR.includes(a.yayin.tema.vurgu) ? "text-white/60 ring-white/[0.12]" : "text-white ring-white")}>
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: a.yayin.tema.vurgu }} />Özel
                <input type="color" value={a.yayin.tema.vurgu} onChange={(e) => tema({ vurgu: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
              </label>
            </div>
          </AyarSatiri>
          <AyarSatiri baslik="Tema"><Secici id="kutu-tema" kucuk deger={a.yayin.tema.koyu ? "koyu" : "acik"} set={(v) => tema({ koyu: v === "koyu" })} l={[{ id: "koyu", ad: "Koyu" }, { id: "acik", ad: "Açık" }]} /></AyarSatiri>
          <AyarSatiri baslik="Yazı tipi" alt={k.font === "ozel" ? "Google Fonts'taki adını yaz" : undefined}>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Secici id="kutu-font" kucuk deger={k.font} set={(v) => kd({ font: v })} l={[{ id: "sistem", ad: "Sistem" }, { id: "inter", ad: "Inter" }, { id: "serif", ad: "Serif" }, { id: "yuvarlak", ad: "Yuvarlak" }, { id: "ozel", ad: "Özel" }]} />
              {k.font === "ozel" && <input value={k.ozelFont} onChange={(e) => kd({ ozelFont: e.target.value })} maxLength={40} placeholder="Örneğin Poppins" className={cn(alanSinif, "h-8 w-[150px] text-[13px]")} />}
            </div>
          </AyarSatiri>
          <AyarSatiri baslik="Konum"><Secici id="kutu-konum" kucuk deger={k.konum} set={(v) => kd({ konum: v })} l={[{ id: "sol", ad: "Sol alt" }, { id: "sag", ad: "Sağ alt" }]} /></AyarSatiri>
          <AyarSatiri baslik="Kenar boşluğu"><SayiSecici id="kutu-bosluk" deger={k.bosluk} set={(v) => kd({ bosluk: v })} hazir={[12, 20, 32]} birim="piksel" /></AyarSatiri>
          <AyarSatiri baslik="Başlık" alt="Boşsa ajanın adı"><input value={k.baslik} onChange={(e) => kd({ baslik: e.target.value })} maxLength={60} placeholder={a.ad} className={cn(alanSinif, "h-9 w-[200px] text-[13px]")} /></AyarSatiri>
        </div>
      </section>
      <section className={bolumSinif}>
        <BolumBaslik ikon={MessageSquareHeart} baslik="Sohbet özellikleri" />
        <div className="divide-y divide-white/[0.05]">
          <AyarSatiri baslik="Sesli sohbet" alt="Kutuda ve paylaşım sayfasında mikrofon düğmesi ve sesli mod çıkar; konuşma tarayıcının ses tanımasıyla yazıya döner, yanıtlar Türkçe sesle okunur. Chrome, Edge ve Safari destekler; desteklemeyen tarayıcıda düğme görünmez."><Anahtar acik={k.ses} set={(v) => kd({ ses: v })} etiket="Sesli sohbet" /></AyarSatiri>
          <AyarSatiri baslik="Memnuniyet anketi" alt="Konuşma çözülünce ya da ziyaretçi yanıttan sonra bir süre yazmayınca 1 ile 5 arasında puan ve isteğe bağlı yorum ister. Telegram, WhatsApp ve diğer mesajlaşma kanallarında temsilci çözüldü deyince rakamla sorulur."><Anahtar acik={k.csat} set={(v) => kd({ csat: v })} etiket="Memnuniyet anketi" /></AyarSatiri>
          <AyarSatiri baslik="Mesaj beğenisi" alt="Her yanıtın altında yararlı ve yararlı değil düğmeleri; sonuçlar analitikte görünür."><Anahtar acik={k.begeni} set={(v) => kd({ begeni: v })} etiket="Mesaj beğenisi" /></AyarSatiri>
        </div>
      </section>
      <section className={bolumSinif}>
        <BolumBaslik baslik="Başlatıcı ve karşılama" />
        <div className="divide-y divide-white/[0.05]">
          <AyarSatiri baslik="Düğme">
            <Secici id="kutu-baslatici" kucuk deger={k.baslatici.tur} set={(v) => kd({ baslatici: { ...k.baslatici, tur: v } })} l={[{ id: "simge", ad: "Simge" }, { id: "etiket", ad: "Etiketli" }, { id: "gorsel", ad: "Görsel" }]} />
          </AyarSatiri>
          {k.baslatici.tur === "etiket" && <AyarSatiri baslik="Etiket"><input value={k.baslatici.etiket} onChange={(e) => kd({ baslatici: { ...k.baslatici, etiket: e.target.value } })} maxLength={30} placeholder="Sohbet et" className={cn(alanSinif, "h-9 w-[200px] text-[13px]")} /></AyarSatiri>}
          {k.baslatici.tur === "gorsel" && (
            <AyarSatiri baslik="Görsel" alt="Kare görsel; 256 piksele küçültülür">
              <span className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {k.baslatici.gorsel && <img src={k.baslatici.gorsel} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10" />}
                <button type="button" onClick={() => gorsel.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]"><ImagePlus className="h-3.5 w-3.5" />{k.baslatici.gorsel ? "Değiştir" : "Yükle"}</button>
                <input ref={gorsel} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const u = await kareGorsel(f); if (u) kd({ baslatici: { ...k.baslatici, gorsel: u } }); }} />
              </span>
            </AyarSatiri>
          )}
          <AyarSatiri baslik="Başlangıç önerileri" alt="Kurulum'daki Sohbet açılışı önerileri kutuda görünsün"><Anahtar acik={k.oneriler} set={(v) => kd({ oneriler: v })} etiket="Önerileri göster" /></AyarSatiri>
          <AyarSatiri baslik="Karşılama balonu" alt="Ziyaretçi sitede biraz kalınca düğmenin üstünde çıkar; oturumda bir kez"><Anahtar acik={k.proaktif.acik} set={(v) => kd({ proaktif: { ...k.proaktif, acik: v } })} etiket="Karşılama balonu" /></AyarSatiri>
          {k.proaktif.acik && (
            <div className="space-y-2 px-4 py-3 sm:px-5">
              <input value={k.proaktif.metin} onChange={(e) => kd({ proaktif: { ...k.proaktif, metin: e.target.value } })} maxLength={160} placeholder="Merhaba! Yardımcı olabileceğim bir şey var mı?" className={cn(alanSinif, "h-9 text-[13px]")} />
              <div className="flex flex-wrap items-center gap-2"><span className="flex-1 text-[12.5px] text-white/55">Gecikme</span><SayiSecici id="kutu-gecikme" deger={k.proaktif.gecikme} set={(v) => kd({ proaktif: { ...k.proaktif, gecikme: v } })} hazir={[3, 8, 15]} birim="saniye" /></div>
            </div>
          )}
          {k.proaktif.acik && <SayfaKurallari k={k} kd={kd} />}
        </div>
      </section>
      <section className={bolumSinif}>
        <BolumBaslik baslik="Form, açıklama ve güvenlik" />
        <div className="divide-y divide-white/[0.05]">
          <AyarSatiri baslik="Sohbet öncesi form" alt="Ziyaretçi yazmadan önce iletişim bilgisini bırakır; Konuşmalar'da görünür"><Anahtar acik={k.form.acik} set={(v) => kd({ form: { ...k.form, acik: v } })} etiket="Sohbet öncesi form" /></AyarSatiri>
          {k.form.acik && (
            <div className="space-y-2 px-4 py-3 sm:px-5">
              <input value={k.form.baslik} onChange={(e) => kd({ form: { ...k.form, baslik: e.target.value } })} maxLength={100} placeholder="Başlamadan önce seni tanıyalım" className={cn(alanSinif, "h-9 text-[13px]")} />
              <div className="flex flex-wrap gap-1.5">{ALANLAR.map((x) => { const var_ = k.form.alanlar.includes(x.id); return <button key={x.id} type="button" onClick={() => kd({ form: { ...k.form, alanlar: var_ ? k.form.alanlar.filter((y) => y !== x.id) : [...k.form.alanlar, x.id] } })} className={cn("h-8 rounded-full px-3 text-[12.5px] ring-1 ring-inset", var_ ? "bg-white/[0.1] text-white ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>{x.ad}</button>; })}</div>
            </div>
          )}
          <AyarSatiri baslik="Dosya yükleme" alt="Ziyaretçi sohbete görsel ya da belge ekleyebilir; tür içerikten doğrulanır, dosyalar tahmin edilemez adreste saklanır"><Anahtar acik={!!k.dosya?.acik} set={(v) => kd({ dosya: { enCokMb: 5, turler: ["gorsel", "pdf"], ...(k.dosya ?? {}), acik: v } })} etiket="Dosya yükleme" /></AyarSatiri>
          {k.dosya?.acik && (
            <div className="space-y-2.5 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap gap-1.5">{DOSYA_TURLERI.map((x) => { const var_ = k.dosya!.turler.includes(x.id); return <button key={x.id} type="button" aria-pressed={var_} onClick={() => { const l = var_ ? k.dosya!.turler.filter((y) => y !== x.id) : [...k.dosya!.turler, x.id]; if (l.length) kd({ dosya: { ...k.dosya!, turler: l } }); }} className={cn("h-8 rounded-full px-3 text-[12.5px] ring-1 ring-inset", var_ ? "bg-white/[0.1] text-white ring-white" : "bg-white/[0.04] text-white/60 ring-white/[0.08] hover:text-white")}>{x.ad}</button>; })}</div>
              <div className="flex flex-wrap items-center gap-2"><span className="flex-1 text-[12.5px] text-white/55">Dosya başına en çok</span><SayiSecici id="kutu-dosya-mb" deger={k.dosya.enCokMb} set={(v) => kd({ dosya: { ...k.dosya!, enCokMb: Math.min(10, Math.max(1, v)) } })} hazir={[2, 5, 10]} birim="MB" /></div>
            </div>
          )}
          <AyarSatiri baslik="Yapay zekâ açıklaması" alt="Yazma kutusunun altında görünür"><input value={k.aciklama} onChange={(e) => kd({ aciklama: e.target.value })} maxLength={200} className={cn(alanSinif, "h-9 w-full text-[13px] sm:w-[260px]")} /></AyarSatiri>
          <AyarSatiri baslik="Gizlilik bağlantısı" alt="https ile başlayan adres"><input value={k.gizlilik} onChange={(e) => kd({ gizlilik: e.target.value })} maxLength={300} placeholder="https://sirketim.com/gizlilik" className={cn(alanSinif, "h-9 w-full text-[13px] sm:w-[260px]")} /></AyarSatiri>
          <div className="px-4 py-3 sm:px-5">
            <p className="text-[13.5px] font-medium text-white">İzinli alan adları</p>
            <p className="mb-2 mt-0.5 text-[12px] leading-relaxed text-white/45">Kutu yalnız bu sitelerde açılır; boşsa her yerde. Alt alan adları için *.sirketim.com yaz.</p>
            <input value={alanlar} onChange={(e) => setAlanlar(e.target.value)} onBlur={() => d({ yayin: { ...a.yayin, alanlar: alanlar.split(/[\s,]+/).filter(Boolean) } })} placeholder="sirketim.com, *.sirketim.com" className={cn(alanSinif, "h-10 text-[13.5px]")} />
          </div>
        </div>
      </section>
    </div>
  );
}
