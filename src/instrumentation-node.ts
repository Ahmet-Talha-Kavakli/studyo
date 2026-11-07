import { zamanlayiciBaslat } from "./lib/build/sistemMotoru";
import { zamanlayiciKur as buyumeZamanlayiciKur } from "./lib/build/buyumeEposta";
import { isletmeZamanlayici } from "./lib/build/isletmeZamanlayici";
import { zamanliBaslat as bulutZamanliBaslat } from "./lib/build/bulutZamanli";
import { odemeZamanlayiciBaslat } from "./lib/odeme/zamanlayici";
import { izlemeZamanlayicisi } from "./lib/build/sohbetIzleme";
import "./lib/build/ajanZamanlayiciBaslat";
import { zamanlayicilariIzle } from "./lib/admin/zamanlayiciIzle";
import { moderasyonKaydiniKur } from "./lib/admin/moderasyonKaydi";

/**
 * Yalnız Node çalışma zamanında yüklenir: zamanlı sistemler her 30 saniyede bir denetlenir; zamanlanmış Büyüme
 * e-posta kampanyaları ve İşletme işleri (randevu hatırlatma, terk edilen sepet, yorum isteği) sunucu açılınca başlar; Bulut zamanlanmış fonksiyonları da.
 */
zamanlayiciBaslat();
buyumeZamanlayiciKur();
isletmeZamanlayici();
bulutZamanliBaslat();
odemeZamanlayiciBaslat();
izlemeZamanlayicisi();
// Yönetim paneli (Yayın hazırlığı) için zamanlayıcıların son çalışma damgası.
zamanlayicilariIzle();
moderasyonKaydiniKur();
