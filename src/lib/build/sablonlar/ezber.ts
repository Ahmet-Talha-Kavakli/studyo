/* Şablon: Lügat · Kelime Ezberi — mobil uygulama (PWA). İngilizce ve Türkçe kelime desteleri (Günlük, İş İngilizcesi, Seyahat;
 * örnek cümleli), aralıklı tekrar (SM-2 tabanlı: öğrenme adımları, kolaylık katsayısı, gecikme), çevrilen kart, sağa ve sola
 * kaydırma, Tekrar / Zor / İyi / Kolay düğmelerinde bir sonraki aralık, günlük yeni kart sınırı, kendi kelimen ve destelerin,
 * ilerleme grafikleri ve speechSynthesis ile İngilizce telaffuz. Veriler cihazda (localStorage) saklanır. */
import { ORTAK_JS } from "./ortak";

type K = [string, string, string, string];
const GUNLUK: K[] = [
  ["appointment", "randevu", "I have a dentist appointment on Friday.", "Cuma günü dişçi randevum var."],
  ["neighbour", "komşu", "Our neighbour waters the plants when we travel.", "Seyahat ettiğimizde bitkileri komşumuz sular."],
  ["laundry", "çamaşır", "I need to do the laundry tonight.", "Bu akşam çamaşır yıkamam gerek."],
  ["receipt", "fiş, makbuz", "Keep the receipt in case you want to return it.", "İade etmek istersen diye fişi sakla."],
  ["bill", "hesap, fatura", "Can we have the bill, please?", "Hesabı alabilir miyiz lütfen?"],
  ["to borrow", "ödünç almak", "Can I borrow your umbrella?", "Şemsiyeni ödünç alabilir miyim?"],
  ["to lend", "ödünç vermek", "She lent me her car for the weekend.", "Hafta sonu için bana arabasını ödünç verdi."],
  ["crowded", "kalabalık", "The bus is always crowded in the morning.", "Otobüs sabahları hep kalabalık olur."],
  ["quiet", "sessiz, sakin", "We live on a quiet street.", "Sakin bir sokakta yaşıyoruz."],
  ["tired", "yorgun", "I am too tired to cook tonight.", "Bu akşam yemek yapamayacak kadar yorgunum."],
  ["hungry", "aç", "Are you hungry? Let's order something.", "Acıktın mı? Bir şey sipariş edelim."],
  ["to wake up", "uyanmak", "I usually wake up at seven.", "Genellikle yedide uyanırım."],
  ["to get dressed", "giyinmek", "Get dressed, we are leaving in ten minutes.", "Giyin, on dakika içinde çıkıyoruz."],
  ["breakfast", "kahvaltı", "Breakfast is the most important meal for me.", "Benim için en önemli öğün kahvaltıdır."],
  ["to cook", "yemek pişirmek", "My father loves to cook on Sundays.", "Babam pazarları yemek pişirmeyi çok sever."],
  ["to clean", "temizlemek", "We clean the house every weekend.", "Her hafta sonu evi temizleriz."],
  ["to forget", "unutmak", "Don't forget your keys.", "Anahtarlarını unutma."],
  ["to remember", "hatırlamak", "I can't remember her name.", "Adını hatırlayamıyorum."],
  ["to wait", "beklemek", "Wait for me at the station.", "Beni istasyonda bekle."],
  ["weather", "hava durumu", "The weather is lovely today.", "Bugün hava çok güzel."],
  ["umbrella", "şemsiye", "Take an umbrella, it might rain.", "Şemsiye al, yağmur yağabilir."],
  ["healthy", "sağlıklı", "She tries to eat healthy food.", "Sağlıklı beslenmeye çalışıyor."],
  ["to exercise", "egzersiz yapmak", "I exercise three times a week.", "Haftada üç kez egzersiz yaparım."],
  ["busy", "meşgul, yoğun", "Sorry, I am busy right now.", "Üzgünüm, şu an meşgulüm."],
  ["free time", "boş zaman", "What do you do in your free time?", "Boş zamanlarında ne yaparsın?"],
  ["to rent", "kiralamak", "They rent a small flat near the sea.", "Denize yakın küçük bir daire kiralıyorlar."],
  ["landlord", "ev sahibi", "The landlord fixed the heating.", "Ev sahibi kaloriferi tamir etti."],
  ["bargain", "kelepir", "This jacket was a real bargain.", "Bu ceket tam bir kelepirdi."],
  ["to complain", "şikâyet etmek", "He always complains about the traffic.", "Hep trafikten şikâyet eder."],
  ["to share", "paylaşmak", "We share the housework.", "Ev işlerini paylaşıyoruz."],
  ["to argue", "tartışmak", "My brothers argue about football.", "Kardeşlerim futbol yüzünden tartışır."],
  ["to apologize", "özür dilemek", "You should apologize to her.", "Ondan özür dilemelisin."],
  ["to promise", "söz vermek", "I promise I will call you tomorrow.", "Söz veriyorum, yarın seni arayacağım."],
  ["lonely", "yalnız", "She felt lonely in the new city.", "Yeni şehirde kendini yalnız hissetti."],
  ["proud", "gururlu", "I am proud of you.", "Seninle gurur duyuyorum."],
  ["to worry", "endişelenmek", "Don't worry, everything will be fine.", "Endişelenme, her şey yoluna girecek."],
  ["to enjoy", "keyif almak", "Did you enjoy the film?", "Filmden keyif aldın mı?"],
  ["leftovers", "artan yemek", "We had leftovers for dinner.", "Akşam yemeğinde dünden artanları yedik."],
  ["to run out of", "tükenmek, bitmek", "We have run out of milk.", "Sütümüz bitti."],
  ["to turn off", "kapatmak", "Turn off the lights when you leave.", "Çıkarken ışıkları kapat."],
  ["to pick up", "birini arabayla almak", "Can you pick me up after work?", "İşten sonra beni alabilir misin?"],
  ["errand", "ayak işi, ufak iş", "I have a few errands to run this afternoon.", "Bu öğleden sonra halletmem gereken birkaç iş var."],
  ["to get along", "iyi geçinmek", "I get along well with my sister.", "Kız kardeşimle iyi geçinirim."],
];
const IS: K[] = [
  ["deadline", "son teslim tarihi", "The deadline for the report is Friday.", "Raporun son teslim tarihi cuma."],
  ["meeting", "toplantı", "The meeting has been moved to the afternoon.", "Toplantı öğleden sonraya alındı."],
  ["agenda", "gündem", "Let's go through the agenda.", "Gündemin üzerinden geçelim."],
  ["to postpone", "ertelemek", "We had to postpone the launch.", "Lansmanı ertelemek zorunda kaldık."],
  ["colleague", "iş arkadaşı", "My colleague will join the call.", "İş arkadaşım da görüşmeye katılacak."],
  ["manager", "yönetici", "I will ask my manager for approval.", "Onay için yöneticime soracağım."],
  ["to hire", "işe almak", "We are hiring two new developers.", "İki yeni yazılımcı işe alıyoruz."],
  ["to resign", "istifa etmek", "She resigned after five years.", "Beş yıl sonra istifa etti."],
  ["salary", "maaş", "The salary is paid monthly.", "Maaş aylık ödenir."],
  ["raise", "zam", "He asked his boss for a raise.", "Patronundan zam istedi."],
  ["invoice", "fatura", "Please send the invoice by email.", "Faturayı lütfen e-postayla gönderin."],
  ["budget", "bütçe", "The project is over budget.", "Proje bütçeyi aştı."],
  ["revenue", "gelir, ciro", "Revenue grew by twenty percent last year.", "Geçen yıl gelir yüzde yirmi arttı."],
  ["profit", "kâr", "The company made a profit this year.", "Şirket bu yıl kâr etti."],
  ["loss", "zarar", "They reported a loss in the first quarter.", "İlk çeyrekte zarar açıkladılar."],
  ["customer", "müşteri", "The customer called about the delivery.", "Müşteri teslimat için aradı."],
  ["supplier", "tedarikçi", "We changed our supplier last month.", "Geçen ay tedarikçimizi değiştirdik."],
  ["contract", "sözleşme", "Please read the contract carefully.", "Lütfen sözleşmeyi dikkatle okuyun."],
  ["to negotiate", "pazarlık etmek, müzakere etmek", "We negotiated a better price.", "Daha iyi bir fiyat için pazarlık ettik."],
  ["proposal", "teklif", "Our proposal was accepted.", "Teklifimiz kabul edildi."],
  ["to approve", "onaylamak", "The board approved the plan.", "Yönetim kurulu planı onayladı."],
  ["feedback", "geri bildirim", "Thanks for your feedback.", "Geri bildirimin için teşekkürler."],
  ["to schedule", "planlamak, takvime koymak", "Let's schedule a call for Monday.", "Pazartesi için bir görüşme planlayalım."],
  ["to follow up", "takip etmek", "I will follow up with an email.", "Bir e-postayla konuyu takip edeceğim."],
  ["to attach", "eklemek (dosya)", "I have attached the file.", "Dosyayı ekledim."],
  ["headquarters", "genel merkez", "Our headquarters are in Istanbul.", "Genel merkezimiz İstanbul'da."],
  ["branch", "şube", "The bank opened a new branch.", "Banka yeni bir şube açtı."],
  ["department", "departman, bölüm", "She works in the sales department.", "Satış departmanında çalışıyor."],
  ["skill", "beceri", "Communication is a key skill.", "İletişim temel bir beceridir."],
  ["experience", "deneyim", "He has ten years of experience.", "On yıllık deneyimi var."],
  ["interview", "iş görüşmesi, mülakat", "The interview went well.", "Mülakat iyi geçti."],
  ["promotion", "terfi", "She got a promotion last week.", "Geçen hafta terfi aldı."],
  ["to delegate", "görev dağıtmak", "A good manager knows how to delegate.", "İyi bir yönetici görev dağıtmayı bilir."],
  ["workload", "iş yükü", "My workload is heavy this month.", "Bu ay iş yüküm ağır."],
  ["to achieve", "başarmak, ulaşmak", "We achieved our sales target.", "Satış hedefimize ulaştık."],
  ["goal", "hedef", "Our goal is to double our sales.", "Hedefimiz satışlarımızı ikiye katlamak."],
  ["to launch", "piyasaya sürmek", "They will launch the app in May.", "Uygulamayı mayısta piyasaya sürecekler."],
  ["shareholder", "hissedar", "The shareholders will vote tomorrow.", "Hissedarlar yarın oy kullanacak."],
  ["to reschedule", "başka zamana almak", "Can we reschedule our meeting?", "Toplantımızı başka bir zamana alabilir miyiz?"],
  ["remote work", "uzaktan çalışma", "Remote work saves commuting time.", "Uzaktan çalışma yolda geçen zamandan tasarruf sağlar."],
  ["commute", "işe gidip gelme", "My commute takes an hour.", "İşe gidip gelmem bir saat sürüyor."],
  ["to brief", "bilgilendirmek", "I will brief the team after lunch.", "Öğle yemeğinden sonra ekibi bilgilendireceğim."],
  ["quarter", "çeyrek (üç aylık dönem)", "Sales rose in the last quarter.", "Satışlar son çeyrekte arttı."],
  ["stakeholder", "paydaş", "We need to inform all stakeholders.", "Tüm paydaşları bilgilendirmemiz gerekiyor."],
];
const SEYAHAT: K[] = [
  ["boarding pass", "biniş kartı", "Please show your boarding pass at the gate.", "Lütfen kapıda biniş kartınızı gösterin."],
  ["departure", "kalkış", "The departure time has changed.", "Kalkış saati değişti."],
  ["arrival", "varış", "Our arrival is at noon.", "Varışımız öğlen."],
  ["delay", "rötar, gecikme", "There is a two-hour delay.", "İki saatlik rötar var."],
  ["luggage", "bagaj", "My luggage didn't arrive.", "Bagajım gelmedi."],
  ["carry-on", "kabin bagajı", "Is this bag allowed as a carry-on?", "Bu çanta kabin bagajı olarak kabul edilir mi?"],
  ["customs", "gümrük", "We waited an hour at customs.", "Gümrükte bir saat bekledik."],
  ["passport", "pasaport", "Don't forget your passport.", "Pasaportunu unutma."],
  ["aisle seat", "koridor koltuğu", "I would prefer an aisle seat.", "Koridor koltuğunu tercih ederim."],
  ["window seat", "cam kenarı koltuk", "Can I have a window seat?", "Cam kenarı bir koltuk alabilir miyim?"],
  ["round trip", "gidiş dönüş", "A round trip ticket is cheaper.", "Gidiş dönüş bilet daha ucuz."],
  ["one-way", "tek yön", "I only need a one-way ticket.", "Yalnızca tek yön bilete ihtiyacım var."],
  ["to book", "yer ayırtmak", "I booked a room for two nights.", "İki gecelik oda ayırttım."],
  ["reservation", "rezervasyon", "I have a reservation under the name Kaya.", "Kaya adına rezervasyonum var."],
  ["check-in", "giriş işlemi", "Check-in starts at two o'clock.", "Giriş işlemleri saat ikide başlıyor."],
  ["check-out", "çıkış işlemi", "Check-out is at eleven.", "Çıkış saat on birde."],
  ["to cancel", "iptal etmek", "Our flight was cancelled.", "Uçuşumuz iptal edildi."],
  ["sightseeing", "gezip görme", "We went sightseeing in Rome.", "Roma'da gezip görmeye çıktık."],
  ["landmark", "simge yapı", "The tower is the city's most famous landmark.", "Kule, şehrin en ünlü simge yapısıdır."],
  ["guidebook", "rehber kitap", "The guidebook recommends this café.", "Rehber kitap bu kafeyi öneriyor."],
  ["currency", "para birimi", "What is the local currency?", "Yerel para birimi ne?"],
  ["exchange rate", "döviz kuru", "The exchange rate is good today.", "Bugün döviz kuru iyi."],
  ["souvenir", "hatıra eşya", "I bought a souvenir for my mother.", "Annem için bir hatıra eşya aldım."],
  ["platform", "peron", "The train leaves from platform four.", "Tren dört numaralı perondan kalkıyor."],
  ["to miss", "kaçırmak", "Hurry, or we will miss the bus.", "Acele et, yoksa otobüsü kaçıracağız."],
  ["directions", "yol tarifi", "Can you give me directions to the museum?", "Müzeye nasıl gidileceğini tarif edebilir misiniz?"],
  ["nearby", "yakında, yakındaki", "Is there a pharmacy nearby?", "Yakında eczane var mı?"],
  ["to get lost", "kaybolmak", "We got lost in the old town.", "Eski şehirde kaybolduk."],
  ["map", "harita", "Let me check the map.", "Haritaya bir bakayım."],
  ["accommodation", "konaklama", "Accommodation is expensive in summer.", "Yazın konaklama pahalı."],
  ["hostel", "hostel", "We stayed in a hostel near the station.", "İstasyonun yakınındaki bir hostelde kaldık."],
  ["view", "manzara", "The room has a sea view.", "Odanın deniz manzarası var."],
  ["sunscreen", "güneş kremi", "Put on some sunscreen.", "Biraz güneş kremi sür."],
  ["jet lag", "saat farkı yorgunluğu", "I have terrible jet lag.", "Saat farkı yüzünden çok yorgunum."],
  ["itinerary", "gezi programı", "Our itinerary includes three cities.", "Gezi programımızda üç şehir var."],
  ["travel insurance", "seyahat sigortası", "Travel insurance is required for the visa.", "Vize için seyahat sigortası gerekli."],
  ["visa", "vize", "Do I need a visa for Japan?", "Japonya için vizeye ihtiyacım var mı?"],
  ["to rent a car", "araba kiralamak", "We rented a car at the airport.", "Havalimanında araba kiraladık."],
  ["fare", "bilet ücreti, yol ücreti", "The taxi fare was twenty euros.", "Taksi ücreti yirmi avroydu."],
  ["lost and found", "kayıp eşya bürosu", "Ask at the lost and found.", "Kayıp eşya bürosuna sor."],
  ["tip", "bahşiş", "Is the tip included?", "Bahşiş dahil mi?"],
  ["to explore", "keşfetmek", "We explored the island by bike.", "Adayı bisikletle keşfettik."],
  ["layover", "aktarma molası", "We have a three-hour layover in Doha.", "Doha'da üç saatlik aktarma molamız var."],
  ["gate", "kapı (havalimanı)", "Boarding starts at gate twelve.", "Biniş on iki numaralı kapıda başlıyor."],
];
const DESTELER = [
  { id: "gunluk", ad: "Günlük hayat", alt: "Evde, sokakta, arkadaşlarla", renk: "#3d6fea", kartlar: GUNLUK },
  { id: "is", ad: "İş İngilizcesi", alt: "Toplantı, e-posta, sözleşme", renk: "#14213d", kartlar: IS },
  { id: "seyahat", ad: "Seyahat", alt: "Havalimanı, otel, şehir", renk: "#f0605d", kartlar: SEYAHAT },
];

