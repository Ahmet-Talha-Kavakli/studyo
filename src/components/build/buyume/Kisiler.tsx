"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Download, Filter, Link2, Mail, Newspaper, Plus, Search, ShieldCheck, ShoppingBag, Tag, Trash2, Upload, UserRound, Users, X } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import { csvCoz, epostaGecerli, IZINLER, KAYNAKLAR, kisilerCsv, suz, suzgecOzeti, type IzinDurum, type Kisi, type KisiKaynak, type Suzgec } from "@/lib/build/buyumeEkTipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Cip, Etiket, Halka, HataSatiri, ikincil, indir, Kart, Rozet, SatirSecici, SecenekMenusu, simgeDugme, tl, useKopyala, YanPanel } from "./ortak";
import type { BolumProps } from "./BuyumeSekme";

const IZIN_TON: Record<IzinDurum, "aksan" | "soluk" | "rose"> = { onay: "aksan", bilinmiyor: "soluk", ret: "rose" };
const KAYNAK_SIMGE: Record<KisiKaynak, typeof Users> = { uye: UserRound, form: Mail, siparis: ShoppingBag, elle: Plus, abone: Newspaper, randevu: CalendarCheck, bio: Link2 };

/** Süzgeç çubuğu (Kişiler ve E-posta kitlesi ortak). */
export function SuzgecCubugu({ s, set, etiketler, sayi }: { s: Suzgec; set: (s: Suzgec) => void; etiketler: string[]; sayi?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <SecenekMenusu genislik={280} baslik="Nereden geldi" deger={s.kaynak?.[0] ?? "tum"} sec={(id) => set({ ...s, kaynak: id === "tum" ? [] : [id as KisiKaynak] })}
        l={[{ id: "tum", ad: "Bütün kaynaklar", alt: "Abone, üye, form, sipariş, randevu, bio, elle" }, ...KAYNAKLAR.map((k) => { const I = KAYNAK_SIMGE[k.id]; return { id: k.id, ad: k.ad, logo: <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.07]"><I className="h-3.5 w-3.5 text-white/75" /></span> }; })]}
        tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-8 pl-3"><Filter className="h-3.5 w-3.5 text-white/50" />{s.kaynak?.length ? KAYNAKLAR.find((k) => k.id === s.kaynak![0])?.ad : "Kaynak"}</Cip>} />
      <SecenekMenusu genislik={260} baslik="İzin" deger={s.izin ?? "tum"} sec={(id) => set({ ...s, izin: id as Suzgec["izin"] })} l={[{ id: "tum", ad: "Bütün izinler" }, ...IZINLER.map((x) => ({ id: x.id, ad: x.ad, alt: x.alt }))]}
        tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-8 pl-3"><ShieldCheck className="h-3.5 w-3.5 text-white/50" />{s.izin && s.izin !== "tum" ? IZINLER.find((x) => x.id === s.izin)?.ad : "İzin"}</Cip>} />
      {etiketler.length > 0 && (
        <SecenekMenusu genislik={260} baslik="Etiket" deger={s.etiket?.[0] ?? "tum"} sec={(id) => set({ ...s, etiket: id === "tum" ? [] : [id] })} l={[{ id: "tum", ad: "Bütün etiketler" }, ...etiketler.map((x) => ({ id: x, ad: x }))]}
          tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-8 pl-3"><Tag className="h-3.5 w-3.5 text-white/50" />{s.etiket?.[0] ?? "Etiket"}</Cip>} />
      )}
      <SecenekMenusu genislik={260} baslik="Etkinlik" deger={s.sonGun ? String(s.sonGun) : s.siparis === "var" ? "siparis" : "tum"} sec={(id) => set({ ...s, sonGun: /^\d+$/.test(id) ? Number(id) : undefined, siparis: id === "siparis" ? "var" : undefined })}
        l={[{ id: "tum", ad: "Her zaman" }, { id: "7", ad: "Son 7 günde etkin" }, { id: "30", ad: "Son 30 günde etkin" }, { id: "90", ad: "Son 90 günde etkin" }, { id: "siparis", ad: "Sipariş vermiş", alt: "En az bir ödenmiş sipariş" }]}
        ozel={{ deger: s.enAzHarcama ? String(s.enAzHarcama) : "", set: (v) => set({ ...s, enAzHarcama: Number(v.replace(/\D/g, "")) || undefined }), yer: "En az harcama, TL", alt: "Harcamaya göre süz" }}
        tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-8 pl-3">{s.sonGun ? `Son ${s.sonGun} gün` : s.siparis === "var" ? "Sipariş vermiş" : s.enAzHarcama ? `${s.enAzHarcama} TL üstü` : "Etkinlik"}</Cip>} />
      {sayi !== undefined && <span className="ml-1 text-[12px] tabular-nums text-white/45">{sayi.toLocaleString("tr-TR")} kişi</span>}
    </div>
  );
}

export function KisilerBolumu({ e }: BolumProps) {
  const d = e.d!;
  const [s, setS] = useState<Suzgec>({ izin: "tum" });
  const [segment, setSegment] = useState<string>("tum");
  const [acik, setAcik] = useState<string | null>(null);
  const [secili, setSecili] = useState<string[]>([]);
  const [kac, setKac] = useState(60);
  const [panel, setPanel] = useState<"ice" | "ekle" | "segment" | "cikan" | null>(null);
  const [hata, setHata] = useState("");
  const etiketler = useMemo(() => [...new Set(d.kisiler.flatMap((k) => k.etiketler))].sort(), [d.kisiler]);
  const liste = useMemo(() => suz(d.kisiler, { ...s, cikanlar: "dahil" }), [d.kisiler, s]);
  const ay = Date.now() - 30 * 864e5;
  const say = { toplam: d.kisiler.length, onay: d.kisiler.filter((k) => k.izin === "onay").length, yeni: d.kisiler.filter((k) => k.ilk >= ay).length, cikan: Object.keys(d.ek.cikanlar).length };
  const kisi = d.kisiler.find((k) => k.id === acik) ?? null;
  const yap = async (f: () => Promise<unknown>) => { setHata(""); try { await f(); } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); } };

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Kişiler<Rozet>{say.toplam.toLocaleString("tr-TR")}</Rozet></span>}
        aciklama="Bülten aboneleri, site üyeleri, form gönderenler, randevu alanlar ve sipariş verenler e-postaya göre tek kişide birleşir. Etiket, not ve izin kaydı burada tutulur."
        sag={<>
          <button type="button" onClick={() => setPanel("ice")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Upload className="h-3.5 w-3.5" />İçe aktar</button>
          <button type="button" disabled={!liste.length} onClick={() => indir(`kisiler-${new Date().toISOString().slice(0, 10)}.csv`, kisilerCsv(liste), "text/csv;charset=utf-8")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Download className="h-3.5 w-3.5" />CSV</button>
          <button type="button" onClick={() => setPanel("ekle")} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Kişi ekle</button>
        </>}>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-4">
          {[["Toplam", say.toplam], ["Ticari ileti onaylı", say.onay], ["Son 30 günde yeni", say.yeni], ["Abonelikten çıkan", say.cikan]].map(([a, n]) => (
            <div key={a as string} className="bg-[#141518] px-3.5 py-3"><dt className="text-[11.5px] text-white/45">{a}</dt><motion.dd key={String(n)} initial={{ opacity: 0.4, y: 2 }} animate={{ opacity: 1, y: 0 }} className="mt-0.5 text-[16px] font-semibold tabular-nums text-white">{(n as number).toLocaleString("tr-TR")}</motion.dd></div>
          ))}
        </dl>
      </Kart>

      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>

      <Kart>
        <div className="flex flex-wrap items-center gap-1.5">
          {[{ id: "tum", ad: "Bütün kişiler" }, ...d.ek.segmentler.map((x) => ({ id: x.id, ad: x.ad }))].map((x) => (
            <button key={x.id} type="button" onClick={() => { setSegment(x.id); setS(x.id === "tum" ? { izin: "tum" } : structuredClone(d.ek.segmentler.find((y) => y.id === x.id)!.suzgec)); }}
              className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors", segment === x.id ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/65 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{x.ad}</button>
          ))}
          <button type="button" onClick={() => setPanel("segment")} className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><Plus className="h-3.5 w-3.5" />Segment olarak kaydet</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/45" />
            <input value={s.arama ?? ""} onChange={(x) => setS({ ...s, arama: x.target.value })} placeholder="Ad, e-posta, telefon, etiket ya da not ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/40" />
          </span>
          <SuzgecCubugu s={s} set={(y) => { setS(y); setSegment("ozel"); }} etiketler={etiketler} sayi={liste.length} />
        </div>

        <AnimatePresence>
          {secili.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <TopluCubuk sayi={secili.length} etiketler={etiketler} temizle={() => setSecili([])} uygula={(g) => yap(async () => { await e.duzenle("kisiToplu", { anahtarlar: secili, ...g }); setSecili([]); })} />
            </motion.div>
          )}
        </AnimatePresence>

        {liste.length ? (
          <ul className="mt-3 divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {liste.slice(0, kac).map((k) => {
              const sec = secili.includes(k.id);
              return (
                <li key={k.id} className={cn("flex items-center gap-3 px-3 py-2.5 transition-colors", sec ? "bg-white/[0.04]" : "hover:bg-white/[0.025]")}>
                  <button type="button" role="checkbox" aria-checked={sec} aria-label="Seç" onClick={() => setSecili((l) => (sec ? l.filter((x) => x !== k.id) : [...l, k.id]))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.06]"><Halka dolu={sec} boyut={18} /></button>
                  <button type="button" onClick={() => setAcik(k.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.09] ring-1 ring-inset ring-[#55d6fd]/20"><UserRound className="h-4 w-4 text-[#8be6ff]" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2"><span className="truncate text-[13.5px] font-medium text-white">{k.ad}</span>{k.cikti && <Rozet ton="rose" className="h-5 px-2 text-[11px]">Çıktı</Rozet>}</span>
                      <span className="block truncate text-[12px] text-white/50">{k.eposta ?? k.telefon}</span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 md:flex">{k.kaynaklar.map((x) => { const I = KAYNAK_SIMGE[x]; return <span key={x} title={KAYNAKLAR.find((y) => y.id === x)?.ad} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06]"><I className="h-3 w-3 text-white/65" /></span>; })}</span>
                    <span className="hidden w-[150px] shrink-0 flex-wrap gap-1 lg:flex">{k.etiketler.slice(0, 2).map((x) => <Rozet key={x} ton="soluk" className="h-5 px-2 text-[11px]">{x}</Rozet>)}{k.etiketler.length > 2 && <span className="text-[11px] text-white/40">+{k.etiketler.length - 2}</span>}</span>
                    <Rozet ton={IZIN_TON[k.izin]} className="h-5 shrink-0 px-2 text-[11px] max-sm:hidden">{IZINLER.find((x) => x.id === k.izin)?.ad}</Rozet>
                    <span className="w-[86px] shrink-0 text-right text-[11.5px] text-white/45">{gorece(k.son)}{k.harcama > 0 && <span className="block tabular-nums text-white/70">{tl(Math.round(k.harcama))}</span>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <BosKisiler hic={!d.kisiler.length} ekle={() => setPanel("ekle")} ice={() => setPanel("ice")} />
        )}
        {liste.length > kac && <button type="button" onClick={() => setKac((n) => n + 100)} className={cn(ikincil, "mt-3 w-full justify-center")}>{(liste.length - kac).toLocaleString("tr-TR")} kişi daha göster</button>}
      </Kart>

      <Kart baslik={<span className="flex items-center gap-2">Abonelikten çıkanlar<Rozet ton="soluk">{say.cikan}</Rozet></span>} aciklama="Bu adreslere hiçbir pazarlama e-postası gitmez. 6563 sayılı Kanun gereği ret 3 iş günü içinde uygulanmalı; Vayra hemen uygular."
        sag={<button type="button" onClick={() => setPanel("cikan")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Adres ekle</button>}>
        {say.cikan ? (
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {Object.entries(d.ek.cikanlar).sort((a, b) => b[1].z - a[1].z).slice(0, 50).map(([em, c]) => (
              <li key={em} className="flex items-center gap-3 px-3.5 py-2.5"><span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{em}</span><span className="block truncate text-[11.5px] text-white/45">{c.kaynak}, {gorece(c.z)}</span></span>
                <button type="button" onClick={() => yap(() => e.duzenle("cikan", { eposta: em, ekle: false }))} className={cn(ikincil, "h-7 px-2.5 text-[12px]")}>Listeden çıkar</button></li>
            ))}
          </ul>
        ) : <p className="text-[12.5px] text-white/50">Henüz kimse çıkmadı. Her kampanyanın altında çıkma bağlantısı ve e-posta istemcileri için tek tık çıkma başlığı bulunur.</p>}
      </Kart>

      <KisiPaneli k={kisi} kapat={() => setAcik(null)} e={e} etiketler={etiketler} hata={setHata} />
      <IceAktarPaneli acik={panel === "ice" || panel === "ekle"} tek={panel === "ekle"} kapat={() => setPanel(null)} e={e} />
      <SegmentPaneli acik={panel === "segment"} kapat={() => setPanel(null)} s={s} sayi={liste.length} kaydet={(ad) => yap(async () => { await e.duzenle("segment", { segment: { ad, suzgec: s } }); setPanel(null); })} sil={segment !== "tum" && segment !== "ozel" ? () => yap(async () => { await e.duzenle("segmentSil", { id: segment }); setSegment("tum"); setS({ izin: "tum" }); setPanel(null); }) : undefined} />
      <CikanPaneli acik={panel === "cikan"} kapat={() => setPanel(null)} ekle={(em) => yap(async () => { await e.duzenle("cikan", { eposta: em, ekle: true }); setPanel(null); })} />
    </div>
  );
}

function BosKisiler({ hic, ekle, ice }: { hic: boolean; ekle: () => void; ice: () => void }) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-[14px] bg-white/[0.025] p-4 ring-1 ring-inset ring-white/[0.06] sm:flex-row sm:items-center">
      <div className="flex -space-x-2.5">{[UserRound, Mail, ShoppingBag].map((I, i) => <motion.span key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1b1f] ring-2 ring-[#131416]"><I className="h-4 w-4 text-[#8be6ff]" /></motion.span>)}</div>
      <div className="min-w-0 flex-1 basis-[220px]">
        <p className="text-[13.5px] font-semibold text-white">{hic ? "Henüz kişi yok" : "Bu süzgeçte kişi yok"}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">{hic ? "Site yayına çıkınca üye olanlar, form gönderenler ve ödeme yapanlar burada kendiliğinden görünür. Var olan listeni CSV ile de aktarabilirsin." : "Süzgeci değiştir ya da temizle."}</p>
      </div>
      {hic && <div className="flex shrink-0 gap-2"><button type="button" onClick={ice} className={ikincil}>CSV aktar</button><button type="button" onClick={ekle} className={birincil}>Kişi ekle</button></div>}
    </div>
  );
}

function TopluCubuk({ sayi, etiketler, temizle, uygula }: { sayi: number; etiketler: string[]; temizle: () => void; uygula: (g: Record<string, unknown>) => void }) {
  const [etiket, setEtiket] = useState("");
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[14px] bg-white/[0.05] p-2 ring-1 ring-inset ring-white/[0.08]">
      <span className="px-1.5 text-[12.5px] font-medium text-white">{sayi} kişi seçili</span>
      <span className="flex h-8 items-center rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">
        <input list="buyume-etiketler" value={etiket} onChange={(x) => setEtiket(x.target.value)} placeholder="etiket" className="h-full w-[110px] bg-transparent pl-3 text-[12.5px] text-white outline-none placeholder:text-white/40" />
        <datalist id="buyume-etiketler">{etiketler.map((x) => <option key={x} value={x} />)}</datalist>
        <button type="button" disabled={!etiket.trim()} onClick={() => { uygula({ etiketEkle: [etiket] }); setEtiket(""); }} className="h-8 rounded-full px-2.5 text-[12px] font-medium text-white/80 hover:text-white disabled:opacity-40">Ekle</button>
        <button type="button" disabled={!etiket.trim()} onClick={() => { uygula({ etiketCikar: [etiket] }); setEtiket(""); }} className="h-8 rounded-full px-2.5 text-[12px] text-white/60 hover:text-white disabled:opacity-40">Çıkar</button>
      </span>
      <SecenekMenusu genislik={300} baslik="İzin durumunu işaretle" deger="" sec={(id) => uygula({ izin: id, izinKaynak: id === "onay" ? "Sahip toplu onayladı (izin kaydı sahipte)" : undefined })} l={IZINLER.map((x) => ({ id: x.id, ad: x.ad, alt: x.alt }))}
        tetik={(ac, a) => <Cip onClick={ac} acik={a} className="h-8 pl-3">İzin</Cip>} />
      <button type="button" onClick={temizle} className={cn(simgeDugme, "ml-auto")} aria-label="Seçimi temizle" title="Seçimi temizle"><X className="h-4 w-4" /></button>
    </div>
  );
}

function KisiPaneli({ k, kapat, e, etiketler, hata }: { k: Kisi | null; kapat: () => void; e: BolumProps["e"]; etiketler: string[]; hata: (m: string) => void }) {
  const [not, setNot] = useState<string | null>(null);
  const [dogum, setDogum] = useState<string | null>(null);
  const [yeni, setYeni] = useState("");
  const [kopya, kopyala] = useKopyala();
  if (!k) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const kaydet = async (g: Record<string, unknown>) => { try { await e.duzenle("kisi", { anahtar: k.id, ...g }); } catch (x) { hata(x instanceof Error ? x.message : "Kaydedilemedi."); } };
  const davet = k.davetKodu && e.d ? `${e.d.site}?davet=${k.davetKodu}&utm_source=tavsiye&utm_medium=referral&utm_campaign=tavsiye` : "";
  return (
    <YanPanel acik={!!k} kapat={() => { setNot(null); kapat(); }} baslik={k.ad} alt={k.eposta ?? k.telefon} genis
      alt2={<>
        {k.kaynaklar.includes("elle") && <button type="button" onClick={async () => { await e.duzenle("kisiSil", { anahtar: k.id }).catch(() => {}); kapat(); }} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button>}
        {k.eposta && !k.cikti && <button type="button" onClick={() => e.duzenle("cikan", { eposta: k.eposta, ekle: true }).catch((x) => hata(x.message))} className={cn(ikincil, !k.kaynaklar.includes("elle") && "mr-auto")}>Çıkanlar listesine ekle</button>}
        <button type="button" onClick={kapat} className={birincil}>Tamam</button>
      </>}>
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-4">
          {[["İlk görülme", gorece(k.ilk)], [k.randevuSayisi ? "Randevu" : "Form", String(k.randevuSayisi || k.formSayisi)], ["Sipariş", String(k.siparisSayisi)], ["Harcama", tl(Math.round(k.harcama))]].map(([a, v]) => <div key={a} className="bg-[#17181b] px-3 py-2.5"><dt className="text-[11px] text-white/45">{a}</dt><dd className="mt-0.5 truncate text-[14px] font-semibold tabular-nums text-white">{v}</dd></div>)}
        </dl>
        <div>
          <p className="mb-1.5 text-[12.5px] text-white/60">Ticari ileti izni</p>
          <SatirSecici id="buyume-kisi-izin" deger={k.izin} set={(v) => kaydet({ izin: v })} l={IZINLER.map((x) => ({ id: x.id, ad: x.ad }))} />
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/45">{k.izinKaynak ? `${k.izinKaynak}${k.izinZaman ? `, ${gorece(k.izinZaman)}` : ""}.` : "Onay kaydı yok. Pazarlama e-postası yalnız onaylı kişilere gider; onayın ispatı gönderendedir."}</p>
        </div>
        {!!k.izinGecmis?.length && <details className="-mt-3 text-[12px]"><summary className="cursor-pointer text-white/50 hover:text-white">İzin kayıtları ({k.izinGecmis.length})</summary><ul className="mt-1.5 space-y-1">{[...k.izinGecmis].reverse().map((g, i) => <li key={i} className="text-white/60">{g.durum === "onay" ? "Onay" : g.durum === "ret" ? "Ret" : "Belirsiz"}: {g.kaynak}{g.ip ? `, ${g.ip}` : ""}, {new Date(g.z).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</li>)}</ul></details>}
        <Etiket ad="Doğum günü" sag={<span className="text-[11.5px] text-white/40">Doğum günü otomasyonu için</span>}>
          <input value={dogum ?? (k.dogum ? k.dogum.split("-").reverse().join(".") : "")} onChange={(x) => setDogum(x.target.value)} onBlur={() => { if (dogum !== null) kaydet({ dogum: dogum.trim() }); setDogum(null); }} placeholder="GG.AA ya da GG.AA.YYYY" maxLength={10} className={cn(alan, "h-9 w-[200px]")} />
        </Etiket>
        <div>
          <p className="mb-1.5 text-[12.5px] text-white/60">Etiketler</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {k.etiketler.map((x) => <span key={x} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.07] pl-2.5 pr-1 text-[12px] text-white/85">{x}<button type="button" aria-label={`${x} etiketini kaldır`} onClick={() => kaydet({ etiketler: k.etiketler.filter((y) => y !== x) })} className="flex h-5 w-5 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"><X className="h-3 w-3" /></button></span>)}
            <span className="flex h-7 items-center rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">
              <input list="buyume-etiketler-kisi" value={yeni} onChange={(x) => setYeni(x.target.value)} onKeyDown={(x) => { if (x.key === "Enter" && yeni.trim()) { kaydet({ etiketler: [...k.etiketler, yeni.trim()] }); setYeni(""); } }} placeholder="etiket ekle" className="h-full w-[110px] bg-transparent pl-2.5 text-[12px] text-white outline-none placeholder:text-white/40" />
              <datalist id="buyume-etiketler-kisi">{etiketler.filter((x) => !k.etiketler.includes(x)).map((x) => <option key={x} value={x} />)}</datalist>
            </span>
          </div>
        </div>
        <Etiket ad="Not">
          <textarea value={not ?? k.not ?? ""} onChange={(x) => setNot(x.target.value)} onBlur={() => { if (not !== null && not !== (k.not ?? "")) kaydet({ not }); setNot(null); }} rows={3} maxLength={2000} placeholder="Hafta sonu gelir, sütsüz içer" className={cn(alan, "resize-none py-2.5")} />
        </Etiket>
        {davet && (
          <Etiket ad="Davet bağlantısı" sag={<span className="text-[11.5px] text-white/40">Kodu {k.davetKodu}{k.davetSayisi ? `, ${k.davetSayisi} kişi geldi` : ""}</span>}>
            <span className="flex gap-2"><span className="flex h-10 min-w-0 flex-1 items-center rounded-[12px] bg-white/[0.03] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07]"><span className="truncate">{davet}</span></span><button type="button" onClick={() => kopyala("d", davet)} className={cn(ikincil, "h-10")}>{kopya === "d" ? "Kopyalandı" : "Kopyala"}</button></span>
          </Etiket>
        )}
        <div>
          <p className="mb-2 text-[12.5px] text-white/60">Zaman çizelgesi</p>
          <ol className="relative space-y-2.5 border-l border-white/[0.08] pl-4">
            {k.olaylar.slice(0, 30).map((o, i) => <li key={i} className="relative"><span className={cn("absolute -left-[21px] top-1.5 h-2 w-2 rounded-full", o.tur === "cikti" ? "bg-rose-300" : o.tur === "siparis" || o.tur === "tik" ? "bg-[#55d6fd]" : "bg-white/40")} /><p className="text-[12.5px] text-white/85">{o.metin}</p><p className="text-[11px] text-white/40">{new Date(o.z).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p></li>)}
            {!k.olaylar.length && <li className="text-[12px] text-white/45">Olay yok.</li>}
          </ol>
        </div>
      </div>
    </YanPanel>
  );
}

function IceAktarPaneli({ acik, tek, kapat, e }: { acik: boolean; tek: boolean; kapat: () => void; e: BolumProps["e"] }) {
  const [satirlar, setSatirlar] = useState<Record<string, string>[]>([]);
  const [eposta, setEposta] = useState(""); const [ad, setAd] = useState("");
  const [izin, setIzin] = useState(false); const [izinKaynak, setIzinKaynak] = useState("");
  const [etiket, setEtiket] = useState("");
  const [hata, setHata] = useState(""); const [sonuc, setSonuc] = useState("");
  const sutun = (r: Record<string, string>, re: RegExp) => Object.entries(r).find(([k]) => re.test(k.trim()))?.[1] ?? "";
  const kisiler = tek ? [{ eposta, ad }] : satirlar.map((r) => ({ eposta: sutun(r, /^(e-?posta|e-?mail|mail|email)$/i) || Object.values(r).find((v) => epostaGecerli(v)) || "", ad: sutun(r, /^(ad|isim|name|ad soyad|adsoyad|full name)$/i), telefon: sutun(r, /^(tel|telefon|phone|gsm)$/i) }));
  const gecerli = kisiler.filter((k) => epostaGecerli(k.eposta) || ("telefon" in k && k.telefon)).length;
  const gonder = async () => {
    setHata(""); setSonuc("");
    try { const j = await e.islem("kisi-ekle", { kisiler, izinKaynak: izin ? izinKaynak.trim() || "Sahip ticari ileti onayı aldığını beyan etti" : "", etiketler: etiket.trim() ? [etiket.trim()] : [] }); setSonuc(`${j.eklenen} kişi eklendi${j.atlanan ? `, ${j.atlanan} satır atlandı (e-posta ya da telefon yok)` : ""}.`); setSatirlar([]); setEposta(""); setAd(""); if (tek) kapat(); }
    catch (x) { setHata(x instanceof Error ? x.message : "Eklenemedi."); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={tek ? "Kişi ekle" : "CSV ile içe aktar"} alt={tek ? "Elle eklenen kişi Elle eklenen kaynağıyla görünür." : "İlk satır başlık olmalı: e-posta, ad, telefon. Virgül ya da noktalı virgül."}
      alt2={<><button type="button" onClick={kapat} className={cn(ikincil, "ml-auto")}>Vazgeç</button><button type="button" disabled={!gecerli || (izin && !izinKaynak.trim())} onClick={gonder} className={birincil}>{tek ? "Ekle" : `${gecerli} kişiyi aktar`}</button></>}>
      <div className="space-y-4">
        {hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}
        {sonuc && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{sonuc}</p>}
        {tek ? (
          <>
            <Etiket ad="E-posta"><input value={eposta} onChange={(x) => setEposta(x.target.value)} type="email" placeholder="ornek@alanadi.com" className={cn(alan, "h-10")} /></Etiket>
            <Etiket ad="Ad"><input value={ad} onChange={(x) => setAd(x.target.value)} maxLength={80} className={cn(alan, "h-10")} /></Etiket>
          </>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[16px] border border-dashed border-white/20 bg-white/[0.02] px-4 py-6 text-center hover:bg-white/[0.04]">
            <Upload className="h-5 w-5 text-white/55" />
            <span className="text-[13px] text-white">{satirlar.length ? `${satirlar.length} satır okundu, ${gecerli} kişi geçerli` : "CSV dosyası seç"}</span>
            <span className="text-[12px] text-white/45">En çok 5.000 satır</span>
            <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={async (x) => { const f = x.target.files?.[0]; if (f) setSatirlar(csvCoz(await f.text())); }} />
          </label>
        )}
        <Etiket ad="Etiket (isteğe bağlı)"><input value={etiket} onChange={(x) => setEtiket(x.target.value)} maxLength={30} placeholder="fuar-2026" className={cn(alan, "h-10")} /></Etiket>
        <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          <button type="button" role="checkbox" aria-checked={izin} onClick={() => setIzin(!izin)} className="flex w-full items-start gap-2.5 text-left">
            <span className="mt-0.5"><Halka dolu={izin} boyut={18} /></span>
            <span className="text-[12.5px] leading-relaxed text-white/80">Bu kişilerden ticari elektronik ileti onayı aldım ve ispatını saklıyorum (6563 sayılı Kanun, KVKK). İşaretlemezsen kişiler izni belirsiz olarak eklenir ve pazarlama e-postası almaz.</span>
          </button>
          {izin && <input value={izinKaynak} onChange={(x) => setIzinKaynak(x.target.value)} maxLength={200} placeholder="Onay nerede alındı: mağazadaki kayıt formu, 2026 fuarı" className={cn(alan, "mt-2.5 h-9 text-[12.5px]")} />}
        </div>
      </div>
    </YanPanel>
  );
}

function SegmentPaneli({ acik, kapat, s, sayi, kaydet, sil }: { acik: boolean; kapat: () => void; s: Suzgec; sayi: number; kaydet: (ad: string) => void; sil?: () => void }) {
  const [ad, setAd] = useState("");
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Segment olarak kaydet" alt="Segment kayıtlı bir süzgeçtir; yeni kişiler koşula uyunca kendiliğinden girer."
      alt2={<>{sil && <button type="button" onClick={sil} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Seçili segmenti sil</button>}<button type="button" onClick={kapat} className={cn(ikincil, !sil && "ml-auto")}>Vazgeç</button><button type="button" disabled={!ad.trim()} onClick={() => { kaydet(ad.trim()); setAd(""); }} className={birincil}>Kaydet</button></>}>
      <div className="space-y-4">
        <Etiket ad="Segment adı"><input autoFocus value={ad} onChange={(x) => setAd(x.target.value)} maxLength={60} placeholder="Sadık müşteriler" className={cn(alan, "h-10")} /></Etiket>
        <div className="rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]"><p className="text-[12px] text-white/45">Koşul</p><p className="mt-0.5 text-[13px] text-white">{suzgecOzeti(s)}</p><p className="mt-1 text-[12px] text-white/50">Şu an {sayi.toLocaleString("tr-TR")} kişi</p></div>
      </div>
    </YanPanel>
  );
}

function CikanPaneli({ acik, kapat, ekle }: { acik: boolean; kapat: () => void; ekle: (e: string) => void }) {
  const [e, setE] = useState("");
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Çıkanlar listesine ekle" alt="E-postayla ya da telefonla ret bildiren kişiyi buraya ekle; ona bir daha pazarlama iletisi gitmez."
      alt2={<><button type="button" onClick={kapat} className={cn(ikincil, "ml-auto")}>Vazgeç</button><button type="button" disabled={!epostaGecerli(e.trim())} onClick={() => { ekle(e.trim()); setE(""); }} className={birincil}>Ekle</button></>}>
      <Etiket ad="E-posta"><input autoFocus value={e} onChange={(x) => setE(x.target.value)} type="email" className={cn(alan, "h-10")} /></Etiket>
    </YanPanel>
  );
}
