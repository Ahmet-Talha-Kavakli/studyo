"use client";

import { IskeletListeSatiri } from "@/components/ui/Iskelet";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRightLeft, Coins, Crown, Download, FolderKanban, Globe, LogOut, Mail, Settings2, ShieldCheck, Trash2, UserCheck, UserMinus, Users } from "lucide-react";
import { AlanSayfa, type AlanSayfaBaglam } from "@/components/alan/AlanSayfa";
import { RolHap, SecimMenusu, goreliZaman, saatDilimi, sayiYaz } from "@/components/alan/ortak";
import { Grup, Pencere, Satir, alan as alanSinifi, dugme } from "@/components/ayarlar/ui";
import { Avatar } from "@/components/ayarlar/AyarKabugu";
import * as A from "@/lib/alan/istemci";
import { GUNLUK_AD, ROL_ACIKLAMA, type AlanGunlukKaydi, type AlanGunlukTuru } from "@/lib/alan/tipler";
import { useAlan } from "@/store/useAlan";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const IKON: Partial<Record<AlanGunlukTuru, typeof Users>> = {
  olustur: ShieldCheck, ayar: Settings2, davet: Mail, "davet-iptal": Mail, katil: UserCheck, rol: Users, sinir: Coins, cikar: UserMinus, ayril: LogOut,
  devret: Crown, kredi: Coins, plan: Coins, satin: Coins, alanadi: Globe, proje: FolderKanban, kitaplik: FolderKanban, sil: Trash2,
};

/** Güvenlik: denetim günlüğü, sahiplik devri, alandan ayrılma, alanı silme. */
export default function AlanGuvenlik() {
  return (
    <AlanSayfa baslik="Güvenlik" aciklama="Alanda kim neyi değiştirdi, sahiplik ve alanın kapatılması.">
      {(b) => <Icerik {...b} />}
    </AlanSayfa>
  );
}

function Icerik(b: AlanSayfaBaglam) {
  const { alan, yonetici, sahip } = b;
  return (
    <>
      <Grup baslik="Rolün" aciklama={ROL_ACIKLAMA[alan.rol]} sag={<RolHap rol={alan.rol} />} />
      {yonetici ? <Gunluk alanId={alan.id} /> : <p className="px-1 text-[13px] text-white/45">Denetim günlüğünü alanın sahibi ve yöneticileri görür.</p>}
      {sahip && <Devir {...b} />}
      {!sahip && <Ayril {...b} />}
      {sahip && <Sil {...b} />}
    </>
  );
}

function Gunluk({ alanId }: { alanId: string }) {
  const [tur, setTur] = useState<AlanGunlukTuru | "">("");
  const [l, setL] = useState<AlanGunlukKaydi[] | null>(null);
  const [toplam, setToplam] = useState(0);
  const getir = useCallback(async () => { const r = await A.gunlukGetir(alanId, tur || undefined); if (r.ok) { setL(r.kayitlar); setToplam(r.toplam); } else setL([]); }, [alanId, tur]);
  useEffect(() => { void getir(); }, [getir]);
  return (
    <Grup id="gunluk" baslik="Denetim günlüğü" aciklama="Davetler, katılımlar, rol ve sınır değişiklikleri, kredi aktarımları, satın almalar, alan adı ve silme işlemleri. Kayıtlar değiştirilemez."
      sag={<>
        <SecimMenusu etiket="Olay türü" deger={tur} onSec={setTur} genislik={230} secenekler={[{ deger: "" as AlanGunlukTuru | "", ad: "Bütün olaylar" }, ...(Object.keys(GUNLUK_AD) as AlanGunlukTuru[]).map((k) => ({ deger: k as AlanGunlukTuru | "", ad: GUNLUK_AD[k] }))]} />
        <a href={`/api/alan/${alanId}/gunluk?csv=1&tz=${encodeURIComponent(saatDilimi())}`} className={dugme.ikincil}><Download className="h-4 w-4" />CSV</a>
      </>}>
      {!l ? <div aria-busy aria-label="Günlük yükleniyor">{[0, 1, 2, 3].map((i) => <IskeletListeSatiri key={i} simge={32} yuvarlak sag={false} ilk={["w-72", "w-60", "w-80", "w-64"][i]} ikinci={["w-56", "w-48", "w-52", "w-44"][i]} />)}</div> : !l.length ? <p className="px-6 py-6 text-[13.5px] text-white/45">Bu türde kayıt yok.</p> : l.map((k, i) => {
        const I = IKON[k.tur] ?? ShieldCheck;
        return (
          <motion.div key={k.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 15) * 0.015 }} className="flex items-start gap-3 px-6 py-3">
            <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", k.tur === "sil" || k.tur === "cikar" ? "bg-rose-500/12 text-rose-300" : "bg-white/[0.06] text-white/65")}><I className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] text-white"><b className="font-semibold">{GUNLUK_AD[k.tur] ?? k.tur}</b> <span className="text-white/75">{k.ayrinti}</span></span>
              <span className="block text-[12px] text-white/40">{k.ad} · {goreliZaman(k.zaman)} · {new Date(k.zaman).toLocaleString()}{k.ip ? ` · ${k.ip}` : ""}</span>
            </span>
          </motion.div>
        );
      })}
      {l && toplam > l.length && <p className="px-6 py-3 text-[12.5px] text-white/40">Son {l.length} kayıt gösteriliyor; hepsi için CSV'yi indir ({sayiYaz(toplam)} kayıt).</p>}
    </Grup>
  );
}

