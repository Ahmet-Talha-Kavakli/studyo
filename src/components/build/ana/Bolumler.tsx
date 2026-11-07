"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight, Copy, ExternalLink, FileArchive, FolderOpen, Globe, ImagePlus, LayoutTemplate, Link2, Loader2, LogOut, Monitor, MoreHorizontal, PenLine, Plus, Search, Share2, Sparkles, Trash2, Users,
} from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece, projeOlustur } from "@/lib/build/istemci";
import { SABLON_OZETLERI, type SablonOzet } from "@/lib/build/sablonlar/ozet";
import { PROJE_TURLERI, type ProjeOzet, type ProjeTur } from "@/lib/build/tipler";
import { zipOku } from "@/lib/build/zipOku";
import { cn } from "@/lib/utils";
import { TURLER } from "./BuildHero";
import { SablonDetay } from "./SablonDetay";
import { PaylasPaneli } from "@/components/build/paylasim/PaylasPaneli";
import { ToplulugaEklePaneli } from "@/components/build/paylasim/ToplulugaEklePaneli";
import { PaylasiliyorHapi, usePaylasimDurumu } from "@/components/build/paylasim/ortak";
import { RolHapi } from "@/components/build/ekip/ortak";

/** Proje kartı kapağı: gerçek ekran görüntüsü; yoksa projeyi yanıltmayan sade bir boş kutu (tür simgesiyle). */
export function ProjeKapagi({ p, kucuk }: { p: Pick<ProjeOzet, "kapak" | "tur">; kucuk?: boolean }) {
  if (p.kapak) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.kapak} alt="" loading="lazy" className={kucuk ? "h-10 w-16 shrink-0 rounded-[8px] object-cover object-top ring-1 ring-inset ring-white/[0.08]" : "h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"} />;
  }
  const T = TURLER.find((t) => t.id === p.tur);
  const I = T?.ikon;
  if (kucuk) return <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.08]">{I && <I className="h-4 w-4 text-white/40" />}</span>;
  return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(85,214,253,0.07),transparent_60%)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">{I && <I className="h-5 w-5 text-white/55" />}</span>
      <span className="text-[12px] text-white/40">Henüz önizleme yok</span>
    </span>
  );
}

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
const TUR_AD: Record<ProjeTur, string> = { site: "Web sitesi", uygulama: "Web uygulaması", oyun: "Oyun", mobil: "Mobil uygulama" };
const ikonu = (t: ProjeTur) => TURLER.find((x) => x.id === t)!.ikon;

