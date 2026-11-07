"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, BrickWall, Gauge, Globe, Info, Loader2, MapPin, Plus, Route, ShieldAlert, Trash2, Zap } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { YanPanel, YiginCubuk, zamanEtiketi } from "./ortak";

type KuralTur = "hiz" | "yol-engelle" | "ulke-engelle" | "ulke-izin" | "ip-engelle";
type Kural = { id: string; tur: KuralTur; acik: boolean; olusturma: number; ad: string; not?: string; yol?: string; sinir?: number; pencere?: number; ulkeler?: string[]; ip?: string };
type Sayim = { ad: string; adet: number; engel: number; son?: number; ua?: string };
type Trafik = { kurallar: Kural[]; saldiriModu: boolean; kova: number; toplam: number; engel: number; sinav: number; hacim: { z: number; izin: number; engel: number }[]; yollar: Sayim[]; ulkeler: Sayim[]; ipler: Sayim[]; nedenler: { ad: string; adet: number }[]; ulkeBilgisi: number };
type Taslak = { tur: KuralTur; yol: string; sinir: string; pencere: string; ozelSinir: string; ulkeler: string; ip: string; not: string };

const TURLER: { id: KuralTur; ad: string; alt: string; I: typeof Gauge }[] = [
  { id: "hiz", ad: "Hız sınırı", alt: "Bir yola aynı kişiden gelen istekleri sınırla", I: Gauge },
  { id: "yol-engelle", ad: "Yolu engelle", alt: "Bu yolla başlayan bütün adresleri kapat", I: Route },
  { id: "ulke-engelle", ad: "Ülkeleri engelle", alt: "Seçtiğin ülkelerden gelenleri reddet", I: Globe },
  { id: "ulke-izin", ad: "Yalnız bu ülkeler", alt: "Listede olmayan ülkelerden gelenleri reddet", I: MapPin },
  { id: "ip-engelle", ad: "IP engelle", alt: "Bir IP adresini ya da günlükteki IP özetini engelle", I: Ban },
];
const SINIRLAR = [{ id: "10", ad: "10 istek" }, { id: "30", ad: "30 istek" }, { id: "60", ad: "60 istek" }, { id: "300", ad: "300 istek" }, { id: "ozel", ad: "Özel" }];
const PENCERELER = [{ id: "10", ad: "10 saniyede" }, { id: "60", ad: "dakikada" }, { id: "3600", ad: "saatte" }];
const ZAMANLAR = [{ id: "1s", ad: "Son 1 saat" }, { id: "24s", ad: "Son 24 saat" }, { id: "7g", ad: "Son 7 gün" }, { id: "14g", ad: "Son 14 gün" }];
const BOS: Taslak = { tur: "hiz", yol: "/api", sinir: "60", pencere: "60", ozelSinir: "120", ulkeler: "", ip: "", not: "" };
const ULKE_AD = (k: string) => { try { return new Intl.DisplayNames(["tr"], { type: "region" }).of(k) ?? k; } catch { return k; } };
const yuzde = (a: number, b: number) => (b ? `yüzde ${Math.round((a / b) * 100)}` : "yüzde 0");

