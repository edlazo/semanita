import { useState } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentInk: string;
  border: string;
  line14: string;
  line20: string;
  line26: string;
  mut40: string;
  mut60: string;
  mut75: string;
  ph1: string;
  ph2: string;
  chipBg: string;
};

/**
 * En React Native los pesos de una fuente cargada por archivo son familias
 * distintas: `fontWeight` no las selecciona. Se referencian por nombre.
 */
export const fonts = {
  display: 'BodoniModa_400Regular',
  displayMedium: 'BodoniModa_500Medium',
  displayItalic: 'BodoniModa_400Regular_Italic',
  body: 'Karla_400Regular',
  bodyMedium: 'Karla_500Medium',
  bodySemi: 'Karla_600SemiBold',
  bodyBold: 'Karla_700Bold',
} as const;

export const radii = { card: 8, btn: 3, chip: 999, check: 2, photo: 6, field: 4 };

export const lightTheme: Theme = {
  bg: '#F4EEE6',
  surface: '#FFFBF5',
  ink: '#211C18',
  inkSoft: '#6B5D52',
  accent: '#A9552C',
  accentInk: '#FBF3EC',
  border: 'rgba(169,85,44,0.40)',
  line14: 'rgba(169,85,44,0.14)',
  line20: 'rgba(169,85,44,0.20)',
  line26: 'rgba(169,85,44,0.26)',
  mut40: 'rgba(107,93,82,0.40)',
  mut60: 'rgba(107,93,82,0.60)',
  mut75: 'rgba(107,93,82,0.75)',
  ph1: '#E6DCCF',
  ph2: '#DCCFC0',
  chipBg: '#FFFBF5',
};

export const darkTheme: Theme = {
  bg: '#1B1816',
  surface: '#241F1C',
  ink: '#F1E8DE',
  inkSoft: '#ABA096',
  accent: '#D9834A',
  accentInk: '#1B1816',
  border: 'rgba(217,131,74,0.40)',
  line14: 'rgba(217,131,74,0.14)',
  line20: 'rgba(217,131,74,0.20)',
  line26: 'rgba(217,131,74,0.26)',
  mut40: 'rgba(171,160,150,0.40)',
  mut60: 'rgba(171,160,150,0.60)',
  mut75: 'rgba(171,160,150,0.75)',
  ph1: '#2C2622',
  ph2: '#221D1A',
  chipBg: '#241F1C',
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
