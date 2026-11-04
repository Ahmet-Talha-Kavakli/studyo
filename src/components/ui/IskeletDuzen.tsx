import { cn } from "@/lib/utils";

/* SAYFA DÜZENİ İSKELETLERİ — her biri bir sayfa ailesinin gerçek düzeninin izdüşümü:
   aynı yerde, aynı sayıda, aynı oranda kutu. Rota başına loading.tsx bunlardan birini seçer.
   Parçalar .iskelet-parca (globals.css) kullanır; hareketi azalt açıkken parıltı durur. */

const P = ({ className, style }: { className?: string; style?: React.CSSProperties }) => <div className={cn("iskelet-parca rounded-md", className)} style={style} aria-hidden />;

function Kap({ children, className, etiket = "Sayfa yükleniyor" }: { children: React.ReactNode; className?: string; etiket?: string }) {
  return <div role="status" aria-busy="true" aria-label={etiket} className={cn("min-h-[calc(100vh-var(--ust-nav))] bg-zemin", className)}>{children}</div>;
}

/** Yerleşik "justified" galeri satırları — oranlar gerçek içerik karışımını izler. */
export function IskeletGaleriSatirlari({ satirlar = [[1.5, 0.75, 1, 1.78, 1], [1, 1.78, 0.75, 1.5], [0.75, 1, 1.78, 1, 1.5]], yukseklik = 220, bosluk = 6 }: { satirlar?: number[][]; yukseklik?: number; bosluk?: number }) {
  return (
    <div className="flex flex-col" style={{ gap: bosluk }} aria-hidden>
      {satirlar.map((s, i) => (
        <div key={i} className="flex" style={{ gap: bosluk }}>
          {s.map((o, j) => <P key={j} className="rounded-xl" style={{ flexGrow: o, flexBasis: 0, height: yukseklik }} />)}
        </div>
      ))}
    </div>
  );
}

/** Komut kutusu — stüdyoların alttaki yüzen istem çubuğu. */
function KomutKutusu({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#141416] p-3", className)} aria-hidden>
      <div className="flex-1 space-y-2.5">
        <P className="h-4 w-2/3" />
        <div className="flex gap-1.5">{[64, 48, 40, 52, 44].map((w, i) => <P key={i} className="h-7 rounded-lg" style={{ width: w }} />)}</div>
      </div>
      <P className="h-14 w-24 shrink-0 rounded-xl" />
    </div>
  );
}

/* ── Tanıtım (hero) sayfaları: panel ana sayfa, 3D, canvas, originals, eklentiler ── */
export function IskeletTanitim({ ortali = false, gorsel = true }: { ortali?: boolean; gorsel?: boolean }) {
  return (
    <Kap>
      <div className={cn("mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-16 sm:px-10 lg:min-h-[calc(100vh-var(--ust-nav))]", !ortali && gorsel && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
        <div className={cn("space-y-4", ortali && "mx-auto flex max-w-[640px] flex-col items-center")}>
          <P className="h-6 w-40 rounded-full" />
          <P className="h-11 w-[85%]" />
          <P className="h-11 w-[60%]" />
          <div className={cn("space-y-2 pt-2", ortali && "flex w-full flex-col items-center")}><P className="h-4 w-[90%]" /><P className="h-4 w-[75%]" /><P className="h-4 w-[55%]" /></div>
          <div className="flex gap-3 pt-4"><P className="h-11 w-44 rounded-full" /><P className="h-11 w-36 rounded-full" /></div>
        </div>
        {gorsel && !ortali && <P className="aspect-[5/4] w-full rounded-3xl" />}
        {ortali && <div className="mx-auto grid w-full max-w-[900px] grid-cols-3 gap-4">{[0, 1, 2].map((i) => <P key={i} className="h-36 rounded-2xl" />)}</div>}
      </div>
    </Kap>
  );
}

/* ── Galeri + alttaki komut kutusu: Görsel stüdyosu ── */
export function IskeletGaleriKomut() {
  return (
    <Kap className="relative">
      <div className="px-1 pt-1"><IskeletGaleriSatirlari yukseklik={170} bosluk={4} satirlar={[[1, 0.75, 1, 1.5, 1, 0.75, 1], [1.5, 1, 0.75, 1, 1.78, 1], [0.75, 1, 1.5, 1, 1, 0.75, 1], [1, 1.78, 1, 0.75, 1.5]]} /></div>
      <div className="fixed inset-x-0 bottom-5 flex justify-center px-4"><KomutKutusu className="w-full max-w-[860px] bg-[#141416]/95" /></div>
    </Kap>
  );
}

/* ── Ses/Müzik listesi + komut kutusu ── */
export function IskeletSesListe() {
  return (
    <Kap className="relative px-5 pt-4">
      <div className="mb-5 flex gap-2"><P className="h-7 w-14 rounded-full" /><P className="h-7 w-24 rounded-full" /></div>
      {[0, 1].map((g) => (
        <div key={g} className="mb-7">
          <P className="mb-3 h-4 w-28" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <P key={i} className="h-[150px] rounded-2xl" />)}</div>
        </div>
      ))}
      <div className="fixed inset-x-0 bottom-5 flex justify-center px-4"><KomutKutusu className="w-full max-w-[760px]" /></div>
    </Kap>
  );
}

