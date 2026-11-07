"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, Clock, Copy, Loader2, Mail, Phone, Plus, Settings2, Trash2, UserRound, Users, Wand2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { YanPanel } from "@/components/build/paylasim/ortak";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { RANDEVU_DURUMLARI, VARSAYILAN_RANDEVU, type Calisan, type Hizmet, type Randevu, type RandevuAyar, type RandevuDurum } from "@/lib/build/isletmeTipler";
import { cn } from "@/lib/utils";
import { dilimSaat, dilimTarih, dilimZaman, paraSimgesi, tarihGunu } from "@/lib/build/bolge";
import { Alan, BilgiSatiri, BosDurum, birincil, Girdi, GorselAlani, gorece, HaftaDuzenleyici, HataSatiri, ikincil, isletmeApi, KaydetSeridi, MetinAlani, OnayliDugme, Rozet, SayiGirdi, SecenekCipleri, simgeDugme, tlYaz, useTaslak, panelBolgesi, type IsletmeKanca } from "./ortak";
import { SatirAyar } from "./Magaza";

type Ortak = { k: IsletmeKanca; projeId: string; goster: (m: string, t?: "iyi" | "kotu") => void; ajanaGonder?: (m: string) => void };
/** Saatler işletmenin saat diliminde (profil.saatDilimi; panelBolgesi yükleyince dolar). */
const tz = () => panelBolgesi().tz;
const trTarih = (z: number) => dilimTarih(z, tz());
const trSaat = (z: number) => dilimSaat(z, tz());
const gunBasi = (t: string) => dilimZaman(t, "00:00", tz());
const yerelZaman = (t: string, saat: string) => dilimZaman(t, saat, tz());
const haftaBasi = (z: number) => { const t = trTarih(z); const g = tarihGunu(t); return gunBasi(trTarih(dilimZaman(t, "12:00", tz()) - g * 864e5)); };
const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DURUM_TON: Record<RandevuDurum, "notr" | "imza" | "iyi" | "uyari" | "kotu"> = { bekliyor: "uyari", onaylandi: "imza", geldi: "iyi", gelmedi: "kotu", iptal: "notr" };
const durumAd = (d: RandevuDurum) => RANDEVU_DURUMLARI.find((x) => x.id === d)?.ad ?? d;

