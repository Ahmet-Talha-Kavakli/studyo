"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Users, Gift, UserPlus, Send } from "lucide-react";
import { useEarn, tl } from "@/store/useEarn";
import { SayfaBaslik, Kart, MetrikKart, DurumRozet, YesilDugme, cn } from "@/components/earn/UI";
import { toast } from "@/lib/toast";

export default function Referanslar() {
  const s = useEarn();
  const [kopyalandi, setKopyalandi] = useState(false);
  const [davet, setDavet] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); s.kodGaranti(); }, []); // eslint-disable-line

  const kod = mounted ? s.referansKodu : "······";
  const link = `${mounted ? window.location.origin : ""}/kayit?ref=${kod}`;
  const kopyala = () => { navigator.clipboard?.writeText(link); setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1500); toast.success("Davet linki kopyalandı"); };

  const gonder = () => {
    if (!davet.trim()) { toast.error("E-posta veya kullanıcı adı gir."); return; }
    s.referansOlustur(davet.trim());
    toast.success("Davet oluşturuldu — arkadaşın katılıp üretim yapınca kredi yatar.");
    setDavet("");
  };

  const katilan = s.referanslar.filter((r) => r.durum !== "beklemede").length;
  const kazanilan = s.referanslar.filter((r) => r.durum === "uretti").reduce((a, r) => a + r.kredi, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Referans Programı" ozet="Arkadaşını davet et. O üretim yaptıkça iki kademe kazanç kazanırsın." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Davet edilen" deger={String(s.referanslar.length)} ikon={<UserPlus className="h-4 w-4" />} />
        <MetrikKart etiket="Katılan" deger={String(katilan)} ikon={<Users className="h-4 w-4" />} />
        <MetrikKart etiket="Kazanılan" deger={tl(kazanilan)} alt={`${kazanilan.toLocaleString("tr-TR")} kredi`} ikon={<Gift className="h-4 w-4" />} vurgu />
        <MetrikKart etiket="Kod" deger={kod} />
      </div>

      {/* davet linki */}
      <Kart className="mb-6">
        <h2 className="mb-3 font-bold text-white">Davet linkin</h2>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] p-2">
          <code className="min-w-0 flex-1 truncate px-2 text-sm text-white/70">{link}</code>
          <button onClick={kopyala} className="flex items-center gap-1.5 rounded-lg bg-sky-400 px-3 py-2 text-sm font-bold text-[#04141a] hover:bg-sky-300">
            {kopyalandi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {kopyalandi ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
        {/* kademe açıklaması */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.05] p-3">
            <div className="text-sm font-bold text-sky-300">1. Kademe · Direkt davet</div>
            <p className="mt-1 text-xs text-white/55">Davet ettiğin kişi üretim yapınca <b className="text-white">2.500 kredi</b> + onun kazancının %10'u.</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] p-3">
            <div className="text-sm font-bold text-white">2. Kademe · Zincir</div>
            <p className="mt-1 text-xs text-white/55">Davet ettiğin kişinin davet ettiklerinden de <b className="text-white">%5</b> kazanırsın.</p>
          </div>
        </div>
      </Kart>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* manuel davet */}
        <Kart>
          <h2 className="mb-3 font-bold text-white">Davet gönder</h2>
          <div className="flex gap-2">
            <input value={davet} onChange={(e) => setDavet(e.target.value)} onKeyDown={(e) => e.key === "Enter" && gonder()} placeholder="E-posta veya @kullanıcı" className="h-10 flex-1 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-white/30" />
            <YesilDugme onClick={gonder}><Send className="h-4 w-4" /></YesilDugme>
          </div>
        </Kart>

        {/* davet listesi */}
        <Kart>
          <h2 className="mb-3 font-bold text-white">Davetlerim</h2>
          {s.referanslar.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">Henüz davet göndermedin.</p>
          ) : (
            <div className="space-y-2">
              {s.referanslar.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2.5">
                  <div>
                    <div className="text-sm text-white">{r.davetEdilen}</div>
                    <div className="text-[11px] text-white/40">Kademe {r.seviye} · +{r.kredi.toLocaleString("tr-TR")} kr</div>
                  </div>
                  <DurumRozet durum={r.durum} />
                </div>
              ))}
            </div>
          )}
        </Kart>
      </div>
    </div>
  );
}
