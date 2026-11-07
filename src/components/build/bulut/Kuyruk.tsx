"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Clock, Hourglass, ListChecks, Loader2, Play, Plus, RefreshCw, RotateCcw, Search, Settings2, Trash2, Zap } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { Alan, YanPanel, YiginCubuk, sureYaz } from "./ortak";
import { Dugme, HazirSecim, Olcu, OnayDugme, Rozet, SecHap, SecimHalka, Uyari, tarihSaat } from "./veriOrtak";

type Durum = "bekliyor" | "basarili" | "hata" | "iptal";
type Is = { id: string; fonksiyon: string; veri?: unknown; zaman: number; vade?: number; olusturma: number; deneme: number; durum: Durum; sonHata?: string; bitis?: number; denemeler?: { z: number; sure: number; durum: string; mesaj?: string }[]; yeniden?: number; kaynak?: string };
type Calisma = { id: string; isId: string; ad: string; fonksiyon: string; tetik: "zaman" | "elle" | "gecikmeli"; z: number; sure: number; durum: "basarili" | "hata" | "atlandi"; mesaj?: string; deneme?: number };
type Deneme = { enCok: number; bekleme: "dogrusal" | "ustel" | "sabit"; saniye: number };
type Ozet = {
  sayac: { bekliyor: number; vadesi: number; calisiyor: number; basarili: number; hata: number; iptal: number };
  gecikme: { enEskiBekleyen: number | null; ortBekleme: number | null; ortSure: number | null; p95Sure: number | null };
  saatlik: { saat: number; basarili: number; hata: number }[];
  fonksiyonlar: { ad: string; bekliyor: number; basarili: number; hata: number; ortSure: number | null; sonHata?: string }[];
  calisan: { anahtar: string; ad: string; fonksiyon: string; tetik: string; z: number; deneme?: number }[];
  yaklasan: { isId: string; ad: string; fonksiyon: string; z: number; tur: "zamanli" | "gecikmeli" }[];
  deneme: Deneme;
};
type Veri = { yayinda: boolean; ozet: Ozet; isler: Is[]; calismalar: Calisma[] };

const DURUM: Record<Durum, { ad: string; nokta: string; ton: "imza" | "iyi" | "tehlike" | "notr" }> = {
  bekliyor: { ad: "Bekliyor", nokta: "bg-[#55d6fd]", ton: "imza" }, basarili: { ad: "Başarılı", nokta: "bg-emerald-400", ton: "iyi" },
  hata: { ad: "Başarısız", nokta: "bg-rose-400", ton: "tehlike" }, iptal: { ad: "İptal", nokta: "bg-white/30", ton: "notr" },
};
const ileride = (z: number) => { const s = Math.round((z - Date.now()) / 1000); return s <= 0 ? "vadesi geldi" : s < 60 ? `${s} sn sonra` : s < 3600 ? `${Math.round(s / 60)} dk sonra` : s < 86400 ? `${Math.round(s / 3600)} sa sonra` : tarihSaat(z); };
const beklemeMetni = (d: Deneme) => Array.from({ length: Math.min(4, d.enCok - 1) }, (_, i) => { const n = i + 1; const sn = d.bekleme === "ustel" ? d.saniye * 2 ** (n - 1) : d.bekleme === "dogrusal" ? d.saniye * n : d.saniye; return `${n}. hatadan sonra ${sn < 60 ? `${sn} sn` : `${Math.round(sn / 60)} dk`}`; }).join(", ");