const STIL = String.raw`/* Lügat — serin kâğıt zemin, lacivert mürekkep, hardal imza; Instrument Serif ve Plus Jakarta Sans. */
:root {
  --zemin: #edf0f7;
  --yuzey: #ffffff;
  --yuzey-2: #f4f6fb;
  --murekkep: #14213d;
  --soluk: #5d6784;
  --soluk-2: #8a93ad;
  --cizgi: rgba(20, 33, 61, 0.09);
  --cizgi-2: rgba(20, 33, 61, 0.16);
  --hardal: #ffc23d;
  --mercan: #f0605d;
  --yesil: #22a06b;
  --mavi: #3d6fea;
  --turuncu: #f08a24;
  --serif: "Instrument Serif", Georgia, serif;
  --yazi: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
  --yay: cubic-bezier(0.34, 1.56, 0.64, 1);
  --sutun: 480px;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html { background: var(--zemin); }
body { margin: 0; min-height: 100vh; min-height: 100dvh; color: var(--murekkep); font-family: var(--yazi); font-size: 15px; line-height: 1.45; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; border: 0; background: none; padding: 0; }
:focus-visible { outline: 2.5px solid var(--mavi); outline-offset: 2px; border-radius: 12px; }
h1, h2, h3 { margin: 0; letter-spacing: -0.02em; }
h1, h2 { font-family: var(--serif); font-weight: 400; }
svg { display: block; }
.arka { position: fixed; inset: 0; z-index: -1; pointer-events: none; background:
  radial-gradient(55% 35% at 100% 0%, rgba(255, 194, 61, 0.25), rgba(255, 194, 61, 0) 70%),
  radial-gradient(50% 35% at 0% 100%, rgba(61, 111, 234, 0.12), rgba(61, 111, 234, 0) 70%), var(--zemin); }
.arka::after { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(20, 33, 61, 0.035) 1px, transparent 1px); background-size: 100% 30px; }

#ekran { max-width: var(--sutun); margin: 0 auto; padding: calc(env(safe-area-inset-top) + 20px) 18px calc(env(safe-area-inset-bottom) + 112px); outline: none; }
.giris { animation: belir 0.45s var(--egri); }
@keyframes belir { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.ust { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ust p { margin: 0; color: var(--soluk); font-size: 13.5px; font-weight: 600; }
.ust h1 { font-size: 40px; line-height: 1.02; margin-top: 4px; }
.ust h1 em { color: var(--mavi); }
.ikon-dugme { flex: none; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--yuzey); border: 1px solid var(--cizgi); }
.ikon-dugme svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }

/* Bugün kartı */
.gunun { position: relative; margin-top: 18px; padding: 20px; border-radius: 28px; background: var(--murekkep); color: #fff; overflow: hidden; }
.gunun::before { content: ""; position: absolute; right: -70px; top: -96px; width: 210px; height: 210px; border-radius: 50%; background: var(--hardal); opacity: 0.95; }
.gunun::after { content: ""; position: absolute; right: 26px; top: 26px; width: 58px; height: 58px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.25); }
.gunun > * { position: relative; z-index: 1; }
.gunun small { display: block; color: rgba(255, 255, 255, 0.7); font-size: 13px; font-weight: 600; }
.gunun .buyuk { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
.gunun .buyuk b { font: 400 64px/1 var(--serif); letter-spacing: -0.02em; }
.gunun .buyuk span { font-size: 15px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }
.sayaclar { display: flex; gap: 14px; flex-wrap: wrap; margin: 12px 0 16px; font-size: 13px; font-weight: 700; }
.sayaclar span { display: inline-flex; align-items: center; gap: 6px; }
.sayaclar i { width: 9px; height: 9px; border-radius: 50%; }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 22px; border-radius: 16px; font-weight: 800; font-size: 15px; background: var(--murekkep); color: #fff; transition: transform 0.18s var(--yay), opacity 0.2s; }
.dugme:active { transform: scale(0.97); }
.dugme.hardal { background: var(--hardal); color: var(--murekkep); }
.dugme.ikincil { background: var(--yuzey); color: var(--murekkep); border: 1px solid var(--cizgi-2); }
.dugme.tehlike { background: #fff1f0; color: #c43c39; border: 1px solid rgba(196, 60, 57, 0.2); }
.dugme.tam { width: 100%; }
.dugme:disabled { opacity: 0.45; cursor: default; }
.dugme svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

.bolum { display: flex; align-items: baseline; justify-content: space-between; margin: 26px 2px 12px; gap: 10px; }
.bolum h2 { font-size: 27px; }
.bolum span, .bolum button { color: var(--soluk); font-size: 13px; font-weight: 700; }
.bolum button { color: var(--mavi); }

/* Deste satırı */
.desteler { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.deste { --r: #3d6fea; display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 22px; background: var(--yuzey); border: 1px solid var(--cizgi); text-align: left; width: 100%; }
.deste-renk { flex: none; width: 48px; height: 58px; border-radius: 10px; background: var(--r); position: relative; display: grid; place-items: center; color: #fff; font: 400 24px var(--serif); }
.deste-renk::before { content: ""; position: absolute; inset: -4px 4px auto; height: 6px; border-radius: 6px 6px 0 0; background: var(--r); opacity: 0.35; }
.deste-bilgi { flex: 1; min-width: 0; }
.deste-bilgi b { display: block; font-size: 16px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.deste-bilgi span { display: block; color: var(--soluk); font-size: 12.5px; font-weight: 600; }
.ilerleme-cubuk { height: 6px; border-radius: 99px; background: var(--yuzey-2); overflow: hidden; margin-top: 8px; display: flex; }
.ilerleme-cubuk i { display: block; height: 100%; }
.vade { flex: none; display: grid; justify-items: end; gap: 2px; font-size: 12px; font-weight: 800; }
.vade .rozet { min-width: 30px; padding: 3px 8px; border-radius: 99px; text-align: center; }
.rozet.mavi { background: rgba(61, 111, 234, 0.12); color: var(--mavi); }
.rozet.yesil { background: rgba(34, 160, 107, 0.12); color: var(--yesil); }
.rozet.mercan { background: rgba(240, 96, 93, 0.12); color: var(--mercan); }
.rozet.gri { background: var(--yuzey-2); color: var(--soluk-2); }

.ipucu { margin-top: 12px; padding: 14px 16px; border-radius: 20px; background: rgba(255, 194, 61, 0.18); border: 1px solid rgba(255, 194, 61, 0.45); font-size: 13.5px; color: #5b4a17; display: flex; gap: 12px; align-items: flex-start; }
.ipucu svg { width: 22px; height: 22px; flex: none; fill: none; stroke: #b07d00; stroke-width: 2; stroke-linecap: round; }

/* İlerleme */
.olcu-izgara { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
.olcu { padding: 14px 16px; border-radius: 22px; background: var(--yuzey); border: 1px solid var(--cizgi); }
.olcu span { display: block; color: var(--soluk); font-size: 12.5px; font-weight: 700; }
.olcu b { display: block; font: 400 38px/1.05 var(--serif); margin-top: 4px; }
.olcu small { color: var(--soluk-2); font-size: 12px; font-weight: 600; }
.olcu.koyu { background: var(--murekkep); color: #fff; border-color: transparent; }
.olcu.koyu span, .olcu.koyu small { color: rgba(255, 255, 255, 0.65); }
.kart { margin-top: 12px; padding: 16px; border-radius: 24px; background: var(--yuzey); border: 1px solid var(--cizgi); }
.kart-ust { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.kart-ust h3 { font-size: 15.5px; font-weight: 800; }
.kart-ust span { color: var(--soluk); font-size: 12.5px; font-weight: 600; }
.cubuklar { display: flex; align-items: flex-end; gap: 5px; height: 120px; }
.cubuk { flex: 1; min-width: 0; height: 100%; display: grid; grid-template-rows: 1fr auto; gap: 6px; }
.yigin { align-self: end; display: flex; flex-direction: column-reverse; border-radius: 7px 7px 4px 4px; overflow: hidden; min-height: 3px; background: var(--yuzey-2); }
.yigin i { display: block; }
.cubuk small { text-align: center; font-size: 10.5px; font-weight: 700; color: var(--soluk-2); white-space: nowrap; }
.lejant { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 12px; font-size: 12px; font-weight: 700; color: var(--soluk); }
.lejant span { display: inline-flex; align-items: center; gap: 6px; }
.lejant i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.durum-cubuk { display: flex; height: 16px; border-radius: 8px; overflow: hidden; gap: 2px; }
.durum-cubuk i { display: block; height: 100%; }

/* Sekmeler */
.sekmeler { position: fixed; z-index: 30; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 12px); transform: translateX(-50%); width: min(calc(100% - 28px), 380px); display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 6px; border-radius: 24px; background: rgba(255, 255, 255, 0.86); border: 1px solid var(--cizgi); -webkit-backdrop-filter: blur(16px) saturate(1.5); backdrop-filter: blur(16px) saturate(1.5); }
.sekmeler button { min-height: 52px; border-radius: 18px; display: grid; justify-items: center; align-content: center; gap: 2px; color: var(--soluk-2); font-size: 11.5px; font-weight: 800; }
.sekmeler svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.sekmeler button.secili { background: var(--murekkep); color: #fff; }
.sekmeler button.secili svg { stroke: var(--hardal); }

/* Çalışma ekranı */
.calisma { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; background: radial-gradient(55% 35% at 100% 0%, rgba(255, 194, 61, 0.22), rgba(255, 194, 61, 0) 70%), radial-gradient(50% 35% at 0% 100%, rgba(61, 111, 234, 0.12), rgba(61, 111, 234, 0) 70%), var(--zemin); padding: calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 16px); animation: belir 0.3s var(--egri); overflow: hidden; }
.calisma-ic { width: 100%; max-width: 460px; margin: 0 auto; flex: 1; display: flex; flex-direction: column; min-height: 0; }
.cal-ust { display: flex; align-items: center; gap: 12px; }
.cal-ust .ikon-dugme { width: 40px; height: 40px; border-radius: 12px; }
.cal-ilerleme { flex: 1; height: 8px; border-radius: 99px; background: rgba(20, 33, 61, 0.08); overflow: hidden; }
.cal-ilerleme i { display: block; height: 100%; width: 0; border-radius: 99px; background: var(--murekkep); transition: width 0.4s var(--egri); }
.cal-sayac { display: flex; gap: 8px; font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }
.cal-sayac span.etkin { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }
.sahne { position: relative; flex: 1; min-height: 0; display: grid; place-items: center; padding: 14px 0; perspective: 1400px; }
.kartvizit:focus-visible { outline: none; }
.kartvizit:focus-visible .yuz { outline: 2.5px solid var(--mavi); outline-offset: 3px; }
.kartvizit { position: relative; width: 100%; height: 100%; max-height: 520px; touch-action: pan-y; user-select: none; -webkit-user-select: none; cursor: grab; }
.kartvizit.gecis { transition: transform 0.35s var(--egri), opacity 0.35s; }
.cevir { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 0.55s var(--egri); }
.kartvizit.donuk .cevir { transform: rotateY(180deg); }
.yuz { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 30px; background: var(--yuzey); border: 1px solid var(--cizgi); display: flex; flex-direction: column; padding: 22px; overflow: hidden; }
.yuz.arka-yuz { transform: rotateY(180deg); }
.yuz::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 8px; background: var(--r, var(--mavi)); }
.yuz-ust { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.etiket { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 99px; font-size: 12px; font-weight: 800; background: var(--yuzey-2); color: var(--soluk); }
.etiket i { width: 8px; height: 8px; border-radius: 50%; }
.konus { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--yuzey-2); color: var(--murekkep); }
.konus.caliyor { background: var(--hardal); }
.konus svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.kelime { flex: 1; display: grid; place-content: center; text-align: center; gap: 8px; }
.kelime b { font: 400 clamp(40px, 12vw, 58px)/1.05 var(--serif); letter-spacing: -0.01em; overflow-wrap: anywhere; }
.kelime span { color: var(--soluk); font-size: 14px; font-weight: 600; }
.anlam { flex: 1; display: grid; place-content: center; text-align: center; padding: 8px 0 16px; }
.anlam .soru { color: var(--soluk); font: 400 26px/1.15 var(--serif); }
.anlam .cevap { font: 400 clamp(34px, 10vw, 46px)/1.08 var(--serif); margin-top: 8px; color: var(--murekkep); }
.ornek { margin-top: auto; padding: 14px 16px; border-radius: 18px; background: var(--yuzey-2); }
.ornek p { margin: 0; font-size: 15px; font-weight: 600; }
.ornek p + p { margin-top: 5px; color: var(--soluk); font-weight: 500; font-size: 14px; }
.ornek mark { background: linear-gradient(transparent 58%, rgba(255, 194, 61, 0.6) 58%); color: inherit; }
.damga { position: absolute; top: 26px; z-index: 3; padding: 6px 14px; border-radius: 12px; border: 3px solid currentColor; font-weight: 900; font-size: 18px; opacity: 0; transform: rotate(-12deg); pointer-events: none; background: rgba(255, 255, 255, 0.9); }
.damga.sol { right: 22px; color: var(--mercan); }
.damga.sag { left: 22px; color: var(--yesil); transform: rotate(12deg); }
.dokun-ipucu { position: absolute; bottom: 22px; left: 0; right: 0; text-align: center; color: var(--soluk-2); font-size: 13px; font-weight: 700; }
.cal-alt { display: grid; gap: 8px; }
.notlar { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.notlar button { min-height: 66px; border-radius: 18px; display: grid; align-content: center; justify-items: center; gap: 2px; font-weight: 800; font-size: 14.5px; color: #fff; transition: transform 0.15s var(--yay); }
.notlar button:active { transform: scale(0.94); }
.notlar small { font-size: 12px; font-weight: 700; opacity: 0.85; }
.notlar [data-not="0"] { background: var(--mercan); }
.notlar [data-not="1"] { background: var(--turuncu); }
.notlar [data-not="2"] { background: var(--yesil); }
.notlar [data-not="3"] { background: var(--mavi); }
.kaydir-ipucu { text-align: center; color: var(--soluk-2); font-size: 12.5px; font-weight: 600; margin: 2px 0 0; }
.bitti { flex: 1; display: grid; place-content: center; text-align: center; gap: 14px; padding: 20px 6px; }
.bitti .rozet-buyuk { width: 108px; height: 108px; margin: 0 auto; border-radius: 50%; background: var(--hardal); display: grid; place-items: center; animation: zipla 0.7s var(--yay); }
.bitti .rozet-buyuk svg { width: 54px; height: 54px; fill: none; stroke: var(--murekkep); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
@keyframes zipla { from { transform: scale(0.4); opacity: 0; } }
.bitti h2 { font-size: 40px; }
.bitti p { margin: 0; color: var(--soluk); }
.ucgen { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 6px 0 8px; }
.ucgen div { padding: 12px 6px; border-radius: 18px; background: var(--yuzey); border: 1px solid var(--cizgi); }
.ucgen b { display: block; font: 400 30px var(--serif); }
.ucgen span { color: var(--soluk); font-size: 12px; font-weight: 700; }

/* Alt sayfa */
.perde { position: fixed; inset: 0; z-index: 60; background: rgba(20, 33, 61, 0.35); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); animation: perde 0.25s; }
@keyframes perde { from { opacity: 0; } }
.alt-sayfa { position: fixed; z-index: 61; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, var(--sutun)); max-height: 92vh; max-height: 92dvh; overflow-y: auto; overscroll-behavior: contain; background: var(--yuzey); border-radius: 30px 30px 0 0; padding: 8px 20px calc(env(safe-area-inset-bottom) + 24px); animation: yukari 0.38s var(--egri); }
@keyframes yukari { from { transform: translate(-50%, 100%); } }
.alt-sayfa.kapaniyor { transition: transform 0.25s ease-in; transform: translate(-50%, 100%) !important; }
.tutamak { display: block; height: 24px; position: relative; touch-action: none; cursor: grab; }
.tutamak::before { content: ""; position: absolute; left: 50%; top: 9px; width: 42px; height: 5px; margin-left: -21px; border-radius: 9px; background: var(--cizgi-2); }
.sayfa-ust { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.sayfa-ust h2 { font-size: 32px; line-height: 1.05; }
.sayfa-ust p { margin: 2px 0 0; color: var(--soluk); font-size: 13px; font-weight: 600; }
.kapat { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--yuzey-2); }
.kapat svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
.alan { display: block; margin-bottom: 12px; }
.alan > span { display: block; font-size: 12.5px; font-weight: 800; color: var(--soluk); margin-bottom: 6px; }
.girdi { width: 100%; min-height: 48px; padding: 0 14px; border-radius: 14px; border: 1.5px solid var(--cizgi-2); background: var(--yuzey-2); font-size: 16px; outline: none; }
.girdi:focus { border-color: var(--murekkep); background: #fff; }
.iki { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
.ekle-kutu { padding: 14px; border-radius: 20px; background: var(--yuzey-2); margin-bottom: 14px; }
.ekle-kutu .girdi { background: #fff; }
.kelime-liste { display: grid; }
.ks { display: flex; align-items: center; gap: 10px; padding: 11px 2px; border-top: 1px solid var(--cizgi); }
.ks div { flex: 1; min-width: 0; }
.ks b { display: block; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ks span { display: block; color: var(--soluk); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ks .rozet { flex: none; padding: 3px 8px; border-radius: 99px; font-size: 11.5px; font-weight: 800; }
.ks .sil { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; color: var(--soluk-2); }
.ks .sil svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
.parcali { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 4px; padding: 4px; border-radius: 14px; background: var(--yuzey-2); border: 1px solid var(--cizgi); }
.parcali button { min-height: 40px; border-radius: 10px; font-size: 13px; font-weight: 800; color: var(--soluk); white-space: nowrap; padding: 0 6px; }
.parcali button.secili { background: var(--murekkep); color: #fff; }
.satir { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 0; border-top: 1px solid var(--cizgi); }
.satir:first-of-type { border-top: 0; }
.satir b { display: block; font-size: 14.5px; font-weight: 800; }
.satir span { display: block; color: var(--soluk); font-size: 12.5px; }
.satir.dikey { display: block; }
.satir.dikey .parcali { margin-top: 10px; }
.adim { display: flex; align-items: center; gap: 6px; }
.adim button { width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--cizgi-2); display: grid; place-items: center; }
.adim svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
.adim output { min-width: 34px; text-align: center; font: 400 26px var(--serif); }
.anahtar { position: relative; flex: none; width: 50px; height: 30px; }
.anahtar input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
.anahtar i { position: absolute; inset: 0; border-radius: 99px; background: var(--cizgi-2); transition: background 0.2s; pointer-events: none; }
.anahtar i::after { content: ""; position: absolute; left: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.25s var(--yay); }
.anahtar input:checked + i { background: var(--yesil); }
.anahtar input:checked + i::after { transform: translateX(20px); }
.renkler { display: flex; gap: 8px; flex-wrap: wrap; }
.renkler button { width: 36px; height: 36px; border-radius: 50%; background: var(--c); }
.renkler button.secili { outline: 3px solid var(--c); outline-offset: 3px; }
.eylemler { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; margin-top: 16px; }

.tost { position: fixed; z-index: 80; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 96px); transform: translate(-50%, 20px); opacity: 0; pointer-events: none; max-width: calc(100% - 40px); padding: 12px 18px; border-radius: 16px; background: var(--murekkep); color: #fff; font-weight: 700; font-size: 14px; transition: opacity 0.25s, transform 0.3s var(--egri); text-align: center; }
.tost.acik { opacity: 1; transform: translate(-50%, 0); }

.kenar { display: none; }
@media (min-width: 760px) {
  #ekran { margin-top: 28px; margin-bottom: 28px; background: rgba(255, 255, 255, 0.5); border: 1px solid var(--cizgi); border-radius: 36px; padding-left: 26px; padding-right: 26px; min-height: calc(100vh - 56px); }
  .sekmeler { bottom: 40px; }
  .calisma { padding-top: 28px; padding-bottom: 28px; }
}
@media (min-width: 1180px) {
  .kenar { display: block; position: fixed; top: 64px; width: 270px; left: calc(50% - 570px); }
  .kenar .logo { display: flex; align-items: center; gap: 12px; font: 400 34px var(--serif); }
  .kenar .logo svg { width: 44px; height: 44px; }
  .kenar p { color: var(--soluk); font-size: 14.5px; line-height: 1.6; margin: 16px 0 0; }
  .kenar ol { margin: 18px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; counter-reset: a; }
  .kenar li { display: flex; gap: 10px; font-size: 13.5px; font-weight: 600; color: var(--soluk); }
  .kenar li::before { counter-increment: a; content: counter(a); flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--hardal); color: var(--murekkep); display: grid; place-items: center; font-size: 12px; font-weight: 800; }
  .kenar.sag { left: auto; right: calc(50% - 570px); }
  .kenar.sag div + div { margin-top: 22px; }
  .kenar.sag b { display: block; font: 400 52px/1 var(--serif); }
  .kenar.sag span { color: var(--soluk); font-size: 13.5px; font-weight: 600; }
}
@media (max-width: 360px) {
  #ekran { padding-left: 14px; padding-right: 14px; }
  .notlar button { min-height: 60px; font-size: 13.5px; }
  .ust h1 { font-size: 34px; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Lügat · Kelime Ezberi — aralıklı tekrar (SM-2 tabanlı). Veriler bu cihazda (localStorage). ── */
(function () {
  var ANAHTAR = "lugat-ezber-v1";
  var DK = 60000, GUN = 864e5;
  var ADIMLAR = [1 * DK, 10 * DK];
  var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var NOT_AD = ["Tekrar", "Zor", "İyi", "Kolay"];
  var RENKLER = ["#3d6fea", "#14213d", "#f0605d", "#22a06b", "#f08a24", "#8b5cf6", "#0e9fb0"];
  var S = function (y) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + y + "</svg>"; };
  var CARPI = S('<path d="M6 6l12 12M18 6L6 18"/>'), ARTI = S('<path d="M12 5v14M5 12h14"/>'), EKSI = S('<path d="M5 12h14"/>');
  var HOPARLOR = S('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>');
  var AYAR = S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>');

  var V = yukle();
  var aktif = "bugun";

  /* ── Kayıt ── */
  function yukle() {
    try { var j = JSON.parse(localStorage.getItem(ANAHTAR) || "null"); if (j && Array.isArray(j.kartlar)) return j; } catch (e) {}
    var t = tohum(); try { localStorage.setItem(ANAHTAR, JSON.stringify(t)); } catch (e) {}
    return t;
  }
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch (e) {} }
  function bugun() { return istanbul().tarih; }
  function gunSonu() { return Date.now() + (1440 - istanbul().dakika) * DK; }

  /* İlk açılış: üç deste; Günlük destenin bir kısmı önceden çalışılmış, bir kısmı bugün tekrarda. */
  function tohum() {
    var simdi = Date.now(), kartlar = [], log = {}, sayi = 11;
    function r() { sayi = (sayi * 16807) % 2147483647; return sayi / 2147483647; }
    (window.LUGAT_DESTELER || []).forEach(function (d) {
      d.kartlar.forEach(function (k, i) {
        var c = { id: d.id + "-" + i, deste: d.id, en: k[0], tr: k[1], ornek: k[2], ornekTr: k[3], durum: "yeni", adim: 0, aralik: 0, kolaylik: 2.5, vade: 0, tekrar: 0, hata: 0, eklenme: simdi - 30 * GUN + i };
        var calisilmis = (d.id === "gunluk" && i < 28) || (d.id === "is" && i < 8);
        if (calisilmis) {
          var araliklar = [1, 2, 3, 4, 6, 9, 14, 23, 31, 45];
          c.durum = "tekrar"; c.aralik = araliklar[Math.floor(r() * araliklar.length)]; c.kolaylik = Math.round((2.1 + r() * 0.7) * 100) / 100;
          c.tekrar = 2 + Math.floor(r() * 6); c.hata = r() < 0.3 ? 1 : 0;
          var gecikme = r() < (d.id === "gunluk" ? 0.42 : 0.3) ? -Math.floor(r() * 2) : 1 + Math.floor(r() * c.aralik);
          c.vade = simdi + gecikme * GUN - 3 * 3600000;
        }
        kartlar.push(c);
      });
    });
    var t = bugun();
    for (var g = 13; g >= 1; g--) {
      if (g === 5 || g === 9) continue;
      var y = Math.floor(r() * 6) + (g > 8 ? 4 : 1), tk = Math.floor(r() * 18) + 6, dogru = Math.round((y + tk) * (0.78 + r() * 0.16));
      log[gunEkle(t, -g)] = { yeni: y, tekrar: tk, dogru: dogru, toplam: y + tk, sn: (y + tk) * (7 + Math.floor(r() * 5)) };
    }
    var desteler = (window.LUGAT_DESTELER || []).map(function (d) { return { id: d.id, ad: d.ad, alt: d.alt, renk: d.renk, ozel: false }; });
    return { kartlar: kartlar, desteler: desteler, log: log, yeniGunluk: 10, yon: "en", otoSes: true };
  }

  /* ── Aralıklı tekrar ── */
  function sonraki(c, n) {
    var x = { durum: c.durum, adim: c.adim, aralik: c.aralik, kolaylik: c.kolaylik, vade: 0, sure: 0 }, simdi = Date.now();
    if (c.durum === "yeni" || c.durum === "ogren") {
      var yeni = c.durum === "yeni", a0 = yeni ? 0 : c.adim, ileri = yeni ? 1 : c.adim + 1;
      if (n === 0) { x.durum = "ogren"; x.adim = 0; x.sure = ADIMLAR[0]; }
      else if (n === 1) { x.durum = "ogren"; x.adim = a0; x.sure = Math.round((ADIMLAR[a0] + (ADIMLAR[a0 + 1] || ADIMLAR[a0] * 1.5)) / 2); }
      else if (n === 2 && ileri < ADIMLAR.length) { x.durum = "ogren"; x.adim = ileri; x.sure = ADIMLAR[ileri]; }
      else { x.durum = "tekrar"; x.adim = 0; x.aralik = n === 3 ? Math.max(4, (c.aralik || 0) + 1) : Math.max(1, c.aralik || 1); x.sure = x.aralik * GUN; }
    } else {
      var gec = Math.max(0, (simdi - c.vade) / GUN);
      if (n === 0) { x.durum = "ogren"; x.adim = 0; x.kolaylik = Math.max(1.3, c.kolaylik - 0.2); x.aralik = Math.max(1, Math.round(c.aralik * 0.5)); x.sure = ADIMLAR[0]; }
      else if (n === 1) { x.kolaylik = Math.max(1.3, c.kolaylik - 0.15); x.aralik = Math.max(c.aralik + 1, Math.round(c.aralik * 1.2)); }
      else if (n === 2) { x.aralik = Math.max(c.aralik + 1, Math.round((c.aralik + gec / 2) * c.kolaylik)); }
      else { x.kolaylik = c.kolaylik + 0.15; x.aralik = Math.max(c.aralik + 2, Math.round((c.aralik + gec) * c.kolaylik * 1.3)); }
      if (n > 0) x.sure = x.aralik * GUN;
    }
    x.aralik = Math.min(x.aralik, 3650);
    x.vade = simdi + x.sure;
    return x;
  }
  function sureYaz(ms) {
    var d = ms / DK;
    if (d < 60) return Math.max(1, Math.round(d)) + " dk";
    if (d < 1380) return Math.max(1, Math.round(d / 60)) + " sa";
    var g = d / 1440;
    if (g < 30) return Math.round(g) + " gün";
    if (g < 365) return Math.round(g / 30) + " ay";
    return String(Math.round(g / 36.5) / 10).replace(".", ",") + " yıl";
  }
  function bugunLog() { var t = bugun(); return V.log[t] || (V.log[t] = { yeni: 0, tekrar: 0, dogru: 0, toplam: 0, sn: 0 }); }
  function desteKartlari(id) { return V.kartlar.filter(function (c) { return !id || c.deste === id; }); }
  function sayim(id) {
    var l = desteKartlari(id), son = gunSonu(), simdi = Date.now(), o = { yeni: 0, ogren: 0, tekrar: 0, toplamYeni: 0, toplam: l.length, olgun: 0, genc: 0 };
    l.forEach(function (c) {
      if (c.durum === "yeni") o.toplamYeni++;
      else if (c.durum === "ogren") { if (c.vade <= simdi + 20 * DK) o.ogren++; }
      else { if (c.vade <= son) o.tekrar++; if (c.aralik >= 21) o.olgun++; else o.genc++; }
    });
    var kalanYeni = Math.max(0, V.yeniGunluk - (V.log[bugun()] ? V.log[bugun()].yeni : 0));
    o.yeni = Math.min(o.toplamYeni, kalanYeni);
    return o;
  }
  function seri() { var t = bugun(), s = 0; if (!V.log[t] || !V.log[t].toplam) t = gunEkle(t, -1); while (V.log[t] && V.log[t].toplam) { s++; t = gunEkle(t, -1); } return s; }
  function deste(id) { for (var i = 0; i < V.desteler.length; i++) if (V.desteler[i].id === id) return V.desteler[i]; return null; }

  /* ── Yardımcılar ── */
  function tost(m) { var t = $("#tost"); t.textContent = m; t.classList.add("acik"); clearTimeout(tost.z); tost.z = setTimeout(function () { t.classList.remove("acik"); }, 2600); }
  function titret(d) { try { if (navigator.vibrate) navigator.vibrate(d); } catch (e) {} }
  var sesVar = "speechSynthesis" in window, sesler = [];
  function sesYukle() { try { sesler = speechSynthesis.getVoices().filter(function (v) { return /^en(-|_)US/i.test(v.lang); }); } catch (e) {} }
  if (sesVar) { sesYukle(); try { speechSynthesis.onvoiceschanged = sesYukle; } catch (e) {} }
  function soyle(metin, dugme) {
    if (!sesVar) { tost("Bu tarayıcı sesli okumayı desteklemiyor"); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(metin.replace(/^to /, "")); u.lang = "en-US"; u.rate = 0.9;
      if (sesler.length) u.voice = sesler.filter(function (v) { return /Google|Samantha|Aria|Jenny/i.test(v.name); })[0] || sesler[0];
      if (dugme) { dugme.classList.add("caliyor"); u.onend = u.onerror = function () { dugme.classList.remove("caliyor"); }; }
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function vurgula(cumle, kelime) {
    var k = kacir(cumle), w = kelime.replace(/^to /, "").split(/[ -]/)[0];
    if (w.length < 3) return k;
    w = w.replace(/[^a-z]/gi, ""); if (w.length < 3) return k;
    var re = new RegExp("\\b(" + w.slice(0, Math.max(3, w.length - 1)) + "[a-z]*)", "i");
    return k.replace(re, "<mark>$1</mark>");
  }

  /* ── Bugün ── */
  function bugunEkrani() {
    var o = sayim(), toplam = o.yeni + o.ogren + o.tekrar, lg = V.log[bugun()];
    var satirlar = V.desteler.map(function (d) {
      var s = sayim(d.id), l = desteKartlari(d.id), toplamD = l.length || 1;
      var ogrenilen = l.filter(function (c) { return c.durum === "tekrar"; }).length;
      return '<button type="button" class="deste" style="--r:' + d.renk + '" data-calis="' + d.id + '"><span class="deste-renk">' + kacir(d.ad.charAt(0)) + '</span><span class="deste-bilgi"><b>' + kacir(d.ad) + '</b><span>' + l.length + " kelime · yüzde " + Math.round(100 * ogrenilen / toplamD) + ' öğrenildi</span><span class="ilerleme-cubuk"><i style="width:' + (100 * s.olgun / toplamD) + '%;background:' + d.renk + '"></i><i style="width:' + (100 * s.genc / toplamD) + '%;background:' + d.renk + ';opacity:.45"></i></span></span>' +
        '<span class="vade">' + (s.tekrar + s.ogren ? '<span class="rozet yesil">' + (s.tekrar + s.ogren) + " tekrar</span>" : "") + (s.yeni ? '<span class="rozet mavi">' + s.yeni + " yeni</span>" : "") + (!s.tekrar && !s.ogren && !s.yeni ? '<span class="rozet gri">Bitti</span>' : "") + "</span></button>";
    }).join("");
    return '<div class="giris"><header class="ust"><div><p>' + tarihYaz(bugun(), { weekday: "long" }) + (seri() ? " · " + seri() + " gündür seride" : "") + '</p><h1>Kelime <em>kutun</em><br />hazır</h1></div><button type="button" class="ikon-dugme" data-ayarlar aria-label="Ayarlar">' + AYAR + '</button></header>' +
      '<section class="gunun"><small>Bugün çalışılacak</small><div class="buyuk"><b>' + toplam + '</b><span>kart</span></div><div class="sayaclar"><span><i style="background:#7fa2ff"></i>' + o.yeni + ' yeni</span><span><i style="background:#ff8f8c"></i>' + o.ogren + ' öğreniliyor</span><span><i style="background:#5fd6a1"></i>' + o.tekrar + ' tekrar</span></div>' +
      (toplam ? '<button type="button" class="dugme hardal tam" data-calis="">Çalışmaya başla</button>' : '<button type="button" class="dugme hardal tam" disabled>Bugünlük hepsi tamam</button>') + '</section>' +
      (lg && lg.toplam ? '<div class="ipucu">' + S('<path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M18.4 5.6 17 7M21 12h-2M9 17h6M10 21h4M8.5 14a5 5 0 1 1 7 0c-.8.7-1.5 1.6-1.5 3h-4c0-1.4-.7-2.3-1.5-3z"/>') + '<span>Bugün <b>' + lg.toplam + ' kart</b> çalıştın, yüzde ' + Math.round(100 * lg.dogru / lg.toplam) + ' doğru. Tekrarı kaçırmamak için yarın da birkaç dakika ayır.</span></div>' : "") +
      '<div class="bolum"><h2>Desteler</h2><button type="button" data-sekme="desteler">Tümünü yönet</button></div><div class="desteler">' + satirlar + "</div></div>";
  }

  /* ── Desteler ── */
  function destelerEkrani() {
    return '<div class="giris"><header class="ust"><div><p>' + V.kartlar.length + " kelime, " + V.desteler.length + ' deste</p><h1>Desteler</h1></div><button type="button" class="ikon-dugme" data-yeni-deste aria-label="Yeni deste">' + ARTI + '</button></header><div class="desteler" style="margin-top:18px">' +
      V.desteler.map(function (d) {
        var l = desteKartlari(d.id), s = sayim(d.id);
        return '<button type="button" class="deste" style="--r:' + d.renk + '" data-deste="' + d.id + '"><span class="deste-renk">' + kacir(d.ad.charAt(0)) + '</span><span class="deste-bilgi"><b>' + kacir(d.ad) + '</b><span>' + kacir(d.alt || "Kendi destem") + '</span><span class="ilerleme-cubuk"><i style="width:' + (100 * s.olgun / (l.length || 1)) + '%;background:' + d.renk + '"></i><i style="width:' + (100 * s.genc / (l.length || 1)) + '%;background:' + d.renk + ';opacity:.45"></i></span></span><span class="vade"><span class="rozet gri">' + l.length + "</span></span></button>";
      }).join("") + '</div><button type="button" class="dugme ikincil tam" style="margin-top:12px" data-yeni-deste>' + ARTI + "Yeni deste oluştur</button></div>";
  }
  var aramaMetni = "";
  function desteAc(id) {
    var d = deste(id); if (!d) return;
    aramaMetni = "";
    sayfaAc('<div class="sayfa-ust"><div><h2>' + kacir(d.ad) + '</h2><p id="desteAlt"></p></div><button type="button" class="kapat" data-kapat aria-label="Kapat">' + CARPI + '</button></div>' +
      '<form class="ekle-kutu" id="kelimeForm" data-deste-id="' + d.id + '"><div class="iki"><label class="alan"><span>İngilizce</span><input class="girdi" name="en" required maxlength="60" autocomplete="off" placeholder="to whisper" /></label><label class="alan"><span>Türkçe</span><input class="girdi" name="tr" required maxlength="80" autocomplete="off" placeholder="fısıldamak" /></label></div>' +
      '<label class="alan"><span>Kullanım cümlesi (isteğe bağlı)</span><input class="girdi" name="ornek" maxlength="160" autocomplete="off" placeholder="She whispered his name." /></label><button type="submit" class="dugme tam">' + ARTI + 'Kelime ekle</button></form>' +
      '<input class="girdi" type="search" id="ara" placeholder="Bu destede ara" aria-label="Bu destede ara" style="margin-bottom:6px" /><div class="kelime-liste" id="kelimeListe"></div>' +
      '<div class="eylemler"><button type="button" class="dugme" data-calis="' + d.id + '">Desteyi çalış</button><button type="button" class="dugme ikincil" data-sifirla="' + d.id + '">İlerlemeyi sıfırla</button></div>' +
      (d.ozel ? '<button type="button" class="dugme tehlike tam" style="margin-top:8px" data-deste-sil="' + d.id + '">Desteyi sil</button>' : ""));
    listeCiz(d.id);
  }
  function listeCiz(id) {
    var el = $("#kelimeListe"); if (!el) return;
    var q = aramaMetni.toLocaleLowerCase("tr"), simdi = Date.now();
    var l = desteKartlari(id), s = sayim(id);
    $("#desteAlt").textContent = l.length + " kelime · " + s.olgun + " olgun · " + s.genc + " genç · " + s.toplamYeni + " yeni";
    var gor = l.filter(function (c) { return !q || (c.en + " " + c.tr).toLocaleLowerCase("tr").indexOf(q) >= 0; });
    el.innerHTML = gor.slice(0, 200).map(function (c) {
      var rz = c.durum === "yeni" ? '<span class="rozet mavi">Yeni</span>' : c.durum === "ogren" ? '<span class="rozet mercan">Öğreniliyor</span>' : c.vade <= gunSonu() ? '<span class="rozet yesil">Bugün</span>' : '<span class="rozet gri">' + sureYaz(c.vade - simdi) + " sonra</span>";
      return '<div class="ks"><div><b>' + kacir(c.en) + "</b><span>" + kacir(c.tr) + "</span></div>" + rz + '<button type="button" class="sil" data-kelime-sil="' + c.id + '" aria-label="' + kacir(c.en) + ' sil">' + CARPI + "</button></div>";
    }).join("") || '<p style="color:var(--soluk);text-align:center;padding:16px 0">Eşleşen kelime yok.</p>';
  }

  /* ── İlerleme ── */
  function ilerlemeEkrani() {
    var t = bugun(), toplamCalisma = 0, dogru = 0, otuzT = 0;
    for (var k in V.log) { toplamCalisma += V.log[k].toplam; if (k >= gunEkle(t, -29)) { dogru += V.log[k].dogru; otuzT += V.log[k].toplam; } }
    var en = 1, gunler = [];
    for (var i = 13; i >= 0; i--) { var g = gunEkle(t, -i), x = V.log[g] || { yeni: 0, tekrar: 0 }; gunler.push([g, x]); en = Math.max(en, x.yeni + x.tekrar); }
    var cub = gunler.map(function (p, i) {
      var x = p[1], h = 100 * (x.yeni + x.tekrar) / en;
      return '<div class="cubuk"><div class="yigin" style="height:' + Math.max(2, h) + '%"><i style="flex:' + (x.tekrar || 0) + ';background:var(--murekkep)"></i><i style="flex:' + (x.yeni || 0) + ';background:var(--mavi)"></i></div><small>' + (i === 13 ? "Bugün" : i % 2 ? Number(p[0].slice(8)) : "") + "</small></div>";
    }).join("");
    var tahmin = [], enT = 1, simdi = Date.now();
    for (var j = 0; j < 7; j++) {
      var bas = j === 0 ? 0 : simdi + (j - 1) * GUN + (1440 - istanbul().dakika) * DK, bit = simdi + j * GUN + (1440 - istanbul().dakika) * DK;
      var n = V.kartlar.filter(function (c) { return c.durum !== "yeni" && c.vade > bas && c.vade <= bit; }).length;
      tahmin.push(n); enT = Math.max(enT, n);
    }
    var tah = tahmin.map(function (n, j) { var g = gunEkle(t, j); return '<div class="cubuk"><div class="yigin" style="height:' + Math.max(2, 100 * n / enT) + '%"><i style="flex:1;background:' + (j === 0 ? "var(--hardal)" : "var(--yesil)") + '"></i></div><small>' + (j === 0 ? "Bugün" : GUN_KISA[haftaGunu(g)]) + "<br /><b style=\"color:var(--murekkep)\">" + n + "</b></small></div>"; }).join("");
    var o = sayim(), ogren = V.kartlar.filter(function (c) { return c.durum === "ogren"; }).length, top = V.kartlar.length || 1;
    var parca = [[o.toplamYeni, "var(--mavi)", "Yeni"], [ogren, "var(--mercan)", "Öğreniliyor"], [o.genc, "#7fd1ab", "Genç"], [o.olgun, "var(--yesil)", "Olgun"]];
    return '<div class="giris"><header class="ust"><div><p>Son 30 gün</p><h1>İlerleme</h1></div></header>' +
      '<div class="olcu-izgara"><div class="olcu koyu"><span>Seri</span><b>' + seri() + ' gün</b><small>her gün biraz</small></div><div class="olcu"><span>Doğruluk</span><b>yüzde ' + (otuzT ? Math.round(100 * dogru / otuzT) : 0) + '</b><small>son 30 gün</small></div>' +
      '<div class="olcu"><span>Öğrenilen kelime</span><b>' + (o.genc + o.olgun) + '</b><small>' + o.olgun + ' tanesi olgun</small></div><div class="olcu"><span>Toplam tekrar</span><b>' + toplamCalisma.toLocaleString("tr-TR") + '</b><small>tüm zamanlar</small></div></div>' +
      '<section class="kart"><div class="kart-ust"><h3>Günlük çalışma</h3><span>son 14 gün</span></div><div class="cubuklar">' + cub + '</div><div class="lejant"><span><i style="background:var(--mavi)"></i>Yeni kart</span><span><i style="background:var(--murekkep)"></i>Tekrar</span></div></section>' +
      '<section class="kart"><div class="kart-ust"><h3>Önümüzdeki 7 gün</h3><span>' + tahmin.reduce(function (a, b) { return a + b; }, 0) + ' tekrar bekliyor</span></div><div class="cubuklar" style="height:100px">' + tah + '</div></section>' +
      '<section class="kart"><div class="kart-ust"><h3>Kart durumları</h3><span>' + V.kartlar.length + ' kart</span></div><div class="durum-cubuk">' + parca.map(function (p) { return p[0] ? '<i style="flex:' + p[0] + ";background:" + p[1] + '"></i>' : ""; }).join("") + '</div><div class="lejant">' + parca.map(function (p) { return '<span><i style="background:' + p[1] + '"></i>' + p[2] + " " + p[0] + "</span>"; }).join("") + '</div><p style="margin:12px 0 0;color:var(--soluk);font-size:12.5px">Genç: aralığı 21 günden kısa. Olgun: 21 gün ve üstü, büyük olasılıkla kalıcı.</p></section></div>';
  }

  function goster(s, sessiz) {
    aktif = s;
    var e = $("#ekran"), y = scrollY;
    e.innerHTML = s === "desteler" ? destelerEkrani() : s === "ilerleme" ? ilerlemeEkrani() : bugunEkrani();
    if (sessiz) { e.firstElementChild.classList.remove("giris"); scrollTo(0, y); } else scrollTo(0, 0);
    $$(".sekmeler button").forEach(function (b) { var a = b.dataset.sekme === s; b.classList.toggle("secili", a); if (a) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    var k = $("#kenarSag"), o = sayim();
    if (k) k.innerHTML = '<div><b>' + (o.yeni + o.ogren + o.tekrar) + '</b><span>kart bugün seni bekliyor</span></div><div><b>' + seri() + ' gün</b><span>çalışma serisi</span></div><div><b>' + (o.genc + o.olgun) + '</b><span>öğrenilmiş kelime</span></div>';
  }

  /* ── Alt sayfa ── */
  var sayfa = $("#sayfa"), perde = $("#perde"), oncekiOdak = null;
  function sayfaAc(html) {
    oncekiOdak = document.activeElement;
    sayfa.innerHTML = '<span class="tutamak" data-tutamak aria-hidden="true"></span>' + html;
    sayfa.classList.remove("kapaniyor"); sayfa.style.transform = ""; sayfa.hidden = false; perde.hidden = false; sayfa.scrollTop = 0;
    var h = sayfa.querySelector("h2"); if (h) { h.id = "sayfaBaslik"; h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function sayfaKapat() {
    if (sayfa.hidden) return;
    sayfa.classList.add("kapaniyor"); perde.hidden = true;
    setTimeout(function () { sayfa.hidden = true; sayfa.innerHTML = ""; sayfa.classList.remove("kapaniyor"); sayfa.style.transform = ""; }, 240);
    if (oncekiOdak && oncekiOdak.focus && document.contains(oncekiOdak)) oncekiOdak.focus({ preventScroll: true });
  }
  perde.addEventListener("click", sayfaKapat);
  sayfa.addEventListener("pointerdown", function (e) {
    if (!e.target.closest("[data-tutamak]")) return;
    var y0 = e.clientY, dy = 0; sayfa.style.transition = "none";
    function m(ev) { dy = Math.max(0, ev.clientY - y0); sayfa.style.transform = "translate(-50%, " + dy + "px)"; }
    function b() { removeEventListener("pointermove", m); removeEventListener("pointerup", b); sayfa.style.transition = ""; if (dy > 110) sayfaKapat(); else sayfa.style.transform = ""; }
    addEventListener("pointermove", m); addEventListener("pointerup", b);
  });
  function ayarlarAc() {
    sayfaAc('<div class="sayfa-ust"><h2>Ayarlar</h2><button type="button" class="kapat" data-kapat aria-label="Kapat">' + CARPI + '</button></div>' +
      '<div class="satir"><div><b>Günde yeni kart</b><span>Her gün tanışacağın yeni kelime sayısı</span></div><div class="adim"><button type="button" data-yeni-adim="-5" aria-label="Azalt">' + EKSI + '</button><output id="yeniSayi">' + V.yeniGunluk + '</output><button type="button" data-yeni-adim="5" aria-label="Artır">' + ARTI + "</button></div></div>" +
      '<div class="satir dikey"><b>Kartın ön yüzü</b><span>Hangi dilden hangisine çalışacağın</span><div class="parcali" role="group" aria-label="Yön">' + [["en", "İngilizce"], ["tr", "Türkçe"], ["karisik", "Karışık"]].map(function (x) { return '<button type="button" data-yon="' + x[0] + '"' + (V.yon === x[0] ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ">" + x[1] + "</button>"; }).join("") + "</div></div>" +
      '<label class="satir"><div><b>Otomatik seslendir</b><span>İngilizce yüz göründüğünde telaffuzu oku</span></div><span class="anahtar"><input type="checkbox" id="otoSes"' + (V.otoSes ? " checked" : "") + ' /><i></i></span></label>' +
      '<div class="satir"><div><b>Her şeyi baştan başlat</b><span>İlerleme ve kendi kelimelerin silinir</span></div><button type="button" class="dugme tehlike" style="min-height:40px;padding:0 14px" data-hepsini-sil>Sıfırla</button></div>');
  }
  function yeniDesteAc() {
    var secili = RENKLER[V.desteler.length % RENKLER.length];
    sayfaAc('<div class="sayfa-ust"><h2>Yeni deste</h2><button type="button" class="kapat" data-kapat aria-label="Kapat">' + CARPI + '</button></div><form id="desteForm"><label class="alan"><span>Deste adı</span><input class="girdi" name="ad" required maxlength="40" placeholder="Örneğin: Sınav kelimeleri" /></label><label class="alan"><span>Kısa açıklama</span><input class="girdi" name="alt" maxlength="60" placeholder="Nerede kullanacaksın?" /></label><div class="alan"><span>Renk</span><div class="renkler">' + RENKLER.map(function (c) { return '<button type="button" data-renk="' + c + '" style="--c:' + c + '"' + (c === secili ? ' class="secili"' : "") + ' aria-label="Renk"></button>'; }).join("") + '</div></div><input type="hidden" name="renk" value="' + secili + '" /><button type="submit" class="dugme tam" style="margin-top:6px">Desteyi oluştur</button></form>');
  }

  /* ── Çalışma ── */
  var C = null, calisma = $("#calisma");
  function kuyrukKur(desteId) {
    var simdi = Date.now(), son = gunSonu(), l = desteKartlari(desteId || null);
    var ogren = l.filter(function (c) { return c.durum === "ogren" && c.vade <= simdi + 20 * DK; }).sort(function (a, b) { return a.vade - b.vade; });
    var tekrar = l.filter(function (c) { return c.durum === "tekrar" && c.vade <= son; }).sort(function (a, b) { return a.vade - b.vade; });
    var kalan = Math.max(0, V.yeniGunluk - (V.log[bugun()] ? V.log[bugun()].yeni : 0));
    var yeni = l.filter(function (c) { return c.durum === "yeni"; }).sort(function (a, b) { return a.eklenme - b.eklenme; }).slice(0, kalan);
    var q = ogren.concat(tekrar), adim = yeni.length ? Math.max(1, Math.floor(q.length / yeni.length)) : 1;
    yeni.forEach(function (c, i) { q.splice(Math.min(q.length, (i + 1) * adim + i), 0, c); });
    return q.map(function (c) { return c.id; });
  }
  function calismaBaslat(desteId) {
    var q = kuyrukKur(desteId);
    if (!q.length) { tost("Bu destede şimdilik çalışılacak kart yok"); return; }
    sayfaKapat();
    C = { deste: desteId, sira: q, toplam: q.length, bitenler: 0, dogru: 0, yanlis: 0, bas: Date.now(), donuk: false, kart: null, yonu: "en" };
    calisma.hidden = false; document.body.style.overflow = "hidden";
    calismaCiz();
  }
  function kartBul(id) { for (var i = 0; i < V.kartlar.length; i++) if (V.kartlar[i].id === id) return V.kartlar[i]; return null; }
  function sayacHtml() {
    var y = 0, o = 0, t = 0, simdi = Date.now();
    C.sira.forEach(function (id) { var c = kartBul(id); if (!c) return; if (c.durum === "yeni") y++; else if (c.durum === "ogren") o++; else t++; });
    var a = C.kart ? C.kart.durum : "";
    return '<span style="color:var(--mavi)"' + (a === "yeni" ? ' class="etkin"' : "") + '>' + y + '</span><span style="color:var(--mercan)"' + (a === "ogren" ? ' class="etkin"' : "") + '>' + o + '</span><span style="color:var(--yesil)"' + (a === "tekrar" ? ' class="etkin"' : "") + '>' + t + "</span>";
  }
  function calismaCiz() {
    var simdi = Date.now();
    while (C.sira.length && !kartBul(C.sira[0])) C.sira.shift();
    if (!C.sira.length) return bitisCiz();
    var c = kartBul(C.sira[0]);
    if (c.durum === "ogren" && c.vade > simdi + 20 * DK && C.sira.length > 1) { C.sira.push(C.sira.shift()); c = kartBul(C.sira[0]); }
    C.kart = c; C.donuk = false;
    C.yonu = V.yon === "karisik" ? (Math.random() < 0.5 ? "en" : "tr") : V.yon;
    var d = deste(c.deste) || { renk: "#3d6fea", ad: "" };
    var on = C.yonu === "en" ? c.en : c.tr, arkaSoru = C.yonu === "en" ? c.en : c.tr, arkaCevap = C.yonu === "en" ? c.tr : c.en;
    var etiket = c.durum === "yeni" ? ["Yeni", "var(--mavi)"] : c.durum === "ogren" ? ["Öğreniliyor", "var(--mercan)"] : ["Tekrar", "var(--yesil)"];
    var ilerleme = C.toplam ? Math.min(100, 100 * C.bitenler / (C.bitenler + C.sira.length)) : 0;
    calisma.innerHTML = '<div class="calisma-ic"><div class="cal-ust"><button type="button" class="ikon-dugme" data-cal-kapat aria-label="Çalışmayı bitir">' + CARPI + '</button><div class="cal-ilerleme" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(ilerleme) + '"><i style="width:' + ilerleme + '%"></i></div><div class="cal-sayac" aria-label="Kalan kartlar: yeni, öğreniliyor, tekrar">' + sayacHtml() + "</div></div>" +
      '<div class="sahne"><div class="kartvizit" id="kartvizit" style="--r:' + d.renk + '" tabindex="0" role="button" aria-label="Kartı çevir"><span class="damga sol" id="damgaSol">Tekrar</span><span class="damga sag" id="damgaSag">Biliyorum</span><div class="cevir">' +
      '<div class="yuz"><div class="yuz-ust"><span class="etiket"><i style="background:' + etiket[1] + '"></i>' + etiket[0] + " · " + kacir(d.ad) + "</span>" + (C.yonu === "en" ? '<button type="button" class="konus" data-konus aria-label="Telaffuzu dinle">' + HOPARLOR + "</button>" : "") + '</div><div class="kelime"><b>' + kacir(on) + "</b><span>" + (C.yonu === "en" ? "Türkçesi ne?" : "İngilizcesi ne?") + '</span></div><p class="dokun-ipucu">Dokun ya da boşluk tuşuna bas</p></div>' +
      '<div class="yuz arka-yuz"><div class="yuz-ust"><span class="etiket"><i style="background:' + etiket[1] + '"></i>' + etiket[0] + '</span><button type="button" class="konus" data-konus aria-label="Telaffuzu dinle">' + HOPARLOR + '</button></div><div class="anlam"><div class="soru">' + kacir(arkaSoru) + '</div><div class="cevap">' + kacir(arkaCevap) + "</div></div>" +
      (c.ornek ? '<div class="ornek"><p>' + vurgula(c.ornek, c.en) + "</p>" + (c.ornekTr ? "<p>" + kacir(c.ornekTr) + "</p>" : "") + "</div>" : "") + "</div></div></div></div>" +
      '<div class="cal-alt" id="calAlt">' + altCiz() + "</div></div>";
    surukleBagla();
    var kvOdak = $("#kartvizit"); if (kvOdak) kvOdak.focus({ preventScroll: true });
    if (V.otoSes && C.yonu === "en") setTimeout(function () { soyle(c.en); }, 250);
  }
  function altCiz() {
    if (!C.donuk) return '<button type="button" class="dugme tam" data-cevir style="min-height:58px">Cevabı göster</button><p class="kaydir-ipucu">Sola kaydır: tekrar · sağa kaydır: biliyorum</p>';
    return '<div class="notlar">' + [0, 1, 2, 3].map(function (n) { return '<button type="button" data-not="' + n + '">' + NOT_AD[n] + "<small>" + sureYaz(sonraki(C.kart, n).sure) + "</small></button>"; }).join("") + '</div><p class="kaydir-ipucu">Klavyede 1, 2, 3, 4 tuşları da çalışır</p>';
  }
  function cevir() {
    if (!C || !C.kart) return;
    C.donuk = !C.donuk;
    $("#kartvizit").classList.toggle("donuk", C.donuk);
    $("#calAlt").innerHTML = altCiz();
    if (C.donuk && V.otoSes && C.yonu === "tr") soyle(C.kart.en);
  }
  function notVer(n) {
    if (!C || !C.kart) return;
    var c = C.kart, x = sonraki(c, n), lg = bugunLog(), yeniydi = c.durum === "yeni";
    if (yeniydi) lg.yeni++; else lg.tekrar++;
    lg.toplam++; if (n > 0) { lg.dogru++; C.dogru++; } else { c.hata++; C.yanlis++; }
    c.durum = x.durum; c.adim = x.adim; c.aralik = x.aralik; c.kolaylik = Math.round(x.kolaylik * 100) / 100; c.vade = x.vade; c.tekrar++;
    C.sira.shift();
    if (c.durum === "ogren") { var yer = Math.min(C.sira.length, n === 0 ? 3 : 6); C.sira.splice(yer, 0, c.id); }
    else C.bitenler++;
    kaydet(); titret(n === 0 ? [15, 40, 15] : 10);
    var kv = $("#kartvizit");
    kv.classList.add("gecis"); kv.style.transform = "translateX(" + (n === 0 ? -120 : 120) + "%) rotate(" + (n === 0 ? -14 : 14) + "deg)"; kv.style.opacity = 0;
    setTimeout(calismaCiz, 230);
  }
  function surukleBagla() {
    var kv = $("#kartvizit"); if (!kv) return;
    var x0 = 0, y0 = 0, dx = 0, aktifS = false, hareket = false;
    kv.addEventListener("pointerdown", function (e) { if (e.target.closest("[data-konus]")) return; x0 = e.clientX; y0 = e.clientY; dx = 0; aktifS = true; hareket = false; kv.classList.remove("gecis"); try { kv.setPointerCapture(e.pointerId); } catch (x) {} });
    kv.addEventListener("pointermove", function (e) {
      if (!aktifS) return;
      dx = e.clientX - x0; var dy = e.clientY - y0;
      if (!hareket && Math.abs(dx) < 8) return;
      if (!hareket && Math.abs(dy) > Math.abs(dx)) { aktifS = false; return; }
      hareket = true;
      kv.style.transform = "translateX(" + dx + "px) rotate(" + dx / 18 + "deg)";
      var o = Math.min(1, Math.abs(dx) / 110);
      $("#damgaSol").style.opacity = dx < 0 ? o : 0; $("#damgaSag").style.opacity = dx > 0 ? o : 0;
    });
    function birak() {
      if (!aktifS) return; aktifS = false;
      if (!hareket) { cevir(); return; }
      if (Math.abs(dx) > 110) { notVer(dx < 0 ? 0 : 2); return; }
      kv.classList.add("gecis"); kv.style.transform = ""; $("#damgaSol").style.opacity = 0; $("#damgaSag").style.opacity = 0;
    }
    kv.addEventListener("pointerup", birak); kv.addEventListener("pointercancel", function () { aktifS = false; kv.classList.add("gecis"); kv.style.transform = ""; });
    kv.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); cevir(); } });
  }
  function bitisCiz() {
    var sn = Math.round((Date.now() - C.bas) / 1000), lg = bugunLog(); lg.sn += sn; kaydet();
    var yarin = V.kartlar.filter(function (c) { return c.durum !== "yeni" && c.vade > gunSonu() && c.vade <= gunSonu() + GUN; }).length;
    var cevap = C.dogru + C.yanlis, oran = cevap ? Math.round(100 * C.dogru / cevap) : 0;
    calisma.innerHTML = '<div class="calisma-ic"><div class="cal-ust"><button type="button" class="ikon-dugme" data-cal-kapat aria-label="Kapat">' + CARPI + '</button><div class="cal-ilerleme"><i style="width:100%"></i></div></div><div class="bitti"><div class="rozet-buyuk">' + S('<path d="M5 12.5l4.5 4.5L19 7.5"/>') + '</div><h2>Bugünlük bu kadar!</h2><p>Beynin şimdi bu kelimeleri yerleştiriyor. Yarın ' + (yarin ? "<b>" + yarin + " kart</b> seni bekliyor." : "yeni kelimelerle devam.") + '</p><div class="ucgen"><div><b>' + C.bitenler + '</b><span>kart</span></div><div><b>yüzde ' + oran + '</b><span>doğru</span></div><div><b>' + Math.max(1, Math.round(sn / 60)) + ' dk</b><span>süre</span></div></div><button type="button" class="dugme hardal tam" data-cal-kapat>Ana ekrana dön</button></div></div>';
    C = null;
  }
  function calismaKapat() { calisma.hidden = true; calisma.innerHTML = ""; document.body.style.overflow = ""; if (C) { var lg = bugunLog(); lg.sn += Math.round((Date.now() - C.bas) / 1000); kaydet(); } C = null; try { speechSynthesis.cancel(); } catch (e) {} goster(aktif, true); }

  /* ── Olaylar ── */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var d = b.dataset;
    if (d.sekme) { sayfaKapat(); return goster(d.sekme); }
    if (d.calis !== undefined) return calismaBaslat(d.calis || null);
    if (d.deste) return desteAc(d.deste);
    if (d.kapat !== undefined) return sayfaKapat();
    if (d.ayarlar !== undefined) return ayarlarAc();
    if (d.yeniDeste !== undefined) return yeniDesteAc();
    if (d.renk) { $$("[data-renk]").forEach(function (x) { x.classList.toggle("secili", x === b); }); $('#desteForm [name="renk"]').value = d.renk; return; }
    if (d.yeniAdim) { V.yeniGunluk = Math.max(0, Math.min(50, V.yeniGunluk + Number(d.yeniAdim))); kaydet(); $("#yeniSayi").textContent = V.yeniGunluk; return goster(aktif, true); }
    if (d.yon) { V.yon = d.yon; kaydet(); $$("[data-yon]").forEach(function (x) { var s = x === b; x.classList.toggle("secili", s); x.setAttribute("aria-pressed", String(s)); }); return; }
    if (d.hepsiniSil !== undefined) { if (b.dataset.onay !== "1") { b.dataset.onay = "1"; b.textContent = "Emin misin?"; return; } localStorage.removeItem(ANAHTAR); V = yukle(); sayfaKapat(); goster("bugun"); return tost("Her şey baştan başladı"); }
    if (d.kelimeSil) { var k = kartBul(d.kelimeSil), did = k.deste; V.kartlar = V.kartlar.filter(function (c) { return c.id !== d.kelimeSil; }); kaydet(); listeCiz(did); goster(aktif, true); return tost(k.en + " silindi"); }
    if (d.sifirla) { if (b.dataset.onay !== "1") { b.dataset.onay = "1"; b.textContent = "Emin misin?"; return; } desteKartlari(d.sifirla).forEach(function (c) { c.durum = "yeni"; c.adim = 0; c.aralik = 0; c.kolaylik = 2.5; c.vade = 0; c.tekrar = 0; c.hata = 0; }); kaydet(); listeCiz(d.sifirla); goster(aktif, true); b.dataset.onay = ""; b.textContent = "İlerlemeyi sıfırla"; return tost("Deste ilerlemesi sıfırlandı"); }
    if (d.desteSil) { if (b.dataset.onay !== "1") { b.dataset.onay = "1"; b.textContent = "Emin misin? Kelimeleri de silinir"; return; } V.desteler = V.desteler.filter(function (x) { return x.id !== d.desteSil; }); V.kartlar = V.kartlar.filter(function (c) { return c.deste !== d.desteSil; }); kaydet(); sayfaKapat(); goster(aktif, true); return tost("Deste silindi"); }
    if (d.calKapat !== undefined) return calismaKapat();
    if (d.cevir !== undefined) return cevir();
    if (d.not !== undefined) return notVer(Number(d.not));
    if (d.konus !== undefined) { e.stopPropagation(); return soyle(C && C.kart ? C.kart.en : "", b); }
  });
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, v = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
    if (f.id === "kelimeForm") {
      var did = f.dataset.desteId, en = v("en"), tr = v("tr");
      if (!en || !tr) return tost("İngilizce ve Türkçe alanlarını doldur");
      if (V.kartlar.some(function (c) { return c.deste === did && c.en.toLowerCase() === en.toLowerCase(); })) return tost(en + " bu destede zaten var");
      V.kartlar.push({ id: did + "-" + Date.now().toString(36), deste: did, en: en, tr: tr, ornek: v("ornek"), ornekTr: "", durum: "yeni", adim: 0, aralik: 0, kolaylik: 2.5, vade: 0, tekrar: 0, hata: 0, eklenme: Date.now() });
      kaydet(); f.reset(); f.elements.en.focus(); listeCiz(did); goster(aktif, true); return tost(en + " eklendi");
    }
    if (f.id === "desteForm") {
      var ad = v("ad"); if (!ad) return tost("Desteye bir ad ver");
      var id = "d" + Date.now().toString(36);
      V.desteler.push({ id: id, ad: ad, alt: v("alt"), renk: v("renk") || RENKLER[0], ozel: true }); kaydet();
      goster("desteler"); desteAc(id); return tost("Deste oluşturuldu, şimdi kelime ekle");
    }
  });
  document.addEventListener("input", function (e) { if (e.target.id === "ara") { aramaMetni = e.target.value; var f = $("#kelimeForm"); if (f) listeCiz(f.dataset.desteId); } });
  document.addEventListener("change", function (e) { if (e.target.id === "otoSes") { V.otoSes = e.target.checked; kaydet(); } });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!sayfa.hidden) return sayfaKapat(); if (!calisma.hidden) return calismaKapat(); }
    if (calisma.hidden || !C || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === " " && !(e.target.closest && e.target.closest(".calisma button"))) { e.preventDefault(); cevir(); }
    if (C.donuk && /^[1-4]$/.test(e.key)) notVer(Number(e.key) - 1);
  });

  goster("bugun");
})();
`;

