"use client";

/**
 * Küçük IndexedDB anahtar-değer deposu — localStorage'a sığmayan ikili veriler için
 * (ör. ses klonu örnekleri). Yalnız bu tarayıcıda kalır.
 */

const DB = "vayra-yerel";
const TABLO = "dosyalar";

function ac(): Promise<IDBDatabase> {
  return new Promise((ok, hata) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(TABLO)) r.result.createObjectStore(TABLO); };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => hata(r.error);
  });
}

async function islem<T>(mod: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ac();
  return new Promise((ok, hata) => {
    const t = db.transaction(TABLO, mod);
    const r = f(t.objectStore(TABLO));
    t.oncomplete = () => { db.close(); ok(r.result); };
    t.onerror = () => { db.close(); hata(t.error); };
  });
}

export const yerelDepo = {
  yaz: (anahtar: string, veri: Blob) => islem("readwrite", (s) => s.put(veri, anahtar)).then(() => undefined),
  oku: (anahtar: string) => islem<Blob | undefined>("readonly", (s) => s.get(anahtar) as IDBRequest<Blob | undefined>),
  sil: (anahtar: string) => islem("readwrite", (s) => s.delete(anahtar)).then(() => undefined),
};
