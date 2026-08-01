"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText, Sparkles, Image, Newspaper, Megaphone, Scale, Plus, Eye, EyeOff, Check,
  Pencil, Trash2, X,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD } from "@/components/admin/ui/temel";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { veri } from "@/lib/admin/seed";
import { showcase } from "@/lib/admin/seed/buyume";
import {
  useAdminIcerik, slugYap, versiyonArtir,
  type Preset, type Blog, type Duyuru, type YasalMetin,
} from "@/store/admin/useAdminIcerik";
import { onizlemeArka } from "@/lib/utils";
import { sayi, kisaSayi, tarihEtiket } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring", stiffness: 320, damping: 30 } as const;
const MODELLER = ["Seedance 2.0", "Veo 3.1", "Ruh 2.0", "Nano Banana Pro"];
const KATEGORILER = ["Portre", "Sinematik", "Ürün", "Moda", "3D", "Video"];
const TIERLER = ["Tümü", "Artı+", "Ultra"];

const alan = "h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50";
const alanSelect = "h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey-2)] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50";
const etiket = "mb-1.5 block text-[13px] font-medium";

function ModalKabuk({ baslik, ikon: Ikon, renk, onKapat, children, altlik }: { baslik: string; ikon: typeof Sparkles; renk?: string; onKapat: () => void; children: React.ReactNode; altlik: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={SPRING}
        className="ad-panel relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[color:var(--ad-kenar)] p-5">
          <h3 className={cn("flex items-center gap-2 text-base font-bold", AD.metin)}><Ikon className="h-4.5 w-4.5" style={{ color: renk }} /> {baslik}</h3>
          <button onClick={onKapat} className="text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-metin)]"><X className="h-5 w-5" /></button>
        </div>
        <div className="ad-ince-scroll flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
        <div className="flex gap-2 border-t border-[color:var(--ad-kenar)] p-5">{altlik}</div>
      </motion.div>
    </div>
  );
}

