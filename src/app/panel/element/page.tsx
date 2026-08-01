"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { toast } from "@/lib/toast";
import { Plus, Search, AtSign, MoreVertical, Eye, Pin, Pencil, Copy, Share2, Download, Trash2 } from "lucide-react";
import { useElements, type VElement, type ElementTur } from "@/store/useElements";
import { cn, onizlemeArka, saltUrl } from "@/lib/utils";
import { TUR_META, FILTRELER, elementiCogalt, elementiPaylas, elementiIndir } from "@/components/panel/element/elementMeta";
import { ElementDuzenleModal, ElementDuzenleOnay } from "@/components/panel/element/ElementDuzenleModal";
import { ElementDetayModal } from "@/components/panel/element/ElementSeciciModal";

/**
 * Element Stüdyosu — @mention edilebilir tekrar-kullanılabilir varlıklar
 * (karakter/mekân/obje/stil) tek merkezden yönetilir. Referans birebir kart
 * (Use/⋮ menü), New/Edit modal (iki sütun + çoklu görsel), detay + edit onay.
 */
export default function ElementStudyo() {
  const router = useRouter();
  const elementler = useElements((s) => s.elementler);
  const sil = useElements((s) => s.sil);
  const guncelle = useElements((s) => s.guncelle);
  const cogalt = useElements((s) => s.cogalt);
  const kullanildi = useElements((s) => s.kullanildi);
  const [ara, setAra] = useState("");
  const [filtre, setFiltre] = useState<"tumu" | ElementTur>("tumu");
  const [yeni, setYeni] = useState(false);
  const [duzenle, setDuzenle] = useState<VElement | null>(null);
  const [onay, setOnay] = useState<VElement | null>(null);
  const [detay, setDetay] = useState<VElement | null>(null);

  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    const liste = elementler.filter((e) =>
      (filtre === "tumu" || e.tur === filtre) &&
      (!q || `${e.ad} ${e.aciklama}`.toLocaleLowerCase("tr").includes(q)));
    return [...liste].sort((a, b) => Number(b.sabitli ?? 0) - Number(a.sabitli ?? 0));
  }, [elementler, ara, filtre]);

  const duzenleAc = (e: VElement) => { if (e.kullanim > 0) setOnay(e); else setDuzenle(e); };

  /* "Kullan" GERÇEK eylem. Önce yalnız sayaç artırıp toast gösteriyordu:
     ekran kapanmıyor, element hiçbir yere eklenmiyordu — kullanıcı elementi
     kullanamıyordu. Artık elementi Görsel Stüdyosu composer'ına taşır
     (sessionStorage köprüsü, /panel/gorsel açılışta tüketir). */
  const elementiKullan = (e: VElement) => {
    kullanildi(e.id);
    if (typeof window !== "undefined") sessionStorage.setItem("vayra-element-kullan", e.ad);
    router.push("/panel/gorsel");
  };

  return (
    <div className="sinema-kapsam min-h-[calc(100vh-3rem)] bg-zemin">
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-8 sm:px-8">
        {/* Başlık */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-aksan to-emerald-400 text-zemin"><AtSign className="h-6 w-6" /></span>
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">Elementler</h1>
              <p className="mt-0.5 text-[14.5px] text-metin-3">Karakter, mekân, obje ve stillerini bir kez oluştur — her üretimde <span className="text-aksan">@</span> ile çağır.</p>
            </div>
          </div>
          <button onClick={() => setYeni(true)}
            className="flex items-center gap-2 rounded-2xl bg-aksan px-5 py-3 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.02]">
            <Plus className="h-[18px] w-[18px]" /> Yeni element
          </button>
        </div>

        {/* Tür istatistikleri — kaç element, türe göre dağılım (higgs hissi) */}
        {elementler.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {FILTRELER.filter((f) => f.id !== "tumu").map((f) => {
              const sayi = elementler.filter((e) => e.tur === f.id).length;
              if (!sayi) return null;
              const m = TUR_META[f.id as ElementTur];
              const I = m.ikon;
              return (
                <span key={f.id} className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[13px]">
                  <I className={cn("h-3.5 w-3.5", m.renk)} />
                  <span className="text-metin-2">{m.ad}</span>
                  <span className="font-semibold tabular-nums text-white">{sayi}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Arama + filtre */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-11 w-full shrink-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 sm:w-[280px]">
            <Search className="h-[17px] w-[17px] shrink-0 text-metin-3" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Element ara"
              className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-metin-3" />
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTRELER.map((f) => (
              <button key={f.id} onClick={() => setFiltre(f.id)}
                className={cn("h-9 shrink-0 rounded-full px-4 text-[14px] transition-colors",
                  filtre === f.id ? "bg-aksan font-semibold text-zemin" : "bg-white/[0.04] text-[#c7c7cc] hover:bg-white/[0.08] hover:text-white")}>
                {f.ad}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* Yeni element kartı */}
          <button onClick={() => setYeni(true)}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.05]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/8 text-metin-2"><Plus className="h-7 w-7" /></span>
            <span className="text-[14px] font-medium text-white">Yeni Element</span>
          </button>
          {gorunen.map((e) => (
            <ElementKart key={e.id} e={e}
              onKullan={() => elementiKullan(e)}
              onGoruntule={() => setDetay(e)}
              onSabitle={() => { guncelle(e.id, { sabitli: !e.sabitli }); toast.success(e.sabitli ? "Sabitleme kaldırıldı" : "Sabitlendi 📌"); }}
              onDuzenle={() => duzenleAc(e)}
              onSil={() => { sil(e.id); toast.success(`@${e.ad} silindi`); }} />
          ))}
        </div>
        {gorunen.length === 0 && ara && (
          <p className="py-16 text-center text-metin-3">Aramanla eşleşen element yok</p>
        )}
        {elementler.length === 0 && !ara && (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-aksan/20 to-emerald-400/10 text-aksan"><AtSign className="h-8 w-8" /></span>
            <div>
              <p className="text-[17px] font-bold text-white">İlk elementini oluştur</p>
              <p className="mx-auto mt-1.5 max-w-md text-[14px] text-metin-3">
                Bir karakter, mekân, obje ya da stil tanımla; sonra her görsel/video üretiminde
                <span className="text-aksan"> @adıyla</span> çağırarak tutarlı sonuçlar al.
              </p>
            </div>
            <button onClick={() => setYeni(true)}
              className="flex items-center gap-2 rounded-2xl bg-aksan px-5 py-2.5 text-[14.5px] font-bold text-zemin transition-transform hover:scale-[1.02]">
              <Plus className="h-[18px] w-[18px]" /> Yeni element
            </button>
          </div>
        )}
      </div>


      <AnimatePresence>
        {yeni && <ElementDuzenleModal key="el-yeni" element={null} onKapat={() => setYeni(false)} />}
        {duzenle && <ElementDuzenleModal key="el-duzenle" element={duzenle} onKapat={() => setDuzenle(null)} />}
        {onay && <ElementDuzenleOnay key="el-onay" element={onay}
          onCogalt={() => { const yid = cogalt(onay.id); setOnay(null); const el = useElements.getState().elementler.find((x) => x.id === yid); if (el) setDuzenle(el); }}
          onDuzenle={() => { setDuzenle(onay); setOnay(null); }}
          onKapat={() => setOnay(null)} />}
        {detay && <ElementDetayModal key="el-detay" element={detay} onKapat={() => setDetay(null)}
          onKullan={() => { setDetay(null); elementiKullan(detay); }}
          onDuzenle={() => { setDetay(null); duzenleAc(detay); }}
          onSil={() => { sil(detay.id); toast.success(`@${detay.ad} silindi`); setDetay(null); }} />}
      </AnimatePresence>
    </div>
  );
}

function ElementKart({ e, onKullan, onGoruntule, onSabitle, onDuzenle, onSil }: {
  e: VElement; onKullan: () => void; onGoruntule: () => void; onSabitle: () => void; onDuzenle: () => void; onSil: () => void;
}) {
  const meta = TUR_META[e.tur];
  const kapak = e.gorseller[0];
  const arka = useMemo(() => onizlemeArka(e.tohum, meta.kat), [e.tohum, meta.kat]);
  const [menuAcik, setMenuAcik] = useState(false);

  return (
    <div className="group relative">
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors hover:border-white/15">
        <div className="relative aspect-[4/5] overflow-hidden">
          {kapak ? <img src={kapak} alt={e.ad} className="absolute inset-0 h-full w-full object-cover" />
            : <><span className="absolute inset-0" style={{ background: arka }} />{saltUrl(arka) && <img src={saltUrl(arka)} alt={e.ad} className="absolute inset-0 h-full w-full object-cover" />}</>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          {/* TÜR ROZETİ — cam hap (kullanıcı: "kötü gözüküyor, kaliteli yapalım").
              Önce düz `rounded-md bg-black/45` dikdörtgendi. Artık .kart-begeni
              reçetesiyle aynı cam dil: yuvarlak hap + ikon için renkli nokta
              kabı + doygun blur. Medya üstünde durduğu için opaklık yüksek. */}
          <span className="el-rozet absolute left-2 top-2 flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-semibold text-white">
            <span className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{ background: `color-mix(in srgb, ${meta.hex} 30%, transparent)`, color: meta.hex }}>
              {(() => { const I = meta.ikon; return <I className="h-2.5 w-2.5" strokeWidth={2.5} />; })()}
            </span>
            {meta.ad}
          </span>
          {e.sabitli && (
            <span className="el-rozet absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-aksan">
              <Pin className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
          {/* Kullanım sayısı — kaç üretimde @çağrıldı (higgs birebir) */}
          {e.kullanim > 0 && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10.5px] font-medium text-white/90 backdrop-blur-sm">
              <AtSign className="h-2.5 w-2.5" /> {e.kullanim}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">@{e.ad}</p>
          <p className="truncate text-[12px] text-metin-3">{e.aciklama || meta.ingAd}</p>
        </div>
        <button onClick={onKullan} className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-black hover:scale-105">Kullan</button>
        <div className="relative shrink-0">
          <button onClick={() => setMenuAcik((v) => !v)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white hover:bg-white/15"><MoreVertical className="h-4 w-4" /></button>
          {menuAcik && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAcik(false)} />
              {/* m6: YANA açılır (butonun soluna) — alta açılıp kartı taşırmasın, scroll gerekmesin */}
              <div className="absolute right-full top-0 z-20 mr-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1f] py-1.5 shadow-2xl">
                <MenuOge ik={Eye} et="Görüntüle" onClick={() => { onGoruntule(); setMenuAcik(false); }} />
                <MenuOge ik={Pin} et={e.sabitli ? "Sabitlemeyi kaldır" : "Sabitle"} onClick={() => { onSabitle(); setMenuAcik(false); }} />
                <MenuOge ik={Pencil} et="Düzenle" onClick={() => { onDuzenle(); setMenuAcik(false); }} />
                <MenuOge ik={Copy} et="Kopyala" onClick={() => { elementiCogalt(e); setMenuAcik(false); }} />
                <MenuOge ik={Share2} et="Paylaş" onClick={() => { void elementiPaylas(e); setMenuAcik(false); }} />
                <MenuOge ik={Download} et="İndir" onClick={() => { elementiIndir(e); setMenuAcik(false); }} />
                <MenuOge ik={Trash2} et="Sil" tehlike onClick={() => { onSil(); setMenuAcik(false); }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuOge({ ik: Ik, et, onClick, tehlike }: { ik: typeof Eye; et: string; onClick: () => void; tehlike?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2.5 px-3.5 py-2 text-[13.5px] hover:bg-white/[0.06]", tehlike ? "text-rose-300" : "text-white")}>
      <Ik className="h-4 w-4" /> {et}
    </button>
  );
}
