# HIGGSFIELD SPESİFİKASYONU — Birebir Yeniden Yapım Referansı

> Kaynak: `~/Desktop/higgsifeld-yeni-detayli` içindeki **496 gerçek ekran görüntüsü** (higgsfield.ai canlı ürün).
> Bu doküman **anayasadır**. Bir sayfa yazmadan önce buradaki ilgili bölüme bak. Tahminle yazma.
>
> **Renk istisnası:** Higgsfield lime `#D4F44E` kullanır. Biz **Vayra cyan `#22d3ee`** kullanırız.
> Aşağıda "LIME" geçen her yerde → **cyan** uygula. Başka hiçbir şeyi değiştirme.
> Dil: **Türkçe**. Yapı: **%100 birebir**.

---

## 0. TASARIM TOKENLARI (ekran görüntülerinden ölçülmüş)

| Rol | Higgsfield | Bizde |
|---|---|---|
| Sayfa zemini | `#0A0A0B` | aynı |
| Panel/kart yüzeyi | `#141416` | aynı |
| İkincil yüzey (çip) | `#1B1B1E` / `#232326` | aynı |
| Kenarlık | `#26262A` — hairline `rgba(255,255,255,.06–.08)` | aynı |
| Menü/popover yüzeyi | `#1C1C1F`, kenar `#2E2E33`, güçlü gölge | aynı |
| Birincil metin | `#EDEDF0` | aynı |
| İkincil metin | `#9A9AA1` | aynı |
| Üçüncül / placeholder | `#6E6E73` | aynı |
| **AKSAN** | lime `#D4F44E` | **cyan `#22d3ee`** |
| İndirim rozeti | fuşya `#FF2D6F` | aynı (fuşya kalsın) |
| Yıkıcı (Sil) | kırmızı `#FF453A` | aynı |

**Yarıçaplar:** çip/pill `999px` · buton `10–12px` · kart `14px` · composer `18px` · menü `14px` · medya `10–12px`
**Aksan kullanımı ÇOK CİMRİ:** yalnızca birincil CTA, aktif nav göstergesi, logo, avatar halkası, "Yeni" rozeti. Başka hiçbir yerde.

### İmza CTA butonu (Generate)
Dolgu: aksan rengi, hafif dikey gradyan. Metin: **siyah** `#101010`, 600–700, ~15px.
Alt kenarda **3-4px daha koyu bir dudak** (bevel/3D his). Yarıçap ~10-12px.
İçerik: `Üret ✦ 7` — 4 uçlu yıldız glifi + kredi sayısı satır içi.

### Tipografi
- Gövde/nav: Inter benzeri grotesk, **sentence case**, 13–15px.
- **Başlıklar: BÜYÜK HARF, ağır (800–900), sıkışık grotesk, dar harf aralığı.**
  Örn: `AHMET TALHA, WHAT ARE WE CREATING TODAY?` / `EXPLORE SKILLS` / `HIGGSFIELD MCP FOR ANY AI`
- Bölüm başlıkları: BÜYÜK HARF, 700-800, ~20px (`EXPLORE WEBSITES BY COMMUNITY`).
- Alt-etiket: BÜYÜK HARF, ~11px, harf aralığı geniş, sönük (`HOT RIGHT NOW`).

---

## 1. ÜÇ FARKLI KABUK (kritik — şu an bizde yanlış)

Higgsfield **tek bir sidebar kullanmaz**. Üç ayrı kabuk vardır:

### Kabuk A — `/ai/*` + `/explore` (Görsel, Video, Ses)
**Sol sidebar YOKTUR.** Sadece üstte tek satır yatay nav (~48px, `#0B0B0C`, alt hairline):
```
[logo] Explore │ Image  Video  Audio │ ⊞Supercomputer[Yeni]  MCP&CLI[Yeni]  Cinema Studio  Plugins[Yeni]  Marketing Studio  Shorts Studio[Yeni]
                                            sağ: 🔍  🚀Upgrade[%30 İNDİRİM]  📁Assets  │  🔔  (avatar, aksan halkalı)
```
- Aktif öğe: beyaz metin + küçük aksan alt çizgi. Pasif: `#8E8E95`.
- "Yeni" rozeti: aksan dolgu, siyah metin, ~10px, küçük yuvarlak dikdörtgen.
- "%30 İNDİRİM" rozeti: **fuşya** `#FF2D6F`, Upgrade'in ALT kenarına sarkar.

