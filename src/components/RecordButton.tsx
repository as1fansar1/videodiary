import { useEffect, useRef, useState } from 'react';

export type RecordMode = 'video' | 'audio';

type Props = {
  onComplete: (blob: Blob, durationSec: number, mode: RecordMode) => void;
  initialMode?: RecordMode;
};

const STORAGE_KEY = 'recordMode';

export default function RecordButton({ onComplete, initialMode }: Props) {
  const [mode, setMode] = useState<RecordMode>(() => {
    if (initialMode) return initialMode;
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return (stored as RecordMode) || 'video';
  });
  const [recording, setRecording] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, [mode]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(
      mode === 'audio' ? { audio: true } : { audio: true, video: true }
    );
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const type = mode === 'audio' ? 'audio/webm' : 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      const dur = startedAt ? (Date.now() - startedAt) / 1000 : 0;
      stream.getTracks().forEach((t) => t.stop());
      onComplete(blob, dur, mode);
    };
    mediaRef.current = mr;
    mr.start();
    setStartedAt(Date.now());
    setRecording(true);
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="record-button" data-testid="record-button">
      <div className="record-mode" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'video'}
          className={`record-mode-btn ${mode === 'video' ? 'active' : ''}`}
          onClick={() => setMode('video')}
          disabled={recording}
          data-testid="mode-video"
        >video</button>
        <button
          role="tab"
          aria-selected={mode === 'audio'}
          className={`record-mode-btn ${mode === 'audio' ? 'active' : ''}`}
          onClick={() => setMode('audio')}
          disabled={recording}
          data-testid="mode-audio"
        >audio only</button>
      </div>
      <button
        className="record-go"
        onClick={recording ? stop : start}
        data-testid="record-go"
      >
        {recording ? 'stop' : `start (${mode})`}
      </button>
    </div>
  );
}
