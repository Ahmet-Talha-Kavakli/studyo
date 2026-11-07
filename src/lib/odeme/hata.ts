/** Ödeme akışının kullanıcıya gösterilecek hatası. kod: arayüzün tanıdığı durum (altyapi, fatura, abonelik…). */
export class OdemeHatasi extends Error {
  constructor(mesaj: string, public durum = 400, public kod?: string) { super(mesaj); }
}