function Devir({ alan, setAlan }: AlanSayfaBaglam) {
  const [hedef, setHedef] = useState<string | null>(null);
  const [onay, setOnay] = useState("");
  const [bekle, setBekle] = useState(false);
  const adaylar = alan.uyeler.filter((u) => !u.ben);
  const h = adaylar.find((u) => u.uid === hedef);
  const devret = async () => {
    if (!h) return;
    setBekle(true);
    const r = await A.devret(alan.id, h.uid, onay.trim());
    setBekle(false);
    if (!r.ok) return toast.error("Devredilemedi", { description: r.hata });
    setAlan(r.alan); setHedef(null); setOnay("");
    void useAlan.getState().yukle();
    toast.success(`Sahiplik ${h.ad} adlı üyeye devredildi`, { description: "Sen yönetici olarak alanda kalıyorsun." });
  };
  return (
    <Grup id="devret" baslik="Sahipliği devret" aciklama="Alanın sahibi faturalamayı, alanı silmeyi ve devri yönetir. Devirden sonra sen yönetici olarak kalırsın.">
      <Satir ad="Yeni sahip" alt={adaylar.length ? "Alanın bir üyesini seç." : "Devretmek için önce alana bir üye davet et."}>
        <button type="button" disabled={!adaylar.length} onClick={() => setHedef(adaylar[0]?.uid ?? null)} className={dugme.ikincil}><ArrowRightLeft className="h-4 w-4" />Devret</button>
      </Satir>
      <Pencere acik={hedef !== null} onKapat={() => { setHedef(null); setOnay(""); }} baslik="Sahipliği devret" aciklama="Bu işlem geri alınamaz; yeni sahip isterse sahipliği sana geri devredebilir."
        alt={<><button type="button" onClick={() => setHedef(null)} className={dugme.hayalet}>Vazgeç</button><button type="button" disabled={!h || onay.trim() !== alan.ad || bekle} onClick={() => void devret()} className={dugme.tehlikeDolu}>{bekle ? "Devrediliyor" : "Sahipliği devret"}</button></>}>
        <div className="space-y-4">
          <div className="max-h-[280px] divide-y divide-white/[0.06] overflow-y-auto rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
            {adaylar.map((u) => (
              <button key={u.uid} type="button" onClick={() => setHedef(u.uid)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04]", hedef === u.uid && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white")}>
                <Avatar ad={u.ad} src={u.avatar} boyut={32} tohum={u.email} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{u.ad}</span><span className="block truncate text-[12px] text-white/45">{u.email}</span></span>
                <RolHap rol={u.rol} />
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-white/60">Onay için alanın adını yaz: <b className="text-white">{alan.ad}</b></span>
            <input value={onay} onChange={(e) => setOnay(e.target.value)} className={alanSinifi} />
          </label>
        </div>
      </Pencere>
    </Grup>
  );
}

function Ayril({ alan }: AlanSayfaBaglam) {
  const router = useRouter();
  const [onay, setOnay] = useState(false);
  const ayril = async () => {
    const r = await A.ayril(alan.id);
    if (!r.ok) return toast.error("Ayrılamadın", { description: r.hata });
    await useAlan.getState().yukle();
    await useAlan.getState().gec(null, true);
    toast.success(`${alan.ad} alanından ayrıldın`);
    router.push("/panel/ayarlar/alan");
  };
  return (
    <Grup id="sil" tehlike baslik="Alandan ayrıl" aciklama="Alanın kredisine, projelerine ve kitaplığına erişimin hemen biter. Yeniden katılmak için davet gerekir. Kendi açtığın Build projeleri hesabında kalır."
      alt={<><span>Kişisel alana geçersin.</span>{onay ? <span className="flex gap-2"><button type="button" onClick={() => setOnay(false)} className={dugme.hayalet}>Vazgeç</button><button type="button" onClick={() => void ayril()} className={dugme.tehlikeDolu}>Evet, ayrıl</button></span>
        : <button type="button" onClick={() => setOnay(true)} className={dugme.tehlike}><LogOut className="h-4 w-4" />Alandan ayrıl</button>}</>} />
  );
}

function Sil({ alan }: AlanSayfaBaglam) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [onay, setOnay] = useState("");
  const [bekle, setBekle] = useState(false);
  const sil = async () => {
    setBekle(true);
    const r = await A.alanSil(alan.id, onay.trim());
    setBekle(false);
    if (!r.ok) return toast.error("Silinemedi", { description: r.hata });
    setAcik(false);
    await useAlan.getState().yukle();
    await useAlan.getState().gec(null, true);
    await useAuth.getState().esitle();
    toast.success(`${alan.ad} silindi`, { description: r.iade ? `Havuzda kalan ${sayiYaz(r.iade)} ek kredi kişisel bakiyene döndü.` : undefined });
    router.push("/panel/ayarlar/alan");
  };
  return (
    <Grup id="sil" tehlike baslik="Alanı sil" aciklama="Üyelikler, davetler, kitaplık, kullanım ve denetim kayıtları kalıcı olarak silinir. Build projeleri silinmez, sahiplerinin kişisel projeleri olarak kalır."
      alt={<><span>Geri alınamaz.</span><button type="button" onClick={() => setAcik(true)} className={dugme.tehlike}><Trash2 className="h-4 w-4" />Alanı sil</button></>}>
      <Pencere acik={acik} onKapat={() => { setAcik(false); setOnay(""); }} baslik={`${alan.ad} silinsin mi`} aciklama="Bu işlem geri alınamaz."
        alt={<><button type="button" onClick={() => setAcik(false)} className={dugme.hayalet}>Vazgeç</button><button type="button" disabled={onay.trim() !== alan.ad || bekle} onClick={() => void sil()} className={dugme.tehlikeDolu}>{bekle ? "Siliniyor" : "Alanı kalıcı olarak sil"}</button></>}>
        <div className="space-y-4">
          <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
            {[["Üyeler", `${sayiYaz(alan.uyeler.length)} üye erişimini kaybeder`], ["Havuzdaki ek kredi", `${sayiYaz(alan.kredi.ekKalan)} kredi kişisel bakiyene döner`], ["Plan kredisi", `${sayiYaz(alan.kredi.planKredi)} kredi alanla biter`], ["Build projeleri", `${sayiYaz(alan.projeSayisi)} proje sahiplerinde kalır`], ["Kitaplık", `${sayiYaz(alan.kitaplikSayisi)} öğe kaldırılır`]].map(([a, v]) => (
              <div key={a} className="flex justify-between gap-3 px-4 py-2.5 text-[13px]"><dt className="text-white/50">{a}</dt><dd className="text-right text-white/85">{v}</dd></div>
            ))}
          </dl>
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-white/60">Onay için alanın adını yaz: <b className="text-white">{alan.ad}</b></span>
            <input value={onay} onChange={(e) => setOnay(e.target.value)} className={alanSinifi} />
          </label>
        </div>
      </Pencere>
    </Grup>
  );
}