/** Kayan beyaz seçimli süzgeç (sitenin segment dili). */
export function Suzgec<T extends string>({ id, deger, set, l }: { id: string; deger: T; set: (v: T) => void; l: { id: T; ad: string; sayi?: number }[] }) {
  return (
    <LayoutGroup id={id}>
      <div className="flex max-w-full overflow-x-auto rounded-full bg-white/[0.08] p-0.5 [scrollbar-width:none]">
        {l.map((x) => (
          <button key={x.id} type="button" onClick={() => set(x.id)} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors", deger === x.id ? "text-black" : "text-white/60 hover:text-white")}>
            {deger === x.id && <motion.span layoutId={`${id}-z`} transition={yay} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative">{x.ad}</span>
            {x.sayi != null && <span className={cn("relative tabular-nums", deger === x.id ? "text-black/50" : "text-white/35")}>{x.sayi}</span>}
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/* ───────────── Elindekiyle başla ───────────── */
export function ElindekiyleBasla({ ekranGoruntusu }: { ekranGoruntusu: (f: File) => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [d, setD] = useState<"" | "url" | "zip">("");
  const [hata, setHata] = useState("");
  const zip = useRef<HTMLInputElement>(null);
  const gorsel = useRef<HTMLInputElement>(null);

  const urlBasla = async () => {
    const u = url.trim();
    if (!/^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(u)) { setHata("Bir web adresi, GitHub deposu ya da Figma bağlantısı yaz: eskisitem.com, github.com/kullanici/depo"); return; }
    setD("url"); setHata("");
    // Figma çerçevesi: sunucu görsele çevirir (FIGMA_TOKEN yoksa açıkça söyler), ajan görsel ve metinlerle kurar.
    if (/^(https?:\/\/)?([a-z0-9-]+\.)?figma\.com\//i.test(u)) {
      try {
        const v = await api<{ ad: string; gorsel: string; metinler: string[]; genislik: number | null }>("/api/build/proje/figma", { govde: { url: u } });
        const istem = `Bu Figma tasarımını (${v.ad}) çalışan, mobilde de düzgün bir siteye birebir çevir. Renkleri, yazı tiplerini, boşlukları ve düzeni görseldeki gibi koru.${v.metinler.length ? `\nTasarımdaki metinler:\n${v.metinler.slice(0, 60).join("\n")}` : ""}`;
        const id = await projeOlustur({ tur: "site", ad: v.ad.slice(0, 60), istem });
        try { sessionStorage.setItem(`vayra-build-ilk-${id}`, JSON.stringify({ istem, mod: "yap", ekler: [{ tur: "gorsel", url: v.gorsel, ad: `${v.ad}.png` }] })); } catch { /* çok büyük görsel: istem yine gider */ }
        router.push(`/panel/build/${id}`);
      } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Figma tasarımı alınamadı."); setD(""); }
      return;
    }
    // GitHub deposu: dosyaları olduğu gibi içe aktar (herkese açık depolar).
    if (/^(https?:\/\/)?(www\.)?github\.com\/[^/]+\/[^/]+/i.test(u)) {
      try { const v = await api<{ id: string; atlanan: number }>("/api/build/github/ice-aktar", { govde: { url: u } }); if (v.atlanan) try { sessionStorage.setItem(`vayra-build-not-${v.id}`, String(v.atlanan)); } catch { /* yok */ } router.push(`/panel/build/${v.id}`); }
      catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Depo içe aktarılamadı."); setD(""); }
      return;
    }
    try {
      const ad = u.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
      const istem = `Bu siteyi modern ve özgün bir tasarımla yeniden kur: ${u}`;
      const id = await projeOlustur({ tur: "site", ad, istem });
      try { sessionStorage.setItem(`vayra-build-ilk-${id}`, JSON.stringify({ istem, mod: "yap", ekler: [], kaynakUrl: u })); } catch { /* yok */ }
      router.push(`/panel/build/${id}`);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Başlatılamadı."); setD(""); }
  };
  const zipAl = async (f: File) => {
    setD("zip"); setHata("");
    try {
      const { dosyalar, atlanan } = await zipOku(f);
      if (!Object.keys(dosyalar).length) throw new Error("Zip içinde site dosyası (html, css, js) bulunamadı.");
      const v = await api<{ id: string }>("/api/build/proje", { govde: { iceAktar: { ad: f.name.replace(/\.zip$/i, ""), tur: "site", dosyalar } } });
      if (atlanan) try { sessionStorage.setItem(`vayra-build-not-${v.id}`, String(atlanan)); } catch { /* yok */ }
      router.push(`/panel/build/${v.id}`);
    } catch (e) { setHata(e instanceof Error ? e.message : "Zip açılamadı."); setD(""); }
  };

  return (
    <Kart ikon={Sparkles} baslik="Elindekiyle başla" alt="Eski siten, bir tasarım görseli ya da hazır kodun varsa oradan devam et" govde="grid grid-cols-3 gap-3 p-4 max-lg:grid-cols-1 sm:p-5">
      {/* Web adresi */}
      <div className="flex flex-col rounded-[20px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#7fe0ff]"><Link2 className="h-[18px] w-[18px]" /></span>
        <p className="mt-3 text-[14.5px] font-semibold text-white">Web adresi, GitHub ya da Figma</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">Var olan siteni oku ve modern bir tasarımla yeniden kursun; GitHub deposu olduğu gibi gelir, Figma çerçeve bağlantısı birebir siteye çevrilir.</p>
        <form onSubmit={(e) => { e.preventDefault(); urlBasla(); }} className="mt-3.5 flex h-10 items-center gap-1 rounded-full bg-white/[0.06] pl-3.5 pr-1 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
          <Globe className="h-3.5 w-3.5 shrink-0 text-white/40" />
          <input value={url} onChange={(e) => { setUrl(e.target.value); setHata(""); }} placeholder="eskisitem.com, GitHub ya da Figma bağlantısı" inputMode="url" autoCapitalize="none" spellCheck={false} className="h-full min-w-0 flex-1 bg-transparent px-1.5 text-[13.5px] text-white outline-none placeholder:text-white/30" />
          <button disabled={!url.trim() || !!d} aria-label="Başlat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30">{d === "url" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}</button>
        </form>
      </div>
      {/* Ekran görüntüsü */}
      <button type="button" onClick={() => gorsel.current?.click()} className="group flex flex-col rounded-[20px] bg-white/[0.03] p-4 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
        <input ref={gorsel} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) ekranGoruntusu(f); e.target.value = ""; }} />
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-violet-400/[0.12] text-violet-300"><ImagePlus className="h-[18px] w-[18px]" /></span>
        <p className="mt-3 text-[14.5px] font-semibold text-white">Ekran görüntüsünden</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">Beğendiğin bir tasarımın görselini, eskizini ya da Figma çıktısını ekle; ona göre kursun.</p>
        <span className="mt-auto flex items-center gap-1.5 pt-3.5 text-[13px] font-medium text-white/75 group-hover:text-white">Görsel seç<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
      </button>
      {/* Zip */}
      <button type="button" onClick={() => zip.current?.click()} disabled={!!d} className="group flex flex-col rounded-[20px] bg-white/[0.03] p-4 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05] disabled:opacity-60">
        <input ref={zip} type="file" accept=".zip,application/zip" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) zipAl(f); e.target.value = ""; }} />
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-amber-300/[0.12] text-amber-200">{d === "zip" ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <FileArchive className="h-[18px] w-[18px]" />}</span>
        <p className="mt-3 text-[14.5px] font-semibold text-white">Zip dosyasından</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/50">HTML, CSS ve JavaScript'ten oluşan bir siteyi içe aktar; sohbetle geliştirmeye devam et.</p>
        <span className="mt-auto flex items-center gap-1.5 pt-3.5 text-[13px] font-medium text-white/75 group-hover:text-white">Zip seç<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
      </button>
      <AnimatePresence>{hata && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full text-[13px] text-rose-300">{hata}</motion.p>}</AnimatePresence>
    </Kart>
  );
}

/* ───────────── Projelerin ───────────── */
function ProjeMenusu({ p, kapat, yenile, adlandir, panelAc }: { p: ProjeOzet; kapat: () => void; yenile: () => void; adlandir: () => void; panelAc: (t: "paylas" | "topluluk") => void }) {
  const router = useRouter();
  const paylasiliyor = usePaylasimDurumu((d) => !!d.paylasilan[p.id]);
  const toplulukta = usePaylasimDurumu((d) => !!d.toplulukta[p.id]);
  const [sil, setSil] = useState(false);
  const [is, setIs] = useState(false);
  const paylasilan = !!p.ekipRol;
  return (
    <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={yay}
      onClick={(e) => e.stopPropagation()} className="absolute right-2 top-11 z-30 w-[220px] rounded-[16px] bg-[#1b1c1f] p-1.5 text-left ring-1 ring-inset ring-white/[0.1]">
      {sil ? (
        <div className="p-2">
          <p className="text-[13px] font-semibold text-white">{paylasilan ? "Projeden ayrılınsın mı?" : "Proje silinsin mi?"}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-white/50">{paylasilan ? "Listenden çıkar; yeniden katılmak için yeni bir davet gerekir." : "Çöp kutusuna taşınır; 30 gün içinde Projeler sayfasından geri alabilirsin."}</p>
          <div className="mt-2.5 flex gap-1.5">
            <button type="button" disabled={is} onClick={async () => { setIs(true); await (paylasilan ? api(`/api/build/proje/${p.id}/ekip`, { govde: { islem: "ayril" } }) : api(`/api/build/proje/${p.id}`, { method: "DELETE" })).catch(() => {}); kapat(); yenile(); }} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-rose-500 text-[12.5px] font-semibold text-white">{is && <Loader2 className="h-3 w-3 animate-spin" />}{paylasilan ? "Ayrıl" : "Sil"}</button>
            <button type="button" onClick={() => setSil(false)} className="h-8 flex-1 rounded-full bg-white/[0.08] text-[12.5px] text-white">Vazgeç</button>
          </div>
        </div>
      ) : (
        ([
          [ExternalLink, "Aç", () => router.push(`/panel/build/${p.id}`)],
          ...(paylasilan ? [] : [[Share2, "Paylaş", () => { panelAc("paylas"); kapat(); }] as const, [Users, "Topluluğa ekle", () => { panelAc("topluluk"); kapat(); }] as const]),
          ...(p.ekipRol === "izleyici" ? [] : [[PenLine, "Yeniden adlandır", () => { adlandir(); kapat(); }] as const]),
          [Copy, "Kopyasını oluştur", async () => { setIs(true); await projeOlustur({ kopya: p.id }).catch(() => {}); kapat(); yenile(); }],
          paylasilan ? [LogOut, "Projeden ayrıl", () => setSil(true)] as const : [Trash2, "Sil", () => setSil(true)] as const,
        ] as const).map(([I, a, f]) => (
          <button key={a} type="button" onClick={f} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] hover:bg-white/[0.06]", a === "Sil" || a === "Projeden ayrıl" ? "text-rose-300" : "text-white/80 hover:text-white")}>
            <I className="h-4 w-4 opacity-70" />{a}{is && a === "Kopyasını oluştur" && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
            {a === "Paylaş" && paylasiliyor && <span className="ml-auto flex items-center gap-1 text-[11.5px] text-[#a8ecff]"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Açık</span>}
            {a === "Topluluğa ekle" && toplulukta && <span className="ml-auto text-[11.5px] text-[#a8ecff]">Toplulukta</span>}
          </button>
        ))
      )}
    </motion.div>
  );
}

function ProjeKarti({ p, yenile, panelAc }: { p: ProjeOzet; yenile: () => void; panelAc: (t: "paylas" | "topluluk") => void }) {
  const router = useRouter();
  const paylasiliyor = usePaylasimDurumu((d) => !!d.paylasilan[p.id]);
  const [menu, setMenu] = useState(false);
  const [ad, setAd] = useState<string | null>(null);
  const I = ikonu(p.tur);
  useEffect(() => {
    if (!menu) return;
    const k = () => setMenu(false);
    const t = setTimeout(() => addEventListener("click", k), 0);
    return () => { clearTimeout(t); removeEventListener("click", k); };
  }, [menu]);
  return (
    <div role="link" tabIndex={0} onClick={() => ad === null && router.push(`/panel/build/${p.id}`)} onKeyDown={(e) => { if (e.key === "Enter" && ad === null) router.push(`/panel/build/${p.id}`); }}
      className="group relative cursor-pointer rounded-[20px] bg-white/[0.03] text-left ring-1 ring-inset ring-white/[0.07] transition-[background-color,box-shadow] hover:bg-white/[0.05] hover:ring-white/[0.16]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-[20px] bg-[#16171a]">
        <ProjeKapagi p={p} />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          {p.yayin && <span className="flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-white backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Yayında</span>}
          {paylasiliyor && <PaylasiliyorHapi />}
          {p.ekipRol && <RolHapi rol={p.ekipRol} koyu />}
        </span>
        <button type="button" aria-label="Proje menüsü" onClick={(e) => { e.stopPropagation(); setMenu((x) => !x); }}
          className={cn("absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-opacity hover:bg-black/75", menu ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      <AnimatePresence>{menu && <ProjeMenusu p={p} kapat={() => setMenu(false)} yenile={yenile} adlandir={() => setAd(p.ad)} panelAc={panelAc} />}</AnimatePresence>
      <div className="flex items-center gap-3 p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white/75"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          {ad !== null ? (
            <form onClick={(e) => e.stopPropagation()} onSubmit={async (e) => { e.preventDefault(); if (ad.trim() && ad !== p.ad) await api(`/api/build/proje/${p.id}`, { method: "PATCH", govde: { ad: ad.trim() } }).catch(() => {}); setAd(null); yenile(); }}>
              <input autoFocus value={ad} maxLength={60} onChange={(e) => setAd(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} onKeyDown={(e) => e.key === "Escape" && setAd(null)} className="h-8 w-full rounded-[9px] bg-white/[0.08] px-2 text-[14px] text-white outline-none ring-1 ring-inset ring-white/30" />
            </form>
          ) : <span className="block truncate text-[14.5px] font-medium text-white">{p.ad}</span>}
          <span className="block truncate text-[12px] text-white/45">{p.ekipRol ? `${p.sahipAd || "Sahibi"} paylaştı` : TUR_AD[p.tur]} · {gorece(p.guncelleme)}{p.surumSayisi ? ` · ${p.surumSayisi} sürüm` : ""}</span>
        </span>
      </div>
    </div>
  );
}

export function Projeler({ projeler, yenile, yeni, ozet, toplam }: { projeler: ProjeOzet[] | null; yenile: () => void; yeni: () => void; ozet?: boolean; toplam?: number }) {
  const [ara, setAra] = useState("");
  const [panel, setPanel] = useState<{ tur: "paylas" | "topluluk"; id: string } | null>(null);
  const durumYukle = usePaylasimDurumu((d) => d.yukle);
  useEffect(() => { if (projeler?.length) durumYukle(); }, [projeler, durumYukle]);
  const [tur, setTur] = useState<"hepsi" | ProjeTur>("hepsi");
  const l = useMemo(() => (projeler ?? []).filter((p) => (tur === "hepsi" || p.tur === tur) && (!ara.trim() || p.ad.toLocaleLowerCase("tr").includes(ara.trim().toLocaleLowerCase("tr")))), [projeler, tur, ara]);
  const sayi = (t: ProjeTur) => (projeler ?? []).filter((p) => p.tur === t).length;
  const turler = PROJE_TURLERI.filter((t) => sayi(t.id) > 0);
  return (
    <Kart ikon={FolderOpen} baslik={ozet ? "Son projelerin" : "Projelerin"} alt={projeler === null ? "Yükleniyor" : (toplam ?? projeler.length) ? `${toplam ?? projeler.length} proje · son düzenlenen önde` : "Henüz proje yok"}
      sag={ozet ? (toplam ?? 0) > projeler!.length ? <Link href="/panel/build/projeler" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]">Tümü<ArrowRight className="h-3.5 w-3.5" /></Link> : undefined : projeler && projeler.length > 3 ? (
        <label className="flex h-9 w-[220px] items-center gap-2 rounded-full bg-white/[0.08] px-3 text-white/45 ring-1 ring-inset ring-transparent focus-within:ring-white/25 max-md:hidden">
          <Search className="h-3.5 w-3.5" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Projelerde ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />
        </label>
      ) : undefined}
      govde="p-4 sm:p-5">
      {!ozet && turler.length > 1 && (
        <div className="mb-4"><Suzgec id="proje-tur" deger={tur} set={setTur} l={[{ id: "hepsi" as const, ad: "Hepsi", sayi: projeler?.length }, ...turler.map((t) => ({ id: t.id, ad: t.ad, sayi: sayi(t.id) }))]} /></div>
      )}
      {projeler === null ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[16/12] animate-pulse rounded-[20px] bg-white/[0.04]" />)}</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 max-[420px]:grid-cols-1">
          <button type="button" onClick={yeni} className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-white/[0.14] text-white/60 transition-colors hover:border-white/30 hover:bg-white/[0.03] hover:text-white">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] transition-transform group-hover:scale-105"><Plus className="h-5 w-5" /></span>
            <span className="text-[14px] font-medium">Yeni proje</span>
          </button>
          {l.map((p) => <ProjeKarti key={p.id} p={p} yenile={yenile} panelAc={(t) => setPanel({ tur: t, id: p.id })} />)}
          {projeler.length > 0 && !l.length && <p className="col-span-full py-6 text-center text-[13px] text-white/45">Bu süzgece uyan proje yok.</p>}
        </div>
      )}
      <PaylasPaneli projeId={panel?.tur === "paylas" ? panel.id : null} acik={panel?.tur === "paylas"} kapat={() => setPanel(null)} toplulugaEkle={() => setPanel((x) => (x ? { tur: "topluluk", id: x.id } : x))} />
      <ToplulugaEklePaneli projeId={panel?.tur === "topluluk" ? panel.id : null} acik={panel?.tur === "topluluk"} kapat={() => setPanel(null)} />
    </Kart>
  );
}

/* ───────────── Şablonlar ───────────── */
export function Sablonlar({ kullan, gidiyor, ozet }: { kullan: (id: string) => void; gidiyor: string | null; ozet?: boolean }) {
  const [tur, setTur] = useState<"hepsi" | ProjeTur>("hepsi");
  const [onizle, setOnizle] = useState<SablonOzet | null>(null);
  const l = SABLON_OZETLERI.filter((s) => tur === "hepsi" || s.tur === tur).slice(0, ozet ? 8 : undefined);
  const sayi = (t: ProjeTur) => SABLON_OZETLERI.filter((s) => s.tur === t).length;
  return (
    <Kart ikon={LayoutTemplate} baslik="Şablonlar" alt="Çalışan projeler: canlı dene, kopyala, sohbetle kendine uyarla. Kredi harcamaz."
      sag={ozet ? <Link href="/panel/build/sablonlar" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]">Tümü<ArrowRight className="h-3.5 w-3.5" /></Link> : <span className="max-md:hidden"><Suzgec id="sablon-tur" deger={tur} set={setTur} l={[{ id: "hepsi" as const, ad: "Hepsi", sayi: SABLON_OZETLERI.length }, ...PROJE_TURLERI.map((t) => ({ id: t.id, ad: t.ad, sayi: sayi(t.id) }))]} /></span>}
      govde="p-4 sm:p-5">
      {!ozet && <div className="mb-4 md:hidden"><Suzgec id="sablon-tur-m" deger={tur} set={setTur} l={[{ id: "hepsi" as const, ad: "Hepsi" }, ...PROJE_TURLERI.map((t) => ({ id: t.id, ad: t.ad }))]} /></div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 max-[420px]:grid-cols-1">
        {l.map((s) => {
          const I = ikonu(s.tur);
          return (
            <div key={s.id} className="group overflow-hidden rounded-[20px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition-[box-shadow,background-color] hover:bg-white/[0.05] hover:ring-white/[0.16]">
              <button type="button" onClick={() => setOnizle(s)} className="relative block aspect-[16/10] w-full overflow-hidden bg-[#16171a]" aria-label={`${s.ad} canlı önizle`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.kapak} alt="" loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute left-2.5 top-2.5 flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-white backdrop-blur"><I className="h-3 w-3" />{TUR_AD[s.tur]}</span>
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Monitor className="h-3.5 w-3.5" />Canlı önizle</span>
                </span>
              </button>
              <div className="flex items-start gap-3 p-3.5">
                <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-medium text-white">{s.ad}</span><span className="line-clamp-2 text-[12.5px] leading-snug text-white/45">{s.aciklama}</span></span>
                <button type="button" onClick={() => kullan(s.id)} disabled={!!gidiyor} title="Bu şablonla başla" className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50">
                  {gidiyor === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kullan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>{onizle && <SablonDetay oge={{ kaynak: "vayra", s: onizle }} kapat={() => setOnizle(null)} kullan={() => kullan(onizle.id)} gidiyor={gidiyor === onizle.id} />}</AnimatePresence>
    </Kart>
  );
}