const IKON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="#14213d"/><rect x="120" y="150" width="230" height="270" rx="34" fill="#3d6fea" transform="rotate(-10 235 285)"/><rect x="160" y="110" width="230" height="270" rx="34" fill="#ffc23d"/><text x="275" y="285" text-anchor="middle" font-family="Georgia,serif" font-size="150" fill="#14213d">Aa</text></svg>';

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#edf0f7" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="description" content="Lügat: aralıklı tekrarla İngilizce kelime ezberi. Günlük hayat, iş İngilizcesi ve seyahat desteleri, telaffuz ve ilerleme grafikleri." />
  <title>Lügat · Kelime Ezberi</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="ikon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="arka" aria-hidden="true"></div>
  <aside class="kenar" aria-hidden="true">
    <div class="logo">${IKON.replace('xmlns="http://www.w3.org/2000/svg" ', "")}Lügat</div>
    <p>Aralıklı tekrar, bir kelimeyi tam unutmak üzereyken önüne getirir. Böylece az tekrarla kalıcı öğrenirsin.</p>
    <ol><li>Kartı gör, cevabı aklından söyle</li><li>Çevir, ne kadar kolay hatırladığını seç</li><li>Uygulama bir sonraki tekrarı ona göre planlar</li></ol>
  </aside>
  <aside class="kenar sag" id="kenarSag" aria-hidden="true"></aside>
  <main id="ekran" tabindex="-1"></main>

  <nav class="sekmeler" aria-label="Ana menü">
    <button type="button" data-sekme="bugun" class="secili" aria-current="page">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="13" height="16" rx="2.5"/><path d="M8 3h10.5A1.5 1.5 0 0 1 20 4.5V17"/></svg><span>Çalış</span>
    </button>
    <button type="button" data-sekme="desteler">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg><span>Desteler</span>
    </button>
    <button type="button" data-sekme="ilerleme">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19l5-6 4 3 7-9"/><path d="M15 7h5v5"/></svg><span>İlerleme</span>
    </button>
  </nav>

  <section id="calisma" class="calisma" role="dialog" aria-modal="true" aria-label="Çalışma" hidden></section>
  <div id="perde" class="perde" hidden></div>
  <section id="sayfa" class="alt-sayfa" role="dialog" aria-modal="true" aria-labelledby="sayfaBaslik" hidden></section>
  <div id="tost" class="tost" role="status" aria-live="polite"></div>
  <script>window.LUGAT_DESTELER = ${JSON.stringify(DESTELER).replace(/</g, "\\u003c")};</script>
  <script src="app.js"></script>
</body>
</html>
`;

export const KELIME_EZBER = {
  id: "kelime-ezber",
  ad: "Lügat · Kelime Ezberi",
  tur: "mobil" as const,
  aciklama: "Aralıklı tekrarla İngilizce kelime ezberi: örnek cümleli üç deste, kaydırmalı kartlar, telaffuz, kendi kelimelerin ve ilerleme grafikleri",
  kapak: "/gercek/build/sablon/kelime-ezber.webp",
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Lügat · Kelime Ezberi", short_name: "Lügat", description: "Aralıklı tekrarla İngilizce kelime ezberi.", lang: "tr", start_url: "./index.html", scope: "./", display: "standalone", orientation: "portrait", background_color: "#edf0f7", theme_color: "#edf0f7", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": IKON,
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
