"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, Check, ChevronRight, LogOut, User, Settings, Zap, Sparkles,
  Infinity as SonsuzIkon, Gift, X, AlertTriangle,
} from "lucide-react";
import { useAuth, krediDurum } from "@/store/useAuth";
import { useBildirim } from "@/store/useBildirim";
import { cn } from "@/lib/utils";

/**
 * Bildirim ve hesap panelleri — ORTAK bileşenler.
 *
 * Eskiden bu iki panel UstNav.tsx'in içinde gömülüydü. Sol navigasyona geçerken
 * kopyalamak yerine BURAYA TAŞINDILAR: iki kabuk aynı kaynağı kullanır, biri
 * güncellenince diğeri geride kalmaz.
 *
 * `yon` panelin nereye açılacağını belirler:
 *   "asagi" → tetikleyicinin altına (üst nav kullanımı)
 *   "yukari" → tetikleyicinin üstüne, sağa doğru (sol nav alt bloğu)
 */
export type PanelYon = "asagi" | "yukari";

function konumSinifi(yon: PanelYon, genislik: string) {
  return yon === "asagi"
    ? `absolute right-0 top-10 ${genislik}`
    : `absolute bottom-0 left-full ml-2 ${genislik}`;
}

function girisAnim(yon: PanelYon) {
  return yon === "asagi"
    ? { initial: { opacity: 0, y: 6, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 6, scale: 0.98 } }
    : { initial: { opacity: 0, x: -6, scale: 0.98 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -6, scale: 0.98 } };
}