/* ═════════════ Takvim ═════════════ */
export function RandevuTakvimi({ o, ayaraGit }: { o: Ortak; ayaraGit: () => void }) {
  const a = o.k.d?.veri.randevu ?? VARSAYILAN_RANDEVU;
  const [hafta, setHafta] = useState(() => haftaBasi(Date.now()));
  const [l, setL] = useState<Randevu[] | null>(null);
  const [secili, setSecili] = useState<Randevu | null>(null);
  const [yeni, setYeni] = useState<string | null>(null);
  const getir = useCallback(async () => {
    const r = await isletmeApi<{ randevular: Randevu[] }>(o.projeId, `randevular?bas=${hafta}&bit=${hafta + 7 * 864e5}`);
    setL(r.randevular); setSecili((s) => (s ? r.randevular.find((x) => x.id === s.id) ?? s : null));
  }, [o.projeId, hafta]);
  useEffect(() => { getir().catch(() => setL([])); const t = setInterval(() => getir().catch(() => {}), 30_000); return () => clearInterval(t); }, [getir]);
  const gunler = Array.from({ length: 7 }, (_, i) => hafta + i * 864e5);
  const bugun = trTarih(Date.now());
  const gorunen = (l ?? []).filter((r) => r.durum !== "iptal");
  const kurulmadi = !a.hizmetler.length;
  return (
    <Kart ikon={CalendarDays} baslik="Randevular" alt={a.acik ? "Site randevu alıyor" : "Çevrim içi randevu kapalı; panelden eklenebilir"}
      sag={<button type="button" disabled={kurulmadi} onClick={() => setYeni(bugun)} className={birincil} aria-label="Randevu ekle"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Randevu ekle</span></button>}>
      <div className="p-3 sm:p-4">
        {kurulmadi ? (
          <BosDurum ikon={CalendarCheck} baslik="Randevu sistemi kurulmadı" alt="Hizmetlerini (süre, fiyat), çalışanlarını ve çalışma saatlerini gir; site müsait saatleri gösterip randevu alsın, müşteriye onay ve hatırlatma gitsin." birincilEylem={{ ad: "Hizmet ekle", tikla: ayaraGit, ikon: Settings2 }} />
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-2"><button type="button" onClick={() => setHafta(hafta - 7 * 864e5)} className={simgeDugme} aria-label="Önceki hafta"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setHafta(haftaBasi(Date.now()))} className={cn(ikincil, "h-8")}>Bu hafta</button><button type="button" onClick={() => setHafta(hafta + 7 * 864e5)} className={simgeDugme} aria-label="Sonraki hafta"><ChevronRight className="h-4 w-4" /></button><p className="text-[12.5px] text-white/55">{new Date(hafta).toLocaleDateString("tr-TR", { timeZone: tz(), day: "numeric", month: "long" })} ile {new Date(hafta + 6 * 864e5).toLocaleDateString("tr-TR", { timeZone: tz(), day: "numeric", month: "long", year: "numeric" })} · {gorunen.length} randevu</p></div>
            <div className="grid gap-2 md:grid-cols-7">
              {gunler.map((g, i) => {
                const t = trTarih(g + 12 * 3600_000);
                const bu = gorunen.filter((r) => trTarih(r.bas) === t).sort((x, y) => x.bas - y.bas);
                const kapali = a.kapaliGunler.includes(t) || !a.saatler[i]?.acik;
                return (
                  <div key={t} className={cn("rounded-[16px] p-2 ring-1 ring-inset md:min-h-[132px]", t === bugun ? "bg-[#55d6fd]/[0.05] ring-[#55d6fd]/30" : "bg-white/[0.02] ring-white/[0.07]")}>
                    <div className="mb-1.5 flex items-center justify-between px-1">
                      <span className="text-[12px] font-medium text-white">{GUN_KISA[i]} <span className="text-white/50">{Number(t.slice(8))}</span></span>
                      <button type="button" onClick={() => setYeni(t)} className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.08] hover:text-white" aria-label={`${t} için randevu ekle`}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    {!bu.length && <p className="px-1 text-[11.5px] text-white/35">{kapali ? "Kapalı" : <span className="md:hidden">Randevu yok</span>}</p>}
                    <div className="space-y-1">
                      {bu.map((r) => (
                        <button key={r.id} type="button" onClick={() => setSecili(r)} className={cn("block w-full rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-white/[0.09]", r.durum === "bekliyor" ? "bg-amber-400/[0.1]" : r.durum === "gelmedi" ? "bg-rose-500/[0.08]" : "bg-white/[0.06]")}>
                          <span className="block text-[11.5px] font-semibold tabular-nums text-white">{trSaat(r.bas)}</span>
                          <span className="block truncate text-[11.5px] text-white/80">{r.ad}</span>
                          <span className="block truncate text-[11px] text-white/45">{r.hizmetAd}{r.calisanAd ? ` · ${r.calisanAd}` : ""}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {!l && <div className="mt-3 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>}
          </>
        )}
      </div>
      <RandevuPaneli o={o} r={secili} kapat={() => setSecili(null)} yenile={getir} />
      <YeniRandevu o={o} tarih={yeni} kapat={() => setYeni(null)} bitti={() => { setYeni(null); getir(); }} />
    </Kart>
  );
}

function RandevuPaneli({ o, r, kapat, yenile }: { o: Ortak; r: Randevu | null; kapat: () => void; yenile: () => Promise<void> }) {
  const [bildir, setBildir] = useState(true);
  const [is, setIs] = useState("");
  const [hata, setHata] = useState("");
  const [tasi, setTasi] = useState({ tarih: "", saat: "" });
  useEffect(() => { if (r) { setHata(""); setTasi({ tarih: trTarih(r.bas), saat: trSaat(r.bas) }); } }, [r]);
  if (!r) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const islem = async (ad: string, govde: Record<string, unknown>) => {
    setIs(ad); setHata("");
    try { const x = await isletmeApi<{ eposta: boolean }>(o.projeId, `randevu/${r.id}`, { govde: { ...govde, bildir } }); o.goster(bildir && !x.eposta && !o.k.d?.servis.eposta ? "Kaydedildi; e-posta servisi kurulu olmadığı için müşteriye bildirim gitmedi" : "Kaydedildi", bildir && !o.k.d?.servis.eposta ? "kotu" : "iyi"); await yenile(); }
    catch (e) { setHata((e as Error).message); } finally { setIs(""); }
  };
  const sil = async () => { await isletmeApi(o.projeId, `randevu/${r.id}`, { method: "DELETE" }); kapat(); await yenile(); };
  const gecmis = r.bas < Date.now();
  return (
    <YanPanel acik={!!r} kapat={kapat} baslik={r.ad} alt={`${r.hizmetAd} · ${new Date(r.bas).toLocaleString("tr-TR", { timeZone: tz(), weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`} durum={<Rozet ton={DURUM_TON[r.durum]} className="mt-1">{durumAd(r.durum)}</Rozet>}
      alt2={<><OnayliDugme soru="Kalıcı silinsin mi? İptal etmek genelde daha iyi." onayla={sil} className={cn(ikincil, "text-rose-200")}><Trash2 className="h-4 w-4" />Sil</OnayliDugme><span className="flex-1" /><label className="flex items-center gap-2 text-[12.5px] text-white/65"><Anahtar acik={bildir} set={setBildir} etiket="Müşteriye bildir" />Müşteriye e-posta</label></>}>
      <div className="space-y-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        <div className="flex flex-wrap gap-2">
          {r.durum === "bekliyor" && <button type="button" disabled={!!is} onClick={() => islem("onay", { durum: "onaylandi" })} className={birincil}>{is === "onay" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Onayla</button>}
          {gecmis && r.durum !== "iptal" && <><button type="button" disabled={!!is} onClick={() => islem("geldi", { durum: "geldi" })} className={ikincil}>Geldi</button><button type="button" disabled={!!is} onClick={() => islem("gelmedi", { durum: "gelmedi" })} className={ikincil}>Gelmedi</button></>}
          {r.durum !== "iptal" && <button type="button" disabled={!!is} onClick={() => islem("iptal", { durum: "iptal", neden: "İşletme iptal etti" })} className={cn(ikincil, "text-rose-200")}>İptal et</button>}
          {r.durum === "iptal" && <button type="button" disabled={!!is} onClick={() => islem("geri", { durum: "onaylandi" })} className={ikincil}>Yeniden aç</button>}
        </div>
        <div className="grid gap-2 rounded-[16px] bg-white/[0.03] p-3.5 text-[13px] ring-1 ring-inset ring-white/[0.07]">
          <p className="flex items-center gap-2 text-white"><Clock className="h-4 w-4 text-white/50" />{r.sure} dakika{r.fiyat != null ? ` · ${tlYaz(r.fiyat)}` : ""}{r.calisanAd ? ` · ${r.calisanAd}` : ""}</p>
          {r.telefon && <a href={`tel:${r.telefon.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 text-[#8be6ff]"><Phone className="h-4 w-4" />{r.telefon}</a>}
          {r.eposta && <a href={`mailto:${r.eposta}`} className="flex items-center gap-2 text-[#8be6ff]"><Mail className="h-4 w-4" />{r.eposta}</a>}
          {r.not && <p className="text-white/70">Not: {r.not}</p>}
          <p className="text-[12px] text-white/45">{r.kaynak === "site" ? "Siteden alındı" : "Panelden eklendi"} · {gorece(r.olusturma)}{r.hatirlatildi ? " · hatırlatma gönderildi" : ""}</p>
        </div>
        {r.durum !== "iptal" && (
          <div className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
            <p className="mb-2 text-[13px] font-medium text-white">Saati değiştir</p>
            <div className="flex flex-wrap gap-2">
              <Girdi type="date" value={tasi.tarih} onChange={(e) => setTasi({ ...tasi, tarih: e.target.value })} className="w-[160px]" />
              <Girdi type="time" value={tasi.saat} onChange={(e) => setTasi({ ...tasi, saat: e.target.value })} className="w-[120px]" />
              <button type="button" disabled={!!is || !tasi.tarih || !tasi.saat} onClick={() => islem("tasi", { bas: yerelZaman(tasi.tarih, tasi.saat) })} className={ikincil}>{is === "tasi" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Taşı</button>
              <button type="button" disabled={!!is || !tasi.tarih || !tasi.saat} onClick={() => islem("tasi", { bas: yerelZaman(tasi.tarih, tasi.saat), zorla: true })} className="text-[12px] text-white/45 hover:text-white">Müsaitliğe bakmadan taşı</button>
            </div>
          </div>
        )}
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-white/75">Geçmiş</p>
          <ol className="space-y-1.5 border-l border-white/[0.1] pl-3.5">{r.gecmis.slice().reverse().map((x, i) => <li key={i} className="relative text-[12.5px] text-white/75"><span className="absolute -left-[19px] top-1.5 h-2 w-2 rounded-full bg-white/30" />{x.olay}<span className="block text-[11.5px] text-white/40">{new Date(x.z).toLocaleString("tr-TR", { timeZone: tz() })}</span></li>)}</ol>
        </div>
      </div>
    </YanPanel>
  );
}

function YeniRandevu({ o, tarih, kapat, bitti }: { o: Ortak; tarih: string | null; kapat: () => void; bitti: () => void }) {
  const a = o.k.d?.veri.randevu ?? VARSAYILAN_RANDEVU;
  const [g, setG] = useState({ hizmet: "", calisan: "", tarih: "", saat: "", ad: "", telefon: "", eposta: "", not: "", bildir: true });
  const [saatler, setSaatler] = useState<{ bas: number; saat: string }[]>([]);
  const [hata, setHata] = useState("");
  const [is, setIs] = useState(false);
  useEffect(() => { if (tarih) { setHata(""); setG((x) => ({ ...x, tarih, hizmet: x.hizmet || a.hizmetler.find((h) => h.aktif)?.id || "", saat: "" })); } }, [tarih, a.hizmetler]);
  useEffect(() => {
    if (!tarih || !g.hizmet || !g.tarih) return;
    isletmeApi<{ saatler: { bas: number; saat: string }[] }>(o.projeId, `randevu/saatler?hizmet=${g.hizmet}&calisan=${g.calisan}&tarih=${g.tarih}`).then((r) => setSaatler(r.saatler)).catch(() => setSaatler([]));
  }, [o.projeId, tarih, g.hizmet, g.calisan, g.tarih]);
  const h = a.hizmetler.find((x) => x.id === g.hizmet);
  const cl = a.calisanlar.filter((c) => c.aktif && (!h?.calisanlar.length || h.calisanlar.includes(c.id)));
  const kaydet = async (zorla = false) => {
    setIs(true); setHata("");
    try { await isletmeApi(o.projeId, "randevu", { govde: { hizmet: g.hizmet, calisan: g.calisan, bas: `${g.tarih}T${g.saat}`, ad: g.ad, telefon: g.telefon, eposta: g.eposta, not: g.not, bildir: g.bildir, zorla } }); o.goster("Randevu eklendi"); bitti(); }
    catch (e) { setHata((e as Error).message); } finally { setIs(false); }
  };
  return (
    <YanPanel acik={!!tarih} kapat={kapat} baslik="Randevu ekle" alt="Telefonla ya da yüz yüze alınan randevular"
      alt2={<><span className="flex-1" /><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" disabled={is || !g.hizmet || !g.saat || !g.ad} onClick={() => kaydet(false)} className={birincil}>{is && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button></>}>
      <div className="space-y-4">
        <HataSatiri mesaj={hata} kapat={() => setHata("")} />
        {hata.includes("müsait") && <button type="button" onClick={() => kaydet(true)} className={ikincil}>Müsaitliği yok sayıp kaydet</button>}
        <Alan etiket="Hizmet"><div className="flex flex-wrap gap-1.5">{a.hizmetler.filter((x) => x.aktif).map((x) => <button key={x.id} type="button" onClick={() => setG({ ...g, hizmet: x.id, saat: "" })} className={cn("rounded-[12px] px-3 py-2 text-left text-[12.5px]", g.hizmet === x.id ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 hover:text-white")}><span className="block font-medium">{x.ad}</span><span className="text-white/50">{x.sure} dk{x.fiyat != null ? ` · ${tlYaz(x.fiyat)}` : ""}</span></button>)}</div></Alan>
        {cl.length > 1 && <Alan etiket="Çalışan"><div className="flex flex-wrap gap-1.5">{[{ id: "", ad: "Fark etmez" }, ...cl].map((c) => <button key={c.id} type="button" onClick={() => setG({ ...g, calisan: c.id, saat: "" })} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium", g.calisan === c.id ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70")}>{c.ad}</button>)}</div></Alan>}
        <div className="grid grid-cols-2 gap-3">
          <Alan etiket="Tarih"><Girdi type="date" value={g.tarih} onChange={(e) => setG({ ...g, tarih: e.target.value, saat: "" })} /></Alan>
          <Alan etiket="Saat" alt="listede yoksa yaz"><Girdi type="time" value={g.saat} onChange={(e) => setG({ ...g, saat: e.target.value })} /></Alan>
        </div>
        {saatler.length > 0 ? <div className="flex flex-wrap gap-1.5">{saatler.map((s) => <button key={s.bas} type="button" onClick={() => setG({ ...g, saat: s.saat })} className={cn("h-8 rounded-full px-3 text-[12.5px] tabular-nums", g.saat === s.saat ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 hover:text-white")}>{s.saat}</button>)}</div> : g.hizmet && <p className="text-[12.5px] text-white/45">Bu gün için boş saat yok; saati elle yazıp kaydedebilirsin.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Alan etiket="Ad soyad"><Girdi value={g.ad} onChange={(e) => setG({ ...g, ad: e.target.value })} maxLength={80} /></Alan>
          <Alan etiket="Telefon"><Girdi type="tel" value={g.telefon} onChange={(e) => setG({ ...g, telefon: e.target.value })} maxLength={20} /></Alan>
          <Alan etiket="E-posta" className="sm:col-span-2"><Girdi type="email" value={g.eposta} onChange={(e) => setG({ ...g, eposta: e.target.value })} maxLength={120} /></Alan>
        </div>
        <Alan etiket="Not"><MetinAlani value={g.not} onChange={(e) => setG({ ...g, not: e.target.value })} rows={2} maxLength={600} /></Alan>
        <label className="flex items-center gap-2 text-[13px] text-white/75"><Anahtar acik={g.bildir} set={(x) => setG({ ...g, bildir: x })} etiket="Onay e-postası" />Müşteriye onay e-postası gönder</label>
      </div>
    </YanPanel>
  );
}

/* ═════════════ Ayarlar: hizmetler, çalışanlar, saatler, kurallar ═════════════ */
const yeniHizmet = (): Hizmet => ({ id: Math.random().toString(36).slice(2, 10), ad: "", aciklama: "", sure: 30, fiyat: null, tampon: 0, calisanlar: [], aktif: true, kapasite: 1 });
const yeniCalisan = (a: RandevuAyar): Calisan => ({ id: Math.random().toString(36).slice(2, 10), ad: "", unvan: "", gorsel: "", eposta: "", ozelSaat: false, saatler: a.saatler, izinler: [], aktif: true });
export function RandevuAyarlari({ o }: { o: Ortak }) {
  const asil = o.k.d?.veri.randevu ?? VARSAYILAN_RANDEVU;
  const tk = useTaslak<RandevuAyar>(asil, (v) => o.k.kaydet("randevu", v));
  const t = tk.t;
  const [hizmet, setHizmet] = useState<number | null>(null);
  const [calisan, setCalisan] = useState<number | null>(null);
  const [takvim, setTakvim] = useState("");
  const [kapaliGun, setKapaliGun] = useState("");
  const takvimAdresi = asil.takvimAnahtari ? `${location.origin}/api/build/isletme-genel/${o.projeId}/randevu/takvim/${asil.takvimAnahtari}.ics` : "";
  const takvimUret = async () => { const r = await isletmeApi<{ adres: string }>(o.projeId, "randevu/takvim-anahtari", { govde: {} }); setTakvim(r.adres); o.k.yukle(); };
  const seri = <KaydetSeridi {...tk} kaydet={tk.kaydet} />;
  return (
    <div className="space-y-4">
      <Kart ikon={CalendarCheck} baslik="Çevrim içi randevu" alt="Sitede data-vayra-randevu öğesi müsait saatleri gösterir" altSerit={seri} sag={<Anahtar acik={t.acik} set={(x) => tk.d("acik", x)} etiket="Çevrim içi randevu" />}>
        <div className="space-y-3 p-4 sm:p-5">
          <BilgiSatiri ton="imza">Sitene randevu bölümü eklemek için sayfaya <code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[12px]">{'<div data-vayra-randevu></div>'}</code> koyman yeterli; hizmet seçimi, gün, saat, form ve onay ekranı kendiliğinden gelir.
            {o.ajanaGonder && <button type="button" onClick={() => o.ajanaGonder!("Siteye bir randevu sayfası ekle (randevu.html): üst menüye bağlantı koy, sayfada işletmenin hizmetlerini tanıtan kısa bir giriş ve altında <div data-vayra-randevu></div> öğesi olsun. Sitenin tasarımına uydur.")} className="mt-2 flex items-center gap-1.5 font-medium text-[#8be6ff]"><Wand2 className="h-3.5 w-3.5" />Ajana randevu sayfası ekletmek</button>}
          </BilgiSatiri>
        </div>
      </Kart>
      <Kart ikon={Clock} baslik="Hizmetler" alt="Süre, fiyat, tampon ve kim veriyor" sag={<button type="button" onClick={() => { tk.d("hizmetler", [...t.hizmetler, yeniHizmet()]); setHizmet(t.hizmetler.length); }} className={ikincil}><Plus className="h-4 w-4" /><span className="max-sm:hidden">Hizmet ekle</span></button>} altSerit={seri}>
        <div className="p-3 sm:p-4">
          {!t.hizmetler.length ? <BosDurum ikon={Clock} baslik="Henüz hizmet yok" alt="Saç kesimi 45 dakika, diş muayenesi 30 dakika, yoga dersi 60 dakika 10 kişi gibi." birincilEylem={{ ad: "Hizmet ekle", tikla: () => { tk.d("hizmetler", [yeniHizmet()]); setHizmet(0); } }} />
            : <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">{t.hizmetler.map((h, i) => (
              <button key={h.id} type="button" onClick={() => setHizmet(i)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-white/[0.04]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-[12px] font-semibold tabular-nums text-white">{h.sure}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{h.ad || "Adsız hizmet"}</span><span className="block truncate text-[12px] text-white/50">{h.sure} dakika{h.tampon ? ` + ${h.tampon} dk ara` : ""}{h.kapasite > 1 ? ` · ${h.kapasite} kişi` : ""} · {h.calisanlar.length ? `${h.calisanlar.length} çalışan` : "herkes verebilir"}</span></span>
                <span className="text-[13px] font-semibold tabular-nums text-white">{h.fiyat != null ? tlYaz(h.fiyat) : "Ücretsiz"}</span>
                {!h.aktif && <Rozet>Kapalı</Rozet>}
              </button>
            ))}</div>}
        </div>
      </Kart>
      <Kart ikon={Users} baslik="Çalışanlar" alt="Her çalışanın kendi saatleri ve izin günleri olabilir; boşsa randevular işletmeye alınır" sag={<button type="button" onClick={() => { tk.d("calisanlar", [...t.calisanlar, yeniCalisan(t)]); setCalisan(t.calisanlar.length); }} className={ikincil}><Plus className="h-4 w-4" /><span className="max-sm:hidden">Çalışan ekle</span></button>} altSerit={seri}>
        <div className="p-3 sm:p-4">
          {!t.calisanlar.length ? <p className="px-1 py-2 text-[13px] text-white/50">Çalışan eklemezsen randevular tek takvime (işletmeye) yazılır.</p>
            : <div className="grid gap-2 sm:grid-cols-2">{t.calisanlar.map((c, i) => (
              <button key={c.id} type="button" onClick={() => setCalisan(i)} className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.07]">{c.gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.gorsel} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-5 w-5 text-white/50" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{c.ad || "Adsız"}</span><span className="block truncate text-[12px] text-white/50">{[c.unvan, c.ozelSaat ? "kendi saatleri" : "işletme saatleri", c.izinler.length ? `${c.izinler.length} izin günü` : null].filter(Boolean).join(" · ")}</span></span>
                {!c.aktif && <Rozet>Kapalı</Rozet>}
              </button>
            ))}</div>}
        </div>
      </Kart>
      <Kart ikon={CalendarDays} baslik="Çalışma saatleri" alt="Randevu verilen saatler; işletme profilindeki saatlerden ayrı tutulabilir" altSerit={seri} sag={o.k.d?.veri.profil.saatler && <button type="button" onClick={() => tk.d("saatler", o.k.d!.veri.profil.saatler)} className={ikincil}><span className="max-sm:hidden">Profildeki saatleri kullan</span><span className="sm:hidden">Profilden al</span></button>}>
        <div className="space-y-3 p-3 sm:p-4">
          <HaftaDuzenleyici deger={t.saatler} set={(x) => tk.d("saatler", x)} />
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-white/75">Kapalı günler <span className="font-normal text-white/45">tatil, bayram, bakım</span></p>
            <div className="flex flex-wrap items-center gap-1.5">
              {t.kapaliGunler.map((g) => <span key={g} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1 text-[12.5px] text-white">{new Date(`${g}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}<button type="button" onClick={() => tk.d("kapaliGunler", t.kapaliGunler.filter((x) => x !== g))} className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:text-white" aria-label="Kaldır">×</button></span>)}
              <Girdi type="date" value={kapaliGun} onChange={(e) => setKapaliGun(e.target.value)} className="h-8 w-[160px]" />
              <button type="button" disabled={!kapaliGun} onClick={() => { tk.d("kapaliGunler", [...new Set([...t.kapaliGunler, kapaliGun])].sort()); setKapaliGun(""); }} className={ikincil}>Ekle</button>
            </div>
          </div>
        </div>
      </Kart>
      <Kart ikon={Settings2} baslik="Kurallar ve bildirimler" alt="Ne kadar önceden, ne kadar ileriye, onay, hatırlatma ve iptal" altSerit={seri}>
        <div className="divide-y divide-white/[0.06]">
          <SatirAyar baslik="Saat aralığı" alt="Müsait saatler bu adımla listelenir"><SecenekCipleri<number> deger={t.adim} set={(x) => tk.d("adim", x)} l={[15, 20, 30, 60].map((x) => ({ id: x, ad: `${x} dk` }))} /></SatirAyar>
          <SatirAyar baslik="En az önceden" alt="Son dakika randevusunu önler"><SecenekCipleri<number> deger={t.enAzOnce} set={(x) => tk.d("enAzOnce", x)} l={[{ id: 0, ad: "Hemen" }, { id: 60, ad: "1 saat" }, { id: 120, ad: "2 saat" }, { id: 1440, ad: "1 gün" }]} ozel birim="dk" /></SatirAyar>
          <SatirAyar baslik="En çok ileriye"><SecenekCipleri<number> deger={t.enCokIleri} set={(x) => tk.d("enCokIleri", x)} l={[{ id: 14, ad: "2 hafta" }, { id: 30, ad: "1 ay" }, { id: 60, ad: "2 ay" }, { id: 90, ad: "3 ay" }]} ozel birim="gün" /></SatirAyar>
          <SatirAyar baslik="Onay" alt="Elle onayda randevu, sen onaylayana kadar bekler"><Secici id="randevu-onay" kucuk deger={t.onay} set={(x) => tk.d("onay", x)} l={[{ id: "otomatik", ad: "Otomatik" }, { id: "elle", ad: "Ben onaylarım" }]} /></SatirAyar>
          <SatirAyar baslik="Hatırlatma e-postası" alt={o.k.d?.servis.eposta ? "Zamanlayıcı 5 dakikada bir gönderir" : "E-posta servisi kurulu değil; hatırlatma gitmez"}><div className="flex flex-wrap items-center gap-2"><Anahtar acik={t.hatirlatma.acik} set={(x) => tk.d("hatirlatma", { ...t.hatirlatma, acik: x })} etiket="Hatırlatma" />{t.hatirlatma.acik && <SecenekCipleri<number> deger={t.hatirlatma.saat} set={(x) => tk.d("hatirlatma", { ...t.hatirlatma, saat: x })} l={[2, 12, 24, 48].map((x) => ({ id: x, ad: `${x} saat önce` }))} />}</div></SatirAyar>
          <SatirAyar baslik="Müşteri iptali" alt="Randevuya bu süreden az kala e-postadaki bağlantıyla iptal edilemez"><SecenekCipleri<number> deger={t.iptalSaat} set={(x) => tk.d("iptalSaat", x)} l={[{ id: 2, ad: "2 saat" }, { id: 12, ad: "12 saat" }, { id: 24, ad: "24 saat" }]} ozel birim="saat" /></SatirAyar>
          <SatirAyar baslik="Yeni randevu bildirimi" alt="Boşsa profil e-postası"><Girdi type="email" value={t.sahipEposta} onChange={(e) => tk.d("sahipEposta", e.target.value)} placeholder={o.k.d?.veri.profil.eposta || "randevu@alanadin.com"} className="w-[240px] max-sm:w-full" /></SatirAyar>
          <SatirAyar baslik="Takvim aboneliği" alt="Google Takvim, Apple Takvim ya da Outlook'a ekle; randevular kendiliğinden görünür (tek yönlü)">
            {takvimAdresi || takvim ? <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto"><code className="min-w-0 flex-1 truncate rounded-[10px] bg-white/[0.05] px-2.5 py-2 text-[11.5px] text-white/70 sm:max-w-[300px]">{takvim || takvimAdresi}</code><button type="button" onClick={() => { navigator.clipboard.writeText(takvim || takvimAdresi); o.goster("Adres kopyalandı"); }} className={simgeDugme} aria-label="Kopyala"><Copy className="h-4 w-4" /></button><button type="button" onClick={takvimUret} className="text-[12px] text-white/45 hover:text-white">Yenile</button></div>
              : <button type="button" onClick={takvimUret} className={ikincil}>Abonelik adresi oluştur</button>}
          </SatirAyar>
        </div>
      </Kart>
      <HizmetPaneli i={hizmet} t={t} set={(h) => tk.d("hizmetler", t.hizmetler.map((x, j) => (j === hizmet ? h : x)))} sil={() => { tk.d("hizmetler", t.hizmetler.filter((_, j) => j !== hizmet)); setHizmet(null); }} kapat={() => setHizmet(null)} kaydet={async () => { await tk.kaydet(); setHizmet(null); }} />
      <CalisanPaneli projeId={o.projeId} i={calisan} t={t} set={(c) => tk.d("calisanlar", t.calisanlar.map((x, j) => (j === calisan ? c : x)))} sil={() => { tk.d("calisanlar", t.calisanlar.filter((_, j) => j !== calisan)); setCalisan(null); }} kapat={() => setCalisan(null)} kaydet={async () => { await tk.kaydet(); setCalisan(null); }} />
    </div>
  );
}
function HizmetPaneli({ i, t, set, sil, kapat, kaydet }: { i: number | null; t: RandevuAyar; set: (h: Hizmet) => void; sil: () => void; kapat: () => void; kaydet: () => Promise<void> }) {
  const h = i !== null ? t.hizmetler[i] : null;
  const d = <K extends keyof Hizmet>(k: K, v: Hizmet[K]) => h && set({ ...h, [k]: v });
  return (
    <YanPanel acik={!!h} kapat={kapat} baslik={h?.ad || "Hizmet"} alt="Değişiklikler kaydedince geçerli olur" alt2={<><button type="button" onClick={sil} className={cn(ikincil, "text-rose-200")}><Trash2 className="h-4 w-4" />Sil</button><span className="flex-1" /><button type="button" onClick={kaydet} disabled={!h?.ad} className={birincil}>Kaydet</button></>}>
      {h && (
        <div className="space-y-4">
          <Alan etiket="Hizmet adı"><Girdi value={h.ad} onChange={(e) => d("ad", e.target.value)} maxLength={80} placeholder="Saç kesimi" /></Alan>
          <Alan etiket="Açıklama"><MetinAlani value={h.aciklama} onChange={(e) => d("aciklama", e.target.value)} rows={2} maxLength={400} /></Alan>
          <Alan etiket="Süre"><SecenekCipleri<number> deger={h.sure} set={(x) => d("sure", Math.max(5, x))} l={[15, 30, 45, 60, 90].map((x) => ({ id: x, ad: `${x} dk` }))} ozel birim="dk" /></Alan>
          <div className="grid grid-cols-2 gap-3">
            <Alan etiket="Fiyat" alt="boşsa gösterilmez"><SayiGirdi deger={h.fiyat} set={(x) => d("fiyat", x)} bos birim={paraSimgesi(panelBolgesi().para, "tr-TR")} /></Alan>
            <Alan etiket="Kişi sayısı" alt="grup dersi"><SayiGirdi deger={h.kapasite} set={(x) => d("kapasite", Math.max(1, x ?? 1))} min={1} max={50} /></Alan>
          </div>
          <Alan etiket="Ardından ara" alt="hazırlık, temizlik"><SecenekCipleri<number> deger={h.tampon} set={(x) => d("tampon", x)} l={[0, 5, 10, 15, 30].map((x) => ({ id: x, ad: x ? `${x} dk` : "Yok" }))} ozel birim="dk" /></Alan>
          {t.calisanlar.length > 0 && <Alan etiket="Kim veriyor" alt="seçmezsen hepsi"><div className="flex flex-wrap gap-1.5">{t.calisanlar.map((c) => { const s = h.calisanlar.includes(c.id); return <button key={c.id} type="button" onClick={() => d("calisanlar", s ? h.calisanlar.filter((x) => x !== c.id) : [...h.calisanlar, c.id])} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium", s ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/65")}>{c.ad || "Adsız"}</button>; })}</div></Alan>}
          <label className="flex items-center gap-2 text-[13px] text-white/75"><Anahtar acik={h.aktif} set={(x) => d("aktif", x)} etiket="Sitede göster" />Sitede randevuya açık</label>
        </div>
      )}
    </YanPanel>
  );
}
function CalisanPaneli({ projeId, i, t, set, sil, kapat, kaydet }: { projeId: string; i: number | null; t: RandevuAyar; set: (c: Calisan) => void; sil: () => void; kapat: () => void; kaydet: () => Promise<void> }) {
  const c = i !== null ? t.calisanlar[i] : null;
  const [izin, setIzin] = useState("");
  const d = <K extends keyof Calisan>(k: K, v: Calisan[K]) => c && set({ ...c, [k]: v });
  return (
    <YanPanel acik={!!c} kapat={kapat} genislik={560} baslik={c?.ad || "Çalışan"} alt="Değişiklikler kaydedince geçerli olur" alt2={<><button type="button" onClick={sil} className={cn(ikincil, "text-rose-200")}><Trash2 className="h-4 w-4" />Sil</button><span className="flex-1" /><button type="button" onClick={kaydet} disabled={!c?.ad} className={birincil}>Kaydet</button></>}>
      {c && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
            <GorselAlani projeId={projeId} deger={c.gorsel} set={(x) => d("gorsel", x)} etiket="Fotoğraf" oran="aspect-square" className="max-sm:w-[110px]" />
            <div className="space-y-3">
              <Alan etiket="Ad soyad"><Girdi value={c.ad} onChange={(e) => d("ad", e.target.value)} maxLength={80} /></Alan>
              <Alan etiket="Unvan"><Girdi value={c.unvan} onChange={(e) => d("unvan", e.target.value)} maxLength={80} placeholder="Kıdemli stilist" /></Alan>
            </div>
          </div>
          <Alan etiket="E-posta" alt="kendi randevularının bildirimi"><Girdi type="email" value={c.eposta} onChange={(e) => d("eposta", e.target.value)} maxLength={120} /></Alan>
          <label className="flex items-center gap-2 text-[13px] text-white/75"><Anahtar acik={c.ozelSaat} set={(x) => d("ozelSaat", x)} etiket="Kendi saatleri" />Kendi çalışma saatleri var</label>
          {c.ozelSaat && <HaftaDuzenleyici deger={c.saatler} set={(x) => d("saatler", x)} />}
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium text-white/75">İzin günleri</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {c.izinler.map((g) => <span key={g} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1 text-[12.5px] text-white">{g}<button type="button" onClick={() => d("izinler", c.izinler.filter((x) => x !== g))} className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:text-white" aria-label="Kaldır">×</button></span>)}
              <Girdi type="date" value={izin} onChange={(e) => setIzin(e.target.value)} className="h-8 w-[160px]" /><button type="button" disabled={!izin} onClick={() => { d("izinler", [...new Set([...c.izinler, izin])].sort()); setIzin(""); }} className={ikincil}>Ekle</button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-white/75"><Anahtar acik={c.aktif} set={(x) => d("aktif", x)} etiket="Randevu alıyor" />Randevu alıyor</label>
        </div>
      )}
    </YanPanel>
  );
}

/** Genel bakış için: yaklaşan randevular. */
export function YaklasanRandevular({ o, git }: { o: Ortak; git: () => void }) {
  const [l, setL] = useState<Randevu[] | null>(null);
  useEffect(() => { isletmeApi<{ yaklasan: Randevu[] }>(o.projeId, "randevular").then((r) => setL(r.yaklasan.slice(0, 5))).catch(() => setL([])); }, [o.projeId]);
  const gruplu = useMemo(() => l ?? [], [l]);
  if (!l || !l.length) return null;
  return (
    <div className="divide-y divide-white/[0.06]">
      {gruplu.map((r) => <button key={r.id} type="button" onClick={git} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03]"><span className="w-[92px] shrink-0 text-[12px] tabular-nums text-white/55">{new Date(r.bas).toLocaleString("tr-TR", { timeZone: tz(), day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span><span className="min-w-0 flex-1 truncate text-[13px] text-white">{r.ad} <span className="text-white/45">· {r.hizmetAd}</span></span><Rozet ton={DURUM_TON[r.durum]}>{durumAd(r.durum)}</Rozet></button>)}
    </div>
  );
}