### Kabuk B — `/supercomputer/*`
**Üst nav YOKTUR.** Sadece ~200px sol sidebar (`#0E0E10`), ana alan biraz açık zeminde yuvarlak köşeli panel:
```
[aksan logo] Supercomputer ⌄            [panel-daralt]
( + Yeni sohbet )        ← full width, pill, #1D1D20
  🔍 Search
  Products                            ⌄
    ⊞ Apps            [Win $100k]  ← aksan rozet
    ◍ Websites
    ⬡ Games
  Customize                           ⌄
    👤 AI Employees
    ✦ Skills
    ⚯ Connectors
    ⓘ Memory
  Chats                               ⌄
    (boş durum: gri kare + ⊕ · "No tasks yet" / "Create one to get started")
    veya sohbet satırları — hover'da ⋮ → [Edit / Pin / ─── / Delete(kırmızı)]
  ─────────────────────────
  🏷 Pricing  [%30 İNDİRİM]  ← fuşya
  (avatar) kullanıcıadı…
```
- Aktif satır: dolu yuvarlak dikdörtgen `#1E1E20`, yarıçap 10px.
- Grup başlıkları: 12px, `#6E6E73`, yanında daraltma chevron'u.

### Kabuk C — Cinema Studio (`/generate`) + Marketing Studio
**Üst nav VAR** + kendi ~215px sol sidebar'ı:
```
[aksan ikon] Cinema Studio        [panel-daralt]
  🏠 Home              ← aktif: dolu pill #1E1E1E
  ▦ My generations
  ◈ My elements
  ♡ My favorites
  ⊕ Community
  Projects            🔍  ⇅
  ⊕ New project
  ◈ First project
```

---

## 2. EKRAN EKRAN SPESİFİKASYON

### 2.1 `/ai/image` — Görsel Stüdyosu
- **Kabuk A.** Nav'ın hemen altında ince bir **küçük-resim boyut kaydırıcısı** (sağ 1/3'te, 1px iz, beyaz nokta tutamak).
- **Ana alan: kenardan kenara justified/masonry medya ızgarası.** Kart yok, kenarlık yok, başlık yok — **görseller sayfanın kendisi**. Boşluk 2–4px, yarıçap ~0–4px.
- Şeffaf PNG'ler **açık gri damalı (checkerboard) zemin** üzerinde gösterilir.
- Karta hover: sol üstte **daire seçim kutusu** belirir; sağ kenarda dikey yuvarlak buton rayı (kalp, indir, kopyala, ⋯).
- **Yüzen alt prompt dock** (~1030px, `#1C1C1E`, yarıçap 24–28px, gölge), iki satır:
  - Satır 1: yuvarlak `+` medya ekle · prompt metni · sağda büyük aksan **`Üret ✦ 1`**
  - Satır 2 (çipler, pill, `#2C2C2E`, ~34px): `📊 Seedream 5.0 lite ›` · `♦ 4K` · `▢ 1:1` · stepper `− 1/4 +` · `Unlimited [toggle]`

### 2.2 `/ai/video` — Video Stüdyosu
**Kabuk A** + **üç sütun**:

**SOL PANEL (~290px, `#0F0F10`):**
- Sekmeler: `Video Üret` (aktif, aksan alt çizgi) · `Video Düzenle` · `Hareket Kontrolü`
- **Preset kartı** (~265×105, yarıçap 12): fotoğraf zemin, üstünde BÜYÜK HARF aksan-konturlu `GENEL`, alt etiket `Kling 3.0`, sağ üstte küçük `✎ Değiştir` pill'i.
- 2'li satır: sol = yüklenen başlangıç karesi (kare, yarıçap 10, beyaz kenar) · sağ = `Son kare` kesikli placeholder + sağ üstte `Opsiyonel` çipi.
- Prompt bloğu (`#131315`): `Çok çekimli` + ⓘ + iOS-tarzı **toggle** · textarea · alt satırda 3 küçük çip: `✨ İyileştir açık` · `🔇 Kapalı` · `@ Element`
- `Model` satırı: küçük gri etiket + değer `Kling 3.0` + sağda `›`
- İki yarım çip: `🕐 4sn` · `◆ 1080p`
- Alt: full-width aksan **`Üret ✦ 7`**

