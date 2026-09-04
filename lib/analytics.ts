/**
 * Plausible Analytics Helper for Closet Kraze
 * Supports custom events, revenue tracking (GHC), device/source tracking, price bands, and categories.
 */

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, any>; revenue?: { currency: string; amount: number } }) => void;
  }
}

export function getDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

export function getTrafficSource(): string {
  if (typeof window === 'undefined') return 'direct';
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  if (utmSource) return utmSource.toLowerCase();

  const ref = document.referrer;
  if (!ref) return 'direct';
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'whatsapp';
  if (ref.includes('instagram.com') || ref.includes('ig')) return 'instagram';
  if (ref.includes('tiktok.com')) return 'tiktok';
  if (ref.includes('google.com')) return 'google';
  return 'referral';
}

export function getPriceBand(price: number): string {
  if (price < 150) return 'Under GH₵150';
  if (price < 400) return 'GH₵150 - GH₵399';
  if (price < 800) return 'GH₵400 - GH₵799';
  return 'GH₵800+ (Grail)';
}

export function trackPlausibleEvent(
  eventName: 'view_product' | 'add_to_cart' | 'whatsapp_click' | 'start_checkout' | 'complete_purchase',
  props: {
    product_id?: string;
    name?: string;
    category?: string;
    price?: number;
    amount?: number;
    currency?: string;
    location?: string;
    order_id?: string;
    [key: string]: any;
  } = {}
) {
  if (typeof window === 'undefined' || !window.plausible) {
    console.debug(`[Analytics Plausible] ${eventName}`, props);
    return;
  }

  const device = getDeviceType();
  const source = getTrafficSource();
  const enrichedProps: Record<string, any> = {
    device,
    source,
    ...props,
  };

  if (props.price !== undefined) {
    enrichedProps.price_band = getPriceBand(props.price);
  }

  const options: { props: Record<string, any>; revenue?: { currency: string; amount: number } } = {
    props: enrichedProps,
  };

  if (props.amount !== undefined || props.price !== undefined) {
    const amt = props.amount !== undefined ? props.amount : props.price!;
    options.revenue = {
      currency: props.currency || 'GHC',
      amount: amt,
    };
  }

  try {
    window.plausible(eventName, options);
    console.debug(`🎯 Plausible Tracked [${eventName}]`, options);
  } catch (err) {
    console.warn(`Failed to track Plausible event ${eventName}:`, err);
  }
}
