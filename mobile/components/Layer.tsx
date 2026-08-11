import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cross } from './Icons';
import { Rise } from './Motion';
import { fonts, radii, Theme } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Línea de acento sobre el título: dice de qué parte de la app es la capa. */
  eyebrow: string;
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
  eyebrow,
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
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          {/* Cerrar la capa y entrar al perfil son acciones distintas: si el ✕
              reusa el handler de entrada, la capa se reabre sola. */}
          <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityLabel="Cerrar">
            <Cross color={theme.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* La bajada va con el contenido, no apretada contra el ✕. */}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {children}
        </ScrollView>

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
      paddingTop: 6,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
    },
    headerText: { flexShrink: 1 },
    eyebrow: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.accent,
      marginBottom: 10,
    },
    title: {
      fontFamily: fonts.displaySemi,
      fontSize: 30,
      lineHeight: 33,
      letterSpacing: -0.45,
      color: theme.ink,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 20,
      color: theme.inkSoft,
      marginBottom: 14,
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
    body: { paddingHorizontal: 26, paddingTop: 22, paddingBottom: 30 },
    // Sin filete: la capa entera es una sola hoja y el CTA no es una barra
    // aparte flotando sobre el contenido.
    footer: {
      paddingHorizontal: 26,
      paddingTop: 12,
      paddingBottom: 26,
      backgroundColor: theme.surface,
    },
  });
}
