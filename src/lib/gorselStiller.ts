/* Görsel stüdyosu stil ön ayarları. Her stilin kapağı o stilde üretilmiş gerçek bir görseldir;
   `istem` sağlayıcıya "Visual style: …" yönergesi olarak gider (kullanıcının istemi değişmez). */
export type GorselStil = { id: string; ad: string; grup: "Fotoğraf" | "Sanat" | "Dönem"; kapak: string; istem: string };

export const GORSEL_STILLER: GorselStil[] = [
  { id: "sinematik", ad: "Sinematik", grup: "Fotoğraf", kapak: "/gercek/galeri/sinematik3.webp", istem: "cinematic film still, anamorphic lens, motivated dramatic lighting, rich color grade, shallow depth of field" },
  { id: "portre", ad: "Stüdyo portre", grup: "Fotoğraf", kapak: "/gercek/galeri/portre5.webp", istem: "professional studio portrait, softbox key light, seamless backdrop, crisp skin detail, 85mm lens" },
  { id: "urun", ad: "Ürün çekimi", grup: "Fotoğraf", kapak: "/gercek/galeri/urun6.webp", istem: "premium commercial product photography, clean studio set, controlled reflections, sharp focus, advertising quality" },
  { id: "film", ad: "Analog film", grup: "Fotoğraf", kapak: "/gercek/gorsel/mood-sicak-canli-film.webp", istem: "shot on 35mm analog film, natural film grain, warm color shift, slight halation, candid feel" },
  { id: "tek-kullanimlik", ad: "Tek kullanımlık", grup: "Fotoğraf", kapak: "/gercek/gorsel/mood-tek-kullanimlik-kamera.webp", istem: "disposable camera snapshot, direct flash, high contrast, slightly overexposed, nostalgic amateur look" },
  { id: "3d", ad: "3D render", grup: "Sanat", kapak: "/gercek/galeri/3d5.webp", istem: "high quality 3D render, soft global illumination, subsurface scattering, clean pastel studio background" },
  { id: "kil", ad: "Kil", grup: "Sanat", kapak: "/gercek/explainer-video/ex-claymotion.webp", istem: "handmade clay stop-motion style, visible fingerprints and soft clay texture, miniature set" },
  { id: "izometrik", ad: "İzometrik", grup: "Sanat", kapak: "/gercek/explainer-video/ex-isometric.webp", istem: "isometric 3D illustration, clean geometric shapes, soft shadows, orthographic view" },
  { id: "low-poly", ad: "Low poly", grup: "Sanat", kapak: "/gercek/explainer-video/ex-lowpoly.webp", istem: "low poly 3D art, faceted geometry, flat shaded polygons, vibrant gradient lighting" },
  { id: "kagit", ad: "Kâğıt işi", grup: "Sanat", kapak: "/gercek/explainer-video/ex-papercraft.webp", istem: "layered papercraft art, cut paper textures, depth shadows between layers" },
  { id: "kece", ad: "Keçe", grup: "Sanat", kapak: "/gercek/explainer-video/ex-needlefelt.webp", istem: "needle felted wool miniature, fuzzy fiber texture, cozy handmade look" },
  { id: "piksel", ad: "Piksel sanat", grup: "Sanat", kapak: "/gercek/explainer-video/ex-pixelart.webp", istem: "detailed pixel art, limited palette, crisp pixel edges, retro game aesthetic" },
  { id: "illustrasyon", ad: "2D illüstrasyon", grup: "Sanat", kapak: "/gercek/explainer-video/ex-2dillustrator.webp", istem: "flat 2D vector illustration, bold shapes, clean outlines, modern editorial style" },
  { id: "karisik", ad: "Karışık teknik", grup: "Sanat", kapak: "/gercek/explainer-video/ex-mixedmedia.webp", istem: "mixed media collage, paper cutouts, paint strokes and photo fragments" },
  { id: "y2k", ad: "Y2K", grup: "Dönem", kapak: "/gercek/gorsel/mood-y2k-studyo.webp", istem: "Y2K aesthetic, glossy chrome accents, bright flash, early 2000s fashion editorial" },
  { id: "frutiger", ad: "Frutiger Aero", grup: "Dönem", kapak: "/gercek/gorsel/mood-frutiger-aero.webp", istem: "Frutiger Aero aesthetic, glossy bubbles, aqua sky, fresh green nature, optimistic mid-2000s look" },
  { id: "seksenler", ad: "80'ler korku", grup: "Dönem", kapak: "/gercek/gorsel/mood-80ler-korku.webp", istem: "1980s horror film look, colored gel lighting, fog, grainy VHS era atmosphere" },
  { id: "su-alti", ad: "Su altı", grup: "Dönem", kapak: "/gercek/gorsel/mood-su-alti.webp", istem: "underwater photography, caustic light patterns, floating fabric, deep blue tones" },
];

export const stilBul = (id: string | null) => (id ? GORSEL_STILLER.find((s) => s.id === id) : undefined);

/** Referans görsel rolleri: sağlayıcıya "Image n: …" yönergesi olarak gider. */
export const REF_ROLLERI = [
  { id: "genel", ad: "Genel", alt: "Model kendi yorumlar" },
  { id: "stil", ad: "Stil", alt: "Yalnız ışık, renk ve doku" },
  { id: "karakter", ad: "Karakter", alt: "Yüz ve kimlik aynı kalır" },
  { id: "kompozisyon", ad: "Kompozisyon", alt: "Kadraj ve poz izlenir" },
  { id: "urun", ad: "Ürün", alt: "Ürün olduğu gibi korunur" },
] as const;
export type RefRol = (typeof REF_ROLLERI)[number]["id"];
