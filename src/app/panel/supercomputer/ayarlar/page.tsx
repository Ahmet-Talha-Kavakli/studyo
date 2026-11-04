"use client";

import { ScModelSecici } from "@/components/sc/ScSecici";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useHafiza } from "@/store/useHafiza";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { AyarBolum, AyarSatir, Anahtar } from "@/components/kabuk/sc/SCAyarParcalari";
import { useScTercih } from "@/store/useScTercih";
import { SC_MODELLER, SC_VARSAYILAN_MODEL } from "@/lib/scSohbet";
import { cn } from "@/lib/utils";

/** Küçük bölümlü seçim (Claude ayar dili). */
function Bolumlu<T extends string | number>({ deger, secenekler, onSec, etiket }: { deger: T; secenekler: [T, string][]; onSec: (v: T) => void; etiket: string }) {
  return (
    <div role="radiogroup" aria-label={etiket} className="flex rounded-[10px] bg-[var(--sc-zemin)] p-0.5 ring-1 ring-inset ring-[var(--sc-kenar)]">
      {secenekler.map(([v, ad]) => (
        <button key={String(v)} role="radio" aria-checked={deger === v} onClick={() => onSec(v)}
          className={cn("h-8 rounded-[8px] px-3 text-[13px] font-medium transition-colors", deger === v ? "bg-[var(--sc-yukselti)] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin-2)]")}>{ad}</button>
      ))}
    </div>
  );
}

/* ============================================================
   AYARLAR › GENEL — kişisel talimatlar (ChatGPT "özel talimatlar", Claude "kişisel tercihler"),
   görünüm ve yetenek tercihleri. Talimatlar her sohbette modele gider (geçici sohbet hariç);
   tercihler useScTercih'te tutulur ve sohbet ekranında gerçekten uygulanır.
   Önceki sürümdeki iki anahtar hiçbir şeyi değiştirmiyordu; kaldırıldı.
   ============================================================ */

const ALAN = "block w-full rounded-[12px] bg-[var(--sc-zemin)] px-3.5 py-2.5 text-[14.5px] leading-relaxed text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/60";

