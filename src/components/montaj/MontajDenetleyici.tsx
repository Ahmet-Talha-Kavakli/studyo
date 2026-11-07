"use client";

import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  Film, Image as ImageIcon, Music2, Type as TypeIcon, Scissors, Copy, Trash2, Diamond, RotateCcw,
  AlignLeft, AlignCenter, AlignRight, ArrowUpToLine, AlignVerticalJustifyCenter, ArrowDownToLine, Maximize, Minimize, Droplets, FlipHorizontal2, FlipVertical2, Ban, Shapes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  useMontaj, klipSure, kfAnlikDeger, bosRenk, montajToplamSure, MONTAJ_GECIS_META,
  type MontajProje, type MontajKlip, type KfOzellik, type RenkAyar, type MetinStil, type MetinAnim, type MontajOran, type MetinCikis, type MontajOge,
  type MontajMaske, type MontajKarisim, type SesEfekt,
} from "@/store/useMontaj";
import { gorselKaynak } from "@/lib/montajMotor";
import { FONTLAR } from "./fontlar";
import { kisaSure, zamanKodu, tumKlipler } from "./ortak";
import { Bolum, AltBaslik, Sifirla, Kaydirici, Segment, AnahtarSatir, Renkler } from "./ui";

type Sekme = "klip" | "gorunum" | "renk" | "ses" | "yazi" | "oge";

export function MontajDenetleyici({ proje }: { proje: MontajProje }) {
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const k = tumKlipler(proje).find((x) => x.id === seciliId) ?? null;
  return k ? <KlipDenetle key={k.id} proje={proje} k={k} /> : <ProjeAyar proje={proje} />;
}

/* ═══════════ Proje ayarları (seçim yokken) ═══════════ */

const FORMATLAR: [MontajOran, string, string, number, number][] = [
  ["16:9", "Yatay", "YouTube", 30, 17], ["9:16", "Dikey", "Reels · TikTok", 15, 27], ["1:1", "Kare", "Gönderi", 22, 22], ["4:5", "Portre", "Instagram", 19, 24],
];
const ARKA: string[] = ["#000000", "#111827", "#ffffff", "#0e7490", "#7c3aed", "#be185d"];

