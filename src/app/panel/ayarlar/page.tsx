"use client";

/**
 * Ayarlar — Higgsfield /me/settings birebir Türkçe.
 * Sol ikonlu sidebar (5 sekme) + Discord kartı + Çıkış. Sağda sekme içeriği.
 * SSR güvenli: render'da Date.now / Math.random YOK (hesapVeri deterministik).
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Gift, CreditCard, Clock, Ticket, MessageCircle, LogOut,
  Coins, TrendingUp, Trash2, AlertTriangle, ChevronDown, Image as ImageIcon,
  FolderClosed, Tag, Sparkles, Infinity as InfinityIcon, Rocket, Zap, Layers, Check, X,
  Pencil, ChevronRight, ChevronLeft, MailPlus, Plus, ListTree, Flame, Repeat,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";
import { formatKredi, cn } from "@/lib/utils";
import { PLANLAR, kullanimUret, AKTIF_UNLIMITED } from "@/lib/hesapVeri";

type Sekme = "profil" | "hediye" | "abonelik" | "kullanim" | "promo";

const SEKMELER: { id: Sekme; ad: string; ikon: typeof User; renk: string }[] = [
  { id: "profil", ad: "Kişisel Profil", ikon: User, renk: "bg-sky-500/20 text-sky-300" },
  { id: "hediye", ad: "Hediyeler", ikon: Gift, renk: "bg-amber-500/20 text-amber-300" },
  { id: "abonelik", ad: "Abonelik", ikon: CreditCard, renk: "bg-rose-500/20 text-rose-300" },
  { id: "kullanim", ad: "Kullanım", ikon: Clock, renk: "bg-violet-500/20 text-violet-300" },
  { id: "promo", ad: "Promokod", ikon: Ticket, renk: "bg-fuchsia-500/20 text-fuchsia-300" },
];

/* Deterministik mini-grafik çubukları (SSR güvenli, sabit tohumdan). */
const MINI_BARLAR = Array.from({ length: 30 }, (_, i) => {
  const h = (i * 2654435761) % 100;
  return 18 + (h % 82);
});

function Toggle({ acik, onToggle }: { acik: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={acik}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", acik ? "bg-aksan" : "bg-white/15")}
    >
      <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", acik ? "left-6" : "left-1")} />
    </button>
  );
}

