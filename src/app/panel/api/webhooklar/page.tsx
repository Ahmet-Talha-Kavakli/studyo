"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Beaker, Check, ChevronRight, Eye, EyeOff, Inbox, Loader2, MoreHorizontal, Pencil, Plus, RefreshCw, Send, ShieldCheck, ShieldX, Trash2, Webhook as WebhookIkon } from "lucide-react";
import { useApiAnahtar, OLAY_TANIM, type Teslim, type Webhook } from "@/store/useApiAnahtar";
import { hmacHex, rastgeleHex } from "@/lib/apiAnahtarDogrula";
import { apiIstek, senkronize } from "@/lib/api/istemci";
import { imzaDogrulama } from "@/lib/api/kod";
import { toast } from "@/lib/toast";
import {
  Anahtar, BosDurum, DurumRozet, HttpRozet, Kart, KodEditor, KopyalaDugme, Modal, Onay, SayfaBaslik, birincil, etiket, girdi, goreli, ikincil, sureMetin, tarihSaat, kisaZaman } from "@/components/api/ui";
import { useHazir } from "@/components/api/veri";
import { cn } from "@/lib/utils";

type Form = { id?: string; url: string; aciklama: string; olaylar: string[] };
const kart = "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";
/** Olay renkleri: olayın anlamına göre (tamamlandı yeşil, başarısız kırmızı…). */
const OLAY_RENK: Record<string, string> = { "generation.completed": "#34d399", "generation.failed": "#fb7185", "generation.started": "#55d6fd", "generation.canceled": "#a1a1aa", "credits.low": "#fcd34d" };
const olayRenk = (id: string) => OLAY_RENK[id] ?? "#a78bfa";

