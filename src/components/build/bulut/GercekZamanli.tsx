"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, Database, Loader2, Pause, Play, Radio, Send, Trash2, Users } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { VeriKancalari } from "./VeriKancalari";

type Durum = { baglanti: number; site: number; uye: number; kanallar: { ad: string; kisi: number; kimler: Record<string, unknown>[] }[]; tablolar: { ad: string; abone: number }[]; sayac: { olay: number; mesaj: number; bas: number }; tabloKurallari: { ad: string; okuma: string }[] };
type Akis = { anahtar: number; z: number; tur: "degisiklik" | "mesaj" | "varlik"; baslik: string; alt: string; veri: unknown };
const KURAL = { herkes: { ad: "Herkes dinler", s: "bg-amber-400/[0.1] text-amber-200" }, uyeler: { ad: "Üyeler dinler", s: "bg-white/[0.07] text-white/65" }, sahibi: { ad: "Her üye kendi kaydını", s: "bg-white/[0.07] text-white/65" }, kapali: { ad: "Yalnız sen", s: "bg-[#55d6fd]/[0.1] text-[#8be6ff]" } } as Record<string, { ad: string; s: string }>;
const OLAY_AD: Record<string, string> = { ekle: "eklendi", guncelle: "güncellendi", sil: "silindi", toplu: "toplu değişti" };
const RENK = { degisiklik: "bg-[#55d6fd]", mesaj: "bg-violet-300", varlik: "bg-emerald-300" };
const saat = (z: number) => new Date(z).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** SSE akışını fetch ile okur (sahip başlığı gönderebilmek için EventSource yerine). */
function useAkis(projeId: string, acik: boolean, olay: (tur: string, veri: Record<string, unknown>) => void) {
  const [bagli, setBagli] = useState(false);
  const geri = useRef(olay); geri.current = olay;
  useEffect(() => {
    if (!acik) { setBagli(false); return; }
    const ac = new AbortController();
    let bekle: ReturnType<typeof setTimeout> | null = null;
    const baglan = async () => {
      try {
        const a = encodeURIComponent(JSON.stringify([{ i: "panel", t: "*" }]));
        const r = await fetch(`/api/build/veri/${projeId}/$canli?a=${a}&izle=1`, { headers: { "x-build-sahip": localStorage.getItem("vayra-build-sahip") ?? "" }, signal: ac.signal });
        if (!r.ok || !r.body) throw new Error("akış açılamadı");
        setBagli(true);
        const okur = r.body.getReader(), dec = new TextDecoder();
        let tampon = "";
        for (;;) {
          const { value, done } = await okur.read();
          if (done) break;
          tampon += dec.decode(value, { stream: true });
          let i;
          while ((i = tampon.indexOf("\n\n")) >= 0) {
            const parca = tampon.slice(0, i); tampon = tampon.slice(i + 2);
            let tur = "message", veri = "";
            for (const s of parca.split("\n")) { if (s.startsWith("event: ")) tur = s.slice(7); else if (s.startsWith("data: ")) veri += s.slice(6); }
            if (veri) { try { geri.current(tur, JSON.parse(veri)); } catch { /* bozuk satır */ } }
          }
        }
      } catch { /* kapandı */ }
      setBagli(false);
      if (!ac.signal.aborted) bekle = setTimeout(baglan, 3000);
    };
    baglan();
    return () => { ac.abort(); if (bekle) clearTimeout(bekle); };
  }, [projeId, acik]);
  return bagli;
}

