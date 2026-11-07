"use client";

import { useEffect, useState } from "react";
import { Bot, Plug, Plus, ShieldCheck, Users, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { ARAC_KATALOG } from "@/lib/build/ajanKatalog";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Anahtar, Secici, alanSinif } from "./AjanDuzenleyici";
import { AjanSimge, AyarSatiri, ikincil, type Ajan } from "./ortak";
import { MesaiAyarlari } from "./Yonlendirme";

type D = (p: Partial<Ajan>) => void;

/** Hazır değerli sayı seçici: hazırlar + "Özel" (elle sayı). 0 sınırsız demektir. */
export function SayiSecici({ id, deger, set, hazir, birim }: { id: string; deger: number; set: (v: number) => void; hazir: number[]; birim: string }) {
  const [ozel, setOzel] = useState(!hazir.includes(deger));
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Secici id={id} kucuk deger={ozel ? "ozel" : String(deger)} set={(v) => { if (v === "ozel") { setOzel(true); return; } setOzel(false); set(Number(v)); }}
        l={[...hazir.map((x) => ({ id: String(x), ad: x === 0 ? "Sınırsız" : String(x) })), { id: "ozel", ad: "Özel" }]} />
      {ozel && <label className="flex items-center gap-1.5 text-[12px] text-white/50"><input type="number" min={0} max={10000} value={deger} onChange={(e) => set(Math.max(0, Math.min(10000, Math.round(Number(e.target.value) || 0))))} className={cn(alanSinif, "h-8 w-[78px] px-2.5 text-right text-[13px] tabular-nums")} />{birim}</label>}
    </div>
  );
}

type BOzet = { id: string; ad: string; logo?: string; araclar: { name: string; title?: string; annotations?: { readOnlyHint?: boolean; title?: string } }[] };
const aracAdi = (ad: string, b: BOzet[]) => {
  const k = ARAC_KATALOG.find((t) => t.id === ad);
  if (k) return k.ad;
  for (const x of b) for (const t of x.araclar) if (ad.endsWith(`__${t.name}`.replace(/[^A-Za-z0-9_-]/g, "_"))) return `${x.ad}: ${t.annotations?.title ?? t.title ?? t.name}`;
  return ad;
};

