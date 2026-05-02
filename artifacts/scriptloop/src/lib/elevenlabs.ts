export interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
}

export interface TextToSpeechOptions {
  voiceId: string;
  text: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export async function getVoices(apiKey: string): Promise<Voice[]> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const data = (await response.json()) as { voices: Voice[] };
  return data.voices;
}

export async function textToSpeech(
  apiKey: string,
  options: TextToSpeechOptions,
): Promise<ArrayBuffer> {
  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${options.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: options.text,
        model_id: options.modelId ?? "eleven_turbo_v2",
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS error: ${response.statusText}`);
  }

  return response.arrayBuffer();
}
