"use client";

import { useState } from "react";
import { AlanAra } from "@/components/build/bulut/AlanAra";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, CircleDashed, Copy, ExternalLink, Globe, Loader2, Mail, RotateCw, Shield, Star, Trash2, X } from "lucide-react";
import { Anahtar } from "@/components/ayarlar/ui";
import { api, ApiHatasi, gorece, yayinAdresi } from "@/lib/build/istemci";
import type { AlanAdi, DnsKayit, Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import type { ProjeKanca } from "./useProje";
import { EpostaGonderenAlan } from "@/components/build/bulut/Entegrasyonlar";

const DURUM: Record<AlanAdi["durum"], { ad: string; renk: string; nokta: string }> = {
  "dns-bekleniyor": { ad: "DNS kayıtları bekleniyor", renk: "text-amber-200", nokta: "bg-amber-300" },
  dogrulaniyor: { ad: "Doğrulanıyor", renk: "text-[#55d6fd]", nokta: "bg-[#55d6fd]" },
  ssl: { ad: "Sertifika hazırlanıyor", renk: "text-[#55d6fd]", nokta: "bg-[#55d6fd]" },
  bagli: { ad: "Bağlı", renk: "text-emerald-300", nokta: "bg-emerald-400" },
  sorun: { ad: "Kayıtlarda sorun var", renk: "text-rose-300", nokta: "bg-rose-400" },
};

/** Sağlayıcıya göre kısa yol tarifi (DNS panelinin yeri). */
const REHBER: Record<string, string> = {
  GoDaddy: "GoDaddy'de Alan Adlarım bölümünden alan adını seç, DNS sekmesine geç ve Yeni Kayıt Ekle'ye bas.",
  Cloudflare: "Cloudflare'de alan adını seç, DNS bölümünde Kayıt ekle'ye bas. Kaydın yanındaki bulutu gri yap (Yalnız DNS).",
  Natro: "Natro müşteri panelinde Alan Adlarım'dan alan adını seç ve DNS Yönetimi'ni aç.",
  "İsimtescil": "İsimtescil panelinde Alan Adlarım'dan alan adını seç ve DNS Yönetimi'ne gir.",
  Turhost: "Turhost müşteri panelinde Alan Adları bölümünden DNS Kayıtları'nı aç.",
  "Güzel Hosting": "Güzel Hosting panelinde alan adını seç ve DNS Yönetimi bölümünü aç.",
  Namecheap: "Namecheap'te Domain List'ten Manage'e bas, Advanced DNS sekmesinde Add New Record'u kullan.",
  Hostinger: "Hostinger panelinde Alan Adları bölümünden alan adını seç, DNS / Ad Sunucuları'nı aç.",
  "Amazon Route 53": "Route 53'te Hosted zones bölümünden alan adını seç ve Create record'a bas.",
  Google: "Alan adı yönetim panelinde DNS bölümüne gir ve Özel kayıtlar kısmına ekle.",
  Squarespace: "Squarespace Domains'te alan adını seç, DNS ayarlarında Custom records'a ekle.",
  Wix: "Wix'te Alan Adları bölümünden alan adını seç, DNS Kayıtlarını Yönet'e bas.",
  Porkbun: "Porkbun'da alan adının yanındaki DNS bağlantısına bas ve kayıt ekle.",
};

function Kopyala({ deger }: { deger: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" title="Kopyala" onClick={() => { navigator.clipboard?.writeText(deger); setOk(true); setTimeout(() => setOk(false), 1300); }} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white">
      {ok ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function KayitSatiri({ r }: { r: DnsKayit }) {
  const durum = r.durum === "dogru" ? { I: Check, ad: "Doğru", c: "text-emerald-300" } : r.durum === "yanlis" ? { I: AlertTriangle, ad: "Farklı değer", c: "text-rose-300" } : { I: CircleDashed, ad: "Bulunamadı", c: "text-white/40" };
  return (
    <div className="grid grid-cols-[64px_minmax(0,0.8fr)_minmax(0,1.6fr)_110px] items-center gap-2 px-3 py-2.5 text-[12.5px] max-md:grid-cols-[52px_minmax(0,1fr)] max-md:gap-y-1.5">
      <span className="font-mono font-semibold text-white">{r.tur}</span>
      <span className="flex min-w-0 items-center gap-1 font-mono text-white/80"><span className="truncate">{r.ad}</span><Kopyala deger={r.ad} /></span>
      <span className="flex min-w-0 items-center gap-1 font-mono text-white/80 max-md:col-span-2"><span className="truncate">{r.deger}</span><Kopyala deger={r.deger} /></span>
      <span className={cn("flex items-center gap-1.5 max-md:col-span-2", durum.c)} title={r.bulunan?.length ? `Bulunan: ${r.bulunan.join(", ")}` : undefined}>
        <durum.I className="h-3.5 w-3.5 shrink-0" />{durum.ad}
      </span>
      {r.durum === "yanlis" && r.bulunan?.length ? <p className="col-span-full -mt-1 truncate pl-[72px] font-mono text-[11.5px] text-rose-200/60 max-md:pl-0">Şu an: {r.bulunan.join(", ")}</p> : null}
    </div>
  );
}

function AlanKarti({ a, saglayici, k, guncelle }: { a: AlanAdi; saglayici?: string | null; k: ProjeKanca; guncelle: (l: AlanAdi[], s?: Record<string, string | null>) => void }) {
  const p = k.proje as Proje;
  const [taraniyor, setTaraniyor] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const d = DURUM[a.durum];
  const tara = async () => {
    setTaraniyor(true);
    try { const v = await api<{ alanAdlari: AlanAdi[]; saglayicilar: Record<string, string | null> }>(`/api/build/alanadi/${p.id}?ad=${encodeURIComponent(a.ad)}`); guncelle(v.alanAdlari, v.saglayicilar); }
    finally { setTaraniyor(false); }
  };
  const yama = async (g: { birincil?: boolean; wwwYonlendir?: boolean }) => { const v = await api<{ alanAdlari: AlanAdi[] }>(`/api/build/alanadi/${p.id}`, { method: "PATCH", govde: { ad: a.ad, ...g } }); guncelle(v.alanAdlari); };
  const sil = async () => { const v = await api<{ alanAdlari: AlanAdi[] }>(`/api/build/alanadi/${p.id}?ad=${encodeURIComponent(a.ad)}`, { method: "DELETE" }); guncelle(v.alanAdlari); };
  const eposta = () => {
    const govde = `Merhaba,\n\n${a.ad} alan adını Vayra Build'deki sitemize bağlamak için DNS paneline şu kayıtların eklenmesi gerekiyor:\n\n${a.kayitlar.map((r) => `Tür: ${r.tur}\nAd: ${r.ad}\nDeğer: ${r.deger}\n`).join("\n")}\nVarsa kök alan adındaki diğer A ve AAAA kayıtlarını silin. E-posta (MX) kayıtlarına dokunmayın.\n\nTeşekkürler.`;
    location.href = `mailto:?subject=${encodeURIComponent(`${a.ad} için DNS kayıtları`)}&body=${encodeURIComponent(govde)}`;
  };
  return (
    <div className="overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.06]"><Globe className="h-4 w-4 text-white/65" /></span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[14.5px] font-semibold text-white">{a.ad}{a.birincil && <span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium text-white/75">Birincil</span>}</p>
          <p className={cn("flex items-center gap-1.5 text-[12.5px]", d.renk)}><span className={cn("h-1.5 w-1.5 rounded-full", d.nokta, a.durum !== "bagli" && a.durum !== "sorun" && "animate-pulse")} />{d.ad}{a.sonKontrol ? <span className="text-white/35"> · son kontrol {gorece(a.sonKontrol)}</span> : null}</p>
        </div>
        <button type="button" onClick={tara} disabled={taraniyor} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-60">{taraniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}Şimdi kontrol et</button>
      </div>

      {a.durum === "bagli" ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3 text-[13px] text-white/70">
          <Shield className="h-4 w-4 text-emerald-300" />Kayıtlar doğru. Yayındaki sürüm bu adreste açılır; güvenli bağlantı (HTTPS) sertifikası yayın sunucusunda otomatik alınır.
          <a href={`https://${a.ad}`} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-[#55d6fd]">Siteyi aç<ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      ) : (
        <div className="border-t border-white/[0.06] px-4 py-3.5">
          <p className="text-[13px] leading-relaxed text-white/70">
            {saglayici ? <>Alan adın <span className="font-semibold text-white">{saglayici}</span> üzerinden yönetiliyor. {REHBER[saglayici] ?? "Alan adını aldığın firmanın panelinde DNS yönetimi bölümünü aç."}</> : "Alan adını aldığın firmanın panelinde DNS yönetimi bölümünü aç ve aşağıdaki kayıtları ekle."}
            {" "}Kayıtların yayılması birkaç dakika ile birkaç saat sürebilir; durum kendiliğinden güncellenmez, "Şimdi kontrol et" ile denetle.
          </p>
        </div>
      )}

      <div className="mx-4 mb-3 overflow-hidden rounded-[14px] bg-black/20 ring-1 ring-inset ring-white/[0.06]">
        <div className="grid grid-cols-[64px_minmax(0,0.8fr)_minmax(0,1.6fr)_110px] gap-2 border-b border-white/[0.06] px-3 py-2 text-[11.5px] text-white/40 max-md:hidden"><span>Tür</span><span>Ad (host)</span><span>Değer</span><span>Durum</span></div>
        <div className="divide-y divide-white/[0.05]">{a.kayitlar.map((r) => <KayitSatiri key={`${r.tur}-${r.ad}`} r={r} />)}</div>
      </div>

      {a.uyarilar.length > 0 && (
        <div className="mx-4 mb-3 space-y-1.5 rounded-[14px] bg-amber-400/[0.06] p-3 ring-1 ring-inset ring-amber-300/15">
          {a.uyarilar.map((u) => <p key={u} className="flex gap-2 text-[12.5px] leading-relaxed text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />{u}</p>)}
        </div>
      )}
      {a.korunan.length > 0 && <p className="mx-4 mb-3 flex items-start gap-2 text-[12.5px] text-white/50"><Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />Bunlara dokunma, olduğu gibi kalacak: {a.korunan.join(" · ")}</p>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] px-4 py-3">
        {a.kok && <label className="flex items-center gap-2 text-[12.5px] text-white/70"><Anahtar acik={a.wwwYonlendir} onDegis={(v) => yama({ wwwYonlendir: v })} etiket="www yönlendirmesi" kayit={false} />www.{a.ad} de bu siteye gitsin</label>}
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          {!a.birincil && <button type="button" onClick={() => yama({ birincil: true })} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/65 hover:bg-white/[0.06] hover:text-white"><Star className="h-3.5 w-3.5" />Birincil yap</button>}
          {a.durum !== "bagli" && <button type="button" onClick={eposta} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/65 hover:bg-white/[0.06] hover:text-white"><Mail className="h-3.5 w-3.5" />Kayıtları e-postayla gönder</button>}
          {silOnay ? (
            <span className="flex items-center gap-1"><button type="button" onClick={sil} className="h-8 rounded-full bg-rose-500/15 px-3 text-[12.5px] text-rose-200 hover:bg-rose-500/25">Kaldır</button><button type="button" onClick={() => setSilOnay(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06]"><X className="h-3.5 w-3.5" /></button></span>
          ) : <button type="button" onClick={() => setSilOnay(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/50 hover:bg-white/[0.06] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Kaldır</button>}
        </span>
      </div>
    </div>
  );
}

const KAYIT_FIRMALARI = [["Natro", "https://www.natro.com/alan-adi-sorgulama"], ["İsimtescil", "https://www.isimtescil.net"], ["GoDaddy", "https://www.godaddy.com/tr-tr"], ["Namecheap", "https://www.namecheap.com"], ["Cloudflare", "https://www.cloudflare.com/products/registrar/"]];

/** Alan adları: ekle → gerçek DNS taraması → kayıt tablosu, sağlayıcı rehberi, uyarılar, birincil, www, kaldır. */
export function AlanAdlari({ k }: { k: ProjeKanca }) {
  const p = k.proje as Proje;
  const [ad, setAd] = useState("");
  const [www, setWww] = useState(true);
  const [ekleniyor, setEkleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [saglayicilar, setSaglayicilar] = useState<Record<string, string | null>>({});
  const guncelle = (l: AlanAdi[], s?: Record<string, string | null>) => { k.setProje((x) => (x ? { ...x, alanAdlari: l } : x)); if (s) setSaglayicilar((e) => ({ ...e, ...s })); };

  const ekle = async () => {
    setEkleniyor(true); setHata("");
    try {
      const v = await api<{ alanAdi: AlanAdi; saglayici: string | null }>(`/api/build/alanadi/${p.id}`, { govde: { ad, wwwYonlendir: www } });
      guncelle([...p.alanAdlari, v.alanAdi], { [v.alanAdi.ad]: v.saglayici });
      setAd("");
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Eklenemedi."); } finally { setEkleniyor(false); }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
        <p className="text-[14px] font-semibold text-white">Kendi alan adını bağla</p>
        <p className="mt-0.5 text-[12.5px] text-white/50">kahvecim.com ya da magaza.kahvecim.com.tr gibi; kök alan adı ya da alt alan adı olabilir.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (ad.trim()) ekle(); }} className="mt-3 flex gap-2 max-sm:flex-col">
          <input value={ad} onChange={(e) => { setAd(e.target.value); setHata(""); }} placeholder="alanadin.com" inputMode="url" autoCapitalize="none" spellCheck={false} className="h-10 min-w-0 flex-1 shrink-0 rounded-[12px] max-sm:flex-none bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-[#55d6fd]/60" />
          <button disabled={!ad.trim() || ekleniyor} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black disabled:opacity-35">{ekleniyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Bağla</button>
        </form>
        <label className="mt-2.5 flex items-center gap-2 text-[12.5px] text-white/60"><Anahtar acik={www} onDegis={setWww} etiket="www" kayit={false} />Kök alan adında www adresini de bağla</label>
        <AnimatePresence>{hata && <motion.p initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-[12.5px] text-rose-300">{hata}</motion.p>}</AnimatePresence>
      </div>

      {p.alanAdlari.map((a) => <AlanKarti key={a.ad} a={a} saglayici={saglayicilar[a.ad]} k={k} guncelle={guncelle} />)}

      {p.ekipRol !== "izleyici" && <AlanAra projeId={p.id} bagla={async (yeni) => { const v = await api<{ alanAdi: AlanAdi; saglayici: string | null }>(`/api/build/alanadi/${p.id}`, { govde: { ad: yeni, wwwYonlendir: true } }); guncelle([...p.alanAdlari, v.alanAdi], { [v.alanAdi.ad]: v.saglayici }); }} />}

      <EpostaGonderenAlan projeId={p.id} onerilen={p.alanAdlari.find((x) => x.durum === "bagli")?.ad ?? p.alanAdlari[0]?.ad} />

      {!p.alanAdlari.length && (
        <div className="rounded-[18px] bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[13px] font-medium text-white/80">Alan adın yok mu?</p>
          <p className="mt-0.5 text-[12.5px] text-white/45">Bir kayıt firmasından alıp buraya bağlayabilirsin. Yayınladığında siten şimdiden ücretsiz <span className="text-white/75">{yayinAdresi(p.ayarlar.altAlan).gorunen}</span> adresinde açılır.</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {KAYIT_FIRMALARI.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:text-white">{n}<ExternalLink className="h-3 w-3" /></a>)}
          </div>
        </div>
      )}
    </div>
  );
}
