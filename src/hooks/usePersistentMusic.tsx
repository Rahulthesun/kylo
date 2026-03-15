// src/hooks/usePersistentMusic.ts
//
// A singleton music player — one instance shared across the whole app.
// FocusMode and FloatingBottomToolbar both read from and write to this.
// Music keeps playing when you minimize, switch views, or unmount either component.
//
// Usage (in your root shell / KyloShell):
//   const music = usePersistentMusic()
//   // Pass music down to both FocusMode and FloatingBottomToolbar
//
// Both components receive:
//   music.isPlaying      — is audio actually playing right now
//   music.musicEnabled   — user's on/off preference
//   music.activeTrack    — currently selected track
//   music.tracks         — full track list
//   music.toggleEnabled  — toggle mute/unmute
//   music.selectTrack    — switch track by id
//   music.syncWithSprint — call this with isRunning — plays/pauses based on sprint state

import { useRef, useCallback, useState, useEffect } from 'react';
import { resolveAudioSrc } from '../lib/audioPath';


export interface FlowTrack {
  id: string;
  label: string;
  src: string;
}

// ── Add your tracks here ──────────────────────────────────────────────────────
export const FLOW_TRACKS: FlowTrack[] = [
  { id: 'phonk1',   label: 'Phonk I',      src: 'assets/audio/flow/phonk1.mp3'   },
  //{ id: 'phonk2',   label: 'Phonk II',     src: '/assets/audio/flow/phonk2.mp3'   },
  { id: 'lofi1',    label: 'Lo-fi Chill',  src: 'assets/audio/flow/lofi1.mp3'    },
  { id: 'ambient1', label: 'Ambient',      src: 'assets/audio/flow/ambient1.mp3' },
  //{ id: 'focus1',   label: 'Deep Focus',   src: '/assets/audio/flow/focus1.mp3'   },
  // Add more tracks here:
  // { id: 'mytrack', label: 'My Track', src: '/assets/audio/flow/mytrack.mp3' },
];
// ───────────────────────────────────────────────────────────────


export function usePersistentMusic() {
  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState(FLOW_TRACKS[0].id);

  const activeTrack = FLOW_TRACKS.find(t => t.id === activeTrackId) ?? FLOW_TRACKS[0];

  // Lazily create Audio element — persists for the lifetime of the hook
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio(resolveAudioSrc(activeTrack.src));
      a.loop   = true;
      a.volume = 0.5;
      audioRef.current = a;
    }
    return audioRef.current;
  }, []); // intentionally no deps — only created once

  const _play = useCallback(() => {
    const audio = getAudio();
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(err => console.warn('[music] blocked:', err.message));
  }, [getAudio]);

  const _pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // Call this whenever isRunning changes in either FocusMode or FloatingBottomToolbar
  const syncWithSprint = useCallback((isRunning: boolean) => {
    if (isRunning && musicEnabled) {
      _play();
    } else {
      _pause();
    }
  }, [musicEnabled, _play, _pause]);

  // Toggle the user's music preference
  const toggleEnabled = useCallback((isRunning: boolean) => {
    setMusicEnabled(prev => {
      const next = !prev;
      if (next && isRunning) {
        _play();
      } else {
        _pause();
      }
      return next;
    });
  }, [_play, _pause]);

  // Switch track — keeps playing if currently playing
  const selectTrack = useCallback((id: string, isRunning: boolean) => {
    const track = FLOW_TRACKS.find(t => t.id === id);
    if (!track) return;

    const audio = getAudio();
    const wasPlaying = !audio.paused;

    audio.pause();
    audio.currentTime = 0;
    audio.src = resolveAudioSrc(track.src);
    audio.load();

    setActiveTrackId(id);

    if (wasPlaying && musicEnabled && isRunning) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
    }
  }, [getAudio, musicEnabled]);

  // Clean up only on full app unmount
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
    musicEnabled,
    activeTrack,
    tracks: FLOW_TRACKS,
    syncWithSprint,
    toggleEnabled,
    selectTrack,
  };
}