function ProjeAyar({ proje }: { proje: MontajProje }) {
  const g = (patch: Partial<MontajProje>) => useMontaj.getState().projeGuncelle(proje.id, patch);
  const klipSay = proje.katmanlar.reduce((a, k) => a + k.klipler.length, 0);
  const kapak = tumKlipler(proje).map((k) => (k.tur === "video" || k.tur === "gorsel" ? gorselKaynak(k.gorselUrl) : undefined)).find(Boolean) ?? "/gercek/video-hareket/drone-orbit-poster.webp";
  return (
    <div>
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2.5 px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={kapak} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover ring-1 ring-inset ring-white/10" />
          <span className="min-w-0"><span className="block text-[15px] font-semibold text-metin">Proje ayarları</span><span className="block truncate text-[12px] tabular-nums text-metin-3">{kisaSure(montajToplamSure(proje))} · {klipSay} klip · {proje.katmanlar.length} katman</span></span>
        </div>
      </div>
      <Bolum baslik="Format">
        <div className="grid grid-cols-4 gap-1.5">
          {FORMATLAR.map(([o, ad, alt, w, h]) => {
            const sec = proje.enBoy === o;
            return (
              <button key={o} onClick={() => g({ enBoy: o })} aria-pressed={sec} title={alt}
                className={cn("relative flex flex-col items-center gap-1.5 rounded-[12px] px-1 pb-2 pt-3 transition-[background-color] active:scale-[0.97]", sec ? "bg-white/[0.085]" : "hover:bg-white/[0.08]")}>
                {sec && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] ring-2 ring-inset ring-white" />}
                <span className="flex h-8 items-center"><span className={cn("relative overflow-hidden rounded-[4px] ring-1", sec ? "ring-white" : "ring-white/20")} style={{ width: w * 1.15, height: h * 1.15 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover", !sec && "opacity-60")} />
                </span></span>
                <span className={cn("text-[12px] font-semibold", sec ? "text-metin" : "text-metin-2")}>{ad}</span>
                <span className="-mt-1 text-[11px] tabular-nums text-metin-3">{o}</span>
              </button>
            );
          })}
        </div>
      </Bolum>
      <Bolum baslik="Çözünürlük">
        <Segment etiket="Çözünürlük" deger={proje.cozunurluk} onDegis={(v) => g({ cozunurluk: v })} secenekler={[["720p", "720p"], ["1080p", "1080p"], ["4K", "4K"]]} />
      </Bolum>
      <Bolum baslik="Kare hızı">
        <Segment etiket="Kare hızı" deger={proje.fps} onDegis={(v) => g({ fps: v })} secenekler={[[24, "24 fps"], [30, "30 fps"], [60, "60 fps"]]} />
      </Bolum>
      <Bolum baslik="Arka plan">
        <Renkler deger={proje.arkaRenk ?? "#000000"} onDegis={(c) => g({ arkaRenk: c })} renkler={ARKA} etiket="Arka plan" />
      </Bolum>
    </div>
  );
}

/* ═══════════ Klip denetleyici ═══════════ */

function KlipDenetle({ proje, k }: { proje: MontajProje; k: MontajKlip }) {
  const sekmeler: [Sekme, string][] = k.tur === "metin" && k.oge
    ? [["oge", "Öğe"], ["klip", "Zaman"], ["gorunum", "Görünüm"]]
    : k.tur === "metin"
    ? [["yazi", "Yazı"], ["klip", "Zaman"], ["gorunum", "Görünüm"]]
    : k.tur === "ses" ? [["klip", "Klip"], ["ses", "Ses"]]
      : [["klip", "Klip"], ["gorunum", "Görünüm"], ["renk", "Renk"], ...(k.tur === "video" ? [["ses", "Ses"] as [Sekme, string]] : [])];
  const [sekme, setSekme] = useState<Sekme>(sekmeler[0][0]);
  const g = (patch: Partial<MontajKlip>) => useMontaj.getState().klipGuncelle(proje.id, k.id, patch);
  const I = k.tur === "video" ? Film : k.tur === "gorsel" ? ImageIcon : k.tur === "ses" ? Music2 : TypeIcon;
  const kapak = k.tur === "video" || k.tur === "gorsel" ? gorselKaynak(k.gorselUrl) : undefined;
  const TUR_AD = { video: "Video", gorsel: "Görsel", ses: "Ses", metin: k.oge ? "Öğe" : "Yazı" } as const;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-white/[0.06] px-3 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.075] text-metin-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {kapak ? <img src={kapak} alt="" className="h-full w-full object-cover" /> : <I className="h-[18px] w-[18px]" />}
          </span>
          <span className="min-w-0 flex-1">
            <input value={k.ad} onChange={(e) => g({ ad: e.target.value.slice(0, 60) })} aria-label="Klip adı" className="block w-full truncate rounded-md bg-transparent text-[14.5px] font-semibold text-metin outline-none focus:bg-white/[0.05]" />
            <span className="block truncate text-[12px] tabular-nums text-metin-3">{TUR_AD[k.tur]} · {zamanKodu(k.baslangic, proje.fps)} · {kisaSure(klipSure(k))}{(k.tur === "video" || k.tur === "ses") && Math.abs(k.sure - klipSure(k)) > 0.05 ? ` · kaynak ${kisaSure(k.sure)}` : ""}</span>
          </span>
          <span className="flex">
            {([[Copy, "Çoğalt", () => useMontaj.getState().klipCogalt(proje.id, k.id)], [Trash2, "Sil", () => useMontaj.getState().klipSil(proje.id, k.id)]] as const).map(([Ik, a, fn]) => (
              <button key={a} onClick={() => { fn(); if (a === "Sil") toast("Klip silindi", { action: { label: "Geri al", onClick: () => useMontaj.getState().geriAl(proje.id) } }); else toast.success("Klip çoğaltıldı"); }} aria-label={a} title={a} className={cn("flex h-8 w-8 items-center justify-center rounded-full text-metin-3 transition hover:bg-white/[0.07] active:scale-90", a === "Sil" ? "hover:text-rose-300" : "hover:text-metin")}><Ik className="h-4 w-4" /></button>
            ))}
          </span>
        </div>
        <LayoutGroup id={`denetle-${k.id}`}>
        <div role="tablist" className="mt-3 grid gap-0.5 rounded-full bg-white/[0.085] p-1 ring-1 ring-inset ring-white/[0.06]" style={{ gridTemplateColumns: `repeat(${sekmeler.length}, minmax(0,1fr))` }}>
          {sekmeler.map(([id, ad]) => (
            <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)}
              className={cn("relative h-8 rounded-full text-[12.5px] font-medium transition-colors active:scale-[0.97]", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {sekme === id && <motion.span layoutId="denetle-sekme" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{ad}</span>
            </button>
          ))}
        </div>
        </LayoutGroup>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        {sekme === "klip" && <KlipSekme proje={proje} k={k} g={g} />}
        {sekme === "gorunum" && <GorunumSekme proje={proje} k={k} g={g} />}
        {sekme === "renk" && <RenkSekme proje={proje} k={k} />}
        {sekme === "ses" && <SesSekme k={k} g={g} />}
        {sekme === "yazi" && <YaziSekme k={k} g={g} />}
        {sekme === "oge" && <OgeSekme k={k} g={g} />}
      </div>
    </div>
  );
}

type G = (patch: Partial<MontajKlip>) => void;

function KlipSekme({ proje, k, g }: { proje: MontajProje; k: MontajKlip; g: G }) {
  const playhead = useMontaj((s) => s.playhead);
  const icinde = playhead > k.baslangic + 0.1 && playhead < k.baslangic + klipSure(k) - 0.1;
  const zamanli = k.tur === "video" || k.tur === "ses";
  return (
    <>
      <Bolum>
        <button onClick={() => { useMontaj.getState().klipBol(proje.id, k.id, playhead); toast.success("Klip bölündü", { description: "Ctrl+Z ile geri alabilirsin." }); }} disabled={!icinde}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white/[0.08] text-[13px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-[0.98] disabled:opacity-40">
          <Scissors className="h-4 w-4" />{icinde ? "Oynatma çizgisinde böl" : "Oynatma çizgisi klibin dışında"}{icinde && <kbd className="rounded-md bg-white/[0.12] px-1.5 font-sans text-[11px] font-medium text-white/80">S</kbd>}
        </button>
      </Bolum>
      {!zamanli && (
        <Bolum baslik="Süre">
          <Kaydirici ad="Ekranda kalma" deger={Math.round(klipSure(k) * 10) / 10} min={0.5} max={20} adim={0.1} onDegis={(v) => g({ sure: v * k.hiz + k.basKirp, sonKirp: 0 })} yaz={(n) => `${n.toFixed(1)} sn`} />
        </Bolum>
      )}
      {zamanli && (
        <Bolum baslik="Hız" sag={k.hiz !== 1 || k.hizSonu !== undefined ? <Sifirla fn={() => g({ hiz: 1, hizSonu: undefined })} /> : undefined}>
          <Segment etiket="Hız" deger={[0.5, 1, 1.5, 2].includes(k.hiz) ? k.hiz : -1} onDegis={(v) => g({ hiz: v })} secenekler={[[0.5, "0,5×"], [1, "1×"], [1.5, "1,5×"], [2, "2×"]]} />
          <Kaydirici ad="Hassas hız" deger={k.hiz} min={0.25} max={4} adim={0.05} varsayilan={1} onDegis={(v) => g({ hiz: Math.round(v * 100) / 100 })} yaz={(n) => `${n.toFixed(2)}×`} />
          <AnahtarSatir ad="Hız rampası" alt="Klip boyunca hız, başlangıç değerinden hedef değere doğru değişir." acik={k.hizSonu !== undefined} onDegis={() => g({ hizSonu: k.hizSonu === undefined ? Math.min(4, k.hiz * 2) : undefined })} />
          {k.hizSonu !== undefined && <Kaydirici ad="Bitişteki hız" deger={k.hizSonu} min={0.25} max={4} adim={0.05} onDegis={(v) => g({ hizSonu: Math.round(v * 100) / 100 })} yaz={(n) => `${n.toFixed(2)}×`} />}
        </Bolum>
      )}
      {(k.tur === "video" || k.tur === "gorsel") && (
        <Bolum baslik="Yerleşim">
          <Segment etiket="Yerleşim" deger={k.sigdir ?? "doldur"} onDegis={(v) => g({ sigdir: v })} secenekler={[["doldur", "Doldur", Maximize], ["sigdir", "Sığdır", Minimize], ["bulanik", "Bulanık", Droplets]]} />
          <div className="grid grid-cols-2 gap-1.5">
            {([["aynaX", "Yatay aynala", FlipHorizontal2], ["aynaY", "Dikey aynala", FlipVertical2]] as const).map(([oz, ad, Ik]) => (
              <button key={oz} onClick={() => g({ [oz]: !k[oz] })} aria-pressed={!!k[oz]} className={cn("flex h-9 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium transition active:scale-[0.97]", k[oz] ? "bg-white text-black" : "bg-white/[0.075] text-metin-2 hover:bg-white/[0.1] hover:text-metin")}><Ik className="h-3.5 w-3.5" />{ad}</button>
            ))}
          </div>
          <Kaydirici ad="Sona doğru karar" deger={k.cikisSure ?? 0} min={0} max={Math.min(3, klipSure(k) / 2)} adim={0.1} varsayilan={0} onDegis={(v) => g({ cikisSure: v || undefined })} yaz={(n) => (n ? `${n.toFixed(1)} sn` : "Yok")} aciklama="Klibin sonunda görüntü arka plan rengine yumuşakça kararır." />
        </Bolum>
      )}
      {k.tur !== "ses" && k.tur !== "metin" && (
        <Bolum baslik="Giriş geçişi" sag={k.gecis !== "yok" ? <button onClick={() => g({ gecis: "yok" })} className="flex h-7 items-center rounded-full bg-white/[0.085] px-2.5 text-[12px] font-medium text-white/85 transition hover:bg-white/[0.14] hover:text-white active:scale-95">Kaldır</button> : undefined}>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(MONTAJ_GECIS_META) as (keyof typeof MONTAJ_GECIS_META)[]).filter((x) => x !== "yok").map((x) => (
              <button key={x} onClick={() => g({ gecis: x })} aria-pressed={k.gecis === x}
                className={cn("h-9 truncate rounded-full px-2 text-[12.5px] font-medium transition active:scale-95", k.gecis === x ? "bg-white text-[#0b0c0e]" : "bg-white/[0.085] text-metin-2 hover:bg-white/[0.12] hover:text-metin")}>{MONTAJ_GECIS_META[x].ad}</button>
            ))}
          </div>
          {k.gecis !== "yok" && k.gecis !== "kesme" && <Kaydirici ad="Uzunluk" deger={k.gecisSure} min={0.2} max={2} adim={0.1} onDegis={(v) => g({ gecisSure: v })} yaz={(n) => `${n.toFixed(1)} sn`} />}
        </Bolum>
      )}
    </>
  );
}

