import { Platform, TextStyle } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceRaised: string;
    text: string;
    textMuted: string;
    textFaint: string;
    border: string;
    borderStrong: string;
    primary: string;
    primaryBright: string;
    onPrimary: string;
    success: string;
    warning: string;
    danger: string;
    disabled: string;
    overlay: string;
    cardFace: string;
  };
  spacing: (n: number) => number;
  radius: number;
  radiusSm: number;
  radiusLg: number;
  minTapSize: number;
  type: {
    display: TextStyle;
    title: TextStyle;
    heading: TextStyle;
    body: TextStyle;
    caption: TextStyle;
    overline: TextStyle;
    code: TextStyle;
  };
}

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined });

/**
 * The Bonus Club brand theme: near-black surfaces with champagne-gold accents.
 * The brand is dark by design, so every screen uses this theme regardless of the system setting;
 * all colors still come from here, never from individual screens.
 */
export const brandTheme: Theme = {
  dark: true,
  colors: {
    background: '#0A0A0C',
    surface: '#141417',
    surfaceRaised: '#1C1C21',
    text: '#F4EFE6',
    textMuted: '#A39E94',
    textFaint: '#6E6A63',
    border: '#26262C',
    borderStrong: '#3A3832',
    primary: '#D4AF6A',
    primaryBright: '#EBCB8B',
    onPrimary: '#16130D',
    success: '#5FC891',
    warning: '#E7AE5A',
    danger: '#EF7470',
    disabled: '#4A4842',
    overlay: 'rgba(0,0,0,0.72)',
    cardFace: '#121110',
  },
  spacing: (n: number) => n * 8,
  radius: 16,
  radiusSm: 10,
  radiusLg: 24,
  minTapSize: 44,
  type: {
    display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
    title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
    heading: { fontSize: 18, fontWeight: '700' },
    body: { fontSize: 15, lineHeight: 22 },
    caption: { fontSize: 13, lineHeight: 18 },
    overline: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
    code: { fontFamily: mono, fontWeight: '700', letterSpacing: 3 },
  },
};

export function useTheme(): Theme {
  return brandTheme;
}

/** `#RRGGBB` plus an opacity (0–1) as `#RRGGBBAA`, for tinted backgrounds. */
export function withAlpha(hex: string, opacity: number): string {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}
