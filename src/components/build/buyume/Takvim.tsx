"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight, Download, Trash2, Wand2 } from "lucide-react";
import {
  bugunTR, gonderiKanalAdi, gonderiMetni, gunFarki, icerikKanali, ogeTarihi, planKanali, PLAN_KANALLARI, PLANDAN_ICERIGE, tarihEkle, tarihGecerli, icsOlustur,
  type GonderiDurum, type PlanKanalId, type TakvimOgesi, type TakvimTur,
} from "@/lib/build/buyumeTipler";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Cip, Etiket, HataSatiri, ikincil, indir, Kart, KanalLogo, ModelYokKart, Rozet, SecenekMenusu, simgeDugme, turkceTarih, YanPanel, SatirSecici } from "./ortak";
import { GonderiPaneli, takipAdresi } from "./Icerik";
import { ModelYokHatasi, type BuyumeKanca } from "./useBuyume";
import type { Git } from "./BuyumeSekme";

type Olay = { anahtar: string; tur: "plan" | "gonderi"; id: string; tarih: string; kanal: PlanKanalId; baslik: string; gorsel?: string; durum?: GonderiDurum; ogeTur?: TakvimTur };
const TUR_AD: Record<TakvimTur, string> = { gonderi: "Gönderi", reklam: "Reklam", eposta: "E-posta", blog: "Blog", gorev: "Görev" };
const HAFTA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const ayAdi = (ay: string) => new Date(ay + "-15T12:00:00Z").toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" });
const ayKaydir = (ay: string, n: number) => { const d = new Date(ay + "-15T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };

/** Takvim öğesi. Dar ay hücresinde (dikey) logo üstte, başlık altta iki satır; listelerde yan yana. */
function OlayCipi({ o, ac, surukle, dikey }: { o: Olay; ac: () => void; surukle?: (e: React.DragEvent) => void; dikey?: boolean }) {
  const simge = o.gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={o.gorsel} alt="" className="h-4 w-4 shrink-0 rounded-[4px] object-cover" /> : <KanalLogo kanal={o.kanal} boyut={16} className="rounded-[5px]" />;
  const nokta = o.durum === "paylasildi" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#55d6fd]" title="Paylaşıldı" />;
  return (
    <button type="button" draggable={!!surukle} onDragStart={surukle} onClick={(e) => { e.stopPropagation(); ac(); }} title={`${planKanali(o.kanal).ad}: ${o.baslik}`}
      className={cn("w-full min-w-0 rounded-[8px] px-1.5 py-1 text-left text-[11.5px] leading-[1.3] transition-colors", dikey ? "block" : "flex items-start gap-1.5",
        o.tur === "plan" ? "border border-dashed border-white/[0.16] text-white/70 hover:bg-white/[0.05]" : "bg-white/[0.07] text-white/90 hover:bg-white/[0.11]", surukle && "cursor-grab active:cursor-grabbing")}>
      {dikey ? <><span className="flex items-center gap-1">{simge}{nokta}</span><span className="mt-0.5 line-clamp-2 [overflow-wrap:anywhere]">{o.baslik}</span></>
        : <><span className="mt-px">{simge}</span><span className="min-w-0 flex-1 line-clamp-2">{o.baslik}</span>{nokta && <span className="mt-1.5">{nokta}</span>}</>}
    </button>
  );
}

export function TakvimBolumu({ p, b, git }: { p: Proje; b: BuyumeKanca; git: Git }) {
  const v = b.veri!;
  const plan = v.plan;
  const bugun = bugunTR();
  const [ay, setAy] = useState((plan?.baslangic ?? bugun).slice(0, 7));
  const [hedef, setHedef] = useState<string | null>(null);
  const [surukleniyor, setSurukleniyor] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [gonderiAcik, setGonderiAcik] = useState<string | null>(null);
  const [ogeAcik, setOgeAcik] = useState<string | null>(null);
  const [gunAcik, setGunAcik] = useState<string | null>(null);

  const olaylar = useMemo(() => {
    const l: Olay[] = [];
    const bagli = new Set(v.gonderiler.filter((g) => g.takvimId && g.tarih).map((g) => g.takvimId));
    if (plan) for (const o of plan.takvim) if (!bagli.has(o.id)) l.push({ anahtar: `plan:${o.id}`, tur: "plan", id: o.id, tarih: ogeTarihi(plan, o), kanal: o.kanal, baslik: o.baslik, ogeTur: o.tur });
    for (const g of v.gonderiler) if (g.tarih) l.push({ anahtar: `gonderi:${g.id}`, tur: "gonderi", id: g.id, tarih: g.tarih, kanal: icerikKanali(g.kanal).plan, baslik: g.baslik || g.metin.split("\n")[0].slice(0, 80) || gonderiKanalAdi(g), gorsel: g.gorsel, durum: g.durum });
    return l.sort((a, c) => a.tarih.localeCompare(c.tarih));
  }, [plan, v.gonderiler]);
  const gunun = (t: string) => olaylar.filter((o) => o.tarih === t);
  const tarihsiz = v.gonderiler.filter((g) => !g.tarih);

  const tasi = (anahtar: string, tarih: string | null) => {
    setHata("");
    const [tur, id] = anahtar.split(":");
    if (tur === "gonderi") { b.degistir((x) => { const g = x.gonderiler.find((y) => y.id === id); if (g) g.tarih = tarih ?? undefined; }, { gonderi: { id, tarih } }); return; }
    if (!plan || !tarih) return;
    const gun = gunFarki(tarih, plan.baslangic) + 1;
    if (gun < 1) { setHata(`Plan ${turkceTarih(plan.baslangic, { day: "numeric", month: "long" })} günü başlıyor; adımı daha önceye taşımak için başlangıç gününü değiştir.`); return; }
    if (gun > 90) { setHata("Adım planın başlangıcından en çok 90 gün sonraya taşınabilir."); return; }
    const y = structuredClone(plan); const o = y.takvim.find((x) => x.id === id); if (!o) return; o.gun = gun; y.takvim.sort((a, c) => a.gun - c.gun);
    b.degistir((x) => { x.plan = y; }, { plan: y });
  };
  const surukle = (o: Olay) => (e: React.DragEvent) => { e.dataTransfer.setData("text/plain", o.anahtar); e.dataTransfer.effectAllowed = "move"; setSurukleniyor(o.anahtar); };
  const birak = (tarih: string | null) => (e: React.DragEvent) => { e.preventDefault(); const a = e.dataTransfer.getData("text/plain") || surukleniyor; setHedef(null); setSurukleniyor(null); if (a) tasi(a, tarih); };
  const ac = (o: Olay) => (o.tur === "gonderi" ? setGonderiAcik(o.id) : setOgeAcik(o.id));

  const disari = () => {
    const l = olaylar.map((o) => {
      if (o.tur === "gonderi") { const g = v.gonderiler.find((x) => x.id === o.id)!; return { id: `g-${g.id}`, tarih: o.tarih, baslik: `${gonderiKanalAdi(g)}: ${o.baslik}`, aciklama: `${gonderiMetni(g)}\n\nBağlantı: ${takipAdresi(p, g)}` }; }
      const t = plan!.takvim.find((x) => x.id === o.id)!;
      return { id: `p-${t.id}`, tarih: o.tarih, baslik: `${planKanali(t.kanal).ad}: ${t.baslik}`, aciklama: `${TUR_AD[t.tur]}. ${t.aciklama}` };
    });
    indir(`${p.ayarlar.altAlan}-buyume-takvimi.ics`, icsOlustur(`${p.ad} büyüme takvimi`, l), "text/calendar;charset=utf-8");
  };

  /* Ay ızgarası: pazartesiden başlayan tam haftalar. */
  const ilk = `${ay}-01`;
  const bas = tarihEkle(ilk, -((new Date(ilk + "T12:00:00Z").getUTCDay() + 6) % 7));
  const sonGun = tarihEkle(ayKaydir(ay, 1) + "-01", -1);
  const haftaSay = Math.ceil((gunFarki(sonGun, bas) + 1) / 7);
  const hucreler = Array.from({ length: haftaSay * 7 }, (_, i) => tarihEkle(bas, i));
  const planIci = (t: string) => !!plan && gunFarki(t, plan.baslangic) >= 0 && gunFarki(t, plan.baslangic) < 30;
  const tarihliListe = [...new Set(olaylar.map((o) => o.tarih))];

  if (!plan && !olaylar.length && !tarihsiz.length) {
    return (
      <Kart>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#55d6fd]/[0.1]"><CalendarDays className="h-5 w-5 text-[#8be6ff]" /></span>
          <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">Takvim boş</p><p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">Plan çıkarınca 30 günün adımları buraya dizilir; gönderilere gün verdikçe onlar da görünür. Sürükleyip gününü değiştirir, takvim uygulamana aktarırsın.</p></div>
          <div className="flex shrink-0 gap-2"><button type="button" onClick={() => git("icerik")} className={ikincil}>Gönderi yaz</button><button type="button" onClick={() => git("plan")} className={birincil}>Plan çıkar</button></div>
        </div>
      </Kart>
    );
  }

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Takvim<Rozet>{olaylar.length} adım</Rozet></span>}
        aciklama={plan ? `Plan ${turkceTarih(plan.baslangic, { day: "numeric", month: "long" })} günü başlıyor. Kesik çizgili olanlar plan adımı, dolu olanlar hazırlanmış gönderi.` : "Gün verilmiş gönderiler. Plan çıkarınca 30 günlük adımlar da eklenir."}
        sag={<>
          {plan && <label className="flex items-center gap-1.5 text-[12px] text-white/50 max-sm:hidden">Başlangıç<input type="date" value={plan.baslangic} onChange={(e) => { if (!tarihGecerli(e.target.value)) return; const y = { ...structuredClone(plan), baslangic: e.target.value }; b.degistir((x) => { x.plan = y; }, { plan: y }); setAy(e.target.value.slice(0, 7)); }} className={cn(alan, "h-8 w-[140px] px-2.5 text-[12.5px] [color-scheme:dark]")} /></label>}
          <button type="button" onClick={disari} disabled={!olaylar.length} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Download className="h-3.5 w-3.5" />.ics indir</button>
        </>}>
        <AnimatePresence>{hata && <div className="mb-3"><HataSatiri mesaj={hata} kapat={() => setHata("")} /></div>}</AnimatePresence>

        {/* Masaüstü: ay görünümü, sürükle bırak */}
        <div className="max-md:hidden">
          <div className="mb-2 flex items-center gap-1">
            <button type="button" onClick={() => setAy(ayKaydir(ay, -1))} className={simgeDugme} aria-label="Önceki ay"><ChevronLeft className="h-4 w-4" /></button>
            <motion.span key={ay} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="min-w-[130px] text-center text-[14px] font-semibold capitalize text-white">{ayAdi(ay)}</motion.span>
            <button type="button" onClick={() => setAy(ayKaydir(ay, 1))} className={simgeDugme} aria-label="Sonraki ay"><ChevronRight className="h-4 w-4" /></button>
            {ay !== bugun.slice(0, 7) && <button type="button" onClick={() => setAy(bugun.slice(0, 7))} className="ml-1 h-7 rounded-full px-2.5 text-[12px] text-white/60 hover:bg-white/[0.06] hover:text-white">Bugün</button>}
            {plan && ay !== plan.baslangic.slice(0, 7) && <button type="button" onClick={() => setAy(plan.baslangic.slice(0, 7))} className="h-7 rounded-full px-2.5 text-[12px] text-white/60 hover:bg-white/[0.06] hover:text-white">Plan başı</button>}
          </div>
          <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11.5px] text-white/40">{HAFTA.map((h) => <span key={h}>{h}</span>)}</div>
          <div className="grid grid-cols-7 gap-1" onDragEnd={() => { setHedef(null); setSurukleniyor(null); }}>
            {hucreler.map((t) => {
              const l = gunun(t), buAy = t.slice(0, 7) === ay;
              const gun = plan ? gunFarki(t, plan.baslangic) + 1 : 0;
              return (
                <div key={t} onDragOver={(e) => { e.preventDefault(); if (hedef !== t) setHedef(t); }} onDragLeave={() => setHedef((h) => (h === t ? null : h))} onDrop={birak(t)}
                  className={cn("flex min-h-[112px] min-w-0 flex-col gap-1 rounded-[12px] p-1.5 transition-[box-shadow,background-color]", planIci(t) ? "bg-white/[0.04]" : "bg-white/[0.015]", !buAy && "opacity-45", hedef === t && "bg-white/[0.08] ring-2 ring-inset ring-white")}>
                  <div className="flex items-center justify-between px-0.5">
                    <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11.5px] tabular-nums", t === bugun ? "bg-[#55d6fd] font-semibold text-[#04212b]" : "text-white/60")}>{Number(t.slice(8))}</span>
                    {planIci(t) && <span className="text-[10.5px] tabular-nums text-white/30">Gün {gun}</span>}
                  </div>
                  {l.slice(0, 3).map((o) => <OlayCipi key={o.anahtar} dikey o={o} ac={() => ac(o)} surukle={surukle(o)} />)}
                  {l.length > 3 && <button type="button" onClick={() => setGunAcik(t)} className="rounded-[8px] px-1.5 py-0.5 text-left text-[11px] text-white/55 hover:bg-white/[0.05] hover:text-white">{l.length - 3} adım daha</button>}
                </div>
              );
            })}
          </div>
          {tarihsiz.length > 0 && (
            <div onDragOver={(e) => { e.preventDefault(); setHedef("tarihsiz"); }} onDragLeave={() => setHedef((h) => (h === "tarihsiz" ? null : h))} onDrop={birak(null)}
              className={cn("mt-3 rounded-[14px] bg-white/[0.02] p-2.5 ring-1 ring-inset ring-white/[0.06] transition-[box-shadow]", hedef === "tarihsiz" && "ring-2 ring-white")}>
              <p className="mb-2 px-0.5 text-[12px] text-white/50">Günü olmayan gönderiler: bir güne sürükle</p>
              <div className="flex flex-wrap gap-1.5">
                {tarihsiz.map((g) => { const o: Olay = { anahtar: `gonderi:${g.id}`, tur: "gonderi", id: g.id, tarih: "", kanal: icerikKanali(g.kanal).plan, baslik: g.baslik || g.metin.split("\n")[0].slice(0, 60), gorsel: g.gorsel, durum: g.durum }; return <span key={g.id} className="w-[200px] max-w-full"><OlayCipi o={o} ac={() => setGonderiAcik(g.id)} surukle={surukle(o)} /></span>; })}
              </div>
            </div>
          )}
        </div>

        {/* Telefon: gün gün liste, tarih alanıyla taşınır */}
        <div className="md:hidden">
          {tarihliListe.length ? (
            <ol className="space-y-3">
              {tarihliListe.map((t) => (
                <li key={t}>
                  <p className="mb-1.5 flex items-center gap-2 text-[12.5px] font-medium text-white/80">{t === bugun && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}{turkceTarih(t)}{planIci(t) && plan && <span className="text-[11.5px] font-normal text-white/35">Gün {gunFarki(t, plan.baslangic) + 1}</span>}</p>
                  <ul className="space-y-1.5">
                    {gunun(t).map((o) => (
                      <li key={o.anahtar} className={cn("flex items-center gap-2.5 rounded-[12px] p-2", o.tur === "plan" ? "border border-dashed border-white/[0.14]" : "bg-white/[0.05]")}>
                        <button type="button" onClick={() => ac(o)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                          {o.gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={o.gorsel} alt="" className="h-8 w-8 shrink-0 rounded-[8px] object-cover" /> : <KanalLogo kanal={o.kanal} boyut={30} />}
                          <span className="min-w-0"><span className="block truncate text-[13px] text-white">{o.baslik}</span><span className="block text-[11.5px] text-white/45">{[...new Set([planKanali(o.kanal).ad, o.tur === "plan" ? TUR_AD[o.ogeTur ?? "gonderi"] : "Gönderi"])].join(" · ")}</span></span>
                        </button>
                        <input type="date" aria-label="Günü değiştir" value={o.tarih} onChange={(e) => e.target.value && tasi(o.anahtar, e.target.value)} className="h-8 w-[118px] shrink-0 rounded-[10px] bg-white/[0.05] px-2 text-[12px] text-white outline-none ring-1 ring-inset ring-white/[0.08] [color-scheme:dark]" />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : <p className="text-[13px] text-white/55">Henüz gün verilmiş adım yok.</p>}
          {tarihsiz.length > 0 && <p className="mt-3 text-[12px] text-white/45">{tarihsiz.length} gönderinin günü yok; İçerik bölümünden gün verebilirsin.</p>}
        </div>
      </Kart>

      <YanPanel acik={!!gunAcik} kapat={() => setGunAcik(null)} baslik={gunAcik ? turkceTarih(gunAcik) : ""} alt={gunAcik ? `${gunun(gunAcik).length} adım` : ""}>
        <div className="space-y-1.5">{gunAcik && gunun(gunAcik).map((o) => <OlayCipi key={o.anahtar} o={o} ac={() => { setGunAcik(null); ac(o); }} />)}</div>
      </YanPanel>
      <GonderiPaneli p={p} b={b} id={gonderiAcik} kapat={() => setGonderiAcik(null)} />
      {plan && <OgePaneli b={b} id={ogeAcik} kapat={() => setOgeAcik(null)} git={git} gonderiAc={(id) => { setOgeAcik(null); setGonderiAcik(id); }} />}
    </div>
  );
}

/** Plan adımı paneli: düzenle, gününü değiştir, gönderisini yazdır. */
function OgePaneli({ b, id, kapat, git, gonderiAc }: { b: BuyumeKanca; id: string | null; kapat: () => void; git: Git; gonderiAc: (id: string) => void }) {
  const plan = b.veri!.plan!;
  const kayit = plan.takvim.find((o) => o.id === id) ?? null;
  const [o, setO] = useState<TakvimOgesi | null>(null);
  const [son, setSon] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [modelYok, setModelYok] = useState(false);
  if (kayit && son !== kayit.id) { setSon(kayit.id); setO(structuredClone(kayit)); setHata(""); setModelYok(false); }
  if (!o) return null;
  const tarih = ogeTarihi(plan, o);
  const icerik = PLANDAN_ICERIGE[o.kanal];
  const yaziliyor = b.suruyor("icerik");
  const kaydet = (y: TakvimOgesi | null) => { const pl = structuredClone(plan); pl.takvim = y ? pl.takvim.map((x) => (x.id === y.id ? y : x)).sort((a, c) => a.gun - c.gun) : pl.takvim.filter((x) => x.id !== o.id); b.degistir((x) => { x.plan = pl; }, { plan: pl }); };
  const yaz = async () => {
    if (!icerik) return;
    setHata(""); setModelYok(false);
    kaydet(o);
    try { const j = await b.uret("icerik", { kanal: icerik, konu: `${o.baslik}${o.aciklama ? `: ${o.aciklama}` : ""}`, ton: "samimi", adet: 1, tarih, takvimId: o.id }); const yeni = (j.yeni as string[] | undefined)?.[0]; if (yeni) gonderiAc(yeni); }
    catch (e) { if (e instanceof ModelYokHatasi) setModelYok(true); else setHata(e instanceof Error ? e.message : "Yazılamadı."); }
  };
  return (
    <YanPanel acik={!!id} kapat={() => { setSon(null); kapat(); }} baslik={<span className="flex items-center gap-2"><KanalLogo kanal={o.kanal} boyut={24} className="rounded-[7px]" />Plan adımı</span>} alt={`${turkceTarih(tarih)} · Gün ${o.gun}`}
      alt2={<>
        <button type="button" onClick={() => { kaydet(null); setSon(null); kapat(); }} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button>
        <button type="button" onClick={() => { kaydet(o); setSon(null); kapat(); }} className={birincil}>Kaydet</button>
      </>}>
      <div className="space-y-3.5">
        {hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}
        {modelYok && <ModelYokKart />}
        <Etiket ad="Başlık"><input value={o.baslik} onChange={(e) => setO({ ...o, baslik: e.target.value })} maxLength={120} className={cn(alan, "h-10")} /></Etiket>
        <Etiket ad="Ne yapılacak"><textarea value={o.aciklama} onChange={(e) => setO({ ...o, aciklama: e.target.value })} rows={3} maxLength={500} className={cn(alan, "resize-none py-2.5")} /></Etiket>
        <div className="grid gap-3 sm:grid-cols-2">
          <Etiket ad="Kanal">
            <SecenekMenusu genislik={320} deger={o.kanal} sec={(k) => setO({ ...o, kanal: k as PlanKanalId })} l={PLAN_KANALLARI.filter((x) => x.id !== "ozel").map((x) => ({ id: x.id, ad: x.ad, alt: x.alt, logo: <KanalLogo kanal={x.id} boyut={28} /> }))}
              ozel={{ deger: "", set: () => {}, yer: "Özel kanal adını başlığa yaz", alt: "Listede olmayan kanal" }}
              tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-10 w-full justify-between pl-2"><span className="flex min-w-0 items-center gap-2"><KanalLogo kanal={o.kanal} boyut={24} /><span className="truncate text-[13px]">{planKanali(o.kanal).ad}</span></span></Cip>} />
          </Etiket>
          <Etiket ad="Gün"><input type="date" value={tarih} min={plan.baslangic} onChange={(e) => { if (!tarihGecerli(e.target.value)) return; const g = gunFarki(e.target.value, plan.baslangic) + 1; if (g >= 1 && g <= 90) setO({ ...o, gun: g }); }} className={cn(alan, "h-10 [color-scheme:dark]")} /></Etiket>
        </div>
        <div><p className="mb-1.5 text-[12.5px] text-white/60">Tür</p><SatirSecici id="buyume-oge-tur" kucuk deger={o.tur} set={(t) => setO({ ...o, tur: t })} l={(Object.keys(TUR_AD) as TakvimTur[]).map((t) => ({ id: t, ad: TUR_AD[t] }))} /></div>
        <div className="rounded-[14px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          {icerik && (o.tur === "gonderi" || o.tur === "eposta") ? (
            <>
              <p className="text-[13px] text-white">Bu adımın gönderisini yaz</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">{icerikKanali(icerik).ad} için metin ve hashtag'ler yazılır, gönderi bu güne yerleşir; görseli sonra üretirsin.</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button type="button" disabled={yaziliyor} onClick={yaz} className={cn(birincil, "h-8")}>{yaziliyor ? <span className="build-nokta" /> : <Wand2 className="h-3.5 w-3.5" />}{yaziliyor ? "Yazılıyor" : "Gönderiyi yaz"}</button>
                <button type="button" onClick={() => { kaydet(o); git("icerik", { kanal: icerik, konu: `${o.baslik}${o.aciklama ? `: ${o.aciklama}` : ""}`, tarih, takvimId: o.id }); }} className={cn(ikincil, "h-8")}>İçerik bölümünde aç</button>
              </div>
            </>
          ) : o.tur === "reklam" || o.kanal === "google-ads" || o.kanal === "meta" ? (
            <><p className="text-[13px] text-white">Reklam adımı</p><p className="mt-0.5 text-[12px] text-white/50">Google Ads ve Meta metinleri Reklam metinleri bölümünde.</p><button type="button" onClick={() => git("reklam")} className={cn(ikincil, "mt-2.5 h-8")}>Reklam metinlerine git</button></>
          ) : o.tur === "blog" || o.kanal === "seo" ? (
            <><p className="text-[13px] text-white">Blog adımı</p><p className="mt-0.5 text-[12px] text-white/50">Konu seç, yazıyı yazdır, siteye sayfa olarak ekle.</p><button type="button" onClick={() => git("blog")} className={cn(ikincil, "mt-2.5 h-8")}>Blog ve SEO&apos;ya git</button></>
          ) : <p className="text-[12.5px] text-white/55">Bu adım elle yapılır; yapınca Plan bölümündeki yapılacaklardan işaretleyebilirsin.</p>}
        </div>
      </div>
    </YanPanel>
  );
}
