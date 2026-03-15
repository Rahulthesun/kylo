// src/lib/audioPath.ts
//
// Resolves audio file paths correctly in both Electron dev and production.
//
// Dev:  Vite serves public/ from localhost  →  /assets/audio/check.mp3
// Prod: Electron uses file:// protocol      →  file:///path/to/app/dist/assets/audio/check.mp3
//
// Usage:
//   import { resolveAudioSrc } from '../lib/audioPath'
//   const src = resolveAudioSrc('assets/audio/check.mp3')  // no leading slash

export function resolveAudioSrc(relativePath: string): string {
  if (window.location.protocol === 'file:') {
    // Production: window.location.href is e.g.
    //   file:///Applications/Kylo.app/Contents/Resources/app/dist/index.html
    // Resolve relative to the dist/ directory
    const base = window.location.href.substring(
      0,
      window.location.href.lastIndexOf('/') + 1
    );
    return `${base}${relativePath}`;
  }
  // Dev: Vite serves public/ from root
  return `/${relativePath}`;
}