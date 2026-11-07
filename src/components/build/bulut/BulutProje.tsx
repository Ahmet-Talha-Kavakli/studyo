"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGroup, motion } from "framer-motion";
import {
  Archive, Boxes, GitBranch, ListChecks, AlertTriangle, ArrowLeft, BrickWall, Clapperboard, Gauge, BarChart3, Braces, Code2, CreditCard, Database, ExternalLink, FolderOpen, Globe, HardDrive, KeyRound, LayoutDashboard, Inbox, Loader2, Radio, RotateCcw, Rocket, ScrollText, Shield, ShieldCheck, Sparkles, Users, Eye, Activity, CalendarClock, TerminalSquare, History } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { useProje } from "@/components/build/calisma/useProje";
import { Veritabani } from "@/components/build/calisma/Veritabani";
import { Uyeler } from "@/components/build/calisma/Uyeler";
import { Analitik } from "@/components/build/calisma/Analitik";
import { AlanAdlari } from "@/components/build/calisma/AlanAdlari";
import { Sirlar } from "@/components/build/calisma/AyarlarSekme";
import { api, ApiHatasi, gorece, yayinAdresi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { boyutYaz, Durum, sayi, type BulutOzeti } from "./BulutGenel";
import { Fonksiyonlar } from "./Fonksiyonlar";
import { YapayZeka } from "./YapayZeka";
import { GuvenlikTaramasi } from "./Guvenlik";
import { Gunlukler } from "./Gunlukler";
import { BildirimKutusu } from "./Bildirimler";
import { Kullanim } from "./Kullanim";
import { GuvenlikDuvari } from "./GuvenlikDuvari";
import { Odemeler } from "./Odemeler";
import { Oturumlar } from "./Oturumlar";
import { Zamanlanmis } from "./Zamanlanmis";
import { GercekZamanli } from "./GercekZamanli";
import { Performans } from "./Performans";
import { SorguKonsolu } from "./SorguKonsolu";
import { Denetim } from "./Denetim";
import { Dosyalar } from "./Dosyalar";
import { Ortamlar } from "./Ortamlar";
import { Yedekler } from "./Yedekler";
import { Kuyruk } from "./Kuyruk";
import { Odalar } from "./Odalar";
import { useRouter } from "next/navigation";
import { GelenKutusu } from "@/components/build/calisma/VerilerSekme";
import type { ProjeKanca } from "@/components/build/calisma/useProje";

export type BulutBolum = "genel" | "yayinlar" | "gunluk" | "performans" | "veritabani" | "ortamlar" | "yedekler" | "sorgu" | "canli" | "odalar" | "kimlik" | "gelen" | "dosyalar" | "fonksiyonlar" | "zamanli" | "kuyruk" | "ai" | "odemeler" | "alan" | "ortam" | "analitik" | "oturumlar" | "guvenlik" | "kullanim" | "duvar" | "denetim";
type Bolum = BulutBolum;
const BOLUMLER: { id: Bolum; ad: string; I: typeof Globe }[] = [
  { id: "genel", ad: "Genel bakış", I: LayoutDashboard }, { id: "yayinlar", ad: "Yayınlar", I: Rocket }, { id: "gunluk", ad: "Günlükler", I: ScrollText }, { id: "performans", ad: "Performans", I: Activity },
  { id: "veritabani", ad: "Veritabanı", I: Database }, { id: "ortamlar", ad: "Ortamlar ve dallar", I: GitBranch }, { id: "yedekler", ad: "Yedekler", I: Archive }, { id: "sorgu", ad: "Sorgu konsolu", I: TerminalSquare }, { id: "canli", ad: "Gerçek zamanlı", I: Radio }, { id: "odalar", ad: "Odalar", I: Boxes }, { id: "kimlik", ad: "Kimlik", I: Users }, { id: "gelen", ad: "Gelen kutusu", I: Inbox }, { id: "dosyalar", ad: "Dosyalar", I: HardDrive }, { id: "fonksiyonlar", ad: "Fonksiyonlar", I: Braces }, { id: "zamanli", ad: "Zamanlanmış", I: CalendarClock }, { id: "kuyruk", ad: "Kuyruk", I: ListChecks }, { id: "ai", ad: "Yapay zekâ", I: Sparkles }, { id: "odemeler", ad: "Ödemeler", I: CreditCard },
  { id: "alan", ad: "Alan adları", I: Globe }, { id: "ortam", ad: "Ortam ve sırlar", I: KeyRound }, { id: "analitik", ad: "Analitik", I: BarChart3 }, { id: "oturumlar", ad: "Oturumlar", I: Clapperboard }, { id: "kullanim", ad: "Kullanım", I: Gauge }, { id: "guvenlik", ad: "Güvenlik", I: Shield }, { id: "duvar", ad: "Güvenlik duvarı", I: BrickWall }, { id: "denetim", ad: "Denetim günlüğü", I: History },
];
type Bulgu = { seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; yer: "veri" | "dosyalar" | "kod" | "alan" | "yayin" | "ortam" };
type Konsol = { ozet: BulutOzeti; guvenlik: Bulgu[]; olaylar: Gunluk[]; yayinGecmisi: { surumId: string; surumNo: number; zaman: number; olay: "yayin" | "geri" | "kaldir" }[]; surumler: { id: string; no: number; zaman: number; aciklama: string; kaynak: string; degisen: number; ekle: number; sil: number }[] };
type Gunluk = { z: number; t: string; d?: number; y?: string; ms?: number; m?: string; c?: string; k?: string };
const SEVIYE = { kritik: { ad: "Kritik", sinif: "bg-rose-500/[0.12] text-rose-200", nokta: "bg-rose-400" }, uyari: { ad: "Uyarı", sinif: "bg-amber-400/[0.12] text-amber-200", nokta: "bg-amber-300" }, bilgi: { ad: "Bilgi", sinif: "bg-white/[0.07] text-white/60", nokta: "bg-white/40" } };
const TUR_AD: Record<string, string> = { istek: "İstek", yayin: "Yayın", veri: "Veri", uye: "Üyelik", form: "Form", dosya: "Dosya", fonksiyon: "Fonksiyon", sistem: "Sistem", hata: "Hata" };

/* ───── Genel bakış ───── */
function GenelBakis({ c, yayinla, git, gomulu, bildirimGit, bildirimSayac }: { c: Konsol; yayinla: (surumId?: string) => Promise<void>; git: (b: Bolum) => void; gomulu?: boolean; bildirimGit: (bolum: string, sorgu?: string) => void; bildirimSayac: (n: number) => void }) {
  const o = c.ozet;
  const adres = yayinAdresi(o.altAlan);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const onceki = c.yayinGecmisi.find((y) => y.olay !== "kaldir" && y.surumId !== o.yayin?.surumId);
  const sayac = { kritik: c.guvenlik.filter((b) => b.seviye === "kritik").length, uyari: c.guvenlik.filter((b) => b.seviye === "uyari").length };
  const en = Math.max(1, ...o.gunler.map((g) => g.istek));
  return (
    <div className="space-y-4">
      <Kart ikon={Rocket} baslik="Canlı sürüm" alt={o.yayin ? `Sürüm ${o.yayin.surumNo} · ${gorece(o.yayin.zaman)} yayınlandı` : "Proje henüz yayında değil"} sag={<Durum o={o} />}>
        <div className="flex gap-4 p-4 max-sm:flex-col sm:p-5">
          <a href={o.yayin ? adres.tam : undefined} target="_blank" rel="noopener noreferrer" className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[14px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] sm:w-[300px]">
            {o.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={o.kapak} alt="" className="h-full w-full object-cover object-top" />}
          </a>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[12px] text-white/45">Adresler</p>
              <a href={adres.tam} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex items-center gap-1.5 truncate text-[14px] font-medium text-white hover:underline">{adres.gorunen}<ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/45" /></a>
              {o.alanAdlari.map((a) => <p key={a.ad} className="mt-1 flex items-center gap-2 text-[13px] text-white/70">{a.ad}<span className={cn("rounded-full px-2 py-0.5 text-[11px]", a.durum === "bagli" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-amber-400/[0.1] text-amber-200")}>{a.durum === "bagli" ? "Bağlı" : "Bekliyor"}</span></p>)}
            </div>
            {o.sonSurum > (o.yayin?.surumNo ?? 0) && <p className="rounded-[12px] bg-white/[0.04] px-3 py-2 text-[12.5px] text-white/65 ring-1 ring-inset ring-white/[0.07]">Son sürüm {o.sonSurum} henüz yayında değil.</p>}
            <div className="flex flex-wrap gap-2">
              {o.sonSurum > (o.yayin?.surumNo ?? 0) && <button type="button" disabled={!!gidiyor} onClick={async () => { setGidiyor("yeni"); await yayinla(); setGidiyor(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">{gidiyor === "yeni" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}Sürüm {o.sonSurum}'i yayınla</button>}
              {o.yayin && onceki && <button type="button" disabled={!!gidiyor} onClick={async () => { setGidiyor("geri"); await yayinla(onceki.surumId); setGidiyor(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white hover:bg-white/[0.13]">{gidiyor === "geri" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}Sürüm {onceki.surumNo}'e geri al</button>}
              {!gomulu && <Link href={`/panel/build/${o.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white hover:bg-white/[0.13]"><Code2 className="h-3.5 w-3.5" />Çalışma alanı</Link>}
            </div>
          </div>
        </div>
      </Kart>
      <BildirimKutusu projeId={o.id} git={bildirimGit} sayac={bildirimSayac} sinir={4} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[["İstek, 7 gün", sayi(o.istek)], ["Sunucu hatası", sayi(o.hata)], ["Ortalama süre", `${o.ortSure} ms`], ["Ziyaretçi", sayi(o.ziyaretci)], ["Veri kaydı", sayi(o.kayit)], ["Depolama", boyutYaz(o.depolama)]].map(([a, b]) => (
          <div key={a} className="rounded-[18px] bg-[#121315] p-4 ring-1 ring-inset ring-white/[0.07]"><p className="text-[20px] font-semibold tabular-nums text-white">{b}</p><p className="text-[12px] text-white/45">{a}</p></div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Kart ikon={BarChart3} baslik="İstekler" alt="Son 7 gün, yayındaki siteye gelen istekler" govde="p-4 sm:p-5">
          <div className="flex h-[140px] items-end gap-2">
            {o.gunler.map((g) => (
              <div key={g.tarih} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[11px] tabular-nums text-white/0 group-hover:text-white/70">{sayi(g.istek)}</span>
                <span className="w-full max-w-[36px] rounded-t-[4px] bg-[#1e9fcf] transition-colors group-hover:bg-[#55d6fd]" style={{ height: `${Math.max(3, (g.istek / en) * 100)}px` }} />
                <span className="text-[11px] text-white/40">{new Date(g.tarih).toLocaleDateString("tr-TR", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </Kart>
        <Kart ikon={Shield} baslik="Güvenlik" alt={c.guvenlik.length ? `${sayac.kritik} kritik, ${sayac.uyari} uyarı` : "Sorun bulunmadı"} sag={<button type="button" onClick={() => git("guvenlik")} className="inline-flex h-9 items-center rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]">Tümü</button>}>
          {c.guvenlik.length ? <div className="divide-y divide-white/[0.05]">{c.guvenlik.slice(0, 4).map((b, i) => <p key={i} className="flex items-start gap-2.5 px-4 py-2.5 text-[13px] sm:px-5"><span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEVIYE[b.seviye].nokta)} /><span className="min-w-0 text-white/80">{b.baslik}</span></p>)}</div>
            : <p className="flex items-center gap-2 px-5 py-4 text-[13px] text-white/60"><ShieldCheck className="h-4 w-4 text-emerald-300" />Erişim kuralları, kovalar ve kodda risk bulunmadı.</p>}
        </Kart>
      </div>
      {c.olaylar.length > 0 && (
        <Kart ikon={ScrollText} baslik="Son olaylar" alt="Yayın, veri, üyelik, form ve dosya olayları" sag={<button type="button" onClick={() => git("gunluk")} className="inline-flex h-9 items-center rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]">Günlükler</button>}>
          <div className="divide-y divide-white/[0.05]">{c.olaylar.map((g, i) => <div key={i} className="flex items-center gap-3 px-4 py-2.5 sm:px-5"><span className="w-[64px] shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-center text-[11px] text-white/60">{TUR_AD[g.t] ?? g.t}</span><span className="min-w-0 flex-1 truncate text-[13px] text-white/80">{g.m}</span><span className="shrink-0 text-[12px] text-white/40">{gorece(g.z)}</span></div>)}</div>
        </Kart>
      )}
    </div>
  );
}

/* ───── Yayınlar ───── */
function Yayinlar({ c, yayinla }: { c: Konsol; yayinla: (surumId?: string) => Promise<void> }) {
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const canli = c.ozet.yayin?.surumId;
  const OLAY = { yayin: "Yayınlandı", geri: "Geri alındı", kaldir: "Yayından kaldırıldı" };
  return (
    <div className="space-y-4">
      <Kart ikon={Rocket} baslik="Yayın geçmişi" alt="Her yayın değişmez bir sürüme işaret eder; herhangi birine anında dönülür">
        {c.yayinGecmisi.length ? <div className="divide-y divide-white/[0.05]">{c.yayinGecmisi.map((y, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span className={cn("flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[12.5px] font-semibold tabular-nums", i === 0 && y.olay !== "kaldir" ? "bg-white text-black" : "bg-white/[0.07] text-white/70")}>{y.surumNo}</span>
            <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{OLAY[y.olay]}{i === 0 && y.olay !== "kaldir" && <span className="ml-2 rounded-full bg-[#55d6fd]/[0.12] px-2 py-0.5 text-[11px] font-medium text-[#8be6ff]">Canlı</span>}</span><span className="block text-[12px] text-white/45">{new Date(y.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span></span>
          </div>
        ))}</div> : <p className="px-5 py-4 text-[13px] text-white/50">Henüz yayın yok.</p>}
      </Kart>
      <Kart ikon={FolderOpen} baslik="Sürümler" alt="Ajan turu ya da elle düzenleme sonrası oluşan sürümler; istediğini yayına al">
        <div className="divide-y divide-white/[0.05]">{c.surumler.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/[0.07] px-2 text-[12.5px] font-semibold tabular-nums text-white/75">{s.no}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{s.aciklama}</span><span className="block text-[12px] text-white/45">{gorece(s.zaman)} · {s.degisen} dosya{s.ekle || s.sil ? ` · ${s.ekle} satır eklendi, ${s.sil} silindi` : ""}</span></span>
            {s.id === canli ? <span className="rounded-full bg-[#55d6fd]/[0.12] px-2.5 py-1 text-[11.5px] font-medium text-[#8be6ff]">Canlı</span>
              : <button type="button" disabled={!!gidiyor} onClick={async () => { setGidiyor(s.id); await yayinla(s.id); setGidiyor(null); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">{gidiyor === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}Yayına al</button>}
          </div>
        ))}</div>
      </Kart>
    </div>
  );
}

/* ───── Güvenlik ───── */
function Guvenlik({ l, git }: { l: Bulgu[]; git: (b: Bolum) => void }) {
  const YER: Record<Bulgu["yer"], { ad: string; b: Bolum }> = { veri: { ad: "Veritabanı", b: "veritabani" }, dosyalar: { ad: "Dosyalar", b: "dosyalar" }, kod: { ad: "Kod", b: "yayinlar" }, alan: { ad: "Alan adları", b: "alan" }, yayin: { ad: "Yayınlar", b: "yayinlar" }, ortam: { ad: "Ortam", b: "ortam" } };
  return (
    <Kart ikon={Shield} baslik="Güvenlik danışmanı" alt="Erişim kuralları, dosya kovaları, koddaki sırlar, alan adları ve ortam değişkenleri denetlenir">
      {!l.length ? <p className="flex items-center gap-2 px-5 py-5 text-[13.5px] text-white/65"><ShieldCheck className="h-5 w-5 text-emerald-300" />Sorun bulunmadı. Yeni tablo, kova ya da yayın ekledikçe denetim yenilenir.</p> : (
        <div className="divide-y divide-white/[0.05]">{l.map((b, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
            <span className={cn("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", SEVIYE[b.seviye].sinif)}>{SEVIYE[b.seviye].ad}</span>
            <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{b.baslik}</span><span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/55">{b.ayrinti}</span></span>
            <button type="button" onClick={() => git(YER[b.yer].b)} className="inline-flex h-8 shrink-0 items-center rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">{YER[b.yer].ad}</button>
          </div>
        ))}</div>
      )}
    </Kart>
  );
}

/**
 * Proje bulut konsolu gövdesi (bölüm menüsü + içerik). Bulut sayfasında tam ekran, çalışma alanında "Bulut" sekmesi
 * olarak gömülü kullanılır. Bölümler: genel bakış, yayınlar, günlükler, veritabanı, kimlik, gelen kutusu, dosyalar,
 * fonksiyonlar, alan adları, ortam ve sırlar, analitik, güvenlik.
 */
export function BulutKonsol({ k, bolum, setBolum, gomulu, okunmamis, hataGoster, ajanaGonder }: { k: ProjeKanca; bolum: Bolum; setBolum: (b: Bolum) => void; gomulu?: boolean; okunmamis?: (n: number) => void; hataGoster?: (m: string) => void; ajanaGonder?: (metin: string) => void }) {
  const p = k.proje!;
  const router = useRouter();
  /** Bulut sayfasında: isteği çalışma alanına taşı (ilk istek olarak gider). */
  const ajana = ajanaGonder ?? ((metin: string) => { try { sessionStorage.setItem(`vayra-build-ilk-${p.id}`, JSON.stringify({ istem: metin, mod: "yap", ekler: [] })); } catch { /* yok */ } router.push(`/panel/build/${p.id}`); });
  const id = p.id;
  const [c, setC] = useState<Konsol | null>(null);
  const [gelen, setGelen] = useState(0);
  const [bildirim, setBildirim] = useState(0);
  const [gunlukSorgu, setGunlukSorgu] = useState<string | undefined>(undefined);
  const bildirimGit = useCallback((b: string, sorgu?: string) => { setGunlukSorgu(sorgu); if (BOLUMLER.some((x) => x.id === b)) setBolum(b as Bolum); }, [setBolum]);
  const getir = useCallback(() => api<Konsol>(`/api/build/bulut/${id}`).then(setC).catch((e) => hataGoster?.(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [id, hataGoster]);
  useEffect(() => { getir(); }, [getir, p.yayin?.surumId, p.surumler.length]);
  useEffect(() => { document.getElementById(`bulut-icerik-${id}`)?.scrollTo({ top: 0 }); }, [bolum, id]);
  useEffect(() => { api<{ gonderimler: { okundu?: boolean }[] }>(`/api/build/form/${id}`).then((v) => setGelen(v.gonderimler.filter((x) => !x.okundu).length)).catch(() => {}); }, [id]);
  useEffect(() => { api<{ okunmamis: number }>(`/api/build/bulut/${id}/bildirim`).then((v) => setBildirim(v.okunmamis)).catch(() => {}); }, [id]);
  const yayinla = async (surumId?: string) => {
    try {
      await api(`/api/build/yayinla/${id}`, { govde: surumId ? { surumId } : {} });
      // Son sürüm yayınlanırken Test ortamı açıksa şema ve kurallar Canlı'ya aktarılır (veriler değil; önce Canlı yedeklenir). Geri almada aktarılmaz.
      const v = surumId ? null : await api<{ ortamAyari?: { test: boolean } }>(`/api/build/veri/${id}`).catch(() => null);
      if (v?.ortamAyari?.test) await api(`/api/build/veri/${id}`, { govde: { islem: "aktar", veri: false } }).catch(() => {});
      await Promise.all([getir(), k.yukle()]);
    }
    catch (e) {
      const m = e instanceof ApiHatasi ? e.message : "Yayınlanamadı.";
      hataGoster?.(m);
      api(`/api/build/bulut/${id}/bildirim`, { govde: { islem: "yayinHatasi", durum: e instanceof ApiHatasi ? e.durum : 500, mesaj: m } }).catch(() => {});
    }
  };
  const kritik = c?.guvenlik.filter((b) => b.seviye === "kritik").length ?? 0;
  const tamBoy = bolum === "veritabani" || bolum === "gelen";
  return (
    <div className="flex h-full min-h-0 max-md:flex-col">
      <LayoutGroup id={gomulu ? "bulut-bolum-gomulu" : "bulut-bolum"}>
        <nav className={cn("shrink-0 space-y-0.5 overflow-y-auto border-r border-white/[0.06] p-2 max-md:flex max-md:w-full max-md:gap-1 max-md:space-y-0 max-md:overflow-x-auto max-md:border-b max-md:border-r-0 [scrollbar-width:none]", gomulu ? "w-[196px]" : "w-[220px]")}>
          {BOLUMLER.map((b) => {
            const rozet = b.id === "guvenlik" ? kritik : b.id === "gelen" ? gelen : b.id === "genel" ? bildirim : 0;
            return (
              <button key={b.id} type="button" onClick={() => setBolum(b.id)} className={cn("relative flex w-full items-center gap-2.5 rounded-[11px] px-3 py-2 text-left text-[13px] transition-colors max-md:w-auto max-md:shrink-0 max-md:whitespace-nowrap", bolum === b.id ? "text-white" : "text-white/55 hover:text-white")}>
                {bolum === b.id && <motion.span layoutId={gomulu ? "bulut-z-gomulu" : "bulut-z"} transition={{ type: "spring", stiffness: 460, damping: 38 }} className="absolute inset-0 rounded-[11px] bg-white/[0.08]" />}
                <b.I className="relative h-4 w-4 shrink-0" /><span className="relative flex-1">{b.ad}</span>
                {rozet > 0 && <span className={cn("relative min-w-[18px] rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums", b.id === "guvenlik" ? "bg-rose-500/[0.2] text-rose-200" : "bg-[#55d6fd] text-[#04212b]")}>{rozet}</span>}
              </button>
            );
          })}
        </nav>
      </LayoutGroup>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {p.ekipRol === "izleyici" && (
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-amber-400/[0.06] px-4 py-2 text-[12.5px] text-amber-100/85 sm:px-5">
          <Eye className="h-3.5 w-3.5 shrink-0" />Bu projede izleyicisin: verileri ve ayarları görürsün, değiştiremezsin.
        </div>
      )}
      {tamBoy ? (
        <div className="min-h-0 min-w-0 flex-1">
          {bolum === "veritabani" && <Veritabani p={p} />}
          {bolum === "gelen" && <GelenKutusu k={k} okunmamis={(n) => { setGelen(n); okunmamis?.(n); }} />}
        </div>
      ) : (
        <div id={`bulut-icerik-${id}`} className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-5">
          <div className="mx-auto max-w-[1100px]">
            {!c ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : <>
              {bolum === "genel" && <GenelBakis c={c} yayinla={yayinla} git={setBolum} gomulu={gomulu} bildirimGit={bildirimGit} bildirimSayac={setBildirim} />}
              {bolum === "yayinlar" && <Yayinlar c={c} yayinla={yayinla} />}
              {bolum === "gunluk" && <Gunlukler key={gunlukSorgu ?? ""} id={id} ajana={ajana} gomulu={gomulu} ilkSorgu={gunlukSorgu} />}
              {bolum === "kullanim" && <Kullanim p={p} git={setBolum} />}
              {bolum === "duvar" && <GuvenlikDuvari p={p} ajana={ajana} />}
              {bolum === "kimlik" && <Uyeler p={p} />}
              {bolum === "dosyalar" && <Dosyalar id={id} />}
              {bolum === "fonksiyonlar" && <Fonksiyonlar p={p} ajana={ajana} />}
              {bolum === "zamanli" && <Zamanlanmis p={p} ajana={ajana} />}
              {bolum === "kuyruk" && <Kuyruk p={p} ajana={ajana} />}
              {bolum === "ortamlar" && <Ortamlar p={p} />}
              {bolum === "yedekler" && <Yedekler p={p} />}
              {bolum === "odalar" && <Odalar p={p} ajana={ajana} />}
              {bolum === "canli" && <GercekZamanli p={p} />}
              {bolum === "performans" && <Performans p={p} ajana={ajana} />}
              {bolum === "sorgu" && <SorguKonsolu p={p} />}
              {bolum === "denetim" && <Denetim p={p} />}
              {bolum === "ai" && <YapayZeka k={k} />}
              {bolum === "odemeler" && <Odemeler k={k} ajana={ajana} />}
              {bolum === "alan" && <AlanAdlari k={k} />}
              {bolum === "ortam" && <Sirlar k={k} />}
              {bolum === "analitik" && <Analitik p={p} yayinla={() => yayinla()} />}
              {bolum === "oturumlar" && <Oturumlar k={k} ajana={ajana} />}
              {bolum === "guvenlik" && <GuvenlikTaramasi projeId={id} ajanaGonder={ajana} yenilendi={getir} />}
            </>}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/** Bulut sayfası: üst çubuk + konsol. */
export function BulutProje({ id }: { id: string }) {
  const k = useProje(id);
  const [bolum, setBolum] = useState<Bolum>(() => { const b = typeof window === "undefined" ? null : new URLSearchParams(location.search).get("bolum"); return BOLUMLER.some((x) => x.id === b) ? (b as Bolum) : "genel"; });
  const [hata, setHata] = useState("");
  // Derin bağlantı: seçili bölüm adres çubuğunda (?bolum=…); Günlükler kendi süzgeçlerini ekler.
  useEffect(() => { if (bolum !== "gunluk" && new URLSearchParams(location.search).get("bolum") !== bolum) history.replaceState(history.state, "", bolum === "genel" ? location.pathname : `${location.pathname}?bolum=${bolum}`); }, [bolum]);
  const [ozet, setOzet] = useState<BulutOzeti | null>(null);
  useEffect(() => { api<Konsol>(`/api/build/bulut/${id}`).then((c) => setOzet(c.ozet)).catch(() => {}); }, [id, k.proje?.yayin?.surumId]);
  if (k.bulunamadi) return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><p className="text-[17px] font-semibold">Proje bulunamadı</p><Link href="/panel/build/bulut" className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Buluta dön</Link></div>;
  if (!k.proje) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  const p = k.proje;
  const adres = yayinAdresi(p.ayarlar.altAlan);
  return (
    <div className="flex h-screen min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-3 pl-16 md:pl-3">
        <Link href="/panel/build/bulut" aria-label="Buluta dön" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
        <span className="relative h-8 w-12 shrink-0 overflow-hidden rounded-[7px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">{p.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.kapak} alt="" className="h-full w-full object-cover object-top" />}</span>
        <p className="min-w-0 truncate text-[15px] font-semibold text-white">{p.ad}</p>
        {ozet && <span className="max-sm:hidden"><Durum o={ozet} /></span>}
        <span className="flex-1" />
        {p.yayin && <a href={adres.tam} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]"><ExternalLink className="h-3.5 w-3.5" /><span className="max-sm:hidden">Ziyaret et</span></a>}
        <Link href={`/panel/build/${id}`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black"><Code2 className="h-3.5 w-3.5" /><span className="max-sm:hidden">Çalışma alanı</span></Link>
      </header>
      {hata && <p className="shrink-0 border-b border-rose-300/10 bg-rose-500/[0.06] px-4 py-2 text-[12.5px] text-rose-200"><AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />{hata}</p>}
      <div className="min-h-0 flex-1"><BulutKonsol k={k} bolum={bolum} setBolum={setBolum} hataGoster={setHata} /></div>
    </div>
  );
}
