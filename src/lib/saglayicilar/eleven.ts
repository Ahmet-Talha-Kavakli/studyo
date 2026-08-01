import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";

/**
 * ElevenLabs ses üretim adaptörü — gerçek Text-to-Speech API.
 * Sıfır bağımlılık: native fetch. ELEVENLABS_API_KEY tanımlıysa gerçek çağrı yapar.
 *
 * Vayra ses modelleri → ElevenLabs voice_id eşlemesi. Kullanıcı Vayra tarafında
 * "Vali Anlatıcı" gibi tanıdık isimler görür; arkada gerçek voice_id çalışır.
 */
const SES_ESLEME: Record<string, string> = {
  "vali-anlatici": "onwK4e9ZLuTAKqWW03F9", // Daniel (derin anlatıcı)
  "vali-genc": "EXAVITQu4vr4xnSDxMaL", // Sarah
  "vali-enerjik": "TxGEqnHWrfWFTfGW9XjX", // Josh
  "vali-sicak": "pNInz6obpgDQGcFmaJgB", // Adam
  "vali-kurumsal": "VR6AewLTigWG4xSOukaG", // Arnold
  "vali-fisilti": "AZnzlk1XvdvUeBnXmlld", // Domi
};

const VARSAYILAN_VOICE = "onwK4e9ZLuTAKqWW03F9";

export const elevenAdapter: SaglayiciAdapter = {
  ad: "eleven",

  hazir() {
    return Boolean(process.env.ELEVENLABS_API_KEY);
  },

  destekler(tur: UretimTuru) {
    return tur === "ses";
  },

  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const anahtar = process.env.ELEVENLABS_API_KEY!;
    const voiceId = SES_ESLEME[istek.meta?.ses ?? istek.model] ?? VARSAYILAN_VOICE;

    const yanit = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": anahtar,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: istek.prompt.slice(0, 2500),
          model_id: "eleven_multilingual_v2", // Türkçe destekli
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
        }),
      }
    );

    if (!yanit.ok) {
      const govde = await yanit.text().catch(() => "");
      throw new Error(`ElevenLabs ${yanit.status}: ${govde.slice(0, 200)}`);
    }

    const dizi = await yanit.arrayBuffer();
    const b64 = Buffer.from(dizi).toString("base64");

    return {
      dataUri: `data:audio/mpeg;base64,${b64}`,
      saglayici: "eleven",
      gercek: true,
      detay: { voiceId, model: "eleven_multilingual_v2", bytes: dizi.byteLength },
    };
  },
};