const KF: { oz: KfOzellik; ad: string; min: number; max: number; adim: number; yaz: (n: number) => string }[] = [
  { oz: "olcek", ad: "Ölçek", min: 20, max: 300, adim: 1, yaz: (n) => `yüzde ${Math.round(n)}` },
  { oz: "x", ad: "Yatay konum", min: -100, max: 100, adim: 1, yaz: (n) => `${Math.round(n)}` },
  { oz: "y", ad: "Dikey konum", min: -100, max: 100, adim: 1, yaz: (n) => `${Math.round(n)}` },
  { oz: "donme", ad: "Döndürme", min: -180, max: 180, adim: 1, yaz: (n) => `${Math.round(n)}°` },
  { oz: "opaklik", ad: "Opaklık", min: 0, max: 100, adim: 1, yaz: (n) => `yüzde ${Math.round(n)}` },
];
const TABAN: Record<KfOzellik, keyof MontajKlip> = { olcek: "olcek", x: "konumX", y: "konumY", donme: "donme", opaklik: "opaklik" };
const VARSAYILAN: Record<KfOzellik, number> = { olcek: 100, x: 0, y: 0, donme: 0, opaklik: 100 };

function GorunumSekme({ proje, k, g }: { proje: MontajProje; k: MontajKlip; g: G }) {
  const playhead = useMontaj((s) => s.playhead);
  const yerel = Math.max(0, Math.min(klipSure(k), playhead - k.baslangic));
  const icinde = playhead >= k.baslangic && playhead <= k.baslangic + klipSure(k);
  const ayarla = (oz: KfOzellik, v: number) => {
    const kfs = k.keyframeler?.[oz];
    if (kfs?.length && icinde) {
      const digerleri = kfs.filter((x) => Math.abs(x.t - yerel) > 0.02);
      g({ keyframeler: { ...k.keyframeler, [oz]: [...digerleri, { t: yerel, deger: v }].sort((a, b) => a.t - b.t) } });
    } else g({ [TABAN[oz]]: v } as Partial<MontajKlip>);
  };
  const liste = k.oge?.tip === "ilerleme" || k.oge?.sekil === "cerceve" ? KF.filter((x) => x.oz === "opaklik") : KF;
  return (
    <>
      <Bolum baslik="Dönüşüm" sag={<Sifirla etiket="Tümünü sıfırla" fn={() => g({ olcek: 100, konumX: 0, konumY: 0, donme: 0, opaklik: 100, keyframeler: {} })} />}>
        {liste.map((x) => {
          const kfs = k.keyframeler?.[x.oz] ?? [];
          const buradaKf = kfs.some((f) => Math.abs(f.t - yerel) <= 0.02);
          const deger = kfAnlikDeger(k, x.oz, yerel);
          return (
            <div key={x.oz}>
              <Kaydirici ad={x.ad} deger={deger} min={x.min} max={x.max} adim={x.adim} varsayilan={VARSAYILAN[x.oz]} onDegis={(v) => ayarla(x.oz, v)} yaz={x.yaz}
                sag={<>
                  {Math.abs(deger - VARSAYILAN[x.oz]) > 0.5 && (
                    <button onClick={() => { if (kfs.length) useMontaj.getState().keyframeTemizle(proje.id, k.id, x.oz); g({ [TABAN[x.oz]]: VARSAYILAN[x.oz] } as Partial<MontajKlip>); }}
                      title="Varsayılana döndür" aria-label={`${x.ad} sıfırla`} className="flex h-6 w-6 items-center justify-center rounded-md text-metin-3 hover:bg-white/[0.08] hover:text-metin"><RotateCcw className="h-3 w-3" /></button>
                  )}
                  <button onClick={() => { if (!icinde) return void toast.error("Oynatma çizgisi klibin dışında", { description: "Anahtar kare eklemek için oynatma çizgisini klibin üstüne getir." }); if (buradaKf) useMontaj.getState().keyframeSil(proje.id, k.id, x.oz, yerel); else useMontaj.getState().keyframeEkle(proje.id, k.id, x.oz, yerel); }}
                    title={buradaKf ? "Bu anahtar kareyi sil" : "Bu anda anahtar kare ekle"} aria-label={`${x.ad} anahtar kare`}
                    className={cn("flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white/[0.08]", buradaKf ? "text-[#55d6fd]" : kfs.length ? "text-[#55d6fd]/60" : "text-metin-3")}>
                    <Diamond className={cn("h-3.5 w-3.5", buradaKf && "fill-current")} />
                  </button>
                </>} />
              {kfs.length > 0 && <p className="mt-1 text-[11.5px] text-metin-3">{kfs.length} anahtar kare · <button onClick={() => useMontaj.getState().keyframeTemizle(proje.id, k.id, x.oz)} className="text-metin-2 hover:text-rose-300">temizle</button></p>}
            </div>
          );
        })}
      </Bolum>
      {(k.tur === "video" || k.tur === "gorsel") && <GoruntuPro k={k} g={g} />}
    </>
  );
}

