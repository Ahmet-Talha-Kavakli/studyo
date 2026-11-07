import type { ProjeTur } from "../tipler";
import type { SablonTablo } from "./kurulum";
import { KAHVE } from "./kahve";
import { ODAK_ZAMANLAYICI } from "./odak";
import { NEON_YILAN } from "./yilan";
import { CEP_BUTCE } from "./butce";
import { PORTFOLYO } from "./portfolyo";
import { UZAY_SAVUNMASI } from "./uzay";
import { SU_TAKIP } from "./su";
import { DUGUN_DAVETIYESI } from "./dugun";
import { TUGLA_KIR } from "./tugla";
import { TARIF_DEFTERI } from "./tarif";
import { HAFIZA_KARTLARI } from "./hafiza";
import { NEON_KOSU } from "./oyun";
import { EVCIL_DOSTUM } from "./mobil";
import { SATIS_PANELI } from "./panel";
import { SERAMIK_BUTIK } from "./seramik";
import { DIS_KLINIGI } from "./dis";
import { EGE_RESTORAN } from "./restoran";
import { SAAS_MUHASEBE } from "./saas";
import { EMLAK_ILANLARI } from "./emlak";
import { SPOR_SALONU } from "./spor";
// Sektör site şablonları
import { HUKUK_BUROSU } from "./hukuk";
import { BUTIK_OTEL } from "./otel";
import { YOGA_STUDYOSU } from "./yoga";
import { KUAFOR_SALONU } from "./kuafor";
import { CAZ_KULUBU } from "./caz";
import { DIJITAL_AJANS } from "./ajans";
import { KONFERANS } from "./konferans";
import { ONLINE_KURS } from "./kurs";
import { FIDAN_DERNEGI } from "./dernek";
import { CICEKCI } from "./cicekci";
import { IKI_BIN_KIRK_SEKIZ } from "./ikibin";
import { MAYIN_TARLASI } from "./mayin";
import { ALISKANLIK } from "./aliskanlik";
import { NEFES } from "./nefes";
import { BES_HARF } from "./besharf";
import { MARTI } from "./marti";
import { MINI_CRM } from "./crm";
import { STOK_TAKIP } from "./stok";
import { KELIME_EZBER } from "./ezber";
import { FATURA_OLUSTURUCU } from "./fatura";
import { RANDEVU_MASASI } from "./randevu";

/** tablolar: şablondan proje açılınca veritabanına kurulan hazır tablolar (şema, kurallar, başlangıç kayıtları). */
export type Sablon = { id: string; ad: string; tur: ProjeTur; aciklama: string; kapak: string; dosyalar: Record<string, string>; tablolar?: Record<string, SablonTablo> };

/** Hazır şablonlar: gerçek, çalışan projeler. Remix edilince proje olarak açılır (yapay zekâ gerektirmez). Sıra vitrin sırasıdır. */
export const SABLONLAR: Sablon[] = [KAHVE, ODAK_ZAMANLAYICI, NEON_YILAN, CEP_BUTCE, PORTFOLYO, UZAY_SAVUNMASI, SU_TAKIP, DUGUN_DAVETIYESI, TUGLA_KIR, TARIF_DEFTERI, HAFIZA_KARTLARI, NEON_KOSU, EVCIL_DOSTUM, SATIS_PANELI, SERAMIK_BUTIK, DIS_KLINIGI, EGE_RESTORAN, SAAS_MUHASEBE, EMLAK_ILANLARI, SPOR_SALONU, HUKUK_BUROSU, BUTIK_OTEL, YOGA_STUDYOSU, KUAFOR_SALONU, CAZ_KULUBU, DIJITAL_AJANS, KONFERANS, ONLINE_KURS, FIDAN_DERNEGI, CICEKCI, IKI_BIN_KIRK_SEKIZ, MAYIN_TARLASI, ALISKANLIK, BES_HARF, MINI_CRM, STOK_TAKIP,NEFES, MARTI, KELIME_EZBER, FATURA_OLUSTURUCU, RANDEVU_MASASI];
export const sablonBul = (id: string) => SABLONLAR.find((s) => s.id === id);