/** Bulut > Kuyruk: gecikmeli işler ve zamanlanmış çalışmalar; sayılar, çıktı, denemeler, başarısızlar, yeniden çalıştır. */
export function Kuyruk({ p, ajana }: { p: Proje; ajana: (m: string) => void }) {
  const kok = `/api/build/bulut/${p.id}/kuyruk`;
  const izleyici = p.ekipRol === "izleyici";
  const [durum, setDurum] = useState<"hepsi" | Durum>("hepsi");
  const [fonksiyon, setFonksiyon] = useState("");
  const [ara, setAra] = useState("");
  const [araG, setAraG] = useState("");
  const [v, setV] = useState<Veri | null>(null);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [ayrinti, setAyrinti] = useState<Is | null>(null);
  const [panel, setPanel] = useState<"" | "kural" | "ekle">("");
  const [isleniyor, setIsleniyor] = useState("");
  useEffect(() => { const t = setTimeout(() => setAraG(ara), 300); return () => clearTimeout(t); }, [ara]);
  const getir = useCallback(() => api<Veri>(`${kok}?durum=${durum}&fonksiyon=${encodeURIComponent(fonksiyon)}&ara=${encodeURIComponent(araG)}`).then((x) => { setV(x); setHata(""); }).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [kok, durum, fonksiyon, araG]);
  useEffect(() => { getir(); const t = setInterval(() => { if (document.visibilityState === "visible") getir(); }, 5000); return () => clearInterval(t); }, [getir]);
  useEffect(() => { setSecili(new Set()); }, [durum, fonksiyon]);
  const islem = async (ad: string, govde: Record<string, unknown>, basari?: (r: Record<string, unknown>) => string) => {
    setIsleniyor(ad); setHata(""); setMesaj("");
    try { const r = await api<Record<string, unknown>>(kok, { govde }); if (basari) setMesaj(basari(r)); await getir(); return r; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); return null; } finally { setIsleniyor(""); }
  };
  const yenidenDenenebilir = useMemo(() => (v?.isler ?? []).filter((x) => x.durum === "hata" || x.durum === "iptal"), [v]);
  const basarisizCalisma = useMemo(() => (v?.calismalar ?? []).filter((c) => c.durum === "hata" && c.tetik !== "gecikmeli").slice(0, 8), [v]);
  if (!v) return <div className="flex h-40 items-center justify-center">{hata ? <Uyari>{hata}</Uyari> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>;
  const o = v.ozet;
  const fAdlari = o.fonksiyonlar.map((f) => f.ad);
  return (
    <div className="space-y-4">
      {!v.yayinda && <Uyari ton="uyari">Proje yayında değil. Kuyruktaki işler ve zamanlanmış görevler yayındaki sürümün api/ fonksiyonlarını çalıştırır; yayınlayınca işlenmeye başlar.</Uyari>}
      {hata && <Uyari>{hata}</Uyari>}
      {mesaj && <Uyari ton="bilgi">{mesaj}</Uyari>}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
        <Olcu ad="Bekliyor" deger={o.sayac.bekliyor} ton={o.sayac.bekliyor ? "imza" : undefined} />
        <Olcu ad="Vadesi gelen" deger={o.sayac.vadesi} ton={o.sayac.vadesi > 5 ? "uyari" : undefined} alt={o.gecikme.enEskiBekleyen ? `En eski ${gorece(o.gecikme.enEskiBekleyen)}` : undefined} />
        <Olcu ad="Çalışıyor" deger={o.sayac.calisiyor} />
        <Olcu ad="Başarısız" deger={o.sayac.hata} ton={o.sayac.hata ? "tehlike" : undefined} />
        <Olcu ad="Başarılı" deger={o.sayac.basarili} />
        <Olcu ad="İptal" deger={o.sayac.iptal} />
        <Olcu ad="Ortalama bekleme" deger={o.gecikme.ortBekleme === null ? "Yok" : sureYaz(o.gecikme.ortBekleme)} alt="Vadeden ilk denemeye" />
        <Olcu ad="Süre, ortalama" deger={o.gecikme.ortSure === null ? "Yok" : sureYaz(o.gecikme.ortSure)} alt={o.gecikme.p95Sure !== null ? `Yüzde 95'i ${sureYaz(o.gecikme.p95Sure)} altında` : undefined} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Kart ikon={Zap} baslik="Son 24 saat" alt="Saat başına çalışan iş ve görev; gecikmeli ve zamanlanmış birlikte" govde="p-4 sm:p-5">
          <YiginCubuk veri={o.saatlik.map((s) => ({ z: s.saat, basarili: s.basarili, hata: s.hata }))} seriler={[{ anahtar: "basarili", ad: "Başarılı", renk: "#1e9fcf" }, { anahtar: "hata", ad: "Başarısız", renk: "#e8546c" }]} etiket={(z) => new Date(z).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} ipucuBaslik={(z) => new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} yukseklik={130} />
        </Kart>
        <Kart ikon={Clock} baslik="Yaklaşan" alt="Önümüzdeki 24 saatte çalışacaklar" govde="max-h-[240px] overflow-y-auto [scrollbar-width:thin]">
          {!o.yaklasan.length ? <p className="px-5 py-5 text-[13px] text-white/45">Önümüzdeki 24 saatte çalışacak iş ya da görev yok.</p> : (
            <div className="divide-y divide-white/[0.04]">{o.yaklasan.map((x, i) => (
              <div key={`${x.isId}-${x.z}-${i}`} className="flex items-center gap-2.5 px-4 py-2 sm:px-5"><Rozet ton={x.tur === "zamanli" ? "notr" : "imza"}>{x.tur === "zamanli" ? "Zamanlı" : "Gecikmeli"}</Rozet><span className="min-w-0 flex-1 truncate text-[13px] text-white/85">{x.ad}</span><span className="shrink-0 text-[12px] tabular-nums text-white/45">{ileride(x.z)}</span></div>
            ))}</div>
          )}
        </Kart>
      </div>
      {o.calisan.length > 0 && (
        <Kart ikon={Loader2} baslik="Şu an çalışanlar" alt="Bitince sonuç kuyruğa yazılır">
          <div className="divide-y divide-white/[0.04]">{o.calisan.map((c) => <div key={c.anahtar} className="flex items-center gap-3 px-4 py-2.5 sm:px-5"><Loader2 className="h-3.5 w-3.5 animate-spin text-[#8be6ff]" /><span className="min-w-0 flex-1 truncate text-[13px] text-white">{c.ad}</span>{c.deneme && c.deneme > 1 && <Rozet ton="uyari">{c.deneme}. deneme</Rozet>}<span className="text-[12px] tabular-nums text-white/45">{sureYaz(Date.now() - c.z)}</span></div>)}</div>
        </Kart>
      )}
      <Kart ikon={ListChecks} baslik="Kuyruk" alt="vayra.sonra ile eklenen gecikmeli işler; hata olursa yeniden deneme kuralına göre tekrar denenir"
        sag={!izleyici ? <><Dugme onClick={() => setPanel("kural")}><Settings2 className="h-3.5 w-3.5" /><span className="max-sm:hidden">Yeniden deneme</span></Dugme><Dugme tur="birincil" onClick={() => setPanel("ekle")}><Plus className="h-3.5 w-3.5" /><span className="max-sm:hidden">İş ekle</span></Dugme></> : undefined}>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] p-3">
          {(["hepsi", "bekliyor", "hata", "basarili", "iptal"] as const).map((d) => <SecHap key={d} secili={durum === d} onClick={() => setDurum(d)}>{d === "hepsi" ? "Hepsi" : DURUM[d].ad}{d !== "hepsi" && <span className="tabular-nums text-white/40">{d === "bekliyor" ? o.sayac.bekliyor : d === "hata" ? o.sayac.hata : d === "basarili" ? o.sayac.basarili : o.sayac.iptal}</span>}</SecHap>)}
          {fAdlari.length > 1 && <div className="w-[180px]"><AcilirSecim deger={fonksiyon} set={setFonksiyon} bos="Bütün fonksiyonlar" l={fAdlari.map((f) => ({ id: f, ad: f }))} /></div>}
          <label className="relative ml-auto min-w-[160px] flex-1 sm:max-w-[240px]"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="İş, hata ya da veride ara" className="h-8 w-full rounded-full bg-white/[0.05] pl-8 pr-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/25" /></label>
        </div>
        {!izleyici && secili.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 sm:px-5">
            <span className="flex-1 text-[12.5px] text-white/60">{secili.size} iş seçili</span>
            <Dugme kucuk tur="birincil" yukleniyor={isleniyor === "toplu"} onClick={() => islem("toplu", { islem: "yenidenDene", idler: [...secili] }, (r) => `${r.adet} iş yeniden kuyruğa alındı.`).then(() => setSecili(new Set()))}><RotateCcw className="h-3 w-3" />Yeniden dene</Dugme>
            <Dugme kucuk onClick={() => setSecili(new Set())}>Seçimi kaldır</Dugme>
          </div>
        )}
        {!v.isler.length ? (
          <div className="px-6 py-10 text-center">
            <Hourglass className="mx-auto h-5 w-5 text-white/25" />
            <p className="mt-2 text-[13.5px] text-white/70">{durum === "hepsi" && !araG && !fonksiyon ? "Kuyruk boş" : "Bu süzgece uyan iş yok"}</p>
            {durum === "hepsi" && !araG && !fonksiyon && <>
              <p className="mx-auto mt-1 max-w-[520px] text-[12.5px] leading-relaxed text-white/45">Sunucu fonksiyonundan await vayra.sonra(saniye, "fonksiyon", veri) ile iş eklenir; ödeme sonrası takip e-postası, 24 saat sonra hatırlatma, ağır işleri yanıtı bekletmeden arkaya atmak için.</p>
              {!izleyici && <Dugme className="mt-3" onClick={() => ajana("Sipariş tamamlanınca api/siparis-takip.js içinden await vayra.sonra(86400, \"degerlendirme-iste\", { siparisNo }) ile 24 saat sonra çalışacak bir iş ekle; api/degerlendirme-iste.js müşteriye değerlendirme isteği e-postası göndersin ve hata olursa hata fırlatsın ki kuyruk yeniden denesin.")}>Ajanla gecikmeli iş kur</Dugme>}
            </>}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {v.isler.map((x) => {
              const sec = secili.has(x.id), denenebilir = x.durum === "hata" || x.durum === "iptal";
              return (
                <div key={x.id} role="button" tabIndex={0} onClick={() => setAyrinti(x)} onKeyDown={(e) => { if (e.key === "Enter") setAyrinti(x); }} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] sm:px-5">
                  {!izleyici && denenebilir ? <SecimHalka secili={sec} etiket={`${x.id} işini seç`} degis={() => setSecili((s) => { const n = new Set(s); if (n.has(x.id)) n.delete(x.id); else n.add(x.id); return n; })} /> : <span className={cn("ml-[5px] mr-[5px] h-2 w-2 shrink-0 rounded-full", DURUM[x.durum].nokta)} />}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2"><span className="truncate text-[13px] font-medium text-white">{x.fonksiyon}</span><Rozet ton={DURUM[x.durum].ton}>{DURUM[x.durum].ad}</Rozet>{(x.deneme > 0 || x.durum === "hata") && <span className="text-[11.5px] tabular-nums text-white/45">{x.deneme} / {o.deneme.enCok} deneme</span>}{x.yeniden ? <span className="text-[11.5px] text-white/40">{x.yeniden} kez yeniden kuyruğa alındı</span> : null}</span>
                    <span className="block truncate text-[12px] text-white/45">{x.durum === "bekliyor" ? `${ileride(x.zaman)}${x.deneme ? `, son hata: ${x.sonHata ?? ""}` : ""}` : x.sonHata ? x.sonHata : `${x.bitis ? gorece(x.bitis) : gorece(x.olusturma)} bitti`}</span>
                  </span>
                  {!izleyici && x.durum === "bekliyor" && <>
                    <Dugme kucuk aria-label="Şimdi çalıştır" yukleniyor={isleniyor === `s${x.id}`} onClick={(e) => { e.stopPropagation(); islem(`s${x.id}`, { islem: "simdi", id: x.id }, () => "İş 15 saniye içinde çalışacak."); }}><Play className="h-3 w-3" /><span className="max-sm:hidden">Şimdi</span></Dugme>
                    <span onClick={(e) => e.stopPropagation()}><OnayDugme kucuk onay="İptal edilsin mi?" calistir={() => islem(`i${x.id}`, { islem: "iptal", id: x.id }, () => "İş iptal edildi.")}><Ban className="h-3 w-3" /></OnayDugme></span>
                  </>}
                  {!izleyici && denenebilir && <Dugme kucuk yukleniyor={isleniyor === `y${x.id}`} onClick={(e) => { e.stopPropagation(); islem(`y${x.id}`, { islem: "yenidenDene", idler: [x.id] }, () => "İş yeniden kuyruğa alındı."); }}><RotateCcw className="h-3 w-3" /><span className="max-sm:hidden">Yeniden dene</span></Dugme>}
                </div>
              );
            })}
          </div>
        )}
        {!izleyici && (o.sayac.basarili > 0 || o.sayac.hata > 0 || o.sayac.iptal > 0 || o.sayac.bekliyor > 0) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3 sm:px-5">
            {yenidenDenenebilir.length > 1 && <Dugme kucuk onClick={() => islem("hepsi", { islem: "yenidenDene", idler: yenidenDenenebilir.map((x) => x.id) }, (r) => `${r.adet} iş yeniden kuyruğa alındı.`)}><RotateCcw className="h-3 w-3" />Görünen başarısızları yeniden dene</Dugme>}
            <span className="flex-1" />
            {o.sayac.bekliyor > 0 && <OnayDugme kucuk onay={`${fonksiyon || "Hepsi"} iptal edilsin mi?`} calistir={() => islem("topluIptal", { islem: "topluIptal", ...(fonksiyon ? { fonksiyon } : {}) }, (r) => `${r.adet} bekleyen iş iptal edildi.`)}><Ban className="h-3 w-3" />Bekleyenleri iptal et</OnayDugme>}
            {o.sayac.basarili > 0 && <Dugme kucuk onClick={() => islem("tb", { islem: "temizle", durumlar: ["basarili"] }, (r) => `${r.adet} başarılı iş temizlendi.`)}><Trash2 className="h-3 w-3" />Başarılıları temizle</Dugme>}
            {(o.sayac.hata > 0 || o.sayac.iptal > 0) && <OnayDugme kucuk onay="Kalıcı silinsin mi?" calistir={() => islem("th", { islem: "temizle", durumlar: ["hata", "iptal"] }, (r) => `${r.adet} iş temizlendi.`)}><Trash2 className="h-3 w-3" />Başarısız ve iptalleri temizle</OnayDugme>}
          </div>
        )}
      </Kart>
      {o.fonksiyonlar.length > 0 && (
        <Kart ikon={ListChecks} baslik="Fonksiyon başına" alt="Son 7 gündeki çalışmalar">
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-[12.5px]"><thead><tr className="border-b border-white/[0.06] text-left text-white/45"><th className="px-5 py-2 font-normal">Fonksiyon</th><th className="px-3 py-2 text-right font-normal">Bekliyor</th><th className="px-3 py-2 text-right font-normal">Başarılı</th><th className="px-3 py-2 text-right font-normal">Başarısız</th><th className="px-5 py-2 text-right font-normal">Ortalama süre</th></tr></thead>
            <tbody>{o.fonksiyonlar.map((f) => <tr key={f.ad} className="border-b border-white/[0.04] last:border-0"><td className="px-5 py-2"><button type="button" onClick={() => setFonksiyon(f.ad === fonksiyon ? "" : f.ad)} className={cn("font-mono text-white hover:underline", f.ad === fonksiyon && "text-[#8be6ff]")}>{f.ad}</button>{f.sonHata && <span className="block max-w-[340px] truncate text-[11.5px] text-rose-200/70">{f.sonHata}</span>}</td><td className="px-3 py-2 text-right tabular-nums text-white/75">{f.bekliyor}</td><td className="px-3 py-2 text-right tabular-nums text-white/75">{f.basarili}</td><td className={cn("px-3 py-2 text-right tabular-nums", f.hata ? "text-rose-200" : "text-white/75")}>{f.hata}</td><td className="px-5 py-2 text-right tabular-nums text-white/75">{f.ortSure === null ? "Yok" : sureYaz(f.ortSure)}</td></tr>)}</tbody></table></div>
        </Kart>
      )}
      {basarisizCalisma.length > 0 && (
        <Kart ikon={RefreshCw} baslik="Başarısız zamanlanmış çalışmalar" alt="Aynı görevi şimdi yeniden çalıştırabilirsin">
          <div className="divide-y divide-white/[0.04]">{basarisizCalisma.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{c.ad}</span><span className="block truncate text-[12px] text-rose-200/70">{c.mesaj}</span></span>
              <span className="shrink-0 text-[12px] text-white/40">{gorece(c.z)}</span>
              {!izleyici && <Dugme kucuk yukleniyor={isleniyor === `c${c.id}`} onClick={() => islem(`c${c.id}`, { islem: "calismaYeniden", id: c.id }, (r) => (r.calisma as { durum?: string } | null)?.durum === "basarili" ? "Görev yeniden çalıştı ve başarılı oldu." : "Görev yeniden çalıştırıldı; sonuç geçmişte.")}><Play className="h-3 w-3" />Yeniden çalıştır</Dugme>}
            </div>
          ))}</div>
        </Kart>
      )}
      <IsAyrinti x={ayrinti} kapat={() => setAyrinti(null)} enCok={o.deneme.enCok} izleyici={izleyici} islem={(g, m) => islem("ayr", g, () => m).then((r) => { if (r) setAyrinti(null); })} />
      <KuralPaneli acik={panel === "kural"} kapat={() => setPanel("")} d={o.deneme} kaydet={(d) => islem("kural", { islem: "deneme", ...d }, () => "Yeniden deneme kuralı kaydedildi.").then((r) => { if (r) setPanel(""); })} />
      <EklePaneli acik={panel === "ekle"} kapat={() => setPanel("")} p={p} ekle={(g) => islem("ekle", { islem: "ekle", ...g }, () => "İş kuyruğa eklendi.").then((r) => { if (r) setPanel(""); })} />
    </div>
  );
}

