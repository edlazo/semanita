import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CrossMark } from './Glyphs';
import { Rise } from './Motion';
import { fonts, radii, Theme } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Barra fija al pie, para las capas que la necesitan. */
  footer?: ReactNode;
  theme: Theme;
};

/**
 * Marco compartido de Receta, Datos personales, Planes y País: fondo `card`
 * para que se lea como ficha aparte, ✕ circular y entrada con `rise`.
 */
export default function Layer({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  theme,
}: Props) {
  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <Rise style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {/* Cerrar la capa y entrar al perfil son acciones distintas: si el ✕
              reusa el handler de entrada, la capa se reabre sola. */}
          <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityLabel="Cerrar">
            <CrossMark size={13} color={theme.ink} thickness={1.5} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>

        {footer && <View style={styles.footer}>{footer}</View>}
      </Rise>
    </Modal>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    sheet: { flex: 1, backgroundColor: theme.surface, paddingTop: 56 },
    header: {
      paddingHorizontal: 26,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
    },
    headerText: { flexShrink: 1 },
    title: {
      fontFamily: fonts.displaySemi,
      fontSize: 30,
      lineHeight: 33,
      letterSpacing: -0.45,
      color: theme.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.inkSoft,
      marginTop: 8,
    },
    close: {
      width: 36,
      height: 36,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radii.chip,
    },
    body: { paddingHorizontal: 26, paddingTop: 24, paddingBottom: 30 },
    footer: {
      paddingHorizontal: 26,
      paddingTop: 14,
      paddingBottom: 26,
      borderTopWidth: 1,
      borderTopColor: theme.line20,
      backgroundColor: theme.surface,
    },
  });
}
