"use client";

/**
 * Ayar sayfalarının sağ panelleri: her biri o sayfadaki ayarların sonucunu canlı gösterir.
 * (Profil, üretim, güvenlik, plan ve kredi panelleri kendi sayfalarında.)
 */

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Code2, Copy, EyeOff, Gift, Globe2, Heart, Link2, Lock, Repeat2, Send, Sparkles, Ticket } from "lucide-react";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useAyarTercih, useGorunurluk } from "@/store/useAyarTercih";
import { useTercih, VURGU_RENKLERI } from "@/store/useTercih";
import { KrediIsiltiHap } from "@/components/ui/KrediHap";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { kopyala } from "@/lib/gercekEylem";
import { tarih } from "@/lib/ayarlar";
import { sayi } from "@/lib/fiyat";
import { cn } from "@/lib/utils";
import { Avatar, useHesapKaydi } from "./AyarKabugu";
import { akis } from "./ui";

const kart = "overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]";
const YEDEK = "/gercek/galeri/sinematik2.webp";

/** Gizlilik: açık bir üretimin toplulukta nasıl göründüğü. */
export function GizlilikOnizleme() {
  const k = useAuth((s) => s.kullanici)!;
  const g = useAyarTercih((s) => s.gizlilik);
  const gor = useGorunurluk();
  const uretim = useProjeler((s) => s.uretimler.find((u) => u.tur === "gorsel" && u.durum === "tamam" && u.gorselUrl?.startsWith("/")));
  const gorsel = uretim?.gorselUrl ?? YEDEK;
  const istem = uretim?.meta?.hamIstem ?? uretim?.prompt ?? "Sisli bir dağ vadisinde gün doğumu, sinematik ışık, geniş açı";
  const G = { ozel: { ad: "Özel", ikon: Lock }, baglanti: { ad: "Bağlantıyla", ikon: Link2 }, acik: { ad: "Herkese açık", ikon: Globe2 } }[gor];
  return (
    <div className={kart}>
      <p className="flex items-center justify-between px-5 pt-4 text-[13px] text-white/50"><span>Toplulukta böyle görünür</span><span className="flex items-center gap-1.5 text-white/70"><G.ikon className="h-3.5 w-3.5" />{G.ad}</span></p>
      <div className="relative mx-5 mt-3 aspect-[4/3] overflow-hidden rounded-[14px]">
        <motion.img key={gorsel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={gorsel} alt="" className={cn("h-full w-full object-cover transition-[filter] duration-500", gor === "ozel" && "blur-[2px] brightness-50")} />
        {gor === "ozel" && <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/85"><Lock className="h-6 w-6" /><span className="text-[13px] font-medium">Yalnız sen görürsün</span></span>}
        {g.filigran && <span className="absolute bottom-2 right-2.5 flex items-center gap-1 text-[11px] font-semibold text-white/80"><VayraIsaret size={14} />Vayra</span>}
      </div>
      <div className="px-5 pb-5 pt-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar ad={k.ad} src={k.avatar} boyut={28} />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-white">{k.ad}</span>
          <span className="flex items-center gap-1 text-[12.5px] text-white/45"><Heart className="h-3.5 w-3.5" />24</span>
        </div>
        <motion.p layout className={cn("mt-3 rounded-[12px] px-3 py-2.5 text-[13px] leading-relaxed", g.istemGoster ? "bg-white/[0.04] text-white/70" : "bg-white/[0.02] text-white/35")}>
          {g.istemGoster ? <span className="line-clamp-3">{istem}</span> : <span className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5" />İstem gizli</span>}
        </motion.p>
        <div className="mt-3 flex gap-2">
          <span className={cn("flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium transition-colors", g.remiks ? "bg-white text-black" : "bg-white/[0.05] text-white/30 line-through")}><Repeat2 className="h-3.5 w-3.5" />Remiksle</span>
          <span className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[12.5px] font-medium text-white/80"><Sparkles className="h-3.5 w-3.5" />İstemi kullan</span>
        </div>
        {g.kimlikBilgisi && <p className="mt-3 flex items-center gap-1.5 text-[12px] text-white/40"><Check className="h-3.5 w-3.5 text-emerald-300" />Yapay zekâ etiketi dosyaya eklenir</p>}
      </div>
    </div>
  );
}

/** Hesap: kimlik kartı. */
export function HesapKimlikKarti({ kimlik }: { kimlik: string }) {
  const k = useAuth((s) => s.kullanici)!;
  const { kayit } = useHesapKaydi();
  const gun = Math.max(0, Math.floor((Date.now() - kayit.olusturma) / 86_400_000));
  const yontem = (kayit.sifre ? 1 : 0) + (kayit.saglayici ? 1 : 0);
  return (
    <div className={kart}>
      <div className="relative h-[92px] overflow-hidden" style={{ background: "radial-gradient(90% 140% at 10% 0%, rgba(85,214,253,0.35), transparent 60%), radial-gradient(80% 120% at 100% 100%, rgba(120,90,255,0.3), transparent 60%), #121418" }}>
        <span className="absolute right-4 top-4 opacity-70"><VayraIsaret size={26} /></span>
      </div>
      <div className="relative z-10 -mt-8 px-5">
        <div className="w-fit rounded-full ring-4 ring-[#121214]"><Avatar ad={k.ad} src={k.avatar} boyut={60} /></div>
        <p className="mt-2 text-[16px] font-semibold text-white">{k.ad}</p>
        <p className="truncate text-[13px] text-white/45">{k.email}</p>
      </div>
      <dl className="mx-5 mt-4 divide-y divide-white/[0.06] rounded-[14px] bg-white/[0.03] text-[13px]">
        <div className="flex items-center justify-between px-3.5 py-2.5"><dt className="text-white/45">Üyelik</dt><dd className="text-white">{gun === 0 ? "Bugün başladı" : `${sayi(gun)} gündür`}</dd></div>
        <div className="flex items-center justify-between px-3.5 py-2.5"><dt className="text-white/45">Plan</dt><dd className="text-white">{PLAN_ADI[k.plan]}</dd></div>
        <div className="flex items-center justify-between px-3.5 py-2.5"><dt className="text-white/45">Giriş yöntemi</dt><dd className="text-white">{yontem ? `${yontem} yöntem` : "E-posta bağlantısı"}</dd></div>
      </dl>
      {/* Hesap kimliği burada tekrar edilmez; Hesap bilgileri kartında kopyalanabilir satır olarak duruyor. */}
      <p className="px-5 pb-5 pt-3 text-[12px] leading-relaxed text-white/40">{tarih(kayit.olusturma)} tarihinde açıldı.</p>
    </div>
  );
}

/** Görünüm: seçili rengin ve hareketin stüdyoda nasıl durduğu. */
export function GorunumOnizleme() {
  const t = useTercih();
  const b = useAyarTercih((s) => s.bolge);
  const v = VURGU_RENKLERI.find((x) => x.id === t.vurgu) ?? VURGU_RENKLERI[0];
  const simdi = new Date();
  return (
    <div className={kart}>
      <p className="px-5 pt-4 text-[13px] text-white/50">Stüdyoda böyle görünür</p>
      <div className="m-5 mt-3 overflow-hidden rounded-[16px] bg-black/40 ring-1 ring-white/[0.06]">
        <div className="relative aspect-[16/10]">
          <img src="/gercek/galeri/manzara3.webp" alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-x-3 bottom-3 h-1.5 overflow-hidden rounded-full bg-black/50"><motion.span key={v.id} initial={{ width: "10%" }} animate={{ width: "68%" }} transition={{ duration: t.hareket === "azalt" ? 0 : 1.2, ease: akis }} className="block h-full rounded-full" style={{ background: v.renk }} /></span>
        </div>
        <div className="space-y-2.5 p-3">
          <div className="flex gap-1.5">
            <span className="flex h-7 items-center rounded-full px-2.5 text-[12px] font-medium text-white ring-[1.5px] ring-inset transition-colors" style={{ ["--tw-ring-color" as string]: v.renk, background: `${v.renk}22` }}>16:9</span>
            <span className="flex h-7 items-center rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/50">1:1</span>
            <span className="ml-auto flex items-center gap-1.5 text-[12px] text-white/45">HD<span className="relative h-[18px] w-[30px] rounded-full transition-colors" style={{ background: v.renk }}><span className="absolute right-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-white" /></span></span>
          </div>
          <span className="flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors" style={{ background: v.renk, color: v.ust }}><Sparkles className="h-3.5 w-3.5" />Oluştur</span>
        </div>
      </div>
      <dl className="mx-5 mb-5 divide-y divide-white/[0.06] rounded-[14px] bg-white/[0.03] text-[13px]">
        <div className="flex items-center justify-between px-3.5 py-2.5"><dt className="text-white/45">Vurgu</dt><dd className="flex items-center gap-1.5 text-white"><span className="h-3 w-3 rounded-full" style={{ background: v.renk }} />{v.ad}</dd></div>
        <div className="flex items-center justify-between px-3.5 py-2.5"><dt className="text-white/45">Hareket</dt><dd className="text-white">{{ sistem: "Sisteme uy", tam: "Tam", azalt: "Azalt" }[t.hareket]}</dd></div>
        <div className="flex items-center justify-between px-3.5 py-2.5"><dt className="text-white/45">Saat</dt><dd className="tabular-nums text-white">{(() => { try { return simdi.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: b.saatDilimi }); } catch { return ""; } })()}</dd></div>
      </dl>
    </div>
  );
}

/** Geliştirici: API kartı. */
export function ApiKarti() {
  const k = useAuth((s) => s.kullanici)!;
  const ornek = `curl https://vayra.ai/api/v1/generations \\\n  -H "Authorization: Bearer $VAYRA_API_KEY" \\\n  -d '{"model":"nano-banana-pro"}'`;
  return (
    <div className={kart}>
      <div className="flex items-center gap-3 p-5 pb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd] text-[#06222b]"><Code2 className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-white">Vayra API</span><span className="text-[12.5px] text-white/45">v1, REST ve MCP</span></span>
      </div>
      <div className="mx-5 overflow-hidden rounded-[12px] bg-black/50 ring-1 ring-white/[0.06]">
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2"><span className="h-2 w-2 rounded-full bg-[#ff5f57]" /><span className="h-2 w-2 rounded-full bg-[#febc2e]" /><span className="h-2 w-2 rounded-full bg-[#28c840]" /><span className="ml-2 text-[11.5px] text-white/35">cURL</span></div>
        <pre className="sc-kod overflow-x-auto px-3 py-2.5 text-[11.5px] leading-relaxed text-white/75">{ornek}</pre>
      </div>
      <div className="mx-5 mt-4 flex items-center justify-between"><span className="text-[13px] text-white/50">Ortak bakiye</span><KrediIsiltiHap deger={k.krediler} href="/panel/kredi?sekme=kredi" /></div>
      <div className="m-5 mt-4 grid grid-cols-2 gap-2">
        <Link href="/panel/api/dokuman" className="flex h-9 items-center justify-center rounded-full bg-white/[0.07] text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]">Doküman</Link>
        <Link href="/panel/api" className="flex h-9 items-center justify-center gap-1 rounded-full bg-white text-[13px] font-semibold text-black">Konsol<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}

/** Hediye: özet ve nasıl çalışır. */
export function HediyeOzet() {
  const { kayit } = useHesapKaydi();
  const kazanilan = useMemo(() => kayit.hareketler.filter((h) => h.tur === "promo" || h.tur === "hediye").reduce((a, h) => a + h.kredi, 0), [kayit.hareketler]);
  const gonderilen = (kayit.gonderilenler ?? []).reduce((a, g) => a + g.kredi, 0);
  return (
    <div className={kart}>
      <dl className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.06]">
        <div className="px-5 py-4"><dt className="text-[12.5px] text-white/45">Kodlardan</dt><dd className="mt-1 text-[22px] font-semibold tabular-nums text-emerald-300">+{sayi(kazanilan)}</dd></div>
        <div className="px-5 py-4"><dt className="text-[12.5px] text-white/45">Hediye ettiğin</dt><dd className="mt-1 text-[22px] font-semibold tabular-nums text-white">{sayi(gonderilen)}</dd></div>
      </dl>
      <ol className="space-y-4 p-5">
        {[[Gift, "Tutarı seç", "Bakiyenden 100 ile 2.500 kredi ayır; kredi hemen düşer."], [Send, "Kodu paylaş", "Kod ya da bağlantı tek kullanımlıktır."], [Ticket, "Arkadaşın kullanır", "Kodu bu sayfada girer, kredi anında hesabına geçer."]].map(([I, b, a], i) => {
          const Ik = I as typeof Gift;
          return (
            <motion.li key={b as string} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/75"><Ik className="h-4 w-4" /></span>
              <span><span className="block text-[13.5px] font-medium text-white">{b as string}</span><span className="block text-[12.5px] leading-snug text-white/45">{a as string}</span></span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
