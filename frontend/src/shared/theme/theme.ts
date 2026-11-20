import { useColorScheme } from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    onPrimary: string;
    success: string;
    warning: string;
    danger: string;
    disabled: string;
  };
  spacing: (n: number) => number;
  radius: number;
  minTapSize: number;
}

const base = { spacing: (n: number) => n * 8, radius: 12, minTapSize: 44 };

export const lightTheme: Theme = {
  ...base,
  dark: false,
  colors: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    text: '#111827',
    textMuted: '#5B6472',
    border: '#D9DDE3',
    primary: '#0B5FFF',
    onPrimary: '#FFFFFF',
    success: '#137A3C',
    warning: '#9A5B00',
    danger: '#B42318',
    disabled: '#9AA1AC',
  },
};

export const darkTheme: Theme = {
  ...base,
  dark: true,
  colors: {
    background: '#0E1116',
    surface: '#171B22',
    text: '#F3F4F6',
    textMuted: '#A3AAB5',
    border: '#2B313B',
    primary: '#5B8CFF',
    onPrimary: '#0E1116',
    success: '#4CC07A',
    warning: '#E0A43B',
    danger: '#F07067',
    disabled: '#5D6470',
  },
};

/** All screens take colors from here so dark mode works everywhere. */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