/* ── Sol ayar paneli + sağ galeri: Video, Shorts, Explainer, Müzik ── */
export function IskeletSolPanel({ kart = "landscape", panelGenislik = 230, bos = false }: { kart?: "landscape" | "portrait" | "kare"; panelGenislik?: number; bos?: boolean }) {
  const oran = kart === "portrait" ? "aspect-[9/14]" : kart === "kare" ? "aspect-square" : "aspect-video";
  const sutun = kart === "portrait" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5" : "grid-cols-2 sm:grid-cols-3";
  return (
    <Kap className="flex gap-4 p-3">
      <aside className="hidden shrink-0 flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#141416] p-3 md:flex" style={{ width: panelGenislik }}>
        <div className="flex gap-1.5">{[0, 1, 2].map((i) => <P key={i} className="h-12 flex-1 rounded-xl" />)}</div>
        <P className="h-28 rounded-xl" />
        <P className="h-20 rounded-xl" />
        <div className="space-y-2"><P className="h-3.5 w-1/3" /><P className="h-9 rounded-lg" /></div>
        <div className="flex gap-1.5">{[0, 1, 2].map((i) => <P key={i} className="h-8 flex-1 rounded-lg" />)}</div>
        <div className="mt-auto"><P className="h-11 rounded-xl" /></div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-2"><P className="h-8 w-24 rounded-lg" /><P className="h-8 w-20 rounded-lg" /><P className="ml-auto h-8 w-40 rounded-lg" /></div>
        {bos ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-3"><P className="h-12 w-12 rounded-full" /><P className="h-4 w-40" /><P className="h-3 w-56" /></div>
        ) : (
          <>
            <P className="mb-3 h-4 w-28" />
            <div className={cn("grid gap-2", sutun)}>{Array.from({ length: kart === "portrait" ? 10 : 9 }, (_, i) => <P key={i} className={cn("rounded-xl", oran)} />)}</div>
          </>
        )}
      </main>
    </Kap>
  );
}

/* ── Sol menü + sahne + komut + proje kartları: Sinema, Pazarlama ── */
export function IskeletSahne() {
  return (
    <Kap className="flex">
      <aside className="hidden w-[200px] shrink-0 space-y-2 border-r border-white/[0.06] p-3 md:block">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="flex items-center gap-2"><P className="h-5 w-5 rounded-md" /><P className="h-3.5 flex-1" /></div>)}
        <P className="!mt-6 h-3 w-16" />
        {Array.from({ length: 7 }, (_, i) => <div key={i} className="flex items-center gap-2"><P className="h-5 w-5 rounded-md" /><P className="h-3.5" style={{ width: `${55 + ((i * 17) % 35)}%` }} /></div>)}
      </aside>
      <main className="min-w-0 flex-1 p-4">
        <P className="h-[300px] rounded-3xl" />
        <KomutKutusu className="mx-auto -mt-10 w-[92%] max-w-[880px]" />
        <P className="mb-3 mt-8 h-4 w-24" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <P key={i} className="aspect-video rounded-xl" />)}</div>
      </main>
    </Kap>
  );
}

/* ── Başlık + içerik sayfaları ── */
export function IskeletBaslik({ eylem = true, ortali }: { eylem?: boolean; ortali?: boolean }) {
  return (
    <div className={cn("mb-7 flex items-end justify-between gap-4", ortali && "flex-col items-center")} aria-hidden>
      <div className={cn("space-y-2.5", ortali && "flex flex-col items-center")}><P className="h-8 w-52" /><P className="h-4 w-80 max-w-[70vw]" /></div>
      {eylem && !ortali && <P className="h-9 w-32 rounded-full" />}
    </div>
  );
}

