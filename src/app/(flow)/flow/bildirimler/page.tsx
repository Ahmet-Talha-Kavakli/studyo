"use client";

import { useMemo } from "react";
import Link from "next/link";
import { onizlemeArka } from "@/lib/utils";
import { prng, tohumla, goreceKisa, SIMDI, GUN, SAAT } from "@/lib/flow/cekirdek";
import { flowVeri } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { Avatar, KullaniciAdi, MaviDugme } from "@/components/flow/UI";

type Bildirim = { tur: "begeni" | "yorum" | "takip" | "etiket" | "mavitik"; kullaniciId?: string; metin: string; gonderiTohum?: string; kat?: string; zaman: number; };

export default function BildirimlerSayfa() {
  const s = useFlow();
  const e = flowVeri();

  const bildirimler = useMemo<Bildirim[]>(() => {
    const r = prng(tohumla("flow-bildirim"));
    const list: Bildirim[] = [];
    // mavi tik sonucu
    if (s.maviTik === "onayli") list.push({ tur: "mavitik", metin: "Tebrikler! Hesabın doğrulandı. Artık mavi tikin var.", zaman: SIMDI - 2 * SAAT });
    // seed bildirimler
    const turler: Bildirim["tur"][] = ["begeni", "yorum", "takip", "etiket", "begeni", "takip", "yorum", "begeni"];
    for (let i = 0; i < 24; i++) {
      const u = e.kullanicilar[Math.floor(r() * e.kullanicilar.length)];
      const tur = turler[i % turler.length];
      const metin = tur === "begeni" ? "gönderini beğendi." : tur === "yorum" ? `yorum yaptı: "${["Harika 🔥", "Çok iyi 👏", "Efsane", "Nasıl yaptın?"][Math.floor(r() * 4)]}"` : tur === "takip" ? "seni takip etmeye başladı." : "seni bir gönderide etiketledi.";
      list.push({ tur, kullaniciId: u.id, metin, gonderiTohum: tur !== "takip" ? `bildirim-${i}` : undefined, kat: "sinematik", zaman: SIMDI - Math.floor(r() * 7) * GUN - Math.floor(r() * 24) * SAAT });
    }
    return list.sort((a, b) => b.zaman - a.zaman);
  }, [s.maviTik]);

  // zaman gruplama
  const bugun = bildirimler.filter((b) => SIMDI - b.zaman < GUN);
  const buHafta = bildirimler.filter((b) => SIMDI - b.zaman >= GUN && SIMDI - b.zaman < 7 * GUN);
  const oncesi = bildirimler.filter((b) => SIMDI - b.zaman >= 7 * GUN);

  const Grup = ({ baslik, liste }: { baslik: string; liste: Bildirim[] }) => liste.length === 0 ? null : (
    <div className="mb-4">
      <div className="px-4 py-2 text-[15px] font-bold">{baslik}</div>
      {liste.map((b, i) => {
        const u = b.kullaniciId ? e.kullanicilar.find((x) => x.id === b.kullaniciId) : null;
        return (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.1]">
            {b.tur === "mavitik" ? <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3897f0]/15 text-[#3897f0] text-xl">✓</div>
              : u && <Link href={`/flow/u/${u.kadi}`}><Avatar tohum={u.avatarTohum} ad={u.ad} boyut={44} /></Link>}
            <div className="flex-1 text-[14px] leading-snug">
              {u && <Link href={`/flow/u/${u.kadi}`} className="font-semibold">{u.kadi}</Link>} <span className="text-white/85">{b.metin}</span>
              <span className="ml-1 text-white/40">{goreceKisa(b.zaman)}</span>
            </div>
            {b.tur === "takip" && u && <MaviDugme aktif={s.takipler[u.id]} onClick={() => s.takipEt(u.id)}>{s.takipler[u.id] ? "Takip ediliyor" : "Takip et"}</MaviDugme>}
            {b.gonderiTohum && <div className="h-11 w-11 rounded" style={{ background: onizlemeArka(b.gonderiTohum, b.kat ?? "sinematik") }} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto max-w-[600px] py-4">
      <h1 className="px-4 pb-2 text-[20px] font-bold">Bildirimler</h1>
      <Grup baslik="Bugün" liste={bugun} />
      <Grup baslik="Bu hafta" liste={buHafta} />
      <Grup baslik="Daha önce" liste={oncesi} />
    </div>
  );
}
