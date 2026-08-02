import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, Mode, Theme } from '../theme';

export type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: 'INGREDIENTES',
  2: 'MENÚ',
  3: 'COMPRAS',
};

type HeaderProps = {
  theme: Theme;
  mode: Mode;
  toggleMode: () => void;
  actionLabel?: string;
  onAction?: () => void;
  /** Ej. "12 DÍAS DE PRUEBA". Se omite en cuentas suscriptas. */
  planLabel?: string | null;
  onOpenProfile?: () => void;
};

export function Header({
  theme,
  mode,
  toggleMode,
  actionLabel,
  onAction,
  planLabel,
  onOpenProfile,
}: HeaderProps) {
  const styles = getStyles(theme);
  return (
    <View style={styles.header}>
      {/* La marca es la entrada al perfil desde cualquier pantalla del flujo. */}
      <Pressable
        onPress={onOpenProfile}
        disabled={!onOpenProfile}
        hitSlop={8}
        style={styles.brandBlock}
        accessibilityLabel="Abrir tu perfil"
      >
        <Text style={styles.brand}>SEMANITA</Text>
        {planLabel && <Text style={styles.planLabel}>{planLabel}</Text>}
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable onPress={toggleMode} hitSlop={10}>
          <Text style={styles.modeAction}>{mode === 'dark' ? 'MODO CLARO' : 'MODO OSCURO'}</Text>
        </Pressable>
        {actionLabel && onAction && (
          <Pressable onPress={onAction} hitSlop={10}>
            <Text style={styles.secondaryAction}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

type StepIndicatorProps = {
  theme: Theme;
  current: Step;
  /**
   * Pasos con datos ya cargados. Incluye los de adelante: si el menú ya está
   * generado, volver a Ingredientes no puede obligar a regenerarlo para seguir.
   */
  enabled: Step[];
  onGoTo: (step: Step) => void;
};

export function StepIndicator({ theme, current, enabled, onGoTo }: StepIndicatorProps) {
  const styles = getStyles(theme);
  const steps: Step[] = [1, 2, 3];

  return (
    <View style={styles.steps}>
      {steps.map((step, i) => {
        const active = step === current;
        const reachable = !active && enabled.includes(step);
        return (
          <View key={step} style={styles.stepGroup}>
            {i > 0 && <View style={styles.stepLine} />}
            <Pressable
              onPress={reachable ? () => onGoTo(step) : undefined}
              disabled={!reachable}
              hitSlop={8}
              style={[
                styles.step,
                !active && (reachable ? styles.stepReachable : styles.stepInactive),
              ]}
            >
              <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{step}</Text>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                {STEP_LABELS[step]}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

type CtaBarProps = {
  theme: Theme;
  children: ReactNode;
};

export function CtaBar({ theme, children }: CtaBarProps) {
  const styles = getStyles(theme);
  return <View style={styles.ctaBar}>{children}</View>;
}

/** Etiqueta de sección: mayúsculas, tracking abierto, con línea inferior opcional. */
export function Eyebrow({
  theme,
  children,
  meta,
  rule,
}: {
  theme: Theme;
  children: string;
  meta?: string;
  rule?: 'soft' | 'accent';
}) {
  const styles = getStyles(theme);
  return (
    <View
      style={[
        styles.eyebrowRow,
        rule === 'soft' && styles.eyebrowRuleSoft,
        rule === 'accent' && styles.eyebrowRuleAccent,
      ]}
    >
      <Text style={styles.eyebrowText}>{children}</Text>
      {meta && <Text style={styles.eyebrowMeta}>{meta}</Text>}
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 10,
    },
    brandBlock: {
      flexShrink: 1,
      gap: 3,
    },
    brand: {
      fontFamily: fonts.bodySemi,
      fontSize: 11,
      letterSpacing: 3.3,
      color: theme.ink,
    },
    planLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 8.5,
      letterSpacing: 1.36,
      color: theme.accent,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
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
    steps: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.line26,
    },
    stepGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 1,
    },
    stepLine: {
      width: 16,
      height: 1,
      backgroundColor: theme.line26,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    stepInactive: {
      opacity: 0.4,
    },
    // Un paso navegable se distingue del que todavía no tiene datos.
    stepReachable: {
      opacity: 0.75,
    },
    stepNumber: {
      fontFamily: fonts.display,
      fontSize: 13,
      color: theme.ink,
    },
    stepNumberActive: {
      color: theme.accent,
    },
    stepLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 9.5,
      letterSpacing: 1.52,
      color: theme.ink,
    },
    stepLabelActive: {
      fontFamily: fonts.bodySemi,
    },
    ctaBar: {
      paddingTop: 14,
      paddingHorizontal: 26,
      paddingBottom: 26,
      backgroundColor: theme.bg,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingBottom: 6,
      marginBottom: 10,
    },
    eyebrowRuleSoft: {
      borderBottomWidth: 1,
      borderBottomColor: theme.line26,
    },
    eyebrowRuleAccent: {
      borderBottomWidth: 1,
      borderBottomColor: theme.accent,
    },
    eyebrowText: {
      fontFamily: fonts.bodySemi,
      fontSize: 9.5,
      letterSpacing: 2.09,
      color: theme.accent,
    },
    eyebrowMeta: {
      fontFamily: fonts.displayItalic,
      fontSize: 12,
      color: theme.accent,
    },
  });
}
