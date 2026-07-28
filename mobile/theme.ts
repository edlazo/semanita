import { useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

export type Theme = {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentInk: string;
  accentText: string;
  accent2: string;
  onAccent2: string;
  border: string;
  chipBg: string;
  fontDisplay: string;
  fontBody: string;
};

const fontDisplay = Platform.select({
  ios: 'Didot',
  android: 'serif',
  default: 'Georgia, "Times New Roman", serif',
}) as string;

const fontBody = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: '-apple-system, "Helvetica Neue", Arial, sans-serif',
}) as string;

export const radii = { card: 12, btn: 4, chip: 999, check: 3 };

export const lightTheme: Theme = {
  bg: '#F7F1E4',
  surface: '#FFFEF9',
  ink: '#211A11',
  inkSoft: '#6B5D45',
  accent: '#A9812E',
  accentInk: '#1B140A',
  accentText: '#8C6A1F',
  accent2: '#8C2C34',
  onAccent2: '#F7F1E4',
  border: 'rgba(169,129,46,0.28)',
  chipBg: 'rgba(169,129,46,0.08)',
  fontDisplay,
  fontBody,
};

export const darkTheme: Theme = {
  bg: '#16241B',
  surface: '#1E3024',
  ink: '#F4ECDA',
  inkSoft: '#B4A98F',
  accent: '#C9A227',
  accentInk: '#1B140A',
  accentText: '#C9A227',
  accent2: '#9C2E37',
  onAccent2: '#F7F1E4',
  border: 'rgba(201,162,39,0.32)',
  chipBg: 'rgba(201,162,39,0.10)',
  fontDisplay,
  fontBody,
};

export type Mode = 'light' | 'dark';

export function useAppTheme(): { theme: Theme; mode: Mode; toggleMode: () => void } {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<Mode | null>(null);
  const mode: Mode = override ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  function toggleMode() {
    setOverride(mode === 'dark' ? 'light' : 'dark');
  }

  return { theme, mode, toggleMode };
}
