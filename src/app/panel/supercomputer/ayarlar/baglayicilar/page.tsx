"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Plug, Search, Plus, X, AlertTriangle, Loader2, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { BAGLAYICI_BOLUMLERI, type Baglayici, type BaglayiciBolum } from "@/lib/scBaglayici";
import { baglanVeBildir, bagliHesaplar, baglantiKaldir } from "@/lib/pipedream/istemci";
import { useAuth } from "@/store/useAuth";
import { AyarBolum, BosDurum, AyarButon } from "@/components/kabuk/sc/SCAyarParcalari";
import { cn } from "@/lib/utils";

/* ============================================================
   AYARLAR › BAĞLAYICILAR — Claude'un ayar dili.

   Higgsfield sunumu kaldırıldı: ALL-CAPS hero ("UYGULAMALARINI …BAĞLA"),
   animasyonlu huni görseli, "Keşfet / Bağlayıcılarım" segment barı ve marka
   renkli kart ızgarası.

   Claude karşılığı: kategoriye göre gruplanmış liste; her satır — marka logosu ·
   ad · özet · sağda Bağlan/Bağlantıyı kes.

   ÖNEMLİ: Bağlantı mantığı GERÇEK ve BİREBİR korunuyor —
   Pipedream Connect OAuth (baglanVeBildir), bağlı hesapların sunucudan
   yüklenmesi (bagliHesaplar), hesap eşlemesiyle gerçek kaldırma
   (baglantiKaldir) ve localStorage'da kalıcı ÖZEL MCP bağlayıcıları.
   ============================================================ */

