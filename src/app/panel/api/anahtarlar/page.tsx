"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Ban, Check, Clock, Copy, Eye, FlaskConical, KeyRound, MoreHorizontal, Pencil, Plus, RefreshCw, Rocket, ShieldCheck, Sparkles, Terminal, Trash2 } from "lucide-react";
import { useApiAnahtar, anahtarMaske, istekSirri, KAPSAMLAR, type ApiAnahtar, type AnahtarOrtam, type Kapsam } from "@/store/useApiAnahtar";
import { senkronize } from "@/lib/api/istemci";
import { toast } from "@/lib/toast";
import {
  BosDurum, KodEditor, kalanSure, KopyalaDugme, Modal, Onay, OrtamRozet, SayfaBaslik, SecimSerit, Secenek, birincil, etiket, girdi, goreli, ikincil, panoyaKopyala,
} from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

const BITISLER: [string, number | null][] = [["Süresiz", null], ["30 gün", 30], ["90 gün", 90], ["1 yıl", 365]];
const KAPSAM_IKON: Record<string, React.ElementType> = { full: ShieldCheck, generate: Sparkles, read: Eye };

type Form = { ad: string; ortam: AnahtarOrtam; kapsam: Kapsam; hizLimiti: number; aylikSinir: string; bitisGun: number | null };
const BOS: Form = { ad: "", ortam: "canli", kapsam: "full", hizLimiti: 60, aylikSinir: "", bitisGun: null };

