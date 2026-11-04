"use client";

import { useState } from "react";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

/**
 * Kullanıcı avatarı: yüklenmiş fotoğraf varsa o; yoksa el çizimi bir illüstrasyon avatar
 * (DiceBear "notionists"). Tohum e-postanın özetidir — e-posta dışarı gitmez, her hesap
 * rastgele ama hep aynı avatarı alır. Görsel yüklenemezse baş harfe düşer.
 */
const ZEMINLER = ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "c7f0db"];

function ozet(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

export function avatarAdresi(tohum: string) {
  const t = ozet(tohum.trim().toLowerCase() || "vayra");
  const zemin = ZEMINLER[parseInt(t.slice(-2), 36) % ZEMINLER.length];
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${t}&backgroundColor=${zemin}&radius=50`;
}

export function KullaniciAvatar({ boyut = 32, className }: { boyut?: number; className?: string }) {
  const kullanici = useAuth((s) => s.kullanici);
  const [hata, setHata] = useState(false);
  const basHarf = (kullanici?.ad?.trim()[0] ?? "V").toLocaleUpperCase("tr-TR");
  const kaynak = kullanici?.avatar || (!hata ? avatarAdresi(kullanici?.email ?? kullanici?.ad ?? "") : null);
  if (!kaynak) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7dd3fc] to-[#55d6fd] font-bold text-[#03141a]", className)}
        style={{ width: boyut, height: boyut, fontSize: Math.round(boyut * 0.42) }}>{basHarf}</span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={kaynak} alt="" draggable={false} onError={() => setHata(true)}
      className={cn("shrink-0 rounded-full bg-white/[0.06] object-cover", className)} style={{ width: boyut, height: boyut }} />
  );
}
