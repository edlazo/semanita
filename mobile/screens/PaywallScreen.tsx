import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/Buttons';
import { CheckMark } from '../components/Glyphs';
import { fonts, Mode, Theme } from '../theme';

type Props = {
  theme: Theme;
  mode: Mode;
  toggleMode: () => void;
  onLogout: () => void;
  onSubscribe: () => void;
  subscribing: boolean;
  error: string | null;
};

const INCLUYE = [
  'Menú semanal con lo que ya tenés en casa',
  'Lista de compras agrupada por negocio',
  'Recetas paso a paso de cada comida',
  'Regenerar comidas sin ver anuncios',
];

export default function PaywallScreen(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>SEMANITA</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={props.toggleMode} hitSlop={10}>
            <Text style={styles.modeAction}>
              {props.mode === 'dark' ? 'MODO CLARO' : 'MODO OSCURO'}
            </Text>
          </Pressable>
          <Pressable onPress={props.onLogout} hitSlop={10}>
            <Text style={styles.secondaryAction}>SALIR</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.eyebrow}>SE TERMINÓ TU PRUEBA</Text>

        <Text style={styles.title}>
          Seguí comiendo{'\n'}bien toda la{'\n'}
          <Text style={styles.titleAccent}>semanita</Text>.
        </Text>

        <View style={styles.rule} />

        <Text style={styles.blurb}>
          Tu mes de prueba terminó. Suscribite y seguí armando la semana con lo que ya hay en tu
          heladera.
        </Text>

        <View style={styles.list}>
          {INCLUYE.map((item) => (
            <View key={item} style={styles.listRow}>
              <View style={styles.tick}>
                <CheckMark size={12} color={theme.accentInk} thickness={1.5} />
              </View>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {props.error && <Text style={styles.error}>{props.error}</Text>}

        <View style={styles.ctaWrap}>
          <PrimaryButton
            title="SUSCRIBIRME"
            onPress={props.onSubscribe}
            loading={props.subscribing}
            theme={theme}
          />
        </View>

        <Text style={styles.footer}>EMPORIO DE COMIDA CASERA</Text>
      </ScrollView>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg, paddingTop: 52 },
    header: {
      paddingHorizontal: 30,
      paddingBottom: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brand: {
      fontFamily: fonts.bodySemi,
      fontSize: 11,
      letterSpacing: 3.3,
      color: theme.ink,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    modeAction: {
      fontFamily: fonts.bodyMedium,
      fontSize: 10,
      letterSpacing: 1.4,
      color: theme.accent,
    },
    secondaryAction: {
      fontFamily: fonts.bodyMedium,
      fontSize: 10,
      letterSpacing: 1.4,
      color: theme.inkSoft,
    },
    body: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 30,
      paddingTop: 16,
      paddingBottom: 26,
    },
    eyebrow: {
      fontFamily: fonts.body,
      fontSize: 11,
      letterSpacing: 2.64,
      color: theme.accent,
      marginBottom: 14,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 34,
      lineHeight: 36,
      letterSpacing: -0.51,
      color: theme.ink,
    },
    titleAccent: { fontFamily: fonts.displayItalic, color: theme.accent },
    rule: {
      height: 1,
      backgroundColor: theme.line26,
      marginTop: 20,
      marginBottom: 6,
    },
    blurb: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 22,
      color: theme.inkSoft,
      maxWidth: 320,
      marginBottom: 20,
    },
    list: { gap: 10 },
    listRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tick: {
      width: 18,
      height: 18,
      flexShrink: 0,
      borderRadius: 999,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listText: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.ink,
      flexShrink: 1,
    },
    error: {
      marginTop: 16,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: theme.accent,
    },
    ctaWrap: { marginTop: 26 },
    footer: {
      marginTop: 30,
      textAlign: 'center',
      fontFamily: fonts.body,
      fontSize: 10,
      letterSpacing: 1.6,
      color: theme.mut75,
    },
  });
}