export default function BaglayicilarAyar() {
  const [ara, setAra] = useState("");
  const [bagli, setBagli] = useState<Set<string>>(new Set());
  const [bekleyen, setBekleyen] = useState<Set<string>>(new Set());
  const [mcpAcik, setMcpAcik] = useState(false);
  // Pipedream hesap eşlemesi: appSlug → hesapId (kaldırma için)
  const [hesapEsleme, setHesapEsleme] = useState<Record<string, string>>({});
  const kullanici = useAuth((s) => s.kullanici);
  const kullaniciId = kullanici?.email || "misafir";

  // Gerçek bağlı hesapları Pipedream'den yükle → liste gerçek durumu gösterir.
  useEffect(() => {
    let iptal = false;
    bagliHesaplar(kullaniciId).then(({ hesaplar }) => {
      if (iptal || !hesaplar.length) return;
      const yeniBagli = new Set<string>();
      const esleme: Record<string, string> = {};
      for (const h of hesaplar) { if (h.app) { yeniBagli.add(h.app); esleme[h.app] = h.id; } }
      setBagli((v) => new Set([...v, ...yeniBagli]));
      setHesapEsleme((v) => ({ ...v, ...esleme }));
    });
    return () => { iptal = true; };
  }, [kullaniciId]);

  // Kullanıcının eklediği ÖZEL MCP bağlayıcıları (localStorage'da kalıcı).
  const [ozeller, setOzeller] = useState<Baglayici[]>([]);
  useEffect(() => {
    try {
      const ham = localStorage.getItem("vayra-ozel-mcp");
      if (!ham) return;
      const liste = JSON.parse(ham) as Baglayici[];
      if (Array.isArray(liste) && liste.length) {
        setOzeller(liste);
        setBagli((v) => { const y = new Set(v); liste.forEach((x) => y.add(x.id)); return y; });
      }
    } catch { /* bozuk kayıt → yoksay */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem("vayra-ozel-mcp", JSON.stringify(ozeller)); } catch { /* kota → yoksay */ }
  }, [ozeller]);

  const q = ara.trim().toLocaleLowerCase("tr");
  const bolumler = useMemo(() => {
    const ozelBolum: BaglayiciBolum[] = ozeller.length
      ? [{
          ad: "Özel MCP",
          baglayicilar: ozeller.filter((x) => !q || `${x.ad} ${x.kisa}`.toLocaleLowerCase("tr").includes(q)),
        }]
      : [];
    return [...ozelBolum, ...BAGLAYICI_BOLUMLERI]
      .map((b) => ({
        ...b,
        baglayicilar: b.baglayicilar.filter((x) =>
          !q || `${x.ad} ${x.kisa}`.toLocaleLowerCase("tr").includes(q)),
      }))
      .filter((b) => b.baglayicilar.length > 0);
  }, [q, ozeller]);

  const bagliSayi = bagli.size;
  const toplam = BAGLAYICI_BOLUMLERI.reduce((a, b) => a + b.baglayicilar.length, 0) + ozeller.length;

  /**
   * GERÇEK "Ekle": Özel MCP formundaki ad+URL'den bağlayıcı kaydı üretir,
   * listeye yazar ve BAĞLI olarak işaretler. Kalıcılık: localStorage.
   */
  const ozelMcpEkle = (ad: string, url: string) => {
    const temizAd = ad.trim();
    const id = "ozel-" + temizAd.toLocaleLowerCase("tr").replace(/[^a-z0-9]+/g, "-");
    if (ozeller.some((x) => x.id === id)) { toast.error("Bu adda bir özel bağlayıcı zaten var"); return; }
    const yeni: Baglayici = {
      id, ad: temizAd, renk: "#55d6fd",
      kisa: url.trim(),
      tam: `${temizAd} özel MCP sunucusu — ${url.trim()}`,
      yetenekler: ["Uzak MCP araçlarını çağır", "Supercomputer çalışanlarına bağla"],
      ozet: "Özel MCP sunucusu",
    };
    setOzeller((v) => [yeni, ...v]);
    setBagli((v) => new Set(v).add(id));
    setMcpAcik(false);
    toast.success(`${temizAd} bağlayıcısı eklendi`);
  };

  /** "Bağlan" → GERÇEK Pipedream Connect OAuth penceresi açar. */
  const baglan = async (b: Baglayici) => {
    // Özel MCP bağlayıcıları Pipedream'e gitmez, doğrudan bağlı say.
    if (b.id.startsWith("ozel-")) { setBagli((v) => new Set(v).add(b.id)); return; }
    setBekleyen((v) => new Set(v).add(b.id));
    const sonuc = await baglanVeBildir(b.id, b.ad, kullaniciId);
    setBekleyen((v) => { const y = new Set(v); y.delete(b.id); return y; });
    if (sonuc.basarili) {
      setBagli((v) => new Set(v).add(b.id));
      if (sonuc.hesapId) setHesapEsleme((v) => ({ ...v, [b.id]: sonuc.hesapId! }));
      // Popup kapandıysa hesapId gelmemiş olabilir → gerçek listeyi çekip doğrula.
      else {
        const { hesaplar } = await bagliHesaplar(kullaniciId);
        const eslesen = hesaplar.find((h: { app?: string; id: string }) => h.app === b.id);
        if (eslesen) setHesapEsleme((v) => ({ ...v, [b.id]: eslesen.id }));
      }
    } else if (sonuc.yapilandirilmadi) {
      // Pipedream henüz aktif değil → demo modda bağlanmış say.
      setBagli((v) => new Set(v).add(b.id));
    }
  };

  /** Bir bağlantıyı kaldır (gerçek Pipedream hesabını siler). */
  const baglantiyiKaldir = async (b: Baglayici) => {
    const hid = hesapEsleme[b.id];
    if (hid) { const ok = await baglantiKaldir(hid); if (!ok) { toast.error("Bağlantı kaldırılamadı"); return; } }
    setBagli((v) => { const y = new Set(v); y.delete(b.id); return y; });
    setHesapEsleme((v) => { const y = { ...v }; delete y[b.id]; return y; });
    // Özel bağlayıcı ise listeden de düşür (aksi halde "bağlan" ile geri gelmez).
    if (b.id.startsWith("ozel-")) setOzeller((v) => v.filter((x) => x.id !== b.id));
    toast.success(`${b.ad} bağlantısı kaldırıldı`);
  };

  return (
    <div className="space-y-6">
      <AyarBolum
        baslik="Bağlayıcılar"
        ozet="Supercomputer'ı kullandığın uygulamalara bağla; bağlı uygulamaların araçlarını sohbette çağırabilir."
        sagUst={
          <AyarButon ikincil onClick={() => setMcpAcik(true)}>
            <Plus className="h-4 w-4" strokeWidth={2.2} /> Özel MCP
          </AyarButon>
        }
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--sc-kenar)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" strokeWidth={1.9} />
          <input
            value={ara}
            onChange={(e) => setAra(e.target.value)}
            placeholder="Uygulama ara"
            className="w-full bg-transparent text-[14px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]"
          />
          <span className="shrink-0 text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">
            {bagliSayi}/{toplam} bağlı
          </span>
        </div>

        {bolumler.length === 0 ? (
          <BosDurum ikon={Search} baslik="Eşleşen uygulama yok" ozet={`"${ara}" ile eşleşen bir bağlayıcı bulunamadı.`} />
        ) : (
          bolumler.map((bol) => (
            <div key={bol.ad}>
              <p className="border-b border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-4 py-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--sc-metin-3)]">
                {bol.ad}
              </p>
              <ul>
                {bol.baglayicilar.map((b) => {
                  const bu = bagli.has(b.id);
                  const bekle = bekleyen.has(b.id);
                  return (
                    <li key={b.id}
                      className="flex items-center gap-3 border-b border-[var(--sc-kenar)] px-4 py-3.5">
                      <MarkaKare b={b} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5">
                          <span className="truncate text-[14px] font-medium text-[var(--sc-metin)]">{b.ad}</span>
                          {bu && (
                            <span className="flex shrink-0 items-center gap-1 rounded bg-[var(--sc-rozet)] px-1.5 py-px text-[11px] font-medium text-[var(--sc-rozet-metin)]">
                              <Check className="h-3 w-3" strokeWidth={2.6} /> Bağlı
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-[var(--sc-metin-3)]">{b.kisa}</p>
                      </div>
                      {bu ? (
                        <AyarButon ikincil onClick={() => baglantiyiKaldir(b)}>Bağlantıyı kes</AyarButon>
                      ) : (
                        <AyarButon disabled={bekle} onClick={() => baglan(b)}>
                          {bekle ? (<><Loader2 className="h-4 w-4 animate-spin" /> Bağlanıyor</>) : "Bağlan"}
                        </AyarButon>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </AyarBolum>

      {mcpAcik && <OzelMcpForm onKapat={() => setMcpAcik(false)} onEkle={ozelMcpEkle} />}
    </div>
  );
}

/* ── Marka karesi — çok-renkli resmi logo varsa o, yoksa tek-renk maske ── */
function MarkaKare({ b }: { b: Baglayici }) {
  if (b.logoRenkli) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--sc-kenar)] bg-white/[0.92]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.logoRenkli} alt="" aria-hidden className="h-[21px] w-[21px] object-contain" />
      </span>
    );
  }
  if (b.logo) {
    /* Tek-renk logo: marka rengiyle maskelenir; zemin marka renginin koyu
       yüzeyle karışımı (koyu temada logo kendi renginde okunur). */
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--sc-kenar)]"
        style={{ background: `color-mix(in srgb, ${b.renk} 20%, var(--sc-cip))` }}>
        <span aria-hidden className="h-[19px] w-[19px]"
          style={{
            background: b.renk,
            WebkitMaskImage: `url(${b.logo})`, maskImage: `url(${b.logo})`,
            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
            WebkitMaskPosition: "center", maskPosition: "center",
            WebkitMaskSize: "contain", maskSize: "contain",
          }} />
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sc-cip)] text-[var(--sc-metin-3)]">
      <Plug className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </span>
  );
}

/* ── Özel MCP — ekranın ORTASINDA modal (önce satır içi formdu) ── */
function OzelMcpForm({ onKapat, onEkle }: { onKapat: () => void; onEkle: (ad: string, url: string) => void }) {
  const [ad, setAd] = useState("");
  const [url, setUrl] = useState("");
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);

  /* ESC ile kapat + arka sayfa kaydırmasını kilitle. */
  useEffect(() => {
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = eski; window.removeEventListener("keydown", esc); };
  }, [onKapat]);

  const gecerli = ad.trim().length > 0 && url.trim().length > 0;
  const alan = "h-10 w-full rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-3 text-[14px] text-[var(--sc-metin)] outline-none transition-colors placeholder:text-[var(--sc-metin-3)] focus:border-[var(--sc-aksan)]";

  if (!portalHazir) return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={onKapat}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        role="dialog" aria-modal="true" aria-labelledby="mcp-modal-baslik"
        className="sc-kapsam relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-[var(--sc-kenar)] bg-[var(--sc-kart)] shadow-[0_28px_70px_-20px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--sc-kenar)] px-5 py-4">
          <div className="min-w-0">
            <h2 id="mcp-modal-baslik" className="text-[15px] font-semibold text-[var(--sc-metin)]">
              Özel MCP bağlayıcısı ekle
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--sc-metin-3)]">
              Supercomputer&apos;ı kendi verine ve araçlarına bağla.
            </p>
          </div>
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-start gap-2.5 rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] p-3">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-[var(--sc-promo)]" strokeWidth={2} />
            <p className="text-[13px] leading-relaxed text-[var(--sc-metin-3)]">
              Özel MCP sunucusu eklerken yalnızca güvendiğin kaynakları kullan; sunucu
              paylaştığın verilere erişebilir.
            </p>
          </div>
          <div>
            <label htmlFor="mcp-ad" className="mb-1.5 block text-[13.5px] text-[var(--sc-metin-2)]">
              Ad <span className="text-[var(--sc-promo)]">*</span>
            </label>
            <input id="mcp-ad" autoFocus value={ad} onChange={(e) => setAd(e.target.value)}
              placeholder="Vayra" className={alan} />
          </div>
          <div>
            <label htmlFor="mcp-url" className="mb-1.5 block text-[13.5px] text-[var(--sc-metin-2)]">
              Uzak MCP sunucu URL&apos;si <span className="text-[var(--sc-promo)]">*</span>
            </label>
            <input id="mcp-url" value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && gecerli) onEkle(ad, url); }}
              placeholder="https://mcp.vayra.ai/mcp" className={alan} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--sc-kenar)] px-5 py-3.5">
          <AyarButon ikincil onClick={onKapat}>İptal</AyarButon>
          <AyarButon disabled={!gecerli} onClick={() => onEkle(ad, url)}>Ekle</AyarButon>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