const MASKELER: [MontajMaske, string][] = [["yok", "Yok"], ["daire", "Daire"], ["yuvarlak", "Yuvarlak"], ["elmas", "Elmas"], ["kalp", "Kalp"], ["yildiz", "Yıldız"], ["serit", "Şerit"]];
const MASKE_SVG: Record<MontajMaske, string> = {
  yok: "M3 3h18v18H3z", daire: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", yuvarlak: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z",
  elmas: "M12 2l10 10l-10 10L2 12z", kalp: "M12 21C5 15 2 11.5 2 8a5 5 0 0 1 10-1a5 5 0 0 1 10 1c0 3.5-3 7-10 13z",
  yildiz: "M12 2l2.9 6.6l7.1.6l-5.4 4.7l1.6 7L12 17.3L5.8 20.9l1.6-7L2 9.2l7.1-.6z", serit: "M2 7h20v10H2z",
};
const KARISIMLAR: [MontajKarisim, string, string][] = [
  ["normal", "Normal", "Üstte"], ["screen", "Ekran", "Siyahı siler"], ["multiply", "Çarp", "Beyazı siler"], ["overlay", "Kaplama", "Kontrast"],
  ["soft-light", "Yumuşak", "Hafif ışık"], ["lighten", "Aydınlat", "Açık olan"], ["darken", "Koyulaştır", "Koyu olan"], ["difference", "Fark", "Ters renk"],
];
const KIRP_ORAN: [string, number | null][] = [["Serbest", null], ["16:9", 16 / 9], ["9:16", 9 / 16], ["1:1", 1], ["4:5", 4 / 5]];

