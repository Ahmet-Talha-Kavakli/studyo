"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, AudioLines, Bell, BellOff, CalendarClock, Check, CheckCheck, Copy, KeyRound, Loader2, Mail, MessageSquareText, MonitorSmartphone, Moon, Radar, Send, Trash2, UserPlus, X } from "lucide-react";
import { SagPanel, Secici } from "@/components/build/sohbet/ortak";
import { api, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";

/**
 * Bildirim merkezi (kenar çubuğundaki zil): uygulama içi bildirimler, okundu ve silme, kanal ayarları (tarayıcı
 * bildirimi, e-posta, türe göre tercih, sessiz saatler). Tarayıcı bildirimi sunucuda VAPID anahtarı yoksa açılamaz;
 * bu durumda anahtar üretme yolu gösterilir (anahtar kaydedilmez). Zil 30 saniyede bir okunmamış sayısını yoklar.
 */
type Tur = "izleme" | "gorev" | "yorum" | "davet" | "dokum" | "sistem";
type KanalDurumu = "gonderildi" | "kapali" | "kurulu-degil" | "hata" | "abonelik-yok" | "sessiz";
type Bildirim = { id: string; tur: Tur; baslik: string; metin: string; adres?: string; zaman: number; okundu?: boolean; kanallar?: { push?: KanalDurumu; eposta?: KanalDurumu } };
type Ayar = { eposta: string; turler: Record<Tur, { push: boolean; eposta: boolean }>; sessiz: { acik: boolean; bas: string; bit: string } };
type Abonelik = { endpoint: string; cihaz: string; ekleme: number; sonBasari?: number; sonHata?: string };
type Kurulum = { push: { kurulu: boolean; genel?: string; neden?: string }; eposta: { kurulu: boolean; gonderen?: string; neden?: string } };
type Veri = { bildirimler: Bildirim[]; okunmamis: number; ayar: Ayar; abonelikler: Abonelik[]; kurulum: Kurulum };

const TUR: Record<Tur, { ad: string; alt: string; I: typeof Bell; renk: string }> = {
  izleme: { ad: "İzleme", alt: "İzlediğin koşul gerçekleşince", I: Radar, renk: "text-[#8be6ff] bg-[#55d6fd]/[0.12]" },
  gorev: { ad: "Zamanlanmış görevler", alt: "Görev çalışıp sonucu sohbete düşünce", I: CalendarClock, renk: "text-violet-200 bg-violet-400/[0.12]" },
  yorum: { ad: "Yorumlar", alt: "Paylaştığın sohbete yorum gelince", I: MessageSquareText, renk: "text-emerald-200 bg-emerald-400/[0.12]" },
  davet: { ad: "Davetler", alt: "Biri seni bir sohbete ya da klasöre davet edince", I: UserPlus, renk: "text-amber-200 bg-amber-400/[0.12]" },
  dokum: { ad: "Ses dökümleri", alt: "Kayıt metne dökülüp özetlenince", I: AudioLines, renk: "text-pink-200 bg-pink-400/[0.12]" },
  sistem: { ad: "Vayra", alt: "Hesap ve hizmet duyuruları", I: Bell, renk: "text-white/80 bg-white/[0.07]" },
};
const KANAL_METNI: Record<KanalDurumu, string> = { gonderildi: "gönderildi", kapali: "kapalı", "kurulu-degil": "sunucuda kurulu değil", hata: "gönderilemedi", "abonelik-yok": "ayarlanmadı", sessiz: "sessiz saatte" };

const gunGrubu = (t: number) => { const d = new Date(t), b = new Date(); b.setHours(0, 0, 0, 0); return t >= b.getTime() ? "Bugün" : t >= b.getTime() - 864e5 ? "Dün" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }); };
const b64Bayt = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const h = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(h, (c) => c.charCodeAt(0)); };

/** Bu tarayıcının push desteği ve izni. */
function tarayiciDurumu(): { destek: boolean; izin: NotificationPermission | "yok"; neden?: string } {
  if (typeof window === "undefined") return { destek: false, izin: "yok" };
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    const ios = /iPhone|iPad/.test(navigator.userAgent);
    return { destek: false, izin: "yok", neden: ios ? "iPhone ve iPad'de tarayıcı bildirimi yalnız Vayra ana ekrana eklenince çalışır (Paylaş, Ana Ekrana Ekle)." : "Bu tarayıcı bildirim göndermeyi desteklemiyor." };
  }
  if (!window.isSecureContext) return { destek: false, izin: Notification.permission, neden: "Tarayıcı bildirimi yalnız güvenli (https) adreslerde çalışır." };
  return { destek: true, izin: Notification.permission };
}

