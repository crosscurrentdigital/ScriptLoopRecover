export interface GenerateAudioRequest {
  text: string;
  voiceId: string;
}

export interface GenerateAudioResponse {
  audioUrl: string;
  durationSeconds: number;
}

const SAMPLE_AUDIO_URL =
  "https://www.soundjay.com/buttons/sounds/beep-07a.mp3";

const FALLBACK_AUDIO_URL =
  "https://file-examples.com/storage/fe44eeb9bb66ab8ce934f04/2017/11/file_example_MP3_700KB.mp3";

const ARTIFICIAL_DELAY_MS = 1200;
const ERROR_PROBABILITY = 0.2;

export async function mockGenerateAudio(
  req: GenerateAudioRequest,
  options: { forceError?: boolean } = {},
): Promise<GenerateAudioResponse> {
  await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

  if (options.forceError) {
    throw new Error("Simulated audio generation failure. Please try again.");
  }

  if (Math.random() < ERROR_PROBABILITY) {
    throw new Error(
      "ElevenLabs is taking a nap (simulated). Tap retry to try again.",
    );
  }

  if (!req.text.trim()) {
    throw new Error("Cannot generate audio for empty text.");
  }
  if (!req.voiceId) {
    throw new Error("A voice must be selected.");
  }

  const wordsPerSecond = 2.7;
  const words = req.text.trim().split(/\s+/).length;
  const estimatedDuration = Math.max(1, Math.round(words / wordsPerSecond));

  return {
    audioUrl: words > 200 ? FALLBACK_AUDIO_URL : SAMPLE_AUDIO_URL,
    durationSeconds: estimatedDuration,
  };
}
