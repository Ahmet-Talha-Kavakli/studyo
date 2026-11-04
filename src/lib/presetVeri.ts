/**
 * Viral Presetler kataloğu — Vayra 24 preset (kullanıcı tanımlı, sıfırdan).
 * Her preset kullanıcının eklediği görseli referans alıp 8 saniyelik hareket videosu üretir.
 * `video` alanı public/gercek/preset-video/<video>.mp4 dosyasına denk gelir (kart + modal önizleme).
 * `veoPrompt` Veo 3.1'e giden 8 sn İngilizce hareket tarifi (referans görsel image-to-video).
 * SSR güvenli (statik).
 */

export type PresetRozet = "VIRAL" | "OYUN" | "VAYRA PRESET" | "marka";

export interface Preset {
  ad: string;
  rozet: PresetRozet;
  marka?: string;
  kredi: number;
  premium?: boolean;
  aciklama: string;        // Türkçe kullanıcı açıklaması
  kat: string;             // onizlemeArka kategorisi (video yoksa yedek gradyan)
  kategoriler: string[];   // filtre chip'leri
  video: string;           // preset-video/<slug>.mp4
  kapak?: string;          // örnek video yoksa kapak görseli
  veoPrompt: string;       // Veo 3.1 image-to-video hareket tarifi (8sn)
}

/** Kategori chip'leri (carousel). */
export const PRESET_KATEGORILER = [
  "TÜMÜ", "KAMERA HAREKETİ", "DÖNÜŞÜM", "AKSİYON", "FANTASTİK",
  "SPOR", "UZAY", "KAÇIŞ", "SİNEMATİK", "VIRAL",
];

/** Videosu ÜRETİLMİŞ preset slug'ları — kalanlar Veo kotası açılınca eklenir.
 * CMS/galeri bu seti kullanarak 404 gürültüsü olmadan yalnızca var olan videoyu oynatır. */
export const HAZIR_VIDEOLAR = new Set([
  "action-figure", "cardboard-cutout", "earth-zoom", "elevate", "fairytale-castle",
  "float-spin", "moonwalk", "orbit-360", "selfie-twin", "sketch-to-fabric", "sticker-peel",
]);