/** Izgara sayfası: başlık + filtre çipleri + kart ızgarası (presetler, projeler, elementler, modeller). */
export function IskeletIzgaraSayfa({ oran = "aspect-video", sutun = "grid-cols-2 md:grid-cols-3 xl:grid-cols-4", adet = 8, cipler = 6, arama = true, altYazi = true, ilkKartBos = false, genislik = "max-w-[1400px]" }: {
  oran?: string; sutun?: string; adet?: number; cipler?: number; arama?: boolean; altYazi?: boolean; ilkKartBos?: boolean; genislik?: string;
}) {
  return (
    <Kap>
      <div className={cn("mx-auto px-5 pb-16 pt-6 sm:px-8", genislik)}>
        <IskeletBaslik />
        {(arama || cipler > 0) && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {arama && <P className="h-9 w-64 rounded-xl" />}
            {Array.from({ length: cipler }, (_, i) => <P key={i} className="h-8 rounded-full" style={{ width: 56 + ((i * 23) % 40) }} />)}
          </div>
        )}
        <div className={cn("grid gap-3", sutun)}>
          {Array.from({ length: adet }, (_, i) => (
            <div key={i}>
              <P className={cn("rounded-xl", oran, ilkKartBos && i === 0 && "!bg-transparent border border-dashed border-white/[0.1]")} />
              {altYazi && <div className="mt-2 space-y-1.5"><P className="h-3.5 w-2/3" /><P className="h-3 w-1/3" /></div>}
            </div>
          ))}
        </div>
      </div>
    </Kap>
  );
}

/** Liste sayfası: başlık + sekmeler + satırlar (+ sağ panel). Bildirimler. */
export function IskeletListe({ satir = 7, sagPanel = false, genislik = "max-w-[1200px]" }: { satir?: number; sagPanel?: boolean; genislik?: string }) {
  return (
    <Kap>
      <div className={cn("mx-auto px-5 pb-16 pt-8 sm:px-8", genislik)}>
        <IskeletBaslik />
        <div className={cn("grid gap-6", sagPanel && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
          <div className="rounded-2xl border border-white/[0.06] p-4">
            <div className="mb-4 flex gap-2">{[48, 64, 52, 60].map((w, i) => <P key={i} className="h-7 rounded-lg" style={{ width: w }} />)}<P className="ml-auto h-8 w-48 rounded-lg" /></div>
            {Array.from({ length: satir }, (_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-white/[0.04] py-3.5">
                <P className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5"><P className="h-3.5" style={{ width: `${40 + ((i * 13) % 30)}%` }} /><P className="h-3" style={{ width: `${55 + ((i * 7) % 30)}%` }} /></div>
                <P className="h-10 w-10 shrink-0 rounded-lg" />
              </div>
            ))}
          </div>
          {sagPanel && <div className="space-y-3 rounded-2xl border border-white/[0.06] p-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex items-center gap-3"><div className="flex-1 space-y-1.5"><P className="h-3.5 w-1/2" /><P className="h-3 w-4/5" /></div><P className="h-5 w-9 rounded-full" /></div>)}</div>}
        </div>
      </div>
    </Kap>
  );
}

