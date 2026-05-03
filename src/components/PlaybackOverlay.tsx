import { useEffect, useRef } from 'react';

type Props = {
  url: string;
  title: string;
  onClose: () => void;
};

export default function PlaybackOverlay({ url, title, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <span className="overlay-title">{title}</span>
          <button className="overlay-close" onClick={onClose} aria-label="close">✕</button>
        </div>
        <video
          ref={videoRef}
          src={url}
          controls
          autoPlay
          playsInline
          className="overlay-video"
        />
      </div>
    </div>
  );
}