function IsAyrinti({ x, kapat, enCok, izleyici, islem }: { x: Is | null; kapat: () => void; enCok: number; izleyici: boolean; islem: (g: Record<string, unknown>, m: string) => void }) {
  return (
    <YanPanel acik={!!x} kapat={kapat} baslik={x ? `${x.fonksiyon}` : ""} alt={x ? `İş ${x.id}` : ""}
      alt2={x && !izleyici ? <>{x.durum === "bekliyor" ? <><Dugme tur="birincil" onClick={() => islem({ islem: "simdi", id: x.id }, "İş 15 saniye içinde çalışacak.")}><Play className="h-3.5 w-3.5" />Şimdi çalıştır</Dugme><OnayDugme onay="İptal edilsin mi?" calistir={() => islem({ islem: "iptal", id: x.id }, "İş iptal edildi.")}><Ban className="h-3.5 w-3.5" />İptal et</OnayDugme></>
        : x.durum === "hata" || x.durum === "iptal" ? <Dugme tur="birincil" onClick={() => islem({ islem: "yenidenDene", idler: [x.id] }, "İş yeniden kuyruğa alındı.")}><RotateCcw className="h-3.5 w-3.5" />Yeniden dene</Dugme> : null}</> : undefined}>
      {x && (
        <div className="space-y-4">
          <dl className="divide-y divide-white/[0.05]">
            <Alan ad="Durum">{DURUM[x.durum].ad}</Alan>
            <Alan ad="Deneme">{x.deneme} / {enCok}</Alan>
            <Alan ad="Eklendi">{tarihSaat(x.olusturma)}{x.kaynak === "panel" ? ", panelden" : ""}</Alan>
            <Alan ad={x.durum === "bekliyor" ? "Çalışacak" : "Vade"}>{tarihSaat(x.durum === "bekliyor" ? x.zaman : x.vade ?? x.zaman)}</Alan>
            {x.bitis && <Alan ad="Bitti">{tarihSaat(x.bitis)}</Alan>}
            {x.sonHata && <Alan ad="Son hata">{x.sonHata}</Alan>}
          </dl>
          <div><p className="mb-1.5 text-[12.5px] text-white/55">Veri</p><pre className="max-h-[200px] overflow-auto rounded-[12px] bg-black/40 p-3 font-mono text-[12px] text-white/75 ring-1 ring-inset ring-white/[0.07]">{x.veri === undefined ? "Veri yok" : JSON.stringify(x.veri, null, 2)}</pre></div>
          <div>
            <p className="mb-1.5 text-[12.5px] text-white/55">Denemeler</p>
            {!x.denemeler?.length ? <p className="text-[12.5px] text-white/45">Henüz denenmedi.</p> : (
              <ol className="space-y-1.5">{x.denemeler.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-[12px] bg-white/[0.03] px-3 py-2 ring-1 ring-inset ring-white/[0.06]">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", d.durum === "basarili" ? "bg-emerald-400" : d.durum === "hata" ? "bg-rose-400" : "bg-amber-300")} />
                  <span className="min-w-0 flex-1"><span className="block text-[12.5px] text-white">{i + 1}. deneme · {tarihSaat(d.z)} · {sureYaz(d.sure)}</span>{d.mesaj && <span className="block break-words text-[12px] text-white/50">{d.mesaj}</span>}</span>
                </li>
              ))}</ol>
            )}
          </div>
        </div>
      )}
    </YanPanel>
  );
}

