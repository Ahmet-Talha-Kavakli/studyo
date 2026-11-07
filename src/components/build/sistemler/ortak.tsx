"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AppWindow, Archive, Store, Zap, Bot, ChartColumn, BrainCircuit, Braces, ChevronRight, ClipboardList, Columns3, CreditCard, Clock3, Code2, Database, FileInput, Filter, FlaskConical, Globe2, Hand, Hourglass, ImageIcon, Inbox, Mail, MessagesSquare, Plug, Repeat, Replace, Reply, Rss, ScrollText, ShieldCheck, Split, SquareFunction, UserCheck, Webhook, Workflow, X } from "lucide-react";
import type { Adim, AdimTuru, Tetikleyici } from "@/lib/build/sistemKatalog";
import { GUVENLIK_DENETIMLERI, SURE_BIRIMLERI, VAYRA_ARACLARI, VERI_ISLECLERI, VERI_ISLEMLERI, VERI_OLAYLARI, adimTuruAdi, kosulCumlesi, veriIslemi, zamanMetni } from "@/lib/build/sistemKatalog";
import { ISLETME_OLAYLARI, kancaImzaBul, servisOlayBul } from "@/lib/build/sistemTetikKatalog";
import { DONUSTUR_ISLEMLERI } from "@/lib/build/sistemDonustur";
import { eylemBul, uygulamaBul } from "@/lib/build/sistemUygulama";
import type { AdimSonucu, Calisma, CalismaDurum, CalismaOzeti, Sistem, Surum } from "@/lib/build/sistemDepo";
import { cn } from "@/lib/utils";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";

export type { Adim, AdimSonucu, Calisma, CalismaDurum, CalismaOzeti, Surum };
export type SistemAcik = Omit<Sistem, "webhookOzeti">;

/** Tetik ve çalışma kaynağı simgeleri (çalışmalarda deneme, sistem çağrısı, API ve MCP de görünür). */
export const TETIK_IKON: Record<string, typeof Clock3> = { elle: Hand, zaman: Clock3, webhook: Webhook, form: FileInput, veri: Database, sistem: Workflow, rss: Rss, eposta: Mail, odeme: CreditCard, formSayfasi: ClipboardList, sohbet: MessagesSquare, servis: Zap, isletme: Store, deneme: FlaskConical, cagri: SquareFunction, api: Braces, mcp: Plug };
export const TETIK_ADI: Record<string, string> = { elle: "Elle", zaman: "Zamanlı", webhook: "Web kancası", form: "Site formu", veri: "Veri tablosu", sistem: "Başka sistem", rss: "RSS akışı", eposta: "Gelen e-posta", odeme: "Ödeme alındı", formSayfasi: "Form sayfası", sohbet: "Sohbet", servis: "Servis olayı", isletme: "İşletme olayı", deneme: "Deneme", cagri: "Sistem çağrısı", api: "API", mcp: "MCP aracı" };
export const ADIM_IKON: Record<AdimTuru, typeof Clock3> = {
  ajan: Bot, siniflandir: BrainCircuit, arac: ImageIcon, baglanti: Plug, http: Globe2, veri: Database, kosul: Filter,
  yonlendirici: Split, dongu: Repeat, bekle: Hourglass, onay: UserCheck, kod: Code2, donustur: Replace, cagir: SquareFunction, guvenlik: ShieldCheck, yanit: Reply, paralel: Columns3, depo: Archive, uygulama: AppWindow,
};

