// src/hooks/useSFX.ts
//
// Lightweight sound effect player.
// Uses a single cached Audio instance per sound key — no re-loading on repeat plays.
//
// Usage:
//   const sfx = useSFX()
//   sfx.play('check')          // plays /assets/audio/check.mp3
//   sfx.play('check', 0.6)     // with custom volume (0–1, default 0.5)
//
// Adding more sounds:
//   Just add entries to the SOUNDS map below.

import { useRef, useCallback } from 'react';
import { resolveAudioSrc } from '../lib/audioPath';

// ── Sound registry — add your files here ──────────────────────────────────────
const SOUNDS: Record<string, string> = {
  check: 'assets/audio/check.mp3',
  // delete: '/assets/audio/delete.mp3',
  // success: '/assets/audio/success.mp3',
};
// ─────────────────────────────────────────────────────────────────────────────

export function useSFX() {
  // Cache one Audio element per sound key so repeated clicks don't stack
  const cache = useRef<Record<string, HTMLAudioElement>>({});

  const play = useCallback((key: keyof typeof SOUNDS, volume = 0.5) => {
    const src = SOUNDS[key];
    if (!src) {
      console.warn(`[useSFX] Unknown sound key: "${key}"`);
      return;
    }

    try {
      // Reuse cached element — rewind if already playing
      if (!cache.current[key]) {
        const audio = new Audio(resolveAudioSrc(src));
        audio.volume = volume;
        cache.current[key] = audio;
      }

      const audio = cache.current[key];
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay blocked — browser requires user gesture first.
        // This is fine; the first interaction always unblocks subsequent plays.
      });
    } catch {}
  }, []);

  return { play };
}