/** Görüntü klibi pro ayarları: kırpma, maske, karışım, resim-içinde-resim. */
function GoruntuPro({ k, g }: { k: MontajKlip; g: G }) {
  const kp = k.kirp ?? { l: 0, t: 0, r: 0, b: 0 };
  const kirpVar = kp.l + kp.t + kp.r + kp.b > 0;
  // Oran ön ayarı: kaynağın gerçek en-boyunu okuyup ortadan kırpar
  const oranKirp = (oran: number | null) => {
    if (oran === null) return g({ kirp: undefined });
    const el = document.createElement("video");
    const uygula = (sw: number, sh: number) => {
      const kaynak = sw / sh;
      if (kaynak > oran) { const kes = (1 - oran / kaynak) * 50; g({ kirp: { l: kes, r: kes, t: 0, b: 0 } }); }
      else { const kes = (1 - kaynak / oran) * 50; g({ kirp: { t: kes, b: kes, l: 0, r: 0 } }); }
    };
    if (k.tur === "video" && (k.videoUrl ?? k.sesUrl)) { el.src = (k.videoUrl ?? k.sesUrl)!; el.onloadedmetadata = () => uygula(el.videoWidth, el.videoHeight); }
    else if (k.gorselUrl) { const im = new Image(); im.onload = () => uygula(im.naturalWidth, im.naturalHeight); im.src = k.gorselUrl; }
  };
  const pip = (x: number, y: number) => {
    // Köşe konumu: %32 ölçekte, kenardan %4 boşluk
    const o = 32, px = (100 - o) / 2 - 4, py = (100 - o) / 2 - 4;
    g({ olcek: o, konumX: x * px, konumY: y * py, maske: k.maske && k.maske !== "yok" ? k.maske : "yuvarlak" });
  };
  const kucukBtn = "h-8 rounded-full bg-white/[0.075] text-[12px] font-medium text-metin-2 transition hover:bg-white/[0.11] hover:text-metin active:scale-95";
  return (
    <>
      <Bolum baslik="Kırp" sag={kirpVar ? <Sifirla fn={() => g({ kirp: undefined })} /> : undefined}>
        <div className="grid grid-cols-5 gap-1">
          {KIRP_ORAN.map(([ad, o]) => <button key={ad} onClick={() => oranKirp(o)} className={kucukBtn}>{ad}</button>)}
        </div>
        {([["l", "Sol"], ["r", "Sağ"], ["t", "Üst"], ["b", "Alt"]] as const).map(([oz, ad]) => (
          <Kaydirici key={oz} ad={ad} deger={kp[oz]} min={0} max={45} adim={0.5} varsayilan={0} onDegis={(v) => g({ kirp: { ...kp, [oz]: v } })} yaz={(n) => `yüzde ${n.toFixed(n % 1 ? 1 : 0)}`} />
        ))}
      </Bolum>
      <Bolum baslik="Maske">
        <div className="grid grid-cols-7 gap-1">
          {MASKELER.map(([id, ad]) => {
            const sec = (k.maske ?? "yok") === id;
            return (
              <button key={id} onClick={() => g({ maske: id === "yok" ? undefined : id })} title={ad} aria-label={`Maske: ${ad}`} aria-pressed={sec}
                className={cn("flex aspect-square items-center justify-center rounded-[10px] transition active:scale-95", sec ? "bg-white text-black" : "bg-white/[0.065] text-metin-2 hover:bg-white/[0.09] hover:text-metin")}>
                {id === "yok" ? <Ban className="h-4 w-4" /> : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d={MASKE_SVG[id]} /></svg>}
              </button>
            );
          })}
        </div>
      </Bolum>
      <Bolum baslik="Resim içinde resim">
        <div className="grid grid-cols-5 gap-1.5">
          {([["Sol üst", -1, -1], ["Sağ üst", 1, -1], ["Tam ekran", 0, 0], ["Sol alt", -1, 1], ["Sağ alt", 1, 1]] as const).map(([ad, x, y]) => (
            <button key={ad} onClick={() => (x === 0 ? g({ olcek: 100, konumX: 0, konumY: 0 }) : pip(x, y))} title={ad} aria-label={`Konum: ${ad}`}
              className="relative aspect-[4/3] rounded-[8px] bg-white/[0.065] ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.1] active:scale-95">
              <span className={cn("absolute h-[38%] w-[38%] rounded-[3px] bg-metin-2", x === 0 ? "inset-0 m-auto h-[76%] w-[80%]" : "", x < 0 && "left-[10%]", x > 0 && "right-[10%]", y < 0 && "top-[12%]", y > 0 && "bottom-[12%]")} />
            </button>
          ))}
        </div>
      </Bolum>
      <Bolum baslik="Karışım modu">
        <div className="grid grid-cols-4 gap-1">
          {KARISIMLAR.map(([id, ad, alt]) => {
            const sec = (k.karisim ?? "normal") === id;
            return (
              <button key={id} onClick={() => g({ karisim: id === "normal" ? undefined : id })} aria-pressed={sec} title={alt}
                className={cn("h-8 rounded-full px-1 text-center transition active:scale-95", sec ? "bg-white" : "bg-white/[0.065] hover:bg-white/[0.09]")}>
                <span className={cn("block truncate text-[12px] font-medium", sec ? "text-black" : "text-metin-2")}>{ad}</span>
              </button>
            );
          })}
        </div>
      </Bolum>
    </>
  );
}

const RENK: { oz: keyof RenkAyar; ad: string }[] = [
  { oz: "pozlama", ad: "Pozlama" }, { oz: "kontrast", ad: "Kontrast" }, { oz: "doygunluk", ad: "Doygunluk" },
  { oz: "sicaklik", ad: "Sıcaklık" }, { oz: "tonlama", ad: "Ton" }, { oz: "parlaklik", ad: "Parlaklık" },
];