**ORTA (~600px):** üstte segment `📁 Geçmiş` (aktif) / `▭ Nasıl çalışır` · sağda genişlet ikonu + zoom kaydırıcı + `Liste`/`Izgara` toggle. Altında üretim akışı kartları: sol üstte seçim kutusu, büyük medya + ortada play, medyanın sağ kenarında dikey yuvarlak buton rayı, sağ altta `🎤 Sesi değiştir ⌄` pill'i.

**SAĞ META (~230px, kart başına):** model çipi `Kling 3.0` · prompt metni · kaynak küçük resim · meta çipler `1080p` `4.0s` `1:1` · aksiyon satırı `↺ Yinele` + kopyala + çöp.

> **NOT — bizde eksik:** Referansta preset seçiciye basınca sağ alan **devasa masonry preset duvarına** dönüşür (PUSH TO GLASS, JIB UP, DUTCH ANGLE, SOUL JUMP… her biri video önizlemeli kart, altta `Load more`). Bizde bu yok.

**Öğe `⋯` menüsü** (yarıçap 14, `#1B1B1F`, 46px satır, 3 blok):
`Virality Predictor [Yeni]` · `Translate` · `Change Voice` · `Open` · `Regenerate` · `Reuse`
─── `Like` · `Share ›` · `Add to folder ›` · `Publish`
─── `Download` · `Delete` (kırmızı)

### 2.3 `/audio` — Ses Stüdyosu
- Nav'da `Audio` aktif — **aksan konturlu pill** (alt çizgi değil!).
- Sol ince ikon rayı (~56px): panel-daralt, üretimlerim (aktif), proje ikonu, altta yuvarlak `+`.
- Başlık satırı: `Tümü` (seçili pill) · `♡ Beğenilen` · sağda kaydırıcı + liste/ızgara ikonları.
- **Boş durum kahramanı:** ortada aksan-gri BÜYÜK HARF `SES` etiketi, iki yanında ince çentik çizgileri; altında gradyan metinli iki satır başlık (pembe→lavanta→krem). Zeminde yumuşak radyal pembe/mor parıltı. Sayfanın altında dekoratif **ekolayzır çubukları**.
- **Skeuomorfik "boombox" composer** (~830px, yarıçap 18): SOL = yarım daire **kadran** (aksan iğneli), yanında 3 mod: `Seslendirme` · `Sesi Değiştir` (aktif: kenarlıklı pill + aksan nokta) · `Çeviri`. ORTA = önizleme paneli (krom yıldız). SAĞ = kaset-tarzı `Ses Preseti` modülü — değer **LED/piksel fontla** `TALLULAH` + animasyonlu LED ekolayzır şeridi; altında aksan `ÜRET ✦1`.

### 2.4 `/supercomputer` — ana sohbet ekranı
**Kabuk B.** Ana alan ortalanmış:
1. Aksan yuvarlak-kare logo (~44px, yarıçap 12, siyah glif, hafif 3D bevel)
2. **BÜYÜK HARF kişiselleştirilmiş başlık:** `AYŞEGÜL, BUGÜN NE ÜRETİYORUZ?` (~26-40px, 800 ağırlık)
3. **Composer** (yarıçap 18, `#191A1C`, kenar `#2A2B2E`): placeholder `Oluştur`; alt satır → yuvarlak `+` · `✨ Akıllı mod ⌄` · sağda `Sor ⌄` + **aksan yuvarlak gönder butonu** (↑, siyah ok)
   - `Sor ⌄` dropdown'ı: `Onaysız otomatik çalıştır` / `Üretimden önce onayla` ✓
