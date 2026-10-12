import { useEffect, useRef, useState } from 'react';
import { Music2, VolumeX } from 'lucide-react';

const THEME_URL = '/assets/audio/granja-theme.mp3';

export default function BackgroundMusic() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const player = audio.current!;
    player.volume = 0.22;
    return () => player.pause();
  }, []);

  const toggle = async () => {
    const player = audio.current;
    if (!player || pending) return;
    if (!player.paused) { player.pause(); return; }
    // Play only inside a user gesture; no autoplay or initial audio download.
    setPending(true);
    if (unavailable) player.load();
    setUnavailable(false);
    try { await player.play(); }
    catch { setUnavailable(true); setPlaying(false); }
    finally { setPending(false); }
  };

  const label = playing ? 'Desactivar música' : 'Activar música';
  return <>
    <audio ref={audio} src={THEME_URL} loop preload="none"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onError={() => { setUnavailable(true); setPlaying(false); }} />
    <button className="icon-button" aria-label={label} aria-pressed={playing}
      title={unavailable ? 'La música aún no está disponible' : label}
      disabled={pending} onClick={() => void toggle()}>
      {playing ? <Music2 size={18}/> : <VolumeX size={18}/>}
    </button>
  </>;
}
