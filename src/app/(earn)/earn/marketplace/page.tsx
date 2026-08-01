"use client";

import { useState, useMemo } from "react";
import { ShoppingBag, Plus, Trash2, TrendingUp, Sparkles, X, Repeat, Info, Power, ChevronDown } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { useEarn, tl, ureticiPay, MARKETPLACE_KOMISYON } from "@/store/useEarn";
import { SayfaBaslik, Kart, MetrikKart, DurumRozet, YesilDugme, GlassIkon, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

/* Marketplace — SADECE preset satışı, kullanım-başı gelir.
   Kullanan öder → Vayra %50 komisyon + model maliyeti düşülür → kalan üreticiye. */

const GORSEL_MODELLER = MODELLER.filter((m) => m.tur === "gorsel");
const KATEGORILER = ["Portre", "Sahne", "Ürün", "Sanat", "Manzara", "Diğer"];

export default function Marketplace() {
  const s = useEarn();
  const [modal, setModal] = useState(false);
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [modelId, setModelId] = useState(GORSEL_MODELLER[0]?.id ?? "");
  const [fiyat, setFiyat] = useState("");
  const [kategori, setKategori] = useState(KATEGORILER[0]);

  const model = GORSEL_MODELLER.find((m) => m.id === modelId);
  const fiyatSayi = parseInt(fiyat.replace(/\D/g, "")) || 0;
  const komisyon = Math.round(fiyatSayi * MARKETPLACE_KOMISYON);
  const maliyet = model?.kredi ?? 0;
  const pay = ureticiPay(fiyatSayi, maliyet);
  const gecerli = ad.trim() && fiyatSayi > 0 && pay > 0;

  const ekle = () => {
    if (!ad.trim()) { toast.error("Preset adı gir."); return; }
    if (fiyatSayi <= 0) { toast.error("Satış fiyatı gir."); return; }
    if (pay <= 0) { toast.error(`Fiyat çok düşük — komisyon (${komisyon}) + maliyet (${maliyet}) toplamından yüksek olmalı.`); return; }
    s.presetEkle({ ad: ad.trim(), aciklama: aciklama.trim(), modelId, modelAd: model?.ad ?? "", modelMaliyet: maliyet, satisFiyati: fiyatSayi, kategori });
    toast.success("Preset yayına gönderildi — onay sonrası satışa açılır.");
    setModal(false); setAd(""); setAciklama(""); setFiyat("");
  };

  const toplamKazanc = s.presetler.reduce((a, p) => a + p.kazanc, 0);
  const toplamKullanim = s.presetler.reduce((a, p) => a + p.kullanim, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Preset Pazarı" ozet="Ürettiğin presetleri sat. Biri her kullandığında kazanırsın."
        sag={<YesilDugme onClick={() => setModal(true)}><Plus className="mr-1 inline h-4 w-4" /> Preset Yayınla</YesilDugme>} />

      {/* nasıl kazanıyorum açıklaması */}
      <Kart className="mb-6 !border-sky-400/20">
        <div className="flex items-start gap-3">
          <GlassIkon boyut={40} aktif><Info className="h-4.5 w-4.5" /></GlassIkon>
          <div className="text-sm text-white/70">
            <p className="font-semibold text-white">Kullanım başına kazanç</p>
            <p className="mt-0.5">Biri presetini kullandığında belirlediğin fiyatı öder. Bundan <b className="text-white">Vayra %50 komisyon</b> ve <b className="text-white">model üretim maliyeti</b> düşülür, kalanı sana yatar.</p>
            <p className="mt-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 font-mono text-[12px] text-sky-300">senin payın = fiyat − (fiyat × %50) − model maliyeti</p>
          </div>
        </div>
      </Kart>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <MetrikKart etiket="Toplam kazanç" deger={tl(toplamKazanc)} alt={`${toplamKazanc.toLocaleString("tr-TR")} kredi`} ikon={<TrendingUp className="h-4 w-4" />} vurgu />
        <MetrikKart etiket="Toplam kullanım" deger={toplamKullanim.toLocaleString("tr-TR")} ikon={<Repeat className="h-4 w-4" />} />
        <MetrikKart etiket="Yayında preset" deger={String(s.presetler.filter((p) => p.durum === "aktif").length)} ikon={<Sparkles className="h-4 w-4" />} />
      </div>

      {s.presetler.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/[0.1] py-16 text-center backdrop-blur-xl">
          <GlassIkon boyut={56}><ShoppingBag className="h-6 w-6" /></GlassIkon>
          <div className="text-[15px] font-semibold text-white">Henüz preset yayınlamadın</div>
          <p className="max-w-sm text-sm text-white/45">Vayra'da beğendiğin bir üretimin ayarlarını preset olarak yayınla, her kullanımda pasif gelir kazan.</p>
          <YesilDugme onClick={() => setModal(true)}>İlk presetini yayınla</YesilDugme>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {s.presetler.map((p) => (
            <Kart key={p.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <GlassIkon boyut={48}><Sparkles className="h-5 w-5" /></GlassIkon>
                  <div>
                    <div className="font-bold text-white">{p.ad}</div>
                    <div className="text-[11px] text-white/40">{p.kategori} · {p.modelAd}</div>
                  </div>
                </div>
                <DurumRozet durum={p.durum} />
              </div>
              {p.aciklama && <p className="mt-2 line-clamp-1 text-xs text-white/45">{p.aciklama}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
                <div><div className="text-sm font-bold text-white">{p.satisFiyati}</div><div className="text-[10px] text-white/40">fiyat/kul.</div></div>
                <div><div className="text-sm font-bold text-white">{p.kullanim}</div><div className="text-[10px] text-white/40">kullanım</div></div>
                <div><div className="text-sm font-bold text-sky-300">{ureticiPay(p.satisFiyati, p.modelMaliyet)}</div><div className="text-[10px] text-white/40">senin/kul.</div></div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-sm text-white/50">Toplam kazanç: <b className="text-sky-300">{p.kazanc.toLocaleString("tr-TR")} kr</b></span>
                <div className="flex gap-1">
                  <button onClick={() => { s.presetDurumDegistir(p.id); toast.success(p.durum === "aktif" ? "Satıştan kaldırıldı" : "Tekrar satışa açıldı"); }} title={p.durum === "aktif" ? "Satıştan kaldır" : "Satışa aç"} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white"><Power className="h-4 w-4" /></button>
                  <button onClick={() => { s.presetKaldir(p.id); toast.success("Preset silindi"); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* preset yayınla modal */}
      {modal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#14151799] p-5 shadow-2xl backdrop-blur-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-white">Preset Yayınla</h3>
              <button onClick={() => setModal(false)} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <label className="mb-1.5 block text-xs font-semibold text-white/60">Preset adı</label>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="örn. Altın Saat Portre" className="mb-3 h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40" />

            <label className="mb-1.5 block text-xs font-semibold text-white/60">Kısa açıklama</label>
            <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Preset ne yapıyor?" className="mb-3 h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40" />

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Model</label>
                <div className="relative">
                  <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="h-10 w-full appearance-none rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 pr-8 text-sm text-white outline-none focus:border-sky-400/40">
                    {GORSEL_MODELLER.map((m) => <option key={m.id} value={m.id}>{m.ad} ({m.kredi} kr)</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-white/40" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Kategori</label>
                <div className="relative">
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="h-10 w-full appearance-none rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 pr-8 text-sm text-white outline-none focus:border-sky-400/40">
                    {KATEGORILER.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-white/40" />
                </div>
              </div>
            </div>

            <label className="mb-1.5 block text-xs font-semibold text-white/60">Kullanım başına satış fiyatı (kredi)</label>
            <input value={fiyat} onChange={(e) => setFiyat(e.target.value)} placeholder="örn. 40" inputMode="numeric" className="mb-3 h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40" />

            {/* canlı kazanç önizleme */}
            {fiyatSayi > 0 && (
              <div className="mb-4 space-y-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
                <div className="flex justify-between text-white/50"><span>Satış fiyatı</span><span className="text-white">{fiyatSayi} kr</span></div>
                <div className="flex justify-between text-white/50"><span>Vayra komisyonu (%50)</span><span className="text-rose-300">−{komisyon} kr</span></div>
                <div className="flex justify-between text-white/50"><span>Model maliyeti ({model?.ad})</span><span className="text-rose-300">−{maliyet} kr</span></div>
                <div className="flex justify-between border-t border-white/[0.08] pt-1.5 font-bold"><span className="text-white">Her kullanımda sana</span><span className={pay > 0 ? "text-sky-300" : "text-rose-400"}>{pay > 0 ? "+" : ""}{pay} kr</span></div>
                {pay <= 0 && <p className="text-[11px] text-rose-400">Fiyatı yükselt — bu fiyatta kazanç kalmıyor.</p>}
              </div>
            )}

            <YesilDugme onClick={ekle} disabled={!gecerli} className="w-full">Yayına Gönder</YesilDugme>
          </div>
        </div>
      )}
    </div>
  );
}