4. **Hızlı eylem çipleri** (pill, ~36px): `$ Pazarlama yürüt` · `Uygulamalar [Yarışma]` · `🎨 Tasarım oluştur` · `🎮 Oyunlar` · `Vayra MCP`
5. Bölüm: `SUPERCOMPUTER NELER YAPABİLİR` + carousel noktaları → 3 kart (görsel + alt bilgi + aksan `✦ Dene` pill'i)

**Sohbet akışı (üretim sırasında):** kullanıcı mesajı sağa yaslı balon (`#1F1F22`, yarıçap 18). Ajan durumu: **spinner değil**, `4sn'dir çalışıyor` metni + geçen süre üzerinde **shimmer** + `• Düşünüyor` satırı, chevron ile açılır düşünce izi. Gönder butonu **stop (kare) butonuna dönüşür**, rengi aksan kalır. Sidebar'daki sohbet satırında aksan nokta-ızgara "çalışıyor" göstergesi. Composer altında ortalı: `LLM'ler hata yapabilir ve çağrılar kredi harcar`.
Üst sağ aksiyonlar: `Kullanım` · `Zamanlanmış` · `Galeri` · beyaz pill `Paylaş`.

### 2.5 `/supercomputer/skills`
Başlık `Beceriler` · ortada segment `Keşfet`(aktif beyaz pill) / `Becerilerim` · sağda aksan pill `+ Yeni beceri`.
**Hero:** solda BÜYÜK HARF `BECERİLERİ KEŞFET` + 3 madde + aksan CTA `✦ Sohbette oluştur`; sağda sahte **macOS pencere** mockup'ı (trafik ışığı noktaları) — ajan aktivite akışı, üzerinde yüzen etiket pill'leri.
Filtre satırı: arama input'u + yatay kaydırılan kategori çipleri (`Tümü` aktif beyaz pill, `İletişim`, `İçerik Üretimi`, …).
**Beceri kartları:** 3 sütun, ~16:10, renkli bulanık mesh gradyan artwork, ortada büyük beceri adı, alt şeritte ad + doğrulama rozeti + sağda yuvarlak `+` (kur) / `✓` (kurulu).

### 2.6 `/supercomputer/employees` + `/create-employees`
Hero: BÜYÜK HARF `AI ÇALIŞANLARI KEŞFET`, `Her çalışan şunlarla gelir:` + 3 madde (Hafıza / Beceriler / Bağlayıcılar), aksan CTA.
Sağda **3D asılı kimlik kartı (lanyard) render'ı** — koyu plastik kart, ipten sarkan, içinde parlayan aksan tel-kafes insan büstü.
Kartlar: sahip olunanlar ✔ rozetli ve Install butonu YOK; olmayanlar sağda `Kur` pill'i.
`/create-employees`: BÜYÜK HARF `KENDİ AI ÇALIŞANINI OLUŞTUR` + pill composer (`+` butonunda **aksan halka**, gönder butonu metin yokken gri/pasif) + 4 öneri çipi (`UGC Creator`, `Researcher`, `Game Developer`, `Personal Manager`). Çip hover: dolu koyu pill + metin beyazlaşır.

### 2.7 `/supercomputer/memory`
Başlık `Hafıza` · sağda aksan pill `İçe aktar`.
**Full-bleed tuval**, hafif noktalı ızgara dokusu. Merkezde **parlayan aksan küre** (~60px, radyal gradyan + dış parıltı); ince çizgilerle dışa uzanan küçük yuvarlak-kare düğüm çipleri (klasör, `[ ]`, beyin, kalp, kamera ikonları). Daha dışta **hayalet/bulanık placeholder pill'leri**.
Merkez üstünde başlık yığını: `Supercomputer hafızası` / `Her sohbetten öğreniyor`.
Düğüme hover → dalın ucunda yuvarlak `+` ve `Hafıza ekle` etiketi belirir.
Altta ortalı yüzen pill input: `+` · `Bir hafıza ekle` · aksan `↑`.

### 2.8 `/supercomputer/connectors`
Başlık + segment (`Keşfet` / `Bağlayıcılarım`) + aksan `+ Özel MCP`.
Hero: BÜYÜK HARF `UYGULAMALARINI SUPERCOMPUTER'A BAĞLA` + 3 madde; sağda **yeşil tel-kafes ızgara tüneli** illüstrasyonu + radyal parıltı + yüzen uygulama karoları.
Ortada arama input'u. Kategori bölümleri (`İLETİŞİM`, `SOSYAL MEDYA & YAYIN` — BÜYÜK HARF başlık) → **3 sütun bağlayıcı kartları**: sol 32px yuvarlak ikon, başlık + tek satır kısaltılmış açıklama, sağda yuvarlak `+`.

### 2.9 `/supercomputer/websites` + `/gaming` + `/apps`
- **Websites:** `TOPLULUK WEB SİTELERİNİ KEŞFET` + arama; masonry-ish kart ızgarası (satır 1 = 3 eşit, satır 2 = 2 geniş). Kart hover: hafif aydınlanma + sağ altta aksan `Aç` pill'i + küçük resmin sağ üstünde cam `⋮` butonu. İstatistik satırı: `15.3K görüntülenme · 31.3K kredi`.
- **Gaming:** BÜYÜK HARF `AYŞEGÜL, DAKİKALAR İÇİNDE KENDİ OYUNUNU YAP`. Composer'ın **İÇİNDE üstte tür seçici carousel** (3D karakter render'ları + etiket: Shooter, Platformer, Novella, Hypercasual, Racing, Horror). Seçilince alt araç çubuğuna **silinebilir çip** (`Shooter ✕`) eklenir. Diğer çipler: `Fable 5`, `Stil`, `Ortam`, `Çok oyunculu` toggle. Altında `EXPLORE GAMES BY COMMUNITY 50` + `HOT RIGHT NOW` + sıra numaralı büyük oyun kartları.
- **Apps (yarışma):** segment `Keşfet` / `Ödüller & Şartlar` / `Uygulamalarım`. Ödüller sekmesi: uzun metin + **SSS akordiyonu** (`+` / `−` glifleriyle, chevron DEĞİL).

