"use client";

import { useState } from "react";
import { Brain, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useHafiza } from "@/store/useHafiza";
import { toast } from "@/lib/toast";
import { AyarBolum, AyarSatir, Anahtar, BosDurum } from "@/components/kabuk/sc/SCAyarParcalari";
import { cn } from "@/lib/utils";

/* ============================================================
   AYARLAR › HAFIZA — Claude'un hafıza ekranı.

   Claude'da hafıza görünür ve düzenlenebilir bir ayardır: ana anahtar,
   hatırlanan bilgilerin listesi, tek tek düzenleme/kapatma/silme ve toplu
   temizleme. (Bu ekran Higgsfield sürümünde "otomatik yönetiliyor" denip
   kaldırılmış, rota Supercomputer'a yönlendiriyordu — geri getirildi.)
   ============================================================ */

export default function HafizaAyar() {
  const acik = useHafiza((s) => s.acik);
  const ogeler = useHafiza((s) => s.ogeler);
  const { acikAyarla, ekle, guncelle, degistir, sil, tumunuSil } = useHafiza();

  const [yeni, setYeni] = useState("");
  const [duzenId, setDuzenId] = useState<string | null>(null);
  const [duzenMetin, setDuzenMetin] = useState("");

  const kaydet = () => {
    const t = yeni.trim();
    if (t.length < 3) return;
    ekle(t);
    setYeni("");
    toast("Hafızaya eklendi");
  };

  const duzenBitir = () => {
    const t = duzenMetin.trim();
    if (duzenId && t.length >= 3) {
      guncelle(duzenId, t);
      toast("Güncellendi");
    }
    setDuzenId(null);
  };

  return (
    <div className="space-y-6">
      <AyarBolum
        baslik="Hafıza"
        ozet="Supercomputer seninle ilgili önemli bilgileri hatırlar ve yeni sohbetlerde kullanır."
      >
        <AyarSatir
          ad="Hafızayı kullan"
          ozet={acik ? "Hatırlanan bilgiler her yeni sohbete eklenir." : "Bilgiler saklanır ama isteme eklenmez."}
        >
          <Anahtar acik={acik} onDegis={(v) => { acikAyarla(v); toast(v ? "Hafıza açıldı" : "Hafıza kapatıldı"); }} etiket="Hafızayı kullan" />
        </AyarSatir>
      </AyarBolum>

      <AyarBolum
        baslik="Hatırlananlar"
        ozet={`${ogeler.length} bilgi saklanıyor.`}
        sagUst={ogeler.length > 0 ? (
          <button
            onClick={() => { tumunuSil(); toast("Hafıza temizlendi"); }}
            className="rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--sc-promo)] transition-colors hover:bg-[var(--sc-promo)]/10">
            Tümünü sil
          </button>
        ) : undefined}
      >
        {/* Yeni bilgi ekleme — Claude'da hafızaya elle de yazılabilir. */}
        <div className="flex flex-col gap-2 border-b border-[var(--sc-kenar)] px-4 py-3.5 sm:flex-row sm:items-center">
          <input
            value={yeni}
            onChange={(e) => setYeni(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") kaydet(); }}
            placeholder="Supercomputer'ın hatırlamasını istediğin bir şey yaz…"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] px-3 text-[14px] text-[var(--sc-metin)] outline-none transition-colors placeholder:text-[var(--sc-metin-3)] focus:border-[var(--sc-aksan)]"
          />
          <button
            onClick={kaydet}
            disabled={yeni.trim().length < 3}
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--sc-aksan)] px-3.5 text-[13.5px] font-medium text-[var(--sc-aksan-metin)] transition-opacity hover:opacity-90 disabled:opacity-40">
            <Plus className="h-4 w-4" strokeWidth={2.2} /> Ekle
          </button>
        </div>

        {ogeler.length === 0 ? (
          <BosDurum
            ikon={Brain}
            baslik="Henüz bir şey hatırlanmıyor"
            ozet="Sohbet ettikçe önemli bilgiler burada birikir, ya da yukarıdan elle ekleyebilirsin."
          />
        ) : (
          <ul>
            {ogeler.map((o) => (
              <li key={o.id}
                className="group flex items-start gap-3 border-b border-[var(--sc-kenar)] px-4 py-3.5 last:border-b-0">
                {duzenId === o.id ? (
                  /* Düzenleme kipi — satır yerinde input'a döner. */
                  <>
                    <input
                      autoFocus
                      value={duzenMetin}
                      onChange={(e) => setDuzenMetin(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") duzenBitir();
                        if (e.key === "Escape") setDuzenId(null);
                      }}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--sc-aksan)] bg-[var(--sc-zemin)] px-2.5 text-[14px] text-[var(--sc-metin)] outline-none"
                    />
                    <button onClick={duzenBitir} aria-label="Kaydet"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--sc-aksan)] transition-colors hover:bg-[var(--sc-cip)]">
                      <Check className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                    <button onClick={() => setDuzenId(null)} aria-label="İptal"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)]">
                      <X className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  </>
                ) : (
                  <>
                    <p className={cn(
                      "min-w-0 flex-1 text-[14px] leading-relaxed",
                      o.kapali ? "text-[var(--sc-metin-3)] line-through" : "text-[var(--sc-metin-2)]",
                    )}>
                      {o.metin}
                    </p>
                    {/* Eylemler hover'da belirir; klavye odağında da görünür. */}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <button
                        onClick={() => { setDuzenId(o.id); setDuzenMetin(o.metin); }}
                        aria-label="Düzenle"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]">
                        <Pencil className="h-[15px] w-[15px]" strokeWidth={1.9} />
                      </button>
                      <button
                        onClick={() => sil(o.id)}
                        aria-label="Sil"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-promo)]/10 hover:text-[var(--sc-promo)]">
                        <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.9} />
                      </button>
                    </div>
                    {/* Öğe bazında kullan/kullanma — silmeden devre dışı bırakma. */}
                    <Anahtar
                      acik={!o.kapali}
                      onDegis={() => degistir(o.id)}
                      etiket={o.kapali ? "Bu bilgiyi kullan" : "Bu bilgiyi kullanma"}
                      kucuk
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </AyarBolum>
    </div>
  );
}
