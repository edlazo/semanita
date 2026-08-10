import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, Mode, Theme } from '../theme';

/** Compras dejó de ser un paso: ahora es una pestaña. */
export type Step = 1 | 2;

const STEP_LABELS: Record<Step, string> = {
  1: 'Ingredientes',
  2: 'Menú',
};

type HeaderProps = {
  theme: Theme;
  mode: Mode;
  toggleMode: () => void;
  actionLabel?: string;
  onAction?: () => void;
  /** Ej. "12 días de prueba". Se omite en cuentas suscriptas. */
  planLabel?: string | null;
  onOpenProfile?: () => void;
  profileName?: string;
  profileEmail?: string;
};

export function Header({
  theme,
  mode,
  toggleMode,
  actionLabel,
  onAction,
  planLabel,
  onOpenProfile,
  profileName = '',
  profileEmail = '',
}: HeaderProps) {
  const styles = getStyles(theme);
  return (
    <View style={styles.header}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>Semanita</Text>
        {planLabel && <Text style={styles.planLabel}>{planLabel}</Text>}
      </View>
      <View style={styles.headerActions}>
        <Pressable onPress={toggleMode} hitSlop={10}>
          <Text style={styles.modeAction}>{mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}</Text>
        </Pressable>
        {actionLabel && onAction && (
          <Pressable onPress={onAction} hitSlop={10}>
            <Text style={styles.secondaryAction}>{actionLabel}</Text>
          </Pressable>
        )}
        {/* Solo el avatar: es el patrón que la gente ya reconoce para "mi cuenta". */}
        {onOpenProfile && (
          <Avatar
            theme={theme}
            name={profileName}
            email={profileEmail}
            onPress={onOpenProfile}
          />
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
  const steps: Step[] = [1, 2];

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

export type Tab = 'semana' | 'compras';

/**
 * Dos destinos y nada más. El perfil no es pestaña: darle el mismo peso que al
 * flujo de comida diría que la app hace dos cosas, y hace una.
 */
export function TabBar({
  theme,
  active,
  onChange,
}: {
  theme: Theme;
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const styles = getStyles(theme);
  const tabs: { key: Tab; label: string }[] = [
    { key: 'semana', label: 'Semana' },
    { key: 'compras', label: 'Compras' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={styles.tab}>
            {/* Sin riel ni subrayado: la distinción es color y peso. */}
            <Text style={[styles.tabLabel, on && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Iniciales de las dos primeras palabras del nombre. */
export function initialsFrom(name: string, fallback: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (words.length === 0) return fallback.slice(0, 2).toUpperCase();
  return words.map((w) => w[0]).join('').toUpperCase();
}

export function Avatar({
  theme,
  name,
  email,
  size = 36,
  onPress,
}: {
  theme: Theme;
  name: string;
  email: string;
  size?: number;
  onPress?: () => void;
}) {
  const styles = getStyles(theme);
  const label = initialsFrom(name, email);
  // border-box y centrado: cualquier padding vertical lo vuelve elíptico.
  const circle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
  ];
  const text = [styles.avatarText, { fontSize: size * 0.36 }];

  if (!onPress) {
    return (
      <View style={circle}>
        <Text style={text}>{label}</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} hitSlop={8} style={circle} accessibilityLabel="Abrir tu perfil">
      <Text style={text}>{label}</Text>
    </Pressable>
  );
}

type CtaBarProps = {
  theme: Theme;
  children: ReactNode;
};

export function CtaBar({ theme, children }: CtaBarProps) {
  const styles = getStyles(theme);
  return (
    // Degradado en vez de fondo sólido: el contenido pasa por debajo del CTA
    // desvaneciéndose, en lugar de cortarse contra un borde duro.
    <LinearGradient
      colors={[`${theme.bg}00`, theme.bg, theme.bg]}
      locations={[0, 0.38, 1]}
      style={styles.ctaBar}
    >
      {children}
    </LinearGradient>
  );
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
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      letterSpacing: -0.32,
      color: theme.ink,
    },
    planLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: theme.accent,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    modeAction: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.accent,
    },
    secondaryAction: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
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
      fontFamily: fonts.bodySemi,
      fontSize: 13,
      color: theme.ink,
    },
    stepNumberActive: {
      color: theme.accent,
    },
    stepLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: theme.ink,
    },
    stepLabelActive: {
      fontFamily: fonts.bodySemi,
    },
    tabBar: {
      flexDirection: 'row',
      height: 62,
      borderTopWidth: 1,
      borderTopColor: theme.line26,
      backgroundColor: theme.surface,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabLabel: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: theme.inkSoft,
    },
    tabLabelActive: {
      fontFamily: fonts.bodySemi,
      color: theme.accent,
    },
    avatar: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.line20,
      backgroundColor: theme.ph1,
    },
    avatarText: {
      fontFamily: fonts.bodySemi,
      color: theme.inkSoft,
    },
    ctaBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 14,
      paddingHorizontal: 26,
      paddingBottom: 26,
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
    // Encabezado de sección en caja baja: sin mayúsculas ni tracking abierto,
    // que es la firma visual que este rediseño quiere evitar.
    eyebrowText: {
      fontFamily: fonts.bodySemi,
      fontSize: 15,
      letterSpacing: -0.15,
      color: theme.ink,
    },
    eyebrowMeta: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: theme.inkSoft,
    },
  });
}