export function tetikOzeti(t: Tetikleyici): string {
  switch (t.tur) {
    case "elle": return t.form ? "Elle, girdi formuyla" : "Elle çalıştırılır";
    case "zaman": return zamanMetni(t.zaman);
    case "webhook": { const im = t.imza ? kancaImzaBul(t.imza)?.ad : undefined; return `${t.anahtarSonu ? `Web kancası, adresin sonu ${t.anahtarSonu}` : "Web kancası"}${im ? `, ${im} imzalı` : ""}`; }
    case "servis": { const o = servisOlayBul(t.olay); return o ? `${o.ad}, ${t.aralik} dakikada bir yoklanır` : "Servis olayı (seçilmedi)"; }
    case "isletme": { const o = ISLETME_OLAYLARI.find((x) => x.id === t.olay); return t.projeId ? `İşletme: ${(o?.ad ?? "olay").toLocaleLowerCase("tr")}` : "İşletme olayı (proje seçilmedi)"; }
    case "form": return t.projeId ? "Site formu gönderilince" : "Site formu (proje seçilmedi)";
    case "veri": { const o = (t.olaylar?.length ? t.olaylar : ["ekle"]).map((x) => VERI_OLAYLARI.find((y) => y.id === x)?.ad.toLocaleLowerCase("tr") ?? x); return t.koleksiyon ? `"${t.koleksiyon}" tablosunda kayıt ${o.length > 1 ? `${o.slice(0, -1).join(", ")} ya da ${o.at(-1)}` : o[0]}` : "Veri tablosu (tablo seçilmedi)"; }
    case "sistem": return t.sistemId ? "Başka bir sistem bitince" : "Başka sistem (seçilmedi)";
    case "rss": { let h = ""; try { h = t.adres ? new URL(t.adres).hostname.replace(/^www\./, "") : ""; } catch { h = t.adres; } return h ? `${h} akışında yeni öğe, ${t.aralik} dakikada bir` : "RSS (adres yazılmadı)"; }
    case "odeme": { const d = (t.durumlar?.length ? t.durumlar : ["odendi"]).map((x) => ({ odendi: "ödenince", iade: "iade edilince", basarisiz: "reddedilince" }[x])); return t.projeId ? `Sipariş ${d.length > 1 ? `${d.slice(0, -1).join(", ")} ya da ${d.at(-1)}` : d[0]}${t.test ? ", test dahil" : ""}` : "Ödeme (proje seçilmedi)"; }
    case "formSayfasi": return t.bitis === "sonuc" ? "Form doldurulunca, yanıtı formda gösterir" : t.bitis === "yonlendir" ? "Form doldurulunca, sonra başka sayfaya gider" : "Herkese açık form doldurulunca";
    case "sohbet": return t.baslik ? `${t.baslik} sohbetine mesaj gelince` : "Sohbet sayfasına ya da kutuya mesaj gelince";
    case "eposta": return t.gonderen ? `Gelen e-posta, yalnız ${t.gonderen.split(/[,\s]+/).filter(Boolean).length} gönderenden` : "Sisteme özel adrese e-posta gelince";
  }
}

