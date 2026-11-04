import {
  AudioLines, AudioWaveform, Brush, Captions, Columns2, Crop, Eraser, Expand, FastForward, Film, FileVideo, ImageIcon, Languages, LayoutList, ListOrdered, Maximize2, Merge,
  Grid3x3, ListVideo, Box, MonitorUp, Mountain, Baseline, Scissors, Shuffle, Speaker, Music2, Paintbrush, Palette, Repeat, ScanEye, ScanFace, ScanLine, Shirt, Sparkles, StickyNote, Sun, Type, Upload, Volume2, Wand2, WandSparkles, Waves, ZoomIn, Layers, type LucideIcon,
} from "lucide-react";
import { ayarKredi } from "./ayarlar";

/**
 * Canvas düğüm kataloğu: her düğümün girişleri (tipli portlar), çıktısı, varsayılan modeli.
 * Ayarlar ve kredi, modelin gerçek yeteneklerinden lib/tuval/ayarlar.ts'te türetilir.
 */
export type PortTip = "metin" | "gorsel" | "video" | "ses";
/** Port renkleri tema değişkenidir (globals.css .tv-tema); koyu zeminde renk körlüğü denetiminden geçti (kehribar, mavi, pembe, turkuaz). */
export const PORT_RENK: Record<PortTip, string> = { metin: "var(--tv-p-metin)", gorsel: "var(--tv-p-gorsel)", video: "var(--tv-p-video)", ses: "var(--tv-p-ses)" };
export const PORT_AD: Record<PortTip, string> = { metin: "Metin", gorsel: "Görsel", video: "Video", ses: "Ses" };
/** Renge saydamlık (değişkenli renklerde de çalışır). */
export const saydam = (renk: string, yuzde: number) => `color-mix(in srgb, ${renk} ${yuzde}%, transparent)`;

export type DugumTur =
  | "istem" | "liste" | "yukle" | "videoYukle" | "sesYukle"
  | "gorsel" | "duzenle" | "video" | "ses" | "muzik" | "efekt"
  | "sonKare" | "buyut" | "arkaplan" | "asistan" | "karsilastir" | "not"
  | "maske" | "genislet" | "isik" | "zemin" | "yuz" | "giydir" | "eskiz" | "aiBuyut" | "kirp" | "renk"
  | "videoUzat" | "videoBuyut" | "videoKes" | "videoBirlestir" | "sesEkle" | "yazi" | "kolaj" | "sec" | "transkript" | "sesDegistir" | "dublaj" | "sesTemizle"
  | "ucBoyut" | "gelistir" | "tarif" | "sahneler" | "birlestir" | "katman";
export type GirisTanim = { id: string; ad: string; tip: PortTip; coklu?: boolean; zorunlu?: boolean };
export type Kategori = "Girdiler" | "Görsel" | "Video" | "Ses" | "Metin" | "Düzen";

export type DugumTanim = {
  tur: DugumTur; ad: string; alt: string; kategori: Kategori; ikon: LucideIcon;
  cikti?: PortTip; girisler: GirisTanim[];
  /** Kendi istem kutusu var mı (bağlı metin girdisine eklenir). */
  istemli?: boolean;
  /** Varsayılan model (model seçicisi olan düğümlerde). */
  model?: string;
  genislik: number;
  calisir?: boolean;
  anahtar?: string;
};

