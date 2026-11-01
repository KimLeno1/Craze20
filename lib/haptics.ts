/**
 * Haptic Vibration Feedback Utility using the HTML5 Vibration API
 * Provides physical tactile feedback for interactive actions (Add to Cart, Liking, etc.)
 */

export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'like' 
  | 'error' 
  | 'selection';

/**
 * Safely triggers vibration on supported mobile devices
 * Does nothing if Vibration API is unsupported or restricted by browser permissions
 */
export const triggerHaptic = (type: HapticType = 'medium'): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }

  try {
    switch (type) {
      case 'light':
      case 'selection':
        // Short crisp click (15ms)
        return navigator.vibrate(15);
      case 'medium':
        // Solid action feedback (30ms)
        return navigator.vibrate(30);
      case 'heavy':
        // Strong tactile bump (55ms)
        return navigator.vibrate(55);
      case 'like':
        // Heartbeat rhythmic double-pulse for liking/wishlisting
        return navigator.vibrate([25, 45, 30]);
      case 'success':
        // Uplifting celebration pattern for adding to cart or joining waitlist
        return navigator.vibrate([20, 40, 20, 40, 35]);
      case 'error':
        // Warning buzz
        return navigator.vibrate([50, 70, 50]);
      default:
        return navigator.vibrate(30);
    }
  } catch (err) {
    // Gracefully handle iframe or permission restrictions
    return false;
  }
};
