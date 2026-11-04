"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Plus, Check, Lock, Users, Link2, CircleSlash2, Sparkles, Zap,
  Image as ImageIkon, Video, Music, Heart, SlidersHorizontal, Clock,
  ArrowDownUp, Timer, FolderOpen, LayoutGrid, Gamepad2, MessageSquarePlus,
  ChevronDown, Coins, CalendarClock, Trash2,
} from "lucide-react";
import { SCArtifact, type ArtifactVeri } from "./SCArtifact";
import { cn } from "@/lib/utils";

/* ============================================================
   SOHBET — üst bar popover'ları + sağ panel.
   Tüm metin/ölçüler referanslar/sohbetler'den birebir.
   ============================================================ */

/* ── ⋮ menüsü: Kredi al · Zamanlanmış · Sohbeti sil(kırmızı) ── */
export function SCUstMenu({
  acik, onKapat, onKredi, onZamanli, onSil,
}: { acik: boolean; onKapat: () => void; onKredi: () => void; onZamanli: () => void; onSil: () => void }) {
  return (
    <AnimatePresence>
      <Yuzen acik={!!(acik)} onKapat={onKapat} sag={0} ust={"tam"} bosluk={8}><motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
            className="border border-[var(--sc-kenar)] bg-[var(--sc-kart)] w-[210px] rounded-[14px] p-1.5">
            <button onClick={() => { onKapat(); onKredi(); }}
              className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[14px] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]">
              <Coins className="h-4 w-4 text-[var(--sc-metin-2)]" /> Kredi al
            </button>
            <button onClick={() => { onKapat(); onZamanli(); }}
              className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[14px] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]">
              <CalendarClock className="h-4 w-4 text-[var(--sc-metin-2)]" /> Zamanlanmış
            </button>
            <button onClick={() => { onKapat(); onSil(); }}
              className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[14px] text-[var(--sc-promo)] transition-colors hover:bg-[var(--sc-promo)]/10">
              <Trash2 className="h-4 w-4" /> Sohbeti sil
            </button>
          </motion.div></Yuzen>
    </AnimatePresence>
  );
}

/* ── "Kullanım" popover — %, 4 satır, lime buton ── */
export function SCKullanimPopover({
  acik, onKapat, yuzde = 5, onYukle,
}: { acik: boolean; onKapat: () => void; yuzde?: number; onYukle: () => void }) {
  const SATIRLAR: { ikon: typeof Sparkles; ad: string; deger: string; bedava?: boolean }[] = [
    { ikon: Sparkles, ad: "Metin kredisi", deger: "Ücretsiz", bedava: true },
    { ikon: ImageIkon, ad: "Görsel kredisi", deger: "0" },
    { ikon: Video, ad: "Video kredisi", deger: "0" },
    { ikon: Music, ad: "Ses kredisi", deger: "0" },
  ];
  return (
    <AnimatePresence>
      <Yuzen acik={!!(acik)} onKapat={onKapat} sag={0} ust={"tam"} bosluk={8}><motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
            className="border border-[var(--sc-kenar)] bg-[var(--sc-kart)] w-[320px] rounded-[16px] p-4">
            <p className="flex items-center justify-center gap-2 text-[15px] text-[var(--sc-metin)]">
              <Coins className="h-[17px] w-[17px] text-[var(--sc-metin-2)]" /> Kredilerin
            </p>
            <p className="mt-3 text-center text-[34px] font-semibold leading-none text-[var(--sc-metin)]">%{yuzde}</p>
            <div className="mt-3 flex justify-center gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full"
                  style={{ background: i < Math.round(yuzde / 8.4) ? "var(--sc-aksan)" : "var(--sc-cip-2)" }} />
              ))}
            </div>
            <p className="mt-2.5 text-center text-[13px] text-[var(--sc-metin-3)]">Bu görevde harcanan</p>

            <div className="mt-4 rounded-xl bg-[var(--sc-cip)]">
              {SATIRLAR.map((s, i) => (
                <div key={s.ad} className={cn("flex items-center gap-2.5 px-3.5 py-2.5", i > 0 && "border-t border-[var(--sc-kenar)]")}>
                  <s.ikon className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
                  <span className="flex-1 text-[14px] text-[var(--sc-metin-2)]">{s.ad}</span>
                  <span className={cn("text-[14px]", s.bedava ? "" : "text-[var(--sc-metin-2)]")}
                    style={s.bedava ? { color: "var(--sc-aksan)" } : undefined}>
                    {s.deger}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={onYukle}
              className="mt-4 w-full rounded-full py-2.5 text-[14.5px] font-semibold transition-all hover:brightness-110"
              style={{ background: "var(--sc-aksan)", color: "var(--sc-aksan-metin)" }}>
              Kredi yükle
            </button>
            <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--sc-aksan-zayif)] py-2.5 text-[14px] text-[var(--sc-aksan)]"
              style={{ color: "var(--sc-aksan)" }}>
              <Zap className="h-4 w-4" /> Hızı artır
              <span className="rounded-md bg-black/40 px-1.5 py-[1px] text-[11px] font-semibold">%48 İNDİRİM</span>
            </button>
          </motion.div></Yuzen>
    </AnimatePresence>
  );
}

