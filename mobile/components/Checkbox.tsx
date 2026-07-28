import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radii, Theme } from '../theme';

type Props = {
  checked: boolean;
  /** Omit when a wrapping Pressable already handles the tap (avoids double-toggling on web, where clicks bubble). */
  onPress?: () => void;
  theme: Theme;
};

export default function Checkbox({ checked, onPress, theme }: Props) {
  const boxStyle = [
    styles.box,
    {
      borderRadius: radii.check,
      borderColor: checked ? theme.accent2 : theme.inkSoft,
      backgroundColor: checked ? theme.accent2 : 'transparent',
    },
  ];
  const mark = checked && <Text style={[styles.check, { color: theme.onAccent2 }]}>✓</Text>;

  if (!onPress) {
    return <View style={boxStyle}>{mark}</View>;
  }

  return (
    <Pressable onPress={onPress} hitSlop={8} style={boxStyle}>
      {mark}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
});
