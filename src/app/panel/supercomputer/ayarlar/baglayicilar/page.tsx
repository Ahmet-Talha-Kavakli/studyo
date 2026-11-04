"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Plug, Search, Plus, X, AlertTriangle, Loader2, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { BAGLAYICI_BOLUMLERI, type Baglayici, type BaglayiciBolum } from "@/lib/scBaglayici";
import { baglanVeBildir, bagliHesaplar, baglantiKaldir } from "@/lib/pipedream/istemci";
import { useAuth } from "@/store/useAuth";
import { AyarBolum, BosDurum, AyarButon, Anahtar } from "@/components/kabuk/sc/SCAyarParcalari";
import { mcpUrlGecerli, useScMcp } from "@/lib/scMcp";
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

  // Özel MCP sunucuları (useScMcp): sohbette Claude'a gerçek MCP sunucusu olarak verilir.
  const mcpler = useScMcp((x) => x.sunucular);
  const { ekle: mcpEkle, guncelle: mcpGuncelle, sil: mcpSil } = useScMcp.getState();

  const q = ara.trim().toLocaleLowerCase("tr");
  const bolumler = useMemo(() => {
    return [...BAGLAYICI_BOLUMLERI]
      .map((b) => ({
        ...b,
        baglayicilar: b.baglayicilar.filter((x) =>
          !q || `${x.ad} ${x.kisa}`.toLocaleLowerCase("tr").includes(q)),
      }))
      .filter((b) => b.baglayicilar.length > 0);
  }, [q]);

  const bagliSayi = bagli.size;
  const toplam = BAGLAYICI_BOLUMLERI.reduce((a, b) => a + b.baglayicilar.length, 0);

  const ozelMcpEkle = (ad: string, url: string, token: string) => {
    if (!mcpUrlGecerli(url)) { toast.error("Sunucu adresi geçersiz", { description: "MCP sunucusu için https:// ile başlayan tam bir adres gir." }); return; }
    if (mcpler.some((x) => x.url === url.trim())) { toast.error("Bu sunucu zaten ekli", { description: "Aynı adres ikinci kez eklenemez. Listedeki sunucuyu kullanabilirsin." }); return; }
    mcpEkle({ ad: ad.trim(), url: url.trim(), ...(token.trim() ? { token: token.trim() } : {}) });
    setMcpAcik(false);
    toast.success(`${ad.trim()} eklendi`, { description: "Sohbette kullanım açık; model gerektiğinde araçlarını çağırır." });
  };

  /** "Bağlan" → GERÇEK Pipedream Connect OAuth penceresi açar. */
  const baglan = async (b: Baglayici) => {
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
      // Bağlantı servisi kurulmamış: bağlıymış gibi göstermek yanıltıcı olurdu.
      toast.error("Uygulama bağlantıları henüz etkin değil", { description: "Sunucuya Pipedream Connect anahtarları eklenince bağlanabilirsin. Özel MCP sunucuları şimdiden çalışır." });
    }
  };

  /** Bir bağlantıyı kaldır (gerçek Pipedream hesabını siler). */
  const baglantiyiKaldir = async (b: Baglayici) => {
    const hid = hesapEsleme[b.id];
    if (hid) { const ok = await baglantiKaldir(hid); if (!ok) { toast.error("Bağlantı kaldırılamadı", { description: `${b.ad} hesabına şu an ulaşılamıyor. Biraz sonra yeniden dene.` }); return; } }
    setBagli((v) => { const y = new Set(v); y.delete(b.id); return y; });
    setHesapEsleme((v) => { const y = { ...v }; delete y[b.id]; return y; });
    toast.success(`${b.ad} bağlantısı kaldırıldı`);
  };

  return (
    <div className="space-y-8">
      <AyarBolum
        baslik="Özel MCP sunucuları"
        ozet="Uzak bir MCP sunucusu ekle; 'Sohbette kullan' açıkken Usta gerektiğinde onun araçlarını çağırır ve sohbette hangi aracı kullandığını gösterir."
        sagUst={<AyarButon onClick={() => setMcpAcik(true)}><Plus className="h-4 w-4" strokeWidth={2.2} />Sunucu ekle</AyarButon>}
      >
        {mcpler.length === 0 ? (
          <BosDurum ikon={Plug} baslik="Henüz MCP sunucusu yok" ozet="Notion, Linear, GitHub gibi servislerin ya da kendi sunucunun MCP adresini ve erişim anahtarını ekle." />
        ) : mcpler.map((m) => (
          <div key={m.id} className="flex items-center gap-3 border-b border-[var(--sc-kenar)] px-4 py-3.5 last:border-b-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--sc-aksan)]/12 text-[var(--sc-aksan)]"><Plug className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[14px] font-medium text-[var(--sc-metin)]"><span className="truncate">{m.ad}</span>{m.token && <span className="shrink-0 rounded bg-white/[0.06] px-1.5 text-[11px] text-[var(--sc-metin-3)]">anahtarlı</span>}</p>
              <p className="mt-0.5 truncate text-[12.5px] text-[var(--sc-metin-3)]">{m.url}</p>
            </div>
            <span className="hidden text-[12.5px] text-[var(--sc-metin-3)] sm:block">Sohbette kullan</span>
            <Anahtar acik={m.acik} onDegis={(v) => mcpGuncelle(m.id, { acik: v })} etiket={`${m.ad} sohbette kullanılsın`} />
            <button onClick={() => { mcpSil(m.id); toast.success(`${m.ad} kaldırıldı`); }} aria-label={`${m.ad} kaldır`} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] hover:bg-rose-500/10 hover:text-rose-300"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </AyarBolum>

      <AyarBolum
        baslik="Uygulama bağlantıları"
        ozet="Hesaplarını bağla; bağlantılar Vayra hesabına kaydedilir. Sohbette araç olarak kullanım şimdilik özel MCP sunucularıyla çalışır."
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
              <p className="border-b border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-4 py-2 text-[12.5px] font-medium text-[var(--sc-metin-3)]">
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

/* ── Özel MCP — sağdan açılan panel ── */
function OzelMcpForm({ onKapat, onEkle }: { onKapat: () => void; onEkle: (ad: string, url: string, token: string) => void }) {
  const [ad, setAd] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [kimlik, setKimlik] = useState<"yok" | "anahtar">("yok");
  const [portalHazir, setPortalHazir] = useState(false);
  useEffect(() => setPortalHazir(true), []);
  useEffect(() => {
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = eski; window.removeEventListener("keydown", esc); };
  }, [onKapat]);

  const urlDogru = mcpUrlGecerli(url);
  const eksik = !ad.trim() ? "Bir ad yaz" : !url.trim() ? "Sunucu adresini yaz" : !urlDogru ? "Adres https:// ile başlamalı" : kimlik === "anahtar" && !token.trim() ? "Erişim anahtarını yaz" : null;
  const ekle = () => { if (!eksik) onEkle(ad.trim(), url.trim(), kimlik === "anahtar" ? token.trim() : ""); };
  const KART = "overflow-hidden rounded-[18px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
  const SERIT = "flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5";
  const GIRDI = "h-10 w-full rounded-[12px] bg-black/25 px-3.5 text-[14px] text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/[0.08] transition placeholder:text-[var(--sc-metin-3)] focus:ring-white/30";
  const ETIKET = "mb-1.5 block text-[12.5px] font-medium text-[var(--sc-metin-2)]";
  let alanAdi = ""; try { alanAdi = urlDogru ? new URL(url.trim()).host : ""; } catch { /* yok */ }

  if (!portalHazir) return null;
  return createPortal(
    <div className="sc-kapsam fixed inset-0 z-[160]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onKapat} className="absolute inset-0 bg-black/55" />
      <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
        role="dialog" aria-modal="true" aria-labelledby="mcp-modal-baslik"
        className="absolute inset-y-0 right-0 flex w-[min(520px,100vw)] flex-col border-l border-white/[0.08] bg-[var(--sc-kart)]">
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] text-[var(--sc-metin-3)]">Bağlayıcılar</p>
            <h2 id="mcp-modal-baslik" className="truncate text-[17px] font-semibold tracking-[-0.01em]">Özel MCP bağlayıcısı</h2>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--sc-metin-2)] transition hover:bg-white/[0.085] hover:text-[var(--sc-metin)]"><X className="h-4 w-4" /></button>
        </header>

        <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); ekle(); }} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5 [scrollbar-width:thin]">
          {/* Önizleme: listede böyle görünür */}
          <div className={cn(KART, "p-3.5")}>
            <p className="mb-2.5 text-[12px] font-medium text-[var(--sc-metin-3)]">Bağlayıcılar listesinde böyle görünür</p>
            <div className="flex items-center gap-3 rounded-[14px] bg-black/25 p-2.5 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[#0b0b0c]">{ad.trim() ? ad.trim()[0].toLocaleUpperCase("tr") : <Plug className="h-[18px] w-[18px]" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{ad.trim() || "Bağlayıcı adı"}</span>
                <span className="block truncate text-[12.5px] text-[var(--sc-metin-3)]">{alanAdi || "Özel MCP sunucusu"}</span>
              </span>
              <span className="rounded-full bg-white/[0.085] px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--sc-metin-2)]">{kimlik === "anahtar" ? "Anahtarlı" : "Açık"}</span>
            </div>
          </div>

          <section className={KART}>
            <div className={SERIT}><span className="text-[13.5px] font-semibold">Sunucu</span><span className="text-[12px] text-[var(--sc-metin-3)]">Uzak MCP, HTTP üzerinden</span></div>
            <div className="space-y-3.5 p-4">
              <label className="block"><span className={ETIKET}>Ad</span>
                <input name="mcp-baglayici-adi" autoComplete="off" autoFocus value={ad} onChange={(e) => setAd(e.target.value.slice(0, 40))} placeholder="Ör. Notion" className={GIRDI} />
              </label>
              <label className="block"><span className={ETIKET}>Sunucu adresi</span>
                <span className="relative block">
                  <input name="mcp-sunucu-adresi" type="url" inputMode="url" autoComplete="off" spellCheck={false} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mcp.ornek.com/mcp" className={cn(GIRDI, "pr-10")} />
                  {url.trim() && <span className={cn("absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full", urlDogru ? "bg-white text-[#0b0b0c]" : "bg-amber-300/15 text-amber-200")}>{urlDogru ? <Check className="h-3 w-3" strokeWidth={3} /> : <AlertTriangle className="h-3 w-3" />}</span>}
                </span>
              </label>
            </div>
          </section>

          <section className={KART}>
            <div className={SERIT}><span className="text-[13.5px] font-semibold">Kimlik doğrulama</span></div>
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-1 rounded-full bg-black/25 p-1 ring-1 ring-inset ring-white/[0.07]">
                {([["yok", "Gerekmiyor"], ["anahtar", "Erişim anahtarı"]] as const).map(([k, a]) => (
                  <button type="button" key={k} onClick={() => setKimlik(k)} aria-pressed={kimlik === k} className={cn("relative h-8 rounded-full text-[13px] font-semibold transition-colors", kimlik === k ? "text-[#0b0b0c]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                    {kimlik === k && <motion.span layoutId="mcp-kimlik" transition={{ type: "spring", stiffness: 480, damping: 38 }} className="absolute inset-0 rounded-full bg-white" />}
                    <span className="relative">{a}</span>
                  </button>
                ))}
              </div>
              {kimlik === "anahtar" && (
                <motion.label initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="block"><span className={ETIKET}>Bearer anahtarı</span>
                  <input name="mcp-erisim-anahtari" type="password" autoComplete="new-password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="sk_..." className={GIRDI} />
                </motion.label>
              )}
              <p className="text-[12.5px] leading-snug text-[var(--sc-metin-3)]">{kimlik === "anahtar" ? "Anahtar bu tarayıcıda saklanır; yalnız sohbet isteğinde sunucuya iletilir." : "Herkese açık ya da kendi ağındaki sunucular için."}</p>
            </div>
          </section>

          <section className={KART}>
            <div className={SERIT}><span className="text-[13.5px] font-semibold">Nasıl çalışır</span></div>
            <ol className="divide-y divide-white/[0.06]">
              {["Bağlayıcı eklenince açık olarak listelenir; istersen anahtarıyla kapatırsın.", "Açıkken her sohbet isteğinde sunucunun araçları Usta'ya verilir.", "Usta gerektiğinde bu araçları çağırır, sonucu yanıtında kullanır."].map((t, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3 text-[13px] leading-snug text-[var(--sc-metin-2)]"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-[11.5px] font-bold text-[var(--sc-metin)]">{i + 1}</span>{t}</li>
              ))}
            </ol>
          </section>

          <div className="flex items-start gap-2.5 rounded-[16px] bg-amber-300/[0.07] p-3.5 ring-1 ring-inset ring-amber-300/15">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-amber-200" />
            <p className="text-[12.5px] leading-snug text-amber-100/85">Yalnız güvendiğin sunucuları ekle; sunucu sohbette paylaştığın verilere erişebilir.</p>
          </div>
          <button type="submit" hidden />
        </form>

        <footer className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))]">
          {eksik && (url.trim() || ad.trim()) && <span className="rounded-full bg-white/[0.065] px-2.5 py-1 text-[12px] text-[var(--sc-metin-3)]">{eksik}</span>}
          <span className="flex-1" />
          <button onClick={onKapat} className="h-10 rounded-full px-4 text-[14px] font-medium text-[var(--sc-metin-2)] transition hover:bg-white/[0.065] hover:text-[var(--sc-metin)]">Vazgeç</button>
          <motion.button whileTap={{ scale: 0.97 }} disabled={!!eksik} onClick={ekle} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0b0b0c] transition hover:bg-white/90 disabled:opacity-40"><Plus className="h-4 w-4" />Bağlayıcıyı ekle</motion.button>
        </footer>
      </motion.aside>
    </div>,
    document.body,
  );
}