/* ── "Paylaş" popover — Sadece ben / Herkese açık + beyaz buton ── */
export function SCPaylasPopover({
  acik, onKapat, onPaylas,
}: { acik: boolean; onKapat: () => void; onPaylas: () => void }) {
  const [kip, setKip] = useState<"ozel" | "acik">("ozel");
  const SECENEKLER = [
    { id: "ozel" as const, ikon: Lock, ad: "Sadece ben", ozet: "Sohbeti kendine özel tut" },
    { id: "acik" as const, ikon: Users, ad: "Herkese açık", ozet: "Bağlantısı olan herkes görebilir" },
  ];
  return (
    <AnimatePresence>
      <Yuzen acik={!!(acik)} onKapat={onKapat} sag={0} ust={"tam"} bosluk={8}><motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
            className="border border-[var(--sc-kenar)] bg-[var(--sc-kart)] w-[330px] rounded-[16px] p-2">
            {SECENEKLER.map((s) => (
              <button key={s.id} onClick={() => setKip(s.id)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                  kip === s.id ? "bg-[var(--sc-cip)]" : "hover:bg-[var(--sc-cip)]")}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sc-cip)]">
                  <s.ikon className="h-[17px] w-[17px] text-[var(--sc-metin-2)]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] text-[var(--sc-metin)]">{s.ad}</span>
                  <span className="block text-[13px] text-[var(--sc-metin-3)]">{s.ozet}</span>
                </span>
                {kip === s.id && <Check className="h-[17px] w-[17px] shrink-0 text-[var(--sc-metin)]" />}
              </button>
            ))}
            <button onClick={() => { onPaylas(); onKapat(); }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 text-[14.5px] font-semibold text-black transition-all hover:brightness-95">
              <Link2 className="h-[16px] w-[16px]" /> Şimdi paylaş
            </button>
          </motion.div></Yuzen>
    </AnimatePresence>
  );
}

/* ── Onay kartı — lime kenarlıklı, çipler + Onayla ── */
export function SCOnayKarti({
  baslik, istem, cipler, kredi, onOnayla, onDurdur, onHepsi,
}: {
  baslik: string; istem: string; cipler: string[]; kredi: number;
  onOnayla: () => void; onDurdur: () => void; onHepsi: () => void;
}) {
  return (
    <div className="rounded-[16px] border bg-[var(--sc-kart)] p-4"
      style={{ borderColor: "rgba(85, 214, 253,0.35)" }}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-[17px] w-[17px]" style={{ color: "var(--sc-aksan)" }} />
        <span className="text-[15px] font-medium text-[var(--sc-metin)]">{baslik}</span>
      </div>

      <p className="mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-[var(--sc-metin-2)]">{istem}</p>

      <div className="mt-3.5 flex flex-wrap gap-2">
        {cipler.map((c) => (
          <span key={c} className="rounded-[10px] bg-[var(--sc-cip)] px-3.5 py-2 text-[13.5px] text-[var(--sc-metin-2)]">{c}</span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--sc-kenar)] pt-3.5">
        <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--sc-metin-3)]">Başka bir şey yaz…</span>
        <button onClick={onHepsi}
          className="flex shrink-0 items-center gap-1.5 text-[14px] text-[var(--sc-metin-2)] transition-colors hover:text-[var(--sc-metin)]">
          <CircleSlash2 className="h-4 w-4" /> Hep izin ver
        </button>
        <button onClick={onDurdur}
          className="flex shrink-0 items-center gap-1.5 text-[14px] text-[var(--sc-metin-2)] transition-colors hover:text-[var(--sc-metin)]">
          Durdur
          <span className="rounded bg-[var(--sc-cip-2)] px-1.5 py-[1px] text-[11px] text-[var(--sc-metin-3)]">ESC</span>
        </button>
        <button onClick={onOnayla}
          className="flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--sc-aksan)", color: "var(--sc-aksan-metin)" }}>
          Onayla <KrediYildiz className="h-[14px] w-[14px]" /> {kredi}
          <span className="rounded bg-black/20 px-1.5 text-[11px]">↵</span>
        </button>
      </div>
    </div>
  );
}