/** Dar, ortalanmış içerik: Görevler, Sürüm geçmişi, Üretici merkezi, Uzun video. */
export function IskeletDar({ tur = "kartlar" }: { tur?: "kartlar" | "zaman" | "secim" }) {
  return (
    <Kap>
      <div className="mx-auto max-w-[720px] px-5 pb-16 pt-8">
        <P className="mb-5 h-3 w-24" />
        {tur === "secim" ? (
          <>
            <div className="flex flex-col items-center gap-3"><P className="h-6 w-36 rounded-full" /><P className="h-9 w-72" /><P className="h-4 w-96 max-w-full" /></div>
            <div className="mt-8 grid grid-cols-2 gap-3">{[0, 1].map((i) => <P key={i} className="h-40 rounded-2xl" />)}</div>
          </>
        ) : tur === "zaman" ? (
          <>
            <IskeletBaslik eylem={false} />
            {[0, 1, 2].map((g) => (
              <div key={g} className="mb-8 border-l border-white/[0.06] pl-5">
                <div className="mb-3 flex gap-2"><P className="h-5 w-14 rounded-md" /><P className="h-5 w-24" /></div>
                <P className="mb-3 h-5 w-64" />
                {Array.from({ length: 4 }, (_, i) => <div key={i} className="mb-2 flex gap-2"><P className="h-4 w-12 rounded" /><P className="h-4" style={{ width: `${50 + ((i * 11) % 40)}%` }} /></div>)}
              </div>
            ))}
          </>
        ) : (
          <>
            <P className="mb-6 h-20 rounded-2xl" />
            {[0, 1].map((g) => (
              <div key={g} className="mb-6">
                <P className="mb-3 h-4 w-32" />
                <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: g ? 2 : 4 }, (_, i) => <P key={i} className="h-[92px] rounded-xl" />)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </Kap>
  );
}

/** Kredi / plan sayfası: bakiye kartı + sekmeler + üç plan kartı. */
export function IskeletKredi() {
  return (
    <Kap>
      <div className="mx-auto max-w-[1000px] px-5 pb-16 pt-8">
        <P className="mb-2 h-3 w-28" /><P className="mb-6 h-9 w-48" />
        <div className="grid gap-4 rounded-2xl border border-white/[0.06] p-5 md:grid-cols-3">
          <div className="space-y-2"><P className="h-3 w-16" /><P className="h-9 w-28" /><P className="mt-2 h-1.5 w-full rounded-full" /></div>
          <div className="space-y-2.5">{[0, 1, 2].map((i) => <P key={i} className="h-4 w-4/5" />)}</div>
          <div className="space-y-2.5">{[0, 1, 2].map((i) => <P key={i} className="h-4 w-3/5" />)}</div>
        </div>
        <div className="my-6 flex gap-2">{[56, 88, 72, 48].map((w, i) => <P key={i} className="h-8 rounded-full" style={{ width: w }} />)}<P className="ml-auto h-8 w-40 rounded-full" /></div>
        <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((i) => <P key={i} className="h-[340px] rounded-2xl" />)}</div>
      </div>
    </Kap>
  );
}

/** Akış: ortada dikey video + sağda eylem sütunu. */
export function IskeletAkis() {
  return (
    <Kap className="flex items-start justify-center gap-4 pt-2">
      <P className="aspect-[9/16] h-[calc(100vh-72px)] max-h-[860px] rounded-2xl" />
      <div className="mt-auto hidden flex-col gap-4 pb-10 sm:flex">{Array.from({ length: 6 }, (_, i) => <P key={i} className="h-10 w-10 rounded-full" />)}</div>
    </Kap>
  );
}

/** Kitaplık: sol ray + araç çubuğu + tarih başlığı + ızgara. */
export function IskeletKitaplik() {
  return (
    <Kap className="flex">
      <aside className="hidden w-[248px] shrink-0 border-r border-white/[0.06] p-3 lg:block">
        {[0, 1, 2].map((i) => <div key={i} className="mb-1.5 flex items-center gap-2.5 py-1.5"><P className="h-7 w-7 rounded-lg" /><P className="h-3.5 flex-1" /></div>)}
        <P className="mb-2 mt-5 h-3 w-20" />
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="mb-1.5 flex items-center gap-2.5 py-1.5"><P className="h-7 w-7 rounded-lg" /><P className="h-3.5 flex-1" /></div>)}
        <P className="mb-2 mt-5 h-3 w-16" />
        {Array.from({ length: 3 }, (_, i) => <div key={i} className="mb-1.5 flex items-center gap-2.5 py-1.5"><P className="h-7 w-7 rounded-lg" /><P className="h-3.5 w-2/3" /></div>)}
      </aside>
      <main className="min-w-0 flex-1 px-4 pt-4">
        <div className="mb-3 flex items-center gap-2"><P className="h-7 w-36" /><P className="ml-4 h-9 w-72 rounded-xl" /><P className="ml-auto h-9 w-24 rounded-xl" /><P className="h-9 w-20 rounded-xl" /></div>
        <div className="mb-5 flex gap-2">{[88, 64, 56, 84].map((w, i) => <P key={i} className="h-8 rounded-lg" style={{ width: w }} />)}</div>
        <P className="mb-3 h-4 w-28" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">{Array.from({ length: 15 }, (_, i) => <P key={i} className="aspect-[4/5] rounded-xl" />)}</div>
      </main>
    </Kap>
  );
}