export default function WebhooklarSayfasi() {
  const hazir = useHazir();
  const webhooklar = useApiAnahtar((s) => s.webhooklar);
  const teslimler = useApiAnahtar((s) => s.teslimler);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const { webhookEkle, webhookGuncelle, webhookSil, webhookSirYenile } = useApiAnahtar.getState();
  const [form, setForm] = useState<Form | null>(null);
  const [silinecek, setSilinecek] = useState<Webhook | null>(null);
  const [acik, setAcik] = useState<string | null>(null);
  const [dil, setDil] = useState<"node" | "python">("node");
  const yonetici = anahtarlar.find((a) => a.kapsam === "full" && (!a.bitis || a.bitis > Date.now()));

  useEffect(() => { if (!acik && webhooklar[0]) setAcik(webhooklar[0].id); }, [webhooklar, acik]);
  if (!hazir) return <div className="h-[60vh]" />;

  const urlHata = form && form.url && !/^https?:\/\/[^\s]+\.[^\s]+|^https?:\/\/localhost/.test(form.url) ? "http(s):// ile başlayan geçerli bir adres gir." : null;
  const kaydet = () => {
    if (!form || !form.url || urlHata || !form.olaylar.length) return;
    if (form.id) { webhookGuncelle(form.id, { url: form.url.trim(), aciklama: form.aciklama, olaylar: form.olaylar }); toast.success("Uç nokta güncellendi"); }
    else { const w = webhookEkle({ url: form.url, aciklama: form.aciklama, olaylar: form.olaylar }); setAcik(w.id); toast.success("Uç nokta eklendi", { description: "Tüm anahtarlarının olayları bu adrese gönderilecek." }); }
    setForm(null);
    void senkronize();
  };
  const testAlicisi = () => {
    const kanal = rastgeleHex(12);
    const w = webhookEkle({ url: `${window.location.origin}/api/webhook-alici/${kanal}`, aciklama: "Vayra test alıcısı", olaylar: OLAY_TANIM.map((o) => o.id) });
    setAcik(w.id);
    void senkronize();
    toast.success("Test alıcısı hazır", { description: "Bir üretim başlat ya da test olayı gönder; gelen olaylar imza doğrulamasıyla burada görünür." });
  };

  return (
    <>
      <SayfaBaslik baslik="Webhook'lar" aciklama="Üretim bitince sorgulamak yerine haber al. Her olay HMAC-SHA256 ile imzalanır; 2xx alınamazsa 2 ve 8 saniye sonra yeniden denenir."
        sag={<><button onClick={testAlicisi} className={ikincil}><Beaker className="h-4 w-4" />Test alıcısı oluştur</button><button onClick={() => setForm({ url: "", aciklama: "", olaylar: ["generation.completed", "generation.failed"] })} className={birincil}><Plus className="h-4 w-4" />Uç nokta ekle</button></>} />

      {!yonetici && anahtarlar.length > 0 && <p className="mb-4 rounded-xl bg-amber-400/[0.08] px-4 py-3 text-[13px] text-amber-100/90 ring-1 ring-inset ring-amber-400/20">Test olayı göndermek ve teslim günlüğünü okumak için “Tam erişim” kapsamlı bir anahtar gerekiyor.</p>}

      {webhooklar.length === 0 ? (
        <Kart>
          <BosDurum ikon={WebhookIkon} baslik="Henüz uç nokta yok" aciklama="Kendi sunucundaki bir adresi ekle ya da hemen denemek için Vayra test alıcısını kullan."
            eylem={<><button onClick={testAlicisi} className={ikincil}><Beaker className="h-4 w-4" />Test alıcısı</button><button onClick={() => setForm({ url: "", aciklama: "", olaylar: ["generation.completed", "generation.failed"] })} className={birincil}><Plus className="h-4 w-4" />Uç nokta ekle</button></>} />
        </Kart>
      ) : (
        <div className="space-y-3">
          {webhooklar.map((w) => (
            <UcNoktaKarti key={w.id} w={w} acik={acik === w.id} onAc={() => setAcik(acik === w.id ? null : w.id)} teslimler={teslimler.filter((t) => t.endpoint_id === w.id)}
              yoneticiAnahtar={yonetici?.tam ?? null}
              onDuzenle={() => setForm({ id: w.id, url: w.url, aciklama: w.aciklama, olaylar: w.olaylar })} onSil={() => setSilinecek(w)}
              onAktif={(v) => { webhookGuncelle(w.id, { aktif: v }); void senkronize(); }}
              onSirYenile={() => { webhookSirYenile(w.id); void senkronize(); toast.success("İmza sırrı yenilendi", { description: "Alıcındaki VAYRA_WEBHOOK_SECRET değerini güncelle." }); }} />
          ))}
        </div>
      )}

      <section className="mt-10 grid items-start gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">İmzayı doğrula</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/70">Her istekte <code className="rounded-[7px] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-[#8fe6ff]">Vayra-Signature: t=…,v1=…</code> başlığı gelir. <code className="font-mono text-white">v1</code>, <code className="font-mono text-white">{"{t}.{ham_gövde}"}</code> metninin uç noktanın sırrıyla HMAC-SHA256 özetidir.</p>
          <ul className="mt-5 space-y-3 text-[14px] text-white/75">
            {["Gövdeyi ham haliyle doğrula; JSON'a çevrilmiş gövdede imza tutmaz.", "5 dakikadan eski zaman damgalarını reddet (tekrar oynatma).", "10 saniye içinde 2xx dön; ağır işi kuyruğa at.", "Aynı olay yeniden gelebilir: Vayra-Delivery ya da olay id'siyle tekilleştir."].map((x) => (
              <li key={x} className="flex gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15"><Check className="h-3 w-3 text-emerald-300" strokeWidth={3} /></span>{x}</li>
            ))}
          </ul>
          <h3 className="mb-3 mt-8 text-[15.5px] font-semibold text-white">Olaylar</h3>
          <ul className={cn(kart, "divide-y divide-white/[0.06] overflow-hidden")}>
            {OLAY_TANIM.map((o) => (
              <li key={o.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: olayRenk(o.id), boxShadow: `0 0 10px ${olayRenk(o.id)}88` }} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-[14px] font-medium text-white">{o.ad}<code className="font-mono text-[12px] font-normal text-white/45">{o.id}</code></p>
                  <p className="mt-0.5 text-[13px] text-white/60">{o.ozet}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <KodEditor sekmeler={[{ id: "node", ad: "Node.js", kod: imzaDogrulama("node"), dil: "js" }, { id: "python", ad: "Python", kod: imzaDogrulama("python") }]} aktif={dil} onSekme={(d) => setDil(d as "node" | "python")} maxH={560} />
      </section>

      <Modal acik={!!form} onKapat={() => setForm(null)} baslik={form?.id ? "Uç noktayı düzenle" : "Uç nokta ekle"} aciklama="Olaylar bu adrese JSON gövdeli POST olarak gönderilir." genislik={560}
        alt={<><button onClick={() => setForm(null)} className={ikincil}>Vazgeç</button><button onClick={kaydet} disabled={!form?.url || !!urlHata || !form?.olaylar.length} className={birincil}>{form?.id ? "Kaydet" : "Ekle"}</button></>}>
        {form && (
          <div className="space-y-5">
            <div>
              <label className={etiket} htmlFor="wh-url">Adres</label>
              <input id="wh-url" autoFocus value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://ornek.com/vayra/webhook" className={cn(girdi, "font-mono text-[13px]", urlHata && "ring-rose-400/60")} />
              {urlHata && <p className="mt-1.5 text-[12px] text-rose-300">{urlHata}</p>}
            </div>
            <div>
              <label className={etiket} htmlFor="wh-ac">Açıklama</label>
              <input id="wh-ac" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value.slice(0, 80) })} placeholder="ör. Sipariş servisi" className={girdi} />
            </div>
            <div>
              <span className={etiket}>Olaylar</span>
              <div className="space-y-2">
                {OLAY_TANIM.map((o) => {
                  const sec = form.olaylar.includes(o.id);
                  return (
                    <button key={o.id} type="button" aria-pressed={sec} onClick={() => setForm({ ...form, olaylar: sec ? form.olaylar.filter((x) => x !== o.id) : [...form.olaylar, o.id] })}
                      className={cn("group flex w-full items-center gap-3 rounded-[18px] p-3 text-left ring-1 transition active:scale-[0.99]", sec ? "bg-[#55d6fd]/[0.07] ring-[#55d6fd]/55" : "bg-white/[0.025] ring-white/[0.08] hover:bg-white/[0.04] hover:ring-white/[0.16]")}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.05]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: olayRenk(o.id), boxShadow: `0 0 10px ${olayRenk(o.id)}99` }} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2 text-[14px] font-semibold text-white">{o.ad}<code className="font-mono text-[11.5px] font-normal text-white/45">{o.id}</code></span>
                        <span className="block text-[12.5px] text-white/60">{o.ozet}</span>
                      </span>
                      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition", sec ? "bg-[#55d6fd] text-[#06222b]" : "ring-1 ring-inset ring-white/20")}>
                        <AnimatePresence>{sec && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="h-3 w-3" strokeWidth={3.2} /></motion.span>}</AnimatePresence>
                      </span>
                    </button>
                  );
                })}
              </div>
              {!form.olaylar.length && <p className="mt-1.5 text-[12px] text-rose-300">En az bir olay seç.</p>}
            </div>
          </div>
        )}
      </Modal>
      <Onay acik={!!silinecek} onKapat={() => setSilinecek(null)} baslik="Uç noktayı sil" eylem="Sil" aciklama={<>Bu adrese olay gönderimi hemen durur: <code className="break-all font-mono text-white">{silinecek?.url}</code></>}
        onOnay={() => { if (silinecek) { webhookSil(silinecek.id); void senkronize(); toast.success("Uç nokta silindi", { description: `${silinecek.url} adresine artık olay gönderilmez.` }); } }} />
    </>
  );
}

