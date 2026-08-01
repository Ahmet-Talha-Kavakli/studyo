// Video Stüdyo (Higgsfield Video Studio düzeni) veri katmanı: Create/Edit/Motion
// Control modları + çözünürlük/süre/aspect seçenekleri. Cyan tema, Türkçe metinler.

export type VideoMod = "olustur" | "duzenle" | "hareket";

/** Sol panel üst sekmeleri — Higgsfield: Create Video / Edit Video / Motion Control. */
export const VIDEO_MODLARI: { id: VideoMod; ad: string; ozet: string }[] = [
  { id: "olustur", ad: "Video Üret", ozet: "Metin ya da görselden video" },
  { id: "duzenle", ad: "Video Düzenle", ozet: "Değiştir, yeniden stille, açı çevir" },
  { id: "hareket", ad: "Hareket Kontrolü", ozet: "Referans videoyla hareketi kopyala" },
];

/** Çözünürlük seçenekleri. */
export const VIDEO_COZUNURLUKLER = ["480p", "720p", "1080p", "4K"];

/** Süre seçenekleri (saniye). */
export const VIDEO_SURELER = [4, 6, 8, 10];

/** En-boy oranları. */
export const VIDEO_ORANLAR = [
  { id: "16:9", ad: "16:9", ipucu: "Yatay" },
  { id: "9:16", ad: "9:16", ipucu: "Dikey" },
  { id: "1:1", ad: "1:1", ipucu: "Kare" },
  { id: "21:9", ad: "21:9", ipucu: "Sinema" },
  { id: "4:3", ad: "4:3", ipucu: "Klasik" },
];

/** How it works — 3 adım. */
export const VIDEO_NASIL = [
  { baslik: "Görsel ekle", ozet: "Kaynak kareni yükle ya da metinle başla." },
  { baslik: "Preset seç", ozet: "250+ hareket/kamera presetinden birini seç." },
  { baslik: "Videoyu al", ozet: "Saniyeler içinde yayına hazır video." },
];

/** Video sonuç kartı context menü eylemleri. */
export const VIDEO_MENU_EYLEMLERI = [
  "Viral tahmini", "Çevir", "Sesi değiştir", "Yeniden üret", "Prompt'u kullan",
];

/** Hareket & kamera preset galerisi — kategori-gruplu, her preset prompt katkısı sağlar. */
export const VIDEO_PRESET_KATEGORILERI = ["Tümü", "Kamera", "Hareket", "Atmosfer", "Efekt"];

