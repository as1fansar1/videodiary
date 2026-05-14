# On-device transcription and transcript search

This doc covers the three new modules shipped to enable searchable diary
timelines without sending audio to a server.

## How it works

All transcription runs locally in the browser via
[`@xenova/transformers`](https://github.com/xenova/transformers.js), which
ships an ONNX Whisper build that executes in WebAssembly. Audio is decoded
from the recording Blob with the Web Audio API, downmixed to mono 16 kHz,
and handed to the Whisper-tiny pipeline. No audio leaves the device.

- `src/lib/transcribe.ts` exports `transcribe(blob): Promise<TranscriptSegment[]>`
  where each segment is `{ start, end, text }` in seconds.
- Model load is wrapped in a singleton promise, so the ~40 MB weights only
  download (and decode) once per session. Subsequent calls reuse the warm
  pipeline.
- A dynamic `import('@xenova/transformers')` keeps the heavy module out of
  the main bundle.

## Model size and limits

- Whisper-tiny.en: roughly **40 MB** on first load. The browser caches the
  weights, so the second visit is fast.
- English is best. The `tiny.en` checkpoint is English-only; switch to
  `Xenova/whisper-tiny` (multilingual) in `transcribe.ts` if you need
  others.
- First-load latency is significant (model download + WASM init), so the UI
  should show a loading state.
- Long clips: transcription runs at well below real time on mid-range
  hardware. Chunking is enabled (`chunk_length_s: 30`, `stride_length_s: 5`)
  to keep memory bounded.

## Search

`src/lib/search.ts` exports `searchTranscripts(query)`. It substring-matches
across every transcript segment and returns
`{ entryId, segmentStart, snippet }` rows you can render directly.

It expects a Dexie module at `src/lib/db` exporting either:

```ts
// Option A: dedicated transcripts table
db.transcripts // { id?, entryId, segments: TranscriptSegment[] }

// Option B: transcript field on the entry row
db.entries    // each row may have transcript: TranscriptSegment[]
```

Both shapes are handled. If `./db` doesn't exist yet, search no-ops and
logs a warning — nothing crashes.

## Wiring `SearchBar` into the layout

`src/components/SearchBar.tsx` is a self-contained debounced input that
calls `searchTranscripts` and renders clickable results. To integrate it,
drop it into whichever route renders the diary timeline:

```tsx
import { SearchBar } from './components/SearchBar';

function TimelineRoute() {
  const navigate = useNavigate();
  return (
    <div className="timeline">
      <SearchBar
        onResultClick={(entryId, segmentStart) => {
          navigate(`/entry/${entryId}?t=${segmentStart}`);
        }}
      />
      {/* existing entry list */}
    </div>
  );
}
```

The component uses class names (`search-bar`, `search-bar__input`,
`search-bar__results`, etc.) rather than inline styles, so they can be
styled from `App.css` to match the rest of the app.

## Suggested recording-flow hook

When a recording finishes saving to Dexie, kick off transcription in the
background:

```ts
import { transcribe } from './lib/transcribe';

const segments = await transcribe(blob);
await db.transcripts.add({ entryId: entry.id, segments });
```

Running this off the main render path avoids blocking the recording UI.
For very long clips, consider offloading the entire pipeline to a Web
Worker; the singleton pattern in `transcribe.ts` is already worker-safe.
