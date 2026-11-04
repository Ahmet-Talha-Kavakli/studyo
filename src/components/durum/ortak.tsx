"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronDown, Copy, Loader2, Mail, Rss, Webhook, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { kopyala } from "@/lib/gercekEylem";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import {
  DURUM, GRUPLAR, OLAYLAR, enKotu, gunAnahtari, gunDurumu, gunMetni, gunOlaylari,
  type BilesenDurumu, type DurumKodu, type DurumYaniti, type GunKaydi, type Olay,
} from "@/lib/durum";
import { cn } from "@/lib/utils";

export { AYLAR, gunMetni, olayAraligi } from "@/lib/durum";

/* ── Veri ── */
export function useDurum() {
  const [veri, setVeri] = useState<DurumYaniti | null>(null);
  const [hata, setHata] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const yenile = useCallback(async () => {
    setYukleniyor(true);
    try {
      const r = await fetch("/api/durum", { cache: "no-store" });
      if (!r.ok) throw 0;
      setVeri(await r.json()); setHata(false);
    } catch { setHata(true); }
    setYukleniyor(false);
  }, []);
  useEffect(() => {
    void yenile();
    const t = setInterval(() => void yenile(), 60_000);
    return () => clearInterval(t);
  }, [yenile]);
  return { veri, hata, yukleniyor, yenile };
}

/** Bir bileşenin son N günü: ölçüm + olay kayıtlarından günün durumu. */
export type GunBilgi = { gun: string; durum: DurumKodu | null; kayit?: GunKaydi; olaylar: Olay[]; olcumOncesi: boolean };
export function gunleriKur(bilesenId: string, d: BilesenDurumu | undefined, olcumBaslangic: number | null, n: number): GunBilgi[] {
  const kayitlar = new Map((d?.gunler ?? []).map((k) => [k.gun, k]));
  const baslangicGun = olcumBaslangic ? gunAnahtari(olcumBaslangic) : null;
  const liste: GunBilgi[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const gun = gunAnahtari(Date.now() - i * 86_400_000);
    const kayit = kayitlar.get(gun);
    const olaylar = gunOlaylari(gun, bilesenId);
    const olculen = gunDurumu(kayit);
    const durumlar = [olculen, ...olaylar.map((o) => o.etki)].filter(Boolean) as DurumKodu[];
    liste.push({ gun, kayit, olaylar, durum: durumlar.length ? enKotu(durumlar) : null, olcumOncesi: !baslangicGun || gun < baslangicGun });
  }
  return liste;
}
export function calismaYuzdesi(d: BilesenDurumu | undefined): number | null {
  const t = (d?.gunler ?? []).reduce((a, k) => ({ o: a.o + k.olcum, b: a.b + k.basarisiz }), { o: 0, b: 0 });
  return t.o ? ((t.o - t.b) / t.o) * 100 : null;
}
export const yuzdeMetni = (y: number) => `%${y >= 99.995 ? "100" : y.toFixed(2).replace(".", ",")}`;

/** Bileşenin şu anki durumu (aktif olay varsa onu da hesaba katar). */
export function anlikDurum(id: string, d: BilesenDurumu | undefined): DurumKodu | null {
  if (!d) return null;
  const bugun = gunAnahtari(Date.now());
  const aktif = OLAYLAR.filter((o) => o.bilesenler.includes(id) && o.bitis >= bugun && o.guncellemeler[0]?.evre !== "cozuldu").map((o) => o.etki);
  return aktif.length ? enKotu([d.durum, ...aktif]) : d.durum;
}

