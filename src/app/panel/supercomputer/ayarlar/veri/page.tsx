"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Link2, Trash2 } from "lucide-react";
import { useSupercomputer } from "@/store/useSupercomputer";
import { toast } from "@/lib/toast";
import { AyarBolum, AyarSatir, AyarButon, BosDurum } from "@/components/kabuk/sc/SCAyarParcalari";

/* ============================================================
   AYARLAR › VERİ VE GİZLİLİK — ChatGPT "Veri denetimleri" / Claude "Gizlilik".
   Paylaşılan bağlantılar (kaldırılabilir), arşiv, dışa aktarma ve toplu silme.
   Sohbetler bu tarayıcıda saklanır; paylaşılan kopyalar sunucuda durur.
   ============================================================ */

export default function VeriAyar() {
  const sohbetler = useSupercomputer((s) => s.sohbetler);
  const { sohbetGuncelle, sohbetleriTemizle } = useSupercomputer.getState();
  const [silOnay, setSilOnay] = useState(false);
  const [arsivOnay, setArsivOnay] = useState(false);
  const kayitli = sohbetler.filter((s) => !s.gecici);
  const paylasilan = kayitli.filter((s) => s.paylasim).sort((a, b) => (b.paylasim!.zaman) - (a.paylasim!.zaman));
  const arsiv = kayitli.filter((s) => s.arsiv).length;

  const kaldir = async (id: string) => {
    const s = useSupercomputer.getState().sohbetler.find((x) => x.id === id); if (!s?.paylasim) return;
    await fetch("/api/sc/paylas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.paylasim.id, anahtar: s.paylasim.anahtar }) }).catch(() => {});
    sohbetGuncelle(id, { paylasim: undefined }); toast.success("Paylaşım kaldırıldı", { description: "Paylaşım bağlantısı artık açılmıyor." });
  };
  const disaAktar = () => {
    const veri = JSON.stringify({ surum: 1, tarih: new Date().toISOString(), sohbetler: kayitli }, null, 2);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([veri], { type: "application/json" })); a.download = `supercomputer-sohbetler-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); toast.success("Sohbetlerin indirildi", { description: `${kayitli.length} sohbet JSON dosyası olarak kaydedildi.` });
  };

  return (
    <div className="space-y-8">
      <AyarBolum baslik="Paylaşılan bağlantılar" ozet="Herkese açık salt okunur kopyalar. Kaldırınca bağlantı artık açılmaz.">
        {paylasilan.length === 0 ? <BosDurum ikon={Link2} baslik="Paylaşılan sohbet yok" ozet="Bir sohbetin üst çubuğundaki Paylaş ile bağlantı oluşturabilirsin." /> : paylasilan.map((s) => (
          <AyarSatir key={s.id} ad={s.baslik} ozet={`Paylaşıldı · ${new Date(s.paylasim!.zaman).toLocaleDateString("tr", { day: "numeric", month: "long", year: "numeric" })}`}>
            <span className="flex items-center gap-1">
              <a href={`/s/${s.paylasim!.id}`} target="_blank" rel="noopener noreferrer" aria-label="Bağlantıyı aç" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><ExternalLink className="h-4 w-4" /></a>
              <button onClick={() => void kaldir(s.id)} aria-label="Paylaşımı kaldır" className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
            </span>
          </AyarSatir>
        ))}
      </AyarBolum>

      <AyarBolum baslik="Sohbet verileri" ozet={`${kayitli.length} sohbet bu tarayıcıda kayıtlı${arsiv ? `, ${arsiv} tanesi arşivde` : ""}. Geçici sohbetler hiç kaydedilmez.`}>
        <AyarSatir ad="Sohbetleri yönet" ozet="Ara, arşivle, toplu sil ya da projeye taşı.">
          <Link href="/panel/supercomputer/sohbetler" className="flex h-9 items-center rounded-lg px-3.5 text-[13.5px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-[var(--sc-kenar)] hover:bg-white/[0.05]">Sohbetler</Link>
        </AyarSatir>
        <AyarSatir ad="Tümünü arşivle" ozet="Kenar çubuğunu temizler; sohbetler Arşiv'de kalır.">
          {arsivOnay ? <span className="flex gap-2"><AyarButon ikincil onClick={() => setArsivOnay(false)}>Vazgeç</AyarButon><AyarButon onClick={() => { const acikIdler = kayitli.filter((s) => !s.arsiv).map((s) => s.id); kayitli.forEach((s) => sohbetGuncelle(s.id, { arsiv: true })); setArsivOnay(false); toast.success("Tüm sohbetler arşivlendi", { action: { label: "Geri al", onClick: () => acikIdler.forEach((id) => sohbetGuncelle(id, { arsiv: false })) } }); }}>Arşivle</AyarButon></span>
            : <AyarButon ikincil disabled={kayitli.length === arsiv} onClick={() => setArsivOnay(true)}>Tümünü arşivle</AyarButon>}
        </AyarSatir>
        <AyarSatir ad="Verilerini dışa aktar" ozet="Tüm sohbetlerini JSON dosyası olarak indir.">
          <AyarButon ikincil disabled={!kayitli.length} onClick={disaAktar}>İndir</AyarButon>
        </AyarSatir>
        <AyarSatir ad="Tüm sohbetleri sil" ozet="Geri alınamaz; sohbet geçmişin tamamen silinir. Paylaşılan kopyalar ayrıca kaldırılmalıdır.">
          {silOnay ? <span className="flex gap-2"><AyarButon ikincil onClick={() => setSilOnay(false)}>Vazgeç</AyarButon><AyarButon tehlike onClick={() => { sohbetleriTemizle(); setSilOnay(false); toast("Tüm sohbetler silindi", { description: "Kayıtlı sohbet geçmişin temizlendi." }); }}>Evet, sil</AyarButon></span>
            : <AyarButon tehlike disabled={!kayitli.length} onClick={() => setSilOnay(true)}>Sohbetleri sil</AyarButon>}
        </AyarSatir>
      </AyarBolum>

      <AyarBolum baslik="Bellek ve kişiselleştirme" ozet="Usta'nın hatırladıkları ve talimatların.">
        <AyarSatir ad="Bellek" ozet="Hatırlanan bilgileri gör, düzenle ya da kapat.">
          <Link href="/panel/supercomputer/ayarlar/hafiza" className="flex h-9 items-center rounded-lg px-3.5 text-[13.5px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-[var(--sc-kenar)] hover:bg-white/[0.05]">Belleği yönet</Link>
        </AyarSatir>
      </AyarBolum>
    </div>
  );
}