export default function GenelAyar() {
  const profil = useHafiza((s) => s.profil);
  const profilAyarla = useHafiza((s) => s.profilAyarla);
  const bellekSayisi = useHafiza((s) => (s.acik ? s.ogeler.filter((o) => !o.kapali).length : 0));
  const [taslak, setTaslak] = useState(profil ?? { hitap: "", is: "", tercih: "" });
  const t = useScTercih();
  useEffect(() => { if (profil) setTaslak(profil); }, [profil]);
  const degisti = JSON.stringify(taslak) !== JSON.stringify(profil);

  return (
    <div className="space-y-8">
      <AyarBolum baslik="Kişisel talimatlar" ozet="Usta her sohbette bunları bilerek yanıt verir. Geçici sohbetlerde kullanılmaz.">
        <div className="space-y-4 p-4">
          <label className="block text-[13.5px] font-medium text-[var(--sc-metin-2)]">Sana nasıl hitap edeyim?
            <input value={taslak.hitap} onChange={(e) => setTaslak({ ...taslak, hitap: e.target.value.slice(0, 60) })} placeholder="Ör. Ahmet" className={`mt-1.5 h-11 ${ALAN}`} />
          </label>
          <label className="block text-[13.5px] font-medium text-[var(--sc-metin-2)]">Ne iş yapıyorsun, neyle uğraşıyorsun?
            <textarea value={taslak.is} onChange={(e) => setTaslak({ ...taslak, is: e.target.value.slice(0, 600) })} rows={2} placeholder="Ör. Kadıköy'de butik bir kahve dükkânım var, sosyal medyasını kendim yönetiyorum." className={`mt-1.5 resize-none ${ALAN}`} />
          </label>
          <label className="block text-[13.5px] font-medium text-[var(--sc-metin-2)]">Yanıtlarda neyi önemsersin?
            <textarea value={taslak.tercih} onChange={(e) => setTaslak({ ...taslak, tercih: e.target.value.slice(0, 1500) })} rows={4} placeholder={"Ör. Kısa ve net yaz, önce sonucu söyle. Teknik terimleri açıkla.\nTabloları severim; emoji kullanma."} className={`mt-1.5 resize-none ${ALAN}`} />
            <span className="mt-1 block text-right text-[12px] tabular-nums text-[var(--sc-metin-3)]">{taslak.tercih.length.toLocaleString("tr")} / 1.500</span>
          </label>
          <div className="flex items-center justify-end gap-2">
            {degisti && <button onClick={() => setTaslak(profil)} className="h-9 rounded-full px-3.5 text-[13.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.05]">Vazgeç</button>}
            <button disabled={!degisti} onClick={() => { profilAyarla({ hitap: taslak.hitap.trim(), is: taslak.is.trim(), tercih: taslak.tercih.trim() }); toast.success("Kişisel talimatlar kaydedildi"); }}
              className="h-9 rounded-full bg-[var(--sc-metin)] px-4 text-[13.5px] font-semibold text-[#111113] transition-opacity disabled:opacity-40">Kaydet</button>
          </div>
        </div>
      </AyarBolum>

      <AyarBolum baslik="Bellek" ozet="Usta'nın senin hakkında hatırladıkları.">
        <AyarSatir ad={bellekSayisi ? `${bellekSayisi} bilgi kullanılıyor` : "Henüz bir şey hatırlanmıyor"} ozet={'Sohbette "bunu hatırla: …" yazarak da ekleyebilirsin.'}>
          <Link href="/panel/supercomputer/ayarlar/hafiza" className="flex h-9 items-center rounded-full px-3.5 text-[13.5px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-[var(--sc-kenar)] hover:bg-white/[0.05]">Belleği yönet</Link>
        </AyarSatir>
      </AyarBolum>

      <AyarBolum baslik="Görünüm" ozet="Yanıtların nasıl görüneceği.">
        <AyarSatir ad="Yanıt yazı tipi" ozet={t.yaziTipi === "serif" ? "Tırnaklı, kitap gibi okunur" : "Sade, arayüzle aynı"}>
          <Bolumlu etiket="Yanıt yazı tipi" deger={t.yaziTipi} secenekler={[["serif", "Tırnaklı"], ["sans", "Sade"]]} onSec={(v) => t.ayarla({ yaziTipi: v })} />
        </AyarSatir>
        <AyarSatir ad="Yazı boyutu">
          <Bolumlu etiket="Yazı boyutu" deger={t.yaziBoyutu} secenekler={[["kucuk", "Küçük"], ["orta", "Orta"], ["buyuk", "Büyük"]]} onSec={(v) => t.ayarla({ yaziBoyutu: v })} />
        </AyarSatir>
        <AyarSatir ad="Geniş sohbet" ozet="Sohbet sütunu geniş ekranda daha fazla yer kaplar.">
          <Anahtar acik={t.genis} onDegis={(v) => t.ayarla({ genis: v })} etiket="Geniş sohbet" />
        </AyarSatir>
        <AyarSatir ad="Düşünme özetini açık göster" ozet="Biten düşünme kutuları kapalı yerine açık gelir.">
          <Anahtar acik={t.dusunmeAcik} onDegis={(v) => t.ayarla({ dusunmeAcik: v })} etiket="Düşünme özetini açık göster" />
        </AyarSatir>
      </AyarBolum>

      <AyarBolum baslik="Yetenekler" ozet="Yeni sohbetlerin nasıl başlayacağı ve sohbet davranışı.">
        <AyarSatir ad="Varsayılan model" ozet="Yeni sohbetler bu modelle başlar; sohbet içinde değiştirebilirsin.">
          <ScModelSecici deger={t.varsayilanModel ?? SC_VARSAYILAN_MODEL} onSec={(v) => t.ayarla({ varsayilanModel: v })} />
        </AyarSatir>
        <AyarSatir ad="Web araması varsayılan açık" ozet="Yeni sohbetlerde güncel bilgi için web'de arar.">
          <Anahtar acik={t.varsayilanWeb} onDegis={(v) => t.ayarla({ varsayilanWeb: v })} etiket="Web araması varsayılan açık" />
        </AyarSatir>
        <AyarSatir ad="Uzun düşünme varsayılan açık" ozet="Yanıtlar daha yavaş ama daha derin olur.">
          <Anahtar acik={t.varsayilanDusun} onDegis={(v) => t.ayarla({ varsayilanDusun: v })} etiket="Uzun düşünme varsayılan açık" />
        </AyarSatir>
        <AyarSatir ad="Takip soruları öner" ozet="Her yanıtın altında sorabileceğin üç soru gösterir.">
          <Anahtar acik={t.oneriler} onDegis={(v) => t.ayarla({ oneriler: v })} etiket="Takip soruları öner" />
        </AyarSatir>
        <AyarSatir ad="Yanıt bitince bildir" ozet={typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied" ? "Tarayıcı bildirimleri engellenmiş; site ayarlarından izin ver." : "Başka sekmedeyken yanıt hazır olunca bildirim gönderir."}>
          <Anahtar acik={t.bildirim} etiket="Yanıt bitince bildir" onDegis={async (v) => {
            if (!v) { t.ayarla({ bildirim: false }); return; }
            if (!("Notification" in window)) { toast.error("Bildirim desteklenmiyor", { description: "Bu tarayıcı masaüstü bildirimi göstermiyor. Güncel bir tarayıcıyla yeniden dene." }); return; }
            const izin = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
            if (izin === "granted") { t.ayarla({ bildirim: true }); toast.success("Bildirimler açıldı"); } else mesaj.izinGerekli("Bildirim");
          }} />
        </AyarSatir>
        <AyarSatir ad="Enter ile gönder" ozet={t.enterGonder ? "Enter gönderir, Shift+Enter yeni satır." : "Ctrl+Enter gönderir, Enter yeni satır."}>
          <Anahtar acik={t.enterGonder} onDegis={(v) => t.ayarla({ enterGonder: v })} etiket="Enter ile gönder" />
        </AyarSatir>
        <AyarSatir ad="Sesli okuma hızı" ozet="Sesli oku ve sesli sohbet için.">
          <Bolumlu etiket="Sesli okuma hızı" deger={t.sesHizi} secenekler={[[0.85, "Yavaş"], [1.04, "Normal"], [1.25, "Hızlı"]]} onSec={(v) => t.ayarla({ sesHizi: v })} />
        </AyarSatir>
      </AyarBolum>
    </div>
  );
}