/** Bulut > Gerçek zamanlı: canlı olay akışı, bağlantılar, kanallar ve varlık, tablo aboneleri, deneme mesajı. */
export function GercekZamanli({ p }: { p: Proje }) {
  const [d, setD] = useState<Durum | null>(null);
  const [izle, setIzle] = useState(true);
  const [akis, setAkis] = useState<Akis[]>([]);
  const [suzgec, setSuzgec] = useState<"hepsi" | "degisiklik" | "mesaj">("hepsi");
  const [acik, setAcik] = useState<number | null>(null);
  const [mesaj, setMesaj] = useState({ kanal: "genel", olay: "duyuru", veri: '{\n  "metin": "Merhaba"\n}' });
  const [gonderim, setGonderim] = useState<string>("");
  const [gidiyor, setGidiyor] = useState(false);
  const sira = useRef(0);
  const getir = useCallback(() => api<Durum>(`/api/build/bulut/${p.id}/canli`).then(setD).catch(() => {}), [p.id]);
  useEffect(() => { getir(); const t = setInterval(getir, 5000); return () => clearInterval(t); }, [getir]);
  const bagli = useAkis(p.id, izle, (tur, v) => {
    if (tur === "hazir") return;
    const z = Number(v.z) || Date.now();
    const x: Akis | null = tur === "degisiklik" ? { anahtar: ++sira.current, z, tur: "degisiklik", baslik: `${v.tablo}`, alt: `Kayıt ${OLAY_AD[String(v.olay)] ?? v.olay}${v.adet ? `, ${v.adet} kayıt` : ""}`, veri: v.kayit ?? v }
      : tur === "mesaj" ? { anahtar: ++sira.current, z, tur: "mesaj", baslik: `${v.kanal}`, alt: `"${v.olay}" mesajı`, veri: v.veri }
      : tur === "varlik" ? { anahtar: ++sira.current, z, tur: "varlik", baslik: `${v.kanal}`, alt: `${(v.kimler as unknown[])?.length ?? 0} kişi çevrimiçi`, veri: v.kimler } : null;
    if (x) setAkis((l) => [x, ...l].slice(0, 200));
  });
  const gorunen = akis.filter((x) => suzgec === "hepsi" || x.tur === suzgec);
  const gonder = async () => {
    setGidiyor(true); setGonderim("");
    try {
      let veri: unknown = mesaj.veri;
      try { veri = JSON.parse(mesaj.veri); } catch { /* düz metin */ }
      const r = await api<{ alici: number }>(`/api/build/veri/${p.id}/$canli`, { govde: { kanal: mesaj.kanal, olay: mesaj.olay, veri } });
      setGonderim(r.alici ? `${r.alici} bağlantıya gitti.` : "Gönderildi; şu an bu kanalda kimse yok.");
    } catch (e) { setGonderim(e instanceof ApiHatasi ? e.message : "Gönderilemedi."); }
    finally { setGidiyor(false); }
  };
  const kurallar = new Map((d?.tabloKurallari ?? []).map((x) => [x.ad, x.okuma]));

  return (
    <div className="space-y-4">
      <Kart ikon={Radio} baslik="Gerçek zamanlı" alt="Sitedeki ziyaretçiler tablo değişikliklerini ve kanal mesajlarını sayfayı yenilemeden alır; okuma kuralı her olayda denetlenir"
        sag={<>
          <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px]", bagli ? "bg-emerald-400/[0.1] text-emerald-200" : "bg-white/[0.06] text-white/55")}><span className={cn("h-1.5 w-1.5 rounded-full", bagli ? "animate-pulse bg-emerald-300" : "bg-white/40")} /><span className="max-sm:hidden">{bagli ? "İzleniyor" : izle ? "Bağlanıyor" : "Duraklatıldı"}</span></span>
          <button type="button" onClick={() => setIzle((x) => !x)} title={izle ? "Duraklat" : "Sürdür"} aria-label={izle ? "Duraklat" : "Sürdür"} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white hover:bg-white/[0.12]">{izle ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
        </>}>
        <dl className="grid grid-cols-2 divide-white/[0.05] sm:grid-cols-5 sm:divide-x">
          {[["Bağlantı", d?.baglanti], ["Siteden", d?.site], ["Üye bağlantısı", d?.uye], ["Değişiklik olayı", d?.sayac.olay], ["Kanal mesajı", d?.sayac.mesaj]].map(([a, b]) => (
            <div key={String(a)} className="px-4 py-3 sm:px-5"><dt className="text-[12px] text-white/45">{a}</dt><dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-white"><motion.span key={String(b)} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }}>{b == null ? "-" : Number(b).toLocaleString("tr-TR")}</motion.span></dd></div>
          ))}
        </dl>
      </Kart>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Kart ikon={Radio} baslik="Olay akışı" alt="Canlı ve deneme ortamındaki bütün tablo değişiklikleri ve kanal mesajları" govde="min-h-[320px]"
          sag={<><span className="max-sm:hidden"><Secici id="canli-suzgec" kucuk deger={suzgec} set={setSuzgec} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "degisiklik", ad: "Değişiklik" }, { id: "mesaj", ad: "Mesaj" }]} /></span>{akis.length > 0 && <button type="button" onClick={() => setAkis([])} title="Akışı temizle" aria-label="Akışı temizle" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>}</>}>
          {!gorunen.length ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="relative flex h-10 w-10 items-center justify-center"><span className="absolute inset-0 animate-ping rounded-full bg-[#55d6fd]/20" /><Radio className="relative h-5 w-5 text-[#8be6ff]" /></span>
              <p className="mt-3 text-[13.5px] text-white/75">Olay bekleniyor</p>
              <p className="mt-1 max-w-[380px] text-[12.5px] leading-relaxed text-white/45">Veritabanı sekmesinde bir kayıt ekle, sitende bir form gönder ya da Deneme mesajı kartından bir mesaj yolla; olay burada anında görünür.</p>
            </div>
          ) : (
            <div className="max-h-[520px] divide-y divide-white/[0.04] overflow-y-auto [scrollbar-width:thin]">
              <AnimatePresence initial={false}>
                {gorunen.map((x) => (
                  <motion.div key={x.anahtar} initial={{ opacity: 0, backgroundColor: "rgba(85,214,253,0.08)" }} animate={{ opacity: 1, backgroundColor: "rgba(85,214,253,0)" }} transition={{ duration: 0.8 }}>
                    <button type="button" onClick={() => setAcik((a) => (a === x.anahtar ? null : x.anahtar))} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.02] sm:px-5">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", RENK[x.tur])} />
                      <span className="w-[64px] shrink-0 font-mono text-[11.5px] tabular-nums text-white/40">{saat(x.z)}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-white">{x.baslik}<span className="ml-2 text-white/50">{x.alt}</span></span>
                    </button>
                    {acik === x.anahtar && <pre className="mx-4 mb-3 max-h-[240px] overflow-auto rounded-[12px] bg-[#0c0d0f] p-3 font-mono text-[11.5px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin] sm:mx-5">{JSON.stringify(x.veri, null, 2)}</pre>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Kart>

        <div className="space-y-4">
          <Kart ikon={Users} baslik="Kanallar ve varlık" alt={d?.kanallar.length ? `${d.kanallar.length} kanal açık` : "Şu an açık kanal yok"}>
            {d?.kanallar.length ? (
              <div className="divide-y divide-white/[0.05]">{d.kanallar.map((k) => (
                <div key={k.ad} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{k.ad}</span><span className="block text-[12px] text-white/45">{k.kisi} kişi</span></span>
                  <span className="flex -space-x-1.5">{k.kimler.slice(0, 5).map((x, i) => <span key={i} title={String(x.ad ?? x.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b2a31] text-[10.5px] font-semibold text-[#8be6ff] ring-2 ring-[#121315]">{String(x.ad ?? "?").slice(0, 1).toLocaleUpperCase("tr")}</span>)}</span>
                </div>
              ))}</div>
            ) : <p className="px-5 py-4 text-[12.5px] leading-relaxed text-white/50">Sitede <code className="font-mono text-white/75">vayra.kanal(&quot;oda&quot;)</code> açılınca kim çevrimiçi burada görünür.</p>}
          </Kart>
          <Kart ikon={Database} baslik="Tablo aboneleri" alt="Hangi tabloyu kaç bağlantı dinliyor">
            {d?.tablolar.filter((t) => t.ad !== "*").length ? (
              <div className="divide-y divide-white/[0.05]">{d.tablolar.filter((t) => t.ad !== "*").map((t) => (
                <div key={t.ad} className="flex items-center gap-3 px-4 py-2.5 sm:px-5"><span className="min-w-0 flex-1 truncate text-[13px] text-white">{t.ad}</span><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px]", KURAL[kurallar.get(t.ad) ?? "herkes"]?.s)}>{KURAL[kurallar.get(t.ad) ?? "herkes"]?.ad}</span><span className="w-8 shrink-0 text-right text-[12.5px] tabular-nums text-white/60">{t.abone}</span></div>
              ))}</div>
            ) : <p className="px-5 py-4 text-[12.5px] text-white/50">Sitede şu an tablo dinleyen yok.</p>}
          </Kart>
          <Kart ikon={Send} baslik="Deneme mesajı" alt="Kanaldaki ziyaretçilere anında gider" govde="space-y-2.5 p-4 sm:p-5">
            <div className="flex gap-2"><input value={mesaj.kanal} onChange={(e) => setMesaj({ ...mesaj, kanal: e.target.value })} placeholder="Kanal" aria-label="Kanal" className={cn(alanSinif, "h-9 min-w-0 flex-1 text-[13px]")} /><input value={mesaj.olay} onChange={(e) => setMesaj({ ...mesaj, olay: e.target.value })} placeholder="Olay" aria-label="Olay" className={cn(alanSinif, "h-9 min-w-0 flex-1 text-[13px]")} /></div>
            <textarea value={mesaj.veri} onChange={(e) => setMesaj({ ...mesaj, veri: e.target.value })} rows={4} spellCheck={false} aria-label="Veri" className={cn(alanSinif, "resize-y py-2 font-mono text-[12px]")} />
            <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={gidiyor || !mesaj.kanal} onClick={gonder} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Gönder</button>{gonderim && <span className="text-[12.5px] text-white/60">{gonderim}</span>}</div>
          </Kart>
        </div>
      </div>

      <VeriKancalari projeId={p.id} tablolar={(d?.tabloKurallari ?? []).map((t) => t.ad)} />

      <Kart ikon={Code2} baslik="Sitede kullan" alt="Build ajanı bu kodu kendisi yazar; bağlantı kopunca kendiliğinden yeniden bağlanır" govde="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{`// Tablo değişikliklerini dinle (süzgeç isteğe bağlı)
const kapat = vayra.veri.dinle("siparisler", (o) => {
  // o.olay: "ekle" | "guncelle" | "sil" | "toplu"
  console.log(o.olay, o.kayit);
}, { suzgec: [{ alan: "durum", op: "esit", deger: "yeni" }] });

// Liste her değişince güncel hâliyle gelsin
vayra.veri.izle("yorumlar", { sirala: "olusturma", sinir: 20 },
  (liste) => goster(liste));`}</pre>
        <pre className="overflow-x-auto rounded-[14px] bg-[#0c0d0f] p-3.5 font-mono text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{`// Kanal: yayın mesajı ve kim çevrimiçi
const oda = vayra.kanal("oyun-1", { kim: { ad: "Ada" } });
oda.dinle("hamle", (veri) => tahtayaUygula(veri));
oda.kimler((liste) => cevrimici(liste.length));
oda.gonder("hamle", { x: 3, y: 4 });
// oda.ayril();  "uyeler:" ile başlayan kanallar
// yalnız giriş yapmış üyelere açıktır.`}</pre>
      </Kart>
    </div>
  );
}