/** Raylı kabukların (API, Ayarlar) içerik alanı — ray layout'tan gelir. */
export function IskeletRayIcerik({ tur = "kartlar" }: { tur?: "kartlar" | "form" | "izgara" }) {
  return (
    <div role="status" aria-busy="true" aria-label="Yükleniyor">
      <IskeletBaslik />
      {tur === "izgara" ? (
        <>
          <div className="mb-5 flex gap-2"><P className="h-9 w-64 rounded-xl" />{[48, 56, 44, 52, 40].map((w, i) => <P key={i} className="h-8 rounded-full" style={{ width: w }} />)}</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.06]"><P className="aspect-[16/9] rounded-none" /><div className="space-y-2 p-4"><P className="h-4 w-1/2" /><P className="h-3 w-4/5" /></div></div>)}</div>
        </>
      ) : tur === "form" ? (
        <div className="space-y-6">{[3, 4, 2].map((n, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.06] p-5">
            <P className="mb-1.5 h-4 w-36" /><P className="mb-5 h-3 w-72 max-w-full" />
            {Array.from({ length: n }, (_, j) => <div key={j} className="flex items-center justify-between gap-6 border-t border-white/[0.04] py-4"><div className="flex-1 space-y-1.5"><P className="h-3.5 w-40" /><P className="h-3 w-64 max-w-full" /></div><P className="h-9 w-24 rounded-xl" /></div>)}
          </div>
        ))}</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <P key={i} className="h-[104px] rounded-2xl" />)}</div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"><P className="h-[300px] rounded-2xl" /><P className="h-[300px] rounded-2xl" /></div>
        </>
      )}
    </div>
  );
}

/** Mobil öncelikli araçlar (yükselt, inpaint, çiz …): masaüstünde sol akış paneli + sağ geçmiş; mobilde tek sütun. */
export function IskeletTekSutun() {
  return (
    <Kap className="sm:flex sm:h-[calc(100vh-var(--ust-nav))] sm:min-h-0">
      <div className="flex flex-col px-3 pt-3 sm:w-[440px] sm:shrink-0 sm:border-r sm:border-white/[0.06]">
        <div className="mb-3 flex h-[40px] items-center justify-between"><span className="w-9" /><P className="h-5 w-32" /><P className="h-8 w-8 rounded-full" /></div>
        <P className="aspect-[4/3] rounded-2xl" />
        <P className="mt-3 h-[76px] rounded-2xl" />
        <div className="mt-3 grid grid-cols-5 gap-1.5">{[0, 1, 2, 3, 4].map((i) => <P key={i} className="h-11 rounded-xl" />)}</div>
        <P className="mt-3 h-[52px] rounded-2xl" />
        <div className="mt-auto pb-4 pt-6"><P className="h-14 rounded-2xl" /></div>
      </div>
      <div className="hidden min-w-0 flex-1 flex-col sm:flex">
        <div className="flex h-[52px] items-center justify-between border-b border-white/[0.06] px-5"><P className="h-4 w-20" /><P className="h-3.5 w-24" /></div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3"><P className="h-14 w-14 rounded-2xl" /><P className="h-6 w-40" /><P className="h-4 w-72" /></div>
      </div>
    </Kap>
  );
}

/** Üç sütunlu editör: sol karakter rayı, orta tuval, sağ kurucu. Influencer. */
export function IskeletUcSutun() {
  return (
    <Kap className="flex gap-3 p-3">
      <aside className="hidden w-[150px] shrink-0 flex-col gap-2 md:flex"><P className="h-36 rounded-xl" />{[0, 1].map((i) => <P key={i} className="h-36 rounded-xl" />)}<P className="mt-auto h-12 rounded-xl" /></aside>
      <main className="flex min-w-0 flex-1 flex-col gap-3"><P className="flex-1 rounded-2xl" /><div className="flex justify-center gap-1.5">{Array.from({ length: 7 }, (_, i) => <P key={i} className="h-7 w-16 rounded-lg" />)}</div><P className="mx-auto h-11 w-80 rounded-xl" /></main>
      <aside className="hidden w-[300px] shrink-0 space-y-3 lg:block"><P className="h-4 w-20" /><div className="grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <P key={i} className="h-14 rounded-xl" />)}</div><div className="grid grid-cols-3 gap-1.5">{Array.from({ length: 12 }, (_, i) => <P key={i} className="aspect-square rounded-lg" />)}</div></aside>
    </Kap>
  );
}