/* ── SAĞ PANEL — 4 iç sekme + Süzgeç menüsü ── */
/* "artifact" = Claude'un canlı çıktı görüntüleyicisi. Varlık sekmeleri
   (yüklemeler/görsel/video/beğeni) korunur; artifact ilk sekme olarak eklenir
   (kullanıcı kararı: Artifact paneli olsun, varlık sekmeleri içine taşınsın). */
export type AssetSekme = "artifact" | "yuklemeler" | "gorsel" | "video" | "begeni";

export function SCSagPanel({
  acik, sekme, onSekme, ogeler, onKapat, artifact, onArtifactTamEkran, onArtifactIndir,
}: {
  acik: boolean;
  sekme: AssetSekme;
  onSekme: (s: AssetSekme) => void;
  ogeler: { id: string; ad: string; tur: "gorsel" | "video" | "ses"; arka: string; url?: string | null }[];
  onKapat: () => void;
  /** Son üretilen çıktı — varsa "Çıktı" sekmesi görünür ve öne çıkar. */
  artifact?: ArtifactVeri | null;
  onArtifactTamEkran?: () => void;
  onArtifactIndir?: () => void;
}) {
  const [suzgecAcik, setSuzgecAcik] = useState(false);
  const [sirala, setSirala] = useState("son");
  const [suz, setSuz] = useState("hepsi");

  const SEKMELER: { id: AssetSekme; ad: string; ikon: typeof ImageIkon }[] = [
    ...(artifact ? [{ id: "artifact" as AssetSekme, ad: "Çıktı", ikon: Sparkles }] : []),
    { id: "yuklemeler", ad: "Yüklemeler", ikon: FolderOpen },
    { id: "gorsel", ad: "Görsel Üretimler", ikon: ImageIkon },
    { id: "video", ad: "Video Üretimler", ikon: Video },
    { id: "begeni", ad: "Beğeniler", ikon: Heart },
  ];

  const suzulu = ogeler.filter((o) => {
    if (sekme === "gorsel") return o.tur === "gorsel";
    if (sekme === "video") return o.tur === "video";
    if (sekme === "begeni") return false;
    return true;
  });

  if (!acik) return null;

  return (
    <aside className="relative flex w-[370px] shrink-0 flex-col border-l border-[var(--sc-kenar)] bg-[var(--sc-kart)]">
      {/* sekme çubuğu */}
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto px-3 py-3 [scrollbar-width:none]">
        {SEKMELER.map((s) => (
          <button key={s.id} onClick={() => onSekme(s.id)}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
              sekme === s.id ? "bg-[var(--sc-cip-2)] text-[var(--sc-metin)]" : "text-[var(--sc-metin)] hover:bg-[var(--sc-cip)]")}>
            <s.ikon className="h-[14px] w-[14px]" /> {s.ad}
          </button>
        ))}
      </div>

      {/* bölüm başlığı + süzgeç — artifact sekmesinde gizli (kendi başlığı var) */}
      <div className={cn("flex shrink-0 items-center px-4 pb-2", sekme === "artifact" && "hidden")}>
        <span className="text-[14px] text-[var(--sc-metin-2)]">{SEKMELER.find((s) => s.id === sekme)?.ad}</span>
        <div className="relative ml-auto">
          <button onClick={() => setSuzgecAcik((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-[var(--sc-cip)] px-3 py-1.5 text-[13px] text-[var(--sc-metin-2)]">
            <SlidersHorizontal className="h-[14px] w-[14px]" /> Süzgeç
          </button>
          <AnimatePresence>
            <Yuzen acik={!!(suzgecAcik)} onKapat={() => setSuzgecAcik(false)} sag={0} ust={"tam"} bosluk={8}><motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14 }}
                  className="border border-[var(--sc-kenar)] bg-[var(--sc-kart)] w-[230px] rounded-[14px] p-1.5">
                  <p className="px-2.5 py-1.5 text-[12.5px] text-[var(--sc-metin-3)]">Sırala</p>
                  {[["son", "Son oluşturulan", Timer], ["kullanim", "Son kullanılan", Clock], ["ilk", "İlk oluşturulan", ArrowDownUp]].map(
                    ([id, ad, I]) => {
                      const Ikn = I as typeof Timer;
                      return (
                        <button key={id as string} onClick={() => setSirala(id as string)}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[14px] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]">
                          <Ikn className="h-4 w-4 text-[var(--sc-metin-3)]" />
                          <span className="flex-1">{ad as string}</span>
                          {sirala === id && <Check className="h-4 w-4" style={{ color: "var(--sc-aksan)" }} />}
                        </button>
                      );
                    })}
                  <div className="my-1 h-px bg-[var(--sc-cip)]" />
                  <p className="px-2.5 py-1.5 text-[12.5px] text-[var(--sc-metin-3)]">Süz</p>
                  {[["hepsi", "Tüm medya", LayoutGrid], ["gorsel", "Görseller", ImageIkon], ["video", "Videolar", Video], ["ses", "Sesler", Music]].map(
                    ([id, ad, I]) => {
                      const Ikn = I as typeof LayoutGrid;
                      return (
                        <button key={id as string} onClick={() => setSuz(id as string)}
                          className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[14px] text-[var(--sc-metin)] transition-colors hover:bg-[var(--sc-cip)]">
                          <Ikn className="h-4 w-4 text-[var(--sc-metin-3)]" />
                          <span className="flex-1">{ad as string}</span>
                          {suz === id && <Check className="h-4 w-4" style={{ color: "var(--sc-aksan)" }} />}
                        </button>
                      );
                    })}
                </motion.div></Yuzen>
          </AnimatePresence>
        </div>
      </div>

      {/* içerik */}
      <div className={cn("min-h-0 flex-1 [scrollbar-width:thin]",
        sekme === "artifact" ? "overflow-hidden" : "overflow-y-auto px-4 pb-4")}>
        {sekme === "artifact" && artifact ? (
          /* Claude'un canlı çıktı görüntüleyicisi — kendi başlık/sekme çubuğunu
             taşıdığı için panelin padding'i uygulanmaz. */
          <SCArtifact veri={artifact} onTamEkran={onArtifactTamEkran} onIndir={onArtifactIndir} />
        ) : sekme === "begeni" ? (
          <div className="flex flex-col items-center pt-24 text-center">
            <span className="flex h-[68px] w-[68px] items-center justify-center rounded-[20px]"
              style={{ background: "linear-gradient(140deg,#e0459a,#8b2fb0)" }}>
              <Heart className="h-8 w-8 text-[var(--sc-metin)]" fill="currentColor" />
            </span>
            <p className="mt-4 text-[15px] text-[var(--sc-metin)]">Beğendiğin üretimler burada görünür</p>
            <p className="mt-1 text-[13.5px] text-[var(--sc-metin-3)]">Beğendiklerini işaretle, burada saklansın</p>
          </div>
        ) : suzulu.length === 0 ? (
          <p className="pt-24 text-center text-[14px] text-[var(--sc-metin-3)]">Henüz içerik yok</p>
        ) : (
          <div className="space-y-3">
            {suzulu.map((o) => (
              <div key={o.id} className="overflow-hidden rounded-[10px]">
                {o.tur === "ses" ? (
                  <div className="rounded-[10px] bg-[var(--sc-kart)] p-3">
                    <p className="line-clamp-2 text-[14px] leading-snug text-[var(--sc-metin-3)]">{o.ad}</p>
                    <div className="mt-2.5 flex h-9 items-end gap-[3px]">
                      {Array.from({ length: 46 }).map((_, i) => (
                        <span key={i} className="flex-1 rounded-sm bg-[var(--sc-metin-3)]"
                          style={{ height: `${18 + ((i * 37) % 22)}px` }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video">
                    <span className="absolute inset-0" style={{ background: o.arka }} />
                    {o.url && <img src={o.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