/* ── Gün çubukları + tooltip ── */
export function GunCubuklari({ gunler, etiket }: { gunler: GunBilgi[]; etiket: string }) {
  const [ipucu, setIpucu] = useState<{ g: GunBilgi; x: number; y: number } | null>(null);
  const kapatT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const goster = (g: GunBilgi, el: HTMLElement) => {
    clearTimeout(kapatT.current);
    const r = el.getBoundingClientRect();
    setIpucu({ g, x: r.left + r.width / 2, y: r.bottom });
  };
  const kapat = () => { kapatT.current = setTimeout(() => setIpucu(null), 120); };
  return (
    <>
      <div role="img" aria-label={etiket} className="flex h-[34px] items-stretch gap-[2px]" onMouseLeave={kapat}>
        {gunler.map((g) => (
          <span key={g.gun} data-gun={g.gun} onMouseEnter={(e) => goster(g, e.currentTarget)} onClick={(e) => goster(g, e.currentTarget)}
            className="min-w-0 flex-1 cursor-pointer rounded-[2px] transition-opacity hover:opacity-70"
            style={{ background: g.durum ? DURUM[g.durum].renk : "rgba(255,255,255,0.09)" }} />
        ))}
      </div>
      {ipucu && typeof document !== "undefined" && createPortal(
        <div role="tooltip" onMouseEnter={() => clearTimeout(kapatT.current)} onMouseLeave={kapat}
          className="kesfet-tema fixed z-[300] w-[290px] -translate-x-1/2 rounded-xl border border-white/[0.1] bg-[#18181b] p-3.5 text-[12.5px]"
          style={{ left: Math.min(Math.max(ipucu.x, 155), window.innerWidth - 155), top: ipucu.y + 10 }}>
          <p className="text-[13px] font-semibold text-white">{gunMetni(ipucu.g.gun)}</p>
          {ipucu.g.olaylar.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {ipucu.g.olaylar.map((o) => (
                <li key={o.id} className="rounded-lg bg-white/[0.04] px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: DURUM[o.etki].renk }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: DURUM[o.etki].renk }} />{DURUM[o.etki].ad}</span>
                  <Link href={`/durum/olay/${o.id}`} className="mt-0.5 block leading-snug text-white hover:underline">{o.baslik}</Link>
                </li>
              ))}
            </ul>
          )}
          {ipucu.g.kayit ? (
            <p className="mt-2 text-metin-2">
              {ipucu.g.kayit.olcum} ölçüm{ipucu.g.kayit.basarisiz ? ` · ${ipucu.g.kayit.basarisiz} başarısız` : " · hepsi başarılı"}{ipucu.g.kayit.yavas ? ` · ${ipucu.g.kayit.yavas} yavaş` : ""}
            </p>
          ) : (
            <p className="mt-2 text-metin-3">{ipucu.g.olcumOncesi ? "Bu gün otomatik ölçüm başlamadan önce." : "Bu gün için ölçüm yapılmadı."}</p>
          )}
          {!ipucu.g.olaylar.length && <p className="mt-1 text-metin-3">Bu gün için olay bildirilmedi.</p>}
        </div>,
        document.body,
      )}
    </>
  );
}

