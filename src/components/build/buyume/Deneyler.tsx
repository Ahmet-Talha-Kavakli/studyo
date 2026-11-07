"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, FlaskConical, Pause, Play, Plus, Rocket, Trash2, Trophy } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import { deneySonuc, type DeneyHedef } from "@/lib/build/buyumeEkTipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Etiket, HataSatiri, ikincil, Kart, Rozet, SatirSecici, simgeDugme, YanPanel } from "./ortak";
import type { DeneyIstemci } from "./useBuyumeEk";
import type { BolumProps } from "./BuyumeSekme";

const HIPOTEZ: { id: string; ad: string; metin: string }[] = [
  { id: "baslik", ad: "Ana başlık", metin: "Ana başlığı ziyaretçinin kazancını anlatan daha net bir cümleyle değiştir." },
  { id: "cagri", ad: "Çağrı düğmesi", metin: "Ana çağrı düğmesinin yazısını, rengini ve yerini değiştir; ilk ekranda görünsün." },
  { id: "kanit", ad: "Sosyal kanıt", metin: "İlk ekranın altına gerçek müşteri yorumları ya da güven unsurları bölümü ekle (uydurma yorum yazma; yer tutucu bırak)." },
  { id: "form", ad: "Kısa form", metin: "Formu yalnız gerekli alanlara indir ve ilk ekrana taşı." },
  { id: "gorsel", ad: "Kahraman görseli", metin: "İlk ekrandaki görseli ürünü kullanırken gösteren bir görselle değiştir." },
  { id: "fiyat", ad: "Fiyat iletişimi", metin: "Fiyatı ve teklifi ilk ekranda açıkça göster." },
];
const DURUM: Record<DeneyIstemci["durum"], { ad: string; ton: "soluk" | "aksan" | "amber" | "notr" }> = { taslak: { ad: "Hazırlanıyor", ton: "soluk" }, calisiyor: { ad: "Çalışıyor", ton: "aksan" }, durdu: { ad: "Durdu", ton: "amber" }, bitti: { ad: "Bitti", ton: "notr" } };
const yuzde = (x: number) => `yüzde ${(x * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;

export function DeneylerBolumu({ p, e, ajanaGonder, yayinla }: BolumProps & { yayinla?: () => void }) {
  const d = e.d!;
  const [panel, setPanel] = useState(false);
  const [hata, setHata] = useState("");
  const yap = async (f: () => Promise<unknown>) => { setHata(""); try { await f(); } catch (x) { setHata(x instanceof Error ? x.message : "İşlem yapılamadı."); } };
  const yazdir = (x: DeneyIstemci) => ajanaGonder?.(`A/B denemesi için ${x.sayfa} sayfasının ikinci sürümünü ${x.varyant} adıyla oluştur. ${x.sayfa} dosyasına dokunma. Değişiklik: ${x.hipotez || "ilk ekranın mesajını ve çağrısını daha net yap"}. Geri kalan her şey (gezinme, stiller, data-vayra-form formları, bağlantılar, betikler) A sürümüyle aynı kalsın ki iki sürüm adil karşılaştırılsın. ${x.varyant} site haritasına ve gezinmeye eklenmesin; head bölümüne <meta name="robots" content="noindex"> ve <link rel="canonical" href="${x.sayfa === "index.html" ? "./" : x.sayfa}"> ekle.`);
  const kalici = (x: DeneyIstemci) => ajanaGonder?.(`A/B denemesini B sürümü kazandı. ${x.varyant} sayfasındaki değişiklikleri ${x.sayfa} sayfasına uygula (noindex ve canonical etiketlerini taşıma), sonra ${x.varyant} dosyasını sil.`);

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex items-center gap-2">A/B denemeleri<Rozet>{d.ek.deneyler.length}</Rozet></span>}
        aciklama="Açılış sayfasının ikinci sürümünü Build ajanına yazdır, ziyaretçileri ikiye böl, hangi sürümün daha çok forma, satışa ya da hedef sayfaya götürdüğünü ölç."
        sag={<button type="button" onClick={() => setPanel(true)} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Yeni deneme</button>}>
        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-2 2xl:grid-cols-4">
          {[[Bot, "B sürümünü yazdır", "Ajan aynı sayfanın bir kopyasını değiştirir"], [Rocket, "Yayınla", "İki sayfa da yayında olmalı"], [Play, "Başlat", "Ziyaretçi kalıcı olarak A ya da B görür"], [Trophy, "Kazananı uygula", "Kazanan sürüm ana sayfa olur"]].map(([I, a, alt], i) => { const Ikon = I as typeof Bot; return (
            <li key={a as string} className="flex gap-2.5 bg-[#141518] px-3.5 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.1] text-[12px] font-semibold text-[#8be6ff]">{i + 1}</span><span className="min-w-0"><span className="flex items-center gap-1.5 text-[13px] font-medium text-white"><Ikon className="h-3.5 w-3.5 shrink-0 text-white/55" /><span className="truncate">{a as string}</span></span><span className="block text-[11.5px] leading-snug text-white/45">{alt as string}</span></span></li>
          ); })}
        </ol>
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {!d.ek.deneyler.length && (
        <Kart>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex shrink-0 gap-1.5">{["A", "B"].map((x) => <span key={x} className={cn("flex h-14 w-12 items-center justify-center rounded-[12px] text-[16px] font-semibold ring-1 ring-inset", x === "A" ? "bg-white/[0.05] text-white/80 ring-white/10" : "bg-[#55d6fd]/[0.1] text-[#8be6ff] ring-[#55d6fd]/25")}>{x}</span>)}</div>
            <div className="min-w-[200px] flex-1"><p className="text-[14px] font-semibold text-white">İlk denemeni kur</p><p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">Örneğin ana sayfanın başlığını değiştirip rezervasyon formunun daha çok doldurulup doldurulmadığına bak. Lovable ve Base44'te bu özellik yok.</p></div>
            <button type="button" onClick={() => setPanel(true)} className={birincil}>Deneme kur</button>
          </div>
        </Kart>
      )}
      {d.ek.deneyler.map((x) => {
        const s = deneySonuc(x);
        const adim = !x.taslakta ? 1 : !x.yayinda ? 2 : x.durum === "taslak" ? 3 : 4;
        return (
          <Kart key={x.id} baslik={<span className="flex flex-wrap items-center gap-2"><FlaskConical className="h-4 w-4 text-[#8be6ff]" />{x.ad}<Rozet ton={DURUM[x.durum].ton}>{x.durum === "calisiyor" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#55d6fd]" />}{DURUM[x.durum].ad}</Rozet></span>}
            aciklama={`${x.sayfa} ile ${x.varyant}, trafiğin yüzde ${x.pay} kadarı B'ye. Hedef: ${x.hedef.tur === "form" ? "form gönderimi" : x.hedef.tur === "sayfa" ? `${x.hedef.sayfa} sayfasına ulaşmak` : `${x.hedef.ad} olayı`}${x.baslangic ? `. ${gorece(x.baslangic)} başladı` : ""}`}
            sag={<>
              {x.durum !== "calisiyor" && <button type="button" onClick={() => yap(() => e.duzenle("deneySil", { id: x.id }))} className={cn(simgeDugme, "hover:text-rose-200")} aria-label="Denemeyi sil" title="Sil"><Trash2 className="h-4 w-4" /></button>}
              {x.durum === "calisiyor" && <button type="button" onClick={() => yap(() => e.islem("deney-durdur", { deneyId: x.id }))} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Pause className="h-3.5 w-3.5" />Durdur</button>}
            </>}>
            {x.hipotez && <p className="mb-3 border-l-2 border-[#55d6fd]/60 pl-3 text-[13px] leading-relaxed text-white/80">{x.hipotez}</p>}
            {x.durum !== "bitti" && adim < 4 && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                <p className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed text-white/70">{adim === 1 ? `${x.varyant} henüz projede yok. Build ajanı ${x.sayfa} sayfasını kopyalayıp yalnız hipotezdeki değişikliği yapar.` : adim === 2 ? `${x.varyant} projede hazır ama yayında değil. Değişiklikleri yayınla, sonra denemeyi başlat.` : "İki sayfa da yayında. Başlatınca yeni ziyaretçiler ikiye bölünür."}</p>
                {adim === 1 && ajanaGonder && <button type="button" onClick={() => yazdir(x)} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Bot className="h-3.5 w-3.5" />Ajana B sürümünü yazdır</button>}
                {adim === 2 && yayinla && <button type="button" onClick={yayinla} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Rocket className="h-3.5 w-3.5" />Yayınla</button>}
                {adim === 3 && <button type="button" onClick={() => yap(() => e.islem("deney-baslat", { deneyId: x.id }))} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Play className="h-3.5 w-3.5" />Başlat</button>}
                {adim >= 2 && <a href={`${d.site}${x.varyant}`} target="_blank" rel="noopener noreferrer" className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>B sürümünü aç</a>}
              </div>
            )}
            {x.durum === "durdu" && adim === 4 && <div className="mb-3 flex gap-2"><button type="button" onClick={() => yap(() => e.islem("deney-baslat", { deneyId: x.id }))} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Play className="h-3.5 w-3.5" />Sürdür</button></div>}
            {(x.durum !== "taslak" || x.a.g + x.b.g > 0) && (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["a", "b"] as const).map((kol) => { const v = x[kol], o = kol === "a" ? s.pa : s.pb, kazanan = x.kazanan === kol; return (
                    <div key={kol} className={cn("rounded-[14px] p-3.5 ring-1 ring-inset", kazanan ? "bg-white/[0.06] ring-2 ring-white" : kol === "b" ? "bg-[#55d6fd]/[0.05] ring-[#55d6fd]/20" : "bg-white/[0.03] ring-white/[0.08]")}>
                      <div className="flex items-center justify-between gap-2"><span className="text-[13px] font-semibold text-white">{kol === "a" ? `A · ${x.sayfa}` : `B · ${x.varyant}`}</span>{kazanan && <Rozet ton="aksan"><Trophy className="h-3 w-3" />Kazanan</Rozet>}</div>
                      <motion.p key={o} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="mt-2 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-white">{yuzde(o)}</motion.p>
                      <p className="text-[12px] tabular-nums text-white/55">{v.d.toLocaleString("tr-TR")} dönüşüm, {v.g.toLocaleString("tr-TR")} ziyaretçi</p>
                    </div>
                  ); })}
                </div>
                <div className="mt-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                  <div className="mb-1.5 flex justify-between text-[12px]"><span className="text-white/60">B'nin daha iyi olma olasılığı</span><span className="font-semibold tabular-nums text-white">{yuzde(s.olasilik)}{!s.yeterli && <span className="font-normal text-white/45">, veri az</span>}</span></div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]"><span className="absolute inset-y-0 left-1/2 w-px bg-white/30" /><motion.span initial={{ width: 0 }} animate={{ width: `${s.olasilik * 100}%` }} className={cn("block h-full rounded-full bg-[#55d6fd]", !s.yeterli && "opacity-40")} /></div>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/50">{s.yeterli ? (s.olasilik >= 0.95 ? `B, A'dan ${yuzde(Math.abs(s.artis))} ${s.artis >= 0 ? "daha iyi" : "daha kötü"} ve sonuç güvenilir.` : s.olasilik <= 0.05 ? "A açıkça daha iyi; B'yi kaldırabilirsin." : "Fark henüz net değil; deneme sürsün.") : "Güvenilir karar için her sürümde en az 100 ziyaretçi ve toplam 10 dönüşüm gerekir."}</p>
                </div>
                {x.durum !== "taslak" && x.durum !== "bitti" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => yap(() => e.islem("deney-bitir", { deneyId: x.id, kazanan: "a" }))} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Bitir, A kalsın</button>
                    <button type="button" onClick={() => yap(async () => { await e.islem("deney-bitir", { deneyId: x.id, kazanan: "b" }); kalici(x); })} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Trophy className="h-3.5 w-3.5" />Bitir, B'yi kalıcı yap</button>
                  </div>
                )}
                {x.durum === "bitti" && x.kazanan === "b" && ajanaGonder && <button type="button" onClick={() => kalici(x)} className={cn(ikincil, "mt-3 h-8 px-3 text-[12.5px]")}><Bot className="h-3.5 w-3.5" />B'yi ana sayfaya yeniden uygulat</button>}
              </>
            )}
          </Kart>
        );
      })}
      <DeneyPaneli acik={panel} kapat={() => setPanel(false)} p={p} kaydet={(g) => yap(async () => { await e.duzenle("deney", { deney: g }); setPanel(false); })} />
    </div>
  );
}

