"use client";

import { dilimSaat, dilimTarih } from "@/lib/build/bolge";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BellRing, CalendarClock, Check, Copy, Download, KeyRound, ListOrdered, Plus, Send, Unplug, X, Zap } from "lucide-react";
import { KANAL_HEDEF, type SosyalHesap } from "@/lib/build/buyumeKanalTipler";
import { oauthAc } from "./GoogleIsletme";
import { HAFTA_GUN, siradakiSaat, VARSAYILAN_SAATLER, type PaylasimSaatleri, type Saat } from "@/lib/build/buyumeEkTipler";
import { gonderiKanalAdi, gonderiMetni, icerikKanali, type Gonderi, type IcerikKanalId } from "@/lib/build/buyumeTipler";
import { cn } from "@/lib/utils";
import { alan, birincil, Etiket, Halka, HataSatiri, ikincil, Kart, KanalLogo, Rozet, simgeDugme, turkceTarih, useKopyala, YanPanel } from "./ortak";

/** Kanal için seçili otomatik paylaşım hedefleri (sunucudaki hedefleriBul ile aynı kural). */
function hedefler(hesaplar: SosyalHesap[], kanal: string) {
  const turler = KANAL_HEDEF[kanal] ?? [];
  return hesaplar.flatMap((h) => h.hedefler.filter((x) => (h.secili ?? []).includes(x.id) && (turler.includes(x.tur) || (kanal === "instagram" && x.tur === "facebook"))));
}
import { takipAdresi } from "./Icerik";
import type { BolumProps } from "./BuyumeSekme";

const AGLAR: { id: "meta" | "x" | "linkedin" | "tiktok"; ad: string; logolar: string[]; adimlar: string[]; portal: string; inceleme: string }[] = [
  { id: "meta", ad: "Instagram ve Facebook", logolar: ["/marka/renkli/instagram-color.svg", "/marka/renkli/meta-color.svg"], portal: "https://developers.facebook.com/apps",
    inceleme: "Instagram'a başkası adına yayın için Meta App Review (her izin için demo videosu) ve Business Verification gerekir; yalnız Professional hesaplara, 24 saatte en çok 50 gönderi.",
    adimlar: ["developers.facebook.com'da İşletme türünde uygulama oluştur.", "Facebook Login ve Instagram Graph API ürünlerini ekle; pages_manage_posts, pages_show_list, instagram_basic ve instagram_content_publish izinlerini iste.", "Facebook Login ayarında geçerli OAuth yönlendirme adresine aşağıdaki geri dönüş adresini yaz.", "Uygulama kimliğini ve gizli anahtarı sunucuya META_APP_ID ve META_APP_SECRET olarak ekle.", "Instagram hesabın profesyonel olmalı ve bir Facebook Sayfasına bağlı olmalı."] },
  { id: "x", ad: "X", logolar: ["/marka/renkli/x-beyaz.svg"], portal: "https://developer.x.com/en/portal/dashboard",
    inceleme: "X API gönderi yazmak için ücretli erişim kademesi ister; kademe sınırları X geliştirici sayfasında.",
    adimlar: ["developer.x.com'da proje ve uygulama oluştur.", "User authentication settings bölümünde OAuth 2.0'ı aç (Web App, gizli istemci); okuma ve yazma iznini seç.", "Callback adresine aşağıdaki geri dönüş adresini yaz.", "İstemci kimliğini ve gizli anahtarı X_CLIENT_ID ve X_CLIENT_SECRET olarak ekle."] },
  { id: "linkedin", ad: "LinkedIn", logolar: ["/marka/renkli/linkedin-color.svg"], portal: "https://www.linkedin.com/developers/apps",
    inceleme: "Şirket sayfasına yayın Community Management API erişimi ister; LinkedIn başvuruyu inceler.",
    adimlar: ["linkedin.com/developers'ta uygulama oluştur ve şirket sayfanı bağla.", "Sign In with LinkedIn using OpenID Connect ve Share on LinkedIn ürünlerini ekle. Şirket sayfasına yayın için Community Management API'yi iste; onaylanınca sunucuda LINKEDIN_KURUM_IZNI değişkenini 1 yap.", "Auth sekmesinde yetkili yönlendirme adresine aşağıdaki geri dönüş adresini yaz.", "İstemci kimliğini ve gizli anahtarı LINKEDIN_CLIENT_ID ve LINKEDIN_CLIENT_SECRET olarak ekle."] },
  { id: "tiktok", ad: "TikTok", logolar: ["/marka/renkli/tiktok-color.svg"], portal: "https://developers.tiktok.com/apps",
    inceleme: "Denetlenmemiş uygulamalar yalnız gizli (yalnız ben) gönderi atabilir; herkese açık yayın için TikTok denetimi gerekir.",
    adimlar: ["developers.tiktok.com'da uygulama oluştur; Login Kit ve Content Posting API ürünlerini ekle, Direct Post'u aç.", "video.publish kapsamını iste; görsellerin çekileceği alan adını URL properties bölümünde doğrula.", "Redirect URI olarak aşağıdaki geri dönüş adresini yaz.", "İstemci anahtarını ve gizli anahtarı TIKTOK_CLIENT_KEY ve TIKTOK_CLIENT_SECRET olarak ekle."] },
];
const SAAT_KANALLARI: IcerikKanalId[] = ["instagram", "hikaye", "tiktok", "linkedin", "x", "whatsapp"];
/** Platformu açan adres (metni önceden dolduran yerlerde metinle). */
function platformAdresi(g: Gonderi, metin: string): { adres: string; dolu: boolean } | null {
  const e = encodeURIComponent(metin);
  switch (g.kanal) {
    case "x": return { adres: `https://x.com/intent/post?text=${e}`, dolu: true };
    case "linkedin": return { adres: `https://www.linkedin.com/feed/?shareActive=true&text=${e}`, dolu: true };
    case "whatsapp": return { adres: `https://wa.me/?text=${e}`, dolu: true };
    case "instagram": case "hikaye": return { adres: "https://www.instagram.com/", dolu: false };
    case "tiktok": return { adres: "https://www.tiktok.com/upload", dolu: false };
    default: return null;
  }
}

