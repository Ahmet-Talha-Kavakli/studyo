/**
 * İstem kitaplığı (Copilot Prompt Gallery, Gemini ve Vibe hazır komutları gibi): kategorili hazır istemler.
 * {alan} yer tutucuları kullanıcıya küçük bir form olarak sorulur. kip: istemle birlikte açılacak kip.
 * İstemci ve sunucu ortak.
 */
export type IstemKategori = "yazi" | "is" | "pazarlama" | "kod" | "ogrenme" | "analiz" | "kisisel" | "gorsel";
export const ISTEM_KATEGORILERI: { id: IstemKategori; ad: string }[] = [
  { id: "yazi", ad: "Yazı" }, { id: "is", ad: "İş" }, { id: "pazarlama", ad: "Pazarlama" }, { id: "kod", ad: "Kod" },
  { id: "ogrenme", ad: "Öğrenme" }, { id: "analiz", ad: "Analiz" }, { id: "kisisel", ad: "Kişisel" }, { id: "gorsel", ad: "Görsel" },
];
export type HazirIstem = { id: string; kategori: IstemKategori; baslik: string; metin: string; kip?: "tuval" | "arastirma" | "ogrenme" | "gorsel" };

const I = (kategori: IstemKategori, id: string, baslik: string, metin: string, kip?: HazirIstem["kip"]): HazirIstem => ({ id, kategori, baslik, metin, ...(kip ? { kip } : {}) });
export const HAZIR_ISTEMLER: HazirIstem[] = [
  I("yazi", "duzelt", "Metni düzelt", "Aşağıdaki metni yazım, noktalama ve anlatım açısından düzelt; anlamını ve tonunu koru. Yaptığın önemli değişiklikleri sonunda kısaca listele.\n\n{metin}"),
  I("yazi", "kisalt", "Kısalt ve netleştir", "Şu metni anlamını kaybetmeden yarı uzunluğuna indir, daha net ve akıcı yaz:\n\n{metin}"),
  I("yazi", "ton", "Tonunu değiştir", "Şu metni {ton} bir tonla yeniden yaz:\n\n{metin}"),
  I("yazi", "e-posta", "E-posta yaz", "{kime} için {amac} konulu, kibar ve net bir e-posta yaz. Konu satırını da ekle. Notlarım: {notlar}"),
  I("yazi", "blog", "Blog yazısı", "\"{konu}\" hakkında {hedef_kitle} için yaklaşık 1000 kelimelik, başlıklı ve okunur bir blog yazısı yaz. Sonuna 155 karakterlik meta açıklama ekle.", "tuval"),
  I("yazi", "ozet", "Metni özetle", "Şu metni 5 maddede özetle, ardından tek cümlelik bir ana fikir yaz:\n\n{metin}"),
  I("yazi", "cevir", "Çevir", "Şu metni {dil} diline doğal ve bağlama uygun biçimde çevir:\n\n{metin}"),
  I("yazi", "dilekce", "Dilekçe yaz", "{kurum} kurumuna {konu} konulu, resmî dilekçe biçiminde bir dilekçe yaz. Ad, adres ve tarih için yer bırak."),
  I("is", "toplanti-ozet", "Toplantı notlarını düzenle", "Şu toplantı notlarından özet, alınan kararlar ve sorumlusu ve tarihi belli aksiyon tablosu çıkar:\n\n{notlar}"),
  I("is", "swot", "SWOT analizi", "{konu} için ayrıntılı bir SWOT analizi yap; her başlıkta en az 4 madde olsun ve sonunda 3 stratejik öneri ver."),
  I("is", "is-plani", "İş planı taslağı", "{fikir} için tek sayfalık bir iş planı taslağı hazırla: problem, çözüm, hedef müşteri, gelir modeli, rakipler, maliyetler ve ilk 90 gün.", "tuval"),
  I("is", "teklif", "Teklif metni", "{musteri} için {hizmet} hizmetine yönelik profesyonel bir teklif metni yaz: kapsam, teslim süresi, fiyatlandırma ve koşullar."),
  I("is", "okr", "Hedef ve anahtar sonuçlar", "{ekip} ekibi için bu çeyreğe 3 hedef ve her hedef için ölçülebilir 3 anahtar sonuç yaz."),
  I("is", "mulakat", "Mülakat soruları", "{pozisyon} pozisyonu için yetkinlik ve davranış odaklı 10 mülakat sorusu hazırla; her soru için iyi bir yanıtta aranacakları yaz."),
  I("is", "sunum-plan", "Sunum kurgusu", "{konu} hakkında {sure} dakikalık bir sunumun slayt slayt kurgusunu çıkar: her slaytın başlığı ve 3 maddesi."),
  I("is", "geri-bildirim", "Yapıcı geri bildirim", "Bir ekip arkadaşıma {durum} konusunda yapıcı, net ve kırıcı olmayan bir geri bildirim yazmama yardım et."),
  I("pazarlama", "persona", "Müşteri profilleri", "{urun} için 3 ayrıntılı müşteri profili (persona) çıkar: demografi, ihtiyaçlar, itirazlar ve onlara konuşan mesaj."),
  I("pazarlama", "slogan", "Slogan ve başlık", "{marka} için 10 slogan ve 10 reklam başlığı öner; her birinin neden işe yarayacağını tek cümleyle yaz."),
  I("pazarlama", "instagram", "Instagram gönderileri", "{marka} için bu haftanın 5 Instagram gönderisini yaz: kanca cümlesi, metin, harekete çağrı ve görsel tarifi."),
  I("pazarlama", "reklam", "Reklam metinleri", "{urun} için Google ve Meta reklamlarında kullanılacak 5 kısa ve 5 uzun reklam metni yaz."),
  I("pazarlama", "rakip", "Rakip analizi", "{sektor} sektöründe {sirket} için rakip analizi yap: başlıca rakipler, güçlü yönleri, fiyatlandırma ve ayrışma fırsatları.", "arastirma"),
  I("pazarlama", "bulten", "E-posta bülteni", "{konu} hakkında aboneler için kısa, ilgi çekici bir e-posta bülteni yaz: konu satırı, giriş, 3 bölüm ve harekete çağrı."),
  I("pazarlama", "seo", "SEO anahtar kelimeleri", "{konu} için arama niyetine göre gruplanmış 30 anahtar kelime öner ve her grup için bir içerik fikri ver."),
  I("kod", "acikla", "Kodu açıkla", "Şu kodun ne yaptığını adım adım açıkla, olası hataları ve iyileştirmeleri belirt:\n\n```\n{kod}\n```"),
  I("kod", "incele", "Kod incelemesi", "Şu kodu kıdemli bir geliştirici gibi incele: hatalar, güvenlik, okunurluk, performans. Düzeltilmiş hâlini ver.\n\n```\n{kod}\n```", "tuval"),
  I("kod", "test", "Test yaz", "Şu fonksiyon için {cerceve} ile kenar durumları da kapsayan birim testleri yaz:\n\n```\n{kod}\n```"),
  I("kod", "regex", "Düzenli ifade", "{amac} için bir düzenli ifade (regex) yaz, parçalarını açıkla ve 3 eşleşen, 3 eşleşmeyen örnek ver."),
  I("kod", "sql", "SQL sorgusu", "Tablolarım şunlar: {tablolar}. {soru} sorusunu yanıtlayan SQL sorgusunu yaz ve açıkla."),
  I("kod", "cevir-dil", "Kodu başka dile çevir", "Şu kodu {dil} diline çevir; aynı davranışı koru ve dilin alışılmış kalıplarını kullan:\n\n```\n{kod}\n```", "tuval"),
  I("kod", "hata", "Hatayı çöz", "Şu hatayı alıyorum:\n{hata}\n\nİlgili kod:\n```\n{kod}\n```\nNedenini bul ve düzelt."),
  I("ogrenme", "ogret", "Konu öğret", "Bana {konu} konusunu adım adım, sorularla öğret. Önce ne bildiğimi yokla.", "ogrenme"),
  I("ogrenme", "basit", "Basitçe anlat", "{konu} konusunu 12 yaşındaki birine anlatır gibi, günlük hayattan bir benzetmeyle anlat."),
  I("ogrenme", "test", "Beni test et", "{konu} hakkında beni sınamak için 8 soruluk karışık bir test hazırla (çoktan seçmeli, doğru-yanlış ve boşluk doldurma).", "ogrenme"),
  I("ogrenme", "kartlar", "Bilgi kartları", "{konu} için tekrar edebileceğim 15 bilgi kartı hazırla.", "ogrenme"),
  I("ogrenme", "calisma-plani", "Çalışma planı", "{sinav} sınavına {sure} kaldı. Bana haftalık, gerçekçi bir çalışma planı hazırla."),
  I("ogrenme", "karsilastir", "Karşılaştır", "{a} ile {b} arasındaki farkları bir tabloda karşılaştır, sonra hangisinin ne zaman tercih edileceğini anlat."),
  I("ogrenme", "dil-pratik", "Dil pratiği", "Benimle {dil} dilinde {konu} hakkında konuş; her mesajımda en fazla iki hatamı düzelt.", "ogrenme"),
  I("analiz", "veri-ozet", "Veriyi özetle", "Eklediğim tablonun genel bir özetini çıkar: satır sayısı, sütun türleri, eksik değerler ve dikkat çeken 3 bulgu."),
  I("analiz", "grafik", "Grafik çiz", "Eklediğim tabloda {sutun} sütununu {grup} sütununa göre grupla ve bir grafik çiz; eğilimi yorumla."),
  I("analiz", "karar", "Karar matrisi", "{secenekler} seçenekleri arasında karar vermem için ölçütleri ağırlıklandırılmış bir karar matrisi hazırla ve önerini söyle."),
  I("analiz", "arastir", "Derinlemesine araştır", "{konu} hakkında güncel kaynaklarla derinlemesine bir araştırma raporu hazırla.", "arastirma"),
  I("analiz", "artieksi", "Artılar ve eksiler", "{konu} için artıları ve eksileri dengeli bir tabloda yaz, sonunda net bir değerlendirme yap."),
  I("analiz", "belge-ozet", "Belgeyi analiz et", "Eklediğim belgeyi oku: ana fikir, önemli rakamlar, riskler ve sorulması gereken sorular."),
  I("analiz", "butce", "Bütçe tablosu", "Aylık gelirim {gelir}. Giderlerim: {giderler}. Bana bir bütçe tablosu ve tasarruf önerileri hazırla."),
  I("kisisel", "gezi", "Gezi planı", "{yer} için {gun} günlük, {butce} bütçeli bir gezi planı hazırla: gün gün etkinlikler, ulaşım ve yemek önerileri."),
  I("kisisel", "yemek", "Yemek tarifi", "Elimde {malzemeler} var. Bunlarla yapabileceğim 3 tarif öner; birini adım adım yaz."),
  I("kisisel", "hediye", "Hediye fikri", "{kisi} için {butce} bütçeli, {ilgi} ilgi alanına uygun 10 hediye fikri öner."),
  I("kisisel", "spor", "Egzersiz programı", "{hedef} hedefi için {gun} gün, ekipmansız bir haftalık egzersiz programı hazırla."),
  I("kisisel", "mesaj", "Zor bir mesaj", "{kisi} kişisine {durum} hakkında nazik ama net bir mesaj yazmama yardım et."),
  I("kisisel", "aliskanlik", "Alışkanlık planı", "{aliskanlik} alışkanlığını kazanmak için 30 günlük, küçük adımlı bir plan hazırla."),
  I("gorsel", "urun-foto", "Ürün fotoğrafı", "{urun} için stüdyo ışığında, sade arka planlı, reklam kalitesinde bir ürün fotoğrafı üret.", "gorsel"),
  I("gorsel", "logo", "Logo fikirleri", "{marka} markası için {stil} tarzında 4 logo fikri üret.", "gorsel"),
  I("gorsel", "kapak", "Kapak görseli", "\"{baslik}\" başlıklı {tur} için dikkat çekici, sinematik bir kapak görseli üret.", "gorsel"),
  I("gorsel", "sosyal", "Sosyal medya görseli", "{konu} hakkında Instagram için kare, canlı renkli, metinsiz bir görsel üret.", "gorsel"),
  I("gorsel", "istem", "Görsel istemi yaz", "Şu fikri ayrıntılı bir İngilizce görsel istemine çevir (ışık, kompozisyon, lens, renk): {fikir}"),
];

/** Metindeki {alan} yer tutucuları (sırasıyla, tekil). */
export const alanlar = (metin: string) => [...new Set([...metin.matchAll(/\{([\p{L}\p{N}_]+)\}/gu)].map((m) => m[1]))];
/** Alan adını etikete çevirir: hedef_kitle → Hedef kitle. */
export const alanEtiketi = (a: string) => { const s = a.replace(/_/g, " "); return s.charAt(0).toLocaleUpperCase("tr") + s.slice(1); };
export const doldur = (metin: string, d: Record<string, string>) => metin.replace(/\{([\p{L}\p{N}_]+)\}/gu, (x, a: string) => (d[a]?.trim() ? d[a].trim() : x));
