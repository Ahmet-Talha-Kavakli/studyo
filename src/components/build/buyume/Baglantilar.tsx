"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, Link2, MousePointerClick, PenLine, Plus, QrCode, Trash2 } from "lucide-react";
import qrcode from "qrcode-generator";
import { api, gorece } from "@/lib/build/istemci";
import { UTM_HAZIR, utmEkle, utmTemizle, type Baglanti, type Utm } from "@/lib/build/buyumeEkTipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Etiket, Halka, HataSatiri, ikincil, Kart, Rozet, SecenekMenusu, Cip, simgeDugme, useKopyala, YanPanel } from "./ortak";
import type { BolumProps } from "./BuyumeSekme";

const trGun = (i: number) => new Date(Date.now() + 3 * 3600_000 - i * 864e5).toISOString().slice(0, 10);

export function qrYolu(adres: string) {
  const q = qrcode(0, "M"); q.addData(adres); q.make();
  const n = q.getModuleCount(); let yol = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) yol += `M${c},${r}h1v1h-1z`;
  return { yol, n };
}
const qrSvg = (adres: string) => { const { yol, n } = qrYolu(adres); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" width="${(n + 4) * 10}" height="${(n + 4) * 10}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${yol}" fill="#000"/></svg>`; };

type Form = { id?: string; ad: string; sayfa: string; ozelHedef: string; hazir: string; utm: Utm; kisa: boolean; kod: string };
const bosForm = (): Form => ({ ad: "", sayfa: "index.html", ozelHedef: "", hazir: "ig-bio", utm: { kaynak: "instagram", ortam: "social", kampanya: "" }, kisa: true, kod: "" });

export function BaglantilarBolumu({ p, e }: BolumProps) {
  const d = e.d!;
  const [f, setF] = useState<Form>(bosForm);
  const [hata, setHata] = useState("");
  const [kopya, kopyala] = useKopyala();
  const [qr, setQr] = useState<Baglanti | null>(null);
  const [ayrinti, setAyrinti] = useState<string | null>(null);
  const [ziyaret, setZiyaret] = useState<{ ad: string; adet: number }[]>([]);
  useEffect(() => { api<{ kampanyalar: { ad: string; adet: number }[] }>(`/api/build/analitik/${p.id}?gun=30`).then((a) => setZiyaret(a.kampanyalar ?? [])).catch(() => {}); }, [p.id]);
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html");
  const kok = d.site.endsWith("/") ? d.site : `${d.site}/`;
  const hedef = f.sayfa === "ozel" ? f.ozelHedef.trim() : `${kok}${f.sayfa === "index.html" ? "" : f.sayfa}`;
  const sonuc = /^https?:\/\//.test(hedef) ? utmEkle(hedef, f.utm.kaynak || f.utm.kampanya ? f.utm : undefined) : "";
  const kisaAdres = (kod: string) => `${d.koken}/k/${kod}`;
  const toplamTik = d.ek.baglantilar.reduce((t, b) => t + b.tik, 0);
  const ziyaretBul = (u?: Utm) => { if (!u) return null; const a = [u.kaynak, u.ortam, u.kampanya].filter(Boolean).join(" / "); return ziyaret.find((z) => z.ad === a)?.adet ?? 0; };

  const kaydet = async () => {
    setHata("");
    try {
      await e.duzenle("baglanti", { baglanti: { id: f.id, ad: f.ad.trim() || `${UTM_HAZIR.find((h) => h.id === f.hazir)?.ad ?? "Bağlantı"}${f.utm.kampanya ? `, ${f.utm.kampanya}` : ""}`, hedef, utm: f.utm, kisa: f.kisa, kod: f.kod.trim() } });
      setF(bosForm());
    } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); }
  };
  const ac = useMemo(() => d.ek.baglantilar.find((b) => b.id === ayrinti) ?? null, [d.ek.baglantilar, ayrinti]);

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Bağlantılar<Rozet>{d.ek.baglantilar.length}</Rozet>{toplamTik > 0 && <Rozet ton="aksan"><MousePointerClick className="h-3 w-3" />{toplamTik.toLocaleString("tr-TR")} tık</Rozet>}</span>}
        aciklama="Her paylaşım için UTM etiketli bağlantı oluştur; Vayra Analitik ziyaretleri kampanya olarak sayar. Kısa bağlantı tıkları burada, ziyaretler Analitik'te görünür.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            <Etiket ad="Hedef sayfa">
              <SecenekMenusu genislik={320} deger={f.sayfa} sec={(id) => setF({ ...f, sayfa: id })} l={sayfalar.map((y) => ({ id: y, ad: y === "index.html" ? "Ana sayfa" : y, alt: `${kok}${y === "index.html" ? "" : y}` }))}
                ozel={{ deger: f.ozelHedef, set: (v) => setF({ ...f, sayfa: "ozel", ozelHedef: v }), yer: "https://...", alt: "Başka bir adres" }}
                tetik={(ac2, a) => <Cip onClick={ac2} acik={a} className="h-10 w-full justify-between pl-3.5"><span className="truncate text-[13px]">{f.sayfa === "ozel" ? f.ozelHedef || "Özel adres" : f.sayfa === "index.html" ? "Ana sayfa" : f.sayfa}</span></Cip>} />
            </Etiket>
            <div>
              <p className="mb-1.5 text-[12.5px] text-white/60">Nerede paylaşılacak</p>
              <div className="flex flex-wrap gap-1.5">
                {UTM_HAZIR.map((h) => (
                  <button key={h.id} type="button" onClick={() => setF({ ...f, hazir: h.id, utm: { ...f.utm, kaynak: h.kaynak, ortam: h.ortam } })} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] transition-colors", f.hazir === h.id ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>
                    {h.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={h.logo} alt="" className="h-3.5 w-3.5 object-contain" /> : <Link2 className="h-3.5 w-3.5 text-white/55" />}{h.ad}
                  </button>
                ))}
                <button type="button" onClick={() => setF({ ...f, hazir: "ozel" })} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px]", f.hazir === "ozel" ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:text-white")}><PenLine className="h-3.5 w-3.5" />Özel</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Etiket ad="Kaynak (utm_source)"><input value={f.utm.kaynak} onChange={(x) => setF({ ...f, hazir: "ozel", utm: { ...f.utm, kaynak: x.target.value } })} className={cn(alan, "h-9")} /></Etiket>
              <Etiket ad="Ortam (utm_medium)"><input value={f.utm.ortam} onChange={(x) => setF({ ...f, hazir: "ozel", utm: { ...f.utm, ortam: x.target.value } })} className={cn(alan, "h-9")} /></Etiket>
              <Etiket ad="Kampanya (utm_campaign)"><input value={f.utm.kampanya} onChange={(x) => setF({ ...f, utm: { ...f.utm, kampanya: x.target.value } })} placeholder="kasim-indirimi" className={cn(alan, "h-9")} /></Etiket>
              <Etiket ad="İçerik (utm_content)"><input value={f.utm.icerik ?? ""} onChange={(x) => setF({ ...f, utm: { ...f.utm, icerik: x.target.value } })} placeholder="mavi-afis" className={cn(alan, "h-9")} /></Etiket>
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <p className="text-[11.5px] text-white/45">Oluşan bağlantı</p>
              <p className="mt-1 break-all text-[12.5px] leading-relaxed text-white/85">{sonuc || "Hedef adres http ya da https ile başlamalı."}</p>
              {sonuc && <button type="button" onClick={() => kopyala("sonuc", sonuc)} className={cn(ikincil, "mt-2 h-8 px-3 text-[12.5px]")}><Copy className="h-3.5 w-3.5" />{kopya === "sonuc" ? "Kopyalandı" : "Kopyala"}</button>}
              {f.utm.kaynak && <p className="mt-2 text-[11.5px] text-white/40">Analitik'te görünecek ad: {[utmTemizle(f.utm).kaynak, utmTemizle(f.utm).ortam, utmTemizle(f.utm).kampanya].filter(Boolean).join(" / ")}</p>}
            </div>
            <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <button type="button" role="checkbox" aria-checked={f.kisa} onClick={() => setF({ ...f, kisa: !f.kisa })} className="flex w-full items-center gap-2.5 text-left"><Halka dolu={f.kisa} boyut={18} /><span className="text-[13px] text-white">Kısa bağlantı ve karekod oluştur</span></button>
              {f.kisa && <div className="mt-2.5 flex items-center gap-1 rounded-[12px] bg-white/[0.05] pl-3 ring-1 ring-inset ring-white/[0.08]"><span className="shrink-0 text-[12.5px] text-white/45">{d.koken.replace(/^https?:\/\//, "")}/k/</span><input value={f.kod} onChange={(x) => setF({ ...f, kod: x.target.value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32) })} placeholder="kendiliğinden" className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-[13px] text-white outline-none placeholder:text-white/35" /></div>}
            </div>
            <Etiket ad="Ad"><input value={f.ad} onChange={(x) => setF({ ...f, ad: x.target.value })} maxLength={80} placeholder="Instagram biyografisi, kasım" className={cn(alan, "h-9")} /></Etiket>
            <button type="button" disabled={!sonuc} onClick={kaydet} className={cn(birincil, "h-10 w-full justify-center")}><Plus className="h-4 w-4" />Bağlantıyı kaydet</button>
          </div>
        </div>
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>

      <Kart baslik="Kayıtlı bağlantılar" aciklama={!p.yayin ? "Site yayında değil; ziyaret sayımı yayından sonra başlar. Kısa bağlantı tıkları şimdiden sayılır." : "Son 14 günün tıkları ve son 30 günde UTM ile gelen ziyaretler."}>
        {d.ek.baglantilar.length ? (
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            <AnimatePresence initial={false}>
              {d.ek.baglantilar.map((b) => {
                const gunler = Array.from({ length: 14 }, (_, i) => b.gunler[trGun(13 - i)] ?? 0), en = Math.max(1, ...gunler);
                const z = ziyaretBul(b.utm);
                const hazir = UTM_HAZIR.find((h) => h.kaynak === b.utm?.kaynak && h.ortam === b.utm?.ortam);
                return (
                  <motion.li key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3 px-3.5 py-3 sm:flex-nowrap">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06]">{hazir?.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={hazir.logo} alt="" className="h-4 w-4 object-contain" /> : <Link2 className="h-4 w-4 text-white/65" />}</span>
                    <button type="button" onClick={() => setAyrinti(b.id)} className="min-w-[180px] flex-1 text-left">
                      <span className="block truncate text-[13.5px] font-medium text-white">{b.ad}</span>
                      <span className="block truncate text-[12px] text-white/50">{b.kod ? kisaAdres(b.kod).replace(/^https?:\/\//, "") : utmEkle(b.hedef, b.utm).replace(/^https?:\/\//, "")}</span>
                    </button>
                    <span className="flex h-7 shrink-0 items-end gap-[2px]" title="Son 14 gün">{gunler.map((n, i) => <span key={i} className="w-[4px] rounded-[1px] bg-[#1e9fcf]" style={{ height: `${Math.max(8, (n / en) * 100)}%`, opacity: n ? 1 : 0.25 }} />)}</span>
                    <span className="w-[92px] shrink-0 text-right text-[12px] tabular-nums text-white/60"><span className="block text-[14px] font-semibold text-white">{b.tik.toLocaleString("tr-TR")} tık</span>{z !== null && `${z} ziyaret`}</span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <button type="button" onClick={() => kopyala(b.id, b.kod ? kisaAdres(b.kod) : utmEkle(b.hedef, b.utm))} className={simgeDugme} title={kopya === b.id ? "Kopyalandı" : "Kopyala"} aria-label="Bağlantıyı kopyala">{kopya === b.id ? <span className="text-[10.5px] font-semibold text-[#8be6ff]">Tamam</span> : <Copy className="h-3.5 w-3.5" />}</button>
                      {b.kod && <button type="button" onClick={() => setQr(b)} className={simgeDugme} title="Karekod" aria-label="Karekod"><QrCode className="h-3.5 w-3.5" /></button>}
                      <button type="button" onClick={() => e.duzenle("baglantiSil", { id: b.id }).catch((x) => setHata(x.message))} className={cn(simgeDugme, "hover:text-rose-200")} title="Sil" aria-label="Bağlantıyı sil"><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : <p className="text-[12.5px] text-white/50">Henüz bağlantı yok. Instagram biyografin, afişin ya da bülten bağlantın için ilkini yukarıda oluştur.</p>}
      </Kart>

      <YanPanel acik={!!qr} kapat={() => setQr(null)} baslik="Karekod" alt={qr?.kod ? kisaAdres(qr.kod) : ""}
        alt2={qr?.kod ? <button type="button" onClick={() => { const a = document.createElement("a"); a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg(kisaAdres(qr.kod!)))}`; a.download = `karekod-${qr.kod}.svg`; a.click(); }} className={cn(birincil, "ml-auto")}><Download className="h-3.5 w-3.5" />SVG indir</button> : undefined}>
        {qr?.kod && (() => { const { yol, n } = qrYolu(kisaAdres(qr.kod)); return (
          <div className="space-y-3">
            <div className="mx-auto w-full max-w-[280px] rounded-[18px] bg-white p-4"><svg viewBox={`0 0 ${n} ${n}`} className="block h-auto w-full" shapeRendering="crispEdges"><path d={yol} fill="#000" /></svg></div>
            <p className="text-center text-[12.5px] leading-relaxed text-white/55">Afişe, menüye ya da masaya koy. Okutan herkes kısa bağlantıdan geçer ve tık sayılır.</p>
          </div>
        ); })()}
      </YanPanel>

      <YanPanel acik={!!ac} kapat={() => setAyrinti(null)} baslik={ac?.ad ?? ""} alt={ac ? `${gorece(ac.olusturma)} oluşturuldu${ac.sonTik ? `, son tık ${gorece(ac.sonTik)}` : ""}` : ""}>
        {ac && (
          <div className="space-y-4">
            <dl className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
              {[["Hedef", utmEkle(ac.hedef, ac.utm)], ["Kısa bağlantı", ac.kod ? kisaAdres(ac.kod) : "yok"], ["Toplam tık", ac.tik.toLocaleString("tr-TR")], ["UTM ziyareti (30 gün)", String(ziyaretBul(ac.utm) ?? "UTM yok")]].map(([a, v]) => <div key={a} className="flex gap-3 px-3.5 py-2.5"><dt className="w-[120px] shrink-0 text-[12px] text-white/45">{a}</dt><dd className="min-w-0 flex-1 break-all text-[12.5px] text-white/85">{v}</dd></div>)}
            </dl>
            {[["Nereden geldi", ac.kaynaklar], ["Cihaz", ac.cihazlar]].map(([b, o]) => { const l = Object.entries(o as Record<string, number>).sort((x, y) => y[1] - x[1]); const en = Math.max(1, ...l.map((x) => x[1])); return (
              <div key={b as string}><p className="mb-2 text-[12.5px] text-white/60">{b as string}</p>
                {l.length ? <ul className="space-y-1.5">{l.slice(0, 8).map(([a, n]) => <li key={a} className="grid grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-2 text-[12.5px]"><span className="truncate text-white/80">{a}</span><span className="h-1.5 rounded-full bg-white/[0.05]"><span className="block h-full rounded-full bg-[#1e9fcf]" style={{ width: `${(n / en) * 100}%` }} /></span><span className="text-right tabular-nums text-white">{n}</span></li>)}</ul> : <p className="text-[12px] text-white/45">Henüz tık yok.</p>}
              </div>
            ); })}
          </div>
        )}
      </YanPanel>
    </div>
  );
}
