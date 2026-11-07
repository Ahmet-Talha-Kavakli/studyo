import "server-only";
import { ajanZamanlayiciBaslat } from "./ajanZamanlayici";

/** Yalnız Node çalışma zamanında yüklenir (instrumentation-node): ajan zamanlamaları ve kaynak yenileme her 30 saniyede bir denetlenir. */
ajanZamanlayiciBaslat();
