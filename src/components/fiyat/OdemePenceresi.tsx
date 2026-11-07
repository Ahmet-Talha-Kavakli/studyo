"use client";

/**
 * Ödeme özeti penceresi: bütün satın alma düğmeleri buradan geçer (plan, kredi paketi, sınırsız erişim, hız).
 * Tutarı sunucu hesaplar (/api/odeme/onizle); kullanıcı özeti, KDV'yi, kalan süre farkını ve yenileme biçimini görür,
 * eksikse fatura bilgisini tamamlar, sonra sağlayıcının güvenli ödeme sayfasına yönlendirilir (kart Vayra'ya gelmez).
 * Sağlayıcı bağlı değilse düğme "Ödeme altyapısı henüz bağlanmadı" der; sahte başarı yoktur.
 *
 *   odemeyeGec({ tur: "kredi", urun: "2500" })
 */

import { useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { create } from "zustand";
import { motion } from "framer-motion";
import { Building2, Loader2, Lock, User } from "lucide-react";
import { Hap, Pencere, Segment, alan, dugme } from "@/components/ayarlar/ui";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { paraYaz } from "@/lib/odeme/katalog";
import { BOS_FATURA, faturaTemizle } from "@/lib/odeme/fatura";
import * as O from "@/lib/odeme/istemci";
import type { FaturaBilgisi, OdemeIstegi, OnizlemeYaniti, Para } from "@/lib/odeme/tipler";
import { SAGLAYICI_AD } from "@/lib/odeme/tipler";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAlan } from "@/store/useAlan";
import { AlanLogo } from "@/components/alan/ortak";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";

type Onizleme = Omit<OnizlemeYaniti, "ok">;

const useOdeme = create<{ istek: OdemeIstegi | null; sayac: number }>(() => ({ istek: null, sayac: 0 }));
let kok: Root | null = null;

/** Ödeme penceresini açar. Girişli değilse önce giriş penceresi, girişten sonra ödeme penceresi açılır. */
export function odemeyeGec(istek: OdemeIstegi) {
  if (typeof window === "undefined") return;
  const a = useAuth.getState();
  if (!a.girisYapildi || !a.kullanici) {
    useAuthKapi.getState().ac({ baslik: "Satın almak için giriş yap", altBaslik: "Ödemeler ve krediler hesabına işlenir.", eylem: () => odemeyeGec(istek) });
    return;
  }
  if (!kok) {
    const d = document.createElement("div");
    d.id = "vayra-odeme";
    document.body.appendChild(d);
    kok = createRoot(d);
    kok.render(<OdemeKoku />);
  }
  useOdeme.setState((s) => ({ istek, sayac: s.sayac + 1 }));
}

function OdemeKoku() {
  const istek = useOdeme((s) => s.istek);
  const sayac = useOdeme((s) => s.sayac);
  return <OdemePenceresi key={sayac} istek={istek} onKapat={() => useOdeme.setState({ istek: null })} />;
}

const satir = "flex items-baseline justify-between gap-4 py-2 text-[14px]";