function KuralPaneli({ acik, kapat, d, kaydet }: { acik: boolean; kapat: () => void; d: Deneme; kaydet: (d: Deneme) => void }) {
  const [x, setX] = useState(d);
  useEffect(() => { if (acik) setX(d); }, [acik, d]);
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Yeniden deneme kuralı" alt="Hata veren iş bu kurala göre yeniden denenir; denemeler bitince Başarısız olur"
      alt2={<><span className="flex-1" /><Dugme onClick={kapat}>Vazgeç</Dugme><Dugme tur="birincil" onClick={() => kaydet(x)}>Kaydet</Dugme></>}>
      <div className="space-y-4">
        <div><p className="mb-1.5 text-[12.5px] text-white/55">En çok deneme</p><HazirSecim deger={x.enCok} set={(n) => setX({ ...x, enCok: n })} l={[{ d: 1, ad: "1" }, { d: 3, ad: "3" }, { d: 5, ad: "5" }]} en={1} cok={10} birim="deneme" /></div>
        <div><p className="mb-1.5 text-[12.5px] text-white/55">Bekleme biçimi</p><div className="flex flex-wrap gap-1.5">{([["dogrusal", "Doğrusal"], ["ustel", "Üstel"], ["sabit", "Sabit"]] as const).map(([id, ad]) => <SecHap key={id} secili={x.bekleme === id} onClick={() => setX({ ...x, bekleme: id })}>{ad}</SecHap>)}</div></div>
        <div><p className="mb-1.5 text-[12.5px] text-white/55">Temel bekleme</p><HazirSecim deger={x.saniye} set={(n) => setX({ ...x, saniye: n })} l={[{ d: 30, ad: "30 sn" }, { d: 60, ad: "1 dk" }, { d: 300, ad: "5 dk" }]} en={5} cok={3600} birim="sn" /></div>
        <Uyari ton="bilgi">{x.enCok <= 1 ? "Hata olursa yeniden denenmez." : beklemeMetni(x)}.</Uyari>
      </div>
    </YanPanel>
  );
}

