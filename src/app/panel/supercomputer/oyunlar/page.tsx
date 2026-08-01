"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Gamepad2, Flame, Activity, ChevronRight, ChevronDown, X, Sparkles,
  Plus, ArrowUp, Waves, CircleSlash2, Check,
} from "lucide-react";
import { SCMarkaIkon } from "@/components/kabuk/sc/SCMarkaIkon";
import { SCArama } from "@/components/kabuk/sc/SCArama";
import { SCOnayMenu, type SCOnayModu } from "@/components/kabuk/sc/SCParcalar";
import {
  SC_OYUN_POPULER, SC_OYUN_YUKSELEN, SC_OYUN_TUMU,
  SC_OYUN_TURLERI, SC_OYUN_STILLERI, SC_OYUN_MEKANLARI,
  sayiKisalt, type SCOyun,
} from "@/lib/scVitrin";
import { useSupercomputer } from "@/store/useSupercomputer";
import { useAuth } from "@/store/useAuth";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { scArka } from "@/lib/gercekVeri";
import { toast } from "@/lib/toast";

/* ============================================================
   SUPERCOMPUTER — OYUNLAR. SIFIRDAN, referanslar/oyunlar birebir.

   Yapı (referans sırası):
     0. Üst — "Oyunlar" · sağda [🎮 Oyunlarım]
     1. Hero — logo + "AD, DAKİKALAR İÇİNDE KENDİ OYUNUNU KUR"
     2. Şerit — 6 sütunlu seçici; composer'ın ARKASINA giriyor (overlap).
               Alt çubuktaki "Stil"/"Mekân" çipine göre içeriği DEĞİŞİR:
               tür ↔ stil ↔ mekân (referansta üç ayrı şerit yakalandı).
     3. Composer — seçimler silinebilir çip olur + Çok oyunculu anahtarı
     4. "Veya şununla oyun kur · Vayra MCP ile Claude ›"
     5. Katalog — "TOPLULUKTAN OYUNLARI KEŞFET (50)" + arama
                  Şu An Popüler(3, sıra rozeti) · Yükselen(4'lü) · Tüm oyunlar(4'lü)
   ============================================================ */

type Serit = "tur" | "stil" | "mekan";

const SERIT_VERI: Record<Serit, readonly string[]> = {
  tur: SC_OYUN_TURLERI,
  stil: SC_OYUN_STILLERI,
  mekan: SC_OYUN_MEKANLARI,
};

