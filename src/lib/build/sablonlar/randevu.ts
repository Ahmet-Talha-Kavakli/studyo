/* Şablon: Sıra · Randevu Masası — hizmet işletmeleri (berber, kuaför, klinik, stüdyo) için randevu takvimi. Günlük takvimde
 * personel sütunları, 15 dakikalık ızgara, boş yere tıklayınca randevu, fare ve dokunmatikle (basılı tutup) sürükleyerek
 * saat ve personel değiştirme, çakışma ve çalışma saati denetimi, uygun saat önerileri, durumlar (onaylı, geldi, gelmedi,
 * iptal), günün doluluğu ve cirosu, liste görünümü ve arama, hizmet, personel saatleri ve para birimi ayarları.
 * Veriler "personel", "hizmetler", "randevular" ve "ayarlar" tablolarında (ekibe özel: kurallar kapalı). Galerideki canlı
 * önizlemede gömülü kayıtlar ve bu cihazın belleğiyle çalışır. Tarih ve saat tarayıcının yerel saatidir. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";
import { PARA_JS } from "./parabirimi";

const AV = (a: string) => `/gercek/paz/av-${a}.webp`;
type Personel = { id: string; ad: string; unvan: string; avatar: string; baslangic: string; bitis: string; sira: number };
const PERSONEL: Personel[] = [
  { id: "p1", ad: "Emre Kaya", unvan: "Usta berber", avatar: AV("marco"), baslangic: "09:00", bitis: "18:00", sira: 1 },
  { id: "p2", ad: "Selin Aksoy", unvan: "Kuaför ve bakım", avatar: AV("yuna"), baslangic: "10:00", bitis: "19:00", sira: 2 },
  { id: "p3", ad: "Barış Demir", unvan: "Berber", avatar: AV("stefan"), baslangic: "11:00", bitis: "20:00", sira: 3 },
];
type Hizmet = { id: string; ad: string; sure: number; fiyat: number; renk: string };
const HIZMETLER: Hizmet[] = [
  { id: "h1", ad: "Saç kesimi", sure: 45, fiyat: 450, renk: "mercan" },
  { id: "h2", ad: "Sakal tıraşı", sure: 30, fiyat: 250, renk: "mavi" },
  { id: "h3", ad: "Saç ve sakal", sure: 60, fiyat: 650, renk: "mor" },
  { id: "h4", ad: "Saç boyama", sure: 90, fiyat: 1200, renk: "pembe" },
  { id: "h5", ad: "Cilt bakımı", sure: 45, fiyat: 700, renk: "yesil" },
  { id: "h6", ad: "Çocuk saç kesimi", sure: 30, fiyat: 300, renk: "sari" },
];
const RENKLER = ["mercan", "mavi", "mor", "pembe", "yesil", "sari", "gri"];
const DURUMLAR = ["Onaylı", "Geldi", "Gelmedi", "İptal"];
const ADLAR = ["Ahmet Yılmaz", "Can Demir", "Mert Şahin", "Burak Aydın", "Kaan Öztürk", "Deniz Arslan", "Elif Koç", "Zeynep Kurt", "Ali Çelik", "Mehmet Kaya", "Ozan Polat", "Ece Yıldız", "Selim Ateş", "Tolga Er", "Umut Güneş", "Berk Tan", "Hakan Uçar", "Cem Bulut", "Irmak Şen", "Yiğit Acar", "Gizem Aksu", "Onur Kılıç", "Serkan Yavuz", "Batu Özkan", "Lara Erdem", "Kerem Toprak"];
const TEL = (i: number) => "05" + String(30 + (i * 7) % 20) + " " + String(100 + (i * 137) % 900) + " " + String(10 + (i * 31) % 90) + " " + String(10 + (i * 53) % 90);
const IZIN: Record<string, string[]> = { p1: ["h1", "h2", "h3", "h6"], p2: ["h1", "h4", "h5", "h1"], p3: ["h1", "h2", "h3", "h6", "h2"] };

/** Başlangıç randevuları: gun, bugüne göre gün farkı; bas, gün içindeki dakika. Belirli (her açılışta aynı) üretilir. */
type RandevuTohum = { id: string; gun: number; personelId: string; hizmetId: string; bas: number; musteri: string; telefon: string; durum: string; not: string };
const RANDEVULAR: RandevuTohum[] = (() => {
  const l: RandevuTohum[] = [];
  let n = 0;
  const dk = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  for (let g = -2; g <= 4; g++) {
    PERSONEL.forEach((p, si) => {
      let t = dk(p.baslangic) + ((g + 3 + si) % 3) * 15;
      let k = 0;
      while (true) {
        const izin = IZIN[p.id];
        const h = HIZMETLER.find((x) => x.id === izin[(g + 9 + si * 2 + k * 3) % izin.length])!;
        if (t + h.sure > dk(p.bitis)) break;
        const bos = (g + k + si) % 4 === 0 || (g > 1 && (k + si) % 3 === 0) || (Math.abs(g) === 2 && k % 2 === 1);
        if (!bos) {
          n++;
          const ai = (n * 7 + si) % ADLAR.length;
          let durum = "Onaylı";
          if (g < 0) durum = n % 9 === 0 ? "Gelmedi" : "Geldi";
          else if (g === 0) durum = t < 12 * 60 ? (n % 7 === 0 ? "Gelmedi" : "Geldi") : "Onaylı";
          else if (n % 13 === 0) durum = "İptal";
          const not = n % 11 === 0 ? "Kısa kesim, yanlar sıfır" : n % 17 === 0 ? "İlk kez geliyor" : "";
          l.push({ id: "r" + n, gun: g, personelId: p.id, hizmetId: h.id, bas: t, musteri: ADLAR[ai], telefon: TEL(ai + 3), durum, not });
          t += h.sure + ((k + g + si) % 5 === 0 ? 15 : 0);
        } else t += 30 + ((k + si) % 2) * 15;
        k++;
      }
    });
  }
  return l;
})();