/** Onay politikası: bağlantı başına yalnız yazmada sor, bir daha sorulmayanlar, günlük otomatik ve tetik sınırları. */
export function Onaylar({ a, d }: { a: Ajan; d: D }) {
  const [b, setB] = useState<BOzet[]>([]);
  useEffect(() => { api<{ baglantilar: BOzet[] }>("/api/build/baglantilar").then((v) => setB(v.baglantilar)).catch(() => {}); }, []);
  const o = a.onay;
  const set = (p: Partial<Ajan["onay"]>) => d({ onay: { ...o, ...p } });
  const bagli = b.filter((x) => (a.baglantilar ?? []).includes(x.id));
  const bugun = o.sayac?.gun === new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10) ? o.sayac : { otomatik: 0, tetik: 0 };
  return (
    <Kart ikon={ShieldCheck} baslik="Onaylar" alt="Ajan neyi sormadan yapar, ne zaman durup onayını bekler">
      <div className="divide-y divide-white/[0.05]">
        <AyarSatiri baslik="Günlük onaysız işlem sınırı" alt={`Üretim, proje açma ve bağlantılardaki yazma işlemleri günde bu kadar kez sormadan çalışır; sonra ajan sorar. Bugün ${bugun.otomatik} işlem.`} className="flex-wrap">
          <SayiSecici id="onay-oto" deger={o.otomatikTavan} set={(v) => set({ otomatikTavan: v })} hazir={[0, 20, 50, 100]} birim="işlem" />
        </AyarSatiri>
        <AyarSatiri baslik="Günlük tetik sınırı" alt={`Zamanlama ve web kancası çalışmaları günde en çok bu kadar. Bugün ${bugun.tetik} çalışma.`} className="flex-wrap">
          <SayiSecici id="onay-tetik" deger={o.tetikTavan} set={(v) => set({ tetikTavan: v })} hazir={[0, 10, 50, 200]} birim="çalışma" />
        </AyarSatiri>
      </div>
      {bagli.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <p className="px-4 pb-1 pt-3 text-[12px] font-medium text-white/40 sm:px-5">Bağlantı izinleri</p>
          <div className="divide-y divide-white/[0.04]">
            {bagli.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]">{x.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.logo} alt="" className="h-[18px] w-[18px] object-contain" /> : <Plug className="h-4 w-4 text-white/60" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/40">{x.araclar.filter((t) => t.annotations?.readOnlyHint).length} okuma, {x.araclar.filter((t) => !t.annotations?.readOnlyHint).length} yazma aracı</span></span>
                <Secici id={`bi-${x.id}`} kucuk deger={o.baglantiIzin[x.id] ?? "baglanti"} set={(v) => { const y = { ...o.baglantiIzin }; if (v === "baglanti") delete y[x.id]; else y[x.id] = v; set({ baglantiIzin: y }); }}
                  l={[{ id: "baglanti", ad: "Bağlantı ayarı", ipucu: "Bağlantı sayfasındaki araç izinleri geçerli" }, { id: "yazmada", ad: "Yazmada sor", ipucu: "Okuma araçları sormadan, oluşturma, gönderme ve silme onayla" }, { id: "hep", ad: "Hep sor", ipucu: "Her araç çağrısında onay ister" }]} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
        <p className="text-[12px] font-medium text-white/40">Bir daha sorulmayacaklar</p>
        {o.birDahaSorma.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {o.birDahaSorma.map((x) => (
              <span key={x} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] pl-3 pr-1 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/[0.08]">
                {aracAdi(x, b)}
                <button type="button" onClick={() => set({ birDahaSorma: o.birDahaSorma.filter((y) => y !== x) })} aria-label={`${aracAdi(x, b)} için yine sor`} title="Yine sor" className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.1] hover:text-white"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        ) : <p className="mt-1 text-[12.5px] leading-relaxed text-white/45">Onay kartında ya da Görevler'de "bir daha sorma" dediğin araçlar burada listelenir; buradan yeniden onaya bağlayabilirsin.</p>}
      </div>
    </Kart>
  );
}

/* ───────────── İnsana devir ───────────── */
const DEVIR_HAZIR = ["Ödeme, iade ya da fatura talebi olursa", "Ziyaretçi bir insanla görüşmek isterse", "Ziyaretçi sinirliyse ya da şikâyet ediyorsa", "Aynı soruyu iki kez çözemezsen"];
export function DevirKarti({ a, d }: { a: Ajan; d: D }) {
  const v = a.devir;
  const set = (p: Partial<Ajan["devir"]>) => d({ devir: { ...v, ...p } });
  const ekle = (x: string) => set({ kurallar: v.kurallar.trim() ? `${v.kurallar.trim().replace(/[.;]?$/, ";")} ${x.charAt(0).toLocaleLowerCase("tr") + x.slice(1)}` : x });
  return (
    <Kart ikon={Users} baslik="İnsana devir" alt="Hangi durumda konuşmayı sana bırakacağını düz dille yaz" sag={<Anahtar acik={v.acik} set={(x) => set({ acik: x })} etiket="İnsana devir" />}>
      {!v.acik ? <p className="px-4 py-3.5 text-[13px] leading-relaxed text-white/50 sm:px-5">Açınca ajan kurallarına uyan konuşmalarda susar, ziyaretçiye ekibin yanıt vereceğini söyler; konuşma Gelen kutusuna düşer ve oradan insan olarak yanıtlarsın.</p> : (
        <div className="space-y-3 p-4 sm:p-5">
          <textarea value={v.kurallar} onChange={(e) => set({ kurallar: e.target.value })} rows={3} maxLength={2000} placeholder="Örneğin: ödeme ya da iade talebi olursa, ziyaretçi bir insanla görüşmek isterse devret." className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} />
          <div className="flex flex-wrap gap-1.5">{DEVIR_HAZIR.map((x) => <button key={x} type="button" onClick={() => ekle(x)} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.1] hover:text-white"><Plus className="h-3 w-3" />{x}</button>)}</div>
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Devirde ziyaretçiye söylenecek</span><input value={v.mesaj} onChange={(e) => set({ mesaj: e.target.value })} maxLength={300} className={cn(alanSinif, "h-10 text-[13.5px]")} /></label>
        </div>
      )}
      {v.acik && <MesaiAyarlari a={a} d={d} />}
    </Kart>
  );
}

/* ───────────── Ekip ───────────── */
type AOzet = { id: string; ad: string; aciklama: string; simge: string; yayinda: boolean };
export function EkipKarti({ a, d }: { a: Ajan; d: D }) {
  const [l, setL] = useState<AOzet[] | null>(null);
  useEffect(() => { api<{ ajanlar: AOzet[] }>("/api/build/ajanlar").then((v) => setL(v.ajanlar.filter((x) => x.id !== a.id))).catch(() => setL([])); }, [a.id]);
  const secili = new Set(a.ekip ?? []);
  const degistir = (id: string, v: boolean) => { const x = new Set(secili); if (v) x.add(id); else x.delete(id); d({ ekip: [...x].slice(0, 8) }); };
  return (
    <Kart ikon={Bot} baslik="Ekip" alt="Bu ajan uzmanlık isteyen işleri diğer ajanlarına devredebilir" sag={secili.size ? <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/50">{secili.size} üye</span> : undefined}>
      {l === null ? <div className="h-16 animate-pulse" /> : !l.length ? <p className="px-4 py-3.5 text-[13px] leading-relaxed text-white/50 sm:px-5">Başka ajanın yok. Örneğin bir araştırmacı ve bir yazar kur; bu ajan görevi bölüp onlara verir, izde kimin ne yaptığı görünür.</p> : (
        <>
          <div className="divide-y divide-white/[0.04]">
            {l.map((x) => (
              <div key={x.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <AjanSimge src={x.simge} boyut={38} className={cn(!secili.has(x.id) && "opacity-50")} />
                <span className="min-w-0 flex-1"><span className={cn("block truncate text-[13.5px] font-medium", secili.has(x.id) ? "text-white" : "text-white/60")}>{x.ad}</span><span className="block truncate text-[12px] text-white/40">{x.yayinda ? "Yayında" : "Taslak, herkese açık kanallarda kullanılamaz"}{x.aciklama ? ` · ${x.aciklama}` : ""}</span></span>
                <Anahtar acik={secili.has(x.id)} set={(v) => degistir(x.id, v)} etiket={`${x.ad} ekipte`} />
              </div>
            ))}
          </div>
          <p className="border-t border-white/[0.05] px-4 py-2.5 text-[12px] leading-relaxed text-white/40 sm:px-5">Denemede ekip arkadaşlarının taslağı, herkese açık kanallarda yayındaki sürümü çalışır. Ekip görevlerinde onay isteyen araçlar kapalıdır.</p>
        </>
      )}
    </Kart>
  );
}

/* ───────────── Koruma ───────────── */
export function KorumaKarti({ a, d }: { a: Ajan; d: D }) {
  const k = a.koruma;
  const [konu, setKonu] = useState("");
  const set = (p: Partial<Ajan["koruma"]>) => d({ koruma: { ...k, ...p } });
  const ekle = () => { const x = konu.trim(); if (x && !k.yasakKonular.includes(x)) set({ yasakKonular: [...k.yasakKonular, x].slice(0, 30) }); setKonu(""); };
  return (
    <Kart ikon={ShieldCheck} baslik="Koruma" alt="Kişisel veri, istem enjeksiyonu ve yasak konular">
      <div className="divide-y divide-white/[0.05]">
        <AyarSatiri baslik="Kişisel verileri gizle" alt="Gelen mesajlardaki telefon, e-posta, T.C. kimlik, kart ve IBAN numaraları modele gitmeden ve kaydedilmeden gizlenir."><Anahtar acik={k.kisisel} set={(v) => set({ kisisel: v })} etiket="Kişisel verileri gizle" /></AyarSatiri>
        <AyarSatiri baslik="İstem enjeksiyonu koruması" alt="Talimatları unutturmaya ya da gizli ayarları göstermeye çalışan mesajlar yanıtlanmaz; araç çıktıları veri sayılır."><Anahtar acik={k.enjeksiyon} set={(v) => set({ enjeksiyon: v })} etiket="İstem enjeksiyonu koruması" /></AyarSatiri>
        <div className="space-y-2.5 px-4 py-3 sm:px-5">
          <p className="text-[13.5px] font-medium text-white">Yasak konular</p>
          <p className="-mt-1.5 text-[12px] leading-relaxed text-white/45">Bu konular sorulursa ajan modele gitmeden aşağıdaki yanıtı verir; benzer ifadeleri de reddetmesi talimatla söylenir.</p>
          {k.yasakKonular.length > 0 && <div className="flex flex-wrap gap-1.5">{k.yasakKonular.map((x) => <span key={x} className="inline-flex h-8 items-center gap-1 rounded-full bg-rose-500/[0.08] pl-3 pr-1 text-[12.5px] text-rose-100/85 ring-1 ring-inset ring-rose-400/15">{x}<button type="button" onClick={() => set({ yasakKonular: k.yasakKonular.filter((y) => y !== x) })} aria-label={`${x} konusunu kaldır`} className="flex h-6 w-6 items-center justify-center rounded-full text-rose-200/60 hover:bg-white/[0.08] hover:text-white"><X className="h-3 w-3" /></button></span>)}</div>}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ekle(); }}><input value={konu} onChange={(e) => setKonu(e.target.value)} maxLength={60} placeholder="Örneğin siyaset, rakip fiyatları, tıbbi teşhis" className={cn(alanSinif, "h-9 text-[13px]")} /><button type="submit" disabled={!konu.trim()} className={cn(ikincil, "h-9")}><Plus className="h-3.5 w-3.5" />Ekle</button></form>
          <input value={k.yasakYanit} onChange={(e) => set({ yasakYanit: e.target.value })} maxLength={300} placeholder="Yasak konuda verilecek yanıt" className={cn(alanSinif, "h-9 text-[13px]")} />
        </div>
      </div>
    </Kart>
  );
}