function RenkSekme({ proje, k }: { proje: MontajProje; k: MontajKlip }) {
  const r = k.renk ?? bosRenk();
  const degisti = RENK.some((x) => r[x.oz] !== 0);
  const g = (patch: Partial<MontajKlip>) => useMontaj.getState().klipGuncelle(proje.id, k.id, patch);
  const kr = k.krom;
  return (
    <>
      <Bolum baslik="Renk düzeltme" sag={degisti ? <Sifirla fn={() => useMontaj.getState().renkSifirla(proje.id, k.id)} /> : undefined}>
        {RENK.map((x) => (
          <Kaydirici key={x.oz} ad={x.ad} deger={r[x.oz]} min={-100} max={100} adim={1} varsayilan={0} onDegis={(v) => useMontaj.getState().renkAyarla(proje.id, k.id, { [x.oz]: v })} yaz={(n) => (n > 0 ? `+${n}` : String(n))} />
        ))}
      </Bolum>
      <Bolum baslik="Renk anahtarı" sag={kr ? <Sifirla fn={() => g({ krom: undefined })} /> : undefined}>
        <AnahtarSatir ad="Yeşil / mavi perdeyi sil" alt="Seçilen rengi saydam yapar; alttaki katman görünür." acik={!!kr} onDegis={() => g({ krom: kr ? undefined : { renk: "#00b140", esik: 28, yumusak: 22 } })} />
        {kr && (
          <>
            <AltBaslik>Anahtar rengi</AltBaslik>
            <Renkler deger={kr.renk} renkler={["#00b140", "#00ff00", "#0047bb", "#0000ff", "#ffffff", "#000000"]} onDegis={(c) => g({ krom: { ...kr, renk: c } })} etiket="Anahtar rengi" />
            <Kaydirici ad="Eşik" deger={kr.esik} min={0} max={100} adim={1} onDegis={(v) => g({ krom: { ...kr, esik: v } })} yaz={(n) => `${Math.round(n)}`} />
            <Kaydirici ad="Kenar yumuşaklığı" deger={kr.yumusak} min={0} max={100} adim={1} onDegis={(v) => g({ krom: { ...kr, yumusak: v } })} yaz={(n) => `${Math.round(n)}`} />
          </>
        )}
      </Bolum>
    </>
  );
}

const SES_EFEKTLERI: [SesEfekt, string][] = [["yok", "Doğal"], ["radyo", "Radyo"], ["telefon", "Telefon"], ["yanki", "Yankı"], ["salon", "Salon"], ["bas", "Bas"]];

function SesSekme({ k, g }: { k: MontajKlip; g: G }) {
  return (
    <>
      <Bolum baslik="Ses">
        <Kaydirici ad="Ses düzeyi" deger={k.sesDuzey} min={0} max={100} adim={1} varsayilan={100} onDegis={(v) => g({ sesDuzey: v })} yaz={(n) => `yüzde ${Math.round(n)}`} />
        <Kaydirici ad="Yavaşça gir" deger={k.sesGiris ?? 0} min={0} max={Math.min(5, klipSure(k) / 2)} adim={0.1} varsayilan={0} onDegis={(v) => g({ sesGiris: v })} yaz={(n) => (n ? `${n.toFixed(1)} sn` : "Yok")} />
        <Kaydirici ad="Yavaşça çık" deger={k.sesCikis ?? 0} min={0} max={Math.min(5, klipSure(k) / 2)} adim={0.1} varsayilan={0} onDegis={(v) => g({ sesCikis: v })} yaz={(n) => (n ? `${n.toFixed(1)} sn` : "Yok")} />
      </Bolum>
      <Bolum baslik="Ses işleme">
        <AnahtarSatir ad="Sesi iyileştir" alt="Uğultu ve rüzgârı keser, konuşmayı netleştirir, seviyeyi dengeler. Dışa aktarmaya da yansır." acik={!!k.sesIyilestir} onDegis={() => g({ sesIyilestir: !k.sesIyilestir })} />
        <AltBaslik>Ses efekti</AltBaslik>
        <div className="grid grid-cols-3 gap-1.5">
          {SES_EFEKTLERI.map(([id, ad]) => {
            const sec = (k.sesEfekt ?? "yok") === id;
            return (
              <button key={id} onClick={() => g({ sesEfekt: id === "yok" ? undefined : id })} aria-pressed={sec}
                className={cn("h-9 rounded-full text-[12.5px] font-medium transition active:scale-95", sec ? "bg-white text-black" : "bg-white/[0.075] text-metin-2 hover:bg-white/[0.1] hover:text-metin")}>{ad}</button>
            );
          })}
        </div>
      </Bolum>
    </>
  );
}

const STILLER: [MetinStil, string][] = [
  ["baslik", "Başlık"], ["altbaslik", "Alt başlık"], ["altyazi", "Altyazı"], ["etiket", "Etiket"], ["alinti", "Alıntı"],
  ["sinematik", "Sinematik"], ["karaoke", "Karaoke"], ["tiktok", "TikTok"], ["neon", "Neon"],
];
const CIKISLAR: [MetinCikis, string][] = [["yok", "Yok"], ["fade", "Kaybol"], ["asagi", "Düş"], ["kucul", "Küçül"]];
const ANIMLER: [MetinAnim, string][] = [["yok", "Yok"], ["fade", "Belir"], ["yukari", "Yüksel"], ["pop", "Patla"], ["daktilo", "Daktilo"]];

