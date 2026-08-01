"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Download, BadgeCheck, ShieldAlert, Crown, ArrowUpDown } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, AramaKutu, FiltreCip, Rozet, Dugme, AD, MetrikKart } from "@/components/admin/ui/temel";
import { Tablo, type Kolon } from "@/components/admin/ui/tablo";
import { veri } from "@/lib/admin/seed";
import { PLAN_ADI } from "@/store/useAuth";
import { DURUM_ETIKET, PLAN_TON } from "@/lib/admin/etiketler";
import { useEfektif } from "@/lib/admin/efektif";
import { para, kisaPara, sayi, tarihEtiket, goreceZaman } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { AdminKullanici } from "@/lib/admin/seed";

const DURUM_FILTRE = ["hepsi", "aktif", "pasif", "askida", "banli", "silinme_talebi"] as const;
const PLAN_FILTRE = ["hepsi", "baslangic", "arti", "ultra", "kurumsal"] as const;
type Sirala = "sonAktif" | "kayit" | "harcanan" | "kredi" | "guven";

export default function KullaniciListe() {
  const router = useRouter();
  const efektif = useEfektif();
  const { kullanicilar } = veri();
  const [ara, setAra] = useState("");
  const [durum, setDurum] = useState<string>("hepsi");
  const [plan, setPlan] = useState<string>("hepsi");
  const [sirala, setSirala] = useState<Sirala>("sonAktif");

  const liste = useMemo(() => {
    const q = ara.trim().toLowerCase();
    let l = kullanicilar.map(efektif).filter((k) => {
      if (durum !== "hepsi" && k.durum !== durum) return false;
      if (plan !== "hepsi" && k.plan !== plan) return false;
      if (q && !k.ad.toLowerCase().includes(q) && !k.email.toLowerCase().includes(q) && !k.id.includes(q) && !k.ip.includes(q)) return false;
      return true;
    });
    const sk: Record<Sirala, (a: AdminKullanici, b: AdminKullanici) => number> = {
      sonAktif: (a, b) => b.sonAktif - a.sonAktif,
      kayit: (a, b) => b.kayitTarih - a.kayitTarih,
      harcanan: (a, b) => b.toplamHarcanan - a.toplamHarcanan,
      kredi: (a, b) => b.krediBakiye - a.krediBakiye,
      guven: (a, b) => a.guvenSkoru - b.guvenSkoru,
    };
    return [...l].sort(sk[sirala]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kullanicilar, ara, durum, plan, sirala]);

  const ozetSay = useMemo(() => ({
    toplam: kullanicilar.length,
    aktif: kullanicilar.filter((k) => k.durum === "aktif").length,
    banli: kullanicilar.filter((k) => k.durum === "banli").length,
    vip: kullanicilar.filter((k) => k.vip).length,
  }), [kullanicilar]);

  const csvIndir = () => {
    const bas = ["id", "ad", "email", "plan", "durum", "ulke", "krediBakiye", "toplamHarcanan", "toplamOdenen", "guvenSkoru", "kayitTarih"];
    const satir = liste.slice(0, 2000).map((k) =>
      [k.id, `"${k.ad}"`, k.email, k.plan, k.durum, k.ulke, k.krediBakiye, k.toplamHarcanan, k.toplamOdenen, k.guvenSkoru, tarihEtiket(k.kayitTarih)].join(","));
    const blob = new Blob([[bas.join(","), ...satir].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kullanicilar-${Date.now()}.csv`;
    a.click();
    toast.success(`${Math.min(2000, liste.length)} kullanıcı CSV olarak indirildi`);
  };

  const kolonlar: Kolon<AdminKullanici>[] = [
    {
      anahtar: "ad", baslik: "Kullanıcı", render: (k) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-[11px] font-bold text-[#04222c]">
            {k.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium">{k.ad}</span>
              {k.dogrulanmis && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[color:var(--ad-aksan)]" />}
              {k.vip && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
            </div>
            <div className={cn("truncate text-[11px]", AD.metin3)}>{k.email}</div>
          </div>
        </div>
      ),
    },
    { anahtar: "plan", baslik: "Plan", render: (k) => <Rozet ton={PLAN_TON[k.plan] ?? "notr"}>{PLAN_ADI[k.plan as keyof typeof PLAN_ADI] ?? k.plan}</Rozet> },
    { anahtar: "durum", baslik: "Durum", render: (k) => <Rozet ton={DURUM_ETIKET[k.durum].ton}>{DURUM_ETIKET[k.durum].ad}</Rozet> },
    { anahtar: "ulke", baslik: "Ülke", gizleMobil: true, render: (k) => <span className={AD.metin2}>{k.ulke}</span> },
    { anahtar: "kredi", baslik: "Kredi", hizala: "sag", gizleMobil: true, render: (k) => <span className="tabular-nums">{sayi(k.krediBakiye)}</span> },
    { anahtar: "harcanan", baslik: "Harcanan", hizala: "sag", gizleMobil: true, render: (k) => <span className="tabular-nums">{kisaPara(k.toplamHarcanan)}</span> },
    {
      anahtar: "guven", baslik: "Güven", hizala: "sag", gizleMobil: true, render: (k) => (
        <span className={cn("inline-flex items-center gap-1 tabular-nums", k.guvenSkoru < 35 ? "text-rose-400" : k.guvenSkoru < 60 ? "text-amber-400" : "text-emerald-400")}>
          {k.guvenSkoru < 35 && <ShieldAlert className="h-3 w-3" />}{k.guvenSkoru}
        </span>
      ),
    },
    { anahtar: "sonAktif", baslik: "Son aktif", hizala: "sag", render: (k) => <span className={cn("text-[12px]", AD.metin3)}>{goreceZaman(k.sonAktif)}</span> },
  ];

  return (
    <RotaGuard modul="kullanicilar">
      <BolumBaslik baslik="Kullanıcılar" ozet={`${sayi(kullanicilar.length)} kayıtlı kullanıcı`} ikon={Users}
        sag={<Dugme tur="glass" boyut="sm" ikon={Download} onClick={csvIndir}>CSV indir</Dugme>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Toplam" deger="" sayacHedef={ozetSay.toplam} ikon={Users} />
        <MetrikKart etiket="Aktif" deger="" sayacHedef={ozetSay.aktif} renk="basari" />
        <MetrikKart etiket="Banlı" deger="" sayacHedef={ozetSay.banli} renk="tehlike" />
        <MetrikKart etiket="VIP" deger="" sayacHedef={ozetSay.vip} renk="mor" />
      </div>

      {/* Filtreler */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <AramaKutu deger={ara} degis={setAra} yer="Ad, e-posta, ID veya IP ara…" className="w-full sm:w-80" />
          <button onClick={() => setSirala((s) => s === "sonAktif" ? "harcanan" : s === "harcanan" ? "guven" : s === "guven" ? "kredi" : s === "kredi" ? "kayit" : "sonAktif")}
            className="ad-btn-glass flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {{ sonAktif: "Son aktif", harcanan: "Harcanan", guven: "Güven ↑", kredi: "Kredi", kayit: "Kayıt" }[sirala]}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DURUM_FILTRE.map((d) => (
            <FiltreCip key={d} aktif={durum === d} onClick={() => setDurum(d)}>
              {d === "hepsi" ? "Tüm durumlar" : DURUM_ETIKET[d as keyof typeof DURUM_ETIKET].ad}
            </FiltreCip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PLAN_FILTRE.map((p) => (
            <FiltreCip key={p} aktif={plan === p} onClick={() => setPlan(p)}>
              {p === "hepsi" ? "Tüm planlar" : PLAN_ADI[p as keyof typeof PLAN_ADI] ?? p}
            </FiltreCip>
          ))}
        </div>
      </div>

      <p className={cn("mb-2 text-[13px]", AD.metin3)}>{sayi(liste.length)} sonuç</p>
      <Tablo kolonlar={kolonlar} satirlar={liste} satirTikla={(k) => router.push(`/admin/kullanicilar/${k.id}`)} sayfaBoyut={25} />
    </RotaGuard>
  );
}
