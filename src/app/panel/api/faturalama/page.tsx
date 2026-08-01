"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard, Plus, Trash2, X, Check, Wallet, Receipt, ShieldCheck, Zap,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/useAuth";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { BosDurum, MetrikKart, SayfaBaslik } from "@/components/api/parcalar";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { cn } from "@/lib/utils";

/* ============================================================
   FATURALAMA — Higgsfield Cloud "Billing" birebir.
   Bakiye · Hızlı işlem (Kredi Yükle modalı: 4 paket + özel tutar) ·
   Ödeme yöntemleri · Otomatik yükleme · Satın alma geçmişi.
   GERÇEK: krediSatinAl + auth.ekKrediEkle bakiyeyi gerçekten artırır.
   ============================================================ */

const PAKETLER = [
  { kredi: 500, tutar: 449 },
  { kredi: 800, tutar: 699, pop: true },
  { kredi: 1600, tutar: 1299 },
  { kredi: 4000, tutar: 2999 },
];

/** 1 ₺ ≈ kaç kredi (özel tutar hesabı için) */
const KREDI_BASINA_TL = 0.85;

export default function Faturalama() {
  const { kullanici, ekKrediEkle } = useAuth();
  const {
    odemeYontemleri, satinAlmalar, otomatikYukle, cagrilar,
    odemeEkle, odemeSil, otomatikYukleAyarla, krediSatinAl,
  } = useApiAnahtar();

  const [yukleModal, setYukleModal] = useState(false);
  const [kartModal, setKartModal] = useState(false);
  const [secilenPaket, setSecilenPaket] = useState<number | null>(1);
  const [ozelKredi, setOzelKredi] = useState("");
  const [kartNo, setKartNo] = useState("");
  const [kartSon, setKartSon] = useState("");

  useScrollKilit(yukleModal || kartModal);
  useEscKapat(yukleModal || kartModal, () => {
    if (kartModal) setKartModal(false);
    else setYukleModal(false);
  });

  const buAyHarcanan = useMemo(() => {
    const ayBas = new Date();
    ayBas.setDate(1); ayBas.setHours(0, 0, 0, 0);
    return cagrilar.filter((c) => c.zaman >= ayBas.getTime()).reduce((a, c) => a + c.kredi, 0);
  }, [cagrilar]);

  const kartEkle = () => {
    const rakam = kartNo.replace(/\s/g, "");
    if (rakam.length < 15 || !/^\d+$/.test(rakam)) return toast.error("Geçerli bir kart numarası gir.");
    const m = kartSon.match(/^(\d{1,2})\s*\/\s*(\d{2})$/);
    if (!m) return toast.error("Son kullanım AA/YY biçiminde olmalı.");
    const marka = rakam.startsWith("4") ? "visa" : rakam.startsWith("3") ? "amex" : "mastercard";
    odemeEkle({ marka, son4: rakam.slice(-4), ay: Number(m[1]), yil: Number(m[2]) });
    setKartNo(""); setKartSon(""); setKartModal(false);
    toast.success("Ödeme yöntemi eklendi", { description: `${marka.toUpperCase()} ···· ${rakam.slice(-4)}` });
  };

  const odemeyeGec = () => {
    const ozel = Number(ozelKredi);
    const kredi = ozelKredi.trim() ? ozel : (secilenPaket !== null ? PAKETLER[secilenPaket].kredi : 0);
    if (!kredi || kredi < 50) return toast.error("En az 50 kredi seçmelisin.");
    const tutar = ozelKredi.trim()
      ? Math.round(kredi * KREDI_BASINA_TL)
      : PAKETLER[secilenPaket!].tutar;

    if (odemeYontemleri.length === 0) {
      setYukleModal(false);
      setKartModal(true);
      return toast.error("Önce bir ödeme yöntemi ekle.");
    }

    krediSatinAl(kredi, tutar);
    ekKrediEkle(kredi); // GERÇEK bakiye artışı
    setYukleModal(false);
    setOzelKredi("");
    toast.success(`${kredi.toLocaleString("tr")} kredi yüklendi`, {
      description: `₺${tutar} · ${odemeYontemleri[0].marka.toUpperCase()} ···· ${odemeYontemleri[0].son4}`,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="Faturalama" ozet="Faturalama, kredi ve ödeme bilgilerini yönet" />

      <div className="grid gap-3 lg:grid-cols-3">
        <MetrikKart
          deger={(kullanici?.krediler ?? 0).toLocaleString("tr")}
          etiket="Bakiye"
          alt="kullanılabilir kredi"
          ikon={<Wallet className="h-4 w-4 text-aksan" />}
          vurgulu
        />
        <MetrikKart
          deger={buAyHarcanan.toLocaleString("tr")}
          etiket="Bu Ay Kullanılan"
          alt="API üzerinden harcanan kredi"
          ikon={<Zap className="h-4 w-4 text-violet-300" />}
        />
        <div className="flex flex-col justify-center rounded-2xl border border-white/[0.06] bg-yuzey p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-metin-3">Hızlı İşlem</div>
          <button
            data-kredi-yukle
            onClick={() => setYukleModal(true)}
            className="hf-btn flex items-center justify-center gap-1.5 rounded-xl bg-aksan py-2.5 text-sm font-bold text-[#12140c]"
          >
            <Plus className="h-4 w-4" /> Kredi Yükle
          </button>
        </div>
      </div>

      {/* Ödeme yöntemleri + otomatik yükleme */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-metin">Ödeme Yöntemleri</h3>
              <p className="text-xs text-metin-2">Kayıtlı kartlarını yönet</p>
            </div>
            <button
              onClick={() => setKartModal(true)}
              className="hf-btn glass-cip flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-metin"
            >
              <Plus className="h-4 w-4" /> Kart Ekle
            </button>
          </div>
          {odemeYontemleri.length === 0 ? (
            <BosDurum
              ikon={<CreditCard className="h-7 w-7" />}
              baslik="Kayıtlı ödeme yöntemi yok"
              ozet="Hızlı ödeme ve otomatik yükleme için kart ekle."
            />
          ) : (
            <div className="space-y-2">
              {odemeYontemleri.map((y) => (
                <div
                  key={y.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-yuzey-2 px-3.5 py-3"
                >
                  <span className="flex h-8 w-11 items-center justify-center rounded-md glass-ikon text-[10px] font-bold uppercase text-metin-2">
                    {y.marka}
                  </span>
                  <span className="flex-1 font-mono text-sm text-metin">···· ···· ···· {y.son4}</span>
                  <span className="text-xs text-metin-3">
                    {String(y.ay).padStart(2, "0")}/{y.yil}
                  </span>
                  <button
                    onClick={() => { odemeSil(y.id); toast.success("Kart kaldırıldı"); }}
                    aria-label="Kartı kaldır"
                    className="text-metin-3 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-5">
          <h3 className="text-base font-semibold text-metin">Otomatik Yükleme</h3>
          <p className="mb-4 text-xs text-metin-2">Bakiyen düştüğünde krediler otomatik eklenir</p>
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-yuzey-2 px-4 py-3">
            <span className={cn("text-sm font-medium", otomatikYukle ? "text-aksan" : "text-metin-2")}>
              {otomatikYukle ? "Etkin" : "Devre dışı"}
            </span>
            <button
              role="switch"
              aria-checked={otomatikYukle}
              aria-label="Otomatik yükleme"
              onClick={() => {
                if (!otomatikYukle && odemeYontemleri.length === 0) {
                  setKartModal(true);
                  return toast.error("Önce bir ödeme yöntemi ekle.");
                }
                otomatikYukleAyarla(!otomatikYukle);
                toast.success(otomatikYukle ? "Otomatik yükleme kapatıldı" : "Otomatik yükleme açıldı");
              }}
              className={cn("relative h-6 w-11 rounded-full transition-colors", otomatikYukle ? "bg-aksan" : "bg-white/15")}
            >
              <span
                className={cn(
                  "absolute top-1 h-4 w-4 rounded-full transition-all",
                  otomatikYukle ? "left-6 bg-[#12140c]" : "left-1 bg-white",
                )}
              />
            </button>
          </div>
          {otomatikYukle && (
            <p className="mt-3 text-xs text-metin-3">
              Bakiye 500 kredinin altına düştüğünde 1.600 kredi otomatik yüklenir.
            </p>
          )}
        </div>
      </div>

      {/* Satın alma geçmişi */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h3 className="text-base font-semibold text-metin">Satın Alma Geçmişi</h3>
        <p className="mb-4 text-xs text-metin-2">Kredi satın alma işlemlerin</p>
        {satinAlmalar.length === 0 ? (
          <BosDurum ikon={<Receipt className="h-7 w-7" />} baslik="Henüz satın alma yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-metin-3">
                  <th className="py-2.5 font-semibold">İşlem Kimliği</th>
                  <th className="py-2.5 font-semibold">Tarih</th>
                  <th className="py-2.5 font-semibold">Kredi</th>
                  <th className="py-2.5 font-semibold">Tutar</th>
                  <th className="py-2.5 font-semibold">Durum</th>
                </tr>
              </thead>
              <tbody>
                {satinAlmalar.map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-3 font-mono text-xs text-metin-2">{t.id}</td>
                    <td className="py-3 text-metin-2">{new Date(t.tarih).toLocaleDateString("tr")}</td>
                    <td className="py-3 text-metin">{t.kredi.toLocaleString("tr")}</td>
                    <td className="py-3 text-metin">₺{t.tutar.toLocaleString("tr")}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-aksan/30 bg-aksan/12 px-2 py-0.5 text-[11px] font-medium text-aksan">
                        <Check className="h-3 w-3" /> Tamamlandı
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kredi yükleme modalı */}
      <AnimatePresence>
        {yukleModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setYukleModal(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              role="dialog"
              aria-modal="true"
              className="menu-surface fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-metin">Kredi Yükle</h3>
                <button onClick={() => setYukleModal(false)} aria-label="Kapat" className="text-metin-3 hover:text-metin">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-3 text-sm font-medium text-metin-2">Hızlı Yükleme Seçenekleri</p>
              <div className="mb-5 grid grid-cols-2 gap-3">
                {PAKETLER.map((p, i) => (
                  <button
                    key={p.kredi}
                    onClick={() => { setSecilenPaket(i); setOzelKredi(""); }}
                    className={cn(
                      "relative rounded-2xl border py-4 text-center transition-colors",
                      secilenPaket === i && !ozelKredi.trim()
                        ? "border-aksan/50 bg-aksan/[0.08]"
                        : "border-white/[0.08] bg-yuzey-2 hover:border-white/20",
                    )}
                  >
                    {p.pop && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-aksan px-2 py-0.5 text-[10px] font-bold text-[#12140c]">
                        Popüler
                      </span>
                    )}
                    <div className="text-2xl font-bold text-metin">{p.kredi.toLocaleString("tr")}</div>
                    <div className="text-xs text-metin-3">kredi</div>
                    <div className="mt-1.5 text-sm font-semibold text-aksan">₺{p.tutar.toLocaleString("tr")}</div>
                  </button>
                ))}
              </div>

              <p className="mb-2 text-sm font-medium text-metin-2">Veya Özel Tutar Gir</p>
              <div className="mb-5 flex items-center gap-3">
                <input
                  value={ozelKredi}
                  onChange={(e) => setOzelKredi(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Kredi adedi gir"
                  inputMode="numeric"
                  className="h-11 flex-1 rounded-xl border border-white/[0.1] bg-yuzey-2 px-3.5 text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/50"
                />
                <span className="whitespace-nowrap text-xs text-metin-3">
                  {ozelKredi.trim() ? `≈ ₺${Math.round(Number(ozelKredi) * KREDI_BASINA_TL)}` : "1 kredi ≈ ₺0,85"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setYukleModal(false)}
                  className="hf-btn flex-1 rounded-xl border border-white/[0.12] py-2.5 text-sm font-medium text-metin-2 hover:bg-white/[0.05]"
                >
                  Vazgeç
                </button>
                <button
                  data-odeme
                  onClick={odemeyeGec}
                  className="hf-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-aksan py-2.5 text-sm font-bold text-[#12140c]"
                >
                  <CreditCard className="h-4 w-4" /> Ödemeye Geç
                </button>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-metin-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Demo · gerçek ödeme alınmaz, kart bilgisi saklanmaz.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Kart ekleme modalı */}
      <AnimatePresence>
        {kartModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setKartModal(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              role="dialog"
              aria-modal="true"
              className="menu-surface fixed left-1/2 top-1/2 z-[81] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl glass-ikon glass-ikon-lime">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-bold text-metin">Kart Ekle</h3>
                </div>
                <button onClick={() => setKartModal(false)} aria-label="Kapat" className="text-metin-3 hover:text-metin">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <label className="mb-1.5 block text-xs font-medium text-metin-2">Kart numarası</label>
              <input
                value={kartNo}
                onChange={(e) => setKartNo(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                className="mb-4 h-11 w-full rounded-xl border border-white/[0.1] bg-yuzey-2 px-3.5 font-mono text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/50"
              />
              <label className="mb-1.5 block text-xs font-medium text-metin-2">Son kullanım (AA/YY)</label>
              <input
                value={kartSon}
                onChange={(e) => setKartSon(e.target.value.replace(/[^\d/]/g, "").slice(0, 5))}
                onKeyDown={(e) => e.key === "Enter" && kartEkle()}
                placeholder="12/28"
                inputMode="numeric"
                className="mb-5 h-11 w-full rounded-xl border border-white/[0.1] bg-yuzey-2 px-3.5 font-mono text-sm text-metin outline-none placeholder:text-metin-3 focus:border-aksan/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setKartModal(false)}
                  className="hf-btn flex-1 rounded-xl border border-white/[0.12] py-2.5 text-sm font-medium text-metin-2 hover:bg-white/[0.05]"
                >
                  Vazgeç
                </button>
                <button
                  onClick={kartEkle}
                  className="hf-btn flex-1 rounded-xl bg-aksan py-2.5 text-sm font-bold text-[#12140c]"
                >
                  Ekle
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