function OgeSekme({ k, g }: { k: MontajKlip; g: G }) {
  const o = k.oge!;
  const og = (p: Partial<MontajOge>) => g({ oge: { ...o, ...p } });
  const girdi = "h-10 w-full rounded-[12px] bg-white/[0.065] px-3 text-[14px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] focus:ring-white/25";
  return (
    <>
      {(o.tip === "altbant" || o.sekil === "kose") && (
        <Bolum baslik="Metin">
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-metin-2">{o.tip === "altbant" ? "Ad" : "Etiket"}</span>
            <input value={o.baslik ?? ""} onChange={(e) => og({ baslik: e.target.value.slice(0, 40) })} className={girdi} /></label>
          {o.tip === "altbant" && (
            <label className="block"><span className="mb-1.5 block text-[12.5px] text-metin-2">Unvan</span>
              <input value={o.alt ?? ""} onChange={(e) => og({ alt: e.target.value.slice(0, 60) })} className={girdi} /></label>
          )}
        </Bolum>
      )}
      {o.tip !== "logo" && (
        <Bolum baslik="Renk">
          <AltBaslik>{o.tip === "altbant" ? "Vurgu" : "Dolgu"}</AltBaslik>
          <Renkler deger={o.renk} onDegis={(c) => og({ renk: c })} renkler={[...TEMEL, "#0b0d10"]} />
          {(o.tip === "altbant" || o.sekil === "kose") && <><AltBaslik>{o.tip === "altbant" ? "Kutu" : "Yazı"}</AltBaslik><Renkler deger={o.renk2 ?? "#0b0d10"} onDegis={(c) => og({ renk2: c })} renkler={[...TEMEL, "#0b0d10"]} /></>}
        </Bolum>
      )}
      {o.sekil === "dikdortgen" && (
        <Bolum baslik="Köşeler">
          <Kaydirici ad="Yuvarlaklık" deger={o.koseler ?? 12} min={0} max={50} adim={1} onDegis={(v) => og({ koseler: v })} yaz={(n) => `yüzde ${Math.round(n)}`} />
        </Bolum>
      )}
      {o.tip === "ilerleme" && (
        <Bolum baslik="Konum">
          <Segment etiket="Konum" deger={k.metinKonum === "ust" ? "ust" : "alt"} onDegis={(v) => g({ metinKonum: v })} secenekler={[["ust", "Üstte", ArrowUpToLine], ["alt", "Altta", ArrowDownToLine]]} />
        </Bolum>
      )}
      <p className="mx-3 my-3 flex items-start gap-1.5 rounded-[14px] bg-white/[0.045] px-3 py-2.5 text-[12px] leading-snug text-metin-3 ring-1 ring-inset ring-white/[0.06]"><Shapes className="mt-0.5 h-3.5 w-3.5 shrink-0" />Tuvalde sürükleyerek taşı, köşelerden boyutlandır, üstteki tutamaktan döndür.</p>
    </>
  );
}
const TEMEL = ["#ffffff", "#000000", "#55d6fd", "#facc15", "#f472b6", "#a3e635"];

