"use client";

import { useMemo, useState } from "react";
import { ImageIcon, Link2, Loader2, Search, Sparkles } from "lucide-react";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { MEDYA_HAVUZU } from "@/lib/medyaHavuzu";
import { cn } from "@/lib/utils";

/** Türkçe aramayı kitaplığın İngilizce başlıklarına ve temalarına çevirir. */
const SOZLUK: Record<string, string[]> = {
  kahve: ["coffee", "cafe", "espresso", "latte"], cay: ["tea"], tatli: ["dessert", "cake", "sweet", "chocolate"], yemek: ["food", "meal", "cook", "dish", "kitchen"], restoran: ["restaurant", "food", "chef"],
  deniz: ["sea", "ocean", "beach", "wave"], plaj: ["beach", "sand"], sehir: ["city", "street", "building", "urban"], doga: ["nature", "forest", "tree", "mountain", "field"], dag: ["mountain"], orman: ["forest", "tree"],
  gece: ["night", "neon", "dark"], urun: ["product", "bottle", "package"], portre: ["portrait", "woman", "man", "face"], kadin: ["woman", "girl"], erkek: ["man"], araba: ["car", "vehicle", "road"],
  uzay: ["space", "galaxy", "planet", "star"], teknoloji: ["technology", "computer", "phone", "digital", "laptop"], muzik: ["music", "guitar", "piano", "concert"], is: ["office", "business", "work", "meeting"],
  hayvan: ["animal", "dog", "cat", "bird"], kopek: ["dog"], kedi: ["cat"], gokyuzu: ["sky", "cloud", "sunset"], gunbatimi: ["sunset"], isik: ["light", "glow"], moda: ["fashion", "model", "dress"],
  cicek: ["flower", "bloom"], yagmur: ["rain"], kar: ["snow", "winter"], spor: ["sport", "run", "fitness", "gym"], su: ["water"], ates: ["fire", "flame"],
};
const katla = (x: string) => x.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
const TEMALAR: [string, string][] = [["", "Hepsi"], ["urun", "Ürün"], ["yemek", "Yemek"], ["doga", "Doğa"], ["deniz", "Deniz"], ["sehir", "Şehir"], ["gece", "Gece"], ["portre", "Portre"], ["teknoloji", "Teknoloji"], ["soyut", "Soyut"]];

/** Öğenin en-boy oranına en yakın desteklenen oran. */
function oranBul(w?: number, h?: number): string {
  if (!w || !h) return "16:9";
  const r = w / h;
  const l: [string, number][] = [["1:1", 1], ["4:3", 4 / 3], ["16:9", 16 / 9], ["3:4", 3 / 4], ["9:16", 9 / 16]];
  return l.reduce((a, b) => (Math.abs(b[1] - r) < Math.abs(a[1] - r) ? b : a))[0];
}

/**
 * Önizlemede seçilen görseli değiştirir (kaynağa doğrudan yazılır, ajan turu gerekmez):
 * yapay zekâyla üret, Vayra kitaplığından seç ya da adres yapıştır. Seçilen aday beyaz çerçeveyle gösterilir.
 */
