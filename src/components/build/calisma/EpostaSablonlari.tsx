"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, Mail, Palette, RotateCcw, Send } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi } from "@/lib/build/istemci";
import {
  DEGISKENLER, EPOSTA_TURLERI, SINIR, VARSAYILAN_SABLON, epostaHtml, renkGecerli, sablonDoldur, sablonTamamla,
  type EpostaAyar, type EpostaSablon, type EpostaTur,
} from "@/lib/build/epostaSablon";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

const RENKLER = ["#111111", "#1e9fcf", "#2f6fed", "#16a34a", "#c2410c", "#be123c", "#7c3aed", "#a16207"];
const dugme = "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px]";

/**
 * Üyelere giden e-postaların şablonları: doğrulama, giriş bağlantısı, şifre sıfırlama. Konu, metin ve düğme yazısı
 * değişkenlerle ({site}, {ad}, {eposta}, {sure}) düzenlenir; marka rengi, logo ve alt yazı hepsine uygulanır.
 * Sağda gerçek gönderilecek HTML'in canlı önizlemesi ve kendine deneme gönderimi.
 */
export function EpostaSablonlari({ p, ayar, kurulu, kaydet }: { p: Proje; ayar?: EpostaAyar; kurulu: boolean; kaydet: (a: Record<string, unknown>) => Promise<unknown> }) {
  const [tur, setTur] = useState<EpostaTur>("dogrula");
  const kayitli = useMemo(() => sablonTamamla(ayar, tur), [ayar, tur]);
  const [s, setS] = useState<EpostaSablon>(kayitli.sablon);
  const [renk, setRenk] = useState(kayitli.marka.renk);
  const [logo, setLogo] = useState(ayar?.marka?.logo ?? "");
  const [altYazi, setAltYazi] = useState(ayar?.marka?.altYazi ?? "");
  const [is, setIs] = useState("");
  const [kaydedildi, setKaydedildi] = useState("");
  const [kime, setKime] = useState("");
  const [deneme, setDeneme] = useState<{ ok: boolean; m: string } | null>(null);
  const metinAlani = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setS(sablonTamamla(ayar, tur).sablon); setDeneme(null); }, [tur, ayar]);

  const turBilgi = EPOSTA_TURLERI.find((t) => t.id === tur)!;
  const ozel = !!ayar?.sablonlar?.[tur];
  const degisti = s.konu !== kayitli.sablon.konu || s.metin !== kayitli.sablon.metin || s.dugme !== kayitli.sablon.dugme;
  const markaDegisti = renk !== kayitli.marka.renk || logo !== (ayar?.marka?.logo ?? "") || altYazi !== (ayar?.marka?.altYazi ?? "");
  const logoHatali = !!logo && !/^https:\/\/\S{4,}$/.test(logo);
  const veri = { site: p.ad, ad: "Deniz", eposta: "deniz@posta.com", sure: turBilgi.sure };
  const html = useMemo(() => epostaHtml({ site: p.ad, metin: sablonDoldur(s.metin, veri), dugme: { ad: sablonDoldur(s.dugme, veri), adres: `${typeof location === "undefined" ? "" : location.origin}/api/build/uye/${p.id}/${tur === "sifre" ? "sifirla" : tur}?t=…` }, marka: { renk: renkGecerli(renk) ? renk : "#111111", logo: logoHatali ? undefined : logo || undefined, altYazi: altYazi || undefined } }), [s, renk, logo, altYazi, p.ad, tur]); // eslint-disable-line react-hooks/exhaustive-deps

  const isle = async (anahtar: string, f: () => Promise<unknown>) => { setIs(anahtar); try { await f(); setKaydedildi(anahtar); setTimeout(() => setKaydedildi(""), 1600); } finally { setIs(""); } };
  const sablonKaydet = () => isle("sablon", () => kaydet({ eposta: { sablonlar: { [tur]: s } } }));
  const varsayilan = () => isle("sifirla", async () => { setS(VARSAYILAN_SABLON[tur]); await kaydet({ eposta: { sablonlar: { [tur]: null } } }); });
  const markaKaydet = () => isle("marka", () => kaydet({ eposta: { marka: { renk, logo: logoHatali ? "" : logo, altYazi } } }));
  const degiskenEkle = (d: string) => {
    const el = metinAlani.current;
    const i = el?.selectionStart ?? s.metin.length, j = el?.selectionEnd ?? i;
    setS({ ...s, metin: (s.metin.slice(0, i) + d + s.metin.slice(j)).slice(0, SINIR.metin) });
    setTimeout(() => { el?.focus(); el?.setSelectionRange(i + d.length, i + d.length); }, 0);
  };
  const denemeGonder = async () => {
    setIs("dene"); setDeneme(null);
    try { await api(`/api/build/uye/${p.id}/yonetim`, { govde: { islem: "epostaDene", tur, kime } }); setDeneme({ ok: true, m: `Deneme e-postası ${kime} adresine gönderildi. Kaydedilmemiş değişiklikler denemede yok.` }); }
    catch (e) { setDeneme({ ok: false, m: e instanceof ApiHatasi ? e.message : "Gönderilemedi." }); }
    finally { setIs(""); }
  };
  const kaydetDugmesi = (anahtar: string, aktif: boolean, f: () => void, ad = "Kaydet") => kaydedildi === anahtar
    ? <span className="flex items-center gap-1 text-[12.5px] text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Kaydedildi</span>
    : <button type="button" disabled={!aktif || !!is} onClick={f} className={cn(dugme, "h-8 bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-35")}>{is === anahtar && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{ad}</button>;

  return (
    <div className="space-y-4">
      {!kurulu && (
        <p className="flex items-start gap-2.5 rounded-[16px] bg-amber-400/[0.05] px-4 py-3 text-[12.5px] leading-relaxed text-amber-100/90 ring-1 ring-inset ring-amber-300/15">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />Bu sunucuda e-posta servisi kurulu değil. Şablonları şimdi düzenleyip önizleyebilirsin; servis kurulunca üyelere bu hâliyle gider.
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="space-y-4">
          <Kart ikon={Mail} baslik="Şablon" alt={`${turBilgi.alt}; bağlantı ${turBilgi.sure} geçerli`} sag={ozel ? <button type="button" disabled={!!is} onClick={varsayilan} title="Varsayılan metne dön" className={cn(dugme, "h-8 bg-white/[0.07] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.12]")}>{is === "sifirla" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Varsayılana dön</span></button> : undefined} govde="space-y-3.5 p-4 sm:p-5">
            <div className="max-w-full overflow-x-auto [scrollbar-width:none]"><Secici id="eposta-tur" deger={tur} set={setTur} l={EPOSTA_TURLERI.map((t) => ({ id: t.id, ad: t.ad }))} /></div>
            <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Konu</span>
              <input value={s.konu} maxLength={SINIR.konu} onChange={(e) => setS({ ...s, konu: e.target.value })} className={cn(alanSinif, "h-10 text-[13.5px]")} /></label>
            <label className="block"><span className="mb-1.5 flex items-center justify-between text-[12.5px] text-white/55"><span>Metin</span><span className="tabular-nums text-white/35">{s.metin.length} / {SINIR.metin}</span></span>
              <textarea ref={metinAlani} value={s.metin} maxLength={SINIR.metin} rows={7} onChange={(e) => setS({ ...s, metin: e.target.value })} className={cn(alanSinif, "resize-y py-2.5 text-[13.5px] leading-relaxed")} /></label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] text-white/45">Değişken ekle:</span>
              {DEGISKENLER.map((d) => <button key={d} type="button" onClick={() => degiskenEkle(d)} className="h-7 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/75 hover:bg-white/[0.1] hover:text-white">{d === "{site}" ? "Site adı" : d === "{ad}" ? "Üyenin adı" : d === "{eposta}" ? "E-posta" : "Geçerlilik süresi"}</button>)}
            </div>
            <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Düğme yazısı</span>
              <input value={s.dugme} maxLength={SINIR.dugme} onChange={(e) => setS({ ...s, dugme: e.target.value })} className={cn(alanSinif, "h-10 max-w-[320px] text-[13.5px]")} /></label>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
              {degisti && <button type="button" onClick={() => setS(kayitli.sablon)} className={cn(dugme, "h-8 bg-white/[0.06] px-3 text-[12.5px] text-white/75")}>Vazgeç</button>}
              {kaydetDugmesi("sablon", degisti && !!s.konu.trim() && !!s.metin.trim() && !!s.dugme.trim(), sablonKaydet)}
            </div>
          </Kart>
          <Kart ikon={Palette} baslik="Marka" alt="Üç e-postada da kullanılır" govde="space-y-3.5 p-4 sm:p-5">
            <div>
              <span className="mb-1.5 block text-[12.5px] text-white/55">Düğme ve şerit rengi</span>
              <div className="flex flex-wrap items-center gap-2">
                {RENKLER.map((r) => <button key={r} type="button" aria-label={`Renk ${r}`} onClick={() => setRenk(r)} className={cn("h-8 w-8 rounded-full ring-inset", renk.toLowerCase() === r ? "ring-2 ring-white" : "ring-1 ring-white/15")} style={{ background: r }} />)}
                <label className={cn("relative flex h-8 items-center gap-2 rounded-full bg-white/[0.06] pl-1 pr-3 text-[12.5px] text-white/75 ring-inset", !RENKLER.includes(renk.toLowerCase()) ? "ring-2 ring-white" : "ring-1 ring-white/[0.08]")}>
                  <input type="color" value={renkGecerli(renk) ? renk : "#111111"} onChange={(e) => setRenk(e.target.value)} className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Özel renk" />Özel
                </label>
              </div>
            </div>
            <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Logo adresi (isteğe bağlı, https)</span>
              <input value={logo} onChange={(e) => setLogo(e.target.value.trim())} placeholder="https://…/logo.png" className={cn(alanSinif, "h-10 text-[13px]", logoHatali && "ring-rose-400/50")} />
              <span className={cn("mt-1 block text-[11.5px]", logoHatali ? "text-rose-300" : "text-white/40")}>{logoHatali ? "Logo adresi https ile başlamalı; e-posta programları başka adresi göstermez." : "Boş kalırsa üstte sitenin adı yazar."}</span></label>
            <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Alt yazı (isteğe bağlı)</span>
              <input value={altYazi} maxLength={SINIR.altYazi} onChange={(e) => setAltYazi(e.target.value)} placeholder="Kadıköy, İstanbul · destek@siten.com" className={cn(alanSinif, "h-10 text-[13px]")} /></label>
            <div className="flex justify-end border-t border-white/[0.06] pt-3">{kaydetDugmesi("marka", markaDegisti && !logoHatali, markaKaydet)}</div>
          </Kart>
        </div>
        <Kart ikon={Mail} baslik="Önizleme" alt="Üyeye gidecek e-posta; bağlantılar burada çalışmaz">
          <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
            <p className="text-[11.5px] text-white/40">Kimden: {p.ad}</p>
            <p className="mt-0.5 truncate text-[13.5px] font-medium text-white">{sablonDoldur(s.konu, veri) || "Konu yok"}</p>
          </div>
          <iframe title="E-posta önizlemesi" srcDoc={html} sandbox="" className="block h-[460px] w-full border-0 bg-[#f4f5f7]" />
          <div className="space-y-2 border-t border-white/[0.06] p-4 sm:px-5">
            <p className="text-[12.5px] text-white/55">Kendine deneme gönder (kayıtlı şablonla)</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); denemeGonder(); }}>
              <input value={kime} onChange={(e) => setKime(e.target.value)} type="email" placeholder="e-posta adresin" className={cn(alanSinif, "h-10 min-w-0 flex-1 text-[13px]")} />
              <button type="submit" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kime) || !!is} className={cn(dugme, "h-10 shrink-0 bg-white/[0.08] text-white hover:bg-white/[0.13] disabled:opacity-40")}>{is === "dene" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Gönder</button>
            </form>
            {deneme && <p className={cn("text-[12.5px]", deneme.ok ? "text-[#8be6ff]" : "text-rose-300")}>{deneme.m}</p>}
          </div>
        </Kart>
      </div>
    </div>
  );
}
