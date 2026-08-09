import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { fonts, radii, Theme } from '../theme';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onWatch: () => void;
  onSubscribe: () => void;
  loading: boolean;
  mealName: string;
  theme: Theme;
};

/**
 * Solo lo ven las cuentas sin suscripción: con membresía, regenerar es directo.
 */
export default function AdGateModal(props: Props) {
  const { theme } = props;
  const styles = getStyles(theme);

  return (
    <Modal visible={props.visible} animationType="fade" transparent onRequestClose={props.onCancel}>
      <Pressable style={styles.backdrop} onPress={props.onCancel}>
        {/* Frena el toque para que tocar la tarjeta no cierre el diálogo. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.eyebrow}>REGENERAR COMIDA</Text>
          <Text style={styles.title}>Mirá un anuncio y te cambiamos el plato</Text>
          <Text style={styles.body}>
            Vas a cambiar “{props.mealName}” por otra comida con los mismos ingredientes. Con la
            suscripción de Semanita regenerás sin anuncios.
          </Text>

          <View style={styles.actions}>
            <PrimaryButton
              title="VER ANUNCIO Y REGENERAR"
              onPress={props.onWatch}
              loading={props.loading}
              theme={theme}
            />
            <View style={styles.secondaryRow}>
              <SecondaryButton title="SUSCRIBIRME" onPress={props.onSubscribe} theme={theme} />
              <SecondaryButton title="CANCELAR" onPress={props.onCancel} theme={theme} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 26,
    },
    card: {
      alignSelf: 'stretch',
      backgroundColor: theme.surface,
      borderRadius: radii.card,
      borderTopWidth: 2,
      borderTopColor: theme.accent,
      padding: 20,
    },
    eyebrow: {
      fontFamily: fonts.bodySemi,
      fontSize: 9.5,
      letterSpacing: 2.09,
      color: theme.accent,
      marginBottom: 10,
    },
    title: {
      fontFamily: fonts.displaySemi,
      fontSize: 22,
      lineHeight: 26,
      letterSpacing: -0.33,
      color: theme.ink,
      marginBottom: 8,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 21,
      color: theme.inkSoft,
    },
    actions: { marginTop: 20, gap: 10 },
    secondaryRow: { flexDirection: 'row', gap: 8 },
  });
}