### 2.10 `/mcp` ve `/cli`
Sidebar YOK, sadece üst nav. Hero: **7 üst üste binmiş yuvarlak uygulama karosu yelpazesi** (ortadaki aksan karo ~1.35× büyük, öne çıkmış, güçlü gölge — hafif döndürülmüş komşular). BÜYÜK HARF başlık `VAYRA MCP FOR ANY AI`.
**Kurulum kartı** (~1110px, yarıçap 16-20): başlıkta **iki segment kontrolü** — sol `MCP | CLI | Skill`, sağ `Claude | ChatGPT | Cursor | OpenClaw | Hermes` (aktif = beyaz pill). 3×5 = 15 kombinasyon, her biri farklı 3 adımlı içerik.
İçerik: numaralı 3 adım (daire numara `#2A2A2E`), her adımda başlık + açıklama + **aksan renkli kopyalanabilir komut çipi** (sonunda kopyala ikonu).

### 2.11 `/generate` — Cinema Studio
**Kabuk C.** Ana alan ortalanmış (max ~1120px):
- Üstte **3 üst üste binmiş, hafif eğik sinematik film karesi** kolajı.
- İki satır BÜYÜK HARF başlık: satır 1 beyaz, **satır 2 aksan renkli**.
- 3 ayar çipi: `Tür: Genel` · `Stil: Oto` · `Kamera: Oto` (gri anahtar + beyaz değer).
- **Composer:** yuvarlak `#141414` panel; **solunda dikey mod rayı** (iki 56×56 yuvarlak kare: `Görsel` / `Video`, seçili olan açık); büyük tek satır textarea; sağda aksan `ÜRET` butonu (BÜYÜK HARF, harf aralıklı, kredi fiyatı **üstü çizili eski fiyatla**: ~~96~~ 80); altta hayalet çip araç çubuğu: `+`, `@`, model adı, en-boy, çözünürlük, süre, stepper, ses toggle.
- Altında `Projelerim` bölümü — 3 kart (biri 1+4 foto mozaiği).
- **Filter/View dropdown'ı:** `Tür: Tümü ✓ / Görsel / Video` — `Aktivite: Beğenilen / İndirilen / Görülmeyen`.
- Altta yüzen prompt bar: `Hayal ettiğin sahneyi anlat…` + aksan yuvarlak ✦ butonu.

### 2.12 `/apps/*` — Uygulama sayfaları (örn. transitions)
Sol: BÜYÜK HARF başlık + açıklama + **sihirbaz kutuları** (örn. 3 kutu: `Başlangıç Karesi` / `Geçiş Ekle` / `Son Kare`, her biri ikon + başlık + `Görsel veya video ekle. (5sn. maks)`), ortadaki kutuda süre segmenti `5s | 10s`; altta full-width aksan `Video Üret ✦ 6`.
Sağ: büyük örnek çıktı görseli.
Aşağıda: `Key Features` pill'i + BÜYÜK HARF bölüm başlığı + özellik bölümleri.

### 2.13 Üretim detay / lightbox
Tam ekran medya. Sağda dikey yuvarlak aksiyon butonları (kalp, indir, kopyala, ⋯). Altta yuvarlak dönüşüm butonları (görsele çevir / videoya çevir / 3D).