/** Ortada kart (beta bilgi penceresi açan sayfalar: Montaj, Usta). */
export function IskeletOrtaKart() {
  return (
    <Kap className="flex items-center justify-center">
      <div className="flex w-[340px] flex-col items-center gap-3 rounded-2xl border border-white/[0.06] p-6"><P className="h-12 w-12 rounded-xl" /><P className="h-5 w-40" /><P className="h-3 w-full" /><P className="h-3 w-4/5" /><P className="mt-2 h-14 w-full rounded-xl" /><P className="h-10 w-full rounded-xl" /></div>
    </Kap>
  );
}

/** Sayfanın kendi düzeniyle birebir iskelet: kapak, avatar + ad, sayılar, sekmeler, galeri satırları. */
export function IskeletProfil() {
  return (
    <div className="min-h-screen bg-zemin" aria-busy="true" aria-label="Profil yükleniyor">
      <div className="mx-auto max-w-[1400px] sm:px-6 sm:pt-4"><div className="iskelet-parca h-[150px] sm:h-[240px] sm:rounded-3xl" /></div>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-10">
        <div className="flex items-end gap-4">
          <div className="iskelet-parca -mt-12 h-[112px] w-[112px] shrink-0 rounded-full ring-[5px] ring-zemin sm:-mt-14" />
          <div className="space-y-2 pb-2"><div className="iskelet-parca h-7 w-48 rounded-md" /><div className="iskelet-parca h-4 w-28 rounded-md" /></div>
        </div>
        <div className="mt-6 flex gap-7">{Array.from({ length: 4 }, (_, i) => <div key={i} className="space-y-1.5"><div className="iskelet-parca h-6 w-10 rounded-md" /><div className="iskelet-parca h-3 w-14 rounded-md" /></div>)}</div>
        <div className="mt-8 flex gap-4 border-b border-white/[0.07] pb-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="iskelet-parca h-5 w-24 rounded-md" />)}</div>
        <div className="mt-5 space-y-1.5">
          {[[1.5, 0.75, 1, 1.78], [1, 1.78, 0.75, 1.5]].map((satir, i) => (
            <div key={i} className="flex gap-1.5">{satir.map((o, j) => <div key={j} className="iskelet-parca h-[220px] rounded-xl" style={{ flexGrow: o, flexBasis: 0 }} />)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Pazarlama içerik alanı (kenar çubuğu layout'tan gelir): başlık + komut kutusu + örnekler. */
export function IskeletPazarlama() {
  return (
    <div role="status" aria-busy="true" aria-label="Yükleniyor" className="min-h-screen px-5 pt-16">
      <div className="mx-auto flex max-w-[760px] flex-col items-center gap-3"><P className="h-3 w-36" /><P className="h-10 w-[70%]" /><P className="h-10 w-[85%]" /></div>
      <KomutKutusu className="mx-auto mt-10 max-w-[760px]" />
      <div className="mt-10 flex justify-center gap-2">{[48, 72, 52, 60].map((w, i) => <P key={i} className="h-8 rounded-full" style={{ width: w }} />)}</div>
      <div className="mx-auto mt-6 grid max-w-[1100px] grid-cols-3 gap-2 md:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <P key={i} className="aspect-[3/4] rounded-xl" />)}</div>
    </div>
  );
}

/** MCP sayfası: başlık + sunucu kartı, kurulum (sol anahtar/istemci, sağ kod). */
export function IskeletMcp() {
  return (
    <Kap>
      <div className="mx-auto max-w-[1120px] px-4 pt-10 sm:px-8 sm:pt-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
          <div className="space-y-3"><P className="h-7 w-64 rounded-full" /><P className="h-12 w-[80%]" /><P className="h-4 w-[90%]" /><P className="h-4 w-[70%]" /></div>
          <P className="h-[150px] rounded-2xl" />
        </div>
        <P className="mb-5 mt-14 h-6 w-24" />
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="space-y-2"><P className="h-[120px] rounded-2xl" />{Array.from({ length: 6 }, (_, i) => <P key={i} className="h-11 rounded-xl" />)}</div>
          <div className="space-y-4"><div className="grid grid-cols-3 gap-2.5">{[0, 1, 2].map((i) => <P key={i} className="h-20 rounded-xl" />)}</div><P className="h-[260px] rounded-2xl" /></div>
        </div>
      </div>
    </Kap>
  );
}

/** Usta alt sayfaları (kenar çubuğu layout'tan gelir): başlık + liste satırları. */
export function IskeletScIcerik() {
  return (
    <div role="status" aria-busy="true" aria-label="Yükleniyor" className="mx-auto w-full max-w-[880px] px-6 pt-8">
      <P className="h-6 w-48" /><P className="mt-2 h-3.5 w-80 max-w-full" />
      <P className="mt-6 h-10 rounded-xl" />
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06]">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-white/[0.04] px-4 py-3.5 first:border-0">
            <P className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5"><P className="h-3.5" style={{ width: `${30 + ((i * 11) % 25)}%` }} /><P className="h-3" style={{ width: `${50 + ((i * 7) % 30)}%` }} /></div>
            <P className="h-5 w-9 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sohbet görünümü: mesaj balonları + alttaki giriş kutusu. */
export function IskeletSohbet() {
  return (
    <div role="status" aria-busy="true" aria-label="Yükleniyor" className="mx-auto flex min-h-[calc(100vh-var(--ust-nav))] w-full max-w-[760px] flex-col px-6 pb-6 pt-8">
      <div className="flex-1 space-y-6">
        <div className="flex justify-end"><P className="h-12 w-[55%] rounded-2xl" /></div>
        <div className="space-y-2"><P className="h-4 w-[90%]" /><P className="h-4 w-[80%]" /><P className="h-4 w-[60%]" /></div>
        <div className="flex justify-end"><P className="h-10 w-[40%] rounded-2xl" /></div>
        <div className="space-y-2"><P className="h-4 w-[85%]" /><P className="h-4 w-[70%]" /></div>
      </div>
      <P className="h-[92px] rounded-2xl" />
    </div>
  );
}

/** İki sütunlu form: solda büyük yükleme alanı + örnekler, sağda alanlar. Karakter oluştur. */
export function IskeletFormBolunmus() {
  return (
    <Kap>
      <div className="mx-auto grid max-w-[1200px] gap-5 px-5 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4"><P className="h-3 w-28" /><P className="h-[300px] rounded-2xl" /><div className="grid grid-cols-2 gap-4">{[0, 1].map((i) => <div key={i} className="space-y-2"><P className="h-4 w-3/4" /><div className="grid grid-cols-4 gap-1.5">{[0, 1, 2, 3].map((j) => <P key={j} className="aspect-square rounded-lg" />)}</div></div>)}</div></div>
        <div className="space-y-4"><P className="h-3 w-24" /><P className="h-10 rounded-xl" /><P className="h-3 w-16" /><P className="h-10 rounded-xl" /><P className="mx-auto h-36 w-36 rounded-full" /><P className="mx-auto h-36 w-36 rounded-full" /><P className="h-11 rounded-xl" /></div>
      </div>
    </Kap>
  );
}

/** API model ayrıntısı: model başlığı + sekmeler + form/çıktı iki sütun (ray layout'tan gelir). */
export function IskeletModelDetay() {
  return (
    <div role="status" aria-busy="true" aria-label="Yükleniyor">
      <div className="flex items-center gap-3"><P className="h-12 w-12 rounded-xl" /><div className="space-y-2"><P className="h-6 w-48" /><P className="h-3.5 w-72" /></div></div>
      <div className="mt-5 flex gap-4 border-b border-white/[0.06] pb-3">{[80, 64, 60, 64].map((w, i) => <P key={i} className="h-4" style={{ width: w }} />)}</div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2"><P className="h-[460px] rounded-2xl" /><P className="h-[460px] rounded-2xl" /></div>
    </div>
  );
}

/** Sonsuz tuval: boş alan + üst başlık + alt araç çubuğu. */
export function IskeletTuval() {
  return (
    <Kap className="relative">
      <div className="flex items-center justify-between px-4 py-3"><P className="h-6 w-32" /><div className="flex gap-2"><P className="h-8 w-8 rounded-full" /><P className="h-8 w-24 rounded-full" /></div></div>
      <div className="absolute inset-x-0 bottom-6 flex justify-center"><P className="h-11 w-[360px] rounded-2xl" /></div>
    </Kap>
  );
}