/** Şablon göndermelerini kısa okunur yapar: {{adim.x.ozet}} yerine "ozet". */
export const sablonSade = (s: string) => s.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, i0: string) => { const i = i0.split("|")[0].trim(); const p = i.split("."); return p[0] === "adim" ? p.slice(2).join(".") || "çıktı" : p[0] === "tetik" ? p.slice(1).join(".") || "tetik verisi" : p.join("."); });
export function adimOzeti(a: Adim, ad: { ajan?: (id: string) => string | undefined; baglanti?: (id: string) => string | undefined; sistem?: (id: string) => string | undefined } = {}): string {
  const x = a.ayar as Record<string, string>;
  const k = (s?: string) => sablonSade(String(s ?? "")).replace(/\s+/g, " ").trim();
  switch (a.tur) {
    case "ajan": return `${x.ajanId ? ad.ajan?.(x.ajanId) ?? "Ajan" : "Vayra"}: ${k(x.istem) || "görev yazılmadı"}${a.alanlar?.length ? ` · ${a.alanlar.length} alan` : ""}`;
    case "arac": return `${VAYRA_ARACLARI.find((y) => y.id === x.arac)?.ad ?? "Araç"}: ${k(x.istem || x.metin) || "istem yok"}`;
    case "baglanti": { const b = x.baglantiId ? ad.baglanti?.(x.baglantiId) : undefined; return b ? `${b} · ${x.arac || "araç seçilmedi"}` : "Bağlantı seçilmedi"; }
    case "http": return `${x.yontem || "POST"} ${x.url || "adres yok"}`;
    case "kosul": { const l = a.kosullar ?? []; return l.length ? l.map((z) => kosulCumlesi(k(z.sol), z.islec, k(z.sag))).join(a.baglac === "veya" ? " ya da " : " ve ") : "Koşul yok"; }
    case "veri": {
      const i = veriIslemi(a), t = x.koleksiyon || "tablo seçilmedi";
      const sz = (a.kosullar ?? []).filter((z) => z.sol.trim());
      const kosul = sz.length ? `, ${sz.map((z) => `${z.sol} ${VERI_ISLECLERI.find((y) => y.id === z.islec)?.ad ?? z.islec}${VERI_ISLECLERI.find((y) => y.id === z.islec)?.tek ? "" : ` ${k(z.sag) || "boş"}`}`).join(" ve ")}` : "";
      const ad = VERI_ISLEMLERI.find((y) => y.id === i)?.ad ?? "Kayıt ekle";
      if (i === "ekle") return `${t} tablosuna kayıt ekler`;
      if (i === "getir") return `${t}: ${k(x.kayitId) || "kimlik"} kimlikli kayıt`;
      if (i === "upsert") return `${t}: ${x.eslesme || "alan"} eşleşirse günceller, yoksa ekler`;
      if ((i === "guncelle" || i === "sil") && x.hedef !== "suzgec") return `${t}: ${k(x.kayitId) || "kimlik"} kimlikli kaydı ${i === "sil" ? "siler" : "günceller"}`;
      return `${ad}: ${t}${kosul}`;
    }
    case "cagir": return `${x.sistemId ? ad.sistem?.(x.sistemId) ?? "Sistem" : "Sistem seçilmedi"} · ${x.mod === "baslat" ? "başlatıp devam eder" : "bitmesini bekler"}`;
    case "guvenlik": { const l = GUVENLIK_DENETIMLERI.filter((g) => (a.ayar as Record<string, unknown>)[g.id] === true).length + (x.ozelDesen ? 1 : 0); return `${l} denetim · ${x.mod === "engelle" ? "engeller" : "maskeler"}${k(x.metin) ? `: ${k(x.metin)}` : ""}`; }
    case "bekle": return x.mod === "tarih" ? `${k(x.tarih) || "tarih seçilmedi"} zamanına kadar` : x.mod === "webhook" ? "Devam adresine istek gelene kadar" : `${Number(x.miktar) || 0} ${SURE_BIRIMLERI.find((b) => b.id === x.birim)?.ad ?? "saniye"}`;
    case "yonlendirici": return `${(a.dallar ?? []).filter((d) => !d.yedek).length} dal, ${x.mod === "hepsi" ? "uyan her dal" : "ilk uyan dal"}`;
    case "siniflandir": return `${k(x.girdi) || "metin seçilmedi"} · ${(a.dallar ?? []).filter((d) => !d.yedek).length} dal`;
    case "dongu": return `${k(x.liste) || "liste seçilmedi"} · her öğe için`;
    case "onay": return k(x.baslik) || k(x.icerik) || "Onay içeriği yazılmadı";
    case "kod": return `${String(x.kod ?? "").split("\n").filter((l) => l.trim() && !l.trim().startsWith("//")).length} satır JavaScript`;
    case "donustur": { const g = (x.grup || "metin") as keyof typeof DONUSTUR_ISLEMLERI; const i = DONUSTUR_ISLEMLERI[g]?.find((y) => y.id === x.islem); return `${i?.ad ?? "Dönüştür"}${x.islem === "ayarla" ? "" : `: ${k(x.deger) || "değer seçilmedi"}`}`; }
    case "yanit": return `${x.bicim === "json" ? "JSON" : x.bicim === "html" ? "HTML" : "Metin"} yanıt${Number(x.durum) && Number(x.durum) !== 200 ? `, durum ${x.durum}` : ""}: ${k(x.icerik) || "içerik yazılmadı"}`;
    case "paralel": return `${(a.dallar ?? []).length} dal aynı anda, sonra ${x.birlestir === "liste" ? "liste olarak" : "dal adlarıyla"} birleşir`;
    case "depo": { const ad: Record<string, string> = { yaz: "Yaz", oku: "Oku", artir: "Artır", ekle: "Listeye ekle", cek: "Listeden çek", sil: "Sil", goruldu: "Tekrar mı" }; return `${ad[x.islem] ?? "Yaz"}: ${k(x.anahtar) || "anahtar yazılmadı"}${x.kapsam === "hesap" ? ", hesap geneli" : ""}`; }
    case "uygulama": { const u = uygulamaBul(x.servis), e = eylemBul(u, x.eylem); return u ? `${u.ad} · ${e?.ad ?? "eylem seçilmedi"}` : "Servis seçilmedi"; }
  }
}
export { adimTuruAdi };