export const VIDEO_PRESETLER: { ad: string; kat: string; ipucu: string; grad: string; ekPrompt: string }[] = [
  { ad: "Genel", kat: "Kamera", ipucu: "Dengeli, nötr çekim", grad: "from-slate-500 to-slate-800", ekPrompt: "" },
  { ad: "Dolly In", kat: "Kamera", ipucu: "Yavaş yakınlaşan kamera", grad: "from-cyan-500 to-blue-800", ekPrompt: "yavaş dolly-in kamera hareketi, artan yakınlık" },
  { ad: "Dolly Out", kat: "Kamera", ipucu: "Geriye açılan kamera", grad: "from-blue-500 to-indigo-800", ekPrompt: "dolly-out, sahne açılıyor" },
  { ad: "360 Orbit", kat: "Kamera", ipucu: "Nesne etrafında dönüş", grad: "from-violet-500 to-purple-800", ekPrompt: "360 derece orbital kamera, özneyi çevreleyen" },
  { ad: "Bullet Time", kat: "Efekt", ipucu: "Donmuş an, dönen kamera", grad: "from-fuchsia-500 to-rose-800", ekPrompt: "bullet-time, zaman donmuş, kamera dönüyor" },
  { ad: "Crash Zoom", kat: "Kamera", ipucu: "Ani sert yakınlaşma", grad: "from-orange-500 to-red-800", ekPrompt: "ani crash zoom, sert yakınlaşma" },
  { ad: "FPV Drone", kat: "Hareket", ipucu: "Hızlı drone uçuşu", grad: "from-teal-400 to-cyan-800", ekPrompt: "FPV drone uçuşu, hızlı dinamik takip" },
  { ad: "Vertigo", kat: "Efekt", ipucu: "Dolly-zoom gerilimi", grad: "from-emerald-500 to-teal-800", ekPrompt: "vertigo dolly-zoom efekti, tedirgin his" },
  { ad: "Neon Şehir", kat: "Atmosfer", ipucu: "Siberpunk neon ışıklar", grad: "from-pink-500 to-cyan-700", ekPrompt: "siberpunk neon şehir, yağmurlu ıslak asfalt yansımaları" },
  { ad: "Altın Saat", kat: "Atmosfer", ipucu: "Sıcak gün batımı ışığı", grad: "from-amber-400 to-orange-700", ekPrompt: "altın saat sıcak ışık, uzun gölgeler" },
  { ad: "Ağır Çekim", kat: "Hareket", ipucu: "Yavaşlatılmış aksiyon", grad: "from-sky-400 to-blue-700", ekPrompt: "ağır çekim, akıcı yavaş hareket" },
  { ad: "El Kamerası", kat: "Hareket", ipucu: "Doğal titreşimli çekim", grad: "from-lime-400 to-green-700", ekPrompt: "el kamerası, hafif organik titreşim, belgesel his" },
  { ad: "Vinç Yukarı", kat: "Kamera", ipucu: "Yükselen vinç çekimi", grad: "from-indigo-500 to-blue-900", ekPrompt: "vinç ile yukarı yükselen kamera, sahneyi açan geniş perspektif" },
  { ad: "Balık Gözü", kat: "Efekt", ipucu: "Geniş bükülmüş lens", grad: "from-purple-500 to-fuchsia-800", ekPrompt: "balık gözü lens, aşırı geniş açı, bükülmüş perspektif" },
  { ad: "Hollanda Açısı", kat: "Kamera", ipucu: "Eğik gergin çerçeve", grad: "from-rose-500 to-red-900", ekPrompt: "hollanda açısı, eğik kamera, tedirgin gerilim hissi" },
  { ad: "Robotik Kol", kat: "Hareket", ipucu: "Hassas mekanik yörünge", grad: "from-zinc-400 to-slate-800", ekPrompt: "robotik kamera kolu, hassas mekanik yörünge, ürün çekimi" },
  { ad: "Ajan Girişi", kat: "Atmosfer", ipucu: "Sinematik gizemli giriş", grad: "from-neutral-500 to-zinc-900", ekPrompt: "ajan girişi, düşük ışık, gizemli sinematik reveal, film-noir" },
  { ad: "Alev Aldı", kat: "Efekt", ipucu: "Patlayan ateş efekti", grad: "from-orange-500 to-rose-900", ekPrompt: "alevler yükseliyor, patlayan ateş, sıcak parçacıklar, sinematik" },
  { ad: "Kar Tozu", kat: "Atmosfer", ipucu: "Karda hızlı iniş", grad: "from-sky-300 to-cyan-800", ekPrompt: "karda hızlı iniş, savrulan kar tozu, aksiyon kamerası" },
  { ad: "İç Işık", kat: "Atmosfer", ipucu: "Işıyan içsel parıltı", grad: "from-pink-400 to-violet-800", ekPrompt: "içeriden ışıyan parıltı, holografik iç aydınlatma, rüya gibi" },
  { ad: "Düşük Örtücü", kat: "Efekt", ipucu: "Bulanık hareket izi", grad: "from-amber-500 to-orange-900", ekPrompt: "düşük örtücü hızı, hareket bulanıklığı izleri, gece ışık çizgileri" },
  { ad: "Aşağı POV", kat: "Hareket", ipucu: "Yokuş aşağı bakış", grad: "from-teal-500 to-emerald-900", ekPrompt: "yokuş aşağı birinci şahıs bakışı, hızlı iniş, adrenalin" },
];
