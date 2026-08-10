import { Pressable, StyleSheet, Text, View } from 'react-native';
import Layer from '../components/Layer';
import { CheckMark } from '../components/Glyphs';
import { COUNTRIES } from '../lib/plans';
import { fonts, radii, Theme } from '../theme';

type Props = {
  visible: boolean;
  /** Vuelve al lugar del que se entró, no siempre al mismo. */
  onClose: () => void;
  selected: string;
  onSelect: (code: string) => void;
  theme: Theme;
};

export default function CountryLayer(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  return (
    <Layer
      visible={props.visible}
      onClose={props.onClose}
      title="¿Dónde vivís?"
      subtitle="Los planes están en dólares. Elegí tu país y te decimos en qué moneda se cobra."
      theme={theme}
    >
      {COUNTRIES.map((c) => {
        const on = c.code === props.selected;
        return (
          <Pressable
            key={c.code}
            onPress={() => props.onSelect(c.code)}
            style={[
              styles.row,
              on
                ? { borderColor: theme.accent, backgroundColor: theme.line14 }
                : { borderColor: theme.line20 },
            ]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.name, on && styles.nameOn]}>{c.name}</Text>
              <Text style={styles.currency}>
                {c.currency} · {c.symbol}
              </Text>
            </View>
            {on && <CheckMark size={14} color={theme.accent} thickness={2} />}
          </Pressable>
        );
      })}
    </Layer>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderWidth: 1,
      borderRadius: radii.card,
      paddingVertical: 13,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    rowText: { flexShrink: 1 },
    name: { fontFamily: fonts.body, fontSize: 15, color: theme.ink },
    nameOn: { fontFamily: fonts.bodySemi, color: theme.accent },
    currency: {
      fontFamily: fonts.body,
      fontSize: 12.5,
      color: theme.inkSoft,
      marginTop: 2,
    },
  });
}
