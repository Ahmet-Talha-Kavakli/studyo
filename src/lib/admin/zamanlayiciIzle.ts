/**
 * Arka plan zamanlayıcılarının son çalışma damgası (yayın hazırlığı sayfası için). Zamanlayıcıların kendi kodu değişmez:
 * her biri tur işlevini globalThis üzerinde tutar; burada o işlev bir kez sarılır ve her çalışmada damga vurulur.
 * Geliştirmede modül yenilenince tur işlevi yeniden yazılabildiği için sarma her çağrıda (ve 30 saniyede bir) denetlenir.
 */

export interface ZamanlayiciDamga { son: number; sure: number; sayac: number; hata?: string; hataZamani?: number }
export interface ZamanlayiciTanim { id: string; ad: string; aciklama: string; aralikSn: number }

export const ZAMANLAYICILAR: ZamanlayiciTanim[] = [
  { id: "sistem", ad: "Build sistemleri", aciklama: "Zamanlanmış sistem akışlarını başlatır.", aralikSn: 15 },
  { id: "buyume", ad: "Büyüme e-postaları", aciklama: "Zamanlanmış e-posta kampanyalarını gönderir.", aralikSn: 60 },
  { id: "isletme", ad: "İşletme işleri", aciklama: "Randevu hatırlatma, terk edilen sepet ve yorum isteği.", aralikSn: 300 },
  { id: "bulut", ad: "Bulut zamanlanmış fonksiyonlar", aciklama: "Build Bulut zamanlı işleri ve günlük yedek.", aralikSn: 15 },
  { id: "odeme", ad: "Abonelik denetimi", aciklama: "Dönem sonu, yenileme hatırlatması ve Stripe eşitlemesi.", aralikSn: 3600 },
  { id: "izleme", ad: "Sohbet izleme", aciklama: "Build sohbet izleme görevleri.", aralikSn: 60 },
  { id: "ajan", ad: "Ajan zamanlamaları", aciklama: "Ajan zamanlanmış görevleri ve kaynak yenileme.", aralikSn: 30 },
];

type Fn = (() => Promise<unknown>) & { __damgali?: boolean };
type G = {
  __vayraZamanDamga?: Record<string, ZamanlayiciDamga>;
  __vayraZamanIzleT?: ReturnType<typeof setInterval>;
  __vayraZamanlayiciTur?: Fn; __vayraZamanlayici?: unknown;
  __vayraBuyumeTurFn?: Fn; __vayraBuyumeZamanT?: unknown;
  __vayraIsletmeTur?: Fn; __vayraIsletmeZaman?: unknown;
  __vayraZamanli?: { z: unknown; tik: Fn };
  __vayraIzlemeTur?: Fn; __vayraIzleme?: unknown;
  __vayraOdemeZamanlayici?: unknown;
  __vayraAjanZamanlayici?: unknown;
};
const g = globalThis as unknown as G;
const DAMGA = (g.__vayraZamanDamga ??= {});

/** Bir çalışmayı damgalar (zamanlayıcının kendi kodundan da çağrılabilir). */
export function zamanlayiciDamgala(id: string, bas: number, hata?: unknown) {
  const d = (DAMGA[id] ??= { son: 0, sure: 0, sayac: 0 });
  d.son = Date.now(); d.sure = d.son - bas; d.sayac++;
  if (hata) { d.hata = String((hata as Error)?.message ?? hata).slice(0, 200); d.hataZamani = d.son; }
}

function sar(id: string, f: Fn | undefined): Fn | undefined {
  if (!f || f.__damgali) return f;
  const s: Fn = async () => {
    const bas = Date.now();
    try { const r = await f(); zamanlayiciDamgala(id, bas); return r; } catch (e) { zamanlayiciDamgala(id, bas, e); throw e; }
  };
  s.__damgali = true;
  return s;
}

/** Tur işlevlerini sarar (tekrar çağrılabilir). */
export function zamanlayicilariIzle() {
  g.__vayraZamanlayiciTur = sar("sistem", g.__vayraZamanlayiciTur);
  g.__vayraBuyumeTurFn = sar("buyume", g.__vayraBuyumeTurFn);
  g.__vayraIsletmeTur = sar("isletme", g.__vayraIsletmeTur);
  g.__vayraIzlemeTur = sar("izleme", g.__vayraIzlemeTur);
  if (g.__vayraZamanli) g.__vayraZamanli.tik = sar("bulut", g.__vayraZamanli.tik)!;
  if (!g.__vayraZamanIzleT) {
    g.__vayraZamanIzleT = setInterval(zamanlayicilariIzle, 30_000);
    (g.__vayraZamanIzleT as { unref?: () => void }).unref?.();
  }
}

/** Her zamanlayıcının durumu: başlatıldı mı, son çalışma, izlenebiliyor mu. */
export function zamanlayiciDurumlari() {
  const kurulu: Record<string, boolean> = {
    sistem: !!g.__vayraZamanlayici, buyume: !!g.__vayraBuyumeZamanT, isletme: !!g.__vayraIsletmeZaman, bulut: !!g.__vayraZamanli?.z,
    odeme: !!g.__vayraOdemeZamanlayici, izleme: !!g.__vayraIzleme, ajan: !!g.__vayraAjanZamanlayici,
  };
  return ZAMANLAYICILAR.map((t) => ({ ...t, kurulu: kurulu[t.id] ?? false, damga: DAMGA[t.id] ?? null, izlenebilir: t.id !== "ajan" }));
}