export function GorselDegistirici({ projeId, mevcut, ipucu, kutu, uygula }: { projeId: string; mevcut: string; ipucu: string; kutu?: { w: number; h: number }; uygula: (src: string) => Promise<boolean> }) {
  const [sekme, setSekme] = useState<"uret" | "kitaplik" | "adres">("uret");
  const [istem, setIstem] = useState(ipucu);
  const [aday, setAday] = useState<string | null>(null);
  const [uretilenler, setUretilenler] = useState<string[]>([]);
  const [ara, setAra] = useState("");
  const [adres, setAdres] = useState("");
  const [durum, setDurum] = useState<"" | "uretiliyor" | "uygulaniyor" | "tamam">("");
  const [hata, setHata] = useState("");
  const oran = oranBul(kutu?.w, kutu?.h);
  const [tema, setTema] = useState("");
  const kitaplik = useMemo(() => {
    const q = katla(ara.trim());
    const kelimeler = q ? [q, ...(SOZLUK[q] ?? Object.entries(SOZLUK).filter(([k]) => k.startsWith(q) && q.length >= 3).flatMap(([, v]) => v))] : [];
    return MEDYA_HAVUZU.filter((o) => (!tema || o.tema === tema) && (!q || kelimeler.some((w) => o.baslik.toLowerCase().includes(w) || o.tema === w))).slice(0, 48).map((o) => o.poster);
  }, [ara, tema]);
  const uret = async () => {
    setDurum("uretiliyor"); setHata("");
    try { const v = await api<{ url: string }>(`/api/build/ai/${projeId}/gorsel`, { govde: { istem, oran } }); setUretilenler((l) => [v.url, ...l].slice(0, 6)); setAday(v.url); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Görsel üretilemedi."); }
    finally { setDurum(""); }
  };
  const kaydet = async () => {
    const src = sekme === "adres" ? adres.trim() : aday;
    if (!src) return;
    setDurum("uygulaniyor"); setHata("");
    const ok = await uygula(src).catch(() => false);
    setDurum(ok ? "tamam" : ""); if (!ok) setHata("Bu görsel kaynağa yazılamadı; sayfa açıldıktan sonra kodla oluşuyor olabilir. Ajana yaptırabilirsin.");
    if (ok) setTimeout(() => setDurum(""), 1500);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={aday ?? mevcut} alt="" className="h-14 w-20 shrink-0 rounded-[10px] bg-white/[0.05] object-cover ring-1 ring-inset ring-white/[0.08]" />
        <p className="min-w-0 text-[12px] leading-snug text-white/50">{aday ? "Yeni görsel seçildi; uygulayınca kaydedilir." : "Görseli değiştir; kaynağa doğrudan yazılır."}</p>
      </div>
      <Secici id="gorsel-sekme" kucuk deger={sekme} set={(v) => { setSekme(v); setHata(""); }} l={[{ id: "uret", ad: "Üret" }, { id: "kitaplik", ad: "Kitaplık" }, { id: "adres", ad: "Adres" }]} />
      {sekme === "uret" && (
        <div className="space-y-2">
          <textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={3} placeholder="Ne görünsün? Işık, ortam, renkler" className="w-full resize-none rounded-[12px] bg-white/[0.05] px-3 py-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/30" />
          <button type="button" onClick={uret} disabled={!istem.trim() || durum === "uretiliyor"} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-40">{durum === "uretiliyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" />}{durum === "uretiliyor" ? "Üretiliyor" : `Üret, oran ${oran}`}</button>
          {uretilenler.length > 0 && <div className="grid grid-cols-3 gap-1.5">{uretilenler.map((u) => <button key={u} type="button" onClick={() => setAday(u)} className={cn("overflow-hidden rounded-[9px] ring-inset", aday === u ? "ring-2 ring-white" : "ring-1 ring-white/[0.08]")}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt="" className="aspect-square w-full object-cover" /></button>)}</div>}
        </div>
      )}
      {sekme === "kitaplik" && (
        <div className="space-y-2">
          <label className="relative block"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Kahve, deniz, şehir" className="h-8 w-full rounded-[10px] bg-white/[0.05] pl-8 pr-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/30" /></label>
          <div className="flex flex-wrap gap-1">{TEMALAR.map(([id, ad]) => <button key={id || "hepsi"} type="button" onClick={() => setTema(id)} className={cn("h-7 rounded-full px-2.5 text-[11.5px] transition-colors", tema === id ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/70" : "bg-white/[0.04] text-white/55 hover:text-white")}>{ad}</button>)}</div>
          <div className="grid max-h-[220px] grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
            {kitaplik.map((u) => <button key={u} type="button" onClick={() => setAday(u)} className={cn("overflow-hidden rounded-[9px] ring-inset", aday === u ? "ring-2 ring-white" : "ring-1 ring-white/[0.08] hover:ring-white/40")}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u} alt="" loading="lazy" className="aspect-square w-full object-cover" /></button>)}
            {!kitaplik.length && <p className="col-span-3 py-4 text-center text-[12px] text-white/45">Eşleşen görsel yok</p>}
          </div>
        </div>
      )}
      {sekme === "adres" && (
        <label className="relative block"><Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="https://…/gorsel.jpg" className="h-9 w-full rounded-[10px] bg-white/[0.05] pl-8 pr-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/30" /></label>
      )}
      {hata && <p className="text-[12px] leading-snug text-amber-200/85">{hata}</p>}
      <button type="button" onClick={kaydet} disabled={durum === "uygulaniyor" || (sekme === "adres" ? !/^(https?:\/\/|\/)/.test(adres.trim()) : !aday)} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black disabled:opacity-35">
        {durum === "uygulaniyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}{durum === "tamam" ? "Değiştirildi" : "Görseli değiştir"}
      </button>
    </div>
  );
}