function UcNoktaKarti({ w, acik, onAc, teslimler, yoneticiAnahtar, onDuzenle, onSil, onAktif, onSirYenile }: {
  w: Webhook; acik: boolean; onAc: () => void; teslimler: Teslim[]; yoneticiAnahtar: string | null;
  onDuzenle: () => void; onSil: () => void; onAktif: (v: boolean) => void; onSirYenile: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const [sirGoster, setSirGoster] = useState(false);
  const [olay, setOlay] = useState("generation.completed");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sonTest, setSonTest] = useState<{ ok: boolean; status: number | null; duration_ms: number; error: string | null; response: string | null } | null>(null);
  const [acikTeslim, setAcikTeslim] = useState<string | null>(null);
  const alici = w.url.includes("/api/webhook-alici/");
  const basarili = teslimler.filter((t) => t.state === "succeeded").length;
  const biten = teslimler.filter((t) => t.state !== "pending").length;

  const test = async () => {
    if (!yoneticiAnahtar) return;
    setGonderiliyor(true);
    const r = await apiIstek<{ ok: boolean; status: number | null; duration_ms: number; error: string | null; response: string | null }>(yoneticiAnahtar, "POST", "/webhooks/test", { govde: { url: w.url, secret: w.sir, event: olay } });
    setGonderiliyor(false);
    if (r.durum !== 200) { toast.error("Test olayı gönderilemedi", { description: (r.govde as unknown as { error?: { message: string } })?.error?.message ?? "Sunucu isteği kabul etmedi. Biraz sonra yeniden dene." }); return; }
    setSonTest(r.govde);
    if (r.govde.ok) toast.success("Test olayı teslim edildi", { description: `Uç nokta HTTP ${r.govde.status} döndü.` }); else toast.error("Uç nokta olayı kabul etmedi", { description: r.govde.error ?? "2xx dışında bir yanıt döndü. Alıcının günlüklerini kontrol et." });
  };

  return (
    <motion.section className={cn(kart, "overflow-hidden transition-[box-shadow]", acik && "ring-white/[0.14]")}>
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={onAc} aria-expanded={acik} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <ChevronRight className={cn("h-4 w-4 shrink-0 text-white/50 transition-transform", acik && "rotate-90")} />
          <span className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", !w.aktif ? "bg-white/[0.05] text-white/40" : biten && basarili < biten ? "bg-amber-300/12 text-amber-200" : "bg-emerald-400/12 text-emerald-300")}>
            <WebhookIkon className="h-[18px] w-[18px]" />
            {w.aktif && <span className={cn("absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0e0f11]", biten && basarili < biten ? "bg-amber-300" : "bg-emerald-400")} />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[13.5px] text-white">{w.url}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-white/60">{w.aciklama || "Açıklama yok"} · {w.olaylar.length} olay · {biten ? `%${Math.round((basarili / biten) * 100)} başarılı (${biten})` : "henüz teslim yok"}</p>
          </div>
        </button>
        <Anahtar acik={w.aktif} onDegis={onAktif} etiket="Uç noktayı etkinleştir" />
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} aria-label="Uç nokta işlemleri" className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/[0.07] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
          <Yuzen acik={!!(menu)} onKapat={() => setMenu(false)} sag={0} ust={36} bosluk={0} className="w-48 rounded-[14px] ring-1 ring-white/[0.08] bg-[#17171a] p-1.5">
              <button onClick={() => { onDuzenle(); setMenu(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white hover:bg-white/[0.06]"><Pencil className="h-3.5 w-3.5 text-metin-2" />Düzenle</button>
              <button onClick={() => { onSirYenile(); setMenu(false); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-white hover:bg-white/[0.06]"><RefreshCw className="h-3.5 w-3.5 text-metin-2" />Sırrı yenile</button>
              <button onClick={() => { onSil(); setMenu(false); }} className="mt-1 flex w-full items-center gap-2.5 rounded-lg border-t border-white/[0.06] px-2.5 py-2 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button>
            </Yuzen>
        </div>
      </div>

      {acik && (
        <div className="space-y-5 border-t border-white/[0.06] p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[18px] bg-white/[0.025] p-4 ring-1 ring-white/[0.07]">
              <p className="text-[13px] font-medium text-white/80">İmza sırrı</p>
              <div className="mt-2 flex items-center gap-1.5">
                <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[#9ece6a]">{sirGoster ? w.sir : `whsec_${"•".repeat(24)}`}</code>
                <button onClick={() => setSirGoster((v) => !v)} aria-label={sirGoster ? "Gizle" : "Göster"} className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/[0.07] hover:text-white">{sirGoster ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                <KopyalaDugme metin={w.sir} etiket="Sır" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">{w.olaylar.map((o) => <span key={o} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] text-white/80"><span className="h-1.5 w-1.5 rounded-full" style={{ background: olayRenk(o) }} />{OLAY_TANIM.find((x) => x.id === o)?.ad ?? o}</span>)}</div>
            </div>
            <div className="rounded-[18px] bg-white/[0.025] p-4 ring-1 ring-white/[0.07]">
              <p className="text-[13px] font-medium text-white/80">Test olayı gönder</p>
              <div className="mt-2 flex gap-2">
                <select value={olay} onChange={(e) => setOlay(e.target.value)} aria-label="Olay" className={cn(girdi, "h-10 cursor-pointer rounded-full text-[13px]")}>{OLAY_TANIM.map((o) => <option key={o.id} value={o.id} className="bg-[#17181b]">{o.ad} · {o.id}</option>)}</select>
                <button onClick={test} disabled={!yoneticiAnahtar || gonderiliyor} className={cn(birincil, "h-10 shrink-0")}>{gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Gönder</button>
              </div>
              {sonTest && (
                <p className={cn("mt-2.5 flex items-center gap-2 text-[12.5px]", sonTest.ok ? "text-emerald-300" : "text-rose-300")}>
                  {sonTest.ok ? <Check className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                  {sonTest.status ? `HTTP ${sonTest.status}` : sonTest.error} · {sureMetin(sonTest.duration_ms)}{sonTest.response ? ` · “${sonTest.response.slice(0, 60)}”` : ""}
                </p>
              )}
            </div>
          </div>

          {alici && <AliciKutusu url={w.url} sir={w.sir} />}

          <div>
            <h3 className="mb-3 text-[14.5px] font-semibold text-white">Teslimler</h3>
            {teslimler.length === 0 ? <p className="flex items-center gap-3 rounded-[16px] bg-white/[0.025] px-4 py-3.5 text-[13.5px] text-white/65 ring-1 ring-white/[0.06]"><Send className="h-4 w-4 shrink-0 text-white/45" />Henüz teslim yok. Bir üretim başlat ya da yukarıdan test olayı gönder.</p> : (
              <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[18px] bg-white/[0.015] ring-1 ring-white/[0.07]">
                {teslimler.slice(0, 30).map((t) => (
                  <li key={t.id}>
                    <button onClick={() => setAcikTeslim(acikTeslim === t.id ? null : t.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[12.5px] hover:bg-white/[0.02]">
                      <DurumRozet durum={t.state === "succeeded" ? "succeeded" : t.state === "failed" ? "failed" : "pending"} />
                      <span className="inline-flex items-center gap-1.5 text-white"><span className="h-1.5 w-1.5 rounded-full" style={{ background: olayRenk(t.event) }} /><code className="font-mono">{t.event}</code></span>
                      <span className="hidden truncate font-mono text-metin-2 sm:inline">{t.generation_id}</span>
                      <span className="ml-auto text-metin-2">{t.attempts.length} deneme</span>
                      <HttpRozet kod={t.attempts[t.attempts.length - 1]?.status ?? 0} />
                      <span className="w-20 text-right text-metin-2">{goreli(t.created_at)}</span>
                    </button>
                    {acikTeslim === t.id && (
                      <div className="grid gap-3 border-t border-white/[0.05] bg-[#0e0e10] p-4 lg:grid-cols-2">
                        <div>
                          <p className="mb-2 text-[12px] font-medium text-metin-2">Denemeler</p>
                          <ol className="space-y-2">{t.attempts.map((d, i) => (
                            <li key={i} className="rounded-lg bg-white/[0.03] px-3 py-2 text-[12px]">
                              <div className="flex justify-between"><span className="text-white">#{i + 1} · <HttpRozet kod={d.status ?? 0} /></span><span className="font-mono text-metin-2">{sureMetin(d.duration_ms)}</span></div>
                              <p className="mt-0.5 font-mono text-[11px] text-metin-2">{tarihSaat(d.at)}{d.error ? ` · ${d.error}` : ""}</p>
                              {d.response && <p className="mt-1 truncate font-mono text-[11px] text-metin-2">{d.response}</p>}
                            </li>
                          ))}</ol>
                        </div>
                        <div className="space-y-2">
                          <KodEditor dosyaAdi="payload.json" dil="json" kod={(() => { try { return JSON.stringify(JSON.parse(t.payload), null, 2); } catch { return t.payload; } })()} maxH={300} />
                          <YenidenGonder t={t} />
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}

type AliciOlay = { id: string; at: string; headers: Record<string, string>; body: string };

function AliciKutusu({ url, sir }: { url: string; sir: string }) {
  const [olaylar, setOlaylar] = useState<AliciOlay[]>([]);
  const [dogru, setDogru] = useState<Record<string, boolean>>({});
  const [secili, setSecili] = useState<string | null>(null);
  const yol = useMemo(() => new URL(url).pathname, [url]);
  const cek = useCallback(async () => {
    try { const r = await fetch(yol, { cache: "no-store" }); const j = await r.json(); setOlaylar(j.data ?? []); } catch { /* yok */ }
  }, [yol]);
  useEffect(() => { void cek(); const t = setInterval(cek, 3000); return () => clearInterval(t); }, [cek]);
  useEffect(() => {
    void (async () => {
      const s: Record<string, boolean> = {};
      for (const o of olaylar) {
        const imza = o.headers["vayra-signature"] ?? "";
        const p = Object.fromEntries(imza.split(",").map((x) => x.split("=")));
        s[o.id] = !!p.t && !!p.v1 && (await hmacHex(`${p.t}.${o.body}`, sir)) === p.v1;
      }
      setDogru(s);
    })();
  }, [olaylar, sir]);
  const sec = olaylar.find((o) => o.id === secili) ?? olaylar[0];

  return (
    <div className="rounded-[20px] bg-[#55d6fd]/[0.04] p-4 ring-1 ring-[#55d6fd]/25">
      <div className="mb-3 flex items-center gap-2">
        <Inbox className="h-4 w-4 text-vurgu-acik" />
        <p className="text-[13.5px] font-semibold text-white">Test alıcısının gelen kutusu</p>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-metin-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />3 sn'de bir yenileniyor</span>
      </div>
      {olaylar.length === 0 ? <p className="py-6 text-center text-[13px] text-metin-2">Henüz olay gelmedi.</p> : (
        <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
          <ul className="max-h-[300px] space-y-1 overflow-y-auto">
            {olaylar.map((o) => {
              const govde = (() => { try { return JSON.parse(o.body); } catch { return {}; } })();
              return (
                <li key={o.id}>
                  <button onClick={() => setSecili(o.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px]", sec?.id === o.id ? "bg-white/[0.08]" : "hover:bg-white/[0.04]")}>
                    {dogru[o.id] ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <ShieldX className="h-3.5 w-3.5 shrink-0 text-rose-300" />}
                    <span className="min-w-0 flex-1 truncate font-mono text-white">{govde.type ?? "?"}</span>
                    <span className="shrink-0 text-metin-2">{kisaZaman(o.at)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {sec && (
            <div className="min-w-0">
              <p className={cn("mb-2 flex items-center gap-1.5 text-[12.5px]", dogru[sec.id] ? "text-emerald-300" : "text-rose-300")}>
                {dogru[sec.id] ? <><ShieldCheck className="h-3.5 w-3.5" />İmza doğrulandı — bu uç noktanın sırrıyla eşleşiyor</> : <><ShieldX className="h-3.5 w-3.5" />İmza eşleşmiyor (sır yenilenmiş olabilir)</>}
              </p>
              <KodEditor dosyaAdi={`POST ${yol}`} dil="http" kod={`${Object.entries(sec.headers).map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${(() => { try { return JSON.stringify(JSON.parse(sec.body), null, 2); } catch { return sec.body; } })()}`} maxH={300} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Kayıtlı teslimi aynı gövde ve imzayla yeniden gönderir (POST /v1/webhooks/deliveries/{id}/redeliver). */
function YenidenGonder({ t }: { t: Teslim }) {
  const anahtar = useApiAnahtar((s) => s.anahtarlar.find((a) => a.id === t.anahtarId));
  const birlestir = useApiAnahtar((s) => s.teslimleriBirlestir);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  if (!anahtar) return <p className="text-[12px] text-metin-2">Bu teslimi yapan anahtar bu tarayıcıda yok; yeniden göndermek için o anahtar gerekir.</p>;
  const gonder = async () => {
    setGonderiliyor(true);
    const r = await apiIstek<Omit<Teslim, "anahtarId">>(anahtar.tam, "POST", `/webhooks/deliveries/${t.id}/redeliver`, { anahtarId: anahtar.id });
    setGonderiliyor(false);
    if (r.durum !== 200) return toast.error("Olay yeniden gönderilemedi", { description: (r.govde as unknown as { error?: { message?: string } })?.error?.message ?? "Sunucu isteği kabul etmedi. Biraz sonra yeniden dene." });
    birlestir([{ ...t, ...r.govde, payload: t.payload, anahtarId: t.anahtarId }]);
    const son = r.govde.attempts[r.govde.attempts.length - 1];
    if (r.govde.state === "succeeded") toast.success("Olay teslim edildi", { description: `Uç nokta HTTP ${son?.status} döndü.` }); else toast.error("Uç nokta yine kabul etmedi", { description: son?.error ?? "2xx dışında bir yanıt döndü. Alıcının günlüklerini kontrol et." });
  };
  return (
    <button onClick={() => void gonder()} disabled={gonderiliyor} className={ikincil}>
      {gonderiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Yeniden gönder
    </button>
  );
}
