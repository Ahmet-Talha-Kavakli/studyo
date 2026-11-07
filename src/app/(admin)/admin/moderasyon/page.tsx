"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Ban, ListFilter, ScrollText } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { AD, AramaKutu, BolumBaslik, Bos, FiltreCip, HataKutusu, Kart, KartBaslik, MetrikKart, Rozet, Yukleniyor } from "@/components/admin/ui/temel";
import { BasitTablo, hucre, satirSinif } from "@/components/admin/ui/BasitTablo";
import { YatayCubuk } from "@/components/admin/grafik";
import { useAdminVeri, sayi, tarihSaat } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";

interface Rapor {
  kayitlar: { zaman: number; kategori: string; istem: string; etiket: string }[];
  toplam: number;
  kategori: { kategori: string; etiket: string; sayi: number }[];
  kurallar: { kategori: string; kalip: number; mesaj: string; etiket: string }[];
  askida: { uid: string; email: string; ad: string; zaman: number; neden: string; admin: string }[];
}

export default function Moderasyon() {
  const { veri: r, hata, yenile } = useAdminVeri<Rapor>("/api/admin/moderasyon", 60_000);
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("hepsi");
  const [goster, setGoster] = useState(false);
  const l = useMemo(() => (r ? r.kayitlar.filter((k) => (kat === "hepsi" || k.kategori === kat) && (!q.trim() || k.istem.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")))) : []), [r, q, kat]);
  const gun = r ? r.kayitlar.filter((k) => k.zaman > Date.now() - 86_400_000).length : 0;

  return (
    <RotaGuard modul="moderasyon">
      <BolumBaslik baslik="Moderasyon" ozet="Sunucuda içerik denetiminin engellediği istemler ve askıya alınan hesaplar. Engellenen istem için kredi düşmez." ikon={ShieldAlert} />
      {hata && <HataKutusu hata={hata} yenile={yenile} />}
      {!r && !hata && <Yukleniyor satir={3} />}
      {r && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Engellenen istem" deger={sayi(r.toplam)} ikon={ShieldAlert} alt={`son 24 saat ${sayi(gun)}`} />
            <MetrikKart etiket="En sık kategori" deger={r.kategori[0]?.etiket ?? "Yok"} ikon={ListFilter} alt={r.kategori[0] ? `${sayi(r.kategori[0].sayi)} istem` : "henüz engel yok"} />
            <MetrikKart etiket="Askıdaki hesap" deger={sayi(r.askida.length)} ikon={Ban} />
            <MetrikKart etiket="Kural kategorisi" deger={sayi(r.kurallar.length)} ikon={ScrollText} alt={`${sayi(r.kurallar.reduce((a, k) => a + k.kalip, 0))} kalıp`} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Kart>
              <KartBaslik ikon={ListFilter}>Kategoriye göre</KartBaslik>
              {r.kategori.length ? <YatayCubuk veri={r.kategori.map((k) => ({ etiket: k.etiket, deger: k.sayi }))} renk="#f87171" /> : <p className={cn("text-sm", AD.metin3)}>Henüz engellenen istem yok.</p>}
            </Kart>
            <Kart className="lg:col-span-2">
              <KartBaslik ikon={Ban}>Askıdaki hesaplar</KartBaslik>
              {r.askida.length === 0 ? <p className={cn("text-sm", AD.metin3)}>Askıya alınmış hesap yok. Askıya almak için kullanıcı ayrıntısını aç.</p> : r.askida.map((h) => (
                <div key={h.uid} className="flex items-start justify-between gap-3 border-b border-[color:var(--ad-kenar)] py-2 text-[13px] last:border-0">
                  <div className="min-w-0"><Link href={`/admin/kullanicilar/${h.uid}`} className="text-[color:var(--ad-aksan)] hover:underline">{h.email}</Link><div className={cn("text-[12px]", AD.metin3)}>{h.neden}</div></div>
                  <div className={cn("shrink-0 text-right text-[12px]", AD.metin3)}>{tarihSaat(h.zaman)}<div>{h.admin}</div></div>
                </div>
              ))}
            </Kart>
          </div>

          <div className="mb-3 mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <h3 className={cn("text-sm font-bold", AD.metin)}>Engellenen istemler</h3>
            <AramaKutu deger={q} degis={setQ} yer="İstem içinde ara" className="lg:ml-auto lg:w-72" />
            <label className={cn("flex items-center gap-2 text-[13px]", AD.metin2)}><input type="checkbox" checked={goster} onChange={(e) => setGoster(e.target.checked)} /> İstem metnini göster</label>
          </div>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 ad-ince-scroll">
            <FiltreCip aktif={kat === "hepsi"} onClick={() => setKat("hepsi")}>Hepsi</FiltreCip>
            {r.kurallar.map((k) => <FiltreCip key={k.kategori} aktif={kat === k.kategori} onClick={() => setKat(k.kategori)}>{k.etiket}</FiltreCip>)}
          </div>
          {l.length === 0 ? <Bos ikon={ShieldAlert} baslik={r.toplam ? "Bu süzgeçle kayıt yok" : "Henüz engellenen istem yok"} ozet="Stüdyo ve Build uçlarında sunucunun engellediği istemler burada görünür. Kullanıcı kimliği tutulmaz." /> : (
            <BasitTablo baslik={["Zaman", "Kategori", "İstem"]} enAz={620}>
              {l.map((k, i) => (
                <tr key={i} className={satirSinif}>
                  <td className={cn(hucre, "whitespace-nowrap", AD.metin2)}>{tarihSaat(k.zaman)}</td>
                  <td className={hucre}><Rozet ton={k.kategori === "cocuk" ? "tehlike" : "uyari"}>{k.etiket}</Rozet></td>
                  <td className={cn(hucre, AD.metin2)}>{goster ? <span className="break-words">{k.istem}</span> : <span className={AD.metin3}>Gizli, {k.istem.length} karakter</span>}</td>
                </tr>
              ))}
            </BasitTablo>
          )}

          <h3 className={cn("mb-3 mt-6 text-sm font-bold", AD.metin)}>Kurallar</h3>
          <BasitTablo baslik={["Kategori", "Kalıp", "Kullanıcıya gösterilen mesaj"]} sag={[1]} enAz={620}>
            {r.kurallar.map((k) => (
              <tr key={k.kategori} className={satirSinif}>
                <td className={cn(hucre, AD.metin)}>{k.etiket}</td>
                <td className={cn(hucre, "text-right tabular-nums", AD.metin2)}>{k.kalip}</td>
                <td className={cn(hucre, AD.metin3)}>{k.mesaj}</td>
              </tr>
            ))}
          </BasitTablo>
          <p className={cn("mt-3 text-[12px]", AD.metin3)}>Kurallar kodda tanımlıdır (lib/moderasyon). Tarayıcıda yapılan ön denetim sunucuya ulaşmadığı için kaydedilmez.</p>
        </>
      )}
    </RotaGuard>
  );
}