export function PaylasimBolumu({ p, b, e, git }: BolumProps) {
  const d = e.d!;
  const v = b.veri!;
  const [kurulum, setKurulum] = useState<string | null>(null);
  const [elle, setElle] = useState<string | null>(null);
  const [saatler, setSaatler] = useState<PaylasimSaatleri>(() => (Object.keys(d.ek.saatler).length ? d.ek.saatler : VARSAYILAN_SAATLER));
  const [saatKirli, setSaatKirli] = useState(false);
  const [hata, setHata] = useState("");
  const tz = d.isletme.saatDilimi || "UTC";
  const bugun = dilimTarih(Date.now(), tz);
  const simdi = dilimSaat(Date.now(), tz);
  const kuyruk = useMemo(() => v.gonderiler.filter((g) => g.tarih && g.durum !== "paylasildi").sort((a, c) => `${a.tarih} ${a.saat ?? "99"}`.localeCompare(`${c.tarih} ${c.saat ?? "99"}`)), [v.gonderiler]);
  const sirasiz = v.gonderiler.filter((g) => !g.tarih && g.durum === "hazir");
  const gelen = kuyruk.filter((g) => g.durum === "hazir" && (g.tarih! < bugun || (g.tarih === bugun && (!g.saat || g.saat <= simdi))));
  const gonderiGuncelle = (id: string, y: Partial<Gonderi>) => b.degistir((x) => { const g = x.gonderiler.find((z) => z.id === id); if (g) Object.assign(g, y); }, { gonderi: { id, ...y } });
  const siraya = async (l: Gonderi[]) => {
    setHata("");
    const dolu = new Set(v.gonderiler.filter((g) => g.tarih && g.saat).map((g) => `${g.tarih} ${g.saat}`));
    let yok = 0;
    for (const g of l) {
      const s = siradakiSaat(saatler[g.kanal] ?? [], dolu, Date.now(), tz);
      if (!s) { yok++; continue; }
      dolu.add(`${s.tarih} ${s.saat}`);
      await gonderiGuncelle(g.id, { tarih: s.tarih, saat: s.saat });
    }
    if (yok) setHata(`${yok} gönderinin kanalı için paylaşım saati yok; aşağıdan saat ekle.`);
  };
  const gruplar = useMemo(() => { const m = new Map<string, Gonderi[]>(); for (const g of kuyruk) m.set(g.tarih!, [...(m.get(g.tarih!) ?? []), g]); return [...m.entries()].slice(0, 21); }, [kuyruk]);
  const acikGonderi = v.gonderiler.find((g) => g.id === elle) ?? null;

  return (
    <div className="space-y-4">
      <Kart baslik="Paylaşım" aciklama="Hazır gönderiler kanalın paylaşım saatlerine dizilir. Saati gelince elle paylaşım yardımcısı metni kopyalar, görseli indirir ve platformu açar; paylaştığını işaretlersin.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {AGLAR.map((a) => { const s = d.sosyalDurum.find((x) => x.ag === a.id); const h = d.ek.sosyal.find((x) => x.ag === a.id); return (
            <li key={a.id} className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <span className="flex -space-x-1.5">{a.logolar.map((l) => <span key={l} className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#1a1b1f] ring-2 ring-[#141518]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={l} alt="" className="h-5 w-5 object-contain" /></span>)}</span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">{a.ad}</span><span className={cn("block truncate text-[11.5px]", h?.sonHata ? "text-rose-200/80" : "text-white/50")}>{h ? (h.sonHata ? `Son hata: ${h.sonHata}` : `${h.ad}, ${(h.secili ?? []).length} hedef seçili`) : s?.anahtar ? "Bağlı değil" : "Uygulama anahtarı yok"}</span></span>
              {h || !s?.anahtar ? <button type="button" onClick={() => setKurulum(a.id)} className={cn(ikincil, "h-8 px-3 text-[12px]")}><KeyRound className="h-3.5 w-3.5" />{h ? "Ayarlar" : "Kurulum"}</button>
                : <button type="button" disabled={e.suruyor(`bagla-${a.id}`)} onClick={async () => { setHata(""); try { const j = await e.islem("sosyal-bagla", { ag: a.id }, `bagla-${a.id}`); oauthAc(String(j.adres)); } catch (x) { setHata(x instanceof Error ? x.message : "Bağlanamadı."); } }} className={cn(birincil, "h-8 px-3 text-[12px]")}>{e.suruyor(`bagla-${a.id}`) ? <span className="build-nokta" /> : null}Bağla</button>}
            </li>
          ); })}
        </ul>
        <button type="button" role="switch" aria-checked={d.ek.sosyalOtomatik} disabled={!d.ek.sosyal.length} onClick={() => e.duzenle("sosyalOtomatik", { acik: !d.ek.sosyalOtomatik }).catch((x) => setHata(x.message))} className="mt-3 flex w-full items-start gap-2.5 rounded-[14px] bg-white/[0.03] p-3 text-left ring-1 ring-inset ring-white/[0.07] disabled:opacity-50">
          <span className="mt-0.5"><Halka dolu={d.ek.sosyalOtomatik} boyut={18} /></span>
          <span><span className="flex items-center gap-1.5 text-[13px] text-white"><Zap className="h-3.5 w-3.5 text-[#8be6ff]" />Otomatik paylaşım</span><span className="block text-[11.5px] leading-relaxed text-white/50">{d.ek.sosyal.length ? "Hazır durumdaki gönderi, tarihi ve saati gelince bağlı hesaplardaki seçili hedeflere paylaşılır ve Paylaşıldı olur. Başarısız olursa 3 kez yeniden denenir." : "Önce en az bir hesap bağla."}</span></span>
        </button>
      </Kart>
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>

      {gelen.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 rounded-[16px] bg-[#55d6fd]/[0.07] px-4 py-3 ring-1 ring-inset ring-[#55d6fd]/20">
          <BellRing className="h-4 w-4 shrink-0 text-[#8be6ff]" /><p className="min-w-[200px] flex-1 text-[13px] text-white">{gelen.length} gönderinin paylaşım saati geldi.</p>
          <button type="button" onClick={() => setElle(gelen[0].id)} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><Send className="h-3.5 w-3.5" />Sıradakini paylaş</button>
        </motion.div>
      )}

      <Kart baslik={<span className="flex items-center gap-2">Kuyruk<Rozet>{kuyruk.length}</Rozet></span>} aciklama="Tarihi olan ve henüz paylaşılmamış gönderiler."
        sag={sirasiz.length > 0 ? <button type="button" onClick={() => siraya(sirasiz)} className={cn(birincil, "h-8 px-3 text-[12.5px]")}><ListOrdered className="h-3.5 w-3.5" />{sirasiz.length} hazır gönderiyi sıraya koy</button> : undefined}>
        {gruplar.length ? (
          <div className="space-y-3">
            {gruplar.map(([tarih, l]) => (
              <div key={tarih}>
                <p className={cn("mb-1.5 text-[12px]", tarih === bugun ? "font-medium text-[#8be6ff]" : tarih < bugun ? "text-amber-200/80" : "text-white/50")}>{tarih === bugun ? "Bugün" : turkceTarih(tarih)}{tarih < bugun && ", gecikti"}</p>
                <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
                  {l.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-white/[0.05]">{g.gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={g.gorsel} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center"><KanalLogo kanal={icerikKanali(g.kanal).plan} boyut={26} /></span>}</span>
                      <span className="min-w-[160px] flex-1"><span className="flex items-center gap-1.5 text-[12px] text-white/50">{g.gorsel && <KanalLogo kanal={icerikKanali(g.kanal).plan} boyut={16} className="rounded-[5px]" />}{gonderiKanalAdi(g)}{g.durum === "taslak" && <Rozet ton="soluk" className="h-4 px-1.5 text-[10.5px]">Taslak</Rozet>}</span><span className="block truncate text-[13px] text-white">{g.baslik || g.metin.split("\n")[0]}</span></span>
                      <span className="flex shrink-0 items-center gap-2 max-sm:ml-auto"><label className="flex h-8 shrink-0 items-center rounded-full bg-white/[0.05] px-2.5 ring-1 ring-inset ring-white/[0.08]"><input type="time" value={g.saat ?? ""} onChange={(x) => gonderiGuncelle(g.id, { saat: x.target.value || undefined })} className="w-[78px] bg-transparent text-[12.5px] tabular-nums text-white outline-none [color-scheme:dark]" aria-label="Paylaşım saati" /></label>
                      {(() => { const hd = hedefler(d.ek.sosyal, g.kanal); const kayit = hd.map((x) => d.ek.yayinlar[`${g.id}:${x.id}`]).find((k) => k?.durum === "hata"); return hd.length ? <>
                        {kayit ? <span title={kayit.hata}><Rozet ton="rose">Hata</Rozet></span> : d.ek.sosyalOtomatik && g.durum === "hazir" ? <Rozet ton="aksan"><Zap className="h-3 w-3" />Otomatik</Rozet> : null}
                        <button type="button" disabled={e.suruyor(`paylas-${g.id}`)} onClick={async () => { setHata(""); try { const j = await e.islem("sosyal-paylas", { gonderiId: g.id }, `paylas-${g.id}`); await b.yukle(); if (j.not) setHata(String(j.not)); } catch (x) { setHata(x instanceof Error ? x.message : "Paylaşılamadı."); } }} className={cn(birincil, "h-8 px-3 text-[12px]")}>{e.suruyor(`paylas-${g.id}`) ? <span className="build-nokta" /> : null}Şimdi paylaş</button>
                      </> : <button type="button" onClick={() => setElle(g.id)} className={cn(g.durum === "hazir" ? birincil : ikincil, "h-8 px-3 text-[12px]")}>Paylaş</button>; })()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]"><CalendarClock className="h-5 w-5 text-[#8be6ff]" /><p className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed text-white/55">Kuyruk boş. Gönderileri Hazır olarak işaretle ve sıraya koy, ya da Takvim'den tarih ver.</p><button type="button" onClick={() => git("icerik")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Gönderilere git</button></div>
        )}
      </Kart>

      <Kart baslik="Paylaşım saatleri" aciklama={`Sıraya koyulan her gönderi kanalının sıradaki boş saatine yerleşir (${tz.replace(/_/g, " ")} saati).`}
        sag={<><button type="button" onClick={() => { setSaatler(VARSAYILAN_SAATLER); setSaatKirli(true); }} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Önerilen saatler</button><button type="button" disabled={!saatKirli} onClick={async () => { try { await e.duzenle("saatler", { saatler }); setSaatKirli(false); } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); } }} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>Kaydet</button></>}>
        <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
          {SAAT_KANALLARI.map((k) => <SaatSatiri key={k} kanal={k} l={saatler[k] ?? []} set={(l) => { setSaatler({ ...saatler, [k]: l }); setSaatKirli(true); }} />)}
        </ul>
      </Kart>

      <YanPanel acik={!!kurulum} kapat={() => setKurulum(null)} baslik={AGLAR.find((a) => a.id === kurulum)?.ad ?? ""} alt="Otomatik paylaşım için gereken uygulama ve izinler">
        {kurulum && (() => { const a = AGLAR.find((x) => x.id === kurulum)!; const s = d.sosyal.find((x) => x.id === a.id); const sd = d.sosyalDurum.find((x) => x.ag === a.id); const h = d.ek.sosyal.find((x) => x.ag === a.id); return (
          <div className="space-y-4">
            {h && <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <div className="flex items-center gap-2.5">{h.resim && /* eslint-disable-next-line @next/next/no-img-element */ <img src={h.resim} alt="" className="h-8 w-8 rounded-full object-cover" />}<span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{h.ad}</span><span className="block text-[11.5px] text-white/45">{new Date(h.bagli).toLocaleDateString("tr-TR")} tarihinde bağlandı{h.sureBitis ? `, izin ${new Date(h.sureBitis).toLocaleDateString("tr-TR")} tarihine kadar` : ""}</span></span>
                <button type="button" onClick={() => e.islem("sosyal-kes", { ag: a.id }).then(() => setKurulum(null)).catch((x) => setHata(x.message))} className={cn(ikincil, "h-8 px-3 text-[12px]")}><Unplug className="h-3.5 w-3.5" />Kes</button></div>
              <p className="mb-1.5 mt-3 text-[12px] text-white/50">Otomatik paylaşımda kullanılacak hedefler</p>
              <ul className="space-y-1">{h.hedefler.map((x) => { const sec = (h.secili ?? []).includes(x.id); return <li key={x.id}><button type="button" role="checkbox" aria-checked={sec} onClick={() => e.duzenle("sosyalSecili", { ag: a.id, secili: sec ? (h.secili ?? []).filter((y) => y !== x.id) : [...(h.secili ?? []), x.id] }).catch((z) => setHata(z.message))} className="flex w-full items-center gap-2.5 rounded-[10px] px-1 py-1.5 text-left"><Halka dolu={sec} boyut={17} /><span className="min-w-0 flex-1 truncate text-[12.5px] text-white/85">{x.ad}</span><span className="text-[11px] text-white/40">{({ facebook: "Facebook Sayfası", instagram: "Instagram", kisi: "Kişisel profil", kurum: "Şirket sayfası", x: "X hesabı", tiktok: "TikTok" } as const)[x.tur]}</span></button></li>; })}</ul>
              {!h.hedefler.length && <p className="text-[12px] text-amber-100/80">Bu hesapta paylaşım yapılabilecek sayfa ya da profil bulunamadı.</p>}
            </div>}
            {!h && sd?.anahtar && <button type="button" onClick={async () => { try { const j = await e.islem("sosyal-bagla", { ag: a.id }); oauthAc(String(j.adres)); } catch (x) { setHata(x instanceof Error ? x.message : "Bağlanamadı."); } }} className={cn(birincil, "w-full justify-center")}>{a.ad} hesabını bağla</button>}
            {!h && !sd?.anahtar && <p className="rounded-[12px] bg-amber-400/[0.06] px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-100/90 ring-1 ring-inset ring-amber-300/15">Bu sunucuda {a.ad} uygulama anahtarı yok; hesap bağlanamaz. O zamana kadar gönderiler elle paylaşım yardımcısıyla paylaşılır.</p>}
            {sd && <div className="rounded-[12px] bg-white/[0.03] px-3 py-2 ring-1 ring-inset ring-white/[0.07]"><p className="text-[11.5px] text-white/45">Geri dönüş adresi</p><code className="sc-kod block break-all text-[12px] text-white/85">{sd.donus}</code></div>}
            <ol className="space-y-2.5">{a.adimlar.map((x, i) => <li key={x} className="flex gap-2.5 text-[13px] leading-relaxed text-white/85"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white">{i + 1}</span>{x}</li>)}</ol>
            <p className="text-[12.5px] leading-relaxed text-white/55">{a.inceleme}</p>
            <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]"><p className="text-[12px] text-white/45">Sunucudaki durum</p>{s?.eksik.length ? <ul className="mt-1.5 space-y-1">{s.eksik.map((x) => <li key={x} className="flex items-center gap-2 text-[12.5px] text-white/75"><X className="h-3.5 w-3.5 text-rose-300" /><code className="sc-kod text-[12px]">{x}</code> tanımlı değil</li>)}</ul> : <p className="mt-1 flex items-center gap-2 text-[12.5px] text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Anahtarlar tanımlı</p>}</div>
            <a href={a.portal} target="_blank" rel="noopener noreferrer" className={cn(ikincil, "w-full justify-center")}>Geliştirici sayfasını aç<ArrowUpRight className="h-3.5 w-3.5" /></a>
          </div>
        ); })()}
      </YanPanel>
      <EllePaylas p={p} g={acikGonderi} kapat={() => setElle(null)} isaretle={async (adres) => { if (!acikGonderi) return; await gonderiGuncelle(acikGonderi.id, { durum: "paylasildi", ...(adres ? { paylasimAdresi: adres } : {}) }); const sonraki = gelen.find((x) => x.id !== acikGonderi.id); setElle(sonraki?.id ?? null); }} eposta={() => { setElle(null); git("eposta"); }} />
    </div>
  );
}