### 2.14 `/explore` — Topluluk
Masonry kart ızgarası. Her kart: sol üstte **yazar avatarı + kullanıcı adı**, sağ üstte **cam `♡ 101` pill'i**. Hover'da oynatma.

---

### 2.15 `/marketing-studio/product` + `/app` — Pazarlama Stüdyosu
**Kendi sol sidebar'ı** (~185px): çalışma alanı seçici · `Ana Sayfa` · `Tüm üretimler` · `Favorilerim` · grup `Araçlar` → `URL'den Reklam`, `Reklam Referansı` · grup `Projeler` → `+ Yeni proje`, proje satırları, `Yeni klasör`.
Sidebar ikonları **renkli yuvarlak kareler** (~22px, r=6) — Higgsfield'ın tek renkli-ikon kullandığı yer.
**Zemin: yeşil/zeytin radyal gradyan + grafik-kağıdı ızgarası** (ürünün tek renkli tuvali — diğer tüm sayfalar saf koyu).
Ortada BÜYÜK HARF eyebrow `PAZARLAMA STÜDYOSU` + iki satır dev başlık `TÜM ÜRÜNLERİ / VİDEO REKLAMA DÖNÜŞTÜR`.
**Composer:** solunda **ayrık dikey mod rayı** (yüzen pill, `Ürün` / `Uygulama`); içinde `+` · `Avatar: Emma` çipi (satır içi 24px yuvarlak foto) · prompt; alt satırda dropdown pill'leri `UGC ⌄` `Kanca ⌄` `Ortam ⌄` + sliders ikon butonu; sağ uçta **iki küçük resim yuvası** — `+` (altında `ÜRÜN` etiketi) ve avatar fotoğrafı (altında `AVATAR`); en sağda büyük aksan `ÜRET ✦ ~~60~~ 50`.
Sliders butonu → popover: `En-boy oranı 9:16 ›` · `Kalite 720p ›` · `Süre 10s ›`.
Composer'ın sağ üst köşesinde **animasyonlu ışık yayı** (shimmer kenarlık).
Altında filtre segmenti `Tümü`(beyaz pill) `TikTok [YENİ]` `UGC` `Reklam` + şablon galerisi (3'lü 9:16 küçük resim grupları + aksan `Dene` butonu).
Boş durum: üst üste binmiş 3 hayalet kart + `Favori reklamlarını tek yerde tut`.

### 2.16 `/plugins/*` — Eklenti sayfaları (Photoshop, Premiere Pro, DaVinci, After Effects, Minecraft)
**DİKKAT: Bu sayfaların gövdesi AÇIK TEMALI (beyaz #FFFFFF).** Üst nav koyu kalır, gövde beyaza geçer — ayraç çizgi yok.
- Hero: ürün banner'ı / video.
- `ÜÇ ADIMDA BAŞLA` — ortada BÜYÜK HARF başlık + **işletim sistemi segmenti** (`macOS` / `Windows`) + 3 sütun kart. Kartlar: açık gri yuvarlak panel (~390×390, r=20-24), içinde kesikli bırakma alanı + 3D skeuomorfik illüstrasyon + karikatür el imleci. Başlık ve metin **kartın ALTINDA** (panelin dışında).
- Özellik blokları: dönüşümlü açık/koyu tam-genişlik bölümler, 50/50 split (solda mockup kartı, sağda BÜYÜK HARF başlık + paragraf). Örn. `REFRAME`, `ARKA PLANI KALDIR`.
- **`PLANINI SEÇ` fiyatlandırma bölümü** (koyu panel, r=24): `Aylık`/`Yıllık` pill toggle + fuşya `%30 İNDİRİM`; **4 plan kartı**. ULTRA ve Ekip kartları **yukarı taşar** ve üstlerinde renkli **kurdele** taşır (`◈ EN POPÜLER` fuşya, `◈ EN İYİ DEĞER` mavi). Kart anatomisi: plan adı + indirim rozeti + model rozeti · tek satır açıklama · **kredi kutusu** (r=12): `1.000 kredi/ay` + iki denklik satırı + ya `Sabit 1.000 kredi/ay` kilitli çipi ya da **kredi kaydırıcısı** (tick etiketleri 3.000/6.000/9.000, `<>` glifli kare tutamak) · fiyat satırı (üstü çizili eski fiyat + büyük yeni fiyat) · CTA (`Yükselt` / `Düşür` / `Taahhüdü değiştir`) · tasarruf notu · ✓ özellik listesi (ⓘ tooltip'li).
- Ekip kartında **koltuk sayacı**: `− 2 koltuk +`.

### 2.17 `/ai-influencer-studio`
Üç sütun. **SOL RAY (~150px):** `AI Influencer Studio` pill'i + dikey kart yığını (`Yeni oluştur` kesikli + `+`, sonra karakter küçük resimleri, adı sol altta). Altta aksan promo kartı: `AI INFLUENCER'INLA 3.500$'A KADAR KAZAN` + beyaz `Daha fazla` pill'i.
**ORTA:** büyük dikey (3:5) önizleme paneli (r=16). Boş durum: ortada daire içinde görsel ikonu + 3 satır sönük metin; panelin altında seçim özet çipleri (2 satır + `daha fazla göster` çipi). Panelin altında: kare **karıştır** butonu + geniş aksan `Influencer Üret ✦ 2`.
Üretim sonrası: medyanın sağ üstünde dikey yuvarlak butonlar (kalp/indir/⋯), altta 4 yuvarlak eylem butonu (yenile-beyaz, değnek-aksan, kamera-aksan, kaydet-beyaz), en altta prompt bar `Karakteri özelleştirmek için yaz` + aksan `DÜZENLE ✦ 2`.
**SAĞ PANEL (~400px):** `Kurucu` sekmesi + `Sıfırla`. Akordiyon bölümleri: her biri ikon + başlık + `• N` sayacı + chevron; altında **3 sütun görsel seçenek kartları** (~118×115, r=10). Seçili kart: **2px aksan kenarlık + aksan yuvarlak ✓ rozeti**. Bölümler: Karakter Tipi (13 kart: Human, Ant, Bee, Octopus, Crocodile, Iguana, Lizard…), Göz Rengi, Ten Rengi, Saç, Kıyafet…
**Özel renk seçici popover:** doygunluk/değer karesi + gökkuşağı hue şeridi + `İptal` / `Uygula` (hex input YOK, damlalık YOK).

### 2.18 `/shorts-studio`
**SOL PANEL (~305px, r=16):** aksan BÜYÜK HARF `SHORTS STÜDYOSU` · 9:16 video önizleme (r=12, altyazı gömülü) · yükleme bırakma alanı (`Düzenlenecek video yükle` / `Maks. süre: 2 dk`) · `Algılanan dil: Otomatik` · `Çıktı oranı:` + segment (`Dikey` / `Yatay`) · full-width aksan `Üret ✦` · ortada altı çizili `Hesaplama nasıl çalışır? (?)`.
**ANA:** sekme kapsülü (`Presetler` / `Geçmiş` / `Nasıl çalışır`) + sağda arama. **5 sütun 9:16 preset kartı** (r=10, adı sol altta gradyan scrim üstünde). Seçili kart: **2px aksan kontur + parıltı + video oynar** (komşular durağan).

### 2.19 `/explainer`
**SOL PANEL (~305px, r=16):** aksan BÜYÜK HARF `VAYRA EXPLAINER` · preset önizleme kartı (sağ üstte cam `Değiştir ✎` pill'i, sol altta preset adı) · textarea kartı (`Video neyi anlatsın?` etiketi + `Bir konu yaz ya da aşağıdan dosya ekle`) + alt satırda `+ Dosya ekle` ve `🔗 Bağlantı` pill'leri (Bağlantı'ya basınca **satır içi URL girişi** açılır: input + aksan `Ekle` + `✕`) · 2'li dropdown (`En-boy 16:9` · `Süre 1dk`) · `Ses: Cillian` · full-width aksan `Üret ✦ ~200` (**metin yokken soluk zeytin/desatüre — doygunluk = etkin durum kodu**) · `Hesaplama nasıl çalışır?`.
**ANA:** sekme kapsülü (`Presetler` / `Geçmiş` / `Nasıl çalışır`) + büyük vitrin kartı (r=20): **coverflow preset destesi** (3×3 ızgara, odaktaki hariç hepsi bulanık) + aksan kicker `NASIL ÇALIŞIR` + BÜYÜK HARF `PRESET SEÇ` + carousel kontrolleri (‹ › + **mini küçük resim noktaları**).

### 2.20 `/canvas` + `/canvas/templates/:id` — Sonsuz Tuval
**Hub:** hero = node-graph mockup'ı (lacivert gradyan, bezier tel bağlantılar, seçili metin düğümü mavi köşe tutamaklı, **yüzen işbirlikçi imleçleri** — `Gloria — That's cool!`, `Mito`). Altında segment `Tüm Tuvaller` │ `Şablonlar [Hızlı Başlangıç]` + arama. Proje karoları (`+ Yeni tuval` + mevcut projeler, `8dk önce düzenlendi`).
**Editör:** **global nav YOK.** Sol üstte yüzen: logo + doküman başlığı çipi (chevron'lu). Tam ekran sonsuz tuval: prompt yapışkan notları → görsel düğümleri → **bezier tellerle** video/sahne düğümlerine dallanır, her birinin altında altyazı kartı. Düğüm kenarlarında **yuvarlak portlar**.
Sol altta zoom kümesi: `−` `%31` `+` + sığdır ikonu + ızgara ikonu.
Şablon modunda altta ortalı cam CTA bar: `Bu tuvali projelerine ekle!` + beyaz `Ekle` pill'i.

### 2.21 `/asset/*` — Varlık Kitaplığı
**Sol sidebar (~180px):** arama input'u · `Tüm Varlıklar 432` (aktif dolu) · `Favoriler 0` · grup `Araçlar` → `Görsel 408`, `Video 24`, `Ses 20` (her biri **rota tabanlı filtre**) · daraltılabilir çalışma alanı grubu + `+` · mavi klasör satırları.
**Ana:** başlık (`Tüm varlıklar` / `Görseller` / `Videolar` / `Beğenilenler`) + sağ üstte **zoom kaydırıcısı**.
İçerik **tarihe göre gruplu**: her grubun başında **seçim kutusu + tarih etiketi** (`Dün`, `5 Temmuz 2026`), altında **78×78 kare küçük resimler** (r=10, 14px boşluk, kaydırılan satır — masonry DEĞİL). Videolarda ortada yarı saydam beyaz **play** dairesi (~26px).
**Çoklu seçim → yüzen alt çubuk** (r=20-24): yığılmış küçük resim + `2 seçili` + pill butonlar `İndir` · `Tümünü yayınla` · `Şuraya ekle` + ikon butonlar (kalp, çöp) + `✕`.
Boş durum (Favoriler): gradyan yuvarlak-kare ikon karosu (kalp) + kalın başlık + sönük alt satır. **CTA butonu yok**, sadece metin.
Klavye odağı: satırın 8px yarıçapına oturan **1px aksan odak halkası** (parıltı yok).

### 2.22 `/original-series` — Originals
Sidebar yok. **Tam-bleed otomatik oynayan hero video** (~660px), sol altta dizi logosu + beyaz `Şimdi izle ▶` pill'i, sağ altta sessize alma cam butonu. Altında fuşya gradyan promo şeridi (`%30'A KADAR İNDİRİM`).

---

## 3. ETKİLEŞİM KURALLARI (birebir)

1. **Yükleme = spinner değil, metin + shimmer.** `4sn'dir çalışıyor` + parlayan süre + canlı sayaç.
2. **Gönder butonu üretim sırasında stop (kare) butonuna dönüşür**, rengini korur.
3. **Hover'da açığa çıkan kontroller:** kart üzerinde seçim kutusu + ikon rayı; sidebar satırında `⋮`.
4. **Sağ-tık/⋯ menüleri hairline ile 3 bloğa ayrılır**, son blokta kırmızı `Sil`, alt menüsü olanlarda `›` chevron.
5. **Aktif nav göstergesi:** `/ai/*` sayfalarında **aksan alt çizgi**; `/audio`'da **aksan konturlu pill**; sidebar'da **dolu yuvarlak dikdörtgen**.
6. **Segment kontrolleri:** aktif = **beyaz pill + siyah metin**; pasif = şeffaf + gri metin.
7. **Akordiyon:** `+` / `−` glifi (chevron değil).
8. **Boş durumlar:** gri illüstrasyon karesi + `+` rozeti + kalın başlık + sönük alt satır.
9. **Kredi maliyeti her CTA'da görünür:** `✦ 7`. İndirimliyse eski fiyat üstü çizili.
10. **Noktalı ızgara dokusu** hero bölümlerinin zemininde (~24px aralık, çok düşük opaklık).