function EklePaneli({ acik, kapat, p, ekle }: { acik: boolean; kapat: () => void; p: Proje; ekle: (g: Record<string, unknown>) => void }) {
  const yayindaki = p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar ?? {} : {};
  const fonksiyonlar = Object.keys(yayindaki).map((y) => /^api\/([A-Za-z0-9_-]+)\.js$/.exec(y)?.[1]).filter((x): x is string => !!x).sort();
  const [f, setF] = useState("");
  const [saniye, setSaniye] = useState(1);
  const [veri, setVeri] = useState("{}");
  const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setF(fonksiyonlar[0] ?? ""); setSaniye(1); setVeri("{}"); setHata(""); } }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  const gonder = () => { let j: unknown; try { j = veri.trim() ? JSON.parse(veri) : undefined; } catch { setHata("Veri geçerli JSON olmalı."); return; } ekle({ fonksiyon: f, saniye, veri: j }); };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Kuyruğa iş ekle" alt="Bir fonksiyonu kuyruktan, verdiğin veriyle denemek için"
      alt2={<><span className="flex-1" /><Dugme onClick={kapat}>Vazgeç</Dugme><Dugme tur="birincil" disabled={!f} onClick={gonder}><Plus className="h-3.5 w-3.5" />Ekle</Dugme></>}>
      {!fonksiyonlar.length ? <Uyari ton="uyari">Yayındaki sürümde api/ fonksiyonu yok. Önce bir sunucu fonksiyonu yazıp yayınla.</Uyari> : (
        <div className="space-y-4">
          <div><p className="mb-1.5 text-[12.5px] text-white/55">Fonksiyon</p><AcilirSecim deger={f} set={setF} l={fonksiyonlar.map((x) => ({ id: x, ad: `api/${x}.js` }))} /></div>
          <div><p className="mb-1.5 text-[12.5px] text-white/55">Ne zaman</p><HazirSecim deger={saniye} set={setSaniye} l={[{ d: 1, ad: "Hemen" }, { d: 60, ad: "1 dk" }, { d: 3600, ad: "1 saat" }, { d: 86400, ad: "1 gün" }]} en={1} cok={2_592_000} birim="sn" /></div>
          <div><p className="mb-1.5 text-[12.5px] text-white/55">Veri (JSON; fonksiyona gövde olarak gider)</p><textarea value={veri} onChange={(e) => { setVeri(e.target.value); setHata(""); }} rows={6} spellCheck={false} className={cn(alanSinif, "py-2.5 font-mono text-[12.5px]")} /></div>
          {hata && <Uyari>{hata}</Uyari>}
        </div>
      )}
    </YanPanel>
  );
}
