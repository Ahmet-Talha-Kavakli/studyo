"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpRight, CalendarCheck, ChevronDown, Copy, FileText, Heading1, Link2, Mail, Pilcrow, Plus, QrCode, ShoppingBag, Smartphone, Trash2 } from "lucide-react";
import { BIO_OGELERI, BIO_SOSYAL, BIO_TEMALARI, bioHtml, type BioOge, type BioOgeTur, type BioSayfa, type BioTema } from "@/lib/build/buyumeBio";
import { cn } from "@/lib/utils";
import { Secici } from "./ortak";
import { AcilirMenu, alan, birincil, Etiket, Halka, HataSatiri, ikincil, Kart, Rozet, simgeDugme, useKopyala } from "./ortak";
import { oranYaz, SayiSatiri } from "./bloklar";
import { qrYolu } from "./Baglantilar";
import type { BolumProps } from "./BuyumeSekme";

const OGE_SIMGE: Record<BioOgeTur, typeof Link2> = { baglanti: Link2, urun: ShoppingBag, yazi: FileText, whatsapp: Smartphone, randevu: CalendarCheck, abone: Mail, baslik: Heading1, metin: Pilcrow };
const kid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
const trGun = (n = 0) => new Date(Date.now() + 3 * 3600_000 - n * 864e5).toISOString().slice(0, 10);
type Taslak = Omit<BioSayfa, "ist" | "olusturma" | "guncelleme">;

export function BioBolumu({ e, p }: BolumProps) {
  const d = e.d!;
  const b = d.ek.bio;
  const [hata, setHata] = useState("");
  if (!b) return (
    <div className="space-y-4">
      <Kart baslik="Bio sayfası" aciklama="Instagram, TikTok ve WhatsApp biyografine koyacağın tek bağlantı: siten, ürünlerin, randevun, WhatsApp'ın ve bülten kutun tek sayfada. Her tık sayılır; bülten kutusu kişileri izin kaydıyla Kişiler'e yazar.">
        <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
          <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.1]"><Smartphone className="h-5 w-5 text-[#8be6ff]" /></span>
          <p className="min-w-[200px] flex-1 text-[13px] leading-relaxed text-white/70">Sayfa projendeki bilgilerle kurulur: site adresi, İşletme profilindeki logo ve sosyal hesaplar, varsa randevu ve WhatsApp, son blog yazıları.</p>
          <button type="button" disabled={e.suruyor("bio-olustur")} onClick={() => e.islem("bio-olustur").catch((x) => setHata(x.message))} className={birincil}>{e.suruyor("bio-olustur") ? <span className="build-nokta" /> : <Plus className="h-4 w-4" />}Bio sayfası oluştur</button>
        </div>
      </Kart>
      {hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}
    </div>
  );
  return <BioDuzen e={e} p={p} b={b} />;
}

