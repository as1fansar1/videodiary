# Video Diary — Implementation Todos

Vertical-slice breakdown of [requirements.md](requirements.md). Each issue is a thin tracer-bullet slice that's demoable on its own. Work them in dependency order — #1 first, then #2, then the parallel branches.

---

## 1. Project scaffold + empty library route

**Type:** AFK
**Blocked by:** None — can start immediately

### What to build

Stand up a Vite + React + TypeScript project with React Router. Create two routes: `/` (library) and `/record`. The library route renders an empty state ("No entries yet — record your first.") with a CTA that navigates to `/record`. The record route renders a placeholder. App runs locally with `npm run dev`.

### Acceptance criteria

- [ ] `npm install && npm run dev` starts the app on localhost
- [ ] `/` renders the library empty state with a "record first entry" CTA
- [ ] CTA navigates to `/record`
- [ ] `/record` renders a placeholder page
- [ ] TypeScript builds with no errors (`npm run build`)
- [ ] `.gitignore` excludes `node_modules`, `dist`

---

## 2. End-to-end record → save → playback (tracer bullet)

**Type:** AFK
**Blocked by:** #1

### What to build

The thinnest possible end-to-end recording flow. On `/record`, request webcam access, show a live preview, and provide a single record button. Tapping it starts recording immediately (no countdown), tapping again stops. On stop, save the raw video Blob to IndexedDB along with `{ id, createdAt, mimeType, videoBlob }`, then navigate to `/`. The library lists saved entries (any visible identifier — entry id is fine), and tapping one plays it back inline via a `<video>` element.

No prompts, no countdown, no duration cap, no thumbnails, no titles, no preview-before-save. Just the spine.

### Acceptance criteria

- [ ] `/record` requests camera + mic permission and shows a live preview
- [ ] Tapping record starts MediaRecorder; tapping again stops and saves
- [ ] Entry is persisted to IndexedDB with the data model from requirements.md
- [ ] After save, app navigates to `/` and the new entry appears in the list
- [ ] Tapping a library entry plays it back via an inline `<video>` element
- [ ] Reloading the page preserves entries

---

## 3. Recording UX: countdown, cap, timer, preview, restart

**Type:** AFK
**Blocked by:** #2

### What to build

Layer the full recording-state UX over the bare flow from #2:

- **Countdown:** always-on 3·2·1 before recording starts, with the big number + progress dots from the wireframe
- **5-minute cap:** recording auto-stops at 5:00
- **Live timer:** during recording, show `M:SS / 5:00`
- **Preview:** after stop, show the recorded clip in a player with "save" and "discard" actions; only "save" writes to IndexedDB
- **Restart:** during recording, a "restart" control discards the in-progress recording and returns to idle
- **Cancel countdown:** during countdown, a cancel control returns to idle

### Acceptance criteria

- [ ] Tapping record kicks off a 3·2·1 countdown, then begins capture
- [ ] Live elapsed timer ticks every second, visible during recording
- [ ] Recording auto-stops exactly at 5:00 and goes to preview
- [ ] Preview screen plays back the just-recorded clip
- [ ] "Save" persists to IndexedDB and navigates to `/`; "discard" returns to idle without saving
- [ ] "Restart" during recording discards and returns to idle
- [ ] "Cancel" during countdown returns to idle
- [ ] Stopping early (before 5:00) also goes to preview

---

## 4. Prompts: hard-coded list, shuffle, skip, persist

**Type:** AFK
**Blocked by:** #2

### What to build

Ship a hard-coded list of ~30 prompts. On the record-idle screen, show one randomly selected prompt in the prompt card (left side per the wireframe). A "🎲 new prompt" button reshuffles. Users can record without picking a prompt (shown as a "skip" affordance). The prompt text shown at record start is stored on the entry as `prompt: string | null`.

### Acceptance criteria

- [ ] At least 30 prompts in a constants file
- [ ] Visiting `/record` shows a randomly selected prompt
- [ ] Shuffle button picks a different prompt
- [ ] User can record without a prompt (skip affordance) — entry's `prompt` is `null`
- [ ] If user records with a prompt, the entry's `prompt` field stores that exact text
- [ ] Prompt is visible during countdown (faded per wireframe) and during recording

---

## 5. Library polish: thumbnails, auto-titles, week grouping

**Type:** AFK
**Blocked by:** #2

### What to build

Make the library look like the wireframe:

- **Thumbnails:** capture a first-frame JPEG via canvas at record start, store as `thumbnailBlob` on the entry, render in the library card
- **Auto-titles:** display each entry as `Entry #N — Mon Day` (e.g. `Entry #47 — May 3`); `number` is sequential and never reused (highest existing + 1)
- **Duration:** measured during recording, displayed as `M:SS`
- **Week grouping:** entries grouped by week with headings ("this week", "last week", "earlier in April", etc.)

### Acceptance criteria

- [ ] First-frame thumbnail is captured at record start and stored as `thumbnailBlob`
- [ ] Library cards render the thumbnail
- [ ] Each card shows `Entry #N — Mon Day`, the date, and `M:SS` duration
- [ ] Entry numbers are sequential and never reused after delete
- [ ] Entries are grouped by week with the headings above
- [ ] Existing entries from prior issues backfill or are migrated gracefully (or are acceptably wiped — call it out)

---

## 6. Full-screen playback overlay + delete with confirm

**Type:** AFK
**Blocked by:** #5

### What to build

Replace the inline `<video>` playback from #2 with a proper full-screen overlay. Tapping a library entry opens a modal with the video player, native controls, and a close button. Dismissable via close button, Esc key, or backdrop tap. Each library card has an overflow menu (`⋯`) with a "Delete" action; tapping Delete shows a confirmation dialog before removing the entry from IndexedDB.

