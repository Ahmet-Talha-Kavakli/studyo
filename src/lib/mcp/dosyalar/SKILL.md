---
name: vayra
description: Vayra ile görsel, video, ses, müzik ve 3D üretir. Kullanıcı bir görsel/video/ses/müzik/3D model üretmek, bir üretimin durumunu öğrenmek ya da Vayra kredisini sormak istediğinde kullan.
---

# Vayra ile üretim

Vayra; görsel, video, ses, müzik ve 3D için tek bir API'dir. Bu beceri iki yoldan biriyle çalışır:

1. **MCP araçları** (`vayra` MCP sunucusu bağlıysa tercih et): `list_models`, `get_model`, `generate`, `get_generation`, `list_generations`, `cancel_generation`, `get_account`.
2. **CLI** (MCP yoksa): `node vayra.mjs <komut>` — kurulum: `curl -fsSL __BASE__/cli/vayra.mjs -o vayra.mjs`

## Akış

1. Kullanıcı model belirtmediyse türe göre seç: önce `list_models` (ya da `node vayra.mjs models --type image`).
2. Girdileri öğren: `get_model` (`node vayra.mjs model <id>`). En az `prompt` gerekir; oran, süre, çözünürlük gibi alanlar modele göre değişir.
3. Üret: `generate` (`node vayra.mjs generate <model> "<prompt>" -p aspect_ratio=16:9 --out ./ciktilar`).
   - Video gibi uzun işlerde `wait=false` ver, sonra `get_generation` ile sorgula.
4. Sonucu çıktı adresleriyle birlikte kullanıcıya göster; görselse adresi markdown görseli olarak ver.

## Kurallar

- Her üretim kredi harcar. Kullanıcı açıkça istemedikçe aynı istem için birden fazla üretim başlatma; pahalı video modellerinden önce bedeli söyle (`credits` alanı).
- Test anahtarı (`vy_test_…`) kredi harcamaz ve örnek çıktı döndürür; gerçek üretim için canlı anahtar gerekir.
- Hata gelirse `error.code` alanına göre davran: `insufficient_credits` → bakiyeyi söyle; `content_policy_violation` → istemi değiştirmesini öner; `rate_limit_exceeded` → biraz bekleyip yeniden dene.
- Anahtarı asla sohbete ya da dosyalara yazma.
