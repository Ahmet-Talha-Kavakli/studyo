"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, GitFork, Globe, Heart, LayoutDashboard, LayoutTemplate, Loader2, Monitor, Plus, Search, Smartphone, Users, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { ToplulugaEklePaneli } from "@/components/build/paylasim/ToplulugaEklePaneli";
import { paylasimDurumuYenile, sayiYaz } from "@/components/build/paylasim/ortak";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { yazarAdi } from "@/lib/build/paylasimOrtak";
import { SABLON_OZETLERI, type SablonOzet } from "@/lib/build/sablonlar/ozet";
import { TOPLULUK_KATEGORILERI, kategoriAdi, type ToplulukOzet, type ToplulukSira } from "@/lib/build/toplulukOrtak";
import type { ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { Suzgec } from "./Bolumler";
import { SablonDetay, type DetayOgesi } from "./SablonDetay";

const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
type Kaynak = "vayra" | "topluluk";
const esle = (q: string, ...l: string[]) => !q || l.some((x) => x.toLocaleLowerCase("tr").includes(q));

/** Kart: kapak (üzerine gelince canlı önizle), tür hapı, ad + açıklama; toplulukta yazar, remix ve beğeni. */
function SablonKarti({ ad, aciklama, kapak, tur, ac, eylem, eylemAdi, gidiyor, kilitli, alt, ust }: {
  ad: string; aciklama: string; kapak: string; tur: ProjeTur; ac: () => void; eylem: () => void; eylemAdi: string; gidiyor: boolean; kilitli: boolean; alt?: React.ReactNode; ust?: React.ReactNode;
}) {
  const I = TUR_IKON[tur];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
      className="group flex flex-col overflow-hidden rounded-[20px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition-[box-shadow,background-color] hover:bg-white/[0.05] hover:ring-white/[0.16]">
      <button type="button" onClick={ac} className="relative block aspect-[16/10] w-full overflow-hidden bg-[#16171a]" aria-label={`${ad} ayrıntısı`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kapak} alt="" loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-white backdrop-blur"><I className="h-3 w-3" />{kategoriAdi(tur)}</span>{ust}
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Monitor className="h-3.5 w-3.5" />Canlı önizle</span>
        </span>
      </button>
      <div className="flex flex-1 items-start gap-3 p-3.5">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-medium text-white">{ad}</span>
          <span className="line-clamp-2 text-[12.5px] leading-snug text-white/50">{aciklama}</span>
          {alt}
        </span>
        <button type="button" onClick={eylem} disabled={kilitli} title={eylemAdi} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50">
          {gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : eylemAdi}
        </button>
      </div>
    </motion.div>
  );
}

/** Topluluk boş: yelpaze karolar + başlık + tek cümle + tek beyaz düğme + ikincil metin düğmesi. Uydurma öğe gösterilmez. */
function ToplulukBos({ ekle, vayra }: { ekle: () => void; vayra: () => void }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="relative h-[88px] w-[170px]">
        {([[Globe, -14, -52, "bg-[#1a1c20]"], [Gamepad2, 12, 52, "bg-[#1a1c20]"], [Smartphone, 0, 0, "bg-[#20232a]"]] as const).map(([I, r, x, z], i) => (
          <motion.span key={i} initial={{ opacity: 0, y: 10, rotate: 0 }} animate={{ opacity: 1, y: 0, rotate: r }} transition={{ delay: 0.06 * i, type: "spring", stiffness: 260, damping: 22 }}
            style={{ left: `calc(50% - 34px + ${x}px)` }} className={cn("absolute top-1 flex h-[76px] w-[68px] items-center justify-center rounded-[16px] ring-1 ring-inset ring-white/[0.1]", z, i === 2 && "z-10 ring-[#55d6fd]/30")}>
            <I className={cn("h-6 w-6", i === 2 ? "text-[#7fe0ff]" : "text-white/40")} />
          </motion.span>
        ))}
      </div>
      <p className="mt-4 text-[16px] font-semibold text-white">Henüz topluluk projesi yok</p>
      <p className="mt-1 max-w-[420px] text-[13px] leading-relaxed text-white/55">İlk sen ekle: projelerinden birini şablon yap, herkes canlı önizlesin ve remix etsin.</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={ekle} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />Projeni ekle</button>
        <button type="button" onClick={vayra} className="h-10 rounded-full px-4 text-[13.5px] text-white/65 hover:text-white">Vayra şablonlarına bak</button>
      </div>
    </div>
  );
}

