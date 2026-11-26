/**
 * Glacier Crest brand configuration: the single source of truth for default branding.
 * Values come from docs/brand/Glacier Crest - Brandbook.pdf. No tagline is specified there.
 *
 * Used by the app (BrandingContext, components), tailwind.config.js and vite.config.ts,
 * so keep this file dependency-free (plain data + pure functions).
 * An MSB's own branding (colours/logo from the backend) still overrides these defaults at runtime.
 */

export const brand = {
  name: 'Glacier Crest',
  shortName: 'Glacier Crest',

  colors: {
    // Primary palette
    royalBlue: '#3049BB',
    slateCharcoal: '#414747',
    deepBlack: '#191919',
    white: '#FFFFFF',
    // Secondary palette (supporting accents, use selectively)
    warmStone: '#D3D0C7',
    periwinkleBlue: '#6E85DB',
    vividRed: '#FF4040',
    softIceBlue: '#D9E2FF',
  },

  /** Default theme roles (BrandingConfig primary / secondary / accent). */
  theme: {
    primary: '#3049BB', // Royal Blue
    secondary: '#414747', // Slate Charcoal
    accent: '#6E85DB', // Periwinkle Blue
    mode: 'light' as const,
  },

  fonts: {
    /** Brandbook: Archivo Expanded Regular = Google Fonts "Archivo" at width 125%. */
    heading: ['"Archivo Expanded"', 'Archivo', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
    headingStretch: '125%',
    /** Brandbook: Helvetica Neue Regular (licensed, not bundled; system fallbacks). */
    body: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
  },

  /**
   * Official logo files (public/brand/), copied from "public/brand/Logo Files/SVG".
   * Only the viewBox was cropped to the artwork plus clear space; the artwork is unchanged.
   * No Horizontal lockup was supplied in the logo pack.
   */
  logos: {
    // Symbol
    symbol: '/brand/glacier-crest-symbol.svg', // 05, Royal Blue: light backgrounds
    symbolCharcoal: '/brand/glacier-crest-symbol-charcoal.svg', // 06: light backgrounds
    symbolWhite: '/brand/glacier-crest-symbol-white.svg', // 07: dark backgrounds
    // Wordmark
    wordmark: '/brand/glacier-crest-wordmark-charcoal.svg', // 08: light backgrounds
    wordmarkBlue: '/brand/glacier-crest-wordmark-blue.svg', // 09: light backgrounds
    wordmarkWhite: '/brand/glacier-crest-wordmark-white.svg', // 10: dark backgrounds
    // Vertical (symbol above wordmark)
    vertical: '/brand/glacier-crest-vertical.svg', // 01, full colour: light backgrounds
    verticalCharcoal: '/brand/glacier-crest-vertical-charcoal.svg', // 02: light backgrounds
    verticalBlue: '/brand/glacier-crest-vertical-blue.svg', // 03: light backgrounds
    verticalWhite: '/brand/glacier-crest-vertical-white.svg', // 04: dark backgrounds
  },

  favicon: '/favicon.svg',
  appleTouchIcon: '/apple-touch-icon.png',
} as const;

export const SHADE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ShadeKey = (typeof SHADE_KEYS)[number];

// Fraction mixed with white (positive) or black (negative) per shade; 500 is the colour itself.
const SHADE_MIX: Record<ShadeKey, number> = {
  50: 0.92, 100: 0.84, 200: 0.68, 300: 0.5, 400: 0.25, 500: 0,
  600: -0.15, 700: -0.3, 800: -0.45, 900: -0.6, 950: -0.75,
};

/** A 50–950 shade scale for a hex colour (tints toward white, shades toward black). */
export function colorShades(hex: string): Record<ShadeKey, string> {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  const rgb = Number.isNaN(num) || full.length !== 6 ? [0, 0, 0] : [num >> 16, (num >> 8) & 255, num & 255];
  const out = {} as Record<ShadeKey, string>;
  for (const key of SHADE_KEYS) {
    const m = SHADE_MIX[key];
    const target = m >= 0 ? 255 : 0;
    const w = Math.abs(m);
    out[key] = '#' + rgb.map((c) => Math.round(c + (target - c) * w).toString(16).padStart(2, '0')).join('');
  }
  return out;
}