/* ── Preset editör ── */
function PresetModal({ mevcut, onKapat, onKaydet }: { mevcut: Preset | null; onKapat: () => void; onKaydet: (p: Omit<Preset, "id" | "sira" | "kullanim">) => void }) {
  const [ad, setAd] = useState(mevcut?.ad ?? "");
  const [kategori, setKategori] = useState(mevcut?.kategori ?? KATEGORILER[0]);
  const [model, setModel] = useState(mevcut?.model ?? MODELLER[0]);
  const [gizliPrompt, setGizliPrompt] = useState(mevcut?.gizliPrompt ?? "");
  const [tier, setTier] = useState(mevcut?.tier ?? TIERLER[0]);
  const [aktif, setAktif] = useState(mevcut?.aktif ?? true);
  const gecerli = ad.trim() && gizliPrompt.trim();

  return (
    <ModalKabuk baslik={mevcut ? "Preset düzenle" : "Yeni preset"} ikon={Sparkles} renk="var(--ad-basari)" onKapat={onKapat}
      altlik={<Dugme className="flex-1" ikon={Check} disabled={!gecerli} onClick={() => gecerli && onKaydet({ ad: ad.trim(), kategori, model, gizliPrompt: gizliPrompt.trim(), tier, aktif })}>{mevcut ? "Güncelle" : "Preset ekle"}</Dugme>}>
      <div><label className={cn(etiket, AD.metin2)}>Ad</label><input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Sinematik Portre" className={alan} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={cn(etiket, AD.metin2)}>Kategori</label><select value={kategori} onChange={(e) => setKategori(e.target.value)} className={alanSelect}>{KATEGORILER.map((k) => <option key={k} value={k}>{k}</option>)}</select></div>
        <div><label className={cn(etiket, AD.metin2)}>Model</label><select value={model} onChange={(e) => setModel(e.target.value)} className={alanSelect}>{MODELLER.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
      </div>
      <div><label className={cn(etiket, AD.metin2)}>Gizli prompt (kullanıcıya görünmez)</label><textarea value={gizliPrompt} onChange={(e) => setGizliPrompt(e.target.value)} rows={4} placeholder="cinematic portrait, 85mm lens…" className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 font-mono text-[12px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" /></div>
      <div className="flex items-center justify-between">
        <div><label className={cn(etiket, AD.metin2)}>Tier</label><div className="flex gap-2">{TIERLER.map((t) => <button key={t} onClick={() => setTier(t)} className={cn("rounded-lg border px-3 py-1.5 text-[12px] font-semibold", tier === t ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>{t}</button>)}</div></div>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[color:var(--ad-metin-2)]"><input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} className="accent-[color:var(--ad-aksan)]" /> Aktif</label>
      </div>
    </ModalKabuk>
  );
}

/* ── Blog editör ── */
function BlogModal({ mevcut, onKapat, onKaydet }: { mevcut: Blog | null; onKapat: () => void; onKaydet: (b: Omit<Blog, "id" | "tarih">) => void }) {
  const [baslik, setBaslik] = useState(mevcut?.baslik ?? "");
  const [slugDokun, setSlugDokun] = useState(!!mevcut);
  const [slug, setSlug] = useState(mevcut?.slug ?? "");
  const [ozet, setOzet] = useState(mevcut?.ozet ?? "");
  const [icerik, setIcerik] = useState(mevcut?.icerik ?? "");
  const [dil, setDil] = useState<Blog["dil"]>(mevcut?.dil ?? "TR");
  const [durum, setDurum] = useState<Blog["durum"]>(mevcut?.durum ?? "taslak");

  const etkinSlug = slugDokun ? slug : slugYap(baslik);
  const gecerli = baslik.trim() && icerik.trim();
  const payload = (d: Blog["durum"]): Omit<Blog, "id" | "tarih"> => ({ baslik: baslik.trim(), slug: etkinSlug, ozet: ozet.trim(), icerik: icerik.trim(), dil, durum: d });

  return (
    <ModalKabuk baslik={mevcut ? "Yazı düzenle" : "Yeni yazı"} ikon={Newspaper} renk="var(--ad-aksan)" onKapat={onKapat}
      altlik={<>
        <Dugme tur="glass" className="flex-1" disabled={!gecerli} onClick={() => gecerli && onKaydet(payload("taslak"))}>Taslak kaydet</Dugme>
        <Dugme className="flex-1" ikon={Check} disabled={!gecerli} onClick={() => gecerli && onKaydet(payload("yayin"))}>Yayınla</Dugme>
      </>}>
      <div><label className={cn(etiket, AD.metin2)}>Başlık</label><input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Örn. AI Video Üretmenin 10 Yolu" className={alan} /></div>
      <div><label className={cn(etiket, AD.metin2)}>Slug</label><input value={etkinSlug} onChange={(e) => { setSlugDokun(true); setSlug(slugYap(e.target.value)); }} className={cn(alan, "font-mono text-[12px]")} /><p className={cn("mt-1 text-[11px]", AD.metin3)}>/blog/{etkinSlug || "…"}</p></div>
      <div><label className={cn(etiket, AD.metin2)}>Özet</label><textarea value={ozet} onChange={(e) => setOzet(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" /></div>
      <div><label className={cn(etiket, AD.metin2)}>İçerik (markdown)</label><textarea value={icerik} onChange={(e) => setIcerik(e.target.value)} rows={6} placeholder="# Başlık&#10;&#10;Metin…" className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 font-mono text-[12px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" /></div>
      <div className="flex items-center gap-6">
        <div><label className={cn(etiket, AD.metin2)}>Dil</label><div className="flex gap-2">{(["TR", "EN"] as const).map((d) => <button key={d} onClick={() => setDil(d)} className={cn("rounded-lg border px-3 py-1.5 text-[12px] font-semibold", dil === d ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>{d}</button>)}</div></div>
        <div><label className={cn(etiket, AD.metin2)}>Durum</label><Rozet ton={durum === "yayin" ? "basari" : "notr"}>{durum === "yayin" ? "yayın" : "taslak"}</Rozet></div>
      </div>
    </ModalKabuk>
  );
}

/* ── Duyuru editör ── */
function DuyuruModal({ onKapat, onKaydet }: { onKapat: () => void; onKaydet: (d: Omit<Duyuru, "id">) => void }) {
  const [baslik, setBaslik] = useState("");
  const [metin, setMetin] = useState("");
  const [segment, setSegment] = useState("Tüm kullanıcılar");
  const [tur, setTur] = useState<Duyuru["tur"]>("banner");
  const [aktif, setAktif] = useState(true);
  const [bas, setBas] = useState("");
  const [bit, setBit] = useState("");
  const gecerli = baslik.trim() && metin.trim();
  const TUR_RENK: Record<Duyuru["tur"], string> = { banner: "var(--ad-aksan)", changelog: "var(--ad-mor)", bakim: "var(--ad-uyari)" };

  return (
    <ModalKabuk baslik="Yeni duyuru" ikon={Megaphone} renk="var(--ad-aksan)" onKapat={onKapat}
      altlik={<Dugme className="flex-1" ikon={Check} disabled={!gecerli} onClick={() => gecerli && onKaydet({
        baslik: baslik.trim(), metin: metin.trim(), segment, tur, aktif,
        baslangic: bas ? new Date(bas).getTime() : Date.now(),
        bitis: bit ? new Date(bit).getTime() : Date.now() + 7 * 86400000,
      })}>Duyuru ekle</Dugme>}>
      <div><label className={cn(etiket, AD.metin2)}>Başlık</label><input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Örn. Yeni model yayında" className={alan} /></div>
      <div><label className={cn(etiket, AD.metin2)}>Metin</label><textarea value={metin} onChange={(e) => setMetin(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 text-sm text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={cn(etiket, AD.metin2)}>Segment</label><select value={segment} onChange={(e) => setSegment(e.target.value)} className={alanSelect}>{["Tüm kullanıcılar", "Aktif kullanıcılar", "Ücretsiz plan", "Ultra"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className={cn(etiket, AD.metin2)}>Tür</label><select value={tur} onChange={(e) => setTur(e.target.value as Duyuru["tur"])} className={alanSelect}><option value="banner">banner</option><option value="changelog">changelog</option><option value="bakim">bakım</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={cn(etiket, AD.metin2)}>Başlangıç</label><input type="datetime-local" value={bas} onChange={(e) => setBas(e.target.value)} className={cn(alan, "[color-scheme:dark]")} /></div>
        <div><label className={cn(etiket, AD.metin2)}>Bitiş</label><input type="datetime-local" value={bit} onChange={(e) => setBit(e.target.value)} className={cn(alan, "[color-scheme:dark]")} /></div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[color:var(--ad-metin-2)]"><input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} className="accent-[color:var(--ad-aksan)]" /> Yayında (aktif)</label>
      {/* Canlı banner önizleme */}
      <div>
        <span className={cn("mb-2 block text-[10px] font-bold uppercase tracking-wide", AD.metin3)}>Canlı önizleme</span>
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px]" style={{ borderColor: TUR_RENK[tur], background: `color-mix(in srgb, ${TUR_RENK[tur]} 12%, transparent)`, color: "var(--ad-metin)" }}>
          <Megaphone className="h-4 w-4 shrink-0" style={{ color: TUR_RENK[tur] }} />
          <span className="min-w-0 flex-1 truncate">{metin || baslik || "Duyuru metni burada görünür"}</span>
        </div>
      </div>
    </ModalKabuk>
  );
}

/* ── Yasal metin yeni versiyon ── */
function YasalModal({ metin, onKapat, onKaydet }: { metin: YasalMetin; onKapat: () => void; onKaydet: (icerik: string) => void }) {
  const [icerik, setIcerik] = useState(metin.icerik);
  const yeniV = versiyonArtir(metin.versiyon);
  return (
    <ModalKabuk baslik={metin.ad} ikon={Scale} renk="var(--ad-mor)" onKapat={onKapat}
      altlik={<Dugme className="flex-1" ikon={Check} disabled={!icerik.trim()} onClick={() => icerik.trim() && onKaydet(icerik.trim())}>{yeniV} olarak yayınla</Dugme>}>
      <div className="flex items-center gap-2 text-[13px]"><Rozet ton="notr">{metin.versiyon}</Rozet><span className={AD.metin3}>→</span><Rozet ton="mor">{yeniV}</Rozet></div>
      <div><label className={cn(etiket, AD.metin2)}>İçerik (markdown)</label><textarea value={icerik} onChange={(e) => setIcerik(e.target.value)} rows={8} className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 py-2 font-mono text-[12px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/50" /></div>
      <div className="rounded-xl border border-[color:var(--ad-uyari)]/40 bg-[color:var(--ad-uyari)]/8 p-3 text-[12px] text-[color:var(--ad-metin-2)]">
        <b className="text-[color:var(--ad-uyari)]">Yeni versiyonu kabul ettir:</b> Bu metni yayınladığınızda tüm aktif kullanıcılara bir sonraki girişte kabul ekranı gösterilir.
      </div>
    </ModalKabuk>
  );
}

export default function Icerik() {
  const oturum = useAdminOturum();
  const { onayIste } = useOnay();
  const st = useAdminIcerik();
  const evren = veri();
  const [sekme, setSekme] = useState("preset");

  const [presetModal, setPresetModal] = useState<{ mevcut: Preset | null } | null>(null);
  const [blogModal, setBlogModal] = useState<{ mevcut: Blog | null } | null>(null);
  const [duyuruModal, setDuyuruModal] = useState(false);
  const [yasalModal, setYasalModal] = useState<YasalMetin | null>(null);

  const show = useMemo(() => showcase(evren), [evren]);

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik" = "bilgi", hedef?: string) =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  const sil = async (baslik: string, onKabul: () => void, ad: string) => {
    const ok = await onayIste({ baslik: "Silmeyi onayla", aciklama: `"${baslik}" silinecek. Geri alınamaz.`, risk: 1, eylemEtiket: "Sil" });
    if (!ok) return;
    onKabul();
    denetle(ad, "uyari", baslik);
    toast.success("Silindi");
  };

  const sekmeler = [
    { id: "preset", ad: "Preset & Template", sayi: st.presetler.length },
    { id: "showcase", ad: "Showcase / Galeri", sayi: show.length },
    { id: "blog", ad: "Landing & Blog", sayi: st.bloglar.length },
    { id: "duyuru", ad: "Duyurular", sayi: st.duyurular.length },
    { id: "yasal", ad: "Yasal Metinler", sayi: st.yasalMetinler.length },
  ];

  return (
    <RotaGuard modul="icerik">
      <BolumBaslik baslik="İçerik / CMS" ozet="Preset, showcase, blog, duyuru ve yasal metin yönetimi" ikon={FileText} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Aktif preset" deger={sayi(st.presetler.filter((p) => p.aktif).length)} ikon={Sparkles} renk="basari" />
        <MetrikKart etiket="Showcase içerik" deger={sayi(show.filter((s) => s.secili).length)} ikon={Image} renk="mor" />
        <MetrikKart etiket="Yayında blog" deger={sayi(st.bloglar.filter((b) => b.durum === "yayin").length)} ikon={Newspaper} renk="aksan" />
        <MetrikKart etiket="Aktif duyuru" deger={sayi(st.duyurular.filter((d) => d.aktif).length)} ikon={Megaphone} />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Preset */}
      {sekme === "preset" && (
        <div>
          <div className="mb-3 flex justify-end"><Dugme boyut="sm" ikon={Plus} onClick={() => setPresetModal({ mevcut: null })}>Preset ekle</Dugme></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {st.presetler.map((p) => (
              <Kart key={p.id} className="!p-3">
                <div className="mb-2 aspect-video overflow-hidden rounded-lg" style={{ background: onizlemeArka(p.id, "moda") }} />
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-[14px] font-semibold", AD.metin)}>{p.ad}</h3>
                  <Rozet ton={p.aktif ? "basari" : "notr"}>{p.aktif ? "aktif" : "pasif"}</Rozet>
                </div>
                <div className={cn("mt-1 text-[11px]", AD.metin3)}>{p.kategori} · {p.model} · {p.tier}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={cn("text-[12px]", AD.metin3)}>{kisaSayi(p.kullanim)} kullanım</span>
                  <div className="flex gap-1">
                    <button onClick={() => setPresetModal({ mevcut: p })} className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:bg-white/5 hover:text-[color:var(--ad-metin)]"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => sil(p.ad, () => st.presetSil(p.id), "Preset silindi")} className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:bg-[color:var(--ad-tehlike)]/10 hover:text-[color:var(--ad-tehlike)]"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </Kart>
            ))}
          </div>
        </div>
      )}

      {/* Showcase */}
      {sekme === "showcase" && (
        <div>
          <p className={cn("mb-3 text-sm", AD.metin3)}>Kullanıcı çıktılarından öne çıkanları seç (izinle). Ana sayfa galerisinde görünür.</p>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {show.map((s) => (
              <ShowcaseKart key={s.id} s={s} denetle={denetle} />
            ))}
          </div>
        </div>
      )}

      {/* Blog */}
      {sekme === "blog" && (
        <div>
          <div className="mb-3 flex justify-end"><Dugme boyut="sm" ikon={Plus} onClick={() => setBlogModal({ mevcut: null })}>Yazı ekle</Dugme></div>
          <div className="space-y-2">
            {st.bloglar.map((b) => (
              <Kart key={b.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Newspaper className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{b.baslik}</div><div className={cn("truncate text-[11px]", AD.metin3)}>{b.dil} · /blog/{b.slug} · {tarihEtiket(b.tarih)}</div></div>
                  <Rozet ton={b.durum === "yayin" ? "basari" : "notr"}>{b.durum === "yayin" ? "yayın" : "taslak"}</Rozet>
                  {b.durum === "taslak" && <Dugme boyut="sm" tur="glass" onClick={() => { st.blogYayinla(b.id); denetle(`Blog yayınlandı: ${b.baslik}`, "bilgi", b.id); toast.success("Yayınlandı"); }}>Yayınla</Dugme>}
                  <button onClick={() => setBlogModal({ mevcut: b })} className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:bg-white/5 hover:text-[color:var(--ad-metin)]"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => sil(b.baslik, () => st.blogSil(b.id), "Blog silindi")} className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:bg-[color:var(--ad-tehlike)]/10 hover:text-[color:var(--ad-tehlike)]"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Kart>
            ))}
          </div>
        </div>
      )}

      {/* Duyurular */}
      {sekme === "duyuru" && (
        <div>
          <div className="mb-3 flex justify-end"><Dugme boyut="sm" ikon={Plus} onClick={() => setDuyuruModal(true)}>Duyuru ekle</Dugme></div>
          <div className="space-y-2">
            {st.duyurular.map((d) => (
              <Kart key={d.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: d.tur === "bakim" ? "rgba(251,191,36,0.12)" : "rgba(85,214,253,0.12)", color: d.tur === "bakim" ? "var(--ad-uyari)" : "var(--ad-aksan)" }}><Megaphone className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{d.baslik}</div><div className={cn("truncate text-[11px]", AD.metin3)}>{d.segment} · {tarihEtiket(d.baslangic)} – {tarihEtiket(d.bitis)}</div></div>
                  <Rozet ton={d.tur === "banner" ? "aksan" : d.tur === "changelog" ? "mor" : "uyari"}>{d.tur === "bakim" ? "bakım" : d.tur}</Rozet>
                  <button onClick={() => { st.duyuruToggle(d.id); denetle(`Duyuru ${d.aktif ? "kapatıldı" : "aktifleştirildi"}: ${d.baslik}`, "bilgi", d.id); toast.success(d.aktif ? "Kapatıldı" : "Aktifleştirildi"); }} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", d.aktif ? "bg-emerald-500" : "bg-white/15")}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", d.aktif ? "left-[22px]" : "left-0.5")} /></button>
                  <button onClick={() => sil(d.baslik, () => st.duyuruSil(d.id), "Duyuru silindi")} className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:bg-[color:var(--ad-tehlike)]/10 hover:text-[color:var(--ad-tehlike)]"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Kart>
            ))}
          </div>
        </div>
      )}

      {/* Yasal */}
      {sekme === "yasal" && (
        <div className="space-y-2">
          {st.yasalMetinler.map((y) => (
            <Kart key={y.id} className="!p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/12 text-violet-400"><Scale className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className={cn("text-[13px] font-medium", AD.metin)}>{y.ad}</div><div className={cn("text-[11px]", AD.metin3)}>{y.versiyon} · {tarihEtiket(y.tarih)}</div></div>
                <Rozet ton="basari">yayında</Rozet>
                <Dugme boyut="sm" tur="glass" onClick={() => setYasalModal(y)}>Yeni versiyon</Dugme>
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* Modaller */}
      <AnimatePresence>
        {presetModal && (
          <PresetModal mevcut={presetModal.mevcut} onKapat={() => setPresetModal(null)}
            onKaydet={(p) => {
              if (presetModal.mevcut) { st.presetGuncelle(presetModal.mevcut.id, p); denetle(`Preset güncellendi: ${p.ad}`, "bilgi", presetModal.mevcut.id); toast.success("Preset güncellendi"); }
              else { st.presetEkle(p); denetle(`Preset eklendi: ${p.ad}`, "bilgi"); toast.success("Preset eklendi"); }
              setPresetModal(null);
            }} />
        )}
        {blogModal && (
          <BlogModal mevcut={blogModal.mevcut} onKapat={() => setBlogModal(null)}
            onKaydet={(b) => {
              if (blogModal.mevcut) { st.blogGuncelle(blogModal.mevcut.id, b); denetle(`Blog güncellendi: ${b.baslik}`, "bilgi", blogModal.mevcut.id); toast.success(b.durum === "yayin" ? "Güncellendi & yayınlandı" : "Taslak kaydedildi"); }
              else { st.blogEkle(b); denetle(`Blog eklendi: ${b.baslik}`, "bilgi"); toast.success(b.durum === "yayin" ? "Yayınlandı" : "Taslak kaydedildi"); }
              setBlogModal(null);
            }} />
        )}
        {duyuruModal && (
          <DuyuruModal onKapat={() => setDuyuruModal(false)}
            onKaydet={(d) => { st.duyuruEkle(d); denetle(`Duyuru eklendi: ${d.baslik}`, "bilgi"); toast.success("Duyuru eklendi"); setDuyuruModal(false); }} />
        )}
        {yasalModal && (
          <YasalModal metin={yasalModal} onKapat={() => setYasalModal(null)}
            onKaydet={(icerik) => { st.yasalYeniVersiyon(yasalModal.id, icerik); denetle(`Yasal metin yeni versiyon: ${yasalModal.ad} ${versiyonArtir(yasalModal.versiyon)}`, "kritik", yasalModal.id); toast.success(`${versiyonArtir(yasalModal.versiyon)} yayınlandı — kabul akışı başladı`); setYasalModal(null); }} />
        )}
      </AnimatePresence>
    </RotaGuard>
  );
}

/* Showcase kartı — seç/kaldır yerel toggle (seed tabanı, kullanıcı görsel geri bildirim). */
function ShowcaseKart({ s, denetle }: { s: { id: string; kullanici: string; etkilesim: number; secili: boolean }; denetle: (e: string) => void }) {
  const [secili, setSecili] = useState(s.secili);
  return (
    <Kart className="!p-2">
      <div className="relative mb-2 aspect-square overflow-hidden rounded-lg" style={{ background: onizlemeArka(s.id, "sinematik") }}>
        {secili && <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" /></div>}
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="min-w-0"><div className={cn("truncate text-[12px]", AD.metin2)}>{s.kullanici}</div><div className={cn("text-[10px]", AD.metin3)}>{kisaSayi(s.etkilesim)} etkileşim</div></div>
        <button onClick={() => { setSecili((v) => !v); denetle(secili ? "Galeriden çıkarıldı" : "Galeriye eklendi"); toast.success(secili ? "Galeriden çıkarıldı" : "Galeriye eklendi"); }} className={cn("flex h-7 w-7 items-center justify-center rounded-lg", secili ? "text-emerald-400" : "text-[color:var(--ad-metin-3)]")}>{secili ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
      </div>
    </Kart>
  );
}
