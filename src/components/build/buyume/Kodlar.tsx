"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Copy, Gift, Mail, Plus, Ticket, Trash2, Trophy, UserRound } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import { kodUygun, type IndirimKodu } from "@/lib/build/buyumeEkTipler";
import { bugunTR } from "@/lib/build/buyumeTipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Etiket, Halka, HataSatiri, ikincil, Kart, Rozet, SatirSecici, simgeDugme, useKopyala, YanPanel } from "./ortak";
import type { BolumProps } from "./BuyumeSekme";

const kodYaz = (k: Pick<IndirimKodu, "tur" | "deger">) => (k.tur === "yuzde" ? `yüzde ${k.deger} indirim` : `${k.deger.toLocaleString("tr-TR")} TL indirim`);

export function KodlarBolumu({ p, e, git, ajanaGonder }: BolumProps) {
  const d = e.d!;
  const [t, setT] = useState(d.ek.tavsiye);
  const [kirli, setKirli] = useState(false);
  const [panel, setPanel] = useState<IndirimKodu | "yeni" | null>(null);
  const [hata, setHata] = useState("");
  const [kopya, kopyala] = useKopyala();
  const yap = async (f: () => Promise<unknown>) => { setHata(""); try { await f(); } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); } };
  const davetciler = d.kisiler.filter((k) => k.davetSayisi).sort((a, b) => (b.davetSayisi ?? 0) - (a.davetSayisi ?? 0)).slice(0, 8);
  const gelen = d.kisiler.filter((k) => k.davetEden).length;
  const ucAdres = `${d.koken}/api/build/buyume-genel/kod/${p.id}`;
  const bugun = bugunTR();
  const davetKodu = d.ek.kodlar.find((k) => k.id === t.kodId);

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">Tavsiye programı<Rozet ton={d.ek.tavsiye.acik ? "aksan" : "soluk"}>{d.ek.tavsiye.acik ? "Açık" : "Kapalı"}</Rozet></span>}
        aciklama="Her kişinin kendi davet kodu ve bağlantısı var. Davet bağlantısıyla gelen biri form gönderdiğinde kimin davet ettiği Kişiler'e yazılır."
        sag={<button type="button" disabled={!kirli} onClick={() => yap(async () => { await e.duzenle("tavsiye", { tavsiye: t }); setKirli(false); })} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>Kaydet</button>}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-3">
            <button type="button" role="switch" aria-checked={t.acik} onClick={() => { setT({ ...t, acik: !t.acik }); setKirli(true); }} className="flex w-full items-center gap-2.5 rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-left ring-1 ring-inset ring-white/[0.07]"><Halka dolu={t.acik} boyut={18} /><span className="min-w-0"><span className="block text-[13px] text-white">Programı aç</span><span className="block text-[12px] text-white/45">E-postalarda {"{davet_baglantisi}"} her kişinin kendi bağlantısına dönüşür</span></span></button>
            <Etiket ad="Davet edene ödül"><input value={t.davetEdenOdul} onChange={(x) => { setT({ ...t, davetEdenOdul: x.target.value }); setKirli(true); }} maxLength={200} placeholder="Her yeni müşteri için bir kahve bizden" className={cn(alan, "h-9")} /></Etiket>
            <Etiket ad="Davet edilene ödül"><input value={t.davetliOdul} onChange={(x) => { setT({ ...t, davetliOdul: x.target.value }); setKirli(true); }} maxLength={200} placeholder="İlk siparişte yüzde 10 indirim" className={cn(alan, "h-9")} /></Etiket>
            <div>
              <p className="mb-1.5 text-[12.5px] text-white/60">Davet edilene verilecek kod</p>
              <div className="flex flex-wrap gap-1.5">
                {[{ id: "", kod: "Kod yok" }, ...d.ek.kodlar.map((k) => ({ id: k.id, kod: k.kod }))].map((k) => <button key={k.id || "yok"} type="button" onClick={() => { setT({ ...t, kodId: k.id || undefined }); setKirli(true); }} className={cn("h-8 rounded-full px-3 text-[12.5px]", (t.kodId ?? "") === k.id ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/65 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{k.kod}</button>)}
                <button type="button" onClick={() => setPanel("yeni")} className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><Plus className="h-3.5 w-3.5" />Özel kod</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ajanaGonder && <button type="button" onClick={() => ajanaGonder(`Tavsiye programı için: adresinde ?davet=KOD olan ziyaretçinin kodunu sakla (localStorage "davet"), sitedeki bütün data-vayra-form formlarına name="davet" olan gizli bir alan ekleyip bu kodla doldur.${t.davetliOdul ? ` Kod varsa sayfanın üstünde "${t.davetliOdul}${davetKodu ? `, kod: ${davetKodu.kod}` : ""}" yazan kapatılabilir ince bir şerit göster.` : ""} Başka bir şeyi değiştirme.`)} className={cn(birincil, "h-9")}><Bot className="h-3.5 w-3.5" />Davet alanını siteye ekle</button>}
              <button type="button" onClick={() => git("eposta")} className={cn(ikincil, "h-9")}><Mail className="h-3.5 w-3.5" />Davet bağlantılarını e-postayla gönder</button>
            </div>
          </div>
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
              {[["Davet kodu olan", d.kisiler.filter((k) => k.davetKodu).length], ["Davetle gelen", gelen]].map(([a, n]) => <div key={a as string} className="bg-[#141518] px-3.5 py-3"><dt className="text-[11.5px] text-white/45">{a}</dt><dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-white">{n as number}</dd></div>)}
            </dl>
            <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-white"><Trophy className="h-3.5 w-3.5 text-[#8be6ff]" />En çok davet edenler</p>
              {davetciler.length ? <ul className="space-y-1.5">{davetciler.map((k) => <li key={k.id} className="flex items-center gap-2 text-[12.5px]"><UserRound className="h-3.5 w-3.5 text-white/40" /><span className="min-w-0 flex-1 truncate text-white/85">{k.ad}</span><span className="tabular-nums text-white">{k.davetSayisi} kişi</span></li>)}</ul> : <p className="text-[12px] leading-relaxed text-white/45">Henüz davetle gelen yok. Kişinin bağlantısı Kişiler panelinde ve e-postalarda {"{davet_baglantisi}"} etiketiyle.</p>}
            </div>
          </div>
        </div>
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>

      <Kart baslik={<span className="flex items-center gap-2">İndirim kodları<Rozet>{d.ek.kodlar.length}</Rozet></span>} aciklama="Kampanya, bülten ya da kasada kullanılacak kodlar. Sitenin sepeti ya da kasa kodu doğrulama ucuyla denetler, kullanımı sayılır."
        sag={<button type="button" onClick={() => setPanel("yeni")} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Kod oluştur</button>}>
        {d.ek.kodlar.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {d.ek.kodlar.map((k) => { const uygun = kodUygun(k, bugun); return (
                <motion.li key={k.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
                  <button type="button" onClick={() => setPanel(k)} className="block w-full px-3.5 pb-2 pt-3.5 text-left transition-colors hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2"><Ticket className="h-4 w-4 shrink-0 text-[#8be6ff]" /><span className="truncate text-[15px] font-semibold tracking-[0.03em] text-white">{k.kod}</span><Rozet ton={uygun ? "aksan" : "soluk"} className="ml-auto h-5 px-2 text-[11px]">{uygun ? "Geçerli" : !k.aktif ? "Kapalı" : k.bitis && k.bitis < bugun ? "Süresi doldu" : "Sınır doldu"}</Rozet></div>
                    <p className="mt-1.5 text-[13px] text-white/85">{kodYaz(k)}</p>
                    <p className="mt-0.5 truncate text-[12px] text-white/45">{k.aciklama || "Açıklama yok"}{k.bitis ? `, son gün ${new Date(k.bitis + "T12:00:00Z").toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}` : ""}</p>
                  </button>
                  <div className="flex items-center gap-2 px-3.5 pb-2.5"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><span className="block h-full rounded-full bg-[#1e9fcf]" style={{ width: `${k.sinir ? Math.min(100, (k.kullanim / k.sinir) * 100) : k.kullanim ? 100 : 0}%`, opacity: k.sinir ? 1 : 0.35 }} /></span><span className="shrink-0 text-[11.5px] tabular-nums text-white/55">{k.kullanim}{k.sinir ? ` / ${k.sinir}` : ""} kullanım</span>
                    <button type="button" onClick={() => kopyala(k.id, k.kod)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Kodu kopyala" title={kopya === k.id ? "Kopyalandı" : "Kopyala"}>{kopya === k.id ? <span className="text-[10px] font-semibold text-[#8be6ff]">Tamam</span> : <Copy className="h-3.5 w-3.5" />}</button></div>
                </motion.li>
              ); })}
            </AnimatePresence>
          </ul>
        ) : <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]"><Gift className="h-5 w-5 shrink-0 text-[#8be6ff]" /><p className="text-[12.5px] leading-relaxed text-white/55">İlk kodunu oluştur: HOSGELDIN10 gibi bir hoş geldin indirimi bülten kaydını artırır.</p></div>}
        <div className="mt-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          <p className="text-[12.5px] font-medium text-white">Doğrulama ucu</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">kod parametresiyle yapılan GET isteği geçerliliği ve indirimi döndürür; sipariş tamamlanınca kodla yapılan POST isteği kullanımı bir artırır. IP başına dakikada 20 deneme. Vayra Ödeme indirimi ödeme tutarına kendiliğinden uygulamaz; tutar ürün tablosundan hesaplanır.</p>
          <div className="mt-2 flex flex-wrap gap-2"><span className="flex h-9 min-w-0 flex-1 basis-[220px] items-center rounded-[12px] bg-white/[0.03] px-3 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.07]"><span className="truncate">{ucAdres}</span></span><button type="button" onClick={() => kopyala("uc", ucAdres)} className={cn(ikincil, "h-9")}>{kopya === "uc" ? "Kopyalandı" : "Kopyala"}</button>
            {ajanaGonder && <button type="button" onClick={() => ajanaGonder(`Sepete ya da sipariş formuna bir "İndirim kodu" alanı ekle. Uygula düğmesi fetch("${ucAdres}?kod=" + kod) çağırsın; yanıt { gecerli, tur ("yuzde" ya da "tutar"), deger, aciklama } döner. Geçerliyse indirimi ve yeni toplamı göster, değilse "Kod geçerli değil" yaz. Sipariş tamamlanınca fetch("${ucAdres}", { method: "POST", body: JSON.stringify({ kod }) }) ile kullanımı bildir.`)} className={cn(birincil, "h-9")}><Bot className="h-3.5 w-3.5" />Ajana sepete ekle</button>}</div>
        </div>
      </Kart>
      <KodPaneli k={panel} kapat={() => setPanel(null)} kaydet={(g) => yap(async () => { await e.duzenle("kod", { kod: g }); setPanel(null); })} sil={(id) => yap(async () => { await e.duzenle("kodSil", { id }); setPanel(null); })} />
    </div>
  );
}

function KodPaneli({ k, kapat, kaydet, sil }: { k: IndirimKodu | "yeni" | null; kapat: () => void; kaydet: (g: Record<string, unknown>) => void; sil: (id: string) => void }) {
  const ilk = k && k !== "yeni" ? k : null;
  const [f, setF] = useState({ kod: "", tur: "yuzde" as "yuzde" | "tutar", deger: "10", bitis: "", sinir: "", aciklama: "", aktif: true });
  const [acilan, setAcilan] = useState<string | null>(null);
  const anahtar = k === "yeni" ? "yeni" : k?.id ?? null;
  if (anahtar !== acilan) { setAcilan(anahtar); if (anahtar) setF(ilk ? { kod: ilk.kod, tur: ilk.tur, deger: String(ilk.deger), bitis: ilk.bitis ?? "", sinir: ilk.sinir ? String(ilk.sinir) : "", aciklama: ilk.aciklama, aktif: ilk.aktif } : { kod: "", tur: "yuzde", deger: "10", bitis: "", sinir: "", aciklama: "", aktif: true }); }
  return (
    <YanPanel acik={!!k} kapat={kapat} baslik={ilk ? ilk.kod : "Yeni indirim kodu"} alt={ilk ? `${ilk.kullanim} kez kullanıldı, ${gorece(ilk.olusturma)} oluşturuldu` : "Kod büyük harfe çevrilir."}
      alt2={<>{ilk && <button type="button" onClick={() => sil(ilk.id)} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button>}<button type="button" onClick={kapat} className={cn(ikincil, !ilk && "ml-auto")}>Vazgeç</button><button type="button" disabled={!/^[A-Za-z0-9_-]{3,24}$/.test(f.kod.trim()) || !(Number(f.deger) > 0)} onClick={() => kaydet({ id: ilk?.id, ...f, deger: Number(f.deger), sinir: Number(f.sinir) || undefined })} className={birincil}>Kaydet</button></>}>
      <div className="space-y-3.5">
        <Etiket ad="Kod"><input value={f.kod} onChange={(x) => setF({ ...f, kod: x.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24) })} placeholder="HOSGELDIN10" className={cn(alan, "h-10 font-semibold tracking-[0.03em]")} /></Etiket>
        <div><p className="mb-1.5 text-[12.5px] text-white/60">İndirim</p><div className="flex flex-wrap items-center gap-2"><SatirSecici id="kod-tur" deger={f.tur} set={(v) => setF({ ...f, tur: v })} l={[{ id: "yuzde" as const, ad: "Yüzde" }, { id: "tutar" as const, ad: "Tutar" }]} /><span className="flex h-9 w-[140px] items-center rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">{f.tur === "yuzde" && <span className="pl-3 text-[12.5px] text-white/45">yüzde</span>}<input inputMode="numeric" value={f.deger} onChange={(x) => setF({ ...f, deger: x.target.value.replace(/\D/g, "").slice(0, 7) })} className="h-full min-w-0 flex-1 bg-transparent px-2 text-[13px] tabular-nums text-white outline-none" />{f.tur === "tutar" && <span className="pr-3 text-[12.5px] text-white/45">TL</span>}</span></div></div>
        <div className="grid grid-cols-2 gap-2">
          <Etiket ad="Son gün"><input type="date" value={f.bitis} onChange={(x) => setF({ ...f, bitis: x.target.value })} className={cn(alan, "h-10 [color-scheme:dark]")} /></Etiket>
          <Etiket ad="Kullanım sınırı"><input inputMode="numeric" value={f.sinir} onChange={(x) => setF({ ...f, sinir: x.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Sınırsız" className={cn(alan, "h-10")} /></Etiket>
        </div>
        <Etiket ad="Açıklama"><input value={f.aciklama} onChange={(x) => setF({ ...f, aciklama: x.target.value })} maxLength={200} placeholder="Bülten abonelerine ilk sipariş indirimi" className={cn(alan, "h-10")} /></Etiket>
        <button type="button" role="switch" aria-checked={f.aktif} onClick={() => setF({ ...f, aktif: !f.aktif })} className="flex items-center gap-2.5 text-[13px] text-white"><Halka dolu={f.aktif} boyut={18} />Kod kullanılabilir</button>
      </div>
    </YanPanel>
  );
}
