export interface UrunOzellik {
  baslik: string;
  aciklama: string;
  ikon: string;
}

export interface UrunSayfa {
  slug: string;
  ustBaslik: string;
  baslik: string;
  aciklama: string;
  renk: string;
  vurgu: string; // tailwind renk sınıfı
  fark?: boolean;
  ozellikler: UrunOzellik[];
  akis: { adim: string; ozet: string }[];
  cta: string;
}

export const URUNLER: Record<string, UrunSayfa> = {
  sinema: {
    slug: "sinema",
    ustBaslik: "Sinema Stüdyosu",
    baslik: "Yönetmen koltuğu artık senin",
    aciklama: "AI Yönetmen fikrini çekimlere böler, 70+ sinematik kamera preseti ile her kareyi sen yönetirsin.",
    renk: "from-iris-500 to-fuchsia-500",
    vurgu: "text-iris-400",
    ozellikler: [
      { baslik: "AI Yönetmen", aciklama: "Konseptini otomatik olarak profesyonel çekim listesine böler.", ikon: "sparkles" },
      { baslik: "70+ Kamera Preseti", aciklama: "Dolly, crane, bullet time, FPV — gerçek yönetmen hareketleri.", ikon: "camera" },
      { baslik: "Çekim Zaman Çizelgesi", aciklama: "Her çekimi ayrı ayrı düzenle, sırala, süresini ayarla.", ikon: "film" },
      { baslik: "Çoklu Model", aciklama: "Sora 2, Veo 3.1, Kling 3.0 ve daha fazlası tek akışta.", ikon: "layers" },
    ],
    akis: [
      { adim: "Konsepti yaz", ozet: "Sahneyi bir cümleyle anlat" },
      { adim: "AI böler", ozet: "Yönetmen çekimleri oluşturur" },
      { adim: "Kamerayı ayarla", ozet: "Her çekime hareket ata" },
      { adim: "Render et", ozet: "Sinematik sonucu al" },
    ],
    cta: "Sinema Stüdyosu'nu dene",
  },
  pazarlama: {
    slug: "pazarlama",
    ustBaslik: "Pazarlama Stüdyosu",
    baslik: "Ürün linkinden yayına hazır reklam",
    aciklama: "URL'i yapıştır, avatarı seç. Hook, seslendirme ve müzikle tam donanımlı reklam saniyeler içinde.",
    renk: "from-amber-glow to-orange-500",
    vurgu: "text-amber-glow",
    ozellikler: [
      { baslik: "URL'den reklam", aciklama: "Ürün sayfasından görsel ve metni otomatik çeker.", ikon: "link" },
      { baslik: "AI Avatarlar", aciklama: "Gerçekçi sunucularla UGC talking-head videolar.", ikon: "users" },
      { baslik: "Hazır Formatlar", aciklama: "UGC, CGI showcase, demo, unboxing tek tıkla.", ikon: "package" },
      { baslik: "Ses & Müzik", aciklama: "Otomatik seslendirme ve telifsiz müzik.", ikon: "music" },
    ],
    akis: [
      { adim: "URL yapıştır", ozet: "Ürün linkini ekle" },
      { adim: "Format seç", ozet: "UGC, CGI, demo…" },
      { adim: "Avatar seç", ozet: "Sunucuyu belirle" },
      { adim: "Yayınla", ozet: "Reklamı indir" },
    ],
    cta: "Pazarlama Stüdyosu'nu dene",
  },
  "3d": {
    slug: "3d",
    ustBaslik: "3D Stüdyo · Meshy",
    baslik: "Metinden üretime hazır 3D model",
    aciklama: "Rakiplerde yok. Meshy ile bir cümleden ya da tek görselden PBR dokulu, oyun ve AR uyumlu 3D varlıklar üret.",
    renk: "from-cyan-glow to-blue-500",
    vurgu: "text-cyan-glow",
    fark: true,
    ozellikler: [
      { baslik: "Metinden 3D", aciklama: "Açıklamandan tam 3D mesh oluştur.", ikon: "type" },
      { baslik: "Görselden 3D", aciklama: "Tek fotoğraftan hacimli model çıkar.", ikon: "image" },
      { baslik: "PBR Dokulama", aciklama: "4K gerçekçi malzeme ve doku üretimi.", ikon: "palette" },
      { baslik: "Çoklu Format", aciklama: "GLB, FBX, OBJ, USDZ, STL dışa aktarma.", ikon: "box" },
    ],
    akis: [
      { adim: "Tanımla", ozet: "Metin yaz veya görsel yükle" },
      { adim: "Stil seç", ozet: "Gerçekçi, low-poly, karikatür…" },
      { adim: "Üret", ozet: "Meshy modeli oluşturur" },
      { adim: "Dışa aktar", ozet: "Oyun/AR'a hazır indir" },
    ],
    cta: "3D Stüdyo'yu dene",
  },
  ses: {
    slug: "ses",
    ustBaslik: "Ses Stüdyosu · ElevenLabs & Vali",
    baslik: "Stüdyo kalitesinde ses, tek panelde",
    aciklama: "Rakiplerde yok. 32 dilde seslendirme, kendi sesini klonla, metinden müzik ve efekt üret.",
    renk: "from-emerald-400 to-teal-500",
    vurgu: "text-emerald-400",
    fark: true,
    ozellikler: [
      { baslik: "32 Dilde TTS", aciklama: "Ultra-gerçekçi, duygu yüklü seslendirme.", ikon: "audio-lines" },
      { baslik: "Ses Klonlama", aciklama: "Kısa örnekten kendi sesini yarat.", ikon: "mic" },
      { baslik: "Metinden Müzik", aciklama: "Vali ile telifsiz müzik ve jingle.", ikon: "music" },
      { baslik: "Ses Efektleri", aciklama: "Metinden foley ve SFX üretimi.", ikon: "volume-2" },
    ],
    akis: [
      { adim: "Modu seç", ozet: "TTS, klon, müzik, SFX" },
      { adim: "Metni yaz", ozet: "Ne söylensin / çalınsın" },
      { adim: "Sesi seç", ozet: "6 ses, 6 dil" },
      { adim: "Üret", ozet: "Oynatılabilir ses al" },
    ],
    cta: "Ses Stüdyosu'nu dene",
  },
  kimlik: {
    slug: "kimlik",
    ustBaslik: "Kimlik · Ruh ID",
    baslik: "Karakterin her sahnede aynı",
    aciklama: "Yüzü bir kez eğit, tüm üretimlerinde tutarlı karakter. AI influencer ve seri içerik için biçilmiş kaftan.",
    renk: "from-rose-400 to-vayra-500",
    vurgu: "text-rose-400",
    ozellikler: [
      { baslik: "Yüz Eğitimi", aciklama: "5-20 referans görselle kalıcı kimlik.", ikon: "user-round" },
      { baslik: "Tutarlılık", aciklama: "Video, görsel, reklam — hep aynı yüz.", ikon: "check" },
      { baslik: "Çoklu Kimlik", aciklama: "Birden fazla karakteri yönet.", ikon: "users" },
      { baslik: "Anında Kullanım", aciklama: "Tüm stüdyolarda seç ve üret.", ikon: "sparkles" },
    ],
    akis: [
      { adim: "Görsel yükle", ozet: "Referansları ekle" },
      { adim: "Eğit", ozet: "Ruh ID öğrenir" },
      { adim: "Seç", ozet: "Üretimde kimliği kullan" },
      { adim: "Tutarlı üret", ozet: "Her yerde aynı yüz" },
    ],
    cta: "Ruh ID'yi dene",
  },
  akis: {
    slug: "akis",
    ustBaslik: "Akış · Görsel Workflow",
    baslik: "Özgürce inşa et, görsel otomatikleştir",
    aciklama: "Düğüm tabanlı görsel akış editörü. Metinden görsele, görselden videoya uzanan zinciri tek tuvalde kur, çıktıları birbirine bağla.",
    renk: "from-cyan-glow to-vayra-600",
    vurgu: "text-cyan-glow",
    fark: true,
    ozellikler: [
      { baslik: "Düğüm Tuvali", aciklama: "Sürükle-bırak düğümlerle akış kur.", ikon: "layers" },
      { baslik: "Zincir Üretim", aciklama: "Bir düğümün çıktısı diğerine girer.", ikon: "link" },
      { baslik: "Çoklu Tür", aciklama: "Metin, görsel, video, ses, 3D düğümleri.", ikon: "box" },
      { baslik: "Görsel Otomasyon", aciklama: "Tekrarlayan işleri tek akışa dök.", ikon: "wand-2" },
    ],
    akis: [
      { adim: "Düğüm ekle", ozet: "Tuvale bir düğüm koy" },
      { adim: "Bağla", ozet: "Düğümleri birbirine çiz" },
      { adim: "Üret", ozet: "Zinciri çalıştır" },
      { adim: "Dışa aktar", ozet: "Sonucu al" },
    ],
    cta: "Akış'ı dene",
  },
};

export const URUN_SLUGLARI = Object.keys(URUNLER);