function tablolarKur(): Record<string, SablonTablo> {
  const bugun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const gunEkle = (t: string, n: number) => { const d = new Date(t + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const saat = (d: number) => String(Math.floor(d / 60)).padStart(2, "0") + ":" + String(d % 60).padStart(2, "0");
  const kapali = { okuma: "kapali" as const, ekleme: "kapali" as const, duzenleme: "kapali" as const };
  return {
    personel: {
      aciklama: "Randevu alan çalışanlar. baslangic ve bitis günlük çalışma saatidir (SS:DD); sira takvimdeki sütun sırasıdır.",
      kurallar: kapali,
      sema: [
        { ad: "ad", tur: "metin", zorunlu: true },
        { ad: "unvan", tur: "metin" },
        { ad: "avatar", tur: "gorsel" },
        { ad: "baslangic", tur: "metin", varsayilan: "09:00" },
        { ad: "bitis", tur: "metin", varsayilan: "18:00" },
        { ad: "sira", tur: "sayi" },
      ],
      kayitlar: PERSONEL,
    },
    hizmetler: {
      aciklama: "Sunulan hizmetler: süre (dakika), fiyat (ayarlar tablosundaki para biriminde) ve takvim rengi.",
      kurallar: kapali,
      sema: [
        { ad: "ad", tur: "metin", zorunlu: true },
        { ad: "sure", tur: "sayi", zorunlu: true, aciklama: "Dakika, 15'in katı" },
        { ad: "fiyat", tur: "sayi" },
        { ad: "renk", tur: "secim", secenekler: RENKLER, varsayilan: "mercan" },
      ],
      kayitlar: HIZMETLER,
    },
    randevular: {
      aciklama: "Randevular. tarih YYYY-AA-GG, baslangic SS:DD, sure dakika; hizmetAd ve fiyat randevu anındaki değerdir. durum Onaylı, Geldi, Gelmedi ya da İptal.",
      kurallar: kapali,
      sema: [
        { ad: "musteri", tur: "metin", zorunlu: true },
        { ad: "telefon", tur: "metin" },
        { ad: "personelId", tur: "iliski", iliski: "personel", zorunlu: true, silinince: "kisitla" },
        { ad: "hizmetId", tur: "iliski", iliski: "hizmetler", silinince: "bosalt" },
        { ad: "hizmetAd", tur: "metin" },
        { ad: "tarih", tur: "metin", zorunlu: true },
        { ad: "baslangic", tur: "metin", zorunlu: true },
        { ad: "sure", tur: "sayi", zorunlu: true },
        { ad: "fiyat", tur: "sayi" },
        { ad: "durum", tur: "secim", secenekler: DURUMLAR, varsayilan: "Onaylı" },
        { ad: "not", tur: "uzunMetin" },
      ],
      kayitlar: RANDEVULAR.map((r) => {
        const h = HIZMETLER.find((x) => x.id === r.hizmetId)!;
        return { id: r.id, musteri: r.musteri, telefon: r.telefon, personelId: r.personelId, hizmetId: r.hizmetId, hizmetAd: h.ad, tarih: gunEkle(bugun, r.gun), baslangic: saat(r.bas), sure: h.sure, fiyat: h.fiyat, durum: r.durum, not: r.not };
      }),
    },
    ayarlar: {
      aciklama: "İşletme ayarları (tek kayıt, id ayarlar): paraBirimi (ISO 4217), takvimin açılış ve kapanış saati (tam saat, SS:DD).",
      kurallar: kapali,
      sema: [
        { ad: "paraBirimi", tur: "metin", varsayilan: "TRY" },
        { ad: "acilis", tur: "metin", varsayilan: "09:00" },
        { ad: "kapanis", tur: "metin", varsayilan: "20:00" },
      ],
      kayitlar: [{ id: "ayarlar", paraBirimi: "TRY", acilis: "09:00", kapanis: "20:00" }],
    },
  };
}

const STIL = String.raw`/* Sıra — sıcak kum zemin, gece laciverti mürekkep, mercan imza; Bricolage Grotesque başlık, Inter metin. */
:root {
  --zemin: #f5f2ec;
  --panel: #ffffff;
  --panel-2: #faf8f4;
  --cizgi: #e6e0d6;
  --cizgi-2: #d6cfc2;
  --metin: #1d2333;
  --metin-2: #545a69;
  --metin-3: #8a8f9a;
  --lacivert: #1f2a44;
  --vurgu: #e8573a;
  --vurgu-koyu: #c9431f;
  --vurgu-acik: #fde7e0;
  --yesil: #18825b;
  --kirmizi: #c8372d;
  --r: 14px;
  --satir: 18px;
  --yazi: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --baslik: "Bricolage Grotesque", "Inter", system-ui, sans-serif;
  --egri: cubic-bezier(.22, 1, .36, 1);
  color-scheme: light;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html, body { margin: 0; }
body { background: var(--zemin); color: var(--metin); font: 14px/1.45 var(--yazi); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--vurgu); outline-offset: 2px; }
h1, h2, h3 { margin: 0; font-family: var(--baslik); font-weight: 600; letter-spacing: -0.02em; }

/* Renk paleti: hizmet renkleri (zemin ve yazı) */
[data-renk="mercan"] { --a: #ffe0d6; --k: #a3361a; --c: #e8573a; }
[data-renk="mavi"] { --a: #dde8ff; --k: #1d4ba8; --c: #3b6fe0; }
[data-renk="mor"] { --a: #ebe1ff; --k: #5b2fb0; --c: #7c4ddc; }
[data-renk="pembe"] { --a: #fde0f0; --k: #9c1f68; --c: #d13d8c; }
[data-renk="yesil"] { --a: #d8f3e6; --k: #11663f; --c: #1f9a63; }
[data-renk="sari"] { --a: #fdf0cc; --k: #845a05; --c: #d39b12; }
[data-renk="gri"] { --a: #e9eaee; --k: #3e4452; --c: #7a8090; }

/* Üst çubuk */
.ust { position: sticky; top: 0; z-index: 40; background: rgba(245,242,236,.9); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--cizgi); }
.ust-ic { max-width: 1480px; margin: 0 auto; padding: 11px 24px; display: flex; align-items: center; gap: 20px; }
.marka { display: flex; align-items: center; gap: 10px; min-width: 0; }
.marka svg { width: 34px; height: 34px; flex: none; }
.marka b { display: block; font-family: var(--baslik); font-size: 18px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
.marka small { display: block; color: var(--metin-3); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav { display: flex; gap: 4px; background: #ebe6dd; padding: 4px; border-radius: 12px; }
.nav button { border: 0; background: none; height: 34px; padding: 0 14px; border-radius: 9px; font-weight: 600; font-size: 13.5px; color: var(--metin-2); display: flex; align-items: center; gap: 7px; }
.nav button svg { width: 17px; height: 17px; }
.nav button[aria-current="page"] { background: var(--panel); color: var(--metin); }
.bosluk { flex: 1; }
.mod { display: flex; align-items: center; gap: 7px; color: var(--metin-3); font-size: 12.5px; white-space: nowrap; }
.mod i { width: 7px; height: 7px; border-radius: 50%; background: #d39b12; }
.mod[data-bagli="1"] i { background: var(--yesil); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 40px; padding: 0 15px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel); font-weight: 600; font-size: 13.5px; white-space: nowrap; text-decoration: none; transition: background .15s, transform .1s; }
.dugme:hover { background: var(--panel-2); }
.dugme:active { transform: scale(.98); }
.dugme svg { width: 17px; height: 17px; flex: none; }
.dugme.ana { background: var(--vurgu); border-color: var(--vurgu); color: #fff; }
.dugme.ana:hover { background: var(--vurgu-koyu); }
.dugme.koyu { background: var(--lacivert); border-color: var(--lacivert); color: #fff; }
.dugme.tehlike { color: var(--kirmizi); }
.dugme.kucuk { height: 34px; padding: 0 11px; font-size: 13px; border-radius: 9px; }
.dugme.ikon { width: 40px; padding: 0; }
.dugme[disabled] { opacity: .55; pointer-events: none; }

main { max-width: 1480px; margin: 0 auto; padding: 20px 24px 60px; }

/* Takvim başı */
.takvim-bas { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.gun-nav { display: flex; align-items: center; gap: 6px; }
.gun-nav h1 { font-size: 26px; margin-left: 8px; white-space: nowrap; }
.gun-nav h1 small { display: block; font-family: var(--yazi); font-size: 13px; font-weight: 500; color: var(--metin-3); letter-spacing: 0; }
.tarih-sec { position: relative; }
.tarih-sec input { position: absolute; inset: 0; opacity: 0; width: 100%; cursor: pointer; }
.hafta { display: flex; gap: 6px; margin-left: auto; }
.hafta button { width: 58px; padding: 7px 0 6px; border-radius: 12px; border: 1px solid var(--cizgi); background: var(--panel); display: flex; flex-direction: column; align-items: center; gap: 1px; }
.hafta button small { font-size: 11.5px; color: var(--metin-3); font-weight: 600; }
.hafta button b { font-family: var(--baslik); font-size: 18px; line-height: 1.1; }
.hafta button em { font-style: normal; font-size: 11px; color: var(--metin-3); font-weight: 600; }
.hafta button.bugun b { color: var(--vurgu); }
.hafta button[aria-pressed="true"] { background: var(--lacivert); border-color: var(--lacivert); color: #fff; }
.hafta button[aria-pressed="true"] small, .hafta button[aria-pressed="true"] em { color: #c3c8d6; }
.hafta button[aria-pressed="true"].bugun b { color: #ffb4a3; }

.takvim-govde { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
.izgara-kap { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); overflow: hidden; min-width: 0; }
.izgara-kaydir { overflow-x: auto; }
.izgara { min-width: calc(56px + var(--sutun) * 170px); }
.izgara-ust { display: grid; grid-template-columns: 56px repeat(var(--sutun), minmax(0, 1fr)); border-bottom: 1px solid var(--cizgi); background: var(--panel-2); position: sticky; top: 0; z-index: 3; }
.izgara-ust .kisi { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border-left: 1px solid var(--cizgi); min-width: 0; }
.izgara-ust .kisi img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex: none; }
.izgara-ust .kisi b { display: block; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.izgara-ust .kisi small { display: block; font-size: 12px; color: var(--metin-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.izgara-ic { display: grid; grid-template-columns: 56px repeat(var(--sutun), minmax(0, 1fr)); position: relative; }
.saatler { position: relative; }
.saatler span { position: absolute; right: 8px; transform: translateY(-50%); font-size: 11.5px; color: var(--metin-3); font-variant-numeric: tabular-nums; }
.saatler span:first-child { transform: none; }
.sutun { position: relative; border-left: 1px solid var(--cizgi); cursor: copy; touch-action: pan-x pan-y;
  background-image: linear-gradient(to bottom, #ece7de 1px, transparent 1px), linear-gradient(to bottom, #f4f1eb 1px, transparent 1px);
  background-size: 100% calc(var(--satir) * 4), 100% calc(var(--satir) * 2); }
.sutun .kapali { position: absolute; left: 0; right: 0; background: repeating-linear-gradient(-45deg, rgba(31,42,68,.045) 0 6px, transparent 6px 12px); pointer-events: none; }
.sutun.hedef { background-color: #fff7f4; }
.yer-tutucu { position: absolute; left: 4px; right: 4px; border: 1.5px dashed var(--vurgu); border-radius: 9px; background: rgba(232,87,58,.06); pointer-events: none; display: flex; align-items: flex-start; padding: 3px 8px; font-size: 12px; font-weight: 700; color: var(--vurgu-koyu); }
.rdv { position: absolute; left: 4px; right: 4px; border: 0; border-left: 3px solid var(--c); border-radius: 9px; background: var(--a); color: var(--k); text-align: left; padding: 4px 8px; overflow: hidden; display: flex; flex-direction: column; gap: 1px; cursor: grab; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: pan-x pan-y; transition: transform .12s, opacity .12s; z-index: 1; }
.rdv b { font-size: 12.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--metin); }
.rdv span { font-size: 11.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rdv.kisa { flex-direction: row; align-items: center; gap: 6px; padding-top: 2px; padding-bottom: 2px; }
.rdv.kisa span { order: -1; }
.rdv[data-durum="Geldi"] { background: linear-gradient(var(--a), var(--a)) padding-box; opacity: .78; }
.rdv[data-durum="Geldi"]::after { content: ""; position: absolute; top: 5px; right: 6px; width: 14px; height: 14px; border-radius: 50%; background: var(--c) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12.5 10 17 19 7'/%3E%3C/svg%3E") center / 10px no-repeat; }
.rdv[data-durum="Gelmedi"] { background: repeating-linear-gradient(-45deg, #fbe4e1 0 6px, #fff 6px 12px); border-left-color: var(--kirmizi); }
.rdv[data-durum="Gelmedi"] b { text-decoration: line-through; color: var(--kirmizi); }
.rdv.suruklenen { z-index: 6; cursor: grabbing; transform: scale(1.02); opacity: .95; outline: 2px solid var(--c); }
.simdi { position: absolute; left: 56px; right: 0; height: 0; border-top: 2px solid var(--vurgu); z-index: 4; pointer-events: none; }
.simdi::before { content: ""; position: absolute; left: -5px; top: -6px; width: 10px; height: 10px; border-radius: 50%; background: var(--vurgu); }
.personel-cipler { display: none; }

/* Özet paneli */
.ozet { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 76px; }
.blok { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 16px; }
.blok h2 { font-size: 15.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.blok h2 .ek { margin-left: auto; font-family: var(--yazi); font-weight: 600; font-size: 12.5px; color: var(--metin-3); letter-spacing: 0; }
.rakamlar { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rakam { background: var(--panel-2); border-radius: 11px; padding: 11px 12px; min-width: 0; }
.rakam small { display: block; font-size: 12px; color: var(--metin-3); font-weight: 600; }
.rakam b { display: block; font-family: var(--baslik); font-size: 22px; font-weight: 600; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doluluk { height: 6px; border-radius: 3px; background: #ece7de; margin-top: 7px; overflow: hidden; }
.doluluk i { display: block; height: 100%; background: var(--vurgu); border-radius: 3px; }
.sirali { display: flex; flex-direction: column; gap: 4px; }
.sirali button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px; margin: 0 -8px; width: calc(100% + 16px); border: 0; background: none; border-radius: 10px; text-align: left; }
.sirali button:hover { background: var(--panel-2); }
.sirali .saat { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; width: 44px; flex: none; }
.sirali .nokta { width: 8px; height: 8px; border-radius: 50%; background: var(--c); flex: none; }
.sirali .metin { min-width: 0; flex: 1; }
.sirali .metin b { display: block; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sirali .metin small { display: block; font-size: 12px; color: var(--metin-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bos-yazi { color: var(--metin-3); font-size: 13px; margin: 0; }
.lejant { display: flex; flex-wrap: wrap; gap: 6px; }
.lejant span { display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border-radius: 999px; background: var(--a); color: var(--k); font-size: 12px; font-weight: 600; }

/* Liste */
.sayfa-bas { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
.sayfa-bas h1 { font-size: 28px; }
.sayfa-bas p { margin: 3px 0 0; color: var(--metin-2); }
.sayfa-bas .eylem { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
.suzgec { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
.cipler { display: flex; gap: 6px; flex-wrap: wrap; }
.cip { height: 36px; padding: 0 13px; border-radius: 999px; border: 1px solid var(--cizgi-2); background: var(--panel); font-weight: 600; font-size: 13px; color: var(--metin-2); }
.cip[aria-pressed="true"] { background: var(--lacivert); border-color: var(--lacivert); color: #fff; }
.ara { margin-left: auto; position: relative; width: 300px; max-width: 100%; }
.ara svg { position: absolute; left: 12px; top: 50%; translate: 0 -50%; width: 17px; height: 17px; color: var(--metin-3); }
.ara input { width: 100%; height: 40px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel); padding: 0 12px 0 38px; }
.gun-grup { margin-bottom: 16px; }
.gun-grup h2 { font-size: 15px; margin: 0 0 8px; display: flex; gap: 8px; align-items: baseline; }
.gun-grup h2 small { font-family: var(--yazi); color: var(--metin-3); font-weight: 600; font-size: 12.5px; letter-spacing: 0; }
.liste { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); overflow: hidden; }
.satir { display: grid; grid-template-columns: 70px minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, .9fr) 110px 96px; align-items: center; gap: 12px; padding: 11px 16px; border: 0; border-bottom: 1px solid #f0ece5; background: none; width: 100%; text-align: left; }
.satir:last-child { border-bottom: 0; }
.satir:hover { background: var(--panel-2); }
.satir .saat { font-weight: 700; font-variant-numeric: tabular-nums; }
.satir .saat small { display: block; font-weight: 500; color: var(--metin-3); font-size: 12px; }
.satir b { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.satir small { color: var(--metin-3); font-size: 12.5px; }
.satir .hiz { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
.satir .hiz i { width: 9px; height: 9px; border-radius: 3px; background: var(--c); flex: none; }
.satir .hiz span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.satir .kim { display: flex; align-items: center; gap: 8px; min-width: 0; }
.satir .kim img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex: none; }
.satir .kim span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.satir .ucret { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.durum { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12.5px; font-weight: 700; white-space: nowrap; background: #e8edf8; color: #2b4a8f; }
.durum[data-d="Geldi"] { background: #dcf3e8; color: var(--yesil); }
.durum[data-d="Gelmedi"] { background: #fbe4e1; color: var(--kirmizi); }
.durum[data-d="İptal"] { background: #eeece8; color: var(--metin-3); }
.bos { padding: 42px 20px; text-align: center; color: var(--metin-2); background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); }
.bos b { display: block; font-family: var(--baslik); font-size: 19px; color: var(--metin); margin-bottom: 3px; }

/* Ayarlar */
.ayar-izgara { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.ayar-sutun { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.hizmet-satir { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0ece5; }
.hizmet-satir:last-of-type { border-bottom: 0; }
.hizmet-satir i { width: 12px; height: 12px; border-radius: 4px; background: var(--c); flex: none; }
.hizmet-satir .metin { flex: 1; min-width: 0; }
.hizmet-satir .metin b { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hizmet-satir .metin small { color: var(--metin-3); font-size: 12.5px; }
.hizmet-satir .ucret { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.personel-satir { display: grid; grid-template-columns: 36px minmax(0, 1fr) 96px 96px; gap: 10px; align-items: center; padding: 9px 0; border-bottom: 1px solid #f0ece5; }
.personel-satir:last-of-type { border-bottom: 0; }
.personel-satir img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.personel-satir b { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.personel-satir small { color: var(--metin-3); font-size: 12.5px; }
.personel-satir input, .alan input, .alan select, .alan textarea { width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--cizgi-2); background: var(--panel); padding: 0 10px; min-width: 0; }
.alan textarea { height: auto; min-height: 70px; padding: 9px 10px; resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus, .personel-satir input:focus { outline: none; border-color: var(--vurgu); }
.alanlar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.alan { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.alan.tam { grid-column: 1 / -1; }
.alan > span { font-size: 12.5px; font-weight: 600; color: var(--metin-2); }
.ipucu { font-size: 12.5px; color: var(--metin-3); margin: 10px 0 0; }
.hata-yazi { color: var(--kirmizi); font-size: 13px; font-weight: 600; margin: 4px 0 0; }
.uygun { display: flex; gap: 6px; flex-wrap: wrap; }
.uygun button { height: 32px; padding: 0 11px; border-radius: 8px; border: 1px solid var(--cizgi-2); background: var(--panel); font-weight: 600; font-size: 13px; font-variant-numeric: tabular-nums; }
.uygun button[aria-pressed="true"] { background: var(--vurgu-acik); border-color: var(--vurgu); color: var(--vurgu-koyu); }
.renk-sec { display: flex; gap: 8px; flex-wrap: wrap; }
.renk-sec label { position: relative; }
.renk-sec input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.renk-sec span { display: block; width: 30px; height: 30px; border-radius: 9px; background: var(--c); border: 3px solid #fff; outline: 1px solid var(--cizgi-2); cursor: pointer; }
.renk-sec input:checked + span { outline: 2px solid var(--metin); }
.renk-sec input:focus-visible + span { outline: 2px solid var(--vurgu); }

/* Pencere */
.pencere-kap { position: fixed; inset: 0; z-index: 80; background: rgba(29,35,51,.42); display: grid; place-items: center; padding: 20px; animation: sol .2s; }
.pencere { width: min(540px, 100%); max-height: calc(100dvh - 40px); overflow: auto; background: var(--panel); border-radius: 18px; padding: 22px; animation: yuksel .28s var(--egri); }
.pencere h2 { font-size: 22px; margin-bottom: 4px; }
.pencere > p { margin: 0 0 16px; color: var(--metin-2); }
.pencere .alt-dugmeler { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; flex-wrap: wrap; }
.detay-bant { margin: -22px -22px 16px; padding: 18px 22px; background: var(--a); color: var(--k); border-radius: 18px 18px 0 0; }
.detay-bant small { font-weight: 700; font-size: 12.5px; }
.detay-bant h2 { color: var(--metin); margin: 2px 0 0; }
.bilgi { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--cizgi); border: 1px solid var(--cizgi); border-radius: 12px; overflow: hidden; }
.bilgi div { background: var(--panel); padding: 10px 12px; min-width: 0; }
.bilgi small { display: block; font-size: 12px; color: var(--metin-3); font-weight: 600; }
.bilgi b { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.durum-sec { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 14px 0 4px; }
.durum-sec button { height: 38px; border-radius: 10px; border: 1px solid var(--cizgi-2); background: var(--panel); font-weight: 700; font-size: 13px; color: var(--metin-2); }
.durum-sec button[aria-pressed="true"] { background: var(--lacivert); border-color: var(--lacivert); color: #fff; }
.not-kutu { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: var(--panel-2); color: var(--metin-2); font-size: 13.5px; }
@keyframes sol { from { opacity: 0; } }
@keyframes yuksel { from { transform: translateY(16px); opacity: 0; } }

.bildirim { position: fixed; left: 50%; bottom: 26px; z-index: 90; translate: -50% 20px; opacity: 0; pointer-events: none; background: var(--lacivert); color: #fff; padding: 11px 16px; border-radius: 12px; font-weight: 600; font-size: 13.5px; transition: .25s var(--egri); max-width: calc(100vw - 32px); text-align: center; }
.bildirim.acik { opacity: 1; translate: -50% 0; }
.bildirim[data-tur="hata"] { background: var(--kirmizi); }
.yeni-yuzen { display: none; }
.alt-nav { display: none; }
.yukleniyor { padding: 80px 0; text-align: center; color: var(--metin-3); }

@media (max-width: 1180px) {
  .takvim-govde { grid-template-columns: 1fr; }
  .ozet { position: static; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .hafta { margin-left: 0; width: 100%; }
  .hafta button { flex: 1; width: auto; }
  .ayar-izgara { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .ust-ic { padding: 10px 16px; }
  .ust .nav, .ust .ust-yeni, .mod span { display: none; }
  main { padding: 14px 16px 150px; }
  .gun-nav { width: 100%; }
  .gun-nav h1 { font-size: 21px; margin-left: 4px; flex: 1; min-width: 0; white-space: normal; }
  .gun-nav .gizle-mobil { display: none; }
  .hafta { gap: 4px; }
  .hafta button { padding: 6px 0 5px; }
  .hafta button b { font-size: 16px; }
  .personel-cipler { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px 10px; padding: 0 16px; }
  .personel-cipler::-webkit-scrollbar { display: none; }
  .personel-cipler button { flex: none; display: flex; align-items: center; gap: 7px; height: 40px; padding: 0 12px 0 5px; border-radius: 999px; border: 1px solid var(--cizgi-2); background: var(--panel); font-weight: 600; font-size: 13px; }
  .personel-cipler button img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
  .personel-cipler button[aria-pressed="true"] { background: var(--lacivert); border-color: var(--lacivert); color: #fff; }
  .izgara { min-width: 0; }
  .izgara-ust { display: none; }
  .izgara-ic { grid-template-columns: 46px minmax(0, 1fr); }
  .simdi { left: 46px; }
  .ozet { grid-template-columns: 1fr; }
  .sayfa-bas h1 { font-size: 24px; }
  .ara { width: 100%; margin-left: 0; order: -1; }
  .satir { grid-template-columns: 56px minmax(0, 1fr) auto; grid-template-areas: "saat kisi ucret" "saat hiz durum"; row-gap: 3px; }
  .satir .saat { grid-area: saat; align-self: start; }
  .satir .musteri-h { grid-area: kisi; min-width: 0; }
  .satir .hiz { grid-area: hiz; font-size: 12.5px; color: var(--metin-2); }
  .satir .kim { display: none; }
  .satir .ucret { grid-area: ucret; }
  .satir .durum-h { grid-area: durum; justify-self: end; }
  .personel-satir { grid-template-columns: 36px minmax(0, 1fr) 84px 84px; gap: 8px; }
  .alt-nav { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; background: rgba(255,255,255,.95); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-top: 1px solid var(--cizgi); padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); }
  .alt-nav button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; border: 0; background: none; color: var(--metin-3); font-size: 11.5px; font-weight: 700; border-radius: 10px; }
  .alt-nav button svg { width: 22px; height: 22px; }
  .alt-nav button[aria-current="page"] { color: var(--vurgu); }
  .yeni-yuzen { display: inline-flex; position: fixed; right: 16px; bottom: calc(76px + env(safe-area-inset-bottom)); z-index: 45; height: 52px; padding: 0 20px; border-radius: 16px; font-size: 15px; }
  .pencere-kap { place-items: end stretch; padding: 0; }
  .pencere { width: 100%; border-radius: 20px 20px 0 0; max-height: 92dvh; padding: 20px 16px calc(20px + env(safe-area-inset-bottom)); }
  .detay-bant { margin: -20px -16px 14px; padding: 16px; border-radius: 20px 20px 0 0; }
  .durum-sec { grid-template-columns: repeat(2, 1fr); }
  .bildirim { bottom: 90px; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
`;

const UYGULAMA = ORTAK_JS + PARA_JS("sira-randevu-para-birimi") + "\nvar TOHUM = " + JSON.stringify({ personel: PERSONEL, hizmetler: HIZMETLER, randevular: RANDEVULAR }) + ";\nvar RENKLER = " + JSON.stringify(RENKLER) + ";\nvar DURUMLAR = " + JSON.stringify(DURUMLAR) + ";\n" + String.raw`
/* ── Durum ── */
var SATIR = 18; /* 15 dakikanın piksel yüksekliği */
var S = { personel: [], hizmetler: [], randevular: [], ayar: { id: null, acilis: "09:00", kapanis: "20:00" }, tarih: bugun(), gorunum: "takvim", mobilPersonel: "", ara: "", liste: "yaklasan", yuklendi: false, kilit: "" };
var IK = {
  takvim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  liste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>',
  ayar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>',
  arti: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  sol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  sag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  ara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  tel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  kopya: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
  duzenle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  cop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  takvimKucuk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>'
};

/* ── Tarih ve saat (tarayıcının yerel saati) ── */
function iki(n) { return String(n).padStart(2, "0"); }
function bugun() { var d = new Date(); return d.getFullYear() + "-" + iki(d.getMonth() + 1) + "-" + iki(d.getDate()); }
function simdiDk() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function dk(s) { return saatDakika(s); }
function saat(d) { return dakikaSaat(d); }
function saatYaz(d) { return saat(d).replace(":", "."); }
function saatEkli(d, ek) { return saatYaz(d) + "'" + saatEki(d, ek); }
function gunAdi(t, uzun) { var s = new Date(t + "T12:00:00Z").toLocaleDateString("tr-TR", { weekday: uzun ? "long" : "short", timeZone: "UTC" }); return s.charAt(0).toLocaleUpperCase("tr") + s.slice(1); }
function haftaBasi(t) { var g = haftaGunu(t); return gunEkle(t, -(g === 0 ? 6 : g - 1)); }

/* ── Depo: Vayra Veri ya da bu cihazın belleği ── */
var YEREL = "sira-randevu-v1", yerel = null;
function tohumCoz() {
  var b = bugun(), z = Date.now();
  var hz = {}; TOHUM.hizmetler.forEach(function (h) { hz[h.id] = h; });
  return {
    surum: 1,
    personel: TOHUM.personel.map(function (p) { return Object.assign({ olusturma: z, guncelleme: z }, p); }),
    hizmetler: TOHUM.hizmetler.map(function (h) { return Object.assign({ olusturma: z, guncelleme: z }, h); }),
    randevular: TOHUM.randevular.map(function (r) { var h = hz[r.hizmetId]; return { id: r.id, musteri: r.musteri, telefon: r.telefon, personelId: r.personelId, hizmetId: r.hizmetId, hizmetAd: h.ad, tarih: gunEkle(b, r.gun), baslangic: saat(r.bas), sure: h.sure, fiyat: h.fiyat, durum: r.durum, not: r.not, olusturma: z, guncelleme: z }; }),
    ayarlar: [{ id: "ayarlar", paraBirimi: "TRY", acilis: "09:00", kapanis: "20:00", olusturma: z, guncelleme: z }]
  };
}
function yerelAl() {
  if (!yerel) { try { yerel = JSON.parse(localStorage.getItem(YEREL) || "null"); } catch (e) { yerel = null; } if (!yerel || yerel.surum !== 1) { yerel = tohumCoz(); yerelYaz(); } }
  return yerel;
}
function yerelYaz() { try { localStorage.setItem(YEREL, JSON.stringify(yerel)); } catch (e) { /* bellek dolu */ } }
function yeniId() { return "y" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function kopya(x) { return JSON.parse(JSON.stringify(x)); }
var Depo = {
  liste: function (kol) { return veriVar() ? vayra.veri.liste(kol, { sinir: 1000 }) : Promise.resolve(kopya(yerelAl()[kol] || [])); },
  ekle: function (kol, k) {
    if (veriVar()) return vayra.veri.ekle(kol, k);
    var r = Object.assign({ id: yeniId(), olusturma: Date.now(), guncelleme: Date.now() }, k);
    yerelAl()[kol].push(r); yerelYaz(); return Promise.resolve(kopya(r));
  },
  guncelle: function (kol, id, a) {
    if (veriVar()) return vayra.veri.guncelle(kol, id, a);
    var r = (yerelAl()[kol] || []).find(function (x) { return x.id === id; });
    if (r) { Object.assign(r, kopya(a), { guncelleme: Date.now() }); yerelYaz(); }
    return Promise.resolve(r ? kopya(r) : null);
  },
  sil: function (kol, id) {
    if (veriVar()) return vayra.veri.sil(kol, id);
    var l = yerelAl()[kol], i = l.findIndex(function (x) { return x.id === id; });
    if (i >= 0) { l.splice(i, 1); yerelYaz(); }
    return Promise.resolve(true);
  }
};
function yerelAyarYaz(a) { if (!veriVar()) { var l = yerelAl().ayarlar; if (l[0]) Object.assign(l[0], a); else l.push(Object.assign({ id: "ayarlar" }, a)); yerelYaz(); } }

/* ── Yardımcılar ── */
function personel(id) { return S.personel.find(function (p) { return p.id === id; }) || null; }
function hizmet(id) { return S.hizmetler.find(function (h) { return h.id === id; }) || null; }
function sirali() { return S.personel.slice().sort(function (a, b) { return (a.sira || 0) - (b.sira || 0) || a.ad.localeCompare(b.ad, "tr"); }); }
function renkOf(r) { var h = hizmet(r.hizmetId); return (h && h.renk) || "gri"; }
function gunun(t) { return S.randevular.filter(function (r) { return r.tarih === t && r.durum !== "İptal"; }); }
function acilis() { return dk(S.ayar.acilis || "09:00"); }
function kapanis() { return Math.max(acilis() + 60, dk(S.ayar.kapanis || "20:00")); }
function mobil() { return window.matchMedia("(max-width: 760px)").matches; }
function durumHTML(d) { return '<span class="durum" data-d="' + kacir(d) + '">' + kacir(d) + "</span>"; }
function avatar(p, sinif) { return p && p.avatar ? '<img class="' + (sinif || "") + '" src="' + kacir(p.avatar) + '" alt="" loading="lazy" />' : ""; }
/** Çakışma: aynı personel ve gün, iptal olmayan, aralığı kesişen başka randevu. Ya da personelin çalışma saati dışı. */
function cakisma(r, haric) {
  var p = personel(r.personelId), s = dk(r.baslangic), e = s + Number(r.sure || 0);
  if (!p) return "Personel bulunamadı.";
  if (s < dk(p.baslangic) || e > dk(p.bitis)) return p.ad + " bu saatte çalışmıyor (" + saatYaz(dk(p.baslangic)) + " ile " + saatYaz(dk(p.bitis)) + " arası).";
  var c = S.randevular.find(function (x) { return x.id !== haric && x.durum !== "İptal" && x.personelId === r.personelId && x.tarih === r.tarih && dk(x.baslangic) < e && dk(x.baslangic) + Number(x.sure || 0) > s; });
  return c ? p.ad + " o saatte dolu: " + saatYaz(dk(c.baslangic)) + " " + c.musteri + "." : "";
}
function uygunSaatler(personelId, tarih, sure, haric) {
  var p = personel(personelId); if (!p) return [];
  var l = [], bas = dk(p.baslangic), son = dk(p.bitis), simdi = tarih === bugun() ? simdiDk() : -1;
  for (var t = bas; t + sure <= son && l.length < 40; t += 15) {
    if (t <= simdi) continue;
    if (!cakisma({ personelId: personelId, tarih: tarih, baslangic: saat(t), sure: sure }, haric)) l.push(t);
  }
  return l;
}

/* ── Yükleme ── */
function yukle() {
  Promise.all([Depo.liste("personel"), Depo.liste("hizmetler"), Depo.liste("randevular"), Depo.liste("ayarlar").catch(function () { return []; }), pbYukle()]).then(function (r) {
    S.personel = r[0] || []; S.hizmetler = r[1] || []; S.randevular = r[2] || [];
    var a = (r[3] || []).find(function (x) { return x.id === "ayarlar"; }) || (r[3] || [])[0];
    if (a) S.ayar = { id: a.id, acilis: a.acilis || "09:00", kapanis: a.kapanis || "20:00" };
    if (!S.mobilPersonel && S.personel.length) S.mobilPersonel = sirali()[0].id;
    S.yuklendi = true; S.kilit = ""; ciz();
  }).catch(function (e) { S.kilit = (e && e.message) || "Veriler okunamadı."; ciz(); });
}

/* ── Çizim ── */
function ciz() {
  $$("[data-git]").forEach(function (b) { if (b.dataset.git === S.gorunum) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  $("#yeniYuzen").hidden = S.gorunum === "ayarlar";
  if (S.kilit) { $("#icerik").innerHTML = '<div class="bos"><b>Veriler yüklenemedi</b>' + kacir(S.kilit) + "</div>"; return; }
  if (!S.yuklendi) { $("#icerik").innerHTML = '<div class="yukleniyor">Takvim yükleniyor</div>'; return; }
  if (S.gorunum === "liste") return cizListe();
  if (S.gorunum === "ayarlar") return cizAyarlar();
  cizTakvim();
}

function cizTakvim() {
  var t = S.tarih, hb = haftaBasi(t), b = bugun(), ac = acilis(), kp = kapanis(), yuk = (kp - ac) / 15 * SATIR;
  var hafta = "";
  for (var i = 0; i < 7; i++) {
    var g = gunEkle(hb, i), n = gunun(g).length;
    hafta += '<button type="button" data-tarih="' + g + '" aria-pressed="' + (g === t) + '" class="' + (g === b ? "bugun" : "") + '" aria-label="' + kacir(tarihYaz(g, { weekday: "long" })) + ", " + n + ' randevu"><small>' + kacir(gunAdi(g)) + "</small><b>" + Number(g.slice(8)) + "</b><em>" + (n ? n + " randevu" : "Boş") + "</em></button>";
  }
  var kisiler = sirali(), gorunen = mobil() ? kisiler.filter(function (p) { return p.id === S.mobilPersonel; }) : kisiler;
  if (!gorunen.length && kisiler.length) { S.mobilPersonel = kisiler[0].id; gorunen = [kisiler[0]]; }
  var ust = '<div class="kose"></div>' + gorunen.map(function (p) {
    var l = gunun(t).filter(function (r) { return r.personelId === p.id; }), dolu = l.reduce(function (s, r) { return s + Number(r.sure || 0); }, 0), kap = dk(p.bitis) - dk(p.baslangic);
    return '<div class="kisi">' + avatar(p) + "<div><b>" + kacir(p.ad) + "</b><small>" + l.length + " randevu, doluluk yüzde " + (kap > 0 ? Math.round(dolu / kap * 100) : 0) + "</small></div></div>";
  }).join("");
  var saatler = "";
  for (var s = ac; s <= kp; s += 60) saatler += '<span style="top:' + ((s - ac) / 15 * SATIR) + 'px">' + saat(s) + "</span>";
  var sutunlar = gorunen.map(function (p) {
    var pb = dk(p.baslangic), pe = dk(p.bitis), k = "";
    if (pb > ac) k += '<div class="kapali" style="top:0;height:' + ((Math.min(pb, kp) - ac) / 15 * SATIR) + 'px"></div>';
    if (pe < kp) k += '<div class="kapali" style="top:' + ((Math.max(pe, ac) - ac) / 15 * SATIR) + 'px;bottom:0"></div>';
    var r = gunun(t).filter(function (x) { return x.personelId === p.id; }).map(rdvHTML).join("");
    return '<div class="sutun" data-personel="' + kacir(p.id) + '" style="height:' + yuk + 'px" aria-label="' + kacir(p.ad) + ' takvimi">' + k + r + "</div>";
  }).join("");
  var simdi = t === b && simdiDk() >= ac && simdiDk() <= kp ? '<div class="simdi" style="top:' + ((simdiDk() - ac) / 15 * SATIR) + 'px" aria-hidden="true"></div>' : "";
  var cipler = '<div class="personel-cipler" role="group" aria-label="Personel">' + kisiler.map(function (p) { return '<button type="button" data-mobil-personel="' + kacir(p.id) + '" aria-pressed="' + (p.id === S.mobilPersonel) + '">' + avatar(p) + kacir(p.ad.split(" ")[0]) + "</button>"; }).join("") + "</div>";
  var baslik = (t === b ? "Bugün" : t === gunEkle(b, 1) ? "Yarın" : t === gunEkle(b, -1) ? "Dün" : gunAdi(t, true));
  $("#icerik").innerHTML =
    '<div class="takvim-bas"><div class="gun-nav"><button type="button" class="dugme ikon" data-gun="-1" aria-label="Önceki gün">' + IK.sol + '</button><button type="button" class="dugme ikon" data-gun="1" aria-label="Sonraki gün">' + IK.sag + '</button><button type="button" class="dugme kucuk gizle-mobil" data-gun="0">Bugün</button>' +
      "<h1>" + kacir(baslik) + "<small>" + kacir(tarihYaz(t, { weekday: t === b || Math.abs(gunFarki(b, t)) === 1 ? "long" : undefined, year: "numeric" })) + "</small></h1>" +
      '<label class="dugme ikon tarih-sec" aria-label="Tarih seç" title="Tarih seç">' + IK.takvimKucuk + '<input type="date" id="tarihSec" value="' + t + '" /></label></div>' +
      '<div class="hafta" role="group" aria-label="Hafta">' + hafta + "</div></div>" +
    '<div class="takvim-govde"><div><div class="izgara-kap">' + cipler.replace('class="personel-cipler"', 'class="personel-cipler" style="padding-top:12px;margin:0 0 10px"') + '<div class="izgara-kaydir"><div class="izgara" style="--sutun:' + Math.max(1, gorunen.length) + '">' +
      '<div class="izgara-ust">' + ust + '</div><div class="izgara-ic" id="izgaraIc"><div class="saatler" style="height:' + yuk + 'px">' + saatler + "</div>" + sutunlar + simdi + "</div></div></div></div></div>" +
      ozetHTML(t) + "</div>";
  var sm = $("#izgaraIc .simdi"), kap = $(".izgara-kaydir");
  if (t === b && sm && !cizTakvim.kaydirildi) { cizTakvim.kaydirildi = true; var y = sm.getBoundingClientRect().top + scrollY - 260; if (y > 0) window.scrollTo(0, y); }
}
function gunFarki(a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5); }
function rdvHTML(r) {
  var s = dk(r.baslangic), sure = Number(r.sure || 15), kisa = sure <= 30, ac = acilis();
  return '<button type="button" class="rdv' + (kisa ? " kisa" : "") + '" data-rdv="' + kacir(r.id) + '" data-renk="' + renkOf(r) + '" data-durum="' + kacir(r.durum) + '" style="top:' + ((s - ac) / 15 * SATIR + 1) + "px;height:" + (sure / 15 * SATIR - 2) + 'px" aria-label="' + kacir(saatYaz(s) + ", " + r.musteri + ", " + (r.hizmetAd || "") + ", " + r.durum) + '"><b>' + kacir(r.musteri) + "</b><span>" + kacir(saatYaz(s) + (kisa ? "" : " · " + (r.hizmetAd || ""))) + "</span></button>";
}
function ozetHTML(t) {
  var l = gunun(t), kap = S.personel.reduce(function (s, p) { return s + Math.max(0, dk(p.bitis) - dk(p.baslangic)); }, 0);
  var dolu = l.reduce(function (s, r) { return s + Number(r.sure || 0); }, 0), dol = kap ? Math.round(dolu / kap * 100) : 0;
  var ciro = l.filter(function (r) { return r.durum !== "Gelmedi"; }).reduce(function (s, r) { return s + Number(r.fiyat || 0); }, 0);
  var gelmedi = l.filter(function (r) { return r.durum === "Gelmedi"; }).length, geldi = l.filter(function (r) { return r.durum === "Geldi"; }).length;
  var sira = l.slice().sort(function (a, b) { return dk(a.baslangic) - dk(b.baslangic); });
  if (t === bugun()) sira = sira.filter(function (r) { return dk(r.baslangic) + Number(r.sure || 0) > simdiDk() && r.durum === "Onaylı"; });
  var sirali5 = sira.slice(0, 5).map(function (r) { var p = personel(r.personelId); return '<button type="button" data-rdv="' + kacir(r.id) + '" data-renk="' + renkOf(r) + '"><span class="saat">' + saatYaz(dk(r.baslangic)) + '</span><i class="nokta"></i><span class="metin"><b>' + kacir(r.musteri) + "</b><small>" + kacir((r.hizmetAd || "") + (p ? ", " + p.ad.split(" ")[0] : "")) + "</small></span></button>"; }).join("");
  return '<aside class="ozet">' +
    '<section class="blok"><h2>Günün özeti</h2><div class="rakamlar">' +
      '<div class="rakam"><small>Randevu</small><b>' + l.length + "</b></div>" +
      '<div class="rakam"><small>Doluluk</small><b>yüzde ' + dol + '</b><div class="doluluk"><i style="width:' + Math.min(100, dol) + '%"></i></div></div>' +
      '<div class="rakam"><small>Beklenen ciro</small><b>' + kacir(tl(ciro)) + "</b></div>" +
      '<div class="rakam"><small>Geldi, gelmedi</small><b>' + geldi + ", " + gelmedi + "</b></div></div></section>" +
    '<section class="blok"><h2>' + (t === bugun() ? "Sıradaki" : "Günün randevuları") + '<span class="ek">' + sira.length + "</span></h2>" + (sirali5 ? '<div class="sirali">' + sirali5 + "</div>" : '<p class="bos-yazi">' + (t === bugun() ? "Bugün için bekleyen randevu kalmadı." : "Bu gün için randevu yok.") + "</p>") + "</section>" +
    '<section class="blok"><h2>Hizmetler</h2><div class="lejant">' + S.hizmetler.map(function (h) { return '<span data-renk="' + kacir(h.renk || "gri") + '">' + kacir(h.ad) + "</span>"; }).join("") + "</div></section>" +
  "</aside>";
}

function cizListe() {
  var b = bugun(), a = S.ara.trim().toLocaleLowerCase("tr");
  var l = S.randevular.filter(function (r) {
    if (S.liste === "yaklasan" && (r.tarih < b || r.durum === "İptal")) return false;
    if (S.liste === "gecmis" && (r.tarih >= b || r.durum === "İptal")) return false;
    if (S.liste === "iptal" && r.durum !== "İptal") return false;
    if (!a) return true;
    var p = personel(r.personelId);
    return (r.musteri + " " + (r.telefon || "") + " " + (r.hizmetAd || "") + " " + (p ? p.ad : "")).toLocaleLowerCase("tr").indexOf(a) >= 0;
  }).sort(function (x, y) { var k = x.tarih === y.tarih ? dk(x.baslangic) - dk(y.baslangic) : (x.tarih < y.tarih ? -1 : 1); return S.liste === "gecmis" ? -k : k; });
  var gruplar = {}, sira = [];
  l.forEach(function (r) { if (!gruplar[r.tarih]) { gruplar[r.tarih] = []; sira.push(r.tarih); } gruplar[r.tarih].push(r); });
  var cipler = [["yaklasan", "Yaklaşan"], ["gecmis", "Geçmiş"], ["iptal", "İptal edilen"]].map(function (c) { return '<button type="button" class="cip" data-liste="' + c[0] + '" aria-pressed="' + (S.liste === c[0]) + '">' + c[1] + "</button>"; }).join("");
  var govde = sira.length ? sira.slice(0, 30).map(function (t) {
    var g = gruplar[t], top = g.filter(function (r) { return r.durum !== "İptal" && r.durum !== "Gelmedi"; }).reduce(function (s, r) { return s + Number(r.fiyat || 0); }, 0);
    return '<section class="gun-grup"><h2>' + kacir(t === b ? "Bugün" : t === gunEkle(b, 1) ? "Yarın" : gunAdi(t, true)) + " <small>" + kacir(tarihYaz(t)) + ", " + g.length + " randevu, " + kacir(tl(top)) + '</small></h2><div class="liste">' + g.map(function (r) {
      var p = personel(r.personelId);
      return '<button type="button" class="satir" data-rdv="' + kacir(r.id) + '" data-renk="' + renkOf(r) + '"><span class="saat">' + saatYaz(dk(r.baslangic)) + "<small>" + r.sure + ' dk</small></span><span class="musteri-h"><b>' + kacir(r.musteri) + "</b><small>" + kacir(r.telefon || "") + '</small></span><span class="hiz"><i></i><span>' + kacir(r.hizmetAd || "") + '</span></span><span class="kim">' + avatar(p) + "<span>" + kacir(p ? p.ad : "") + '</span></span><span class="ucret">' + kacir(tl(r.fiyat)) + '</span><span class="durum-h">' + durumHTML(r.durum) + "</span></button>";
    }).join("") + "</div></section>";
  }).join("") : '<div class="bos"><b>Randevu bulunamadı</b>Aramayı ya da süzgeci değiştir.</div>';
  $("#icerik").innerHTML = '<div class="sayfa-bas"><div><h1>Randevular</h1><p>' + l.length + " randevu" + (sira.length > 30 ? ", ilk 30 gün gösteriliyor" : "") + "</p></div></div>" +
    '<div class="suzgec"><div class="cipler" role="group" aria-label="Süzgeç">' + cipler + '</div><label class="ara">' + IK.ara + '<input id="ara" type="search" placeholder="Müşteri, telefon ya da hizmet ara" aria-label="Randevu ara" value="' + kacir(S.ara) + '" /></label></div>' + govde;
}

function cizAyarlar() {
  var saatSec = function (ad, deger) { var o = ""; for (var s = 5 * 60; s <= 23 * 60; s += 60) o += '<option value="' + saat(s) + '"' + (dk(deger) === s ? " selected" : "") + ">" + saat(s) + "</option>"; return '<select id="' + ad + '">' + o + "</select>"; };
  $("#icerik").innerHTML = '<div class="sayfa-bas"><div><h1>Ayarlar</h1><p>Hizmetler, çalışma saatleri ve para birimi</p></div></div>' +
    '<div class="ayar-izgara"><div class="ayar-sutun">' +
      '<section class="blok"><h2>Hizmetler<span class="ek">' + S.hizmetler.length + "</span></h2>" + S.hizmetler.map(function (h) {
        return '<div class="hizmet-satir" data-renk="' + kacir(h.renk || "gri") + '"><i></i><div class="metin"><b>' + kacir(h.ad) + "</b><small>" + h.sure + ' dakika</small></div><span class="ucret">' + kacir(tl(h.fiyat)) + '</span><button type="button" class="dugme kucuk ikon" data-hizmet-duzenle="' + kacir(h.id) + '" aria-label="' + kacir(h.ad) + ' düzenle">' + IK.duzenle + "</button></div>";
      }).join("") + '<div style="margin-top:12px"><button type="button" class="dugme" data-hizmet-yeni>' + IK.arti + "Hizmet ekle</button></div></section>" +
    "</div><div class=\"ayar-sutun\">" +
      '<section class="blok"><h2>İşletme</h2><div class="alanlar"><label class="alan"><span>Takvim açılışı</span>' + saatSec("acilisSec", S.ayar.acilis) + '</label><label class="alan"><span>Takvim kapanışı</span>' + saatSec("kapanisSec", S.ayar.kapanis) + '</label><label class="alan tam"><span>Para birimi</span><select id="pbSec">' + pbSecenekleri() + '</select></label></div><p class="ipucu">Fiyatlar seçilen para biriminde gösterilir; kur çevrimi yapılmaz.</p></section>' +
      '<section class="blok"><h2>Personel ve çalışma saatleri</h2>' + sirali().map(function (p) {
        return '<div class="personel-satir">' + avatar(p) + "<div><b>" + kacir(p.ad) + "</b><small>" + kacir(p.unvan || "") + '</small></div><input type="time" step="900" value="' + kacir(p.baslangic) + '" data-personel-saat="' + kacir(p.id) + '" data-alan="baslangic" aria-label="' + kacir(p.ad) + ' başlangıç" /><input type="time" step="900" value="' + kacir(p.bitis) + '" data-personel-saat="' + kacir(p.id) + '" data-alan="bitis" aria-label="' + kacir(p.ad) + ' bitiş" /></div>';
      }).join("") + '<p class="ipucu">Çalışma saati dışında randevu verilmez; takvimde bu saatler taralı görünür.</p></section>' +
    "</div></div>";
}

/* ── Pencere ── */
function pencereAc(html, kur) {
  var kap = $("#pencere"), p = kap.querySelector(".pencere"), onceki = document.activeElement;
  p.innerHTML = html; kap.hidden = false;
  function kapat() { kap.hidden = true; p.innerHTML = ""; document.removeEventListener("keydown", tus); if (onceki && onceki.focus) onceki.focus(); }
  function tus(e) { if (e.key === "Escape") kapat(); }
  document.addEventListener("keydown", tus);
  kap.onclick = function (e) { if (e.target === kap || e.target.closest("[data-kapat]")) kapat(); };
  if (kur) kur(p, kapat);
  var ilk = p.querySelector("input, select, textarea"); if (ilk && !mobil()) setTimeout(function () { ilk.focus(); }, 60);
  return kapat;
}

function randevuFormu(r) {
  var yeni = !r.id, h0 = hizmet(r.hizmetId) || S.hizmetler[0];
  var musteriler = {}; S.randevular.forEach(function (x) { if (x.musteri) musteriler[x.musteri] = x.telefon || ""; });
  pencereAc("<h2>" + (yeni ? "Yeni randevu" : "Randevuyu düzenle") + '</h2><p>' + (yeni ? "Saat seç ya da önerilen boş saatlerden birine dokun." : kacir(r.musteri)) + "</p>" +
    '<form id="rForm" class="alanlar" novalidate>' +
      '<label class="alan"><span>Müşteri adı</span><input name="musteri" list="musteriListe" value="' + kacir(r.musteri || "") + '" autocomplete="off" required /></label>' +
      '<label class="alan"><span>Telefon</span><input name="telefon" type="tel" value="' + kacir(r.telefon || "") + '" autocomplete="off" /></label>' +
      '<label class="alan tam"><span>Hizmet</span><select name="hizmetId">' + S.hizmetler.map(function (h) { return '<option value="' + kacir(h.id) + '"' + (h0 && h.id === h0.id ? " selected" : "") + ">" + kacir(h.ad + ", " + h.sure + " dk, " + tl(h.fiyat)) + "</option>"; }).join("") + "</select></label>" +
      '<label class="alan"><span>Personel</span><select name="personelId">' + sirali().map(function (p) { return '<option value="' + kacir(p.id) + '"' + (p.id === r.personelId ? " selected" : "") + ">" + kacir(p.ad) + "</option>"; }).join("") + "</select></label>" +
      '<label class="alan"><span>Tarih</span><input name="tarih" type="date" value="' + kacir(r.tarih) + '" /></label>' +
      '<label class="alan"><span>Saat</span><input name="baslangic" type="time" step="900" value="' + kacir(r.baslangic || "") + '" /></label>' +
      '<label class="alan"><span>Ücret, ' + kacir(PB.kod) + '</span><input name="fiyat" type="number" min="0" step="any" inputmode="decimal" value="' + kacir(r.fiyat != null ? r.fiyat : h0 ? h0.fiyat : "") + '" /></label>' +
      '<div class="alan tam"><span>Boş saatler</span><div class="uygun" id="uygun"></div></div>' +
      '<label class="alan tam"><span>Not</span><textarea name="not" rows="2" placeholder="İsteğe bağlı">' + kacir(r.not || "") + "</textarea></label>" +
      '<p class="hata-yazi alan tam" id="rHata" hidden></p>' +
      '<datalist id="musteriListe">' + Object.keys(musteriler).sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (m) { return '<option value="' + kacir(m) + '"></option>'; }).join("") + "</datalist>" +
    "</form>" +
    '<div class="alt-dugmeler"><button type="button" class="dugme" data-kapat>Vazgeç</button><button type="submit" form="rForm" class="dugme ana">' + (yeni ? "Randevuyu kaydet" : "Değişiklikleri kaydet") + "</button></div>",
  function (p, kapat) {
    var f = $("#rForm", p), al = function (n) { return f.elements[n]; };
    function deger() { var h = hizmet(al("hizmetId").value); return { musteri: al("musteri").value.trim(), telefon: al("telefon").value.trim(), hizmetId: al("hizmetId").value, hizmetAd: h ? h.ad : "", personelId: al("personelId").value, tarih: al("tarih").value, baslangic: al("baslangic").value, sure: h ? Number(h.sure) : 30, fiyat: Math.max(0, Number(al("fiyat").value) || 0), not: al("not").value.trim() }; }
    function oneri() {
      var v = deger(), l = v.tarih ? uygunSaatler(v.personelId, v.tarih, v.sure, r.id) : [];
      $("#uygun", p).innerHTML = l.length ? l.slice(0, 12).map(function (t) { return '<button type="button" data-uygun="' + saat(t) + '" aria-pressed="' + (saat(t) === v.baslangic) + '">' + saatYaz(t) + "</button>"; }).join("") : '<span class="ipucu" style="margin:0">Bu gün için boş saat yok.</span>';
      var c = v.baslangic && v.tarih ? cakisma(v, r.id) : "", e = $("#rHata", p); e.textContent = c; e.hidden = !c;
    }
    oneri();
    f.addEventListener("change", function (e) {
      if (e.target.name === "hizmetId") { var h = hizmet(e.target.value); if (h) al("fiyat").value = h.fiyat; }
      if (e.target.name === "musteri" && musteriler[e.target.value] && !al("telefon").value) al("telefon").value = musteriler[e.target.value];
      oneri();
    });
    f.addEventListener("input", function (e) { if (e.target.name === "baslangic") oneri(); });
    $("#uygun", p).addEventListener("click", function (e) { var b = e.target.closest("[data-uygun]"); if (b) { al("baslangic").value = b.dataset.uygun; oneri(); } });
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = deger(), h = !v.musteri ? "Müşteri adını yaz." : !v.tarih ? "Tarih seç." : !/^\d{2}:\d{2}$/.test(v.baslangic) ? "Saat seç." : dk(v.baslangic) % 15 ? "Saat 15 dakikanın katı olmalı." : cakisma(v, r.id);
      var hata = $("#rHata", p); hata.textContent = h; hata.hidden = !h;
      if (h) return;
      var gonder = p.querySelector('[form="rForm"]'); gonder.disabled = true;
      var is = yeni ? Depo.ekle("randevular", Object.assign({ durum: "Onaylı" }, v)) : Depo.guncelle("randevular", r.id, v);
      is.then(function (x) {
        x = x || Object.assign({}, r, v);
        var i = S.randevular.findIndex(function (y) { return y.id === x.id; });
        if (i >= 0) S.randevular[i] = x; else S.randevular.push(x);
        kapat(); S.tarih = x.tarih; if (mobil()) S.mobilPersonel = x.personelId; ciz();
        bildir((yeni ? "Randevu kaydedildi: " : "Randevu güncellendi: ") + tarihYaz(x.tarih) + " " + saatYaz(dk(x.baslangic)) + ".");
        olay(yeni ? "randevu_eklendi" : "randevu_guncellendi", {});
      }).catch(function (x) { gonder.disabled = false; bildir(x.message || "Kaydedilemedi.", "hata"); });
    });
  });
}

function detayAc(id) {
  var r = S.randevular.find(function (x) { return x.id === id; }); if (!r) return;
  var p = personel(r.personelId), s = dk(r.baslangic);
  pencereAc('<div class="detay-bant" data-renk="' + renkOf(r) + '"><small>' + kacir(r.hizmetAd || "Hizmet") + ", " + r.sure + " dk</small><h2>" + kacir(r.musteri) + "</h2></div>" +
    '<div class="bilgi"><div><small>Tarih</small><b>' + kacir(gunAdi(r.tarih, true) + ", " + tarihYaz(r.tarih)) + "</b></div><div><small>Saat</small><b>" + saatYaz(s) + " ile " + saatYaz(s + Number(r.sure || 0)) + "</b></div><div><small>Personel</small><b>" + kacir(p ? p.ad : "") + "</b></div><div><small>Ücret</small><b>" + kacir(tl(r.fiyat)) + "</b></div><div><small>Telefon</small><b>" + kacir(r.telefon || "Yok") + "</b></div><div><small>Durum</small><b>" + kacir(r.durum) + "</b></div></div>" +
    '<div class="durum-sec" role="group" aria-label="Durum">' + DURUMLAR.map(function (d) { return '<button type="button" data-durum-sec="' + kacir(d) + '" aria-pressed="' + (r.durum === d) + '">' + kacir(d) + "</button>"; }).join("") + "</div>" +
    (r.not ? '<div class="not-kutu">' + kacir(r.not) + "</div>" : "") +
    '<div class="alt-dugmeler">' + (r.telefon ? '<a class="dugme ikon" href="tel:' + kacir(String(r.telefon).replace(/[^\d+]/g, "")) + '" aria-label="Ara" title="Ara">' + IK.tel + "</a>" : "") +
      '<button type="button" class="dugme ikon" data-hatirlat aria-label="Hatırlatma metnini kopyala" title="Hatırlatma metnini kopyala">' + IK.kopya + '</button><button type="button" class="dugme ikon tehlike" data-sil aria-label="Randevuyu sil" title="Randevuyu sil">' + IK.cop + '</button><span class="bosluk"></span><button type="button" class="dugme" data-duzenle>' + IK.duzenle + 'Düzenle</button><button type="button" class="dugme koyu" data-kapat>Kapat</button></div>',
  function (pn, kapat) {
    pn.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.durumSec) {
        var d = b.dataset.durumSec;
        if (d !== "İptal" && r.durum === "İptal") { var c = cakisma(r, r.id); if (c) { bildir(c, "hata"); return; } }
        Depo.guncelle("randevular", r.id, { durum: d }).then(function (x) { Object.assign(r, x || { durum: d }); kapat(); ciz(); bildir(r.musteri + ": " + d + "."); }).catch(function (x) { bildir(x.message, "hata"); });
      }
      if (b.hasAttribute("data-duzenle")) { kapat(); randevuFormu(r); }
      if (b.hasAttribute("data-sil")) {
        if (b.dataset.onay !== "1") { b.dataset.onay = "1"; b.innerHTML = "Silinsin mi?"; b.classList.remove("ikon"); return; }
        Depo.sil("randevular", r.id).then(function () { S.randevular = S.randevular.filter(function (x) { return x.id !== r.id; }); kapat(); ciz(); bildir("Randevu silindi."); }).catch(function (x) { bildir(x.message, "hata"); });
      }
      if (b.hasAttribute("data-hatirlat")) {
        var m = "Merhaba " + r.musteri.split(" ")[0] + ", " + tarihYaz(r.tarih) + " " + gunAdi(r.tarih, true) + " saat " + saatYaz(s) + " için " + (r.hizmetAd || "randevunuz") + " randevunuzu hatırlatırız. " + (p ? p.ad + " sizi bekliyor." : "");
        var yaz = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(m) : Promise.reject();
        yaz.then(function () { bildir("Hatırlatma metni kopyalandı."); }).catch(function () { window.prompt("Hatırlatma metni", m); });
      }
    });
  });
}

function hizmetFormu(h) {
  var x = h || { ad: "", sure: 30, fiyat: 0, renk: "mercan" };
  pencereAc("<h2>" + (h ? "Hizmeti düzenle" : "Yeni hizmet") + "</h2><p>Süre takvimdeki blok boyunu, fiyat beklenen ciroyu belirler.</p>" +
    '<form id="hForm" class="alanlar" novalidate><label class="alan tam"><span>Hizmet adı</span><input name="ad" value="' + kacir(x.ad) + '" required /></label>' +
    '<label class="alan"><span>Süre</span><select name="sure">' + [15, 30, 45, 60, 75, 90, 120, 150, 180].map(function (d) { return '<option value="' + d + '"' + (Number(x.sure) === d ? " selected" : "") + ">" + d + " dakika</option>"; }).join("") + "</select></label>" +
    '<label class="alan"><span>Fiyat, ' + kacir(PB.kod) + '</span><input name="fiyat" type="number" min="0" step="any" inputmode="decimal" value="' + kacir(x.fiyat) + '" /></label>' +
    '<div class="alan tam"><span>Takvim rengi</span><div class="renk-sec">' + RENKLER.map(function (r) { return '<label data-renk="' + r + '"><input type="radio" name="renk" value="' + r + '"' + (x.renk === r ? " checked" : "") + ' aria-label="' + r + '" /><span></span></label>'; }).join("") + "</div></div>" +
    '<p class="hata-yazi alan tam" id="hHata" hidden></p></form>' +
    '<div class="alt-dugmeler">' + (h ? '<button type="button" class="dugme tehlike" data-hizmet-sil style="margin-right:auto">' + IK.cop + "Sil</button>" : "") + '<button type="button" class="dugme" data-kapat>Vazgeç</button><button type="submit" form="hForm" class="dugme ana">Kaydet</button></div>',
  function (p, kapat) {
    var f = $("#hForm", p);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = { ad: f.elements.ad.value.trim(), sure: Number(f.elements.sure.value), fiyat: Math.max(0, Number(f.elements.fiyat.value) || 0), renk: (f.querySelector("[name=renk]:checked") || {}).value || "gri" };
      if (!v.ad) { var er = $("#hHata", p); er.textContent = "Hizmet adını yaz."; er.hidden = false; return; }
      (h ? Depo.guncelle("hizmetler", h.id, v) : Depo.ekle("hizmetler", v)).then(function (r) {
        r = r || Object.assign({}, h, v);
        var i = S.hizmetler.findIndex(function (y) { return y.id === r.id; }); if (i >= 0) S.hizmetler[i] = r; else S.hizmetler.push(r);
        kapat(); ciz(); bildir(h ? "Hizmet güncellendi." : "Hizmet eklendi.");
      }).catch(function (x) { bildir(x.message, "hata"); });
    });
    var sil = $("[data-hizmet-sil]", p);
    if (sil) sil.addEventListener("click", function () {
      if (sil.dataset.onay !== "1") { sil.dataset.onay = "1"; sil.textContent = "Silinsin mi? Eski randevular kalır"; return; }
      Depo.sil("hizmetler", h.id).then(function () { S.hizmetler = S.hizmetler.filter(function (y) { return y.id !== h.id; }); kapat(); ciz(); bildir("Hizmet silindi."); }).catch(function (x) { bildir(x.message, "hata"); });
    });
  });
}

/* ── Olaylar ── */
document.addEventListener("click", function (e) {
  if (suruklemeBitti) { suruklemeBitti = false; return; }
  var b = e.target.closest("button, .sutun");
  if (!b || b.closest("#pencere")) return;
  var d = b.dataset;
  if (d.git) { S.gorunum = d.git; ciz(); window.scrollTo(0, 0); return; }
  if (d.gun != null) { S.tarih = d.gun === "0" ? bugun() : gunEkle(S.tarih, Number(d.gun)); ciz(); return; }
  if (d.tarih) { S.tarih = d.tarih; ciz(); return; }
  if (d.mobilPersonel) { S.mobilPersonel = d.mobilPersonel; ciz(); return; }
  if (d.rdv) { detayAc(d.rdv); return; }
  if (d.liste) { S.liste = d.liste; cizListe(); return; }
  if (b.id === "yeniYuzen" || d.yeni != null) { yeniRandevu(); return; }
  if (d.hizmetYeni != null) { hizmetFormu(null); return; }
  if (d.hizmetDuzenle) { hizmetFormu(hizmet(d.hizmetDuzenle)); return; }
  if (b.classList.contains("sutun")) {
    var y = e.clientY - b.getBoundingClientRect().top, t = acilis() + Math.floor(y / SATIR) * 15;
    yeniRandevu(b.dataset.personel, saat(t));
  }
});
function yeniRandevu(personelId, baslangic) {
  var p = personelId || (mobil() ? S.mobilPersonel : sirali()[0] && sirali()[0].id), h = S.hizmetler[0];
  if (!baslangic && p && h) { var u = uygunSaatler(p, S.tarih, h.sure); baslangic = u.length ? saat(u[0]) : ""; }
  randevuFormu({ personelId: p, tarih: S.tarih, baslangic: baslangic || "", hizmetId: h ? h.id : "", fiyat: h ? h.fiyat : 0 });
}
document.addEventListener("input", function (e) { if (e.target.id === "ara") { S.ara = e.target.value; var k = e.target.selectionStart; cizListe(); var a = $("#ara"); a.focus(); try { a.setSelectionRange(k, k); } catch (x) { /* yok say */ } } });
document.addEventListener("change", function (e) {
  var el = e.target;
  if (el.id === "tarihSec" && el.value) { S.tarih = el.value; ciz(); }
  if (el.id === "pbSec") { pbKaydet(el.value).then(function () { bildir("Fiyatlar artık " + PB.kod + " ile gösteriliyor."); }).catch(function (x) { bildir(x.message, "hata"); }); ciz(); }
  if (el.id === "acilisSec" || el.id === "kapanisSec") {
    var a = { acilis: $("#acilisSec").value, kapanis: $("#kapanisSec").value };
    if (dk(a.kapanis) <= dk(a.acilis)) { bildir("Kapanış açılıştan sonra olmalı.", "hata"); ciz(); return; }
    S.ayar.acilis = a.acilis; S.ayar.kapanis = a.kapanis;
    var is = veriVar() ? (S.ayar.id ? vayra.veri.guncelle("ayarlar", S.ayar.id, a) : vayra.veri.ekle("ayarlar", a).then(function (r) { S.ayar.id = r && r.id; })) : Promise.resolve(yerelAyarYaz(a));
    is.then(function () { bildir("Takvim saatleri kaydedildi."); }).catch(function (x) { bildir(x.message, "hata"); });
  }
  if (el.dataset.personelSaat) {
    var p = personel(el.dataset.personelSaat), alan = el.dataset.alan, v = {}; v[alan] = el.value;
    var yb = alan === "baslangic" ? el.value : p.baslangic, ye = alan === "bitis" ? el.value : p.bitis;
    if (!el.value || dk(ye) <= dk(yb)) { bildir("Bitiş başlangıçtan sonra olmalı.", "hata"); el.value = p[alan]; return; }
    Depo.guncelle("personel", p.id, v).then(function (r) { Object.assign(p, r || v); bildir(p.ad + " için çalışma saati kaydedildi."); }).catch(function (x) { bildir(x.message, "hata"); });
  }
});
document.addEventListener("keydown", function (e) {
  if (S.gorunum !== "takvim" || !$("#pencere").hidden || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === "ArrowLeft") { S.tarih = gunEkle(S.tarih, -1); ciz(); }
  if (e.key === "ArrowRight") { S.tarih = gunEkle(S.tarih, 1); ciz(); }
  if (e.key === "t" || e.key === "T") { S.tarih = bugun(); ciz(); }
});
var sonMobil = mobil();
window.addEventListener("resize", function () { if (mobil() !== sonMobil) { sonMobil = mobil(); if (S.gorunum === "takvim") ciz(); } });
setInterval(function () { if (S.gorunum === "takvim" && S.tarih === bugun() && !sur && $("#pencere").hidden) { var sm = $("#izgaraIc .simdi"); if (sm) sm.style.top = ((simdiDk() - acilis()) / 15 * SATIR) + "px"; } }, 60000);

/* ── Sürükle bırak: fare hemen, dokunmatik basılı tutunca (350 ms) başlar; 15 dakikaya oturur ── */
var aday = null, sur = null, suruklemeBitti = false;
document.addEventListener("touchmove", function (e) { if (sur) e.preventDefault(); }, { passive: false });
document.addEventListener("contextmenu", function (e) { if (sur || (aday && aday.dokunmatik)) e.preventDefault(); });
document.addEventListener("pointerdown", function (e) {
  var el = e.target.closest(".rdv"); if (!el || e.button > 0) return;
  aday = { el: el, id: el.dataset.rdv, x: e.clientX, y: e.clientY, dokunmatik: e.pointerType !== "mouse", zaman: null, pid: e.pointerId };
  if (aday.dokunmatik) aday.zaman = setTimeout(function () { if (aday) basla(aday.x, aday.y); }, 350);
});
document.addEventListener("pointermove", function (e) {
  if (sur) { e.preventDefault(); tasi(e.clientX, e.clientY); return; }
  if (!aday) return;
  var dx = e.clientX - aday.x, dy = e.clientY - aday.y, uzak = Math.abs(dx) + Math.abs(dy);
  if (aday.dokunmatik) { if (uzak > 10) { clearTimeout(aday.zaman); aday = null; } else { aday.x = e.clientX; aday.y = e.clientY; } return; }
  if (uzak > 5) basla(e.clientX, e.clientY);
});
function basla(x, y) {
  var r = S.randevular.find(function (q) { return q.id === aday.id; }); if (!r) { aday = null; return; }
  var el = aday.el, kutu = el.getBoundingClientRect();
  sur = { r: r, el: el, dy: y - kutu.top, personelId: r.personelId, bas: dk(r.baslangic), sutun: el.parentElement };
  el.classList.add("suruklenen");
  if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* yok say */ }
  aday = null; tasi(x, y);
}
function tasi(x, y) {
  var el = sur.el; el.style.pointerEvents = "none";
  var alt = document.elementFromPoint(x, y), sutun = alt && alt.closest(".sutun"); el.style.pointerEvents = "";
  if (!sutun) sutun = sur.sutun;
  if (sutun !== el.parentElement) sutun.appendChild(el);
  $$(".sutun.hedef").forEach(function (s) { if (s !== sutun) s.classList.remove("hedef"); }); sutun.classList.add("hedef");
  var ust = sutun.getBoundingClientRect().top, sure = Number(sur.r.sure || 15);
  var t = acilis() + Math.round((y - sur.dy - ust) / SATIR) * 15;
  t = Math.max(acilis(), Math.min(kapanis() - sure, t));
  sur.personelId = sutun.dataset.personel; sur.bas = t; sur.sutun = sutun;
  el.style.top = ((t - acilis()) / 15 * SATIR + 1) + "px";
  var sp = el.querySelector("span"); if (sp) sp.textContent = saatYaz(t) + " ile " + saatYaz(t + sure);
  /* kenara yaklaşınca sayfayı kaydır */
  if (y > innerHeight - 60) window.scrollBy(0, 12); else if (y < 120) window.scrollBy(0, -12);
}
function bitir() {
  if (aday) { clearTimeout(aday.zaman); aday = null; }
  if (!sur) return;
  var s = sur; sur = null; suruklemeBitti = true; setTimeout(function () { suruklemeBitti = false; }, 60);
  $$(".sutun.hedef").forEach(function (x) { x.classList.remove("hedef"); });
  var r = s.r, yeni = { personelId: s.personelId, baslangic: saat(s.bas) };
  if (yeni.personelId === r.personelId && yeni.baslangic === r.baslangic) { ciz(); return; }
  var c = cakisma(Object.assign({}, r, yeni), r.id);
  if (c) { bildir(c, "hata"); ciz(); return; }
  var eski = { personelId: r.personelId, baslangic: r.baslangic };
  Object.assign(r, yeni); ciz();
  Depo.guncelle("randevular", r.id, yeni).then(function () {
    var p = personel(r.personelId);
    bildir(r.musteri + (eski.personelId !== r.personelId && p ? ", " + p.ad.split(" ")[0] + " ile" : "") + " " + saatEkli(s.bas, "e") + " taşındı.");
  }).catch(function (x) { Object.assign(r, eski); ciz(); bildir(x.message || "Taşınamadı.", "hata"); });
}
document.addEventListener("pointerup", bitir);
document.addEventListener("pointercancel", function () { if (sur) { sur = null; ciz(); } if (aday) { clearTimeout(aday.zaman); aday = null; } });

$("#modYazi").textContent = veriVar() ? "Veritabanına bağlı" : "Bu cihazda saklanıyor";
$("#mod").dataset.bagli = veriVar() ? "1" : "0";
ciz(); yukle();
`;

const NAV = (git: string, ad: string, ikon: string) => `<button type="button" data-git="${git}">${ikon}<span>${ad}</span></button>`;
const I_TAKVIM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const I_LISTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>';
const I_AYAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2.2"/><circle cx="10" cy="17" r="2.2"/></svg>';
const LOGO = '<svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="10" fill="#1f2a44"/><rect x="8" y="9" width="18" height="17" rx="3.5" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M8 14h18" stroke="#fff" stroke-width="2.2"/><circle cx="21.5" cy="20.5" r="3" fill="#e8573a"/></svg>';

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Sıra · Randevu Masası</title>
  <meta name="description" content="Hizmet işletmeleri için randevu takvimi: personel sütunları, sürükleyerek taşıma, çakışma denetimi, boş saat önerileri, durumlar, günün doluluğu ve cirosu." />
  <meta name="theme-color" content="#f5f2ec" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Inter:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <header class="ust">
    <div class="ust-ic">
      <div class="marka">${LOGO}<div><b>Sıra</b><small>Moda Berber ve Bakım</small></div></div>
      <nav class="nav" aria-label="Bölümler">
        ${NAV("takvim", "Takvim", I_TAKVIM)}
        ${NAV("liste", "Randevular", I_LISTE)}
        ${NAV("ayarlar", "Ayarlar", I_AYAR)}
      </nav>
      <span class="bosluk"></span>
      <span class="mod" id="mod"><i></i><span id="modYazi"></span></span>
      <button type="button" class="dugme ana ust-yeni" data-yeni><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Randevu ekle</button>
    </div>
  </header>
  <main id="icerik"></main>
  <button type="button" class="dugme ana yeni-yuzen" id="yeniYuzen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Randevu ekle</button>
  <nav class="alt-nav" aria-label="Bölümler">
    ${NAV("takvim", "Takvim", I_TAKVIM)}
    ${NAV("liste", "Randevular", I_LISTE)}
    ${NAV("ayarlar", "Ayarlar", I_AYAR)}
  </nav>
  <div class="pencere-kap" id="pencere" hidden><div class="pencere" role="dialog" aria-modal="true"></div></div>
  <div id="bildirim" class="bildirim" role="status" aria-live="polite"></div>
  <script src="app.js"></script>
</body>
</html>
`;

export const RANDEVU_MASASI = {
  id: "randevu-masasi",
  ad: "Sıra · Randevu Masası",
  tur: "uygulama" as const,
  aciklama: "Hizmet işletmeleri için randevu takvimi: personel sütunlu gün görünümü, fare ve dokunmatikle sürükleyerek taşıma, çakışma ve çalışma saati denetimi, boş saat önerileri, durumlar, günün doluluğu ve cirosu, liste ve arama, hizmet ve para birimi ayarları",
  kapak: "/gercek/build/sablon/randevu-masasi.webp",
  get tablolar() { return tablolarKur(); },
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Sıra · Randevu Masası", short_name: "Sıra", lang: "tr", start_url: "./index.html", display: "standalone", background_color: "#f5f2ec", theme_color: "#1f2a44", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#1f2a44"/><rect x="120" y="136" width="272" height="256" rx="52" fill="none" stroke="#fff" stroke-width="32"/><path d="M120 212h272" stroke="#fff" stroke-width="32"/><circle cx="324" cy="310" r="44" fill="#e8573a"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
