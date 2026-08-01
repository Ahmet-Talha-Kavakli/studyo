"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { prng, tohumla, goreceKisa, SIMDI, GUN, SAAT } from "@/lib/flow/cekirdek";
import { flowVeri } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { Avatar, KullaniciAdi, MaviDugme, cn } from "./UI";

/** Instagram bildirim paneli — sidebar yanından açılır (ayrı sayfa değil). */
type BTur = "begeni" | "yorum" | "takip" | "etiket" | "mavitik";
type Bildirim = { tur: BTur; kullaniciId?: string; metin: string; gonderiTohum?: string; kat?: string; zaman: number };

const FILTRELER = [
  { k: "tumu", ad: "Tümü" }, { k: "takip", ad: "Takip ettiğin kişiler" },
  { k: "yorum", ad: "Yorumlar" }, { k: "takipci", ad: "Takipler" },
];

export function BildirimPanel({ onKapat }: { onKapat: () => void }) {
  const s = useFlow();
  const e = flowVeri();
  const [filtre, setFiltre] = useState("tumu");

  const bildirimler = useMemo<Bildirim[]>(() => {
    const r = prng(tohumla("flow-bildirim"));
    const list: Bildirim[] = [];
    if (s.maviTik === "onayli") list.push({ tur: "mavitik", metin: "Tebrikler! Hesabın doğrulandı. Artık mavi tikin var.", zaman: SIMDI - 2 * SAAT });
    const turler: BTur[] = ["begeni", "yorum", "takip", "etiket", "begeni", "takip", "yorum", "begeni"];
    for (let i = 0; i < 22; i++) {
      const u = e.kullanicilar[Math.floor(r() * e.kullanicilar.length)];
      const tur = turler[i % turler.length];
      const metin = tur === "begeni" ? "gönderini beğendi." : tur === "yorum" ? `yorum yaptı: "${["Harika 🔥", "Çok iyi 👏", "Efsane", "Nasıl yaptın?"][Math.floor(r() * 4)]}"` : tur === "takip" ? "seni takip etmeye başladı." : "seni bir gönderide etiketledi.";
      list.push({ tur, kullaniciId: u.id, metin, gonderiTohum: tur !== "takip" ? `bildirim-${i}` : undefined, kat: "sinematik", zaman: SIMDI - Math.floor(r() * 7) * GUN - Math.floor(r() * 24) * SAAT });
    }
    return list.sort((a, b) => b.zaman - a.zaman);
  }, [s.maviTik, e]);

  const filtreli = useMemo(() => {
    if (filtre === "yorum") return bildirimler.filter((b) => b.tur === "yorum");
    if (filtre === "takipci") return bildirimler.filter((b) => b.tur === "takip");
    if (filtre === "takip") return bildirimler.filter((b) => b.kullaniciId && s.takipler[b.kullaniciId]);
    return bildirimler;
  }, [bildirimler, filtre, s.takipler]);

  const oneriler = useMemo(() => e.kullanicilar.filter((k) => !s.takipler[k.id]).slice(0, 7), [e, s.takipler]);

  const bugun = filtreli.filter((b) => SIMDI - b.zaman < GUN);
  const buHafta = filtreli.filter((b) => SIMDI - b.zaman >= GUN && SIMDI - b.zaman < 7 * GUN);
  const oncesi = filtreli.filter((b) => SIMDI - b.zaman >= 7 * GUN);

  const Satir = ({ b }: { b: Bildirim }) => {
    const u = b.kullaniciId ? e.kullanicilar.find((x) => x.id === b.kullaniciId) : null;
    return (
      <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.06]">
        {b.tur === "mavitik" ? <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3897f0]/15 text-[18px] text-[#3897f0]">✓</div>
          : u && <Link href={`/flow/u/${u.kadi}`} onClick={onKapat}><Avatar tohum={u.avatarTohum} ad={u.ad} boyut={44} /></Link>}
        <div className="min-w-0 flex-1 text-[13px] leading-snug">
          {u && <Link href={`/flow/u/${u.kadi}`} onClick={onKapat} className="font-semibold">{u.kadi}</Link>} <span className="text-white/85">{b.metin}</span> <span className="text-white/40">{goreceKisa(b.zaman)}</span>
        </div>
        {b.tur === "takip" && u && <MaviDugme aktif={s.takipler[u.id]} onClick={() => s.takipEt(u.id)}>{s.takipler[u.id] ? "Takip ediliyor" : "Takip et"}</MaviDugme>}
        {b.gonderiTohum && u && <Link href={`/flow/u/${u.kadi}`} onClick={onKapat} className="h-10 w-10 shrink-0 overflow-hidden rounded transition-opacity hover:opacity-80" style={{ background: onizlemeArka(b.gonderiTohum, b.kat ?? "sinematik") }} />}
      </div>
    );
  };

  const Grup = ({ baslik, liste }: { baslik: string; liste: Bildirim[] }) => liste.length === 0 ? null : (
    <div className="mb-4">
      <div className="px-2 pb-1.5 pt-2 text-[15px] font-bold">{baslik}</div>
      {liste.map((b, i) => <Satir key={i} b={b} />)}
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <h1 className="px-2 pb-4 text-[24px] font-bold">Bildirimler</h1>
      {/* filtreler */}
      <div className="mb-2 flex flex-wrap gap-2 px-2">
        {FILTRELER.map((f) => (
          <button key={f.k} onClick={() => setFiltre(f.k)}
            className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors", filtre === f.k ? "bg-white text-black" : "bg-white/[0.06] text-white hover:bg-white/[0.1]")}>
            {f.ad}
          </button>
        ))}
      </div>

      {filtreli.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80"><Heart className="h-7 w-7" /></div>
          <div className="text-[20px] font-bold">Gönderilerindeki Hareketler</div>
          <p className="max-w-xs text-[13px] text-white/50">Biri gönderilerinden birini beğendiğinde veya yorum yaptığında, burada göreceksin.</p>
        </div>
      ) : (
        <>
          <Grup baslik="Bugün" liste={bugun} />
          <Grup baslik="Bu hafta" liste={buHafta} />
          <Grup baslik="Daha önce" liste={oncesi} />
        </>
      )}

      {/* öneriler */}
      <div className="mt-2">
        <div className="px-2 pb-2 text-[15px] font-bold text-white/60">Senin için önerilenler</div>
        {oneriler.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 px-2 py-2">
            <Link href={`/flow/u/${u.kadi}`} onClick={onKapat}><Avatar tohum={u.avatarTohum} ad={u.ad} boyut={44} /></Link>
            <div className="min-w-0 flex-1">
              <Link href={`/flow/u/${u.kadi}`} onClick={onKapat}><KullaniciAdi kadi={u.kadi} onayli={u.onayli} className="text-[13px]" /></Link>
              <div className="truncate text-[12px] text-white/45">{u.ad}</div>
              <div className="text-[12px] text-white/35">{i % 3 === 1 ? "Senin için öneriliyor" : "Popüler"}</div>
            </div>
            <MaviDugme aktif={s.takipler[u.id]} onClick={() => s.takipEt(u.id)}>{s.takipler[u.id] ? "Takip ediliyor" : "Takip Et"}</MaviDugme>
          </div>
        ))}
        <Link href="/flow/oneriler" onClick={onKapat} className="mt-2 block py-2 text-center text-[13px] font-semibold text-[#0095f6] hover:text-white">Tüm Önerileri Gör</Link>
      </div>
    </div>
  );
}
