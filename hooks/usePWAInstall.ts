import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_DISMISS_KEY = 'ck_pwa_prompt_dismissed_time';
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown

// Shared global state for PWA install across components
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    notifyListeners();
  });
}

// Global function to trigger prompt modal from anywhere
export const triggerPWAPrompt = () => {
  window.dispatchEvent(new CustomEvent('open-pwa-prompt'));
};

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Check standalone mode and device types
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    const updateState = () => {
      setDeferredPrompt(globalDeferredPrompt);
    };

    listeners.add(updateState);

    // Auto-open prompt after a brief timeout if not installed and not recently dismissed
    const checkAutoOpen = () => {
      if (isStandalone) return;

      const lastDismissed = localStorage.getItem(PWA_DISMISS_KEY);
      if (lastDismissed) {
        const timeDiff = Date.now() - parseInt(lastDismissed, 10);
        if (timeDiff < DISMISS_COOLDOWN_MS) {
          return;
        }
      }

      // Show after 3.5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3500);

      return () => clearTimeout(timer);
    };

    const cleanupTimer = checkAutoOpen();

    // Listen for custom trigger event
    const handleCustomTrigger = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-pwa-prompt', handleCustomTrigger);

    return () => {
      listeners.delete(updateState);
      if (cleanupTimer) cleanupTimer();
      window.removeEventListener('open-pwa-prompt', handleCustomTrigger);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsOpen(false);
        }
        return choice.outcome;
      } catch (err) {
        console.error('PWA install error:', err);
        return 'manual';
      }
    }
    return 'manual';
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(PWA_DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore localStorage quota errors
    }
  }, []);

  const openPrompt = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isOpen,
    install,
    dismiss,
    openPrompt,
    setIsOpen,
  };
}
