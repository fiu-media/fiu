// Browser APIs that only some browsers have, so the DOM types leave them out. Each is optional: code must check for it.
export {};

declare global {
  interface Document {
    /** Safari's prefixed `fullscreenElement` (before 16.4). */
    webkitFullscreenElement?: Element | null;
  }

  interface Window {
    /** Safari's prefixed `AudioContext` (before 14.1). */
    webkitAudioContext?: typeof AudioContext;
  }

  interface Navigator {
    /** Approximate RAM in GiB (Chromium only). */
    deviceMemory?: number;
    /** The Network Information API (Chromium only); `saveData` is the visitor's data-saver setting. */
    connection?: { saveData?: boolean };
  }
}
