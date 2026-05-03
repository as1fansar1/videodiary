# Video Diary

A personal video journal app. Record daily webcam entries with rotating prompts, review them in a library, and play them back — all stored locally in IndexedDB.

## Stack

- React 19 + TypeScript + Vite
- React Router v6 (SPA, `/record` and `/` library)
- IndexedDB (raw IDB, no library) for video + metadata storage
- MediaRecorder API for webcam recording
- PWA: manifest + service worker for offline app shell

## Getting started

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build
npm run preview   # serve production build locally
```

## Running end-to-end tests

```bash
npm run test:e2e
```

Tests use Playwright with Chromium's built-in fake media stream (`--use-fake-device-for-media-stream` + `--use-fake-ui-for-media-stream`) so no real camera or microphone is needed. The golden-path test covers: empty state → record → save → playback → delete.

The dev server must be running (or will be started automatically by the test runner).
