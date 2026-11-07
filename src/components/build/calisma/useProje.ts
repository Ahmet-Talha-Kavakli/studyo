"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { akisOku, api, ApiHatasi } from "@/lib/build/istemci";
import type { Adim, BuildMesaj, OgeBaglam, PlanKart, Proje, ProjeAyarlar, SoruKart, Surum, TasarimKart } from "@/lib/build/tipler";
import { useAuth } from "@/store/useAuth";

/** Akış sürerken ekrandaki asistan mesajı: sunucunun tur sonunda kaydedeceği mesajın canlı aynası. */
export type CanliMesaj = BuildMesaj & { canliMetin: string; yaziliyor: { arac: string; yol?: string; karakter: number } | null };

export type GonderGovde = {
  istem?: string; mod?: "yap" | "plan" | "sohbet"; model?: string; efor?: string;
  oge?: OgeBaglam | null;
  ekler?: { tur: "gorsel"; url: string; ad: string }[];
  belgeler?: { tur: "pdf" | "metin"; url: string; ad: string; boyut?: number }[];
  tasarimIste?: boolean; tasarimSecim?: { mesajId: string; secilen: number };
  hedef?: { tavan: number };
  duzeltme?: { hata: string }; cevap?: { mesajId: string; cevaplar: Record<string, string> }; planOnay?: { mesajId: string }; tekrar?: { mesajId: string };
  kaynakUrl?: string;
  /** Son istek düzenlendi: o turun değişiklikleri geri alındı. */
  onceGeriAlindi?: boolean;
  /** Mesajı yazan ekip üyesinin görünen adı (sunucu kullanıcı mesajına kaydeder). */
  yazar?: string;
};

type Olay = Record<string, unknown> & { t: string };
let geciciSayac = 0;

/**
 * Çalışma alanının tek durum kaynağı. Proje sunucudan gelir; ajan turu NDJSON akışıyla izlenir.
 * Durdur: sunucuya DELETE gönderilir, akış "bitti" olayına kadar okunmaya devam eder (yarım tur da kaydedilir).
 */