/**
 * Şablonlar galerisi: iki kaynak (Vayra şablonları, Topluluk), arama, kategori ve alt etiket süzgeci, sıralama (Popüler:
 * remix sayısı, Yeni), canlı önizlemeli ayrıntı paneli, Kullan ve Remix. Topluluk boşken dürüst boş durum.
 */
export function SablonGalerisi({ kullan, gidiyor }: { kullan: (id: string) => void; gidiyor: string | null }) {
  const router = useRouter();
  const arama = useSearchParams();
  const [kaynak, setKaynak] = useState<Kaynak>(arama.get("kaynak") === "topluluk" ? "topluluk" : "vayra");
  const [ara, setAra] = useState("");
  const [tur, setTur] = useState<"hepsi" | ProjeTur>("hepsi");
  const [etiket, setEtiket] = useState<string | null>(null);
  const [sira, setSira] = useState<ToplulukSira>("populer");
  const [topluluk, setTopluluk] = useState<ToplulukOzet[] | null>(null);
  const [hata, setHata] = useState("");
  const [detay, setDetay] = useState<DetayOgesi | null>(null);
  const [remixte, setRemixte] = useState<string | null>(null);
  const [ekle, setEkle] = useState(false);
  /* Kaynak seçici tek kopya bağlanır (iki kopyada kayan beyaz görünmüyor): geniş ekranda başlıkta, telefonda gövdede. */
  const [genis, setGenis] = useState(true);
  useEffect(() => { const m = matchMedia("(min-width: 768px)"); const f = () => setGenis(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);

  const yukle = useCallback(async () => {
    try { setTopluluk((await api<{ ogeler: ToplulukOzet[] }>(`/api/build/topluluk?sira=${sira}`)).ogeler); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Topluluk yüklenemedi."); setTopluluk([]); }
  }, [sira]);
  useEffect(() => { yukle(); }, [yukle]);

  /* ?kaynak=topluluk&t=<id>: o şablonun ayrıntısını aç (eklendikten sonra "Galeride gör"). */
  const hedef = arama.get("t");
  useEffect(() => {
    if (!hedef || !topluluk) return;
    const o = topluluk.find((x) => x.id === hedef);
    if (o) { setKaynak("topluluk"); setDetay({ kaynak: "topluluk", o }); }
    router.replace("/panel/build/sablonlar?kaynak=topluluk", { scroll: false });
  }, [hedef, topluluk, router]);

  const q = ara.trim().toLocaleLowerCase("tr");
  const vayra = useMemo(() => SABLON_OZETLERI.filter((s) => esle(q, s.ad, s.aciklama, ...(s.etiketler ?? []))), [q]);
  const toplulukAra = useMemo(() => (topluluk ?? []).filter((o) => esle(q, o.baslik, o.aciklama, o.yazar, ...o.etiketler)), [topluluk, q]);
  const yuklendi = kaynak === "vayra" || topluluk !== null;
  const kaynakListe = kaynak === "vayra" ? vayra.map((s) => s.tur) : toplulukAra.map((o) => o.kategori);
  const sayi = (t: ProjeTur) => kaynakListe.filter((x) => x === t).length;
  const etiketler = useMemo(() => {
    const m = new Map<string, number>();
    // Vayra şablonlarında da alt etiketler (E-ticaret, Randevu, Restoran…) süzgeç olur.
    if (kaynak === "vayra") { for (const s of vayra) if (tur === "hepsi" || s.tur === tur) for (const e of s.etiketler ?? []) m.set(e, (m.get(e) ?? 0) + 1); }
    else for (const o of toplulukAra) if (tur === "hepsi" || o.kategori === tur) for (const e of o.etiketler) m.set(e, (m.get(e) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr")).slice(0, 14);
  }, [toplulukAra, vayra, kaynak, tur]);
  useEffect(() => { if (etiket && !etiketler.some(([e]) => e === etiket)) setEtiket(null); }, [etiket, etiketler]);

  const vayraL = vayra.filter((s) => (tur === "hepsi" || s.tur === tur) && (!etiket || (s.etiketler ?? []).includes(etiket)));
  const toplulukL = toplulukAra.filter((o) => (tur === "hepsi" || o.kategori === tur) && (!etiket || o.etiketler.includes(etiket)));

  const remix = async (o: ToplulukOzet) => {
    if (remixte) return;
    setRemixte(o.id); setHata("");
    try { router.push(`/panel/build/${(await api<{ id: string }>(`/api/build/topluluk/${o.id}/remix`, { govde: {} })).id}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Remix yapılamadı."); setRemixte(null); }
  };
  const guncelle = (o: ToplulukOzet) => { setTopluluk((l) => l?.map((x) => (x.id === o.id ? o : x)) ?? l); setDetay((d) => (d?.kaynak === "topluluk" && d.o.id === o.id ? { kaynak: "topluluk", o } : d)); };
  const begen = async (o: ToplulukOzet) => {
    guncelle({ ...o, begendim: !o.begendim, begeni: o.begeni + (o.begendim ? -1 : 1) });
    try { const v = await api<{ begeni: number; begendim: boolean }>(`/api/build/topluluk/${o.id}/begen`, { govde: {} }); guncelle({ ...o, ...v }); }
    catch (e) { guncelle(o); setHata(e instanceof ApiHatasi ? e.message : "Beğeni kaydedilemedi."); }
  };
  const kaldir = async (o: ToplulukOzet) => {
    await api(`/api/build/topluluk/${o.id}`, { method: "DELETE" });
    setTopluluk((l) => l?.filter((x) => x.id !== o.id) ?? l); setDetay(null); paylasimDurumuYenile();
  };

  const kaynakSecici = (id: string) => <Suzgec id={id} deger={kaynak} set={(k) => { setKaynak(k); setEtiket(null); }} l={[{ id: "vayra" as const, ad: "Vayra şablonları", sayi: SABLON_OZETLERI.length }, { id: "topluluk" as const, ad: "Topluluk", sayi: topluluk?.length }]} />;
  const toplam = kaynak === "vayra" ? SABLON_OZETLERI.length : topluluk?.length ?? 0;
  const bosTopluluk = kaynak === "topluluk" && topluluk !== null && topluluk.length === 0;

  return (
    <>
      <Kart ikon={LayoutTemplate} baslik="Şablonlar"
        alt={kaynak === "vayra" ? "Çalışan projeler: canlı dene, kopyala, sohbetle kendine uyarla. Kredi harcamaz." : topluluk === null ? "Yükleniyor" : toplam ? `${toplam} topluluk şablonu · Vayra Build kullanıcılarının paylaştıkları` : "Vayra Build kullanıcılarının paylaştığı şablonlar"}
        sag={<span className="flex items-center gap-2 max-md:hidden">{kaynak === "topluluk" && !bosTopluluk && <button type="button" onClick={() => setEkle(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Topluluğa ekle</button>}{genis && kaynakSecici("sablon-kaynak")}</span>}
        govde="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 md:hidden">{!genis && kaynakSecici("sablon-kaynak-m")}{kaynak === "topluluk" && !bosTopluluk && <button type="button" onClick={() => setEkle(true)} aria-label="Topluluğa ekle" className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"><Plus className="h-4 w-4" /></button>}</div>
        {!bosTopluluk && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-white/45 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/25 sm:max-w-[300px]">
              <Search className="h-3.5 w-3.5 shrink-0" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder={kaynak === "vayra" ? "Şablonlarda ara" : "Ad, etiket ya da yazar ara"} className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />
              {ara && <button type="button" onClick={() => setAra("")} aria-label="Aramayı temizle" className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
            </label>
            <Suzgec id="sablon-kat" deger={tur} set={(t) => { setTur(t); setEtiket(null); }} l={[{ id: "hepsi" as const, ad: "Hepsi", sayi: yuklendi ? kaynakListe.length : undefined }, ...TOPLULUK_KATEGORILERI.map((k) => ({ id: k.id, ad: k.ad, sayi: yuklendi ? sayi(k.id) : undefined }))]} />
            <span className="flex-1" />
            {kaynak === "topluluk" && <Secici id="sablon-sira" deger={sira} set={setSira} l={[{ id: "populer" as const, ad: "Popüler", ipucu: "En çok remix edilen önde" }, { id: "yeni" as const, ad: "Yeni" }]} />}
          </div>
        )}
        {etiketler.length > 0 && (
          <div className="-mt-1 mb-4 flex flex-wrap gap-1.5">
            {etiketler.map(([e, n]) => (
              <button key={e} type="button" onClick={() => setEtiket(etiket === e ? null : e)} aria-pressed={etiket === e}
                className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", etiket === e ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/70" : "bg-white/[0.04] text-white/60 ring-1 ring-inset ring-white/[0.06] hover:text-white")}>
                {e}<span className="tabular-nums text-white/35">{n}</span>
              </button>
            ))}
          </div>
        )}
        {hata && <p className="mb-3 text-[13px] text-rose-300">{hata}</p>}

        {kaynak === "vayra" ? (
          vayraL.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 max-[420px]:grid-cols-1">
                <AnimatePresence initial={false}>
                  {vayraL.map((s: SablonOzet) => <SablonKarti key={s.id} ad={s.ad} aciklama={s.aciklama} kapak={s.kapak} tur={s.tur} ac={() => setDetay({ kaynak: "vayra", s })} eylem={() => kullan(s.id)} eylemAdi="Kullan" gidiyor={gidiyor === s.id} kilitli={!!gidiyor} />)}
                </AnimatePresence>
              </div>
          ) : <SuzgecBos temizle={() => { setAra(""); setTur("hepsi"); }} />
        ) : topluluk === null ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[16/13] animate-pulse rounded-[20px] bg-white/[0.04]" />)}</div>
        ) : bosTopluluk ? (
          <ToplulukBos ekle={() => setEkle(true)} vayra={() => setKaynak("vayra")} />
        ) : toplulukL.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 max-[420px]:grid-cols-1">
              <AnimatePresence initial={false}>
                {toplulukL.map((o) => (
                  <SablonKarti key={o.id} ad={o.baslik} aciklama={o.aciklama} kapak={o.kapak} tur={o.kategori} ac={() => setDetay({ kaynak: "topluluk", o })} eylem={() => remix(o)} eylemAdi="Remix" gidiyor={remixte === o.id} kilitli={!!remixte}
                    ust={o.benim ? <span className="flex h-6 items-center rounded-full bg-[#0e2a33]/90 px-2.5 text-[11.5px] font-medium text-[#a8ecff] backdrop-blur">Senin</span> : undefined}
                    alt={<span className="mt-2 flex items-center gap-2.5 text-[12px] text-white/45">
                      <span className="min-w-0 truncate text-white/60">{yazarAdi(o.yazar)}</span>
                      <span className="flex shrink-0 items-center gap-1 tabular-nums" title="Remix"><GitFork className="h-3 w-3" />{sayiYaz(o.remix)}</span>
                      <span className="flex shrink-0 items-center gap-1 tabular-nums" title="Beğeni"><Heart className={cn("h-3 w-3", o.begendim && "fill-rose-300 text-rose-300")} />{sayiYaz(o.begeni)}</span>
                    </span>} />
                ))}
              </AnimatePresence>
            </div>
        ) : <SuzgecBos temizle={() => { setAra(""); setTur("hepsi"); setEtiket(null); }} />}
      </Kart>

      <AnimatePresence>
        {detay && (
          <SablonDetay key={detay.kaynak === "vayra" ? detay.s.id : detay.o.id} oge={detay} kapat={() => setDetay(null)}
            kullan={() => (detay.kaynak === "vayra" ? kullan(detay.s.id) : remix(detay.o))}
            gidiyor={detay.kaynak === "vayra" ? gidiyor === detay.s.id : remixte === detay.o.id}
            begen={detay.kaynak === "topluluk" ? () => begen(detay.o) : undefined}
            kaldir={detay.kaynak === "topluluk" ? () => kaldir(detay.o) : undefined} />
        )}
      </AnimatePresence>
      <ToplulugaEklePaneli projeId={null} acik={ekle} kapat={() => setEkle(false)} eklendi={(o) => { if (o) { setKaynak("topluluk"); yukle(); } }} />
    </>
  );
}

function SuzgecBos({ temizle }: { temizle: () => void }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.06] text-white/55"><Users className="h-5 w-5" /></span>
      <p className="mt-3 text-[14.5px] font-semibold text-white">Bu süzgece uyan şablon yok</p>
      <p className="mt-1 text-[12.5px] text-white/50">Aramayı ya da kategoriyi değiştir.</p>
      <button type="button" onClick={temizle} className="mt-4 inline-flex h-9 items-center rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white hover:bg-white/[0.13]">Süzgeçleri temizle</button>
    </div>
  );
}