export default function AyarlarPage() {
  const router = useRouter();
  const { kullanici } = useAuth();
  const cikisYap = useAuth((s) => s.cikisYap);
  const [sekme, setSekme] = useState<Sekme>("profil");

  const ad = kullanici?.ad ?? "Vayra";
  const email = kullanici?.email ?? "";
  const krediler = kullanici?.krediler ?? 0;
  const isim = ad.split(" ")[0] || "Vayra";

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-3 md:py-8 lg:px-8">
      {/* ── Sol sidebar ── SABİT (M21): sayfa aşağı kaydırılınca menü yerinde kalır. */}
      <aside className="sticky top-16 hidden max-h-[calc(100vh-5rem)] w-60 shrink-0 flex-col self-start overflow-y-auto md:flex gizli-scroll">
        <h1 className="mb-5 px-2 text-sm font-semibold text-white/45">{isim}&rsquo;in çalışma alanı</h1>
        <nav className="space-y-0.5">
          {SEKMELER.map((s) => (
            <button
              key={s.id}
              onClick={() => setSekme(s.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                sekme === s.id ? "bg-white/8 text-white" : "text-white/60 hover:bg-white/6 hover:text-white",
              )}
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", s.renk)}>
                <s.ikon className="h-4 w-4" />
              </span>
              {s.ad}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-transparent p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4.5 w-4.5 text-indigo-300" /> Discord&rsquo;a katıl
            </div>
            <p className="mt-1 text-xs text-white/50">Yardım al, soru sor, toplulukla bağlan.</p>
            <button
              onClick={() => toast("Discord davetin açılıyor…", { description: "discord.gg/vayra" })}
              className="mt-3 w-full rounded-xl bg-white/8 py-2 text-xs font-medium transition-colors hover:bg-white/12"
            >
              Katıl
            </button>
          </div>
          <button
            onClick={() => { cikisYap(); router.push("/"); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
          >
            <LogOut className="h-4.5 w-4.5" /> Çıkış yap
          </button>
        </div>
      </aside>

      {/* ── Mobil sekme şeridi ──
          Referansta bu şerit sayfanın ÜSTÜNE YAPIŞIR ve her sekme RENKLİ KARE
          İKON + etiket taşır; aktif olan koyu hap içinde durur, şerit yatayda
          kayar (son sekme sağ kenardan taşar). */}
      <div className="w-full min-w-0 md:hidden">
        <div className="sticky top-0 z-30 -mx-4 mb-4 bg-zemin px-4 pb-2 pt-1">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 gizli-scroll">
            {SEKMELER.map((s) => (
              <button
                key={s.id}
                onClick={() => setSekme(s.id)}
                className={cn("flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[15px] font-medium transition-colors",
                  sekme === s.id ? "bg-white/[0.09] text-white" : "text-metin-2")}
              >
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", s.renk)}>
                  <s.ikon className="h-4 w-4" />
                </span>
                {s.ad}
              </button>
            ))}
          </div>
        </div>
        <SekmeIcerik sekme={sekme} ad={ad} email={email} isim={isim} krediler={krediler} />
      </div>

      {/* ── Sağ içerik (masaüstü) ── */}
      <div className="hidden min-w-0 flex-1 md:block">
        <SekmeIcerik sekme={sekme} ad={ad} email={email} isim={isim} krediler={krediler} />
      </div>
    </div>
  );
}

function SekmeIcerik({ sekme, ad, email, isim, krediler }: { sekme: Sekme; ad: string; email: string; isim: string; krediler: number }) {
  if (sekme === "profil") return <ProfilSekmesi ad={ad} email={email} krediler={krediler} />;
  if (sekme === "hediye") return <HediyeSekmesi />;
  if (sekme === "abonelik") return <AbonelikSekmesi krediler={krediler} />;
  if (sekme === "kullanim") return <KullanimSekmesi />;
  return <PromoSekmesi isim={isim} />;
}

/* ══════════════════ 1 · Kişisel Profil ══════════════════ */
function ProfilSekmesi({ ad, email, krediler }: { ad: string; email: string; krediler: number }) {
  /* Çıkış mobilde bu sekmenin sonunda; prop zinciri açmak yerine store'u
     doğrudan burada okuyoruz. */
  const router = useRouter();
  const cikisYap = useAuth((s) => s.cikisYap);
  const [otoYayin, setOtoYayin] = useState(false);
  const [silmeAcik, setSilmeAcik] = useState(false);
  const maks = 1000;
  const yuzde = Math.min(100, (krediler / maks) * 100);

  const silinecekler = [
    { ikon: ImageIcon, ad: "Tüm üretimlerine erişim" },
    { ikon: FolderClosed, ad: "Tüm Kütüphane & Topluluk içeriği" },
    { ikon: Tag, ad: "Mevcut indirimler ve abonelik" },
    { ikon: ImageIcon, ad: "Kaydedilmiş tüm ayarlar ve hazır ayarlar" },
    { ikon: Coins, ad: "Bakiyendeki kalan krediler" },
  ];

  return (
    <div className="space-y-6">
      {/* Üst kimlik — referansta mobilde yuvarlak avatar, adın YANINDA küçük
          "Düzenle" hapı, altında e-posta + chevron (profile gider). */}
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aksan-parlak to-aksan-koyu text-2xl font-bold text-ink-950 md:h-16 md:w-16 md:rounded-2xl">
          {ad.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[21px] font-bold md:text-xl">{ad}</h1>
            <Link href="/panel/profil"
              className="flex shrink-0 items-center gap-1 rounded-lg bg-white/[0.08] px-2 py-1 text-[12px] font-medium text-white transition-colors hover:bg-white/12">
              <Pencil className="h-3 w-3" /> Düzenle
            </Link>
          </div>
          <Link href="/panel/profil" className="mt-0.5 flex items-center gap-1 text-[14px] text-white/50 md:text-sm">
            <span className="truncate">{email}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </div>
      </div>

      {/* İş e-postası kartı — referansta krediler kartının ÜSTÜNDE, lime CTA'lı */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-metin-2">
          <MailPlus className="h-[18px] w-[18px]" />
        </span>
        <h3 className="mt-3 text-[16px] font-semibold">İş e-postanı ekle</h3>
        <p className="mt-1 text-[14px] leading-snug text-white/50">
          Kurumsal e-postanı ekle, saniyeler içinde kurulumunu yapalım.
        </p>
        <button
          onClick={() => useKrediModal.getState().ac("plan")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-aksan py-3 text-[15px] font-bold text-zemin transition-transform active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" /> Kurumsal e-posta ekle
        </button>
      </section>

      {/* Krediler + Kullanım geçmişi */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-white/60"><Coins className="h-4 w-4 text-aksan" /> Krediler</div>
          <div className="text-2xl font-bold tabular-nums">{formatKredi(krediler)} kredi kaldı</div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-aksan" style={{ width: `${yuzde}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/40">Maksimum kredi havuzunun %{Math.round(yuzde)}&rsquo;i</p>
          <button
            onClick={() => useKrediModal.getState().ac("kredi")}
            className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/8"
          >
            Kredi yükle
          </button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/60"><TrendingUp className="h-4 w-4 text-aksan" /> Kullanım geçmişi</div>
            <span className="text-xs text-white/40 underline underline-offset-2">Tümünü gör</span>
          </div>
          <div className="flex h-24 items-end gap-[3px]">
            {MINI_BARLAR.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-aksan/30 to-aksan" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/35">
            <span>20 Haz</span><span>5 Tem</span><span>19 Tem</span>
          </div>
        </section>
      </div>

      {/* Karma geçmişi — referansta 3 istatistik satırı + işlem tablosu +
          "Tümünü göster" ve sayfalama. */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[14px] text-white/60">
            <ListTree className="h-4 w-4 text-aksan" /> Katkı karması geçmişi
          </div>
          <div className="flex gap-2">
            <button onClick={() => toast("Katkı karması: üretimlerini toplulukla paylaştıkça puan kazanırsın.")}
              className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-white/12">Bilgi al</button>
            <Link href="/panel/kesfet" className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-zemin">Topluluğa git</Link>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { ikon: Sparkles, deger: "800", etiket: "Toplam karma puanı" },
            { ikon: Flame, deger: "0", etiket: "Güncel seri" },
            { ikon: Repeat, deger: "0 / 20.000", etiket: "Karma dönüşüm limiti" },
          ].map((k) => (
            <div key={k.etiket} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-metin-2">
                <k.ikon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[16px] font-semibold leading-tight">{k.deger}</div>
                <div className="text-[13px] text-white/50">{k.etiket}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/8">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-white/8 px-4 py-2.5 text-[13px] text-white/45">
            <span>Açıklama</span><span>Tarih</span><span>Durum</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 text-[14px]">
            <span>Hoş geldin bonusu</span>
            <span className="text-white/60">31 May 2026</span>
            <span className="flex items-center gap-1 rounded-md bg-aksan/15 px-2 py-1 text-[13px] font-semibold text-aksan">
              <Sparkles className="h-3 w-3" /> +800
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-2.5">
            <button onClick={() => toast.success("Tüm hareketler gösteriliyor", { description: "Kredi kazanım ve harcama geçmişin listede." })}
              className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-white/12">Tümünü göster</button>
            <span className="text-[13px] text-white/45">Sayfa 1</span>
            <div className="flex gap-1.5">
              <button disabled aria-label="Önceki" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/30"><ChevronLeft className="h-4 w-4" /></button>
              <button disabled aria-label="Sonraki" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-white/30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Otomatik yayınlama */}
      <section className="flex items-center justify-between rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="pr-4">
          <h3 className="text-sm font-semibold">Otomatik yayınlama</h3>
          <p className="mt-0.5 text-sm text-white/50">
            Açıkken yeni üretimlerin Keşfet&rsquo;te otomatik görünür. Varsayılan olarak gizli tutmak için kapat.
          </p>
        </div>
        <Toggle acik={otoYayin} onToggle={() => { setOtoYayin((v) => !v); toast.success(otoYayin ? "Otomatik yayınlama kapatıldı" : "Otomatik yayınlama açıldı"); }} />
      </section>

      {/* Hesap silme accordion */}
      <section className="rounded-2xl border border-white/10 bg-yuzey">
        <button onClick={() => setSilmeAcik((v) => !v)} className="flex w-full items-center justify-between p-6">
          <div className="text-left">
            <h3 className="text-sm font-semibold">Hesap Silme Yönetimi</h3>
            <p className="mt-0.5 text-sm text-white/50">Hesap silme ayarları</p>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-white/50 transition-transform", silmeAcik && "rotate-180")} />
        </button>
        {silmeAcik && (
          <div className="border-t border-white/8 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-rose-300">
              <AlertTriangle className="h-4.5 w-4.5" /> Hesabını silmek şunları kalıcı olarak kaldırır:
            </div>
            <div className="space-y-2">
              {silinecekler.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-2.5 text-sm text-white/70">
                  <s.ikon className="h-4 w-4 text-white/40" /> {s.ad}
                </div>
              ))}
            </div>
            <button disabled className="mt-4 flex items-center gap-2 rounded-xl bg-white/6 px-4 py-2.5 text-sm text-white/35" aria-disabled>
              <Trash2 className="h-4 w-4" /> Hesabı Sil
            </button>
          </div>
        )}
      </section>

      {/* Çıkış — referansta mobilde sayfanın SONUNDA ortalı düz metin bağlantısı.
          Masaüstünde bu iş sol sidebar'daki butona ait, o yüzden md'de gizli. */}
      <button onClick={() => { cikisYap(); router.push("/"); }}
        className="mx-auto flex items-center gap-2 py-2 text-[16px] text-white transition-opacity hover:opacity-70 md:hidden">
        <LogOut className="h-[18px] w-[18px]" /> Çıkış yap
      </button>
    </div>
  );
}

/* ══════════════════ 2 · Hediyeler ══════════════════ */
function HediyeSekmesi() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-white/60"><Gift className="h-4 w-4 text-amber-300" /> Hediyeler</div>
      {/* Referansta mobilde tek satırlık kısa bir kart: solda metin, sağda eğik
          hediye kartları SAĞ KENARDAN TAŞAR (overflow-hidden ile kırpılır).
          Buton yok — kartın tamamı tıklanabilir. */}
      <button
        onClick={() => useKrediModal.getState().ac("kredi")}
        className="relative flex w-full items-center gap-6 overflow-hidden rounded-2xl border border-white/10 bg-yuzey p-5 text-left sm:justify-between sm:p-6"
      >
        <div className="relative z-10 max-w-[62%] sm:max-w-sm">
          <h3 className="text-[19px] font-bold sm:text-lg">Hediye kartları</h3>
          <p className="mt-1.5 text-[13.5px] leading-snug text-white/55 sm:text-sm">Yaratıcılığı paketle ve arkadaşına hediye et.</p>
          <span className="hf-cta mt-4 hidden rounded-xl px-5 py-2.5 text-sm font-semibold sm:inline-flex">Hediye kartı oluştur</span>
        </div>
        {/* Gradyan illüstrasyon — mobilde sağa/aşağıya taşar */}
        <div className="pointer-events-none absolute -bottom-4 -right-6 h-32 w-52 shrink-0 sm:relative sm:bottom-auto sm:right-auto sm:h-40 sm:w-56">
          <div className="absolute right-6 top-2 h-24 w-36 -rotate-6 rounded-2xl bg-gradient-to-br from-fuchsia-500/60 to-violet-600/40 shadow-lg sm:h-28 sm:w-40" />
          <div className="absolute right-0 top-6 flex h-24 w-36 rotate-3 items-center justify-center rounded-2xl bg-gradient-to-br from-aksan-parlak to-aksan-koyu shadow-xl sm:h-28 sm:w-40">
            <Sparkles className="h-9 w-9 text-ink-950/80 sm:h-10 sm:w-10" />
          </div>
        </div>
      </button>
    </div>
  );
}

/* ══════════════════ 3 · Abonelik ══════════════════ */
function AbonelikSekmesi({ krediler }: { krediler: number }) {
  const [otoYenile, setOtoYenile] = useState(false);
  const plan = PLANLAR[0]; // PLUS
  const maks = 1000;
  const yuzde = Math.min(100, (krediler / maks) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[27px] font-bold md:text-2xl">Abonelik</h1>
        <p className="mt-1 text-sm text-white/55">Planını, kredilerini ve sınırsız modellerini yönet.</p>
      </div>

      {/* Mevcut plan */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/60"><Sparkles className="h-4 w-4 text-rose-300" /> Abonelik</div>
            <h2 className="mt-2 text-lg font-bold">Plus Plan</h2>
            <p className="text-sm text-white/50">Planın 30 Temmuz 2026&rsquo;da yenilenir</p>
          </div>
          <button className="hf-cta rounded-xl px-5 py-2.5 text-sm font-semibold">Planı yükselt</button>
        </div>
        <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {plan.ozellikler.map((o) => (
            <div key={o.ad} className={cn("flex items-center gap-2 text-sm", o.var ? "text-white/75" : "text-white/35")}>
              {o.var ? <Check className="h-4 w-4 shrink-0 text-aksan" /> : <X className="h-4 w-4 shrink-0 text-white/30" />}
              {o.ad}
            </div>
          ))}
        </div>
      </section>

      {/* Krediler + Otomatik yenileme */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-white/60"><Coins className="h-4 w-4 text-aksan" /> Krediler</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-white/45">Aylık kalan kredi</div>
            <div className="text-2xl font-bold tabular-nums">{formatKredi(krediler)} / 1.000</div>
          </div>
          <button
            onClick={() => useKrediModal.getState().ac("kredi")}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/8"
          >
            + Kredi al
          </button>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-aksan" style={{ width: `${yuzde}%` }} />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
          <div className="pr-4">
            <h3 className="text-sm font-semibold">Otomatik yenileme</h3>
            <p className="mt-0.5 text-sm text-white/50">Kredi azaldığında otomatik yüklensin.</p>
          </div>
          <Toggle acik={otoYenile} onToggle={() => { setOtoYenile((v) => !v); toast.success(otoYenile ? "Otomatik yenileme kapatıldı" : "Otomatik yenileme açıldı"); }} />
        </div>
      </section>

      {/* Aktif sınırsız modeller tablosu */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-white/60"><InfinityIcon className="h-4 w-4 text-aksan" /> Aktif sınırsız modeller</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs text-white/45">
                <th className="pb-2 font-medium">Model Adı</th>
                <th className="pb-2 font-medium">Süre</th>
                <th className="pb-2 text-right font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {AKTIF_UNLIMITED.map((m) => (
                <tr key={m.ad} className="border-b border-white/6 last:border-0">
                  <td className="py-3 font-medium">{m.ad}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-aksan/12 px-2 py-0.5 text-xs font-medium text-aksan">{m.tip}</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-medium text-emerald-400">{m.durum}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Yaklaşan fatura */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <h3 className="mb-4 text-sm font-semibold">Yaklaşan fatura</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs text-white/45">
                <th className="pb-2 font-medium">Açıklama</th><th className="pb-2 font-medium">Son ödeme</th><th className="pb-2 text-right font-medium">Toplam</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-3 text-white/75">1 × Vayra Plus - aylık ($49,00 / ay)</td>
                <td className="py-3 text-white/60">30 Temmuz 2026</td>
                <td className="py-3 text-right font-semibold">$58,80</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Ödeme yöntemi */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4.5 w-4.5 text-aksan" /> Ödeme yöntemleri</div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <span className="flex h-8 w-12 items-center justify-center rounded bg-gradient-to-r from-orange-500 to-red-500 text-[10px] font-bold">MC</span>
          <div className="flex-1">
            <div className="text-sm font-medium">Mastercard •••• 5582</div>
            <div className="text-xs text-white/45">Son kullanma 12/29</div>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">Varsayılan</span>
        </div>
        <button
          onClick={() => useKrediModal.getState().ac("plan")}
          className="mt-3 w-full rounded-xl border border-dashed border-white/20 py-3 text-sm text-white/60 transition-colors hover:border-white/35 hover:text-white"
        >
          + Yeni ödeme yöntemi ekle
        </button>
      </section>

      {/* Fatura bilgisi */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div>
          <h3 className="text-sm font-semibold">Fatura bilgileri</h3>
          <p className="mt-0.5 text-sm text-white/50">Faturalarında görünen fatura bilgilerini yönet.</p>
        </div>
        <button
          onClick={() => useKrediModal.getState().ac("plan")}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/8"
        >
          Yönet
        </button>
      </section>
    </div>
  );
}

/* ══════════════════ 4 · Kullanım ══════════════════ */
function KullanimSekmesi() {
  const [tarihAralik, setTarihAralik] = useState("Son 7 gün");
  const [tarihAcik, setTarihAcik] = useState(false);
  const satirlar = useMemo(() => kullanimUret(), []);

  const araliklar = ["Bugün", "Son 7 gün", "Son ay", "Son 3-6 ay", "Son yıl", "Tümü"];

  // Harcama özeti — deterministik toplam
  const toplamKredi = satirlar.reduce((t, s) => t + s.kredi, 0);
  const stats = [
    { deger: "$39,813", etiket: "Toplam maliyet", renk: "text-emerald-400", ikon: Coins },
    { deger: "995,33", etiket: "Harcanan kredi", renk: "text-aksan", ikon: Zap },
    { deger: "23", etiket: "Kullanılan özellik", renk: "text-violet-300", ikon: Layers },
    { deger: "140", etiket: "Toplam üretim", renk: "text-amber-300", ikon: TrendingUp },
  ];

  // Renkli yığılmış çubuk legend'i
  const legend = [
    { ad: "Video Açıklayıcı", yuzde: 21, renk: "bg-emerald-400" },
    { ad: "Görsel → 3D", yuzde: 18, renk: "bg-rose-400" },
    { ad: "GPT Image 2.0", yuzde: 14, renk: "bg-sky-400" },
    { ad: "Pazarlama Stüdyosu Video", yuzde: 14, renk: "bg-violet-400" },
    { ad: "Akıllı mod", yuzde: 14, renk: "bg-fuchsia-400" },
    { ad: "Kling v3.0", yuzde: 6, renk: "bg-orange-400" },
    { ad: "Nano Banana Pro", yuzde: 3, renk: "bg-cyan-400" },
    { ad: "Soul ID", yuzde: 3, renk: "bg-green-400" },
    { ad: "Diğer", yuzde: 7, renk: "bg-white/30" },
  ];

  const boostKutulari = [
    { fiyat: "+4", not: "+4 eşzamanlı" },
    { fiyat: "+8", not: "+8 eşzamanlı" },
    { fiyat: "+12", not: "+12 eşzamanlı" },
    { fiyat: "+16", not: "+16 eşzamanlı" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[27px] font-bold md:text-2xl">Kullanım geçmişi</h1>
          <p className="mt-1 text-sm text-white/55">Kredi kullanımını, geçmişini ve istatistiklerini gör.</p>
        </div>
        {/* Tarih filtresi dropdown */}
        <div className="relative">
          <button
            onClick={() => setTarihAcik((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/8"
          >
            <Clock className="h-4 w-4" /> {tarihAralik} <ChevronDown className="h-4 w-4" />
          </button>
          {tarihAcik && (
            <div className="menu-surface absolute right-0 top-11 z-20 w-44 rounded-xl p-1.5">
              {araliklar.map((a) => (
                <button
                  key={a}
                  onClick={() => { setTarihAralik(a); setTarihAcik(false); }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/8"
                >
                  {a} {tarihAralik === a && <Check className="h-4 w-4 text-aksan" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Harcama özeti */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-white/60"><TrendingUp className="h-4 w-4 text-aksan" /> Harcama özeti</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.etiket}>
              <s.ikon className={cn("h-4 w-4", s.renk)} />
              <div className="mt-2 text-xl font-bold tabular-nums">{s.deger}</div>
              <div className="text-xs text-white/45">{s.etiket}</div>
            </div>
          ))}
        </div>
        {/* Yığılmış çubuk */}
        <div className="mt-5 flex h-3 overflow-hidden rounded-full">
          {legend.map((l) => (
            <div key={l.ad} className={l.renk} style={{ width: `${l.yuzde}%` }} title={`${l.ad} %${l.yuzde}`} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {legend.map((l) => (
            <div key={l.ad} className="flex items-center gap-1.5 text-xs text-white/55">
              <span className={cn("h-2 w-2 rounded-full", l.renk)} /> {l.ad} %{l.yuzde}
            </div>
          ))}
        </div>
      </section>

      {/* Eşzamanlılık boost kredileri */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/60"><Rocket className="h-4 w-4 text-aksan" /> Eşzamanlılık boost kredileri</div>
          <button onClick={() => useKrediModal.getState().ac("hiz")} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs transition-colors hover:bg-white/8">Daha fazla bilgi</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {boostKutulari.map((b) => (
            <div key={b.fiyat} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="text-lg font-bold tabular-nums text-aksan">{b.fiyat}</div>
              <div className="text-xs text-white/45">{b.not}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Kredi otomatik yenileme (pasif) */}
      <section className="flex items-center justify-between rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="pr-4">
          <h3 className="text-sm font-semibold">Otomatik yenileme kapalı</h3>
          <p className="mt-0.5 text-sm text-white/50">Kredi azaldığında otomatik yükleme için etkinleştir.</p>
        </div>
        <button
          onClick={() => toast.success("Otomatik yenileme açık", { description: "Krediler bittiğinde planına göre otomatik yenilenir." })}
          className="hf-cta rounded-xl px-4 py-2 text-sm font-semibold"
        >
          Kur & Etkinleştir
        </button>
      </section>

      {/* Kullanım geçmişi tablosu */}
      <section className="rounded-2xl border border-white/10 bg-yuzey p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-sm font-semibold">Kullanım geçmişi</h3>
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/60">301</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-xs text-white/45">
                <th className="pb-2 font-medium">Kredi</th>
                <th className="pb-2 font-medium">Özellik</th>
                <th className="pb-2 font-medium">İşlem</th>
                <th className="pb-2 text-right font-medium">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((s, i) => (
                <tr key={i} className="border-b border-white/6 transition-colors last:border-0 hover:bg-white/[0.03]">
                  <td className="py-2.5">
                    <span className="border-b border-dotted border-white/25 pb-px tabular-nums">{s.kredi} kredi</span>
                  </td>
                  <td className="py-2.5 text-white/70">{s.mod}</td>
                  <td className="py-2.5 text-white/55">{s.durum}</td>
                  <td className="py-2.5 text-right">
                    <span className="text-white/70">{s.tarih}</span> <span className="text-white/40">{s.saat}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Sayfalama */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/50">Göster</span>
            <span className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs">25 <ChevronDown className="h-3 w-3" /></span>
          </div>
          <span className="text-white/50">Sayfa 1 / 13</span>
          <div className="flex gap-1">
            <button disabled className="rounded-lg border border-white/10 px-2 py-1 text-white/25" aria-label="Önceki">‹</button>
            <button onClick={() => toast("Son sayfadasın", { description: "Gösterilecek başka kayıt yok." })} className="rounded-lg border border-white/15 px-2 py-1 transition-colors hover:bg-white/8" aria-label="Sonraki">›</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════ 5 · Promokod ══════════════════ */
function PromoSekmesi({ isim }: { isim: string }) {
  const [kod, setKod] = useState("");
  const krediEkle = useAuth((s) => s.krediEkle);
  const [kullanilan, setKullanilan] = useState<string[]>([]);

  const PROMO: Record<string, number> = { VAYRA50: 50, HOSGELDIN: 100, CYAN2026: 250, YARISMA: 500 };

  const uygula = () => {
    const k = kod.trim().toUpperCase();
    if (!k) return toast.error("Bir kod gir.");
    if (kullanilan.includes(k)) return toast.error("Bu kod zaten kullanıldı.");
    const bonus = PROMO[k];
    if (!bonus) return toast.error("Geçersiz kod", { description: "Kodu kontrol edip tekrar dene." });
    krediEkle(bonus);
    setKullanilan((v) => [...v, k]);
    setKod("");
    toast.success("Kod uygulandı 🎉", { description: `${bonus} bonus kredi eklendi.` });
  };

  return (
    /* Referansta bu sekme neredeyse BOŞ: sol üstte "Promosyon kodu" başlığı,
       ekranın ortasında çerçevesiz, dev ve soluk bir yer tutucu. Uygula butonu
       ancak yazı girilince belirir. */
    <div className="flex min-h-[58vh] flex-col">
      <h2 className="text-[27px] font-bold text-white md:text-2xl">Promosyon kodu</h2>
      <p className="mt-1.5 hidden text-sm text-white/45 md:block">{isim} için tanımlı kodları buradan kullanabilirsin.</p>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center">
        <input
          value={kod}
          onChange={(e) => setKod(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") uygula(); }}
          placeholder="Promosyon kodunu gir"
          aria-label="Promosyon kodu"
          className="w-full border-0 bg-transparent px-2 text-center text-[34px] font-bold uppercase leading-tight text-white outline-none placeholder:font-bold placeholder:normal-case placeholder:text-[#5A5C5E] md:text-3xl"
        />
        {kod.trim() && (
          <button onClick={uygula} className="hf-cta mt-6 w-full rounded-xl py-3.5 text-[15px] font-semibold">Uygula</button>
        )}
        {kullanilan.length > 0 && (
          <p className="mt-4 text-xs text-white/50">Kullanılan kodlar: {kullanilan.join(", ")}</p>
        )}
      </div>
    </div>
  );
}
