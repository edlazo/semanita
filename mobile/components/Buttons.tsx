import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radii, Theme } from '../theme';

type PrimaryProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Texto en Bodoni itálica alineado a la derecha, ej. "12 ítems". */
  meta?: string;
  theme: Theme;
};

export function PrimaryButton({ title, onPress, disabled, loading, meta, theme }: PrimaryProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        meta ? styles.primaryWithMeta : styles.primaryCentered,
        {
          backgroundColor: theme.accent,
          borderRadius: radii.btn,
          opacity: disabled ? 0.55 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.primaryInner}>
        {loading && <ActivityIndicator size="small" color={theme.accentInk} />}
        <Text style={[styles.primaryText, { color: theme.accentInk }]}>{title}</Text>
      </View>
      {meta && <Text style={[styles.meta, { color: theme.accentInk }]}>{meta}</Text>}
    </Pressable>
  );
}

type SecondaryProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  theme: Theme;
};

export function SecondaryButton({ title, onPress, disabled, theme }: SecondaryProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondary,
        {
          borderColor: theme.border,
          borderRadius: radii.btn,
          opacity: disabled ? 0.55 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.secondaryText, { color: theme.ink }]}>{title}</Text>
    </Pressable>
  );
}

/** Variante rellena y compacta, para acciones dentro de un bloque de estado. */
export function AccentChipButton({ title, onPress, theme }: SecondaryProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chipBtn,
        { backgroundColor: theme.accent, borderRadius: radii.btn, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.chipBtnText, { color: theme.accentInk }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryCentered: { justifyContent: 'center' },
  primaryWithMeta: { justifyContent: 'space-between' },
  primaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 2.07,
  },
  meta: {
    fontFamily: fonts.displayItalic,
    fontSize: 12,
  },
  secondary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  secondaryText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  chipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
  },
});