export const DURUM_SINIF: Record<SistemAcik["durum"], { ad: string; sinif: string }> = {
  acik: { ad: "Açık", sinif: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" },
  taslak: { ad: "Kapalı", sinif: "bg-white/[0.07] text-white/60" },
  duraklatildi: { ad: "Duraklatıldı", sinif: "bg-amber-400/[0.12] text-amber-200" },
};
export const CALISMA_SINIF: Record<CalismaDurum, { ad: string; nokta: string; hap: string }> = {
  kuyrukta: { ad: "Kuyrukta", nokta: "bg-violet-300", hap: "bg-violet-400/[0.12] text-violet-200" },
  calisiyor: { ad: "Çalışıyor", nokta: "bg-[#55d6fd] animate-pulse", hap: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" },
  bekliyor: { ad: "Bekliyor", nokta: "bg-amber-300", hap: "bg-amber-400/[0.12] text-amber-200" },
  basarili: { ad: "Başarılı", nokta: "bg-emerald-400", hap: "bg-emerald-400/[0.12] text-emerald-200" },
  basarisiz: { ad: "Başarısız", nokta: "bg-rose-400", hap: "bg-rose-500/[0.12] text-rose-200" },
  durdu: { ad: "Durdu", nokta: "bg-white/40", hap: "bg-white/[0.07] text-white/65" },
  iptal: { ad: "İptal", nokta: "bg-white/30", hap: "bg-white/[0.07] text-white/55" },
};
export const ADIM_DURUM: Record<AdimSonucu["durum"], { ad: string; nokta: string; metin: string }> = {
  basarili: { ad: "Tamam", nokta: "bg-emerald-400", metin: "text-emerald-300" },
  basarisiz: { ad: "Hata", nokta: "bg-rose-400", metin: "text-rose-300" },
  atlandi: { ad: "Atlandı", nokta: "bg-white/35", metin: "text-white/50" },
  calisiyor: { ad: "Çalışıyor", nokta: "bg-[#55d6fd] animate-pulse", metin: "text-[#8be6ff]" },
  bekliyor: { ad: "Bekliyor", nokta: "bg-amber-300", metin: "text-amber-200" },
};
export const BEKLEME_ADI: Record<string, string> = { sure: "Süre bekleniyor", tarih: "Tarih bekleniyor", webhook: "Dış çağrı bekleniyor", onay: "Onay bekleniyor", tekrar: "Yeniden deneme bekleniyor", alt: "Çağrılan sistem bekleniyor" };

export const sureYaz = (ms: number) => (ms < 1000 ? `${ms} ms` : ms < 60_000 ? `${(ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn` : ms < 3_600_000 ? `${Math.floor(ms / 60_000)} dk ${Math.round((ms % 60_000) / 1000)} sn` : ms < 86_400_000 ? `${Math.floor(ms / 3_600_000)} sa ${Math.round((ms % 3_600_000) / 60_000)} dk` : `${Math.floor(ms / 86_400_000)} gün ${Math.round((ms % 86_400_000) / 3_600_000)} sa`);
export const tarihSaat = (t: number, gun = true) => new Date(t).toLocaleString("tr-TR", { ...(gun ? { day: "numeric", month: "short" } : {}), hour: "2-digit", minute: "2-digit" });
export const yay = { type: "spring" as const, stiffness: 420, damping: 40 };

/** Sağdan açılan panel (Veritabanı YanPanel deseni; sayfa geneli, portal). */
export function YanPanel({ acik, kapat, baslik, alt, children, alt2, genislik = 480 }: { acik: boolean; kapat: () => void; baslik: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode; alt2?: React.ReactNode; genislik?: number }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => { if (!acik) return; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [acik, kapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="fixed inset-0 z-[110] bg-black/40" />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={yay} style={{ width: genislik }} role="dialog" aria-modal="true"
            className="bd-panel fixed inset-y-0 right-0 z-[111] flex max-w-full flex-col sm:rounded-l-[20px]">
            <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold text-white">{baslik}</div>{alt && <div className="mt-0.5 text-[12.5px] text-white/50">{alt}</div>}</div>
              <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">{children}</div>
            {alt2 && <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-3">{alt2}</footer>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ───── JSON görünümü (Girdi / Çıktı) ───── */
function Deger({ v }: { v: unknown }) {
  if (v === null || v === undefined) return <span className="text-white/35">boş</span>;
  if (typeof v === "string") return <span className="whitespace-pre-wrap break-words text-white/85">{v.length > 600 ? `${v.slice(0, 600)}…` : v || <span className="text-white/35">boş metin</span>}</span>;
  if (typeof v === "number") return <span className="text-amber-200/90">{v.toLocaleString("tr-TR")}</span>;
  if (typeof v === "boolean") return <span className="text-violet-200">{v ? "doğru" : "yanlış"}</span>;
  return null;
}
function Dugum({ ad, v, derinlik }: { ad: string; v: unknown; derinlik: number }) {
  const [acik, setAcik] = useState(derinlik < 2);
  const kap = v !== null && typeof v === "object";
  const l = kap ? (Array.isArray(v) ? v.map((x, i) => [String(i), x] as const) : Object.entries(v as object)) : [];
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-start gap-1.5 py-[3px]">
        {kap ? <button type="button" onClick={() => setAcik(!acik)} className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded text-white/45 hover:bg-white/[0.08]"><ChevronRight className={cn("h-3 w-3 transition-transform", acik && "rotate-90")} /></button> : <span className="w-4 shrink-0" />}
        <span className="shrink-0 text-white/50">{ad}</span>
        {kap ? <span className="text-white/35">{Array.isArray(v) ? `${l.length} öğe` : `${l.length} alan`}</span> : <span className="min-w-0"><Deger v={v} /></span>}
      </div>
      {kap && acik && <div className="ml-[7px] border-l border-white/[0.07] pl-2.5">{l.slice(0, 100).map(([k, x]) => <Dugum key={k} ad={k} v={x} derinlik={derinlik + 1} />)}{l.length > 100 && <p className="py-1 text-white/35">{l.length - 100} öğe daha</p>}</div>}
    </div>
  );
}
export function JsonGorunum({ v, bos = "Veri yok", id }: { v: unknown; bos?: string; id: string }) {
  const [mod, setMod] = useState<"agac" | "json">("agac");
  if (v === undefined) return <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-3 text-[12.5px] text-white/45 ring-1 ring-inset ring-white/[0.06]">{bos}</p>;
  const kap = v !== null && typeof v === "object";
  return (
    <div className="overflow-hidden rounded-[14px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.07]">
      {kap && (
        <div className="flex items-center justify-end border-b border-white/[0.06] px-2 py-1.5">
          <LayoutGroup id={`json-${id}`}>
            <div className="flex rounded-full bg-white/[0.06] p-0.5">
              {(["agac", "json"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMod(m)} className={cn("relative h-6 rounded-full px-2.5 text-[11.5px] font-medium", mod === m ? "text-black" : "text-white/55 hover:text-white")}>
                  {mod === m && <motion.span layoutId={`json-${id}-z`} transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                  <span className="relative">{m === "agac" ? "Ağaç" : "JSON"}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </div>
      )}
      <div className="max-h-[360px] overflow-auto p-3 text-[12px] leading-relaxed [scrollbar-width:thin]">
        {!kap ? <Deger v={v} /> : mod === "json" ? <pre className="sc-kod whitespace-pre-wrap break-words text-[11.5px] text-white/80">{JSON.stringify(v, null, 2).slice(0, 40_000)}</pre>
          : (Array.isArray(v) ? v.map((x, i) => [String(i), x] as const) : Object.entries(v as object)).slice(0, 200).map(([k, x]) => <Dugum key={k} ad={k} v={x} derinlik={0} />)}
      </div>
    </div>
  );
}

/* ───── Sistemler bölümü gezinmesi ───── */
export function SistemSekmeleri({ sayilar }: { sayilar?: { onay?: number; hata?: number } }) {
  const yol = usePathname();
  const aktif = yol.startsWith("/panel/build/sistemler/calismalar") ? "calismalar" : yol.startsWith("/panel/build/sistemler/onaylar") ? "onaylar" : yol.startsWith("/panel/build/sistemler/icgoruler") ? "icgoruler" : "sistemler";
  const l = [
    { id: "sistemler", ad: "Sistemler", href: "/panel/build/sistemler", ikon: Workflow },
    { id: "calismalar", ad: "Çalışmalar", href: "/panel/build/sistemler/calismalar", ikon: ScrollText, sayi: sayilar?.hata, sayiSinif: "bg-rose-500/[0.16] text-rose-200" },
    { id: "onaylar", ad: "Onaylar", href: "/panel/build/sistemler/onaylar", ikon: Inbox, sayi: sayilar?.onay, sayiSinif: "bg-amber-400/[0.16] text-amber-200" },
    { id: "icgoruler", ad: "İçgörüler", href: "/panel/build/sistemler/icgoruler", ikon: ChartColumn },
  ];
  return (
    <LayoutGroup id="sistem-sekme">
      <nav className="flex w-full gap-1 overflow-x-auto rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:none] sm:w-fit">
        {l.map((x) => { const I = x.ikon; const on = aktif === x.id; return (
          <Link key={x.id} href={x.href} className={cn("relative flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-medium transition-colors sm:flex-none sm:px-3.5", on ? "text-black" : "text-white/65 hover:text-white")}>
            {on && <motion.span layoutId="sistem-sekme-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
            <I className="relative h-4 w-4 max-[420px]:hidden" /><span className="relative">{x.ad}</span>
            {!!x.sayi && <span className={cn("relative rounded-full px-1.5 py-px text-[11px] tabular-nums", on ? "bg-black/10 text-black" : x.sayiSinif)}>{x.sayi}</span>}
          </Link>
        ); })}
      </nav>
    </LayoutGroup>
  );
}

/** Kayan seçici, içeriği kadar genişlikte (panelde tam satıra yayılmasın). */
export function Segment<T extends string>(p: React.ComponentProps<typeof Secici<T>>) {
  return <div className="flex max-w-full overflow-x-auto [scrollbar-width:none]"><Secici {...p} /></div>;
}

/* ───── Adım panosu (kopyala ve yapıştır; sistemler ve sekmeler arasında) ───── */
const PANO = "vayra-sistem-pano";
export function panoyaKopyala(a: Adim) {
  try { localStorage.setItem(PANO, JSON.stringify({ zaman: Date.now(), adim: a })); dispatchEvent(new Event("vayra-sistem-pano")); } catch { /* gizli sekme */ }
  navigator.clipboard?.writeText(JSON.stringify({ vayraAdim: a }, null, 2)).catch(() => {});
}
export function panoOku(): Adim | null {
  try { const v = JSON.parse(localStorage.getItem(PANO) ?? "null") as { adim?: Adim } | null; return v?.adim && typeof v.adim === "object" && v.adim.tur ? v.adim : null; } catch { return null; }
}
/** Panodaki adım (değişince yeniden çizer). */
export function usePano(): Adim | null {
  const [a, setA] = useState<Adim | null>(null);
  useEffect(() => { const f = () => setA(panoOku()); f(); addEventListener("vayra-sistem-pano", f); addEventListener("storage", f); return () => { removeEventListener("vayra-sistem-pano", f); removeEventListener("storage", f); }; }, []);
  return a;
}

/** Kopyala düğmesi (kopyalanınca kısa süre onay simgesi). */
export function useKopya() {
  const [k, setK] = useState("");
  const kopyala = (v: string, ad: string) => { navigator.clipboard?.writeText(v).catch(() => {}); setK(ad); setTimeout(() => setK((x) => (x === ad ? "" : x)), 1300); };
  return { kopya: k, kopyala };
}