export const PRESETLER: Preset[] = [
  {
    ad: "Earth Zoom", rozet: "VIRAL", kredi: 30,
    aciklama: "Uzaydaki Dünya'dan başlayıp, hareketli bir kamerayla (dönme, kayma, dalış) 8 saniye boyunca senin eklediğin görsele doğru dramatik bir zoom-in.",
    kat: "manzara", kategoriler: ["KAMERA HAREKETİ", "UZAY", "VIRAL"], video: "earth-zoom",
    veoPrompt: "Start on planet Earth seen from outer space, stars and glowing atmosphere. The camera dives down through the clouds with a fast dramatic sweeping and rotating motion, rushing through the atmosphere and streets, and rapidly zooms in until it arrives exactly on the subject from the reference image. Cinematic, dynamic camera, motion blur, epic scale, 8 seconds.",
  },
  {
    ad: "Float Spin", rozet: "VIRAL", kredi: 24,
    aciklama: "Eklediğin görsel kendi ekseni etrafında yumuşakça 360 derece döner — havada süzülen, temiz stüdyo hissi.",
    kat: "3d", kategoriler: ["KAMERA HAREKETİ", "VIRAL"], video: "float-spin",
    veoPrompt: "The subject from the reference image floats gently in the air and rotates a full 360 degrees around its own vertical axis, smooth turntable spin, soft studio lighting, clean seamless background, subtle levitation, elegant and premium, 8 seconds.",
  },
  {
    ad: "Sticker Peel", rozet: "VIRAL", kredi: 24,
    aciklama: "Eklediğin fotoğraf, gerçek bir el tarafından bir sticker gibi tutulup yüzeyden yavaşça çekilip kaldırılır.",
    kat: "portre", kategoriler: ["DÖNÜŞÜM", "VIRAL"], video: "sticker-peel",
    veoPrompt: "The reference image appears as a glossy die-cut sticker on a surface. A real human hand reaches in, pinches the corner, and slowly peels the sticker off the surface, the edges lifting and bending like real vinyl, playful and satisfying, natural lighting, 8 seconds.",
  },
  {
    ad: "Selfie Twin", rozet: "VIRAL", kredi: 32,
    aciklama: "Görseldeki karakterin bir kopyası (ikizi) belirir, yanına gelip bizimle poz verir, ekranda gezinir, sonra el sallayıp çıkar gider.",
    kat: "portre", kategoriler: ["DÖNÜŞÜM", "VIRAL"], video: "selfie-twin",
    veoPrompt: "The person from the reference image is joined by an identical twin copy of themselves that walks into frame. The twin poses playfully next to them for a selfie, moves around the screen, waves at the camera, then walks away and leaves the frame. Fun, casual vlog energy, natural lighting, 8 seconds.",
  },
  {
    ad: "Cardboard Cutout", rozet: "OYUN", kredi: 28,
    aciklama: "Görseldeki kişi kartondan bir kesme figüre dönüşür ve aynı kişi tarafından tutulup kaldırılarak götürülür.",
    kat: "portre", kategoriler: ["DÖNÜŞÜM", "VIRAL"], video: "cardboard-cutout",
    veoPrompt: "The person from the reference image turns into a flat life-size cardboard cutout standee. An identical version of the same person walks in, grabs the cardboard cutout by the edge, lifts it up and carries it away out of frame. Quirky and surreal, natural indoor lighting, 8 seconds.",
  },
  {
    ad: "Moonwalk", rozet: "VIRAL", kredi: 28,
    aciklama: "Görseldeki kişi, ayın yüzeyinde yarım daire çizerek pürüzsüz bir moonwalk yapar — düşük yer çekimi hissiyle.",
    kat: "sinematik", kategoriler: ["AKSİYON", "UZAY", "VIRAL"], video: "moonwalk",
    veoPrompt: "The person from the reference image performs a smooth Michael-Jackson-style moonwalk in a semicircle across the surface of the Moon, low gravity floating steps, kicking up moon dust, Earth visible in the black starry sky behind them, cinematic and stylish, 8 seconds.",
  },
  {
    ad: "Sketch to Fabric", rozet: "VAYRA PRESET", kredi: 42, premium: true,
    aciklama: "Kişinin kıyafeti önce bir kalem çizimi olarak belirir, ardından gerçek kumaşa dönüşerek üzerine giydirilir.",
    kat: "portre", kategoriler: ["DÖNÜŞÜM", "VIRAL"], video: "sketch-to-fabric",
    veoPrompt: "The person from the reference image's clothing starts as animated pencil sketch outlines drawing themselves onto the body, then the sketched lines transform and materialize into real detailed fabric with texture, folds and stitching, a fashion design coming to life on them, elegant reveal, soft studio light, 8 seconds.",
  },
  {
    ad: "Orbit 360", rozet: "VIRAL", kredi: 30,
    aciklama: "Kamera, eklediğin görselin etrafında 360 derece havalı, akıcı bir yörünge çizerek döner — sinematik bir tanıtım hissi.",
    kat: "sinematik", kategoriler: ["KAMERA HAREKETİ", "SİNEMATİK", "VIRAL"], video: "orbit-360",
    veoPrompt: "The camera performs a smooth cinematic 360-degree orbit all the way around the subject from the reference image, dynamic gliding gimbal movement, subject staying centered and sharp, dramatic lighting with lens flares, epic hero reveal, shallow depth of field, 8 seconds.",
  },
  {
    ad: "Fairytale Castle", rozet: "VAYRA PRESET", kredi: 42, premium: true,
    aciklama: "Görseldeki kişi, uzaktaki büyülü bir peri masalı kalesine doğru koşar — büyülü, ışıltılı bir atmosfer.",
    kat: "sinematik", kategoriler: ["FANTASTİK", "VIRAL"], video: "fairytale-castle",
    veoPrompt: "The person from the reference image runs joyfully across a lush enchanted meadow toward a magnificent glowing fairytale castle in the distance, sparkles and fireflies in the air, golden magical light, sweeping tracking camera following behind them, whimsical fantasy atmosphere, 8 seconds.",
  },
  {
    ad: "Elevate", rozet: "VAYRA PRESET", kredi: 54, premium: true,
    aciklama: "Görseldeki kişi, sanki göğsünden görünmez bir güç tarafından tutuluyormuş gibi yataktan/yerden yukarı kalkar ve uzay boşluğuna doğru yükselir.",
    kat: "sinematik", kategoriler: ["UZAY", "FANTASTİK", "VIRAL"], video: "elevate",
    veoPrompt: "The person from the reference image lies still, then is slowly pulled upward as if lifted by an invisible force from their chest, rising off the bed and levitating, floating higher and higher, the ceiling dissolving into open space as they ascend into the starry cosmos, dreamlike, ethereal light, weightless, 8 seconds.",
  },
  {
    ad: "Action Figure", rozet: "OYUN", kredi: 32,
    aciklama: "Eklediğin karakter minik bir aksiyon figürüne dönüşür; dev bir el onu tutup oynatır, büyütüp küçültür, poz verdirir.",
    kat: "3d", kategoriler: ["DÖNÜŞÜM", "OYUN"], video: "action-figure",
    veoPrompt: "The character from the reference image becomes a small collectible plastic action figure. A giant human hand picks it up, plays with it, poses its arms, moves it closer and farther from the camera, tilting and inspecting it like a toy, glossy plastic sheen, playful, shallow depth of field, 8 seconds.",
  },
  {
    ad: "Mighty Fighter", rozet: "OYUN", kredi: 32,
    aciklama: "Görseldeki kişi bir şövalye zırhı giyer, savaştan yorgun düşmüş halde açık yeşil çimenlik bir alanda durur.",
    kat: "sinematik", kategoriler: ["FANTASTİK", "AKSİYON"], video: "mighty-fighter",
    veoPrompt: "The person from the reference image is now wearing worn medieval knight armor, standing battle-weary and exhausted on a wide grassy green field, breathing heavily, holding a sword low, dramatic overcast cinematic light, wind moving the grass, epic fantasy mood, slow push-in camera, 8 seconds.",
  },
  {
    ad: "Blue Depth", rozet: "VIRAL", kredi: 42,
    aciklama: "Görseldeki kişi denizin derinliklerinde süzülür; etrafında balık sürüleri ve köpekbalıkları yüzer, ışık huzmeleri süzülür.",
    kat: "sinematik", kategoriler: ["FANTASTİK", "SİNEMATİK", "VIRAL"], video: "blue-depth",
    veoPrompt: "The person from the reference image glides and floats gracefully deep underwater in a vast blue ocean, schools of fish and sharks swimming around them, god rays of sunlight piercing down from the surface, bubbles rising, serene and mysterious, slow drifting motion, cinematic, 8 seconds.",
  },
  {
    ad: "Orbital Presence", rozet: "VIRAL", kredi: 35,
    aciklama: "Görseldeki kişi, Dünya'nın üzerinde uzayda oturur — arkasında mavi gezegen ve yıldızlar, sakin ve epik bir görünüm.",
    kat: "manzara", kategoriler: ["UZAY", "SİNEMATİK", "VIRAL"], video: "orbital-presence",
    veoPrompt: "The person from the reference image sits calmly on the curved edge of planet Earth as seen from orbit, the blue glowing planet and starfield stretching below and behind them, gentle floating hair, serene god-like presence, slow cinematic camera drift, awe-inspiring epic scale, 8 seconds.",
  },
  {
    ad: "Ice Statue", rozet: "VAYRA PRESET", kredi: 42, premium: true,
    aciklama: "Görseldeki kişi yukarıdan aşağıya doğru yavaşça buza dönüşür — kristal doku, soğuk ışık.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM", "VIRAL"], video: "ice-statue",
    veoPrompt: "The person from the reference image slowly freezes and transforms into a crystal-clear ice statue, the ice creeping from the top of the head downward over the whole body, frost spreading, cold blue rim light refracting through the crystalline ice, mist rolling off, dramatic and beautiful, 8 seconds.",
  },
  {
    ad: "Baseball Game", rozet: "VIRAL", kredi: 32,
    aciklama: "Görseldeki kişi bir beyzbol maçındaki 'kiss cam'e yakalanır; kaliteli çekim zamanla farklı açılara geçer.",
    kat: "portre", kategoriler: ["SPOR", "VIRAL"], video: "baseball-game",
    veoPrompt: "The person from the reference image is caught on the jumbotron kiss-cam at a packed baseball stadium, smiling shyly and reacting, high-quality broadcast footage smoothly cutting between multiple camera angles over time, stadium lights, crowd in the background, live sports energy, 8 seconds.",
  },
  {
    ad: "Drift King", rozet: "VIRAL", kredi: 32,
    aciklama: "Görseldeki kişi bir arabayla drift atar — hareketli kamera, lastik dumanı, keskin dönüşler.",
    kat: "sinematik", kategoriler: ["AKSİYON", "SİNEMATİK", "VIRAL"], video: "drift-king",
    veoPrompt: "The person from the reference image drives a sports car doing an aggressive drift, tires screeching and pouring smoke, sharp sliding turns on a neon-lit night street, dynamic shaky chase camera following the car, sparks and reflections, cinematic and intense, 8 seconds.",
  },
  {
    ad: "Football Invasion", rozet: "VIRAL", kredi: 42,
    aciklama: "Görseldeki kişi stadyumdaki sahaya atlar ve koşar, sonra Ronaldo'nun 'Siuu' pozunu yapar; peşinden güvenlikler koşar.",
    kat: "sinematik", kategoriler: ["SPOR", "AKSİYON", "VIRAL"], video: "football-invasion",
    veoPrompt: "The person from the reference image jumps onto a floodlit football stadium pitch and sprints across the grass, then leaps and lands doing Cristiano Ronaldo's iconic 'Siuu' celebration with arms out, as stadium security guards chase after them, roaring crowd, dynamic broadcast camera, 8 seconds.",
  },
  {
    ad: "Kung Fu Hit", rozet: "VAYRA PRESET", kredi: 53, premium: true,
    aciklama: "Görseldeki kişiye yaşlı bir Japon ninja ustası tekme atar; o tekmeyle Doctor Strange'deki gibi ruh katmanına geçip süzülür.",
    kat: "sinematik", kategoriler: ["AKSİYON", "FANTASTİK", "VIRAL"], video: "kung-fu-hit",
    veoPrompt: "An old Japanese ninja master delivers a powerful spinning kick to the person from the reference image. On impact, their glowing astral spirit-self is knocked out of their body Doctor-Strange style, and the ethereal spirit form drifts and tumbles through colorful mystical astral dimensions, cinematic slow motion, energy ripples, 8 seconds.",
  },
  {
    ad: "Wild Chase", rozet: "VIRAL", kredi: 28,
    aciklama: "Görseldeki kişi güzel bir doğada çalıların arasında koşar; kamera aşağıdan çeker, sonra yükselip yüzüne yaklaşır.",
    kat: "sinematik", kategoriler: ["KAÇIŞ", "SİNEMATİK", "VIRAL"], video: "wild-chase",
    veoPrompt: "The person from the reference image runs through tall bushes and lush green nature, low camera tracking near the ground following their legs, then the camera smoothly cranes upward and pushes in close toward their determined face, golden hour light through leaves, beautiful atmosphere, cinematic, 8 seconds.",
  },
  {
    ad: "City Titan", rozet: "VAYRA PRESET", kredi: 54, premium: true,
    aciklama: "Görseldeki kişi devasa boyutta şehri ezer; bir haber spikeri olayı sunar, herkes kaçar, sonra kamera yüzümüze yaklaşır.",
    kat: "sinematik", kategoriler: ["AKSİYON", "FANTASTİK", "VIRAL"], video: "city-titan",
    veoPrompt: "The person from the reference image is a colossal giant towering over a city, stomping and crushing buildings underfoot as tiny people flee screaming in the streets, a TV news broadcast overlay reporting the event, then the camera rises up and pushes in close to the giant's face looking down, epic disaster-movie scale, 8 seconds.",
  },
  {
    ad: "Zombie Escape", rozet: "VIRAL", kredi: 42,
    aciklama: "Görseldeki kişiyle birlikte bir zombi salgınından aksiyon dolu, koşarak kaçarız.",
    kat: "sinematik", kategoriler: ["KAÇIŞ", "AKSİYON", "VIRAL"], video: "zombie-escape",
    veoPrompt: "The person from the reference image sprints in desperate first-person-style action away from a horde of zombies through a ruined city street at dusk, looking back over their shoulder, debris and fire, hand-held shaky action camera chasing them, tense apocalyptic atmosphere, cinematic, 8 seconds.",
  },
  {
    ad: "Paparazzi Run", rozet: "VIRAL", kredi: 32,
    aciklama: "Görseldeki kişi havalimanında, üzerine üşüşen paparazzilerden havalı bir şekilde kaçmaya çalışır.",
    kat: "portre", kategoriler: ["KAÇIŞ", "VIRAL"], video: "paparazzi-run",
    veoPrompt: "The person from the reference image walks confidently and coolly through an airport terminal as a swarm of paparazzi with flashing cameras crowds around them, they lower sunglasses and stride past dodging the flashes, celebrity energy, camera flashes strobing, hand-held documentary feel, 8 seconds.",
  },
  {
    ad: "Slow-Mo Punch", rozet: "VIRAL", kredi: 42,
    aciklama: "Görseldeki kişi yüzüne bir yumruk yer ve an ağır çekime geçer — çarpma dalgası, ter damlaları, dinamik kamera.",
    kat: "sinematik", kategoriler: ["AKSİYON", "SİNEMATİK", "VIRAL"], video: "slow-mo-punch",
    veoPrompt: "The person from the reference image takes a heavy punch to the face and the moment drops into extreme slow motion, cheek and hair rippling from the impact shockwave, sweat and saliva droplets flying, dramatic camera pushing in around them, boxing-ring rim light, cinematic sports-drama intensity, 8 seconds.",
  },
];
