"use client";

/** Ödeme makbuzu (yazdırılabilir). Veriler sunucudaki siparişten; mali değeri olan e-Arşiv faturanın yerine geçmez. */
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { paraYaz } from "@/lib/odeme/katalog";
import * as O from "@/lib/odeme/istemci";
import type { SiparisOzeti } from "@/lib/odeme/tipler";
import { SAGLAYICI_AD } from "@/lib/odeme/tipler";
import { useAuth } from "@/store/useAuth";

const tarihSaat = (t: number) => new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Makbuz({ params }: { params: Promise<{ no: string }> }) {
  const { no } = use(params);
  const esitlendi = useAuth((s) => s.esitlendi);
  const email = useAuth((s) => s.kullanici?.email ?? "");
  const ad = useAuth((s) => s.kullanici?.ad ?? "");
  const [s, setS] = useState<SiparisOzeti | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  useEffect(() => { if (esitlendi) void O.siparisGetir(no).then((r) => (r.ok ? setS(r.siparis) : setHata(r.hata))); }, [no, esitlendi]);

  if (hata) return <p className="px-6 py-20 text-center text-[14px] text-white/60">{hata}</p>;
  if (!s) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  const f = s.fatura;
  const alici = f ? (f.tip === "kurumsal" ? [f.unvan, `VKN ${f.vkn}, ${f.vergiDairesi} Vergi Dairesi`] : [f.adSoyad, f.tckn ? `TCKN ${f.tckn.slice(0, 3)}*****${f.tckn.slice(-3)}` : ""]) : [ad];
  const adres = f ? [f.adres, [f.ilce, f.il, f.postaKodu].filter(Boolean).join(" ")] : [];

  return (
    <div className="mx-auto max-w-[720px] px-5 py-10 print:p-0">
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link href="/panel/ayarlar/faturalar" className="inline-flex items-center gap-1.5 text-[13.5px] text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" />Faturalar</Link>
        <button type="button" onClick={() => print()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black"><Printer className="h-4 w-4" />Yazdır ya da PDF</button>
      </div>
      <article className="rounded-[20px] bg-white p-8 text-[13.5px] text-[#111] print:rounded-none">
        <header className="flex items-start justify-between border-b-2 border-[#111] pb-4">
          <div><p className="text-[22px] font-bold">Vayra</p><p className="text-[12px] text-[#666]">vayra.ai</p></div>
          <div className="text-right">
            <p className="font-semibold">Ödeme makbuzu</p>
            <p className="text-[12px] text-[#666]">{s.makbuzNo ?? "Makbuz numarası ödeme onaylanınca verilir"}</p>
            <p className="text-[12px] text-[#666]">{tarihSaat(s.odemeZamani ?? s.olusturma)}</p>
          </div>
        </header>
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div><p className="text-[11.5px] text-[#666]">Alıcı</p>{alici.filter(Boolean).map((x) => <p key={x}>{x}</p>)}{adres.filter(Boolean).map((x) => <p key={x}>{x}</p>)}</div>
          <div><p className="text-[11.5px] text-[#666]">Hesap</p><p className="break-all">{f?.eposta || email}</p><p className="mt-2 text-[11.5px] text-[#666]">Ödeme</p><p>{SAGLAYICI_AD[s.saglayici]}{s.kart ? `, ${s.kart}` : ""}{s.taksit ? `, ${s.taksit} taksit` : ""}</p></div>
        </div>
        <table className="mt-6 w-full border-collapse">
          <thead><tr className="text-left text-[11.5px] text-[#666]"><th className="border-b border-[#ddd] py-2 font-semibold">Açıklama</th><th className="border-b border-[#ddd] py-2 text-right font-semibold">Tutar</th></tr></thead>
          <tbody>
            <tr><td className="border-b border-[#eee] py-2.5">{s.ad}</td><td className="border-b border-[#eee] py-2.5 text-right tabular-nums">{paraYaz(s.liste, s.para)}</td></tr>
            {s.indirimler.map((x) => <tr key={x.ad}><td className="border-b border-[#eee] py-2.5">{x.ad}</td><td className="border-b border-[#eee] py-2.5 text-right tabular-nums">{paraYaz(x.tutar, s.para)} indirim</td></tr>)}
          </tbody>
        </table>
        <div className="ml-auto mt-4 w-full max-w-[300px] space-y-1 tabular-nums">
          <div className="flex justify-between"><span className="text-[#666]">Ara toplam</span><span>{paraYaz(s.net, s.para)}</span></div>
          {s.kdv > 0 && <div className="flex justify-between"><span className="text-[#666]">KDV, yüzde 20</span><span>{paraYaz(s.kdv, s.para)}</span></div>}
          <div className="flex justify-between border-t-2 border-[#111] pt-1.5 text-[16px] font-bold"><span>Toplam</span><span>{paraYaz(s.toplam, s.para)}</span></div>
          {s.tahsil && s.tahsil !== s.toplam && <div className="flex justify-between text-[12px] text-[#666]"><span>{s.taksit ? "Vade farkıyla tahsil edilen" : "Sağlayıcının tahsil ettiği"}</span><span>{paraYaz(s.tahsil, s.para)}</span></div>}
        </div>
        {s.durum === "iade" && <p className="mt-5 font-semibold text-[#b91c1c]">Bu ödeme iade edildi{s.iade ? `: ${paraYaz(s.iade.tutar, s.para)}, ${tarihSaat(s.iade.zaman)}` : ""}.</p>}
        {s.durum !== "odendi" && s.durum !== "iade" && <p className="mt-5 font-semibold text-[#b45309]">Bu sipariş ödenmedi; makbuz yerine geçmez.</p>}
        <p className="mt-8 text-[11px] leading-relaxed text-[#888]">
          Bu belge ödeme makbuzudur; mali değeri olan fatura yerine geçmez. e-Arşiv fatura entegrasyonu bu sürümde bağlı değil; fatura bilgilerin siparişle birlikte kayıtlı.
          {s.saglayici === "deneme" ? " Deneme ödemesi: para çekilmedi." : s.mod === "test" ? " Test ödemesi: para çekilmedi." : ""} Sipariş {s.no}.
        </p>
      </article>
    </div>
  );
}