export const KATALOG: Record<DugumTur, DugumTanim> = {
  istem: { tur: "istem", ad: "İstem", alt: "Metin yaz; birden çok düğüme bağlanır", kategori: "Girdiler", ikon: Type, cikti: "metin", girisler: [], genislik: 280, anahtar: "prompt metin text" },
  liste: { tur: "liste", ad: "Liste", alt: "Her satır bir öğe; sonraki düğüm her biri için çalışır", kategori: "Girdiler", ikon: ListOrdered, cikti: "metin", girisler: [], genislik: 280, anahtar: "batch toplu iterator csv" },
  yukle: { tur: "yukle", ad: "Görsel yükle", alt: "Referans, ürün ya da ilk kare", kategori: "Girdiler", ikon: Upload, cikti: "gorsel", girisler: [], genislik: 260, anahtar: "upload referans dosya resim" },
  videoYukle: { tur: "videoYukle", ad: "Video yükle", alt: "Kaynak video; son karesini alabilirsin", kategori: "Girdiler", ikon: FileVideo, cikti: "video", girisler: [], genislik: 280, anahtar: "upload video klip" },
  sesYukle: { tur: "sesYukle", ad: "Ses yükle", alt: "Müzik ya da kayıt", kategori: "Girdiler", ikon: Volume2, cikti: "ses", girisler: [], genislik: 260, anahtar: "upload ses mp3 wav" },
  gorsel: {
    tur: "gorsel", ad: "Görsel üret", alt: "Ruh 2.0, Nano Banana, GPT Image, Seedream, FLUX…", kategori: "Görsel", ikon: ImageIcon, cikti: "gorsel", istemli: true, calisir: true, genislik: 300, model: "Vayra Ruh 2.0",
    girisler: [{ id: "istem", ad: "İstem", tip: "metin", coklu: true }, { id: "ref", ad: "Referans", tip: "gorsel", coklu: true }], anahtar: "image resim foto",
  },
  duzenle: {
    tur: "duzenle", ad: "Görsel düzenle", alt: "Bir görseli talimatla değiştir", kategori: "Görsel", ikon: Wand2, cikti: "gorsel", istemli: true, calisir: true, genislik: 300, model: "Nano Banana 2.1",
    girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }, { id: "istem", ad: "Talimat", tip: "metin", coklu: true }, { id: "ref", ad: "Ek referans", tip: "gorsel", coklu: true }], anahtar: "edit kontext değiştir",
  },
  buyut: { tur: "buyut", ad: "Büyüt", alt: "Tarayıcıda 2× / 4×, ücretsiz", kategori: "Görsel", ikon: Maximize2, cikti: "gorsel", calisir: true, genislik: 260, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "upscale 4k" },
  arkaplan: { tur: "arkaplan", ad: "Arka planı kaldır", alt: "Şeffaf zemin (PNG)", kategori: "Görsel", ikon: Eraser, cikti: "gorsel", calisir: true, genislik: 260, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "background remove dekupe" },
  video: {
    tur: "video", ad: "Video üret", alt: "Seedance, Kling, Veo, Sora, Wan…", kategori: "Video", ikon: Film, cikti: "video", istemli: true, calisir: true, genislik: 320, model: "Seedance 2.0 Fast",
    girisler: [{ id: "istem", ad: "İstem", tip: "metin", coklu: true }, { id: "kare", ad: "İlk kare", tip: "gorsel" }, { id: "son", ad: "Son kare", tip: "gorsel" }], anahtar: "video film klip",
  },
  sonKare: { tur: "sonKare", ad: "Kare al", alt: "Videonun ilk, orta ya da son karesini görsel yap", kategori: "Video", ikon: ScanLine, cikti: "gorsel", calisir: true, genislik: 260, girisler: [{ id: "video", ad: "Video", tip: "video", zorunlu: true }], anahtar: "last first frame kare al son kare uzat extend" },
  ses: {
    tur: "ses", ad: "Seslendirme", alt: "Metinden doğal ses; 70+ dil", kategori: "Ses", ikon: AudioLines, cikti: "ses", istemli: true, calisir: true, genislik: 300, model: "Eleven v3",
    girisler: [{ id: "metin", ad: "Metin", tip: "metin", coklu: true }], anahtar: "tts audio ses anlatım voice",
  },
  muzik: {
    tur: "muzik", ad: "Müzik", alt: "İstemden şarkı ya da enstrümantal", kategori: "Ses", ikon: Music2, cikti: "ses", istemli: true, calisir: true, genislik: 300, model: "Eleven Music v2.5",
    girisler: [{ id: "istem", ad: "İstem", tip: "metin", coklu: true }, { id: "soz", ad: "Sözler", tip: "metin" }], anahtar: "music şarkı beste",
  },
  efekt: { tur: "efekt", ad: "Ses efekti", alt: "Tariften ortam sesi ve efekt", kategori: "Ses", ikon: Waves, cikti: "ses", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "istem", ad: "Tarif", tip: "metin", coklu: true }], anahtar: "sfx efekt ortam" },
  asistan: {
    tur: "asistan", ad: "Asistan", alt: "İstem yazar, fikir üretir, liste çıkarır (LLM)", kategori: "Metin", ikon: Sparkles, cikti: "metin", istemli: true, calisir: true, genislik: 300,
    girisler: [{ id: "baglam", ad: "Bağlam", tip: "metin", coklu: true }, { id: "gorsel", ad: "Görsel", tip: "gorsel", coklu: true }], anahtar: "llm claude yapay zeka yaz",
  },
  /* ── Görsel işlemleri ── */
  maske: { tur: "maske", ad: "Bölgesel düzenle", alt: "Boyadığın alanı değiştir ya da nesneyi sil", kategori: "Görsel", ikon: Paintbrush, cikti: "gorsel", istemli: true, calisir: true, genislik: 300, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }, { id: "istem", ad: "İstem", tip: "metin", coklu: true }], anahtar: "inpaint maske mask sil nesne" },
  genislet: { tur: "genislet", ad: "Genişlet", alt: "Kadrajı yeni orana büyüt (outpaint)", kategori: "Görsel", ikon: Expand, cikti: "gorsel", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "outpaint reframe oran kadraj" },
  isik: { tur: "isik", ad: "Yeniden ışıkla", alt: "Işığın yönünü, sertliğini, rengini değiştir", kategori: "Görsel", ikon: Sun, cikti: "gorsel", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "relight ışık aydınlatma" },
  zemin: { tur: "zemin", ad: "Zemin değiştir", alt: "Özneyi koru, arka planı tarife göre yenile", kategori: "Görsel", ikon: Mountain, cikti: "gorsel", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }, { id: "istem", ad: "Yeni zemin", tip: "metin", coklu: true }], anahtar: "background replace arka plan sahne" },
  yuz: { tur: "yuz", ad: "Yüz değiştir", alt: "Kaynak yüzü hedef görsele aktar", kategori: "Görsel", ikon: ScanFace, cikti: "gorsel", calisir: true, genislik: 280, girisler: [{ id: "yuz", ad: "Yüz", tip: "gorsel", zorunlu: true }, { id: "hedef", ad: "Hedef", tip: "gorsel", zorunlu: true }], anahtar: "face swap yüz" },
  giydir: { tur: "giydir", ad: "Giydir", alt: "Kıyafeti modelin üstüne giydir", kategori: "Görsel", ikon: Shirt, cikti: "gorsel", calisir: true, genislik: 280, girisler: [{ id: "model", ad: "Model", tip: "gorsel", zorunlu: true }, { id: "kiyafet", ad: "Kıyafet", tip: "gorsel", zorunlu: true }], anahtar: "try on kıyafet moda" },
  eskiz: { tur: "eskiz", ad: "Eskizden görsel", alt: "Kaba çizimi bitmiş görsele çevir", kategori: "Görsel", ikon: Brush, cikti: "gorsel", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "gorsel", ad: "Eskiz", tip: "gorsel", zorunlu: true }, { id: "istem", ad: "İstem", tip: "metin", coklu: true }], anahtar: "sketch çizim taslak" },
  aiBuyut: { tur: "aiBuyut", ad: "AI büyüt", alt: "Topaz, SeedVR2, Clarity, Crystal…", kategori: "Görsel", ikon: ZoomIn, cikti: "gorsel", calisir: true, genislik: 280, model: "seedvr", girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "upscale topaz magnific 4k 8k" },
  kirp: { tur: "kirp", ad: "Kırp ve boyutlandır", alt: "Oran, döndür, çevir; ücretsiz", kategori: "Görsel", ikon: Crop, cikti: "gorsel", calisir: true, genislik: 260, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "crop resize rotate flip döndür" },
  renk: { tur: "renk", ad: "Renk ayarı", alt: "Parlaklık, kontrast, doygunluk, keskinlik; ücretsiz", kategori: "Görsel", ikon: Palette, cikti: "gorsel", calisir: true, genislik: 260, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "color grade filtre siyah beyaz" },
  yazi: { tur: "yazi", ad: "Yazı ekle", alt: "Başlık, altyazı, fiyat etiketi; ücretsiz", kategori: "Görsel", ikon: Baseline, cikti: "gorsel", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }, { id: "metin", ad: "Metin", tip: "metin" }], anahtar: "text overlay başlık caption" },
  katman: { tur: "katman", ad: "Katman birleştir", alt: "Bir görseli diğerinin üstüne yerleştir; ücretsiz", kategori: "Görsel", ikon: Layers, cikti: "gorsel", calisir: true, genislik: 280,
    girisler: [{ id: "zemin", ad: "Zemin", tip: "gorsel", zorunlu: true }, { id: "ust", ad: "Üst katman", tip: "gorsel", zorunlu: true }], anahtar: "compositor layer bindir logo filigran composite" },
  kolaj: { tur: "kolaj", ad: "Kolaj", alt: "Görselleri ızgarada birleştir; ücretsiz", kategori: "Görsel", ikon: Grid3x3, cikti: "gorsel", calisir: true, genislik: 280, girisler: [{ id: "gorsel", ad: "Görseller", tip: "gorsel", coklu: true, zorunlu: true }], anahtar: "grid contact sheet ızgara" },
  /* ── Video işlemleri ── */
  videoUzat: { tur: "videoUzat", ad: "Videoyu uzat", alt: "Son kareden devam eden yeni çekim", kategori: "Video", ikon: FastForward, cikti: "video", istemli: true, calisir: true, genislik: 300, model: "Seedance 2.0 Fast", girisler: [{ id: "video", ad: "Video", tip: "video", zorunlu: true }, { id: "istem", ad: "İstem", tip: "metin", coklu: true }], anahtar: "extend devam uzat" },
  videoBuyut: { tur: "videoBuyut", ad: "Video büyüt", alt: "FlashVSR, SeedVR2 Video", kategori: "Video", ikon: MonitorUp, cikti: "video", calisir: true, genislik: 280, model: "flashvsr", girisler: [{ id: "video", ad: "Video", tip: "video", zorunlu: true }], anahtar: "upscale video 4k" },
  videoKes: { tur: "videoKes", ad: "Kes ve hızlandır", alt: "Başlangıç, bitiş, hız; ücretsiz", kategori: "Video", ikon: Scissors, cikti: "video", calisir: true, genislik: 280, girisler: [{ id: "video", ad: "Video", tip: "video", zorunlu: true }], anahtar: "trim cut speed hız kırp" },
  videoBirlestir: { tur: "videoBirlestir", ad: "Klipleri birleştir", alt: "Sırayla ekle, geçiş ve müzik; ücretsiz", kategori: "Video", ikon: ListVideo, cikti: "video", calisir: true, genislik: 300,
    girisler: [{ id: "v1", ad: "Klip 1", tip: "video", zorunlu: true }, { id: "v2", ad: "Klip 2", tip: "video" }, { id: "v3", ad: "Klip 3", tip: "video" }, { id: "v4", ad: "Klip 4", tip: "video" }, { id: "ses", ad: "Müzik", tip: "ses" }], anahtar: "merge stitch concat montaj" },
  sesEkle: { tur: "sesEkle", ad: "Videoya ses ekle", alt: "Seslendirme ya da müziği videoyla karıştır", kategori: "Video", ikon: Speaker, cikti: "video", calisir: true, genislik: 280, girisler: [{ id: "video", ad: "Video", tip: "video", zorunlu: true }, { id: "ses", ad: "Ses", tip: "ses", zorunlu: true }], anahtar: "audio mix müzik seslendirme" },
  /* ── Ses işlemleri ── */
  transkript: { tur: "transkript", ad: "Transkript", alt: "Konuşmayı yazıya dök (Scribe)", kategori: "Ses", ikon: Captions, cikti: "metin", calisir: true, genislik: 280, girisler: [{ id: "ses", ad: "Ses", tip: "ses", zorunlu: true }], anahtar: "speech to text altyazı stt" },
  sesDegistir: { tur: "sesDegistir", ad: "Ses değiştir", alt: "Kaydı başka bir sese dönüştür", kategori: "Ses", ikon: Repeat, cikti: "ses", calisir: true, genislik: 280, girisler: [{ id: "ses", ad: "Kayıt", tip: "ses", zorunlu: true }], anahtar: "voice changer speech to speech" },
  dublaj: { tur: "dublaj", ad: "Dublaj", alt: "Konuşmayı başka dile çevir, aynı sesle", kategori: "Ses", ikon: Languages, cikti: "ses", calisir: true, genislik: 280, girisler: [{ id: "ses", ad: "Kayıt", tip: "ses", zorunlu: true }], anahtar: "dubbing çeviri translate" },
  sesTemizle: { tur: "sesTemizle", ad: "Sesi temizle", alt: "Gürültüyü at, konuşmayı ayır", kategori: "Ses", ikon: AudioWaveform, cikti: "ses", calisir: true, genislik: 260, girisler: [{ id: "ses", ad: "Kayıt", tip: "ses", zorunlu: true }], anahtar: "isolate gürültü noise" },
  ucBoyut: { tur: "ucBoyut", ad: "3D model", alt: "Görselden ya da istemden GLB model", kategori: "Görsel", ikon: Box, cikti: "gorsel", istemli: true, calisir: true, genislik: 300, model: "Vayra 3D 6", girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", coklu: true }, { id: "istem", ad: "İstem", tip: "metin", coklu: true }], anahtar: "3d glb mesh model meshy" },
  /* ── Metin yardımcıları ── */
  sec: { tur: "sec", ad: "Listeden seç", alt: "Bir listenin tek öğesini geçir (sıra ya da rastgele)", kategori: "Metin", ikon: Shuffle, cikti: "metin", calisir: true, genislik: 260, girisler: [{ id: "liste", ad: "Liste", tip: "metin", zorunlu: true }], anahtar: "router selector pick index rastgele" },
  gelistir: { tur: "gelistir", ad: "İstemi geliştir", alt: "Kısa fikri ayrıntılı üretim istemine çevir", kategori: "Metin", ikon: WandSparkles, cikti: "metin", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "metin", ad: "Metin", tip: "metin", coklu: true }], anahtar: "enhance prompt zenginleştir" },
  tarif: { tur: "tarif", ad: "Görselden istem", alt: "Görseli tarif eden istem yazar", kategori: "Metin", ikon: ScanEye, cikti: "metin", calisir: true, genislik: 280, girisler: [{ id: "gorsel", ad: "Görsel", tip: "gorsel", zorunlu: true }], anahtar: "describe caption image to prompt" },
  sahneler: { tur: "sahneler", ad: "Sahnelere böl", alt: "Hikâyeyi çekim listesine çevirir (liste)", kategori: "Metin", ikon: LayoutList, cikti: "metin", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "metin", ad: "Hikâye", tip: "metin", coklu: true }], anahtar: "storyboard shot list senaryo" },
  birlestir: { tur: "birlestir", ad: "Metin birleştir", alt: "{1} {2} {3} yer tutucularıyla şablon", kategori: "Metin", ikon: Merge, cikti: "metin", istemli: true, calisir: true, genislik: 280, girisler: [{ id: "a", ad: "{1}", tip: "metin" }, { id: "b", ad: "{2}", tip: "metin" }, { id: "c", ad: "{3}", tip: "metin" }], anahtar: "concat combine şablon template" },
  karsilastir: { tur: "karsilastir", ad: "Karşılaştır", alt: "İki görseli kaydırarak kıyasla", kategori: "Düzen", ikon: Columns2, genislik: 320, girisler: [{ id: "a", ad: "A", tip: "gorsel" }, { id: "b", ad: "B", tip: "gorsel" }], anahtar: "compare kiyas" },
  not: { tur: "not", ad: "Not", alt: "Yapışkan not", kategori: "Düzen", ikon: StickyNote, genislik: 240, girisler: [], anahtar: "sticky note aciklama" },
};
export const KATEGORILER: Kategori[] = ["Girdiler", "Görsel", "Video", "Ses", "Metin", "Düzen"];

/** Düğümün bir çalıştırmadaki kredi tahmini (öğe: liste girdisindeki öğe sayısı). */
export function dugumKredi(d: { tur: DugumTur; model?: string; ayar: Record<string, unknown>; metin?: string }, girdiMetin = "", oge = 1): number {
  if (!KATALOG[d.tur].calisir) return 0;
  return ayarKredi(d.tur, d.model ?? KATALOG[d.tur].model, d.ayar, (girdiMetin + (d.metin ?? "")).length, oge);
}

/** Kaynak çıktı tipi hedef girişe bağlanabilir mi. */
export const uyumlu = (cikti: PortTip | undefined, giris: PortTip) => !!cikti && cikti === giris;