export default function OyunlarSayfasi() {
  const router = useRouter();
  const kullanici = useAuth((s) => s.kullanici);
  const [metin, setMetin] = useState("");
  const [serit, setSerit] = useState<Serit>("tur");
  // Referansta ilk açılışta "Nişancı" seçili, istem kutusu ise BOŞ (placeholder görünür).
  const [secim, setSecim] = useState<Record<Serit, string | null>>({
    tur: SC_OYUN_TURLERI[0], stil: null, mekan: null,
  });
  const [cokOyunculu, setCokOyunculu] = useState(false);
  const [onayAcik, setOnayAcik] = useState(false);
  const [onayModu, setOnayModu] = useState<SCOnayModu>("onay");
  const [ara, setAra] = useState("");

  /* İstem kutusu içerik uzadıkça AŞAĞI doğru büyür — Higgsfield birebir.
     Önce height:auto ile gerçek scrollHeight okunur, sonra tavana kadar uygulanır. */
  const istemRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = istemRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 260) + "px";
  }, [metin]);

  /* Referansta istem metni seçimlere göre KENDİ KENDİNE büyüyor:
       "Bir platform oyunu yap"
       → "…, piksel sanat stilinde"
       → "…, piksel sanat stilinde, modern mekânda"
     Kullanıcı elle yazmaya başladıysa (metin bu kalıba uymuyorsa) dokunulmaz. */
  const otoIstem = (s: Record<Serit, string | null>) => {
    if (!s.tur) return "";
    let t = `Bir ${s.tur.toLocaleLowerCase("tr")} oyunu yap`;
    if (s.stil) t += `, ${s.stil.toLocaleLowerCase("tr")} stilinde`;
    if (s.mekan) t += `, ${s.mekan.toLocaleLowerCase("tr")} mekânda`;
    return t;
  };
  /** Seçim değiştir + istem metnini otomatik tazele. */
  const secimDegis = (s: Serit, deger: string | null) => {
    setSecim((eski) => {
      const yeni = { ...eski, [s]: deger };
      // Yalnızca metin boşsa ya da hâlâ otomatik kalıptaysa üzerine yaz.
      setMetin((m) => (m === "" || m === otoIstem(eski) ? otoIstem(yeni) : m));
      return yeni;
    });
  };

  const ad = (kullanici?.ad ?? "").split(" ")[0]?.toLocaleUpperCase("tr") || "HOŞ GELDİN";

  const baslat = (istem: string) => {
    const t = istem.trim();
    if (t.length < 2) return;
    const sc = useSupercomputer.getState();
    const etiketler = [secim.tur, secim.stil, secim.mekan, cokOyunculu && "çok oyunculu"]
      .filter(Boolean).join(", ");
    const id = sc.sohbetAc(t.length > 40 ? t.slice(0, 40) + "…" : t);
    sc.mesajEkle(id, { rol: "kullanici", metin: etiketler ? `${t} — ${etiketler}` : t });
    sc.calisiyorAyarla(id, true);
    router.push(`/panel/supercomputer/${id}`);
  };

  /* Arama — üç bölümde de süzer. */
  const q = ara.trim().toLocaleLowerCase("tr");
  const suz = (liste: SCOyun[]) =>
    !q ? liste : liste.filter((o) =>
      o.ad.toLocaleLowerCase("tr").includes(q) || o.yazar.toLocaleLowerCase("tr").includes(q));

  const populer = useMemo(() => suz(SC_OYUN_POPULER), [q]);
  const yukselen = useMemo(() => suz(SC_OYUN_YUKSELEN), [q]);
  const tumu = useMemo(() => suz(SC_OYUN_TUMU), [q]);
  const toplam = SC_OYUN_POPULER.length + SC_OYUN_YUKSELEN.length + SC_OYUN_TUMU.length;
  const bosMu = populer.length + yukselen.length + tumu.length === 0;

  return (
    <div className="sc-kapsam min-h-full bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      {/* ═══════ 0. ÜST ═══════ */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5">
        <span className="text-[15px] text-[var(--sc-metin-3)]">Oyunlar</span>
        <div className="flex items-center gap-2.5">
          <button onClick={() => window.dispatchEvent(new Event("sc-arama-ac"))}
            className="sc-hap flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] text-white/75"
            title="Sohbetlerde ara (⌘K)">
            <Search className="h-4 w-4 text-white/50" /> Ara
          </button>
          <button onClick={() => toast("Henüz bir oyun oluşturmadın.")}
            className="sc-hap flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] text-white">
            <Gamepad2 className="h-[16px] w-[16px]" /> Oyunlarım
          </button>
        </div>
      </div>

      {/* ═══════ 1–4. HERO + OLUŞTURUCU ═══════ */}
      <section className="relative overflow-hidden">
        {/* noktalı grid deseni — referansta hero zemini */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.075) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(85% 70% at 50% 30%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(85% 70% at 50% 30%, #000 30%, transparent 100%)",
          }} />

        <div className="relative mx-auto max-w-[1080px] px-6 pb-8 pt-10">
          {/* logo kutusu */}
          <div className="flex justify-center">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-[20px]"
              style={{
                background: "var(--sn-lime,#55d6fd)",
                boxShadow: "0 8px 32px -6px rgba(85, 214, 253,0.4), inset 0 1px 0 rgba(255,255,255,0.4)",
              }}>
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="#10130a" strokeWidth="2.6" strokeLinecap="round">
                <path d="M3.6 15.4c2.6-4.8 4.6-7.2 6-7.2 2.1 0 1.1 6.4 3.1 6.4 1.4 0 3.3-2.4 5.7-7.2" />
                <path d="M5.4 9.4c2.4 4.4 4.2 6.6 5.5 6.6" opacity="0.5" />
              </svg>
            </span>
          </div>

          {/* Referansta tek satır — sığması için ölçek biraz kısıldı. */}
          <h1 className="sc-baslik mt-6 whitespace-nowrap text-center text-[26px] sm:text-[34px] lg:text-[40px]">
            {ad}, DAKİKALAR İÇİNDE KENDİ OYUNUNU KUR
          </h1>

          {/* ══ ŞERİT + COMPOSER — referans birebir ══
              Şerit kabı GENİŞ ve arkada; composer ondan DAR ve üstüne biner.
              Karakterler şeffaf PNG gibi davranır: alt yarıları composer'ın
              ARKASINA girer, etiket karakterin ÜSTÜNE yazılır. */}
          <div className="relative mt-16">
            {/* m31: TÜR/STİL/MEKÂN kartları — artık NET ve TAM görünür kartlar.
                Eskiden figürler composer'ın arkasına yarı-gizli giriyordu (kesik PNG
                olmadığından çirkindi). Şimdi her seçenek düzgün bir görsel kart:
                tam görsel + alt gradyan + etiket, seçili olan lime çerçeveli. */}
            <AnimatePresence mode="wait">
              <motion.div key={serit}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {SERIT_VERI[serit].map((oge) => {
                  const aktif = secim[serit] === oge;
                  return (
                    <button key={oge}
                      onClick={() => secimDegis(serit, oge)}
                      className={cn(
                        "group/serit relative aspect-[3/4] overflow-hidden rounded-2xl border transition-all",
                        aktif ? "border-[var(--sn-lime,#55d6fd)] ring-2 ring-[var(--sn-lime,#55d6fd)]/30" : "border-white/[0.08] hover:border-white/20",
                      )}>
                      {/* görsel */}
                      <span className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover/serit:scale-[1.05]"
                        style={{ backgroundImage: `url(${saltUrl(scArka(`oyun-${serit}-${oge}`, "gorsel")) || ""})` }} />
                      {/* alt gradyan — etiket okunur */}
                      <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      {/* etiket */}
                      <span className={cn("absolute inset-x-0 bottom-0 px-2 py-2 text-center text-[13.5px] leading-tight transition-colors",
                        aktif ? "font-semibold text-white" : "text-white/85")}>
                        {oge}
                      </span>
                      {/* seçili tik */}
                      {aktif && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sn-lime,#55d6fd)] text-black">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* — composer — kartların ALTINDA, artık üstüne binmez — */}
            <div className="relative z-10 px-3">
              <div className="sc-kabuk px-5 pb-3.5 pt-4">
                {/* Metin uzadıkça kutu AŞAĞI doğru büyür (referans birebir).
                    Yükseklik her değişimde yeniden ölçülür; 260px'te durur ve kaydırılır. */}
                <textarea
                  ref={istemRef}
                  value={metin}
                  onChange={(e) => setMetin(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); baslat(metin); } }}
                  rows={1}
                  placeholder="Boss savaşları olan bir piksel platform oyunu kur"
                  className="min-h-[30px] w-full resize-none overflow-y-auto bg-transparent py-0.5 text-[17px] leading-[1.5] text-white outline-none [scrollbar-width:thin] placeholder:text-[rgba(255,255,255,0.42)]"
                />

                {/* kontrol satırı — referans sırası:
                    ⊕ · Kimi K3(soluk) · [Tür ×] · [Stil ×] · [Mekân ×] · Stil · Mekân · Çok oyunculu ····· Sor ⌄ · ↑ */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
                  <button onClick={() => toast.success("Dosya ekleme hazır", { description: "Görsel/belge sürükle veya buradan seç." })}
                    className="sc-yuvarlak flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-white/85"
                    aria-label="Ekle">
                    <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
                  </button>

                  {/* sabit model çipi — referansta SOLUK ve dolgusuz */}
                  <span className="flex shrink-0 items-center gap-2 px-1 text-[14.5px] text-white/45">
                    <SCMarkaIkon marka="moonshot" className="h-[18px] w-[18px]" />
                    Kimi K3
                  </span>

                  {/* seçili çipler — tür/stil/mekân sırasıyla */}
                  {(["tur", "stil", "mekan"] as Serit[]).map((s) => secim[s] && (
                    <span key={s}
                      className="sc-hap flex shrink-0 items-center gap-2 rounded-full py-[7px] pl-[7px] pr-2.5 text-[14.5px] text-white/92">
                      <span className="h-[26px] w-[26px] shrink-0 rounded-full"
                        style={{ background: onizlemeArka(`oyun-${s}-${secim[s]}`, "gorsel") }} />
                      {secim[s]}
                      <button onClick={() => secimDegis(s, null)}
                        className="ml-0.5 text-white/40 transition-colors hover:text-white"
                        aria-label={`${secim[s]} seçimini kaldır`}>
                        <X className="h-[15px] w-[15px]" />
                      </button>
                    </span>
                  ))}

                  {/* şerit anahtarları — SADECE o kategori seçilmemişken görünür */}
                  {!secim.stil && (
                    <SeritDugmesi ad="Stil" ikon={Waves} aktif={serit === "stil"}
                      onTikla={() => setSerit((v) => (v === "stil" ? "tur" : "stil"))} />
                  )}
                  {!secim.mekan && (
                    <SeritDugmesi ad="Mekân" ikon={CircleSlash2} aktif={serit === "mekan"}
                      onTikla={() => setSerit((v) => (v === "mekan" ? "tur" : "mekan"))} />
                  )}

                  {/* çok oyunculu anahtarı */}
                  <button onClick={() => setCokOyunculu((v) => !v)}
                    className="flex shrink-0 items-center gap-2.5 rounded-full px-1 text-[14.5px] text-white/85"
                    role="switch" aria-checked={cokOyunculu}>
                    <span className={cn("relative h-[24px] w-[42px] shrink-0 rounded-full transition-colors",
                      cokOyunculu ? "bg-[var(--sn-lime,#55d6fd)]" : "bg-white/[0.16]")}>
                      <motion.span layout transition={{ type: "spring", stiffness: 430, damping: 33 }}
                        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow"
                        style={{ left: cokOyunculu ? 21 : 3 }} />
                    </span>
                    Çok oyunculu
                  </button>

                  {/* onay modu */}
                  <div className="relative ml-auto shrink-0">
                    <button onClick={() => setOnayAcik((v) => !v)}
                      className="flex items-center gap-1 rounded-full px-2 py-1.5 text-[15px] text-white/65 transition-colors hover:text-white">
                      {onayModu === "oto" ? "Otomatik" : "Sor"}
                      <ChevronDown className="h-4 w-4 text-white/45" />
                    </button>
                    <AnimatePresence>
                      {onayAcik && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOnayAcik(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.14 }}
                            className="absolute right-0 top-full z-50 mt-2">
                            <SCOnayMenu deger={onayModu} onSec={(m) => { setOnayModu(m); setOnayAcik(false); }} />
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* gönder */}
                  <button onClick={() => baslat(metin)} disabled={metin.trim().length < 2}
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-95 disabled:opacity-45"
                    style={{ background: "var(--sn-lime,#55d6fd)", color: "#10130a" }}
                    aria-label="Gönder">
                    <ArrowUp className="h-[21px] w-[21px]" strokeWidth={2.6} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MCP satırı */}
          <p className="mt-5 flex items-center justify-center gap-2 text-[14px] text-[var(--sc-metin-3)]">
            Veya şununla oyun kur
            <Sparkles className="h-[15px] w-[15px] text-[#e0784f]" />
            <span className="text-white/85">Vayra MCP ile Claude</span>
            <ChevronRight className="h-4 w-4 text-white/35" />
          </p>
        </div>
      </section>

      {/* ═══════ 5. KATALOG ═══════ */}
      <div className="mx-auto max-w-[1180px] px-6 pb-24 pt-10">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="sc-baslik text-[24px] sm:text-[28px]">
            TOPLULUKTAN OYUNLARI KEŞFET
            <span className="ml-2.5 font-normal text-[var(--sc-metin-3)]">{toplam}</span>
          </h2>
          <SCArama deger={ara} onDegis={setAra} placeholder="Oynayacak bir oyun bul"
            genislik={330} className="ml-auto" />
        </div>

        {bosMu ? (
          <div className="flex flex-col items-center py-28">
            <span className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-white/[0.055]">
              <Search className="h-9 w-9 text-white/30" />
            </span>
            <p className="mt-5 text-[15px] text-[var(--sc-metin-3)]">Aramanla eşleşen oyun yok</p>
          </div>
        ) : (
          <>
            {populer.length > 0 && (
              <section className="mt-9">
                <BolumBasligi ikon={<Flame className="h-[19px] w-[19px] text-[#ff8a3d]" />} ad="Şu An Popüler" />
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {populer.map((o, i) => <OyunKarti key={o.tohum} o={o} sira={i + 1} buyuk />)}
                </div>
              </section>
            )}

            {yukselen.length > 0 && (
              <section className="mt-14">
                <BolumBasligi ikon={<Activity className="h-[19px] w-[19px]" style={{ color: "var(--sn-lime,#55d6fd)" }} />} ad="Yükselen oyunlar" />
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {yukselen.map((o) => <OyunKarti key={o.tohum} o={o} />)}
                </div>
              </section>
            )}

            {tumu.length > 0 && (
              <section className="mt-14">
                <BolumBasligi ikon={<Gamepad2 className="h-[19px] w-[19px] text-white" />} ad="Tüm oyunlar" />
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {tumu.map((o) => <OyunKarti key={o.tohum} o={o} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Şerit anahtarı — referansta PASİFken dolgusuz/ikonlu, AKTİFken mavi outline ── */
function SeritDugmesi({
  ad, ikon: Ikon, aktif, onTikla,
}: { ad: string; ikon: typeof Waves; aktif: boolean; onTikla: () => void }) {
  return (
    <button onClick={onTikla}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full px-3 py-[9px] text-[14.5px] transition-colors",
        aktif ? "text-white" : "text-white/80 hover:text-white",
      )}
      style={aktif ? { border: "1px solid #5b8def", background: "rgba(91,141,239,0.10)" } : undefined}>
      <Ikon className={cn("h-[17px] w-[17px]", aktif ? "text-[#7ba5f2]" : "text-white/55")} />
      {ad}
    </button>
  );
}

function BolumBasligi({ ikon, ad }: { ikon: React.ReactNode; ad: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {ikon}
      <h3 className="text-[20px] font-semibold text-white">{ad}</h3>
    </div>
  );
}

/* ── Oyun kartı: 16:10 kapak + kare ikon + ad + "@yazar · N oynanma" ── */
function OyunKarti({ o, sira, buyuk }: { o: SCOyun; sira?: number; buyuk?: boolean }) {
  const arka = scArka(o.tohum, "sinema");
  const url = saltUrl(arka);
  const router = useRouter();
  return (
    <button onClick={() => router.push(`/panel/supercomputer?istem=${encodeURIComponent(`${o.ad} oyununu üret`)}`)}
      className="group/oyun rounded-2xl bg-[var(--sc-kart)] p-2 text-left transition-all hover:bg-[var(--sc-yukselti)]">
      <div className="relative aspect-[8/5] overflow-hidden rounded-xl">
        <span className="absolute inset-0" style={{ background: arka }} />
        {url && <img src={url} alt="" loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/oyun:scale-[1.05]" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <span className={cn("absolute inset-x-0 bottom-0 flex items-center justify-center px-4 pb-3 text-center",
          buyuk ? "text-[22px]" : "text-[16px]")}>
          <span className="sc-baslik leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{o.ad}</span>
        </span>
        {/* "Şu An Popüler" kapaklarında sıra rozeti */}
        {sira && (
          <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[17px] font-bold"
            style={{ background: "var(--sn-lime,#55d6fd)", color: "#10130a" }}>
            {sira}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5 px-1 pb-1 pt-2.5">
        <span className="h-10 w-10 shrink-0 rounded-[10px]"
          style={{ background: scArka(o.tohum + "-ikon", "gorsel") }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-white">{o.ad}</span>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--sc-metin-3)]">
            @{o.yazar} · {sayiKisalt(o.oynanma)} oynanma
          </span>
        </span>
      </div>
    </button>
  );
}