### Acceptance criteria

- [ ] Tapping a library entry opens a full-screen modal with the video
- [ ] Modal can be dismissed via close button, Esc, or backdrop tap
- [ ] Native video controls work (play/pause/scrub)
- [ ] Each entry card has an overflow menu with a Delete action
- [ ] Delete shows a confirmation dialog ("Delete this entry? This can't be undone.")
- [ ] Confirming removes the entry from IndexedDB and the library list updates
- [ ] Cancelling does nothing

---

## 7. Mic + camera dropdowns + permission-denied state

**Type:** AFK
**Blocked by:** #2

### What to build

Use `navigator.mediaDevices.enumerateDevices()` to populate mic and camera dropdowns on the record-idle screen. Selecting a different device updates the live preview. If the user denies camera/mic permission (or has no devices), show a friendly error state on `/record` with a "try again" button that re-prompts. The library remains accessible.

### Acceptance criteria

- [ ] Mic dropdown lists all available audio inputs
- [ ] Camera dropdown lists all available video inputs
- [ ] Switching device updates the live preview
- [ ] Selected device is used for the actual recording
- [ ] Permission-denied shows a friendly message + retry button
- [ ] Retry re-invokes `getUserMedia`
- [ ] Library still works when permission is denied

---

## 8. Storage indicator in library toolbar

**Type:** AFK
**Blocked by:** #5

### What to build

In the library toolbar (next to "journal · N entries"), show storage usage from `navigator.storage.estimate()`. Format as `N entries · X.X MB used` (auto-scale to MB / GB).

### Acceptance criteria

- [ ] Toolbar shows entry count + bytes used
- [ ] Bytes formatted readably (`MB` or `GB`, one decimal)
- [ ] Updates after add/delete (re-query on entry list change)
- [ ] Falls back gracefully if `storage.estimate` is unavailable

---

## 9. Responsive mobile layout

**Type:** AFK
**Blocked by:** #3, #5

### What to build

Make the app usable on phones. On narrow viewports (`< 768px`), stack the record screen vertically (prompt on top, camera below, controls at bottom). Library cards reflow to a single column. Touch targets are at least 44px.

### Acceptance criteria

- [ ] Record idle/countdown/recording screens stack vertically on mobile
- [ ] Library is single-column on mobile
- [ ] Record button + controls remain comfortably tappable (≥44px)
- [ ] No horizontal scroll at 375px width
- [ ] Modal playback overlay fits mobile viewport
- [ ] Tested on Chrome devtools mobile emulation (iPhone SE + iPhone 14 Pro)

---

## 10. Visual polish: coral accent, Kalam font, paper background

**Type:** AFK
**Blocked by:** #5

### What to build

Apply the final design language. Pull in the Kalam font for headings/labels (logo, prompt text, entry titles, nav). Use coral `#FF8A6B` for the accent (record button, CTAs, active nav). Apply paper background `#FBF7F0` to the app shell. Body text stays in a clean system sans for readability. Match the spirit of the wireframe — playful but cleaner than the hand-drawn prototype.

### Acceptance criteria

- [ ] Kalam loaded from Google Fonts and used for headings/labels
- [ ] Coral `#FF8A6B` is the single accent color across CTAs, record button, active states
- [ ] Paper `#FBF7F0` background applied to app shell
- [ ] Body text is system sans, comfortable to read
- [ ] Visual matches the spirit of the v2 wireframe (no wobbly SVG borders required)

---

## 11. PWA: manifest + minimal service worker

**Type:** AFK
**Blocked by:** #1

### What to build

Add a `manifest.json` with app name, icons (192 + 512), theme color (coral), and `display: standalone`. Register a minimal service worker that caches the app shell so the app loads offline (videos are already in IndexedDB and don't need cache). Verify "Add to Home Screen" works on Chrome mobile and Safari iOS.

### Acceptance criteria

- [ ] `manifest.json` linked from `index.html` with name, short_name, theme_color, icons, display
- [ ] At least 192×192 and 512×512 PNG icons
- [ ] Service worker registered and caches app shell
- [ ] Lighthouse PWA audit passes the installability checks
- [ ] "Add to Home Screen" tested on Chrome mobile (Android emulator or real device)

---

## 12. Playwright smoke tests for golden path

**Type:** AFK
**Blocked by:** #6

### What to build

Set up Playwright with mocked `getUserMedia` (Chromium supports `--use-fake-device-for-media-stream` and `--use-fake-ui-for-media-stream`). Cover the golden path:

1. Open library — see empty state
2. Click "record first entry" — land on `/record`
3. Mock countdown short-circuit (or wait), record for ~2 seconds, stop
4. Save from preview — return to library, see new entry
5. Open the entry in the playback overlay
6. Delete the entry, confirm — back to empty state

### Acceptance criteria

- [ ] Playwright installed and configured for Chromium
- [ ] Fake media stream flags wired up
- [ ] Golden-path test passes locally (`npm run test:e2e`)
- [ ] Test cleans up IndexedDB between runs
- [ ] README documents how to run tests

---

## 13. Deploy to Vercel

**Type:** HITL — needs the user to connect their Vercel account
**Blocked by:** #1

### What to build

Connect the repo to Vercel and deploy. Verify the live URL serves over HTTPS (required for `getUserMedia`). Confirm the PWA installability check works on the deployed origin. Capture the live URL in the project README.

### Acceptance criteria

- [ ] Repo connected to Vercel project
- [ ] Production deploy succeeds
- [ ] Live URL serves over HTTPS
- [ ] `getUserMedia` works on the deployed origin (test recording in production)
- [ ] PWA install works from the deployed origin
- [ ] README links the live URL