function DeneyPaneli({ acik, kapat, p, kaydet }: { acik: boolean; kapat: () => void; p: BolumProps["p"]; kaydet: (g: Record<string, unknown>) => void }) {
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html") && y !== "404.html" && !/-b\.html$/.test(y));
  const [sayfa, setSayfa] = useState("index.html");
  const [hipotez, setHipotez] = useState("");
  const [hedefTur, setHedefTur] = useState<DeneyHedef["tur"]>("form");
  const [hedefDeger, setHedefDeger] = useState("");
  const [pay, setPay] = useState(50);
  const varyant = sayfa.replace(/\.html$/, "-b.html");
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Yeni A/B denemesi" alt="Ziyaretçi ilk geldiğinde bir sürüme atanır ve hep onu görür."
      alt2={<><button type="button" onClick={kapat} className={cn(ikincil, "ml-auto")}>Vazgeç</button><button type="button" disabled={!hipotez.trim() || (hedefTur !== "form" && !hedefDeger.trim())} onClick={() => kaydet({ sayfa, varyant, hipotez: hipotez.trim(), pay, ad: `${sayfa === "index.html" ? "Ana sayfa" : sayfa}: ${hipotez.trim().slice(0, 40)}`, hedef: hedefTur === "form" ? { tur: "form" } : hedefTur === "sayfa" ? { tur: "sayfa", sayfa: hedefDeger.trim() } : { tur: "olay", ad: hedefDeger.trim() } })} className={birincil}>Denemeyi kur</button></>}>
      <div className="space-y-4">
        <div><p className="mb-1.5 text-[12.5px] text-white/60">Denenecek sayfa</p><div className="flex flex-wrap gap-1.5">{sayfalar.map((y) => <button key={y} type="button" onClick={() => setSayfa(y)} className={cn("h-8 rounded-full px-3 text-[12.5px]", sayfa === y ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/65 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{y}</button>)}</div><p className="mt-1.5 text-[12px] text-white/45">B sürümü {varyant} adıyla yazılır.</p></div>
        <div>
          <p className="mb-1.5 text-[12.5px] text-white/60">Neyi değiştirelim</p>
          <div className="grid grid-cols-2 gap-1.5">{HIPOTEZ.map((h) => <button key={h.id} type="button" onClick={() => setHipotez(h.metin)} className={cn("rounded-[12px] px-3 py-2 text-left text-[12.5px] transition-colors", hipotez === h.metin ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/75 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07]")}>{h.ad}</button>)}</div>
          <textarea value={hipotez} onChange={(x) => setHipotez(x.target.value)} rows={3} maxLength={1200} placeholder="Özel: kendi hipotezini yaz" className={cn(alan, "mt-2 resize-none py-2.5")} />
        </div>
        <div>
          <p className="mb-1.5 text-[12.5px] text-white/60">Dönüşüm ne sayılsın</p>
          <SatirSecici id="deney-hedef" deger={hedefTur} set={setHedefTur} l={[{ id: "form" as const, ad: "Form gönderimi" }, { id: "sayfa" as const, ad: "Hedef sayfa" }, { id: "olay" as const, ad: "Özel olay" }]} />
          {hedefTur !== "form" && <input value={hedefDeger} onChange={(x) => setHedefDeger(x.target.value)} placeholder={hedefTur === "sayfa" ? "tesekkurler.html" : "satin_alma (vayra.olay ile gönderilen ad)"} className={cn(alan, "mt-2 h-9")} />}
        </div>
        <Etiket ad="B sürümüne giden trafik" sag={<span className="text-[12px] tabular-nums text-white">yüzde {pay}</span>}>
          <input type="range" min={10} max={90} step={5} value={pay} onChange={(x) => setPay(Number(x.target.value))} className="w-full accent-[#55d6fd]" />
        </Etiket>
      </div>
    </YanPanel>
  );
}
