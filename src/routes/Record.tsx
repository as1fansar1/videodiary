import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addEntry, nextEntryNumber } from '../lib/db';
import { pickRandomPrompt } from '../lib/prompts';
import { recordStreakDay } from '../lib/streak';
import { transcribe } from '../lib/transcribe';
import { scoreEntry } from '../lib/sentiment';

const MAX_SECONDS = 5 * 60;
const COUNTDOWN_SECONDS = 3;

type Phase = 'idle' | 'countdown' | 'recording' | 'preview';

interface Devices {
  cameras: MediaDeviceInfo[];
  mics: MediaDeviceInfo[];
}

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const context = canvas.getContext('2d')!;
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/jpeg', 0.8);
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function enumerateDevices(): Promise<Devices> {
  const all = await navigator.mediaDevices.enumerateDevices();
  return {
    cameras: all.filter((d) => d.kind === 'videoinput'),
    mics: all.filter((d) => d.kind === 'audioinput'),
  };
}

export default function Record() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const recordedBlobRef = useRef<{ blob: Blob; mimeType: string; duration: number } | null>(null);
  const thumbnailBlobRef = useRef<Blob | null>(null);
  const recordStartRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const [elapsed, setElapsed] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(() => pickRandomPrompt());
  const [devices, setDevices] = useState<Devices>({ cameras: [], mics: [] });
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [selectedMicId, setSelectedMicId] = useState<string>('');

  const recordedPromptRef = useRef<string | null>(null);
  const navigate = useNavigate();

  const acquireStream = useCallback(async (cameraId?: string, micId?: string) => {
    // Stop any existing tracks first
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        ...(cameraId ? { deviceId: { exact: cameraId } } : {}),
      },
      audio: micId ? { deviceId: { exact: micId } } : true,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;

    // Enumerate devices now that we have permission
    const devs = await enumerateDevices();
    setDevices(devs);

    // Set initial selection from stream tracks if not yet chosen
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    if (videoTrack && !cameraId) {
      setSelectedCameraId(videoTrack.getSettings().deviceId ?? '');
    }
    if (audioTrack && !micId) {
      setSelectedMicId(audioTrack.getSettings().deviceId ?? '');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    acquireStream().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Could not access camera/mic');
    });
    return () => {
      cancelled = true;
      clearTimers();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-attach stream when returning from preview phase
  useEffect(() => {
    if ((phase === 'idle' || phase === 'countdown' || phase === 'recording') && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  const clearTimers = () => {
    if (countdownTimerRef.current !== null) { clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
    if (tickTimerRef.current !== null) { clearInterval(tickTimerRef.current); tickTimerRef.current = null; }
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCameraId(deviceId);
    await acquireStream(deviceId, selectedMicId).catch(() => {});
  };

  const handleMicChange = async (deviceId: string) => {
    setSelectedMicId(deviceId);
    await acquireStream(selectedCameraId, deviceId).catch(() => {});
  };

  const retry = () => {
    setError(null);
    acquireStream().catch((e) => setError(e instanceof Error ? e.message : 'Could not access camera/mic'));
  };

  const beginCountdown = () => {
    if (!streamRef.current) return;
    setCountdown(COUNTDOWN_SECONDS);
    setPhase('countdown');
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearTimers(); beginRecording(); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const beginRecording = async () => {
    if (!streamRef.current) return;
    recordedPromptRef.current = prompt;
    if (videoRef.current) thumbnailBlobRef.current = await captureFrame(videoRef.current);

    const mimeType = pickMimeType();
    chunksRef.current = [];
    recordStartRef.current = Date.now();

    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType, videoBitsPerSecond: 1_000_000 } : { videoBitsPerSecond: 1_000_000 },
    );
    recorder.ondataavailable = (ev) => { if (ev.data?.size > 0) chunksRef.current.push(ev.data); };
    recorder.onstop = () => {
      clearTimers();
      const duration = Math.round((Date.now() - recordStartRef.current) / 1000);
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      recordedBlobRef.current = { blob, mimeType: blob.type || mimeType || 'video/webm', duration };
      setPreviewUrl(URL.createObjectURL(blob));
      setPhase('preview');
    };
    recorder.start();
    recorderRef.current = recorder;
    setElapsed(0);
    setPhase('recording');
    tickTimerRef.current = window.setInterval(() => {
      setElapsed((e) => { const next = e + 1; if (next >= MAX_SECONDS) { stopRecording(); return MAX_SECONDS; } return next; });
    }, 1000);
  };

  const stopRecording = () => {
    if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const cancelCountdown = () => { clearTimers(); setPhase('idle'); };

  const restartRecording = () => {
    if (recorderRef.current?.state !== 'inactive') { recorderRef.current!.onstop = null; recorderRef.current!.stop(); }
    recorderRef.current = null;
    chunksRef.current = [];
    clearTimers();
    setElapsed(0);
    setPhase('idle');
  };

  const discardPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    recordedBlobRef.current = null;
    setElapsed(0);
    setPhase('idle');
  };

  const savePreview = async () => {
    const recorded = recordedBlobRef.current;
    if (!recorded) return;
    const number = await nextEntryNumber();
    const entryId = crypto.randomUUID();
    const createdAt = Date.now();
    await addEntry({
      id: entryId, number, createdAt,
      duration: recorded.duration, mimeType: recorded.mimeType,
      videoBlob: recorded.blob,
      thumbnailBlob: thumbnailBlobRef.current ?? new Blob(),
      prompt: recordedPromptRef.current,
    });
    recordStreakDay().catch(console.warn);
    transcribe(recorded.blob)
      .then((segments) => {
        const text = segments.map((s) => s.text).join(' ').trim();
        return scoreEntry(entryId, createdAt, recorded.duration, text, false);
      })
      .catch(console.warn);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    navigate('/');
  };

  const Header = () => (
    <header className="header">
      <div className="logo">📹 diary</div>
      <nav className="nav">
        <Link to="/record" className="nav-link nav-link-active">record</Link>
        <Link to="/" className="nav-link">library</Link>
      </nav>
    </header>
  );

  if (error) {
    return (
      <div className="page">
        <Header />
        <main className="record">
          <div className="record-error">
            <div className="record-error-icon">🎥</div>
            <p className="record-error-title">Camera access needed</p>
            <p className="empty-state-text">Allow camera and microphone access in your browser, then try again.</p>
            <button type="button" className="btn-primary" onClick={retry}>Try again</button>
            <Link to="/" className="prompt-link" style={{ marginTop: 8 }}>go to library instead</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main className="record">
        {phase === 'preview' && previewUrl ? (
          <>
            <div className="record-stage">
              <video ref={previewVideoRef} src={previewUrl} controls autoPlay playsInline className="record-video record-video-preview" />
            </div>
            <div className="record-controls record-controls-row">
              <button type="button" className="btn-secondary" onClick={discardPreview}>✕ discard</button>
              <button type="button" className="btn-primary" onClick={savePreview}>save entry</button>
            </div>
          </>
        ) : (
          <div className="record-split">
            <aside className={`prompt-card ${phase === 'countdown' || phase === 'recording' ? 'prompt-card-faded' : ''}`}>
              <div className="prompt-label">today's prompt</div>
              {prompt
                ? <p className="prompt-text">{prompt}</p>
                : <p className="prompt-text prompt-text-skipped">no prompt — talk about anything</p>
              }
              {phase === 'idle' && (
                <div className="prompt-actions">
                  <button type="button" className="prompt-btn" onClick={() => setPrompt(pickRandomPrompt(prompt))}>🎲 new prompt</button>
                  {prompt
                    ? <button type="button" className="prompt-link" onClick={() => setPrompt(null)}>skip prompt</button>
                    : <button type="button" className="prompt-link" onClick={() => setPrompt(pickRandomPrompt())}>bring back a prompt</button>
                  }
                </div>
              )}
            </aside>

            <div className="record-stage">
              <video ref={videoRef} autoPlay muted playsInline className="record-video" />
              {phase === 'countdown' && (
                <div className="countdown-overlay">
                  <div className="countdown-number">{countdown || 1}</div>
                  <div className="countdown-hint">get ready...</div>
                  <div className="countdown-dots">
                    {[3, 2, 1].map((n) => (
                      <span key={n} className={`countdown-dot ${n === (countdown || 1) ? 'countdown-dot-active' : ''}`} />
                    ))}
                  </div>
                </div>
              )}
              {phase === 'recording' && (
                <>
                  <div className="rec-badge">● REC</div>
                  <div className="rec-timer">{formatTime(elapsed)} / {formatTime(MAX_SECONDS)}</div>
                </>
              )}
            </div>

            <div className="record-controls record-controls-fullspan">
              {phase === 'idle' && (
                <div className="record-controls-idle">
                  {devices.mics.length > 1 && (
                    <select className="device-select" value={selectedMicId} onChange={(e) => handleMicChange(e.target.value)} aria-label="microphone">
                      {devices.mics.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 6)}`}</option>
                      ))}
                    </select>
                  )}
                  <div className="record-btn-group">
                    <button type="button" className="record-btn" onClick={beginCountdown} aria-label="start recording">
                      <span className="record-btn-inner" />
                    </button>
                    <div className="record-hint">tap to record</div>
                  </div>
                  {devices.cameras.length > 1 && (
                    <select className="device-select" value={selectedCameraId} onChange={(e) => handleCameraChange(e.target.value)} aria-label="camera">
                      {devices.cameras.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 6)}`}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {phase === 'countdown' && (
                <button type="button" className="btn-secondary" onClick={cancelCountdown}>✕ cancel</button>
              )}

              {phase === 'recording' && (
                <div className="record-controls-row">
                  <button type="button" className="btn-secondary" onClick={restartRecording}>↺ restart</button>
                  <button type="button" className="record-btn record-btn-recording" onClick={stopRecording} aria-label="stop recording">
                    <span className="record-btn-inner" />
                  </button>
                  <div className="record-controls-spacer" />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