function YaziSekme({ k, g }: { k: MontajKlip; g: G }) {
  const golge = k.metinGolge ?? ["baslik", "altbaslik", "alinti", "sinematik"].includes(k.metinStil ?? "");
  const kutu = k.metinArka ?? k.metinStil === "altyazi";
  return (
    <>
      <Bolum baslik="Metin">
        <textarea value={k.metin ?? ""} onChange={(e) => g({ metin: e.target.value.slice(0, 300), ad: e.target.value.slice(0, 30) || "Yazı" })} rows={3} aria-label="Yazı"
          className="block w-full resize-none rounded-[12px] bg-white/[0.065] p-3 text-[14px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.07] focus:ring-white/25" />
        <Kaydirici ad="Boyut" deger={k.metinBoyut ?? 42} min={16} max={160} adim={1} onDegis={(v) => g({ metinBoyut: v })} yaz={(n) => `${Math.round(n)}`} />
        <AltBaslik>Renk</AltBaslik>
        <Renkler deger={k.metinRenk ?? "#ffffff"} onDegis={(c) => g({ metinRenk: c })} etiket="Yazı rengi" />
      </Bolum>
      <Bolum baslik="Stil">
        <div className="grid grid-cols-3 gap-1.5">
          {STILLER.map(([id, ad]) => {
            const sec = (k.metinStil ?? "altyazi") === id;
            return (
              <button key={id} onClick={() => g({ metinStil: id })} aria-pressed={sec}
                className={cn("flex h-11 items-center justify-center rounded-[12px] px-1 outline outline-2 -outline-offset-2 transition-[outline-color,background-color] active:scale-[0.97]", sec ? "bg-white/[0.08] outline-white" : "bg-white/[0.055] outline-transparent hover:bg-white/[0.07]")}>
                <span className={cn("block truncate text-[13px] text-metin", id === "baslik" && "font-extrabold", id === "altbaslik" && "font-medium", id === "alinti" && "font-serif italic", id === "sinematik" && "font-light tracking-[0.18em]",
                  id === "etiket" && "rounded bg-[#55d6fd] px-1 text-[11.5px] font-bold text-[#06232a]", id === "altyazi" && "rounded bg-black/80 px-1 text-[12px] font-semibold", id === "tiktok" && "font-black [-webkit-text-stroke:0.6px_#000]",
                  id === "neon" && "font-semibold [text-shadow:0_0_6px_#55d6fd]", id === "karaoke" && "font-bold")}>
                  {id === "karaoke" ? <>Kar<span className="text-[#55d6fd]">aoke</span></> : ad}
                </span>
              </button>
            );
          })}
        </div>
        <AnahtarSatir ad="Arka kutu" alt="Okunurluk için yazının arkasına kutu koyar." acik={kutu} onDegis={() => g({ metinArka: !kutu })} />
        {kutu && <Renkler deger={k.metinKutuRenk ?? "#000000"} renkler={["#000000", "#ffffff", "#55d6fd", "#facc15", "#f472b6", "#7c3aed", "#16a34a"]} onDegis={(c) => g({ metinKutuRenk: c })} etiket="Kutu rengi" />}
        {k.metinStil === "karaoke" && (
          <>
            <AltBaslik>Vurgu rengi</AltBaslik>
            <Renkler deger={k.vurguRenk ?? "#55d6fd"} renkler={["#55d6fd", "#facc15", "#a3e635", "#f472b6", "#f97316"]} onDegis={(c) => g({ vurguRenk: c })} etiket="Vurgu rengi" />
            <p className="text-[12px] leading-snug text-metin-3">{k.kelimeler?.length ? "Sözcükler konuşmanın gerçek zamanlamasıyla vurgulanır." : "Sözcükler klip süresine eşit dağıtılarak vurgulanır."}</p>
          </>
        )}
      </Bolum>
      <Bolum baslik="Yazı tipi">
        <div className="grid max-h-[236px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
          {FONTLAR.map((f) => {
            const sec = (k.metinFont ?? "") === f.id;
            return (
              <button key={f.id} onClick={() => g({ metinFont: f.id })} aria-pressed={sec}
                className={cn("flex min-w-0 flex-col items-start rounded-[12px] px-2.5 py-2 text-left outline outline-2 -outline-offset-2 transition-[outline-color,background-color] active:scale-[0.98]", sec ? "bg-white/[0.08] outline-white" : "bg-white/[0.055] outline-transparent hover:bg-white/[0.07]")}>
                <span className="block w-full truncate text-[18px] leading-tight text-metin" style={{ fontFamily: f.aile, fontWeight: f.agirlik ?? 700 }}>Aa Şğİ</span>
                <span className="mt-0.5 block w-full truncate text-[11.5px] text-metin-3">{f.ad}</span>
              </button>
            );
          })}
        </div>
      </Bolum>
      <Bolum baslik="Tipografi" sag={k.metinKontur || k.metinAralik !== undefined || k.metinSatir !== undefined || k.metinGolge !== undefined || k.metinKutuRenk ? <Sifirla fn={() => g({ metinKontur: undefined, metinKonturRenk: undefined, metinAralik: undefined, metinSatir: undefined, metinGolge: undefined, metinKutuRenk: undefined })} /> : undefined}>
        <Kaydirici ad="Kontur" deger={k.metinKontur ?? 0} min={0} max={30} adim={1} varsayilan={0} onDegis={(v) => g({ metinKontur: v || undefined })} yaz={(n) => (n ? `${Math.round(n)}` : "Yok")} />
        {!!k.metinKontur && <Renkler deger={k.metinKonturRenk ?? "#000000"} onDegis={(c) => g({ metinKonturRenk: c })} etiket="Kontur rengi" />}
        <Kaydirici ad="Harf aralığı" deger={k.metinAralik ?? 0} min={-10} max={60} adim={1} varsayilan={0} onDegis={(v) => g({ metinAralik: v })} yaz={(n) => `${Math.round(n)}`} />
        <Kaydirici ad="Satır aralığı" deger={k.metinSatir ?? 1.22} min={0.9} max={2} adim={0.02} onDegis={(v) => g({ metinSatir: v })} yaz={(n) => n.toFixed(2)} />
        <AnahtarSatir ad="Gölge" alt="Yazının altına yumuşak bir gölge düşürür." acik={golge} onDegis={() => g({ metinGolge: !golge })} />
      </Bolum>
      <Bolum baslik="Yerleşim">
        <AltBaslik>Konum</AltBaslik>
        <Segment etiket="Konum" deger={k.metinKonum ?? "alt"} onDegis={(v) => g({ metinKonum: v })} secenekler={[["ust", "Üst", ArrowUpToLine], ["orta", "Orta", AlignVerticalJustifyCenter], ["alt", "Alt", ArrowDownToLine]]} />
        <AltBaslik>Hizalama</AltBaslik>
        <Segment etiket="Hizalama" deger={k.metinHiza ?? "orta"} onDegis={(v) => g({ metinHiza: v })} secenekler={[["sol", "Sol", AlignLeft], ["orta", "Orta", AlignCenter], ["sag", "Sağ", AlignRight]]} />
      </Bolum>
      <Bolum baslik="Animasyon">
        <AltBaslik>Giriş</AltBaslik>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(ANIMLER.length, 5)}, minmax(0,1fr))` }}>
          {ANIMLER.map(([id, ad]) => <button key={id} onClick={() => g({ metinAnim: id })} aria-pressed={(k.metinAnim ?? "fade") === id} className={cn("h-8 truncate rounded-full px-1 text-[12px] font-medium transition active:scale-95", (k.metinAnim ?? "fade") === id ? "bg-white text-[#0b0c0e]" : "bg-white/[0.075] text-metin-2 hover:bg-white/[0.1] hover:text-metin")}>{ad}</button>)}
        </div>
        <AltBaslik>Çıkış</AltBaslik>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(CIKISLAR.length, 5)}, minmax(0,1fr))` }}>
          {CIKISLAR.map(([id, ad]) => <button key={id} onClick={() => g({ metinCikis: id })} aria-pressed={(k.metinCikis ?? "fade") === id} className={cn("h-8 truncate rounded-full px-1 text-[12px] font-medium transition active:scale-95", (k.metinCikis ?? "fade") === id ? "bg-white text-[#0b0c0e]" : "bg-white/[0.075] text-metin-2 hover:bg-white/[0.1] hover:text-metin")}>{ad}</button>)}
        </div>
      </Bolum>
    </>
  );
}