function SaatSatiri({ kanal, l, set }: { kanal: IcerikKanalId; l: Saat[]; set: (l: Saat[]) => void }) {
  const [gun, setGun] = useState(0); const [saat, setSaat] = useState("19:00");
  return (
    <li className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5">
      <span className="flex w-full shrink-0 items-center gap-2 sm:w-[150px]"><KanalLogo kanal={icerikKanali(kanal).plan} boyut={24} className="rounded-[7px]" /><span className="truncate text-[12.5px] text-white">{icerikKanali(kanal).ad}</span></span>
      <span className="flex min-w-[180px] flex-1 flex-wrap gap-1">
        {[...l].sort((a, b) => a.gun - b.gun || a.saat.localeCompare(b.saat)).map((s) => <span key={`${s.gun}-${s.saat}`} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/[0.06] pl-2.5 pr-1 text-[12px] tabular-nums text-white/85">{HAFTA_GUN[s.gun]} {s.saat}<button type="button" onClick={() => set(l.filter((x) => !(x.gun === s.gun && x.saat === s.saat)))} aria-label="Saati kaldır" className="flex h-5 w-5 items-center justify-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"><X className="h-3 w-3" /></button></span>)}
        {!l.length && <span className="text-[12px] text-white/40">Saat yok</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <select value={gun} onChange={(x) => setGun(Number(x.target.value))} className="h-7 rounded-full bg-white/[0.05] px-2 text-[12px] text-white outline-none ring-1 ring-inset ring-white/[0.08] [color-scheme:dark]" aria-label="Gün">{HAFTA_GUN.map((g, i) => <option key={g} value={i}>{g}</option>)}</select>
        <input type="time" value={saat} onChange={(x) => setSaat(x.target.value)} className="h-7 w-[84px] rounded-full bg-white/[0.05] px-2 text-[12px] tabular-nums text-white outline-none ring-1 ring-inset ring-white/[0.08] [color-scheme:dark]" aria-label="Saat" />
        <button type="button" disabled={!saat || l.some((x) => x.gun === gun && x.saat === saat) || l.length >= 28} onClick={() => set([...l, { gun, saat }])} className={cn(simgeDugme, "h-7 w-7")} aria-label="Saat ekle"><Plus className="h-3.5 w-3.5" /></button>
      </span>
    </li>
  );
}

/** Elle paylaşım yardımcısı (Buffer "notification publishing" karşılığı). */
function EllePaylas({ p, g, kapat, isaretle, eposta }: { p: BolumProps["p"]; g: Gonderi | null; kapat: () => void; isaretle: (adres?: string) => void; eposta: () => void }) {
  const [kopya, kopyala] = useKopyala();
  const [adim, setAdim] = useState<Record<string, boolean>>({});
  const [adres, setAdres] = useState("");
  if (!g) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const metin = `${gonderiMetni({ ...g, baslik: undefined })}${g.kanal !== "eposta" && g.kanal !== "hikaye" ? `\n\n${takipAdresi(p, g)}` : ""}`;
  const platform = platformAdresi(g, metin);
  const tamam = (k: string) => setAdim((x) => ({ ...x, [k]: true }));
  const Adim = ({ n, k, baslik, alt, children }: { n: number; k: string; baslik: string; alt: string; children: React.ReactNode }) => (
    <li className="flex gap-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold transition-colors", adim[k] ? "bg-white text-black" : "bg-white/[0.08] text-white")}>{adim[k] ? <Check className="h-3.5 w-3.5" /> : n}</span>
      <div className="min-w-0 flex-1"><p className="text-[13px] font-medium text-white">{baslik}</p><p className="text-[12px] leading-relaxed text-white/50">{alt}</p><div className="mt-2 flex flex-wrap gap-2">{children}</div></div>
    </li>
  );
  return (
    <YanPanel acik={!!g} kapat={() => { setAdim({}); setAdres(""); kapat(); }} genis baslik={<span className="flex items-center gap-2"><KanalLogo kanal={icerikKanali(g.kanal).plan} boyut={24} className="rounded-[7px]" />{gonderiKanalAdi(g)} paylaşımı</span>} alt={g.tarih ? `${turkceTarih(g.tarih)}${g.saat ? `, ${g.saat}` : ""}` : "Tarih yok"}
      alt2={<><button type="button" onClick={kapat} className={cn(ikincil, "ml-auto")}>Sonra</button><button type="button" onClick={() => { isaretle(adres.trim() || undefined); setAdim({}); setAdres(""); }} className={birincil}><Check className="h-3.5 w-3.5" />Paylaştım</button></>}>
      <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
        <div className="space-y-2">
          {g.gorsel && <div className="overflow-hidden rounded-[14px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={g.gorsel} alt="" className="w-full object-cover" /></div>}
          <p className="line-clamp-[10] whitespace-pre-line text-[12px] leading-relaxed text-white/70">{metin}</p>
        </div>
        <ol className="min-w-0 space-y-2">
          <Adim n={1} k="metin" baslik="Metni kopyala" alt="Hashtag'ler ve takip bağlantısı dahil.">
            <button type="button" onClick={() => { kopyala("m", metin); tamam("metin"); }} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Copy className="h-3.5 w-3.5" />{kopya === "m" ? "Kopyalandı" : "Kopyala"}</button>
          </Adim>
          {g.gorsel && <Adim n={2} k="gorsel" baslik="Görseli indir" alt="Telefona aktar ya da doğrudan yükle.">
            <a href={g.gorsel} download={`${p.ayarlar.altAlan}-${g.kanal}-${g.id}.${g.gorsel.split(".").pop()}`} onClick={() => tamam("gorsel")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Download className="h-3.5 w-3.5" />İndir</a>
          </Adim>}
          <Adim n={g.gorsel ? 3 : 2} k="ac" baslik={g.kanal === "eposta" ? "Bülten olarak gönder" : "Platformu aç"} alt={g.kanal === "eposta" ? "E-posta bölümünde kampanyaya çevir." : platform?.dolu ? "Metin önceden doldurulur; görseli ekleyip paylaş." : "Bu platform dışarıdan metin doldurmaya izin vermiyor; kopyaladığın metni yapıştır."}>
            {g.kanal === "eposta" ? <button type="button" onClick={eposta} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>E-postaya git</button>
              : platform ? <a href={platform.adres} target="_blank" rel="noopener noreferrer" onClick={() => tamam("ac")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{gonderiKanalAdi(g)}<ArrowUpRight className="h-3.5 w-3.5" /></a> : <span className="text-[12px] text-white/45">Özel kanal; elle paylaş.</span>}
          </Adim>
          <li className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
            <Etiket ad="Gönderinin adresi (isteğe bağlı)"><input value={adres} onChange={(x) => setAdres(x.target.value)} placeholder="https://..." className={cn(alan, "h-9")} /></Etiket>
          </li>
        </ol>
      </div>
    </YanPanel>
  );
}
