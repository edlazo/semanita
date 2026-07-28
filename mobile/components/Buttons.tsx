import { Pressable, StyleSheet, Text } from 'react-native';
import { radii, Theme } from '../theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  theme: Theme;
};

export function PrimaryButton({ title, onPress, disabled, theme }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: theme.accent,
          borderRadius: radii.btn,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.primaryText,
          { color: theme.accentInk, fontFamily: theme.fontBody },
        ]}
      >
        {title.toUpperCase()}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, disabled, theme }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondary,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          borderRadius: radii.btn,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.secondaryText, { color: theme.ink, fontFamily: theme.fontBody }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  secondary: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  secondaryText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
});