function OdemePenceresi({ istek, onKapat }: { istek: OdemeIstegi | null; onKapat: () => void }) {
  const [para, setPara] = useState<Para>(istek?.para ?? "TRY");
  const [o, setO] = useState<Onizleme | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gidiyor, setGidiyor] = useState(false);
  const [f, setF] = useState<FaturaBilgisi>(() => ({ ...BOS_FATURA, eposta: useAuth.getState().kullanici?.email ?? "" }));
  const [faturaHata, setFaturaHata] = useState<string | null>(null);
  /* Alan için satın alma: plan ve kredi paketi, sahibi ya da yöneticisi olunan bir çalışma alanına alınabilir. */
  const alanlar = useAlan((s) => s.alanlar).filter((a) => a.rol === "sahip" || a.rol === "yonetici");
  const alanaUygun = istek?.tur === "plan" || istek?.tur === "kredi";
  const [hedef, setHedef] = useState<string | null>(() => {
    if (istek?.alan) return istek.alan;
    const e = useAlan.getState().etkin;
    return alanaUygun && e && (e.rol === "sahip" || e.rol === "yonetici") ? e.id : null;
  });
  const hedefIstek = istek ? { ...istek, alan: alanaUygun && hedef ? hedef : undefined } : null;

  useEffect(() => {
    if (!istek) return;
    let iptal = false;
    setYukleniyor(true); setHata(null);
    void O.onizle({ ...hedefIstek!, para }).then((r) => {
      if (iptal) return;
      setYukleniyor(false);
      if (r.ok) setO(r); else { setO(null); setHata(r.hata); }
    });
    return () => { iptal = true; };
  }, [istek, para, hedef]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!o?.faturaEksik) return;
    void O.faturaGetir().then((r) => { if (r.ok && r.fatura) setF({ ...BOS_FATURA, ...r.fatura }); });
  }, [o?.faturaEksik]);

  const ode = async () => {
    if (!istek || !o) return;
    setGidiyor(true);
    if (o.faturaEksik) {
      const { hatalar } = faturaTemizle(f);
      const eksik = f.tip === "kurumsal" ? !f.unvan || !f.vkn || !f.vergiDairesi : f.adSoyad.trim().split(/\s+/).length < 2;
      if (eksik || f.adres.trim().length < 5 || !f.il.trim() || Object.keys(hatalar).length) {
        setGidiyor(false);
        return setFaturaHata(Object.values(hatalar)[0] ?? (f.tip === "kurumsal" ? "Unvan, vergi kimlik no, vergi dairesi, adres ve il gerekli." : "Ad soyad, adres ve il gerekli."));
      }
      const k = await O.faturaKaydet(f);
      if (!k.ok) { setGidiyor(false); return setFaturaHata(k.hata); }
    }
    const r = await O.baslat({ ...hedefIstek!, para });
    if (!r.ok) {
      setGidiyor(false);
      if (r.kod === "fatura") { setO({ ...o, faturaEksik: true }); return setFaturaHata(r.hata); }
      return toast.error("Ödeme başlatılamadı", { description: r.hata });
    }
    if (r.planlandi) {
      toast.success("Değişiklik planlandı", { description: r.mesaj });
      await O.hesabiTazele();
      onKapat();
      return;
    }
    if (r.adres) location.assign(r.adres);
  };

  const altyapiYok = !!o && !o.saglayici;
  const birincilMetin = !o ? "Ödemeye geç"
    : altyapiYok ? "Ödeme altyapısı henüz bağlanmadı"
      : o.odemesiz ? "Dönem sonuna planla"
        : o.saglayici === "deneme" ? `${paraYaz(o.toplam, o.para)} deneme ödemesine geç`
          : `${paraYaz(o.toplam, o.para)} öde`;

  return (
    <Pencere acik={!!istek} onKapat={onKapat} genislik={500}
      baslik={o?.ad ?? (hata ? "Satın alma" : "Ödeme özeti")}
      aciklama={o?.aciklama}
      alt={<>
        <button type="button" onClick={onKapat} className={dugme.hayalet}>Vazgeç</button>
        <button type="button" onClick={() => void ode()} disabled={!o || altyapiYok || gidiyor || yukleniyor} className={cn(dugme.birincil, "min-w-[170px]")}>
          {gidiyor ? <><Loader2 className="h-4 w-4 animate-spin" />Yönlendiriliyor</> : <>{!altyapiYok && !o?.odemesiz && <Lock className="h-3.5 w-3.5" />}{birincilMetin}</>}
        </button>
      </>}>
      {yukleniyor && !o ? (
        <div className="space-y-3" aria-busy>
          {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded-[12px] bg-white/[0.05]" />)}
        </div>
      ) : hata ? (
        <p role="alert" className="rounded-[14px] bg-white/[0.04] p-4 text-[14px] leading-relaxed text-white/75">{hata}</p>
      ) : o ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {o.saglayici === "deneme" && <Hap ton="sari">Deneme ödemesi</Hap>}
            {o.saglayici && o.saglayici !== "deneme" && o.mod === "test" && <Hap ton="sari">Test modu</Hap>}
            {o.yenileme === "otomatik" && <Hap ton="vurgu">Her dönem kendiliğinden yenilenir</Hap>}
            {o.yenileme === "hatirlatma" && !o.odemesiz && <Hap>Dönemlik ödeme, hatırlatmalı</Hap>}
            {o.odemesiz && <Hap>Bu dönem ödeme yok</Hap>}
          </div>

          {alanaUygun && alanlar.length > 0 && (
            <div>
              <p className="mb-2 text-[13.5px] text-white/60">Kimin için</p>
              <div className="flex flex-wrap gap-2">
                {[{ id: null as string | null, ad: "Kişisel hesabım", on: <KullaniciAvatar boyut={22} /> }, ...alanlar.map((a) => ({ id: a.id as string | null, ad: a.ad, on: <AlanLogo ad={a.ad} logo={a.logo} renk={a.renk} boyut={22} /> }))].map((x) => (
                  <button key={x.id ?? "kisisel"} type="button" onClick={() => setHedef(x.id)}
                    className={cn("flex h-10 max-w-full items-center gap-2 rounded-full bg-white/[0.05] pl-1.5 pr-3.5 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.09]", hedef === x.id && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white ring-0")}>
                    {x.on}<span className="truncate">{x.ad}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {o.paralar.length > 1 && !o.odemesiz && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13.5px] text-white/60">Para birimi</span>
              <Segment kucuk kayit={false} deger={para} onSec={setPara} secenekler={o.paralar.map((p) => ({ deger: p, ad: p === "TRY" ? "Türk lirası" : "ABD doları" }))} />
            </div>
          )}

          {!o.odemesiz && (
            <div className="divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.03] px-4">
              <div className={satir}><span className="text-white/60">{o.ad}</span><span className="tabular-nums text-white">{paraYaz(o.liste, o.para)}</span></div>
              {o.indirimler.map((x) => (
                <div key={x.ad} className={satir}><span className="text-emerald-300/90">{x.ad}</span><span className="tabular-nums text-emerald-300">{paraYaz(x.tutar, o.para)} düşüldü</span></div>
              ))}
              {o.kdvOrani > 0 && <div className={satir}><span className="text-white/60">KDV, yüzde {Math.round(o.kdvOrani * 100)}</span><span className="tabular-nums text-white">{paraYaz(o.kdv, o.para)}</span></div>}
              <div className={cn(satir, "py-3")}><span className="font-semibold text-white">Toplam</span><span className="text-[18px] font-semibold tabular-nums tracking-[-0.01em] text-white">{paraYaz(o.toplam, o.para)}</span></div>
            </div>
          )}

          {o.faturaEksik && !altyapiYok && <FaturaFormu f={f} setF={(x) => { setF(x); setFaturaHata(null); }} hata={faturaHata} />}

          <ul className="space-y-2 text-[13px] leading-relaxed text-white/55">
            {o.notlar.map((n) => <li key={n} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/35" />{n}</li>)}
          </ul>

          {o.saglayici && o.saglayici !== "deneme" && !o.odemesiz && (
            <p className="flex items-center gap-2 rounded-[14px] bg-white/[0.03] px-4 py-3 text-[13px] text-white/55">
              <Lock className="h-4 w-4 shrink-0 text-[#55d6fd]" />
              Ödeme {SAGLAYICI_AD[o.saglayici]} güvenli ödeme sayfasında yapılır. Kart bilgin Vayra'ya gelmez{o.taksit ? "; taksit seçeneklerini orada görürsün" : ""}.
            </p>
          )}
          {altyapiYok && (
            <p className="rounded-[14px] bg-amber-400/[0.07] px-4 py-3 text-[13.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-400/20">
              Bu sunucuda iyzico ya da Stripe bağlı değil; satın alma şu an yapılamıyor. Hesabından para çekilmez, kredi eklenmez.
            </p>
          )}
        </motion.div>
      ) : null}
    </Pencere>
  );
}

function FaturaFormu({ f, setF, hata }: { f: FaturaBilgisi; setF: (f: FaturaBilgisi) => void; hata: string | null }) {
  const al = (k: keyof FaturaBilgisi, ad: string, ek?: { yer?: string; otomatik?: string; sayisal?: number; genis?: boolean }) => (
    <label className={cn("block min-w-0", ek?.genis && "col-span-2")}>
      <span className="mb-1.5 block text-[12.5px] font-medium text-white/70">{ad}</span>
      <input value={String(f[k] ?? "")} placeholder={ek?.yer} autoComplete={ek?.otomatik} inputMode={ek?.sayisal ? "numeric" : undefined}
        onChange={(e) => setF({ ...f, [k]: ek?.sayisal ? e.target.value.replace(/\D/g, "").slice(0, ek.sayisal) : e.target.value })} className={alan} />
    </label>
  );
  return (
    <div className="rounded-[16px] bg-white/[0.03] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-semibold text-white">Fatura bilgileri</p>
        <Segment kucuk kayit={false} deger={f.tip} onSec={(v) => setF({ ...f, tip: v })}
          secenekler={[{ deger: "bireysel", ad: "Bireysel", ikon: <User className="h-3.5 w-3.5" /> }, { deger: "kurumsal", ad: "Kurumsal", ikon: <Building2 className="h-3.5 w-3.5" /> }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {f.tip === "bireysel" ? <>
          {al("adSoyad", "Ad soyad", { yer: "Ayşe Yılmaz", otomatik: "name", genis: true })}
        </> : <>
          {al("unvan", "Şirket unvanı", { otomatik: "organization", genis: true })}
          {al("vkn", "Vergi kimlik no", { sayisal: 10, yer: "10 haneli" })}
          {al("vergiDairesi", "Vergi dairesi")}
        </>}
        {al("adres", "Adres", { yer: "Mahalle, cadde, kapı no", otomatik: "street-address", genis: true })}
        {al("ilce", "İlçe", { otomatik: "address-level2" })}
        {al("il", "İl", { otomatik: "address-level1" })}
      </div>
      <p className={cn("mt-3 text-[12.5px] leading-relaxed", hata ? "text-rose-300" : "text-white/40")}>
        {hata ?? "Makbuzunda ve faturanda görünür; bir kez girersin, Ayarlar, Faturalar bölümünden değiştirirsin."}
      </p>
    </div>
  );
}