/** Bulut > Güvenlik duvarı: sade dille kurallar, saldırı modu, trafik görünümü (yollar, ülkeler, IP özetleri, engeller). */
export function GuvenlikDuvari({ p }: { p: Proje; ajana?: (m: string) => void }) {
  const [zaman, setZaman] = useState("24s");
  const [v, setV] = useState<Trafik | null>(null);
  const [panel, setPanel] = useState(false);
  const [t, setT] = useState<Taslak>(BOS);
  const [etki, setEtki] = useState<{ toplam: number; eslesen: number; ziyaretci: number; ulkeBilgisi: boolean } | null>(null);
  const [hata, setHata] = useState("");
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const getir = useCallback(() => api<Trafik>(`/api/build/bulut/${p.id}/duvar?zaman=${zaman}`).then(setV).catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Yüklenemedi.")), [p.id, zaman]);
  useEffect(() => { getir(); }, [getir]);
  const ayarla = async (g: Record<string, unknown>, ad: string) => {
    setGidiyor(ad); setHata("");
    try { await api(`/api/build/bulut/${p.id}/ayar`, { method: "PATCH", govde: g }); await getir(); return true; }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); return false; }
    finally { setGidiyor(null); }
  };
  // Kural önizlemesi: son 24 saatte kaç istek bu kurala takılırdı (kayıt yapmaz).
  useEffect(() => {
    if (!panel) { setEtki(null); return; }
    const sinir = t.sinir === "ozel" ? Number(t.ozelSinir) : Number(t.sinir);
    const kural = { tur: t.tur, ...(t.tur === "hiz" ? { yol: t.yol, sinir, pencere: Number(t.pencere) } : t.tur === "yol-engelle" ? { yol: t.yol } : t.tur === "ip-engelle" ? { ip: t.ip } : { ulkeler: t.ulkeler }) };
    const z = setTimeout(() => { api<{ toplam: number; eslesen: number; ziyaretci: number; ulkeBilgisi: boolean }>(`/api/build/bulut/${p.id}/duvar`, { govde: { kural } }).then(setEtki).catch(() => setEtki(null)); }, 350);
    return () => clearTimeout(z);
  }, [panel, t, p.id]);
  const ac = (x: Partial<Taslak>) => { setT({ ...BOS, ...x }); setHata(""); setPanel(true); };
  const ekle = async () => {
    const sinir = t.sinir === "ozel" ? Number(t.ozelSinir) : Number(t.sinir);
    const g = { tur: t.tur, not: t.not, ...(t.tur === "hiz" ? { yol: t.yol, sinir, pencere: Number(t.pencere) } : t.tur === "yol-engelle" ? { yol: t.yol } : t.tur === "ip-engelle" ? { ip: t.ip } : { ulkeler: t.ulkeler }) };
    if (await ayarla({ kuralEkle: g }, "ekle")) setPanel(false);
  };
  const onizleme = t.tur === "hiz" ? `${t.yol || "/"} ile başlayan adreslere aynı kişi ${PENCERELER.find((x) => x.id === t.pencere)?.ad} en çok ${t.sinir === "ozel" ? t.ozelSinir : t.sinir} istek yapabilir; fazlası 429 yanıtı alır.`
    : t.tur === "yol-engelle" ? `${t.yol || "/"} ile başlayan bütün adresler 403 ile kapanır.`
      : t.tur === "ulke-engelle" ? `${t.ulkeler || "Seçtiğin ülkelerden"} gelen istekler reddedilir.`
        : t.tur === "ulke-izin" ? `Yalnız ${t.ulkeler || "seçtiğin ülkelerden"} gelenler siteye girebilir.`
          : "Bu IP'den gelen bütün istekler reddedilir. Düz IP yazarsan özetlenip öyle saklanır.";

  if (!v) return <div className="flex h-40 items-center justify-center">{hata ? <p className="text-[13px] text-rose-300">{hata}</p> : <Loader2 className="h-5 w-5 animate-spin text-white/40" />}</div>;
  return (
    <div className="space-y-4">
      <Kart ikon={BrickWall} baslik="Güvenlik duvarı" alt="Kurallar yayındaki sitede her istekte sunucuda uygulanır; değişiklik anında geçerli olur, yeniden yayın gerekmez">
        <div className="flex flex-wrap items-start gap-4 px-4 py-4 sm:px-5">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", v.saldiriModu ? "bg-rose-500/[0.16] text-rose-200" : "bg-white/[0.06] text-white/60")}><ShieldAlert className="h-5 w-5" /></span>
          <div className="min-w-[220px] flex-1">
            <p className="text-[14px] font-semibold text-white">Saldırı modu {v.saldiriModu ? "açık" : "kapalı"}</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">Açıkken her ziyaretçi siteye girmeden önce birkaç saniyelik bir tarayıcı denetiminden geçer; JavaScript çalıştırmayan botlar sayfayı göremez. Denetimi geçen ziyaretçi bir saat boyunca yeniden sorulmaz. Saldırı bitince kapat.</p>
          </div>
          {gidiyor === "saldiri" ? <Loader2 className="mt-2 h-4 w-4 animate-spin text-white/40" /> : <Anahtar acik={v.saldiriModu} set={(x) => ayarla({ saldiriModu: x }, "saldiri")} etiket="Saldırı modu" />}
        </div>
      </Kart>

      <Kart ikon={Zap} baslik="Kurallar" alt={v.kurallar.length ? `${v.kurallar.filter((k) => k.acik).length} açık kural` : "Henüz kural yok"} sag={<button type="button" onClick={() => ac({})} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-3.5 w-3.5" /><span className="max-sm:hidden">Kural ekle</span></button>}>
        {!v.kurallar.length ? (
          <div className="grid gap-2 p-4 sm:grid-cols-3 sm:p-5">
            {[{ ad: "API'ye hız sınırı", alt: "/api için dakikada 60 istek", x: { tur: "hiz" as const, yol: "/api", sinir: "60", pencere: "60" } }, { ad: "Yönetim yolunu kapat", alt: "/admin ile başlayanları engelle", x: { tur: "yol-engelle" as const, yol: "/admin" } }, { ad: "Yalnız Türkiye", alt: "Başka ülkelerden geleni reddet", x: { tur: "ulke-izin" as const, ulkeler: "TR" } }].map((o) => (
              <button key={o.ad} type="button" onClick={() => ac(o.x)} className="rounded-[16px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]"><span className="block text-[13px] font-medium text-white">{o.ad}</span><span className="block text-[12px] text-white/45">{o.alt}</span></button>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            <AnimatePresence initial={false}>
              {v.kurallar.map((k) => {
                const T = TURLER.find((x) => x.id === k.tur)!;
                const sayi = v.nedenler.find((n) => n.ad === k.ad)?.adet ?? 0;
                return (
                  <motion.div key={k.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", !k.acik && "opacity-55")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/70"><T.I className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{k.ad}</span><span className="block truncate text-[12px] text-white/45">{T.ad}{k.tur === "ip-engelle" ? `, özet ${k.ip}` : ""}{k.not ? `, ${k.not}` : ""} · {gorece(k.olusturma)} eklendi{sayi ? ` · bu aralıkta ${sayi} istek durdurdu` : ""}</span></span>
                    <Anahtar acik={k.acik} set={(x) => ayarla({ kuralGuncelle: { id: k.id, acik: x } }, k.id)} etiket={`${k.ad} açık`} />
                    <button type="button" onClick={() => ayarla({ kuralSil: k.id }, k.id)} aria-label="Kuralı sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        {hata && !panel && <p className="border-t border-white/[0.06] px-5 py-2.5 text-[12.5px] text-rose-300">{hata}</p>}
      </Kart>

      <Kart ikon={Globe} baslik="Trafik" alt={`${v.toplam.toLocaleString("tr-TR")} istek, ${v.engel.toLocaleString("tr-TR")} engellendi (${yuzde(v.engel, v.toplam)})${v.sinav ? `, ${v.sinav} sınav sayfası` : ""}`} sag={<div className="w-[160px]"><AcilirSecim deger={zaman} set={setZaman} l={ZAMANLAR} /></div>}>
        <div className="border-b border-white/[0.06] p-4 sm:p-5">
          <YiginCubuk veri={v.hacim} seriler={[{ anahtar: "engel", ad: "Engellenen ya da sınanan", renk: "#e8546c" }, { anahtar: "izin", ad: "İzin verilen", renk: "#1e9fcf" }]} yukseklik={120} etiket={(z) => zamanEtiketi(z, v.kova)} ipucuBaslik={(z) => new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} />
        </div>
        {!v.ulkeBilgisi && (v.kurallar.some((k) => k.tur.startsWith("ulke")) || v.toplam > 0) && <p className="flex items-start gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-[12.5px] leading-relaxed text-white/55 sm:px-5"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8be6ff]" />Bu aralıktaki isteklerde ülke bilgisi yok. Ülke kuralları yalnız barındırma katmanı (Vercel ya da Cloudflare) ülke başlığı eklediğinde çalışır; bilgi gelmeyen istekler engellenmez.</p>}
        <div className="grid divide-white/[0.06] lg:grid-cols-3 lg:divide-x">
          <Liste baslik="En çok istenen yollar" l={v.yollar} bos="Henüz istek yok" eylem={(x) => ({ ad: "Sınırla", f: () => ac({ tur: "hiz", yol: x.ad }) })} ikinci={(x) => ({ ad: "Engelle", f: () => ac({ tur: "yol-engelle", yol: x.ad }) })} mono />
          <Liste baslik="Ülkeler" l={v.ulkeler.map((x) => ({ ...x, gorunen: `${ULKE_AD(x.ad)} (${x.ad})` }))} bos="Ülke bilgisi gelmedi" eylem={(x) => ({ ad: "Engelle", f: () => ac({ tur: "ulke-engelle", ulkeler: x.ad }) })} />
          <Liste baslik="IP özetleri" l={v.ipler.map((x) => ({ ...x, alt: x.ua }))} bos="Henüz istek yok" eylem={(x) => ({ ad: "Engelle", f: () => ac({ tur: "ip-engelle", ip: x.ad }) })} mono />
        </div>
        {v.nedenler.length > 0 && (
          <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
            <p className="mb-1.5 text-[12.5px] font-medium text-white/55">Engelleme nedenleri</p>
            <div className="flex flex-wrap gap-1.5">{v.nedenler.map((n) => <span key={n.ad} className="rounded-full bg-rose-500/[0.1] px-2.5 py-1 text-[12px] text-rose-100">{n.ad}: {n.adet.toLocaleString("tr-TR")}</span>)}</div>
          </div>
        )}
        <p className="border-t border-white/[0.06] px-4 py-2.5 text-[11.5px] text-white/40 sm:px-5">IP adresleri saklanmaz; her proje için ayrı tuzla özetlenir. Aynı kişinin istekleri aynı özetle görünür.</p>
      </Kart>

      <YanPanel acik={panel} kapat={() => setPanel(false)} baslik="Kural ekle" alt="Ne istediğini seç, ayrıntıyı doldur"
        alt2={<button type="button" onClick={ekle} disabled={gidiyor === "ekle"} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor === "ekle" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Kuralı ekle</button>}>
        <div className="space-y-5">
          <div className="grid gap-2">
            {TURLER.map((x) => (
              <button key={x.id} type="button" onClick={() => setT({ ...t, tur: x.id })} className={cn("flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors", t.tur === x.id ? "bg-white/[0.07] ring-1 ring-inset ring-white" : "bg-white/[0.025] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]")}>
                <x.I className="h-4 w-4 shrink-0 text-white/70" /><span className="min-w-0"><span className="block text-[13.5px] text-white">{x.ad}</span><span className="block text-[12px] text-white/45">{x.alt}</span></span>
              </button>
            ))}
          </div>
          {(t.tur === "hiz" || t.tur === "yol-engelle") && <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Bu yolla başlayan adresler</span><input value={t.yol} onChange={(e) => setT({ ...t, yol: e.target.value })} placeholder={t.tur === "hiz" ? "/api ya da bütün site için /" : "/admin"} className={cn(alanSinif, "h-10 font-mono text-[13px]")} /></label>}
          {t.tur === "hiz" && (
            <div className="space-y-2"><span className="block text-[12.5px] text-white/55">Aynı kişiden</span>
              <div className="flex flex-wrap items-center gap-2">
                <Secici id="duvar-pencere" kucuk deger={t.pencere} set={(x) => setT({ ...t, pencere: x })} l={PENCERELER} />
                <span className="text-[12.5px] text-white/50">en çok</span>
                <div className="w-[130px]"><AcilirSecim deger={t.sinir} set={(x) => setT({ ...t, sinir: x })} l={SINIRLAR} /></div>
                {t.sinir === "ozel" && <input type="number" min={1} max={10000} value={t.ozelSinir} onChange={(e) => setT({ ...t, ozelSinir: e.target.value })} className={cn(alanSinif, "h-10 w-24")} />}
              </div>
            </div>
          )}
          {(t.tur === "ulke-engelle" || t.tur === "ulke-izin") && <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Ülke kodları, virgülle</span><input value={t.ulkeler} onChange={(e) => setT({ ...t, ulkeler: e.target.value.toUpperCase() })} placeholder="TR, DE, NL" className={cn(alanSinif, "h-10 font-mono text-[13px]")} /></label>}
          {t.tur === "ip-engelle" && <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">IP adresi ya da IP özeti</span><input value={t.ip} onChange={(e) => setT({ ...t, ip: e.target.value.trim() })} placeholder="203.0.113.7 ya da günlükteki 12 karakterlik özet" className={cn(alanSinif, "h-10 font-mono text-[13px]")} /></label>}
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Not (isteğe bağlı)</span><input value={t.not} onChange={(e) => setT({ ...t, not: e.target.value })} maxLength={120} placeholder="Neden eklediğini hatırlamak için" className={cn(alanSinif, "h-10 text-[13px]")} /></label>
          <p className="rounded-[14px] bg-[#55d6fd]/[0.06] p-3 text-[12.5px] leading-relaxed text-white/75 ring-1 ring-inset ring-[#55d6fd]/20">{onizleme}</p>
          {etki && <p className={cn("rounded-[14px] p-3 text-[12.5px] leading-relaxed ring-1 ring-inset", etki.eslesen ? "bg-amber-400/[0.06] text-amber-50/85 ring-amber-300/15" : "bg-white/[0.03] text-white/65 ring-white/[0.07]")}>{!etki.toplam ? "Son 24 saatte istek yok; etkisi henüz ölçülemiyor." : (t.tur === "ulke-engelle" || t.tur === "ulke-izin") && !etki.ulkeBilgisi ? "Günlüklerde ülke bilgisi yok (barındırma katmanı bildirmiyor); bu kural şu an hiçbir isteği etkilemez." : etki.eslesen ? `Son 24 saatteki ${etki.toplam.toLocaleString("tr-TR")} istekten ${etki.eslesen.toLocaleString("tr-TR")} tanesi bu kurala takılırdı (${etki.ziyaretci} farklı ziyaretçi).` : `Son 24 saatteki ${etki.toplam.toLocaleString("tr-TR")} isteğin hiçbiri bu kurala takılmazdı.`}</p>}
          {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        </div>
      </YanPanel>
    </div>
  );
}

function Liste({ baslik, l, bos, eylem, ikinci, mono }: { baslik: string; l: (Sayim & { gorunen?: string; alt?: string })[]; bos: string; eylem: (x: Sayim) => { ad: string; f: () => void }; ikinci?: (x: Sayim) => { ad: string; f: () => void }; mono?: boolean }) {
  const en = Math.max(1, ...l.map((x) => x.adet));
  return (
    <section className="border-b border-white/[0.06] p-4 lg:border-b-0">
      <h4 className="mb-2 text-[13px] font-semibold text-white">{baslik}</h4>
      {!l.length ? <p className="text-[12.5px] text-white/40">{bos}</p> : (
        <ul className="space-y-1">
          {l.slice(0, 8).map((x) => {
            const a = eylem(x), b = ikinci?.(x);
            return (
              <li key={x.ad} className="group relative flex items-center gap-2 overflow-hidden rounded-[8px] px-2 py-1.5 text-[12.5px]">
                <span className="absolute inset-y-0 left-0 rounded-[8px] bg-[#1e9fcf]/[0.14]" style={{ width: `${(x.adet / en) * 100}%` }} />
                <span className="relative min-w-0 flex-1"><span className={cn("block truncate text-white/85", mono && "font-mono text-[12px]")}>{x.gorunen ?? x.ad}</span>{x.alt && <span className="block truncate text-[11px] text-white/40">{x.alt}</span>}</span>
                {x.engel > 0 && <span className="relative shrink-0 text-[11px] text-rose-200">{x.engel} engel</span>}
                <span className="relative shrink-0 tabular-nums text-white/55 group-hover:hidden">{x.adet.toLocaleString("tr-TR")}</span>
                <span className="relative hidden shrink-0 gap-1 group-hover:flex">
                  {b && <button type="button" onClick={b.f} className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[11.5px] text-white hover:bg-white/[0.16]">{b.ad}</button>}
                  <button type="button" onClick={a.f} className="rounded-full bg-white/[0.1] px-2 py-0.5 text-[11.5px] text-white hover:bg-white/[0.16]">{a.ad}</button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
