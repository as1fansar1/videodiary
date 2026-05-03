# Video Diary — v1 Requirements

## Purpose

A personal video journal web app. Users see a daily prompt, record a short webcam video in response, and review past entries in a library. Desktop + mobile web. Local-only storage for v1.

## Tech stack

- **Framework:** React + Vite + TypeScript
- **Routing:** React Router (`/` library, `/record`)
- **Storage:** IndexedDB (videos + metadata + thumbnails as Blobs)
- **PWA:** `manifest.json` + minimal service worker (installable on mobile/desktop)
- **Deployment:** Vercel (HTTPS required for `getUserMedia`)
- **Testing:** Playwright smoke tests covering the golden path

## Browser support

Last 2 versions of Chrome, Edge, Firefox, Safari. Mobile Chrome + mobile Safari included.

## Visual design

- Clean, modern UI with playful accents preserved from the wireframe
- Accent color: coral `#FF8A6B`
- Heading/label font: Kalam (handwriting feel)
- Body font: system sans
- Paper background `#FBF7F0`
- Light theme only (no dark mode in v1)
- Fully responsive — desktop = side-by-side prompt + camera, mobile = stacked

## Screens

### Library (`/`)

- Header with logo + nav (record / library)
- Toolbar: title "journal · N entries", storage indicator ("X entries · 1.2GB used"), "new entry" CTA (coral)
- Timeline of entries grouped by week ("this week", "last week", etc.)
- Each entry card: first-frame thumbnail, auto-generated title (`#N — Date`), date, duration, overflow menu (delete)
- Empty state: large "record your first entry" CTA when zero entries exist
- Tapping an entry opens a full-screen playback overlay
- No search in v1

### Record (`/record`)

Three states on one screen:

**Idle**
- Split layout: prompt card (left) + webcam preview (right)
- Prompt card: today's prompt text, "🎲 new prompt" button, "or skip" affordance
- Camera area: live webcam preview, "● ready" badge, timer placeholder `— : — / 5:00`
- Controls row: mic dropdown, big record button (coral, 80px), camera dropdown

**Countdown**
- Prompt card fades to ~40% opacity
- Camera area shows large 3 → 2 → 1 number with progress dots
- Only "✕ cancel" control visible

**Recording**
- Live timer counts up to 5:00 (auto-stops at cap)
- Controls: stop button + restart (discard and return to idle)
- No pause/resume

**Preview (post-recording)**
- Inline video player with the just-recorded clip
- Two actions: "save" (writes to library, navigates back) or "discard" (returns to idle)

### Playback overlay

- Triggered from a library entry tap
- Full-screen modal with `<video>` player, controls, and close button
- Dismissable via close button, Esc, or backdrop tap

## Recording behavior

- **Source:** webcam only (no screen capture)
- **Resolution:** 720p requested via `getUserMedia` constraints
- **Bitrate:** ~1 Mbps via MediaRecorder `videoBitsPerSecond`
- **Format:** stored as-is — `video/webm` on Chrome/Android, `video/mp4` on Safari/iOS
- **Duration cap:** 5 minutes (hard stop)
- **Countdown:** always-on 3·2·1 before recording starts
- **Device selection:** mic + camera dropdowns populated via `enumerateDevices`
- **Permission denied:** friendly error state with retry button; library still accessible

## Prompts

- Hard-coded list of prompts (~30+) shipped with the app
- Random selection on visiting `/record`
- "🎲 new prompt" reshuffles
- Skippable — user can record without a prompt
- The prompt shown at record-time is stored with the entry (`null` if skipped)

## Library entries

- **Title:** auto-generated, format `Entry #N — Mon Day` (e.g. `Entry #47 — May 3`)
- **Numbering:** sequential, never reused (highest existing + 1)
- **Thumbnail:** first-frame JPEG captured via canvas at record start
- **Duration:** measured from recording length, displayed as `M:SS`
- **Delete:** available from overflow menu, confirmation prompt before removal (permanent — local storage)
- **Grouping:** by week ("this week", "last week", "earlier in April", etc.)

## Data model (IndexedDB)

```ts
type Entry = {
  id: string;            // uuid
  number: number;        // sequential entry # (47, 46, ...)
  createdAt: number;     // ms timestamp
  duration: number;      // seconds
  prompt: string | null; // prompt text shown at record time, null if skipped
  mimeType: string;      // "video/webm" or "video/mp4"
  videoBlob: Blob;       // the recorded video
  thumbnailBlob: Blob;   // first-frame jpeg
};
```

## Storage

- All data stored locally in IndexedDB
- No backend, no auth, no cloud sync in v1
- Storage usage shown in library toolbar via `navigator.storage.estimate()`
- No auto-cap on entries; let the browser surface quota errors

## Out of scope for v1

- Cloud sync / cross-device access
- User accounts / auth
- Screen recording or screen + webcam PIP
- AI-generated prompts
- Transcription
- Search
- Tags / user-written titles or notes
- Pause/resume during recording
- Post-recording transcoding (e.g. ffmpeg.wasm)
- Dark mode
- Settings page beyond inline mic/cam selection
- Analytics / telemetry

## Future considerations

- Cloud sync (would unlock cross-device access — important once mobile is in active use)
- Search powered by transcripts
- AI-generated prompts based on past entries
- Export (download all entries as a zip)