export default function AnahtarlarSayfasi() {
  const hazir = useHazir();
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const iptaller = useApiAnahtar((s) => s.iptaller);
  const uretimler = useApiAnahtar((s) => s.uretimler);
  const { anahtarOlustur, anahtarGuncelle, anahtarIptal, anahtarDondur } = useApiAnahtar.getState();

  const [form, setForm] = useState<Form | null>(null);
  const [duzenlenen, setDuzenlenen] = useState<ApiAnahtar | null>(null);
  const [yeni, setYeni] = useState<ApiAnahtar | null>(null);
  const [silinecek, setSilinecek] = useState<ApiAnahtar | null>(null);
  const [dondurulen, setDondurulen] = useState<ApiAnahtar | null>(null);
  const [ayrinti, setAyrinti] = useState<ApiAnahtar | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  // ?yeni=1 (genel bakış ve denetim kaydından): oluşturma penceresini aç
  useEffect(() => { if (new URLSearchParams(window.location.search).get("yeni") === "1") { setForm(BOS); window.history.replaceState(null, "", window.location.pathname); } }, []);

  if (!hazir) return <div className="h-[60vh]" />;

  const kaydet = async () => {
    if (!form) return;
    const aylik = form.aylikSinir.trim() ? Math.max(0, Number(form.aylikSinir)) : null;
    if (duzenlenen) {
      anahtarGuncelle(duzenlenen.id, { ad: form.ad.trim() || duzenlenen.ad, kapsam: form.kapsam, hizLimiti: form.hizLimiti, aylikSinir: aylik, bitis: form.bitisGun === null ? null : duzenlenen.bitis ?? Date.now() + form.bitisGun * 86400_000 });
      toast.success("Anahtar güncellendi", { description: "Yeni ayarlar sunucuda hemen geçerli." });
    } else {
      const a = await anahtarOlustur({ ad: form.ad, ortam: form.ortam, kapsam: form.kapsam, hizLimiti: form.hizLimiti, aylikSinir: aylik, bitis: form.bitisGun ? Date.now() + form.bitisGun * 86400_000 : null });
      setYeni(a);
    }
    setForm(null); setDuzenlenen(null);
    void senkronize();
  };

  const aylikHarcanan = (id: string) => {
    const ay = new Date(); ay.setUTCDate(1); ay.setUTCHours(0, 0, 0, 0);
    return uretimler.filter((u) => u.anahtarId === id && u.environment === "live" && u.status === "succeeded" && Date.parse(u.created_at) >= ay.getTime()).reduce((t, u) => t + u.credits, 0);
  };

  return (
    <>
      <SayfaBaslik baslik="API anahtarları" aciklama="Her anahtarın kapsamını, hız limitini, aylık harcama sınırını ve geçerlilik süresini ayrı ayarla. Değişiklikler sunucuda anında uygulanır."
        sag={<button onClick={() => { setDuzenlenen(null); setForm(BOS); }} className={birincil}><Plus className="h-4 w-4" />Anahtar oluştur</button>} />

      <section className="mb-6 overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
        {anahtarlar.length === 0 ? (
          <BosDurum ikon={KeyRound} baslik="Henüz anahtarın yok" aciklama="Test anahtarıyla kredi harcamadan entegrasyonunu kur; hazır olunca canlı anahtara geç."
            eylem={<>
              <button onClick={() => setForm({ ...BOS, ortam: "test", ad: "Test anahtarı", hizLimiti: 20 })} className={ikincil}><FlaskConical className="h-4 w-4" />Test anahtarı</button>
              <button onClick={() => setForm(BOS)} className={birincil}><Rocket className="h-4 w-4" />Canlı anahtar</button>
            </>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[12.5px] text-white/50">
                  <th className="px-5 py-3 font-medium">Ad</th>
                  <th className="px-3 py-3 font-medium">Anahtar</th>
                  <th className="px-3 py-3 font-medium">Kapsam</th>
                  <th className="px-3 py-3 font-medium">Limit</th>
                  <th className="px-3 py-3 font-medium">Bu ay</th>
                  <th className="px-3 py-3 font-medium">Son kullanım</th>
                  <th className="px-3 py-3 font-medium">Oluşturma</th>
                  <th className="w-12 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {anahtarlar.map((a) => {
                  const harcanan = aylikHarcanan(a.id);
                  const bitti = a.bitis !== null && a.bitis < Date.now();
                  return (
                    <tr key={a.id} className={cn("group transition-colors hover:bg-white/[0.02]", bitti && "opacity-55")}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", a.ortam === "test" ? "bg-amber-300/12 text-amber-200" : "bg-[#55d6fd]/12 text-[#55d6fd]")}><KeyRound className="h-4 w-4" /></span>
                        <div className="min-w-0">
                        <button onClick={() => setAyrinti(a)} className="flex items-center gap-2 text-left font-medium text-white hover:underline">{a.ad}</button>
                        <div className="mt-1 flex items-center gap-1.5">
                          <OrtamRozet ortam={a.ortam} />
                          {a.bitis && <span className={cn("inline-flex items-center gap-1 text-[11.5px]", bitti ? "text-rose-300" : "text-amber-200")}><Clock className="h-3 w-3" />{bitti ? "Süresi doldu" : `${kalanSure(a.bitis)} sonra kapanıyor`}</span>}
                        </div>
                        </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1">
                          <code className="rounded-[8px] bg-white/[0.05] px-2 py-1 font-mono text-[12.5px] text-white/80">{anahtarMaske(a.tam)}</code>
                          <KopyalaDugme metin={a.tam} etiket={undefined} />
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-white/75">{KAPSAMLAR.find((k) => k.id === a.kapsam)?.ad}</td>
                      <td className="px-3 py-3.5 tabular-nums text-metin-2">{a.hizLimiti}/dk</td>
                      <td className="px-3 py-3.5 tabular-nums">
                        {a.ortam === "test" ? <span className="text-metin-2">Ücretsiz</span> : (
                          <div className="w-28">
                            <span className="text-white">{harcanan.toLocaleString("tr-TR")}</span><span className="text-metin-2">{a.aylikSinir !== null ? ` / ${a.aylikSinir.toLocaleString("tr-TR")}` : " kredi"}</span>
                            {a.aylikSinir !== null && <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.08]"><div className={cn("h-full rounded-full", harcanan / Math.max(1, a.aylikSinir) > 0.85 ? "bg-rose-400" : "bg-vurgu")} style={{ width: `${Math.min(100, (harcanan / Math.max(1, a.aylikSinir)) * 100)}%` }} /></div>}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-metin-2">{a.sonKullanim ? goreli(a.sonKullanim) : <span className="text-metin-2">Hiç</span>}</td>
                      <td className="px-3 py-3.5 text-metin-2">{new Date(a.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="relative px-3 py-3.5">
                        <button onClick={() => setMenu(menu === a.id ? null : a.id)} aria-label={`${a.ad} işlemleri`} className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/[0.07] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
                        <Yuzen acik={!!(menu === a.id)} onKapat={() => setMenu(null)} sag={12} ust={48} bosluk={0} className="w-52 rounded-[14px] ring-1 ring-white/[0.08] bg-[#17171a] p-1.5">
                              {[
                                { ad: "Düzenle", ikon: Pencil, f: () => { setDuzenlenen(a); setForm({ ad: a.ad, ortam: a.ortam, kapsam: a.kapsam, hizLimiti: a.hizLimiti, aylikSinir: a.aylikSinir === null ? "" : String(a.aylikSinir), bitisGun: a.bitis ? 30 : null }); } },
                                { ad: "Ayrıntılar", ikon: ShieldCheck, f: () => setAyrinti(a) },
                                { ad: "Konsolda kullan", ikon: Terminal, href: `/panel/api/konsol?anahtar=${a.id}` },
                                { ad: "Döndür", ikon: RefreshCw, f: () => setDondurulen(a) },
                              ].map((x) => x.href ? (
                                <Link key={x.ad} href={x.href} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white hover:bg-white/[0.06]"><x.ikon className="h-3.5 w-3.5 text-metin-2" />{x.ad}</Link>
                              ) : (
                                <button key={x.ad} onClick={() => { x.f!(); setMenu(null); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white hover:bg-white/[0.06]"><x.ikon className="h-3.5 w-3.5 text-metin-2" />{x.ad}</button>
                              ))}
                              <button onClick={() => { setSilinecek(a); setMenu(null); }} className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-white/[0.06] px-2.5 py-2 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />İptal et</button>
                            </Yuzen>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { ikon: ShieldCheck, b: "Sunucuda tut", a: "Anahtarı tarayıcıya ya da mobil uygulamaya gömme. Ortam değişkeninde sakla, istekleri kendi sunucundan yap." },
          { ikon: RefreshCw, b: "Düzenli döndür", a: "Döndürürken eski anahtara 24 saate kadar süre verebilirsin; dağıtımın yeni anahtara geçtikten sonra kendiliğinden kapanır." },
          { ikon: AlertTriangle, b: "Sızdıysa hemen iptal et", a: "İptal sunucuda anında geçerli olur. Kodundan da kapatabilirsin: DELETE /v1/keys/self." },
        ].map((x) => (
          <motion.div key={x.b} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08] p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/12 text-[#55d6fd]"><x.ikon className="h-[18px] w-[18px]" /></span>
            <p className="mt-4 text-[15px] font-semibold text-white">{x.b}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/65">{x.a}</p>
          </motion.div>
        ))}
      </div>

      {iptaller.length > 0 && (
        <details className="group mt-6 overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-[13.5px] text-metin-2 hover:text-white">
            <span className="flex items-center gap-2"><Ban className="h-4 w-4" />İptal edilen anahtarlar ({iptaller.length})</span>
            <span className="text-[12px] text-metin-2 group-open:hidden">Göster</span>
          </summary>
          <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
            {iptaller.map((i) => (
              <li key={i.id + i.iptal} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[13px]">
                <span className="text-metin-2 line-through decoration-white/25">{i.ad}</span>
                <OrtamRozet ortam={i.ortam} />
                <code className="font-mono text-[12px] text-metin-2">{anahtarMaske(i.tam)}</code>
                <span className="ml-auto text-metin-2">{goreli(i.iptal)} iptal edildi</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Oluştur / düzenle */}
      <Modal acik={!!form} onKapat={() => { setForm(null); setDuzenlenen(null); }} genislik={600}
        baslik={duzenlenen ? "Anahtarı düzenle" : "Yeni API anahtarı"}
        aciklama={duzenlenen ? "Ortam sonradan değiştirilemez; ayarlar sunucuda anında geçerli olur." : "Anahtar oluşturulduktan sonra bir kez tam haliyle gösterilir."}
        alt={<><button onClick={() => { setForm(null); setDuzenlenen(null); }} className={ikincil}>Vazgeç</button><button onClick={kaydet} className={birincil}>{duzenlenen ? "Kaydet" : "Oluştur"}</button></>}>
        {form && (
          <div className="space-y-5">
            <div>
              <label className={etiket} htmlFor="anahtar-ad">Ad</label>
              <input id="anahtar-ad" autoFocus value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value.slice(0, 60) })} placeholder="ör. Üretim sunucusu" className={girdi} />
            </div>
            {!duzenlenen && (
              <div>
                <span className={etiket}>Ortam</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Secenek ikon={Rocket} secili={form.ortam === "canli"} onClick={() => setForm({ ...form, ortam: "canli", hizLimiti: form.hizLimiti === 20 ? 60 : form.hizLimiti })} baslik="Canlı" aciklama="Gerçek üretim; kredi harcar." />
                  <Secenek ikon={FlaskConical} secili={form.ortam === "test"} onClick={() => setForm({ ...form, ortam: "test", hizLimiti: form.hizLimiti === 60 ? 20 : form.hizLimiti })} baslik="Test" aciklama="Örnek çıktı döner; kredi harcamaz." />
                </div>
              </div>
            )}
            <div>
              <span className={etiket}>Kapsam</span>
              <div className="space-y-2">{KAPSAMLAR.map((k) => <Secenek key={k.id} ikon={KAPSAM_IKON[k.id]} secili={form.kapsam === k.id} onClick={() => setForm({ ...form, kapsam: k.id })} baslik={k.ad} aciklama={k.ozet} />)}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={etiket} htmlFor="anahtar-hiz">Hız limiti (istek/dk)</label>
                <input id="anahtar-hiz" type="number" min={1} max={600} value={form.hizLimiti} onChange={(e) => setForm({ ...form, hizLimiti: Math.max(1, Math.min(600, Number(e.target.value) || 1)) })} className={girdi} />
              </div>
              <div>
                <label className={etiket} htmlFor="anahtar-sinir">Aylık harcama sınırı (kredi)</label>
                <input id="anahtar-sinir" type="number" min={0} value={form.aylikSinir} onChange={(e) => setForm({ ...form, aylikSinir: e.target.value })} placeholder="Sınırsız" disabled={form.ortam === "test"} className={cn(girdi, "disabled:opacity-40")} />
              </div>
            </div>
            <div>
              <span className={etiket}>Geçerlilik</span>
              <SecimSerit id="anahtar-bitis" secenek={BITISLER.map(([ad, gun]) => ({ id: gun === null ? "yok" : String(gun), ad }))} deger={form.bitisGun === null ? "yok" : String(form.bitisGun)}
                onDegis={(v) => setForm({ ...form, bitisGun: v === "yok" ? null : Number(v) })} />
            </div>
          </div>
        )}
      </Modal>

      {/* Bir kez gösterim */}
      <Modal acik={!!yeni} onKapat={() => setYeni(null)} genislik={600} baslik="Anahtarın hazır"
        aciklama="Şimdi kopyala ve ortam değişkenine kaydet. Bu tarayıcıda maskeli saklanır; sızdırmamak için ekran paylaşırken dikkat et."
        alt={<button onClick={() => setYeni(null)} className={birincil}>Kaydettim</button>}>
        {yeni && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-[18px] bg-[#55d6fd]/[0.07] p-3 pl-4 ring-1 ring-[#55d6fd]/35"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#55d6fd] text-[#06222b]"><Check className="h-4 w-4" strokeWidth={3} /></span>
              <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-white">{yeni.tam}</code>
              <button onClick={async () => { if (await panoyaKopyala(yeni.tam)) toast.success("Anahtar kopyalandı"); }} className={birincil}><Copy className="h-4 w-4" />Kopyala</button>
            </div>
            <KodEditor dosyaAdi=".env" dil="bash" satirNo={false} kod={`VAYRA_API_KEY=${yeni.tam}`} gizle={yeni.tam} />
          </div>
        )}
      </Modal>

      <Onay acik={!!silinecek} onKapat={() => setSilinecek(null)} baslik="Anahtarı iptal et" eylem="İptal et"
        aciklama={<>Bu anahtarla yapılan istekler hemen <code className="font-mono text-rose-300">401 api_key_revoked</code> almaya başlar. Geri alınamaz. <strong className="text-white">{silinecek?.ad}</strong></>}
        onOnay={() => { if (!silinecek) return; anahtarIptal(silinecek.id); void senkronize(); toast.success("Anahtar iptal edildi"); }} />

      <Modal acik={!!dondurulen} onKapat={() => setDondurulen(null)} genislik={500} baslik="Anahtarı döndür"
        aciklama="Aynı ayarlarla yeni bir anahtar oluşturulur. Eskisinin ne zaman kapanacağını seç.">
        <div className="space-y-2">
          {([["Hemen kapat", 0, "Sızıntı şüphesinde."], ["1 saat sonra", 1, "Hızlı dağıtım için."], ["24 saat sonra", 24, "Önerilen: dağıtımlar yeni anahtara geçsin."], ["7 gün sonra", 168, "Birden çok ortam güncellenecekse."]] as const).map(([ad, saat, ac]) => (
            <Secenek key={ad} secili={false} baslik={ad} aciklama={ac} onClick={async () => {
              if (!dondurulen) return;
              const y = await anahtarDondur(dondurulen.id, saat);
              setDondurulen(null);
              if (y) { setYeni(y); void senkronize(); }
            }} />
          ))}
        </div>
      </Modal>

      <AyrintiModal a={ayrinti} onKapat={() => setAyrinti(null)} />
    </>
  );
}

function AyrintiModal({ a, onKapat }: { a: ApiAnahtar | null; onKapat: () => void }) {
  const [sir, setSir] = useState("");
  useEffect(() => { if (a) void istekSirri(a.tam).then(setSir); }, [a]);
  return (
    <Modal acik={!!a} onKapat={onKapat} genislik={600} baslik={a?.ad ?? ""} aciklama="Anahtar kimliği ve istek bazlı webhook imza sırrı.">
      {a && (
        <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.02] text-[13.5px] ring-1 ring-white/[0.08]">
          {[
            ["Kimlik", a.id],
            ["Anahtar", anahtarMaske(a.tam)],
            ["Ortam", a.ortam === "canli" ? "Canlı" : "Test"],
            ["Kapsam", KAPSAMLAR.find((k) => k.id === a.kapsam)?.ad ?? a.kapsam],
            ["Hız limiti", `${a.hizLimiti} istek / dakika`],
            ["Aylık sınır", a.aylikSinir === null ? "Sınırsız" : `${a.aylikSinir.toLocaleString("tr-TR")} kredi`],
            ["Geçerlilik", a.bitis ? new Date(a.bitis).toLocaleString("tr-TR") : "Süresiz"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-3"><dt className="text-white/60">{k}</dt><dd className={cn("truncate text-white", (k === "Kimlik" || k === "Anahtar") && "font-mono text-[12.5px]")}>{v}</dd></div>
          ))}
          <div className="px-4 py-3">
            <dt className="text-metin-2">İstek bazlı webhook sırrı</dt>
            <dd className="mt-1.5 flex items-center gap-2"><code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[#9ece6a]">{sir || "…"}</code><KopyalaDugme metin={sir} etiket="Sır" /></dd>
            <p className="mt-1.5 text-[12px] leading-snug text-metin-2">İstekte <code className="font-mono">webhook_url</code> verdiğinde olaylar bu sırla imzalanır. Kayıtlı webhook uç noktalarının kendi sırları vardır.</p>
          </div>
        </dl>
      )}
    </Modal>
  );
}