function BioDuzen({ e, b }: Pick<BolumProps, "e" | "p"> & { b: BioSayfa }) {
  const d = e.d!;
  const al = (x: BioSayfa): Taslak => ({ kod: x.kod, acik: x.acik, baslik: x.baslik, aciklama: x.aciklama, avatar: x.avatar, tema: x.tema, ogeler: x.ogeler, sosyal: x.sosyal, seo: x.seo, rozet: x.rozet });
  const [t, setT] = useState<Taslak>(() => al(b));
  const [kirli, setKirli] = useState(false);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [acik, setAcik] = useState<string | null>(null);
  const [kopya, kopyala] = useKopyala();
  const [karekod, setKarekod] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const ilk = useRef(true);
  useEffect(() => { if (ilk.current) { ilk.current = false; return; } if (!kirli) setT(al(b)); }, [b]); // eslint-disable-line react-hooks/exhaustive-deps
  const degis = (y: Partial<Taslak>) => { setT((x) => ({ ...x, ...y })); setKirli(true); };
  const ogeDegis = (id: string, y: Partial<BioOge>) => degis({ ogeler: t.ogeler.map((o) => (o.id === id ? { ...o, ...y } : o)) });
  const tasi = (i: number, n: number) => { const l = [...t.ogeler]; const [x] = l.splice(i, 1); l.splice(i + n, 0, x); degis({ ogeler: l }); };
  const kaydet = async () => { setHata(""); setBilgi(""); try { await e.duzenle("bio", { bio: t }); setKirli(false); setBilgi("Kaydedildi; sayfa hemen güncellendi."); } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); } };
  const adres = d.bioAdres ?? "";
  const html = useMemo(() => bioHtml({ ...t, ist: b.ist, olusturma: 0, guncelleme: 0 }, { tik: () => "#", form: "#", onizleme: true, bugun: trGun() }), [t, b.ist]);
  const ist = b.ist;
  const gun = (n: number, f: (g: string) => number) => Array.from({ length: n }, (_, i) => f(trGun(i))).reduce((a, x) => a + x, 0);
  const gor30 = gun(30, (g) => ist.gor[g] ?? 0), tekil30 = gun(30, (g) => ist.tekil[g] ?? 0);
  const tik30 = Object.values(ist.tik).reduce((a, l) => a + gun(30, (g) => l[g] ?? 0), 0);
  const seri = Array.from({ length: 14 }, (_, i) => { const g = trGun(13 - i); return { g, n: ist.gor[g] ?? 0, t: Object.values(ist.tik).reduce((a, l) => a + (l[g] ?? 0), 0) }; });
  const enCok = Math.max(1, ...seri.map((x) => x.n));
  const ogeTik = t.ogeler.map((o) => ({ o, n: Object.values(ist.tik[o.id] ?? {}).reduce((a, x) => a + x, 0) })).filter((x) => bioTiklanir(x.o)).sort((a, c) => c.n - a.n);
  const kaynaklar = Object.entries(ist.kaynak).sort((a, c) => c[1] - a[1]).slice(0, 6);
  const cihazlar = Object.entries(ist.cihaz).sort((a, c) => c[1] - a[1]);
  const kTop = Math.max(1, kaynaklar.reduce((a, x) => a + x[1], 0)), cTop = Math.max(1, cihazlar.reduce((a, x) => a + x[1], 0));
  const ekle = (tur: BioOgeTur) => { const o: BioOge = { id: kid(), tur, ad: BIO_OGELERI.find((x) => x.id === tur)!.ad, acik: true, ...(tur === "baglanti" || tur === "randevu" ? { adres: d.site } : {}), ...(tur === "whatsapp" ? { numara: d.isletme.whatsapp.replace(/\D/g, ""), mesaj: "Merhaba, bio sayfanızdan yazıyorum." } : {}), ...(tur === "abone" ? { ad: "Bültene katıl", alt: "Yeniliklerden ilk sen haberdar ol." } : {}) }; degis({ ogeler: [...t.ogeler, o] }); setAcik(o.id); };
  const temaSec = (id: BioTema["id"]) => { const x = BIO_TEMALARI.find((y) => y.id === id); degis({ tema: x ? { ...x } : { ...t.tema, id: "ozel" } }); };

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex flex-wrap items-center gap-2">Bio sayfası<Rozet ton={t.acik ? "aksan" : "soluk"}>{t.acik ? "Yayında" : "Kapalı"}</Rozet></span>}
        aciklama="Biyografine bu adresi koy. Ziyaret ve tıklar botlar hariç sayılır; bülten kutusundan gelenler Kişiler'e onay kaydıyla düşer."
        sag={<><button type="button" onClick={() => degis({ acik: !t.acik })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{t.acik ? "Kapat" : "Yayına al"}</button><button type="button" disabled={!kirli} onClick={kaydet} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>Kaydet</button></>}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-10 min-w-0 flex-1 basis-[220px] items-center gap-1 rounded-[12px] bg-white/[0.04] pl-3 text-[13px] ring-1 ring-inset ring-white/[0.08]"><span className="shrink-0 text-white/45">{adres.replace(/^https?:\/\//, "").replace(/[^/]+$/, "")}</span><input value={t.kod} onChange={(x) => degis({ kod: x.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) })} aria-label="Sayfa adresi" className="h-full min-w-0 flex-1 bg-transparent text-white outline-none" /></span>
          <button type="button" onClick={() => kopyala("a", adres)} className={cn(ikincil, "h-10")}><Copy className="h-3.5 w-3.5" />{kopya === "a" ? "Kopyalandı" : "Kopyala"}</button>
          <button type="button" onClick={() => setKarekod(!karekod)} className={cn(ikincil, "h-10")}><QrCode className="h-3.5 w-3.5" />Karekod</button>
          <a href={adres} target="_blank" rel="noopener noreferrer" className={cn(ikincil, "h-10")}>Aç<ArrowUpRight className="h-3.5 w-3.5" /></a>
        </div>
        {karekod && adres && <div className="mt-3 flex items-center gap-3">{(() => { const { yol, n } = qrYolu(adres); return <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={124} height={124} shapeRendering="crispEdges" className="shrink-0 rounded-[10px]" role="img" aria-label="Bio sayfası karekodu"><rect x={-2} y={-2} width={n + 4} height={n + 4} fill="#fff" /><path d={yol} fill="#000" /></svg>; })()}<p className="text-[12px] text-white/50">Afişe, masaya ya da ambalaja koy. Tarayanlar "Doğrudan" kaynağıyla sayılır.</p></div>}
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {bilgi && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0 space-y-4">
          <Kart baslik="Analitik" aciklama="Son 30 gün">
            <SayiSatiri sutun={2} l={[["Görüntülenme", gor30.toLocaleString("tr-TR")], ["Tekil ziyaretçi", tekil30.toLocaleString("tr-TR")], ["Tık", tik30.toLocaleString("tr-TR")], ["Tıklanma oranı", oranYaz(tik30, gor30)]]} />
            <div className="mt-3 flex h-24 items-end gap-1" aria-label="Son 14 gün görüntülenme">{seri.map((x) => <div key={x.g} className="group relative flex h-full flex-1 flex-col justify-end" title={`${x.g}: ${x.n} görüntülenme, ${x.t} tık`}><motion.span initial={{ height: 0 }} animate={{ height: `${(x.n / enCok) * 100}%` }} className="block w-full rounded-t-[4px] bg-[#1e9fcf]" style={{ minHeight: x.n ? 3 : 1 }} /></div>)}</div>
            <div className="mt-1 flex justify-between text-[10.5px] text-white/35"><span>{seri[0].g.slice(5).split("-").reverse().join(".")}</span><span>Bugün</span></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1.5 text-[12px] text-white/50">Öğe başına tık</p>{ogeTik.length ? <ul className="space-y-1.5">{ogeTik.slice(0, 8).map(({ o, n }) => <li key={o.id} className="text-[12px]"><span className="flex justify-between gap-2"><span className="truncate text-white/80">{o.ad}</span><span className="tabular-nums text-white">{n}</span></span><span className="mt-0.5 block h-1 rounded-full bg-white/[0.05]"><span className="block h-full rounded-full bg-[#55d6fd]" style={{ width: `${(n / Math.max(1, ogeTik[0].n)) * 100}%` }} /></span></li>)}</ul> : <p className="text-[12px] text-white/40">Henüz tık yok.</p>}</div>
              <div className="space-y-3">
                <div><p className="mb-1.5 text-[12px] text-white/50">Kaynak</p>{kaynaklar.length ? <ul className="space-y-1">{kaynaklar.map(([k, n]) => <li key={k} className="flex justify-between gap-2 text-[12px]"><span className="truncate text-white/80">{k}</span><span className="tabular-nums text-white/60">yüzde {Math.round((n / kTop) * 100)}</span></li>)}</ul> : <p className="text-[12px] text-white/40">Veri yok.</p>}</div>
                <div><p className="mb-1.5 text-[12px] text-white/50">Cihaz</p>{cihazlar.length ? <ul className="space-y-1">{cihazlar.map(([k, n]) => <li key={k} className="flex justify-between gap-2 text-[12px]"><span className="text-white/80">{k}</span><span className="tabular-nums text-white/60">yüzde {Math.round((n / cTop) * 100)}</span></li>)}</ul> : <p className="text-[12px] text-white/40">Veri yok.</p>}</div>
                <p className="text-[12px] text-white/60">Bülten kutusundan <b className="text-white">{ist.abone ?? 0}</b> kişi abone oldu.</p>
              </div>
            </div>
          </Kart>

          <Kart baslik={<span className="flex items-center gap-2">Öğeler<Rozet>{t.ogeler.length}</Rozet></span>}
            sag={<AcilirMenu genislik={290} hiza="sag" tetik={(ac) => <button type="button" onClick={ac} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Öğe ekle</button>}>
              {(kapat) => <div>{BIO_OGELERI.map((x) => { const I = OGE_SIMGE[x.id]; return <button key={x.id} type="button" onClick={() => { ekle(x.id); kapat(); }} className="flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left hover:bg-white/[0.06]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.07]">{x.id === "whatsapp" ? /* eslint-disable-next-line @next/next/no-img-element */ <img src="/marka/renkli/whatsapp-color.svg" alt="" className="h-4 w-4" /> : <I className="h-3.5 w-3.5 text-white/75" />}</span><span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/50">{x.alt}</span></span></button>; })}</div>}
            </AcilirMenu>}>
            <ul className="space-y-2">
              {t.ogeler.map((o, i) => { const I = OGE_SIMGE[o.tur]; const ac = acik === o.id; return (
                <li key={o.id} className={cn("rounded-[14px] bg-white/[0.03] ring-1 ring-inset", ac ? "ring-white/20" : "ring-white/[0.07]")}>
                  <div className="flex items-center gap-2 p-2.5">
                    <button type="button" role="switch" aria-checked={o.acik} aria-label="Görünür" onClick={() => ogeDegis(o.id, { acik: !o.acik })}><Halka dolu={o.acik} boyut={18} /></button>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.06]"><I className="h-3.5 w-3.5 text-white/70" /></span>
                    <button type="button" onClick={() => setAcik(ac ? null : o.id)} className="min-w-0 flex-1 text-left"><span className={cn("block truncate text-[13px]", o.acik ? "text-white" : "text-white/40")}>{o.ad || "Adsız"}</span><span className="block truncate text-[11.5px] text-white/40">{BIO_OGELERI.find((x) => x.id === o.tur)?.ad}{o.vurgu ? ", öne çıkan" : ""}{o.bas || o.bit ? ", zamanlı" : ""}</span></button>
                    <button type="button" disabled={i === 0} onClick={() => tasi(i, -1)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Yukarı"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" disabled={i === t.ogeler.length - 1} onClick={() => tasi(i, 1)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Aşağı"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setAcik(ac ? null : o.id)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Düzenle"><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", ac && "rotate-180")} /></button>
                  </div>
                  <AnimatePresence initial={false}>{ac && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid gap-2.5 border-t border-white/[0.06] p-3 sm:grid-cols-2">
                        <Etiket ad={o.tur === "metin" ? "Metin" : "Başlık"} className="sm:col-span-2">{o.tur === "metin" ? <textarea value={o.ad} onChange={(x) => ogeDegis(o.id, { ad: x.target.value })} rows={3} maxLength={140} className={cn(alan, "resize-none py-2")} /> : <input value={o.ad} onChange={(x) => ogeDegis(o.id, { ad: x.target.value })} maxLength={140} className={cn(alan, "h-9")} />}</Etiket>
                        {o.tur !== "baslik" && o.tur !== "metin" && <Etiket ad={o.tur === "urun" ? "Fiyat ya da alt satır" : "Alt satır (isteğe bağlı)"}><input value={o.alt ?? ""} onChange={(x) => ogeDegis(o.id, { alt: x.target.value })} maxLength={160} className={cn(alan, "h-9")} /></Etiket>}
                        {["baglanti", "urun", "yazi", "randevu"].includes(o.tur) && <Etiket ad="Adres"><input value={o.adres ?? ""} onChange={(x) => ogeDegis(o.id, { adres: x.target.value })} placeholder="https://" className={cn(alan, "h-9")} /></Etiket>}
                        {["baglanti", "urun", "yazi"].includes(o.tur) && <Etiket ad="Görsel adresi (isteğe bağlı)"><input value={o.gorsel ?? ""} onChange={(x) => ogeDegis(o.id, { gorsel: x.target.value })} placeholder="https://" className={cn(alan, "h-9")} /></Etiket>}
                        {o.tur === "whatsapp" && <><Etiket ad="WhatsApp numarası"><input value={o.numara ?? ""} onChange={(x) => ogeDegis(o.id, { numara: x.target.value.replace(/[^\d+]/g, "") })} placeholder="905xxxxxxxxx" className={cn(alan, "h-9")} /></Etiket><Etiket ad="Hazır mesaj"><input value={o.mesaj ?? ""} onChange={(x) => ogeDegis(o.id, { mesaj: x.target.value })} maxLength={300} className={cn(alan, "h-9")} /></Etiket></>}
                        {o.tur === "abone" && <p className="text-[11.5px] leading-relaxed text-white/45 sm:col-span-2">Kutu açık onay kutusu ister; işaretlemeden gönderilemez. Abone olan Kişiler'e "Bio sayfası" kaynağıyla, onay zamanı ve IP'siyle yazılır.{d.isletme.kvkk ? " Aydınlatma metnine bağlantı eklenir." : " İşletme sekmesinde KVKK aydınlatma metni oluşturursan kutuya bağlantısı eklenir."}</p>}
                        {!["baslik", "metin", "abone"].includes(o.tur) && <button type="button" role="checkbox" aria-checked={!!o.vurgu} onClick={() => ogeDegis(o.id, { vurgu: !o.vurgu })} className="flex items-center gap-2 text-left text-[12.5px] text-white/75"><Halka dolu={!!o.vurgu} boyut={16} />Öne çıkar</button>}
                        <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><span className="text-[12px] text-white/50">Görünür olduğu tarihler</span><input type="date" value={o.bas ?? ""} onChange={(x) => ogeDegis(o.id, { bas: x.target.value || undefined })} aria-label="Başlangıç" className="h-8 rounded-full bg-white/[0.05] px-3 text-[12px] text-white outline-none ring-1 ring-inset ring-white/[0.08] [color-scheme:dark]" /><input type="date" value={o.bit ?? ""} onChange={(x) => ogeDegis(o.id, { bit: x.target.value || undefined })} aria-label="Bitiş" className="h-8 rounded-full bg-white/[0.05] px-3 text-[12px] text-white outline-none ring-1 ring-inset ring-white/[0.08] [color-scheme:dark]" />
                          <button type="button" onClick={() => { degis({ ogeler: t.ogeler.filter((x) => x.id !== o.id) }); setAcik(null); }} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button></div>
                      </div>
                    </motion.div>
                  )}</AnimatePresence>
                </li>
              ); })}
            </ul>
          </Kart>

          <Kart baslik="Profil ve görünüm">
            <div className="grid gap-3 sm:grid-cols-2">
              <Etiket ad="Ad"><input value={t.baslik} onChange={(x) => degis({ baslik: x.target.value })} maxLength={80} className={cn(alan, "h-9")} /></Etiket>
              <Etiket ad="Profil görseli (https ya da Vayra görseli)"><input value={t.avatar ?? ""} onChange={(x) => degis({ avatar: x.target.value || undefined })} placeholder={d.isletme.logo || "https://"} className={cn(alan, "h-9")} /></Etiket>
              <Etiket ad="Kısa tanıtım" className="sm:col-span-2"><textarea value={t.aciklama} onChange={(x) => degis({ aciklama: x.target.value })} rows={2} maxLength={300} className={cn(alan, "resize-none py-2")} /></Etiket>
            </div>
            <p className="mb-2 mt-4 text-[12.5px] text-white/60">Tema</p>
            <div className="flex flex-wrap gap-2">
              {BIO_TEMALARI.map((x) => <button key={x.id} type="button" onClick={() => temaSec(x.id)} className={cn("flex h-16 w-[86px] flex-col justify-end overflow-hidden rounded-[12px] p-1.5 text-left text-[11px]", t.tema.id === x.id ? "ring-2 ring-white" : "ring-1 ring-white/10")} style={{ background: `linear-gradient(180deg,${x.zemin},${x.zemin2})`, color: x.yazi }}><span className="mb-1 block h-2.5 w-full rounded-full" style={{ background: x.stil === "cerceve" ? "transparent" : x.dugme, border: `1px solid ${x.stil === "cerceve" ? x.yazi : x.dugme}` }} />{x.ad}</button>)}
              <button type="button" onClick={() => temaSec("ozel")} className={cn("flex h-16 w-[86px] flex-col items-start justify-end rounded-[12px] bg-white/[0.04] p-1.5 text-[11px] text-white/80", t.tema.id === "ozel" ? "ring-2 ring-white" : "ring-1 ring-white/10")}>Özel</button>
            </div>
            {t.tema.id === "ozel" && <div className="mt-3 flex flex-wrap gap-3">{([["zemin", "Zemin"], ["zemin2", "Zemin alt"], ["yazi", "Yazı"], ["dugme", "Düğme"], ["dugmeYazi", "Düğme yazısı"]] as const).map(([k, ad]) => <label key={k} className="flex items-center gap-2 text-[12px] text-white/65"><input type="color" value={t.tema[k]} onChange={(x) => degis({ tema: { ...t.tema, [k]: x.target.value } })} className="h-7 w-9 cursor-pointer rounded-[6px] bg-transparent" />{ad}</label>)}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Secici id="bio-stil" kucuk deger={t.tema.stil} set={(v) => degis({ tema: { ...t.tema, stil: v } })} l={[{ id: "dolu" as const, ad: "Dolu" }, { id: "yumusak" as const, ad: "Yumuşak" }, { id: "cerceve" as const, ad: "Çerçeve" }]} />
              <Secici id="bio-kose" kucuk deger={t.tema.kose} set={(v) => degis({ tema: { ...t.tema, kose: v } })} l={[{ id: "hap" as const, ad: "Hap" }, { id: "yuvarlak" as const, ad: "Yuvarlak" }, { id: "keskin" as const, ad: "Keskin" }]} />
              <Secici id="bio-yazi" kucuk deger={t.tema.yaziTipi} set={(v) => degis({ tema: { ...t.tema, yaziTipi: v } })} l={[{ id: "sistem" as const, ad: "Sade" }, { id: "serif" as const, ad: "Tırnaklı" }, { id: "yuvarlak" as const, ad: "Yuvarlak" }]} />
            </div>
            <p className="mb-2 mt-4 text-[12.5px] text-white/60">Sosyal hesaplar</p>
            <div className="grid gap-2 sm:grid-cols-2">{BIO_SOSYAL.map((s) => <label key={s.id} className="flex h-9 items-center gap-2 rounded-[12px] bg-white/[0.04] pl-2.5 ring-1 ring-inset ring-white/[0.08]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.logo} alt={s.ad} className="h-4 w-4 shrink-0 object-contain" /><input value={t.sosyal[s.id] ?? ""} onChange={(x) => degis({ sosyal: { ...t.sosyal, [s.id]: x.target.value } })} placeholder={s.id === "whatsapp" ? "905xxxxxxxxx" : `${s.ad} kullanıcı adı ya da adresi`} className="h-full min-w-0 flex-1 bg-transparent pr-2 text-[12.5px] text-white outline-none placeholder:text-white/35" /></label>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Etiket ad="Arama başlığı (isteğe bağlı)"><input value={t.seo.baslik} onChange={(x) => degis({ seo: { ...t.seo, baslik: x.target.value } })} maxLength={70} className={cn(alan, "h-9")} /></Etiket>
              <Etiket ad="Arama açıklaması"><input value={t.seo.aciklama} onChange={(x) => degis({ seo: { ...t.seo, aciklama: x.target.value } })} maxLength={160} className={cn(alan, "h-9")} /></Etiket>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <button type="button" role="checkbox" aria-checked={t.seo.indeks} onClick={() => degis({ seo: { ...t.seo, indeks: !t.seo.indeks } })} className="flex items-center gap-2 text-[12.5px] text-white/75"><Halka dolu={t.seo.indeks} boyut={16} />Arama motorlarında görünsün</button>
              <button type="button" role="checkbox" aria-checked={t.rozet} onClick={() => degis({ rozet: !t.rozet })} className="flex items-center gap-2 text-[12.5px] text-white/75"><Halka dolu={t.rozet} boyut={16} />Vayra imzası</button>
            </div>
            <div className="mt-4 flex justify-end">{silOnay ? <span className="flex items-center gap-2"><span className="text-[12px] text-white/55">Adres boşa çıkar, analitik silinir.</span><button type="button" onClick={() => e.duzenle("bioSil").catch((x) => setHata(x.message))} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-rose-500/15 px-3 text-[12.5px] text-rose-100">Sil</button><button type="button" onClick={() => setSilOnay(false)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Vazgeç</button></span> : <button type="button" onClick={() => setSilOnay(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Bio sayfasını sil</button>}</div>
          </Kart>
        </div>
        <div className="min-w-0">
          <div className="sticky top-0 space-y-2">
            <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[34px] bg-black p-2 ring-1 ring-white/15">
              <iframe title="Bio sayfası önizlemesi" sandbox="" srcDoc={html} className="block h-[600px] w-full rounded-[27px] bg-[#0b0c0f]" />
            </div>
            <p className="text-center text-[11.5px] text-white/40">{kirli ? "Kaydedilmemiş değişiklik var" : "Önizleme yayındaki sayfayla aynı"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
const bioTiklanir = (o: BioOge) => !["baslik", "metin", "abone"].includes(o.tur);