/** Higgsfield bildirim listesindeki kısa yaş etiketi: "3sn" · "4sa" · "10g". */
function kisaYas(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${Math.max(1, s)}sn`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** Bildirimleri güne göre gruplar — "Bugün / Dün / 12 Temmuz" başlıkları. */
function gunGrupla<T extends { zaman: number }>(liste: T[]): { etiket: string; oge: T[] }[] {
  const gunBasi = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const bugun = gunBasi(Date.now());
  const gun = 86_400_000;
  const gruplar = new Map<number, T[]>();
  for (const o of liste) {
    const g = gunBasi(o.zaman);
    if (!gruplar.has(g)) gruplar.set(g, []);
    gruplar.get(g)!.push(o);
  }
  return Array.from(gruplar.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([g, oge]) => {
      const d = new Date(g);
      const etiket = g === bugun ? "Bugün"
        : g === bugun - gun ? "Dün"
        : `${d.getDate()} ${AY_ADLARI[d.getMonth()]}`;
      return { etiket, oge };
    });
}

/** Kredi jetonu: üst üste binmiş iki halka (lucide'de karşılığı yok). */
export function KrediIkon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </svg>
  );
}

/** Discord amblemi. */
export function DiscordIkon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.27 5.33A16.6 16.6 0 0 0 15.2 4l-.25.46a12.3 12.3 0 0 1 3.6 1.85 15.6 15.6 0 0 0-12.9-.36c.2-.1.4-.2.62-.3l.28-.12A12.4 12.4 0 0 1 9.05 4.5L8.8 4a16.6 16.6 0 0 0-4.07 1.33C2.2 9.06 1.5 12.7 1.85 16.28a16.7 16.7 0 0 0 5.05 2.55l.9-1.24a10.9 10.9 0 0 1-1.72-.83l.42-.32a11.9 11.9 0 0 0 10.8 0l.42.32c-.54.32-1.12.6-1.72.83l.9 1.24a16.7 16.7 0 0 0 5.06-2.55c.4-4.15-.68-7.76-2.7-10.95ZM8.52 14.1c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2 1.8.9 1.79 2c0 1.1-.79 2-1.79 2Zm6.96 0c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2 1.8.9 1.79 2c0 1.1-.79 2-1.79 2Z" />
    </svg>
  );
}

/* ============================================================
   Bildirim paneli
   ============================================================ */
export function BildirimPaneli({ acik, kapat, yon = "asagi" }: { acik: boolean; kapat: () => void; yon?: PanelYon }) {
  const router = useRouter();
  const { bildirimler, okunduIsaretle, tumunuOku } = useBildirim();
  const okunmamis = bildirimler.filter((b) => !b.okundu).length;
  const [filtre, setFiltre] = useState<"tumu" | "okunmamis">("tumu");
  const liste = useMemo(
    () => (filtre === "okunmamis" ? bildirimler.filter((b) => !b.okundu) : bildirimler),
    [bildirimler, filtre],
  );

  return (
    <AnimatePresence>
      {acik && (
        <>
          <div className="fixed inset-0 z-40" onClick={kapat} />
          <motion.div
            {...girisAnim(yon)}
            transition={{ duration: 0.14 }}
            className={cn("sinema-kapsam menu-surface z-50 rounded-[16px] p-3", konumSinifi(yon, "w-[390px]"))}
          >
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-[19px] font-bold text-white">Bildirimler</span>
              <div className="flex items-center gap-1.5">
                {okunmamis > 0 && (
                  <button onClick={tumunuOku} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-aksan transition-opacity hover:opacity-75">
                    <Check className="h-3.5 w-3.5" /> Tümünü oku
                  </button>
                )}
                <button onClick={kapat} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-metin-2 transition-colors hover:bg-white/12 hover:text-white" aria-label="Kapat">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Ödül hero kartı — koyu yeşil zemin, sağda lime hediye kartı. */}
            <div className="relative mb-3 overflow-hidden rounded-[14px] p-4"
              style={{ background: "linear-gradient(120deg, #1d3a24 0%, #16301d 55%, #12261a 100%)" }}>
              <div className="relative z-10 max-w-[58%]">
                <p className="text-[17px] font-bold leading-snug text-white">Ödüllerin yakında açılıyor</p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/65">Görevleri tamamla, bonusları topla ve sınırsız Nano Banana&apos;nın kilidini aç.</p>
                <button onClick={() => { kapat(); router.push("/panel/kredi"); }}
                  className="mt-3.5 rounded-[12px] bg-white px-4 py-2.5 text-[14px] font-semibold text-zemin transition-transform hover:scale-[1.03]">
                  Ödülleri gör
                </button>
              </div>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                <span className="absolute -right-2.5 top-1/2 h-[100px] w-[78px] -translate-y-1/2 rounded-[12px]" style={{ background: "#5f8a3a" }} />
                <span className="relative flex h-[112px] w-[84px] items-center justify-center rounded-[12px] shadow-lg"
                  style={{ background: "linear-gradient(180deg, #d9f95b 0%, #8fe08a 100%)" }}>
                  <span className="absolute left-1/2 top-2.5 h-1 w-6 -translate-x-1/2 rounded-full bg-black/45" />
                  <Gift className="mt-2 h-9 w-9 text-emerald-950/85" strokeWidth={1.8} />
                </span>
              </div>
            </div>

            {/* Filtre: Tümü / Okunmamış */}
            <div className="mb-1 flex items-center gap-1.5 px-1">
              {([
                { id: "tumu" as const, ad: "Tümü", say: bildirimler.length },
                { id: "okunmamis" as const, ad: "Okunmamış", say: okunmamis },
              ]).map((f) => (
                <button key={f.id} onClick={() => setFiltre(f.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    filtre === f.id ? "bg-aksan text-zemin" : "bg-white/[0.06] text-metin-2 hover:bg-white/10 hover:text-white",
                  )}>
                  {f.ad}
                  <span className={cn("rounded-full px-1.5 text-[11px] font-bold",
                    filtre === f.id ? "bg-black/20 text-zemin" : "bg-white/10 text-metin-3")}>{f.say}</span>
                </button>
              ))}
            </div>

            <div className="max-h-[340px] overflow-y-auto">
              {liste.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-metin-3">
                    <Bell className="h-5 w-5" />
                  </span>
                  <p className="text-[14px] font-medium text-metin-2">
                    {filtre === "okunmamis" ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
                  </p>
                  <p className="max-w-[240px] text-[12.5px] leading-snug text-metin-3">
                    {filtre === "okunmamis"
                      ? "Hepsini okudun. Yeni bir üretim bittiğinde burada görünecek."
                      : "Bir üretim başlat — tamamlandığında buraya bildirim düşer."}
                  </p>
                </div>
              ) : (
                gunGrupla(liste).map((grup) => (
                  <div key={grup.etiket}>
                    <p className="px-1 pb-1.5 pt-2.5 text-[13px] text-metin-3">{grup.etiket}</p>
                    {grup.oge.map((b) => (
                      <button key={b.id}
                        onClick={() => { okunduIsaretle(b.id); if (b.link) { kapat(); router.push(b.link); } }}
                        className="flex w-full gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-white/[0.045]">
                        <span className={cn(
                          "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                          b.tur === "basari" ? "bg-emerald-500/18 text-emerald-300"
                            : b.tur === "uyari" ? "bg-amber-500/18 text-amber-300"
                            : b.tur === "hata" ? "bg-rose-500/18 text-rose-300"
                            : "bg-white/8 text-metin-2",
                        )}>
                          {b.tur === "basari" ? <Sparkles className="h-5 w-5" />
                            : b.tur === "uyari" ? <Gift className="h-5 w-5" />
                            : b.tur === "hata" ? <AlertTriangle className="h-5 w-5" />
                            : <Bell className="h-5 w-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-white">{b.baslik}</span>
                            <span className="shrink-0 pt-0.5 text-[13px] text-metin-3">{kisaYas(b.zaman)}</span>
                          </span>
                          <span className="mt-0.5 block text-[13.5px] leading-snug text-metin-2">{b.mesaj}</span>
                          {b.link && (
                            <span className="mt-2.5 inline-block rounded-[10px] bg-aksan px-3.5 py-2 text-[14px] font-bold text-zemin">Görüntüle</span>
                          )}
                        </span>
                        {!b.okundu && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-aksan" />}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   Hesap (profil) paneli
   ============================================================ */
export function HesapPaneli({ acik, kapat, yon = "asagi" }: { acik: boolean; kapat: () => void; yon?: PanelYon }) {
  const router = useRouter();
  const { kullanici, cikisYap } = useAuth();
  const kredi = useMemo(() => krediDurum(kullanici), [kullanici]);

  return (
    <AnimatePresence>
      {acik && (
        <>
          <div className="fixed inset-0 z-40" onClick={kapat} />
          {/* Bu menü LİME aksanlıdır — panelin cyan aksanı burada geçmez.
              .sinema-kapsam ile --color-aksan lime'a çevrilir, böylece
              bg-aksan/text-aksan sınıfları otomatik lime olur. */}
          <motion.div
            {...girisAnim(yon)}
            transition={{ duration: 0.14 }}
            className={cn("sinema-kapsam menu-surface z-50 rounded-[16px] p-2", konumSinifi(yon, "w-[300px]"))}
          >
            <div className="flex items-center gap-3 px-2 py-2.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                <span className="absolute inset-0 rounded-full ring-[2.5px] ring-white/12" />
                <span className="absolute inset-0 rounded-full transition-[background] duration-500"
                  style={{
                    background: `conic-gradient(from -90deg, ${kredi.renk} 0turn ${kredi.oran}turn, transparent ${kredi.oran}turn 1turn)`,
                    WebkitMask: "radial-gradient(circle, transparent 0 17px, #000 17.6px)",
                    mask: "radial-gradient(circle, transparent 0 17px, #000 17.6px)",
                  }} />
                <span className="h-[30px] w-[30px] rounded-full" style={{ background: "var(--sn-lime)" }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-white">{kullanici?.ad}</span>
                <span className="block text-[13px] capitalize text-metin-3">{kullanici?.plan} Plan</span>
              </span>
            </div>

            <div className="mt-1 rounded-[12px] bg-white/[0.035] px-3 py-2.5">
              <Link href="/panel/kredi" onClick={kapat}
                className="flex items-center justify-between text-[15px] transition-colors hover:text-aksan">
                <span className="font-medium text-white">Kredi</span>
                <span className="flex items-center gap-1.5 text-metin-3">
                  <span className="font-semibold" style={{ color: kredi.renk }}>
                    {new Intl.NumberFormat("tr-TR").format(kullanici?.krediler ?? 0)}
                  </span>
                  <span>kalan</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              <div className="mt-2.5 flex items-center gap-[4px]">
                {Array.from({ length: 26 }).map((_, i) => (
                  <span key={i} className="h-[5px] w-[5px] rounded-full transition-colors"
                    style={{ background: i < Math.round(kredi.oran * 26) ? kredi.renk : "rgba(255,255,255,0.12)" }} />
                ))}
              </div>
              {([
                { ad: "Kredi yükle", sekme: "kredi" as const, ikon: KrediIkon },
                { ad: "Hız artır", sekme: "hiz" as const, ikon: Zap },
                { ad: "Sınırsız modeller", sekme: "sinirsiz" as const, ikon: SonsuzIkon },
              ]).map((s, i) => (
                <div key={s.ad} className={cn("flex items-center gap-3 border-t border-white/[0.07] py-2.5", i === 0 && "mt-2.5")}>
                  <s.ikon className="h-[22px] w-[22px] shrink-0 text-aksan" strokeWidth={2} />
                  <span className="flex-1 text-[15px] text-white">{s.ad}</span>
                  <button onClick={() => { kapat(); router.push(`/panel/kredi?sekme=${s.sekme}`); }}
                    className="rounded-full bg-aksan px-4 py-1.5 text-[13px] font-bold text-zemin transition-transform hover:scale-105">
                    Al
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-1.5">
              <Link href="/panel/profil" onClick={kapat} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8">
                <User className="h-[18px] w-[18px] text-metin-2" /> Profili görüntüle
              </Link>
              <Link href="/panel/ayarlar" onClick={kapat} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8">
                <Settings className="h-[18px] w-[18px] text-metin-2" /> Hesabı yönet
              </Link>
              <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" onClick={kapat}
                className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8">
                <DiscordIkon className="h-[18px] w-[18px] text-metin-2" /> Topluluğa katıl
              </a>
              <div className="my-1.5 h-px bg-white/[0.07]" />
              {/* "Çıkış yap" BEYAZ — kırmızı değil (referans birebir). */}
              <button onClick={() => { cikisYap(); router.push("/"); }}
                className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8">
                <LogOut className="h-[18px] w-[18px] text-metin-2" /> Çıkış yap
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Kredi halkalı avatar düğmesi — hem üst hem sol navda aynı görünüm. */
export function KrediAvatar({ onClick, boyut = 28 }: { onClick: () => void; boyut?: number }) {
  const { kullanici } = useAuth();
  const kredi = useMemo(() => krediDurum(kullanici), [kullanici]);
  const ic = Math.round(boyut * 0.68);
  const maske = (boyut - 4) / 2;
  return (
    <button
      onClick={onClick}
      className="relative flex shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105"
      style={{ height: boyut, width: boyut }}
      aria-label={`Hesabım — ${kredi.etiket}: ${kredi.kalan.toLocaleString("tr-TR")} / ${kredi.toplam.toLocaleString("tr-TR")} kredi`}
      title={`${kredi.etiket} · ${kredi.kalan.toLocaleString("tr-TR")} / ${kredi.toplam.toLocaleString("tr-TR")} kredi (%${Math.round(kredi.oran * 100)})`}
    >
      <span className="absolute inset-0 rounded-full ring-[2px] ring-white/12" />
      <span className="absolute inset-0 rounded-full transition-[background] duration-500"
        style={{
          background: `conic-gradient(from -90deg, ${kredi.renk} 0turn ${kredi.oran}turn, transparent ${kredi.oran}turn 1turn)`,
          WebkitMask: `radial-gradient(circle, transparent 0 ${maske}px, #000 ${maske + 0.6}px)`,
          mask: `radial-gradient(circle, transparent 0 ${maske}px, #000 ${maske + 0.6}px)`,
        }} />
      <span className="rounded-full" style={{ height: ic, width: ic, background: "var(--sn-lime, #55d6fd)" }} />
    </button>
  );
}
