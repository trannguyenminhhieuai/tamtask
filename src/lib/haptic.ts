/**
 * Haptic feedback utility for mobile devices.
 * Uses navigator.vibrate() where available.
 */
export const haptic = {
  /** Short tap — for successful quick action (status change, copy) */
  light: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  },
  /** Selection tap for tab navigation */
  selection: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
  },
  /** Medium pulse — for button press or creation */
  medium: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(20);
    }
  },
  /** Success pulse — for drag-drop complete, task done */
  success: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([15, 30, 15]);
    }
  },
  /** Error buzz */
  error: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([50, 20, 50]);
    }
  },
};
