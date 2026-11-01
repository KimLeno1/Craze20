/**
 * Global Loading State Utility
 * Triggers top-level progress indicators and loading feedback when buttons or operations load.
 */

export const triggerGlobalLoading = (durationMs = 800): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:loading-trigger', { detail: { durationMs } }));
};

export const startGlobalLoading = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:loading-start'));
};

export const stopGlobalLoading = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:loading-end'));
};

/**
 * Wraps an async function to automatically start and stop global loading,
 * giving instant visual feedback when a button or action is pressed.
 */
export async function withLoading<T>(fn: () => Promise<T>, durationFallback = 600): Promise<T> {
  startGlobalLoading();
  const startTime = Date.now();
  try {
    const result = await fn();
    // Ensure minimum duration for smooth visual feedback
    const elapsed = Date.now() - startTime;
    if (elapsed < 300) {
      await new Promise((r) => setTimeout(r, 300 - elapsed));
    }
    return result;
  } finally {
    stopGlobalLoading();
  }
}
