/**
 * Efekt presetleri — sinema efekt kütüphanesindeki gerçek kapak görselleriyle (public/gercek/sinema/ps-*.webp).
 * Örnek videoları henüz üretilmediği için kartta kapak görseli gösterilir; üretim akışı diğer presetlerle aynıdır:
 * kullanıcının fotoğrafı referans alınır, `veoPrompt` Veo 3.1'e 8 sn image-to-video tarifi olarak gider.
 */
import type { Preset } from "@/lib/presetVeri";

const k = (tohum: string) => `/gercek/sinema/${tohum}.webp`;

export const EFEKT_PRESETLERI: (Preset & { kapak: string })[] = [
  // ── Dönüşüm ──
  {
    ad: "Set on Fire", rozet: "VIRAL", kredi: 36, kapak: k("ps-fire"),
    aciklama: "Görseldeki kişi ya da nesne yavaşça alev alır; ateş vücudu sarar ama sakin kalır — sinematik, dramatik bir dönüşüm.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM", "FANTASTİK", "VIRAL"], video: "set-on-fire",
    veoPrompt: "The subject from the reference image stands calmly as realistic flames ignite at their feet and climb up their body, fire wrapping around them without harming them, embers and heat haze swirling, they look into the camera unbothered, slow push-in, dark background lit by the orange firelight, cinematic VFX, 8 seconds.",
  },
  {
    ad: "Disintegration", rozet: "VIRAL", kredi: 38, premium: true, kapak: k("ps-disint"),
    aciklama: "Kişi parçacıklara ayrılıp rüzgârla savrulur — ünlü 'toz olma' sahnesi, ağır çekimde.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM", "FANTASTİK", "SİNEMATİK"], video: "disintegration",
    veoPrompt: "The person from the reference image looks at their hands as their body starts to disintegrate into fine ash and glowing particles from the edges inward, the particles drifting away on the wind in slow motion until only a few floating specks remain, melancholic cinematic mood, shallow depth of field, 8 seconds.",
  },
  {
    ad: "Liquid Metal", rozet: "VIRAL", kredi: 36, kapak: k("ps-metal"),
    aciklama: "Cilt, yansımalı sıvı metale dönüşür; dalgalanan krom yüzey kameraya döner.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM", "FANTASTİK"], video: "liquid-metal",
    veoPrompt: "The subject from the reference image gradually transforms into flowing liquid chrome metal, a mirror-like wave spreading across the skin and clothes, reflections of the environment rippling over the surface, the metallic figure turns its head toward the camera, studio lighting with strong specular highlights, 8 seconds.",
  },
  {
    ad: "Melting", rozet: "VIRAL", kredi: 32, kapak: k("ps-melt"),
    aciklama: "Görsel, sıcak bir günde dondurma gibi yavaşça erir ve akar — gerçeküstü ve komik.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM", "VIRAL"], video: "melting",
    veoPrompt: "The subject from the reference image begins to slowly melt like wax in the sun, shapes softening and dripping downward into a glossy puddle while the background stays still, surreal and playful, warm light, smooth continuous motion, 8 seconds.",
  },
  {
    ad: "Glitch", rozet: "VIRAL", kredi: 26, kapak: k("ps-glitch"),
    aciklama: "Dijital bozulma: RGB kayması, satır kırılmaları ve piksel parçalanmasıyla kişi ekranda titrer.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM", "VIRAL"], video: "glitch",
    veoPrompt: "The person from the reference image poses while the video suffers intense digital glitches: RGB channel splitting, horizontal scanline tears, datamosh smears and pixel blocks, the subject flickers between frames, cyberpunk color palette, rhythmic glitch beats, 8 seconds.",
  },
  {
    ad: "X-Ray", rozet: "VIRAL", kredi: 28, kapak: k("ps-xray"),
    aciklama: "Tarama çizgisi üzerinden geçtikçe kişi röntgen görüntüsüne dönüşür; iskelet parlayarak ortaya çıkar.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM"], video: "x-ray",
    veoPrompt: "A bright scanning line sweeps across the person from the reference image and everything it passes turns into a glowing blue X-ray image revealing the skeleton beneath, the person moves naturally while the scan continues, medical-scan aesthetic, dark background, 8 seconds.",
  },
  {
    ad: "Garden Bloom", rozet: "VIRAL", kredi: 30, kapak: k("ps-gardenbloom"),
    aciklama: "Kişinin çevresinde ve kıyafetinde çiçekler hızla açar; sahne bir bahçeye dönüşür.",
    kat: "manzara", kategoriler: ["DÖNÜŞÜM", "FANTASTİK"], video: "garden-bloom",
    veoPrompt: "Around the person from the reference image, vines and colorful flowers rapidly sprout and bloom in time-lapse, climbing over the ground and their clothes until the whole scene becomes a lush blooming garden, petals floating, soft golden light, magical and uplifting, 8 seconds.",
  },
  {
    ad: "Low Poly", rozet: "VIRAL", kredi: 28, kapak: k("ps-polygon"),
    aciklama: "Kişi önce düşük poligonlu 3D modele ayrışır, sonra yeniden gerçeğe birleşir.",
    kat: "3d", kategoriler: ["DÖNÜŞÜM", "OYUN"], video: "low-poly",
    veoPrompt: "The person from the reference image breaks apart into a faceted low-poly 3D model with visible triangles, the camera orbits slightly as the polygons rotate and then reassemble back into the realistic person, clean studio background, video-game aesthetic, 8 seconds.",
  },
  {
    ad: "Lidar Scan", rozet: "VIRAL", kredi: 30, kapak: k("ps-pointcloud"),
    aciklama: "Sahne lidar nokta bulutuna dönüşür; kamera noktaların arasında süzülür.",
    kat: "soyut", kategoriler: ["DÖNÜŞÜM", "KAMERA HAREKETİ"], video: "lidar-scan",
    veoPrompt: "The scene from the reference image dissolves into a dense LiDAR point cloud made of glowing dots, the camera glides forward through the points while the subject remains recognizable as a 3D scan, sweeping scan rings, dark void background, futuristic, 8 seconds.",
  },
  // ── Fantastik ──
  {
    ad: "Levitation", rozet: "VIRAL", kredi: 30, kapak: k("ps-levit"),
    aciklama: "Kişi yavaşça yerden yükselir, kıyafeti ve saçı yerçekimsiz süzülür.",
    kat: "portre", kategoriler: ["FANTASTİK", "VIRAL"], video: "levitation",
    veoPrompt: "The person from the reference image slowly lifts off the ground and levitates in mid-air, hair and clothes floating as if gravity has vanished, small dust particles rising around them, calm serene expression, slow upward camera tilt, 8 seconds.",
  },
  {
    ad: "Portal", rozet: "VIRAL", kredi: 34, kapak: k("ps-portal"),
    aciklama: "Kişinin arkasında enerji portalı açılır; içine adım atıp kaybolur.",
    kat: "soyut", kategoriler: ["FANTASTİK", "KAÇIŞ"], video: "portal",
    veoPrompt: "A swirling energy portal opens behind the person from the reference image with crackling sparks, the person turns, steps toward it and walks through, disappearing as the portal collapses with a burst of light, cinematic sci-fi VFX, 8 seconds.",
  },
  {
    ad: "Medusa", rozet: "VIRAL", kredi: 36, premium: true, kapak: k("ps-medusa"),
    aciklama: "Saçlar canlı yılanlara dönüşür, gözler parlar — mitolojik Gorgon dönüşümü.",
    kat: "portre", kategoriler: ["FANTASTİK", "KORKU"], video: "medusa",
    veoPrompt: "The hair of the person from the reference image transforms into living, writhing snakes, the eyes begin to glow an eerie green and the skin gains subtle scales near the temples, they slowly raise their gaze to the camera, dark mythological atmosphere, 8 seconds.",
  },
  {
    ad: "Angel Wings", rozet: "VIRAL", kredi: 32, kapak: k("ps-angelwings"),
    aciklama: "Kişinin sırtından büyük beyaz kanatlar açılır; tüyler havada süzülür.",
    kat: "portre", kategoriler: ["FANTASTİK", "VIRAL"], video: "angel-wings",
    veoPrompt: "Large white feathered angel wings slowly unfold from the back of the person from the reference image, feathers drifting through the air, soft heavenly backlight and light rays, gentle upward camera move, serene and majestic, 8 seconds.",
  },
  {
    ad: "Thunder God", rozet: "VIRAL", kredi: 38, premium: true, kapak: k("ps-thundergod"),
    aciklama: "Gökyüzü kararır, şimşekler kişiye iner ve elektrikle dolar — destansı bir güç anı.",
    kat: "soyut", kategoriler: ["FANTASTİK", "AKSİYON"], video: "thunder-god",
    veoPrompt: "Dark storm clouds gather above the person from the reference image, lightning strikes down into them and blue electricity crackles across their body and eyes, wind whipping their hair, they raise their fist as thunder booms, epic low-angle camera, 8 seconds.",
  },
  // ── Korku ──
  {
    ad: "Vampire", rozet: "VIRAL", kredi: 32, kapak: k("ps-vampire"),
    aciklama: "Ten solar, gözler kızarır ve sivri dişler belirir — gotik vampir dönüşümü.",
    kat: "portre", kategoriler: ["KORKU", "DÖNÜŞÜM"], video: "vampire",
    veoPrompt: "The person from the reference image slowly transforms into a gothic vampire: skin turning pale, eyes shifting to deep red, sharp fangs appearing as they smile at the camera, candle-lit dark atmosphere, subtle fog, slow push-in, 8 seconds.",
  },
  {
    ad: "Devil", rozet: "VIRAL", kredi: 32, kapak: k("ps-devil"),
    aciklama: "Alnından boynuzlar çıkar, gözler alev rengine döner; arkada kızıl bir duman yükselir.",
    kat: "portre", kategoriler: ["KORKU", "DÖNÜŞÜM"], video: "devil",
    veoPrompt: "Horns slowly grow from the forehead of the person from the reference image, their eyes turn fiery orange and red smoke rises behind them, embers floating in the air, a confident smirk at the camera, dramatic red rim light, 8 seconds.",
  },
  {
    ad: "Mummy", rozet: "VIRAL", kredi: 30, kapak: k("ps-mummy"),
    aciklama: "Eski sargı bezleri kişiyi sarar; toz ve kum arasında mumya olarak uyanır.",
    kat: "portre", kategoriler: ["KORKU", "DÖNÜŞÜM"], video: "mummy",
    veoPrompt: "Ancient linen bandages wrap around the person from the reference image from feet to head while dust and sand swirl, the wrapped figure then slowly turns its head and opens its eyes, torch-lit Egyptian tomb atmosphere, 8 seconds.",
  },
  {
    ad: "Black Tears", rozet: "VIRAL", kredi: 28, kapak: k("ps-blacktears"),
    aciklama: "Gözlerden siyah gözyaşları süzülür; sessiz, ürkütücü bir yakın çekim.",
    kat: "portre", kategoriler: ["KORKU", "SİNEMATİK"], video: "black-tears",
    veoPrompt: "Extreme close-up of the person from the reference image as black ink-like tears slowly roll down their cheeks, they stare unblinking into the camera, subtle breathing, cold desaturated grading, quiet and unsettling, slow push-in, 8 seconds.",
  },
  {
    ad: "Tentacles", rozet: "VIRAL", kredi: 34, kapak: k("ps-tentacles"),
    aciklama: "Karanlıktan dokunaçlar uzanır ve kişiyi sarar — Lovecraft havasında bir sahne.",
    kat: "soyut", kategoriler: ["KORKU", "FANTASTİK"], video: "tentacles",
    veoPrompt: "Dark glossy tentacles emerge from the shadows around the person from the reference image and slowly coil around them, the person reacts with tension, murky green underwater-like lighting, cosmic horror mood, 8 seconds.",
  },
  // ── Viral ──
  {
    ad: "Money Rain", rozet: "VIRAL", kredi: 26, kapak: k("ps-money"),
    aciklama: "Gökten banknotlar yağar; kişi havaya para saçar — klip tadında, şımarık bir an.",
    kat: "portre", kategoriler: ["VIRAL"], video: "money-rain",
    veoPrompt: "Banknotes rain down from above around the person from the reference image, they throw a stack of cash into the air and smile at the camera as bills flutter in slow motion, music-video energy, flashy warm lighting, 8 seconds.",
  },
  {
    ad: "Clones", rozet: "VIRAL", kredi: 34, kapak: k("ps-clones"),
    aciklama: "Kişinin kopyaları sahnenin farklı yerlerinde belirir ve aynı anda poz verir.",
    kat: "portre", kategoriler: ["VIRAL", "DÖNÜŞÜM"], video: "clones",
    veoPrompt: "Several identical clones of the person from the reference image appear one by one across the scene, each doing a different pose, then all of them turn and look at the camera at the same time, playful, smooth camera pan, 8 seconds.",
  },
  {
    ad: "Clone Burst", rozet: "VIRAL", kredi: 36, kapak: k("ps-cloneexp"),
    aciklama: "Kişi bir anda onlarca kopyaya patlar ve kopyalar her yöne dağılır.",
    kat: "soyut", kategoriler: ["VIRAL", "AKSİYON"], video: "clone-burst",
    veoPrompt: "The person from the reference image suddenly bursts into dozens of identical copies that explode outward in every direction in slow motion, then the camera pulls back to reveal the chaotic crowd of clones, high-energy VFX, 8 seconds.",
  },
  {
    ad: "Rap Flex", rozet: "VIRAL", kredi: 26, kapak: k("ps-rapflex"),
    aciklama: "Balıkgözü yakın çekimde rap klibi pozları: el hareketleri, zincirler ve ritim.",
    kat: "portre", kategoriler: ["VIRAL"], video: "rap-flex",
    veoPrompt: "The person from the reference image performs confident rap-video gestures toward a fisheye lens, hands close to the camera, jewelry glinting, quick handheld movements synced to a beat, flashing colored lights, 8 seconds.",
  },
  {
    ad: "Scrapbook Collage", rozet: "VIRAL", kredi: 24, kapak: k("ps-collage"),
    aciklama: "Fotoğraf yırtık kâğıt parçalarıyla bir kolaj defterinde canlanır; parçalar tek tek yerine oturur.",
    kat: "soyut", kategoriler: ["VIRAL", "DÖNÜŞÜM"], video: "scrapbook-collage",
    veoPrompt: "The reference image becomes a handmade scrapbook collage: torn paper pieces, tape and stickers fly in and snap into place one by one around the subject, who then moves subtly inside the collage frame, stop-motion feel, paper texture, 8 seconds.",
  },
  // ── Aksiyon / Spor ──
  {
    ad: "Bullet Time", rozet: "VIRAL", kredi: 36, kapak: k("ps-bullet"),
    aciklama: "Zaman durur; kamera donmuş anın etrafında hızla döner, kurşunlar havada asılı kalır.",
    kat: "sinematik", kategoriler: ["AKSİYON", "KAMERA HAREKETİ"], video: "bullet-time",
    veoPrompt: "Time freezes around the person from the reference image mid-action, bullets and debris hang suspended in the air, the camera sweeps in a fast 180-degree arc around the frozen moment before time resumes, Matrix-style bullet time, 8 seconds.",
  },
  {
    ad: "Building Explosion", rozet: "VIRAL", kredi: 40, premium: true, kapak: k("ps-buildingexp"),
    aciklama: "Kişi kameraya yürürken arkasındaki bina patlar — dönüp bakmayan aksiyon kahramanı.",
    kat: "sinematik", kategoriler: ["AKSİYON", "SİNEMATİK"], video: "building-explosion",
    veoPrompt: "The person from the reference image walks calmly toward the camera as a building explodes behind them in a huge fireball, debris and smoke rolling outward, they don't look back, low-angle tracking shot, action-movie color grade, 8 seconds.",
  },
  {
    ad: "Pool Dive", rozet: "VIRAL", kredi: 30, kapak: k("ps-pool"),
    aciklama: "Kişi havuza atlar; kamera suyun altına geçip kabarcıkların içinden izler.",
    kat: "sinematik", kategoriler: ["SPOR", "SİNEMATİK"], video: "pool-dive",
    veoPrompt: "The person from the reference image dives into a bright blue swimming pool, the camera follows them below the surface as bubbles and light caustics swirl, they glide underwater toward the camera, summer vibe, 8 seconds.",
  },
  {
    ad: "Skate Run", rozet: "VIRAL", kredi: 30, kapak: k("ps-skate"),
    aciklama: "Kaykayla şehirde hızlı kayış ve bir trick; kamera alçaktan takip eder.",
    kat: "sinematik", kategoriler: ["SPOR", "AKSİYON"], video: "skate-run",
    veoPrompt: "The person from the reference image rides a skateboard down a city street, the camera tracks low to the ground beside them, they pop an ollie over a curb in slow motion and land smoothly, golden-hour street light, 8 seconds.",
  },
  {
    ad: "Slam Dunk", rozet: "VIRAL", kredi: 32, kapak: k("ps-basketball"),
    aciklama: "Kişi potaya koşar, havalanır ve smaç basar — ağır çekim ve kalabalık coşkusu.",
    kat: "sinematik", kategoriler: ["SPOR", "AKSİYON"], video: "slam-dunk",
    veoPrompt: "The person from the reference image sprints toward a basketball hoop, leaps high and slams the ball through the rim in dramatic slow motion, arena lights and cheering crowd, camera swinging under the hoop, 8 seconds.",
  },
  {
    ad: "Train Rush", rozet: "VIRAL", kredi: 30, kapak: k("ps-train"),
    aciklama: "Peronda duran kişinin önünden hızlı tren geçer; rüzgâr saçını ve kıyafetini savurur.",
    kat: "sinematik", kategoriler: ["SİNEMATİK"], video: "train-rush",
    veoPrompt: "The person from the reference image stands still on a platform as a high-speed train rushes past right in front of them, a powerful gust whipping their hair and clothes, motion blur streaks, they remain calm, cinematic wide shot, 8 seconds.",
  },
  {
    ad: "Sandstorm", rozet: "VIRAL", kredi: 32, kapak: k("ps-sandstorm"),
    aciklama: "Çölde dev bir kum fırtınası yaklaşır; kişi pelerini savrularak ona doğru yürür.",
    kat: "manzara", kategoriler: ["SİNEMATİK", "FANTASTİK"], video: "sandstorm",
    veoPrompt: "A massive sandstorm wall approaches across the desert behind the person from the reference image, their clothes and hair whipping in the wind, sand particles streaming past the camera, epic Dune-like scale, warm orange haze, 8 seconds.",
  },
  {
    ad: "Live Concert", rozet: "VIRAL", kredi: 32, kapak: k("ps-concert"),
    aciklama: "Kişi dev bir konser sahnesinde; ışıklar, konfeti ve kalabalık onun için.",
    kat: "sinematik", kategoriler: ["SİNEMATİK", "VIRAL"], video: "live-concert",
    veoPrompt: "The person from the reference image performs on a huge concert stage, colorful light beams and confetti sweeping over a cheering crowd, the camera cranes from the crowd up to the performer, stadium-show energy, 8 seconds.",
  },
  // ── Kamera hareketi ──
  {
    ad: "Eyes In", rozet: "VIRAL", kredi: 28, kapak: k("ps-eyes"),
    aciklama: "Kamera yüze doğru dalar ve gözbebeğinin içinden başka bir dünyaya geçer.",
    kat: "portre", kategoriler: ["KAMERA HAREKETİ", "VIRAL"], video: "eyes-in",
    veoPrompt: "The camera pushes rapidly toward the face of the person from the reference image and dives into the pupil of one eye, passing through the iris into a glowing abstract world, seamless continuous move, macro detail, 8 seconds.",
  },
  {
    ad: "Crash Zoom", rozet: "VIRAL", kredi: 24, kapak: k("ps-crashzoomin"),
    aciklama: "Ani ve sert bir zoom ile kişinin yüzüne kilitlenen dramatik kamera vuruşu.",
    kat: "sinematik", kategoriler: ["KAMERA HAREKETİ"], video: "crash-zoom",
    veoPrompt: "Starting wide, the camera performs a sudden aggressive crash zoom straight onto the face of the person from the reference image, slight motion blur and a punchy stop, they react with surprise, comedic dramatic timing, 8 seconds.",
  },
  {
    ad: "FPV Dive", rozet: "VIRAL", kredi: 34, kapak: k("ps-fpv"),
    aciklama: "FPV drone yüksekten dalış yapar, engellerin arasından geçip kişiye ulaşır.",
    kat: "manzara", kategoriler: ["KAMERA HAREKETİ", "AKSİYON"], video: "fpv-dive",
    veoPrompt: "An FPV drone shot starts high above the landscape, dives steeply and weaves fast between obstacles before swooping in and orbiting around the subject from the reference image, high speed, slight fisheye, 8 seconds.",
  },
  {
    ad: "Vertigo", rozet: "VIRAL", kredi: 28, kapak: k("ps-dollyzoomin"),
    aciklama: "Dolly zoom: kişi sabit kalırken arka plan esner — Hitchcock'un baş döndüren efekti.",
    kat: "sinematik", kategoriler: ["KAMERA HAREKETİ", "SİNEMATİK"], video: "vertigo",
    veoPrompt: "A classic dolly zoom on the person from the reference image: the subject stays the same size in frame while the background dramatically stretches away behind them, creating a vertigo effect, tense expression, cinematic lighting, 8 seconds.",
  },
  {
    ad: "Snorricam", rozet: "VIRAL", kredi: 28, kapak: k("ps-snorricam"),
    aciklama: "Kamera kişinin gövdesine sabitlenmiş gibi; o yürürken dünya etrafında sallanır.",
    kat: "sinematik", kategoriler: ["KAMERA HAREKETİ"], video: "snorricam",
    veoPrompt: "Snorricam shot with the camera rigidly mounted facing the person from the reference image, their face locked in the center of the frame while they walk and the world sways and bounces chaotically behind them, intense dreamlike energy, 8 seconds.",
  },
  {
    ad: "Hyperlapse", rozet: "VIRAL", kredi: 30, kapak: k("ps-hyper"),
    aciklama: "Şehirde hızlandırılmış ileri hareket; ışıklar çizgiye dönüşür, kişi merkezde sabit kalır.",
    kat: "manzara", kategoriler: ["KAMERA HAREKETİ", "SİNEMATİK"], video: "hyperlapse",
    veoPrompt: "A fast forward-moving hyperlapse through a city at night, lights streaking into lines and traffic blurring, arriving at the person from the reference image who stands still in the center of the frame as the world rushes around them, 8 seconds.",
  },
  {
    ad: "Turntable 3D", rozet: "VIRAL", kredi: 26, kapak: k("ps-3drotation"),
    aciklama: "Kişi ya da ürün döner bir platformda 3D model gibi sergilenir.",
    kat: "3d", kategoriler: ["KAMERA HAREKETİ", "DÖNÜŞÜM"], video: "turntable-3d",
    veoPrompt: "The subject from the reference image is shown as a polished 3D figure on a slowly rotating turntable, the camera holds steady as it turns a full 360 degrees, soft studio lighting with a clean gradient background, product-render quality, 8 seconds.",
  },
  {
    ad: "Product Hero", rozet: "VIRAL", kredi: 26, kapak: k("ps-product"),
    aciklama: "Ürün fotoğrafı reklam filmi gibi canlanır: ışık süpürmesi, yavaş dönüş ve odak geçişi.",
    kat: "urun", kategoriler: ["KAMERA HAREKETİ", "SİNEMATİK"], video: "product-hero",
    veoPrompt: "Premium product commercial shot of the item from the reference image, a slow orbiting camera with a light sweep gliding across its surface, subtle rack focus and floating particles, glossy reflections on a dark studio floor, 8 seconds.",
  },
];