/** Ekran genişliğine göre gün sayısı (status.claude: masaüstü 90, mobil 30). */
export function useGunSayisi() {
  const [n, setN] = useState(90);
  useEffect(() => {
    const h = () => setN(window.innerWidth < 640 ? 30 : window.innerWidth < 900 ? 60 : 90);
    h(); window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return n;
}

export function DurumRozeti({ durum }: { durum: DurumKodu | null }) {
  if (!durum) return <span className="text-[12.5px] text-metin-3">Ölçülüyor…</span>;
  return <span className="text-[12.5px] font-medium" style={{ color: durum === "demo" ? undefined : DURUM[durum].renk }}><span className={durum === "demo" ? "text-metin-3" : ""}>{DURUM[durum].ad}</span></span>;
}

/* ── Abonelik: kanal seçimi (kayan beyaz hap), kanal açıklaması, adres, bileşen çipleri, başarı ekranı ── */
type Kanal = "eposta" | "slack" | "webhook" | "akis";
const SlackLogo = ({ className }: { className?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src="/marka/slack_alt.svg" alt="" className={className} />
);
const KANALLAR: { id: Kanal; ad: string; ikon: React.ElementType; aciklama: string }[] = [
  { id: "eposta", ad: "E-posta", ikon: Mail, aciklama: "Olay açıldığında, güncellendiğinde ve çözüldüğünde e-posta al." },
  { id: "slack", ad: "Slack", ikon: SlackLogo, aciklama: "Bildirimler bir Slack kanalına düşsün. Slack'te gelen webhook oluşturup adresini yapıştır." },
  { id: "webhook", ad: "Webhook", ikon: Webhook, aciklama: "Her olay değişiminde adresine imzalı bir POST isteği gönderilir." },
  { id: "akis", ad: "Akış", ikon: Rss, aciklama: "Olaylar ve bakımlar akış okuyucuna gelsin." },
];
const kanalYay = { type: "spring", stiffness: 460, damping: 34 } as const;

export function AboneMenusu({ onKapat }: { onKapat: () => void }) {
  const [kanal, setKanal] = useState<Kanal>("eposta");
  const [hedef, setHedef] = useState("");
  const [secim, setSecim] = useState<Set<string>>(new Set());
  const [bilesenAcik, setBilesenAcik] = useState(false);
  const [durum, setDurum] = useState<{ ok: boolean; metin: string } | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [kopyalanan, setKopyalanan] = useState<string | null>(null);
  useEffect(() => { setDurum(null); setHedef(""); }, [kanal]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onKapat]);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setGonderiliyor(true); setDurum(null);
    try {
      const r = await fetch("/api/durum/abone", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kanal, hedef, bilesenler: [...secim] }) });
      const j = await r.json();
      if (!j.ok) setDurum({ ok: false, metin: j.hata ?? "Abonelik oluşturulamadı." });
      else setDurum({ ok: true, metin: `${j.bilesenSayisi} bileşen için olay açıldığında, güncellendiğinde ve çözüldüğünde bildirim gönderilir.` });
    } catch { setDurum({ ok: false, metin: "Sunucuya ulaşılamadı." }); }
    setGonderiliyor(false);
  };
  const akisKopyala = async (yol: string) => {
    if (await kopyala(`${window.location.origin}${yol}`, "Akış adresi kopyalandı")) { setKopyalanan(yol); setTimeout(() => setKopyalanan(null), 1400); }
  };
  const degistir = (id: string) => setSecim((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const k = KANALLAR.find((x) => x.id === kanal)!;
  const yer = { eposta: "sen@ornek.com", slack: "https://hooks.slack.com/services/...", webhook: "https://ornek.com/vayra-durum" }[kanal as Exclude<Kanal, "akis">];
  const basarili = durum?.ok;

  return (
    <div role="dialog" aria-label="Güncellemelere abone ol" className="w-[min(400px,calc(100vw-32px))] overflow-hidden rounded-[24px] bg-[#151517] ring-1 ring-white/[0.1]">
      <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.015em] text-white">Güncellemelere abone ol</p>
          <p className="mt-0.5 text-[13px] text-white/60">Bir sorun olduğunda ilk sen öğren.</p>
        </div>
        <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
      </div>

      <LayoutGroup id="durum-abone">
        <div role="tablist" className="mx-5 mt-4 grid grid-cols-4 gap-1 rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.06]">
          {KANALLAR.map((x) => {
            const on = kanal === x.id;
            return (
              <button key={x.id} role="tab" aria-selected={on} onClick={() => setKanal(x.id)}
                className={cn("relative flex h-9 items-center justify-center gap-1.5 rounded-full text-[12.5px] transition-colors", on ? "font-semibold text-black" : "text-white/70 hover:text-white")}>
                {on && <motion.span layoutId="durum-abone-z" transition={kanalYay} className="absolute inset-0 rounded-full bg-white" />}
                <x.ikon className="relative h-3.5 w-3.5 shrink-0" />
                <span className="relative">{x.ad}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={basarili ? "tamam" : kanal} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {basarili ? (
              <div className="py-2 text-center">
                <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 13, stiffness: 300 }}
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#55d6fd] text-[#04212b]"><Check className="h-6 w-6" strokeWidth={2.8} /></motion.span>
                <p className="mt-4 text-[16px] font-semibold text-white">Abone oldun</p>
                <p className="mx-auto mt-1 max-w-[300px] text-[13px] leading-relaxed text-white/65">{durum!.metin}</p>
                <button onClick={() => setDurum(null)} className="mt-4 h-9 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-white transition hover:bg-white/[0.12]">Başka bir kanal ekle</button>
              </div>
            ) : kanal === "akis" ? (
              <div>
                <p className="text-[13.5px] leading-relaxed text-white/70">{k.aciklama}</p>
                <div className="mt-3 space-y-2">
                  {[["/durum/rss", "RSS akışı"], ["/durum/atom", "Atom akışı"]].map(([yol, ad]) => (
                    <div key={yol} className="flex items-center gap-3 rounded-[14px] bg-white/[0.05] p-2 pl-3 ring-1 ring-inset ring-white/[0.06]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-orange-500/15"><Rss className="h-4 w-4 text-orange-400" /></span>
                      <a href={yol} className="min-w-0 flex-1"><span className="block text-[14px] font-medium text-white">{ad}</span><span className="block truncate text-[12px] text-white/55">vayra.ai{yol}</span></a>
                      <button onClick={() => void akisKopyala(yol)} className={cn("flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] font-medium transition", kopyalanan === yol ? "bg-emerald-400/15 text-emerald-300" : "bg-white/[0.08] text-white hover:bg-white/[0.14]")}>
                        {kopyalanan === yol ? <><Check className="h-3.5 w-3.5" />Kopyalandı</> : <><Copy className="h-3.5 w-3.5" />Kopyala</>}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={gonder} noValidate>
                <p className="text-[13.5px] leading-relaxed text-white/70">{k.aciklama}</p>
                <label className="mt-3.5 block">
                  <span className="mb-1.5 block text-[12.5px] font-medium text-white/80">{kanal === "eposta" ? "E-posta adresi" : "Webhook adresi"}</span>
                  <input value={hedef} onChange={(e) => setHedef(e.target.value)} type={kanal === "eposta" ? "email" : "url"} placeholder={yer} required autoFocus
                    className="h-11 w-full rounded-[13px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.1] transition placeholder:text-white/40 focus:bg-white/[0.07] focus:ring-[#55d6fd]/60" />
                </label>

                <button type="button" onClick={() => setBilesenAcik((v) => !v)} aria-expanded={bilesenAcik}
                  className="mt-3 flex w-full items-center justify-between rounded-[12px] px-1 py-1.5 text-[13px] text-white/70 transition hover:text-white">
                  <span>Bileşenler: <b className="font-semibold text-white">{secim.size ? `${secim.size} seçili` : "tümü"}</b></span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", bilesenAcik && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {bilesenAcik && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="mt-1 max-h-[210px] space-y-3 overflow-y-auto rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.06]">
                        {GRUPLAR.map((g) => (
                          <div key={g.id}>
                            <p className="mb-1.5 text-[12.5px] font-medium text-white/60">{g.ad}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {g.bilesenler.map((b) => {
                                const sec = secim.has(b.id);
                                return (
                                  <button type="button" key={b.id} onClick={() => degistir(b.id)} aria-pressed={sec}
                                    className={cn("flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] transition-colors", sec ? "bg-white font-semibold text-black" : "bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-white")}>
                                    {sec && <Check className="h-3 w-3" strokeWidth={3} />}{b.ad.replace(/ \(.*\)$/, "")}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>{durum && !durum.ok && <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 rounded-[12px] bg-rose-400/[0.1] p-3 text-[13px] leading-relaxed text-rose-200">{durum.metin}</motion.p>}</AnimatePresence>
                <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={gonderiliyor || !hedef.trim()}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90 disabled:bg-white/[0.08] disabled:text-white/40">
                  {gonderiliyor && <Loader2 className="h-4 w-4 animate-spin" />}
                  {kanal === "eposta" ? "E-postayla abone ol" : kanal === "slack" ? "Slack'e bağla" : "Webhook ekle"}
                </motion.button>
                <p className="mt-3 text-center text-[12px] leading-relaxed text-white/50">Abone olarak <Link href="/gizlilik" className="underline underline-offset-2 hover:text-white">Gizlilik Politikası</Link>&apos;nı kabul edersin. İstediğin an çıkabilirsin.</p>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Kabuk ── */
export function DurumKabugu({ children }: { children: ReactNode }) {
  const [aboneAcik, setAboneAcik] = useState(false);
  const kapat = useCallback(() => setAboneAcik(false), []);
  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/durum" className="flex items-center gap-2.5">
          <VayraIsaret size={26} />
          <span className="text-[22px] font-semibold tracking-[-0.02em] text-white">Vayra <span className="font-normal text-metin-2">Durum</span></span>
        </Link>
        <div className="relative">
          <button onClick={() => setAboneAcik((v) => !v)} aria-expanded={aboneAcik} className="h-10 rounded-full bg-[#55d6fd] px-4 text-[13.5px] font-semibold text-[#06222b] transition hover:brightness-110 active:scale-[0.98]">
            <span className="hidden sm:inline">Güncellemelere abone ol</span><span className="sm:hidden">Abone ol</span>
          </button>
          <AnimatePresence>
            {aboneAcik && (
              <>
                <div className="fixed inset-0 z-40" onMouseDown={kapat} aria-hidden />
                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 480, damping: 34 }} className="absolute right-0 top-12 z-50 origin-top-right"><AboneMenusu onKapat={kapat} /></motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>
      <main className="mt-10">{children}</main>
      <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5 text-[13px] text-metin-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/durum" className="text-metin-2 hover:text-white">Güncel durum</Link>
          <Link href="/durum/gecmis" className="text-metin-2 hover:text-white">Olay geçmişi</Link>
          <a href="/durum/rss" className="inline-flex items-center gap-1 hover:text-white"><Rss className="h-3.5 w-3.5" />RSS</a>
          <a href="/durum/atom" className="hover:text-white">Atom</a>
        </div>
        <Link href="/" className="hover:text-white">vayra.ai&apos;ye dön</Link>
      </footer>
    </div>
  );
}

/** Saat dilimi notu: kullanıcının dilimi. */
export function useSaatDilimi() {
  return useMemo(() => {
    if (typeof Intl === "undefined") return "";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fark = -new Date().getTimezoneOffset() / 60;
    return `${tz} (GMT${fark >= 0 ? "+" : ""}${fark})`;
  }, []);
}
