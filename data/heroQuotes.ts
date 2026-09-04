export interface HeroQuoteSlide {
  id: number;
  quote: string;
  image: string;
  fallbackImage: string;
  theme: string;
  subtext: string;
  tag: string;
}

export const HERO_QUOTES: HeroQuoteSlide[] = [
  {
    id: 1,
    quote: "Fashion is freedom wear it",
    image: "/hero/hero_model_freedom_1788236993279.jpg",
    fallbackImage: "/img1.webp",
    theme: "Freedom & Expression",
    subtext: "Unshackle your individuality through bold, boundary-pushing fashion and authentic personal style.",
    tag: "Drop 01 // Freedom"
  },
  {
    id: 2,
    quote: "Life is hard but make sure your outfit is hadder",
    image: "/hero/hero_model_harder_1788237010924.jpg",
    fallbackImage: "/img2.webp",
    theme: "Resilience & Edge",
    subtext: "Armor yourself in technical outerwear and unapologetic cuts.",
    tag: "Drop 02 // Tough Armor"
  },
  {
    id: 3,
    quote: "Fashion is art and you are the gallery",
    image: "/hero/hero_model_gallery_1788237022752.jpg",
    fallbackImage: "/img3.webp",
    theme: "Art & Silhouette",
    subtext: "Transform every room into an exhibition of pure architectural aesthetics.",
    tag: "Drop 03 // Living Art"
  },
  {
    id: 4,
    quote: "Fashion speaks louder than words",
    image: "/hero/hero_model_louder_1788237034319.jpg",
    fallbackImage: "/img1.webp",
    theme: "Statement & Impact",
    subtext: "Make a monumental declaration before saying a single sentence.",
    tag: "Drop 04 // Loud Silhouette"
  },
  {
    id: 5,
    quote: "Cloths are just like friends you want quality not quantity",
    image: "/hero/hero_model_quality_1788237046839.jpg",
    fallbackImage: "/img2.webp",
    theme: "Quality & Craft",
    subtext: "Curated heavyweight fabrics built to stand the test of time.",
    tag: "Drop 05 // Pure Craft"
  },
  {
    id: 6,
    quote: "Trendy looks, timeless fashion",
    image: "/hero/hero_model_timeless_1788237058416.jpg",
    fallbackImage: "/img3.webp",
    theme: "Timeless Elegance",
    subtext: "Merging contemporary Accra fashion sensibilities with eternal luxury tailoring and elevated style.",
    tag: "Drop 06 // Timeless"
  },
  {
    id: 7,
    quote: "Fashion is identity",
    image: "/hero/hero_model_identity_1788237069856.jpg",
    fallbackImage: "/img1.webp",
    theme: "Identity & Persona",
    subtext: "Your signature fingerprint translated into wearable luxury.",
    tag: "Drop 07 // Identity"
  },
  {
    id: 8,
    quote: "Fashion is your superpower",
    image: "/hero/hero_model_superpower_1788237086142.jpg",
    fallbackImage: "/img2.webp",
    theme: "Empowerment & Power",
    subtext: "Step into greatness with silhouettes designed to elevate your aura.",
    tag: "Drop 08 // Superpower"
  },
  {
    id: 9,
    quote: "Style without limits",
    image: "/hero/hero_model_limits_1788237098602.jpg",
    fallbackImage: "/img3.webp",
    theme: "Boundless Horizon",
    subtext: "No rules, no frontiers. Redefine luxury on your own terms.",
    tag: "Drop 09 // No Limits"
  },
  {
    id: 10,
    quote: "If they’re going to watch, make every second unforgettable.",
    image: "/hero/hero_model_unforgettable_1788237110043.jpg",
    fallbackImage: "/img1.webp",
    theme: "Unforgettable Stage",
    subtext: "Captivate the gaze and leave an indelible impression everywhere you go.",
    tag: "Drop 10 // Spotlight"
  },
  {
    id: 11,
    quote: "Eyes will follow you anyway—give them a masterclass in style.",
    image: "/hero/hero_model_masterclass_1788237121991.jpg",
    fallbackImage: "/img2.webp",
    theme: "Masterclass Allure",
    subtext: "Own the sidewalk as your personal Paris and Accra runway.",
    tag: "Drop 11 // Masterclass"
  },
  {
    id: 12,
    quote: "Fashion speaks before you speak",
    image: "/hero/hero_model_speaks_1788237132615.jpg",
    fallbackImage: "/img3.webp",
    theme: "Silent Authority",
    subtext: "Command instant respect through razor-sharp cuts and textures.",
    tag: "Drop 12 // Authority"
  },
  {
    id: 13,
    quote: "dress for yourself and no one else",
    image: "/hero/hero_model_yourself_1788237145233.jpg",
    fallbackImage: "/img1.webp",
    theme: "Self Sovereignty",
    subtext: "Authentic comfort and bespoke luxury purely for your own pleasure.",
    tag: "Drop 13 // For Yourself"
  },
  {
    id: 14,
    quote: "Fashion is what you buy, style is what you do with it",
    image: "/hero/hero_model_mastery_1788237156334.jpg",
    fallbackImage: "/img2.webp",
    theme: "Curation & Mastery",
    subtext: "The ultimate synthesis of curated garments transformed by personal vision.",
    tag: "Drop 14 // Mastery"
  }
];

/**
 * Picks 4 random hero slides for the current user session.
 * Uses sessionStorage to maintain consistency during a session or refreshes when requested.
 */
export function getRandomSessionHeroSlides(count: number = 4): HeroQuoteSlide[] {
  try {
    const sessionSaved = sessionStorage.getItem('cc_session_hero_slides_v2');
    if (sessionSaved) {
      const parsed = JSON.parse(sessionSaved);
      if (Array.isArray(parsed) && parsed.length === count && parsed[0]?.image?.includes('hero_model')) {
        return parsed;
      }
    }
  } catch (e) {
    // Fallback if sessionStorage is not accessible
  }

  // Shuffle and pick 4
  const shuffled = [...HERO_QUOTES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  try {
    sessionStorage.setItem('cc_session_hero_slides_v2', JSON.stringify(selected));
  } catch (e) {
    // Ignore storage errors
  }

  return selected;
}