function Anahtar({ acik, set, disabled, etiket }: { acik: boolean; set: (v: boolean) => void; disabled?: boolean; etiket: string }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} title={etiket} disabled={disabled} onClick={() => set(!acik)}
      className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-300 disabled:opacity-35", acik ? "bg-[#55d6fd]" : "bg-white/[0.14]")}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 34 }} className={cn("absolute top-[3px] h-4 w-4 rounded-full bg-white", acik ? "right-[3px]" : "left-[3px]")} />
    </button>
  );
}

function Satir({ ikon, ad, alt, children, ust }: { ikon: React.ReactNode; ad: React.ReactNode; alt?: React.ReactNode; children?: React.ReactNode; ust?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-3 border-t border-white/[0.06] px-4 py-3 first:border-0", ust ? "items-start" : "items-center")}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/85">{ikon}</span>
      <span className="min-w-[180px] flex-1"><span className="block text-[13.5px] font-medium text-white">{ad}</span>{alt && <span className="block text-[12.5px] leading-snug text-white/55">{alt}</span>}</span>
      {children}
    </div>
  );
}

/** Kanal ayarları: tarayıcı bildirimi, e-posta, türlere göre tercih, sessiz saatler. */
function AyarSekmesi({ v, yenile, setAyar }: { v: Veri; yenile: () => Promise<void>; setAyar: (a: Ayar) => void }) {
  const [tarayici, setTarayici] = useState(tarayiciDurumu);
  const [buCihaz, setBuCihaz] = useState<string | null>(null);
  const [is, setIs] = useState("");
  const [hata, setHata] = useState("");
  const [eposta, setEposta] = useState(v.ayar.eposta);
  const [anahtarlar, setAnahtarlar] = useState<string[] | null>(null);
  const [kopya, setKopya] = useState(false);
  const [deneme, setDeneme] = useState<Bildirim | null>(null);
  useEffect(() => { setEposta(v.ayar.eposta); }, [v.ayar.eposta]);
  useEffect(() => {
    if (!tarayici.destek) return;
    navigator.serviceWorker.getRegistration("/panel/build/").then((r) => r?.pushManager.getSubscription()).then((s) => setBuCihaz(s?.endpoint ?? null)).catch(() => {});
  }, [tarayici.destek, v.abonelikler.length]);
  const yama = async (g: Partial<Ayar> & { turler?: Partial<Ayar["turler"]> }) => {
    setHata("");
    try { const r = await api<{ ayar: Ayar }>("/api/build/bildirim/ayar", { method: "PATCH", govde: g }); setAyar(r.ayar); } catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); }
  };
  const ac = async () => {
    if (!v.kurulum.push.genel) return;
    setIs("ac"); setHata("");
    try {
      const izin = await Notification.requestPermission();
      setTarayici(tarayiciDurumu());
      if (izin !== "granted") throw new Error(izin === "denied" ? "Bildirim izni reddedildi. Tarayıcının site ayarlarından izin verip tekrar dene." : "Bildirim izni verilmedi.");
      const kayit = await navigator.serviceWorker.register("/sw-vayra.js", { scope: "/panel/build/" });
      await navigator.serviceWorker.ready;
      let abone = await kayit.pushManager.getSubscription();
      const anahtar = b64Bayt(v.kurulum.push.genel);
      if (abone && abone.options.applicationServerKey && new Uint8Array(abone.options.applicationServerKey).toString() !== anahtar.toString()) { await abone.unsubscribe(); abone = null; }
      abone ??= await kayit.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: anahtar });
      await api("/api/build/bildirim/abonelik", { govde: abone.toJSON() });
      setBuCihaz(abone.endpoint);
      await yenile();
    } catch (e) { setHata(e instanceof Error ? e.message : "Açılamadı."); } finally { setIs(""); }
  };
  const kapat = async (endpoint: string) => {
    setIs(`k-${endpoint}`);
    try {
      if (endpoint === buCihaz) { const r = await navigator.serviceWorker.getRegistration("/panel/build/"); await (await r?.pushManager.getSubscription())?.unsubscribe(); setBuCihaz(null); }
      await api("/api/build/bildirim/abonelik", { method: "DELETE", govde: { endpoint } });
      await yenile();
    } catch { /* yok */ } finally { setIs(""); }
  };
  const dene = async () => { setIs("dene"); try { const r = await api<{ bildirim: Bildirim }>("/api/build/bildirim/dene", { govde: {} }); setDeneme(r.bildirim); await yenile(); } catch (e) { setHata(e instanceof Error ? e.message : "Gönderilemedi."); } finally { setIs(""); } };
  const uret = async () => { setIs("uret"); try { const r = await api<{ satirlar: string[] }>("/api/build/bildirim/anahtar", { govde: {} }); setAnahtarlar(r.satirlar); } catch (e) { setHata(e instanceof Error ? e.message : "Üretilemedi."); } finally { setIs(""); } };
  const k = v.kurulum;
  const epostaGecerli = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta.trim());
  return (
    <div className="space-y-4">
      {hata && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/20"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{hata}</p>}
      <section>
        <p className="mb-2 px-1 text-[13px] font-medium text-white/75">Kanallar</p>
        <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
          <Satir ikon={<Bell className="h-4 w-4" />} ad="Vayra içinde" alt="Zildeki bildirim listesi; her zaman açık"><span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] text-white/70">Açık</span></Satir>
          <Satir ust ikon={<MonitorSmartphone className="h-4 w-4" />} ad="Tarayıcı bildirimi" alt={!k.push.kurulu ? k.push.neden : !tarayici.destek ? tarayici.neden : tarayici.izin === "denied" ? "Bu sitede bildirim izni engellenmiş; tarayıcının site ayarlarından izin ver." : buCihaz ? "Bu tarayıcı bildirim alıyor. Sekme kapalıyken de gelir." : "Sekme kapalıyken bile ekranına bildirim düşer."}>
            {k.push.kurulu && tarayici.destek && (buCihaz
              ? <button type="button" onClick={() => kapat(buCihaz)} disabled={!!is} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] text-white hover:bg-white/[0.12] disabled:opacity-50">{is === `k-${buCihaz}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />}Bu cihazda kapat</button>
              : <button type="button" onClick={ac} disabled={!!is || tarayici.izin === "denied"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">{is === "ac" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}Bu tarayıcıda aç</button>)}
            {!k.push.kurulu && !anahtarlar && <button type="button" onClick={uret} disabled={!!is} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-50">{is === "uret" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}Anahtar çifti üret</button>}
            {!k.push.kurulu && anahtarlar && (
              <div className="w-full rounded-[14px] bg-[#0c0d0f] p-3 ring-1 ring-inset ring-white/[0.08]">
                <p className="mb-2 text-[12.5px] leading-relaxed text-white/65">Bu satırları sunucunun <span className="sc-kod text-white/85">.env.local</span> dosyasına (ya da barındırma hizmetinin ortam değişkenlerine) ekle, VAPID_SUBJECT satırına kendi adresini yaz ve sunucuyu yeniden başlat. Anahtarlar hiçbir yere kaydedilmedi; bu paneli kapatınca bir daha gösterilmez.</p>
                <pre className="sc-kod overflow-x-auto whitespace-pre text-[11.5px] leading-relaxed text-[#8be6ff] [scrollbar-width:thin]">{anahtarlar.join("\n")}</pre>
                <button type="button" onClick={() => { navigator.clipboard?.writeText(anahtarlar.join("\n")); setKopya(true); setTimeout(() => setKopya(false), 1500); }} className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-black">{kopya ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{kopya ? "Kopyalandı" : "Satırları kopyala"}</button>
              </div>
            )}
          </Satir>
          <Satir ust ikon={<Mail className="h-4 w-4" />} ad="E-posta" alt={k.eposta.kurulu ? `Gönderen: ${k.eposta.gonderen}` : `${k.eposta.neden} Adresini kaydedebilirsin ama servis kurulana kadar e-posta gitmez.`}>
            <form className="flex w-full items-center gap-2 sm:w-auto" onSubmit={(e) => { e.preventDefault(); if (epostaGecerli || !eposta.trim()) yama({ eposta: eposta.trim() }); }}>
              <input value={eposta} onChange={(e) => setEposta(e.target.value)} type="email" inputMode="email" autoComplete="email" name="bildirim-eposta" placeholder="ad@alanadi.com" className="h-9 min-w-0 flex-1 rounded-full bg-white/[0.05] px-3.5 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/30 sm:w-[210px]" />
              {eposta.trim() !== v.ayar.eposta && <button type="submit" disabled={!!eposta.trim() && !epostaGecerli} className="h-9 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-40">Kaydet</button>}
            </form>
          </Satir>
        </div>
        {v.abonelikler.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-[16px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.06]">
            {v.abonelikler.map((a) => (
              <div key={a.endpoint} className="flex items-center gap-3 border-t border-white/[0.05] px-4 py-2.5 first:border-0">
                <MonitorSmartphone className="h-4 w-4 shrink-0 text-white/45" />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{a.cihaz}{a.endpoint === buCihaz && <span className="ml-2 rounded-full bg-[#55d6fd]/[0.14] px-2 py-0.5 text-[11px] text-[#8be6ff]">Bu cihaz</span>}</span><span className="block truncate text-[11.5px] text-white/45">{a.sonHata ? `Son gönderim başarısız: ${a.sonHata}` : a.sonBasari ? `Son bildirim ${gorece(a.sonBasari)}` : `Eklendi ${gorece(a.ekleme)}`}</span></span>
                <button type="button" onClick={() => kapat(a.endpoint)} aria-label="Bu cihazın aboneliğini kaldır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-rose-300">{is === `k-${a.endpoint}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}</button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 px-1">
          <button type="button" onClick={dene} disabled={!!is} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-50">{is === "dene" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Deneme bildirimi gönder</button>
          {deneme && <span className="text-[12px] text-white/55">Vayra içinde gösterildi · tarayıcı {KANAL_METNI[deneme.kanallar?.push ?? "kapali"]} · e-posta {KANAL_METNI[deneme.kanallar?.eposta ?? "kapali"]}</span>}
        </div>
      </section>
      <section>
        <p className="mb-2 px-1 text-[13px] font-medium text-white/75">Neyi nereye</p>
        <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
          <div className="flex items-center gap-3 bg-white/[0.02] px-4 py-2 text-[12px] text-white/50"><span className="flex-1">Bildirim türü</span><span className="w-[52px] whitespace-nowrap text-center">Tarayıcı</span><span className="w-[52px] whitespace-nowrap text-center">E-posta</span></div>
          {(Object.keys(TUR) as Tur[]).map((t) => {
            const x = TUR[t], d = v.ayar.turler[t];
            return (
              <div key={t} className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-2.5">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", x.renk)}><x.I className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{x.ad}</span><span className="block truncate text-[11.5px] text-white/45">{x.alt}</span></span>
                <span className="flex w-[52px] justify-center"><Anahtar etiket={`${x.ad}: tarayıcı`} acik={d.push} set={(p) => yama({ turler: { [t]: { ...d, push: p } } as Ayar["turler"] })} /></span>
                <span className="flex w-[52px] justify-center"><Anahtar etiket={`${x.ad}: e-posta`} acik={d.eposta} set={(e) => yama({ turler: { [t]: { ...d, eposta: e } } as Ayar["turler"] })} /></span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
        <Satir ikon={<Moon className="h-4 w-4" />} ad="Sessiz saatler" alt="Bu aralıkta tarayıcı ve e-posta bildirimi gitmez, Vayra içinde birikir (Türkiye saati)">
          <Anahtar etiket="Sessiz saatler" acik={v.ayar.sessiz.acik} set={(a) => yama({ sessiz: { ...v.ayar.sessiz, acik: a } })} />
        </Satir>
        {v.ayar.sessiz.acik && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3 text-[13px] text-white/70">
            <input type="time" value={v.ayar.sessiz.bas} onChange={(e) => yama({ sessiz: { ...v.ayar.sessiz, bas: e.target.value } })} className="h-9 rounded-full bg-white/[0.06] px-3 text-white outline-none [color-scheme:dark]" aria-label="Başlangıç" />
            <span>ile</span>
            <input type="time" value={v.ayar.sessiz.bit} onChange={(e) => yama({ sessiz: { ...v.ayar.sessiz, bit: e.target.value } })} className="h-9 rounded-full bg-white/[0.06] px-3 text-white outline-none [color-scheme:dark]" aria-label="Bitiş" />
            <span>arası sessiz</span>
          </div>
        )}
      </section>
    </div>
  );
}

function Liste({ v, setV, kapat }: { v: Veri; setV: (f: (x: Veri) => Veri) => void; kapat: () => void }) {
  const router = useRouter();
  const [suzgec, setSuzgec] = useState<"hepsi" | "okunmamis">("hepsi");
  const gorunen = useMemo(() => v.bildirimler.filter((b) => suzgec === "hepsi" || !b.okundu), [v.bildirimler, suzgec]);
  const gruplar = useMemo(() => { const m = new Map<string, Bildirim[]>(); for (const b of gorunen) { const g = gunGrubu(b.zaman); m.set(g, [...(m.get(g) ?? []), b]); } return [...m]; }, [gorunen]);
  const okundu = (id: string | undefined, ok = true) => { setV((x) => ({ ...x, bildirimler: x.bildirimler.map((b) => (!id || b.id === id ? { ...b, okundu: ok || undefined } : b)), okunmamis: id ? x.bildirimler.filter((b) => (b.id === id ? !ok : !b.okundu)).length : 0 })); api("/api/build/bildirim", { method: "PATCH", govde: { id, okundu: ok } }).catch(() => {}); };
  const sil = (id?: string) => { setV((x) => ({ ...x, bildirimler: x.bildirimler.filter((b) => (id ? b.id !== id : !b.okundu)) })); api(`/api/build/bildirim${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method: "DELETE" }).catch(() => {}); };
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Secici id="bildirim-suzgec" deger={suzgec} set={setSuzgec} l={[{ id: "hepsi", ad: "Tümü" }, { id: "okunmamis", ad: v.okunmamis ? `Okunmamış ${v.okunmamis}` : "Okunmamış" }]} />
        <span className="ml-auto" />
        {v.okunmamis > 0 && <button type="button" onClick={() => okundu(undefined)} title="Tümünü okundu say" className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/65 hover:bg-white/[0.06] hover:text-white"><CheckCheck className="h-3.5 w-3.5" /><span className="max-sm:hidden">Tümünü okundu say</span></button>}
        {v.bildirimler.some((b) => b.okundu) && <button type="button" onClick={() => sil()} title="Okunanları temizle" aria-label="Okunanları temizle" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-white"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
      {!gorunen.length ? (
        <div className="flex items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Bell className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">{suzgec === "okunmamis" && v.bildirimler.length ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}</span><span className="block text-[12.5px] text-white/55">Bir fiyatı, sayfayı ya da kuru izlemeye al; koşul gerçekleşince burada görürsün.</span></span>
          <button type="button" onClick={() => { kapat(); router.push("/panel/build/sohbet/gorevler?sekme=izleme&yeni=1"); }} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Radar className="h-3.5 w-3.5" />İzleme kur</button>
        </div>
      ) : (
        <div className="space-y-4">
          {gruplar.map(([g, l]) => (
            <div key={g}>
              <p className="mb-1.5 px-1 text-[12px] font-medium text-white/45">{g}</p>
              <ul className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]">
                <AnimatePresence initial={false}>
                  {l.map((b) => {
                    const x = TUR[b.tur] ?? TUR.sistem;
                    return (
                      <motion.li key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group relative border-t border-white/[0.06] first:border-0">
                        <button type="button" onClick={() => { okundu(b.id); if (b.adres) { kapat(); router.push(b.adres); } }} className={cn("flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.04]", !b.okundu && "bg-[#55d6fd]/[0.03]")}>
                          <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", x.renk)}><x.I className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1 pr-14">
                            <span className="flex items-center gap-2"><span className="truncate text-[13.5px] font-semibold text-white">{b.baslik}</span>{!b.okundu && <span className="h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" aria-label="Okunmadı" />}</span>
                            <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-white/65">{b.metin}</span>
                            <span className="mt-1 block text-[11.5px] text-white/40">{gorece(b.zaman)} · {x.ad}{b.kanallar?.push === "gonderildi" ? " · tarayıcıya gitti" : ""}{b.kanallar?.eposta === "gonderildi" ? " · e-postayla gitti" : ""}</span>
                          </span>
                        </button>
                        <span className="absolute right-2 top-2.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                          <button type="button" onClick={() => okundu(b.id, !b.okundu)} title={b.okundu ? "Okunmadı say" : "Okundu say"} aria-label={b.okundu ? "Okunmadı say" : "Okundu say"} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><Check className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => sil(b.id)} title="Sil" aria-label="Sil" className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
                        </span>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bildirim merkezi paneli (sağdan açılır). */
export function BildirimPaneli({ acik, kapat, sekme: ilkSekme, sayac }: { acik: boolean; kapat: () => void; sekme?: "liste" | "ayar"; sayac?: (n: number) => void }) {
  const [v, setV] = useState<Veri | null>(null);
  const [sekme, setSekme] = useState<"liste" | "ayar">("liste");
  const yenile = useCallback(async () => { try { const r = await api<Veri>("/api/build/bildirim"); setV(r); sayac?.(r.okunmamis); } catch { /* yok */ } }, [sayac]);
  useEffect(() => { if (acik) { setSekme(ilkSekme ?? "liste"); yenile(); } }, [acik, ilkSekme, yenile]);
  useEffect(() => { if (v) sayac?.(v.bildirimler.filter((b) => !b.okundu).length); }, [v, sayac]);
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Bildirimler" alt={v ? (v.okunmamis ? `${v.okunmamis} okunmamış` : "Hepsi okundu") : "Yükleniyor"} ikon={<Bell className="h-[18px] w-[18px]" />} genislik={520}
      ust={<Secici id="bildirim-sekme" deger={sekme} set={setSekme} kucuk l={[{ id: "liste", ad: "Liste" }, { id: "ayar", ad: "Ayarlar" }]} />}>
      {!v ? <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-[16px] bg-white/[0.03]" />)}</div>
        : sekme === "liste" ? <Liste v={v} setV={(f) => setV((x) => (x ? f(x) : x))} kapat={kapat} />
          : <AyarSekmesi v={v} yenile={yenile} setAyar={(a) => setV((x) => (x ? { ...x, ayar: a } : x))} />}
    </SagPanel>
  );
}

/**
 * Kenar çubuğundaki zil satırı. Okunmamış sayısı 30 saniyede bir ve sekme öne gelince yoklanır; sayı artınca
 * son bildirim kısa bir uyarıyla gösterilir.
 */
export function BildirimZili({ gizle }: { gizle?: boolean }) {
  const [sayi, setSayi] = useState(0);
  const [acik, setAcik] = useState(false);
  const onceki = useRef<number | null>(null);
  const yokla = useCallback(async () => {
    try {
      const r = await api<{ okunmamis: number }>("/api/build/bildirim?say=1");
      if (onceki.current !== null && r.okunmamis > onceki.current && !document.hidden) {
        const v = await api<{ bildirimler: Bildirim[] }>("/api/build/bildirim").catch(() => null);
        const b = v?.bildirimler.find((x) => !x.okundu);
        if (b) toast(b.baslik, { description: b.metin.slice(0, 140), action: { label: "Aç", onClick: () => setAcik(true) } });
      }
      onceki.current = r.okunmamis;
      setSayi(r.okunmamis);
    } catch { /* yok */ }
  }, []);
  useEffect(() => {
    yokla();
    const t = setInterval(() => { if (!document.hidden) yokla(); }, 30_000);
    const g = () => { if (!document.hidden) yokla(); };
    document.addEventListener("visibilitychange", g);
    const ac = () => setAcik(true);
    addEventListener("vayra-bildirim-ac", ac);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", g); removeEventListener("vayra-bildirim-ac", ac); };
  }, [yokla]);
  const sayac = useCallback((n: number) => { setSayi(n); onceki.current = n; }, []);
  return (
    <>
      <button type="button" onClick={() => setAcik(true)} title={sayi ? `Bildirimler, ${sayi} okunmamış` : "Bildirimler"} aria-label={sayi ? `Bildirimler, ${sayi} okunmamış` : "Bildirimler"}
        className={cn("relative flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white", gizle && "justify-center px-0")}>
        <Bell className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
        {gizle ? (sayi > 0 && <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-[#55d6fd]" />) : <>
          <span className="flex-1 text-left">Bildirimler</span>
          <AnimatePresence>{sayi > 0 && <motion.span key={sayi} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#55d6fd] px-1.5 text-[11px] font-semibold tabular-nums text-black">{sayi > 99 ? "99+" : sayi}</motion.span>}</AnimatePresence>
        </>}
      </button>
      <BildirimPaneli acik={acik} kapat={() => setAcik(false)} sayac={sayac} />
    </>
  );
}

/** Başka yerlerden (ör. izleme paneli) bildirim ayarlarını açmak için. */
export const bildirimMerkeziniAc = () => dispatchEvent(new Event("vayra-bildirim-ac"));