export function useProje(id: string) {
  const [proje, setProje] = useState<Proje | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bulunamadi, setBulunamadi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [canli, setCanli] = useState<CanliMesaj | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  /** Sayfa yenilendikten sonra sunucuda süren tur (bu sekmede başlatılmadı). */
  const [arkaPlan, setArkaPlan] = useState(false);
  const [durduruluyor, setDurduruluyor] = useState(false);
  const [onizlemeAnahtari, setOnizlemeAnahtari] = useState(0);
  const [canliKod, setCanliKod] = useState<{ yol?: string; icerik: string } | null>(null);
  const [sonSurum, setSonSurum] = useState<{ id: string; no: number; aciklama: string; degisen: { yol: string; ekle: number; sil: number }[] } | null>(null);
  const ayril = useRef<AbortController | null>(null);
  const yukleRef = useRef<(() => Promise<unknown>) | null>(null);

  const yukle = useCallback(async () => {
    try {
      const v = await api<{ proje: Proje }>(`/api/build/proje/${id}`);
      setProje(v.proje);
      setBulunamadi(false);
      return v.proje;
    } catch (e) {
      if (e instanceof ApiHatasi && (e.durum === 404 || e.durum === 403)) setBulunamadi(true);
      else setHata(e instanceof Error ? e.message : "Proje yüklenemedi.");
      return null;
    } finally { setYukleniyor(false); }
  }, [id]);

  useEffect(() => { yukleRef.current = yukle; }, [yukle]);
  useEffect(() => { yukle(); return () => ayril.current?.abort(); }, [yukle]);

  /* Sayfa yenilendiyse ve ajan hâlâ çalışıyorsa: bitene kadar ara ara yokla. */
  const sonMesaj = proje?.mesajlar.at(-1);
  useEffect(() => {
    if (calisiyor || sonMesaj?.rol !== "asistan" || sonMesaj.durum !== "suruyor") return;
    let iptal = false;
    const t = setInterval(async () => {
      try {
        const v = await api<{ calisiyor: boolean }>(`/api/build/ajan/${id}`);
        if (iptal) return;
        // Arka planda süren tur: kaydedilen ilerlemeyi (adımlar, dosyalar) çek; bitince önizlemeyi tazele.
        setArkaPlan(v.calisiyor);
        await yukle();
        if (!v.calisiyor) { setOnizlemeAnahtari((n) => n + 1); iptal = true; clearInterval(t); }
      } catch { /* sessiz */ }
    }, 3000);
    return () => { iptal = true; clearInterval(t); };
  }, [calisiyor, sonMesaj?.rol, sonMesaj?.durum, id, yukle]);

  const guncelle = useCallback(async (govde: { dosyalar?: Record<string, string>; aciklama?: string; kaynak?: "elle" | "stil"; geriYukle?: string; yerImi?: { surumId: string; acik: boolean }; surumAdi?: { surumId: string; ad: string }; ad?: string; kapak?: string; ayarlar?: Partial<ProjeAyarlar>; mesajlar?: BuildMesaj[]; yeniSohbet?: boolean; geriDon?: { mesajId: string; kod?: boolean } }) => {
    const v = await api<{ proje: Proje; surum: Surum | null }>(`/api/build/proje/${id}`, { method: "PATCH", govde });
    setProje(v.proje);
    if (govde.dosyalar || govde.geriYukle || govde.geriDon?.kod) setOnizlemeAnahtari((n) => n + 1);
    return v;
  }, [id]);

  const canliGuncelle = (f: (m: CanliMesaj) => CanliMesaj) => setCanli((m) => (m ? f(m) : m));
  const dusunceKapat = (m: CanliMesaj): CanliMesaj => ({ ...m, adimlar: (m.adimlar ?? []).map((a) => (a.tur === "dusunce" && a.durum === "suruyor" ? { ...a, durum: "bitti", baslik: "Düşündü", sure: Math.max(1, Math.round((Date.now() - (a.sure ?? Date.now())) / 1000)) } : a)) });

  const olay = useCallback((o: Olay) => {
    switch (o.t) {
      case "basla": {
        const k = o.kullanici as BuildMesaj;
        setProje((p) => (p ? { ...p, mesajlar: [...p.mesajlar.filter((m) => !m.id.startsWith("gecici-") && m.id !== k.id), k] } : p));
        canliGuncelle((m) => ({ ...m, id: String(o.mesajId), model: String(o.model ?? m.model ?? "") }));
        break;
      }
      case "dusunce":
        canliGuncelle((m) => {
          const l = [...(m.adimlar ?? [])];
          const son = l.at(-1);
          if (son?.tur === "dusunce" && son.durum === "suruyor") l[l.length - 1] = { ...son, ayrinti: (son.ayrinti ?? "") + String(o.metin) };
          else l.push({ id: `d${Date.now()}`, tur: "dusunce", baslik: "Düşünüyor", ayrinti: String(o.metin), sure: Date.now(), durum: "suruyor" });
          return { ...m, adimlar: l };
        });
        break;
      case "metin":
        canliGuncelle((m) => ({ ...dusunceKapat(m), canliMetin: m.canliMetin + String(o.metin) }));
        break;
      case "ara":
        canliGuncelle((m) => {
          const k = dusunceKapat(m);
          const metin = k.canliMetin.trim();
          return { ...k, canliMetin: "", adimlar: metin ? [...(k.adimlar ?? []), { id: `b${Date.now()}`, tur: "bilgi", baslik: metin, durum: "bitti" }] : k.adimlar, yaziliyor: { arac: String(o.arac ?? ""), karakter: 0 } };
        });
        break;
      case "yaziliyor":
        canliGuncelle((m) => ({ ...m, yaziliyor: { arac: String(o.arac), yol: o.yol ? String(o.yol) : undefined, karakter: Number(o.karakter) || 0 } }));
        break;
      case "kod":
        setCanliKod((k) => (k && k.yol === o.yol ? { yol: k.yol, icerik: k.icerik + String(o.ek) } : { yol: o.yol ? String(o.yol) : undefined, icerik: String(o.ek) }));
        break;
      case "adim": {
        const a = o.adim as Adim;
        canliGuncelle((m) => {
          const l = [...(m.adimlar ?? [])];
          const i = l.findIndex((x) => x.id === a.id);
          if (i >= 0) l[i] = a; else l.push(a);
          return { ...m, adimlar: l, yaziliyor: null };
        });
        if (a.tur.startsWith("dosya")) setCanliKod(null);
        break;
      }
      case "dosyalar":
        // Ara dosyalar diske yazıldı: önizleme yenilenir, Kod sekmesindeki ağaç güncellenir.
        setOnizlemeAnahtari((n) => n + 1);
        yukleRef.current?.();
        break;
      case "plan": canliGuncelle((m) => ({ ...m, plan: o.plan as PlanKart })); break;
      case "soru": canliGuncelle((m) => ({ ...m, soru: o.soru as SoruKart })); break;
      case "tasarim": canliGuncelle((m) => ({ ...m, tasarim: o.tasarim as TasarimKart })); break;
      case "oneriler": canliGuncelle((m) => ({ ...m, oneriler: o.liste as string[] })); break;
      case "hedef": canliGuncelle((m) => ({ ...m, hedef: o.hedef as BuildMesaj["hedef"] })); break;
      case "bitti": {
        const son = o.mesaj as BuildMesaj;
        setProje((p) => (p ? { ...p, mesajlar: [...p.mesajlar.filter((m) => m.id !== son.id), son] } : p));
        if (o.surum) setSonSurum(o.surum as typeof sonSurum);
        setCanli(null);
        break;
      }
      case "hata": setHata(String(o.mesaj)); break;
    }
  }, []);

  const gonder = useCallback(async (g: GonderGovde) => {
    if (calisiyor || !proje) return;
    setHata(null);
    setCalisiyor(true);
    setSonSurum(null);
    const yazar = useAuth.getState().kullanici?.ad?.trim() || undefined;
    // İyimser kullanıcı mesajı (sunucu "basla" ile gerçeğini gönderir).
    if (!g.tekrar && !g.cevap && !g.planOnay) {
      if (g.tasarimSecim) setProje((p) => (p ? { ...p, mesajlar: p.mesajlar.map((m) => (m.id === g.tasarimSecim!.mesajId && m.tasarim ? { ...m, tasarim: { ...m.tasarim, secilen: g.tasarimSecim!.secilen, durum: "secildi" as const } } : m)) } : p));
      const gecici: BuildMesaj = { id: `gecici-${++geciciSayac}`, rol: "kullanici", zaman: Date.now(), metin: g.duzeltme ? "Hatayı düzelt" : g.istem ?? "", ekler: g.ekler?.length ? g.ekler : undefined, belgeler: g.belgeler?.length ? g.belgeler : undefined, oge: g.oge ?? undefined, duzeltme: !!g.duzeltme, yazar };
      setProje((p) => (p ? { ...p, mesajlar: [...p.mesajlar, gecici] } : p));
    }
    setCanli({ id: "canli", rol: "asistan", zaman: Date.now(), metin: "", adimlar: [], durum: "suruyor", model: g.model, canliMetin: "", yaziliyor: null });
    const ac = new AbortController();
    ayril.current = ac;
    try {
      const json = await akisOku(`/api/build/ajan/${id}`, { ...g, oge: g.oge ?? undefined, yazar: g.yazar ?? yazar }, olay, ac.signal);
      if (json?.anahtarYok) setProje((p) => (p ? { ...p, mesajlar: json.mesajlar as BuildMesaj[] } : p));
    } catch (e) {
      if (!ac.signal.aborted) setHata(e instanceof Error ? e.message : "Bağlantı koptu.");
      setProje((p) => (p ? { ...p, mesajlar: p.mesajlar.filter((m) => !m.id.startsWith("gecici-")) } : p));
    } finally {
      setCanli(null);
      setCanliKod(null);
      setCalisiyor(false);
      setDurduruluyor(false);
      await yukle();
      setOnizlemeAnahtari((n) => n + 1);
    }
  }, [calisiyor, proje, id, olay, yukle]);

  const durdur = useCallback(async () => {
    setDurduruluyor(true);
    try { await api(`/api/build/ajan/${id}`, { method: "DELETE" }); } catch { ayril.current?.abort(); }
  }, [id]);

  useEffect(() => { if (sonMesaj?.durum !== "suruyor") { setArkaPlan(false); if (!calisiyor) setDurduruluyor(false); } }, [sonMesaj?.durum, calisiyor]);
  /** Ekip rolü İzleyici: kod, ayarlar ve ajan salt okunur (sunucu da engeller). */
  const saltOkunur = proje?.ekipRol === "izleyici";
  return { proje, setProje, yukleniyor, bulunamadi, hata, setHata, canli, calisiyor: calisiyor || arkaPlan, durduruluyor, onizlemeAnahtari, setOnizlemeAnahtari, canliKod, sonSurum, yukle, guncelle, gonder, durdur, saltOkunur };
}

export type ProjeKanca = ReturnType<typeof useProje>;
