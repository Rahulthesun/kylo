// src/hooks/useFlowMusic.ts
//
// Flow music player with a song registry.
// Add your tracks to the FLOW_TRACKS array below.
// Each track gets an id, label, and file path.
//
// Usage:
//   const music = useFlowMusic()
//   music.play()
//   music.pause()
//   music.stop()
//   music.selectTrack('phonk2')      // switch track by id
//   music.tracks                     // full track list for UI
//   music.activeTrack                // currently selected track
//   music.isPlaying                  // boolean

import { useRef, useCallback, useEffect, useState } from 'react';

// ── Add your tracks here ──────────────────────────────────────────────────────
// Place files in /assets/audio/flow/ and reference them below.
// id: unique key used by selectTrack()
// label: shown in the UI picker
// src: path relative to public root
export interface FlowTrack {
  id: string;
  label: string;
  src: string;
}

import phonk1 from '../assets/audio/flow/phonk1.mp3';
import lofi1 from '../assets/audio/flow/lofi1.mp3';
import ambient1 from '../assets/audio/flow/ambient1.mp3';

export const FLOW_TRACKS: FlowTrack[] = [
  { id: 'phonk1',   label: 'Phonk I',      src: phonk1   },
  //{ id: 'phonk2',   label: 'Phonk II',     src: '/assets/audio/flow/phonk2.mp3'   },
  { id: 'lofi1',    label: 'Lo-fi Chill',  src: lofi1    },
  { id: 'ambient1', label: 'Ambient',      src: ambient1 },
  //{ id: 'focus1',   label: 'Deep Focus',   src: '/assets/audio/flow/focus1.mp3'   },
  // Add more tracks here:
  // { id: 'mytrack', label: 'My Track', src: '/assets/audio/flow/mytrack.mp3' },
];
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TRACK_ID = FLOW_TRACKS[0].id;

export function useFlowMusic(initialTrackId: string = DEFAULT_TRACK_ID) {
  const [activeTrackId, setActiveTrackId] = useState(initialTrackId);
  const [isPlaying, setIsPlaying]         = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTrack = FLOW_TRACKS.find(t => t.id === activeTrackId) ?? FLOW_TRACKS[0];

  // Lazily init audio element
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(activeTrack.src);
      audio.loop   = true;
      audio.volume = 0.5;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [activeTrack.src]);

  const play = useCallback(() => {
    const audio = getAudio();
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(err => console.warn('[useFlowMusic] play() blocked:', err.message));
  }, [getAudio]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    isPlaying ? pause() : play();
  }, [isPlaying, play, pause]);

  // Switch track — if playing, swap src and keep playing
  const selectTrack = useCallback((id: string) => {
    const track = FLOW_TRACKS.find(t => t.id === id);
    if (!track) return;

    const wasPlaying = isPlaying;
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = track.src;
      audio.load();
      if (wasPlaying) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    }

    setActiveTrackId(id);
  }, [isPlaying]);

  // Re-init audio if src changes externally
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = !audio.paused;
    audio.src = activeTrack.src;
    audio.load();
    if (wasPlaying) audio.play().catch(() => {});
  }, [activeTrack.src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  return {
    isPlaying,
    play,
    pause,
    stop,
    toggle,
    selectTrack,
    activeTrack,
    tracks: FLOW_TRACKS,
  };
}