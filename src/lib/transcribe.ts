// On-device Whisper transcription using @xenova/transformers.
// Runs the model in WASM; first call downloads ~40MB Whisper-tiny weights and
// caches them in the browser. We use a dynamic import so the heavy bundle is
// only pulled in when transcription is actually invoked.

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

type WhisperPipeline = (
  audio: Float32Array,
  options?: Record<string, unknown>
) => Promise<{
  text: string;
  chunks?: Array<{ timestamp: [number, number | null]; text: string }>;
}>;

let pipelinePromise: Promise<WhisperPipeline> | null = null;

/**
 * Lazily load the Whisper-tiny pipeline. The promise is cached so subsequent
 * calls return the same instance without re-downloading model weights.
 */
async function getPipeline(): Promise<WhisperPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const transformers = await import(
        /* @vite-ignore */ '@xenova/transformers'
      );
      // Allow remote (HF) model loads; disable local file lookups.
      transformers.env.allowLocalModels = false;
      const pipe = await transformers.pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny.en'
      );
      return pipe as unknown as WhisperPipeline;
    })();
  }
  return pipelinePromise;
}

/**
 * Decode a Blob (audio or video) into a mono 16kHz Float32Array, which is the
 * format Whisper expects. Uses the Web Audio API; no external deps.
 */
async function blobToMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx =
    (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext) as typeof AudioContext;
  const ctx = new AudioCtx({ sampleRate: 16000 });
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

  // Mix down to mono.
  const channels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  for (let ch = 0; ch < channels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i] += data[i] / channels;
    }
  }
  void ctx.close();
  return mono;
}

/**
 * Transcribe an audio/video Blob into time-stamped segments.
 *
 * Each segment is `{ start, end, text }` where start/end are seconds from the
 * beginning of the clip. End may be approximated when the model returns a null
 * end timestamp for the final chunk.
 */
export async function transcribe(blob: Blob): Promise<TranscriptSegment[]> {
  const pipe = await getPipeline();
  const audio = await blobToMono16k(blob);

  const result = await pipe(audio, {
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  const chunks = result.chunks ?? [];
  if (chunks.length === 0 && result.text) {
    return [{ start: 0, end: 0, text: result.text.trim() }];
  }

  const segments: TranscriptSegment[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const start = c.timestamp[0] ?? 0;
    const end =
      c.timestamp[1] ?? chunks[i + 1]?.timestamp[0] ?? start + 5;
    const text = c.text.trim();
    if (text.length > 0) segments.push({ start, end, text });
  }
  return segments;
}

/** Useful for tests / debugging — reset the cached pipeline. */
export function _resetTranscribePipeline(): void {
  pipelinePromise = null;
}
